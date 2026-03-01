# IG DM Infrastructure Overlap — Shared Webhook Architecture Analysis

**Aspect**: `current-ig-dm-overlap`
**Wave**: 2 — Internal Landscape
**Date**: 2026-03-01
**Input files**:
- `../cheerful-ig-dm-spec/PROMPT.md` — IG DM spec goals and architecture decisions
- `../cheerful-ig-dm-spec/frontier/aspects.md` — spec progress (50% complete)
- `../cheerful-ig-dm-spec/analysis/spec/api-contracts.md` — exact webhook endpoint specs
- `../cheerful-ig-dm-spec/analysis/spec/db-migrations.md` — `user_ig_dm_account` table, `ig_igsid_cache`
- `../cheerful-ig-dm-spec/analysis/spec/temporal-interfaces.md` — workflow/activity signatures
- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — Meta webhook architecture
- `analysis/story-mention-capture.md` — Story mention event delivery mechanics

---

## Overview

The Cheerful IG DM integration (`cheerful-ig-dm-spec/`) is currently ~50% specced and covers the **Messaging API webhook infrastructure** — the same infrastructure that delivers Instagram Story @mention events. This analysis maps exactly which components from the IG DM integration are shared with UGC capture, what UGC capture gets "for free," and what additional work is required.

**Core finding**: Story mention capture has the **highest infrastructure overlap** of any UGC capture method. It requires zero new webhook infrastructure — the endpoint, verification, subscription setup, token management, IGSID resolution, and media download patterns are all either already specced for IG DMs or can be extended with minimal changes.

---

## 1. The Messaging API Webhook: One Endpoint, Multiple Event Types

The Meta Messaging API delivers multiple event types through a single webhook endpoint:

```
POST /webhooks/instagram/
```

All Instagram Messaging API events arrive in the same `entry[].messaging[]` array structure:

| Event Key | Event Type | Primary Use |
|-----------|------------|-------------|
| `message` | Inbound DM text/media | IG DM integration |
| `message.is_echo == true` | Outbound DM echo | IG DM integration |
| `mention` | Story @mention by creator | UGC Story capture |
| `postback` | Quick reply button tap | IG DM integration (optional) |
| `read` | Read receipt | IG DM integration (optional) |
| `delivery` | Delivery receipt | IG DM integration (optional) |

Additionally, Graph API webhook events (different from Messaging API) arrive at the **same webhook URL** via a different path in the payload:

```
entry[].changes[] → Graph API events (mentions in captions/comments)
entry[].messaging[] → Messaging API events (DMs + Story mentions)
```

This means a single webhook handler must route from two different `entry` sub-keys.

---

## 2. Exact Shared Infrastructure: What the IG DM Spec Already Covers

### 2.1 Webhook Endpoint

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/api-contracts.md`

```
File: apps/backend/src/api/route/ig_dm_webhook.py
Mount: app-level (main.py), at /webhooks/instagram (NOT under /api/)
```

Both DMs and Story mentions arrive at this exact same URL. Zero new endpoint needed.

| Route | Purpose | Shared? |
|-------|---------|---------|
| `GET /webhooks/instagram/` | Hub.challenge verification | ✅ 100% shared |
| `POST /webhooks/instagram/` | Inbound event delivery | ✅ 100% shared |

**HMAC-SHA256 verification** (X-Hub-Signature-256) applies to ALL events — no per-event-type difference. The verification code written for DMs applies equally to Story mention events.

### 2.2 Database: `user_ig_dm_account` Table

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/db-migrations.md` (Section 1)

The IG DM spec adds this table for storing Instagram Business Account OAuth tokens, FB Page IDs, and webhook subscription state:

```sql
CREATE TABLE IF NOT EXISTS user_ig_dm_account (
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                       UUID NOT NULL REFERENCES auth.users(id),
    instagram_business_account_id TEXT NOT NULL,  -- brand's IG account ID
    facebook_page_id              TEXT NOT NULL,  -- linked FB Page
    ig_username                   TEXT NOT NULL,
    access_token                  TEXT NOT NULL,  -- long-lived page access token
    access_token_expires_at       TIMESTAMPTZ NOT NULL,
    webhook_subscribed            BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_subscribed_at         TIMESTAMPTZ,
    is_active                     BOOLEAN NOT NULL DEFAULT TRUE,
    ...
);
```

