from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.schemas.item import ItemOut


class RecommendationReason(BaseModel):
    type: str            # content|collaborative|trending|popularity|semantic|mood|cold_start
    label: str           # Human-readable reason
    confidence: float    # 0.0 – 1.0
    detail: Optional[str] = ""


class RecommendedItem(BaseModel):
    item: ItemOut
    score: float
    reasons: List[RecommendationReason]
    match_percentage: int   # 0-100 shown to user


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedItem]
    algorithm_used: str
    domain: str
    total: int
    page: int
    has_more: bool


class SearchResponse(BaseModel):
    results: List[ItemOut]
    query: str
    total: int
    search_type: str   # keyword|semantic|hybrid


class ChatRequest(BaseModel):
    message: str
    domain: Optional[str] = "movies"
    mood: Optional[str] = None
    context: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    reply: str
    recommendations: List[RecommendedItem]


class OnboardingRequest(BaseModel):
    preferred_domains: List[str]
    preferred_genres: List[str]
    preferred_moods: Optional[List[str]] = []
    seed_item_ids: Optional[List[int]] = []


class DashboardStats(BaseModel):
    total_users: int
    total_items: int
    total_ratings: int
    total_interactions: int
    top_domains: List[Dict[str, Any]]
    top_genres: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    model_status: Dict[str, Any]
