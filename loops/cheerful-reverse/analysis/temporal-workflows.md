# Temporal Workflows — Analysis

**Aspect:** `temporal-workflows`
**Source:** `apps/backend/src/temporal/workflow/`
**Worker registration:** `apps/backend/src/temporal/worker.py`

---

## Overview

Cheerful uses Temporal.io for durable, fault-tolerant execution of all long-running operations. The workflow layer sits between the API surface (which can trigger workflows via the Temporal client) and the activity layer (which performs actual I/O).

**Worker configuration** (`worker.py`):
- Two task queues: `"main"` (all workflows + most activities) and `"google-sheets"` (isolated for Google Sheets writes)
- Two `ThreadPoolExecutor` pools: `main_pool_workers=10` (prod) / `5` (dev), `sheets_executor=1`
- All activities are synchronous (run in thread pool, not async event loop)
- Graceful shutdown: 4m30s timeout (synced with `fly.toml kill_timeout`)
- Health check server on port 8081 (TCP, consumed by Fly.io)
- Error reporting: `RollbarInterceptor` applied to both workers

**Exports (`workflow/__init__.py`):** 24 workflow classes registered with the main worker.

---

## Workflow Catalog

### 1. `AllPollHistoryWorkflow`

**File:** `workflow/poll_history_workflow.py`
**Purpose:** Continuously polls Gmail history for all active accounts. The heartbeat of the Gmail ingestion pipeline — runs forever without an external cron schedule.

**Trigger:** Started once (via API or manual), self-perpetuates via `continue_as_new`.

**Inputs:** `AllPollHistoryParams` (fields: `max_concurrent_accounts`, `poll_interval_seconds`)
**Outputs:** `None` (loops forever)

**Activity sequence:**
1. `get_all_active_gmail_emails_activity` (timeout: 3 min, max 3 retries) → list of Gmail accounts

**Child workflows spawned:**
- `ProcessAccountMessagesWorkflow` — one per active Gmail account
- Concurrency limited to 3 via `asyncio.Semaphore(3)`
- `execution_timeout=20min`, `parent_close_policy=TERMINATE`
- All spawned concurrently via `asyncio.gather(..., return_exceptions=True)`

**Loop behavior:**
- After all accounts processed, calls `workflow.continue_as_new(params)` — resets event history to prevent unbounded growth
- Individual account failures do NOT crash the parent; results separated into success/failed lists

**Error handling:**
- `@report_workflow_errors(report_exception_to_rollbar)` decorator for Rollbar alerting
- `return_exceptions=True` in gather — account-level failures tolerated

---

### 2. `ProcessAccountMessagesWorkflow`

**File:** `workflow/process_account_messages_workflow.py`
**Purpose:** Processes all new Gmail messages for a single account. Fetches message IDs via Gmail history API, ingests each one sequentially, and advances the history ID checkpoint only on full success.

**Trigger:** Spawned by `AllPollHistoryWorkflow` (one per Gmail account per poll cycle)

**Inputs:** `ProcessAccountParams` (field: `gmail_email`)
**Outputs:** `ProcessAccountResult` (fields: `processed`, `failed`, `failed_message_ids`)

**Activity sequence:**
1. `poll_history_activity` (timeout: 5 min, max 3 retries) → list of message IDs + new history ID
2. `update_history_id_activity` (timeout: 1 min, max 3 retries) — called immediately if no messages
3. For each message: `ingest_single_message_activity` (timeout: 5 min, max 5 retries with exponential backoff)
4. `update_history_id_activity` — called ONLY if ALL messages succeeded (preserves at-least-once delivery)

**Checkpoint safety:** History ID is not advanced if any message ingestion fails. On next poll, the same messages will be re-fetched and re-ingested (idempotency required in `ingest_single_message_activity`).

---

### 3. `ThreadSyncWorkflow`

**File:** `workflow/thread_sync_workflow.py`
**Purpose:** Gmail entry point into the thread processing pipeline. Batch-inserts the latest Gmail thread states (from messages ingested in `ProcessAccountMessages`) and fans out `ThreadProcessingCoordinatorWorkflow` for each new candidate.

**Trigger:** Called after `ingest_single_message_activity` (via `execute_campaign_workflows_activity` or direct API trigger)

