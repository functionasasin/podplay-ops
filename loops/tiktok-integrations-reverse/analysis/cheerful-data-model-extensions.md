# Cheerful Data Model Extensions — TikTok Integration Blueprint

**Aspect:** `cheerful-data-model-extensions`
**Wave:** 3 (Cheerful Architecture Analysis)
**Generated:** 2026-02-28

---

## Summary

Based on Wave 1/2 TikTok API research and Wave 3 architecture analysis (creator discovery pipeline, content tracking model, campaign workflow touchpoints), this document provides an exhaustive blueprint of every database change needed to support TikTok integrations across Cheerful. The changes span **4 existing tables** (requiring migrations), **2 new tables**, and a set of new enum values and JSONB schema extensions.

**Key design principle inherited from existing architecture:** JSONB is used heavily for platform-specific fields (e.g., `creator.profile_data`, `campaign.discovery_config`). New TikTok-specific fields follow this same pattern — core cross-platform fields get explicit columns; platform-specific extras go into JSONB sidecars.

---

## Current Data Model Baseline

### Tables Relevant to TikTok Integration

| Table | Rows (est.) | Platform-Specific Issues | Migration Needed? |
|-------|-------------|--------------------------|-------------------|
| `creator` | Many | None — `platform TEXT` + JSONB `profile_data` already handles TikTok | **No** |
| `creator_post` | Growing | `instagram_post_id` column, Instagram-only `PostType`, no `platform` column | **Yes** |
| `campaign_creator` | Growing | `social_media_handles` JSONB already supports `"tiktok"` platform | **No (column level)** |
| `campaign` | Tens | No TikTok-specific campaign config fields | **No (JSONB extension)** |

---

## 1. `creator` Table — No Migration Required

**File:** `apps/backend/src/models/database/creator.py`

**Current schema:**
```python
class Creator(Base):
    __tablename__ = "creator"

    platform: Mapped[str]          # "instagram", "youtube", "tiktok"
    handle: Mapped[str]            # @username
    email: Mapped[str | None]
    follower_count: Mapped[int]
    is_verified: Mapped[bool]
    location: Mapped[str | None]
    keywords: Mapped[list[str]]    # ARRAY(Text)
    profile_data: Mapped[dict]     # JSONB — all platform-specific fields
    snapshots: Mapped[dict]        # JSONB — historical metric snapshots
    profile_image_path: Mapped[str | None]
    profile_image_etag: Mapped[str | None]
    source: Mapped[str | None]
    UNIQUE (platform, handle)
```

**TikTok compatibility:** Fully compatible as-is. `platform = "tiktok"` is already a valid value (not constrained to specific values). The `profile_data` JSONB absorbs all TikTok-specific creator fields without any schema change.

**TikTok `profile_data` schema (new convention):**
```json
{
  "tiktok_user_id": "6868686868686868686",
  "display_name": "Creator Name",
  "bio": "Check my link 👇",
  "avatar_url": "https://p16-sign.tiktokcdn.com/...",
  "bio_link": "https://linktr.ee/creatorname",
  "video_count": 142,
  "heart_count": 2340000,
  "digg_count": 45000,
  "following_count": 1200,
  "region": "US",
  "commerce_user_role": null
}
```

**`snapshots` JSONB convention for TikTok:**
```json
[
  {
    "captured_at": "2026-02-28T00:00:00Z",
    "follower_count": 145000,
    "heart_count": 2340000,
    "video_count": 142
  }
]
```

**`source` new values for TikTok:**
| Value | Meaning |
|-------|---------|
| `"apify_tiktok_keyword"` | Discovered via keyword search on Apify TikTok actor |
| `"apify_tiktok_hashtag"` | Discovered via hashtag search on Apify TikTok actor |
| `"apify_tiktok_profile"` | Enriched via single-profile Apify actor |
| `"tiktok_display_api"` | Enriched via official TikTok Display API (creator OAuth) |
| `"tiktok_research_api"` | Discovered/enriched via TikTok Research API |
| `"csv_import_tiktok"` | Imported via CSV with TikTok handle column |

