# scoring.py

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Skill dictionaries — extend these lists as needed
# ---------------------------------------------------------------------------

TECH_SKILLS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust",
    "kotlin", "swift", "scala", "r", "matlab",
    "react", "vue", "angular", "node", "django", "flask", "fastapi", "spring", "rails",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
    "jenkins", "github actions", "machine learning", "deep learning", "nlp",
    "computer vision", "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn",
    "spark", "hadoop", "kafka", "airflow", "rest", "graphql", "microservices",
    "linux", "git", "agile", "scrum",
}

SOFT_SKILLS = {
    "communication", "leadership", "teamwork", "problem solving", "collaboration",
    "analytical", "detail oriented", "self motivated", "adaptability", "time management",
    "critical thinking", "creativity", "project management",
}

# Years-of-experience patterns
_YOE_PATTERNS = [
    r"(\d+)\s*\+?\s*(?:to|-)\s*\d+\s+years?",
    r"(\d+)\s*\+\s*years?",
    r"minimum\s+of\s+(\d+)\s+years?",
    r"at\s+least\s+(\d+)\s+years?",
    r"(\d+)\s+years?\s+(?:of\s+)?(?:experience|exp\b)",
    r"experience\s+of\s+(\d+)\s+years?",
]

# Seniority ladder
_SENIORITY = {
    r"\bintern\b": 0,
    r"\bjunior\b": 1,
    r"\bassociate\b": 2,
    r"\bmid[\s-]?level\b": 3,
    r"\bsenior\b": 4,
    r"\bsr\b": 4,
    r"\blead\b": 5,
    r"\bstaff\b": 5,
    r"\bprincipal\b": 6,
    r"\bmanager\b": 6,
    r"\bdirector\b": 7,
    r"\bvp\b": 8,
    r"\bc[teo]o\b": 9,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_yoe(text: str) -> float:
    """Return the highest years-of-experience figure found in text, else 0."""
    text_lower = text.lower()
    candidates = []
    for pat in _YOE_PATTERNS:
        for m in re.finditer(pat, text_lower):
            try:
                candidates.append(float(m.group(1)))
            except (IndexError, ValueError):
                pass
    return max(candidates) if candidates else 0.0


def _extract_seniority(text: str) -> int:
    """Return seniority integer (0-9) or -1 if not found."""
    text_lower = text.lower()
    best = -1
    for pattern, level in _SENIORITY.items():
        if re.search(pattern, text_lower):
            best = max(best, level)
    return best


def _extract_skills(text: str, skill_set: set) -> set:
    text_lower = " " + text.lower() + " "
    found = set()
    for skill in skill_set:
        escaped = re.escape(skill)
        if re.search(r"(?<!\w)" + escaped + r"(?!\w)", text_lower):
            found.add(skill)
    return found


# ---------------------------------------------------------------------------
# Scoring functions
# ---------------------------------------------------------------------------

def _score_skills(resume_text: str, jd_text: str) -> tuple[float, list, list]:
    """
    Returns (skill_score 0-100, matched_skills, missing_skills).
    Covers both tech and soft skills.
    """
    jd_skills     = _extract_skills(jd_text, TECH_SKILLS) | _extract_skills(jd_text, SOFT_SKILLS)
    resume_skills = _extract_skills(resume_text, TECH_SKILLS) | _extract_skills(resume_text, SOFT_SKILLS)

    if not jd_skills:
        return 100.0, [], []

    matched = sorted(jd_skills & resume_skills)
    missing = sorted(jd_skills - resume_skills)
    score   = len(matched) / len(jd_skills) * 100
    return round(score, 2), matched, missing


def _score_experience(resume_text: str, jd_text: str) -> tuple[float, str]:
    """
    Returns (experience_score 0-100, human_readable_note).

    Scoring logic:
      - If JD specifies no YOE requirement → full marks on years axis
      - Resume meets or exceeds required YOE  → full marks
      - Resume is within 1 year below         → 80 pts
      - Resume is 1-2 years below             → 60 pts
      - Resume is 2-3 years below             → 40 pts
      - Resume is >3 years below              → 20 pts

    Seniority alignment adds/subtracts up to 20 pts on top.
    Final score is clamped to [0, 100].
    """
    resume_yoe    = _extract_yoe(resume_text)
    jd_yoe        = _extract_yoe(jd_text)
    resume_senior = _extract_seniority(resume_text)
    jd_senior     = _extract_seniority(jd_text)

    notes = []

    # ── Years-of-experience score ──────────────────────────────────────────
    if jd_yoe == 0:
        yoe_score = 100.0
        notes.append("No specific years of experience required by JD.")
    else:
        gap = jd_yoe - resume_yoe
        if gap <= 0:
            yoe_score = 100.0
            notes.append(f"Meets experience requirement ({resume_yoe:.0f} yrs vs {jd_yoe:.0f} required).")
        elif gap <= 1:
            yoe_score = 80.0
            notes.append(f"Slightly below required experience ({resume_yoe:.0f} yrs vs {jd_yoe:.0f} required).")
        elif gap <= 2:
            yoe_score = 60.0
            notes.append(f"Below required experience by ~{gap:.0f} year(s) ({resume_yoe:.0f} vs {jd_yoe:.0f}).")
        elif gap <= 3:
            yoe_score = 40.0
            notes.append(f"Significantly below required experience ({resume_yoe:.0f} yrs vs {jd_yoe:.0f} required).")
        else:
            yoe_score = 20.0
            notes.append(f"Large experience gap: {resume_yoe:.0f} yrs vs {jd_yoe:.0f} required.")

    # ── Seniority alignment bonus/penalty ─────────────────────────────────
    seniority_adjustment = 0
    if jd_senior != -1 and resume_senior != -1:
        diff = resume_senior - jd_senior
        if diff == 0:
            seniority_adjustment = 10
            notes.append("Seniority level is a strong match.")
        elif diff > 0:
            seniority_adjustment = 10   # overqualified is not penalised
            notes.append("Resume seniority meets or exceeds JD level.")
        elif diff == -1:
            seniority_adjustment = 0
            notes.append("Resume seniority is one level below JD.")
        else:
            seniority_adjustment = -10
            notes.append("Resume seniority is significantly below JD level.")

    final_score = min(100.0, max(0.0, yoe_score + seniority_adjustment))
    return round(final_score, 2), " ".join(notes)


def _score_cosine(resume_text: str, jd_text: str) -> float:
    vectorizer = TfidfVectorizer()
    vectors    = vectorizer.fit_transform([resume_text, jd_text])
    sim        = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
    return round(sim * 100, 2)


# ---------------------------------------------------------------------------
# Main entry point (called by main.py)
# ---------------------------------------------------------------------------

def analyze_resume(resume_text: str, job_description: str) -> dict:
    """
    Returns a dict with all scores and gap details.

    Weights:
      cosine_similarity  35 %
      skill_match        40 %
      experience_match   25 %
    """
    cosine_score                      = _score_cosine(resume_text, job_description)
    skill_score, matched, missing     = _score_skills(resume_text, job_description)
    experience_score, experience_note = _score_experience(resume_text, job_description)

    final_score = round(
        cosine_score    * 0.35 +
        skill_score     * 0.40 +
        experience_score * 0.25,
        2
    )

    return {
        "final_match_score":        final_score,
        "cosine_similarity_score":  cosine_score,
        "skill_match_score":        skill_score,
        "experience_score":         experience_score,
        "matched_skills":           matched,
        "missing_skills":           missing,
        "experience_note":          experience_note,
    }