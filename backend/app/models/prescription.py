"""
models/prescription.py
-----------------------
Defines TWO tables:
 - "prescriptions"       -> one row per doctor visit / prescribing event
 - "prescription_items"  -> one row per medicine within that prescription

Why two tables instead of one?
A single visit usually results in multiple medicines being prescribed at once
(e.g. Metformin + Vitamin D). Splitting these into a header + items pattern
(similar to an "order" and "order line items") avoids duplicating patient/
doctor/date info on every single medicine row, and matches how real hospital
systems model prescriptions.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Prescription(Base):
    """The 'header' — represents one prescribing event during a visit."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)

    # Optional link to the appointment this prescription was written during.
    # Nullable because a prescription could theoretically be added outside
    # of a tracked appointment (e.g. a walk-in note).
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)

    prescribed_date = Column(DateTime, nullable=False)
    notes = Column(String, nullable=True)                         # general notes for the whole prescription

    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")

    # One prescription has many medicine items.
    # cascade="all, delete-orphan" means: if a Prescription is deleted, its
    # items are automatically deleted too (no orphaned medicine rows left behind).
    items = relationship(
        "PrescriptionItem",
        back_populates="prescription",
        cascade="all, delete-orphan",
    )


class PrescriptionItem(Base):
    """One individual medicine within a Prescription."""
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)

    medicine_name = Column(String, nullable=False)                # e.g. "Metformin"
    dosage = Column(String, nullable=False)                       # e.g. "500 mg"
    frequency = Column(String, nullable=False)                    # e.g. "Twice a day"
    timing = Column(String, nullable=True)                        # e.g. "After dinner"
    duration = Column(String, nullable=True)                      # e.g. "7 days"

    prescription = relationship("Prescription", back_populates="items")
