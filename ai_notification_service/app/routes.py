"""
ProactiveCare – API Routes
============================

This is the wiring layer that connects the entire pipeline:
    Request → Validate → AI Generate → Safety Check → Language Check → Dispatch → Response

Endpoints:
    POST /api/v1/notify         — Send a single notification
    POST /api/v1/batch-notify   — Send multiple notifications
    GET  /api/v1/health         — Health check (defined in main.py)
"""

import asyncio
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Header
import secrets
from app.config import get_settings

from app.logger import get_logger
from app.schemas import (
    NotificationRequest,
    NotificationResponse,
    BatchNotificationRequest,
    BatchNotificationResponse,
    DeliveryStatus,
    Channel,
)
from app.ai_engine import generate_message
from app.validator import validate_message
from app.translator import validate_language
from app.notification.dispatcher import dispatch_notification
from app.utils import truncate_message
from pydantic import Field

logger = get_logger(__name__)

# ── Router with API version prefix ───────────────────────────
def service_auth(x_service_token: str = Header(default='')):
    settings = get_settings()
    if settings.SERVICE_TOKEN and not secrets.compare_digest(settings.SERVICE_TOKEN, x_service_token):
        raise HTTPException(401, 'Invalid service token')
    if not settings.SERVICE_TOKEN and not settings.is_development:
        raise HTTPException(503, 'SERVICE_TOKEN must be configured')

router = APIRouter(prefix="/api/v1", tags=["Notifications"], dependencies=[Depends(service_auth)])


class ReviewedMessage(NotificationRequest):
    message: str = Field(min_length=1, max_length=1600)


@router.post('/send-message')
async def send_reviewed_message(body: ReviewedMessage):
    validation = validate_message(body.message, body)
    if not validation.is_valid or validation.is_sanitized:
        raise HTTPException(422, 'Please revise the message before sending: it did not pass message validation.')
    result = await dispatch_notification(body, body.message)
    simulated = bool(result.message_id and result.message_id.startswith('mock-'))
    return {'status': 'simulated' if simulated else ('accepted' if result.success else 'failed'),
            'channel': result.channel, 'message_preview': body.message,
            'error': result.error}


# ═══════════════════════════════════════════════════════════════════
# CORE PIPELINE — The full notification processing pipeline
# ═══════════════════════════════════════════════════════════════════

async def _process_notification(request: NotificationRequest) -> NotificationResponse:
    """
    Execute the full notification pipeline for a single request.

    Pipeline steps:
        1. Generate AI message (ai_engine.py)
        2. Validate message safety (validator.py)
        3. Re-generate if validation fails (up to 2 retries)
        4. Validate language (translator.py)
        5. Dispatch via preferred channel with fallback (dispatcher.py)
        6. Build and return response

    Args:
        request: Validated notification request.

    Returns:
        NotificationResponse with delivery status.
    """
    try:
        # ── Step 1 & 2: Generate + Validate (with retry) ────
        message = None
        max_generation_attempts = 3

        for attempt in range(1, max_generation_attempts + 1):
            logger.info(
                f"Pipeline: generating message (attempt {attempt}) "
                f"for event='{request.event}'"
            )

            # Step 1: Generate AI message
            raw_message = await generate_message(request)

            # Step 2: Validate safety
            validation = validate_message(raw_message, request)

            if validation.is_valid:
                message = validation.message
                if validation.is_sanitized:
                    logger.info("Message was sanitized during validation")
                break
            else:
                logger.warning(
                    f"Message failed validation (attempt {attempt}): "
                    f"{validation.warnings}"
                )

        if message is None:
            logger.error("All generation attempts failed validation")
            return NotificationResponse(
                status=DeliveryStatus.FAILED,
                channel=request.channel,
                error="Message failed safety validation after multiple attempts",
                timestamp=datetime.now(),
            )

        # ── Step 3: Validate language ────────────────────────
        lang_valid = validate_language(message, request.language)
        if not lang_valid:
            logger.warning(
                f"Language mismatch detected. Attempting re-generation "
                f"for language={request.language}"
            )
            # One more try with the same prompt (AI may get it right)
            regenerated = await generate_message(request)
            regen_validation = validate_message(regenerated, request)
            if regen_validation.is_valid:
                message = regen_validation.message

        # ── Step 4: Dispatch notification ────────────────────
        result = await dispatch_notification(request, message)

        # ── Step 5: Build response ───────────────────────────
        if result.success:
            if result.message_id and result.message_id.startswith('mock-'):
                return NotificationResponse(status=DeliveryStatus.SIMULATED, channel=result.channel,
                                            message_preview=truncate_message(message), timestamp=datetime.now())
            # Check if fallback was used
            if result.channel != request.channel:
                return NotificationResponse(
                    status=DeliveryStatus.FALLBACK,
                    channel=result.channel,
                    original_channel=request.channel,
                    fallback_reason=f"Primary channel {request.channel} failed",
                    message_preview=truncate_message(message),
                    timestamp=datetime.now(),
                )

            return NotificationResponse(
                status=DeliveryStatus.ACCEPTED,
                channel=result.channel,
                message_preview=truncate_message(message),
                timestamp=datetime.now(),
            )
        else:
            return NotificationResponse(
                status=DeliveryStatus.FAILED,
                channel=request.channel,
                error=result.error or "Delivery failed on all channels",
                timestamp=datetime.now(),
            )

    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        return NotificationResponse(
            status=DeliveryStatus.FAILED,
            channel=request.channel,
            error=str(e),
            timestamp=datetime.now(),
        )


# ═══════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/notify",
    response_model=NotificationResponse,
    summary="Send a single notification",
    description=(
        "Receives a hospital event, generates a personalized AI message, "
        "validates it for safety, and delivers it via the preferred channel. "
        "Includes automatic fallback if the primary channel fails."
    ),
)
async def send_notification(request: NotificationRequest) -> NotificationResponse:
    """
    Send a single personalized notification.

    This is the primary endpoint that Member 2's backend will call.
    """
    logger.info(
        f"Received notification request: event={request.event}, "
        f"patient={request.patient_name}, channel={request.channel}, "
        f"language={request.language}"
    )

    response = await _process_notification(request)

    logger.info(
        f"Notification result: status={response.status}, "
        f"channel={response.channel}, request_id={response.request_id}"
    )

    return response


@router.post(
    "/batch-notify",
    response_model=BatchNotificationResponse,
    summary="Send batch notifications",
    description=(
        "Send notifications to multiple patients at once. "
        "Each notification is processed independently — "
        "one failure doesn't affect others."
    ),
)
async def send_batch_notifications(
    batch: BatchNotificationRequest,
) -> BatchNotificationResponse:
    """
    Send notifications to multiple patients concurrently.

    Uses asyncio.gather for parallel processing — all notifications
    are processed simultaneously for maximum throughput.
    """
    logger.info(f"Received batch request: {len(batch.notifications)} notifications")

    # Process all notifications concurrently
    tasks = [
        _process_notification(notification)
        for notification in batch.notifications
    ]
    results = await asyncio.gather(*tasks)

    # Count results
    successful = sum(1 for r in results if r.status == DeliveryStatus.DELIVERED)
    fallback_count = sum(1 for r in results if r.status == DeliveryStatus.FALLBACK)
    failed = sum(1 for r in results if r.status == DeliveryStatus.FAILED)

    logger.info(
        f"Batch complete: {successful} delivered, "
        f"{fallback_count} via fallback, {failed} failed"
    )

    return BatchNotificationResponse(
        total=len(results),
        successful=successful + fallback_count,
        failed=failed,
        results=list(results),
    )
