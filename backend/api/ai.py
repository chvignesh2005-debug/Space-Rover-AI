from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(data: ChatRequest):

    msg = data.message.lower()

    if "battery" in msg:
        reply = (
            "Battery temperature is high. Reduce rover speed, stop non-essential "
            "systems and recharge if solar power is available."
        )

    elif "wheel" in msg:
        reply = (
            "Possible wheel issue detected. Inspect motor current and reduce terrain difficulty."
        )

    elif "camera" in msg:
        reply = (
            "Camera issue detected. Clean the lens and verify camera connection."
        )

    else:
        reply = (
            "All rover systems appear normal. Continue monitoring telemetry."
        )

    return {"reply": reply}