"""
ProactiveCare – SMS Notification Service (Twilio)
==================================================

Sends SMS notifications via the Twilio API.
Falls back to mock mode if Twilio credentials are not configured.
"""

import asyncio
from typing import Optional

from app.config import get_settings
from app.logger import get_logger
from app.schemas import Channel
from app.notification.base import NotificationChannel, DeliveryResult

logger = get_logger(__name__)


class SMSChannel(NotificationChannel):
    """
    SMS delivery channel using Twilio.

    If Twilio credentials are not configured (empty in .env),
    the channel operates in mock mode — logs the message
    instead of sending it. This enables development without
    a Twilio account.
    """

    @property
    def channel_name(self) -> Channel:
        return Channel.SMS

    async def send(
        self,
        to: str,
        message: str,
        subject: Optional[str] = None,
    ) -> DeliveryResult:
        """
        Send an SMS via Twilio.

        Args:
            to: Phone number with country code (e.g., +919876543210).
            message: The notification message text.
            subject: Not used for SMS (ignored).

        Returns:
            DeliveryResult with delivery status.
        """
        settings = get_settings()

        if not settings.twilio_configured:
            return await self._mock_send(to, message)

        try:
            # Import Twilio client here to avoid import errors
            # when Twilio is not configured
            from twilio.rest import Client

            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            # Run synchronous Twilio call in thread pool
            twilio_message = await asyncio.to_thread(
                client.messages.create,
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to,
            )

            logger.info(
                f"SMS sent successfully: sid={twilio_message.sid}, to={to}"
            )
            return DeliveryResult(
                success=True,
                channel=Channel.SMS,
                message_id=twilio_message.sid,
            )

        except Exception as e:
            logger.error(f"SMS delivery failed to {to}: {e}")
            return DeliveryResult(
                success=False,
                channel=Channel.SMS,
                error=str(e),
            )

    async def _mock_send(self, to: str, message: str) -> DeliveryResult:
        """Mock SMS delivery for development without Twilio."""
        logger.info(
            f"[MOCK SMS] To: {to}\n"
            f"[MOCK SMS] Message: {message[:100]}..."
        )
        return DeliveryResult(
            success=True,
            channel=Channel.SMS,
            message_id="mock-sms-" + to,
        )
