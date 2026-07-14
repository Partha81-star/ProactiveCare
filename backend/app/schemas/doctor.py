"""
schemas/doctor.py
------------------
Pydantic schemas control what data the API accepts (requests) and returns (responses).
This is DIFFERENT from the SQLAlchemy model in models/doctor.py:
 - models/doctor.py  -> defines the DATABASE table structure
 - schemas/doctor.py -> defines the API's INPUT/OUTPUT shape (with validation)

We use three schema types:
 - DoctorBase   -> shared fields
 - DoctorCreate -> fields required when CREATING a doctor (no "id" yet, DB assigns it)
 - DoctorOut    -> fields returned to the client (includes "id")
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class DoctorBase(BaseModel):
    name: str
    department: str
    email: EmailStr
    phone: Optional[str] = None
    availability: Optional[str] = None


class DoctorCreate(DoctorBase):
    # Same fields as DoctorBase — no extra fields needed for creation right now.
    pass


class DoctorUpdate(BaseModel):
    # All fields optional, since a PUT/PATCH may only update some fields.
    name: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    availability: Optional[str] = None


class DoctorOut(DoctorBase):
    id: int

    class Config:
        # Allows Pydantic to read data directly from SQLAlchemy model objects
        # (instead of only from dicts).
        from_attributes = True
