from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import engine, SessionLocal
from backend.models import ResumeAnalysis
from backend.model import analyze_resume
from backend.utils import extract_text_from_pdf


app = FastAPI()


# -------------------------------
# CORS CONFIGURATION
# -------------------------------
origins = [
    "http://localhost:5173",
    "https://resume-gap-analyzer-2-i2m8.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all to prevent frontend blocking
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# CREATE DATABASE TABLES
# -------------------------------
ResumeAnalysis.metadata.create_all(bind=engine)


# -------------------------------
# ROOT ENDPOINT
# -------------------------------
@app.get("/")
def home():
    return {"message": "Resume Analyzer API is running"}


# -------------------------------
# ANALYZE RESUME
# -------------------------------
@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):

    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="File is missing")

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        # Read file
        pdf_bytes = await file.read()

        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # Extract text
        resume_text = extract_text_from_pdf(pdf_bytes)

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Analyze
        result = analyze_resume(resume_text, job_description)

        # Save to database
        db: Session = SessionLocal()

        analysis_entry = ResumeAnalysis(
            filename=file.filename,
            job_description=job_description,
            final_score=result["final_match_score"],
            cosine_score=result["cosine_similarity_score"],
            skill_score=result["skill_match_score"]
        )

        db.add(analysis_entry)
        db.commit()
        db.close()

        return result

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# HISTORY ENDPOINT
# -------------------------------
@app.get("/history")
def get_history():

    try:
        db: Session = SessionLocal()
        records = db.query(ResumeAnalysis).all()
        db.close()

        return [
            {
                "id": r.id,
                "filename": r.filename,
                "final_score": r.final_score,
                "cosine_score": r.cosine_score,
                "skill_score": r.skill_score,
                "created_at": r.created_at
            }
            for r in records
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------
# ANALYTICS ENDPOINT
# -------------------------------
@app.get("/analytics")
def get_analytics():

    try:
        db: Session = SessionLocal()

        total = db.query(func.count(ResumeAnalysis.id)).scalar()
        avg_score = db.query(func.avg(ResumeAnalysis.final_score)).scalar()
        max_score = db.query(func.max(ResumeAnalysis.final_score)).scalar()
        min_score = db.query(func.min(ResumeAnalysis.final_score)).scalar()

        db.close()

        return {
            "total_resumes": total or 0,
            "average_score": round(float(avg_score or 0), 2),
            "highest_score": round(float(max_score or 0), 2),
            "lowest_score": round(float(min_score or 0), 2)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))