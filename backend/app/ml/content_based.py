"""
Content-Based Filtering using TF-IDF + Cosine Similarity.
Recommends items similar to a given item based on textual features.
"""
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ContentBasedFilter:
    def __init__(self, max_features: int = 5000):
        self.tfidf = TfidfVectorizer(
            max_features=max_features,
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
        )
        self.tfidf_matrix = None
        self.item_id_to_idx: Dict[int, int] = {}
        self.idx_to_item_id: Dict[int, int] = {}
        self.items_df: Optional[pd.DataFrame] = None
        self.is_trained = False

    def _build_features(self, row: pd.Series) -> str:
        parts = [
            str(row.get("title", "")),
            str(row.get("genre", "")),
            " ".join(row.get("genres", []) or []),
            str(row.get("description", "")),
            " ".join(row.get("tags", []) or []),
            " ".join(row.get("keywords", []) or []),
        ]
        meta = row.get("metadata_json", {}) or {}
        for key in ("director", "author", "artist", "cast", "cuisine"):
            val = meta.get(key, "")
            if isinstance(val, list):
                parts.append(" ".join(val))
            elif val:
                parts.append(str(val))
        return " ".join(filter(None, parts)).lower()

    def fit(self, items_df: pd.DataFrame) -> None:
        if items_df.empty:
            logger.warning("ContentBased: empty dataframe, skipping fit")
            return

        self.items_df = items_df.reset_index(drop=True)
        features = self.items_df.apply(self._build_features, axis=1)
        self.tfidf_matrix = self.tfidf.fit_transform(features)

        self.item_id_to_idx = {
            int(row["id"]): idx
            for idx, (_, row) in enumerate(self.items_df.iterrows())
        }
        self.idx_to_item_id = {v: k for k, v in self.item_id_to_idx.items()}
        self.is_trained = True
        logger.info(f"ContentBased fitted on {len(items_df)} items")

    def get_similar_items(
        self, item_id: int, n: int = 10, domain: Optional[str] = None
    ) -> List[Dict]:
        if not self.is_trained:
            return []

        idx = self.item_id_to_idx.get(item_id)
        if idx is None:
            return []

        sim_scores = cosine_similarity(
            self.tfidf_matrix[idx : idx + 1], self.tfidf_matrix
        ).flatten()

        # Optionally restrict to same domain
        if domain and "domain" in self.items_df.columns:
            domain_mask = self.items_df["domain"] == domain
            sim_scores[~domain_mask.values] = -1

        # Exclude the item itself
        sim_scores[idx] = -1

        top_indices = np.argsort(sim_scores)[::-1][: n * 2]

        results = []
        for i in top_indices[:n]:
            rec_id = self.idx_to_item_id.get(i)
            if rec_id and sim_scores[i] > 0:
                results.append(
                    {
                        "item_id": rec_id,
                        "score": float(sim_scores[i]),
                        "reason_type": "content_similarity",
                        "reason_label": "Similar content & genre",
                        "detail": f"{int(sim_scores[i]*100)}% content match",
                    }
                )
        return results

    def get_recommendations_from_profile(
        self,
        liked_item_ids: List[int],
        n: int = 20,
        domain: Optional[str] = None,
    ) -> List[Dict]:
        """Aggregate content similarity scores from a list of liked items."""
        if not self.is_trained or not liked_item_ids:
            return []

        valid_indices = [self.item_id_to_idx[i] for i in liked_item_ids if i in self.item_id_to_idx]
        if not valid_indices:
            return []

        profile_vector = self.tfidf_matrix[valid_indices].mean(axis=0)
        sim_scores = cosine_similarity(profile_vector, self.tfidf_matrix).flatten()

        # Exclude already liked items
        for idx in valid_indices:
            sim_scores[idx] = -1

        if domain and "domain" in self.items_df.columns:
            domain_mask = self.items_df["domain"] == domain
            sim_scores[~domain_mask.values] = -1

        top_indices = np.argsort(sim_scores)[::-1][:n]
        results = []
        for i in top_indices:
            rec_id = self.idx_to_item_id.get(i)
            if rec_id and sim_scores[i] > 0:
                results.append(
                    {
                        "item_id": rec_id,
                        "score": float(sim_scores[i]),
                        "reason_type": "content_profile",
                        "reason_label": "Matches your taste profile",
                        "detail": "Based on items you've enjoyed",
                    }
                )
        return results

    def get_feature_similarity(self, item_id1: int, item_id2: int) -> float:
        idx1 = self.item_id_to_idx.get(item_id1)
        idx2 = self.item_id_to_idx.get(item_id2)
        if idx1 is None or idx2 is None:
            return 0.0
        return float(
            cosine_similarity(
                self.tfidf_matrix[idx1 : idx1 + 1],
                self.tfidf_matrix[idx2 : idx2 + 1],
            )[0][0]
        )
