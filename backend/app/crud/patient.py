"""
crud/patient.py
----------------
Database operations for Patients. Mirrors the structure of crud/doctor.py.
"""

from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).offset(skip).limit(limit).all()


def create_patient(db: Session, patient: PatientCreate):
    db_patient = db.query(Patient).filter(Patient.email == patient.email).first()
    if db_patient:
        return db_patient
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(db: Session, patient_id: int, patient_update: PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None

    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)

    db.commit()
    db.refresh(db_patient)
    return db_patient


def delete_patient(db: Session, patient_id: int):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None
    db.delete(db_patient)
    db.commit()
    return db_patient
