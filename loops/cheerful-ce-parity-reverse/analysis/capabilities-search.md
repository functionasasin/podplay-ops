# Search & Discovery — Capability Extraction

**Aspect**: w1-search
**Sources**: `spec-backend-api.md` (Domains 6, 13), `spec-integrations.md` (Creator Discovery), actual source code (`creator_search.py`, `youtube.py`, `service.py`, `rag.py`, `embedding.py`, `email_reply_example.py`, `influencer_club.py` models, webapp lookalike suggestion API routes, webapp search hooks/stores)

---

## Existing Context Engine Tools

| Tool | Description | Service Endpoint | Coverage |
|------|-------------|------------------|----------|
| `cheerful_search_emails` | Full-text search within campaign threads (sender, subject, recipient, body) | `GET /api/service/threads/search` | READ only — searches Gmail + SMTP threads by campaign_id, query text, optional direction filter. Returns ThreadSearchResult[] (max 50) sorted by latest_date desc. |
| `cheerful_find_similar_emails` | Semantic similarity search via pgvector RAG embeddings | `GET /api/service/rag/similar` | READ only — accepts natural language query OR thread_id. Returns SimilarEmailResult[] with thread_summary, inbound/reply text, similarity score. Max 10 results. |
| `cheerful_search_campaign_creators` | Cross-campaign creator search by name/email/handle | `GET /api/service/creators/search` | READ only — searches campaign_creator table across all user's campaigns. Returns ServiceCreatorSearchResult[] with campaign context. Max 50 results. |

**Gap**: All 3 existing search tools are read-only and limited to existing database content. No external creator discovery (Influencer Club), no YouTube lookalike search (Apify), no creator profile fetching, no creator enrichment (getting emails), no lookalike suggestion management. The entire "find new creators" workflow has zero CE coverage.

---

## Enums & Constants (Verified from Source)

### Lookalike Suggestion Status (verified from `webapp/app/api/campaigns/[id]/lookalike-suggestions/[suggestionId]/route.ts`)

| Value | Description |
|-------|-------------|
| `"pending"` | Newly generated, awaiting user review |
| `"accepted"` | User accepted — added as campaign recipient |
| `"rejected"` | User rejected — excluded from campaign |

### Lookalike Suggestion Platform (verified from `campaign_lookalike_suggestion.py`)

| Value | Description |
|-------|-------------|
| `"instagram"` | Instagram creator (default) |
| `"youtube"` | YouTube channel |

### Creator Search Platform (verified from `influencer_club.py` request models)

| Value | Description |
|-------|-------------|
| `"instagram"` | Instagram search (default for IC similar/keyword search) |
| `"youtube"` | YouTube search (supported by enrich and profile endpoints) |

### Creator Profile Source (verified from `creator_search.py`)

| Value | Description |
|-------|-------------|
| `"cache"` | Served from DB cache (fresh, within 24h) |
| `"stale_cache"` | Served from DB cache (older than 24h, returned immediately) |
| `"apify"` | Fresh scrape from Apify Instagram actor |
| `"influencer_club"` | Enriched via Influencer Club API (YouTube path) |

### Embedding Model Constants (verified from `embedding.py`)

| Constant | Value |
|----------|-------|
| EMBEDDING_MODEL | `"text-embedding-3-small"` |
| EMBEDDING_DIMENSIONS | `1536` |

### IC Search Limit (verified from `creator_search.py`)

| Constant | Value |
|----------|-------|
| `_SEARCH_LIMIT` | `10` (hardcoded max results per page from IC API) |
| `_PROFILE_CACHE_HOURS` | `24` (hours before cache is considered stale) |

### YouTube Lookalike Search Pool Size (verified from `youtube.py`)

| Constraint | Value |
|-----------|-------|
| Default | `50` |
| Min | `10` |
| Max | `100` |

### Discovery Config Schema (verified from generated `discoveryConfig.ts` and campaign model)

```json
{
  "seed_profiles": ["string — Instagram handles to find lookalikes for"],
  "search_keywords": ["string — Keywords to search for creators"],
  "follower_min": "integer | null — Minimum follower count filter",
  "follower_max": "integer | null — Maximum follower count filter",
  "platform": "string | null — Platform to search on"
}
```

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### 1. Creator Discovery — Similar Search (Influencer Club) (`creator_search.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | Find similar creators by handle | `/v1/creator-search/similar` | POST | `handle` (str, 1-50 chars), `platform` (str, default "instagram"), `page` (int, min 1, default 1), `followers` (RangeFilter: {min?, max?} | null), `engagement_rate` (RangeFilter: {min?, max?} | null), `location` (list[str] | null), `gender` (str | null), `profile_language` (list[str] | null). Auth: JWT. | `CreatorSearchResponse { creators: [SearchedCreatorResponse], total: int|null, provider: "influencer_club", page: int, has_more: bool }` |

