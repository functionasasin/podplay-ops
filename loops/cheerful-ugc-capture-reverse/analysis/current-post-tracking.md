# Current Post Tracking — Analysis

**Aspect**: `current-post-tracking`
**Wave**: 2 — Internal Landscape
**Date**: 2026-03-01

---

## Summary

Cheerful already has a working Instagram post tracking system launched in February 2026. It is a **campaign-creator opt-in polling system** — it monitors known creators who have committed to a campaign (reached participating status) and checks their public Instagram profiles daily for product-relevant content. This is NOT zero-signup UGC capture: it only tracks people already in a campaign database.

Understanding this system precisely reveals what infrastructure can be reused for zero-signup UGC auto-capture and what must be built net-new.

---

## 1. Database Schema

### `creator_post` table

**Migration**: `supabase/migrations/20260204000001_create_creator_post_table.sql`

```sql
CREATE TABLE creator_post (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hard links to campaign domain (CANNOT be null for current opt-in model)
    campaign_id UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
    campaign_creator_id UUID NOT NULL REFERENCES campaign_creator(id) ON DELETE CASCADE,

    -- Instagram identifier (deduplication key)
    instagram_post_id TEXT NOT NULL,

    -- Post metadata
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'story', 'reel')),
    post_url TEXT NOT NULL,
    caption TEXT,

    -- Media (permanently re-hosted in Supabase Storage)
    media_urls JSONB DEFAULT '[]'::jsonb,     -- original Instagram URLs
    media_storage_path TEXT,                   -- permanent Supabase Storage path
    thumbnail_url TEXT,

    -- Engagement snapshot at time of capture
    like_count INTEGER DEFAULT 0,
    view_count INTEGER,
    comment_count INTEGER DEFAULT 0,

    -- Timestamps
    posted_at TIMESTAMPTZ,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Match provenance
    match_method TEXT NOT NULL CHECK (match_method IN ('caption', 'llm')),
    match_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_post_per_creator UNIQUE (campaign_creator_id, instagram_post_id)
);
```

**Key observations**:
- The UNIQUE constraint is `(campaign_creator_id, instagram_post_id)` — the same Instagram post ID can be stored multiple times if it's tied to different campaign_creator rows (same creator in multiple campaigns). Zero-signup UGC capture has no campaign_creator_id, so this constraint design would not work.
- `match_method` only supports `'caption'` or `'llm'` — no enum value for `'webhook'`, `'mention'`, `'hashtag'` etc.
- No `capture_source` column (e.g., API poll vs webhook push vs mention).
- `campaign_creator_id NOT NULL` is a hard constraint — any zero-signup UGC would need either a nullable FK or a separate table.

### `campaign_creator` tracking columns

**Migration**: `supabase/migrations/20260204000002_add_post_tracking_columns.sql`

```sql
ALTER TABLE campaign_creator ADD COLUMN post_tracking_started_at TIMESTAMPTZ;
ALTER TABLE campaign_creator ADD COLUMN post_tracking_ends_at TIMESTAMPTZ;
ALTER TABLE campaign_creator ADD COLUMN post_last_checked_at TIMESTAMPTZ;
```

**Migration**: `supabase/migrations/20260205000002_add_last_seen_post_id.sql`

```sql
ALTER TABLE campaign_creator ADD COLUMN last_seen_post_id TEXT;
```

**Migration**: `supabase/migrations/20260219010000_add_post_opt_in_follow_up_delay_snapshot.sql`

```sql
ALTER TABLE campaign_creator ADD COLUMN post_opt_in_follow_up_delay_hours_at_schedule INTEGER;
```

**Tracking window**: 90 days from when creator reaches participating status. Set once, immutable.

### `campaign` tracking flag

**Migration**: `supabase/migrations/20260205000001_add_post_tracking_enabled.sql`

```sql
ALTER TABLE campaign ADD COLUMN post_tracking_enabled BOOLEAN NOT NULL DEFAULT false;
```

