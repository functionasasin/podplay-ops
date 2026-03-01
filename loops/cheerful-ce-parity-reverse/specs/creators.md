# Creators Domain — Tool Specifications

**Domain**: Creators
**Spec file**: `specs/creators.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: COMPLETE — full OpenAPI-level specs verified against source

---

## Table of Contents

1. [Campaign Creator Listing & Detail](#campaign-creator-listing--detail) (3 existing tools — audited)
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

---

## Campaign Creator Listing & Detail

### `cheerful_list_campaign_creators`

**Status**: EXISTS — audited and corrected

**Purpose**: List creators in a campaign with optional filtering by gifting status and role.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (user must own or be assigned to the campaign via `campaign_member_assignment`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign to list creators from |
| gifting_status | string | no | null | Filter by gifting status value (any valid gifting status string) |
| role | string | no | null | Filter by creator role. One of: "creator", "talent_manager", "agency_staff", "internal", "unknown" |
| limit | integer | no | 50 | Max results. Range: 1-100 |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID
- `limit` must be between 1 and 100

**AUDIT FINDINGS — Issues in current implementation**:
1. **Missing `offset` parameter**: The service endpoint at `service.py` line 215 accepts `offset: int` (default 0, min 0) but the tool's `ListCampaignCreatorsInput` model does NOT expose it. **Pagination is broken** — only the first page of results can be fetched. Must add `offset: int = Field(default=0, ge=0)` to the Input model and pass through to the API call.
2. **Missing `paid_promotion_status` filter**: The data model supports this field but there is no filter parameter for it. Consider adding for parity.
3. **XML formatter drops fields**: The formatter drops `status` and `slack_channel_id` fields from the response.

**Return Schema**:
```json
{
  "creators": [
    {
      "id": "uuid — campaign creator ID",
      "name": "string | null — creator's display name",
      "email": "string | null — email address (null if not yet enriched)",
      "role": "string — one of: creator, talent_manager, agency_staff, internal, unknown",
      "gifting_status": "string | null — gifting pipeline status",
      "paid_promotion_status": "string | null — paid promotion pipeline status",
      "latest_interaction_at": "datetime | null — last email interaction timestamp",
      "social_media_handles": [
        {
          "platform": "string — one of: instagram, twitter, facebook, youtube, tiktok, linkedin, other",
          "handle": "string — e.g., john_doe",
          "url": "string | null — explicit URL (not inferred from handle)"
        }
      ]
    }
  ],
  "total": "integer — total count matching filters"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found or user cannot access | Backend returns error | 404 or 403 |

**Pagination**: Offset-based (once `offset` bug is fixed). Default limit: 50, max: 100. Response includes `total` count.

**Example Request**:
```
cheerful_list_campaign_creators(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", gifting_status="sent", limit=25)
```

**Example Response**:
```json
{
  "creators": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Sarah Chen",
      "email": "sarah@example.com",
      "role": "creator",
      "gifting_status": "sent",
      "paid_promotion_status": null,
      "latest_interaction_at": "2026-02-28T14:30:00Z",
      "social_media_handles": [
        {"platform": "instagram", "handle": "sarahchen_style", "url": null},
        {"platform": "tiktok", "handle": "sarahchen", "url": null}
      ]
    }
  ],
  "total": 42
}
```

**Slack Formatting Notes**:
- Present as a numbered list: `{name} ({email}) — {role}, gifting: {status}`
- For large lists, summarize: "42 creators: 30 enriched, 8 pending, 4 not found"
- If `total` exceeds `limit`, indicate: "Showing {limit} of {total} — ask for next page"

**Edge Cases**:
- Campaign with zero creators returns `{"creators": [], "total": 0}`
- Filtering by gifting_status that no creator has returns empty list
- Social media handles array can be empty `[]`

---

### `cheerful_get_campaign_creator`

**Status**: EXISTS — audited and verified

**Purpose**: Get full detail for a specific campaign creator including enrichment data, addresses, discount codes, talent manager info, and notes history.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned (via campaign access check).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign the creator belongs to |
| creator_id | string (uuid) | yes | — | Campaign creator ID |

**Parameter Validation Rules**:
- Both must be valid UUIDs

**Return Schema** — `ServiceCampaignCreatorDetailResponse` (verified against `models/api/service.py`):

> **AUDIT CORRECTION (w3-existing-tools-audit)**: The previous spec version incorrectly listed `enrichment_status`, `source`, and `post_opt_in_follow_up_status` as return fields. These exist on the `CampaignCreator` DB model but are **NOT** included in `ServiceCampaignCreatorDetailResponse` — they are NOT serialized by the service endpoint. They will be absent from all API responses until the service model is enhanced. The example response below has also been corrected.

```json
{
  "id": "uuid — campaign creator UUID",
  "campaign_id": "uuid — campaign this creator belongs to",
  "name": "string | null — creator display name (null for newly-added creators)",
  "email": "string | null — email address (null if not yet enriched)",
  "role": "string — one of: creator, talent_manager, agency_staff, internal, unknown",
  "gifting_status": "string | null — gifting pipeline status",
  "gifting_address": "string | null — shipping address (free-form text or structured JSON)",
  "gifting_discount_code": "string | null — discount code assigned to creator",
  "paid_promotion_status": "string | null — paid promotion pipeline status",
  "paid_promotion_rate": "string | null — rate/pricing agreed for paid promotion",
  "talent_manager_name": "string | null — talent manager's name",
  "talent_manager_email": "string | null — talent manager's email address",
  "talent_agency": "string | null — talent agency name",
  "social_media_handles": [
    {
      "platform": "string — one of: instagram, twitter, facebook, youtube, tiktok, linkedin, other",
      "handle": "string — handle without @ prefix",
      "url": "string | null — explicit URL (not inferred from handle)"
    }
  ],
  "notes_history": [
    {
      "content": "string — note text (format varies by note source)"
    }
  ],
  "confidence_score": "float — email enrichment confidence score (0.0 if not enriched)",
  "manually_verified": "boolean — whether email was manually verified by a human",
  "latest_interaction_at": "string | null — last email interaction ISO 8601 timestamp (null if no interaction)",
  "created_at": "string | null — when creator was added to campaign (ISO 8601)",
  "updated_at": "string | null — last modification timestamp (ISO 8601)"
}
```

**Fields NOT in service response (require service route enhancement to expose)**:
- `enrichment_status` — available on `CampaignCreator` DB model, not serialized
- `source` — available on `CampaignCreator` DB model, not serialized
- `post_opt_in_follow_up_status` — available on `CampaignCreator` DB model, not serialized

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Creator not found in campaign | ToolError: "Creator '{creator_id}' not found in campaign '{campaign_id}'" (wraps 404 "Campaign creator not found") | 404 |
| Service API error | ToolError: "Failed to get creator ({status}): {body}" | varies |

**Example Request**:
```
cheerful_get_campaign_creator(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", creator_id="f47ac10b-58cc-4372-a567-0e02b2c3d479")
```

**Example Response** (corrected — no enrichment_status/source/post_opt_in_follow_up_status):
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Sarah Chen",
  "email": "sarah@example.com",
  "role": "creator",
  "gifting_status": "sent",
  "gifting_address": "123 Main St, Los Angeles, CA 90001",
  "gifting_discount_code": "SARAH20",
  "paid_promotion_status": null,
  "paid_promotion_rate": null,
  "talent_manager_name": null,
  "talent_manager_email": null,
  "talent_agency": null,
  "social_media_handles": [
    {"platform": "instagram", "handle": "sarahchen_style", "url": null}
  ],
  "notes_history": [
    {"content": "Confirmed interest in gifting collab"}
  ],
  "confidence_score": 0.95,
  "manually_verified": false,
  "latest_interaction_at": "2026-02-28T14:30:00Z",
  "created_at": "2026-02-01T09:00:00Z",
  "updated_at": "2026-02-28T14:30:00Z"
}
```

**Slack Formatting Notes**:
- Present as a structured profile card: name, email, role, social handles (as links)
- Key status fields in a summary line: "Gifting: {gifting_status} | Paid: {paid_promotion_status}"
- Notes history as a threaded reply if more than 2 notes
- Social handles with platforms shown as emoji: 📷 Instagram, 🎵 TikTok, ▶️ YouTube, etc.

**Edge Cases**:
- `notes_history` can be empty `[]`
- `social_media_handles` can be empty `[]`
- All nullable fields may be null simultaneously for newly-added creators
- `confidence_score` defaults to 0.0 (not null) even for unenriched creators — cannot distinguish unenriched from 0% confidence

---

### `cheerful_search_campaign_creators`

**Status**: EXISTS — audited, security gap documented

**Purpose**: Search campaign creators across all campaigns by name, email, or social media handle.

**Maps to**: `GET /api/service/creators/search`

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (searches across all user's campaigns). **SECURITY GAP**: The service endpoint sends `user_id` as a query param but the backend may not validate it — the search may return creators from ALL campaigns globally. This must be verified and fixed in the service route.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | yes | — | Search query — matches against name, email, social media handle |
| campaign_id | string (uuid) | no | null | Optional: limit search to a specific campaign |
| limit | integer | no | 20 | Max results. Range: 1-50 |

**Parameter Validation Rules**:
- `query` must be non-empty
- `limit` range: 1-50 (clamped at service endpoint level)
- `campaign_id` must be valid UUID if provided

**AUDIT FINDINGS — Issues in current implementation**:
1. **Missing `offset` parameter**: Service endpoint likely supports it but the Input model doesn't expose it. No pagination beyond first page.
2. **Security gap**: Service endpoint may not filter by `user_id` — need to verify that results are scoped to user's campaigns only.

**Return Schema**:
```json
{
  "results": [
    {
      "id": "uuid — campaign creator ID",
      "campaign_id": "uuid — which campaign this creator is in",
      "campaign_name": "string — name of the campaign",
      "name": "string | null — creator display name",
      "email": "string | null — email address",
      "role": "string — one of: creator, talent_manager, agency_staff, internal, unknown",
      "gifting_status": "string | null — gifting pipeline status",
      "social_media_handles": [
        {
          "platform": "string",
          "handle": "string",
          "url": "string | null"
        }
      ]
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_search_campaign_creators(query="sarah", limit=10)
```

**Example Response**:
```json
{
  "results": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "campaign_name": "Summer Skincare 2026",
      "name": "Sarah Chen",
      "email": "sarah@example.com",
      "role": "creator",
      "gifting_status": "sent",
      "social_media_handles": [
        {"platform": "instagram", "handle": "sarahchen_style", "url": null}
      ]
    }
  ]
}
```

**Slack Formatting Notes**:
- Group results by campaign: "In campaign 'Summer Skincare': Sarah Chen (sarah@example.com), ..."
- Show match context when possible

**Edge Cases**:
- Empty query string behavior: returns empty results
- Same creator in multiple campaigns appears as multiple results (one per campaign)

---

## Standalone Creator Enrichment

> These tools enrich creators by finding their email addresses. They operate on creator IDs (not campaign-scoped). For campaign-scoped enrichment status/override, see `specs/campaigns.md` (`cheerful_get_campaign_enrichment_status`, `cheerful_override_creator_email`).

### `cheerful_start_creator_enrichment`

**Status**: NEW

**Purpose**: Start an asynchronous email enrichment workflow for a batch of creators. Finds email addresses via multiple data providers (cache, Apify bio crawl, Influencer Club). Returns a workflow ID for polling.

**Maps to**: `POST /api/service/enrich-creators` (new service route needed; main route: `POST /v1/enrich-creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated. The workflow ID is namespaced to the user (`enrich-user-{user_id}-{8-char-hex}`) for ownership enforcement on status polling.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| creator_ids | uuid[] | yes | — | List of creator IDs to enrich. Min: 1, max: 500. Validated by Pydantic `max_length=500` |

**Parameter Validation Rules**:
- `creator_ids` must contain at least 1 UUID
- `creator_ids` must contain at most 500 UUIDs (Pydantic `max_length=500`)
- Each element must be a valid UUID

**Return Schema**:
```json
{
  "workflow_id": "string — Temporal workflow ID in format: enrich-user-{user_id}-{hex8}"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Empty creator_ids | Pydantic validation error | 422 |
| Too many creator_ids (>500) | Pydantic validation error | 422 |

**Side Effects**: Starts a Temporal `EnrichForCampaignWorkflow` with params `EnrichForCampaignParams(campaign_id=None, creator_ids=creator_ids)`. The workflow enriches each creator asynchronously — may take 1-6 minutes depending on batch size. Each creator is enriched via multiple providers: database cache, Apify bio crawl, Influencer Club API.

**Example Request**:
```
cheerful_start_creator_enrichment(creator_ids=["f47ac10b-58cc-4372-a567-0e02b2c3d479", "b23dc10b-48aa-4372-b567-1a02c3d4e580"])
```

**Example Response**:
```json
{
  "workflow_id": "enrich-user-550e8400-e29b-41d4-a716-446655440000-a1b2c3d4"
}
```

**Slack Formatting Notes**:
- Agent should confirm: "Started enrichment for {N} creators. I'll check on progress shortly."
- Follow up with status check after ~10 seconds (Slack latency makes faster polling pointless)

**Edge Cases**:
- Creators already enriched will be re-checked (workflow is idempotent)
- Some creator IDs may not exist in the database — the workflow handles this gracefully per-creator

---

### `cheerful_get_enrichment_workflow_status`

**Status**: NEW

**Purpose**: Poll the status of a running enrichment workflow. Returns current status and per-creator results when complete.

**Maps to**: `GET /api/service/enrich-creators/{workflow_id}/status` (new service route needed; main route: `GET /v1/enrich-creators/{workflow_id}/status`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only — enforced by checking `workflow_id.startswith(f"enrich-user-{user_id}")`. Returns 403 if the workflow ID prefix doesn't match the authenticated user.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_id | string | yes | — | Workflow ID returned by `cheerful_start_creator_enrichment` |

**Parameter Validation Rules**:
- `workflow_id` must be a non-empty string
- Must start with `enrich-user-{user_id}` where `user_id` is the authenticated user's ID

**Return Schema**:
```json
{
  "status": "string — one of: running, completed",
  "results": "array | null — null while status is 'running', populated when 'completed'",
  "results[].creator_id": "uuid — the creator that was enriched",
  "results[].handle": "string — creator's social media handle",
  "results[].platform": "string — platform of the handle (e.g., instagram, youtube)",
  "results[].status": "string — one of: success, no_email_found, profile_not_found, failed",
  "results[].email": "string | null — found email address (null if status is not 'success')",
  "results[].source": "string | null — where the email was found. One of: cache, apify, bio_crawl, influencer_club (null if no email found)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Workflow not owned by user | "Forbidden" | 403 |
| Workflow failed | "Workflow failed: {status}" (where status is Temporal workflow status name) | 500 |
| Result retrieval failed | "Failed to retrieve workflow result" | 500 |

**Polling Model**: Frontend polls every 2-3 seconds, max ~180 attempts (6 minute timeout). CE agent should poll every ~10 seconds (Slack latency makes faster polling pointless). If `status` is `"running"`, `results` is null — keep polling. If `status` is `"completed"`, `results` array contains per-creator outcomes.

**Example Request**:
```
cheerful_get_enrichment_workflow_status(workflow_id="enrich-user-550e8400-e29b-41d4-a716-446655440000-a1b2c3d4")
```

**Example Response (running)**:
```json
{
  "status": "running",
  "results": null
}
```

**Example Response (completed)**:
```json
{
  "status": "completed",
  "results": [
    {
      "creator_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "handle": "sarahchen_style",
      "platform": "instagram",
      "status": "success",
      "email": "sarah@example.com",
      "source": "influencer_club"
    },
    {
      "creator_id": "b23dc10b-48aa-4372-b567-1a02c3d4e580",
      "handle": "mikejones_fit",
      "platform": "instagram",
      "status": "no_email_found",
      "email": null,
      "source": null
    }
  ]
}
```

**Slack Formatting Notes**:
- When running: "Enrichment still in progress..."
- When complete: "Enrichment complete: {N} emails found, {M} not found."
- List found emails: "@{handle} → {email} (via {source})"
- List failures: "@{handle} — {status}"

**Edge Cases**:
- Workflow that was started but Temporal server is unavailable: returns 500
- Workflow ID from a different user: returns 403 immediately
- Completed workflow with all `no_email_found`: returns `status: "completed"` with empty email fields

---

## Creator Search & Discovery (Influencer Club)

> These tools search for and discover NEW creators via the Influencer Club (IC) external API at `https://api-dashboard.influencers.club`. They are distinct from `cheerful_search_campaign_creators` which searches creators already in your campaigns.

> **Rate limiting**: IC API has rate limits. Tools return 429 "Search service rate limit exceeded" when hit. The agent should wait and retry.

> **Search page size**: Hardcoded at 10 results per page (`_SEARCH_LIMIT = 10`). Pagination is page-based (`page=1, 2, 3...`), not offset-based.

> **IC API authentication**: Bearer token via `INFLUENCER_CLUB_API_KEY` env var. Service is lazily initialized — returns None if key is not set (resulting in 503 error).

### `cheerful_search_similar_creators`

**Status**: NEW

**Purpose**: Find creators similar to a given Instagram/YouTube handle. Uses Influencer Club's similarity algorithm to find creators with similar audience, content style, and niche.

**Maps to**: `POST /api/service/creator-search/similar` (new service route needed; main route: `POST /v1/creator-search/similar`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated. Backend uses JWT auth via `get_current_user` — new service route needs `verify_service_api_key` + `user_id` query param.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram or YouTube handle to find similar creators for. Length: 1-50 chars. Without @ prefix |
| platform | string | no | "instagram" | Platform to search. One of: "instagram", "youtube" |
| page | integer | no | 1 | Page number for pagination. Min: 1 |
| followers | object | no | null | Follower count range filter: `{"min": integer, "max": integer}`. Both fields optional within the object |
| engagement_rate | object | no | null | Engagement rate range filter: `{"min": float, "max": float}`. Both fields optional within the object |
| location | string[] | no | null | Location filter — list of location name strings (passed directly to IC API) |
| gender | string | no | null | Gender filter string (passed directly to IC API) |
| profile_language | string[] | no | null | Profile language filter — list of language code strings |

**Parameter Validation Rules**:
- `handle`: min 1 char, max 50 chars (Pydantic `Field(..., min_length=1, max_length=50)`)
- `page`: min 1 (Pydantic `Field(default=1, ge=1)`)
- `followers.min`, `followers.max`: both optional within the `RangeFilter` object
- `engagement_rate.min`, `engagement_rate.max`: both optional within the `RangeFilter` object

**Return Schema**:
```json
{
  "creators": [
    {
      "id": "string — IC user ID or fallback 'ic-{index}'",
      "username": "string — Instagram/YouTube handle",
      "full_name": "string | null — display name",
      "profile_pic_url": "string | null — profile picture URL",
      "follower_count": "integer | null — follower/subscriber count",
      "is_verified": "boolean — verification badge status (default: false)",
      "biography": "string | null — bio text",
      "email": "string | null — email if available from IC",
      "engagement_rate": "float | null — engagement rate percentage"
    }
  ],
  "total": "integer | null — total results across all pages (may be null if IC doesn't return it)",
  "provider": "string — always 'influencer_club'",
  "page": "integer — current page number",
  "has_more": "boolean — true if total > page * 10"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| IC API key not configured | "Creator search service is not configured." | 503 |
| IC rate limit hit | "Search service rate limit exceeded. Try again later." | 429 |
| IC auth failure (401/403) | "Search service is not properly configured." | 503 |
| Other IC API error | "Search service returned an error." | 502 |
| Unexpected exception | "Search failed unexpectedly." | 500 |

**Pagination**: Page-based. Fixed page size of 10 results. `has_more` = `(total or 0) > page * 10`. Next page: `page + 1`.

**Example Request**:
```
cheerful_search_similar_creators(handle="sarahchen_style", platform="instagram", page=1, followers={"min": 10000, "max": 500000})
```

**Example Response**:
```json
{
  "creators": [
    {
      "id": "ic-123456",
      "username": "jennabeauty",
      "full_name": "Jenna Kim",
      "profile_pic_url": "https://cdn.influencers.club/profiles/jennabeauty.jpg",
      "follower_count": 125000,
      "is_verified": true,
      "biography": "Beauty & skincare content creator | LA based",
      "email": "jenna@example.com",
      "engagement_rate": 3.2
    },
    {
      "id": "ic-789012",
      "username": "skincare_guru",
      "full_name": "Alex Torres",
      "profile_pic_url": null,
      "follower_count": 45000,
      "is_verified": false,
      "biography": "Esthetician sharing skincare tips",
      "email": null,
      "engagement_rate": 5.1
    }
  ],
  "total": 87,
  "provider": "influencer_club",
  "page": 1,
  "has_more": true
}
```

**Slack Formatting Notes**:
- Present results as a numbered list: `@{username} — {full_name} | {follower_count} followers | {engagement_rate}% ER`
- If email available, append: `(email: {email})`
- Show pagination: "Page {page} of ~{ceil(total/10)} — {total} total results"
- Offer to load next page

**Edge Cases**:
- `total` may be null if IC API doesn't return it — `has_more` will be false
- `id` field may be `"ic-0"`, `"ic-1"`, etc. if IC doesn't return `user_id`
- Empty results: `{"creators": [], "total": 0, "provider": "influencer_club", "page": 1, "has_more": false}`

---

### `cheerful_search_creators_by_keyword`

**Status**: NEW

**Purpose**: Search for creators by keyword/topic. Finds creators whose content, bio, or audience matches the keyword using IC's AI search.

**Maps to**: `POST /api/service/creator-search/keyword` (new service route needed; main route: `POST /v1/creator-search/keyword`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| keyword | string | yes | — | Search keyword or topic. Length: 1-200 chars. Sent as `ai_search` filter to IC API |
| platform | string | no | "instagram" | Platform to search. One of: "instagram", "youtube" |
| page | integer | no | 1 | Page number. Min: 1 |
| followers | object | no | null | Follower count range: `{"min": integer, "max": integer}` |
| engagement_rate | object | no | null | Engagement rate range: `{"min": float, "max": float}` |
| location | string[] | no | null | Location filter |
| gender | string | no | null | Gender filter |
| profile_language | string[] | no | null | Language filter |
| sort_by | string | no | "relevancy" | Sort field. IC API accepts any string; defaults to "relevancy" if null |
| sort_order | string | no | "desc" | Sort direction. Defaults to "desc" if null. Typically "asc" or "desc" |

**Parameter Validation Rules**:
- `keyword`: min 1 char, max 200 chars (Pydantic `Field(..., min_length=1, max_length=200)`)
- `page`: min 1 (Pydantic `Field(default=1, ge=1)`)
- `sort_by` and `sort_order` are optional strings with no enum validation — passed directly to IC API

**Return Schema**: Same as `cheerful_search_similar_creators` — `CreatorSearchResponse`.

**Error Responses**: Same as `cheerful_search_similar_creators`.

**Example Request**:
```
cheerful_search_creators_by_keyword(keyword="sustainable fashion", platform="instagram", page=1, followers={"min": 5000}, sort_by="relevancy", sort_order="desc")
```

**Example Response**:
```json
{
  "creators": [
    {
      "id": "ic-345678",
      "username": "eco_fashionista",
      "full_name": "Maya Green",
      "profile_pic_url": "https://cdn.influencers.club/profiles/eco_fashionista.jpg",
      "follower_count": 89000,
      "is_verified": false,
      "biography": "Sustainable fashion advocate | Thrift queen | NYC",
      "email": "maya@ecofashion.co",
      "engagement_rate": 4.7
    }
  ],
  "total": 42,
  "provider": "influencer_club",
  "page": 1,
  "has_more": true
}
```

**Slack Formatting Notes**:
- Same as similar search
- Prepend with keyword context: "Results for keyword '{keyword}':"
- Show page info and offer to load next page

**Edge Cases**:
- Very broad keywords may return many results — remind user to use filters
- `sort_by` values are not validated — invalid values may cause IC API errors (returned as 502)

---

### `cheerful_enrich_creator`

**Status**: NEW

**Purpose**: Enrich a single creator by handle — retrieves email address and basic profile data from Influencer Club. Supports both Instagram and YouTube (separate enrichment paths with different field mappings). This is a synchronous operation — returns immediately.

**Maps to**: `POST /api/service/creator-search/enrich` (new service route needed; main route: `POST /v1/creator-search/enrich`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Creator's handle (without @). Length: 1-50 chars |
| platform | string | no | "instagram" | Platform. One of: "instagram", "youtube". YouTube uses a separate IC enrichment path with different field mapping |

**Parameter Validation Rules**:
- `handle`: min 1 char, max 50 chars (Pydantic `Field(..., min_length=1, max_length=50)`)
- No explicit `@` stripping — user should provide handle without `@`

**Return Schema**:
```json
{
  "handle": "string — the handle that was enriched",
  "platform": "string — platform used for enrichment",
  "email": "string | null — found email address (null if IC couldn't find one)",
  "full_name": "string | null — display name (YouTube: maps from IC 'first_name' field)",
  "biography": "string | null — bio text (YouTube: maps from IC 'description' field)",
  "follower_count": "integer | null — followers (YouTube: maps from IC 'subscriber_count' field)",
  "following_count": "integer | null — following count (Instagram only — null for YouTube)",
  "profile_pic_url": "string | null — profile picture URL (YouTube: maps from IC 'picture' field)",
  "is_verified": "boolean — verification status (default: false; Instagram only — always false for YouTube)",
  "category": "string | null — content category (YouTube: maps from IC 'niche_class' field)",
  "city_name": "string | null — city/location (Instagram only — null for YouTube)",
  "external_url": "string | null — website URL (Instagram only — null for YouTube)",
  "engagement_rate": "float | null — engagement rate (YouTube: maps from IC 'engagement_percent' field)"
}
```

**Platform-specific field mapping**:

| Response Field | Instagram IC Source | YouTube IC Source |
|----------------|--------------------|--------------------|
| full_name | `full_name` | `first_name` |
| biography | `biography` | `description` |
| follower_count | `follower_count` | `subscriber_count` |
| following_count | `following_count` | *(not available)* |
| profile_pic_url | `profile_pic_url` (alias: `profile_picture`) | `picture` |
| is_verified | `is_verified` | *(always false)* |
| category | `category` | `niche_class` |
| city_name | `city_name` | *(not available)* |
| external_url | `external_url` | *(not available)* |
| engagement_rate | `engagement_rate` (alias: `engagement_percent`) | `engagement_percent` |

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| IC API key not configured | "Creator search service is not configured." | 503 |
| IC rate limit hit | "Search service rate limit exceeded. Try again later." | 429 |
| IC auth failure (401/403) | "Search service is not properly configured." | 503 |
| Other IC API error | "Search service returned an error." | 502 |
| Unexpected exception | "Enrichment failed unexpectedly." | 500 |

**Notes**:
- IC API calls use `email_required: "must_have"`, `include_lookalikes: false`, `include_audience_data: false`
- IC response nests platform data under a key matching the platform name; email may be at the top level and is merged into platform data if missing
- This returns enrichment data immediately (synchronous) — unlike `cheerful_start_creator_enrichment` which is async/batch
- No caching — each call queries IC API fresh

**Example Request**:
```
cheerful_enrich_creator(handle="sarahchen_style", platform="instagram")
```

**Example Response**:
```json
{
  "handle": "sarahchen_style",
  "platform": "instagram",
  "email": "sarah@example.com",
  "full_name": "Sarah Chen",
  "biography": "Skincare & beauty content creator | LA based",
  "follower_count": 125000,
  "following_count": 890,
  "profile_pic_url": "https://cdn.example.com/sarahchen.jpg",
  "is_verified": true,
  "category": "Beauty",
  "city_name": "Los Angeles",
  "external_url": "https://sarahchen.com",
  "engagement_rate": 3.2
}
```

**Slack Formatting Notes**:
- Present as a profile card: name, email (highlighted if found), followers, engagement rate
- If email is null: "No email found. Try batch enrichment (`cheerful_start_creator_enrichment`) which uses additional data providers."
- Indicate platform: "Instagram profile" or "YouTube channel"

**Edge Cases**:
- YouTube enrichment returns fewer fields (no following_count, city_name, external_url)
- Handle not found on IC: returns all-null fields with the handle echoed back
- IC has email at top level but not in platform data: email is merged correctly

---

### `cheerful_get_creator_profile`

**Status**: NEW

**Purpose**: Get a detailed creator profile including bio links and latest posts. Uses 24-hour cache with multiple fallback sources: fresh cache → Apify scrape → stale cache → IC enrichment fallback.

**Maps to**: `POST /api/service/creator-search/profile` (new service route needed; main route: `POST /v1/creator-search/profile`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Creator's handle (without @). Length: 1-50 chars. Leading `@` is automatically stripped by the backend |
| platform | string | no | "instagram" | Platform. One of: "instagram", "youtube" |
| refresh | boolean | no | false | Force bypass 24h cache and fetch fresh data from Apify (Instagram) or IC (YouTube) |

**Parameter Validation Rules**:
- `handle`: min 1 char, max 50 chars (Pydantic `Field(..., min_length=1, max_length=50)`)
- Handle is auto-normalized: `handle = request.handle.lstrip("@")`

**Return Schema**:
```json
{
  "handle": "string — normalized handle (@ stripped)",
  "platform": "string — instagram or youtube",
  "full_name": "string | null — display name (YouTube: from profile_data.channel_name)",
  "biography": "string | null — bio text (YouTube: from profile_data.description, Instagram: from profile_data.bio)",
  "follower_count": "integer | null — follower/subscriber count",
  "following_count": "integer | null — following count (Instagram only)",
  "media_count": "integer | null — total posts/videos (YouTube: from profile_data.video_count)",
  "profile_pic_url": "string | null — profile picture URL (YouTube: from profile_data.avatar_url)",
  "profile_pic_url_hd": "string | null — HD profile picture (Instagram only)",
  "is_verified": "boolean — verification badge (default: false)",
  "email": "string | null — email address if available",
  "category": "string | null — content category (YouTube: from profile_data.category)",
  "city_name": "string | null — city/location from Creator.location field",
  "external_url": "string | null — website URL (Instagram only)",
  "phone_number": "string | null — contact phone (Instagram only, from profile_data.contact_phone_number)",
  "is_business": "boolean — whether account is a business account (default: false, Instagram only)",
  "bio_links": [
    {
      "title": "string | null — link display text",
      "url": "string — the URL",
      "link_type": "string | null — type of link"
    }
  ],
  "latest_posts": [
    {
      "id": "string — post ID",
      "shortcode": "string | null — Instagram shortcode",
      "url": "string | null — post URL",
      "caption": "string | null — post caption text",
      "post_type": "string | null — type of post",
      "display_url": "string | null — image URL",
      "video_url": "string | null — video URL (for reels/videos)",
      "like_count": "integer — like count (default: 0)",
      "comment_count": "integer — comment count (default: 0)",
      "view_count": "integer | null — view count (for videos/reels)",
      "timestamp": "string | null — post timestamp (ISO format)",
      "is_sponsored": "boolean — whether post is sponsored (default: false)"
    }
  ],
  "source": "string — one of: cache, stale_cache, apify, influencer_club"
}
```

**Data source priority logic**:
1. If `refresh=false` and cache exists and `last_updated_at >= (now - 24h)`: return with `source="cache"`
2. If `refresh=false` and cache exists but stale: continue to fetch fresh, but keep stale as fallback
3. **YouTube**: Fetch via IC enrichment → save to Creator table → return with `source="influencer_club"`
4. **Instagram**: Fetch via Apify profile scraper → parse with `_parse_apify_profile()` → save to Creator table → return with `source="apify"`
5. If fresh fetch fails but stale cache exists: return stale cache with `source="cache"` (graceful degradation)
6. If no cache and fetch fails: return 404

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Instagram profile not found (no cache, no Apify result) | "Profile not found for @{handle}." | 404 |
| YouTube profile not found (no cache, IC enrichment failed) | "YouTube profile not found for @{handle}." | 404 |
| IC not configured (YouTube only) | "Creator search service is not configured." | 503 |
| Unexpected exception | "Profile fetch failed unexpectedly." | 500 |

**Example Request**:
```
cheerful_get_creator_profile(handle="sarahchen_style", platform="instagram", refresh=false)
```

**Example Response**:
```json
{
  "handle": "sarahchen_style",
  "platform": "instagram",
  "full_name": "Sarah Chen",
  "biography": "Skincare & beauty content creator | LA based | collab@sarahchen.com",
  "follower_count": 125000,
  "following_count": 890,
  "media_count": 342,
  "profile_pic_url": "https://cdn.example.com/sarahchen.jpg",
  "profile_pic_url_hd": "https://cdn.example.com/sarahchen_hd.jpg",
  "is_verified": true,
  "email": "sarah@example.com",
  "category": "Beauty",
  "city_name": "Los Angeles",
  "external_url": "https://sarahchen.com",
  "phone_number": null,
  "is_business": true,
  "bio_links": [
    {"title": "Shop My Faves", "url": "https://linktree.com/sarahchen", "link_type": "linktree"},
    {"title": null, "url": "https://sarahchen.com", "link_type": null}
  ],
  "latest_posts": [
    {
      "id": "3456789012",
      "shortcode": "CxYz123",
      "url": "https://www.instagram.com/p/CxYz123/",
      "caption": "My morning skincare routine ✨ #skincare #beauty",
      "post_type": "reel",
      "display_url": "https://cdn.instagram.com/v/display.jpg",
      "video_url": "https://cdn.instagram.com/v/video.mp4",
      "like_count": 4523,
      "comment_count": 89,
      "view_count": 45000,
      "timestamp": "2026-02-25T10:30:00Z",
      "is_sponsored": false
    }
  ],
  "source": "cache"
}
```

**Slack Formatting Notes**:
- Present as a rich profile card: name, handle, followers/following, engagement data
- Show bio links as clickable URLs
- Summarize recent posts: "{N} recent posts, avg {X} likes, {Y} comments"
- Indicate data freshness: "Data from {source}" — "stale_cache" means older than 24h, suggest refresh

**Edge Cases**:
- YouTube profiles return fewer fields (no following_count, profile_pic_url_hd, external_url, phone_number, is_business, bio_links, latest_posts may differ)
- `latest_posts` array can be empty
- `bio_links` array can be empty
- `source="stale_cache"` indicates data may be outdated — suggest `refresh=true`

---

## Creator Lists — CRUD

> Creator lists are user-owned collections for organizing creators before adding them to campaigns. All list operations are owner-only — no team sharing. Ownership is verified by `creator_list.user_id != user_id` check.

### `cheerful_list_creator_lists`

**Status**: NEW

**Purpose**: List all creator lists belonging to the current user, with creator counts and email status summary.

**Maps to**: `GET /api/service/lists` (new service route needed; main route: `GET /v1/lists/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (returns only user's own lists via `repo.get_by_user_id_with_counts(user_id)`).

**Parameters**: None user-facing — returns all lists for the authenticated user.

**Return Schema**:
```json
{
  "items": [
    {
      "id": "uuid — list ID",
      "user_id": "uuid — list owner's user ID",
      "title": "string — list name",
      "creator_count": "integer — total creators in list",
      "creators_without_email_count": "integer — creators missing email (default: 0)",
      "created_at": "datetime — when list was created",
      "updated_at": "datetime — last modification timestamp"
    }
  ],
  "total": "integer — total number of lists"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Example Request**:
```
cheerful_list_creator_lists()
```

**Example Response**:
```json
{
  "items": [
    {
      "id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Summer 2026 Skincare Creators",
      "creator_count": 45,
      "creators_without_email_count": 12,
      "created_at": "2026-02-01T09:00:00Z",
      "updated_at": "2026-02-28T14:30:00Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Fitness Influencers",
      "creator_count": 23,
      "creators_without_email_count": 5,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-02-20T11:00:00Z"
    }
  ],
  "total": 2
}
```

**Slack Formatting Notes**:
- Present as a summary table: `{title} — {creator_count} creators ({creators_without_email_count} missing email)`
- If no lists: "You have no creator lists. Create one with `cheerful_create_creator_list`."

**Edge Cases**:
- User with no lists: `{"items": [], "total": 0}`

---

### `cheerful_create_creator_list`

**Status**: NEW

**Purpose**: Create a new empty creator list.

**Maps to**: `POST /api/service/lists` (new service route needed; main route: `POST /v1/lists/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| title | string | yes | — | List name. Length: 1-255 chars (Pydantic `min_length=1, max_length=255`) |

**Parameter Validation Rules**:
- `title` must be between 1 and 255 characters

**Return Schema** (201 Created):
```json
{
  "id": "uuid — newly created list ID",
  "user_id": "uuid — owner's user ID",
  "title": "string — list name",
  "created_at": "datetime — creation timestamp",
  "updated_at": "datetime — same as created_at initially"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Title too short/long | Pydantic validation error | 422 |

**Example Request**:
```
cheerful_create_creator_list(title="Summer 2026 Skincare Creators")
```

**Example Response**:
```json
{
  "id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Summer 2026 Skincare Creators",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-01T10:00:00Z"
}
```

**Slack Formatting Notes**:
- Agent should confirm: "Created list '{title}'. Add creators with search, CSV, or by ID."

**Edge Cases**:
- Duplicate title: allowed — no unique constraint on `title`, multiple lists with the same name can exist
- Empty title: rejected with 422 Pydantic validation error (min_length=1)

---

### `cheerful_get_creator_list`

**Status**: NEW

**Purpose**: Get a single creator list by ID.

**Maps to**: `GET /api/service/lists/{list_id}` (new service route needed; main route: `GET /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only — checks `creator_list.user_id != user_id`, returns 403 if mismatch.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |

**Return Schema**:
```json
{
  "id": "uuid — list ID",
  "user_id": "uuid — owner's user ID",
  "title": "string — list name",
  "created_at": "datetime — creation timestamp",
  "updated_at": "datetime — last modification timestamp"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |

**Example Request**:
```
cheerful_get_creator_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Summer 2026 Skincare Creators",
  "created_at": "2026-02-10T09:00:00Z",
  "updated_at": "2026-02-28T14:30:00Z"
}
```

**Slack Formatting Notes**: Agent should display: "List: *{title}* (ID: `{id}`), last updated {updated_at}. Use `cheerful_list_creator_list_items` to see creators."

**Edge Cases**:
- List owned by another user: returns 403 "Not authorized" (not 404 — avoids information disclosure about the list's existence)
- List ID is a valid UUID but doesn't exist: 404 "List not found"

---

### `cheerful_update_creator_list`

**Status**: NEW

**Purpose**: Update a creator list's title.

**Maps to**: `PATCH /api/service/lists/{list_id}` (new service route needed; main route: `PATCH /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| title | string | no | null | New title. Length: 1-255 chars if provided. If null/omitted, title is unchanged |

**Parameter Validation Rules**:
- `title`: if provided, must be 1-255 chars (Pydantic `min_length=1, max_length=255`)
- `title`: if null, no update is made to the title field

**Return Schema**: Same as `cheerful_get_creator_list` (updated `CreatorListResponse`).

**Side Effects**: Updates `creator_list.updated_at = func.now()`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |
| Title too long | Pydantic validation error | 422 |

**Example Request**:
```
cheerful_update_creator_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", title="Winter 2026 Skincare Creators")
```

**Example Response**:
```json
{
  "id": "d1e2f3a4-b5c6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Winter 2026 Skincare Creators",
  "created_at": "2026-02-10T09:00:00Z",
  "updated_at": "2026-03-01T11:00:00Z"
}
```

**Slack Formatting Notes**: Agent should confirm: "Renamed list to *Winter 2026 Skincare Creators*."

**Edge Cases**:
- `title=null` or omitting title: no change is made (PATCH semantics), `updated_at` is NOT updated
- Same title as current: idempotent — `updated_at` IS updated to `func.now()` even when title unchanged
- Title exceeding 255 chars: rejected with 422 Pydantic validation error

---

### `cheerful_delete_creator_list`

**Status**: NEW

**Purpose**: Delete a creator list and all its items (cascading delete via `CreatorListItem` FK).

**Maps to**: `DELETE /api/service/lists/{list_id}` (new service route needed; main route: `DELETE /v1/lists/{list_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |

**Return Schema**: 204 No Content (success confirmation).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |

**Side Effects**: Deletes all `CreatorListItem` records associated with the list (cascading FK delete).

**Slack Formatting Notes**: Agent should confirm with list title for context: "Deleted list '{title}' and all its creators."

**Example Request**:
```
cheerful_delete_creator_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890")
```

**Example Response**: 204 No Content — empty body.

**Edge Cases**:
- All `CreatorListItem` records are cascade-deleted via FK constraint — all creator memberships in this list are removed
- The global `Creator` table records are NOT deleted — only the list and its membership records are removed
- Not idempotent: if the list doesn't exist (or was already deleted), returns 404 "List not found" (not 204)
- Irreversible: there is no undelete. Recreate the list and re-add creators if needed.

---

## Creator List Items

### `cheerful_list_creator_list_items`

**Status**: NEW

**Purpose**: List creators in a creator list with pagination. Returns profile data, email status, and platform details.

**Maps to**: `GET /api/service/lists/{list_id}/creators` (new service route needed; main route: `GET /v1/lists/{list_id}/creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (list must belong to user).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| limit | integer | no | 50 | Results per page. Range: 1-100 (Pydantic `Query(default=50, ge=1, le=100)`) |
| offset | integer | no | 0 | Pagination offset. Min: 0 (Pydantic `Query(default=0, ge=0)`) |

**Return Schema**:
```json
{
  "items": [
    {
      "id": "uuid — CreatorListItem ID (the join table record ID)",
      "creator_id": "uuid — global Creator ID",
      "platform": "string — platform name (e.g., instagram, youtube, tiktok)",
      "handle": "string — creator's handle on the platform",
      "email": "string | null — email address (null if not found yet)",
      "email_status": "string — one of: has_email, no_email (computed from email field presence)",
      "follower_count": "integer — follower count",
      "is_verified": "boolean — verification badge status",
      "location": "string | null — creator's location",
      "profile_data": "object — full platform-specific profile data dict (JSONB). Contains profile_pic_url, profile_url, full_name for search-added creators; varies by source",
      "profile_image_url": "string | null — Supabase Storage public URL of stored profile image (computed via image_service.get_public_url if profile_image_path exists)",
      "added_at": "datetime — when creator was added to this list (CreatorListItem.created_at)"
    }
  ],
  "total": "integer — total creators in list"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |

**Pagination**: Offset-based. Default limit: 50, max: 100. Response includes `total` count.

**Example Request**:
```
cheerful_list_creator_list_items(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", limit=25, offset=0)
```

**Example Response**:
```json
{
  "items": [
    {
      "id": "c1d2e3f4-a5b6-7890-cdef-123456789012",
      "creator_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "platform": "instagram",
      "handle": "sarahchen_style",
      "email": "sarah@example.com",
      "email_status": "has_email",
      "follower_count": 125000,
      "is_verified": true,
      "location": "Los Angeles",
      "profile_data": {"profile_pic_url": "https://cdn.example.com/sarah.jpg", "profile_url": "https://instagram.com/sarahchen_style", "full_name": "Sarah Chen"},
      "profile_image_url": "https://myproject.supabase.co/storage/v1/object/public/creator-images/instagram/sarahchen_style.jpg",
      "added_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": "d2e3f4a5-b6c7-8901-def0-234567890123",
      "creator_id": "b23dc10b-48aa-4372-b567-1a02c3d4e580",
      "platform": "instagram",
      "handle": "mikejones_fit",
      "email": null,
      "email_status": "no_email",
      "follower_count": 45000,
      "is_verified": false,
      "location": null,
      "profile_data": {},
      "profile_image_url": null,
      "added_at": "2026-02-16T11:00:00Z"
    }
  ],
  "total": 45
}
```

**Slack Formatting Notes**:
- Present as: `@{handle} ({platform}) — {email_status}, {follower_count} followers`
- Summarize: "{total} creators, {N} with email, {M} without"

**Edge Cases**:
- Empty list: `{"items": [], "total": 0}`
- `profile_data` structure varies by how the creator was added (search, CSV, or by ID)
- `profile_image_url` is only populated for creators added via "from-search" endpoint (which downloads images)

---

### `cheerful_add_creators_to_list`

**Status**: NEW

**Purpose**: Add existing creators (by global Creator ID) to a creator list. Skips duplicates.

**Maps to**: `POST /api/service/lists/{list_id}/creators` (new service route needed; main route: `POST /v1/lists/{list_id}/creators`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| creator_ids | uuid[] | yes | — | List of global Creator IDs to add. Min: 1 (Pydantic `min_length=1`) |

**Parameter Validation Rules**:
- `creator_ids` must contain at least 1 UUID

**Return Schema**:
```json
{
  "added_count": "integer — number of creators successfully added",
  "skipped_count": "integer — number skipped (already in list, duplicate)"
}
```

**Side Effects**: Updates `creator_list.updated_at = func.now()`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |
| Empty creator_ids | Pydantic validation error | 422 |

**Example Request**:
```
cheerful_add_creators_to_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", creator_ids=["f47ac10b-58cc-4372-a567-0e02b2c3d479", "b23dc10b-48aa-4372-b567-1a02c3d4e580"])
```

**Example Response**:
```json
{
  "added_count": 2,
  "skipped_count": 0
}
```

**Slack Formatting Notes**: Agent should report: "Added {added_count} creators to list. {skipped_count} already in list."

**Edge Cases**:
- All `creator_ids` already in list: returns `{"added_count": 0, "skipped_count": N}` — not an error
- Creator ID that doesn't exist in `Creator` table: DB FK constraint error — the backend does not pre-validate creator existence, an unknown UUID will cause a 500 error
- Duplicate IDs in the same request: the second occurrence will be skipped (ON CONFLICT DO NOTHING semantics)
- Empty `creator_ids` array: rejected with 422 Pydantic validation error (min_length=1)

---

### `cheerful_add_search_creators_to_list`

**Status**: NEW

**Purpose**: Add creators from Influencer Club search results to a list. Downloads and stores profile images with ETag-based deduplication. Uses PostgreSQL UPSERT to handle creator records — preserves existing email (COALESCE), keeps higher follower count (GREATEST).

**Maps to**: `POST /api/service/lists/{list_id}/creators/from-search` (new service route needed; main route: `POST /v1/lists/{list_id}/creators/from-search`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| creators | object[] | yes | — | Array of creator data from search results. Min: 1 (Pydantic `min_length=1`) |

**Creator object fields** (`CreatorFromSearchData`):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| platform | string | yes | — | One of: "instagram", "youtube" |
| handle | string | yes | — | Creator handle without @. Min length: 1 |
| name | string | no | null | Creator display name |
| email | string | no | null | Email address (if known from search enrichment) |
| follower_count | integer | no | 0 | Follower/subscriber count |
| is_verified | boolean | no | false | Verification badge status |
| avatar_url | string | no | null | Profile image URL (will be downloaded and stored in Supabase Storage with ETag dedup) |
| profile_url | string | no | null | Profile page URL |

**Return Schema**:
```json
{
  "added_count": "integer — creators successfully added to list",
  "skipped_count": "integer — creators skipped (already in list)"
}
```

**Side Effects**:
1. **Creator UPSERT**: Each creator is upserted into the global `Creator` table using `INSERT ... ON CONFLICT DO UPDATE` on the `(platform, handle)` unique constraint:
   - `email`: `COALESCE(existing_email, new_email)` — preserves existing email
   - `follower_count`: `GREATEST(existing, new)` — keeps higher count
   - `profile_image_path`: `COALESCE(new, existing)` — prefers newly downloaded image
   - `profile_image_etag`: `COALESCE(new, existing)` — prefers new ETag
   - `source`: set to `"search"` for new records
   - `profile_data`: dict with `profile_pic_url`, `profile_url`, `full_name`
2. **Profile image download**: For each creator with `avatar_url`, calls `image_service.download_and_store()` — downloads image and stores in Supabase Storage. Uses ETag for deduplication. Failures are logged as warnings and don't block the operation.
3. **List item creation**: Adds `CreatorListItem` records linking creators to the list
4. Updates `creator_list.updated_at = func.now()`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |
| Empty creators array | Pydantic validation error | 422 |

**Example Request**:
```
cheerful_add_search_creators_to_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", creators=[{"platform": "instagram", "handle": "jennabeauty", "name": "Jenna Kim", "email": "jenna@example.com", "follower_count": 125000, "is_verified": true, "avatar_url": "https://cdn.influencers.club/profiles/jennabeauty.jpg"}])
```

**Example Response**:
```json
{
  "added_count": 1,
  "skipped_count": 0
}
```

**Slack Formatting Notes**: Agent should confirm: "Added {added_count} creators from search to list."

**Edge Cases**:
- Image download failures are non-blocking — creator is still added, just without stored image
- If creator already exists in Creator table with an email, the existing email is preserved (COALESCE)
- If creator already in the list, they're counted as `skipped_count`

---

### `cheerful_add_csv_creators_to_list`

**Status**: NEW

**Purpose**: Add creators from CSV data to a list. Accepts structured creator rows with platform, handle, email, and optional follower count. Uses PostgreSQL UPSERT — overwrites email (unlike search import which preserves existing).

**Maps to**: `POST /api/service/lists/{list_id}/creators/from-csv` (new service route needed; main route: `POST /v1/lists/{list_id}/creators/from-csv`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| creators | object[] | yes | — | Array of CSV creator rows. Min: 1, max: 500 (Pydantic `min_length=1, max_length=500`) |

**CSV creator row fields** (`CsvCreatorRow`):

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| platform | string | yes | — | One of: "instagram", "tiktok", "youtube". Note: TikTok is supported here but NOT in IC search |
| handle | string | yes | — | Creator handle. Min length: 1 |
| email | string | yes | — | Email address. Min length: 1. Required for CSV import (unlike search import) |
| follower_count | integer | no | null | Follower count (optional). Stored as `follower_count or 0` |

**Parameter Validation Rules**:
- `creators` array: min 1, max 500 items
- `platform`: no enum validation in Pydantic — string value
- `handle`: min 1 char
- `email`: min 1 char

**Return Schema**:
```json
{
  "added_count": "integer — creators successfully added",
  "skipped_count": "integer — creators skipped (already in list)"
}
```

**Side Effects**:
1. **Creator UPSERT**: Each creator is upserted into global `Creator` table:
   - `email`: takes new value (overwrites existing — different from search import!)
   - `follower_count`: `GREATEST(existing, new)` — keeps higher count
   - `source`: set to `"csv"` for new records
   - No profile_data or image storage (CSV has no avatar info)
2. **List item creation**: Adds `CreatorListItem` records
3. Updates `creator_list.updated_at = func.now()`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |
| Too many creators (>500) | Pydantic validation error | 422 |
| Empty creators array | Pydantic validation error | 422 |

**Notes**:
- CSV import supports TikTok as a platform (unlike IC search which only supports Instagram and YouTube)
- Email is required for CSV import (unlike search import where email is optional)
- The agent should accept CSV text from Slack, parse it into the structured format, then call this tool

**Example Request**:
```
cheerful_add_csv_creators_to_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", creators=[{"platform": "instagram", "handle": "creator1", "email": "creator1@example.com", "follower_count": 50000}, {"platform": "tiktok", "handle": "creator2", "email": "creator2@example.com"}])
```

**Example Response**:
```json
{
  "added_count": 2,
  "skipped_count": 0
}
```

**Slack Formatting Notes**: Agent should confirm: "Added {added_count} creators from CSV. {skipped_count} duplicates skipped."

**Edge Cases**:
- `email` is required for CSV import (unlike search import where it's optional) — any row with empty email will fail Pydantic validation
- CSV import overwrites existing email in the `Creator` table (unlike search import which uses COALESCE to preserve existing email)
- TikTok platform is supported here (but not in IC search) — useful when you have TikTok handle data from external sources
- Max 500 rows per request; larger CSVs must be split into batches
- `follower_count` null in CSV: stored as 0 in the Creator table (`follower_count or 0`)

---

### `cheerful_remove_creator_from_list`

**Status**: NEW

**Purpose**: Remove a single creator from a creator list.

**Maps to**: `DELETE /api/service/lists/{list_id}/creators/{creator_id}` (new service route needed; main route: `DELETE /v1/lists/{list_id}/creators/{creator_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Creator list ID |
| creator_id | string (uuid) | yes | — | Global Creator ID to remove from the list |

**Return Schema**: 204 No Content.

**Side Effects**: Updates `creator_list.updated_at = func.now()`. The global `Creator` record is NOT deleted — only the `CreatorListItem` join record.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not owner | "Not authorized" | 403 |
| Creator not in list | "Creator not found in list" | 404 |

**Example Request**:
```
cheerful_remove_creator_from_list(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", creator_id="f47ac10b-58cc-4372-a567-0e02b2c3d479")
```

**Example Response**: 204 No Content — empty body.

**Slack Formatting Notes**: Agent should confirm: "Removed creator from the list. Their global profile is preserved (not deleted)."

**Edge Cases**:
- Creator not in this list: 404 "Creator not found in list" — not idempotent
- Creator exists in the `Creator` table but not in this specific list: same 404 response
- The global `Creator` record is preserved — only the `CreatorListItem` join table row is deleted
- `creator_list.updated_at` is updated to reflect the removal

---

## Creator List → Campaign Transfer

### `cheerful_add_list_creators_to_campaign`

**Status**: NEW

**Purpose**: Add creators from a creator list to a campaign. Optionally add all creators or a subset by ID. Triggers outbox population for non-DRAFT campaigns and starts enrichment for creators without email.

**Maps to**: `POST /api/service/lists/{list_id}/add-to-campaign` (new service route needed; main route: `POST /v1/lists/{list_id}/add-to-campaign`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner of BOTH the list AND the target campaign. Dual ownership check: `creator_list.user_id != user_id` (403 "Not authorized") and `campaign.user_id != user_id` (403 "Not authorized for this campaign").

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| list_id | string (uuid) | yes | — | Source creator list ID |
| campaign_id | string (uuid) | yes | — | Target campaign ID |
| creator_ids | uuid[] | no | [] (empty) | Specific global Creator IDs to add. Empty array = add ALL creators from the list (Pydantic `default_factory=list`) |

**Return Schema**:
```json
{
  "added_count": "integer — creators successfully added to campaign",
  "skipped_count": "integer — creators skipped (already in campaign or no email + duplicate handle)",
  "skipped_creators": "string[] — handles/names of skipped creators",
  "campaign_id": "uuid — target campaign ID",
  "enrichment_pending_count": "integer — creators queued for email enrichment (had no email, default: 0)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| List not found | "List not found" | 404 |
| Not list owner | "Not authorized" | 403 |
| Campaign not found | "Campaign not found" | 404 |
| Not campaign owner | "Not authorized for this campaign" | 403 |

**Side Effects** (critical — this is NOT just a data copy):
1. **Creator addition**: Creators WITH email are added to both `campaign_recipient` and `campaign_creator` tables (email-based dedup via idempotent insert). Creators WITHOUT email are added to `campaign_creator` only with `enrichment_status='pending'` (handle-based dedup).
2. **Queue population**: For non-DRAFT campaigns (status is ACTIVE, PAUSED, or COMPLETED), calls `populate_queue_for_campaign(db, campaign_id)` to queue initial outreach emails. If this raises `ValueError`, it's caught, logged as warning, and doesn't fail the operation.
3. **Enrichment workflow**: If any creators had no email (`enrichment_pending_ids` is non-empty), starts a Temporal `EnrichForCampaignWorkflow` **asynchronously after DB commit** with workflow ID format: `enrich-campaign-{campaign_id}-{hex8}`. Failures to start the workflow are caught and logged (don't fail the operation).
4. The `enrichment_pending_count` in the response tells the user how many creators need enrichment before emails can be sent.

**Example Request**:
```
cheerful_add_list_creators_to_campaign(list_id="d1e2f3a4-b5c6-7890-abcd-ef1234567890", campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", creator_ids=[])
```

**Example Response**:
```json
{
  "added_count": 38,
  "skipped_count": 7,
  "skipped_creators": ["@already_in_campaign", "@duplicate_handle"],
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "enrichment_pending_count": 12
}
```

**Slack Formatting Notes**:
- Agent MUST warn about side effects: "Added {added_count} creators to campaign '{name}'. {enrichment_pending_count} need email enrichment. {skipped_count} already in campaign."
- If campaign is non-DRAFT (ACTIVE), additionally warn: "Outbox emails have been queued for the newly added creators."
- If `enrichment_pending_count > 0`: "Enrichment workflow started — emails will be found automatically."

**Edge Cases**:
- Empty `creator_ids` array means ALL creators from the list are added
- Creators already in the campaign are silently skipped (counted in `skipped_count`)
- If queue population fails, the creators are still added (operation is not rolled back)
- If enrichment workflow fails to start, the creators are still added with `enrichment_status='pending'`

---

## Creator Posts (Content Verification)

> Creator posts track whether gifted/sponsored creators have actually posted about the brand's product. Posts are detected via Apify Instagram scraping + LLM vision analysis (Claude Sonnet).

> **CRITICAL CORRECTION from Wave 2**: Post types in the database are `"post"`, `"story"`, `"reel"` (lowercase, 3 values) — NOT `"REEL"`, `"POST"`, `"CAROUSEL"`, `"STORY"` as originally documented. Match methods are `"caption"`, `"llm"` (2 values) — NOT `"caption"`, `"vision"`, `"url"`.

### `cheerful_list_posts`

**Status**: NEW

**Purpose**: List all tracked creator posts across the user's campaigns (the "Post Library" view). Supports search and pagination.

**Maps to**: `GET /api/service/posts` (new service route needed; main route: `GET /v1/posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (returns posts only from campaigns the user owns or is assigned to, via `CampaignMemberAssignmentRepository.get_accessible_campaign_ids(user_id)` which returns UNION of owned + assigned campaigns).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | no | 50 | Results per page. Range: 1-100 (Pydantic `Query(default=50, ge=1, le=100)`) |
| offset | integer | no | 0 | Pagination offset. Min: 0 (Pydantic `Query(default=0, ge=0)`) |
| sort | enum | no | "desc" | Sort by `matched_at` timestamp. One of: "asc", "desc" (Pydantic `Literal["asc", "desc"]`) |
| search | string | no | null | Text search — filters by creator name using case-insensitive ILIKE (`CampaignCreator.name ILIKE %search%`). Does NOT search caption or campaign name |

**Return Schema**:
```json
{
  "posts": [
    {
      "id": "uuid — post record ID",
      "instagram_post_id": "string — Instagram's post ID",
      "post_type": "string — one of: post, story, reel",
      "post_url": "string — Instagram post URL",
      "caption": "string | null — post caption text",
      "media_url": "string | null — Supabase Storage permanent URL for stored media",
      "thumbnail_url": "string | null — thumbnail URL",
      "like_count": "integer — like count (default: 0)",
      "view_count": "integer | null — view count (for reels/videos, null for static posts)",
      "comment_count": "integer — comment count (default: 0)",
      "posted_at": "datetime | null — when the post was published on Instagram",
      "matched_at": "datetime — when the system detected/matched the post",
      "match_method": "string — one of: caption, llm",
      "creator_name": "string | null — name of the campaign creator (joined from CampaignCreator)",
      "campaign_name": "string | null — name of the campaign (joined from Campaign)",
      "campaign_id": "uuid — campaign this post belongs to"
    }
  ],
  "total": "integer — total matching posts across accessible campaigns"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Pagination**: Offset-based. Default limit: 50, max: 100. Response includes `total` count.

**Example Request**:
```
cheerful_list_posts(limit=25, offset=0, sort="desc", search="sarah")
```

**Example Response**:
```json
{
  "posts": [
    {
      "id": "e1f2a3b4-c5d6-7890-ef01-234567890abc",
      "instagram_post_id": "3456789012",
      "post_type": "reel",
      "post_url": "https://www.instagram.com/reel/CxYz123/",
      "caption": "Love this new serum from @brandname! My skin has never felt better ✨",
      "media_url": "https://myproject.supabase.co/storage/v1/object/public/post-media/posts/3456789012/media.mp4",
      "thumbnail_url": null,
      "like_count": 4523,
      "view_count": 45000,
      "comment_count": 89,
      "posted_at": "2026-02-25T10:30:00Z",
      "matched_at": "2026-02-25T12:00:00Z",
      "match_method": "caption",
      "creator_name": "Sarah Chen",
      "campaign_name": "Summer Skincare 2026",
      "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ],
  "total": 15
}
```

**Slack Formatting Notes**:
- Present as: `{creator_name} posted a {post_type} for '{campaign_name}' — {like_count} likes, {comment_count} comments (matched via {match_method})`
- Summarize large results: "{total} posts across {N} campaigns"
- Include post URL for context

**Edge Cases**:
- User with no accessible campaigns: returns `{"posts": [], "total": 0}`
- `search` filter only matches `creator_name`, not caption or campaign name
- `media_url` may be null if media download failed during refresh

---

### `cheerful_list_creator_posts`

**Status**: NEW

**Purpose**: List tracked posts for a specific creator within a specific campaign. Includes tracking metadata (when posts were last checked, when tracking ends).

**Maps to**: `GET /api/service/campaigns/{campaign_id}/creators/{creator_id}/posts` (new service route needed; main route: `GET /v1/campaigns/{campaign_id}/creators/{creator_id}/posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned (via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)` — returns true if user owns or is assigned to the campaign).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign ID |
| creator_id | string (uuid) | yes | — | Campaign creator ID |

**Return Schema**:
```json
{
  "posts": [
    {
      "id": "uuid — post record ID",
      "instagram_post_id": "string — Instagram's post ID",
      "post_type": "string — one of: post, story, reel",
      "post_url": "string — Instagram post URL",
      "caption": "string | null — post caption text",
      "media_url": "string | null — Supabase Storage URL",
      "thumbnail_url": "string | null — thumbnail URL",
      "like_count": "integer — like count (default: 0)",
      "view_count": "integer | null — view count (null for static posts)",
      "comment_count": "integer — comment count (default: 0)",
      "posted_at": "datetime | null — when published on Instagram",
      "matched_at": "datetime — when system detected the post",
      "match_method": "string — one of: caption, llm",
      "match_reason": "string | null — explanation of why the post was matched (e.g., 'Product name found in caption' or LLM's reason)"
    }
  ],
  "total": "integer — total posts for this creator",
  "last_checked_at": "datetime | null — when posts were last refreshed (from CampaignCreator.post_last_checked_at)",
  "tracking_ends_at": "datetime | null — when automatic tracking stops (from CampaignCreator.post_tracking_ends_at)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| Not authorized (user cannot access campaign) | "Not authorized" | 403 |
| Creator not found (wrong ID or wrong campaign) | "Creator not found" | 404 |

**Note**: Creator existence is verified via `CampaignCreatorRepository.get_by_id(creator_id)` which raises `ApplicationError` if not found, then additionally checks `creator.campaign_id == campaign_id`.

**Example Request**:
```
cheerful_list_creator_posts(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", creator_id="f47ac10b-58cc-4372-a567-0e02b2c3d479")
```

**Example Response**:
```json
{
  "posts": [
    {
      "id": "e1f2a3b4-c5d6-7890-ef01-234567890abc",
      "instagram_post_id": "3456789012",
      "post_type": "reel",
      "post_url": "https://www.instagram.com/reel/CxYz123/",
      "caption": "Love this serum from @brandname!",
      "media_url": "https://myproject.supabase.co/storage/v1/object/public/post-media/posts/3456789012/media.mp4",
      "thumbnail_url": null,
      "like_count": 4523,
      "view_count": 45000,
      "comment_count": 89,
      "posted_at": "2026-02-25T10:30:00Z",
      "matched_at": "2026-02-25T12:00:00Z",
      "match_method": "caption",
      "match_reason": "Product name found in caption"
    }
  ],
  "total": 3,
  "last_checked_at": "2026-02-28T10:00:00Z",
  "tracking_ends_at": "2026-04-01T00:00:00Z"
}
```

**Slack Formatting Notes**:
- Present posts with engagement metrics
- Include tracking status: "Last checked: {date}. Tracking until: {date}."
- If no posts: "No posts detected yet for this creator. Last checked: {date}."

**Edge Cases**:
- Creator with no posts: `{"posts": [], "total": 0, "last_checked_at": null, "tracking_ends_at": null}`
- `last_checked_at` is null if posts have never been refreshed
- `tracking_ends_at` is null if no tracking end date is set

---

### `cheerful_refresh_creator_posts`

**Status**: NEW

**Purpose**: Manually trigger a post refresh for a creator. Fetches the last 10 Instagram posts via Apify, then analyzes each with a two-phase matching system: (1) caption match (fast, free), (2) Claude Sonnet LLM vision analysis (fallback). Synchronous — blocks until complete.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts` (new service route needed; main route: `POST /v1/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign ID |
| creator_id | string (uuid) | yes | — | Campaign creator ID |

**Return Schema**:
```json
{
  "posts_found": "integer — total posts for this creator after refresh (count from DB)",
  "new_posts": "integer — new posts that matched the campaign product (newly detected in this refresh)",
  "last_checked_at": "datetime — updated timestamp (set to current UTC time)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| Not authorized | "Not authorized" | 403 |
| Creator not found (or wrong campaign) | "Creator not found" | 404 |
| Creator has no Instagram handle in social_media_handles | "Creator has no Instagram handle" | 400 |
| Campaign has no product_id configured | "Campaign has no product for matching" | 400 |

**Processing Pipeline** (synchronous, 10-30 seconds):
1. Extract Instagram handle from `creator.social_media_handles`
2. Fetch last 10 posts via Apify actor `"apify/instagram-profile-scraper"`
3. Get product name and description from `ProductRepository.get_by_id(campaign.product_id)`
4. For each post:
   a. **Dedup check**: Skip if `instagram_post_id` already exists for this creator (composite unique constraint)
   b. **Phase 1 — Caption match**: Check if `product_name.lower()` appears in `caption.lower()`. If yes: `match_method="caption"`
   c. **Phase 2 — LLM vision**: If caption doesn't match, download post image/video, encode to base64, send to Claude Sonnet with analysis prompt asking "YES/NO does this post feature {product_name}?". If YES: `match_method="llm"`
   d. If matched: download media to Supabase Storage, create `CreatorPost` record (caption capped at 500 chars), upsert to DB
5. Update `CampaignCreator.post_last_checked_at = datetime.utcnow()`
6. Return total count and new matches

**Apify post type normalization**:
- "story" in type → `"story"`
- "video" or "reel" in type → `"reel"`
- else → `"post"`

**Example Request**:
```
cheerful_refresh_creator_posts(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", creator_id="f47ac10b-58cc-4372-a567-0e02b2c3d479")
```

**Example Response**:
```json
{
  "posts_found": 5,
  "new_posts": 2,
  "last_checked_at": "2026-03-01T10:30:00Z"
}
```

**Slack Formatting Notes**:
- Agent should warn about processing time: "Refreshing posts for @{handle}... this may take 10-30 seconds."
- Then report: "Found {posts_found} total posts, {new_posts} new matches detected."

**Edge Cases**:
- Apify scrape returns empty list (account private, deleted, etc.): `new_posts=0`, `posts_found` is previous count
- LLM analysis errors: post is conservatively NOT matched (returns `matches=False`)
- Media download failures: post is still created but `media_url` is null
- All 10 posts already seen: `new_posts=0`
- Post caption longer than 500 chars: truncated to 500 chars in storage

---

### `cheerful_delete_post`

**Status**: NEW

**Purpose**: Delete a tracked post (false positive removal). For cases where the matching system incorrectly flagged a post as containing the brand's product.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}/posts/{post_id}` (new service route needed; main route: `DELETE /v1/campaigns/{campaign_id}/posts/{post_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | string (uuid) | yes | — | Campaign ID |
| post_id | string (uuid) | yes | — | Post ID to delete |

**Return Schema**: 204 No Content.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| Not authorized | "Not authorized" | 403 |
| Post not found (or belongs to different campaign) | "Post not found" | 404 |

**Note**: Post ownership is verified by checking `post.campaign_id == campaign_id`. If the post exists but belongs to a different campaign, 404 "Post not found" is returned (not 403).

**Example Request**:
```
cheerful_delete_post(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", post_id="e1f2a3b4-c5d6-7890-ef01-234567890abc")
```

**Example Response**: 204 No Content — empty body.

**Slack Formatting Notes**: Agent should confirm with context: "Deleted post (matched via {method}). Marked as false positive."

**Edge Cases**:
- Post belongs to a different campaign: returns 404 "Post not found" (not 403) — backend checks `post.campaign_id == campaign_id`; a mismatch returns 404 to avoid revealing the post's existence in other campaigns
- Deleting a correctly matched post by mistake: irreversible. Use `cheerful_refresh_creator_posts` to re-detect posts (the post may be re-matched if still visible on Instagram)
- No soft-delete: the `CampaignCreatorPost` record is permanently removed from the database

---

## Public Creator Profiles (SEO)

> These endpoints are public — no authentication required. They serve creator profile data from the "Creator Profile Scraping" workflow (Claude agent + Apify). While not user-scoped, they're useful for the CE agent to look up public creator information. Data is stored in `CampaignWorkflowExecution` records with `workflow.name == "Creator Profile Scraping"`.

> **Note**: All Pydantic models for these endpoints are defined inline in `creator_profile.py`, not in a separate models file.

### `cheerful_list_public_creator_profiles`

**Status**: NEW

**Purpose**: List publicly available creator profiles. Returns summaries with key metrics. No auth required.

**Maps to**: `GET /api/service/creators/profiles` (new service route needed; main route: `GET /v1/creators/profiles/`)

**Auth**: None required — public endpoint. The CE still uses service auth for routing consistency.

**Parameters** (user-facing):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | no | 50 | Results per page. Range: 1-100 (Pydantic `Query(50, ge=1, le=100)`) |
| offset | integer | no | 0 | Pagination offset. Min: 0 (Pydantic `Query(0, ge=0)`) |

**Return Schema**: Array of `CreatorProfileSummary`:
```json
[
  {
    "username": "string — Instagram username",
    "full_name": "string — creator's full name",
    "avatar_url": "string | null — profile picture URL",
    "is_verified": "boolean — verification badge (default: false)",
    "primary_category": "string | null — primary content category (e.g., 'Lifestyle', 'Beauty')",
    "followers": "integer — follower count (default: 0)",
    "engagement_rate": "float — engagement rate percentage (default: 0.0)",
    "engagement_band": "string — engagement band level (default: 'unknown')",
    "scraped_at": "datetime — when the profile was scraped"
  }
]
```

**Note**: Response is a bare `list[CreatorProfileSummary]`, NOT wrapped in an object. No `total` count is returned.

**Database query**: Uses `DISTINCT ON (username)` to deduplicate by creator, returning only the latest scrape per creator. Filters to `workflow.name == "Creator Profile Scraping"` and `status == "completed"`. Skips records with null `output_data`.

**Error Responses**: None — returns empty list `[]` if no profiles exist.

**Example Request**:
```
cheerful_list_public_creator_profiles(limit=10, offset=0)
```

**Example Response**:
```json
[
  {
    "username": "sarahchen_style",
    "full_name": "Sarah Chen",
    "avatar_url": "https://cdn.example.com/sarah.jpg",
    "is_verified": true,
    "primary_category": "Beauty",
    "followers": 125000,
    "engagement_rate": 3.2,
    "engagement_band": "high",
    "scraped_at": "2026-02-25T10:00:00Z"
  }
]
```

**Slack Formatting Notes**: Present as a browse list: `@{username} ({full_name}) — {followers} followers, {engagement_rate}% ER, category: {primary_category}`

**Edge Cases**:
- No scraped profiles exist: returns empty list `[]` (not 404)
- Only creators with `status == "completed"` workflow executions appear — in-progress or errored scrapes are excluded
- Multiple scrapes of the same creator are deduplicated via `DISTINCT ON (username)` — only the latest appears
- `primary_category` and `avatar_url` may be null for profiles with incomplete scrape data
- Pagination: no `total` count returned — iterate with offset until empty list is returned

---

### `cheerful_get_public_creator_profile`

**Status**: NEW

**Purpose**: Get a single publicly available creator profile by Instagram handle. Returns rich profile data, metrics, sponsorships, and content analysis from the "Creator Profile Scraping" workflow output.

**Maps to**: `GET /api/service/creators/profiles/{handle}` (new service route needed; main route: `GET /v1/creators/profiles/{handle}`)

**Auth**: None required — public endpoint.

**Parameters** (user-facing):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram handle (without @) |

**Return Schema**:
```json
{
  "profile": "object — basic profile data from workflow output_data['profile']. Contains: username (str), full_name (str), avatar_url (str|null), is_verified (bool), primary_category (str|null)",
  "metrics": "object — engagement metrics from output_data['metrics']. Contains: followers (int), engagement_rate (float), engagement_band (str). Default: {}",
  "sponsorships": "object — detected brand partnerships from output_data['sponsorships']. Contains: sponsors (list[str]), total_sponsors_count (int). Default: {}",
  "content": "object — content analysis from output_data['content']. Contains: recent_posts (list), other analysis fields. Default: {}",
  "scrape_metadata": "object — scraping run details from output_data['scrape_metadata']. Contains: source (str), other context. Default: {}",
  "execution_id": "uuid — workflow execution ID",
  "scraped_at": "datetime — when the profile was scraped"
}
```

**Note**: The nested `profile`, `metrics`, `sponsorships`, `content`, and `scrape_metadata` fields are dicts (JSONB), not strongly typed. Their internal structure depends on the Claude agent's scraping workflow output. The fields listed above are typical but may vary.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| Profile not found | "Creator profile not found for handle: {handle}" | 404 |

**Note**: Error message uses `handle:` (no @ prefix), unlike the private profile endpoint which uses `@{handle}`.

**Example Request**:
```
cheerful_get_public_creator_profile(handle="sarahchen_style")
```

**Example Response**:
```json
{
  "profile": {
    "username": "sarahchen_style",
    "full_name": "Sarah Chen",
    "avatar_url": "https://cdn.example.com/sarah.jpg",
    "is_verified": true,
    "primary_category": "Beauty"
  },
  "metrics": {
    "followers": 125000,
    "engagement_rate": 3.2,
    "engagement_band": "high"
  },
  "sponsorships": {
    "sponsors": ["BrandX", "SkincareCo", "BeautyLab"],
    "total_sponsors_count": 3
  },
  "content": {
    "recent_posts": []
  },
  "scrape_metadata": {
    "source": "apify"
  },
  "execution_id": "c1d2e3f4-a5b6-7890-cdef-123456789012",
  "scraped_at": "2026-02-25T10:00:00Z"
}
```

**Slack Formatting Notes**: Present as a comprehensive profile card with metrics summary, content themes, and detected sponsorships.

**Edge Cases**:
- Not all creators have been scraped — only those with a completed "Creator Profile Scraping" workflow execution
- Profile data is point-in-time (as of `scraped_at`), not live
- Multiple scrapes of the same creator: returns the most recent (latest `executed_at`)

---

### `cheerful_trigger_creator_scrape`

**Status**: NEW

**Purpose**: Trigger an asynchronous creator profile scrape. The system will scrape the creator's Instagram profile via Apify and analyze it with a Claude agent. Returns immediately with 202 Accepted. Uses FastAPI `BackgroundTasks` (not Temporal).

**Maps to**: `POST /api/service/creators/profiles/scrape` (new service route needed; main route: `POST /v1/creators/profiles/scrape`)

**Auth**: None required — public endpoint. No auth means any service can trigger scrapes.

**Parameters** (user-facing):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| handle | string | yes | — | Instagram handle (without @) |
| creator_data | object | no | null | Optional pre-provided context about the creator (passed to the Claude analysis agent to augment the scrape) |

**Return Schema** (202 Accepted):
```json
{
  "status": "string — 'accepted'",
  "message": "string — human-readable confirmation (e.g., 'Scrape triggered for @{handle}')",
  "handle": "string — the requested handle"
}
```

**Background Processing**:
1. Loads "Creator Profile Scraping" workflow configuration from database
2. Creates synthetic thread context with handle and optional `creator_data`
3. Sets up MCP server with Apify tools: `apify_get_instagram_profile`, `apify_get_instagram_posts`
4. Executes Claude agent with workflow, tools, and thread context
5. Saves execution as `CampaignWorkflowExecution` with:
   - `temporal_workflow_id`: `"api-scrape-{handle}-{hex8}"`
   - `output_data`: structured data from Claude agent analysis
   - `status`: from agent result
   - `gmail_thread_state_id`: null (API-triggered, no email thread)

**Error Responses**: None at request time (returns 202 immediately). Background failures are logged.

**Notes**:
- No callback/polling endpoint for scrape status — use `cheerful_get_public_creator_profile` later to check if the profile has been populated
- The Claude agent analyzes the scraped data to produce structured metrics, sponsorship detection, and content analysis
- Background task may return null if the workflow is not found in the database

**Example Request**:
```
cheerful_trigger_creator_scrape(handle="sarahchen_style", creator_data={"known_brands": ["BrandX"]})
```

**Example Response**:
```json
{
  "status": "accepted",
  "message": "Scrape triggered for @sarahchen_style",
  "handle": "sarahchen_style"
}
```

**Slack Formatting Notes**: Agent should confirm: "Scrape triggered for @{handle}. Check back in a few minutes for the profile."

**Edge Cases**:
- Workflow config not found in DB: background task silently returns null; no error surfaced to client — call still returns 202
- Handle doesn't exist on Instagram: Apify returns empty data; Claude agent produces minimal or empty `output_data`
- Re-triggering for same handle: creates a new `CampaignWorkflowExecution` record — does not deduplicate; use `cheerful_get_public_creator_profile` to check if a recent scrape already exists before triggering again
- No polling endpoint: client receives 202 immediately; typically 2-5 minutes before results are available via `cheerful_get_public_creator_profile`
- `creator_data` context: only used as supplementary information for the Claude agent — it does not override scraped data, just augments the analysis

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

### Key Enums (Verified Against Source)

| Enum | Values | Source File |
|------|--------|-------------|
| CampaignCreator.role | creator, talent_manager, agency_staff, internal, unknown | `models/database/campaign_creator.py` |
| CampaignCreator.enrichment_status | pending, enriching, enriched, not_found | `models/database/campaign_creator.py` |
| CampaignCreator.source | email, csv, search, sheet, list, api | `models/database/campaign_creator.py` |
| PostOptInFollowUpStatus | PENDING, PROCESSING, SENT, FAILED, CANCELLED | `models/database/campaign_creator.py` |
| EnrichmentAttemptStatus | success, no_email_found, profile_not_found, failed | `models/enums/enrichment.py` |
| Enrichment source | cache, apify, bio_crawl, influencer_club | `models/temporal/enrich_for_campaign.py` |
| CreatorPost.post_type | post, story, reel | `models/database/creator_post.py` (Literal type) |
| CreatorPost.match_method | caption, llm | `models/database/creator_post.py` (Literal type) |
| Email status (list) | has_email, no_email | `models/api/creator_list.py` (computed) |
| Profile source (search) | cache, stale_cache, apify, influencer_club | `models/api/influencer_club.py` |
| SocialMediaHandle platform | instagram, twitter, facebook, youtube, tiktok, linkedin, other | shared schema |
| CSV platform | instagram, tiktok, youtube | `models/api/creator_list.py` |
| Search platform | instagram, youtube | `models/api/influencer_club.py` |

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

### Key Corrections from Wave 2 Skeletons

1. **Post types**: Database uses `"post"`, `"story"`, `"reel"` (lowercase, 3 values) — NOT `"REEL"`, `"POST"`, `"CAROUSEL"`, `"STORY"` (4 values). The "CAROUSEL" type does not exist in the database model.
2. **Match methods**: Database uses `"caption"`, `"llm"` (2 values) — NOT `"caption"`, `"vision"`, `"url"` (3 values). The "vision" match is actually `"llm"` and "url" match does not exist as a separate method.
3. **Enrichment results**: `EnrichmentStatusResponse.results` items have additional fields not in Wave 2 skeleton: `handle` (str), `platform` (str), `status` (EnrichmentAttemptStatus: success/no_email_found/profile_not_found/failed), `source` (str|null: cache/apify/bio_crawl/influencer_club).
4. **Keyword search sort defaults**: `sort_by` defaults to `"relevancy"` (not null), `sort_order` defaults to `"desc"` (not null) — applied in the IC API client layer.
5. **Public profile detail error message**: Uses `"Creator profile not found for handle: {handle}"` (no @ prefix) — different from private profile which uses `"@{handle}"`.
6. **List response format**: `cheerful_list_public_creator_profiles` returns a bare `list[]`, not wrapped in an object with `total` count.
7. **Post library search**: The `search` parameter on `cheerful_list_posts` only matches `creator_name` via ILIKE, not caption or campaign name.
8. **Post type normalization**: Apify returns raw types that are normalized: "story"→"story", "video"/"reel"→"reel", else→"post".
9. **Caption truncation**: Post captions are capped at 500 characters when stored in the database.
10. **Add-to-campaign workflow ID**: Uses format `enrich-campaign-{campaign_id}-{hex8}` (different from standalone enrichment which uses `enrich-user-{user_id}-{hex8}`).
