"""Basic API smoke tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_register_and_login():
    payload = {"email": "test@example.com", "username": "testuser", "password": "password123"}
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

    r2 = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_items_list_empty():
    r = client.get("/api/items")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_search_requires_query():
    r = client.get("/api/search")
    assert r.status_code == 422   # missing 'q' param


def test_recommendations_without_training():
    r = client.get("/api/recommendations/personalized")
    # Should return 200 with empty list (not trained)
    assert r.status_code == 200
