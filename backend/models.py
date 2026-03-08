# models.py

from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from datetime import datetime
from backend.database import Base

class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    job_description = Column(Text)
    final_score = Column(Float)
    cosine_score = Column(Float)
    skill_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)