# Option: AI Radar — Full Untagged Brand Detection Pipeline

**Aspect**: `option-ai-radar`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-03-01
**Inputs**:
- `analysis/ai-visual-detection.md` — Logo/product YOLO, CLIP, OCR, frame sampling, build-vs-buy
- `analysis/ai-audio-detection.md` — Whisper STT, brand mention NER/fuzzy/LLM, audio source separation
- `analysis/ai-candidate-discovery.md` — Business Discovery API, historical tag graph, hashtag expansion, Apify
- `analysis/current-post-tracking.md` — Existing `creator_post`, Apify pipeline, Claude vision already in stack
- `analysis/current-ig-dm-overlap.md` — Shared webhook infrastructure, tokens, media download service
- `analysis/current-media-storage.md` — `post-media` Supabase Storage bucket, volume analysis
- `analysis/current-campaign-ugc-link.md` — Attribution algorithm, `ugc_content` schema
- `analysis/option-official-api-capture.md` — Official API layer (AI Radar supplements, not replaces)

---

## 1. Option Summary

**The AI Radar option** detects brand appearances in Instagram content that was **never formally tagged or @mentioned** — the "dark UGC" blind spot that official APIs cannot reach. It extends the Official API Capture option (Layer 1) with an additional detection layer that:

1. **Builds a candidate content pool** — identifies which accounts to monitor and fetches their recent media via Business Discovery API + optionally Apify
2. **Analyzes media with AI** — applies visual detection (logo, product, OCR), audio detection (STT + brand NER), and caption text matching to every candidate post
3. **Deduplicates against official captures** — avoids double-counting content already captured via `mentions` webhook, `/tags` polling, or Story mention events
4. **Scores and routes results** — high-confidence detections auto-capture; borderline detections queue for human review

Archive.com describes this as "Radar" — their pitch is "4× more UGC than teams realize." This option is what Cheerful would build to replicate that capability natively.

**What AI Radar adds beyond Official API Capture:**

| Content Type | Official API Alone | + AI Radar |
|--------------|:-----------------:|:----------:|
| Feed posts with @mention | ✅ | ✅ (deduped) |
| Feed posts with photo-tag | ✅ | ✅ (deduped) |
| Feed posts with branded hashtag | ✅ | ✅ (deduped) |
| Story @mentions | ✅ | ✅ (deduped) |
| **Feed posts: logo visible, not tagged** | ❌ | ✅ (new coverage) |
| **Feed posts: product visible, not tagged** | ❌ | ✅ (new coverage) |
| **Feed posts: brand name as OCR text** | ❌ | ✅ (new coverage) |
| **Reels: brand verbally mentioned** | ❌ | ✅ (new coverage) |
| **Reels: logo visible in frames** | ❌ | ✅ (new coverage) |
| Untagged Stories (no @mention) | ❌ | ❌ (still no access) |
| Private account content | ❌ | ❌ (inaccessible) |

**Coverage estimate with AI Radar:**
- Official API alone: ~60–75% of public tagged UGC
- + AI Radar (Business Discovery accounts only): +15–25% additional untagged UGC
- + AI Radar (with Apify personal accounts): +25–40% additional untagged UGC
- **Combined (all sources): 75–90% of total discoverable public brand UGC**

---

## 2. Architecture Overview

AI Radar has three pipeline stages that run sequentially per brand:

```
Stage 1: Candidate Discovery
  ↓ Which accounts to monitor?
  ↓ What recent content exists?

Stage 2: AI Analysis
  ↓ Does this content contain the brand?
  ↓ (3 parallel sub-pipelines: visual, audio, caption)

Stage 3: Result Processing
  ↓ Deduplicate vs. officially-captured content
  ↓ Score confidence
  ↓ Auto-capture OR queue for human review
```

### 2.1 Stage 1: Candidate Discovery

The prerequisite to AI analysis. Builds and maintains a watchlist of creator accounts to poll for untagged brand content.

**Candidate pool sources (in priority order):**

| Source | How Populated | Coverage Character | TOS Risk |
|--------|--------------|-------------------|----------|
| Campaign creators | Existing `campaign_creator` table | All known opt-in creators | None |
| Historical taggers | Auto-add when `/tags` or `mentions` captures a post | "Likely repeat" creators | None |
| Hashtag-discovered creators | Extract `username` from hashtag API results | Category-relevant creators | None |
| Third-party creator database (Modash/HypeAuditor) | Weekly API query, filter by niche/followers | Niche expansion beyond known universe | None |
| Apify personal-account monitoring | Apify actor for any public profile | Fills 80% personal-account gap | Low-Medium (existing risk) |

**New database table: `ugc_creator_monitoring`**

```sql
CREATE TABLE ugc_creator_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    ig_username TEXT NOT NULL,
    ig_user_id TEXT,                   -- Populated after first Business Discovery call
    is_business_account BOOLEAN,       -- false = personal; requires Apify
    last_post_id TEXT,                 -- Most recent IG media ID seen
    last_checked_at TIMESTAMPTZ,
    check_priority INTEGER DEFAULT 2,  -- 1=high, 2=medium, 3=low
    is_active BOOLEAN DEFAULT TRUE,
    added_via TEXT NOT NULL,           -- 'campaign', 'tag_history', 'hashtag', 'creator_db', 'manual', 'apify'
    post_count_analyzed INTEGER DEFAULT 0,
    untagged_detection_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_ig_dm_account_id, ig_username)
);
```

**Rate budget for Business Discovery polling:**

At 200 calls/hr per brand account, with Official API operations consuming ~60–100 calls/hr:

| Available for Creator Polling | Creators Monitorable |
|------------------------------|---------------------|
| 100 calls/hr (generous budget) | 2,400 creators/day (1 poll each) |
| 60 calls/hr (conservative) | 1,440 creators/day |
| 30 calls/hr (tight, high hashtag use) | 720 creators/day |

