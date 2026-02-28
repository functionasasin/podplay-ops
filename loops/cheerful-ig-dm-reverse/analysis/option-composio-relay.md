# Option: Composio Relay Integration

**Aspect**: `option-composio-relay`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**References**:
- Wave 1: `third-party-composio.md`, `meta-instagram-messaging-api.md`, `meta-webhooks-realtime.md`
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`, `current-inbox-ui.md`, `current-ai-drafting.md`

---

## Overview

This option implements Instagram DM ingestion using **Composio as the intermediary layer** for Instagram API access, leveraging Cheerful's existing Composio integration rather than building a direct Meta API integration. Because Composio exposes zero inbound DM triggers, this option is **structurally a polling architecture** — Cheerful polls Instagram conversations via Composio's read actions on a scheduled interval.

**Core premise**: A Temporal cron workflow periodically calls `INSTAGRAM_LIST_DM_CONVERSATIONS` and `INSTAGRAM_LIST_DM_MESSAGES` via Composio, detects new messages by comparing against a stored watermark cursor, and injects discovered messages into the existing thread processing pipeline via `Candidate` objects.

**What Composio handles**: Instagram OAuth token lifecycle, API call execution, token refresh.
**What Cheerful handles**: Poll orchestration, watermark persistence, new-message detection, thread/creator mapping, thread state, AI drafting, UI.

**Fundamental constraint**: Composio has **no Instagram DM triggers** (0 available). This means the inbound-first goal (real-time capture of creator DM replies) is degraded to polling-based capture with minutes-scale latency. This is the defining trade-off of this option versus Option: Direct Meta API.

---

## End-to-End Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  SETUP PHASE (per Cheerful user, one-time)                           │
│                                                                      │
│  Cheerful UI → /settings/instagram                                   │
│      ↓                                                               │
│  Composio Connect Link (hosted OAuth via Composio)                   │
│      ↓                                                               │
│  User authorizes Composio to access Instagram Business Account       │
│      ↓                                                               │
│  Composio stores token (keyed by Cheerful user_id = email)           │
│      ↓                                                               │
│  Cheerful writes: user_ig_dm_account row (composio_entity_id, ig_user_id)
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  POLLING PHASE (recurring, per connected user)                       │
│                                                                      │
│  IgDmPollWorkflow (perpetual, continue_as_new)                       │
│    └─ IgDmBatchPollWorkflow (per batch of accounts)                  │
│        └─ ig_dm_poll_account_activity (per user account)             │
│            │                                                         │
│            ├─ composio.execute("INSTAGRAM_LIST_DM_CONVERSATIONS",    │
│            │       entity_id=user_id)                                │
│            │       → returns conversation list with metadata         │
│            │                                                         │
│            ├─ for each conversation:                                 │
│            │   ├─ read watermark: ig_dm_watermark.last_message_id    │
│            │   ├─ if latest_message.id == watermark → skip           │
│            │   └─ else: composio.execute(                            │
│            │           "INSTAGRAM_LIST_DM_MESSAGES",                 │
│            │           entity_id=user_id,                            │
│            │           conversation_id=conv.id,                      │
│            │           since_message_id=watermark)                   │
│            │       → returns new messages since watermark            │
│            │                                                         │
│            ├─ for each new message:                                  │
│            │   ├─ INSERT INTO ig_dm_message ON CONFLICT DO NOTHING   │
│            │   └─ UPDATE ig_dm_watermark SET last_message_id         │
│            │                                                         │
│            └─ IgDmThreadSyncWorkflow (fire-and-forget, per account)  │
│                └─ ig_dm_batch_state_and_get_candidates_activity      │
│                └─ ThreadProcessingCoordinatorWorkflow (per candidate)│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  SHARED COORDINATOR (reused from email paths)                        │
│                                                                      │
│  ThreadProcessingCoordinatorWorkflow                                 │
│    (receives Candidate with ig_dm_account_id set)                    │
│    ├─ ThreadAssociateToCampaignWorkflow (SHARED)                     │
│    ├─ IGSID resolution (NEW: call Composio GET /{igsid}?fields=...)  │
│    ├─ Creator identity resolution (NEW: handle → campaign_creator)   │
│    ├─ check_domain_and_classify (SHARED)                             │
│    ├─ ThreadResponseDraftWorkflow (SHARED, with DM adaptations)      │
│    └─ (no ThreadAttachmentExtractWorkflow — not applicable for DMs)  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  OUTBOUND REPLY (when user sends a DM draft)                         │
│                                                                      │
│  User approves DM draft in Cheerful inbox                            │
│      ↓                                                               │
│  IgDmSendReplyActivity                                               │
│      ↓                                                               │
│  composio.execute("INSTAGRAM_SEND_TEXT_MESSAGE",                     │
│      entity_id=user_id,                                              │
│      recipient_id=igsid,                                             │
│      message=draft_text)                                             │
│      ↓                                                               │
│  UPDATE ig_dm_thread_state → WAITING_FOR_INBOUND                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Connecting Instagram via Composio

Unlike the direct Meta API option (which requires Cheerful to host an OAuth callback endpoint and manage tokens in Supabase), the Composio relay uses **Composio-hosted OAuth**:

```
1. Cheerful backend: GET /api/instagram/connect
        ↓
