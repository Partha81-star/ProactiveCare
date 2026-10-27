"""Browser microphone simulation uses exactly the same state machine as calls."""
from uuid import uuid4
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.voice.handler import backend
from app.voice.staff import require_staff

router = APIRouter(prefix='/api/v1/voice/local', tags=['Local Voice Simulation'])


class SimulateRequest(BaseModel):
    text: str = Field(default='', max_length=1500)
    session_id: str | None = None
    phone: str = Field(pattern=r'^\+[1-9]\d{7,14}$')
    step: int = Field(default=0, ge=0)


@router.post('/simulate', dependencies=[Depends(require_staff)])
async def simulate(payload: SimulateRequest):
    sid = payload.session_id or f'local:{uuid4()}'
    response = await backend('/voice/turn', {'session_id': sid, 'phone': payload.phone,
                                          'text': payload.text, 'step': payload.step})
    return {**response, 'session_id': sid, 'audio_base64': None}
