"""
utils/logger.py

Centralised logging configuration for the Space-Rover-AI backend.
Call `setup_logging()` once at application startup.
"""

import logging
import sys
from app.config import settings


def setup_logging() -> None:
    """Configure root logger with a consistent format."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid adding duplicate handlers on reload
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    # Suppress noisy uvicorn access logs in non-debug mode
    if not settings.DEBUG:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
