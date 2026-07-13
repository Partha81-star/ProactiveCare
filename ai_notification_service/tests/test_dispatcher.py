"""
Tests for the notification dispatcher and fallback logic.
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.notification.dispatcher import (
    _build_fallback_chain,
    _get_recipient,
    _generate_email_subject,
)
from app.schemas import Channel, NotificationRequest, EventType


class TestFallbackChain:
    """Test the fallback chain ordering."""

    def test_whatsapp_preferred(self):
        """WhatsApp preferred → [WhatsApp, SMS, Email]."""
        chain = _build_fallback_chain(Channel.WHATSAPP)
        assert chain == [Channel.WHATSAPP, Channel.SMS, Channel.EMAIL]

    def test_sms_preferred(self):
        """SMS preferred → [SMS, WhatsApp, Email]."""
        chain = _build_fallback_chain(Channel.SMS)
        assert chain == [Channel.SMS, Channel.WHATSAPP, Channel.EMAIL]

    def test_email_preferred(self):
        """Email preferred → [Email, WhatsApp, SMS]."""
        chain = _build_fallback_chain(Channel.EMAIL)
        assert chain == [Channel.EMAIL, Channel.WHATSAPP, Channel.SMS]

    def test_no_duplicates(self):
        """Fallback chain should never have duplicate channels."""
        for channel in Channel:
            chain = _build_fallback_chain(channel)
            assert len(chain) == len(set(chain))


class TestGetRecipient:
    """Test recipient address extraction."""

    def test_sms_returns_phone(self, sample_appointment_request):
        """SMS channel should use phone number."""
        result = _get_recipient(sample_appointment_request, Channel.SMS)
        assert result == "+919876543210"

    def test_whatsapp_returns_phone(self, sample_appointment_request):
        """WhatsApp channel should use phone number."""
        result = _get_recipient(sample_appointment_request, Channel.WHATSAPP)
        assert result == "+919876543210"

    def test_email_returns_email(self, sample_appointment_request):
        """Email channel should use email address."""
        result = _get_recipient(sample_appointment_request, Channel.EMAIL)
        assert result == "rahul@gmail.com"

    def test_missing_phone_returns_none(self):
        """Missing phone should return None for SMS/WhatsApp."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="email",
            email="test@example.com",
        )
        assert _get_recipient(req, Channel.SMS) is None

    def test_missing_email_returns_none(self):
        """Missing email should return None for email channel."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="sms",
            phone="+919876543210",
        )
        assert _get_recipient(req, Channel.EMAIL) is None


class TestEmailSubject:
    """Test email subject line generation."""

    def test_appointment_reminder_subject(self):
        """Appointment reminder should generate proper subject."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            hospital_name="City Hospital",
            channel="email",
            email="test@example.com",
        )
        subject = _generate_email_subject(req)
        assert "Appointment Reminder" in subject
        assert "City Hospital" in subject

    def test_emergency_subject_has_warning(self):
        """Emergency notification subject should have warning symbol."""
        req = NotificationRequest(
            event="emergency_notification",
            patient_name="Test",
            channel="email",
            email="test@example.com",
        )
        subject = _generate_email_subject(req)
        assert "⚠️" in subject or "Urgent" in subject

    def test_default_hospital_name(self):
        """Missing hospital name should default to ProactiveCare."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="email",
            email="test@example.com",
        )
        subject = _generate_email_subject(req)
        assert "ProactiveCare" in subject
