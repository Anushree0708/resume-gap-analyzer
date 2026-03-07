#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- Config (override via env if needed) ----
COMPOSE_FILE="${COMPOSE_FILE:-backend/docker-compose.yaml}"
DB_SERVICE="${DB_SERVICE:-db}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-resume-gap-postgres}"
DB_USER="${DB_USER:-resume_gap}"
DB_NAME="${DB_NAME:-resume_gap}"

BACKEND_DIR="${BACKEND_DIR:-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-frontend}"

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

BACKEND_CMD_DEFAULT="uv run uvicorn main:app --reload --host ${BACKEND_HOST} --port ${BACKEND_PORT}"
FRONTEND_CMD_DEFAULT="npm run dev"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: '$1' is required but not found in PATH" >&2
    exit 1
  }
}

wait_for_postgres() {
  echo "Waiting for Postgres to be ready..."
  for _ in $(seq 1 60); do
    if docker exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      echo "Postgres is ready."
      return 0
    fi
    sleep 1
  done
  echo "error: timed out waiting for Postgres to be ready" >&2
  return 1
}

# Check whether a PID is still running
is_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

# ---- Preflight ----
need_cmd docker
docker compose version >/dev/null 2>&1 || {
  echo "error: Docker Compose v2 is required (use 'docker compose')." >&2
  exit 1
}

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "error: compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi
if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "error: backend dir '$BACKEND_DIR' not found" >&2
  exit 1
fi
if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "error: frontend dir '$FRONTEND_DIR' not found" >&2
  exit 1
fi

# ---- Start Postgres ----
echo "Starting Postgres via Docker Compose ($COMPOSE_FILE)..."
docker compose -f "$COMPOSE_FILE" up -d "$DB_SERVICE"
wait_for_postgres

# ---- Start backend + frontend concurrently ----
BACKEND_CMD="${BACKEND_CMD:-$BACKEND_CMD_DEFAULT}"
FRONTEND_CMD="${FRONTEND_CMD:-$FRONTEND_CMD_DEFAULT}"

echo "Starting backend:  (cd $BACKEND_DIR && $BACKEND_CMD)"
echo "Starting frontend: (cd $FRONTEND_DIR && $FRONTEND_CMD)"
echo "Press Ctrl+C to stop."

CLEANED_UP=0
cleanup() {
  # prevent running multiple times (INT + EXIT, etc.)
  if [[ "$CLEANED_UP" -eq 1 ]]; then
    return 0
  fi
  CLEANED_UP=1

  echo
  echo "Stopping dev processes..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true

  echo "Stopping Docker containers (docker compose down)..."
  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
}

# run cleanup on Ctrl+C, termination, and normal script exit
trap cleanup INT TERM EXIT

(
  cd "$BACKEND_DIR"
  exec bash -lc "$BACKEND_CMD"
) &
BACKEND_PID=$!

(
  cd "$FRONTEND_DIR"
  exec bash -lc "$FRONTEND_CMD"
) &
FRONTEND_PID=$!

# ---- Portable "wait for first to exit" (no wait -n) ----
EXIT_CODE=0
while true; do
  if ! is_running "$BACKEND_PID"; then
    wait "$BACKEND_PID" || EXIT_CODE=$?
    echo "Backend exited (code=$EXIT_CODE)."
    break
  fi
  if ! is_running "$FRONTEND_PID"; then
    wait "$FRONTEND_PID" || EXIT_CODE=$?
    echo "Frontend exited (code=$EXIT_CODE)."
    break
  fi
  sleep 0.5
done

exit "$EXIT_CODE"
