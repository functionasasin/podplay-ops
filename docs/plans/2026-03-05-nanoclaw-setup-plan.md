# NanoClaw Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy NanoClaw to Fly.io as the monorepo's Telegram bot, replacing OpenClaw.

**Architecture:** Fork NanoClaw into `automations/nanoclaw/`, add Telegram channel via its skill system, wrap with a Fly.io Dockerfile that runs Docker-in-Docker for agent container isolation, deploy with a persistent volume for SQLite + monorepo clone.

**Tech Stack:** Node.js 22, TypeScript, Docker-in-Docker, Fly.io, SQLite, Claude Agent SDK

---

### Task 1: Clone NanoClaw into the monorepo

**Files:**
- Create: `automations/nanoclaw/` (cloned from upstream)

**Step 1: Clone the repo**

```bash
cd /home/clsandoval/cs/monorepo
git clone https://github.com/qwibitai/nanoclaw.git automations/nanoclaw
```

**Step 2: Remove NanoClaw's .git directory**

We're absorbing it into the monorepo, not keeping it as a submodule.

```bash
rm -rf automations/nanoclaw/.git
```

**Step 3: Install dependencies**

```bash
cd automations/nanoclaw && npm install
```

**Step 4: Build the project**

```bash
npm run build
```

Expected: TypeScript compiles to `dist/` without errors.

**Step 5: Commit**

```bash
cd /home/clsandoval/cs/monorepo
git add automations/nanoclaw
git commit -m "Add NanoClaw source to automations/nanoclaw"
```

---

### Task 2: Add Telegram channel

NanoClaw uses a skill-based system to add channels. The `/add-telegram` skill generates a Telegram channel implementation in `src/channels/`. We need to run it interactively.

**Step 1: Run Claude Code in the NanoClaw directory and use /add-telegram**

```bash
cd /home/clsandoval/cs/monorepo/automations/nanoclaw
claude
```

Inside the Claude session, run:
```
/add-telegram
```

This will generate the Telegram channel files (likely `src/channels/telegram.ts` and update `src/channels/index.ts` to import it).

**Step 2: Verify the channel was added**

Check that `src/channels/index.ts` now imports the telegram channel, and a telegram channel file exists.

```bash
cat src/channels/index.ts
ls src/channels/telegram*
```

**Step 3: Rebuild**

```bash
npm run build
```

Expected: Compiles without errors.

**Step 4: Commit**

```bash
cd /home/clsandoval/cs/monorepo
git add automations/nanoclaw
git commit -m "Add Telegram channel to NanoClaw"
```

---

### Task 3: Build the agent container image locally

The agent container is what NanoClaw spawns for each conversation. It needs to be built from `container/Dockerfile`.

**Step 1: Build the agent image**

```bash
cd /home/clsandoval/cs/monorepo/automations/nanoclaw
docker build -t nanoclaw-agent:latest -f container/Dockerfile container/
```

Expected: Image builds successfully. This image contains Node 22, Chromium, Claude Code CLI, and the agent-runner.

**Step 2: Verify**

```bash
docker images nanoclaw-agent
```

Expected: Shows `nanoclaw-agent:latest` image.

---

### Task 4: Create the monorepo group with CLAUDE.md

**Files:**
- Create: `automations/nanoclaw/groups/monorepo/CLAUDE.md`

**Step 1: Create the group directory and CLAUDE.md**

```bash
mkdir -p automations/nanoclaw/groups/monorepo/logs
```

Write `automations/nanoclaw/groups/monorepo/CLAUDE.md`:

```markdown
# Monorepo Assistant

You are a personal assistant connected to a knowledge graph monorepo. You can read and write files in this workspace.

## What's here

- `entities/` — typed markdown entities (people, places, businesses, trips, meetings, projects, ideas, events)
- `inbox/` — raw dumps waiting for organization
- `research/` — deep research docs
- `dashboards/` — Dataview-powered overview pages

## How to help

- When asked about people, places, projects, etc., search the entities directory
- When given new information, you can create or update entity files
- Keep responses concise
- Use [[wikilinks]] when referencing entities
```

