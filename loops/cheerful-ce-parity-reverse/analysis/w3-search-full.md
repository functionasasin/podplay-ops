# w3-search-full — Wave 3 Analysis Notes

**Aspect**: w3-search-full
**Date**: 2026-03-01
**Status**: Complete

## Sources Verified

| Source | Path | Lines | Key Findings |
|--------|------|-------|-------------|
| Backend service routes | `projects/cheerful/apps/backend/src/api/route/service.py` | 360 | All 5 existing service endpoints confirmed |
| Service API models | `projects/cheerful/apps/backend/src/models/api/service.py` | 125 | All Pydantic model fields verified |
| CE tools | `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/tools.py` | 562 | All 7 tool implementations + formatters |
| CE API client | `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/api.py` | 217 | API call patterns |
| Webapp lookalike GET | `projects/cheerful/apps/webapp/app/api/campaigns/[id]/lookalike-suggestions/route.ts` | 52 | GET implementation |
| Webapp lookalike PUT | `projects/cheerful/apps/webapp/app/api/campaigns/[id]/lookalike-suggestions/[suggestionId]/route.ts` | 79 | PUT implementation — NO recipient side effect |
| Webapp bulk-accept | `projects/cheerful/apps/webapp/app/api/campaigns/[id]/lookalike-suggestions/bulk-accept/route.ts` | 116 | Full bulk accept logic |
| Webapp bulk-reject | `projects/cheerful/apps/webapp/app/api/campaigns/[id]/lookalike-suggestions/bulk-reject/route.ts` | 79 | Full bulk reject logic |
| TS types | `projects/cheerful/apps/webapp/lib/lookalike-suggestion-types.ts` | 40 | Nullable field types |
| React hook | `projects/cheerful/apps/webapp/app/(mail)/mail/components/creator/hooks/use-lookalike-suggestions.ts` | 117 | Confirmed endpoint URLs |

## Key Corrections vs Wave 2 Spec

### CRITICAL: `cheerful_update_lookalike_suggestion` does NOT add a recipient

Wave 2 spec said: "When status = 'accepted': The webapp implementation checks if a `campaign_recipient` with the same email already exists. If not, it inserts a new recipient."

**Ground truth from source**: The `PUT /api/campaigns/[id]/lookalike-suggestions/[suggestionId]/route.ts` only does:
1. Validates CSRF token
2. Validates status enum (accepted/rejected/pending)
3. Verifies campaign exists (Supabase RLS)
4. Fetches suggestion and checks `campaign_id` matches
5. Updates `status` and `updated_at`
6. Returns updated suggestion row

There is NO recipient insertion in this route. The recipient insertion logic only exists in `bulk-accept/route.ts`.

### Nullable field corrections

TypeScript type `LookalikeSuggestion` (ground truth):
- `seed_creator_id`: `string | null` (Wave 2 spec showed it as non-nullable)
- `seed_platform_handle`: `string | null` (Wave 2 spec showed non-nullable)
- `suggested_follower_count`: `number | null` (Wave 2 spec said "integer (default 0)")
- `apify_run_id`: `string | null` (Wave 2 spec said just "string")

### Error message corrections

Wave 2 spec said suggestion in wrong campaign → 404. **Ground truth**: 400 "Suggestion does not belong to this campaign".

Wave 2 spec said invalid status → 422. **Ground truth**: 400 "Invalid status. Must be accepted, rejected, or pending".

### Bulk-accept `custom_fields` platform bug

The actual code in `bulk-accept/route.ts` line 81-88:
```js
custom_fields: {
  instagram_username: suggestion.suggested_username,  // always "instagram_username"!
  follower_count: suggestion.suggested_follower_count,
  is_verified: suggestion.suggested_is_verified,
  category: suggestion.suggested_category,
  lookalike_suggestion_id: suggestion.id,
  seed_platform_handle: suggestion.seed_platform_handle,
},
```

The code does NOT branch on `suggestion.platform`. For YouTube suggestions, it still writes to `instagram_username` key (not `youtube_username`). This is a bug in the webapp but it's ground truth — the service route implementation should replicate this behavior.

Wave 2 spec described a conditional `instagram_username` vs `youtube_username` based on platform — this does not exist in the code.

## Existing CE Tool Formatter Bugs (Search Domain)

### `_fmt_thread_summary()` (cheerful_search_emails)

Reads incorrect field names:
- `thread.get("sender", "")` → should be `thread.get("sender_email", "")`
- `thread.get("recipient", "")` → should be `str(thread.get("recipient_emails", [""])[0])` or format as comma list
- `thread.get("date", "")` → should be `thread.get("latest_date", "")`
- `thread.get("snippet", "")` → should be `thread.get("matched_snippet", "")`

Also references `thread.get("type", "unknown")` which doesn't exist in `ThreadSearchResult`.

Result: `<sender></sender>`, `<recipient></recipient>`, `<date></date>`, `<snippet></snippet>` are always empty in the CE output.

### `_fmt_similar_email()` (cheerful_find_similar_emails)

Reads incorrect field names:
- `result.get("summary", "")` → should be `result.get("thread_summary", "")`
- `result.get("reply_text", "")` → should be `result.get("sent_reply_text", "")`
- `result.get("subject", "")` → `SimilarEmailResult` has no subject field

Result: `<summary></summary>`, `<reply-text></reply-text>`, `<subject></subject>` are always empty. The tool effectively returns only similarity score and thread_id.

### `api.py` list_campaign_creators() missing `offset`

The `list_campaign_creators()` API function in `api.py` does not include `offset` parameter in its call to the backend, even though the backend accepts `offset: int = Query(0, ge=0)`. The CE tool input model also lacks `offset`.

## Confirmed Working (No Changes Needed)

- `cheerful_list_campaigns`: formatter and API call correct
- `cheerful_get_thread`: formatter and API call correct (formatter reads from `messages` list correctly)
- `cheerful_search_campaign_creators`: logic correct, but no user_id filtering in backend (documented as security note)

## Decisions Made

1. Documented all formatter bugs in spec as "Existing Tool Bug Report" section — not fixing them in this spec (that's an implementation task)
2. Kept bulk-accept `custom_fields` as-is (platform-ignorant `instagram_username` key) because that's ground truth
3. The `cheerful_update_lookalike_suggestion` description now clearly states it's a status-only update with no recipient side effect
4. Removed the "accept reversal doesn't remove recipient" edge case from `cheerful_update_lookalike_suggestion` since that tool doesn't add recipients in the first place — only relevant for `bulk_accept` then revert
