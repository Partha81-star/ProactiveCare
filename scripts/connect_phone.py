"""Connect an existing Twilio number after verifying the public voice endpoint.

python scripts/connect_phone.py configure https://YOUR_PUBLIC_HOST
Restart the backend and gateway, then:
python scripts/connect_phone.py activate
Credentials stay in the ignored gateway .env. No phone call is placed.
"""
import json
from pathlib import Path
import secrets
import sys
from uuid import uuid4
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import httpx
from dotenv import dotenv_values, set_key
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from twilio.request_validator import RequestValidator

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / 'ai_notification_service/.env'


def configure(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.path not in ('', '/') or parsed.query:
        raise ValueError('Provide a public HTTPS origin without a path or query.')
    values = dotenv_values(ENV)
    core_env = ROOT / 'backend/.env'
    core = dotenv_values(core_env) if core_env.exists() else {}
    token = core.get('SERVICE_TOKEN') or values.get('SERVICE_TOKEN') or secrets.token_urlsafe(48)
    core_env.touch(exist_ok=True)
    set_key(core_env, 'SERVICE_TOKEN', token)
    set_key(ENV, 'SERVICE_TOKEN', token)
    set_key(ENV, 'PUBLIC_BASE_URL', url.rstrip('/'))
    print('Public origin and internal authentication configured. Restart core services before activation.')


def activate():
    values = dotenv_values(ENV)
    base = (values.get('PUBLIC_BASE_URL') or '').rstrip('/')
    auth = values.get('TWILIO_AUTH_TOKEN')
    if not base.startswith('https://') or not auth or not values.get('TWILIO_ACCOUNT_SID'):
        raise ValueError('Configure PUBLIC_BASE_URL and Twilio credentials first.')
    url = base + '/api/v1/voice/incoming'
    form = {'CallSid': 'CA' + uuid4().hex, 'From': '+15555550123'}
    signature = RequestValidator(auth).compute_signature(url, form)
    with httpx.Client(timeout=20) as http:
        response = http.post(url, data=form, headers={'X-Twilio-Signature': signature})
        if response.status_code != 200:
            raise ValueError(f'Public voice probe failed: HTTP {response.status_code}. Routing was not changed.')
        xml = ET.fromstring(response.text)
        gather = xml.find('Gather')
        if gather is None or 'full name' not in ''.join(gather.itertext()):
            raise ValueError('The receptionist greeting did not load. Routing was not changed.')
        if http.post(url, data=form).status_code != 403:
            raise ValueError('Unsigned calls must be rejected. Routing was not changed.')
        if http.post(base + '/api/v1/voice/local/simulate', json={}).status_code != 404:
            raise ValueError('The public endpoint must expose only phone callbacks. Routing was not changed.')
    client = Client(values['TWILIO_ACCOUNT_SID'], auth)
    numbers = client.incoming_phone_numbers.list(phone_number=values.get('TWILIO_PHONE_NUMBER'), limit=2)
    if len(numbers) != 1 or not numbers[0].capabilities.get('voice'):
        raise ValueError('The configured voice-enabled number was not found in this account.')
    number = numbers[0]
    runtime = ROOT / '.runtime'
    runtime.mkdir(exist_ok=True)
    backup = runtime / 'phone-routing-backup.json'
    if not backup.exists():
        backup.write_text(json.dumps({'phone': number.phone_number, 'voice_url': number.voice_url,
            'voice_method': number.voice_method, 'status_callback': number.status_callback,
            'status_callback_method': number.status_callback_method,
            'voice_application_sid': number.voice_application_sid, 'trunk_sid': number.trunk_sid}, indent=2))
    options = {'voice_url': url, 'voice_method': 'POST',
               'status_callback': base + '/api/v1/voice/status-callback', 'status_callback_method': 'POST'}
    if number.voice_application_sid:
        options['voice_application_sid'] = ''
    if number.trunk_sid:
        options['trunk_sid'] = ''
    updated = client.incoming_phone_numbers(number.sid).update(**options)
    if updated.voice_url != url:
        raise ValueError('Twilio did not retain the requested webhook. Inspect its number settings.')
    print('Public signed receptionist probe: PASS; unsigned requests blocked; private APIs hidden.')
    print('Twilio incoming-call webhook updated and verified for', updated.phone_number)
    print('Incoming URL:', updated.voice_url)
    print('Ready for a real incoming call. Keep the services and tunnel running.')


if __name__ == '__main__':
    try:
        if len(sys.argv) == 3 and sys.argv[1] == 'configure':
            configure(sys.argv[2])
        elif len(sys.argv) == 2 and sys.argv[1] == 'activate':
            activate()
        else:
            raise ValueError('Usage: connect_phone.py configure HTTPS_ORIGIN | activate')
    except TwilioRestException as exc:
        print(f'Twilio operation failed: HTTP {exc.status}, error code {exc.code}. Credentials were not printed.')
        raise SystemExit(1)
    except (ValueError, httpx.HTTPError, ET.ParseError) as exc:
        print(str(exc))
        raise SystemExit(1)
