from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Interaction(Base):
    """Tracks implicit user behavior for personalization learning."""
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)

    # click | view | like | dislike | skip | search | bookmark | share
    interaction_type = Column(String, nullable=False, index=True)
    duration_seconds = Column(Float, default=0.0)   # time spent viewing
    source = Column(String, default="")              # recommendation|search|browse|trending
    session_id = Column(String, default="", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interactions")
    item = relationship("Item", back_populates="interactions")
