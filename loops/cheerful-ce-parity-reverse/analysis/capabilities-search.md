# Search and Discovery — Capability Extraction

## Sources Consulted

| Source | File | Notes |
|--------|------|-------|
| Service API routes | `projects/cheerful/apps/backend/src/api/route/service.py` | Ground truth for all `/api/service/` endpoints |
| IC discovery routes | `projects/cheerful/apps/backend/src/api/route/creator_search.py` | JWT-only — CE cannot call without new service routes |
| YouTube discovery | `projects/cheerful/apps/backend/src/api/route/youtube.py` | JWT-only — CE cannot call without new service routes |
| IC API models | `projects/cheerful/apps/backend/src/models/api/influencer_club.py` | Full request/response Pydantic models |
| Service API models | `projects/cheerful/apps/backend/src/models/api/service.py` | ThreadSearchResult, SimilarEmailResult, etc. |
| CE API client | `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/api.py` | How CE calls each endpoint |
| CE Tools | `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/tools.py` | Existing tool implementations |

---

## Existing Context Engine Tools

| Tool | Backend Endpoint | Auth Model | Coverage |
|------|-----------------|------------|----------|
| `cheerful_search_emails` | `GET /api/service/threads/search` | Service API key | Full-text email search within campaign |
| `cheerful_find_similar_emails` | `GET /api/service/rag/similar` | Service API key | Semantic RAG search via pgvector |
| `cheerful_search_campaign_creators` | `GET /api/service/creators/search` | Service API key | Cross-campaign creator search by name/email/handle |

---

## Critical Finding: Auth Model Mismatch for Discovery Tools

**The Influencer Club and YouTube discovery endpoints currently use JWT auth (`get_current_user` dependency), NOT the service API key.** The CE uses `X-Service-Api-Key` authentication for all `/api/service/*` routes. Therefore:

- `POST /creator-search/keyword` — JWT only, CE cannot call
- `POST /creator-search/similar` — JWT only, CE cannot call
- `POST /creator-search/enrich` — JWT only, CE cannot call
- `POST /creator-search/profile` — JWT only, CE cannot call
- `POST /youtube/lookalikes` — JWT only, CE cannot call

**Remediation**: New `/api/service/` route wrappers must be created for each discovery endpoint (accepting `X-Service-Api-Key` instead of JWT) before CE tools can be implemented. The specs should document this as a prerequisite.

---

## Critical Finding: User Scoping Gaps in Existing Service Routes

Several existing `/api/service/` endpoints do NOT validate `user_id`, even though the CE client passes it:

| Endpoint | CE Passes user_id? | Backend Validates user_id? | Notes |
|---------|---------------------|---------------------------|-------|
| `GET /service/campaigns` | Yes | **YES** | Only endpoint with proper user scoping |
| `GET /service/threads/search` | Yes | **NO** | Scoped by campaign_id only |
| `GET /service/threads/{id}` | Yes | **NO** | No campaign_id check either |
| `GET /service/rag/similar` | Yes | **NO** | Scoped by campaign_id only |
| `GET /service/campaigns/{id}/creators` | No | **NO** | Campaign_id implicit scope |
| `GET /service/campaigns/{id}/creators/{id}` | No | **NO** | Campaign_id implicit scope |
| `GET /service/creators/search` | Yes | **NO** | Searches across ALL users' campaigns |

**Implication**: The service API trusts the CE as a trusted internal caller. User scoping is enforced at the CE layer (CE only uses campaign_ids obtained from `list_campaigns?user_id={user_id}`). The `creators/search` endpoint is the most dangerous: it searches across ALL campaigns globally, not filtered to the user's campaigns. This is a security issue that must be documented in specs.

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### A. Influencer Club Creator Discovery (5 new tools, 4 need new service routes)

| # | Action | Current Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-------------------------|--------|----------------|---------|
| 1 | Discover creators by keyword | `POST /creator-search/keyword` | POST (JWT) | keyword, platform, page, followers, engagement_rate, location, gender, profile_language, sort_by, sort_order | CreatorSearchResponse |
| 2 | Find creators similar to a handle | `POST /creator-search/similar` | POST (JWT) | handle, platform, page, followers, engagement_rate, location, gender, profile_language | CreatorSearchResponse |
| 3 | Enrich creator for email + profile | `POST /creator-search/enrich` | POST (JWT) | handle, platform | EnrichedCreatorResponse |
| 4 | Fetch full creator profile (Apify + cache) | `POST /creator-search/profile` | POST (JWT) | handle, platform, refresh | CreatorProfileResponse |
| 5 | Find YouTube lookalike channels | `POST /youtube/lookalikes` | POST (JWT) | channel_url, search_pool_size, region, language | YouTubeLookalikeResponse |