2. composio_client.get_entity(user_id=email)
   .initiate_connection(app_name="instagram")
   → returns redirect_url (Composio-hosted Meta OAuth)
        ↓
3. Cheerful redirects user → Composio OAuth page
        ↓
4. User grants access to their Instagram Business Account
        ↓
5. Composio stores access token, refresh token, scopes
        ↓
6. Composio redirects → Cheerful callback URL
        ↓
7. Cheerful: GET /api/instagram/callback
   → calls Composio to verify connection status
   → INSERT INTO user_ig_dm_account (user_id, composio_entity_id, ig_user_id)
```

**Composio custom auth config option**: Cheerful can configure Composio to use Cheerful's own Meta App credentials (client ID + secret), so the OAuth consent screen shows "Cheerful wants access" instead of "Composio wants access". This white-labels the auth flow without Cheerful managing token storage directly.

### Credential Isolation

Composio scopes credentials per `entity_id`. Cheerful uses the lowercased user email as the `entity_id` — matching the existing `composio_adapter.py` pattern (`user_id` = lowercase email in current Composio usage). No new auth isolation logic required for the Composio client.

---

## New Components Required

### New Temporal Workflows

| Workflow | Description | Analogous To |
|----------|-------------|-------------|
| `IgDmPollWorkflow` | Perpetual loop, manages poll cadence for all connected accounts | `AllPollHistoryWorkflow` (Gmail) / `AllSmtpInboxSyncWorkflow` |
| `IgDmBatchPollWorkflow` | Polls a batch of accounts in parallel | `BatchSmtpInboxSyncWorkflow` |
| `IgDmThreadSyncWorkflow` | Creates thread state records and emits `Candidate` objects | `ThreadSyncWorkflow` / `SmtpThreadSyncWorkflow` |

### New Temporal Activities

| Activity | Description | Composio Actions Used |
|----------|-------------|----------------------|
| `ig_dm_poll_account_activity` | Polls conversations + messages for one account, writes to DB | `INSTAGRAM_LIST_DM_CONVERSATIONS`, `INSTAGRAM_LIST_DM_MESSAGES` |
| `ig_dm_batch_state_and_get_candidates_activity` | Creates `ig_dm_thread_state` rows, returns `Candidate` objects | None (DB only) |
| `ig_dm_resolve_sender_activity` | Resolves IGSID → username via Composio or direct call | `INSTAGRAM_GET_DM_CONVERSATION` or Graph API |
| `ig_dm_send_reply_activity` | Sends outbound DM reply | `INSTAGRAM_SEND_TEXT_MESSAGE` |

### New Database Tables

#### `user_ig_dm_account`
```sql
CREATE TABLE user_ig_dm_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    composio_entity_id TEXT NOT NULL,    -- Composio's entity identifier
    ig_user_id TEXT,                     -- Instagram Business Account numeric ID
    ig_username TEXT,                    -- @username (resolved on connect)
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_poll_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (user_id)
);
```

Note: No access token stored in Cheerful's DB — Composio holds it. `composio_entity_id` is the handle for making Composio-authenticated calls.

#### `ig_dm_message`
```sql
CREATE TABLE ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_message_id TEXT NOT NULL,         -- Meta's stable message ID
    ig_conversation_id TEXT NOT NULL,    -- Meta's conversation (thread) ID
    sender_igsid TEXT NOT NULL,          -- Sender's Instagram Scoped ID
    sender_username TEXT,                -- Resolved username (nullable until resolved)
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    body TEXT,                           -- Message text (null for media-only)
    media_urls TEXT[],                   -- Array of media URLs (if any)
    timestamp TIMESTAMPTZ NOT NULL,
    raw_payload JSONB,                   -- Full webhook/API payload
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ig_dm_account_id, ig_message_id)
);
```

#### `ig_dm_thread_state`
```sql
CREATE TABLE ig_dm_thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_conversation_id TEXT NOT NULL,
    status TEXT NOT NULL,                -- GmailThreadStatus enum values
    latest_message_at TIMESTAMPTZ NOT NULL,
    window_expires_at TIMESTAMPTZ,       -- 24-hour window tracking (NEW concept)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ig_dm_account_id, ig_conversation_id, latest_message_at)
);
```

#### `ig_dm_watermark`
```sql
CREATE TABLE ig_dm_watermark (
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_conversation_id TEXT NOT NULL,
    last_message_id TEXT NOT NULL,       -- Last processed Meta message ID
    last_message_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ig_dm_account_id, ig_conversation_id)
);
```

This table is new conceptually — no equivalent exists in Gmail/SMTP paths (which use a different checkpoint mechanism: `last_poll_history_id` for Gmail, IMAP UID for SMTP). The watermark is a per-conversation cursor, not a per-account checkpoint.

#### `latest_ig_dm_message_per_thread` (trigger table)
```sql
CREATE TABLE latest_ig_dm_message_per_thread (
    ig_conversation_id TEXT PRIMARY KEY,
    ig_dm_account_id UUID NOT NULL,
    ig_message_id TEXT NOT NULL,
    sender_igsid TEXT NOT NULL,
    body TEXT,
    timestamp TIMESTAMPTZ NOT NULL
);
```
Maintained by a trigger on `ig_dm_message` — mirrors `latest_gmail_message_per_thread` pattern.

### Extensions to Existing Tables

#### `campaign_thread` — add `ig_dm_conversation_id`
```sql
ALTER TABLE campaign_thread
    ADD COLUMN ig_dm_conversation_id TEXT;

