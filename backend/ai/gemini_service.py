"""
backend/ai/gemini_service.py

Wraps the Google Gemini API (via the `google-genai` SDK) for the
AI Assistant chat feature.

Import-time safety note
------------------------
app/main.py imports api.api_router, which imports api/ai.py, which
imports THIS module. If this module raises at import time (as the
previous version did via a module-level `raise RuntimeError`), the
entire FastAPI app fails to start -- every route, not just /ai/chat --
even though main.py's own lifespan handler is written to let the app
start in degraded mode when GEMINI_API_KEY is missing (it only logs a
warning). So this module never raises at import time. A missing key
is recorded, and get_ai_explanation() raises a normal, catchable
RuntimeError only when it is actually called.
"""

from pathlib import Path
from typing import Optional
import logging
import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors

logger = logging.getLogger(__name__)

# backend/ai/gemini_service.py -> parent = backend/ai -> parent = backend/
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

# gemini-2.0-flash-lite was shut down by Google on June 1, 2026 -- every
# call using that model ID now returns HTTP 404 NOT_FOUND. That was the
# confirmed cause of this project's "404 Model Not Found" issue.
# gemini-3.1-flash-lite is the current-generation, non-preview
# replacement in the same cost/latency tier (released May 7, 2026;
# per Google's official Gemini API deprecation schedule, its earliest
# possible shutdown date is May 7, 2027). Overridable via GEMINI_MODEL
# in .env so the next model migration is a config change, not a
# code change.
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

RETRYABLE_CODES = {429, 503}  # RESOURCE_EXHAUSTED, UNAVAILABLE
MAX_RETRIES = 2
BASE_DELAY_SECONDS = 1.0

_client: Optional[genai.Client] = None

if API_KEY:
    _client = genai.Client(api_key=API_KEY)
    logger.info(f"Gemini client initialized (model={MODEL_NAME}).")
else:
    logger.warning(
        "GEMINI_API_KEY not found in backend/.env -- Gemini client was "
        "NOT initialized. /api/v1/ai/chat will return an error until "
        "this is set."
    )


def get_ai_explanation(message: str) -> str:
    """
    Send `message` to Gemini and return the reply text.

    Retries up to MAX_RETRIES times, with exponential backoff, ONLY on
    transient errors (429 RESOURCE_EXHAUSTED, 503 UNAVAILABLE). Any
    other error (e.g. 404 model-not-found, 401/403 auth) fails
    immediately, since retrying those can never succeed.

    Raises RuntimeError on any ultimate failure, with the real Gemini
    status code and message included, so the caller (api/ai.py) gets
    an informative error instead of an opaque one.
    """
    if _client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured on the server (backend/.env)."
        )

    last_error: Exception = RuntimeError("Gemini call did not run.")

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = _client.models.generate_content(
                model=MODEL_NAME,
                contents=message,
            )
            return response.text or "No response from Gemini."

        except genai_errors.APIError as e:
            last_error = e
            logger.error(
                f"Gemini API error {e.code}: {e.message} "
                f"(attempt {attempt + 1}/{MAX_RETRIES + 1})"
            )
            if e.code not in RETRYABLE_CODES or attempt == MAX_RETRIES:
                raise RuntimeError(f"Gemini API error {e.code}: {e.message}") from e
            time.sleep(BASE_DELAY_SECONDS * (2 ** attempt))

        except Exception as e:
            last_error = e
            logger.exception("Unexpected error calling Gemini")
            raise RuntimeError(f"Unexpected Gemini error: {e}") from e

    # Unreachable in practice (the loop always returns or raises above),
    # kept only so the function has an explicit exit path.
    raise RuntimeError(f"Gemini API error: {last_error}")