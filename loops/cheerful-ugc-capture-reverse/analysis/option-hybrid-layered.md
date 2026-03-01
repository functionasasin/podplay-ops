# Option: Hybrid Layered — Progressive UGC Coverage in Three Independent Layers

**Aspect**: `option-hybrid-layered`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-03-01
**Inputs**:
- `analysis/graph-api-mentions-tags.md` — Graph API `/tags` + `mentioned_media` endpoints
- `analysis/webhooks-mentions.md` — Graph API `mentions` webhook, delivery guarantees
- `analysis/hashtag-monitoring.md` — Hashtag API, 30-hashtag constraint, polling architecture
- `analysis/story-mention-capture.md` — Messaging API `mention` event, CDN expiry, TOS
- `analysis/ai-visual-detection.md` — Logo/product YOLO, CLIP, OCR, frame sampling, build-vs-buy
- `analysis/ai-audio-detection.md` — Whisper STT, brand mention NER/fuzzy/LLM, source separation
- `analysis/ai-candidate-discovery.md` — Business Discovery API, historical tag graph, Apify
- `analysis/unofficial-scraping.md` — Apify actors for UGC, TOS risk, existing Cheerful usage
- `analysis/third-party-ugc-platforms.md` — Archive, Pixlee/Emplifi, TINT, Bazaarvoice surveys
- `analysis/current-post-tracking.md` — Existing `creator_post`, `PostTrackingWorkflow`, reusable components
- `analysis/current-ig-dm-overlap.md` — Shared IG DM webhook infrastructure, shared component inventory
- `analysis/current-media-storage.md` — `post-media` Supabase Storage bucket, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema
- `analysis/option-official-api-capture.md` — Layer 1 full design (coverage 60–75%)
- `analysis/option-ai-radar.md` — Layer 3 full design (untagged detection)
- `analysis/option-third-party-service.md` — Buy-not-build analysis (additive Archive integration)

---

## 1. Option Summary

**The Hybrid Layered option** is a progressive architecture that builds UGC capture in three independently deployable layers, each adding incremental coverage and cost. It is not a single monolithic build — it is a deliberate sequencing of the other three options into a structured deployment roadmap.

| Layer | Mechanism | Coverage Added | Cost | Effort |
|-------|-----------|---------------|------|--------|
| **Layer 1** | Official API: Story mentions + feed @mentions + photo-tag polling | 60–75% of public UGC | Free API + $10–200/mo storage | ~4–6 eng-weeks (with DM infra) |
| **Layer 2** | Hashtag monitoring: branded + category hashtags | +5–25% additional | Free API + storage | ~1–2 eng-weeks incremental |
| **Layer 3** | AI Radar: visual, audio, and candidate pool discovery | +10–20% additional | $50–500/mo compute | +8–16 eng-weeks incremental |

**Cumulative coverage** (all three layers active):
- Layer 1 only: ~60–75% of capturable public brand UGC
- Layer 1 + 2: ~70–85%
- Layer 1 + 2 + 3: ~80–95%

**Key properties**:
- **Independently deployable**: Each layer can ship without the next layer existing. Layer 1 delivers value on day one.
- **Additive, not replacing**: Each layer supplements — not replaces — lower layers. Content captured by Layer 1 is not re-analyzed by Layer 3 (deduplication prevents double-counting).
- **Cost grows with coverage**: Layer 1 is effectively free. Layer 2 is marginal cost. Layer 3 introduces meaningful compute cost but is opt-in per brand.
- **IG DM integration maximally leveraged**: Layer 1 Story capture is nearly free on the IG DM webhook infrastructure already being built.

This is the most practical architecture for Cheerful because it matches the product reality: most brands need 60–75% coverage immediately (Layer 1), some need hashtag-specific discovery (Layer 2), and only sophisticated brands with large creator networks need full AI Radar (Layer 3). These are also progressive revenue opportunities — each layer could be a product tier.

---

## 2. Why Layered is the Right Architecture

### 2.1 The Coverage-Cost Trade-off is Non-Linear

Each layer's incremental coverage is real but decreasing, while incremental cost is increasing:

```
Layer 1: 60–75% coverage, ~$0 API cost, 4–6 weeks build
Layer 2: +5–25% coverage, ~$0 API cost, 1–2 weeks build
Layer 3: +10–20% coverage, $50–500/month, 8–16 weeks build
```

Layer 1 provides extraordinary ROI: highest coverage at lowest cost. Layer 2 is cheap and fills a unique gap (branded-hashtag content). Layer 3 provides diminishing returns in coverage but has genuine value for brands with large, organic creator communities.

### 2.2 Each Layer Has Independent Business Value

| Layer | Distinct Business Value | Who Needs It |
|-------|------------------------|-------------|
| Layer 1 | Zero-signup UGC from brand's direct network; Story capture before expiry | All brands |
| Layer 2 | Content from creators who use campaign hashtags but forget to tag | Brands with active campaigns using hashtags |
| Layer 3 | "Dark UGC" — brand appearances nobody knows about | Brands with large organic communities; analytics-heavy customers |

A brand can derive immediate value from Layer 1 without needing Layer 3. Offering these as discrete product tiers (Basic → Pro → Enterprise AI Radar) naturally segments by willingness to pay.

### 2.3 Matches Cheerful's IG DM Development Sequence

Cheerful is already building the IG DM integration. Layer 1 Story capture rides directly on that infrastructure. This is not just about code reuse — it's about **sequencing the roadmap against existing work**:

```
IG DM Integration builds → POST /webhooks/instagram/, user_ig_dm_account,
                           ig_igsid_cache, resolve_igsid_activity,
                           download_and_store_media, App Review (instagram_manage_messages)

Layer 1 Story Capture adds → 1 subscription field, 1 routing branch,
                              StoryMentionWorkflow, mentioned_media API call
                              (4–7 days of incremental engineering)

Layer 1 Feed Capture adds → FeedMentionWorkflow, UGCTagPollingWorkflow,
                             instagram_manage_comments App Review
                             (additional 3–5 engineer-weeks)
```

The IG DM integration is the prerequisite. Everything else is additive.

### 2.4 Risk Isolation

Each layer has distinct risk profiles. Layering means a risk that affects one layer doesn't affect others:

| Layer | Primary Risk | Impact if Layer Fails |
|-------|-------------|----------------------|
| Layer 1 | `mentions` webhook silent drop; Story 24h deadline | Specific capture method degraded; photo-tag polling still works |
| Layer 2 | `instagram_public_content_access` App Review rejected; 30-hashtag cap | No hashtag content; Layer 1 still fully operational |
| Layer 3 | Candidate discovery coverage ceiling; AI compute cost; Business Discovery personal account gap | AI radar degrades; official API captures unaffected |

---

