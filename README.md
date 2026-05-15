# Writing Buddy

An AI coaching app that helps 10–11 year olds prepare for 11+ creative writing exams. Unlike AI tools that rewrite for the student, Writing Buddy provides iterative, voice-preserving coaching passes that guide students to improve their own work.

Part of the 11+ prep suite alongside [vocab-master](https://github.com/DanWangDev/vocab-master). Shares auth infrastructure and is subscription-ready.

## How It Works

1. **Pick a prompt** — choose from a library of creative writing prompts, each with genre, time limits, and word count targets
2. **Write** — compose your story on the notebook-styled writing desk with a live stopwatch
3. **Get coached** — the AI runs multiple coaching passes: language improvement, narrative structure, description depth, and polishing
4. **Review changes** — see exactly what changed with word-level revision diffs
5. **Get scored** — receive a rubric-based score with detailed feedback on each dimension

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22, TypeScript |
| Backend | Express, better-sqlite3 (WAL mode) |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Auth | Hub OIDC via `@danwangdev/auth-client` (PKCE, session-based) |
| LLM | Interface-based (`LLMProvider`) with DashScope (Qwen) and Claude (Anthropic) adapters |
| Testing | Vitest, supertest, @testing-library/react |
| CI/CD | GitHub Actions |
| Deploy | Docker Compose |

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

The stack runs as two containers:
- **Backend** — Express API on port 5050, SQLite data persisted via Docker volume
- **Frontend** — Nginx-served React SPA on port 5055, reverse-proxies `/api` to backend

Both containers join the `11plus-hub_default` network for auth integration with the Hub.

## Architecture

- **Route prefix**: Writing routes under `/api/writing/...`, auth routes under `/api/auth/...` — ready for single-process merge with vocab-master
- **LLM provider**: Interface-based with swappable adapters. Currently supports DashScope (Qwen models) and Anthropic (Claude models)
- **Content safety**: Dedicated service with input screening and output filtering — never inline
- **Revision summaries**: Hybrid approach — coaching pass feedback combined with LCS-based word diffs, no extra LLM calls
- **Rubric scoring**: Separate LLM call after the final coaching pass (coaching and grading use different tones)
- **Spend tracking**: Database-based per-request query, no in-memory counters
- **Admin**: Role-gated prompt CRUD UI, accessible via Hub OIDC role claims

## Design

Writing Buddy uses a **Manga Burst neubrutalist** design system — bold comic-book aesthetic with thick ink outlines, hard offset shadows, vivid flat colors, and halftone textures. Bangers (display) and Comic Neue (body) fonts. Full system documented in [DESIGN.md](DESIGN.md).

## License

MIT
