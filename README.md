# Brisk

> AI-powered project management platform. Turn a project brief into a structured plan, track tasks, run and transcribe meetings, and keep GitHub issues in sync with Asana.

Internal name: **PineQuest** · Repo: `pinequest-s4-e1-team-8`

---

## Features

- **AI project breakdown** — the Brisk agent (LangGraph multi-agent) takes a project brief and generates a validated breakdown of projects and tasks, then persists them.
- **AI analytics** — risk detection, weekly summaries, and an "ask" endpoint over your workspace data.
- **Tasks & workspaces** — workspaces, projects, sub-teams, and tasks with status/priority tracking.
- **Meetings & transcription** — LiveKit video rooms with automated recording (R2) and Mongolian speech-to-text via Chimege.
- **GitHub → Asana sync** — webhook-driven: a GitHub issue opened/edited/closed is mirrored as an Asana task.
- **Authentication** — Clerk, with webhook-based user sync (svix).

---

## Tech Stack

| | Backend (`/server`) | Frontend (`/client`) |
|---|---|---|
| Runtime | Cloudflare Workers | Next.js 16 (App Router) |
| Framework | Hono 4 | React 19 |
| AI | LangChain + LangGraph + Google Gemini | — |
| Data | Drizzle ORM + Cloudflare D1 (SQLite) | Axios → server API |
| Auth | Clerk (`@clerk/backend`, svix webhooks) | Clerk (`@clerk/nextjs`) |
| Media | LiveKit + Chimege STT + R2 | LiveKit client |
| Styling | — | Tailwind CSS 4 + shadcn/ui |
| Tooling | Wrangler, Drizzle Kit | ESLint, TypeScript |

Package manager is **Bun** across the repo.

---

## Monorepo Structure (Bun Workspaces)

Two workspaces — `client` and `server` — under a single Bun workspace root (one `bun.lock`). No `packages/*` split; shared code stays inside each workspace until duplication justifies extraction.

```
pinequest-s4-e1-team-8/
├── package.json          # root — workspaces: ["client", "server"]
├── client/               # Next.js (App Router) frontend
│   ├── app/              # analytics, dashboard, tasks, workflow, meeting, onboarding
│   ├── components/       # ui (shadcn), sidebar, dashboard, tasks, workflow ...
│   ├── hooks/            # useBriskAgent, use-github-user-id ...
│   └── lib/              # api, integrations, dashboard, utils
└── server/               # Cloudflare Worker — API + AI agent
    ├── src/
    │   ├── index.ts      # Hono app entry — CORS + route mounts
    │   ├── routes/       # one folder per route group
    │   ├── controllers/  # request handlers
    │   ├── services/     # github, asana, sync
    │   ├── agent/        # LangGraph agent (graph, state, nodes)
    │   ├── schema/       # Drizzle table models + relations
    │   └── lib/          # bindings types, db helpers
    ├── drizzle/          # SQL migrations + schema
    └── wrangler.jsonc
```

---

## Architecture

```
Browser (Next.js)
      │  REST / JSON  (CORS: FRONTEND_URL)
      ▼
Cloudflare Worker — Hono router
      ├── /users, /tasks, /analytics        → Drizzle → D1 (SQLite)
      ├── /integrations/github              → GitHub REST
      ├── /api/mappings                     → GitHub↔Asana mapping store
      ├── /api/meeting-room                 → LiveKit Server SDK
      ├── /api/meeting-transcription        → LiveKit Egress → R2 → Chimege STT → D1
      ├── /api/webhooks                     → GitHub (HMAC) + Clerk (svix)
      └── /api/agent, /api/run-agent        → LangGraph agent → D1
```

### Route map (`server/src/index.ts`)

| Mount | Purpose |
|---|---|
| `/users` | User CRUD + Clerk sync |
| `/tasks` | Task CRUD |
| `/analytics` | AI analytics: risks, summary, weekly, ask |
| `/integrations/github` | GitHub integration (repos, issues) |
| `/api/mappings` | GitHub repo → Asana project mappings |
| `/api/meeting-room` | Create / join LiveKit rooms |
| `/api/meeting-transcription` | Start egress, LiveKit webhook, transcript, summary |
| `/api/webhooks` | `github-webhook`, `clerk-webhook` |
| `/api/agent` · `/api/run-agent` | Run the Brisk AI agent |

