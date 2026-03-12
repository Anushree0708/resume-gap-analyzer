# models.py

from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, nullable=False, index=True)
    pwd_hash   = Column(String, nullable=False)
    pwd_salt   = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    analyses   = relationship("ResumeAnalysis", back_populates="user")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # nullable so old rows don't break
    filename        = Column(String, nullable=False)
    job_description = Column(Text)
    final_score     = Column(Float)
    cosine_score    = Column(Float)
    skill_score     = Column(Float)
    experience_score = Column(Float)   # NEW
    created_at      = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analyses")