**No migration needed.** Only code changes: new `save_creator_from_tiktok()` function and new TikTok branch in enrichment service.

---

## 2. `creator_post` Table — **Migration Required**

**File:** `apps/backend/src/models/database/creator_post.py`

This is the most significant migration. The table is currently Instagram-hardcoded at every level.

### Current Schema Problems

```python
class CreatorPost(Base):
    """Stores Instagram posts detected from opted-in campaign creators."""

    # PROBLEM 1: No platform column — can't distinguish Instagram vs TikTok
    # PROBLEM 2: Instagram-specific ID column
    instagram_post_id: Mapped[str] = mapped_column(Text, nullable=False)

    # PROBLEM 3: Instagram-only PostType
    post_type: Mapped[PostType] = mapped_column(Text, nullable=False)
    # PostType = Literal["post", "story", "reel"]

    # PROBLEM 4: No TikTok-specific metrics
    # Missing: share_count, collect_count, hashtags, music_id, duet_from_id

    # PROBLEM 5: Unique constraint names Instagram column
    __table_args__ = (
        UniqueConstraint(
            "campaign_creator_id",
            "instagram_post_id",           # ← must be updated
            name="unique_post_per_creator",
        ),
    )
```

### Target Schema

```sql
CREATE TABLE creator_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  campaign_creator_id UUID NOT NULL REFERENCES campaign_creator(id) ON DELETE CASCADE,

  -- Platform identification (NEW)
  platform TEXT NOT NULL DEFAULT 'instagram',    -- 'instagram' | 'tiktok'
  platform_post_id TEXT NOT NULL,                -- renamed from instagram_post_id

  -- Post metadata
  post_type TEXT NOT NULL,                       -- extended (see below)
  post_url TEXT NOT NULL,
  caption TEXT,

  -- Media
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_storage_path TEXT,
  thumbnail_url TEXT,

  -- Core engagement metrics (cross-platform)
  like_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER,                            -- play_count for TikTok
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- Platform-specific sidecar (NEW)
  platform_metrics JSONB DEFAULT '{}'::jsonb,   -- TikTok: share_count, collect_count, etc.

  -- Timestamps
  posted_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Match metadata
  match_method TEXT NOT NULL,                    -- 'caption' | 'llm' | 'duet' | 'stitch' | 'hashtag'
  match_reason TEXT,

  UNIQUE (campaign_creator_id, platform_post_id)  -- updated constraint
);
```

### Migration Strategy: Two-Phase (Zero Downtime)

**Phase 1 — Additive changes (deploy code + run migration simultaneously):**

```sql
BEGIN;

-- Step 1: Add new columns with safe defaults
ALTER TABLE creator_post
  ADD COLUMN platform TEXT NOT NULL DEFAULT 'instagram',
  ADD COLUMN platform_post_id TEXT,
  ADD COLUMN platform_metrics JSONB DEFAULT '{}'::jsonb;

-- Step 2: Backfill platform_post_id from existing instagram_post_id
UPDATE creator_post
SET platform_post_id = instagram_post_id
WHERE platform_post_id IS NULL;

-- Step 3: Make platform_post_id non-nullable after backfill
ALTER TABLE creator_post
  ALTER COLUMN platform_post_id SET NOT NULL;

-- Step 4: Add new unique constraint (platform-aware)
ALTER TABLE creator_post
  ADD CONSTRAINT unique_post_per_creator_platform
  UNIQUE (campaign_creator_id, platform_post_id);

-- Note: Keep old constraint + column alive until Phase 2

COMMIT;
```

**Phase 2 — Cleanup (after code ships and is stable):**

```sql
BEGIN;

-- Drop old Instagram-specific constraint
ALTER TABLE creator_post
  DROP CONSTRAINT unique_post_per_creator;

-- Drop old column
ALTER TABLE creator_post
  DROP COLUMN instagram_post_id;

COMMIT;
```

