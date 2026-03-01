# Integrations Domain — Tool Specifications

**Domain**: Integrations
**Spec file**: `specs/integrations.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Complete — all 18 tools fully specified

---

## Table of Contents

1. [Gmail Account Management](#gmail-account-management) (2 tools)
2. [SMTP Account Management](#smtp-account-management) (6 tools)
3. [Google Sheets](#google-sheets) (1 tool)
4. [Shopify / GoAffPro](#shopify--goaffpro) (2 tools)
5. [Instantly (Composio)](#instantly-composio) (4 tools)
6. [Slack Operations](#slack-operations) (1 tool)
7. [YouTube Lookalike Search](#youtube-lookalike-search) (1 tool)
8. [Brand Lookup](#brand-lookup) (1 tool)

**Total**: 18 tools (0 existing + 18 new)

> **OAuth limitation**: Gmail OAuth and Shopify OAuth require browser-redirect flows (Google/Shopify consent screens). These CANNOT be performed via the context engine (Slack). The CE can only READ the status of these connections. Users must go to the webapp to connect Gmail or Shopify.

> **Cross-reference — Google Sheet Validation**: The campaigns domain (`specs/campaigns.md`) has `cheerful_validate_campaign_sheet` which validates a campaign's configured Google Sheet (campaign-scoped). This spec's `cheerful_get_google_sheet_tabs` is a standalone utility that reads tab metadata from any Google Sheet URL — used during campaign setup to discover available tabs.

> **Cross-reference — YouTube Lookalike**: The search-and-discovery domain (`specs/search-and-discovery.md`) covers semantic email search and IC creator search. YouTube lookalike search is documented here because it's an external integration (Apify + LLM) rather than an internal search feature. The forward loop may consolidate placement.

> **Cross-reference — SMTP Accounts**: SMTP accounts power the email sending domain (`specs/email.md`), but account management (CRUD + bulk import) is an integration concern documented here. Email tools that reference sender accounts will link back to these tools for account setup.

> **Service routes needed**: ALL 18 integration tools need new `/api/service/*` endpoints. Currently ZERO integration endpoints have service routes — they all use JWT auth (`get_current_user`). The Google Sheets endpoint has NO auth at all (public, service-account based). The CE uses `X-Service-Api-Key` + `user_id` query param. **Total: 18 new service routes needed.**

---

## Gmail Account Management

Gmail OAuth flows (initiate + callback) are webapp-only browser redirects. The context engine can only list Gmail account status — it CANNOT connect or disconnect Gmail accounts.

### `cheerful_list_gmail_accounts`

**Status**: NEW

**Purpose**: List the authenticated user's connected Gmail accounts and their sync status.

**Maps to**: `GET /api/service/user/gmail-accounts` (new service route needed; mirrors `GET /user/gmail-accounts` in `src/api/route/user.py:77`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own Gmail accounts).

**Parameters** (user-facing — `user_id` is injected, not listed here):

None. This tool takes no parameters. Results are automatically scoped to the authenticated user.

**Parameter Validation Rules**:
- None — no user-facing parameters.

**Return Schema**:
```json
[
  {
    "id": "uuid — Gmail account ID",
    "gmail_email": "string — Gmail email address (e.g., 'user@gmail.com')",
    "sync_in_progress": "boolean — whether email sync is currently running",
    "is_active": "boolean — whether the account is active (OAuth token valid)",
    "created_at": "datetime — ISO 8601 timestamp of when the account was connected"
  }
]
```

**Note**: `refresh_token` and `last_poll_history_id` are explicitly excluded from the response model for security. See `UserGmailAccountResponse` in `src/models/api/user.py:22`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Pagination**: None — returns all Gmail accounts for the user (typically 1-3 accounts).

**Example Request**:
```
cheerful_list_gmail_accounts()
```

**Example Response**:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "gmail_email": "sarah@gmail.com",
    "sync_in_progress": false,
    "is_active": true,
    "created_at": "2026-01-15T10:30:00Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "gmail_email": "sarah.outreach@gmail.com",
    "sync_in_progress": true,
    "is_active": true,
    "created_at": "2026-02-20T14:15:00Z"
  }
]
```

**Slack Formatting Notes**: Agent should present as a simple numbered list: `1. sarah@gmail.com — Active, syncing: no`. If no accounts, prompt: "No Gmail accounts connected. Visit the webapp Settings page to connect your Gmail."

**Edge Cases**:
- User has no Gmail accounts → empty array `[]`, not an error
- Account with `sync_in_progress=true` → agent should note "sync is in progress, thread data may be incomplete"
- Account with `is_active=false` → account exists but OAuth token expired or was revoked; user must reconnect via webapp

---

### `cheerful_list_connected_accounts`

**Status**: NEW

**Purpose**: List all connected email accounts (Gmail + SMTP) in a unified view with optional filtering by account type and active status.

**Maps to**: `GET /api/service/user/connected-accounts` (new service route needed; mirrors `GET /user/connected-accounts` in `src/api/route/user.py:94`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_type | enum | no | — (returns both) | Filter by account type. One of: `"gmail"`, `"smtp"`. If omitted, returns both types. |
| active_only | boolean | no | true | If true, only return active accounts. If false, include deactivated/expired accounts. |

**Parameter Validation Rules**:
- `account_type` must be exactly `"gmail"` or `"smtp"` if provided (case-sensitive string comparison, not an enum — see `user.py:99`). Invalid values return both types (no validation error).
- `active_only` defaults to `true` if not provided.

**Return Schema**:
```json
[
  {
    "id": "uuid — Account ID (Gmail account ID or SMTP account ID)",
    "email": "string — Email address",
    "account_type": "string — One of: 'gmail', 'smtp' (AccountType enum)",
    "display_name": "string | null — Display name. For Gmail accounts, this is set to the gmail_email address. For SMTP accounts, this is the user-configured display_name (nullable if not set).",
    "is_active": "boolean — Whether the account is active"
  }
]
```

**CORRECTION from Wave 2**: Gmail accounts DO have `display_name` — it is set to `acc.gmail_email` in the route handler (`user.py:139`). It is NOT null.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Pagination**: None — returns all connected accounts (typically fewer than 10).

**Example Request**:
```
cheerful_list_connected_accounts(account_type="smtp", active_only=true)
```

**Example Response**:
```json
[
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "email": "outreach@company.com",
    "account_type": "smtp",
    "display_name": "Company Outreach",
    "is_active": true
  },
  {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "email": "sales@company.com",
    "account_type": "smtp",
    "display_name": null,
    "is_active": true
  }
]
```

**Slack Formatting Notes**: Agent should present grouped by type:
```
Gmail:
  1. sarah@gmail.com — Active
SMTP:
  1. outreach@company.com (Company Outreach) — Active
  2. sales@company.com — Active
```
If no accounts at all, prompt user to connect accounts via the webapp.

**Edge Cases**:
- User has Gmail but no SMTP → only Gmail entries returned (and vice versa)
- `active_only=false` includes deactivated accounts (useful for troubleshooting expired OAuth tokens or deleted SMTP accounts that were soft-disabled)
- Invalid `account_type` value (e.g., "imap") → silently returns both types (no error — the query param comparison just doesn't match either branch)

---

## SMTP Account Management

Full CRUD lifecycle for SMTP/IMAP email accounts. SMTP accounts allow users to send emails from non-Gmail addresses with custom SMTP servers. Passwords are stored encrypted and NEVER returned in responses.

### `cheerful_list_smtp_accounts`

**Status**: NEW

**Purpose**: List the authenticated user's SMTP email accounts with their configuration and verification status.

**Maps to**: `GET /api/service/smtp-accounts` (new service route needed; mirrors `GET /smtp-accounts` in `src/api/route/smtp_account.py:501`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own SMTP accounts via `repo.get_by_user_id(user_id)`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

None. This tool takes no parameters. Results are automatically scoped to the authenticated user.

**Parameter Validation Rules**:
- None — no user-facing parameters.

**Return Schema**:
```json
[
  {
    "id": "uuid — SMTP account ID",
    "email_address": "string — Email address for this account",
    "display_name": "string | null — Friendly display name (e.g., 'Company Outreach')",
    "smtp_host": "string — SMTP server hostname (e.g., 'smtp.gmail.com')",
    "smtp_port": "integer — SMTP server port (e.g., 587)",
    "smtp_username": "string — SMTP login username",
    "smtp_use_tls": "boolean — Whether STARTTLS is used for SMTP",
    "imap_host": "string — IMAP server hostname (e.g., 'imap.gmail.com')",
    "imap_port": "integer — IMAP server port (e.g., 993)",
    "imap_username": "string — IMAP login username",
    "imap_use_ssl": "boolean — Whether SSL is used for IMAP",
    "is_active": "boolean — Whether the account is active and usable",
    "last_verified_at": "datetime | null — ISO 8601 timestamp of last successful credential verification",
    "verification_error": "string | null — Error message from last failed verification attempt",
    "created_at": "datetime — ISO 8601 timestamp of account creation"
  }
]
```

**Note**: Passwords (`smtp_password`, `imap_password`) are NEVER returned in responses. They are excluded from `SmtpAccountResponse` (see `src/models/api/smtp_account.py:137`).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Pagination**: None — returns all SMTP accounts for the user.

**Example Request**:
```
cheerful_list_smtp_accounts()
```

**Example Response**:
```json
[
  {
    "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "email_address": "outreach@company.com",
    "display_name": "Company Outreach",
    "smtp_host": "smtp.company.com",
    "smtp_port": 587,
    "smtp_username": "outreach@company.com",
    "smtp_use_tls": true,
    "imap_host": "imap.company.com",
    "imap_port": 993,
    "imap_username": "outreach@company.com",
    "imap_use_ssl": true,
    "is_active": true,
    "last_verified_at": "2026-02-28T10:00:00Z",
    "verification_error": null,
    "created_at": "2026-01-10T08:30:00Z"
  }
]
```

**Slack Formatting Notes**: Present as a table-like list: `outreach@company.com (Company Outreach) — smtp.company.com:587, TLS: yes, Active: yes, Verified: 2026-02-28`. Flag accounts with `verification_error` present with a warning emoji.

**Edge Cases**:
- User has no SMTP accounts → empty array `[]`
- Account with `verification_error` set → credentials failed verification; agent should suggest `cheerful_update_smtp_account` to fix credentials
- Account with `is_active=false` → account was soft-deleted and later reactivated, or explicitly deactivated

---

### `cheerful_get_smtp_account`

**Status**: NEW

**Purpose**: Get full details of a specific SMTP account by ID.

**Maps to**: `GET /api/service/smtp-accounts/{account_id}` (new service route needed; mirrors `GET /smtp-accounts/{account_id}` in `src/api/route/smtp_account.py:514`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if `account.user_id != user_id`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID to retrieve |

**Parameter Validation Rules**:
- `account_id` must be a valid UUID. Invalid format returns 422 validation error.

**Return Schema**:
```json
{
  "id": "uuid — SMTP account ID",
  "email_address": "string — Email address",
  "display_name": "string | null — Display name",
  "smtp_host": "string — SMTP server hostname",
  "smtp_port": "integer — SMTP server port",
  "smtp_username": "string — SMTP login username",
  "smtp_use_tls": "boolean — STARTTLS enabled",
  "imap_host": "string — IMAP server hostname",
  "imap_port": "integer — IMAP server port",
  "imap_username": "string — IMAP login username",
  "imap_use_ssl": "boolean — SSL enabled for IMAP",
  "is_active": "boolean — Account active",
  "last_verified_at": "datetime | null — Last verification timestamp",
  "verification_error": "string | null — Last verification error",
  "created_at": "datetime — Account creation timestamp"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to access this SMTP account" | 403 |

**Example Request**:
```
cheerful_get_smtp_account(account_id="e5f6a7b8-c9d0-1234-efab-345678901234")
```

**Example Response**:
```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "email_address": "outreach@company.com",
  "display_name": "Company Outreach",
  "smtp_host": "smtp.company.com",
  "smtp_port": 587,
  "smtp_username": "outreach@company.com",
  "smtp_use_tls": true,
  "imap_host": "imap.company.com",
  "imap_port": 993,
  "imap_username": "outreach@company.com",
  "imap_use_ssl": true,
  "is_active": true,
  "last_verified_at": "2026-02-28T10:00:00Z",
  "verification_error": null,
  "created_at": "2026-01-10T08:30:00Z"
}
```

**Slack Formatting Notes**: Present as a detailed profile card with all configuration fields. Highlight `verification_error` if present.

**Edge Cases**:
- Account with `is_active=false` is still retrievable by ID (no filtering on active status in get-by-ID)

---

### `cheerful_create_smtp_account`

**Status**: NEW

**Purpose**: Create a new SMTP/IMAP email account for the authenticated user. The account will be used for sending and receiving campaign emails. Passwords are stored encrypted.

**Maps to**: `POST /api/service/smtp-accounts` (new service route needed; mirrors `POST /smtp-accounts` in `src/api/route/smtp_account.py:78`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates account owned by the user).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| email_address | string | yes | — | Email address for this SMTP account |
| display_name | string | no | null | Friendly display name (e.g., "Company Outreach") |
| smtp_host | string | yes | — | SMTP server hostname (e.g., "smtp.gmail.com") |
| smtp_port | integer | no | 587 | SMTP server port. Common values: 587 (STARTTLS), 465 (implicit SSL), 25 (plaintext) |
| smtp_username | string | yes | — | SMTP login username (usually the email address) |
| smtp_password | string | yes | — | SMTP login password. For Gmail, this must be a Google App Password (not regular password). Stored encrypted, never returned in responses. |
| smtp_use_tls | boolean | no | true | Use STARTTLS for SMTP connection |
| imap_host | string | yes | — | IMAP server hostname (e.g., "imap.gmail.com") |
| imap_port | integer | no | 993 | IMAP server port. Common values: 993 (SSL), 143 (plaintext) |
| imap_username | string | yes | — | IMAP login username |
| imap_password | string | yes | — | IMAP login password. Stored encrypted, never returned in responses. |
| imap_use_ssl | boolean | no | true | Use SSL for IMAP connection |

**Parameter Validation Rules**:
- `email_address`, `smtp_host`, `smtp_username`, `smtp_password`, `imap_host`, `imap_username`, `imap_password` are all required strings — Pydantic will return 422 if missing.
- No email format validation on `email_address` at the Pydantic level (any string accepted).
- `smtp_port` and `imap_port` are integers with no range validation beyond Pydantic integer parsing.

**Return Schema**:
```json
{
  "id": "uuid — Newly created SMTP account ID",
  "email_address": "string — Email address",
  "display_name": "string | null — Display name",
  "smtp_host": "string — SMTP server hostname",
  "smtp_port": "integer — SMTP server port",
  "smtp_username": "string — SMTP login username",
  "smtp_use_tls": "boolean — STARTTLS enabled",
  "imap_host": "string — IMAP server hostname",
  "imap_port": "integer — IMAP server port",
  "imap_username": "string — IMAP login username",
  "imap_use_ssl": "boolean — SSL enabled for IMAP",
  "is_active": "boolean — Always true for newly created accounts",
  "last_verified_at": "datetime | null — null for newly created accounts (verification is separate from creation)",
  "verification_error": "string | null — null for newly created accounts",
  "created_at": "datetime — Creation timestamp"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Active account with same email for this user | "SMTP account with this email already exists" | 409 |
| Database integrity error (race condition) | "SMTP account with this email already exists" | 409 |

**Reactivation behavior**: If an **inactive** account with the same `email_address` exists for this user, the backend reactivates it with the new credentials instead of throwing a 409 error. The reactivated account gets `is_active=true`, all new credentials applied, and sync/verification state reset to null. The response still returns the account as if newly created. See `smtp_account.py:96-127`.

**User-scoped duplicate check**: The duplicate check only matches accounts owned by the same user (`existing.user_id == user_id`). Different users CAN create SMTP accounts with the same email address. See `smtp_account.py:93-96`.

**Gmail SMTP preset values**: For Gmail accounts, use: `smtp_host="smtp.gmail.com"`, `smtp_port=587`, `smtp_use_tls=true`, `imap_host="imap.gmail.com"`, `imap_port=993`, `imap_use_ssl=true`. Requires a Google App Password (16 characters, no spaces) — the user's regular Gmail password will NOT work.

**Example Request**:
```
cheerful_create_smtp_account(
  email_address="outreach@company.com",
  display_name="Company Outreach",
  smtp_host="smtp.company.com",
  smtp_port=587,
  smtp_username="outreach@company.com",
  smtp_password="s3cret-app-password",
  smtp_use_tls=true,
  imap_host="imap.company.com",
  imap_port=993,
  imap_username="outreach@company.com",
  imap_password="s3cret-app-password",
  imap_use_ssl=true
)
```

**Example Response**:
```json
{
  "id": "f6a7b8c9-d0e1-2345-fab0-456789012345",
  "email_address": "outreach@company.com",
  "display_name": "Company Outreach",
  "smtp_host": "smtp.company.com",
  "smtp_port": 587,
  "smtp_username": "outreach@company.com",
  "smtp_use_tls": true,
  "imap_host": "imap.company.com",
  "imap_port": 993,
  "imap_username": "outreach@company.com",
  "imap_use_ssl": true,
  "is_active": true,
  "last_verified_at": null,
  "verification_error": null,
  "created_at": "2026-03-01T12:00:00Z"
}
```

**Slack Formatting Notes**: Confirm creation: "Created SMTP account `outreach@company.com` (Company Outreach) — smtp.company.com:587". Note: "Credentials are stored encrypted. The account will be verified during the next sync cycle." Warn about credential security if user shares passwords in chat.

**Edge Cases**:
- Inactive account with same email → silently reactivated with new credentials (no 409)
- Invalid SMTP/IMAP credentials → account is created but may fail verification later (single-account creation does NOT verify upfront — unlike bulk import which does)
- Account with same email owned by a different user → both accounts coexist (no conflict)

---

### `cheerful_update_smtp_account`

**Status**: NEW

**Purpose**: Update an existing SMTP account's configuration. Supports partial updates — only fields explicitly provided are changed (uses `model_dump(exclude_unset=True)`).

**Maps to**: `PATCH /api/service/smtp-accounts/{account_id}` (new service route needed; mirrors `PATCH /smtp-accounts/{account_id}` in `src/api/route/smtp_account.py:541`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if `account.user_id != user_id`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID to update (path parameter) |
| email_address | string | no | — | Updated email address |
| display_name | string | no | — | Updated display name |
| smtp_host | string | no | — | Updated SMTP hostname |
| smtp_port | integer | no | — | Updated SMTP port |
| smtp_username | string | no | — | Updated SMTP username |
| smtp_password | string | no | — | Updated SMTP password (stored encrypted) |
| smtp_use_tls | boolean | no | — | Updated TLS setting |
| imap_host | string | no | — | Updated IMAP hostname |
| imap_port | integer | no | — | Updated IMAP port |
| imap_username | string | no | — | Updated IMAP username |
| imap_password | string | no | — | Updated IMAP password (stored encrypted) |
| imap_use_ssl | boolean | no | — | Updated SSL setting |

**Parameter Validation Rules**:
- `account_id` must be a valid UUID.
- All update fields are optional. Only fields explicitly included in the request body are updated (`exclude_unset=True`).
- If `smtp_password` or `imap_password` are provided, they are encrypted before storage (`crypto_service.encrypt()`).
- No cross-field validation (e.g., changing `email_address` to a duplicate is not checked — may succeed or fail on DB constraint).

**Return Schema**: Same as `cheerful_get_smtp_account` — full account object with updated values.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to update this SMTP account" | 403 |

**Example Request**:
```
cheerful_update_smtp_account(
  account_id="e5f6a7b8-c9d0-1234-efab-345678901234",
  smtp_password="new-app-password-123",
  display_name="Updated Outreach"
)
```

**Example Response**:
```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "email_address": "outreach@company.com",
  "display_name": "Updated Outreach",
  "smtp_host": "smtp.company.com",
  "smtp_port": 587,
  "smtp_username": "outreach@company.com",
  "smtp_use_tls": true,
  "imap_host": "imap.company.com",
  "imap_port": 993,
  "imap_username": "outreach@company.com",
  "imap_use_ssl": true,
  "is_active": true,
  "last_verified_at": "2026-02-28T10:00:00Z",
  "verification_error": null,
  "created_at": "2026-01-10T08:30:00Z"
}
```

**Slack Formatting Notes**: Confirm: "Updated SMTP account `outreach@company.com` — changed: display_name, smtp_password".

**Edge Cases**:
- No fields provided in request body → no-op, returns current account state unchanged
- Updating `email_address` to one that already exists → may cause DB integrity error (not explicitly handled — depends on unique constraint)
- Updating passwords does NOT trigger re-verification — `last_verified_at` and `verification_error` are not reset

---

### `cheerful_delete_smtp_account`

**Status**: NEW

**Purpose**: Permanently delete an SMTP account. This is a **hard delete** — the database row is removed entirely, not soft-deleted.

**Maps to**: `DELETE /api/service/smtp-accounts/{account_id}` (new service route needed; mirrors `DELETE /smtp-accounts/{account_id}` in `src/api/route/smtp_account.py:594`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if `account.user_id != user_id`).

**CORRECTION from Wave 2**: This is a **HARD DELETE** (`db.delete(account)` at `smtp_account.py:618`), NOT a soft-delete or deactivation. The account row is permanently removed from the database. This is irreversible.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID to permanently delete |

**Parameter Validation Rules**:
- `account_id` must be a valid UUID.

**Return Schema**: No content (HTTP 204). The tool should return a confirmation message to the agent.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to delete this SMTP account" | 403 |

**Example Request**:
```
cheerful_delete_smtp_account(account_id="e5f6a7b8-c9d0-1234-efab-345678901234")
```

**Example Response**: (tool wrapper should return)
```json
{
  "success": true,
  "message": "SMTP account deleted"
}
```

**Slack Formatting Notes**: Confirm deletion: "Permanently deleted SMTP account `outreach@company.com`." The agent should consider warning before deletion if the account may be in use as a sender on active campaigns — use `cheerful_list_campaigns` to check.

**Edge Cases**:
- Account is currently configured as a sender on active campaigns → the delete succeeds, but the campaign sender reference may become orphaned. The backend does NOT cascade-check campaign sender assignments before deletion.
- Already-deleted account → 404 (since it's a hard delete, the account no longer exists)
- Deleting an inactive account → succeeds normally (no active-status check on delete)

---

### `cheerful_bulk_import_smtp_accounts`

**Status**: NEW

**Purpose**: Import multiple SMTP accounts at once with automatic IMAP credential verification **before** saving. Supports Gmail preset (simplified params) and custom SMTP providers. Verified accounts are created; failed verifications are reported as errors without being saved.

**Maps to**: `POST /api/service/smtp-accounts/bulk` (new service route needed; mirrors `POST /smtp-accounts/bulk` in `src/api/route/smtp_account.py:176`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates accounts owned by the user).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| provider | enum | no | "gmail" | Provider preset. One of: `"gmail"`, `"custom"`. Determines which fields are required per account. Defaults to `"gmail"` if not specified. |
| accounts | object[] | yes | — | Array of 1-100 account entries to import. |

**Account entry fields for `provider="gmail"`**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email_address | string | yes | Gmail address |
| password | string | yes* | Gmail App Password. *Can also be provided as `smtp_password`. |
| display_name | string | no | Friendly display name |

When `provider="gmail"`, the following are auto-filled: `smtp_host="smtp.gmail.com"`, `smtp_port=587`, `smtp_username={email}`, `smtp_use_tls=true`, `imap_host="imap.gmail.com"`, `imap_port=993`, `imap_username={email}`, `imap_use_ssl=true`. The same password is used for both SMTP and IMAP.

**Account entry fields for `provider="custom"`**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email_address | string | yes | Email address |
| smtp_host | string | yes | SMTP server hostname |
| smtp_port | integer | no | SMTP port (default: 587) |
| smtp_username | string | no | SMTP username (default: email_address) |
| smtp_password | string | yes* | SMTP password. *Can also use `password` as fallback. |
| smtp_use_tls | boolean | no | STARTTLS (default: true) |
| imap_host | string | yes | IMAP server hostname |
| imap_port | integer | no | IMAP port (default: 993) |
| imap_username | string | no | IMAP username (default: email_address) |
| imap_password | string | yes* | IMAP password. *Can also use `password` as fallback. |
| imap_use_ssl | boolean | no | SSL for IMAP (default: true) |
| display_name | string | no | Friendly display name |

**Parameter Validation Rules** (from `BulkSmtpImportRequest` model validator at `smtp_account.py:65-99`):
- `accounts` array must have at least 1 entry: `ValueError: "At least one account is required"`
- `accounts` array must have at most 100 entries: `ValueError: "Maximum 100 accounts per bulk import"`
- Each entry must have a non-empty `email_address`: `ValueError: "Account {i+1}: email_address is required"`
- For `provider="gmail"`: must have `password` or `smtp_password`: `ValueError: "Account {i+1} ({email}): password is required for Gmail accounts"`
- For `provider="custom"`: must have `smtp_host`, `smtp_password` or `password`, `imap_host`, `imap_password` or `password`: `ValueError: "Account {i+1} ({email}): missing required fields: {fields}"`

**Return Schema**:
```json
{
  "created": "integer — Number of accounts successfully created",
  "skipped": "integer — Number of accounts skipped (active duplicate email for this user)",
  "errors": "integer — Number of accounts that failed verification",
  "results": [
    {
      "email_address": "string — The email address of this account",
      "status": "string — One of: 'created', 'skipped', 'error'",
      "error": "string | null — Error message if status is 'error' or 'skipped'",
      "account_id": "uuid | null — Account ID if status is 'created'"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Empty accounts array | "At least one account is required" | 422 |
| More than 100 accounts | "Maximum 100 accounts per bulk import" | 422 |
| Missing email_address | "Account {N}: email_address is required" | 422 |
| Missing password (gmail) | "Account {N} ({email}): password is required for Gmail accounts" | 422 |
| Missing fields (custom) | "Account {N} ({email}): missing required fields: {fields}" | 422 |

**Per-account error messages** (in `results` array, not HTTP errors):
- `"Account already exists"` — active duplicate for this user (status: "skipped")
- `"Authentication failed — check your password (Gmail requires an App Password)"` — IMAP auth failure
- `"Connection timed out connecting to {host}:{port}"` — IMAP timeout (10 second timeout per connection)
- `"Could not connect to {host}:{port} — {error}"` — IMAP OS-level connection error
- `"Connection failed: {error}"` — generic IMAP failure
- `"Account with this email already exists"` — DB integrity error during save (race condition)
- `"Failed to create account"` — unexpected error during save
- `"Failed to process account"` — error during resolution phase

**IMAP verification details**: Verification runs in parallel using a `ThreadPoolExecutor` with `max_workers=min(10, len(accounts))`. Each connection has a 10-second timeout (`IMAP_CONNECT_TIMEOUT = 10`). Only IMAP credentials are verified (not SMTP). See `smtp_account.py:41-75`.

**Reactivation behavior**: Same as single create — if an inactive account with the same email exists for this user, it is reactivated with new credentials (reported as "created", not "skipped").

**Example Request**:
```
cheerful_bulk_import_smtp_accounts(
  provider="gmail",
  accounts=[
    {"email_address": "outreach1@gmail.com", "password": "abcd-efgh-ijkl-mnop"},
    {"email_address": "outreach2@gmail.com", "password": "qrst-uvwx-yz12-3456"},
    {"email_address": "outreach3@gmail.com", "password": "wrong-password"}
  ]
)
```

**Example Response**:
```json
{
  "created": 2,
  "skipped": 0,
  "errors": 1,
  "results": [
    {
      "email_address": "outreach1@gmail.com",
      "status": "created",
      "error": null,
      "account_id": "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5"
    },
    {
      "email_address": "outreach2@gmail.com",
      "status": "created",
      "error": null,
      "account_id": "b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6"
    },
    {
      "email_address": "outreach3@gmail.com",
      "status": "error",
      "error": "Authentication failed — check your password (Gmail requires an App Password)",
      "account_id": null
    }
  ]
}
```

**Slack Formatting Notes**: Present summary first: "Imported 2 accounts, 0 skipped, 1 failed." Then detail failures: "Failed: outreach3@gmail.com — Authentication failed (check App Password)".

**Edge Cases**:
- All accounts fail verification → `created=0`, `errors=N`, no accounts saved
- Mix of Gmail and custom accounts in one request → not supported; all accounts must match the `provider` type
- Duplicate emails within the same batch → first one succeeds, subsequent ones may be skipped or get integrity errors
- Inactive duplicates → reactivated with new credentials (same as single create)
- IMAP server unreachable → 10-second timeout per account, does not block other accounts (parallel verification)

---

## Google Sheets

### `cheerful_get_google_sheet_tabs`

**Status**: NEW

**Purpose**: Retrieve the list of tabs (sheets) in a Google Sheets spreadsheet. Used during campaign setup to discover available tabs when configuring a Google Sheet as a data source for recipients.

**Maps to**: `GET /api/service/integrations/google-sheets/tabs` (new service route for consistency; mirrors `GET /integrations/google-sheets/tabs` in `src/api/route/google_sheets.py:18`)

**Auth**: The underlying endpoint has **no authentication** — no `Depends(get_current_user)` or `Depends(verify_service_api_key)`. It uses a Cheerful service account to access Google Sheets. For the CE tool, the context engine should still require a resolved user via `RequestContext` for audit trail, even though the backend doesn't enforce it. The spreadsheet must be shared with the Cheerful service account email.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| url | string | yes | — | Full Google Sheets URL. Example: `"https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"` |

**Parameter Validation Rules**:
- `url` is a required string (FastAPI `Query(...)` — 422 if missing).
- No URL format validation at the endpoint level — the Google Sheets API handles invalid URLs by returning a `SpreadsheetNotFound` exception (mapped to 404).

**Return Schema**:
```json
{
  "success": "boolean — Always true on success",
  "sheets": [
    {
      "sheet_id": "integer — Google Sheets internal sheet ID (gid)",
      "title": "string — Tab name (e.g., 'Sheet1', 'Creator List')",
      "index": "integer — Tab position, 0-based"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Spreadsheet not found | "Spreadsheet not found. Please check the URL." | 404 |
| Permission denied | "Permission denied. Please share the sheet with the service account." | 403 |
| Google Sheets API error | "Failed to fetch spreadsheet tabs." | 500 |
| Unexpected error | "An unexpected error occurred." | 500 |

**Example Request**:
```
cheerful_get_google_sheet_tabs(url="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit")
```

**Example Response**:
```json
{
  "success": true,
  "sheets": [
    {"sheet_id": 0, "title": "Sheet1", "index": 0},
    {"sheet_id": 1234567890, "title": "Creator List", "index": 1},
    {"sheet_id": 987654321, "title": "Email Data", "index": 2}
  ]
}
```

**Slack Formatting Notes**: Present as a numbered list of tab names: "Tabs in spreadsheet:\n1. Sheet1\n2. Creator List\n3. Email Data". If 403, instruct: "Please share this spreadsheet with the Cheerful service account. Ask your admin for the service account email address."

**Edge Cases**:
- Spreadsheet with 0 tabs → theoretically impossible (Google Sheets requires at least 1 tab), but handle gracefully with empty array
- Invalid URL format → produces a confusing 404 ("Spreadsheet not found") rather than a URL validation error
- Very large spreadsheet → this only reads metadata (not cell data), so it's fast regardless of data volume
- Google Sheets API rate limit → may return 500 ("Failed to fetch spreadsheet tabs")

---

## Shopify / GoAffPro

Shopify OAuth (store connection) is webapp-only. The CE can read products and create orders through the GoAffPro proxy API once a Shopify connection exists. The GoAffPro API key is stored in the workflow config (`workflow.config["goaffpro_api_key"]`), not in user-level settings.

### `cheerful_list_shopify_products`

**Status**: NEW

**Purpose**: List products from a Shopify store connected to a campaign workflow. Products are fetched via GoAffPro's proxy API using the API key stored in the workflow's configuration.

**Maps to**: `GET /api/service/shopify/workflows/{workflow_id}/products` (new service route needed; mirrors `GET /shopify/workflows/{workflow_id}/products` in `src/api/route/shopify.py:30`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (verified via `workflow → campaign → campaign.user_id != user_id` check at `shopify.py:58`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_id | uuid | yes | — | Campaign workflow ID. The workflow must have a `goaffpro_api_key` in its config. |
| limit | integer | no | 10 | Maximum number of products to return. Valid range: 1-100 (enforced by FastAPI `Query(ge=1, le=100)`). |

**Parameter Validation Rules**:
- `workflow_id` must be a valid UUID.
- `limit` must be between 1 and 100 inclusive. Values outside this range return 422 validation error.

**Return Schema**:
```json
{
  "products": [
    {
      "id": "string — Shopify Product GID (e.g., 'gid://shopify/Product/7654321098765')",
      "title": "string — Product title (e.g., 'Blue T-Shirt')",
      "variants": [
        {
          "id": "string — Shopify Variant GID (e.g., 'gid://shopify/ProductVariant/43210987654321')",
          "title": "string — Variant title (e.g., 'Small / Blue')",
          "price": "string — Price as string (e.g., '29.99')"
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
| Workflow not found | "Workflow not found" | 404 |
| Campaign not found or not owned by user | "Not authorized" | 403 |
| No GoAffPro API key in workflow config | "Workflow config missing goaffpro_api_key" | 400 |
| GoAffPro API error | "GoAffPro API error: {error}" | 502 |

**Example Request**:
```
cheerful_list_shopify_products(
  workflow_id="11111111-2222-3333-4444-555555555555",
  limit=20
)
```

**Example Response**:
```json
{
  "products": [
    {
      "id": "gid://shopify/Product/7654321098765",
      "title": "Blue T-Shirt",
      "variants": [
        {"id": "gid://shopify/ProductVariant/43210987654321", "title": "Small", "price": "19.99"},
        {"id": "gid://shopify/ProductVariant/43210987654322", "title": "Medium", "price": "19.99"},
        {"id": "gid://shopify/ProductVariant/43210987654323", "title": "Large", "price": "21.99"}
      ]
    },
    {
      "id": "gid://shopify/Product/7654321098766",
      "title": "Logo Hoodie",
      "variants": [
        {"id": "gid://shopify/ProductVariant/43210987654324", "title": "One Size", "price": "49.99"}
      ]
    }
  ]
}
```

**Slack Formatting Notes**: Present products with variants as a formatted list:
```
Products from Shopify (2 found):
1. Blue T-Shirt
   - Small ($19.99)
   - Medium ($19.99)
   - Large ($21.99)
2. Logo Hoodie
   - One Size ($49.99)
```

**Edge Cases**:
- Workflow has no Shopify/GoAffPro integration configured → 400 ("Workflow config missing goaffpro_api_key")
- Shopify store has 0 products → returns `{"products": []}` (empty array)
- Products with no variants → each product has an empty `variants` array
- GoAffPro API is down → 502 error
- GraphQL response has missing fields → defaults to empty strings (`""`) for id, title, price; empty list for variants

---

### `cheerful_create_shopify_order`

**Status**: NEW

**Purpose**: Create a Shopify order from a completed workflow execution. The execution's `output_data` must contain customer email, shipping address, and line items. Used in the gifting flow to send products to opted-in creators after order details have been collected and approved.

**Maps to**: `POST /api/service/shopify/workflow-executions/{workflow_execution_id}/orders` (new service route needed; mirrors `POST /shopify/workflow-executions/{workflow_execution_id}/orders` in `src/api/route/shopify.py:115`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (verified via `execution → workflow → campaign → campaign.user_id != user_id` at `shopify.py:180`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_execution_id | uuid | yes | — | ID of a completed workflow execution whose `output_data` contains order details (email, shipping_address, line_items). |

**Parameter Validation Rules**:
- `workflow_execution_id` must be a valid UUID.
- The execution must have `status == "completed"`.
- The execution must have non-null `output_data`.
- `output_data` must contain the keys: `"email"`, `"shipping_address"`, `"line_items"`.

**Required output_data structure** (populated by the Shopify Order Drafting workflow):
```json
{
  "email": "string — Customer email address",
  "shipping_address": {
    "first_name": "string",
    "last_name": "string",
    "address1": "string — Street address line 1",
    "address2": "string | null — Street address line 2 (optional)",
    "city": "string",
    "province_code": "string — State/province code (e.g., 'CA')",
    "country_code": "string — Country code (e.g., 'US')",
    "zip": "string — ZIP/postal code"
  },
  "phone": "string | null — Customer phone (optional)",
  "line_items": [
    {
      "variant_id": "string — Shopify Variant GID",
      "quantity": "integer — Quantity (must be >= 1)"
    }
  ]
}
```

**Return Schema**:
```json
{
  "order_id": "string — Shopify Order GID (e.g., 'gid://shopify/Order/5678901234567')",
  "order_name": "string — Human-readable order number (e.g., '#1002')",
  "total_amount": "string — Order total (e.g., '49.99')",
  "currency_code": "string — Currency code (e.g., 'USD')",
  "workflow_execution_id": "uuid — The execution this order was created from"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Execution not found | "Workflow execution not found" | 404 |
| Execution not completed | "Workflow execution status is '{status}', expected 'completed'" | 400 |
| No output_data | "Workflow execution has no output_data" | 400 |
| Missing required fields | "Workflow execution output_data missing required fields: ['email', 'shipping_address']" | 400 |
| Missing nested field (during GraphQL call) | "Workflow execution output_data missing field: {field}" | 400 |
| Parent workflow not found | "Workflow not found" | 404 |
| Campaign not owned by user | "Not authorized" | 403 |
| No GoAffPro API key | "Workflow config missing goaffpro_api_key" | 400 |
| GoAffPro API error | "GoAffPro API error: {error}" | 502 |
| Shopify GraphQL userErrors | `{"message": "Order creation failed", "errors": [...]}` | 400 |

**Example Request**:
```
cheerful_create_shopify_order(
  workflow_execution_id="66666666-7777-8888-9999-aaaaaaaaaaaa"
)
```

**Example Response**:
```json
{
  "order_id": "gid://shopify/Order/5678901234567",
  "order_name": "#1042",
  "total_amount": "49.99",
  "currency_code": "USD",
  "workflow_execution_id": "66666666-7777-8888-9999-aaaaaaaaaaaa"
}
```

**Slack Formatting Notes**: Confirm: "Shopify order #1042 created — Total: $49.99 USD". On status error: "Can't create order: execution is still 'error', expected 'completed'." On missing fields: list exactly which fields are missing.

**Edge Cases**:
- Execution is "error", "skipped", or "schema_validation_failed" → 400 with status message
- output_data exists but is missing required keys → specific field names listed in error
- Double-creating an order from the same execution → Shopify may create a duplicate order (no idempotency guard in the backend)
- Shopify returns `userErrors` → 400 with structured error array (e.g., invalid variant ID, out of stock)
- `total_amount` is extracted from GraphQL response path `order.totalPriceSet.shopMoney.amount`; defaults to `"0"` if path is missing
- `currency_code` defaults to `"USD"` if path `order.totalPriceSet.shopMoney.currencyCode` is missing

---

## Instantly (Composio)

Full lifecycle management for Instantly email outreach integration. Instantly is connected via API key through Composio as the credential broker. **Important**: Instantly uses the user's **email address** (lowercased) as the Composio entity_id, not the user_id UUID.

### `cheerful_get_instantly_status`

**Status**: NEW

**Purpose**: Check the current connection status of the Instantly integration for the authenticated user.

**Maps to**: `GET /api/service/integrations/instantly/status` (new service route needed; mirrors `GET /integrations/instantly/status` in `src/api/route/instantly.py:78`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only). **Note**: The backend uses `current_user["email"].lower()` to look up the Composio connection, not `user_id`. The service route will need to resolve the user's email from user_id.

**Parameters** (user-facing — `user_id` is injected, not listed here):

None.

**Parameter Validation Rules**:
- None — no user-facing parameters.

**Return Schema**:
```json
{
  "connected": "boolean — Whether Instantly is currently connected for this user",
  "account_id": "string | null — Composio connected account ID. Null if not connected."
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio API key not configured | "Composio integration is not configured." | 503 |
| Instantly auth config ID not configured | "Instantly auth config is not configured." | 503 |
| Composio API unreachable | "Unable to reach Composio to look up connection status. Please try again later." | 502 |

**Example Request**:
```
cheerful_get_instantly_status()
```

**Example Response** (connected):
```json
{
  "connected": true,
  "account_id": "conn_abc123def456"
}
```

**Example Response** (not connected):
```json
{
  "connected": false,
  "account_id": null
}
```

**Slack Formatting Notes**: Present: "Instantly: Connected (account: conn_abc123def456)" or "Instantly: Not connected. Use `cheerful_connect_instantly` with your API key to connect." On 503: "The Instantly integration service is not configured on this Cheerful instance."

**Edge Cases**:
- Composio returns empty `items` array → `connected=false`
- Composio returns multiple connections → first one used (takes `items[0]`)
- Composio API timeout → 502 error

---

### `cheerful_connect_instantly`

**Status**: NEW

**Purpose**: Connect the Instantly integration using an API key. Validates the key against Instantly's API, then stores the credential via Composio.

**Maps to**: `POST /api/service/integrations/instantly/connect` (new service route needed; mirrors `POST /integrations/instantly/connect` in `src/api/route/instantly.py:96`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only). The backend uses `current_user["email"].lower()` as the Composio entity_id.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| api_key | string | yes | — | Instantly API key (Bearer token). Will be validated against Instantly's campaigns endpoint before storing. |

**Parameter Validation Rules**:
- `api_key` is a required string (422 if missing or empty).
- Key is validated by making a `GET https://api.instantly.ai/api/v2/campaigns` request with `Authorization: Bearer {api_key}` and `limit=1`. HTTP 200 = valid, 401 = invalid, 5xx = service error.

**Return Schema**:
```json
{
  "success": "boolean — Whether the connection was established",
  "message": "string — Human-readable status message",
  "account_id": "string | null — Composio connected account ID if successful"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| Instantly auth config not configured | "Instantly auth config is not configured." | 503 |
| Already connected | "Instantly account is already connected. Disconnect first to reconnect." | 409 |
| Invalid API key (Instantly returns 401) | "Invalid Instantly API key. Please check the key and try again." | 400 |
| Instantly server error (5xx) | "Instantly API returned an error. Please try again later." | 502 |
| Instantly non-200/non-401 response | "Could not verify the Instantly API key. Please check the key and try again." | 400 |
| Instantly API unreachable | "Could not reach Instantly API. Please try again later." | 502 |
| Composio SDK error | "Failed to create connection in Composio: {error}" | 502 |

**Composio connection details**: The connection is created via `composio_client.connected_accounts.initiate()` with:
- `user_id`: user's email (lowercased)
- `auth_config_id`: `settings.COMPOSIO_INSTANTLY_AUTH_CONFIG_ID`
- `config`: `{"auth_scheme": "API_KEY", "val": {"generic_api_key": api_key}}`

**Example Request**:
```
cheerful_connect_instantly(api_key="inst_sk_abc123def456ghi789")
```

**Example Response**:
```json
{
  "success": true,
  "message": "Instantly account connected successfully.",
  "account_id": "conn_xyz789"
}
```

**Slack Formatting Notes**: Confirm: "Instantly connected successfully (account: conn_xyz789)". On 409: "Instantly is already connected. Disconnect first with `cheerful_disconnect_instantly`, then reconnect." Warn user about sharing API keys in Slack channels.

**Edge Cases**:
- API key is valid but Composio fails → key validation passes, connection creation fails → user should retry
- User already has an active Composio connection → must disconnect first (no implicit reconnect; 409)
- Composio returns a connection without an `id` → account_id will be null in response

---

### `cheerful_disconnect_instantly`

**Status**: NEW

**Purpose**: Disconnect the Instantly integration for the authenticated user. Removes the stored credential from Composio.

**Maps to**: `DELETE /api/service/integrations/instantly/disconnect` (new service route needed; mirrors `DELETE /integrations/instantly/disconnect` in `src/api/route/instantly.py:191`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only).

**Parameters** (user-facing — `user_id` is injected, not listed here):

None.

**Parameter Validation Rules**:
- None — no user-facing parameters.

**Return Schema**:
```json
{
  "success": "boolean — Whether the disconnection was successful",
  "message": "string — Human-readable status message"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| Instantly auth config not configured | "Instantly auth config is not configured." | 503 |
| No active connection | "No active Instantly connection found." | 404 |
| Composio delete failed (HTTP >= 400) | "Failed to disconnect from Composio." | 502 |
| Composio request error | "Failed to disconnect. Please try again." | 502 |

**Composio disconnect details**: The disconnect makes an HTTP DELETE request to `https://backend.composio.dev/api/v3/connected_accounts/{account_id}`. The `account_id` is retrieved by first looking up the connection via `_find_instantly_connection()`.

**Example Request**:
```
cheerful_disconnect_instantly()
```

**Example Response**:
```json
{
  "success": true,
  "message": "Instantly account disconnected."
}
```

**Slack Formatting Notes**: Confirm: "Instantly disconnected successfully." On 404: "No active Instantly connection found — nothing to disconnect."

**Edge Cases**:
- No connection exists → 404 (not a silent no-op)
- Composio API is down → 502 (cannot disconnect)
- Connection was already deleted in Composio but lookup still finds it → may return 502 on delete attempt

---

### `cheerful_test_instantly`

**Status**: NEW

**Purpose**: Test the current Instantly connection by executing a read-only operation (listing campaigns) through Composio. Returns the number of campaigns found as a health check.

**Maps to**: `POST /api/service/integrations/instantly/test` (new service route needed; mirrors `POST /integrations/instantly/test` in `src/api/route/instantly.py:247`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only).

**Parameters** (user-facing — `user_id` is injected, not listed here):

None.

**Parameter Validation Rules**:
- None — no user-facing parameters.

**Return Schema**:
```json
{
  "success": "boolean — Whether the connection test passed",
  "message": "string — Human-readable result (e.g., 'Connection working. Found 3 campaign(s).')",
  "campaigns_found": "integer — Number of Instantly campaigns found (default: 0). Test uses limit=5."
}
```

**Test execution details**: The test executes the `INSTANTLY_LIST_CAMPAIGNS` Composio tool with arguments `{"limit": 5, "skip": 0}`. The campaigns count comes from `data.get("items", [])`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| Instantly auth config not configured | "Instantly auth config is not configured." | 503 |
| No active connection | "No active Instantly connection found. Connect first." | 404 |
| Composio tool execution error | "Connection test failed: {error}" | 502 |

**Example Request**:
```
cheerful_test_instantly()
```

**Example Response**:
```json
{
  "success": true,
  "message": "Connection working. Found 3 campaign(s).",
  "campaigns_found": 3
}
```

**Slack Formatting Notes**: Present: "Instantly connection test: Passed — 3 campaigns found" or "Instantly connection test: Failed — {error}". On 404: "No Instantly connection found. Connect first using `cheerful_connect_instantly`."

**Edge Cases**:
- Connection exists but API key has been revoked → Composio tool execution fails → 502
- Instantly account has 0 campaigns → `campaigns_found=0`, still `success=true` (connection is valid)
- Composio SDK returns unexpected data format → `campaigns` defaults to empty list

---

## Slack Operations

### `cheerful_trigger_slack_digest`

**Status**: NEW

**Purpose**: Trigger a Slack order digest for a campaign. Starts a Temporal workflow (`SlackOrderDigestWorkflow`) that sends a digest of pending orders to the campaign's configured Slack channel for review and approval.

**Maps to**: `POST /api/service/slack/digest/{campaign_id}` (new service route needed; mirrors `POST /slack/digest/{campaign_id}` in `src/api/route/slack.py:523`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (`campaign.user_id == user_id` check at `slack.py:546`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID. The campaign must have a `slack_channel_id` configured. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID.

**Return Schema**:
```json
{
  "ok": "boolean — Always true on success",
  "workflow_id": "string — Temporal workflow run ID (format: 'slack-digest-{campaign_id}-{unix_timestamp}')"
}
```

**Temporal workflow details**:
- Workflow: `SlackOrderDigestWorkflow`
- Task queue: `TEMPORAL_TASK_QUEUE` (shared)
- ID format: `f"slack-digest-{campaign_id}-{int(time.time())}"`
- ID reuse policy: `ALLOW_DUPLICATE`
- Params: `SlackOrderDigestParams(campaign_id, slack_channel_id, campaign_name)`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| Not campaign owner | "Not authorized" | 403 |
| No Slack channel configured | "Campaign has no Slack channel configured" | 400 |

**Example Request**:
```
cheerful_trigger_slack_digest(campaign_id="aaaabbbb-cccc-dddd-eeee-ffffffffffff")
```

**Example Response**:
```json
{
  "ok": true,
  "workflow_id": "slack-digest-aaaabbbb-cccc-dddd-eeee-ffffffffffff-1709308800"
}
```

**Slack Formatting Notes**: Confirm: "Slack order digest triggered for campaign '{campaign_name}'. Pending orders will appear in the configured Slack channel for approval." On 400 (no channel): "This campaign doesn't have a Slack channel configured. Set one via `cheerful_update_campaign` with `slack_channel_id`."

**Note on Slack interactions**: The `/slack/interactions` webhook endpoint handles order approval/skip/edit actions from Slack button clicks. This is NOT a CE tool — it's an incoming webhook from Slack using HMAC signature verification. The `slack_approval_status` values used in the order approval flow are: `"pending"`, `"processing"`, `"approved"`, `"skipped"`.

**Edge Cases**:
- Campaign has no pending orders → Temporal workflow still runs, may send an empty digest or skip the Slack message
- Slack channel ID is invalid or bot not in channel → Temporal workflow fails asynchronously (the trigger endpoint returns success immediately)
- Multiple digests triggered rapidly → may create duplicate Slack messages (workflow IDs are unique via timestamp, but no debounce)
- Temporal client connection failure → 500 error (not explicitly handled in route)

---

## YouTube Lookalike Search

### `cheerful_find_youtube_lookalikes`

**Status**: NEW

**Purpose**: Find YouTube channels similar to a seed channel using AI-powered keyword extraction and Apify-based channel search. This is an **expensive, long-running operation** involving multiple external API calls (Apify YouTube scraper for seed channel details, LLM for keyword extraction, Apify channel finder for similar channels). Discovered channels are automatically saved to the global creator database.

**Maps to**: `POST /api/service/youtube/lookalikes` (new service route needed; mirrors `POST /youtube/lookalikes` in `src/api/route/youtube.py:137`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated.

**Note**: The request/response models are defined inline in `youtube.py` (lines 27-93), not in `src/models/api/youtube.py`. The latter only contains internal service models (`YouTubeChannelDetails`, `YouTubeChannelFinderResult`, `YouTubeLookalikeResult`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| channel_url | string | yes | — | YouTube channel URL or handle. Accepts: full URL (`"https://www.youtube.com/@MrBeast"`), handle (`"@MrBeast"`), or channel ID. The input is normalized via `normalize_youtube_channel_input()`. |
| search_pool_size | integer | no | 50 | How many channels to search before filtering. Returns ALL channels with emails found. Valid range: 10-100 (enforced by `Field(ge=10, le=100)`). |
| region | string | no | null | Filter by region. ISO 3166-1 alpha-2 code (e.g., `"US"`, `"GB"`, `"JP"`). |
| language | string | no | null | Filter by language. IETF BCP-47 code (e.g., `"en"`, `"es"`, `"ja"`). |

**Parameter Validation Rules**:
- `channel_url` is required. If `normalize_youtube_channel_input()` returns falsy, the endpoint returns 400.
- `search_pool_size` must be 10-100 (422 if outside range).
- `region` and `language` are optional free-form strings (no validation beyond null check).

**Return Schema**:
```json
{
  "seed_channel": {
    "channel_id": "string — YouTube channel ID",
    "channel_name": "string — Channel display name",
    "channel_username": "string | null — Channel username (may differ from handle)",
    "channel_url": "string — Full YouTube channel URL",
    "subscriber_count": "integer — Number of subscribers",
    "total_videos": "integer — Total uploaded videos",
    "total_views": "integer — Total channel views",
    "description": "string | null — Channel description",
    "location": "string | null — Channel location",
    "is_verified": "boolean — Whether the channel is verified",
    "avatar_url": "string | null — Channel avatar image URL",
    "email": "string | null — Contact email if publicly available (default: null)"
  },
  "similar_channels": [
    {
      "channel_id": "string — YouTube channel ID",
      "channel_name": "string — Channel display name",
      "channel_handle": "string | null — Channel @handle",
      "channel_url": "string — Full YouTube channel URL",
      "thumbnail_url": "string | null — Channel thumbnail URL",
      "description": "string | null — Channel description",
      "country": "string | null — Channel country",
      "subscriber_count": "integer | null — Subscriber count (null if private)",
      "total_views": "integer | null — Total views (null if private)",
      "keywords": ["string — Keywords that matched this channel"],
      "is_verified": "boolean — Whether the channel is verified",
      "channel_type": "string | null — Channel type classification",
      "email": "string | null — Contact email (default: null)"
    }
  ],
  "keywords_used": ["string — AI-extracted search keywords used to find similar channels"],
  "scraper_run_id": "string — Apify YouTube scraper run ID (for seed channel)",
  "finder_run_id": "string — Apify channel finder run ID (for similar channels)"
}
```

**Side effects**: All discovered similar channels are saved to the global `creator` table via `save_creator_from_youtube(db, channel, source=f"apify_youtube_lookalike:{finder_run_id}")`. This happens inside a DB transaction. See `youtube.py:198-205`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Invalid channel input (normalization fails) | "Invalid YouTube channel. Provide a channel URL, @handle, or channel ID." | 400 |
| Rate limit / quota exceeded | "Service rate limit exceeded. Please try again later." | 429 |
| Service auth error | "YouTube search service is not properly configured." | 503 |
| Channel not found | "Channel not found or invalid URL: {channel_url}" | 404 |
| Unexpected error | "An unexpected error occurred while searching for similar channels." | 500 |

**Error categorization**: Errors are classified by string matching on the lowercased error message: `"rate limit"` or `"quota"` → 429; `"unauthorized"` or `"forbidden"` → 503; `"not found"` or `"invalid"` → 404; everything else → 500.

**Example Request**:
```
cheerful_find_youtube_lookalikes(
  channel_url="@MrBeast",
  search_pool_size=30,
  region="US"
)
```

**Example Response**:
```json
{
  "seed_channel": {
    "channel_id": "UCX6OQ3DkcsbYNE6H8uQQuVA",
    "channel_name": "MrBeast",
    "channel_username": "MrBeast",
    "channel_url": "https://www.youtube.com/@MrBeast",
    "subscriber_count": 275000000,
    "total_videos": 815,
    "total_views": 48000000000,
    "description": "SUBSCRIBE FOR A COOKIE!",
    "location": "United States",
    "is_verified": true,
    "avatar_url": "https://yt3.googleusercontent.com/...",
    "email": null
  },
  "similar_channels": [
    {
      "channel_id": "UC2wKfjlioOCLP4xQMOWNcgg",
      "channel_name": "Dude Perfect",
      "channel_handle": "@DudePerfect",
      "channel_url": "https://www.youtube.com/@DudePerfect",
      "thumbnail_url": "https://yt3.googleusercontent.com/...",
      "description": "5 best buds just makin' videos...",
      "country": "US",
      "subscriber_count": 60000000,
      "total_views": 16000000000,
      "keywords": ["entertainment", "challenges", "stunts"],
      "is_verified": true,
      "channel_type": "Entertainment",
      "email": "contact@dudeperfect.com"
    }
  ],
  "keywords_used": ["entertainment", "challenges", "giveaway", "philanthropy"],
  "scraper_run_id": "apify_run_abc123",
  "finder_run_id": "apify_run_def456"
}
```

**Slack Formatting Notes**: Present seed channel first, then numbered list:
```
Seed: MrBeast (275M subs, verified) — US
Keywords used: entertainment, challenges, giveaway, philanthropy

Similar channels found (15):
1. @DudePerfect — 60M subs, US, verified — entertainment, challenges
   Email: contact@dudeperfect.com
2. @PrestonPlayz — 25M subs, US — challenges, gaming
   Email: (none)
...
```
For long lists, summarize top 10 and note total count.

**Edge Cases**:
- Seed channel has no public metadata → limited scraper results, fewer keywords extracted
- Very small pool size (10) → fewer but faster results
- Very large pool size (100) → more comprehensive but significantly slower (multiple Apify API calls)
- Channel URL with special characters → handled by `normalize_youtube_channel_input()`
- Region/language filters → applied to the similar channel search, not the seed channel info
- All discovered channels already exist in creator table → `save_creator_from_youtube` handles upserts gracefully

---

## Brand Lookup

### `cheerful_lookup_brand`

**Status**: NEW

**Purpose**: Look up product brand information from a product URL. Uses the Brandfetch service to detect brand name, logo, and icons. Results are cached in the database — subsequent lookups for the same domain return cached data.

**Maps to**: `POST /api/service/brands/lookup` (new service route needed; mirrors `POST /brands/lookup` in `src/api/route/brand.py:25`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated. **Note**: The backend uses `Depends(get_current_user)` (JWT auth) but doesn't actually use the user_id for any business logic — brand lookup is user-independent. The auth is just an access gate.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product_url | string | yes | — | Product URL to detect brand from (e.g., `"https://www.nike.com/t/dunk-low-shoes-12345"`). The domain is used to identify the brand. |

**Parameter Validation Rules**:
- `product_url` is a required string (422 if missing).
- No URL format validation at the Pydantic level — any string is accepted.

**Return Schema**:
```json
{
  "brand_name": "string | null — Detected brand name (e.g., 'Nike'). Null if detection failed.",
  "logo_url": "string | null — Full brand logo image URL. Null if not found.",
  "symbol_url": "string | null — Brand symbol/mark image URL. Null if not found.",
  "icon_url": "string | null — Brand icon/favicon URL. Null if not found."
}
```

**Note**: This endpoint does NOT throw HTTP errors on lookup failure. If brand detection fails for any reason (invalid URL, unknown brand, Brandfetch API error), it returns an empty response with all null fields. See `brand.py:47-54` — all exceptions are caught and logged, then an empty `BrandLookupResponse()` is returned.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

No other HTTP errors — all failures are gracefully handled with empty responses.

**Example Request**:
```
cheerful_lookup_brand(product_url="https://www.nike.com/t/dunk-low-shoes-12345")
```

**Example Response** (brand found):
```json
{
  "brand_name": "Nike",
  "logo_url": "https://cdn.brandfetch.io/nike/logo.svg",
  "symbol_url": "https://cdn.brandfetch.io/nike/symbol.svg",
  "icon_url": "https://cdn.brandfetch.io/nike/icon.png"
}
```

**Example Response** (brand not found):
```json
{
  "brand_name": null,
  "logo_url": null,
  "symbol_url": null,
  "icon_url": null
}
```

**Slack Formatting Notes**: If brand found: "Brand detected: **Nike** — [logo](url)". If all fields null: "Could not detect brand from that URL. Try a different product page URL." Include logo_url as a clickable link if available.

**Edge Cases**:
- URL for a small/unknown brand → all fields null (not an error)
- URL is not a product page → may still detect the domain's brand (e.g., any nike.com page returns Nike)
- Same URL/domain looked up twice → second call returns cached result from the `brand` database table (via `get_or_create_brand`)
- Invalid/unreachable URL → graceful failure, all fields null
- Brandfetch service is down → graceful failure, all fields null (exception logged)

---

## Service Routes Summary

All 18 integration tools need new `/api/service/*` endpoints. Currently ZERO integration endpoints have service routes.

| # | Service Route | HTTP Method | Maps From | Auth | Notes |
|---|--------------|-------------|-----------|------|-------|
| 1 | `/api/service/user/gmail-accounts` | GET | `/user/gmail-accounts` | Service API key + user_id | Read-only |
| 2 | `/api/service/user/connected-accounts` | GET | `/user/connected-accounts` | Service API key + user_id | With account_type and active_only filters |
| 3 | `/api/service/smtp-accounts` | GET | `/smtp-accounts` | Service API key + user_id | List |
| 4 | `/api/service/smtp-accounts/{id}` | GET | `/smtp-accounts/{id}` | Service API key + user_id | Get + ownership check |
| 5 | `/api/service/smtp-accounts` | POST | `/smtp-accounts` | Service API key + user_id | Create + reactivation logic |
| 6 | `/api/service/smtp-accounts/{id}` | PATCH | `/smtp-accounts/{id}` | Service API key + user_id | Partial update + ownership check |
| 7 | `/api/service/smtp-accounts/{id}` | DELETE | `/smtp-accounts/{id}` | Service API key + user_id | Hard delete + ownership check |
| 8 | `/api/service/smtp-accounts/bulk` | POST | `/smtp-accounts/bulk` | Service API key + user_id | Bulk import with IMAP verification |
| 9 | `/api/service/integrations/google-sheets/tabs` | GET | `/integrations/google-sheets/tabs` | Service API key (user_id for audit) | No user-scoping needed (service account) |
| 10 | `/api/service/shopify/workflows/{id}/products` | GET | `/shopify/workflows/{id}/products` | Service API key + user_id | Owner-only via campaign chain |
| 11 | `/api/service/shopify/workflow-executions/{id}/orders` | POST | `/shopify/workflow-executions/{id}/orders` | Service API key + user_id | Owner-only via campaign chain |
| 12 | `/api/service/integrations/instantly/status` | GET | `/integrations/instantly/status` | Service API key + user_id | Needs email resolution from user_id |
| 13 | `/api/service/integrations/instantly/connect` | POST | `/integrations/instantly/connect` | Service API key + user_id | Needs email resolution from user_id |
| 14 | `/api/service/integrations/instantly/disconnect` | DELETE | `/integrations/instantly/disconnect` | Service API key + user_id | Needs email resolution from user_id |
| 15 | `/api/service/integrations/instantly/test` | POST | `/integrations/instantly/test` | Service API key + user_id | Needs email resolution from user_id |
| 16 | `/api/service/slack/digest/{campaign_id}` | POST | `/slack/digest/{campaign_id}` | Service API key + user_id | Owner-only |
| 17 | `/api/service/youtube/lookalikes` | POST | `/youtube/lookalikes` | Service API key + user_id | Long-running operation |
| 18 | `/api/service/brands/lookup` | POST | `/brands/lookup` | Service API key + user_id | User-independent business logic |

**Implementation note for Instantly service routes**: The current Instantly endpoints use `current_user["email"].lower()` as the Composio entity_id. The new service routes will receive `user_id` (UUID) instead. They will need to resolve the user's email address from the database (e.g., query `auth.users` or `user_setting` table) before calling the Instantly/Composio logic.

---

## Non-CE-Capable Endpoints (Documented for Completeness)

These endpoints exist but CANNOT be implemented as context engine tools:

| Endpoint | Location | Reason |
|----------|----------|--------|
| `GET /api/auth/google/initiate` | Webapp | Requires browser redirect to Google consent screen |
| `GET /api/auth/google/callback` | Webapp | OAuth callback — browser handles response |
| `GET /api/auth/shopify/initiate` | Webapp | Requires browser redirect to Shopify consent screen |
| `GET /api/auth/shopify/callback` | Webapp | OAuth callback — browser handles response |
| `POST /slack/interactions` | Backend | Incoming webhook from Slack — not user-initiated; uses Slack HMAC signature verification, not user auth |

**Agent guidance**: When a user asks to connect Gmail or Shopify, the agent should respond: "I can't initiate OAuth connections from Slack. Please visit the webapp Settings page to connect your Gmail/Shopify account. Once connected, I can check the status using `cheerful_list_gmail_accounts` or `cheerful_list_connected_accounts`."
