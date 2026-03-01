# Existing Tools Audit — All 7 Cheerful CE Tools

**Aspect**: w3-existing-tools-audit
**Date**: 2026-03-01
**Sources verified**: `tools.py`, `api.py`, `service.py`, `models/api/service.py`

This document consolidates ALL audit findings for the 7 existing Cheerful context engine tools.
It cross-references findings already documented in domain spec files (which discovered bugs during
Wave 3 source code verification) and adds new findings from this dedicated pass.

---

## Audit Summary Table

| Tool | Status | Formatter Bugs | Security Gap | Missing Params | Spec Accuracy |
|------|--------|---------------|--------------|----------------|---------------|
| `cheerful_list_campaigns` | EXISTS — needs fixes | 3 bugs | None | status filter, team access | Spec notes bugs |
| `cheerful_search_emails` | EXISTS — needs fixes | 4 bugs | user_id ignored | None | Spec corrected |
| `cheerful_get_thread` | EXISTS — needs fixes | 3 bugs | user_id ignored | None | Spec corrected |
| `cheerful_find_similar_emails` | EXISTS — needs fixes | 3 bugs | user_id ignored | None | Spec corrected |
| `cheerful_list_campaign_creators` | EXISTS — needs fixes | 0 bugs | user_id ignored | `offset` missing | Spec notes bugs |
| `cheerful_get_campaign_creator` | EXISTS — spec inaccurate | 0 bugs | user_id ignored | None | **INACCURATE** — 3 extra fields in spec not in service model |
| `cheerful_search_campaign_creators` | EXISTS — needs fixes | 0 bugs | user_id ignored + global search | `offset` missing | Spec notes gaps |

---

## Tool 1: `cheerful_list_campaigns`

### Implementation Chain
```
cheerful_list_campaigns(params: ListCampaignsInput)  # ListCampaignsInput has NO fields
  → api.list_campaigns(base_url, api_key, user_id)
  → GET /api/service/campaigns?user_id={user_id}
  → service.list_campaigns(user_id: uuid.UUID)
  → repo.get_by_user_id(user_id)
  → returns list[CampaignCreator] filtered to ACTIVE + PAUSED only
  → serialized as list[ServiceCampaignResponse]
  → formatted by _fmt_campaigns() → _fmt_campaign() per item
```

### Actual Backend Response Schema (`ServiceCampaignResponse`)
```
id: str                      — campaign UUID
name: str                    — campaign name
campaign_type: str           — one of: paid_promotion, creator, gifting, sales, other
status: str                  — one of: active, paused (only these two are ever returned)
slack_channel_id: str | None — Slack channel for notifications
created_at: datetime         — ISO 8601 creation timestamp
```

### Formatter Bugs (`_fmt_campaign` in tools.py lines 77-85)

**Bug 1 — Wrong field name for campaign type**:
```python
# WRONG: reads 'type'
content += tag("type", str(campaign.get("type", "unknown")))
# CORRECT: field is 'campaign_type'
content += tag("campaign-type", str(campaign.get("campaign_type", "unknown")))
```
**Impact**: `<type>unknown</type>` is always output regardless of actual campaign type.
All campaign types appear as "unknown" in the XML context provided to Claude.

**Bug 2 — Non-existent field `gmail_account_id`**:
```python
# WRONG: 'gmail_account_id' does not exist in ServiceCampaignResponse
content += tag("gmail-account-id", str(campaign.get("gmail_account_id", "")))
# CORRECT: this field is not in the service response — remove or replace
# Note: the main API CampaignResponse has sender_emails[] not gmail_account_id
```
**Impact**: `<gmail-account-id></gmail-account-id>` is always empty. This field was never
returned by the service endpoint — the tag outputs a meaningless empty value.

**Bug 3 — `status` field completely dropped**:
The formatter never reads `campaign.get("status")`. The `status` field (always "active" or
"paused" since the backend filters) is never shown to Claude.
**Impact**: Claude cannot distinguish active vs paused campaigns from the tool output.

