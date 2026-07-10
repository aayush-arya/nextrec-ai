"""
Hybrid Recommendation Engine.
Combines content-based, collaborative, trending, and popularity scores
into a single weighted recommendation with full explainability.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


def _minmax_normalize(scores: Dict[int, float]) -> Dict[int, float]:
    if not scores:
        return {}
    vals = list(scores.values())
    lo, hi = min(vals), max(vals)
    if hi == lo:
        return {k: 0.5 for k in scores}
    return {k: (v - lo) / (hi - lo) for k, v in scores.items()}


class HybridEngine:
    def __init__(
        self,
        content_weight: float = 0.35,
        collaborative_weight: float = 0.35,
        trending_weight: float = 0.15,
        popularity_weight: float = 0.15,
    ):
        self.w_content = content_weight
        self.w_collab = collaborative_weight
        self.w_trend = trending_weight
        self.w_pop = popularity_weight
        self.items_df: Optional[pd.DataFrame] = None

    def set_items(self, items_df: pd.DataFrame) -> None:
        self.items_df = items_df

    def recommend(
        self,
        user_id: int,
        domain: Optional[str],
        content_results: List[Dict],
        collab_results: List[Dict],
        trending_results: List[Dict],
        n: int = 20,
        exclude_ids: Optional[List[int]] = None,
    ) -> List[Dict]:
        """
        Merge candidate lists, normalize and weight each signal,
        return top-N with per-item explanation.
        """
        exclude = set(exclude_ids or [])

        # Gather raw scores per source
        content_raw = {r["item_id"]: r["score"] for r in content_results}
        collab_raw = {r["item_id"]: r["score"] for r in collab_results}
        trending_raw = {r["item_id"]: r["score"] for r in trending_results}
        popularity_raw = self._popularity_scores(domain)

        # Normalize each signal to [0,1]
        content_norm = _minmax_normalize(content_raw)
        collab_norm = _minmax_normalize(collab_raw)
        trending_norm = _minmax_normalize(trending_raw)
        pop_norm = _minmax_normalize(popularity_raw)

        # Candidate universe
        all_ids = (
            set(content_raw)
            | set(collab_raw)
            | set(trending_raw)
            | set(popularity_raw)
        ) - exclude

        scored: List[Tuple[int, float, List[Dict]]] = []
        for item_id in all_ids:
            c = content_norm.get(item_id, 0.0)
            cf = collab_norm.get(item_id, 0.0)
            tr = trending_norm.get(item_id, 0.0)
            pop = pop_norm.get(item_id, 0.0)

            hybrid_score = (
                self.w_content * c
                + self.w_collab * cf
                + self.w_trend * tr
                + self.w_pop * pop
            )

            reasons = self._build_reasons(c, cf, tr, pop, content_raw, collab_raw)
            scored.append((item_id, hybrid_score, reasons))

        scored.sort(key=lambda x: x[1], reverse=True)

        # Diversity pass: avoid recommending same genre consecutively
        results = self._apply_diversity(scored[:n * 2], n)
        return results

    def _popularity_scores(self, domain: Optional[str]) -> Dict[int, float]:
        if self.items_df is None:
            return {}
        df = self.items_df.copy()
        if domain:
            df = df[df["domain"] == domain]
        result = {}
        for _, row in df.iterrows():
            score = float(row.get("popularity_score", 0)) * 0.5 + float(row.get("avg_rating", 0)) / 5.0 * 0.5
            result[int(row["id"])] = score
        return result

    def _build_reasons(
        self, c: float, cf: float, tr: float, pop: float,
        content_raw: Dict, collab_raw: Dict,
    ) -> List[Dict]:
        reasons = []
        if c > 0.3:
            reasons.append({
                "type": "content",
                "label": "Similar content & genre",
                "confidence": round(c, 2),
                "detail": f"{int(c*100)}% content match",
            })
        if cf > 0.3:
            reasons.append({
                "type": "collaborative",
                "label": "Users with similar taste loved this",
                "confidence": round(cf, 2),
                "detail": "Based on collaborative filtering",
            })
        if tr > 0.5:
            reasons.append({
                "type": "trending",
                "label": "Trending in your domain",
                "confidence": round(tr, 2),
                "detail": "High recent activity",
            })
        if pop > 0.7 and not reasons:
            reasons.append({
                "type": "popularity",
                "label": "Highly rated overall",
                "confidence": round(pop, 2),
                "detail": "Community favourite",
            })
        if not reasons:
            reasons.append({
                "type": "discovery",
                "label": "Recommended for discovery",
                "confidence": 0.5,
                "detail": "Expand your horizons",
            })
        return reasons

    def _apply_diversity(
        self, scored: List[Tuple[int, float, List]], n: int
    ) -> List[Dict]:
        seen_genres: set = set()
        results = []
        second_pass = []

        if self.items_df is not None:
            id_to_genres = {
                int(row["id"]): set(row.get("genres") or [row.get("genre", "")])
                for _, row in self.items_df.iterrows()
            }
        else:
            id_to_genres = {}

        for item_id, score, reasons in scored:
            item_genres = id_to_genres.get(item_id, set())
            overlap = item_genres & seen_genres
            # Allow if new genre or overlap < 50%
            if not overlap or len(overlap) / max(len(item_genres), 1) < 0.5:
                seen_genres |= item_genres
                results.append({
                    "item_id": item_id,
                    "score": float(score),
                    "match_percentage": min(int(score * 100), 99),
                    "reasons": reasons,
                })
                if len(results) >= n:
                    break
            else:
                second_pass.append((item_id, score, reasons))

        # Fill remaining slots with second-pass candidates
        for item_id, score, reasons in second_pass:
            if len(results) >= n:
                break
            results.append({
                "item_id": item_id,
                "score": float(score),
                "match_percentage": min(int(score * 100), 99),
                "reasons": reasons,
            })

        return results[:n]
