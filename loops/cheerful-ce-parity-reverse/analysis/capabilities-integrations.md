# Integrations — Capability Extraction

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| *(none)* | No existing CE tools cover integrations | — |

## Integration Sub-Domains

The integrations domain spans 8 sub-domains: Gmail OAuth, SMTP Account Management, Google Sheets, Shopify/GoAffPro, Instantly (via Composio), Slack Operations, YouTube Lookalike Search, and Brand Lookup.

---

## Sub-Domain 1: Gmail OAuth Account Management

Gmail OAuth lives **entirely in the webapp** (Next.js API routes), not in the backend FastAPI app. The backend only provides read-only listing endpoints. The OAuth flow writes directly to Supabase via the webapp.

### OAuth Flow (Webapp Only — Not Backend Endpoints)

| # | Action | Endpoint | Method | Location | Key Parameters | Returns |
|---|--------|----------|--------|----------|----------------|---------|
| 1 | Initiate Gmail OAuth | `/api/auth/google/initiate` | GET | Webapp API route | query: view, return_to, popup | Redirect to Google consent screen |
| 2 | Handle OAuth callback | `/api/auth/google/callback` | GET | Webapp API route | query: code, state | Upserts `user_gmail_account` row, redirects |

**OAuth Scopes Requested**: `gmail.send`, `gmail.modify`, `gmail.labels`, `userinfo.email`, `userinfo.profile`
**Token Storage**: refresh_token encrypted, stored in `user_gmail_account` table via Supabase client
**Duplicate Handling**: Upsert on `gmail_email` unique constraint

### Backend Endpoints (Read-Only)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 3 | List Gmail accounts | `/user/gmail-accounts` | GET | *(none — user from JWT)* | `list[UserGmailAccountResponse]`: id, gmail_email, sync_in_progress, is_active, created_at |
| 4 | List all connected accounts (Gmail + SMTP unified) | `/user/connected-accounts` | GET | account_type: "gmail" \| "smtp" \| None; active_only: bool (default True) | `list[ConnectedAccountResponse]`: id, email, account_type (AccountType enum: "gmail" \| "smtp"), display_name, is_active |

### Key Findings
- **No Gmail disconnect endpoint exists** — there is no way to remove a Gmail account via API. This is a gap.
- **No Gmail account delete** — once connected, the account stays (can become inactive but no explicit deactivation endpoint)
- **OAuth is webapp-only** — the context engine cannot initiate OAuth flows (requires browser redirect). Tools can only READ Gmail account status.
- **`UserGmailAccountResponse` fields**: id (UUID), gmail_email (str), sync_in_progress (bool), is_active (bool), created_at (datetime). Excludes: refresh_token, last_poll_history_id.
- **`ConnectedAccountResponse` fields**: id (UUID), email (str), account_type (AccountType: "gmail" | "smtp"), display_name (str | None), is_active (bool).
- **`AccountType` enum values**: "gmail", "smtp"

---

## Sub-Domain 2: SMTP Account Management

Full CRUD lifecycle for SMTP/IMAP email accounts, including bulk import with credential verification.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 5 | Create SMTP account | `/smtp-accounts` | POST | body: SmtpAccountCreateRequest — email_address, display_name?, smtp_host, smtp_port (default 587), smtp_username, smtp_password, smtp_use_tls (default true), imap_host, imap_port (default 993), imap_username, imap_password, imap_use_ssl (default true) | SmtpAccountResponse (201) |
| 6 | List SMTP accounts | `/smtp-accounts` | GET | *(none — user from JWT)* | list[SmtpAccountResponse] |
| 7 | Get SMTP account | `/smtp-accounts/{account_id}` | GET | account_id: UUID | SmtpAccountResponse |
| 8 | Update SMTP account | `/smtp-accounts/{account_id}` | PATCH | account_id: UUID; body: SmtpAccountUpdateRequest — all fields optional (email_address, display_name, smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls, imap_host, imap_port, imap_username, imap_password, imap_use_ssl) | SmtpAccountResponse |
| 9 | Delete SMTP account | `/smtp-accounts/{account_id}` | DELETE | account_id: UUID | 204 No Content |
| 10 | Bulk import SMTP accounts | `/smtp-accounts/bulk` | POST | body: BulkSmtpImportRequest — provider: BulkSmtpProvider ("gmail" \| "custom"), accounts: list[BulkSmtpAccountEntry] (1-100 items) | BulkSmtpImportResponse: created (int), skipped (int), errors (int), results: list[BulkSmtpAccountResult] |

