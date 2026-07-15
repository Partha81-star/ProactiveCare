"""
ProactiveCare – Application Configuration
==========================================

Uses pydantic-settings to load and validate ALL environment variables
at startup. If any required variable is missing, the app crashes
immediately with a clear error — no silent failures at runtime.

Usage in any module:
    from app.config import get_settings
    settings = get_settings()
    print(settings.GEMINI_API_KEY)

Why pydantic-settings over os.getenv()?
    1. Type coercion:  "8001" → int(8001) automatically
    2. Validation:     Missing keys fail at import, not at 2 AM
    3. Singleton:      One settings object shared everywhere via lru_cache
    4. IDE support:    Full autocomplete on all config values
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration for the AI Notification Service.

    All values are loaded from environment variables (or a .env file).
    Fields without defaults are REQUIRED — the app will not start without them.
    """

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "ProactiveCare AI Notification Service"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"  # development | staging | production
    APP_PORT: int = 8001
    APP_HOST: str = "0.0.0.0"

    # ── Google Gemini AI ─────────────────────────────────────────
    GEMINI_API_KEY: str  # Required — no default
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # ── Twilio (SMS & WhatsApp) ──────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""  # Optional for dev — mock mode if empty
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # ── Email (SMTP) ────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""  # Optional for dev — mock mode if empty
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@hospital.com"
    SMTP_FROM_NAME: str = "ProactiveCare Hospital"

    # ── Backend Integration ──────────────────────────────────────
    BACKEND_BASE_URL: str = "http://localhost:8000"
    BACKEND_WEBHOOK_URL: str = "http://localhost:8000/api/v1/notification-status"

    # ── ElevenLabs ──────────────────────────────────────────────
    ELEVEN_LABS_API_KEY: str = ""

    # ── Logging ──────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"

    # ── Pydantic Settings Config ────────────────────────────────
    # This tells pydantic-settings to read from a .env file
    # and ignore any extra variables it doesn't recognize.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.APP_ENV == "development"

    @property
    def twilio_configured(self) -> bool:
        """Check if Twilio credentials are provided (not mock mode)."""
        return bool(self.TWILIO_ACCOUNT_SID and self.TWILIO_AUTH_TOKEN)

    @property
    def smtp_configured(self) -> bool:
        """Check if SMTP credentials are provided (not mock mode)."""
        return bool(self.SMTP_USERNAME and self.SMTP_PASSWORD)


@lru_cache()
def get_settings() -> Settings:
    """
    Return a cached singleton Settings instance.

    Using lru_cache ensures we only parse env vars once.
    Every module that calls get_settings() gets the same object.
    """
    return Settings()
