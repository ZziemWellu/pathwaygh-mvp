from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    ALLOWED_HOSTS: List[str] = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pathwaygh.db")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    USE_AI_CHATBOT: bool = os.getenv("USE_AI_CHATBOT", "False").lower() == "true"


settings = Settings()
