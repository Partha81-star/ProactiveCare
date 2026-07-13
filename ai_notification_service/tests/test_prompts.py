"""
Tests for the prompt engineering engine.
"""

from app.prompts import build_prompt, EVENT_PROMPTS, SYSTEM_PROMPT
from app.schemas import EventType, Language, Channel, NotificationRequest


class TestPromptBuilder:
    """Test the prompt builder function."""

    def test_build_prompt_returns_tuple(self, sample_appointment_request):
        """build_prompt should return (system_prompt, user_prompt)."""
        result = build_prompt(sample_appointment_request)
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_system_prompt_contains_safety_rules(self):
        """System prompt must include patient privacy rules."""
        assert "NEVER mention specific diagnoses" in SYSTEM_PROMPT
        assert "NEVER reveal specific test results" in SYSTEM_PROMPT
        assert "HIV" in SYSTEM_PROMPT

    def test_all_events_have_prompts(self):
        """Every EventType must have a corresponding prompt template."""
        for event in EventType:
            assert event in EVENT_PROMPTS, f"Missing prompt for {event}"

    def test_patient_context_included(self, sample_appointment_request):
        """User prompt should include patient details."""
        _, user_prompt = build_prompt(sample_appointment_request)
        assert "Rahul Sharma" in user_prompt
        assert "Dr. Mehta" in user_prompt
        assert "Cardiology" in user_prompt
        assert "15 July 2026" in user_prompt
        assert "10:30 AM" in user_prompt

    def test_language_instruction_hindi(self, sample_appointment_request):
        """Hindi request should instruct AI to generate in Hindi."""
        _, user_prompt = build_prompt(sample_appointment_request)
        assert "Hindi" in user_prompt
        assert "Do NOT write in English" in user_prompt

    def test_language_instruction_english(self):
        """English request should NOT say 'do not write in English'."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            language="en",
            channel="sms",
            phone="+919876543210",
        )
        _, user_prompt = build_prompt(req)
        assert "Do NOT write in English" not in user_prompt

    def test_sms_word_limit(self):
        """SMS channel should have 50-word limit."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="sms",
            phone="+919876543210",
        )
        _, user_prompt = build_prompt(req)
        assert "50 words" in user_prompt

    def test_whatsapp_word_limit(self):
        """WhatsApp channel should have 80-word limit."""
        req = NotificationRequest(
            event="appointment_reminder",
            patient_name="Test",
            channel="whatsapp",
            phone="+919876543210",
        )
        _, user_prompt = build_prompt(req)
        assert "80 words" in user_prompt

    def test_additional_info_included(self):
        """additional_info fields should appear in the user prompt."""
        req = NotificationRequest(
            event="medicine_reminder",
            patient_name="Test",
            channel="sms",
            phone="+919876543210",
            additional_info={"medicine_name": "Metformin", "dosage": "500mg"},
        )
        _, user_prompt = build_prompt(req)
        assert "Metformin" in user_prompt
        assert "500mg" in user_prompt
