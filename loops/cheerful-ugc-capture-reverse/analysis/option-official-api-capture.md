# Option: Official API Capture — Full Integration Plan

**Aspect**: `option-official-api-capture`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-03-01
**Inputs**:
- `analysis/graph-api-mentions-tags.md` — Graph API `/tags` + `mentioned_media` endpoints
- `analysis/webhooks-mentions.md` — Graph API `mentions` webhook, delivery guarantees
- `analysis/hashtag-monitoring.md` — Hashtag API, 30-hashtag constraint, polling architecture
- `analysis/story-mention-capture.md` — Messaging API `mention` event, CDN expiry, TOS grey area
- `analysis/current-post-tracking.md` — Existing `creator_post` table, `PostTrackingWorkflow`, Apify pipeline
- `analysis/current-ig-dm-overlap.md` — Shared IG DM webhook infrastructure inventory
- `analysis/current-media-storage.md` — `post-media` Supabase Storage bucket, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` table design, handle normalization

---

## 1. Option Summary

**The Official API Capture option** uses Meta's documented, approved APIs exclusively to discover and ingest brand-relevant Instagram UGC — with zero creator opt-in required. It combines four complementary capture mechanisms, each covering a different content surface:

| Mechanism | Content Captured | Implementation Style |
|-----------|-----------------|---------------------|
| Graph API `mentions` webhook | Feed post caption/comment @mentions | Push (webhook) |
| Graph API `/tags` polling | Photo-tagged feed posts | Pull (polling, Temporal cron) |
| Messaging API `mention` event | Story @mentions | Push (webhook, shared with IG DM) |
| Hashtag API polling | Feed posts using monitored hashtags | Pull (polling, Temporal cron) |

**What it does NOT capture** (structural gaps of official API):
- Reels photo-tagged in-video (not returned by `/tags`)
- Stories without @mention of brand (no Messaging API event fires)
- Feed posts where creator uses Reels + no hashtag/mention (inconsistent `mentions` coverage)
- Content from private accounts (except Story mentions if brand follows creator)
- Untagged brand appearances in any content type (requires AI Radar — separate option)

**Core architectural property**: Every capture mechanism uses **the brand's own Page Access Token** — not the creator's. No creator consent or integration is required. Brands connect their Instagram Business Account once; all UGC discovery operates on that credential.

---

## 2. IG DM Integration Overlap — The Defining Architectural Insight

The most important property of this option is its high overlap with Cheerful's IG DM integration (`cheerful-ig-dm-spec/`). Understanding this determines the real build cost.

### 2.1 Shared Infrastructure Inventory

The following components from the IG DM spec are 100% shared with Official API Capture:

```
FULLY SHARED (built once for IG DM, used identically for UGC):
├── POST /webhooks/instagram/        — webhook endpoint URL
├── GET /webhooks/instagram/         — hub.challenge verification
├── X-Hub-Signature-256 verification — HMAC-SHA256 code
├── MetaWebhookPayload Pydantic model — top-level envelope parsing
├── entry[].messaging[] iteration    — Story mentions arrive here
├── user_ig_dm_account table         — brand IG credentials, FB Page, access token
├── ig_igsid_cache table             — IGSID → username cache
├── resolve_igsid_activity           — resolves Story sender's IGSID to handle
├── post-media Supabase Storage bucket — already supports images + video
├── download_and_store_media service  — CDN URL → bytes → Supabase Storage
├── FB Page OAuth flow               — brand Instagram account connection
└── instagram_manage_messages App Review — covers Story mention field too
```

### 2.2 What Each Capture Mechanism Gets for Free vs. Pays For

| Capture Mechanism | Free from IG DM Infra | Net-New Work |
|------------------|-----------------------|-------------|
| Story @mentions | Webhook endpoint, HMAC, IGSID resolution, token storage, media download service | `StoryMentionWorkflow`, 1 subscription field, `mentioned_media` API call |
| Feed @mentions (caption/comment) | Webhook endpoint, HMAC, token storage | New `changes[]` routing branch, `mentioned_media` fetch, `instagram_manage_comments` App Review |
| Photo-tag polling (`/tags`) | Token storage, Temporal cluster, media download service | New `UGCTagPollingWorkflow`, `instagram_manage_comments` App Review |
| Hashtag monitoring | Token storage, Temporal cluster, media download service | New `HashtagMonitoringWorkflow`, brand config UI, `instagram_public_content_access` App Review |

**The critical sequencing implication**: Story mention capture is the cheapest-per-value mechanism because it rides on IG DM infrastructure directly. Feed @mention capture is the second cheapest. Hashtag monitoring is the most independent (requires its own App Review and UI). Photo-tag polling sits between them.

---

## 3. End-to-End Architecture

### 3.1 Webhook Event Routing

The single `POST /webhooks/instagram/` endpoint receives all four event types (three via different code paths):

```
POST /webhooks/instagram/
  ↓ HMAC-SHA256 verification (existing, from IG DM infra)
  ↓ return HTTP 200 immediately
  ↓ background_tasks.add_task: route_instagram_webhook(payload)

