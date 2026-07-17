from fastapi import APIRouter
get_ai_explanation

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/chat")
def chat(data: dict):
    message = data.get("message", "")
    reply = get_ai_explanation(message)

    return {
        "reply": reply
    }