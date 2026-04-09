.PHONY: help dev build lint test test-watch e2e

dev:
	@if lsof -i :8080 -t > /dev/null 2>&1; then \
		echo "Error: port 8080 is already in use. Run: lsof -i :8080"; \
		exit 1; \
	fi
	cd frontend && npm run dev

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

test:
	cd frontend && npm run test

test-watch:
	cd frontend && npm run test:watch

e2e:
	cd frontend && npm run e2e

help:
	@echo "Available commands:"
	@echo "  make dev         - Run dev server (vite)"
	@echo "  make build       - Build frontend"
	@echo "  make lint        - Lint"
	@echo "  make test        - Run unit tests"
	@echo "  make test-watch  - Run unit tests in watch mode"
	@echo "  make e2e         - Run Playwright e2e tests"
