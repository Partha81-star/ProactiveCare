"""
models/patient.py
------------------
Defines the "patients" table in PostgreSQL.
Includes fields relevant to the wider project (preferred language, contact info)
even though we're only building CRUD for now — this saves rework later when
Notifications/AI modules need these fields.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)                       # needed later for SMS/WhatsApp
    preferred_language = Column(String, default="English")       # used later by the AI translation module
    medical_history = Column(String, nullable=True)               # simple text field for now

    # Link back to this patient's appointments (Python-side convenience only)
    appointments = relationship("Appointment", back_populates="patient")
    medical_reports = relationship("MedicalReport", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")
