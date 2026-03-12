export interface AnalyzeResult {
  final_match_score: number;
  cosine_similarity_score: number;
  skill_match_score: number;
  experience_score: number;        // NEW
  matched_skills: string[];
  missing_skills: string[];
  experience_note: string;         // NEW
}

export interface HistoryRecord {
  id: number;
  filename: string;
  final_score: number;
  cosine_score: number;
  skill_score: number;
  experience_score: number;        // NEW
  created_at: string;
}

export interface AnalyticsData {
  total_resumes: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

export interface AuthResponse {
  token: string;
  email: string;
}
