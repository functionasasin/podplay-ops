# Infrastructure & Deployment Analysis

**Aspect**: `infra-deploy`
**Source paths**:
- `infra/DEPLOY.md`
- `infra/dev/` — local dev CLI, docker-compose, service managers
- `infra/prd/deploy.sh`, `infra/stg/deploy.sh`
- `infra/scripts/sync-secrets-to-fly.sh`
- `apps/backend/fly.prd.toml`, `apps/backend/fly.stg.toml`
- `apps/backend/Dockerfile`
- `apps/context-engine/fly.prd.toml`, `apps/context-engine/Dockerfile`
- `apps/webapp/vercel.json`
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-context-engine.yml`
- `.github/workflows/test.yml`
- `.github/workflows/worker-heartbeat.yml`
- `.github/workflows/prd-cherry-pick.yml`
- `.github/workflows/ralph-loops.yml`
- `.github/workflows/bugbot-triage.yml`
- `.github/workflows/backfill-messages.yml`

---

## Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│ Production                                                   │
│                                                             │
│  Vercel (webapp)                                            │
│  ├── Next.js SSR + static                                   │
│  └── NEXT_PUBLIC_BACKEND_URL → prd-cheerful.fly.dev         │
│                                                             │
│  Fly.io: prd-cheerful (backend)                             │
│  ├── [web] process — FastAPI, 4 workers, port 8080          │
│  │   └── shared-cpu-4x / 2048MB RAM                        │
│  └── [worker] process — Temporal worker, port 8081 health   │
│      └── shared-cpu-8x / 8192MB RAM                        │
│                                                             │
│  Fly.io: prd-context-engine (Slack bot)                     │
│  └── [main] process — Socket Mode WebSocket, no HTTP        │
│      └── shared-cpu-2x / 4096MB RAM                        │
│                                                             │
│  Supabase Cloud (managed)                                   │
│  ├── PostgreSQL + RLS + Auth                                │
│  ├── Storage (email attachments, email bodies)              │
│  └── sciyyxrleibrfwmxgegy.supabase.co                       │
│                                                             │
│  Temporal Cloud (managed)                                   │
│  └── TEMPORAL_SERVER_URL + TEMPORAL_NAMESPACE + API key     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Staging                                                     │
│                                                             │
│  Fly.io: stg-cheerful (backend)                             │
│  ├── [web] process — FastAPI, 1 worker, port 8080           │
│  │   └── shared-cpu-1x / 1024MB RAM                        │
│  └── [worker] process — Temporal worker, port 8081 health   │
│      └── shared-cpu-2x / 1024MB RAM                        │
│                                                             │
│  (Supabase, Temporal Cloud, Vercel — separate project refs) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Local Development                                           │
│                                                             │
│  npm run dev (Next.js, port 3000)                           │
│  Docker Compose — backend (FastAPI port 5001 + worker)      │
│  npx supabase start — local Supabase (ports 54321–54323)    │
│  temporal server start-dev — Temporal dev server (7233)     │
│  Temporal UI — http://localhost:8233                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Fly.io Configuration

### Production (`apps/backend/fly.prd.toml`)

| Property | Value |
|----------|-------|
| App name | `prd-cheerful` |
| Region | `iad` (US East) |
| Kill signal | `SIGTERM` (5m timeout for graceful drain) |

**Process groups** — two separate VMs in one Fly app:

| Process | Command | VM Size | RAM |
|---------|---------|---------|-----|
| `web` | `uvicorn main:app --host 0.0.0.0 --port 8080 --workers 4` | shared-cpu-4x | 2048MB |
| `worker` | `python -m src.temporal.worker` | shared-cpu-8x | 8192MB |

Worker gets 4× the CPU and 4× the RAM of web — reflecting that LLM workloads and Gmail API calls are far heavier than HTTP request handling.

**Health checks** (web):
- TCP check: 15s interval / 5s timeout / 10s grace
- HTTP check: `GET /health` every 30s / 5s timeout / 10s grace
- Concurrency: hard_limit=200 connections, soft_limit=150

**Worker health** (port 8081, visibility only):
- HTTP GET `/` every 30s
- Comment: "does NOT trigger auto-restart" — worker self-recovers via tenacity retry
- External heartbeat (GitHub Actions cron) provides actual alerting

**Release command** (runs before each deploy, during rollout):
```
python -m scripts.ensure_slack_digest_schedule
```
Ensures the Temporal schedule for Slack digests exists before the new version goes live.

**HTTPS**: auto-redirect HTTP→HTTPS enforced at ingress.

### Staging (`apps/backend/fly.stg.toml`)

Same structure but smaller VMs:
- web: shared-cpu-1x / 1024MB
- worker: shared-cpu-2x / 1024MB
- Single uvicorn worker (no `--workers 4`)
- Same health check configuration
- App name: `stg-cheerful`

---

## Context Engine Fly.io Configuration

### Production (`apps/context-engine/fly.prd.toml`)

| Property | Value |
|----------|-------|
| App name | `prd-context-engine` |
| Region | `iad` |
| Process | `main: bash start.sh` |
| VM | shared-cpu-2x / 4096MB |
| Deploy strategy | `immediate` (instant cutover, not rolling) |

**No HTTP services or health checks** — the context engine uses Slack's Socket Mode (outbound WebSocket), so no inbound port exposure is needed. The immediate deploy strategy makes sense because there's only one persistent connection and rolling would create a gap.

---

## Docker — Backend (`apps/backend/Dockerfile`)

```dockerfile
FROM python:3.12-slim
# System deps: gcc, g++, curl, git, Node.js 18.x
# Install Claude Code CLI globally (npm install -g @anthropic-ai/claude-code)
# Install uv for fast Python dep management
# COPY pyproject.toml uv.lock → uv sync --frozen --no-dev
# ARG GIT_COMMIT → ENV GIT_COMMIT (baked into image at build time)
# COPY . .
# Non-root user: appuser (uid 1001)
```

**Why Claude Code in the backend image**: The backend's Temporal worker uses Claude via the Claude Code CLI for the agentic `ClaudeAgentService` (campaign workflow execution with MCP tools). The CLI is invoked as a subprocess — not just the Python SDK.

**Layer caching**: `pyproject.toml`/`uv.lock` are copied and installed before application code, so code changes don't invalidate the dependency layer.

**GIT_COMMIT arg**: Passed as `--build-arg GIT_COMMIT=$(git rev-parse HEAD)` during deploy, baked into the image as an env var for health/debug endpoint visibility.

---

## Docker — Context Engine (`apps/context-engine/Dockerfile`)

```dockerfile
FROM python:3.12-slim
# System deps: gcc, g++, curl, git, ffmpeg, libopus-dev, Node.js 18.x
# GitHub CLI (gh) installed from official deb repo
# Claude Code CLI: npm install -g @anthropic-ai/claude-code
# uv from ghcr.io/astral-sh/uv (COPY --from multistage)
# Non-root user: appuser (uid 1000)
# COPY app/ and app/start.sh
# COPY .claude/ (skills, agents, commands, hooks)
```

**Extra system deps vs backend**:
- `ffmpeg`, `libopus-dev` — audio/voice support (Discord bot or voice processing)
- `gh` (GitHub CLI) — for MCP tools that interact with GitHub (ralph loops, PR triage)
- `.claude/` directory — Claude Code configuration copied into image, enabling CLAUDE.md-guided behavior within sessions

---

## Local Development

### Entry Point: `infra/dev/cli.py`

A Typer CLI invoked via `uv run dev [COMMAND]`. This is the single management interface for local development. Commands:

| Command | Effect |
|---------|--------|
| `dev start` | Start all: Supabase → DB reset → Temporal → Docker → webapp |
| `dev start --no-webapp` | Backend services only |
| `dev start --staging` | Webapp only, injecting staging env vars |
| `dev start --fresh` | Stop everything first, then start |
| `dev down` | Stop everything (webapp, Temporal, Docker, Supabase) |
| `dev setup` | First-time: install deps, generate .env files |
| `dev status` | Rich table of service health |
| `dev webapp setup` | Generate `apps/webapp/.env.local` |
| `dev backend setup` | Generate `apps/backend/.env` from GitHub Variables |
| `dev logs all/backend/worker/temporal/webapp` | Tail logs |
| `dev supabase <args>` | Thin wrapper: `npx supabase <args>` |
| `dev compose <args>` | Thin wrapper: `docker compose <args>` in `infra/dev/` |

### Startup Order

1. **Supabase** (`npx supabase start`) — on port 54321 (API), 54322 (PostgreSQL), 54323 (Studio)
   - Excludes: `realtime`, `edge-runtime`, `logflare`, `vector` (not needed locally)
   - After start: `npx supabase db reset --local` runs all migrations + seeds
2. 2-second stabilization sleep
3. **Temporal** (`temporal server start-dev --ip 0.0.0.0`) — on ports 7233 (gRPC), 8233 (UI)
   - After start: creates custom search attributes (UserEmail, GoogleAccountEmail, GmailThreadId, GmailThreadStateId, GoogleAccountEmailList)
4. **Docker Compose** — starts `web` (FastAPI, port 5001) and `temporal-worker`
   - Both mount `../../apps/backend:/app` for hot reload
   - Docker-specific overrides: DATABASE_URL/SUPABASE_URL/TEMPORAL_SERVER_URL use `host.docker.internal`
5. **Webapp** (`npm run dev`) — on port 3000, optionally in background with PID tracking

### Health Status Table

`dev status` prints a Rich table with live port checks:

| Service | Port | URL |
|---------|------|-----|
| Webapp | 3000 | http://localhost:3000 |
| FastAPI | 5001 | http://localhost:5001 |
| Supabase API | 54321 | http://localhost:54321 |
| Supabase Studio | 54323 | http://localhost:54323 |
| PostgreSQL | 54322 | localhost:54322 |
| Temporal UI | 8233 | http://localhost:8233 |
| Temporal gRPC | 7233 | localhost:7233 |

### Prerequisites

`dev setup` validates: Node.js, npm, Docker, uv, Temporal CLI.

### Environment Generation

**Backend** (`dev backend setup`):
1. Introspects `src/core/config/definition.py` via `importlib.util` (bypasses `__init__.py` to avoid Settings instantiation errors before `.env` exists)
2. For each `Settings.model_fields`: fetches from GitHub `development` environment variables via `gh variable get`
3. Falls back to Pydantic default; leaves blank with warning for missing required fields

**Webapp** (`dev webapp setup`):
Generates `apps/webapp/.env.local` with hardcoded local dev values:
- Local Supabase URLs/keys (well-known demo JWT tokens)
- Backend: `http://localhost:5001`
- Hardcoded encryption key/IV for local use
- Google OAuth, Shopify, OpenAI stubs (must be filled manually)

