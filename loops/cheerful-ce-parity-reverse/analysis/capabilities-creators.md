# Creators — Capability Extraction

**Aspect**: w1-creators
**Sources**: `spec-backend-api.md` (Domain 5, 13-16), `spec-webapp.md` (Creator Discovery, Lists, Campaign Detail), actual source code (`campaign_enrichment.py`, `creator_search.py`, `creator_list.py`, `creator_profile.py`, `creator_post.py`, `service.py`, `mcp/tools/cheerful/tools.py`)

---

## Existing Context Engine Tools

| Tool | Description | Service Endpoint | Coverage |
|------|-------------|------------------|----------|
| `cheerful_list_campaign_creators` | List creators in a campaign with optional gifting_status/role filter | `GET /api/service/campaigns/{campaign_id}/creators` | READ only — returns id, name, email, role, gifting_status, paid_promotion_status, latest_interaction_at, social_media_handles. Limit max 50. |
| `cheerful_get_campaign_creator` | Get full detail for a specific campaign creator | `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}` | READ only — returns all detail fields including gifting_address, discount_code, talent manager info, notes_history, confidence_score, manually_verified |
| `cheerful_search_campaign_creators` | Search campaign creators across all campaigns by name/email/handle | `GET /api/service/creators/search` | READ only — returns id, campaign_id, campaign_name, name, email, role, gifting_status, social_media_handles. Limit max 20. |

**Gap**: 3 of the 7 existing tools are creator-domain. All are read-only. No enrichment triggering, no email override, no creator lists management, no search/discovery (external), no profile fetching, no post tracking, no notes management. The service endpoints only expose 3 read endpoints for the creator domain.

---

## Enums & Constants (Verified from Source)

### CampaignCreator.role (verified from `src/models/database/campaign_creator.py`)

| Value | Description |
|-------|-------------|
| `"creator"` | The influencer/content creator |
| `"talent_manager"` | Manager representing the creator |
| `"agency_staff"` | Agency staff member |
| `"internal"` | Internal team member |
| `"unknown"` | Unknown role (default) |

### CampaignCreator.enrichment_status (verified from source)

| Value | Description |
|-------|-------------|
| `"pending"` | Awaiting enrichment |
| `"enriching"` | Currently being enriched |
| `"enriched"` | Successfully enriched with email |
| `"not_found"` | Enrichment failed, no email found |

### CampaignCreator.source (verified from source)

| Value | Description |
|-------|-------------|
| `"email"` | Extracted from email thread |
| `"csv"` | Uploaded via CSV |
| `"search"` | Added via creator search |
| `"sheet"` | Synced from Google Sheets |
| `"list"` | Added from creator list |
| `"api"` | Added via API |

### PostOptInFollowUpStatus (verified from `src/models/database/campaign_creator.py`)

| Value | Description |
|-------|-------------|
| `"PENDING"` | Scheduled follow-up pending |
| `"PROCESSING"` | Currently processing |
| `"SENT"` | Follow-up sent |
| `"FAILED"` | Follow-up failed |
| `"CANCELLED"` | Follow-up cancelled |

### Creator Post Types (verified from `creator_post.py`)

| Value | Description |
|-------|-------------|
| `"REEL"` | Instagram Reel |
| `"POST"` | Standard Instagram post |
| `"CAROUSEL"` | Multi-image carousel post |
| `"STORY"` | Instagram Story |

### Post Match Methods (verified from source)

| Value | Description |
|-------|-------------|
| `"caption"` | Product mentioned in Instagram caption |
| `"vision"` | LLM vision model detected product in post media |
| `"url"` | Product URL found in bio or post |

### Creator List Email Status

| Value | Description |
|-------|-------------|
| `"has_email"` | Creator has email on record |
| `"no_email"` | Creator missing email |

### Creator Profile Source (verified from `creator_search.py`)

| Value | Description |
|-------|-------------|
| `"cache"` | Served from 24h cache (fresh) |
| `"stale_cache"` | Served from cache (older than 24h) |
| `"apify"` | Fresh scrape from Apify |
| `"influencer_club"` | Enriched via Influencer Club API |

### SocialMediaHandleAndUrl Schema

