from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.rating import Rating, Bookmark
from app.models.item import Item
from app.models.user import User
from app.schemas.item import RatingCreate, RatingOut

router = APIRouter(prefix="/ratings", tags=["Ratings"])


def _update_item_stats(item: Item, db: Session) -> None:
    ratings = db.query(Rating).filter(Rating.item_id == item.id).all()
    if ratings:
        item.total_ratings = len(ratings)
        item.avg_rating = round(sum(r.rating for r in ratings) / len(ratings), 2)
        # Popularity score: normalized product of count and avg rating
        item.popularity_score = round((item.total_ratings * item.avg_rating) / 5.0, 4)
    db.commit()


@router.post("", response_model=RatingOut, status_code=201)
def rate_item(
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1.0 <= payload.rating <= 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    item = db.query(Item).filter(Item.id == payload.item_id, Item.is_active == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id, Rating.item_id == payload.item_id
    ).first()

    if existing:
        existing.rating = payload.rating
        existing.review = payload.review or existing.review
        db.commit()
        db.refresh(existing)
        _update_item_stats(item, db)
        return existing

    rating = Rating(
        user_id=current_user.id,
        item_id=payload.item_id,
        rating=payload.rating,
        review=payload.review or "",
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    _update_item_stats(item, db)
    return rating


@router.delete("/{item_id}", status_code=204)
def delete_rating(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id, Rating.item_id == item_id
    ).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    item = db.query(Item).filter(Item.id == item_id).first()
    db.delete(rating)
    db.commit()
    if item:
        _update_item_stats(item, db)


@router.post("/bookmark/{item_id}", status_code=201)
def toggle_bookmark(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id, Bookmark.item_id == item_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}

    db.add(Bookmark(user_id=current_user.id, item_id=item_id))
    db.commit()
    return {"bookmarked": True}


@router.post("/interact", status_code=201)
def log_interaction(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.interaction import Interaction
    interaction = Interaction(
        user_id=current_user.id,
        item_id=payload.get("item_id"),
        interaction_type=payload.get("interaction_type", "view"),
        duration_seconds=payload.get("duration_seconds", 0),
        source=payload.get("source", ""),
        session_id=payload.get("session_id", ""),
    )
    db.add(interaction)
    db.commit()
    return {"status": "logged"}