**For UGC Story capture**: This table is 100% reusable as-is. The same brand Instagram account used for DMs is the same account that receives Story mention events. No new credential storage needed — UGC Story capture piggybacks on the existing account connection.

The `facebook_page_id` and `access_token` columns are exactly what's needed to:
1. Subscribe to the `mention` field in page-level webhooks
2. Call `GET /{ig_user_id}/mentioned_media` to fetch Story media CDN URLs

### 2.3 Database: `ig_igsid_cache` Table

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/db-migrations.md` (Section 4)

```sql
CREATE TABLE IF NOT EXISTS ig_igsid_cache (
    igsid          TEXT PRIMARY KEY,
    ig_username    TEXT,
    display_name   TEXT,
    profile_pic    TEXT,
    resolved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ NOT NULL,
    resolution_error TEXT,
);
```

**For UGC Story capture**: Story mention events deliver the creator's IGSID in `messaging[].sender.id`. The exact same IGSID → username resolution is needed for linking captured UGC to known Cheerful creators. This table and its resolution logic are **100% shared**.

The `ig_igsid_resolution_activity` specced for DMs (resolves IGSID via `GET /{igsid}?fields=name,username`) can be called identically for Story mention events.

### 2.4 IGSID Resolution Activity

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/temporal-interfaces.md`

```python
# File: apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py

@activity.defn
async def resolve_igsid_activity(
    params: IgIsidResolutionParams,  # { igsid: str, page_access_token: str }
) -> IgIsidResolutionResult:        # { username: str | None, display_name: str | None, cached: bool }
    """Check ig_igsid_cache; fallback to GET /{igsid}?fields=name,username; cache result."""
```

**For UGC Story capture**: Called identically. The IGSID in a Story mention event (`messaging[].sender.id`) is the same type as in a DM event. Same activity, same cache, same Graph API call.

### 2.5 Media Download Infrastructure

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/temporal-interfaces.md`

```python
# File: apps/backend/src/temporal/activity/ig_dm_media_download_activity.py

@activity.defn
async def download_ig_dm_media_activity(
    params: IgDmMediaDownloadParams,  # { media_url: str, storage_path: str, ... }
) -> IgDmMediaDownloadResult:         # { storage_path: str, content_type: str }
    """Download ephemeral media URL; upload to Supabase Storage."""
```

**For UGC Story capture**: Story media download follows the same pattern — ephemeral CDN URL → bytes → Supabase Storage. The existing `post-media` Supabase Storage bucket (confirmed in `current-post-tracking.md`) already handles image/video. A new `ugc-stories/` path within the bucket is the only addition. The download implementation from `services/post_tracking/media_storage.py` (`download_and_store_media`) is also already available.

### 2.6 Facebook Page Requirement and OAuth

**Specced in**: `../cheerful-ig-dm-spec/analysis/spec/meta-oauth.md` (pending) and `../cheerful-ig-dm-spec/analysis/spec/db-migrations.md`

The FB Page requirement is identical for DMs and Story mentions:
- Both require a connected Facebook Page linked to the Instagram Professional Account
- Both use page-level access tokens for API calls and webhook subscriptions
- Both require the `instagram_manage_messages` permission (Advanced Access — requires App Review)

**For UGC Story capture**: No additional OAuth flow needed. When a brand connects Instagram for DMs (going through the IG DM OAuth flow), the Story mention subscription can be added simultaneously.

### 2.7 App Review Permission

`instagram_manage_messages` (Advanced Access) is the **same permission** required for both:
- Receiving DM webhooks (`messages` field)
- Receiving Story mention webhooks (`mention` field)

No additional App Review items needed. The DM integration's App Review covers Story capture too.

---

## 3. What Story Capture Adds Incrementally

### 3.1 Subscription Field: `mention`

The IG DM spec subscribes to these fields per page:

```python
# Current DM subscription (apps/backend/src/services/ig_dm/account_service.py or similar)
subscribed_fields = [
    "messages",
    "messaging_postbacks",
    "message_echoes",
]
```

For Story capture, add one field:

```python
subscribed_fields = [
    "messages",
    "messaging_postbacks",
    "message_echoes",
    "mention",  # ← Story @mention capture (ADD THIS)
]
```

**Effort**: 1 line of code in the page subscription call. **This is the smallest possible incremental change.**

The subscription is made when a brand connects their IG account (during the OAuth flow handled by the IG DM integration). If the account is already connected for DMs, an additional API call to `/{page_id}/subscribed_apps` is needed to add `mention` — or it can be part of the initial connection flow.

### 3.2 Webhook Event Router: `mention` Branch

The IG DM webhook handler in `ig_dm_webhook.py` currently (per spec) routes these event types:

```python
async def process_ig_webhook_payload(payload: MetaWebhookPayload) -> None:
    for entry in payload.entry:
        for event in entry.messaging:
            if "message" in event and not event.get("message", {}).get("is_echo"):
                # → IgDmIngestWorkflow
                await trigger_ig_dm_ingest(event)
            elif event.get("message", {}).get("is_echo"):
                # → echo handling (track outbound)
                pass
            elif "postback" in event:
                # → optional postback handling
                pass
