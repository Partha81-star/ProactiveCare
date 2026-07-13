"""
ProactiveCare – AI Engine (Gemini Integration)
================================================

This module handles all communication with the Google Gemini API.
It generates personalized hospital notification messages.

Architecture:
    - Uses the google-genai SDK for Gemini API calls
    - Async-first design for non-blocking operation
    - Retry logic with exponential backoff for reliability
    - Abstracted interface — switching to OpenAI requires minimal changes

Usage:
    from app.ai_engine import generate_message
    message = await generate_message(notification_request)
"""

import asyncio
from typing import Optional

from google import genai
from google.genai import types

from app.config import get_settings
from app.logger import get_logger
from app.prompts import build_prompt
from app.schemas import NotificationRequest

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════════════
# GEMINI CLIENT — Initialized once, reused across requests
# ═══════════════════════════════════════════════════════════════════

def _get_gemini_client() -> genai.Client:
    """
    Create and return a Gemini API client.

    Uses the API key from environment configuration.
    The client is created per-call rather than cached globally
    to avoid issues with async event loops.
    """
    settings = get_settings()
    return genai.Client(api_key=settings.GEMINI_API_KEY)


# ═══════════════════════════════════════════════════════════════════
# MESSAGE GENERATION — Core AI functionality
# ═══════════════════════════════════════════════════════════════════

async def generate_message(
    request: NotificationRequest,
    max_retries: int = 3,
) -> str:
    """
    Generate a personalized notification message using Gemini AI.

    Pipeline:
        1. Build prompt from request data (prompts.py)
        2. Call Gemini API with system + user prompts
        3. Extract and clean the response text
        4. Retry on failure with exponential backoff

    Args:
        request: Validated notification request with patient details.
        max_retries: Number of retry attempts on API failure.

    Returns:
        The generated message text, ready for delivery.

    Raises:
        RuntimeError: If all retry attempts fail.
    """
    settings = get_settings()

    # Build the prompt from request data
    system_prompt, user_prompt = build_prompt(request)

    logger.info(
        f"Generating message for event='{request.event}' "
        f"patient='{request.patient_name}' "
        f"language='{request.language}' "
        f"channel='{request.channel}'"
    )

    last_error: Optional[Exception] = None

    for attempt in range(1, max_retries + 1):
        try:
            # Call Gemini API
            message = await _call_gemini(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=settings.GEMINI_MODEL,
            )

            # Clean the response
            message = _clean_response(message)

            if not message:
                raise ValueError("Gemini returned an empty response")

            logger.info(
                f"Message generated successfully (attempt {attempt}): "
                f"length={len(message)} chars"
            )
            return message

        except Exception as e:
            last_error = e
            logger.warning(
                f"Gemini API attempt {attempt}/{max_retries} failed: {e}"
            )
            if attempt < max_retries:
                # Exponential backoff: 1s, 2s, 4s
                wait_time = 2 ** (attempt - 1)
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)

    # All retries exhausted
    error_msg = f"Failed to generate message after {max_retries} attempts: {last_error}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)


async def _call_gemini(
    system_prompt: str,
    user_prompt: str,
    model: str,
) -> str:
    """
    Make the actual API call to Gemini.

    Uses asyncio.to_thread to run the synchronous genai client
    in a thread pool, keeping the event loop non-blocking.

    Args:
        system_prompt: System-level instructions (safety, tone rules).
        user_prompt: User-level prompt with patient context.
        model: Gemini model name (e.g., 'gemini-2.0-flash').

    Returns:
        Raw response text from Gemini.
    """
    client = _get_gemini_client()

    # Run synchronous API call in a thread to avoid blocking
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,       # Balanced creativity vs consistency
            max_output_tokens=500, # Enough for any notification
            top_p=0.9,
        ),
    )

    return response.text


def _clean_response(text: str) -> str:
    """
    Clean the AI-generated response.

    Removes:
        - Leading/trailing whitespace
        - Markdown formatting artifacts
        - Unnecessary quotes
        - Subject line artifacts (e.g., "Subject: ...")

    Args:
        text: Raw text from Gemini.

    Returns:
        Cleaned message text ready for delivery.
    """
    if not text:
        return ""

    # Strip whitespace
    cleaned = text.strip()

    # Remove markdown quotes if the entire message is wrapped in them
    if cleaned.startswith('"') and cleaned.endswith('"'):
        cleaned = cleaned[1:-1].strip()

    # Remove "Subject:" line if AI accidentally adds one
    lines = cleaned.split("\n")
    if lines and lines[0].lower().startswith("subject:"):
        cleaned = "\n".join(lines[1:]).strip()

    # Remove markdown bold/italic markers
    cleaned = cleaned.replace("**", "").replace("__", "")

    return cleaned
