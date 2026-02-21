.PHONY: help be fe

help:
	@echo "Available commands:"
	@echo "  make be   - Run backend (dotnet watch)"
	@echo "  make fe   - Run frontend (npm run dev)"

be:
	cd backend && source .env && export DB_PASSWORD KEYCLOAK_AUTHORITY KEYCLOAK_AUDIENCE && \
	export PATH="/opt/homebrew/opt/dotnet@9/bin:$$PATH" && \
	export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec" && \
	cd src/FinanceFlow.Api && dotnet watch

fe:
	cd frontend && npm run dev
