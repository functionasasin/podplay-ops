# Spec: Infrastructure & Deployment

**Synthesized from:** `infra-deploy`

**Purpose:** Implementation-ready specification for Cheerful's infrastructure, deployment topology, environment management, CI/CD pipeline, secret handling, local development setup, and observability. A developer reading this can replicate the full deployment stack from scratch.

---

## Service Topology

### Production

```
┌──────────────────────────────────────────────────────────────────────┐
│ Production                                                            │
│                                                                       │
│  Vercel                                                               │
│  └── Next.js app (SSR + static)                                      │
│      └── NEXT_PUBLIC_BACKEND_URL → https://prd-cheerful.fly.dev      │
│                                                                       │
│  Fly.io: prd-cheerful   (single app, two process groups)             │
│  ├── [web] FastAPI                                                    │
│  │   ├── uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4    │
│  │   ├── VM: shared-cpu-4x / 2048MB RAM                             │
│  │   └── Health: TCP 15s + HTTP GET /health 30s                     │
│  └── [worker] Temporal worker                                        │
│      ├── python -m src.temporal.worker                               │
│      ├── VM: shared-cpu-8x / 8192MB RAM                             │
│      └── Health: HTTP GET / on port 8081 (visibility only)          │
│                                                                       │
│  Fly.io: prd-context-engine   (Slack bot)                            │
│  └── [main] bash start.sh                                            │
│      ├── VM: shared-cpu-2x / 4096MB RAM                             │
│      ├── Socket Mode WebSocket (no inbound HTTP)                     │
│      └── Deploy strategy: immediate (not rolling)                    │
│                                                                       │
│  Supabase Cloud (managed)                                             │
│  ├── PostgreSQL + RLS + Auth                                         │
│  ├── Storage (email bodies, attachments)                             │
│  └── sciyyxrleibrfwmxgegy.supabase.co                                │
│                                                                       │
│  Temporal Cloud (managed)                                             │
│  └── TEMPORAL_SERVER_URL + TEMPORAL_NAMESPACE + TEMPORAL_API_KEY    │
└──────────────────────────────────────────────────────────────────────┘
```

### Staging

```
┌──────────────────────────────────────────────────────────────────────┐
│ Staging                                                               │
│                                                                       │
│  Fly.io: stg-cheerful   (same structure, smaller VMs)                │
│  ├── [web] uvicorn --workers 1 (single worker)                       │
│  │   └── VM: shared-cpu-1x / 1024MB                                 │
│  └── [worker] Temporal worker                                        │
│      └── VM: shared-cpu-2x / 1024MB                                 │
│                                                                       │
│  Supabase, Temporal Cloud, Vercel — separate project references      │
│  (No staging context engine — only one deployment)                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Local Development

```
┌──────────────────────────────────────────────────────────────────────┐
│ Local Development                                                     │
│                                                                       │
│  Next.js dev server        → http://localhost:3000                   │
│  Docker Compose (backend)  → FastAPI http://localhost:5001           │
│  Docker Compose (worker)   → Temporal worker                        │
│  Supabase local            → API http://localhost:54321              │
│                               Studio http://localhost:54323          │
│                               PostgreSQL localhost:54322             │
│  Temporal dev server       → gRPC localhost:7233                    │
│  Temporal UI               → http://localhost:8233                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Fly.io Configuration

### Backend — Production (`apps/backend/fly.prd.toml`)

| Property | Value |
|----------|-------|
| App name | `prd-cheerful` |
| Region | `iad` (US East) |
| Kill signal | `SIGTERM` (5-minute drain timeout) |
| HTTP redirect | HTTP → HTTPS enforced |

**Process groups:**

| Process | Command | VM | RAM |
|---------|---------|-----|-----|
| `web` | `uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4` | shared-cpu-4x | 2048MB |
| `worker` | `python -m src.temporal.worker` | shared-cpu-8x | 8192MB |

Worker gets 4× CPU and 4× RAM vs web because LLM inference calls and Gmail API operations are far more memory-intensive than HTTP request handling.

**Web health checks:**
```yaml
[[services.http_checks]]
  interval = 30
  timeout = 5
  grace_period = 10
  path = "/health"

[[services.tcp_checks]]
  interval = 15
  timeout = 5
  grace_period = 10

[services.concurrency]
  hard_limit = 200
  soft_limit = 150
```

