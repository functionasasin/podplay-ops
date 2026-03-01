# Synthesis: Gap Matrix — Build Roadmap

> **What this is**: The build roadmap derived from analyzing every stage of a real Mama Sita's gifting campaign through Cheerful's Context Engine. Every gap was discovered bottom-up from concrete stage requirements, not top-down from a feature wishlist.
>
> **How to use it**: Build Sprints 0–4 to run this campaign. Sprints 5–8 are experience improvements that make the campaign feel like a product rather than a prototype.

---

## Executive Summary

| Priority | Total Items | Buildable | Config-Only | Architectural (Cannot Build) | External Process |
|----------|-------------|-----------|-------------|------------------------------|-----------------|
| P0 — Campaign Blocker | 25 | 15 | 2 | 2 | 6 |
| P1 — Experience Degrader | 28 | 28 | 0 | 0 | 0 |
| P2 — Nice to Have | 13 | 5 | 0 | 5 (Meta limits) | 1 (org decision) |
| **Total** | **66** | **48** | **2** | **7** | **7** |

> **Note**: Some P0 items share a single fix (e.g., Gaps 30, 31, 36 all resolve via one `cheerful_update_campaign_creator` CE tool build). The 15 "buildable P0" items represent ~13 distinct build tasks. Sprints 1–4 deliver all of them.

### The Campaign-Runnable Minimum

The campaign can complete all 10 stages — with workarounds for architectural constraints — once these 13 tasks are done:

| # | Task | Gaps Resolved | Effort |
|---|------|---------------|--------|
| 1 | Submit Meta App Reviews (IG DM + mentions + hashtag) | 3, 53, 54 | XS (process) |
| 2 | Configure `INFLUENCER_CLUB_API_KEY` env var | 12 | XS |
| 3 | Configure `APIFY_API_TOKEN` env var | 21 | XS |
| 4 | Add `ig_dm_account_id` field to `CampaignSenderCreate` schema | 2 | S |
| 5 | Build `cheerful_connect_ig_account` + `cheerful_list_ig_accounts` CE tools | 1, 4 | S–M |
| 6 | Build `cheerful_update_campaign` CE tool | CE-update | M |
| 7 | Build creator search CE tools (`keyword`, `similar`) + service routes | 8, 9 | M |
| 8 | Build creator list CRUD CE tools (create, list, add-from-search) + service routes | 10, 11 | M |
| 9 | Build 8 vetting CE tools (`list_items`, `enrich`, `profile`, `remove`, `add`, `transfer`) | 15 | L |
| 10 | Build `cheerful_generate_outreach_list` CE tool | 23 | S |
| 11 | Build `cheerful_mark_dm_sent` CE tool + add `dm_sent_at` schema field | 24 | S |
| 12 | Build `cheerful_update_campaign_creator` CE tool + add `dm_status` enum + write path for `gifting_address` | 30, 31, 36 | M |
| 13 | Build 4 post CE tools (`list_posts`, `list_creator_posts`, `refresh_creator_posts`, `delete_post`) | post-tools | M |

**Sprint 0** (no code): Tasks 1–3. Start Day -14. Meta App Review is the long pole.
**Sprints 1–4** (code): Tasks 4–13. ~5–6 engineering weeks of focused work.

After Sprints 0–4 complete, the Mama Sita's campaign runs from Stage 1 through Stage 10 using CE + documented workarounds. The UGC capture layer (Stage 9) is excluded from the minimum — it requires Sprints 5–6 and its own App Reviews.

---

## Architectural Constraints — Cannot Be Built

These are permanent Meta API limitations. Document them; don't roadmap them.