**SearchedCreatorResponse fields** (verified from `src/models/api/influencer_club.py`):
- id: str
- username: str
- full_name: str | null
- profile_pic_url: str | null
- follower_count: int | null
- is_verified: bool (default false)
- biography: str | null
- email: str | null
- engagement_rate: float | null

**Error handling** (verified from `creator_search.py`):
- 503: "Creator search service is not configured." (no IC API key / service is None)
- 429: "Search service rate limit exceeded. Try again later." (IC rate limit)
- 503: "Search service is not properly configured." (IC auth failure 401/403)
- 502: "Search service returned an error." (other IC API errors)
- 500: "Search failed unexpectedly." (unexpected exception)

**Pagination**: Page-based (not offset). Max 10 results per page (hardcoded `_SEARCH_LIMIT = 10`). `has_more = total > page * 10`.

**No service endpoint exists** — currently JWT-only. Needs new service route.

---

### 2. Creator Discovery — Keyword Search (Influencer Club) (`creator_search.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 2 | Search creators by keyword/topic | `/v1/creator-search/keyword` | POST | `keyword` (str, 1-200 chars), `platform` (str, default "instagram"), `page` (int, min 1, default 1), `followers` (RangeFilter | null), `engagement_rate` (RangeFilter | null), `location` (list[str] | null), `gender` (str | null), `profile_language` (list[str] | null), `sort_by` (str | null), `sort_order` (str | null). Auth: JWT. | `CreatorSearchResponse` (same as similar search) |

**Additional parameters over similar search**: `sort_by` and `sort_order` — passed through to IC API. Frontend supports sorting by followers, engagement, relevance.

**Error handling**: Same as similar search.

**No service endpoint exists** — currently JWT-only.

---

### 3. Creator Enrichment — Single Creator (Influencer Club) (`creator_search.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 3 | Enrich creator to get email + profile | `/v1/creator-search/enrich` | POST | `handle` (str, 1-50 chars), `platform` (str, default "instagram"). Auth: JWT. | `EnrichedCreatorResponse { handle, platform, email|null, full_name|null, biography|null, follower_count|null, following_count|null, profile_pic_url|null, is_verified: bool, category|null, city_name|null, external_url|null, engagement_rate|null }` |

**Platform-specific behavior** (verified from `creator_search.py`):
- **Instagram**: Calls `service.enrich_creator(handle, platform)` via IC enrichment API. Returns full profile data including following_count, is_verified, external_url.
- **YouTube**: Calls `service.enrich_creator_youtube(handle)` via IC YouTube enrichment. Response maps IC fields differently: `first_name` → `full_name`, `subscriber_count` → `follower_count`, `niche_class` → `category`, `picture` → `profile_pic_url`. Does NOT return following_count, is_verified, city_name, external_url.

**Error handling**: Same as similar search + "Enrichment failed unexpectedly." (500).

**No service endpoint exists** — currently JWT-only.

---

### 4. Creator Profile Fetch (Apify + IC + DB Cache) (`creator_search.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 4 | Fetch full creator profile with cache | `/v1/creator-search/profile` | POST | `handle` (str, 1-50 chars), `platform` (str, default "instagram"), `refresh` (bool, default false). Auth: JWT. | `CreatorProfileResponse { handle, platform, full_name|null, biography|null, follower_count|null, following_count|null, media_count|null, profile_pic_url|null, profile_pic_url_hd|null, is_verified: bool, email|null, category|null, city_name|null, external_url|null, phone_number|null, is_business: bool, bio_links: [CreatorProfileBioLink], latest_posts: [CreatorProfilePost], source: str }` |

**CreatorProfileBioLink fields** (verified from `influencer_club.py`):
- title: str | null
- url: str
- link_type: str | null

**CreatorProfilePost fields** (verified from `influencer_club.py`):
- id: str
- shortcode: str | null
- url: str | null
- caption: str | null
- post_type: str | null
- display_url: str | null
- video_url: str | null
- like_count: int (default 0)
- comment_count: int (default 0)
- view_count: int | null
- timestamp: str | null
- is_sponsored: bool (default false)

