"""
services/prediction_service.py

Core business logic for the /predict endpoint.

Routing logic:
  1. If a real model is loaded → run model.predict() on the feature vector.
  2. Otherwise             → return deterministic mock predictions.

This separation keeps the API routers thin and the logic testable in isolation.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

import numpy as np

from ml.model_loader import get_model, is_model_loaded
from models.schemas import TelemetryInput, FaultPrediction, PredictionResponse

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def _build_feature_vector(data: TelemetryInput) -> np.ndarray:
    """Convert the Pydantic input model into a numpy feature vector."""
    return np.array([[
        data.battery        or 0.0,
        data.solar_output   or 0.0,
        data.speed          or 0.0,
        data.temperature    or 0.0,
        data.latency        or 0.0,
        data.coordinates_x  or 0.0,
        data.coordinates_y  or 0.0,
        data.coordinates_z  or 0.0,
        data.heading        or 0.0,
        data.power_draw     or 0.0,
    ]])


def _derive_health_score(data: TelemetryInput) -> float:
    """
    Rule-based composite health score (0-100) used by both real and mock paths
    as a secondary signal alongside model predictions.
    """
    score = 100.0

    battery = data.battery or 100.0
    latency = data.latency or 120.0
    temperature = data.temperature or -15.0
    power_draw = data.power_draw or 150.0

    # Battery degradation
    if battery < 20:
        score -= 35
    elif battery < 40:
        score -= 15
    elif battery < 60:
        score -= 5

    # High latency
    if latency > 140:
        score -= 10
    elif latency > 135:
        score -= 5

    # Extreme temperature
    if temperature < -50 or temperature > 40:
        score -= 20
    elif temperature < -35:
        score -= 8

    # High power draw
    if power_draw > 250:
        score -= 10

    return max(0.0, min(100.0, score))


# ──────────────────────────────────────────────────────────────
# Mock predictions (used when model.pkl is absent)
# ──────────────────────────────────────────────────────────────

_FAULT_CATALOGUE = [
    {
        "fault_type": "POWER_LOW",
        "threshold": lambda d: (d.battery or 100) < 40,
        "probability_fn": lambda d: round(max(0, (40 - (d.battery or 100)) / 40), 3),
        "severity": "CRITICAL",
        "recommended_action": (
            "Activate battery heater array. Reduce non-essential power draws. "
            "Align solar arrays to maximum irradiance angle."
        ),
    },
    {
        "fault_type": "THERMAL_ANOMALY",
        "threshold": lambda d: (d.temperature or -15) < -45,
        "probability_fn": lambda d: round(min(1, abs((d.temperature or -15) + 45) / 30), 3),
        "severity": "WARNING",
        "recommended_action": (
            "Enable thermal loop heater cycle. Check insulation shunt valve status."
        ),
    },
    {
        "fault_type": "DSN_DEGRADED",
        "threshold": lambda d: (d.latency or 120) > 135,
        "probability_fn": lambda d: round(min(1, ((d.latency or 120) - 135) / 15), 3),
        "severity": "WARNING",
        "recommended_action": (
            "Execute antenna re-pointing sweep. Switch to MRO relay backup link."
        ),
    },
    {
        "fault_type": "HIGH_POWER_DRAW",
        "threshold": lambda d: (d.power_draw or 150) > 240,
        "probability_fn": lambda d: round(min(1, ((d.power_draw or 150) - 240) / 60), 3),
        "severity": "WARNING",
        "recommended_action": (
            "Shed non-critical instrument loads. Defer APXS science window."
        ),
    },
]


def _mock_fault_predictions(data: TelemetryInput) -> List[FaultPrediction]:
    """Return rule-based fault predictions when no model is loaded."""
    predictions: List[FaultPrediction] = []
    for fault in _FAULT_CATALOGUE:
        prob = fault["probability_fn"](data)
        if prob > 0.05 or fault["threshold"](data):
            predictions.append(FaultPrediction(
                fault_type=fault["fault_type"],
                probability=prob,
                severity=fault["severity"],
                recommended_action=fault["recommended_action"],
            ))

    # Always include a nominal "OK" entry if no issues are detected
    if not predictions:
        predictions.append(FaultPrediction(
            fault_type="NOMINAL",
            probability=0.98,
            severity="INFO",
            recommended_action="No action required. All systems nominal.",
        ))

    return predictions


# ──────────────────────────────────────────────────────────────
# Model-based predictions
# ──────────────────────────────────────────────────────────────

_SEVERITY_LABELS = {0: "INFO", 1: "WARNING", 2: "CRITICAL"}
_FAULT_LABELS    = {0: "NOMINAL", 1: "POWER_LOW", 2: "THERMAL_ANOMALY",
                    3: "DSN_DEGRADED", 4: "HIGH_POWER_DRAW", 5: "PROPULSION_FAULT"}


def _model_fault_predictions(data: TelemetryInput) -> List[FaultPrediction]:
    """
    Run the loaded sklearn model and translate its output to FaultPrediction objects.

    Expected model API: sklearn-style with .predict() and optionally .predict_proba().
    """
    model = get_model()
    features = _build_feature_vector(data)

    try:
        label = int(model.predict(features)[0])
    except Exception as exc:
        logger.error(f"Model prediction error: {exc}. Falling back to mock.")
        return _mock_fault_predictions(data)

    # Try to get probabilities if the model supports it
    try:
        proba = float(np.max(model.predict_proba(features)))
    except AttributeError:
        proba = 0.90  # fallback confidence

    fault_name = _FAULT_LABELS.get(label, "UNKNOWN")
    severity   = _SEVERITY_LABELS.get(min(label, 2), "INFO")

    action_map = {
        "NOMINAL":           "No action required. All systems nominal.",
        "POWER_LOW":         "Activate battery heater array and optimise solar array tilt.",
        "THERMAL_ANOMALY":   "Enable thermal loop heater cycle.",
        "DSN_DEGRADED":      "Execute antenna re-pointing sweep to MRO relay.",
        "HIGH_POWER_DRAW":   "Defer non-critical instruments immediately.",
        "PROPULSION_FAULT":  "Halt movement. Run wheel subsystem self-test.",
    }

    return [FaultPrediction(
        fault_type=fault_name,
        probability=round(proba, 3),
        severity=severity,
        recommended_action=action_map.get(fault_name, "Consult mission operations."),
    )]


# ──────────────────────────────────────────────────────────────
# Public service function
# ──────────────────────────────────────────────────────────────

def run_prediction(data: TelemetryInput) -> PredictionResponse:
    """
    Entry point called by the /predict API route.
    Dispatches to either the real model or the mock fallback.
    """
    health_score = _derive_health_score(data)
    input_dict: Dict[str, Any] = data.model_dump(exclude_none=True)

    if is_model_loaded():
        logger.info("Running prediction using loaded model.pkl")
        faults = _model_fault_predictions(data)
        model_used = "model.pkl"
    else:
        logger.info("model.pkl not available — using rule-based mock predictions")
        faults = _mock_fault_predictions(data)
        model_used = "mock"

    critical_faults = [f for f in faults if f.severity == "CRITICAL"]
    navigation_safe = len(critical_faults) == 0

    if critical_faults:
        summary = (
            f"{len(critical_faults)} critical fault(s) detected: "
            + ", ".join(f.fault_type for f in critical_faults)
            + ". Immediate operator attention required."
        )
    elif any(f.severity == "WARNING" for f in faults):
        summary = "Minor anomalies detected. Monitor subsystems closely."
    else:
        summary = "All systems nominal. Rover is fully operational."

    return PredictionResponse(
        prediction_id=f"pred-{uuid.uuid4().hex[:8]}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        model_used=model_used,
        input_features=input_dict,
        fault_predictions=faults,
        overall_health_score=round(health_score, 2),
        navigation_safe=navigation_safe,
        summary=summary,
    )
