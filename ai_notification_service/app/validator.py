"""
ProactiveCare – Safety Validator
=================================

Validates AI-generated messages BEFORE they reach patients.

Why is this critical?
    AI models can hallucinate or accidentally include sensitive
    medical information. This module acts as a safety net.

Validation layers:
    1. Sensitive medical terms detection (diseases, conditions)
    2. Test result / lab value leaks
    3. Message length validation
    4. Empty/malformed response detection

If a message fails validation, it is either:
    - Sanitized (sensitive terms replaced with safe alternatives)
    - Rejected (triggers a regeneration)
"""

import re
from typing import Optional

from app.logger import get_logger
from app.schemas import NotificationRequest, Channel

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════════════
# SENSITIVE TERMS — Medical conditions that MUST NOT appear in messages
# ═══════════════════════════════════════════════════════════════════

# These terms should NEVER appear in patient notifications.
# The AI is instructed to avoid them, but this is a safety net.
SENSITIVE_MEDICAL_TERMS: list[str] = [
    # Diseases and conditions
    "hiv", "aids", "cancer", "tumor", "tumour", "malignant", "benign",
    "metastasis", "leukemia", "lymphoma", "carcinoma", "sarcoma",
    "hepatitis", "tuberculosis", "syphilis", "gonorrhea", "chlamydia",
    "herpes", "std", "sti", "sexually transmitted",
    # Mental health
    "depression", "bipolar", "schizophrenia", "anxiety disorder",
    "ptsd", "suicidal", "psychiatric",
    # Sensitive results
    "positive result", "negative result", "test positive", "test negative",
    "diagnosed with", "diagnosis of", "prognosis",
    # Lab values
    "blood sugar level", "cholesterol level", "biopsy result",
    "pathology report", "abnormal result", "critical value",
]

# Patterns that indicate test results being revealed
RESULT_LEAK_PATTERNS: list[str] = [
    r"your .{0,30}(?:test|report|result).{0,30}(?:shows?|indicates?|reveals?|confirms?)",
    r"(?:positive|negative) (?:for|result)",
    r"(?:levels?|values?|count) (?:is|are|was|were) \d+",
    r"diagnosed with .+",
]


# ═══════════════════════════════════════════════════════════════════
# VALIDATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

class ValidationResult:
    """
    Result of a message validation check.

    Attributes:
        is_valid: Whether the message passed all checks.
        message: The (possibly sanitized) message.
        warnings: List of warnings for logging/debugging.
        is_sanitized: Whether the message was modified during validation.
    """

    def __init__(
        self,
        is_valid: bool,
        message: str,
        warnings: Optional[list[str]] = None,
        is_sanitized: bool = False,
    ):
        self.is_valid = is_valid
        self.message = message
        self.warnings = warnings or []
        self.is_sanitized = is_sanitized


def validate_message(message: str, request: NotificationRequest) -> ValidationResult:
    """
    Run all validation checks on a generated message.

    Checks performed (in order):
        1. Empty/whitespace check
        2. Minimum length check
        3. Maximum length check (per channel)
        4. Sensitive medical terms scan
        5. Result leak pattern detection

    Args:
        message: The AI-generated message text.
        request: The original notification request (for context).

    Returns:
        ValidationResult with is_valid flag, cleaned message, and warnings.
    """
    warnings: list[str] = []

    # ── Check 1: Empty message ───────────────────────────────
    if not message or not message.strip():
        logger.error("Validation failed: empty message")
        return ValidationResult(
            is_valid=False,
            message="",
            warnings=["Message is empty or whitespace-only"],
        )

    # ── Check 2: Minimum length ──────────────────────────────
    if len(message.strip()) < 20:
        logger.warning(f"Message suspiciously short: {len(message)} chars")
        warnings.append(f"Message is very short ({len(message)} chars)")

    # ── Check 3: Maximum length per channel ──────────────────
    max_lengths: dict[Channel, int] = {
        Channel.SMS: 160 * 3,       # 3 SMS segments max (480 chars)
        Channel.WHATSAPP: 4096,     # WhatsApp limit
        Channel.EMAIL: 10000,       # Practical email limit
    }
    max_len = max_lengths.get(request.channel, 4096)
    if len(message) > max_len:
        logger.warning(
            f"Message exceeds {request.channel} limit: "
            f"{len(message)}/{max_len} chars, truncating"
        )
        message = message[:max_len]
        warnings.append(f"Message truncated to {max_len} chars for {request.channel}")

    # ── Check 4: Sensitive medical terms ─────────────────────
    message_lower = message.lower()
    found_terms: list[str] = []

    for term in SENSITIVE_MEDICAL_TERMS:
        if term in message_lower:
            found_terms.append(term)

    if found_terms:
        logger.warning(
            f"Sensitive terms detected in message: {found_terms}. "
            f"Sanitizing message."
        )
        warnings.append(f"Sensitive terms removed: {found_terms}")
        message = _sanitize_sensitive_terms(message, found_terms)

    # ── Check 5: Result leak patterns ────────────────────────
    for pattern in RESULT_LEAK_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            logger.warning(
                f"Result leak pattern detected: '{pattern}'. "
                f"Message may reveal test results."
            )
            warnings.append(f"Potential result leak detected (pattern: {pattern})")
            # For result leaks, we reject the message rather than sanitize
            return ValidationResult(
                is_valid=False,
                message=message,
                warnings=warnings,
            )

    # ── All checks passed ────────────────────────────────────
    is_sanitized = len(found_terms) > 0

    if warnings:
        logger.info(f"Validation passed with warnings: {warnings}")
    else:
        logger.info("Message validation passed cleanly")

    return ValidationResult(
        is_valid=True,
        message=message,
        warnings=warnings,
        is_sanitized=is_sanitized,
    )


def _sanitize_sensitive_terms(message: str, terms: list[str]) -> str:
    """
    Remove sensitive medical terms from a message.

    Replaces detected terms with safe, generic alternatives.
    Uses case-insensitive replacement to catch all variations.

    Args:
        message: The message containing sensitive terms.
        terms: List of sensitive terms found in the message.

    Returns:
        Sanitized message with sensitive terms replaced.
    """
    sanitized = message

    for term in terms:
        # Case-insensitive replacement with a safe alternative
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        sanitized = pattern.sub("your health concern", sanitized)

    return sanitized