| Gap | Constraint | Campaign Impact | Workaround |
|-----|-----------|-----------------|------------|
| 22 | Meta API does not allow cold outbound DMs to non-followers | Phase B outreach (62 DM sends) is 100% manual from Instagram app | Brand rep sends manually; Cheerful prepares personalized message queue (`cheerful_generate_outreach_list`) |
| 35 | Expired 24h window cannot be re-opened via API — requires new user-initiated message | If brand rep misses a 24h window, that thread is dead via API | Morning batch sessions; `IgDmReconciliationWorkflow` alerts at <2h remaining |
| 58 | Instagram /tags endpoint does not expose Reels | Photo-tagged Reels not captured via Layer 1C (UGCTagPollingWorkflow) | Stage 8 Apify+LLM catches Reels for opted-in creators |
| 61 | Instagram public API does not expose saves for non-owned posts | Highest-signal food engagement metric permanently unavailable | Note in ROI report; use Reel view_count + like rate as proxies |
| 62 | Story Insights (views, exit rate) only accessible to story author — @mentioned brands cannot access | 9 Story pieces captured but zero engagement data | Count Stories in UGC library; note "Story impressions not measurable" |
| 27 | DM request acceptance unobservable — no webhook for "request accepted" event | Cannot distinguish "ignoring DM" from "DM in pending requests, not yet seen" | All non-responders treated uniformly after 5 days |

---

## Build Roadmap — Sprint Plan

### Sprint 0: Prerequisites (Day -14 → Day 0, No Code)

Start these before writing a single line of code. The Meta App Reviews are the critical path — they take weeks and run in parallel with all development.

| Task | Gaps | Notes |
|------|------|-------|
| Submit Meta App Review: `instagram_messaging`, `pages_messaging` | 3 | Required for IG DM outreach + inbound. Budget 2–7 business days after all materials submitted. |
| Submit Meta App Review: `instagram_manage_comments` | 53 | Required for feed @mention capture (Stage 9 Layer 1B + 1C). Submit simultaneously with IG DM review. |
| Submit Meta App Review: `instagram_public_content_access` | 54 | Required for hashtag monitoring (Stage 9 Layer 2). **This is the longest review: 4–6 weeks**. Must start at Day 0 of development, not Day 0 of campaign. |
| Configure `INFLUENCER_CLUB_API_KEY` in backend env | 12 | Obtain from IC dashboard; all discovery tools return 503 without it. |
| Configure `APIFY_API_TOKEN` in backend env | 21 | Obtain from Apify console; `cheerful_get_creator_profile` returns 500 without it. |

---

### Sprint 1: Campaign & IG Account Setup (Week 1, ~3–5 days)

Unblocks Stage 1 (Campaign Setup). Must complete before any campaign can connect to Instagram.

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Add `ig_dm_account_id` field to `CampaignSenderCreate` schema and validation | 2 | S | `loops/cheerful-ig-dm-spec/analysis/spec/db-migrations.md` §1 |
| Build `cheerful_connect_ig_account` CE tool — Meta OAuth URL generation + token exchange + webhook subscription | 1 | M | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools) |
| Build `cheerful_list_ig_accounts` CE tool — query `user_ig_dm_account` table | 4 | S | `loops/cheerful-ig-dm-spec/PROMPT.md` (spec-ce-ig-dm-tools) |
| Build `cheerful_update_campaign` CE tool + service route (`PATCH /api/service/campaigns/{id}`) | CE-update | M | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_update_campaign` |

**Sprint 1 exit criteria**: Brand rep can create a campaign, connect @mamasitasmanila, and toggle `post_tracking_enabled` all via CE (Slack).

---

### Sprint 2: Creator Discovery Tools (Week 1–2, ~5–7 days)

Unblocks Stage 2 (Creator Discovery) and Stage 3 (Creator Vetting). The largest sprint in terms of new service routes.

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Build `cheerful_search_creators_by_keyword` CE tool + service route (`POST /v1/creator-search/keyword`) | 8 | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Build `cheerful_search_similar_creators` CE tool + service route (`POST /v1/creator-search/similar`) | 9 | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator Search & Discovery |
| Build creator list CRUD: `cheerful_create_creator_list`, `cheerful_list_creator_lists` CE tools + 2 service routes | 10 (partial) | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator Lists — CRUD |
| Build `cheerful_add_search_creators_to_list` CE tool + service route (`POST /v1/lists/{list_id}/creators/from-search`) | 11 | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Build 8 vetting CE tools: `cheerful_list_creator_list_items`, `cheerful_start_creator_enrichment`, `cheerful_get_enrichment_workflow_status`, `cheerful_enrich_creator`, `cheerful_remove_creator_from_list`, `cheerful_add_creators_to_list`, `cheerful_add_list_creators_to_campaign`, `cheerful_get_creator_profile` | 15 | L | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items + Creator Profile |

**Sprint 2 exit criteria**: Brand rep can search Influencer Club by keyword, create a creator list, add search results, run batch enrichment, view profiles, and transfer a shortlist to a campaign — all via CE.

---

### Sprint 3: Campaign Creator Management (Week 2, ~3–4 days)

Unblocks Stages 4 (Outreach), 5 (Responses), 6 (Negotiation). Core "campaign CRM" write path.

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Build `cheerful_generate_outreach_list` CE tool — renders personalized message per campaign creator from `body_template` | 23 | S | No existing spec — needs design |
| Add `dm_sent_at: datetime \| null` field to `campaign_creator` schema | 24 (partial) | XS | No existing spec — schema addition |
| Build `cheerful_mark_dm_sent` CE tool — updates `campaign_creator.dm_sent_at` for one creator | 24 | S | No existing spec — needs build |
| Add `dm_status` enum values to `campaign_creator` (`interested`, `declined`, `address_received`, `confirmed`) | 30 (partial) | S | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §status enum extension |
| Build `cheerful_update_campaign_creator` CE tool + service route (`PATCH /api/service/campaigns/{id}/creators/{creator_id}`) — write gifting_status, dm_status, gifting_address | 30, 31, 36 | M | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` §`cheerful_list_campaign_recipients` (field confirmed) |
| Build `cheerful_extract_address_from_ig_dm` CE tool — LLM parses address from thread body + stores on `campaign_creator` | 31 (full AI flow) | M | No existing spec — needs design |

