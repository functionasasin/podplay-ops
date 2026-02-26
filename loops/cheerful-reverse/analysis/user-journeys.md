# Analysis: user-journeys

**Aspect**: `user-journeys`
**Wave**: 2 — Cross-Cutting Analysis
**Dependencies**: All Wave 1 aspects
**Date**: 2026-02-26

---

## Overview

This document traces every distinct user journey end-to-end across the Cheerful platform. Each journey maps the full stack path: UI surface → API call → service logic → Temporal workflow → database operations → external integrations.

### Personas

| Persona | Description | Primary Concern |
|---------|-------------|-----------------|
| **Brand Manager** | Creates campaigns, sets strategy, reviews overall performance. Often not the day-to-day inbox operator. | Campaign health, creator pipeline, ROI metrics |
| **Campaign Operator** | Day-to-day inbox worker. Reviews AI-generated drafts, sends replies, manages creator relationships. | Inbox throughput, reply quality, flag triage |
| **Team Admin** | Manages user access and campaign assignments across a team. | Access control, workload distribution |
| **Creator** | A content creator using Cheerful to manage incoming brand deal inquiries. Reversed flow — they are the user, not the outreach target. | Deal qualification, rate negotiation |

---

## Journey Index

| # | Journey | Primary Persona | Complexity |
|---|---------|-----------------|------------|
| 1 | First-time onboarding | Brand Manager | Medium |
| 2 | Campaign creation (full wizard) | Brand Manager | High |
| 3 | Daily inbox operations | Campaign Operator | High |
| 4 | Creator opts in — response handling pipeline | Campaign Operator | High (mostly automated) |
| 5 | Creator enrichment — finding emails | Brand Manager | Medium |
| 6 | Creator discovery and outreach expansion | Brand Manager | Medium |
| 7 | Post-campaign gifting tracking | Campaign Operator | Low (mostly automated) |
| 8 | Shopify order management | Campaign Operator | Medium |
| 9 | Bulk draft editing | Campaign Operator | Medium |
| 10 | Rule generation and application | Campaign Operator | Low |
| 11 | Team creation and campaign assignment | Team Admin | Low |
| 12 | Campaign analytics and reporting | Brand Manager | Low |
| 13 | Creator managing brand deals | Creator | Medium |
| 14 | Context engine — Slack-based status queries | Brand Manager / Operator | Low |

---

## Journey 1: First-Time Onboarding

**Persona**: Brand Manager
**Goal**: Get from sign-up to a functional inbox ready to send outreach
**Trigger**: User navigates to app URL for the first time

### Step-by-Step Flow

```
1. USER: Navigate to / or /sign-in
   MIDDLEWARE: No session → redirect to /sign-in
   UI: UnifiedAuthForm renders (sign-in/sign-up combined)

2. USER: Enter email + password OR click "Continue with Google"
   FRONTEND: POST /auth/sign-up or Supabase OAuth
   DB: auth.users row created
   BACKEND: -

3. MIDDLEWARE: Detects authenticated user
   DB: Queries user_onboarding table (no row → onboarding incomplete)
   MIDDLEWARE: Redirect → /onboarding

4. USER: Progresses through 6 onboarding steps
   /onboarding        → Welcome screen (no input)
   /onboarding/connect → Integration showcase (no input)
   /onboarding/describe → Brand description textarea
   /onboarding/product  → Product details textarea
   /onboarding/role     → Role selection card (Brand Agency / Creator Agency / Creator / Sales / Other)
   /onboarding/referral → Referral source selection

   STORE: useOnboardingStore (Zustand + localStorage) persists selections across navigation

5. USER: Completes /onboarding/referral → clicks "Next"
   API: POST /v1/onboarding/complete {role, referral_source}
   DB: INSERT into user_onboarding (user_id, role, referral, completed=true)
   FRONTEND: useCompleteOnboarding mutation success
   MIDDLEWARE: Sets onboarding_completed cookie (avoids future DB query)
   REDIRECT: → /dashboard?startWalkthrough=true

6. UI: Dashboard renders with WelcomeModal
   Dashboard loads campaign list, metric cards (all empty for new user)
   WelcomeModal → opens WalkthroughModal (guided tour of the interface)

7. USER: Dismisses walkthrough → navigates to /mail
   MIDDLEWARE: Checks for Gmail credentials
   UI: useMailBootstrap checks for credentials → none found
   UI: connect-email-overlay.tsx renders (CTA: "Connect your Gmail")

8. USER: Clicks "Connect Gmail"
   UI: Opens /onboarding/connect-email in popup (or navigate)
   FLOW: Google OAuth popup via /auth/oauth-popup-callback
   CALLBACK: Receives OAuth code → exchanges for tokens
   API: POST /v1/users/gmail/connect {auth_code}
   BACKEND: Gmail API → validates token → stores encrypted refresh_token
   DB: INSERT user_gmail_account {user_id, email, refresh_token, ...}
   POPUP: postMessage to parent window → closes
   UI: Refresh; useMailBootstrap now finds credentials

9. BACKEND (async): AllPollHistoryWorkflow already running (global loop)
   - Detects new Gmail account in poll cycle
   - ProcessAccountMessagesWorkflow: Polls Gmail history API for this account
   - Ingests any existing emails (likely none initially)

10. RESULT: User sees empty inbox with demo email overlay
    Demo email shows simulated thread to illustrate the UI before real emails exist
    Sidebar setup checklist: "Connect email" ✓, "Create a campaign" pending
```

**Success Criteria**: User has connected Gmail account, can see the mail inbox, setup checklist shows first item complete.

**Key Design**: The middleware cookie (`onboarding_completed`) avoids a DB query on every subsequent page load. The demo email overlay reduces anxiety for new users who haven't sent any outreach yet.

---

## Journey 2: Campaign Creation (Full Wizard)

**Persona**: Brand Manager
**Goal**: Launch a gifting/seeding campaign to reach 500 influencers
**Trigger**: User clicks "New Campaign" or navigates to `/campaigns/new`

### Pre-conditions
- Gmail account connected
- Campaign type: seeding (gifting)

### Step-by-Step Flow

