#!/bin/bash
cd "$(dirname "$0")/backend"
source .env && export DB_PASSWORD KEYCLOAK_AUTHORITY KEYCLOAK_AUDIENCE
cd src/FinanceFlow.Api
export PATH="/opt/homebrew/opt/dotnet@9/bin:$PATH"
export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec"
dotnet watch
