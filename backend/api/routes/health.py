"""
api/routes/health.py

GET /health — liveness / readiness probe.
"""

from fastapi import APIRouter
from models.schemas import HealthResponse
from ml.model_loader import is_model_loaded
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description=(
        "Returns the current health status of the Space-Rover-AI backend, "
        "including whether the trained ML model has been loaded."
    ),
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.APP_ENV,
        model_loaded=is_model_loaded(),
        version="1.0.0",
        message=(
            "Space-Rover-AI backend is running. "
            + ("Model loaded." if is_model_loaded() else "Using mock predictions (model.pkl not found).")
        ),
    )