---

## Detailed Capability Specifications

### 1. Full-Text Email Search (EXISTING: `cheerful_search_emails`)

**Backend endpoint**: `GET /api/service/threads/search`

**Request parameters** (verified from service.py line 73-101):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| campaign_id | UUID | yes | — | valid UUID | Scopes search to this campaign |
| query | str | yes | — | non-empty | Searches sender, subject, recipient, body |
| direction | str | no | None | "INBOUND" or "OUTBOUND" | If omitted, searches both directions |
| limit | int | no | 20 | max 50 | Number of results to return |

**Response model** (`ThreadSearchResult` from service.py):
```json
[
  {
    "gmail_thread_id": "string — Gmail thread ID or SMTP message-id header",
    "subject": "string — email subject line",
    "sender_email": "string — sender email address",
    "recipient_emails": ["string — recipient addresses"],
    "direction": "string — INBOUND or OUTBOUND",
    "message_count": "integer — number of messages in thread",
    "latest_date": "datetime — ISO 8601 timestamp of most recent message",
    "matched_snippet": "string — excerpt showing the matched text"
  }
]
```

**Implementation note**: Searches BOTH Gmail threads and SMTP threads. Results are merged and sorted by latest_date descending, then trimmed to limit. Combined search of Gmail + SMTP repos.

**CE client note**: CE client (api.py line 56-76) passes `user_id` as a query param but the service endpoint ignores it. Campaign_id is the only scope.

---

### 2. Semantic Email Search via pgvector (EXISTING: `cheerful_find_similar_emails`)

**Backend endpoint**: `GET /api/service/rag/similar`

**Request parameters** (verified from service.py line 146-201):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| campaign_id | UUID | yes | — | valid UUID | Scopes search to this campaign's examples |
| query | str | no | None | — | Natural language description; mutually exclusive with thread_id but one is required |
| thread_id | str | no | None | — | Find similar to this thread; SMTP threads use `<message-id>` format |
| limit | int | no | 5 | max 10 | Number of similar results |
| min_similarity | float | no | 0.3 | 0.0-1.0 | Minimum cosine similarity threshold |

**Validation**: Either `query` or `thread_id` must be provided. Returns 422 if neither is given.

**Response model** (`SimilarEmailResult` from service.py line 51-61):
```json
[
  {
    "thread_id": "string — Gmail thread ID or SMTP message-id of the similar example",
    "campaign_id": "string — campaign UUID the example belongs to",
    "thread_summary": "string — AI-generated summary of the thread context",
    "inbound_email_text": "string — the inbound email that was replied to",
    "sent_reply_text": "string — the human reply that was sent",
    "sanitized_reply_text": "string | null — redacted version of reply with PII removed",
    "similarity": "float — cosine similarity score (0.0-1.0)"
  }
]
```

**Implementation detail**: When using `thread_id`, the service fetches the last 5 messages of the thread, concatenates their body text (max 4000 chars), and embeds that text. The embedding is then used for pgvector search against `EmailReplyExample` records for the given campaign.

**SMTP thread detection**: Thread IDs starting with `<` and ending with `>` are SMTP message-ids. All other thread IDs are treated as Gmail thread IDs.

---

### 3. Cross-Campaign Creator Search (EXISTING: `cheerful_search_campaign_creators`)

**Backend endpoint**: `GET /api/service/creators/search`

**Request parameters** (verified from service.py line 310-359):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| query | str | yes | — | non-empty | Searches name, email, and social media handles |
| campaign_id | UUID | no | None | valid UUID | Filter to a specific campaign; if omitted, searches ALL campaigns globally |
| limit | int | no | 20 | max 50 | Maximum results |

**Response model** (`ServiceCreatorSearchResponse`):
```json
{
  "results": [
    {
      "id": "string — campaign creator UUID",
      "campaign_id": "string — campaign UUID",
      "campaign_name": "string — campaign name (joined from CampaignRepository)",
      "name": "string | null — creator display name",
      "email": "string | null — creator email address",
      "role": "string — creator role (lead, follower, manager, producer, other)",
      "gifting_status": "string | null — current gifting status",
      "social_media_handles": [
        {"platform": "string", "handle": "string"}
      ]
    }
  ]
}
```

