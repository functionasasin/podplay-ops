# Cheerful Content Tracking Model — TikTok Integration Analysis

**Aspect:** `cheerful-content-tracking-model`
**Wave:** 3 (Cheerful Architecture Analysis)
**Generated:** 2026-02-28

---

## Summary

Cheerful's post tracking system is **deeply Instagram-specific** at every layer: the database schema has an `instagram_post_id` column, the Temporal activity extracts `instagram_handle` from creators, the Apify service fetches only Instagram posts, the analysis prompt says "Instagram", and the API response returns `instagram_post_id`. TikTok content tracking requires changes across **9 files** and one database migration. TikTok also introduces new metrics (share_count, collect_count, duet/stitch tracking) that require either a JSONB sidecar column or explicit schema additions.

---

## Current Content Tracking Architecture

### Overview

Post tracking is a 48-hour scheduled Temporal workflow that:
1. Queries all `campaign_creator` records with an active tracking window (`post_tracking_ends_at > now`)
2. For each, fetches recent Instagram posts via Apify
3. Deduplicates against already-seen posts (`last_seen_post_id` optimization)
4. Runs two-phase analysis (caption match → Claude vision LLM) for product relevance
5. Saves matched posts with downloaded media to Supabase Storage
6. Updates `last_seen_post_id` and `post_last_checked_at`

There is also a **manual refresh endpoint** (`POST /campaigns/{id}/creators/{id}/refresh-posts`) that runs the same logic synchronously on demand.

### Tracking Lifecycle

```
Creator opts in / status transitions to "participating"
  ↓ maybe_set_tracking_dates() (status.py)
    → Sets post_tracking_started_at = now
    → Sets post_tracking_ends_at = now + 90 days
  ↓ PostTrackingSchedulerWorkflow (runs every 48h)
    → PostTrackingWorkflow.run()
      → get_trackable_creators_activity()     [5 min, 3 retries]
        → Queries campaign_creator WHERE post_tracking_ends_at > now
        → extract_instagram_handle() for each → skip if no Instagram handle
        → Returns list[TrackableCreator]
      → For each creator:
        → process_creator_posts_activity()    [5 min, 2 retries]
          → fetch_instagram_posts(handle, max_posts=10)  [Apify]
          → last_seen_post_id optimization: skip if newest post unchanged
          → For each post:
            → exists_by_instagram_post_id()  [dedup]
            → analyze_instagram_post()       [caption match → Claude vision]
            → download_and_store_media_sync() [Supabase Storage]
            → CreatorPostRepository.upsert()
          → Update last_seen_post_id, post_last_checked_at
```

### Tracking Trigger

**File:** `apps/backend/src/services/post_tracking/status.py`

Tracking starts when `is_participating()` returns True:
- **Gifting campaigns**: any status NOT in `{CONTACTED, UNRESPONSIVE, PENDING_DETAILS, READY_TO_SHIP, DECLINED}` → participating (e.g., SHIPPED, DELIVERED, POSTED)
- **Paid promotion campaigns**: any status NOT in `{NEW, NEGOTIATING, AWAITING_CONTRACT, DECLINED}` → participating (e.g., AGREED, CONTENT_SUBMITTED, CONTENT_LIVE)

Window: 90 days from participation start. Platform-agnostic — no changes needed here.

---

## Platform-Hardcoded Components (Problematic for TikTok)

### 1. Database Schema — `creator_post` Table

**File:** `apps/backend/src/models/database/creator_post.py`

```python
class CreatorPost(Base):
    """Stores Instagram posts detected from opted-in campaign creators."""

    # Instagram identifiers
    instagram_post_id: Mapped[str] = mapped_column(Text, nullable=False)

    # Post metadata
    post_type: Mapped[PostType] = mapped_column(Text, nullable=False)
    # PostType = Literal["post", "story", "reel"]   ← Instagram-specific types

    # Unique constraint
    __table_args__ = (
        UniqueConstraint(
            "campaign_creator_id",
            "instagram_post_id",           # ← hardcoded Instagram
            name="unique_post_per_creator",
        ),
    )
```