-- New check constraint (3-way mutual exclusivity)
ALTER TABLE campaign_thread
    DROP CONSTRAINT chk_campaign_thread_one_thread_id;
ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL AND ig_dm_conversation_id IS NULL) OR
        (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL AND ig_dm_conversation_id IS NULL) OR
        (gmail_thread_id IS NULL AND email_thread_id IS NULL AND ig_dm_conversation_id IS NOT NULL)
    );
```

#### `campaign_sender` — add `ig_dm_account_id`
```sql
ALTER TABLE campaign_sender
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);
-- 3-way mutual exclusivity constraint analogous to campaign_thread
```

#### `thread_flag` — add `ig_dm_conversation_id`
Analogous to the `campaign_thread` extension.

#### `campaign_creator` — GIN index for handle lookup
```sql
CREATE INDEX idx_campaign_creator_handles_gin
ON campaign_creator USING GIN (social_media_handles);

ALTER TABLE campaign_creator ADD COLUMN ig_igsid TEXT;
CREATE INDEX idx_campaign_creator_ig_igsid ON campaign_creator(ig_igsid)
WHERE ig_igsid IS NOT NULL;
```

### New `Candidate` Discriminator Field

The `Candidate` dataclass (convergence object for `ThreadProcessingCoordinatorWorkflow`) needs a new discriminator:

```python
class Candidate:
    state__id: UUID
    gmail_thread_id: str | None
    email_thread_id: str | None
    ig_dm_conversation_id: str | None    # NEW
    gmail_account_id: UUID | None
    smtp_account_id: UUID | None
    ig_dm_account_id: UUID | None        # NEW
    user_id: UUID
    # ... existing fields unchanged