**Sprint 3 exit criteria**: Brand rep can generate the 62-message outreach queue, record sends, categorize responses, and update creator status (interested/confirmed) and store shipping addresses — all via CE. Stage 7 (shipping export via `cheerful_list_campaign_recipients(status=["READY_TO_SHIP"], has_address=true)`) becomes fully automated.

---

### Sprint 4: Post Tracking Access (Week 2–3, ~2–3 days)

Unblocks Stage 8 (Content Tracking). The PostTrackingWorkflow already exists — this sprint is purely CE tool exposure + minor schema work.

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Build `cheerful_list_posts` CE tool + service route (`GET /api/service/campaigns/{id}/posts`) with `campaign_id` filter | post-tools, 64 | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Posts |
| Build `cheerful_list_creator_posts` CE tool + service route | post-tools | M | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Posts |
| Build `cheerful_refresh_creator_posts` CE tool — manually triggers Apify re-fetch for one creator | post-tools | S | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Posts |
| Build `cheerful_delete_post` CE tool — removes false-positive post from `creator_post` | post-tools | S | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Posts |

**Sprint 4 exit criteria**: Brand rep can check which creators have posted, view per-creator post lists, manually refresh non-posters, and remove false positives — all via CE. Campaign-runnable state achieved.

---

### Sprint 5: UGC Infrastructure (Week 3–4, ~5–7 days)

