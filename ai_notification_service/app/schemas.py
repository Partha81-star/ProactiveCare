"""
ProactiveCare – Pydantic Schemas (Data Models)
================================================

This file defines ALL data contracts for the AI Notification Service.
It is the single source of truth for request/response formats.

Share this file (or its OpenAPI output) with Member 2 (Backend)
so they know exactly what JSON to send and what to expect back.

Design decisions:
    - StrEnum for event types, languages, channels → prevents typos
    - Optional fields for event-specific data → one model fits all 12 events
    - additional_info dict → flexible catch-all for extra context
    - Field validators → custom validation rules (e.g., phone format)
"""

from datetime import datetime
from enum import StrEnum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


# ═══════════════════════════════════════════════════════════════════
# ENUMS — Constrained choices that prevent typos and invalid values
# ═══════════════════════════════════════════════════════════════════

class EventType(StrEnum):
    """
    All 12 hospital events that this service can handle.

    Each event maps to a specific prompt template in prompts.py
    and has different required context fields.
    """
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    MEDICINE_REMINDER = "medicine_reminder"
    LAB_REPORT_READY = "lab_report_ready"
    TEST_RESULT_AVAILABLE = "test_result_available"
    SURGERY_REMINDER = "surgery_reminder"
    VACCINATION_REMINDER = "vaccination_reminder"
    ADMISSION_CONFIRMATION = "admission_confirmation"
    DISCHARGE_INSTRUCTIONS = "discharge_instructions"
    FOLLOW_UP_REMINDER = "follow_up_reminder"
    EMERGENCY_NOTIFICATION = "emergency_notification"


class Language(StrEnum):
    """
    Supported languages using ISO 639-1 codes.

    Why codes instead of full names?
        - Shorter, standardized, no ambiguity
        - "hi" is universally understood as Hindi
        - Frontend dropdowns can map display names to codes
    """
    ENGLISH = "en"
    HINDI = "hi"
    MARATHI = "mr"


class Channel(StrEnum):
    """
    Notification delivery channels.

    Fallback order: WhatsApp → SMS → Email
    """
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"


class DeliveryStatus(StrEnum):
    """
    Possible outcomes of a notification delivery attempt.
    """
    DELIVERED = "delivered"
    FAILED = "failed"
    PENDING = "pending"
    FALLBACK = "fallback"  # Delivered via a different channel than requested


# ═══════════════════════════════════════════════════════════════════
# REQUEST MODELS — What the backend sends to us
# ═══════════════════════════════════════════════════════════════════

