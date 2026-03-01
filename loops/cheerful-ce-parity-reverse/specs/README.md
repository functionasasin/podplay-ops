# Context Engine Tool Specifications — Index

## Status

Wave 2 tool design complete. Wave 3 in progress. All 8 domains designed: Campaigns (31), Email (24), Creators (27), Integrations (18), Users & Team (13), Analytics (1), Search & Discovery (4), Workflows (8). Total: 126 tools (7 existing + 119 new). **Wave 3 progress**: Campaigns CRUD (6 tools) + Wizard/Products (8 tools) + Recipients/Senders/Outbox/Signatures/Merge/Sheet/Summary/Enrichment (17 tools) + Email domain complete (24 tools) = 55 tools fully specified with OpenAPI-level detail.

## Domains

| Domain | Spec File | Existing Tools | New Tools | Total | Status |
|--------|-----------|---------------|-----------|-------|--------|
| Campaigns | `campaigns.md` | 1 | 30 | 31 | Wave 3: CRUD + Wizard + Products + Recipients + Senders + Outbox + Signatures + MergeTags + Sheet + Summary + Enrichment complete (31/31 tools fully specified) |
| Email | `email.md` | 3 | 21 | 24 | Wave 3: All 24 tools fully specified with OpenAPI-level detail |
| Creators | `creators.md` | 3 | 24 | 27 | Wave 2 complete |
| Integrations | `integrations.md` | 0 | 18 | 18 | Wave 2 complete |
| Users & Team | `users-and-team.md` | 0 | 13 | 13 | Wave 2 complete |
| Analytics | `analytics.md` | 0 | 1 | 1 | Wave 2 complete |
| Search & Discovery | `search-and-discovery.md` | 0 | 4 | 4 | Wave 2 complete |
| Workflows | `workflows.md` | 0 | 8 | 8 | Wave 2 complete |
| Shared Conventions | `shared-conventions.md` | — | — | — | Pending |
| Parity Matrix | `parity-matrix.md` | — | — | — | Pending |

## Tool Index

### Existing Tools (7)

| # | Tool Name | Domain | Description | Status |
|---|-----------|--------|-------------|--------|
| 1 | `cheerful_list_campaigns` | Campaigns | List user's campaigns | EXISTS — needs enhancement |
| 2 | `cheerful_search_emails` | Email | Full-text search within campaign threads | EXISTS |
| 3 | `cheerful_get_thread` | Email | Fetch full email thread with all messages | EXISTS |
| 4 | `cheerful_find_similar_emails` | Email | Semantic search via pgvector RAG | EXISTS |
| 5 | `cheerful_list_campaign_creators` | Creators | List creators in campaign | EXISTS |
| 6 | `cheerful_get_campaign_creator` | Creators | Full creator profile | EXISTS |
| 7 | `cheerful_search_campaign_creators` | Creators | Cross-campaign creator search | EXISTS |