**Problems:**
- `instagram_post_id` column name is platform-specific
- `PostType` has only Instagram types: "post", "story", "reel"
- Unique constraint is on `instagram_post_id` — doesn't work for TikTok video IDs
- No `platform` column — can't distinguish Instagram vs TikTok posts
- Missing TikTok-specific metrics: `share_count`, `collect_count`

### 2. Repository — `CreatorPostRepository`

**File:** `apps/backend/src/repositories/creator_post.py`

```python
def exists_by_instagram_post_id(
    self,
    campaign_creator_id: uuid.UUID,
    instagram_post_id: str,
) -> bool:
    ...
    .where(CreatorPost.instagram_post_id == instagram_post_id)

def upsert(self, post: CreatorPost) -> tuple[CreatorPost, bool]:
    ...
    .on_conflict_do_nothing(
        index_elements=["campaign_creator_id", "instagram_post_id"]
    )
```

**Problems:**
- Method `exists_by_instagram_post_id` is named and scoped to Instagram
- `upsert` conflict target references `instagram_post_id` directly

### 3. Temporal Models

**File:** `apps/backend/src/models/temporal/post_tracking.py`

```python
class TrackableCreator(BaseModel):
    campaign_creator_id: uuid.UUID
    campaign_id: uuid.UUID
    instagram_handle: str     # ← hardcoded Instagram
    product_name: str
    product_description: str | None
```

**Problem:** `instagram_handle` field — the Temporal workflow uses this model as the intermediate representation. TikTok creators have a TikTok handle, not an Instagram handle.

### 4. Temporal Activity — Fetch & Filter

**File:** `apps/backend/src/temporal/activity/post_tracking_activity.py`

```python
@activity.defn
def get_trackable_creators_activity() -> list[dict]:
    for creator in creators:
        # Extract Instagram handle ← platform-hardcoded filter
        instagram_handle = extract_instagram_handle(
            creator.social_media_handles or []
        )
        if not instagram_handle:
            continue  # ← skips ALL non-Instagram creators

        trackable.append(TrackableCreator(
            instagram_handle=instagram_handle,  # ← Instagram
            ...
        ))

@activity.defn
def process_creator_posts_activity(params):
    creator = params.creator
    # Fetch posts from Instagram ← hardcoded
    posts = fetch_instagram_posts(creator.instagram_handle, max_posts=10)
    ...
    exists = CreatorPostRepository(db).exists_by_instagram_post_id(
        creator.campaign_creator_id, post.id,  # ← Instagram method
    )
    ...
```

**Problem:** TikTok creators would be skipped entirely by `get_trackable_creators_activity` since they won't have an Instagram handle, and `process_creator_posts_activity` calls only `fetch_instagram_posts`.

### 5. Apify Fetch Service

**File:** `apps/backend/src/services/post_tracking/apify_posts.py`

```python
def fetch_instagram_posts(username: str, max_posts: int = 10) -> list[InstagramPost]:
    client.actor("apify/instagram-profile-scraper").call(...)
    # Returns: InstagramPost with instagram-specific fields
```

```python
@dataclass
class InstagramPost:
    id: str
    shortcode: str      # ← Instagram-specific
    url: str
    caption: str | None
    post_type: str      # 'image', 'video', 'reel', 'story'
    display_url: str | None
    video_url: str | None
    like_count: int
    comment_count: int
    view_count: int | None
    timestamp: str | None
```

**Missing TikTok metrics:** `share_count`, `collect_count`, `duet_count`, `stitch_count`, `music_id`, `hashtags[]`, `play_count` (TikTok name for view_count).

### 6. Post Analyzer

**File:** `apps/backend/src/services/post_tracking/analyzer.py`

