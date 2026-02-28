# Current Email Pipeline Analysis

**Aspect:** `current-email-pipeline`
**Wave:** 2 — Internal Landscape
**Goal:** Document the inbound email processing pipeline end-to-end and identify which stages are email-specific vs channel-agnostic.

---

## Summary

Cheerful runs two parallel inbound email pipelines — one for Gmail (OAuth + History API) and one for SMTP/IMAP (credential-based polling). Both converge on a single shared `ThreadProcessingCoordinatorWorkflow` that handles campaign association, AI drafting, and follow-up logic. A `Candidate` abstraction object bridges both channels into the coordinator.

This dual-path pattern is the key reference architecture for adding a third channel (Instagram DMs): the DM pipeline would add a third ingest path that emits `Candidate` objects and reuses the coordinator.

---

## Pipeline 1: Gmail Inbound

### Architecture Overview

```
AllPollHistoryWorkflow (perpetual loop)
  └─ ProcessAccountMessagesWorkflow (per Gmail account)
      ├─ poll_history_activity           # Fetch new message IDs from Gmail
      ├─ ingest_single_message_activity  # Fetch + parse each message (×N)
      ├─ update_history_id_activity      # Advance checkpoint on success
      └─ ThreadSyncWorkflow (fire-and-forget)
          └─ batch_insert_latest_state_and_get_candidates_activity
          └─ ThreadProcessingCoordinatorWorkflow (fire-and-forget, ×N)
```

### Stage-by-Stage Breakdown

#### Stage 1: Perpetual Poll Loop

**Workflow:** `AllPollHistoryWorkflow`
**File:** `apps/backend/src/temporal/workflow/poll_history_workflow.py`

- Runs continuously via `continue_as_new` pattern
- Polls up to 3 Gmail accounts in parallel (configurable)
- Self-healing: restarts automatically after each cycle

#### Stage 2: Fetch New Message IDs

**Activity:** `poll_history_activity`
**File:** `apps/backend/src/temporal/activity/poll_history_activity.py`

- Calls Gmail History API: `GET /gmail/v1/users/me/history?startHistoryId={last_id}`
- Returns only message IDs (no content)
- Handles 404 (history expired) by resetting checkpoint for full resync
- Uses sync lock to prevent concurrent polling of the same account
- Timeout: 5 min | Retries: 3 (exponential backoff)

**Gmail-specific:** Uses `gmail_email_address` + OAuth access token. Gmail History API is proprietary.

#### Stage 3: Fetch + Parse Each Message (Sequentially)

**Activity:** `ingest_single_message_activity`
**File:** `apps/backend/src/temporal/activity/ingest_single_message_activity.py`

For each message ID:
1. Fetch raw RFC 2822 message via Gmail API (`format="raw"`)
2. Parse message:
   - Direction: INBOUND or OUTBOUND (From header vs. account aliases)
   - Threading: Message-ID, In-Reply-To, References headers
   - Metadata: From, To, Cc, Bcc, Subject, internal date
   - Body: text + HTML
   - Attachments: stored separately
3. `INSERT INTO gmail_message ... ON CONFLICT DO NOTHING` (idempotent)
4. Upload raw RFC 2822 to Supabase storage
5. Skip drafts and messages with no sender

**Activity ID:** `ingest-{gmail_message_id}` — ensures exactly-once deduplication via Temporal

**Gmail-specific:** Gmail message IDs, OAuth, `GmailMessage` table, Gmail attachment handling, RFC 2822 over Gmail API.

#### Stage 4: Advance Checkpoint

**Activity:** `update_history_id_activity`

- Updates `user_gmail_account.last_poll_history_id`
- Only called if ALL message ingestions succeeded
- If any fail: checkpoint stays at previous position, same messages re-fetched next cycle (idempotent)

**Gmail-specific:** `last_poll_history_id` column on `user_gmail_account`.

#### Stage 5: Create Thread State Records

**Activity:** `batch_insert_latest_state_and_get_candidates_activity`
**File:** `apps/backend/src/temporal/activity/gmail_thread_state.py`

- Queries `gmail_message` for messages without a corresponding `gmail_thread_state`
- `INSERT INTO gmail_thread_state` (event-sourced: new row per state change)
- Initial status: `READY_FOR_CAMPAIGN_ASSOCIATION`
- Returns `Candidate` objects for downstream processing

**Table:** `gmail_thread_state`
- Unique constraint: `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date)`
- Status enum: `GmailThreadStatus` (confusingly named, also reused for SMTP)
- Event-sourced: each state transition = new row, latest = max `latest_internal_date`

**Gmail-specific:** `gmail_thread_id` (Gmail thread ID format), `GmailThreadState` table.

---

## Pipeline 2: SMTP/IMAP Inbound

