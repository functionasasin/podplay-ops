# Spec: Backend API Contract

**Synthesized from:** `backend-api-surface.md`, `backend-services.md`, `auth-permissions.md`

---

## 1. Architecture Overview

The Cheerful backend is a **FastAPI application** with ~110 endpoints across 26 route files. It exposes a RESTful JSON API consumed by:

1. **Next.js webapp** (primary consumer) — authenticated via Supabase JWTs
2. **Context engine / Claude agent** — authenticated via service API key
3. **Slack** — webhook payloads verified via HMAC-SHA256 signature

All business logic lives in a **service layer** backed by a **typed repository layer** over SQLAlchemy Core. No raw SQL outside repositories.

```
Request → FastAPI Router → Auth Dependency → Route Handler
              ↓                                    ↓
        JWT/APIKey                           Service Layer
        verification                              ↓
                                         Repository Layer
                                              ↓
                                         SQLAlchemy Core → PostgreSQL
                                              ↓ (async ops)
                                         Temporal Workflow Engine
```

---

## 2. Authentication

### 2.1 Auth Dependency Tiers

| Tier | Mechanism | Header | Used By |
|------|-----------|--------|---------|
| **JWT (user)** | Supabase HS256/ES256 JWT | `Authorization: Bearer {token}` | All webapp-facing routes |
| **API key** | Shared secret | `X-Service-Api-Key: {key}` | `/service/` internal routes only |
| **Slack signature** | HMAC-SHA256 over body | `X-Slack-Signature` + `X-Slack-Request-Timestamp` | `/slack/interactions` |
| **No auth** | None | — | Public profile endpoints, Google Sheets tab reader |
| **Optional** | JWT or none | `Authorization` (optional) | Webhook callbacks |

### 2.2 JWT Validation

**Dependency:** `get_current_user()` in `src/api/dependencies/auth.py`

```python
# Returns this dict on success:
{
    "user_id": "uuid-string",   # auth.users.id (from JWT sub claim)
    "email": "user@example.com", # from JWT email claim
    "role": "authenticated",     # from JWT role claim
    "payload": { ... }           # full decoded payload
}
```

**Algorithm detection:** Reads unverified JWT header to check `alg` field:
- `HS256` → verify with `SUPABASE_JWT_SECRET`
- `ES256` → fetch JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`

**Clock leeway:** 60 seconds allowed for token expiry.

**Error responses:**
- `401 Unauthorized` — missing, malformed, expired, or invalid signature

### 2.3 Service API Key Validation

**Dependency:** `verify_service_api_key` in `src/api/dependencies/service_auth.py`

Compares `X-Service-Api-Key` header value to `settings.SERVICE_API_KEY` (env var). Constant-time comparison to prevent timing attacks.

**Error:** `403 Forbidden` on mismatch.

### 2.4 Slack Signature Verification

Standard Slack request verification:
1. Extract `X-Slack-Request-Timestamp` (reject if >5 minutes old)
2. Compute `HMAC-SHA256(f"v0:{timestamp}:{body}", SLACK_SIGNING_SECRET)`
3. Compare to `X-Slack-Signature: v0={hex_digest}`

**Error:** `403 Forbidden` on mismatch.

### 2.5 Dev-Only Impersonation

**Only active in `DEPLOY_ENVIRONMENT == "development"`.**

Add header `X-Impersonate-User: {target_email}` to any JWT-authenticated request. Backend looks up `user_gmail_account.user_id` for that email and acts as them. All impersonation events are logged. Raises `403 Forbidden` in production.

---

## 3. Authorization Model

### 3.1 Data Isolation Principle

Every backend query scopes to `user_id` from the JWT. The backend uses `service_role` Supabase client (bypasses PostgreSQL RLS) and enforces ownership explicitly in WHERE clauses.

RLS policies are a defense-in-depth backstop for direct database access; the API layer enforces its own ownership checks.

### 3.2 Campaign Access Rules

A user may access a campaign if:
- They **own** it: `campaign.user_id = requesting_user_id`, OR
- They are **assigned** to it: `campaign_member_assignment.user_id = requesting_user_id`

This is verified at the API layer via `CampaignMemberAssignmentRepository` lookup.

### 3.3 Permission Matrix

| Action | Campaign Owner | Assigned Member | Unassigned Member | Unauthenticated |
|--------|:---:|:---:|:---:|:---:|
| List own campaigns | ✓ | Assigned only | ✗ | ✗ |
| View campaign details | ✓ | ✓ | ✗ | ✗ |
| Create/edit/delete campaign | ✓ | ✗ | ✗ | ✗ |
| Launch campaign | ✓ | ✗ | ✗ | ✗ |
| View recipients/threads | ✓ | ✓ | ✗ | ✗ |
| Add/edit recipients | ✓ | ✓ | ✗ | ✗ |
| View sender accounts | ✓ | API-layer only | ✗ | ✗ |
| Assign campaigns to members | Team owner only | ✗ | ✗ | ✗ |
| View public creator profiles | — | — | — | ✓ |

---

## 4. Cross-Cutting API Conventions

### 4.1 Pagination

Standard pagination on all list endpoints:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | int | 50 | 100 | Items per page |
| `offset` | int | 0 | — | Items to skip |

**Response envelope (two patterns):**

```json
// Pattern A — most list endpoints
{ "items": [...], "total": 243 }

