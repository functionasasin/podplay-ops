# w2-search — Tool Design Notes

**Aspect**: w2-search
**Sources**: `analysis/capabilities-search.md`, `specs/creators.md` (IC search tools), `specs/integrations.md` (YouTube lookalike), `specs/email.md` (existing search tools), `specs/campaigns.md` (auto-discovery config)

---

## Design Decisions

### 1. Hub Domain Pattern

The search-and-discovery spec is a **hub domain** — most search/discovery tools are owned by other domain specs because they're integral to those workflows:

- **Email search tools** (3 existing) → `email.md` — searching emails is part of the email workflow
- **IC creator search/discovery tools** (4 new) → `creators.md` — discovering creators is part of the creator lifecycle
- **YouTube lookalike search** (1 new) → `integrations.md` — it's an external Apify/LLM integration
- **Creator enrichment** (4 tools) → `creators.md` + `campaigns.md` — enrichment serves creator workflows

The only tools that don't naturally belong elsewhere are the **lookalike suggestion management** tools (list, update, bulk-accept, bulk-reject). These are placed in `search-and-discovery.md`.

### 2. Lookalike Suggestion Tools — 4 Tools

Designed 4 tools for the suggestion review workflow:

| Tool | Action | Key Design Notes |
|------|--------|-----------------|
| `cheerful_list_lookalike_suggestions` | List suggestions | Filters: campaign_id (required), status (optional enum). Only returns suggestions with emails (matching webapp behavior). Sorted by similarity_score desc |
| `cheerful_update_lookalike_suggestion` | Update single | Accept/reject/revert. Accept has side effect: creates campaign_recipient if email not already present |
| `cheerful_bulk_accept_lookalike_suggestions` | Bulk accept | Primary batch workflow. Returns accepted_count + added_recipient_count (differ if some emails already recipients) + failed_ids |
| `cheerful_bulk_reject_lookalike_suggestions` | Bulk reject | Simple status update. Returns rejected_count + failed_ids |

### 3. Key Design Constraints

- **All 4 tools need new backend service endpoints** — currently webapp-only Next.js routes using Supabase direct
- **Accept is not fully reversible** — accepting creates a recipient; reverting to pending does NOT remove the recipient
- **Permission model**: owner-or-assigned (both campaign owner and assigned team members can manage suggestions, enforced via Supabase RLS `can_access_campaign`)
- **No pagination in current webapp** — service endpoints should add limit/offset (noted as recommendation)
- **Unique constraint** on `(campaign_id, platform, suggested_username)` prevents duplicates
- **Idempotent** — re-accepting or re-rejecting doesn't cause errors

### 4. Auto-Discovery Configuration — No Dedicated Tool

Auto-discovery is managed via campaign-level fields:
- `is_lookalike_suggestions_enabled` (bool) — enables per-opt-in suggestion generation
- `discovery_enabled` (bool) — enables weekly automated discovery
- `discovery_config` (JSON) — seed profiles, keywords, follower filters, platform

These are all set via `cheerful_update_campaign` in `specs/campaigns.md`. No dedicated auto-discovery tools needed.

### 5. Cross-Reference Map

Included a comprehensive cross-domain search tool map in the spec showing all 16+ search/discovery tools across all domains. Also included the full agent workflow for the discovery-to-campaign pipeline.

## New Service Routes Required

4 new endpoints:
1. `GET /api/service/campaigns/{campaign_id}/lookalike-suggestions`
2. `PUT /api/service/campaigns/{campaign_id}/lookalike-suggestions/{suggestion_id}`
3. `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-accept`
4. `POST /api/service/campaigns/{campaign_id}/lookalike-suggestions/bulk-reject`

## No New Aspects Discovered

The search domain is well-contained. All capabilities from w1-search have been placed into tools across existing domains. No new aspects needed.