**Staging mode** (`dev start --staging`):
Injects staging env vars into webapp process environment, overriding `.env.local`. Useful for testing local UI changes against real staging data. Prints a warning: "You are connecting to STAGING data!"

---

## CI/CD Pipeline

### Branch Strategy

```
main ──────────────── Production deploys
  ↑
staging ──────────── Staging deploys + tests
  ↑
feature branches ─── PRs → staging

ralph-loops ────────── Dedicated branch for ralph loop CI
```

Cherry-picking from staging→main is automated via `prd-cp` label.

### Workflow: `deploy-backend.yml`

**Triggers**: push to `staging` or `main` when `apps/backend/**` or `supabase/migrations/**` change; `workflow_dispatch` (manual with env choice).

**Environment**: GitHub Environment (`staging` or `production`) — enables environment-scoped secrets/variables.

**Concurrency**: `cancel-in-progress: false` — deploys queue, never cancel a running deploy.

**Steps in order**:
1. Checkout
2. **Supabase CLI** → link project (`SUPABASE_PROJECT_REF` per environment)
3. **Run migrations**: `supabase db push --include-all` — migrations always run before app deploy
4. Fly.io CLI setup
5. **Secret sync**: `./infra/scripts/sync-secrets-to-fly.sh` — reads all 49 secrets from GitHub Environment variables, diffs against current Fly secrets, removes stale secrets, imports all current ones as `--stage` (staged, applied during deploy)
6. **Deploy**: `flyctl deploy ./apps/backend --config fly.{prd|stg}.toml --build-arg GIT_COMMIT=$SHA --remote-only`
7. **Verify**: `flyctl status` + `flyctl releases | head -5`
8. **Slack notification**: success/failure to `#rollbar-cheerful-ai`

