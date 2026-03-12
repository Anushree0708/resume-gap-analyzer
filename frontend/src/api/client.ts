import type { AuthResponse } from '../types';

const API_BASE_URL = "https://resume-gap-analyzer-1-li2y.onrender.com";

// ---------------------------------------------------------------------------
// Token storage helpers
// ---------------------------------------------------------------------------

export function saveToken(token: string, email: string) {
  localStorage.setItem('rga_token', token);
  localStorage.setItem('rga_email', email);
}

export function clearToken() {
  localStorage.removeItem('rga_token');
  localStorage.removeItem('rga_email');
}

export function getToken(): string | null {
  return localStorage.getItem('rga_token');
}

export function getEmail(): string | null {
  return localStorage.getItem('rga_email');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail ?? 'Registration failed');
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail ?? 'Login failed');
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Protected endpoints  (all send Authorization header)
// ---------------------------------------------------------------------------

export async function analyzeResume(file: File, jobDescription: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_description', jobDescription);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: authHeaders(),          // ← JWT attached
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json();
}

export async function fetchHistory() {
  const response = await fetch(`${API_BASE_URL}/history`, {
    headers: authHeaders(),          // ← JWT attached
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}

export async function fetchAnalytics() {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers: authHeaders(),          // ← JWT attached
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  return response.json();
}
