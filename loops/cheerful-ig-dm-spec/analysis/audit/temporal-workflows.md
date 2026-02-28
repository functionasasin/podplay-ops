# Audit: Temporal Workflows

**Source**: `projects/cheerful/apps/backend/src/temporal/`
**Wave**: 1 — Codebase Audit
**Purpose**: Exact workflow names, activity signatures, input/output types, coordinator branching logic

---

## Task Queue Configuration

**File**: `src/temporal/config.py`

```python
TEMPORAL_TASK_QUEUE = "main"
TEMPORAL_GOOGLE_SHEETS_TASK_QUEUE = "google-sheets"
```

The main worker runs two `Worker` instances:
- `TEMPORAL_TASK_QUEUE = "main"` — all workflows + most activities (thread pool: 10 prod / 5 dev)
- `TEMPORAL_GOOGLE_SHEETS_TASK_QUEUE = "google-sheets"` — only `update_sheet_with_metrics_activity` (1 thread)

**File**: `src/temporal/worker.py`
Worker reads `__all__` from `src.temporal.workflow` and `src.temporal.activity` to auto-register everything.

---

## Worker Registration Pattern

Workflows and activities are registered via `__all__` in the module `__init__` files:

- `src/temporal/workflow/__init__.py` — `__all__` lists all workflow classes
- `src/temporal/activity/__init__.py` — `__all__` lists all activity functions

**To add new IG DM workflows/activities**: add imports + names to both `__init__.py` and `__all__`.

---

## Search Attributes

**File**: `src/temporal/search_attributes.py`

Defined search attribute keys (all `Keyword` type):

```python
USER_EMAIL_KEY = SearchAttributeKey.for_keyword("UserEmail")
GOOGLE_ACCOUNT_EMAIL_KEY = SearchAttributeKey.for_keyword("GoogleAccountEmail")
GOOGLE_ACCOUNT_EMAIL_LIST_KEY = SearchAttributeKey.for_keyword_list("GoogleAccountEmailList")
GMAIL_THREAD_ID_KEY = SearchAttributeKey.for_keyword("GmailThreadId")
GMAIL_THREAD_STATE_ID_KEY = SearchAttributeKey.for_keyword("GmailThreadStateId")
```

Helper function:
```python
def build_search_attributes_for_candidate(candidate: Candidate) -> TypedSearchAttributes
```
Sets `GMAIL_THREAD_ID_KEY`, `GMAIL_THREAD_STATE_ID_KEY`, optionally `USER_EMAIL_KEY` and `GOOGLE_ACCOUNT_EMAIL_KEY`.

**IG DM note**: New IG DM workflows will need new search attribute keys (`IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`) and a parallel `build_search_attributes_for_ig_dm_candidate()` helper.

---

## Core Temporal Model: `Candidate`

**File**: `src/models/temporal/gmail_thread_state.py`

```python
class Candidate(BaseModel):
    gmail_thread_id: str                          # Gmail thread ID or SMTP email_thread_id
    gmail_account_id: uuid.UUID | None = None     # Set for Gmail, None for SMTP
    smtp_account_id: uuid.UUID | None = None      # Set for SMTP, None for Gmail
    user_id: uuid.UUID
    state__id: uuid.UUID                          # Thread state row ID (Gmail or SMTP)
    state__latest_internal_date: datetime
    state__latest_gmail_message_id: uuid.UUID     # References gmail_message or smtp_message row
    latest_gmail_message__direction: GmailMessageDirection  # INBOUND | OUTBOUND
    user__email: str | None = None
    gmail_account__email: str | None = None
    force_reply: bool = False                     # Bypass campaign checks (user unhide)
    force_campaign_id: uuid.UUID | None = None    # Skip LLM association, use this campaign

class UpdateStateStatusParams(BaseModel):
    state__id: uuid.UUID
    status: GmailThreadStatus
    smtp_account_id: uuid.UUID | None = None      # Discriminator: None=Gmail, set=SMTP
```