**Step 2: Commit**

```bash
cd /home/clsandoval/cs/monorepo
git add automations/nanoclaw/groups/monorepo
git commit -m "Add monorepo group with CLAUDE.md for NanoClaw"
```

---

### Task 5: Create Fly.io deployment files

**Files:**
- Create: `automations/nanoclaw/deploy/Dockerfile`
- Create: `automations/nanoclaw/deploy/fly.toml`
- Create: `automations/nanoclaw/deploy/entrypoint.sh`
- Create: `automations/nanoclaw/deploy/.dockerignore`

NanoClaw needs Docker-in-Docker because it spawns agent containers. On Fly.io, we run Docker daemon inside the VM.

**Step 1: Create the deploy directory**

```bash
mkdir -p automations/nanoclaw/deploy
```

**Step 2: Write the Dockerfile**

`automations/nanoclaw/deploy/Dockerfile`:

```dockerfile
# NanoClaw on Fly.io with Docker-in-Docker
FROM docker:27-dind

# Install Node.js 22
RUN apk add --no-cache nodejs npm git bash openssh-client

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create app directory
WORKDIR /app/nanoclaw

# Copy NanoClaw source (from parent directory)
COPY --from=nanoclaw-src . .

# Install dependencies and build
RUN npm install && npm run build

# Build the agent container image inside the builder
# (We pre-build it so it's baked into the Fly image)
COPY container/ /tmp/agent-container/

# Copy entrypoint
COPY deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Volume mount point for persistent data (SQLite, monorepo clone, groups)
VOLUME /data

ENTRYPOINT ["/app/entrypoint.sh"]
```

Note: The Dockerfile above is a starting template. The actual multi-stage build needs refinement because we need Docker daemon running at build time to pre-build the agent image. The practical approach is to build the agent image at first boot instead.

**Revised Dockerfile:**

```dockerfile
FROM docker:27-dind

RUN apk add --no-cache nodejs npm git bash openssh-client

RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app/nanoclaw

# Copy the full NanoClaw project
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

COPY deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

VOLUME /data

ENTRYPOINT ["/app/entrypoint.sh"]
```

**Step 3: Write the entrypoint script**

`automations/nanoclaw/deploy/entrypoint.sh`:

```bash
#!/bin/bash
set -e

# Start Docker daemon in the background
dockerd &
DOCKERD_PID=$!

# Wait for Docker daemon to be ready
echo "Waiting for Docker daemon..."
until docker info >/dev/null 2>&1; do
  sleep 1
done
echo "Docker daemon ready."

# Build agent container image if not already built
if ! docker image inspect nanoclaw-agent:latest >/dev/null 2>&1; then
  echo "Building agent container image..."
  docker build -t nanoclaw-agent:latest -f /app/nanoclaw/container/Dockerfile /app/nanoclaw/container/
  echo "Agent image built."
fi

# Set up persistent directories on the volume
mkdir -p /data/store /data/groups /data/monorepo

# Symlink NanoClaw data dirs to volume
ln -sfn /data/store /app/nanoclaw/store
ln -sfn /data/groups /app/nanoclaw/groups

# Clone or pull the monorepo
if [ ! -d /data/monorepo/.git ]; then
  echo "Cloning monorepo..."
  git clone "$GIT_REPO_URL" /data/monorepo
else
  echo "Pulling latest monorepo..."
  cd /data/monorepo && git pull --rebase || true
  cd /app/nanoclaw
fi

# Copy group CLAUDE.md if the monorepo group doesn't exist yet on the volume
if [ ! -f /data/groups/monorepo/CLAUDE.md ]; then
  mkdir -p /data/groups/monorepo/logs
  cp /app/nanoclaw/groups/monorepo/CLAUDE.md /data/groups/monorepo/CLAUDE.md
fi

# Start git-sync cron (pull every 15 minutes, push if changes)
(while true; do
  sleep 900
  cd /data/monorepo
  git pull --rebase 2>/dev/null || true
  git add -A && git diff --cached --quiet || git commit -m "bot: sync from nanoclaw" && git push 2>/dev/null || true
  cd /app/nanoclaw
done) &

echo "Starting NanoClaw..."
cd /app/nanoclaw
exec node dist/index.js
```