Unblocks Stage 9 (UGC Capture). Highest-value sprint for differentiating Cheerful — Story capture is unique. **Prerequisite: Gap 3 App Review must be approved first.**

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Create `ugc_content` table + schema with GIN index on `metadata` | 46 | M | `loops/cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §7; `loops/cheerful-ugc-capture-reverse/analysis/synthesis/options-catalog.md` §11 |
| Build `StoryMentionWorkflow` — route Messaging API `story_mention` event → download CDN media → write `ugc_content` row | 49 | S–M | `loops/cheerful-ugc-capture-reverse/analysis/story-mention-capture.md` §5.2 |
| Build `cheerful_list_ugc_content` CE tool | 47 | S | Requires Gap 46 |
| Build `cheerful_get_ugc_item` CE tool | 47 | S | Requires Gap 46 |
| Build `cheerful_enable_ugc_capture` CE tool | 47 | S | Requires Gap 46 |
| Build `cheerful_attribute_ugc_to_campaign` CE tool | 48 | S | Requires Gap 46 |

**Sprint 5 exit criteria**: Brand rep can enable UGC capture for the campaign, and Story @mentions + feed @mentions auto-appear in the UGC library in real-time. `cheerful_list_ugc_content(campaign_id=...)` returns attributed content pieces.

---

### Sprint 6: P1 Quick Wins (Week 3–4, run in parallel with Sprint 5)

Fast, high-ROI improvements that collectively transform the campaign experience from "prototype" to "product." Each item is S–M effort.

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Add `engagement_rate` to `CreatorFromSearchData` schema and Creator UPSERT | 16 | S | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Creator List Items |
| Add `message_tag: Literal["HUMAN_AGENT"] \| None` to `IgDmSendReplyActivityInput` | 32 | S | `loops/cheerful-ig-dm-spec/analysis/spec/send-reply.md` §7 |
| Add `CONTENT_POSTED` to gifting status enum + expose via `cheerful_update_campaign_creator` | 43 | S | No existing spec |
| Add Slack notification to `process_creator_posts_activity` when `new_posts > 0` | 44 | S | `loops/cheerful-ugc-capture-reverse/analysis/current-post-tracking.md` §2 |
| Add `campaign_id` filter param to `cheerful_list_posts` service route | 64 | S | `loops/cheerful-ce-parity-reverse/specs/creators.md` §Posts (Sprint 4 prerequisite) |
| Add `creator_ids[]` array param to `cheerful_mark_dm_sent` for bulk updates | 28 | S | Prerequisite: Sprint 3 Gap 24 |
| Add `dm_sent=true, replied=false` filter to `cheerful_list_campaign_creators` | 33 | S | Prerequisite: Sprint 3 Gap 24 |
| Add `estimated_reach` computed field to `creator_post` (= `follower_count × 0.25` at Apify fetch time) | 59 | S | No existing spec — confirmed Instagram API limitation |
| Make `subject_template` optional for gifting+IG campaigns | 6 | S | `loops/cheerful-ce-parity-reverse/specs/campaigns.md` |

---

### Sprint 7: P1 Medium Effort (Week 4–6)

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Build `cheerful_generate_campaign_report` CE tool + service route | 60 | M | No existing spec |
| Build `cheerful_list_creator_performance(campaign_id, sort_by="er")` CE tool | 63 | M | No existing spec |
| Build `cheerful_export_to_sheet(campaign_id, status, sheet_url)` CE tool | 39 | M | No existing spec — leverages `google_sheet_url` campaign field |
| Add `content_deadline_at` field to `campaign_creator` + Temporal alert workflow for overdue creators | 45 | M | No existing spec |
| Build `cheerful_categorize_ig_dm_response` CE tool — LLM classifies thread, updates `dm_status` | 29 | M | No existing spec |
| Build `FeedMentionWorkflow` — route Graph API `changes[]` mentions to `ugc_content` | 50 | S–M | `loops/cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §7 — prerequisite: Gap 53 App Review |
| Build `UGCTagPollingWorkflow` — poll `/tags` endpoint every 15min | 51 | M | `loops/cheerful-ugc-capture-reverse/analysis/graph-api-mentions-tags.md` §7 — prerequisite: Gap 53 App Review |
| Build `HashtagMonitoringWorkflow` — poll #MamaSitas + #SinigangRecipe + #LutongPinoy + #HomeCooking | 52 | M | `loops/cheerful-ugc-capture-reverse/analysis/hashtag-monitoring.md` — prerequisite: Gap 54 App Review |
| Add filter params to creator list (`min_er`, `max_followers`, `active_since`) | 18 | M | No existing spec |

---

### Sprint 8: P1 Heavy Effort (Week 6+)

| Task | Gaps | Effort | Source |
|------|------|--------|--------|
| Build hashtag-based creator discovery tool (`cheerful_search_creators_by_hashtag`) — requires IG Graph API hashtag search + new service route | 13 | L | No existing loop spec |
| Build AI content relevance analysis for vetting — LLM classifies latest creator post captions for food content vs. noise | 19 | L | `loops/cheerful-reverse/` — adapt LLM vision from post verification |

---

## P2 Backlog (Nice to Have — After Core Campaign Works)

