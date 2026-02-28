# Option: Channel Abstraction Architecture

**Aspect**: `option-channel-abstraction`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**Type**: ARCHITECTURE PATTERN — independent of API access choice; combinable with any Wave 3 API option.
**References**:
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-inbox-ui.md`, `current-ai-drafting.md`, `current-creator-identity.md`

---

## Overview

This option introduces a **generic channel abstraction layer** that unifies Gmail, SMTP, and Instagram DMs (and any future channels) under a single interface. Rather than adding a third set of parallel tables and branching conditionals in the coordinator (as in `option-parallel-tables`), this option invests in defining stable interfaces that each channel implements — database schema, Python services, Temporal activities, and TypeScript frontend types.

**Core premise**: Cheerful's current dual-path architecture already has one implicit abstraction (the `Candidate` object and the shared `ThreadProcessingCoordinatorWorkflow`). This option makes that abstraction explicit and complete — extending it downward into DB schema and upward into frontend types — so that adding future channels (WhatsApp, LinkedIn, SMS) requires only implementing the interface, not modifying the coordinator.

**This is a refactoring investment, not a feature.** The Instagram DM feature ships alongside or shortly after the abstraction work, but the abstraction benefits all channels including the existing ones.

---

## Problem This Solves

The current codebase has accumulated email-specific naming and structures even for concepts that are channel-agnostic:

| Symptom | Location | Actual Scope |
|---------|----------|--------------|
| `GmailThreadStatus` enum | `models/database/gmail_thread_state.py:13` | Already used by SMTP too |
| `GmailMessageDirection` enum | `models/database/` | Used by SMTP |
| `gmail_thread_state_id` field | Frontend `GmailThread` type | SMTP threads use this field too |
| `GmailThread` / `GmailMessage` frontend types | `gmail-types.ts` | Models all mail threads (Gmail + SMTP) |
| `gmail_thread_llm_draft` table | DB schema | Already stores SMTP drafts (added via migration) |
| `gmail_thread_ui_draft` table | DB schema | Used for SMTP too |
| `ThreadProcessingCoordinatorWorkflow` | `temporal/workflow/` | Handles both channels with internal `if gmail_account_id else smtp_account_id` branching |

Without abstraction, adding Instagram DMs extends this pattern: `ig_dm_thread_state_id` would appear in frontend types, `gmail_thread_llm_draft` would get more columns for IG, and the coordinator would grow a third branch. The cumulative cognitive load compounds.

---

## Architecture Design

The abstraction operates at four layers, each independently adoptable.

### Layer 1: Database — Thread Normalization

**Current state**: Two sets of parallel tables keyed by `gmail_thread_id` and `email_thread_id` respectively, joined into `campaign_thread` via mutual-exclusivity CHECK constraint.

**Abstraction goal**: A single `thread` concept in the database that works across channels without table-per-channel proliferation.

#### Sub-option 1A: Polymorphic `thread` Table (Full Abstraction)

Replace the per-channel thread ID columns in `campaign_thread` with a normalized thread entity table:

```sql
-- New canonical thread registry
CREATE TABLE thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    channel TEXT NOT NULL CHECK (channel IN ('gmail', 'smtp', 'instagram_dm')),
    channel_thread_id TEXT NOT NULL,  -- Gmail thread ID / SMTP email_thread_id / IG conversation_id
    account_id UUID NOT NULL,         -- polymorphic: points to user_gmail_account / user_smtp_account / user_ig_dm_account
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (channel, channel_thread_id, account_id)   -- channel-scoped uniqueness
);

-- campaign_thread becomes a simple many-to-one join
ALTER TABLE campaign_thread
    ADD COLUMN thread_id UUID REFERENCES thread(id);
