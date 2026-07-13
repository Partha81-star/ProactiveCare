# ProactiveCare – AI Notification Service

This is the AI Communication Engine microservice for ProactiveCare. It receives hospital events, generates personalized, multilingual, safe notifications using Google Gemini, and delivers them via WhatsApp, SMS, or Email using a resilient fallback mechanism.

## Integration Guide for Frontend and Backend Teams

This service runs independently on **port 8001** to ensure AI processing doesn't block the main FastAPI backend.

### Running the Service Locally

1. Setup the virtual environment and install dependencies:
   ```bash
   py -3.13 -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and fill in credentials:
   ```bash
   cp .env.example .env
   ```
   *(Note: Leave Twilio and SMTP fields blank to run in Mock Mode during development, which simulates delivery by printing to the console).*

3. Start the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

### API Contracts

You can view the interactive Swagger documentation at: `http://localhost:8001/docs`

#### 1. Send Notification (`POST /api/v1/notify`)

**Endpoint to trigger an AI message generation and delivery.**

**Request Body (JSON):**
```json
{
  "event": "appointment_reminder",
  "patient_name": "Rahul Sharma",
  "doctor": "Dr. Mehta",
  "department": "Cardiology",
  "appointment_date": "15 July 2026",
  "appointment_time": "10:30 AM",
  "language": "hi",
  "channel": "whatsapp",
  "phone": "+919876543210",
  "email": "rahul@gmail.com",
  "additional_info": {}
}
```

**Supported Event Types:**
`appointment_reminder`, `appointment_rescheduled`, `appointment_cancelled`, `medicine_reminder`, `lab_report_ready`, `test_result_available`, `surgery_reminder`, `vaccination_reminder`, `admission_confirmation`, `discharge_instructions`, `follow_up_reminder`, `emergency_notification`

**Supported Languages:**
`en` (English), `hi` (Hindi), `mr` (Marathi)

**Supported Channels (Fallback Order):**
`whatsapp` → `sms` → `email`

**Success Response:**
```json
{
  "request_id": "uuid",
  "status": "delivered",
  "channel": "whatsapp",
  "message_preview": "Message text preview...",
  "timestamp": "2026-07-13T10:30:20"
}
```

#### 2. Health Check (`GET /api/v1/health`)
Used to verify the AI engine is online. Returns `200 OK` with basic service metadata.

## Architecture & Features

- **Decoupled:** Runs as a separate FastAPI service.
- **Resilient Fallback:** Automatically tries WhatsApp → SMS → Email if the preferred channel fails.
- **Safety First:** Multi-layer validation filters sensitive medical terms (PII) and prevents test result leaks.
- **Multilingual Native:** AI translates intrinsically during generation instead of relying on a post-translation API, leading to more natural responses.
- **Mock Mode:** Can develop and test logic locally without using real Twilio/SMTP credits.

## Running Tests
Run the test suite using pytest:
```bash
pytest
```
