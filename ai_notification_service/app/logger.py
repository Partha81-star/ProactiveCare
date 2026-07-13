"""
ProactiveCare – Structured Logging
===================================

Centralized logging configuration for the entire service.

Why structured logging?
    1. Consistency:  Every module logs in the same format
    2. Debugging:    Timestamps + module names make tracing easy
    3. Production:   Log levels filter noise (DEBUG in dev, WARNING in prod)
    4. Searchable:   Structured format works with log aggregators (ELK, CloudWatch)

Usage in any module:
    from app.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Notification sent", extra={"channel": "whatsapp", "patient": "Rahul"})
"""

import logging
import sys
from typing import Optional


# ── Custom Formatter ─────────────────────────────────────────────
class ProactiveCareFormatter(logging.Formatter):
    """
    Custom log formatter that produces clean, readable log lines.

    Format:
        2026-07-13 10:30:20 | INFO     | app.ai_engine | Generating message for appointment_reminder
    """

    # Color codes for terminal output (development only)
    COLORS = {
        logging.DEBUG: "\033[36m",     # Cyan
        logging.INFO: "\033[32m",      # Green
        logging.WARNING: "\033[33m",   # Yellow
        logging.ERROR: "\033[31m",     # Red
        logging.CRITICAL: "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def __init__(self, use_colors: bool = True):
        super().__init__()
        self.use_colors = use_colors

    def format(self, record: logging.LogRecord) -> str:
        # Build the base log line
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        level = record.levelname.ljust(8)
        module = record.name
        message = record.getMessage()

        # Add color in development
        if self.use_colors:
            color = self.COLORS.get(record.levelno, self.RESET)
            level = f"{color}{level}{self.RESET}"

        log_line = f"{timestamp} | {level} | {module} | {message}"

        # Append exception info if present
        if record.exc_info and record.exc_info[0] is not None:
            log_line += f"\n{self.formatException(record.exc_info)}"

        return log_line


# ── Logger Factory ───────────────────────────────────────────────
def setup_logging(log_level: str = "INFO", use_colors: bool = True) -> None:
    """
    Configure the root logger for the entire application.

    Called once during app startup in main.py.
    All subsequent get_logger() calls inherit this configuration.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_colors: Whether to colorize terminal output
    """
    # Convert string level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Create handler that writes to stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(numeric_level)
    handler.setFormatter(ProactiveCareFormatter(use_colors=use_colors))

    # Configure root logger
    root_logger = logging.getLogger("app")
    root_logger.setLevel(numeric_level)
    root_logger.addHandler(handler)

    # Prevent duplicate logs from propagating to the default handler
    root_logger.propagate = False

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance for a specific module.

    Args:
        name: Module name (typically __name__). If None, returns the root app logger.

    Returns:
        Configured logger instance.

    Example:
        logger = get_logger(__name__)
        logger.info("Processing notification request")
    """
    if name is None:
        return logging.getLogger("app")
    return logging.getLogger(name)
