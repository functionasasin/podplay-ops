# w3-campaigns-wizard — Analysis Notes

**Aspect**: w3-campaigns-wizard
**Wave**: 3 (Full OpenAPI-Level Specs)
**Date**: 2026-03-01

---

## Source Files Analyzed

| File | Lines | What I Verified |
|------|-------|-----------------|
| `backend/src/api/route/campaign_launch.py` | ~1396 | All 5 endpoints: POST /campaigns/draft, PUT /campaigns/draft/{id}, GET /campaigns/draft/{id}, DELETE /campaigns/draft/{id}, POST /campaigns/launch. Contains helpers for products, sender validation, CSV parsing, workflow creation, image upload. |
| `backend/src/models/api/campaign_launch.py` | ~425 | All request/response models: CampaignLaunchRequest (27 fields, 3 validators), CampaignDraftSaveRequest (25 fields), CampaignDraftSaveResponse, CampaignDraftResponse (26 fields), CampaignLaunchResponse (7 fields), EmailDraft (2 fields), RecipientData (3 fields), FollowUpTemplateInput (3 fields). |
| `backend/src/api/route/product.py` | ~98 | 3 endpoints: POST /products/, GET /products/, GET /products/{id}. Simple CRUD with ownership check. |
| `backend/src/api/route/product_update.py` | ~78 | 2 endpoints: GET /product-updates/unseen, POST /product-updates/mark-seen. This is a **product updates feed** (changelog), NOT product CRUD. Separate domain. |
| `backend/src/models/api/product.py` | ~29 | ProductResponse (5 fields), ProductCreateRequest (3 fields), ProductUpdateRequest (3 fields — exists but no route uses it). |
| `backend/src/models/database/product.py` | ~37 | Product model: 6 columns (id, user_id, name, description, url_to_scrape, created_at). Unique constraint on (user_id, name). |

---

## Key Findings

### 1. Draft route is in campaign_launch.py, NOT campaign_draft.py
The frontier spec referenced `campaign_draft.py` but this file doesn't exist. All draft endpoints are in `campaign_launch.py` alongside the launch endpoint. The `draft.py` file that does exist is for **email thread drafts** (UI drafts on email threads), a completely different concept.

### 2. Campaign type mapping is frontend→backend, not direct
The draft system uses frontend campaign type strings (`"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"`) NOT backend enum values. There are two mapping dicts:
- `CAMPAIGN_TYPE_MAP`: frontend → backend (e.g., `"seeding"` → `CampaignType.GIFTING`)
- `CAMPAIGN_TYPE_REVERSE_MAP`: backend → frontend (e.g., `CampaignType.GIFTING` → `"gifting"`, `CampaignType.OTHER` → `"sales"`)

The CE tool specs document the frontend format since that's what users/agents will provide.

### 3. Draft uses dual-storage model
Data is stored in both campaign columns AND a `draft_metadata` JSONB column. On GET, the response prefers `draft_metadata` values (frontend format) and falls back to column values. This is because:
- Campaign columns use backend enum values
- `draft_metadata` preserves the exact wizard form state including frontend format values

### 4. Update has a subtle overwrite behavior
The `update_campaign_draft` endpoint does `dict.update()` on the existing `draft_metadata`, which REPLACES all keys. If you saved `selected_accounts=["a@b.com"]` and then update with `selected_accounts=null`, the metadata will contain `selected_accounts: null`. Campaign column updates use `if request.field is not None` conditional logic, so they won't overwrite with null. This asymmetry is documented.

### 5. Launch is a massive orchestration (22 steps)
The launch endpoint is the most complex in the codebase — 22 sequential steps in a single transaction. Key behaviors:
- Draft conversion vs new campaign creation
- `resource_owner_id` concept for team member launches (products/senders validated against draft owner, not launcher)
- Brand auto-creation (best-effort, non-fatal)
- CSV recipients + JSON recipients combined and deduplicated at DB level
- Creator seeding from recipient social handles
- Two types of workflow auto-creation (GoAffPro discount, Shopify order drafting)
- Personalization validation at outbox population (can fail the entire transaction)
- Post-commit Slack notification (best-effort)

### 6. Product CRUD is simple but has no update/delete
Products have a simple 3-endpoint CRUD (create, list, get) but NO update or delete endpoints. The `ProductUpdateRequest` model exists but no route uses it. `product_update.py` is a completely different domain (product changelog/feed). The unique constraint `(user_id, name)` means products can't be renamed — users must create a new product.

### 7. product_update.py is NOT product CRUD
The `product_update.py` route file handles a "product updates" feed — essentially a changelog/announcement system. Endpoints: `GET /product-updates/unseen` and `POST /product-updates/mark-seen`. This has nothing to do with updating products. This is a product **feature announcement** system that shows unseen updates to users.

### 8. Email signature handling during draft lifecycle
- **Save**: Creates `EmailSignature` record linked to campaign (if signature provided). Signature belongs to user (not campaign).
- **Update**: Can create, update, or delete the campaign's signature. Deletion happens when `email_signature=""` (empty string). Signature always belongs to campaign OWNER (even if team member is updating).
- **Delete draft**: Signature is cascade-deleted.
- **Launch**: Creates or updates signature. For draft conversion, signature belongs to `resource_owner_id`.

---

## Verification Checklist

- [x] All 5 draft/wizard endpoint handlers read and documented
- [x] All request/response Pydantic models with exact field names, types, and constraints
- [x] All 3 model validators documented (follow_up_templates, product_name, email_draft)
- [x] Campaign type mapping documented (both directions)
- [x] Draft storage model documented (dual column + JSONB)
- [x] All error conditions traced from source (HTTPException raises)
- [x] Launch orchestration steps documented (all 22)
- [x] Integration workflow creation logic documented (GoAffPro + Shopify)
- [x] Product CRUD: all 3 endpoints documented with full schemas
- [x] Product unique constraint documented
- [x] product_update.py identified as separate domain (not product CRUD)
- [x] Permission model documented per endpoint (authenticated, owner-or-assigned)
- [x] Email signature lifecycle documented across all endpoints
- [x] CSV parsing logic documented (email column required, deduplication)
- [x] resource_owner_id concept documented (for team member launches)

---

## New Aspects Discovered

None. All endpoints were already identified in w1-campaigns capability extraction. The `product_update.py` file was noted in the w1 analysis log as needing verification — it's now confirmed as a separate "product updates feed" domain, not product CRUD.

## Tools Fully Specified in This Iteration

| Tool | Section | Status |
|------|---------|--------|
| `cheerful_save_campaign_draft` | Campaign Draft / Wizard | Full OpenAPI spec |
| `cheerful_update_campaign_draft` | Campaign Draft / Wizard | Full OpenAPI spec |
| `cheerful_get_campaign_draft` | Campaign Draft / Wizard | Full OpenAPI spec |
| `cheerful_delete_campaign_draft` | Campaign Draft / Wizard | Full OpenAPI spec |
| `cheerful_launch_campaign` | Campaign Draft / Wizard | Full OpenAPI spec |
| `cheerful_create_product` | Products | Full OpenAPI spec |
| `cheerful_list_products` | Products | Full OpenAPI spec |
| `cheerful_get_product` | Products | Full OpenAPI spec |

**Total**: 8 tools fully specified (5 wizard + 3 products)
