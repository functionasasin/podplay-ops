# Spec: User Stories Index — Cheerful Platform

**Synthesized from:** All Wave 1 and Wave 2 analyses, plus Wave 3 synthesis specs
**Date:** 2026-02-26

---

## Overview

This document is the complete user stories index for the Cheerful platform — an AI-powered influencer outreach and campaign management system. Every story is grounded in observable codebase evidence. Stories map features to user intent and include acceptance criteria with specific spec section references for traceability.

---

## Personas

| ID | Persona | Description | Primary Platform Surface |
|----|---------|-------------|--------------------------|
| **BM** | Brand Manager | Creates campaigns, sets strategy, monitors ROI. May not operate the inbox day-to-day. | Campaign wizard, dashboard, reporting |
| **CO** | Campaign Operator | Day-to-day inbox worker. Processes creator replies, reviews AI drafts, manages creator relationships. | Mail inbox, thread view, draft editor |
| **TA** | Team Admin | Manages user accounts, assigns campaigns to team members, controls access. | Settings → team management |
| **CR** | Creator | A content creator using the platform (creator campaign mode) — receives and manages incoming brand deals. | Campaign inbox (reversed flow) |
| **BO** | Brand Owner / Client | External stakeholder who receives campaign performance summaries. Not a platform user — receives AI-generated reports. | (Receives shareable summary links) |

---

## Epic Index

| # | Epic | Primary Persona | # Stories |
|---|------|-----------------|-----------|
| 1 | Account Setup & Onboarding | BM, TA | 6 |
| 2 | Campaign Creation | BM | 14 |
| 3 | Creator Discovery & Enrichment | BM, CO | 8 |
| 4 | Inbox & Thread Management | CO | 12 |
| 5 | AI Assistance & Automation | CO, BM | 10 |
| 6 | Gifting & Fulfillment Pipeline | CO, BM | 7 |
| 7 | Post Tracking | BM, CO | 4 |
| 8 | Reporting & Analytics | BM, BO | 6 |
| 9 | Team & Access Management | TA | 6 |
| 10 | Integrations Setup | BM | 7 |
| 11 | Creator Campaign (Reverse Flow) | CR | 4 |
| 12 | Context Engine (Internal Team) | CO, BM | 5 |

**Total: 89 stories**

---

## Epic 1: Account Setup & Onboarding

### US-1.1 — Email Account Connection (Gmail)
**As a** Brand Manager,
**I want to** connect my Gmail accounts to Cheerful via OAuth,
**so that** outreach emails are sent from my real brand inbox and creator replies land in Cheerful automatically.

**Acceptance Criteria:**
- OAuth 2.0 flow completes in-app (no external redirect needed for the user)
- Refresh tokens are encrypted before storage (`crypto_service.encrypt()`)
- Connected account appears in sender account list for campaign setup
- Account shows "active" status after verification

**Priority:** Critical (no campaigns possible without connected email)
**Spec refs:** `spec-integrations.md` §Gmail, `spec-data-model.md` §user_gmail_account, `auth-permissions.md` §2.1

---

### US-1.2 — Email Account Connection (SMTP)
**As a** Brand Manager,
**I want to** connect a non-Gmail email account via SMTP/IMAP credentials,
**so that** teams using Outlook, G Suite app passwords, or custom mail servers can also run campaigns.

**Acceptance Criteria:**
- User provides SMTP host, port, username, password, TLS preference
- System tests connection before saving credentials
- TLS mode auto-selected: port 465 → implicit SSL; other ports → STARTTLS
- IMAP credentials stored separately (may differ from SMTP)
- Connected account available as campaign sender

**Priority:** High (enterprise accounts on Outlook)
**Spec refs:** `spec-integrations.md` §SMTP/IMAP, `spec-data-model.md` §user_smtp_account

---

### US-1.3 — Guided Onboarding Flow
**As a** new Brand Manager,
**I want to** complete a structured onboarding after sign-up,
**so that** I know how to connect my first email account and understand the platform before I'm dropped into the full UI.

**Acceptance Criteria:**
- Incomplete onboarding is detected via `user_onboarding.onboarding_completed` flag
- Unauthenticated users who sign up are directed to `/onboarding` before `/mail`
- Onboarding completion cached in httpOnly cookie (1-year TTL) to avoid repeated DB checks
- Users cannot access main app routes until onboarding is complete

**Priority:** High
**Spec refs:** `spec-webapp.md` §auth gate, `auth-permissions.md` §4

---

### US-1.4 — Sign-In / Sign-Up
**As a** Brand Manager or Campaign Operator,
**I want to** sign in with email/password or Google OAuth,
**so that** my account is secured and I can access my campaigns.

**Acceptance Criteria:**
- Single email field that dynamically detects sign-in vs sign-up mode
- Google OAuth option available alongside email/password
- CSRF token validated on all form submissions
- Email verification required for new sign-up (magic link)
- Invited team members use a "set password" flow, not standard sign-up

**Priority:** Critical
**Spec refs:** `auth-permissions.md` §2.1–2.5, `spec-webapp.md` §auth

---

### US-1.5 — Password Recovery
**As a** Brand Manager,
**I want to** recover access to my account if I forget my password,
**so that** I'm not locked out of live campaigns.

**Acceptance Criteria:**
- "Forgot password" link on sign-in page
- Recovery email sent within 60 seconds
- Password reset link expires after single use
- After reset, user can optionally invalidate all other active sessions

**Priority:** Medium
**Spec refs:** `auth-permissions.md` §2.4

---

### US-1.6 — User Settings
**As a** Brand Manager,
**I want to** configure my notification preferences and connected integrations from a settings page,
**so that** the platform behaves according to my workflow needs.

**Acceptance Criteria:**
- Settings page at `/settings` with sections: email accounts, team, integrations
- Gmail/SMTP account list with add/remove controls
- Google Sheets service account setup (paste service account JSON or email)
- PostHog session recording paused on the settings page (privacy)

**Priority:** Medium
**Spec refs:** `spec-webapp.md` §settings routes, `spec-integrations.md` §Google Sheets

---

## Epic 2: Campaign Creation

### US-2.1 — Campaign Type Selection
**As a** Brand Manager,
**I want to** select my campaign type (gifting, paid promotion, sales, creator) at the start of the wizard,
**so that** subsequent steps are tailored to my campaign goals and I'm not shown irrelevant fields.

**Acceptance Criteria:**
- Step 0 presents role/type selector before any other fields
- Type selection determines wizard step count (creator: 3 steps; sales: 9; advertiser: 10)
- Paid promotion type reveals step 3b (deliverables) not shown for other types
- Creator campaigns skip steps 3, 4, 5, 6 (no outreach, no email template)

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §campaign wizard, `campaign-lifecycle.md` §wizard state machine

---

### US-2.2 — Campaign Name & Email Account Setup
**As a** Brand Manager,
**I want to** name my campaign and select which Gmail accounts should send outreach,
**so that** outgoing emails come from the right brand sender and I can identify the campaign at a glance.

**Acceptance Criteria:**
- Campaign name field is required (non-empty)
- Email account selector shows all connected and active Gmail/SMTP accounts
- AI suggests matching email accounts based on campaign name (optional, can dismiss)
- Multiple senders can be selected (round-robin distribution across senders at queue time)
- Draft auto-saved on step transition (`POST /campaigns/draft`)

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §step 1, `campaign-lifecycle.md` §wizard AI assistance, `spec-workflows.md` §outbox queue

---

### US-2.3 — Product Information (AI-Assisted)
**As a** Brand Manager,
**I want to** enter the product I'm promoting and optionally have the product description scraped from a URL,
**so that** my campaign emails accurately describe the product without manual copy-paste.

**Acceptance Criteria:**
- Product URL field triggers Firecrawl scrape on blur (async, non-blocking)
- Scraped name + description pre-populate product fields (user can override)
- Product image uploadable (JPEG/PNG/GIF/WEBP, max enforced)
- Existing products selectable from dropdown (eliminates duplication across campaigns)
- For paid promotion campaigns: deliverables field appears (step 3b)

**Priority:** High
**Spec refs:** `spec-webapp.md` §step 2, `spec-integrations.md` §Firecrawl, `campaign-lifecycle.md` §phase 1

---

### US-2.4 — Creator List Import (CSV)
**As a** Brand Manager,
**I want to** import a CSV file of creators with their emails and custom fields,
**so that** I can run outreach to my existing creator list without manual data entry.

**Acceptance Criteria:**
- CSV upload validates presence of `email` column on parse
- Case-insensitive email deduplication within CSV
- Rows with invalid format shown as "skipped rows" with count
- Custom fields in CSV columns map to `{placeholder}` tags in email templates
- Creators without `@` in email stored with sentinel prefix for later enrichment (not immediately rejected)

**Priority:** Critical
**Spec refs:** `campaign-lifecycle.md` §launch step 3, `spec-backend-api.md` §campaign launch, `spec-data-model.md` §campaign_recipient

