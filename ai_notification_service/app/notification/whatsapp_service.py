"""
ProactiveCare – WhatsApp Notification Service (Twilio)
=======================================================

Sends WhatsApp notifications via Twilio's WhatsApp Business API.
Uses the Twilio sandbox number for development.
Falls back to mock mode if credentials are not configured.
"""

import asyncio
from typing import Optional

from app.config import get_settings
from app.logger import get_logger
from app.schemas import Channel
from app.notification.base import NotificationChannel, DeliveryResult

logger = get_logger(__name__)


class WhatsAppChannel(NotificationChannel):
    """
    WhatsApp delivery channel using Twilio WhatsApp API.

    Note on Twilio WhatsApp Sandbox:
        - The sandbox number is whatsapp:+14155238886
        - Recipients must first send "join <sandbox-keyword>" to this number
        - In production, you'd use a registered WhatsApp Business number
    """

    @property
    def channel_name(self) -> Channel:
        return Channel.WHATSAPP

    async def send(
        self,
        to: str,
        message: str,
        subject: Optional[str] = None,
    ) -> DeliveryResult:
        """
        Send a WhatsApp message via Twilio.

        Args:
            to: Phone number with country code (e.g., +919876543210).
            message: The notification message text.
            subject: Not used for WhatsApp (ignored).

        Returns:
            DeliveryResult with delivery status.
        """
        settings = get_settings()

        if not settings.twilio_configured:
            return await self._mock_send(to, message)

        try:
            from twilio.rest import Client

            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            # WhatsApp numbers must be prefixed with "whatsapp:"
            whatsapp_to = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to

            twilio_message = await asyncio.to_thread(
                client.messages.create,
                body=message,
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=whatsapp_to,
            )

            logger.info(
                f"WhatsApp sent successfully: sid={twilio_message.sid}, to={to}"
            )
            return DeliveryResult(
                success=True,
                channel=Channel.WHATSAPP,
                message_id=twilio_message.sid,
            )

        except Exception as e:
            logger.error(f"WhatsApp delivery failed to {to}: {e}")
            return DeliveryResult(
                success=False,
                channel=Channel.WHATSAPP,
                error=str(e),
            )

    async def _mock_send(self, to: str, message: str) -> DeliveryResult:
        """Mock WhatsApp delivery for development."""
        logger.info(
            f"[MOCK WHATSAPP] To: {to}\n"
            f"[MOCK WHATSAPP] Message: {message[:100]}..."
        )
        return DeliveryResult(
            success=True,
            channel=Channel.WHATSAPP,
            message_id="mock-whatsapp-" + to,
        )
