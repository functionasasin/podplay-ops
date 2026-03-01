# Current Media Storage — Analysis

**Aspect**: `current-media-storage`
**Wave**: 2 — Internal Landscape
**Date**: 2026-03-01

---

## Summary

Cheerful uses **Supabase Storage** as its sole blob/media backend. The platform has six active storage buckets covering email content, campaign assets, creator profile images, post media, brand logos, and debug uploads. The critical finding for UGC auto-capture is that the `post-media` bucket already exists, is already designed for Instagram video/image storage, and already has a working download-and-store pipeline. The `StorageService` wrapper is generic and bucket-agnostic.

The primary gaps for UGC at scale are: **volume planning** (UGC can generate orders of magnitude more media than campaign-tracked posts), **path organization** (current `posts/{post_id}/media.{ext}` scheme doesn't partition by brand), and **carousel/multi-media support** (current schema has one `media_storage_path` per post, not an array).

---

## 1. Global Storage Configuration

**File**: `supabase/config.toml`

```toml
[storage]
enabled = true
file_size_limit = "100MiB"  # Global default ceiling
```

Global max per file: **100 MiB**. Individual buckets can set tighter limits (and do).

**Supabase Storage backend**: S3-compatible object storage, served via `{SUPABASE_URL}/storage/v1/object/`. Public buckets serve files via a CDN-friendly public URL; private buckets require signed URLs or service-role token access.

---

## 2. Existing Storage Buckets

### 2.1 `email-content` — Private, Raw Email Blobs

| Property | Value |
|----------|-------|
| Public | `false` |
| File size limit | Global (100 MiB) |
| MIME types | All (no restriction, stores `.eml` RFC 2822 files) |
| Configured in | `config.toml` → `[storage.buckets.email-content]` |

**Path pattern**: `users/{user_id}/emails/{year}/{month}/{message_id}/.eml`

**Purpose**: Raw SMTP/Gmail message blobs. A single raw email file stores both message body and all attachments; attachments are extracted on-demand by MIME part index. Avoids storing multiple copies of the same email body.

**Access**: Private. Backend uses `service_role` key to upload. Signed URLs or service-role downloads for extraction.

**Relevance to UGC**: Not directly relevant. Pattern shows the date-based partitioning strategy.

---

### 2.2 `campaign-csv` — Private, CSV Uploads

| Property | Value |
|----------|-------|
| Public | `false` |
| File size limit | Not explicitly set (global 100 MiB applies) |
| Configured in | `config.toml` → `[storage.buckets.campaign-csv]` |

**Purpose**: CSV files uploaded by users for bulk creator import into campaigns.

**Relevance to UGC**: None.

---

### 2.3 `campaign-image` — Public, Product Images

| Property | Value |
|----------|-------|
| Public | `true` |
| File size limit | Not explicitly set |
| Configured in | `config.toml` → `[storage.buckets.campaign-image]` |

**Purpose**: Product images for campaigns (uploaded by brand managers via the UI).

**Relevance to UGC**: None.

---

### 2.4 `creator-images` — Public, Creator Profile Pics

| Property | Value |
|----------|-------|
| Public | `true` |
| File size limit | 5 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Migration | `20260128163621_create_creator_images_bucket.sql` |

**Path pattern**: `{platform}/{handle}.jpg`
Example: `instagram/janedoe.jpg`

**Purpose**: Creator profile pictures downloaded from Instagram/YouTube CDN and re-hosted permanently. Original CDN URLs expire; Supabase Storage provides stable public URLs for display in creator lists.

**Access pattern**: Backend fetches from Instagram CDN → uploads to Supabase Storage. Uses ETag-based deduplication (`If-None-Match`) to skip re-downloading unchanged images.

**Key service**: `apps/backend/src/services/storage/creator_image.py` — `CreatorImageService`

```python
class CreatorImageService:
    BUCKET_NAME = "creator-images"

    def generate_storage_key(self, platform: str, handle: str) -> str:
        return f"{platform}/{safe_handle}.jpg"  # e.g., instagram/janedoe.jpg

    async def download_and_store(self, platform, handle, cdn_url, current_etag=None):
        # ETag check → download → upload to Supabase Storage → return CreatorImageResult
```

**Relevance to UGC**: The pattern — download from CDN URL → upload to Supabase → return stable public URL — is exactly what UGC media capture needs. The ETag deduplication pattern is worth replicating for UGC media (avoid re-downloading already-stored content).

---

### 2.5 `post-media` — Public, Post Media (THE KEY BUCKET)

| Property | Value |
|----------|-------|
| Public | `true` |
| File size limit | **50 MB** (for video Reels) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/quicktime` |
| Migration | `20260204000003_create_post_media_bucket.sql` |

**Path pattern**: `posts/{instagram_post_id}/media.{ext}`
Example: `posts/123456789/media.mp4`

**Purpose**: Permanently storing Instagram post media (images + videos) for campaign-tracked posts. The migration comment explicitly notes: *"Media is stored permanently since Instagram URLs expire (especially Stories)."*

**Access pattern**:
- Service role uploads (backend, not user-facing upload)
- Public read (no auth needed to display in UI)
- Upsert semantics (`"upsert": "true"`) for idempotent re-runs

**Key service**: `apps/backend/src/services/post_tracking/media_storage.py`

```python
BUCKET_NAME = "post-media"

async def download_and_store_media(instagram_media_url, post_id, post_type):
    # 1. HTTP GET instagram_media_url (60s timeout)
    # 2. Detect content_type from response headers
    # 3. storage_path = f"posts/{post_id}/media.{ext}"
    # 4. supabase.storage.from_("post-media").upload(storage_path, media_bytes, {"upsert": "true"})
    # 5. Return public URL: f"{SUPABASE_URL}/storage/v1/object/public/post-media/{storage_path}"
```

Both async (`download_and_store_media`) and sync (`download_and_store_media_sync` via `asyncio.run`) versions exist — the sync version is used inside Temporal activities.

**Supported media types**: JPEG/PNG/WebP images + MP4/MOV videos. Stories (which are images or short videos) map cleanly to these types.

**Relevance to UGC**: **Directly reusable**. This bucket was designed for exactly this use case. No bucket config changes needed.

---

### 2.6 `brand-logos` — Public, Brand Logo Assets

| Property | Value |
|----------|-------|
| Public | `true` |
| File size limit | None specified (global 100 MiB) |
| Columns | `brand.logo_url`, `brand.symbol_url`, `brand.icon_url` |
| Migration | `20260226000000_create_brand_table.sql` |

**Purpose**: Brand logo/wordmark/icon assets sourced from Brandfetch API. Used to display brand identity in UI.

**Relevance to UGC**: The brand logo assets stored here are the **training/reference assets** for visual logo detection in AI Radar (see `ai-visual-detection.md`). These three variants (wordmark, symbol, icon) would serve as reference images for CLIP embedding-based detection.

---

### 2.7 `debug-uploads` — Private, Debug Files

| Property | Value |
|----------|-------|
| Public | `false` |
| File size limit | 25 MB |
| MIME types | None (unrestricted) |
| Migration | `20260221020000_create_debug_uploads.sql` |

**Path pattern**: `{user_id}/{filename}`

**Purpose**: CSV uploads, bulk operation files — for debugging. User-facing upload (authenticated users can write to their own folder).

**Relevance to UGC**: None.

---

## 3. Generic Storage Abstraction Layer

**File**: `apps/backend/src/services/storage/storage.py`

```python
class StorageService:
    """Generic service for managing content in Supabase Storage."""

    def __init__(self, supabase_client: Client, bucket_name: str):
        self.client = supabase_client
        self.bucket_name = bucket_name

    def upload_content(self, storage_key, content: bytes, mime_type="application/octet-stream"):
        self.client.storage.from_(self.bucket_name).upload(
            path=storage_key,
            file=content,
            file_options={"content-type": mime_type, "cache-control": "3600", "upsert": "true"},
        )

    def download_content(self, storage_key) -> bytes:
        return self.client.storage.from_(self.bucket_name).download(storage_key)

    def delete_content(self, storage_key): ...
    def calculate_sha256(content: bytes) -> str: ...  # For deduplication

    @contextmanager
    def download_from_storage_to_temp_file(self, storage_key, filename) -> Generator[Path, ...]:
        # Download → write to NamedTemporaryFile → yield path → cleanup
```

The `StorageService` is fully bucket-agnostic. Instantiated with any `bucket_name`. The `EmailStorageService` wraps it for email-specific path generation.

**Key design decisions**:
- Upsert always-on: re-uploading the same path is safe, idempotent
- Cache-control: 3600s (1 hour) on uploads
- SHA256 available for content-based deduplication (used selectively)

---

## 4. RLS and Access Control Patterns

All storage buckets follow one of two patterns:

| Pattern | Used By | Description |
|---------|---------|-------------|
| **Service-role write + public read** | `creator-images`, `post-media`, `brand-logos` | Backend writes with service key; any browser can read. CDN-friendly. |
| **Service-role write + authenticated user read (own folder)** | `debug-uploads` | Users can read/write under `{user_id}/` prefix. |
| **Service-role write + private** | `email-content`, `campaign-csv` | Backend only. No user-facing reads. |

For UGC media, the **service-role write + public read** pattern is correct (same as `post-media` today).

---

## 5. URL Pattern for Stored Media

Public bucket URLs follow:
```
{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{storage_path}
```

Example:
```
https://cgtgotrffwukyuxdqcml.supabase.co/storage/v1/object/public/post-media/posts/123456/media.mp4
```

This URL is **permanent** (no expiry) as long as the object exists in storage. The whole point of downloading Instagram media is to convert their expiring CDN URLs into stable Supabase URLs.

For signed (private) URLs:
```
{SUPABASE_URL}/storage/v1/object/sign/{bucket_name}/{path}?token={jwt}
```

---

## 6. Volume Analysis for UGC at Scale

This is the critical gap between current post tracking and zero-signup UGC capture.

### Current Volume (Post Tracking)

Current system: ~10 posts per creator, checked daily. Creator count per customer: ~20–200.

- **Posts analyzed per day**: 10 × 100 creators = 1,000
- **Posts stored per day**: ~10% match rate → ~100 media files/day
- **Media size**: ~500KB images, ~5–15MB short videos
- **Daily storage**: ~100 × 5MB average → ~500MB/day → ~15GB/month

### UGC Auto-Capture Volume

Zero-signup UGC is a fundamentally different scale:

| Metric | Estimate | Basis |
|--------|----------|-------|
| Creators mentioning a mid-size brand/month | 500–5,000 | Industry estimates (Archive claims 50K brands) |
| Posts per creator mentioning brand | 1–3 | Not daily — only brand-relevant posts |
| Total posts/month per brand | 500–15,000 | |
| Media per post (avg size) | 3–8 MB | Images 500KB-2MB; Reels 10-50MB (capped at 50MB) |
| Storage per brand/month | 1.5 GB – 120 GB | High variance from Reel-heavy creators |
| Cheerful at 100 brands | 150 GB – 12 TB/month | Significant |

**Story media is the volume wildcard**: Stories can be up to 15 seconds of video at 8MB each, and they MUST be downloaded within 24 hours (CDN expiry). High-volume brands with many story mentions could generate GB/day.

### Supabase Storage Pricing (as of 2026)

| Tier | Storage Included | Overage |
|------|-----------------|---------|
| Free | 1 GB | — |
| Pro ($25/mo) | 100 GB | $0.021/GB |
| Team ($599/mo) | 200 GB | $0.021/GB |

At 1 TB/month of UGC storage across all brands, Supabase overage cost = **~$190/month**. Not prohibitive at moderate scale, but grows linearly with creator volume.

**Recommendation for UGC**: Consider a tiered storage approach:
- Store thumbnails always (small, fast to display)
- Store full media only for "saved" or high-engagement UGC
- Implement TTL/archival for UGC older than 90 days (move to cold storage or delete originals)

---

## 7. Current Schema Gaps for UGC Media

### 7.1 Single `media_storage_path` (not array)

**Current schema** (`creator_post`):
```sql
media_storage_path TEXT,  -- single path
```

Instagram carousel posts have up to 10 images. Currently only the first image is stored. For UGC, capturing all carousel images requires:
```sql
media_storage_paths JSONB DEFAULT '[]'::jsonb,  -- array of paths
```

### 7.2 No Content Hash for Deduplication

`StorageService` has `calculate_sha256()` but it's not used in `download_and_store_media`. Same media from different detection methods (e.g., Apify poll + webhook mention of the same post) would be downloaded and stored twice at different paths.

UGC pipeline needs content-hash deduplication before upload to avoid paying for duplicate storage.

### 7.3 No Expiry/TTL Mechanism

Supabase Storage has no native TTL. Old UGC media accumulates indefinitely. Need application-layer cleanup job or migration to S3 lifecycle policies for media older than X days.

### 7.4 Path Organization for Multi-Brand

Current path: `posts/{ig_post_id}/media.{ext}`

This is flat — no brand partitioning. For multi-brand UGC:
- Hard to bulk-delete one brand's media
- Hard to count storage per brand for billing
- Recommended: `ugc/{brand_ig_user_id}/{ig_post_id}/media.{ext}`

---

## 8. Download Pipeline Patterns

### Sync vs Async

Current `media_storage.py` has both:
- `download_and_store_media()` — async, used in FastAPI routes
- `download_and_store_media_sync()` — `asyncio.run(...)` wrapper, used in Temporal activities

This is the correct pattern. Temporal activities run in a separate thread pool; Temporal discourages mixing async with its activity runner. The `asyncio.run()` wrapper is the established pattern in this codebase.

### Story Media Urgency

Story `story_mention` webhook events deliver a CDN URL that expires in **24 hours** (documented in `story-mention-capture.md`). The download must happen quickly after receipt. Current `download_and_store_media` with a 60-second timeout is appropriate for individual downloads; the challenge is queue depth at high volume.

If 100 story mentions arrive simultaneously (a brand goes viral), 100 parallel download requests to Supabase Storage could cause rate limiting or memory pressure on the Fly.io backend instance.

**Mitigation pattern** (not yet implemented):
1. Write `ugc_content` stub row immediately on webhook receipt (capture metadata even if media download fails)
2. Enqueue Temporal activity for media download with deadline = `captured_at + 20 hours`
3. Temporal handles retry if download fails transiently

---

## 9. What's Reusable Without Changes

| Component | File | Verdict |
|-----------|------|---------|
| `StorageService` wrapper | `services/storage/storage.py` | **100% reusable** — bucket-agnostic |
| `post-media` bucket | Migration `20260204000003` | **100% reusable** — already designed for this |
| `download_and_store_media()` | `services/post_tracking/media_storage.py` | **90% reusable** — works as-is; needs UGC path structure |
| `download_and_store_media_sync()` | Same | **100% reusable** — Temporal activity wrapper pattern |
| ETag deduplication pattern | `services/storage/creator_image.py` | **Applicable** — copy pattern for UGC media dedup |
| Public URL construction | `{SUPABASE_URL}/storage/v1/...` | **100% reusable** — same URL pattern |
| Service-role write + public read RLS pattern | All public buckets | **100% reusable** — same policies |

---

## 10. What Needs to Change or Be Added

| Gap | Description | Effort |
|-----|-------------|--------|
| Path organization | Add brand partitioning to storage key: `ugc/{brand_ig_id}/...` | Trivial |
| Multi-media support | `media_storage_paths JSONB[]` instead of single TEXT column in new UGC table | Small |
| Content-hash dedup | SHA256 check before re-uploading known content | Small |
| Story download urgency | Queue-based download with 20-hour deadline via Temporal | Medium |
| Volume monitoring | Alert on bucket size per brand; daily cost estimates | Small |
| TTL/archival job | Temporal cron to delete or archive media older than 90 days | Medium |
| AI Radar frame storage | For video analysis, need to store extracted frames temporarily during processing | Medium |

---

## Key Findings

1. **The `post-media` bucket is already production-ready** — 50MB limit, public read, correct MIME types, existing download pipeline. Zero changes needed for basic UGC media storage.

2. **The `StorageService` abstraction is bucket-agnostic** — no code changes needed; just instantiate with `"post-media"` as before.

3. **Path organization is the only structural change needed** — `ugc/{brand_ig_user_id}/{post_id}/media.{ext}` instead of `posts/{post_id}/media.{ext}` to support multi-brand isolation and per-brand storage accounting.

4. **Brand logo assets in `brand-logos` double as AI Radar reference images** — the three logo variants (wordmark, symbol, icon) stored in `brand-logos` are directly usable as reference images for CLIP/vision-based logo detection.

5. **Volume is the risk, not capability** — Supabase Storage can handle UGC technically. The question is cost: at scale, hundreds of GB per month per brand of Reel video content could cost hundreds of dollars in storage fees. Thumbnail-only strategies reduce this by 10–50×.

6. **Story media download is latency-sensitive** — the 24-hour CDN URL expiry means Story mentions must be downloaded within hours of capture. The current synchronous pipeline works for low volume; Temporal-based async queue is needed for burst handling.

7. **Carousel gap** — the current `media_storage_path TEXT` (singular) would miss images 2–10 of carousel posts. A UGC-specific schema with `media_storage_paths JSONB` addresses this.
