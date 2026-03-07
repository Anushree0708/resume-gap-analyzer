# Resume Gap Analyzer – Frontend

A modern React + TypeScript + Vite frontend for the Resume Gap Analyzer backend.

## Features

- **Analyze** – Upload a PDF resume, paste a job description, and get a match score with matched/missing skills.
- **History** – View all previous analyses with scores and timestamps.
- **Analytics** – See aggregate stats (avg / min / max score) and a score-over-time line chart.

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| TailwindCSS 4 | Styling |
| Recharts | Data visualization |
| React Router v7 | Client-side routing |

## Prerequisites

- Node.js 18+
- The backend running on `http://localhost:8000` (see `../backend/`)

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure backend URL
cp .env.example .env
# Edit .env if your backend runs on a different host/port

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL (no trailing slash) |

Create a `.env` file in this directory (copy from `.env.example`) to override defaults.

## Building for Production

```bash
npm run build
# Output is in ./dist
npm run preview   # preview the production build locally
```

## Backend CORS

The backend must allow requests from the frontend origin. By default the backend
accepts `http://localhost:5173` and `http://localhost:3000`.

To customise this, set the `CORS_ORIGINS` environment variable on the backend
(comma-separated list of allowed origins) before starting FastAPI:

```bash
CORS_ORIGINS="https://myapp.example.com" uvicorn main:app --reload
```

## API Endpoints Used

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze` | Multipart upload: `file` (PDF) + `job_description` (text) |
| `GET` | `/history` | List all past analyses |
| `GET` | `/analytics` | Aggregate stats (avg/min/max score, total count) |

