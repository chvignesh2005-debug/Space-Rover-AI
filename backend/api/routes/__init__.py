from fastapi import APIRouter

from api.routes.health import router as health_router
from api.routes.predict import router as predict_router
from api.ai import router as ai_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(predict_router)
api_router.include_router(ai_router)