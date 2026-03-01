# UGC Attribution and Campaign/Creator Linking — Analysis

**Aspect**: `current-campaign-ugc-link`
**Wave**: 2 — Internal Landscape
**Date**: 2026-03-01
**Input files**:
- `../cheerful-reverse/analysis/synthesis/spec-data-model.md` — complete ER diagram, `campaign`, `campaign_creator`, `creator`, `creator_post` schemas
- `analysis/current-post-tracking.md` — existing post tracking architecture, schema constraints
- `analysis/current-ig-dm-overlap.md` — Messaging API webhook shared infrastructure, `user_ig_dm_account` spec

---

## Summary

Zero-signup UGC auto-capture faces a fundamental attribution challenge: content arrives keyed by Instagram handle (and sometimes `sender_ig_id`), but Cheerful's data model is organized around campaigns and campaign_creator rows. Mapping inbound UGC to the right campaign and creator requires a multi-step attribution algorithm that doesn't exist today.

Additionally, "brand" in Cheerful's schema is currently just a user — there is no explicit brand entity above campaigns. UGC capture requires a brand-level Instagram credential configuration (brand's Instagram Business Account) that must be added as a new table.

**Key findings**:
1. The existing data model is entirely campaign-scoped with no brand-level abstraction
2. Attribution requires a lookup across `campaign_creator.social_media_handles` for every incoming UGC event
3. A creator can appear in multiple campaigns simultaneously, creating a 1:N attribution ambiguity
4. The global `creator` table is the right anchor for brand-level (non-campaign) UGC
5. A new `ugc_brand_ig_account` table is required to store the brand's Instagram Business Account credentials
6. The optimal schema is a separate `ugc_content` table with optional campaign FK (nullable), not a modification of `creator_post`

---

## 1. Current Data Model: The Campaign-Creator Graph

### ER path for post attribution today

```
auth.users (brand owner)
  └── campaign (1:N)
        └── campaign_creator (1:N) -- the creator in this campaign
              └── creator_post (1:N) -- posts matched to this creator/campaign
```

Every `creator_post` row requires:
- `campaign_id UUID NOT NULL` — which campaign
- `campaign_creator_id UUID NOT NULL` — which creator within the campaign

### The unique deduplication key

```sql
CONSTRAINT unique_post_per_creator UNIQUE (campaign_creator_id, instagram_post_id)
```

This allows the same Instagram post to be stored **N times** (once per campaign the creator is in), which is intentional — the same post can satisfy multiple campaigns. This is a strong hint about how attribution should work for UGC: same UGC post can be linked to multiple campaigns.

### Where Instagram handles live

Creator Instagram handles are stored in `campaign_creator.social_media_handles` as JSONB:

```json
[{"platform": "instagram", "handle": "johndoe"}]
```

There is **no dedicated column** — it's a JSONB array with no index. Searching for a specific handle requires:
```sql
EXISTS (
  SELECT 1 FROM jsonb_array_elements(social_media_handles) h
  WHERE h->>'platform' = 'instagram'
  AND lower(h->>'handle') = lower('johndoe')
)
```

This is a scan-heavy query, not indexed. At scale, this becomes a bottleneck for real-time attribution during webhook delivery.

### The global creator registry

The `creator` table is a **global, non-user-scoped** registry:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `platform` | text | `instagram`, `youtube`, etc. |
| `handle` | text | NOT NULL |
| `follower_count` | integer | |
| `profile_data` | jsonb | Platform-specific data blob |

**Unique**: `(platform, handle)` — one row per platform per creator.

This table is the right anchor for brand-level UGC (content that mentions the brand but is not linked to any specific campaign). If UGC arrives from a creator not in any campaign, the creator can still be looked up or created in this global table.

---

## 2. The Attribution Problem

### What UGC capture knows at ingest time

When a UGC event arrives (via webhook or polling), the known data varies by capture method:

