# Gap Matrix — Mama Sita's Campaign

> Consolidated list of every missing feature discovered during stage analysis.
> Sorted by build priority: P0 = blocks campaign, P1 = degrades experience, P2 = nice to have.

| # | Gap | Stage | Impact | Workaround | Priority | Effort | Spec Source |
|---|-----|-------|--------|------------|----------|--------|-------------|
| 1 | `cheerful_connect_ig_account` CE tool not built | Stage 1: Campaign Setup | Blocks connecting IG account — entire IG DM flow cannot start | Direct API call during development; no production workaround | P0 | M (CE tool build after spec-ce-ig-dm-tools complete) | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools pending) |
| 2 | `CampaignSenderCreate` schema not extended for `ig_dm_account_id` | Stage 1: Campaign Setup | `cheerful_create_campaign` rejects IG account as sender with 422 error | Create campaign without sender; insert `campaign_sender` row with `ig_dm_account_id` via direct DB or separate endpoint | P0 | S (schema change + validation update) | `loops/cheerful-ig-dm-spec/analysis/spec/db-migrations.md` §Section 1 |
| 3 | Meta App Review required for Advanced Access permissions | Stage 1: Campaign Setup | Outbound DMs and inbound webhooks blocked for non-test accounts in Development Mode | Test with App Role accounts; submit App Review before campaign launch (budget 1-2 weeks) | P0 (timeline) | External — Meta process | `loops/cheerful-ig-dm-spec/analysis/spec/meta-oauth.md` §1.3 |
| 4 | `cheerful_list_ig_accounts` CE tool not built | Stage 1: Campaign Setup | Cannot verify IG connection status via CE | Query `user_ig_dm_account` table directly | P0 | S (simple CE tool) | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools pending) |
| 5 | No IG DM message template field on campaign model | Stage 1: Campaign Setup | DM outreach message must be stored in `body_template` (email field) — misleading and no DM-specific placeholder docs | Use `body_template` as DM template; document convention; `{name}` placeholder works | P1 | M (add `ig_dm_template` field to campaign model + CE tools) | None (design gap) |
| 6 | `subject_template` required by `cheerful_create_campaign` for IG-only campaigns | Stage 1: Campaign Setup | Must pass meaningless placeholder value; confuses CE interaction | Pass `"[IG DM Campaign]"` as placeholder | P1 | S (make optional, or skip for gifting+IG campaigns) | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` |
| 7 | `cheerful_create_product` and `cheerful_list_products` not built yet | Stage 1: Campaign Setup | Cannot create product records via CE | Direct API call to `POST /products/` or webapp product UI | P1 | S (CE tool build — spec complete) | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §Products |
