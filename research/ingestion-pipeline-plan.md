# Personal Ingestion Pipeline Plan

## Current State Summary

**Your Life Domains:**
1. **Software Consulting** (2 clients)
   - Client A: Email automation platform
   - Client B: Open source unified context platform (Claude Agent SDK wrapper + adapter layer)

2. **Personal Projects**
   - Home automation system (local hardware + camera for home monitoring)

3. **Family Business**
   - Oyster sauce sales
   - Sports software distribution (Pot Plate)
   - PCL (Pickleball Champions League) tournament organization
     - Qualifiers: Cebu, Davao
     - Winners → China finals
   - Future: 18-20 court, 10-story pickleball building (3-year horizon)

**Pain Points:**
- Tracking people, responsibilities, org charts
- Managing timelines across multiple ventures
- No meeting transcripts/recordings
- Context scattered across too many places
- Hard to keep family business context in head

---

## Data Sources & Required Integrations

### Tier 1: Email (High Priority)

| Source | API | Auth Method | What You Get |
|--------|-----|-------------|--------------|
| Gmail (multiple accounts) | Gmail API | OAuth 2.0 | Emails, threads, labels, attachments |
| Outlook | Microsoft Graph API | OAuth 2.0 (Azure AD) | Emails, folders, attachments |

**Gmail API Setup:**
- Google Cloud Console → Create Project → Enable Gmail API
- OAuth consent screen → Add scopes: `gmail.readonly`, `gmail.labels`
- Create OAuth 2.0 credentials
- Rate limits: 250 quota units/user/second

**Microsoft Graph API Setup:**
- Azure Portal → App Registration
- API Permissions: `Mail.Read`, `Mail.ReadBasic`
- OAuth 2.0 with PKCE or client credentials
- Rate limits: 10,000 requests/10 minutes

### Tier 2: Calendar & Meetings (High Priority)

| Source | API | Auth Method | What You Get |
|--------|-----|-------------|--------------|
| Google Calendar | Google Calendar API | OAuth 2.0 | Events, attendees, descriptions |
| Outlook Calendar | Microsoft Graph API | OAuth 2.0 | Events, attendees, meeting links |
| Zoom | Zoom API | OAuth 2.0 or JWT | Meeting metadata, recordings, transcripts |
| Google Meet | Google Calendar API | OAuth 2.0 | Meeting links (recordings via Google Workspace) |

**Zoom API Setup:**
- Zoom Marketplace → Create Server-to-Server OAuth App
- Scopes: `meeting:read`, `recording:read`, `cloud_recording:read`
- Can fetch: past meetings, participants, recordings, transcripts (if enabled)
- Rate limits: 30 requests/second

**Meeting Transcription Options:**
1. **Zoom native** - Enable cloud recording + transcription
2. **Google Meet** - Requires Google Workspace, enable recording
3. **Third-party**: Otter.ai, Fireflies.ai (both have APIs)
4. **Self-hosted**: Whisper API on local hardware

### Tier 3: Communication (Explicitly Excluded)

- ❌ Messenger
- ❌ Instagram
- ❌ Telegram

### Tier 4: Future/Optional