**Security note**: When no `campaign_id` is provided, the endpoint searches ALL campaigns globally (not filtered to the authenticated user's campaigns). The CE client passes user_id but the backend ignores it. This means a CE user could theoretically search creators from campaigns they don't own (though they'd need to know what to search for). This is acceptable because the service layer is trusted, and the CE itself is responsible for not exposing cross-user data.

---

### 4. Keyword-Based Creator Discovery (NEW: `cheerful_discover_creators_by_keyword`)

**Current backend endpoint**: `POST /creator-search/keyword` (JWT auth — needs service route)
**Required new service route**: `POST /api/service/creator-search/keyword`

**Request model** (`KeywordSearchRequest` from influencer_club.py line 104-114):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| keyword | str | yes | — | 1-200 chars | AI-powered keyword search via Influencer Club |
| platform | str | no | "instagram" | "instagram" or "youtube" (IC may support others) | Platform to search |
| page | int | no | 1 | ≥1 | Page number (10 results per page, hardcoded) |
| followers | RangeFilter | no | None | {min: float, max: float} | Follower count filter range |
| engagement_rate | RangeFilter | no | None | {min: float, max: float} | Engagement rate filter range |
| location | list[str] | no | None | — | Location filter (city/country strings) |
| gender | str | no | None | — | Gender filter |
| profile_language | list[str] | no | None | — | Profile language filter (e.g., ["en"]) |
| sort_by | str | no | None | — | Sort field |
| sort_order | str | no | None | — | Sort direction |

**Page size**: ALWAYS 10 results per page (hardcoded `_SEARCH_LIMIT = 10` in creator_search.py line 13). The `limit` is NOT a user parameter.

**Response model** (`CreatorSearchResponse` from influencer_club.py line 136-142):
```json
{
  "creators": [
    {
      "id": "string — IC user_id or 'ic-{index}' if no user_id",
      "username": "string — social handle",
      "full_name": "string | null — display name",
      "profile_pic_url": "string | null — profile picture URL",
      "follower_count": "integer | null — number of followers",
      "is_verified": "boolean — always false for IC results (not set in mapping)",
      "biography": "string | null — profile bio",
      "email": "string | null — email address if available",
      "engagement_rate": "float | null — engagement rate percentage"
    }
  ],
  "total": "integer | null — total results available (from IC)",
  "provider": "string — always 'influencer_club'",
  "page": "integer — current page number",
  "has_more": "boolean — true if total > page * 10"
}
```

**Note**: The `id` field for IC search results is the IC `user_id`, NOT a Cheerful campaign creator UUID. To save a creator to a campaign, use the `cheerful_add_creator_to_campaign` tool with the `username` value.

---

### 5. Similar Creator Discovery (NEW: `cheerful_discover_similar_creators`)

**Current backend endpoint**: `POST /creator-search/similar` (JWT auth — needs service route)
**Required new service route**: `POST /api/service/creator-search/similar`

**Request model** (`SimilarSearchRequest` from influencer_club.py line 93-101):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| handle | str | yes | — | 1-50 chars | Social handle to find similar creators for |
| platform | str | no | "instagram" | "instagram" (IC likely supports others) | Platform of the seed handle |
| page | int | no | 1 | ≥1 | Page number (10 results per page, hardcoded) |
| followers | RangeFilter | no | None | {min: float, max: float} | Follower count range filter |
| engagement_rate | RangeFilter | no | None | {min: float, max: float} | Engagement rate range filter |
| location | list[str] | no | None | — | Location filter |
| gender | str | no | None | — | Gender filter |
| profile_language | list[str] | no | None | — | Profile language filter |

**Page size**: ALWAYS 10 results per page (hardcoded `_SEARCH_LIMIT = 10`).

**Response model**: Same `CreatorSearchResponse` structure as keyword search (see above).

---

### 6. Creator Enrichment (NEW: `cheerful_enrich_creator_profile`)

**Current backend endpoint**: `POST /creator-search/enrich` (JWT auth — needs service route)
**Required new service route**: `POST /api/service/creator-search/enrich`

**Request model** (`EnrichCreatorRequest` from influencer_club.py line 117-119):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| handle | str | yes | — | 1-50 chars | Social handle to enrich |
| platform | str | no | "instagram" | "instagram" or "youtube" | Platform to enrich for |

**Response model** (`EnrichedCreatorResponse` from influencer_club.py line 144-158):
```json
{
  "handle": "string — the handle that was enriched",
  "platform": "string — the platform",
  "email": "string | null — contact email if found by IC",
  "full_name": "string | null — display name",
  "biography": "string | null — profile bio",
  "follower_count": "integer | null — number of followers",
  "following_count": "integer | null — number following (Instagram only, null for YouTube)",
  "profile_pic_url": "string | null — profile picture URL",
  "is_verified": "boolean — verified account status (Instagram only; false for YouTube path)",
  "category": "string | null — content category/niche",
  "city_name": "string | null — location city (Instagram only, null for YouTube)",
  "external_url": "string | null — bio link URL (Instagram only, null for YouTube)",
  "engagement_rate": "float | null — engagement rate percentage"
}
```

**Platform differences** (verified from creator_search.py lines 231-295):
- `instagram`: Uses IC `enrich_creator()` — provides full profile including following_count, city_name, external_url, is_verified
- `youtube`: Uses IC `enrich_creator_youtube()` — provides channel_name as full_name, description as biography, subscriber_count as follower_count, picture as profile_pic_url, niche_class as category; always is_verified=false; no following_count/city_name/external_url

---

### 7. Full Creator Profile via Apify (NEW: `cheerful_get_creator_full_profile`)

**Current backend endpoint**: `POST /creator-search/profile` (JWT auth — needs service route)
**Required new service route**: `POST /api/service/creator-search/profile`

**Request model** (`CreatorProfileRequest` from influencer_club.py line 160-163):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| handle | str | yes | — | 1-50 chars | Social handle (@ prefix stripped if present) |
| platform | str | no | "instagram" | "instagram" or "youtube" | Platform to fetch profile for |
| refresh | bool | no | false | — | Force refresh even if cache is fresh (< 24h) |

**Cache behavior** (verified from creator_search.py lines 365-390):
- Cache lifetime: 24 hours (`_PROFILE_CACHE_HOURS = 24`)
- Cache hit: Returns from DB with `source: "cache"`
- Stale cache (older than 24h): Returns old data with `source: "stale_cache"` immediately
- Refresh forced (`refresh=true`): Fetches fresh from Apify regardless of cache age
- No cache + fresh fetch: Returns from Apify with `source: "apify"` (Instagram) or `source: "influencer_club"` (YouTube)

**Response model** (`CreatorProfileResponse` from influencer_club.py lines 187-207):
```json
{
  "handle": "string — the handle (@ stripped)",
  "platform": "string — the platform",
  "full_name": "string | null — display name",
  "biography": "string | null — profile bio text",
  "follower_count": "integer | null — follower count",
  "following_count": "integer | null — following count (Instagram; null for YouTube)",
  "media_count": "integer | null — total posts or videos",
  "profile_pic_url": "string | null — standard profile picture URL",
  "profile_pic_url_hd": "string | null — high-resolution profile picture URL (Instagram only)",
  "is_verified": "boolean — whether account is verified",
  "email": "string | null — contact email if available",
  "category": "string | null — content category/niche",
  "city_name": "string | null — location (Instagram only)",
  "external_url": "string | null — bio link URL (Instagram only)",
  "phone_number": "string | null — contact phone (Instagram only)",
  "is_business": "boolean — whether account is a business account (Instagram only; false for YouTube)",
  "bio_links": [
    {
      "title": "string | null — link display title",
      "url": "string — link URL",
      "link_type": "string | null — type of link"
    }
  ],
  "latest_posts": [
    {
      "id": "string — post ID",
      "shortcode": "string | null — Instagram shortcode for URL",
      "url": "string | null — direct post URL",
      "caption": "string | null — post caption text",
      "post_type": "string | null — type of post",
      "display_url": "string | null — thumbnail/display image URL",
      "video_url": "string | null — video URL if applicable",
      "like_count": "integer — number of likes",
      "comment_count": "integer — number of comments",
      "view_count": "integer | null — view count for videos",
      "timestamp": "string | null — post timestamp",
      "is_sponsored": "boolean — whether post is sponsored"
    }
  ],
  "source": "string — one of: 'cache', 'stale_cache', 'apify', 'influencer_club'"
}
```

**Error conditions** (from creator_search.py):
- 404: Profile not found and no cache available (`f"Profile not found for @{handle}."` or `f"YouTube profile not found for @{handle}."`)
- 500: Apify fetch failed unexpectedly

---

### 8. YouTube Lookalike Channel Discovery (NEW: `cheerful_find_youtube_lookalikes`)

**Current backend endpoint**: `POST /youtube/lookalikes` (JWT auth — needs service route)
**Required new service route**: `POST /api/service/youtube/lookalikes`

**Request model** (`YouTubeLookalikeRequest` from youtube.py lines 27-48):
| Parameter | Type | Required | Default | Constraint | Notes |
|-----------|------|----------|---------|------------|-------|
| channel_url | str | yes | — | non-empty | YouTube channel URL, @handle, or channel ID. Normalized to full URL internally. Examples: "https://www.youtube.com/@MrBeast", "@MrBeast" |
| search_pool_size | int | no | 50 | 10-100 | How many channels to search before filtering for emails. Returns ALL with emails found. |
| region | str | no | None | ISO 3166-1 alpha-2 (e.g., "US") | Geographic filter for results |
| language | str | no | None | IETF BCP-47 (e.g., "en") | Language filter for channel content |

**Response model** (`YouTubeLookalikeResponse` from youtube.py lines 86-93):
```json
{
  "seed_channel": {
    "channel_id": "string — YouTube channel ID",
    "channel_name": "string — channel display name",
    "channel_username": "string | null — @handle if available",
    "channel_url": "string — full YouTube channel URL",
    "subscriber_count": "integer — number of subscribers",
    "total_videos": "integer — total uploaded videos",
    "total_views": "integer — total view count",
    "description": "string | null — channel description",
    "location": "string | null — channel location",
    "is_verified": "boolean — whether channel is verified",
    "avatar_url": "string | null — channel avatar/thumbnail URL",
    "email": "string | null — contact email if found in channel description"
  },
  "similar_channels": [
    {
      "channel_id": "string — YouTube channel ID",
      "channel_name": "string — channel display name",
      "channel_handle": "string | null — @handle if available",
      "channel_url": "string — full YouTube channel URL",
      "thumbnail_url": "string | null — channel thumbnail",
      "description": "string | null — channel description",
      "country": "string | null — channel country",
      "subscriber_count": "integer | null — subscribers",
      "total_views": "integer | null — total views",
      "keywords": ["string — search keyword tags"],
      "is_verified": "boolean — whether verified",
      "channel_type": "string | null — channel type category",
      "email": "string | null — contact email if found"
    }
  ],
  "keywords_used": ["string — keywords AI extracted from seed channel"],
  "scraper_run_id": "string — Apify scraper run ID for debugging",
  "finder_run_id": "string — Apify channel finder run ID for debugging"
}
```

**Side effects**: Saves all discovered similar channels to the global Creator table with `source="apify_youtube_lookalike:{finder_run_id}"` as a side effect of this call.

**Error conditions** (from youtube.py):
- 400: Invalid YouTube channel input (invalid URL/handle format)
- 404: Channel not found or invalid URL
- 429: Apify/YouTube service rate limit exceeded (check "rate limit" or "quota" in error message)
- 500: Unexpected error during search
- 503: Auth/config issue with Apify service ("unauthorized" or "forbidden" in error message)

**Performance note**: This is a long-running operation involving Apify web scraping (scraper run) + AI keyword extraction + channel finder (finder run). It should be invoked asynchronously or with user expectation of wait time.

---

## Summary

| Category | Count | New Tools Needed | Service Route Required |
|----------|-------|-----------------|----------------------|
| Existing CE tools (search domain) | 3 | 0 | N/A |
| New IC creator discovery | 4 | 4 | YES — 4 new POST /api/service/ routes |
| New YouTube lookalike | 1 | 1 | YES — 1 new POST /api/service/ route |
| **Total** | **8** | **5** | **5 new service routes** |

### Tool List

| # | Tool Name | Status | Backend Endpoint |
|---|-----------|--------|-----------------|
| 1 | `cheerful_search_emails` | EXISTS | `GET /api/service/threads/search` |
| 2 | `cheerful_find_similar_emails` | EXISTS | `GET /api/service/rag/similar` |
| 3 | `cheerful_search_campaign_creators` | EXISTS | `GET /api/service/creators/search` |
| 4 | `cheerful_discover_creators_by_keyword` | NEW | `POST /api/service/creator-search/keyword` (needs route) |
| 5 | `cheerful_discover_similar_creators` | NEW | `POST /api/service/creator-search/similar` (needs route) |
| 6 | `cheerful_enrich_creator_profile` | NEW | `POST /api/service/creator-search/enrich` (needs route) |
| 7 | `cheerful_get_creator_full_profile` | NEW | `POST /api/service/creator-search/profile` (needs route) |
| 8 | `cheerful_find_youtube_lookalikes` | NEW | `POST /api/service/youtube/lookalikes` (needs route) |