### Architecture Overview

```
AllSmtpInboxSyncWorkflow (perpetual loop)
  └─ BatchSmtpInboxSyncWorkflow (per batch of accounts)
      └─ smtp_inbox_sync_activity (per account, ×N)
      └─ SmtpThreadSyncWorkflow (fire-and-forget, per account)
          └─ batch_insert_latest_smtp_state_and_get_candidates_activity
          └─ ThreadProcessingCoordinatorWorkflow (fire-and-forget, ×N)
```

### Stage-by-Stage Breakdown

#### Stage 1: Perpetual Poll Loop + Batching

**Workflow:** `AllSmtpInboxSyncWorkflow` → `BatchSmtpInboxSyncWorkflow`
**File:** `apps/backend/src/temporal/workflow/smtp_inbox_sync_workflow.py`

- Self-perpetuating via `continue_as_new`
- Processes accounts in configurable batches to prevent IMAP connection saturation

#### Stage 2: IMAP Connection + Incremental Sync

**Activity:** `smtp_inbox_sync_activity`
**File:** `apps/backend/src/temporal/activity/smtp_inbox_sync_activity.py`

1. Connect to IMAP server (SSL or STARTTLS)
2. Select INBOX folder
3. Check UIDVALIDITY (detects mailbox rebuild)
   - If unchanged: incremental fetch via `UID SEARCH UID {last_uid}:*`
   - If changed: full resync (last 24 hours only)
   - If first sync: fetch last 24 hours
4. For each UID: FETCH RFC822 raw message
5. Parse RFC 2822:
   - Thread ID: derived from References/In-Reply-To chain (first message in chain = root)
   - Direction: INBOUND/OUTBOUND (From vs. account email)
   - Metadata: From, To, Cc, Subject, Date, body text/HTML
6. `INSERT INTO smtp_message ... ON CONFLICT (smtp_account_id, message_id_header) DO NOTHING`
7. Update sync checkpoint: `last_sync_uid`, `last_sync_uidvalidity`, `last_sync_timestamp`
8. Timeout: 5 min | Retries: 3

**SMTP-specific:** IMAP connection, UID-based incremental sync, UIDVALIDITY tracking, `smtp_message` table, credential-based auth.

**Structurally identical** to Gmail pipeline at the data level: both extract direction, thread ID, body, metadata and store in a channel-specific message table.

#### Stage 3: Create Thread State Records

**Activity:** `batch_insert_latest_smtp_state_and_get_candidates_activity`
**File:** `apps/backend/src/temporal/activity/smtp_thread_state_sync_activity.py`

- Mirrors Gmail thread state creation
- `INSERT INTO smtp_thread_state`
- Returns `Candidate` objects

**Table:** `smtp_thread_state`
- Unique constraint: `(user_id, smtp_account_id, email_thread_id, latest_internal_date)`
- Reuses `GmailThreadStatus` enum (same state machine)
- Event-sourced: same pattern as Gmail

**SMTP-specific:** `email_thread_id` (RFC 2822 Message-ID chain), `SmtpThreadState` table.

---

## Convergence Point: The Candidate Object

Both pipelines emit a `Candidate` object that bridges channel-specific data into the shared coordinator:

```python
class Candidate:
    state__id: UUID                                    # GmailThreadState or SmtpThreadState ID

    # Channel discriminators (one is set, other is None)
    gmail_thread_id: str | None                        # Gmail: Gmail thread ID
    email_thread_id: str | None                        # SMTP: RFC 2822 Message-ID chain root

    gmail_account_id: UUID | None                      # Set for Gmail
    smtp_account_id: UUID | None                       # Set for SMTP

    # Shared metadata
    user_id: UUID
    campaign_id: UUID | None                           # Pre-assigned or None
    latest_gmail_message__direction: GmailMessageDirection  # INBOUND or OUTBOUND
    force_campaign_id: UUID | None                     # Override from API
    force_reply: bool                                  # Force draft generation
```

The discriminator pattern (`gmail_account_id is not None` vs `smtp_account_id is not None`) routes to channel-specific branches within `ThreadProcessingCoordinatorWorkflow`.

---

## Shared Coordinator: ThreadProcessingCoordinatorWorkflow

**File:** `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py`

This workflow handles both Gmail and SMTP threads with internal branching. It is the integration point where adding a new channel (Instagram DMs) would require the most careful design.

### Full Activity Sequence (Inbound Path)

```
1. ensure_complete_thread_ingested         [Gmail ONLY: fetches all thread messages]
2. ThreadAssociateToCampaignWorkflow       [SHARED: LLM campaign matching]
3. ThreadAttachmentExtractWorkflow         [Gmail ONLY: attachment extraction]
4. execute_campaign_workflows              [SHARED: gifting, opt-in/out triggers]
5. check_domain_and_classify              [SHARED: domain logic, auto-reply detection]
6. ThreadResponseDraftWorkflow            [SHARED: AI draft generation]
7. ThreadExtractMetricsWorkflow           [SHARED: optional metrics]
```