| Source | API | Notes |
|--------|-----|-------|
| Notion | Notion API | If you use it for project management |
| Linear/Jira | REST APIs | Issue tracking |
| GitHub | GitHub API | Code activity, PRs, issues |
| Bank/Finance | Plaid API | Transaction data |
| Home Automation | Local API | Camera feeds, sensor data |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INGESTION PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Gmail     │  │  Outlook    │  │   Zoom      │  │  Calendar   │        │
│  │  (OAuth)    │  │  (Graph)    │  │  (OAuth)    │  │  (Google)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        COLLECTOR LAYER                               │   │
│  │  • Cron job (daily/hourly)                                          │   │
│  │  • Fetch new items since last sync                                  │   │
│  │  • Handle pagination, rate limits                                   │   │
│  │  • Store raw data with timestamps                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TRANSFORMER LAYER                             │   │
│  │  • Normalize formats (email → markdown, events → markdown)          │   │
│  │  • Extract entities (people, companies, dates)                      │   │
│  │  • Tag by domain (consulting, family-biz, personal)                 │   │
│  │  • Generate summaries (Claude API for long emails/transcripts)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         STORAGE LAYER                                │   │
│  │                                                                      │   │
│  │   /inbox/           Raw dumps, unprocessed items                    │   │
│  │   /data/emails/     Processed emails by account/date                │   │
│  │   /data/calendar/   Events and meetings                             │   │
│  │   /data/transcripts/ Meeting transcripts                            │   │
│  │   /meetings/        Meeting notes (manual + auto-generated)         │   │
│  │   /projects/        Project context (auto-organized)                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ORGANIZATION LAYER                              │   │
│  │  • Convergent loop (from claude.md)                                 │   │
│  │  • Entity extraction → people registry                              │   │
│  │  • Auto-link related items                                          │   │
│  │  • Generate weekly/monthly summaries                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       RETRIEVAL LAYER                                │   │
│  │  • Claude Code (this tool) for queries                              │   │
│  │  • Full-text search (grep/ripgrep on markdown)                      │   │
│  │  • Optional: Embedding search for semantic queries                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Approach (No-Code / Low-Code First)

### Phase 1: Quick Wins with Existing Tools

**Option A: n8n (Self-Hosted)**
```
n8n workflow:
  Trigger: Cron (every 6 hours)
  → Gmail Node (fetch new emails)
  → Transform (extract body, metadata)
  → Write to File (markdown in /data/emails/)

  Trigger: Cron (daily)
  → Google Calendar Node (fetch events)
  → Transform (format as markdown)
  → Write to File (/data/calendar/)
```

**Option B: Make.com (Hosted)**
- Simpler setup, no infrastructure
- Integrations: Gmail, Outlook, Zoom, Google Calendar
- Webhooks to push to your repo or local storage

**Option C: Zapier (Hosted)**
- Similar to Make.com
- Better Gmail/Outlook native support
- More expensive at scale

### Phase 2: Custom Collectors (Python Scripts)

```
/automations/
  ├── collectors/
  │   ├── gmail_collector.py      # Gmail API client
  │   ├── outlook_collector.py    # Graph API client
  │   ├── zoom_collector.py       # Zoom API client
  │   └── calendar_collector.py   # Google Calendar client
  ├── transformers/
  │   ├── email_to_markdown.py
  │   ├── event_to_markdown.py
  │   └── transcript_processor.py
  ├── config/
  │   ├── credentials.json        # OAuth tokens (gitignored)
  │   └── sources.yaml            # Data source config
  └── run_ingestion.py            # Main cron entry point
```

### Phase 3: Daily Cron Job

```bash
# crontab -e
0 6 * * * /path/to/run_ingestion.py --all
0 */4 * * * /path/to/run_ingestion.py --emails-only
```

---

## People & Organization Tracking

Your pain point about tracking people, responsibilities, and org charts:

### Auto-Generated People Registry

```markdown
# /data/people/john-doe.md

## John Doe
- **Email**: john@example.com
- **Domain**: Family Business (Pickleball)
- **Role**: Tournament Coordinator, Cebu
- **First Contact**: 2024-03-15
- **Last Contact**: 2024-12-20

### Related Items
- [Meeting: PCL Cebu Qualifiers Planning](../meetings/2024-12-15-pcl-cebu.md)
- [Email Thread: Venue Booking](../data/emails/2024-12/pcl-venue-thread.md)

### Notes
- Prefers WhatsApp for quick updates
- Has connections with local government for permits
```

### Domain Tagging System

