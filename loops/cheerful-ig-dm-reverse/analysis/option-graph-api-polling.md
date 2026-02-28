# Option: Graph API Polling

**Aspect**: `option-graph-api-polling`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**References**:
- Wave 1: `meta-graph-api-conversations.md`, `meta-instagram-messaging-api.md`, `meta-webhooks-realtime.md`
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`, `current-inbox-ui.md`, `current-ai-drafting.md`

---

## Overview

This option uses the Instagram Graph API `/conversations` endpoint as a **polling-based ingestion path**, mirroring how Cheerful already ingests email (Gmail History API polling + IMAP UID-based polling). Rather than waiting for Meta to push events via webhooks, Cheerful would periodically query for new or updated DM conversations.

**Core premise**: Treat Instagram DM ingest as a third polling loop, structurally analogous to `AllPollHistoryWorkflow` (Gmail) or `AllSmtpInboxSyncWorkflow` (SMTP). A perpetual Temporal workflow polls the Graph API on a configurable interval, detects new conversations and messages, and inserts them into channel-specific tables before passing `Candidate` objects to the shared `ThreadProcessingCoordinatorWorkflow`.

**Important framing**: The Wave 1 analysis (`meta-graph-api-conversations.md`) established that Meta explicitly recommends against polling as a primary ingestion strategy. This document:
1. Designs the polling approach in full to provide a complete option for comparison
2. Identifies the specific scenarios where polling remains viable
3. Documents where it breaks down and why
4. Describes a **hybrid architecture** (webhooks primary + polling as recovery/backfill) which is likely the most useful framing for this endpoint

**Three sub-variants are analyzed**:
- **Variant A**: Pure polling as primary ingest (webhooks never set up)
- **Variant B**: Polling as recovery/backfill supplementing webhooks (hybrid)
- **Variant C**: Polling for initial account sync only (one-time per account connection)

---

## Variant A: Pure Polling as Primary Ingest

### When This Might Be Viable

| Scenario | Verdict |
|----------|---------|
| MVP / prototype with 1–3 accounts | Marginal — works technically, poor latency |
| Pre-App Review testing in Dev mode | Possibly useful — no webhook setup needed |
| Small-scale internal deployment | Viable with long intervals (5–10 min) |
| Production with 10+ accounts | Not viable — rate limits exceeded |
| Production with real-time expectations | Not viable — minutes of latency |

### Architecture

```
AllIgDmPollWorkflow (perpetual loop, Temporal)
  └─ BatchIgDmPollWorkflow (per batch of IG accounts)
      └─ ig_dm_poll_activity (per account, ×N)
          ├─ GET /{page-id}/conversations?platform=instagram
          │   &since={last_poll_timestamp}
          │   &access_token={page_access_token}
          ├─ For each conversation with updated_time > last_poll:
          │   └─ GET /{conversation-id}/messages
          │       ?fields=id,created_time,from,to,message,attachments
          ├─ INSERT INTO ig_dm_message ON CONFLICT DO NOTHING
          └─ UPDATE user_ig_dm_account SET last_poll_timestamp
  └─ IgDmThreadSyncWorkflow (fire-and-forget, per account)
      └─ batch_insert_latest_ig_dm_state_and_get_candidates_activity
      └─ ThreadProcessingCoordinatorWorkflow (fire-and-forget, ×N)
```

### Temporal Workflow Design

**Perpetual outer loop** — mirrors `AllPollHistoryWorkflow` pattern:

```python
# AllIgDmPollWorkflow (conceptual)
@workflow.defn
class AllIgDmPollWorkflow:
    @workflow.run
    async def run(self) -> None:
        while True:
            accounts = await workflow.execute_activity(
                get_active_ig_dm_accounts_activity,
                schedule_to_close_timeout=timedelta(minutes=1),
            )
            # Process in batches to avoid overwhelming Graph API
            for batch in chunks(accounts, size=5):
                await workflow.execute_child_workflow(
                    BatchIgDmPollWorkflow,
                    args=[batch],
                    execution_timeout=timedelta(minutes=10),
                )
            # Wait between poll cycles (configurable — see rate limit analysis)
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
        # Never exits — self-perpetuating via continue_as_new
        workflow.continue_as_new()