---

### US-2.5 — Creator Search & Discovery
**As a** Brand Manager,
**I want to** search for Instagram creators by keyword and add them directly to a campaign,
**so that** I can build a creator list without manually compiling spreadsheets.

**Acceptance Criteria:**
- Keyword search returns Instagram profiles via Apify
- Results show: username, follower count, category, bio, profile image
- Selected creators added to campaign recipient list
- Creators without confirmed emails are flagged for enrichment (email found post-launch)
- "Find similar" from any result runs lookalike search

**Priority:** High
**Spec refs:** `spec-integrations.md` §Apify Instagram, `spec-webapp.md` §creator search, `spec-workflows.md` §EnrichForCampaignWorkflow

---

### US-2.6 — Lookalike Creator Discovery
**As a** Brand Manager,
**I want to** provide a seed Instagram creator and get a list of similar creators,
**so that** I can expand outreach to creators with similar audiences without manual research.

**Acceptance Criteria:**
- Seed creator URL/handle input triggers Apify lookalike actor
- Returns up to N profiles with follower count, category, bio
- Lookalike suggestions surfaced in inbox view when existing creator opts in (automated, `campaign_lookalike_suggestion` records)
- User can accept (add to campaign) or dismiss each suggestion

**Priority:** High
**Spec refs:** `spec-integrations.md` §Apify Instagram, `spec-workflows.md` §lookalike generation, `spec-data-model.md` §campaign_lookalike_suggestion

---

### US-2.7 — Initial Email Drafting (AI-Generated)
**As a** Brand Manager,
**I want to** have AI generate my initial outreach email based on my campaign details,
**so that** I don't spend hours crafting cold outreach copy from scratch.

**Acceptance Criteria:**
- AI-generated email appears when user reaches step 4 (auto-triggered on step navigation)
- Email is campaign-type-aware (gifting vs paid vs sales vs general has distinct prompts)
- User can regenerate or edit the draft freely
- Template supports `{name}`, `{email}`, and any custom CSV fields as `{field_name}` placeholders
- Placeholder validation: unmatched placeholders cause launch failure with descriptive error

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §step 4, `campaign-lifecycle.md` §wizard AI, `ai-orchestration.md` §draft generation

---

### US-2.8 — Follow-Up Email Templates
**As a** Brand Manager,
**I want to** configure automated follow-up emails with customizable timing,
**so that** creators who don't respond to the first email receive appropriately-timed reminders.

**Acceptance Criteria:**
- Step 4 allows adding multiple follow-up templates
- Each follow-up has: body template, delay in hours since last email
- Follow-ups stored with sequential index (0, 1, 2, ...) and validated at launch
- Templates support same `{placeholder}` syntax as initial email
- AI can generate follow-up content on demand

**Priority:** High
**Spec refs:** `spec-webapp.md` §step 4 follow-ups, `campaign-lifecycle.md` §phase 6, `spec-workflows.md` §SendCampaignFollowUpsWorkflow

---

### US-2.9 — Opt-In / Opt-Out Email Templates
**As a** Brand Manager,
**I want to** configure automatic response templates for when creators accept or decline my offer,
**so that** accepted creators receive immediate confirmation and declined creators receive a graceful opt-out without manual effort.

**Acceptance Criteria:**
- Step 4 has opt-in and opt-out template tabs
- AI generates both templates with a single click ("Generate Opt-In/Opt-Out" button)
- Opt-out template is auto-sent when campaign automation level allows it
- Opt-in template is used as the next reply after creator acceptance
- Both templates support same placeholder syntax

**Priority:** High
**Spec refs:** `spec-webapp.md` §step 4 opt-in/out, `campaign-lifecycle.md` §thread processing, `ai-orchestration.md` §opt-in classification

---

### US-2.10 — Campaign Goals & FAQ Generation (AI-Assisted)
**As a** Brand Manager,
**I want to** describe my campaign goals and define FAQs that the AI will use when drafting replies,
**so that** every AI-generated email accurately represents my brand's expectations and answers common creator questions.

**Acceptance Criteria:**
- Step 5 auto-generates campaign goal summary and FAQ list based on previous wizard inputs
- User can edit all generated content freely
- Goals and FAQs injected into every draft-generation prompt throughout the campaign lifecycle
- "Rules for LLM" field allows natural-language constraints (e.g., "Never mention pricing in first email")

**Priority:** High
**Spec refs:** `spec-webapp.md` §step 5, `ai-orchestration.md` §draft generation prompt variables, `campaign-lifecycle.md` §wizard AI

---

### US-2.11 — Google Sheets Tracking Configuration (AI-Assisted)
**As a** Brand Manager,
**I want to** connect a Google Sheet and define what data I want extracted from creator email threads,
**so that** creator metrics flow automatically into my reporting sheet without manual data entry.

**Acceptance Criteria:**
- Step 6: paste Google Sheet URL → system verifies access and reads column headers
- AI generates tracking rules from column headers (natural language mapping)
- User can edit, add, or toggle each tracking rule
- Columns marked as "skipped" are excluded from extraction
- Service account email displayed so user knows what to share the sheet with

**Priority:** High
**Spec refs:** `spec-webapp.md` §step 6, `spec-integrations.md` §Google Sheets, `campaign-lifecycle.md` §phase 8

---

### US-2.12 — Campaign Review & Launch
**As a** Brand Manager,
**I want to** review all campaign settings in one place before launching,
**so that** I can catch mistakes before 500 emails are sent.

**Acceptance Criteria:**
- Step 7 shows all settings in summary view with "Edit" links per section
- Editing from review returns user to correct step then back to review (no data loss)
- Launch button triggers `POST /campaigns/launch` (multipart form with optional CSV + image)
- Launch response shows: recipients_added, senders_added, queue_entries_created
- Error messages are specific (e.g., "Unmatched placeholder {product_name}" with the column name)

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §step 7, `campaign-lifecycle.md` §phase 2, `spec-backend-api.md` §campaign launch

---

### US-2.13 — Draft Campaign (Save & Resume)
**As a** Brand Manager,
**I want to** save a campaign as a draft and return to complete it later,
**so that** I don't lose my work if I need to step away mid-wizard.

**Acceptance Criteria:**
- Campaign auto-saves as DRAFT on every step transition (`POST /campaigns/draft`)
- Draft metadata (`draft_metadata` JSONB) stores all wizard state not in dedicated columns
- Draft listed in campaign list with "Draft" status badge
- Resuming a draft restores all wizard fields, including CSV data and AI-generated content
- Launching from draft atomically promotes DRAFT → ACTIVE and clears `draft_metadata`

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §draft saving, `spec-data-model.md` §campaign, `spec-backend-api.md` §draft management

---

### US-2.14 — Campaign Duplication
**As a** Brand Manager,
**I want to** duplicate an existing campaign as a starting point for a new one,
**so that** I don't re-enter boilerplate campaign configuration for recurring outreach programs.

**Acceptance Criteria:**
- "Duplicate" action available from campaign list and detail views
- Duplicate creates a new DRAFT campaign with same settings (name gets " (copy)" suffix)
- Duplicate does NOT copy recipients, senders, outbox queue, or thread history
- Duplicated draft opens in wizard for editing before launch

**Priority:** Medium
**Spec refs:** `spec-backend-api.md` §campaign management, `spec-webapp.md` §campaign actions

---

## Epic 3: Creator Discovery & Enrichment

### US-3.1 — Creator Email Enrichment (Post-Launch)
**As a** Brand Manager,
**I want to** add creators to a campaign even when I don't know their email address yet,
**so that** I can build a creator list from Instagram search results and have the system find contact info.

