from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    API_KEY: str

    ENVIRONMENT: str = "development"

    AI_PORT: int = 4006

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    RABBITMQ_URL: str
    RABBITMQ_EXCHANGE_NAME: str
    AI_QUEUE_NAME: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

settings = Settings()

print(f"Loading .env from: {ENV_FILE}")
print(f".env exists: {ENV_FILE.exists()}")