```python
def build_analysis_prompt(...) -> str:
    return f"""You are analyzing an Instagram {post_type} to determine if it..."""
    #                                ↑ hardcoded "Instagram"
```

**Problem:** Minor but incorrect for TikTok — should say "TikTok video" not "Instagram post."

### 7. API Response Model

**File:** `apps/backend/src/models/api/creator_post.py`

```python
class CreatorPostResponse(BaseModel):
    id: uuid.UUID
    instagram_post_id: str    # ← hardcoded Instagram field in API response
    post_type: str
    ...
```

**Problem:** `instagram_post_id` is exposed in the API response. Frontend consumers reference this field. Renaming it is a breaking API change.

### 8. API Route

**File:** `apps/backend/src/api/route/creator_post.py`

```python
instagram_handle = extract_instagram_handle(creator.social_media_handles or [])
if not instagram_handle:
    raise HTTPException(
        status_code=400,
        detail="Creator has no Instagram handle",   # ← hardcoded error
    )
```

---

## TikTok Video Data Model

### What Apify Returns for TikTok Videos

From `clockworks/free-tiktok-scraper` and `apify/tiktok-scraper` (documented in `third-party-apify-tiktok` analysis):

```json
{
  "id": "7234567890123456789",
  "webVideoUrl": "https://www.tiktok.com/@username/video/7234567890123456789",
  "text": "caption text #hashtag1 #hashtag2",
  "createTime": 1706745600,
  "authorMeta": {
    "id": "123456789",
    "name": "username",
    "nickName": "Display Name"
  },
  "musicMeta": {
    "musicId": "7234000000000000000",
    "musicName": "Song Name",
    "musicAuthor": "Artist Name",
    "musicOriginal": true
  },
  "covers": {
    "default": "https://p16-sign.tiktokcdn.com/...",
    "originCover": "https://...",
    "dynamicCover": "https://..."
  },
  "videoMeta": {
    "height": 1920,
    "width": 1080,
    "duration": 30,
    "downloadAddr": "https://..."
  },
  "diggCount": 15420,        // likes
  "shareCount": 890,         // shares ← TikTok-unique
  "playCount": 145200,       // views/plays
  "commentCount": 234,
  "collectCount": 1200,      // saves ← TikTok-unique
  "hashtags": [
    {"id": "123", "name": "hashtag1", "title": "Hashtag 1"},
    {"id": "456", "name": "hashtag2", "title": "Hashtag 2"}
  ],
  "isAd": false,
  "duetFromId": "",          // duet source video ID
  "stitchFromId": ""         // stitch source video ID
}
```

### TikTok vs Instagram Metric Comparison

| Metric | Instagram Field | TikTok Field | Status |
|--------|----------------|--------------|--------|
| Likes | `like_count` | `diggCount` | Same concept, different name |
| Comments | `comment_count` | `commentCount` | Same |
| Views/plays | `view_count` (optional) | `playCount` | Same concept |
| Shares | N/A | `shareCount` | **TikTok-unique** |
| Saves | N/A | `collectCount` | **TikTok-unique** |
| Caption | `caption` | `text` | Same concept |
| Post URL | `url` | `webVideoUrl` | Same concept |
| Thumbnail | `display_url` | `covers.default` | Same concept |
| Video URL | `video_url` | `videoMeta.downloadAddr` | Same concept |
| Timestamp | `timestamp` (ISO) | `createTime` (Unix) | Different format |
| Post ID | shortcode/id | `id` | Same concept |
| Duet source | N/A | `duetFromId` | **TikTok-unique** |
| Stitch source | N/A | `stitchFromId` | **TikTok-unique** |
| Sound/music | N/A | `musicMeta` | **TikTok-unique** |
| Hashtags | in caption text | `hashtags[]` (structured) | TikTok structured |

### TikTok Post Types

Current `PostType = Literal["post", "story", "reel"]` does not include TikTok types:

| TikTok Type | Description | Instagram Equivalent |
|-------------|-------------|---------------------|
| `video` | Standard short video | reel |
| `photo` | Photo carousel (new 2024 format) | post |
| `live` | Live stream (if archived) | — |
| `duet` | Split-screen with another video | — |
| `stitch` | Clip + response video | — |

---

## Data Source Options for TikTok Post Tracking

### Option A: Apify Polling (Recommended First Step)

**Actor:** `clockworks/free-tiktok-scraper` or `apify/tiktok-scraper`
**Mode:** User profile scrape → recent videos
**Frequency:** Every 48h (matches current PostTrackingSchedulerWorkflow)

```python
# New service: fetch_tiktok_posts(username, max_posts=10)
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "profiles": [f"https://www.tiktok.com/@{username}"],
    "resultsPerPage": max_posts,
    "scrapeType": "profile",
})
```

**Returns:** Recent videos with all fields listed above.
**Cost:** ~$0.30/1000 results (free actor).
**Latency:** ~30-120s per profile.
**Reliability:** Medium (Apify manages anti-bot, but TikTok aggressively blocks scrapers).

### Option B: TikTok Research API (Requires Application)

**Endpoint:** `POST https://open.tiktokapis.com/v2/research/video/query/`
**Fields available:** video_id, create_time, username, region_code, video_description, like_count, comment_count, share_count, view_count, hashtag_names

**For tracking:** Query videos by specific `username` over a date range:
```json
{
  "query": {
    "and": [
      {"field_name": "username", "field_values": ["creatorhandle"]},
      {"field_name": "create_date", "field_values": ["20260101", "20260228"]}
    ]
  },
  "start_date": "20260101",
  "end_date": "20260228"
}
```

**Access:** Research API requires approved application (academic/commercial). Not suitable for quick implementation but superior data quality and reliability.

### Option C: TikTok Display API (Requires Creator OAuth)

**Endpoint:** `GET https://open.tiktokapis.com/v2/video/list/`
**Requires:** Creator's OAuth access_token (they must have connected TikTok via Login Kit)

**Returns:** Creator's own video list with: `id`, `title`, `video_description`, `embed_link`, `like_count`, `comment_count`, `share_count`, `view_count`, `create_time`

**Limitation:** Only works for creators who have explicitly authorized Cheerful via OAuth. Not viable for general post tracking unless Cheerful builds a TikTok Login Kit flow first.

### Recommended: Option A (Apify) for MVP, Option C (Display API) for premium

---

## Required Schema Changes

### Migration: `creator_post` Table Refactor

Two-phase migration recommended to avoid downtime:

**Phase 1 — Add new columns (backward compatible):**
```sql
BEGIN;

-- Add platform column (defaults to instagram for existing rows)
ALTER TABLE creator_post
  ADD COLUMN platform TEXT NOT NULL DEFAULT 'instagram',
  ADD COLUMN platform_post_id TEXT,           -- platform-agnostic post ID
  ADD COLUMN platform_metrics JSONB DEFAULT '{}'::jsonb;  -- TikTok: share_count, collect_count, etc.

-- Backfill platform_post_id from existing instagram_post_id
UPDATE creator_post SET platform_post_id = instagram_post_id;

-- Make platform_post_id non-nullable after backfill
ALTER TABLE creator_post ALTER COLUMN platform_post_id SET NOT NULL;

-- Add new unique constraint (platform-aware)
ALTER TABLE creator_post ADD CONSTRAINT unique_post_per_creator_platform
  UNIQUE (campaign_creator_id, platform_post_id);

COMMIT;
```

**Phase 2 — Deprecate old columns (after code ships):**
```sql
BEGIN;

-- Drop old constraint and column after code is updated
ALTER TABLE creator_post DROP CONSTRAINT unique_post_per_creator;
ALTER TABLE creator_post DROP COLUMN instagram_post_id;

COMMIT;
```

