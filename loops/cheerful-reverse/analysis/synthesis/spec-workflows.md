# Spec: Workflow Orchestration — Cheerful

**Synthesized from:** `temporal-workflows`, `temporal-activities`, `campaign-lifecycle`
**Sources:**
- `apps/backend/src/temporal/workflow/`
- `apps/backend/src/temporal/activity/`
- `apps/backend/src/temporal/worker.py`

---

## Overview & Philosophy

Cheerful uses **Temporal.io** as its durable execution engine for all long-running and fault-sensitive operations. Temporal provides:

- **Durable execution**: Workflow state survives worker crashes; execution resumes from the last completed activity.
- **Exactly-once semantics**: Activity IDs + idempotent DB writes ensure each operation completes exactly once even under retries.
- **Automatic retry**: Each activity declares its own retry policy; transient failures are retried without code changes.
- **Observable state**: Custom search attributes allow querying running workflows by business domain (thread ID, user email, account email).

The worker runs in a `ThreadPoolExecutor` (not async event loop) to allow SQLAlchemy synchronous ORM and blocking IMAP/SMTP calls. LLM activities run on the same pool but are never retried — failure surfaces immediately.

---

## Worker Configuration

**File:** `apps/backend/src/temporal/worker.py`

| Setting | Value |
|---------|-------|
| Task queues | `"main"` (all workflows + most activities), `"google-sheets"` (isolated) |
| Main pool size | 10 threads (prod), 5 threads (dev) |
| Google Sheets pool | 1 thread (serial, rate-limited) |
| Graceful shutdown | 4m30s (synced with Fly.io `kill_timeout`) |
| Health check | TCP server on port 8081 |
| Error reporting | `RollbarInterceptor` applied to both workers |
| Registered workflows | 24 classes |

---

## Task Queues

| Queue | Workflows | Activities | Thread Pool | Purpose |
|-------|-----------|------------|-------------|---------|
| `"main"` | All 24 workflows | All except `update_sheet_with_metrics` | 10 (prod) / 5 (dev) | Primary processing |
| `"google-sheets"` | None | `update_sheet_with_metrics_activity` only | 1 (serial) | Rate-limited Google Sheets writes; max 1 concurrent |

---

## Workflow Catalog

### Tier 1: Perpetual Loops (Always Running)

These workflows run forever without external cron — they self-perpetuate via `continue_as_new`.

---

#### `AllPollHistoryWorkflow`

**File:** `workflow/poll_history_workflow.py`
**Purpose:** Heartbeat of the Gmail ingestion pipeline. Continuously polls all active Gmail accounts for new messages.

**Trigger:** Started once (via API or manual). Self-perpetuates indefinitely.

**Inputs:**
```python
AllPollHistoryParams:
  max_concurrent_accounts: int  # default 3
  poll_interval_seconds: int
```

**Activity sequence:**
1. `get_all_active_gmail_emails_activity` — lists active Gmail accounts
   - Timeout: 3 min | Retries: max 3

**Child workflows spawned:**
- `ProcessAccountMessagesWorkflow` — one per active Gmail account
- Concurrency limited by `asyncio.Semaphore(max_concurrent_accounts)` (default 3)
- `execution_timeout=20min`, `parent_close_policy=TERMINATE`
- All spawned concurrently via `asyncio.gather(..., return_exceptions=True)`

**Loop behavior:** After all accounts are processed, calls `workflow.continue_as_new(params)` — resets event history to prevent unbounded growth.

**Error handling:**
- `@report_workflow_errors(report_exception_to_rollbar)` — Rollbar alerting on unhandled exceptions
- `return_exceptions=True` in gather — individual account failures do NOT crash the parent

---

#### `PostTrackingSchedulerWorkflow`

**File:** `workflow/post_tracking_workflow.py`
**Purpose:** Runs `PostTrackingWorkflow` every 48 hours to detect Instagram posts from opted-in creators.

**Trigger:** Started once. Self-perpetuates via `continue_as_new` after 48h sleep.

**Child workflows spawned:**
- `PostTrackingWorkflow` — date-based ID: `post-tracking-daily-{YYYYMMDD}`

**Loop behavior:** `await workflow.sleep(timedelta(hours=48))` → `workflow.continue_as_new()`

---

### Tier 2: Triggered Entry Points (API or Schedule)

---

#### `ProcessAccountMessagesWorkflow`

**File:** `workflow/process_account_messages_workflow.py`
**Purpose:** Processes all new Gmail messages for a single account. Advances the history ID checkpoint only after full success (at-least-once delivery guarantee).

**Trigger:** Spawned by `AllPollHistoryWorkflow` (one per Gmail account per poll cycle).

**Inputs:**
```python
ProcessAccountParams:
  gmail_email: str
```

**Outputs:**
```python
ProcessAccountResult:
  processed: int
  failed: int
  failed_message_ids: list[str]
```

**Activity sequence:**
1. `poll_history_activity` → list of message IDs + new history ID
   - Timeout: 5 min | Retries: max 3, exponential backoff
2. `update_history_id_activity` — called immediately if no messages
   - Timeout: 1 min | Retries: max 3
3. For each message (sequential): `ingest_single_message_activity`
   - Timeout: 5 min | Retries: max 5, exponential backoff
   - Activity ID: `"ingest-{message_id}"` for exactly-once deduplication
4. `update_history_id_activity` — called **only if ALL messages succeeded**
   - Timeout: 1 min | Retries: max 3

**Checkpoint safety:** History ID is NOT advanced if any message ingestion fails. On next poll, the same messages are re-fetched. This requires all ingestion activities to be idempotent (they are — `INSERT ON CONFLICT DO NOTHING`).

---

#### `AllSmtpInboxSyncWorkflow`

**File:** `workflow/smtp_inbox_sync_workflow.py`
**Purpose:** Syncs all active SMTP inboxes in batches to prevent API saturation.

**Inputs:**
```python
AllSmtpInboxSyncParams:
  max_concurrent_batches: int
  max_batch_size: int
```

