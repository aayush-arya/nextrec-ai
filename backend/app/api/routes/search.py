from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.core.database import get_db
from app.models.item import Item
from app.schemas.item import ItemOut
from app.ml.pipeline import pipeline

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
def search(
    q: str = Query(..., min_length=1),
    domain: Optional[str] = None,
    genre: Optional[str] = None,
    min_rating: float = Query(0.0, ge=0, le=5),
    sort_by: str = Query("relevance", pattern="^(relevance|rating|newest|trending)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Semantic search via pipeline
    semantic_results = []
    if pipeline.is_ready:
        semantic_results = pipeline.semantic_search(query=q, domain=domain, n=limit * 2)

    semantic_ids = [r["item_id"] for r in semantic_results]

    # DB keyword fallback / merge
    db_q = db.query(Item).filter(
        Item.is_active == True,
        or_(
            Item.title.ilike(f"%{q}%"),
            Item.description.ilike(f"%{q}%"),
            Item.genre.ilike(f"%{q}%"),
        ),
    )
    if domain:
        db_q = db_q.filter(Item.domain == domain)
    if genre:
        db_q = db_q.filter(Item.genre.ilike(f"%{genre}%"))
    if min_rating > 0:
        db_q = db_q.filter(Item.avg_rating >= min_rating)

    db_items = db_q.all()
    db_ids = {i.id for i in db_items}

    # Merge: semantic hits first, then keyword hits
    all_ids = semantic_ids + [i for i in db_ids if i not in semantic_ids]

    # Fetch all
    all_items = db.query(Item).filter(Item.id.in_(all_ids), Item.is_active == True).all()
    id_map = {i.id: i for i in all_items}

    ordered_items = [id_map[i] for i in all_ids if i in id_map]

    # Apply sorting
    if sort_by == "rating":
        ordered_items.sort(key=lambda x: x.avg_rating, reverse=True)
    elif sort_by == "newest":
        ordered_items.sort(key=lambda x: x.release_year or 0, reverse=True)
    elif sort_by == "trending":
        ordered_items.sort(key=lambda x: x.popularity_score, reverse=True)

    offset = (page - 1) * limit
    paginated = ordered_items[offset : offset + limit]

    return {
        "results": [ItemOut.model_validate(i) for i in paginated],
        "query": q,
        "total": len(ordered_items),
        "page": page,
        "has_more": (offset + limit) < len(ordered_items),
        "search_type": "semantic+keyword" if semantic_results else "keyword",
    }


@router.get("/autocomplete")
def autocomplete(
    q: str = Query(..., min_length=1),
    domain: Optional[str] = None,
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    query = db.query(Item.id, Item.title, Item.domain, Item.poster_url).filter(
        Item.title.ilike(f"{q}%"), Item.is_active == True
    )
    if domain:
        query = query.filter(Item.domain == domain)
    items = query.limit(limit).all()
    return [{"id": i[0], "title": i[1], "domain": i[2], "poster_url": i[3]} for i in items]
