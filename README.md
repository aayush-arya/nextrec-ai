# NextRec — AI-Powered Personalized Recommendation System

![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)

> A production-grade, portfolio-quality recommendation platform combining Content-Based Filtering, Collaborative Filtering, Semantic Search, and Hybrid AI to deliver Netflix-level personalization across Movies, Books, Music, Food, Courses and Products.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          NextRec Platform                            │
├─────────────────────────────┬────────────────────────────────────────┤
│        Frontend (React)     │           Backend (FastAPI)            │
│  ─────────────────────────  │  ─────────────────────────────────────  │
│  • React 18 + Vite          │  • FastAPI + SQLAlchemy ORM            │
│  • TailwindCSS (dark mode)  │  • JWT Authentication                  │
│  • Framer Motion            │  • SQLite (PostgreSQL-ready)           │
│  • Zustand state mgmt       │  • ML Pipeline (5 algorithms)          │
│  • Chart.js dashboards      │  • Auto-train on startup               │
│  • React Router v6          │  • Full REST API + OpenAPI docs        │
└─────────────────────────────┴────────────────────────────────────────┘

ML Pipeline
┌─────────────────────────────────────────────────────────────────────┐
│  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ Content-Based  │  │  Collaborative   │  │ Semantic Search   │   │
│  │ TF-IDF +       │  │  SVD Matrix      │  │ sentence-         │   │
│  │ Cosine Sim     │  │  Factorization   │  │ transformers /    │   │
│  └────────┬───────┘  └────────┬─────────┘  │ TF-IDF fallback   │   │
│           │                   │            └─────────┬─────────┘   │
│           └─────────────┬─────┘                      │             │
│                         ▼                             │             │
│              ┌──────────────────────┐                 │             │
│              │   Hybrid Engine      │◄────────────────┘             │
│              │ Content × 0.35       │                                │
│              │ Collaborative × 0.35 │  + Trending Engine (decay)    │
│              │ Trending × 0.15      │  + Cold-Start Solver          │
│              │ Popularity × 0.15    │                                │
│              └──────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Recommendation Algorithms
| Algorithm | Method | Status |
|-----------|--------|--------|
| Content-Based | TF-IDF + Cosine Similarity | ✅ |
| Collaborative Filtering | SVD Matrix Factorization | ✅ |
| Hybrid Engine | Weighted score fusion | ✅ |
| Semantic Search | Sentence Transformers / TF-IDF fallback | ✅ |
| Trending | Time-decay gravity scoring | ✅ |
| Cold-Start | Genre/mood preference solver | ✅ |

### Platform Features
- 🎭 **6 domains**: Movies, Books, Music, Food, Courses, Products
- 🧠 **AI Explainability**: Every recommendation shows WHY it was picked
- 😊 **Mood-based**: 8 moods that instantly shift recommendations
- ⏰ **Time-aware**: Morning/afternoon/evening/night context
- 🔍 **Smart Search**: Semantic + keyword hybrid with autocomplete
- 💬 **Chat Assistant**: Natural language recommendation queries
- 📊 **Dashboard**: Charts for genre distribution, algorithm mix, activity
- 🛡️ **Admin Panel**: Model management, training, user analytics, logs
- 🔐 **Auth**: JWT with bcrypt, role-based access (admin/user)

### UI/UX
- Dark-mode first design
- Glassmorphism card components
- Framer Motion page transitions
- Skeleton loading states
- Netflix-style hero sections
- Responsive (mobile → desktop)

---

## Quick Start

### Option 1: Docker Compose (recommended)
```bash
git clone <repo>
cd ai-recommendation-system
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

**Backend**
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev          # runs on http://localhost:5173
```

---