**Behavior:**
1. Gets all active SMTP accounts
2. Chunks into batches of `max_batch_size`
3. Spawns `BatchSmtpInboxSyncWorkflow` per batch (concurrent, `Semaphore(max_concurrent_batches)`)
   - `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`, `execution_timeout=20min`

---

#### `BatchSmtpInboxSyncWorkflow`

**File:** `workflow/smtp_inbox_sync_workflow.py`
**Purpose:** Syncs a batch of SMTP accounts sequentially.

**Activity sequence:**
1. `smtp_inbox_sync_activity` per account (sequential)
   - Timeout: 5 min | Retries: max 3
2. For each successful sync with new messages: spawns `SmtpThreadSyncWorkflow` (fire-and-forget, `ABANDON`)
3. Failed syncs logged as warnings; processing continues

---

#### `CampaignDiscoverySchedulerWorkflow`

**File:** `workflow/campaign_discovery_scheduler_workflow.py`
**Purpose:** Weekly scheduler — finds campaigns with discovery enabled and triggers creator discovery for each.

**Outputs:** `int` (total campaigns processed)

**Activity sequence:**
1. `get_campaigns_needing_discovery` — Timeout: 2 min | Retries: max 3

**Child workflows:** `CampaignDiscoveryWorkflow` — one per campaign, awaited sequentially, ID: `discovery-{campaign_id}`

---

#### `TriggerThreadFollowUpDraftWorkflow`

**File:** `workflow/thread_follow_up_draft_workflow.py`
**Purpose:** Batch fetches overdue follow-up candidates and fans out `ThreadFollowUpDraftWorkflow` per candidate.

**Inputs:**
```python
TriggerThreadFollowUpDraftWorkflowParams:
  batch_size: int
```

**Behavior:** Reads `gmail_thread_state_follow_up_schedule` for overdue entries → spawns `ThreadFollowUpDraftWorkflow` per candidate (fire-and-forget).

---

#### `SendCampaignOutboxWorkflow`

**File:** `workflow/campaign_outbox_workflow.py`
**Purpose:** Drains pending campaign outreach emails (initial sends). Rate-limited: one email per Gmail account per execution.

**Inputs/Outputs:** `SendCampaignOutboxParams` / `SendCampaignOutboxResult`

**Activity sequence:**
1. `send_campaign_outbox_activity` — Timeout: 5 min | Retries: max 3

**Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` decorator.

---

#### `SendCampaignFollowUpsWorkflow`

**File:** `workflow/campaign_follow_up_send_workflow.py`
**Purpose:** Sends scheduled campaign-level follow-up emails (not thread-level follow-ups).

**Outputs:** `SendCampaignFollowUpsResult`

**Activity sequence:**
1. `send_campaign_follow_ups_activity` — Timeout: 10 min | Retries: max 3

---

#### `SendEmailDispatchesWorkflow`

**File:** `workflow/email_dispatch_workflow.py`
**Purpose:** Sends email dispatches at scheduled times. Rate-limited to one per account per execution.

**Outputs:** `SendEmailDispatchesResult`

**Activity sequence:**
1. `send_email_dispatches_activity` — Timeout: 10 min | Retries: max 3 | Backoff: initial 1s, max 10s

---

#### `SendPostOptInFollowUpsWorkflow`

**File:** `workflow/post_opt_in_follow_up_send_workflow.py`
**Purpose:** Sends post-opt-in follow-up emails for gifting campaigns (shipping confirmation, next steps). Runs approximately every 4 hours.

**Outputs:** `SendPostOptInFollowUpsResult`

**Activity sequence:**
1. `send_post_opt_in_follow_ups_activity` — Timeout: 10 min | Retries: max 3

---

#### `SlackOrderDigestWorkflow`

**File:** `workflow/slack_order_digest_workflow.py`
**Purpose:** Posts daily order approval digest to Slack channels. Supports single-campaign (manual trigger) or all-campaigns (scheduled) mode.

**Inputs:** `SlackOrderDigestParams | None`
**Outputs:**
```python
SlackOrderDigestResult:
  message_ts: str
  order_count: int
```

**Activity sequence (single-campaign mode):**
1. `post_slack_order_digest_activity` with campaign params — Timeout: 2 min | Retries: max 3

**Activity sequence (all-campaigns mode):**
1. `get_campaigns_with_slack_channel_activity` — Timeout: 2 min | Retries: max 3
2. For each campaign: `post_slack_order_digest_activity` — Timeout: 2 min | Retries: max 3
3. Per-campaign `try/except` — individual failures do not halt others

---

#### `BulkDraftEditWorkflow`

**File:** `workflow/bulk_draft_edit_workflow.py`
**Purpose:** Applies a single edit instruction to all pending drafts in a campaign simultaneously. Solves: "brand messaging changed — update 200 drafts at once."

**Trigger:** Manual API call by operator.

**Inputs:**
```python
BulkDraftEditInput:
  campaign_id: UUID
  user_id: UUID
  edit_instruction: str      # natural language edit ("make tone more casual")
  exclude_thread_ids: list[UUID]
  save_as_rule: bool
  rule_text: str | None
```

**Outputs:**
```python
BulkDraftEditResult:
  total_count: int
  updated_count: int
  failed_count: int
  errors: list[str]          # up to 10 errors logged
```

**Activity sequence:**
1. `get_pending_drafts_for_campaign_activity` — Timeout: 30s | Retries: max 2
2. (Optional) `save_rule_to_campaign_activity` — Timeout: 10s | Retries: max 2
3. `apply_edit_to_draft_activity` × N — fanned out in parallel via `asyncio.gather(..., return_exceptions=True)`
   - Timeout: 60s | Retries: max 2 per draft
4. (Optional) `save_rule_to_campaign_activity` again after edits complete

**Error handling:** Individual edit failures are tallied; workflow succeeds with partial results.

---

#### `EnrichForCampaignWorkflow`

**File:** `workflow/enrich_for_campaign_workflow.py`
**Purpose:** Enriches creator profiles when added to a campaign (social data fetch, email discovery). Solves: "add Instagram creators to campaign even without their email yet."

**Trigger:** API endpoint, when creators are added to campaign.

**Inputs:**
```python
EnrichForCampaignParams:
  creator_ids: list[UUID]
  campaign_id: UUID
