# Apify TikTok Actors — Third-Party Scraping Catalog

## Summary

Apify is the most mature third-party TikTok data access layer available, with 15+ TikTok-specific actors from two dominant publishers (clockworks, apidojo) plus specialized actors from others. **Critically, Cheerful already uses Apify for Instagram and YouTube**, so the integration infrastructure (SDK, error handling, Temporal activity pattern, service class) exists and is battle-tested — TikTok is a drop-in extension.

**Key advantage over official TikTok APIs**: Apify actors require zero OAuth per creator, no app review, no academic eligibility, and can access any public creator's data. This makes them the practical workaround for the Display API's fundamental limitation (own-authorized-users only) and the Research API's commercial prohibition.

---

## Cheerful Existing Apify Infrastructure

Before the actor catalog, understand what already exists in Cheerful to avoid re-inventing it:

### Core Pattern (`apps/backend/src/services/external/apify.py`)

```python
# Initialization
self.client = ApifyClient(token=api_token)
result = self.client.actor(actor_id).call(run_input={...})
dataset = self.client.dataset(result["defaultDatasetId"]).list_items()
```

### Error Classification (`apify.py` lines 146–212)
- `429 / rate_limit_reached` → `ApplicationError(non_retryable=False)` (retried by Temporal)
- `401/403 / auth` → `ApplicationError(non_retryable=True, error_type=ErrorTypes.AUTH)`
- `404 / invalid_input` → `ApplicationError(non_retryable=True, error_type=ErrorTypes.NOT_FOUND)`
- Unknown → `ApplicationError(non_retryable=False)` (safe default)

### Configuration (`core/config/definition.py` lines 77–89)
```python
APIFY_API_TOKEN: str | None = None
APIFY_LOOKALIKE_ACTOR_ID: str | None = None  # Instagram
APIFY_YOUTUBE_CHANNEL_SCRAPER_ACTOR_ID: str | None = None
APIFY_YOUTUBE_CHANNEL_FINDER_ACTOR_ID: str | None = None
APIFY_YOUTUBE_EMAIL_ACTOR_ID: str | None = "endspec/youtube-instant-email-scraper"
APIFY_YOUTUBE_APIDOJO_FINDER_ACTOR_ID: str | None = "apidojo/youtube-channel-information-scraper"
```

**For TikTok**: Add actor IDs to config, create `TikTokApifyService` parallel to `YouTubeApifyService`, wire up Temporal activities. The SDK call pattern is identical.

### Temporal Usage Pattern
- Activities call `get_apify_service()` or equivalent factory
- Activity wraps SDK call and maps raw dict to typed Pydantic model
- Retry policy inherits from `non_retryable` classification
- See `temporal/activity/generate_lookalikes_activity.py` and `campaign_discovery_activity.py`

---

## Actor Catalog

### Publisher: Clockworks

The dominant TikTok scraper developer on Apify. Maintains a suite of 12+ specialized actors, all actively maintained since 2022.

---

#### `clockworks/tiktok-scraper`
**URL**: https://apify.com/clockworks/tiktok-scraper
**Purpose**: General-purpose — scrapes TikTok profiles, videos, and hashtags from URLs
**Pricing**: Pay-per-result (PPR) — approximately $5/1,000 items ($0.005/item)
**Auth required**: None (no TikTok account needed)

**Input**:
```json
{
  "startUrls": [{"url": "https://www.tiktok.com/@username"}],
  "maxItems": 100,
  "resultsType": "videos"
}
```

**Output fields** (per item):
- `text` — video caption
- `name`, `nickname` — creator display name and handle
- `signature` — creator bio
- `avatar` — profile image URL
- `followingCount`, `fans` — follower/following counts
- `hearts` — total likes across all videos
- `video` — video metadata object (URLs, dimensions, duration)
- `music` — music metadata (title, artist, ID, URL)
- `hashtags` — array of hashtag strings
- `shareCount`, `commentCount`, `playCount`, `diggCount` — engagement metrics
- `createTime` — timestamp

**Use cases for Cheerful**: Creator enrichment, post history, quick content lookups

---