// Pattern B — some endpoints
{ "results": [...], "total": 243 }
```

### 4.2 Error Status Codes

| Code | Condition | Example |
|------|-----------|---------|
| `400 Bad Request` | Invalid request body, validation failure | Missing required field |
| `401 Unauthorized` | Missing/invalid/expired JWT | No Authorization header |
| `403 Forbidden` | Valid auth but no permission | Team member tries to delete campaign |
| `404 Not Found` | Resource not found OR user lacks access | Prevents resource enumeration |
| `409 Conflict` | Unique constraint, version mismatch, race condition | Duplicate campaign name, stale draft |
| `422 Unprocessable Entity` | Pydantic validation error | Invalid enum value |
| `502/503` | External service error | Shopify down, YouTube unreachable |

### 4.3 Async Operation Pattern

| Operation | Mechanism | Client Response |
|-----------|-----------|-----------------|
| Campaign launch | Temporal workflow | `{status, workflow_id}` — client polls or uses push |
| Creator enrichment | Temporal workflow | `{workflow_id}` — client polls `/enrichment-status` |
| Bulk draft edit | Temporal workflow | `{workflow_id, message}` |
| Profile scrape | Background task | `202 Accepted` — no polling endpoint |
| Post refresh | Synchronous | `200 OK` — blocks until complete |

### 4.4 Form Data vs JSON

Most endpoints accept `application/json`. Exceptions:
- `POST /campaigns/{id}/recipients/from-csv` — `multipart/form-data` with `file` field
- `POST /campaigns/draft` — `multipart/form-data` (campaign wizard FormData)

### 4.5 Async vs Sync Response

All endpoint handlers are `async def`. Database calls use synchronous SQLAlchemy Core (I/O happens in thread pool via FastAPI's `run_in_executor` wrapping). Temporal workflow calls are async via the Python Temporal SDK.

---

## 5. Endpoint Catalog

### Domain 1: Campaigns — Core CRUD

**Source:** `src/api/route/campaign.py` (102KB)

**Purpose:** Every outreach effort is organized as a campaign. This is the central resource.

#### `POST /campaigns/`

**Auth:** Required (JWT)
**Purpose:** Create a new campaign.

**Request Body:**
```json
{
  "name": "Summer Seeding 2026",
  "campaign_type": "gifting",
  "product_ids": ["uuid", "uuid"],
  "sender_accounts": ["sender@brand.com"]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Summer Seeding 2026",
  "campaign_type": "gifting",
  "status": "draft",
  "user_id": "uuid",
  "product_ids": [],
  "senders": [],
  "created_at": "2026-02-26T10:00:00Z",
  "updated_at": "2026-02-26T10:00:00Z"
}
```

#### `GET /campaigns/`

**Auth:** Required (JWT)
**Purpose:** List campaigns for the authenticated user (owned + assigned).

**Query Parameters:**
- `limit` (int, default 50, max 100)
- `offset` (int, default 0)
- `status` (str, optional) — filter by campaign status

**Response `200`:** `{ "items": [CampaignResponse], "total": N }`

#### `GET /campaigns/{campaign_id}`

**Auth:** Required (JWT)
**Authorization:** Campaign owner or assigned member
**Response `200`:** `CampaignResponse`
**Response `404`:** Not found or no access (same response — prevents enumeration)

#### `PATCH /campaigns/{campaign_id}`

**Auth:** Required (JWT)
**Authorization:** Campaign owner only
**Updatable fields:** `name`, `description`, `status`, `slack_channel_id`

#### `DELETE /campaigns/{campaign_id}`

**Auth:** Required (JWT)
**Authorization:** Campaign owner only

---

#### `GET /campaigns/{campaign_id}/products`

**Auth:** Required; owner or assigned member
**Response:** `[ProductResponse]`

#### `POST /campaigns/{campaign_id}/products`

**Auth:** Required; owner only
**Body:** `{ "product_ids": ["uuid", "uuid"] }`

#### `DELETE /campaigns/{campaign_id}/products/{product_id}`

**Auth:** Required; owner only

---

#### `GET /campaigns/{campaign_id}/senders`

**Auth:** Required; owner or assigned member
**Response:** `[CampaignSenderDetailResponse]`

```json
{
  "id": "uuid",
  "account_id": "uuid",
  "account_type": "gmail",
  "from_name": "Jane from Acme",
  "reply_to": "support@acme.com",
  "created_at": "..."
}
```

#### `POST /campaigns/{campaign_id}/senders`

**Auth:** Required; owner only
**Body:** `{ "gmail_account_id": "uuid" }` OR `{ "smtp_account_id": "uuid" }`

#### `PATCH /campaigns/{campaign_id}/senders/{sender_id}`

**Auth:** Required; owner only
**Body:** `{ "from_name": "string", "reply_to": "email" }`

#### `DELETE /campaigns/{campaign_id}/senders/{sender_id}`

**Auth:** Required; owner only

---

#### `GET /campaigns/{campaign_id}/signatures`

**Auth:** Required; owner or assigned member
**Response:** `[SignatureResponse]` — signatures available for this campaign (user-level + campaign-specific)

#### `PATCH /campaigns/{campaign_id}/signatures/{signature_id}`

**Auth:** Required; owner only
**Body:** `{ "is_default": true }`

---

#### `GET /campaigns/{campaign_id}/recipients`

**Auth:** Required; owner or assigned member
**Query:** `limit`, `offset`
**Response:** `{ "items": [CampaignRecipientResponse], "total": N }`

```json
{
  "email": "creator@example.com",
  "name": "Jane Influencer",
  "phone": "+15555555555",
  "job_title": "Content Creator",
  "company": "Self",
  "location": "NYC",
  "notes": "Great engagement rate"
}
```

#### `POST /campaigns/{campaign_id}/recipients/bulk-upsert`

**Auth:** Required; owner or assigned member
**Purpose:** Add/update multiple recipients in one call.
**Body:** `{ "recipients": [CampaignRecipientInput] }`
**Idempotency:** Dedup key is `(campaign_id, email)` — safe to re-submit.

#### `POST /campaigns/{campaign_id}/recipients/from-csv`

**Auth:** Required; owner or assigned member
**Content-Type:** `multipart/form-data`
**Form field:** `file` — CSV file
**CSV columns:** `email` (required), `name`, `phone`, `job_title`, `company`, `location`, `notes` (optional)
**Header normalization:** Aliases accepted: `email_address` → `email`, `full_name` → `name`
**Response:** `{ "added": N, "skipped": N, "skipped_rows": [{ "row": ..., "reason": "..." }] }`

#### `GET /campaigns/{campaign_id}/recipients/from-sheet`

**Auth:** Required; owner or assigned member
**Query:** `url` — Google Sheets URL
**Purpose:** List available sheet tabs before importing.
**Response:** `{ "sheets": [{ "name": "Sheet1", "id": 0 }] }`

#### `GET /campaigns/{campaign_id}/recipients/validate-sheet`

**Auth:** Required
**Query:** `url`, `tab_name`
**Purpose:** Validate column structure of a specific tab before import.

---

#### `GET /campaigns/{campaign_id}/outbox`

**Auth:** Required; owner or assigned member
**Query:** `limit`, `offset`, `status` (pending/sent/failed)
**Response:** `{ "items": [OutboxQueueResponse], "total": N }`

#### `POST /campaigns/{campaign_id}/outbox/populate`

**Auth:** Required; owner only
**Purpose:** Manually populate the outbox queue (normally called at launch). Used for adding late-joined senders.
**Body:** `{ "account_ids": ["uuid"] }`

---

#### `GET /campaigns/{campaign_id}/merge-tags`

**Auth:** Required
**Response:** Available `{placeholder}` tags for this campaign's templates.

#### `GET /campaigns/{campaign_id}/signatures-list`

**Auth:** Required
**Response:** Signatures available for use in this campaign.

#### `POST /campaigns/{campaign_id}/client-summary`

**Auth:** Required
**Body:** `{ "selected_fields": ["name", "status", "opt_in_rate"] }`
**Purpose:** Generate AI summary of campaign for sharing with clients.

#### `GET /campaigns/{campaign_id}/creators`

**Auth:** Required; owner or assigned member
**Query:** `limit`, `offset`, `enrichment_status` (pending/enriching/found/not_found)
**Response:** `{ "items": [CampaignCreatorResponse], "total": N }`

#### `GET /campaigns/{campaign_id}/creators/enrichment-status`

**Auth:** Required
**Purpose:** Lightweight poll endpoint — only returns creators in pending/enriching state. Efficient for polling loops.

---

### Domain 2: Campaign Launch

**Source:** `src/api/route/campaign_launch.py` (47KB)

#### `POST /campaigns/draft`

**Auth:** Required (JWT)
**Content-Type:** `multipart/form-data`
**Purpose:** Save wizard state mid-configuration so the user can resume later.
**Response:** `{ "draft_id": "uuid" }`

#### `GET /campaigns/draft/{draft_id}`

**Auth:** Required
**Response:** Full draft state blob (matches wizard store schema)

#### `POST /campaigns/{campaign_id}/launch`

**Auth:** Required; campaign owner only
**Purpose:** Execute campaign — triggers Temporal workflows that send outreach emails.

**Request Body (`CampaignLaunchRequest`):**
```json
{
  "campaign_type": "gifting",
  "recipient_data": [
    {
      "email": "creator@example.com",
      "name": "Jane",
      "phone": "+1555...",
      "job_title": "Creator",
      "company": "Self"
    }
  ],
  "sender_accounts": ["sender@brand.com"],
  "is_external": false,
  "product_name": "Acme Skincare",
  "product_description": "...",
  "product_url": "https://shop.acme.com/product",
  "initial_email_body": "Hi {name}, ...",
  "initial_email_subject": "Gift for you",
  "signature_id": "uuid",
  "follow_up_templates": [
    {
      "subject": "Following up...",
      "body": "...",
      "delay_days": 3
    }
  ]
}
```

**Response (`CampaignLaunchResponse`):**
```json
{
  "status": "launched",
  "workflow_id": "temporal-workflow-handle-string"
}
```

**Side effects:** Creates/updates campaign in DB, populates outbox queue, starts Temporal `CampaignLaunchWorkflow`.

---

### Domain 3: Campaign Workflows (AI Automation Rules)

**Source:** `src/api/route/campaign_workflow.py`

**Purpose:** Users compose AI-powered automation rules from a toolbox. When a thread enters a qualifying state, these workflows execute against it.

#### `POST /v1/campaigns/{campaign_id}/workflows`

**Auth:** Required; owner only
**Body:**
```json
{
  "name": "Check for opt-in and create order",
  "instructions": "When a creator says yes, create a Shopify order and notify Slack",
  "tool_slugs": ["goaffpro_create_affiliate", "goaffpro_create_discount"],
  "config": {},
  "output_schema": { "$schema": "...", "properties": { ... } },
  "is_enabled": true
}
```

#### `GET /v1/campaigns/{campaign_id}/workflows`

**Auth:** Required; owner or assigned member
**Response:** `[CampaignWorkflowResponse]`

#### `GET /v1/campaigns/{campaign_id}/workflows/{workflow_id}`

**Auth:** Required; owner or assigned member

#### `PATCH /v1/campaigns/{campaign_id}/workflows/{workflow_id}`

**Auth:** Required; owner only
**Updateable:** `name`, `instructions`, `tool_slugs`, `config`, `output_schema`, `is_enabled`

#### `DELETE /v1/campaigns/{campaign_id}/workflows/{workflow_id}`

**Auth:** Required; owner only

---

### Domain 4: Workflow Executions

**Source:** `src/api/route/campaign_workflow_execution.py`

**Purpose:** Audit log of what AI automation did to each thread.

#### `GET /v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions`

**Auth:** Required; owner or assigned member
**Response:** `[CampaignWorkflowExecutionResponse]`

#### `GET /v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution`

**Auth:** Required
**Purpose:** Get the most recent execution result for a thread — used for Slack approval flows and UI display.
**Response:**
```json
{
  "workflow_id": "uuid",
  "executed_at": "2026-02-26T10:00:00Z",
  "status": "completed",
  "output_data": { ... }
}
```

---

### Domain 5: Campaign Enrichment (Email Discovery)

**Source:** `src/api/route/campaign_enrichment.py`

#### `GET /v1/campaigns/{campaign_id}/creators/enrichment-status`

**Auth:** Required
**Purpose:** Poll-optimized — returns only creators in `pending` or `enriching` state.

#### `POST /v1/campaigns/{campaign_id}/creators/{creator_id}/override-email`

**Auth:** Required; owner or assigned member
**Purpose:** Manually set an email when enrichment fails.
**Body:** `{ "email": "creator@example.com" }`
**Response:**
```json
{
  "creator_id": "uuid",
  "email": "creator@example.com",
  "queued": true
}
```
`queued: true` means the creator was immediately added to the outbox queue.

#### `POST /v1/enrich-creators`

**Auth:** Required
**Purpose:** Start standalone enrichment workflow (outside of a campaign).
**Response:** `{ "workflow_id": "temporal-handle" }`

#### `GET /v1/enrich-creators/{workflow_id}/status`

**Auth:** Required
**Response:** `{ "status": "running|completed|failed", "results": [...] }`

---

### Domain 6: Email Threads (Inbox)

**Source:** `src/api/route/gmail_message.py` (33KB)

#### `GET /threads/`

**Auth:** Required
**Purpose:** List email threads — the primary inbox view.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status_filter[]` | GmailThreadStatus[] | e.g., `PENDING`, `OPTED_IN`, `OPTED_OUT`, `FOLLOW_UP`, `IGNORED` |
| `direction_filter` | "INBOUND" \| "OUTBOUND" | Filter by email direction |
| `campaign_id` | uuid | Single campaign filter |
| `campaign_ids[]` | uuid[] | Multi-campaign filter |
| `gmail_account_ids[]` | uuid[] | Filter by sending account |
| `show_hidden` | bool | Include archived threads |
| `include_messages` | bool | Embed full message list |
| `include_uncategorized` | bool | Include threads without a campaign |
| `only_uncategorized` | bool | Show only uncategorized |
| `limit` | int | default 50 |
| `offset` | int | default 0 |
| `search` | string | Full-text search (sender, recipient, subject) |