```yaml
# /automations/config/domains.yaml
domains:
  consulting:
    keywords: ["client", "invoice", "deliverable", "sprint"]
    senders: ["@clienta.com", "@clientb.com"]

  family-business:
    keywords: ["oyster", "pickleball", "PCL", "pot plate", "tournament"]
    senders: ["@familybiz.com"]

  personal:
    keywords: ["trip", "vacation", "home"]
    senders: ["personal contacts list"]
```

---

## Meeting Transcription Strategy

Since you mentioned this is a "big miss":

### Option 1: Zoom Native (Easiest)
1. Enable cloud recording in Zoom settings
2. Enable auto-transcription
3. Collector fetches transcripts via Zoom API
4. Store in `/data/transcripts/`

### Option 2: Otter.ai / Fireflies.ai
- Integrates with Zoom, Meet, Teams
- Automatic transcription + AI summaries
- API to pull transcripts
- ~$20-30/month

### Option 3: Self-Hosted (Your Local Hardware)
```
Meeting Audio → Whisper (local) → Transcript → Claude (summary) → Markdown
```
- Uses your existing home hardware
- No data leaves your network
- Requires manual audio upload or Zoom integration

### Recommended Approach
1. **Short term**: Enable Zoom cloud recording + transcription
2. **Medium term**: Otter.ai for cross-platform coverage
3. **Long term**: Self-hosted Whisper on your home server

---

## Recommended Implementation Order

### Week 1-2: Foundation
- [ ] Set up Google Cloud Project, enable APIs
- [ ] Set up Azure App Registration for Outlook
- [ ] Create `/automations/` structure
- [ ] Write first collector (Gmail - simplest)

### Week 3-4: Email Ingestion
- [ ] Gmail collector with OAuth flow
- [ ] Outlook collector with Graph API
- [ ] Email-to-markdown transformer
- [ ] Basic domain tagging

### Week 5-6: Calendar & Meetings
- [ ] Google Calendar collector
- [ ] Zoom collector (metadata + recordings)
- [ ] Enable Zoom transcription
- [ ] Meeting summary generator (Claude API)

### Week 7-8: Organization & Retrieval
- [ ] People registry auto-generation
- [ ] Convergent organization loop
- [ ] Weekly summary generator
- [ ] Search/retrieval optimization

---

## API Credentials You'll Need

| Service | Portal | Key Items |
|---------|--------|-----------|
| Google (Gmail, Calendar) | [console.cloud.google.com](https://console.cloud.google.com) | OAuth 2.0 Client ID, Client Secret |
| Microsoft (Outlook) | [portal.azure.com](https://portal.azure.com) | App ID, Client Secret, Tenant ID |
| Zoom | [marketplace.zoom.us](https://marketplace.zoom.us) | Account ID, Client ID, Client Secret |
| Claude API | [console.anthropic.com](https://console.anthropic.com) | API Key |

---

## Cost Estimate (Monthly)

| Component | Cost |
|-----------|------|
| Google Cloud (APIs) | Free tier (Gmail/Calendar quotas sufficient) |
| Azure (Graph API) | Free tier |
| Zoom API | Free with Zoom subscription |
| Claude API | ~$5-20 depending on summarization volume |
| n8n (self-hosted) | Free |
| **OR** Make.com | ~$20-50 |
| Otter.ai (optional) | ~$20 |
| **Total** | $5-90/month depending on choices |

---

## Questions to Decide

1. **Self-hosted vs. cloud automation?**
   - n8n on your home server (free, private)
   - Make.com/Zapier (easier, hosted)

2. **Transcription approach?**
   - Zoom native only
   - Third-party (Otter.ai)
   - Self-hosted Whisper

3. **How many Gmail accounts?**
   - Affects OAuth setup (one per account or service account)

4. **Real-time vs. batch?**
   - Webhooks (instant) vs. cron (every X hours)
   - Recommendation: Start with cron, add webhooks for critical items

5. **Storage location?**
   - This repo (git-backed, version controlled)
   - Separate data repo (larger storage)
   - Cloud storage (S3/GCS)