**Worker health (port 8081):**
- HTTP GET `/` every 30 seconds
- **Does NOT trigger auto-restart** — intentional design
- External GitHub Actions heartbeat provides actual alerting

**Release command** (runs before each deploy):
```
python -m scripts.ensure_slack_digest_schedule
```
Ensures the Temporal schedule for Slack digests exists before the new app version goes live.

### Backend — Staging (`apps/backend/fly.stg.toml`)

Same structure as production with smaller VMs:
- `web`: shared-cpu-1x / 1024MB, single uvicorn worker
- `worker`: shared-cpu-2x / 1024MB
- App name: `stg-cheerful`
- Same health check configuration

### Context Engine — Production (`apps/context-engine/fly.prd.toml`)

| Property | Value |
|----------|-------|
| App name | `prd-context-engine` |
| Region | `iad` |
| Process | `main: bash start.sh` |
| VM | shared-cpu-2x / 4096MB |
| Deploy strategy | `immediate` |

**No HTTP services exposed.** Uses Slack Socket Mode (outbound WebSocket), so no inbound port binding is needed. `strategy = 'immediate'` is correct for a single WebSocket process — rolling would create a gap where neither old nor new instance holds the connection.

---

## Docker Images

### Backend (`apps/backend/Dockerfile`)

```dockerfile
FROM python:3.12-slim

# System dependencies
RUN apt-get install gcc g++ curl git
# Node.js 18.x (from NodeSource)
RUN npm install -g @anthropic-ai/claude-code

# Python dependency management
COPY --from=ghcr.io/astral-sh/uv /uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Build arg for git commit tracing
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

# Application code
COPY . .

# Non-root user
RUN useradd -u 1001 appuser
USER appuser
```

**Why Claude Code CLI is installed:**
The backend Temporal worker's `ClaudeAgentService` invokes `claude` as a subprocess (not just the Python SDK). This enables agentic, multi-tool Claude Code sessions within campaign workflow execution — e.g., researching creators, drafting campaign briefs, reasoning over product context.

**Layer caching strategy:** `pyproject.toml` + `uv.lock` are copied and installed before application code, so code-only changes don't invalidate the (large) Python dependency layer.

**GIT_COMMIT baking:** Passed as `--build-arg GIT_COMMIT=$(git rev-parse HEAD)` at deploy time. Exposed via the `/health` endpoint for traceability in production.

### Context Engine (`apps/context-engine/Dockerfile`)

```dockerfile
FROM python:3.12-slim

# System dependencies — includes extras vs backend:
#   ffmpeg, libopus-dev  (audio/voice processing)
#   gh (GitHub CLI)      (for ralph loop and PR triage MCP tools)

COPY --from=ghcr.io/astral-sh/uv /uv

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Claude Code configuration
COPY .claude/ .claude/   # Skills, agents, commands, hooks

# Non-root user (uid 1000)
USER appuser
```

**Extra dependencies vs backend:**
- `ffmpeg` + `libopus-dev`: Audio/voice support (Discord bot or voice processing in context engine)
- `gh` CLI: Required for MCP tools that interact with GitHub (ralph loop management, PR triage, issue creation)
- `.claude/` directory: Claude Code's configuration (CLAUDE.md, skills, custom tools) baked into the image so every Claude Code session started by the context engine inherits the right behavior

---

## Local Development

### Entry Point: `infra/dev/cli.py`

A Typer CLI accessed via `uv run dev [COMMAND]`. This is the **single management interface** for local development — developers never need to remember individual Docker, Supabase, or Temporal commands.

**Command inventory:**

| Command | Effect |
|---------|--------|
| `dev start` | Start full stack: Supabase → DB reset → Temporal → Docker → webapp |
| `dev start --no-webapp` | Backend services only (no Next.js) |
| `dev start --staging` | Webapp only with staging env vars injected |
| `dev start --fresh` | Stop everything, then start fresh |
| `dev down` | Stop all services |
| `dev setup` | First-time setup: install deps, generate `.env` files |
| `dev status` | Rich table with live port health checks |
| `dev webapp setup` | Generate `apps/webapp/.env.local` |
| `dev backend setup` | Generate `apps/backend/.env` from GitHub Variables |
| `dev logs all/backend/worker/temporal/webapp` | Tail service logs |
| `dev supabase <args>` | Thin wrapper: `npx supabase <args>` |
| `dev compose <args>` | Thin wrapper: `docker compose <args>` from `infra/dev/` |

