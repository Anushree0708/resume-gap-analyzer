// src/api/client.ts

import { getSessionId } from './session';

const API_BASE_URL = 'https://resume-gap-analyzer-1-li2y.onrender.com';

// ---------------------------------------------------------------------------
// Analyze — session_id sent as a form field
// ---------------------------------------------------------------------------

export async function analyzeResume(file: File, jobDescription: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_description', jobDescription);
  formData.append('session_id', getSessionId());
  // ⚠️ Do NOT set Content-Type manually — browser sets multipart/form-data automatically

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// History — session_id sent as a header
// ---------------------------------------------------------------------------

export async function fetchHistory() {
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: { 'session-id': getSessionId() },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Analytics — session_id sent as a header
// ---------------------------------------------------------------------------

export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers: { 'session-id': getSessionId() },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}