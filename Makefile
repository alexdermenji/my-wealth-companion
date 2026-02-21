.PHONY: help be fe fe-build fe-lint fe-test fe-test-watch fe-e2e keycloak-up keycloak-down keycloak-restart


be:
	cd backend && source .env && export DB_PASSWORD KEYCLOAK_AUTHORITY KEYCLOAK_AUDIENCE && \
	export PATH="/opt/homebrew/opt/dotnet@9/bin:$$PATH" && \
	export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec" && \
	cd src/FinanceFlow.Api && dotnet watch

fe: keycloak-up
	@if lsof -i :8080 -t > /dev/null 2>&1; then \
		echo "Error: port 8080 is already in use. Run: lsof -i :8080"; \
		exit 1; \
	fi
	cd frontend && npm run dev

fe-build:
	cd frontend && npm run build

fe-lint:
	cd frontend && npm run lint

fe-test:
	cd frontend && npm run test

fe-test-watch:
	cd frontend && npm run test:watch

fe-e2e:
	cd frontend && npm run e2e

keycloak-up:
	cd frontend && npm run keycloak:up

keycloak-down:
	cd frontend && npm run keycloak:down

keycloak-restart: keycloak-down keycloak-up

help:
	@echo "Available commands:"
	@echo "  make be             - Run backend (dotnet watch)"
	@echo "  make fe             - Run frontend (vite dev)"
	@echo "  make fe-build       - Build frontend"
	@echo "  make fe-lint        - Lint frontend"
	@echo "  make fe-test        - Run unit tests"
	@echo "  make fe-test-watch  - Run unit tests in watch mode"
	@echo "  make fe-e2e         - Run Playwright e2e tests"
	@echo "  make keycloak-up    - Start Keycloak via Docker"
	@echo "  make keycloak-down  - Stop Keycloak via Docker"