# Temporal Activities — Analysis

**Aspect:** `temporal-activities`
**Source:** `apps/backend/src/temporal/activity/`
**Cross-reference:** `apps/backend/src/temporal/workflow/`

---

## Overview

Cheerful has **44 activity files** implementing **~75 individual `@activity.defn` functions**. All activities run in a `ThreadPoolExecutor` (synchronous, not async), which allows SQLAlchemy's synchronous ORM and blocking HTTP calls. The two exceptions — `report_to_rollbar` and `report_exception_to_rollbar` — are async activities.

Activities are grouped below by domain. For each, the analysis documents: function signature, side effects (DB reads/writes, external API calls, emails sent), key business logic, and which workflows invoke it.

### The `Candidate` Object

Nearly every thread-processing activity accepts a `Candidate` dataclass. This is the universal thread-processing context object:

```python
@dataclass
class Candidate:
    gmail_thread_state__id: UUID | None
    smtp_thread_state__id: UUID | None
    gmail_account_id: UUID | None
    smtp_account_id: UUID | None       # discriminator: None = Gmail, set = SMTP
    gmail_thread_id: str | None
    email_thread_id: str | None        # SMTP thread ID
    direction: str                     # "INBOUND" | "OUTBOUND"
    force_reply: bool                  # bypass safety guards
    force_campaign_id: UUID | None     # bypass LLM campaign matching
    # ... latest message fields
```

`smtp_account_id is not None` is the canonical check for SMTP vs Gmail dispatch.

### Cross-Cutting Patterns

| Pattern | Description |
|---------|-------------|
| **Rate limiting** | `send_campaign_outbox_activity`, `send_campaign_follow_ups_activity`, `send_email_dispatches_activity`, `send_post_opt_in_follow_ups_activity` all process **one email per account per execution** — rate control via activity scheduling frequency |
| **Crash recovery** | Same send activities reset `PROCESSING` items older than 30 minutes to `PENDING` on startup — handles worker crashes mid-send |
| **Idempotency** | `INSERT ... ON CONFLICT DO NOTHING` used throughout; `idempotent_batch_insert()` pattern in every ingestion activity |
| **Gmail/SMTP polymorphism** | Almost every thread activity dispatches to either `GmailService`/`GmailRepository` or `SmtpEmailService`/`SmtpRepository` based on `candidate.smtp_account_id` |
| **`force_reply` flag** | Threads through many activities to bypass safety guards: domain filtering, LLM double-check, draft idempotency, history staleness |
| **LLM observability** | Every LLM call passes `langfuse_session_id = candidate.gmail_thread_id` and `langfuse_user_id = account_email` for per-conversation tracing in Langfuse |
| **NO_RETRY for LLM** | Most AI activities use `maximum_attempts=1` — LLM failures should surface, not silently retry with the same broken prompt |

---

## Domain 1: Gmail Ingestion

These activities form the Gmail polling and message ingestion pipeline.

### `poll_history_activity`
**File:** `poll_history_activity.py`

**Functions:**
- `get_all_active_gmail_emails_activity() -> list[str]`
- `poll_history_activity(params: PollHistoryParams) -> PollHistoryResult`

**Side Effects:**
- `get_all_active_gmail_emails_activity`: DB read only
- `poll_history_activity`: External — Gmail History API; DB write (conditional) — resets `last_poll_history_id` to NULL on 404 (expired history ID); uses sync lock to prevent concurrent polling for same account

**Business Logic:**
Fetches the Gmail delta since `last_poll_history_id`. Returns new message IDs. Does NOT advance the history ID — that only happens in `update_history_id_activity` after ALL messages are successfully processed. Handles first-sync initialization and expired-history-ID recovery.

**Invoked By:** `ProcessAccountMessagesWorkflow`

---

### `ingest_single_message_activity`
**File:** `ingest_single_message_activity.py`

**Function:** `ingest_single_message_activity(params: IngestSingleMessageParams) -> IngestSingleMessageResult`

**Side Effects:**
- External: `GmailService.get_messages_batch()`, `GmailService.list_send_as()`
- DB write: `GmailMessageRepository.idempotent_batch_insert()`, attachment metadata
- Object storage write: `upload_email_to_storage()` — raw email bytes
- Storage cleanup on error if DB insert fails

**Business Logic:**
Idempotent single-message ingestion. Returns `status="inserted"` or `status="skipped"` (reason: `draft`, `duplicate`, `not_found`). Never raises on known skip conditions; only raises on retryable errors. The `activity_id = "ingest-{message_id}"` deduplication ensures exactly-once semantics within a workflow execution.

**Invoked By:** `ProcessAccountMessagesWorkflow` (called once per message ID, sequential)

---

### `update_history_id_activity`
**File:** `update_history_id_activity.py`

**Function:** `update_history_id_activity(params: UpdateHistoryIdParams) -> None`

**Side Effects:**
- DB write: `UserGmailAccountRepository.update_last_poll_history_id()`

**Business Logic:**
Advances the Gmail polling checkpoint. Called **only after all messages in a batch are successfully processed**. If any message failed, the history ID is NOT advanced — failed messages are re-fetched on the next poll cycle.

**Invoked By:** `ProcessAccountMessagesWorkflow` (final step)

---

### `ensure_complete_thread_ingested_activity`
**File:** `ensure_complete_thread_activity.py`

**Function:** `ensure_complete_thread_ingested_activity(params: EnsureCompleteThreadParams) -> EnsureCompleteThreadResult`

**Side Effects:**
- External: `GmailService.get_thread()`, `GmailService.get_messages_batch()`, `GmailService.list_send_as()`
- DB read: `GmailMessageRepository.get_thread_messages()` (existing messages)
- DB write: inserts missing messages, uploads raw emails to object storage

**Business Logic:**
Before processing a thread, ensures all historical messages exist in the DB (gaps can occur if ingestion was added mid-campaign or messages arrived out of order). Compares existing DB message IDs against Gmail API response and fetches only missing ones. Idempotent. Gmail-only — SMTP threads are fetched differently.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (pre-processing, Gmail only)

---

## Domain 2: SMTP Ingestion

### `smtp_inbox_sync_activity`
**File:** `smtp_inbox_sync_activity.py`

