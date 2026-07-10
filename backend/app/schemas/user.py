from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_domains: Optional[List[str]] = None
    preferred_genres: Optional[List[str]] = None
    preferred_moods: Optional[List[str]] = None
    onboarding_complete: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    bio: str
    avatar_url: str
    is_admin: bool
    is_active: bool
    preferred_domains: List[str]
    preferred_genres: List[str]
    preferred_moods: List[str]
    onboarding_complete: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
