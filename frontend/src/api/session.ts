// src/api/session.ts
// Creates a persistent anonymous session ID in localStorage.
// This replaces JWT login — each browser gets a unique UUID automatically.

export function getSessionId(): string {
  let id = localStorage.getItem('rga_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rga_session_id', id);
  }
  return id;
}
