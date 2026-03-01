# w3-integrations-full — Analysis Working Notes

## Sources Verified

8 backend route files verified (full source read):
1. `src/api/route/smtp_account.py` (626 lines) — SMTP CRUD + bulk import with IMAP verification
2. `src/api/route/google_sheets.py` (60 lines) — Single tab listing endpoint, no auth
3. `src/api/route/shopify.py` (255 lines) — GoAffPro product listing + order creation
4. `src/api/route/instantly.py` (295 lines) — Composio-brokered Instantly lifecycle (status/connect/disconnect/test)
5. `src/api/route/slack.py` (577 lines) — Digest trigger + interactions webhook (approve/skip/edit orders)
6. `src/api/route/youtube.py` (291 lines) — AI-powered lookalike search with Apify + LLM
7. `src/api/route/brand.py` (55 lines) — Brandfetch brand detection, graceful failure
8. `src/api/route/user.py` (161 lines) — Gmail accounts + connected accounts (unified listing)

6 Pydantic model files verified:
1. `src/models/api/smtp_account.py` (160 lines) — Full CRUD + bulk import models with validation
2. `src/models/api/google_sheets.py` (16 lines) — GoogleSheetTabResponse/GoogleSheetTabsResponse
3. `src/models/api/shopify.py` (76 lines) — Product/variant/order models + ShopifyShippingAddress
4. `src/models/api/instantly.py` (32 lines) — Connection status/connect/disconnect/test models
5. `src/models/api/user.py` (48 lines) — UserSettingResponse, UserGmailAccountResponse, ConnectedAccountResponse
6. `src/models/database/account_type.py` (11 lines) — AccountType enum: "gmail", "smtp"

1 service route file verified:
1. `src/api/route/service.py` (360 lines) — Confirmed ZERO integration service routes exist

## Corrections from Wave 2

### Correction 1: SMTP Delete is HARD DELETE, not soft-delete
- **Wave 2 said**: "Delete (deactivate) an SMTP account"
- **Actual code**: `db.delete(account)` at `smtp_account.py:618` — this is a permanent row deletion
- **Impact**: Users should be warned that deletion is irreversible

### Correction 2: Gmail accounts DO have display_name in ConnectedAccountResponse
- **Wave 2 said**: "display_name is null for Gmail accounts"
- **Actual code**: `display_name=acc.gmail_email` at `user.py:139` — set to the Gmail email address
- **Impact**: display_name is never null for Gmail accounts in the connected accounts response

### Correction 3: Bulk import provider defaults to "gmail"
- **Wave 2 said**: `provider` is required
- **Actual code**: `provider: BulkSmtpProvider = BulkSmtpProvider.GMAIL` — defaults to "gmail" if omitted
- **Impact**: Parameter is optional with default, not required

### Correction 4: SMTP duplicate check is user-scoped
- **Not explicitly stated in Wave 2**
- **Actual code**: `if existing and existing.user_id == user_id` at `smtp_account.py:96` — only checks same-user duplicates
- **Impact**: Different users CAN have SMTP accounts with the same email address

### Correction 5: BulkSmtpAccountEntry has more optional fields
- **Wave 2 incomplete**: Only listed major fields
- **Actual code**: Also includes `smtp_username`, `smtp_use_tls`, `imap_username`, `imap_use_ssl` as optional fields per account entry
- **Impact**: Custom provider accounts can fine-tune all connection parameters

## Key Discoveries

### No Service Routes Exist
- Verified `service.py` — only covers campaigns, threads/search, threads/{id}, rag/similar, campaign creators, and global creator search
- ALL 18 integration tools need brand new `/api/service/*` routes
- This is the largest service route gap across all domains

### Instantly Uses Email, Not user_id
- `current_user["email"].lower()` is used as the Composio entity_id (`instantly.py:85,108,199,254`)
- New service routes (which receive `user_id` from CE) will need to resolve user email from DB first
- This is unique to Instantly — all other endpoints use `user_id` directly

### Slack Interactions Webhook is Complex
- 577 lines in `slack.py` — mostly webhook handling for order approve/skip/edit
- The webhook handles 3 action types + modal submissions for order editing
- This is NOT a CE tool (incoming webhook, not user-initiated)
- But the CE tool `cheerful_trigger_slack_digest` kicks off the process that creates the interactive Slack messages

### YouTube Models Defined Inline
- Request/response models (`YouTubeLookalikeRequest`, `YouTubeSeedChannelResponse`, `YouTubeSimilarChannelResponse`, `YouTubeLookalikeResponse`) are defined in the route file itself (`youtube.py:27-93`)
- Internal models (`YouTubeChannelDetails`, `YouTubeChannelFinderResult`, `YouTubeLookalikeResult`) are in `src/models/api/youtube.py`
- This split means the route file is the source of truth for API contracts

### Brand Lookup is Completely Graceful
- All exceptions caught at `brand.py:47-54`
- No HTTP errors thrown on failure — always returns 200 with null fields
- Uses Brandfetch service with DB caching (`get_or_create_brand`)

### Google Sheets has NO Authentication
- Confirmed: no `Depends(get_current_user)` or `Depends(verify_service_api_key)` on the endpoint
- Uses gspread service account to access spreadsheets
- Service route should still require CE auth for audit trail

## Tool Verification Checklist

All 18 tools verified against source:

- [x] cheerful_list_gmail_accounts — params, returns, errors match user.py:77-91
- [x] cheerful_list_connected_accounts — params, returns, errors match user.py:94-161; CORRECTED display_name for Gmail
- [x] cheerful_list_smtp_accounts — params, returns match smtp_account.py:501-511
- [x] cheerful_get_smtp_account — params, returns, errors match smtp_account.py:514-538
- [x] cheerful_create_smtp_account — params, returns, errors match smtp_account.py:78-173; documented reactivation
- [x] cheerful_update_smtp_account — params, returns, errors match smtp_account.py:541-591; exclude_unset behavior
- [x] cheerful_delete_smtp_account — CORRECTED: hard delete, not soft-delete; match smtp_account.py:594-625
- [x] cheerful_bulk_import_smtp_accounts — CORRECTED provider default; full validation rules from model validator; IMAP verification details
- [x] cheerful_get_google_sheet_tabs — params, returns, errors match google_sheets.py:18-59; confirmed no auth
- [x] cheerful_list_shopify_products — params, returns, errors match shopify.py:30-112; limit ge=1 le=100
- [x] cheerful_create_shopify_order — params, returns, all 11 error conditions match shopify.py:115-255; documented KeyError handler
- [x] cheerful_get_instantly_status — returns, errors match instantly.py:78-93; confirmed email entity_id
- [x] cheerful_connect_instantly — params, returns, all 8 error conditions match instantly.py:96-188; Composio SDK details
- [x] cheerful_disconnect_instantly — returns, all 5 error conditions match instantly.py:191-244; Composio HTTP DELETE
- [x] cheerful_test_instantly — returns, errors match instantly.py:247-294; INSTANTLY_LIST_CAMPAIGNS tool details
- [x] cheerful_trigger_slack_digest — params, returns, errors match slack.py:523-577; Temporal workflow details
- [x] cheerful_find_youtube_lookalikes — params (with ge/le), returns (all fields), errors (5 categories), side effects match youtube.py:137-290
- [x] cheerful_lookup_brand — params, returns, graceful error handling match brand.py:25-54