**Config file selection**:
```bash
CONFIG_FILE="apps/backend/fly.${{ github.ref == 'refs/heads/main' && 'prd' || 'stg' }}.toml"
```

### Workflow: `deploy-context-engine.yml`

**Triggers**: push to `staging` when `apps/context-engine/**` changes; `workflow_dispatch`.

**Notable**: Context engine always deploys to production (`environment: production:context-engine`) even from `staging` branch. This reflects that there's only one context engine deployment (no staging equivalent).

Steps: Fly.io CLI → sync secrets → `flyctl deploy . --config fly.prd.toml --remote-only`.

Context engine secrets differ from backend (Slack App Token, Onyx, Clarify, PostHog, CHEERFUL_API_URL, GH_TOKEN, FLY_ORG_SLUG).

### Workflow: `test.yml`

**Triggers**: PR opened/synchronized/reopened against `main` or `staging`.

**Steps**:
1. Python 3.12 + uv + Node.js 20
2. Start local Supabase (excludes realtime, edge-runtime, logflare, vector, postgrest)
3. `npx supabase db reset --local`
4. Extract Supabase URLs/keys from `supabase status --output json`
5. `uv sync` in `apps/backend`
6. `uv run pytest -v -m "not integration"` — integration tests skipped in CI

**Test env vars**: Real Anthropic/OpenAI/Langfuse keys (from GitHub secrets), dummy Google OAuth, static encryption keys for test only. `USE_MOCK_WORKFLOW_TOOLS=true` to mock Temporal workflow triggers.

