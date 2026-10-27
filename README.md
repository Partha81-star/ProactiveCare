# ProactiveCare / MediConnect

Patient registration, doctor management and appointments with an inbound phone receptionist. React runs on 5173, the core FastAPI backend on 8000, and the voice/notification gateway on 8001.

The default receptionist is a local, deterministic conversation algorithm. It does not require Gemini, Ollama, ElevenLabs or an OpenAI key. Twilio provides phone connectivity, speech recognition and speech playback; those services require a Twilio account for real calls. Gemini remains optional for the existing notification generation endpoint.

## Run locally on Windows

Install Python 3.12 and Node.js 24, then run from the repository root:

```powershell
./scripts/setup.ps1
py -3.12 scripts/dev.py
```

Keep this terminal open. Ctrl+C stops all three services. The launcher stops the other services if one exits. It binds locally for development. Open http://localhost:5173 and sign in with `admin@mediconnect.ai` / `admin123`. These demo accounts work only with `APP_ENV=development`; production requires `STAFF_ADMIN_EMAIL` and `STAFF_ADMIN_PASSWORD`.

The old `venv` folders may reference a removed Python installation. Setup creates separate `.venv` folders without changing those old environments. SQLite defaults to `backend/mediconnect.db`, regardless of the working directory. Existing local data is preserved. Database files are excluded from new commits.

Add the actual doctors in Doctor Management before booking. Set their names, department, email and availability. Choose an explicit appointment date/time in the web forms. Voice bookings appear in the same appointment registry, with live refresh and a 15-second polling fallback.

## Test the receptionist without a phone account

Enter a phone number with country code in the appointment form, then open the browser voice simulation. Chrome microphone permission is required. The browser handles speech input/output; it uses the same persistent booking conversation as telephone calls. In production, sign in as staff first; the voice gateway verifies the staff session with the backend.

The agent asks for full name, doctor/department, date and time separately. It reads back the details and books only after “yes”. It can list doctors, state booking hours and direct medical questions to a clinician. It does not diagnose or prescribe. Supported date examples: `tomorrow`, `day after tomorrow`, `20 October`, `2026-10-20`. Time examples: `10 AM`, `10:30 AM`, `14:00`. Ambiguous times trigger a clarification.

## Phone number for testing the receptionist

Call **+1 229 663 4470** (dial as `+12296634470`) to test the configured telephone receptionist.

- This is a **US number**. Calls from India require a carrier or internet calling service that supports US telephone calls; international charges may apply.
- The backend, voice service, public edge and tunnel must be running. Follow **No Render: run the portal and phone agent from this computer** below. Starting the web app alone does not make the phone number ready.
- Follow any Twilio trial announcement, then give your full name, doctor or department, appointment date and preferred time. Say **yes** after the agent reads back the details. Wait for the appointment reference, then check the portal's **Appointments** page.
- The current setup uses a Twilio trial account, so provider trial restrictions apply. A successful webhook check does not guarantee that a calling app or carrier can complete the telephone call.

If international dialing is unavailable, a developer can arrange an agent callback to a verified patient number using the account's available Twilio balance. This requires a separate outbound call; it does not happen automatically when the project starts.

This is a development test number, not an emergency or continuously staffed clinic line.

## No Render: run the portal and phone agent from this computer

The current public address is **https://platform-uproar-unwilling.ngrok-free.dev**. It serves the built React portal and selected staff APIs through `scripts/public_edge.py`; Twilio callbacks reach the same voice gateway. The full-stack public edge and signed call probe passed on 28 October 2026. Production staff credentials are stored locally in the ignored `.runtime/staff-login.txt` file; the demo password is disabled on the public edge. The current Twilio incoming-call webhook points to this ngrok address.

