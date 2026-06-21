.PHONY: install dev test docker eval clean test-inference

# Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development (runs both in parallel)
dev:
	make -j 2 dev-backend dev-frontend

dev-backend:
	cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Testing
test:
	cd backend && python -m pytest tests/ -v

test-d:
	cd backend && python tests/test_daep.py

test-c:
	cd backend && python tests/test_cmi.py

test-p:
	cd backend && python tests/test_pipeline.py

# Standalone inference test
test-inference:
	cd backend && python test_inference.py --image $(IMAGE) --output ./results

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Evaluation
eval:
	cd backend && python evaluation/evaluator.py --data_path $(DATA_PATH) --output ./results

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	cd frontend && rm -rf node_modules dist 2>/dev/null || true

# Full setup
setup: install
	@echo "Setup complete. Run 'make dev' to start development servers."
