"""
ProactiveCare – FastAPI Application Entry Point
=================================================

This is the main entry point for the AI Notification Service.

Architecture:
    - Uses FastAPI's lifespan context manager for clean startup/shutdown
    - CORS middleware allows the frontend (Member 1) to call this service
    - API routes are versioned under /api/v1/ for future compatibility
    - Health check at /api/v1/health lets the backend verify this service is alive

Run the service:
    uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logger import setup_logging, get_logger
from app.routes import router
from app.voice.handler import router as voice_router
from app.voice.local_handler import router as local_voice_router
from app.scheduler import start_scheduler, stop_scheduler


# ── Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application startup and shutdown events.

    Startup:
        - Initialize logging
        - Validate configuration
        - Log service readiness

    Shutdown:
        - Clean up resources (scheduler, connections)
        - Log graceful shutdown
    """
    # ── STARTUP ──────────────────────────────────────────────
    settings = get_settings()

    # Initialize structured logging
    setup_logging(
        log_level=settings.LOG_LEVEL,
        use_colors=settings.is_development,
    )

    logger = get_logger(__name__)
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"  Environment: {settings.APP_ENV}")
    logger.info(f"  AI Model: {settings.GEMINI_MODEL}")
    logger.info(f"  Twilio: {'configured' if settings.twilio_configured else 'MOCK MODE'}")
    logger.info(f"  SMTP: {'configured' if settings.smtp_configured else 'MOCK MODE'}")
    logger.info("=" * 60)
    logger.info("Service is ready to accept notification requests.")

    # Start the notification scheduler
    start_scheduler()

    yield  # ← App runs here

    # ── SHUTDOWN ─────────────────────────────────────────────
    stop_scheduler()
    logger.info("Shutting down gracefully...")
    logger.info("Service stopped.")


# ── FastAPI App ──────────────────────────────────────────────────
def create_app() -> FastAPI:
    """
    Application factory — creates and configures the FastAPI app.

    Why a factory function?
        1. Testability:  Tests can create fresh app instances
        2. Configuration: Different configs for dev/test/prod
        3. Clean imports: No side effects on import
    """
    settings = get_settings()

    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AI-powered communication engine for hospitals. "
            "Generates personalized, multilingual notifications "
            "and delivers them via Email, SMS, or WhatsApp."
        ),
        docs_url="/docs",        # Swagger UI at /docs
        redoc_url="/redoc",      # ReDoc at /redoc
        lifespan=lifespan,
    )

    # ── CORS Middleware ──────────────────────────────────────
    # Allows the React frontend (Member 1) and FastAPI backend (Member 2)
    # to call this service from different origins.
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",   # React dev server
            "http://localhost:8000",   # FastAPI backend
            "http://localhost:5173",   # Vite dev server (if used)
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register Routes ──────────────────────────────────────
    # Include the notification API routes
    application.include_router(router)
    # Include the AI voice booking routes
    application.include_router(voice_router)
    # Include local voice simulation routes
    application.include_router(local_voice_router)

    # Health check endpoint
    @application.get(
        "/api/v1/health",
        tags=["Health"],
        summary="Service health check",
    )
    async def health_check():
        """
        Health check endpoint.

        The backend (Member 2) can call this to verify
        the AI Notification Service is running and ready.
        """
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "ai_model": settings.GEMINI_MODEL,
        }

    return application


# Create the app instance that uvicorn will serve
app = create_app()
