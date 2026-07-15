"""
schemas/prescription.py
------------------------
Pydantic schemas for Prescription + PrescriptionItem.

Key idea: when CREATING a prescription, the client sends the header fields
PLUS a list of medicine items all in ONE request — e.g.:

{
  "patient_id": 1,
  "doctor_id": 2,
  "appointment_id": 5,
  "prescribed_date": "2026-07-15T10:00:00",
  "notes": "Take with food",
  "items": [
    {"medicine_name": "Metformin", "dosage": "500 mg", "frequency": "Twice a day", "timing": "After dinner", "duration": "30 days"},
    {"medicine_name": "Vitamin D3", "dosage": "60000 IU", "frequency": "Once a week", "timing": null, "duration": "8 weeks"}
  ]
}

This is much easier for the frontend to work with than making separate
API calls for the header and each medicine.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ---- Prescription Item schemas ----

class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    timing: Optional[str] = None
    duration: Optional[str] = None


class PrescriptionItemCreate(PrescriptionItemBase):
    pass


class PrescriptionItemOut(PrescriptionItemBase):
    id: int

    class Config:
        from_attributes = True


# ---- Prescription (header) schemas ----

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    prescribed_date: datetime
    notes: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    items: List[PrescriptionItemCreate]  # must include at least the medicines being prescribed


class PrescriptionUpdate(BaseModel):
    # For updating header info only. To change the medicine list, use the
    # dedicated item endpoints (add/remove individual items) — see router.
    notes: Optional[str] = None


class PrescriptionOut(PrescriptionBase):
    id: int
    items: List[PrescriptionItemOut] = []

    class Config:
        from_attributes = True
