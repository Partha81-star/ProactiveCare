"""
crud/analytics.py
-------------------
Unlike other crud files, this one doesn't create/update/delete anything —
it just runs aggregate queries (COUNT, GROUP BY) across existing tables to
build the dashboard summary.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.appointment import Appointment
from app.models.medical_report import MedicalReport
from app.models.prescription import Prescription


def get_summary(db: Session) -> dict:
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()
    total_departments = db.query(Department).count()
    total_appointments = db.query(Appointment).count()
    total_medical_reports = db.query(MedicalReport).count()
    total_prescriptions = db.query(Prescription).count()

    # GROUP BY status -> e.g. [("Scheduled", 12), ("Completed", 5), ("Cancelled", 2)]
    status_rows = (
        db.query(Appointment.status, func.count(Appointment.id))
        .group_by(Appointment.status)
        .all()
    )
    appointments_by_status = {status: count for status, count in status_rows}

    # Appointments grouped by the doctor's department (free-text field on Doctor).
    # Uses an INNER JOIN, so only doctors who actually have appointments will
    # show up here — a department with zero appointments simply won't appear
    # in this dict (not an error, just nothing to report yet).
    department_rows = (
        db.query(Doctor.department, func.count(Appointment.id))
        .join(Appointment, Appointment.doctor_id == Doctor.id)
        .group_by(Doctor.department)
        .all()
    )
    appointments_by_department = {department: count for department, count in department_rows}

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_departments": total_departments,
        "total_appointments": total_appointments,
        "appointments_by_status": appointments_by_status,
        "appointments_by_department": appointments_by_department,
        "total_medical_reports": total_medical_reports,
        "total_prescriptions": total_prescriptions,
    }
