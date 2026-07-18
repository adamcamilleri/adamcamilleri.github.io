#!/usr/bin/env bash
# Start the API (uvicorn, port 8000) and the frontend (vite, port 5173).
set -euo pipefail
cd "$(dirname "$0")"

if [ -f backend/.venv/Scripts/python.exe ]; then
  PY=.venv/Scripts/python.exe
else
  PY=.venv/bin/python
fi

trap 'kill 0' EXIT
(cd backend && "$PY" -m uvicorn app.main:app --reload --port 8000) &
(cd frontend && npm run dev) &
wait
