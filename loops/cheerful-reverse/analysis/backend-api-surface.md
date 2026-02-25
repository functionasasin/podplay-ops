# Backend API Surface Analysis

**Source files:** `apps/backend/src/api/route/` (26 route files), `apps/backend/src/api/router.py`, `apps/backend/src/models/api/`

---

## Authentication & Authorization

**File:** `src/api/dependencies/auth.py`

- **Mechanism:** Supabase JWT tokens (HS256 or ES256 algorithms)
- **Dependencies:**
  - `get_current_user()` — Required auth, extracts `{user_id, email, role, payload}` from Bearer token
  - `get_optional_user()` — Optional auth, returns user dict or None (used for public endpoints)
  - `verify_service_api_key` — Service-to-service auth via `X-Service-Api-Key` header
- **Dev feature:** Impersonation via `x-impersonate-user` header (dev only)
- **Team access control:** `CampaignMemberAssignmentRepository` checks confirm users can only see assigned campaigns

---

## Endpoint Catalog by Domain

### 1. Campaigns — CRUD & Configuration

**File:** `src/api/route/campaign.py` (102KB — largest route file)

**Purpose:** Campaign is the central organizational unit. Every outreach effort is a campaign. This file manages the full campaign lifecycle configuration — creating, updating, linking products/senders/recipients, and inspecting the outbox queue.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/campaigns/` | Required | Create campaign (name, type, product_ids, senders) |
| GET | `/campaigns/` | Required | List campaigns (paginated); Query: `limit`, `offset`, `status` |
| GET | `/campaigns/{campaign_id}` | Required | Get campaign details |
| PATCH | `/campaigns/{campaign_id}` | Required | Update name/description/status/slack_channel_id |
| DELETE | `/campaigns/{campaign_id}` | Required | Delete campaign |
| GET | `/campaigns/{campaign_id}/products` | Required | List linked products |
| POST | `/campaigns/{campaign_id}/products` | Required | Add products; Body: `{product_ids[]}` |
| DELETE | `/campaigns/{campaign_id}/products/{product_id}` | Required | Unlink product |
| GET | `/campaigns/{campaign_id}/senders` | Required | List sender email accounts |
| POST | `/campaigns/{campaign_id}/senders` | Required | Add sender (gmail_account_id or smtp_account_id) |
| PATCH | `/campaigns/{campaign_id}/senders/{sender_id}` | Required | Update from_name, reply_to |
| DELETE | `/campaigns/{campaign_id}/senders/{sender_id}` | Required | Remove sender |
| GET | `/campaigns/{campaign_id}/signatures` | Required | List signatures |
| PATCH | `/campaigns/{campaign_id}/signatures/{signature_id}` | Required | Set is_default |
| GET | `/campaigns/{campaign_id}/recipients` | Required | List recipients (paginated) |
| POST | `/campaigns/{campaign_id}/recipients/bulk-upsert` | Required | Bulk upsert recipients array |
| POST | `/campaigns/{campaign_id}/recipients/from-csv` | Required | Upload CSV; Form: `file` |
| GET | `/campaigns/{campaign_id}/recipients/from-sheet` | Required | Validate Google Sheet tabs; Query: `url` |
| GET | `/campaigns/{campaign_id}/recipients/validate-sheet` | Required | Validate sheet structure; Query: `url, tab_name` |
| GET | `/campaigns/{campaign_id}/outbox` | Required | List outbox queue; Query: `limit, offset, status` |
| POST | `/campaigns/{campaign_id}/outbox/populate` | Required | Manually populate queue; Body: `{account_ids[]}` |
| GET | `/campaigns/{campaign_id}/signatures-list` | Required | Available signatures |
| GET | `/campaigns/{campaign_id}/merge-tags` | Required | Available merge tags |
| POST | `/campaigns/{campaign_id}/client-summary` | Required | Generate client summary; Body: `{selected_fields[]}` |
| GET | `/campaigns/{campaign_id}/creators` | Required | List creators (paginated); Query: `limit, offset, enrichment_status` |
| GET | `/campaigns/{campaign_id}/creators/enrichment-status` | Required | Lightweight poll — pending/enriching only |

**Key Response Models:**
- `CampaignResponse`: id, name, campaign_type, status, user_id, product_ids, senders[], created_at, updated_at
- `CampaignRecipientResponse`: email, name, phone, job_title, company, location, notes
- `CampaignSenderDetailResponse`: id, account_id, account_type, from_name, reply_to, created_at

---

### 2. Campaign Launch

**File:** `src/api/route/campaign_launch.py` (47KB)

**Purpose:** Executes a campaign — takes configured recipients/senders/templates and fires off Temporal workflows that actually send outreach emails. Also handles the "draft" concept for saving wizard state mid-configuration.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/campaigns/draft` | Required | Save campaign wizard draft state |
| GET | `/campaigns/draft/{draft_id}` | Required | Retrieve saved draft |
| POST | `/campaigns/{campaign_id}/launch` | Required | Launch campaign → triggers Temporal workflow |