-- Remove gmail_thread_id, email_thread_id, and the CHECK constraint
-- (Migration: backfill thread_id from existing gmail_thread_id/email_thread_id rows)
```

Thread state becomes unified:
```sql
CREATE TABLE thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES thread(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL,            -- ThreadStatus enum (rename of GmailThreadStatus)
    latest_internal_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- event-sourced: new row per transition; current = MAX(latest_internal_date)
);
```

LLM draft storage becomes unified:
```sql
CREATE TABLE thread_llm_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_state_id UUID NOT NULL REFERENCES thread_state(id),
    thread_id UUID NOT NULL REFERENCES thread(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    draft_body_text TEXT,
    draft_subject TEXT,             -- NULL for DMs (no subject)
    channel_draft_id TEXT,          -- Gmail draft ID or NULL (channel-specific metadata)
    draft_version INT NOT NULL DEFAULT 1,
    langfuse_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Tradeoffs**:
- ✅ Extensible: new channels add a row in `thread`, not a new table
- ✅ Eliminates mutual-exclusivity CHECK constraint complexity (grows awkward at 3 channels)
- ✅ Unifies `gmail_thread_llm_draft` (currently becoming a kitchen sink) into clean `thread_llm_draft`
- ❌ Loses FK referential integrity on `account_id` (polymorphic FK not supported in PostgreSQL)
- ❌ Requires data migration of existing `campaign_thread` rows
- ❌ RLS policies must handle `channel`-specific account_id resolution (more complex)
- ❌ All queries against thread-specific message tables (`gmail_message`, `smtp_message`) still need per-channel branching

**RLS note**: Without an FK, RLS on the `thread` table cannot enforce `account_id` ownership via join. A workaround is a database function `get_user_account_ids(user_id, channel)` used in RLS policies — adds operational complexity.

#### Sub-option 1B: Union View Over Parallel Tables (Light Abstraction)

Keep existing parallel tables (`gmail_thread_state`, `smtp_thread_state`, and new `ig_dm_thread_state`). Add a view that provides a unified interface:

```sql
-- Read-only unified view — no schema migration required
CREATE VIEW all_thread_states AS
    SELECT
        id, user_id, 'gmail' AS channel, gmail_account_id AS account_id,
        gmail_thread_id AS channel_thread_id, status, latest_internal_date
    FROM gmail_thread_state
    WHERE status != 'NOT_LATEST'
UNION ALL
    SELECT
        id, user_id, 'smtp' AS channel, smtp_account_id AS account_id,
        email_thread_id AS channel_thread_id, status, latest_internal_date
    FROM smtp_thread_state
    WHERE status != 'NOT_LATEST'
UNION ALL
    SELECT
        id, user_id, 'instagram_dm' AS channel, ig_dm_account_id AS account_id,
        ig_conversation_id AS channel_thread_id, status, latest_internal_date
    FROM ig_dm_thread_state
    WHERE status != 'NOT_LATEST';
```

The `campaign_thread` table is extended minimally (3-way CHECK constraint), not refactored. The view provides a query abstraction for cross-channel dashboards and analytics without touching existing code.

**Tradeoffs**:
- ✅ Zero migration risk — no existing table structure changes
- ✅ FK integrity preserved on all existing tables
- ✅ RLS policies unchanged on existing tables
- ✅ Ships with IG DM parallel-tables option at near-zero extra cost
- ❌ Not a true abstraction — underlying code still branches on channel type
- ❌ `gmail_thread_llm_draft` still grows via migration (not renamed/unified)
- ❌ `campaign_thread` CHECK constraint grows to 3-way mutual exclusivity

---

### Layer 2: Python — Channel Adapter Protocol

The current coordinator (`ThreadProcessingCoordinatorWorkflow`) branches on `candidate.gmail_account_id is not None` vs `candidate.smtp_account_id is not None`. A `ChannelAdapter` Protocol makes this branching explicit and extensible:

```python
# apps/backend/src/channels/base.py  (new file)

from typing import Protocol, runtime_checkable, Any
from uuid import UUID

@runtime_checkable
class ChannelAdapter(Protocol):
    """Defines the interface every messaging channel must implement."""

    channel_type: str  # 'gmail' | 'smtp' | 'instagram_dm'

    async def ingest_raw_message(self, raw_payload: Any) -> str:
        """
        Parse and store a raw channel message (webhook payload or polled item).
        Returns the channel_thread_id for this message.
        """
        ...

    async def create_thread_state(
        self, channel_thread_id: str, account_id: UUID, user_id: UUID
    ) -> "Candidate":
        """
        Create initial thread state row and return a Candidate for the coordinator.
        """
        ...

    async def load_thread_context(
        self, channel_thread_id: str, account_id: UUID
    ) -> "ThreadView":
        """
        Load the complete thread (all messages, metadata) for AI context construction.
        Returns a channel-agnostic ThreadView.
        """
        ...

    async def send_reply(
        self, channel_thread_id: str, account_id: UUID, body: str, **kwargs: Any
    ) -> None:
        """
        Send a reply via this channel.
        Gmail: calls Gmail API (draft + send).
        SMTP: sends via SMTP relay.
        Instagram DM: calls Messaging API.
        """
        ...

    def build_thread_xml(self, thread: "ThreadView") -> str:
        """
        Serialize thread into the XML format used for LLM context.
        Channel-specific fields (subject, CC/BCC for email; window_expires_at for DMs)
        are handled by each implementation.
        """
        ...
```

**Existing adapter implementations** (wrapping current code):

```python
# apps/backend/src/channels/gmail_adapter.py
class GmailAdapter:
    channel_type = 'gmail'

    def __init__(self, gmail_service: GmailService, db: Database): ...

    async def ingest_raw_message(self, raw_payload: dict) -> str:
        # Delegates to existing ingest_single_message_activity logic
        ...

    async def send_reply(self, channel_thread_id, account_id, body, **kwargs):
        # Delegates to existing GmailService.send_reply()
        subject = kwargs.get('subject')
        in_reply_to = kwargs.get('in_reply_to_message_id')
        ...
```

**New adapter for IG DMs**:

```python
# apps/backend/src/channels/instagram_dm_adapter.py
class InstagramDmAdapter:
    channel_type = 'instagram_dm'

    def __init__(self, ig_service: InstagramDmService, db: Database): ...

    async def ingest_raw_message(self, raw_payload: dict) -> str:
        # Parse Meta webhook payload, store to ig_dm_message table
        conversation_id = raw_payload['entry'][0]['messaging'][0]['sender']['id']
        ...

    async def send_reply(self, channel_thread_id, account_id, body, **kwargs):
        # Calls Meta Messaging API: POST /{ig-user-id}/messages
        # No subject, no CC/BCC — body only
        ...

    def build_thread_xml(self, thread: ThreadView) -> str:
        # Omits <subject>, <to>, <cc>, <bcc>
        # Adds <channel>instagram_dm</channel>, <window_expires_at>...</window_expires_at>
        ...
```

**Coordinator integration** — replaces `if candidate.gmail_account_id` branching:

```python
# thread_processing_coordinator_workflow.py (modified)
class ThreadProcessingCoordinatorWorkflow:

    ADAPTER_REGISTRY: dict[str, type[ChannelAdapter]] = {
        'gmail': GmailAdapter,
        'smtp': SmtpAdapter,
        'instagram_dm': InstagramDmAdapter,
    }

    @workflow.run
    async def run(self, candidate: Candidate) -> None:
        adapter = self.ADAPTER_REGISTRY[candidate.channel_type](...)

        # Channel-specific pre-processing
        if candidate.channel_type == 'gmail':
            await workflow.execute_activity(ensure_complete_thread_ingested, ...)

        # Shared coordinator logic (unchanged)
        await ThreadAssociateToCampaignWorkflow.run(candidate, adapter)
        await ThreadResponseDraftWorkflow.run(candidate, adapter)
        ...
```

Note: The adapter registry pattern requires injecting or constructing adapters within Temporal workflows. Since Temporal activities are plain Python functions (not class methods), the adapter would typically be instantiated inside activities or passed via activity parameters. The exact injection pattern depends on whether Cheerful uses Temporal's dependency injection or direct instantiation.

**Existing code impact**:
- `ThreadProcessingCoordinatorWorkflow`: Replace `if gmail_account_id / elif smtp_account_id` branching with `adapter = ADAPTER_REGISTRY[candidate.channel_type]`
- `Candidate` object: Add `channel_type: str` discriminator field (currently implicit from which account_id is set)
- All channel-specific services (`GmailService`, `SmtpEmailService`): Wrapped by adapters; no changes to existing service code
- `ThreadResponseDraftWorkflow`: Use `adapter.build_thread_xml()` instead of `EmailLoaderService.get_complete_thread()`

---

### Layer 3: Frontend — Unified Thread Type

Replace email-specific types with a discriminated union TypeScript type:

```typescript
// apps/webapp/app/utils/thread-types.ts  (new file, replaces gmail-types.ts)

export type ChannelType = 'gmail' | 'smtp' | 'instagram_dm';

// Shared fields across all channels
interface BaseThread {
    id: string;
    channel: ChannelType;          // discriminator
    threadStateId?: string;        // replaces gmail_thread_state_id
    senderName: string;
    snippet: string;
    lastMessageDate: string;
    isUnread: boolean;
    campaignId?: string;
    giftingStatus?: string;
    paidPromotionStatus?: string;
    flags?: ThreadFlags;
}

interface BaseMessage {
    id: string;
    threadId: string;
    senderName: string;
    date: string;
    read: boolean;
    text: string;  // plain text body (always present)
}

// Email-specific extension
export interface EmailMessage extends BaseMessage {
    senderEmail: string;
    subject: string;
    bodyHtml?: string;
    to: string[];
    cc: string[];
    attachments: Attachment[];
    messageIdHeader?: string;
}

export interface EmailThread extends BaseThread {
    channel: 'gmail' | 'smtp';
    subject: string;
    senderEmail: string;
    accountEmail?: string;
    messages: EmailMessage[];
}

// Instagram DM extension
export interface IgDmMessage extends BaseMessage {
    senderHandle: string;          // @ig_username
    mediaUrls?: string[];          // image/video attachments
    isEcho?: boolean;              // true if outbound (sent by Cheerful user)
}

export interface IgDmThread extends BaseThread {
    channel: 'instagram_dm';
    senderHandle: string;          // @ig_username
    igAccountId: string;           // user_ig_dm_account.id
    windowExpiresAt?: string;      // ISO datetime; null if no active window
    messages: IgDmMessage[];
}

// Discriminated union
export type Thread = EmailThread | IgDmThread;

// Type guards
export function isEmailThread(t: Thread): t is EmailThread {
    return t.channel === 'gmail' || t.channel === 'smtp';
}

export function isIgDmThread(t: Thread): t is IgDmThread {
    return t.channel === 'instagram_dm';
}
```

**Component usage** (discriminated union enables type narrowing):

```tsx
// mail-display.tsx (simplified)
function ReplyComposer({ thread }: { thread: Thread }) {
    if (isIgDmThread(thread)) {
        return <DmComposer thread={thread} />;  // IgDmThread guaranteed by TypeScript
    }
    return <EmailComposer thread={thread} />;   // EmailThread guaranteed by TypeScript
}
```

**Migration path for frontend**:
1. Create `thread-types.ts` alongside existing `gmail-types.ts` (no breaking change)
2. Add `channel` field to backend API response (backend migration)
3. Update `threads-adapters.ts` to populate `channel` field and return `Thread` union
4. Migrate components one at a time to use `Thread` instead of `GmailThread`
5. Delete `gmail-types.ts` after all components migrated

**`GmailThread` backward compatibility** — alias for zero-downtime migration:
```typescript
// gmail-types.ts (deprecated, will be removed)
import { EmailThread } from './thread-types';
/** @deprecated Use EmailThread from thread-types.ts */
export type GmailThread = EmailThread;
```

---

### Layer 4: Backend API — Unified Thread Endpoint

Currently: `GET /api/threads?account_ids={gmail_account_ids}` returns `ThreadWithMessages[]` with Gmail/SMTP-specific fields.

**Abstracted endpoint**: `GET /api/threads?account_ids={any_account_ids}&channels=gmail,smtp,instagram_dm`

- `account_ids` is polymorphic: can be Gmail account IDs, SMTP account IDs, or IG DM account IDs (or all)
- `channels` filter allows inbox-type filtering
- Response shape: `Thread[]` (unified DTO) with `channel` discriminator

This requires the backend `ThreadWithMessages` Pydantic model to be extended with channel metadata. The existing endpoint can remain unchanged for backward compatibility, with the new polymorphic endpoint added separately.

---

## Migration Strategy

Three sub-strategies with different risk/effort profiles:

### Strategy 1: Big Bang Refactor (Full Abstraction)

Rename all existing email-specific tables, types, and files to channel-agnostic names. Add IG DM support simultaneously.

**Sequence**:
1. Create DB migration: rename `gmail_thread_state` → `thread_state` + add `channel` column; rename `gmail_thread_llm_draft` → `thread_llm_draft`; normalize `campaign_thread` to use FK-to-thread
2. Create Python adapters for Gmail + SMTP wrapping existing code
3. Update coordinator to use adapter registry
4. Create `InstagramDmAdapter`
5. Update frontend types: `GmailThread` → `Thread` discriminated union
6. Update all components, hooks, adapters

**Effort**: Very High (+8–12 dev days on top of base IG DM feature)
**Risk**: High — touches every layer simultaneously; extensive regression testing required
**Result**: Clean, consistent naming and architecture throughout

### Strategy 2: Façade Pattern (Medium Abstraction)

Keep existing tables and code unchanged. Add an abstraction LAYER on top. New IG DM channel implements the new interface from day one. Existing channels are wrapped by adapters.

**Sequence**:
1. Define `ChannelAdapter` Protocol (Python) and `Thread` type (TypeScript)
2. Create `GmailAdapter` and `SmtpAdapter` wrapping existing services (no existing code changes)
3. Extend coordinator to use adapter registry (minimal change — adds `channel_type` branch, keeps existing branches working)
4. Create `InstagramDmAdapter` as the first native adapter implementation
5. Frontend: add `channel` discriminator to existing `GmailThread` type (non-breaking); add `IgDmThread` for new DM threads

**Effort**: Medium (+3–5 dev days on top of base IG DM feature)
**Risk**: Low-Medium — existing code is not modified; adapters delegate to existing code
**Result**: Consistent interface for new code; legacy naming remains in existing code until cleaned up

### Strategy 3: Incremental Rename + Parallel Path (Light Abstraction)

Fix the most confusing naming artifacts, then add IG DM as a standard parallel path. No architectural refactor.

**Sequence**:
1. Rename `GmailThreadStatus` → `ThreadStatus` (trivial find-replace; both Gmail and SMTP already use it)
2. Rename `GmailMessageDirection` → `MessageDirection`
3. Add `channel_type` to `Candidate` object (backward compatible: inferred from existing `account_id` fields)
4. Add `channel` field to `GmailThread` frontend type (additive, backward compatible)
5. Add IG DM as parallel path (same as `option-parallel-tables`)
6. Update coordinator with third `elif candidate.ig_dm_account_id is not None` branch

**Effort**: Very Low (+1–2 dev days on top of base IG DM feature)
**Risk**: Lowest — no structural refactoring; only naming improvements
**Result**: Slightly cleaner naming; IG DM added as parallel path; no true abstraction achieved

---

## Abstraction Matrix by Layer

| Layer | Sub-option | Effort | Risk | Benefit |
|-------|-----------|--------|------|---------|
| **DB: thread table** | 1A Polymorphic | High | High (migration) | Maximum extensibility, no CHECK constraint growth |
| **DB: thread table** | 1B Union View | Low | Minimal | Query abstraction, no code changes |
| **Python: adapter protocol** | Full Protocol | Medium | Low | Clean interface; easy 4th channel add |
| **Python: naming only** | Rename enums | Minimal | Minimal | Removes cognitive friction |
| **Frontend: types** | Discriminated union | Medium | Low | TypeScript safety; clean component structure |
| **Frontend: type alias** | Add `channel` field | Minimal | Minimal | Enables channel-conditional rendering |
| **API: unified endpoint** | Polymorphic endpoint | Medium | Low | Single fetch for mixed-channel inbox |

---

## Compatibility with Existing Architecture

### Temporal Workflows

The `ChannelAdapter` Protocol is compatible with Temporal's activity model. Activities are plain Python functions; adapters can be instantiated at the start of each activity using dependency injection or a factory pattern. No workflow structure changes are required — the coordinator can use the adapter registry pattern internally.

**Event-sourced state**: The append-only thread state invariant is preserved regardless of whether per-channel tables or a unified `thread_state` table is used. The abstraction does not change the state machine semantics.

### Supabase RLS

**Per-channel tables** (1B / parallel path): RLS policies are additive — existing policies unchanged; new `ig_dm_*` table policies follow the same `user_id = auth.uid()` pattern.

**Unified `thread` table** (1A): RLS cannot use an FK to enforce `account_id` ownership (polymorphic FK). Alternative: RLS policy uses a lookup function:
```sql
CREATE POLICY "thread_user_isolation" ON thread
    USING (user_id = auth.uid());
```
Since `user_id` is a direct column (not via polymorphic FK), this is sufficient for row isolation but does not verify that `account_id` belongs to the user — that must be enforced in application code.

### Pydantic / SQLAlchemy Core

Abstract base models can be defined using Pydantic inheritance:
```python
class BaseThreadState(BaseModel):
    id: UUID
    user_id: UUID
    status: ThreadStatus
    latest_internal_date: datetime

class GmailThreadState(BaseThreadState):
    gmail_account_id: UUID
    gmail_thread_id: str

class IgDmThreadState(BaseThreadState):
    ig_dm_account_id: UUID
    ig_conversation_id: str
```

This is additive — no changes to existing `GmailThreadState` model; `BaseThreadState` is extracted from it.

---

## Effort Estimate

Relative to `option-direct-meta-api` (baseline: ~20–28 dev days):

| Strategy | Additional Days | Total with Direct Meta API |
|----------|-----------------|---------------------------|
| Strategy 1 (Big Bang) | +8–12 days | ~28–40 days |
| Strategy 2 (Façade) | +3–5 days | ~23–33 days |
| Strategy 3 (Incremental) | +1–2 days | ~21–30 days |

Note: The abstraction work is largely **one-time overhead** — if a 4th channel is later added, it requires only implementing the adapter interface rather than adding more branching.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Scope creep — abstraction grows beyond the task | High | Define abstraction boundary explicitly; timebox |
| Premature generalization — only one new channel justifies abstraction | Medium | Evaluate based on WhatsApp/LinkedIn roadmap; if no 4th channel in 12 months, Strategy 3 only |
| Migration regression (Strategy 1) | High | Feature flags; parallel-run old and new code; comprehensive integration tests |
| Polymorphic FK loses referential integrity (1A) | Medium | Enforce in application layer; document gap; add periodic integrity check |
| Temporal adapter injection complexity | Low | Use simple factory function pattern; avoid over-engineering injection |
| Frontend type migration breaks existing components | Medium | Type alias backward compat pattern; migrate component by component |
| RLS gap in polymorphic table (1A) | Medium | Use `user_id` direct column for RLS; document that `account_id` ownership is application-enforced |

---

## When This Pattern Makes Sense

**Strong case for abstraction** (Strategy 2 or 1):
- Cheerful plans to add WhatsApp, LinkedIn, or SMS within 12 months (the 4th channel would be trivial to add)
- The `GmailThreadStatus`/`GmailThread` naming confusion causes real day-to-day friction in the team
- The `gmail_thread_llm_draft` kitchen-sink pattern has already caused bugs or difficult migrations

**Weak case — Strategy 3 only** (incremental):
- Instagram DMs is an isolated feature; no additional channels planned
- Team is small and prefers fewer abstractions
- Shipping speed is the primary concern

**Not recommended** (no abstraction, pure parallel):
- If the team wants zero disruption to existing code and is comfortable with a 3-way CHECK constraint on `campaign_thread` and a growing `gmail_thread_llm_draft` table
- See `option-parallel-tables` for this path

---

## Combination with API Options

This architecture pattern is **fully orthogonal** to the API access choice:

| API Option | Compatible with Channel Abstraction? | Notes |
|---|---|---|
| `option-direct-meta-api` | ✅ Yes | `InstagramDmAdapter` wraps Meta Messaging API calls |
| `option-graph-api-polling` | ✅ Yes | Polling loop triggers adapter `ingest_raw_message()` |
| `option-composio-relay` | ✅ Yes | `InstagramDmAdapter` delegates outbound to `composio_adapter.py` |
| `option-third-party-relay` | ✅ Yes | `InstagramDmAdapter` translates Bird webhook payloads to internal format |

The recommended combination (if abstraction is chosen) is **Strategy 2 (Façade) + Direct Meta API**, as it provides clean interfaces for future channels without requiring a disruptive migration before the IG DM feature ships.

---

## Key Files Affected

| File | Change |
|------|--------|
| `apps/backend/src/models/database/gmail_thread_state.py` | Rename `GmailThreadStatus` → `ThreadStatus`; or add alias |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Replace channel discriminator branches with adapter registry |
| `apps/backend/src/temporal/models/candidate.py` | Add `channel_type: str` field |
| `apps/backend/src/channels/` (new dir) | `base.py` (Protocol), `gmail_adapter.py`, `smtp_adapter.py`, `instagram_dm_adapter.py` |
| `apps/webapp/app/utils/gmail-types.ts` | Add `channel` field; or replace with new `thread-types.ts` |
| `apps/webapp/lib/threads-adapters.ts` | Populate `channel` field; add DM transformation function |
| `apps/webapp/app/(mail)/mail/components/mail-display.tsx` | Replace email-specific composer with channel-discriminated rendering |
| DB migrations | `thread_state` unified table (Strategy 1) or view (Strategy 1B) or nothing (Strategy 3) |

---

## Summary

The Channel Abstraction option is an **architectural investment** that trades upfront effort for long-term extensibility. The degree of investment is configurable: Strategy 3 (rename + naming cleanup + `channel_type` field) adds minimal overhead while immediately improving clarity; Strategy 1 (full table normalization + Protocol + unified frontend type) achieves maximum consistency at significant migration cost.

The most pragmatic approach for a small team is **Strategy 2 (Façade + Protocol)**: define a clean `ChannelAdapter` interface, wrap existing Gmail/SMTP code in adapters, and implement `InstagramDmAdapter` as the first native adapter. This avoids disruptive DB migration while establishing the interface that a future WhatsApp or LinkedIn channel would implement.