**Response:** When `include_messages=true` → `ThreadWithMessages`; otherwise `ThreadSummary`

**`ThreadWithMessages` shape:**
```json
{
  "gmail_thread_id": "string",
  "subject": "string",
  "status": "PENDING",
  "campaign_id": "uuid",
  "messages": [
    {
      "gmail_message_id": "string",
      "from": "creator@example.com",
      "to": ["brand@acme.com"],
      "subject": "Re: Gift for you",
      "body_text": "...",
      "body_html": "...",
      "direction": "INBOUND",
      "internal_date": "2026-02-26T10:00:00Z"
    }
  ],
  "flags": {
    "wants_paid": false,
    "has_question": true,
    "has_issue": false
  },
  "latest_draft": { ... }
}
```

#### `GET /threads/{gmail_thread_id}`

**Auth:** Required
**Response:** `ThreadWithMessages`

#### `GET /threads/{gmail_thread_id}/summary`

**Auth:** Required
**Purpose:** AI-generated summary of the thread (cached if unchanged).

#### `PATCH /threads/{gmail_thread_id}/flags`

**Auth:** Required
**Purpose:** Triage thread with semantic flags.
**Body:** `{ "wants_paid": true, "has_question": false, "has_issue": false, "opted_in": true, "follow_up": false }`