**Launch Request Fields (`CampaignLaunchRequest`):**
- `campaign_type`: "gifting" | "paid" | "sales" | "creator"
- `recipient_data[]`: email, name, phone, job_title, company
- `sender_accounts[]`: list of email addresses to send from
- `is_external`: bool (external campaigns use different flow)
- `product_name`, `product_description`, `product_url`
- `initial_email_body`, `initial_email_subject`
- `signature_id` (optional)
- `follow_up_templates[]` (optional — drives follow-up scheduling)

**Response (`CampaignLaunchResponse`):** status, workflow_id (Temporal workflow handle)

---

### 3. Campaign Workflows (AI Workflow Composition)

**File:** `src/api/route/campaign_workflow.py` (8KB)

**Purpose:** Campaign workflows are AI-powered automation rules attached to campaigns. Users compose workflows from a toolbox of available "tools" (e.g., "check for posts", "create Shopify order"). Workflows execute against thread state when triggered.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/campaigns/{campaign_id}/workflows` | Required | Create workflow |
| GET | `/v1/campaigns/{campaign_id}/workflows` | Required | List workflows |
| GET | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Required | Get workflow |
| PATCH | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Required | Update workflow |
| DELETE | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Required | Delete workflow |

**Workflow Fields:** name, instructions, tool_slugs[], config, output_schema, is_enabled

---

### 4. Campaign Workflow Executions

**File:** `src/api/route/campaign_workflow_execution.py` (4KB)

**Purpose:** View execution history and results for AI workflows — used for auditing what the automation did and for Slack approval flows.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | Required | List execution history |
| GET | `/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | Required | Get latest execution result for a thread |

**Response (`CampaignWorkflowExecutionResponse`):** workflow_id, executed_at, status, output_data

---

### 5. Campaign Enrichment (Email Discovery)

**File:** `src/api/route/campaign_enrichment.py` (9KB)

**Purpose:** Creators often don't have email addresses. Enrichment discovers their email via external APIs (Influencer Club, Apify). This enables adding creators to a campaign even when email is unknown — the system finds it asynchronously.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/campaigns/{campaign_id}/creators/enrichment-status` | Required | Poll enrichment status (lightweight) |
| POST | `/v1/campaigns/{campaign_id}/creators/{creator_id}/override-email` | Required | Manually set email + queue if campaign active |
| POST | `/v1/enrich-creators` | Required | Start standalone enrichment Temporal workflow |
| GET | `/v1/enrich-creators/{workflow_id}/status` | Required | Poll standalone enrichment status |

**Override Email Request:** `{email}` (regex validated email string)
**Override Email Response:** creator_id, email, queued (bool — true if immediately added to outbox)

---

### 6. Email Threads & Gmail Messages

**File:** `src/api/route/gmail_message.py` (33KB)

