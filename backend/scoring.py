from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def analyze_resume(resume_text, job_description):
    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform([resume_text, job_description])

    cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

    return {
        "cosine_similarity_score": round(cosine_sim * 100, 2)
    }