## Demo Credentials
| Role  | Email                  | Password     |
|-------|------------------------|--------------|
| Admin | admin@nextrec.ai       | admin123     |
| User  | alice@example.com      | password123  |
| User  | bob@example.com        | password123  |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/items` | List items (domain, genre, page) |
| GET | `/api/items/{id}/similar` | Content-similar items |
| GET | `/api/recommendations/personalized` | Hybrid recommendations |
| GET | `/api/recommendations/trending` | Trending items |
| GET | `/api/recommendations/explain/{id}` | AI explanation |
| POST | `/api/recommendations/chat` | Chat-based recommendations |
| GET | `/api/search?q=...` | Semantic + keyword search |
| GET | `/api/search/autocomplete?q=...` | Instant suggestions |
| POST | `/api/ratings` | Rate an item |
| POST | `/api/ratings/bookmark/{id}` | Toggle bookmark |
| GET | `/api/users/profile` | User profile |
| PUT | `/api/users/profile` | Update preferences |
| GET | `/api/admin/stats` | Platform analytics |
| POST | `/api/admin/train/sync` | Retrain ML models |

Full interactive docs at **http://localhost:8000/docs**

---

## Project Structure

```
ai-recommendation-system/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # auth, items, ratings, recommendations, search, admin
│   │   ├── core/            # config, database, security, dependencies
│   │   ├── ml/              # content_based, collaborative, hybrid, semantic, trending, cold_start, pipeline
│   │   ├── models/          # SQLAlchemy models (User, Item, Rating, Interaction, Bookmark)
│   │   ├── schemas/         # Pydantic schemas
│   │   └── main.py          # FastAPI app + lifespan
│   ├── data/
│   │   └── seed_data.py     # 50+ items across 6 domains + synthetic ratings
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── components/      # Navbar, Sidebar, ItemCard, RecommendationCard, MoodSelector, …
│       ├── pages/           # Home, Discover, ItemDetail, Search, Profile, Dashboard, Admin
│       ├── store/           # Zustand auth + UI stores
│       └── services/        # Axios API client (authAPI, itemsAPI, recsAPI, …)
├── docker-compose.yml
└── .github/workflows/ci-cd.yml
```

---

## Machine Learning Details

### Content-Based Filtering
- **Features**: title + genre + description + tags + cast/author/director
- **Vectorization**: `TfidfVectorizer(max_features=5000, ngram_range=(1,2), sublinear_tf=True)`
- **Similarity**: Cosine similarity over TF-IDF matrix
- **Profile mode**: Averages TF-IDF vectors of liked items → recommends against mean vector

### Collaborative Filtering (SVD)
- **Matrix**: User × Item ratings matrix
- **Decomposition**: `scipy.sparse.linalg.svds(k=50)`
- **Prediction**: `U × Σ × Vᵀ + user_means`
- **Fallback**: gracefully disabled if fewer than 5 ratings exist
- **Item-item CF**: cosine similarity over item latent factors

### Hybrid Engine
- Normalizes all signals to `[0,1]` via min-max
- Weights: `content×0.35 + collaborative×0.35 + trending×0.15 + popularity×0.15`
- Diversity pass: avoids consecutive same-genre recommendations

### Trending Engine
- Score: `(N_ratings × avg_rating) / (age_days + 2)^1.8`
- Boosts score with recent interaction count
- Normalized to `[0,1]` across the catalog

### Cold-Start Solver
- Reads `preferred_genres` + `preferred_moods` from user profile
- Expands mood → genre via `MOOD_GENRE_MAP`
- Scores: `0.5×genre_match + 0.3×avg_rating + 0.2×popularity`
- Diversity-aware: picks one item per genre first

### Semantic Search
- **Primary** (optional): `sentence-transformers/all-MiniLM-L6-v2` + FAISS index
- **Fallback**: `TfidfVectorizer(ngram_range=(1,3))` cosine search (always available)
- Merges semantic results with keyword DB results

---

## Optional Upgrades
```bash
# Enable neural semantic search
pip install sentence-transformers faiss-cpu

# Enable SVD-based collaborative filtering at scale
pip install scikit-surprise
```

---

## Deployment

### Render
1. Create two web services (backend + frontend) or use `docker-compose.yml`
2. Set env vars: `SECRET_KEY`, `DATABASE_URL`
3. The GitHub Actions CI/CD workflow validates every push to `main`

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | JWT signing key |
| `DATABASE_URL` | `sqlite:///./recommendation.db` | DB connection string |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed origins |
| `CONTENT_WEIGHT` | `0.35` | Hybrid content weight |
| `COLLABORATIVE_WEIGHT` | `0.35` | Hybrid collaborative weight |
| `SVD_N_FACTORS` | `50` | Latent factors for SVD |

---

## Future Scope
- [ ] PostgreSQL migration with Alembic
- [ ] Redis caching layer for recommendation results
- [ ] Multi-Armed Bandit exploration for A/B testing
- [ ] Real LLM integration (Claude API) for chat recommendations
- [ ] Online incremental learning with periodic re-training
- [ ] PCA/t-SNE embedding visualization
- [ ] Push notifications for new trending items
- [ ] Social features (follow users, share lists)

---

Built with FastAPI · React · scikit-learn · scipy · Framer Motion · TailwindCSS

---

## License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.
