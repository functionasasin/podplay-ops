# AI Candidate Discovery — Building a Content Pool for Untagged Brand Detection

**Aspect**: `ai-candidate-discovery`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

AI visual and audio detection (see `ai-visual-detection.md`, `ai-audio-detection.md`) require content to analyze — you cannot scan all of Instagram. The **candidate discovery problem** is how to identify which content to run detection against. Prior analysis established this as the actual bottleneck: "AI detection is the easy part — candidate content discovery is the real bottleneck."

The fundamental constraint: Instagram has ~2 billion monthly active users posting hundreds of millions of pieces of content per day. To detect untagged brand appearances at a cost that makes business sense, a brand must narrow its candidate pool to a manageable subset of accounts most likely to feature the brand. This document maps every viable strategy for building that pool.

**What "candidate content" means**: A set of media URLs (images, video files) from specific Instagram accounts, obtained via official APIs or other means, that is then passed to AI visual/audio analysis to check for brand appearances.

---

## 1. The Core Problem: Who Do You Monitor?

Before fetching media for AI analysis, you need a list of accounts to watch. The strategies below differ in:
- **How accounts enter the candidate pool** (discovered organically, scraped, purchased)
- **How their media is fetched** (official API, scraping, third-party)
- **What percentage of total brand UGC they cover**

| Strategy | Accounts Discoverable | Coverage Character |
|----------|----------------------|-------------------|
| Known creator network | Creators already in Cheerful system | High-confidence but bounded |
| Historical tag graph | Any creator who tagged brand before | High-value "likely repeat" signal |
| Hashtag expansion pool | Creators using category/brand hashtags | Discovery of new creators |
| Engagement mining | Accounts commenting on brand's own posts | Adjacent audience, not creators |
| Third-party creator databases | Broader creator ecosystem | Expansive but subscription cost |
| Apify/scraping-based | Any public account including personal accounts | Broad but TOS risk |

---

## 2. Strategy 1: Known Creator Network via Business Discovery API

### How It Works

The Instagram Business Discovery API allows fetching recent media from **any public Instagram Business or Creator account** using the brand's own access token — no creator permission required.

**Endpoint**:
```
GET /{ig-user-id}?fields=business_discovery.username({target_username}){
    followers_count,
    media_count,
    media{
        id,
        caption,
        media_type,
        media_url,
        thumbnail_url,
        permalink,
        like_count,
        comments_count,
        timestamp
    }
}
&access_token={BRAND_PAGE_ACCESS_TOKEN}
```

**Key fields returned on media objects**:
- `media_url` — direct CDN URL for images; for video posts, use `thumbnail_url` (still/cover) or additional API call for full video
- `media_type` — `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM`
- `caption` — post text (for NLP brand mention detection without AI)
- `timestamp` — to filter to only recent posts

**Pagination**: Default 20 posts per page; cursor-based pagination to retrieve more.

### Usage for Candidate Discovery

```python
# For each creator in Cheerful's known creator network:
# 1. Lookup their IG username
# 2. Fetch recent media via Business Discovery
# 3. Pass each media item to AI visual/audio analysis pipeline

async def fetch_creator_recent_media(brand_ig_account_id: str, creator_username: str):
    response = await graph_api.get(
        f"/{brand_ig_account_id}",
        params={
            "fields": f"business_discovery.username({creator_username})"
                      "{media{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}}",
            "access_token": brand_page_token,
        }
    )
    return response["business_discovery"]["media"]["data"]
```

### Critical Limitation: Business/Creator Accounts Only

**Business Discovery only works for other Business or Creator accounts — not personal accounts.**

Instagram personal accounts (~80% of all accounts) are completely invisible to Business Discovery. For influencer marketing, this is a significant constraint:
- Nano/micro-influencers (1K–10K followers) are disproportionately on personal accounts
- Most consumer-created "organic" UGC comes from personal accounts
- Only creators who have explicitly converted to Business or Creator accounts are reachable

