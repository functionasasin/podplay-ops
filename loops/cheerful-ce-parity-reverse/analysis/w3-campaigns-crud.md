# w3-campaigns-crud — Full OpenAPI-Level Specs

**Aspect**: w3-campaigns-crud
**Wave**: 3 (Full OpenAPI-Level Specs)
**Date**: 2026-03-01
**Duration**: ~25 min

## What Was Done

Fleshed out all 6 Campaign Core CRUD tools from Wave 2 skeleton definitions to exhaustive OpenAPI-level specifications by reading and verifying against actual backend source code.

### Source Files Verified

| File | Lines Read | Key Data Extracted |
|------|-----------|-------------------|
| `backend/src/api/route/campaign.py` | 1-1910 | All 6 CRUD endpoint handlers: create (lines 183-406), list (409-565), get (607-724), update (727-1023), delete (1629-1718), duplicate (1726-1910). Exact validation logic, error messages, side effects. |
| `backend/src/models/api/campaign.py` | Full file | All Pydantic models: CampaignCreateRequest (30 fields), CampaignUpdateRequest (26 fields), CampaignResponse (42 fields), FollowUpTemplate (3 fields), DiscoveryConfig (5 fields), CampaignSenderCreateRequest (2 fields + validator), CampaignRecipientCreateRequest (3 fields). All validators documented. |
| `backend/src/models/database/campaign.py` | Full file | SQLAlchemy Campaign model (37 columns), CampaignRecipient (6 cols), CampaignSender (5 cols), CampaignProduct (4 cols), CampaignThread (5 cols), CampaignOutboxQueue (14 cols). All constraints, defaults, FKs. |
| `backend/src/api/route/service.py` | Service campaigns handler | Only `user_id` query param. Hardcoded ACTIVE/PAUSED filter. Returns 6-field ServiceCampaignResponse. Uses `get_by_user_id` not `get_accessible_campaign_ids`. |
| `context-engine/tools.py` | Full file | `ListCampaignsInput` is empty model. `_resolve_user_id` reads `request_context.cheerful_user_id`. `_fmt_campaign` has field mismatch: reads `type` not `campaign_type`, reads non-existent `gmail_account_id`. |
| `context-engine/api.py` | list_campaigns | Calls `GET /api/service/campaigns?user_id={user_id}`. Uses httpx with X-Service-Api-Key header. |
| `context-engine/constants.py` | Slack mapping | Hardcoded staging (7 entries) and production (8 entries) Slack→Cheerful UUID maps. |

### Tools Specified (6 total)

1. **`cheerful_list_campaigns`** (EXISTS — needs enhancement)
   - Current bugs documented: XML formatter reads wrong field names, drops status/slack_channel_id
   - Service route gaps: no filtering, no stats, no team access
   - Full proposed param/response schema with 3 new params (include_stats, statuses, campaign_ids)
   - All 42 CampaignResponse fields documented with types and nullability

2. **`cheerful_get_campaign`** (NEW)
   - Full CampaignResponse schema (42 fields)
   - include_sender_details with CampaignSenderDetailResponse sub-schema
   - Brand resolution (brand_id → brand table lookup) documented
   - All error conditions from source code

3. **`cheerful_create_campaign`** (NEW)
   - All 30 CampaignCreateRequest fields with exact types, defaults, constraints
   - 4 cross-field validators: google_sheet all-or-nothing, is_external recipients, is_external product, follow_up_templates sequential
   - Sender/product ownership validation with exact error messages from source
   - Side effects: recipient/sender/product creation, Augmentum sheet sync, no auto outbox population
   - 12 distinct error conditions with exact messages

4. **`cheerful_update_campaign`** (NEW)
   - All 26 CampaignUpdateRequest fields (PATCH semantics)
   - Critical side effects: status→completed cancels pending outbox + follow-ups, status→active from completed clears completed_at
   - Google Sheet URL change clears error state
   - product_ids is REPLACE not additive
   - product_id ownership checked against campaign.user_id (not requesting user) — important team member nuance

5. **`cheerful_delete_campaign`** (NEW)
   - Full cascade documentation: 7 manual deletions + 6 CASCADE deletions
   - thread_review_queue FK nullification step documented
   - Note on access control: main API uses can_access_campaign (allows team members), may want to restrict to owner-only for CE

6. **`cheerful_duplicate_campaign`** (NEW)
   - Owner vs team member behavior: senders/products only copied for owner
   - Full "what gets copied" table (13 rows)
   - Signature copy logic documented
   - Only enabled workflows copied

### Shared Sub-Schemas Added

- FollowUpTemplate (3 fields, validation rules)
- DiscoveryConfig (5 fields with defaults)
- CampaignSenderCreate (2 fields, exactly-one validator)
- CampaignRecipientCreate (3 fields)
- CampaignSenderDetailResponse (4 fields)

### Enums Verified and Documented

- CampaignType: 5 values (paid_promotion, creator, gifting, sales, other)
- CampaignStatus: 4 values (active, paused, draft, completed)
- CampaignOutboxQueueStatus: 5 values (pending, processing, sent, failed, cancelled)

### Key Discoveries During Code Reading

1. **XML formatter bug**: `_fmt_campaign` reads `campaign.get("type")` but backend returns `campaign_type`. Always falls back to "unknown". Also reads non-existent `gmail_account_id`.

2. **Service route team access gap**: Service route uses `repo.get_by_user_id(user_id)` which is owner-only. Main API uses `CampaignMemberAssignmentRepository.get_accessible_campaign_ids(user_id)` for team access. Service route needs update.

3. **Delete allows team members**: `delete_campaign` uses `can_access_campaign` check, meaning assigned team members can delete campaigns they don't own. This may be intentional or a security gap.

4. **Duplicate ownership nuance**: When a team member duplicates, the new campaign is owned by them (not the original owner). Senders/products are NOT copied because Gmail accounts and products belong to the original owner. Signature content IS copied.

5. **product_ids REPLACE semantics on update**: `campaign_product_repo.replace_for_campaign()` replaces ALL junction records, not additive. Must document clearly.

6. **Update product ownership check**: On update, product ownership is validated against `campaign.user_id` (the campaign owner), NOT the requesting user. This means a team member can reference the owner's products when updating.

7. **completed_at tracking**: Status transition to COMPLETED sets `completed_at = datetime.now(utc)`. Reactivation clears it to `null`. Cancelled outbox/follow-up items are NOT re-queued on reactivation.

### No New Aspects Discovered

All capabilities in the CRUD sub-domain were already identified in Wave 1/Wave 2. The source code verification confirmed the existing spec without revealing new endpoints or capabilities.