route_instagram_webhook(payload: MetaWebhookPayload):
  for entry in payload.entry:
    │
    ├── entry.messaging[] (Messaging API events)
    │   ├── "message" key (not echo) → IgDmIngestWorkflow  [EXISTING: IG DM]
    │   ├── "message" key (is_echo)  → echo tracking        [EXISTING: IG DM]
    │   └── "mention" key            → StoryMentionWorkflow  [NEW: Story UGC]
    │
    └── entry.changes[] (Graph API events)
        ├── field == "mentions"      → FeedMentionWorkflow   [NEW: @mention UGC]
        └── field == other           → ignore
```

**Note**: `entry.changes[]` handling is entirely new — the IG DM integration only processes `entry.messaging[]`. Adding `changes[]` routing is additive and non-breaking.

### 3.2 Polling Architecture (Temporal Cron Workflows)

Two polling workflows run on cron schedules using the same scheduler pattern as `PostTrackingSchedulerWorkflow` (sleep + `continue_as_new`):

```
UGCTagPollingSchedulerWorkflow          UGCHashtagMonitoringSchedulerWorkflow
  ↓ every 10–15 min                       ↓ every 2–4 hours
UGCTagPollingWorkflow                   HashtagMonitoringWorkflow
  for each brand in user_ig_dm_account:    for each brand's hashtag config:
    GET /{ig_user_id}/tags                   GET /{hashtag_id}/recent_media
    → cursor-paginated results               → parse 25 posts
    → deduplicate vs ugc_content             → deduplicate vs ugc_content
    → download new media                     → download new media
    → upsert ugc_content rows                → upsert ugc_content rows
    → store cursor for next poll             → store poll cursor
```

### 3.3 Complete Data Flow Per Capture Path

#### Path A: Feed @mention (caption or comment) — Webhook + Fetch

```
1. Creator posts "Loving @brand new products!" on Instagram
2. Meta delivers `mentions` event → POST /webhooks/instagram/ (1–60s latency)
   Payload: { changes: [{ field: "mentions", value: { media_id, comment_id: null } }] }
3. FastAPI handler routes to FeedMentionWorkflow
4. Temporal: fetch_mentioned_media_activity
   GET /{ig_user_id}/mentioned_media?media_id=...
   &fields=id,caption,media_type,media_url,timestamp,permalink,like_count,comments_count,owner
5. Temporal: upsert_ugc_content_activity
   INSERT INTO ugc_content (capture_source='webhook_mention', ...) ON CONFLICT DO NOTHING
6. Temporal: download_ugc_media_activity
   Download media_url → upload to post-media/ugc/{brand_ig_id}/{post_id}/media.{ext}
7. Temporal: attribute_ugc_to_campaign_activity
   Lookup creator_ig_handle in campaign_creator.social_media_handles
   → if match: set campaign_id, campaign_creator_id on ugc_content row
   → if no match: brand-level UGC (campaign_id = NULL)
```

#### Path B: Photo-tagged feed post — Polling

```
1. Creator photos brand product, tags @brand in the image (photo tag)
2. UGCTagPollingWorkflow runs (every 10–15 min)
   GET /{ig_user_id}/tags?fields=id,caption,media_type,media_url,...&limit=50&after={cursor}
3. For each new post (not seen in ugc_content):
   Temporal: upsert_ugc_content_activity (capture_source='api_tag_poll')
   Temporal: download_ugc_media_activity
   Temporal: attribute_ugc_to_campaign_activity
4. Store cursor for incremental next poll
```

**Polling gap**: Photo-tag polling introduces up to 15-minute detection latency. This is acceptable for non-ephemeral content (CDN URLs for feed posts don't expire quickly). Reels photo-tags are NOT returned by `/tags` — a known API gap.

#### Path C: Story @mention — Webhook

```
1. Creator posts Instagram Story with @brand mention sticker
2. Meta delivers `mention` event (Messaging API) → POST /webhooks/instagram/ (1–60s latency)
   Payload: { messaging: [{ mention: { media_id, media_type: "story" } }] }
3. FastAPI handler routes to StoryMentionWorkflow
4. Temporal: fetch_story_mentioned_media_activity
   GET /{ig_user_id}/mentioned_media?media_id=...&fields=id,media_type,media_url,timestamp
   → Returns CDN URL (expires 24 hours from Story creation)
5. Temporal: download_ig_story_media_activity [TIME CRITICAL — must complete within 24h window]
   Download CDN URL → upload to post-media/ugc-stories/{brand_ig_id}/{media_id}.{ext}
6. Temporal: upsert_ugc_content_activity (capture_source='story_mention')
7. Temporal: resolve_igsid_activity [SHARED from IG DM infra]
   Lookup sender IGSID → resolve to ig_username