**Bug 4 — `slack_channel_id` dropped**:
The formatter never reads `campaign.get("slack_channel_id")`. This field is useful for the
agent to know which Slack channel a campaign routes to.

### Behavioral Gaps

**Gap 1 — Only ACTIVE and PAUSED campaigns returned**:
The backend service route hardcodes the filter:
```python
if c.status in (CampaignStatus.ACTIVE, CampaignStatus.PAUSED)
```
DRAFT and COMPLETED campaigns are silently excluded. The tool description says
"List email campaigns in Cheerful" with no mention of this restriction.
Claude cannot use this tool to see draft campaigns being set up or completed campaigns for reference.

**Gap 2 — Owner-only, not team-accessible**:
The service route calls `repo.get_by_user_id(user_id)` which returns only campaigns owned by the user.
The main API endpoint (`GET /v1/campaigns`) also includes campaigns the user is assigned to via
`campaign_member_assignment`. Team members cannot see assigned campaigns via `cheerful_list_campaigns`.

**Gap 3 — No filtering parameters**:
`ListCampaignsInput` is empty — no way to filter by type, status, date, or search by name.
The main API supports `campaign_ids` filter and `include_stats` toggle.

### Security Assessment
`user_id` IS correctly validated here. The service endpoint declares `user_id: uuid.UUID = Query(...)` as required.
FastAPI will reject requests without a valid UUID for `user_id`. This is the **only** existing service tool that correctly enforces user identity at the backend layer.

### Reference
Documented in `specs/campaigns.md` lines 115-208, section "Campaign Core CRUD".

---

## Tool 2: `cheerful_search_emails`

### Implementation Chain
```
cheerful_search_emails(params: SearchEmailsInput)
  → api.search_threads(base_url, api_key, user_id, campaign_id, query, direction, limit)
  → GET /api/service/threads/search?user_id={}&campaign_id={}&query={}&limit={}&direction={}
  → service.search_threads(campaign_id, query, direction, limit)  ← NO user_id param!
  → gmail_repo.search_threads_by_campaign() + smtp_repo.search_threads_by_campaign()
  → returns list[ThreadSearchResult]
  → formatted by _fmt_thread_summaries() → _fmt_thread_summary() per item
```

### Actual Backend Response Schema (`ThreadSearchResult`)
```
gmail_thread_id: str           — Gmail hex ID or SMTP angle-bracket ID
subject: str                   — Email subject line
sender_email: str              — Sender email address
recipient_emails: list[str]    — Array of recipient email addresses
direction: str                 — "inbound" or "outbound" (lowercase)
message_count: int             — Number of messages in the thread
latest_date: datetime          — Most recent message timestamp
matched_snippet: str           — Text snippet containing the search match
```

### Formatter Bugs (`_fmt_thread_summary` in tools.py lines 100-115)

| Line | Formatter reads | Actual field | Impact |
|------|----------------|--------------|--------|
| 103 | `thread.get("sender", "")` | `sender_email` | `<sender></sender>` always empty |
| 104 | `thread.get("recipient", "")` | `recipient_emails` (list) | `<recipient></recipient>` always empty |
| 105 | `thread.get("direction", "")` | `direction` | CORRECT — this field name matches |
| 106 | `thread.get("date", "")` | `latest_date` | `<date></date>` always empty |
| 107-109 | `thread.get("snippet", "")` | `matched_snippet` | `<snippet></snippet>` always empty |

**Critical**: 4 of 5 key rendering fields are empty in every response. The tool returns XML with
mostly empty tags — Claude receives almost no useful data from search results.

### Security Gap
The service endpoint `search_threads` does NOT accept `user_id`:
```python
def search_threads(
    campaign_id: uuid.UUID = Query(...),
    query: str = Query(...),
    direction: str | None = Query(None),
    limit: int = Query(20, le=50),
):
```
The CE client sends `user_id` as a query param but FastAPI silently ignores it.
**Any caller with the service API key can search any campaign by ID, regardless of ownership.**
The only access control is knowing the campaign UUID.

