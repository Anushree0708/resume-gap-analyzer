export interface AnalyzeResult {
  final_match_score: number;
  cosine_similarity_score: number;
  skill_match_score: number;
  important_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
}

export interface HistoryRecord {
  id: number;
  filename: string;
  final_score: number;
  cosine_score: number;
  skill_score: number;
  created_at: string;
}

export interface AnalyticsData {
  total_resumes: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}
