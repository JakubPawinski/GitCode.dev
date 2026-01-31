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
    LLM_PROVIDER: Literal["openai", "gemini"] = "gemini"
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"
    OPENAI_MODEL_NAME: str = "gpt-4.1-nano"

    AI_DB_USER: str
    AI_DB_PASSWORD: str
    AI_DB_NAME: str
    AI_DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

settings = Settings()