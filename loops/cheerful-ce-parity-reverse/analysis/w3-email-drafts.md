# w3-email-drafts — Wave 3 Analysis Notes

**Aspect**: w3-email-drafts
**Date**: 2026-03-01
**Status**: Complete

## Scope

Fleshed out 17 email domain tools (the remaining tools not covered by w3-email-threads):

- Draft Management: `cheerful_get_thread_draft`, `cheerful_create_thread_draft`, `cheerful_update_thread_draft`
- Email Sending: `cheerful_send_email`
- Scheduled Email Dispatch: `cheerful_schedule_email`, `cheerful_list_scheduled_emails`, `cheerful_cancel_scheduled_email`, `cheerful_reschedule_email`
- Email Signatures: `cheerful_list_email_signatures`, `cheerful_get_email_signatures_for_reply`, `cheerful_create_email_signature`, `cheerful_get_email_signature`, `cheerful_update_email_signature`, `cheerful_delete_email_signature`
- Bulk Draft Edit: `cheerful_bulk_edit_drafts`
- AI Email Improvement: `cheerful_improve_email_content`
- Thread Summary: `cheerful_get_thread_summary`

## Source Files Verified

| Source File | Key Findings |
|-------------|-------------|
| `route/draft.py` | Permission: owner-only (NOT assigned-member). DraftCreateRequest has `draft_subject: str` and `draft_body_text: str` as REQUIRED (not optional as the wave 2 spec stated). Upsert semantics for create/update. 409 version_mismatch format verified. |
| `route/email.py` | `SendEmailRequest` fields verified. Permission model: owner vs `can_send_via_campaign_assignment` for team members. Side effects on thread state. |
| `route/email_dispatch.py` | All 4 dispatch tools verified. `EmailDispatchStatus` enum: pending, processing, sent, failed, cancelled. `dispatch_at` timezone validation via `ZoneInfo`. |
| `route/email_signature.py` | All 6 signature CRUD tools verified. `validate_signature_length()` for 10,000 char limit. `sanitize_signature_html()` for content sanitization. Campaign ownership check uses 404 (opaque). |
| `route/bulk_draft_edit.py` | `BulkDraftEditWorkflow` name confirmed. Permission: campaign owner-only. Response: `{workflow_id, message}`. |
| `models/api/email_signature.py` | Full field list: id, user_id, name, content, is_default, campaign_id, campaign_name, is_enabled, created_at, updated_at. |
| `models/api/draft.py` | `DraftResponse` fields: gmail_thread_state_id, internal_date, draft_subject, draft_body_text, source, alternative_drafts. |
| `app/api/improve-email-content-stream-send-textbox/route.ts` | Verified: webapp-only Next.js route calling OpenAI directly. Actions: shorten, expand, friendly, professional, casual, custom. AI rules: merge tag preservation, no hyphens/em dashes, no bracketed placeholders. Uses `gpt-4.1-mini`. |
| `app/api/campaigns/[id]/generate-summary/route.ts` | This is campaign-level summary, NOT thread summary. Confirmed no thread summary backend endpoint exists. |

## Key Corrections from Wave 2

1. **Draft Management permissions**: Wave 2 spec said "owner or assigned team member" — CORRECTED to "owner-only" based on source code check (`thread_state.user_id != user_id` → 403).

2. **`cheerful_create_thread_draft` parameters**: Wave 2 said `draft_subject` and `draft_body_text` are optional (nullable). CORRECTED — they are required strings in `DraftCreateRequest` (Pydantic fields without default).

3. **`cheerful_improve_email_content` TBD resolved**: Confirmed it's webapp-only (no backend endpoint). CE must implement natively using its own AI model.

4. **`cheerful_get_thread_summary` TBD resolved**: Confirmed no backend endpoint exists. CE-native implementation required (fetch thread → Claude summarization). The campaign-level summary endpoint (`POST /api/campaigns/{id}/generate-summary`) is a different tool (in campaigns domain).

## Edge Cases Discovered

- SMTP thread IDs (angle-bracket format) are auto-detected by `_is_smtp_thread_id()` in the backend
- Draft version-mismatch 409 response includes `latest_gmail_thread_state_id` and `latest_internal_date` for agent auto-retry
- Email signature `is_default` mutex enforced server-side via `repo.clear_default_for_user()`
- Email signature creation for campaigns: campaign check uses 404 NOT 403 (opaque access control)
- Bulk draft edit only affects LLM drafts, NOT human-edited drafts
- `cheerful_improve_email_content`: must preserve `{merge_tags}` and never use hyphens/em dashes per webapp source

## Tools: Final Count

| Sub-domain | Existing | New | Total |
|-----------|----------|-----|-------|
| Thread Listing & Filtering | 3 | 1 | 4 |
| Thread Operations | 0 | 2 | 2 |
| Attachments | 0 | 1 | 1 |
| Draft Management | 0 | 3 | 3 |
| Email Sending | 0 | 1 | 1 |
| Scheduled Email Dispatch | 0 | 4 | 4 |
| Email Signatures | 0 | 6 | 6 |
| Bulk Draft Edit | 0 | 1 | 1 |
| AI Email Improvement | 0 | 1 | 1 |
| Thread Summary | 0 | 1 | 1 |
| **TOTAL** | **3** | **21** | **24** |
