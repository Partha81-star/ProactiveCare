"""
models/medical_report.py
-------------------------
Defines the "medical_reports" table. Each report is linked to a Patient and
the Doctor who ordered/uploaded it. The actual report file is stored on disk
(see app/routers/medical_report.py for the upload logic); this table stores
the file's location plus metadata, not the file's binary content.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)

    report_type = Column(String, nullable=False)                  # e.g. "CBC Blood Test", "X-Ray Chest"
    report_date = Column(DateTime, nullable=False)                # when the test/scan was taken

    # Where the uploaded file lives on disk, relative to the backend project root.
    # e.g. "uploads/medical_reports/3_cbc_report.pdf"
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)            # the filename as the uploader named it

    status = Column(String, default="Ready")                      # "Pending" or "Ready"
    notes = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="medical_reports")
    doctor = relationship("Doctor", back_populates="medical_reports")
