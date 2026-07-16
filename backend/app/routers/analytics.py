"""
routers/analytics.py
----------------------
A single GET endpoint powering the Admin analytics dashboard. Returns every
summary metric in one response, so the frontend can populate the whole
dashboard with one API call instead of six separate ones.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import AnalyticsSummary
from app.crud import analytics as analytics_crud

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Returns counts and breakdowns across Patients, Doctors, Departments,
    Appointments (by status and by department), Medical Reports, and
    Prescriptions — everything the Admin dashboard needs in one call.
    """
    return analytics_crud.get_summary(db)