**Coverage impact**: Depending on brand and creator network, 30-70% of actual UGC creators may use personal accounts and are therefore unreachable via Business Discovery.

### Rate Limit Analysis

**200 calls/hr per brand Instagram account** (same shared BUC rate limit as all other Graph API calls).

| Monitoring Pattern | API Calls/Hr | Creators Monitored/Day |
|-------------------|-------------|----------------------|
| 1 page/creator, poll every 24hr | ~21 calls (500 creators ÷ 24) | 500 creators |
| 1 page/creator, poll every 6hr | ~84 calls | 500 creators per 6hr cycle |
| 2 pages/creator, poll every 24hr | ~42 calls | 500 creators |
| 2 pages/creator, poll every 6hr | ~168 calls | 500 creators per 6hr cycle |

**Key insight**: At 200 calls/hr, a brand can efficiently monitor **400-500 known Business/Creator creators per day** with 1 API call per creator, leaving budget for other API operations. This is sufficient for most Cheerful brand accounts at current scale.

**At 10,000 creators**: Would require 50 calls/day minimum → feasible within 200/hr budget if spread across the day (50 calls/hr for this, 150 remaining for other operations).

### New Posts Detection: Delta Strategy

To avoid re-analyzing already-seen posts, implement a "last seen" cursor per creator:

```sql
CREATE TABLE ugc_creator_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    ig_username TEXT NOT NULL,
    ig_user_id TEXT,               -- populated after first discovery call
    last_post_id TEXT,             -- IG media ID of most recent post seen
    last_checked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    added_via TEXT,                -- 'campaign', 'tag_history', 'hashtag', 'manual'
    UNIQUE(brand_id, ig_username)
);
```

Only process posts with `timestamp > last_checked_at`. This makes polling idempotent and cost-efficient.

---

## 3. Strategy 2: Historical Tag Graph — Creator Re-Monitoring

### How It Works

Every time a creator tags or @mentions the brand (captured via the `/tags` endpoint or `mentions` webhook), that creator is added to a "known tagger" watchlist. Future posts from that creator are then monitored via Business Discovery for untagged brand appearances.

**Rationale**: Creators who tagged the brand once are the most likely to feature it again — they already own/use the product. Re-monitoring them for untagged appearances captures "lazy taggers" (forgot to tag this time) and repeat customers.

**Implementation**:
```python
# When a new tagged/mentioned post is captured:
async def on_ugc_captured(event: UGCCaptureEvent):
    # Add creator to monitoring watchlist
    await db.upsert("ugc_creator_monitoring", {
        "brand_id": event.brand_id,
        "ig_username": event.creator_username,
        "added_via": "tag_history",
    }, on_conflict="brand_id,ig_username")

    # No duplicate needed if already monitoring
```

### Coverage Estimate

For brands actively running influencer campaigns:
- All opted-in campaign creators are in this pool (already tracked via current `PostTrackingWorkflow`)
- All organic taggers discovered via `/tags` and `mentions` webhook automatically grow this pool
- Over time, the pool self-populates as the brand's UGC detection runs

**Coverage for "re-monitoring"**: By definition catches posts from creators who have tagged before. The question is: what % of untagged posts come from "known taggers"? Estimated 60-80% of brand's UGC comes from a repeating set of creators (long tail of one-time posters is large but low-value).

### Business/Creator Account Constraint

Same as Strategy 1: only works if the creator has a Business/Creator account. However:
- Creators in Cheerful's campaign system are likely to have Business/Creator accounts (they're professional content creators)
- Organic taggers via `/tags`/`mentions` may include personal accounts — their `owner.id` is returned but Business Discovery cannot fetch their future posts

**Mitigation**: For personal account creators, fall back to Apify scraping (Strategy 6) if their content is high-value enough to warrant it.

---

## 4. Strategy 3: Hashtag Expansion Pool

### How It Works

Use the Hashtag API (covered in `hashtag-monitoring.md`) to discover **new creators** who use category-relevant hashtags. These creators haven't necessarily tagged the brand before, but they operate in the brand's niche and are likely to feature similar products.

