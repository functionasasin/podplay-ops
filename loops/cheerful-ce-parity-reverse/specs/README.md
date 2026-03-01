# Context Engine Tool Specifications — Index

## Status

Wave 1 capability extraction in progress. Tool definitions begin in Wave 2.

## Domains

| Domain | Spec File | Existing Tools | New Tools (est.) | Status |
|--------|-----------|---------------|-----------------|--------|
| Campaigns | `campaigns.md` | 1 | ~37 | Wave 1 complete |
| Email | `email.md` | 3 | ~22 | Wave 1 complete |
| Creators | `creators.md` | 3 | TBD | Pending |
| Integrations | `integrations.md` | 0 | TBD | Pending |
| Users & Team | `users-and-team.md` | 0 | TBD | Pending |
| Analytics | `analytics.md` | 0 | TBD | Pending |
| Search & Discovery | `search-and-discovery.md` | 0 | TBD | Pending |
| Workflows | (in campaigns) | 0 | TBD | Pending |
| Shared Conventions | `shared-conventions.md` | — | — | Pending |
| Parity Matrix | `parity-matrix.md` | — | — | Pending |

## Tool Index

*Populated during Wave 2 (tool design) and Wave 3 (full specs).*

### Existing Tools (7)

| # | Tool Name | Domain | Description | Status |
|---|-----------|--------|-------------|--------|
| 1 | `cheerful_list_campaigns` | Campaigns | List user's campaigns | EXISTS |
| 2 | `cheerful_search_emails` | Email | Full-text search within campaign threads | EXISTS |
| 3 | `cheerful_get_thread` | Email | Fetch full email thread with all messages | EXISTS |
| 4 | `cheerful_find_similar_emails` | Email | Semantic search via pgvector RAG | EXISTS |
| 5 | `cheerful_list_campaign_creators` | Creators | List creators in campaign | EXISTS |
| 6 | `cheerful_get_campaign_creator` | Creators | Full creator profile | EXISTS |
| 7 | `cheerful_search_campaign_creators` | Creators | Cross-campaign creator search | EXISTS |
