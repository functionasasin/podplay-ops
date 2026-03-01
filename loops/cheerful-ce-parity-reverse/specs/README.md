# Context Engine Tool Specifications — Master Index

## Summary

| Metric | Value |
|--------|-------|
| **Total unique tools** | 126 |
| **Existing tools (7 CE tools, 7 needing fixes)** | 7 |
| **New tools (need implementation)** | 119 |
| **New backend service routes required** | ~90+ |
| **Frontend actions covered** | 175+ (100% of backend-accessible actions) |
| **Webapp-only actions (N/A for CE)** | ~25 |

All tools are **user-scoped** — `user_id` is injected via `RequestContext`, never a tool parameter. See `specs/shared-conventions.md` Section 1 for the full auth model.

---

## Spec Files

| File | Domain | Tools | Waves |
|------|--------|-------|-------|
| [`campaigns.md`](campaigns.md) | Campaign CRUD, wizard, recipients, senders, outbox, signatures, merge tags, products, enrichment | 31 | W3 complete |
| [`email.md`](email.md) | Thread listing, drafts, sending, scheduling, signatures, bulk edit, AI | 24 | W3 complete |
| [`creators.md`](creators.md) | Creator listing, enrichment, IC search, creator lists, posts, public profiles | 27 | W3 complete |
| [`integrations.md`](integrations.md) | Gmail, SMTP, Google Sheets, Shopify, Instantly, Slack, YouTube, Brand | 18 | W3 complete |
| [`users-and-team.md`](users-and-team.md) | User settings, team management, campaign assignments, onboarding | 13 | W3 complete |
| [`analytics.md`](analytics.md) | Dashboard analytics | 1 | W3 complete |
| [`search-and-discovery.md`](search-and-discovery.md) | Lookalike suggestion management | 4 | W3 complete |
| [`workflows.md`](workflows.md) | Workflow CRUD, execution history, tool discovery | 8 | W3 complete |
| [`shared-conventions.md`](shared-conventions.md) | Auth model, error conventions, pagination, shared schemas | — | W4 complete |
| [`parity-matrix.md`](parity-matrix.md) | Frontend page → tool mapping (175+ rows, 100% coverage) | — | W4 complete |
| [`slack-formatting-guide.md`](slack-formatting-guide.md) | Cross-cutting Slack presentation guide: XML formatters, domain-specific templates, error surfacing | — | W4 complete |