**Key insight**: `Candidate` is the universal "thread processing ticket" — used by Gmail and SMTP alike. The `smtp_account_id is not None` check is the canonical discriminator throughout the coordinator. IG DM will need an analogous mechanism: either a new `ig_dm_account_id: uuid.UUID | None = None` field or a separate `IgDmCandidate` model.

---

## Workflow Inventory

### Registered Workflows (`workflow/__init__.py` `__all__`)

| Workflow Class | File | Purpose |
|---|---|---|
| `AllPollHistoryWorkflow` | `poll_history_workflow.py` | Gmail history poll loop (all accounts) |
| `ProcessAccountMessagesWorkflow` | `process_account_messages_workflow.py` | Gmail per-account message ingest |
| `ThreadSyncWorkflow` | `thread_sync_workflow.py` | Gmail batch state insert + spawn coordinator |
| `ThreadProcessingCoordinatorWorkflow` | `thread_processing_coordinator_workflow.py` | Core processing: Gmail + SMTP |
| `ThreadAssociateToCampaignWorkflow` | `thread_associate_to_campaign_workflow.py` | LLM campaign matching |
| `ThreadResponseDraftWorkflow` | `thread_response_draft_workflow.py` | LLM draft generation |
| `ThreadFollowUpDraftWorkflow` | `thread_follow_up_draft_workflow.py` | LLM follow-up draft |
| `TriggerThreadFollowUpDraftWorkflow` | `thread_follow_up_draft_workflow.py` | Cron trigger for follow-ups |
| `ThreadAttachmentExtractWorkflow` | `thread_attachment_extract_workflow.py` | Attachment text extraction |
| `ThreadExtractMetricsWorkflow` | `thread_metrics_workflow.py` | GSheets metrics export |
| `AllSmtpInboxSyncWorkflow` | `smtp_inbox_sync_workflow.py` | SMTP IMAP sync (all accounts) |
| `BatchSmtpInboxSyncWorkflow` | `smtp_inbox_sync_workflow.py` | SMTP IMAP sync (batch) |
| `SmtpThreadSyncWorkflow` | `smtp_thread_sync_workflow.py` | SMTP state insert + spawn coordinator |
| `BulkDraftEditWorkflow` | `bulk_draft_edit_workflow.py` | Bulk LLM draft editing |
| `ThreadResponseDraftWithCorrectionsWorkflow` | `thread_response_draft_with_corrections_workflow.py` | Draft with corrections |
| `EnrichForCampaignWorkflow` | `enrich_for_campaign_workflow.py` | Creator enrichment |
| `CampaignDiscoveryWorkflow` | `campaign_discovery_workflow.py` | Creator discovery |
| `CampaignDiscoverySchedulerWorkflow` | `campaign_discovery_scheduler_workflow.py` | Discovery scheduling |
| `SendCampaignOutboxWorkflow` | `campaign_outbox_workflow.py` | Campaign email outbox |
| `SendCampaignFollowUpsWorkflow` | `campaign_follow_up_send_workflow.py` | Campaign follow-up sends |
| `SendEmailDispatchesWorkflow` | `email_dispatch_workflow.py` | Email dispatch |
| `SendPostOptInFollowUpsWorkflow` | `post_opt_in_follow_up_send_workflow.py` | Post-opt-in follow-ups |
| `PostTrackingWorkflow` | `post_tracking_workflow.py` | Creator post tracking |
| `PostTrackingSchedulerWorkflow` | `post_tracking_workflow.py` | Post tracking scheduler |
| `SlackOrderDigestWorkflow` | `slack_order_digest_workflow.py` | Slack order digest |

---

## Gmail Ingest Pipeline (Detailed)

### `AllPollHistoryWorkflow`

**File**: `src/temporal/workflow/poll_history_workflow.py`
**Pattern**: Loops forever via `continue_as_new` (no Temporal Schedule)

