# Campaigns — Capability Extraction

**Aspect**: w1-campaigns
**Sources**: `spec-backend-api.md`, `spec-webapp.md`, actual source code (`campaign.py`, `campaign_launch.py`, `product.py`, `campaign_enrichment.py`, `campaign_workflow.py`, `campaign_workflow_execution.py`)

---

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| `cheerful_list_campaigns` | List user's campaigns via `GET /api/service/campaigns` | READ only — no stats, no filters beyond user_id |

**Gap**: Only 1 of the 7 existing tools is campaign-domain. It returns basic campaign metadata. No write tools, no sub-resource tools, no campaign detail tools exist.

---

## Frontend/Backend Capabilities (Not Yet in Context Engine)

### Campaign Core CRUD

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | Create campaign | `/campaigns/` | POST | name, campaign_type (CampaignType enum), product_id, product_ids, senders (gmail_account_id or smtp_account_id), recipients (email, name, custom_fields), status (default ACTIVE), is_external, automation_level, subject_template, body_template, agent_name_for_llm, rules_for_llm, goal_for_llm, frequently_asked_questions_for_llm, sample_emails_for_llm, is_follow_up_enabled, follow_up_gap_in_days, max_follow_ups, follow_up_templates, is_lookalike_suggestions_enabled, discovery_enabled, discovery_config, google_sheet_url, google_sheet_tab_name, google_sheet_data_instructions, google_sheet_columns_to_skip, cc_emails, slack_channel_id, image_url | CampaignResponse |
| 2 | List campaigns | `/campaigns/` | GET | include_stats (bool), campaign_ids (uuid[]) | CampaignResponse[] (with optional sent_count, thread_count, pending_count, failed_count, total_recipients) |
| 3 | Get campaign by ID | `/campaigns/{campaign_id}` | GET | campaign_id, include_sender_details (bool) | CampaignResponse (with optional sender_details including thread_count per sender) |
| 4 | Update campaign | `/campaigns/{campaign_id}` | PUT | All CampaignUpdateRequest fields — all optional. Status transitions: ACTIVE→COMPLETED auto-cancels pending outbox/follow-ups; COMPLETED→ACTIVE reactivates | CampaignResponse |
| 5 | Delete campaign | `/campaigns/{campaign_id}` | DELETE | campaign_id | 204 No Content. Cascades to recipients, senders, threads, creators, thread_links, outbox, workflows, etc. |
| 6 | Duplicate campaign | `/campaigns/{campaign_id}/duplicate` | POST | campaign_id | CampaignResponse (new campaign as DRAFT with copied config, senders, workflows, signature) |

### Campaign Types (CampaignType enum — verified from source)

| Enum Value | String | Frontend Maps From |
|------------|--------|-------------------|
| `GIFTING` | `gifting` | `seeding`, `gifting` |
| `PAID_PROMOTION` | `paid_promotion` | `paid` |
| `SALES` | `sales` | `sales` |
| `CREATOR` | `creator` | `creator` |
| `OTHER` | `other` | (fallback) |

### Campaign Statuses (CampaignStatus enum — verified from source)

| Enum Value | String |
|------------|--------|
| `ACTIVE` | `active` |
| `PAUSED` | `paused` |
| `DRAFT` | `draft` |
| `COMPLETED` | `completed` |

---

### Campaign Wizard / Draft System

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 7 | Save wizard draft | `/campaigns/draft` | POST | CampaignDraftSaveRequest: campaign_name, campaign_type, is_external, product_id, product_ids, product_name, product_description, additional_products, subject_template, body_template, campaign_goal, campaign_faqs, sample_emails, follow_up_templates, google_sheet_url, google_sheet_tab_name, tracking_rules, selected_accounts, cc_emails, creators_csv_data, creators_csv_headers, search_creators, search_merged_emails, email_signature, email_signature_enabled | `{campaign_id, message}` |
| 8 | Update wizard draft | `/campaigns/draft/{campaign_id}` | PUT | Same as save + campaign_id path param | `{campaign_id, message}` |
| 9 | Load wizard draft | `/campaigns/draft/{campaign_id}` | GET | campaign_id | CampaignDraftResponse (all stored draft fields including product info, CSV data, search creators) |
| 10 | Delete wizard draft | `/campaigns/draft/{campaign_id}` | DELETE | campaign_id | 204 No Content |
| 11 | Launch campaign | `/campaigns/launch` | POST | multipart/form-data: campaign_data (JSON CampaignLaunchRequest), csv_file (optional), image_file (optional). CampaignLaunchRequest: draft_campaign_id, campaign_type, product_name, product_description, product_url, existing_product_id, additional_product_ids, is_external, campaign_name, campaign_goal, campaign_faqs, sample_emails, tracking_rules, google_sheet_url, google_sheet_tab_title, selected_accounts, email_draft (subject+body), recipients, follow_up_templates, integrations, cc_emails, is_lookalike_suggestions_enabled, has_creators_pending_enrichment, automation_level, slack_channel_id, email_signature, email_signature_enabled | `{campaign_id, status: "launched", workflow_id}` |

