from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Literal

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    AI_PORT: int = 4006

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # RabbitMQ Settings
    RABBITMQ_URL: str
    RABBITMQ_EXCHANGE_NAME: str
    AI_QUEUE_NAME: str

    # LLM Settings
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_BASE_URL: str | None = None
    DEFAULT_MODEL: str | None = None
    AVAILABLE_MODELS: str | None = None  # Comma-separated list of available models

    AI_DB_USER: str
    AI_DB_PASSWORD: str
    AI_DB_NAME: str
    AI_DATABASE_URL: str

    PROBLEM_SERVICE_URL: str = "http://problem-service:4003"
    AUTH_SERVICE_URL: str = "http://auth-service:4001"

    INTERNAL_API_KEY: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

settings = Settings()