```

**Per-account poll activity**:

```python
# ig_dm_poll_activity (conceptual)
async def ig_dm_poll_activity(account_id: UUID) -> list[IgDmCandidate]:
    account = await get_ig_dm_account(account_id)

    # Step 1: List conversations updated since last poll
    response = await graph_api.get(
        f"/{account.page_id}/conversations",
        params={
            "platform": "instagram",
            "fields": "id,updated_time",
            "access_token": account.page_access_token,
            # No native "since" filter — must filter client-side by updated_time
        }
    )

    # Step 2: Filter to changed conversations
    changed = [
        c for c in response["data"]
        if c["updated_time"] > account.last_poll_timestamp
    ]

    # Step 3: For each changed conversation, fetch messages
    new_messages = []
    for conv in changed:
        msgs = await graph_api.get(
            f"/{conv['id']}/messages",
            params={"fields": "id,created_time,from,to,message,attachments"}
        )
        for msg in msgs["data"]:
            if msg["created_time"] > account.last_poll_timestamp:
                new_messages.append(msg)

    # Step 4: Insert (idempotent)
    await db.execute_many(
        "INSERT INTO ig_dm_message (...) VALUES (...) ON CONFLICT (message_id) DO NOTHING",
        new_messages
    )

    # Step 5: Advance checkpoint
    await db.execute(
        "UPDATE user_ig_dm_account SET last_poll_timestamp = $1 WHERE id = $2",
        [now(), account_id]
    )

    return build_candidates(new_messages)
```

### Checkpoint Strategy

Unlike Gmail (uses `historyId`) or SMTP (uses IMAP `UID`), the Graph API has no native incremental cursor for conversations. The checkpoint is a **timestamp**:

```sql
ALTER TABLE user_ig_dm_account
  ADD COLUMN last_poll_timestamp TIMESTAMPTZ DEFAULT NULL;
```

The polling activity filters conversations by `updated_time > last_poll_timestamp` client-side. This is less efficient than Gmail's `history_id` (which the API filters server-side) but functionally equivalent for correctness.

**Edge case**: `updated_time` is in Meta's time zone (UTC). Clock skew between Cheerful and Meta servers could cause missed events. Mitigate by applying a 60-second backwards overlap: poll from `last_poll_timestamp - 60s`, dedup by `message_id`.

### Rate Limit Analysis

The Graph API rate limit for `/conversations` is approximately **200 calls/hour per app/user pair** (general Graph API default). Each poll cycle for one account makes:
- 1 call to list conversations
- N calls to fetch messages (one per updated conversation)

At a conversation density of 10 updated conversations per poll cycle, each account uses ~11 calls per cycle.

| Accounts | Poll Interval | Calls/Hour per Account | Total Calls/Hour | Verdict |
|----------|---------------|------------------------|------------------|---------|
| 3 | 5 min | 12 × 12 = 144 | 432 | Safe (< 200 × 3 = 600) |
| 5 | 5 min | 144 | 720 | Borderline |
| 10 | 5 min | 144 | 1,440 | Over limit |
| 10 | 15 min | 44 | 440 | Safe (< 200 × 10 = 2,000) |
| 50 | 5 min | 144 | 7,200 | Severely over limit |
| 50 | 15 min | 44 | 2,200 | Over limit |

**Conclusion**: Pure polling is rate-limited to approximately **5–15 accounts at 5-minute intervals** or **15–30 accounts at 15-minute intervals**. For Cheerful's production scale (potentially 50–200+ accounts), polling-as-primary is not viable.

Additionally, rate limits are enforced per `(app_id, user_id)` pair. If one Cheerful user connects 3 Instagram accounts, all 3 share the same limit bucket, reducing capacity further.

### Latency Characteristics

| Poll Interval | P50 DM Delivery Latency | P99 DM Delivery Latency |
|---------------|-------------------------|-------------------------|
| 1 min | ~30s | ~60s |
| 5 min | ~2.5 min | ~5 min |
| 15 min | ~7.5 min | ~15 min |

Compare to webhook delivery: **1–5 seconds** typical. For a campaign management tool where creators reply and expect follow-up, 5–15 minute delays are functionally acceptable but not competitive with real-time alternatives.

---

## Variant B: Hybrid — Webhooks Primary, Polling for Recovery

This is the most defensible configuration for any production deployment that uses Graph API polling. It addresses the fundamental limitation of webhook-only systems (event loss during downtime) without relying on polling for real-time delivery.

### Architecture

```
NORMAL OPERATION:
Meta webhook → FastAPI /webhooks/instagram → BackgroundTask
    └─ IgDmIngestWorkflow (Temporal, triggered per event)
        └─ ThreadProcessingCoordinatorWorkflow

