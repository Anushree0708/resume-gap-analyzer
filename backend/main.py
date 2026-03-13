import os
import re
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import engine, SessionLocal
from backend.models import Base, User, ResumeAnalysis
from backend.scoring import analyze_resume
from backend.utils import extract_text_from_pdf


# ---------------------------------------------------------------------------
# APP SETUP
# ---------------------------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# CREATE DATABASE TABLES
# ---------------------------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# JWT CONFIG (for login/register only)
# ---------------------------------------------------------------------------

JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretkey-resumegap-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_H = 24 * 7


# ---------------------------------------------------------------------------
# PASSWORD HELPERS
# ---------------------------------------------------------------------------

def _hash_password(password: str, salt: str | None = None):
    if salt is None:
        salt = secrets.token_hex(32)

    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt.encode(),
        260000
    )

    return key.hex(), salt


def _verify_password(plain, stored_hash, stored_salt):
    candidate, _ = _hash_password(plain, stored_salt)
    return hmac.compare_digest(candidate, stored_hash)


# ---------------------------------------------------------------------------
# TOKEN CREATION
# ---------------------------------------------------------------------------

def _create_token(user_id: int, email: str):

    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_H),
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ---------------------------------------------------------------------------
# DATABASE SESSION
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# REQUEST MODEL
# ---------------------------------------------------------------------------

class AuthRequest(BaseModel):
    email: str
    password: str


# ---------------------------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {"message": "Resume Analyzer API is running"}


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------

@app.post("/register")
def register(body: AuthRequest, db: Session = Depends(get_db)):

    email = body.email.strip().lower()

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email")

    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    pwd_hash, pwd_salt = _hash_password(body.password)

    user = User(
        email=email,
        pwd_hash=pwd_hash,
        pwd_salt=pwd_salt
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token(user.id, user.email)

    return {
        "token": token,
        "email": user.email
    }


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@app.post("/login")
def login(body: AuthRequest, db: Session = Depends(get_db)):

    email = body.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not _verify_password(body.password, user.pwd_hash, user.pwd_salt):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(user.id, user.email)

    return {
        "token": token,
        "email": user.email
    }


# ---------------------------------------------------------------------------
# ANALYZE RESUME
# ---------------------------------------------------------------------------

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
):

    try:

        if not file.filename:
            raise HTTPException(status_code=400, detail="File missing")

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        pdf_bytes = await file.read()

        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file empty")

        resume_text = extract_text_from_pdf(pdf_bytes)

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not read PDF")

        result = analyze_resume(resume_text, job_description)

        print("ANALYSIS RESULT:", result)

        entry = ResumeAnalysis(
            filename=file.filename,
            job_description=job_description,
            final_score=result.get("final_match_score", 0),
            cosine_score=result.get("cosine_similarity_score", 0),
            skill_score=result.get("skill_match_score", 0),
            experience_score=result.get("experience_score", 0),
        )

        db.add(entry)
        db.commit()

        return result

    except Exception as e:

        print("ERROR IN ANALYZE:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Error analyzing resume"
        )


# ---------------------------------------------------------------------------
# HISTORY
# ---------------------------------------------------------------------------

@app.get("/history")
def get_history(db: Session = Depends(get_db)):

    records = (
        db.query(ResumeAnalysis)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "final_score": r.final_score,
            "cosine_score": r.cosine_score,
            "skill_score": r.skill_score,
            "experience_score": r.experience_score,
            "created_at": r.created_at,
        }
        for r in records
    ]


# ---------------------------------------------------------------------------
# ANALYTICS
# ---------------------------------------------------------------------------

@app.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):

    total = db.query(func.count(ResumeAnalysis.id)).scalar()
    avg_score = db.query(func.avg(ResumeAnalysis.final_score)).scalar()
    max_score = db.query(func.max(ResumeAnalysis.final_score)).scalar()
    min_score = db.query(func.min(ResumeAnalysis.final_score)).scalar()

    return {
        "total_resumes": total or 0,
        "average_score": round(float(avg_score or 0), 2),
        "highest_score": round(float(max_score or 0), 2),
        "lowest_score": round(float(min_score or 0), 2),
    }