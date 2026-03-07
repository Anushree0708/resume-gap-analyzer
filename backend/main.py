from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import ResumeAnalysis
from model import analyze_resume
from utils import extract_text_from_pdf
from sqlalchemy import func

app = FastAPI()

ResumeAnalysis.metadata.create_all(bind=engine)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), job_description: str = Form(...)):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    resume_text = extract_text_from_pdf(file)

    result = analyze_resume(resume_text, job_description)

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
@app.get("/history")
def get_history():
    db: Session = SessionLocal()

    records = db.query(ResumeAnalysis).all()

    db.close()

    return [
        {
            "id": record.id,
            "filename": record.filename,
            "final_score": record.final_score,
            "cosine_score": record.cosine_score,
            "skill_score": record.skill_score,
            "created_at": record.created_at
        }
        for record in records
    ]
@app.get("/analytics")
def get_analytics():
    db: Session = SessionLocal()

    total = db.query(func.count(ResumeAnalysis.id)).scalar()
    avg_score = db.query(func.avg(ResumeAnalysis.final_score)).scalar()
    max_score = db.query(func.max(ResumeAnalysis.final_score)).scalar()
    min_score = db.query(func.min(ResumeAnalysis.final_score)).scalar()

    db.close()

    return {
        "total_resumes": total,
        "average_score": round(float(avg_score or 0), 2),
        "highest_score": round(float(max_score or 0), 2),
        "lowest_score": round(float(min_score or 0), 2)
    }
