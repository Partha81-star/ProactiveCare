"""
ProactiveCare – Email Notification Service (SMTP)
===================================================

Sends email notifications via SMTP using aiosmtplib for async delivery.
Falls back to mock mode if SMTP credentials are not configured.
"""

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

import aiosmtplib

from app.config import get_settings
from app.logger import get_logger
from app.schemas import Channel
from app.notification.base import NotificationChannel, DeliveryResult

logger = get_logger(__name__)


class EmailChannel(NotificationChannel):
    """
    Email delivery channel using async SMTP.

    Uses aiosmtplib for non-blocking email delivery.
    Falls back to mock mode if SMTP credentials are not configured.
    """

    @property
    def channel_name(self) -> Channel:
        return Channel.EMAIL

    async def send(
        self,
        to: str,
        message: str,
        subject: Optional[str] = None,
    ) -> DeliveryResult:
        """
        Send an email notification.

        Args:
            to: Recipient email address.
            message: The notification message text (used as email body).
            subject: Email subject line. Auto-generated if not provided.

        Returns:
            DeliveryResult with delivery status.
        """
        settings = get_settings()

        if not settings.smtp_configured:
            return await self._mock_send(to, message, subject)

        try:
            # Build email message
            email_subject = subject or "Notification from ProactiveCare"

            msg = MIMEMultipart("alternative")
            msg["Subject"] = email_subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to

            # Plain text version
            msg.attach(MIMEText(message, "plain", "utf-8"))

            # Simple HTML version with basic styling
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;
                            border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: #2563eb; color: white; padding: 15px;
                                border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="margin: 0;">🏥 ProactiveCare</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>{message.replace(chr(10), '<br>')}</p>
                    </div>
                    <div style="text-align: center; color: #888; font-size: 12px;
                                padding: 15px; border-top: 1px solid #e0e0e0;">
                        This is an automated notification from ProactiveCare Hospital.
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            # Send via async SMTP
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )

            logger.info(f"Email sent successfully to {to}")
            return DeliveryResult(
                success=True,
                channel=Channel.EMAIL,
                message_id=f"email-{to}",
            )

        except Exception as e:
            logger.error(f"Email delivery failed to {to}: {e}")
            return DeliveryResult(
                success=False,
                channel=Channel.EMAIL,
                error=str(e),
            )

    async def _mock_send(
        self, to: str, message: str, subject: Optional[str] = None
    ) -> DeliveryResult:
        """Mock email delivery for development."""
        logger.info(
            f"[MOCK EMAIL] To: {to}\n"
            f"[MOCK EMAIL] Subject: {subject or 'Notification from ProactiveCare'}\n"
            f"[MOCK EMAIL] Body: {message[:100]}..."
        )
        return DeliveryResult(
            success=True,
            channel=Channel.EMAIL,
            message_id="mock-email-" + to,
        )