```python
@workflow.defn
class AllPollHistoryWorkflow:
    @workflow.run
    @report_workflow_errors(report_exception_to_rollbar)
    async def run(self, params: AllPollHistoryParams) -> None: ...
```

**Input**: `AllPollHistoryParams` — `max_concurrent_accounts: int = 5`, `poll_interval_seconds: int = 30`
**Output**: None (loops forever via `continue_as_new`)

**Flow**:
1. `get_all_active_gmail_emails_activity` — list active Gmail accounts
2. `asyncio.Semaphore(params.max_concurrent_accounts)` — concurrency control
3. For each account: spawn `ProcessAccountMessagesWorkflow` (max 3 concurrent)
4. `workflow.sleep(poll_interval_seconds)` — wait between cycles
5. `workflow.continue_as_new(params)` — reset event history, loop

**Child workflow spawn**:
```python
await workflow.execute_child_workflow(
    ProcessAccountMessagesWorkflow.run,
    ProcessAccountParams(gmail_email=gmail_email),
    id=f"process-account-{sanitized_email}-{run_id[:8]}",
    retry_policy=RetryPolicy(maximum_attempts=3, ...),
    execution_timeout=timedelta(minutes=20),
    parent_close_policy=ParentClosePolicy.TERMINATE,
)
```

---

### `ProcessAccountMessagesWorkflow`

**File**: `src/temporal/workflow/process_account_messages_workflow.py`

```python
@workflow.defn
class ProcessAccountMessagesWorkflow:
    @workflow.run
    async def run(self, params: ProcessAccountParams) -> ProcessAccountResult: ...
```

**Input**: `ProcessAccountParams` — `gmail_email: str`
**Output**: `ProcessAccountResult` — `processed: int`, `failed: int`, `failed_message_ids: list[str]`

**Flow**:
1. `poll_history_activity(PollHistoryParams)` → `PollHistoryResult`
2. If no messages: `update_history_id_activity` + return
3. For each `message_id` (sequential): `ingest_single_message_activity(IngestSingleMessageParams)` with `activity_id=f"ingest-{message_id}"`
4. If ALL succeeded: `update_history_id_activity` (skipped if any failed)

**Key idempotency**: History ID update only on full success — partial failures replay entire batch from last checkpoint.

---

### `ThreadSyncWorkflow` (Gmail)

**File**: `src/temporal/workflow/thread_sync_workflow.py`

```python
@workflow.defn
class ThreadSyncWorkflow:
    @workflow.run
    @report_workflow_errors(report_exception_to_rollbar)
    async def run(self) -> None: ...
```

**Input**: None
**Output**: None

**Flow**:
1. `batch_insert_latest_state_and_get_candidates_activity(batch_size=200)` → `list[Candidate]`
2. For each candidate: `workflow.start_child_workflow(ThreadProcessingCoordinatorWorkflow.run, candidate, id=f"thread-processing-coordinator-{state__id}", id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY, parent_close_policy=ABANDON)`

---

## SMTP Ingest Pipeline (Detailed)

### `AllSmtpInboxSyncWorkflow`

**File**: `src/temporal/workflow/smtp_inbox_sync_workflow.py`

```python
@workflow.defn
class AllSmtpInboxSyncWorkflow:
    @workflow.run
    async def run(self, params: AllSmtpInboxSyncParams = AllSmtpInboxSyncParams()) -> AllSmtpInboxSyncResult: ...
```

**Input**: `AllSmtpInboxSyncParams` — `max_concurrent_batches: int = 3`, `max_batch_size: int = 2`
**Output**: `AllSmtpInboxSyncResult` — `status`, `total_accounts`, `successful_syncs`, `failed_syncs`

**Flow**:
1. `get_all_active_smtp_emails_activity()` → `list[str]`
2. Chunk emails into batches (size 2)
3. `asyncio.Semaphore(max_concurrent_batches)` — concurrency control
4. Spawn `BatchSmtpInboxSyncWorkflow` for each batch (fire+wait)