RECOVERY (runs periodically, e.g., every 30 min):
IgDmRecoveryWorkflow (Temporal, scheduled)
    └─ ig_dm_recovery_poll_activity (per account)
        ├─ GET /{page-id}/conversations?platform=instagram (filter by updated_time > last_known_good)
        ├─ GET /{conversation-id}/messages (for changed conversations)
        ├─ Check each message_id against ig_dm_message table
        └─ INSERT INTO ig_dm_message ON CONFLICT DO NOTHING  ← backfill missed events
```

### Recovery Poll Design

```python
# ig_dm_recovery_poll_activity (conceptual)
async def ig_dm_recovery_poll_activity(account_id: UUID) -> int:
    """
    Polls the Graph API for conversations updated since the last webhook event
    processed by this account. Backfills any messages missing from ig_dm_message.
    Returns count of messages backfilled.
    """
    account = await get_ig_dm_account(account_id)

    # Use last processed webhook timestamp as the recovery window start
    # With safety margin: go back RECOVERY_WINDOW_SECONDS (e.g., 1 hour)
    since = account.last_webhook_processed_at - timedelta(seconds=RECOVERY_WINDOW_SECONDS)

    backfilled = 0
    conversations = await poll_conversations_since(account, since)

    for conv in conversations:
        messages = await fetch_messages(conv["id"], account)
        for msg in messages:
            if msg["created_time"] < since:
                continue
            result = await db.execute(
                "INSERT INTO ig_dm_message (...) ON CONFLICT (message_id) DO NOTHING RETURNING id",
                msg
            )
            if result.rowcount > 0:
                backfilled += 1
                # Trigger processing for newly discovered message
                await temporal.start_workflow(IgDmIngestWorkflow, msg)

    return backfilled
```

### Recovery Workflow Scheduling

```python
# Scheduled as a Temporal cron (separate from main ingest)
@workflow.defn
class IgDmRecoveryWorkflow:
    @workflow.run
    async def run(self) -> None:
        accounts = await workflow.execute_activity(get_active_ig_dm_accounts_activity)
        for account_id in accounts:
            await workflow.execute_activity(
                ig_dm_recovery_poll_activity,
                args=[account_id],
                schedule_to_close_timeout=timedelta(minutes=5),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )
```

**Schedule**: Every 30–60 minutes. At this interval, rate limits are trivially satisfied even for 50+ accounts (1 list call + ~5 message fetches per account per run = ~60 calls / 50 accounts = 3,000 calls/hour across all accounts — but spread over the hour, each account uses ~6 calls per run which is well within limits).

### Compatibility with `option-direct-meta-api`

The hybrid variant is **not a standalone option** — it is a **component of the direct Meta API option**. The `option-direct-meta-api` analysis already implies this recovery mechanism. This document formalizes what that recovery loop looks like architecturally.

If Cheerful builds the direct Meta API option, the hybrid recovery loop should be considered a required component, not optional, because:
1. Temporal webhook workers will experience downtime (deploys, crashes, network issues)
2. Meta does not retry webhook events indefinitely — only for ~8 hours with exponential backoff
3. The recovery loop provides gap coverage that makes the overall system durable

---

## Variant C: Initial Account Sync (One-Time Polling)

When a Cheerful user first connects their Instagram account, there is existing DM history that predates the webhook subscription. The `/conversations` endpoint is the only way to access this history.

### Architecture

```
Instagram OAuth completion → ConnectIgDmAccountWorkflow
    └─ subscribe_to_webhooks_activity (webhook setup)
    └─ ig_dm_initial_sync_activity (one-time, runs after webhook setup)
        ├─ GET /{page-id}/conversations?platform=instagram (paginate ALL)
        ├─ For each conversation: GET /{conversation-id}/messages
        ├─ INSERT INTO ig_dm_message ON CONFLICT DO NOTHING
        └─ Trigger IgDmThreadSyncWorkflow for conversations with new messages
```

### Initial Sync Activity Design

```python
# ig_dm_initial_sync_activity (conceptual)
async def ig_dm_initial_sync_activity(account_id: UUID) -> InitialSyncResult:
    account = await get_ig_dm_account(account_id)

    # Pagination: GET all conversations (potentially 100s)
    all_conversations = []
    cursor = None
    while True:
        response = await graph_api.get(
            f"/{account.page_id}/conversations",
            params={
                "platform": "instagram",
                "fields": "id,updated_time",
                "access_token": account.page_access_token,
                "after": cursor,  # cursor-based pagination
                "limit": 100,
            }
        )
        all_conversations.extend(response["data"])
        if "paging" not in response or "next" not in response["paging"]:
            break
        cursor = response["paging"]["cursors"]["after"]

    # For each conversation, fetch messages
    messages_ingested = 0
    for conv in all_conversations:
        messages = await fetch_all_messages_in_conversation(conv["id"], account)
        for msg in messages:
            await db.execute(
                "INSERT INTO ig_dm_message (...) ON CONFLICT DO NOTHING",
                msg
            )
            messages_ingested += 1

    return InitialSyncResult(
        conversations=len(all_conversations),
        messages=messages_ingested,
    )
