"""
models/appointment.py
----------------------
Defines the "appointments" table. Each appointment links a Patient to a Doctor
via foreign keys (patient_id, doctor_id).
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)

    # ForeignKey links this row to a specific row in "patients" / "doctors" tables
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)

    appointment_time = Column(DateTime, nullable=False)          # date + time of the appointment
    status = Column(String, default="Scheduled")                 # Scheduled / Rescheduled / Cancelled / Completed
    notes = Column(String, nullable=True)                        # optional notes (e.g. fasting required)

    # These let us write, e.g., some_appointment.patient.name or some_appointment.doctor.name
    # without writing manual JOIN queries every time.
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