| Capture Method | Known at Ingest | Unknown at Ingest |
|---------------|-----------------|-------------------|
| `webhook_mention` (Graph API) | `media_id`, `sender_ig_user_id` | Creator's handle (requires API lookup) |
| `story_mention` (Messaging API) | `sender_igsid`, CDN media URL | Creator's handle (resolve via IGSID cache or API) |
| `api_mention` poll (`mentioned_media`) | Full post object incl. `username` | Only what API returns |
| `api_tag` poll (`/tags`) | Full post object incl. `username` | Only what API returns |
| `hashtag` poll | `owner.id`, post content | Creator's handle (requires API lookup by IG user ID) |
| `ai_radar` | Post/media (content of inferred content pool) | Origin creator, confidence variable |

The common input for attribution is **Instagram handle (string)** or **Instagram user ID (string)**. Both can be used to search `campaign_creator.social_media_handles`.

### Attribution algorithm (proposed)

```
INPUT: creator_ig_handle (str), brand_user_id (uuid), instagram_post_id (str)

Step 1: Normalize handle
  → strip @, lowercase

Step 2: Find matching campaign_creator rows
  → SELECT cc.id, cc.campaign_id, c.status, cc.post_tracking_ends_at
     FROM campaign_creator cc
     JOIN campaign c ON c.id = cc.campaign_id
     WHERE c.user_id = brand_user_id
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(cc.social_media_handles) h
         WHERE h->>'platform' = 'instagram'
         AND lower(h->>'handle') = lower(creator_ig_handle)
       )
     ORDER BY cc.created_at DESC

Step 3: Classify result
  → CASE
    WHEN matches = 0 → brand_level (no campaign link; store with campaign_id=NULL)
    WHEN matches = 1 → single attribution (set campaign_id, campaign_creator_id)
    WHEN matches > 1 → multi-attribution (create one ugc_content row per matching campaign)

Step 4: Look up global creator registry
  → SELECT id FROM creator WHERE platform='instagram' AND handle=creator_ig_handle
  → If not found: optionally create a stub creator row

Step 5: Write ugc_content row(s)
  → Insert with (brand_ig_user_id, instagram_post_id, campaign_id, campaign_creator_id)
  → UNIQUE constraint: (brand_ig_user_id, instagram_post_id, COALESCE(campaign_id, '00000000-...'))
    → Allows same post to appear in multiple campaigns while deduplicating at brand level
```

### Multi-campaign attribution: the N:M reality

A single Instagram post mentioning a brand can legitimately satisfy multiple concurrent campaigns:
- Creator is in a Gifting campaign for Product A AND a Paid Promotion campaign for Product B
- Creator posts content that mentions both products
- The post should surface in BOTH campaigns

This is already reflected in the current `creator_post` UNIQUE key design: `(campaign_creator_id, instagram_post_id)` — the same `instagram_post_id` can appear N times across different `campaign_creator_id` rows.

For UGC auto-capture, the same logic applies: when attribution matches multiple campaigns, create one `ugc_content` row per matched campaign. This avoids a complex multi-campaign display problem in the UI.

---

## 3. Brand Identity: The Missing Abstraction

### Current state: brand = user

In Cheerful's current schema, there is no explicit `brand` entity. The brand is identified by `user_id`. All campaigns belong to a user; all products belong to a user. The closest thing to "brand" is a user account with a product.

### What UGC capture requires: brand Instagram credentials

For zero-signup UGC to work, the brand must:
1. Connect their Instagram Business Account to Cheerful
2. Grant Cheerful the required permissions (`instagram_manage_insights`, `instagram_read_engagement`, `pages_read_engagement`)
3. Associate the IG Business Account with their Cheerful account (and transitively, all their campaigns)

This requires a new table. The IG DM spec is adding `user_ig_dm_account` for the IG DM integration. UGC capture can reuse this same table — or add to it. The table stores the brand's IG Business Account credentials (access token, IG user ID, Page ID) and is the anchor for all brand-level UGC operations.

### Proposed new tables