### `PostType` Extension

Current: `Literal["post", "story", "reel"]`

Extended:
```python
PostType = Literal[
    # Instagram types (existing)
    "post",
    "story",
    "reel",
    # TikTok types (new)
    "video",      # Standard TikTok short video
    "photo",      # TikTok photo carousel (2024 format)
    "live",       # Archived live stream
    "duet",       # Split-screen duet with another video
    "stitch",     # Clip + response video
]
```

### `MatchMethod` Extension

Current: `Literal["caption", "llm"]`

Extended:
```python
MatchMethod = Literal[
    "caption",     # Keyword match in caption text
    "llm",         # Claude vision analysis
    "duet",        # Duet from brand hero video (TikTok-specific)
    "stitch",      # Stitch from brand hero video (TikTok-specific)
    "hashtag",     # Matched via campaign hashtag scan (TikTok-specific)
    "sound",       # Matched via campaign sound/music scan (TikTok-specific)
]
```

### `platform_metrics` JSONB Schema for TikTok

```json
{
  "share_count": 890,
  "collect_count": 1200,
  "hashtags": ["skincare", "beauty", "brandname"],
  "music_id": "7234000000000000000",
  "music_name": "Brand Sound",
  "music_author": "Brand Name",
  "music_original": true,
  "duet_from_id": null,
  "stitch_from_id": null,
  "play_count_raw": 145200
}
```

**Note on `view_count` vs TikTok `play_count`:** The existing `view_count` column maps to `play_count` for TikTok. The raw `play_count` is also stored in `platform_metrics` for reference. This avoids a breaking column rename while preserving semantic clarity.

### Code Changes Required for `creator_post` Table

| File | Change | Impact |
|------|--------|--------|
| `models/database/creator_post.py` | Add `platform`, `platform_post_id`, `platform_metrics` columns; extend `PostType`; update `UniqueConstraint` | Schema |
| `repositories/creator_post.py` | Add `exists_by_platform_post_id()`; update `upsert()` conflict target | Code |
| `models/api/creator_post.py` | Add `platform`, `platform_metrics` fields; rename `instagram_post_id` → `platform_post_id` in response | **Breaking API change** |
| `models/temporal/post_tracking.py` | Add `platform` field to `TrackableCreator`; rename `instagram_handle` → `platform_handle` | Code |
| `temporal/activity/post_tracking_activity.py` | Platform dispatch for both activities | Code |
| `services/post_tracking/apify_tiktok_posts.py` | **New file** — TikTokPost dataclass + fetch_tiktok_posts() | New file |
| `services/post_tracking/post_processor.py` | Add `create_tiktok_creator_post()` | Code |
| `services/post_tracking/analyzer.py` | Platform-aware prompt (`platform` parameter) | Code |
| `api/route/creator_post.py` | Platform-aware handle extraction + error message | Code |

---

## 3. `campaign_creator` Table — No Migration Required

**File:** `apps/backend/src/models/database/campaign_creator.py`

**Current relevant column:**
```python
social_media_handles: Mapped[list[dict]] = mapped_column(
    JSONB(none_as_null=True), ...
)
```

**`SocialMediaHandleAndUrl` Pydantic model** (line 38-47 in campaign_creator.py):
```python
class SocialMediaHandleAndUrl(BaseModel):
    platform: str  # 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'other'
    handle: str
    url: str | None
```

**TikTok compatibility:** Already fully supported. The `platform` field already includes `"tiktok"` as a valid value in the docstring description (line 40: `'tiktok'`). No schema change needed.

**New JSONB fields for TikTok-specific campaign creator state** — these go into existing `social_media_handles` or new optional top-level fields. However, since the TikTok-specific fields are campaign-level config and workflow state, they should go on the `campaign` table, not `campaign_creator`. See Section 4.

**One optional extension (low priority):** Add `tiktok_affiliate_link` column to track per-creator TikTok Shop affiliate URLs:

