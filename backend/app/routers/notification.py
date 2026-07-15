"""
routers/notification.py
------------------------
Notification history endpoints.

These endpoints are called by the frontend NotificationHistory page
and AI Notifications page. They store notification logs in SQLite
via the Notification SQLAlchemy model.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from app.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Pydantic schemas ─────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    patient_name: str
    event: str
    channel: str
    status: str
    message_preview: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SendNotificationRequest(BaseModel):
    patientId: Optional[str] = None
    patient_name: str
    event: str
    channel: str
    language: Optional[str] = "en"
    phone: Optional[str] = None
    email: Optional[str] = None
    message: Optional[str] = None
    doctor: Optional[str] = None
    department: Optional[str] = None
    hospital_name: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None


class StatsResponse(BaseModel):
    total: int
    delivered: int
    pending: int
    failed: int
    rate: float


# ── Endpoints ────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Delivery statistics for the dashboard stats cards."""
    all_notifs = db.query(Notification).all()
    total = len(all_notifs)
    delivered = sum(1 for n in all_notifs if n.status == "delivered")
    pending = sum(1 for n in all_notifs if n.status == "pending")
    failed = sum(1 for n in all_notifs if n.status == "failed")
    rate = round((delivered / total * 100), 1) if total > 0 else 0.0
    return {"total": total, "delivered": delivered, "pending": pending, "failed": failed, "rate": rate}


@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List notification history, newest first."""
    return (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return n


@router.post("/send")
async def send_notification(body: SendNotificationRequest, db: Session = Depends(get_db)):
    """
    Create a notification log entry and forward to AI service.
    The AI service generates the message and dispatches it.
    """
    import httpx

    # Build AI service payload
    ai_payload = {
        "event": body.event,
        "patient_name": body.patient_name,
        "channel": body.channel.lower(),
        "language": body.language or "en",
        "phone": body.phone,
        "email": body.email,
        "doctor": body.doctor,
        "department": body.department,
        "hospital_name": body.hospital_name,
        "appointment_date": body.appointment_date,
        "appointment_time": body.appointment_time,
    }

    # Remove None values
    ai_payload = {k: v for k, v in ai_payload.items() if v is not None}

    status = "pending"
    message_preview = None

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("http://localhost:8001/api/v1/notify", json=ai_payload)
            data = resp.json()
            status = data.get("status", "failed")
            message_preview = data.get("message_preview")
    except Exception as e:
        status = "failed"
        message_preview = f"AI service error: {str(e)}"

    # Log the notification
    notif = Notification(
        id=str(uuid.uuid4()),
        patient_name=body.patient_name,
        event=body.event,
        channel=body.channel,
        status=status,
        message_preview=message_preview,
        created_at=datetime.now(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return {"notification": notif, "message": f"Notification {status}"}


@router.post("/{notification_id}/resend")
def resend_notification(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.status = "pending"
    db.commit()
    return {"message": "Notification queued for resend", "notification": n}


@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.patch("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    return {"message": "All notifications marked as read", "count": 0}
