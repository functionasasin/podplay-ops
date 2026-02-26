# Campaign Lifecycle — Analysis

**Aspect:** `campaign-lifecycle`
**Sources:** Wave 1 analyses + `apps/backend/src/api/route/campaign_launch.py`, `apps/backend/src/models/database/campaign.py`, `apps/backend/src/models/database/campaign_creator.py`, `apps/backend/src/models/api/campaign_launch.py`

---

## Overview

A campaign in Cheerful is the top-level organizing unit for an influencer outreach effort. Its lifecycle spans 8 distinct phases, from initial configuration through post-campaign content verification. Each phase is clearly delineated by state changes in the database, orchestrated by Temporal workflows, and surfaced through the web application UI.

This document traces the complete lifecycle of a **gifting/seeding campaign** (the primary use case) and notes how **paid**, **sales**, and **creator** campaigns diverge at each phase.

---

## Campaign Status State Machine

The `campaign.status` column tracks the high-level lifecycle status:

```
DRAFT ──────────────────► ACTIVE ──► PAUSED ──► ACTIVE
                              │
                              ▼
                          COMPLETED
```

| Status | Meaning | Transitions |
|--------|---------|-------------|
| `DRAFT` | Wizard in progress; no senders/recipients created yet | → `ACTIVE` on launch |
| `ACTIVE` | Running; outbox being sent, replies processed | → `PAUSED` (manual), → `COMPLETED` (manual or future automation) |
| `PAUSED` | Outbox paused; existing threads continue processing | → `ACTIVE` (resume) |
| `COMPLETED` | Campaign finished; `completed_at` timestamp set | Terminal |

Source: `campaign.py:30-34`

**CampaignType** values (backend):

| Backend Type | Frontend Label | Use Case |
|-------------|----------------|---------|
| `gifting` | Seeding/Gifting | Free products for organic content |
| `paid_promotion` | Paid Promotion | Paid deliverables |
| `sales` | Salesperson | B2B outreach / sales calls |
| `creator` | Creator | Reverse — creator manages brand deals |

Source: `campaign.py:22-27`, `campaign_launch.py:55-61`

---

## Phase 1: Configuration (Campaign Wizard)

**What happens:** User configures the campaign through a 7-step wizard in the webapp.

**Components:** `apps/webapp/app/(mail)/campaigns/new/`, `apps/webapp/stores/campaign-wizard-store.ts`

### Draft Saving

At any wizard step transition, the frontend auto-saves wizard state via:

```
POST /campaigns/draft
Body: CampaignDraftSaveRequest (all optional fields)
```

This creates a `Campaign` record with `status=DRAFT`. Critical: no `CampaignRecipient`, `CampaignSender`, or `CampaignOutboxQueue` entries are created yet. All in-progress form data serializes into `campaign.draft_metadata` (JSONB).

**Draft metadata** stores everything that doesn't have a dedicated column:
- `creators_csv_data`: parsed CSV rows
- `search_creators`: search-added creators
- `selected_accounts`: sender emails
- `tracking_rules`: Google Sheets config
- `additional_products`: multi-product cards for new products

Source: `campaign_launch.py:847-874`

### AI Assistance During Wizard

Multiple AI calls enrich the wizard experience before launch:

| Step | AI Feature | Trigger | Purpose |
|------|-----------|---------|---------|
| Step 1 | Email account suggestion | Campaign name change | Suggest matching Gmail accounts |
| Step 2 | Product scraping | URL blur | Fill name/description from website |
| Step 4 | Initial email generation | Step navigation | Generate personalized outreach email |
| Step 4 | Opt-in/opt-out generation | Tab selection | Generate acceptance/decline templates |
| Step 5 | Goal + FAQ generation | Step navigation | Generate campaign objectives and FAQs |
| Step 6 | Tracking rules generation | Google Sheets URL verified | Generate natural-language data capture rules |

Source: `webapp-campaign-wizard.md` → AI-Assisted Features table

---

## Phase 2: Launch

**What happens:** User clicks "Launch" after completing the wizard. A single transactional request creates all campaign infrastructure.

**API:** `POST /campaigns/launch` (multipart form; `campaign_data` JSON + optional `csv_file` + optional `image_file`)

**Source:** `campaign_launch.py:410-793`

### Launch Orchestration (13 Steps, All in One DB Transaction)

