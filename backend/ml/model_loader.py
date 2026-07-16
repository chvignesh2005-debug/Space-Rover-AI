"""
ml/model_loader.py

Responsible for loading the trained model.pkl from disk.

──────────────────────────────────────────────────────────────────────
ROOT CAUSE OF THE PREVIOUS "STACK_GLOBAL requires str" FAILURE
──────────────────────────────────────────────────────────────────────
Two independent problems, both now fixed:

1. Format/version mismatch: the committed model.pkl was produced with
   `joblib.dump()` under scikit-learn 1.9.0 / numpy>=2.0 (which stores
   arrays under the `numpy._core` module path introduced in NumPy 2.0),
   but this loader used plain `pickle.load()`, and production installs
   numpy==1.26.4 / scikit-learn==1.5.1 (no `numpy._core` module exists
   there — only the pre-2.0 `numpy.core`). Pickle's STACK_GLOBAL opcode
   tried to resolve `numpy._core.multiarray...` and failed. Fix:
   model.pkl is now regenerated with `ml_model/train_model.py` using the
   exact versions pinned in backend/requirements.txt, and always
   loaded/saved with `joblib` (matching library, matching versions).

2. A second, deeper mismatch existed even after fixing serialization:
   the OLD model.pkl was trained on an unrelated 8-feature schema with
   STRING labels, while `services/prediction_service.py` always sends a
   10-feature vector and expects integer labels 0-5. That would have
   raised a scikit-learn feature-count `ValueError` (or a string->int
   cast error) on every single prediction, which the broad
   `except Exception` in `_model_fault_predictions()` silently caught
   and fell back to mock — see the rewritten train_model.py for the fix.

──────────────────────────────────────────────────────────────────────
"SILENT" FALLBACK — NOW LOUD, STILL AVAILABLE
──────────────────────────────────────────────────────────────────────
If the model still fails to load for any reason (missing file,
corrupted artifact, dependency mismatch), the backend still falls back
to rule-based mock predictions rather than refusing to serve any
traffic — but that fallback is no longer silent:
  - It's logged at CRITICAL level (not just a warning), with the full
    exception and stack trace.
  - `GET /api/v1/health` already reports `model_loaded: false` and a
    human-readable message.
  - `POST /api/v1/predict` already reports `model_used: "mock"` in
    every response body while the fallback is active.
  - Setting `STRICT_MODEL_LOADING=true` (see backend/.env.example) makes
    a failed model load a fatal startup error instead of a silent
    degrade — appropriate if you'd rather the deploy fail loudly than
    quietly serve mock predictions in production.
"""

import os
import logging
from typing import Optional, Any

import joblib

logger = logging.getLogger(__name__)

# Singleton holder so the model is loaded only once at startup
_model: Optional[Any] = None
_model_loaded: bool = False


class ModelLoadError(Exception):
    """Raised when STRICT_MODEL_LOADING is enabled and the model fails to load."""


def load_model(model_path: str) -> bool:
    """
    Attempt to load a scikit-learn model (persisted with joblib) from disk.

    Returns True if a model was successfully loaded, False otherwise
    (unless STRICT_MODEL_LOADING is enabled, in which case failures
    raise ModelLoadError instead of returning False).
    """
    global _model, _model_loaded

    strict = os.getenv("STRICT_MODEL_LOADING", "false").lower() == "true"

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    candidate_paths = [
        os.path.abspath(os.path.join(BASE_DIR, model_path)),
        os.path.abspath(os.path.join(BASE_DIR, "ml", "model.pkl")),
        os.path.abspath(os.path.join(BASE_DIR, "..", "ml_model", "model.pkl")),
    ]

    abs_path = None
    for candidate in candidate_paths:
        if os.path.isfile(candidate):
            abs_path = candidate
            break

    if abs_path is None:
        abs_path = candidate_paths[0]
    logger.info(f"Attempting to load model from: {abs_path}")

    if not os.path.isfile(abs_path):
        message = (
            f"model.pkl not found at '{abs_path}'. "
            "Backend will use mock predictions until a model is placed there."
        )
        if strict:
            raise ModelLoadError(message)
        logger.critical(message)
        _model_loaded = False
        return False

    try:
        file_size = os.path.getsize(abs_path)
        logger.info(f"Found model.pkl at {abs_path} (size={file_size} bytes)")
        _model = joblib.load(abs_path)
        _model_loaded = True
        logger.info(
            f"Model loaded successfully from {abs_path} "
            f"(type={type(_model).__name__})."
        )
        return True
    except Exception as exc:
        message = (
            f"Failed to deserialize model.pkl at '{abs_path}': {exc}. "
            "This usually means the numpy/scikit-learn/joblib versions used to "
            "train the model don't match backend/requirements.txt. Regenerate "
            "the model with ml_model/train_model.py using the exact versions "
            "pinned there."
        )
        if strict:
            raise ModelLoadError(message) from exc
        logger.critical(message, exc_info=True)
        _model_loaded = False
        return False


def get_model() -> Optional[Any]:
    """Return the loaded model (or None if unavailable)."""
    return _model


def is_model_loaded() -> bool:
    """Return whether a real model is currently in memory."""
    return _model_loaded