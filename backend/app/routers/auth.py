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

def _get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token")
    email = ACTIVE_TOKENS.get(creds.credentials)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return STAFF_USERS[email] | {"email": email}


# ── Endpoints ────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    """Authenticate staff and return a session token."""
    user = STAFF_USERS.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = f"mock-jwt-{body.email}-{int(time.time())}"
    ACTIVE_TOKENS[token] = body.email

    return {
        "user": {"id": body.email, "name": user["name"], "role": user["role"], "email": body.email},
        "token": token,
    }


@router.post("/logout")
def logout(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Invalidate the session token."""
    if creds and creds.credentials in ACTIVE_TOKENS:
        del ACTIVE_TOKENS[creds.credentials]
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
