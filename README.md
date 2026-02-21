# FinanceFlow

Personal finance application for tracking income, expenses, savings, and debt with budget planning.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Backend  | .NET 9, ASP.NET Core, Entity Framework Core     |
| Database | SQLite                                          |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Docker](https://www.docker.com/) (for Keycloak)

## Getting Started

```bash
git clone git@github.com:alexdermenji/my-wealth-companion.git
cd my-wealth-companion
```

### Running with Make

Open two terminals:

```bash
# Terminal 1 — Backend
make be

# Terminal 2 — Frontend (also starts Keycloak)
make fe
```

- Frontend: **http://localhost:8080**
- Backend API: **http://localhost:5062** · Docs: http://localhost:5062/scalar
- Keycloak: **http://localhost:8180**

Run `make help` to see all available commands.

## Project Structure

```
my-wealth-companion/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── app/              # App shell, layout, routing
│   │   ├── features/         # Feature modules
│   │   │   ├── dashboard/    # Dashboard with charts
│   │   │   ├── budget/       # Monthly budget planning
│   │   │   ├── transactions/ # Transaction tracking
│   │   │   └── settings/     # Accounts & categories config
│   │   ├── shared/           # Cross-cutting API, hooks, types
│   │   └── components/ui/    # shadcn/ui components
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                  # .NET API
    ├── src/
    │   └── FinanceFlow.Api/
    │       ├── Controllers/  # API endpoints
    │       ├── Services/     # Business logic
    │       ├── Data/         # EF Core context & migrations
    │       └── Models/       # Domain models
    └── FinanceFlow.Api.sln
```

## API Endpoints

| Resource       | Endpoints                         |
| -------------- | --------------------------------- |
| Accounts       | `GET/POST/PUT/DELETE /api/accounts`       |
| Categories     | `GET/POST/PUT/DELETE /api/categories`     |
| Transactions   | `GET/POST/PUT/DELETE /api/transactions`   |
| Budget Plans   | `GET/PUT /api/budget-plans`               |
| Dashboard      | `GET /api/dashboard/summary`, `GET /api/dashboard/monthly-comparison` |
| Settings       | `GET/PUT /api/settings`                   |

## Make Commands

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `make be`              | Run backend (dotnet watch)               |
| `make fe`              | Start Keycloak + frontend dev server     |
| `make fe-build`        | Production build                         |
| `make fe-lint`         | Run ESLint                               |
| `make fe-test`         | Run unit tests (Vitest)                  |
| `make fe-test-watch`   | Run unit tests in watch mode             |
| `make fe-e2e`          | Run Playwright e2e tests                 |
| `make keycloak-up`     | Start Keycloak via Docker                |
| `make keycloak-down`   | Stop Keycloak                            |
| `make keycloak-restart`| Restart Keycloak                         |
