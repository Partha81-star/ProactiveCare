import asyncio

from fastapi import APIRouter, File, HTTPException, UploadFile
from google import genai
from google.genai import types

from app.config import get_settings


router = APIRouter(prefix="/api/v1/voice", tags=["voice"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_AUDIO_TYPES = {
    "audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4",
    "audio/x-m4a", "video/webm",
}


@router.post("/transcribe")
async def transcribe_recording(audio: UploadFile = File(...)) -> dict[str, str]:
    """Transcribe a short browser microphone recording for the receptionist."""
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Voice transcription is not configured.")

    mime_type = (audio.content_type or "audio/webm").split(";", 1)[0].lower()
    if mime_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported audio recording format.")

    content = await audio.read(MAX_AUDIO_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The recording is empty. Please try again.")
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Recording is too large. Keep each answer under one minute.")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=[
                "Transcribe this appointment booking answer exactly. Return only the spoken words. "
                "The speaker may use Indian English, Hindi names, doctor names, dates, or times.",
                types.Part.from_bytes(data=content, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(temperature=0, max_output_tokens=200),
        )
        transcript = (response.text or "").strip().strip('"')
        if not transcript:
            raise HTTPException(status_code=422, detail="No speech was detected. Please record again.")
        return {"text": transcript}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not transcribe the recording. Please try again.") from exc
