"""Exercise real HTTP across both services, including a backend restart.

Run after installing both .venv environments: python scripts/smoke_call.py
Uses an isolated database, no external provider requests and no real patient data.
"""
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def interpreter(service):
    return ROOT / service / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def request(base, path, data=None, token=None, form=False):
    headers = {}
    body = None
    if data is not None:
        body = (urllib.parse.urlencode(data) if form else json.dumps(data)).encode()
        headers['Content-Type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
    if token:
        headers['Authorization'] = f'Bearer {token}'
    with urllib.request.urlopen(urllib.request.Request(base + path, body, headers), timeout=12) as response:
        payload = response.read().decode()
        return payload if 'xml' in response.headers.get('Content-Type', '') else json.loads(payload)


def start(service, port, env, log):
    process = subprocess.Popen([str(interpreter(service)), '-m', 'uvicorn', 'app.main:app',
                                '--host', '127.0.0.1', '--port', str(port)], cwd=ROOT / service,
                               env=env, stdout=log, stderr=log,
                               creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
    for _ in range(80):
        if process.poll() is not None:
            raise RuntimeError(f'{service} failed at startup; see smoke logs')
        try:
            path = '/health/ready' if service == 'backend' else '/api/v1/health'
            request(f'http://127.0.0.1:{port}', path)
            return process
        except (OSError, ValueError):
            time.sleep(.25)
    process.terminate()
    process.wait(timeout=10)
    raise RuntimeError(f'{service} did not become ready')


def stop(process):
    if process.poll() is None:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                           creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            process.terminate()
    process.wait(timeout=10)


def main():
    backend_port, voice_port = free_port(), free_port()
    core, voice = f'http://127.0.0.1:{backend_port}', f'http://127.0.0.1:{voice_port}'
    with tempfile.TemporaryDirectory(prefix='.smoke-', dir=ROOT) as temp:
        env = {**os.environ, 'DATABASE_URL': f'sqlite:///{Path(temp).as_posix()}/test.db',
               'APP_ENV': 'development', 'SERVICE_TOKEN': 'smoke-test-service-token',
               'BACKEND_BASE_URL': core, 'TWILIO_AUTH_TOKEN': '', 'TWILIO_ACCOUNT_SID': '',
               'GEMINI_API_KEY': '', 'PUBLIC_BASE_URL': '', 'VAPI_WEBHOOK_SECRET': ''}
        processes = []
        with open(Path(temp) / 'services.log', 'w+', encoding='utf-8') as log:
            try:
                processes.append(start('backend', backend_port, env, log))
                processes.append(start('ai_notification_service', voice_port, env, log))
                token = request(core, '/api/auth/login', {'email': 'admin@mediconnect.ai', 'password': 'admin123'})['token']
                request(core, '/api/doctors/', {'name': 'Dr. Patel', 'department': 'Cardiology', 'email': 'patel@example.com'}, token)
                form = {'CallSid': 'CA-smoke-persistent-call', 'From': '+919876543210'}
                xml = request(voice, '/api/v1/voice/incoming', form, form=True)
                assert 'full name' in xml
                for speech in ['Asha Shah', 'Dr. Patel', 'day after tomorrow', '10 AM']:
                    action = ET.fromstring(xml).find('Gather').attrib['action']
                    xml = request(voice, action, {**form, 'SpeechResult': speech}, form=True)
                assert 'confirm' in xml
                assert request(core, '/api/appointments/', token=token) == []
                # Persisted call state and staff session must survive a restart.
                stop(processes[0])
                processes[0] = start('backend', backend_port, env, log)
                action = ET.fromstring(xml).find('Gather').attrib['action']
                xml = request(voice, action, {**form, 'SpeechResult': 'yes'}, form=True)
                assert 'is booked' in xml
                retry = request(voice, action, {**form, 'SpeechResult': 'yes'}, form=True)
                assert retry == xml
                appointments = request(core, '/api/appointments/', token=token)
                assert len(appointments) == 1
                assert appointments[0]['patient']['name'] == 'Asha Shah'
                assert appointments[0]['doctor']['name'] == 'Dr. Patel'
                print('PASS: inbound call -> spoken turns -> confirmation -> persistent appointment -> dashboard API')
                print('PASS: backend restart retained call and login; webhook retry did not duplicate appointment')
            except Exception:
                log.flush()
                log.seek(0)
                print(log.read()[-6000:])
                raise
            finally:
                for process in processes:
                    stop(process)


if __name__ == '__main__':
    main()
