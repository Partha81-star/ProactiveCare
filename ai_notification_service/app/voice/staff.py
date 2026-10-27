"""Check browser voice requests against the backend's revocable staff session."""
import httpx
from fastapi import Header, HTTPException

from app.config import get_settings


async def require_staff(authorization: str = Header(default='')):
    if get_settings().is_development:
        return
    if not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Staff sign-in is required for browser voice calls.')
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                get_settings().BACKEND_BASE_URL.rstrip('/') + '/api/auth/profile',
                headers={'Authorization': authorization},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(503, 'Staff verification is temporarily unavailable.') from exc
    if response.status_code != 200:
        raise HTTPException(401, 'Staff session expired. Please sign in again.')
