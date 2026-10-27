"""Verify the combined public edge before routing a real phone number to it."""

import os
from pathlib import Path
from uuid import uuid4

import httpx
from dotenv import dotenv_values
from twilio.request_validator import RequestValidator


ROOT = Path(__file__).resolve().parents[1]
LOCAL = os.getenv('PUBLIC_EDGE_TEST_URL', 'http://127.0.0.1:8003').rstrip('/')
VOICE_ENV = dotenv_values(ROOT / 'ai_notification_service/.env')
BACKEND_ENV = dotenv_values(ROOT / 'backend/.env')
PUBLIC = VOICE_ENV.get('PUBLIC_BASE_URL', '').rstrip('/')
AUTH = VOICE_ENV.get('TWILIO_AUTH_TOKEN', '')

with httpx.Client(base_url=LOCAL, timeout=15) as client:
    assert client.get('/health').json() == {'status': 'ready'}
    assert client.get('/login').status_code == 200
    assert client.get('/assets/does-not-exist.js').status_code == 404
    assert client.get('/api/doctors').status_code == 401
    assert client.get('/api/voice/turn').status_code == 404
    assert client.post('/api/v1/voice/local/simulate', json={}).status_code == 401
    assert client.post('/api/v1/voice/incoming', data={}).status_code == 403

    login = client.post('/api/auth/login', json={
        'email': BACKEND_ENV['STAFF_ADMIN_EMAIL'],
        'password': BACKEND_ENV['STAFF_ADMIN_PASSWORD'],
    })
    login.raise_for_status()
    token = login.json()['token']
    assert client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'}).status_code == 200
    assert client.get('/api/doctors', headers={'Authorization': f'Bearer {token}'}).status_code == 200

    call = {'CallSid': 'CA' + uuid4().hex, 'From': '+15555550123'}
    incoming = PUBLIC + '/api/v1/voice/incoming'
    signature = RequestValidator(AUTH).compute_signature(incoming, call)
    response = client.post('/api/v1/voice/incoming', data=call,
                           headers={'X-Twilio-Signature': signature})
    assert response.status_code == 200 and '<Gather' in response.text

print('PASS: portal, staff auth, private booking route, browser voice auth, Twilio signature')