```
Step 0: Draft access check (if launching from draft_campaign_id)
         └─ Verify DRAFT status, check team assignment permissions
         └─ resource_owner_id = draft owner (not necessarily the launcher)

Step 1: Product resolution
         └─ existing_product_id → lookup existing Product
         └─ product_name → name-based lookup or CREATE new Product
         └─ additional_product_ids → validate & collect

Step 2: Sender account validation
         └─ For each selected_accounts email:
            - Check UserGmailAccount.is_active → (account_id, "gmail")
            - Check UserSmtpAccount.is_active → (account_id, "smtp")
            - 403 if account belongs to different user
            - 404 if not found

Step 3: CSV parsing (if csv_file provided)
         └─ parse_csv_file_with_cleaning() → (headers, valid_rows, skipped_rows)
         └─ Validate 'email' column present
         └─ Deduplicate by email (case-insensitive)

Step 4: Recipient combination
         └─ JSON recipients[] + CSV rows → all_recipients[]
         └─ RecipientData: {email, name, custom_fields{}}

Step 5: Recipient validation
         └─ SKIP if: is_external | campaign_type='creator' | has_creators_pending_enrichment
         └─ FAIL (400) if: 0 recipients and none of the above

Step 6: Campaign type mapping
         └─ 'seeding' → CampaignType.GIFTING
         └─ 'paid' → CampaignType.PAID_PROMOTION
         └─ 'sales' → CampaignType.SALES
         └─ 'creator' → CampaignType.CREATOR

Step 7: Follow-up templates preparation
         └─ [{index, body_template, hours_since_last_email}]
         └─ Validated sequential indices (0, 1, 2, ...)

Step 8: Google Sheet tracking rules extraction
         └─ Active rules → google_sheet_data_instructions (newline-joined text)
         └─ Ignored rules → google_sheet_columns_to_skip[]

Step 8.5: Email signature sanitization
          └─ Validate length ≤ 10,000 chars
          └─ sanitize_signature_html() → bleach + CSSSanitizer

Step 9: Campaign CREATE or draft UPDATE
         └─ If draft_campaign_id: UPDATE existing Campaign (status: DRAFT → ACTIVE)
         └─ Else: INSERT new Campaign (status: ACTIVE)
         └─ Both paths: create EmailSignature record if signature provided

Step 10: Campaign image upload (if image_file)
          └─ Validate MIME type (jpeg/png/gif/webp)
          └─ Upload to Supabase Storage: campaign-image/{user_id}/{ts}-{filename}
          └─ Store public_url in campaign.image_url

Step 11: Recipients bulk insert
          └─ CampaignRecipient INSERT ON CONFLICT DO NOTHING per recipient
          └─ Dedup key: (campaign_id, email)
          └─ Counts: recipients_added

Step 12: Senders insert
          └─ CampaignSender INSERT ON CONFLICT DO NOTHING per account
          └─ Gmail: gmail_account_id set; SMTP: smtp_account_id set
          └─ Counts: senders_added

Step 12: GoAffPro workflow creation (if integrations.goaffpro_token)
          └─ discount_enabled → CampaignWorkflow("GoAffPro Discount Code Creation")
             tool_slugs: [goaffpro_search_affiliate, goaffpro_create_affiliate, goaffpro_create_discount]
          └─ orders_enabled → CampaignWorkflow("Shopify Order Drafting")
             tool_slugs: [goaffpro_search_affiliate, goaffpro_create_affiliate]

Step 13: Outbox queue population (if recipients_added > 0 AND senders_added > 0)
          └─ populate_queue_for_campaign(db, campaign.id, cc_emails)
          └─ Round-robin sender assignment
          └─ Template personalization with recipient custom_fields
          └─ INSERT INTO campaign_outbox_queue ON CONFLICT DO NOTHING
          └─ INSERT INTO campaign_follow_up_outbox_queue (if follow_up_templates)

db.commit() ── everything is atomic
```

**Response:** `CampaignLaunchResponse`
```json
{
  "campaign_id": "uuid",
  "campaign_name": "Summer Gifting 2025",
  "recipients_added": 250,
  "senders_added": 3,
  "queue_entries_created": 250,
  "workflow_created": true,
  "image_uploaded": false
}
```

### Key Launch Business Rules