For a typical Cheerful brand (50–200 active campaign creators), this is not a bottleneck.

**Self-reinforcing growth mechanism:**

```
Official API captures tagged post from Creator A
    → Creator A added to ugc_creator_monitoring
    → Business Discovery polls Creator A's future posts
    → AI Radar detects untagged post from Creator A
    → If untagged post shows Creator B's collaboration
    → Creator B added to ugc_creator_monitoring
    → Pool grows organically over time
```

---

## 3. Stage 2: AI Analysis Pipeline

Three parallel sub-pipelines run against every candidate content item (after a cheap caption pre-filter). All three consume the same media file; their results are merged into a combined confidence score.

### 3.1 Caption Pre-Filter (Zero Cost, Applied First)

Before any expensive AI runs, check the post caption for brand signals:

```python
def caption_prefilter(caption: str | None, brand: BrandConfig) -> PrefilterResult:
    if not caption:
        return PrefilterResult(skip_visual_audio=False, confidence=0.0, reason="no_caption")

    caption_lower = caption.lower()

    # Already captured via official API — skip (avoid duplicate)
    if f"@{brand.ig_handle}" in caption_lower:
        return PrefilterResult(skip_visual_audio=True, already_captured=True, reason="has_at_mention")

    # Brand name appears in caption without @handle — flag; still run visual for confirmation
    brand_terms = [brand.name.lower()] + [a.lower() for a in brand.aliases]
    if any(term in caption_lower for term in brand_terms):
        return PrefilterResult(skip_visual_audio=False, confidence=0.7, reason="text_brand_mention")

    # Branded hashtag present — already captured by hashtag monitoring; flag for dedup
    if any(f"#{tag}" in caption_lower for tag in brand.hashtags):
        return PrefilterResult(skip_visual_audio=True, already_captured=True, reason="has_branded_hashtag")

    return PrefilterResult(skip_visual_audio=False, confidence=0.0, reason="no_text_signal")
```

This filter eliminates ~40–60% of candidate posts before any AI cost is incurred (many candidates will have @mentions or hashtags, already deduped).

### 3.2 Sub-Pipeline A: Visual Detection

**Input**: Image URL (feed post) or video URL (Reel, feed video)
**Output**: `visual_confidence` (0–1.0), detected elements list

```
Media URL
    ↓ download_media_for_analysis_activity (reuse existing download service)
    ↓ [if video] frame_extraction_activity (ffmpeg, 2 FPS for Reels ≤60s)
    ↓
    For each frame (or single image):
    ├── logo_detection_activity → confidence score per brand logo
    ├── product_recognition_activity → CLIP embedding similarity
    └── ocr_detection_activity → on-screen brand name match
    ↓
confidence_aggregation:
    visual_confidence = max(logo_conf, product_conf, ocr_conf)
    # OR weighted: 0.5*logo + 0.3*clip + 0.2*ocr (tunable per brand)
```

**Temporal activity: `frame_extraction_activity`**

```python
@activity.defn
async def frame_extraction_activity(
    params: FrameExtractionParams,  # { media_url: str, media_type: str, fps: float = 2.0 }
) -> FrameExtractionResult:
    """Run ffmpeg to extract frames from video; return local file paths."""
    # ffmpeg -i {media_url} -vf fps={fps} /tmp/{job_id}/frame_%04d.jpg
    # For images: return [media_path] directly (no-op)
```

**Frame counts at 2 FPS (cost-critical metric):**

| Content Type | Duration | Frames at 2 FPS | Frames at scene-change |
|-------------|---------|-----------------|----------------------|
| Feed image | N/A | 1 | 1 |
| Feed video | 60s | 120 | ~15-20 |
| Reel ≤15s | 15s | 30 | ~5-8 |
| Reel 15–60s | 60s | 120 | ~15-20 |
| Reel 60–90s | 90s | 180 | ~20-30 |

**Visual detection: three build-vs-buy options:**

#### Option V-1: Google Cloud Vision API (Managed, MVP path)

- Logo detection: $1.50/1,000 images
- OCR: $1.50/1,000 images (same price tier)
- Combined call: $3.00/1,000 images
- Works out-of-the-box for recognized brands; no per-brand training
- Cannot detect niche/emerging brand logos not in Google's training set

**Cost per post:**

| Post Type | Frames | Cost per Post (logo + OCR) |
|-----------|--------|---------------------------|
| Feed image | 1 | $0.003 |
| Feed video (2 FPS, 60s) | 120 | $0.36 |
| Reel (2 FPS, 60s) | 120 | $0.36 |
| Reel (scene-change only, ~15 frames) | 15 | $0.045 |

**Monthly cost (Cloud Vision, scene-change sampling):**

| Volume | Cost |
|--------|------|
| 1,000 posts/mo | $3–45 |
| 10,000 posts/mo | $30–450 |
| 100,000 posts/mo | $300–4,500 |

Video-heavy workloads are expensive at Cloud Vision prices. Frame extraction strategy is the key cost lever.

#### Option V-2: Roboflow Managed (Mid-tier, pre-built logo models)

- $49/mo Starter tier includes inference credit allocation
- Pre-trained brand logo models in Roboflow Universe (YOLOv8-based)
- For brands with recognizable logos: fast time-to-production
- Self-hosted inference via `roboflow/inference` open-source package: **free** (Apache 2.0)

**Self-hosted cost**: GPU time only (~$0.001–0.01 per image at 80–100 images/sec on A10G GPU)

#### Option V-3: Self-Hosted YOLO + CLIP + PaddleOCR (Full Build)

Full stack on Fly.io GPU machine (A10G or L40S):