**Resulting schema:**
```sql
CREATE TABLE creator_post (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  campaign_creator_id UUID NOT NULL REFERENCES campaign_creator(id) ON DELETE CASCADE,

  -- Platform identification
  platform TEXT NOT NULL DEFAULT 'instagram',   -- 'instagram' | 'tiktok'
  platform_post_id TEXT NOT NULL,               -- platform-native post/video ID

  -- Post metadata
  post_type TEXT NOT NULL,          -- 'post'|'story'|'reel'|'video'|'photo'|'live'|'duet'|'stitch'
  post_url TEXT NOT NULL,
  caption TEXT,

  -- Media
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_storage_path TEXT,
  thumbnail_url TEXT,

  -- Core engagement metrics (cross-platform)
  like_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER,               -- play_count for TikTok
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- Platform-specific metrics (TikTok: share_count, collect_count, duet_from_id, etc.)
  platform_metrics JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  posted_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Match metadata
  match_method TEXT NOT NULL,       -- 'caption' | 'llm'
  match_reason TEXT,

  UNIQUE (campaign_creator_id, platform_post_id)
);
```

---

## File-by-File Change Requirements

### 1. Database Model

**File:** `apps/backend/src/models/database/creator_post.py`

| Change | Type | Notes |
|--------|------|-------|
| Add `platform: Mapped[str]` column | Schema | Default 'instagram' |
| Rename `instagram_post_id` → `platform_post_id` | Schema | Breaking — needs migration |
| Add `platform_metrics: Mapped[dict]` JSONB column | Schema | For TikTok share_count, collect_count, etc. |
| Update `PostType` to include TikTok types | Code | Add "video", "photo", "live", "duet", "stitch" |
| Update `UniqueConstraint` to use `platform_post_id` | Schema | |

### 2. Repository

**File:** `apps/backend/src/repositories/creator_post.py`

| Change | Type | Notes |
|--------|------|-------|
| Rename `exists_by_instagram_post_id` → `exists_by_platform_post_id` | Code | Update callers |
| Update `upsert` conflict target to `platform_post_id` | Code | |
| Add optional `platform` filter to queries | Code | For platform-specific queries |

### 3. Temporal Models

**File:** `apps/backend/src/models/temporal/post_tracking.py`

| Change | Type | Notes |
|--------|------|-------|
| Rename `TrackableCreator.instagram_handle` → `platform_handle` | Code | |
| Add `TrackableCreator.platform: str` field | Code | "instagram" \| "tiktok" |

```python
class TrackableCreator(BaseModel):
    campaign_creator_id: uuid.UUID
    campaign_id: uuid.UUID
    platform: str           # NEW: "instagram" | "tiktok"
    platform_handle: str    # RENAMED: was instagram_handle
    product_name: str
    product_description: str | None
```

### 4. Temporal Activity

**File:** `apps/backend/src/temporal/activity/post_tracking_activity.py`

| Change | Type | Notes |
|--------|------|-------|
| `get_trackable_creators_activity`: extract handles for ALL platforms, not just Instagram | Code | Use platform-aware handle extraction |
| `process_creator_posts_activity`: platform dispatch for fetch + dedup | Code | Instagram vs TikTok |

```python
# get_trackable_creators_activity: platform-aware handle extraction
from src.services.utils.social import extract_handle_for_platform  # new

for creator in creators:
    for platform in ["instagram", "tiktok"]:
        handle = extract_handle_for_platform(creator.social_media_handles, platform)
        if handle:
            trackable.append(TrackableCreator(
                platform=platform,
                platform_handle=handle,
                ...
            ))
            break  # one tracking entry per creator (primary platform)

# process_creator_posts_activity: platform dispatch
if creator.platform == "instagram":
    posts = fetch_instagram_posts(creator.platform_handle, max_posts=10)
    exists_fn = CreatorPostRepository(db).exists_by_platform_post_id
    create_fn = create_instagram_creator_post
elif creator.platform == "tiktok":
    posts = fetch_tiktok_posts(creator.platform_handle, max_posts=10)
    exists_fn = CreatorPostRepository(db).exists_by_platform_post_id
    create_fn = create_tiktok_creator_post
```