### New Tools — Campaigns Domain (30)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 8 | `cheerful_get_campaign` | Core CRUD | Get single campaign by ID with optional sender details | NEW |
| 9 | `cheerful_create_campaign` | Core CRUD | Create a new campaign with full configuration | NEW |
| 10 | `cheerful_update_campaign` | Core CRUD | Update campaign config (partial update) | NEW |
| 11 | `cheerful_delete_campaign` | Core CRUD | Delete campaign and all associated data (cascade) | NEW |
| 12 | `cheerful_duplicate_campaign` | Core CRUD | Duplicate campaign as DRAFT | NEW |
| 13 | `cheerful_save_campaign_draft` | Draft/Wizard | Save new campaign wizard draft | NEW |
| 14 | `cheerful_update_campaign_draft` | Draft/Wizard | Update existing wizard draft | NEW |
| 15 | `cheerful_get_campaign_draft` | Draft/Wizard | Load wizard draft state | NEW |
| 16 | `cheerful_delete_campaign_draft` | Draft/Wizard | Delete wizard draft | NEW |
| 17 | `cheerful_launch_campaign` | Draft/Wizard | Launch campaign from draft (orchestration) | NEW |
| 18 | `cheerful_add_campaign_recipients` | Recipients | Bulk add recipients by email/name | NEW |
| 19 | `cheerful_add_campaign_recipients_from_search` | Recipients | Add recipients from creator search (with enrichment) | NEW |
| 20 | `cheerful_upload_campaign_recipients_csv` | Recipients | Upload CSV of recipients | NEW |
| 21 | `cheerful_list_campaign_recipients` | Recipients | List recipients with rich filtering (unified view) | NEW |
| 22 | `cheerful_update_campaign_sender` | Senders | Swap sender email on campaign | NEW |
| 23 | `cheerful_remove_campaign_sender` | Senders | Remove sender from campaign | NEW |
| 24 | `cheerful_populate_campaign_outbox` | Outbox | Populate outbound email queue | NEW |
| 25 | `cheerful_get_campaign_outbox` | Outbox | Get outbox table (queued/sent/failed) | NEW |
| 26 | `cheerful_get_campaign_signature` | Signatures | Get campaign email signature | NEW |
| 27 | `cheerful_update_campaign_signature` | Signatures | Set/update campaign email signature | NEW |
| 28 | `cheerful_list_campaign_signatures` | Signatures | List all available signatures | NEW |
| 29 | `cheerful_get_campaign_merge_tags` | Templates | Get available merge tags for templates | NEW |
| 30 | `cheerful_get_campaign_required_columns` | Templates | Get required CSV columns for templates | NEW |
| 31 | `cheerful_validate_campaign_sheet` | Sheets | Validate campaign's Google Sheet | NEW |
| 32 | `cheerful_generate_campaign_summary` | AI Summary | Generate AI client summary | NEW |
| 33 | `cheerful_create_product` | Products | Create a new product | NEW |
| 34 | `cheerful_list_products` | Products | List user's products | NEW |
| 35 | `cheerful_get_product` | Products | Get product by ID | NEW |
| 36 | `cheerful_get_campaign_enrichment_status` | Enrichment | Get enrichment progress for campaign creators | NEW |
| 37 | `cheerful_override_creator_email` | Enrichment | Override creator email in campaign | NEW |

### New Tools — Email Domain (21)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 38 | `cheerful_list_threads` | Thread Listing | List threads with full filtering (status, direction, campaign, account, search) | NEW |
| 39 | `cheerful_hide_thread` | Thread Ops | Hide/archive an email thread | NEW |
| 40 | `cheerful_unhide_thread` | Thread Ops | Unhide/restore thread (triggers reprocessing pipeline) | NEW |
| 41 | `cheerful_list_message_attachments` | Attachments | List attachment metadata for a message | NEW |
| 42 | `cheerful_get_thread_draft` | Drafts | Get current draft for a thread (human or LLM) | NEW |
| 43 | `cheerful_create_thread_draft` | Drafts | Create a new draft anchored to thread state | NEW |
| 44 | `cheerful_update_thread_draft` | Drafts | Update existing draft (partial update) | NEW |
| 45 | `cheerful_send_email` | Sending | Send email from connected account (new or reply) | NEW |
| 46 | `cheerful_schedule_email` | Scheduled | Schedule email for future send with timezone | NEW |
| 47 | `cheerful_list_scheduled_emails` | Scheduled | List user's pending scheduled emails | NEW |
| 48 | `cheerful_cancel_scheduled_email` | Scheduled | Cancel a pending scheduled email | NEW |
| 49 | `cheerful_reschedule_email` | Scheduled | Change dispatch time of pending email | NEW |
| 50 | `cheerful_list_email_signatures` | Signatures | List all user signatures (optional campaign filter) | NEW |
| 51 | `cheerful_get_email_signatures_for_reply` | Signatures | Get user + campaign signatures for reply composer | NEW |
| 52 | `cheerful_create_email_signature` | Signatures | Create signature (user-level or campaign-specific) | NEW |
| 53 | `cheerful_get_email_signature` | Signatures | Get single signature by ID | NEW |
| 54 | `cheerful_update_email_signature` | Signatures | Update signature (partial update) | NEW |
| 55 | `cheerful_delete_email_signature` | Signatures | Delete a signature | NEW |
| 56 | `cheerful_bulk_edit_drafts` | Bulk Edit | Batch edit campaign drafts via AI instruction | NEW |
| 57 | `cheerful_improve_email_content` | AI | AI text improvement (shorten/expand/tone/custom) | NEW |
| 58 | `cheerful_get_thread_summary` | AI | AI-generated thread conversation summary | NEW |