**Functions:**
- `get_all_active_smtp_emails_activity() -> list[str]`
- `smtp_inbox_sync_activity(params: SmtpInboxSyncParams) -> SmtpInboxSyncResult`

**Side Effects:**
- External: IMAP connection (SSL/TLS); decrypts stored IMAP password via `crypto_service.decrypt()`
- DB write: `SmtpMessageRepository.idempotent_batch_insert()`, `UserSmtpAccountRepository.update_sync_state()`, `update_verification_status()` on IMAP error

**Business Logic:**
IMAP counterpart to `poll_history_activity`. Performs UID-based incremental sync, tracking `last_sync_uid` with UIDVALIDITY change detection for full-resync on UID reset. Parses RFC 2822 messages, determines thread ID from `References`/`In-Reply-To` headers, classifies direction (INBOUND/OUTBOUND), and batch-inserts new `SmtpMessage` rows. Updates sync state checkpoint after successful insert.

**Invoked By:** `BatchSmtpInboxSyncWorkflow`

---

### `smtp_thread_state_sync_activity`
**File:** `smtp_thread_state_sync_activity.py`

**Function:** `batch_insert_latest_smtp_state_and_get_candidates_activity(params: SmtpThreadStateSyncParams) -> list[Candidate]`

**Side Effects:**
- DB read/write: `SmtpThreadStateRepository.idempotent_batch_insert_latest_state()` — creates new `SmtpThreadState` rows for threads with newer messages; returns `Candidate` objects

**Business Logic:**
SMTP equivalent of `batch_insert_latest_state_and_get_candidates_activity`. After SMTP sync populates new `SmtpMessage` rows, this creates `SmtpThreadState` entries for threads needing processing and returns them as `Candidate` objects. Scoped to a single `smtp_account_id`.

**Invoked By:** `SmtpThreadSyncWorkflow`

---

## Domain 3: Thread State Management

### `gmail_thread_state`
**File:** `gmail_thread_state.py`

**Functions:**
- `update_state_status_activity(params: UpdateStateStatusParams) -> None`
- `check_is_latest_for_gmail_thread_id_activity(id: UUID) -> bool`
- `check_is_latest_for_thread_state_activity(candidate: Candidate) -> bool`
- `batch_get_follow_up_candidates_activity(batch_size: int = 50) -> list[Candidate]`
- `batch_insert_latest_state_and_get_candidates_activity(batch_size: int = 200) -> list[Candidate]`

**Side Effects:**
- `update_state_status_activity`: DB write — updates status on `GmailThreadState` or `SmtpThreadState`
- `batch_insert_latest_state_and_get_candidates_activity`: DB write — idempotently inserts new state rows for threads with new messages
- Others: DB read only

**Business Logic:**
Core thread state machine controls. `update_state_status_activity` is the write gate for all state transitions (e.g., `READY_FOR_RESPONSE_DRAFT`, `WAITING_FOR_DRAFT_REVIEW`, `DONE`, `IGNORE`, `NOT_LATEST`). `batch_insert_latest_state_and_get_candidates_activity` is the ingestion trigger: creates state rows for all Gmail threads with new messages and returns them for workflow fan-out.

**Key states:** `READY_FOR_RESPONSE_DRAFT` → `WAITING_FOR_DRAFT_REVIEW` → `DONE` / `IGNORE`

**Invoked By:** `ThreadSyncWorkflow`, `ThreadProcessingCoordinatorWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWorkflow`

---

## Domain 4: Campaign Association

### `campaign.py` — Campaign Lookup
**File:** `campaign.py`

**Functions:**
- `maybe_find_campaign_by_gmail_thread_id(gmail_thread_id: str) -> uuid.UUID | None`
- `maybe_find_campaign_by_thread_id_activity(candidate: Candidate) -> CampaignAssociationResult`

**Side Effects:** DB read only

