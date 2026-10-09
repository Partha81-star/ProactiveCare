"""Provider contracts and failure responses without external API calls."""
import xml.etree.ElementTree as ET
import pytest
from fastapi import HTTPException
from twilio.request_validator import RequestValidator
from app.config import get_settings
from app.voice import handler, local_handler


@pytest.fixture(autouse=True)
def isolated_settings(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, 'APP_ENV', 'development')
    monkeypatch.setattr(settings, 'TWILIO_AUTH_TOKEN', '')
    monkeypatch.setattr(settings, 'VAPI_WEBHOOK_SECRET', '')
    monkeypatch.setattr(settings, 'PUBLIC_BASE_URL', '')


def test_incoming_gathers_speech_and_retries_silence(client, monkeypatch):
    async def backend(path, payload):
        assert payload['session_id'] == 'CA123456789'
        return {'reply': 'Hello <patient> & welcome', 'step': 1, 'ended': False}
    monkeypatch.setattr(handler, 'backend', backend)
    response = client.post('/api/v1/voice/incoming', data={'CallSid': 'CA123456789', 'From': '+919876543210'})
    assert response.status_code == 200
    xml = ET.fromstring(response.text)
    assert xml.find('Gather').attrib['actionOnEmptyResult'] == 'true'
    assert xml.find('Gather/Say').text == 'Hello <patient> & welcome'
    assert xml.find('Gather').attrib['action'].endswith('step=1')


def test_backend_failure_never_says_booked(client, monkeypatch):
    async def failed(*args):
        raise HTTPException(503, 'offline')
    monkeypatch.setattr(handler, 'backend', failed)
    response = client.post('/api/v1/voice/process?step=5', data={'CallSid': 'CA123456789', 'From': '+919876543210', 'SpeechResult': 'yes'})
    assert 'could not verify' in response.text
    assert ET.fromstring(response.text).find('Hangup') is not None


def test_twilio_signature_uses_exact_public_url(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, 'TWILIO_AUTH_TOKEN', 'test-token')
    monkeypatch.setattr(settings, 'PUBLIC_BASE_URL', 'https://voice.example.com')
    form = {'CallSid': 'CA123456789', 'From': '+919876543210'}
    assert client.post('/api/v1/voice/status-callback', data=form).status_code == 403
    signature = RequestValidator('test-token').compute_signature('https://voice.example.com/api/v1/voice/status-callback', form)
    assert client.post('/api/v1/voice/status-callback', data=form, headers={'X-Twilio-Signature': signature}).status_code == 200


def test_vapi_actual_tool_contract_and_errors(client, monkeypatch):
    async def backend(path, payload=None):
        if path == '/bookings':
            assert payload['confirmed'] is True
            assert payload['phone'] == '+919876543210'
            assert payload['idempotency_key'] == 'vapi:call-1:tool-1'
            return {'id': 42, 'appointment_time': payload['appointment_time']}
        return [{'name': 'Dr. Patel', 'department': 'Cardiology'}]
    monkeypatch.setattr(handler, 'backend', backend)
    message = {'type': 'tool-calls', 'call': {'id': 'call-1', 'customer': {'number': '+919876543210'}},
               'toolCallList': [{'id': 'tool-1', 'name': 'book_appointment', 'parameters': {
                   'patient_name': 'Asha Shah', 'doctor': 'Dr. Patel', 'appointment_time': '2030-01-01T10:00:00', 'confirmed': True}},
                                {'id': 'tool-2', 'name': 'unknown', 'parameters': {}}]}
    response = client.post('/api/v1/voice/webhook', json={'message': message})
    assert response.status_code == 200
    results = response.json()['results']
    assert 'result' in results[0] and 'error' not in results[0]
    assert 'error' in results[1] and 'result' not in results[1]


def test_vapi_does_not_invent_caller(client):
    response = client.post('/api/v1/voice/webhook', json={'message': {'type': 'tool-calls',
        'toolCallList': [{'id': 't1', 'name': 'book_appointment', 'parameters': {}}]}})
    assert 'error' in response.json()['results'][0]


def test_production_disables_unverified_webhooks_and_simulation(client, monkeypatch):
    monkeypatch.setattr(get_settings(), 'APP_ENV', 'production')
    assert client.post('/api/v1/voice/incoming', data={'CallSid': 'CA123456789', 'From': '+919876543210'}).status_code == 503
    assert client.post('/api/v1/voice/local/simulate', json={'phone': '+919876543210'}).status_code == 403


def test_local_simulator_forwards_session_and_turn(client, monkeypatch):
    async def backend(path, payload):
        assert payload['phone'] == '+919876543210'
        assert payload['step'] == 2
        assert payload['session_id'] == 'local:test-call'
        return {'reply': 'Which doctor?', 'step': 3, 'ended': False, 'booking_triggered': False}
    monkeypatch.setattr(local_handler, 'backend', backend)
    response = client.post('/api/v1/voice/local/simulate', json={'phone': '+919876543210', 'session_id': 'local:test-call', 'step': 2, 'text': 'Asha'})
    assert response.status_code == 200
    assert response.json()['step'] == 3