```sql
-- Optional Phase 2 addition (only needed for TikTok Shop affiliate campaigns)
ALTER TABLE campaign_creator
  ADD COLUMN tiktok_affiliate_link TEXT;
```

This is deferrable until TikTok Shop workflow is implemented.

---

## 4. `campaign` Table — JSONB Extension (No Migration)

**File:** `apps/backend/src/models/database/campaign.py`

**Relevant current columns:**
```python
discovery_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
```

No new columns are strictly required — all TikTok campaign configuration can be stored in `discovery_config` JSONB (extended schema) and new JSONB fields added to existing columns.

### Extended `discovery_config` Schema for TikTok

Current (Instagram):
```json
{
  "platform": "instagram",
  "seed_profiles": ["@seedhandle1", "@seedhandle2"]
}
```

Extended (TikTok):
```json
{
  "platform": "tiktok",
  "keywords": ["skincare", "beauty"],
  "hashtags": ["#skincareroutine", "#beautytips"],
  "seed_profiles": ["@seedtiktokhandle"],
  "follower_min": 10000,
  "follower_max": 1000000,
  "niche": "beauty",
  "region": "US",
  "auto_lookalike": true
}
```

### New Optional Campaign-Level TikTok Fields

These fields enable advanced TikTok tracking features. They can be added to a new dedicated JSONB column `tiktok_config` (preferred for separation) or appended to a catch-all JSONB. Recommendation: **new `tiktok_config` nullable JSONB column** for clarity.

```sql
-- Optional: dedicated TikTok configuration column
ALTER TABLE campaign
  ADD COLUMN tiktok_config JSONB DEFAULT NULL;
```

**`tiktok_config` schema:**
```json
{
  "campaign_hashtag": "#BrandXChallenge",
  "campaign_sound_id": "7234000000000000000",
  "hero_video_id": "7234567890123456789",
  "ad_account_id": "7000000000000000000",
  "shop_seller_id": "US123456789",
  "spark_ads_enabled": true
}
```

| Field | Purpose | Integration Touchpoint |
|-------|---------|----------------------|
| `campaign_hashtag` | Hashtag to monitor for UGC detection | `track_tiktok_hashtag_activity` |
| `campaign_sound_id` | Custom TikTok sound to track | `track_tiktok_sound_activity` |
| `hero_video_id` | Brand video ID for duet/stitch detection | `analyze_tiktok_post()` |
| `ad_account_id` | TikTok Ads account for Spark Ads | `SparkAdsWorkflow` |
| `shop_seller_id` | TikTok Shop seller ID for affiliate tracking | `TikTokShopOrderWorkflow` |
| `spark_ads_enabled` | Whether to attempt Spark Ads for this campaign | Thread flag processing |

**Why separate column vs extending `discovery_config`:** TikTok tracking config applies at runtime (during post tracking, Spark Ads, etc.), not just at discovery time. Mixing it into `discovery_config` conflates two concerns. A dedicated `tiktok_config` column is cleaner and allows RLS/API filtering separately.

---

## 5. New Table: `creator_social_auth`

**Purpose:** Store OAuth tokens for creators who have connected their TikTok account via TikTok Login Kit. Required for TikTok Display API enrichment and Spark Ads premium integrations.

**Dependency:** TikTok Login Kit OAuth flow must be implemented first.

### DDL

```sql
CREATE TABLE creator_social_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to authenticated creator
  creator_id UUID NOT NULL REFERENCES creator(id) ON DELETE CASCADE,

  -- Platform and auth
  platform TEXT NOT NULL,                       -- 'tiktok' (extensible)
  platform_user_id TEXT NOT NULL,              -- TikTok user_id (open_id)
  access_token TEXT NOT NULL,                  -- short-lived (24h for TikTok)
  refresh_token TEXT NOT NULL,                 -- long-lived (365d for TikTok)

  -- Token metadata
  token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],  -- granted scopes

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,                           -- 'user_revoked' | 'expired' | 'error'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (creator_id, platform),               -- one token set per creator per platform
  UNIQUE (platform, platform_user_id)          -- one creator per TikTok account
);

-- For periodic token refresh lookups
CREATE INDEX idx_creator_social_auth_expires
  ON creator_social_auth (token_expires_at)
  WHERE is_active = true;

-- For platform-specific queries
CREATE INDEX idx_creator_social_auth_platform
  ON creator_social_auth (platform, is_active);
```