**Purpose:** The inbox — the primary UI for operators managing outreach. Shows all email threads across campaigns, with filtering, search, and flagging. This is where campaign work actually happens day-to-day.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/threads/` | Required | List threads with advanced filtering |
| GET | `/threads/{gmail_thread_id}` | Required | Get thread with all messages |
| GET | `/threads/{gmail_thread_id}/summary` | Required | AI-generated thread summary |
| PATCH | `/threads/{gmail_thread_id}/flags` | Required | Update thread flags (opted_in, follow_up, etc.) |
| POST | `/threads/{gmail_thread_id}/hide` | Required | Hide/archive thread |

**List Threads Query Params:**
- `status_filter[]`: GmailThreadStatus enum values
- `direction_filter`: "INBOUND" | "OUTBOUND"
- `campaign_id`, `campaign_ids[]`
- `gmail_account_ids[]`
- `show_hidden` (bool), `include_messages` (bool), `include_uncategorized`, `only_uncategorized`
- `limit`, `offset`, `search` (full-text: sender, recipient, subject)

**Response:** `ThreadWithMessages` (when include_messages=true) or `ThreadSummary`

---

### 7. Drafts (Outgoing Reply Drafts)

**File:** `src/api/route/draft.py` (8KB)

**Purpose:** When operators are about to reply to an influencer, they draft responses. Drafts can be AI-generated (LLM) or human-edited. The UI needs to handle race conditions where the LLM may update the draft concurrently.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/threads/{gmail_thread_id}/draft` | Required | Get latest draft (human or LLM) |
| POST | `/threads/{gmail_thread_id}/draft` | Required | Create/upsert UI draft |
| PUT | `/threads/{gmail_thread_id}/draft` | Required | Update UI draft (merge, partial fields OK) |

**Draft Response:** content, source ("human" | "llm"), version_id
**Race Condition Handling:** POST/PUT returns 409 when version mismatch detected; body includes `latest_gmail_thread_state_id`

---

### 8. Email Sending

**File:** `src/api/route/email.py` (9KB)

**Purpose:** Direct email sending endpoint — used when operator clicks "Send" in the inbox. Abstracts over Gmail API vs SMTP so the frontend sends to one endpoint regardless of which account type is used.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/emails/send` | Required | Send email (Gmail or SMTP, determined by account_email) |

**Send Email Request:**
- `account_email`: Which sending account to use
- `to[]`: recipient emails
- `cc[]`, `subject`, `body_html` or `body_text`
- `thread_id`, `in_reply_to`, `references` (Gmail threading headers, optional)
- `gmail_thread_state_id` or `smtp_thread_state_id` (for reply context)

**Response:** message_id, thread_id, sent_at

---

### 9. Scheduled Email Dispatch

**File:** `src/api/route/email_dispatch.py` (9KB)

**Purpose:** Lets operators schedule emails for future delivery — important for timezone-appropriate outreach (e.g., "send this Monday morning their time").

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/emails/scheduled` | Required | Schedule email for future |
| GET | `/emails/scheduled` | Required | List pending scheduled emails |
| DELETE | `/emails/scheduled/{dispatch_id}` | Required | Cancel scheduled email |
| PATCH | `/emails/scheduled/{dispatch_id}/reschedule` | Required | Change send time |

**Schedule Request:**
- `gmail_account_id` or `smtp_account_id` (exactly one)
- `recipient_email`, `subject`, `body_text` or `body_html`
- `dispatch_at` (timezone-aware datetime, must be future)
- `user_timezone` (IANA timezone string)

**409 returned** when status changed between check and update (race condition safety)

---

### 10. Email Signatures

**File:** `src/api/route/email_signature.py` (10KB)