```
STEP 0: Campaign Creation Landing
  UI: /campaigns/new → CampaignCreationLanding renders
  USER: Selects "Advertiser" (brand doing outreach)
  STORE: useCampaignWizardStore.setSelectedUserType('advertiser')
  NEXT: Step 1

STEP 1: Campaign Details — Part A: Campaign Information
  UI: CampaignInformation component
  USER: Types "Summer 2026 Skincare Campaign" in name field
  USER: Clicks "Seeding / Gifting" type card
  STORE: { campaignName, selectedCampaignType: 'seeding' }

  [AI]: Campaign name triggers email suggestion fetch (debounced 300ms)
  API: POST /v1/campaigns/suggest-emails {campaign_name}
  BACKEND: ClaudeService → suggests relevant Gmail accounts based on name
  STORE: suggestedEmails populated

STEP 1: Campaign Details — Part B: Email Setup
  UI: EmailSetup component
  USER: Selects "Cheerful (Recommended)" as communication preference
  USER: Selects 3 Gmail accounts to send from
  STORE: { emailProvider: 'cheerful', selectedAccounts: [acc1, acc2, acc3] }
  COMPLETION CHECK: name ✓ + type ✓ + accounts ✓ → Step 1 complete
  NEXT: Step 2

STEP 2: Product Information
  UI: ProductDetails component (single product card initially)
  USER: Pastes "https://brand.com/product/serum"
  [TRIGGER]: URL blur event
  FRONTEND: POST /v1/products/scrape {url}
  BACKEND: FirecrawlService.scrape(url) → extracts name + description
  RESPONSE: { name: "Radiance Serum", description: "..." }
  STORE: products[0] = { name, description, url, inputMethod: 'ai' }
  USER: Reviews and edits description if needed
  COMPLETION CHECK: product name + description non-empty → Step 2 complete
  NEXT: Step 3

STEP 3: Creators (Recipient List)
  UI: Creators component with 3 tabs: Upload CSV / Search / Import
  USER: Uploads CSV with 500 rows: email, first_name, instagram_handle, follower_count

  CLIENT-SIDE: use-csv-parser.ts
  - Normalizes headers
  - Validates email format per row
  - Detects social handle columns
  - Produces: 487 valid rows, 13 skipped (invalid emails)
  - Detects custom columns → become merge tags: {{first_name}}, {{instagram_handle}}

  UI: Shows summary: "487 creators ready, 13 skipped"
  STORE: { csvFile, parsedCsvData: [...487 rows], csvHeaders: [...] }

  Additionally:
  USER: Clicks "Search" tab → runs Instagram lookalike search
  UI: EmbeddedSearchInput → types influencer handle
  API: POST /v1/creators/search/lookalike {handle, platform: 'instagram'}
  BACKEND: ApifyService.search_lookalike(handle)
  RESPONSE: 50 similar creators with follower counts
  USER: Selects 10 additional creators from results
  - 7 have emails → added to parsedCsvData directly
  - 3 have no email → added with sentinel email (SEARCH_PLACEHOLDER_PREFIX)

  STORE: parsedCsvData now has 497 rows (487 CSV + 10 search)
  NEXT: Step 4

STEP 4: Email Sequence
  UI: EmailOutreach with 3 tabs: Sequence / Opt-In/Out / Signature

  [AUTO-GENERATION on step navigate]:
  API: POST /v1/campaigns/generate-email {product, goal, type: 'seeding'}
  AI: Claude generates subject + body using campaign context
  STORE: { subjectLine: "...", emailBody: "...", isGeneratingEmailContent: false }

  USER: Reviews generated email, edits subject line
  USER: Clicks "Add Follow-Up" → adds 2 follow-up emails
  STORE: followUpTemplates: [{body: "...", days: 3}, {body: "...", days: 7}]

  USER: Clicks "Opt-In/Out" tab
  [AUTO-GENERATION]:
  AI: Generates opt-in + opt-out response templates
  STORE: { sampleEmailOptIn: "...", sampleEmailOptOut: "..." }

  USER: Reviews/edits → opens Email Preview modal
  UI: Renders initial email with {{first_name}} substituted from CSV row 1
  COMPLETION CHECK: subject non-empty + body non-empty → Step 4 complete
  NEXT: Step 5

STEP 5: Goals & FAQs
  UI: CampaignGoal + FAQs components

  [AUTO-GENERATION on navigate]:
  API: POST /v1/campaigns/generate-settings {product, campaign_type}
  AI: Generates campaignGoal + 5 FAQs
  STORE: { campaignGoal: "...", campaignFaqs: [{text: "Q|||A"}, ...] }

  USER: Reviews goal, edits 2 FAQs, deletes 1, adds 1 custom
  COMPLETION CHECK: campaignGoal non-empty → Step 5 complete
  NEXT: Step 6

STEP 6: Integrations
  UI: Integrations component with 3 integration cards

  USER: Toggles Google Sheets ON → modal opens
  USER: Pastes Sheet URL
  API: GET /v1/google-sheets/tabs?url=...
  BACKEND: GoogleSheetsService.get_tabs(url) → validates access + returns tab list
  USER: Selects "Creator Tracking" tab

  [AUTO-GENERATION]:
  API: POST /v1/campaigns/generate-tracking-rules {goal, product}
  AI: Generates tracking rules: ["Record email address", "Record follower count", ...]
  STORE: trackingRules: [...]

  USER: Toggles Shopify ON → modal opens
  USER: Enters GoAffPro API token
  API: POST /v1/shopify/verify-token {token}
  BACKEND: Validates against GoAffPro API → returns product catalog
  USER: Selects product + variant for order tracking
  USER: Configures 20% discount code format
  STORE: { goaffproToken, shopifyDiscountEnabled, shopifyProducts, ... }

  USER: Clicks Shopify modal "Save" → integration ready
  COMPLETION CHECK: sheets URL valid + tab selected + rules > 0 + shopify token valid → Step 6 complete
  NEXT: Step 7

STEP 7: Review & Launch
  UI: ReviewLaunch (left) + CampaignSettings (right)

  USER: Reviews all sections — can click "Edit" buttons to jump back
  USER: Sets Automation Level to "Semi-automated"
  USER: Enables Lookalike Suggestions

  USER: Clicks "Launch Campaign"
  FRONTEND: useCampaignSubmit.submitCampaign()

  PAYLOAD ASSEMBLY:
  - campaign_data JSON: { campaign_name, type: 'seeding', goal, faqs, rules,
                           senders: [acc1, acc2, acc3],
                           recipients: [...487 valid rows],  // 3 sentinel-email rows filtered out
                           has_creators_pending_enrichment: true,  // 3 search creators need enrichment
                           follow_up_templates: [...2 templates],
                           sample_emails: {opt_in: "...", opt_out: "..."},
                           integrations: { shopify: {...}, google_sheets: {...} },
                           automation_level: 'semi_automated',
                           enable_lookalike_suggestions: true }
  - csv_file: the original CSV file

  API: POST /v1/campaigns/launch (multipart FormData)

  BACKEND (CampaignLaunchRoute):
  1. Create campaign record + all metadata
  2. Bulk upsert 487 campaign_recipient rows
  3. Create 3 campaign_sender records
  4. Generate email_signature record from wizard signature
  5. Start Temporal workflow: campaign_outbox_population_id
  6. Return: { campaign_id, workflow_id }

  TEMPORAL (Campaign Outbox Population):
  - Round-robin sender assignment across 3 accounts
  - For each of 487 recipients:
    - Apply {{merge_tag}} personalization using per-recipient custom fields
    - Insert campaign_outbox_queue row (state: pending)
    - Insert follow-up queue entries (pending, unscheduled until first email sent)

  TEMPORAL (EnrichForCampaignWorkflow — parallel):
  - For 3 search-added creators without emails:
    - Waterfall: cache check → Apify profile scrape → bio link crawl → Influencer Club
    - On email found: update campaign_recipient.email + queue outbox entry

  RESULT: Campaign created, 487 outbox entries ready
  UI: CampaignSuccess screen renders with creator count + inbox link
```