#### `POST /threads/{gmail_thread_id}/hide`

**Auth:** Required
**Purpose:** Archive/hide thread from inbox.
**Body:** `{ "hidden": true }`

---

### Domain 7: Drafts

**Source:** `src/api/route/draft.py`

**Purpose:** Pre-send replies. Drafts may be AI-generated or human-edited. The system handles concurrent LLM and human edits via version tracking.

#### `GET /threads/{gmail_thread_id}/draft`

**Auth:** Required
**Response:**
```json
{
  "content": "<p>Hi Jane...</p>",
  "source": "llm",
  "version_id": "uuid"
}
```

#### `POST /threads/{gmail_thread_id}/draft`

**Auth:** Required
**Purpose:** Create or overwrite a draft.
**Body:** `{ "content": "...", "version_id": "uuid" }`
**Response `409`:** Version mismatch — returns `{ "error": "version_mismatch", "latest_gmail_thread_state_id": "uuid" }`

#### `PUT /threads/{gmail_thread_id}/draft`

**Auth:** Required
**Purpose:** Update draft (partial fields accepted).
**Body:** `{ "content": "...", "signature_id": "uuid" }` — all fields optional
**Response `409`:** Same version mismatch handling as POST

---

### Domain 8: Email Sending

**Source:** `src/api/route/email.py`

#### `POST /emails/send`

**Auth:** Required
**Purpose:** Send an email via Gmail API or SMTP (determined by `account_email` — backend looks up account type).

**Request Body:**
```json
{
  "account_email": "sender@brand.com",
  "to": ["creator@example.com"],
  "cc": [],
  "subject": "Re: Your collaboration",
  "body_html": "<p>Hi Jane...</p>",
  "thread_id": "gmail-thread-id",
  "in_reply_to": "<message-id-header>",
  "references": "<message-id-header>",
  "gmail_thread_state_id": "uuid"
}
```

**Response `200`:**
```json
{
  "message_id": "gmail-message-id",
  "thread_id": "gmail-thread-id",
  "sent_at": "2026-02-26T10:00:00Z"
}
```

---

### Domain 9: Scheduled Email Dispatch

**Source:** `src/api/route/email_dispatch.py`

#### `POST /emails/scheduled`

**Auth:** Required
**Body:**
```json
{
  "gmail_account_id": "uuid",
  "recipient_email": "creator@example.com",
  "subject": "Following up",
  "body_html": "...",
  "dispatch_at": "2026-02-28T09:00:00-05:00",
  "user_timezone": "America/New_York"
}
```
OR use `smtp_account_id` instead of `gmail_account_id`.

#### `GET /emails/scheduled`

**Auth:** Required
**Response:** `[ScheduledEmailResponse]` — pending dispatches for this user

#### `DELETE /emails/scheduled/{dispatch_id}`

**Auth:** Required
**Response `409`:** Status changed since load — concurrent modification detected.

#### `PATCH /emails/scheduled/{dispatch_id}/reschedule`

**Auth:** Required
**Body:** `{ "dispatch_at": "2026-03-01T09:00:00-05:00" }`
**Response `409`:** Same race condition protection.

---

### Domain 10: Email Signatures

**Source:** `src/api/route/email_signature.py`

#### `GET /email-signatures`

**Auth:** Required
**Response:** `[EmailSignatureResponse]` — user-level signatures + campaign-specific overrides

#### `GET /email-signatures/for-reply`

**Auth:** Required
**Purpose:** Optimized response for reply dropdown — returns available signatures with is_default flag.

#### `POST /email-signatures`

**Auth:** Required
**Body:**
```json
{
  "name": "Jane – Acme Brand",
  "content": "<p>Jane Smith<br>Brand Partnerships...</p>",
  "is_default": true,
  "is_enabled": true,
  "campaign_id": "uuid"
}
```
`campaign_id` is optional — omit for user-level signature.
`content` max length: 10,000 chars.