**Purpose:** Manages email signatures. Signatures can be user-level (default for all campaigns) or campaign-specific (override for a particular campaign). Enables brand-consistent signatures across outreach.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/email-signatures` | Required | List signatures (user + campaign-specific) |
| GET | `/email-signatures/for-reply` | Required | Get signatures for reply dropdown |
| POST | `/email-signatures` | Required | Create signature |
| GET | `/email-signatures/{signature_id}` | Required | Get signature |
| PATCH | `/email-signatures/{signature_id}` | Required | Update |
| DELETE | `/email-signatures/{signature_id}` | Required | Delete |

**Create/Update Fields:** name, content (HTML, max 10,000 chars), is_default, is_enabled, campaign_id (optional)

---

### 11. SMTP Account Management

**File:** `src/api/route/smtp_account.py` (22KB)

**Purpose:** Supports non-Gmail senders. Brands may use Outlook, custom SMTP servers, etc. IMAP is also configured for inbox monitoring. Supports bulk import for teams setting up many accounts at once.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/smtp-accounts` | Required | Create with IMAP verification |
| GET | `/v1/smtp-accounts` | Required | List accounts |
| GET | `/v1/smtp-accounts/{account_id}` | Required | Get account details |
| PATCH | `/v1/smtp-accounts/{account_id}` | Required | Update |
| DELETE | `/v1/smtp-accounts/{account_id}` | Required | Soft-delete |
| POST | `/v1/smtp-accounts/bulk-import` | Required | Bulk import (parallel IMAP verification) |

**SMTP Account Fields:** email_address, display_name, smtp_host, smtp_port, smtp_username, smtp_password, smtp_use_tls, imap_host, imap_port, imap_username, imap_password, imap_use_ssl

---

### 12. User Settings & Gmail Accounts

**File:** `src/api/route/user.py` (5KB)

**Purpose:** Per-user settings and connected account management. Shows which Gmail accounts are connected (read-only — refresh tokens never exposed to API).

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/user/settings` | Required | Get user settings (creates defaults if needed) |
| PUT | `/user/settings` | Required | Update user settings |
| GET | `/user/gmail-accounts` | Required | List Gmail accounts (no refresh tokens) |
| GET | `/user/connected-accounts` | Required | List all accounts (Gmail + SMTP unified) |

**Connected Accounts Query:** `account_type` ("gmail" | "smtp" | null), `active_only` (bool, default true)
**Response (`ConnectedAccountResponse`):** id, email, account_type, display_name, is_active

---

### 13. Creator Search & Discovery

**File:** `src/api/route/creator_search.py` (16KB)

**Purpose:** Discover new influencers. Brands find creators by lookalike search (find similar to known creator) or keyword search. Results are returned from Influencer Club API, with caching for profiles.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/creator-search/similar` | Required | Lookalike search via Influencer Club API |
| POST | `/v1/creator-search/keyword` | Required | Keyword search |
| POST | `/v1/creator-search/enrich` | Required | Enrich single creator (email + full profile) |
| POST | `/v1/creator-search/profile` | Required | Get full profile (Apify + 24h cache) |

**Similar Search Request:** handle, platform, search_pool_size (10-100), region, language (ISO), page, followers (min/max), engagement_rate (min/max)

**Keyword Search Request:** keyword, platform, page, limit (10 default), followers (min/max), engagement_rate (min/max), sort_by, sort_order

**Profile Fetch Request:** handle, platform, refresh (bypass 24h cache)
**Profile Response source field:** "cache" | "stale_cache" | "apify" | "influencer_club"

---

### 14. Creator Profiles (Public Pages)

**File:** `src/api/route/creator_profile.py` (8KB)

**Purpose:** Publicly-accessible scraped profiles — can be shared with clients or embedded. No auth required so brand stakeholders can view without accounts.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/creators/profiles/` | None | List scraped profiles (paginated) |
| GET | `/v1/creators/profiles/{handle}` | None | Get profile by Instagram handle |
| POST | `/v1/creators/profiles/scrape` | None | Trigger profile scrape (async, 202 Accepted) |

**Response (`CreatorProfileDetail`):** profile, metrics, sponsorships, content, scrape_metadata, execution_id, scraped_at

---

### 15. Creator Lists

**File:** `src/api/route/creator_list.py` (22KB)

**Purpose:** Organize discovered creators into lists before adding to campaigns. Lists are staging areas — brand managers curate lists from search results, then add selected creators to campaigns.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/lists/` | Required | List creator lists with counts |
| POST | `/v1/lists/` | Required | Create list |
| GET | `/v1/lists/{list_id}` | Required | Get list details |
| PATCH | `/v1/lists/{list_id}` | Required | Update (rename) |
| DELETE | `/v1/lists/{list_id}` | Required | Delete list |
| GET | `/v1/lists/{list_id}/creators` | Required | List creators in list (paginated) |
| POST | `/v1/lists/{list_id}/creators` | Required | Add creators by ID |
| POST | `/v1/lists/{list_id}/creators/from-search` | Required | Add from search results (store images) |
| POST | `/v1/lists/{list_id}/creators/from-csv` | Required | Add from CSV upload |
| DELETE | `/v1/lists/{list_id}/creators/{creator_id}` | Required | Remove creator from list |
| POST | `/v1/lists/{list_id}/add-to-campaign` | Required | Move creators to campaign (triggers enrichment) |