```

**Outputs:**
```python
EnrichForCampaignResult:
  campaign_id: UUID
  results: list[EnrichmentResult]
```

**Activity sequence:**
- `enrich_creator_for_campaign_activity` × N — fanned out in parallel (no `asyncio.gather`, sequential for loop)
  - Timeout: 5 min | Retries: **max 1 (NO_RETRY)** — failure = synthetic `FAILED` result appended

**Error handling:** Per-creator exception caught; workflow continues. Individual failures result in `FAILED` status, not workflow abort.

---

#### `CampaignDiscoveryWorkflow`

**File:** `workflow/campaign_discovery_workflow.py`
**Purpose:** Discovers new creators for a single campaign (Apify or lookalike search), adds them as recipients, and seeds the outbox queue.

**Inputs:** `CampaignDiscoveryParams`
**Outputs:** `CampaignDiscoveryResult` (includes `added_count`)

**Activity sequence:**
1. `discover_creators_for_campaign_activity` — Timeout: 10 min | Retries: max 3
2. If `added_count > 0`: `populate_outbox_for_new_recipients_activity` — Timeout: 5 min | Retries: max 3

---

### Tier 3: Thread Processing Pipeline (Core Business Logic)

The thread processing pipeline is the most complex subsystem. It runs for every email thread (both Gmail and SMTP paths).

---

#### `ThreadSyncWorkflow`

**File:** `workflow/thread_sync_workflow.py`
**Purpose:** Gmail entry point into the thread processing pipeline. Batch-inserts latest Gmail thread states and fans out `ThreadProcessingCoordinatorWorkflow` per new candidate.

**Trigger:** Called after `ingest_single_message_activity` (via `execute_campaign_workflows_activity` or direct API trigger).

**Activity sequence:**
1. `batch_insert_latest_state_and_get_candidates_activity` → list of `Candidate` objects
   - Timeout: 10 min | Retries: max 3

**Child workflows spawned (fire-and-forget):**
- `ThreadProcessingCoordinatorWorkflow` per candidate
- `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`
- `parent_close_policy=ABANDON`
- Search attributes: `GmailThreadId`, `GmailThreadStateId`, `UserEmail`, `GoogleAccountEmail`

**Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` on this workflow.

---

#### `SmtpThreadSyncWorkflow`

**File:** `workflow/smtp_thread_sync_workflow.py`
**Purpose:** SMTP counterpart to `ThreadSyncWorkflow`. After SMTP inbox sync, creates `SmtpThreadState` records and fans out processing.

**Inputs:**
```python
SmtpThreadSyncParams:
  smtp_account_id: UUID
```

**Outputs:**
```python
SmtpThreadSyncResult:
  candidates_processed: int
  workflows_spawned: int
```

**Activity sequence:**
1. `batch_insert_latest_smtp_state_and_get_candidates_activity` → list of SMTP candidates
   - Timeout: 5 min | Retries: max 3

**Child workflows spawned (fire-and-forget):**
- `ThreadProcessingCoordinatorWorkflow` per candidate
- `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY`, `parent_close_policy=ABANDON`

---

#### `ThreadProcessingCoordinatorWorkflow` ⭐

**File:** `workflow/thread_processing_coordinator_workflow.py`
**Purpose:** The central orchestrator for processing a single email thread end-to-end. Handles classification, drafting, follow-up scheduling, and metrics extraction. This is the most critical workflow in the system.

**Trigger:** Spawned by `ThreadSyncWorkflow` (Gmail) or `SmtpThreadSyncWorkflow` (SMTP), fire-and-forget.

**Inputs:** `Candidate` — universal thread-processing context object (see Activity Reference below)
**Outputs:** None (all results written to DB)

**Full Activity Sequence (in order):**

| Step | Activity | Condition | Timeout | Max Retries | Retry Strategy |
|------|----------|-----------|---------|------------|----------------|
| 1 | `ensure_complete_thread_ingested` | Gmail only | 5 min | 3 | Exponential |
| 2 | `update_state_status` → `READY_FOR_CAMPAIGN_ASSOCIATION` | Always | 3 min | 3 | Default |
| 3 | *(child)* `ThreadAttachmentExtractWorkflow` | Gmail only | — | — | Child workflow |
| 4 | *(child)* `ThreadAssociateToCampaignWorkflow` | Always | — | — | Child workflow |
| 5 | `update_creator_latest_interaction` | SMTP + has campaign | 30s | 3 | Default |
| 6 | `execute_campaign_workflows` | Gmail + has campaign | 5 min | 3 | Exponential |
| 7 | `extract_campaign_creator` | Gmail + has campaign | 20 min | 3 | Exponential |
| 8 | `generate_lookalikes_for_opt_in` | Gmail + has campaign + creators found | 15 min | 2 | Exponential |
| 9 | `extract_thread_flags` | Gmail + has campaign | 5 min | 1 | None (LLM) |
| 10 | `update_creator_latest_interaction` | Gmail + has campaign | 30s | 3 | Default |
| 11 | `cancel_follow_ups_on_reply` | INBOUND + has campaign | 1 min | 3 | Default |
| 12 | `check_if_campaign_should_extract_metrics` | INBOUND + has campaign | 1 min | 1 | None |
| 13 | *(child)* `ThreadExtractMetricsWorkflow` | metrics enabled | — | — | Child workflow |
| 14 | `update_state_status` → `READY_FOR_RESPONSE_DRAFT` or `IGNORE` | INBOUND | 3 min | 3 | Default |
| 15 | `check_domain_and_classify` | INBOUND + READY | 5 min | 2 | Default |
| 16 | Auto-send opt_out or execute domain behavior | Conditional | Varies | Varies | — |
| 17 | *(child)* `ThreadResponseDraftWorkflow` | Draft needed | — | — | Child workflow |
| 18 | `ingest_sent_reply_as_example` | OUTBOUND + has campaign | 5 min | 2 | Default |
| 19 | `check_if_thread_is_done` | OUTBOUND + has campaign | 10 min | 3 | Default |
| 20 | `schedule_follow_up` | OUTBOUND + WAITING_FOR_INBOUND | 10 min | 3 | Default |
| 21 | `update_state_status` (final) | OUTBOUND | 3 min | 1 | None |