### Startup Order (Critical — do not reorder)

1. **Supabase** (`npx supabase start`)
   - Ports: 54321 (API), 54322 (PostgreSQL), 54323 (Studio)
   - Excludes unnecessary services: `realtime`, `edge-runtime`, `logflare`, `vector`
   - After start: `npx supabase db reset --local` — runs all migrations + seed data

2. **2-second stabilization sleep**

3. **Temporal** (`temporal server start-dev --ip 0.0.0.0`)
   - Ports: 7233 (gRPC), 8233 (UI)
   - After start: creates custom search attributes:
     - `UserEmail`, `GoogleAccountEmail`, `GmailThreadId`, `GmailThreadStateId`, `GoogleAccountEmailList`

4. **Docker Compose** (`infra/dev/docker-compose.yml`)
   - `web`: FastAPI on port 5001, hot-reload via volume mount `../../apps/backend:/app`
   - `temporal-worker`: Same image, different CMD, same volume mount
   - Docker overrides: `DATABASE_URL`, `SUPABASE_URL`, `TEMPORAL_SERVER_URL` use `host.docker.internal`

5. **Webapp** (`npm run dev`)
   - Port 3000
   - Runs in background with PID tracking for later `dev down`

### Health Status Table

`dev status` checks TCP connectivity on each port:

| Service | Port | URL |
|---------|------|-----|
| Webapp | 3000 | http://localhost:3000 |
| FastAPI | 5001 | http://localhost:5001 |
| Supabase API | 54321 | http://localhost:54321 |
| Supabase Studio | 54323 | http://localhost:54323 |
| PostgreSQL | 54322 | localhost:54322 |
| Temporal UI | 8233 | http://localhost:8233 |
| Temporal gRPC | 7233 | localhost:7233 |

### Environment File Generation

**Backend** (`dev backend setup`):
1. Introspects `src/core/config/definition.py` via `importlib.util` — bypasses `__init__.py` to avoid `Settings` instantiation errors before `.env` exists
2. For each `Settings.model_fields`: fetches from GitHub `development` environment via `gh variable get`
3. Falls back to Pydantic defaults; warns for missing required fields

**Webapp** (`dev webapp setup`):
Generates `apps/webapp/.env.local` with hardcoded local values:
- Local Supabase URLs + well-known demo JWT tokens
- Backend URL: `http://localhost:5001`
- Hardcoded encryption key/IV for local use only
- Google OAuth, Shopify, OpenAI: must be filled manually

**Staging passthrough mode** (`dev start --staging`):
Injects staging env vars into the webapp process, overriding `.env.local`. Displays a warning banner: "You are connecting to STAGING data!" Useful for testing UI changes against real data without deploying.

### Prerequisites

`dev setup` validates: Node.js, npm, Docker, uv, Temporal CLI.

---

## CI/CD Pipeline

### Branch Strategy

```
main ──────────────────── Production deploys
  ↑
  └── cherry-pick (prd-cp label) ──── Fast-track urgent staging changes

staging ───────────────── Staging deploys + test runs
  ↑
feature/* ─────────────── PRs → staging

ralph-loops ────────────── Dedicated branch for loop state (never merged to staging)
```

All development targets `staging`. Production (`main`) only receives changes via:
1. **Normal flow**: Manual push/merge to main → triggers production deploy
2. **Cherry-pick**: Add `prd-cp` label to a merged staging PR → automated cherry-pick to main

### Workflow: `deploy-backend.yml`

**Triggers:**
- Push to `staging` or `main` when `apps/backend/**` or `supabase/migrations/**` changes
- `workflow_dispatch` with explicit environment choice

**Concurrency:** `cancel-in-progress: false` — deploys queue, never cancel in-flight

