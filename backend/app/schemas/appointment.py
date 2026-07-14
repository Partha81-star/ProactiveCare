"""
schemas/appointment.py
-----------------------
Pydantic schemas for Appointment API requests/responses.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    status: Optional[str] = "Scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    # Used for rescheduling, cancelling, adding notes, etc.
    appointment_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(AppointmentBase):
    id: int

    class Config:
        from_attributes = True