Post tracking must be explicitly enabled per campaign. Default is OFF to control costs.

### `post-media` Supabase Storage bucket

**Migration**: `supabase/migrations/20260204000003_create_post_media_bucket.sql`

- Bucket ID: `post-media`
- Public: `true` (public read URLs)
- File size limit: 50MB (for video Reels)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime`
- Path pattern: `posts/{post_id}/media.{ext}`
- Service role manages writes, public reads

---

## 2. Workflow Architecture

### PostTrackingSchedulerWorkflow

**File**: `apps/backend/src/temporal/workflow/post_tracking_workflow.py`

```python
@workflow.defn
class PostTrackingSchedulerWorkflow:
    async def run(self) -> None:
        await workflow.execute_child_workflow(PostTrackingWorkflow.run, ...)
        await workflow.sleep(timedelta(hours=24))
        workflow.continue_as_new()  # Reset history every cycle
```

- **Schedule**: Every 24 hours (simple sleep + continue_as_new pattern)
- **No external scheduler**: Self-contained perpetual workflow; avoids Temporal Schedules API complexity
- The `continue_as_new()` prevents unbounded history growth (critical for long-running scheduler workflows)

### PostTrackingWorkflow

```python
@workflow.defn
class PostTrackingWorkflow:
    async def run(self) -> PostTrackingResult:
        # Step 1: Get all eligible creators
        creator_dicts = await workflow.execute_activity(get_trackable_creators_activity, ...)

        # Step 2: Process each creator sequentially
        for creator_dict in creator_dicts:
            result = await workflow.execute_activity(process_creator_posts_activity, params, ...)
```

- Processes ALL eligible creators in a single workflow run
- Sequential per-creator processing (not parallel)
- Activity timeouts: 5 min for list, 5 min per creator (2 retries)
- Uses custom `@report_workflow_errors` decorator for Rollbar integration

### get_trackable_creators_activity

**File**: `apps/backend/src/temporal/activity/post_tracking_activity.py`

Eligibility criteria for a creator to be tracked:
1. `post_tracking_ends_at > now()` — active 90-day window
2. Instagram handle in `social_media_handles` JSON array
3. Campaign exists with a `product_id`
4. Campaign status is NOT `COMPLETED`
5. Product exists in product table

Returns: `TrackableCreator` dicts with `campaign_creator_id`, `campaign_id`, `instagram_handle`, `product_name`, `product_description`.

### process_creator_posts_activity

**Per-creator pipeline**:

1. **Fetch posts**: `fetch_instagram_posts(handle, max_posts=10)` via Apify scraper
2. **Skip optimization**: If `posts[0].id == last_seen_post_id`, no new posts → skip analysis, update `post_last_checked_at` only
3. **Deduplication**: Check `CreatorPostRepository.exists_by_instagram_post_id()` per post
4. **Analysis**: Two-phase (caption → LLM)
5. **Media download**: `download_and_store_media_sync()` for matched posts
6. **Upsert**: `CreatorPostRepository.upsert()`
7. **Update cursor**: Set `post_last_checked_at` and `last_seen_post_id` on creator record

---

## 3. Data Ingestion Pipeline (Apify-based)

**File**: `apps/backend/src/services/post_tracking/apify_posts.py`

```python
def fetch_instagram_posts(username: str, max_posts: int = 10) -> list[InstagramPost]:
    client = ApifyClient(settings.APIFY_API_TOKEN)
    run = client.actor("apify/instagram-profile-scraper").call(
        run_input={"usernames": [username], "resultsLimit": 1}
    )
    profile = items[0]
    raw_posts = profile.get("latestPosts", [])[:max_posts]
