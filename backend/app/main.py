from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import auth, users, items, ratings, recommendations, search, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()

    logger.info("Seeding initial data if needed...")
    try:
        from data.seed_data import seed_if_empty
        seed_if_empty()
    except Exception as e:
        logger.warning(f"Seed step skipped: {e}")

    logger.info("Auto-training ML pipeline...")
    try:
        from app.ml.pipeline import pipeline
        from app.core.database import SessionLocal
        with SessionLocal() as db:
            pipeline.train(db)
    except Exception as e:
        logger.warning(f"Auto-train failed (will retry on first request): {e}")

    logger.info("NextRec API is ready!")
    yield
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="NextRec API",
    description="AI-Powered Personalized Recommendation System",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials="*" not in _cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "NextRec API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    from app.ml.pipeline import pipeline
    return {"status": "healthy", "ml_ready": pipeline.is_ready}