**Cache behavior** (verified from `creator_search.py`):
1. If `refresh=false` and DB record exists with `last_updated_at` within 24 hours → return with `source="cache"`
2. If `refresh=false` and DB record exists but stale (>24h) → return with `source="stale_cache"` (frontend can trigger refresh)
3. If `refresh=true` or no DB record → fetch fresh from Apify (Instagram) or IC (YouTube)
4. On fetch failure, falls back to stale cache if available
5. Instagram: calls `_fetch_instagram_profile()` (Apify), saves via `save_creator_from_instagram()`, returns `source="apify"`
6. YouTube: calls IC `enrich_creator_youtube()`, saves to Creator table, returns `source="influencer_club"`

**Error handling** (verified from `creator_search.py`):
- 404: "Profile not found for @{handle}." (Apify no results + no cache)
- 404: "YouTube profile not found for @{handle}." (IC failure + no cache)
- 500: "Profile fetch failed unexpectedly." (unexpected exception)

**No service endpoint exists** — currently JWT-only.

---

### 5. YouTube Lookalike Search (Apify) (`youtube.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 5 | Find similar YouTube channels | `/v1/youtube/lookalikes` | POST | `channel_url` (str, required — YouTube channel URL or handle, e.g., "https://www.youtube.com/@MrBeast" or "@MrBeast"), `search_pool_size` (int, 10-100, default 50), `region` (str | null — ISO 3166-1 alpha-2 code), `language` (str | null — IETF BCP-47 code). Auth: JWT. | `YouTubeLookalikeResponse { seed_channel: YouTubeSeedChannelResponse, similar_channels: [YouTubeSimilarChannelResponse], keywords_used: [str], scraper_run_id: str, finder_run_id: str }` |

**YouTubeSeedChannelResponse fields** (verified from `youtube.py`):
- channel_id: str
- channel_name: str
- channel_username: str | null
- channel_url: str
- subscriber_count: int
- total_videos: int
- total_views: int
- description: str | null
- location: str | null
- is_verified: bool
- avatar_url: str | null
- email: str | null

**YouTubeSimilarChannelResponse fields** (verified from `youtube.py`):
- channel_id: str
- channel_name: str
- channel_handle: str | null
- channel_url: str
- thumbnail_url: str | null
- description: str | null
- country: str | null
- subscriber_count: int | null
- total_views: int | null
- keywords: list[str]
- is_verified: bool
- channel_type: str | null
- email: str | null

**Process** (verified from `youtube.py`):
1. Normalizes input (handle or URL → full URL)
2. Fetches seed channel details via YouTube Apify channel scraper
3. Uses LLM to extract relevant search keywords from seed channel
4. Searches for similar channels using extracted keywords via YouTube Channel Finder Apify actor
5. Returns ALL channels with emails found (not capped at search_pool_size — search_pool_size controls how many to search before filtering)
6. **Side effect**: Saves all discovered channels to the global `creator` table via `save_creator_from_youtube()`

**Error handling** (verified from `youtube.py`):
- 400: "Invalid YouTube channel. Provide a channel URL, @handle, or channel ID." (invalid input after normalization)
- 429: "Service rate limit exceeded. Please try again later." (Apify/YouTube rate limit)
- 503: "YouTube search service is not properly configured." (auth error)
- 404: "Channel not found or invalid URL: {channel_url}" (channel not found)
- 500: "An unexpected error occurred while searching for similar channels." (unexpected error)

**No service endpoint exists** — currently JWT-only.

---

### 6. Lookalike Suggestion Management (Webapp-Only — Next.js API Routes)

These endpoints are implemented entirely in the webapp as Next.js API routes using Supabase client directly. **There are no backend FastAPI endpoints for these.** The backend only generates suggestions via the Temporal `generate_lookalikes_for_opt_in_activity`.

| # | Action | Webapp API Route | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 6 | List lookalike suggestions | `/api/campaigns/{id}/lookalike-suggestions` | GET | `status` (query param, optional — "pending", "accepted", "rejected"). Auth: Supabase session. | `CampaignLookalikeSuggestion[]` — filtered to non-null email only, ordered by similarity_score desc |
| 7 | Update suggestion status | `/api/campaigns/{id}/lookalike-suggestions/{suggestionId}` | PUT | `status` (body — "accepted", "rejected", "pending"). Auth: Supabase session + CSRF. | Updated suggestion record |
| 8 | Bulk accept suggestions | `/api/campaigns/{id}/lookalike-suggestions/bulk-accept` | POST | `suggestion_ids` (body — array of UUID strings, min 1). Auth: Supabase session + CSRF. | `{ accepted_count: int, added_recipient_count: int, failed_suggestion_ids: [str] }` |
| 9 | Bulk reject suggestions | `/api/campaigns/{id}/lookalike-suggestions/bulk-reject` | POST | `suggestion_ids` (body — array of UUID strings, min 1). Auth: Supabase session + CSRF. | `{ rejected_count: int, failed_suggestion_ids: [str] }` |

