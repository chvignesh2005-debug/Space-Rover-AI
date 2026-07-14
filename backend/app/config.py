from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables / .env file.
    All sensitive values (API keys etc.) are read from the environment only.
    """

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # CORS — comma-separated list resolved to a Python list below
    CORS_ORIGINS: str = os.getenv(
    "CORS_ORIGINS",
    "https://main.d3ff6psmre7r2a.amplifyapp.com"
)

    # OpenAI (never hard-coded — must exist in .env)
    OPENAI_API_KEY: str = ""

    # Model path (relative to the backend directory)
    MODEL_PATH: str = "../ml_model/model.pkl"

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