#### `GET /email-signatures/{signature_id}`

**Auth:** Required; owner only

#### `PATCH /email-signatures/{signature_id}`

**Auth:** Required; owner only
**Updatable:** `name`, `content`, `is_default`, `is_enabled`

#### `DELETE /email-signatures/{signature_id}`

**Auth:** Required; owner only

---

### Domain 11: SMTP Account Management

**Source:** `src/api/route/smtp_account.py`

#### `POST /v1/smtp-accounts`

**Auth:** Required
**Purpose:** Register an SMTP/IMAP account. Verifies IMAP connectivity before saving.

**Request Body:**
```json
{
  "email_address": "sender@company.com",
  "display_name": "Jane from Acme",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_username": "sender@company.com",
  "smtp_password": "app-password",
  "smtp_use_tls": true,
  "imap_host": "imap.gmail.com",
  "imap_port": 993,
  "imap_username": "sender@company.com",
  "imap_password": "app-password",
  "imap_use_ssl": true
}
```

**Validation:** Tests IMAP connection before persisting; returns error if connection fails.

#### `GET /v1/smtp-accounts`

**Auth:** Required
**Response:** `[SmtpAccountResponse]` — credentials fields excluded (only metadata returned)

#### `GET /v1/smtp-accounts/{account_id}`

**Auth:** Required; owner only

#### `PATCH /v1/smtp-accounts/{account_id}`

**Auth:** Required; owner only

#### `DELETE /v1/smtp-accounts/{account_id}`

**Auth:** Required; owner only
**Behavior:** Soft-delete (`is_active = false`)

#### `POST /v1/smtp-accounts/bulk-import`

**Auth:** Required
**Purpose:** Import many SMTP accounts at once (team setup).
**Body:** `{ "accounts": [SmtpAccountInput] }`
**Behavior:** Parallel IMAP verification per account; partial success allowed.
**Response:** `{ "created": N, "failed": [{ "email": "...", "error": "..." }] }`

---

### Domain 12: User Settings & Gmail Accounts

**Source:** `src/api/route/user.py`

#### `GET /user/settings`

**Auth:** Required
**Purpose:** Load user preferences. Creates defaults if first call.
**Response:** `UserSettingsResponse`

#### `PUT /user/settings`

**Auth:** Required
**Body:** `UserSettingsInput` (full replace)

#### `GET /user/gmail-accounts`

**Auth:** Required
**Response:** `[GmailAccountResponse]` — no refresh tokens exposed; metadata only.

#### `GET /user/connected-accounts`

**Auth:** Required
**Query:** `account_type` ("gmail" | "smtp" | null for all), `active_only` (bool, default true)
**Response:** `[ConnectedAccountResponse]`
```json
{
  "id": "uuid",
  "email": "sender@brand.com",
  "account_type": "gmail",
  "display_name": "Jane from Acme",
  "is_active": true
}
```

---

### Domain 13: Creator Search & Discovery

**Source:** `src/api/route/creator_search.py`

#### `POST /v1/creator-search/similar`

**Auth:** Required
**Purpose:** Find Instagram creators similar to a known handle (lookalike search via Influencer Club API).

**Request Body:**
```json
{
  "handle": "glossier",
  "platform": "instagram",
  "search_pool_size": 50,
  "region": "US",
  "language": "en",
  "page": 1,
  "followers": { "min": 10000, "max": 500000 },
  "engagement_rate": { "min": 0.02, "max": 0.15 }
}
```

**Response:** `[CreatorSearchResult]` — array of creator profiles with metrics.

#### `POST /v1/creator-search/keyword`

**Auth:** Required
**Request Body:**
```json
{
  "keyword": "sustainable fashion",
  "platform": "instagram",
  "page": 1,
  "limit": 10,
  "followers": { "min": 5000, "max": 1000000 },
  "engagement_rate": { "min": 0.01 },
  "sort_by": "followers",
  "sort_order": "desc"
}
```

#### `POST /v1/creator-search/enrich`

**Auth:** Required
**Purpose:** Enrich a single creator (full profile + email discovery).
**Body:** `{ "handle": "string", "platform": "instagram" }`

#### `POST /v1/creator-search/profile`

**Auth:** Required
**Purpose:** Fetch full Apify-scraped profile (24-hour cache).
**Body:** `{ "handle": "string", "platform": "instagram", "refresh": false }`
**Response includes:** `source` field — "cache" | "stale_cache" | "apify" | "influencer_club"

---

### Domain 14: Creator Profiles (Public)

**Source:** `src/api/route/creator_profile.py`

**No authentication required** — designed for client sharing.

#### `GET /v1/creators/profiles/`

**Auth:** None
**Query:** `limit`, `offset`
**Response:** `{ "items": [CreatorProfileSummary], "total": N }`

#### `GET /v1/creators/profiles/{handle}`

**Auth:** None
**Response (`CreatorProfileDetail`):**
```json
{
  "profile": { "handle": "...", "bio": "...", "follower_count": 50000 },
  "metrics": { "avg_likes": 1200, "engagement_rate": 0.024 },
  "sponsorships": [...],
  "content": [...],
  "scrape_metadata": { "scraped_at": "...", "execution_id": "..." }
}
```

#### `POST /v1/creators/profiles/scrape`

**Auth:** None
**Purpose:** Trigger async profile scrape.
**Body:** `{ "handle": "string", "platform": "instagram" }`
**Response:** `202 Accepted` — `{ "execution_id": "uuid", "status": "queued" }`

---

### Domain 15: Creator Lists

**Source:** `src/api/route/creator_list.py`

#### `GET /v1/lists/`

**Auth:** Required
**Response:** `[CreatorListResponse]` — lists with creator count

#### `POST /v1/lists/`

**Auth:** Required
**Body:** `{ "name": "Spring 2026 Seed List" }`

#### `GET /v1/lists/{list_id}`

**Auth:** Required; owner only

#### `PATCH /v1/lists/{list_id}`

**Auth:** Required; owner only
**Body:** `{ "name": "New Name" }`

#### `DELETE /v1/lists/{list_id}`

