export const API_URL = "https://resume-gap-analyzer-1-li2y.onrender.com";

// Analyze Resume
export async function analyzeResume(file: File, jobDescription: string) {

  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Resume analysis failed");
  }

  return response.json();
}


// Fetch Resume History
export async function fetchHistory() {

  const response = await fetch(`${API_URL}/history`);

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  return response.json();
}


// Fetch Analytics
export async function fetchAnalytics() {

  const response = await fetch(`${API_URL}/analytics`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return response.json();
}