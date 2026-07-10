from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.rating import Rating, Bookmark
from app.models.interaction import Interaction
from app.schemas.user import UserOut, UserUpdate
from app.schemas.item import RatingOut
from app.schemas.recommendation import OnboardingRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/onboarding", response_model=UserOut)
def complete_onboarding(
    payload: OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.preferred_domains = payload.preferred_domains
    current_user.preferred_genres = payload.preferred_genres
    current_user.preferred_moods = payload.preferred_moods or []
    current_user.onboarding_complete = True

    # Record seed ratings for cold-start bootstrap
    from app.models.item import Item
    for item_id in (payload.seed_item_ids or []):
        item = db.query(Item).filter(Item.id == item_id).first()
        if item:
            existing = db.query(Rating).filter(
                Rating.user_id == current_user.id, Rating.item_id == item_id
            ).first()
            if not existing:
                db.add(Rating(user_id=current_user.id, item_id=item_id, rating=4.0))

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/ratings", response_model=List[RatingOut])
def get_my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Rating).filter(Rating.user_id == current_user.id).all()


@router.get("/bookmarks")
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.item import ItemOut
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    items = [b.item for b in bookmarks]
    return [ItemOut.model_validate(i) for i in items]


@router.get("/history")
def get_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.item import ItemOut
    interactions = (
        db.query(Interaction)
        .filter(
            Interaction.user_id == current_user.id,
            Interaction.interaction_type.in_(["view", "click"]),
        )
        .order_by(Interaction.created_at.desc())
        .limit(limit)
        .all()
    )
    seen, result = set(), []
    for i in interactions:
        if i.item_id not in seen:
            seen.add(i.item_id)
            result.append(ItemOut.model_validate(i.item))
    return result


@router.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ratings = db.query(Rating).filter(Rating.user_id == current_user.id).all()
    total_ratings = len(ratings)
    avg_given = sum(r.rating for r in ratings) / total_ratings if total_ratings else 0
    bookmarks_count = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).count()
    interactions_count = db.query(Interaction).filter(Interaction.user_id == current_user.id).count()

    genre_dist: dict = {}
    for r in ratings:
        genres = r.item.genres or [r.item.genre]
        for g in genres:
            if g:
                genre_dist[g] = genre_dist.get(g, 0) + 1

    return {
        "total_ratings": total_ratings,
        "avg_rating_given": round(avg_given, 2),
        "bookmarks": bookmarks_count,
        "interactions": interactions_count,
        "genre_distribution": genre_dist,
        "member_since": current_user.created_at.isoformat() if current_user.created_at else None,
    }
