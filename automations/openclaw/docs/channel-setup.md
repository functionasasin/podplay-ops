# OpenClaw Channel Setup

## Telegram (Primary — Always-On Conversation)

The bot runs on Fly.io and is always listening on Telegram. You can message it anytime to give updates, ask questions, or dump information. It writes everything back to the monorepo.

### Create the Bot

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`, follow prompts to name it (e.g., "Monorepo Bot")
3. Copy the bot token
4. Set as Fly.io secret: `fly secrets set TELEGRAM_BOT_TOKEN=<your-token>`

### Lock Down Access

5. Get your Telegram user ID (message @userinfobot)
6. Add to `gateway.yaml` → `channels.telegram.allowed_users`
7. Redeploy: `fly deploy`

### Use It

- **Give an update**: "We had a meeting with Carlos, decided to push launch to April"
- **Dump a transcript**: Paste a meeting transcript, the bot extracts entities
- **Ask a question**: "What's the status of the digital wallet project?"
- **Log a decision**: "We're going with Stripe for payments"
- **Morning briefing**: Arrives automatically at 8am via cron

Everything you tell the bot gets persisted as entities in the monorepo.

## WhatsApp (People Comms — Planned)

1. Run `openclaw onboard` and select WhatsApp
2. Scan QR code from terminal
3. Once linked, messages route through OpenClaw
4. **Security**: Limit who can message the bot

## Outlook (Email Triage — Planned)

1. Create a Microsoft app password
2. Set Fly.io secrets:
   ```
   fly secrets set OUTLOOK_EMAIL=you@outlook.com OUTLOOK_APP_PASSWORD=<app-password>
   ```
3. Enable in `gateway.yaml` and redeploy

## Secrets Summary

All secrets are set via `fly secrets set` — never committed to the repo.

```bash
# Required
fly secrets set ANTHROPIC_API_KEY=<your-key>
fly secrets set TELEGRAM_BOT_TOKEN=<from-botfather>
fly secrets set GIT_REPO_URL=https://x-access-token:<PAT>@github.com/<user>/monorepo.git

# When enabling Outlook
fly secrets set OUTLOOK_EMAIL=<your-email>
fly secrets set OUTLOOK_APP_PASSWORD=<app-password>
```