**Success Criteria**: Campaign visible in `/campaigns` list with `active` status. Outbox populated. First batch of outreach emails ready to send.

**Key Design**:
- Personalization happens at queue-time (not send-time), so each recipient's email is already assembled when the sending workflow runs
- The 3 sentinel-email search creators are excluded from recipients but flagged for enrichment — they'll join the outreach after emails are found
- Google Sheets access is verified before wizard completion (not at send time) to prevent runtime failures

---

## Journey 3: Daily Inbox Operations

**Persona**: Campaign Operator
**Goal**: Process a day's worth of creator responses across multiple campaigns
**Trigger**: User opens `/mail` at start of work day

### Step-by-Step Flow

```
1. USER: Navigate to /mail
   MIDDLEWARE: Auth check → session valid
   SERVER-COMPONENT (mail-client-wrapper.tsx):
   - Fetches Gmail accounts
   - Hydrates account list into HTML to prevent layout shift

2. UI BOOTSTRAP (useMailBootstrap):
   - Checks localStorage for CHEERFUL_ACCOUNTS (fast path)
   - If missing: server action getMailBootstrap()
   - Returns: list of connected Gmail/SMTP accounts
   - If none: shows connect-email-overlay

3. QUERY INITIALIZATION (useMailQueries):
   API: GET /v1/threads?status=pending&account_ids[]=acc1&account_ids[]=acc2&...&include_messages=true
   Note: ALL 61 account IDs in one request (reduces 122 potential requests to 2)
   BACKEND (GmailMessageRoute.list_threads):
   - Joins gmail_message + latest_gmail_message_per_thread + gmail_thread_state
   - Applies RLS: user_id = auth.uid()
   - Applies filters: status=WAITING_FOR_DRAFT_REVIEW + not hidden
   - Returns: list of threads with messages inline

   RESPONSE: 47 threads pending review

4. UI: Thread list renders with:
   - Thread item per creator (subject, sender, timestamp, campaign icon)
   - Status badges: DRAFT (AI-generated) or manual
   - Flag icons: 💰 (wants_paid), ❓ (has_question), ⚠️ (has_issue)

5. USER: Clicks thread from creator "Sarah (@sarah_glows)"
   UI: mail-display.tsx renders full thread
   - Messages displayed chronologically
   - All except last collapsed (show only snippet)
   - Last message auto-expanded

6. USER: Reads AI-generated draft in reply compose box
   UI: TipTap editor shows HTML draft
   - If AI draft exists: loaded from gmail_thread_llm_draft table
   - If no AI draft: empty compose box

7. OPERATOR ACTION A — Approve draft as-is:
   USER: Clicks "Send"
   useEmailSend.sendEmail():
   - Builds RFC 2822 headers (In-Reply-To, References)
   - POST /v1/emails/send { thread_id, body, to, cc, subject }
   BACKEND (EmailRoute.send):
   - GmailService.send_message() or SmtpService.send()
   - Updates gmail_thread_state → DONE (if opt-out/done) or WAITING_FOR_INBOUND
   FRONTEND post-send:
   - Appends synthetic message to thread UI immediately
   - Deletes local draft from mail-draft-store
   - Triggers silent background refetch of thread list
   - Thread moves from Pending → no longer visible in pending view

8. OPERATOR ACTION B — Edit draft before sending:
   USER: Edits AI draft text manually
   STORE: mail-draft-store auto-saves on every keystroke (debounced)
   USER: Optionally uses "Cheerify" dropdown:
     - Selects "Make friendlier"
     - API: POST /v1/improve-email-content-stream {action: 'friendly', text}
     - SSE streaming response → text updates token-by-token
     - [UNDO] button appears to restore previous version
   USER: Sends edited email
   POST-SEND: use-rule-suggestions triggers
     - Computes diff between original AI draft + sent version
     - If substantial diff: POST /api/rules-suggestion
     - AI generates 1-3 rule suggestions
     - Rule suggestions appear as dismissable toast notifications

9. OPERATOR ACTION C — Hide/archive thread:
   USER: Clicks hide button (thread resolved / wrong person)
   useThreadVisibility.hideThread():
   PATCH /v1/threads/{id}/hide
   DB: gmail_thread_user_preferences.is_hidden = true
   UI: Thread removed from Pending list, auto-selects next thread

10. OPERATOR ACTION D — Triage by flags:
    USER: Notices 💰 flag on 3 threads (creators asking for payment)
    USER: Clicks "Drafts" view → sees threads where payment was mentioned
    USER: Handles each: updates campaign_creator.paid_promotion_status via API
    (or leaves for brand manager to decide compensation)

11. OPERATOR ACTION E — Thread not in right campaign:
    USER: Notices thread assigned to wrong campaign
    UI: Campaign reassignment dropdown in thread detail
    API: POST /v1/threads/{id}/reassign {campaign_id}
    BACKEND: Updates campaign_thread.campaign_id
    Thread reprocessed with new campaign context

12. END OF DAY: 47 threads processed
    - 31 approved as-is (AI drafts sent)
    - 9 manually edited and sent
    - 4 hidden (irrelevant)
    - 3 escalated (💰 flag — need brand manager decision)
```

**Success Criteria**: Pending inbox cleared (or at minimum, first-priority threads handled). No outstanding creator questions unanswered.

**Key Design**:
- The AI draft generation happens asynchronously via Temporal before the operator opens the thread — by the time the operator clicks a thread, the draft is ready
- The flag icons (`wants_paid`, `has_question`, `has_issue`) let operators triage without reading full emails
- Cheerify's undo mechanism is critical because AI suggestions sometimes miss context — operators need a safe "try it and revert" workflow
- Rule suggestions are fire-and-forget (async) and appear as non-blocking toasts

---

## Journey 4: Creator Response Handling Pipeline (Automated)

**Persona**: Backend system (Temporal workflows), observed by Campaign Operator
**Goal**: Process an incoming creator reply end-to-end from receipt to draft generation
**Trigger**: Creator replies to an outreach email

### Step-by-Step Flow

