# AthlonIQ — Personal AI Performance & Physique OS

> **AthlonIQ** is an autonomous, high-precision Personal AI Performance & Physique Operating System engineered to synthesize strength training, endurance conditioning, nutrition science, biometric recovery, and physique optimization into a single unified intelligence loop.

---

## 🌟 Key Capabilities

- 🏋️ **Adaptive Workout & Strength Engine**: Intelligent progressive overload, volume tracking, fatigue management, and auto-regulated rep targets.
- 🥗 **Dynamic Macro & Energy System**: Target adjustments driven by metabolic rate, daily caloric expenditure, and physique goals (cut, refeed, bulk, maintenance).
- ⚡ **Recovery & Sleep Readiness**: Triangulation of sleep metrics, HRV, resting heart rate, and training strain to produce actionable daily readiness scores.
- 🧠 **Autonomous AI Performance Coach**: Context-aware coaching agent delivering actionable workout modifications, nutritional strategies, and physique audit feedback.
- 📊 **Physique & Body Composition Analytics**: High-resolution progress tracking with body fat estimates, measurement trends, and strength-to-weight ratios.

---

## 🏗️ Architecture & Technology Stack

| Layer | Stack | Key Technologies |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Tailwind CSS, Lucide Icons, Modern Dark Mode UI |
| **Backend API** | FastAPI, Python 3.12+ | Pydantic v2, Uvicorn, Pytest, HTTPX |
| **Database & Auth** | PostgreSQL, Supabase | Row Level Security (RLS), Vector Storage, Triggers |
| **AI Intelligence** | Google Gemini / GenAI | Multi-turn reasoning, adaptive recommendations |

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
│   └── tests/                 # Backend automated test suite
└── web/                       # React + TypeScript client application
    └── src/                   # Feature-driven UI components & hooks
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v24+ supported)
- **Python**: v3.12 or later (v3.14+ supported)
- **Git**

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

### 3. Backend (FastAPI API)
```bash
cd api
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 4. Frontend (Vite + React)
```bash
cd web
npm install
npm run dev
```
- Frontend application will launch at: `http://localhost:5173`

---

## 📜 Development Status
Phase 0 (Repository Initialization & Scaffolding) is complete. Refer to [`docs/ROADMAP.md`](file:///docs/ROADMAP.md) for details on upcoming phases.
