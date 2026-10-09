"""Durable call state and idempotent booking receipts; no transcript storage."""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from app.database import Base


class VoiceSession(Base):
    __tablename__ = 'voice_sessions'
    id = Column(String(200), primary_key=True)
    phone = Column(String(30), nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    step = Column(Integer, nullable=False, default=0)
    response = Column(JSON, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class BookingReceipt(Base):
    __tablename__ = 'booking_receipts'
    key = Column(String(200), primary_key=True)
    fingerprint = Column(String(64), nullable=False)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), nullable=False)
