"""
Trending Recommendation Engine with time-decay scoring.
Inspired by Netflix / Reddit hot-score algorithms.
"""
import pandas as pd
from datetime import datetime, timezone
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

DECAY_FACTOR = 0.85   # how fast old activity loses influence
GRAVITY = 1.8         # controls time-decay steepness (higher = faster decay)


def _time_decay_score(total_ratings: int, avg_rating: float, age_days: float) -> float:
    """Hacker-News style gravity formula."""
    if total_ratings == 0:
        return 0.0
    score = (total_ratings * avg_rating) / ((age_days + 2) ** GRAVITY)
    return float(score)


class TrendingEngine:
    def __init__(self):
        self.trending_scores: Dict[int, float] = {}
        self.items_df: Optional[pd.DataFrame] = None
        self.is_trained = False

    def fit(self, items_df: pd.DataFrame, interactions_df: Optional[pd.DataFrame] = None) -> None:
        if items_df.empty:
            return

        self.items_df = items_df.copy()
        now = datetime.now(timezone.utc)

        scores = {}
        for _, row in items_df.iterrows():
            item_id = int(row["id"])

            created_at = row.get("created_at")
            if created_at is None:
                age_days = 365.0
            else:
                if hasattr(created_at, "tzinfo") and created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                elif isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at)
                        if created_at.tzinfo is None:
                            created_at = created_at.replace(tzinfo=timezone.utc)
                    except Exception:
                        created_at = now
                age_days = max((now - created_at).days, 0)

            base_score = _time_decay_score(
                int(row.get("total_ratings", 0)),
                float(row.get("avg_rating", 0.0)),
                age_days,
            )

            # Boost score using recent interactions if available
            if interactions_df is not None and not interactions_df.empty:
                recent_interactions = interactions_df[
                    interactions_df["item_id"] == item_id
                ]
                interaction_boost = len(recent_interactions) * 0.1
                base_score += interaction_boost

            scores[item_id] = base_score

        # Normalize to [0, 1]
        if scores:
            max_score = max(scores.values()) or 1.0
            self.trending_scores = {k: v / max_score for k, v in scores.items()}

        self.is_trained = True
        logger.info(f"TrendingEngine: scored {len(scores)} items")

    def get_trending(
        self, n: int = 20, domain: Optional[str] = None
    ) -> List[Dict]:
        if not self.is_trained or self.items_df is None:
            return []

        df = self.items_df.copy()
        if domain:
            df = df[df["domain"] == domain]

        df["_trend_score"] = df["id"].map(self.trending_scores).fillna(0)
        df = df.sort_values("_trend_score", ascending=False).head(n)

        results = []
        for _, row in df.iterrows():
            item_id = int(row["id"])
            score = self.trending_scores.get(item_id, 0.0)
            results.append(
                {
                    "item_id": item_id,
                    "score": score,
                    "reason_type": "trending",
                    "reason_label": "Trending right now",
                    "detail": f"Rated {int(row.get('total_ratings',0))}× with {float(row.get('avg_rating',0)):.1f}★",
                }
            )
        return results

    def get_score(self, item_id: int) -> float:
        return self.trending_scores.get(item_id, 0.0)
