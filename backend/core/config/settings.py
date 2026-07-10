"""
Central Configuration Service
Single source of truth for all settings
"""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Pathway AI"
    APP_VERSION: str = "3.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # API
    API_PREFIX: str = "/api"
    API_VERSION: str = "v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:8001"
    ).split(",")
    
    # Database (Future PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/pathway_ai"
    )
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "20"))
    
    # Redis (Cache & Session)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    USE_AI: bool = os.getenv("USE_AI", "True").lower() == "true"
    
    # Ghana-specific
    GHANA_REGIONS: List[str] = [
        "Greater Accra", "Ashanti", "Northern", "Volta", "Western",
        "Eastern", "Central", "Brong Ahafo", "Upper East", "Upper West"
    ]
    WASSCE_GRADES: List[str] = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"]
    
    # File paths
    DATA_DIR: str = "data"
    COURSES_DIR: str = "data/courses"
    PROGRESS_DIR: str = "data/progress"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
