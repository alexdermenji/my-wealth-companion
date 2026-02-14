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

## Getting Started

```bash
git clone git@github.com:alexdermenji/my-wealth-companion.git
cd my-wealth-companion
```

### Backend

```bash
cd backend/src/FinanceFlow.Api
dotnet run
```

The API starts at **http://localhost:5062**. The database (`finance.db`) is created automatically on first run.

API docs are available at http://localhost:5062/scalar.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at **http://localhost:8080**. API calls to `/api/*` are automatically proxied to the backend.

### Running Both

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend/src/FinanceFlow.Api && dotnet watch

# Terminal 2 — Frontend
cd frontend && npm run dev
```

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

## Scripts

### Frontend

| Command          | Description              |
| ---------------- | ------------------------ |
| `npm run dev`    | Start dev server         |
| `npm run build`  | Production build         |
| `npm run lint`   | Run ESLint               |
| `npm run test`   | Run tests (Vitest)       |

### Backend

| Command            | Description                 |
| ------------------ | --------------------------- |
| `dotnet run`       | Start the API               |
| `dotnet watch`     | Start with hot reload       |
| `dotnet build`     | Build the project           |
| `dotnet test`      | Run tests                   |
