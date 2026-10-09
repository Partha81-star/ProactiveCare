"""
main.py
--------
FastAPI application entry point.

Ports:
  8000 — This backend (patients, doctors, appointments, auth, notifications)
  8001 — AI Notification microservice
  5173 — React frontend (Vite dev server)
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base
from app.routers import doctor, patient, appointment
from app.routers import auth, notification as notification_router
from app.routers import booking
from app.models import voice as voice_model  # noqa: F401

# Models — must be imported before create_all() so SQLAlchemy knows about them
from app.models import doctor as doctor_model       # noqa: F401
from app.models import patient as patient_model     # noqa: F401
from app.models import appointment as appt_model    # noqa: F401
from app.models import notification as notif_model  # noqa: F401

# Create all tables in SQLite if they don't exist yet
Base.metadata.create_all(bind=engine)
# create_all does not add indexes to existing tables. This additive migration
# deliberately fails on legacy double bookings instead of deleting patient data.
for index in appt_model.Appointment.__table__.indexes:
    index.create(bind=engine, checkfirst=True)

app = FastAPI(
    title="MediConnect AI – Backend",
    description="Core CRUD APIs for Patients, Doctors, Appointments, Auth, and Notifications",
    version="1.0.0",
)


from sqlalchemy.exc import IntegrityError
from fastapi.responses import JSONResponse


@app.exception_handler(IntegrityError)
async def database_conflict(request, exception):
    return JSONResponse(status_code=409, content={'detail': 'This change conflicts with an existing or related record. Verify the details before retrying.'})

# ── CORS ─────────────────────────────────────────────────────────────
# Allow the React frontend (localhost:5173) and AI service (localhost:8001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', '').split(',') if os.getenv('CORS_ORIGINS') else [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8001",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes — all under /api prefix to match frontend api.js ──────────
app.include_router(auth.router,                prefix="/api")
staff_access = [Depends(auth._get_current_user)]
app.include_router(doctor.router,              prefix="/api", dependencies=staff_access)
app.include_router(patient.router,             prefix="/api", dependencies=staff_access)
app.include_router(appointment.router,         prefix="/api", dependencies=staff_access)
app.include_router(notification_router.router, prefix="/api", dependencies=staff_access)
app.include_router(booking.router, prefix="/api")

# ── WebSocket Real-Time Dashboards ──────────────────────────────────
from fastapi import WebSocket, WebSocketDisconnect
from app.websocket import manager

@app.websocket("/ws/appointments")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep client connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def root():
    """Health check — confirms the backend is running."""
    return {
        "message": "MediConnect AI backend is running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get('/health/ready')
def readiness():
    from sqlalchemy import text
    with engine.connect() as connection:
        connection.execute(text('SELECT 1'))
    return {'status': 'ready'}