### Workflow: `worker-heartbeat.yml`

**Trigger**: cron `*/15 * * * *` (every 15 minutes), `workflow_dispatch`.

**Two checks**:
1. **Machine status**: Calls Fly Machines API to check if the worker machine's state is `started`
2. **Ingestion freshness**: Queries `gmail_message WHERE created_at > now() - interval '30 minutes'` — if count < 1, flags `INGESTION_STALE`

**Alert**: If either check fails, posts to Slack `#rollbar-cheerful-ai` with details and Fly.io app link.

**Why this exists**: The worker Fly health check is "visibility only" — Fly won't auto-restart a failed worker. This external heartbeat provides the actual alerting layer. Worker self-recovers via tenacity retry on startup, so alerting (not auto-restart) is the right model.

### Workflow: `prd-cherry-pick.yml`

**Trigger**: PR labeled with `prd-cp` AND PR is merged.

**Purpose**: Bridge between staging-first workflow (all PRs target `staging`) and production (deploys from `main`). Hotfixes or urgent staging PRs can be fast-tracked to production by adding the `prd-cp` label.

**Steps**:
1. Checkout with `CHERRY_PICK_PAT` (PAT needed to push to protected `main`)
2. `git cherry-pick <merge_commit> --mainline 1`
3. Push to main → triggers `deploy-backend.yml` automatically
4. On failure: posts comment with manual cherry-pick instructions

### Workflow: `ralph-loops.yml`

**Trigger**: cron `*/15 * * * *`, `workflow_dispatch` (optional specific loop name).

**Architecture**:
1. **Discover job**: Reads `loops/_registry.yaml` → finds active reverse loops → outputs matrix
2. **Run-loop job** (matrix, `fail-fast: false`):
   - Checks out `ralph-loops` branch (dedicated branch for loop state)
   - Merges `staging` into `ralph-loops` (pulls latest source code for analysis)
   - Checks for `status/converged.txt` or `status/paused.txt` — skips if found
   - `cat PROMPT.md | claude --print --dangerously-skip-permissions` (30-minute timeout)
   - Commits results to `ralph-loops` branch
   - On convergence: creates GitHub issue with summary, updates registry YAML

**Concurrency**: Per-loop group `ralph-loops-${{ matrix.loop }}`, no cancellation — prevents parallel runs of the same loop.

### Workflow: `bugbot-triage.yml`

**Trigger**: cursor[bot] PR review submitted, or PR synchronized (for unresolved prior comments).

**Purpose**: Automates triage of cursor[bot] (Bugbot) code review comments. Claude Code is invoked to:
1. Fetch unresolved cursor[bot] comments (resolves thread IDs via GraphQL)
2. Investigate each finding (read code, trace data flow, check git history)
3. Classify: Confirmed Bug / False Positive / Already Fixed / Not a Bug
4. Act: fix code for confirmed bugs; reply + resolve thread for false positives
5. Commit fixes and push

**Model**: `claude-opus-4-6` with `--max-turns 30`.

**Skepticism built into prompt**: "Default stance: assume the bot is WRONG until proven otherwise."

**Auth**: Uses `BUGBOT_CLAUDE` PAT (not `GITHUB_TOKEN`) so replies appear from a real user account — Bugbot ignores `@cursor` mentions from bot accounts.

**Max iterations**: 20 Bugbot reviews per PR before automatically skipping.

### Workflow: `backfill-messages.yml`

