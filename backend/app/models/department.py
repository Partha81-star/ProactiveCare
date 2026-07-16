"""
models/department.py
----------------------
Defines the "departments" table. This is intentionally standalone for now —
NOT linked via foreign key to Doctor.department (which stays free text, per
team decision). This lets Admin manage a clean list of departments (for
dropdowns, hospital info, etc.) without forcing a migration of existing
doctor records right now.
"""

from sqlalchemy import Column, Integer, String
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)      # e.g. "Cardiology"
    description = Column(String, nullable=True)               # optional short description
