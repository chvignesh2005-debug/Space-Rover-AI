from fastapi import APIRouter
from ai.openai_service import get_ai_explanation

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/explain")
def explain(data: dict):
    prediction = data.get("prediction", "")
    explanation = get_ai_explanation(prediction)
    return {
        "explanation": explanation
    }