```

**Incremental addition** for Story capture:

```python
        elif "mention" in event:
            # → Story @mention UGC capture
            await trigger_story_mention_workflow(event)
```

**Plus** Graph API changes events on the same endpoint:

```python
        for change in entry.changes:
            if change.field == "mentions":
                # → Feed caption/comment @mention UGC capture
                await trigger_feed_mention_workflow(change)
```

**Effort**: ~10 lines of routing code in the existing webhook handler. No new handler file, no new endpoint.

### 3.3 New: `StoryMentionWorkflow` (Temporal)

This is net-new work with no DM equivalent:

```python
# New file: apps/backend/src/temporal/workflow/story_mention_workflow.py

@workflow.defn
class StoryMentionWorkflow:
    @workflow.run
    async def run(self, params: StoryMentionWorkflowInput) -> StoryMentionResult:
        """
        Input: { media_id, sender_igsid, timestamp, brand_ig_account_id, page_access_token }

        Steps:
        1. Deduplicate: check ugc_content by (brand_ig_user_id, ig_media_id)
        2. Fetch CDN URL: GET /{ig_user_id}/mentioned_media?media_id={media_id}
        3. Download media: download_ig_story_media_activity → Supabase Storage
        4. Upsert ugc_content row (capture_source='story_mention')
        5. Resolve creator: resolve_igsid_activity (SHARED with DM)
        6. Link to campaign: match_ugc_to_campaign_activity (NEW)
        """
```

**Effort**: Medium. The workflow pattern is well-established (mirrors `IgDmIngestWorkflow`). The activities either reuse DM activities or are straightforward adaptations.

### 3.4 New: `capture_story_media_activity`

```python
# New file: apps/backend/src/temporal/activity/story_mention_activity.py

@activity.defn
async def fetch_story_mentioned_media_activity(
    params: StoryMentionedMediaParams,
    # { ig_user_id: str, media_id: str, page_access_token: str }
) -> StoryMentionedMediaResult:
    # { cdn_url: str, media_type: str }
    """Call GET /{ig_user_id}/mentioned_media to get CDN URL."""

@activity.defn
async def download_ig_story_media_activity(
    params: StoryMediaDownloadParams,
    # { cdn_url: str, brand_id: str, media_id: str, media_type: str }
) -> str:
    # returns storage_path in Supabase Storage
    """Download Story CDN URL and store to post-media/ugc-stories/{brand_id}/{media_id}.{ext}"""
