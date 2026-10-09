"""One atomic booking operation for web, Twilio and Vapi callers."""
import hashlib
import json
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.voice import BookingReceipt


def now_local():
    return datetime.now(ZoneInfo(os.getenv('HOSPITAL_TIMEZONE', 'Asia/Kolkata'))).replace(tzinfo=None)


def normalize_time(value):
    if value.tzinfo:
        return value.astimezone(ZoneInfo(os.getenv('HOSPITAL_TIMEZONE', 'Asia/Kolkata'))).replace(tzinfo=None)
    return value


def validate_slot(db, doctor_id, value, exclude_id=None):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(404, 'Doctor not found')
    if (doctor.availability or '').lower() in ('off duty', 'on leave', 'unavailable'):
        raise HTTPException(422, 'That doctor is unavailable. Please choose another doctor.')
    value = normalize_time(value)
    if value <= now_local():
        raise HTTPException(422, 'Choose a future appointment time.')
    if value.minute not in (0, 30) or value.second or value.microsecond:
        raise HTTPException(422, 'Appointments use 30-minute slots.')
    opening = int(os.getenv('BOOKING_OPEN_HOUR', '9'))
    closing = int(os.getenv('BOOKING_CLOSE_HOUR', '17'))
    if not opening <= value.hour < closing:
        raise HTTPException(422, f'Please choose a time between {opening}:00 and {closing}:00.')
    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_time == value,
        Appointment.status != 'Cancelled',
    )
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)
    if query.first():
        raise HTTPException(409, 'That doctor is already booked at that time. Please choose another slot.')
    return value


def clean_name(value):
    return re.sub(r'[^a-z0-9 ]', '', re.sub(r'\bdr\.?\s*', '', value.lower())).strip()


def match_doctor(db, name):
    target = clean_name(name)
    doctors = db.query(Doctor).order_by(Doctor.id).all()
    exact = [d for d in doctors if target and target in (clean_name(d.name), clean_name(d.department))]
    matches = exact or [d for d in doctors if target and (target in clean_name(d.name) or target in clean_name(d.department))]
    if len(matches) != 1:
        choices = ', '.join(d.name for d in matches[:5] or doctors[:5])
        raise HTTPException(422, f'Please specify one doctor by name. Available doctors: {choices or "none registered yet"}.')
    if (matches[0].availability or '').lower() in ('off duty', 'on leave', 'unavailable'):
        raise HTTPException(422, 'That doctor is unavailable. Please choose another doctor.')
    return matches[0]


class BookingRequest(BaseModel):
    patient_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=r'^\+[1-9]\d{7,14}$')
    email: EmailStr | None = None
    doctor: str = Field(min_length=2, max_length=100)
    appointment_time: datetime
    notes: str | None = Field(default=None, max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=200)
    confirmed: bool


def book(db, payload):
    if not payload.confirmed:
        raise HTTPException(422, 'Patient confirmation is required before booking.')
    fingerprint = hashlib.sha256(json.dumps(payload.model_dump(mode='json', exclude={'idempotency_key'}), sort_keys=True).encode()).hexdigest()
    if db.bind.dialect.name == 'sqlite':
        if not db.connection().connection.driver_connection.in_transaction:
            db.execute(text('BEGIN IMMEDIATE'))
    elif db.bind.dialect.name == 'postgresql':
        lock_key = int.from_bytes(hashlib.sha256(payload.idempotency_key.encode()).digest()[:8], 'big', signed=True)
        db.execute(text('SELECT pg_advisory_xact_lock(:key)'), {'key': lock_key})
    receipt = db.get(BookingReceipt, payload.idempotency_key)
    if receipt:
        if receipt.fingerprint != fingerprint:
            raise HTTPException(409, 'This booking key was already used for different details.')
        appointment = db.get(Appointment, receipt.appointment_id)
        if appointment.status == 'Cancelled':
            raise HTTPException(409, 'This appointment has been cancelled. Start a new booking to reschedule.')
        return appointment
    doctor = match_doctor(db, payload.doctor)
    when = validate_slot(db, doctor.id, payload.appointment_time)
    candidates = db.query(Patient).filter(Patient.phone == payload.phone).all()
    patient = next((p for p in candidates if clean_name(p.name) == clean_name(payload.patient_name)), None)
    if payload.email:
        by_email = db.query(Patient).filter(Patient.email == str(payload.email)).first()
        if by_email and (clean_name(by_email.name) != clean_name(payload.patient_name) or by_email.phone != payload.phone):
            raise HTTPException(409, 'That email belongs to a different patient. Please verify the details.')
        patient = by_email or patient
    try:
        if not patient:
            identity = hashlib.sha256(f'{payload.phone}:{clean_name(payload.patient_name)}'.encode()).hexdigest()[:24]
            patient = Patient(name=payload.patient_name.strip(), phone=payload.phone,
                              email=str(payload.email) if payload.email else f'voice-{identity}@patients.example.com')
            db.add(patient)
            db.flush()
        appointment = Appointment(patient_id=patient.id, doctor_id=doctor.id,
                                  appointment_time=when, status='Scheduled', notes=payload.notes)
        db.add(appointment)
        db.flush()
        db.add(BookingReceipt(key=payload.idempotency_key, fingerprint=fingerprint, appointment_id=appointment.id))
        db.commit()
        db.refresh(appointment)
        return appointment
    except IntegrityError:
        db.rollback()
        receipt = db.get(BookingReceipt, payload.idempotency_key)
        if receipt and receipt.fingerprint == fingerprint:
            return db.get(Appointment, receipt.appointment_id)
        raise HTTPException(409, 'The slot or patient record changed during booking. Please retry with verified details.')
