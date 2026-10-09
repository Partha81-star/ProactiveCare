"""
schemas/appointment.py
-----------------------
Pydantic schemas for Appointment API requests/responses.
"""

from pydantic import BaseModel
from typing import Optional
from typing import Literal
from pydantic import field_validator
from datetime import datetime
from app.schemas.patient import PatientOut
from app.schemas.doctor import DoctorOut


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    status: Literal['Scheduled', 'Rescheduled', 'Confirmed', 'Pending', 'Cancelled', 'Completed'] = "Scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    # Used for rescheduling, cancelling, adding notes, etc.
    appointment_time: Optional[datetime] = None
    status: Optional[Literal['Scheduled', 'Rescheduled', 'Confirmed', 'Pending', 'Cancelled', 'Completed']] = None
    notes: Optional[str] = None

    @field_validator('appointment_time', 'status')
    @classmethod
    def non_null(cls, value):
        if value is None:
            raise ValueError('This field cannot be null when supplied')
        return value


class AppointmentOut(AppointmentBase):
    id: int
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None

    class Config:
        from_attributes = True