class NotificationRequest(BaseModel):
    """
    Incoming notification request from the backend (Member 2).

    Required fields:
        - event: Which hospital event triggered this notification
        - patient_name: For personalization
        - language: Target language for the message
        - channel: Preferred delivery channel

    Optional fields:
        - Doctor, department, dates, etc. — depend on event type
        - phone/email — required based on chosen channel

    Example JSON:
        {
            "event": "appointment_reminder",
            "patient_name": "Rahul Sharma",
            "patient_age": 45,
            "doctor": "Dr. Mehta",
            "department": "Cardiology",
            "hospital_name": "City General Hospital",
            "appointment_date": "15 July 2026",
            "appointment_time": "10:30 AM",
            "language": "hi",
            "channel": "whatsapp",
            "phone": "+919876543210",
            "email": "rahul@gmail.com"
        }
    """

    # ── Required Fields ──────────────────────────────────────
    event: EventType = Field(
        ...,
        description="The hospital event type that triggered this notification",
        examples=["appointment_reminder", "medicine_reminder"],
    )
    patient_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Full name of the patient",
        examples=["Rahul Sharma"],
    )
    language: Language = Field(
        default=Language.ENGLISH,
        description="Preferred language for the notification (ISO 639-1 code)",
        examples=["en", "hi", "mr"],
    )
    channel: Channel = Field(
        default=Channel.WHATSAPP,
        description="Preferred delivery channel",
        examples=["whatsapp", "sms", "email"],
    )

    # ── Patient Details (Optional) ───────────────────────────
    patient_age: Optional[int] = Field(
        default=None,
        ge=0,
        le=150,
        description="Patient age in years",
    )
    patient_gender: Optional[str] = Field(
        default=None,
        description="Patient gender (used only when contextually appropriate)",
        examples=["male", "female", "other"],
    )

    # ── Medical Context (Optional — depends on event type) ───
    doctor: Optional[str] = Field(
        default=None,
        description="Name of the attending doctor",
        examples=["Dr. Mehta"],
    )
    department: Optional[str] = Field(
        default=None,
        description="Hospital department name",
        examples=["Cardiology", "Orthopedics"],
    )
    hospital_name: Optional[str] = Field(
        default=None,
        description="Name of the hospital",
        examples=["City General Hospital"],
    )

    # ── Scheduling Details (Optional) ────────────────────────
    appointment_date: Optional[str] = Field(
        default=None,
        description="Date of appointment/surgery/follow-up",
        examples=["15 July 2026"],
    )
    appointment_time: Optional[str] = Field(
        default=None,
        description="Time of appointment/surgery/follow-up",
        examples=["10:30 AM"],
    )

    # ── Contact Information ──────────────────────────────────
    phone: Optional[str] = Field(
        default=None,
        description="Patient phone number with country code",
        examples=["+919876543210"],
    )
    email: Optional[str] = Field(
        default=None,
        description="Patient email address",
        examples=["rahul@gmail.com"],
    )

    # ── Flexible Extension Field ─────────────────────────────
    additional_info: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Extra context for specific events. Examples: "
            "medicine_name, dosage, ward_number, surgery_type, "
            "vaccine_name, discharge_notes, lab_report_id"
        ),
        examples=[{"medicine_name": "Metformin", "dosage": "500mg", "frequency": "twice daily"}],
    )

    # ── Validators ───────────────────────────────────────────

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Ensure phone number starts with + and contains only digits."""
        if v is not None:
            # Strip spaces and dashes for flexibility
            cleaned = v.replace(" ", "").replace("-", "")
            if not cleaned.startswith("+"):
                raise ValueError("Phone number must start with country code (e.g., +91)")
            if not cleaned[1:].isdigit():
                raise ValueError("Phone number must contain only digits after country code")
            return cleaned
        return v

    @model_validator(mode="after")
    def validate_channel_contact_info(self) -> "NotificationRequest":
        """
        Ensure the required contact info is provided for the chosen channel.

        - WhatsApp/SMS → phone number required
        - Email → email address required

        This catches missing contact info BEFORE we try to send,
        giving a clear error instead of a confusing delivery failure.
        """
        if self.channel in (Channel.WHATSAPP, Channel.SMS) and not self.phone:
            raise ValueError(
                f"Phone number is required for {self.channel} notifications. "
                f"Provide 'phone' field with country code (e.g., +919876543210)"
            )
        if self.channel == Channel.EMAIL and not self.email:
            raise ValueError(
                "Email address is required for email notifications. "
                "Provide 'email' field."
            )
        return self


# ═══════════════════════════════════════════════════════════════════
# RESPONSE MODELS — What we send back to the backend
# ═══════════════════════════════════════════════════════════════════

class NotificationResponse(BaseModel):
    """
    Response returned to the backend after processing a notification.

    Always includes:
        - request_id: Unique identifier for tracking
        - status: delivered / failed / pending / fallback
        - channel: The channel that was actually used (may differ from requested)
        - timestamp: When the notification was processed

    On success:
        - message_preview: First ~100 chars of the generated message

    On fallback:
        - original_channel: The channel that was originally requested
        - fallback_reason: Why the original channel failed

    On failure:
        - error: Description of what went wrong
    """

    request_id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Unique request identifier for tracking and debugging",
    )
    status: DeliveryStatus = Field(
        ...,
        description="Outcome of the notification delivery",
    )
    channel: Channel = Field(
        ...,
        description="The channel through which the notification was delivered (or attempted)",
    )
    message_preview: Optional[str] = Field(
        default=None,
        description="Preview of the generated message (first ~100 characters)",
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="When the notification was processed",
    )

    # ── Fallback-specific fields ─────────────────────────────
    original_channel: Optional[Channel] = Field(
        default=None,
        description="Original requested channel (present only on fallback)",
    )
    fallback_reason: Optional[str] = Field(
        default=None,
        description="Why the original channel failed (present only on fallback)",
    )

    # ── Error-specific fields ────────────────────────────────
    error: Optional[str] = Field(
        default=None,
        description="Error description (present only on failure)",
    )


class BatchNotificationRequest(BaseModel):
    """
    Request for sending notifications to multiple patients at once.

    Used for bulk operations like:
        - Reminding all patients with tomorrow's appointments
        - Sending vaccination reminders to a group
    """

    notifications: list[NotificationRequest] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of notification requests (max 100 per batch)",
    )


class BatchNotificationResponse(BaseModel):
    """
    Response for batch notification requests.

    Includes per-notification results and a summary.
    """

    total: int = Field(description="Total number of notifications in the batch")
    successful: int = Field(description="Number of successfully delivered notifications")
    failed: int = Field(description="Number of failed notifications")
    results: list[NotificationResponse] = Field(
        description="Individual results for each notification",
    )


class HealthResponse(BaseModel):
    """
    Response for the health check endpoint.
    """

    status: str = Field(default="healthy")
    service: str
    version: str
    ai_model: str
