"""
routers/department.py
-----------------------
Standard CRUD endpoints for Departments. Same pattern as routers/doctor.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.crud import department as department_crud

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post("/", response_model=DepartmentOut)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    return department_crud.create_department(db, department)


@router.get("/", response_model=List[DepartmentOut])
def list_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return department_crud.get_departments(db, skip, limit)


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(department_id: int, db: Session = Depends(get_db)):
    db_department = department_crud.get_department(db, department_id)
    if db_department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_department


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, department: DepartmentUpdate, db: Session = Depends(get_db)):
    db_department = department_crud.update_department(db, department_id, department)
    if db_department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_department


@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    db_department = department_crud.delete_department(db, department_id)
    if db_department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": f"Department {department_id} deleted successfully"}