### SQLAlchemy Model

```python
class CreatorSocialAuth(Base):
    """OAuth tokens for creators who connect social accounts."""

    __tablename__ = "creator_social_auth"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, ...)
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("creator.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(Text, nullable=False)         # "tiktok"
    platform_user_id: Mapped[str] = mapped_column(Text, nullable=False) # TikTok open_id
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    refresh_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(Text), ...)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoke_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("creator_id", "platform", name="unique_creator_social_auth"),
        UniqueConstraint("platform", "platform_user_id", name="unique_platform_user"),
    )
```

### TikTok-Specific Token Details

| Field | TikTok Value | Notes |
|-------|-------------|-------|
| `access_token` TTL | 24 hours | Must be refreshed frequently |
| `refresh_token` TTL | 365 days | Creator must re-auth annually |
| `platform_user_id` | TikTok `open_id` (per-app) | NOT the same as user_id (global) — open_id is app-specific |
| `scopes` | e.g. `["user.info.basic", "video.list"]` | Granted at time of OAuth |

**Security consideration:** Access tokens must be stored encrypted at rest. In Supabase: use `pgcrypto` extension or store via Supabase Vault. The existing architecture stores `gmail_credentials` (encrypted) — same pattern applies here.

### New API Endpoints Needed

```
POST /auth/tiktok              → Initiate TikTok Login Kit OAuth
GET  /auth/tiktok/callback     → Handle OAuth callback, store tokens
DELETE /auth/tiktok/{id}       → Revoke token + deactivate
GET  /creators/{id}/auth       → List connected social auths for a creator
```

---

## 6. New Table: `tiktok_shop_order`

**Purpose:** Track TikTok Shop affiliate orders attributed to campaign creators. Parallel to the existing Shopify/GoAffPro order pattern.

**Dependency:** TikTok Shop seller account + webhook endpoint implementation.

### DDL

```sql
CREATE TABLE tiktok_shop_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution
  campaign_id UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  campaign_creator_id UUID REFERENCES campaign_creator(id) ON DELETE SET NULL,

  -- TikTok Shop identifiers
  tiktok_order_id TEXT NOT NULL UNIQUE,        -- TikTok Shop order ID
  affiliate_link TEXT,                          -- creator's affiliate product link
  sku_id TEXT,                                  -- product SKU
  product_name TEXT,

  -- Order details
  order_status TEXT NOT NULL,                  -- TikTok Shop status enum
  buyer_uid TEXT,                              -- TikTok buyer user ID (anonymized)
  currency TEXT NOT NULL DEFAULT 'USD',
  item_price NUMERIC(10, 2),
  quantity INTEGER,
  total_amount NUMERIC(10, 2),
  commission_amount NUMERIC(10, 2),            -- affiliate commission

  -- Fulfillment
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Webhook metadata
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB,                           -- raw TikTok Shop webhook payload

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tiktok_shop_order_campaign ON tiktok_shop_order (campaign_id);
CREATE INDEX idx_tiktok_shop_order_creator ON tiktok_shop_order (campaign_creator_id);
CREATE INDEX idx_tiktok_shop_order_status ON tiktok_shop_order (order_status);
```

### TikTok Shop Order Status Values

