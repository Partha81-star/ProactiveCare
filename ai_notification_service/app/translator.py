"""
ProactiveCare – Translator & Language Validator
=================================================

Handles language validation for AI-generated messages.

Strategy:
    We instruct Gemini to generate directly in the target language
    (Hindi/Marathi/English) within the prompt. This produces more
    natural messages than translating after generation.

    This module validates that the response is actually in the
    correct language and provides fallback re-generation if not.

Why AI-native translation?
    - Single API call (cheaper, faster)
    - More natural phrasing
    - Culturally appropriate expressions
    - Avoids "translationese" (awkward literal translations)
"""

import re

from app.logger import get_logger
from app.schemas import Language

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════════════
# LANGUAGE DETECTION — Lightweight character-set checks
# ═══════════════════════════════════════════════════════════════════

# Unicode ranges for Devanagari script (used by Hindi and Marathi)
DEVANAGARI_PATTERN = re.compile(r"[\u0900-\u097F]")

# Common Hindi words to verify Hindi (not just Devanagari script)
HINDI_MARKERS = ["का", "है", "में", "के", "को", "और", "से", "कि", "पर", "आप"]

# Common Marathi words to differentiate from Hindi
MARATHI_MARKERS = ["आहे", "तुमच", "तुम्ह", "करा", "साठी", "येथे", "आपल", "कृपया"]


def detect_language(text: str) -> Language:
    """
    Detect the language of a given text using character analysis.

    This is a lightweight heuristic — not a full NLP language detector.
    It works well for our use case because:
        - We only need to distinguish between 3 languages
        - Hindi and Marathi both use Devanagari script
        - English uses Latin script

    Detection logic:
        1. If text has significant Devanagari characters → Hindi or Marathi
        2. Check for Marathi-specific words → Marathi
        3. Check for Hindi-specific words → Hindi
        4. Default to English

    Args:
        text: The message text to analyze.

    Returns:
        Detected Language enum value.
    """
    if not text:
        return Language.ENGLISH

    # Count Devanagari characters
    devanagari_chars = len(DEVANAGARI_PATTERN.findall(text))
    total_alpha = sum(1 for c in text if c.isalpha())

    if total_alpha == 0:
        return Language.ENGLISH

    devanagari_ratio = devanagari_chars / total_alpha

    # If more than 30% Devanagari characters → it's Hindi or Marathi
    if devanagari_ratio > 0.3:
        # Check for Marathi-specific words
        text_lower = text.lower()
        marathi_count = sum(1 for marker in MARATHI_MARKERS if marker in text)
        hindi_count = sum(1 for marker in HINDI_MARKERS if marker in text)

        if marathi_count > hindi_count:
            return Language.MARATHI
        return Language.HINDI

    return Language.ENGLISH


def validate_language(message: str, expected_language: Language) -> bool:
    """
    Validate that the generated message is in the expected language.

    Args:
        message: The AI-generated message.
        expected_language: The language requested by the backend.

    Returns:
        True if the message appears to be in the correct language.
    """
    detected = detect_language(message)

    if detected == expected_language:
        logger.info(
            f"Language validation passed: expected={expected_language}, "
            f"detected={detected}"
        )
        return True

    # Special case: Hindi and Marathi share Devanagari script
    # Be lenient when both are Devanagari-based
    if (
        expected_language in (Language.HINDI, Language.MARATHI)
        and detected in (Language.HINDI, Language.MARATHI)
    ):
        logger.info(
            f"Language validation soft-pass: expected={expected_language}, "
            f"detected={detected} (both Devanagari)"
        )
        return True

    logger.warning(
        f"Language mismatch: expected={expected_language}, "
        f"detected={detected}"
    )
    return False