1. **Creator campaigns** don't require product, email_draft, or recipients — they're inbound-only.
2. **External campaigns** (using Instantly/Mixmax) don't require email_draft or recipients.
3. **has_creators_pending_enrichment** bypasses the recipient count check — creators without emails will be enriched post-launch and queued via `queue_enriched_creator()`.
4. **Template validation**: `{placeholder}` tags in email body must have matching recipient fields, or launch fails with a 400.
5. **Draft promotion**: Launching from a draft clears `campaign.draft_metadata` (set to None).

Source: `campaign_launch.py:487-793`, `models/api/campaign_launch.py:200-266`

---

## Phase 3: Initial Outreach Sending

**What happens:** The outbox queue is drained — emails are sent to recipients.

**Workflow:** `SendCampaignOutboxWorkflow`
**Activity:** `send_campaign_outbox`
**Trigger:** Periodic Temporal scheduler (not on-demand)

### Outbox Queue Structure

`campaign_outbox_queue` contains one pre-personalized entry per (sender, recipient) pair:
- `subject` — personalized subject (merge tags already replaced)
- `body` — personalized HTML body
- `cc_emails` — copied at populate time
- `status` — `pending` → `sent` | `failed` | `skipped`
- `outbox_type` — `initial` (for initial outbound)

**Send Rate Limiting:** One email per Gmail account per workflow execution. This prevents hitting Gmail's sending limits.

### After Send (Gmail Path)

When the outbound email sends:
1. Gmail message is ingested via `AllPollHistoryWorkflow` → `ProcessAccountMessagesWorkflow`
2. `ingest_single_message_activity` processes the message
3. `execute_campaign_workflows_activity` triggers `ThreadSyncWorkflow`
4. `ThreadSyncWorkflow` creates `GmailThreadState` and spawns `ThreadProcessingCoordinatorWorkflow`

The OUTBOUND thread is now tracked in the system — the campaign is monitoring for a reply.

### Creator Enrichment (Post-Launch, Parallel)

For creators added via search or list import without confirmed emails:
- `EnrichForCampaignWorkflow` runs when creators are added to campaign
- `enrich_creator_for_campaign` activity per creator (parallel, no retry)
- 4-step waterfall: cache → Apify scrape → bio link crawl → Influencer Club API
- On success: `queue_enriched_creator()` adds the creator to `campaign_outbox_queue`
- Manual override available via `POST /v1/campaigns/{id}/creators/{creator_id}/override-email`

Source: `temporal-workflows.md`, `backend-services.md` enrichment section

---

## Phase 4: Reply Ingestion & Thread Processing

**What happens:** Creator responds. The system ingests the reply and triggers the full processing pipeline.

**Workflows:** `AllPollHistoryWorkflow` → `ProcessAccountMessagesWorkflow` → `ThreadSyncWorkflow` → `ThreadProcessingCoordinatorWorkflow`

### Thread Processing Decision Tree

The `ThreadProcessingCoordinatorWorkflow` (20+ steps) handles every reply:

```
INBOUND email received?
│
├── Attachment extraction (Gmail only, async child)
│
├── Campaign association
│   ├── force_campaign_id set? → direct write
│   ├── Existing association in DB? → reuse
│   └── LLM matching → associate or orphan
│
├── HAS campaign association?
│   │
│   ├── Extract thread flags (LLM)
│   │   └─ opt_in, opt_out, has_question, is_auto_reply, etc.
│   │
│   ├── Extract creator info (LLM)
│   │   └─ social handles, role (creator/talent_manager/agency), confidence score
│   │
│   ├── Generate lookalikes (if opt-in + creators found)
│   │   └─ CampaignLookalikesSuggestion records
│   │
│   ├── Cancel scheduled follow-ups (INBOUND only)
│   │
│   ├── Check if metrics extraction needed
│   │   └─ ThreadExtractMetricsWorkflow (async child)
│   │
│   ├── Check domain + classify
│   │   ├── is opt_out? → auto-send opt_out response (if FULL_AUTOMATION)
│   │   ├── is opt_in? → execute campaign workflows (GoAffPro, etc.)
│   │   └─ otherwise → standard draft generation path
│   │
│   └── Generate response draft (ThreadResponseDraftWorkflow)
│       ├── Check staleness (is this still the latest state?)
│       ├── Check for existing draft
│       ├── Generate via RAG (Gmail) or plain LLM (SMTP)
│       ├── Upload to Gmail as draft
│       └── Write draft to DB
│
└── NO campaign association?
    └── Orphaned thread — available in "Uncategorized" inbox view
```

