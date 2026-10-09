"""
crud/appointment.py
--------------------
Database operations for Appointments. Slightly more involved than Patient/Doctor
because appointments link to both a patient_id and a doctor_id.
"""

from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from app.models.patient import Patient
from app.models.doctor import Doctor
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from app.booking import validate_slot


def get_appointment(db: Session, appointment_id: int):
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()


def get_appointments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Appointment).offset(skip).limit(limit).all()


def get_appointments_by_patient(db: Session, patient_id: int):
    """Helper: get all appointments for a specific patient (useful for patient dashboard)."""
    return db.query(Appointment).filter(Appointment.patient_id == patient_id).all()


def get_appointments_by_doctor(db: Session, doctor_id: int):
    """Helper: get all appointments for a specific doctor (useful for doctor dashboard)."""
    return db.query(Appointment).filter(Appointment.doctor_id == doctor_id).all()


def create_appointment(db: Session, appointment: AppointmentCreate):
    if not db.get(Patient, appointment.patient_id) or not db.get(Doctor, appointment.doctor_id):
        raise HTTPException(404, 'Patient or doctor not found')
    appointment.appointment_time = validate_slot(db, appointment.doctor_id, appointment.appointment_time)
    db_appointment = Appointment(**appointment.model_dump())
    db.add(db_appointment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'The selected slot is no longer available.')
    db.refresh(db_appointment)
    return db_appointment


def update_appointment(db: Session, appointment_id: int, appointment_update: AppointmentUpdate):
    """
    Used for rescheduling (change appointment_time), cancelling (change status),
    or adding notes.
    """
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None

    update_data = appointment_update.model_dump(exclude_unset=True)
    if update_data.get('status', db_appointment.status) != 'Cancelled':
        when = update_data.get('appointment_time', db_appointment.appointment_time)
        if 'appointment_time' in update_data or (db_appointment.status == 'Cancelled' and 'status' in update_data):
            update_data['appointment_time'] = validate_slot(db, db_appointment.doctor_id, when, appointment_id)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'The selected slot is no longer available.')
    db.refresh(db_appointment)
    return db_appointment


def delete_appointment(db: Session, appointment_id: int):
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    from app.models.voice import BookingReceipt
    if db.query(BookingReceipt).filter_by(appointment_id=appointment_id).first():
        raise HTTPException(409, 'Voice bookings must be cancelled so retry receipts remain intact.')
    db.delete(db_appointment)
    db.commit()
    return db_appointment
