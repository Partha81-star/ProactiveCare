from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from uuid import uuid4
from app.booking import now_local

SERVICE = {'X-Service-Token': 'test-service-token'}


def booking(**changes):
    day = (now_local() + timedelta(days=2)).date().isoformat()
    return {'patient_name': 'Asha Shah', 'phone': '+919876543210', 'doctor': 'Dr. Patel',
            'appointment_time': f'{day}T10:00:00', 'confirmed': True,
            'idempotency_key': str(uuid4()), **changes}


def test_atomic_idempotent_booking_and_conflict(client, staff):
    payload = booking()
    first = client.post('/api/bookings', json=payload, headers=SERVICE)
    assert first.status_code == 200, first.text
    repeated = client.post('/api/bookings', json=payload, headers=SERVICE)
    assert repeated.json()['id'] == first.json()['id']
    assert client.post('/api/bookings', json={**payload, 'patient_name': 'Other Patient'}, headers=SERVICE).status_code == 409
    assert client.post('/api/bookings', json=booking(patient_name='Other Patient'), headers=SERVICE).status_code == 409
    assert len(client.get('/api/patients/', headers=staff).json()) == 1
    assert len(client.get('/api/appointments/', headers=staff).json()) == 1


def test_confirmation_auth_and_validation(client):
    assert client.post('/api/bookings', json=booking()).status_code == 401
    assert client.get('/api/patients/').status_code == 401
    for change in [{'confirmed': False}, {'doctor': 'Nonexistent'}, {'appointment_time': '2020-01-01T10:00:00'},
                   {'appointment_time': '2030-01-01T10:15:00'}, {'phone': 'unknown'}]:
        assert client.post('/api/bookings', json=booking(**change), headers=SERVICE).status_code == 422


def test_concurrent_slot_has_one_winner(client, staff):
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: client.post('/api/bookings', json=booking(), headers=SERVICE), range(2)))
    assert sorted(r.status_code for r in responses) == [200, 409]
    assert len(client.get('/api/appointments/', headers=staff).json()) == 1


def test_simultaneous_retries_return_same_committed_appointment(client):
    payload = booking()
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: client.post('/api/bookings', json=payload, headers=SERVICE), range(2)))
    assert [r.status_code for r in responses] == [200, 200]
    assert responses[0].json()['id'] == responses[1].json()['id']


def test_conversation_persists_replays_and_books_after_yes(client, staff):
    payload = {'session_id': str(uuid4()), 'phone': '+919876543210', 'step': 0, 'text': ''}
    def turn(speech):
        payload['text'] = speech
        response = client.post('/api/voice/turn', json=payload, headers=SERVICE)
        assert response.status_code == 200, response.text
        result = response.json()
        retry = client.post('/api/voice/turn', json=payload, headers=SERVICE)
        assert retry.json() == result
        payload['step'] = result['step']
        return result
    assert 'full name' in turn('')['reply']
    turn('Asha Shah')
    assert 'Patel' in turn('list doctors')['reply']
    turn('Dr. Patel')
    turn('day after tomorrow')
    result = turn('10 AM')
    assert 'confirm' in result['reply']
    assert client.get('/api/appointments/', headers=staff).json() == []
    result = turn('yes')
    assert result['booking_triggered'] and result['ended']
    assert len(client.get('/api/appointments/', headers=staff).json()) == 1


def test_invalid_doctor_silence_and_ambiguous_time(client):
    payload = {'session_id': str(uuid4()), 'phone': '+919876543210', 'step': 0}
    for speech in ['', 'Asha Shah', 'Nonexistent']:
        response = client.post('/api/voice/turn', json={**payload, 'text': speech}, headers=SERVICE).json()
        payload['step'] = response['step']
    assert 'specify one doctor' in response['reply']
    for _ in range(3):
        response = client.post('/api/voice/turn', json={**payload, 'text': ''}, headers=SERVICE).json()
        payload['step'] = response['step']
    assert response['ended'] and not response['booking_triggered']


def test_cancellation_releases_slot_and_logout_revokes(client, staff):
    first = client.post('/api/bookings', json=booking(), headers=SERVICE).json()
    assert client.put(f'/api/appointments/{first["id"]}', json={'status': 'Cancelled'}, headers=staff).status_code == 200
    assert client.post('/api/bookings', json=booking(), headers=SERVICE).status_code == 200
    assert client.post('/api/auth/logout', headers=staff).status_code == 200
    assert client.get('/api/patients/', headers=staff).status_code == 401