**Step sequence:**
```
1. Checkout
2. Supabase CLI → supabase link --project-ref $SUPABASE_PROJECT_REF
3. supabase db push --include-all   ← MIGRATIONS BEFORE APP DEPLOY
4. Fly.io CLI setup
5. ./infra/scripts/sync-secrets-to-fly.sh   ← SECRET SYNC
6. flyctl deploy ./apps/backend \
     --config fly.{prd|stg}.toml \
     --build-arg GIT_COMMIT=$SHA \
     --remote-only
7. flyctl status + flyctl releases | head -5   ← VERIFY
8. Slack notification → #rollbar-cheerful-ai
```

**Environment selection:**
```bash
CONFIG_FILE="apps/backend/fly.${{ github.ref == 'refs/heads/main' && 'prd' || 'stg' }}.toml"
```

**GitHub Environment:** `staging` or `production` — scopes secrets/variables to the correct environment.

### Workflow: `deploy-context-engine.yml`

**Trigger:** Push to `staging` when `apps/context-engine/**` changes; `workflow_dispatch`.

**Notable:** Always deploys to `production:context-engine` environment, even when triggered from `staging` branch. There is only one context engine deployment — no staging equivalent.

Steps: Fly.io CLI → sync secrets → `flyctl deploy . --config fly.prd.toml --remote-only`

Context engine secrets differ from backend (includes: `SLACK_APP_TOKEN`, `ONYX_API_KEY`, `CLARIFY_*`, `GH_TOKEN`, `FLY_ORG_SLUG`, `CHEERFUL_API_URL`).

### Workflow: `test.yml`

**Trigger:** PR opened/synchronized/reopened against `main` or `staging`.

**Steps:**
```
1. Python 3.12 + uv + Node.js 20
2. npx supabase start (excludes realtime, edge-runtime, logflare, vector, postgrest)
3. npx supabase db reset --local
4. Extract URLs/keys from supabase status --output json
5. uv sync (apps/backend)
6. uv run pytest -v -m "not integration"
```

**Test environment:** Real Anthropic/OpenAI/Langfuse keys (from GitHub secrets), dummy Google OAuth, static encryption keys. `USE_MOCK_WORKFLOW_TOOLS=true` to mock Temporal workflow triggers — integration tests don't require a running Temporal server.

### Workflow: `worker-heartbeat.yml`

**Trigger:** Cron `*/15 * * * *` (every 15 minutes) + `workflow_dispatch`.

**Two checks:**

| Check | Method | Alert Condition |
|-------|--------|----------------|
| Machine state | Fly Machines API | worker VM state ≠ `started` |
| Ingestion freshness | `SELECT count(*) FROM gmail_message WHERE created_at > now() - interval '30 minutes'` | count < 1 → `INGESTION_STALE` |

**Alert destination:** Slack `#rollbar-cheerful-ai` with machine state details + Fly.io app link.

**Why this exists:** The worker's Fly health check on port 8081 is "visibility only" — Fly is not configured to auto-restart on failure. The worker self-recovers via tenacity retry loops on startup. This external heartbeat is the actual operational alerting layer, decoupled from Fly's process management.

### Workflow: `prd-cherry-pick.yml`

**Trigger:** PR labeled `prd-cp` AND PR is merged.

**Steps:**
```
1. Checkout with CHERRY_PICK_PAT (needs push access to protected main)
2. git cherry-pick <merge_commit> --mainline 1
3. Push to main → triggers deploy-backend.yml
4. On failure: post comment with manual cherry-pick instructions
```

**Purpose:** Allows urgent staging changes to reach production without a full staging→main flow. The PAT is required because `main` is a protected branch that `GITHUB_TOKEN` cannot push to.

### Workflow: `ralph-loops.yml`

**Trigger:** Cron `*/15 * * * *` + `workflow_dispatch` (optional specific loop name).

**Architecture:**

```
Job 1: discover
  - Reads loops/_registry.yaml
  - Finds active reverse loops
  - Outputs JSON matrix

Job 2: run-loop (matrix, fail-fast: false)
  - Checkout ralph-loops branch
  - Merge staging → ralph-loops (pulls latest source for analysis)
  - Check status/converged.txt or status/paused.txt → skip if found
  - cat PROMPT.md | claude --print --dangerously-skip-permissions  (30-min timeout)
  - Commit results to ralph-loops branch
  - On convergence: create GitHub issue, update _registry.yaml
```