**Two hashtag tiers for candidate discovery**:
1. **Brand hashtags** (`#cheerfulgifts`): Creators who use this ARE actively engaging with brand content — highest signal
2. **Category hashtags** (`#gifting`, `#skincare`, `#fashion`): Creators in the brand's niche — candidates who might feature brand even without active engagement

**Hashtag API returns `username` field** — this can be used to lookup the creator's IG account and add them to `ugc_creator_monitoring`.

**However**: Username → IG User ID lookup requires an additional API call per creator:
```
GET /{ig-user-id}?fields=business_discovery.username({creator_username}){id,followers_count}
```
This consumes 1 API call from the 200/hr budget per new creator discovered.

### Hashtag Budget Conflict

The 30-hashtag/7-day constraint (from `hashtag-monitoring.md`) creates a direct conflict between:
- Using hashtags for **UGC content capture** (branded hashtag posts)
- Using hashtags for **candidate pool expansion** (category hashtags to find new creators)

With only 30 slots: brands must choose between discovering content (capture) vs. discovering creators (candidate pool growth). Typically:
- Brand hashtags: content capture (direct UGC value)
- Category hashtags: candidate discovery (indirect, enables AI radar)

**Recommended allocation** within 30-hashtag budget:
```
- 3-5 branded hashtags → direct UGC content capture
- 5-10 category/niche hashtags → candidate pool expansion for AI radar
- 10-15 remaining → campaign hashtags and secondary brand tags
```

### Coverage for Candidate Discovery

Category hashtag monitoring can surface 50-200 new creator usernames per hashtag per day (depending on hashtag popularity). At 10 category hashtags × 25 posts each = 250 new creator candidates per poll cycle.

Over time, this builds a significant watchlist of niche-relevant creators to monitor for untagged brand appearances.

---

## 5. Strategy 4: Engagement Mining (Brand's Own Post Comments)

### How It Works

People who comment on the brand's Instagram posts are engaged audience members — some are creators. The brand can fetch comments on their own posts and extract commenter usernames as candidate accounts.

