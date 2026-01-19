# Ingestion Pipeline Architecture

## Visual Overview

```
                                YOUR LIFE DOMAINS
    ┌──────────────────────────────────────────────────────────────────────┐
    │                                                                      │
    │   CONSULTING              FAMILY BUSINESS           PERSONAL         │
    │   ───────────            ───────────────           ─────────         │
    │   • Client A             • Oyster Sauce            • Home Auto       │
    │     (Email Platform)     • Pot Plate Dist          • Travel          │
    │   • Client B             • PCL Tournaments         • Projects        │
    │     (Context Platform)   • Future: Courts                            │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                         DATA SOURCES                                 │
    │                                                                      │
    │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
    │   │ Gmail   │ │ Outlook │ │ Google  │ │  Zoom   │ │ Google  │       │
    │   │ (mult.) │ │         │ │Calendar │ │         │ │  Meet   │       │
    │   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
    │        │           │           │           │           │            │
    │   Gmail API   Graph API   Calendar API  Zoom API   (via Cal)        │
    │        │           │           │           │           │            │
    └────────┼───────────┼───────────┼───────────┼───────────┼────────────┘
             │           │           │           │           │
             └───────────┴───────────┴───────────┴───────────┘
                                     │
                                     ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      INGESTION ENGINE                                │
    │                                                                      │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                    CRON SCHEDULER                          │    │
    │   │         (runs every 4-6 hours or on-demand)                │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                              │                                       │
    │                              ▼                                       │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                     COLLECTORS                             │    │
    │   │   gmail_collector.py    outlook_collector.py               │    │
    │   │   calendar_collector.py zoom_collector.py                  │    │
    │   │                                                            │    │
    │   │   • OAuth token refresh                                    │    │
    │   │   • Incremental sync (since last run)                      │    │
    │   │   • Rate limit handling                                    │    │
    │   │   • Pagination                                             │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                              │                                       │
    │                              ▼                                       │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                    TRANSFORMERS                            │    │
    │   │                                                            │    │
    │   │   Email → Markdown (body, metadata, attachments)           │    │
    │   │   Event → Markdown (time, attendees, description)          │    │
    │   │   Recording → Transcript (Whisper/Zoom native)             │    │
    │   │   Transcript → Summary (Claude API)                        │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                              │                                       │
    │                              ▼                                       │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                   DOMAIN TAGGER                            │    │
    │   │                                                            │    │
    │   │   Analyzes content → assigns domain tag:                   │    │
    │   │   • consulting/client-a                                    │    │
    │   │   • consulting/client-b                                    │    │
    │   │   • family-biz/oyster-sauce                                │    │
    │   │   • family-biz/pickleball                                  │    │
    │   │   • family-biz/pcl-tournament                              │    │
    │   │   • personal/home                                          │    │
    │   │   • personal/travel                                        │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      KNOWLEDGE BASE                                  │
    │                   (This Repository)                                  │
    │                                                                      │
    │   /inbox/                  Raw dumps, unprocessed                    │
    │       └── 2025-01-19-zoom-meeting.json                              │
    │                                                                      │
    │   /data/                   Processed, structured                     │
    │       ├── emails/                                                    │
    │       │   ├── gmail-personal/                                       │
    │       │   ├── gmail-work/                                           │
    │       │   └── outlook/                                              │
    │       ├── calendar/                                                  │
    │       │   └── 2025-01/                                              │
    │       ├── transcripts/                                               │
    │       │   └── 2025-01-15-pcl-planning.md                            │
    │       └── people/                                                    │
    │           ├── john-doe.md                                           │
    │           └── maria-santos.md                                       │
    │                                                                      │
    │   /meetings/               Meeting notes by project                  │
    │       ├── consulting/                                               │
    │       ├── pcl/                                                      │
    │       └── oyster-sauce/                                             │
    │                                                                      │
    │   /projects/               Active project context                    │
    │       ├── client-a-email-platform/                                  │
    │       ├── client-b-context-platform/                                │
    │       ├── pcl-tournament-2025/                                      │
    │       └── pickleball-building/                                      │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                    ORGANIZATION ENGINE                               │
    │               (Convergent Loop from claude.md)                       │
    │                                                                      │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                  DAILY ORGANIZER                           │    │
    │   │                                                            │    │
    │   │   1. Scan /inbox/ for new items                            │    │
    │   │   2. Classify and move to appropriate location             │    │
    │   │   3. Extract entities (people, projects, dates)            │    │
    │   │   4. Update people registry                                │    │
    │   │   5. Link related items                                    │    │
    │   │   6. Repeat until stable (convergent)                      │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                              │                                       │
    │                              ▼                                       │
    │   ┌────────────────────────────────────────────────────────────┐    │
    │   │                 SUMMARY GENERATOR                          │    │
    │   │                                                            │    │
    │   │   • Daily digest: What happened today                      │    │
    │   │   • Weekly rollup: Key events, action items                │    │
    │   │   • Project status: Per-project summaries                  │    │
    │   │   • People activity: Who's active, pending items           │    │
    │   └────────────────────────────────────────────────────────────┘    │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      RETRIEVAL LAYER                                 │
    │                                                                      │
    │   ┌─────────────────────┐    ┌─────────────────────┐                │
    │   │    Claude Code      │    │   Text Search       │                │
    │   │   (This Session)    │    │  (grep/ripgrep)     │                │
    │   │                     │    │                     │                │
    │   │ "Who is handling    │    │ rg "John Doe"       │                │
    │   │  Cebu qualifiers?"  │    │ rg "PCL.*2025"      │                │
    │   └─────────────────────┘    └─────────────────────┘                │
    │                                                                      │
    │   ┌─────────────────────┐    ┌─────────────────────┐                │
    │   │  Semantic Search    │    │   Weekly Reports    │                │
    │   │  (Optional: embed)  │    │   (Auto-generated)  │                │
    │   │                     │    │                     │                │
    │   │ "What's the status  │    │ /data/summaries/    │                │
    │   │  of tournament      │    │   2025-w03.md       │                │
    │   │  planning?"         │    │                     │                │
    │   └─────────────────────┘    └─────────────────────┘                │
    │                                                                      │
    └──────────────────────────────────────────────────────────────────────┘
```

