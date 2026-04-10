# Pacifica Analytics — backend Dockerfile
# Works on any container host (Fly.io, Railway, Cloud Run, Docker Compose, etc.)
#
# Build:  docker build -t pacifica-analytics-backend .
# Run:    docker run -p 8000:8000 \
#           -e ELFA_API_KEY=... \
#           -e TELEGRAM_BOT_TOKEN=... \
#           -e TELEGRAM_BOT_USERNAME=... \
#           -e APP_PUBLIC_URL=https://your-frontend.example.com \
#           -e ALLOWED_ORIGINS=https://your-frontend.example.com \
#           -v $PWD/data:/data \
#           pacifica-analytics-backend

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    SUBSCRIBERS_DB_PATH=/data/subscribers.db

WORKDIR /app

# Install deps separately so layer caches well
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app source
COPY app ./app

# SQLite data lives on a mounted volume (mount /data via host config)
RUN mkdir -p /data

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