#### `clockworks/tiktok-profile-scraper`
**URL**: https://apify.com/clockworks/tiktok-profile-scraper
**Purpose**: Profile-focused scraper — extracts profile data + all posted videos
**Pricing**: $0.30/1,000 posts (PPR)
**Performance**: ~425 posts/sec, 98% success rate
**Auth required**: None

**Input**:
```json
{
  "profiles": ["@username"],
  "resultsPerPage": 100,
  "shouldDownloadVideos": false
}
```

**Output fields** (40+ fields):

*Profile level*:
- `id`, `username`, `nickname`, `signature` (bio)
- `avatarLarger`, `avatarMedium`, `avatarThumb`
- `followingCount`, `followerCount`, `heartCount`, `videoCount`
- `isVerified`, `privateAccount`
- `bioLink` — linked URL in profile
- `region` — creator's country
- `diggCount` — total likes given by creator

*Video level* (per post):
- `id`, `text` (caption), `createTime`
- `duration`, `height`, `width`
- `playCount`, `diggCount`, `commentCount`, `shareCount`, `collectCount`
- `videoUrl`, `coverUrl`, `originCoverUrl`
- `hashtags[]` — array of hashtag objects with `{id, name}`
- `mentions[]` — @mentioned accounts
- `music` — `{id, title, authorName, original, album, coverLarge, playUrl, duration}`
- `effectStickers[]` — AR effects used
- `isAd` — paid content flag

**Use cases for Cheerful**: PRIMARY creator discovery and enrichment actor — gives full profile + recent posts in one call

---

#### `clockworks/free-tiktok-scraper` (TikTok Data Extractor)
**URL**: https://apify.com/clockworks/free-tiktok-scraper
**Purpose**: Flexible scraper from URLs or search queries; videos, hashtags, and users
**Pricing**: PPR — $0.005/item ($5/1,000); Apify free plan includes $5/month credits = 1,000 free items/month
**Auth required**: None

Most versatile clockworks actor. Accepts hashtag URLs, profile URLs, video URLs, or search terms. Output schema matches the main TikTok Scraper above.

---

#### `clockworks/tiktok-trends-scraper`
**URL**: https://apify.com/clockworks/tiktok-trends-scraper
**Purpose**: Scrapes TikTok Trend Discovery — trending hashtags, songs, creators, videos by country
**Pricing**: PPR ~$0.005/item; free plan = ~800 results/month; Starter = ~20,000/month
**Auth required**: None

**Input filters**:
```json
{
  "region": "US",
  "timeRange": "7",
  "industry": "beauty",
  "maxItems": 100,
  "trendTypes": ["hashtags", "songs", "creators", "videos"]
}
```

**Output fields**:

*Hashtag trends*:
- `hashtag`, `viewCount`, `videoCount`, `trend` (rank change)
- `related` — related hashtag suggestions

*Creator trends*:
- `username`, `nickname`, `followerCount`, `engagementRate`
- `region`, `followerRange`
- Sortable by: followers, engagement rate, popularity

*Sound/song trends*:
- `title`, `artist`, `duration`, `usageCount`
- `businessUseApproved` — cleared for commercial use

*Video trends*:
- Standard video fields + trend rank

**Use cases for Cheerful**: Hashtag intelligence for brief creation, trending sound identification, discovering rising creators by niche

---

#### `clockworks/tiktok-hashtag-scraper`
**URL**: https://apify.com/clockworks/tiktok-hashtag-scraper
**Purpose**: Extract all videos tagged with specific hashtags
**Pricing**: PPR — $0.005/item

**Output fields** (per video):
- `caption`, `videoUrl`, `plays`, `hearts`, `comments`, `shares`
- `country` — country of creation
- `timestamp`, `isAd`
- `music` — metadata block
- `hashtags[]`, `mentions[]`