| Gap | Description | Effort | Notes |
|-----|-------------|--------|-------|
| 5 | Add `ig_dm_template` field to campaign model (separate from `body_template`) | M | Design gap — no existing spec |
| 7 | Build `cheerful_create_product` + `cheerful_list_products` CE tools | S | Spec complete in campaigns.md |
| 17 | Bulk remove from creator list (`DELETE /api/service/lists/{list_id}/creators/bulk`) | S | Single-remove exists (Sprint 2); bulk is P2 |
| 20 | Batch Apify profile fetch (`POST /api/service/creator-search/profiles` with `handles[]`) | M | No existing spec |
| 34 | Conversation state machine (`conversation_stage` enum on `ig_dm_thread_state`) | M | No existing spec |
| 37 | Add `content_brief_sent_at` field to `campaign_creator` | S | Expose via `cheerful_update_campaign_creator` (Sprint 3) |
| 38 | Bulk `cheerful_update_campaign_creator` — array param accepting `creator_ids[]` | S | Prerequisite: Sprint 3 |
| 40 | Add `shipping_tracking_number` + `shipped_at` fields to `campaign_creator` | S | Expose via Sprint 3 tool |
| 41 | Add `SHIPPED` and `DELIVERED` to gifting status enum | S | No existing spec |
| 42 | Per-creator product assignment (junction table) | L | N/A for Mama Sita's uniform bundle |
| 55 | Download Story media to S3 vs. store CDN URL only — TOS grey area | Org decision | `loops/cheerful-ugc-capture-reverse/analysis/story-mention-capture.md` §3.2 |
| 56 | Rights management for UGC (rights_status field + request workflow) | L | Out of scope for hero journey v1 |
| 57 | Deduplication between `creator_post` (Stage 8) and `ugc_content` (Stage 9) via `instagram_post_id` cross-ref | S | No existing spec |

---

## Full Priority-Sorted Gap Registry

> For full gap details (workarounds, source references, example values), see `gap-matrix.md`.

### P0 — Campaign Blockers (Buildable)

| # | Gap | Stage | Effort | Sprint |
|---|-----|-------|--------|--------|
| 1 | `cheerful_connect_ig_account` CE tool not built | Stage 1 | M | 1 |
| 2 | `CampaignSenderCreate` missing `ig_dm_account_id` | Stage 1 | S | 1 |
| 4 | `cheerful_list_ig_accounts` CE tool not built | Stage 1 | S | 1 |
| CE-update | `cheerful_update_campaign` CE tool not built | Stage 8 | M | 1 |
| 8 | `cheerful_search_creators_by_keyword` CE tool not built | Stage 2 | M | 2 |
| 9 | `cheerful_search_similar_creators` CE tool not built | Stage 2 | M | 2 |
| 10 | Creator list CRUD CE tools not built | Stage 2 | M | 2 |
| 11 | `cheerful_add_search_creators_to_list` CE tool not built | Stage 2 | M | 2 |
| 15 | All 8 creator vetting CE tools not built | Stage 3 | L | 2 |
| 23 | `cheerful_generate_outreach_list` CE tool not built | Stage 4 | S | 3 |
| 24 | `cheerful_mark_dm_sent` CE tool not built | Stage 4 | S | 3 |
| 30 | `cheerful_update_campaign_creator` CE tool not built (status) | Stage 5 | M | 3 |
| 31 | `cheerful_extract_address_from_ig_dm` CE tool not built | Stage 5 | M | 3 |
| 36 | `cheerful_update_campaign_creator` write path for `gifting_address` not built | Stage 6 | M | 3 (same as 30) |
| post-tools | 4 post CE tools not built | Stage 8 | M | 4 |
| 46 | `ugc_content` table does not exist | Stage 9 | M | 5 |
| 47 | 3 UGC CE tools not built | Stage 9 | M | 5 |
| 49 | `StoryMentionWorkflow` not built | Stage 9 | S–M | 5 |

### P0 — Campaign Blockers (Config Only)

| # | Gap | Stage | Effort | Sprint |
|---|-----|-------|--------|--------|
| 12 | `INFLUENCER_CLUB_API_KEY` env var not configured | Stage 2 | XS | 0 |
| 21 | `APIFY_API_TOKEN` env var not configured | Stage 3 | XS | 0 |

### P0 — Campaign Blockers (External/Process — Not Code)

| # | Gap | Stage | Lead Time |
|---|-----|-------|-----------|
| 3 | Meta App Review: `instagram_messaging` + `pages_messaging` | Stage 1 | 2–7 business days |
| 53 | Meta App Review: `instagram_manage_comments` | Stage 9 | 2–4 weeks |
| 54 | Meta App Review: `instagram_public_content_access` | Stage 9 | 4–6 weeks (**longest**) |