### Reference
Documented in `specs/email.md` lines 33-137 and `specs/search-and-discovery.md` lines 73-103.

---

## Tool 3: `cheerful_get_thread`

### Implementation Chain
```
cheerful_get_thread(params: GetThreadInput)
  → api.get_thread(base_url, api_key, user_id, gmail_thread_id)
  → GET /api/service/threads/{gmail_thread_id}?user_id={user_id}
  → service.get_thread(gmail_thread_id: str)  ← NO user_id param!
  → detects SMTP by angle-bracket format
  → returns ThreadDetailResponse
  → formatted by _fmt_thread_detail() → _fmt_message() per item
```

### Actual Backend Response Schema

**Top-level `ThreadDetailResponse`**:
```
gmail_thread_id: str      — The thread ID (same as input)
messages: list[ThreadMessage]
```

**Per-message `ThreadMessage`**:
```
gmail_message_id: str         — Gmail message ID (hex) or SMTP message-ID header
direction: str                — "inbound" or "outbound" (lowercase)
sender_email: str             — Sender email address
recipient_emails: list[str]   — Array of recipient addresses
subject: str                  — Email subject (empty string if null in DB)
body_text: str                — Plain text body (empty string if null in DB)
internal_date: datetime       — ISO 8601 timestamp
```

### Formatter Bugs

**Bug 1 — Top-level `subject` field does not exist**:
```python
# tools.py _fmt_thread_detail line 144:
content = tag("subject", str(thread.get("subject", "No subject")))
```
`ThreadDetailResponse` has NO top-level `subject` field. The subject is on each individual
`ThreadMessage`. The formatter reads a non-existent top-level field and always falls back
to "No subject" — even when messages exist with real subjects.
**Fix**: Read `thread.get("messages", [{}])[0].get("subject", "No subject")`.

**Bug 2 — `from` → should be `sender_email`** (`_fmt_message` line 131):
```python
# WRONG:
content = tag("from", str(message.get("from", "")))
# CORRECT:
content = tag("from", str(message.get("sender_email", "")))
```
**Impact**: `<from></from>` always empty.

**Bug 3 — `to` → should be `recipient_emails`** (`_fmt_message` line 132):
```python
# WRONG: recipient_emails is a list, not a single string
content += tag("to", str(message.get("to", "")))
# CORRECT:
recipients = message.get("recipient_emails", [])
content += tag("to", ", ".join(recipients))
```
**Impact**: `<to></to>` always empty.

**Bug 4 — `date` → should be `internal_date`** (`_fmt_message` line 133):
```python
# WRONG:
content += tag("date", str(message.get("date", "")))
# CORRECT:
content += tag("date", str(message.get("internal_date", "")))
```
**Impact**: `<date></date>` always empty.

**Correct field** — `body_text` reading works:
```python
body = str(message.get("body_text", message.get("snippet", "")))
```
`body_text` is the correct field name. The fallback `snippet` doesn't exist in `ThreadMessage`
but is harmless (just redundant). Body text IS correctly rendered.

### Security Gap
The service endpoint `get_thread` has no `user_id` parameter at all:
```python
@router.get("/threads/{gmail_thread_id}", response_model=ThreadDetailResponse)
def get_thread(gmail_thread_id: str):
```
**Any thread can be fetched by ID without ownership verification.** No user scoping exists.
The CE client sends `user_id` as a query param but the backend ignores it.

### Reference
Documented in `specs/email.md` lines 140-244, section "Thread Listing & Filtering".

---

## Tool 4: `cheerful_find_similar_emails`