**OUTBOUND email (sent reply):**
```
OUTBOUND sent?
│
├── Learn from sent reply (ingest as RAG example)
├── Check if thread is done (did creator send final confirmation?)
├── Schedule follow-up (if thread is WAITING_FOR_INBOUND)
└── Update status → DONE | WAITING_FOR_INBOUND
```

Source: `temporal-workflows.md:99-142`

### Thread Status State Machine

The `gmail_thread_state.status` tracks where each thread is in processing:

```
NEW → READY_FOR_CAMPAIGN_ASSOCIATION → READY_FOR_RESPONSE_DRAFT
    → WAITING_FOR_DRAFT_REVIEW
    → DONE
    → IGNORE
    → NOT_LATEST
```

| Status | Meaning |
|--------|---------|
| `NEW` | Just ingested, not yet processed |
| `READY_FOR_CAMPAIGN_ASSOCIATION` | Attachment extraction complete |
| `READY_FOR_RESPONSE_DRAFT` | Campaign associated, ready for draft |
| `WAITING_FOR_DRAFT_REVIEW` | Draft generated, awaiting operator review/send |
| `DONE` | Thread fully processed |
| `IGNORE` | Not relevant (test email, spam, etc.) |
| `NOT_LATEST` | Superseded by newer thread state |

Source: `temporal-workflows.md:109-133`

---

## Phase 5: Automation & Draft Review

**What happens:** Operator reviews AI-generated drafts and sends replies, OR automation sends them automatically.

### Automation Levels

| Level | Behavior | Config |
|-------|---------|--------|
| `manual` | All drafts require operator approval before sending | Default |
| `semi-automated` | Simple opt-in replies auto-sent; replies with questions drafted for review | Campaign setting |
| `full_automation` (implicit) | All replies auto-sent without review | Via domain behavior config |

Source: `temporal-workflows.md:138-140`, `webapp-campaign-wizard.md:401-404`

### Operator Draft Workflow (Manual Level)

1. Operator opens inbox → thread appears with `WAITING_FOR_DRAFT_REVIEW` status
2. `GET /threads/{gmail_thread_id}/draft` → returns AI draft content + source ("llm")
3. Operator edits draft (`PUT /threads/{gmail_thread_id}/draft`)
   - 409 on version mismatch (LLM may be regenerating concurrently)
4. Operator clicks Send → `POST /emails/send`
5. Thread state advances to `DONE` or `WAITING_FOR_INBOUND`

### Bulk Draft Editing

When brand messaging needs global updates:
```
POST /bulk-draft-edit
{
  campaign_id, edit_instruction, exclude_thread_ids[], save_as_rule, rule_text
}
```

`BulkDraftEditWorkflow`:
1. `get_pending_drafts_for_campaign` → all `WAITING_FOR_DRAFT_REVIEW` drafts
2. (Optional) `save_rule_to_campaign` → persist rule for future drafts
3. `apply_edit_to_draft` × N (parallel, return_exceptions=True)

Source: `temporal-workflows.md:258-274`

---

## Phase 6: Follow-Up Scheduling

**What happens:** Creators who don't respond receive automated follow-up emails.

### Follow-Up Architecture

Two parallel follow-up mechanisms:

**Campaign-level follow-ups** (`campaign_follow_up_outbox_queue`):
- Created at queue population time (parallel to initial outbox entries)
- Scheduled via `hours_since_last_email` per template index
- Sent by `SendCampaignFollowUpsWorkflow` (periodic)
- Activity: `send_campaign_follow_ups`

**Thread-level follow-ups** (`gmail_thread_state_follow_up_schedule`):
- Scheduled by `schedule_follow_up` activity after OUTBOUND email sent
- `ThreadProcessingCoordinatorWorkflow` step 20: checks `WAITING_FOR_INBOUND` status → schedules
- Canceled by `cancel_follow_ups_on_reply` when INBOUND arrives
- Draft generated by `ThreadFollowUpDraftWorkflow` (AI-generated, same pipeline as initial)