**Use cases for Cheerful**: Hashtag-based creator discovery (who posts with #brand, who dominates a niche hashtag)

---

#### `clockworks/tiktok-video-scraper`
**URL**: https://apify.com/clockworks/tiktok-video-scraper
**Purpose**: Individual video data from video URLs
**Pricing**: PPR — $0.005/item

**Output fields** (extends hashtag scraper):
- All standard video fields
- Creator profile snapshot: `name`, `id`, `avatar`, `bio`, `accountStatus`, `followerCount`, `followingCount`, `totalLikes`
- `isAd`, `effectStickers[]`, `subtitles`

**Use cases for Cheerful**: Content tracking — given a TikTok URL from creator, fetch current engagement metrics

---

#### `clockworks/tiktok-followers-scraper`
**URL**: https://apify.com/clockworks/tiktok-followers-scraper
**Purpose**: Extract follower and following lists for a username
**Pricing**: PPR

**Input**:
```json
{
  "username": "@brand",
  "maxFollowers": 10000,
  "maxFollowing": 1000
}
```

**Output**: Array of user objects with `username`, `nickname`, `followersCount`, `isVerified`, `avatarUrl`

**Use cases for Cheerful**: Audience overlap analysis (who follows the brand's TikTok account), competitive creator intelligence (who is a competitor following)

---

#### `clockworks/tiktok-comments-scraper`
**URL**: https://apify.com/clockworks/tiktok-comments-scraper
**Purpose**: Scrape comments from TikTok videos
**Pricing**: PPR — $0.005/item

**Output fields** (per comment):
- `text` — comment content
- `userId`, `username`, `nickname`
- `timestamp`
- `likesCount`, `replyCount`
- `replies[]` — nested reply objects (same schema)

**Use cases for Cheerful**: Sentiment analysis on creator content, brand mention detection in comments, campaign effectiveness signals

---

#### `clockworks/tiktok-user-search-scraper`
**URL**: https://apify.com/clockworks/tiktok-user-search-scraper
**Purpose**: Search TikTok's user search for creators matching keywords
**Pricing**: PPR

**Input**:
```json
{
  "searchQuery": "beauty influencer",
  "maxItems": 50
}
```

**Output**: Array of profile objects — same schema as profile scraper

**Use cases for Cheerful**: Keyword-based creator discovery (parallel to Instagram `apify/instagram-scraper` search mode Cheerful already uses)

---

#### `clockworks/tiktok-explore-scraper`
**URL**: https://apify.com/clockworks/tiktok-explore-scraper
**Purpose**: Scrape TikTok Explore categories — trending posts per category
**Pricing**: PPR

**Output**: Posts, authors, videos, music per explore category

**Use cases for Cheerful**: Category/niche trend discovery; identifying who's appearing in Explore for a vertical

---

#### `clockworks/tiktok-discover-scraper`
**URL**: https://apify.com/clockworks/tiktok-discover-scraper
**Purpose**: Hashtag-seeded discovery — related videos, similar trends, subtopics
**Pricing**: PPR

**Input**: Hashtag seeds → expands to related video landscape
**Output**: Standard video fields + `relatedHashtags[]`, `subTopics[]`, `breadcrumbs[]`

**Use cases for Cheerful**: Niche expansion — given a target hashtag, find adjacent creator communities

---

#### `clockworks/tiktok-ads-scraper` (TikTok Hashtag Analytics)
**URL**: https://apify.com/clockworks/tiktok-ads-scraper
**Purpose**: Hashtag-level audience analytics — demographics, interests, ad performance data
**Pricing**: PPR

**Output fields** (unique to this actor):
- Video data + related video URLs + total view counts
- **Audience ages** — age bracket distribution for hashtag audience
- **Audience interests** — interest category breakdown
- **Audience countries** — geographic distribution
- **Country-specific data** — per-country metrics
- **Industry classification** — TikTok's industry/niche taxonomy
- **Ad longevity** — how long ads run in this niche
- **Trend longevity** — hashtag lifecycle data

**Use cases for Cheerful**: This is the closest Apify gets to audience demographic data. Useful for identifying whether a hashtag reaches Cheerful clients' target demographics before creating campaigns. NOT creator-level demographics (which require TCM or TikTok One).

---

### Publisher: Apidojo

Speed-oriented actor suite with enterprise-grade throughput. Api Dojo also publishes the YouTube actor Cheerful already uses (`apidojo/youtube-channel-information-scraper`), so the vendor relationship is established.

---

#### `apidojo/tiktok-scraper`
**URL**: https://apify.com/apidojo/tiktok-scraper
**Purpose**: All-in-one — profiles, hashtags, videos, locations, tags
**Pricing**: PPR — $0.30/1,000 posts
**Auth required**: None

Output fields per video:
- `title`, `timestamp`, `country`
- `playCount`, `likeCount`, `commentCount`, `shareCount`, `bookmarkCount`
- `videoUrl`, `subtitles`
- `author.username`, `author.verified`, `author.followerCount`, `author.bioLink`
- `hashtags[]`, `mentions[]`
- `music` — full audio metadata block

---

#### `apidojo/tiktok-profile-scraper`
**URL**: https://apify.com/apidojo/tiktok-profile-scraper
**Purpose**: Profile data focus — fast, clean output
**Pricing**: $30/100,000 posts ($0.30/1,000)
**Auth required**: None

**Additional fields vs clockworks**:
- `video.url` — direct video download URL in every post
- `hashtags[]` — full array per post
- `music` — full audio block (songId, title, artist, album, duration, coverArtUrl)
- Cover images and thumbnails per post

---

#### `apidojo/tiktok-scraper-api`
**URL**: https://apify.com/apidojo/tiktok-scraper-api
**Purpose**: High-throughput API endpoint — users, hashtags, locations, search
**Pricing**: $0.006/query; first 20 posts per query free
**Performance**: 200 posts/sec, 98% success rate

Best for high-volume batch processing. Supports location filtering and multiple query types in one run.

---

#### `apidojo/tiktok-user-scraper`
**URL**: https://apify.com/apidojo/tiktok-user-scraper
**Purpose**: User-focused — bios, followers, engagement, following networks
**Pricing**: PPR
**Performance**: 98% success rate, 50K+ historical runs

**Additional capabilities**:
- Follower/following list extraction
- Batch profile processing (multiple usernames per run)
- Dual input: profile URLs or video URLs (extracts creator from video)

**Use cases for Cheerful**: Bulk creator enrichment — submit a list of TikTok handles, receive enriched profiles

---

#### `apidojo/tiktok-location-scraper`
**URL**: https://apify.com/apidojo/tiktok-location-scraper
**Purpose**: Location-tagged video scraping
**Pricing**: PPR

**Use cases for Cheerful**: Location-based creator discovery (find creators posting from specific city/venue)

---

### Publisher: Novi

---

#### `novi/tiktok-shop-scraper`
**URL**: https://apify.com/novi/tiktok-shop-scraper
**Purpose**: TikTok Shop product intelligence — prices, sellers, ratings, GMV, viral trends
**Pricing**: PPR

**Output fields**:
- Product titles, prices, seller names, seller ratings
- Product descriptions, media URLs
- Price history (tracks changes over time)
- Variant data (colors, sizes, SKUs)
- Stock levels (where available)
- **GMV data** — gross merchandise value for trending products
- **Sales data** — units sold, engagement per product
- **Creator counts** — how many creators promote each product
- Viral/trending product detection with momentum signals

**Use cases for Cheerful**: Affiliate campaign product intelligence — identify which Shop products are going viral before approaching creators, benchmark affiliate revenue potential

---

#### `novi/tiktok-scraper-ultimate`
**URL**: https://apify.com/novi/tiktok-scraper-ultimate
**Purpose**: Pay-per-event video data extraction — videos from URLs, profiles, or keyword search
**Pricing**: Pay-per-event (PPE model — charges per actor event fired, not per result)
**Auth required**: None

**Use cases for Cheerful**: Alternative to clockworks/tiktok-scraper when keyword search input mode is needed

---

## Pricing Summary

| Actor | Model | Rate | Notes |
|-------|-------|------|-------|
| clockworks suite (most actors) | PPR | $5/1,000 items ($0.005/item) | Free plan: 1,000 items/month |
| clockworks/tiktok-profile-scraper | PPR | $0.30/1,000 posts | $0.0003/post |
| apidojo/tiktok-profile-scraper | PPR | $0.30/1,000 posts | = clockworks profile |
| apidojo/tiktok-scraper-api | Per query | $0.006/query (20 posts free) | Best for high-volume |
| Apify free plan | Monthly credit | $5/month | ~1,000 items/month |
| Apify Starter plan | Monthly credit | ~$49/month | ~20,000 items/month |

---

## Data Fields Comparison Matrix

| Field | Profile Scraper | Video Scraper | Trends | Hashtag Analytics |
|-------|----------------|---------------|--------|-------------------|
| Creator username | ✅ | ✅ | ✅ | ✅ |
| Follower count | ✅ | ✅ | ✅ | ✅ |
| Following count | ✅ | ✅ | — | — |
| Bio / signature | ✅ | ✅ | — | — |
| Bio link URL | ✅ | ✅ | — | — |
| Verified status | ✅ | ✅ | ✅ | — |
| Region/country | ✅ | ✅ | ✅ | ✅ |
| Total hearts/likes | ✅ | ✅ | — | — |
| Video count | ✅ | — | — | — |
| Video caption | ✅ | ✅ | ✅ | ✅ |
| Play count | ✅ | ✅ | ✅ | ✅ |
| Like count | ✅ | ✅ | ✅ | ✅ |
| Comment count | ✅ | ✅ | ✅ | ✅ |
| Share count | ✅ | ✅ | ✅ | ✅ |
| Save/bookmark count | — | — | — | — |
| Video URL | ✅ | ✅ | — | — |
| Cover/thumbnail URL | ✅ | ✅ | — | — |
| Hashtags used | ✅ | ✅ | ✅ | ✅ |
| Music metadata | ✅ | ✅ | ✅ | — |
| isAd flag | ✅ | ✅ | — | ✅ |
| Audience age buckets | ❌ | ❌ | — | ✅ |
| Audience interests | ❌ | ❌ | — | ✅ |
| Audience countries | ❌ | ❌ | — | ✅ |
| Creator-level demographics | ❌ | ❌ | ❌ | ❌ |
| Email address | ❌ | ❌ | ❌ | ❌ |

**Note**: Creator-level audience demographics (age/gender/location breakdown per creator's audience) are NOT available from any Apify actor. This data is only accessible via TikTok Creator Marketplace (TCM) / TikTok One, which exposes it through their official collaboration flow.

---

## TOS and Legal Considerations

- All clockworks and apidojo actors extract **publicly visible data only** — equivalent to what an anonymous visitor sees
- No private data extracted: email addresses, phone numbers, private account content, DMs
- Apify's position: scraping publicly available data is legal in most jurisdictions
- **GDPR/CCPA**: Personal data (usernames, profile photos, public posts) scraped from EU users still falls under GDPR if stored — requires data minimization and retention policies
- TikTok's ToS prohibits scraping without written consent (standard for all social platforms)
- **Risk level**: MEDIUM — TikTok has pursued legal action against scrapers (Bright Data litigation), but Apify's proxy infrastructure substantially reduces IP-level blocking; no known actions specifically against Apify TikTok actors
- **Commercial use**: Apify charges for usage, making commercial use legally cleaner than running raw scrapers; Apify absorbs proxy and anti-bot costs
- **Recommendation**: Acceptable for Cheerful's use case (creator discovery/enrichment for influencer marketing); ensure data is used transiently, not as a persistent surveillance database on creators

---

## Cheerful Integration Applicability

### Highest Value Actors

**1. `clockworks/tiktok-profile-scraper`** — PRIMARY creator enrichment
- Drop-in equivalent of `apify/instagram-profile-scraper` already used in Cheerful
- Submit `@username` → receive profile + recent post metrics
- Same service pattern as `fetch_instagram_posts()` in `post_tracking/apify_posts.py`
- Cost: $0.0003/post (negligible)

**2. `clockworks/tiktok-user-search-scraper`** — Creator discovery by keyword
- Direct equivalent of Cheerful's `search_creators_by_keyword()` on Instagram
- Input: keyword → output: matching creator profiles
- Already-built pattern in `apify.py` lines 217–333 (just swap actor ID + field names)

**3. `clockworks/tiktok-video-scraper`** — Content tracking
- Given a TikTok video URL, fetch current engagement metrics
- Use for campaign performance tracking: poll on schedule (Temporal cron activity)
- Output maps to `creator_post` table fields

**4. `clockworks/tiktok-trends-scraper`** — Brief intelligence
- Identify trending hashtags and sounds in a vertical before creating campaign briefs
- Filter by region + industry — aligns with Cheerful client targeting

**5. `clockworks/tiktok-user-search-scraper` + `apidojo/tiktok-user-scraper`** — Lookalike discovery
- Keyword-seeded discovery pipeline mirrors existing YouTube `find_similar_channels()` pattern
- LLM extracts keywords from seed creator → user search → ranked results

### Service Class Design

```python
# New service: apps/backend/src/services/external/tiktok_apify.py
class TikTokApifyService:
    def __init__(self, api_token: str, profile_actor_id: str, search_actor_id: str, ...):
        self.client = ApifyClient(token=api_token)
        # mirrors ApifyService and YouTubeApifyService structure

    def get_creator_profile(self, username: str) -> TikTokCreatorProfile:
        # clockworks/tiktok-profile-scraper
        ...

    def search_creators_by_keyword(self, keyword: str, max_results: int) -> list[TikTokCreatorProfile]:
        # clockworks/tiktok-user-search-scraper
        ...

    def get_video_metrics(self, video_url: str) -> TikTokVideoMetrics:
        # clockworks/tiktok-video-scraper
        ...

    def get_trending_data(self, region: str, industry: str) -> TikTokTrends:
        # clockworks/tiktok-trends-scraper
        ...
```

### Config Additions Needed

```python
# core/config/definition.py additions
APIFY_TIKTOK_PROFILE_ACTOR_ID: str | None = "clockworks/tiktok-profile-scraper"
APIFY_TIKTOK_SEARCH_ACTOR_ID: str | None = "clockworks/tiktok-user-search-scraper"
APIFY_TIKTOK_VIDEO_ACTOR_ID: str | None = "clockworks/tiktok-video-scraper"
APIFY_TIKTOK_TRENDS_ACTOR_ID: str | None = "clockworks/tiktok-trends-scraper"
APIFY_TIKTOK_HASHTAG_ACTOR_ID: str | None = "clockworks/tiktok-hashtag-scraper"
```

### Workflow Integration Points

| Cheerful Workflow | Actor | Temporal Activity |
|------------------|-------|-------------------|
| Creator discovery (search) | `tiktok-user-search-scraper` | `TikTokDiscoveryActivity` |
| Creator enrichment | `tiktok-profile-scraper` | `TikTokEnrichmentActivity` |
| Post metrics tracking | `tiktok-video-scraper` | `TikTokPostTrackingActivity` |
| Campaign brief creation | `tiktok-trends-scraper` | `TikTokTrendIntelActivity` |
| Hashtag analysis | `tiktok-hashtag-scraper` | `TikTokHashtagActivity` |

---

## What Apify Cannot Provide

- Creator audience demographics (age/gender/location breakdown) — requires TCM/TikTok One
- Email addresses or direct contact info — not publicly on TikTok profiles
- DM capability — no actor sends messages
- Real-time live stream data — static scraping only
- TikTok Shop GMV per creator — `novi/tiktok-shop-scraper` only has product-level GMV
- Watch time / completion rate — TikTok does not expose these publicly
- Revenue data

---

## Recommended Actor Selection for Cheerful

| Use Case | Recommended Actor | Reasoning |
|----------|------------------|-----------|
| Creator profile lookup | `clockworks/tiktok-profile-scraper` | Most complete output, proven reliability |
| Keyword creator search | `clockworks/tiktok-user-search-scraper` | Mirrors existing Instagram search pattern |
| Video metrics polling | `clockworks/tiktok-video-scraper` | URL-based, minimal input |
| Trend intelligence | `clockworks/tiktok-trends-scraper` | Regional + industry filters |
| Hashtag content mining | `clockworks/tiktok-hashtag-scraper` | Cost-efficient for bulk hashtag scraping |
| High-volume enrichment | `apidojo/tiktok-user-scraper` | Batch mode, 98% success at scale |
| Comment analysis | `clockworks/tiktok-comments-scraper` | Only actor with nested replies |
