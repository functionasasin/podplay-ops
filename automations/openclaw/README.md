# OpenClaw Bot — Fly.io + Telegram + Monorepo

Always-on AI assistant hosted on [Fly.io](https://fly.io), connected via Telegram, using the **monorepo as persistent state**.

## Architecture

```
You (Telegram) ←→ OpenClaw (Fly.io) ←→ Monorepo (Git)
                        ↓
                   Claude API
```

- **Fly.io** hosts the OpenClaw gateway as an always-on process
- **Telegram** is the primary interface — message the bot anytime
- **Monorepo** is the persistent state layer — every update you give the bot gets written back as structured entities and committed to git
- **Claude** powers the LLM reasoning

## How It Works

1. You message the bot on Telegram: *"Had a meeting with Carlos, we decided to push the wallet launch to April"*
2. The bot parses the update, identifies entities (meeting, Carlos, Digital Wallet project)
3. It creates/updates entity files in the monorepo (`entities/meetings/`, `entities/people/carlos.md`, `entities/projects/digital-wallet.md`)
4. It commits and pushes: `bot: add meeting notes — sync with Carlos 2026-02-19`
5. The monorepo is now up to date — your Obsidian vault, dashboards, and any other tooling that reads the repo sees the changes

## The Monorepo is the State

There is no separate database. The monorepo **is** the bot's memory:
- It reads `entities/` to know the current state of everything
- It writes back to `entities/` when you give it updates
- Git history **is** the changelog
- Bot commits are prefixed with `bot:` so they're easy to distinguish
- A git-sync cron job pulls every 15 minutes so manual edits are picked up too

## Channels

| Channel | Purpose | Status |
|---------|---------|--------|
| Telegram | Always-on conversation, updates, queries, briefings | setup |
| WhatsApp | People comms, meeting follow-ups | planned |
| Outlook | Email triage, calendar integration | planned |

## Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `podplay-briefing` | Cron (8am daily) | Morning PodPlay status report |
| `monorepo-ingest` | Conversational | Parse updates/transcripts → write entities |
| `git-sync` | Cron (every 15min) | Keep local clone in sync with remote |

## Deploy to Fly.io

### Prerequisites

- [Fly.io CLI](https://fly.io/docs/flyctl/install/) installed
- Fly.io account (`fly auth login`)
- Telegram bot token from @BotFather
- Anthropic API key
- GitHub Personal Access Token (for git push from the bot)

### Steps

```bash
cd automations/openclaw

# 1. Create the Fly.io app
fly apps create monorepo-bot

# 2. Create persistent volume for the monorepo clone
fly volumes create monorepo_data --region sjc --size 1

# 3. Set secrets
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  TELEGRAM_BOT_TOKEN=123456:ABC-... \
  GIT_REPO_URL=https://x-access-token:<GITHUB_PAT>@github.com/<user>/monorepo.git

# 4. Deploy
fly deploy

# 5. Check it's running
fly status
fly logs
```

### After Deploy

1. Open Telegram, find your bot (the name you gave @BotFather)
2. Send `/start` or just say hello
3. Try: *"We had a meeting with Carlos today about the wallet launch"*
4. Check the monorepo — the bot should have committed new entity files

### Update Config

```bash
# Edit gateway.yaml, skills, or Dockerfile, then:
fly deploy
```

## File Structure

```
automations/openclaw/
├── README.md              # This file
├── Dockerfile             # Fly.io container image
├── entrypoint.sh          # Startup script (clone repo, start gateway)
├── fly.toml               # Fly.io deployment config
├── gateway.yaml           # OpenClaw gateway + channel + persistence config
├── skills/
│   ├── podplay-briefing/
│   │   ├── skill.yaml     # Daily briefing skill definition
│   │   └── prompt.md      # Briefing prompt template
│   ├── monorepo-ingest/
│   │   ├── skill.yaml     # Ingest skill definition
│   │   └── prompt.md      # Entity extraction + write-back prompt
│   └── git-sync/
│       ├── skill.yaml     # Git sync skill definition
│       └── prompt.md      # Pull/push logic
└── docs/
    └── channel-setup.md   # Per-channel setup instructions
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | Fly.io secret | Claude API access |
| `TELEGRAM_BOT_TOKEN` | Fly.io secret | Telegram bot authentication |
| `GIT_REPO_URL` | Fly.io secret | Monorepo clone URL with PAT for push access |
