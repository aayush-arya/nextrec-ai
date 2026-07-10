from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.item import Item
from app.models.rating import Rating
from app.models.interaction import Interaction
from app.ml.pipeline import pipeline

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total_users = db.query(User).count()
    total_items = db.query(Item).filter(Item.is_active).count()
    total_ratings = db.query(Rating).count()
    total_interactions = db.query(Interaction).count()

    domain_dist = db.query(Item.domain, func.count(Item.id)).filter(Item.is_active).group_by(Item.domain).all()
    genre_dist_raw = db.query(Item.genre, func.count(Item.id)).filter(Item.is_active, Item.genre != "").group_by(Item.genre).order_by(func.count(Item.id).desc()).limit(10).all()

    avg_rating = db.query(func.avg(Rating.rating)).scalar()
    rating_dist = db.query(func.round(Rating.rating), func.count(Rating.id)).group_by(func.round(Rating.rating)).all()

    return {
        "total_users": total_users,
        "total_items": total_items,
        "total_ratings": total_ratings,
        "total_interactions": total_interactions,
        "avg_platform_rating": round(float(avg_rating or 0), 2),
        "domain_distribution": [{"domain": d, "count": c} for d, c in domain_dist],
        "top_genres": [{"genre": g, "count": c} for g, c in genre_dist_raw],
        "rating_distribution": [{"rating": float(r or 0), "count": c} for r, c in rating_dist],
        "model_status": pipeline.status(),
    }


@router.post("/train")
def trigger_training(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    def train_job():
        pipeline.train(db)

    background_tasks.add_task(train_job)
    return {"message": "Training started in background", "status": "queued"}


@router.post("/train/sync")
def trigger_training_sync(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = pipeline.train(db)
    return {"message": "Training complete", **result}


@router.get("/users")
def list_users(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    from app.schemas.user import UserOut
    offset = (page - 1) * limit
    users = db.query(User).offset(offset).limit(limit).all()
    total = db.query(User).count()
    return {
        "users": [UserOut.model_validate(u) for u in users],
        "total": total,
        "page": page,
    }


@router.get("/model/status")
def model_status(_: User = Depends(get_current_admin)):
    return pipeline.status()


@router.get("/logs")
def get_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    recent_interactions = (
        db.query(Interaction)
        .order_by(Interaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": i.id,
            "user_id": i.user_id,
            "item_id": i.item_id,
            "type": i.interaction_type,
            "source": i.source,
            "at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in recent_interactions
    ]
