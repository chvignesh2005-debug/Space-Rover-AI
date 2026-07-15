"""
ai/openai_service.py

Thin wrapper around the OpenAI Chat Completions API used by the
Space-Rover-AI AI Assistant (`POST /api/v1/ai/chat`).

Design notes:
- The OpenAI client is constructed lazily (on first real use), not at
  import time. Building it eagerly at import time meant a missing/placeholder
  OPENAI_API_KEY only ever surfaced as an opaque error deep inside a live
  request instead of a clear, early, actionable exception.
- `get_ai_explanation()` is the single public entry point used by the API
  layer (backend/api/ai.py). It never leaks raw OpenAI SDK exceptions to
  the caller — it raises `AIServiceError` with a clean message instead, so
  the FastAPI route can translate it into a proper HTTP response.
"""

import logging
from openai import OpenAI, APIError, APIConnectionError, AuthenticationError, RateLimitError

from app.config import settings

logger = logging.getLogger(__name__)

_client: OpenAI | None = None


class AIServiceError(Exception):
    """Raised whenever the OpenAI-backed assistant cannot produce a reply."""


def _is_key_configured() -> bool:
    key = settings.OPENAI_API_KEY
    return bool(key) and not key.startswith("sk-your")


def _get_client() -> OpenAI:
    """Return a lazily-constructed, singleton OpenAI client."""
    global _client

    if not _is_key_configured():
        raise AIServiceError(
            "OPENAI_API_KEY is not configured. Set it in backend/.env "
            "(or as an environment variable in your deployment platform) "
            "before using the AI Assistant."
        )

    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)

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
    Send `message` to the OpenAI Chat Completions API and return the
    assistant's reply as plain text.

    Raises:
        AIServiceError: if the API key is missing/invalid, the request
        fails, or OpenAI returns an error. Callers (the FastAPI route)
        should catch this and translate it into an HTTP error response.
    """
    if not message or not message.strip():
        raise AIServiceError("Message must not be empty.")

    client = _get_client()
    prompt = _build_prompt(message)

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.7,
            messages=[
                {
                    "role": "system",
                    "content": "You are an intelligent NASA rover diagnostic assistant.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )
    except AuthenticationError as exc:
        logger.error(f"OpenAI authentication failed: {exc}")
        raise AIServiceError("OpenAI rejected the configured API key (authentication failed).") from exc
    except RateLimitError as exc:
        logger.error(f"OpenAI rate limit hit: {exc}")
        raise AIServiceError("OpenAI rate limit exceeded. Please try again shortly.") from exc
    except APIConnectionError as exc:
        logger.error(f"OpenAI connection error: {exc}")
        raise AIServiceError("Could not reach the OpenAI API. Check network/DNS/firewall settings.") from exc
    except APIError as exc:
        logger.error(f"OpenAI API error: {exc}")
        raise AIServiceError(f"OpenAI API returned an error: {exc}") from exc

    if not response.choices:
        raise AIServiceError("OpenAI returned no choices in the response.")

    content = response.choices[0].message.content
    if not content:
        raise AIServiceError("OpenAI returned an empty message.")

    return content
