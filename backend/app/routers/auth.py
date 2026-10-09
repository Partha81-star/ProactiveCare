"""
routers/auth.py
----------------
Auth endpoints: login (mock JWT), profile, logout.
Since there is no auth database table yet, we use a hardcoded
STAFF_USERS dict that mirrors the frontend's MOCK_USERS.
This gives the frontend a real API call while still being
runnable without a user management system.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import time
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.staff_session import StaffSession

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)

# ── Mirrors the frontend MOCK_USERS exactly ──────────────────
STAFF_USERS = {
    "admin@mediconnect.ai":  {"password": "admin123",  "name": "Dr. Admin User",   "role": "admin"},
    "doctor@mediconnect.ai": {"password": "doctor123", "name": "Dr. Emily Chen",   "role": "doctor"},
    "nurse@mediconnect.ai":  {"password": "nurse123",  "name": "Nurse Sarah Kim",  "role": "nurse"},
}

# Simple in-memory token store  {token: user_email}
ACTIVE_TOKENS: dict[str, str] = {}


def staff_users():
    users = dict(STAFF_USERS) if os.getenv('APP_ENV', 'development') == 'development' else {}
    email, password = os.getenv('STAFF_ADMIN_EMAIL'), os.getenv('STAFF_ADMIN_PASSWORD')
    if email and password:
        users[email] = {'password': password, 'name': 'Hospital Administrator', 'role': 'admin'}
    return users


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


# ── Request / Response models ────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    user: dict
    token: str

class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


# ── Helper ───────────────────────────────────────────────────

def _get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token")
    session = db.get(StaffSession, token_hash(creds.credentials))
    if not session or session.expires_at < datetime.utcnow() or session.email not in staff_users():
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return staff_users()[session.email] | {"email": session.email}


# ── Endpoints ────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate staff and return a session token."""
    user = staff_users().get(body.email)
    if not user or not secrets.compare_digest(user['password'].encode(), body.password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = secrets.token_urlsafe(48)
    db.add(StaffSession(token_hash=token_hash(token), email=body.email, expires_at=datetime.utcnow() + timedelta(hours=12)))
    db.commit()

    return {
        "user": {"id": body.email, "name": user["name"], "role": user["role"], "email": body.email},
        "token": token,
    }


@router.post("/logout")
def logout(creds: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Invalidate the session token."""
    session = db.get(StaffSession, token_hash(creds.credentials)) if creds else None
    if session:
        db.delete(session)
        db.commit()
    return {"message": "Logged out successfully"}


@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: dict = Depends(_get_current_user)):
    """Return the currently authenticated user's profile."""
    return {
        "id": current_user["email"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
    }
