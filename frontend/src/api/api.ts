// api.ts

const API_BASE_URL = "https://resume-gap-analyzer-2-i2m8.onrender.com";

// ---- ANALYZE RESUME ----
export async function analyzeResume(file: File, jobDescription: string) {
  try {
    if (!file) {
      throw new Error("No file selected");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    // Check if request failed
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Analyze Resume Error:", error);
    throw error;
  }
}

// ---- FETCH HISTORY ----
export async function fetchHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch history: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch History Error:", error);
    throw error;
  }
}

// ---- FETCH ANALYTICS ----
export async function fetchAnalytics() {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch analytics: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch Analytics Error:", error);
    throw error;
  }
}