> **Note on `cheerful_list_connected_accounts`**: This tool appears in both `integrations.md` (canonical spec, #84) and `users-and-team.md` (cross-reference). It is one tool, counted once. This resolves to 126 unique tools: 31 + 24 + 27 + 18 + 13 + 1 + 4 + 8 = 126.

---

## Tool Index

### Existing Tools (7) — All Have Known Bugs

| # | Tool Name | Domain | One-Line Description | Bug Status |
|---|-----------|--------|---------------------|-----------|
| 1 | `cheerful_list_campaigns` | Campaigns | List the authenticated user's campaigns with optional stats and status filtering | **P1**: formatter reads wrong field names (`type` → `campaign_type`, drops `status`, reads nonexistent `gmail_account_id`) |
| 2 | `cheerful_search_emails` | Email | Full-text search within campaign email threads by query string | **P1**: formatter reads wrong fields (`sender` → `sender_email`, `snippet` → `matched_snippet`) |
| 3 | `cheerful_get_thread` | Email | Fetch a full email thread with all messages and conversation history | **P1**: formatter reads wrong fields (`from` → `sender_email`, `to` → `recipient_emails`, `date` → `internal_date`) |
| 4 | `cheerful_find_similar_emails` | Email | Semantic similarity search via pgvector RAG to find email reply examples | **P1**: formatter reads wrong fields (`summary` → `thread_summary`, `reply_text` → `sent_reply_text`) |
| 5 | `cheerful_list_campaign_creators` | Creators | List creators in a campaign with optional filtering by gifting status and role | **P2**: missing `offset` parameter → pagination broken |
| 6 | `cheerful_get_campaign_creator` | Creators | Get full detail for a specific campaign creator including enrichment data and contact info | **P2**: spec inaccuracy corrected — `enrichment_status`/`source`/`post_opt_in_follow_up_status` NOT in response |
| 7 | `cheerful_search_campaign_creators` | Creators | Search campaign creators by name, email, or social media handle | **P3**: global search security gap — no user_id filtering in backend; searches ALL campaigns |

> See `specs/creators.md` Section 0 and `analysis/existing-tools-audit.md` for full bug details and prioritized fix list.

---

### Domain: Campaigns (31 tools)

*Permission model: campaign owner for CRUD/write ops; assigned team member for read ops.*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 1 | `cheerful_list_campaigns` | Core CRUD | List the authenticated user's campaigns with optional stats and status filtering | EXISTS (bugs) |
| 8 | `cheerful_get_campaign` | Core CRUD | Get a single campaign by ID with full details and optional per-sender thread count breakdown | NEW |
| 9 | `cheerful_create_campaign` | Core CRUD | Create a new campaign with full configuration — the direct-create path (most users use wizard) | NEW |
| 10 | `cheerful_update_campaign` | Core CRUD | Update an existing campaign's configuration with partial update (PATCH semantics) | NEW |
| 11 | `cheerful_delete_campaign` | Core CRUD | Permanently delete a campaign and all associated data (irreversible, cascade) | NEW |
| 12 | `cheerful_duplicate_campaign` | Core CRUD | Create a copy of an existing campaign as DRAFT, copying config, senders, workflows, and products | NEW |
| 13 | `cheerful_save_campaign_draft` | Draft / Wizard | Save a new campaign wizard draft — creates a `status=draft` campaign with form state in `draft_metadata` JSONB | NEW |
| 14 | `cheerful_update_campaign_draft` | Draft / Wizard | Update an existing campaign wizard draft with new form data (DRAFT-only endpoint) | NEW |
| 15 | `cheerful_get_campaign_draft` | Draft / Wizard | Load a saved wizard draft with all stored state for form hydration | NEW |
| 16 | `cheerful_delete_campaign_draft` | Draft / Wizard | Permanently delete a campaign wizard draft (DRAFT-only; irreversible) | NEW |
| 17 | `cheerful_launch_campaign` | Draft / Wizard | Launch a campaign — 22-step orchestration: creates senders, validates templates, seeds AI drafts, and queues emails | NEW |
| 18 | `cheerful_add_campaign_recipients` | Recipients | Bulk add recipients to a campaign by email/name — idempotent, deduplicates by email | NEW |
| 19 | `cheerful_add_campaign_recipients_from_search` | Recipients | Add recipients from Influencer Club search results, creating both recipient and campaign_creator records | NEW |
| 20 | `cheerful_upload_campaign_recipients_csv` | Recipients | Upload recipients from CSV — requires `email` column; gifting/paid_promotion require social profile columns | NEW |
| 21 | `cheerful_list_campaign_recipients` | Recipients | List campaign recipients with rich filtering across 40+ fields in a unified view (recipient + creator merged) | NEW |
| 22 | `cheerful_update_campaign_sender` | Senders | Swap a sender email on a campaign (Gmail accounts only — SMTP not supported for sender swap) | NEW |
| 23 | `cheerful_remove_campaign_sender` | Senders | Remove a sender from a campaign, deleting all queued outbox entries for that sender | NEW |
| 24 | `cheerful_populate_campaign_outbox` | Outbox | Populate the outbound email queue — idempotent, validates all template placeholders before queuing | NEW |
| 25 | `cheerful_get_campaign_outbox` | Outbox | Get the outbox table with dynamic column definitions showing queued/sent/failed status per recipient | NEW |
| 26 | `cheerful_get_campaign_signature` | Signatures | Get the email signature configured for a specific campaign | NEW |
| 27 | `cheerful_update_campaign_signature` | Signatures | Set or update the email signature for a campaign (HTML sanitized server-side) | NEW |
| 28 | `cheerful_list_campaign_signatures` | Signatures | List all email signatures across the user's active campaigns that have enabled signatures | NEW |
| 29 | `cheerful_get_campaign_merge_tags` | Templates | Get all available `{placeholder}` merge tags for a campaign by aggregating recipient custom field keys | NEW |
| 30 | `cheerful_get_campaign_required_columns` | Templates | Get the CSV columns required for a campaign based on `{placeholder}` macros in subject and body templates | NEW |
| 31 | `cheerful_validate_campaign_sheet` | Sheets | Validate that a campaign's configured Google Sheet is accessible and has the required columns | NEW |
| 32 | `cheerful_generate_campaign_summary` | AI Summary | Generate an AI-powered client summary for a campaign by aggregating creator statuses, notes, and email context | NEW |
| 33 | `cheerful_create_product` | Products | Create a new product with a unique `(user_id, name)` constraint — used for gifting campaign item tracking | NEW |
| 34 | `cheerful_list_products` | Products | List all products owned by the authenticated user (no pagination) | NEW |
| 35 | `cheerful_get_product` | Products | Get a single product by ID — verifies ownership | NEW |
| 36 | `cheerful_get_campaign_enrichment_status` | Enrichment | Lightweight batch polling for creator enrichment status — returns only creators with non-null `enrichment_status` | NEW |
| 37 | `cheerful_override_creator_email` | Enrichment | Manually set or override a creator's email address within a campaign | NEW |

---

### Domain: Email (24 tools)

*Permission model: owner-only for drafts and sending; authenticated for reading.*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 2 | `cheerful_search_emails` | Thread Search | Full-text search within campaign email threads by query string | EXISTS (bugs) |
| 3 | `cheerful_get_thread` | Thread Search | Fetch a full email thread with all messages and conversation history | EXISTS (bugs) |
| 4 | `cheerful_find_similar_emails` | Thread Search | Semantic similarity search via pgvector RAG to find similar email reply examples | EXISTS (bugs) |
| 38 | `cheerful_list_threads` | Thread Listing | List email threads with 12 filter params: status, direction, campaign, account, search, hidden | NEW |
| 39 | `cheerful_hide_thread` | Thread Ops | Hide (archive) an email thread from default inbox views | NEW |
| 40 | `cheerful_unhide_thread` | Thread Ops | Unhide a thread — triggers 5-step reprocessing pipeline (reclassify, re-embed, re-draft) | NEW |
| 41 | `cheerful_list_message_attachments` | Attachments | List attachment metadata (filename, MIME type, size) for a specific email message | NEW |
| 42 | `cheerful_get_thread_draft` | Drafts | Get the current email draft for a thread (human or LLM-generated, with version anchor) | NEW |
| 43 | `cheerful_create_thread_draft` | Drafts | Create a new email draft anchored to a thread state ID to prevent race conditions | NEW |
| 44 | `cheerful_update_thread_draft` | Drafts | Update an existing draft with partial fields (partial update, race-condition safe) | NEW |
| 45 | `cheerful_send_email` | Sending | Send an email from a connected Gmail or SMTP account — supports new emails and replies | NEW |
| 46 | `cheerful_schedule_email` | Scheduled | Schedule an email for future send with timezone-aware `dispatch_at` | NEW |
| 47 | `cheerful_list_scheduled_emails` | Scheduled | List all pending scheduled emails for the current user (PENDING status only) | NEW |
| 48 | `cheerful_cancel_scheduled_email` | Scheduled | Cancel a pending scheduled email (PENDING-only; sets status to CANCELLED) | NEW |
| 49 | `cheerful_reschedule_email` | Scheduled | Change the dispatch time of a pending scheduled email | NEW |
| 50 | `cheerful_list_email_signatures` | Signatures | List all email signatures belonging to the user, optionally filtered by campaign | NEW |
| 51 | `cheerful_get_email_signatures_for_reply` | Signatures | Get user-level and campaign-specific signatures for the reply composer dropdown | NEW |
| 52 | `cheerful_create_email_signature` | Signatures | Create a new email signature (user-level or campaign-specific, HTML sanitized, 10K char limit) | NEW |
| 53 | `cheerful_get_email_signature` | Signatures | Get a single email signature by ID | NEW |
| 54 | `cheerful_update_email_signature` | Signatures | Update an existing email signature (partial update; `is_default` cascades to reset others) | NEW |
| 55 | `cheerful_delete_email_signature` | Signatures | Delete an email signature | NEW |
| 56 | `cheerful_bulk_edit_drafts` | Bulk Edit | Batch edit all AI-generated drafts in a campaign via a natural language instruction (Temporal async, 5-min timeout) | NEW |
| 57 | `cheerful_improve_email_content` | AI | Apply AI text improvements: shorten, expand, friendly, professional, casual, or custom instruction (CE-native) | NEW |
| 58 | `cheerful_get_thread_summary` | AI | Get an AI-generated summary of an email thread conversation (CE-native, no backend route) | NEW |

---

### Domain: Creators (27 tools)

*Permission model: owner for enrichment/write ops; authenticated for search and public profiles.*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 5 | `cheerful_list_campaign_creators` | Campaign Creators | List creators in a campaign with optional filtering by gifting status and role | EXISTS (bugs) |
| 6 | `cheerful_get_campaign_creator` | Campaign Creators | Get full detail for a specific campaign creator including enrichment data and contact info | EXISTS (bugs) |
| 7 | `cheerful_search_campaign_creators` | Campaign Creators | Search campaign creators by name, email, or social handle — NOTE: security gap, searches all campaigns globally | EXISTS (bugs) |
| 59 | `cheerful_start_creator_enrichment` | Enrichment | Start an async email enrichment workflow for a batch of creators via multiple data providers | NEW |
| 60 | `cheerful_get_enrichment_workflow_status` | Enrichment | Poll the status of a running enrichment workflow and get per-creator results when complete | NEW |
| 61 | `cheerful_search_similar_creators` | IC Discovery | Find creators similar to a given Instagram/YouTube handle via Influencer Club's similarity algorithm | NEW |
| 62 | `cheerful_search_creators_by_keyword` | IC Discovery | Search for creators by keyword/topic using Influencer Club's AI-powered discovery (10 results/page) | NEW |
| 63 | `cheerful_enrich_creator` | IC Discovery | Enrich a single creator by handle — retrieves email address and profile data from Influencer Club | NEW |
| 64 | `cheerful_get_creator_profile` | IC Discovery | Get a detailed creator profile with bio links and latest posts (24-hour cache, multiple fallback sources) | NEW |
| 65 | `cheerful_list_creator_lists` | Lists CRUD | List all creator lists belonging to the user, with creator counts and email status summary | NEW |
| 66 | `cheerful_create_creator_list` | Lists CRUD | Create a new empty creator list | NEW |
| 67 | `cheerful_get_creator_list` | Lists CRUD | Get a single creator list by ID | NEW |
| 68 | `cheerful_update_creator_list` | Lists CRUD | Update a creator list's title | NEW |
| 69 | `cheerful_delete_creator_list` | Lists CRUD | Delete a creator list and all its items (cascading delete) | NEW |
| 70 | `cheerful_list_creator_list_items` | List Items | List creators in a creator list with pagination, profile data, and email status | NEW |
| 71 | `cheerful_add_creators_to_list` | List Items | Add existing creators by global Creator ID to a list (skips duplicates) | NEW |
| 72 | `cheerful_add_search_creators_to_list` | List Items | Add creators from Influencer Club search results to a list (with image download and ETag dedup) | NEW |
| 73 | `cheerful_add_csv_creators_to_list` | List Items | Add creators from CSV data to a list (platform, handle, email, optional follower count) | NEW |
| 74 | `cheerful_remove_creator_from_list` | List Items | Remove a single creator from a creator list | NEW |
| 75 | `cheerful_add_list_creators_to_campaign` | List Transfer | Add creators from a list to a campaign — triggers outbox population and enrichment workflow | NEW |
| 76 | `cheerful_list_posts` | Posts | List all tracked creator posts across the user's campaigns (post library view) with search and pagination | NEW |
| 77 | `cheerful_list_creator_posts` | Posts | List tracked posts for a specific creator within a campaign, including tracking metadata | NEW |
| 78 | `cheerful_refresh_creator_posts` | Posts | Trigger manual post refresh — fetches last 10 Instagram posts via Apify and analyzes with LLM vision | NEW |
| 79 | `cheerful_delete_post` | Posts | Delete a false-positive tracked post from the post library | NEW |
| 80 | `cheerful_list_public_creator_profiles` | Public SEO | List publicly available creator profiles (no auth required) | NEW |
| 81 | `cheerful_get_public_creator_profile` | Public SEO | Get a single public creator profile by Instagram handle with metrics, sponsorships, and media kit | NEW |
| 82 | `cheerful_trigger_creator_scrape` | Public SEO | Trigger async creator profile scrape via Apify — analyzes bio links and stores structured profile | NEW |

---

### Domain: Integrations (18 tools)

*Permission model: owner-only for all integration config (Gmail tokens and SMTP credentials are per-user).*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 83 | `cheerful_list_gmail_accounts` | Gmail | List the user's connected Gmail accounts and their sync status | NEW |
| 84 | `cheerful_list_connected_accounts` | Gmail + SMTP | List all connected email accounts (Gmail and SMTP) in a unified view, with optional filtering | NEW |
| 85 | `cheerful_list_smtp_accounts` | SMTP | List the user's SMTP email accounts with configuration and verification status | NEW |
| 86 | `cheerful_get_smtp_account` | SMTP | Get full details of a specific SMTP account by ID | NEW |
| 87 | `cheerful_create_smtp_account` | SMTP | Create a new SMTP/IMAP email account for sending and receiving campaign emails | NEW |
| 88 | `cheerful_update_smtp_account` | SMTP | Update an SMTP account's configuration (partial update) | NEW |
| 89 | `cheerful_delete_smtp_account` | SMTP | Permanently delete an SMTP account (hard delete — not soft-delete) | NEW |
| 90 | `cheerful_bulk_import_smtp_accounts` | SMTP | Import multiple SMTP accounts with parallel IMAP verification before saving | NEW |
| 91 | `cheerful_get_google_sheet_tabs` | Google Sheets | Get the list of tabs in a Google Sheets spreadsheet (no auth required, uses service account) | NEW |
| 92 | `cheerful_list_shopify_products` | Shopify | List products from a Shopify store connected to a campaign workflow via GoAffPro proxy | NEW |
| 93 | `cheerful_create_shopify_order` | Shopify | Create a Shopify order from a completed workflow execution's `output_data` via GoAffPro | NEW |
| 94 | `cheerful_get_instantly_status` | Instantly | Check the current Instantly (Composio) integration connection status for the user | NEW |
| 95 | `cheerful_connect_instantly` | Instantly | Connect Instantly via API key — validates against Instantly API then stores credentials via Composio | NEW |
| 96 | `cheerful_disconnect_instantly` | Instantly | Disconnect the Instantly integration by removing stored credentials from Composio | NEW |
| 97 | `cheerful_test_instantly` | Instantly | Test the Instantly connection health by executing a read-only list operation through Composio | NEW |
| 98 | `cheerful_trigger_slack_digest` | Slack | Trigger a Slack order digest for a campaign (starts `SlackOrderDigestWorkflow` via Temporal) | NEW |
| 99 | `cheerful_find_youtube_lookalikes` | YouTube | Find YouTube channels similar to a seed channel via Apify scraping and AI keyword extraction | NEW |
| 100 | `cheerful_lookup_brand` | Brand | Look up brand information from a product URL via Brandfetch — name, logo, icons (never throws errors) | NEW |

---

### Domain: Users & Team (13 tools)

*Permission model: profile tools are self-only; team admin tools are owner-only.*

> `cheerful_list_connected_accounts` is cross-referenced here from the Integrations domain (#84 above). The canonical spec is in `integrations.md`.

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 101 | `cheerful_get_user_settings` | User Settings | Get the authenticated user's settings metadata (creation date, last activity timestamp) | NEW |
| — | `cheerful_list_connected_accounts` | Connected Accounts | *Cross-reference: see Integrations #84* | NEW |
| 102 | `cheerful_list_teams` | Team Management | List all teams the authenticated user belongs to (as owner or member) | NEW |
| 103 | `cheerful_create_team` | Team Management | Create a new team — the authenticated user automatically becomes the owner | NEW |
| 104 | `cheerful_get_team` | Team Management | Get a team's details including full member list with roles, emails, and invitation status | NEW |
| 105 | `cheerful_delete_team` | Team Management | Delete a team and cascade-delete all campaign assignments for non-owner members | NEW |
| 106 | `cheerful_add_team_member` | Team Management | Add a new member by email — auto-invites via Supabase if they don't have a Cheerful account | NEW |
| 107 | `cheerful_remove_team_member` | Team Management | Remove a member from a team and cascade-remove their campaign assignments | NEW |
| 108 | `cheerful_list_my_campaign_assignments` | Assignments | List all campaigns assigned to the authenticated user across all teams | NEW |
| 109 | `cheerful_list_campaign_assignments` | Assignments | List all team member assignments for a specific campaign within a team | NEW |
| 110 | `cheerful_assign_campaign` | Assignments | Assign a campaign to a team member, granting them access to view and edit | NEW |
| 111 | `cheerful_unassign_campaign` | Assignments | Remove a campaign assignment from a team member, revoking their access | NEW |
| 112 | `cheerful_bulk_assign_campaigns` | Assignments | Assign multiple campaigns to a team member in one operation (skips non-owner campaigns) | NEW |
| 113 | `cheerful_get_onboarding_status` | Onboarding | Get the user's onboarding completion status including self-reported role and referral source | NEW |

---

### Domain: Analytics (1 tool)

*Permission model: authenticated — returns stats for the user's campaigns only.*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 114 | `cheerful_get_dashboard_analytics` | Dashboard | Comprehensive analytics dashboard: campaign counts, opt-in rates, email stats, pipelines, follow-up effectiveness, and recent opt-ins | NEW |

---

### Domain: Search & Discovery (4 tools)

*Permission model: authenticated — scoped to user's campaigns.*

> The full search capability is distributed across domains: IC discovery tools are in Creators (#61-64), YouTube lookalike is in Integrations (#99), and thread search tools are in Email (#2-4). These 4 tools cover the lookalike suggestion management workflow.

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 115 | `cheerful_list_lookalike_suggestions` | Suggestions | List AI-generated lookalike creator suggestions for a campaign, sorted by similarity score | NEW |
| 116 | `cheerful_update_lookalike_suggestion` | Suggestions | Update a single suggestion's status — accept, reject, or revert to pending (does NOT add recipient) | NEW |
| 117 | `cheerful_bulk_accept_lookalike_suggestions` | Suggestions | Bulk accept suggestions and add each as a new campaign recipient (skips email duplicates) | NEW |
| 118 | `cheerful_bulk_reject_lookalike_suggestions` | Suggestions | Bulk reject multiple suggestions, excluding them from the campaign's pending view | NEW |

---

### Domain: Workflows (8 tools)

*Permission model: owner-only for CRUD; authenticated for execution history reads.*

| # | Tool Name | Sub-domain | One-Line Description | Status |
|---|-----------|------------|---------------------|--------|
| 119 | `cheerful_list_campaign_workflows` | Workflow CRUD | List all enabled workflows for a campaign (disabled workflows excluded) | NEW |
| 120 | `cheerful_get_campaign_workflow` | Workflow CRUD | Get a specific workflow by ID with full config and instructions (includes disabled) | NEW |
| 121 | `cheerful_create_campaign_workflow` | Workflow CRUD | Create a new AI automation workflow for a campaign with tool selection and instructions | NEW |
| 122 | `cheerful_update_campaign_workflow` | Workflow CRUD | Update a workflow's configuration (partial update; `output_schema` cannot be cleared once set) | NEW |
| 123 | `cheerful_delete_campaign_workflow` | Workflow CRUD | Permanently delete a workflow and all its execution history (irreversible) | NEW |
| 124 | `cheerful_list_workflow_executions` | Execution History | List execution history for a workflow, ordered most-recent-first (max 1000) | NEW |
| 125 | `cheerful_get_thread_workflow_execution` | Execution History | Get the latest execution result for a specific thread + workflow combination | NEW |
| 126 | `cheerful_list_workflow_tools` | Tool Discovery | List all available tool slugs for workflow composition (13 total: GoAffPro, Instagram, media) | NEW |

---

## Implementation Notes

### New Backend Routes Required (~90+)

Every tool marked NEW that maps to a non-service endpoint requires a new `GET/POST/PUT/DELETE /api/service/...` route in the backend. The route must:
- Authenticate via `X-Service-Api-Key` header (see `shared-conventions.md` §1.3)
- Accept `user_id` as a query parameter for user scoping
- Mirror the existing v1 endpoint logic but use service auth instead of JWT

**Domains with zero existing service routes** (require complete new service layers):
- Integrations (18 tools → 18 new routes)
- Users & Team (13 tools → 13 new routes)
- Analytics (1 tool → 1 new route)
- Workflows (8 tools → 8 new routes)

**Special cases**:
- `cheerful_improve_email_content` — CE-native, calls Claude directly, no backend route
- `cheerful_get_thread_summary` — CE-native, uses internal `ThreadSummarizer` service, no backend route
- `cheerful_get_google_sheet_tabs` — existing backend endpoint uses service account (no user auth needed)
- Gmail OAuth connect/disconnect — webapp-only browser redirects; no service route possible

### Existing Tool Bugs (Prioritized Fix List)

See `analysis/existing-tools-audit.md` for full details.

| Priority | Tool | Bug | Impact |
|----------|------|-----|--------|
| P1 | `cheerful_list_campaigns` | Formatter reads `type` not `campaign_type`; reads nonexistent `gmail_account_id` | Campaign type always "unknown" |
| P1 | `cheerful_search_emails` | Reads `sender`/`snippet` not `sender_email`/`matched_snippet` | 4/5 display fields empty |
| P1 | `cheerful_get_thread` | Reads `from`/`to`/`date` not `sender_email`/`recipient_emails`/`internal_date` | Core email fields empty |
| P1 | `cheerful_find_similar_emails` | Reads `summary`/`reply_text` not `thread_summary`/`sent_reply_text` | Core content empty |
| P2 | `cheerful_list_campaign_creators` | Missing `offset` param in API client call | Cannot paginate past first page |
| P2 | `cheerful_get_campaign_creator` | Spec inaccuracy: lists non-existent response fields | Misleading documentation |
| P3 | `cheerful_search_campaign_creators` | Backend does not filter by user_id | Global data exposure |

### Security Gaps (Cross-Domain)

1. **6 of 7 existing service routes** do not validate `user_id` despite receiving it — any user can access any resource if they know the ID.
2. **`cheerful_search_campaign_creators`** — the `/api/service/creators/search` endpoint searches ALL campaigns globally, not just the user's campaigns.
3. **Thread service routes** (`/api/service/threads/search`, `/api/service/threads/{id}`, `/api/service/rag/similar`) — rely on `campaign_id` scoping only; user_id is sent but ignored.

These are documented in `analysis/existing-tools-audit.md` and `specs/search-and-discovery.md`.
