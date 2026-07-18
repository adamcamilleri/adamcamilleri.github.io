SHELL := bash

ifeq ($(OS),Windows_NT)
PY := backend/.venv/Scripts/python.exe
else
PY := backend/.venv/bin/python
endif

.PHONY: setup seed dev dev-api dev-web test build

backend/.venv:
	python -m venv backend/.venv || python3 -m venv backend/.venv || py -3.12 -m venv backend/.venv

setup: backend/.venv
	$(PY) -m pip install -q -r backend/requirements.txt
	cd frontend && npm install --no-fund --no-audit

seed: setup
	cd backend && ../$(PY) -m app.seed.seed_demo

dev:
	./dev.sh

dev-api:
	cd backend && ../$(PY) -m uvicorn app.main:app --reload --port 8000

dev-web:
	cd frontend && npm run dev

test:
	cd backend && ../$(PY) -m pytest

build:
	cd frontend && npm run build