8. Temporal: attribute_ugc_to_campaign_activity
```

**24-hour window criticality**: Steps 4 and 5 must complete within ~20 hours (4-hour safety margin before CDN URL expires). Temporal's built-in retry ensures transient failures are recovered within this window, but prolonged webhook handler downtime causes permanent Story loss.

#### Path D: Hashtag monitoring — Polling

```
1. Brand configures monitored hashtags in ugc_hashtag_config table (max 30 per IG account)
2. HashtagMonitoringWorkflow runs (every 2–4 hours)
   GET /ig_hashtag_search?user_id={ig_user_id}&hashtag=cheerful → get hashtag_id (cache forever)
   GET /{hashtag_id}/recent_media?fields=id,caption,media_type,media_url,timestamp,permalink,...
   → Returns up to ~25 most recent posts using this hashtag
3. For each new post:
   Temporal: upsert_ugc_content_activity (capture_source='hashtag_poll')
   Temporal: download_ugc_media_activity
   Temporal: attribute_ugc_to_campaign_activity
4. Note: creator username available in response (no IGSID needed for hashtag results)
```

**Hashtag constraint**: The 30-unique-hashtag / 7-day rolling window per IG account is the binding constraint. Hashtag slot allocation UI required for brands to manage their budget.

---

## 4. Database Schema

### 4.1 New Tables Required

#### `ugc_content` (core UGC store)

```sql
CREATE TABLE ugc_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Brand anchor (always present; FK to IG DM table)
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,

    -- Campaign attribution (optional; NULL = brand-level UGC, no campaign match)
    campaign_id UUID REFERENCES campaign(id) ON DELETE SET NULL,
    campaign_creator_id UUID REFERENCES campaign_creator(id) ON DELETE SET NULL,

    -- Creator info (from webhook payload or API response)
    creator_ig_user_id TEXT,        -- Stable numeric IG user ID (preferred)
    creator_ig_handle TEXT,         -- @handle (normalized, no @, lowercase)
    creator_igsid TEXT,             -- IGSID (Messaging API events only)
    creator_id UUID REFERENCES creator(id) ON DELETE SET NULL, -- global creator registry

    -- Post identity
    instagram_post_id TEXT NOT NULL, -- Stable IG post ID (deduplication key)
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'reel', 'story', 'carousel')),
    post_url TEXT,                   -- Permalink (permanent, not CDN URL)
    caption TEXT,

    -- Media (permanently re-hosted in Supabase Storage)
    media_urls JSONB DEFAULT '[]'::jsonb,     -- Original Instagram CDN URLs (may expire)
    media_storage_paths JSONB DEFAULT '[]'::jsonb, -- Supabase Storage paths (permanent)
    thumbnail_url TEXT,

    -- Engagement snapshot at capture time
    like_count INTEGER DEFAULT 0,
    view_count INTEGER,
    comment_count INTEGER DEFAULT 0,

    -- Timestamps
    posted_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Capture provenance
    capture_source TEXT NOT NULL CHECK (capture_source IN (
        'webhook_mention',   -- Graph API `mentions` webhook (caption/comment @mention)
        'story_mention',     -- Messaging API `mention` event
        'api_tag_poll',      -- Polling GET /{id}/tags
        'hashtag_poll',      -- Hashtag API monitoring
        'ai_radar'           -- AI-detected untagged (reserved for option-ai-radar)
    )),
    match_method TEXT CHECK (match_method IN (
        'api_signal',        -- API explicitly surfaced it (tagged or @mentioned)
        'hashtag_match',     -- Monitored hashtag found in post
        'llm_vision',        -- LLM vision analysis (optional enrichment)
        'ai_visual',         -- Computer vision logo/product detection
        'llm_audio'          -- STT + NER audio match
    )),
    match_confidence FLOAT DEFAULT 1.0, -- 1.0 for API signals; variable for AI
    raw_webhook_payload JSONB,           -- Raw event for debugging/replay

    -- Soft delete (false positive removal)
    deleted_at TIMESTAMPTZ,

    -- Rights management (future-proofing; not implemented in initial version)
    rights_status TEXT DEFAULT 'not_requested'
        CHECK (rights_status IN ('not_requested', 'requested', 'granted', 'denied'))
);

-- Primary deduplication: one row per (brand_account, post, campaign)
-- Multiple campaigns → multiple rows for same post (consistent with creator_post design)
CREATE UNIQUE INDEX ugc_content_campaign_dedup
    ON ugc_content (user_ig_dm_account_id, instagram_post_id, campaign_id)
    WHERE campaign_id IS NOT NULL;

-- Brand-level dedup: only one brand-level row per post (campaign_id IS NULL)
CREATE UNIQUE INDEX ugc_content_brand_level_dedup
    ON ugc_content (user_ig_dm_account_id, instagram_post_id)
    WHERE campaign_id IS NULL;