```

The `download_ig_story_media_activity` body is nearly identical to `download_ig_dm_media_activity` — same pattern (URL → bytes → Supabase Storage), different storage path.

**Effort**: Small. Two simple activities; the hard parts (HTTP download, Supabase Storage client) are already implemented in `services/post_tracking/media_storage.py`.

### 3.5 New: `ugc_content` Table Row Creation

As established in `current-post-tracking.md`, the right architecture is a separate `ugc_content` table (Option B) rather than extending `creator_post`. Story captures create rows with:

```sql
INSERT INTO ugc_content (
    brand_ig_user_id,      -- from user_ig_dm_account.instagram_business_account_id
    creator_igsid,         -- from messaging[].sender.id
    creator_ig_handle,     -- resolved via ig_igsid_cache
    ig_media_id,           -- mention.media_id from webhook
    capture_source,        -- 'story_mention'
    media_type,            -- 'IMAGE' or 'VIDEO'
    cdn_url,               -- ephemeral; from mentioned_media response
    stored_media_path,     -- permanent; Supabase Storage path
    posted_at,             -- from webhook timestamp
    captured_at            -- NOW()
)
ON CONFLICT (brand_ig_user_id, ig_media_id) DO NOTHING;
```

**Note**: `ugc_content` table creation is shared work — all UGC methods (feed mentions, photo tags, hashtags, Story mentions) write to this same table. The table schema is defined in Wave 3 options.

---

## 4. Complete Shared Component Inventory

### 4.1 Components Shared 100% (Zero New Work)

| Component | File (IG DM Spec) | What It Does for UGC |
|-----------|-------------------|----------------------|
| `POST /webhooks/instagram/` endpoint | `api/route/ig_dm_webhook.py` | Receives Story mention events |
| `GET /webhooks/instagram/` endpoint | `api/route/ig_dm_webhook.py` | Hub.challenge verification |
| HMAC-SHA256 verification | `ig_dm_webhook.py` | Validates Story mention payloads |
| `user_ig_dm_account` table | Migration `20260228000000` | Stores tokens for `mentioned_media` calls |
| `ig_igsid_cache` table | Migration `20260228000000` | Caches creator IGSID → username |
| `resolve_igsid_activity` | `activity/ig_igsid_resolution_activity.py` | Resolves Story sender IGSID |
| `post-media` Supabase Storage bucket | Migration `20260204000003` | Already exists; UGC uses sub-path |
| `download_and_store_media` service | `services/post_tracking/media_storage.py` | Same download → storage pattern |
| FB Page OAuth flow | (IG DM OAuth spec) | Same connected account |
| `instagram_manage_messages` App Review | (App-level permission) | Same permission covers `mention` field |
| `entry[].messaging[]` iteration | `ig_dm_webhook.py` | Story mentions arrive in same array |
| `MetaWebhookPayload` Pydantic model | `models/temporal/ig_dm_ingest.py` | Same top-level envelope |

### 4.2 Components with Incremental Changes (1–10 lines)

| Component | Change | Effort |
|-----------|--------|--------|
| Page subscription call | Add `"mention"` to `subscribed_fields` list | 1 line |
| Webhook event router | Add `elif "mention" in event:` branch + `changes[]` branch | ~10 lines |
| `MetaWebhookPayload` / event models | Add `MentionEvent` Pydantic model (has `mention.media_id`, `mention.media_type`) | ~5 lines |

### 4.3 New Components Required (Net-New Work)

| Component | File | Effort | Dependency |
|-----------|------|--------|------------|
| `StoryMentionWorkflow` | `temporal/workflow/story_mention_workflow.py` | Medium | DM infra must exist |
| `fetch_story_mentioned_media_activity` | `temporal/activity/story_mention_activity.py` | Small | `user_ig_dm_account.access_token` |
| `download_ig_story_media_activity` | `temporal/activity/story_mention_activity.py` | Small | `post-media` bucket exists |
| `ugc_content` table | New migration | Medium | Shared with all UGC methods |
| `match_ugc_to_campaign_activity` | `temporal/activity/ugc_attribution_activity.py` | Medium | `ugc_content` table, `campaign_creator` |

---

## 5. Webhook Event Routing Map

The single `POST /webhooks/instagram/` endpoint handles all Instagram webhook event types. The routing logic within the handler:

```
POST /webhooks/instagram/
  payload.object == "instagram"
  for entry in payload.entry:
    ├── entry.messaging[] (Messaging API events — DMs + Story mentions)
    │   ├── event has "message" key
    │   │   ├── is_echo == false → IgDmIngestWorkflow (DM integration)
    │   │   └── is_echo == true  → echo tracking (DM integration)
    │   ├── event has "mention" key → StoryMentionWorkflow (UGC capture)
    │   └── event has "postback" key → postback handler (DM optional)
    │
    └── entry.changes[] (Graph API events — feed mentions, photo tags)
        ├── change.field == "mentions" → FeedMentionWorkflow (UGC capture)
        └── change.field == "feed" → (other Graph API events, filtered out)