**Inputs:** None
**Outputs:** None

**Activity sequence:**
1. `batch_insert_latest_state_and_get_candidates_activity` (timeout: 10 min, max 3 retries) → list of `Candidate` objects

**Child workflows spawned (fire-and-forget):**
- `ThreadProcessingCoordinatorWorkflow` — one per candidate
- `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`
- `parent_close_policy=ABANDON`
- Search attributes set: `GmailThreadId`, `GmailThreadStateId`, `UserEmail`, `GoogleAccountEmail`

**Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` decorator.

---

### 4. `ThreadProcessingCoordinatorWorkflow`

**File:** `workflow/thread_processing_coordinator_workflow.py`
**Purpose:** The central orchestrator for processing a single email thread end-to-end. Handles both Gmail and SMTP sources. Routes through campaign association, flag extraction, opt-in/opt-out classification, draft generation, and follow-up scheduling. This is the most complex workflow in the system.

**Trigger:** Spawned by `ThreadSyncWorkflow` (Gmail) or `SmtpThreadSyncWorkflow` (SMTP), fire-and-forget.

**Inputs:** `Candidate` — a structured object containing thread, account, campaign, and user context
**Outputs:** None (all results written to DB)

**Activity sequence (simplified — see full detail below):**

| Step | Activity | Condition | Timeout | Retry |
|------|----------|-----------|---------|-------|
| 1 | `ensure_complete_thread_ingested` | Gmail only | 5 min | 3, exp |
| 2 | `update_state_status` → `READY_FOR_CAMPAIGN_ASSOCIATION` | always | 3 min | 3 |
| 3 | *(child)* `ThreadAttachmentExtractWorkflow` | Gmail only | — | — |
| 4 | *(child)* `ThreadAssociateToCampaignWorkflow` | always | — | — |
| 5 | `update_creator_latest_interaction` | SMTP + has campaign | 30s | 3 |
| 6 | `execute_campaign_workflows` | Gmail + has campaign | 5 min | 3, exp |
| 7 | `extract_campaign_creator` | Gmail + has campaign | 20 min | 3, exp |
| 8 | `generate_lookalikes_for_opt_in` | Gmail + has campaign + creators found | 15 min | 2, exp |
| 9 | `extract_thread_flags` | Gmail + has campaign | 5 min | 1 |
| 10 | `update_creator_latest_interaction` | Gmail + has campaign | 30s | 3 |
| 11 | `cancel_follow_ups_on_reply` | INBOUND + has campaign | 1 min | 3 |
| 12 | `check_if_campaign_should_extract_metrics` | INBOUND + has campaign | 1 min | 1 |
| 13 | *(child)* `ThreadExtractMetricsWorkflow` | metrics enabled | — | — |
| 14 | `update_state_status` → `READY_FOR_RESPONSE_DRAFT` or `IGNORE` | INBOUND | 3 min | 3 |
| 15 | `check_domain_and_classify` | INBOUND + READY | 5 min | 2 |
| 16 | Auto-send opt_out response or follow domain behavior | conditional | varies | varies |
| 17 | *(child)* `ThreadResponseDraftWorkflow` | draft needed | — | — |
| 18 | `ingest_sent_reply_as_example` | OUTBOUND + has campaign | 5 min | 2 |
| 19 | `check_if_thread_is_done` | OUTBOUND + has campaign | 10 min | 3 |
| 20 | `schedule_follow_up` | OUTBOUND + WAITING_FOR_INBOUND | 10 min | 3 |
| 21 | `update_state_status` (final) | OUTBOUND | 3 min | 1 |

**Branch logic summary:**
- **INBOUND threads**: opt-in/opt-out classification → auto-send (if domain behavior) OR standard draft generation → metrics extraction → follow-up cancellation
- **OUTBOUND threads**: learn from sent reply → check if thread is done → schedule follow-up
- **SMTP vs Gmail**: SMTP skips attachment extraction, uses plain LLM draft (not RAG), uses `auto_send_response` directly
- **Automation levels**: `FULL_AUTOMATION` → auto-send; `SEMI_AUTOMATION` → classify then maybe auto-send; `MANUAL` → always draft for review

**Error handling philosophy:** Non-critical activities (creator interaction update, campaign workflow execution, creator extraction, flag extraction, sent reply ingestion) are wrapped in `try/except` and logged as warnings — they do NOT fail the thread processing. Critical activities (campaign association, draft generation, state transitions) are allowed to propagate and retry.

---

### 5. `ThreadAssociateToCampaignWorkflow`

**File:** `workflow/thread_associate_to_campaign_workflow.py`
**Purpose:** Matches an email thread to a campaign. Three paths: forced association, existing association in DB, or LLM-based matching.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow`