```

### ThreadProcessingCoordinatorWorkflow — New Branch

```python
# In thread_processing_coordinator_workflow.py
elif candidate.ig_dm_account_id is not None:
    # IG DM path
    # Skip: ensure_complete_thread_ingested (not applicable)
    # Skip: ThreadAttachmentExtractWorkflow (not applicable)
    # New: resolve sender identity if not yet resolved
    await workflow.execute_activity(ig_dm_resolve_sender_activity, ...)
    # Shared: campaign association, domain classify, draft generation
    await workflow.execute_child_workflow(ThreadAssociateToCampaignWorkflow, ...)
    ...
```

---

## Polling Architecture Details

### Poll Interval Trade-offs

| Poll Interval | Avg DM Lag | Composio Calls/hr (50 convos) | Meta API Calls/hr |
|---------------|-----------|-------------------------------|-------------------|
| 1 min | 30 sec | 3,000 | ~3,000 |
| 5 min | 2.5 min | 600 | ~600 |
| 10 min | 5 min | 300 | ~300 |
| 15 min | 7.5 min | 200 | ~200 |

Composio free tier: 1,000 premium calls/hour. A single user with 50 active DM conversations at 5-min polling = 600 calls/hour. Two users saturate the free tier. Paid tier (10,000/hour) accommodates ~16 users at 5-min intervals with 50 conversations each.

### Polling Correctness Concerns

1. **Message ordering**: Composio returns conversations sorted by most-recent-message. If a conversation has no new messages, the watermark skips it cheaply (conversation-level check before fetching messages).
2. **New conversations**: A new conversation (creator who has never DM'd before) appears as a new entry in the conversation list. The watermark table has no row for it — triggers full message fetch for that conversation.
3. **Concurrent polls**: Same pattern as Gmail — a sync lock on `user_ig_dm_account.id` prevents concurrent polling of the same account (Temporal activity ID deduplication or explicit lock).
4. **Pagination gaps**: If a conversation receives many messages between polls, Composio's pagination may require multiple pages. The watermark must be updated only after all pages are fetched and stored — otherwise partial ingestion could skip messages.
5. **Message deletion**: Instagram allows message deletion. Deleted messages won't appear in the API response. Stored messages may become stale — no mechanism to detect deletions.

### Watermark vs. Event-Sourced Model

The `ig_dm_watermark` table is a **mutable cursor** — a different pattern from Cheerful's append-only event-sourced thread states. It requires careful handling:
- Watermark updated only after ALL new messages for a conversation are successfully stored
- If activity fails mid-conversation, watermark not advanced (idempotent retry)
- If two poll cycles overlap for the same conversation, `ON CONFLICT DO NOTHING` on `ig_dm_message` ensures idempotency

---

## Creator Identity Resolution Flow (Composio Path)

The IGSID → creator resolution differs slightly from the direct Meta API option:

```
1. ig_dm_poll_account_activity receives sender.id = "17841400000123456"
        ↓
2. Check ig_dm_watermark for this conversation:
   - If conversation already tracked → sender_igsid known, skip resolution now
   - If new conversation → resolve sender
        ↓
3. Resolve IGSID → username:
   Option A: composio.execute("INSTAGRAM_GET_DM_CONVERSATION", entity_id=user_id, ...)
             → returns conversation metadata including sender info
   Option B: Direct Graph API call (requires extracting token from Composio — not possible)
   Option C: Store IGSID in ig_dm_message; resolve lazily in coordinator workflow
        ↓
4. Match username → campaign_creator:
   SELECT * FROM campaign_creator
   WHERE campaign_id IN (SELECT campaign_id FROM campaign_sender WHERE ig_dm_account_id = ?)
   AND social_media_handles @> '[{"platform":"instagram","handle":"<username>"}]'::jsonb
        ↓
5. If match found → link ig_dm_conversation to campaign thread
   If no match → create unattributed conversation, notify user to manually assign
        ↓
6. Cache IGSID: UPDATE campaign_creator SET ig_igsid = '17841400000123456'
               (for faster future lookups)
```

**Composio limitation**: Composio does not expose the raw access token. Any Graph API call outside of Composio's action catalog (e.g., a custom `GET /{igsid}` endpoint) must route through Composio as an action. If Composio doesn't have a specific action for IGSID resolution, it requires a generic HTTP action or the Graph API call must be handled differently.

The `INSTAGRAM_GET_DM_CONVERSATION` action may return enough metadata (sender info, message history) to extract the username without a separate lookup — this needs to be verified against Composio's actual response schema.

---

## Outbound Reply Flow

When a Cheerful user approves an AI-drafted DM reply:

```
1. User clicks "Send" in Cheerful inbox UI (DM thread view)
        ↓