### Pydantic Models (Verified from Source)

**SmtpAccountCreateRequest fields**:
- email_address: str (required)
- display_name: str | None (optional, default None)
- smtp_host: str (required)
- smtp_port: int (default 587)
- smtp_username: str (required)
- smtp_password: str (required)
- smtp_use_tls: bool (default True)
- imap_host: str (required)
- imap_port: int (default 993)
- imap_username: str (required)
- imap_password: str (required)
- imap_use_ssl: bool (default True)

**SmtpAccountUpdateRequest fields** (all optional):
- email_address: str | None
- display_name: str | None
- smtp_host: str | None
- smtp_port: int | None
- smtp_username: str | None
- smtp_password: str | None
- smtp_use_tls: bool | None
- imap_host: str | None
- imap_port: int | None
- imap_username: str | None
- imap_password: str | None
- imap_use_ssl: bool | None

**SmtpAccountResponse fields**:
- id: UUID
- email_address: str
- display_name: str | None
- smtp_host: str
- smtp_port: int
- smtp_username: str
- smtp_use_tls: bool
- imap_host: str
- imap_port: int
- imap_username: str
- imap_use_ssl: bool
- is_active: bool
- last_verified_at: datetime | None
- verification_error: str | None
- created_at: datetime
- *(passwords excluded from response)*

**BulkSmtpProvider enum values**: "gmail", "custom"

**BulkSmtpImportRequest validation rules**:
- At least 1 account required
- Maximum 100 accounts per import
- Per account for provider=GMAIL: email_address required, password or smtp_password required
- Per account for provider=CUSTOM: smtp_host, imap_host, and (smtp_password or password) and (imap_password or password) all required

**BulkSmtpAccountResult fields**:
- email_address: str
- status: str — one of "created", "skipped", "error"
- error: str | None
- account_id: UUID | None

**BulkSmtpImportResponse fields**:
- created: int
- skipped: int
- errors: int
- results: list[BulkSmtpAccountResult]

### Error Conditions (from source code)
- 409 Conflict: "SMTP account with this email already exists" (create, when active dupe exists)
- 404 Not Found: "SMTP account not found" (get/update/delete)
- 403 Forbidden: "Not authorized to access/update/delete this SMTP account" (owner mismatch)
- Reactivation: if existing account with same email is inactive, it is reactivated with new credentials instead of error
- Bulk import: IMAP credential verification runs in parallel (max 10 workers) before saving. Failed verifications reported as "error" status per account.
- Bulk IMAP verification errors: "Authentication failed — check your password (Gmail requires an App Password)", timeout, OSError, generic connection failures

### SMTP Account Defaults (Gmail preset)
- smtp_host: "smtp.gmail.com"
- smtp_port: 587
- imap_host: "imap.gmail.com"
- imap_port: 993

---

## Sub-Domain 3: Google Sheets

Single endpoint for reading spreadsheet tab metadata. Uses a **service account** (not per-user OAuth).

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 11 | Get spreadsheet tabs | `/integrations/google-sheets/tabs` | GET | url: str (Google Sheets URL, required) | GoogleSheetTabsResponse: success (bool), sheets: list[GoogleSheetTabResponse] |

### Pydantic Models (Verified from Source)

**GoogleSheetTabResponse fields**:
- sheet_id: int
- title: str
- index: int

**GoogleSheetTabsResponse fields**:
- success: bool
- sheets: list[GoogleSheetTabResponse]

### Error Conditions (from source code)
- 404: "Spreadsheet not found. Please check the URL." (gspread SpreadsheetNotFound)
- 403: "Permission denied. Please share the sheet with the service account." (gspread APIError 403)
- 500: "Failed to fetch spreadsheet tabs." (gspread other APIError)
- 500: "An unexpected error occurred." (generic Exception)

### Key Findings
- This endpoint has **no authentication** — no `Depends(get_current_user)` or `Depends(verify_service_api_key)`. It's public. This appears intentional since it only reads tab names from a shared spreadsheet.
- The spreadsheet must be shared with the service account email for this to work.
- Google Sheets integration at the campaign level is configured via campaign workflow config (stored in campaign draft), not through a dedicated integration endpoint.

---

## Sub-Domain 4: Shopify / GoAffPro

Shopify integration uses GoAffPro as a proxy API. There are two distinct paths: (1) Shopify OAuth for store connection (webapp only), and (2) GoAffPro API for product listing and order creation (backend).

### Shopify OAuth (Webapp Only — Not Backend Endpoints)