```
- YOLOv8 (fine-tuned per brand logo) — logo detection
- CLIP ViT-L/14 + Qdrant — product recognition via embedding similarity
- PaddleOCR v3.0 — on-screen brand name extraction
- ffmpeg — frame extraction
- FastAPI GPU worker — async inference endpoint
```

**GPU compute cost at scale:**

| Volume (images/mo) | GPU Hours Needed | Cost (A10G @ $1/hr) |
|-------------------|-----------------|---------------------|
| 10,000 | 0.1 hr | ~$0.10 |
| 100,000 | 1 hr | ~$1.00 |
| 1,000,000 | 10 hr | ~$10.00 |

Break-even vs. Cloud Vision: self-hosted becomes cheaper above ~100,000–500,000 images/month.

**Trade-off**: Self-hosted requires per-brand YOLO fine-tuning (200–500 labeled images per brand), model version management, and GPU infrastructure operations. Significant upfront engineering cost.

**Claude vision as an alternative** (already in Cheerful stack):

Cheerful already uses Claude Sonnet for vision analysis in `post_tracking/analyzer.py`. Claude's multimodal capability can perform logo identification, OCR, and product recognition in a single call without building specialized ML infrastructure:

```python
response = claude.messages.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "data": frame_b64}},
        {"type": "text", "text": f"""
Analyze this image for appearances of the brand "{brand.name}".
Look for:
1. The brand logo: {brand.logo_description}
2. Brand products: {brand.product_descriptions}
3. The brand name as visible text

Return JSON:
{{
  "brand_detected": true/false,
  "confidence": 0.0-1.0,
  "detection_types": ["logo"|"product"|"text"],
  "reasoning": "..."
}}
"""}
    ]}]
)
```

**Claude vision cost**: ~$0.003–0.008 per image (Claude Sonnet 4.6 pricing; image token cost depends on dimensions)

**Claude vision advantages**:
- Zero per-brand training data needed
- Zero additional infrastructure (already integrated)
- High accuracy for logo + OCR + product description matching
- Can reason about ambiguous cases ("is this the brand's product or a competitor's?")

**Claude vision limitations**:
- More expensive per image than self-hosted YOLO at volume
- Slower (LLM latency ~500ms–2s vs ~10ms for YOLO)
- Not suitable for real-time processing; batch only

**Build-vs-buy recommendation for visual detection:**

