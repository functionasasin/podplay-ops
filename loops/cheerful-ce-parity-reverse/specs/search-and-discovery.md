# Search & Discovery Domain — Tool Specifications

**Domain**: Search & Discovery
**Spec file**: `specs/search-and-discovery.md`
**Wave 2 status**: Complete
**Wave 3 status**: Complete (verified against source code)

---

## Table of Contents

1. [Cross-Domain Search Tool Map](#cross-domain-search-tool-map)
2. [Existing Tool Bug Report](#existing-tool-bug-report)
3. [Lookalike Suggestion Management](#lookalike-suggestion-management)

**Total tools owned in this file**: 4 (0 existing + 4 new)

> **This is a hub domain.** Most search and discovery tools live in their primary domain specs because they are integral to those workflows. This file owns lookalike suggestion management (the only search/discovery capability not covered elsewhere) and provides a cross-reference map for all search-related tools across the system.

> **Lookalike suggestions are currently webapp-only.** The 4 suggestion management operations are implemented as Next.js API routes using Supabase client directly — NO backend FastAPI endpoints exist. For the context engine, **new backend service endpoints must be created** for all 4 operations. The spec below defines what those endpoints should accept and return.

> **Auto-discovery configuration** (enabling/disabling automatic lookalike generation per campaign) is managed via campaign update fields (`is_lookalike_suggestions_enabled`, `discovery_enabled`, `discovery_config`) — covered by `cheerful_update_campaign` in `specs/campaigns.md`. No dedicated auto-discovery tools needed.

---

## Cross-Domain Search Tool Map

All search and discovery tools across the system, showing which spec file owns each tool.

### Internal Search (Existing Database Content)

| Tool | Domain Spec | Sub-domain | What It Searches |
|------|-------------|------------|------------------|
| `cheerful_search_emails` | `email.md` | Thread search | Full-text search of campaign email threads (sender, subject, recipient, body) via `GET /api/service/threads/search`. **Note: formatter has field name bugs — see Bug Report below.** |
| `cheerful_find_similar_emails` | `email.md` | Semantic search | Semantic similarity via pgvector RAG embeddings — accepts natural language query OR thread_id. Via `GET /api/service/rag/similar`. **Note: formatter has field name bugs — see Bug Report below.** |
| `cheerful_search_campaign_creators` | `creators.md` | Creator search | Cross-campaign creator search by name/email/handle via `GET /api/service/creators/search`. **Note: searches ALL campaigns globally when no campaign_id provided.** |
| `cheerful_list_threads` | `email.md` | Thread listing | Thread listing with full filtering (status, direction, campaign, account, search) — functions as a structured search |

### External Discovery (New Creators via Third-Party APIs)

| Tool | Domain Spec | Sub-domain | What It Discovers |
|------|-------------|------------|-------------------|
| `cheerful_search_similar_creators` | `creators.md` | IC similar search | Find creators similar to a given handle via Influencer Club API. 10 results/page. Needs new `/api/service/creator-search/similar` route. |
| `cheerful_search_creators_by_keyword` | `creators.md` | IC keyword search | Search creators by keyword/topic via IC. Supports sort_by/sort_order. Needs new `/api/service/creator-search/keyword` route. |
| `cheerful_enrich_creator` | `creators.md` | IC enrichment | Enrich single creator (email + profile) via IC. Synchronous, no caching. Needs new `/api/service/creator-search/enrich` route. |
| `cheerful_get_creator_profile` | `creators.md` | Profile fetch | Detailed creator profile with cache (Apify/IC). 24h cache, latest posts, bio links. Needs new `/api/service/creator-search/profile` route. |
| `cheerful_find_youtube_lookalikes` | `integrations.md` | YouTube lookalike | Find similar YouTube channels via Apify scraper + LLM keyword extraction. Needs new `/api/service/youtube/lookalikes` route. |

### Suggestion Management (AI-Generated Recommendations)

| Tool | Domain Spec | Sub-domain | What It Manages |
|------|-------------|------------|-----------------|
| `cheerful_list_lookalike_suggestions` | **this file** | Suggestions | List AI-generated lookalike suggestions for a campaign |
| `cheerful_update_lookalike_suggestion` | **this file** | Suggestions | Accept/reject/revert a single suggestion (status update only — does NOT add recipient) |
| `cheerful_bulk_accept_lookalike_suggestions` | **this file** | Suggestions | Bulk accept suggestions + add as campaign recipients |
| `cheerful_bulk_reject_lookalike_suggestions` | **this file** | Suggestions | Bulk reject suggestions |

### Enrichment (Email Discovery for In-Campaign Creators)

| Tool | Domain Spec | Sub-domain | What It Does |
|------|-------------|------------|--------------|
| `cheerful_start_creator_enrichment` | `creators.md` | Batch enrichment | Start async batch email enrichment for multiple creators |
| `cheerful_get_enrichment_workflow_status` | `creators.md` | Enrichment polling | Poll enrichment workflow status and results |
| `cheerful_get_campaign_enrichment_status` | `campaigns.md` | Campaign enrichment | Get enrichment progress for all creators in a campaign |
| `cheerful_override_creator_email` | `campaigns.md` | Email override | Manually override a creator's enriched email in a campaign |

---

## Existing Tool Bug Report

The following existing CE tools (verified against `tools.py` and `api.py`) have formatter field name mismatches that cause their XML output to contain empty tags. These bugs affect the search domain tools.

### `cheerful_search_emails` — Formatter Bugs

**Source**: `tools.py` `_fmt_thread_summary()` (lines 100-115)

The formatter reads fields that **do not exist** in the `ThreadSearchResult` response model:

| Formatter reads | Actual field name | Impact |
|----------------|-------------------|--------|
| `thread.get("sender", "")` | `sender_email` | `<sender></sender>` always empty |
| `thread.get("recipient", "")` | `recipient_emails` (list, not string) | `<recipient></recipient>` always empty |
| `thread.get("date", "")` | `latest_date` | `<date></date>` always empty |
| `thread.get("snippet", "")` | `matched_snippet` | `<snippet></snippet>` always empty |

The formatter also reads `thread.get("type", "unknown")` to populate `<type>` but this field doesn't exist in `ThreadSearchResult` (only `direction` exists).

**Correct `ThreadSearchResult` fields** (from `models/api/service.py`):
```json
{
  "gmail_thread_id": "string",
  "subject": "string",
  "sender_email": "string",
  "recipient_emails": ["string"],
  "direction": "string — INBOUND or OUTBOUND",
  "message_count": "integer",
  "latest_date": "datetime",
  "matched_snippet": "string"
}
```

**Recommendation**: Fix `_fmt_thread_summary()` to read `sender_email`, `recipient_emails[0]`, `latest_date`, and `matched_snippet`.

---

### `cheerful_find_similar_emails` — Formatter Bugs

**Source**: `tools.py` `_fmt_similar_email()` (lines 159-174)

The formatter reads fields that **do not exist** in the `SimilarEmailResult` response model:

| Formatter reads | Actual field name | Impact |
|----------------|-------------------|--------|
| `result.get("summary", "")` | `thread_summary` | `<summary></summary>` always empty |
| `result.get("reply_text", "")` | `sent_reply_text` | `<reply-text></reply-text>` always empty |
| `result.get("subject", "")` | (no subject field) | `<subject></subject>` always empty |

**Correct `SimilarEmailResult` fields** (from `models/api/service.py`):
```json
{
  "thread_id": "string",
  "campaign_id": "string",
  "thread_summary": "string",
  "inbound_email_text": "string",
  "sent_reply_text": "string",
  "sanitized_reply_text": "string | null",
  "similarity": "float"
}
```

**Recommendation**: Fix `_fmt_similar_email()` to read `thread_summary`, `sent_reply_text`, and `inbound_email_text`. Remove `subject` tag (no subject in this response).

---

### `cheerful_list_campaign_creators` — Missing `offset` Parameter

**Source**: `api.py` `list_campaign_creators()` (lines 102-128)

The CE API client does **not** pass an `offset` parameter even though the backend service route accepts `offset: int = Query(0, ge=0)`. The CE tool input model (`ListCampaignCreatorsInput`) also lacks an `offset` field. This means the tool cannot paginate beyond the first page.

**Recommendation**: Add `offset: int = Field(default=0)` to `ListCampaignCreatorsInput` and pass it to the API client.

---

### `cheerful_search_campaign_creators` — Global Search Security Note

**Source**: `service.py` `search_creators()` (lines 310-359)

When `campaign_id` is omitted, `repo.search_across_campaigns(query=query, campaign_id=None, limit=limit)` searches **ALL campaigns in the database**, not filtered to the authenticated user's campaigns. The CE client passes `user_id` as a query parameter but the backend endpoint **ignores it**.

This means a CE user could search creators from campaigns they don't own (though they would need to know what to search for). This is acceptable because the service layer is a trusted internal caller, but it should be documented.

**Recommendation**: The backend service route should filter results to campaigns owned by or assigned to the `user_id` when `user_id` is provided. In the interim, the CE tool description should note this is a global search.

---

## Lookalike Suggestion Management

> **Background**: When a campaign has `is_lookalike_suggestions_enabled=true`, the Temporal activity `generate_lookalikes_for_opt_in_activity` automatically runs when creators opt in. It uses the opted-in creator's social handles to find similar creators (via Apify for Instagram, IC for YouTube), then stores results in the `campaign_lookalike_suggestion` table. Only suggestions with email addresses are stored.
>
> Users review these AI-generated suggestions on the campaign page: accept (adds as recipient), reject (excludes), or leave pending. The 4 tools below give the CE agent full management capability over this review workflow.
>
> **Current implementation**: All 4 operations are Next.js API routes using Supabase client directly (verified at `app/api/campaigns/[id]/lookalike-suggestions/`). There are NO backend FastAPI endpoints. For the CE, new service endpoints must be created at `/api/service/campaigns/{campaign_id}/lookalike-suggestions/*`.
>
> **Permission model**: Both campaign owners AND assigned team members can manage suggestions (enforced via Supabase RLS `can_access_campaign` function on the `campaign` table).

### Shared Schema: `LookalikeSuggestion`

Used in list and update responses. Verified against `lib/lookalike-suggestion-types.ts`:

```json
{
  "id": "string (UUID) — suggestion ID",
  "campaign_id": "string (UUID) — campaign this suggestion belongs to",
  "seed_creator_id": "string (UUID) | null — the opted-in creator who triggered this suggestion. Null if seed cannot be identified.",
  "seed_platform_handle": "string | null — handle of the seed creator (e.g., '@fashionista'). Null if not recorded.",
  "platform": "string — one of: 'instagram', 'youtube'",
  "suggested_username": "string — handle of the suggested creator (no @ prefix)",
  "suggested_full_name": "string | null — display name of suggested creator",
  "suggested_biography": "string | null — bio/description text",
  "suggested_follower_count": "integer | null — follower count. Null if not available.",
  "suggested_profile_pic_url": "string | null — profile picture URL",
  "suggested_is_verified": "boolean — whether account is verified (non-nullable, defaults to false)",
  "suggested_external_url": "string | null — bio link URL",
  "suggested_category": "string | null — content category/niche",
  "suggested_email": "string | null — contact email. Always non-null in practice for listed suggestions (filtered by query), but typed nullable in DB.",
  "apify_run_id": "string | null — reference to the Apify run that generated this suggestion",
  "similarity_score": "float | null — Numeric(5,2), higher = more similar. Null if provider does not return a score.",
  "status": "string — one of: 'pending', 'accepted', 'rejected'",
  "created_at": "string (ISO 8601 datetime) — when the suggestion was created",
  "updated_at": "string (ISO 8601 datetime) — when the suggestion was last updated"
}
```

---

### `cheerful_list_lookalike_suggestions`

**Purpose**: List AI-generated lookalike creator suggestions for a campaign. Suggestions are auto-generated when creators opt in to campaigns with lookalike suggestions enabled. Returns only suggestions that have an email address, sorted by similarity score (highest first).

**Maps to**: `GET /api/service/campaigns/{campaign_id}/lookalike-suggestions` (new service route needed)

> Current implementation: webapp Next.js `GET /api/campaigns/[id]/lookalike-suggestions/route.ts` using Supabase direct query.

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (user must own or be assigned to the campaign, enforced via Supabase RLS `can_access_campaign` on `campaign` table).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign to list suggestions for |
| status | enum | no | null | Filter by suggestion status. One of: `"pending"`, `"accepted"`, `"rejected"`. If null/omitted, returns suggestions of ALL statuses. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID string. Invalid UUIDs → 422 validation error.
- `status` must be exactly one of: `"pending"`, `"accepted"`, `"rejected"`. Any other value → 422.

**Return Schema**:
```json
[
  {
    "id": "string (UUID) — suggestion ID",
    "campaign_id": "string (UUID)",
    "seed_creator_id": "string (UUID) | null",
    "seed_platform_handle": "string | null",
    "platform": "string — 'instagram' or 'youtube'",
    "suggested_username": "string — handle without @ prefix",
    "suggested_full_name": "string | null",
    "suggested_biography": "string | null",
    "suggested_follower_count": "integer | null",
    "suggested_profile_pic_url": "string | null",
    "suggested_is_verified": "boolean",
    "suggested_external_url": "string | null",
    "suggested_category": "string | null",
    "suggested_email": "string | null — always non-null for listed results (filtered) but typed nullable",
    "apify_run_id": "string | null",
    "similarity_score": "float | null — Numeric(5,2)",
    "status": "string — 'pending', 'accepted', or 'rejected'",
    "created_at": "string — ISO 8601 datetime",
    "updated_at": "string — ISO 8601 datetime"
  }
]
```

**Ordering**: Sorted by `similarity_score` descending (highest similarity first). Suggestions with `similarity_score=null` sort to the end (Supabase `nullsFirst: false`).

**Filtering**: Only returns suggestions where `suggested_email IS NOT NULL`. Suggestions without emails are excluded because they cannot be acted on.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found or access denied | "Campaign not found" | 404 |
| Internal DB error | "Failed to fetch suggestions" | 500 |

> **Note on access control**: The webapp route uses Supabase RLS — if the user is not the owner or an assigned team member, the `campaign` query returns no rows, yielding "Campaign not found" (not a distinct "Access denied" message). The service route should replicate this behavior.

**Pagination**: Not implemented in the current webapp route — returns all matching suggestions in a single response. The service route spec should accept optional `limit` (default 100, max 500) and `offset` (default 0) for future scalability.

**Example Request**:
```
cheerful_list_lookalike_suggestions(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", status="pending")
```

**Example Response**:
```json
[
  {
    "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "seed_creator_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567891",
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
    "apify_run_id": "apify-run-789abc",
    "similarity_score": 87.50,
    "status": "pending",
    "created_at": "2026-02-28T10:00:00Z",
    "updated_at": "2026-02-28T10:00:00Z"
  },
  {
    "id": "a2b3c4d5-e6f7-8901-bcde-fa0987654321",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "seed_creator_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567891",
    "seed_platform_handle": "@skincare_queen",
    "platform": "instagram",
    "suggested_username": "natural_glow_co",
    "suggested_full_name": null,
    "suggested_biography": "Natural skincare for sensitive skin",
    "suggested_follower_count": 28100,
    "suggested_profile_pic_url": null,
    "suggested_is_verified": false,
    "suggested_external_url": null,
    "suggested_category": "Beauty",
    "suggested_email": "collab@naturalglow.co",
    "apify_run_id": "apify-run-789abc",
    "similarity_score": 72.25,
    "status": "pending",
    "created_at": "2026-02-28T10:00:00Z",
    "updated_at": "2026-02-28T10:00:00Z"
  }
]
```

**Slack Formatting Notes**:
- Present as a numbered list grouped by seed creator handle: "Suggestions seeded from @skincare_queen: 1. @glowup_daily (Sarah Chen) — 45.2K followers, 87.5% match, Beauty. Email: sarah@glowup.co. 2. @natural_glow_co — 28.1K followers, 72.3% match. Email: collab@naturalglow.co."
- Include the total count: "Found 12 pending suggestions."
- Offer next actions: "Use `cheerful_bulk_accept_lookalike_suggestions` to accept some or all, or `cheerful_update_lookalike_suggestion` to manage individually."
- When no suggestions: "No pending lookalike suggestions for this campaign. Suggestions are generated automatically when creators opt in (requires `is_lookalike_suggestions_enabled=true`)."

**Edge Cases**:
- Campaign has no suggestions → empty array (not an error)
- Campaign has `is_lookalike_suggestions_enabled=false` → may still have historical suggestions from when it was enabled; returns them
- Suggestions with `similarity_score=null` → sorted to end of list
- DB has unique constraint on `(campaign_id, platform, suggested_username)` — no duplicate suggestions per campaign+platform combination

---

### `cheerful_update_lookalike_suggestion`

**Purpose**: Update the status of a single lookalike suggestion — accept it (marks as accepted), reject it (excludes from pending view), or revert to pending. **This tool only updates the suggestion status — it does NOT add a campaign recipient.** To add accepted suggestions as recipients, use `cheerful_bulk_accept_lookalike_suggestions`.

**Maps to**: `PUT /api/service/campaigns/{campaign_id}/lookalike-suggestions/{suggestion_id}` (new service route needed)

> Current implementation: webapp Next.js `PUT /api/campaigns/[id]/lookalike-suggestions/[suggestionId]/route.ts` — verified source code confirms this route only updates `status` and `updated_at`, with NO recipient creation logic.

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via Supabase RLS `can_access_campaign`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestion belongs to |
| suggestion_id | uuid | yes | — | ID of the suggestion to update |
| status | enum | yes | — | New status. One of: `"accepted"`, `"rejected"`, `"pending"` |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID string.
- `suggestion_id` must be a valid UUID string.
- `status` must be exactly one of: `"accepted"`, `"rejected"`, `"pending"`. Any other value → 400 "Invalid status. Must be accepted, rejected, or pending".

**Return Schema**:
```json
{
  "id": "string (UUID) — suggestion ID",
  "campaign_id": "string (UUID)",
  "seed_creator_id": "string (UUID) | null",
  "seed_platform_handle": "string | null",
  "platform": "string — 'instagram' or 'youtube'",
  "suggested_username": "string",
  "suggested_full_name": "string | null",
  "suggested_biography": "string | null",
  "suggested_follower_count": "integer | null",
  "suggested_profile_pic_url": "string | null",
  "suggested_is_verified": "boolean",
  "suggested_external_url": "string | null",
  "suggested_category": "string | null",
  "suggested_email": "string | null",
  "apify_run_id": "string | null",
  "similarity_score": "float | null",
  "status": "string — updated status: 'accepted', 'rejected', or 'pending'",
  "created_at": "string — ISO 8601 datetime (unchanged)",
  "updated_at": "string — ISO 8601 datetime (set to now)"
}
```

**Side Effects**:
- **When status = `"accepted"`**: Updates `status` to `"accepted"` and `updated_at` to now. **No recipient is created.** This is intentionally a status-tracking update only. To add the suggested creator as a campaign recipient, use `cheerful_bulk_accept_lookalike_suggestions` with this suggestion ID.
- **When status = `"rejected"`**: Updates `status` to `"rejected"` and `updated_at` to now. No other side effects.
- **When status = `"pending"`**: Reverts to pending. `updated_at` set to now.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found or access denied | "Campaign not found" | 404 |
| Suggestion not found (does not exist at all) | "Suggestion not found" | 404 |
| Suggestion exists but belongs to a different campaign | "Suggestion does not belong to this campaign" | 400 |
| Invalid status value | "Invalid status. Must be accepted, rejected, or pending" | 400 |
| DB update error | "Failed to update suggestion" | 500 |

**Example Request**:
```
cheerful_update_lookalike_suggestion(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890", suggestion_id="f7e6d5c4-b3a2-1098-fedc-ba9876543210", status="accepted")
```

**Example Response**:
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "seed_creator_id": "c1d2e3f4-a5b6-7890-abcd-ef1234567891",
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
  "apify_run_id": "apify-run-789abc",
  "similarity_score": 87.50,
  "status": "accepted",
  "created_at": "2026-02-28T10:00:00Z",
  "updated_at": "2026-03-01T14:30:00Z"
}
```

**Slack Formatting Notes**:
- For acceptance: "Marked @glowup_daily (Sarah Chen) as accepted. Note: To add her as a campaign recipient with email sarah@glowup.co, use `cheerful_bulk_accept_lookalike_suggestions`."
- For rejection: "Rejected @glowup_daily — marked as excluded from this campaign."
- For revert to pending: "Reverted @glowup_daily to pending review."

**Edge Cases**:
- Suggestion already has the target status (e.g., already accepted) → idempotent; no error, just updates `updated_at`
- Suggestion belongs to a different campaign → 400 "Suggestion does not belong to this campaign" (not 404)
- After accepting via this tool, the suggested creator is NOT automatically added as a campaign recipient; agent should inform user to use `cheerful_bulk_accept_lookalike_suggestions` if they want to add the recipient

---

### `cheerful_bulk_accept_lookalike_suggestions`

**Purpose**: Bulk accept multiple lookalike suggestions at once. For each suggestion with a valid email, adds the suggested creator as a new campaign recipient (skips if a recipient with that email already exists). This is the primary workflow for efficiently processing batches of AI recommendations and adding them as outreach targets.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept` (new service route needed)

> Current implementation: webapp Next.js `POST /api/campaigns/[id]/lookalike-suggestions/bulk-accept/route.ts` — verified source code.

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via Supabase RLS `can_access_campaign`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestions belong to |
| suggestion_ids | uuid[] | yes | — | Array of suggestion UUIDs to accept. Each element must be a valid UUID. Minimum: 1 element. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID string.
- `suggestion_ids` must be a non-empty array. Empty array → 400 "suggestion_ids cannot be empty".
- Each element in `suggestion_ids` must be a valid UUID string. Invalid UUIDs → 400 validation error.
- Maximum array size: no hardcoded limit in current implementation (service route should enforce ~500 max).

**Return Schema**:
```json
{
  "accepted_count": "integer — number of suggestions successfully updated to 'accepted' status",
  "added_recipient_count": "integer — number of NEW campaign recipients created. May be less than accepted_count if some suggestions' emails already exist as recipients.",
  "failed_suggestion_ids": ["string — UUIDs of suggestions that could not be processed (not found, wrong campaign, or DB error)"]
}
```

**Side Effects** (per accepted suggestion, in order):
1. Fetches the suggestion row from `campaign_lookalike_suggestion` where `id = suggestionId`
2. Validates `suggestion.campaign_id === campaignId` — if mismatch, adds to `failed_suggestion_ids`
3. Updates suggestion `status` → `"accepted"`, `updated_at` → now
4. Increments `acceptedCount`
5. If `suggestion.suggested_email` is non-null:
   - Checks `campaign_recipient` table: does a row exist with `campaign_id=campaignId` AND `email=suggestion.suggested_email`?
   - If NO existing recipient: inserts new `campaign_recipient` row with:
     - `campaign_id`: the campaign UUID
     - `email`: `suggestion.suggested_email`
     - `name`: `suggestion.suggested_full_name || suggestion.suggested_username` (falls back to username if full_name is null)
     - `custom_fields` (JSON object):
       - `instagram_username`: `suggestion.suggested_username` — **always uses this key regardless of platform** (code does not branch on platform; YouTube suggestions also write to `instagram_username` — this is a webapp bug but is ground truth)
       - `follower_count`: `suggestion.suggested_follower_count` (integer or null)
       - `is_verified`: `suggestion.suggested_is_verified` (boolean)
       - `category`: `suggestion.suggested_category` (string or null)
       - `lookalike_suggestion_id`: `suggestion.id` (UUID string — for traceability)
       - `seed_platform_handle`: `suggestion.seed_platform_handle` (string or null)
   - If successful insert: increments `addedRecipientCount`
6. Each suggestion is processed independently — one failure does not block others

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found or access denied | "Campaign not found" | 404 |
| Empty suggestion_ids array | "suggestion_ids cannot be empty" | 400 |
| Individual suggestion not found or wrong campaign | Added to `failed_suggestion_ids` (not a request-level error) | — |
| DB update error for a suggestion | Added to `failed_suggestion_ids` (not a request-level error) | — |

**Example Request**:
```
cheerful_bulk_accept_lookalike_suggestions(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  suggestion_ids=["f7e6d5c4-b3a2-1098-fedc-ba9876543210", "a2b3c4d5-e6f7-8901-bcde-fa0987654321", "b3c4d5e6-f7a8-9012-cdef-ab1098765432"]
)
```

**Example Response**:
```json
{
  "accepted_count": 3,
  "added_recipient_count": 2,
  "failed_suggestion_ids": []
}
```

**Example Response (with failures)**:
```json
{
  "accepted_count": 2,
  "added_recipient_count": 2,
  "failed_suggestion_ids": ["b3c4d5e6-f7a8-9012-cdef-ab1098765432"]
}
```

**Slack Formatting Notes**:
- Success: "Accepted 3 suggestions — added 2 new recipients to campaign. (1 was already a recipient.)"
- With failures: "Accepted 2 suggestions, added 2 new recipients. 1 suggestion failed: [ID]. That suggestion may not belong to this campaign."
- If `added_recipient_count < accepted_count`: "Note: X suggestion(s) were already recipients — their status was updated to 'accepted' but no duplicate recipient was created."

**Edge Cases**:
- Some `suggestion_ids` not found → those IDs appear in `failed_suggestion_ids`; valid suggestions proceed normally
- Suggestion exists but `campaign_id` doesn't match → fails (added to `failed_suggestion_ids`); not a request-level error
- Suggestions already accepted (idempotent) → `acceptedCount` is still incremented; if recipient already exists, `addedRecipientCount` is NOT incremented
- Suggestion has `suggested_email=null` → `acceptedCount` incremented, but NO recipient created (email required); in practice, list endpoint filters these out
- YouTube suggestions in `custom_fields` write to `instagram_username` key (not `youtube_username`) — this is the actual behavior in the webapp code

---

### `cheerful_bulk_reject_lookalike_suggestions`

**Purpose**: Bulk reject multiple lookalike suggestions at once. Rejected suggestions are excluded from the campaign's pending view. Can be reverted individually using `cheerful_update_lookalike_suggestion(status="pending")`.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject` (new service route needed)

> Current implementation: webapp Next.js `POST /api/campaigns/[id]/lookalike-suggestions/bulk-reject/route.ts` — verified source code.

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via Supabase RLS `can_access_campaign`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign the suggestions belong to |
| suggestion_ids | uuid[] | yes | — | Array of suggestion UUIDs to reject. Each must be a valid UUID. Minimum: 1 element. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID string.
- `suggestion_ids` must be a non-empty array. Empty array → 400 "suggestion_ids cannot be empty".
- Each element in `suggestion_ids` must be a valid UUID string. Invalid UUIDs → 400 validation error.
- No hardcoded maximum; service route should consider ~500 max.

**Return Schema**:
```json
{
  "rejected_count": "integer — number of suggestions successfully updated to 'rejected' status",
  "failed_suggestion_ids": ["string — UUIDs of suggestions that could not be processed (not found, wrong campaign, or DB error)"]
}
```

**Side Effects** (per rejected suggestion, in order):
1. Fetches suggestion row from `campaign_lookalike_suggestion` (only `id` and `campaign_id` fields — lighter fetch than bulk-accept)
2. Validates `suggestion.campaign_id === campaignId` — if mismatch, adds to `failed_suggestion_ids`
3. Updates suggestion `status` → `"rejected"`, `updated_at` → now
4. Increments `rejectedCount`
5. **No other side effects.** Rejecting does not delete the suggestion, does not remove any recipient (even if previously accepted), and does not trigger any notification.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found or access denied | "Campaign not found" | 404 |
| Empty suggestion_ids array | "suggestion_ids cannot be empty" | 400 |
| Individual suggestion not found or wrong campaign | Added to `failed_suggestion_ids` (not a request-level error) | — |

**Example Request**:
```
cheerful_bulk_reject_lookalike_suggestions(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  suggestion_ids=["c4d5e6f7-a8b9-0123-defg-bc2109876543", "d5e6f7a8-b9c0-1234-efgh-cd3210987654"]
)
```

**Example Response**:
```json
{
  "rejected_count": 2,
  "failed_suggestion_ids": []
}
```

**Slack Formatting Notes**:
- Success: "Rejected 2 suggestions — they won't appear in pending reviews."
- With failures: "Rejected 1, but 1 suggestion could not be found: [ID]. Check that the suggestion ID belongs to this campaign."
- Offer revert option: "If you rejected something by mistake, use `cheerful_update_lookalike_suggestion(status='pending')` to revert."

**Edge Cases**:
- Some `suggestion_ids` not found → those IDs in `failed_suggestion_ids`; valid suggestions proceed
- Suggestions already rejected → idempotent; `rejectedCount` incremented (status updates from rejected → rejected)
- Rejecting a previously accepted suggestion → status changes to "rejected"; any campaign recipient that was created via a prior `cheerful_bulk_accept_lookalike_suggestions` call is **NOT removed** — the recipient persists in the campaign

---

## Service Route Requirements Summary

The context engine currently has zero coverage of lookalike suggestion management. **4 new backend service endpoints** are required before these tools can be implemented:

| New Service Endpoint | Method | Maps From (Webapp) | Auth |
|---------------------|--------|--------------------|------|
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions` | GET | `GET /api/campaigns/[id]/lookalike-suggestions/route.ts` | `X-Service-Api-Key` header |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/{suggestion_id}` | PUT | `PUT /api/campaigns/[id]/lookalike-suggestions/[suggestionId]/route.ts` | `X-Service-Api-Key` header |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept` | POST | `POST /api/campaigns/[id]/lookalike-suggestions/bulk-accept/route.ts` | `X-Service-Api-Key` header |
| `/api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject` | POST | `POST /api/campaigns/[id]/lookalike-suggestions/bulk-reject/route.ts` | `X-Service-Api-Key` header |

All service endpoints must:
- Accept `X-Service-Api-Key` header for authentication (via `verify_service_api_key` dependency, same as all `/api/service/*` routes)
- Accept `user_id` query parameter for campaign access validation (check user owns or is assigned to the campaign)
- Use the same Supabase/SQLAlchemy queries as the current webapp routes (DB schema and RLS policies already exist)
- Return the same response shapes as the current webapp routes

Additionally, **5 new discovery service routes** are needed for external creator discovery (documented in `creators.md` and `integrations.md`):

| New Service Endpoint | Method | Notes |
|---------------------|--------|-------|
| `/api/service/creator-search/keyword` | POST | IC keyword discovery |
| `/api/service/creator-search/similar` | POST | IC similar-creator discovery |
| `/api/service/creator-search/enrich` | POST | IC creator enrichment |
| `/api/service/creator-search/profile` | POST | Apify full profile fetch |
| `/api/service/youtube/lookalikes` | POST | YouTube lookalike channel discovery |

---

## Agent Workflow: Full Discovery Pipeline

For reference, the complete discovery-to-campaign workflow the CE agent can orchestrate using tools across all domains:

```
1. DISCOVER: Find new creators
   ├── cheerful_search_similar_creators (creators.md)      — IC similar search
   ├── cheerful_search_creators_by_keyword (creators.md)   — IC keyword search
   ├── cheerful_find_youtube_lookalikes (integrations.md)  — YouTube lookalike
   └── cheerful_list_lookalike_suggestions (this file)     — AI auto-suggestions

2. EVALUATE: Get details on promising creators
   ├── cheerful_get_creator_profile (creators.md)          — Full profile + posts
   └── cheerful_enrich_creator (creators.md)               — Get email address

3. CURATE: Organize into lists
   ├── cheerful_create_creator_list (creators.md)          — Create a list
   ├── cheerful_add_search_creators_to_list (creators.md)  — Add IC results to list
   └── cheerful_add_creators_to_list (creators.md)         — Add by ID

4. ADD TO CAMPAIGN: Transfer to active campaign
   ├── cheerful_add_list_creators_to_campaign (creators.md)  — Bulk transfer
   ├── cheerful_add_campaign_recipients (campaigns.md)        — Direct add
   └── cheerful_bulk_accept_lookalike_suggestions (this file) — Accept AI suggestions

5. MANAGE SUGGESTIONS: Review AI recommendations
   ├── cheerful_list_lookalike_suggestions (this file)         — View pending
   ├── cheerful_update_lookalike_suggestion (this file)        — Accept/reject one (status only, no recipient add)
   ├── cheerful_bulk_accept_lookalike_suggestions (this file)  — Accept batch + add recipients
   └── cheerful_bulk_reject_lookalike_suggestions (this file)  — Reject batch

6. SEARCH EXISTING: Find within current data
   ├── cheerful_search_emails (email.md)                   — Full-text thread search
   ├── cheerful_find_similar_emails (email.md)             — Semantic thread search
   └── cheerful_search_campaign_creators (creators.md)     — Cross-campaign creator search
```

---

## Wave 3 Verification Checklist

- [x] Parameter names match actual webapp route parameter names
- [x] Types match TypeScript interface field types (`lib/lookalike-suggestion-types.ts`)
- [x] Nullable fields correctly identified (seed_creator_id, seed_platform_handle, suggested_follower_count, apify_run_id, suggested_full_name, etc. are all nullable)
- [x] Return schema matches actual response from webapp routes
- [x] Error conditions sourced from actual route handler code (400 for wrong campaign, not 404; 400 for invalid status, not 422)
- [x] Side effects verified: `cheerful_update_lookalike_suggestion` does NOT add recipients (only status update)
- [x] Side effects verified: `cheerful_bulk_accept_lookalike_suggestions` DOES add recipients (with platform-ignorant `instagram_username` key in custom_fields — this is a webapp code bug but is ground truth)
- [x] Existing tool formatter bugs documented (`cheerful_search_emails`, `cheerful_find_similar_emails`, `cheerful_list_campaign_creators`)
- [x] Security gap documented for `cheerful_search_campaign_creators` global search
- [x] Service route requirements summarized for new backend endpoints
