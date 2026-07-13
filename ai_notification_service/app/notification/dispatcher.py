"""
ProactiveCare – Notification Dispatcher
=========================================

Central dispatcher that selects the right notification channel
and implements the fallback chain.

Fallback order:
    WhatsApp → SMS → Email

If the preferred channel fails, the dispatcher automatically
tries the next channel in the fallback chain until delivery
succeeds or all channels are exhausted.
"""

from typing import Optional

from app.logger import get_logger
from app.schemas import Channel, NotificationRequest
from app.notification.base import NotificationChannel, DeliveryResult
from app.notification.email_service import EmailChannel
from app.notification.sms_service import SMSChannel
from app.notification.whatsapp_service import WhatsAppChannel

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════════════
# FALLBACK CHAIN — Ordered list of channels to try
# ═══════════════════════════════════════════════════════════════════

FALLBACK_ORDER: list[Channel] = [
    Channel.WHATSAPP,
    Channel.SMS,
    Channel.EMAIL,
]


# ═══════════════════════════════════════════════════════════════════
# CHANNEL REGISTRY — Maps channel types to their implementations
# ═══════════════════════════════════════════════════════════════════

def _get_channel_instance(channel: Channel) -> NotificationChannel:
    """
    Factory function that returns the correct channel implementation.

    Args:
        channel: The channel type to instantiate.

    Returns:
        An instance of the corresponding NotificationChannel subclass.
    """
    channel_map: dict[Channel, type[NotificationChannel]] = {
        Channel.WHATSAPP: WhatsAppChannel,
        Channel.SMS: SMSChannel,
        Channel.EMAIL: EmailChannel,
    }

    channel_class = channel_map.get(channel)
    if channel_class is None:
        raise ValueError(f"Unknown channel: {channel}")

    return channel_class()


# ═══════════════════════════════════════════════════════════════════
# DISPATCHER — Core dispatch logic with fallback
# ═══════════════════════════════════════════════════════════════════

async def dispatch_notification(
    request: NotificationRequest,
    message: str,
) -> DeliveryResult:
    """
    Dispatch a notification through the preferred channel with fallback.

    Strategy:
        1. Try the requested channel first
        2. If it fails, try remaining channels in fallback order
        3. Skip channels without contact info (no phone → skip SMS)
        4. Return the result from whichever channel succeeds

    Args:
        request: The notification request (contains channel preference + contact info).
        message: The generated message text to deliver.

    Returns:
        DeliveryResult from the channel that succeeded (or the last failure).
    """
    preferred = request.channel

    logger.info(
        f"Dispatching notification: preferred_channel={preferred}, "
        f"patient={request.patient_name}"
    )

    # Build the ordered list of channels to try
    # Start with the preferred channel, then add fallbacks
    channels_to_try = _build_fallback_chain(preferred)

    last_result: Optional[DeliveryResult] = None

    for channel in channels_to_try:
        # Check if we have the required contact info for this channel
        recipient = _get_recipient(request, channel)
        if recipient is None:
            logger.info(
                f"Skipping {channel}: no contact info available"
            )
            continue

        logger.info(f"Attempting delivery via {channel} to {recipient}")

        # Get the channel implementation and send
        channel_instance = _get_channel_instance(channel)

        # For email, generate a subject line
        subject = None
        if channel == Channel.EMAIL:
            subject = _generate_email_subject(request)

        result = await channel_instance.send(
            to=recipient,
            message=message,
            subject=subject,
        )

        if result.success:
            logger.info(f"Delivery successful via {channel}")
            return result

        # Channel failed — log and try next
        last_result = result
        logger.warning(
            f"Delivery failed via {channel}: {result.error}. "
            f"Trying next fallback..."
        )

    # All channels exhausted
    logger.error("All delivery channels failed")
    return last_result or DeliveryResult(
        success=False,
        channel=preferred,
        error="All delivery channels failed",
    )


def _build_fallback_chain(preferred: Channel) -> list[Channel]:
    """
    Build an ordered list of channels to try.

    The preferred channel comes first, followed by the remaining
    channels in the standard fallback order.

    Args:
        preferred: The user's preferred channel.

    Returns:
        Ordered list of channels to attempt.

    Example:
        preferred=SMS → [SMS, WhatsApp, Email]
        preferred=WhatsApp → [WhatsApp, SMS, Email]
    """
    chain = [preferred]
    for channel in FALLBACK_ORDER:
        if channel not in chain:
            chain.append(channel)
    return chain


def _get_recipient(request: NotificationRequest, channel: Channel) -> Optional[str]:
    """
    Get the recipient address for a specific channel.

    Args:
        request: The notification request.
        channel: The channel to get the recipient for.

    Returns:
        Recipient address (phone or email), or None if not available.
    """
    if channel in (Channel.WHATSAPP, Channel.SMS):
        return request.phone
    elif channel == Channel.EMAIL:
        return request.email
    return None


def _generate_email_subject(request: NotificationRequest) -> str:
    """
    Generate an appropriate email subject line based on the event type.

    Args:
        request: The notification request.

    Returns:
        A descriptive email subject line.
    """
    subject_map = {
        "appointment_reminder": "Appointment Reminder",
        "appointment_rescheduled": "Appointment Rescheduled",
        "appointment_cancelled": "Appointment Cancelled",
        "medicine_reminder": "Medicine Reminder",
        "lab_report_ready": "Lab Report Available",
        "test_result_available": "Test Results Available",
        "surgery_reminder": "Surgery Reminder",
        "vaccination_reminder": "Vaccination Reminder",
        "admission_confirmation": "Admission Confirmation",
        "discharge_instructions": "Discharge Instructions",
        "follow_up_reminder": "Follow-Up Reminder",
        "emergency_notification": "⚠️ Urgent Notification",
    }

    subject = subject_map.get(request.event, "Hospital Notification")
    hospital = request.hospital_name or "ProactiveCare"

    return f"{subject} – {hospital}"