### New Tools — Creators Domain (24)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 59 | `cheerful_start_creator_enrichment` | Enrichment | Start async email enrichment for batch of creators | NEW |
| 60 | `cheerful_get_enrichment_workflow_status` | Enrichment | Poll enrichment workflow status and results | NEW |
| 61 | `cheerful_search_similar_creators` | IC Search | Find similar creators via Influencer Club | NEW |
| 62 | `cheerful_search_creators_by_keyword` | IC Search | Search creators by keyword/topic via IC | NEW |
| 63 | `cheerful_enrich_creator` | IC Search | Enrich single creator (email + profile) via IC | NEW |
| 64 | `cheerful_get_creator_profile` | IC Search | Get detailed creator profile (Apify/IC, 24h cache) | NEW |
| 65 | `cheerful_list_creator_lists` | Lists CRUD | List all user's creator lists | NEW |
| 66 | `cheerful_create_creator_list` | Lists CRUD | Create new empty creator list | NEW |
| 67 | `cheerful_get_creator_list` | Lists CRUD | Get single creator list by ID | NEW |
| 68 | `cheerful_update_creator_list` | Lists CRUD | Update creator list title | NEW |
| 69 | `cheerful_delete_creator_list` | Lists CRUD | Delete creator list and all items | NEW |
| 70 | `cheerful_list_creator_list_items` | List Items | List creators in a list with pagination | NEW |
| 71 | `cheerful_add_creators_to_list` | List Items | Add existing creators by ID to list | NEW |
| 72 | `cheerful_add_search_creators_to_list` | List Items | Add IC search results to list | NEW |
| 73 | `cheerful_add_csv_creators_to_list` | List Items | Add creators from CSV data to list | NEW |
| 74 | `cheerful_remove_creator_from_list` | List Items | Remove single creator from list | NEW |
| 75 | `cheerful_add_list_creators_to_campaign` | List Transfer | Transfer list creators to campaign (with outbox + enrichment side effects) | NEW |
| 76 | `cheerful_list_posts` | Posts | List all tracked posts across campaigns (post library) | NEW |
| 77 | `cheerful_list_creator_posts` | Posts | List posts for specific creator in campaign | NEW |
| 78 | `cheerful_refresh_creator_posts` | Posts | Trigger manual post refresh (Apify + LLM vision) | NEW |
| 79 | `cheerful_delete_post` | Posts | Delete false-positive tracked post | NEW |
| 80 | `cheerful_list_public_creator_profiles` | Public SEO | List public creator profiles | NEW |
| 81 | `cheerful_get_public_creator_profile` | Public SEO | Get single public creator profile | NEW |
| 82 | `cheerful_trigger_creator_scrape` | Public SEO | Trigger async creator profile scrape | NEW |

### New Tools — Integrations Domain (18)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 83 | `cheerful_list_gmail_accounts` | Gmail | List connected Gmail accounts and sync status | NEW |
| 84 | `cheerful_get_gmail_sync_status` | Gmail | Get sync status for a specific Gmail account | NEW |
| 85 | `cheerful_list_smtp_accounts` | SMTP | List all SMTP accounts | NEW |
| 86 | `cheerful_get_smtp_account` | SMTP | Get single SMTP account by ID | NEW |
| 87 | `cheerful_create_smtp_account` | SMTP | Create new SMTP account with IMAP config | NEW |
| 88 | `cheerful_update_smtp_account` | SMTP | Update SMTP account settings (partial) | NEW |
| 89 | `cheerful_delete_smtp_account` | SMTP | Delete SMTP account | NEW |
| 90 | `cheerful_bulk_import_smtp_accounts` | SMTP | Bulk import SMTP accounts with IMAP verification | NEW |
| 91 | `cheerful_get_google_sheet_tabs` | Google Sheets | Get tab names from a Google Sheet URL | NEW |
| 92 | `cheerful_list_shopify_products` | Shopify | List Shopify products via GoAffPro proxy | NEW |
| 93 | `cheerful_create_shopify_order` | Shopify | Create draft Shopify order for creator | NEW |
| 94 | `cheerful_get_instantly_status` | Instantly | Get Instantly (Composio) connection status | NEW |
| 95 | `cheerful_connect_instantly` | Instantly | Connect Instantly via Composio broker | NEW |
| 96 | `cheerful_disconnect_instantly` | Instantly | Disconnect Instantly integration | NEW |
| 97 | `cheerful_test_instantly_connection` | Instantly | Test Instantly connection health | NEW |
| 98 | `cheerful_trigger_slack_digest` | Slack | Trigger Slack campaign digest | NEW |
| 99 | `cheerful_find_youtube_lookalikes` | YouTube | Find similar YouTube channels via Apify + LLM | NEW |
| 100 | `cheerful_lookup_brand` | Brand | Detect brand info from URL | NEW |

