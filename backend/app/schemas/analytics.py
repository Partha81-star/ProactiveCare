"""
schemas/analytics.py
----------------------
A single response shape for the dashboard summary endpoint. Unlike other
modules, Analytics has no "Create/Update" schemas — it's read-only, computed
from existing data rather than stored directly.
"""

from pydantic import BaseModel
from typing import Dict


class AnalyticsSummary(BaseModel):
    total_patients: int
    total_doctors: int
    total_departments: int
    total_appointments: int
    appointments_by_status: Dict[str, int]        # e.g. {"Scheduled": 12, "Completed": 5}
    appointments_by_department: Dict[str, int]     # grouped by Doctor.department text field
    total_medical_reports: int
    total_prescriptions: int
