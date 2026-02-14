#!/bin/bash
cd "$(dirname "$0")/backend/src/FinanceFlow.Api"
source .env && export DB_PASSWORD
dotnet watch
