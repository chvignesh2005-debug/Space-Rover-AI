"""
Pydantic schemas for all API request / response payloads.
These are the single source of truth for data shapes flowing in and out
of the Space-Rover-AI FastAPI backend.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


# ──────────────────────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    environment: str = Field(..., example="development")
    model_loaded: bool = Field(..., example=False)
    version: str = Field(default="1.0.0")
    message: str = Field(..., example="Space-Rover-AI backend is running.")


# ──────────────────────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────────────────────

class TelemetryInput(BaseModel):
    """
    Rover telemetry snapshot submitted by the frontend for prediction.
    All fields are optional so that the API can still respond with mock
    data even when partial readings are sent.
    """
    battery: Optional[float] = Field(None, ge=0, le=100, example=87.5,
                                     description="Battery charge level (%)")
    solar_output: Optional[float] = Field(None, ge=0, example=420,
                                          description="Solar panel output in watts")
    speed: Optional[float] = Field(None, ge=0, example=0.18,
                                   description="Rover speed in m/s")
    temperature: Optional[float] = Field(None, example=-14.0,
                                         description="Ambient temperature (°C)")
    latency: Optional[float] = Field(None, ge=0, example=122,
                                     description="DSN link latency in ms")
    coordinates_x: Optional[float] = Field(None, example=124.52)
    coordinates_y: Optional[float] = Field(None, example=-45.18)
    coordinates_z: Optional[float] = Field(None, example=8.24)
    heading: Optional[float] = Field(None, ge=0, le=360, example=182.4,
                                     description="Heading in degrees (0-360)")
    power_draw: Optional[float] = Field(None, ge=0, example=145,
                                        description="Active power draw in watts")

    class Config:
        json_schema_extra = {
            "example": {
                "battery": 87.5,
                "solar_output": 420,
                "speed": 0.18,
                "temperature": -14.0,
                "latency": 122,
                "coordinates_x": 124.52,
                "coordinates_y": -45.18,
                "coordinates_z": 8.24,
                "heading": 182.4,
                "power_draw": 145
            }
        }


class FaultPrediction(BaseModel):
    fault_type: str = Field(..., example="POWER_LOW")
    probability: float = Field(..., ge=0, le=1, example=0.12)
    severity: str = Field(..., example="WARNING")
    recommended_action: str = Field(..., example="Monitor battery cell temperatures.")


class PredictionResponse(BaseModel):
    prediction_id: str = Field(..., example="pred-20260711-001")
    timestamp: str = Field(..., example="2026-07-11T05:00:00Z")
    model_used: str = Field(..., example="mock")
    input_features: Dict[str, Any]
    fault_predictions: List[FaultPrediction]
    overall_health_score: float = Field(..., ge=0, le=100, example=92.5,
                                        description="Composite health score (0-100)")
    navigation_safe: bool = Field(..., example=True)
    summary: str = Field(..., example="No critical faults detected. Rover is operational.")


# ──────────────────────────────────────────────────────────────
# Error
# ──────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    status_code: int