### P0 — Campaign Blockers (Architectural — Cannot Build)

| # | Gap | Stage | Constraint |
|---|-----|-------|-----------|
| 22 | Meta API does not support cold outbound DMs | Stage 4 | Permanent Meta API limitation |
| 35 | Expired 24h window requires manual IG app re-engagement | Stage 5 | Permanent Meta API limitation |

### P1 — Experience Degraders (by Sprint)

| # | Gap | Stage | Effort | Sprint |
|---|-----|-------|--------|--------|
| 6 | `subject_template` required for IG-only campaigns | Stage 1 | S | 6 |
| 16 | ER not stored on Creator from search import | Stage 3 | S | 6 |
| 26 | IGSID resolution fails ~15% UNMATCHED threads | Stage 4 | M | 7 |
| 28 | No bulk `cheerful_mark_dm_sent` | Stage 4 | S | 6 |
| 25 | No automated follow-up scheduling | Stage 4 | M | 7 |
| 29 | No response categorization tool | Stage 5 | M | 7 |
| 32 | HUMAN_AGENT tag not in MVP | Stage 5 | S | 6 |
| 33 | No non-responder list filter | Stage 5 | S | 6 |
| 38 | No bulk `cheerful_update_campaign_creator` | Stage 6 | S | 6/P2 |
| 39 | No CSV/sheet export CE tool | Stage 7 | M | 7 |
| 43 | No `CONTENT_POSTED` gifting status | Stage 8 | S | 6 |
| 44 | No Slack notification on new post detection | Stage 8 | S | 6 |
| 45 | No content deadline tracking | Stage 8 | M | 7 |
| 48 | `cheerful_attribute_ugc_to_campaign` CE tool not built | Stage 9 | S | 5 |
| 50 | `FeedMentionWorkflow` not built | Stage 9 | S–M | 7 |
| 51 | `UGCTagPollingWorkflow` not built | Stage 9 | M | 7 |
| 52 | `HashtagMonitoringWorkflow` not built | Stage 9 | M | 7 |
| 59 | No impressions/reach metric on `creator_post` | Stage 10 | S | 6 |
| 60 | No `cheerful_generate_campaign_report` CE tool | Stage 10 | M | 7 |
| 63 | No per-creator ER ranking tool | Stage 10 | M | 7 |
| 64 | `cheerful_list_posts` has no `campaign_id` filter | Stage 10 | S | 4/6 |
| 13 | No hashtag-based creator discovery | Stage 2 | L | 8 |
| 14 | IC coverage limited for Philippine micro-creators | Stage 2 | L | External data gap |
| 17 | No bulk remove from creator list | Stage 3 | S | P2 |
| 18 | No bulk filter on creator list (ER/followers/activity) | Stage 3 | M | 7 |
| 19 | No AI content relevance analysis for vetting | Stage 3 | L | 8 |
| 7 | `cheerful_create_product` + `cheerful_list_products` not built | Stage 1 | S | P2 |
| 5 | No `ig_dm_template` field on campaign model | Stage 1 | M | P2 |

---

## Critical Path Analysis

### What Depends on What

