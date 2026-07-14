"""
routers/doctor.py
------------------
Defines the HTTP endpoints (URLs) for Doctor CRUD operations.
Each function here is called when a request hits that URL + method.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorOut
from app.crud import doctor as doctor_crud

# prefix="/doctors" means all routes below start with /doctors
# tags=["Doctors"] just groups them nicely in the auto-generated /docs page
router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/", response_model=DoctorOut)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    """Create a new doctor. 'Depends(get_db)' gives us a fresh DB session per request."""
    return doctor_crud.create_doctor(db, doctor)


@router.get("/", response_model=List[DoctorOut])
def list_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List doctors with pagination (?skip=0&limit=100 in the URL)."""
    return doctor_crud.get_doctors(db, skip, limit)


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Fetch a single doctor by ID. Returns 404 if not found."""
    db_doctor = doctor_crud.get_doctor(db, doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, doctor: DoctorUpdate, db: Session = Depends(get_db)):
    """Update an existing doctor's details."""
    db_doctor = doctor_crud.update_doctor(db, doctor_id, doctor)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return db_doctor


@router.delete("/{doctor_id}")
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Delete a doctor by ID."""
    db_doctor = doctor_crud.delete_doctor(db, doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": f"Doctor {doctor_id} deleted successfully"}