---

### `BatchSmtpInboxSyncWorkflow`

```python
@workflow.defn
class BatchSmtpInboxSyncWorkflow:
    @workflow.run
    async def run(self, params: BatchSmtpInboxSyncParams) -> BatchSmtpInboxSyncResult: ...
```

**Input**: `BatchSmtpInboxSyncParams` — `smtp_email_addresses: list[str]`

**Flow**:
1. For each email (sequential): `smtp_inbox_sync_activity(SmtpInboxSyncParams)` → `SmtpInboxSyncResult`
2. If `result.messages_inserted > 0`: spawn `SmtpThreadSyncWorkflow` (fire+forget, `parent_close_policy=ABANDON`)

---

### `SmtpThreadSyncWorkflow`

**File**: `src/temporal/workflow/smtp_thread_sync_workflow.py`

```python
@dataclass
class SmtpThreadSyncParams:
    smtp_account_id: uuid.UUID

@dataclass
class SmtpThreadSyncResult:
    candidates_processed: int
    workflows_spawned: int

@workflow.defn
class SmtpThreadSyncWorkflow:
    @workflow.run
    async def run(self, params: SmtpThreadSyncParams) -> SmtpThreadSyncResult: ...
```

**Note**: Uses `@dataclass`, not `BaseModel` (unlike most other params).

**Flow**:
1. `batch_insert_latest_smtp_state_and_get_candidates_activity(SmtpThreadStateSyncParams)` → `list[Candidate]`
2. For each candidate: `workflow.start_child_workflow(ThreadProcessingCoordinatorWorkflow.run, candidate, id=f"smtp-thread-process-{state__id}", id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY, parent_close_policy=ABANDON)`

---

## `ThreadProcessingCoordinatorWorkflow` — Full Branching Logic

**File**: `src/temporal/workflow/thread_processing_coordinator_workflow.py`
**This is the central dispatcher that all new IG DM processing will mirror or extend.**

```python
@workflow.defn
class ThreadProcessingCoordinatorWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate): ...
```

**Input**: `Candidate`
**Output**: None (implicit)

### Step-by-step flow

