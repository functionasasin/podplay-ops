# Creators Domain — Tool Specifications

**Domain**: Creators
**Spec file**: `specs/creators.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

---

## Table of Contents

1. [Campaign Creator Listing & Detail](#campaign-creator-listing--detail) (3 existing tools)
2. [Standalone Creator Enrichment](#standalone-creator-enrichment) (2 new tools)
3. [Creator Search & Discovery (Influencer Club)](#creator-search--discovery-influencer-club) (4 new tools)
4. [Creator Lists — CRUD](#creator-lists--crud) (5 new tools)
5. [Creator List Items](#creator-list-items) (5 new tools)
6. [Creator List → Campaign Transfer](#creator-list--campaign-transfer) (1 new tool)
7. [Creator Posts (Content Verification)](#creator-posts-content-verification) (4 new tools)
8. [Public Creator Profiles (SEO)](#public-creator-profiles-seo) (3 new tools)

**Total**: 27 tools (3 existing + 24 new)

> **Cross-reference — Campaign Enrichment**: The campaigns domain (`specs/campaigns.md`) has 2 campaign-scoped enrichment tools (`cheerful_get_campaign_enrichment_status`, `cheerful_override_creator_email`) that operate within a specific campaign's creator list. This spec's standalone enrichment tools (sub-domain 2) operate on raw creator IDs — user-scoped, not campaign-scoped.

> **Cross-reference — Search & Discovery**: The `specs/search-and-discovery.md` spec covers YouTube lookalike search and lookalike suggestion management. Creator search via Influencer Club (IC) is documented here because it's part of the core creator lifecycle: discover → enrich → add to list → add to campaign → track posts.

> **Note on existing tools**: The 3 existing CE tools all need audit in Wave 3 — the capability extraction found: `cheerful_list_campaign_creators` missing `offset` parameter, `cheerful_search_campaign_creators` service endpoint may lack user_id ownership validation (security gap), and existing XML formatter drops `status`+`slack_channel_id` fields.

---

## Campaign Creator Listing & Detail

### `cheerful_list_campaign_creators`

**Status**: EXISTS — needs audit

**Purpose**: List creators in a campaign with optional filtering by gifting status and role.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (user must own or be assigned to the campaign).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign to list creators from |
| gifting_status | string | no | — | Filter by gifting status value |
| role | enum | no | — | Filter by creator role. One of: "creator", "talent_manager", "agency_staff", "internal", "unknown" |
| limit | integer | no | 50 | Max results. Range: 1-100 |

**Known issues (Wave 3 audit)**:
- Missing `offset` parameter — the service endpoint supports it (`offset: int, min 0, default 0`) but `ListCampaignCreatorsInput` model doesn't expose it. Needs to be added for pagination.
- Existing XML formatter drops `status` and `slack_channel_id` fields from the response — needs correction.
- Consider adding `paid_promotion_status` filter (exists in the data model but not as a filter param).

**Returns**: Array of campaign creator summary objects:
- id: uuid
- name: string (nullable)
- email: string (nullable)
- role: string
- gifting_status: string (nullable)
- paid_promotion_status: string (nullable)
- latest_interaction_at: datetime (nullable)
- social_media_handles: SocialMediaHandleAndUrl[] (platform, handle, url)

**Slack formatting notes**: Agent should present as a numbered list: `{name} ({email}) — {role}, gifting: {status}`. For large lists, summarize: "42 creators: 30 enriched, 8 pending, 4 not found".

---

### `cheerful_get_campaign_creator`

**Status**: EXISTS — needs audit

**Purpose**: Get full detail for a specific campaign creator including enrichment data, addresses, discount codes, talent manager info, and notes history.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned (via campaign access check).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the creator belongs to |
| creator_id | uuid | yes | — | Campaign creator ID |

**Returns**: Full campaign creator detail object:
- id: uuid
- name: string (nullable)
- email: string (nullable)
- role: enum — "creator", "talent_manager", "agency_staff", "internal", "unknown"
- gifting_status: string (nullable)
- paid_promotion_status: string (nullable)
- enrichment_status: enum — "pending", "enriching", "enriched", "not_found"
- source: enum — "email", "csv", "search", "sheet", "list", "api"
- social_media_handles: SocialMediaHandleAndUrl[]
- gifting_address: object (nullable — shipping address fields)
- discount_code: string (nullable)
- talent_manager_name: string (nullable)
- talent_manager_email: string (nullable)
- confidence_score: float (nullable)
- manually_verified: boolean
- notes_history: array of notes (timestamp, content, author)
- latest_interaction_at: datetime (nullable)
- post_opt_in_follow_up_status: enum (nullable) — "PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"
- created_at: datetime
- updated_at: datetime

**Slack formatting notes**: Agent should present as a structured profile card: name, email, role, enrichment status, social handles (as links), and key status fields. Notes history as a threaded reply if long.

---

### `cheerful_search_campaign_creators`

**Status**: EXISTS — needs audit

**Purpose**: Search campaign creators across all campaigns by name, email, or social media handle.

**Maps to**: `GET /api/service/creators/search`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (searches across all user's campaigns).

**Current parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | yes | — | Search query — matches against name, email, social media handle |
| campaign_id | uuid | no | — | Optional: limit search to a specific campaign |
| limit | integer | no | 20 | Max results. Range: 1-50 |

**Known issues (Wave 3 audit)**:
- **Security gap**: The service endpoint may not filter results by `user_id` — needs verification against `service.py`. If unscoped, a user could potentially see creators from other users' campaigns.
- Missing `offset` parameter for pagination.

**Returns**: Array of cross-campaign creator search results:
- id: uuid (campaign creator ID)
- campaign_id: uuid
- campaign_name: string
- name: string (nullable)
- email: string (nullable)
- role: string
- gifting_status: string (nullable)
- social_media_handles: SocialMediaHandleAndUrl[]

**Slack formatting notes**: Agent should group results by campaign: "In campaign X: creator1, creator2. In campaign Y: creator3".

---

## Standalone Creator Enrichment

> These tools enrich creators by finding their email addresses. They operate on creator IDs (not campaign-scoped). For campaign-scoped enrichment status/override, see `specs/campaigns.md` (`cheerful_get_campaign_enrichment_status`, `cheerful_override_creator_email`).

### `cheerful_start_creator_enrichment`

**Status**: NEW

**Purpose**: Start an asynchronous email enrichment workflow for a batch of creators. Finds email addresses via multiple data providers. Returns a workflow ID for polling.

**Maps to**: `POST /api/service/enrich-creators` (new service route needed; main route: `POST /v1/enrich-creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated. The workflow ID is namespaced to the user (`enrich-user-{user_id}-...`) for ownership enforcement on status polling.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| creator_ids | uuid[] | yes | — | List of creator IDs to enrich. Min: 1, max: 500 |

