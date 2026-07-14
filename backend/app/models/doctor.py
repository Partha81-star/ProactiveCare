"""
models/doctor.py
-----------------
Defines the "doctors" table in PostgreSQL using SQLAlchemy's ORM.
Each class attribute below becomes a column in the table.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"  # actual table name in PostgreSQL

    id = Column(Integer, primary_key=True, index=True)          # unique doctor ID
    name = Column(String, nullable=False)                        # doctor's full name
    department = Column(String, nullable=False)                  # e.g. Cardiology, Orthopedics
    email = Column(String, unique=True, nullable=False)          # doctor's contact email
    phone = Column(String, nullable=True)                        # optional phone number
    availability = Column(String, nullable=True)                 # e.g. "Mon-Fri 10AM-4PM" (simple text for now)

    # This creates a link back to any appointments this doctor has.
    # It doesn't create a DB column — it's a convenience for querying in Python,
    # e.g. some_doctor.appointments will give a list of Appointment objects.
    appointments = relationship("Appointment", back_populates="doctor")
