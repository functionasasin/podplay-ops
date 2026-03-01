# Context Engine Tool Specifications — Index

## Status

Wave 2 tool design in progress. Campaign domain complete. Other domains pending.

## Domains

| Domain | Spec File | Existing Tools | New Tools | Total | Status |
|--------|-----------|---------------|-----------|-------|--------|
| Campaigns | `campaigns.md` | 1 | 30 | 31 | Wave 2 complete |
| Email | `email.md` | 3 | ~22 | ~25 | Wave 1 complete |
| Creators | `creators.md` | 3 | ~23 | ~26 | Wave 1 complete |
| Integrations | `integrations.md` | 0 | ~12 | ~12 | Wave 1 complete |
| Users & Team | `users-and-team.md` | 0 | ~16 | ~16 | Wave 1 complete |
| Analytics | `analytics.md` | 0 | ~1 | ~1 | Wave 1 complete |
| Search & Discovery | `search-and-discovery.md` | 0 | ~9 | ~9 | Wave 1 complete |
| Workflows | `workflows.md` | 0 | ~7 | ~7 | Wave 1 complete |
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

### New Tools — Other Domains (pending design)

*Tool designs for Email, Creators, Integrations, Users & Team, Analytics, Search & Discovery, and Workflows domains will be added as Wave 2 progresses.*