```

**Data source**: Apify `instagram-profile-scraper` actor, fetching `latestPosts` from the creator's public profile.

**This is unofficial scraping**, not the Instagram Graph API. The actor scrapes the Instagram web interface. See `unofficial-scraping.md` for TOS risk analysis.

**What Apify returns**:
- `id`, `shortcode`, `url`, `caption`
- `type` (image/video/reel — Stories NOT available via profile scraper)
- `displayUrl` (image thumbnail), `videoUrl`
- `likesCount`, `commentsCount`, `videoViewCount`
- `timestamp` (ISO format)

**What Apify does NOT return via profile scraper**:
- Stories (ephemeral, not on public profile page)
- Engagement over time (snapshot only)
- Comments content
- Carousel sub-images

---

## 4. Post Analysis Pipeline

**File**: `apps/backend/src/services/post_tracking/analyzer.py`

### Phase 1: Caption match (fast, free)

```python
def caption_matches(caption: str | None, product_name: str) -> bool:
    if not caption:
        return False
    return product_name.lower() in caption.lower()
```

Simple substring match. No stemming, no synonyms, no partial matches.

### Phase 2: LLM vision analysis (fallback)

Only runs if Phase 1 fails. Uses **Claude Sonnet** with multimodal input:

```python
claude.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=100,
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "data": image_b64}},
        {"type": "text", "text": build_analysis_prompt(product_name, product_description, caption, post_type)}
    ]}]
)
```

**Prompt asks**: Does this post mention, show, or promote `{product_name}`?

**Response format**: `YES - [reason]` or `NO - [reason]` (100 tokens max)

**Cost**: ~$0.003–0.005 per image analysis call at Claude Sonnet pricing. For 10 posts per creator, 1000 creators → ~$30–50/day in LLM costs at scale.

**No audio/video analysis**: Only analyzes the first frame (thumbnail) of videos. No speech-to-text, no video frame sampling.

---

## 5. Media Storage Pipeline

**File**: `apps/backend/src/services/post_tracking/media_storage.py`

```python
storage_path = f"posts/{post_id}/media.{ext}"
supabase.storage.from_("post-media").upload(storage_path, media_bytes, {"upsert": "true"})
public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/post-media/{storage_path}"
```

- Downloads from Instagram CDN URL (which expires)
- Re-hosts permanently at Supabase Storage
- Upsert semantics: re-runs don't fail on already-stored media
- Async version for API route, sync wrapper (`asyncio.run`) for Temporal activities

---

## 6. Tracking Trigger

**File**: `apps/backend/src/services/post_tracking/status.py`

Tracking starts when creator reaches "participating" status:

| Campaign Type | Participating Statuses |
|--------------|----------------------|
| Gifting | `READY_TO_SHIP`, `ORDERED`, `ORDER_SENT`, `SHIPPED`, `DELIVERED` |
| Paid Promotion | `CONTRACT_SIGNED`, `CONTENT_IN_PROGRESS`, `AWAITING_REVIEW`, `CHANGES_REQUESTED`, `CONTENT_APPROVED`, `POSTED`, `AWAITING_PAYMENT`, `PAID` |

Tracking is set once (immutable), 90-day window.

`maybe_set_tracking_dates()` is called when a creator record is upserted — automatic trigger on status transition.

---

## 7. API Layer

**File**: `apps/backend/src/api/route/creator_post.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/posts` | GET | Post library — all posts across all campaigns |
| `/campaigns/{id}/creators/{id}/posts` | GET | Creator-specific post list |
| `/campaigns/{id}/creators/{id}/refresh-posts` | POST | Manual synchronous refresh |
| `/campaigns/{id}/posts/{post_id}` | DELETE | Delete false positive |

The refresh endpoint runs the full pipeline synchronously (bypasses Temporal) — fetches Apify data, analyzes, stores. Used for on-demand checks.

---

## 8. What Is and Isn't Captured

### Currently captured

- Feed posts (images, carousels) from opted-in creators who have an IG handle in their profile
- Reels from opted-in creators
- Content matched by product name in caption OR Claude vision analysis of thumbnail

### NOT currently captured

| Missing Content | Reason |
|----------------|--------|
| Stories | Apify profile scraper doesn't return ephemeral Stories |
| Content from non-campaign creators | System only tracks `campaign_creator` rows |
| @mentions of brand by outsiders | No mention monitoring (no Graph API `mentioned_media`) |
| Photo tags | No Graph API `tags` endpoint used |
| Hashtag content | No hashtag monitoring |
| Audio brand mentions in video | No STT pipeline |
| Untagged brand appearances | AI vision only checks thumbnail, not multiple frames |
| Real-time capture | 24h polling cadence; content 0–23h old before detection |

---

## 9. Reusability Assessment for Zero-Signup UGC Capture

### Directly reusable (no modification)

| Component | File | Reusability |
|-----------|------|-------------|
| `post-media` Supabase Storage bucket | `20260204000003_create_post_media_bucket.sql` | 100% — already exists, same bucket can store UGC |
| `download_and_store_media` | `services/post_tracking/media_storage.py` | 100% — generic downloader |
| `caption_matches` | `services/post_tracking/analyzer.py` | 100% — generic text match |
| `analyze_image_with_llm` | `services/post_tracking/analyzer.py` | 100% — generic vision analysis |
| `PostTrackingSchedulerWorkflow` pattern | `temporal/workflow/post_tracking_workflow.py` | 90% — sleep + continue_as_new scheduler pattern reusable |
| Claude API integration | `services/post_tracking/analyzer.py` | 100% — same `anthropic` client, same model |

### Reusable with modification

| Component | Modification Needed |
|-----------|-------------------|
| `creator_post` table | Needs `capture_source` column (`'api_mention'`, `'webhook_mention'`, `'story_mention'`, `'hashtag'`, `'ai_radar'`); needs nullable `campaign_creator_id`; UNIQUE constraint redesign; may need `brand_ig_user_id` column |
| `post_tracking_activity.py` logic | Eligibility query only works for campaign creators; UGC version needs brand-level query |
| `process_creator_posts_activity` | Deduplication key changes (no campaign_creator_id); attribution logic needed |
| `analyzer.py → analyze_post` | Currently assumes campaign product context; UGC version needs brand context |

### New infrastructure required

| Component | Description |
|-----------|-------------|
| Graph API client | OAuth token management, `/{ig-user-id}/mentioned_media`, `/{ig-user-id}/tags` endpoints |
| Webhook handler (mentions) | Meta webhook `mentions` field subscription handler |
| Messaging API webhook extension | `story_mention` event handler (shared with IG DM infra) |
| Hashtag monitoring service | `ig_hashtag_search` + `recent_media` polling within 30-hashtag budget |
| UGC attribution service | Map captured UGC back to campaigns/creators without explicit FK |
| Brand Instagram account config | Store brand IG user ID, access token, hashtag configs per brand/campaign |
| `ugc_brand_config` table | Brand-level IG credentials, monitored hashtags, capture preferences |

---

## 10. Schema Extension Options

### Option A: Extend `creator_post`

Add nullable `campaign_creator_id` (already has it as NOT NULL) and new columns:

```sql
-- Extend creator_post for zero-signup UGC
ALTER TABLE creator_post
  ALTER COLUMN campaign_creator_id DROP NOT NULL,
  ADD COLUMN capture_source TEXT CHECK (capture_source IN (
    'apify_poll',       -- existing: Apify profile scraper
    'api_mention',      -- Graph API mentioned_media endpoint
    'api_tag',          -- Graph API tags endpoint
    'webhook_mention',  -- Meta webhook mentions event
    'story_mention',    -- Messaging API story_mention event
    'hashtag',          -- Hashtag API monitoring
    'ai_radar'          -- AI-detected untagged appearance
  )),
  ADD COLUMN instagram_creator_handle TEXT,  -- for non-campaign creators
  ADD COLUMN instagram_creator_id TEXT;      -- IG user ID for non-campaign creators
