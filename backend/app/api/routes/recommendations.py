from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.item import Item
from app.schemas.recommendation import RecommendedItem, RecommendationReason, ChatRequest, ChatResponse
from app.schemas.item import ItemOut
from app.ml.pipeline import pipeline

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

MOOD_LABEL_MAP = {
    "happy": "😊 Happy vibes",
    "emotional": "😢 Emotional journey",
    "thriller": "😱 Edge-of-seat thriller",
    "relaxed": "😴 Relaxing",
    "romantic": "❤️ Romance",
    "motivational": "💪 Motivational",
    "adventure": "🌍 Adventure",
    "funny": "😂 Comedy",
}


def _build_recommended_items(
    raw_results: List[dict],
    db: Session,
    limit: int = 20,
) -> List[RecommendedItem]:
    if not raw_results:
        return []

    result_ids = [r["item_id"] for r in raw_results[:limit]]
    items = db.query(Item).filter(Item.id.in_(result_ids), Item.is_active).all()
    id_to_item = {i.id: i for i in items}

    output = []
    for r in raw_results[:limit]:
        item = id_to_item.get(r["item_id"])
        if not item:
            continue
        reasons = [
            RecommendationReason(
                type=r.get("reason_type", "hybrid"),
                label=r.get("reason_label", "Recommended for you"),
                confidence=round(r.get("confidence", r.get("score", 0.5)), 2),
                detail=r.get("detail", ""),
            )
        ]
        # Add extra explainability reasons from hybrid
        for extra in r.get("reasons", []):
            reasons.append(
                RecommendationReason(
                    type=extra.get("type", ""),
                    label=extra.get("label", ""),
                    confidence=float(extra.get("confidence", 0.5)),
                    detail=extra.get("detail", ""),
                )
            )
        output.append(
            RecommendedItem(
                item=ItemOut.model_validate(item),
                score=round(float(r.get("score", 0)), 4),
                reasons=reasons[:4],   # cap at 4 reasons
                match_percentage=r.get("match_percentage", min(int(float(r.get("score", 0)) * 100), 99)),
            )
        )
    return output


@router.get("/trending")
def get_trending(
    domain: Optional[str] = None,
    n: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    raw = pipeline.get_trending(domain=domain, n=n)
    return _build_recommended_items(raw, db, limit=n)


@router.get("/personalized")
def get_personalized(
    domain: Optional[str] = None,
    mood: Optional[str] = None,
    n: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if not pipeline.is_ready:
        # Auto-train on first request
        pipeline.train(db)

    now_hour = datetime.now().hour
    if 5 <= now_hour < 12:
        time_context = "morning"
    elif 12 <= now_hour < 18:
        time_context = "afternoon"
    elif 18 <= now_hour < 22:
        time_context = "evening"
    else:
        time_context = "night"

    genres = (current_user.preferred_genres or []) if current_user else []
    moods = (current_user.preferred_moods or []) if current_user else []
    if mood:
        moods = [mood] + moods

    raw = pipeline.get_recommendations(
        user_id=current_user.id if current_user else None,
        domain=domain,
        mood=mood,
        preferred_genres=genres,
        time_context=time_context,
        n=n,
        db=db,
    )
    return _build_recommended_items(raw, db, limit=n)


@router.get("/similar/{item_id}")
def get_similar(
    item_id: int,
    n: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not pipeline.is_ready:
        pipeline.train(db)

    raw = pipeline.get_similar_items(item_id, n=n)
    return _build_recommended_items(raw, db, limit=n)


@router.get("/explain/{item_id}")
def explain_recommendation(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    from app.models.rating import Rating
    # Build explanation from signals
    reasons = []

    # Check user's past ratings for similar items
    user_ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id, Rating.rating >= 4.0
    ).limit(50).all()

    if user_ratings:
        high_rated = [r.item for r in user_ratings if r.item and r.item.domain == item.domain]
        if high_rated:
            similar_title = high_rated[0].title
            reasons.append({
                "type": "user_history",
                "label": f"Because you liked '{similar_title}'",
                "confidence": 0.85,
                "detail": "High similarity to items you've rated 4★+",
            })

    # Genre match
    if current_user.preferred_genres and item.genres:
        matched = [g for g in item.genres if g in current_user.preferred_genres]
        if matched:
            reasons.append({
                "type": "genre_match",
                "label": f"Matches your {matched[0]} preference",
                "confidence": 0.9,
                "detail": f"You prefer {', '.join(matched[:2])}",
            })

    # Popularity signal
    if item.total_ratings > 10 and item.avg_rating >= 4.0:
        reasons.append({
            "type": "popularity",
            "label": f"Loved by {item.total_ratings}+ users",
            "confidence": item.avg_rating / 5.0,
            "detail": f"Average rating: {item.avg_rating:.1f}★",
        })

    # Trending
    from app.ml.pipeline import pipeline
    trend_score = pipeline.trending_engine.get_score(item_id)
    if trend_score > 0.6:
        reasons.append({
            "type": "trending",
            "label": "Trending in your domain",
            "confidence": trend_score,
            "detail": "High recent activity",
        })

    if not reasons:
        reasons.append({
            "type": "discovery",
            "label": "Curated for discovery",
            "confidence": 0.5,
            "detail": "Broadens your taste profile",
        })

    return {
        "item": ItemOut.model_validate(item),
        "reasons": reasons,
        "summary": f"Recommended because it matches {len(reasons)} of your preference signals.",
    }


@router.post("/chat", response_model=ChatResponse)
def chat_recommendation(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """LLM-style chat that returns semantic search results."""
    if not pipeline.is_ready:
        pipeline.train(db)

    raw = pipeline.semantic_search(
        query=payload.message,
        domain=payload.domain,
        n=10,
    )
    recs = _build_recommended_items(raw, db, limit=8)

    # Build a natural-language reply
    if recs:
        titles = [r.item.title for r in recs[:3]]
        reply = (
            f"Based on your request, I found {len(recs)} great matches! "
            f"Top picks: {', '.join(titles)}. "
            f"These were selected using semantic understanding of your query."
        )
    else:
        reply = "I couldn't find specific matches. Try rephrasing your request or explore our trending items!"

    return ChatResponse(reply=reply, recommendations=recs)