```

### Rate Limit Considerations for Initial Sync

Initial sync is a **one-time, bursty operation**. For accounts with many conversations, this could easily hit rate limits:
- 500 conversations × 1 call each = 501 calls (over the ~200/hour limit)
- Must implement throttling: process conversations in batches with delays

**Throttle strategy**: Process at most 50 conversations per minute. For a large account (500 conversations), sync takes ~10 minutes. This is acceptable for a one-time background operation.

**Temporal activity timeout**: Set to 30 minutes to accommodate large accounts.

### Coverage Limitations

| Data | Available | Notes |
|------|-----------|-------|
| Active conversations (followed by account) | ✅ Full history | All messages available |
| Inactive requests (<30 days old) | ✅ | If conversation was not yet pruned |
| Inactive requests (>30 days old) | ❌ | Hard cutoff — inaccessible |
| Messages deleted by sender before sync | ❌ | Not returned |
| Messages in Primary vs General folder | No distinction | API doesn't expose folder metadata |

The 30-day cutoff means initial sync cannot recover all DM history for dormant accounts. For Cheerful's inbound-capture use case (monitoring active creator relationships), this is acceptable — creators who replied 30+ days ago and were never contacted are outside the active campaign window anyway.

---

## Data Model for Polling-Based Approach

The data model for polling-based ingest is **identical** to the direct Meta API option — the ingestion mechanism doesn't change what gets stored. The same `ig_dm_*` table set applies:

```sql
-- Account container (new)
CREATE TABLE user_ig_dm_account (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_user_id TEXT NOT NULL,           -- Instagram Professional Account ID
    page_id TEXT NOT NULL,              -- Facebook Page ID (for API calls)
    page_access_token TEXT NOT NULL,    -- Encrypted; long-lived token
    ig_username TEXT NOT NULL,
    last_webhook_processed_at TIMESTAMPTZ,  -- For hybrid recovery
    last_poll_timestamp TIMESTAMPTZ,        -- For pure polling checkpoint
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Message store (new)
CREATE TABLE ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    conversation_id TEXT NOT NULL,       -- Meta conversation ID (t_xxx)
    message_id TEXT NOT NULL,            -- Meta message ID (m_xxx) — globally unique
    UNIQUE (message_id),                 -- Dedup key for ON CONFLICT DO NOTHING
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    sender_igsid TEXT NOT NULL,
    sender_username TEXT,                -- Resolved from IGSID (may be NULL initially)
    body_text TEXT,
    media_type TEXT,                     -- 'image', 'video', 'audio', NULL for text
    media_url TEXT,                      -- Ephemeral — download immediately
    media_stored_path TEXT,              -- Supabase Storage path after download
    sent_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    raw_payload JSONB                    -- Full webhook/API payload for debugging
);
```

**Key difference from webhook-only**: The `last_poll_timestamp` column on `user_ig_dm_account` serves as the polling checkpoint, analogous to `last_poll_history_id` for Gmail.

---

## Compatibility with Cheerful's Existing Architecture

### Structural Fit with Email Polling Patterns

| Dimension | Gmail | SMTP | IG DM (Polling) |
|-----------|-------|------|-----------------|
| Ingest method | History API poll | IMAP UID poll | Graph API poll |
| Checkpoint | `last_poll_history_id` | `last_sync_uid` + UIDVALIDITY | `last_poll_timestamp` |
| Perpetual loop | `AllPollHistoryWorkflow` | `AllSmtpInboxSyncWorkflow` | `AllIgDmPollWorkflow` (new) |
| Per-account activity | `poll_history_activity` | `smtp_inbox_sync_activity` | `ig_dm_poll_activity` (new) |
| Message store | `gmail_message` | `smtp_message` | `ig_dm_message` (new) |
| Thread state | `gmail_thread_state` | `smtp_thread_state` | `ig_dm_thread_state` (new) |
| Coordinator input | `Candidate` object | `Candidate` object | `Candidate` object (extended) |

The polling pattern fits naturally into Cheerful's existing architecture. The `AllIgDmPollWorkflow` would be registered alongside `AllPollHistoryWorkflow` and `AllSmtpInboxSyncWorkflow` in the Temporal worker configuration.

### `Candidate` Object Extension

```python
@dataclass
class Candidate:
    state__id: UUID
    # Existing discriminators
    gmail_thread_id: str | None
    email_thread_id: str | None
    gmail_account_id: UUID | None
    smtp_account_id: UUID | None
    # New discriminator (same pattern)
    ig_dm_conversation_id: str | None  # ADD
    ig_dm_account_id: UUID | None      # ADD
    # Shared metadata (unchanged)
    user_id: UUID
    campaign_id: UUID | None
    latest_gmail_message__direction: GmailMessageDirection
    force_campaign_id: UUID | None
    force_reply: bool
```

### `ThreadProcessingCoordinatorWorkflow` Changes

Same changes as `option-direct-meta-api` — a new branch for `ig_dm_account_id is not None`:

```python
# In ThreadProcessingCoordinatorWorkflow.run()
elif candidate.ig_dm_account_id is not None:
    # Instagram DM path (same regardless of polling vs webhook ingest)
    await self._handle_ig_dm_candidate(candidate)