**Endpoint** (brand's own posts only):
```
GET /{ig-media-id}/comments
    ?fields=id,text,username,timestamp,from
    &access_token={BRAND_PAGE_ACCESS_TOKEN}
```

Returns: `from.id` (commenter's IG user ID), `from.username`, `text` (comment text), `timestamp`.

**Permission required**: `instagram_manage_comments` (same as /tags endpoint — no additional App Review needed if already approved for UGC capture).

### Coverage and Quality

| Characteristic | Detail |
|---------------|--------|
| Pool quality | Low — commenters are engaged audience, not necessarily creators |
| Pool size | Proportional to brand's own posting frequency and engagement |
| Creator signal | No reliable way to distinguish creators from regular followers |
| Business account constraint | Same as other strategies — only Business/Creator accounts can be monitored |

**Assessment**: Engagement mining is a weak signal for UGC candidate discovery. It finds engaged audience members but not specifically content creators. More useful as a secondary signal to **prioritize** already-discovered creators (frequent commenters → higher priority monitoring).

---

## 6. Strategy 5: Third-Party Creator Databases

### How It Works

Services maintain pre-indexed databases of Instagram creators with metadata:
- Follower counts, engagement rates
- Content categories and niches
- Estimated audience demographics
- Recent posting frequency

Cheerful can query these databases to get a list of creators in the brand's relevant niche, then add them to `ugc_creator_monitoring` for Business Discovery polling.

### Key Services

**Modash** ($299-$999/mo):
- 300M+ creator profiles indexed
- Filter by niche, follower count, location, engagement rate
- API access available
- Instagram, TikTok, YouTube
- Can export lists of creators in specific categories

**HypeAuditor** ($299-$999/mo):
- 137M+ creators indexed
- Strong fake follower/engagement detection
- API access at higher tiers
- Audience demographic breakdowns

**Phyllo** (developer-first API, usage-based):
- Provides Instagram creator data via permissioned API
- Actually fetches from creator's account with their permission (different model)
- More accurate than scraping-based databases but requires creator opt-in

**Tagger by Sprout Social** (enterprise pricing):
- 11M+ creator database
- Category, niche, performance filtering
- API available at enterprise tier

### Build-vs-Buy for Creator Lists

| Scenario | Recommendation | Rationale |
|----------|---------------|-----------|
| Small brand, <100 creators | Don't buy; use tag history | Known creator pool sufficient at this scale |
| Mid-market, 100-1,000 creators | Modash API or similar ($299-$999/mo) | Cost-effective creator discovery at this scale |
| Large brand, 1,000+ creators | Enterprise creator DB or build own watchlist from tag history | Tag history self-populates at scale |
| Niche brand wanting to expand | Modash/HypeAuditor for discovery | Find creators in adjacent niches not yet discovered organically |

### Integration Pattern

```python
class CreatorPoolExpansionWorkflow:
    """Temporal workflow: weekly creator pool refresh from third-party DB."""

    async def run(self, brand_id: str):
        brand_profile = await get_brand_profile(brand_id)

        # Query Modash/HypeAuditor API for niche-relevant creators
        new_creators = await query_creator_database(
            niches=brand_profile.content_niches,   # e.g., ["skincare", "wellness"]
            min_followers=brand_profile.min_creator_followers,  # e.g., 1000
            max_followers=brand_profile.max_creator_followers,  # e.g., 500000
            engagement_rate_min=0.02,  # 2% minimum
            exclude_existing=await get_existing_monitored_creators(brand_id),
        )

        # Add to monitoring watchlist
        for creator in new_creators[:100]:  # Cap expansion per run
            await add_creator_to_watchlist(brand_id, creator.ig_username, via="creator_db")
```

---

## 7. Strategy 6: Apify/Scraping-Based Discovery

### How It Works

Apify Instagram actors can fetch data from public Instagram accounts without using the official Graph API, including **personal accounts** (the critical gap in all official API strategies).

**Relevant Apify Actors**:

| Actor | Capability | Pricing |
|-------|-----------|---------|
| `apify/instagram-scraper` | Scrape posts from any public profile | ~$0.50-2.00 per 1,000 posts |
| `scraper-engine/instagram-mentions-scraper` | Posts where a profile is mentioned | Usage-based |
| `simpleapi/instagram-tagged-posts-scraper` | Posts tagged with a profile | Usage-based |
| `apidojo/instagram-scraper-api` | 100-200 posts/sec, $0.005/query + $0.0005/post | Volume pricing |

**Key advantage over Business Discovery**: Apify scraping works on **personal accounts** — the 80% of Instagram accounts that Business Discovery cannot reach. This is the only way to monitor personal-account creators for untagged brand appearances without requiring creator opt-in.

### Existing Cheerful Apify Integration

From `spec-integrations.md`, Cheerful already uses Apify for Instagram profile scraping. This means:
- Apify API key already exists in Cheerful's secrets management
- The integration pattern (call Apify actor → poll for results → process JSON) is already established
- No new vendor onboarding needed

**What "different risk category" means**: The existing Cheerful Apify usage scrapes public profiles for discovery (finding creator data). Using Apify to **monitor creator posts for UGC** is functionally similar but oriented toward ongoing monitoring rather than one-time discovery — same TOS risk profile.

### TOS Risk Assessment

| Risk Factor | Official Business Discovery | Apify Scraping |
|------------|---------------------------|---------------|
| Meta TOS compliance | ✅ Fully compliant | ⚠️ Against Meta TOS; tolerated in practice |
| Account ban risk | None | Low-Medium (established actors have proxy rotation) |
| Rate limits | Hard 200/hr limit | Soft (depends on proxy rotation) |
| Data freshness | Direct API, real-time | Scraped, may lag 15-60 min |
| Personal account access | ❌ Not possible | ✅ Yes (any public profile) |
| Reliability | High (official API) | Medium (Instagram anti-scraping defenses) |

Cheerful already accepts some Apify TOS risk for profile scraping. UGC candidate monitoring extends this risk but doesn't change the risk category materially.

### Coverage Impact of Including Personal Accounts

| Creator tier | Likely account type | % using personal accounts |
|-------------|-------------------|--------------------------|
| Macro (1M+) | Creator or Business | ~10% personal |
| Mid-tier (100K-1M) | Creator or Business | ~20% personal |
| Micro (10K-100K) | Mixed | ~40-50% personal |
| Nano (1K-10K) | Mostly personal | ~70% personal |
| Organic (< 1K followers) | Personal | ~85% personal |

For brands tracking nano/micro influencers and organic brand advocates, **most UGC creators are on personal accounts** — making Apify scraping the only practical option to monitor them without requiring opt-in.

---

## 8. Coverage Estimation: Candidate Pool Completeness

What % of total untagged brand UGC can each strategy discover?

### The Universe of Untagged Brand UGC

Archive's marketing claim: "4× more UGC than teams realize" — implying ~75% of brand UGC goes untracked. Breaking this down:

| Content category | % of brand UGC | Capturable? |
|-----------------|----------------|------------|
| Tagged/mentioned posts (official API) | ~25-40% | ✅ Yes — via /tags + mentions webhook |
| Untagged posts from known Business/Creator accounts | ~15-20% | ✅ Yes — Business Discovery + AI |
| Untagged posts from personal accounts | ~25-35% | ⚠️ Only via Apify/scraping |
| Reels (tagged or untagged) | ~15-25% | ⚠️ Partial — API gaps |
| Stories (without @mention) | ~5-10% | ❌ No API method |
| Private account posts | ~5% | ❌ Not accessible |

**Candidate discovery determines what falls into "Untagged posts from known accounts"**:

| Strategy | Candidate Pool Size | Untagged UGC Coverage Unlocked |
|----------|--------------------|---------------------------------|
| None (no AI radar) | 0 | 0% untagged |
| Known creator network only | ~50-500 creators/brand | ~15-30% of potential untagged |
| + Historical tag graph | + all previous taggers | +10-15% (higher confidence) |
| + Hashtag expansion | + hundreds of new creators | +20-30% more untagged |
| + Third-party creator DB | + thousands in niche | +10-20% more (diminishing returns) |
| + Apify personal accounts | + all public accounts | +20-35% (personal account gap) |

**Practical coverage with comprehensive candidate discovery**: 50-65% of untagged UGC can be brought into the detection pipeline. The remaining ~35-50% comes from private accounts, unexpanded creator universe, and content without any discoverable signal.

---

## 9. API Rate Budget Analysis for Creator Monitoring

### Budget Math

**Available**: 200 calls/hr per brand Instagram account.

**Competing uses**:
- `/tags` polling: ~12-24 calls/hr
- Hashtag monitoring: ~30-60 calls/hr (if doing both recent + top per hashtag)
- `mentions` webhook follow-up fetches: depends on volume, typically 5-50/hr
- **Business Discovery creator monitoring**: remainder = ~80-120 calls/hr

**Creator monitoring capacity at 100 calls/hr**:

| Monitoring Frequency | Creators Monitored | Posts Fetched/Day |
|--------------------|-------------------|------------------|
| Poll every 24hr | 2,400 creators | 48,000 posts |
| Poll every 12hr | 1,200 creators | 48,000 posts |
| Poll every 6hr | 600 creators | 48,000 posts |
| Poll every 2hr | 200 creators | 48,000 posts |

**For a typical Cheerful brand (50-200 active creators)**: Budget is not a bottleneck. All creators can be checked multiple times per day within the 200-call limit.

**For large brands (1,000+ creators)**: Need to prioritize. Priority tiers:
1. **High priority** (poll every 2-4 hr): Active campaign creators, recent taggers
2. **Medium priority** (poll every 12-24 hr): Past campaign creators, frequent posters
3. **Low priority** (poll every 48-72 hr): One-time taggers, dormant accounts

### Temporal Workflow Pattern

```python
@workflow.defn
class UGCCandidateDiscoveryWorkflow:
    """Continuously polls known creator list for new media to analyze."""

    @workflow.run
    async def run(self, brand_id: str):
        creators = await workflow.execute_activity(
            get_prioritized_creator_watchlist,
            brand_id,
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Process in priority batches with rate limit awareness
        for priority_batch in group_by_priority(creators):
            media_items = await asyncio.gather(*[
                workflow.execute_activity(
                    fetch_creator_new_media,
                    CreatorFetchInput(
                        brand_id=brand_id,
                        ig_username=creator.ig_username,
                        since_timestamp=creator.last_checked_at,
                    ),
                    start_to_close_timeout=timedelta(seconds=30),
                )
                for creator in priority_batch
            ])

            # Enqueue detected new posts for AI analysis
            new_posts = [post for batch in media_items for post in batch]
            if new_posts:
                await workflow.execute_activity(
                    enqueue_for_ai_analysis,
                    AiAnalysisInput(brand_id=brand_id, posts=new_posts),
                    start_to_close_timeout=timedelta(minutes=5),
                )
```

---

## 10. Candidate Pool Growth Over Time

A key property of this system: the candidate pool is **self-reinforcing**.

```
Brand goes live with UGC auto-capture
    ↓
/tags + mentions webhook captures tagged content
    ↓
Each new tagged creator is added to monitoring watchlist
    ↓
Monitoring watchlist used for AI radar candidate pool
    ↓
AI radar detects untagged posts from watchlist creators
    ↓
Those untagged detections may reveal NEW creators to add to watchlist
    ↓
Pool grows → more AI candidates → more untagged captures
```

Over 6-12 months, a brand's candidate pool grows from ~50 initial campaign creators to potentially thousands of brand-adjacent accounts, providing progressively better untagged content coverage without any additional manual curation.

---

## 11. Limitations and Coverage Gaps

| Gap | Severity | Workaround |
|-----|----------|------------|
| Personal accounts (80% of users) excluded from Business Discovery | **High** | Apify scraping (TOS risk) |
| Cannot enumerate brand followers | **High** | No workaround via official API |
| Rate limit caps creator monitoring at ~2,400/day/brand | Medium | Prioritization; Apify supplements for high-value personal accounts |
| Hashtag budget conflict (capture vs. discovery) | Medium | Strategic allocation; category vs. brand hashtag separation |
| Newly viral organic creators not yet in watchlist | Medium | Hashtag expansion catches some; not comprehensive |
| Private account creators | Low (expected) | No workaround |
| Creator account type uncertainty (personal vs Business) | Medium | Attempt Business Discovery; fall back to Apify if 404 |
| No "follower of brand" API access | **High** | Cannot systematically monitor who follows the brand |

### The Fundamental Coverage Ceiling

Even with all strategies combined, there is a **hard ceiling on untagged content discovery**:

> You can only monitor accounts you already know about. The infinite "cold" Instagram universe — creators who have never tagged the brand, never used its hashtag, are not in any creator database, and have zero engagement signal — is **not discoverable without scanning all of Instagram**, which is not possible via any legitimate API.

Archive's "4× more UGC" claim likely means: 4× more from the brand's **known creator universe** (prior taggers + current campaign creators). It is unlikely Archive scans accounts with zero prior brand signal. The "untagged detection" fills the gap within the known universe, not the entire unknown universe.

---

## 12. Integration with Cheerful Architecture

### New Database Tables

```sql
-- Creator watchlist for AI radar candidate pool
CREATE TABLE ugc_creator_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    ig_username TEXT NOT NULL,
    ig_user_id TEXT,                   -- Populated after first Business Discovery call
    is_business_account BOOLEAN,       -- false = personal account; requires Apify
    last_post_id TEXT,                 -- Most recent IG media ID seen
    last_checked_at TIMESTAMPTZ,
    check_priority INTEGER DEFAULT 2,  -- 1=high, 2=medium, 3=low
    is_active BOOLEAN DEFAULT TRUE,
    added_via TEXT NOT NULL,           -- 'campaign', 'tag_history', 'hashtag', 'creator_db', 'manual'
    post_count_analyzed INTEGER DEFAULT 0,
    untagged_detection_count INTEGER DEFAULT 0,  -- Running total of AI detections
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, ig_username)
);

-- AI analysis queue: media items to be analyzed
CREATE TABLE ugc_ai_analysis_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    ig_media_id TEXT NOT NULL,
    creator_ig_username TEXT NOT NULL,
    media_type TEXT NOT NULL,          -- IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url TEXT,                    -- CDN URL (may expire)
    stored_media_path TEXT,            -- Supabase Storage path after download
    caption TEXT,                      -- For text-based pre-filter
    posted_at TIMESTAMPTZ,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    analysis_status TEXT DEFAULT 'pending',  -- pending, processing, complete, error
    analysis_result JSONB,             -- Detection results from AI pipeline
    UNIQUE(brand_id, ig_media_id)
);
```

### Caption Pre-Filter (Reduce AI Costs)

Before sending media to expensive visual/audio AI, apply cheap text pre-filters:

```python
def caption_prefilter(caption: str, brand: BrandConfig) -> PrefilterResult:
    """Returns: (skip_ai, confidence, reason)"""

    if not caption:
        return PrefilterResult(skip_ai=False, reason="no_caption")

    caption_lower = caption.lower()

    # Already captured via official API (has @mention or photo tag)
    if f"@{brand.ig_handle}" in caption_lower:
        return PrefilterResult(skip_ai=True, reason="already_captured_by_webhook")

    # Obvious brand mention in caption → still flag for record
    brand_terms = [brand.name.lower()] + [alias.lower() for alias in brand.aliases]
    if any(term in caption_lower for term in brand_terms):
        return PrefilterResult(skip_ai=False, confidence=0.8, reason="text_brand_mention")

    # No brand signal in caption → run full AI analysis
    return PrefilterResult(skip_ai=False, confidence=0.0, reason="no_text_signal")
```

This pre-filter alone eliminates the need for full visual AI analysis on a subset of posts:
- Posts with @mention → already captured via webhook, skip (avoid duplicate)
- Posts with brand name in caption but no @handle → flag as text mention, potentially still run visual
- Posts with no brand signal → queue for full visual + audio AI analysis

### Compatibility with Existing Architecture

| Component | Compatibility | Notes |
|-----------|-------------|-------|
| FastAPI backend | ✅ Full | New endpoints for watchlist management |
| Temporal workflows | ✅ Full | Natural fit for scheduled creator polling |
| Supabase | ✅ Full | New tables above |
| Apify integration | ✅ Exists | Already integrated for profile scraping |
| Graph API token | ✅ Shared | Same brand token as /tags and mentions |
| `PostTrackingWorkflow` | ✅ Extend | Current opted-in creator tracking → foundation for watchlist |

---

## 13. Effort Estimates

| Component | Effort | Notes |
|-----------|--------|-------|
| `ugc_creator_monitoring` table + migration | Small | Schema above |
| `ugc_ai_analysis_queue` table + migration | Small | Schema above |
| Business Discovery creator media fetch activity | Small | Existing API pattern |
| Temporal cron workflow: creator polling scheduler | Medium | Priority batching, rate limit awareness |
| Watchlist auto-population from tag events | Small | Hook into existing UGC capture path |
| Caption pre-filter (text NLP) | Small | Python string matching + fuzzy |
| Hashtag → new creator extraction | Small | Piggyback on hashtag monitoring workflow |
| Third-party creator DB integration (Modash/HypeAuditor) | Medium | New vendor, API integration, field mapping |
| Apify personal-account scraping integration | Small–Medium | Existing Apify pattern extended to creator media |
| Priority tier management + UI | Medium | Admin UI for watchlist management |

**Overall effort**: Medium. Mostly orchestration and scheduling logic; no novel AI or API capabilities needed.

---

## 14. Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| What it does | Builds and maintains a set of creator accounts to poll for untagged brand content |
| Prerequisite for | `ai-visual-detection`, `ai-audio-detection` — they need this pool to run |
| Candidate pool sources | Known creators, historical taggers, hashtag-discovered creators, third-party databases, Apify-scraped personal accounts |
| Coverage ceiling (Business Discovery only) | ~30-50% of potential untagged UGC (Business/Creator accounts only) |
| Coverage ceiling (with Apify personal accounts) | ~60-75% of potential untagged UGC |
| API calls required | ~100-150 calls/hr for 200-400 creator polls/day (within 200/hr budget) |
| Temporal pattern | Cron workflow with priority-batched creator polling |
| Key constraint | Personal accounts (~80% of Instagram) invisible to official API |
| Bottleneck characteristic | **This is the bottleneck** — AI detection waits for candidate content |
| New tables needed | `ugc_creator_monitoring`, `ugc_ai_analysis_queue` |
| Compatibility with IG DM infra | None — separate polling path; same Graph API token |
| Self-reinforcing | Yes — each new tagged creator automatically grows the watchlist |
| TOS risk (official path) | None — Business Discovery is a legitimate Graph API feature |
| TOS risk (Apify path) | Low-Medium — same risk profile as existing Cheerful Apify usage |

**Bottom line**: Candidate discovery is a solved problem for the brand's **known creator universe** (campaign creators, historical taggers) — these can be monitored efficiently via Business Discovery at low API cost. The hard gap is **personal account creators** (80% of Instagram users) who are invisible to the official API. Apify scraping fills this gap at the cost of some TOS risk, which Cheerful already accepts for profile scraping. A pragmatic approach is:

1. **Immediately**: Populate watchlist from campaign creators + historical taggers (zero incremental effort — data already exists)
2. **Layer 2**: Add hashtag-discovered creators to expand beyond known universe
3. **Layer 3 (optional)**: Apify personal-account monitoring for highest-value creators who use personal accounts
4. **Layer 4 (optional)**: Third-party creator database for niche expansion at meaningful scale

---

## Sources

- [Instagram Business Discovery API Reference — Meta for Developers](https://developers.facebook.com/docs/instagram-api/business-discovery)
- [Get other Instagram Users' data using Business Discovery — Ritik Khandelwal/Medium](https://medium.com/@ritikkhndelwal/get-other-instagram-users-data-using-the-python-and-instagram-graph-api-business-discovery-807ba4a9ad91)
- [Instagram Graph API Complete Developer Guide 2026 — Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [How to use Instagram API to get followers — Phyllo](https://www.getphyllo.com/post/how-to-use-instagram-api-to-get-followers)
- [Instagram Mentions Scraper — Apify](https://apify.com/scraper-engine/instagram-mentions-scraper/api)
- [Instagram Tagged Posts Scraper — Apify](https://apify.com/simpleapi/instagram-tagged-posts-scraper)
- [Fast Instagram Scraper API — Apify (ApiDojo)](https://apify.com/apidojo/instagram-scraper-api)
- [Visual Listening: Tracking Every Un-Tagged Logo Mention — API4AI/Medium](https://medium.com/@API4AI/visual-listening-tracking-every-un-tagged-logo-mention-bf7ca3724f16)
- [Instagram Monitoring — Brand24](https://brand24.com/blog/instagram-monitoring/)
- [Track Instagram Mentions to Get UGC — EmbedSocial](https://embedsocial.com/blog/monitor-instagram-mentions/)
- [Archive.com AI-Powered Creator Search and UGC Tools — Quasa.io](https://quasa.io/media/archive-com-levels-up-influencer-marketing-with-ai-powered-creator-search-and-ugc-tools)
- [Archive.com Competitor Analysis — prior analysis from this loop](../cheerful-hero-features/analysis/competitors/archive.md)
- Prior aspect analyses: `analysis/ai-visual-detection.md`, `analysis/ai-audio-detection.md`, `analysis/graph-api-mentions-tags.md`, `analysis/hashtag-monitoring.md`
