# Forward Ralph — Stage Plan (Cheerful CE Parity)

Dev order: 0 → 1 → 2 → 3-4 (parallel-ok) → 5 → 6-7 (parallel-ok) → 8 → 9-10 (parallel-ok) → 11-15 (parallel-ok) → 16

| Stage | Name                              | Tools | Spec File                | Test Filter                                           | Depends On | Status  |
|-------|-----------------------------------|-------|--------------------------|-------------------------------------------------------|------------|---------|
| 0     | Shared Infrastructure             | —     | —                        | conftest                                              | —          | complete |
| 1     | Security + Bug Fixes              | 7 fix | all specs                | existing\|security                                    | 0          | complete |
| 2     | Campaign CRUD + Launch            | 6     | campaigns.md             | campaign-crud\|launch                                 | 1          | complete |
| 3     | Campaign Recipients + Outbox      | 7     | campaigns.md             | recipients\|outbox\|sender                            | 2          | complete |
| 4     | Campaign Extras                   | 10    | campaigns.md             | signature\|merge-tag\|product\|enrichment\|summary    | 2          | complete |
| 5     | Email Threads & Ops               | 4     | email.md                 | list-threads\|hide\|unhide\|attachment                | 1          | complete |
| 6     | Email Drafts & Sending            | 8     | email.md                 | draft\|send-email\|schedule                           | 5          | complete |
| 7     | Email Signatures & AI             | 9     | email.md                 | email-sig\|bulk-edit\|improve\|thread-summary         | 5          | complete |
| 8     | Creators & Discovery              | 6     | creators.md              | enrichment\|ic-search\|creator-profile                | 1          | complete |
| 9     | Creator Lists & Items             | 10    | creators.md              | creator-list                                          | 8          | complete |
| 10    | Creator Posts                     | 4     | creators.md              | creator-post                                          | 8          | complete |
| 11    | Integrations: SMTP & Accounts     | 7     | integrations.md          | gmail\|smtp\|connected-account                        | 1          | complete |
| 12    | Integrations: External Services   | 10    | integrations.md          | sheets\|shopify\|instantly\|slack-digest\|youtube\|brand | 1       | active |
| 13    | Users & Team                      | 12    | users-and-team.md        | user-settings\|team\|assignment\|onboarding           | 1          | pending |
| 14    | Analytics + Search                | 5     | analytics.md + search-and-discovery.md | analytics\|lookalike                        | 1          | pending |
| 15    | Workflows                         | 8     | workflows.md             | workflow                                              | 1          | pending |
| 16    | Integration Sweep                 | —     | all specs                | —                                                     | all        | pending |

Status values: blocked | pending | active | complete

## Tool Count Summary

| Phase | Stages | New Tools | Fix Tools | Total |
|-------|--------|-----------|-----------|-------|
| Infra | 0-1 | 0 | 7 | 7 |
| Campaigns | 2-4 | 23 | 0 | 23 |
| Email | 5-7 | 21 | 0 | 21 |
| Creators | 8-10 | 20 | 0 | 20 |
| Integrations | 11-12 | 17 | 0 | 17 |
| Users & Team | 13 | 12 | 0 | 12 |
| Analytics + Search | 14 | 5 | 0 | 5 |
| Workflows | 15 | 8 | 0 | 8 |
| Sweep | 16 | 0 | 0 | 0 |
| **TOTAL** | **0-16** | **106** | **7** | **113** |

## Cut Tools (13 — not implemented)

| # | Tool | Reason |
|---|------|--------|
| 13 | `cheerful_save_campaign_draft` | Wizard state — agent uses create_campaign directly |
| 14 | `cheerful_update_campaign_draft` | Wizard state |
| 15 | `cheerful_get_campaign_draft` | Wizard state |
| 16 | `cheerful_delete_campaign_draft` | Wizard state |
| 20 | `cheerful_upload_campaign_recipients_csv` | Can't upload files via Slack |
| 27 | `cheerful_update_campaign_signature` | HTML editing via Slack is poor UX |
| 31 | `cheerful_validate_campaign_sheet` | Redundant with get_google_sheet_tabs |
| 73 | `cheerful_add_csv_creators_to_list` | Can't upload files via Slack |
| 80 | `cheerful_list_public_creator_profiles` | Public SEO page, not internal workflow |
| 81 | `cheerful_get_public_creator_profile` | Public SEO page |
| 82 | `cheerful_trigger_creator_scrape` | Background admin operation |
| 90 | `cheerful_bulk_import_smtp_accounts` | Bulk structured input, poor Slack UX |
| 112 | `cheerful_bulk_assign_campaigns` | Agent can loop assign_campaign |