**Inputs:** `Candidate`
**Outputs:** `CampaignAssociationResult` (fields: `campaign_id`, `campaign_status`)

**Activity sequence (branching):**
1. If `force_campaign_id` is set → `write_campaign_thread_to_db` → return
2. `maybe_find_campaign_by_thread_id` → if found, return existing
3. `handle_thread_no_campaign` (LLM matching) → if campaign found, `write_campaign_thread_to_db`

All activities: timeout 10 min, max 1 retry (no retry — idempotent writes).

---

### 6. `ThreadResponseDraftWorkflow`

**File:** `workflow/thread_response_draft_workflow.py`
**Purpose:** Generates an AI-drafted reply for an email thread. Staleness check prevents drafting for superseded thread states. Uses RAG-based drafting for Gmail, plain LLM for SMTP.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow`
**Deduplication:** "Should be deduplicated by gmail_thread_state.id"

**Inputs:** `Candidate`
**Outputs:** `ThreadResponseDraftResult` (fields: `status`, `gmail_draft_id`)

**Activity sequence:**
1. `check_is_latest_for_thread_state` (timeout: 10 min, max 1) → if NOT_LATEST, return early
2. `maybe_get_draft_by_thread_state_id` (timeout: 10 min, max 1) — skip if `force_reply=True`
3. If existing draft: `get_gmail_draft_id_for_state` → return with existing ID
4. Generate draft: `generate_draft_with_rag` (Gmail) OR `generate_draft_using_llm` (SMTP) (timeout: 20 min, max 1)
5. `upload_llm_draft_to_gmail` (timeout: 5 min, max 1)
6. `write_llm_draft_to_db` (timeout: 3 min, max 1)

---

### 7. `ThreadResponseDraftWithCorrectionsWorkflow`

**File:** `workflow/thread_response_draft_with_corrections_workflow.py`
**Purpose:** Alternative draft generation workflow that incorporates human correction examples from a JSONL file to improve draft quality.

**Trigger:** Manual API trigger or A/B testing path in `ThreadProcessingCoordinatorWorkflow`

**Inputs:** `Candidate`, `n_correction_examples=10`, `include_thread_context_in_examples=False`
**Outputs:** `GmailThreadStatus.NOT_LATEST` | `GmailThreadStatus.WAITING_FOR_DRAFT_REVIEW`

**Activity sequence:**
1. `check_is_latest_for_thread_state` → early return if stale
2. `maybe_get_draft_by_thread_state_id` → early return if duplicate
3. `generate_draft_with_corrections` (timeout: 20 min, max 1) — uses JSONL correction examples
4. `upload_llm_draft_to_gmail` (timeout: 5 min, max 1)
5. `write_llm_draft_to_db` (timeout: 3 min, max 1)

---

### 8. `ThreadFollowUpDraftWorkflow` / `TriggerThreadFollowUpDraftWorkflow`

**File:** `workflow/thread_follow_up_draft_workflow.py`

**`TriggerThreadFollowUpDraftWorkflow`:**
- Batch fetches follow-up candidates → spawns `ThreadFollowUpDraftWorkflow` per candidate (fire-and-forget)
- Inputs: `TriggerThreadFollowUpDraftWorkflowParams` (field: `batch_size`)

**`ThreadFollowUpDraftWorkflow`:**
- **Purpose:** Generates an AI follow-up email draft for threads that haven't received a reply after a scheduled delay.
- Inputs: `Candidate`
- Outputs: `GmailThreadStatus` enum value

**Activity sequence:**
1. `check_is_latest_for_thread_state` (timeout: 1 min, max 1) → early return if stale
2. `update_state_status` → `NOT_LATEST` if stale
3. `maybe_get_draft_by_thread_id` (timeout: 1 min, max 1) → skip if draft exists
4. `generate_follow_up_draft_using_llm` (timeout: 20 min, max 1)
5. `upload_llm_draft_to_gmail` (timeout: 5 min, max 1)
6. `write_llm_draft_to_db` (timeout: 3 min, max 1)
7. `mark_schedule_as_drafted` (timeout: 3 min, max 1)
8. `update_state_status` → `WAITING_FOR_DRAFT_REVIEW` (timeout: 3 min, max 1)

---

### 9. `ThreadAttachmentExtractWorkflow`

**File:** `workflow/thread_attachment_extract_workflow.py`
**Purpose:** Fetches and extracts content from email attachments (PDFs, images, etc.) using LLM to make attachment content available for context during draft generation.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow` (Gmail only)