**Branch Logic:**

```
INBOUND thread received?
│
├── [Gmail only] Attachment extraction (async child)
│
├── Campaign association (child workflow, always)
│   ├── force_campaign_id set? → direct write
│   ├── Existing DB association? → reuse
│   └── LLM matching → associate or orphan
│
├── HAS campaign association?
│   │
│   ├── [Gmail] Extract creator info (LLM) — role, handles, confidence
│   ├── [Gmail] Generate lookalikes (if opt-in + creators found)
│   ├── [Gmail] Extract thread flags (LLM):
│   │   opt_in | opt_out | has_question | is_auto_reply | etc.
│   │
│   ├── Cancel scheduled follow-ups (INBOUND always)
│   │
│   ├── Check metrics extraction needed?
│   │   └── ThreadExtractMetricsWorkflow (async child)
│   │
│   ├── Check domain + classify:
│   │   ├── is opt_out?
│   │   │   ├── FULL_AUTOMATION → auto-send opt_out response
│   │   │   └── else → draft opt_out response for review
│   │   ├── is opt_in?
│   │   │   └── execute campaign workflows (GoAffPro, Shopify)
│   │   └── otherwise → standard draft generation path
│   │
│   └── Generate response draft (ThreadResponseDraftWorkflow child)
│       ├── Gmail → RAG-based draft
│       └── SMTP → plain LLM draft
│
└── NO campaign association → thread orphaned (available in "Uncategorized")

OUTBOUND (sent reply):
├── Learn from sent reply (ingest as RAG example)
├── Check if thread is done
├── Schedule follow-up (if WAITING_FOR_INBOUND)
└── Update final status
```

**Automation levels:**
- `FULL_AUTOMATION`: auto-send all responses without operator review
- `SEMI_AUTOMATION`: auto-send simple opt-in replies; draft complex responses for review
- `MANUAL` (default): all drafts require operator review before sending

**Error handling philosophy:**
- **Non-critical activities** (creator interaction update, campaign workflow execution, creator extraction, flag extraction, sent reply ingestion) are wrapped in `try/except` — logged as warnings, do NOT fail thread processing
- **Critical activities** (campaign association, draft generation, state transitions) propagate and retry
- Result: thread processing degrades gracefully when enrichment fails but always completes core state transitions

---

#### `ThreadAssociateToCampaignWorkflow`

**File:** `workflow/thread_associate_to_campaign_workflow.py`
**Purpose:** Matches an email thread to a campaign. Three-path decision tree.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow`.

**Inputs:** `Candidate`
**Outputs:**
```python
CampaignAssociationResult:
  campaign_id: UUID | None
  campaign_status: str | None
```

**Activity sequence (branching):**
1. If `force_campaign_id` set → `write_campaign_thread_to_db_activity` → return
   - Timeout: 10 min | Retries: max 1
2. `maybe_find_campaign_by_thread_id_activity` → if found, return existing
   - Timeout: 10 min | Retries: max 1
3. `handle_thread_no_campaign_activity` (LLM matching) → if matched, `write_campaign_thread_to_db_activity`
   - Timeout: 10 min | Retries: max 1

All activities use max 1 retry (idempotent writes; no benefit from multiple retries).

---

#### `ThreadResponseDraftWorkflow`

**File:** `workflow/thread_response_draft_workflow.py`
**Purpose:** Generates an AI-drafted reply for an email thread. Staleness check prevents drafting for superseded thread states. RAG-based for Gmail, plain LLM for SMTP.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow`. "Should be deduplicated by gmail_thread_state.id".

**Inputs:** `Candidate`
**Outputs:**
```python
ThreadResponseDraftResult:
  status: GmailThreadStatus
  gmail_draft_id: str | None
```

**Activity sequence:**
1. `check_is_latest_for_thread_state_activity` → if NOT_LATEST, return early
   - Timeout: 10 min | Retries: max 1
2. `maybe_get_draft_by_thread_state_id_activity` — skip if `force_reply=True`
   - Timeout: 10 min | Retries: max 1
3. If existing draft: `get_gmail_draft_id_for_state_activity` → return with existing ID
4. Generate draft:
   - Gmail: `generate_draft_with_rag_activity` — Timeout: 20 min | Retries: max 1
   - SMTP: `generate_draft_using_llm_activity` — Timeout: 20 min | Retries: max 1
5. `upload_llm_draft_to_gmail_activity` — Timeout: 5 min | Retries: max 1
6. `write_llm_draft_to_db_activity` — Timeout: 3 min | Retries: max 1

**Staleness guard:** Step 1 checks if `candidate.gmail_thread_state_id` is still the latest state for the thread. If a new message arrived while this workflow was queued, abort — prevents drafting stale context.

---

#### `ThreadResponseDraftWithCorrectionsWorkflow`

**File:** `workflow/thread_response_draft_with_corrections_workflow.py`
**Purpose:** Alternative draft generation that incorporates human correction examples from a JSONL file to improve draft quality.

**Trigger:** Manual API trigger or A/B testing path.

**Inputs:**
```python
Candidate
n_correction_examples: int = 10
include_thread_context_in_examples: bool = False
```

**Activity sequence:**
1. `check_is_latest_for_thread_state_activity` → early return if stale
2. `maybe_get_draft_by_thread_state_id_activity` → early return if duplicate
3. `generate_draft_with_corrections_activity` — Timeout: 20 min | Retries: max 1
4. `upload_llm_draft_to_gmail_activity` — Timeout: 5 min | Retries: max 1
5. `write_llm_draft_to_db_activity` — Timeout: 3 min | Retries: max 1