---

### Campaign Recipients

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 12 | Add recipients (bulk) | `/campaigns/{campaign_id}/recipients` | POST | recipients[] (email, name, custom_fields). Idempotent by (campaign_id, email). Auto-populates outbox queue. | CampaignRecipientResponse[] |
| 13 | Add recipients from search | `/campaigns/{campaign_id}/recipients-from-search` | POST | recipients[] (email, name, custom_fields, social_media_handles[]). Creates both campaign_recipient + campaign_creator. Starts enrichment for creators without email. | RecipientFromSearchResponse[] |
| 14 | Upload recipients CSV | `/campaigns/{campaign_id}/recipients/csv` | POST | multipart: file (CSV), populate_queue (bool, default true). Requires email column. Gifting/paid_promotion require social profile columns. | `{added_count, skipped_count, invalid_count, recipients[]}` |
| 15 | Get unified recipients | `/campaigns/{campaign_id}/unified-recipients` | GET | limit (default 50, max 10000), offset, status[], include_all_contacts (bool), search (text), sort_by (default created_at), sort_dir (asc/desc), social_platforms[], interaction_period, has_notes (bool), post_status[], has_address (bool), has_discount_code (bool) | `{rows: UnifiedRecipientResponse[], total}` |

### Unified Recipient Response Fields (verified from source)

- id, email, name, outbox_status, gifting_status, paid_promotion_status, outreach_status, enrichment_status
- gifting_address, gifting_discount_code, sent_at, latest_email_at
- social_media_handles[], custom_fields, notes_history[], source
- recipient_id, creator_id, match_confidence, created_at
- role, talent_manager_name, talent_manager_email, talent_agency, confidence_score
- latest_interaction_at, latest_interaction_campaign_id, latest_interaction_campaign_name
- post_count, post_last_checked_at, post_tracking_ends_at
- flags (wants_paid, wants_paid_reason, has_question, has_question_reason, has_issue, has_issue_reason)

---

### Campaign Senders

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 16 | Update campaign sender | `/campaigns/{campaign_id}/senders` | PATCH | old_sender_email, new_sender_email. Swaps Gmail account on campaign_sender record. | `{success, affected_emails, message}` |
| 17 | Remove campaign sender | `/campaigns/{campaign_id}/senders` | DELETE | sender_email. Validates at least 1 sender remains. Deletes associated outbox entries. | `{success, deleted_emails_count, remaining_senders, message}` |

---

### Campaign Outbox

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 18 | Populate outbound queue | `/campaigns/{campaign_id}/outbound` | POST | cc_emails[] (optional). Idempotent — only creates entries for recipients not already queued. Round-robin sender distribution. Validates placeholders. | `{status, message, entries_created}` |
| 19 | Get outbox table | `/campaigns/{campaign_id}/outbox-table` | GET | limit (default 100, max 1000), offset | `{rows: OutboxTableRow[], definitions: ColumnDefinition[], total}` |

### Outbox Queue Status (CampaignOutboxQueueStatus enum — verified from source)

| Enum Value | String |
|------------|--------|
| `PENDING` | `pending` |
| `PROCESSING` | `processing` |
| `SENT` | `sent` |
| `FAILED` | `failed` |
| `CANCELLED` | `cancelled` |

### OutboxTableRow Fields

- id, email, recipient_name, status, sent_at, error_message, sender_email, custom_fields, created_at, updated_at

---

### Campaign Signature

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 20 | Get campaign signature | `/campaigns/{campaign_id}/signature` | GET | campaign_id | `{signature: html_string|null, enabled: bool}` |
| 21 | Update campaign signature | `/campaigns/{campaign_id}/signature` | PUT | signature (HTML, max 10000 chars, sanitized), enabled (bool) | `{signature, enabled}` |

---

### Campaign Merge Tags & Template Helpers

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 22 | Get merge tags | `/campaigns/{campaign_id}/merge-tags` | GET | campaign_id | `{headers: string[]}` — sorted unique custom field keys from all recipients |
| 23 | Get required columns | `/campaigns/{campaign_id}/required-columns` | GET | campaign_id | `{required_columns: string[]}` — columns needed for CSV based on template placeholders |