**Business Logic:**
Routing decision gate. Resolves a thread to a campaign by looking up existing `CampaignThread` associations. The polymorphic version dispatches to Gmail or SMTP repository. Returns `CampaignAssociationResult(campaign_id, campaign_status)` — the `campaign_status` field is serialized as a string for Temporal serialization compatibility.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow`, `ThreadAssociateToCampaignWorkflow`

---

### `thread_associate_to_campaign_activity`
**File:** `thread_associate_to_campaign_activity.py`

**Functions:**
- `handle_thread_no_campaign_activity(candidate: Candidate) -> uuid.UUID | None`
- `check_if_thread_is_done_activity(candidate: Candidate) -> bool`
- `write_campaign_thread_to_db_activity(params: WriteCampaignThreadToDbParams) -> None`

**Side Effects:**
- `handle_thread_no_campaign_activity`: External — two sequential LLM calls (`maybe_find_campaign_association()` + `double_check_campaign_association()`); DB reads only
- `check_if_thread_is_done_activity`: External — LLM call (`is_thread_done()`); DB reads; raises `ApplicationError` on LLM failure
- `write_campaign_thread_to_db_activity`: DB write — idempotent upsert of `CampaignThread` row

**Business Logic:**
Three-activity campaign association pipeline. `handle_thread_no_campaign_activity` uses two sequential LLM calls (find + double-check) to match a thread to a campaign using sender/subject/product signals, with same-private-domain filtering to exclude internal emails. `force_reply` bypasses the double-check and domain filtering. `check_if_thread_is_done_activity` determines if the conversation has reached its goal.

**Invoked By:** `ThreadAssociateToCampaignWorkflow`

---

## Domain 5: Draft Generation

### `thread_response_draft_activity` — Core Draft Pipeline
**File:** `thread_response_draft_activity.py`

**Functions:**
- `generate_draft_using_llm_activity(candidate: Candidate) -> GenerateDraftUsingLlmResult`
- `upload_llm_draft_to_gmail_activity(params: UploadLlmDraftToGmailParams) -> str`
- `write_llm_draft_to_db_activity(params: WriteLlmDraftToDbParams) -> None`

**Side Effects:**
- `generate_draft_using_llm_activity`: External — LLM call (`generate_draft()`); DB reads (thread, campaign, products, workflow executions, custom fields); no writes
- `upload_llm_draft_to_gmail_activity`: External — `GmailService.create_draft()` or `SmtpEmailService.create_draft()`; DB reads (existing draft check); if `force_reply`, deletes old draft first
- `write_llm_draft_to_db_activity`: DB write — idempotent insert of `GmailThreadLlmDraft` row; if `force_reply`, deletes old record first

**Business Logic:**
Three-step standard draft pipeline. Step 1: LLM generates draft using full thread context, campaign rules/goals, products, workflow execution history, and recipient custom fields. Step 2: Draft uploaded to Gmail (creates draft in Gmail UI) or SMTP Drafts folder. Step 3: Draft persisted to local DB for display in inbox UI. The three-step split allows per-step retry isolation.

**Invoked By:** `ThreadResponseDraftWorkflow`, `ThreadFollowUpDraftWorkflow`, `thread_auto_send_activity`

---

### `thread_response_draft_with_rag_activity` — RAG-Enhanced Draft
**File:** `thread_response_draft_with_rag_activity.py`

**Function:** `generate_draft_with_rag_activity(candidate: Candidate) -> GenerateDraftUsingLlmResult`

**Side Effects:**
- External: LLM call (`generate_draft_with_rag()`) using Claude Opus 4.5 with V13 prompt; internally performs pgvector similarity search against `email_reply_example` for RAG retrieval
- DB reads only (no writes)

**Business Logic:**
Drop-in replacement for `generate_draft_using_llm_activity` that retrieves similar prior reply examples from the vector store to improve draft quality. Uses Claude Opus 4.5 (vs. default model) and the V13 prompt with action guidance and facts policy. Gmail-only. Used for campaigns where historical human replies improve AI quality.

**Invoked By:** `ThreadResponseDraftWorkflow` (selected for Gmail threads; SMTP always uses base activity)

---

### `thread_response_draft_with_corrections_activity` — Correction-Injected Draft
**File:** `thread_response_draft_with_corrections_activity.py`

**Function:** `generate_draft_with_corrections_activity(candidate: Candidate, n_correction_examples: int = 10, include_thread_context_in_examples: bool = False) -> GenerateDraftUsingLlmResult`

**Side Effects:**
- File read: `load_correction_examples(campaign_name)` — reads JSONL files from local filesystem
- External: LLM call (`generate_draft_with_corrections()`) — same Langfuse prompts as base draft
- DB reads only

**Business Logic:**
Alternative draft activity that injects human correction examples into the LLM prompt. Loads JSONL correction examples for the campaign by name, samples `n_correction_examples` excluding the current thread (hold-one-out cross-validation). Drop-in replacement. Used for campaigns with collected human correction data.

**Invoked By:** `ThreadResponseDraftWithCorrectionsWorkflow`

---

### `thread_follow_up_draft_activity` — Follow-Up Draft Generation
**File:** `thread_follow_up_draft_activity.py`

**Functions:**
- `generate_follow_up_draft_using_llm_activity(params: Candidate) -> GenerateDraftUsingLlmResult`
- `mark_schedule_as_drafted_activity(params: Candidate) -> None`

**Side Effects:**
- `generate_follow_up_draft_using_llm_activity`: External — LLM call (`generate_follow_up_draft()`); DB reads; raises `ApplicationError` on failure
- `mark_schedule_as_drafted_activity`: DB write — `GmailThreadStateFollowUpSchedule.gmail_thread_llm_draft_id` linked to generated draft

**Business Logic:**
Generates follow-up drafts for threads with no reply within the campaign's configured gap. Counts consecutive outbound messages since the last inbound to determine follow-up sequence number (1st, 2nd, Nth follow-up). `mark_schedule_as_drafted_activity` links the schedule row to the draft so the UI can show the scheduled follow-up. Gmail-only.

**Invoked By:** `ThreadFollowUpDraftWorkflow`

---

### `gmail_thread_llm_draft` — Draft Lookup (Idempotency Guards)
**File:** `gmail_thread_llm_draft.py`

**Functions:**
- `maybe_get_draft_by_gmail_thread_state_id_activity(gmail_thread_state_id: UUID) -> UUID | None`
- `maybe_get_draft_by_gmail_thread_id_activity(gmail_thread_id: str, gmail_account_id: UUID) -> UUID | None`
- `maybe_get_draft_by_thread_state_id_activity(candidate: Candidate) -> UUID | None`
- `get_gmail_draft_id_for_state_activity(candidate: Candidate) -> str | None`
- `maybe_get_draft_by_thread_id_activity(candidate: Candidate) -> UUID | None`

**Side Effects:** DB reads only — all query `GmailThreadLlmDraft` table

**Business Logic:**
A set of read-only draft lookup activities used as idempotency guards before generating new drafts. Different lookup keys (state ID vs thread ID) and return types (DB UUID vs external Gmail draft ID string). Polymorphic variants dispatch to Gmail or SMTP repositories based on `candidate.smtp_account_id`. If an existing draft is found, the workflow short-circuits and returns without regenerating.

**Invoked By:** `ThreadResponseDraftWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWithCorrectionsWorkflow`

---

## Domain 6: Outbound Email Sending

### `campaign_outbox_activity` — Campaign Initial Outreach Sender
**File:** `campaign_outbox_activity.py`

**Function:** `send_campaign_outbox_activity(params: SendCampaignOutboxParams) -> SendCampaignOutboxResult`

**Side Effects:**
- DB read/write: atomically claims pending queue items (`PENDING` → `PROCESSING` → `SENT`/`FAILED`), creates `CampaignThread` association, activates follow-up queue entries with `initial_sent_at`
- External: `GmailService.send_message_direct()` or `SmtpEmailService.send_message_direct()`
- Validates personalization tags before sending (raises `ValueError` on unreplaced `{{tag}}` patterns)
- Crash recovery: resets stuck `PROCESSING` items (30-minute threshold)

**Business Logic:**
The primary outbound campaign email sender. Sends one email per account per execution. After sending, creates a `CampaignThread` record and activates any pre-configured follow-up queue entries with `initial_sent_at`. Fetches Gmail `SendAs` display name for proper sender identity. Appends email signature before sending.

**Invoked By:** `SendCampaignOutboxWorkflow` (scheduled by `CampaignOutboxSchedulerWorkflow`)

---

### `campaign_follow_up_send_activity` — Follow-Up Sequence Sender
**File:** `campaign_follow_up_send_activity.py`

**Function:** `send_campaign_follow_ups_activity() -> SendCampaignFollowUpsResult`

**Side Effects:**
- DB read/write: claims follow-up queue entries, reads `GmailMessage` for reply detection, marks sent/failed/cancelled, cancels sibling pending follow-ups on reply
- External: `GmailService.send_message_direct()` or `SmtpEmailService.send_message_direct()`
- Crash recovery: resets stuck `PROCESSING` items (30 min threshold)

**Business Logic:**
Sends one scheduled follow-up email per account per execution. Before sending, checks whether the recipient has replied since the initial outreach (Gmail-only; SMTP reply detection noted as future work). If a reply is detected, cancels the pending follow-up AND all sibling pending follow-ups. Supports HTML/plain-text, email signatures, and proper RFC 2822 threading headers.

**Invoked By:** `SendCampaignFollowUpsWorkflow` (scheduled periodically)

---

### `post_opt_in_follow_up_send_activity` — Post-Opt-In Gifting Follow-Up Sender
**File:** `post_opt_in_follow_up_send_activity.py`

**Function:** `send_post_opt_in_follow_ups_activity() -> SendPostOptInFollowUpsResult`

**Side Effects:**
- DB read/write: claims post-opt-in follow-ups from `CampaignCreator`, checks for inbound activity since opt-in, cancels if creator has responded, sends and marks SENT
- External: `GmailService.send_message_direct()` (Gmail only — no SMTP)
- Crash recovery: resets stuck PROCESSING items

**Business Logic:**
Sends post-opt-in follow-up emails for gifting campaigns (e.g., "Your package shipped!"). Checks for recent inbound activity since opt-in time and cancels if the creator has already responded. Personalizes body template with creator name/email, appends campaign signature, sends as a reply in the original Gmail thread using RFC 2822 threading headers. Rate-limited to one per Gmail account per execution.

**Invoked By:** `SendPostOptInFollowUpsWorkflow`

---

### `email_dispatch_activity` — Generic Email Dispatch
**File:** `email_dispatch_activity.py`

**Function:** `send_email_dispatches_activity() -> SendEmailDispatchesResult`

**Side Effects:**
- DB read/write: claims items from `email_dispatch_queue`, marks sent/failed
- External: `GmailService.send_message_direct()` or `SmtpEmailService.send_message_direct()`
- Crash recovery: resets stuck PROCESSING items

**Business Logic:**
Generic email dispatch mechanism for ad-hoc or scheduled individual email sends (not campaign-specific). The `EmailDispatchQueue` table is a general-purpose scheduled email queue. Supports `In-Reply-To`, `References`, `cc_emails`, Gmail thread threading, and both text/HTML bodies. One email per account per execution.

**Invoked By:** `SendEmailDispatchesWorkflow`

---

## Domain 7: AI Classification & Thread Enrichment

### `opt_in_classification_activity` — Opt-In LLM Classifier
**File:** `opt_in_classification_activity.py`

**Function:** `classify_thread_opt_in_activity(params: OptInClassificationParams) -> OptInClassificationActivityResult`

**Side Effects:**
- External: LLM call (`classify_opt_in_or_out()`)
- DB reads: thread context
- No writes

**Output:**
```python
@dataclass
class OptInClassificationActivityResult:
    is_opt_in: bool
    asked_questions: bool
    should_auto_send: bool   # True only when is_opt_in=True AND asked_questions=False