| Scenario | Recommendation |
|----------|---------------|
| MVP/POC, <10K posts/month | **Claude vision API** — already integrated, zero training needed |
| 10–50 brands, moderate volume | **Cloud Vision API + Claude for ambiguous cases** |
| 50+ brands, high volume | **Self-hosted YOLO + CLIP**, or Roboflow managed |
| Niche brands (logos not in Google's index) | **Roboflow custom** or **self-hosted YOLO** |

### 3.3 Sub-Pipeline B: Audio Detection

**Input**: Video URL (Reels, feed videos, Story media if available)
**Output**: `audio_confidence` (0–1.0), transcript excerpt, brand mention timestamps

```
Video URL
    ↓ audio_extraction_activity (ffmpeg: extract 16kHz mono WAV)
    ↓ [optional] audio_source_separation_activity (Spleeter, if music-heavy Reel)
    ↓ transcription_activity (STT provider)
    ↓ brand_mention_extraction_activity (keyword → fuzzy → Claude Haiku if needed)
    ↓ audio_confidence score
```

**STT provider comparison (from `ai-audio-detection.md`):**

| Provider | Per-Video Cost (60s) | Accuracy | Hallucinations |
|----------|--------------------:|---------|---------------|
| Self-hosted Distil-Whisper | ~$0.0017 | High | Moderate |
| GPT-4o Mini Transcribe API | $0.003 | High | Lower |
| Whisper API (OpenAI) | $0.006 | High | Moderate |
| AssemblyAI Universal | ~$0.0042 | High | 30% fewer than Whisper |

**For MVP**: GPT-4o Mini Transcribe API at $0.003/video — minimal code, zero infrastructure.
**For scale (>100K videos/month)**: Self-hosted Distil-Whisper on shared GPU worker.

**Brand mention extraction — tiered approach (from `ai-audio-detection.md`):**

```python
# Tier 1: keyword/regex (free, instant)
# Tier 2: rapidfuzz fuzzy match (free, handles casual pronunciation)
# Tier 3: Claude Haiku LLM pass (adds ~$0.0003/transcript, for homonym disambiguation)
```

**Audio detection cost per video:**

| Setup | Per-Video Cost | Notes |
|-------|----------------|-------|
| GPT-4o Mini + regex/fuzzy | $0.003 | MVP path |
| GPT-4o Mini + Claude Haiku NLP | $0.0033 | Adds homonym disambiguation |
| Self-hosted Whisper + regex | ~$0.0017 | Shared GPU |

**Monthly cost at scale:**

| Volume | GPT-4o Mini + regex | Self-hosted + regex |
|--------|---------------------|---------------------|
| 10,000 videos/mo | $30 | $17 |
| 100,000 videos/mo | $300 | $170 |
| 1,000,000 videos/mo | $3,000 | $1,700 |

Audio detection is **10–30× cheaper** than visual detection at equivalent volume.

**Critical note on background music**: Instagram Reels commonly layer voiceover over trending music. Whisper WER jumps from ~20% to ~40–60% on music-heavy content. Spleeter audio source separation (Deezer, Apache 2.0) adds 1–3 seconds processing per Reel on CPU and significantly improves accuracy. Recommended as an optional pre-step for production deployments.

### 3.4 Sub-Pipeline C: Caption Text Analysis (Beyond Pre-Filter)

The pre-filter catches exact brand name/handle matches. A secondary NLP pass on captions can catch:
- Brand mentions in foreign languages
- Indirect references ("their new moisturizer" after establishing brand in earlier sentence)
- Contextual indicators (campaign hashtags adjacent to brand-relevant content)

For Cheerful's MVP, the caption pre-filter (exact string match) is sufficient. LLM-based caption analysis adds marginal cost with diminishing returns given that explicit mentions are already caught by the Official API layer.

---

## 4. Stage 3: Result Processing

### 4.1 Confidence Score Aggregation

Each sub-pipeline returns an independent confidence score (0–1.0). Aggregation options:

```python
def aggregate_confidence(
    caption_conf: float,     # 0.0 (no signal) to 0.8 (brand name in caption)
    visual_conf: float,      # 0.0 to 1.0 from vision model
    audio_conf: float,       # 0.0 to 1.0 from STT + NER
) -> AggregatedResult:

    # Option A: Maximum — any strong signal triggers capture
    combined = max(caption_conf, visual_conf, audio_conf)

    # Option B: Weighted combination
    combined = 0.3 * caption_conf + 0.5 * visual_conf + 0.2 * audio_conf

    # Routing thresholds (tunable per brand)
    if combined >= 0.8:
        return AggregatedResult(action="auto_capture", confidence=combined)
    elif combined >= 0.4:
        return AggregatedResult(action="queue_for_review", confidence=combined)
    else:
        return AggregatedResult(action="discard", confidence=combined)
```

Thresholds are brand-configurable. Conservative brands (high precision, lower recall) use higher auto-capture thresholds. Aggressive brands use lower thresholds and accept more false positives for human review.

### 4.2 Deduplication Against Official API Captures

Before creating a new `ugc_content` row, check for existing captures:

```python
@activity.defn
async def deduplicate_ai_detection_activity(
    params: DeduplicateParams,
) -> DeduplicateResult:
    """
    Check ugc_content table: if this (brand, ig_post_id) already captured,
    mark as duplicate and skip. If new, proceed to storage.
    """
    existing = await db.execute(
        "SELECT id, capture_source FROM ugc_content "
        "WHERE user_ig_dm_account_id = :brand_id AND instagram_post_id = :post_id",
        {"brand_id": params.brand_id, "post_id": params.ig_post_id}
    )

    if existing:
        # Content already captured (via webhook/polling) — enrich with AI detection metadata
        # but don't create duplicate row
        return DeduplicateResult(is_duplicate=True, existing_ugc_id=existing.id)
    return DeduplicateResult(is_duplicate=False)
```

**Enrichment on dedup**: If AI Radar detects a post already captured via official API, the detection metadata (transcript excerpt, visual confidence, detection type) can be stored as enrichment on the existing `ugc_content` row — providing richer data about the capture without duplicating the content record.

### 4.3 Human Review Queue

For borderline confidence detections (threshold range: 0.4–0.8), write to a review queue:

```sql
CREATE TABLE ugc_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_post_id TEXT NOT NULL,
    creator_ig_username TEXT,
    media_storage_path TEXT,
    ai_confidence FLOAT NOT NULL,
    detection_summary JSONB,    -- { visual: {...}, audio: {...}, caption: {...} }
    review_status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_ig_dm_account_id, ig_post_id)
);
```

Upon brand team approval in the review queue, a `ugc_content` row is created with `capture_source = 'ai_radar'`.

---

## 5. Full Data Flow Architecture

```
UGCCandidateDiscoveryWorkflow (every 4 hours, per brand)
    ↓
    Fetch prioritized creator watchlist from ugc_creator_monitoring
    ↓
    For each creator:
        GET /{brand_ig_id}?fields=business_discovery.username({creator_username}){media{...}}
        → new posts since last_post_id
    ↓
    Enqueue new posts → ugc_ai_analysis_queue

UGCAIAnalysisWorkflow (triggered per queued post)
    ↓
    caption_prefilter_activity
        → if already_captured: mark dedup → exit
        → if no_signal: proceed to expensive AI
    ↓
    [parallel]
    ├── VisualDetectionWorkflow:
    │   ├── download_media_for_analysis_activity
    │   ├── [if video] frame_extraction_activity (ffmpeg, 2 FPS)
    │   ├── logo_detection_activity (Cloud Vision / Roboflow / YOLO)
    │   ├── product_recognition_activity (CLIP + Qdrant)
    │   └── ocr_detection_activity (PaddleOCR / Cloud Vision)
    │
    └── AudioDetectionWorkflow:
        ├── audio_extraction_activity (ffmpeg)
        ├── [optional] audio_source_separation_activity (Spleeter)
        ├── transcription_activity (GPT-4o Mini / self-hosted Whisper)
        └── brand_mention_extraction_activity (keyword → fuzzy → Claude Haiku)
    ↓
    aggregate_confidence_activity
    ↓
    deduplicate_ai_detection_activity
    ↓
    if confidence >= AUTO_CAPTURE_THRESHOLD:
        download_media_to_storage_activity
        upsert_ugc_content_activity (capture_source='ai_radar')
        attribute_ugc_to_campaign_activity
    elif confidence >= REVIEW_THRESHOLD:
        upsert_ugc_review_queue_activity
    else:
        mark_analyzed_no_detection_activity (update cursor; skip)
```

---

## 6. New Database Schema

### New Tables

```sql
-- AI analysis queue: posts fetched from creator watchlist, pending AI analysis
CREATE TABLE ugc_ai_analysis_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_post_id TEXT NOT NULL,
    creator_ig_username TEXT NOT NULL,
    media_type TEXT NOT NULL,          -- IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url TEXT,
    caption TEXT,
    posted_at TIMESTAMPTZ,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    analysis_status TEXT DEFAULT 'pending',  -- pending, processing, complete, skipped
    analysis_result JSONB,
    UNIQUE(user_ig_dm_account_id, ig_post_id)
);

-- Creator watchlist for AI radar candidate pool
CREATE TABLE ugc_creator_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_username TEXT NOT NULL,
    ig_user_id TEXT,
    is_business_account BOOLEAN,
    last_post_id TEXT,
    last_checked_at TIMESTAMPTZ,
    check_priority INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    added_via TEXT NOT NULL,
    post_count_analyzed INTEGER DEFAULT 0,
    untagged_detection_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_ig_dm_account_id, ig_username)
);

-- Human review queue for borderline AI detections
CREATE TABLE ugc_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_post_id TEXT NOT NULL,
    creator_ig_username TEXT,
    media_storage_path TEXT,
    ai_confidence FLOAT NOT NULL,
    detection_summary JSONB,
    review_status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_ig_dm_account_id, ig_post_id)
);

-- Per-brand AI radar configuration
ALTER TABLE user_ig_dm_account
    ADD COLUMN ai_radar_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN ai_radar_auto_capture_threshold FLOAT DEFAULT 0.8,
    ADD COLUMN ai_radar_review_threshold FLOAT DEFAULT 0.4,
    ADD COLUMN ai_radar_visual_provider TEXT DEFAULT 'claude_vision';
    -- 'claude_vision', 'cloud_vision', 'roboflow', 'self_hosted'
```

### Extension to `ugc_content` (from Option Official API Capture)

```sql
-- Add AI Radar detection metadata columns to ugc_content
ALTER TABLE ugc_content
    ADD COLUMN visual_confidence FLOAT,           -- 0.0-1.0 from vision model
    ADD COLUMN audio_confidence FLOAT,            -- 0.0-1.0 from STT analysis
    ADD COLUMN audio_transcript TEXT,             -- Raw transcript excerpt
    ADD COLUMN ai_detection_summary JSONB;        -- { visual: {...}, audio: {...}, model: "..." }
```

The `capture_source = 'ai_radar'` value is already defined in the `ugc_content` schema from `option-official-api-capture.md`.

---

## 7. Temporal Workflow Design

All workflows follow Cheerful's existing patterns.

### `UGCCandidateDiscoverySchedulerWorkflow`

```python
@workflow.defn
class UGCCandidateDiscoverySchedulerWorkflow:
    """Perpetual scheduler: poll creator watchlist every 4 hours per brand."""

    @workflow.run
    async def run(self, brand_account_id: str) -> None:
        await workflow.execute_child_workflow(
            UGCCandidateDiscoveryWorkflow.run,
            brand_account_id,
            start_to_close_timeout=timedelta(hours=3),
        )
        await workflow.sleep(timedelta(hours=4))
        workflow.continue_as_new(brand_account_id)
```

### `UGCCandidateDiscoveryWorkflow`

```python
@workflow.defn
class UGCCandidateDiscoveryWorkflow:
    @workflow.run
    async def run(self, brand_account_id: str) -> None:
        creators = await workflow.execute_activity(
            get_prioritized_creator_watchlist_activity,
            brand_account_id,
            start_to_close_timeout=timedelta(seconds=30),
        )

        for creator in creators:
            new_posts = await workflow.execute_activity(
                fetch_creator_new_posts_activity,
                CreatorFetchInput(
                    user_ig_dm_account_id=brand_account_id,
                    ig_username=creator.ig_username,
                    since_post_id=creator.last_post_id,
                ),
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )

            if new_posts:
                await workflow.execute_activity(
                    enqueue_posts_for_analysis_activity,
                    AiQueueInput(brand_account_id=brand_account_id, posts=new_posts),
                    start_to_close_timeout=timedelta(seconds=30),
                )

            await workflow.execute_activity(
                update_creator_watchlist_cursor_activity,
                CursorUpdateInput(
                    user_ig_dm_account_id=brand_account_id,
                    ig_username=creator.ig_username,
                    last_post_id=new_posts[0].ig_post_id if new_posts else creator.last_post_id,
                ),
                start_to_close_timeout=timedelta(seconds=10),
            )
```

### `UGCAIAnalysisWorkflow`

```python
@workflow.defn
class UGCAIAnalysisWorkflow:
    @workflow.run
    async def run(self, params: AIAnalysisInput) -> AIAnalysisResult:
        brand_config = await workflow.execute_activity(
            get_brand_config_activity, params.user_ig_dm_account_id,
            start_to_close_timeout=timedelta(seconds=10),
        )

        # Step 1: Caption pre-filter (free)
        prefilter = await workflow.execute_activity(
            caption_prefilter_activity,
            CaptionPrefilterInput(caption=params.caption, brand_config=brand_config),
            start_to_close_timeout=timedelta(seconds=5),
        )
        if prefilter.already_captured:
            return AIAnalysisResult(action="skipped_duplicate")

        # Step 2: Parallel AI analysis
        visual_task = workflow.execute_activity(
            run_visual_detection_activity,
            VisualDetectionInput(
                media_url=params.media_url,
                media_type=params.media_type,
                brand_config=brand_config,
            ),
            start_to_close_timeout=timedelta(minutes=10),
        )
        audio_task = workflow.execute_activity(
            run_audio_detection_activity,
            AudioDetectionInput(media_url=params.media_url, brand_config=brand_config),
            start_to_close_timeout=timedelta(minutes=5),
        ) if params.media_type in ("VIDEO", "REEL") else asyncio.Future()  # skip for images

        visual_result, audio_result = await asyncio.gather(visual_task, audio_task, return_exceptions=True)

        # Step 3: Aggregate and route
        combined_confidence = max(
            prefilter.confidence,
            visual_result.confidence if not isinstance(visual_result, Exception) else 0.0,
            audio_result.confidence if not isinstance(audio_result, Exception) else 0.0,
        )

        if combined_confidence >= brand_config.ai_radar_auto_capture_threshold:
            await workflow.execute_activity(
                store_ai_radar_capture_activity,
                StoreAICapture(params=params, confidence=combined_confidence, visual=visual_result, audio=audio_result),
                start_to_close_timeout=timedelta(minutes=5),
            )
            return AIAnalysisResult(action="auto_captured", confidence=combined_confidence)

        elif combined_confidence >= brand_config.ai_radar_review_threshold:
            await workflow.execute_activity(
                queue_for_human_review_activity,
                ReviewQueueInput(params=params, confidence=combined_confidence),
                start_to_close_timeout=timedelta(seconds=30),
            )
            return AIAnalysisResult(action="queued_for_review", confidence=combined_confidence)

        return AIAnalysisResult(action="discarded", confidence=combined_confidence)
```

---

## 8. IG DM Infrastructure Overlap

AI Radar has **less direct overlap** with the IG DM integration than Official API Capture does. The integration points are:

### Shared (Reused Identically)

| Component | Shared From | How AI Radar Uses It |
|-----------|------------|---------------------|
| `user_ig_dm_account` table | IG DM integration | Brand credentials for Business Discovery API calls |
| `access_token` in `user_ig_dm_account` | IG DM integration | Authentication for Business Discovery `GET /{brand_ig_id}?fields=business_discovery...` |
| `post-media` Supabase Storage bucket | Existing post tracking | Temporary media storage during analysis |
| `download_and_store_media` service | Existing post tracking | Download creator media URLs for analysis |
| `analyze_image_with_llm` in `analyzer.py` | Existing post tracking | Claude vision analysis (reuse for visual detection MVP) |
| Temporal cluster + workflow patterns | Existing post tracking | All AI Radar workflows follow same patterns |
| Fly.io backend deployment | Existing deployment | CPU workers run candidate discovery polling |

### Not Shared (AI Radar-Specific)

| Component | Notes |
|-----------|-------|
| GPU worker service | New — needed for self-hosted YOLO/Whisper path (not needed for API path) |
| `ugc_creator_monitoring` table | New — no DM equivalent |
| `ugc_ai_analysis_queue` table | New |
| `ugc_review_queue` table | New |
| Business Discovery API calls | New — different from IG DM API (uses different endpoint) |
| Frame extraction (ffmpeg) | New — not used in DM or current post tracking |
| STT pipeline (Whisper/GPT-4o Mini) | New — not in current stack |
| Per-brand model registry (if self-hosted) | New — only needed for YOLO fine-tuning path |

**Key contrast with Official API Capture**: Story mention capture gets ~80% of its infrastructure from IG DM for free. AI Radar gets ~30% of its infrastructure from existing systems. The candidate discovery, AI inference, and review queue components are all net-new.

---

## 9. Capability Matrix

### Content Type Coverage

| Content Type | AI Radar Adds | Notes |
|-------------|:------------:|-------|
| Feed images: logo visible | ✅ | If creator is in candidate pool |
| Feed images: product visible | ✅ | CLIP embedding match |
| Feed images: brand name as text | ✅ | OCR |
| Feed videos/Reels: logo in frames | ✅ | Frame extraction + visual detection |
| Feed videos/Reels: brand spoken | ✅ | Audio detection |
| Feed videos/Reels: brand name on-screen | ✅ | OCR on frames |
| Carousel albums | ✅ | Analyze first image + caption |
| Stories (without @mention) | ❌ | No API access; cannot fetch Story media without @mention event |
| Private account content | ❌ | Not accessible |
| Personal account content | ⚠️ | Only via Apify (TOS risk) |
| Content from unknown accounts | ❌ | Must be in candidate pool first |

### Estimated Coverage Contribution

| Content Category | % of Total UGC | AI Radar Captures |
|-----------------|---------------:|:-----------------:|
| Tagged/mentioned (already in Layer 1) | 40–60% | N/A (deduped) |
| Untagged: known Business/Creator accounts | 15–20% | ✅ 60–80% of this category |
| Untagged: personal accounts (Apify path) | 20–30% | ⚠️ 40–60% (TOS risk) |
| Untagged: unknown accounts | 10–15% | ❌ Not discoverable |
| Private account content | 5–10% | ❌ Inaccessible |
| Stories without @mention | 5–10% | ❌ No API access |

**Net new coverage from AI Radar (Business Discovery path only)**: ~9–16% of total brand UGC
**Net new coverage with Apify personal accounts**: ~18–30% of total brand UGC

---

## 10. Effort Estimate

### Component-Level Breakdown

| Component | Effort | Notes |
|-----------|--------|-------|
| `ugc_creator_monitoring` table + migration | Small | ~1 day |
| `ugc_ai_analysis_queue` table + migration | Small | ~0.5 day |
| `ugc_review_queue` table + migration | Small | ~0.5 day |
| `UGCCandidateDiscoveryWorkflow` + activities | Medium | Business Discovery polling, cursor tracking; ~1 week |
| Watchlist auto-population from tag events | Small | Hook into attribution activity; ~1 day |
| Caption pre-filter activity | Small | Already exists in `analyzer.py`; ~0.5 day |
| `UGCAIAnalysisWorkflow` (orchestration) | Medium | Parallel sub-tasks, confidence aggregation, routing; ~1 week |
| Visual detection — Claude vision path (MVP) | Small | Reuse existing `analyze_image_with_llm`; ~2 days |
| Visual detection — Cloud Vision API | Small | Simple REST API call; ~1 day |
| Frame extraction (ffmpeg activity) | Small | Standard library; ~1 day |
| Audio extraction (ffmpeg activity) | Small | ~1 day |
| STT transcription (GPT-4o Mini API) | Small | Single API call; ~1 day |
| Brand mention NLP (keyword + fuzzy) | Small | Python libraries; ~2 days |
| Confidence aggregation logic | Small | ~1 day |
| Deduplication against `ugc_content` | Small | DB query; ~1 day |
| `store_ai_radar_capture_activity` | Small | Reuse patterns from Official API Capture; ~1 day |
| Human review queue API endpoints | Medium | CRUD + action endpoints; ~3 days |
| Human review queue frontend UI | Medium | Review modal, approve/reject flow; ~1 week |
| Brand config UI (radar on/off, thresholds) | Small | Form in existing settings; ~2 days |
| Hashtag → creator extraction (pool expansion) | Small | Piggyback on hashtag monitoring; ~1 day |
| Third-party creator DB integration (Modash) | Medium | New vendor, API integration; ~1 week |
| Apify personal-account scraping (optional) | Small–Medium | Extends existing Apify integration; ~3 days |
| **GPU worker service** (self-hosted Whisper/YOLO) | **Large** | New infrastructure, GPU machine config, model serving; **~3–4 weeks** if needed |
| Monitoring + alerting (queue depth, analysis rate) | Small | ~2 days |

### Phased Effort Totals

**Phase AI-1 (MVP — Claude vision + GPT-4o Mini + Business Discovery)**:
Candidate discovery + Claude vision + GPT-4o Mini STT + review queue
→ **~5–7 engineer-weeks**
→ Requires: Official API Capture (Layer 1) built first, `ugc_content` table exists

**Phase AI-2 (Add Cloud Vision / Roboflow + improved audio)**:
Replace Claude vision with Cloud Vision API, add Spleeter, tune thresholds
→ **~2–3 engineer-weeks** incremental

**Phase AI-3 (Scale — self-hosted GPU inference)**:
YOLO fine-tuning pipeline, Distil-Whisper GPU worker, CLIP + Qdrant
→ **~4–6 engineer-weeks** incremental; only warranted at 100K+ analyses/month

**Phase AI-4 (Apify personal accounts)**:
Extend existing Apify integration for creator media monitoring
→ **~1–2 engineer-weeks** incremental; TOS risk acceptance required

---

## 11. Cost Analysis

### API-Based MVP (Phase AI-1): Claude Vision + GPT-4o Mini STT

Assumptions: 200 monitored creators per brand, 5 new posts/creator/day, 50% are videos

| Component | Cost Model | 100 creators/day | 1,000 creators/day |
|-----------|-----------|:----------------:|:------------------:|
| Business Discovery API calls | Free | $0 | $0 |
| Claude vision (images: 50%) | ~$0.005/image | $0.25 | $2.50 |
| Claude vision (video frames @ 10 frames) | ~$0.005×10 | $2.50 | $25 |
| GPT-4o Mini STT (videos: 50%) | $0.003/video | $0.15 | $1.50 |
| Supabase Storage (1 MB/media stored) | $0.021/GB | $0.21 | $2.10 |
| **Daily total** | | **~$3.11** | **~$31.10** |
| **Monthly total** | | **~$93** | **~$930** |

**At 10 brands (typical Cheerful scale)**: ~$93–930/month total across all brands.

### Cloud Vision API (Phase AI-2): More Affordable At Volume

Replacing Claude vision with Cloud Vision ($1.50/1K images + $1.50/1K OCR = $3.00/1K combined):

| Component | Cost | 1,000 posts/mo | 10,000 posts/mo |
|-----------|------|:--------------:|:---------------:|
| Cloud Vision (logo + OCR) | $3.00/1K images | $3 | $30 |
| Frame extraction overhead | Compute only | ~$0 | ~$0 |
| GPT-4o Mini STT | $0.003/video | $1.50 | $15 |
| **Monthly API cost** | | **~$4.50** | **~$45** |

Much cheaper per post than Claude vision for high volume, but loses Claude's reasoning quality.

### Comparison to Archive.com

Archive.com Pro plan: **$308/month per brand**.

Cheerful building natively:
- Build cost: ~5–7 engineer-weeks (one-time, Phase AI-1)
- Ongoing COGS: ~$9–93/month per brand (API costs only)
- At 10 brands: $90–930/month vs. $3,080/month for Archive (3–30× cheaper ongoing)
- Break-even on build cost: 3–12 months depending on brand count

---

## 12. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|-----------|
| Business Discovery API doesn't return video media_url (only thumbnail_url) | High | Medium | Test empirically; thumbnail-only visual detection misses video-specific logos |
| Personal account creators invisible to Business Discovery (80% of Instagram) | Certain | High | Apify fallback for high-value personal accounts; accept structural coverage ceiling |
| AI false positive rate too high (brand review fatigue) | Medium | Medium | Start with high auto-capture threshold (0.85+); review queue prevents bad captures |
| Background music degrades audio detection accuracy | High | Medium | Spleeter pre-step for production; accept ~20% audio accuracy degradation at MVP |
| Claude vision hallucination on ambiguous images | Medium | Low | Structured JSON output + confidence threshold filtering |
| Whisper hallucination on silent/noisy sections | High | Low | `no_speech_prob` filtering; fuzzy match reduces impact |
| Per-brand YOLO training pipeline doesn't scale (Phase AI-3) | Medium | High | Defer self-hosted to Phase AI-3; Cloud Vision + Claude handles MVP |
| Apify TOS risk escalates (Meta anti-scraping) | Low | Medium | Same risk as existing Cheerful Apify usage; Apify manages proxy rotation |
| GPU worker operational complexity (Phase AI-3) | High | Medium | Defer until volume justifies; API-based path handles Phase AI-1/2 |
| Creator watchlist grows unbounded (rate limit pressure) | Medium | Medium | Priority tiers + max watchlist size per brand; prune inactive creators |
| Meta Business Discovery API rate limit insufficient | Low | Medium | 200 calls/hr comfortable for typical Cheerful brand scale; alert on BUC exhaustion |
| Candidate pool "cold start" (new brands with zero history) | Certain | Medium | Pre-populate from campaign_creator immediately; hashtag discovery within first week |

---

## 13. Compatibility with Existing Architecture

| Component | Compatibility | Notes |
|-----------|:------------:|-------|
| FastAPI backend | ✅ Full | New activity endpoints follow existing patterns |
| Temporal workflows | ✅ Full | Same scheduler pattern as `PostTrackingSchedulerWorkflow` |
| Supabase (PostgreSQL) | ✅ Full | New tables; same RLS patterns |
| Supabase Storage | ✅ Full | Existing `post-media` bucket; new `ugc-ai-analysis/` sub-path |
| Claude API | ✅ Already integrated | Vision analysis uses same `anthropic` client as `analyzer.py` |
| Apify integration | ✅ Already integrated | Same `ApifyClient` pattern as `apify_posts.py` |
| Fly.io (CPU workers) | ✅ Full | Candidate discovery + API-based AI runs on CPU |
| Fly.io (GPU workers) | ⚠️ New infrastructure | Required only for Phase AI-3 (self-hosted Whisper/YOLO); separate GPU machine |
| `creator_post` table | ✅ Unmodified | AI Radar writes to `ugc_content`; `creator_post` untouched |
| `ugc_content` table | ✅ Extends | Uses `capture_source='ai_radar'`; adds AI-specific columns |
| IG DM integration | ⚠️ Dependency | Requires `user_ig_dm_account` table for brand credentials |

---

## 14. Build-vs-Buy Decision Framework

| Scenario | Recommendation | Rationale |
|----------|---------------|-----------|
| <5 brands, want AI radar now | **Archive.com** ($308/brand/mo) | Build cost not justified; use third-party |
| 5–20 brands, want AI radar | **Build Phase AI-1** (Claude + GPT-4o Mini) | $93–930/mo vs. $1,540–6,160/mo Archive; break-even in 3–6 months |
| 20+ brands, scaling | **Build Phase AI-1 → AI-2** | Cloud Vision replaces Claude for economics; self-reinforcing pool |
| 50+ brands, high volume | **Build Phase AI-3** (self-hosted GPU) | GPU amortizes; $10–170/mo all AI at 100K+ analyses |
| Niche brands (logo not in Google index) | **Self-hosted YOLO** or **Roboflow custom** | Cloud Vision pre-trained misses emerging brands |
| Fastest time-to-radar | **Archive.com** as stopgap; build native in parallel | Ship radar capability immediately; migrate brands off Archive as native layer matures |

---

## 15. Summary Assessment

| Attribute | Value |
|-----------|-------|
| **What it captures** | Untagged brand appearances: logo visible, product visible, OCR text, spoken brand name |
| **What it misses** | Untagged Stories (no @mention), private accounts, accounts outside candidate pool |
| **Estimated additional coverage** | +15–30% beyond Official API Capture (Business Discovery path); +25–40% with Apify |
| **Creator opt-in required** | **No** — Business Discovery uses brand token; Apify scrapes public profiles |
| **Cost** | ~$93–930/month (10 brands, API-based MVP); drops 10× at self-hosted scale |
| **IG DM infra dependency** | Moderate — uses `user_ig_dm_account` credentials; otherwise independent |
| **IG DM overlap** | Lower than Official API Capture (~30% shared vs. ~80% for Story capture) |
| **App Review gates** | None additional — Business Discovery uses same brand token already approved |
| **Effort (Phase AI-1, API-based MVP)** | ~5–7 engineer-weeks; requires Layer 1 (Official API Capture) built first |
| **Effort (Phase AI-3, GPU self-hosted)** | +4–6 weeks incremental; only at volume |
| **Temporal compatibility** | Full — all workflows follow existing patterns |
| **Key prerequisite** | Candidate pool bootstrapping — campaign creators + historical taggers provide cold-start pool |
| **Key constraint** | Business Discovery only works for Business/Creator accounts (~20–30% of Instagram); personal accounts require Apify |
| **Key architectural insight** | Claude vision is already in the stack for `PostTrackingWorkflow`; Phase AI-1 reuses it with zero new AI infrastructure, making the MVP path faster than it appears |

**Bottom line**: AI Radar closes the "dark UGC" gap that Official API Capture structurally cannot reach. The MVP path (Phase AI-1) reuses Cheerful's existing Claude vision integration for visual detection and adds GPT-4o Mini for audio — both are simple API calls with zero new ML infrastructure. This delivers meaningful additional coverage (~15–20% more UGC) within a 5–7 week build. The more sophisticated GPU-based path (Phase AI-3) is a scale concern, not an MVP concern. The genuine architectural challenge is candidate pool bootstrapping and the personal-account coverage ceiling — not the AI inference itself.

---

## Sources

- `analysis/ai-visual-detection.md` — YOLO, CLIP, OCR, frame sampling, build-vs-buy
- `analysis/ai-audio-detection.md` — Whisper, STT providers, brand mention NLP, costs
- `analysis/ai-candidate-discovery.md` — Business Discovery API, watchlist strategies, coverage estimates
- `analysis/current-post-tracking.md` — Claude vision integration, Apify pipeline, `post-media` bucket
- `analysis/current-ig-dm-overlap.md` — Shared infrastructure, `user_ig_dm_account` table
- `analysis/option-official-api-capture.md` — `ugc_content` schema, Layer 1 architecture
- [Archive Radar — Detect Untagged UGC](https://archive.com/blog/archive-radar)
- [Google Cloud Vision API Pricing](https://cloud.google.com/vision/pricing)
- [OpenAI GPT-4o Mini Transcription Pricing](https://costgoat.com/pricing/openai-transcription)