**Activity sequence (per attachment):**
1. `fetch_attachments_to_extract` (timeout: 5 min, max 1)
2. For each attachment: `extract_attachment` (timeout: 15 min, max 1)
3. `maybe_write_llm_extracted_content_to_db` (timeout: 3 min, max 1)

---

### 10. `ThreadExtractMetricsWorkflow`

**File:** `workflow/thread_metrics_workflow.py`
**Purpose:** Extracts engagement metrics (follower count, engagement rate, niche category, etc.) from email thread content using LLM, then writes to a Google Sheet for reporting.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow` (INBOUND + campaign + metrics enabled)

**Activity sequence:**
1. `extract_metrics_from_thread_using_llm` (timeout: 20 min, max 5, exponential backoff 1m→5m, coef 2.0)
2. `update_sheet_with_metrics` (timeout: 10 min, max 5, exponential 5s→155s, coef 2.0) — sent to `TEMPORAL_GOOGLE_SHEETS_TASK_QUEUE`

**Notable:** Uses a dedicated task queue (`"google-sheets"`) with a single-threaded executor and `max_concurrent_activities=1` to avoid Google Sheets API rate limits.

---

### 11. `BulkDraftEditWorkflow`

**File:** `workflow/bulk_draft_edit_workflow.py`
**Purpose:** Applies a single edit instruction to all pending drafts in a campaign simultaneously. Enables brand managers to make global tweaks (tone, offer details, CTA) without re-generating all drafts from scratch.

**Trigger:** API endpoint (manual user action)

**Inputs:** `BulkDraftEditInput` (fields: `campaign_id`, `user_id`, `edit_instruction`, `exclude_thread_ids`, `save_as_rule`, `rule_text`)
**Outputs:** `BulkDraftEditResult` (fields: `total_count`, `updated_count`, `failed_count`, `errors`)

**Activity sequence:**
1. `get_pending_drafts_for_campaign` (timeout: 30s, max 2) → list of draft items
2. Optionally: `save_rule_to_campaign` (timeout: 10s, max 2) — saves edit as reusable rule
3. `apply_edit_to_draft` × N (timeout: 60s, max 2) — fanned out in parallel via `asyncio.gather(..., return_exceptions=True)`
4. Optionally: `save_rule_to_campaign` again after edits complete

**Error handling:** Individual edit failures are tallied (up to 10 errors logged) but do not fail the workflow.

---

### 12. `EnrichForCampaignWorkflow`

**File:** `workflow/enrich_for_campaign_workflow.py`
**Purpose:** Enriches creator profiles when they are added to a campaign (fetches social data, validates contact info, etc.). Fans out enrichment in parallel — one attempt per creator, no retry.

**Trigger:** API endpoint (when creators are added to campaign)

**Inputs:** `EnrichForCampaignParams` (fields: `creator_ids`, `campaign_id`)
**Outputs:** `EnrichForCampaignResult` (fields: `campaign_id`, `results`)

**Activity sequence:**
- `enrich_creator_for_campaign` × N (timeout: 5 min, max 1 — NO_RETRY), fanned out in parallel

**Error handling:** Each creator enrichment is individually awaited in a for loop. `Exception` → synthetic `FAILED` result appended; workflow continues.

---

### 13. `AllSmtpInboxSyncWorkflow` / `BatchSmtpInboxSyncWorkflow`

**File:** `workflow/smtp_inbox_sync_workflow.py`
**Purpose:** Syncs all active SMTP inboxes. Chunked into batches to limit concurrency and prevent API saturation.

**`AllSmtpInboxSyncWorkflow`:**
- Inputs: `AllSmtpInboxSyncParams` (fields: `max_concurrent_batches`, `max_batch_size`)
- Gets all active SMTP accounts → chunks into batches → spawns `BatchSmtpInboxSyncWorkflow` per batch (concurrent, `Semaphore(max_concurrent_batches)`)
- Child workflows: `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`, `execution_timeout=20min`

**`BatchSmtpInboxSyncWorkflow`:**
- Processes accounts sequentially: `smtp_inbox_sync` per account (timeout: 5 min, max 3)
- For each successful sync with new messages: spawns `SmtpThreadSyncWorkflow` (fire-and-forget, `ABANDON`)
- Failed syncs logged as warnings; processing continues

---

### 14. `SmtpThreadSyncWorkflow`

**File:** `workflow/smtp_thread_sync_workflow.py`
**Purpose:** SMTP counterpart to `ThreadSyncWorkflow`. After SMTP inbox sync, creates `SmtpThreadState` records for threads with new messages and fans out `ThreadProcessingCoordinatorWorkflow`.

**Inputs:** `SmtpThreadSyncParams` (field: `smtp_account_id: UUID`)
**Outputs:** `SmtpThreadSyncResult` (fields: `candidates_processed`, `workflows_spawned`)

**Activity sequence:**
1. `batch_insert_latest_smtp_state_and_get_candidates` (timeout: 5 min, max 3) → list of SMTP candidates

**Child workflows spawned (fire-and-forget):**
- `ThreadProcessingCoordinatorWorkflow` per candidate
- `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`, `parent_close_policy=ABANDON`
- Search attributes set on each child

---

### 15. `CampaignDiscoverySchedulerWorkflow`

**File:** `workflow/campaign_discovery_scheduler_workflow.py`
**Purpose:** Weekly scheduler that finds all campaigns with discovery enabled and triggers creator discovery for each.

**Inputs:** None
**Outputs:** `int` (total campaigns processed)

**Activity sequence:**
1. `get_campaigns_needing_discovery` (timeout: 2 min, max 3)

**Child workflows:** `CampaignDiscoveryWorkflow` — one per campaign, awaited sequentially (id: `discovery-{campaign_id}`)

---

### 16. `CampaignDiscoveryWorkflow`

**File:** `workflow/campaign_discovery_workflow.py`
**Purpose:** Discovers new creators for a single campaign (using Apify or lookalike search), adds them as recipients, and optionally seeds the outbox queue.

**Inputs:** `CampaignDiscoveryParams`
**Outputs:** `CampaignDiscoveryResult` (includes `added_count`)

**Activity sequence:**
1. `discover_creators_for_campaign` (timeout: 10 min, max 3)
2. If `added_count > 0`: `populate_outbox_for_new_recipients` (timeout: 5 min, max 3)

---

### 17. `SendCampaignOutboxWorkflow`

**File:** `workflow/campaign_outbox_workflow.py`
**Purpose:** Sends pending campaign outreach emails. Rate-limited to one per Gmail account per execution to respect sending limits.

**Inputs:** `SendCampaignOutboxParams`
**Outputs:** `SendCampaignOutboxResult`

**Activity sequence:**
1. `send_campaign_outbox` (timeout: 5 min, max 3)

**Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` decorator.