**Follow-up draft lifecycle:**
```
schedule_follow_up (write to gmail_thread_state_follow_up_schedule)
  ↓ (time passes, no reply received)
TriggerThreadFollowUpDraftWorkflow (batch: finds overdue schedules)
  └─ ThreadFollowUpDraftWorkflow per thread
      ├─ check_is_latest_for_thread_state
      ├─ maybe_get_draft_by_thread_id (skip if already drafted)
      ├─ generate_follow_up_draft_using_llm
      ├─ upload_llm_draft_to_gmail
      ├─ write_llm_draft_to_db
      ├─ mark_schedule_as_drafted
      └─ update_state_status → WAITING_FOR_DRAFT_REVIEW
```

Source: `temporal-workflows.md:204-226`

### Post-Opt-In Follow-Ups (Gifting Campaigns)

After a creator opts in:
1. `SendPostOptInFollowUpsWorkflow` (periodic, ~4h) checks for pending opt-in follow-ups
2. Activity: `send_post_opt_in_follow_ups`
3. Uses `campaign.post_opt_in_follow_up_body_template` (campaign-level setting)
4. Tracked in `campaign_creator.post_opt_in_follow_up_status` (PENDING → SENT | FAILED)

This is the "shipping confirmation" or "next steps" email after creator acceptance.

Source: `temporal-workflows.md:437-448`, `campaign_creator.py:152-160`

---

## Phase 7: Post Opt-In Processing (Gifting Pipeline)

**What happens:** After a creator accepts, the gifting workflow executes: discount code creation, order placement, Slack approval, post tracking initiation.

### Creator Gifting Status

`campaign_creator.gifting_status` tracks the creator through fulfillment:

```
null (initial) → opted_in → processing → fulfilled → posted
             └→ opted_out
             └→ skipped
```

Source: `campaign_creator.py:73`

### GoAffPro Discount Code Creation

When campaign has GoAffPro integration and creator opts in:
1. `ThreadProcessingCoordinatorWorkflow` detects opt-in
2. `execute_campaign_workflows` activity runs campaign's AI workflows
3. `CampaignWorkflow` ("GoAffPro Discount Code Creation") executes:
   - `goaffpro_search_affiliate` — check if creator already affiliate
   - `goaffpro_create_affiliate` — create affiliate record
   - `goaffpro_create_discount` — create personalized discount code
4. `campaign_creator.gifting_discount_code` updated with generated code

Source: `campaign_launch.py:259-289`, `backend-services.md` tools section

### Shopify Order Drafting (Slack Approval)

When campaign has Shopify integration:
1. "Shopify Order Drafting" workflow executes on opt-in
2. Collects shipping address from email thread
3. `SlackOrderDigestWorkflow` posts digest to configured Slack channel:
   - Creator name, handle, email
   - Proposed order (product, variant, address)
   - Buttons: **Approve** | **Edit** | **Skip**
4. Operator clicks Approve → `POST /slack/interactions` webhook fires
5. `approve_order_*` action → `POST /v1/shopify/workflow-executions/{id}/orders`
6. Shopify order created via GoAffPro API
7. `campaign_creator.shopify_order_id` updated

**Edit modal flow:** "Edit" button opens Slack modal for address/item corrections → `view_submission` webhook updates `execution.output_data` → re-approves.

Source: `backend-api-surface.md:430-443`

### Post Tracking Initiation

For gifting campaigns with `post_tracking_enabled`:
1. When creator opts in (or is manually marked), `post_tracking_started_at` = now
2. `post_tracking_ends_at` = `post_tracking_started_at + tracking_window_days`
3. `PostTrackingSchedulerWorkflow` (48h loop) spawns `PostTrackingWorkflow`
4. Per creator: `process_creator_posts` activity
   - Fetch Instagram posts via Apify for handle within date window
   - For each post: two-phase analysis
     - Phase 1: `product_name in caption` (fast, free)
     - Phase 2: Claude vision API (fallback, expensive)
   - Create `CreatorPost` records for matched posts

Source: `temporal-workflows.md:400-414`, `backend-services.md:253-290`

---

## Phase 8: Reporting & Metrics

**What happens:** Campaign performance data is captured and surfaced in dashboards and Google Sheets.

### Google Sheets Reporting (`ThreadExtractMetricsWorkflow`)

