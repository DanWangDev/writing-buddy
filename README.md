# Writing Buddy

An AI coaching app that helps 10–11 year olds prepare for 11+ creative writing exams. Unlike AI tools that rewrite for the student, Writing Buddy provides iterative, voice-preserving coaching passes that guide students to improve their own work.

Part of the 11+ prep suite alongside [vocab-master](https://github.com/DanWangDev/vocab-master). Shares auth infrastructure and is subscription-ready.

## How It Works

1. **Pick a prompt** — choose from a library of creative writing prompts, each with genre, time limits, and word count targets
2. **Write** — compose your story on the notebook-styled writing desk with a live stopwatch
3. **Get coached** — the AI runs multiple coaching passes: language improvement, narrative structure, description depth, and polishing
4. **Review changes** — see exactly what changed with word-level revision diffs
5. **Get scored** — receive a rubric-based score with detailed feedback on each dimension

## Architecture

```
                              ┌──────────────────────────────────────┐
                              │          11plus-hub (OIDC)            │
                              │         Express · port 3009           │
                              │    session store · user management    │
                              └──────────────┬───────────────────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │  OIDC (PKCE)       │   hub network      │
                        │  login/logout      │   (Docker bridge)  │
                        ▼                    │                    ▼
       ┌────────────────────────────────────┴────────────────────────────────────┐
       │                          Docker Host (NAS)                                │
       │                                                                           │
       │  ┌─────────────────────────────┐    ┌──────────────────────────────┐     │
       │  │   Frontend Container        │    │    Backend Container          │     │
       │  │   Nginx :80 (port 5055)     │    │    Express :5050              │     │
       │  │                             │    │                               │     │
       │  │  ┌───────────────────────┐  │    │  ┌────────────────────────┐   │     │
       │  │  │   React 19 SPA        │  │    │  │    Middleware Stack    │   │     │
       │  │  │   (Vite-built)        │  │    │  │  helmet · cors         │   │     │
       │  │  │                       │  │    │  │  cookieParser · auth   │   │     │
       │  │  │  Pages:               │  │    │  │  requireEntitlement    │   │     │
       │  │  │  ├─ Dashboard         │  │    │  └───────────┬────────────┘   │     │
       │  │  │  ├─ PromptBrowser     │  │    │              │                │     │
       │  │  │  ├─ WritingDesk  ◄────┼──┼────┼───/api/writing/*             │     │
       │  │  │  ├─ CoachingFeedback  │  │    │              │                │     │
       │  │  │  ├─ Portfolio         │  │    │  ┌───────────▼────────────┐   │     │
       │  │  │  ├─ SubmissionDetail  │  │    │  │      API Routes        │   │     │
       │  │  │  └─ AdminPrompts      │  │    │  │                        │   │     │
       │  │  │                       │  │    │  │  /api/auth/*           │   │     │
       │  │  │  Contexts:            │  │    │  │  ├─ /login (OIDC)      │   │     │
       │  │  │  └─ AuthContext       │  │    │  │  ├─ /callback          │   │     │
       │  │  │                       │  │    │  │  ├─ /logout            │   │     │
       │  │  │  Design:              │  │    │  │  ├─ /me                │   │     │
       │  │  │  ├─ Bangers font      │  │    │  │  └─ /backchannel       │   │     │
       │  │  │  ├─ Comic Neue font   │  │    │  │                        │   │     │
       │  │  │  ├─ Tailwind v4       │  │    │  │  /api/writing/*        │   │     │
       │  │  │  └─ Manga Burst       │  │    │  │  ├─ /prompts           │   │     │
       │  │  └───────────────────────┘  │    │  │  ├─ /submissions       │   │     │
       │  │                             │    │  │  ├─ /submissions/:id/  │   │     │
       │  │  ┌───────────────────────┐  │    │  │  │   coaching          │   │     │
       │  │  │  Nginx                │  │    │  │  ├─ /submissions/:id/  │   │     │
       │  │  │  / → SPA fallback     │  │    │  │  │   progress          │   │     │
       │  │  │  /api → backend:5050  │  │    │  │  └─ /submissions/:id/  │   │     │
       │  │  └───────────────────────┘  │    │  │     scoring            │   │     │
       │  └──────────────┬──────────────┘    │  └───────────┬────────────┘   │     │
       │                 │                   │              │                │     │
       │                 │                   │  ┌───────────▼────────────┐   │     │
       │                 │                   │  │      Services          │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  AICoach               │   │     │
       │                 │                   │  │  ├─ passes 1-4         │   │     │
       │                 │                   │  │  ├─ ContextBuilder     │   │     │
       │                 │                   │  │  └─ coaching prompts   │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  RubricScorer          │   │     │
       │                 │                   │  │  └─ 5-category rubric  │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  ContentSafety         │   │     │
       │                 │                   │  │  ├─ input screening    │   │     │
       │                 │                   │  │  └─ output filtering   │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  LLMProvider (interface)│   │     │
       │                 │                   │  │  ├─ DashScopeAdapter   │   │     │
       │                 │                   │  │  │  (Qwen models)      │   │     │
       │                 │                   │  │  └─ ClaudeAdapter      │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  DiffUtil (LCS-based)  │   │     │
       │                 │                   │  │  ProgressService       │   │     │
       │                 │                   │  │  UserSync              │   │     │
       │                 │                   │  └───────────┬────────────┘   │     │
       │                 │                   │              │                │     │
       │                 │                   │  ┌───────────▼────────────┐   │     │
       │                 │                   │  │    Repositories        │   │     │
       │                 │                   │  │    (SQLite / WAL)      │   │     │
       │                 │                   │  │                        │   │     │
       │                 │                   │  │  SubmissionRepository  │   │     │
       │                 │                   │  │  CoachingPassRepository│   │     │
       │                 │                   │  │  ProgressRepository    │   │     │
       │                 │                   │  │  RevisionRepository    │   │     │
       │                 │                   │  │  RubricScoresRepository│   │     │
       │                 │                   │  │  PromptRepository      │   │     │
       │                 │                   │  │  UserRepository        │   │     │
       │                 │                   │  │  AppUserRepository     │   │     │
       │                 │                   │  └────────────────────────┘   │     │
       │                 │                   │                                │     │
       │                 │                   │  ┌────────────────────────┐   │     │
       │                 │                   │  │  writing-buddy.db      │   │     │
       │                 │                   │  │  (Docker volume)       │   │     │
       │                 │                   │  └────────────────────────┘   │     │
       │                 │                   └────────────────────────────────┘     │
       └─────────────────┼──────────────────────────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   NAS   │
                    │ port fwd│
                    │ :5055   │
                    └────┬────┘
                         │
                    ┌────▼────────┐
                    │ Cloudflare  │
                    │ Tunnel      │
                    │ → public    │
                    └─────────────┘
```

## Tech Stack

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js_22-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)

