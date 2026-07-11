"""
Application Settings
"""

import os
from typing import List

class Settings:
    # API
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:8001"
    ]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pathwaygh.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # AI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Ghana-specific
    GHANA_REGIONS: List[str] = [
        "Greater Accra", "Ashanti", "Northern", "Volta", "Western",
        "Eastern", "Central", "Brong Ahafo", "Upper East", "Upper West"
    ]

settings = Settings()
