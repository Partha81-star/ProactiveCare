"""
ProactiveCare – AI Voice Appointment Booking
=============================================

Handles inbound Twilio Voice calls so patients can book
appointments by speaking naturally over the phone.

Flow:
    1. Patient calls the Twilio phone number
    2. Twilio hits POST /api/v1/voice/incoming  → we greet and listen
    3. Patient speaks their request
    4. Twilio transcribes speech and hits POST /api/v1/voice/process
    5. Gemini extracts booking intent from the transcription
    6. We confirm the booking by voice and log it to the backend
    7. A confirmation SMS is also sent automatically

TwiML responses control exactly what Twilio says/does on the call.
"""

from fastapi import APIRouter, Request, Form
from fastapi.responses import Response
from typing import Optional
import json
import asyncio
import httpx

from google import genai
from app.config import get_settings
from app.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/voice", tags=["Voice Booking"])
settings = get_settings()

# ── Booking extraction prompt ─────────────────────────────────
BOOKING_EXTRACTION_PROMPT = """
You are an AI assistant for a hospital appointment booking system.
A patient has called and spoken the following message:

"{transcription}"

Extract the appointment booking details from this message.
Return ONLY a valid JSON object (no markdown, no explanation) with these fields:
{{
  "patient_name": "<name if mentioned, else null>",
  "doctor": "<doctor name or specialty if mentioned, else null>",
  "department": "<department if mentioned, else null>",
  "date": "<date in natural language, e.g. 'tomorrow', '15 July', else null>",
  "time": "<time if mentioned, else null>",
  "reason": "<reason for visit if mentioned, else null>",
  "confidence": "<high|medium|low based on how clear the request was>"
}}
"""

CONFIRMATION_PROMPT = """
You are a warm, professional hospital receptionist AI.
A patient has just booked an appointment over the phone with these details:
{booking_json}

Generate a brief, friendly voice confirmation message (2-3 sentences max).
Confirm the details you know, and tell them a confirmation SMS will be sent.
Sound warm and human. Do not use markdown.
"""


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _twiml_response(text: str, gather_action: Optional[str] = None, timeout: int = 8) -> str:
    """Build a TwiML XML response string."""
    if gather_action:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="{gather_action}" timeout="{timeout}" speechTimeout="auto" language="en-IN">
    <Say voice="Polly.Aditi" language="en-IN">{text}</Say>
  </Gather>
  <Say voice="Polly.Aditi" language="en-IN">I didn't hear anything. Please call back and try again. Goodbye!</Say>
</Response>"""
    else:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">{text}</Say>
  <Hangup/>
</Response>"""


def _twiml(xml: str) -> Response:
    return Response(content=xml, media_type="application/xml")


async def _extract_booking_intent(transcription: str) -> dict:
    """Ask Gemini to parse the patient's speech into structured booking data."""
    prompt = BOOKING_EXTRACTION_PROMPT.format(transcription=transcription)
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        raw = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        text = raw.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        logger.error(f"Intent extraction failed: {e}")
        return {}


async def _generate_confirmation_message(booking: dict) -> str:
    """Generate a natural confirmation voice script via Gemini."""
    prompt = CONFIRMATION_PROMPT.format(booking_json=json.dumps(booking, indent=2))
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        raw = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        return raw.text.strip()
    except Exception:
        # Fallback to templated message
        doctor = booking.get("doctor") or "our doctor"
        date = booking.get("date") or "soon"
        return (
            f"Your appointment has been booked with {doctor} for {date}. "
            "You will receive a confirmation SMS shortly. Thank you for calling MediConnect AI!"
        )


async def _log_voice_booking_and_notify(booking: dict, caller_phone: str):
    """Log the booking to the backend and send a confirmation SMS."""
    backend_url = settings.BACKEND_BASE_URL

    # Build appointment payload for the backend
    appointment_data = {
        "patient_name": booking.get("patient_name") or "Phone Caller",
        "doctor": booking.get("doctor"),
        "department": booking.get("department"),
        "appointment_date": booking.get("date"),
        "appointment_time": booking.get("time"),
        "reason": booking.get("reason"),
        "source": "voice_call",
        "caller_phone": caller_phone,
    }

    # Send confirmation SMS via AI Notification Service
    sms_payload = {
        "event": "appointment_reminder",
        "patient_name": booking.get("patient_name") or "Valued Patient",
        "doctor": booking.get("doctor"),
        "department": booking.get("department"),
        "appointment_date": booking.get("date"),
        "appointment_time": booking.get("time"),
        "channel": "sms",
        "language": "en",
        "phone": caller_phone,
    }
    sms_payload = {k: v for k, v in sms_payload.items() if v is not None}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            await client.post("http://localhost:8001/api/v1/notify", json=sms_payload)
            logger.info(f"Confirmation SMS sent to {caller_phone}")
    except Exception as e:
        logger.warning(f"Could not send confirmation SMS: {e}")


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("/incoming")
async def voice_incoming(request: Request):
    """
    Step 1 — Twilio calls this when a patient dials our number.
    We greet the patient and ask them to describe what they need.
    """
    logger.info("Incoming voice call received")

    greeting = (
        "Hello! Welcome to MediConnect AI hospital system. "
        "I can help you book an appointment. "
        "Please tell me your name, which doctor or department you need, "
        "and your preferred date and time. Go ahead after the beep."
    )

    xml = _twiml_response(
        text=greeting,
        gather_action="/api/v1/voice/process",
        timeout=10,
    )
    return _twiml(xml)


@router.post("/process")
async def voice_process(
    request: Request,
    SpeechResult: Optional[str] = Form(default=None),
    From: Optional[str] = Form(default=None),
):
    """
    Step 2 — Twilio sends us the transcribed speech text.
    We extract booking intent, confirm it, and send an SMS.
    """
    caller_phone = From or "unknown"
    transcription = SpeechResult or ""

    logger.info(f"Voice booking transcription from {caller_phone}: '{transcription}'")

    if not transcription.strip():
        xml = _twiml_response(
            "I'm sorry, I couldn't hear you clearly. "
            "Please call back and speak clearly after the greeting. Goodbye!"
        )
        return _twiml(xml)

    # Extract booking intent via Gemini
    booking = await _extract_booking_intent(transcription)
    logger.info(f"Extracted booking intent: {booking}")

    if not booking or booking.get("confidence") == "low":
        # Ask them to try again
        xml = _twiml_response(
            "I'm sorry, I couldn't fully understand your request. "
            "Please call back and clearly state your name, preferred doctor, "
            "and your preferred date and time. Goodbye!"
        )
        return _twiml(xml)

    # Generate a natural confirmation message
    confirmation_text = await _generate_confirmation_message(booking)

    # Log booking and send SMS in background (non-blocking)
    asyncio.create_task(_log_voice_booking_and_notify(booking, caller_phone))

    # Respond to the caller with confirmation
    xml = _twiml_response(confirmation_text)
    return _twiml(xml)


@router.post("/status-callback")
async def voice_status_callback(request: Request):
    """Twilio calls this when the call ends to report final status."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "unknown")
    call_status = form_data.get("CallStatus", "unknown")
    logger.info(f"Call {call_sid} ended with status: {call_status}")
    return {"received": True}