**Creator Data in Search Results:** platform, handle, email, follower_count, is_verified, avatar_url, profile_url, name

---

### 16. Creator Posts (Content Tracking)

**File:** `src/api/route/creator_post.py` (8KB)

**Purpose:** After creators post sponsored content, operators need to verify. This tracks posts per creator per campaign, with manual refresh capability.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/campaigns/{campaign_id}/creators/{creator_id}/posts` | Required | Get posts with tracking info |
| POST | `/v1/campaigns/{campaign_id}/creators/{creator_id}/refresh-posts` | Required | Refresh posts (synchronous scrape) |
| DELETE | `/v1/campaigns/{campaign_id}/posts/{post_id}` | Required | Delete post (false positive) |

**Response (`CreatorPostsResponse`):** posts[], total, last_checked_at, tracking_ends_at

---

### 17. YouTube Lookalike Search

**File:** `src/api/route/youtube.py` (9KB)

**Purpose:** Find YouTube channels similar to a seed channel. Uses Apify scrapers for channel data, then Influencer Club for similarity matching.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/youtube/lookalikes` | Required | Find similar YouTube channels |

**Request:** channel_url (URL/@handle/channel ID), search_pool_size (10-100, default 50), region, language (ISO optional)
**Response (`YouTubeLookalikeResponse`):** seed_channel, similar_channels[], keywords_used, scraper_run_id, finder_run_id

---

### 18. Shopify Integration

**File:** `src/api/route/shopify.py` (11KB)

**Purpose:** For gifting campaigns — after a creator opts in, an order is created in Shopify to ship product to them. Can be triggered automatically via Slack approval or manually.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/shopify/workflows/{workflow_id}/products` | Required | Get products from Shopify via GoAffPro |
| POST | `/v1/shopify/workflow-executions/{workflow_execution_id}/orders` | Required | Create Shopify order from workflow output |

**Create Order Request:** Requires completed workflow execution; reads email, shipping_address, line_items[], phone from execution's output_data
**Response (`CreateOrderFromExecutionResponse`):** order_id, order_name, total_amount, currency_code

---

### 19. Google Sheets Integration

**File:** `src/api/route/google_sheets.py` (2KB)

**Purpose:** Import recipient lists from Google Sheets. First validates the sheet structure (tabs, columns).

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/integrations/google-sheets/tabs` | None | Get available tabs from Google Sheet URL |

**Query:** `url` (Google Sheets URL)
**Response (`GoogleSheetTabsResponse`):** sheets[] (name, id)

---

### 20. Products

**File:** `src/api/route/product.py` (3KB)

**Purpose:** Products represent what brands are promoting. A campaign links to one or more products, which feeds AI prompts for email generation.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/products/` | Required | Create product |
| GET | `/products/` | Required | List user's products |
| GET | `/products/{product_id}` | Required | Get product |

**Create Product Request:** name, description, url_to_scrape
**DB Constraint:** Unique (user_id, name)

---

### 21. Slack Integration

**File:** `src/api/route/slack.py` (20KB)

**Purpose:** Slack is used for campaign notifications and approvals. When AI workflows detect a creator who's opted in and is ready for an order, a Slack message is sent with approval/edit/skip buttons. Operators approve from Slack.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/slack/interactions` | Signature | Webhook: button clicks & modal submissions |
| POST | `/slack/digest/{campaign_id}` | Required | Manually trigger Slack order digest |