```json
{
  "platform": "string — one of: instagram, twitter, facebook, youtube, tiktok, linkedin, other",
  "handle": "string — e.g., john_doe",
  "url": "string | null — explicit URL only, do not infer from handle"
}
```

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### Campaign Creator Enrichment (Domain 5 — `campaign_enrichment.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | Get enrichment status | `/v1/campaigns/{campaign_id}/creators/enrichment-status` | GET | campaign_id (path). Auth: JWT, owner or assigned. Filters to pending/enriching only. | `CreatorEnrichmentStatusResponse { creators: [{ creator_id: UUID, enrichment_status: str, email: str|null }] }` |
| 2 | Override creator email | `/v1/campaigns/{campaign_id}/creators/{creator_id}/override-email` | POST | campaign_id (path), creator_id (path), email (body, pattern `.+@.+\..+`). Auth: JWT, owner or assigned. | `OverrideEmailResponse { creator_id: UUID, email: str, queued: bool }`. Side effects: sets enrichment_status="enriched", queues into outbox if campaign is ACTIVE. |
| 3 | Start standalone enrichment | `/v1/enrich-creators` | POST | creator_ids (body, list[UUID], max 500). Auth: JWT. | `StartEnrichmentResponse { workflow_id: str }`. Starts Temporal `EnrichForCampaignWorkflow`. |
| 4 | Poll standalone enrichment status | `/v1/enrich-creators/{workflow_id}/status` | GET | workflow_id (path). Auth: JWT. Enforces `workflow_id.startswith(f"enrich-user-{user_id}")` for ownership. | `EnrichmentStatusResponse { status: "running"|"completed", results: list[EnrichCreatorForCampaignResult]|null }` |

**Enrichment polling model**: Frontend polls every 2-3 seconds, max ~180 attempts (6 minutes timeout). If status is "running", keep polling. If "completed", results array contains per-creator enrichment outcomes.

---

### Creator Search & Discovery (Domain 13 — `creator_search.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 5 | Search similar creators | `/v1/creator-search/similar` | POST | handle (str, 1-50 chars), platform (str, default "instagram"), page (int, min 1, default 1), followers (RangeFilter: {min?, max?}), engagement_rate (RangeFilter: {min?, max?}), location (list[str]|null), gender (str|null), profile_language (list[str]|null). Auth: JWT. | `CreatorSearchResponse { creators: [SearchedCreatorResponse], total: int|null, provider: "influencer_club", page: int, has_more: bool }` |
| 6 | Search creators by keyword | `/v1/creator-search/keyword` | POST | keyword (str, 1-200 chars), platform (str, default "instagram"), page (int, min 1, default 1), followers (RangeFilter), engagement_rate (RangeFilter), location (list[str]|null), gender (str|null), profile_language (list[str]|null), sort_by (str|null), sort_order (str|null). Auth: JWT. | `CreatorSearchResponse` (same as similar search) |
| 7 | Enrich single creator | `/v1/creator-search/enrich` | POST | handle (str, 1-50 chars), platform (str, default "instagram"). Auth: JWT. Supports YouTube via separate IC enrichment path. | `EnrichedCreatorResponse { handle, platform, email|null, full_name|null, biography|null, follower_count|null, following_count|null, profile_pic_url|null, is_verified: bool, category|null, city_name|null, external_url|null, engagement_rate|null }` |
| 8 | Get creator profile | `/v1/creator-search/profile` | POST | handle (str, 1-50 chars), platform (str, default "instagram"), refresh (bool, default false). Auth: JWT. 24h cache. | `CreatorProfileResponse { handle, platform, full_name|null, biography|null, follower_count|null, following_count|null, media_count|null, profile_pic_url|null, profile_pic_url_hd|null, is_verified: bool, email|null, category|null, city_name|null, external_url|null, phone_number|null, is_business: bool, bio_links: [CreatorProfileBioLink], latest_posts: [CreatorProfilePost], source: str }` |

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

**CreatorProfileBioLink fields**:
- title: str | null
- url: str
- link_type: str | null

**CreatorProfilePost fields**:
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

**Error handling** (verified from `creator_search.py`):
- 503: "Creator search service is not configured." (no IC API key)
- 429: "Search service rate limit exceeded. Try again later." (IC rate limit)
- 503: "Search service is not properly configured." (IC auth failure 401/403)
- 502: "Search service returned an error." (other IC API errors)
- 500: "Search failed unexpectedly." / "Enrichment failed unexpectedly." / "Profile fetch failed unexpectedly."
- 404: "Profile not found for @{handle}." (Apify no results + no cache)
- 404: "YouTube profile not found for @{handle}." (YouTube enrichment fail + no cache)

