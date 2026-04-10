# Pacifica Analytics — convenience targets
# Run `make help` for the list.

.PHONY: help install backend frontend dev stop clean reset-db

help:
	@echo "Pacifica Analytics — available targets:"
	@echo ""
	@echo "  make install        Install backend (venv + pip) and frontend (npm) deps"
	@echo "  make backend        Run the FastAPI backend on :8000"
	@echo "  make frontend       Run the Next.js frontend on :3000"
	@echo "  make dev            Run both servers in parallel (backend + frontend)"
	@echo "  make stop           Kill processes on :8000 and :3000"
	@echo "  make build          Production build of the frontend"
	@echo "  make reset-db       Delete the SQLite subscriber DB (drops all subscribers)"
	@echo "  make clean          Remove caches: .next, __pycache__, etc."

install:
	cd backend && python3 -m venv venv && \
	  . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && . venv/bin/activate && \
	  uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev -- -p 3000

dev:
	@echo "Starting backend (port 8000) and frontend (port 3000)…"
	@$(MAKE) -j2 backend frontend

stop:
	-@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "Stopped."

build:
	cd frontend && npm run build

reset-db:
	@rm -f backend/subscribers.db backend/subscribers.db-journal
	@echo "subscribers.db removed."

clean:
	@find . -type d -name __pycache__ -prune -exec rm -rf {} +
	@rm -rf frontend/.next frontend/out
	@echo "Clean."
