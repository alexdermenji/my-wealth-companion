# FinanceFlow

Personal finance application for tracking income, expenses, savings, and debt with budget planning.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Database | PostgreSQL (Supabase)                           |
| Auth     | Supabase Auth                                   |
| Hosting  | Vercel                                          |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18

## Getting Started

```bash
git clone git@github.com:alexdermenji/my-wealth-companion.git
cd my-wealth-companion
```

### Environment setup

Create `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Running locally

```bash
make fe
```

Frontend: **http://localhost:8080**

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
└── supabase/                 # Database migrations & functions
```

## Make Commands

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `make fe`            | Start frontend dev server      |
| `make fe-build`      | Production build               |
| `make fe-lint`       | Run ESLint                     |
| `make fe-test`       | Run unit tests (Vitest)        |
| `make fe-test-watch` | Run unit tests in watch mode   |
| `make fe-e2e`        | Run Playwright e2e tests       |

## Deployment

The app auto-deploys to Vercel:

- **Production**: every push to `main`
- **Preview**: every pull request gets a unique preview URL

Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are configured in the Vercel dashboard.
