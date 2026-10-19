# AthlonIQ — Personal AI Performance & Physique OS

> **AthlonIQ** is an autonomous, high-precision Personal AI Performance & Physique Operating System engineered to synthesize strength training, endurance conditioning, nutrition science, biometric recovery, and physique optimization into a single unified intelligence loop.

---

## 🌟 Key Capabilities

- 🏋️ **Adaptive Workout & Strength Engine**: Double-progression overload engine respecting home-gym load caps (70 kg free-weights), auto-regulating load increases and tempo/reps progressions.
- 🥗 **Dynamic Macro & Energy System**: 22+ verified Indian and athletic staple catalog, isolated photo meal estimates, and 14-day deterministic lean-bulk energy calibration.
- ⚡ **Multi-Sport Workload & Recovery**: Cumulative fatigue triangulation combining Gym Lifting, Badminton (min), and Running (km & pace MM:SS /km) with sleep and soreness tracking.
- 🧠 **Personal AI Coach with 8 Typed Tools**: Provider-independent AI Coach operating strictly over user snapshots with medical safety red-flag escalation and offline deterministic fallback.
- 📸 **Private Progress Photo Timeline**: Secure photo logging with side-by-side comparison, weight stamps, and scientific visual-only disclaimers.
- 🔒 **Data Portability & Sovereignty**: Full JSON archive export, clean CSV spreadsheet export, and two-step permanent data wipe.

---

## 🏗️ Architecture & Technology Stack

| Layer | Stack | Key Technologies |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, PWA | Tailwind CSS, Lucide Icons, Obsidian/Lime/Cyan Palette |
| **Backend API** | FastAPI, Python 3.12+ / 3.14+ | Pydantic v2, Uvicorn, Pytest, HTTPX |
| **Database & Auth** | PostgreSQL, Supabase | Row Level Security (RLS), Cryptographic JWT Auth |
| **AI Intelligence** | Google Gemini 2.5 Flash / SDK | Structured JSON schemas, 8 allowlisted tools, offline fallback |

---

## 📁 Repository Layout

```text
athloniq/
├── AGENTS.md                  # Workspace rules & agent instructions
├── README.md                  # Project overview (this file)
├── docs/                      # Technical documentation & design specs
│   ├── ARCHITECTURE.md        # Deep-dive system architecture
│   ├── DATABASE.md            # Schema, entities & RLS models
│   ├── SECURITY.md            # Auth, encryption & data privacy
│   ├── AI_DESIGN.md           # AI Coach reasoning & orchestration
│   └── ROADMAP.md             # Multi-phase milestone roadmap
├── supabase/                  # Database migrations and seed fixtures
│   ├── migrations/            # SQL migration scripts
│   └── seed.sql               # Seed data for local development
├── api/                       # FastAPI intelligence service
│   ├── app/                   # Application code
│   └── tests/                 # Backend automated test suite (108 tests)
└── web/                       # React + TypeScript client application
    └── src/                   # Feature-driven UI components & hooks
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v22+ recommended)
- **Python**: v3.12 or later (Python 3.14 supported)
- **Git**

### 2. Backend (FastAPI API)
```bash
cd api
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Frontend (Vite + React)
```bash
cd web
npm install
npm run build
npm run dev
```
- Frontend application will launch at: `http://localhost:5173`

---

## 🧪 Automated Test Suite (108 Tests)

The test suite thoroughly verifies all 5 phases across 108 automated test cases:
```bash
cd api
pytest -v
```

1. `tests/test_health.py` (10 tests): System health, database connectivity, and CORS.
2. `tests/test_phase2_tracking.py` (56 tests): Food catalog, daily totals isolation, running pace, progression engine, weight trend.
3. `tests/test_phase3_vision.py` (14 tests): Meal photo estimation, structured Gemini schemas, confirmation flow.
4. `tests/test_phase4_coach.py` (16 tests): AI Coach 8 typed tools, weekly review synthesis, medical guardrail, JWT auth gating.
5. `tests/test_phase5_acceptance.py` (12 tests): End-to-end acceptance suite covering all 12 operational contracts.

---

## 🌐 Production Deployment

### 1. Supabase Database Migrations
Apply versioned migrations in `supabase/migrations/`:
```bash
supabase db push
```

### 2. Frontend on Vercel
- Root directory: `web`
- Build command: `npm run build`
- Output directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://your-api.onrender.com`
  - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`

### 3. Backend on Render
- Root directory: `api`
- Environment: `Python 3`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `ENVIRONMENT`: `production`
  - `SUPABASE_JWT_SECRET`: `your-supabase-jwt-secret`
  - `GEMINI_API_KEY`: `your-gemini-key` (optional, offline fallback active)
