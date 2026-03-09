
// api.ts
const API_BASE_URL = "https://resume-gap-analyzer-2-i2m8.onrender.com"// your backend URL

export async function analyzeResume(file: File, jobDescription: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/analyze`, { // <- /analyze endpoint
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze resume");
  }

  return response.json();
}

// ---- FETCH HISTORY ----
export async function fetchHistory() {
  const response = await fetch(`${API_BASE_URL}/history`);

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  return response.json();
}

// ---- FETCH ANALYTICS ----
export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return response.json();
}