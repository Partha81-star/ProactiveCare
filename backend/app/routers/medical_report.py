"""
routers/medical_report.py
---------------------------
HTTP endpoints for Medical Reports, including REAL file upload and download.

How the upload works:
- The client sends a "multipart/form-data" request: the file itself PLUS
  the metadata fields (patient_id, doctor_id, report_type, etc.) as separate
  form fields — NOT as JSON, because JSON can't carry binary file data.
- FastAPI's `UploadFile` type handles reading the file stream efficiently.
- We save the file to disk under UPLOAD_DIR, then store that path in the DB.
"""

import os
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.medical_report import MedicalReportUpdate, MedicalReportOut
from app.crud import medical_report as report_crud

router = APIRouter(prefix="/medical-reports", tags=["Medical Reports"])

# Where uploaded report files get stored on disk, relative to wherever
# uvicorn is run from (the backend/ project root).
UPLOAD_DIR = "uploads/medical_reports"

# Only allow these file types to be uploaded — basic safety measure so
# someone can't upload an .exe or script disguised as a "report".
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


def _ensure_upload_dir_exists():
    """Create the upload folder if it doesn't exist yet (first run)."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=MedicalReportOut)
def upload_report(
    patient_id: int = Form(...),
    doctor_id: int = Form(...),
    report_type: str = Form(...),
    report_date: datetime = Form(...),
    status: str = Form("Ready"),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a new medical report file along with its metadata, all in one request.
    Form(...) means "this field is required and comes from form data, not JSON".
    """
    _ensure_upload_dir_exists()

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Build a safe, unique filename so two patients uploading "report.pdf"
    # don't overwrite each other. Format: <patient_id>_<timestamp>_<originalname>
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{patient_id}_{timestamp}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Stream the uploaded file to disk in chunks (shutil.copyfileobj handles
    # this efficiently rather than loading the whole file into memory at once).
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Now that the file is safely saved, record it in the database
    db_report = report_crud.create_report(
        db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        report_type=report_type,
        report_date=report_date,
        status=status,
        notes=notes,
        file_path=saved_path,
        original_filename=file.filename,
    )
    return db_report


@router.get("/", response_model=List[MedicalReportOut])
def list_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return report_crud.get_reports(db, skip, limit)


@router.get("/{report_id}", response_model=MedicalReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    db_report = report_crud.get_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Medical report not found")
    return db_report


@router.get("/patient/{patient_id}", response_model=List[MedicalReportOut])
def get_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    """All reports for one patient (for the Patient dashboard / report-ready notifications)."""
    return report_crud.get_reports_by_patient(db, patient_id)


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """
    Download the actual report file. Returns the raw file with the correct
    filename, as if the user clicked "Save As" with the original name.
    """
    db_report = report_crud.get_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Medical report not found")

    if not os.path.exists(db_report.file_path):
        raise HTTPException(status_code=404, detail="Report file is missing from storage")

    return FileResponse(
        path=db_report.file_path,
        filename=db_report.original_filename,
    )


@router.put("/{report_id}", response_model=MedicalReportOut)
def update_report(report_id: int, report: MedicalReportUpdate, db: Session = Depends(get_db)):
    """Update metadata only (status, notes, report_type) — not the file."""
    db_report = report_crud.update_report(db, report_id, report)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Medical report not found")
    return db_report


@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Deletes the database record AND the physical file from disk."""
    db_report = report_crud.delete_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Medical report not found")
    return {"message": f"Medical report {report_id} deleted successfully"}