## 3. Layer 1: Official API Capture — Foundation

Layer 1 is the output of `option-official-api-capture.md`, packaged as a standalone deployable unit. It is the correct first layer and the foundation everything else builds on.

### 3.1 What Layer 1 Captures

| Content Type | Mechanism | Latency |
|-------------|-----------|---------|
| Feed post caption @mention | `mentions` webhook → `mentioned_media` | 1–60 seconds |
| Feed post comment @mention | `mentions` webhook → `mentioned_comment` | 1–60 seconds |
| Photo-tagged feed post (image/video/carousel) | `/tags` polling | 5–15 minutes |
| Story @mention (photo/video Story) | Messaging API `mention` event | 1–60 seconds |

**What Layer 1 does NOT capture**:
- Branded hashtag posts without @mention/photo-tag (Layer 2 handles)
- Reels with photo-tag in video (API gap — no workaround in official API)
- Stories without @mention (Layer 3 AI radar has partial coverage)
- Untagged brand appearances (Layer 3)
- Private account content (no API method)

### 3.2 Layer 1 IG DM Infrastructure Overlap

This is the critical architectural insight from `current-ig-dm-overlap.md`:

```
FULLY SHARED (zero cost for Layer 1 Story capture):
├── POST /webhooks/instagram/ endpoint
├── HMAC-SHA256 verification code
├── user_ig_dm_account table (brand credentials, FB Page, access token)
├── ig_igsid_cache table (IGSID → username resolution)
├── resolve_igsid_activity (creator identity resolution)
├── post-media Supabase Storage bucket
├── download_and_store_media service
├── FB Page OAuth flow
└── instagram_manage_messages App Review (covers both DMs and Story `mention` field)

INCREMENTAL for Story capture:
├── Add "mention" to subscribed_fields (1 line of code)
├── elif "mention" routing branch in webhook handler (~10 lines)
├── StoryMentionWorkflow (new Temporal workflow, ~100 lines)
├── fetch_story_mentioned_media_activity (new, ~40 lines)
└── download_ig_story_media_activity (new, ~40 lines; mirrors DM download activity)

INCREMENTAL for feed capture (independent of DM infra):
├── changes[] routing branch for Graph API events (~10 lines)
├── FeedMentionWorkflow + activities (~150 lines)
├── UGCTagPollingWorkflow + activities (~150 lines)
├── ugc_content table migration (~60 lines SQL)
└── instagram_manage_comments App Review (separate from DM review)
```

### 3.3 Layer 1 Phased Sub-Deployment

Layer 1 can itself be deployed in phases:

| Sub-phase | Features | Effort | Notes |
|-----------|----------|--------|-------|
| **1A: Story @mentions** | Messaging API `mention` event → media download → `ugc_content` | 4–7 days | Requires DM infra; cheapest highest-value addition |
| **1B: Feed @mentions** | Graph API `mentions` webhook → `mentioned_media` → `ugc_content` | 3–5 days | New App Review (`instagram_manage_comments`) |
| **1C: Photo-tag polling** | `/tags` polling → `ugc_content` | 3–5 days | New `UGCTagPollingWorkflow` cron; same App Review as 1B |

1A should be bundled with the IG DM integration launch — it is 1 line + 10 lines + ~4–7 days of workflow code. 1B and 1C can follow as a single sprint (~2 weeks) once App Review is approved.

### 3.4 Layer 1 Database Schema

```sql
-- Core UGC table (shared across all layers)
CREATE TABLE ugc_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Brand anchor (links to IG DM account for credentials)
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,

    -- Campaign attribution (optional; NULL = brand-level UGC)
    campaign_id UUID REFERENCES campaign(id) ON DELETE SET NULL,
    campaign_creator_id UUID REFERENCES campaign_creator(id) ON DELETE SET NULL,

    -- Creator identity (from webhook payload or API response)
    creator_ig_user_id TEXT,    -- Stable numeric IG user ID
    creator_ig_handle TEXT,     -- Normalized @handle (no @, lowercase)
    creator_igsid TEXT,         -- IGSID (Messaging API events only)
    creator_id UUID REFERENCES creator(id) ON DELETE SET NULL,

    -- Post identity
    instagram_post_id TEXT NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('post', 'reel', 'story', 'carousel')),
    post_url TEXT,
    caption TEXT,

    -- Media (permanently stored in Supabase Storage)
    media_urls JSONB DEFAULT '[]'::jsonb,         -- Original CDN URLs (may expire)
    media_storage_paths JSONB DEFAULT '[]'::jsonb, -- Permanent Supabase Storage paths
    thumbnail_url TEXT,

    -- Engagement snapshot at capture time
    like_count INTEGER DEFAULT 0,
    view_count INTEGER,
    comment_count INTEGER DEFAULT 0,

    -- Timestamps
    posted_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Capture provenance (all layers write to same table, differentiated by capture_source)
    capture_source TEXT NOT NULL CHECK (capture_source IN (
        'story_mention',     -- Layer 1A: Messaging API mention event
        'webhook_mention',   -- Layer 1B: Graph API mentions webhook (feed @mention)
        'api_tag_poll',      -- Layer 1C: Polling GET /{id}/tags
        'hashtag_poll',      -- Layer 2: Hashtag API monitoring
        'ai_radar'           -- Layer 3: AI-detected untagged content
    )),
    match_confidence FLOAT DEFAULT 1.0,  -- 1.0 for API signals; 0.0–1.0 for AI
    raw_webhook_payload JSONB,

    -- Rights management (future-proofing)
    rights_status TEXT DEFAULT 'not_requested',
    deleted_at TIMESTAMPTZ

    -- Deduplication: one brand-level row per (brand, post)
    -- Multiple campaigns: multiple rows (campaign_id NOT NULL dedup index)
);

-- Brand-level dedup: only one row per (brand_account, post) when no campaign match
CREATE UNIQUE INDEX ugc_content_brand_dedup
    ON ugc_content (user_ig_dm_account_id, instagram_post_id)
    WHERE campaign_id IS NULL;

-- Campaign-level dedup: one row per (brand_account, post, campaign)
CREATE UNIQUE INDEX ugc_content_campaign_dedup
    ON ugc_content (user_ig_dm_account_id, instagram_post_id, campaign_id)
    WHERE campaign_id IS NOT NULL;
```

### 3.5 Layer 1 Coverage Estimate

| Content Category | Est. % of Brand UGC | Layer 1 Coverage |
|-----------------|---------------------|-----------------|
| Feed posts with @mention (public accounts) | 40–50% | ✅ Fully covered (webhook + `mentioned_media`) |
| Feed posts with photo-tag (public accounts) | 15–20% | ✅ Fully covered (polling) |
| Stories with @mention (public accounts) | 10–15% | ✅ Fully covered |
| Stories with @mention (private accounts brand follows) | 3–5% | ✅ Covered |
| Reels with @mention | 5–10% | ⚠️ Uncertain API behavior |
| Reels with photo-tag | 5–10% | ❌ Not covered (Layer 3 may partially cover) |
| Untagged appearances | 15–25% | ❌ Not covered (Layer 3) |