**Concurrency:** Per-loop group `ralph-loops-${{ matrix.loop }}`, no cancellation — prevents parallel instances of the same loop.

### Workflow: `bugbot-triage.yml`

**Trigger:** cursor[bot] PR review submitted, or PR synchronized with unresolved cursor[bot] comments.

**Purpose:** Automated triage of Bugbot code review comments. Claude Code (`claude-opus-4-6`, `--max-turns 30`) is invoked to:
1. Fetch unresolved cursor[bot] comments (thread IDs via GraphQL)
2. Investigate each finding: read code, trace data flow, check git history
3. Classify: Confirmed Bug / False Positive / Already Fixed / Not a Bug
4. Act: fix code for confirmed bugs; reply + resolve thread for false positives
5. Commit and push fixes

**Default stance baked into prompt:** "Default stance: assume the bot is WRONG until proven otherwise."

**Auth:** Uses `BUGBOT_CLAUDE` PAT (personal access token) so replies appear from a real user account — cursor[bot] ignores `@cursor` mentions from GitHub bot accounts (i.e., `GITHUB_TOKEN`).

**Safeguard:** Max 20 Bugbot reviews per PR before automatically skipping.

### Workflow: `backfill-messages.yml`

**Trigger:** `workflow_dispatch` only (manual admin tool, never automated).

**Inputs:** `start_date`, `end_date`, `concurrency` (default 7), `dry_run` (default true), `accounts` (optional filter), `environment`.

**Three-job pipeline** (dry_run=false only):
```
1. backfill-messages      → scripts/backfill_gap_messages.py
2. verify-completeness    → scripts/verify_backfill_completeness.py
3. retry-failed-workflows → scripts/retry_failed_workflows.py
```

**Timeout:** 360 minutes (6 hours) for the backfill job — reflects large historical Gmail datasets.

---

## Secret Management

### Secret Flow

```
GitHub Environment Variables (source of truth for all config)
    │
    ▼ (during CI deploy via deploy-backend.yml)
infra/scripts/sync-secrets-to-fly.sh
    │  1. Reads 49 named env vars from GitHub Actions environment
    │  2. Diffs against current flyctl secrets list
    │  3. Removes stale keys (comm-based diff)
    │  4. flyctl secrets import --stage  (applied during next deploy)
    │     (GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON via flyctl secrets set NAME=-)
    ▼
Fly.io Staged Secrets (applied atomically during flyctl deploy rollout)
    │
    ▼
VM environment variables at runtime
```

### Secret Inventory (49 keys)

| Category | Keys |
|----------|------|
| **Database** | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_EMAIL_BUCKET_NAME` |
| **AI/LLM** | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| **Observability** | `LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `ROLLBAR_ACCESS_TOKEN` |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` |
| **Temporal** | `TEMPORAL_SERVER_URL`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY` |
| **Slack** | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_DIGEST_BOT_TOKEN`, `SLACK_DIGEST_SIGNING_SECRET` |
| **Apify** | `APIFY_API_TOKEN`, `APIFY_LOOKALIKE_ACTOR_ID`, `APIFY_YOUTUBE_CHANNEL_SCRAPER_ACTOR_ID`, `APIFY_YOUTUBE_CHANNEL_FINDER_ACTOR_ID` |
| **Auth/Security** | `SECRET_KEY`, `ENCRYPTION_KEY`, `ENCRYPTION_IV_KEY` |
| **External APIs** | `COMPOSIO_API_KEY`, `INFLUENCER_CLUB_API_KEY` |
| **App Config** | `ALLOWED_HOSTS`, `DEPLOY_ENVIRONMENT`, `SERVICE_API_KEY` |

### GitHub Variables vs Secrets Design Decision

**Most credentials are GitHub Environment Variables (not Secrets).** This is intentional:
- Variables are visible in the GitHub UI — easier to inspect and edit without security team approval
- Secrets are masked everywhere — necessary for PATs (`CHERRY_PICK_PAT`, `BUGBOT_CLAUDE`) and Fly API tokens
- Trade-off: visibility to repo admins in exchange for operational ease
- Compensated by: Fly.io secrets being the actual runtime storage (not directly readable)

### Local Secret Sync

`infra/dev/scripts/upload-github-vars.sh`:
- Reads `apps/backend/.env`
- Uploads each key=value as GitHub Variable to `development` environment via `gh variable set`
- **Inverse flow**: local `.env` → GitHub Variables → `dev backend setup` → `.env` on new machines

---

## Environment Configuration

### Backend

| Key | Local | Staging | Production |
|-----|-------|---------|------------|
| `DEPLOY_ENVIRONMENT` | `dev` | `staging` | `production` |
| `DATABASE_URL` | `localhost:54322` | Supabase Cloud | Supabase Cloud |
| `TEMPORAL_SERVER_URL` | `localhost:7233` | Temporal Cloud | Temporal Cloud |
| `SUPABASE_URL` | `http://127.0.0.1:54321` | cloud project | cloud project |

