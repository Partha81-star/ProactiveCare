"""
schemas/patient.py
-------------------
Pydantic schemas for Patient API requests/responses. See doctor.py for the
explanation of Base / Create / Update / Out pattern — same idea here.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class PatientBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    preferred_language: Optional[str] = "English"
    medical_history: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    medical_history: Optional[str] = None


class PatientOut(PatientBase):
    id: int

    class Config:
        from_attributes = True