### 5. New Apify Fetch Service

**New file:** `apps/backend/src/services/post_tracking/apify_tiktok_posts.py`

```python
@dataclass
class TikTokPost:
    """Structured TikTok video data."""
    id: str                    # TikTok video ID
    url: str                   # webVideoUrl
    caption: str | None        # text field
    post_type: str             # 'video' | 'photo' | 'duet' | 'stitch' | 'live'
    cover_url: str | None      # covers.default
    download_url: str | None   # videoMeta.downloadAddr
    like_count: int            # diggCount
    comment_count: int
    play_count: int            # playCount (view_count equivalent)
    share_count: int           # TikTok-unique
    collect_count: int         # TikTok-unique (saves)
    hashtags: list[str]        # list of hashtag names
    music_id: str | None       # musicMeta.musicId
    music_name: str | None     # musicMeta.musicName
    duet_from_id: str | None   # source video for duets
    stitch_from_id: str | None # source video for stitches
    created_at: int | None     # Unix timestamp


def fetch_tiktok_posts(username: str, max_posts: int = 10) -> list[TikTokPost]:
    """Fetch recent TikTok videos via Apify clockworks/free-tiktok-scraper."""
    client = ApifyClient(settings.APIFY_API_TOKEN)
    run = client.actor("clockworks/free-tiktok-scraper").call(run_input={
        "profiles": [f"https://www.tiktok.com/@{username}"],
        "resultsPerPage": max_posts,
        "scrapeType": "profile",
    })
    ...
```

### 6. Post Processor

**File:** `apps/backend/src/services/post_tracking/post_processor.py`

| Change | Type | Notes |
|--------|------|-------|
| Add `create_tiktok_creator_post()` function | Code | Maps TikTokPost → CreatorPost |
| Store TikTok-specific metrics in `platform_metrics` JSONB | Code | share_count, collect_count, hashtags, music_id |
| Use `play_count` as `view_count` for TikTok | Code | |

```python
def create_tiktok_creator_post(
    post: TikTokPost,
    context: ProcessPostContext,
    analysis: AnalysisResult,
    media_storage_path: str | None = None,
) -> CreatorPost:
    return CreatorPost(
        id=uuid.uuid4(),
        campaign_id=context.campaign_id,
        campaign_creator_id=context.campaign_creator_id,
        platform="tiktok",
        platform_post_id=post.id,
        post_type=post.post_type,          # 'video', 'photo', 'duet', 'stitch'
        post_url=post.url,
        caption=post.caption[:500] if post.caption else None,
        media_urls=[post.download_url] if post.download_url else [],
        media_storage_path=media_storage_path,
        thumbnail_url=post.cover_url,
        like_count=post.like_count,
        view_count=post.play_count,        # play_count maps to view_count
        comment_count=post.comment_count,
        platform_metrics={                 # TikTok-specific extras
            "share_count": post.share_count,
            "collect_count": post.collect_count,
            "hashtags": post.hashtags,
            "music_id": post.music_id,
            "music_name": post.music_name,
            "duet_from_id": post.duet_from_id,
            "stitch_from_id": post.stitch_from_id,
        },
        posted_at=datetime.fromtimestamp(post.created_at, tz=timezone.utc)
                  if post.created_at else None,
        matched_at=datetime.utcnow(),
        match_method=analysis.method,
        match_reason=analysis.reason,
    )
```

### 7. Post Analyzer

**File:** `apps/backend/src/services/post_tracking/analyzer.py`

| Change | Type | Notes |
|--------|------|-------|
| Make `build_analysis_prompt` platform-aware | Code | Minor — change "Instagram" reference |
| Handle TikTok's structured hashtag array for caption matching | Code | TikTok hashtags are in `hashtags[]`, not just caption text |