</div>

Session auth via OIDC with PKCE (hub-based). AI coaching with DashScope (Qwen) and Claude. Styling with Tailwind v4 + Manga Burst neubrutalist design system. Deployed via Docker Compose behind Cloudflare Tunnel.

### Frontend

| Concern | Choice | Notes |
|----------|--------|-------|
| Framework | React 19 | Latest stable, function components + hooks |
| Build tool | Vite 7 | HMR dev server, production bundling |
| Styling | Tailwind CSS v4 | Utility-first, custom design tokens |
| Routing | React Router 7 | Client-side routing, protected routes |
| HTTP client | `fetch` (native) | Via AuthContext for authenticated requests |
| Auth state | React Context | `AuthContext` with session polling |
| Icons | Lucide React | 24px, stroke-width 2 |
| Fonts | Bangers + Comic Neue | Google Fonts CDN |

### Backend

| Concern | Choice | Notes |
|----------|--------|-------|
| Framework | Express 4 | Node.js HTTP server |
| Database | better-sqlite3 (WAL) | Embedded, zero-config, single-file |
| Migrations | Custom migrator | Versioned, ordered migration files |
| Validation | Zod | Request body, env, config schemas |
| Auth SDK | `@danwangdev/auth-client` | Hub OIDC with PKCE, session-based |
| Security | helmet, cors, rate-limit | Standard Express security headers |
| LLM SDK | Fetch-based | OpenAI-compatible API for DashScope + Anthropic SDK |
| Logging | Custom logger | Structured JSON logs via `logger` service |

### DevOps

| Concern | Choice | Notes |
|----------|--------|-------|
| Containerization | Docker (2 images) | Backend + Frontend via docker-compose |
| Edge entry point | Cloudflare Tunnel | Public HTTPS → NAS port forward |
| Static serving | Nginx (frontend container) | SPA fallback, static asset cache |
| API proxy | Nginx `/api` → backend:5050 | Internal Docker network proxy |
| Persistence | Docker volume (`db-data`) | SQLite database file |
| Networking | `11plus-hub_default` bridge | Shared auth network with Hub |
| CI | GitHub Actions | Build, typecheck, lint, test |
| Deploy | `deploy.sh` | `docker compose up -d --build` one-shot |

## Project Structure

```
writing-buddy/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   ├── backend/         # Express API (port 5050)
│   └── frontend/        # React SPA (port 5179 dev, 5055 prod)
├── .github/workflows/   # CI pipeline
├── docker-compose.yml   # Production deployment
├── deploy.sh            # One-command redeploy
└── DESIGN.md            # Full design system (Manga Burst neubrutalism)
```

## Getting Started

### Prerequisites

- Node.js >= 22
- npm >= 10

### Setup

```bash
git clone https://github.com/DanWangDev/writing-buddy.git
cd writing-buddy
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Auth (Hub OIDC)
OIDC_ISSUER=http://localhost:3009
OIDC_INTERNAL_ISSUER=http://hub-app:3009
OIDC_REDIRECT_URI=http://localhost:5055/api/auth/callback
SESSION_SECRET=your-secret-here

# LLM API keys
DASHSCOPE_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# CORS
CORS_ORIGIN=http://localhost:5055
CORS_EXTRA_ORIGINS=http://localhost:5179

# VITE
VITE_API_URL=/api
VITE_HUB_URL=http://localhost:3009
```

### Development

```bash
npm run dev:backend      # Start backend with hot reload (port 5050)
npm run dev:frontend     # Start frontend with Vite dev server (port 5179)
```

### Testing

```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage (target: 80%+)
```

### Building

```bash
npm run build            # Build all packages
npm run typecheck        # Type-check all packages
npm run lint             # ESLint frontend
```

## Production Deploy

```bash
./deploy.sh              # Docker Compose redeploy
```

The stack runs as two containers on Docker Compose:
- **Backend** — Express API on port 5050, SQLite data persisted via Docker volume
- **Frontend** — Nginx serving the React SPA and proxying `/api` to backend (port 5055)

Both containers join the `11plus-hub_default` bridge for auth integration with the Hub. External traffic arrives via Cloudflare Tunnel → NAS port forward → frontend container.

## Design

Writing Buddy uses a **Manga Burst neubrutalist** design system — bold comic-book aesthetic with thick ink outlines, hard offset shadows, vivid flat colors, and halftone textures. Bangers (display) and Comic Neue (body) fonts. Full system documented in [DESIGN.md](DESIGN.md).

## License

MIT