```
Sprint 0 (Config + App Reviews)
  └→ Gap 12 (IC key) → Sprint 2 creator search works
  └→ Gap 21 (Apify) → Sprint 2 vetting enrichment works
  └→ Gap 3 (Meta DM review) → Stage 1 IG connect works in production
  └→ Gap 53 (Meta mentions review, 4wk) → Sprint 7 FeedMentionWorkflow
  └→ Gap 54 (Meta hashtag review, 6wk) → Sprint 7 HashtagMonitoringWorkflow

Sprint 1 (Campaign + IG Account)
  └→ Gap 2 (schema) → Gap 1 (CE tool) → Stage 1 complete
  └→ CE-update (cheerful_update_campaign) → Stage 8 post tracking enabled

Sprint 2 (Creator Discovery)
  └→ Gap 8, 9 (search tools) → 112-creator discovery pool
  └→ Gap 10, 11 (list tools) → pool persisted
  └→ Gap 15 (vetting tools) → 62-creator shortlist → campaign transfer

Sprint 3 (Campaign Creator Management) [depends on Sprint 2]
  └→ Gap 23 (outreach list) → Stage 4 manual send queue
  └→ Gap 24 (mark_dm_sent) → Stage 5 tracking works
    └→ Gap 28 (bulk mark) → P1 UX improvement
    └→ Gap 33 (non-responder filter) → P1 follow-up list
  └→ Gap 30/36 (update_campaign_creator) → Stage 6 negotiation tracking
    └→ cheerful_list_campaign_recipients(has_address=true) → Stage 7 automated manifest
    └→ Gap 38 (bulk update) → P1 UX improvement

Sprint 4 (Post Tracking) [depends on Sprint 1 for cheerful_update_campaign]
  └→ 4 post CE tools → Stage 8 full CE monitoring
    └→ Gap 64 (campaign_id filter) → multi-campaign isolation

Sprint 5 (UGC Infrastructure) [depends on Sprint 3 + Gap 3 App Review]
  └→ Gap 46 (ugc_content table) → Gap 47 (CE tools) → Gap 48 (attribution)
  └→ Gap 49 (StoryMentionWorkflow) → Story capture within 24h CDN window

Sprint 6 (P1 Quick Wins) [depends on respective prerequisites]
  └→ Gap 32 (HUMAN_AGENT tag) → 7-day reply window instead of 24h pressure
  └→ Gap 44 (Slack post notification) → brand rep gets push signal on new content
```

### The Long Pole: Meta App Reviews

The hashtag monitoring App Review (`instagram_public_content_access`) takes **4–6 weeks**. If you want hashtag UGC coverage for a campaign starting in month 2, submit the App Review on day 1 of development, not when Stage 9 code is complete.

**App Review submission order (all simultaneous on Day 1)**:
1. `instagram_messaging` + `pages_messaging` — DM outreach infrastructure
2. `instagram_manage_comments` — feed @mention + photo-tag capture
3. `instagram_public_content_access` — hashtag monitoring

---

## Campaign-Runnable State Definition

The campaign is **runnable** (all 10 stages executable via CE + documented workarounds) when:

- [ ] Sprint 0 complete (config + App Review submitted, IG DM App Review approved)
- [ ] Sprint 1 complete (`cheerful_connect_ig_account`, `cheerful_update_campaign` live)
- [ ] Sprint 2 complete (creator search + list + 8 vetting CE tools live)
- [ ] Sprint 3 complete (`cheerful_update_campaign_creator`, `cheerful_mark_dm_sent`, `cheerful_generate_outreach_list` live)
- [ ] Sprint 4 complete (4 post CE tools live)
- [ ] Google Sheets configured (campaign `google_sheet_url` set) as address collection fallback
- [ ] Brand rep briefed on 2 architectural constraints: (1) cold DMs are manual, (2) respond within 24h

**Evidence of runnable state**: A brand rep with zero developer knowledge can follow `hero-journey.md` from Day 0 to Day 49 using only Slack + the documented manual workarounds for cold DMs and shipping dispatch.

---

## Dependencies on Other Loops

| Loop | What It Provides | Gaps Resolved |
|------|-----------------|---------------|
| `loops/cheerful-ig-dm-spec/` | DB schema, webhook handler, `IgDmIngestWorkflow`, Meta OAuth, send-reply activity spec | Gaps 1, 2, 3, 4, 22, 31, 32, 35 |
| `loops/cheerful-ce-parity-reverse/` | CE tool specs for all 8 vetting tools, campaign CRUD, post tools, creator lists | Gaps 8–11, 15, 23, 24, CE-update, post-tools, 60, 63, 64 |
| `loops/cheerful-ugc-capture-reverse/` | `ugc_content` schema, workflow specs for all 4 UGC capture layers | Gaps 46–52 |
| `loops/cheerful-reverse/` | LLM vision classification for post verification, overall backend architecture | Gap 19 (adapt), architectural context |
| `loops/cheerful-hero-features/` | Revenue Attribution Engine (future), Agentic Campaign Copilot (incorporates Gap 60), UGC Capture Hub (incorporates Gap 47) | Gaps 60, 47, 48 (via hero features) |