```sql
-- Brand's Instagram Business Account credential
-- This table is being designed by the IG DM spec (user_ig_dm_account).
-- UGC capture extends it with UGC-specific configuration.
-- If IG DM spec adds this table first, UGC can add columns to it.
-- If no IG DM spec: UGC creates it.

CREATE TABLE user_ig_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Instagram Business Account identity
    ig_user_id TEXT NOT NULL,          -- Instagram user ID of the brand's IG account
    ig_username TEXT NOT NULL,         -- e.g. "brandname"
    page_id TEXT NOT NULL,             -- Facebook Page ID (required for Messaging API)
    access_token TEXT NOT NULL,        -- Long-lived page access token (encrypted)
    token_expires_at TIMESTAMPTZ,      -- For token refresh scheduling

    -- Webhook subscription state
    webhook_subscribed BOOLEAN NOT NULL DEFAULT false,
    mentions_subscribed BOOLEAN NOT NULL DEFAULT false,   -- Graph API mentions field
    messaging_subscribed BOOLEAN NOT NULL DEFAULT false,  -- Messaging API (for story_mention)

    -- UGC capture config
    ugc_capture_enabled BOOLEAN NOT NULL DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_ig_account_per_user UNIQUE (user_id, ig_user_id)
);
```

```sql
-- Hashtag monitoring configuration per brand
-- Enforces the 30-unique-hashtag / 7-day rolling window limit

CREATE TABLE ugc_hashtag_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_account_id UUID NOT NULL REFERENCES user_ig_account(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,
    ig_hashtag_id TEXT,                   -- Cached hashtag ID from ig_hashtag_search
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Track when this hashtag slot was last used (for 7-day window enforcement)
    last_queried_at TIMESTAMPTZ,
    first_queried_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_hashtag_per_account UNIQUE (user_ig_account_id, hashtag)
);
```

```sql
-- The UGC content store (separate from creator_post which is campaign-scoped)

CREATE TABLE ugc_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Brand anchor (always present)
    user_ig_account_id UUID NOT NULL REFERENCES user_ig_account(id) ON DELETE CASCADE,

    -- Campaign attribution (optional — NULL = brand-level UGC with no campaign match)
    campaign_id UUID REFERENCES campaign(id) ON DELETE SET NULL,
    campaign_creator_id UUID REFERENCES campaign_creator(id) ON DELETE SET NULL,

    -- Creator info (from webhook payload or Graph API lookup)
    creator_ig_user_id TEXT,             -- IG numeric user ID
    creator_ig_handle TEXT,              -- @handle (normalized, no @)
    creator_id UUID REFERENCES creator(id) ON DELETE SET NULL, -- global creator registry FK

    -- Post data
    instagram_post_id TEXT NOT NULL,     -- Stable IG post ID for deduplication
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'reel', 'story', 'carousel')),
    post_url TEXT,
    caption TEXT,

    -- Media (permanently re-hosted in Supabase Storage)
    media_urls JSONB DEFAULT '[]'::jsonb,
    media_storage_path TEXT,             -- Supabase Storage key after download
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
        'webhook_mention',   -- Graph API webhook mentions field
        'story_mention',     -- Messaging API story_mention event
        'api_mention_poll',  -- Polling GET /{id}/mentioned_media
        'api_tag_poll',      -- Polling GET /{id}/tags
        'hashtag_poll',      -- Hashtag API monitoring
        'ai_radar'           -- AI-detected untagged brand appearance
    )),
    match_method TEXT CHECK (match_method IN (
        'api_signal',        -- API explicitly surfaced it (tagged/mentioned)
        'caption_keyword',   -- Keyword match in caption text
        'llm_vision',        -- LLM vision analysis matched
        'llm_audio',         -- STT + NER matched brand mention in audio
        'ocr',               -- OCR found brand name in image text
        'ai_visual'          -- Computer vision logo/product detection
    )),
    match_confidence FLOAT,              -- 0.0–1.0 (1.0 for API signals, variable for AI)
    raw_webhook_payload JSONB,           -- Raw event for debugging/replay

    -- Deduplication
    -- Multiple campaigns can see same post → UNIQUE per (account, post, campaign)
    -- brand-level UGC (no campaign): UNIQUE per (account, post)
    -- Use COALESCE to handle NULL campaign_id in unique constraint:
    CONSTRAINT unique_ugc_per_account_campaign UNIQUE (
        user_ig_account_id,
        instagram_post_id,
        campaign_id  -- PostgreSQL: NULLs are NOT considered equal in UNIQUE constraints
                     -- This means two rows with campaign_id=NULL will NOT conflict.
                     -- FIX: Add partial unique index below.
    )
);

-- Deduplicate brand-level (no campaign) UGC:
CREATE UNIQUE INDEX ugc_content_brand_level_dedup
    ON ugc_content (user_ig_account_id, instagram_post_id)
    WHERE campaign_id IS NULL;
```

