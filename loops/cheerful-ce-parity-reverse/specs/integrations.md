# Integrations Domain — Tool Specifications

**Domain**: Integrations
**Spec file**: `specs/integrations.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

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

> **Service routes needed**: Gmail account listing and SMTP CRUD need new `/api/service/*` endpoints. Instantly endpoints are JWT-auth only — need 4 new service routes. Shopify endpoints are JWT-auth — need 2 new service routes. Slack digest is JWT-auth — needs 1 new service route. YouTube and brand lookup are JWT-auth — need 2 new service routes. Google Sheets is unauthenticated (service account) — may not need a service route but should be proxied for consistency. **Total: ~14 new service routes needed.**

---

## Gmail Account Management

Gmail OAuth flows (initiate + callback) are webapp-only browser redirects. The context engine can only list Gmail account status — it CANNOT connect or disconnect Gmail accounts.

### `cheerful_list_gmail_accounts`

**Status**: NEW

**Purpose**: List the authenticated user's connected Gmail accounts and their sync status.

**Maps to**: `GET /api/service/user/gmail-accounts` (new service route needed; main route: `GET /user/gmail-accounts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own Gmail accounts).

**Parameters**: None (user-scoped, no filtering).

**Returns**: Array of Gmail account objects:
- id: uuid
- gmail_email: string
- sync_in_progress: boolean
- is_active: boolean
- created_at: datetime

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Slack Formatting Notes**: Agent should present as a simple numbered list: `1. user@gmail.com — Active, syncing: no`. If no accounts, prompt: "No Gmail accounts connected. Visit the webapp to connect your Gmail."

**Edge Cases**:
- User has no Gmail accounts → empty array, not an error
- Account with `sync_in_progress=true` → agent should note "sync is in progress, thread data may be incomplete"
- Account with `is_active=false` → account exists but is deactivated (OAuth token expired or revoked)

---

### `cheerful_list_connected_accounts`

**Status**: NEW

**Purpose**: List all connected email accounts (Gmail + SMTP) in a unified view with optional filtering by account type.

**Maps to**: `GET /api/service/user/connected-accounts` (new service route needed; main route: `GET /user/connected-accounts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_type | enum | no | — | Filter by account type. One of: "gmail", "smtp". If omitted, returns both types. |
| active_only | boolean | no | true | If true, only return active accounts. If false, include deactivated accounts. |

**Returns**: Array of connected account objects:
- id: uuid
- email: string
- account_type: enum — "gmail" or "smtp"
- display_name: string (nullable)
- is_active: boolean

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Slack Formatting Notes**: Agent should present grouped by type:
```
Gmail:
  1. user@gmail.com — Active
SMTP:
  1. outreach@company.com (Company Outreach) — Active
  2. sales@company.com — Inactive
```
If no accounts at all, prompt user to connect accounts.

**Edge Cases**:
- User has Gmail but no SMTP → only Gmail entries returned
- `active_only=false` includes deactivated accounts (useful for troubleshooting)
- `display_name` is null for Gmail accounts — comes from `ConnectedAccountResponse` normalization

---

## SMTP Account Management

Full CRUD lifecycle for SMTP/IMAP email accounts. SMTP accounts allow users to send emails from non-Gmail addresses with custom SMTP servers.

### `cheerful_list_smtp_accounts`

**Status**: NEW

**Purpose**: List the authenticated user's SMTP email accounts.

**Maps to**: `GET /api/service/smtp-accounts` (new service route needed; main route: `GET /smtp-accounts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (self-only — returns only the user's own SMTP accounts).

**Parameters**: None (user-scoped, no filtering).

**Returns**: Array of SMTP account objects:
- id: uuid
- email_address: string
- display_name: string (nullable)
- smtp_host: string
- smtp_port: integer
- smtp_username: string
- smtp_use_tls: boolean
- imap_host: string
- imap_port: integer
- imap_username: string
- imap_use_ssl: boolean
- is_active: boolean
- last_verified_at: datetime (nullable)
- verification_error: string (nullable)
- created_at: datetime

**Note**: Passwords (smtp_password, imap_password) are NEVER returned in responses.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Slack Formatting Notes**: Agent should present as a table-like list: `{email_address} ({display_name}) — {smtp_host}:{smtp_port}, TLS: {smtp_use_tls}, Active: {is_active}`. Flag accounts with `verification_error` present.

**Edge Cases**:
- User has no SMTP accounts → empty array
- Account with `verification_error` set → credentials failed verification, agent should suggest `cheerful_update_smtp_account` to fix

---

### `cheerful_get_smtp_account`

**Status**: NEW

**Purpose**: Get full details of a specific SMTP account by ID.

**Maps to**: `GET /api/service/smtp-accounts/{account_id}` (new service route needed; main route: `GET /smtp-accounts/{account_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if account belongs to another user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID |

**Returns**: Single SMTP account object (same schema as list items):
- id: uuid
- email_address: string
- display_name: string (nullable)
- smtp_host: string
- smtp_port: integer
- smtp_username: string
- smtp_use_tls: boolean
- imap_host: string
- imap_port: integer
- imap_username: string
- imap_use_ssl: boolean
- is_active: boolean
- last_verified_at: datetime (nullable)
- verification_error: string (nullable)
- created_at: datetime

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to access this SMTP account" | 403 |

**Slack Formatting Notes**: Agent should present as a detailed profile with all fields. Highlight `verification_error` if present.

---

### `cheerful_create_smtp_account`

**Status**: NEW

**Purpose**: Create a new SMTP/IMAP email account for the authenticated user. The account will be used for sending campaign emails.

**Maps to**: `POST /api/service/smtp-accounts` (new service route needed; main route: `POST /smtp-accounts`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates account owned by the user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| email_address | string | yes | — | Email address for this SMTP account |
| display_name | string | no | null | Friendly display name (e.g., "Company Outreach") |
| smtp_host | string | yes | — | SMTP server hostname (e.g., "smtp.gmail.com") |
| smtp_port | integer | no | 587 | SMTP server port. Common values: 587 (TLS), 465 (SSL), 25 (plaintext) |
| smtp_username | string | yes | — | SMTP login username (usually the email address) |
| smtp_password | string | yes | — | SMTP login password (App Password for Gmail) |
| smtp_use_tls | boolean | no | true | Use STARTTLS for SMTP connection |
| imap_host | string | yes | — | IMAP server hostname (e.g., "imap.gmail.com") |
| imap_port | integer | no | 993 | IMAP server port. Common values: 993 (SSL), 143 (plaintext) |
| imap_username | string | yes | — | IMAP login username |
| imap_password | string | yes | — | IMAP login password |
| imap_use_ssl | boolean | no | true | Use SSL for IMAP connection |

**Returns**: Created SMTP account object (same schema as get — passwords excluded).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Duplicate active account | "SMTP account with this email already exists" | 409 |

**Reactivation behavior**: If an inactive account with the same email_address already exists, the backend reactivates it with the new credentials instead of throwing a 409 error.

**Gmail SMTP preset**: For Gmail accounts, use: `smtp_host="smtp.gmail.com"`, `smtp_port=587`, `imap_host="imap.gmail.com"`, `imap_port=993`. Requires a Google App Password (not the user's regular Gmail password).

**Slack Formatting Notes**: Agent should confirm creation: "Created SMTP account `{email_address}` ({display_name})". Warn user about credential security: passwords are stored encrypted and never returned in API responses.

**Edge Cases**:
- Inactive account with same email → silently reactivated with new credentials
- Invalid SMTP/IMAP credentials → account is created but may fail verification later (verification is separate from creation for single accounts — bulk import verifies upfront)

---

### `cheerful_update_smtp_account`

**Status**: NEW

**Purpose**: Update an existing SMTP account's configuration. Supports partial updates — only provided fields are changed.

**Maps to**: `PATCH /api/service/smtp-accounts/{account_id}` (new service route needed; main route: `PATCH /smtp-accounts/{account_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if account belongs to another user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID to update |
| email_address | string | no | — | Updated email address |
| display_name | string | no | — | Updated display name |
| smtp_host | string | no | — | Updated SMTP host |
| smtp_port | integer | no | — | Updated SMTP port |
| smtp_username | string | no | — | Updated SMTP username |
| smtp_password | string | no | — | Updated SMTP password |
| smtp_use_tls | boolean | no | — | Updated TLS setting |
| imap_host | string | no | — | Updated IMAP host |
| imap_port | integer | no | — | Updated IMAP port |
| imap_username | string | no | — | Updated IMAP username |
| imap_password | string | no | — | Updated IMAP password |
| imap_use_ssl | boolean | no | — | Updated SSL setting |

**Returns**: Updated SMTP account object (full schema, passwords excluded).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to update this SMTP account" | 403 |

**Slack Formatting Notes**: Agent should confirm: "Updated SMTP account `{email_address}` — changed: {list of updated fields}".

**Edge Cases**:
- No fields provided → no-op, returns current account state
- Updating email_address to one that already exists for another active account → behavior TBD (verify in Wave 3)

---

### `cheerful_delete_smtp_account`

**Status**: NEW

**Purpose**: Delete (deactivate) an SMTP account. The account will no longer be usable for sending emails.

**Maps to**: `DELETE /api/service/smtp-accounts/{account_id}` (new service route needed; main route: `DELETE /smtp-accounts/{account_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (403 if account belongs to another user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account_id | uuid | yes | — | SMTP account ID to delete |

**Returns**: No content (204).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Account not found | "SMTP account not found" | 404 |
| Account belongs to another user | "Not authorized to delete this SMTP account" | 403 |

**Slack Formatting Notes**: Agent should confirm deletion: "Deleted SMTP account `{email_address}`". Consider warning before deletion if the account is assigned as a sender on any active campaigns.

**Edge Cases**:
- Account is used as a sender on active campaigns → behavior TBD in Wave 3 (may orphan campaign senders, may cascade deactivate)
- Account already inactive → still returns 404 or silently succeeds? (verify in Wave 3)

---

### `cheerful_bulk_import_smtp_accounts`

**Status**: NEW

**Purpose**: Import multiple SMTP accounts at once with automatic IMAP credential verification. Supports Gmail preset (simplified params) and custom SMTP providers.

**Maps to**: `POST /api/service/smtp-accounts/bulk` (new service route needed; main route: `POST /smtp-accounts/bulk`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates accounts owned by the user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| provider | enum | yes | — | One of: "gmail", "custom". Determines required fields per account. |
| accounts | object[] | yes | — | Array of 1-100 account entries to import. Fields vary by provider (see below). |

**Account fields for `provider="gmail"`**:
- email_address: string (required) — Gmail address
- password: string (required) — Gmail App Password (can also be `smtp_password`)

**Account fields for `provider="custom"`**:
- email_address: string (required)
- smtp_host: string (required)
- smtp_port: integer (optional, default 587)
- smtp_password: string (required — or `password`)
- imap_host: string (required)
- imap_port: integer (optional, default 993)
- imap_password: string (required — or `password`)
- display_name: string (optional)

**Returns**: Bulk import result:
- created: integer — number of accounts successfully created
- skipped: integer — number of accounts skipped (duplicate email)
- errors: integer — number of accounts that failed verification
- results: array of per-account results:
  - email_address: string
  - status: enum — "created", "skipped", "error"
  - error: string (nullable — error message if status is "error")
  - account_id: uuid (nullable — set if status is "created")

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Empty accounts array | Validation error: at least 1 account required | 422 |
| More than 100 accounts | Validation error: maximum 100 accounts per import | 422 |

**Per-account error examples** (in results array, not HTTP errors):
- "Authentication failed — check your password (Gmail requires an App Password)"
- Connection timeout errors
- OSError / generic connection failures

**Important**: Unlike single account creation, bulk import performs IMAP credential verification BEFORE saving. Accounts that fail verification are reported as "error" status and are NOT created. Verification runs in parallel with a maximum of 10 concurrent workers.

**Slack Formatting Notes**: Agent should present a summary: "Imported {created} accounts, {skipped} skipped (duplicates), {errors} failed." Then detail any failures: "Failed: user@example.com — Authentication failed (check App Password)".

**Edge Cases**:
- All accounts fail verification → created=0, errors=N
- Mix of Gmail and custom accounts → not supported — all accounts must match the provider type
- Duplicate emails within the same import batch → later entries may conflict
- Accounts with inactive duplicates → reactivation behavior same as single create

---

## Google Sheets

### `cheerful_get_google_sheet_tabs`

**Status**: NEW

**Purpose**: Retrieve the list of tabs (sheets) in a Google Sheets spreadsheet. Used during campaign setup to discover available tabs when configuring a Google Sheet data source.

**Maps to**: `GET /api/service/integrations/google-sheets/tabs` (new service route for consistency; main route: `GET /integrations/google-sheets/tabs` — note: main route has NO authentication)

**Auth**: The underlying endpoint has no authentication (it uses a service account to access Google Sheets). However, for consistency and security, the CE tool should still require a resolved user via `RequestContext` even though the backend doesn't enforce it. The spreadsheet must be shared with the Cheerful service account.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| url | string | yes | — | Full Google Sheets URL (e.g., "https://docs.google.com/spreadsheets/d/{id}/edit") |

**Returns**: Sheet tab metadata:
- success: boolean
- sheets: array of tab objects:
  - sheet_id: integer — Google Sheets internal sheet ID
  - title: string — Tab name (e.g., "Sheet1", "Creator List")
  - index: integer — Tab position (0-based)

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Spreadsheet not found | "Spreadsheet not found. Please check the URL." | 404 |
| Permission denied | "Permission denied. Please share the sheet with the service account." | 403 |
| API error | "Failed to fetch spreadsheet tabs." | 500 |

**Slack Formatting Notes**: Agent should present as a numbered list of tab names: "Tabs in spreadsheet:\n1. Sheet1\n2. Creator List\n3. Email Data". If the sheet isn't shared, provide instructions to share with the service account email.

**Edge Cases**:
- Spreadsheet with 0 tabs → theoretically impossible (Sheets requires at least 1 tab), but handle gracefully
- Invalid URL format → may produce confusing 404 rather than a validation error
- Very large spreadsheet → this only reads metadata, not cell data, so it's fast regardless of data size

---

## Shopify / GoAffPro

Shopify OAuth (store connection) is webapp-only. The CE can read products and create orders through the GoAffPro proxy API once a Shopify connection exists.

### `cheerful_list_shopify_products`

**Status**: NEW

**Purpose**: List products from a Shopify store connected to a campaign workflow. Products are fetched via GoAffPro's proxy API using the workflow's configured API key.

**Maps to**: `GET /api/service/shopify/workflows/{workflow_id}/products` (new service route needed; main route: `GET /shopify/workflows/{workflow_id}/products`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (the workflow's campaign must be owned by the user — verified via `campaign.user_id`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_id | uuid | yes | — | Campaign workflow ID (must have GoAffPro config) |
| limit | integer | no | 10 | Max products to return. Range: 1-100 |

**Returns**: Array of Shopify product objects:
- products: array
  - id: string — Shopify Product GID (e.g., "gid://shopify/Product/12345")
  - title: string — Product title
  - variants: array of variant objects:
    - id: string — Shopify Variant GID (e.g., "gid://shopify/ProductVariant/67890")
    - title: string — Variant title (e.g., "Small / Blue")
    - price: string — Price as string (e.g., "29.99")

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Workflow not found | "Workflow not found" | 404 |
| Not campaign owner | "Not authorized" | 403 |
| No GoAffPro API key in workflow config | "Workflow config missing goaffpro_api_key" | 400 |
| GoAffPro API error | "GoAffPro API error: {error}" | 502 |

**Slack Formatting Notes**: Agent should present products with variants as a formatted list:
```
1. Blue T-Shirt
   - Small ($19.99)
   - Medium ($19.99)
   - Large ($21.99)
2. Logo Hoodie
   - One Size ($49.99)
```

**Edge Cases**:
- Workflow has no Shopify integration → 400 (no GoAffPro key)
- Shopify store has 0 products → empty array
- Products with no variants → empty `variants` array per product
- GoAffPro API is down → 502 error

---

### `cheerful_create_shopify_order`

**Status**: NEW

**Purpose**: Create a Shopify order from a completed workflow execution. The execution must contain output_data with email, shipping_address, and line_items. Used in the gifting flow to send products to opted-in creators.

**Maps to**: `POST /api/service/shopify/workflow-executions/{workflow_execution_id}/orders` (new service route needed; main route: `POST /shopify/workflow-executions/{workflow_execution_id}/orders`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (verified via execution → workflow → campaign → `campaign.user_id`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| workflow_execution_id | uuid | yes | — | Completed workflow execution ID with order data in output_data |

**Returns**: Created order details:
- order_id: string — Shopify Order GID
- order_name: string — Human-readable order number (e.g., "#1002")
- total_amount: string — Order total as string (e.g., "49.99")
- currency_code: string — Currency (e.g., "USD")
- workflow_execution_id: uuid — The execution this order was created from

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Execution not found | "Workflow execution not found" | 404 |
| Execution not completed | "Workflow execution status is '{status}', expected 'completed'" | 400 |
| No output_data | "Workflow execution has no output_data" | 400 |
| Missing required fields in output_data | "Workflow execution output_data missing required fields: {fields}" | 400 |
| Workflow not found | "Workflow not found" (parent workflow) | 404 |
| Not campaign owner | "Not authorized" | 403 |
| No GoAffPro API key | "Workflow config missing goaffpro_api_key" | 400 |
| GoAffPro API error | "GoAffPro API error: {error}" | 502 |
| Shopify GraphQL errors | "Order creation failed" with errors array | 400 |

**Slack Formatting Notes**: Agent should confirm: "Order {order_name} created — Total: {currency_code} {total_amount}". On error, display the specific reason (e.g., "Execution is still 'running', wait for it to complete").

**Edge Cases**:
- Execution is "pending" or "running" → must wait until "completed"
- output_data is present but missing required fields → specific field names listed in error
- Order creation succeeds on Shopify but response has userErrors → 400 with error details
- Double-creating an order from the same execution → Shopify may create a duplicate (no idempotency check documented)

---

## Instantly (Composio)

Full lifecycle management for Instantly email outreach integration. Instantly is connected via API key through Composio as the credential broker.

### `cheerful_get_instantly_status`

**Status**: NEW

**Purpose**: Check the current connection status of the Instantly integration for the authenticated user.

**Maps to**: `GET /api/service/integrations/instantly/status` (new service route needed; main route: `GET /integrations/instantly/status`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only — checks the user's own Instantly connection).

**Parameters**: None.

**Returns**: Connection status:
- connected: boolean — whether Instantly is currently connected
- account_id: string (nullable) — Composio connected account ID, null if not connected

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| Composio auth not configured | "Instantly auth config is not configured." | 503 |
| Composio unreachable | "Unable to reach Composio to look up connection status. Please try again later." | 502 |

**Slack Formatting Notes**: Agent should present: "Instantly: Connected (account: {account_id})" or "Instantly: Not connected". On 503, explain: "The Instantly integration service is not configured on this instance."

---

### `cheerful_connect_instantly`

**Status**: NEW

**Purpose**: Connect the Instantly integration using an API key. Validates the key against Instantly's API, then stores the credential via Composio.

**Maps to**: `POST /api/service/integrations/instantly/connect` (new service route needed; main route: `POST /integrations/instantly/connect`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only). **Note**: Instantly uses the user's EMAIL (not user_id) as the Composio entity_id.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| api_key | string | yes | — | Instantly API key (Bearer token). Validated against `https://api.instantly.ai/api/v2/campaigns` before storing. |

**Returns**: Connection result:
- success: boolean
- message: string — human-readable status message
- account_id: string (nullable) — Composio connected account ID if successful

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| Already connected | "Instantly account is already connected. Disconnect first to reconnect." | 409 |
| Invalid API key (Instantly 401) | "Invalid Instantly API key. Please check the key and try again." | 400 |
| Instantly server error (5xx) | "Instantly API returned an error. Please try again later." | 502 |
| Instantly non-200 | "Could not verify the Instantly API key. Please check the key and try again." | 400 |
| Instantly unreachable | "Could not reach Instantly API. Please try again later." | 502 |
| Composio connection error | "Failed to create connection in Composio: {error}" | 502 |

**Slack Formatting Notes**: Agent should confirm: "Instantly connected successfully (account: {account_id})". On 409, suggest: "Already connected — disconnect first with `cheerful_disconnect_instantly`, then reconnect."

**Edge Cases**:
- API key is valid but Composio fails → key validation passes, connection creation fails → user should retry
- User already has a connected account → must disconnect first (no implicit reconnect)

---

### `cheerful_disconnect_instantly`

**Status**: NEW

**Purpose**: Disconnect the Instantly integration for the authenticated user. Removes the stored credential from Composio.

**Maps to**: `DELETE /api/service/integrations/instantly/disconnect` (new service route needed; main route: `DELETE /integrations/instantly/disconnect`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only).

**Parameters**: None.

**Returns**: Disconnection result:
- success: boolean
- message: string — human-readable status message

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| No active connection | "No active Instantly connection found." | 404 |
| Composio deletion failed | "Failed to disconnect from Composio." | 502 |
| Composio unreachable | "Failed to disconnect. Please try again." | 502 |

**Slack Formatting Notes**: Agent should confirm: "Instantly disconnected successfully." On 404: "No active Instantly connection found — nothing to disconnect."

---

### `cheerful_test_instantly`

**Status**: NEW

**Purpose**: Test the current Instantly connection by listing campaigns. Returns the number of campaigns found as a health check.

**Maps to**: `POST /api/service/integrations/instantly/test` (new service route needed; main route: `POST /integrations/instantly/test`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (self-only — tests the user's own connection).

**Parameters**: None.

**Returns**: Test result:
- success: boolean — whether the connection test passed
- message: string — human-readable result
- campaigns_found: integer (default 0) — number of Instantly campaigns found (tests with `INSTANTLY_LIST_CAMPAIGNS` Composio tool, limit=5)

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Composio not configured | "Composio integration is not configured." | 503 |
| No active connection | "No active Instantly connection found. Connect first." | 404 |
| Composio tool execution error | "Connection test failed: {error}" | 502 |

**Slack Formatting Notes**: Agent should present: "Instantly connection test: Passed — {campaigns_found} campaigns found" or "Instantly connection test: Failed — {error}".

---

## Slack Operations

### `cheerful_trigger_slack_digest`

**Status**: NEW

**Purpose**: Trigger a Slack order digest for a campaign. Sends a digest of pending orders to the campaign's configured Slack channel for approval. Starts a Temporal workflow (`SlackOrderDigestWorkflow`).

**Maps to**: `POST /api/service/slack/digest/{campaign_id}` (new service route needed; main route: `POST /slack/digest/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only (campaign must be owned by the user — `campaign.user_id == user_id`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID. Must have a Slack channel configured (`slack_channel_id`). |

**Returns**: Workflow initiation result:
- ok: boolean — true if the digest workflow was started
- workflow_id: string — Temporal workflow run ID

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| Not campaign owner | "Not authorized" | 403 |
| No Slack channel | "Campaign has no Slack channel configured" | 400 |

**Slack Formatting Notes**: Agent should confirm: "Slack order digest triggered for campaign '{campaign_name}'. Pending orders will appear in the configured Slack channel for approval." If 400 (no channel), suggest: "This campaign doesn't have a Slack channel configured. Set one via `cheerful_update_campaign` with `slack_channel_id`."

**Edge Cases**:
- Campaign has no pending orders → digest workflow still runs, but Slack message may be empty or say "no pending orders"
- Slack channel ID is invalid or bot not in channel → Temporal workflow will fail asynchronously (not a synchronous error)
- Multiple digests triggered in quick succession → may create duplicate messages

**Note**: The Slack interactions webhook (`/slack/interactions`) handles order approval/skip/edit actions from Slack users. This is NOT a CE tool — it's an incoming webhook from Slack. The `slack_approval_status` values used are: "pending", "processing", "approved", "skipped".

---

## YouTube Lookalike Search

### `cheerful_find_youtube_lookalikes`

**Status**: NEW

**Purpose**: Find YouTube channels similar to a seed channel using AI-powered keyword extraction and search. This is an expensive operation involving multiple external API calls (Apify scraper, LLM keyword extraction, YouTube channel finder).

**Maps to**: `POST /api/service/youtube/lookalikes` (new service route needed; main route: `POST /youtube/lookalikes`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| channel_url | string | yes | — | YouTube channel URL or handle. Accepts formats: full URL ("https://www.youtube.com/@MrBeast"), handle ("@MrBeast"), or channel ID |
| search_pool_size | integer | no | 50 | How many channels to search before filtering. Range: 10-100 |
| region | string | no | null | Filter by region. ISO 3166-1 alpha-2 code (e.g., "US", "GB", "JP") |
| language | string | no | null | Filter by language. IETF BCP-47 code (e.g., "en", "es", "ja") |

**Returns**: Lookalike search results:
- seed_channel: object — the input channel's details
  - channel_id: string
  - channel_name: string
  - channel_username: string (nullable)
  - channel_url: string
  - subscriber_count: integer
  - total_videos: integer
  - total_views: integer
  - description: string (nullable)
  - location: string (nullable)
  - is_verified: boolean
  - avatar_url: string (nullable)
  - email: string (nullable)
- similar_channels: array — discovered similar channels
  - channel_id: string
  - channel_name: string
  - channel_handle: string (nullable)
  - channel_url: string
  - thumbnail_url: string (nullable)
  - description: string (nullable)
  - country: string (nullable)
  - subscriber_count: integer (nullable)
  - total_views: integer (nullable)
  - keywords: string[] — keywords that matched this channel
  - is_verified: boolean
  - channel_type: string (nullable)
  - email: string (nullable)
- keywords_used: string[] — AI-extracted search keywords
- scraper_run_id: string — Apify scraper run ID
- finder_run_id: string — Apify channel finder run ID

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Invalid channel input | "Invalid YouTube channel. Provide a channel URL, @handle, or channel ID." | 400 |
| Rate limit exceeded | "Service rate limit exceeded. Please try again later." | 429 |
| Service not configured | "YouTube search service is not properly configured." | 503 |
| Channel not found | "Channel not found or invalid URL: {channel_url}" | 404 |
| Generic error | "An unexpected error occurred while searching for similar channels." | 500 |

**Side effects**: Discovered channels are saved to the global creator table via `save_creator_from_youtube()`.

**Slack Formatting Notes**: Agent should present the seed channel first, then a numbered list of similar channels:
```
Seed: MrBeast (27.5M subs, verified)

Similar channels found (12):
1. @Channel1 — 5.2M subs, US — "Entertainment, challenges"
2. @Channel2 — 3.1M subs, UK — "Comedy, reactions"
...

Keywords used: entertainment, challenges, giveaway, reaction
```

**Edge Cases**:
- Seed channel has no public metadata → limited scraper results
- Very small pool size (10) → fewer but faster results
- Very large pool size (100) → more comprehensive but slow (multiple API calls)
- Channel URL with special characters → may need URL encoding
- Region/language filters → applied to similar channel search, not the seed channel

---

## Brand Lookup

### `cheerful_lookup_brand`

**Status**: NEW

**Purpose**: Look up product brand information from a product URL. Uses the Brandfetch service to detect brand name, logo, and icons. Results are cached in the database.

**Maps to**: `POST /api/service/brands/lookup` (new service route needed; main route: `POST /brands/lookup`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product_url | string | yes | — | Product URL to detect brand from (e.g., "https://www.nike.com/t/dunk-low-shoes-12345") |

**Returns**: Brand information (all fields nullable — returns empty object if brand detection fails):
- brand_name: string (nullable) — Detected brand name (e.g., "Nike")
- logo_url: string (nullable) — Full brand logo URL
- symbol_url: string (nullable) — Brand symbol/mark URL
- icon_url: string (nullable) — Brand icon URL

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Note**: This endpoint does NOT throw HTTP errors on lookup failure. If brand detection fails, it returns an empty response (all null fields). The Brandfetch service errors are handled gracefully.

**Slack Formatting Notes**: Agent should present: "Brand detected: {brand_name}" with logo URL if available. If all fields are null: "Could not detect brand from that URL."

**Edge Cases**:
- URL for a small/unknown brand → all fields null (not an error)
- URL is not a product page → may still detect the domain's brand
- Same URL looked up twice → second call returns cached result from DB
- Invalid/unreachable URL → graceful failure, all fields null

---

## Service Routes Summary

All new service routes needed for the integrations domain:

| # | Service Route | HTTP Method | Maps From | Notes |
|---|--------------|-------------|-----------|-------|
| 1 | `/api/service/user/gmail-accounts` | GET | `/user/gmail-accounts` | Read-only |
| 2 | `/api/service/user/connected-accounts` | GET | `/user/connected-accounts` | With filters |
| 3 | `/api/service/smtp-accounts` | GET | `/smtp-accounts` | List |
| 4 | `/api/service/smtp-accounts/{id}` | GET | `/smtp-accounts/{id}` | Get |
| 5 | `/api/service/smtp-accounts` | POST | `/smtp-accounts` | Create |
| 6 | `/api/service/smtp-accounts/{id}` | PATCH | `/smtp-accounts/{id}` | Update |
| 7 | `/api/service/smtp-accounts/{id}` | DELETE | `/smtp-accounts/{id}` | Delete |
| 8 | `/api/service/smtp-accounts/bulk` | POST | `/smtp-accounts/bulk` | Bulk import |
| 9 | `/api/service/integrations/google-sheets/tabs` | GET | `/integrations/google-sheets/tabs` | May use existing unauthenticated endpoint |
| 10 | `/api/service/shopify/workflows/{id}/products` | GET | `/shopify/workflows/{id}/products` | Owner-only |
| 11 | `/api/service/shopify/workflow-executions/{id}/orders` | POST | `/shopify/workflow-executions/{id}/orders` | Owner-only |
| 12 | `/api/service/integrations/instantly/status` | GET | `/integrations/instantly/status` | Self-only |
| 13 | `/api/service/integrations/instantly/connect` | POST | `/integrations/instantly/connect` | Self-only |
| 14 | `/api/service/integrations/instantly/disconnect` | DELETE | `/integrations/instantly/disconnect` | Self-only |
| 15 | `/api/service/integrations/instantly/test` | POST | `/integrations/instantly/test` | Self-only |
| 16 | `/api/service/slack/digest/{campaign_id}` | POST | `/slack/digest/{campaign_id}` | Owner-only |
| 17 | `/api/service/youtube/lookalikes` | POST | `/youtube/lookalikes` | Authenticated |
| 18 | `/api/service/brands/lookup` | POST | `/brands/lookup` | Authenticated |

**Total: 18 new service routes**

---

## Non-CE-Capable Endpoints (Documented for Completeness)

These endpoints exist but CANNOT be implemented as context engine tools:

| Endpoint | Reason |
|----------|--------|
| `GET /api/auth/google/initiate` (webapp) | Requires browser redirect to Google consent screen |
| `GET /api/auth/google/callback` (webapp) | OAuth callback — browser handles response |
| `GET /api/auth/shopify/initiate` (webapp) | Requires browser redirect to Shopify consent screen |
| `GET /api/auth/shopify/callback` (webapp) | OAuth callback — browser handles response |
| `POST /slack/interactions` (webhook) | Incoming webhook from Slack — not user-initiated, uses Slack signature verification |

**Guidance for agent**: When a user asks to connect Gmail or Shopify, the agent should respond: "I can't initiate OAuth connections from Slack. Please visit the webapp at [settings URL] to connect your {Gmail/Shopify} account. Once connected, I can help you manage campaigns using that account."
