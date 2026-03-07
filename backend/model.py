from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# 🎯 Define technical skills
TECH_SKILLS = {
    "python", "sql", "machine learning", "deep learning",
    "data analysis", "pandas", "numpy", "scikit learn",
    "tensorflow", "pytorch", "tableau", "power bi",
    "looker", "etl", "data engineering", "ai",
    "statistics", "data science", "nlp", "computer vision",
    "fastapi", "flask", "react", "aws", "azure", "gcp"
}


def extract_keywords(text, top_n=15):
    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=1000
    )

    tfidf_matrix = vectorizer.fit_transform([text])
    feature_names = vectorizer.get_feature_names_out()
    scores = tfidf_matrix.toarray()[0]

    sorted_indices = np.argsort(scores)[::-1]

    top_words = []
    for i in sorted_indices:
        word = feature_names[i].lower()

        if word in TECH_SKILLS:
            top_words.append(word)

        if len(top_words) == top_n:
            break

    return top_words


def analyze_resume(resume_text, job_description):

    # -------------------------
    # 1️⃣ Cosine Similarity Score
    # -------------------------
    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2)
    )

    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])

    cosine_score = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:2]
    )[0][0]

    cosine_percentage = cosine_score * 100

    # -------------------------
    # 2️⃣ Skill Match Score
    # -------------------------
    jd_skills = extract_keywords(job_description, top_n=15)

    resume_text_lower = resume_text.lower()

    matched = []
    missing = []

    for skill in jd_skills:
        if skill in resume_text_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    if len(jd_skills) > 0:
        skill_match_percentage = (len(matched) / len(jd_skills)) * 100
    else:
        skill_match_percentage = 0

    # -------------------------
    # 3️⃣ Hybrid Final Score
    # -------------------------
    final_score = (0.7 * skill_match_percentage) + (0.3 * cosine_percentage)
    final_score = round(final_score, 2)

    return {
    "final_match_score": float(final_score),
    "cosine_similarity_score": float(round(cosine_percentage, 2)),
    "skill_match_score": float(round(skill_match_percentage, 2)),
    "important_skills": jd_skills,
    "matched_skills": matched,
    "missing_skills": missing
}