### Brisk AI agent (`server/src/agent/`)

A LangGraph graph with a **supervisor** node routing to specialized workers:

- **Workers** — onboarding, metrics, risk
- **Breakdown pipeline** — `validate-input` → `generate-breakdown` → `validate-breakdown`
- **Persistence** — `verify-project` → `persist-project` → `persist-tasks` → `log-execution`

State and types live in `brisk.state.ts` / `brisk.types.ts`; the graph is assembled in `briskGraph.ts`.

---

## Workflow Page — Beta

> Location: `client/app/workflow/page.tsx`, `client/components/workflow/`

The Workflow page is a GitHub pull-request / issue cockpit inside Brisk: connect via OAuth or a Personal Access Token, browse PRs and issues, inspect diffs / commits / checks, comment, review, edit, merge, and generate PR titles/bodies with AI. The happy path works, but this page is **beta** — it is not yet production-ready and carries real bugs and gaps.

### Known bugs

- ~~**Detail panels re-fetch in a loop.**~~ **Fixed** — the detail effects are now keyed on the PR/issue *number* instead of the object reference, so loading the full detail no longer re-triggers the fetch. (`workflow-content.tsx`)
- **Detail goes stale after merge/close.** `refreshAfterAction` reloads PRs using the *current* filter (default `open`); a just-merged PR drops out of that list, so `newPulls.find(...)` misses it and the open detail panel keeps showing the pre-merge state.
- **Silent failures on comment / review / issue edit.** The child handlers `await` the API call with `try/finally` but no `catch`; a rejected request surfaces nothing to the user (no error banner, text stays in the box).
- **PAT connect mislabels the auth mode** as `"oauth"`, so the "Test token" badge never shows for token-based sessions.
- **No pagination anywhere** — feeds, changed files, commits, and comments render only the first API page; large repos / PRs are silently truncated.
- **`formatRelativeTime` caps at days** — a year-old PR reads "400d ago".

### Missing features

- Issues have **no open/closed filter** (only PRs do) and load in their default state — closed issues are unreachable.
- No search across PRs/issues; PR filtering is limited to open/closed/all.
- No assignees, reviewers, or milestones; PR editing is title + body only (labels are editable on issues only).
- No inline (line-level) review comments — the conversation is top-level only.
- Diff viewer is raw patch text: no syntax highlighting, side-by-side view, or file tree.
- No real-time updates; the view only refreshes after you act, via a full refetch.
- No client-side guard against selecting the same head and base branch when creating a PR.
- The "Recently Created" list is in-memory only and is lost on reload.

> **Conclusion:** the Workflow page is a solid demo-quality foundation with the right structure (clean component split, request-cancellation guards via `detailRequestRef`), but still needs error surfacing in child components, pagination, and the missing issue/label/reviewer controls before it can leave beta.

---

## Quick Start

Prerequisites: [Bun](https://bun.sh) ≥ 1.0, a Cloudflare account (D1 + R2), and a LiveKit + Chimege + Clerk setup.

```bash
# Install (per workspace)
cd server && bun install
cd ../client && bun install

# Set up the local database
cd server
bun run db:setup:local        # migrate + seed local D1

# Run — two terminals
cd server && bun run dev       # Worker  → http://localhost:8788
cd client && bun run dev       # Next.js → http://localhost:3000
```

Environment variables (Clerk, LiveKit, Chimege, R2, GitHub webhook secret, Asana, Gemini) are documented in **[PROJECT.md](./PROJECT.md)**.

---

## Documentation

**[PROJECT.md](./PROJECT.md)** is the deep technical reference: full database schema, API request/response shapes, services, environment variables, migrations, deployment, and feature walkthroughs.

> Note: PROJECT.md predates the AI agent and analytics work and is being brought up to date.

---

## Scripts

**Server** (`cd server`)
```bash
bun run dev                 # wrangler dev (port 8788)
bun run deploy              # wrangler deploy --minify
bun run db:generate         # generate migration from schema changes
bun run db:migrate:local    # apply migrations to local D1
bun run db:migrate:remote   # apply migrations to remote D1
bun run db:setup:local      # migrate:local + seed:local
bun run cf-typegen          # regenerate CF Worker binding types
```

**Client** (`cd client`)
```bash
bun run dev        # Next.js dev server (port 3000)
bun run build      # production build
bun run start      # serve production build
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit
```
