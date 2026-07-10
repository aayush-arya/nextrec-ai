from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemOut, ItemCreate

router = APIRouter(prefix="/items", tags=["Items"])

VALID_DOMAINS = {"movies", "books", "music", "food", "courses", "products"}


@router.get("", response_model=List[ItemOut])
def list_items(
    domain: Optional[str] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Item).filter(Item.is_active)
    if domain:
        q = q.filter(Item.domain == domain)
    if genre:
        q = q.filter(or_(Item.genre.ilike(f"%{genre}%"), Item.genres.contains([genre])))
    if search:
        q = q.filter(or_(Item.title.ilike(f"%{search}%"), Item.description.ilike(f"%{search}%")))
    if featured is not None:
        q = q.filter(Item.is_featured == featured)
    if trending is not None:
        q = q.filter(Item.is_trending == trending)

    q = q.order_by(Item.popularity_score.desc(), Item.avg_rating.desc())
    offset = (page - 1) * limit
    items = q.offset(offset).limit(limit).all()
    return items


@router.get("/domains")
def list_domains(db: Session = Depends(get_db)):
    results = db.query(Item.domain, func.count(Item.id)).filter(Item.is_active).group_by(Item.domain).all()
    return [{"domain": d, "count": c} for d, c in results]


@router.get("/genres")
def list_genres(domain: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Item).filter(Item.is_active)
    if domain:
        q = q.filter(Item.domain == domain)
    items = q.all()
    genre_counts: dict = {}
    for item in items:
        genres = item.genres or ([item.genre] if item.genre else [])
        for g in genres:
            if g:
                genre_counts[g] = genre_counts.get(g, 0) + 1
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    return [{"genre": g, "count": c} for g, c in sorted_genres]


@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id, Item.is_active).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/{item_id}/similar", response_model=List[ItemOut])
def get_similar(item_id: int, n: int = 10, db: Session = Depends(get_db)):
    from app.ml.pipeline import pipeline
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    similar = pipeline.get_similar_items(item_id, n=n)
    if not similar:
        # Fallback: same genre, sorted by rating
        items = (
            db.query(Item)
            .filter(Item.domain == item.domain, Item.id != item_id, Item.is_active)
            .order_by(Item.avg_rating.desc())
            .limit(n)
            .all()
        )
        return items

    result_ids = [r["item_id"] for r in similar]
    items = db.query(Item).filter(Item.id.in_(result_ids)).all()
    id_to_item = {i.id: i for i in items}
    return [id_to_item[rid] for rid in result_ids if rid in id_to_item]


@router.post("", response_model=ItemOut, status_code=201)
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    if payload.domain not in VALID_DOMAINS:
        raise HTTPException(status_code=400, detail=f"Invalid domain. Choose from: {VALID_DOMAINS}")
    item = Item(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_active = False
    db.commit()