```

**Business Logic:**
Classifies whether a thread represents a creator opt-in. `should_auto_send` is only `True` when the creator unconditionally agreed — prevents auto-send when questions were asked. On LLM failure or empty thread context, defaults to `should_auto_send=False` (safe fallback to manual review).

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (semi-automated campaigns, INBOUND path)

---

### `extract_thread_flags_activity` — Thread Signal Extraction
**File:** `extract_thread_flags_activity.py`

**Function:** `extract_thread_flags_activity(candidate: Candidate) -> None`

**Side Effects:**
- External: LLM call (`extract_thread_flags()`) — classifies `wants_paid`, `has_question`, `has_issue`
- DB write: `ThreadFlagRepository.upsert()` keyed by thread ID and message ID

**Business Logic:**
Fire-and-forget enrichment that classifies a thread with boolean flags for inbox UI display and downstream routing. Loads campaign details and thread messages before calling LLM. Returns `None` regardless of outcome — failures are logged, not propagated.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (concurrent side task)

---

### `domain_opt_in_activity` — Domain-Specific Classification Gate
**File:** `domain_opt_in_activity.py`

**Function:** `check_domain_and_classify_activity(candidate: Candidate) -> str | None`

**Side Effects:**
- DB reads: account repository
- External: LLM call (`classify_opt_in_or_out()`) — only when account domain contains `"ag1"`
- No writes

**Business Logic:**
Client-specific customization gate for `ag1`-domain accounts. If the email domain matches, classifies the thread as `"opt_in"`, `"opt_out"`, or `"asked_questions"`. Returns `None` for other domains (falls through to standard draft flow). Skips classification when `candidate.force_reply` is set.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (before draft generation, INBOUND path)

---

### `extract_campaign_creator_activity` — Creator Extraction & Opt-In Tracking
**File:** `extract_campaign_creator_activity.py`

**Function:** `extract_campaign_creator_activity(candidate: Candidate) -> list[str] | None`

**Side Effects:**
- External: Three sequential LLM calls — `extract_campaign_creators_from_thread()`, `match_creator_with_existing_rows()`, `generate_creator_note()`
- DB reads: campaign, product, existing `CampaignCreator` rows
- DB writes: upserts `CampaignCreator` rows, updates notes history, schedules post-opt-in follow-up on gifting status transition
- Post-tracking: calls `maybe_set_tracking_dates()` on opt-in

**Business Logic:**
The core creator extraction for gifting and paid promotion campaigns. Multi-step pipeline: (1) LLM extracts structured creator data (name, email, social handles, gifting status/address, paid rate); (2) multi-strategy matching against existing rows (exact email → thread+name → signal candidates → LLM fuzzy match); (3) upserts without duplicating; (4) enforces gifting status progression rules (no regression); (5) triggers note generation and post-opt-in follow-up scheduling on status transitions.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (GIFTING and PAID_PROMOTION campaigns)

---

### `thread_metrics_activity` — Google Sheets Metrics Extraction
**File:** `thread_metrics_activity.py`

**Functions:**
- `check_if_campaign_should_extract_metrics_activity(candidate: Candidate) -> bool`
- `extract_metrics_from_thread_using_llm_activity(candidate: Candidate) -> ExtractMetricsFromThreadResult`
- `update_sheet_with_metrics_activity(params: UpdateSheetWithMetricsParams) -> None`

**Side Effects:**
- `check_if_campaign_should_extract_metrics_activity`: DB read only (checks campaign for `google_sheet_url`, `google_sheet_data_instructions`, `google_sheet_tab_name`)
- `extract_metrics_from_thread_using_llm_activity`: External — Google Sheets API (read headers); LLM calls with self-review loop (up to 3 iterations); DB reads/writes (updates `campaign.google_sheet_error` field)
- `update_sheet_with_metrics_activity`: External — Google Sheets API (read + write); dispatched to `TEMPORAL_GOOGLE_SHEETS_TASK_QUEUE`

**Business Logic:**
Extracts campaign-specific metrics from thread content and writes them to Google Sheets. The extraction uses a self-reviewing LLM loop: first LLM extracts metrics per field, second LLM reviews accuracy, failed fields are fed back for re-extraction (up to 3 attempts). `update_sheet_with_metrics_activity` handles new-row vs. update-row paths, verifies write success, supports `google_sheet_columns_to_skip`.

**Invoked By:** `ThreadExtractMetricsWorkflow`

---

## Domain 8: Auto-Send & Automation

### `thread_auto_send_activity` — Automated Sending
**File:** `thread_auto_send_activity.py`

**Functions:**
- `check_if_campaign_is_fully_automated_activity(email_thread_id: str) -> bool`
- `get_campaign_automation_level_activity(email_thread_id: str) -> str`
- `auto_send_response_activity(params: AutoSendParams) -> AutoSendResult`
- `send_gmail_draft_activity(params: SendGmailDraftParams) -> AutoSendResult`

**Side Effects:**
- Check activities: DB read only
- `auto_send_response_activity`: External — LLM call (`generate_draft_using_llm_activity()`), email send (`SmtpEmailService` or `GmailService`); DB write — `GmailThreadLlmDraft` row for audit trail
- `send_gmail_draft_activity`: External — `GmailService.send_draft()` (promotes existing draft); no LLM, no additional DB write

**Business Logic:**
Fully-automated response pipeline. `auto_send_response_activity` generates and immediately sends without human review, writing an audit trail. `send_gmail_draft_activity` handles the case where an existing Gmail draft should be promoted and sent via the Gmail Drafts API. The automation level gate (`fully-automated` / `semi-automated` / `manual`) controls which path is taken.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (fully-automated and opt-in+auto-send branches)

---

### `cancel_follow_ups_on_reply_activity` — Reply-Triggered Follow-Up Cancellation
**File:** `cancel_follow_ups_on_reply_activity.py`

**Function:** `cancel_follow_ups_on_reply_activity(gmail_thread_id: str | None, email_thread_id: str | None) -> int`

**Side Effects:**
- DB write: `CampaignFollowUpOutboxQueueRepository.cancel_pending_for_thread()` — cancels all PENDING follow-ups with reason "Recipient replied"

**Business Logic:**
Called on INBOUND message detection. Cancels all pending follow-ups for the thread so no redundant follow-ups fire after a reply. Returns count of cancelled rows. Accepts either Gmail or SMTP thread ID.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (INBOUND path, when has campaign)

---

### `thread_schedule_follow_up_activity` — Follow-Up Scheduling
**File:** `thread_schedule_follow_up_activity.py`

**Function:** `schedule_follow_up_activity(candidate: Candidate) -> TemporalStatus`

**Side Effects:**
- DB reads: thread state, messages, campaign configuration
- DB write: `GmailThreadStateFollowUpScheduleRepository.idempotent_insert()` — creates schedule entry with `scheduled_at = latest_message_date + campaign.follow_up_gap_in_days`

**Business Logic:**
Schedules future follow-up draft generation after an outbound message. Idempotently creates a schedule row. Skip conditions: DONE/IGNORE thread, COMPLETED campaign, max follow-ups exceeded, active auto-send follow-ups already exist, latest message was INBOUND or cold-outreach. Gmail-only (SMTP logged and skipped).

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (OUTBOUND path, post-reply)

---

## Domain 9: Creator Discovery & Enrichment

### `campaign_discovery_scheduler_activity`
**File:** `campaign_discovery_scheduler_activity.py`

**Function:** `get_campaigns_needing_discovery_activity() -> list[dict]`

**Side Effects:** DB read only — queries active campaigns with `discovery_enabled=True` and `discovery_config IS NOT NULL`

**Business Logic:**
Scheduler-facing activity that finds all active campaigns eligible for auto-discovery. Returns `CampaignDiscoveryParams` dicts for fan-out. Pure data fetch.

**Invoked By:** `CampaignDiscoverySchedulerWorkflow`

---

### `campaign_discovery_activity` — Apify Creator Discovery
**File:** `campaign_discovery_activity.py`

**Function:** `discover_creators_for_campaign_activity(params: CampaignDiscoveryParams) -> CampaignDiscoveryResult`

**Side Effects:**
- External: Apify `get_lookalike_creators()` (one call per seed Instagram profile in `discovery_config`)
- DB read: existing recipient emails for dedup
- DB write: inserts new `CampaignRecipient` rows (upsert with `ON CONFLICT DO NOTHING`)

**Business Logic:**
For each seed Instagram profile in a campaign's `discovery_config`, calls Apify's lookalike creator search, filters by follower range and email availability, deduplicates against existing recipients, and inserts new `CampaignRecipient` rows. Requires `APIFY_API_TOKEN` and `APIFY_CREATOR_SEARCH_ACTOR_ID_1`.

**Invoked By:** `CampaignDiscoveryWorkflow`

---

### `campaign_discovery_outbox_activity` — Outbox Population After Discovery
**File:** `campaign_discovery_outbox_activity.py`

**Function:** `populate_outbox_for_new_recipients_activity(campaign_id_str: str) -> int`

**Side Effects:**
- DB write: Creates `CampaignOutboxQueue` entries for newly discovered recipients via `populate_queue_for_campaign`
- Idempotent — only creates entries for recipients without existing queue entries

**Business Logic:**
Called after `discover_creators_for_campaign_activity` adds new `CampaignRecipient` rows. Populates the outbox so those recipients get emails. Returns count of new queue entries created.

**Invoked By:** `CampaignDiscoveryWorkflow` (only when `added_count > 0`)

---

### `enrich_for_campaign_activity` — Campaign-Scoped Creator Enrichment
**File:** `enrich_for_campaign_activity.py`

**Function:** `enrich_creator_for_campaign_activity(params: EnrichCreatorForCampaignActivityParams) -> EnrichCreatorForCampaignResult`

**Side Effects:**
- DB reads/writes: reads `CampaignCreator`, finds/creates global `Creator` record, updates `enrichment_status` and `email`, calls `queue_enriched_creator` to add to outbox queue
- External: `enrich_single_creator()` enrichment waterfall (Apify → bio crawl → Influencer Club)

**Business Logic:**
Finds a creator's email address for campaign outreach. Handles campaign flow (`creator_id` = `CampaignCreator.id`) and standalone flow (`creator_id` = global `Creator.id`). On success, updates `enrichment_status = "enriched"`, saves email to `CampaignCreator`, and bridges the creator into the campaign outbox queue.

**Invoked By:** `EnrichForCampaignWorkflow` (fan-out, one per creator)

---

### `enrich_list_activity` — List-Level Enrichment
**File:** `enrich_list_activity.py`

**Function:** `enrich_creator_activity(params: EnrichCreatorParams) -> EnrichCreatorResult`

**Side Effects:**
- External: `enrich_single_creator()` enrichment waterfall
- DB writes: handled inside `enrich_single_creator`

**Business Logic:**
Thin wrapper around the enrichment waterfall for the list-enrichment flow (as opposed to campaign-specific flow). Looks up a global `Creator` by ID and runs the full waterfall.

**Invoked By:** `EnrichListWorkflow`

---

### `generate_lookalikes_activity` — Lookalike Creator Suggestions
**File:** `generate_lookalikes_activity.py`

**Function:** `generate_lookalikes_for_opt_in_activity(params: GenerateLookalikeParams) -> None`

**Side Effects:**
- External: Apify Instagram `get_lookalike_creators()` or `search_creators_by_keyword()` (with LLM keyword extraction fallback); YouTube `get_lookalike_channels()`
- External LLM call: GPT-4.1-mini for Instagram keyword extraction (fallback only)
- DB writes: upserts `CampaignLookalikeSuggestion` rows; upserts global `Creator` records via `save_creator_from_instagram()` / `save_creator_from_youtube()`

**Business Logic:**
When a creator opts in (`gifting_status == "OPTED_IN"`), generates lookalike suggestions. Detects platform from `social_media_handles`. For Instagram, uses similar-users actor with keyword-search fallback (LLM generates search keywords from seed creator's profile). Skips if campaign lacks `is_lookalike_suggestions_enabled` or is COMPLETED.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (when `creator_ids` returned by extract_campaign_creator)

---

## Domain 10: Post Tracking

### `post_tracking_activity` — Instagram Post Detection
**File:** `post_tracking_activity.py`

**Functions:**
- `get_trackable_creators_activity() -> list[dict]`
- `process_creator_posts_activity(params: ProcessCreatorPostsParams) -> ProcessCreatorPostsResult`

**Side Effects:**
- `get_trackable_creators`: DB read only — queries creators within active `post_tracking_ends_at` window with Instagram handles
- `process_creator_posts`: External — Apify (`fetch_instagram_posts()`), LLM (`analyze_instagram_post()`), object storage (`download_and_store_media_sync()`); DB writes — `CreatorPostRepository.upsert()`, updates `post_last_checked_at` and `last_seen_post_id`

**Business Logic:**
Tracks whether opted-in creators post content mentioning the campaign product. `get_trackable_creators` finds creators within their active tracking window. `process_creator_posts` fetches recent Instagram posts via Apify, skips if `last_seen_post_id` matches newest post (no new posts), deduplicates against DB, runs LLM analysis per post to check for product mentions, downloads and stores matched post media.

**Invoked By:** `PostTrackingWorkflow`

---

## Domain 11: RAG / Example Ingestion

### `ingest_email_reply_examples_activity` — Batch RAG Ingestion
**File:** `ingest_email_reply_examples_activity.py`

**Function:** `ingest_email_reply_examples_activity(params: IngestEmailReplyExamplesParams) -> IngestEmailReplyExamplesResult`

**Side Effects:**
- External: LLM (`ThreadSummarizer.summarize_batch()`), OpenAI embeddings (`EmbeddingService.embed_batch()`)
- DB write: `EmailReplyExampleRepository.insert()` — bulk inserts `(query_embedding, thread_context, inbound_email, sent_reply)` tuples into the vector table

**Business Logic:**
Batch ingestion of `(thread_context, inbound_email, sent_reply)` triples into the RAG vector store. Summarizes thread contexts, builds query strings via `build_rag_query`, generates embeddings, upserts into `email_reply_example`. This populates the store consumed by `generate_draft_with_rag_activity`. Callers must use `extract_latest_inbound_email()` for correct email selection.

**Invoked By:** `IngestEmailReplyExamplesWorkflow`

---

### `ingest_sent_reply_activity` — Real-Time Reply Ingestion
**File:** `ingest_sent_reply_activity.py`

**Function:** `ingest_sent_reply_as_example_activity(candidate: Candidate, campaign_id: str) -> bool`

**Side Effects:**
- External: LLM (`ThreadSummarizer.summarize()`), OpenAI embeddings, `ReplySanitizer.process()`
- DB reads: full thread context
- DB write: `EmailReplyExampleRepository.insert()` — single reply ingested with embedding

**Business Logic:**
When a human sends a reply, this activity ingests it as a RAG example for future draft generation. Finds the latest inbound/outbound pair, summarizes context, embeds the inbound query, sanitizes the outbound reply (removing creator-specific details), and stores. Returns `True` on success, `False` on failure (does not raise — fire-and-forget quality signal).

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (OUTBOUND path, after outbound message detection)

---

## Domain 12: Observability

### `observability_activity`
**File:** `observability_activity.py`

**Functions:**
- `report_to_rollbar(message: str, level: str, extra_data: dict | None) -> None` (async)
- `report_exception_to_rollbar(error_type: str, error_message: str, traceback_str: str, extra_data: dict) -> None` (async)

**Side Effects:** External — `rollbar.report_message()` / error reporting with traceback and person context

**Business Logic:**
Async activities wrapping Rollbar error reporting. `report_exception_to_rollbar` builds a Rollbar "person" object from `user_email` in `extra_data` for the Affected People tab. Fire-and-forget — does not block the workflow on completion.

**Invoked By:** Any workflow via `@report_workflow_errors` decorator

---

## Domain 13: Slack

### `slack_order_digest_activity`
**File:** `slack_order_digest_activity.py`

**Function:** `post_slack_order_digest_activity(params: SlackOrderDigestParams) -> SlackOrderDigestResult`

**Side Effects:**
- DB reads: `CampaignCreator` for pending orders, `CampaignWorkflowExecution` for Shopify outputs
- External: `SlackService.post_message()` — rich Slack block message
- DB write: sets `slack_digest_message_ts` and `slack_approval_status = "pending"` on posted creators

**Business Logic:**
Sends a Slack digest of creators whose gifting orders need approval. Enriches entries with Shopify Order Drafting workflow execution outputs. Records `message_ts` on each creator row for future threading and marks `slack_approval_status = "pending"` to prevent double-posting.

**Invoked By:** `SlackOrderDigestWorkflow`

---

### `slack_order_digest_scheduler_activity`
**File:** `slack_order_digest_scheduler_activity.py`

**Function:** `get_campaigns_with_slack_channel_activity() -> list[dict]`

**Side Effects:** DB read only — queries active campaigns with `slack_channel_id` and enabled `"Shopify Order Drafting"` workflow

**Business Logic:**
Scheduler-facing activity that finds active campaigns eligible for Slack order digest. Returns `{campaign_id, slack_channel_id, campaign_name}` dicts for fan-out.

**Invoked By:** `SlackOrderDigestSchedulerWorkflow`

---

## Domain 14: Agentic Workflow Execution

### `workflow_execution` — Claude Agent + MCP Tools
**File:** `workflow_execution.py`

**Function:** `execute_campaign_workflows_activity(gmail_thread_id: str, campaign_id: str) -> ClaudeAgentExecutionResult` (async)

**Side Effects:**
- DB reads: campaign workflows, thread context, thread state, previous workflow executions
- External: LLM call (`classify_applicable_workflows()`), Claude Agent SDK execution (`ClaudeAgentService.execute_workflows_with_agent()`)
- External: MCP tool server invocations (Composio integrations, Shopify, etc.) via `McpToolServerFactory`
- DB write: inserts `CampaignWorkflowExecution` rows with output data, status, timing, Temporal execution context; validates structured outputs against `workflow.output_schema`

**Business Logic:**
The most complex activity in the system. Orchestrates multi-step agentic workflow execution for a thread. Steps:
1. Load enabled campaign workflows
2. LLM classifies which workflows apply to the current thread (with previous execution history for context)
3. Select required MCP tools
4. Create MCP tool server scoped to `user_email` for Composio credential isolation
5. Run Claude Agent SDK with those tools
6. Save per-workflow execution results to `campaign_workflow_execution` table with schema validation

Used for automations like Shopify order drafting, contract processing, etc.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (after campaign association, Gmail only)

---

## Domain 15: Bulk Operations

### `bulk_draft_edit_activity`
**File:** `bulk_draft_edit_activity.py`

**Functions:**
- `get_pending_drafts_for_campaign_activity(campaign_id: str, user_id: str, exclude_thread_ids: list[str]) -> list[dict]`
- `apply_edit_to_draft_activity(item_dict: dict, edit_instruction: str) -> dict`
- `save_rule_to_campaign_activity(campaign_id: str, rule_text: str) -> None`

**Side Effects:**
- `get_pending_drafts`: DB read only — queries `GmailThreadState` + `CampaignThread` + `GmailThreadLlmDraft`; excludes threads with user-edited UI drafts
- `apply_edit_to_draft`: External — GPT-4.1 LLM call; DB write — updates `GmailThreadLlmDraft.draft_body_text`
- `save_rule_to_campaign`: DB write — appends `rule_text` to `Campaign.rules_for_llm`

**Business Logic:**
Three activities supporting bulk campaign draft editing. `get_pending_drafts` fetches all unreviewed, unedited LLM drafts. `apply_edit_to_draft` applies a natural-language edit instruction via GPT-4.1 to each draft body. `save_rule_to_campaign` optionally persists the edit as a standing campaign rule for future drafts. The `BulkDraftEditWorkflow` fans out `apply_edit_to_draft` concurrently for all drafts.

**Invoked By:** `BulkDraftEditWorkflow`

---

## Domain 16: Interaction Tracking

### `update_creator_interaction_activity`
**File:** `update_creator_interaction_activity.py`

**Function:** `update_creator_latest_interaction_activity(params: UpdateCreatorInteractionParams) -> int`

**Side Effects:**
- DB reads: `GmailMessageRepository.get_by_thread_id()` or `SmtpMessageRepository.get_by_thread_id()`
- DB write: `CampaignCreatorRepository.update_latest_interaction()` — updates `latest_interaction_at` timestamp for matching `CampaignCreator` rows

**Business Logic:**
Updates the `latest_interaction_at` timestamp on `CampaignCreator` rows for all external participants in a thread. Collects all sender/recipient emails, excludes the user's own inbox email (inferred from outbound message senders), updates matching rows across all campaigns. Returns row count updated.

**Invoked By:** `ThreadProcessingCoordinatorWorkflow` (after campaign association)

---

## Shared Utilities (Non-Activity)

### `thread_response_shared.py`
**File:** `thread_response_shared.py`

**Functions:**
- `build_smtp_send_context(...) -> SmtpSendContext`
- `build_gmail_send_context(...) -> GmailSendContext`

Not Temporal activities. Shared utility module that consolidates boilerplate for building send context objects: fetches account, initializes email service, calculates To/CC recipients via `DraftRecipientsService`, builds `In-Reply-To`/`References` headers. Consumed by `thread_auto_send_activity.py` and `thread_response_draft_activity.py`.

---

## Activity → Workflow Mapping

| Activity | Invoked By |
|----------|-----------|
| `poll_history_activity` | `ProcessAccountMessagesWorkflow` |
| `ingest_single_message_activity` | `ProcessAccountMessagesWorkflow` |
| `update_history_id_activity` | `ProcessAccountMessagesWorkflow` |
| `get_all_active_gmail_emails_activity` | `AllPollHistoryWorkflow` |
| `smtp_inbox_sync_activity` | `BatchSmtpInboxSyncWorkflow` |
| `get_all_active_smtp_emails_activity` | `AllSmtpInboxSyncWorkflow` |
| `batch_insert_latest_smtp_state_and_get_candidates_activity` | `SmtpThreadSyncWorkflow` |
| `ensure_complete_thread_ingested_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `batch_insert_latest_state_and_get_candidates_activity` | `ThreadSyncWorkflow` |
| `update_state_status_activity` | `ThreadProcessingCoordinatorWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWorkflow` |
| `check_is_latest_for_thread_state_activity` | `ThreadResponseDraftWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWithCorrectionsWorkflow` |
| `batch_get_follow_up_candidates_activity` | `TriggerThreadFollowUpDraftWorkflow` |
| `maybe_find_campaign_by_thread_id_activity` | `ThreadAssociateToCampaignWorkflow` |
| `handle_thread_no_campaign_activity` | `ThreadAssociateToCampaignWorkflow` |
| `check_if_thread_is_done_activity` | `ThreadAssociateToCampaignWorkflow` |
| `write_campaign_thread_to_db_activity` | `ThreadAssociateToCampaignWorkflow` |
| `generate_draft_using_llm_activity` | `ThreadResponseDraftWorkflow`, `auto_send_response_activity` |
| `generate_draft_with_rag_activity` | `ThreadResponseDraftWorkflow` |
| `generate_draft_with_corrections_activity` | `ThreadResponseDraftWithCorrectionsWorkflow` |
| `upload_llm_draft_to_gmail_activity` | `ThreadResponseDraftWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWithCorrectionsWorkflow` |
| `write_llm_draft_to_db_activity` | `ThreadResponseDraftWorkflow`, `ThreadFollowUpDraftWorkflow`, `ThreadResponseDraftWithCorrectionsWorkflow` |
| `maybe_get_draft_by_thread_state_id_activity` | `ThreadResponseDraftWorkflow`, `ThreadResponseDraftWithCorrectionsWorkflow` |
| `maybe_get_draft_by_thread_id_activity` | `ThreadFollowUpDraftWorkflow` |
| `get_gmail_draft_id_for_state_activity` | `ThreadResponseDraftWorkflow` |
| `generate_follow_up_draft_using_llm_activity` | `ThreadFollowUpDraftWorkflow` |
| `mark_schedule_as_drafted_activity` | `ThreadFollowUpDraftWorkflow` |
| `fetch_attachments_to_extract_activity` | `ThreadAttachmentExtractWorkflow` |
| `extract_attachment_activity` | `ThreadAttachmentExtractWorkflow` |
| `maybe_write_llm_extracted_content_to_db_activity` | `ThreadAttachmentExtractWorkflow` |
| `send_campaign_outbox_activity` | `SendCampaignOutboxWorkflow` |
| `send_campaign_follow_ups_activity` | `SendCampaignFollowUpsWorkflow` |
| `send_post_opt_in_follow_ups_activity` | `SendPostOptInFollowUpsWorkflow` |
| `send_email_dispatches_activity` | `SendEmailDispatchesWorkflow` |
| `classify_thread_opt_in_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `extract_thread_flags_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `check_domain_and_classify_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `extract_campaign_creator_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `cancel_follow_ups_on_reply_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `schedule_follow_up_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `auto_send_response_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `send_gmail_draft_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `check_if_campaign_is_fully_automated_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `get_campaign_automation_level_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `ingest_sent_reply_as_example_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `update_creator_latest_interaction_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `execute_campaign_workflows_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `generate_lookalikes_for_opt_in_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `check_if_campaign_should_extract_metrics_activity` | `ThreadExtractMetricsWorkflow` |
| `extract_metrics_from_thread_using_llm_activity` | `ThreadExtractMetricsWorkflow` |
| `update_sheet_with_metrics_activity` | `ThreadExtractMetricsWorkflow` |
| `get_campaigns_needing_discovery_activity` | `CampaignDiscoverySchedulerWorkflow` |
| `discover_creators_for_campaign_activity` | `CampaignDiscoveryWorkflow` |
| `populate_outbox_for_new_recipients_activity` | `CampaignDiscoveryWorkflow` |
| `enrich_creator_for_campaign_activity` | `EnrichForCampaignWorkflow` |
| `enrich_creator_activity` | `EnrichListWorkflow` |
| `get_trackable_creators_activity` | `PostTrackingWorkflow` |
| `process_creator_posts_activity` | `PostTrackingWorkflow` |
| `ingest_email_reply_examples_activity` | `IngestEmailReplyExamplesWorkflow` |
| `ingest_sent_reply_as_example_activity` | `ThreadProcessingCoordinatorWorkflow` |
| `post_slack_order_digest_activity` | `SlackOrderDigestWorkflow` |
| `get_campaigns_with_slack_channel_activity` | `SlackOrderDigestSchedulerWorkflow` |
| `report_to_rollbar` / `report_exception_to_rollbar` | Any workflow via `@report_workflow_errors` |
| `get_pending_drafts_for_campaign_activity` | `BulkDraftEditWorkflow` |
| `apply_edit_to_draft_activity` | `BulkDraftEditWorkflow` |
| `save_rule_to_campaign_activity` | `BulkDraftEditWorkflow` |
| `update_creator_latest_interaction_activity` | `ThreadProcessingCoordinatorWorkflow` |

---

## Activity Retry Policy Summary

| Activity Type | Typical Policy |
|--------------|---------------|
| DB read-only | `max_attempts=3`, `initial_interval=1s` |
| DB write (idempotent) | `max_attempts=3-5`, `initial_interval=1s`, exponential backoff |
| LLM generation | `max_attempts=1` (NO_RETRY) — failures should surface |
| Email send | `max_attempts=3`, `start_to_close=5-10min` |
| External API (Apify, Gmail) | `max_attempts=3`, `start_to_close=5-10min` |
| Google Sheets | `max_attempts=5`, backoff `5s→155s` (isolated task queue) |
| Enrichment | `max_attempts=1` (NO_RETRY) — waterfall handles own retries |