### Implementation Chain
```
cheerful_find_similar_emails(params: FindSimilarEmailsInput)
  → validates: either query or thread_id required
  → api.find_similar(base_url, api_key, user_id, campaign_id, query, thread_id, limit, min_similarity)
  → GET /api/service/rag/similar?user_id={}&campaign_id={}&...
  → service.find_similar(campaign_id, query, thread_id, limit, min_similarity)  ← NO user_id!
  → EmbeddingService().embed_text() → EmailReplyExampleRepository.search_similar()
  → returns list[SimilarEmailResult]
  → formatted by _fmt_similar_emails() → _fmt_similar_email() per item
```

### Actual Backend Response Schema (`SimilarEmailResult`)
```
thread_id: str                    — Thread ID of the similar email
campaign_id: str                  — Campaign UUID the reply example belongs to
thread_summary: str               — AI-generated summary of the thread conversation
inbound_email_text: str           — The inbound email text that was replied to
sent_reply_text: str              — The actual reply that was sent
sanitized_reply_text: str | None  — Sanitized/cleaned reply (null if not available)
similarity: float                 — Cosine similarity score (0.0 to 1.0)
```

Note: there is NO `subject` field in `SimilarEmailResult`.

### Formatter Bugs (`_fmt_similar_email` in tools.py lines 159-174)

| Line | Formatter reads | Actual field | Impact |
|------|----------------|--------------|--------|
| 161 | `result.get('similarity', 0)` | `similarity` | CORRECT |
| 162 | `result.get('subject', '')` | *does not exist* | `<subject></subject>` always empty; should be removed |
| 163 | `result.get('summary', '')` | `thread_summary` | `<summary></summary>` always empty |
| 164-167 | `result.get('reply_text', '')` | `sent_reply_text` | `<reply-text></reply-text>` always empty |
| 173 | `result.get('thread_id', ...)` | `thread_id` | CORRECT (ID attribute works) |

**Critical**: The two most important content fields (`thread_summary` and `sent_reply_text`) are
always empty. The tool returns similarity scores and IDs but no actual content — completely useless
for Claude to learn from similar email patterns.

**Missing from formatter**: `inbound_email_text` (the inbound email) and `sanitized_reply_text`
(the cleaned reply for templating) are never rendered.

### Security Gap
Service endpoint ignores `user_id` (not in function signature):
```python
def find_similar(
    campaign_id: uuid.UUID = Query(...),
    query: str | None = Query(None),
    thread_id: str | None = Query(None),
    limit: int = Query(5, le=10),
    min_similarity: float = Query(0.3),
):
```
Any caller can search any campaign's reply examples by knowing the `campaign_id`.

### Reference
Documented in `specs/email.md` lines 246-299 and `specs/search-and-discovery.md` lines 106-131.

---

## Tool 5: `cheerful_list_campaign_creators`

### Implementation Chain
```
cheerful_list_campaign_creators(params: ListCampaignCreatorsInput)
  → api.list_campaign_creators(base_url, api_key, user_id, campaign_id, gifting_status, role, limit)
  → GET /api/service/campaigns/{campaign_id}/creators?user_id={}&limit={}&gifting_status={}&role={}
  → service.list_campaign_creators(campaign_id, gifting_status, role, limit, offset)
       ↑ NOTE: offset is accepted by backend but NOT sent by CE!
  → CampaignCreatorRepository.get_by_campaign_id_paginated()
  → Python-side filtering for gifting_status and role
  → returns ServiceCampaignCreatorListResponse
  → formatted by _fmt_creator_list() → _fmt_creator_summary() per item
```

### Missing Parameter: `offset`
The service endpoint accepts `offset: int = Query(0, ge=0)` but:
1. `ListCampaignCreatorsInput` has no `offset` field
2. `api.list_campaign_creators()` never sends `offset` to the backend

**Impact**: Only the first page of results can ever be fetched. For campaigns with 100+ creators,
the tool is limited to the first `limit` entries (max 100) with no way to paginate.

**Fix required**:
```python
class ListCampaignCreatorsInput(BaseModel):
    campaign_id: str = Field(...)
    gifting_status: str | None = Field(default=None, ...)
    role: str | None = Field(default=None, ...)
    limit: int = Field(default=50, le=100, ...)
    offset: int = Field(default=0, ge=0, description="Pagination offset")  # ADD THIS
```