**Auth:** Required; owner only

#### `GET /v1/lists/{list_id}/creators`

**Auth:** Required; owner only
**Query:** `limit`, `offset`
**Response:** `{ "items": [CreatorListItemResponse], "total": N }`

#### `POST /v1/lists/{list_id}/creators`

**Auth:** Required
**Body:** `{ "creator_ids": ["uuid", "uuid"] }`

#### `POST /v1/lists/{list_id}/creators/from-search`

**Auth:** Required
**Purpose:** Add creators directly from search results, storing avatar images in Supabase Storage.
**Body:** `{ "creators": [CreatorFromSearchResult] }`

Each `CreatorFromSearchResult`:
```json
{
  "platform": "instagram",
  "handle": "janedoe",
  "email": "jane@example.com",
  "follower_count": 45000,
  "is_verified": false,
  "avatar_url": "https://...",
  "profile_url": "https://instagram.com/janedoe",
  "name": "Jane Doe"
}
```

#### `POST /v1/lists/{list_id}/creators/from-csv`

**Auth:** Required
**Content-Type:** `multipart/form-data`
**Form field:** `file`
**Additional columns:** Instagram/YouTube URL columns accepted and validated.

#### `DELETE /v1/lists/{list_id}/creators/{creator_id}`

**Auth:** Required; owner only

#### `POST /v1/lists/{list_id}/add-to-campaign`

**Auth:** Required
**Purpose:** Move selected creators from list to campaign. Triggers enrichment for creators without emails.
**Body:** `{ "campaign_id": "uuid", "creator_ids": ["uuid"] }` — `creator_ids` optional (all if omitted)
**Response:** `{ "added": N, "enrichment_pending": N, "campaign_creator_ids": ["uuid"] }`

---

### Domain 16: Creator Posts (Content Verification)

**Source:** `src/api/route/creator_post.py`

#### `GET /v1/campaigns/{campaign_id}/creators/{creator_id}/posts`

**Auth:** Required; owner or assigned member
**Response (`CreatorPostsResponse`):**
```json
{
  "posts": [
    {
      "instagram_post_id": "...",
      "post_type": "REEL",
      "post_url": "https://instagram.com/p/...",
      "caption": "...",
      "media_urls": ["..."],
      "thumbnail_url": "...",
      "likes": 1200,
      "views": 45000,
      "comments": 34,
      "match_method": "caption",
      "match_reason": "Product name found in caption"
    }
  ],
  "total": 3,
  "last_checked_at": "2026-02-26T10:00:00Z",
  "tracking_ends_at": "2026-03-26T10:00:00Z"
}
```

#### `POST /v1/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts`

**Auth:** Required
**Purpose:** Trigger fresh Apify scrape and re-analyze posts. Synchronous — blocks until complete.
**Response:** Same `CreatorPostsResponse` shape.

#### `DELETE /v1/campaigns/{campaign_id}/posts/{post_id}`

**Auth:** Required; owner only
**Purpose:** Remove false-positive post match.

---

### Domain 17: YouTube Lookalike Search

**Source:** `src/api/route/youtube.py`

#### `POST /v1/youtube/lookalikes`

**Auth:** Required
**Request Body:**
```json
{
  "channel_url": "https://youtube.com/@mkbhd",
  "search_pool_size": 50,
  "region": "US",
  "language": "en"
}
```
`channel_url` accepts: full URL, `@handle`, or channel ID.

**Response (`YouTubeLookalikeResponse`):**
```json
{
  "seed_channel": { "channel_id": "...", "title": "MKBHD", "subscriber_count": 18000000 },
  "similar_channels": [
    { "channel_id": "...", "title": "...", "subscriber_count": 800000, "email": "creator@gmail.com" }
  ],
  "keywords_used": ["tech review", "smartphones"],
  "scraper_run_id": "apify-run-id",
  "finder_run_id": "apify-run-id"
}
```

---

### Domain 18: Shopify Integration

**Source:** `src/api/route/shopify.py`

#### `GET /v1/shopify/workflows/{workflow_id}/products`

**Auth:** Required
**Purpose:** Fetch Shopify product catalog for order creation UI. Uses GoAffPro GraphQL proxy.
**Response:** `[ShopifyProduct]`

#### `POST /v1/shopify/workflow-executions/{workflow_execution_id}/orders`

**Auth:** Required
**Purpose:** Create a Shopify order from a completed workflow execution's output data.
**Reads from:** `campaign_workflow_execution.output_data` — expects `email`, `shipping_address`, `line_items[]`, `phone`
**Response (`CreateOrderFromExecutionResponse`):**
```json
{
  "order_id": "gid://shopify/Order/12345",
  "order_name": "#1234",
  "total_amount": "45.00",
  "currency_code": "USD"
}
```

---

### Domain 19: Google Sheets Integration

**Source:** `src/api/route/google_sheets.py`

#### `GET /v1/integrations/google-sheets/tabs`

**Auth:** None (public)
**Query:** `url` — Google Sheets URL
**Response (`GoogleSheetTabsResponse`):** `{ "sheets": [{ "name": "Sheet1", "id": 0 }] }`

---

### Domain 20: Products

**Source:** `src/api/route/product.py`

#### `POST /products/`

**Auth:** Required
**Body:** `{ "name": "Acme Sunscreen SPF 50", "description": "...", "url_to_scrape": "https://shop.acme.com/sunscreen" }`
**Constraint:** Unique `(user_id, name)` — `409 Conflict` on duplicate name.

#### `GET /products/`

**Auth:** Required
**Response:** `[ProductResponse]`

#### `GET /products/{product_id}`

**Auth:** Required; owner only

---

### Domain 21: Slack Integration

**Source:** `src/api/route/slack.py`

#### `POST /slack/interactions`

**Auth:** Slack signature verification (HMAC-SHA256)
**Purpose:** Webhook endpoint for Slack button clicks and modal submissions.

**Action Handlers:**

| Action ID Pattern | Behavior |
|-------------------|----------|
| `approve_order_{execution_id}` | Create Shopify order asynchronously via background task |
| `edit_order_{execution_id}` | Open Slack modal with order details for editing |
| `skip_order_{execution_id}` | Mark creator as skipped in campaign |
| `view_submission` | Handle modal form submit; update `campaign_workflow_execution.output_data` |

