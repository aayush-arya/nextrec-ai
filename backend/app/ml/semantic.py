"""
Semantic Search Engine.
Primary: sentence-transformers all-MiniLM-L6-v2 + FAISS index.
Fallback: TF-IDF cosine similarity (always available).
"""
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Try to import sentence-transformers / FAISS — gracefully degrade if absent
try:
    from sentence_transformers import SentenceTransformer
    _HAS_ST = True
except ImportError:
    _HAS_ST = False
    logger.info("sentence-transformers not installed — using TF-IDF semantic fallback")

try:
    import faiss
    _HAS_FAISS = True
except ImportError:
    _HAS_FAISS = False
    logger.info("faiss not installed — using numpy for nearest-neighbor search")


class SemanticEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.faiss_index = None
        self.embeddings: Optional[np.ndarray] = None

        # Fallback TF-IDF
        self.tfidf = TfidfVectorizer(max_features=8000, stop_words="english", ngram_range=(1, 3))
        self.tfidf_matrix = None

        self.items_df: Optional[pd.DataFrame] = None
        self.item_id_to_idx: Dict[int, int] = {}
        self.idx_to_item_id: Dict[int, int] = {}
        self.use_neural = False
        self.is_trained = False

    def _build_corpus(self, row: pd.Series) -> str:
        parts = [
            str(row.get("title", "")),
            str(row.get("description", "")),
            str(row.get("genre", "")),
            " ".join(row.get("genres", []) or []),
            " ".join(row.get("tags", []) or []),
        ]
        meta = row.get("metadata_json", {}) or {}
        for k in ("director", "author", "artist", "cast", "mood"):
            v = meta.get(k, "")
            if isinstance(v, list):
                parts.append(" ".join(v))
            elif v:
                parts.append(str(v))
        return " ".join(filter(None, parts))

    def fit(self, items_df: pd.DataFrame) -> None:
        if items_df.empty:
            return
        self.items_df = items_df.reset_index(drop=True)
        self.item_id_to_idx = {
            int(row["id"]): idx for idx, (_, row) in enumerate(items_df.iterrows())
        }
        self.idx_to_item_id = {v: k for k, v in self.item_id_to_idx.items()}

        corpus = self.items_df.apply(self._build_corpus, axis=1).tolist()

        if _HAS_ST:
            try:
                self.model = SentenceTransformer(self.model_name)
                self.embeddings = self.model.encode(corpus, show_progress_bar=False, normalize_embeddings=True)
                if _HAS_FAISS:
                    dim = self.embeddings.shape[1]
                    self.faiss_index = faiss.IndexFlatIP(dim)   # inner-product (= cosine for normed)
                    self.faiss_index.add(self.embeddings.astype(np.float32))
                self.use_neural = True
                logger.info(f"SemanticEngine: neural mode ({self.model_name}), {len(corpus)} docs")
            except Exception as e:
                logger.warning(f"Neural embedding failed ({e}), falling back to TF-IDF")

        if not self.use_neural:
            self.tfidf_matrix = self.tfidf.fit_transform(corpus)
            logger.info(f"SemanticEngine: TF-IDF fallback mode, {len(corpus)} docs")

        self.is_trained = True

    def search(self, query: str, n: int = 20, domain: Optional[str] = None) -> List[Dict]:
        if not self.is_trained:
            return []

        if self.use_neural and self.model is not None:
            return self._neural_search(query, n, domain)
        return self._tfidf_search(query, n, domain)

    def _neural_search(self, query: str, n: int, domain: Optional[str]) -> List[Dict]:
        q_vec = self.model.encode([query], normalize_embeddings=True).astype(np.float32)

        if _HAS_FAISS and self.faiss_index is not None:
            scores, indices = self.faiss_index.search(q_vec, n * 3)
            scores, indices = scores[0], indices[0]
        else:
            scores = cosine_similarity(q_vec, self.embeddings)[0]
            indices = np.argsort(scores)[::-1][: n * 3]
            scores = scores[indices]

        return self._package_results(indices, scores, domain, n)

    def _tfidf_search(self, query: str, n: int, domain: Optional[str]) -> List[Dict]:
        q_vec = self.tfidf.transform([query])
        sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
        top = np.argsort(sims)[::-1][: n * 3]
        return self._package_results(top, sims[top], domain, n)

    def _package_results(self, indices, scores, domain: Optional[str], n: int) -> List[Dict]:
        results = []
        seen = set()
        for i, score in zip(indices, scores):
            i = int(i)
            if i in seen or score <= 0:
                continue
            item_id = self.idx_to_item_id.get(i)
            if item_id is None:
                continue
            row = self.items_df.iloc[i] if self.items_df is not None else None
            if domain and row is not None and row.get("domain") != domain:
                continue
            seen.add(i)
            results.append(
                {
                    "item_id": item_id,
                    "score": float(score),
                    "reason_type": "semantic_match",
                    "reason_label": "Semantic match to your query",
                    "detail": f"{'Neural' if self.use_neural else 'Text'} similarity: {int(score*100)}%",
                }
            )
            if len(results) >= n:
                break
        return results

    def find_similar(self, item_id: int, n: int = 10) -> List[Dict]:
        idx = self.item_id_to_idx.get(item_id)
        if idx is None or not self.is_trained:
            return []

        if self.use_neural and self.embeddings is not None:
            q_vec = self.embeddings[idx : idx + 1]
            sims = cosine_similarity(q_vec, self.embeddings)[0]
        else:
            sims = cosine_similarity(
                self.tfidf_matrix[idx : idx + 1], self.tfidf_matrix
            )[0]

        sims[idx] = -1
        top = np.argsort(sims)[::-1][:n]
        results = []
        for i in top:
            rec_id = self.idx_to_item_id.get(i)
            if rec_id and sims[i] > 0:
                results.append(
                    {
                        "item_id": rec_id,
                        "score": float(sims[i]),
                        "reason_type": "semantic_similarity",
                        "reason_label": "High semantic similarity",
                        "detail": f"{int(sims[i]*100)}% semantic match",
                    }
                )
        return results