---

#### `ThreadFollowUpDraftWorkflow`

**File:** `workflow/thread_follow_up_draft_workflow.py`
**Purpose:** Generates an AI follow-up email draft for threads that haven't received a reply after a scheduled delay.

**Trigger:** Spawned by `TriggerThreadFollowUpDraftWorkflow` (fire-and-forget).

**Inputs:** `Candidate`
**Outputs:** `GmailThreadStatus` enum value

**Activity sequence:**
1. `check_is_latest_for_thread_state_activity` → early return + status update if stale
   - Timeout: 1 min | Retries: max 1
2. `update_state_status_activity` → `NOT_LATEST` if stale
3. `maybe_get_draft_by_thread_id_activity` → skip if draft exists
   - Timeout: 1 min | Retries: max 1
4. `generate_follow_up_draft_using_llm_activity` — Timeout: 20 min | Retries: max 1
5. `upload_llm_draft_to_gmail_activity` — Timeout: 5 min | Retries: max 1
6. `write_llm_draft_to_db_activity` — Timeout: 3 min | Retries: max 1
7. `mark_schedule_as_drafted_activity` — Timeout: 3 min | Retries: max 1
8. `update_state_status_activity` → `WAITING_FOR_DRAFT_REVIEW` — Timeout: 3 min | Retries: max 1

---

#### `ThreadAttachmentExtractWorkflow`

**File:** `workflow/thread_attachment_extract_workflow.py`
**Purpose:** Fetches and extracts content from email attachments (PDFs, images) to make attachment content available for RAG-based draft generation.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow` (Gmail only, async).

**Activity sequence (per attachment):**
1. `fetch_attachments_to_extract_activity` — Timeout: 5 min | Retries: max 1
2. For each attachment: `extract_attachment_activity` — Timeout: 15 min | Retries: max 1
3. `maybe_write_llm_extracted_content_to_db_activity` — Timeout: 3 min | Retries: max 1

---

#### `ThreadExtractMetricsWorkflow`

**File:** `workflow/thread_metrics_workflow.py`
**Purpose:** Extracts engagement metrics (follower count, engagement rate, niche) from email thread content using LLM, then writes to Google Sheets for reporting.

**Trigger:** Child of `ThreadProcessingCoordinatorWorkflow` (INBOUND + campaign + metrics enabled, async).

**Activity sequence:**
1. `extract_metrics_from_thread_using_llm_activity`
   - Timeout: 20 min | Retries: max 5 | Backoff: exponential (1m → 5m, coef 2.0)
2. `update_sheet_with_metrics_activity` — **sent to `"google-sheets"` task queue**
   - Timeout: 10 min | Retries: max 5 | Backoff: exponential (5s → 155s, coef 2.0)

**Notable:** The dedicated `"google-sheets"` queue with `max_concurrent_activities=1` prevents Google Sheets API rate limits.

---

#### `PostTrackingWorkflow`

**File:** `workflow/post_tracking_workflow.py`
**Purpose:** Detects Instagram posts from opted-in creators within their active tracking windows. Matches posts to campaigns for ROI measurement.

**Trigger:** Spawned by `PostTrackingSchedulerWorkflow` (daily).

**Activity sequence:**
- Gets trackable creators
- `process_creator_posts_activity` per creator (sequential)
  - Timeout: 5 min | Retries: max 2
  - Per-creator `try/except` — individual failures do not halt others

**Error handling:** `@report_workflow_errors(report_exception_to_rollbar)` on `PostTrackingWorkflow`.

---

## Activity Reference

### Universal Context Object: `Candidate`

Nearly every thread-processing activity accepts this dataclass:

```python
@dataclass
class Candidate:
    gmail_thread_state__id: UUID | None
    smtp_thread_state__id: UUID | None
    gmail_account_id: UUID | None
    smtp_account_id: UUID | None    # discriminator: None = Gmail, set = SMTP
    gmail_thread_id: str | None
    email_thread_id: str | None     # SMTP thread ID
    direction: str                  # "INBOUND" | "OUTBOUND"
    force_reply: bool               # bypass safety guards
    force_campaign_id: UUID | None  # bypass LLM campaign matching
    # ... latest message fields