This uses the existing Windows computer as the server. Keep the backend on `127.0.0.1:8010`, the voice service on `127.0.0.1:8001`, `scripts.public_edge:app` on `127.0.0.1:8003`, and ngrok forwarding its assigned dev domain to port 8003. The database remains the local SQLite file. If the computer sleeps, loses power or internet, or a process stops, the website and phone agent stop answering. This is a working no-Render test deployment, not an always-on hosted clinic service. [ngrok's free plan](https://ngrok.com/pricing) has request and bandwidth limits and may show a browser warning page.

After reboot, start the four processes in separate terminals from the repository root (use the same assigned ngrok URL and existing ignored `.env` files):

```powershell
cd backend; ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8010
cd ai_notification_service; ./.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
./ai_notification_service/.venv/Scripts/python.exe -m uvicorn scripts.public_edge:app --host 127.0.0.1 --port 8003
ngrok http 8003 --url https://platform-uproar-unwilling.ngrok-free.dev
```

Run each command from the repository root unless it begins with `cd`; the first two terminals should change into their own service folders. Rebuild the frontend with `VITE_API_BASE_URL=https://platform-uproar-unwilling.ngrok-free.dev/api` and `VITE_VOICE_BASE_URL=https://platform-uproar-unwilling.ngrok-free.dev` if its source changes.

To verify this setup after restarting the services, run:

```powershell
./ai_notification_service/.venv/Scripts/python.exe scripts/smoke_public_edge.py
$env:PUBLIC_EDGE_TEST_URL='https://platform-uproar-unwilling.ngrok-free.dev'
./ai_notification_service/.venv/Scripts/python.exe scripts/smoke_public_edge.py
./ai_notification_service/.venv/Scripts/python.exe scripts/connect_phone.py activate
```

The public edge allows signed Twilio callbacks and staff-authenticated portal requests. It does not expose the backend's internal `/api/voice` booking route. Use real patient information only after reviewing the local computer's backup, access and privacy controls.

## Activate a real Twilio number

1. Create a Twilio account and obtain a voice-enabled phone number. An existing number must be ported or forwarded using your carrier/provider; the application cannot take control of an arbitrary telephone number.
2. Configure `backend/.env` and `ai_notification_service/.env` using their examples. Use the same randomly generated `SERVICE_TOKEN` in both. Do not commit credentials.
3. Expose the voice gateway through a public HTTPS domain or a development tunnel forwarding to port 8001. Set `PUBLIC_BASE_URL` to that exact HTTPS origin. Keep the backend private; the gateway accesses it through `BACKEND_BASE_URL`.
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_PHONE_NUMBER` in the gateway environment. When the token is set, incoming requests must have a valid Twilio signature, including in development.
5. In the number's Twilio voice configuration, set **A call comes in** to **Webhook / POST** at `https://YOUR_DOMAIN/api/v1/voice/incoming`. Configure the call status callback as POST to `https://YOUR_DOMAIN/api/v1/voice/status-callback`.
6. Restart the services, call the number, answer each prompt, and say yes after the readback. Check the appointment reference in the portal. A real provider call is the final activation test; the automated tests simulate the provider's HTTP requests.

Use `APP_ENV=production` for deployment, a strong service token, real staff credentials and HTTPS. Configure `CORS_ORIGINS` in each service and `VITE_API_BASE_URL` / `VITE_VOICE_BASE_URL` before building the frontend. Serve the frontend build with SPA fallback. Run the backend behind a process supervisor and back up its database. There is no promise of uninterrupted availability from a development terminal or temporary tunnel.

Twilio contracts: [Gather](https://www.twilio.com/docs/voice/twiml/gather) and [request validation](https://www.twilio.com/docs/usage/security#validating-requests).

### Connect a development tunnel safely

`scripts/voice_edge.py` exposes only the three Twilio callback routes. Start it using the gateway Python environment:

```powershell
./ai_notification_service/.venv/Scripts/python.exe -m uvicorn scripts.voice_edge:app --host 127.0.0.1 --port 8002
```

Point a Cloudflare Tunnel at `http://127.0.0.1:8002`, rather than exposing the whole gateway. With cloudflared installed, run `cloudflared tunnel --url http://127.0.0.1:8002 --no-autoupdate`. Use the HTTPS origin printed by that process:

```powershell
./ai_notification_service/.venv/Scripts/python.exe scripts/connect_phone.py configure https://YOUR_PUBLIC_HOST
# Restart scripts/dev.py so both services load the new environment.
./ai_notification_service/.venv/Scripts/python.exe scripts/connect_phone.py activate
```

The activation script verifies the public signed greeting, checks that unsigned requests and private routes are blocked, then updates the existing Twilio number's voice URL and status callback. It does not place a call or buy a number. Previous routing settings are saved locally in `.runtime/phone-routing-backup.json`. Secrets remain in ignored env files.

Keep the project, edge and tunnel processes running for inbound calls. A [Cloudflare quick tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) is temporary: if restarted, it gets a different address, so repeat configuration and activation. For reliable ongoing reception, deploy to a stable HTTPS host or a named tunnel running as a supervised service; the desktop must stay awake when hosting locally.

## Deploy the full project on Render

The repository's `render.yaml` defines three services: a static React portal, a FastAPI backend, and a FastAPI voice gateway, plus persistent PostgreSQL. It selects always-on paid web services and a paid database because a sleeping service cannot reliably answer a phone call. Check the current [Render pricing](https://render.com/pricing) before creating the Blueprint. Twilio calls and optional AI features have separate usage costs. A free Render database expires and a free web service sleeps, so those plans are for temporary demos only.

1. Connect this GitHub repository to Render and create a [Blueprint](https://render.com/docs/infrastructure-as-code) from `main` using `render.yaml`. Review its proposed services and charges before confirming creation.
2. When Render prompts for secrets, set `STAFF_ADMIN_EMAIL` and a strong `STAFF_ADMIN_PASSWORD` for the backend, plus `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` for the voice service. Copy these Twilio values from your own provider dashboard or ignored local `.env`; never commit them. `SERVICE_TOKEN` is generated once and shared between services by the Blueprint. Add `GEMINI_API_KEY` only if you want the optional AI notification and browser transcription features.
3. Check that Render assigned the expected hostnames: `proactivecare-partha81-web.onrender.com`, `proactivecare-partha81-api.onrender.com`, and `proactivecare-partha81-voice.onrender.com`. If Render changes a hostname, update every matching URL in the Blueprint and resync/rebuild before use. Confirm the frontend loads, backend `/health/ready` returns ready, and voice `/api/v1/health` returns healthy.
4. Sign in with the production staff email/password and add doctors in **Doctor Management**. The hosted PostgreSQL database starts empty. Existing local SQLite patients and appointments are **not** copied by a Git push; migrate them separately before using the hosted portal as the source of truth.
5. In the Twilio number settings, set **A call comes in** to `POST https://proactivecare-partha81-voice.onrender.com/api/v1/voice/incoming` and its status callback to `POST https://proactivecare-partha81-voice.onrender.com/api/v1/voice/status-callback`. Make one real call and verify its appointment appears in the hosted portal. Turn off the local quick-tunnel route only after the hosted call succeeds.

For production use with real patients, review hosting, access, backup, retention, and applicable health-data obligations before entering patient information. The demo Twilio account also has trial call restrictions; a stable web host alone does not remove them.

## Optional Vapi integration

Use Vapi's hosted conversational model and custom function tools rather than the old `/voice/local/chat/completions` Ollama proxy. That proxy has been removed. Configure the server URL as `https://YOUR_DOMAIN/api/v1/voice/webhook` and a secret header `X-Vapi-Secret` matching `VAPI_WEBHOOK_SECRET`.

Supported tools:

- `list_doctors`: no arguments; returns registered doctors and departments.
- `book_appointment`: `patient_name` (string), `doctor` (string), `appointment_time` (absolute ISO timestamp in hospital time or with explicit UTC offset), `confirmed` (boolean), optional `reason` (string). Require all four primary arguments in the tool definition. The caller must agree to the readback before the assistant sets `confirmed=true`.

The verified caller phone and call ID come from Vapi's webhook, never a hardcoded fallback. Tool IDs provide idempotency. Success includes the committed appointment ID; failures return an `error` string for the relevant tool. See [Vapi function tools](https://docs.vapi.ai/tools/custom-tools).

## Database and reliability

- SQLite works locally. Set `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/mediconnect` for PostgreSQL; the driver is included. Both services must reach the same core backend, which owns the database.
- Patient creation, appointment creation and booking receipt commit in one transaction. Replayed booking keys return the original appointment; different details using the same key are rejected.
- A unique partial index prevents two active appointments for the same doctor and timestamp, including concurrent requests. Cancelled slots can be booked again. Existing overlapping bookings cause index migration to fail rather than deleting records; review those records before starting the upgraded backend.
- Voice sessions persist in the database and expire after two hours. Stale/repeated turns cannot create another appointment. Staff sessions are stored as token hashes and expire after twelve hours; logout revokes them.
- Hospital time defaults to `Asia/Kolkata`; offset timestamps are converted to hospital wall time for the existing schema. Configure `HOSPITAL_TIMEZONE`, `BOOKING_OPEN_HOUR` and `BOOKING_CLOSE_HOUR` in the backend. Slots are 30 minutes, default 09:00–17:00 daily. “Off Duty”, “On Leave” and “Unavailable” doctors are rejected. Arbitrary free-text per-doctor schedules and holiday calendars are not interpreted; configure those separately before relying on them.
- A gateway timeout reports unverified status rather than false success. Receipts allow reconciliation by replaying the same operation. Websocket outages cannot undo a saved booking.

## Notifications

The portal prepares a local message draft using actual patient/appointment data. Review it before sending. The backend passes the reviewed text through validation and the configured SMS/email/WhatsApp dispatcher. Development mocks are labeled **simulated**; provider acceptance is labeled **accepted**, not verified delivery. Automatic voice confirmation SMS, delivery receipt tracking and durable scheduled reminders are not implemented in this change; the phone agent confirms the saved appointment by voice. Legacy notification logs lack complete resend payloads, so resend directs staff back to the message generator.

## Verification and CI

```powershell
cd backend
./.venv/Scripts/python.exe -m pytest -q --basetemp .test-tmp
cd ../ai_notification_service
./.venv/Scripts/python.exe -m pytest -q --basetemp .test-tmp
cd ../mediconnect-ai
npm run lint
npm run build
cd ..
py -3.12 scripts/smoke_call.py
```

The smoke test starts both services against an isolated database, simulates a Twilio call, restarts the backend before confirmation, retries the final webhook and verifies exactly one appointment through the staff API. No external phone or AI requests are made. GitHub Actions runs both Python suites, this integration test, lint and the production build on pushes and pull requests.
