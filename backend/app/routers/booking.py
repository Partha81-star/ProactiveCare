"""Shared booking API and a persistent, model-independent receptionist."""
import os
import re
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.booking import BookingRequest, book, match_doctor, now_local, validate_slot
from app.models.voice import VoiceSession
from app.models.doctor import Doctor
from app.schemas.appointment import AppointmentOut
from app.websocket import manager


def service_auth(x_service_token: str = Header(default='')):
    token = os.getenv('SERVICE_TOKEN', '')
    if token and not secrets.compare_digest(token, x_service_token):
        raise HTTPException(401, 'Invalid service token')
    if not token and os.getenv('APP_ENV') == 'production':
        raise HTTPException(503, 'SERVICE_TOKEN must be configured')


router = APIRouter(tags=['Booking'])


from app.routers.auth import _get_current_user


@router.post('/bookings/web', response_model=AppointmentOut, dependencies=[Depends(_get_current_user)])
async def web_booking(payload: BookingRequest, db: Session = Depends(get_db)):
    appointment = book(db, payload)
    await manager.broadcast({'event': 'refresh_appointments'})
    return appointment


@router.post('/bookings', response_model=AppointmentOut, dependencies=[Depends(service_auth)])
async def create_booking(payload: BookingRequest, db: Session = Depends(get_db)):
    appointment = book(db, payload)
    await manager.broadcast({'event': 'refresh_appointments'})
    return appointment


def parse_date(value):
    value = value.lower().strip().rstrip('.')
    today = now_local().date()
    for word, days in [('day after tomorrow', 2), ('tomorrow', 1), ('today', 0)]:
        if word in value:
            return today + timedelta(days=days)
    match = re.search(r'\b\d{4}-\d{2}-\d{2}\b', value)
    if match:
        return datetime.strptime(match[0], '%Y-%m-%d').date()
    value = re.sub(r'(\d)(st|nd|rd|th)\b', r'\1', value)
    for fmt in ['%d %B %Y', '%B %d %Y', '%d %B', '%B %d', '%d %b', '%b %d']:
        try:
            result = datetime.strptime(value, fmt).date()
            if '%Y' not in fmt:
                result = result.replace(year=today.year)
                if result < today:
                    result = result.replace(year=today.year + 1)
            return result
        except ValueError:
            continue
    raise ValueError('Please say a date such as tomorrow, 20 October, or 2026-10-20.')


def parse_time(value):
    value = value.lower().replace('.', '').strip()
    value = re.sub(r'^(at|around)\s+', '', value)
    value = re.sub(r'\s+', '', value)
    for fmt in ['%I:%M%p', '%I%p', '%H:%M']:
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise ValueError('Please say a time including AM or PM, for example 10:30 AM.')


class Turn(BaseModel):
    session_id: str = Field(min_length=8, max_length=180)
    phone: str = Field(pattern=r'^\+[1-9]\d{7,14}$')
    text: str = Field(default='', max_length=1500)
    step: int = Field(default=0, ge=0)


PROMPTS = {
    'patient_name': 'What is the patient\'s full name?',
    'doctor': 'Which doctor or department would you like?',
    'date': 'What date would you prefer? You can say tomorrow or a calendar date.',
    'time': 'What time would you prefer? Please include AM or PM.',
}


