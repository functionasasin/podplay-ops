# Git Sync

Keep the local monorepo clone synchronized with the remote.

## Steps

1. `git fetch origin main`
2. If there are remote changes, `git pull --rebase origin main`
3. If there are unpushed local commits, `git push origin main`
4. If there are merge conflicts, do NOT force push. Log the conflict and alert the user via Telegram.

## Rules

- Never force push
- Never discard local changes
- If rebase fails, abort and notify the user
- This runs silently every 15 minutes — only message the user if something goes wrong
