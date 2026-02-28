# Instagram Hashtag API — Brand Content Discovery via Hashtags

**Aspect**: `hashtag-monitoring`
**Wave**: 1 — External Landscape
**Date**: 2026-02-28

---

## Overview

The Instagram Hashtag API allows an application to discover publicly posted content that uses a specific hashtag. For UGC auto-capture, this catches content where a creator uses a branded hashtag (e.g., `#cheerfulgifts`) without necessarily @mentioning or photo-tagging the brand. This fills a gap that `graph-api-mentions-tags` and `webhooks-mentions` do not cover.

**Critical constraint**: 30 unique hashtags per rolling 7-day window, per Instagram Business/Creator account. This single limit shapes every architectural decision around this approach.

---

## 1. API Endpoints

### 1.1 Step 1: Hashtag ID Lookup

```
GET /ig_hashtag_search
    ?user_id={ig-user-id}
    &hashtag={hashtag_name_without_hash}
    &access_token={PAGE_ACCESS_TOKEN}
```

Returns a node ID for the hashtag. The `hashtag_name` parameter must NOT include the `#` symbol.

**Example**:
```
GET /ig_hashtag_search?user_id=17841405309211844&hashtag=cheerful&access_token=...
```

**Response**:
```json
{
  "data": [
    { "id": "17843822312029889" }
  ]
}
```

The returned `id` is the stable hashtag node ID. This ID does NOT change — cache it permanently. Subsequent lookups for the same hashtag do not consume an additional slot in the 30-hashtag limit (same hashtag re-query counts as one).

### 1.2 Step 2a: Recent Posts

```
GET /{ig-hashtag-id}/recent_media
    ?user_id={ig-user-id}
    &fields=id,caption,media_type,media_url,timestamp,permalink,username,like_count,comments_count,thumbnail_url
    &access_token={PAGE_ACCESS_TOKEN}
```

Returns the most recently published posts using this hashtag, ordered by recency.

### 1.3 Step 2b: Top Posts

```
GET /{ig-hashtag-id}/top_media
    ?user_id={ig-user-id}
    &fields=id,caption,media_type,media_url,timestamp,permalink,username,like_count,comments_count
    &access_token={PAGE_ACCESS_TOKEN}
```

Returns algorithmically ranked "top" posts (high engagement relative to follower count). Updated less frequently than `recent_media`.

### 1.4 Step 3: Check Recently Searched Hashtags

```
GET /{ig-user-id}/recently_searched_hashtags
    ?access_token={PAGE_ACCESS_TOKEN}
```

Returns all hashtags queried in the past 7 days, along with their IDs. Useful for auditing remaining capacity in the 30-hashtag window.

---

## 2. Fields Available

The following fields can be requested on `recent_media` and `top_media`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Instagram media ID |
| `caption` | string | Full caption text (can be null for some media types) |
| `media_type` | enum | `IMAGE`, `VIDEO`, `CAROUSEL_ALBUM` |
| `media_url` | string | CDN URL for the media (images only; for videos, use `thumbnail_url`) |
| `thumbnail_url` | string | Video thumbnail URL (video/Reel posts) |
| `timestamp` | ISO 8601 | Post creation time |
| `permalink` | string | `https://www.instagram.com/p/{shortcode}/` |
| `username` | string | Poster's Instagram username |
| `like_count` | integer | Number of likes |
| `comments_count` | integer | Number of comments |

