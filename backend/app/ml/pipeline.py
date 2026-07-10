"""
ML Pipeline Coordinator.
Single entry point that manages model lifecycle, training, and inference.
"""
import pandas as pd
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session

from app.ml.content_based import ContentBasedFilter
from app.ml.collaborative import CollaborativeFilter
from app.ml.hybrid import HybridEngine
from app.ml.semantic import SemanticEngine
from app.ml.trending import TrendingEngine
from app.ml.cold_start import ColdStartSolver
from app.core.config import settings

logger = logging.getLogger(__name__)


class RecommendationPipeline:
    def __init__(self):
        self.content_filter = ContentBasedFilter(max_features=settings.TFIDF_MAX_FEATURES)
        self.collab_filter = CollaborativeFilter(n_factors=settings.SVD_N_FACTORS)
        self.hybrid_engine = HybridEngine(
            content_weight=settings.CONTENT_WEIGHT,
            collaborative_weight=settings.COLLABORATIVE_WEIGHT,
            trending_weight=settings.TRENDING_WEIGHT,
            popularity_weight=settings.POPULARITY_WEIGHT,
        )
        self.semantic_engine = SemanticEngine()
        self.trending_engine = TrendingEngine()
        self.cold_start_solver = ColdStartSolver()

        self.last_trained: Optional[datetime] = None
        self.is_ready = False
        self._items_cache: Optional[pd.DataFrame] = None

    def train(self, db: Session) -> Dict[str, Any]:
        from app.models.item import Item
        from app.models.rating import Rating
        from app.models.interaction import Interaction

        logger.info("Training ML pipeline...")
        start = datetime.now(timezone.utc)

        # Load data
        items = db.query(Item).filter(Item.is_active).all()
        ratings = db.query(Rating).all()
        interactions = db.query(Interaction).all()

        items_data = [
            {
                "id": i.id,
                "title": i.title,
                "domain": i.domain,
                "description": i.description,
                "genre": i.genre,
                "genres": i.genres or [],
                "tags": i.tags or [],
                "keywords": i.keywords or [],
                "metadata_json": i.metadata_json or {},
                "avg_rating": i.avg_rating,
                "total_ratings": i.total_ratings,
                "popularity_score": i.popularity_score,
                "release_year": i.release_year,
                "created_at": i.created_at,
            }
            for i in items
        ]
        items_df = pd.DataFrame(items_data)

        ratings_data = [{"user_id": r.user_id, "item_id": r.item_id, "rating": r.rating} for r in ratings]
        ratings_df = pd.DataFrame(ratings_data)

        interactions_data = [
            {"user_id": x.user_id, "item_id": x.item_id, "interaction_type": x.interaction_type}
            for x in interactions
        ]
        interactions_df = pd.DataFrame(interactions_data)

        self._items_cache = items_df

        # Train each component
        self.content_filter.fit(items_df)
        self.semantic_engine.fit(items_df)
        self.trending_engine.fit(items_df, interactions_df if not interactions_df.empty else None)
        self.cold_start_solver.fit(items_df)
        self.hybrid_engine.set_items(items_df)

        if len(ratings_df) >= settings.MIN_RATINGS_FOR_COLLABORATIVE:
            self.collab_filter.fit(ratings_df)

        self.last_trained = datetime.now(timezone.utc)
        self.is_ready = True
        elapsed = (datetime.now(timezone.utc) - start).total_seconds()

        result = {
            "status": "success",
            "items_count": len(items_df),
            "ratings_count": len(ratings_df),
            "collaborative_trained": self.collab_filter.is_trained,
            "semantic_neural": self.semantic_engine.use_neural,
            "elapsed_seconds": round(elapsed, 2),
            "trained_at": self.last_trained.isoformat(),
        }
        logger.info(f"Pipeline trained in {elapsed:.2f}s: {result}")
        return result

    def get_recommendations(
        self,
        user_id: Optional[int],
        domain: Optional[str] = None,
        mood: Optional[str] = None,
        preferred_genres: Optional[List[str]] = None,
        time_context: Optional[str] = None,
        n: int = 20,
        exclude_ids: Optional[List[int]] = None,
        db: Optional[Session] = None,
    ) -> List[Dict]:
        if not self.is_ready:
            return []

        # Fetch user's rated + interacted items for personalization
        rated_ids: List[int] = []
        if user_id and db:
            from app.models.rating import Rating
            rated_ids = [r.item_id for r in db.query(Rating).filter(Rating.user_id == user_id).all()]

        # Determine algorithm path
        use_collaborative = self.collab_filter.is_trained and user_id is not None
        is_cold_start = not rated_ids or len(rated_ids) < 3

        if is_cold_start:
            return self.cold_start_solver.get_recommendations(
                preferred_genres=preferred_genres or [],
                preferred_moods=[mood] if mood else [],
                domain=domain,
                time_context=time_context,
                n=n,
            )

        content_results = self.content_filter.get_recommendations_from_profile(rated_ids, n=n * 2, domain=domain)
        collab_results = (
            self.collab_filter.get_recommendations(
                user_id,
                n=n * 2,
                domain_item_ids=self._get_domain_item_ids(domain),
            )
            if use_collaborative else []
        )
        trending_results = self.trending_engine.get_trending(n=n, domain=domain)

        return self.hybrid_engine.recommend(
            user_id=user_id,
            domain=domain,
            content_results=content_results,
            collab_results=collab_results,
            trending_results=trending_results,
            n=n,
            exclude_ids=(exclude_ids or []) + rated_ids,
        )

    def get_similar_items(self, item_id: int, n: int = 10) -> List[Dict]:
        if not self.is_ready:
            return []
        content_sim = self.content_filter.get_similar_items(item_id, n=n)
        semantic_sim = self.semantic_engine.find_similar(item_id, n=n)
        cf_sim = self.collab_filter.get_similar_items_cf(item_id, n=n // 2)

        merged: Dict[int, Dict] = {}
        for r in content_sim:
            merged[r["item_id"]] = r
        for r in semantic_sim:
            if r["item_id"] not in merged:
                merged[r["item_id"]] = r
            else:
                merged[r["item_id"]]["score"] = max(merged[r["item_id"]]["score"], r["score"])
        for r in cf_sim:
            if r["item_id"] not in merged:
                merged[r["item_id"]] = r

        results = sorted(merged.values(), key=lambda x: x["score"], reverse=True)
        return results[:n]

    def semantic_search(self, query: str, domain: Optional[str] = None, n: int = 20) -> List[Dict]:
        return self.semantic_engine.search(query, n=n, domain=domain)

    def get_trending(self, domain: Optional[str] = None, n: int = 20) -> List[Dict]:
        return self.trending_engine.get_trending(n=n, domain=domain)

    def _get_domain_item_ids(self, domain: Optional[str]) -> Optional[List[int]]:
        if self._items_cache is None or not domain:
            return None
        filtered = self._items_cache[self._items_cache["domain"] == domain]
        return filtered["id"].tolist()

    def status(self) -> Dict[str, Any]:
        return {
            "is_ready": self.is_ready,
            "last_trained": self.last_trained.isoformat() if self.last_trained else None,
            "content_filter_trained": self.content_filter.is_trained,
            "collaborative_filter_trained": self.collab_filter.is_trained,
            "semantic_neural_mode": self.semantic_engine.use_neural,
            "trending_trained": self.trending_engine.is_trained,
            "cold_start_ready": self.cold_start_solver.is_ready,
            "items_in_cache": len(self._items_cache) if self._items_cache is not None else 0,
        }


# Singleton instance
pipeline = RecommendationPipeline()