**Search limit**: Hardcoded `_SEARCH_LIMIT = 10` — each page returns max 10 results from Influencer Club API. `has_more = total > page * 10`.

---

### Creator Lists (Domain 15 — `creator_list.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 9 | List creator lists | `/v1/lists/` | GET | (none, user-scoped). Auth: JWT. | `CreatorListsResponse { items: [CreatorListWithCountResponse], total: int }` |
| 10 | Create creator list | `/v1/lists/` | POST | title (str, min 1, max 255). Auth: JWT. | `CreatorListResponse { id, user_id, title, created_at, updated_at }` (201) |
| 11 | Get creator list | `/v1/lists/{list_id}` | GET | list_id (UUID, path). Auth: JWT, owner only (403 "Not authorized"). | `CreatorListResponse` |
| 12 | Update creator list | `/v1/lists/{list_id}` | PATCH | list_id (path), title (str|null, min 1, max 255). Auth: JWT, owner only. | `CreatorListResponse` |
| 13 | Delete creator list | `/v1/lists/{list_id}` | DELETE | list_id (path). Auth: JWT, owner only. | 204 No Content |
| 14 | List creators in list | `/v1/lists/{list_id}/creators` | GET | list_id (path), limit (int, 1-100, default 50), offset (int, min 0, default 0). Auth: JWT, owner only. | `CreatorListItemsResponse { items: [CreatorInListResponse], total: int }` |
| 15 | Add creators to list | `/v1/lists/{list_id}/creators` | POST | list_id (path), creator_ids (list[UUID], min 1). Auth: JWT, owner only. | `AddCreatorsToListResponse { added_count: int, skipped_count: int }` |
| 16 | Add creators from search | `/v1/lists/{list_id}/creators/from-search` | POST | list_id (path), creators (list[CreatorFromSearchData], min 1). Auth: JWT, owner only. Downloads and stores profile images. | `AddCreatorsToListResponse { added_count: int, skipped_count: int }` |
| 17 | Add creators from CSV | `/v1/lists/{list_id}/creators/from-csv` | POST | list_id (path), creators (list[CsvCreatorRow], max 500). Auth: JWT, owner only. | `AddCreatorsToListResponse { added_count: int, skipped_count: int }` |
| 18 | Remove creator from list | `/v1/lists/{list_id}/creators/{creator_id}` | DELETE | list_id (path), creator_id (UUID, path). Auth: JWT, owner only. | 204 No Content. 404 "Creator not found in list" if not present. |
| 19 | Add list creators to campaign | `/v1/lists/{list_id}/add-to-campaign` | POST | list_id (path), campaign_id (UUID, body), creator_ids (list[UUID]|empty, body — empty means all). Auth: JWT, owner of both list and campaign. | `AddToCampaignResponse { added_count, skipped_count, skipped_creators: list[str], campaign_id, enrichment_pending_count }`. Side effects: populates outbox for non-DRAFT campaigns, starts enrichment workflow for creators without email. |

**CreatorListWithCountResponse fields** (verified from `src/models/api/creator_list.py`):
- id: UUID
- user_id: UUID
- title: str
- creator_count: int
- creators_without_email_count: int
- created_at: datetime
- updated_at: datetime

**CreatorInListResponse fields** (verified from source):
- id: UUID (list item ID)
- creator_id: UUID
- platform: str
- handle: str
- email: str | null
- email_status: str ("has_email" or "no_email")
- follower_count: int
- is_verified: bool
- location: str | null
- profile_data: dict
- profile_image_url: str | null (Supabase Storage public URL)
- added_at: datetime

**CreatorFromSearchData fields** (verified from `src/models/api/creator_list.py`):
- platform: str ("instagram" or "youtube")
- handle: str (min 1)
- name: str | null
- email: str | null
- follower_count: int (default 0)
- is_verified: bool (default false)
- avatar_url: str | null
- profile_url: str | null

**CsvCreatorRow fields** (verified):
- platform: str ("instagram", "tiktok", or "youtube")
- handle: str (min 1)
- email: str (min 1)
- follower_count: int | null

