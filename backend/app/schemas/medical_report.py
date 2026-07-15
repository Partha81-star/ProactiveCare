"""
schemas/medical_report.py
--------------------------
Pydantic schemas for Medical Report API requests/responses.

Note: there's no "MedicalReportCreate" schema with a file field — file
uploads in FastAPI are handled differently (as UploadFile in the route
function itself, not through a Pydantic body). See routers/medical_report.py
for how the upload form fields + file are combined.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MedicalReportBase(BaseModel):
    patient_id: int
    doctor_id: int
    report_type: str
    report_date: datetime
    status: Optional[str] = "Ready"
    notes: Optional[str] = None


class MedicalReportUpdate(BaseModel):
    # Used to update metadata only (status, notes) — re-uploading a file
    # is handled by a separate endpoint, not this schema.
    report_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class MedicalReportOut(MedicalReportBase):
    id: int
    file_path: str
    original_filename: str

    class Config:
        from_attributes = True
