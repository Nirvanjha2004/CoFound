<div align="center">

# CoFound

**A startup OS in your browser — drop an idea, get a living knowledge graph, and let agents do the research.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-cofound.nirvan.dev-0071e3?style=for-the-badge&logo=vercel)](https://cofound.nirvan.dev)
[![GitHub](https://img.shields.io/badge/GitHub-nirvan.dev-181717?style=for-the-badge&logo=github)](https://github.com/Nirvanjha2004)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**[▶ Try it live → cofound.nirvan.dev](https://cofound.nirvan.dev)**

</div>

---

## What it is

Your startup becomes an **11-node knowledge graph**. One orchestrator runs the show, parallel researcher agents fill the nodes with evidence from the web, Reddit, and GitHub. Server-Sent Events stream the chaos live as it happens. And when you actually need to do something, you get one clear **today's priority**.

**[cofound.nirvan.dev](https://cofound.nirvan.dev)** — type an idea and you're in.

---

## What you get

- **Canvas** — React Flow graph with confidence rings, unlock logic, and live agent chips on each node
- **Research agents** — spawn on canonical nodes or create custom research nodes on demand; Gemini Flash loops with self-critique scoring
- **Voice orb** — talk or type to spawn research, pivot, export, or hand off priorities (Deepgram STT/TTS)
- **Live feed** — SSE pushes agent lines and graph updates to your browser in real time
- **Surgical pivot** — a diff classifier resets only the nodes that actually changed when you pivot the idea
- **Integrations** — GitHub for build signals, PostHog for funnel drops, Reddit + Firecrawl for market evidence
- **Export** — generates a scaffold zip (README, stack spec, UI spec, project rules, handoff doc) when Revenue + Product Vision + Tech Stack nodes are ready

---

## The 11-node knowledge graph

| Node | Unlocks when |
|---|---|
| Core Idea | Always available |
| Audience | Core Idea ≥ 70% |
| Market Intelligence | Core Idea ≥ 70% |
| Competitors | Core Idea ≥ 70% |
| Revenue | Audience + Market ≥ 70% |
| Product Vision | Audience + Market ≥ 70% |
| Tech Stack | Competitors + Core Idea ≥ 70% |
| Build | Revenue + Tech Stack ≥ 70% |
| Launch | Build (auto on deploy) |
| Observe | Launch (on PostHog connect) |
| Growth | Observe (continuous) |

Custom Research nodes can be spun up at any time.

---

## Tech stack

| Thing | What it does here |
|---|---|
| **React 19 + Vite** | Frontend SPA |
| **`@xyflow/react`** | Interactive knowledge graph canvas |
| **Zustand** | Global state |
| **Tailwind CSS v4** | Styling |
| **Radix UI** | Accessible UI primitives |
| **Framer Motion + GSAP** | Animation |
| **FastAPI + Python 3.11+** | Backend API |
| **MongoDB Atlas** | Graph storage, task queue, journal, event stores, vector search |
| **Motor** | Async MongoDB driver |
| **Gemini 2.5 Pro** | Orchestrator, dialogue, pivot classifier, export narrative |
| **Gemini 2.0 Flash** | Researcher loops + critique scoring |
| **Firecrawl** | Web research and market evidence |
| **Reddit (PRAW)** | Community evidence |
| **Deepgram** | Voice STT/TTS (optional, server-side proxy) |
| **SSE (sse-starlette)** | Live feed from agents to frontend |
| **AWS Bedrock / Nova Pro** | Fallback when Gemini is unavailable |

---

## Architecture

```
idea → orchestrator → planner → researchers (N parallel) → MongoDB graph
           ↓                              ↓
    voice / chat UI                SSE feed → frontend canvas
           ↓
    today's priority
```

**Agent roster:**

| Agent | Responsibility |
|---|---|
| Orchestrator | Reads graph, spawns agents, manages research budget |
| Planner | Decomposes idea into focused research tasks |
| Researcher (N) | Karpathy self-critique research loop per node |
| Dialogue Agent | Synthesizes a brief, asks one targeted question |
| Build Observer | Polls GitHub, updates Build node |
| Observe Agent | Queries PostHog funnels, detects drops |
| Growth Agent | Generates ranked recommendations |
| Export Agent | Generates scaffold zip on approval |
| Diff Classifier | Surgical re-research on pivot |

**MongoDB collections:** `startup_graphs`, `nodes`, `task_queue`, `dead_ends`, `decision_journal`, `product_knowledge_base` (Atlas Vector Search), `agent_sessions`, `build_events`, `observe_events`

---

## Getting started

### Prerequisites

- Python 3.11+
- Node 20+
- MongoDB Atlas cluster (free tier works)
- Google AI Studio API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone and set up environment

```bash
git clone https://github.com/Nirvanjha2004/CoFound.git
cd CoFound
cp .env.example .env
```

Open `.env` and fill in at minimum `MONGODB_URI` and `GOOGLE_API_KEY`.

### 2. Start the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements-dev.txt

# Run from the repo root so main.py picks up the root .env
uvicorn main:app --reload --port 8000
```

Verify it's healthy:

```bash
curl http://localhost:8000/health
# {"status":"ok","store":"atlas","python":"3.11.x"}
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Type an idea and you're in.

### Docker (skip manual setup)

```bash
cp .env.example .env
# fill in MONGODB_URI and GOOGLE_API_KEY in .env
docker compose up
```

Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## Environment variables

Copy `.env.example` → `.env` at the repo root.

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | **Yes** | Atlas connection string |
| `MONGODB_DB` | No | Default: `cofounder` |
| `GOOGLE_API_KEY` | **Yes** | Gemini agents + planner |
| `GEMINI_PRO_MODEL` | No | Default: `gemini-2.5-pro` |
| `GEMINI_FLASH_MODEL` | No | Default: `gemini-2.0-flash` |
| `FIRECRAWL_API_KEY` | No | Web research |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | No | Community research |
| `GITHUB_TOKEN` | No | Build node |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | GitHub OAuth |
| `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` | No | Observe node |
| `DEEPGRAM_API_KEY` | No | Voice STT/TTS |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | No | Bedrock fallback |
| `ORCHESTRATOR_MODEL_ID` | No | Bedrock model (Nova Pro) |
| `CORS_ORIGINS` | No | Comma-separated origins (include your Vercel URL in prod) |
| `BACKEND_PORT` | No | Default: `8000` |

**Frontend (set on Vercel):**

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Backend URL in production; falls back to Render host if unset |

---

## Key API routes

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/workspace` | Create a graph from an idea |
| `GET` | `/api/workspace/{id}` | Fetch the full graph |
| `POST` | `/api/orchestrator/chat` | Talk to the voice orb |
| `POST` | `/api/agents/spawn` | Bulk research session |
| `POST` | `/api/agents/spawn-research-agents` | Custom nodes + parallel agents |
| `GET` | `/api/feed` | SSE stream |
| `POST` | `/api/voice/stt` | Voice speech-to-text proxy |
| `POST` | `/api/voice/tts` | Voice text-to-speech proxy |
| `POST` | `/api/export` | Generate scaffold zip |
| `GET` | `/health` | Liveness + store status |

---

## Folder structure

```
CoFound/
├── backend/
│   ├── main.py              FastAPI entry, store bootstrap, CORS
│   ├── api/                 Routes (workspace, agents, feed, voice, export, integrations, nodes)
│   ├── agents/              Orchestrator, researcher, planner, dialogue, diff_classifier, growth, export
│   ├── graph/               Node manager, schema, snapshot, unlock engine
│   ├── llm/                 Gemini client, Bedrock fallback
│   ├── db/                  Atlas store, connection, collections
│   ├── sse/                 Feed broadcaster
│   ├── tools/               Firecrawl, web search, Reddit, GitHub, PostHog, Deepgram
│   ├── critique/            Self-critique scorer
│   ├── export/              Scaffold generator + zipper
│   └── tests/               Unit, integration, e2e
├── frontend/
│   ├── src/
│   │   ├── App.tsx           Root, phase routing (intake | dashboard)
│   │   ├── components/       Canvas, node cards, voice orb, chat, panels, bars
│   │   ├── hooks/            useSSEFeed, useWorkspace, useAgents, useVoiceOrchestrator
│   │   ├── store/            Zustand global state
│   │   └── lib/api.ts        API client
│   └── vite.config.ts
├── docs/
│   ├── architecture.md       System design
│   └── mongodb_schema.md     Collection schemas + unlock rules
└── scripts/                  Atlas seed + index setup
```

---

## Deployment

**Frontend → Vercel** ([cofound.nirvan.dev](https://cofound.nirvan.dev))

1. Connect the repo to Vercel. Set root directory to `frontend`.
2. Add `VITE_API_BASE_URL` pointing to your Render backend.

**Backend → Render** (Python 3.11, free tier via `render.yaml`)

1. Connect the repo at [render.com](https://render.com) → **New → Web Service**.
2. Root dir: `backend`. Build + start commands are in `render.yaml`.
3. Set all required env vars in the Render dashboard.
4. Set `CORS_ORIGINS` on Render to include your Vercel domain.

---

## Contributing

1. Fork on GitHub: [github.com/Nirvanjha2004](https://github.com/Nirvanjha2004)
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Start the local stack (backend + frontend as above)
4. Run backend tests: `cd backend && pytest`
5. Build the frontend: `cd frontend && npm run build`
6. Open a pull request

---

## License

MIT — see [`LICENSE`](LICENSE)

---

## About the developer

Built by [Nirvan Jha](https://github.com/Nirvanjha2004) — [nirvan.dev](https://nirvan.dev)

- GitHub: [github.com/Nirvanjha2004](https://github.com/Nirvanjha2004)
- Live project: [cofound.nirvan.dev](https://cofound.nirvan.dev)
- Architecture docs: [`docs/architecture.md`](docs/architecture.md)
- Schema docs: [`docs/mongodb_schema.md`](docs/mongodb_schema.md)

---

<div align="center">

**[cofound.nirvan.dev](https://cofound.nirvan.dev)** · [github.com/Nirvanjha2004](https://github.com/Nirvanjha2004)

*Drop an idea. Get a living graph. Let the agents do the annoying research bits.*

</div>