**Response:** `200 OK` with empty body (Slack requires fast acknowledgment)

#### `POST /slack/digest/{campaign_id}`

**Auth:** Required (JWT)
**Purpose:** Manually trigger Slack order digest for a campaign.

---

### Domain 22: Bulk Draft Editing

**Source:** `src/api/route/bulk_draft_edit.py`

#### `POST /bulk-draft-edit`

**Auth:** Required
**Purpose:** Edit all pending drafts in a campaign at once. Triggers Temporal workflow.

**Request Body:**
```json
{
  "campaign_id": "uuid",
  "edit_instruction": "Update the product description to mention the new scent",
  "exclude_thread_ids": ["thread-id-1"],
  "save_as_rule": true,
  "rule_text": "Always mention the new scent variant"
}
```

**Response:**
```json
{
  "workflow_id": "temporal-workflow-handle",
  "message": "Bulk edit started for 47 drafts"
}
```

---

### Domain 23: Tools Discovery

**Source:** `src/api/route/tools.py`

#### `GET /v1/tools`

**Auth:** Required
**Purpose:** List available tools for AI workflow composition.
**Response:** `[ToolInfo]`

```json
[
  { "slug": "goaffpro_create_affiliate", "description": "Create a GoAffPro affiliate account for a creator" },
  { "slug": "apify_get_instagram_profile", "description": "Fetch full Instagram profile data" }
]
```

---

### Domain 24: Teams & Campaign Assignment

**Source:** `src/api/route/team.py`

#### `GET /v1/teams/my-assignments`

**Auth:** Required
**Response:** `[CampaignResponse]` — campaigns assigned to the current user as team member

#### `GET /v1/teams/`

**Auth:** Required
**Response:** `[TeamResponse]` — teams the user belongs to

#### `POST /v1/teams/`

**Auth:** Required
**Body:** `{ "name": "DTC Agency Team A" }`

#### `DELETE /v1/teams/{team_id}`

**Auth:** Required; team owner only

#### `GET /v1/teams/{team_id}`

**Auth:** Required; member
**Response:** `TeamWithMembersResponse`

#### `GET /v1/teams/{team_id}/members`

**Auth:** Required; member
**Response:** `[TeamMemberResponse]`

#### `POST /v1/teams/{team_id}/members`

**Auth:** Required; team owner only
**Body:** `{ "user_email": "newmember@example.com" }`
**Behavior:** If user doesn't exist → Supabase invite email sent. If exists → immediately added.

#### `DELETE /v1/teams/{team_id}/members/{member_id}`

**Auth:** Required; team owner only

#### `GET /v1/teams/{team_id}/campaigns`

**Auth:** Required; member
**Response:** `[CampaignAssignmentResponse]`

#### `POST /v1/teams/{team_id}/campaigns`

**Auth:** Required; team owner only
**Body:** `{ "campaign_id": "uuid", "user_id": "uuid" }`

#### `POST /v1/teams/{team_id}/campaigns/bulk`

**Auth:** Required; team owner only
**Body:** `{ "assignments": [{ "campaign_id": "uuid", "user_id": "uuid" }] }`
**Purpose:** Assign multiple campaigns to multiple members in one transaction.

---

### Domain 25: Dashboard Analytics

**Source:** `src/api/route/dashboard.py`

#### `GET /dashboard/analytics`

**Auth:** Required
**Query:** `recent_optins_days` (int, 1-30, default 7)

**Response (`DashboardAnalyticsResponse`):**
```json
{
  "campaign_counts": {
    "active": 3, "paused": 1, "draft": 2, "completed": 8
  },
  "opt_in_stats": {
    "total_opted_in": 142,
    "total_opted_out": 23,
    "total_new": 567,
    "total_contacts": 800,
    "opt_in_rate": 0.1775
  },
  "recent_opt_ins": [
    { "creator_name": "Jane", "campaign_name": "...", "opted_in_at": "..." }
  ],
  "per_campaign_stats": [
    {
      "campaign_id": "uuid",
      "campaign_name": "Summer Seeds",
      "sent": 200,
      "replied": 45,
      "opted_in": 32,
      "reply_rate": 0.225
    }
  ],
  "email_stats": { "sent": 1200, "opened": 340, "replied": 127 },
  "follow_up_stats": { "scheduled": 89, "sent": 67 },
  "gifting_pipeline": { "pending_orders": 14, "shipped": 89 },
  "paid_promotion_pipeline": { "pending_contracts": 7, "active": 23 }
}
```

---

### Domain 26: Service-to-Service API (Internal)

**Source:** `src/api/route/service.py`

**Auth: API Key only** (`X-Service-Api-Key` header) — **no JWT accepted**

This API is used exclusively by the context engine to give Claude agent access to Cheerful data.

All endpoints require `user_id` query parameter (UUID) — the context engine passes the Slack user's Cheerful account ID.

#### `GET /service/campaigns`

**Query:** `user_id`
**Response:** Active/paused campaigns for user — for Claude to reason about.

#### `GET /service/threads/search`

**Query:** `user_id`, `query`, `campaign_id`, `limit`
**Purpose:** Full-text search across email threads — Claude uses this to answer questions about outreach.

#### `GET /service/threads/{gmail_thread_id}`

**Query:** `user_id`
**Response:** Full thread with all messages.

#### `GET /service/rag/similar`

**Query:** `user_id`, `query`, `limit`
**Purpose:** Semantic similarity search using pgvector — used for RAG example retrieval.

#### `GET /service/campaigns/{campaign_id}/creators`

**Query:** `user_id`, `limit`, `offset`, `gifting_status`, `role`
**Response:** Paginated creator list for a campaign.

#### `GET /service/campaigns/{campaign_id}/creators/{creator_id}`

**Query:** `user_id`
**Response:** Full creator detail including enrichment status.

#### `GET /service/creators/search`

**Query:** `user_id`, `query`, `limit`, `offset`
**Purpose:** Search creators across all campaigns.

---

## 6. Service Layer Architecture

### 6.1 Repository Pattern

Every database table has a typed repository inheriting `BaseRepository[Model]`. No raw SQL outside repositories.