```
INGESTION (AllPollHistoryWorkflow, continuous loop):
  TEMPORAL: AllPollHistoryWorkflow runs eternally via continue_as_new
  For each active Gmail account (up to 3 concurrent):
    ProcessAccountMessagesWorkflow:
      ACTIVITY: poll_history_activity
      - Gmail history API with last known history_id
      - Returns: list of new message IDs + history_id delta
      ACTIVITY: ingest_single_message_activity (per new message)
      - Fetch full MIME from Gmail API
      - Upload raw .eml to Supabase Storage
      - Parse: RFC 2822 headers, body, attachments
      - DB: INSERT gmail_message {thread_id, from_email, body_text, direction: 'inbound', ...}
      - DB: TRIGGER updates latest_gmail_message_per_thread
      ACTIVITY: update_history_id_activity (only after ALL messages succeed)
      - DB: UPDATE user_gmail_account.last_poll_history_id

THREAD STATE SYNC (ThreadSyncWorkflow):
  - Fetches threads needing state updates
  - DB: Batch insert gmail_thread_state rows
  - Fans out: ThreadProcessingCoordinatorWorkflow per thread

COORDINATOR (ThreadProcessingCoordinatorWorkflow — the orchestrator):
  Note: ~20 steps, most important path documented here

  STEP 1: Ensure complete thread
    ACTIVITY: ensure_complete_thread_ingested_activity
    - Gap-fills: fetches any messages not yet in DB
    - Ensures all historical messages are available for context

  STEP 2: Campaign association
    ACTIVITY: maybe_find_campaign_by_thread_id_activity
    - DB lookup of campaign_thread (was this sender already in a campaign?)

    If NO match found:
      ACTIVITY: handle_thread_no_campaign_activity
      - EmailLoaderService: reconstructs thread as XML context
      - AI (gpt-4.1-mini): "Which campaign best fits this thread?"
      - AI (gpt-4.1-mini): Double-check confirmation
      - Filter: same-private-domain filtering (avoids self-matching)
      - DB: INSERT campaign_thread {campaign_id, thread_id}

    If still NO campaign: thread marked IGNORE → stop

  STEP 3: Execute custom AI workflows (if any)
    ACTIVITY: execute_campaign_workflows_activity
    - Loads active workflows for this campaign
    - AI (gpt-4.1-mini): classifies which workflows apply to this thread
    - For applicable workflows:
      - Builds MCP tool allowlist from workflow.tool_slugs
      - Creates user-scoped Composio connection
      - Claude Agent SDK: runs agentic workflow with MCP tools
      - Extracts WORKFLOW_OUTPUT_{uuid} blocks from response
      - DB: INSERT campaign_workflow_execution {output_data, ...}

  STEP 4: Extract campaign creator
    ACTIVITY: extract_campaign_creator_activity
    - AI (gpt-4.1-mini): identify unique creators in thread
    - AI (gpt-5.1): extract creator details (name, platform, handle, role)
    - Multi-strategy dedup:
      1. Exact email match against existing campaign_creator
      2. Thread + name match
      3. Signal candidate fuzzy match
      4. AI fuzzy matching (last resort)
    - DB: UPSERT campaign_creator {name, email, platform, handle, ...}
    - If gifting campaign + CONTACTED state: tracks first opt-in date
    - AI (gpt-4o-mini): generates a note describing the creator's response
    - DB: APPEND to campaign_creator.notes_history (max 3 entries)

  STEP 5: Generate lookalike suggestions (on opt-in)
    ACTIVITY: generate_lookalikes_for_opt_in_activity
    - If creator opted in AND lookalike_suggestions enabled:
      - AI (gpt-4.1-mini): extracts Instagram keywords from handle if needed
      - Apify: searches for similar creators
      - DB: INSERT campaign_lookalike_suggestion rows (status: pending)

  STEP 6: Extract thread flags
    ACTIVITY: extract_thread_flags_activity (fire-and-forget)
    - AI (gpt-4.1-nano): { wants_paid, has_question, has_issue }
    - DB: UPSERT thread_flag

  STEP 7: Cancel follow-ups on INBOUND
    ACTIVITY: cancel_follow_ups_on_reply_activity
    - If INBOUND message detected + pending follow-ups exist:
    - DB: UPDATE campaign_follow_up_outbox_queue SET status=cancelled WHERE status=pending

  STEP 8: Metrics extraction (if enabled)
    ACTIVITY: extract_metrics_from_thread_using_llm_activity
    - AI (gpt-4.1): extract defined metrics for this campaign
    - Self-reviewing loop (up to 3 attempts) for accuracy
    - Google Sheets API: write metrics to campaign's tracking sheet

  STEP 9: Opt-in/out classification
    ACTIVITY: classify_thread_opt_in_activity
    - AI (gpt-4.1-mini): { is_opt_in, asked_questions, should_auto_send }
    - asked_questions=True → auto_send BLOCKED even if opt_in

  STEP 10A: Auto-send (semi-automated mode + simple opt-in)
    ACTIVITY: auto_send_response_activity
    - AI generates reply using campaign context + RAG examples
    - Gmail API: send immediately (no human review)
    - DB: INSERT gmail_thread_llm_draft (audit trail)

  STEP 10B: Generate draft for human review
    ACTIVITY: generate_draft_with_rag_activity (primary path for Gmail)
    - ThreadSummarizer (claude-haiku-4.5): builds RAG query string
    - EmbeddingService: vectorize query
    - DB: pgvector cosine similarity search on email_reply_example
    - Returns top-5 similar past replies (threshold 0.3)
    - AI (claude-opus-4.5): generates draft with RAG examples injected
    ACTIVITY: upload_llm_draft_to_gmail_activity
    - Gmail Drafts API: creates draft in Gmail (not sent)
    ACTIVITY: write_llm_draft_to_db_activity
    - DB: INSERT gmail_thread_llm_draft {draft_html, ...}
    - DB: UPDATE gmail_thread_state → WAITING_FOR_DRAFT_REVIEW

  STEP 11: Ingest sent reply as RAG example
    ACTIVITY: ingest_sent_reply_as_example_activity (fire-and-forget)
    - If a reply was sent: sanitize → embed → store as training example
    - DB: INSERT email_reply_example {embedding, sanitized_text}

  STEP 12: Check if thread is done
    ACTIVITY: check_if_thread_is_done_activity
    - AI (gpt-4.1-mini): is conversation complete? (creator declined / goal achieved)
    - If done: DB: UPDATE gmail_thread_state → DONE → stop follow-up scheduling

  STEP 13: Schedule follow-up
    If not done + follow-up templates exist:
    - DB: UPDATE campaign_follow_up_outbox_queue SET scheduled_at = now() + delay_days

RESULT:
  - gmail_thread_state.status = WAITING_FOR_DRAFT_REVIEW
  - gmail_thread_llm_draft populated with AI-generated reply
  - Thread appears in operator's Pending inbox with DRAFT badge
  - Operator sees reply ready for review → Journey 3
```

**Success Criteria**: Thread has an AI-generated draft ready for human review within minutes of creator's reply being detected.

**Key Design**:
- The coordinator workflow is fault-tolerant — each activity has its own retry policy. LLM activities fail fast (max_attempts=1) while DB writes retry up to 5 times.
- RAG draft quality depends on past human-sent replies being indexed. New campaigns start with zero RAG examples and improve over time as operators send replies.
- `should_auto_send=False` whenever the creator asked a question — ensures humans handle nuanced responses even in semi-automated mode.

---

## Journey 5: Creator Enrichment — Finding Emails

**Persona**: Brand Manager / Campaign Operator
**Goal**: Add Instagram creators discovered via search to campaign outreach, despite having no known email addresses
**Trigger**: User finds creators via Search or Lists without email

### Step-by-Step Flow