```python
def build_analysis_prompt(
    product_name: str,
    product_description: str | None,
    caption: str | None,
    post_type: str,
    platform: str = "instagram",   # NEW parameter
) -> str:
    platform_label = "TikTok video" if platform == "tiktok" else f"Instagram {post_type}"
    return f"""You are analyzing a {platform_label} to determine if it mentions..."""
```

### 8. API Response Model

**File:** `apps/backend/src/models/api/creator_post.py`

| Change | Type | Notes |
|--------|------|-------|
| Rename `instagram_post_id` → `platform_post_id` | Breaking API change | Frontend must update |
| Add `platform: str` field | Code | "instagram" \| "tiktok" |
| Add `share_count: int | None` | Code | TikTok-specific but safe to expose for all |
| Add `platform_metrics: dict | None` | Code | Raw TikTok extras |

**Note:** `instagram_post_id` in `CreatorPostResponse` is a **frontend-breaking change**. If frontend already uses this field, a transition period with both fields is needed.

### 9. API Route

**File:** `apps/backend/src/api/route/creator_post.py`

| Change | Type | Notes |
|--------|------|-------|
| Replace `extract_instagram_handle` with platform-aware extraction | Code | Try TikTok if no Instagram |
| Update error message to be platform-agnostic | Code | "Creator has no social handle for tracking" |

---

## campaign_creator Table: What Works as-is

The `campaign_creator` table is **mostly platform-agnostic** already:

| Field | Status for TikTok | Notes |
|-------|------------------|-------|
| `social_media_handles` JSONB | ✅ Works | Already stores `{platform: "tiktok", handle: "...", url: "..."}` — the `SocialMediaHandleAndUrl` model explicitly includes "tiktok" as a valid platform (line 41) |
| `post_tracking_started_at` | ✅ Works | Platform-agnostic |
| `post_tracking_ends_at` | ✅ Works | Platform-agnostic |
| `post_last_checked_at` | ✅ Works | Platform-agnostic |
| `last_seen_post_id` | ✅ Works | Stores a string post ID — TikTok video IDs can use this |
| `gifting_status` | ✅ Works | Participation logic is platform-agnostic |
| `paid_promotion_status` | ✅ Works | Platform-agnostic |

No schema changes to `campaign_creator` are needed for basic TikTok post tracking.

---

## TikTok-Specific Post Tracking Opportunities

Beyond basic content detection, TikTok offers unique tracking capabilities:

### 1. Hashtag Campaign Tracking

TikTok creators often use a campaign-specific hashtag (e.g., `#BrandXChallenge`). Instead of only polling creator profiles, Cheerful could monitor a hashtag stream:

```python
# Apify hashtag scraper
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "hashtags": ["#BrandXChallenge"],
    "resultsPerPage": 100,
})
```

This would catch UGC from creators Cheerful doesn't have in its database.

**Integration point:** New `campaign` field `tiktok_campaign_hashtag` + new activity `track_tiktok_hashtag_activity`.

### 2. Duet/Stitch Detection

When a creator duets or stitches a brand's hero video, `duet_from_id` / `stitch_from_id` fields allow Cheerful to:
- Detect that a creator responded to the brand's challenge video
- Attribute the post to a specific campaign even without a caption mention

```python
# In analyze_tiktok_post():
if post.duet_from_id == campaign.tiktok_hero_video_id:
    return AnalysisResult(matches=True, method="duet_from_brand", ...)
```

### 3. Sound/Music Campaign Tracking

If a brand creates a custom TikTok sound (`musicOriginal=true`), Cheerful could track videos using that sound:

```python
# Apify sound scraper
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "sounds": ["https://www.tiktok.com/music/Brand-Sound-7234000000000000000"],
    "resultsPerPage": 100,
})
```

**Integration point:** New `campaign` field `tiktok_campaign_sound_id`.

### 4. Share/Save Metrics for ROI Reporting

