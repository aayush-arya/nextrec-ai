from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ItemCreate(BaseModel):
    title: str
    domain: str
    description: Optional[str] = ""
    genre: Optional[str] = ""
    genres: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    keywords: Optional[List[str]] = []
    language: Optional[str] = "English"
    metadata_json: Optional[Dict[str, Any]] = {}
    poster_url: Optional[str] = ""
    backdrop_url: Optional[str] = ""
    release_year: Optional[int] = None
    duration: Optional[str] = ""


class ItemOut(BaseModel):
    id: int
    title: str
    domain: str
    description: str
    genre: str
    genres: List[str]
    tags: List[str]
    keywords: List[str]
    language: str
    metadata_json: Dict[str, Any]
    poster_url: str
    backdrop_url: str
    avg_rating: float
    total_ratings: int
    popularity_score: float
    release_year: Optional[int]
    duration: str
    is_trending: bool
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RatingCreate(BaseModel):
    item_id: int
    rating: float
    review: Optional[str] = ""


class RatingOut(BaseModel):
    id: int
    user_id: int
    item_id: int
    rating: float
    review: str
    created_at: datetime

    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    item_id: int
    interaction_type: str
    duration_seconds: Optional[float] = 0.0
    source: Optional[str] = ""
    session_id: Optional[str] = ""