```
is_smtp = candidate.smtp_account_id is not None

if not is_smtp:
    # Step 1: Ensure complete thread (Gmail only)
    ensure_complete_thread_ingested_activity(EnsureCompleteThreadParams)
      timeout=5min, retry=3, activity_id=f"ensure-complete-thread-{state__id}"

    # Step 2: Attachment extraction (Gmail only)
    ThreadAttachmentExtractWorkflow (child)
      id=f"thread-attachment-extract-{state__id}", ALLOW_DUPLICATE

# Step 3: Transition to READY_FOR_CAMPAIGN_ASSOCIATION
update_state_status_activity(UpdateStateStatusParams(status=READY_FOR_CAMPAIGN_ASSOCIATION))
  activity_id=f"update-state-status-after-attachment-extract-{state__id}"

# Step 4: Campaign association
ThreadAssociateToCampaignWorkflow (child) → CampaignAssociationResult
  id=f"thread-associate-to-campaign-{state__id}", ALLOW_DUPLICATE
  → maybe_campaign__id, campaign_status

# Step 5: Creator interaction update (SMTP + campaign only)
if maybe_campaign__id is not None and is_smtp:
    update_creator_latest_interaction_activity(UpdateCreatorInteractionParams)

# Step 6: Campaign workflows (Gmail + campaign only)
if maybe_campaign__id is not None and not is_smtp:
    execute_campaign_workflows_activity(gmail_thread_id, campaign_id)
    extract_campaign_creator_activity(candidate) → creator_ids
    if creator_ids:
        generate_lookalikes_for_opt_in_activity(GenerateLookalikeParams)
    extract_thread_flags_activity(candidate)
    update_creator_latest_interaction_activity(UpdateCreatorInteractionParams)

# Step 7: Direction-based branching
if candidate.latest_gmail_message__direction == INBOUND:
    if has_campaign:
        cancel_follow_ups_on_reply_activity(gmail_thread_id)
        status = READY_FOR_RESPONSE_DRAFT
    else:
        status = IGNORE

    if has_campaign:
        check_if_campaign_should_extract_metrics_activity(candidate)
        if should_extract_metrics:
            ThreadExtractMetricsWorkflow (child)

    if campaign is completed:
        status = WAITING_FOR_INBOUND  # skip draft gen

    update_state_status_activity(status)

    if status == READY_FOR_RESPONSE_DRAFT:
        domain_behavior = check_domain_and_classify_activity(candidate)
        # → "opt_out" | "asked_questions" | "opt_in" | None

        if domain_behavior == "opt_out":
            ThreadResponseDraftWorkflow (child)
            send_gmail_draft_activity or auto_send_response_activity
            update_state_status_activity(DONE)
            return

        elif domain_behavior == "asked_questions":
            ThreadResponseDraftWorkflow (child)
            update_state_status_activity(WAITING_FOR_DRAFT_REVIEW)
            return

        elif domain_behavior == "opt_in":
            ThreadResponseDraftWorkflow (child)
            send_gmail_draft_activity or auto_send_response_activity
            update_state_status_activity(WAITING_FOR_INBOUND)
            return

        # domain_behavior is None → normal automation flow
        automation_level = get_campaign_automation_level_activity(gmail_thread_id)
        # → "fully-automated" | "semi-automated" | (implicit "manual")

        if automation_level == "fully-automated":
            should_auto_send = True
        elif automation_level == "semi-automated":
            classification = classify_thread_opt_in_activity(OptInClassificationParams)
            should_auto_send = classification.should_auto_send

        if should_auto_send:
            auto_send_response_activity(AutoSendParams)
            update_state_status_activity(WAITING_FOR_INBOUND)
        else:
            ThreadResponseDraftWorkflow (child)
            update_state_status_activity(WAITING_FOR_DRAFT_REVIEW)

elif candidate.latest_gmail_message__direction == OUTBOUND:
    if has_campaign:
        ingest_sent_reply_as_example_activity(candidate, campaign_id)  # RAG
        is_thread_done = check_if_thread_is_done_activity(candidate)
        if is_thread_done:
            status = DONE
        elif candidate.force_reply:
            status = READY_FOR_RESPONSE_DRAFT
        else:
            status = WAITING_FOR_INBOUND
    else:
        status = IGNORE

    if status == READY_FOR_RESPONSE_DRAFT:
        ThreadResponseDraftWorkflow (child)
        update_state_status_activity(WAITING_FOR_DRAFT_REVIEW)
    else:
        if status == WAITING_FOR_INBOUND:
            schedule_follow_up_activity(candidate)
        update_state_status_activity(status)

else:
    raise ValueError(f"Unknown direction: {candidate.latest_gmail_message__direction}")
```

### Key discriminator pattern

The coordinator checks `is_smtp = candidate.smtp_account_id is not None` at the top and uses this boolean to skip Gmail-specific steps (ensure_complete_thread, attachments, campaign workflows, creator extraction, flags). IG DM will add a third branch:

```python
# Current pattern:
is_smtp = candidate.smtp_account_id is not None
if not is_smtp:
    # Gmail-only steps

# Future pattern (IG DM):
is_smtp = candidate.smtp_account_id is not None
is_ig_dm = candidate.ig_dm_account_id is not None  # NEW
if not is_smtp and not is_ig_dm:
    # Gmail-only steps
```

---

## `ThreadResponseDraftWorkflow`

**File**: `src/temporal/workflow/thread_response_draft_workflow.py`

```python
@workflow.defn
class ThreadResponseDraftWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> ThreadResponseDraftResult: ...
```