```
PATH A: In Campaign Wizard (Step 3 — Search tab)
  USER: Searches for creators by keyword
  UI: EmbeddedSearchResults shows creators
  USER: Selects creators without emails
  STORE: Added with sentinel email (SEARCH_PLACEHOLDER_PREFIX@...)
  On wizard submit: has_creators_pending_enrichment = true
  BACKEND: EnrichForCampaignWorkflow triggered parallel to outbox population

PATH B: From Creator List → Add to Campaign
  USER: Views list detail at /lists/{id}
  USER: Selects creators without emails → "Add to Campaign"
  API: POST /v1/lists/{id}/add-to-campaign {campaign_id, creator_ids}
  BACKEND: Triggers EnrichForCampaignWorkflow

PATH C: From Creator Search → Add to List
  USER: Searches on /search page
  USER: Multi-selects creators → "Add to List" button
  UI: isAddToListModalOpen = true → select target list
  API: POST /v1/creator-lists/{list_id}/add-from-search
  Creators added to list with enrichment_status: 'pending'

PATH D: Campaign Enrichment Page (manual override)
  USER: Navigates to /campaigns/{id} → Enrichment tab
  UI: Shows creators with enrichment_status: 'pending'
  USER: For specific creator: clicks "Override Email" → manually enters email
  API: POST /v1/campaigns/{id}/creators/{creator_id}/override-email {email}
  BACKEND: Updates email + immediately queues outbox entry

ENRICHMENT WATERFALL (EnrichForCampaignWorkflow):
  For each creator needing enrichment:
  ACTIVITY: enrich_creator_for_campaign_activity

  Step 1: Cache check
    DB: SELECT from creator WHERE (platform, handle) matches
    If email found in cache: use it → skip remaining steps

  Step 2: Apify profile scrape
    EXTERNAL: Apify Instagram scraper for the creator's handle
    PARSE: Extract email from bio, linktree links, etc.
    If found: save email → skip remaining steps
    24-hour cooldown per creator to avoid re-scraping (creator_enrichment_attempt)

  Step 3: Bio link crawl
    EXTERNAL: Apify bio link scraper (follows links in bio)
    PARSE: Crawl linked pages for contact email
    If found: save email → skip remaining steps

  Step 4: Influencer Club
    EXTERNAL: Influencer Club API
    PARSE: Returns verified contact email
    If found: save email

  On email found:
    DB: UPDATE creator.email (upsert_creator function, preserves existing if null)
    DB: UPDATE campaign_recipient.email
    DB: INSERT campaign_outbox_queue (pending) for this recipient
    UI: Enrichment status polling updates the campaign enrichment view

  On email NOT found:
    DB: UPDATE campaign_creator.enrichment_status = 'failed'
    Campaign operator notified (status visible in campaign view)

FRONTEND POLLING (use-enrichment-polling.ts):
  - Polls GET /v1/campaigns/{id}/enrichment-status every N seconds
  - Updates per-creator enrichment status badges
  - On completion: shows summary (X found, Y not found)

RESULT:
  - Creators with found emails: added to outbox, receive outreach in next sending cycle
  - Creators without emails after waterfall: marked 'failed', excluded from outreach
```

**Success Criteria**: Maximum number of discovered creators receive outreach emails, with failed enrichments clearly flagged for manual follow-up.

**Key Design**:
- The 15-day enrichment cooldown (`creator_enrichment_attempt` table) prevents repeatedly hitting external APIs for unfindable creators
- The `upsert_creator()` DB function preserves an existing email if the new scraped value is null — prevents accidentally clearing a known email
- The `has_creators_pending_enrichment` flag tells the backend to launch enrichment asynchronously alongside outbox population, not sequentially

---

## Journey 6: Creator Discovery and Outreach Expansion

**Persona**: Brand Manager
**Goal**: Find new creators similar to existing successful ones; add them to ongoing campaign
**Trigger**: Campaign is running; brand wants to expand reach

### Sub-journey A: Lookalike Suggestions from Opt-Ins

```
TRIGGER: Creator opts in → ThreadProcessingCoordinatorWorkflow runs
  ACTIVITY: generate_lookalikes_for_opt_in_activity
  - If campaign.enable_lookalike_suggestions = true
  - Apify lookalike search from opted-in creator's handle
  - Filter by follower count (campaign minimum)
  - Filter: remove existing recipients (dedup)
  - DB: INSERT campaign_lookalike_suggestion rows (status: pending)

FRONTEND: Campaign detail page shows suggestions tab
  API: GET /v1/campaigns/{id}/lookalike-suggestions
  USER: Reviews suggested creators
  USER: "Accept" → adds to campaign recipients (triggers enrichment)
  USER: "Reject" → status = rejected (won't appear again)
  API: PATCH /v1/campaigns/{id}/lookalike-suggestions/{id} {status}
  On accept: backend triggers enrichment + outbox population for new recipient
```

### Sub-journey B: Manual Creator Search and Add

```
USER: Navigate to /search
  UI: SearchPageClient renders
  USER: Types Instagram handle of a similar brand's top creator
  USER: Selects "Find similar" mode (looklike search)
  API: POST /v1/creators/search/lookalike {handle, platform: 'instagram'}
  BACKEND: ApifyService.search_lookalike + deduplicate
  RESPONSE: 50 similar creators with follower/engagement metrics

  ALTERNATIVELY:
  USER: Types keyword ("skincare", "beauty tips")
  API: POST /v1/creators/search/keyword {query, platform, min_followers}
  BACKEND: InfluencerClubService.keyword_search
  RESPONSE: paginated creator list with IC metadata

  USER: Browses results, clicks creator profile
  UI: Creator detail sheet slides in
  USER: Multi-selects 20 creators → "Add to List"
  UI: Add-to-list modal → selects or creates target list
  API: POST /v1/creator-lists/{id}/add-from-search {creator_ids}
  DB: INSERT creator_list_item rows
  NOTIFICATION: Animated spinner on /search nav icon clears

  USER: Navigates to /lists/{id}
  USER: Selects list → "Add to Campaign"
  API: POST /v1/lists/{id}/add-to-campaign {campaign_id}
  BACKEND: add_creators_to_campaign service:
    - Creators with email: INSERT campaign_recipient + outbox entry
    - Creators without email: INSERT with enrichment_status=pending
  TEMPORAL: EnrichForCampaignWorkflow (for creators needing enrichment)
  RESULT: Creators added to campaign; outreach scheduled
```

### Sub-journey C: Campaign Discovery (Automated Weekly)

```
TEMPORAL: CampaignDiscoverySchedulerWorkflow (weekly cron)
  For each campaign with discovery_enabled = true:
    CampaignDiscoveryWorkflow:
      ACTIVITY: discover_creators_for_campaign_activity
      - Reads campaign.discovery_config (seed profiles, follower min/max)
      - Apify lookalike search for each seed profile
      - Apply follower filter + email availability filter
      - Dedup against existing campaign_recipient emails
      DB: INSERT new campaign_recipient rows
      ACTIVITY: populate_outbox_for_new_recipients_activity
      - INSERT campaign_outbox_queue entries for each new recipient
      RESULT: Campaign automatically expands week-over-week
```

**Success Criteria**: Campaign recipient list grows over time through discovery + manual search, maintaining outreach velocity without manual effort.

---