Docker Compose overrides: `DATABASE_URL`, `SUPABASE_URL`, `TEMPORAL_SERVER_URL` use `host.docker.internal` so the container can reach host-bound services. The `.env` file uses `localhost` values that work from the host directly.

### Webapp

| Key | Local | Staging | Production |
|-----|-------|---------|------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:5001` | `https://stg-cheerful.fly.dev` | `https://prd-cheerful.fly.dev` |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | `https://sciyyxrleibrfwmxgegy.supabase.co` | (prod project) |
| `NEXT_PUBLIC_BACKEND_TIMEOUT_MS` | `100000` (100s) | `300000` (300s) | — |

Staging timeout is 3× local: LLM-heavy operations (AI draft generation, creator enrichment) can take up to 5 minutes on real data.

---

## Deployment Procedures

### Automated (Preferred)

Push code to `staging` branch → GitHub Actions detects changed paths → runs `deploy-backend.yml` automatically.

For urgent production changes: add `prd-cp` label to merged staging PR → `prd-cherry-pick.yml` handles cherry-pick to `main` → production deploy triggers.

### Manual

```bash
# Production
./infra/prd/deploy.sh
# Equivalent to:
flyctl secrets import --stage --app prd-cheerful < ./infra/prd/.production.env
flyctl deploy ./apps/backend \
  --config fly.prd.toml \
  --app prd-cheerful \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD)

# Staging (uses Depot for faster builds)
./infra/stg/deploy.sh
# Same but with --depot=true flag
```

**Depot.dev** is used for staging manual deploys (faster remote builders). Production uses Fly's standard `--remote-only` build system.

### Health Verification URLs

| Environment | URL |
|-------------|-----|
| Production | `https://prd-cheerful.fly.dev/health` |
| Staging | `https://stg-cheerful.fly.dev/health` |

### Fly.io Operational Commands

```bash
# App state
fly status -a prd-cheerful

# Logs
fly logs -a prd-cheerful                        # All processes
fly logs -a prd-cheerful --process web          # Web process
fly logs -a prd-cheerful --process worker       # Worker process

# Scaling
fly scale count web=2 worker=3 -a prd-cheerful

# Secrets (names only, values masked)
fly secrets list -a prd-cheerful

# Releases
flyctl releases -a prd-cheerful | head -10
```

---

## Observability

### Error Tracking

**Rollbar** (`ROLLBAR_ACCESS_TOKEN`):
- Captures backend Python exceptions in production
- Alerts route to `#rollbar-cheerful-ai` Slack channel

### LLM Observability

**Langfuse** (`LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`):
- All AI feature service calls wrapped with `@langfuse.observe` decorator
- Tracks: prompts, completions, latency, token counts, cost per call
- Graceful degradation if Langfuse is unavailable (never blocks production traffic)

### Product Analytics

**PostHog**:
- Frontend event tracking and session recording
- Session recording disabled on `/settings` (privacy)
- Feature flag support

### Health Monitoring

**Worker heartbeat** (GitHub Actions cron, `*/15 * * * *`):
- Check 1: Fly Machines API — worker VM state = `started`
- Check 2: PostgreSQL query — Gmail ingestion freshness (messages in last 30 min)
- Alert: Slack `#rollbar-cheerful-ai`

---

## Key Design Decisions

### 1. Two-Process Fly App (not two separate apps)