| # | Action | Endpoint | Method | Location | Key Parameters | Returns |
|---|--------|----------|--------|----------|----------------|---------|
| 12 | Initiate Shopify OAuth | `/api/auth/shopify/initiate` | GET | Webapp API route | query: shop (store domain) | Redirect to Shopify consent |
| 13 | Handle Shopify callback | `/api/auth/shopify/callback` | GET | Webapp API route | query: shop, code, host | Upserts `user_mcp_shopify` row, redirects |

**Token Storage**: access_token stored in `user_mcp_shopify` table via Supabase (fields: user_email, store_url, access_token, connected)
**Duplicate Handling**: Upsert on `user_email` unique constraint

### GoAffPro Backend Endpoints

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 14 | List Shopify products | `/shopify/workflows/{workflow_id}/products` | GET | workflow_id: UUID (path); limit: int (query, default 10, range 1-100) | ShopifyProductsResponse: products[] |
| 15 | Create Shopify order from execution | `/shopify/workflow-executions/{workflow_execution_id}/orders` | POST | workflow_execution_id: UUID (path) | CreateOrderFromExecutionResponse (201) |

### Pydantic Models (Verified from Source)

**ShopifyProductVariant fields**:
- id: str (Variant GID, e.g. "gid://shopify/ProductVariant/...")
- title: str
- price: str

**ShopifyProduct fields**:
- id: str (Product GID, e.g. "gid://shopify/Product/...")
- title: str
- variants: list[ShopifyProductVariant] (default empty list)

**ShopifyProductsResponse fields**:
- products: list[ShopifyProduct]

**CreateOrderFromExecutionResponse fields**:
- order_id: str (Order GID)
- order_name: str (e.g. "#1002")
- total_amount: str
- currency_code: str (e.g. "USD")
- workflow_execution_id: UUID

### Error Conditions (from source code)
**Get products**:
- 404: "Workflow not found"
- 403: "Not authorized" (campaign.user_id != user_id)
- 400: "Workflow config missing goaffpro_api_key"
- 502: "GoAffPro API error: {error}" (ShopifyProxyError)

**Create order**:
- 404: "Workflow execution not found"
- 400: "Workflow execution status is '{status}', expected 'completed'" (status != "completed")
- 400: "Workflow execution has no output_data"
- 400: "Workflow execution output_data missing required fields: {fields}" (missing email, shipping_address, or line_items)
- 404: "Workflow not found" (parent workflow)
- 403: "Not authorized" (campaign.user_id != user_id)
- 400: "Workflow config missing goaffpro_api_key"
- 502: "GoAffPro API error: {error}" (ShopifyProxyError)
- 400: {"message": "Order creation failed", "errors": [...]} (GraphQL userErrors)

### Key Findings
- GoAffPro API key is stored in workflow config (`workflow.config.get("goaffpro_api_key")`), not in a user-level setting
- Order creation requires a completed workflow execution with output_data containing: email, shipping_address, line_items
- Products are Shopify GraphQL GIDs, not simple numeric IDs

---

## Sub-Domain 5: Instantly (via Composio)

Full connect/disconnect/test lifecycle for Instantly email outreach integration. Uses Composio as the OAuth/credential broker.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 16 | Check Instantly status | `/integrations/instantly/status` | GET | *(none — user from JWT)* | InstantlyConnectionStatus: connected (bool), account_id (str \| None) |
| 17 | Connect Instantly | `/integrations/instantly/connect` | POST | body: api_key (str) | InstantlyConnectResponse: success (bool), message (str), account_id (str \| None) |
| 18 | Disconnect Instantly | `/integrations/instantly/disconnect` | DELETE | *(none — user from JWT)* | InstantlyDisconnectResponse: success (bool), message (str) |
| 19 | Test Instantly connection | `/integrations/instantly/test` | POST | *(none — user from JWT)* | InstantlyTestResponse: success (bool), message (str), campaigns_found (int, default 0) |

### Pydantic Models (Verified from Source)

**InstantlyConnectRequest fields**:
- api_key: str (Instantly API key / Bearer token)

**InstantlyConnectionStatus fields**:
- connected: bool
- account_id: str | None (default None, Composio connected account ID)

**InstantlyConnectResponse fields**:
- success: bool
- message: str
- account_id: str | None (default None)

**InstantlyDisconnectResponse fields**:
- success: bool
- message: str

**InstantlyTestResponse fields**:
- success: bool
- message: str
- campaigns_found: int (default 0)