**Layer 1 total**: ~60–75% of capturable public brand UGC.

### 3.6 Layer 1 Cost

| Component | Cost |
|-----------|------|
| Meta Graph API calls | Free (rate limited, not paid) |
| Meta Messaging API | Free |
| Supabase Storage | $0.021/GB overage; ~$10–200/month at 100 brands |
| Compute (existing Fly.io backend) | $0 incremental at typical volume |
| App Review | One-time process; no recurring cost |

**Layer 1 ongoing cost**: ~$10–200/month at 100 brands. API calls are free.

---

## 4. Layer 2: Hashtag Monitoring — Supplementary Coverage

Layer 2 adds content from creators who use branded hashtags without @mentioning or photo-tagging the brand. It is the output of `hashtag-monitoring.md` packaged as a deployable increment on top of Layer 1.

### 4.1 What Layer 2 Captures

| Content Type | What Layer 2 Adds Beyond Layer 1 |
|-------------|----------------------------------|
| Feed photos with branded hashtag (no @mention or photo-tag) | **Unique to Layer 2** — Layer 1 cannot see this |
| Feed image carousels with branded hashtag | **Unique to Layer 2** |
| Category hashtag content (brand's niche) | **Unique to Layer 2** — expands creator discovery |
| Feed videos with branded hashtag | Partial (`thumbnail_url`; full video URL requires additional call) |

**What Layer 2 still does NOT capture**:
- Reels with hashtags (API explicitly excludes Reels from hashtag results — significant gap)
- Stories with hashtags (not indexed)
- Untagged content (no hashtag used)

### 4.2 Layer 2 Architecture

Layer 2 is a **cron-polling workflow** — no new webhook infrastructure. It is completely separate from Layer 1's webhook path.

```
HashtagMonitoringSchedulerWorkflow (Temporal cron)
  ↓ every 2–4 hours per brand
HashtagMonitoringWorkflow
  ↓ for each configured hashtag in ugc_hashtag_config
  GET /ig_hashtag_search?hashtag={name} → hashtag_id (cached permanently)
  GET /{hashtag_id}/recent_media?fields=id,caption,media_type,media_url,...
    → up to 25 posts per hashtag per poll
  ↓ deduplicate against ugc_content (ON CONFLICT DO NOTHING)
  ↓ download new media → Supabase Storage
  ↓ upsert ugc_content row (capture_source='hashtag_poll')
  ↓ attribute_ugc_to_campaign_activity (shared with Layer 1)
```

### 4.3 Layer 2 Infrastructure Overlap

| Component | Layer 1 / DM Infra | Layer 2 Status |
|-----------|-------------------|---------------|
| Webhook endpoint | From Layer 1 / DM | ❌ Not used — polling only |
| Temporal cluster | From Layer 1 | ✅ Shared |
| user_ig_dm_account (brand token) | From Layer 1 / DM | ✅ Shared (same brand token for hashtag calls) |
| ugc_content table | From Layer 1 | ✅ Shared |
| attribution algorithm | From Layer 1 | ✅ Shared |
| media download service | From Layer 1 / DM | ✅ Shared |
| ugc_hashtag_config table | New | Net-new |
| HashtagMonitoringWorkflow | New | Net-new |
| instagram_public_content_access App Review | New | Net-new (separate review process) |

**Key difference from Layer 1**: Layer 2 requires `instagram_public_content_access` — a separately gated feature with its own App Review submission (5–14 business days). This is the primary timeline risk for Layer 2 and should be submitted early.

### 4.4 Layer 2 Database Schema

```sql
-- Hashtag configuration (per brand, per IG account)
CREATE TABLE ugc_hashtag_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,              -- Without # prefix
    ig_hashtag_id TEXT,                 -- Cached from ig_hashtag_search (stable; cache forever)
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER DEFAULT 0,         -- Higher = higher priority during slot management
    first_queried_at TIMESTAMPTZ,       -- Start of 7-day rolling window for this slot
    last_queried_at TIMESTAMPTZ,
    last_poll_cursor TEXT,              -- Pagination cursor from last recent_media call
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_hashtag_per_account UNIQUE (user_ig_dm_account_id, hashtag)
);
```

The `ugc_content` table is already created by Layer 1 — Layer 2 writes to it with `capture_source='hashtag_poll'`.

### 4.5 The 30-Hashtag Budget Constraint

Each brand Instagram account gets 30 unique hashtag slots per rolling 7-day window. Strategic allocation:

| Hashtag Category | Slots | Purpose |
|-----------------|-------|---------|
| Primary brand hashtag | 1–2 | `#brandname`, `#brandnamegifts` |
| Campaign-specific | 1–3 per campaign | Rotate as campaigns launch/conclude |
| Product/collection | 2–8 | `#brandname_skincare` |
| Category/niche | 5–15 | `#gifting`, `#skincare`, `#fashion` (candidate discovery for Layer 3) |
| **Total** | **≤30** | **Hard ceiling** |

Multi-campaign brands exhaust the budget quickly. Slot lifecycle management (tracking 7-day window per slot, rotating campaign hashtags) requires brand-facing UI.

### 4.6 Layer 2 Coverage Estimate

| Content Category | % of Brand UGC | Layer 2 Coverage |
|-----------------|----------------|-----------------|
| Branded hashtag only (no @mention, no tag) | 5–15% | ✅ Covered within 30-slot budget |
| Category hashtag posts (brand niche) | 10–20% | ✅ Covered (indirect; enables AI radar candidate pool expansion) |
| Reels with hashtags | Significant % | ❌ API gap |

**Layer 2 additive coverage**: +5–25% beyond Layer 1, depending on brand's hashtag culture. Highly variable — brands with strong community hashtag adoption get maximum value; brands where creators @mention rather than hashtag get minimum incremental value.

**Layer 2 cumulative coverage (1+2)**: ~70–85% of capturable public brand UGC.

### 4.7 Layer 2 Cost

| Component | Cost |
|-----------|------|
| Hashtag API calls | Free (within 200/hr rate limit per brand; hashtag monitoring uses ~30 calls/hr) |
| Supabase Storage | Incremental (same per-GB cost as Layer 1) |
| Compute | Temporal worker CPU for cron workflows; negligible additional at low-medium volume |
| `instagram_public_content_access` App Review | One-time; no recurring cost |

**Layer 2 incremental ongoing cost**: ~$0 API + marginal storage increase. The App Review process is the primary cost in time, not money.

---

## 5. Layer 3: AI Radar — Optional Untagged Detection

Layer 3 is the output of `option-ai-radar.md`, packaged as an opt-in enhancement for brands that want to discover "dark UGC" — content featuring their brand with no formal tag or mention. It is the most complex and expensive layer and should be positioned as an optional enterprise add-on, not a baseline feature.

### 5.1 What Layer 3 Captures

Layer 3 detects brand appearances in content where no API signal (tag, @mention, hashtag) was ever generated:

| Detection Method | What It Finds | Accuracy |
|-----------------|---------------|---------|
| Visual logo detection (YOLO) | Brand logo visible in image/video frames | 75–85% mAP |
| Product recognition (CLIP embeddings) | Brand products identifiable via visual similarity | 65–75% top-1 |
| OCR (PaddleOCR/EasyOCR) | Brand name visible as text in image/video | 70–80% for scene text |
| Audio STT (Whisper + fuzzy NER) | Brand name spoken in video audio | 70–85% recall |

These four techniques are complementary — a brand logo without any spoken mention is caught by visual; a verbal mention with no logo on screen is caught by audio. Combined, they detect ~80–88% of visually/audibly identifiable brand appearances in candidate content.

**Critical caveat**: Layer 3 only analyzes content that enters the candidate pool. You cannot scan all of Instagram. The coverage ceiling is determined by how well the candidate discovery strategies populate the monitoring pool.

### 5.2 Layer 3 Architecture

Layer 3 has three components that operate together:

```
Component 3A: Candidate Pool Management
  UGCCandidateDiscoveryWorkflow (cron)
  → Fetch recent media from known creators via Business Discovery API
  → Add new creators to watchlist (from tag history, hashtags, creator DBs)
  → Queue new candidate posts for AI analysis
  ugc_creator_monitoring table
  ugc_ai_analysis_queue table

Component 3B: AI Analysis Pipeline
  UGCVisualInferenceWorkflow (triggered per queued item)
  → Frame extraction (ffmpeg, 2 FPS for Reels)
  → Visual: logo detection (YOLO/Cloud Vision) + OCR + CLIP product similarity
  UGCAudioInferenceWorkflow (parallel to visual)
  → Audio extraction (ffmpeg → 16kHz WAV)
  → STT (Whisper API or self-hosted Distil-Whisper)
  → Brand mention extraction (keyword → fuzzy → Claude Haiku LLM pass)

Component 3C: Deduplication and Routing
  → Content already captured by Layer 1 or 2: skip (ON CONFLICT DO NOTHING)
  → High-confidence detection: auto-capture to ugc_content (capture_source='ai_radar')
  → Low-confidence: queue for human review
```

### 5.3 Layer 3 IG DM Infrastructure Overlap

| Component | Status for Layer 3 |
|-----------|-------------------|
| user_ig_dm_account (brand token) | ✅ Shared — same token for Business Discovery API |
| ugc_content table | ✅ Shared — Layer 3 writes with `capture_source='ai_radar'` |
| attribution algorithm | ✅ Shared — same `attribute_ugc_to_campaign_activity` |
| media download service | ✅ Shared — download to same `post-media` bucket |
| Temporal cluster | ✅ Shared |
| Webhook endpoint | ❌ Not used — separate polling path |
| App Review | ❌ Not needed — Business Discovery is existing permission |

Layer 3 uses the same brand credentials established by the IG DM integration and Layer 1, but it does not use the webhook infrastructure. It operates as an independent polling-and-analysis system.

### 5.4 Layer 3 New Database Tables

```sql
-- Creator watchlist for AI candidate pool
CREATE TABLE ugc_creator_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    ig_username TEXT NOT NULL,
    ig_user_id TEXT,               -- Populated after first Business Discovery call
    is_business_account BOOLEAN,   -- false → personal account; requires Apify for monitoring
    last_post_id TEXT,             -- Most recent IG media ID seen (delta tracking)
    last_checked_at TIMESTAMPTZ,
    check_priority INTEGER DEFAULT 2, -- 1=high, 2=medium, 3=low
    is_active BOOLEAN DEFAULT TRUE,
    added_via TEXT NOT NULL, -- 'campaign', 'tag_history', 'hashtag', 'creator_db', 'manual'
    post_count_analyzed INTEGER DEFAULT 0,
    untagged_detection_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_ig_dm_account_id, ig_username)
);

-- AI analysis queue: media items awaiting processing
CREATE TABLE ugc_ai_analysis_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_media_id TEXT NOT NULL,
    creator_ig_username TEXT NOT NULL,
    media_type TEXT NOT NULL,         -- IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url TEXT,                   -- CDN URL (may expire; download promptly)
    stored_media_path TEXT,           -- Supabase Storage path after download
    caption TEXT,                     -- For text pre-filter (cheap early screen)
    posted_at TIMESTAMPTZ,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    analysis_status TEXT DEFAULT 'pending', -- pending, processing, complete, error
    analysis_result JSONB,            -- Detection results
    UNIQUE(user_ig_dm_account_id, ig_media_id)
);
```

### 5.5 Layer 3 Build-vs-Buy Decision Points

Each AI component has a spectrum from simple API to full self-hosted stack:

| Component | MVP (fast, cheap) | Scale (cheaper/better) |
|-----------|------------------|-----------------------|
| Visual logo detection | Google Cloud Vision API ($1.50/1K images) | Self-hosted YOLO v8 per brand (~$0.001/image) |
| Product recognition | Google Cloud Vision (limited to known brands) | CLIP ViT-L/14 + Qdrant vector search |
| OCR | Google Cloud Vision OCR ($1.50/1K) | Self-hosted EasyOCR or PaddleOCR |
| Audio STT | GPT-4o Mini Transcribe API ($0.003/min) | Self-hosted Distil-Whisper (~$0.0017/min) |
| Brand NER | Keyword + fuzzy (rapidfuzz) | + Claude Haiku pass for homonym brands |
| Candidate discovery | Business Discovery API (known creators only) | + Apify for personal account creators |

**For Layer 3 MVP**: Google Cloud Vision + GPT-4o Mini Transcribe + keyword/fuzzy matching. All API-based, no GPU infrastructure. Total cost: ~$0.01–0.02 per analyzed post (visual + audio).

**For Layer 3 at scale**: Self-hosted Distil-Whisper + CLIP + PaddleOCR on shared Fly.io GPU machine. Total cost: ~$0.001–0.003 per analyzed post. Break-even vs Cloud Vision path at ~50K–100K posts/month.

### 5.6 Layer 3 Cost Model

| Volume | Cloud Vision + Whisper API | Self-hosted Whisper + YOLO + CLIP |
|--------|---------------------------|-----------------------------------|
| 1,000 posts/month | ~$10–20 | ~$1–3 (GPU amortized) |
| 10,000 posts/month | ~$100–200 | ~$10–30 |
| 100,000 posts/month | ~$1,000–2,000 | ~$100–300 |
| 1,000,000 posts/month | ~$10,000–20,000 | ~$1,000–3,000 |

**Note**: These costs are per brand. At 100 brands each generating 1,000 candidates/month, total Layer 3 cost is $1,000–2,000/month (API path) or $100–300/month (self-hosted path).

### 5.7 Layer 3 Coverage Estimate

The candidate discovery problem determines Layer 3's real coverage:

| Candidate Strategy | Creators Monitorable | Untagged UGC Coverage Unlocked |
|-------------------|---------------------|-------------------------------|
| Known campaign creators only | 50–500/brand | ~15–30% of potential untagged |
| + Historical tag graph | + all prior taggers (self-populating) | +10–15% |
| + Hashtag-discovered creators (Layer 2 feeds) | + hundreds new creators | +10–20% |
| + Third-party creator DB (Modash, $299/mo) | + thousands in niche | +5–10% |
| + Apify personal-account monitoring | + any public account | +10–20% (personal account gap) |

**Layer 3 total additive coverage**: +10–20% beyond Layers 1+2, achieving ~80–95% cumulative.

**Layer 3 cumulative coverage (1+2+3)**: ~80–95% of all capturable public brand UGC.

---

## 6. Cross-Layer Architecture: How They Fit Together

### 6.1 Single Shared Data Store

All three layers write to the same `ugc_content` table using `capture_source` to distinguish origin. This enables unified views across all capture methods:

```sql
-- Combined UGC library for a brand (all sources)
SELECT *
FROM ugc_content
WHERE user_ig_dm_account_id = $brand_account_id
  AND deleted_at IS NULL
ORDER BY posted_at DESC;

-- Filter by capture source
WHERE capture_source = 'story_mention'           -- Layer 1A
WHERE capture_source IN ('webhook_mention', 'api_tag_poll')  -- Layer 1B+C
WHERE capture_source = 'hashtag_poll'            -- Layer 2
WHERE capture_source = 'ai_radar'               -- Layer 3
WHERE capture_source != 'ai_radar'              -- Official API only (Layers 1+2)
```

### 6.2 Deduplication Across Layers

A creator might tag the brand (captured by Layer 1) AND use the campaign hashtag (would also be captured by Layer 2) AND appear in a candidate pool (Layer 3 monitoring). The same Instagram post should appear once in `ugc_content`.

**Deduplication mechanism**: The `ugc_content` unique indexes prevent duplicate rows. When a post is captured by Layer 1 (webhook), later discovery by Layer 2 (hashtag poll) or Layer 3 (AI radar) hits `ON CONFLICT DO NOTHING` — the first capture wins, and the `capture_source` reflects the earliest detection method.

```sql
-- Layer 1 captures first:
INSERT INTO ugc_content (user_ig_dm_account_id, instagram_post_id, capture_source, ...)
VALUES ($1, $2, 'webhook_mention', ...)
ON CONFLICT (user_ig_dm_account_id, instagram_post_id) WHERE campaign_id IS NULL
DO NOTHING;  -- Layer 2 or 3 discovering the same post later is silently ignored

-- Optional: track all discovery methods (for analytics)
UPDATE ugc_content
SET capture_sources = capture_sources || ARRAY['hashtag_poll'::text]
WHERE user_ig_dm_account_id = $1 AND instagram_post_id = $2;
-- (if capture_sources is a TEXT[] column added for this purpose)
```

### 6.3 Layer Self-Reinforcement (Flywheel)

The layers create a data flywheel where each layer feeds the next:

```
Layer 1 captures tagged content
  ↓
Each captured creator is added to ugc_creator_monitoring (Layer 3 candidate pool)
  ↓
Layer 3 monitors those creators for future untagged posts
  ↓
Layer 2 hashtag discovery surfaces new creators not yet in Layer 1's known universe
  ↓
Those new creators are added to Layer 3 candidate pool
  ↓
Layer 3 detects untagged posts → adds more creators → pool grows
  ↓
After 6–12 months: candidate pool has thousands of brand-adjacent accounts
```

Over time, a brand's Layer 3 candidate pool self-populates from Layer 1 tag events and Layer 2 hashtag discovery. The pool requires no manual curation — it grows automatically.

### 6.4 Caption Pre-Filter (Reduces Layer 3 AI Cost)

Before invoking expensive visual/audio AI on a candidate post, apply cheap text pre-filters:

```python
def prefilter_candidate_post(caption: str, brand: BrandConfig) -> PrefilterAction:
    """Fast pre-screen before sending to AI pipeline."""
    if not caption:
        return PrefilterAction.RUN_FULL_AI

    caption_lower = caption.lower()

    # Creator already tagged the brand → Layer 1 will/has captured this
    if f"@{brand.ig_handle.lower()}" in caption_lower:
        return PrefilterAction.SKIP_ALREADY_CAPTURED

    # Brand name in caption but no @handle → still send to AI (may be a mention to capture)
    brand_terms = [brand.name.lower()] + [a.lower() for a in brand.aliases]
    if any(term in caption_lower for term in brand_terms):
        return PrefilterAction.RUN_FULL_AI_HIGH_PRIORITY

    # No brand signal in caption → run full AI (untagged candidate)
    return PrefilterAction.RUN_FULL_AI
```

This pre-filter:
1. Skips posts that Layer 1 has already captured (saves AI cost)
2. Flags text-mention posts for priority AI processing
3. Passes all others to full AI analysis

Estimated API cost savings: 20–40% reduction in Layer 3 AI calls.

---

## 7. Phased Deployment Strategy

The layers map naturally to a phased rollout:

### Phase 1: Layer 1A — Story Capture (Bundle with IG DM Launch)
**Timeline**: Concurrent with IG DM integration sprint
**Effort**: 4–7 days incremental
**Delivers**: Zero-signup Story @mention capture from day one of DM launch
**Dependencies**: IG DM integration complete; `ugc_content` table created

### Phase 2: Layer 1B+C — Feed Capture (Sprint 2)
**Timeline**: 2–3 weeks after Phase 1
**Effort**: ~3–4 engineer-weeks
**Delivers**: Feed @mentions + photo-tag polling; official API capture complete
**Dependencies**: `instagram_manage_comments` App Review approved (submit at IG DM launch)

### Phase 3: Layer 2 — Hashtag Monitoring (Sprint 3)
**Timeline**: 3–4 weeks after Phase 2 (gate: `instagram_public_content_access` review)
**Effort**: ~1–2 engineer-weeks
**Delivers**: Branded hashtag content discovery; brand hashtag config UI
**Dependencies**: `instagram_public_content_access` App Review (submit at Phase 1 launch; 5–14 day review)

### Phase 4: Layer 3 MVP — AI Radar (Optional, Sprint 4+)
**Timeline**: 4–6 weeks after Phase 3
**Effort**: ~4–6 engineer-weeks (Cloud Vision/Whisper API path; no GPU infra)
**Delivers**: Untagged brand detection for business/creator accounts in candidate pool
**Dependencies**: Layer 1+2 established; candidate pool seeded from tag history

### Phase 5: Layer 3 Full — Self-Hosted AI (Optional, Enterprise)
**Timeline**: 2–4 months after Phase 4
**Effort**: +4–6 engineer-weeks on top of Phase 4
**Delivers**: Lower per-image cost; custom YOLO fine-tuned per brand; GPU inference service
**Dependencies**: Layer 3 MVP validated; volume justifies infrastructure investment

```
Timeline:
  Week 0: IG DM integration launch
  Week 0: Phase 1 (Story capture) bundled ← 4-7 days
  Week 3: Phase 2 (Feed capture) ship ← App Review submitted at Week 0
  Week 6: Phase 3 (Hashtag) ship ← Separate App Review submitted at Week 0
  Week 10: Phase 4 (AI Radar MVP) ← Optional
  Month 4: Phase 5 (AI Radar full) ← Optional, enterprise tier
```

---

## 8. App Review Strategy

Three distinct App Review submissions are needed, each with independent timelines:

| Permission | For | When to Submit | Timeline |
|------------|-----|---------------|----------|
| `instagram_manage_messages` | Layer 1A (Story mentions) + IG DM integration | Before DM integration launch | 2–10 days (combined with DM review) |
| `instagram_manage_comments` | Layer 1B+C (feed @mentions, photo-tag polling) | At DM integration launch (Week 0) | 2–10 days |
| `instagram_public_content_access` | Layer 2 (hashtag monitoring) | At DM integration launch (Week 0) | 5–14 business days |

**Strategic submission**: Submit all three reviews simultaneously at the IG DM launch. This front-loads the App Review wait time so it runs in parallel with Phase 1 and 2 engineering work. By the time Phases 2 and 3 are built, the reviews are likely already approved.

**Layer 3 requires no new App Review**: Business Discovery API and existing permissions cover candidate pool monitoring. Apify scraping (if used for personal accounts) requires no Meta approval — it's handled by Cheerful's existing Apify integration.

---

## 9. Capability Matrix

### 9.1 Content Type Coverage Across Layers

| Content Type | Layer 1A | Layer 1B | Layer 1C | Layer 2 | Layer 3 |
|-------------|:--------:|:--------:|:--------:|:-------:|:-------:|
| Feed photo (@mention in caption) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Feed photo (photo-tagged) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Feed photo (branded hashtag only) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Feed photo (untagged, no hashtag) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Feed video (@mention) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Feed video (photo-tagged) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Carousel (@mention) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Carousel (photo-tagged) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Reel (@mention, uncertain) | ❌ | ⚠️ | ❌ | ❌ | ✅ |
| Reel (photo-tagged) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reel (branded hashtag) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reel (untagged, verbal mention) | ❌ | ❌ | ❌ | ❌ | ✅ (audio) |
| Story (@mention — public) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Story (@mention — private, brand follows) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Story (untagged, no @mention) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comment @mention | ❌ | ✅ | ❌ | ❌ | ❌ |
| Private account content | ❌ | ❌ | ❌ | ❌ | ⚠️ (Apify only) |

### 9.2 Cumulative Coverage Estimates

| Layers Active | Est. Coverage of Capturable Public Brand UGC |
|--------------|---------------------------------------------|
| None (current state) | ~0% zero-signup UGC |
| Layer 1 only | 60–75% |
| Layers 1+2 | 70–85% |
| Layers 1+2+3 | 80–95% |

---

## 10. Constraint Summary

### Layer 1 Constraints

| Constraint | Detail |
|-----------|--------|
| `mentions` webhook no polling fallback | Feed @mentions cannot be recovered if webhook misses them; no collection endpoint exists |
| Story 24h CDN expiry | Story media must be downloaded within 24h of creation; no retry after expiry |
| Meta TOS on Story media storage | Grey area; industry practice (Archive) is to download; see `story-mention-capture.md` |
| App Review gate | `instagram_manage_comments` required; 2–10 day timeline |
| Reels coverage uncertainty | `mentions` webhook may not fire for Reels @mentions; empirically test at integration |
| No polling fallback for @mentions | Webhook downtime = permanent content loss; requires high-availability webhook endpoint |

### Layer 2 Constraints

| Constraint | Detail |
|-----------|--------|
| 30-hashtag/7-day limit | Binding constraint; forces strategic slot allocation; rotation UI required |
| Reels excluded | Hashtag API does not return Reels — significant API gap |
| 24-hour lookback only | Must poll at minimum every 12–18 hours; recommend every 2–4 hours |
| ~25 posts per query max | High-volume hashtags may miss posts in the API truncation |
| `instagram_public_content_access` | Separate App Review; 5–14 business day timeline |
| No real-time push | Polling latency 2–4 hours vs Layer 1's near-real-time |

### Layer 3 Constraints

| Constraint | Detail |
|-----------|--------|
| Personal account coverage gap | Business Discovery API only covers Business/Creator accounts (~30–50% of creators) |
| Candidate pool ceiling | Can only monitor accounts already discovered; cold Instagram universe is not reachable |
| AI accuracy | 75–88% combined accuracy; requires human review queue for low-confidence detections |
| Background music degradation | Whisper STT WER jumps from 20% to 40–60% on music-heavy Reels; Spleeter pre-separation recommended |
| Per-brand training data (YOLO) | Custom logo detection requires 200–500 labeled images per brand for fine-tuning |
| GPU infrastructure | Self-hosted path requires GPU machine (Fly.io A10G/L40S); scale-to-zero to control cost |
| False positive rate | Logo/product detection generates false positives; confidence threshold tuning critical |
| Story 24h window | AI analysis of Story content must occur within 24h; only available from Layer 1A captures |

---

## 11. Effort Estimates (Combined)

### Baseline: IG DM integration already built

| Component | Layer | Effort |
|-----------|-------|--------|
| Add `mention` to page subscription | 1A | Tiny (1 line) |
| `mention` routing branch in webhook handler | 1A | Small (10 lines) |
| `StoryMentionWorkflow` + activities | 1A | Medium (4–7 days) |
| `ugc_content` table migration + indices | 1A | Small (1 day) |
| Attribution activity (shared across layers) | 1A | Medium (3–4 days) |
| `changes[]` routing branch for `mentions` | 1B | Small (10 lines) |
| `FeedMentionWorkflow` + activities | 1B | Small–Medium (3–5 days) |
| `UGCTagPollingWorkflow` + activities | 1C | Medium (3–5 days) |
| `ugc_tag_poll_cursor` table | 1C | Tiny (0.5 day) |
| `instagram_manage_comments` App Review | 1B+C | External (2–10 days) |
| `ugc_hashtag_config` table | 2 | Small (0.5 day) |
| `HashtagMonitoringWorkflow` + activities | 2 | Medium (3–4 days) |
| Brand hashtag config UI | 2 | Medium (3–4 days) |
| `instagram_public_content_access` App Review | 2 | External (5–14 days) |
| `ugc_creator_monitoring` + `ugc_ai_analysis_queue` tables | 3 | Small (1 day) |
| `UGCCandidateDiscoveryWorkflow` (Business Discovery polling) | 3 | Medium (3–5 days) |
| Caption pre-filter | 3 | Small (1–2 days) |
| Cloud Vision + Whisper API integration | 3 MVP | Small–Medium (3–5 days) |
| Brand mention NLP (keyword + fuzzy + Claude Haiku) | 3 MVP | Small (2–3 days) |
| CLIP product embedding + Qdrant | 3 full | Medium (5–7 days) |
| Self-hosted YOLO fine-tuning pipeline | 3 full | Large (2–4 weeks) |
| GPU inference service (Fly.io) | 3 full | Medium (3–5 days) |
| Human review queue UI | 3 full | Medium (3–5 days) |

**Layer 1 total effort (assuming DM infra exists)**: ~4–6 engineer-weeks
**Layer 2 total incremental effort**: ~1–2 engineer-weeks
**Layer 3 MVP incremental effort**: ~2–3 engineer-weeks
**Layer 3 full incremental effort**: +3–6 engineer-weeks beyond MVP

**Grand total (all three layers, DM infra exists)**: ~10–17 engineer-weeks

---

## 12. Cost Analysis (Combined)

| Layer | API Cost | Compute Cost | Storage | Total/Month at 100 Brands |
|-------|----------|-------------|---------|--------------------------|
| Layer 1 | $0 (free API) | $0 incremental | ~$10–200 | **$10–200** |
| Layer 2 (additive) | $0 (free API) | Negligible | +marginal | **~$0 incremental** |
| Layer 3 MVP (additive, Cloud Vision + Whisper API) | ~$10–200/mo per brand (volume dependent) | $0 (no GPU) | +marginal | **~$100–1,000 at 10 brands running Layer 3** |
| Layer 3 full (additive, self-hosted) | ~$0 (self-hosted) | ~$100–300/mo (GPU) | +marginal | **~$100–300 shared across all brands** |

**Key insight**: Layers 1+2 together are essentially free to operate (only storage costs). Layer 3 is the only layer that introduces meaningful ongoing compute cost, and it can be offered as a paid add-on tier to offset those costs.

### Cost vs. Third-Party Alternative

| Approach | Build Cost | Ongoing Cost (100 brands) | Coverage |
|----------|------------|--------------------------|---------|
| Layers 1+2 (native) | ~5–8 eng-weeks | ~$10–200/month | 70–85% |
| Layers 1+2+3 full (native) | ~10–17 eng-weeks | ~$300–1,500/month | 80–95% |
| Archive Pro (per brand) | ~2–3 eng-weeks integration | ~$30,800/month (100 brands × $308) | ~100% (claimed) |
| Archive additive integration | ~2–3 eng-weeks integration | Negligible (brands pay Archive) | Additive |

**The economics strongly favor native build at any multi-brand scale**. Archive Pro costs $30,800/month for 100 brands; the full native stack (all three layers) costs ~$1,500/month maximum. The build cost is front-loaded but amortizes within ~2–3 months of saving on Archive subscriptions.

---

## 13. Risk Register

| Risk | Probability | Impact | Layer | Mitigation |
|------|-------------|--------|-------|------------|
| `mentions` webhook silent drops in production | Medium | Medium | 1B | Monitor webhook delivery rate; alert on gaps; /tags polling partially compensates for photo-tags |
| Story CDN expires before download | Low | High (per Story) | 1A | Write stub row immediately on webhook receipt; Temporal retry with 20h deadline |
| `instagram_manage_comments` App Review rejected | Low | Medium | 1B+C | Combined with DM review; prepare screencast; correct intent framing |
| `instagram_public_content_access` rejected | Medium | Low | 2 | Layer 2 is additive; losing it doesn't break Layer 1 |
| Reels @mentions not fired by `mentions` webhook | Medium | Medium | 1B | Document as known gap; Layer 3 partially covers Reels via AI radar |
| Hashtag 30-slot exhausted at launch | High (for active campaign brands) | Medium | 2 | Enforce slot budget in UI; campaign hashtag rotation documented |
| Layer 3 candidate pool too small for meaningful coverage | Medium | Medium | 3 | Auto-populate from tag history; growth flywheel; set correct expectations |
| AI false positives overwhelming review queue | High (at low threshold) | Low | 3 | Tune confidence thresholds conservatively; human review UI with batch actions |
| Business Discovery Business/Creator account gap | High (structural) | Medium | 3 | Accept gap for personal accounts; Apify supplement for high-value creators |
| GPU cost overrun (Layer 3 full) | Medium | Medium | 3 | Scale-to-zero GPU; batch processing; consider API path for lower volume |
| Meta policy change (rate limit reduction, deprecated endpoint) | Low–Medium | Medium | All | Webhook-first design minimizes polling; Layer independence means losing one doesn't lose all |
| Archive terminates additive integration | Low | Low | N/A | Additive only; native capture continues |
| Story media storage TOS violation | Low | Medium | 1A | Monitor Meta policy; defensible as documented `mentioned_media` usage; follow industry practice |

---

## 14. Compatibility with Existing Cheerful Architecture

### 14.1 Temporal Workflows

All new workflows follow established Cheerful patterns from `PostTrackingSchedulerWorkflow`:
- `continue_as_new` prevents unbounded history growth in perpetual schedulers
- `@report_workflow_errors` decorator for Rollbar integration (existing)
- Activity-level `start_to_close_timeout` and retry configuration
- Sequential per-item processing with priority batching

### 14.2 Supabase RLS

`ugc_content` follows the same RLS patterns as `creator_post`:
- Service-role writes from backend/Temporal
- Row-level filtering by `user_ig_dm_account_id → user_id` for brand data isolation
- Public read access on `post-media` bucket (same policy as `creator_post` media)

### 14.3 FastAPI Routes

New API routes for UGC library follow existing patterns:
- Same JWT auth middleware (Supabase)
- Same SQLAlchemy Core repository pattern
- Same Pydantic request/response models
- New routes: `GET /ugc`, `GET /ugc?campaign_id=`, `DELETE /ugc/{id}`

### 14.4 Claude API Integration

Layer 3's LLM-based brand mention extraction uses the existing `anthropic` client already in Cheerful's stack. Claude Haiku calls per transcript add ~$0.0003/call — trivial and already a familiar pattern (`analyze_image_with_llm` in `services/post_tracking/analyzer.py`).

---

## 15. Why the Layered Approach is Most Practical

### 15.1 Avoid Big-Bang Shipping Risk

Building all three layers as a single monolithic feature creates:
- Long delivery timelines (17+ weeks before any value)
- App Review bottlenecks (all reviews blocked until all features are built)
- Risk of feature scope creep and missed details

The layered approach ships Layer 1A (Story capture) within the first sprint. By the time the team is working on Layer 3, real production data from Layers 1 and 2 is available to calibrate AI thresholds and candidate pool effectiveness.

### 15.2 Match Capability to Customer Need

Not all Cheerful brands need the same UGC capability:
- A brand running its first influencer campaign needs Layer 1 — zero-signup Story and feed capture is transformative vs. manual tracking
- A brand with 50+ active campaigns needs Layer 2 — campaign hashtag monitoring is directly connected to campaign briefs
- A brand with an organic community of 10,000+ creators needs Layer 3 — dark UGC discovery is the differentiator

Building all three upfront and giving it all to all brands is over-engineering. Layering allows tiered product packaging.

### 15.3 IG DM Timing Creates a Natural Anchor

The IG DM integration is already being built. Layer 1A piggybacks on it so naturally (1 line + 4–7 days of workflow code) that NOT shipping it alongside the DM integration is wasted opportunity. The layered architecture makes this "bundle with DM integration" decision obvious and bounded.

### 15.4 Each Layer is Independently Pauseable

If Layer 3 compute costs are too high, it can be paused or disabled per brand without affecting Layer 1 or 2. If `instagram_public_content_access` App Review is rejected, Layer 2 is not built — but Layers 1 and 3 are unaffected. Risk isolation at every boundary is the core property of the layered design.

### 15.5 The Candidate Pool Self-Populates Over Time

Layer 1 continuously grows Layer 3's candidate pool by adding every discovered creator to `ugc_creator_monitoring`. This is a flywheel: better official API capture → larger candidate pool → better AI radar coverage → more untagged UGC discovered → more creators identified → larger candidate pool. Starting with Layer 1 is therefore not just a minimum viable approach — it's the optimal start state for eventual Layer 3 effectiveness.

---

## 16. Option Comparison: Hybrid Layered vs. Other Options

| Attribute | Official API Only | AI Radar Only | Third-Party (Archive) | **Hybrid Layered** |
|-----------|:-----------------:|:-------------:|:---------------------:|:------------------:|
| Coverage | 60–75% | 25–40% (standalone) | ~100% (claimed) | 80–95% (all layers) |
| Creator opt-in | No | No | No | No |
| Cost (100 brands) | $10–200/mo | $50–500/mo | $30,800/mo | $10–1,500/mo (by tier) |
| Time to first value | Weeks | Months | Weeks (integration) | Days (Layer 1A) |
| Build effort | 4–6 weeks | 10–16 weeks | 2–3 weeks + negotiation | 10–17 weeks (all layers) |
| IG DM overlap | High | Medium | None | Maximum (Layer 1A) |
| Data ownership | Full (Cheerful) | Full (Cheerful) | Shared / Archive | Full (Cheerful) |
| Vendor dependency | Meta APIs | Meta + GPU vendors | Archive (direct competitor) | Meta APIs + optional AI APIs |
| Independently deployable | Single unit | Single unit | Single unit | **Yes — per layer** |
| Revenue tiering opportunity | Low | Low | Low | **High — natural tiers** |
| Risk isolation | Low | Low | Low | **High — per-layer** |

---

## 17. Key Findings

1. **Layer 1A (Story capture) should ship with the IG DM integration**. It is 1 line + 4–7 days of workflow code. The shared infrastructure cost is zero. Waiting to ship it separately is lost business value.

2. **Submit all three App Reviews at IG DM launch**. `instagram_manage_messages` (covered by DM), `instagram_manage_comments` (Layer 1B+C), and `instagram_public_content_access` (Layer 2) should be submitted simultaneously. App Review timelines run in parallel with engineering sprints.

3. **Layer 1+2 together cover 70–85% of public brand UGC at essentially zero ongoing API cost**. This is the core value proposition and should be the marketing message for the base tier.

4. **Layer 3 is optional and should be gated as an enterprise add-on**. Its compute cost ($50–500/month) warrants a separate pricing tier. The coverage it adds (10–20%) is real but incremental. For most brands, Layer 1+2 is sufficient.

5. **The candidate pool (Layer 3) self-populates from Layer 1 tag events**. Every creator discovered via official API becomes a Layer 3 monitoring candidate. The longer Layers 1+2 run before Layer 3 launches, the better Layer 3's candidate pool.

6. **The layered approach is the only one with natural product tier alignment**. Basic = Layer 1; Pro = Layer 1+2; Enterprise = Layer 1+2+3. Each tier has a clear incremental value story and a clear incremental cost basis.

7. **Archive's competitive advantage erodes as Cheerful builds Layers 1+2**. Archive's primary differentiator (Story capture, hashtag monitoring) is fully replicated by Layers 1+2 at 1/150th the cost at 100-brand scale. Archive remains relevant only for Layer 3-equivalent AI radar, which Cheerful can build natively with Phase 4+5.

---

## Sources

- `analysis/graph-api-mentions-tags.md` — `/tags` + `mentioned_media` endpoints
- `analysis/webhooks-mentions.md` — `mentions` webhook, delivery guarantees
- `analysis/hashtag-monitoring.md` — Hashtag API, 30-hashtag constraint
- `analysis/story-mention-capture.md` — Messaging API `mention` event, CDN expiry, TOS
- `analysis/ai-visual-detection.md` — YOLO, CLIP, OCR, build-vs-buy analysis
- `analysis/ai-audio-detection.md` — Whisper STT, brand NER, cost model
- `analysis/ai-candidate-discovery.md` — Business Discovery API, candidate pool strategies
- `analysis/unofficial-scraping.md` — Apify for personal account monitoring
- `analysis/current-post-tracking.md` — Existing `creator_post`, shared reusable components
- `analysis/current-ig-dm-overlap.md` — Shared infrastructure inventory, Story capture overlap
- `analysis/current-media-storage.md` — `post-media` bucket, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema
- `analysis/option-official-api-capture.md` — Layer 1 full design and coverage estimates
- `analysis/option-ai-radar.md` — Layer 3 full design and AI cost model
- `analysis/option-third-party-service.md` — Archive comparison and buy-vs-build analysis
