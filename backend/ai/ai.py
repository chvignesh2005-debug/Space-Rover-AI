from fastapi import APIRouter
from ai.openai_service import get_ai_explanation

router = APIRouter()

@router.post("/ai/explain")
def explain(data: dict):
    text = get_ai_explanation(data["prediction"])
    return {"explanation": text}