**Acceptance Criteria:**
- Creators added without valid email use `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel
- After launch, `EnrichForCampaignWorkflow` runs per creator in parallel (no retry on individual failures)
- 4-tier enrichment waterfall per creator: platform profile cache → Apify scrape → bio link crawl → Influencer Club API
- On success: creator added to outbox queue and outreach sent automatically
- Manual override available: `POST /v1/campaigns/{id}/creators/{creator_id}/override-email`
- Progress visible in webapp (enrichment overlay / spinner)

**Priority:** High
**Spec refs:** `spec-workflows.md` §EnrichForCampaignWorkflow, `spec-integrations.md` §enrichment waterfall, `campaign-lifecycle.md` §creator enrichment

---

### US-3.2 — YouTube Creator Discovery
**As a** Brand Manager,
**I want to** find YouTube creators similar to a seed channel and get their contact emails,
**so that** I can run influencer campaigns on YouTube without manually researching channels.

**Acceptance Criteria:**
- Input: YouTube channel URL
- System fetches channel details (Apify channel scraper actor)
- LLM extracts keywords that fans of this channel would use to discover similar channels
- Fast actor (`apidojo`) finds similar channels at scale (166 channels/second)
- Email extraction attempted for each: regex from bio → bio link pages → Apify email extractor actor
- Results sorted: channels with confirmed emails appear first

**Priority:** Medium
**Spec refs:** `spec-integrations.md` §Apify YouTube, `spec-workflows.md` §YouTube discovery

---

### US-3.3 — Creator Profile View
**As a** Campaign Operator,
**I want to** see a creator's extracted profile data (social handles, role, status, address) without opening email threads,
**so that** I can quickly understand who a creator is and where they are in the campaign pipeline.

**Acceptance Criteria:**
- Creator profile populated by LLM extraction from email thread history
- Shows: name, email, Instagram/YouTube handles, role (creator/talent manager/agency), gifting status or paid promotion status
- For gifting: shows `gifting_address` extracted from emails
- For paid: shows negotiated rate, paid promotion status
- Creator note (max 500 chars, AI-generated summary) visible at a glance
- Manual edit available for any field

**Priority:** High
**Spec refs:** `spec-data-model.md` §campaign_creator, `ai-orchestration.md` §creator extraction, `spec-backend-api.md` §creator endpoints

---

### US-3.4 — Creator List Management
**As a** Brand Manager,
**I want to** maintain reusable lists of creators across campaigns,
**so that** I can quickly add my established creator pool to new campaigns without re-uploading spreadsheets.

**Acceptance Criteria:**
- Creator lists stored in `creator_list` table with `creator_list_item` entries
- Lists accessible from campaign creator step (import from list)
- Global creator table (`creator`) is a shared cross-user database of known creators
- User's private lists are user-scoped via RLS
- List shows creator count, creation date, last modified

**Priority:** Medium
**Spec refs:** `spec-data-model.md` §creator_list, `auth-permissions.md` §6.5

---

### US-3.5 — Creator Lookalike Suggestions (From Opt-Ins)
**As a** Brand Manager,
**I want to** see suggested similar creators when an existing creator opts in,
**so that** I can expand my campaign reach with minimal discovery effort.

**Acceptance Criteria:**
- When an opt-in is detected in a thread, `generate_lookalike_suggestions` activity runs (if creator handles found)
- `CampaignLookalikesSuggestion` records created with discovered similar profiles
- Webapp surfaces suggestions with accept/dismiss controls
- Accepted suggestions added to campaign recipient list

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §phase 4, `spec-data-model.md` §campaign_lookalike_suggestion, `spec-workflows.md` §ThreadProcessingCoordinatorWorkflow

---

### US-3.6 — Creator Note Generation
**As a** Campaign Operator,
**I want to** see a short AI-written note summarizing each creator's status and thread history,
**so that** I can orient myself on a creator relationship in seconds without reading the full email chain.

**Acceptance Criteria:**
- Note auto-generated after thread processing by `creator_note_generation` feature
- Max 500 characters; avoids restating the campaign goal
- `should_update=False` returned by LLM if note content hasn't changed → DB write skipped (no noise)
- Note displayed in thread list and creator detail view
- User can manually edit the note if needed

**Priority:** Medium
**Spec refs:** `ai-orchestration.md` §creator note generation, `spec-data-model.md` §campaign_creator

---

### US-3.7 — Manual Email Override for Creator
**As a** Campaign Operator,
**I want to** manually specify an email for a creator whose email couldn't be found by the enrichment system,
**so that** campaigns don't stall on creators who are valuable but hard to reach automatically.

**Acceptance Criteria:**
- `POST /v1/campaigns/{id}/creators/{creator_id}/override-email` endpoint
- Override triggers immediate queue population and outreach
- Override email replaces enrichment sentinel; creator moved from "pending" to "queued"
- Audit log maintained of who performed the override

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §creator enrichment, `spec-backend-api.md` §creator override

---

### US-3.8 — Creator Enrichment Attempt History
**As a** Campaign Operator,
**I want to** see which enrichment sources were tried for a creator and when,
**so that** I know if it's worth trying manual override vs waiting for another automated attempt.

**Acceptance Criteria:**
- `creator_enrichment_attempt` records the source, result, and timestamp per enrichment try
- Visible in creator detail view (enrichment history section)
- Failed attempts show error reason (e.g., "Not found in Influencer Club")
- Users cannot write directly to this table — backend only

**Priority:** Low
**Spec refs:** `spec-data-model.md` §creator_enrichment_attempt, `auth-permissions.md` §6.5

---

## Epic 4: Inbox & Thread Management

### US-4.1 — Multi-Campaign Inbox View
**As a** Campaign Operator,
**I want to** see a unified inbox of all active email threads across all my campaigns,
**so that** I can process creator replies without switching between campaign contexts.

**Acceptance Criteria:**
- Mail route (`/mail/[campaign_id]`) shows thread list for selected campaign
- Sidebar lists all campaigns; clicking one filters thread list
- Thread list sorted by latest activity (newest first)
- Thread shows: creator name/email, campaign name, latest message preview, status badges
- Unread/attention badges distinguish `WAITING_FOR_DRAFT_REVIEW` threads from others

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §mail inbox, `spec-data-model.md` §gmail_thread_state

---

### US-4.2 — Thread Detail View
**As a** Campaign Operator,
**I want to** read the full email thread in a readable chat-style view,
**so that** I understand the conversation context before reviewing or editing an AI draft.

**Acceptance Criteria:**
- Thread displays all messages chronologically (direction: INBOUND / OUTBOUND distinguished visually)
- Attachment thumbnails visible inline; clicking opens/downloads
- OCR-extracted text from attachments visible (PDF/image media kits)
- Creator profile panel shown beside thread (social handles, status, note)
- Thread flags shown as badges: `wants_paid`, `has_question`, `has_issue`

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §thread detail, `ai-orchestration.md` §attachment extraction, `spec-data-model.md` §email_attachment

---

### US-4.3 — AI Draft Review & Edit
**As a** Campaign Operator,
**I want to** see the AI-generated reply draft and edit it before sending,
**so that** I maintain control over brand communication while dramatically reducing the time to compose responses.

**Acceptance Criteria:**
- AI draft displayed in compose area below thread (`GET /threads/{id}/draft`)
- Rich text editor (Tiptap) with bold, italic, link, list formatting
- Email signature shown below body (HTML-rendered)
- Edit is saved via `PUT /threads/{id}/draft`
- 409 Conflict returned if LLM is regenerating concurrently (version mismatch guard)
- Source of draft shown ("AI-generated" vs "Human-edited")

**Priority:** Critical
**Spec refs:** `spec-webapp.md` §draft editor, `spec-backend-api.md` §thread draft endpoints, `campaign-lifecycle.md` §phase 5

---

### US-4.4 — Send Reply
**As a** Campaign Operator,
**I want to** send a reply email from the inbox with a single click after reviewing the draft,
**so that** I can process dozens of creator conversations per session without re-typing content.

**Acceptance Criteria:**
- "Send" button submits `POST /emails/send` with thread ID
- Thread status transitions to DONE or WAITING_FOR_INBOUND after send
- Sent reply ingested as RAG example (auto, post-send, background)
- Follow-up scheduled if thread goes to WAITING_FOR_INBOUND
- Sending confirmation toast shown; thread moves out of pending queue

**Priority:** Critical
**Spec refs:** `spec-backend-api.md` §email send, `spec-workflows.md` §ThreadProcessingCoordinatorWorkflow, `ai-orchestration.md` §RAG ingestion

---

### US-4.5 — Draft Regeneration
**As a** Campaign Operator,
**I want to** request a fresh AI draft when the generated response misses the mark,
**so that** I'm not stuck editing a draft that's completely wrong — getting a new perspective is faster.

**Acceptance Criteria:**
- "Regenerate" button triggers new draft generation (`POST /threads/{id}/draft/regenerate`)
- Previous draft replaced atomically; version counter incremented
- Concurrent regeneration requests serialized (last writer wins, no duplicate drafts)
- Regenerated draft follows same RAG pipeline as initial generation

**Priority:** High
**Spec refs:** `spec-webapp.md` §draft controls, `spec-backend-api.md` §draft regenerate

---

### US-4.6 — Thread Status Filter
**As a** Campaign Operator,
**I want to** filter the inbox by thread status (pending review, done, waiting, all),
**so that** I focus on threads that actually need my attention instead of scrolling through completed ones.

**Acceptance Criteria:**
- Filter tabs/chips: All, Needs Review (`WAITING_FOR_DRAFT_REVIEW`), Done, Waiting for Reply
- Status filter persists across navigation within the session
- Thread count shown per filter state
- "Needs Review" is the default view on inbox open (highest priority work)

**Priority:** High
**Spec refs:** `spec-webapp.md` §inbox filters, `spec-data-model.md` §gmail_thread_state status enum

---

### US-4.7 — Thread Manual Campaign Assignment
**As a** Campaign Operator,
**I want to** manually assign an orphaned thread to a campaign when the AI couldn't match it,
**so that** replies that come from unconventional senders are still tracked in the right campaign.

**Acceptance Criteria:**
- Unassigned threads appear in "Uncategorized" or "Orphaned" inbox section
- Campaign selector dropdown available per orphaned thread
- Manual assignment writes to `campaign_thread` and triggers remaining processing steps
- `force_campaign_id` set on thread state prevents future AI re-matching

**Priority:** Medium
**Spec refs:** `spec-webapp.md` §thread management, `campaign-lifecycle.md` §phase 4, `spec-backend-api.md` §thread assignment

---

### US-4.8 — Ignore Thread
**As a** Campaign Operator,
**I want to** mark irrelevant threads (spam, internal tests) as ignored,
**so that** they don't clutter my pending review queue.

**Acceptance Criteria:**
- "Ignore" action sets `gmail_thread_state.status = IGNORE`
- Ignored threads removed from default inbox view
- Ignored threads visible in "Ignored" filter for audit purposes
- Ignore action is reversible (un-ignore returns thread to active processing)

**Priority:** Medium
**Spec refs:** `spec-data-model.md` §gmail_thread_state status, `spec-backend-api.md` §thread management

---

### US-4.9 — Bulk Draft Edit
**As a** Campaign Operator,
**I want to** apply a natural-language edit instruction to all pending AI drafts in a campaign simultaneously,
**so that** when a brand guideline changes, I don't have to manually update 200 drafts one by one.

**Acceptance Criteria:**
- Bulk edit dialog accepts plain English instruction (e.g., "Remove all mentions of free shipping")
- `POST /bulk-draft-edit` triggers `BulkDraftEditWorkflow`
- All `WAITING_FOR_DRAFT_REVIEW` drafts for the campaign are modified in parallel
- Progress shown (N of M drafts updated)
- Option to save the edit instruction as a persistent campaign rule for future drafts
- Individual failures tallied (up to 10 logged) but don't abort the batch

**Priority:** High
**Spec refs:** `spec-workflows.md` §BulkDraftEditWorkflow, `campaign-lifecycle.md` §phase 5, `spec-backend-api.md` §bulk draft edit

---

### US-4.10 — Outbox View
**As a** Campaign Operator,
**I want to** see the outgoing email queue and know when initial outreach will be sent,
**so that** I can diagnose sending delays and confirm that recipients are in the queue.

**Acceptance Criteria:**
- Outbox view shows `campaign_outbox_queue` entries per campaign
- Each entry shows: recipient email, status (pending/sent/failed/skipped), sender account, personalized subject
- Failed entries show error reason
- Send timestamp shown for sent entries

**Priority:** Medium
**Spec refs:** `spec-data-model.md` §campaign_outbox_queue, `spec-webapp.md` §outbox view

---

### US-4.11 — Email Signature Management
**As a** Brand Manager,
**I want to** configure a custom HTML email signature for each campaign,
**so that** all outreach emails and replies from that campaign share consistent brand presentation.

**Acceptance Criteria:**
- HTML signature editor in campaign settings (step 4 of wizard)
- Signature length validated ≤ 10,000 characters at launch
- HTML sanitized via bleach + CSSSanitizer before storage (prevents XSS)
- Signature shown rendered in draft editor below message body
- Signature stored in `email_signature` table linked to campaign

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §launch step 8.5, `spec-data-model.md` §email_signature

---

### US-4.12 — Thread Follow-Up Review
**As a** Campaign Operator,
**I want to** review AI-generated follow-up drafts before they're sent to creators who haven't responded,
**so that** I maintain the same quality control for follow-ups as for initial replies.

**Acceptance Criteria:**
- Follow-up drafts appear in inbox with visual indicator distinguishing them from reply drafts
- Draft generated by `ThreadFollowUpDraftWorkflow` using same RAG pipeline
- `follow_up_number` variable adjusts prompt tone (gentle for #1, more urgent for #3)
- Approved follow-ups sent like any other draft via `POST /emails/send`
- Canceled if creator replies before follow-up is sent (`cancel_follow_ups_on_reply` activity)

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 6, `spec-workflows.md` §ThreadFollowUpDraftWorkflow, `ai-orchestration.md` §follow-up draft

---

## Epic 5: AI Assistance & Automation

### US-5.1 — Automatic Campaign Association
**As a** Campaign Operator,
**I want to** have incoming emails automatically matched to the right campaign,
**so that** I don't have to manually sort replies when running multiple simultaneous campaigns from the same inbox.

**Acceptance Criteria:**
- Two-phase LLM matching: Phase 1 (primary match) → Phase 2 (verification)
- Confidence score returned with each association decision
- Low-confidence matches can be manually corrected by operator
- Force assignment (`force_campaign_id`) prevents future re-matching for manually corrected threads
- Processing fails gracefully for orphaned threads (shown in Uncategorized inbox)

**Priority:** Critical
**Spec refs:** `ai-orchestration.md` §campaign association, `spec-workflows.md` §ThreadAssociateToCampaignWorkflow

---

### US-5.2 — Opt-In / Opt-Out Detection
**As a** Campaign Operator,
**I want to** have the system automatically classify whether a creator is accepting or declining my offer,
**so that** I'm not reading every reply to decide which response template to send.

**Acceptance Criteria:**
- LLM classifies every inbound thread as opt-in, opt-out, or ambiguous
- `asked_questions=True` always forces human review (AI never guesses answers)
- Opt-out triggers auto-send of opt-out template (if automation level allows)
- Opt-in triggers campaign workflow execution (discount codes, Shopify drafting)
- Classification shown as badge in thread view for operator awareness

**Priority:** Critical
**Spec refs:** `ai-orchestration.md` §opt-in classification, `campaign-lifecycle.md` §phase 4

---

### US-5.3 — Thread Flag Extraction
**As a** Campaign Operator,
**I want to** see at-a-glance flag badges on each thread indicating whether the creator wants paid work, has a question, or has an issue,
**so that** I can prioritize which threads need immediate attention without reading them all.

**Acceptance Criteria:**
- Flags extracted per thread: `wants_paid`, `has_question`, `has_issue`
- Each flag has a `reason` string (displayed in tooltip)
- Flags visible in thread list as colored badges
- Filters available to show only threads with specific flags
- Non-critical: missing flags don't block draft generation

**Priority:** High
**Spec refs:** `ai-orchestration.md` §thread flag extraction, `spec-data-model.md` §thread flags

---

### US-5.4 — RAG-Enhanced Draft Generation
**As a** Campaign Operator,
**I want to** have AI drafts that learn from previous successful human replies,
**so that** the more I use the platform, the better my AI drafts match my established communication style.

**Acceptance Criteria:**
- Every sent reply is sanitized, summarized, embedded, and stored in the RAG index
- Future drafts for similar situations retrieve the top-5 most semantically similar human examples
- Draft prompt instructs Claude to use retrieved examples as templates (style transfer)
- RAG failure degrades gracefully to base LLM draft (no pipeline failure)
- PII removed from stored examples (codes → `[CODE]`, names → `[NAME]`, dates → `[DATE]`)

**Priority:** Critical
**Spec refs:** `ai-orchestration.md` §RAG pipeline, `spec-workflows.md` §ingest_sent_reply_as_example

---

### US-5.5 — Automation Level Control
**As a** Brand Manager,
**I want to** configure how much of the inbox workflow is automated vs. operator-reviewed,
**so that** I can balance speed with quality control depending on campaign risk.

**Acceptance Criteria:**
- Three automation levels: Manual, Semi-Automated, Full Automation
- Manual: all drafts require operator approval before send
- Semi-automated: simple opt-in replies auto-sent; threads with questions drafted for review
- Full automation: all replies sent without review (via domain behavior config)
- Level configurable per campaign in wizard or settings
- Current level visible in campaign header

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §automation levels, `spec-data-model.md` §campaign settings

---

### US-5.6 — Thread Completion Detection
**As a** Campaign Operator,
**I want to** have the system automatically recognize when a thread is fully resolved,
**so that** completed conversations don't generate unnecessary follow-up reminders.

**Acceptance Criteria:**
- After every outbound send, LLM checks if thread conversation is complete
- `is_thread_done=True` → no follow-up scheduled; thread status → DONE
- Completion check considers: campaign goal, campaign rules, thread content
- Manual override: operator can manually mark thread DONE or force a follow-up

**Priority:** High
**Spec refs:** `ai-orchestration.md` §thread completion, `spec-workflows.md` §check_if_thread_is_done

---

### US-5.7 — Creator Information Extraction
**As a** Campaign Operator,
**I want to** have the system automatically extract creator details (handles, role, address, negotiated rate) from email threads,
**so that** my creator CRM is populated without manual data entry.

**Acceptance Criteria:**
- Three-phase extraction: identify → extract details (type-specific) → deduplicate against existing records
- Campaign-type-aware schemas: gifting extracts address; paid extracts rate and status
- Role detection: creator, talent manager, agency staff
- Extraction is non-critical (wrapped in try/except; failure doesn't halt draft generation)
- Extracted data immediately visible in creator panel beside thread

**Priority:** High
**Spec refs:** `ai-orchestration.md` §creator extraction, `spec-data-model.md` §campaign_creator

---

### US-5.8 — User-Defined Workflow Execution (Campaign Automations)
**As a** Brand Manager,
**I want to** configure custom automation workflows that run when specific campaign events occur (like a creator opting in),
**so that** I can automate campaign-specific tasks (discount code creation, media kit fetching) without Cheerful building custom features for each use case.

**Acceptance Criteria:**
- Workflows defined per campaign with: name, instructions, tool allowlist, output schema
- Claude agent executes applicable workflows when triggered by thread events
- Workflow classification LLM determines which workflows apply to current thread
- Results stored in `campaign_workflow_execution` per thread+workflow combination
- Previous execution history injected into agent prompt to prevent re-running completed steps

**Priority:** High
**Spec refs:** `ai-orchestration.md` §user-defined workflow execution, `spec-workflows.md` §CampaignWorkflow, `campaign-lifecycle.md` §phase 7

---

### US-5.9 — Attachment OCR / Vision Extraction
**As a** Campaign Operator,
**I want to** have the system automatically extract text from PDF and image attachments (media kits, rate cards),
**so that** creator-provided context is available to the AI drafting pipeline even when it arrives as images.

**Acceptance Criteria:**
- Gmail attachments automatically downloaded and processed on thread ingestion
- Image/PDF content extracted via Claude vision API (gpt-4.1 model)
- Extracted text stored in `email_attachment_llm_extracted_content`
- Extracted content injected into subsequent draft generation prompts
- Attachment thumbnails shown in thread view; text extraction status indicated

**Priority:** High
**Spec refs:** `ai-orchestration.md` §attachment extraction, `spec-data-model.md` §email_attachment

---

### US-5.10 — Draft Correction Learning
**As a** Campaign Operator,
**I want to** have my manual edits to AI drafts improve future draft quality,
**so that** the system progressively learns my communication style and requires less editing over time.

**Acceptance Criteria:**
- Human-sent replies stored as correction examples alongside original AI draft
- Correction examples optionally injected into future draft prompts for same campaign
- `response_drafting_with_corrections.py` A/B path uses correction examples as XML context
- Reply sanitization removes PII before storage (Opus model for maximum quality)
- Correction examples scoped per campaign (one brand's style doesn't contaminate another)

**Priority:** Medium
**Spec refs:** `ai-orchestration.md` §RAG as style transfer, `spec-workflows.md` §ingest_sent_reply_as_example

---

## Epic 6: Gifting & Fulfillment Pipeline

### US-6.1 — GoAffPro Discount Code Automation
**As a** Brand Manager,
**I want to** have personalized discount codes automatically generated in GoAffPro when a creator accepts my gifting offer,
**so that** creators get their unique discount code immediately, without my team manually accessing GoAffPro for each opt-in.

**Acceptance Criteria:**
- Campaign workflow configured with GoAffPro integration at launch
- Opt-in detection triggers `GoAffPro Discount Code Creation` workflow automatically
- Workflow: search existing affiliate → create affiliate if new → create discount code
- Generated code stored in `campaign_creator.gifting_discount_code`
- Code available in reply template as a variable for automated or operator-reviewed replies

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 7, `spec-workflows.md` §GoAffPro, `spec-integrations.md` §Shopify/GoAffPro

---

### US-6.2 — Shopify Order Drafting & Slack Approval
**As a** Campaign Operator,
**I want to** approve AI-extracted Shopify orders from Slack without opening the Cheerful webapp,
**so that** I can process gifting fulfillment orders from anywhere, including my phone, without context-switching to another tool.

**Acceptance Criteria:**
- Opt-in triggers Shopify Order Drafting workflow when campaign has GoAffPro configured
- AI extracts shipping address from email thread
- Slack digest posted to configured channel with: creator info, product, address, action buttons
- Buttons: **Approve** → triggers order creation; **Edit** → opens Slack modal; **Skip** → marks creator skipped
- Edit modal allows correcting email, phone, name, address, city, zip, country
- After approval, Shopify order created via GoAffPro proxy; `campaign_creator.shopify_order_id` updated
- Digest message updated in-place after each action (no message spam)

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 7, `spec-integrations.md` §Slack, `spec-backend-api.md` §Slack interactions

---

### US-6.3 — Post Opt-In Follow-Up Sequence
**As a** Brand Manager,
**I want to** send an automatic next-steps email after a creator accepts my gifting offer,
**so that** creators who said yes immediately receive shipping instructions or product selection links without operator intervention.

**Acceptance Criteria:**
- `campaign.post_opt_in_follow_up_body_template` configured in campaign settings
- `SendPostOptInFollowUpsWorkflow` runs every ~4 hours, checks `campaign_creator.post_opt_in_follow_up_status = PENDING`
- Sends follow-up, updates status to SENT or FAILED
- Failed sends record error reason

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 6 post opt-in, `spec-workflows.md` §SendPostOptInFollowUpsWorkflow

---

### US-6.4 — Gifting Status Tracking
**As a** Campaign Operator,
**I want to** see each creator's position in the gifting pipeline (opted in → processing → fulfilled → posted),
**so that** I can identify which creators are stuck and which have completed the full gifting journey.

**Acceptance Criteria:**
- `campaign_creator.gifting_status` progression: null → opted_in → processing → fulfilled → posted
- Side paths: opted_out, skipped
- Status visible in creator panel and campaign overview table
- Filtering/sorting by gifting status in campaign creator list view
- Manual status override available for cases where AI extraction was incorrect

**Priority:** High
**Spec refs:** `spec-data-model.md` §campaign_creator, `campaign-lifecycle.md` §phase 7

---

### US-6.5 — Campaign Pause / Resume
**As a** Brand Manager,
**I want to** pause a campaign's outbox (stop sending new initial emails) without disrupting existing in-flight thread conversations,
**so that** I can respond to supply chain issues or product delays without losing thread continuity.

**Acceptance Criteria:**
- `PATCH /campaigns/{id}/status` with `status=paused` stops `campaign_outbox_queue` drain
- Existing threads and follow-ups continue processing normally while paused
- Resume (`status=active`) restarts outbox queue drain from remaining pending entries
- Pause reason field optional (for operator notes)
- Paused badge shown prominently in campaign header

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §campaign status state machine, `spec-backend-api.md` §campaign management

---

### US-6.6 — Campaign Completion
**As a** Brand Manager,
**I want to** mark a campaign as completed when outreach is done,
**so that** the campaign moves to archive and the system stops processing new activities for it.

**Acceptance Criteria:**
- `status=completed` sets `campaign.completed_at` timestamp
- Completed campaigns excluded from active campaign views by default
- Terminal state — no transitions out of completed
- Completed campaign data remains available for historical reporting

**Priority:** Low
**Spec refs:** `campaign-lifecycle.md` §campaign status, `spec-data-model.md` §campaign

---

### US-6.7 — Paid Promotion Status Tracking
**As a** Campaign Operator,
**I want to** track where each creator is in the paid promotion pipeline (new → negotiating → contract → paid),
**so that** I can manage multiple simultaneous paid partnerships without spreadsheets.

**Acceptance Criteria:**
- `campaign_creator.paid_promotion_status` tracks: NEW → NEGOTIATING → AWAITING_CONTRACT → CONTRACTED → WAITING_DELIVERABLES → DELIVERABLES_SUBMITTED → PAID → DECLINED
- Status extracted from emails by LLM (paid promotion campaign type prompt)
- Rate extracted and stored in `campaign_creator.paid_promotion_rate`
- Manual override available for each status and rate field
- Dashboard shows paid promotions by status for pipeline view

**Priority:** High
**Spec refs:** `ai-orchestration.md` §creator extraction paid promotion schema, `spec-data-model.md` §campaign_creator

---

## Epic 7: Post Tracking

### US-7.1 — Instagram Post Detection
**As a** Brand Manager,
**I want to** automatically detect when a gifting creator posts content featuring my product on Instagram,
**so that** I know which creators actually fulfilled their end of the collaboration without manual Instagram monitoring.

**Acceptance Criteria:**
- Post tracking enabled per campaign via `post_tracking_enabled` flag
- `post_tracking_started_at` set when creator opts in (or manually triggered)
- `PostTrackingWorkflow` runs in 48-hour loop per campaign for the `tracking_window_days` duration
- Per creator: fetches Instagram posts via Apify within date window
- Two-phase detection: text match in caption (free) → Claude vision analysis (fallback)
- Matched posts stored as `CreatorPost` records

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 7 post tracking, `spec-workflows.md` §PostTrackingWorkflow

---

### US-7.2 — Post Tracking Dashboard
**As a** Brand Manager,
**I want to** see which creators have posted and view their Instagram posts within the platform,
**so that** I have one place to verify gifting campaign ROI without jumping between Instagram profiles.

**Acceptance Criteria:**
- Posts listed per creator in campaign detail view (post tracking tab)
- Each post shows: image, caption excerpt, detection method (text match vs. vision), post date
- Post URL links directly to Instagram
- Summary: X out of Y creators have posted

**Priority:** Medium
**Spec refs:** `spec-webapp.md` §post tracking, `spec-data-model.md` §creator_post

---

### US-7.3 — Post Tracking Window Management
**As a** Brand Manager,
**I want to** configure how long to monitor each creator for posts after they opt in,
**so that** tracking duration matches my campaign expectations (immediate vs. long-tail content).

**Acceptance Criteria:**
- `campaign.tracking_window_days` configurable per campaign (set during wizard step 6)
- `post_tracking_ends_at = post_tracking_started_at + tracking_window_days`
- Tracking stops automatically after window expires (no manual intervention needed)
- Window can be extended per creator if campaign rules require it

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §phase 7 post tracking, `spec-data-model.md` §campaign

---

### US-7.4 — Vision-Based Post Verification
**As a** Brand Manager,
**I want to** have AI visually analyze creator posts to confirm product presence when text alone isn't sufficient,
**so that** posts where my brand appears in images but isn't named in captions are still detected.

**Acceptance Criteria:**
- Vision analysis used as fallback when caption text match fails
- Claude Sonnet vision model analyzes downloaded post image
- Response format: "YES - [reason]" or "NO - [reason]" (structured, not free-form)
- Vision analysis result stored per post (`creator_post.detection_method`)
- Cost-controlled: vision only triggered when text match fails

**Priority:** Medium
**Spec refs:** `ai-orchestration.md` §post tracking vision, `spec-workflows.md` §PostTrackingWorkflow

---

## Epic 8: Reporting & Analytics

### US-8.1 — Campaign Dashboard
**As a** Brand Manager,
**I want to** see a real-time dashboard of campaign performance metrics,
**so that** I can understand campaign health at a glance without querying spreadsheets or the database.

**Acceptance Criteria:**
- Dashboard at `/dashboard` shows cross-campaign aggregate metrics
- Metrics: active/paused/draft/completed campaign counts
- Opt-in funnel: total contacts → replied → opted in → opted out (with conversion rates %)
- Email stats: sent, opened, replied
- Follow-up stats: sent, pending
- Per-campaign breakdown table with sortable columns
- Pipeline view: gifting fulfilled count, paid contracted count

**Priority:** High
**Spec refs:** `spec-backend-api.md` §dashboard analytics, `campaign-lifecycle.md` §phase 8

---

### US-8.2 — Automatic Google Sheets Reporting
**As a** Brand Manager,
**I want to** have creator metrics automatically written to a Google Sheet as replies come in,
**so that** my client reporting sheet is always up to date without manual data entry.

**Acceptance Criteria:**
- Thread metrics extracted by LLM from email content (follower count, engagement rate, niche, post URLs, etc.)
- Two-phase extraction: extract → review (second LLM call validates accuracy)
- Metrics written to configured Google Sheet via `update_sheet_with_metrics` activity
- Google Sheets writes use dedicated Temporal task queue (single-concurrent, rate-limited)
- If write fails after 5 retries: `campaign.google_sheet_error` updated; user notified
- Address guard for gifting campaigns: incomplete records not written until address is present

**Priority:** High
**Spec refs:** `campaign-lifecycle.md` §phase 8, `ai-orchestration.md` §metrics extraction, `spec-integrations.md` §Google Sheets

---

### US-8.3 — Client Performance Summary
**As a** Brand Manager,
**I want to** generate a formatted, shareable campaign performance summary for my brand client,
**so that** I can share professional-looking results without manually formatting a status report.

**Acceptance Criteria:**
- `POST /campaigns/{id}/client-summary` with `selected_fields[]` parameter
- AI formats summary as prose with emoji section headers (e.g., ⚠️ Needing Review, ✅ Approved)
- Output suitable for sharing directly with brand clients (not raw data)
- Summary is generated on-demand (not cached) to always reflect latest state
- User can select which metrics to include/exclude

**Priority:** Medium
**Spec refs:** `ai-orchestration.md` §client summary, `spec-backend-api.md` §campaign summary

---

### US-8.4 — Campaign-Level Analytics
**As a** Brand Manager,
**I want to** see per-campaign analytics (opt-in rate, status breakdown, email open rates),
**so that** I can compare campaign performance across different product categories and creator segments.

**Acceptance Criteria:**
- Campaign detail view includes analytics tab with opt-in funnel for that campaign
- Opt-in rate = opted-in / total replied × 100%
- Open rate (if Gmail tracking enabled)
- Status distribution chart: what % of recipients are in each thread status
- Historical trend (week-over-week if campaign has been running long enough)

**Priority:** Medium
**Spec refs:** `spec-backend-api.md` §analytics, `spec-webapp.md` §campaign analytics view

---

### US-8.5 — LLM Observability (Internal)
**As a** Brand Manager (internal platform view),
**I want to** trace every AI call back to the email thread and user that triggered it,
**so that** support engineers can debug draft quality issues and product managers can measure AI feature performance.

**Acceptance Criteria:**
- Every AI feature call decorated with Langfuse span (`@langfuse.observe`)
- Session ID = Gmail thread ID (clusters all AI calls per thread processing run)
- User ID = operator email (per-user cost and quality tracking)
- Prompt versions tracked per environment (production/staging/development labels)
- Langfuse dashboard shows: model, input tokens, output tokens, latency per generation

**Priority:** Medium (internal)
**Spec refs:** `ai-orchestration.md` §observability, `spec-context-engine.md` §Langfuse

---

### US-8.6 — Product Analytics (PostHog)
**As a** Product Manager (internal),
**I want to** track user behavior in the webapp via PostHog session recording and event tracking,
**so that** I can identify UX friction points and measure feature adoption.

**Acceptance Criteria:**
- PostHog initialized in webapp root layout with project key and host env vars
- Session recording enabled across all pages except `/settings`
- GrowthBook feature flags evaluated server-side; PostHog used for A/B test assignment
- Custom events fired at key actions: campaign launched, draft approved, bulk edit used, etc.
- Google Tag Manager also injected for additional tracking (GTM-MVWKLM7N)

**Priority:** Low (internal)
**Spec refs:** `spec-integrations.md` §PostHog, `spec-webapp.md` §analytics providers

---

## Epic 9: Team & Access Management

### US-9.1 — Team Creation
**As a** Team Admin,
**I want to** create a team that groups multiple user accounts,
**so that** campaign operators can work collaboratively on the same campaigns with appropriate access control.

**Acceptance Criteria:**
- `POST /api/teams` creates team with the creator as owner
- Team owner auto-added to `team_member` with `role='owner'`
- Team name required; unique per owner
- Team visible in sidebar and settings

**Priority:** High
**Spec refs:** `spec-backend-api.md` §team management, `auth-permissions.md` §5

---

### US-9.2 — Team Member Invitation
**As a** Team Admin,
**I want to** invite a colleague to my team by email,
**so that** they can access and operate campaigns I assign to them.

**Acceptance Criteria:**
- Invite by email: if user account exists → add to team; if not → Supabase invite email sent
- Invited users receive magic link → click → set password → onboarding flow
- Inviter sets initial role (member; owner cannot be granted via invite)
- Invited member appears in team member list immediately (pending until they sign up)

**Priority:** High
**Spec refs:** `auth-permissions.md` §2.5, `spec-backend-api.md` §team management

---

### US-9.3 — Campaign Assignment to Team Member
**As a** Team Admin,
**I want to** assign specific campaigns to team members,
**so that** operators only see the campaigns they're responsible for, reducing noise and enforcing focus.

**Acceptance Criteria:**
- `POST /api/teams/{team_id}/campaign-assignments` with `campaign_id` and `user_id`
- Assignment creates `campaign_member_assignment` record
- Assigned team member can view campaign threads and drafts
- Assigned member cannot launch, delete, or change campaign settings (owner-only actions)
- Campaign owner can assign to any team member within their team

**Priority:** High
**Spec refs:** `auth-permissions.md` §5.3, `spec-backend-api.md` §team assignments, `spec-data-model.md` §campaign_member_assignment

---

### US-9.4 — Team Member Removal
**As a** Team Admin,
**I want to** remove a team member from my team,
**so that** former employees or collaborators lose access to campaign data.

**Acceptance Criteria:**
- Remove member → removes `team_member` record
- All `campaign_member_assignment` records for that user in this team also removed
- Removed user immediately loses campaign access (no session grace period)
- Team owner cannot remove themselves (prevents accidental team orphaning)

**Priority:** Medium
**Spec refs:** `auth-permissions.md` §9.2, `spec-backend-api.md` §team management

---

### US-9.5 — Permission Enforcement (Campaign Access)
**As a** Team Admin,
**I want to** trust that team members can only access campaigns I explicitly assign to them,
**so that** campaign data from different clients is isolated even within the same team.

**Acceptance Criteria:**
- `can_access_campaign()` SECURITY DEFINER function enforces owner-OR-assigned rule
- RLS policies prevent frontend reads of unassigned campaigns even with direct Supabase queries
- API layer enforces same rule for all backend reads
- Gmail/SMTP credentials never accessible to team members via RLS (column-level protection via policy drop)

**Priority:** Critical
**Spec refs:** `auth-permissions.md` §6, `spec-data-model.md` §RLS, `spec-backend-api.md` §auth

---

### US-9.6 — User Identity at Runtime
**As a** Platform Engineer (internal),
**I want to** trace every API request back to the authenticated user who made it,
**so that** audit logs are accurate and data isolation bugs are detectable.

**Acceptance Criteria:**
- Every API request extracts `user_id` from JWT `sub` claim
- All repository queries use `user_id` for `WHERE user_id = ?` isolation
- Dev impersonation available only in `DEPLOY_ENVIRONMENT=development` (hard-disabled in production)
- `X-Impersonate-User` header requires both real token + header; all events logged

**Priority:** High (internal)
**Spec refs:** `auth-permissions.md` §3, §12

---

## Epic 10: Integrations Setup

### US-10.1 — Shopify / GoAffPro Integration
**As a** Brand Manager,
**I want to** connect my Shopify store via GoAffPro so that the platform can create draft orders and discount codes automatically,
**so that** the gifting fulfillment workflow operates end-to-end without Shopify admin access being embedded in the AI system.

**Acceptance Criteria:**
- GoAffPro access token stored per campaign (not global)
- Product catalog fetched from GoAffPro at campaign setup to populate product selector
- Order creation goes through GoAffPro proxy (Shopify credentials stay with GoAffPro)
- Slack channel configurable for order approval notifications
- Two workflow types: discount code creation + order drafting (independently toggleable)

**Priority:** High
**Spec refs:** `spec-integrations.md` §Shopify, `campaign-lifecycle.md` §phase 7

---

### US-10.2 — Slack Channel Configuration
**As a** Brand Manager,
**I want to** connect a Slack channel to receive order approval digests for gifting campaigns,
**so that** my operations team can approve Shopify orders from Slack without logging into Cheerful.

**Acceptance Criteria:**
- Slack bot token configured at campaign level (step 6 of wizard)
- Slack channel ID entered for digest destination
- Test message can be sent to verify connection before launch
- Interactive buttons work via Slack Interactivity webhook (`/slack/interactions`)

**Priority:** Medium
**Spec refs:** `spec-integrations.md` §Slack, `campaign-lifecycle.md` §phase 7

---

### US-10.3 — Google Sheets Read (Recipient Import)
**As a** Brand Manager,
**I want to** import a recipient list directly from a Google Sheet,
**so that** I don't have to export-then-upload a CSV when my creator list already lives in Sheets.

**Acceptance Criteria:**
- Google Sheet URL field in campaign wizard
- System reads headers and all rows via service account
- Same parsing rules as CSV import (email column required, dedup, custom field mapping)
- Service account email shown so user knows what to grant access to

**Priority:** Medium
**Spec refs:** `spec-integrations.md` §Google Sheets, `spec-backend-api.md` §campaign launch

---

### US-10.4 — Composio Integration (Custom Workflows)
**As a** Brand Manager (power user),
**I want to** trigger Composio-backed actions (Google Calendar, HubSpot, GitHub, etc.) from campaign AI workflows,
**so that** I can build custom automations connecting Cheerful to my broader tool stack without engineering effort.

**Acceptance Criteria:**
- Composio action schema mapped to MCP tool format at runtime
- Composio user ID passed at action execution time (per-user auth)
- Errors returned in response body (never raise exceptions that halt workflow)
- Available actions discoverable via Composio API at workflow configuration time

**Priority:** Low
**Spec refs:** `spec-integrations.md` §Composio, `ai-orchestration.md` §user-defined workflow execution

---

### US-10.5 — Product Page Scraping (Firecrawl)
**As a** Brand Manager,
**I want to** paste my product URL and have the platform automatically pull in the product name and description,
**so that** I don't manually copy product content from my e-commerce site into campaign fields.

**Acceptance Criteria:**
- Product URL field in wizard triggers Firecrawl scrape on blur
- Extraction prompt focused on main product (not promotions or other products on page)
- 4-hour cache means repeated scrapes of the same URL are instant
- Extracted data pre-populates name + description fields (overrideable by user)
- Failure (invalid URL, no data) shows a warning but doesn't block wizard progression

**Priority:** Medium
**Spec refs:** `spec-integrations.md` §Firecrawl, `spec-webapp.md` §step 2

---

### US-10.6 — External Campaign Mode (Instantly/Mixmax)
**As a** Brand Manager,
**I want to** use Cheerful as a reply-processing layer when initial outreach is sent via another tool (Instantly, Mixmax),
**so that** I can benefit from Cheerful's AI reply drafting without switching my initial outreach tool.

**Acceptance Criteria:**
- `is_external=True` flag on campaign skips email draft, recipients, and follow-up requirements at launch
- System only processes inbound replies — no initial outreach sent
- Reply processing pipeline identical to standard campaigns
- Campaign still requires connected Gmail account for reply ingestion

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §business rules, `spec-backend-api.md` §campaign launch

---

### US-10.7 — Langfuse Prompt Management (Internal)
**As a** Platform Engineer (internal),
**I want to** manage AI prompts in Langfuse and deploy them per environment without code changes,
**so that** I can iterate on prompt quality in staging before promoting to production.

**Acceptance Criteria:**
- Prompts fetched from Langfuse at runtime by name + environment label
- Environment labels: `production`, `staging`, `development`
- Model override configurable per prompt in Langfuse UI (`prompt.config["model"]`)
- All AI features have hardcoded fallback system prompts if Langfuse is unavailable
- Prompt fetch failure retried; campaign processing continues with fallback

**Priority:** Medium (internal)
**Spec refs:** `ai-orchestration.md` §prompt management, `spec-integrations.md` §Langfuse

---

## Epic 11: Creator Campaign (Reverse Flow)

### US-11.1 — Creator Campaign Setup
**As a** Creator,
**I want to** set up a Creator-type campaign in Cheerful to manage incoming brand deal inquiries,
**so that** I can use the platform's AI tools to handle volume outreach from brands without a manual VA workflow.

**Acceptance Criteria:**
- Campaign type = "creator" → wizard skips product, email template, recipients, follow-up steps
- Creator campaign is inbound-only: no outbox queue created at launch
- Connected email account receives incoming brand inquiries
- Replies processed by same AI pipeline (flags, drafts, classification)

**Priority:** Medium
**Spec refs:** `campaign-lifecycle.md` §campaign type divergences, `spec-webapp.md` §step 0 type selection

---

### US-11.2 — Creator Deal Management
**As a** Creator,
**I want to** see incoming brand deal inquiries in an organized inbox with AI-generated status flags,
**so that** I can quickly identify which brands are offering what I'm worth and respond to the most attractive ones first.

**Acceptance Criteria:**
- Incoming brand emails processed by same thread processing pipeline
- Thread flags (`wants_paid`, `has_question`) surfaced in thread list
- Creator can see extracted campaign details from brand emails
- Reply drafts generated with creator-facing prompt variant

**Priority:** Medium
**Spec refs:** `ai-orchestration.md` §draft generation (general variant), `spec-data-model.md` §gmail_thread_state

---

### US-11.3 — Creator Rate Negotiation Tracking
**As a** Creator,
**I want to** have negotiated rates and deal terms extracted from email threads automatically,
**so that** I have a clear record of what was agreed without reading back through email chains.

**Acceptance Criteria:**
- `paid_promotion_rate` extracted by LLM from email content for creator campaigns
- Rate history visible per thread
- Creator can override extracted rate if LLM missed context
- Rate data usable in analytics view ("average incoming brand offer")

**Priority:** Low
**Spec refs:** `ai-orchestration.md` §creator extraction paid promotion, `spec-data-model.md` §campaign_creator

---

### US-11.4 — Creator Portfolio / Media Kit Attachment Handling
**As a** Creator,
**I want to** have my media kit (PDF or image) automatically attached to outgoing replies when responding to brand inquiries,
**so that** brands immediately receive my stats and portfolio without my having to manually attach files to every response.

**Acceptance Criteria:**
- Attachment configuration in creator campaign settings (upload media kit PDF/image)
- Auto-attach to first reply in a thread (configurable)
- Vision extraction runs on attachment thumbnails brands send (existing functionality)

**Priority:** Low
**Spec refs:** `spec-data-model.md` §email_attachment, `spec-integrations.md` §Gmail

---

## Epic 12: Context Engine (Internal Team)

### US-12.1 — Slack AI Assistant for Campaign Data
**As a** Campaign Operator,
**I want to** query campaign data, creator statuses, and inbox analytics from Slack without opening the webapp,
**so that** I can answer stakeholder questions or check campaign status during a meeting without switching context.

**Acceptance Criteria:**
- `@Context` bot mention in any Slack channel triggers the agent
- Agent uses `discover_tools` → `execute_tool` pattern (2 meta-tools, 38 underlying tools)
- Cheerful MCP tools query: campaign list, thread statuses, creator details, outbox status
- Responses formatted in Slack mrkdwn (`*bold*`, `<url|text>`) not Markdown
- Live status indicator shown while agent is processing ("🖋️ searching...")

**Priority:** High
**Spec refs:** `spec-context-engine.md` §Slack bot, `ai-orchestration.md` §context engine

---

### US-12.2 — Cross-Platform Internal Queries
**As a** Brand Manager,
**I want to** ask the Slack bot questions that span multiple internal tools (PostHog analytics + Cheerful campaign data + Slack messages),
**so that** I get synthesized answers instead of having to query 3 different dashboards.

**Acceptance Criteria:**
- Single Slack question can trigger tools across 7 platforms (Slack, Fly, Clarify, ACP, Onyx, PostHog, Cheerful)
- `TOOL_FILTERING_ENABLED=False` means all 38 tools available by default
- Thread continuity: context persists across multi-turn Slack conversations via `ThreadToolContext` DB record
- Langfuse session groups all tool calls in one conversation for observability

**Priority:** Medium
**Spec refs:** `spec-context-engine.md` §tool catalog, `ai-orchestration.md` §context engine meta-tool pattern

---

### US-12.3 — Analytics Queries from Slack
**As a** Product Manager (internal),
**I want to** run PostHog HogQL queries from Slack to answer ad-hoc analytics questions,
**so that** I don't need PostHog dashboard access to answer simple behavioral questions.

**Acceptance Criteria:**
- `posthog_query` tool accepts HogQL (SQL dialect) and returns formatted results
- Supporting tools: list event definitions, list property definitions, get session, get insight
- All PostHog tools are read-only
- Large result sets truncated with summary count
- Results formatted as Slack-readable table or bulleted list

**Priority:** Medium
**Spec refs:** `spec-context-engine.md` §PostHog tools, `spec-integrations.md` §PostHog

---

### US-12.4 — Deployment & Infrastructure Queries
**As a** Platform Engineer (internal),
**I want to** query Fly.io deployment status, app logs, and active sessions from Slack,
**so that** I can diagnose production incidents without SSH access or opening the Fly.io dashboard.

**Acceptance Criteria:**
- Fly MCP tools: list apps, get app status, scale app
- ACP session management tools: list/get/kill agent sessions
- 4 write-capable tools (Fly scale operations, ACP session kill) require explicit confirmation in conversation
- All other tools read-only

**Priority:** Low (internal)
**Spec refs:** `spec-context-engine.md` §Fly and ACP tools

---

### US-12.5 — Meeting Transcript Queries
**As a** Campaign Operator,
**I want to** ask the Slack bot what was decided in a past meeting or what a client said on a call,
**so that** I can find context from recorded conversations without rewatching recordings.

**Acceptance Criteria:**
- Clarify MCP tools: search transcripts, get transcript, list transcripts
- Search returns relevant segments with timestamps
- Read-only access to meeting data
- Results summarized by Claude before posting to Slack

**Priority:** Low
**Spec refs:** `spec-context-engine.md` §Clarify tools

---

## Feature-to-Story Traceability Matrix

| Feature / System Component | User Stories |
|---------------------------|-------------|
| Campaign wizard (7 steps) | US-2.1 – US-2.13 |
| Campaign launch API (`POST /campaigns/launch`) | US-2.12, US-2.4, US-2.14 |
| Draft auto-save (`POST /campaigns/draft`) | US-2.13 |
| Gmail OAuth integration | US-1.1 |
| SMTP/IMAP integration | US-1.2 |
| Apify Instagram lookalike | US-3.1, US-3.5, US-2.6 |
| Apify YouTube discovery | US-3.2 |
| Bio link scraper | US-3.1 |
| Influencer Club API | US-3.1 |
| Firecrawl product scraping | US-2.3, US-10.5 |
| `EnrichForCampaignWorkflow` | US-3.1 |
| `ThreadProcessingCoordinatorWorkflow` | US-5.1 – US-5.9, US-4.4, US-4.7 |
| `ThreadAssociateToCampaignWorkflow` | US-5.1 |
| `ThreadResponseDraftWorkflow` | US-5.4, US-4.3 |
| `ThreadFollowUpDraftWorkflow` | US-4.12 |
| `BulkDraftEditWorkflow` | US-4.9 |
| `PostTrackingWorkflow` | US-7.1, US-7.4 |
| `SendCampaignOutboxWorkflow` | US-2.12, US-6.5 |
| `SendCampaignFollowUpsWorkflow` | US-2.8 |
| `SendPostOptInFollowUpsWorkflow` | US-6.3 |
| `ThreadExtractMetricsWorkflow` | US-8.2 |
| `SlackOrderDigestWorkflow` | US-6.2 |
| Campaign association LLM | US-5.1 |
| Opt-in/out classification LLM | US-5.2 |
| Thread flag extraction LLM | US-5.3 |
| Creator extraction (3-phase) | US-3.3, US-5.7, US-6.7 |
| Metrics extraction LLM | US-8.2 |
| RAG draft generation | US-5.4, US-4.3 |
| RAG index ingestion | US-5.4, US-5.10 |
| Follow-up draft LLM | US-4.12 |
| Thread completion LLM | US-5.6 |
| Claude agent (campaign workflows) | US-5.8, US-6.1 |
| Attachment OCR / vision | US-5.9 |
| Post tracking vision | US-7.4 |
| Client summary generation | US-8.3 |
| Creator note generation | US-3.6 |
| Bulk draft edit LLM | US-4.9 |
| GoAffPro integration | US-6.1, US-10.1 |
| Shopify GraphQL (via GoAffPro) | US-6.2, US-10.1 |
| Slack SDK (operations) | US-6.2, US-10.2 |
| Google Sheets gspread | US-2.11, US-8.2, US-10.3 |
| PostHog webapp | US-8.6 |
| Langfuse | US-8.5, US-10.7 |
| Composio adapter | US-10.4 |
| Supabase Auth | US-1.3, US-1.4, US-1.5 |
| Team / team_member tables | US-9.1, US-9.2, US-9.4 |
| campaign_member_assignment | US-9.3, US-9.5 |
| RLS policies | US-9.5 |
| `can_access_campaign()` SECURITY DEFINER | US-9.5 |
| CSRF protection | US-1.4 |
| JWT auth (backend) | US-9.6 |
| Dev impersonation | US-9.6 |
| Context engine Slack bot | US-12.1 – US-12.5 |
| Context engine MCP tools | US-12.1 – US-12.5 |
| Meta-tool pattern (discover + execute) | US-12.1, US-12.2 |
| Creator campaign type | US-11.1 – US-11.4 |
| `campaign_outbox_queue` | US-4.10, US-2.12 |
| `gmail_thread_state` status machine | US-4.1, US-4.6, US-4.8 |
| `gmail_thread_llm_draft` | US-4.3, US-4.5 |
| `campaign_lookalike_suggestion` | US-3.5, US-2.6 |
| `creator_post` | US-7.1, US-7.2 |
| `email_reply_example` (RAG index) | US-5.4, US-5.10 |
| `campaign_workflow_execution` | US-5.8 |
| Email signature | US-4.11 |
| Product entity | US-2.3 |
| Dashboard analytics endpoint | US-8.1 |

---

## Priority Summary

| Priority | Count | Examples |
|----------|-------|---------|
| **Critical** | 15 | Campaign launch, Gmail OAuth, inbox view, draft review, send reply, campaign association |
| **High** | 46 | Creator enrichment, AI draft generation, RAG pipeline, opt-in detection, team management, Google Sheets |
| **Medium** | 20 | Creator notes, post tracking, client summary, Composio, external campaign mode, transcript queries |
| **Low** | 8 | Creator media kit, enrichment history, LLM observability, deployment queries, creator rate negotiation |

---

## Persona Coverage Summary

| Persona | Primary Epics | # Stories |
|---------|--------------|-----------|
| Brand Manager (BM) | 1 (partial), 2, 3 (partial), 5 (partial), 6 (partial), 7, 8, 10 | 38 |
| Campaign Operator (CO) | 3 (partial), 4, 5, 6 (partial), 7 (partial), 12 | 31 |
| Team Admin (TA) | 1 (partial), 9 | 7 |
| Creator (CR) | 11 | 4 |
| Internal (Platform/Product) | 8 (partial), 10 (partial) | 9 |

---

*Every story in this index is backed by observable codebase evidence. Story acceptance criteria reference specific API endpoints, Temporal workflows, LLM features, database tables, or UI components documented in the Wave 1 and Wave 2 analyses.*
