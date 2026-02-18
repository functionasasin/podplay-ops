# OpenClaw Channel Setup

## Telegram (Primary — Daily Briefings)

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`, follow prompts to name it (e.g., "PodPlay Bot")
3. Copy the bot token
4. Set environment variable: `export TELEGRAM_BOT_TOKEN=<your-token>`
5. Run `openclaw onboard` and select Telegram when prompted
6. Get your Telegram user ID (message @userinfobot) and add to `gateway.yaml` → `allowed_users`
7. Start chatting with your bot — the Gateway routes messages to Claude

## WhatsApp (People Comms)

1. Run `openclaw onboard` and select WhatsApp
2. A QR code will display in your terminal / dashboard
3. On your phone: WhatsApp → Settings → Linked Devices → Link a Device → scan QR
4. Once linked, messages to/from the bot number are routed through OpenClaw
5. **Security**: Limit who can message the bot, treat session credentials as passwords

## Outlook (Email Triage)

1. Create a Microsoft app password (Security → App Passwords in your Microsoft account)
2. Set environment variables:
   ```
   export OUTLOOK_EMAIL=you@outlook.com
   export OUTLOOK_APP_PASSWORD=<app-password>
   ```
3. Run `openclaw onboard` and select Email/IMAP
4. Configure IMAP: `outlook.office365.com:993` (SSL)
5. Configure SMTP: `smtp.office365.com:587` (STARTTLS)
6. Enable email skills: `openclaw skill enable email-triage`

## Environment Variables Summary

```bash
# Required
export ANTHROPIC_API_KEY=<your-key>
export TELEGRAM_BOT_TOKEN=<from-botfather>

# When enabling WhatsApp (handled via QR during onboard)

# When enabling Outlook
export OUTLOOK_EMAIL=<your-email>
export OUTLOOK_APP_PASSWORD=<app-password>
```
