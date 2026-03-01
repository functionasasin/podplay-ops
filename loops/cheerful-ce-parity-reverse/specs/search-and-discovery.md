# Search & Discovery Domain — Tool Specifications

**Domain**: Search & Discovery
**Spec file**: `specs/search-and-discovery.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

---

## Table of Contents

1. [Cross-Domain Search Tool Map](#cross-domain-search-tool-map) (reference only)
2. [Lookalike Suggestion Management](#lookalike-suggestion-management) (4 new tools)

**Total tools in this file**: 4 (0 existing + 4 new)

> **This is a hub domain.** Most search and discovery tools live in their primary domain specs because they are integral to those workflows. This file owns lookalike suggestion management (the only search/discovery capability not covered elsewhere) and provides a cross-reference map for all search-related tools across the system.

> **Lookalike suggestions are currently webapp-only.** The 4 suggestion management operations are implemented as Next.js API routes using Supabase client directly — NO backend FastAPI endpoints exist. For the context engine, **new backend service endpoints must be created** for all 4 operations. The spec below defines what those endpoints should accept and return.

> **Auto-discovery configuration** (enabling/disabling automatic lookalike generation per campaign) is managed via campaign update fields (`is_lookalike_suggestions_enabled`, `discovery_enabled`, `discovery_config`) — covered by `cheerful_update_campaign` in `specs/campaigns.md`. No dedicated auto-discovery tools needed.

---

## Cross-Domain Search Tool Map

All search and discovery tools across the system, showing which spec file owns each tool.

### Internal Search (Existing Database Content)

| Tool | Domain Spec | Sub-domain | What It Searches |
|------|-------------|------------|------------------|
| `cheerful_search_emails` | `email.md` | Thread search | Full-text search of campaign email threads (sender, subject, recipient, body) via `GET /api/service/threads/search` |
| `cheerful_find_similar_emails` | `email.md` | Semantic search | Semantic similarity via pgvector RAG embeddings — accepts natural language query OR thread_id. Via `GET /api/service/rag/similar` |
| `cheerful_search_campaign_creators` | `creators.md` | Creator search | Cross-campaign creator search by name/email/handle via `GET /api/service/creators/search` |
| `cheerful_list_threads` | `email.md` | Thread listing | Thread listing with full filtering (status, direction, campaign, account, search) — functions as a structured search |

### External Discovery (New Creators via Third-Party APIs)

| Tool | Domain Spec | Sub-domain | What It Discovers |
|------|-------------|------------|-------------------|
| `cheerful_search_similar_creators` | `creators.md` | IC similar search | Find creators similar to a given handle via Influencer Club API. 10 results/page |
| `cheerful_search_creators_by_keyword` | `creators.md` | IC keyword search | Search creators by keyword/topic via IC. Supports sort_by/sort_order |
| `cheerful_enrich_creator` | `creators.md` | IC enrichment | Enrich single creator (email + profile) via IC. Synchronous, no caching |
| `cheerful_get_creator_profile` | `creators.md` | Profile fetch | Detailed creator profile with cache (Apify/IC). 24h cache, latest posts, bio links |
| `cheerful_find_youtube_lookalikes` | `integrations.md` | YouTube lookalike | Find similar YouTube channels via Apify scraper + LLM keyword extraction |

### Suggestion Management (AI-Generated Recommendations)

| Tool | Domain Spec | Sub-domain | What It Manages |
|------|-------------|------------|-----------------|
| `cheerful_list_lookalike_suggestions` | **this file** | Suggestions | List AI-generated lookalike suggestions for a campaign |
| `cheerful_update_lookalike_suggestion` | **this file** | Suggestions | Accept/reject a single suggestion |
| `cheerful_bulk_accept_lookalike_suggestions` | **this file** | Suggestions | Bulk accept suggestions + add as campaign recipients |
| `cheerful_bulk_reject_lookalike_suggestions` | **this file** | Suggestions | Bulk reject suggestions |

### Enrichment (Email Discovery)

| Tool | Domain Spec | Sub-domain | What It Does |
|------|-------------|------------|--------------|
| `cheerful_start_creator_enrichment` | `creators.md` | Batch enrichment | Start async batch email enrichment for multiple creators |
| `cheerful_get_enrichment_workflow_status` | `creators.md` | Enrichment polling | Poll enrichment workflow status and results |
| `cheerful_get_campaign_enrichment_status` | `campaigns.md` | Campaign enrichment | Get enrichment progress for all creators in a campaign |
| `cheerful_override_creator_email` | `campaigns.md` | Email override | Manually override a creator's enriched email in a campaign |

---

## Lookalike Suggestion Management

> **Background**: When a campaign has `is_lookalike_suggestions_enabled=true`, the Temporal activity `generate_lookalikes_for_opt_in_activity` automatically runs when creators opt in. It uses the opted-in creator's social handles to find similar creators (via Apify for Instagram, IC for YouTube), then stores results in the `campaign_lookalike_suggestion` table. Only suggestions with email addresses are stored.
>
> Users review these AI-generated suggestions on the campaign page: accept (adds as recipient), reject (excludes), or leave pending. The 4 tools below give the CE agent full management capability over this review workflow.
>
> **Current implementation**: All 4 operations are Next.js API routes using Supabase client directly. There are NO backend FastAPI endpoints. For the CE, new service endpoints must be created at `/api/service/campaigns/{campaign_id}/lookalike-suggestions/*`.
>
> **Permission model**: Both campaign owners AND assigned team members can manage suggestions (enforced via Supabase RLS `can_access_campaign` function).

### `cheerful_list_lookalike_suggestions`

**Status**: NEW

**Purpose**: List AI-generated lookalike creator suggestions for a campaign. Suggestions are auto-generated when creators opt in to campaigns with lookalike suggestions enabled. Returns only suggestions that have an email address, sorted by similarity score (highest first).

**Maps to**: `GET /api/service/campaigns/{campaign_id}/lookalike-suggestions` (new service route needed; current implementation: webapp Next.js API route `GET /api/campaigns/{id}/lookalike-suggestions` using Supabase direct)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (user must own or be assigned to the campaign, enforced via RLS `can_access_campaign`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign to list suggestions for |
| status | enum | no | null | Filter by suggestion status. One of: "pending", "accepted", "rejected". If null, returns all statuses |

**Returns**: Array of `CampaignLookalikeSuggestion` objects:
- id: uuid — suggestion ID
- campaign_id: uuid
- seed_creator_id: uuid — the opted-in creator who triggered this suggestion
- seed_platform_handle: string — handle of the seed creator (e.g., "@fashionista")
- platform: enum — "instagram" or "youtube"
- suggested_username: string — handle of the suggested creator
- suggested_full_name: string (nullable)
- suggested_biography: string (nullable)
- suggested_follower_count: integer (default 0)
- suggested_profile_pic_url: string (nullable)
- suggested_is_verified: boolean (default false)
- suggested_external_url: string (nullable)
- suggested_category: string (nullable)
- suggested_email: string (nullable — always non-null in practice due to pre-filter, but typed nullable in DB)
- apify_run_id: string — reference to the Apify run that generated this suggestion
- similarity_score: float (nullable) — Numeric(5,2), higher = more similar
- status: enum — "pending", "accepted", "rejected"
- created_at: datetime
- updated_at: datetime

**Ordering**: Sorted by `similarity_score` descending (highest similarity first).

**Filtering**: Only returns suggestions where `suggested_email IS NOT NULL` (webapp current behavior — suggestions without emails are not actionable).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Access denied (not owner or assigned) | "Access denied to campaign {campaign_id}" | 403 |

**Pagination**: Not currently implemented in the webapp route — returns all matching suggestions. For the service endpoint, consider adding `limit` (default 50, max 200) and `offset` (default 0) parameters. The capability extraction notes that the current webapp fetches all at once.

**Example Request**:
```
cheerful_list_lookalike_suggestions(campaign_id="abc-123", status="pending")
```

**Example Response** (realistic data):
```json
[
  {
    "id": "sug-001",
    "campaign_id": "abc-123",
    "seed_creator_id": "creator-456",
    "seed_platform_handle": "@skincare_queen",
    "platform": "instagram",
    "suggested_username": "glowup_daily",
    "suggested_full_name": "Sarah Chen",
    "suggested_biography": "Skincare tips & reviews | Dermatologist-approved routines",
    "suggested_follower_count": 45200,
    "suggested_profile_pic_url": "https://example.com/pic.jpg",
    "suggested_is_verified": false,
    "suggested_external_url": "https://linktr.ee/glowup_daily",
    "suggested_category": "Beauty",
    "suggested_email": "sarah@glowup.co",
    "apify_run_id": "apify-run-789",
    "similarity_score": 87.50,
    "status": "pending",
    "created_at": "2026-02-28T10:00:00Z",
    "updated_at": "2026-02-28T10:00:00Z"
  }
]
```

**Slack Formatting Notes**: Agent should present as a numbered list grouped by seed creator: "Suggestions from @skincare_queen: 1. @glowup_daily (Sarah Chen) — 45.2K followers, 87.5% match, skincare. 2. ..." Offer actions: "Reply with accept/reject to manage these suggestions."

**Edge Cases**:
- Campaign has no suggestions → empty array (not an error). Agent should note: "No lookalike suggestions yet. Suggestions are generated when creators opt in to campaigns with lookalike suggestions enabled."
- Campaign has `is_lookalike_suggestions_enabled=false` → may still have historical suggestions from when it was enabled. Returns them.
- Suggestions with `similarity_score=null` → sort to the end. These may be manually added or from a provider that doesn't return scores.
- Duplicate prevention: DB has unique constraint on `(campaign_id, platform, suggested_username)` — no duplicate suggestions per campaign+platform.

---

### `cheerful_update_lookalike_suggestion`

**Status**: NEW

**Purpose**: Update the status of a single lookalike suggestion — accept it (to add as a campaign recipient), reject it (to exclude), or revert to pending.

**Maps to**: `PUT /api/service/campaigns/{campaign_id}/lookalike-suggestions/{suggestion_id}` (new service route needed; current implementation: webapp Next.js API route `PUT /api/campaigns/{id}/lookalike-suggestions/{suggestionId}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via RLS `can_access_campaign`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestion belongs to |
| suggestion_id | uuid | yes | — | ID of the suggestion to update |
| status | enum | yes | — | New status. One of: "accepted", "rejected", "pending" |

**Returns**: Updated `CampaignLookalikeSuggestion` object (same schema as list response, single item).

**Side Effects**:
- **When status = "accepted"**: The webapp implementation checks if a `campaign_recipient` with the same email already exists. If not, it inserts a new recipient with `custom_fields` containing:
  - `instagram_username` or `youtube_username` (from `suggested_username` by platform)
  - `follower_count` (from `suggested_follower_count`)
  - `is_verified` (from `suggested_is_verified`)
  - `category` (from `suggested_category`)
  - `lookalike_suggestion_id` (the suggestion ID for traceability)
  - `seed_platform_handle` (from `seed_platform_handle`)
- **When status = "rejected"**: No side effects — just updates the status.
- **When status = "pending"**: Reverts to pending. If a recipient was previously created via accept, the recipient is NOT removed (accept is not easily reversible).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Suggestion not found | "Suggestion {suggestion_id} not found" | 404 |
| Access denied | "Access denied to campaign {campaign_id}" | 403 |
| Invalid status value | "Invalid status. Must be one of: pending, accepted, rejected" | 422 |

**Example Request**:
```
cheerful_update_lookalike_suggestion(campaign_id="abc-123", suggestion_id="sug-001", status="accepted")
```

**Example Response**:
```json
{
  "id": "sug-001",
  "campaign_id": "abc-123",
  "seed_creator_id": "creator-456",
  "seed_platform_handle": "@skincare_queen",
  "platform": "instagram",
  "suggested_username": "glowup_daily",
  "suggested_full_name": "Sarah Chen",
  "suggested_email": "sarah@glowup.co",
  "similarity_score": 87.50,
  "status": "accepted",
  "created_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-03-01T14:30:00Z"
}
```

**Slack Formatting Notes**: Agent should confirm the action: "Accepted @glowup_daily (Sarah Chen) — added as campaign recipient with email sarah@glowup.co." For rejection: "Rejected @glowup_daily — excluded from campaign."

**Edge Cases**:
- Accepting a suggestion whose email already exists as a campaign recipient → suggestion status updates to "accepted" but no duplicate recipient is created. Agent should note: "Already a recipient."
- Accepting then reverting to pending → the created recipient is NOT removed. The suggestion reverts but the recipient persists.
- Suggestion belongs to a different campaign than `campaign_id` → 404 (suggestion not found in this campaign context).

---

### `cheerful_bulk_accept_lookalike_suggestions`

**Status**: NEW

**Purpose**: Bulk accept multiple lookalike suggestions at once. Each accepted suggestion with an email is added as a campaign recipient. This is the primary workflow for efficiently processing batches of AI recommendations.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept` (new service route needed; current implementation: webapp Next.js API route `POST /api/campaigns/{id}/lookalike-suggestions/bulk-accept`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via RLS `can_access_campaign`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestions belong to |
| suggestion_ids | uuid[] | yes | — | Array of suggestion IDs to accept. Min: 1 |

**Returns**: Bulk accept result:
- accepted_count: integer — number of suggestions successfully updated to "accepted"
- added_recipient_count: integer — number of new campaign recipients created (may differ from accepted_count if some suggestions' emails already exist as recipients)
- failed_suggestion_ids: string[] — IDs of suggestions that could not be processed (e.g., not found, already accepted, DB error)

**Side Effects** (per accepted suggestion):
1. Updates suggestion `status` to "accepted"
2. Checks if a `campaign_recipient` with the same email already exists for this campaign
3. If no existing recipient: inserts new `campaign_recipient` with:
   - `email`: from `suggested_email`
   - `name`: from `suggested_full_name`
   - `custom_fields`: JSON containing `instagram_username`/`youtube_username`, `follower_count`, `is_verified`, `category`, `lookalike_suggestion_id`, `seed_platform_handle`
4. Each suggestion is processed independently — one failure doesn't block others

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Access denied | "Access denied to campaign {campaign_id}" | 403 |
| Empty suggestion_ids | "At least one suggestion ID is required" | 422 |

**Example Request**:
```
cheerful_bulk_accept_lookalike_suggestions(campaign_id="abc-123", suggestion_ids=["sug-001", "sug-002", "sug-003"])
```

**Example Response**:
```json
{
  "accepted_count": 3,
  "added_recipient_count": 2,
  "failed_suggestion_ids": []
}
```

**Slack Formatting Notes**: Agent should summarize: "Accepted 3 suggestions — 2 new recipients added to campaign. (1 was already a recipient.)" If any failures: "3 accepted, but 1 failed: {failed_ids}."

**Edge Cases**:
- Some suggestion_ids don't exist → those IDs appear in `failed_suggestion_ids`, others proceed normally
- Some suggestions already accepted → re-accepted (idempotent), but no duplicate recipients created
- Suggestion with `suggested_email=null` → accepted but NO recipient created (email required for recipient). In practice, the list endpoint filters these out, so this shouldn't happen unless the agent uses raw IDs.
- Large batches → no hardcoded limit in current webapp implementation, but service route should consider a reasonable max (e.g., 500)

---

### `cheerful_bulk_reject_lookalike_suggestions`

**Status**: NEW

**Purpose**: Bulk reject multiple lookalike suggestions at once. Rejected suggestions are excluded from the campaign — they won't appear in the default "pending" view.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject` (new service route needed; current implementation: webapp Next.js API route `POST /api/campaigns/{id}/lookalike-suggestions/bulk-reject`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via RLS `can_access_campaign`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestions belong to |
| suggestion_ids | uuid[] | yes | — | Array of suggestion IDs to reject. Min: 1 |

**Returns**: Bulk reject result:
- rejected_count: integer — number of suggestions successfully updated to "rejected"
- failed_suggestion_ids: string[] — IDs of suggestions that could not be processed

**Side Effects**: None beyond status update. Rejecting does not delete the suggestion — it can be reverted to "pending" via `cheerful_update_lookalike_suggestion`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| Access denied | "Access denied to campaign {campaign_id}" | 403 |
| Empty suggestion_ids | "At least one suggestion ID is required" | 422 |

**Example Request**:
```
cheerful_bulk_reject_lookalike_suggestions(campaign_id="abc-123", suggestion_ids=["sug-004", "sug-005"])
```

**Example Response**:
```json
{
  "rejected_count": 2,
  "failed_suggestion_ids": []
}
```

**Slack Formatting Notes**: Agent should confirm: "Rejected 2 suggestions. They won't appear in pending reviews." If failures: "Rejected 1, but 1 failed: {failed_ids}."

**Edge Cases**:
- Some suggestion_ids don't exist → those IDs in `failed_suggestion_ids`, others proceed
- Already rejected suggestions → re-rejected (idempotent), counted in `rejected_count`
- Rejecting a previously accepted suggestion → status changes to "rejected", but any campaign recipient created during acceptance is NOT removed. The recipient persists.
- No hardcoded limit in current implementation — service route should consider max (e.g., 500)

---

## Service Route Requirements Summary

The context engine currently has zero coverage of lookalike suggestion management. **4 new backend service endpoints** are required:

| New Service Endpoint | Method | Maps From (Webapp) |
|---------------------|--------|-------------------|
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions` | GET | Next.js `GET /api/campaigns/{id}/lookalike-suggestions` |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/{suggestion_id}` | PUT | Next.js `PUT /api/campaigns/{id}/lookalike-suggestions/{suggestionId}` |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept` | POST | Next.js `POST /api/campaigns/{id}/lookalike-suggestions/bulk-accept` |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject` | POST | Next.js `POST /api/campaigns/{id}/lookalike-suggestions/bulk-reject` |

All service endpoints must:
- Accept `X-Service-Api-Key` header authentication
- Accept `user_id` query parameter for campaign access validation
- Use the same Supabase queries as the current webapp routes (the DB schema and RLS policies already exist)
- Return the same response shapes as the current webapp routes

## Agent Workflow: Full Discovery Pipeline

For reference, here's the complete discovery-to-campaign workflow the CE agent can orchestrate using tools across all domains:

```
1. DISCOVER: Find new creators
   ├── cheerful_search_similar_creators (creators.md)     — IC similar search
   ├── cheerful_search_creators_by_keyword (creators.md)  — IC keyword search
   ├── cheerful_find_youtube_lookalikes (integrations.md)  — YouTube lookalike
   └── cheerful_list_lookalike_suggestions (this file)     — AI auto-suggestions

2. EVALUATE: Get details on promising creators
   ├── cheerful_get_creator_profile (creators.md)         — Full profile + posts
   └── cheerful_enrich_creator (creators.md)              — Get email address

3. CURATE: Organize into lists
   ├── cheerful_create_creator_list (creators.md)         — Create a list
   ├── cheerful_add_search_creators_to_list (creators.md) — Add IC results to list
   └── cheerful_add_creators_to_list (creators.md)        — Add by ID

4. ADD TO CAMPAIGN: Transfer to active campaign
   ├── cheerful_add_list_creators_to_campaign (creators.md) — Bulk transfer
   ├── cheerful_add_campaign_recipients (campaigns.md)      — Direct add
   └── cheerful_bulk_accept_lookalike_suggestions (this file) — Accept AI suggestions

5. MANAGE SUGGESTIONS: Review AI recommendations
   ├── cheerful_list_lookalike_suggestions (this file)     — View pending
   ├── cheerful_update_lookalike_suggestion (this file)    — Accept/reject one
   ├── cheerful_bulk_accept_lookalike_suggestions (this file) — Accept batch
   └── cheerful_bulk_reject_lookalike_suggestions (this file) — Reject batch

6. SEARCH EXISTING: Find within current data
   ├── cheerful_search_emails (email.md)                  — Full-text thread search
   ├── cheerful_find_similar_emails (email.md)            — Semantic thread search
   └── cheerful_search_campaign_creators (creators.md)    — Cross-campaign creator search
```
