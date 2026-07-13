"""
ProactiveCare – Utility Functions
===================================

Shared utility functions used across the application.
"""

from datetime import datetime


def get_timestamp() -> str:
    """
    Get the current timestamp in ISO 8601 format.

    Returns:
        Current datetime as a string (e.g., '2026-07-13T10:30:20').
    """
    return datetime.now().isoformat(timespec="seconds")


def truncate_message(message: str, max_length: int = 100) -> str:
    """
    Truncate a message for preview purposes.

    Args:
        message: The full message text.
        max_length: Maximum preview length.

    Returns:
        Truncated message with '...' appended if needed.
    """
    if len(message) <= max_length:
        return message
    return message[:max_length] + "..."
