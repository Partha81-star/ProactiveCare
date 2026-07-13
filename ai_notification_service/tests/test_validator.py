"""
Tests for the safety validator.
"""

import pytest

from app.validator import validate_message, ValidationResult
from app.schemas import NotificationRequest, Channel


@pytest.fixture
def sms_request():
    """Simple SMS request for testing."""
    return NotificationRequest(
        event="appointment_reminder",
        patient_name="Test Patient",
        channel="sms",
        phone="+919876543210",
    )


@pytest.fixture
def email_request():
    """Simple Email request for testing."""
    return NotificationRequest(
        event="appointment_reminder",
        patient_name="Test Patient",
        channel="email",
        email="test@example.com",
    )


class TestValidateMessage:
    """Test the message validation pipeline."""

    def test_valid_message_passes(self, sms_request):
        """A clean, safe message should pass validation."""
        result = validate_message(
            "Dear Test Patient, your appointment is tomorrow at 10 AM.",
            sms_request,
        )
        assert result.is_valid is True
        assert len(result.warnings) == 0

    def test_empty_message_fails(self, sms_request):
        """Empty message should fail validation."""
        result = validate_message("", sms_request)
        assert result.is_valid is False

    def test_whitespace_message_fails(self, sms_request):
        """Whitespace-only message should fail validation."""
        result = validate_message("   \n  ", sms_request)
        assert result.is_valid is False

    def test_sensitive_term_hiv_sanitized(self, sms_request):
        """Message containing 'HIV' should be sanitized."""
        result = validate_message(
            "Your HIV test results are ready.",
            sms_request,
        )
        assert result.is_valid is True
        assert result.is_sanitized is True
        assert "hiv" not in result.message.lower()

    def test_sensitive_term_cancer_sanitized(self, sms_request):
        """Message containing 'cancer' should be sanitized."""
        result = validate_message(
            "Your cancer screening report is available.",
            sms_request,
        )
        assert result.is_valid is True
        assert "cancer" not in result.message.lower()

    def test_result_leak_rejected(self, sms_request):
        """Message revealing test results should be rejected."""
        result = validate_message(
            "Your test result shows positive for the condition.",
            sms_request,
        )
        # Should either be rejected or sanitized
        assert result.is_valid is False or result.is_sanitized is True

    def test_safe_lab_report_message_passes(self, sms_request):
        """Privacy-safe lab report message should pass."""
        result = validate_message(
            "Your laboratory results are now available. "
            "Please consult your doctor or log in securely to review them.",
            sms_request,
        )
        assert result.is_valid is True
        assert result.is_sanitized is False

    def test_long_sms_truncated(self, sms_request):
        """Very long SMS should be truncated."""
        long_message = "A" * 2000
        result = validate_message(long_message, sms_request)
        assert result.is_valid is True
        assert len(result.message) <= 480  # 3 SMS segments

    def test_email_allows_longer_messages(self, email_request):
        """Email should allow longer messages than SMS."""
        long_message = "A" * 2000
        result = validate_message(long_message, email_request)
        assert result.is_valid is True
        assert len(result.message) == 2000  # Not truncated

    def test_multiple_sensitive_terms_all_removed(self, sms_request):
        """Multiple sensitive terms should all be sanitized."""
        result = validate_message(
            "Regarding your tuberculosis and hepatitis status.",
            sms_request,
        )
        assert result.is_valid is True
        assert "tuberculosis" not in result.message.lower()
        assert "hepatitis" not in result.message.lower()