## Journey 7: Post-Campaign Gifting Tracking

**Persona**: Campaign Operator (passive — mostly automated)
**Goal**: Detect when a gifted creator publishes a sponsored post and record the engagement metrics
**Trigger**: Creator opts in, gift shipped, 30-day tracking window begins

### Step-by-Step Flow

```
SETUP (tracked in creator record):
  DB: campaign_creator {
    gifting_status: 'SHIPPED',
    post_tracking_starts_at: NOW(),
    post_tracking_ends_at: NOW() + 30 days,
    instagram_handle: '@sarah_glows'
  }

DETECTION (PostTrackingSchedulerWorkflow, 48h loop):
  ACTIVITY: get_trackable_creators_activity
  - DB: SELECT campaign_creator WHERE post_tracking_ends_at > NOW()
  - Returns: creators within active tracking window

  ACTIVITY: process_creator_posts_activity (per creator)
  - ApifyService.get_instagram_posts(@sarah_glows)
  - If last_seen_post_id unchanged: SKIP (no new posts)
  - For each new post since last_seen_post_id:

    METHOD 1 — Caption match (fast):
    - Check if post caption mentions brand keywords
    - If yes: match_method = 'caption'

    METHOD 2 — LLM vision (slow, if caption miss):
    - Download post thumbnail
    - Claude (claude-sonnet-4): analyze image → is this a sponsored post?
    - If yes: match_method = 'llm'

    On match:
    - DB: INSERT creator_post {creator_id, campaign_id, post_url, media_url, match_method}
    - Supabase Storage: upload post image
    - DB: UPDATE campaign_creator.last_seen_post_id

OPERATOR VIEW:
  USER: Opens campaign detail → "Posts" tab
  UI: Grid of detected creator posts with thumbnails
  USER: Can "Delete false positive" (removes post from tracking)
  API: DELETE /v1/creator-posts/{id}

RESULT:
  - Campaign automatically tracks which creators published posts
  - Metrics available: post date, engagement data (if pulled from Apify)
  - Operators see proof of content without manual Instagram checking
```

**Success Criteria**: Automated detection of sponsored posts within 48 hours of publication with < 5% false positives.

---

## Journey 8: Shopify Order Management

**Persona**: Campaign Operator
**Goal**: Process a creator's gifting order after they opt in and provide their shipping address
**Trigger**: Creator opts in, provides shipping address in email thread; agentic workflow extracts order details

### Step-by-Step Flow

```
SETUP: Campaign has Shopify integration configured (Journey 2)

WORKFLOW EXECUTION (ThreadProcessingCoordinatorWorkflow, Step 3):
  ACTIVITY: execute_campaign_workflows_activity
  - Applicable workflow: "Extract Shipping Address and Create Order"
  - Claude Agent SDK runs with Shopify MCP tools
  - Agent reads thread context → extracts: name, address, variant
  - Agent calls mcp__shopify__create_order_draft (via Composio)
  - DB: INSERT campaign_workflow_execution {output_data: {name, address, ...}}

SLACK NOTIFICATION (SlackOrderDigestWorkflow):
  TEMPORAL: Daily (or per-opt-in) digest
  ACTIVITY: post_slack_order_digest_activity
  - Loads campaign_workflow_execution outputs (order drafts)
  - Enriches with creator details from campaign_creator
  - Slack API: post_message to campaign.slack_channel_id
  - Message format: creator name, product, shipping address, [Approve] [Skip] [Edit] buttons
  - DB: UPDATE campaign_workflow_execution {slack_message_ts, slack_approval_status: 'pending'}

SLACK INTERACTION (User clicks button in Slack):
  Slack → POST /v1/slack/interactions (webhook)
  BACKEND: verify HMAC-SHA256 signature

  CASE A: User clicks [Approve]
  BACKEND: SlackRoute.handle_approve_order()
  - Async: Creates actual Shopify order via GoAffPro API
  - GoAffProService.create_order(campaign_id, creator_id, address, product)
  - DB: UPDATE campaign_creator.shopify_order_id, gifting_status → 'PROCESSING'
  - Slack: Update message to show "✓ Order created"

  CASE B: User clicks [Edit]
  BACKEND: SlackRoute.handle_edit_order()
  - Opens Slack modal with editable fields (address, variant)
  - User edits → Slack modal submit
  BACKEND: SlackRoute.handle_view_submission()
  - DB: UPDATE campaign_workflow_execution.output_data with edits
  - Slack: Update original message with new details

  CASE C: User clicks [Skip]
  BACKEND: SlackRoute.handle_skip_order()
  - DB: UPDATE campaign_workflow_execution.slack_approval_status = 'skipped'
  - Slack: Update message to show "— Skipped"

RESULT:
  - Shopify orders created with human approval (via Slack)
  - Full audit trail in campaign_workflow_execution
  - Creator gifting_status progresses through pipeline
```

**Success Criteria**: Orders approved within same business day of creator opt-in, without operator needing to leave Slack.

**Key Design**:
- The Slack approval workflow creates an asynchronous human-in-the-loop process — operators don't need to check the web app for order approvals
- HMAC signature verification ensures Slack interaction webhooks are genuine
- The edit modal allows fixing AI extraction errors (e.g., wrong address format) before creating the actual Shopify order

---

## Journey 9: Bulk Draft Editing

**Persona**: Campaign Operator
**Goal**: Apply a consistent improvement to all pending AI-generated drafts in a campaign
**Trigger**: Operator edits and sends a draft, system detects the edit is generalizable

### Step-by-Step Flow

```
TRIGGER: Operator edits and sends a draft (Journey 3, Action B)

BACKGROUND CLASSIFICATION (use-bulk-edit.ts, fire-and-forget):
  POST /api/classify-edit { original_draft, sent_draft, campaign_id }
  BACKEND (Next.js API → Claude): "Is this edit generalizable to other drafts?"
  AI RESPONSE: { shouldOffer: true, instruction: "Add our $20 discount code to every offer" }

  IF shouldOffer = true:
  API: GET /v1/campaigns/{id}/pending-draft-count
  RESPONSE: { count: 47 }

  UI: Floating action bar appears (non-blocking, at top of inbox)
  "Apply this improvement to 47 pending drafts?"
  [Apply to All] [Dismiss]

USER: Clicks "Apply to All"
  OPTIONS: "Also save as campaign rule" checkbox

  API: POST /v1/campaigns/{id}/bulk-draft-edit { instruction, save_as_rule }
  BACKEND: Triggers BulkDraftEditWorkflow

  TEMPORAL (BulkDraftEditWorkflow):
    ACTIVITY: get_pending_drafts_for_campaign_activity
    - DB: SELECT gmail_thread_llm_draft WHERE campaign_id + status=pending
    - Returns: 47 draft records
    Fan-out: apply_edit_to_draft_activity (parallel)
    For each draft:
      - AI (GPT-4.1): Apply instruction to this specific draft
      - DB: UPDATE gmail_thread_llm_draft.draft_html
      If save_as_rule:
        ACTIVITY: save_rule_to_campaign_activity
        - DB: INSERT/UPDATE campaign.rules_for_llm

  After 5 seconds (workflow grace period):
  FRONTEND: Invalidate mailKeys.all → thread list refreshes
  UI: 47 drafts now show updated content when operator opens them

RESULT:
  - All pending drafts updated with consistent instruction
  - Optional: instruction saved as persistent campaign rule (affects future AI drafts)
  - Operator's individual edit influenced system-wide behavior
```