### State Machine (Shared)

```
READY_FOR_CAMPAIGN_ASSOCIATION
  ↓ (after campaign matched or orphaned)
READY_FOR_RESPONSE_DRAFT               (INBOUND only)
  ↓
WAITING_FOR_DRAFT_REVIEW               (if not auto-send)
  ↓
WAITING_FOR_INBOUND                    (after outbound sent)
  ↓
DONE | IGNORE | NOT_LATEST             (terminal)
```

Note: `GmailThreadStatus` enum is used for both channels — a naming artifact.

---

## Email-Specific vs Channel-Agnostic Breakdown

### Email-Specific (Gmail)

| Component | File | Why Gmail-specific |
|-----------|------|--------------------|
| `poll_history_activity` | `temporal/activity/poll_history_activity.py` | Gmail History API, OAuth |
| `ingest_single_message_activity` | `temporal/activity/ingest_single_message_activity.py` | Gmail message format, GmailMessage table |
| `batch_insert_latest_state_and_get_candidates_activity` | `temporal/activity/gmail_thread_state.py` | GmailThreadState table |
| `update_history_id_activity` | same | Gmail history ID checkpoint |
| `ensure_complete_thread_ingested` | coordinator | Gmail thread completeness check |
| `ThreadAttachmentExtractWorkflow` | workflows/ | Gmail attachment API |
| `GmailService` | `services/external/gmail.py` | Gmail API client |
| `GmailMessage`, `GmailThreadState` | models/ | Gmail-specific tables |
| `GmailThreadLlmDraft` | models/ | Gmail draft model |

### Email-Specific (SMTP)

| Component | File | Why SMTP-specific |
|-----------|------|--------------------|
| `smtp_inbox_sync_activity` | `temporal/activity/smtp_inbox_sync_activity.py` | IMAP protocol, UID tracking |
| `batch_insert_latest_smtp_state_and_get_candidates_activity` | `temporal/activity/smtp_thread_state_sync_activity.py` | SmtpThreadState table |
| `SmtpEmailService` | `services/external/smtp_email.py` | IMAP/SMTP client |
| `SmtpMessage`, `SmtpThreadState` | models/ | SMTP-specific tables |
| `AllSmtpInboxSyncWorkflow`, `BatchSmtpInboxSyncWorkflow` | workflows/ | SMTP polling orchestration |
| `SmtpThreadSyncWorkflow` | workflows/ | SMTP thread state creation |
| UIDVALIDITY tracking | `user_smtp_account` table | IMAP-specific sync state |

### Channel-Agnostic (Shared)

| Component | File | Channels Served |
|-----------|------|----------------|
| `ThreadProcessingCoordinatorWorkflow` | workflows/ | Gmail + SMTP (via Candidate) |
| `ThreadAssociateToCampaignWorkflow` | workflows/ | Gmail + SMTP |
| `ThreadResponseDraftWorkflow` | workflows/ | Gmail + SMTP |
| `ThreadExtractMetricsWorkflow` | workflows/ | Gmail + SMTP |
| `execute_campaign_workflows` | activity | Gmail + SMTP |
| `check_domain_and_classify` | activity | Gmail + SMTP |
| `GmailThreadStatus` enum | models | Gmail + SMTP (misnamed) |
| `GmailMessageDirection` enum | models | Gmail + SMTP (misnamed) |
| `Candidate` object | models | Gmail + SMTP |
| `campaign_thread` table | schema | Gmail + SMTP |
| `ThreadAssociateToCampaignWorkflow` | workflows/ | Gmail + SMTP |

---

## Abstraction Boundaries for a Third Channel

A third channel (Instagram DMs) would need to implement these "pluggable" stages:

### Stage A: Account Registration (Channel-specific)
- Store Instagram account credentials/access token in a new `user_ig_account` table
- Configure webhook subscription for this account

### Stage B: Message Ingestion (Channel-specific)
- New Temporal activity: `ig_dm_ingest_activity`
- Input: webhook payload or polled API response
- Output: `INSERT INTO ig_dm_message` (new table)
- Must extract: thread ID, direction (INBOUND/OUTBOUND), sender, body, timestamp

### Stage C: Thread State Creation (Channel-specific)
- New activity: `batch_insert_latest_ig_dm_state_and_get_candidates_activity`
- Output: `Candidate` objects with `ig_dm_account_id` set, `gmail_account_id=None`, `smtp_account_id=None`
- Inserts into new `ig_dm_thread_state` table