**Notable absences from hashtag search results** (compared to brand-owned content endpoints):
- No `media_url` for videos via hashtag search (only `thumbnail_url` available; full video requires additional Graph API call with brand token)
- No `owner.id` (only `username`; cannot reliably get IG user ID from username without additional lookup)
- No reach/impressions metrics (only available on brand's own media)
- No story_id, no DM-linked identifiers

---

## 3. Rate Limits and Constraints

### 3.1 The 30-Hashtag Window — The Binding Constraint

> **30 unique hashtags may be queried per Instagram Business Account per rolling 7-day period.**

This limit was introduced on June 10, 2020, and has not changed. The mechanics:

| Behavior | Detail |
|----------|--------|
| Window type | Rolling 7-day (not calendar week) |
| Scope | Per Instagram Business/Creator account used to make the call |
| Same hashtag re-query | Does NOT consume an additional slot |
| Removing + re-adding | Re-uses the same slot; slot freed after 7-day timer for FIRST query expires |
| Error when limit reached | `"You have reached the Instagram hashtag limit imposed by Instagram of 30 hashtags per week"` |
| Multi-account workaround | Each connected brand account gets its own 30-slot window |

**Practical implication**: If Cheerful monitors 30 hashtags per brand, that's the full weekly allocation. No budget remains for campaign-specific hashtags, trend hashtags, or any others. Rotation is possible but requires careful tracking.

### 3.2 General API Rate Limit

- **200 API requests per hour** per Instagram Business Account
- Applies to ALL Instagram Graph API calls (hashtag search + all other endpoints)
- Failed requests still consume quota

**Budget analysis for hashtag monitoring (30 hashtags, poll every 2 hours)**:

```
30 hashtags × 2 calls/poll (recent_media + top_media) = 60 calls per poll
12 polls per day × 60 calls = 720 calls per day
720 / 24 hours = 30 calls/hour average
```

30 calls/hour is well within the 200/hour limit. Rate limits are NOT the binding constraint — the 30-hashtag cap is.

### 3.3 Content Recency: 24-Hour Lookback

**Critical**: The `recent_media` endpoint only returns posts from approximately the past 24 hours from when the source was first added. Posts older than this window are not retrievable retroactively via this endpoint.

**Polling interval requirement**: Must poll at minimum every 12–18 hours. Recommended: every 2–4 hours to catch all content before it ages out of the window.

### 3.4 Posts Per Query

Each call to `recent_media` or `top_media` returns approximately **20–30 posts** maximum. For highly active hashtags (#fashion, #skincare), this means the endpoint may be truncating the actual result set — high-volume hashtags have thousands of new posts per day but the API only surfaces ~25.

---

## 4. Permissions Required

| Permission | Type | App Review? |
|------------|------|-------------|
| `instagram_basic` | Standard permission | No (default for all Instagram apps) |
| `instagram_public_content_access` | Advanced feature | **Yes** — requires App Review |
| `pages_show_list` | Standard permission | No |
| `pages_read_engagement` | Standard permission | May be needed |

**`instagram_public_content_access`** is a separately gated feature (not a simple permission). The App Review process requires:
- A screencast video showing intended use
- Documentation of data usage compliance
- Business justification for public content access
- Privacy policy URL
- App Review timeline: typically 5–14 business days

This is a blocking prerequisite. Cannot use the Hashtag API in production without it.

---

## 5. Content Types Covered and NOT Covered

| Content Type | Hashtag API Coverage | Notes |
|-------------|---------------------|-------|
| Feed photos | ✅ Supported | `media_type = IMAGE` |
| Image carousels | ✅ Supported | `media_type = CAROUSEL_ALBUM` |
| Video carousels | ❌ Not supported | Videos within carousels are excluded |
| Feed videos | ⚠️ Partial | `thumbnail_url` available; full video URL requires additional Graph API call |
| Reels | ❌ Not supported via hashtag search | Reels do not appear in `recent_media` / `top_media` |
| Stories | ❌ Not supported | Stories are ephemeral and not indexed by hashtag |
| Promoted/boosted posts | ❌ Excluded | API explicitly blocks ad content |
| Copyrighted content | ❌ Excluded | Meta blocks flagged copyright content |
| Private account posts | ❌ Excluded | Only public content is indexed |

**What hashtag monitoring uniquely provides**: Content that uses the brand's hashtag WITHOUT @mentioning or photo-tagging the brand. This is the only API method that catches this category.

**What it does NOT provide** compared to other methods:
- No coverage of Stories (separate Messaging API handles @mentioned Stories only)
- No coverage of Reels with branded hashtags (significant gap — Reels are ~50% of Instagram engagement)
- No real-time push; polling is required

---

## 6. UGC Coverage Analysis for Cheerful

### 6.1 What Hashtag Monitoring Adds

For a typical influencer marketing campaign:
- **@mention in caption**: Caught by `webhooks-mentions` (see `webhooks-mentions.md`)
- **Photo-tag**: Caught by `/tags` polling (see `graph-api-mentions-tags.md`)
- **Branded hashtag only** (no @mention, no photo-tag): **Only hashtag monitoring catches this**
- **No tag, no hashtag**: Not catchable via any official API

Creators who remember to use the campaign hashtag but forget to @tag the brand are a real scenario. Hashtag monitoring is the only official mechanism to capture them.

### 6.2 Coverage Estimate

Realistic coverage estimates (rough order-of-magnitude):

| Content category | % of brand UGC | Caught by hashtag monitoring? |
|-----------------|---------------|-------------------------------|
| Creators who @mention but don't hashtag | ~60% | ❌ (covered by mentions webhook) |
| Creators who photo-tag but don't hashtag | ~20% | ❌ (covered by /tags polling) |
| Creators who use branded hashtag only | ~5–15% | ✅ |
| Creators who use category hashtags but not brand-specific ones | ~10–20% | ✅ (if category hashtags monitored) |
| Reels with hashtags | significant | ❌ API gap |
| Stories with hashtags | significant | ❌ API gap |

Hashtag monitoring likely captures 5–25% of total brand UGC depending on the brand's hashtag culture and creator behavior.

### 6.3 Hashtag Budget Allocation

A brand might want to monitor:

| Category | Example hashtags | Count |
|----------|-----------------|-------|
| Primary brand hashtag | #cheerful, #cheerfulgifts | 2 |
| Campaign hashtags | #cheerfulspring2026 | 1–3 |
| Product/collection hashtags | #cheerfulskincare | 3–10 |
| Category hashtags | #gifting, #influencergifts | 5–15 |
| **Total desired** | | **~11–30** |

30 slots is barely enough for a single brand with active campaigns. Multi-campaign brands will exhaust the budget immediately.

**Rotation strategy**: Swap campaign hashtags weekly as campaigns end. Static brand hashtags stay permanently; campaign hashtags rotate in/out as campaigns launch/conclude.

### 6.4 Multi-Account Workaround

Each Instagram Business Account connected to Cheerful gets its own independent 30-hashtag window. If a brand connects multiple IG accounts (e.g., regional accounts, product line accounts), each provides 30 additional slots. However:
- Most SMB/mid-market brands have one primary IG account
- Enterprise brands may have multiple accounts for legitimate reasons
- Creating "shadow" accounts solely to expand hashtag capacity violates Meta TOS

---

## 7. Polling Architecture for Cheerful

### 7.1 Temporal Workflow Pattern

Hashtag monitoring is a natural fit for Temporal's cron workflows:

```python
# Temporal cron workflow
@workflow.defn
class HashtagMonitoringWorkflow:
    @workflow.run
    async def run(self, brand_id: str) -> None:
        """Runs on cron schedule, e.g., every 2 hours."""
        # Get this brand's configured hashtags
        hashtags = await workflow.execute_activity(
            get_brand_hashtag_config,
            brand_id,
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Parallel fetch across all monitored hashtags
        results = await asyncio.gather(*[
            workflow.execute_activity(
                poll_hashtag_recent_media,
                HashtagPollInput(
                    brand_id=brand_id,
                    hashtag_id=h.ig_hashtag_id,
                    hashtag_name=h.name,
                    ig_user_id=h.ig_user_id,
                ),
                start_to_close_timeout=timedelta(seconds=60),
            )
            for h in hashtags
        ])

        # Aggregate and store new UGC
        for batch in results:
            await workflow.execute_activity(
                process_new_hashtag_ugc,
                batch,
                start_to_close_timeout=timedelta(minutes=5),
            )
```

### 7.2 Hashtag Config Table

New database table needed:

```sql
CREATE TABLE ugc_hashtag_config (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    ig_user_id  TEXT NOT NULL,  -- Brand's IG account making the calls
    hashtag_name TEXT NOT NULL,  -- Without #
    ig_hashtag_id TEXT,          -- Cached from ig_hashtag_search
    hashtag_slot_acquired_at TIMESTAMPTZ,  -- For tracking 7-day window
    is_active   BOOLEAN DEFAULT TRUE,
    priority    INTEGER DEFAULT 0,  -- Higher = more important
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (brand_id, hashtag_name)
);
```

### 7.3 Deduplication

Posts must be deduplicated across:
1. Same hashtag polled multiple times (primary key: `ig_media_id`)
2. Content already captured via `mentions` webhook or `/tags` polling (same `ig_media_id`)

```sql
-- UGC content upsert (idempotent)
INSERT INTO ugc_content (brand_id, ig_media_id, capture_source, ...)
VALUES ($1, $2, 'hashtag_poll', ...)
ON CONFLICT (brand_id, ig_media_id) DO UPDATE
    SET capture_sources = ugc_content.capture_sources || 'hashtag_poll'
    -- Don't overwrite other fields; capture_sources tracks all sources that found this post
```

### 7.4 Hashtag ID Caching

The hashtag node ID from `ig_hashtag_search` is stable and should be cached permanently in `ugc_hashtag_config.ig_hashtag_id`. Re-querying for the same hashtag ID:
- Does NOT consume a new slot in the 30-hashtag window
- But does consume 1 API request from the 200/hr budget
- Cache hit eliminates this call entirely

---

## 8. Integration with Existing Architecture

### 8.1 Comparison with Other Capture Methods

| Dimension | Hashtag Monitoring | `mentions` Webhook | `/tags` Polling |
|-----------|-------------------|-------------------|-----------------|
| Mechanism | Polling (cron) | Push (webhook) | Polling (cron) |
| What it catches | Branded hashtag posts (no @mention needed) | Caption/comment @mentions | Photo-tagged posts |
| Content overlap | Some (if creator both hashtags AND @mentions) | Some (caption @mention posts) | None with hashtags |
| Reels coverage | ❌ | ⚠️ Uncertain | ⚠️ Uncertain |
| Stories coverage | ❌ | ❌ | ❌ |
| Rate limit impact | Medium (200 calls/hr budget) | Low (webhook receipt free) | Low–Medium |
| Per-brand config needed | Yes (which hashtags?) | No (all @mentions received) | No (all tags received) |
| Creator opt-in | ❌ Not required | ❌ Not required | ❌ Not required |
| App Review required | Yes (`instagram_public_content_access`) | Yes (`instagram_manage_comments`) | Yes (`instagram_manage_comments`) |
| Real-time? | No (poll latency: 2–4 hrs) | Yes (1–60s) | No (poll latency: 5–15 min) |

### 8.2 IG DM Infrastructure Overlap

Unlike `mentions` webhooks (which share the IG DM webhook endpoint), hashtag monitoring is **entirely separate** from the IG DM infrastructure:

| Component | IG DM / Mentions Webhook | Hashtag Monitoring |
|-----------|------------------------|-------------------|
| Webhook endpoint | ✅ Shared | N/A — no webhook used |
| Temporal workflows | Different workflows, same Temporal cluster | New cron workflow |
| API calls | Messaging API / Graph API | Graph API only |
| Token type | Page access token (same) | Page access token (same) |
| Permission | `instagram_manage_messages` / `_manage_comments` | `instagram_public_content_access` |
| New App Review? | Partial overlap with other reviews | **New separate review needed** |

**No architectural overlap with IG DM**: Hashtag monitoring is additive work, not incremental on the DM/mentions foundation. The shared elements are only:
- Temporal cluster
- Page access token storage/management
- Supabase UGC tables (if designed generically)

---

## 9. Limitations and Risks

| Limitation | Severity | Mitigation |
|------------|----------|------------|
| 30-hashtag/week cap | **High** | Strategic selection; rotate campaign hashtags; multi-account if legitimate |
| Reels excluded from results | **High** | No API workaround; significant coverage gap |
| Stories excluded | **High** | Handled by Messaging API story_mention (but only for @mentioned stories) |
| 24-hr lookback only | High | Frequent polling (every 2–4 hrs); cannot recover missed posts |
| ~25 posts per query max | Medium | High-volume hashtags may miss posts; top vs recent tradeoff |
| `instagram_public_content_access` App Review | Medium | Plan for 2-week lead time; separate from mentions/DM review |
| No video URL (only thumbnail) | Low–Medium | Additional API call to get video URL; adds to rate limit budget |
| No owner ID (only username) | Low | Can lookup IG user ID from username separately; adds latency |
| Meta TOS: no hashtag capacity gaming | Low | Avoid creating shadow accounts purely for hashtag slots |
| Private account posts excluded | Low | Expected; aligns with other API methods |
| Promoted content excluded | Informational | Expected; aligns with UGC intent |

---

## 10. Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| `ugc_hashtag_config` Supabase table + migration | Small | Schema above |
| Brand admin UI: hashtag configuration | Medium | Allow brands to add/manage their 30 hashtag slots |
| Hashtag ID lookup + caching (`ig_hashtag_search`) | Small | Simple API call with persistent cache |
| Temporal cron workflow (poll + ingest) | Medium | Parallel activity calls, deduplication logic |
| `instagram_public_content_access` App Review | External — 1–2 weeks | Separate review from `mentions` / `manage_messages` |
| Hashtag slot tracking (7-day window management) | Small | Track `hashtag_slot_acquired_at` per hashtag |
| Deduplication with existing `ugc_content` | Small | Shared with other UGC capture paths |
| Monitoring/alerting (poll failures, rate limit warnings) | Small | Temporal observability |

**Overall effort**: Medium. More than the incremental `mentions` webhook addition, primarily due to the brand-facing hashtag configuration UI and the separate App Review process.

---

## 11. Summary: Capability Assessment

| Attribute | Value |
|-----------|-------|
| What it detects | Public feed photos/image carousels with monitored hashtags |
| What it misses | Reels (major gap), Stories, video carousels, private accounts, untagged content |
| UGC coverage estimate | 5–25% of total brand UGC (depends on brand hashtag culture) |
| Real-time? | No — polling latency 2–4 hours recommended |
| Polling fallback for missed posts? | Limited — 24-hour lookback only; missed if poll gap >24 hrs |
| Creator opt-in required | **No** — uses brand's own page token |
| Rate limit impact | Moderate (consumes from 200/hr budget) |
| Binding constraint | 30 unique hashtags per 7-day window (not rate limits) |
| Permissions | `instagram_public_content_access` (separate App Review required) |
| Integration with IG DM infrastructure | **None** — separate polling path; not webhook-based |
| Temporal workflow pattern | Cron workflow (natural fit) |
| Incremental effort (if mentions webhook built) | Medium — new App Review, new Temporal cron workflow, brand config UI |
| Key risk | Reels exclusion is a structural API gap with no workaround |
| Value proposition | Only API method to capture content with branded hashtag but no @mention or photo-tag |

**Bottom line**: Hashtag monitoring fills a specific gap — content that uses branded hashtags without @mentioning or tagging. It is NOT a substitute for `mentions` or `/tags` because it misses entirely different content types. The 30-hashtag budget forces strategic prioritization per brand. The Reels exclusion is a significant coverage gap with no official API workaround, as Reels represent a growing share of Instagram creator content. Best positioned as a supplementary layer (Layer 2) that adds incremental coverage on top of the webhook-based mention detection.

---

## Sources

- [Instagram Graph API: Complete Developer Guide for 2026 — Elfsight](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Instagram Hashtag Limitations (30/week) — Curator Knowledge Base](https://help.curator.io/article/197-instagram-hashtag-source-limitations)
- [Instagram Hashtag Limitation FAQ — Emplifi](https://docs.emplifi.io/platform/latest/home/instagram-hashtag-limitation-faq)
- [How to Use Instagram API to Pull Photos Based on Hashtag — Phyllo](https://www.getphyllo.com/post/how-to-use-instagram-api-to-pull-photos-based-on-hashtag)
- [Developer's Guide to Instagram Public Content Access — InsightIQ](https://www.insightiq.ai/blog/instagram-public-content-access-developers)
- [How to Add More Instagram Hashtags When Quota Reached — Sprinklr](https://www.sprinklr.com/help/articles/best-practices/how-to-add-more-instagram-hashtags-when-your-quota-has-reached-its-limit/63f79d12e02459133724af45)
- [FAQ: What are the Limits of Instagram Hashtag Search — Nosto Help Center](https://help.nosto.com/en/articles/8896595-faq-what-are-the-limits-of-instagram-hashtag-search-terms)
- [Instagram APIs for Custom Monitoring — DataStreamer](https://datastreamer.io/instagram-data-guide-official-vs-alternative-api-vs-scraping/)
- [Optimize Instagram Hashtags with GPT-4o & Graph API — n8n Workflow Template](https://n8n.io/workflows/11994-optimize-instagram-hashtags-with-gpt-4o-and-real-engagement-data-via-graph-api/)
- [Instagram Instagram Limitations — Spotlight WP](https://docs.spotlightwp.com/article/623-instagram-limitations-for-hashtag-feeds)
- Prior aspect analyses: `analysis/graph-api-mentions-tags.md`, `analysis/webhooks-mentions.md`
