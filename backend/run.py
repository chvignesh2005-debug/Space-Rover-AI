"""
Entry-point script for running the backend from the `backend/` directory.

Usage:
    python run.py
    # or
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