**CampaignLookalikeSuggestion fields** (verified from `campaign_lookalike_suggestion.py` DB model):
- id: UUID
- campaign_id: UUID
- seed_creator_id: UUID
- seed_platform_handle: str
- platform: str ("instagram" or "youtube")
- suggested_username: str
- suggested_full_name: str | null
- suggested_biography: str | null
- suggested_follower_count: int (default 0)
- suggested_profile_pic_url: str | null
- suggested_is_verified: bool (default false)
- suggested_external_url: str | null
- suggested_category: str | null
- suggested_email: str | null
- apify_run_id: str
- similarity_score: float | null (Numeric(5,2))
- status: str (default "pending")
- created_at: datetime
- updated_at: datetime

**Unique constraint**: `(campaign_id, platform, suggested_username)` — prevents duplicate suggestions per campaign+platform.

**Bulk accept side effects** (verified from `bulk-accept/route.ts`):
1. Updates suggestion status to "accepted"
2. For each suggestion with email: checks if `campaign_recipient` already exists
3. If not exists: inserts new recipient with `custom_fields` containing instagram_username, follower_count, is_verified, category, lookalike_suggestion_id, seed_platform_handle
4. Returns count of accepted suggestions + count of added recipients + any failed IDs

**Auth model**: Uses Supabase RLS for campaign access checks — both owner and assigned team members can manage suggestions.

**Key discovery**: These endpoints bypass the backend entirely — they use Supabase client directly from Next.js. For the CE to manage suggestions, new backend service endpoints would need to be created, OR the CE would need direct Supabase access.

---

### 7. Auto-Discovery Configuration (Campaign-Level Settings)

Auto-discovery is configured per-campaign as fields on the Campaign model. No dedicated endpoints — managed via campaign create/update.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 10 | Enable/configure auto-discovery | Campaign update endpoint | PATCH | `discovery_enabled` (bool), `discovery_config` (DiscoveryConfig), `is_lookalike_suggestions_enabled` (bool) | Campaign response |

**DiscoveryConfig fields** (verified from `discoveryConfig.ts` and campaign models):
- seed_profiles: list[str] | null — Instagram handles to find lookalikes for
- search_keywords: list[str] | null — Keywords to search for creators
- follower_min: int | null — Minimum follower count filter
- follower_max: int | null — Maximum follower count filter
- platform: str | null — Platform to search on

**How auto-discovery works** (verified from `generate_lookalikes_activity.py`):
1. When `is_lookalike_suggestions_enabled=true` on a campaign, the Temporal `generate_lookalikes_for_opt_in_activity` runs when creators opt in
2. For each opted-in creator: detects platform from social_media_handles (YouTube first, then Instagram)
3. Calls Apify to get similar creators (Instagram: max 40, YouTube: via channel finder)
4. Stores results in `campaign_lookalike_suggestion` table via upsert (ON CONFLICT by campaign_id + platform + username)
5. Only stores suggestions that have an email address
6. Also saves all discovered creators to the global `creator` table
7. Skips if campaign status is COMPLETED

**Note**: `discovery_enabled` and `discovery_config` appear to be for a separate weekly automated discovery feature (distinct from per-opt-in lookalike generation). Both are managed via campaign update.

---

## Service Endpoint Coverage for Context Engine

The context engine currently calls 3 service endpoints for search/discovery:

| Service Endpoint | CE Tool | Parameters |
|-----------------|---------|------------|
| `GET /api/service/threads/search` | `cheerful_search_emails` | user_id (injected), campaign_id, query, direction, limit (max 50) |
| `GET /api/service/rag/similar` | `cheerful_find_similar_emails` | user_id (injected), campaign_id, query OR thread_id, limit (max 10), min_similarity |
| `GET /api/service/creators/search` | `cheerful_search_campaign_creators` | user_id (injected), query, campaign_id, limit (max 50) |

**New service endpoints needed** for search/discovery parity:

