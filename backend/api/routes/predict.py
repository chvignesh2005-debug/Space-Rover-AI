"""
api/routes/predict.py

POST /predict — accepts rover telemetry and returns fault predictions.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from models.schemas import TelemetryInput, PredictionResponse, ErrorResponse
from services.prediction_service import run_prediction

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Fault Prediction",
    description=(
        "Submit rover telemetry data. "
        "Returns fault predictions using the loaded ML model (model.pkl) "
        "or deterministic mock predictions if the model is unavailable."
    ),
    responses={
        422: {"model": ErrorResponse, "description": "Validation error in request payload"},
        500: {"model": ErrorResponse, "description": "Internal prediction error"},
    },
)
async def predict(payload: TelemetryInput) -> PredictionResponse:
    """
    **POST /predict**

    Accepts a `TelemetryInput` JSON body and returns a `PredictionResponse`
    containing:
    - A list of `FaultPrediction` objects (fault type, probability, severity, action)
    - An overall health score (0-100)
    - Whether autonomous navigation is safe to continue
    - The model used (`model.pkl` or `mock`)
    """
    logger.info(f"Received prediction request: {payload.model_dump(exclude_none=True)}")

    try:
        result = run_prediction(payload)
    except Exception as exc:
        logger.exception("Unhandled error in prediction service")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(exc)}",
        )

    return result