```

**Key insight**: The DM integration spec currently only processes `entry.messaging[]`. When Graph API `mentions` webhook is added for UGC capture, the same handler gains `entry.changes[]` processing. This is additive and non-breaking.

---

## 6. Story Capture Gets for Free vs. Incremental Work

### Gets for Free (Zero Additional Setup)

When a brand connects Instagram for DMs:

1. **Webhook endpoint is live** — `POST /webhooks/instagram/` is up, verified, and receiving events
2. **HMAC verification** — Story mention payloads are verified exactly like DM payloads
3. **Facebook Page connection** — required for both DMs and Story mentions; single OAuth flow
4. **Long-lived page access token** — stored in `user_ig_dm_account.access_token`; used for both DM replies and `mentioned_media` API calls
5. **IGSID resolution** — `ig_igsid_cache` and `resolve_igsid_activity` work identically for Story sender IGSIDs
6. **App Review approval** — `instagram_manage_messages` covers both DMs and Story `mention` field
7. **Media download infrastructure** — `download_and_store_media` service and `post-media` bucket exist

### What "Free" Really Means

If IG DM integration is deployed, enabling Story capture requires:

| Task | Lines of Code | Time Estimate |
|------|--------------|---------------|
| Add `mention` to page subscription | 1 line | 5 min |
| Add routing branch for `mention` events | ~10 lines | 30 min |
| Add `MentionEvent` Pydantic model | ~10 lines | 20 min |
| Build `StoryMentionWorkflow` | ~100 lines | 1–2 days |
| Build story media activities | ~80 lines | 1 day |
| Create `ugc_content` table migration | ~60 lines SQL | 1 day |
| Create attribution/campaign-linking logic | ~150 lines | 2–3 days |

**Total incremental engineering**: ~4–7 days assuming IG DM integration is complete. Without DM integration, this effort roughly doubles (need to build all the shared infrastructure from scratch).

### What Is NOT Free

Even with full DM integration:
- `StoryMentionWorkflow` is new Temporal workflow code
- `mentioned_media` API call is new (DMs don't use this endpoint)
- `ugc_content` table is new (no existing analog for brand-level UGC)
- Campaign attribution logic is new (DMs go to `campaign_thread`; UGC attribution is different)
- Monitoring/alerting for 24h download deadline is new operational concern (no equivalent in DM flow)

---

## 7. Feed Mention Overlap (Graph API `mentions` Webhook)

Beyond Story mentions (Messaging API), the Graph API `mentions` webhook also arrives at `POST /webhooks/instagram/` but via `entry.changes[]`:

### What's Shared with DM Infrastructure

| Component | Shared? | Notes |
|-----------|---------|-------|
| Webhook endpoint URL | ✅ | Same URL, different payload path |
| HMAC verification | ✅ | Same |
| `user_ig_dm_account` credentials | ✅ | Same brand IG account |
| FB Page requirement | ✅ | Same |

### What's NOT Shared

The Graph API `mentions` subscription is a **different subscription** from the Messaging API subscription:

```python
# Messaging API subscription (for DMs + Story mentions)
# Already done by IG DM integration:
POST /{PAGE_ID}/subscribed_apps
    ?subscribed_fields=messages,message_echoes,messaging_postbacks,mention

# Graph API subscription (for feed @mentions in captions/comments)
# NEW — not part of IG DM integration:
POST /{APP_ID}/subscriptions
    ?object=instagram
    &fields=mentions        # ← graph API 'mentions' (plural), different system
```

The `changes[]` branch in the webhook handler is new code. The payload format is different from the `messaging[]` array.

---

## 8. IG DM Spec Status vs. UGC Dependencies

The IG DM spec is currently 50% complete (Wave 1 + most of Wave 2 done). The components Cheerful most needs for UGC Story capture overlap are already specced:

| IG DM Spec Component | Status | UGC Dependency |
|---------------------|--------|----------------|
| `spec-db-migrations` (user_ig_dm_account, ig_igsid_cache) | ✅ Done | Core dependency |
| `spec-pydantic-models` (MetaWebhookPayload) | ✅ Done | Webhook parsing |
| `spec-api-contracts` (webhook endpoints) | ✅ Done | Core dependency |
| `spec-temporal-interfaces` (IgDmIngestWorkflow, resolve_igsid_activity) | ✅ Done | Patterns to follow |
| `spec-meta-oauth` | ⬜ Pending | Required for OAuth setup docs |
| `spec-webhook-handler` | ⬜ Pending | Implementation spec |
| `spec-ingest-workflow` | ⬜ Pending | Pattern reference |
| `spec-creator-resolution` | ⬜ Pending | Critical shared component |

The pending specs don't block UGC design — the specced components already establish the architecture. But the `spec-webhook-handler` and `spec-creator-resolution` implementations are exactly what UGC Story capture will build upon.

---

## 9. Architecture Decision: Deploy Together vs. Separately

### Option A: UGC Story Capture Bundled with IG DM Integration

Add `mention` to the page subscription and routing branch at DM integration launch:

**Pros**:
- Single OAuth flow, single App Review, single brand connection UX
- No second migration window for adding `mention` to existing subscriptions
- Simpler operational model

**Cons**:
- Increases scope of the DM integration sprint
- `ugc_content` table and attribution logic are distinct features that may be deprioritized

### Option B: UGC Story Capture as a Follow-On Feature

Deploy DM integration first; add Story capture after:

**Pros**:
- Maintains focus on DM integration milestone
- Story capture can ship as a distinct product feature announcement

**Cons**:
- Requires re-issuing page subscription updates to all already-connected accounts
- Additional OAuth/re-auth complexity if brands need to re-consent (they likely don't — same permission)

**For existing accounts**: Adding `mention` to an existing page subscription requires a one-time API call per connected account. This can be done programmatically without user re-auth — the existing `page_access_token` in `user_ig_dm_account` is sufficient:

```python
# Backfill: add 'mention' to all existing connected pages
for account in await get_all_active_ig_dm_accounts():
    await subscribe_page(account.facebook_page_id, account.access_token, fields=[..., "mention"])