Web and worker run as separate process groups within a single Fly app (`prd-cheerful`):
- **Benefit:** Shared secrets, shared Docker image, single build
- **Benefit:** Different VM sizes — worker gets 4× CPU/RAM for LLM workloads
- **Benefit:** Independent scaling via `fly scale count`
- **Tradeoff:** A single bad deploy affects both processes simultaneously

### 2. Worker Self-Recovery + External Heartbeat

Worker health check on port 8081 is "visibility only" — Fly does not auto-restart. Worker uses tenacity retry loops on startup to self-recover from transient errors. The GitHub Actions heartbeat provides alerting without tight coupling to Fly's lifecycle management.

**Why:** Auto-restart risks thrashing for persistent errors. Self-recovery with alerting gives operators time to investigate before the restart loop compounds the problem.

### 3. Migration-Before-Deploy Ordering

`supabase db push` runs before `flyctl deploy` in CI. If migration fails, the deploy never happens. This prevents the new application code from running against an old schema.

**Risk note:** Supabase migrations apply to the live cloud database directly. Non-backward-compatible schema changes (dropped columns, renamed tables) can break the currently running old version between migration and deploy completion. Schema changes must be backward-compatible or deployed in two phases.

### 4. Context Engine: Immediate Deploy Strategy

`strategy = 'immediate'` instead of Fly's default rolling deploy. The context engine is a single persistent WebSocket process — rolling would create a gap where neither old nor new instance holds the Slack Socket Mode connection. Immediate cutover minimizes this gap to milliseconds.

### 5. Claude Code CLI in Production Docker Images

Both backend and context-engine images install `@anthropic-ai/claude-code` globally via npm. This is intentional architecture:
- **Backend:** `ClaudeAgentService` invokes the CLI as a subprocess for agentic campaign workflow execution with MCP tools
- **Context engine:** Claude Code is the runtime for Slack bot responses, ACP sessions, and multi-tool orchestration
- The CLI (not just the Python SDK) is needed for features like tool use, multi-turn sessions, and custom hooks

### 6. Staging-First Branch Strategy

All development merges to `staging`. Production only receives changes via push to `main` or cherry-pick. This creates a stable staging environment that can accumulate multiple features before any reach production, reducing production risk.

### 7. GitHub Variables (not Secrets) for API Keys

Most credentials are GitHub Environment Variables (visible to repo admins). The trade-off: easier operational management (can inspect/edit without masking) at the cost of visibility within GitHub's UI. The actual runtime secrets live in Fly.io (not GitHub), providing a second layer of protection.

### 8. Supabase Services Exclusion in Local and CI

Local dev and CI both exclude `realtime`, `edge-runtime`, `logflare`, and `vector` from `npx supabase start`. These services are not used by Cheerful's application code, and including them slows startup significantly.

---

## Rebuilding from Scratch: Checklist

### Infrastructure Accounts Needed
1. Fly.io account + org (create `prd-cheerful`, `stg-cheerful`, `prd-context-engine` apps)
2. Supabase project (production + staging projects)
3. Temporal Cloud namespace (production + staging)
4. Vercel project (connected to GitHub repo)
5. GitHub repository with `staging`, `main`, `ralph-loops` branches

### GitHub Environments to Configure
- `development` — local dev variables (uploaded via `upload-github-vars.sh`)
- `staging` — all 49 secrets for staging Fly app
- `production` — all 49 secrets for production Fly app
- `production:context-engine` — context engine secrets

### Required GitHub Actions Secrets (not Variables)
- `FLY_API_TOKEN` — Fly.io deploy
- `CHERRY_PICK_PAT` — push to protected `main`
- `BUGBOT_CLAUDE` — PAT for bugbot replies

### First-Time Local Setup
```bash
git clone <repo>
cd cheerful
uv run dev setup              # Validate prerequisites, generate .env files
uv run dev start              # Start all services
# Visit http://localhost:3000
```

### Deploy Order for New Environment
1. Create Supabase project → run all migrations (`supabase db push`)
2. Create Temporal Cloud namespace → configure search attributes
3. Create Fly.io apps → configure process groups, machine sizes
4. Set GitHub Environment variables
5. Configure Vercel project → set `NEXT_PUBLIC_*` env vars
6. Push to `staging` → CI deploys automatically
