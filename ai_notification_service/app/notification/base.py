"""
ProactiveCare – Notification Channel Base Class
=================================================

Abstract base class that ALL notification channels must implement.
This enforces a consistent interface using the Strategy Pattern.

Why Strategy Pattern?
    - Adding a new channel (e.g., Push Notification) = one new file
    - The dispatcher doesn't care which channel it's using
    - Each channel is independently testable
    - Channel-specific logic is isolated

Every channel must implement:
    - send(): Deliver a message and return success/failure
    - channel_name: Property identifying the channel
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.schemas import Channel


@dataclass
class DeliveryResult:
    """
    Standardized result from any notification channel.

    All channels return this same structure, making
    the dispatcher's job simple and predictable.

    Attributes:
        success: Whether the message was delivered.
        channel: Which channel was used.
        message_id: Provider-specific message ID (for tracking).
        error: Error description if delivery failed.
    """
    success: bool
    channel: Channel
    message_id: Optional[str] = None
    error: Optional[str] = None


class NotificationChannel(ABC):
    """
    Abstract base class for all notification delivery channels.

    Subclasses:
        - EmailChannel   (email_service.py)
        - SMSChannel     (sms_service.py)
        - WhatsAppChannel (whatsapp_service.py)
    """

    @property
    @abstractmethod
    def channel_name(self) -> Channel:
        """Return the channel type identifier."""
        ...

    @abstractmethod
    async def send(
        self,
        to: str,
        message: str,
        subject: Optional[str] = None,
    ) -> DeliveryResult:
        """
        Send a notification message.

        Args:
            to: Recipient address (phone number or email).
            message: The notification message text.
            subject: Optional subject line (used by email).

        Returns:
            DeliveryResult with success status and metadata.
        """
        ...
