"""
routers/appointment.py
-----------------------
HTTP endpoints for Appointment CRUD operations, plus two extra helper
endpoints for fetching a patient's or doctor's appointments (useful for
building the dashboards later).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.crud import appointment as appointment_crud

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentOut)
async def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    db_appt = appointment_crud.create_appointment(db, appointment)
    # Notify React frontend client(s) to reload dynamically
    from app.websocket import manager
    await manager.broadcast({"event": "refresh_appointments"})
    return db_appt


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return appointment_crud.get_appointments(db, skip, limit)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = appointment_crud.get_appointment(db, appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment


@router.get("/patient/{patient_id}", response_model=List[AppointmentOut])
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    """All appointments belonging to one patient (for the Patient dashboard)."""
    return appointment_crud.get_appointments_by_patient(db, patient_id)


@router.get("/doctor/{doctor_id}", response_model=List[AppointmentOut])
def get_doctor_appointments(doctor_id: int, db: Session = Depends(get_db)):
    """All appointments belonging to one doctor (for the Doctor dashboard)."""
    return appointment_crud.get_appointments_by_doctor(db, doctor_id)


@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(appointment_id: int, appointment: AppointmentUpdate, db: Session = Depends(get_db)):
    """Used for rescheduling, cancelling, or updating notes."""
    db_appointment = appointment_crud.update_appointment(db, appointment_id, appointment)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # Notify React frontend to reload dynamically
    from app.websocket import manager
    await manager.broadcast({"event": "refresh_appointments"})
    return db_appointment


@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = appointment_crud.delete_appointment(db, appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # Notify React frontend to reload dynamically
    from app.websocket import manager
    await manager.broadcast({"event": "refresh_appointments"})
    return {"message": f"Appointment {appointment_id} deleted successfully"}