**Slack Auth:** `X-Slack-Request-Timestamp` + `X-Slack-Signature` (HMAC-SHA256) — standard Slack verification
**Action Handlers:**
- `approve_order_*` → Create Shopify order (async background task)
- `edit_order_*` → Open modal to edit order details (address, items)
- `skip_order_*` → Mark creator as skipped
- `view_submission` → Handle modal form submit, update execution output_data

---

### 22. Bulk Draft Editing

**File:** `src/api/route/bulk_draft_edit.py` (3KB)

**Purpose:** Saves time when many threads need similar edits (e.g., "update the product description in all pending drafts"). Triggers a Temporal workflow that edits all matching drafts at once.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/bulk-draft-edit` | Required | Start bulk draft edit workflow |

**Request:** campaign_id, edit_instruction, exclude_thread_ids[], save_as_rule (bool), rule_text (optional)
**Response:** workflow_id, message

---

### 23. Tools (Workflow Toolbox)

**File:** `src/api/route/tools.py` (1KB)

**Purpose:** Discovery endpoint for AI workflow composition. Returns available "tools" that can be composed into campaign workflows.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/tools` | Required | List available workflow tools |

**Response:** ToolInfo[] with slug, description

---

### 24. Teams & Campaign Assignment

**File:** `src/api/route/team.py` (21KB)

**Purpose:** Multi-user teams where different operators are assigned to specific campaigns. Enables agencies with multiple team members to divide campaign work.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/v1/teams/my-assignments` | Required | Campaigns assigned to current user |
| GET | `/v1/teams/` | Required | List teams current user belongs to |
| POST | `/v1/teams/` | Required | Create team |
| DELETE | `/v1/teams/{team_id}` | Required | Delete team (owner only) |
| GET | `/v1/teams/{team_id}` | Required | Get team with members |
| GET | `/v1/teams/{team_id}/members` | Required | List team members |
| POST | `/v1/teams/{team_id}/members` | Required | Add member |
| DELETE | `/v1/teams/{team_id}/members/{member_id}` | Required | Remove member |
| GET | `/v1/teams/{team_id}/campaigns` | Required | List assigned campaigns |
| POST | `/v1/teams/{team_id}/campaigns` | Required | Assign campaign to member |
| POST | `/v1/teams/{team_id}/campaigns/bulk` | Required | Bulk assign campaigns |

**Bulk Assignment Body:** assignments[] with campaign_id, user_id pairs

---

### 25. Dashboard Analytics

**File:** `src/api/route/dashboard.py` (26KB)

**Purpose:** At-a-glance campaign performance. Brand managers need to see opt-in rates, reply rates, and pipeline status without drilling into individual campaigns.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/dashboard/analytics` | Required | Comprehensive dashboard metrics |

**Query:** `recent_optins_days` (1-30, default 7)
**Response (`DashboardAnalyticsResponse`):**
- Campaign counts: active, paused, draft, completed
- Opt-in stats: total_opted_in, total_opted_out, total_new, total_contacts, opt_in_rate %
- Recent opt-ins (configurable window)
- Per-campaign stats array
- Email stats: sent, opened, replied
- Follow-up stats
- Gifting & Paid Promotion pipeline metrics

---

### 26. Service-to-Service API (Internal)

**File:** `src/api/route/service.py` (11KB)

**Purpose:** Internal API used by the context engine / Claude agent. Exposes data retrieval endpoints not available to frontend — semantic search, full thread data, creator summaries. Protected by API key, not JWT.