**Note on the UNIQUE constraint and NULL**: PostgreSQL UNIQUE constraints treat NULLs as distinct (two NULLs are not equal). The partial index `WHERE campaign_id IS NULL` is required to prevent duplicate brand-level UGC rows for the same post.

---

## 4. Attribution Model: Brand-Level vs Campaign-Level

### Two-tier UGC structure

```
Brand-Level UGC: ugc_content rows where campaign_id IS NULL
  → Creator mentioned the brand but is not in any active campaign
  → Appears in a "Brand UGC" view (not campaign-specific)
  → May prompt operator to add creator to a campaign

Campaign-Level UGC: ugc_content rows where campaign_id IS NOT NULL
  → Creator is an active campaign participant
  → Appears in campaign post tracking view
  → May replace or supplement current creator_post entries
```

### Routing decision tree

```
Incoming UGC: @handle mentions @brand
│
├─ Does this @handle appear in campaign_creator.social_media_handles
│  for any active campaign owned by this brand?
│  │
│  ├─ NO → Brand-level UGC
│  │        ugc_content(campaign_id=NULL, campaign_creator_id=NULL)
│  │        Visible in "Mentions" or "UGC Library" view
│  │
│  └─ YES (1 campaign) → Campaign-level UGC
│           ugc_content(campaign_id=X, campaign_creator_id=Y)
│           Visible in campaign post tracking
│
│     YES (N campaigns) → Multi-attribution: N rows
│           One ugc_content row per matching campaign
│           Same instagram_post_id in each row
```

### Handle normalization: critical for matching

`campaign_creator.social_media_handles` stores handles as user-entered text. Handle lookups must normalize:

```python
def normalize_handle(handle: str) -> str:
    """Normalize Instagram handle for matching."""
    return handle.lstrip('@').lower().strip()
```

Common mismatches to guard against:
- `@brandname` vs `brandname` (@ prefix)
- `BrandName` vs `brandname` (case)
- `brand.name` vs `brandname` (periods — Instagram allows them)
- Trailing spaces from copy-paste

### Index requirement for handle lookup

The current JSONB `social_media_handles` has no index. At scale (thousands of campaign_creator rows per brand), the attribution query becomes a full scan. Options:

```sql
-- Option A: GIN index on JSONB (works for contains queries)
CREATE INDEX idx_cc_social_handles_gin ON campaign_creator USING GIN (social_media_handles);

-- Query with GIN index:
WHERE social_media_handles @> '[{"platform": "instagram", "handle": "johndoe"}]'::jsonb
-- Problem: case-sensitive; can't do lower() on JSONB with GIN index

-- Option B: Materialized column (denormalize to dedicated column)
ALTER TABLE campaign_creator ADD COLUMN instagram_handle TEXT GENERATED ALWAYS AS (
    lower((social_media_handles -> 0 ->> 'handle'))  -- naive: only first handle
) STORED;
CREATE INDEX idx_cc_instagram_handle ON campaign_creator (instagram_handle);

-- Option C: Separate table for handles
CREATE TABLE creator_social_handle (
    campaign_creator_id UUID NOT NULL REFERENCES campaign_creator(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    normalized_handle TEXT NOT NULL GENERATED ALWAYS AS (lower(trim(handle))) STORED,
    PRIMARY KEY (campaign_creator_id, platform, handle)
);
CREATE INDEX idx_csh_normalized ON creator_social_handle (platform, normalized_handle);
```

**Verdict**: Option C (separate table) is most correct for attribution at scale. Option A works for small deployments. Option B has the flaw of only indexing the first handle when a creator may have multiple.

---

## 5. Attribution Edge Cases

### Edge case 1: Creator changes Instagram handle

If a creator changes their IG handle:
- Webhook events from Meta include the **IG user ID** (numeric, stable)
- The new handle is different from what's in `campaign_creator.social_media_handles`
- Attribution by handle fails; attribution by IG user ID succeeds IF the IGSID is stored

**Mitigation**: Store `creator_ig_user_id` (the numeric IG user ID) on `campaign_creator` in addition to the string handle. Graph API responses include both. IGSID-based lookup is more robust than handle-based.

### Edge case 2: Same creator in multiple brands

