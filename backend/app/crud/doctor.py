"""
crud/doctor.py
---------------
This file contains the actual database operations for Doctors.
Keeping these separate from the API routes (routers/doctor.py) keeps things
clean: routers handle HTTP stuff, crud files handle DB stuff.
"""

from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate, DoctorUpdate


def get_doctor(db: Session, doctor_id: int):
    """Fetch a single doctor by ID. Returns None if not found."""
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()


def get_doctors(db: Session, skip: int = 0, limit: int = 100):
    """Fetch a paginated list of doctors."""
    return db.query(Doctor).offset(skip).limit(limit).all()


def create_doctor(db: Session, doctor: DoctorCreate):
    """Create a new doctor row and save it to the DB."""
    db_doctor = Doctor(**doctor.model_dump())  # unpack schema fields into the model
    db.add(db_doctor)          # stage the new row
    db.commit()                # write it to the database
    db.refresh(db_doctor)      # refresh db_doctor with the DB-generated "id"
    return db_doctor


def update_doctor(db: Session, doctor_id: int, doctor_update: DoctorUpdate):
    """Update an existing doctor. Only updates fields that were actually provided."""
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return None

    # exclude_unset=True means "only include fields the client actually sent"
    update_data = doctor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_doctor, key, value)

    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def delete_doctor(db: Session, doctor_id: int):
    """Delete a doctor by ID. Returns the deleted object, or None if not found."""
    db_doctor = get_doctor(db, doctor_id)
    if not db_doctor:
        return None
    db.delete(db_doctor)
    db.commit()
    return db_doctor