**Error handling** (verified from `creator_list.py`):
- 404: "List not found"
- 403: "Not authorized" (not owner of list)
- 404: "Campaign not found" (add-to-campaign)
- 403: "Not authorized for this campaign" (add-to-campaign, not owner)
- 404: "Creator not found in list" (remove)

---

### Creator Profiles — Public SEO (Domain 14 — `creator_profile.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 20 | List creator profiles (public) | `/v1/creators/profiles/` | GET | limit (int, 1-100, default 50), offset (int, min 0, default 0). **No auth required.** | `list[CreatorProfileSummary]` |
| 21 | Get creator profile (public) | `/v1/creators/profiles/{handle}` | GET | handle (str, path). **No auth required.** | `CreatorProfileDetail { profile: dict, metrics: dict, sponsorships: dict, content: dict, scrape_metadata: dict, execution_id: UUID, scraped_at: datetime }` |
| 22 | Trigger creator scrape | `/v1/creators/profiles/scrape` | POST | handle (str, "Instagram handle without @"), creator_data (dict|null, optional pre-provided context). **No auth required.** Returns 202 Accepted, scrape runs asynchronously via Claude agent + Apify. | `ScrapeResponse { status: "accepted", message: str, handle: str }` |

**CreatorProfileSummary fields**:
- username: str
- full_name: str
- avatar_url: str | null
- is_verified: bool (default false)
- primary_category: str | null
- followers: int (default 0)
- engagement_rate: float (default 0.0)
- engagement_band: str (default "unknown")
- scraped_at: datetime

**Note**: These are public SEO endpoints — no auth. They read from `CampaignWorkflowExecution` records produced by the "Creator Profile Scraping" workflow. Not directly relevant for the per-user context engine (but could be useful for the agent to look up public profiles).

---

### Creator Posts — Content Verification (Domain 16 — `creator_post.py`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 23 | List all posts | `/v1/posts` | GET | limit (int, 1-100, default 50), offset (int, min 0, default 0), sort ("asc"|"desc", default "desc"), search (str|null). Auth: JWT. Returns posts across all campaigns user has access to (via `get_accessible_campaign_ids`). | `PostLibraryResponse { posts: [PostLibraryItem], total: int }` |
| 24 | Get creator posts | `/v1/campaigns/{campaign_id}/creators/{creator_id}/posts` | GET | campaign_id (path), creator_id (path). Auth: JWT, owner or assigned member (via `can_access_campaign`). | `CreatorPostsResponse { posts: [CreatorPostResponse], total: int, last_checked_at: datetime|null, tracking_ends_at: datetime|null }` |
| 25 | Refresh creator posts | `/v1/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts` | POST | campaign_id (path), creator_id (path). Auth: JWT, owner or assigned member. Synchronous — fetches last 10 Instagram posts via Apify, analyzes each with LLM vision, creates matching posts. | `RefreshPostsResponse { posts_found: int, new_posts: int, last_checked_at: datetime }` |
| 26 | Delete post | `/v1/campaigns/{campaign_id}/posts/{post_id}` | DELETE | campaign_id (path), post_id (UUID, path). Auth: JWT, owner or assigned member. For removing false positives. | 204 No Content |

**PostLibraryItem fields** (verified from `src/models/api/creator_post.py`):
- id: UUID
- instagram_post_id: str
- post_type: str ("REEL", "POST", "CAROUSEL", "STORY")
- post_url: str
- caption: str | null
- media_url: str | null (Supabase Storage path)
- thumbnail_url: str | null
- like_count: int
- view_count: int | null
- comment_count: int
- posted_at: datetime | null
- matched_at: datetime
- match_method: str ("caption", "vision", "url")
- creator_name: str | null
- campaign_name: str | null
- campaign_id: UUID

**CreatorPostResponse fields** (same as above minus creator_name/campaign_name, plus):
- match_reason: str | null