The global `creator` table is shared across all Cheerful users. A creator in Brand A's campaign and Brand B's campaign is the same global `creator` row. UGC attribution is always brand-scoped (filtered by `user_ig_account_id`), so there's no cross-brand leakage.

### Edge case 3: Creator not yet in campaign but discovered via UGC

A creator @mentions the brand without being in any campaign. UGC is captured as brand-level (no campaign link). The brand operator reviews it and wants to add the creator to a campaign. This is a new workflow: "promote UGC creator to campaign."

This requires:
1. Create `creator` row in global registry (if not exists)
2. Create `campaign_creator` row (manually or via lookalike suggestion flow)
3. Retroactively link existing brand-level `ugc_content` rows to the new campaign

**Retroactive linking query**:
```sql
UPDATE ugc_content
SET campaign_id = :campaign_id,
    campaign_creator_id = :campaign_creator_id
WHERE user_ig_account_id = :brand_account_id
  AND creator_ig_handle = :handle
  AND campaign_id IS NULL;
```

### Edge case 4: Brand with multiple Instagram accounts

Some brands operate multiple IG accounts (e.g., `@brand`, `@brand_uk`, `@brand_official`). The `user_ig_account` table supports this via `UNIQUE (user_id, ig_user_id)` — one user can have N IG accounts. Attribution always filters by `user_ig_account_id`.

### Edge case 5: Story UGC — post_id uniqueness

Instagram Stories have unique IDs, but they expire in 24 hours. The CDN URL also expires. However, the Story ID itself (from the `story_mention` webhook payload) is stable for deduplication. Story `instagram_post_id` should use the `media_id` from the webhook payload.

After 24h, the CDN URL in `media_urls` becomes invalid. Cheerful must download the Story media **immediately** on webhook delivery (within minutes, not hours). If media download fails, the text-only record can still be kept for attribution.

---

## 6. Compatibility with Existing Data Model

### The IG DM overlap: shared `user_ig_dm_account` table