---

### 18. `SendCampaignFollowUpsWorkflow`

**File:** `workflow/campaign_follow_up_send_workflow.py`
**Purpose:** Periodic workflow that sends scheduled follow-up emails for campaigns (e.g., 3-day follow-up after no reply).

**Inputs:** None
**Outputs:** `SendCampaignFollowUpsResult`

**Activity sequence:**
1. `send_campaign_follow_ups` (timeout: 10 min, max 3)

---

### 19. `SendEmailDispatchesWorkflow`

**File:** `workflow/email_dispatch_workflow.py`
**Purpose:** Periodic workflow to send email dispatches at scheduled times. Rate-limited to one per account per execution.

**Inputs:** None
**Outputs:** `SendEmailDispatchesResult`

**Activity sequence:**
1. `send_email_dispatches` (timeout: 10 min, max 3, initial backoff 1s, max 10s)

---

### 20. `PostTrackingWorkflow` / `PostTrackingSchedulerWorkflow`

**File:** `workflow/post_tracking_workflow.py`

**`PostTrackingSchedulerWorkflow`:**
- Runs every 48 hours via `continue_as_new` (no external schedule needed)
- Spawns `PostTrackingWorkflow` with date-based ID (`post-tracking-daily-{YYYYMMDD}`)
- Then sleeps 48 hours

