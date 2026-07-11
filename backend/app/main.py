"""
app/main.py — Space-Rover-AI FastAPI Application Entry Point

Startup sequence:
  1. Load environment / settings (from backend/.env via pydantic-settings)
  2. Setup structured logging
  3. Attempt to load model.pkl (falls back to mock if not found)
  4. Create FastAPI app with CORS, metadata, and routers
  5. Uvicorn serves the app

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from utils.logger import setup_logging
from ml.model_loader import load_model
from api import api_router
from database.database import create_tables

# ── 1. Logging (must happen before any other log calls) ───────
setup_logging()
logger = logging.getLogger(__name__)


# ── 2. Lifespan: startup / shutdown events ────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ── STARTUP ──────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("  Space-Rover-AI Backend  //  Starting up")
    logger.info(f"  Environment : {settings.APP_ENV}")
    logger.info(f"  Debug mode  : {settings.DEBUG}")
    logger.info(f"  CORS origins: {settings.cors_origins_list}")
    logger.info("=" * 60)

    # Load the ML model (non-blocking — falls back to mock if absent)
    model_ok = load_model(settings.MODEL_PATH)
    create_tables()
    logger.info("SQLite database initialized.")
    if model_ok:
        logger.info("ML model loaded successfully.")
    else:
        logger.warning("ML model not found. API will serve mock predictions.")

    # Validate that the OpenAI key is configured (warn but don't crash)
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("sk-your"):
        logger.warning(
            "OPENAI_API_KEY is not set or is still the placeholder value. "
            "AI-powered features may be unavailable."
        )
    else:
        logger.info("OpenAI API key detected — AI features are available.")

    yield  # ←── application runs here

    # ── SHUTDOWN ─────────────────────────────────────────────
    logger.info("Space-Rover-AI Backend shutting down.")


# ── 3. FastAPI application instance ──────────────────────────
app = FastAPI(
    title="Space-Rover-AI API",
    description=(
        "Production-grade FastAPI backend for the Space-Rover-AI platform. "
        "Provides telemetry ingestion, ML-powered fault prediction, "
        "and health monitoring for Mars rover operations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── 4. CORS Middleware ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ── 5. Routers ────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── 6. Root endpoint ─────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse(content={
        "service": "Space-Rover-AI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    })