**Input**: `Candidate`
**Output**: `ThreadResponseDraftResult` — `status: GmailThreadStatus`, `gmail_draft_id: str | None`

**Flow**:
1. `check_is_latest_for_thread_state_activity(candidate)` — guard against stale state
2. If not `force_reply`: `maybe_get_draft_by_thread_state_id_activity(candidate)` — return existing draft if found
3. Dispatch draft activity:
   - SMTP: `generate_draft_using_llm_activity` (no RAG)
   - Gmail: `generate_draft_with_rag_activity`
4. `upload_llm_draft_to_gmail_activity(UploadLlmDraftToGmailParams)` → `gmail_draft_id: str`
5. `write_llm_draft_to_db_activity(WriteLlmDraftToDbParams)`

**IG DM note**: Step 4 (`upload_llm_draft_to_gmail_activity`) is Gmail-specific. IG DM replaces it with `ig_dm_save_draft_to_db_activity` (no upload; drafts stored in `ig_dm_llm_draft` table only).

---

## `ThreadAssociateToCampaignWorkflow`

**File**: `src/temporal/workflow/thread_associate_to_campaign_workflow.py`

```python
@workflow.defn
class ThreadAssociateToCampaignWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> CampaignAssociationResult: ...
```

**Input**: `Candidate`
**Output**: `CampaignAssociationResult` — `campaign_id: uuid.UUID | None`, `campaign_status: str | None`

**Flow**:
1. If `force_campaign_id`: write directly + return `ACTIVE`
2. `maybe_find_campaign_by_thread_id_activity(candidate)` — check existing association
3. `handle_thread_no_campaign_activity(candidate)` — LLM association (if no existing)
4. `write_campaign_thread_to_db_activity(WriteCampaignThreadToDbParams)` — persist

---

## Key Activities (Relevant to IG DM Design)

### Gmail State Activities (`src/temporal/activity/gmail_thread_state.py`)

```python
@activity.defn
def update_state_status_activity(params: UpdateStateStatusParams) -> None:
    # Dispatches to SmtpThreadStateRepository if smtp_account_id set, else GmailThreadStateRepository

@activity.defn
def check_is_latest_for_thread_state_activity(candidate: Candidate) -> bool:
    # Dispatches to SMTP or Gmail repo based on smtp_account_id

@activity.defn
def batch_insert_latest_state_and_get_candidates_activity(batch_size: int = 200) -> list[Candidate]:
    # Gmail only - SMTP has its own activity

@activity.defn
def batch_get_follow_up_candidates_activity(batch_size: int = 50) -> list[Candidate]:
    # Gmail only
```

### Draft State Activities (`src/temporal/activity/gmail_thread_llm_draft.py`)

```python
@activity.defn
def maybe_get_draft_by_thread_state_id_activity(candidate: Candidate) -> uuid.UUID | None:
    # Dispatches to smtp or gmail repo

@activity.defn
def maybe_get_draft_by_thread_id_activity(candidate: Candidate) -> uuid.UUID | None:
    # Thread-level check, dispatches based on smtp_account_id

@activity.defn
def get_gmail_draft_id_for_state_activity(candidate: Candidate) -> str | None:
    # Returns gmail_draft_id (external ID); Gmail-only concept

@activity.defn
def maybe_get_draft_by_gmail_thread_state_id_activity(gmail_thread_state_id: uuid.UUID) -> uuid.UUID | None:
    # Gmail-specific (state_id lookup)

@activity.defn
def maybe_get_draft_by_gmail_thread_id_activity(gmail_thread_id: str, gmail_account_id: uuid.UUID) -> uuid.UUID | None:
    # Gmail-specific (thread-level)
```

### Ingest Activities