```

`smtp_account_id is not None` is the canonical check for SMTP vs Gmail dispatch.

---

### Activity Groups by Domain

#### Domain 1: Gmail Ingestion

| Activity | Function | Side Effects | Invoked By |
|----------|----------|--------------|-----------|
| `get_all_active_gmail_emails` | `() → list[str]` | DB read | `AllPollHistoryWorkflow` |
| `poll_history` | `(PollHistoryParams) → PollHistoryResult` | Gmail API + DB write (sync lock, history reset on 404) | `ProcessAccountMessagesWorkflow` |
| `ingest_single_message` | `(IngestSingleMessageParams) → IngestSingleMessageResult` | Gmail API + DB write + object storage write | `ProcessAccountMessagesWorkflow` |
| `update_history_id` | `(UpdateHistoryIdParams) → None` | DB write (checkpoint advance) | `ProcessAccountMessagesWorkflow` |
| `ensure_complete_thread_ingested` | `(EnsureCompleteThreadParams) → EnsureCompleteThreadResult` | Gmail API + DB read/write + object storage | `ThreadProcessingCoordinatorWorkflow` |

Key patterns:
- `poll_history_activity` uses a sync lock to prevent concurrent polling for the same account
- `ingest_single_message_activity` returns `status="inserted"` or `status="skipped"` (reason: `draft`, `duplicate`, `not_found`) — never raises on known skip conditions
- `update_history_id_activity` is the safety gate — only called after full batch success

#### Domain 2: SMTP Ingestion

| Activity | Function | Side Effects | Invoked By |
|----------|----------|--------------|-----------|
| `get_all_active_smtp_emails` | `() → list[str]` | DB read | `AllSmtpInboxSyncWorkflow` |
| `smtp_inbox_sync` | `(SmtpInboxSyncParams) → SmtpInboxSyncResult` | IMAP connection + DB write | `BatchSmtpInboxSyncWorkflow` |
| `batch_insert_latest_smtp_state_and_get_candidates` | `(SmtpThreadStateSyncParams) → list[Candidate]` | DB read/write | `SmtpThreadSyncWorkflow` |

SMTP sync uses UID-based incremental sync with `UIDVALIDITY` change detection for full-resync on UID reset. Decrypts stored IMAP passwords via `crypto_service.decrypt()`.

#### Domain 3: Thread State & Campaign Association

| Activity | Function | Key Logic |
|----------|----------|-----------|
| `batch_insert_latest_state_and_get_candidates` | `() → list[Candidate]` | Creates `GmailThreadState` records, returns candidates |
| `update_state_status` | `(Candidate, status) → None` | Transitions `gmail_thread_state.status` |
| `maybe_find_campaign_by_thread_id` | `(Candidate) → CampaignAssociationResult` | DB lookup of existing `campaign_thread` |
| `handle_thread_no_campaign` | `(Candidate) → CampaignAssociationResult` | LLM matching of thread to campaign |
| `write_campaign_thread_to_db` | `(Candidate, campaign_id) → None` | Upserts `campaign_thread` record |

#### Domain 4: Creator Intelligence

| Activity | Function | Side Effects | Invoked By |
|----------|----------|--------------|-----------|
| `extract_campaign_creator` | `(Candidate) → CreatorExtractionResult` | LLM call + DB write (`campaign_creator` upsert) | `ThreadProcessingCoordinatorWorkflow` |
| `extract_thread_flags` | `(Candidate) → ThreadFlagsResult` | LLM call + DB write (flags on `campaign_creator`) | `ThreadProcessingCoordinatorWorkflow` |
| `generate_lookalikes_for_opt_in` | `(Candidate) → None` | LLM call + DB write (`campaign_lookalike_suggestion`) | `ThreadProcessingCoordinatorWorkflow` |
| `update_creator_latest_interaction` | `(Candidate) → None` | DB write (`campaign_creator.last_interaction_at`) | `ThreadProcessingCoordinatorWorkflow` |
| `enrich_creator_for_campaign` | `(EnrichCreatorParams) → EnrichmentResult` | Apify + DB write + optional outbox queue insert | `EnrichForCampaignWorkflow` |

Enrichment waterfall order: DB cache → Apify scrape → bio link crawl → Influencer Club API

#### Domain 5: Draft Generation

| Activity | Function | Side Effects | Invoked By |
|----------|----------|--------------|-----------|
| `check_is_latest_for_thread_state` | `(Candidate) → bool` | DB read | Draft workflows |
| `maybe_get_draft_by_thread_state_id` | `(Candidate) → DraftResult` | DB read | Draft workflows |
| `generate_draft_with_rag` | `(Candidate) → DraftContent` | Claude API + vector search | `ThreadResponseDraftWorkflow` |
| `generate_draft_using_llm` | `(Candidate) → DraftContent` | Claude API | `ThreadResponseDraftWorkflow` (SMTP) |
| `generate_draft_with_corrections` | `(Candidate, n, include_context) → DraftContent` | Claude API + JSONL examples | `ThreadResponseDraftWithCorrectionsWorkflow` |
| `generate_follow_up_draft_using_llm` | `(Candidate) → DraftContent` | Claude API | `ThreadFollowUpDraftWorkflow` |
| `upload_llm_draft_to_gmail` | `(Candidate, draft) → str` | Gmail API (creates draft) | Draft workflows |
| `write_llm_draft_to_db` | `(Candidate, draft, gmail_draft_id) → None` | DB write (`gmail_thread_llm_draft`) | Draft workflows |
| `apply_edit_to_draft` | `(DraftEditParams) → None` | Claude API + DB write + Gmail API | `BulkDraftEditWorkflow` |
| `ingest_sent_reply_as_example` | `(Candidate) → None` | DB write (`email_reply_example` for RAG) | `ThreadProcessingCoordinatorWorkflow` |

All LLM activities: `maximum_attempts=1` — fail fast, surface errors, never silently retry.

#### Domain 6: Send Pipeline

| Activity | Function | Rate Limiting | Invoked By |
|----------|----------|---------------|-----------|
| `send_campaign_outbox` | `() → SendCampaignOutboxResult` | 1 email per account per execution | `SendCampaignOutboxWorkflow` |
| `send_campaign_follow_ups` | `() → SendCampaignFollowUpsResult` | 1 email per account per execution | `SendCampaignFollowUpsWorkflow` |
| `send_email_dispatches` | `() → SendEmailDispatchesResult` | 1 email per account per execution | `SendEmailDispatchesWorkflow` |
| `send_post_opt_in_follow_ups` | `() → SendPostOptInFollowUpsResult` | 1 email per account per execution | `SendPostOptInFollowUpsWorkflow` |
| `auto_send_response` | `(Candidate, response) → None` | None (single send) | `ThreadProcessingCoordinatorWorkflow` |

**Crash recovery pattern:** Send activities reset `PROCESSING` items older than 30 minutes to `PENDING` on startup, handling worker crashes mid-send.

#### Domain 7: Follow-Up Scheduling

| Activity | Function | Side Effects |
|----------|----------|--------------|
| `schedule_follow_up` | `(Candidate) → None` | DB write (`gmail_thread_state_follow_up_schedule`) |
| `cancel_follow_ups_on_reply` | `(Candidate) → None` | DB write (marks schedules cancelled) |
| `mark_schedule_as_drafted` | `(ScheduleParams) → None` | DB write (marks schedule as drafted) |
| `check_if_thread_is_done` | `(Candidate) → bool` | LLM call + DB read |

Follow-up cancellation is called immediately when any INBOUND message arrives, preventing a follow-up from sending after the creator has already replied.

#### Domain 8: Campaign Workflows (GoAffPro, Shopify)

| Activity | Function | Side Effects |
|----------|----------|--------------|
| `execute_campaign_workflows` | `(Candidate) → None` | Runs AI tools: GoAffPro, Shopify |
| `discover_creators_for_campaign` | `(CampaignDiscoveryParams) → DiscoveryResult` | Apify + DB write |
| `populate_outbox_for_new_recipients` | `(CampaignId) → int` | DB write (outbox queue entries) |

#### Domain 9: Metrics & Reporting

| Activity | Function | Side Effects |
|----------|----------|--------------|
| `extract_metrics_from_thread_using_llm` | `(Candidate) → MetricsResult` | Claude API |
| `update_sheet_with_metrics` | `(MetricsResult, campaign) → None` | Google Sheets API (rate-limited queue) |
| `process_creator_posts` | `(CreatorParams) → list[CreatorPost]` | Apify + Claude vision API + DB write |
| `get_campaigns_needing_discovery` | `() → list[Campaign]` | DB read |
| `check_if_campaign_should_extract_metrics` | `(Candidate) → bool` | DB read |

#### Domain 10: Slack & Notifications

| Activity | Function | Side Effects |
|----------|----------|--------------|
| `post_slack_order_digest` | `(CampaignParams) → SlackResult` | Slack API (posts message) |
| `get_campaigns_with_slack_channel` | `() → list[Campaign]` | DB read |

#### Domain 11: Attachment Processing

| Activity | Function | Side Effects |
|----------|----------|--------------|
| `fetch_attachments_to_extract` | `(Candidate) → list[Attachment]` | Gmail API + DB read |
| `extract_attachment` | `(Attachment) → ExtractedContent` | Claude API (multimodal for images) |
| `maybe_write_llm_extracted_content_to_db` | `(content) → None` | DB write |

---

## State Machines

### Campaign Status

```
DRAFT ──────────────────► ACTIVE ──► PAUSED ──► ACTIVE
                              │
                              ▼
                          COMPLETED
