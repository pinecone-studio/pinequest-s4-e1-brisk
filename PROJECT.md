# PineQuest — Project Documentation

> Full-stack project management platform with meeting transcription and GitHub–Asana sync.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Services & Business Logic](#7-services--business-logic)
8. [Environment Variables](#8-environment-variables)
9. [Local Development Setup](#9-local-development-setup)
10. [Database Migrations](#10-database-migrations)
11. [Deployment](#11-deployment)
12. [Feature Walkthroughs](#12-feature-walkthroughs)

---

## 1. Project Overview

PineQuest is a workspace collaboration platform that provides:

- **Workspace & project management** — workspaces, projects, sub-teams, and tasks with status/priority tracking
- **AI conversations** — per-workspace AI chat with message history
- **Meeting rooms** — LiveKit-powered video rooms with automated recording
- **Meeting transcription** — audio-to-text via Chimege STT, with summary storage
- **GitHub → Asana sync** — webhook-driven issue sync; when a GitHub issue is opened/edited/closed, it is automatically mirrored as an Asana task
- **Authentication** — Clerk-based user authentication

---

## 2. Tech Stack

### Backend (`/server`)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Cloudflare Workers | — |
| Web framework | Hono | 4.12.12 |
| ORM | Drizzle ORM | 0.45.2 |
| Database | SQLite via Cloudflare D1 | — |
| Package manager | Bun | latest |
| Language | TypeScript | 5.x |
| Deploy tool | Wrangler | 4.4.0 |

### Frontend (`/client`)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.3 |
| UI library | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui (base-nova) | 4.10.0 |
| Icons | Lucide React | 1.17.0 |
| HTTP client | Axios | 1.15.0 |
| Authentication | Clerk | 7.4.3 |
| Theme | next-themes | 0.4.6 |
| Package manager | Bun | latest |
| Language | TypeScript | 5.x |

### External Services

| Service | Purpose |
|---|---|
| Cloudflare D1 | Hosted SQLite database |
| Cloudflare R2 | Object storage for meeting recordings |
| LiveKit | Real-time video rooms and egress (recording) |
| Chimege | Mongolian speech-to-text transcription |
| GitHub Webhooks | Issue event source for Asana sync |
| Asana API | Task creation target for GitHub sync |
| Clerk | User authentication and management |

---

## 3. Repository Structure

```
pinequest-s4-e1-team-8/
├── client/                         # Next.js frontend
│   ├── app/
│   │   ├── lib/api.ts              # Axios client/server instances
│   │   ├── layout.tsx              # Root layout (Clerk + theme)
│   │   ├── page.tsx                # Home → redirect to onboarding
│   │   ├── dashboard/page.tsx
│   │   ├── onboarding/page.tsx
│   │   └── tasks/page.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn base components
│   │   ├── sidebar/                # App-wide sidebar
│   │   ├── dashboard/              # Dashboard widgets, calendar, toolbar
│   │   ├── tasks/                  # Task list rendering
│   │   ├── onboarding/             # Multi-step onboarding wizard
│   │   ├── app-shell.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   └── dashboard/data.ts
│   ├── next.config.ts
│   ├── components.json             # shadcn config
│   └── package.json
│
└── server/                         # Cloudflare Worker backend
    ├── src/
    │   ├── index.ts                # Hono app entry — CORS + route mount
    │   ├── controllers/
    │   │   ├── users/              # get-users, post-user
    │   │   ├── meetingRoom/        # post-create-room, post-join-room
    │   │   ├── meetingTranscription/  # egress, webhook, transcript, summary
    │   │   ├── mappings/           # get-mappings, post-mapping
    │   │   └── webhooks/           # github-webhook
    │   ├── routes/
    │   │   ├── users/user.routes.ts
    │   │   ├── meetingRoom/meeting-room.routes.ts
    │   │   ├── meetingTranscription/meeting-transcription.routes.ts
    │   │   ├── mappings/mappings.routes.ts
    │   │   └── webhooks/webhook.routes.ts
    │   ├── services/
    │   │   ├── github.ts           # GitHub REST API client + type defs
    │   │   ├── asana.ts            # Asana REST API client + type defs
    │   │   └── sync.ts             # Orchestrates GitHub issue → Asana task
    │   ├── schema/                 # Drizzle table models + relations
    │   │   ├── schema.ts           # Barrel export for all models
    │   │   ├── user.model.ts
    │   │   ├── workspace.model.ts
    │   │   ├── member.model.ts
    │   │   ├── project.model.ts
    │   │   ├── task.model.ts
    │   │   ├── sub-team.model.ts
    │   │   ├── ai.model.ts
    │   │   └── meetingTranscription/meeting-transcription.schema.ts
    │   ├── db/
    │   │   └── schema.ts           # users (with token cols) + sync_mappings
    │   └── lib/
    │       ├── common/types.ts     # Bindings interface (CF Worker env)
    │       └── db/db.ts            # getDrizzleDb / useDB helpers
    ├── drizzle/                    # SQL migration files (0000–0004)
    ├── drizzle.config.ts
    ├── wrangler.jsonc
    └── package.json
```

---

## 4. Architecture

```
Browser (Next.js)
      │  REST / JSON  (CORS: FRONTEND_URL)
      ▼
Cloudflare Worker  ──  Hono router
      │
      ├── /users              → Drizzle → D1 (SQLite)
      ├── /api/meeting-room   → LiveKit Server SDK
      ├── /api/meeting-transcription
      │       ├── startEgress        → LiveKit Egress API → R2
      │       ├── livekit-webhook    → Chimege STT → D1
      │       └── summary/transcript → D1
      ├── /api/mappings       → Drizzle → D1
      └── /api/webhooks/github
              └── verifySignature (HMAC-SHA256)
                      └── syncIssueToAsana
                              ├── D1 sync_mappings lookup
                              └── Asana REST API  (createTask)

GitHub  ──── POST /api/webhooks/github  (X-Hub-Signature-256)
```

### Request lifecycle (GitHub → Asana sync)

1. GitHub fires a `POST /api/webhooks/github` with `X-GitHub-Event: issues`
2. Worker reads raw body, verifies `X-Hub-Signature-256` via `crypto.subtle.verify` (HMAC-SHA256, timing-safe)
3. If event action is `opened | edited | closed | reopened`:
   - Query `sync_mappings` in D1 where `github_repo_id = repository.id`
   - Load the joined `users` row to get `encrypted_asana_token`
   - Call `mapGithubIssueToAsanaTask()` to build the Asana payload
   - `POST /tasks` to Asana API
4. Return `{ synced: true }` or `{ received: true }` for unhandled events

---

## 5. Database Schema

All tables live in a **Cloudflare D1 SQLite** database. Timestamps are stored as Unix epoch integers.

### `users`
Stores app users synced from Clerk, plus optional encrypted API tokens.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | App-level user ID |
| `clerk_id` | TEXT UNIQUE | Clerk auth ID |
| `email` | TEXT UNIQUE | — |
| `name` | TEXT | — |
| `avatar_url` | TEXT | Nullable |
| `encrypted_github_token` | TEXT | Nullable — store encrypted before saving |
| `encrypted_asana_token` | TEXT | Nullable — store encrypted before saving |
| `created_at` | INTEGER | Timestamp |
| `updated_at` | INTEGER | Timestamp, auto-updated |

### `sync_mappings`
Links a GitHub repo to an Asana project for a given user.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `user_id` | TEXT FK → users | CASCADE delete |
| `github_repo_id` | TEXT | GitHub numeric repo ID as string |
| `asana_project_gid` | TEXT | Asana project GID |
| `created_at` | INTEGER | — |
| `updated_at` | INTEGER | — |

### `workspaces`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `name` | TEXT | — |
| `slug` | TEXT UNIQUE | URL-friendly identifier |
| `created_at` | INTEGER | — |
| `updated_at` | INTEGER | — |

### `members`
Junction: user ↔ workspace with a role.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `user_id` | TEXT FK → users | CASCADE |
| `workspace_id` | TEXT FK → workspaces | CASCADE |
| `role` | TEXT ENUM | `OWNER` \| `ADMIN` \| `MEMBER` (default) |
| `created_at` / `updated_at` | INTEGER | — |

### `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `workspace_id` | TEXT FK → workspaces | CASCADE |
| `name` | TEXT | — |
| `description` | TEXT | Nullable |
| `created_at` / `updated_at` | INTEGER | — |

### `sub_teams`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `project_id` | TEXT FK → projects | CASCADE |
| `name` | TEXT | — |
| `created_at` / `updated_at` | INTEGER | — |

### `sub_team_members`
Junction: user ↔ sub_team.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `sub_team_id` | TEXT FK → sub_teams | CASCADE |
| `user_id` | TEXT FK → users | CASCADE |
| `created_at` | INTEGER | — |

### `tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `workspace_id` | TEXT FK → workspaces | CASCADE |
| `project_id` | TEXT FK → projects | CASCADE |
| `sub_team_id` | TEXT FK → sub_teams | SET NULL |
| `assignee_id` | TEXT FK → users | SET NULL |
| `parent_id` | TEXT | Self-ref for subtasks, nullable |
| `title` | TEXT | — |
| `description` | TEXT | Nullable |
| `status` | TEXT ENUM | `BACKLOG`(default) \| `TODO` \| `IN_PROGRESS` \| `DONE` |
| `priority` | TEXT ENUM | `LOW` \| `MEDIUM`(default) \| `HIGH` \| `URGENT` |
| `created_at` / `updated_at` | INTEGER | — |

### `ai_conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `workspace_id` | TEXT FK → workspaces | CASCADE |
| `user_id` | TEXT FK → users | CASCADE |
| `title` | TEXT | Nullable |
| `created_at` / `updated_at` | INTEGER | — |

### `ai_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `conversation_id` | TEXT FK → ai_conversations | CASCADE |
| `sender` | TEXT ENUM | `USER` \| `AI` \| `SYSTEM` |
| `content` | TEXT | — |
| `created_at` | INTEGER | — |

### `meeting_transcriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | — |
| `meeting_id` | TEXT | External meeting identifier |
| `room_name` | TEXT | LiveKit room name |
| `audio_url` | TEXT | Nullable — R2 recording URL |
| `egress_id` | TEXT | Nullable — LiveKit egress ID |
| `transcript` | TEXT | Nullable — Chimege output |
| `summary` | TEXT | Nullable — generated summary |
| `error_message` | TEXT | Nullable |
| `status` | TEXT ENUM | `pending` \| `processing` \| `done` \| `failed` |
| `created_at` / `updated_at` | INTEGER | — |
| `completed_at` | INTEGER | Nullable |

---

## 6. API Reference

Base URL (local): `http://localhost:8787`

CORS is enabled on all `/api/*` routes for the origin configured in `FRONTEND_URL`.

---

### Users

#### `GET /users`
Returns all users.

**Response `200`**
```json
{ "users": [{ "id": "...", "clerkId": "...", "name": "...", "email": "..." }] }
```

#### `POST /users`
Create a new user (called after Clerk sign-up).

**Body**
```json
{
  "id": "usr_abc",
  "clerkId": "user_clerk123",
  "name": "Bat-Erdene",
  "email": "bat@example.com",
  "avatarUrl": "https://..."
}
```

**Response `201`**
```json
{ "new_user": { "id": "...", "clerkId": "...", "name": "...", "email": "..." } }
```

---

### Meeting Room

#### `POST /api/meeting-room/create`
Creates a LiveKit room and returns a host access token.

**Body**
```json
{ "roomName": "standup-2024", "hostName": "Bat-Erdene" }
```

**Response `200`**
```json
{ "token": "<livekit-jwt>", "roomName": "standup-2024" }
```

#### `POST /api/meeting-room/join`
Generates a participant token to join an existing room.

**Body**
```json
{ "roomName": "standup-2024", "participantName": "Oyuntuya" }
```

**Response `200`**
```json
{ "token": "<livekit-jwt>" }
```

---

### Meeting Transcription

#### `POST /api/meeting-transcription/start-egress`
Starts recording a LiveKit room to Cloudflare R2. Creates a `meeting_transcriptions` record with `status: processing`.

**Body**
```json
{
  "meetingId": "meeting_xyz",
  "roomName": "standup-2024",
  "filepath": "recordings/standup-2024.mp4"
}
```

**Response `200`**
```json
{ "transcriptionId": "...", "egressId": "...", "status": "processing" }
```

#### `POST /api/meeting-transcription/livekit-webhook`
LiveKit calls this when egress (recording) finishes. Triggers Chimege transcription automatically.

> Configure this URL in your LiveKit dashboard as a webhook endpoint.

#### `POST /api/meeting-transcription/summary`
Manually submit a recording URL for transcription and summary storage.

**Body**
```json
{
  "meetingId": "meeting_xyz",
  "roomName": "standup-2024",
  "recordingUrl": "https://r2.example.com/recordings/standup-2024.mp4"
}
```

#### `GET /api/meeting-transcription/:id`
Fetch a transcription record by its ID.

**Response `200`**
```json
{
  "transcription": {
    "id": "...",
    "status": "done",
    "transcript": "Өнөөдрийн уулзалтаас...",
    "summary": "..."
  }
}
```

---

### GitHub–Asana Sync Mappings

#### `GET /api/mappings`
List all GitHub→Asana sync mappings.

**Response `200`**
```json
{
  "mappings": [
    {
      "id": "...",
      "userId": "usr_abc",
      "githubRepoId": "123456789",
      "asanaProjectGid": "1204567890123456",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `POST /api/mappings`
Create a new sync mapping. After this, any GitHub issue event on that repo will be mirrored to the Asana project.

**Body**
```json
{
  "userId": "usr_abc",
  "githubRepoId": "123456789",
  "asanaProjectGid": "1204567890123456"
}
```

**Response `201`**
```json
{ "mapping": { "id": "...", "userId": "...", ... } }
```

---

### GitHub Webhook

#### `POST /api/webhooks/github`
Receives GitHub issue events and syncs them to Asana.

**Required GitHub headers**
```
X-GitHub-Event: issues
X-Hub-Signature-256: sha256=<hmac>
```

**Handled issue actions**: `opened`, `edited`, `closed`, `reopened`

All other event types or actions receive `{ received: true }` with `200` — GitHub will not retry them.

**Response (synced) `200`**
```json
{ "synced": true }
```

**Response (signature invalid) `401`**
```json
{ "error": "Invalid signature" }
```

---

## 7. Services & Business Logic

### `src/services/github.ts`
Pure fetch-based GitHub REST API v3 client.

| Export | Description |
|---|---|
| `getRepositories(token)` | `GET /user/repos` — list repos the user owns or collaborates on |
| `getRepositoryIssues(token, owner, repo, state?)` | `GET /repos/:owner/:repo/issues` |
| `mapGithubIssueToAsanaTask(issue, projectGid)` | Pure mapping function — converts a `GitHubIssue` to an `AsanaTaskPayload` |

**Field mapping** (`mapGithubIssueToAsanaTask`):

| GitHub Issue | Asana Task |
|---|---|
| `title` | `name` |
| `body` + labels + issue URL | `notes` |
| `state === "closed"` | `completed: true` |
| `milestone.due_on` | `due_on` (YYYY-MM-DD) |
| `projectGid` param | `projects: [projectGid]` |

### `src/services/asana.ts`
Pure fetch-based Asana REST API 1.0 client. Automatically unwraps Asana's `{ data: T }` envelope.

| Export | Description |
|---|---|
| `getWorkspaces(token)` | `GET /workspaces` |
| `getProjects(token, workspaceGid)` | `GET /workspaces/:gid/projects` |
| `createTask(token, payload)` | `POST /tasks` |

### `src/services/sync.ts`
Orchestrator called by the webhook handler.

1. Query `sync_mappings` in D1 by `githubRepoId`
2. Load the related `users` row (needs `encrypted_asana_token`)
3. Call `mapGithubIssueToAsanaTask()` → `createTask()`

> **Note:** The token is read directly from D1. In production, decrypt it first using a `ENCRYPTION_KEY` Worker secret before passing to the Asana API.

---

## 8. Environment Variables

### Server (`/server`)

Set these as **Cloudflare Worker secrets** (`wrangler secret put <KEY>`) or in `wrangler.jsonc` under `vars` for non-sensitive values.

| Variable | Required | Description |
|---|---|---|
| `DB` | ✅ | D1 database binding (set in `wrangler.jsonc`) |
| `LIVEKIT_URL` | ✅ | LiveKit server WebSocket URL (`wss://...`) |
| `LIVEKIT_API_KEY` | ✅ | LiveKit project API key |
| `LIVEKIT_API_SECRET` | ✅ | LiveKit project API secret |
| `CHIMEGE_API_KEY` | ✅ | Chimege speech-to-text API key |
| `CHIMEGE_BASE_URL` | ❌ | Override Chimege base URL (default: `https://api.chimege.com`) |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID for R2 |
| `R2_ACCESS_KEY_ID` | ✅ | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 S3-compatible secret key |
| `R2_BUCKET_NAME` | ✅ | R2 bucket name for recordings |
| `GITHUB_WEBHOOK_SECRET` | ✅ | Secret set when creating the GitHub webhook |
| `FRONTEND_URL` | ❌ | CORS origin (default: `http://localhost:3000`) |

**For Drizzle migrations only** — add to `server/.env.local`:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_d1_api_token
```

### Client (`/client`)

Add to `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## 9. Local Development Setup

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — included as a dev dependency
- A Cloudflare account with D1 and R2 enabled
- LiveKit Cloud project (or self-hosted)
- Chimege API key

### 1. Clone & install

```bash
git clone https://github.com/pinecone-studio/pinequest-s4-e1-team-8.git
cd pinequest-s4-e1-team-8

# Install server dependencies
cd server && bun install

# Install client dependencies
cd ../client && bun install
```

### 2. Configure server environment

```bash
cd server

# Create .env.local for Drizzle migrations
cat > .env.local << EOF
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_d1_api_token
EOF
```

Update `wrangler.jsonc` with your actual LiveKit and other non-secret values.

### 3. Set up the database

```bash
cd server

# Run all migrations on the local D1 instance
bun run db:migrate:local

# Seed initial data
bun run db:seed:local

# Or do both at once
bun run db:setup:local
```

### 4. Start servers

```bash
# Terminal 1 — Backend (Cloudflare Worker via Wrangler)
cd server
bun run dev
# → http://localhost:8787

# Terminal 2 — Frontend (Next.js)
cd client
bun run dev
# → http://localhost:3000
```

### 5. GitHub Webhook (local testing)

Use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose your local Worker:

```bash
ngrok http 8787
```

Then in your GitHub repo → Settings → Webhooks → Add webhook:
- Payload URL: `https://<ngrok-id>.ngrok.io/api/webhooks/github`
- Content type: `application/json`
- Secret: same value as your `GITHUB_WEBHOOK_SECRET`
- Events: `Issues`

---

## 10. Database Migrations

Migrations are managed by **Drizzle Kit** and stored as `.sql` files in `server/drizzle/`.

```bash
cd server

# After changing any schema file, generate a new migration
bun run db:generate
# → creates server/drizzle/XXXX_<name>.sql

# Apply locally
bun run db:migrate:local

# Apply to production (remote D1)
bun run db:migrate:remote
```

Current migrations:

| File | Description |
|---|---|
| `0000_secret_mikhail_rasputin.sql` | Initial schema: users, workspaces, members, projects, sub_teams, tasks, ai_* |
| `0001_abandoned_bishop.sql` | Additional schema updates |
| `0001_flaky_carmella_unuscione.sql` | Additional schema updates |
| `0002_broken_charles_xavier.sql` | Schema refinements |
| `0003_silly_iron_man.sql` | Meeting transcription table |
| `0004_legal_cloak.sql` | `sync_mappings` table + `encrypted_github_token` / `encrypted_asana_token` columns on `users` |

---

## 11. Deployment

### Deploy the Worker

```bash
cd server
bun run deploy
# → wrangler deploy --minify
```

Set all production secrets:
```bash
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put LIVEKIT_API_SECRET
wrangler secret put CHIMEGE_API_KEY
wrangler secret put R2_SECRET_ACCESS_KEY
# etc.
```

Apply migrations to remote D1:
```bash
bun run db:migrate:remote
```

### Deploy the Frontend

The Next.js client can be deployed to **Vercel**, **Cloudflare Pages**, or any Node-compatible host.

```bash
cd client
bun run build
bun run start
```

After deploying, set `FRONTEND_URL` in your Worker to the production frontend URL so CORS allows it.

---

## 12. Feature Walkthroughs

### Onboarding flow

1. User signs up via Clerk
2. Frontend calls `POST /users` to create the database record
3. Multi-step wizard collects workspace name, integrations (GitHub/Asana tokens), AI preferences, and team invites

### Creating a sync mapping

1. User connects their GitHub account (token stored encrypted in `users.encrypted_github_token`)
2. User connects their Asana account (token stored encrypted in `users.encrypted_asana_token`)
3. Frontend fetches available repos via the GitHub service and Asana projects via the Asana service
4. User picks one repo + one Asana project → `POST /api/mappings`
5. GitHub webhook is configured on the repo with the Worker's webhook URL

### GitHub issue → Asana task (automatic)

```
GitHub Issue opened
  → POST /api/webhooks/github
    → verify HMAC-SHA256 signature
      → look up sync_mapping by repo ID
        → fetch user.encrypted_asana_token
          → mapGithubIssueToAsanaTask()
            → Asana POST /tasks  ✓
```

### Meeting transcription flow

```
Host creates room  →  POST /api/meeting-room/create
Participants join  →  POST /api/meeting-room/join
Host starts recording  →  POST /api/meeting-transcription/start-egress
  → LiveKit Egress API starts recording to R2
Recording finishes  →  LiveKit calls POST /api/meeting-transcription/livekit-webhook
  → Worker fetches audio from R2
  → Chimege STT API transcribes (polling, max 60s)
  → transcript + summary saved to D1
Frontend polls  →  GET /api/meeting-transcription/:id  → status: done
```

---

## Available Scripts (Quick Reference)

### Server
```bash
bun run dev                 # Local dev server (wrangler dev)
bun run deploy              # Deploy to Cloudflare Workers
bun run db:generate         # Generate new migration from schema changes
bun run db:migrate:local    # Apply migrations to local D1
bun run db:migrate:remote   # Apply migrations to production D1
bun run db:seed:local       # Seed local D1 with initial data
bun run db:setup:local      # migrate:local + seed:local
bun run cf-typegen          # Regenerate CF Worker binding types
```

### Client
```bash
bun run dev                 # Next.js dev server (localhost:3000)
bun run build               # Production build
bun run start               # Start production server
bun run lint                # ESLint check
```