```python
# Gmail: src/temporal/activity/ingest_single_message_activity.py
@activity.defn
def ingest_single_message_activity(params: IngestSingleMessageParams) -> IngestSingleMessageResult:
    # IngestSingleMessageParams: gmail_email_address, message_id, user_gmail_account_id
    # IngestSingleMessageResult: status ("inserted"|"skipped"), reason, gmail_message_id

# SMTP: src/temporal/activity/smtp_inbox_sync_activity.py
@activity.defn
def smtp_inbox_sync_activity(params: SmtpInboxSyncParams) -> SmtpInboxSyncResult:
    # Full IMAP sync via UID-based incremental fetch

@activity.defn
def get_all_active_smtp_emails_activity() -> list[str]:

# SMTP state: src/temporal/activity/smtp_thread_state_sync_activity.py
@activity.defn
def batch_insert_latest_smtp_state_and_get_candidates_activity(
    params: SmtpThreadStateSyncParams,   # smtp_account_id: uuid.UUID
) -> list[Candidate]:
```

### Gmail History Activities (`src/temporal/activity/poll_history_activity.py`)

```python
@activity.defn
def get_all_active_gmail_emails_activity() -> list[str]:

@activity.defn
def poll_history_activity(params: PollHistoryParams) -> PollHistoryResult:
    # PollHistoryParams: gmail_email_address: str
    # PollHistoryResult: status, gmail_email_address, gmail_history_id, message_ids, user_gmail_account_id
```

---

## Activity Registration (`activity/__init__.py` `__all__`)

Full list of registered activities (50 total):

```
get_pending_drafts_for_campaign_activity
apply_edit_to_draft_activity
save_rule_to_campaign_activity
poll_history_activity
get_all_active_gmail_emails_activity
get_all_active_smtp_emails_activity
smtp_inbox_sync_activity
batch_insert_latest_smtp_state_and_get_candidates_activity
handle_thread_no_campaign_activity
check_if_thread_is_done_activity
write_campaign_thread_to_db_activity
generate_draft_using_llm_activity
upload_llm_draft_to_gmail_activity
write_llm_draft_to_db_activity
update_state_status_activity
fetch_attachments_to_extract_activity
extract_attachment_activity
maybe_write_llm_extracted_content_to_db_activity
check_if_campaign_should_extract_metrics_activity
extract_metrics_from_thread_using_llm_activity
update_sheet_with_metrics_activity
schedule_follow_up_activity
generate_follow_up_draft_using_llm_activity
mark_schedule_as_drafted_activity
check_is_latest_for_gmail_thread_id_activity
check_is_latest_for_thread_state_activity
batch_get_follow_up_candidates_activity
batch_insert_latest_state_and_get_candidates_activity
maybe_find_campaign_by_gmail_thread_id
maybe_find_campaign_by_thread_id_activity
maybe_get_draft_by_gmail_thread_id_activity
maybe_get_draft_by_gmail_thread_state_id_activity
maybe_get_draft_by_thread_id_activity
maybe_get_draft_by_thread_state_id_activity
get_gmail_draft_id_for_state_activity
auto_send_response_activity
check_if_campaign_is_fully_automated_activity
get_campaign_automation_level_activity
send_gmail_draft_activity
classify_thread_opt_in_activity
send_campaign_outbox_activity
send_campaign_follow_ups_activity
send_email_dispatches_activity
cancel_follow_ups_on_reply_activity
check_domain_and_classify_activity
execute_campaign_workflows_activity
report_exception_to_rollbar
report_to_rollbar
ensure_complete_thread_ingested_activity
extract_campaign_creator_activity
extract_thread_flags_activity
generate_lookalikes_for_opt_in_activity
generate_draft_with_corrections_activity
generate_draft_with_rag_activity
ingest_sent_reply_as_example_activity
ingest_email_reply_examples_activity
update_creator_latest_interaction_activity
update_history_id_activity
ingest_single_message_activity
get_trackable_creators_activity
process_creator_posts_activity
enrich_creator_for_campaign_activity
enrich_creator_activity
discover_creators_for_campaign_activity
populate_outbox_for_new_recipients_activity
get_campaigns_needing_discovery_activity
post_slack_order_digest_activity
get_campaigns_with_slack_channel_activity
send_post_opt_in_follow_ups_activity
```

