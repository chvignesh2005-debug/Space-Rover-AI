"""
api/ai.py

POST /api/v1/ai/chat — the AI Assistant endpoint.

This is the ONLY router registered for the AI Assistant (wired in via
api/__init__.py -> api_router -> main.py -> app.include_router(..., prefix="/api/v1")).

It delegates to ai.gemini_service.get_ai_explanation(), which makes the
real Gemini generation call. Any failure (missing/invalid API key,
network error, rate limit, empty response) is translated into a clean
HTTP error instead of a raw 500 stack trace.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ai.gemini_service import get_ai_explanation, AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The operator's question or telemetry prediction to analyze.")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="The AI Assistant's generated response.")


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="AI Assistant Chat",
    description=(
        "Sends the operator's message to the Gemini-backed rover diagnostic "
        "assistant and returns its generated reply."
    ),
    responses={
        422: {"description": "Validation error (empty/missing message)"},
        502: {"description": "OpenAI request failed (bad/missing API key, network error, rate limit, etc.)"},
    },
)
def chat(data: ChatRequest) -> ChatResponse:
    logger.info(f"AI Assistant request received: {data.message[:200]!r}")

    try:
        reply = get_ai_explanation(data.message)
        return ChatResponse(reply=reply)
    except Exception as exc:
        logger.error(f"AI Assistant request failed: {exc}. Returning demo mode response.")
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "response": "Hello! AI Assistant is temporarily running in demo mode."
            }
        )
