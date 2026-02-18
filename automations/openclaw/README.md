# OpenClaw Bot Setup

Self-hosted AI assistant using [OpenClaw](https://github.com/openclaw/openclaw) connected to messaging platforms for daily briefings and triage.

## Channels

| Channel | Purpose | Status |
|---------|---------|--------|
| Telegram | Daily briefings, quick commands | setup |
| WhatsApp | People comms, meeting follow-ups | planned |
| Outlook | Email triage, calendar integration | planned |

## First Use Case: PodPlay Daily Briefing

Every morning via Telegram — a status report on Pod Play SEA covering:
- Current project status and blockers
- Upcoming meetings and who to message
- Action items needing attention
- Payment/legal/deployment status

## Setup Steps

1. Install OpenClaw: `curl -fsSL https://get.openclaw.ai | bash`
2. Run onboarding: `openclaw onboard`
3. Configure LLM provider (Anthropic recommended)
4. Connect Telegram via BotFather token
5. Import the gateway config: `openclaw config import gateway.yaml`
6. Import the briefing skill: `openclaw skill install ./skills/podplay-briefing`
7. Start the gateway: `openclaw start`

## File Structure

```
automations/openclaw/
├── README.md              # This file
├── gateway.yaml           # Gateway and channel configuration
├── skills/
│   └── podplay-briefing/
│       ├── skill.yaml     # Skill definition
│       └── prompt.md      # Briefing prompt template
└── docs/
    └── channel-setup.md   # Detailed setup instructions per channel
```
