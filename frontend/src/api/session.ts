// src/api/session.ts

export function getSessionId(): string {
  let id = localStorage.getItem('rga_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rga_session_id', id);
  }
  return id;
}