```

The coordinator does not know or care how the `Candidate` arrived — webhook or poll. This is the key advantage of the `Candidate` abstraction.

---

## Constraints and Limitations

### Rate Limits (Critical)

| Scale | Poll Interval Needed | Latency | Viable? |
|-------|---------------------|---------|---------|
| 1–5 accounts | 5 min | ~2.5 min avg | Yes |
| 5–15 accounts | 10 min | ~5 min avg | Marginal |
| 15–50 accounts | 15–20 min | ~10 min avg | Poor UX |
| 50+ accounts | Not viable | Hours | No |

Rate limits are the **hard ceiling** for this option. Even if Cheerful qualifies for Advanced Access (higher limits), the `/conversations` endpoint is not covered by the separate Messaging API limits — it falls under general Graph API rate limiting.

### No Real-Time Delivery

Polling cannot match webhook latency. For a campaign tool where timely follow-up matters, 5–15 minute delays after a creator DMs are a product quality concern. This is partially mitigated by:
- Short poll intervals (at the cost of rate limit headroom)
- Hybrid approach (polling only for recovery; webhooks handle real-time)

### Facebook Page Requirement (Same as Webhooks)

The `/conversations` endpoint still requires:
- Instagram Professional Account linked to a Facebook Page
- `instagram_manage_messages` at Advanced Access level
- Meta App Review

Polling provides **no reduction in auth complexity or App Review requirements** compared to the webhook approach. The same Meta permissions are needed.

### 30-Day Inactivity Cutoff

Conversations in the "Requests" folder (DMs from non-followers) become inaccessible after 30 days of inactivity. For a long-running polling loop, this only affects conversations where no messages have been exchanged for 30+ days. In practice, active campaign relationships won't hit this limit.

### No Folder Metadata

The API does not indicate whether a conversation is in "Primary" or "General" inbox. This is a cosmetic limitation — Cheerful would receive all DMs without folder context.

### Ephemeral Media URLs

Media URL tokens expire. For polling, there's an additional risk: if a media message was sent more than a few hours before the poll cycle, the attachment URL may have expired before Cheerful downloads it. This is less of an issue for webhooks (which deliver within seconds of the message).

**Mitigation**: Immediately download media to Supabase Storage upon ingestion. The `ig_dm_poll_activity` must trigger media download as part of the ingest step.

---

## Comparison: Polling vs Webhooks as Primary Path

| Dimension | Graph API Polling | Meta Webhooks (Direct) |
|-----------|------------------|------------------------|
| **Real-time latency** | Minutes | Seconds |
| **Rate limit risk** | High (scales badly) | None (push delivery) |
| **Missed events** | Low (poll catches all if interval < 30d) | Possible (webhook downtime) |
| **Media URL freshness** | Risk of expiry for slow intervals | Minimal (delivered immediately) |
| **Setup complexity** | Low (no webhook endpoint needed) | Higher (HTTPS endpoint, verification, page subscription) |
| **Auth requirements** | Same (`instagram_manage_messages` Advanced) | Same |
| **App Review required** | Yes | Yes |
| **Scale ceiling** | ~15–30 accounts | Effectively unlimited |
| **Historical data** | Yes (initial sync + recovery) | No (only after subscription) |
| **Temporal workflow fit** | Natural (mirrors email polling pattern) | Different (event-driven trigger) |
| **Code complexity** | Moderate | Moderate |

**Verdict**: Polling is architecturally simpler to implement (mirrors existing email patterns) but scales poorly and delivers inferior latency. Webhooks scale better and deliver faster but require more infrastructure and careful failure handling. The hybrid model captures the best of both.

---

## Recommended Use of This Option's Components

Even if the direct Meta API (webhook-first) option is chosen, this option contributes two reusable components:

1. **Initial sync activity** (Variant C) — required for any approach; loads historical context when account is connected
2. **Recovery poll** (Variant B) — recommended as a mandatory component of any webhook-based approach

The pure polling variant (Variant A) is only suitable for:
- Very small deployments (≤5 accounts)
- Pre-App Review prototyping (bypasses webhook infrastructure requirement)
- Testing/development where webhook infrastructure hasn't been set up

---

## Effort Estimate

| Sub-task | Effort | Notes |
|----------|--------|-------|
| DB schema: `user_ig_dm_account` + `ig_dm_message` + state tables | Medium | Mirrors SMTP pattern |
| `AllIgDmPollWorkflow` + `ig_dm_poll_activity` | Medium | ~300 LOC, follows existing pattern |
| Rate limit management + throttling | Small | Sleep/batch logic in activity |
| Timestamp-based checkpoint | Trivial | Single column, simple update |
| Recovery poll workflow (Variant B) | Small | ~150 LOC |
| Initial account sync (Variant C) | Small–Medium | Pagination + throttle required |
| IGSID → username resolution (shared with webhook option) | Medium | API call + caching table |
| Creator identity matching (shared with webhook option) | Medium | Same as direct Meta API option |
| Coordinator extension (shared with webhook option) | Small | Candidate discriminator + new branch |
| AI drafting adaptation (shared with webhook option) | Large | Same as direct Meta API option |
| UI changes (shared with webhook option) | Large | Same as direct Meta API option |

**Total for Variant A (pure polling)**: 15–20 engineering days
- Saves ~3–5 days vs direct Meta API option (no webhook endpoint, no HMAC verification, no page subscription)
- Loses real-time latency and scale

**Total for Variant B (hybrid — polling recovery only)**: +3–5 days on top of direct Meta API option
- Required addition, not a standalone option

**Meta App Review**: Same timeline as direct Meta API (2–10 business days) — unavoidable regardless of polling vs webhook choice.

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Rate limit exceeded as user base grows | High (at scale) | Ingest stops | Move to webhooks; hybrid architecture |
| Media URL expiry before download | Medium (long intervals) | Lost media | Short poll intervals or immediate download trigger |
| Timestamp drift causes missed messages | Low | Missed DMs | Apply 60s backwards overlap on checkpoint |
| Meta deprecates `/conversations` endpoint | Low | Ingest stops | Has not been deprecated historically; webhooks as fallback |
| 30-day inactivity cutoff on Requests | Low (active campaigns) | Lost history | Acceptable — inactive conversations outside campaign scope |
| Rate limits differ from documented values | Medium | Unexpected throttling | Implement retry with backoff; monitor `X-App-Usage` header |
| Multiple poll workers race condition | Medium | Duplicate processing | Use `ON CONFLICT DO NOTHING`; Temporal dedup by activity ID |

---

## Summary

The Graph API polling option is **not viable as a standalone primary ingest path at production scale** due to rate limits and latency. However, it plays a legitimate supporting role:

- **Variant A (pure polling)**: Valid for prototyping, pre-App Review, or 1–5 account deployments. Not production-ready at Cheerful's growth trajectory.
- **Variant B (hybrid recovery)**: A recommended mandatory component of the direct Meta API option. Provides webhook failure recovery at negligible rate limit cost.
- **Variant C (initial sync)**: Required by all webhook-based options to load historical context. No architectural alternative exists.

The polling code is structurally the simplest to implement (mirrors Gmail/SMTP patterns) and would be the fastest path to a working prototype before Meta App Review is approved. Once App Review completes and webhooks are production-ready, the architecture can migrate from Variant A to hybrid (B+C) without data loss (dedup by `message_id` ensures no duplicates during transition).

---

## Compatibility Summary

| Dimension | Compatible? | Notes |
|-----------|-------------|-------|
| Temporal workflow pattern | ✅ Full | Mirrors `AllPollHistoryWorkflow` / `AllSmtpInboxSyncWorkflow` |
| Event-sourced thread state | ✅ Full | Same `ON CONFLICT DO NOTHING` + state table pattern |
| `Candidate` discriminator pattern | ✅ Full | Add `ig_dm_account_id` field |
| `ThreadProcessingCoordinatorWorkflow` | ✅ With changes | New branch for IG DM candidate |
| Campaign association workflow | ✅ Unchanged | Same AI-based matching |
| AI drafting | ✅ With adaptations | Same as direct Meta API option |
| Inbox UI | ✅ With additions | Same as direct Meta API option |
| Parallel tables architecture | ✅ Full | Natural fit — follows `ig_dm_*` pattern |
| Channel abstraction architecture | ✅ Full | Ingest mechanism independent of data model pattern |
