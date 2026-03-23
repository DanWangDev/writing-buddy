# Writing Buddy — AI-Powered 11+ Creative Writing Coach

## Project Overview

An AI coaching app that helps 10-11 year olds prepare for 11+ creative writing exams. The core differentiator: iterative, voice-preserving coaching passes that guide students to improve their OWN work, not AI rewrites.

Second app in the 11+ prep suite alongside vocab-master. Shares auth infrastructure and is subscription-ready.

## Tech Stack

- **Runtime:** Node.js 22, TypeScript
- **Backend:** Express, better-sqlite3 (WAL mode), JWT auth
- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router
- **Testing:** Vitest, supertest (backend), @testing-library/react (frontend)
- **CI/CD:** GitHub Actions
- **Deploy:** Docker Compose

## Project Structure

```
writting-buddy/
├── packages/
│   ├── shared/          # Shared TypeScript types
│   ├── backend/         # Express API (port 5050)
│   └── frontend/        # React SPA (port 5173 dev, 3000 prod)
├── .github/workflows/   # CI pipeline
├── docker-compose.yml   # Production deployment
└── deploy.sh            # One-command redeploy
```

## Commands

```bash
# Development
npm run dev:backend      # Start backend with hot reload
npm run dev:frontend     # Start frontend with Vite dev server

# Testing
npm test                 # Run all tests
npm run test:coverage    # Run with coverage

# Building
npm run build            # Build all packages

# Type checking
npm run typecheck        # Check all packages

# Linting
npm run lint             # ESLint frontend

# Deploy
./deploy.sh              # Docker compose redeploy
```

## Architecture Decisions

- **Route prefix:** All backend routes under `/api/writing/...` (ready for single-process merge with vocab-master)
- **LLM provider:** Interface-based (`LLMProvider`) with DashScope adapter (Alibaba Cloud Model Studio, Qwen models). OpenAI-compatible API.
- **Content safety:** Dedicated service, not inline. Input screening + output filtering.
- **Revision summaries:** Hybrid — coaching pass feedback + diff-match-patch (no extra LLM calls)
- **Rubric scoring:** Separate LLM call after Pass 4 (coaching and grading are different tones)
- **Spend tracking:** DB-based per-request query (no in-memory counters that drift on restart)
- **Auth:** Standalone JWT in Phase 1a. Shared-auth extraction in Phase 1b.

## Testing

- **Framework:** Vitest for both backend and frontend
- **Coverage target:** 80%+
- **Backend tests:** supertest for HTTP, unit tests for services
- **Frontend tests:** @testing-library/react + jsdom
- **LLM eval suite:** ~10 real API test cases (run in CI with test budget)

When writing new code:
- Write tests first (TDD preferred)
- When fixing a bug, write a regression test
- When adding a conditional, test both paths
- Never commit code that breaks existing tests

## Coding Conventions

- Immutability: create new objects, never mutate
- Small files: 200-400 lines typical, 800 max
- Validate input with Zod at API boundaries
- Handle errors explicitly with try/catch
- No console.log — use the logger service
- Repository pattern for all database access