```

| Status | Meaning | Transitions |
|--------|---------|-------------|
| `DRAFT` | Wizard in progress; infrastructure not yet created | → `ACTIVE` on launch |
| `ACTIVE` | Running; outbox draining, replies being processed | → `PAUSED` (manual), → `COMPLETED` (manual) |
| `PAUSED` | Outbox paused; existing threads continue processing | → `ACTIVE` (resume) |
| `COMPLETED` | Finished; `completed_at` timestamp set | Terminal |

### Thread State (`gmail_thread_state.status`)

```
NEW
  → READY_FOR_CAMPAIGN_ASSOCIATION
    → READY_FOR_RESPONSE_DRAFT
      → WAITING_FOR_DRAFT_REVIEW
        → DONE
    → IGNORE
  → NOT_LATEST (superseded by newer message)
```

| Status | Meaning | Set By |
|--------|---------|--------|
| `NEW` | Just ingested | `ThreadSyncWorkflow` |
| `READY_FOR_CAMPAIGN_ASSOCIATION` | Attachment extraction complete | `ThreadProcessingCoordinatorWorkflow` step 2 |
| `READY_FOR_RESPONSE_DRAFT` | Campaign associated, flags extracted | `ThreadProcessingCoordinatorWorkflow` step 14 |
| `WAITING_FOR_DRAFT_REVIEW` | Draft generated, awaiting operator | `ThreadResponseDraftWorkflow` |
| `DONE` | Thread fully processed | `ThreadProcessingCoordinatorWorkflow` |
| `IGNORE` | Not relevant (spam, test, etc.) | `ThreadProcessingCoordinatorWorkflow` |
| `NOT_LATEST` | Superseded by newer state | Draft workflows (staleness guard) |

### Creator Gifting Status (`campaign_creator.gifting_status`)

```
null → opted_in → processing → fulfilled → posted
     └→ opted_out
     └→ skipped
