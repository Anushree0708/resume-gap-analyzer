# main.py

import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from backend.database import engine, SessionLocal
from backend.models import Base, ResumeAnalysis
from backend.scoring import analyze_resume
from backend.utils import extract_text_from_pdf


# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://resume-gap-analyzer-2-i2m8.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Create tables & auto-migrate
# ---------------------------------------------------------------------------

Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS experience_score FLOAT"))
    conn.execute(text("ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS session_id VARCHAR"))
    conn.commit()


# ---------------------------------------------------------------------------
# DB dependency
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {"message": "Resume Analyzer API is running"}


# ---------------------------------------------------------------------------
# Analyze  — session_id sent as a form field, no login required
# ---------------------------------------------------------------------------

@app.post("/analyze")
async def analyze(
    file:            UploadFile = File(...),
    job_description: str        = Form(...),
    session_id:      str        = Form(...),
    db:              Session    = Depends(get_db),
):
    if not session_id.strip():
        raise HTTPException(status_code=400, detail="session_id is required")
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is missing")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    resume_text = extract_text_from_pdf(pdf_bytes)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    result = analyze_resume(resume_text, job_description)

    entry = ResumeAnalysis(
        session_id       = session_id.strip(),
        filename         = file.filename,
        job_description  = job_description,
        final_score      = result["final_match_score"],
        cosine_score     = result["cosine_similarity_score"],
        skill_score      = result["skill_match_score"],
        experience_score = result["experience_score"],
    )
    db.add(entry)
    db.commit()

    return result


# ---------------------------------------------------------------------------
# History — session_id sent as HTTP header
# ---------------------------------------------------------------------------

@app.get("/history")
def get_history(
    session_id: str     = Header(...),
    db:         Session = Depends(get_db),
):
    if not session_id.strip():
        raise HTTPException(status_code=400, detail="session_id header is required")

    records = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.session_id == session_id.strip())
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )

    return [
        {
            "id":               r.id,
            "filename":         r.filename,
            "final_score":      r.final_score,
            "cosine_score":     r.cosine_score,
            "skill_score":      r.skill_score,
            "experience_score": r.experience_score,
            "created_at":       r.created_at,
        }
        for r in records
    ]


# ---------------------------------------------------------------------------
# Analytics — session_id sent as HTTP header
# ---------------------------------------------------------------------------

@app.get("/analytics")
def get_analytics(
    session_id: str     = Header(...),
    db:         Session = Depends(get_db),
):
    if not session_id.strip():
        raise HTTPException(status_code=400, detail="session_id header is required")

    base_q = db.query(ResumeAnalysis).filter(ResumeAnalysis.session_id == session_id.strip())

    total     = base_q.with_entities(func.count(ResumeAnalysis.id)).scalar()
    avg_score = base_q.with_entities(func.avg(ResumeAnalysis.final_score)).scalar()
    max_score = base_q.with_entities(func.max(ResumeAnalysis.final_score)).scalar()
    min_score = base_q.with_entities(func.min(ResumeAnalysis.final_score)).scalar()

    return {
        "total_resumes": total or 0,
        "average_score": round(float(avg_score or 0), 2),
        "highest_score": round(float(max_score or 0), 2),
        "lowest_score":  round(float(min_score or 0), 2),
    }