from sqlalchemy import Column, String, DateTime
from app.database import Base


class StaffSession(Base):
    __tablename__ = 'staff_sessions'
    token_hash = Column(String(64), primary_key=True)
    email = Column(String(200), nullable=False)
    expires_at = Column(DateTime, nullable=False)