**Auth:** `X-Service-Api-Key` header (not JWT)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/service/campaigns` | API Key | List active/paused campaigns for user |
| GET | `/service/threads/search` | API Key | Full-text search across email threads |
| GET | `/service/threads/{gmail_thread_id}` | API Key | Full thread with all messages |
| GET | `/service/rag/similar` | API Key | Semantic similarity search (pgvector) |
| GET | `/service/campaigns/{campaign_id}/creators` | API Key | List creators (paginated + filters) |
| GET | `/service/campaigns/{campaign_id}/creators/{creator_id}` | API Key | Creator detail |
| GET | `/service/creators/search` | API Key | Search creators across campaigns |

**Query Params:** `user_id` (required UUID), `campaign_id`, `query`, `limit`, `offset`, `gifting_status`, `role`

---

## Cross-Cutting Patterns

### Auth Tiers
1. **JWT (Supabase)** — Primary user auth for all `/campaigns/`, `/threads/`, `/email-*`, `/user/`, `/v1/` routes
2. **API Key** — Service-to-service for `/service/` routes (context engine, internal tools)
3. **Slack Signature** — HMAC-SHA256 verification for `/slack/interactions`
4. **No auth** — Public routes: `/v1/creators/profiles/`, `/v1/integrations/google-sheets/tabs`

### Pagination
- Standard: `limit` (1-100, default 50), `offset` (default 0)
- Response wrapper: `{items: [], total: N}` or `{results: [], total: N}`

### Error Status Codes
| Code | When |
|------|------|
| 401 | Missing/invalid JWT |
| 403 | Ownership/permission failure |
| 404 | Resource not found (or user has no access — same response to prevent enumeration) |
| 409 | Conflict: unique constraint, version mismatch, race condition |
| 502/503 | External service errors (Shopify, YouTube, Influencer Club) |

### Async Operations Pattern
| Operation | Mechanism |
|-----------|-----------|
| Campaign launch | Temporal workflow (handle returned) |
| Creator enrichment | Temporal workflow + polling endpoint |
| Post refresh | Synchronous (blocks request) |
| Bulk draft edit | Temporal workflow |
| Creator profile scrape | Background task (202 Accepted, no polling needed) |

### Race Condition Handling
- Draft endpoint: 409 with `version_mismatch` body including `latest_gmail_thread_state_id`
- Scheduled email: 409 when status changed between check and cancel/reschedule

### External Integration Mapping
| Service | Route Files | Purpose |
|---------|-------------|---------|
| Gmail API | `email.py`, `gmail_message.py` | Send + read Gmail |
| SMTP/IMAP | `smtp_account.py`, `email.py` | Non-Gmail senders |
| Shopify/GoAffPro | `shopify.py`, `slack.py` | Order creation for gifting |
| YouTube (Apify) | `youtube.py` | Channel lookalike search |
| Instagram (Apify) | `creator_search.py`, `creator_profile.py`, `creator_post.py` | Profile scraping + posts |
| Influencer Club | `creator_search.py`, `youtube.py` | Creator database + lookalike |
| Google Sheets | `google_sheets.py`, `campaign.py` | Recipient list import |
| Slack | `slack.py` | Approval workflows |
| PostHog | (analytics, internal) | Product analytics |

---

## File Size Reference

```
campaign.py                  102KB  — Main campaign CRUD (largest)
campaign_launch.py            47KB  — Launch execution
dashboard.py                  26KB  — Analytics aggregation
gmail_message.py              33KB  — Thread inbox
creator_search.py             16KB  — Influencer Club search
team.py                       21KB  — Team management
smtp_account.py               22KB  — SMTP management
creator_list.py               22KB  — List management
slack.py                      20KB  — Slack webhooks
campaign_enrichment.py         9KB  — Email enrichment
email_dispatch.py              9KB  — Scheduled send
email_signature.py            10KB  — Signatures
shopify.py                    11KB  — Shopify orders
service.py                    11KB  — Internal API
creator_profile.py             8KB  — Public profiles
draft.py                       8KB  — Draft management
creator_post.py                8KB  — Post tracking
email.py                       9KB  — Email sending
campaign_workflow.py           8KB  — Workflow CRUD
youtube.py                     9KB  — YouTube search
user.py                        5KB  — User settings
campaign_workflow_execution.py 4KB  — Execution history
product.py                     3KB  — Product management
bulk_draft_edit.py             3KB  — Bulk operations
google_sheets.py               2KB  — Sheet integration
tools.py                       1KB  — Tool discovery
service.py                    11KB  — Internal service API
```

---

## Total Endpoint Count

~110 endpoints across 26 route files, organized into 26 functional domains.