**`PostTrackingWorkflow`:**
- **Purpose:** Detects Instagram posts from opted-in creators within their active tracking windows. Matches posts to campaigns for ROI measurement.
- Gets trackable creators → processes each creator's posts in sequence
- `process_creator_posts` (timeout: 5 min, max 2) per creator
- Per-creator `try/except` — individual failures do not halt others
- **Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` on `PostTrackingWorkflow`

---

### 21. `SlackOrderDigestWorkflow`

**File:** `workflow/slack_order_digest_workflow.py`
**Purpose:** Posts daily order approval digest to a Slack channel. Supports two modes: single campaign (manual trigger) or all campaigns with Slack configured (scheduled).

**Inputs:** `SlackOrderDigestParams | None`
**Outputs:** `SlackOrderDigestResult` (fields: `message_ts`, `order_count`)

**Activity sequence (single-campaign mode):**
1. `post_slack_order_digest` (timeout: 2 min, max 3) with campaign params

**Activity sequence (all-campaigns mode):**
1. `get_campaigns_with_slack_channel` (timeout: 2 min, max 3) → list of campaigns
2. For each campaign: `post_slack_order_digest` (timeout: 2 min, max 3)

**Error handling:** Per-campaign `try/except` in all-campaigns mode.

---

### 22. `SendPostOptInFollowUpsWorkflow`

**File:** `workflow/post_opt_in_follow_up_send_workflow.py`
**Purpose:** Sends post-opt-in follow-up emails for gifting campaigns (e.g., after a creator agrees to participate, send shipping/next-steps details).

**Inputs:** None
**Outputs:** `SendPostOptInFollowUpsResult`

**Activity sequence:**
1. `send_post_opt_in_follow_ups` (timeout: 10 min, max 3)

---

## Workflow Dependency Graph

```
Temporal Scheduler / API Triggers
│
├── AllPollHistoryWorkflow (loop via continue_as_new)
│   └── ProcessAccountMessagesWorkflow (per Gmail account)
│       └── [ingest_single_message_activity]
│           └── → ThreadSyncWorkflow (via execute_campaign_workflows_activity)
│               └── ThreadProcessingCoordinatorWorkflow (per thread, fire-and-forget)
│                   ├── ThreadAttachmentExtractWorkflow (Gmail only)
│                   ├── ThreadAssociateToCampaignWorkflow
│                   ├── ThreadExtractMetricsWorkflow (conditional)
│                   └── ThreadResponseDraftWorkflow (conditional)
│                       (or ThreadResponseDraftWithCorrectionsWorkflow)
│
├── AllSmtpInboxSyncWorkflow
│   └── BatchSmtpInboxSyncWorkflow (per batch)
│       └── SmtpThreadSyncWorkflow (per account with new messages)
│           └── ThreadProcessingCoordinatorWorkflow (same subtree as above)
│
├── PostTrackingSchedulerWorkflow (loop via continue_as_new, 48h sleep)
│   └── PostTrackingWorkflow (daily)
│
├── CampaignDiscoverySchedulerWorkflow (weekly trigger)
│   └── CampaignDiscoveryWorkflow (per campaign)
│
├── TriggerThreadFollowUpDraftWorkflow (periodic)
│   └── ThreadFollowUpDraftWorkflow (per candidate, fire-and-forget)
│
├── BulkDraftEditWorkflow (manual API trigger)
├── EnrichForCampaignWorkflow (API trigger when creators added)
├── SendCampaignOutboxWorkflow (periodic scheduler)
├── SendCampaignFollowUpsWorkflow (periodic scheduler)
├── SendEmailDispatchesWorkflow (periodic scheduler)
├── SendPostOptInFollowUpsWorkflow (periodic scheduler ~4h)
└── SlackOrderDigestWorkflow (daily schedule or manual)
```

---

## Task Queues

| Queue Name | Workflows | Activities | Executor | Purpose |
|-----------|-----------|------------|----------|---------|
| `"main"` | All 24 workflows | All except `update_sheet_with_metrics` | ThreadPoolExecutor (10 prod / 5 dev) | Primary processing |
| `"google-sheets"` | None (workflows don't live here) | `update_sheet_with_metrics_activity` only | ThreadPoolExecutor (1) | Rate-limited Google Sheets writes |

---

## Search Attributes

Custom Temporal search attributes enable querying workflow state by business domain:

| Attribute Key | Type | Purpose |
|--------------|------|---------|
| `UserEmail` | Keyword | User who owns the thread |
| `GoogleAccountEmail` | Keyword | Gmail account processing the thread |
| `GoogleAccountEmailList` | KeywordList | Batch operations |
| `GmailThreadId` | Keyword | Gmail thread identifier |
| `GmailThreadStateId` | Keyword | State record UUID |

Source: `temporal/search_attributes.py`

---

## Cross-Cutting Patterns

### Retry Policy Conventions

| Layer | Max Attempts | Backoff | Rationale |
|-------|-------------|---------|-----------|
| Scheduler/coordinator activities | 3 | Default | Transient network errors expected |
| LLM/AI activities | 1 | None | Expensive, non-deterministic — fail fast and surface |
| Critical writes (DB, Gmail) | 1–3 | Minimal | Idempotent writes; retrying is safe |
| Google Sheets | 5 | Exponential (5s→155s) | API rate limits |
| Gmail history | 5 | Exponential | Gmail API rate limits |

### Workflow ID Reuse Policies

| Policy | Usage |
|--------|-------|
| `ALLOW_DUPLICATE_FAILED_ONLY` | Entry-point sync workflows (only re-run if previous failed) |
| `ALLOW_DUPLICATE` | Processing pipeline (safe to re-run — activities are idempotent) |
| Default | Scheduler/periodic workflows |

### Parent Close Policies

| Policy | Usage |
|--------|-------|
| `TERMINATE` | `ProcessAccountMessagesWorkflow` children — should not outlive parent |
| `ABANDON` | All processing pipeline children — fire-and-forget; continue if parent crashes |

### Infinite Loop Pattern

Two workflows loop forever without external cron:
- `AllPollHistoryWorkflow`: `workflow.continue_as_new(params)` after each poll cycle
- `PostTrackingSchedulerWorkflow`: `workflow.continue_as_new()` after `sleep(48h)`

Both use `continue_as_new` to prevent unbounded event history growth.

### Error Reporting

`@report_workflow_errors(report_exception_to_rollbar)` applied to:
- `AllPollHistoryWorkflow`
- `SendCampaignOutboxWorkflow`
- `PostTrackingWorkflow`
- `ThreadSyncWorkflow`

These are the "entry point" workflows where unhandled exceptions indicate systemic failures worth alerting on.

---

## User Problems Solved

| Workflow | User Problem |
|---------|-------------|
| `AllPollHistoryWorkflow` / `ProcessAccountMessages` | Gmail messages must be ingested in near-real-time without manual polling |
| `ThreadProcessingCoordinatorWorkflow` | Email threads must be classified, drafted, and tracked without manual intervention |
| `ThreadResponseDraftWorkflow` | Drafting personalized replies at scale is too slow to do manually |
| `BulkDraftEditWorkflow` | Making a brand-level tweak to 200 pending drafts should not require editing each one individually |
| `EnrichForCampaignWorkflow` | Adding 500 creators to a campaign should not block the UI while their profiles are enriched |
| `CampaignDiscoveryWorkflow` | Finding new relevant creators for a campaign automatically, without manual research |
| `PostTrackingWorkflow` | Knowing whether a gifted creator actually posted, without manually checking their Instagram daily |
| `SendCampaignFollowUpsWorkflow` / `SendEmailDispatchesWorkflow` | Sending follow-ups and dispatches at exactly the right scheduled time, not whenever someone checks the dashboard |
| `SlackOrderDigestWorkflow` | Getting a daily summary of orders needing approval without logging into the dashboard |
| `SmtpInboxSync` + `SmtpThreadSync` | Processing outreach replies sent to custom SMTP addresses (not Gmail) |