For INBOUND threads where campaign has Google Sheets configured:
1. `check_if_campaign_should_extract_metrics` → true if `google_sheet_url` set
2. `ThreadExtractMetricsWorkflow` spawned (async child):
   - `extract_metrics_from_thread_using_llm` — extracts structured metrics from email content (follower count, engagement rate, niche, etc.)
   - `update_sheet_with_metrics` — writes row to Google Sheet (dedicated queue, max 1 concurrent)
3. If Google Sheets write fails after 5 retries: `campaign.google_sheet_error` updated

Source: `temporal-workflows.md:243-254`

### Dashboard Analytics

`GET /dashboard/analytics` returns comprehensive real-time metrics:
- **Campaign counts**: active, paused, draft, completed
- **Opt-in funnel**: total contacts → replied → opted in → opted out (rates %)
- **Email stats**: sent, opened, replied
- **Follow-up stats**: sent, pending
- **Per-campaign breakdown**: opt-in rate, status distribution
- **Pipeline**: gifting fulfilled count, paid promotion contracted count

Source: `backend-api-surface.md:499-517`

### Client Summary Generation

`POST /campaigns/{id}/client-summary`:
- Generates an AI-formatted summary of campaign performance
- `selected_fields[]` controls which metrics are included
- Output formatted for sharing with brand clients (not raw data)

Source: `backend-api-surface.md:54`

---

## Campaign Lifecycle State Diagram (Complete)

```
[User: Opens Campaign Wizard]
         │
         ▼
DRAFT ◄── auto-save at each step ──► [Wizard: Steps 0-7]
         │                                    │
         │ POST /campaigns/launch             │ AI assistance
         ▼                                    │ (email gen, FAQ gen,
ACTIVE ──────────────────────────────────────┘  tracking rules, etc.)
         │
         │ Outbox queue populated
         ▼
[SendCampaignOutboxWorkflow: sends initial emails]
         │
         │ Gmail/SMTP ingests sent email
         ▼
OUTBOUND THREAD TRACKING
         │
         │ Creator replies (Gmail poll or SMTP sync)
         ▼
[ThreadProcessingCoordinatorWorkflow]
         │
         ├─► Campaign Association
         │       ├─ LLM match → associated
         │       └─ No match → uncategorized
         │
         ├─► Flag Extraction (opt_in / opt_out / question)
         │
         ├─► [opt_out] Auto-send opt-out response (if automated)
         │
         ├─► [opt_in] Execute campaign workflows
         │       ├─ GoAffPro discount creation
         │       └─ Shopify order drafting → Slack approval
         │
         ├─► Draft Generation (RAG-based)
         │       └─ WAITING_FOR_DRAFT_REVIEW
         │
         │   [Manual level]
         │   Operator reviews → edits → sends
         │
         ├─► Post Opt-In Follow-Up (gifting)
         │       └─ Shipping/next-steps email sent
         │
         ├─► Thread Follow-Up Scheduling
         │       └─ (if no reply after N days)
         │           → ThreadFollowUpDraftWorkflow
         │           → Operator reviews → sends
         │
         ├─► Post Tracking (gifting, opt-in creators)
         │       └─ PostTrackingWorkflow (48h loop)
         │           → detect Instagram posts
         │           → caption match or LLM vision
         │           → CreatorPost records
         │
         └─► Metrics Extraction → Google Sheets
                 → ThreadExtractMetricsWorkflow
                 → LLM extracts follower count, engagement rate, etc.
                 → Writes row to Google Sheet

[Campaign Status: ACTIVE → PAUSED → ACTIVE → COMPLETED]
```

---

## Campaign Type Divergences

| Feature | Gifting | Paid Promotion | Sales | Creator |
|---------|---------|----------------|-------|---------|
| Product required | Yes | Yes | Yes | No |
| Email draft required | Yes | Yes | Yes | No (inbound only) |
| Recipients required | Yes | Yes | Yes | No |
| Follow-up templates | Yes | Yes | Yes | No |
| Opt-in/opt-out | Yes | Yes | No | No |
| GoAffPro integration | Yes (discount) | Possible | No | No |
| Shopify order drafting | Yes | No | No | No |
| Post tracking | Yes | Yes | No | No |
| Metrics extraction | Yes | Yes | No | No |
| Google Sheets | Yes | Yes | Yes | No |
| Slack channel | Yes | No | No | No |
| Step '3b' in wizard | No | Yes | No | No |
| Deliverables field | No | Yes | No | No |