The IG DM spec is designing a `user_ig_dm_account` table (to store the brand's IG Business Account connection). From `current-ig-dm-overlap.md`, this table includes:
- `ig_user_id`, `page_id`, `access_token`, `ig_username`
- Webhook subscription state

This is functionally identical to the `user_ig_account` table proposed above. **UGC capture should reuse the IG DM spec's table rather than creating a duplicate.**

The recommended approach:
1. The IG DM spec creates `user_ig_dm_account` (or a shared `user_ig_account`)
2. UGC capture adds UGC-specific columns to the same table via migration:
   ```sql
   ALTER TABLE user_ig_dm_account
     ADD COLUMN ugc_capture_enabled BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN mentions_webhook_subscribed BOOLEAN NOT NULL DEFAULT false;
   ```

### `creator_post` vs `ugc_content`: the table fork

The `current-post-tracking.md` analysis concludes that a **separate `ugc_content` table** is architecturally cleaner than extending `creator_post`. This is reinforced by the attribution analysis:

| Requirement | `creator_post` | `ugc_content` |
|-------------|----------------|---------------|
| campaign_creator_id nullable | Requires breaking migration | Native (column is nullable) |
| Brand-level rows (no campaign) | Impossible without NULL FK | Native |
| Multi-campaign same post | UNIQUE constraint prevents duplicates per campaign_creator_id | UNIQUE designed for it |
| capture_source enum | Would mix with existing `'caption'`/`'llm'` values | Clean enum from start |
| creator global registry FK | Not present | `creator_id` FK built in |
| Raw webhook payload storage | Not present | `raw_webhook_payload JSONB` |
| Deduplication key | `(campaign_creator_id, instagram_post_id)` — campaign-scoped | `(user_ig_account_id, instagram_post_id, campaign_id)` — brand-scoped |

**Conclusion**: Create `ugc_content` as a new table. Do not modify `creator_post`. The two tables coexist — `creator_post` for opt-in campaign tracking, `ugc_content` for zero-signup UGC capture.

### Temporal workflow compatibility

The existing `PostTrackingWorkflow` pattern maps cleanly to UGC attribution:

| Existing Component | UGC Attribution Equivalent |
|--------------------|---------------------------|
| `get_trackable_creators_activity` | `get_active_brand_accounts_activity` — query `user_ig_dm_account` for UGC-enabled brands |
| `process_creator_posts_activity` | `process_brand_ugc_activity` — poll mentioned_media, run attribution |
| `CreatorPostRepository.upsert()` | `UGCContentRepository.upsert()` — same pattern, different table |
| `unique_post_per_creator` UNIQUE | `ugc_content_brand_level_dedup` partial index + compound UNIQUE |

Webhook-driven UGC (story_mention, webhook_mention) uses a different pattern: the FastAPI webhook handler runs attribution synchronously on webhook delivery, then dispatches a Temporal activity for async media download + AI analysis.

---

## 7. API Layer Implications

### New endpoints needed for UGC content

```
GET  /ugc                                 -- All UGC across all campaigns (brand library)
GET  /ugc?campaign_id={id}               -- Campaign-specific UGC
GET  /ugc?campaign_creator_id={id}       -- Creator-specific UGC
GET  /ugc?capture_source={source}        -- Filter by capture method
GET  /campaigns/{id}/ugc                 -- Campaign UGC view (replaces creator_post for zero-signup content)
DELETE /ugc/{ugc_id}                     -- Mark as false positive
PATCH /ugc/{ugc_id}/promote              -- Promote brand-level UGC to campaign
```

### Existing `creator_post` endpoints

The existing `/posts` and `/campaigns/{id}/creators/{id}/posts` endpoints continue to serve `creator_post` (opt-in campaign posts only). UGC content is served from separate endpoints. The frontend "Post Library" view eventually merges both, but they start as separate API surfaces.

---

## 8. Rights Management Consideration

Competitors like Archive, Pixlee/Emplifi, and TINT include a **rights management** workflow:
- Brand requests permission to use UGC commercially (DM to creator)
- Creator approves/denies
- UGC is tagged as "rights granted" or "rights pending"

The current Cheerful schema has no rights management. For UGC auto-capture, rights management is out of scope for the initial implementation — captured UGC is internal tracking (brand monitoring), not necessarily public display. If Cheerful later adds a "use this UGC in campaign" feature, rights management becomes necessary.

**Minimum viable rights field** (future-proofing):
```sql
ALTER TABLE ugc_content
  ADD COLUMN rights_status TEXT DEFAULT 'not_requested'
    CHECK (rights_status IN ('not_requested', 'requested', 'granted', 'denied'));
```

---

## Key Findings

1. **No brand entity exists** — Cheerful's schema has no explicit `brand` table. The brand is the user (or team). UGC capture requires a `user_ig_account` (or extension of IG DM spec's `user_ig_dm_account`) as the brand credential anchor.

2. **Attribution algorithm is clear but requires JSONB query** — Matching incoming IG handles against `campaign_creator.social_media_handles` is the core attribution step. This requires either a GIN index or a dedicated `creator_social_handle` table for scale.

3. **Multi-campaign attribution is the norm, not the edge case** — Active creators often appear in multiple concurrent campaigns. The attribution model must create one `ugc_content` row per matched campaign, consistent with the existing `creator_post` UNIQUE key design.

4. **Separate `ugc_content` table is required** — Extending `creator_post` is architecturally impossible without breaking migrations (NOT NULL FKs, UNIQUE constraints, semantic coupling). `ugc_content` starts fresh with the right design for brand-level + campaign-level UGC.

5. **IG DM table is the shared credential anchor** — The `user_ig_dm_account` table being designed by the IG DM spec is the correct home for brand Instagram credentials. UGC capture adds 2–3 columns to this table, not a new table.

6. **Handle normalization is a correctness risk** — Mismatched case or @ prefix in stored handles vs incoming webhook handles will cause attribution failures. Normalization at write time (when handles are stored) and read time (during lookup) is required.

7. **Creator IG user ID is more robust than handle** — Handles can change; IG user IDs are stable. The attribution pipeline should prefer IG user ID lookup and fall back to handle lookup. Storing `creator_ig_user_id` on `campaign_creator` as a new indexed column would significantly improve attribution robustness.

8. **Brand-level UGC is a new UI surface** — Currently, all post tracking is within a campaign context. Brand-level UGC (no campaign attribution) requires a new "UGC Library" or "Mentions" view in the frontend.