**Returns**: `StartEnrichmentResponse`:
- workflow_id: string — Temporal workflow ID for polling via `cheerful_get_enrichment_workflow_status`

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- Empty creator_ids (422): "At least one creator_id is required"
- Too many creator_ids (422): "Maximum 500 creators per enrichment batch"

**Side effects**: Starts a Temporal `EnrichForCampaignWorkflow`. The workflow enriches each creator asynchronously — may take 1-6 minutes depending on batch size.

**Slack formatting notes**: Agent should confirm: "Started enrichment for {N} creators. Use the workflow ID to check progress." Follow up with status check after ~30 seconds.

---

### `cheerful_get_enrichment_workflow_status`

**Status**: NEW

**Purpose**: Poll the status of a running enrichment workflow. Returns current status and per-creator results when complete.

**Maps to**: `GET /api/service/enrich-creators/{workflow_id}/status` (new service route needed; main route: `GET /v1/enrich-creators/{workflow_id}/status`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only — enforced by checking `workflow_id.startswith(f"enrich-user-{user_id}")`.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_id | string | yes | — | Workflow ID returned by `cheerful_start_creator_enrichment` |

**Returns**: `EnrichmentStatusResponse`:
- status: enum — "running" or "completed"
- results: array (nullable — null while running, populated when completed):
  - creator_id: uuid
  - email: string (nullable — null if enrichment failed)
  - enrichment_status: string — "enriched" or "not_found"

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- Workflow not found (404): "Enrichment workflow not found"
- Not owner (403): "Not authorized to view this workflow" (workflow_id doesn't match user)

**Polling model**: Frontend polls every 2-3 seconds, max ~180 attempts (6 minute timeout). If status is "running", keep polling. If "completed", results array contains per-creator outcomes.

**Slack formatting notes**: Agent should check every ~10 seconds (not 2-3s — Slack latency makes faster polling pointless). When complete: "Enrichment complete: {N} found, {M} not found." List the found emails.

---

## Creator Search & Discovery (Influencer Club)

> These tools search for and discover NEW creators via the Influencer Club (IC) external API. They are distinct from `cheerful_search_campaign_creators` which searches creators already in your campaigns.

> **Rate limiting**: IC API has rate limits. Tools return 429 "Search service rate limit exceeded" when hit. The agent should wait and retry.

> **Search page size**: Hardcoded at 10 results per page (`_SEARCH_LIMIT = 10`). Pagination is page-based (`page=1, 2, 3...`), not offset-based.

### `cheerful_search_similar_creators`

**Status**: NEW

**Purpose**: Find creators similar to a given Instagram/YouTube handle. Uses Influencer Club's similarity algorithm to find creators with similar audience, content style, and niche.

**Maps to**: `POST /api/service/creator-search/similar` (new service route needed; main route: `POST /v1/creator-search/similar`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram or YouTube handle to find similar creators for. Length: 1-50 chars |
| platform | string | no | "instagram" | Platform to search. One of: "instagram", "youtube" |
| page | integer | no | 1 | Page number for pagination. Min: 1 |
| followers | object | no | null | Follower count range filter: `{ "min": int, "max": int }`. Both fields optional |
| engagement_rate | object | no | null | Engagement rate range filter: `{ "min": float, "max": float }`. Both fields optional |
| location | string[] | no | null | Location filter — list of location strings |
| gender | string | no | null | Gender filter |
| profile_language | string[] | no | null | Profile language filter — list of language codes |

**Returns**: `CreatorSearchResponse`:
- creators: array of `SearchedCreatorResponse`:
  - id: string
  - username: string
  - full_name: string (nullable)
  - profile_pic_url: string (nullable)
  - follower_count: integer (nullable)
  - is_verified: boolean (default false)
  - biography: string (nullable)
  - email: string (nullable)
  - engagement_rate: float (nullable)
- total: integer (nullable — total results across all pages)
- provider: string — "influencer_club"
- page: integer — current page number
- has_more: boolean — `total > page * 10`

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- IC not configured (503): "Creator search service is not configured."
- IC rate limit (429): "Search service rate limit exceeded. Try again later."
- IC auth failure (503): "Search service is not properly configured."
- IC other error (502): "Search service returned an error."
- Unexpected (500): "Search failed unexpectedly."

**Slack formatting notes**: Agent should present results as a numbered list: `@{username} — {full_name} | {follower_count} followers | {engagement_rate}% ER`. Show `has_more` status and offer to load next page.

---

### `cheerful_search_creators_by_keyword`

**Status**: NEW

**Purpose**: Search for creators by keyword/topic. Finds creators whose content, bio, or audience matches the keyword.

**Maps to**: `POST /api/service/creator-search/keyword` (new service route needed; main route: `POST /v1/creator-search/keyword`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| keyword | string | yes | — | Search keyword or topic. Length: 1-200 chars |
| platform | string | no | "instagram" | Platform to search. One of: "instagram", "youtube" |
| page | integer | no | 1 | Page number. Min: 1 |
| followers | object | no | null | Follower count range: `{ "min": int, "max": int }` |
| engagement_rate | object | no | null | Engagement rate range: `{ "min": float, "max": float }` |
| location | string[] | no | null | Location filter |
| gender | string | no | null | Gender filter |
| profile_language | string[] | no | null | Language filter |
| sort_by | string | no | null | Sort field — available values TBD in Wave 3 (verify against IC API) |
| sort_order | string | no | null | Sort direction — "asc" or "desc" |

**Returns**: `CreatorSearchResponse` (same schema as `cheerful_search_similar_creators`).

**Error responses**: Same as `cheerful_search_similar_creators`.

**Slack formatting notes**: Same as similar search. Agent should present keyword used and page info.

---

### `cheerful_enrich_creator`

**Status**: NEW

**Purpose**: Enrich a single creator by handle — retrieves email address and basic profile data from Influencer Club. Supports both Instagram and YouTube (separate enrichment paths).

**Maps to**: `POST /api/service/creator-search/enrich` (new service route needed; main route: `POST /v1/creator-search/enrich`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Creator's handle (without @). Length: 1-50 chars |
| platform | string | no | "instagram" | Platform. One of: "instagram", "youtube". YouTube uses a separate IC enrichment path (`enrich_creator_youtube`) with different field mapping |

**Returns**: `EnrichedCreatorResponse`:
- handle: string
- platform: string
- email: string (nullable — null if enrichment can't find email)
- full_name: string (nullable)
- biography: string (nullable)
- follower_count: integer (nullable)
- following_count: integer (nullable)
- profile_pic_url: string (nullable)
- is_verified: boolean
- category: string (nullable)
- city_name: string (nullable)
- external_url: string (nullable)
- engagement_rate: float (nullable)

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- IC not configured (503): "Creator search service is not configured."
- IC rate limit (429): "Search service rate limit exceeded. Try again later."
- IC auth failure (503): "Search service is not properly configured."
- Unexpected (500): "Enrichment failed unexpectedly."

**Notes**:
- YouTube enrichment maps fields differently from Instagram (IC returns different field names for YT creators).
- This returns enrichment data immediately (synchronous) — unlike `cheerful_start_creator_enrichment` which is async/batch.
- No caching — each call queries IC API fresh.

**Slack formatting notes**: Agent should present enrichment results as a profile card: name, email (highlighted if found), followers, engagement rate. If email is null, suggest trying standalone batch enrichment which may use additional providers.

---

### `cheerful_get_creator_profile`

**Status**: NEW

**Purpose**: Get a detailed creator profile including bio links and latest posts. Uses 24-hour cache with multiple fallback sources (cache → Apify scrape → Influencer Club).

**Maps to**: `POST /api/service/creator-search/profile` (new service route needed; main route: `POST /v1/creator-search/profile`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Creator's handle (without @). Length: 1-50 chars |
| platform | string | no | "instagram" | Platform. One of: "instagram", "youtube" |
| refresh | boolean | no | false | Force bypass 24h cache and fetch fresh data from Apify |

**Returns**: `CreatorProfileResponse`:
- handle: string
- platform: string
- full_name: string (nullable)
- biography: string (nullable)
- follower_count: integer (nullable)
- following_count: integer (nullable)
- media_count: integer (nullable)
- profile_pic_url: string (nullable)
- profile_pic_url_hd: string (nullable)
- is_verified: boolean
- email: string (nullable)
- category: string (nullable)
- city_name: string (nullable)
- external_url: string (nullable)
- phone_number: string (nullable)
- is_business: boolean
- bio_links: array of `CreatorProfileBioLink`:
  - title: string (nullable)
  - url: string
  - link_type: string (nullable)
- latest_posts: array of `CreatorProfilePost`:
  - id: string
  - shortcode: string (nullable)
  - url: string (nullable)
  - caption: string (nullable)
  - post_type: string (nullable)
  - display_url: string (nullable)
  - video_url: string (nullable)
  - like_count: integer (default 0)
  - comment_count: integer (default 0)
  - view_count: integer (nullable)
  - timestamp: string (nullable)
  - is_sponsored: boolean (default false)
- source: enum — "cache", "stale_cache", "apify", "influencer_club"

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- Profile not found (404): "Profile not found for @{handle}."
- YouTube not found (404): "YouTube profile not found for @{handle}."
- IC not configured (503): "Creator search service is not configured."
- Unexpected (500): "Profile fetch failed unexpectedly."

**Notes**:
- Data source priority: fresh cache (< 24h) → Apify scrape → stale cache → IC enrichment fallback.
- The `source` field tells the agent where data came from. "stale_cache" means data is older than 24h.
- Setting `refresh=true` bypasses cache entirely and always fetches from Apify (slower, more up-to-date).
- Latest posts include engagement metrics — useful for evaluating creator fit.

**Slack formatting notes**: Agent should present as a rich profile card: name, handle, followers/following, engagement data. Show bio links as clickable URLs. Summarize recent posts: "{N} recent posts, avg {X} likes, {Y} comments". Indicate data freshness via source.

---

## Creator Lists — CRUD

> Creator lists are user-owned collections for organizing creators before adding them to campaigns. All list operations are owner-only — no team sharing.

### `cheerful_list_creator_lists`

**Status**: NEW

**Purpose**: List all creator lists belonging to the current user, with creator counts and email status summary.

**Maps to**: `GET /api/service/lists` (new service route needed; main route: `GET /v1/lists/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (returns only user's own lists).

**Parameters**: None user-facing — returns all lists for the authenticated user.

**Returns**: `CreatorListsResponse`:
- items: array of `CreatorListWithCountResponse`:
  - id: uuid
  - user_id: uuid
  - title: string
  - creator_count: integer — total creators in list
  - creators_without_email_count: integer — creators missing email
  - created_at: datetime
  - updated_at: datetime
- total: integer — total number of lists

**Slack formatting notes**: Agent should present as a summary table: `{title} — {creator_count} creators ({creators_without_email_count} missing email)`.

---

### `cheerful_create_creator_list`

**Status**: NEW

**Purpose**: Create a new empty creator list.

**Maps to**: `POST /api/service/lists` (new service route needed; main route: `POST /v1/lists/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| title | string | yes | — | List name. Length: 1-255 chars |

**Returns**: `CreatorListResponse` (201 Created):
- id: uuid
- user_id: uuid
- title: string
- created_at: datetime
- updated_at: datetime

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- Title too short/long (422): validation error

**Slack formatting notes**: Agent should confirm: "Created list '{title}'. Add creators with search, CSV, or by ID."

---

### `cheerful_get_creator_list`

**Status**: NEW

**Purpose**: Get a single creator list by ID.

**Maps to**: `GET /api/service/lists/{list_id}` (new service route needed; main route: `GET /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 "Not authorized" if not list owner).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |

**Returns**: `CreatorListResponse`:
- id: uuid
- user_id: uuid
- title: string
- created_at: datetime
- updated_at: datetime

**Error responses**:
- User not resolved: ToolError "Could not resolve Cheerful user..."
- List not found (404): "List not found"
- Not owner (403): "Not authorized"

---

### `cheerful_update_creator_list`

**Status**: NEW

**Purpose**: Update a creator list's title.

**Maps to**: `PATCH /api/service/lists/{list_id}` (new service route needed; main route: `PATCH /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| title | string | no | — | New title. Length: 1-255 chars. Omit to keep existing |

**Returns**: `CreatorListResponse` (updated).

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"
- Title too long (422): validation error

---

### `cheerful_delete_creator_list`

**Status**: NEW

**Purpose**: Delete a creator list and all its items.

**Maps to**: `DELETE /api/service/lists/{list_id}` (new service route needed; main route: `DELETE /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |

**Returns**: 204 No Content (success confirmation).

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"

**Slack formatting notes**: Agent should confirm with list title for context: "Deleted list '{title}' and all {N} creators in it."

---

## Creator List Items

### `cheerful_list_creator_list_items`

**Status**: NEW

**Purpose**: List creators in a creator list with pagination. Returns profile data, email status, and platform details.

**Maps to**: `GET /api/service/lists/{list_id}/creators` (new service route needed; main route: `GET /v1/lists/{list_id}/creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (list must belong to user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| limit | integer | no | 50 | Results per page. Range: 1-100 |
| offset | integer | no | 0 | Pagination offset. Min: 0 |

**Returns**: `CreatorListItemsResponse`:
- items: array of `CreatorInListResponse`:
  - id: uuid — list item ID
  - creator_id: uuid — global creator ID
  - platform: string
  - handle: string
  - email: string (nullable)
  - email_status: enum — "has_email" or "no_email"
  - follower_count: integer
  - is_verified: boolean
  - location: string (nullable)
  - profile_data: object — full profile data dict
  - profile_image_url: string (nullable) — Supabase Storage public URL
  - added_at: datetime
- total: integer — total creators in list

**Pagination**: Offset-based. Default limit: 50, max: 100. Response includes `total` count.

**Slack formatting notes**: Agent should present as: `@{handle} ({platform}) — {email_status}, {follower_count} followers`. Summarize: "{total} creators, {N} with email, {M} without".

---

### `cheerful_add_creators_to_list`

**Status**: NEW

**Purpose**: Add existing creators (by ID) to a creator list. Skips duplicates.

**Maps to**: `POST /api/service/lists/{list_id}/creators` (new service route needed; main route: `POST /v1/lists/{list_id}/creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| creator_ids | uuid[] | yes | — | List of creator IDs to add. Min: 1 |

**Returns**: `AddCreatorsToListResponse`:
- added_count: integer — number of creators successfully added
- skipped_count: integer — number skipped (already in list)

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"
- Empty creator_ids (422): validation error

**Slack formatting notes**: Agent should report: "Added {added_count} creators to '{list_title}'. {skipped_count} already in list."

---

### `cheerful_add_search_creators_to_list`

**Status**: NEW

**Purpose**: Add creators from Influencer Club search results to a list. Downloads and stores profile images with ETag-based deduplication.

**Maps to**: `POST /api/service/lists/{list_id}/creators/from-search` (new service route needed; main route: `POST /v1/lists/{list_id}/creators/from-search`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| creators | object[] | yes | — | Array of creator data from search results. Min: 1. Each object: |

**Creator object fields** (`CreatorFromSearchData`):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| platform | string | yes | — | One of: "instagram", "youtube" |
| handle | string | yes | — | Creator handle. Min length: 1 |
| name | string | no | null | Creator display name |
| email | string | no | null | Email address (if known from search) |
| follower_count | integer | no | 0 | Follower count |
| is_verified | boolean | no | false | Verification status |
| avatar_url | string | no | null | Profile image URL (will be downloaded and stored in Supabase Storage) |
| profile_url | string | no | null | Profile page URL |

**Returns**: `AddCreatorsToListResponse`:
- added_count: integer
- skipped_count: integer

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"
- Empty creators (422): validation error

**Side effects**: Profile images from `avatar_url` are downloaded and stored in Supabase Storage with ETag-based deduplication.

**Slack formatting notes**: Agent should confirm: "Added {added_count} creators from search to '{list_title}'."

---

### `cheerful_add_csv_creators_to_list`

**Status**: NEW

**Purpose**: Add creators from CSV data to a list. Accepts structured creator rows (platform, handle, email, follower count).

**Maps to**: `POST /api/service/lists/{list_id}/creators/from-csv` (new service route needed; main route: `POST /v1/lists/{list_id}/creators/from-csv`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| creators | object[] | yes | — | Array of CSV creator rows. Min: 1, max: 500. Each object: |

**CSV creator row fields** (`CsvCreatorRow`):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| platform | string | yes | — | One of: "instagram", "tiktok", "youtube" |
| handle | string | yes | — | Creator handle. Min length: 1 |
| email | string | yes | — | Email address. Min length: 1 |
| follower_count | integer | no | null | Follower count (optional) |

**Returns**: `AddCreatorsToListResponse`:
- added_count: integer
- skipped_count: integer

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"
- Too many creators (422): max 500 per batch
- Invalid platform (422): must be instagram, tiktok, or youtube

**Notes**:
- CSV import supports TikTok as a platform (unlike IC search which only supports Instagram and YouTube).
- Email is required for CSV import (unlike search import where email is optional).
- The agent should accept CSV text from Slack, parse it into the structured format, then call this tool.

**Slack formatting notes**: Agent should confirm: "Added {added_count} creators from CSV to '{list_title}'. {skipped_count} duplicates skipped."

---

### `cheerful_remove_creator_from_list`

**Status**: NEW

**Purpose**: Remove a single creator from a creator list.

**Maps to**: `DELETE /api/service/lists/{list_id}/creators/{creator_id}` (new service route needed; main route: `DELETE /v1/lists/{list_id}/creators/{creator_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Creator list ID |
| creator_id | uuid | yes | — | Creator ID to remove |

**Returns**: 204 No Content.

**Error responses**:
- List not found (404): "List not found"
- Not owner (403): "Not authorized"
- Creator not in list (404): "Creator not found in list"

---

## Creator List → Campaign Transfer

### `cheerful_add_list_creators_to_campaign`

**Status**: NEW

**Purpose**: Add creators from a creator list to a campaign. Optionally add all creators or a subset by ID. Triggers outbox population for non-DRAFT campaigns and starts enrichment for creators without email.

**Maps to**: `POST /api/service/lists/{list_id}/add-to-campaign` (new service route needed; main route: `POST /v1/lists/{list_id}/add-to-campaign`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner of BOTH the list AND the target campaign.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | uuid | yes | — | Source creator list ID |
| campaign_id | uuid | yes | — | Target campaign ID |
| creator_ids | uuid[] | no | [] | Specific creator IDs to add. Empty array = add ALL creators from the list |

**Returns**: `AddToCampaignResponse`:
- added_count: integer — creators successfully added to campaign
- skipped_count: integer — creators skipped (already in campaign)
- skipped_creators: string[] — names/handles of skipped creators
- campaign_id: uuid — target campaign
- enrichment_pending_count: integer — creators queued for email enrichment (had no email)

**Error responses**:
- List not found (404): "List not found"
- Not list owner (403): "Not authorized"
- Campaign not found (404): "Campaign not found"
- Not campaign owner (403): "Not authorized for this campaign"
- User not resolved: ToolError "Could not resolve Cheerful user..."

**Side effects** (critical — this is NOT just a data copy):
1. Creators are added to `campaign_creator` table with source="list"
2. For non-DRAFT campaigns: outbox queue is populated with initial emails for each added creator
3. For creators without email: `EnrichForCampaignWorkflow` Temporal workflow is started to find emails
4. The `enrichment_pending_count` tells the user how many creators need enrichment before emails can be sent

**Slack formatting notes**: Agent MUST warn about side effects: "Added {added_count} creators to campaign '{name}'. {enrichment_pending_count} need email enrichment. {skipped_count} already in campaign." If campaign is ACTIVE, additionally warn: "Outbox emails have been queued for the newly added creators."

---

## Creator Posts (Content Verification)

> Creator posts track whether gifted/sponsored creators have actually posted about the brand's product. Posts are detected via Apify Instagram scraping + LLM vision analysis.

### `cheerful_list_posts`

**Status**: NEW

**Purpose**: List all tracked creator posts across the user's campaigns (the "Post Library" view). Supports search and pagination.

**Maps to**: `GET /api/service/posts` (new service route needed; main route: `GET /v1/posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (returns posts only from campaigns the user owns or is assigned to, via `get_accessible_campaign_ids`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | no | 50 | Results per page. Range: 1-100 |
| offset | integer | no | 0 | Pagination offset. Min: 0 |
| sort | enum | no | "desc" | Sort by matched_at. One of: "asc", "desc" |
| search | string | no | null | Text search across caption, creator name, campaign name |

**Returns**: `PostLibraryResponse`:
- posts: array of `PostLibraryItem`:
  - id: uuid
  - instagram_post_id: string
  - post_type: enum — "REEL", "POST", "CAROUSEL", "STORY"
  - post_url: string
  - caption: string (nullable)
  - media_url: string (nullable) — Supabase Storage path
  - thumbnail_url: string (nullable)
  - like_count: integer
  - view_count: integer (nullable)
  - comment_count: integer
  - posted_at: datetime (nullable)
  - matched_at: datetime — when the system detected the post
  - match_method: enum — "caption", "vision", "url"
  - creator_name: string (nullable)
  - campaign_name: string (nullable)
  - campaign_id: uuid
- total: integer — total matching posts

**Pagination**: Offset-based. Default limit: 50, max: 100.

**Slack formatting notes**: Agent should present as: `{creator_name} posted a {post_type} for {campaign_name} — {like_count} likes, {comment_count} comments (matched via {match_method})`. Summarize large results: "{total} posts across {N} campaigns".

---

### `cheerful_list_creator_posts`

**Status**: NEW

**Purpose**: List tracked posts for a specific creator within a specific campaign. Includes tracking metadata (when posts were last checked, when tracking ends).

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}/posts` (new service route needed; main route: `GET /v1/campaigns/{campaign_id}/creators/{creator_id}/posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned (via `can_access_campaign` check).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| creator_id | uuid | yes | — | Campaign creator ID |

**Returns**: `CreatorPostsResponse`:
- posts: array of `CreatorPostResponse`:
  - id: uuid
  - instagram_post_id: string
  - post_type: enum — "REEL", "POST", "CAROUSEL", "STORY"
  - post_url: string
  - caption: string (nullable)
  - media_url: string (nullable)
  - thumbnail_url: string (nullable)
  - like_count: integer
  - view_count: integer (nullable)
  - comment_count: integer
  - posted_at: datetime (nullable)
  - matched_at: datetime
  - match_method: enum — "caption", "vision", "url"
  - match_reason: string (nullable) — explanation of why the post was matched
- total: integer
- last_checked_at: datetime (nullable) — when posts were last refreshed
- tracking_ends_at: datetime (nullable) — when automatic tracking stops

**Error responses**:
- Campaign not found (404): "Campaign not found"
- Not authorized (403): "Not authorized"
- Creator not found (404): "Creator not found"

**Slack formatting notes**: Agent should present posts and include tracking status: "Last checked: {date}. Tracking until: {date}." If no posts: "No posts detected yet for @{handle}. Last checked: {date}."

---

### `cheerful_refresh_creator_posts`

**Status**: NEW

**Purpose**: Manually trigger a post refresh for a creator. Fetches the last 10 Instagram posts via Apify, then analyzes each with LLM vision to detect product mentions. Synchronous — blocks until complete.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts` (new service route needed; main route: `POST /v1/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| creator_id | uuid | yes | — | Campaign creator ID |

**Returns**: `RefreshPostsResponse`:
- posts_found: integer — total posts scraped from Instagram
- new_posts: integer — posts that matched the campaign product (newly detected)
- last_checked_at: datetime — updated timestamp

**Error responses**:
- Campaign not found (404): "Campaign not found"
- Not authorized (403): "Not authorized"
- Creator not found (404): "Creator not found"
- No Instagram handle (400): "Creator has no Instagram handle"
- No product configured (400): "Campaign has no product for matching"

**Notes**:
- This is synchronous and may take 10-30 seconds (Apify scrape + LLM vision for each post).
- Requires the creator to have an Instagram handle in `social_media_handles`.
- Requires the campaign to have a `product_id` configured (the LLM uses product info for matching).
- Scrapes last 10 posts; analyzes each with LLM vision model (looks for product in images/video frames).
- Match methods: "caption" (product name in text), "vision" (LLM detected product in media), "url" (product URL in bio/post).

**Slack formatting notes**: Agent should warn about processing time: "Refreshing posts for @{handle}... this may take 10-30 seconds." Then report: "Found {posts_found} posts, {new_posts} new matches detected."

---

### `cheerful_delete_post`

**Status**: NEW

**Purpose**: Delete a tracked post (false positive removal). For cases where the LLM incorrectly matched a post as containing the brand's product.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}/posts/{post_id}` (new service route needed; main route: `DELETE /v1/campaigns/{campaign_id}/posts/{post_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| post_id | uuid | yes | — | Post ID to delete |

**Returns**: 204 No Content.

**Error responses**:
- Campaign not found (404): "Campaign not found"
- Not authorized (403): "Not authorized"
- Post not found (404): "Post not found"

**Slack formatting notes**: Agent should confirm with post context: "Deleted post by @{creator_handle} (matched via {method}). Marked as false positive."

---

## Public Creator Profiles (SEO)

> These endpoints are public — no authentication required. They serve creator profile data from the "Creator Profile Scraping" workflow (Claude agent + Apify). While not user-scoped, they're useful for the CE agent to look up public creator information before adding them to campaigns.

### `cheerful_list_public_creator_profiles`

**Status**: NEW

**Purpose**: List publicly available creator profiles. Returns summaries with key metrics. No auth required.

**Maps to**: `GET /api/service/creators/profiles` (new service route needed; main route: `GET /v1/creators/profiles/`)

**Auth**: None required — public endpoint. The CE still uses service auth for consistency.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | no | 50 | Results per page. Range: 1-100 |
| offset | integer | no | 0 | Pagination offset. Min: 0 |

**Returns**: Array of `CreatorProfileSummary`:
- username: string
- full_name: string
- avatar_url: string (nullable)
- is_verified: boolean (default false)
- primary_category: string (nullable)
- followers: integer (default 0)
- engagement_rate: float (default 0.0)
- engagement_band: string (default "unknown")
- scraped_at: datetime

**Slack formatting notes**: Agent should present as a browse list: `@{username} ({full_name}) — {followers} followers, {engagement_rate}% ER, category: {primary_category}`.

---

### `cheerful_get_public_creator_profile`

**Status**: NEW

**Purpose**: Get a single publicly available creator profile by Instagram handle. Returns rich profile data, metrics, sponsorships, and content analysis.

**Maps to**: `GET /api/service/creators/profiles/{handle}` (new service route needed; main route: `GET /v1/creators/profiles/{handle}`)

**Auth**: None required — public endpoint.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram handle (without @) |

**Returns**: `CreatorProfileDetail`:
- profile: object — basic profile data
- metrics: object — engagement metrics, growth data
- sponsorships: object — detected brand partnerships
- content: object — content analysis (themes, posting frequency)
- scrape_metadata: object — scraping run details
- execution_id: uuid — workflow execution ID
- scraped_at: datetime

**Error responses**:
- Profile not found (404): "Creator profile not found for @{handle}"

**Notes**:
- Data comes from `CampaignWorkflowExecution` records produced by the "Creator Profile Scraping" workflow.
- Not all creators have profiles — only those that have been scraped.
- Profile data is point-in-time (as of `scraped_at`), not live.

**Slack formatting notes**: Agent should present as a comprehensive profile card with metrics summary, content themes, and detected sponsorships.

---

### `cheerful_trigger_creator_scrape`

**Status**: NEW

**Purpose**: Trigger an asynchronous creator profile scrape. The system will scrape the creator's Instagram profile via Apify and analyze it with a Claude agent. Returns immediately with 202 Accepted.

**Maps to**: `POST /api/service/creators/profiles/scrape` (new service route needed; main route: `POST /v1/creators/profiles/scrape`)

**Auth**: None required — public endpoint. No auth means any service can trigger scrapes.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram handle (without @) |
| creator_data | object | no | null | Optional pre-provided context about the creator (passed to the Claude analysis agent) |

**Returns** (202 Accepted): `ScrapeResponse`:
- status: string — "accepted"
- message: string
- handle: string

**Notes**:
- Asynchronous — the scrape runs in the background via a Temporal workflow.
- No callback/polling endpoint for scrape status — use `cheerful_get_public_creator_profile` later to check if the profile has been populated.
- The Claude agent analyzes the scraped profile data to produce structured metrics, sponsorship detection, and content analysis.

**Slack formatting notes**: Agent should confirm: "Scrape triggered for @{handle}. Check back in a few minutes for the profile."

---

## Summary

### New Service Routes Required

| # | New Service Route | Method | CE Tool |
|---|-------------------|--------|---------|
| 1 | `POST /api/service/enrich-creators` | POST | `cheerful_start_creator_enrichment` |
| 2 | `GET /api/service/enrich-creators/{workflow_id}/status` | GET | `cheerful_get_enrichment_workflow_status` |
| 3 | `POST /api/service/creator-search/similar` | POST | `cheerful_search_similar_creators` |
| 4 | `POST /api/service/creator-search/keyword` | POST | `cheerful_search_creators_by_keyword` |
| 5 | `POST /api/service/creator-search/enrich` | POST | `cheerful_enrich_creator` |
| 6 | `POST /api/service/creator-search/profile` | POST | `cheerful_get_creator_profile` |
| 7 | `GET /api/service/lists` | GET | `cheerful_list_creator_lists` |
| 8 | `POST /api/service/lists` | POST | `cheerful_create_creator_list` |
| 9 | `GET /api/service/lists/{id}` | GET | `cheerful_get_creator_list` |
| 10 | `PATCH /api/service/lists/{id}` | PATCH | `cheerful_update_creator_list` |
| 11 | `DELETE /api/service/lists/{id}` | DELETE | `cheerful_delete_creator_list` |
| 12 | `GET /api/service/lists/{id}/creators` | GET | `cheerful_list_creator_list_items` |
| 13 | `POST /api/service/lists/{id}/creators` | POST | `cheerful_add_creators_to_list` |
| 14 | `POST /api/service/lists/{id}/creators/from-search` | POST | `cheerful_add_search_creators_to_list` |
| 15 | `POST /api/service/lists/{id}/creators/from-csv` | POST | `cheerful_add_csv_creators_to_list` |
| 16 | `DELETE /api/service/lists/{id}/creators/{cid}` | DELETE | `cheerful_remove_creator_from_list` |
| 17 | `POST /api/service/lists/{id}/add-to-campaign` | POST | `cheerful_add_list_creators_to_campaign` |
| 18 | `GET /api/service/posts` | GET | `cheerful_list_posts` |
| 19 | `GET /api/service/campaigns/{id}/creators/{cid}/posts` | GET | `cheerful_list_creator_posts` |
| 20 | `POST /api/service/campaigns/{id}/creators/{cid}/refresh-posts` | POST | `cheerful_refresh_creator_posts` |
| 21 | `DELETE /api/service/campaigns/{id}/posts/{pid}` | DELETE | `cheerful_delete_post` |
| 22 | `GET /api/service/creators/profiles` | GET | `cheerful_list_public_creator_profiles` |
| 23 | `GET /api/service/creators/profiles/{handle}` | GET | `cheerful_get_public_creator_profile` |
| 24 | `POST /api/service/creators/profiles/scrape` | POST | `cheerful_trigger_creator_scrape` |

### Key Enums

| Enum | Values | Source |
|------|--------|--------|
| CampaignCreator.role | creator, talent_manager, agency_staff, internal, unknown | `campaign_creator.py` |
| CampaignCreator.enrichment_status | pending, enriching, enriched, not_found | `campaign_creator.py` |
| CampaignCreator.source | email, csv, search, sheet, list, api | `campaign_creator.py` |
| PostOptInFollowUpStatus | PENDING, PROCESSING, SENT, FAILED, CANCELLED | `campaign_creator.py` |
| Post type | REEL, POST, CAROUSEL, STORY | `creator_post.py` |
| Match method | caption, vision, url | `creator_post.py` |
| Email status (list) | has_email, no_email | `creator_list.py` |
| Profile source | cache, stale_cache, apify, influencer_club | `creator_search.py` |
| SocialMediaHandle platform | instagram, twitter, facebook, youtube, tiktok, linkedin, other | shared schema |
| CSV platform | instagram, tiktok, youtube | `creator_list.py` |

### Domain Statistics

| Sub-domain | Existing | New | Total |
|-----------|----------|-----|-------|
| Campaign Creator Listing & Detail | 3 | 0 | 3 |
| Standalone Creator Enrichment | 0 | 2 | 2 |
| Creator Search & Discovery (IC) | 0 | 4 | 4 |
| Creator Lists — CRUD | 0 | 5 | 5 |
| Creator List Items | 0 | 5 | 5 |
| Creator List → Campaign | 0 | 1 | 1 |
| Creator Posts (Content Verification) | 0 | 4 | 4 |
| Public Creator Profiles (SEO) | 0 | 3 | 3 |
| **TOTAL** | **3** | **24** | **27** |
