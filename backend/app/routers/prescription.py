"""
routers/prescription.py
-------------------------
HTTP endpoints for Prescriptions, including sub-endpoints for adding/removing
individual medicine items on an existing prescription.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionOut,
    PrescriptionItemCreate,
)
from app.crud import prescription as prescription_crud

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("/", response_model=PrescriptionOut)
def create_prescription(prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    """
    Create a prescription with its medicine items in one request.
    See schemas/prescription.py for the expected request body shape.
    """
    return prescription_crud.create_prescription(db, prescription)


@router.get("/", response_model=List[PrescriptionOut])
def list_prescriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return prescription_crud.get_prescriptions(db, skip, limit)


@router.get("/{prescription_id}", response_model=PrescriptionOut)
def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    db_prescription = prescription_crud.get_prescription(db, prescription_id)
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_prescription


@router.get("/patient/{patient_id}", response_model=List[PrescriptionOut])
def get_patient_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    """All prescriptions for a patient — used to drive medication reminders."""
    return prescription_crud.get_prescriptions_by_patient(db, patient_id)


@router.put("/{prescription_id}", response_model=PrescriptionOut)
def update_prescription(prescription_id: int, prescription: PrescriptionUpdate, db: Session = Depends(get_db)):
    """Updates header info (e.g. notes) only. Use the item endpoints below to change medicines."""
    db_prescription = prescription_crud.update_prescription(db, prescription_id, prescription)
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_prescription


@router.post("/{prescription_id}/items", response_model=PrescriptionOut)
def add_prescription_item(prescription_id: int, item: PrescriptionItemCreate, db: Session = Depends(get_db)):
    """Add one more medicine to an existing prescription (e.g. doctor adds a follow-up medicine)."""
    db_prescription = prescription_crud.add_item_to_prescription(db, prescription_id, item)
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return db_prescription


@router.delete("/{prescription_id}/items/{item_id}")
def delete_prescription_item(prescription_id: int, item_id: int, db: Session = Depends(get_db)):
    """Remove one medicine from a prescription (e.g. discontinued medication)."""
    db_item = prescription_crud.delete_item_from_prescription(db, prescription_id, item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Prescription item not found")
    return {"message": f"Item {item_id} removed from prescription {prescription_id}"}


@router.delete("/{prescription_id}")
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    """Delete the entire prescription and all its medicine items."""
    db_prescription = prescription_crud.delete_prescription(db, prescription_id)
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return {"message": f"Prescription {prescription_id} deleted successfully"}
