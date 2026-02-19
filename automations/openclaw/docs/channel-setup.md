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

## WhatsApp (People Comms — Always-On Conversation)

WhatsApp runs via Baileys (WhatsApp Web protocol). It connects your phone number to the bot so you can message it from WhatsApp just like Telegram. OpenClaw recommends using a separate/dedicated phone number.

### Pair Your Phone

1. SSH into your Fly.io instance or run locally:
   ```bash
   fly ssh console
   openclaw channels login --channel whatsapp
   ```
2. Scan the QR code from your WhatsApp app (Settings → Linked Devices → Link a Device)
3. Credentials are stored in the persistent volume at `/app/monorepo/.openclaw/credentials/whatsapp/`

### Access Control

By default `dmPolicy` is set to `pairing` — unknown senders get a pairing code challenge before they can chat with the bot. To lock it down to specific numbers:

```yaml
# In gateway.yaml
channels:
  whatsapp:
    dmPolicy: allowlist
    allowFrom:
      - "+1XXXXXXXXXX"
```

### Manage Pairing

```bash
# List pending pairing requests
openclaw pairing list whatsapp

# Approve a specific request
openclaw pairing approve whatsapp <CODE>
```

### Use It

Same as Telegram — message the bot to give updates, dump transcripts, ask questions, or log decisions. Everything gets persisted as entities in the monorepo.

## Outlook (Email Ingestion — Twice Daily)

The bot connects to your Outlook inbox via IMAP and ingests emails twice a day (9am and 6pm). It extracts people, meetings, action items, and decisions into monorepo entities. Newsletters and automated notifications are skipped.

### Setup

1. Go to your Microsoft account → Security → App Passwords
2. Create a new app password (you can't use your regular password for IMAP)
3. Set Fly.io secrets:
   ```bash
   fly secrets set OUTLOOK_EMAIL=you@outlook.com OUTLOOK_APP_PASSWORD=<app-password>
   ```
4. Redeploy: `fly deploy`

### What gets ingested

- **New contacts** → `entities/people/` (name, email, last_contact)
- **Meeting invites/recaps** → `entities/meetings/` (attendees, agenda, action items)
- **Project updates** → appended to existing `entities/projects/`
- **Action items** → flagged in relevant entity files
- **Travel/event info** → `entities/trips/` or `entities/events/`

### What gets skipped

- Newsletters and marketing emails
- Automated notifications (GitHub, Jira, CI)
- Spam
- Emails with no actionable content

### Schedule

| Run | Time | Purpose |
|-----|------|---------|
| Morning | 9:00 AM | Catch overnight and early emails |
| Evening | 6:00 PM | Catch afternoon emails |

If something time-sensitive is found, the bot sends a summary to Telegram.

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

# WhatsApp — no secrets needed, pair via QR code:
# fly ssh console → openclaw channels login --channel whatsapp
```