### New Tools — Users & Team Domain (13)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 101 | `cheerful_get_user_settings` | User Settings | Get user settings metadata | NEW |
| 102 | `cheerful_list_connected_accounts` | Connected Accounts | List all connected accounts (Gmail + SMTP) unified view | NEW |
| 103 | `cheerful_list_teams` | Team Management | List teams user belongs to | NEW |
| 104 | `cheerful_create_team` | Team Management | Create new team (caller becomes owner) | NEW |
| 105 | `cheerful_get_team` | Team Management | Get team details with full member list | NEW |
| 106 | `cheerful_delete_team` | Team Management | Delete team (cascades to campaign assignments) | NEW |
| 107 | `cheerful_add_team_member` | Team Management | Add member by email (auto-invites new users) | NEW |
| 108 | `cheerful_remove_team_member` | Team Management | Remove member (cascades to campaign assignments) | NEW |
| 109 | `cheerful_list_my_campaign_assignments` | Assignments | List campaigns assigned to current user | NEW |
| 110 | `cheerful_list_campaign_assignments` | Assignments | List assignments for a specific campaign | NEW |
| 111 | `cheerful_assign_campaign` | Assignments | Assign campaign to team member | NEW |
| 112 | `cheerful_unassign_campaign` | Assignments | Remove campaign assignment from member | NEW |
| 113 | `cheerful_bulk_assign_campaigns` | Assignments | Bulk assign campaigns to member | NEW |

### New Tools — Analytics Domain (1)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 114 | `cheerful_get_dashboard_analytics` | Dashboard | Comprehensive analytics: campaign counts, opt-in rates, email stats, pipelines, follow-ups, recent opt-ins | NEW |

### New Tools — Search & Discovery Domain (4)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 115 | `cheerful_list_lookalike_suggestions` | Suggestions | List AI-generated lookalike creator suggestions for a campaign | NEW |
| 116 | `cheerful_update_lookalike_suggestion` | Suggestions | Accept/reject a single lookalike suggestion | NEW |
| 117 | `cheerful_bulk_accept_lookalike_suggestions` | Suggestions | Bulk accept suggestions + add as campaign recipients | NEW |
| 118 | `cheerful_bulk_reject_lookalike_suggestions` | Suggestions | Bulk reject suggestions | NEW |

### New Tools — Workflows Domain (8)

| # | Tool Name | Sub-domain | Description | Status |
|---|-----------|------------|-------------|--------|
| 119 | `cheerful_list_campaign_workflows` | Workflow CRUD | List enabled workflows for a campaign | NEW |
| 120 | `cheerful_get_campaign_workflow` | Workflow CRUD | Get specific workflow with full config | NEW |
| 121 | `cheerful_create_campaign_workflow` | Workflow CRUD | Create new AI automation workflow for campaign | NEW |
| 122 | `cheerful_update_campaign_workflow` | Workflow CRUD | Update workflow config (partial update) | NEW |
| 123 | `cheerful_delete_campaign_workflow` | Workflow CRUD | Delete workflow and all execution history | NEW |
| 124 | `cheerful_list_workflow_executions` | Execution History | List execution history for workflow (most recent first) | NEW |
| 125 | `cheerful_get_thread_workflow_execution` | Execution History | Get latest execution result for a thread | NEW |
| 126 | `cheerful_list_workflow_tools` | Tool Discovery | List all available tool slugs for workflow composition | NEW |

### Remaining Domains (pending design)

*Onboarding status tool (`cheerful_get_onboarding_status`) listed in `specs/users-and-team.md` but not numbered here pending Wave 3 (requires new backend endpoint).*

> **Note on Search & Discovery tool count**: The w1-search extraction identified ~8-9 new tools needed, but during Wave 2 design, IC creator search/discovery tools (4) were placed in `creators.md` and YouTube lookalike (1) in `integrations.md` as they are integral to those domain workflows. The 4 tools here (lookalike suggestion management) are the search/discovery capabilities that don't naturally fit elsewhere. The total new search/discovery tool count across all domains is ~9 (4 here + 4 in creators + 1 in integrations).