---

## IG DM Integration Points

### New workflows needed (file paths):

| Workflow | File | Purpose |
|---|---|---|
| `IgDmIngestWorkflow` | `workflow/ig_dm_ingest_workflow.py` | Webhook → store message → spawn coordinator |
| `IgDmSendReplyWorkflow` | `workflow/ig_dm_send_reply_workflow.py` | 24h check → Meta send → state update |
| `IgDmReconciliationWorkflow` | `workflow/ig_dm_reconciliation_workflow.py` | Cron-based Graph API polling for recovery |
| `IgDmInitialSyncWorkflow` | `workflow/ig_dm_initial_sync_workflow.py` | One-time history import on account connect |
| `IgDmTokenRefreshWorkflow` | `workflow/ig_dm_token_refresh_workflow.py` | 60-day token refresh cron |

### New activities needed (file paths):

| Activity | File | Purpose |
|---|---|---|
| `ig_dm_ingest_activity` | `activity/ig_dm_ingest_activity.py` | Store `ig_dm_message`, upsert `ig_dm_thread_state` |
| `ig_dm_thread_state_activity` | `activity/ig_dm_thread_state_activity.py` | State transition logic (mirrors `gmail_thread_state.py`) |
| `ig_igsid_resolution_activity` | `activity/ig_igsid_resolution_activity.py` | IGSID→username via Graph API + cache |
| `ig_dm_send_reply_activity` | `activity/ig_dm_send_reply_activity.py` | Meta `POST /{ig_user_id}/messages` |
| `ig_dm_media_download_activity` | `activity/ig_dm_media_download_activity.py` | Download ephemeral URL → Supabase Storage |
| `ig_dm_draft_activity` | `activity/ig_dm_draft_activity.py` | Write draft to `ig_dm_llm_draft` (no Gmail upload) |
| `ig_dm_get_all_active_accounts_activity` | `activity/ig_dm_ingest_activity.py` | List active `user_ig_dm_account` rows |

### Coordinator modification:

**File**: `src/temporal/workflow/thread_processing_coordinator_workflow.py`

Add `is_ig_dm = candidate.ig_dm_account_id is not None` at line ~102 (after `is_smtp` check). Insert new `elif is_ig_dm:` branch at the top of the direction-based if/elif block (line ~291), or add a pre-check that short-circuits to `IgDmProcessingWorkflow`.

Simplest integration: treat IG DM as a third "channel" in the coordinator by extending `Candidate` with `ig_dm_account_id: uuid.UUID | None = None`. The coordinator checks `is_ig_dm` and routes to IG DM-specific activities where Gmail/SMTP differ (no ensure_complete_thread, no attachments, no gmail_draft upload, custom send path, 24h window check).

### `update_state_status_activity` extension:

Current `UpdateStateStatusParams.smtp_account_id` is the SMTP discriminator. For IG DM, add `ig_dm_account_id: uuid.UUID | None = None` to `UpdateStateStatusParams`, and extend `update_state_status_activity` to dispatch to `IgDmThreadStateRepository` when set.

---

## Files

- Audited: `src/temporal/workflow/` (all `.py` files)
- Audited: `src/temporal/activity/` (key files: `gmail_thread_state.py`, `ingest_single_message_activity.py`, `smtp_inbox_sync_activity.py`, `smtp_thread_state_sync_activity.py`, `poll_history_activity.py`, `gmail_thread_llm_draft.py`)
- Audited: `src/temporal/config.py`, `src/temporal/worker.py`, `src/temporal/search_attributes.py`
- Audited: `src/models/temporal/gmail_thread_state.py`, `src/models/temporal/poll_history.py`, `src/models/temporal/smtp_inbox_sync.py`
