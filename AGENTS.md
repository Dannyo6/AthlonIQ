# AthlonIQ — Workspace Rules & Agent Guidelines (`AGENTS.md`)

Welcome to **AthlonIQ** — the *Personal AI Performance & Physique OS*.
This document governs coding practices, architecture principles, repository standards, and agent operational protocols across the AthlonIQ ecosystem.

---

## 1. Core Principles & Philosophy
1. **Athlete-Centric Precision**: Performance metrics, training loads, macro targets, and recovery scores must be numerically deterministic, mathematically rigorous, and auditable. AI generates coaching insights, strategic adaptations, and contextual guidance—never random numbers.
2. **Privacy & Security First**: Athletic health data, biometrics, body composition, and personal chat histories are private. Row-Level Security (RLS) is non-negotiable on all Supabase tables.
3. **Modular Monorepo Structure**: Keep the repository clean, structured, and decoupled across:
   - `web/`: Client UI (Vite + React + TypeScript + Tailwind CSS)
   - `api/`: Intelligence & Processing Engine (FastAPI + Pydantic v2 + Python)
   - `supabase/`: Persistence, Auth, and Migrations (PostgreSQL + RLS + Functions)
   - `docs/`: System documentation, architecture diagrams, and roadmaps
4. **Resilient UX**: Clean typography, dark mode by default, glassmorphic accents, high-contrast visual hierarchy, and instant interactive feedback.

---

## 2. Directory Structure & Responsibilities

```text
athloniq/
├── AGENTS.md                  # Workspace rules for AI agents (this file)
├── README.md                  # Project overview, setup, and architecture summary
├── .gitignore                 # Monorepo-wide ignore rules
├── .env.example               # Environment variables template
├── docs/                      # Core architectural & technical specs
│   ├── ARCHITECTURE.md        # System architecture, data flow & service boundary
│   ├── DATABASE.md            # Schema, entities, relationships & RLS rules
│   ├── SECURITY.md            # Auth, data protection, RBAC & threat model
│   ├── AI_DESIGN.md           # AI Coach system, prompt orchestration & memory
│   └── ROADMAP.md             # Development roadmap across all phases
├── supabase/
│   ├── migrations/            # Versioned SQL migrations (timestamped)
│   └── seed.sql               # Development seeds with realistic athlete profiles
├── api/                       # FastAPI intelligence & business logic service
│   ├── app/
│   │   ├── api/v1/            # API endpoints grouped by feature
│   │   ├── core/              # Config, security, DB connections, telemetry
│   │   ├── domain/            # Core domain business logic & calculators
│   │   ├── schemas/           # Pydantic models for I/O validation
│   │   ├── services/          # External integrations (Supabase, AI, analytics)
│   │   └── main.py            # FastAPI entrypoint, middleware & routing
│   ├── tests/                 # Pytest test suite
│   ├── requirements.txt       # Production dependencies
│   └── pyproject.toml         # Build system & linter/test tool configuration
└── web/                       # React + TypeScript + Tailwind web application
    ├── public/                # Static assets, icons, manifest
    ├── src/
    │   ├── app/               # Main Application shell, routes & layout
    │   ├── config/            # Brand tokens, environment & site metadata
    │   │   └── brand.ts       # Brand colors, typography, naming constants
    │   ├── components/ui/     # Reusable atomic UI components
    │   ├── features/          # Domain-driven feature modules:
    │   │   ├── dashboard/     # Daily snapshot, readiness, quick actions
    │   │   ├── profile/       # Athlete physique, biometric baselines & goals
    │   │   ├── nutrition/     # Macro tracking, meal logs, energy balance
    │   │   ├── workouts/      # Routine builder, live workout session logger
    │   │   ├── activities/    # Cardio, endurance, and daily activity logs
    │   │   ├── recovery/      # Sleep, HRV, readiness score, strain balance
    │   │   ├── progress/      # Body composition trends, 1RM charts, analytics
    │   │   └── coach/         # AI Coach conversational interface & recommendations
    │   ├── hooks/             # Custom React hooks
    │   ├── lib/               # Utility functions, formatters, API clients
    │   ├── services/          # Frontend API client methods
    │   ├── types/             # TypeScript type definitions
    │   └── styles/            # CSS tokens, Tailwind root styles
    ├── index.html             # HTML5 entrypoint
    ├── package.json           # Node dependencies and scripts
    ├── tsconfig.json          # TypeScript compilation configuration
    ├── vite.config.ts         # Vite bundler configuration
    └── tailwind.config.js     # Tailwind CSS theme extension
```

---

## 3. Technology Toolchains & Guidelines

### Frontend (`web/`)
- **Framework**: React (v18+) with TypeScript in strict mode.
- **Styling**: Tailwind CSS with custom AthlonIQ theme palette (Obsidian, Cyan, Emerald, Electric Violet).
- **Icons**: `lucide-react` for clean, consistent iconography.
- **State Management**: React Context / Hooks for UI state; Server state managed cleanly with fetch wrappers or query hooks.
- **Rule**: Do not use ad-hoc inline styles or raw color codes. Always utilize theme tokens (`brand.ts` and Tailwind utility classes).

### Backend (`api/`)
- **Framework**: FastAPI with Uvicorn.
- **Python Version**: Python 3.12+ (compatible with 3.14).
- **Validation**: Pydantic v2 schemas for all request payloads and response contracts.
- **Endpoints**: Prefix all routes with `/api/v1/`.
- **Health Checks**: Root `/health` and `/api/v1/health` must always return service status and environment.
- **Tests**: Pytest with `httpx.AsyncClient` or `TestClient`. All PRs and tasks must pass tests.

### Database & Supabase (`supabase/`)
- All migrations must be saved in `supabase/migrations/` prefixed with UTC timestamp `YYYYMMDDHHMMSS_name.sql`.
- Every table must define:
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `created_at timestamptz DEFAULT now() NOT NULL`
  - `updated_at timestamptz DEFAULT now() NOT NULL`
  - `user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE`
  - Enabled Row Level Security (`ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`)
  - Strict RLS policies allowing users to only access their own records.

---

## 4. Execution Protocols for AI Agents
- **No Hallucinated Code**: Verify syntax and imports before submitting.
- **Keep Tests Green**: Run `pytest` in `api/` and `npm run build` in `web/` to confirm zero regressions.
- **Preserve Comments & Docs**: Do not strip existing explanations or docstrings unless explicitly asked.
- **Git Hygiene**: Atomic, clearly documented commits using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
