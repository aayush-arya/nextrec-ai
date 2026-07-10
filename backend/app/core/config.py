from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    SECRET_KEY: str = "nextrec-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    DATABASE_URL: str = "sqlite:///./recommendation.db"
    ENVIRONMENT: str = "development"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:4173"

    ADMIN_EMAIL: str = "admin@nextrec.ai"
    ADMIN_PASSWORD: str = "admin123"

    # ML settings
    TFIDF_MAX_FEATURES: int = 5000
    SVD_N_FACTORS: int = 50
    MIN_RATINGS_FOR_COLLABORATIVE: int = 5
    RECOMMENDATION_CACHE_TTL: int = 300  # seconds

    # Hybrid weights
    CONTENT_WEIGHT: float = 0.35
    COLLABORATIVE_WEIGHT: float = 0.35
    TRENDING_WEIGHT: float = 0.15
    POPULARITY_WEIGHT: float = 0.15

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