---

### Campaign Signatures (Global — /campaigns/signatures)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 24 | List campaign signatures | `/campaigns/signatures` | GET | — | CampaignSignatureListResponse — all signatures user can use across campaigns |

---

### Campaign Google Sheets Validation

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 25 | Validate campaign sheet | `/campaigns/{campaign_id}/validate-sheet` | POST | campaign_id (reads google_sheet_url from campaign) | `{success: bool, message}`. Clears error on success, sets error on failure. |

---

### Campaign Client Summary (AI)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 26 | Generate client summary | `/campaigns/{campaign_id}/generate-summary` | POST | campaign_id. Optional request body (currently no documented fields used). Only for non-external campaigns. | `{campaign_id, campaign_name, generated_at, summary_text, total_creators, stats}` |

---

### Products (Campaign Sub-Resource)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 27 | Create product | `/products/` | POST | name, description, url_to_scrape | ProductResponse |
| 28 | List products | `/products/` | GET | — | ProductResponse[] |
| 29 | Get product | `/products/{product_id}` | GET | product_id | ProductResponse |

---

### Campaign Enrichment (Domain 5 — campaign_enrichment.py)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 30 | Get enrichment status | `/v1/campaigns/{campaign_id}/creators/enrichment-status` | GET | campaign_id | Creators in pending/enriching state only |
| 31 | Override creator email | `/v1/campaigns/{campaign_id}/creators/{creator_id}/override-email` | POST | email | `{creator_id, email, queued: bool}` |

---

### Campaign Workflows (Domain 3 — campaign_workflow.py)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 32 | Create workflow | `/v1/campaigns/{campaign_id}/workflows` | POST | name, instructions, tool_slugs[], config, output_schema, is_enabled | CampaignWorkflowResponse |
| 33 | List workflows | `/v1/campaigns/{campaign_id}/workflows` | GET | campaign_id | CampaignWorkflowResponse[] |
| 34 | Get workflow | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | GET | campaign_id, workflow_id | CampaignWorkflowResponse |
| 35 | Update workflow | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | PATCH | name, instructions, tool_slugs, config, output_schema, is_enabled (all optional) | CampaignWorkflowResponse |
| 36 | Delete workflow | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | DELETE | campaign_id, workflow_id | 204 |

---

### Campaign Workflow Executions (Domain 4 — campaign_workflow_execution.py)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 37 | List workflow executions | `/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | GET | campaign_id, workflow_id | CampaignWorkflowExecutionResponse[] |
| 38 | Get latest thread execution | `/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | GET | thread_state_id, workflow_id | `{workflow_id, executed_at, status, output_data}` |

---

## Summary

**Total campaign-domain capabilities identified: 38**

| Sub-domain | Count | Existing CE Tools | Gap |
|-----------|-------|-------------------|-----|
| Campaign CRUD | 6 | 1 (list only) | 5 new tools |
| Draft/Wizard | 5 | 0 | 5 new tools |
| Recipients | 4 | 0 | 4 new tools |
| Senders | 2 | 0 | 2 new tools |
| Outbox | 2 | 0 | 2 new tools |
| Signatures | 3 | 0 | 3 new tools |
| Merge Tags/Templates | 2 | 0 | 2 new tools |
| Sheet Validation | 1 | 0 | 1 new tool |
| Client Summary | 1 | 0 | 1 new tool |
| Products | 3 | 0 | 3 new tools |
| Enrichment | 2 | 0 | 2 new tools |
| Workflows | 5 | 0 | 5 new tools |
| Workflow Executions | 2 | 0 | 2 new tools |
| **TOTAL** | **38** | **1** | **37 new tools** |

### Discovered Aspects Not in Original Frontier

During source code analysis, the following were found that should be noted:

1. **Product scraping** (`POST /products/scrape` via Firecrawl) — referenced in webapp spec but not seen as a separate route file. May be internal or in a different route. Needs verification in w1-integrations or w1-search.
2. **Brand auto-creation** from product URL during launch — uses BrandfetchService internally. Not a separate endpoint.
3. **Sheet creator sync** — Augmentum-only internal Temporal workflow triggered on campaign create/update with google_sheet_url. Not a user-facing endpoint.
4. **`product_update.py`** route file (77 lines) — separate from product.py, may have update/delete endpoints. Needs verification.
5. **`instantly.py`** route file (294 lines) — Instantly integration. Not covered in original frontier aspects. May need a new aspect.