### Error Conditions (from source code)
**Status**:
- 503: "Composio integration is not configured." (no API key)
- 503: "Instantly auth config is not configured." (no auth config ID)
- 502: "Unable to reach Composio to look up connection status. Please try again later." (RequestException)

**Connect**:
- 503: Composio not configured (same as above)
- 409: "Instantly account is already connected. Disconnect first to reconnect."
- 400: "Invalid Instantly API key. Please check the key and try again." (Instantly API 401)
- 502: "Instantly API returned an error. Please try again later." (Instantly API 5xx)
- 400: "Could not verify the Instantly API key. Please check the key and try again." (other non-200)
- 502: "Could not reach Instantly API. Please try again later." (RequestException)
- 502: "Failed to create connection in Composio: {error}" (Composio SDK error)

**Disconnect**:
- 503: Composio not configured
- 404: "No active Instantly connection found."
- 502: "Failed to disconnect from Composio." (Composio delete error)
- 502: "Failed to disconnect. Please try again." (RequestException)

**Test**:
- 503: Composio not configured
- 404: "No active Instantly connection found. Connect first."
- 502: "Connection test failed: {error}" (Composio tool execution error)

### Key Findings
- Instantly uses user's EMAIL (not user_id) as the entity_id in Composio
- API key validation is done against `https://api.instantly.ai/api/v2/campaigns` before storing
- Test endpoint executes `INSTANTLY_LIST_CAMPAIGNS` Composio tool with limit=5

---

## Sub-Domain 6: Slack Operations

Slack integration is primarily for **Shopify order approval workflows**, not general Slack config. The user-facing endpoint is just digest triggering.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 20 | Trigger Slack order digest | `/slack/digest/{campaign_id}` | POST | campaign_id: UUID (path) | {"ok": true, "workflow_id": str} |
| 21 | Handle Slack interactions (webhook) | `/slack/interactions` | POST | *(Slack webhook payload)* | {"ok": true} or {"response_action": "clear"} |

### Slack Digest Trigger Details
- Requires campaign ownership (campaign.user_id == user_id)
- Requires campaign.slack_channel_id to be set
- Starts a Temporal workflow `SlackOrderDigestWorkflow` with params: campaign_id, slack_channel_id, campaign_name

### Error Conditions (from source code)
**Trigger digest**:
- 404: "Campaign not found"
- 403: "Not authorized" (campaign.user_id != user_id)
- 400: "Campaign has no Slack channel configured" (no slack_channel_id)

**Interactions webhook**:
- 403: "Invalid Slack signature" (HMAC verification failure)

### Key Findings
- Slack interactions webhook handles 3 action types: `approve_order_`, `skip_order_`, `edit_order_`
- Order approval creates a Shopify order via GoAffPro, updates campaign_creator.slack_approval_status and gifting_status
- `slack_approval_status` values used: "pending", "processing", "approved", "skipped"
- The webhook is NOT user-authenticated (uses Slack signature verification instead)
- The Slack channel is configured per-campaign (campaign.slack_channel_id field)

---

## Sub-Domain 7: YouTube Lookalike Search

AI-powered creator discovery that finds similar YouTube channels. This is more of a "search/discovery" integration than a traditional connection.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 22 | Find YouTube lookalikes | `/youtube/lookalikes` | POST | body: channel_url (str, required), search_pool_size (int, 10-100, default 50), region (str \| None), language (str \| None) | YouTubeLookalikeResponse |

### Pydantic Models (Verified from Source)

**YouTubeLookalikeRequest fields**:
- channel_url: str (YouTube channel URL or handle, e.g. "https://www.youtube.com/@MrBeast" or "@MrBeast")
- search_pool_size: int (default 50, range 10-100, "How many channels to search before filtering")
- region: str | None (ISO 3166-1 alpha-2, e.g. "US")
- language: str | None (IETF BCP-47, e.g. "en")

**YouTubeSeedChannelResponse fields**:
- channel_id: str
- channel_name: str
- channel_username: str | None
- channel_url: str
- subscriber_count: int
- total_videos: int
- total_views: int
- description: str | None
- location: str | None
- is_verified: bool
- avatar_url: str | None
- email: str | None (default None)

**YouTubeSimilarChannelResponse fields**:
- channel_id: str
- channel_name: str
- channel_handle: str | None
- channel_url: str
- thumbnail_url: str | None
- description: str | None
- country: str | None
- subscriber_count: int | None
- total_views: int | None
- keywords: list[str]
- is_verified: bool
- channel_type: str | None
- email: str | None (default None)

