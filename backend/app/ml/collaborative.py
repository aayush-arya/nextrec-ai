"""
Collaborative Filtering via truncated SVD (Matrix Factorization).
Falls back gracefully when insufficient rating data is available.
"""
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

MIN_RATINGS = 5


class CollaborativeFilter:
    def __init__(self, n_factors: int = 50):
        self.n_factors = n_factors
        self.user_item_matrix: Optional[np.ndarray] = None
        self.predicted_matrix: Optional[np.ndarray] = None
        self.user_id_to_idx: Dict[int, int] = {}
        self.item_id_to_idx: Dict[int, int] = {}
        self.idx_to_user_id: Dict[int, int] = {}
        self.idx_to_item_id: Dict[int, int] = {}
        self.user_means: Optional[np.ndarray] = None
        self.item_similarity_matrix: Optional[np.ndarray] = None
        self.is_trained = False

    def fit(self, ratings_df: pd.DataFrame) -> None:
        if len(ratings_df) < MIN_RATINGS:
            logger.warning(f"CollaborativeFilter: only {len(ratings_df)} ratings, need {MIN_RATINGS}")
            return

        users = sorted(ratings_df["user_id"].unique())
        items = sorted(ratings_df["item_id"].unique())

        self.user_id_to_idx = {u: i for i, u in enumerate(users)}
        self.item_id_to_idx = {it: i for i, it in enumerate(items)}
        self.idx_to_user_id = {v: k for k, v in self.user_id_to_idx.items()}
        self.idx_to_item_id = {v: k for k, v in self.item_id_to_idx.items()}

        n_users, n_items = len(users), len(items)
        matrix = np.zeros((n_users, n_items))
        for _, row in ratings_df.iterrows():
            u = self.user_id_to_idx.get(row["user_id"])
            it = self.item_id_to_idx.get(row["item_id"])
            if u is not None and it is not None:
                matrix[u, it] = row["rating"]

        self.user_item_matrix = matrix
        self.user_means = np.true_divide(
            matrix.sum(axis=1),
            np.maximum((matrix != 0).sum(axis=1), 1),
        ).reshape(-1, 1)

        matrix_norm = matrix.copy()
        for u_idx in range(n_users):
            rated = matrix_norm[u_idx] != 0
            matrix_norm[u_idx, rated] -= self.user_means[u_idx, 0]

        k = min(self.n_factors, min(n_users, n_items) - 1)
        if k < 1:
            return

        U, sigma, Vt = svds(csr_matrix(matrix_norm), k=k)
        sigma_diag = np.diag(sigma)
        self.predicted_matrix = (
            np.dot(np.dot(U, sigma_diag), Vt) + self.user_means
        )

        # Pre-compute item-item cosine similarity for item-based CF
        item_vectors = Vt.T   # shape: (n_items, k)
        self.item_similarity_matrix = cosine_similarity(item_vectors)

        self.is_trained = True
        logger.info(f"CollaborativeFilter fitted: {n_users} users × {n_items} items, k={k}")

    def get_recommendations(
        self, user_id: int, n: int = 20, domain_item_ids: Optional[List[int]] = None
    ) -> List[Dict]:
        if not self.is_trained:
            return []
        u_idx = self.user_id_to_idx.get(user_id)
        if u_idx is None:
            return []

        user_preds = self.predicted_matrix[u_idx].copy()

        # Suppress already-rated items
        rated_indices = np.where(self.user_item_matrix[u_idx] != 0)[0]
        user_preds[rated_indices] = -np.inf

        if domain_item_ids is not None:
            valid_i_indices = {
                self.item_id_to_idx[iid] for iid in domain_item_ids if iid in self.item_id_to_idx
            }
            mask = np.ones(len(user_preds), dtype=bool)
            for i in range(len(user_preds)):
                if i not in valid_i_indices:
                    mask[i] = False
            user_preds[~mask] = -np.inf

        top_indices = np.argsort(user_preds)[::-1][:n]
        results = []
        for i in top_indices:
            if user_preds[i] == -np.inf:
                break
            rec_id = self.idx_to_item_id.get(i)
            if rec_id:
                # Compute confidence: how close the predicted score is to 5
                confidence = min(float(user_preds[i]) / 5.0, 1.0)
                similar_users = self._count_similar_users_who_liked(u_idx, i)
                results.append(
                    {
                        "item_id": rec_id,
                        "score": float(user_preds[i]),
                        "reason_type": "collaborative_filtering",
                        "reason_label": "Users like you loved this",
                        "detail": f"{similar_users}% of users with similar taste rated this highly",
                        "confidence": confidence,
                    }
                )
        return results

    def get_similar_items_cf(self, item_id: int, n: int = 10) -> List[Dict]:
        if not self.is_trained or self.item_similarity_matrix is None:
            return []
        i_idx = self.item_id_to_idx.get(item_id)
        if i_idx is None:
            return []

        sims = self.item_similarity_matrix[i_idx].copy()
        sims[i_idx] = -1
        top = np.argsort(sims)[::-1][:n]
        results = []
        for i in top:
            rec_id = self.idx_to_item_id.get(i)
            if rec_id and sims[i] > 0:
                results.append(
                    {
                        "item_id": rec_id,
                        "score": float(sims[i]),
                        "reason_type": "item_similarity_cf",
                        "reason_label": "Often rated together",
                        "detail": "Users who liked the original also rated this",
                    }
                )
        return results

    def _count_similar_users_who_liked(self, u_idx: int, i_idx: int) -> int:
        """Approximate percentage of similar users who liked the item."""
        if self.user_item_matrix is None:
            return 0
        n_users = self.user_item_matrix.shape[0]
        liked = (self.user_item_matrix[:, i_idx] >= 4).sum()
        return int((liked / max(n_users, 1)) * 100)

    def get_user_similarity(self, user_id1: int, user_id2: int) -> float:
        u1 = self.user_id_to_idx.get(user_id1)
        u2 = self.user_id_to_idx.get(user_id2)
        if u1 is None or u2 is None or self.user_item_matrix is None:
            return 0.0
        v1 = self.user_item_matrix[u1].reshape(1, -1)
        v2 = self.user_item_matrix[u2].reshape(1, -1)
        if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
            return 0.0
        return float(cosine_similarity(v1, v2)[0][0])
