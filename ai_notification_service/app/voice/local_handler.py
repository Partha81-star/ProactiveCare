from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import httpx
import re
from app.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/voice/local", tags=["Local Voice Simulation"])

OLLAMA_URL = "http://localhost:11434/api/chat"
BACKEND_URL = "http://localhost:8000/api"

class Message(BaseModel):
    role: str
    content: str

class SimulateRequest(BaseModel):
    text: str
    chat_history: List[Message]
    phone: Optional[str] = "+919067829174"

SYSTEM_PROMPT = """You are MediConnect AI, a warm, professional hospital receptionist. 
Your goal is to book an appointment for the patient. 
Keep your conversational responses extremely brief (1-2 sentences maximum).

Ask for the following details one by one if they are missing:
1. Patient's Full Name
2. Preferred Doctor (e.g., Dr. Patel, Dr. Chen) or Department
3. Date of the appointment
4. Preferred Time slot

Once (and ONLY once) you have collected all 4 of these details, you must finalize the booking by appending a JSON block at the very end of your response exactly like this:
```json
{
  "action": "book_appointment",
  "patient_name": "extracted patient name",
  "doctor": "extracted doctor name",
  "date": "extracted date (e.g., tomorrow, July 20th)",
  "time": "extracted time (e.g., 10:00 AM)",
  "reason": "extracted reason if any, else general consultation"
}
```
Do not output the JSON block until all 4 details are explicitly provided by the user. If you are missing any detail, continue the conversation politely.
"""

@router.post("/simulate")
async def simulate_voice_turn(payload: SimulateRequest):
    logger.info(f"Received local simulation text: '{payload.text}'")

    # Format the message payload for Ollama
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in payload.chat_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": payload.text})

    ollama_payload = {
        "model": "llama3.2",
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(OLLAMA_URL, json=ollama_payload)
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to communicate with local Ollama.")
            
            result = response.json()
            reply_text = result.get("message", {}).get("content", "").strip()
            
    except httpx.ConnectError:
        logger.error("Could not connect to Ollama. Is it running?")
        return {
            "reply": "I'm sorry, I cannot connect to my local LLM brain. Please make sure Ollama is installed and running on your system with 'ollama run llama3.2'.",
            "booking_triggered": False
        }
    except Exception as e:
        logger.error(f"Error calling Ollama: {e}")
        return {
            "reply": "I encountered an error trying to process your request locally.",
            "booking_triggered": False
        }

    # Search for JSON block in the reply
    json_match = re.search(r"```json\s*(.*?)\s*```", reply_text, re.DOTALL)
    booking_triggered = False
    clean_reply = reply_text

    if json_match:
        try:
            json_str = json_match.group(1)
            booking_data = json.loads(json_str)
            
            if booking_data.get("action") == "book_appointment":
                booking_triggered = True
                
                # Strip the JSON block from the speech text so the browser doesn't read the raw JSON
                clean_reply = re.sub(r"```json\s*(.*?)\s*```", "", reply_text, flags=re.DOTALL).strip()
                
                # Execute the SQLite DB update in the background
                await _save_appointment_to_db(booking_data, payload.phone)
        except Exception as e:
            logger.error(f"Failed to parse booking JSON from LLM: {e}")

    return {
        "reply": clean_reply,
        "booking_triggered": booking_triggered
    }

async def _save_appointment_to_db(data: dict, phone: str):
    patient_name = data.get("patient_name") or "Local Caller"
    doctor_name = data.get("doctor") or "General Practitioner"
    date_str = data.get("date") or "2026-07-20"
    time_str = data.get("time") or "09:00 AM"

    # Default ISO date string format
    appointment_time = f"{date_str} {time_str}"
    try:
        from datetime import datetime
        appointment_time = datetime.now().isoformat()  # Mock parse
    except Exception:
        pass

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # 1. Register/Find patient
            patient_payload = {
                "name": patient_name,
                "email": f"{phone.strip('+')}@local-voice.com",
                "phone": phone
            }
            p_res = await client.post(f"{BACKEND_URL}/patients/", json=patient_payload)
            patient_id = p_res.json().get("id", 1) if p_res.status_code == 200 else 1

            # 2. Get first doctor ID
            d_res = await client.get(f"{BACKEND_URL}/doctors/")
            docs = d_res.json()
            doctor_id = docs[0]["id"] if docs else 1

            # 3. Create appointment
            appt_payload = {
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "appointment_time": appointment_time,
                "status": "Scheduled",
                "notes": data.get("reason") or "Booked via Local AI Receptionist"
            }
            await client.post(f"{BACKEND_URL}/appointments/", json=appt_payload)
            logger.info("Local Voice simulation successfully saved appointment to SQLite database!")
            
            # 4. Trigger Outbound confirmation SMS via AI Service
            sms_payload = {
                "event": "appointment_reminder",
                "patient_name": patient_name,
                "doctor": doctor_name,
                "appointment_date": date_str,
                "appointment_time": time_str,
                "channel": "sms",
                "phone": phone
            }
            await client.post("http://localhost:8001/api/v1/notify", json=sms_payload)
    except Exception as e:
        logger.error(f"Failed to write local voice booking to database: {e}")
