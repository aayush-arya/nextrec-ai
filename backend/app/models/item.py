from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)  # movies|books|music|food|courses|products
    description = Column(Text, default="")
    genre = Column(String, default="")
    genres = Column(JSON, default=list)          # ["Action","Sci-Fi"]
    tags = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    language = Column(String, default="English")

    # Domain-specific metadata stored as JSON
    metadata_json = Column(JSON, default=dict)   # director, author, artist, cuisine, etc.

    # Visuals
    poster_url = Column(String, default="")
    backdrop_url = Column(String, default="")

    # Stats
    avg_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    popularity_score = Column(Float, default=0.0)
    release_year = Column(Integer, nullable=True)
    duration = Column(String, default="")   # "2h 28m" / "342 pages" / "4:32"

    # Flags
    is_active = Column(Boolean, default=True)
    is_trending = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    ratings = relationship("Rating", back_populates="item", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="item", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="item", cascade="all, delete-orphan")