```

---

## Workflow Dependency Graph

```
Temporal Scheduler / API Triggers
│
├── AllPollHistoryWorkflow (∞ loop via continue_as_new)
│   └── ProcessAccountMessagesWorkflow (per Gmail account)
│       └── [ingest_single_message_activity]
│           └── execute_campaign_workflows_activity
│               └── ThreadSyncWorkflow
│                   └── ThreadProcessingCoordinatorWorkflow (per thread, fire-and-forget)
│                       ├── ThreadAttachmentExtractWorkflow (Gmail only, async child)
│                       ├── ThreadAssociateToCampaignWorkflow (child, always)
│                       ├── ThreadExtractMetricsWorkflow (conditional async child)
│                       └── ThreadResponseDraftWorkflow (conditional child)
│                           └── [or ThreadResponseDraftWithCorrectionsWorkflow]
│
├── AllSmtpInboxSyncWorkflow (periodic)
│   └── BatchSmtpInboxSyncWorkflow (per batch)
│       └── SmtpThreadSyncWorkflow (per account with new messages)
│           └── ThreadProcessingCoordinatorWorkflow (same subtree as above)
│
├── PostTrackingSchedulerWorkflow (∞ loop, 48h sleep)
│   └── PostTrackingWorkflow (spawned each cycle)
│
├── CampaignDiscoverySchedulerWorkflow (weekly)
│   └── CampaignDiscoveryWorkflow (per campaign, sequential)
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
└── SlackOrderDigestWorkflow (daily schedule or manual API trigger)
```

---

## Cross-Cutting Patterns

### Retry Policy Matrix

| Layer | Max Attempts | Backoff | Rationale |
|-------|-------------|---------|-----------|
| Scheduler/coordinator activities | 3 | Default | Transient network errors expected |
| LLM/AI activities | **1 (NO_RETRY)** | None | Expensive, non-deterministic — fail fast and surface |
| Critical writes (DB, Gmail) | 1–3 | Minimal | Idempotent writes; retrying is safe |
| Google Sheets | 5 | Exponential (5s → 155s, coef 2.0) | API rate limits |
| Gmail history | 5 | Exponential (1m → 5m, coef 2.0) | Gmail API rate limits |

### Workflow ID Reuse Policies

| Policy | Usage |
|--------|-------|
| `ALLOW_DUPLICATE_FAILED_ONLY` | Entry-point sync workflows (only re-run if previous failed) |
| `ALLOW_DUPLICATE` | Processing pipeline (safe to re-run — activities are idempotent) |
| Default | Scheduler/periodic workflows |

### Parent Close Policies

| Policy | Usage |
|--------|-------|
| `TERMINATE` | `ProcessAccountMessagesWorkflow` children — should not outlive parent poll cycle |
| `ABANDON` | All processing pipeline children — fire-and-forget; continue if parent crashes |

### Infinite Loop Pattern

Two workflows loop forever without external cron:
- `AllPollHistoryWorkflow`: `workflow.continue_as_new(params)` after each poll cycle
- `PostTrackingSchedulerWorkflow`: `workflow.continue_as_new()` after `await workflow.sleep(timedelta(hours=48))`

`continue_as_new` resets the event history to prevent unbounded growth — critical for workflows that run forever.

### Idempotency Strategy

All ingestion activities use `INSERT ... ON CONFLICT DO NOTHING`. Queue population uses the same pattern. This means:
1. Any activity can be safely retried
2. The Gmail history checkpoint can safely re-emit the same message IDs
3. Worker crashes are invisible to the business domain

### LLM Observability

Every LLM activity passes:
- `langfuse_session_id = candidate.gmail_thread_id` — groups traces by email thread
- `langfuse_user_id = account_email` — groups traces by Gmail account

This enables per-conversation debugging in Langfuse.

### Error Reporting Coverage

`@report_workflow_errors(report_exception_to_rollbar)` applied to:
- `AllPollHistoryWorkflow` — entry point for Gmail ingestion
- `SendCampaignOutboxWorkflow` — entry point for email sending
- `PostTrackingWorkflow` — entry point for post detection
- `ThreadSyncWorkflow` — entry point for thread processing

These are the "entry points" where unhandled exceptions indicate systemic failures.

### Crash Recovery Pattern

Send activities (`send_campaign_outbox`, `send_campaign_follow_ups`, `send_email_dispatches`, `send_post_opt_in_follow_ups`) all implement crash recovery:
- On startup, query for items stuck in `PROCESSING` status for > 30 minutes
- Reset those items to `PENDING` — they will be re-sent on the next execution
- Prevents orphaned sends after worker crashes

---

## Search Attributes

Custom Temporal search attributes for querying workflow state by business domain:

| Attribute Key | Type | Purpose |
|--------------|------|---------|
| `UserEmail` | Keyword | User who owns the thread |
| `GoogleAccountEmail` | Keyword | Gmail account processing the thread |
| `GoogleAccountEmailList` | KeywordList | Batch operations |
| `GmailThreadId` | Keyword | Gmail thread identifier |
| `GmailThreadStateId` | Keyword | State record UUID |

Source: `temporal/search_attributes.py`

---

## Implementation Notes for Developers

### Adding a New Workflow

1. Define the workflow class in `apps/backend/src/temporal/workflow/`
2. Export from `workflow/__init__.py`
3. Register in `worker.py` in the `workflows=[]` list for the `"main"` worker
4. If it uses activities, ensure activities are registered in the `activities=[]` list

### Adding a New Activity

1. Define with `@activity.defn` decorator in `apps/backend/src/temporal/activity/`
2. All activities must be synchronous (not async) for `ThreadPoolExecutor` compatibility
3. Exception: error reporting activities (`report_to_rollbar`, `report_exception_to_rollbar`) are async
4. Register in `worker.py` in the `activities=[]` list
5. Set explicit retry policy — never rely on defaults; LLM activities must use `maximum_attempts=1`

### Triggering Workflows from the API

Use the Temporal client (available as `app.state.temporal_client`):
```python
await temporal_client.start_workflow(
    MyWorkflow.run,
    params,
    id=f"my-workflow-{unique_id}",
    task_queue="main",
    id_reuse_policy=WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
)
```

### Activity Timeout Guidelines

| Operation Type | Suggested Timeout |
|----------------|------------------|
| DB read/write only | 30s – 3 min |
| External API (Gmail, SMTP) | 5 min |
| LLM call (single prompt) | 20 min |
| LLM + external API (enrichment) | 5 – 15 min |
| Google Sheets write | 10 min |

---

## User Problems Solved

| Workflow | User Problem Solved |
|---------|---------------------|
| `AllPollHistoryWorkflow` / `ProcessAccountMessagesWorkflow` | Gmail messages ingested in near-real-time without manual polling |
| `AllSmtpInboxSyncWorkflow` | Custom SMTP inbox replies captured alongside Gmail replies |
| `ThreadProcessingCoordinatorWorkflow` | Hundreds of creator replies classified, drafted, and tracked without manual intervention |
| `ThreadResponseDraftWorkflow` | Personalized AI replies at scale — operator reviews, not writes |
| `ThreadResponseDraftWithCorrectionsWorkflow` | Draft quality improves over time by incorporating human correction examples |
| `ThreadFollowUpDraftWorkflow` | Creators who don't respond receive timed follow-ups without manual tracking |
| `BulkDraftEditWorkflow` | Brand tone change → update 200 pending drafts with one instruction |
| `EnrichForCampaignWorkflow` | Add Instagram creators to campaign without needing their email upfront |
| `CampaignDiscoveryWorkflow` | Automatic weekly discovery of new relevant creators — no manual research |
| `PostTrackingWorkflow` | Know which gifted creators actually posted, without checking Instagram daily |
| `SendCampaignOutboxWorkflow` / `SendCampaignFollowUpsWorkflow` | Emails sent at exactly the right time, not whenever someone checks the dashboard |
| `SlackOrderDigestWorkflow` | Approve Shopify gifting orders from Slack without logging into another tool |
| `ThreadExtractMetricsWorkflow` | Running spreadsheet of creator metrics auto-filled as replies arrive |
| `ThreadAttachmentExtractWorkflow` | AI-generated drafts reference creator media kit content from attachments |
