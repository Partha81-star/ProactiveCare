"""
crud/medical_report.py
------------------------
Database operations for Medical Reports. File saving itself happens in the
router (since it needs access to the raw upload stream), but this file
handles all the database bookkeeping, plus deleting the file from disk
when a report is deleted (so we don't leave orphaned files behind).
"""

import os
from sqlalchemy.orm import Session
from app.models.medical_report import MedicalReport
from app.schemas.medical_report import MedicalReportUpdate


def get_report(db: Session, report_id: int):
    return db.query(MedicalReport).filter(MedicalReport.id == report_id).first()


def get_reports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(MedicalReport).offset(skip).limit(limit).all()


def get_reports_by_patient(db: Session, patient_id: int):
    """All reports for a specific patient (for the Patient dashboard)."""
    return db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).all()


def create_report(
    db: Session,
    patient_id: int,
    doctor_id: int,
    report_type: str,
    report_date,
    status: str,
    notes: str,
    file_path: str,
    original_filename: str,
):
    """
    Create a report row. Called AFTER the router has already saved the
    physical file to disk — this function just records the metadata + path.
    """
    db_report = MedicalReport(
        patient_id=patient_id,
        doctor_id=doctor_id,
        report_type=report_type,
        report_date=report_date,
        status=status,
        notes=notes,
        file_path=file_path,
        original_filename=original_filename,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def update_report(db: Session, report_id: int, report_update: MedicalReportUpdate):
    """Update metadata only (status/notes/type) — not the file itself."""
    db_report = get_report(db, report_id)
    if not db_report:
        return None

    update_data = report_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)

    db.commit()
    db.refresh(db_report)
    return db_report


def delete_report(db: Session, report_id: int):
    """
    Delete a report row AND its physical file from disk.
    Returns the deleted object, or None if not found.
    """
    db_report = get_report(db, report_id)
    if not db_report:
        return None

    # Remove the physical file first. If it's already missing for some
    # reason, don't let that block deleting the database row.
    if os.path.exists(db_report.file_path):
        os.remove(db_report.file_path)

    db.delete(db_report)
    db.commit()
    return db_report