```

---

## 10. Shared Component Inventory Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                   FULLY SHARED COMPONENTS                        │
│  (built once for IG DM, used identically for Story UGC capture) │
│                                                                  │
│  ✓ POST /webhooks/instagram/    ✓ user_ig_dm_account table       │
│  ✓ GET /webhooks/instagram/     ✓ ig_igsid_cache table           │
│  ✓ HMAC-SHA256 verification     ✓ resolve_igsid_activity         │
│  ✓ MetaWebhookPayload model     ✓ post-media Storage bucket      │
│  ✓ FB Page OAuth flow           ✓ download_and_store_media svc   │
│  ✓ instagram_manage_messages    ✓ entry[].messaging[] iteration  │
│    (App Review)                                                   │
└─────────────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  IG DM Path      │        │  Story Capture Path   │
│  (message key)   │        │  (mention key)        │
│                  │        │                       │
│ IgDmIngestWF     │        │ StoryMentionWF (NEW)  │
│ ig_dm_message    │        │ ugc_content (NEW)     │
│ ig_dm_thread     │        │ mentioned_media call  │
│ ThreadCoordWF    │        │ (NEW activity)        │
└──────────────────┘        └──────────────────────┘
```

---

## 11. Key Findings

1. **Story capture is the highest-overlap UGC method** — it literally arrives on the same webhook, in the same payload structure, via the same Messaging API subscription as DMs.

2. **The only mandatory change to DM infrastructure** for Story capture is adding `"mention"` to the page subscription fields list (1 line) and an `elif "mention"` routing branch in the webhook handler (~10 lines).

3. **IGSID resolution is the most valuable shared component** — both DMs and Story mentions deliver a creator IGSID (not username); both need the same `ig_igsid_cache` and resolution activity to link events to Cheerful creators.

4. **Graph API `mentions` webhook** (for feed caption @mentions) also shares the webhook URL but uses a different subscription mechanism (`/{APP_ID}/subscriptions`, not `/{PAGE_ID}/subscribed_apps`). It's lower-overlap than Story mentions but still reuses the endpoint, HMAC verification, and brand credentials.

5. **The IG DM spec's pending `spec-webhook-handler`** will define exactly how the webhook handler dispatches events — UGC Story capture adds one routing branch to this same file. Coordinate the two specs so the webhook handler can accommodate both DM and UGC routing from the start.

6. **Deploy-together is architecturally cleaner**: adding `mention` at the time of initial page subscription avoids a backfill operation. Even if the `StoryMentionWorkflow` isn't built yet, subscribing to the field early means events will arrive (and can be ignored until the workflow is ready) rather than being silently missed.

7. **App Review is not a separate gate**: `instagram_manage_messages` (which the DM integration already needs) also covers the `mention` field subscription. Zero additional App Review items for Story capture.

---

## Sources

- `../cheerful-ig-dm-spec/frontier/aspects.md` — IG DM spec status (50% complete)
- `../cheerful-ig-dm-spec/analysis/spec/api-contracts.md` — webhook endpoint specs
- `../cheerful-ig-dm-spec/analysis/spec/db-migrations.md` — `user_ig_dm_account`, `ig_igsid_cache`
- `../cheerful-ig-dm-spec/analysis/spec/temporal-interfaces.md` — workflow/activity signatures
- `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md` — Meta webhook architecture
- `analysis/story-mention-capture.md` — Story mention delivery mechanics
- `analysis/current-post-tracking.md` — Existing `post-media` bucket, `download_and_store_media` service