**YouTubeLookalikeResponse fields**:
- seed_channel: YouTubeSeedChannelResponse
- similar_channels: list[YouTubeSimilarChannelResponse]
- keywords_used: list[str]
- scraper_run_id: str
- finder_run_id: str

### Error Conditions (from source code)
- 400: "Invalid YouTube channel. Provide a channel URL, @handle, or channel ID."
- 429: "Service rate limit exceeded. Please try again later." (rate limit/quota in error)
- 503: "YouTube search service is not properly configured." (unauthorized/forbidden in error)
- 404: "Channel not found or invalid URL: {channel_url}" (not found/invalid in error)
- 500: "An unexpected error occurred while searching for similar channels." (generic)

### Key Findings
- Uses Apify YouTube scraper service
- AI (LLM) used to extract search keywords from seed channel
- Discovered channels are saved to global creator table via `save_creator_from_youtube()`
- This is an expensive operation (multiple external API calls) — not a quick lookup

---

## Sub-Domain 8: Brand Lookup

Product brand detection for campaign product URLs.

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 23 | Lookup brand from product URL | `/brands/lookup` | POST | body: product_url (str) | BrandLookupResponse |

### Pydantic Models (Verified from Source, defined inline in route file)

**BrandLookupRequest fields**:
- product_url: str

**BrandLookupResponse fields**:
- brand_name: str | None (default None)
- logo_url: str | None (default None)
- symbol_url: str | None (default None)
- icon_url: str | None (default None)

### Error Conditions
- Graceful: if brand lookup fails, returns empty BrandLookupResponse (all None fields). No HTTP errors thrown.
- Uses Brandfetch service under the hood
- Creates/caches brand record in DB on first lookup

---

## Summary Statistics

| Sub-Domain | Endpoint Count | Existing CE Tools | Notes |
|------------|---------------|-------------------|-------|
| Gmail OAuth Account Mgmt | 4 (2 webapp + 2 backend) | 0 | OAuth is webapp-only; CE can only list accounts |
| SMTP Account Mgmt | 6 | 0 | Full CRUD + bulk import |
| Google Sheets | 1 | 0 | No auth required; service account based |
| Shopify / GoAffPro | 4 (2 webapp + 2 backend) | 0 | OAuth is webapp-only; backend has product/order |
| Instantly (Composio) | 4 | 0 | Full connect/disconnect/test lifecycle |
| Slack Operations | 2 (1 user-facing, 1 webhook) | 0 | Primarily order approval webhook |
| YouTube Lookalike | 1 | 0 | AI-powered discovery |
| Brand Lookup | 1 | 0 | Graceful brand detection |
| **TOTAL** | **23** | **0** | |

## Context Engine Tool Candidates

Not all endpoints should become CE tools. OAuth flows (Gmail, Shopify) require browser redirects and cannot be performed via Slack. The CE should focus on:

**High-value CE tools (can be fully executed via Slack):**
1. List Gmail accounts → read integration status
2. List connected accounts (unified Gmail + SMTP) → read integration status
3. SMTP account CRUD (create, list, get, update, delete) → manage email sending accounts
4. SMTP bulk import → set up multiple email accounts at once
5. Google Sheets tabs → validate sheet URLs during campaign setup
6. Shopify product listing → browse products for gifting campaigns
7. Shopify order creation → create orders from completed workflow executions
8. Instantly status/connect/disconnect/test → manage Instantly integration
9. Slack digest trigger → trigger order digest for a campaign
10. YouTube lookalike search → find similar creators
11. Brand lookup → look up product brand

**Not suitable as CE tools:**
- Gmail OAuth initiate/callback (requires browser redirect)
- Shopify OAuth initiate/callback (requires browser redirect)
- Slack interactions webhook (incoming from Slack, not user-initiated)

**Potential new service routes needed:**
- Gmail account disconnect/deactivate (doesn't exist anywhere currently)
- Shopify connection status check (currently only in webapp via `user_mcp_shopify` table)

## Cross-Domain Notes

- YouTube lookalike search overlaps with the **search-and-discovery** domain (w1-search aspect). Should be documented in both places but defined as a tool in one.
- Brand lookup overlaps with the **campaigns** domain (used during campaign product setup). Should be documented in integrations since it's an external service call.
- SMTP accounts are tightly coupled with the **email** domain (sending capability), but management belongs in integrations.
- Slack channel configuration per-campaign is part of the **campaigns** domain (campaign.slack_channel_id field), not integrations.