From TikTok Shop Open API webhook events:
| Status | Meaning |
|--------|---------|
| `UNPAID` | Order placed, not yet paid |
| `ON_HOLD` | Payment held (fraud review) |
| `AWAITING_SHIPMENT` | Paid, pending shipment |
| `AWAITING_COLLECTION` | Ready for carrier pickup |
| `IN_TRANSIT` | Shipped |
| `DELIVERED` | Delivered to buyer |
| `COMPLETED` | Order finalized, commission released |
| `CANCELLED` | Order cancelled |
| `PARTIALLY_RETURNED` | Partial return |
| `RETURNED` | Fully returned |

### Attribution Chain

```
tiktok_shop_order.affiliate_link
  → look up campaign_creator where tiktok_affiliate_link = affiliate_link
  → set campaign_creator_id FK
  → trigger Slack digest notification (parallel to existing shopify_order_id pattern)
```

---

## 7. Optional Extension: `creator_enrichment_attempt` — Platform Tracking

**File:** `apps/backend/src/models/database/creator_enrichment_attempt.py`

Current enrichment attempts table likely tracks enrichment attempts per creator. No schema change needed — the existing `source` or `method` fields can be extended with new values:

New `source` values for TikTok enrichment:
- `"apify_tiktok_profile_scraper"` — nba1rst/tiktok-profile-scraper
- `"tiktok_display_api"` — official Display API enrichment
- `"bio_link_crawl_tiktok"` — bio-link crawl for TikTok creator
- `"modash_tiktok"` — Modash TikTok profile lookup
- `"hypeauditor_tiktok"` — HypeAuditor TikTok profile lookup

---

## Migration Priority & Ordering

### Phase 1: Additive (No breaking changes, ship in one deploy)

**Migrations:**
1. `creator_post` Phase 1 migration — add `platform`, `platform_post_id`, `platform_metrics` columns; backfill; add new unique constraint (keep old column)
2. `campaign` — add `tiktok_config JSONB` column (nullable, safe to add)

**Code changes (same deploy or shortly after):**
- `save_creator_from_tiktok()` in creator_service.py
- TikTok enrichment branch in enrichment_service.py
- New `apify_tiktok_posts.py` fetch service
- Platform-aware `creator_post` model + repository (dual-mode: reads from either column)

**Zero breaking changes** — existing Instagram functionality unchanged.

### Phase 2: Expanded Capability (1-2 weeks later)

**Migrations:**
3. `creator_post` Phase 2 — drop `instagram_post_id` column and old constraint
4. `campaign_creator` — add `tiktok_affiliate_link TEXT` (optional)

**Code changes:**
- `post_tracking_activity.py` platform dispatch
- Extended `PostType` and `MatchMethod` enums
- `analyzer.py` platform-aware prompts
- API response model: `platform_post_id` + `platform` fields (coordinate with frontend)
- TikTok discovery activity branch

**Note:** Phase 2 migration drop of `instagram_post_id` requires confirming no production code or frontend still reads that column.

### Phase 3: Deep Integrations (4-6 weeks later)

**New tables:**
5. `creator_social_auth` — TikTok Login Kit OAuth tokens
6. `tiktok_shop_order` — TikTok Shop affiliate order tracking (only if TikTok Shop feature is built)

**Code changes:**
- TikTok OAuth flow (Login Kit)
- `TikTokApiClient` using creator access tokens
- Display API enrichment branch
- TikTok Shop webhook handler
- `SparkAdsWorkflow` (requires Marketing API access + ad account setup)

---

## Consolidated Migration Summary

| # | Migration | Table | Type | Phase | Risk |
|---|-----------|-------|------|-------|------|
| 1 | Add `platform`, `platform_post_id`, `platform_metrics` cols | `creator_post` | ADD COLUMN | 1 | Low |
| 2 | Backfill `platform_post_id` from `instagram_post_id` | `creator_post` | UPDATE | 1 | Low |
| 3 | Add new unique constraint on `(campaign_creator_id, platform_post_id)` | `creator_post` | ADD CONSTRAINT | 1 | Low |
| 4 | Add `tiktok_config JSONB` | `campaign` | ADD COLUMN | 1 | Low |
| 5 | Drop `instagram_post_id` column + old constraint | `creator_post` | DROP COLUMN | 2 | **Medium** |
| 6 | Add `tiktok_affiliate_link TEXT` | `campaign_creator` | ADD COLUMN | 2 | Low |
| 7 | Create `creator_social_auth` table | New table | CREATE TABLE | 3 | Low |
| 8 | Create `tiktok_shop_order` table | New table | CREATE TABLE | 3 | Low |