**Error handling** (verified from `creator_post.py`):
- 404: "Campaign not found"
- 403: "Not authorized" (not owner/assigned)
- 404: "Creator not found"
- 400: "Creator has no Instagram handle" (refresh — no IG handle in social_media_handles)
- 400: "Campaign has no product for matching" (refresh — no product_id on campaign)
- 404: "Post not found" (delete — post doesn't exist or wrong campaign)

---

## Service Endpoint Coverage for Context Engine

The context engine currently calls 3 service endpoints for creators:

| Service Endpoint | CE Tool | Parameters |
|-----------------|---------|------------|
| `GET /api/service/campaigns/{campaign_id}/creators` | `cheerful_list_campaign_creators` | user_id, gifting_status, role, limit (max 100), offset |
| `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}` | `cheerful_get_campaign_creator` | user_id |
| `GET /api/service/creators/search` | `cheerful_search_campaign_creators` | user_id, query, campaign_id, limit (max 50) |

**New service endpoints needed**: The existing `/api/service/*` routes are all read-only. To support creator domain parity, new service endpoints (or service-auth alternatives for existing JWT endpoints) are needed for:

1. Creator enrichment status polling
2. Creator email override
3. Start/poll standalone enrichment
4. Creator search — similar (Influencer Club)
5. Creator search — keyword (Influencer Club)
6. Single creator enrichment (Influencer Club)
7. Creator profile fetching (Apify/IC, with cache)
8. Creator list CRUD
9. Creator list item management (add/remove/from-search/from-csv)
10. Creator list → campaign transfer
11. Creator post listing (all + per-creator)
12. Creator post refresh
13. Creator post deletion

---

## Summary

**Total creator-domain capabilities identified: 26**

| Sub-domain | Count | Existing CE Tools | Gap |
|-----------|-------|-------------------|-----|
| Campaign Creator Listing/Detail | 0 | 3 (list, get, search) | Already covered (read-only) |
| Campaign Creator Enrichment | 4 | 0 | 4 new tools |
| Creator Search & Discovery (IC) | 4 | 0 | 4 new tools |
| Creator Lists — CRUD | 5 | 0 | 5 new tools |
| Creator Lists — Items | 5 | 0 | 5 new tools (add, from-search, from-csv, remove, add-to-campaign) |
| Creator Profiles (Public SEO) | 3 | 0 | 2-3 new tools (public, lower priority for per-user CE) |
| Creator Posts (Content Verification) | 4 | 0 | 4 new tools |
| **TOTAL** | **26** (+ 3 existing) | **3** | **~23-24 new tools** |

### Discovered Aspects Not in Original Frontier

During source code analysis, the following were found:

1. **Creator Lists** — `creator_list.py` (648 lines) is a full CRUD+items management system not mentioned in the original frontier aspects. It has 11 endpoints covering list CRUD, item add/remove/from-search/from-csv, and list-to-campaign transfer. This is a major feature that needs dedicated tool coverage. **Recommendation**: Add this to w1-search or treat as part of w1-creators.

2. **Creator Posts / Content Verification** — `creator_post.py` (319 lines) is a post tracking system for verifying creator content delivery. Features: cross-campaign post library, per-creator post listing, manual post refresh (Apify + LLM vision analysis), false-positive deletion. **Recommendation**: This is a separate sub-domain that may warrant its own spec section or dedicated tools.

3. **Platform support**: Creator search supports both Instagram and YouTube platforms. YouTube uses a separate IC enrichment path (`enrich_creator_youtube`). TikTok appears in CSV upload but not in IC search. The `platform` parameter has different valid values per endpoint.

4. **Profile image storage**: When adding creators from search to a list, the system downloads and stores profile images in Supabase Storage with ETag-based deduplication. This is transparent to the tool layer but worth noting for the spec.

5. **Add-to-campaign cascade**: The `add-to-campaign` endpoint has significant side effects — populates outbox queue for non-DRAFT campaigns AND starts enrichment workflow for creators without email. The context engine tool must document these side effects.

6. **Public SEO endpoints**: Creator profile endpoints at `/v1/creators/profiles/*` are public (no auth required). These use workflow execution data from Claude agent scraping. While useful, they're separate from the per-user auth model. The CE could still expose them for profile lookup.

7. **Search limit hardcoded**: IC search returns max 10 results per page (hardcoded `_SEARCH_LIMIT = 10`). Pagination is page-based, not offset-based. `has_more = total > page * 10`.

8. **Service endpoint gaps**: The existing service endpoints lack `offset` parameter support in the CE tool definition (the service endpoint supports it but `ListCampaignCreatorsInput` only has `limit`, not `offset`). This should be corrected in the existing tool spec.
