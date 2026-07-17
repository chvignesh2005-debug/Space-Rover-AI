"""
backend/api/ai.py

AI Chat API route: POST /chat (this router carries prefix="/ai"; the
"/api/v1" portion of the full path is added where this router is
mounted -- see api/__init__.py, which I still need to inspect to
confirm the final path is exactly /api/v1/ai/chat).
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ai.gemini_service import get_ai_explanation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat(data: ChatRequest) -> ChatResponse:
    logger.info(f"AI Request: {data.message}")

    try:
        reply = get_ai_explanation(data.message)

        if not reply:
            reply = "No response received from Gemini."

        return ChatResponse(reply=reply)

    except Exception as e:
        # logger.exception (not logger.error(f"...{e}")) records the full
        # traceback, not just str(e) -- this is what will show the REAL
        # cause (404/429/503 from Gemini, missing key, etc.) in your
        # terminal, which the old logger.error(f"Gemini Error: {e}") was
        # hiding.
        logger.exception("Gemini call failed")

        # TEMPORARY while we're actively debugging: the real error is
        # embedded in the reply text itself, so it's visible in the
        # frontend without checking the terminal. This still returns
        # HTTP 200 with the existing {"reply": ...} shape, so nothing
        # else in the frontend breaks. Once /ai/chat is confirmed
        # working end-to-end, this should go back to a generic
        # user-facing message, or (better) raise HTTPException(502, ...)
        # so the frontend's existing error interceptor in services/api.ts
        # takes over -- I'll tell you which once I've seen your chat
        # component and know it handles a rejected promise gracefully.
        return ChatResponse(reply=f"AI Assistant error (demo mode): {e}")