# NanoClaw Setup Design

## Summary

Replace OpenClaw with NanoClaw as the monorepo's Telegram bot assistant. Deploy to Fly.io, connect to existing Telegram bot, start with basic read/write access to the monorepo.

## Architecture

```
Fly.io (nanoclaw-bot)
├── NanoClaw Node.js process
├── SQLite (message history, persisted on volume)
├── Docker-in-Docker for container isolation
└── Volume mount
    └── /app/monorepo (git clone of monorepo)
        └── entities/, inbox/, etc.
```

Message flow: Telegram → NanoClaw polling → SQLite → Container (Claude Agent SDK) → reads/writes monorepo files → responds on Telegram

## Fly.io Configuration

- App name: `nanoclaw-bot`
- Region: `sjc`
- VM: `shared-cpu-2x`, 2GB RAM
- Volume: `nanoclaw_data` for SQLite + monorepo clone

## Secrets

- `ANTHROPIC_API_KEY`
- `TELEGRAM_BOT_TOKEN` (reusing existing bot)
- `GIT_REPO_URL` (with auth token for push access)

## Files

```
automations/nanoclaw/
├── Dockerfile          # Node 20 + Docker-in-Docker + NanoClaw source
├── fly.toml            # Fly.io config
├── .dockerignore
├── entrypoint.sh       # Clone repo, start git-sync cron, start NanoClaw
└── group-claude.md     # Template CLAUDE.md for the monorepo group
```

## Group CLAUDE.md

Minimal — tells the bot it's an assistant for the monorepo, can read/write entities, keep responses concise. No entity extraction skills yet.

## Git Sync

Cron inside the container pulls the repo periodically and pushes any changes the bot makes.

## Out of Scope (for now)

- Entity extraction skills
- Email ingest
- Podplay briefings
- Scheduled tasks
