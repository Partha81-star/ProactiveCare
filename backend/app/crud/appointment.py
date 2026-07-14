"""
crud/appointment.py
--------------------
Database operations for Appointments. Slightly more involved than Patient/Doctor
because appointments link to both a patient_id and a doctor_id.
"""

from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


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
    db_appointment = Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
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
    for key, value in update_data.items():
        setattr(db_appointment, key, value)

    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def delete_appointment(db: Session, appointment_id: int):
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None
    db.delete(db_appointment)
    db.commit()
    return db_appointment