**Key pattern — idempotent insert:**
```python
stmt = insert(Model).values(**data).on_conflict_do_nothing(index_elements=[...])
result = db.execute(stmt)
return result.rowcount  # 1=inserted, 0=already_existed
```

This is mandatory because Temporal workflow activities retry on failure.

### 6.2 Session Injection

Every service and repository takes `db: Session` as first parameter. No global database state. FastAPI injects sessions per-request; Temporal activities create their own sessions.

```python
def my_service_function(db: Session, campaign_id: str) -> Result:
    repo = CampaignRepository(db)
    return repo.get_by_id(campaign_id)
```

### 6.3 Domain Organization

| Domain | Services | Repositories | Key Responsibility |
|--------|----------|-------------|-------------------|
| Campaign | `queue_populator`, `queue_single_recipient`, `summary_generator` | `CampaignRepository`, `CampaignOutboxQueueRepository`, `CampaignRecipientRepository`, `CampaignSenderRepository` | Outbox population, personalization, round-robin assignment |
| Creator | `creator_service`, `creator_list_service`, `enrichment_service` | `CreatorRepository`, `CreatorListRepository`, `CreatorEnrichmentAttemptRepository` | Creator persistence, list management, email discovery waterfall |
| Email | `processor`, `loader`, `personalization`, `batch`, `storage`, `reply` | `GmailMessageRepository`, `GmailThreadStateRepository`, `GmailThreadLlmDraftRepository`, `GmailThreadUiDraftRepository` | Parse, store, reconstruct, personalize email threads |
| Post Tracking | `analyzer`, `post_processor`, `apify_posts`, `media_storage` | `CreatorPostRepository` | Caption match + LLM vision analysis for post verification |
| External | `gmail`, `smtp_email`, `apify`, `bio_link_apify`, `youtube_apify`, `firecrawl`, `shopify_proxy`, `slack_service`, `gsheet`, `influencer_club` | — | Thin adapters over external APIs |
| Storage | `storage`, `creator_image` | — | Supabase Storage management |
| Processing | `attachment_extract` | `AttachmentRepository` | Claude vision OCR on email attachments |
| CSV | `parser` | — | Flexible CSV parsing with header normalization |
| Workflow | `executor`, `formatter` | — | Tool selection, execution history formatting |
| Tools | `tool_registry` | — | MCP tool catalog for AI workflows |
| Composio | `composio_adapter` | — | Schema conversion + MCP wrapper |

---

## 7. Error Handling Patterns

### 7.1 External Service Errors

External service failures propagate as HTTP `502/503`:
- Gmail API: `google.auth.exceptions.TransportError`
- Shopify/GoAffPro: non-2xx response
- Influencer Club: rate limit or auth failure
- Firecrawl: 5 error categories classified and logged

### 7.2 Race Condition Guards

**Draft endpoint (409 Conflict):**
```json
{
  "error": "version_mismatch",
  "latest_gmail_thread_state_id": "uuid"
}
```
The client fetches the latest state and retries with the updated version_id.

**Scheduled email (409 Conflict):**
```json
{
  "error": "status_changed",
  "current_status": "sent"
}
```

### 7.3 Temporal Workflow Errors

For operations that start Temporal workflows (launch, enrichment, bulk edit):
- If Temporal is unreachable → `503 Service Unavailable`
- If workflow already running for same entity → `409 Conflict` with existing `workflow_id`

---

## 8. Request/Response Patterns Summary

### 8.1 Common Response Models

**`CampaignResponse`:**
```json
{
  "id": "uuid", "name": "string", "campaign_type": "gifting|paid|sales|creator",
  "status": "draft|active|paused|completed", "user_id": "uuid",
  "product_ids": ["uuid"], "senders": [CampaignSenderDetailResponse],
  "created_at": "ISO8601", "updated_at": "ISO8601"
}
```

**`ThreadSummary`:**
```json
{
  "gmail_thread_id": "string", "subject": "string",
  "status": "GmailThreadStatus", "campaign_id": "uuid",
  "latest_message_at": "ISO8601", "message_count": 3,
  "has_draft": true, "flags": {}
}
```

**`ConnectedAccountResponse`:**
```json
{
  "id": "uuid", "email": "string", "account_type": "gmail|smtp",
  "display_name": "string", "is_active": true
}
```

### 8.2 Content Type Rules

| Route | Request Content-Type | Response Content-Type |
|-------|---------------------|----------------------|
| All standard endpoints | `application/json` | `application/json` |
| CSV upload | `multipart/form-data` | `application/json` |
| Campaign draft save | `multipart/form-data` | `application/json` |
| Slack interactions | `application/x-www-form-urlencoded` | `application/json` |

---

## 9. Implementation Notes for Developers

### 9.1 Adding a New Endpoint

1. Create route handler in `src/api/route/{domain}.py`
2. Declare `current_user: dict = Depends(get_current_user)` for auth
3. Extract `user_id = current_user["user_id"]`
4. Create/inject `db: Session = Depends(get_db)` session
5. Call service layer — never call repositories directly from routes
6. Register route in `src/api/router.py` with prefix and tags

### 9.2 Database Access Pattern

```python
# Route handler (correct pattern)
@router.get("/campaigns/{id}")
async def get_campaign(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    repo = CampaignRepository(db)
    campaign = repo.get_by_id(str(id), current_user["user_id"])
    if not campaign:
        raise HTTPException(status_code=404)
    return campaign
```

### 9.3 Async Operations

For Temporal workflow triggers, use `await temporal_client.start_workflow(...)` and return the workflow handle ID to the client. The client polls a status endpoint or receives push notification via Slack/webhook.

### 9.4 Supabase Client Selection

- **All backend API operations**: Use `createServiceClient()` (bypasses RLS)
- **Frontend direct queries**: Use `createBrowserClient()` or SSR client (enforces RLS)
- **Never** use user JWT for backend database access — always service_role key

### 9.5 Credential Table Access

`user_gmail_account` and `user_smtp_account` contain sensitive credentials. Team members have NO RLS SELECT access to these tables. Routes that need sender email addresses must:
1. Verify campaign access at API layer
2. Query credential tables using service_role client
3. Return only email addresses (never tokens or passwords)