## API Integration Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API CONNECTIONS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GOOGLE CLOUD                          MICROSOFT AZURE                      │
│  ─────────────                         ───────────────                      │
│  console.cloud.google.com              portal.azure.com                     │
│                                                                             │
│  ┌─────────────────────┐               ┌─────────────────────┐             │
│  │ Gmail API           │               │ Microsoft Graph API │             │
│  │ • gmail.readonly    │               │ • Mail.Read         │             │
│  │ • gmail.labels      │               │ • Calendars.Read    │             │
│  └─────────────────────┘               └─────────────────────┘             │
│                                                                             │
│  ┌─────────────────────┐                                                   │
│  │ Calendar API        │               ZOOM MARKETPLACE                    │
│  │ • calendar.readonly │               ────────────────                    │
│  │ • calendar.events   │               marketplace.zoom.us                 │
│  └─────────────────────┘                                                   │
│                                        ┌─────────────────────┐             │
│                                        │ Zoom API            │             │
│  ANTHROPIC                             │ • meeting:read      │             │
│  ─────────                             │ • recording:read    │             │
│  console.anthropic.com                 │ • user:read         │             │
│                                        └─────────────────────┘             │
│  ┌─────────────────────┐                                                   │
│  │ Claude API          │                                                   │
│  │ • Summarization     │                                                   │
│  │ • Entity extraction │                                                   │
│  │ • Classification    │                                                   │
│  └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: New Meeting

```
┌──────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE: PCL Planning Meeting with John Doe                             │
└──────────────────────────────────────────────────────────────────────────┘

1. CAPTURE
   ┌─────────────────┐
   │ Zoom Meeting    │ ──→ Recording uploaded to Zoom Cloud
   │ Jan 19, 10:00am │     Transcript generated automatically
   └─────────────────┘

2. COLLECT (Cron runs)
   ┌─────────────────┐     ┌────────────────────────────────────┐
   │ zoom_collector  │ ──→ │ /inbox/2025-01-19-pcl-planning.json│
   │ fetches new     │     │ {                                  │
   │ recordings      │     │   "meeting_id": "abc123",          │
   └─────────────────┘     │   "topic": "PCL Cebu Planning",    │
                           │   "participants": ["John Doe"],     │
                           │   "transcript": "...",              │
                           │   "recording_url": "..."            │
                           │ }                                   │
                           └────────────────────────────────────┘

3. TRANSFORM
   ┌─────────────────┐     ┌────────────────────────────────────┐
   │ Claude API      │ ──→ │ Summary:                           │
   │ summarizes      │     │ - Discussed venue options for Cebu │
   │ transcript      │     │ - John to confirm SM Seaside       │
   └─────────────────┘     │ - Budget: PHP 50,000               │
                           │ - Next meeting: Jan 25             │
                           └────────────────────────────────────┘

4. TAG
   ┌─────────────────┐
   │ Domain Tagger   │ ──→ domain: family-biz/pcl-tournament
   │ identifies PCL  │     project: pcl-cebu-2025
   │ keywords        │     people: [john-doe]
   └─────────────────┘

5. STORE
   ┌──────────────────────────────────────────────────────────────┐
   │ /meetings/pcl/2025-01-19-cebu-planning.md                    │
   │                                                               │
   │ # PCL Cebu Planning - Jan 19, 2025                           │
   │                                                               │
   │ **Attendees**: John Doe                                       │
   │ **Domain**: family-biz/pcl-tournament                        │
   │                                                               │
   │ ## Summary                                                    │
   │ - Discussed venue options for Cebu qualifiers                │
   │ - John to confirm SM Seaside availability                    │
   │ - Budget: PHP 50,000                                          │
   │                                                               │
   │ ## Action Items                                               │
   │ - [ ] John: Confirm venue by Jan 22                          │
   │ - [ ] Follow up on sponsor commitments                       │
   │                                                               │
   │ ## Full Transcript                                            │
   │ [collapsed/linked]                                            │
   └──────────────────────────────────────────────────────────────┘

6. UPDATE REGISTRY
   ┌──────────────────────────────────────────────────────────────┐
   │ /data/people/john-doe.md                                     │
   │                                                               │
   │ ## Recent Activity                                            │
   │ - 2025-01-19: PCL Cebu Planning meeting                      │
   │   - Action: Confirm SM Seaside venue                         │
   └──────────────────────────────────────────────────────────────┘
```

## Quick Start Checklist

```
□ PHASE 1: API Setup (Do First)
  □ Create Google Cloud Project
  □ Enable Gmail API + Calendar API
  □ Create OAuth credentials
  □ Register Azure App
  □ Enable Graph API permissions
  □ Create Zoom Server-to-Server OAuth app

□ PHASE 2: First Collector
  □ Set up /automations/ directory
  □ Write gmail_collector.py
  □ Test OAuth flow
  □ Verify emails land in /inbox/

□ PHASE 3: Transform & Tag
  □ Write email-to-markdown transformer
  □ Implement domain tagging rules
  □ Process first batch

□ PHASE 4: Expand
  □ Add Outlook collector
  □ Add Calendar collector
  □ Add Zoom collector
  □ Enable transcription

□ PHASE 5: Organize
  □ Build convergent organizer
  □ Auto-generate people registry
  □ Weekly summary generator
```
