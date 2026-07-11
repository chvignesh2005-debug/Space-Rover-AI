"""
ml/model_loader.py

Responsible for loading the trained model.pkl from disk.
If the file is not found, the service falls back to built-in mock predictions
so the backend remains fully functional without a trained model.
"""

import os
import logging
import pickle
from typing import Optional, Any

logger = logging.getLogger(__name__)

# Singleton holder so the model is loaded only once at startup
_model: Optional[Any] = None
_model_loaded: bool = False


def load_model(model_path: str) -> bool:
    """
    Attempt to load a scikit-learn (or compatible pickle) model from disk.

    Returns True if a model was successfully loaded, False otherwise.
    """
    global _model, _model_loaded

    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    abs_path = os.path.abspath(os.path.join(BASE_DIR, model_path))
    print("Looking for model at:", abs_path)
    logger.info(f"Attempting to load model from: {abs_path}")

    if not os.path.isfile(abs_path):
        logger.warning(
            f"model.pkl not found at '{abs_path}'. "
            "Backend will use mock predictions until a model is placed there."
        )
        _model_loaded = False
        return False

    try:
        with open(abs_path, "rb") as f:
            _model = pickle.load(f)
        _model_loaded = True
        logger.info("Model loaded successfully.")
        return True
    except Exception as exc:
        logger.error(f"Failed to deserialise model.pkl: {exc}")
        _model_loaded = False
        return False


def get_model() -> Optional[Any]:
    """Return the loaded model (or None if unavailable)."""
    return _model


def is_model_loaded() -> bool:
    """Return whether a real model is currently in memory."""
    return _model_loaded