1. **Creator similar search** — `POST /api/service/creator-search/similar` — proxy to IC similar search
2. **Creator keyword search** — `POST /api/service/creator-search/keyword` — proxy to IC keyword search
3. **Creator enrichment** — `POST /api/service/creator-search/enrich` — proxy to IC enrichment
4. **Creator profile fetch** — `POST /api/service/creator-search/profile` — proxy with DB cache
5. **YouTube lookalike search** — `POST /api/service/youtube/lookalikes` — proxy to Apify YouTube search
6. **List lookalike suggestions** — `GET /api/service/campaigns/{campaign_id}/lookalike-suggestions` — query DB
7. **Update suggestion status** — `PUT /api/service/campaigns/{campaign_id}/lookalike-suggestions/{id}` — update DB
8. **Bulk accept suggestions** — `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept` — accept + add recipients
9. **Bulk reject suggestions** — `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject` — reject

### Existing Tool Issues Discovered

1. **`cheerful_search_emails`**: The service endpoint `GET /api/service/threads/search` does NOT accept `user_id` as a parameter — it only takes `campaign_id`, `query`, `direction`, `limit`. User scoping happens indirectly because the CE tool must know valid campaign IDs for the user (obtained from `cheerful_list_campaigns`). However, the search endpoint itself does NOT verify user ownership of the campaign. This is a security gap — anyone with a valid campaign_id could search threads.

2. **`cheerful_find_similar_emails`**: Same issue — `GET /api/service/rag/similar` takes `campaign_id` but doesn't validate user access to that campaign.

3. **`cheerful_search_campaign_creators`**: The service endpoint does NOT filter by user_id even though `user_id` is passed as a query parameter. Looking at the service.py code (line 314-358), the `search_creators` function takes `query`, `campaign_id`, and `limit` — but there's no `user_id` filtering. The `repo.search_across_campaigns()` searches across ALL campaigns, not just the user's. This is a significant security gap.

---

## Summary

**Total search/discovery capabilities identified: 10 (across 7 sub-domains)**

| Sub-domain | Count | Existing CE Tools | Gap |
|-----------|-------|-------------------|-----|
| Full-text email thread search | 1 | 1 (`cheerful_search_emails`) | Already covered (read-only) |
| Semantic email similarity (pgvector) | 1 | 1 (`cheerful_find_similar_emails`) | Already covered (read-only) |
| Cross-campaign creator search | 1 | 1 (`cheerful_search_campaign_creators`) | Already covered (read-only, security gap noted) |
| Creator discovery — IC similar/keyword | 2 | 0 | 2 new tools needed |
| Creator enrichment + profile | 2 | 0 | 2 new tools needed |
| YouTube lookalike search | 1 | 0 | 1 new tool needed |
| Lookalike suggestion management | 4 | 0 | 3-4 new tools needed (list, accept/reject, bulk ops) |
| Auto-discovery configuration | 1 | 0 | 0 new tools (covered by campaign update) |
| **TOTAL** | **13** (+ 3 existing) | **3** | **~8-9 new tools** |

### Discoveries Not in Original Frontier

1. **Lookalike suggestion management is webapp-only** — Next.js API routes using Supabase client directly. No backend endpoints exist. The CE would need new backend service endpoints to manage suggestions, or direct Supabase access.

2. **Security gaps in existing service endpoints** — Thread search and RAG similar endpoints don't validate user ownership of campaign_id. Creator search doesn't filter by user_id. These should be flagged for the existing tools audit (w3-existing-tools-audit).

3. **Auto-discovery configuration** — `discovery_enabled` and `discovery_config` are campaign-level settings managed via campaign update. No dedicated endpoints needed — covered by campaign tools.

4. **Temporal-only lookalike generation** — The actual lookalike generation runs as a Temporal activity (`generate_lookalikes_for_opt_in_activity`). There's no API endpoint to manually trigger it. It auto-runs when creators opt in to campaigns with `is_lookalike_suggestions_enabled=true`.

5. **YouTube enrichment path difference** — YouTube creators go through IC YouTube enrichment which returns different fields than Instagram enrichment. The response mapping is different (e.g., `first_name` vs `full_name`, `subscriber_count` vs `follower_count`).

6. **Search supports both IC and Apify paths** — Frontend has a feature flag `influencer_club_search` that switches between synchronous IC API calls and async Apify start-then-poll. The CE tools should use the IC path (synchronous, simpler).

7. **Overlap with w1-creators** — Creator search/discovery endpoints were also partially documented in `capabilities-creators.md`. This extraction covers them with more detail on the search parameters and frontend UX. The w2-search tool design should reference w1-creators extraction for shared types.