**Trigger**: `workflow_dispatch` only — manual admin tool.

**Purpose**: Backfill historical Gmail messages for a date range when gaps are detected.

**Inputs**: start_date, end_date, concurrency (default 7), dry_run (default true), accounts (optional filter), environment.

**Three-job pipeline** (dry_run=false only):
1. `backfill-messages`: runs `scripts/backfill_gap_messages.py`
2. `verify-completeness`: runs `scripts/verify_backfill_completeness.py`
3. `retry-failed-workflows`: runs `scripts/retry_failed_workflows.py`

**Timeout**: 360 minutes (6 hours) for backfill job — reflects large historical datasets.

---

## Secret Management

### Architecture

```
GitHub Environment Variables (source of truth)
    ↓ (during CI deploy)
infra/scripts/sync-secrets-to-fly.sh
    ↓ (flyctl secrets import --stage)
Fly.io Staged Secrets
    ↓ (applied during flyctl deploy rollout)
VM environment variables
```

### Secret Sync Script (`infra/scripts/sync-secrets-to-fly.sh`)

- Reads 49 named secrets from environment (passed by GitHub Actions)
- Gets current Fly.io secrets via `flyctl secrets list --json`
- **Removes stale secrets** (comm diff between current and expected)
- Builds secrets file, imports via `flyctl secrets import --stage`
- Handles `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` specially (multiline JSON via `flyctl secrets set NAME=-`)
- `--stage` means secrets are applied during the subsequent `flyctl deploy`, not immediately

### Secret Inventory (49 keys)

| Category | Secrets |
|----------|---------|
| Database | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_EMAIL_BUCKET_NAME` |
| AI/LLM | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| Observability | `LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `ROLLBAR_ACCESS_TOKEN` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` |
| Temporal | `TEMPORAL_SERVER_URL`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY` |
| Slack | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_DIGEST_BOT_TOKEN`, `SLACK_DIGEST_SIGNING_SECRET` |
| Apify | `APIFY_API_TOKEN`, `APIFY_LOOKALIKE_ACTOR_ID`, `APIFY_YOUTUBE_CHANNEL_SCRAPER_ACTOR_ID`, `APIFY_YOUTUBE_CHANNEL_FINDER_ACTOR_ID` |
| Auth/Security | `SECRET_KEY`, `ENCRYPTION_KEY`, `ENCRYPTION_IV_KEY` |
| External APIs | `COMPOSIO_API_KEY`, `INFLUENCER_CLUB_API_KEY` |
| App Config | `ALLOWED_HOSTS`, `DEPLOY_ENVIRONMENT`, `SERVICE_API_KEY` |

### GitHub Variables vs Secrets

**Important design decision**: Most values are stored as GitHub **Variables** (not Secrets), including API keys. This is explicitly noted in comments: "All values are read from GitHub Environment Variables (not secrets) for easy editing."

This trades security (Variables are visible in UI) for operability (can edit without re-entering values). Secrets are used only for PATs and Fly API tokens.

### Local Secret Management

`infra/dev/scripts/upload-github-vars.sh`:
- Reads `.env` file from `apps/backend/`
- Uploads each key=value as GitHub Variable to `development` environment via `gh variable set`
- Inverse flow: allows local `.env` to be the source of truth and pushed to GitHub

---

## Environment Configuration

### Backend Environments

| Key | Local | Staging | Production |
|-----|-------|---------|------------|
| `DEPLOY_ENVIRONMENT` | dev | staging | production |
| `DATABASE_URL` | localhost:54322 | Supabase cloud | Supabase cloud |
| `TEMPORAL_SERVER_URL` | localhost:7233 | Temporal cloud | Temporal cloud |
| `SUPABASE_URL` | http://127.0.0.1:54321 | cloud project | cloud project |

Docker-compose overrides `DATABASE_URL`, `SUPABASE_URL`, `TEMPORAL_SERVER_URL` with `host.docker.internal` variants, so the `.env` file uses localhost values usable from both host and Docker.

### Webapp Environments

| Key | Local | Staging | Production |
|-----|-------|---------|------------|
| `NEXT_PUBLIC_BACKEND_URL` | http://localhost:5001 | https://stg-cheerful.fly.dev | https://prd-cheerful.fly.dev |
| `NEXT_PUBLIC_SUPABASE_URL` | http://127.0.0.1:54321 | https://sciyyxrleibrfwmxgegy.supabase.co | — |
| `NEXT_PUBLIC_BACKEND_TIMEOUT_MS` | 100000 | 300000 | — |

Staging webapp timeout is 3× local, reflecting that LLM-heavy operations (draft generation, enrichment) can take up to 5 minutes.

---

## Deployment Procedures

### Backend Deploy (Manual)

```bash
# Production
./infra/prd/deploy.sh
# Equivalent to:
flyctl secrets import --stage --app prd-cheerful < ./infra/prd/.production.env
flyctl deploy ./apps/backend --config fly.prd.toml --app prd-cheerful --build-arg GIT_COMMIT=$(git rev-parse HEAD)