### Stage D: Coordinator Integration (Shared, minimal changes)
- `ThreadProcessingCoordinatorWorkflow` needs new discriminator branch:
  `elif candidate.ig_dm_account_id is not None: # IG DM path`
- Skip Gmail-specific steps: `ensure_complete_thread_ingested`, `ThreadAttachmentExtractWorkflow`
- Skip SMTP-specific IMAP artifact handling

### Stage E: Draft Sending (Channel-specific, new)
- Email channels have `ThreadSendDraftWorkflow` that calls Gmail API or SMTP
- For IG DMs: new `IgDmSendReplyWorkflow` that calls Instagram Messaging API
- Requires access token, `to` recipient (Instagram user ID), `reply_to_message_id`

### Key Adaptation Points in `ThreadResponseDraftWorkflow`
- Subject line: not applicable (DMs have no subject)
- Format: shorter, conversational (DM style vs. email style)
- Draft storage: new table or new `draft_type` column on existing table
- RAG context: if using RAG, need DM-style example threads (not email examples)

---

## Critical Insights for Instagram DM Integration

### 1. The Ingest Path is the Main Work

The coordinator and downstream workflows are already mostly channel-agnostic. The majority of new code lives in the ingest layer:
- Webhook receiver (FastAPI endpoint)
- `ig_dm_ingest_activity` (parse Meta webhook payload → store to DB)
- Thread state creation activity
- New DB tables (`ig_dm_account`, `ig_dm_message`, `ig_dm_thread_state`)

### 2. Polling vs. Webhooks: A Key Decision Point

| | Gmail | SMTP | Instagram DM (Messaging API) |
|---|---|---|---|
| Ingest method | Polling (History API) | Polling (IMAP) | **Webhook-first** (required) |
| Checkpoint | `last_poll_history_id` | IMAP UID | N/A — event-driven |
| Missed delivery | Re-fetch window | UIDVALIDITY resync | Re-query `/conversations` |

Instagram Messaging API is **fundamentally event-driven** (webhooks). This is architecturally different from Gmail/SMTP polling. The Temporal loop structure changes:
- No perpetual polling workflow needed (replaced by webhook handler)
- Instead: webhook → FastAPI endpoint → `start_workflow` call → ingestion
- Need a fallback reconciliation loop (in case webhooks are missed)

### 3. Idempotency Must Be Preserved

The existing pipeline's `ON CONFLICT DO NOTHING` pattern must be replicated:
- Instagram message IDs: `message_id` field from Meta webhook payload (stable, unique per message)
- Thread ID: Instagram's `thread_id` field in conversation object

### 4. The 24-Hour Messaging Window Has No Email Parallel

Instagram's 24-hour window (cannot send unsolicited messages after 24 hours of creator inactivity) has no equivalent in email. The `ThreadProcessingCoordinatorWorkflow` would need awareness of this constraint when deciding whether to generate a draft. Current email logic has no time-window constraints on sending.

### 5. Creator Identity Resolution is a Dependency

The current pipeline does not automatically cross-reference message senders with creator profiles for email (matching is campaign-based). For DMs, the sender is an Instagram user ID — a new `creator_ig_handle` → `creator` resolution step would be needed (see `current-creator-identity` aspect for full analysis).

### 6. AI Draft Context Changes

`ThreadResponseDraftWorkflow` uses RAG for Gmail (finding similar threads as examples). For DMs:
- No subject line prompt component
- Different tone/length requirements (conversational, mobile-native)
- Different RAG corpus (DM examples, not email examples)
- Media handling: DM replies can include images, but initial MVP likely text-only

---

## Key File Reference

| Purpose | File |
|---------|------|
| Gmail polling orchestration | `temporal/workflow/poll_history_workflow.py` |
| Gmail message ingestion | `temporal/activity/ingest_single_message_activity.py` |
| Gmail thread state | `temporal/activity/gmail_thread_state.py` |
| SMTP polling orchestration | `temporal/workflow/smtp_inbox_sync_workflow.py` |
| SMTP message ingestion | `temporal/activity/smtp_inbox_sync_activity.py` |
| SMTP thread state | `temporal/activity/smtp_thread_state_sync_activity.py` |
| Shared coordinator | `temporal/workflow/thread_processing_coordinator_workflow.py` |
| Campaign association | `temporal/workflow/thread_associate_to_campaign_workflow.py` |
| Draft generation | `temporal/workflow/thread_response_draft_workflow.py` |
| Gmail API client | `services/external/gmail.py` |
| SMTP/IMAP client | `services/external/smtp_email.py` |
| Worker config | `temporal/worker.py` |
| Gmail DB models | `models/database/gmail_message.py`, `gmail_thread_state.py` |
| SMTP DB models | `models/database/smtp_message.py`, `smtp_thread_state.py` |
