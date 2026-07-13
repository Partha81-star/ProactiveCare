"""
ProactiveCare – Test Configuration & Shared Fixtures
======================================================

Provides reusable test fixtures for the entire test suite.
Uses pytest fixtures to avoid duplicating setup code.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas import (
    NotificationRequest,
    EventType,
    Language,
    Channel,
)


@pytest.fixture
def app():
    """Create a fresh FastAPI app instance for testing."""
    return create_app()


@pytest.fixture
def client(app):
    """Create a test client for making API calls without a running server."""
    return TestClient(app)


@pytest.fixture
def sample_appointment_request() -> NotificationRequest:
    """Sample appointment reminder request for testing."""
    return NotificationRequest(
        event=EventType.APPOINTMENT_REMINDER,
        patient_name="Rahul Sharma",
        patient_age=45,
        patient_gender="male",
        doctor="Dr. Mehta",
        department="Cardiology",
        hospital_name="City General Hospital",
        appointment_date="15 July 2026",
        appointment_time="10:30 AM",
        language=Language.HINDI,
        channel=Channel.SMS,
        phone="+919876543210",
        email="rahul@gmail.com",
    )


@pytest.fixture
def sample_lab_report_request() -> NotificationRequest:
    """Sample lab report ready request for testing."""
    return NotificationRequest(
        event=EventType.LAB_REPORT_READY,
        patient_name="Priya Patel",
        doctor="Dr. Singh",
        department="Pathology",
        hospital_name="City General Hospital",
        language=Language.ENGLISH,
        channel=Channel.EMAIL,
        email="priya@gmail.com",
        phone="+919876543211",
    )


@pytest.fixture
def sample_emergency_request() -> NotificationRequest:
    """Sample emergency notification request for testing."""
    return NotificationRequest(
        event=EventType.EMERGENCY_NOTIFICATION,
        patient_name="Amit Kumar",
        hospital_name="City General Hospital",
        language=Language.ENGLISH,
        channel=Channel.WHATSAPP,
        phone="+919876543212",
        email="amit@gmail.com",
        additional_info={"emergency_type": "Blood required", "blood_group": "O+"},
    )


@pytest.fixture
def all_event_types() -> list[str]:
    """All supported event type values."""
    return [e.value for e in EventType]