# Staging
./infra/stg/deploy.sh
# Same but with --depot=true (Depot.dev for faster remote builds in staging)
```

**Staging uses Depot** (`--depot=true`) for faster CI builds. Production uses standard `--remote-only` on Fly's own builders.

### Monitoring URLs

| Environment | Health URL |
|-------------|-----------|
| Production | https://prd-cheerful.fly.dev/health |
| Staging | https://cheerful-stg.fly.dev/health |

### Fly.io Operational Commands

```bash
fly status -a prd-cheerful                        # Machine states
fly logs -a prd-cheerful                          # All logs
fly logs -a prd-cheerful --process web            # Web process only
fly logs -a prd-cheerful --process worker         # Worker process only
fly scale count web=2 worker=3 -a prd-cheerful    # Scale processes
fly secrets list -a prd-cheerful                  # List secret names
```

---

## Observability

### Error Tracking
- **Rollbar** (`ROLLBAR_ACCESS_TOKEN`) — production error tracking for backend exceptions

### LLM Observability
- **Langfuse** (`LANGFUSE_HOST`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`) — all AI feature calls wrapped with `@langfuse.observe`, tracks prompts, completions, latency, cost

### Analytics
- **PostHog** — frontend analytics (session recording paused on `/settings`), feature flags

### Health Monitoring
- Worker heartbeat (GitHub Actions cron, every 15 min) — checks Fly machine state + Gmail ingestion freshness
- Slack alerts via `#rollbar-cheerful-ai` channel

---

## Key Design Decisions

### 1. Two-Process Fly App (not two apps)
Web and worker run as separate process groups within a single Fly app (`prd-cheerful`). This means:
- Shared secrets (one set, one sync)
- Shared Docker image (single build)
- Different VM sizes (worker needs much more memory for LLM calls)
- Independent scaling (`fly scale count web=2 worker=3`)

### 2. Staging-First Branch Strategy
All development happens in feature branches → PRs to `staging`. Production (`main`) only receives changes via:
- Automatic push-triggered deploy when PRs merge to main (for normal flow where staging=main)
- Cherry-pick via `prd-cp` label (for urgent staging changes)

This allows staging to accumulate changes safely before they reach production.

### 3. Migration-Before-Deploy Ordering
The deploy workflow explicitly runs `supabase db push` before `flyctl deploy`. This prevents the new code from running against an old schema, since Supabase (PostgreSQL) migrations are applied live to the cloud database. If migration fails, deploy never happens.

### 4. Worker Self-Recovery with External Heartbeat
The Temporal worker uses tenacity retry loops on startup and is NOT configured to auto-restart on health check failure. The Fly health check on port 8081 is "visibility only." The GitHub Actions heartbeat (every 15 min) is the actual alerting mechanism. This separates concerns: Fly manages process lifecycle, GitHub Actions manages operational alerting.

### 5. Context Engine: Immediate Deploy Strategy
The context engine uses `strategy = 'immediate'` vs Fly's default rolling deploy. Because it's a single-process Slack WebSocket bot, rolling makes no sense — there's no traffic to shift. Immediate cutover minimizes the window where two versions could be running.

### 6. Claude Code in Production Images
Both backend and context-engine Docker images install `@anthropic-ai/claude-code` globally. This is intentional:
- Backend: `ClaudeAgentService` invokes the CLI as a subprocess for agentic workflow execution
- Context engine: Claude Code is the runtime for Slack bot responses and ACP session management

### 7. GitHub Variables (not Secrets) for API Keys
Most credentials are GitHub Environment Variables (visible in UI), not GitHub Secrets (masked). Trade-off: easier operational management (can see/edit without security team approval) at the cost of visibility to repo admins. Compensated by Fly.io secrets being the actual runtime storage.