@router.post('/voice/turn', dependencies=[Depends(service_auth)])
async def voice_turn(payload: Turn, db: Session = Depends(get_db)):
    # Serialize concurrent turns on SQLite; PostgreSQL locks only the session row.
    if db.bind.dialect.name == 'sqlite':
        db.execute(text('BEGIN IMMEDIATE'))
    if payload.step == 0:
        from sqlalchemy.dialects import sqlite, postgresql
        insert = sqlite.insert if db.bind.dialect.name == 'sqlite' else postgresql.insert
        db.execute(insert(VoiceSession).values(id=payload.session_id, phone=payload.phone, data={}, step=0,
                                              updated_at=datetime.utcnow()).on_conflict_do_nothing(index_elements=['id']))
    session = db.query(VoiceSession).filter_by(id=payload.session_id).with_for_update().first()
    if not session:
        if payload.step != 0:
            raise HTTPException(409, 'Call session expired. Please start a new call.')
        session = VoiceSession(id=payload.session_id, phone=payload.phone, data={}, step=0)
        db.add(session)
        db.flush()
    if session.phone != payload.phone:
        raise HTTPException(409, 'Caller does not match this session.')
    if payload.step < session.step:
        return session.response
    if payload.step > session.step:
        raise HTTPException(409, 'Out-of-order conversation turn.')
    if session.data.get('ended'):
        return session.response
    if datetime.utcnow() - session.updated_at > timedelta(hours=2):
        raise HTTPException(409, 'Call session expired. Please start a new call.')
    data = dict(session.data)
    reply = None
    appointment_id = data.get('appointment_id')
    ended = bool(appointment_id)
    speech = payload.text.strip()
    awaiting = data.get('awaiting')
    if appointment_id:
        reply = f'Your appointment reference is {appointment_id}. Thank you for calling.'
    elif re.search(r'\b(emergency|chest pain|cannot breathe|can.t breathe|severe bleeding)\b', speech, re.I):
        reply = 'Please contact your local emergency service immediately. This appointment line cannot provide emergency care.'
        ended = True
    elif speech.lower() in ('cancel', 'goodbye', 'stop'):
        reply = 'No new appointment has been booked. Goodbye.'
        ended = True
    elif not speech and payload.step > 0:
        data['silence'] = data.get('silence', 0) + 1
        if data['silence'] >= 3:
            reply, ended = 'I could not hear you. Please call again when you are ready. Goodbye.', True
        else:
            reply = 'I did not hear you. ' + (PROMPTS.get(awaiting) or 'Please say yes to confirm, or no to change the details.')
    elif re.search(r'\b(which doctors|list doctors|available doctors|departments)\b', speech, re.I):
        doctors = db.query(Doctor).order_by(Doctor.id).limit(8).all()
        reply = ('Our doctors are ' + ', '.join(f'{d.name}, {d.department}' for d in doctors) + '. ') if doctors else 'No doctors are registered yet. '
        reply += PROMPTS.get(awaiting, 'Would you like to confirm your appointment?')
    elif re.search(r'\b(opening hours|office hours|what time.*open|when.*open)\b', speech, re.I):
        reply = f"Appointment hours are {os.getenv('BOOKING_OPEN_HOUR', '9')}:00 to {os.getenv('BOOKING_CLOSE_HOUR', '17')}:00 in hospital local time. " + PROMPTS.get(awaiting, 'Please confirm your appointment.')
    elif re.search(r'\b(diagnos|medicine|medication|treatment|prescribe|medical advice)\b', speech, re.I):
        reply = 'A clinician can help with medical questions. I can help arrange an appointment. ' + PROMPTS.get(awaiting, 'Please confirm your appointment.')
    elif awaiting == 'confirm':
        if speech.lower().rstrip('.!') in ('yes', 'yes please', 'confirm', 'yes confirm', 'book it', 'correct'):
            try:
                appointment = book(db, BookingRequest(
                    patient_name=data['patient_name'], phone=payload.phone, doctor=data['doctor'],
                    appointment_time=f"{data['date']}T{data['time']}",
                    idempotency_key=f'voice:{session.id}', confirmed=True,
                    notes='Booked through voice receptionist',
                ))
                appointment_id = appointment.id
                data['appointment_id'] = appointment_id
                reply = f"Your appointment with {data['doctor']} on {data['date']} at {data['time'][:5]} is booked. Your reference is {appointment_id}. Thank you."
                ended = True
                await manager.broadcast({'event': 'refresh_appointments'})
            except HTTPException as exc:
                data.pop('time', None)
                reply = f'I could not book that appointment. {exc.detail} What other time would you prefer?'
                data['awaiting'] = 'time'
        elif speech.lower().rstrip('.!') in ('no', 'change', 'no thanks', 'incorrect'):
            data = {'awaiting': 'doctor', 'patient_name': data['patient_name']}
            reply = 'Let us change the booking. ' + PROMPTS['doctor']
        else:
            reply = 'Please say yes to book these details, or no to change them.'
    elif awaiting and not ended:
        try:
            if awaiting == 'patient_name':
                name = re.sub(r'^(my name is|i am|this is|name is)\s+', '', speech, flags=re.I).strip().rstrip('.')
                if len(name) < 2 or len(name) > 100 or not re.fullmatch(r"[^\W\d_]+(?:[ '\-][^\W\d_]+)*", name):
                    raise ValueError('Please say only the patient\'s full name.')
                data['patient_name'] = name
            elif awaiting == 'doctor':
                target = re.sub(r'^(i want to see|i would like|book with|with)\s+', '', speech, flags=re.I).rstrip('.')
                data['doctor'] = match_doctor(db, target).name
            elif awaiting == 'date':
                day = parse_date(speech)
                if day < now_local().date():
                    raise ValueError('Please choose a future date.')
                data['date'] = day.isoformat()
            elif awaiting == 'time':
                time = parse_time(speech)
                doctor = match_doctor(db, data['doctor'])
                validate_slot(db, doctor.id, datetime.combine(datetime.fromisoformat(data['date']).date(), time))
                data['time'] = time.isoformat()
            data['silence'] = 0
        except (ValueError, HTTPException) as exc:
            reply = str(exc.detail) if isinstance(exc, HTTPException) else str(exc)
    if not reply:
        missing = next((key for key in PROMPTS if not data.get(key)), None)
        if missing:
            data['awaiting'] = missing
            reply = PROMPTS[missing]
            if payload.step == 0:
                reply = 'Hello, I am the automated MediConnect appointment receptionist. ' + reply
        else:
            data['awaiting'] = 'confirm'
            reply = f"Please confirm: {data['patient_name']}, with {data['doctor']}, on {data['date']} at {data['time'][:5]}. Say yes to book, or no to change the details."
    response = {'reply': reply, 'step': session.step + 1, 'ended': ended,
                'booking_triggered': bool(appointment_id), 'appointment_id': appointment_id}
    data['ended'] = ended
    session.data, session.response = data, response
    session.step += 1
    session.updated_at = datetime.utcnow()
    db.commit()
    return response


@router.get('/booking/doctors', dependencies=[Depends(service_auth)])
def booking_doctors(db: Session = Depends(get_db)):
    return [{'name': d.name, 'department': d.department} for d in db.query(Doctor).all()]
