import pytest


@pytest.mark.parametrize(('email', 'password', 'role'), [
    ('admin@mediconnect.ai', 'admin@123', 'admin'),
    ('doctor@mediconnect.ai', 'doctor@123', 'doctor'),
    ('nurse@mediconnect.ai', 'nurse@123', 'nurse'),
])
def test_local_demo_login(client, email, password, role):
    response = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    assert response.json()['user']['role'] == role
    token = response.json()['token']
    profile = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
    assert profile.status_code == 200
    assert profile.json()['email'] == email


def test_demo_login_is_disabled_in_production(client, monkeypatch):
    monkeypatch.setenv('APP_ENV', 'production')
    monkeypatch.setenv('STAFF_ADMIN_EMAIL', 'staff@example.test')
    monkeypatch.setenv('STAFF_ADMIN_PASSWORD', 'test-production-password')
    demo = client.post('/api/auth/login', json={
        'email': 'admin@mediconnect.ai', 'password': 'admin@123',
    })
    assert demo.status_code == 401
    staff = client.post('/api/auth/login', json={
        'email': 'staff@example.test', 'password': 'test-production-password',
    })
    assert staff.status_code == 200