**Success Criteria**: Bulk edit applied to all pending drafts within a few minutes, with rule optionally persisted for future use.

---

## Journey 10: Rule Generation and Application

**Persona**: Campaign Operator
**Goal**: Encode learned best practices into campaign rules so future AI drafts automatically incorporate them
**Trigger**: Operator notices a pattern in creator questions that the AI keeps missing

### Step-by-Step Flow

```
ORGANIC DISCOVERY (via Rule Suggestions):
  After sending edited draft → use-rule-suggestions.ts fires
  BACKEND: AI analyzes diff between original + edited draft
  GENERATES: "When creator asks about exclusivity, always mention our 30-day exclusivity window"
  UI: Toast notification with [Accept] [Dismiss]

  USER: Clicks [Accept]
  API: POST /v1/campaigns/{id}/rules { rule_text }
  DB: UPDATE campaign.rules_for_llm APPEND new rule

MANUAL RULE CREATION (from Review & Launch or Campaign Settings):
  USER: Navigates to /campaigns/{id} → Settings
  UI: Rules section shows existing rules list
  USER: Clicks "Add Rule" → types rule text
  API: POST /v1/campaigns/{id}/rules
  DB: UPDATE campaign.rules_for_llm

EFFECT ON FUTURE DRAFTS:
  Next ThreadProcessingCoordinatorWorkflow for this campaign:
  ACTIVITY: generate_draft_using_llm_activity
  - Loads campaign.rules_for_llm
  - Injects rules into Claude prompt as explicit constraints
  - AI draft automatically incorporates the rule
  Example: every future draft now mentions the exclusivity window

BULK RULE APPLICATION (from Journey 9):
  After BulkDraftEditWorkflow completes with save_as_rule=true:
  - Rule is saved to campaign AND applied to all current pending drafts
  - Dual effect: immediate + future

MONITORING:
  No explicit rule effectiveness tracking in current system
  (Rule quality judged by operator through continued use)
```

**Success Criteria**: Rules reduce the manual editing needed per draft over time as the AI learns campaign-specific constraints.

---

## Journey 11: Team Creation and Campaign Assignment

**Persona**: Team Admin
**Goal**: Onboard a new team member and give them access to specific campaigns
**Trigger**: Company grows, needs to distribute inbox workload

### Step-by-Step Flow

```
TEAM CREATION:
  USER: Navigate to /team
  UI: TeamPage renders (not in sidebar — direct URL)
  USER: Clicks "Create Team"
  API: POST /v1/teams { name: "Summer Campaign Team" }
  DB: INSERT team, INSERT team_member (owner role)
  UI: Team card appears in left panel

INVITE TEAM MEMBER:
  USER: Opens team detail → "Invite Member"
  USER: Enters email of team member
  API: POST /v1/teams/{id}/invite { email }
  BACKEND: Supabase Auth invite email sent to new member
  DB: INSERT team_member (member role, status: pending)

  NEW MEMBER: Receives invite email → clicks link
  NEW MEMBER: Completes set-password flow
  DB: team_member.status → active

CAMPAIGN ASSIGNMENT:
  USER (admin): Opens team detail → "Campaign Assignments" section
  UI: Shows list of all user's campaigns with assignment toggles
  USER: Toggles ON "Summer 2026 Skincare Campaign" for new member
  API: POST /v1/teams/{team_id}/members/{member_id}/campaigns { campaign_ids }
  DB: INSERT campaign_member_assignment {campaign_id, team_member_id}

  ALTERNATIVELY: Bulk assign
  USER: Selects multiple campaigns → "Assign Selected" button
  API: POST /v1/teams/{id}/bulk-assign-campaigns

RLS EFFECT:
  DB: can_access_campaign() SECURITY DEFINER function
  - Now returns true for new member on assigned campaigns
  - Member can see: campaign_thread, gmail_thread_state, campaign_creator, etc.

  CAVEAT: Member CANNOT see campaign_sender credential tables
  (Passwords/tokens excluded from team member access by design)

MEMBER EXPERIENCE:
  USER (member): Logs in → sees mail inbox
  UI: Inbox shows threads ONLY for assigned campaigns
  UI: No access to unassigned campaign threads (RLS enforced)

  SENDING: Member uses team path in useEmailSend:
  - POST /v1/emails/send (service API, bypasses owner-only Gmail auth)
  - Backend sends via campaign owner's Gmail account on member's behalf
  - Thread state update handled server-side (member doesn't own Gmail OAuth)
```

**Success Criteria**: New team member can see and respond to threads in assigned campaigns within minutes of being invited, without sharing Gmail credentials.

**Key Design**:
- RLS policies use SECURITY DEFINER functions to avoid cross-table recursion while enabling complex access patterns
- Team members can't see Gmail OAuth tokens (`refresh_token`) even though they can use the owner's Gmail to send — credential isolation is preserved
- The `can_access_campaign()` function is the central authorization gate for all campaign child tables

---

## Journey 12: Campaign Analytics and Reporting

**Persona**: Brand Manager
**Goal**: Understand campaign performance and present results to stakeholders
**Trigger**: Weekly or end-of-campaign review

### Step-by-Step Flow

```
DASHBOARD VIEW:
  USER: Navigate to /dashboard
  API: GET /v1/analytics/dashboard
  BACKEND (DashboardRoute):
  - campaign_counts: total, seeding, paid, active, paused
  - email_stats: total sent, open rate (estimated), response rate
  - opt_in_stats: total opt-ins, opt-in rate per campaign
  - follow_up_stats: follow-ups sent, impact on response rate
  - pipeline_stats (gifting): CONTACTED → SHIPPED → DECLINED counts
  - pipeline_stats (paid): NEW → PAID → DECLINED counts
  - recent_optins (last 30 days, configurable)
  UI: 4 metric cards + active campaigns table + pipeline funnel chart

PER-CAMPAIGN VIEW:
  USER: Clicks campaign in dashboard or navigates to /campaigns/{id}
  API: GET /v1/campaigns/{id}/summary
  BACKEND: Generates prose summary via Claude Haiku
  UI: Client Summary section shows categorized markdown:
    "🎬 Videos needing review: 3 creators"
    "📦 Products shipped: 12 creators"
    "⏳ Awaiting contract: 5 creators"

  USER: Clicks to "Creators" tab
  UI: Table of all campaign_creator rows with columns:
    - Creator name + platform handle
    - Gifting status (CONTACTED/SHIPPED/DECLINED)
    - Paid status (if paid campaign)
    - Post tracking dates
    - Notes preview

  USER: Clicks creator row → expands thread link
  UI: Link to relevant mail thread

GOOGLE SHEETS EXPORT (automated):
  TEMPORAL: extract_metrics_from_thread_using_llm_activity
  - Runs on each thread processing
  - Extracts configured metrics (follower count, engagement rate, etc.)
  - Google Sheets API: writes to campaign's tracking sheet
  Result: sheet always has up-to-date creator data; no manual export needed

MANUAL EXPORT:
  (No CSV export feature currently observed in analysis)
  Google Sheets integration is the primary export mechanism
```