### Behavioral Subtlety: Filter Applied in Python, Not SQL
The backend fetches `limit + 1` creators from the DB, then applies gifting_status and role filters
in Python AFTER the DB query:
```python
creators = repo.get_by_campaign_id_paginated(campaign_id, limit=limit + 1, offset=offset)
if gifting_status:
    creators = [c for c in creators if c.gifting_status == gifting_status]
if role:
    creators = [c for c in creators if c.role == role]
```
**Implication**: When filters are active, the effective number of returned results may be much
less than `limit`. To get all filtered creators, the client must iterate with `offset`.

### `total` Field Semantics
The `total` field in the response is the UNFILTERED total (all creators in the campaign),
not the count matching the applied filters. This is a semantic mismatch — when filtering by
`gifting_status`, `total` still reflects all creators.

### Formatter Assessment
`_fmt_creator_list` and `_fmt_creator_summary` read the correct field names:
- `creators`, `total` — correct
- `id`, `name`, `email`, `role`, `gifting_status`, `paid_promotion_status` — all correct
- `latest_interaction_at`, `social_media_handles` — correct
No formatter bugs. The formatter is accurate for the fields it renders.

### Security Gap
Service endpoint does NOT accept `user_id`:
```python
def list_campaign_creators(
    campaign_id: uuid.UUID,
    gifting_status: str | None = Query(None),
    role: str | None = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
):
```
Any caller with service API key can list creators in any campaign by knowing the campaign UUID.

### Reference
Documented in `specs/creators.md` lines 31-130 and `specs/search-and-discovery.md` lines 135-142.

---

## Tool 6: `cheerful_get_campaign_creator`

### Implementation Chain
```
cheerful_get_campaign_creator(params: GetCampaignCreatorInput)
  → api.get_campaign_creator(base_url, api_key, user_id, campaign_id, creator_id)
  → GET /api/service/campaigns/{campaign_id}/creators/{creator_id}?user_id={user_id}
  → service.get_campaign_creator(campaign_id: uuid.UUID, creator_id: uuid.UUID)  ← NO user_id!
  → SELECT CampaignCreator WHERE id=creator_id AND campaign_id=campaign_id
  → if not found: 404
  → returns ServiceCampaignCreatorDetailResponse
  → formatted by _fmt_creator_detail()
```

### Actual Backend Response Schema (`ServiceCampaignCreatorDetailResponse`)
Fields returned by `service.py` `get_campaign_creator()` (verified from source):
```
id: str                          — campaign creator UUID
campaign_id: str                 — campaign UUID
name: str | None                 — creator display name
email: str | None                — email address (null if not enriched)
role: str                        — one of: creator, talent_manager, agency_staff, internal, unknown
gifting_status: str | None       — gifting pipeline status
gifting_address: str | None      — shipping address
gifting_discount_code: str | None — discount code
paid_promotion_status: str | None — paid promotion pipeline status
paid_promotion_rate: str | None  — rate/pricing
talent_manager_name: str | None  — talent manager name
talent_manager_email: str | None — talent manager email
talent_agency: str | None        — agency name
social_media_handles: list[dict] — [{platform, handle, url}]
notes_history: list[dict]        — [{content, ...}]
confidence_score: float          — email enrichment confidence (defaults to 0.0 if null in DB)
manually_verified: bool          — whether email was manually verified
latest_interaction_at: str | None — last interaction timestamp (ISO 8601 string)
created_at: str | None           — creation timestamp
updated_at: str | None           — last update timestamp
```

### SPEC INACCURACY: Fields in `specs/creators.md` Not in Service Response

The `specs/creators.md` return schema (lines 152-191) documents 3 fields that do NOT exist
in `ServiceCampaignCreatorDetailResponse`:

| Field in spec | In service.py model | In service.py response | Source |
|---------------|--------------------|-----------------------|--------|
| `enrichment_status` | NO | NO | Only in CampaignCreator DB model |
| `source` | NO | NO | Only in CampaignCreator DB model |
| `post_opt_in_follow_up_status` | NO | NO | Only in CampaignCreator DB model |

**Root cause**: The Wave 3 spec was written based on the full `CampaignCreator` DB model (which
has these fields) but the actual service endpoint serializes only the subset defined in
`ServiceCampaignCreatorDetailResponse`. These 3 fields require a service route enhancement
to be accessible from the context engine.

**Impact**: A forward loop implementer reading `specs/creators.md` would expect to read
`enrichment_status`, `source`, and `post_opt_in_follow_up_status` from the tool response,
but these fields will never be present in the actual response until the service model is updated.

**Correction needed in `specs/creators.md`**: The return schema must be corrected to remove
these 3 fields and note them as "requires service route enhancement".

### Formatter Assessment
`_fmt_creator_detail` reads correct field names for all fields it renders:
- `id`, `campaign_id`, `name`, `email`, `role` — all correct
- `gifting_status`, `gifting_address`, `gifting_discount_code` — all correct
- `paid_promotion_status`, `paid_promotion_rate` — all correct
- `talent_manager_name`, `talent_manager_email`, `talent_agency` — all correct
- `social_media_handles`, `notes_history` — all correct
- `confidence_score`, `manually_verified` — all correct
- `latest_interaction_at`, `created_at`, `updated_at` — all correct
No formatter field name bugs. The formatter correctly renders all fields it attempts to render.

### Security Gap
Service endpoint does NOT accept `user_id`:
```python
def get_campaign_creator(
    campaign_id: uuid.UUID,
    creator_id: uuid.UUID,
):
```
No user ownership check. Any caller can get any creator if they know the campaign_id and creator_id.

### Error Message Correction
The api.py client raises:
```python
raise ToolError(f"Creator '{creator_id}' not found in campaign '{campaign_id}'")
```
The backend raises:
```python
raise HTTPException(status_code=404, detail="Campaign creator not found")
```
These error messages differ — the tool wraps the backend message in its own format.

---

## Tool 7: `cheerful_search_campaign_creators`

### Implementation Chain
```
cheerful_search_campaign_creators(params: SearchCampaignCreatorsInput)
  → api.search_creators(base_url, api_key, user_id, query, campaign_id, limit)
  → GET /api/service/creators/search?user_id={}&query={}&limit={}&campaign_id={}
  → service.search_creators(query, campaign_id, limit)  ← NO user_id!
  → CampaignCreatorRepository.search_across_campaigns(query, campaign_id, limit)
  → when campaign_id=None: searches ALL campaigns in DB (no user filter!)
  → returns ServiceCreatorSearchResponse
  → formatted by _fmt_creator_search_results()
```

### CRITICAL Security Gap: Global Search
When `campaign_id` is not provided, `search_across_campaigns(query=query, campaign_id=None, limit=limit)`
searches **all campaigns across all users in the database**. The `user_id` is sent by the CE
client but the backend endpoint does not declare it as a parameter, so FastAPI ignores it entirely.

A query like `cheerful_search_campaign_creators(query="sarah")` may return creators from
other organizations' campaigns. Even with `campaign_id` provided, there is no check that
the campaign belongs to the calling user.

### Missing Parameter: `offset`
The tool has no `offset` parameter. The backend service endpoint does not currently expose
`offset` either (unlike `list_campaign_creators`). But the underlying repository would
support it. Currently no pagination is possible beyond the first `limit` results.

### Formatter Assessment
`_fmt_creator_search_results` reads `data.get("results", [])` — correct field name.
`_fmt_creator_search_result` reads all correct field names:
- `name`, `email`, `role`, `campaign_id`, `campaign_name`, `gifting_status` — all correct
- `social_media_handles` — correct
- `id` for tag attribute — correct
No formatter bugs for this tool.

