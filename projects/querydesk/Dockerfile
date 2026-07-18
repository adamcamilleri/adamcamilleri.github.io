FROM node:20-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY backend/demo_dictionary.xlsx ./demo_dictionary.xlsx
COPY --from=web /web/dist ./frontend_dist
ENV QUERYDESK_STATIC_DIR=/app/frontend_dist \
    QUERYDESK_DATA_DIR=/app/data
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