---

## Backward Compatibility Considerations

### `creator_post` API Response: `instagram_post_id` → `platform_post_id`

The field `instagram_post_id` appears in `CreatorPostResponse` (API model). Frontend consumers depend on this field. The transition strategy:

**Option A — Field rename with deprecation period:**
```python
class CreatorPostResponse(BaseModel):
    platform_post_id: str               # NEW canonical name
    instagram_post_id: str | None       # DEPRECATED — alias for platform=='instagram', null for tiktok
    platform: str                       # NEW field
```

This allows frontend to migrate gradually. Remove `instagram_post_id` from response in a later release.

**Option B — Clean break (preferred if frontend can be updated atomically):**
```python
class CreatorPostResponse(BaseModel):
    platform_post_id: str               # replaces instagram_post_id
    platform: str                       # new field
```

Given the monorepo structure (frontend + backend co-deployed), Option B is feasible if both are updated in the same PR.

### `post_type` Enum Extension

Adding new values (`"video"`, `"photo"`, `"live"`, `"duet"`, `"stitch"`) to `PostType` is **non-breaking** — existing rows have values `"post"`, `"story"`, `"reel"` which remain valid. No CHECK constraint exists on this column (it's a Python-level Literal, not a DB CHECK), so new values can be inserted without migration.

### `discovery_config` JSONB Extension

Adding new keys to the `discovery_config` JSON is backward compatible — existing campaigns without `platform` key default to Instagram behavior.

---

## Schema Visualization: After All Migrations

```
creator (unchanged)
  ├── platform: TEXT ['instagram', 'youtube', 'tiktok']
  ├── profile_data: JSONB  {tiktok-specific fields for tiktok creators}
  └── UNIQUE (platform, handle)

creator_post (migrated)
  ├── platform: TEXT ['instagram', 'tiktok']           NEW
  ├── platform_post_id: TEXT                            RENAMED
  ├── platform_metrics: JSONB {share_count, ...}       NEW
  ├── post_type: TEXT [extended with tiktok types]     EXTENDED
  └── UNIQUE (campaign_creator_id, platform_post_id)   UPDATED

creator_social_auth (new)                              NEW TABLE
  ├── creator_id → creator.id
  ├── platform: TEXT
  ├── access_token, refresh_token
  └── UNIQUE (creator_id, platform)

campaign (extended)
  ├── discovery_config: JSONB {platform: 'tiktok', keywords, hashtags, ...}
  └── tiktok_config: JSONB {campaign_hashtag, hero_video_id, ...}   NEW

campaign_creator (minor extension)
  ├── social_media_handles: JSONB [{platform: 'tiktok', handle: '...'}]  ← already works
  └── tiktok_affiliate_link: TEXT   (optional, Phase 2)                  NEW

tiktok_shop_order (new)                                NEW TABLE
  ├── campaign_id → campaign.id
  ├── campaign_creator_id → campaign_creator.id
  └── tiktok_order_id: TEXT UNIQUE
```

---

## Estimated Effort

| Phase | Migrations | Code Changes | Effort |
|-------|-----------|--------------|--------|
| Phase 1 (core TikTok support) | 4 SQL statements | ~8 files | 1 week |
| Phase 2 (cleanup + full content tracking) | 2 SQL statements | ~6 files | 0.5 week |
| Phase 3 (OAuth + Shop) | 2 new tables | ~10 new files + routes | 2-3 weeks |
| **Total** | **8 migrations** | **~24 files** | **~4-5 weeks** |