**Step 4: Write fly.toml**

`automations/nanoclaw/deploy/fly.toml`:

```toml
app = "nanoclaw-bot"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"
  build_target = ""

[build.args]

[[vm]]
  size = "shared-cpu-2x"
  memory = "4096mb"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[mounts]
  source = "nanoclaw_data"
  destination = "/data"

[env]
  NODE_ENV = "production"
  ASSISTANT_NAME = "Claw"
  GROUPS_DIR = "/data/groups"
  STORE_DIR = "/data/store"
```

**Step 5: Write .dockerignore**

`automations/nanoclaw/deploy/.dockerignore`:

```
node_modules
dist
.git
store
groups/*/logs
*.test.ts
vitest.config.ts
.husky
```

**Step 6: Commit**

```bash
cd /home/clsandoval/cs/monorepo
git add automations/nanoclaw/deploy
git commit -m "Add Fly.io deployment config for NanoClaw"
```

---

### Task 6: Deploy to Fly.io

**Step 1: Create the Fly app**

```bash
cd /home/clsandoval/cs/monorepo/automations/nanoclaw
fly apps create nanoclaw-bot
```

**Step 2: Create the volume**

```bash
fly volumes create nanoclaw_data --region sjc --size 10 --app nanoclaw-bot
```

**Step 3: Set secrets**

```bash
fly secrets set ANTHROPIC_API_KEY="<your-key>" --app nanoclaw-bot
fly secrets set TELEGRAM_BOT_TOKEN="<your-token>" --app nanoclaw-bot
fly secrets set GIT_REPO_URL="https://<token>@github.com/clsandoval/monorepo.git" --app nanoclaw-bot
```

**Step 4: Deploy**

```bash
fly deploy --config deploy/fly.toml
```

Expected: App deploys, Docker daemon starts inside the VM, agent image builds on first boot, NanoClaw connects to Telegram.

**Step 5: Check logs**

```bash
fly logs --app nanoclaw-bot
```

Expected: See "Docker daemon ready", "Agent image built", "Starting NanoClaw", and "NanoClaw running (trigger: @Claw)".

**Step 6: Test**

Send a message to the Telegram bot. It should respond.

---

### Task 7: Update monorepo docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Update CLAUDE.md**

Add NanoClaw as a write path under "The Monorepo is the Persistent State":

```markdown
The monorepo is the single source of truth for everything. There is no separate database. Two systems write to it:

1. **NanoClaw Bot (Telegram)** — Lightweight Claude-powered bot on Fly.io. Message it with updates, questions, or raw info. It reads and writes to the monorepo. Bot commits are prefixed with `bot:`. See `automations/nanoclaw/` for setup.

2. **Ingestion Loop (CI/cron)** — A periodic Claude Code job that organizes raw content from `inbox/` into structured entities.
```

**Step 2: Update README.md**

Update the description and automations line to mention NanoClaw.

**Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "Update docs to reference NanoClaw bot"
```

---

## Notes

- The Docker-in-Docker approach on Fly.io requires `shared-cpu-2x` with 4GB RAM minimum — the agent container runs Chromium and Claude Code inside Docker inside the VM.
- The agent image build happens on first boot and takes a few minutes. Subsequent restarts reuse the cached image if the volume persists.
- The Fly.io Dockerfile context is the NanoClaw directory, not the deploy/ subdirectory. The `fly.toml` is in `deploy/` but references `Dockerfile` which should be at the NanoClaw root for proper COPY context.
- The git-sync cron in entrypoint.sh is basic. If you want smarter conflict handling, that can be improved later.
- The 4GB RAM is generous but safe. Can be tuned down after observing actual usage.
