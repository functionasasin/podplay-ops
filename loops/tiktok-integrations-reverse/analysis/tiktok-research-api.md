# TikTok Research API — Analysis

## Overview

The TikTok Research API is an officially supported, **free** data access mechanism for qualified researchers to query public TikTok content at scale. It is **not a commercial API** — designed for academic research and DSA-mandated data transparency. Unlike the Display API (own user's data only), the Research API provides access to any public creator's content and metrics.

**Base URL:** `https://open.tiktokapis.com/v2/research/`

**Status:** Generally available (US since ~2021, EU/EEA/UK/CH since mid-2023, DSA-driven)

---

## Access Tiers

### 1. Academic API (Primary Track)

**Target:** University/academic institution researchers
**Geography:** US, EU, EEA, UK, Switzerland only
**Access model:** Direct REST API (self-service after approval)

**Eligibility requirements:**
- Non-profit university/academic affiliation
- Non-commercial, public-interest research purpose
- No conflicts of interest with commercial entities
- PhD candidates need faculty advisor endorsement
- IRB or equivalent ethics approval
- Detailed research proposal with methodology

**Application process:**
- Submit via TikTok for Developers portal (institutional email required)
- ~4 week review timeline
- Up to 9 collaborators from same institution; separate applications for cross-institution teams
- Uses client credentials OAuth (no per-user auth needed)

### 2. Virtual Compute Environment / VCE (Non-Academic Track)

**Target:** Not-for-profit civil society orgs, journalism research bodies, policy institutes
**Access model:** Sandboxed compute environment — NOT direct API access

| Stage | Description | Quota |
|-------|-------------|-------|
| Test Stage | Random sample data; accounts 25,000+ followers only | 5,000 records/day |
| Execution Stage | Submit script; TikTok runs + manually reviews output | Up to 100,000 records/run |

**Critical limitation:** TikTok manually reviews every script and aggregated output before releasing to researcher. Individual-level data is never exported. This gives TikTok editorial oversight — controversial under DSA compliance reviews.

### 3. Commercial Access

**Not supported.** There is no commercial/paid tier of the Research API. This is explicitly for research use only.

---

## Authentication

**Flow:** OAuth 2.0 Client Credentials (no user authorization required)

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=YOUR_CLIENT_KEY&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials
```

**Token response:**
```json
{
  "access_token": "clt.example12345Example12345Example",
  "expires_in": 7200,
  "token_type": "Bearer"
}
```

**Token type:** `clt.` prefix (client-level, same as seen in Login Kit analysis)
**Token lifetime:** 2 hours — must regenerate on expiry
**Required scope:** `research.data.basic` (granted upon application approval)

**All endpoints use:**
```
Authorization: Bearer clt.example12345Example12345Example
Content-Type: application/json
```

---

## Endpoints

### 1. Video Query

**`POST https://open.tiktokapis.com/v2/research/video/query/`**

The core endpoint — search public videos with rich filtering.

**URL params:** `fields` (comma-separated), optionally `search_id` (resume paginated search)

**Request body:**

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `query` | object | Yes | At least one of `and`, `or`, `not` |
| `start_date` | string | Yes | `YYYYMMDD` format (UTC) |
| `end_date` | string | Yes | Max 30 days after `start_date` |
| `max_count` | int64 | No | Default 20, Max 100 |
| `cursor` | int64 | No | Pagination cursor |
| `is_random` | bool | No | Randomize result order |

**Searchable fields and operators:**

| Field | Operators | Value Format |
|-------|-----------|--------------|
| `create_date` | EQ, IN, GT, GTE, LT, LTE | `YYYYMMDD` |
| `username` | EQ, IN | string |
| `region_code` | EQ, IN | ISO 3166-1 alpha-2 |
| `video_id` | EQ, IN | int64 string |
| `hashtag_name` | EQ, IN | string |
| `keyword` | EQ | string (caption search) |
| `music_id` | EQ, IN | string |
| `effect_id` | EQ, IN | string |
| `video_length` | EQ, IN | `SHORT`, `MID`, `LONG`, `EXTRA_LONG` |
| `view_count` | GT, GTE, LT, LTE | integer |
| `comment_count` | GT, GTE, LT, LTE | integer |

**Example — find US cooking videos with 100k+ views:**
```json
{
  "query": {
    "and": [
      { "operation": "IN", "field_name": "region_code", "field_values": ["US"] },
      { "operation": "IN", "field_name": "hashtag_name", "field_values": ["cooking", "recipe"] },
      { "operation": "GTE", "field_name": "view_count", "field_values": ["100000"] }
    ]
  },
  "start_date": "20250101",
  "end_date": "20250131",
  "max_count": 100
}
```

**Returnable video fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | int64 | Unique video ID |
| `video_description` | string | Caption text |
| `create_time` | int64 | Unix epoch (seconds, UTC) |
| `region_code` | string | Creator's account region |
| `view_count` | int64 | Total views |
| `like_count` | int64 | Total likes |
| `comment_count` | int64 | Total comments |
| `share_count` | int64 | Total shares |
| `favorites_count` | int64 | Save/bookmark count |
| `music_id` | int64 | Associated audio ID |
| `hashtag_names` | array[string] | Hashtags used |
| `hashtag_info_list` | array[object] | Hashtag IDs + descriptions |
| `effect_ids` | array[string] | Applied effect IDs |
| `effect_info_list` | array[object] | Effect details |
| `sticker_info_list` | array[object] | Sticker metadata |
| `username` | string | Creator's @handle |
| `video_duration` | int64 | Duration in seconds |
| `playlist_id` | int64 | Playlist association |
| `voice_to_text` | string | Auto-transcription (~20% populated) |
| `is_stem_verified` | bool | Science/tech verified content |
| `video_mention_list` | array | @mentions in caption |
| `video_label` | string | Platform labels (e.g., "election label") |
| `video_tag` | array | Content category tags |

**Pagination:** First call omits `search_id`/`cursor`. Response returns both; use for subsequent pages. `has_more` boolean indicates more pages.

**Response structure:**
```json
{
  "data": {
    "videos": [...],
    "cursor": 100,
    "has_more": true,
    "search_id": "7123456789012345678"
  },
  "error": { "code": "ok", "message": "", "log_id": "..." }
}
```

---

### 2. User Info

**`POST https://open.tiktokapis.com/v2/research/user/info/`**

Lookup any public TikTok creator's profile data (users aged 18+ with public accounts).

**Request body:**
```json
{ "username": "targetcreator" }
```

**URL param:** `fields` (comma-separated)

**Available fields:**

| Field | Type | Description |
|-------|------|-------------|
| `display_name` | string | Profile display name |
| `bio_description` | string | Bio text |
| `avatar_url` | string | Profile picture URL |
| `is_verified` | bool | Blue checkmark status |
| `follower_count` | integer | Follower count |
| `following_count` | integer | Following count |
| `likes_count` | integer | Total accumulated likes |
| `video_count` | integer | Number of public videos |
| `bio_url` | string | Website link from bio |

**Key limitation:** No audience demographics, no earnings/revenue data, no contact info.

---

### 3. Video Comments

**`POST https://open.tiktokapis.com/v2/research/video/comment/list/`**

Retrieve comments on any public video.

**Request body:**

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `video_id` | int64 | Yes | Target video ID |
| `max_count` | int64 | No | Default 10, Max 100 |
| `cursor` | int64 | No | Pagination |

**Available fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Comment ID |
| `text` | string | Comment text (PII auto-redacted) |
| `video_id` | int | Parent video ID |
| `create_time` | int | Unix timestamp |
| `like_count` | int | Comment likes |
| `reply_count` | int | Number of replies |
| `parent_comment_id` | int | Set if this is a reply |

**Data privacy note:** PII (phone numbers, emails, credit card numbers) in comment text is automatically redacted with masking before being returned.

---

### 4. User Liked Videos

**`GET https://open.tiktokapis.com/v2/research/user/liked_videos/`**
Scope: `tt_user_liked_videos_api`

Returns metadata for videos a public user has liked. Only works if user has enabled public liked videos (disabled by default for most accounts). Limited practical utility.

---

### 5. User Reposted Videos

**`GET https://open.tiktokapis.com/v2/research/user/reposted_videos/`**
Scope: `tt_user_reposted_api`

Returns videos a user has reposted.

---

### 6. User Pinned Videos

**`GET https://open.tiktokapis.com/v2/research/user/pinned_videos/`**
Scope: `tt_user_pinned_videos_api`

Returns videos pinned to a user's profile.

---

### 7. User Followers

**`GET https://open.tiktokapis.com/v2/research/user/followers/`**
Scope: `tt_get_follower`

Returns list of a user's followers. Separate (larger) daily quota (see Rate Limits).

---

### 8. User Following

**`GET https://open.tiktokapis.com/v2/research/user/following/`**
Scope: `tt_get_following`

Returns list of accounts a user follows. Same follower/following quota pool.

---

## Rate Limits and Quotas

### Standard Academic Research API

| Dimension | Limit |
|-----------|-------|
| Daily requests (all endpoints combined) | 1,000 requests/day |
| Records per request (Video/Comments) | 100 |
| Maximum records/day (Video + Comments) | 100,000 records/day |
| Daily reset | 12:00 AM UTC |
| Rate limit response | HTTP 429, error code `rate_limit_exceeded` |

### Followers/Following Endpoints (Separate Pool)

| Dimension | Limit |
|-----------|-------|
| Daily calls | 20,000 |
| Records per call | 100 |
| Maximum records/day | 2,000,000 |

### Quota Increases

Email `Research-API@tiktok.com` with justification. TikTok states it "cannot grant exceptions" but collects feedback. Quota is at TikTok's sole discretion and can be adjusted, suspended, or revoked at any time.

---

## Data Scope and Historical Depth

**Who is in scope:**
- Public accounts aged 18+
- Content from US, Europe, Rest of World (Canada explicitly excluded in docs)
- Accounts that have not been suspended or made private

**Historical depth:**
- Theoretically queryable back to approximately 2018 (TikTok US launch)
- Official examples include dates as early as `20181207`
- Data quality degrades significantly for older records
- Known data quality bug: all data before July 2024 had systematically underreported engagement metrics (discovered by academic auditors, repaired by TikTok in July 2024)

**Per-query date window:** Maximum 30 days. Longer time ranges require multiple sequential queries.

**Data freshness lag:**
- New videos: up to 48 hours to appear in search index
- Engagement metrics: up to 10 days lag vs. live in-app counts (API counts consistently lower for recent content)
- `voice_to_text` field only populated for ~20% of videos

---

## Pricing

**Free.** No cost to apply or use once approved. No tiered paid plans.

This is a significant contrast to X/Twitter's academic API, which costs up to $5,000/month.

---

## Regional Availability

| Dimension | Status |
|-----------|--------|
| Researcher location eligibility | US, EU, EEA, UK, Switzerland only |
| Content data returned | Global (US + Europe + Rest of World) |
| Canada researcher exclusion | Excluded |
| EU expansion date | Mid-2023 (DSA Article 40 compliance) |

---

## Terms of Service — Key Restrictions

**Permitted:**
- Research on approved topics only
- Open-access publication of findings

**Prohibited:**
- Building individual user profiles
- Combining Research Data with other individual-level data
- Any commercial use (including enriching commercial products)
- Sharing data with unauthorized third parties
- Circumventing rate limits or security features

**Data retention:**
- Must refresh data at least every 30 days
- Deleted/unavailable content must be removed from researcher datasets

**Publication requirements:**
- Open-access publication required
- Must provide TikTok 7-day advance notice before publication
- Attribution to TikTok mandatory
- TikTok receives free access to all resulting outputs

**Audit rights:** TikTok may audit at any time without notice.

---

## Known Issues and Criticisms

**Data quality:**
- 2024 academic audit (*Information, Communication & Society*) documented systematic metric discrepancies for pre-July 2024 content
- Engagement metrics consistently underreported due to archiving delays (stated 10 days, observed longer)
- API returns fewer results than requested for older date ranges without explanation

**DSA compliance controversy:**
- European Commission has preliminarily found TikTok in breach of DSA Article 40 obligations
- VCE characterized by critics as "nominal data access" — TikTok's manual review of all outputs effectively gives editorial oversight over research results
- 2024 European Parliament election researchers particularly impacted by API bug

**Coverage limitations:**
- No firehose access — must know what to search for
- Cannot verify if a hashtag query captured ALL relevant content on a topic
- `voice_to_text` only ~20% populated

---

## Official Tooling

| Tool | Location |
|------|----------|
| Official wrapper (R + Python) | `github.com/tiktok/tiktok-research-api-wrapper` |
| `ResearchTikPy` (Python, 3rd party) | `github.com/HohnerJulian/ResearchTikPy` |
| `traktok` (R package, 3rd party) | CRAN / `jbgruber.github.io/traktok` |
| PyPI package | `TikTokResearchApi` |

---

## Cheerful Applicability Assessment

### Critical Blocker: Commercial Use Prohibition

The Research API **explicitly prohibits commercial use**. Cheerful is a commercial product. This means:

- **Cheerful cannot use the Research API directly** — doing so would violate TOS
- This restriction applies regardless of how "research-like" Cheerful's use case appears
- TikTok conducts audits and can revoke access

### What It Can Provide (Academic Partner Route)

If Cheerful partnered with an academic institution conducting influencer research:

| Use Case | Feasibility | Notes |
|----------|-------------|-------|
| Creator discovery by hashtag | High (research only) | Video query by hashtag + username lookup |
| Creator profile enrichment | High (research only) | User Info endpoint covers key fields |
| Content tracking by video ID | High (research only) | Video query by `video_id` |
| Audience overlap (follower data) | Medium (research only) | User Followers endpoint at 2M records/day |
| Comment sentiment analysis | High (research only) | Video Comments endpoint |

### Indirect Commercial Application

The Research API is valuable as a **benchmarking and intelligence source** for understanding the ecosystem, but not for production Cheerful workflows. Third-party data providers (Modash, HypeAuditor, etc.) who have Research API access may package this data commercially — those providers are covered in Wave 2 analysis.

### Key Differentiators vs. Display API

| Dimension | Display API | Research API |
|-----------|-------------|--------------|
| Creator coverage | Own authorized users only | Any public creator |
| Auth requirement | User-level OAuth per creator | Client credentials only |
| Creator discovery | Impossible | Possible (by hashtag, keyword, region) |
| Data scope | Profile + own videos + metrics | Same + comments + followers/following |
| Commercial use | Yes (with TOS compliance) | No |
| Access requirements | App review (3-4 days) | Academic institution (~4 weeks) |

### Recommendation for Cheerful

The Research API is **not a viable direct integration path** for Cheerful due to the commercial use prohibition. However:

1. Use it for **internal R&D and benchmarking** if Cheerful can partner with an academic institution
2. Evaluate **third-party data providers** (Wave 2 analysis) who aggregate Research API data and sell it commercially
3. The Apify TikTok scrapers (Wave 2) are the practical alternative for creator discovery at scale

---

## Summary Capability Map

| Capability | Available | Auth | Quota |
|------------|-----------|------|-------|
| Search creators by hashtag | Yes | Client creds | 100K records/day |
| Search creators by region | Yes | Client creds | 100K records/day |
| Search creators by keyword (caption) | Yes | Client creds | 100K records/day |
| Get creator profile (followers, bio, verified) | Yes | Client creds | 1K req/day |
| Get video metrics (views, likes, shares) | Yes | Client creds | 100K records/day |
| Get video comments | Yes | Client creds | 100K records/day |
| Get follower lists | Yes | Client creds | 2M records/day |
| Historical data (pre-2024) | Degraded quality | Client creds | Same |
| Audience demographics | No | — | — |
| Creator contact info | No | — | — |
| Commercial use | **No** | — | — |
