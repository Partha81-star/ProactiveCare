"""
main.py
--------
This is the entrypoint of the FastAPI application. Run it with:
    uvicorn app.main:app --reload

What happens here:
1. We create the FastAPI app instance.
2. We tell SQLAlchemy to create all tables (Patients, Doctors, Appointments)
   in PostgreSQL if they don't already exist.
3. We "include" each router (doctor, patient, appointment) so their endpoints
   become part of the app.
4. We add CORS middleware so the React frontend (running on a different port)
   is allowed to call this API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import doctor, patient, appointment

# Import models so SQLAlchemy knows about them before create_all() runs.
# (Without these imports, Base.metadata wouldn't know these tables exist.)
from app.models import doctor as doctor_model     # noqa: F401
from app.models import patient as patient_model   # noqa: F401
from app.models import appointment as appointment_model  # noqa: F401

# Create all tables defined by our models, if they don't already exist in the DB.
# In a real production app you'd use a migration tool (Alembic) instead of this,
# but create_all() is simplest for a student project / early development.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediConnect AI - Backend",
    description="Core CRUD APIs for Patients, Doctors, and Appointments",
    version="0.1.0",
)

# Allow the React frontend (e.g. http://localhost:3000) to call this API.
# "*" is used here for simplicity during development — restrict this to your
# actual frontend URL before deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register each module's routes with the main app
app.include_router(doctor.router)
app.include_router(patient.router)
app.include_router(appointment.router)


@app.get("/")
def root():
    """Simple health-check endpoint to confirm the server is running."""
    return {"message": "MediConnect AI backend is running", "docs": "/docs"}