TikTok's `share_count` and `collect_count` are high-signal engagement metrics not available on Instagram. Adding them to `platform_metrics` allows future reporting:

- **Share rate** = share_count / play_count
- **Save rate** = collect_count / play_count
- Both metrics are strong signals of content resonance for influencer ROI measurement

---

## Integration Summary

### Gap Analysis Table

| Component | Current State | TikTok Requirement | Schema Change | Code Change | Effort |
|-----------|--------------|-------------------|---------------|-------------|--------|
| `creator_post` table | Instagram-specific (`instagram_post_id`) | Rename to `platform_post_id`, add `platform`, `platform_metrics` | **Yes** (migration) | Yes | Medium |
| `CreatorPost` model | Instagram columns | Update field names + PostType | No (schema) | Yes | Small |
| `CreatorPostRepository` | Instagram method names | Rename methods | No | Yes | Small |
| `TrackableCreator` model | `instagram_handle` field | Add `platform`, rename field | No | Yes | Small |
| `get_trackable_creators_activity` | Instagram-only filter | Multi-platform handle extraction | No | Yes | Small |
| `process_creator_posts_activity` | `fetch_instagram_posts()` | Platform dispatch | No | Yes | Medium |
| `apify_posts.py` | Instagram only | New `apify_tiktok_posts.py` | No | Yes (new file) | Medium |
| `post_processor.py` | Instagram logic | Add `create_tiktok_creator_post()` | No | Yes | Small |
| `analyzer.py` | "Instagram" prompt text | Platform-aware prompt | No | Yes | Trivial |
| `creator_post` API model | `instagram_post_id` response | `platform_post_id` + `platform` fields | No | Yes | Small |
| API route | Instagram handle extraction | Platform-aware handle extraction | No | Yes | Small |

### Recommended Implementation Order

1. **Database migration** — Add `platform`, `platform_post_id`, `platform_metrics` columns; backfill from `instagram_post_id`; update unique constraint (keep old column temporarily)
2. **`apify_tiktok_posts.py`** — `TikTokPost` dataclass + `fetch_tiktok_posts()` function
3. **`creator_post.py` model** — Add `platform`, `platform_post_id`, `platform_metrics`; update PostType
4. **`creator_post` repository** — Add `exists_by_platform_post_id()`, update `upsert` conflict target
5. **`post_tracking.py` temporal models** — Add `platform`, rename `instagram_handle` → `platform_handle`
6. **`post_processor.py`** — Add `create_tiktok_creator_post()` using new `TikTokPost` fields
7. **`post_tracking_activity.py`** — Platform dispatch in both activities
8. **`analyzer.py`** — Platform-aware prompt
9. **API model + route** — `platform_post_id`, add `platform` to response (coordinate with frontend)
10. **Phase 2 migration** — Drop old `instagram_post_id` column after code ships

### Estimated Effort

| Step | Effort |
|------|--------|
| Database migrations (2 phases) | 1 day |
| New Apify TikTok fetch service | 1 day |
| Model + repository updates | 0.5 day |
| Temporal model + activity updates | 1 day |
| Post processor + analyzer updates | 0.5 day |
| API model + route updates | 0.5 day |
| Testing + QA | 2 days |
| **Total** | **~6.5 days** |

---

## Key Risk: Platform-Specific Metric Semantics

The mapping between Instagram and TikTok metrics is not 1:1:

- `view_count` on Instagram is optional (only for video/reels). On TikTok, `play_count` is always present and is the primary reach metric.
- TikTok `share_count` has no Instagram equivalent — it's a critical metric for TikTok ROI but the schema doesn't support it in the core columns.
- TikTok `collect_count` (saves) also has no Instagram equivalent.

**Recommendation:** Store TikTok-specific metrics in `platform_metrics` JSONB immediately, and promote high-value ones (share_count, collect_count) to top-level columns in a future iteration when reporting requirements are clearer.