### Input Model Validation Gap
`SearchCampaignCreatorsInput` declares `limit: int = Field(default=20, description="Max results")`
with no upper bound. The backend accepts `le=50`. If Claude specifies `limit=100`, the backend will
reject it with a 422 error. The input model should add `le=50`.

---

## Cross-Cutting Security Summary

All 5 service endpoints that accept `user_id` from the CE client do NOT actually enforce it
at the backend layer (except `cheerful_list_campaigns`):

| Endpoint | user_id param declared? | user_id enforced? |
|----------|------------------------|-------------------|
| `GET /api/service/campaigns` | YES (required Query param) | YES — `get_by_user_id()` |
| `GET /api/service/threads/search` | NO — silently ignored | NO |
| `GET /api/service/threads/{id}` | NO — silently ignored | NO |
| `GET /api/service/rag/similar` | NO — silently ignored | NO |
| `GET /api/service/campaigns/{id}/creators` | NO — silently ignored | NO |
| `GET /api/service/campaigns/{id}/creators/{id}` | NO — silently ignored | NO |
| `GET /api/service/creators/search` | NO — silently ignored | NO |

The CE client sends `user_id` on every request (correctly), but 6 of 7 service routes
ignore it. Any service API key holder can access any data.

---

## Prioritized Fix List

### P0 — Formatter bugs causing empty output (tools currently return garbage data)

1. **`cheerful_search_emails`**: Fix `_fmt_thread_summary` field names:
   - `sender` → `sender_email`
   - `recipient` → `recipient_emails` (join with ", ")
   - `date` → `latest_date`
   - `snippet` → `matched_snippet`

2. **`cheerful_get_thread`**: Fix `_fmt_thread_detail` and `_fmt_message` field names:
   - Top-level `subject` → read from `messages[0].subject` if messages exist
   - `from` → `sender_email`
   - `to` → `recipient_emails` (join with ", ")
   - `date` → `internal_date`

3. **`cheerful_find_similar_emails`**: Fix `_fmt_similar_email` field names:
   - `summary` → `thread_summary`
   - `reply_text` → `sent_reply_text`
   - Remove `subject` tag (field doesn't exist in response)
   - Add `inbound_email_text` rendering

4. **`cheerful_list_campaigns`**: Fix `_fmt_campaign` field names:
   - `type` → `campaign_type`
   - Remove `gmail_account_id` tag (field doesn't exist in service response)
   - Add `status` rendering
   - Add `slack_channel_id` rendering

### P1 — Missing parameters causing broken pagination

5. **`cheerful_list_campaign_creators`**: Add `offset` field to `ListCampaignCreatorsInput`
   and pass through in `api.list_campaign_creators()`.

6. **`cheerful_search_campaign_creators`**: Add `le=50` bound to `limit` field.

### P2 — Spec inaccuracy requiring correction

7. **`specs/creators.md` `cheerful_get_campaign_creator` return schema**: Remove `enrichment_status`,
   `source`, and `post_opt_in_follow_up_status` from the return schema (these are DB fields not
   in `ServiceCampaignCreatorDetailResponse`). Add note: "Requires service route enhancement to expose."

### P3 — Security gaps requiring service route fixes (backend changes)

8. All 6 service routes except `list_campaigns` need `user_id: uuid.UUID = Query(...)` added
   and enforced (verify campaign/thread ownership against the user).

9. **`cheerful_search_campaign_creators`**: Service route must filter to user-owned campaigns only
   even when `campaign_id` is null.

### P4 — Behavioral gaps requiring enhanced service routes (new features)

10. **`cheerful_list_campaigns`**: Service route must add team-accessible campaigns (not just owned).
11. **`cheerful_list_campaigns`**: Add `statuses`, `campaign_ids` filter params to service route.

---

## Files Updated by This Audit

- `analysis/existing-tools-audit.md` — this file (new)
- `specs/creators.md` — the `cheerful_get_campaign_creator` return schema inaccuracy
  (3 fields in spec that don't exist in service model) is documented here for the first time.
  The creators.md spec should be corrected accordingly.