Source: `webapp-campaign-wizard.md:559-570`, campaign type handling throughout

---

## Critical Business Rules

1. **Idempotency everywhere**: Queue population, message ingestion, and recipient upserts all use `INSERT ON CONFLICT DO NOTHING`. Re-running any workflow step is safe.

2. **Thread history checkpoint**: Gmail history ID only advances after ALL messages in a batch are processed successfully. Any failure causes re-processing of the entire batch on next poll.

3. **Draft staleness check**: Before generating a draft, `check_is_latest_for_thread_state` verifies the current `gmail_thread_state` ID matches. If not (new message arrived), draft generation aborts — prevents drafting stale context.

4. **Follow-up cancellation**: `cancel_follow_ups_on_reply` is called immediately when any INBOUND message arrives, preventing a follow-up from sending after the creator has already replied.

5. **Resource ownership**: At launch time, `resource_owner_id` may differ from the launching `user_id` (team member launching on behalf of campaign owner). Products and senders are validated against the owner's account.

6. **External campaigns**: When `is_external=True`, Cheerful only handles replies; the initial outreach is done via Instantly/Mixmax/other. No email draft or recipients are required.

7. **Creator without email sentinel**: CSV creators without `@` in email use `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel; filtered from actual `recipients[]` at launch but tracked in `campaign_creator` for enrichment.

---

## Data Created Per Campaign (Full Lifecycle)

| Table | When Created | Purpose |
|-------|-------------|---------|
| `campaign` | Launch | Campaign definition and config |
| `product` | Launch | Product being promoted |
| `campaign_product` | Launch | Campaign↔Product junction |
| `campaign_recipient` | Launch | Initial outreach target list |
| `campaign_sender` | Launch | Sending accounts |
| `campaign_outbox_queue` | Launch | Pre-personalized send queue |
| `campaign_follow_up_outbox_queue` | Launch | Follow-up schedule per recipient |
| `campaign_workflow` | Launch | GoAffPro/Shopify automation rules |
| `email_signature` | Launch | HTML signature per campaign |
| `gmail_message` | On send/reply | Raw email messages |
| `gmail_thread_state` | On message | Versioned thread processing state |
| `gmail_thread_llm_draft` | On processing | AI-generated draft content |
| `gmail_thread_ui_draft` | On edit | Human-edited draft |
| `gmail_thread_state_follow_up_schedule` | On OUTBOUND | Follow-up timer |
| `campaign_thread` | On association | Campaign↔Thread link |
| `campaign_creator` | On flag extraction | Creator profile per campaign |
| `campaign_workflow_execution` | On workflow run | AI workflow result history |
| `creator_post` | On post tracking | Detected Instagram posts |
| `email_reply_example` | On sent reply | RAG training examples |
| `campaign_lookalike_suggestion` | On opt-in | Similar creator recommendations |

---

## User Problems Solved (by Lifecycle Phase)

| Phase | User Problem |
|-------|-------------|
| Wizard + Draft | "Setting up a campaign has too many options — I need to be guided step-by-step and not lose my work" |
| AI in Wizard | "Writing an outreach email and FAQs from scratch for every campaign takes too much time" |
| Launch | "I don't want to configure a campaign in 10 different places — one launch action should set everything up" |
| Creator Enrichment | "I want to add creators from Instagram even if I don't have their email yet" |
| Outbox Queue | "I need to send 500 personalized emails without the sending logic getting confused by retries" |
| Thread Processing | "I can't manually read and respond to hundreds of creator replies — AI should draft responses" |
| Draft Review | "I want to review AI drafts before they go out, but I shouldn't have to write them from scratch" |
| Bulk Draft Edit | "A brand guideline changed — I need to update all 200 pending drafts at once" |
| Follow-ups | "Creators often don't respond to first contact — I need automated follow-ups at the right intervals" |
| GoAffPro | "When a creator accepts, generating their discount code manually wastes time" |
| Slack Approval | "I want to approve Shopify gifting orders from Slack without logging into another tool" |
| Post Tracking | "I gave 100 creators free products — I need to know which ones actually posted" |
| Google Sheets | "I want a running spreadsheet of creator metrics automatically filled in as replies come in" |
| Dashboard | "I need to see the opt-in rate and pipeline status at a glance, not count through emails" |
