"""
Tests for Pydantic schemas — request validation, enum constraints, and validators.
"""

import pytest
from pydantic import ValidationError

from app.schemas import (
    NotificationRequest,
    NotificationResponse,
    BatchNotificationRequest,
    EventType,
    Language,
    Channel,
    DeliveryStatus,
)


class TestEventType:
    """Test the EventType enum."""

    def test_all_12_events_exist(self):
        """Verify all 12 hospital events are defined."""
        assert len(EventType) == 12

    def test_valid_event_values(self):
        """Verify event values are snake_case strings."""
        expected = [
            "appointment_reminder", "appointment_rescheduled",
            "appointment_cancelled", "medicine_reminder",
            "lab_report_ready", "test_result_available",
            "surgery_reminder", "vaccination_reminder",
            "admission_confirmation", "discharge_instructions",
            "follow_up_reminder", "emergency_notification",
        ]
        actual = [e.value for e in EventType]
        assert actual == expected


class TestNotificationRequest:
    """Test the NotificationRequest model."""

    def test_valid_request(self, sample_appointment_request):
        """Valid request should parse without errors."""
        assert sample_appointment_request.patient_name == "Rahul Sharma"
        assert sample_appointment_request.event == EventType.APPOINTMENT_REMINDER

    def test_missing_required_field(self):
        """Missing patient_name should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                # patient_name is missing
                language="en",
                channel="sms",
                phone="+919876543210",
            )

    def test_invalid_event_type(self):
        """Invalid event type should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="invalid_event",
                patient_name="Test",
                phone="+919876543210",
            )

    def test_invalid_language(self):
        """Invalid language code should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                language="xx",
                phone="+919876543210",
            )

    def test_phone_validation_missing_country_code(self):
        """Phone without country code should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                channel="sms",
                phone="9876543210",  # Missing +91
            )

    def test_phone_validation_cleans_spaces(self):
        """Phone with spaces should be cleaned automatically."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="sms",
            phone="+91 98765 43210",
        )
        assert req.phone == "+919876543210"

    def test_sms_requires_phone(self):
        """SMS channel without phone should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                channel="sms",
                email="test@example.com",
                # phone is missing
            )

    def test_email_requires_email_address(self):
        """Email channel without email should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                channel="email",
                phone="+919876543210",
                # email is missing
            )

    def test_whatsapp_requires_phone(self):
        """WhatsApp channel without phone should raise ValidationError."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                channel="whatsapp",
                email="test@example.com",
                # phone is missing
            )

    def test_additional_info_accepts_dict(self):
        """additional_info should accept arbitrary key-value pairs."""
        req = NotificationRequest(
            event="medicine_reminder",
            patient_name="Test",
            channel="sms",
            phone="+919876543210",
            additional_info={
                "medicine_name": "Metformin",
                "dosage": "500mg",
                "frequency": "twice daily",
            },
        )
        assert req.additional_info["medicine_name"] == "Metformin"

    def test_default_language_is_english(self):
        """Default language should be English."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="sms",
            phone="+919876543210",
        )
        assert req.language == Language.ENGLISH

    def test_default_channel_is_whatsapp(self):
        """Default channel should be WhatsApp."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            phone="+919876543210",
        )
        assert req.channel == Channel.WHATSAPP

    def test_patient_age_validation(self):
        """Age must be between 0 and 150."""
        with pytest.raises(ValidationError):
            NotificationRequest(
                event="appointment_reminder",
                patient_name="Test",
                patient_age=200,
                phone="+919876543210",
            )


class TestBatchNotificationRequest:
    """Test the BatchNotificationRequest model."""

    def test_valid_batch(self, sample_appointment_request):
        """Valid batch with one notification should parse."""
        batch = BatchNotificationRequest(
            notifications=[sample_appointment_request]
        )
        assert batch.notifications[0].patient_name == "Rahul Sharma"

    def test_empty_batch_rejected(self):
        """Empty notification list should raise ValidationError."""
        with pytest.raises(ValidationError):
            BatchNotificationRequest(notifications=[])


class TestNotificationResponse:
    """Test the NotificationResponse model."""

    def test_success_response(self):
        """Successful delivery response should have all required fields."""
        resp = NotificationResponse(
            status=DeliveryStatus.DELIVERED,
            channel=Channel.SMS,
            message_preview="Test message...",
        )
        assert resp.status == "delivered"
        assert resp.request_id  # Auto-generated UUID
        assert resp.timestamp   # Auto-generated timestamp

    def test_fallback_response(self):
        """Fallback response should include original channel and reason."""
        resp = NotificationResponse(
            status=DeliveryStatus.FALLBACK,
            channel=Channel.SMS,
            original_channel=Channel.WHATSAPP,
            fallback_reason="WhatsApp delivery failed",
        )
        assert resp.original_channel == "whatsapp"
        assert resp.fallback_reason is not None