2. POST /api/campaigns/{id}/threads/{id}/dm-send
        ↓
3. IgDmSendReplyActivity:
   composio_client.execute_action(
       action="INSTAGRAM_SEND_TEXT_MESSAGE",
       params={
           "recipient_id": igsid,
           "message": draft_body_text,
       },
       entity_id=user_email
   )
        ↓
4. On success:
   INSERT INTO ig_dm_message (direction="OUTBOUND", body=..., ...)
   UPDATE ig_dm_thread_state → WAITING_FOR_INBOUND
   UPDATE ig_dm_watermark (advance watermark past the sent message)
        ↓
5. Next poll cycle picks up any creator reply
```

**Composio value here**: Token management and the `INSTAGRAM_SEND_TEXT_MESSAGE` action are already abstracted. Cheerful reuses `composio_adapter.py` with no new Composio client code. The outbound path is the strongest use case for Composio in this option.

---

## Effort Estimate

### Relative to Direct Meta API Option

| Component | Composio Relay | Direct Meta API | Delta |
|-----------|---------------|-----------------|-------|
| Auth/OAuth infrastructure | Low (Composio hosted) | Medium (FastAPI OAuth endpoint, token DB) | Composio saves ~1 week |
| Inbound poll workflow suite | Medium (new Temporal workflows) | N/A (webhook-driven) | Polling adds ~1 week |
| Webhook endpoint | None needed | Medium (FastAPI endpoint, verification, fan-out) | Direct saves ~1 week |
| IGSID resolution | Medium (via Composio actions) | Medium (direct Graph API call) | Comparable |
| Creator identity resolution | Medium (new logic, GIN index) | Medium (same) | Comparable |
| Thread model extensions | Medium (same tables needed) | Medium (same) | Comparable |
| UI changes | Medium (same DM inbox view) | Medium (same) | Comparable |
| Coordinator changes | Low (new branch) | Low (same) | Comparable |
| Total | **Medium (5–7 weeks)** | **Medium-High (6–8 weeks)** | Composio ~1 week faster |

### Absolute Component Breakdown (Composio Relay)

| Component | Effort |
|-----------|--------|
| Composio Connect Link integration + `user_ig_dm_account` setup | 2–3 days |
| DB migrations (new tables + extensions) | 2–3 days |
| `IgDmPollWorkflow` + batch poll workflow | 3–4 days |
| `ig_dm_poll_account_activity` (Composio calls, watermark, dedup) | 4–5 days |
| IGSID resolution + creator matching logic | 3–4 days |
| Thread state activity + `Candidate` extension | 2–3 days |
| `ThreadProcessingCoordinatorWorkflow` — IG DM branch | 2–3 days |
| `IgDmSendReplyActivity` (outbound via Composio) | 1–2 days |
| AI drafting adaptations (DM format, no subject) | 2–3 days |
| Inbox UI — DM thread rendering | 4–5 days |
| Testing + end-to-end validation | 3–4 days |
| **Total** | **~28–39 days (~5.5–8 weeks)** |

---

## Compatibility with Cheerful's Existing Architecture

### Temporal Workflow Pattern

**High compatibility.** The perpetual poll loop pattern (`continue_as_new`, batch processing, fire-and-forget child workflows) mirrors the Gmail and SMTP polling workflows exactly. The Composio client is called from inside Temporal activities — the same pattern as existing `composio_adapter.py` usage for outbound actions. No new infrastructure or Temporal configuration required.

**Delta**: The polling cadence (minutes) means Temporal schedules/timers are used more aggressively. No technical issue, but increased scheduler load if many users are connected.

### Event-Sourced Thread State

**Partial compatibility.** The `ig_dm_thread_state` table follows the append-only event-sourced pattern. However, `ig_dm_watermark` is a mutable cursor — a conceptually different pattern. This dual-pattern (immutable thread state + mutable watermark) doesn't break anything but adds a new paradigm to an otherwise consistent codebase.

**Risk**: Watermark and thread state must be updated atomically — if one succeeds and the other fails, the pipeline is inconsistent. Temporal's activity retry semantics + `ON CONFLICT DO NOTHING` idempotency mitigate this.

### Composio Adapter Reuse

**High reuse.** The `composio_adapter.py` service already handles:
- Action execution with `entity_id` scoping
- Schema conversion and response parsing
- Error handling for Composio API failures

Adding Instagram actions requires registering new action slugs — no new Composio client code. The outbound send (`INSTAGRAM_SEND_TEXT_MESSAGE`) fits the existing action execution pattern perfectly.

### Creator Identity Resolution

**Low compatibility (new logic required).** The email pipeline's creator matching (by `sender_email`) has no analog for DM sender matching by IGSID/handle. This is new code regardless of API approach (Composio relay or direct Meta API).

### Campaign Thread Model

**Medium compatibility.** Adding `ig_dm_conversation_id` to `campaign_thread` and extending the 3-way check constraint is a schema migration — tested pattern in Cheerful (SMTP support was added the same way). The Pydantic models and SQLAlchemy queries that touch `campaign_thread` need updating.

---

## Composio-Specific Constraints and Limitations

### 1. No Real-Time Inbound (Fundamental)

The absence of Instagram DM triggers in Composio means this option is **structurally polling-based**. The inbound-first goal degrades from real-time (< 1 second for webhooks) to polling-latency (2.5–7.5 minutes at practical intervals). For influencer campaign management, this latency is likely acceptable (creators are not expecting sub-second responses), but it is a meaningful product difference.

### 2. Composio Rate Limits

| Scenario | Calls/hr | Composio Tier Needed |
|----------|---------|---------------------|
| 1 user, 50 conversations, 5-min poll | ~600/hr | Free |
| 5 users, 50 conversations each, 5-min poll | ~3,000/hr | Paid |
| 10 users, 100 conversations each, 5-min poll | ~12,000/hr | Paid (near ceiling) |
| 20 users, 100 conversations each, 5-min poll | ~24,000/hr | Enterprise |

At current Cheerful scale (early-stage), the free tier may suffice. At growth-stage scale, paid Composio is required — adding operational cost with no equivalent cost in the direct Meta API option (direct calls are free; only rate-limited by Meta's API quotas).

### 3. Meta App Review Still Required

Composio's Instagram actions use the Graph API conversations endpoints, which require `instagram_manage_messages` **Advanced Access** — the same Meta App Review process required for the direct Meta API option. **Composio does not bypass Meta's approval process.** The primary blocker (weeks to months of review, possible rejection) applies equally to both options.

### 4. Credential Split Problem (Partially Avoided)

The Composio Path B (hybrid OAuth + direct webhooks) was identified in Wave 1 as architecturally incoherent because Composio holds tokens but direct webhook subscriptions need raw tokens. The polling-based Composio Relay avoids this problem: Composio holds tokens and Cheerful always calls Composio for API access — no raw token needed.

However, if Cheerful ever wants to add Meta webhook support (for real-time upgrades in the future), it would need to retrieve tokens from Composio or migrate to self-managed credentials. The Composio relay option **locks in a polling architecture** that is hard to upgrade to real-time without a significant rework.

### 5. Composio as a Single Point of Failure

All Instagram API access routes through Composio. If Composio's service is unavailable:
- DM polling stops (no new messages ingested)
- Outbound DM sends fail
- The Instagram channel is silently degraded

The email channels (Gmail, SMTP) are unaffected — they don't use Composio for their ingest paths. This creates an asymmetric reliability profile.

Mitigation: Implement retry/alert if Composio calls fail > N times consecutively. Surface Composio connectivity status in Cheerful's health dashboard.

### 6. Conversation Coverage Completeness

`INSTAGRAM_LIST_DM_CONVERSATIONS` may not return ALL conversations — older, inactive conversations may be paginated out or excluded by Meta's API defaults. At launch this is unlikely to matter (recent conversations are always returned), but for users with many historical conversations, the first poll may not discover them all.

### 7. 24-Hour Window Enforcement

The Instagram 24-hour messaging window applies regardless of API access method. After a creator goes 24 hours without sending a message, outbound DMs (via `INSTAGRAM_SEND_TEXT_MESSAGE`) will be rejected by Meta's API (even via Composio). Cheerful must:
- Track the `window_expires_at` in `ig_dm_thread_state`
- Prevent draft generation or flag the draft as "window expired"
- Surface this constraint in the UI (e.g., "DM window closed — contact via email")

This is new logic with no email equivalent, required in both Composio relay and direct Meta API options.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Meta App Review takes months or rejected | High | High — blocks the entire option | Same as direct Meta API; no Composio shortcut |
| Polling misses DMs under high message volume | Medium | Medium — messages delayed or missed | Fallback: user can manually trigger a poll; alert on gaps |
| Composio outage blocks all Instagram actions | Low–Medium | Medium — channel degraded, email unaffected | Health checks; alert on consecutive failures |
| Free tier Composio rate limits exhausted at scale | Medium | Low–Medium — upgrade to paid required | Predictable; monitor Composio dashboard |
| Composio changes Instagram action schemas/slugs | Low | Medium — ingestion breaks | Composio provides migration notices; pin action versions |
| 24-hour window not tracked → send failures | Medium (if not implemented) | Medium — failed sends confuse users | Implement `window_expires_at` tracking from day one |
| IGSID resolution fails (Composio action limitations) | Medium | Medium — sender not identified, DM unattributed | Fall back to IGSID display; manual creator assignment |
| Handle → campaign_creator match fails (no handle stored) | High | Medium — many DMs unattributed | Pre-seed handles during email outreach; UI for manual linking |
| Large conversations: watermark advances past unprocessed messages | Low (with correct implementation) | High — message loss | Only advance watermark after all messages stored |
| Credential migration required if switching to direct Meta API later | Medium | Medium — rework of OAuth onboarding | Document migration path; use Composio custom auth config to reduce lock-in |

---

## Comparison with Direct Meta API Option

| Dimension | Composio Relay | Direct Meta API |
|-----------|---------------|-----------------|
| **Inbound latency** | Minutes (polling) | Sub-second (webhooks) |
| **Auth implementation** | Composio-hosted OAuth (simple) | Self-managed Meta OAuth (complex) |
| **Meta App Review** | Required (same approval process) | Required |
| **Token storage** | Composio holds tokens | Cheerful's Supabase DB |
| **Outbound send** | Via Composio action | Direct Graph API call |
| **Infrastructure added** | New Temporal poll workflows | New FastAPI webhook endpoint |
| **Vendor dependency** | Composio + Meta | Meta only |
| **Real-time upgradeable** | No (polling architecture is structural) | Already real-time |
| **Cost at scale** | Composio paid tier + Meta API | Meta API only |
| **Existing code reuse** | `composio_adapter.py` (high) | Gmail service pattern (high) |
| **Reliability** | Composio SPOF added | Meta webhooks only |
| **Effort** | Medium (~6 weeks) | Medium–High (~7 weeks) |
| **Future-proof** | Low (webhook upgrade = rework) | High (real-time from day one) |

---

## When to Choose This Option

**Arguments for Composio Relay:**
- Polling latency is acceptable for the product use case (influencer campaign management — creators are not expecting instant responses)
- Team wants to minimize new OAuth infrastructure (no FastAPI webhook endpoint, no token management in Supabase)
- Cheerful is already paying for Composio paid tier for other actions
- Fastest path to a working MVP (OAuth onboarding is much simpler)
- App Review is in progress but not yet approved — polling can use available API access tiers

**Arguments against Composio Relay:**
- Real-time DM capture may become a product requirement (creator experience, team responsiveness)
- Composio adds a SPOF and vendor cost with no benefit to reliability
- Polling architecture is hard to upgrade to real-time later without rework
- Meta App Review is required regardless — no meaningful shortcut
- At scale, Composio paid tier adds predictable recurring cost vs. direct Meta API (free)

---

## Sources

- Composio Instagram Toolkit: https://docs.composio.dev/toolkits/instagram
- Composio Instagram Actions: https://composio.dev/tools/instagram/all (36 actions, 2 triggers — neither a DM trigger)
- Composio Pricing: https://composio.dev/pricing
- Cheerful Composio adapter: `apps/backend/src/services/composio_adapter.py`
- Wave 1 analysis: `third-party-composio.md` (comprehensive Composio capability assessment)
- Wave 2 analyses: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`
- Wave 3 reference: `option-direct-meta-api.md` (comparison baseline)