```

**Trade-off**: Simpler single table, but the NOT NULL campaign_creator_id FK constraint has semantic weight throughout the codebase (RLS policies, API queries, repository methods all assume it's present).

### Option B: Separate `ugc_content` table

New table for zero-signup UGC, `creator_post` stays campaign-scoped:

```sql
CREATE TABLE ugc_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Optional campaign linkage (can be null for brand-level UGC)
    campaign_id UUID REFERENCES campaign(id) ON DELETE SET NULL,
    campaign_creator_id UUID REFERENCES campaign_creator(id) ON DELETE SET NULL,
    -- Brand linkage (always present)
    brand_ig_user_id TEXT NOT NULL,
    -- Creator info (from webhook payload or API response)
    creator_ig_user_id TEXT,
    creator_ig_handle TEXT,
    -- Post data (mirrors creator_post)
    instagram_post_id TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'story', 'reel')),
    post_url TEXT,
    caption TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    media_storage_path TEXT,
    thumbnail_url TEXT,
    -- Engagement snapshot
    like_count INTEGER DEFAULT 0,
    view_count INTEGER,
    comment_count INTEGER DEFAULT 0,
    -- Timestamps
    posted_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Capture provenance
    capture_source TEXT NOT NULL,  -- 'api_mention', 'webhook_mention', 'story_mention', 'hashtag', 'ai_radar'
    match_method TEXT,             -- 'caption', 'llm_vision', 'llm_audio', 'api_signal'
    match_confidence FLOAT,        -- 0.0–1.0
    raw_webhook_payload JSONB,     -- store raw event for debugging
    -- Deduplication
    CONSTRAINT unique_ugc_per_brand UNIQUE (brand_ig_user_id, instagram_post_id)
);
```

**Trade-off**: Clean separation, no FK violations, correct unique key, but duplicates some schema from `creator_post`; need separate API routes and UI components.

**Verdict**: Option B is architecturally cleaner. Option A is faster to implement but creates semantic confusion between campaign-scoped posts and brand-level UGC.

---

## 11. Temporal Workflow Patterns for UGC

The existing workflow patterns translate directly:

| Existing | UGC Equivalent |
|---------|---------------|
| `PostTrackingSchedulerWorkflow` | `UGCPollingSchedulerWorkflow` — same pattern, different cadence |
| `get_trackable_creators_activity` | `get_monitored_brands_activity` — query `ugc_brand_config` for active brands |
| `process_creator_posts_activity` | `process_brand_ugc_activity` — poll `mentioned_media`, `tags`, hashtag endpoints |
| `analyze_instagram_post` | `analyze_ugc_content` — same Claude vision, add STT for audio option |
| `download_and_store_media_sync` | Identical — reuse as-is |

Webhook-driven UGC capture uses a different pattern (no Temporal workflow needed for ingest — webhook handler writes directly to DB; Temporal used only for async media download + analysis):

```
Webhook event → FastAPI handler → write ugc_content row (stub) → start Temporal activity for media + analysis
```

---

## Key Findings

1. **The infrastructure exists** — Cheerful already built the hard parts: Apify integration, Claude vision analysis, Supabase Storage media pipeline, Temporal orchestration, and a `creator_post` table. The gap is extending from campaign-scoped to brand-level.

2. **The UNIQUE constraint is wrong for UGC** — `(campaign_creator_id, instagram_post_id)` assumes campaign scope. Zero-signup UGC needs `(brand_ig_user_id, instagram_post_id)` for deduplication.

3. **Stories are already a gap** — the current system explicitly doesn't capture Stories (Apify profile scraper limitation). This is a known gap the team intended to address.

4. **24h cadence is a known limitation** — Stories expire in 24h; the daily polling cadence was designed to catch them in time but has no guarantee.

5. **The analyzer is brand-agnostic** — `analyze_image_with_llm` and `caption_matches` take `product_name` and `product_description` parameters; they're not hardcoded to campaigns and can be reused for UGC analysis with a brand context.

6. **Separate table is the right call** — `ugc_content` table avoids polluting `creator_post` (which has campaign FK semantics throughout the codebase) while reusing all the service layer components.