**Success Criteria**: Brand manager can answer "how many creators opted in this week?" and "what's our response rate?" without contacting the operations team.

---

## Journey 13: Creator Managing Brand Deals (Reversed Flow)

**Persona**: Creator
**Goal**: Manage incoming brand partnership inquiries efficiently
**Trigger**: Creator sets up their own Cheerful account using the "Creator" campaign type

### Step-by-Step Flow

```
SETUP (Campaign Wizard, creator type):
  USER TYPE: "Creator" selected in wizard step 0

  STEP 1: Campaign type → auto-set to 'creator' (no selection needed)
  Step 0 + 1 merge: creator/salesperson skip campaign type selection

  STEP 2: Creator Info (different from advertiser flow)
  Fields:
  - Media Kit Link (URL to their public rate card)
  - Audience Demographics (freeform: "80% female, 25-34, US")
  - Rate Information (freeform: "IG post: $500, Story: $200")

  STEP 3: Email accounts (connect Gmail that receives brand inquiries)

  STEP 7: Review & Launch
  is_external: true (brand emails arrive externally; Cheerful handles replies only)

  API: POST /v1/campaigns/launch
  DB: Campaign created with type='creator', is_external=true

INCOMING BRAND INQUIRY:
  Brand sends inquiry to creator's Gmail
  AllPollHistoryWorkflow detects inbound email
  ThreadProcessingCoordinatorWorkflow:
  - Classifies thread as relevant to 'creator' campaign
  - AI prompt: "You are managing deal inquiries for this creator"
  - Generates draft reply using creator's:
    - Media kit link
    - Rate information
    - Audience demographics
  - Draft: professionally declines brands below rate threshold
  - Draft: confirms interest for brands above threshold + shares media kit

  DB: gmail_thread_state → WAITING_FOR_DRAFT_REVIEW
  CREATOR SEES: Inbox with AI-drafted response

CREATOR REVIEWS:
  USER: Opens /mail → sees AI draft
  USER: Reviews draft → edits if needed → sends
  (Same as Campaign Operator in Journey 3, but they're the creator themselves)

RESULT:
  Creator spends minutes per week on brand deal management instead of hours
  AI handles initial screening and response drafting using creator's own rate/info
```

---

## Journey 14: Context Engine — Slack-Based Status Queries

**Persona**: Brand Manager
**Goal**: Get campaign status without opening the web app
**Trigger**: Brand manager receives a question on Slack about campaign performance

### Step-by-Step Flow

```
SETUP: Context engine Slack bot connected to company Slack workspace
       Campaign context available via context engine's Cheerful MCP tools

USER: @cheerful-bot "How many creators have opted in to the Summer campaign?"
  Slack: Message event → context-engine Slack bot

CONTEXT ENGINE ROUTING (src_v2/core/router.py):
  Analyzes message: intent = 'campaign_status_query'
  Routes to: claude-agent execution with Cheerful MCP tools

CLAUDE AGENT (claude-opus-4.6):
  Tools available: mcp__cheerful__* (7 tools)

  STEP 1: get_campaigns → lists available campaigns
  STEP 2: search_threads {campaign_id: "summer", query: "opt in"}
    MCP Tool → API: POST /service/threads/search {query, campaign_id}
    BACKEND: pgvector semantic search on thread content
    Returns: threads where creators opted in

  STEP 3: get_creator_list {campaign_id}
    MCP Tool → API: GET /service/creators?campaign_id=summer
    Returns: campaign_creator rows with gifting_status

  AI: Synthesizes: "47 creators have opted in, 12 are SHIPPED, 3 DECLINED"

  RESPONSE: Slack reply with summary + breakdown

ALTERNATIVELY — Post Tracking Query:
  USER: "@cheerful-bot show me Sarah's posts from last week"
  Context engine routes to creator post lookup
  MCP tools: search by creator name → get posts
  Returns: post thumbnails + engagement data (if available)

RESULT:
  Brand manager answers stakeholder questions without opening browser
  Context engine maintains conversation history for follow-up questions
```

---

## Cross-Journey Patterns

### Pattern 1: AI-Assisted, Human-Confirmed

Every AI-generated output (drafts, rules, orders) goes through human confirmation before irreversible actions:
- Draft emails require explicit "Send" click (or auto-send if `should_auto_send=True` AND no questions asked)
- Shopify orders require Slack button click
- Bulk edits offer opt-in action bar rather than auto-applying

### Pattern 2: Asynchronous Enrichment

Creators without email addresses are never a blocking condition. The system:
1. Accepts the creator immediately
2. Enriches asynchronously via Temporal
3. Automatically joins them to outreach when email is found
4. Clearly surfaces failures for manual resolution

### Pattern 3: Event Sourcing for Thread State

Thread state changes are append-only rows in `gmail_thread_state`. This enables:
- Full audit trail of every state transition
- Race condition handling (check if latest before processing)
- Replay capability for debugging
- Cross-workflow idempotency (insert is no-op if state already at target)

### Pattern 4: Personalization at Queue Time

Email templates with `{{merge_tags}}` are resolved when the outbox entry is created (during campaign launch), not when the email is sent. This means:
- Sending is fast (no per-email template rendering at send time)
- Merge tag failures are caught early
- The exact email to be sent is inspectable before sending

### Pattern 5: Multi-Model Strategy

No single AI model handles all tasks. The system selects models by cost/quality tradeoff:
- High-volume classification (every thread): `gpt-4.1-nano` (cheapest)
- Binary decisions: `gpt-4.1-mini`
- Draft generation: `claude-opus-4.5` (highest quality)
- Final quality revision: `o3` (maximum reasoning)

This keeps per-campaign AI costs manageable while maintaining quality on the most user-visible outputs.

---

## Journey Dependency Map

```
Journey 1 (Onboarding)
  └── enables Journey 2 (Campaign Creation)
        └── enables Journey 3 (Daily Inbox)
              ├── feeds Journey 4 (Response Pipeline — automated backend)
              ├── enables Journey 9 (Bulk Edit)
              └── enables Journey 10 (Rule Generation)
Journey 2 (Campaign Creation)
  ├── enables Journey 5 (Enrichment) — for creators without emails
  ├── enables Journey 6 (Discovery) — for ongoing expansion
  ├── enables Journey 7 (Post Tracking) — after creator opts in
  └── enables Journey 8 (Shopify Orders) — for gifting campaigns
Journey 11 (Team Setup)
  └── enables multiple operators to run Journey 3 in parallel
Journey 12 (Analytics)
  └── depends on Journey 3 + 4 generating creator data
Journey 14 (Context Engine)
  └── reads data produced by Journeys 2-8
```
