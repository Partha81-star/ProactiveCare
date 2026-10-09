"""Telephony adapters. Only committed backend appointments are called booked."""
import json
import secrets
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
import httpx
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import VoiceResponse, Gather
from app.config import get_settings

router = APIRouter(prefix='/api/v1/voice', tags=['Voice Booking'])


async def backend(path, payload=None):
    settings = get_settings()
    headers = {'X-Service-Token': settings.SERVICE_TOKEN}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            url = settings.BACKEND_BASE_URL.rstrip('/') + '/api' + path
            response = await (client.get(url, headers=headers) if payload is None else client.post(url, json=payload, headers=headers))
            if response.is_error:
                detail = response.json().get('detail', 'Booking service unavailable')
                raise HTTPException(response.status_code, detail if isinstance(detail, str) else 'Please verify all booking details.')
            return response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, 'The booking service is unavailable. No appointment has been confirmed. Please try again.')


async def validate_twilio(request):
    settings = get_settings()
    form = await request.form()
    if settings.TWILIO_AUTH_TOKEN:
        # Use the configured public URL; never trust spoofable forwarded headers.
        url = (settings.PUBLIC_BASE_URL.rstrip('/') + request.url.path if settings.PUBLIC_BASE_URL else str(request.url).split('?')[0])
        if request.url.query:
            url += '?' + request.url.query
        signature = request.headers.get('X-Twilio-Signature', '')
        if not RequestValidator(settings.TWILIO_AUTH_TOKEN).validate(url, form, signature):
            raise HTTPException(403, 'Invalid Twilio signature')
    elif not settings.is_development:
        raise HTTPException(503, 'Twilio authentication is not configured')
    return form


def twiml(reply, session_id, step, ended=False):
    response = VoiceResponse()
    if ended:
        response.say(reply, voice='Polly.Aditi', language='en-IN')
        response.hangup()
    else:
        gather = Gather(input='speech', action=f'/api/v1/voice/process?step={step}', method='POST',
                        timeout=7, speech_timeout='auto', language='en-IN', action_on_empty_result=True)
        gather.say(reply, voice='Polly.Aditi', language='en-IN')
        response.append(gather)
    return Response(str(response), media_type='application/xml')


async def turn(request, step):
    form = await validate_twilio(request)
    sid, phone = form.get('CallSid'), form.get('From')
    if not sid or not phone:
        raise HTTPException(422, 'CallSid and caller phone are required')
    try:
        result = await backend('/voice/turn', {'session_id': sid, 'phone': phone,
                                             'text': form.get('SpeechResult', ''), 'step': step})
        return twiml(result['reply'], sid, result['step'], result['ended'])
    except HTTPException as exc:
        # A timeout may follow a successful commit: never promise it failed or retry
        # with a new key. Retrying this same turn retrieves the committed receipt.
        return twiml('I could not verify your booking status. Please contact reception before trying another booking.', sid, step, True)


@router.post('/incoming')
async def incoming(request: Request):
    return await turn(request, 0)


@router.post('/process')
async def process(request: Request, step: int = 1):
    return await turn(request, step)


@router.post('/status-callback')
async def status_callback(request: Request):
    await validate_twilio(request)
    return {'received': True}


def validate_vapi(request):
    settings = get_settings()
    if settings.VAPI_WEBHOOK_SECRET:
        if not secrets.compare_digest(request.headers.get('X-Vapi-Secret', ''), settings.VAPI_WEBHOOK_SECRET):
            raise HTTPException(403, 'Invalid Vapi secret')
    elif not settings.is_development:
        raise HTTPException(503, 'Vapi authentication is not configured')


@router.post('/webhook')
async def vapi_webhook(request: Request):
    validate_vapi(request)
    payload = await request.json()
    message = payload.get('message', {})
    if message.get('type') != 'tool-calls':
        return {'status': 'ignored'}
    results = []
    for call in message.get('toolCallList', message.get('toolCalls', [])):
        call_id = call.get('id')
        function = call.get('function', call)
        name = function.get('name')
        try:
            args = function.get('arguments', function.get('parameters', {}))
            if isinstance(args, str):
                args = json.loads(args)
            if name == 'list_doctors':
                result = await backend('/booking/doctors')
            elif name == 'book_appointment':
                phone = message.get('call', {}).get('customer', {}).get('number')
                sid = message.get('call', {}).get('id')
                if not phone or not sid or not call_id:
                    raise HTTPException(422, 'Verified caller number and call identifiers are required.')
                # Absolute ISO timestamp avoids relative date changes on a retried tool.
                result = await backend('/bookings', {
                    'patient_name': args.get('patient_name'), 'phone': phone,
                    'doctor': args.get('doctor'), 'appointment_time': args.get('appointment_time'),
                    'notes': args.get('reason'), 'confirmed': args.get('confirmed', False),
                    'idempotency_key': f'vapi:{sid}:{call_id}',
                })
                result = {'status': 'booked', 'appointment_id': result['id'], 'appointment_time': result['appointment_time']}
            else:
                raise HTTPException(422, 'Unsupported tool')
            results.append({'toolCallId': call_id, 'result': json.dumps(result)})
        except (HTTPException, ValueError, TypeError) as exc:
            results.append({'toolCallId': call_id, 'error': str(exc.detail) if isinstance(exc, HTTPException) else 'Invalid tool arguments'})
    return {'results': results}
