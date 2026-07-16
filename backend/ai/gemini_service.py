"""
ai/gemini_service.py

Thin wrapper around the Google GenAI API used by the
Space-Rover-AI AI Assistant (`POST /api/v1/ai/chat`).
"""

import logging
import os
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


class AIServiceError(Exception):
    """Raised whenever the Gemini-backed assistant cannot produce a reply."""


def _is_key_configured() -> bool:
    key = settings.GEMINI_API_KEY
    return bool(key)


def _get_client() -> genai.Client:
    """Return a lazily-constructed, singleton Gemini client."""
    global _client

    if not _is_key_configured():
        raise AIServiceError(
            "GEMINI_API_KEY is not configured. Set it in the environment "
            "before using the AI Assistant."
        )

    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)

    return _client


def _build_prompt(message: str) -> str:
    return f"""
You are an expert NASA Mars Rover AI assistant.

Analyze the following operator message / rover telemetry prediction carefully.

Message:
{message}

Generate a professional, concise response using the following format.

1. Overall Rover Status
2. Problem Detected
3. Possible Causes
4. Risk Level (Low, Medium, High, Critical)
5. Recommended Actions
6. Expected Impact on Rover Mission
7. Preventive Maintenance Suggestions
8. Final Conclusion

Explain everything clearly in simple English.
Write around 200-300 words.
"""


def get_ai_explanation(message: str) -> str:
    """
    Send `message` to the Google Gemini API and return the
    assistant's reply as plain text.

    Raises:
        AIServiceError: if the API key is missing/invalid, the request
        fails, or Gemini returns an error.
    """
    if not message or not message.strip():
        raise AIServiceError("Message must not be empty.")

    client = _get_client()
    prompt = _build_prompt(message)

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                system_instruction="You are an intelligent NASA rover diagnostic assistant.",
            ),
        )
    except Exception as exc:
        logger.error(f"Gemini API generation failed: {exc}")
        raise AIServiceError(f"Gemini API returned an error: {exc}") from exc

    content = response.text
    if not content:
        raise AIServiceError("Gemini returned an empty message.")

    return content
