"""
models/notification.py
-----------------------
SQLAlchemy model for the Notification log table.
"""

from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    event = Column(String, nullable=False)
    channel = Column(String, nullable=False)
    status = Column(String, default="pending")
    message_preview = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