-- Performance: lookup by creator handle for attribution queries
CREATE INDEX ugc_content_creator_handle_idx
    ON ugc_content (user_ig_dm_account_id, creator_ig_handle)
    WHERE creator_ig_handle IS NOT NULL;
```

#### `ugc_hashtag_config` (per-brand hashtag budget)

```sql
CREATE TABLE ugc_hashtag_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,             -- Without #
    ig_hashtag_id TEXT,                -- Cached from ig_hashtag_search (stable; cache forever)
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER DEFAULT 0,        -- Higher = more important; used for slot allocation
    first_queried_at TIMESTAMPTZ,      -- For tracking 7-day window slot lifecycle
    last_queried_at TIMESTAMPTZ,
    last_poll_cursor TEXT,             -- Cursor from last recent_media poll (pagination)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_hashtag_per_account UNIQUE (user_ig_dm_account_id, hashtag)
);
```

#### `ugc_tag_poll_cursor` (photo-tag polling state)

```sql
CREATE TABLE ugc_tag_poll_cursor (
    user_ig_dm_account_id UUID PRIMARY KEY REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    last_poll_cursor TEXT,    -- After-cursor for GET /{ig_user_id}/tags pagination
    last_polled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 Extension to `user_ig_dm_account` (2–3 columns added via ALTER)

```sql
-- Add UGC-specific configuration to the IG DM account table
ALTER TABLE user_ig_dm_account
    ADD COLUMN ugc_capture_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN mentions_webhook_subscribed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN hashtag_monitoring_enabled BOOLEAN NOT NULL DEFAULT false;
```

### 4.3 Attribution Performance: Index on `campaign_creator.social_media_handles`

```sql
-- Required for attribution at scale: lookup by IG handle in JSONB
CREATE INDEX idx_campaign_creator_ig_handles_gin
    ON campaign_creator USING GIN (social_media_handles);

-- Optional: normalized Instagram handle as generated column for fast equality lookup
ALTER TABLE campaign_creator
    ADD COLUMN instagram_handle TEXT GENERATED ALWAYS AS (
        lower(trim(
            (SELECT elem->>'handle'
             FROM jsonb_array_elements(social_media_handles) elem
             WHERE elem->>'platform' = 'instagram'
             LIMIT 1)
        ))
    ) STORED;
CREATE INDEX idx_campaign_creator_instagram_handle
    ON campaign_creator (instagram_handle)
    WHERE instagram_handle IS NOT NULL;
```

---

## 5. Temporal Workflow Design

All workflows follow Cheerful's existing patterns (`PostTrackingSchedulerWorkflow`, `continue_as_new`, activity-level retry/timeout).

### 5.1 Webhook-Triggered Workflows

#### `StoryMentionWorkflow`

```python
@workflow.defn
class StoryMentionWorkflow:
    @workflow.run
    async def run(self, params: StoryMentionWorkflowInput) -> str | None:
        # Input: { media_id, sender_igsid, timestamp_ms, user_ig_dm_account_id }

        # Step 1: Deduplicate
        existing = await workflow.execute_activity(
            check_ugc_exists_activity,
            {"user_ig_dm_account_id": params.user_ig_dm_account_id, "instagram_post_id": params.media_id},
            start_to_close_timeout=timedelta(seconds=10),
        )
        if existing:
            return existing  # Already captured

        # Step 2: Fetch CDN URL (timing-sensitive — CDN URL expires in 24h from Story creation)
        media_result = await workflow.execute_activity(
            fetch_story_mentioned_media_activity,  # GET /mentioned_media?media_id=...
            params,
            start_to_close_timeout=timedelta(seconds=30),
        )
        if not media_result:
            return None

        # Step 3: Download and store media (deadline: 20 hours from captured_at)
        storage_path = await workflow.execute_activity(
            download_ig_story_media_activity,
            {"cdn_url": media_result.media_url, "user_ig_dm_account_id": params.user_ig_dm_account_id, "media_id": params.media_id},
            start_to_close_timeout=timedelta(hours=2),  # Retry up to 20h in Temporal
        )

        # Step 4: Resolve creator identity (SHARED with IG DM)
        creator_result = await workflow.execute_activity(
            resolve_igsid_activity,  # SHARED: ig_igsid_cache + Graph API
            {"igsid": params.sender_igsid, "page_access_token": params.access_token},
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 5: Upsert ugc_content row
        ugc_id = await workflow.execute_activity(
            upsert_ugc_story_mention_activity,
            {**params, **media_result, **creator_result, "storage_path": storage_path},
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 6: Attribution (may be async — lookup in campaign_creator)
        await workflow.execute_activity(
            attribute_ugc_to_campaign_activity,
            {"ugc_id": ugc_id, "creator_ig_handle": creator_result.username},
            start_to_close_timeout=timedelta(minutes=1),
        )
        return ugc_id
```

#### `FeedMentionWorkflow`

```python
@workflow.defn
class FeedMentionWorkflow:
    @workflow.run
    async def run(self, params: FeedMentionWorkflowInput) -> str | None:
        # Input: { media_id, comment_id (None=caption), user_ig_dm_account_id }

        # Step 1: Deduplicate
        # Step 2: Fetch full post via mentioned_media (caption) or mentioned_comment (comment)
        if params.comment_id is None:
            media = await workflow.execute_activity(fetch_mentioned_media_activity, ...)
        else:
            comment = await workflow.execute_activity(fetch_mentioned_comment_activity, ...)

        # Step 3: Upsert ugc_content (capture_source='webhook_mention')
        # Step 4: Download media (media_url from Graph API — not time-critical; feed CDN stable)
        # Step 5: attribute_ugc_to_campaign_activity
```

### 5.2 Polling Workflows

#### `UGCTagPollingWorkflow`

```python
@workflow.defn
class UGCTagPollingWorkflow:
    @workflow.run
    async def run(self, brand_account_id: str) -> None:
        # Get cursor from last poll
        cursor = await workflow.execute_activity(get_tag_poll_cursor_activity, brand_account_id, ...)

        # Fetch photo-tagged posts (cursor-paginated)
        tag_results = await workflow.execute_activity(
            poll_ig_tags_activity,
            {"user_ig_dm_account_id": brand_account_id, "after_cursor": cursor},
            start_to_close_timeout=timedelta(seconds=60),
        )

        for post in tag_results.new_posts:
            await workflow.execute_activity(upsert_ugc_content_activity, post, ...)
            await workflow.execute_activity(download_ugc_media_activity, post, ...)
            await workflow.execute_activity(attribute_ugc_to_campaign_activity, post, ...)

        await workflow.execute_activity(store_tag_poll_cursor_activity, tag_results.next_cursor, ...)
```

**Schedule**: Every 10–15 minutes. Self-scheduling via `PostTrackingSchedulerWorkflow` pattern.

#### `HashtagMonitoringWorkflow`

```python
@workflow.defn
class HashtagMonitoringWorkflow:
    @workflow.run
    async def run(self, brand_account_id: str) -> None:
        hashtags = await workflow.execute_activity(get_active_hashtag_configs_activity, brand_account_id, ...)

        # Parallel fetch across all configured hashtags
        poll_tasks = [
            workflow.execute_activity(
                poll_hashtag_recent_media_activity,
                {"hashtag_id": h.ig_hashtag_id, "user_ig_dm_account_id": brand_account_id},
                start_to_close_timeout=timedelta(seconds=60),
            )
            for h in hashtags
        ]
        all_results = await asyncio.gather(*poll_tasks)

        for batch in all_results:
            for post in batch.new_posts:
                await workflow.execute_activity(upsert_ugc_content_activity, post, ...)
                await workflow.execute_activity(download_ugc_media_activity, post, ...)
                await workflow.execute_activity(attribute_ugc_to_campaign_activity, post, ...)
```

**Schedule**: Every 2–4 hours (24-hour lookback constraint on `recent_media` endpoint requires polling at minimum every 12 hours; 2–4 hours recommended for reliability).

---

## 6. API Permissions and App Review

Three distinct App Review gates:

| Permission | For | App Review Category | Estimated Timeline |
|------------|-----|--------------------|--------------------|
| `instagram_manage_messages` | Story mentions (Messaging API `mention` field) | Advanced Access | 2–10 days |
| `instagram_manage_comments` | Feed @mentions (Graph API `mentions` webhook + `/tags` polling) | Advanced Access | 2–10 days |
| `instagram_public_content_access` | Hashtag monitoring | Advanced Feature (separate process) | 5–14 business days |

**Strategic note**: The first two permissions can be submitted together in a single App Review request. `instagram_public_content_access` is a separate feature review process. All three are distinct App Review submissions.

The IG DM integration's `instagram_manage_messages` approval covers Story mention capture — no separate review item.

**Combining the `instagram_manage_comments` review with IG DM review**: If submitted as one review request, the App Review timeline is shared (~2–10 days total, not additive).

---

## 7. Capability Matrix

### 7.1 Content Type Coverage

| Content Type | Webhook Mentions | Tags Polling | Hashtag Polling | Story Mentions |
|-------------|:---:|:---:|:---:|:---:|
| Feed photo (caption @mention) | ✅ | ❌ | Partial (if hashtag used) | ❌ |
| Feed photo (photo-tagged) | ❌ | ✅ | ❌ | ❌ |
| Feed photo (hashtag only) | ❌ | ❌ | ✅ | ❌ |
| Feed video (caption @mention) | ✅ | ❌ | Partial | ❌ |
| Feed video (photo-tagged) | ❌ | ✅ | ❌ | ❌ |
| Carousel (caption @mention) | ✅ | ❌ | Partial | ❌ |
| Carousel (photo-tagged) | ❌ | ✅ | ❌ | ❌ |
| Reel (caption @mention) | ⚠️ Uncertain | ❌ | ❌ | ❌ |
| Reel (photo-tagged) | ❌ | ❌ | ❌ | ❌ |
| Story (@mentioned) | ❌ | ❌ | ❌ | ✅ |
| Story (no @mention) | ❌ | ❌ | ❌ | ❌ |
| Comment @mentions | ✅ | ❌ | ❌ | ❌ |
| Private account content | ❌ | ❌ | ❌ | ⚠️ Only if brand follows |

**Key gaps inherent to official API**:
- Reels tagged in video: no API method captures them
- Reels with @mention in caption: uncertain API behavior (documented inconsistency)
- Stories without explicit @mention: not capturable via official API
- Private accounts: structural API limitation

### 7.2 Estimated Coverage of Total Brand UGC

Based on industry estimates and prior Wave 1 analysis:

| Content Category | Estimated % of Brand UGC | Coverage by Official API |
|-----------------|--------------------------|--------------------------|
| Feed posts with @mention (public accounts) | 40–50% | ✅ Fully covered (webhook) |
| Feed posts with photo-tag (public accounts) | 15–20% | ✅ Fully covered (polling) |
| Feed posts with branded hashtag only | 5–15% | ✅ Covered (within 30-hashtag budget) |
| Stories with @mention (public accounts) | 10–15% | ✅ Covered (if brand follows: +5–10%) |
| Reels with @mention | 5–10% | ⚠️ Uncertain API coverage |
| Reels with photo-tag | 5–10% | ❌ Not covered |
| Untagged brand appearances (any type) | 15–25% | ❌ Not covered |
| Private account content | 10–20% of above | ❌ Not covered |

**Estimated official API capture rate**: **60–75% of total capturable public brand UGC** (excludes untagged content and private accounts). This is the highest coverage achievable without AI detection or unofficial scraping.

---

## 8. Constraints and Limitations

### 8.1 API Rate Limits

| Rate Limit | Value | Per Entity | Impact |
|------------|-------|-----------|--------|
| BUC (Business Use Case) | 200 calls/hr | Per brand IG account | Comfortable at normal UGC volumes |
| Hashtag queries | 30 unique/7 days | Per brand IG account | Binding constraint for hashtag monitoring |
| Hashtag results | ~25 posts/query | Per hashtag per call | High-traffic hashtags may miss posts |

**Per-brand rate budget with all four mechanisms active:**
- Tags polling (10min interval): 6 calls/hr
- Hashtag monitoring (2hr interval, 30 hashtags): 30 calls avg/hr
- Mention webhook detail fetches (100 events/hr): 100 calls/hr
- **Total**: ~136 calls/hr — well within 200/hr limit

Rate limits are per brand account, not per Cheerful app. 1,000 brands = 200,000 total calls/hr capacity (no shared pool concern).

### 8.2 The No-Polling-Fallback Problem for @Mentions

For photo-tags, polling `/tags` provides full recovery capability — any tag from the last ~10,000 will be captured on the next poll. For feed @mentions (caption/comment), **there is no polling fallback**. If the `mentions` webhook is missed due to:
- Cheerful's webhook server being down during Meta's retry window (~24 hours)
- Meta silently dropping the event (documented but rare production issue)

...the @mention is permanently unrecoverable. No collection endpoint for past @mentions exists.

**Mitigation**: High-availability webhook server (Fly.io with minimum 2 instances), dead-man's-switch alerting if webhook delivery rate drops, and graceful documentation that mention capture has inherent reliability limits.

### 8.3 Story 24-Hour Deadline

Story CDN URLs expire 24 hours from Story creation time. If the webhook is received but media download fails (network issue, Supabase timeout), Story content is permanently lost unless download succeeds within the window.

**Mitigation**: Temporal retry with `start_to_close_timeout=timedelta(hours=2)` and schedule deadline ~20 hours from `captured_at`. Write a stub `ugc_content` row immediately on webhook receipt (even before media download) to preserve attribution metadata even if media is lost.

### 8.4 Hashtag 30-Slot Budget

With 30 total hashtag slots per brand IG account:
- Static brand hashtags: 2–5 slots (permanent)
- Campaign hashtags: 1–3 per campaign, rotate as campaigns launch/conclude
- Category hashtags (optional): 5–15 slots
- Remaining: minimal buffer

Multi-campaign brands exhaust the budget quickly. Rotation strategy and slot lifecycle management (track 7-day window per slot) require explicit product UI and database tooling.

### 8.5 Meta Policy Risk

Meta has a history of restricting API access:
- Instagram Basic Display API: deprecated Dec 2024
- Rate limits reduced 25× in 2024 (5,000 → 200 calls/hr)
- Various webhook fields have silently broken in past

Official APIs are still substantially more stable than unofficial scraping, but any future Meta policy change can reduce capability. Diversification across capture methods (webhook + polling) provides some resilience — losing one doesn't lose everything.

---

## 9. Effort Estimate

### 9.1 Baseline: IG DM Integration Already Built

All effort estimates assume the IG DM integration (`cheerful-ig-dm-spec/`) is complete:

| Component | Effort | Notes |
|-----------|--------|-------|
| **Shared infrastructure** | 0 (already built) | Webhook endpoint, HMAC, tokens, IGSID cache |
| `mention` field added to page subscription | Tiny (1 line) | Must be done immediately at DM launch |
| `changes[]` routing branch in webhook handler | Small (10 lines) | Additive to existing handler |
| `FeedMentionWorkflow` + activities | Small–Medium (3–5 days) | Fetch mentioned_media, upsert, download |
| `StoryMentionWorkflow` + activities | Medium (4–5 days) | New Temporal workflow; reuses download patterns |
| `UGCTagPollingWorkflow` + activities | Medium (3–5 days) | New cron workflow; cursor pagination |
| `HashtagMonitoringWorkflow` + activities | Medium (4–6 days) | New workflow + brand config UI + slot tracking |
| `ugc_content` table migration | Small (1 day) | Schema above + indices |
| `ugc_hashtag_config` + `ugc_tag_poll_cursor` tables | Small (0.5 day) | Straightforward schema |
| Attribution algorithm (`attribute_ugc_to_campaign_activity`) | Medium (3–4 days) | JSONB handle lookup, normalization, multi-campaign |
| `instagram_manage_comments` App Review | External (2–10 days) | Can combine with IG DM App Review |
| `instagram_public_content_access` App Review | External (5–14 days) | Separate process; hashtag-only |
| Brand admin UI: hashtag slot management | Medium (3–4 days) | Add/remove/prioritize hashtags; show slot usage |
| Monitoring + alerting (webhook health, 24h Story deadline) | Small (1–2 days) | Alert infra for gap detection |
| Media storage path update + multi-image support | Small (1 day) | `ugc/{brand_ig_id}/...` paths, JSONB paths array |

**Total engineering effort (assuming IG DM built)**: ~4–6 engineer-weeks

**If IG DM integration is NOT yet built**: Add ~6–8 weeks for shared infrastructure (webhook endpoint, HMAC verification, FB Page OAuth, `user_ig_dm_account` table, IGSID resolution, `ig_igsid_cache`). In this case, build IG DM integration first — Story capture is nearly free on top of it.

### 9.2 Phased Rollout (recommended)

| Phase | Features | Incremental Effort | Dependency |
|-------|----------|-------------------|------------|
| **Phase 1** | Story @mentions (from DM webhook) + feed @mentions (mentions webhook) | ~2 weeks | IG DM integration complete |
| **Phase 2** | Photo-tag polling (`/tags`) | ~1 week | Phase 1 (`ugc_content` table exists) |
| **Phase 3** | Hashtag monitoring (requires separate App Review) | ~2 weeks | Phase 2; `instagram_public_content_access` approval |

Phase 1 delivers the highest-value UGC types (mentions and Stories) with the lowest incremental effort by riding the IG DM infrastructure. Each subsequent phase adds complementary coverage.

---

## 10. Cost Analysis

| Component | Cost Model | Estimate at Scale |
|-----------|-----------|-------------------|
| Meta Graph API calls | Free (rate-limited, not paid) | $0 |
| Meta Messaging API | Free | $0 |
| Temporal workflow executions | Included in Temporal Cloud plan | Variable by plan |
| Supabase Storage (media) | $0.021/GB over 100GB | ~$10–190/mo at 100 brands |
| Compute (Fly.io backend) | Existing backend, no new instances | $0 incremental at low-medium scale |
| App Review | One-time (no recurring cost) | $0 |
| Claude Sonnet vision analysis (optional) | $0.003–0.005/image; only if enrichment enabled | Variable; optional add-on |

**Total incremental cost at 100 brands**: ~$10–200/month (storage-dominated). API calls are free.

Compared to Archive.com ($308/mo for ONE brand on Pro plan), building native capture is dramatically more cost-efficient at multi-brand scale. The build cost is front-loaded (engineering), but ongoing COGS is negligible.

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Meta reduces rate limits further | Medium | Medium | Webhook-first design already minimizes API calls; polling fallback less critical |
| `mentions` webhook silent drops in production | Medium | Medium | Monitor webhook delivery rate; alert on gap; no recovery option for @mentions |
| App Review rejection/delay for `instagram_manage_comments` | Low | Medium | Combine with DM integration review; prepare video screencast showing intent |
| App Review rejection for `instagram_public_content_access` | Medium | Low | Hashtag monitoring is Layer 2 (additive); losing it doesn't break core capture |
| Story CDN URL expiry before download | Low | High (for that Story) | Write stub row immediately; Temporal retry within 20-hour window |
| Meta policy change against Story media storage | Low | High | Monitor Meta changelog; store CDN URL + bytes; defensible as documented API usage |
| `social_media_handles` JSONB index insufficient at scale | Medium | Medium | Add GIN index + generated column migration; plan before launch |
| Reels @mentions not detected by `mentions` webhook | Medium | Medium | Document as known gap; test empirically during integration; AI Radar fills partially |
| Brand connects wrong IG account | Low | Low | UI validation: confirm IG username before storing; re-auth flow |
| High UGC volume exhausts Supabase Storage budget | Medium | Low | TTL job + thumbnail-only strategy for low-engagement UGC |

---

## 12. Compatibility with Existing Cheerful Architecture

### 12.1 Temporal Workflow Compatibility

All new workflows follow the exact same patterns as `PostTrackingSchedulerWorkflow`:
- Sleep + `continue_as_new` for perpetual schedulers
- Activity-level retry/timeout configuration
- `@report_workflow_errors` decorator (existing Rollbar integration)
- Sequential cron pattern for polling; webhook-triggered for push events

The `asyncio.run()` wrapper pattern for Temporal activities (existing pattern in `media_storage.py`) is reused for all new activities.

### 12.2 Supabase RLS Compatibility

`ugc_content` follows the same RLS pattern as `creator_post`:
- Service-role writes (backend)
- Row-level filtering by `user_ig_dm_account_id` → `user_id` for data isolation
- Public read for `post-media` bucket (same policy as today)

### 12.3 FastAPI Route Compatibility

New API routes (`/ugc`, `/ugc?campaign_id=`, etc.) follow existing patterns:
- Same auth middleware (Supabase JWT)
- Same repository pattern (SQLAlchemy Core)
- Same Pydantic request/response models

Existing `creator_post` routes are unchanged — UGC content is a separate API surface.

---

## 13. Summary Assessment

| Attribute | Value |
|-----------|-------|
| **What it captures** | Feed @mentions, photo-tagged posts, Story @mentions, branded hashtag posts |
| **What it misses** | Reels (photo-tagged), untagged content, private accounts (mostly), unmentioned Stories |
| **Estimated coverage** | 60–75% of public brand UGC (excludes untagged content) |
| **Creator opt-in required** | **No** — brand token handles everything |
| **Cost** | Free API calls + $10–200/month storage at 100 brands |
| **IG DM infra dependency** | **High** — Story capture requires DM infra; rest is incremental on top |
| **IG DM overlap** | Maximized: Story capture gets 80% of infra for free |
| **App Review gates** | 2 separate reviews (`instagram_manage_comments` + `instagram_public_content_access`) |
| **Effort (if DM infra exists)** | ~4–6 engineer-weeks (phased: 2 wks + 1 wk + 2 wks) |
| **Effort (if DM infra does not exist)** | ~10–14 engineer-weeks (build DM infra first) |
| **Reliability** | High for photo-tags (polling recovers gaps); Medium for @mentions (webhook-only, no replay); Critical for Stories (24h download window) |
| **Meta policy risk** | Low-Medium — official APIs are stable; rate limit reduction history is concerning |
| **Temporal compatibility** | Full — all workflows follow existing patterns |
| **Key architectural insight** | Build IG DM integration first; Story capture is ~4–7 days of incremental work on top of it; feed @mentions are 3–5 more days; photo-tag polling is 3–5 more days; hashtag monitoring is the most independent component |

**Bottom line**: Official API Capture is the **correct foundation layer** for any Cheerful UGC strategy. It is free to operate, TOS-compliant, covers 60–75% of brand UGC, and maximally leverages the IG DM integration already in development. The IG DM + Story mention combination is the highest-ROI combination: one OAuth flow, one App Review, minimal incremental code, and it captures the highest-value ephemeral content (Stories). Hashtag monitoring adds useful supplementary coverage but is the most independent and can be deferred. The structural gaps (Reels photo-tags, untagged content) require AI Radar (separate option) to address — this option is designed to be layered with AI Radar as an optional enhancement, not as a replacement.

---

## Sources

- `analysis/graph-api-mentions-tags.md` — `/tags` endpoint, `mentioned_media`, rate limits, content coverage
- `analysis/webhooks-mentions.md` — `mentions` webhook, delivery guarantees, routing, IG DM overlap
- `analysis/hashtag-monitoring.md` — Hashtag API, 30-hashtag constraint, polling architecture
- `analysis/story-mention-capture.md` — Messaging API `mention` event, CDN expiry, TOS analysis
- `analysis/current-post-tracking.md` — Existing `creator_post`, `PostTrackingWorkflow`, reusable components
- `analysis/current-ig-dm-overlap.md` — Shared infrastructure inventory, increment effort breakdown
- `analysis/current-media-storage.md` — `post-media` bucket, volume analysis, storage patterns
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema, handle normalization
