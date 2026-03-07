import type { AnalyzeResult, HistoryRecord, AnalyticsData } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function analyzeResume(
  file: File,
  jobDescription: string
): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('job_description', jobDescription);

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    body: form,
  });
  return handleResponse<AnalyzeResult>(res);
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const res = await fetch(`${BASE_URL}/history`);
  return handleResponse<HistoryRecord[]>(res);
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${BASE_URL}/analytics`);
  return handleResponse<AnalyticsData>(res);
}
