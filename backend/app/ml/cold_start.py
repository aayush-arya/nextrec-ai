"""
Cold-Start Solver for new users.
Uses genre/mood preferences + popularity signals to bootstrap recommendations.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

MOOD_GENRE_MAP = {
    # Original 8
    "happy":        ["Comedy", "Animation", "Family", "Musical", "Romance"],
    "emotional":    ["Drama", "Biography", "Romance", "War"],
    "thriller":     ["Thriller", "Horror", "Mystery", "Crime", "Suspense"],
    "relaxed":      ["Documentary", "Nature", "Travel", "Slice of Life"],
    "romantic":     ["Romance", "Drama", "Musical"],
    "motivational": ["Biography", "Sport", "Action", "Documentary"],
    "adventure":    ["Adventure", "Action", "Fantasy", "Sci-Fi"],
    "funny":        ["Comedy", "Animation", "Parody"],
    # New 8
    "nostalgic":    ["Classic", "Retro", "Period Drama", "Historical", "Vintage", "Biography"],
    "focused":      ["Instrumental", "Ambient", "Productivity", "Learning", "Non-fiction", "Educational"],
    "chill":        ["Lo-fi", "Jazz", "Indie", "Acoustic", "Ambient", "Chillout", "Nature"],
    "epic":         ["Action", "Superhero", "War", "Historical", "Fantasy", "Sci-Fi", "Blockbuster"],
    "curious":      ["Documentary", "Science", "Nature", "Educational", "Mystery", "History", "Technology"],
    "energetic":    ["Dance", "EDM", "Workout", "Sport", "Pop", "Hip-Hop", "Action"],
    "dreamy":       ["Fantasy", "Art", "Magical", "Animation", "Aesthetic", "Experimental"],
    "dark":         ["Noir", "Psychological", "Crime", "Horror", "Dark Comedy", "Suspense"],
}

TIME_CONTEXT_MAP = {
    "morning": ["News", "Documentary", "Productivity", "Learning", "Non-fiction"],
    "afternoon": ["Action", "Comedy", "Thriller", "Drama"],
    "evening": ["Drama", "Romance", "Musical", "Relaxing"],
    "night": ["Thriller", "Horror", "Sci-Fi", "Mystery", "Fantasy"],
    "weekend": ["Adventure", "Fantasy", "Long Courses", "Epic"],
}


class ColdStartSolver:
    def __init__(self):
        self.items_df: Optional[pd.DataFrame] = None
        self.is_ready = False

    def fit(self, items_df: pd.DataFrame) -> None:
        if items_df.empty:
            return
        self.items_df = items_df.reset_index(drop=True)
        self.is_ready = True
        logger.info(f"ColdStartSolver ready with {len(items_df)} items")

    def get_recommendations(
        self,
        preferred_genres: List[str],
        preferred_moods: Optional[List[str]] = None,
        domain: Optional[str] = None,
        time_context: Optional[str] = None,
        n: int = 20,
    ) -> List[Dict]:
        if not self.is_ready or self.items_df is None:
            return []

        df = self.items_df.copy()
        if domain:
            df = df[df["domain"] == domain]
        if df.empty:
            return self._fallback_popular(domain, n)

        # Build genre pool from explicit preferences + mood inference
        genre_pool = set(g.lower() for g in preferred_genres)
        if preferred_moods:
            for mood in preferred_moods:
                for g in MOOD_GENRE_MAP.get(mood.lower(), []):
                    genre_pool.add(g.lower())
        if time_context:
            for g in TIME_CONTEXT_MAP.get(time_context.lower(), []):
                genre_pool.add(g.lower())

        def genre_match_score(row) -> float:
            item_genres = [g.lower() for g in (row.get("genres") or [row.get("genre", "")])]
            matches = sum(1 for g in item_genres if any(p in g or g in p for p in genre_pool))
            return min(matches / max(len(genre_pool), 1), 1.0)

        df["_genre_score"] = df.apply(genre_match_score, axis=1)
        df["_pop_score"] = (
            df["popularity_score"] / df["popularity_score"].max().clip(lower=1)
        ).fillna(0)
        df["_rating_score"] = (df["avg_rating"].fillna(0) / 5.0)

        # Combined score: genre match is most important for cold start
        df["_cold_score"] = (
            0.5 * df["_genre_score"]
            + 0.3 * df["_rating_score"]
            + 0.2 * df["_pop_score"]
        )

        df = df.sort_values("_cold_score", ascending=False)

        # Apply diversity: take from multiple genres
        results = self._diversified_sample(df, n)
        return results

    def _diversified_sample(self, df: pd.DataFrame, n: int) -> List[Dict]:
        selected, seen_genres, results = [], set(), []
        # First pass: one per genre
        for _, row in df.iterrows():
            item_genres = set(g.lower() for g in (row.get("genres") or []))
            new_genre = item_genres - seen_genres
            if new_genre:
                selected.append(row)
                seen_genres |= item_genres
            if len(selected) >= n:
                break

        # Second pass: fill remaining slots
        if len(selected) < n:
            remaining = df[~df["id"].isin([r["id"] for r in selected])]
            extra = remaining.head(n - len(selected))
            selected.extend(extra.to_dict("records"))

        for row in selected[:n]:
            item_id = int(row["id"]) if not isinstance(row, pd.Series) else int(row["id"])
            score = float(row.get("_cold_score", 0.5))
            results.append(
                {
                    "item_id": item_id,
                    "score": score,
                    "reason_type": "cold_start",
                    "reason_label": "Picked for your taste profile",
                    "detail": "Based on your genre & mood preferences",
                }
            )
        return results

    def _fallback_popular(self, domain: Optional[str], n: int) -> List[Dict]:
        if self.items_df is None:
            return []
        df = self.items_df.copy()
        if domain:
            df = df[df["domain"] == domain]
        df = df.sort_values(["avg_rating", "total_ratings"], ascending=False).head(n)
        results = []
        for _, row in df.iterrows():
            results.append(
                {
                    "item_id": int(row["id"]),
                    "score": float(row.get("popularity_score", 0.5)),
                    "reason_type": "popular",
                    "reason_label": "Highly rated by everyone",
                    "detail": f"Avg rating {float(row.get('avg_rating',0)):.1f}★",
                }
            )
        return results
