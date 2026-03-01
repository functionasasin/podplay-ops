# Synthesis: Instagram UGC Auto-Capture — Master Options Catalog

**Generated:** 2026-03-01
**Loop:** cheerful-ugc-capture-reverse
**Aspect:** synthesis-options-catalog (Wave 4)
**Sources:** All 17 Wave 1–3 analysis files

---

## 0. Executive Summary

Cheerful needs zero-signup Instagram UGC auto-capture for brand accounts. No third-party platform
is viable as capture infrastructure at SaaS scale (all price per-brand; no reseller API exists).
The native build path is clearly preferred — and is substantially cheaper than Archive.com at any
scale beyond ~3 brands. The critical strategic lever is the **IG DM integration**: if Cheerful
builds IG DM (already 50% complete), Story @mention capture arrives at near-zero incremental cost,
eliminating Archive's primary moat.

**Recommended approach:** Hybrid Layered (Layer 1 + Layer 2) as core product with Layer 3 (AI
Radar) as opt-in enterprise tier. All three layers share the same `ugc_content` table and
attribution algorithm.

---

## 1. Capture Method Options: Capability Matrix

Each row = one capture method. Each column = content type it can capture.

| Method | Feed @mention | Comment @mention | Photo-tagged Post | Story @mention | Hashtag Post (branded) | Untagged (visual/audio) |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Graph API `mentions` webhook** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Graph API `/tags` polling** | ❌ | ❌ | ✅¹ | ❌ | ❌ | ❌ |
| **Messaging API `story_mention`** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Hashtag API polling** | ❌ | ❌ | ❌ | ❌ | ✅² | ❌ |
| **AI Radar (visual/audio)** | ❌ | ❌ | ❌ | ❌³ | ❌ | ✅ |
| **Apify scraping** | ❌ | ❌ | ❌ | ❌ | ✅⁴ | ❌ |
| **Archive Variant B (additive)** | ✅⁵ | ✅⁵ | ✅⁵ | ✅⁵ | ✅⁵ | ✅⁵ |

**Notes:**
1. `/tags` covers feed photos + image carousels only; **Reels photo-tags are an API gap** (not exposed)
2. Hashtag catches public feed photos/image carousels; Reels excluded; Stories excluded
3. AI Radar could theoretically process Reels (video frames) from candidate pool if creator is in watchlist
4. Apify has no hashtag cap — main advantage over hashtag API
5. Archive coverage depends on Archive's own integrations (similar limitations to official API)

### Content Type Coverage Summary

| Content Type | Capture Methods Available | Notes |
|---|---|---|
| Feed @caption mention | Graph API mentions webhook | Push, near-real-time |
| Comment @mention | Graph API mentions webhook | Differentiated by `comment_id` presence |
| Photo-tagged post | `/tags` polling | Pull, 10–15min lag; Reels excluded (API gap) |
| Story @mention | Messaging API `story_mention` | Push; 24h CDN expiry; TOS grey area |
| Branded hashtag post | Hashtag API or Apify | 30-slot/7-day limit (API); unlimited (Apify) |
| Untagged content | AI Radar only | No native API path; coverage depends on candidate pool |

---

## 2. Coverage Estimates

Coverage is expressed as % of all public Instagram content that mentions or features a brand.

### By Layer

| Layer | Methods Included | Estimated Coverage | Incremental |
|---|---|---|---|
| **Layer 1: Official API** | Mentions webhook + `/tags` + Story `story_mention` | **60–75%** of public UGC | — |
| **Layer 2: Hashtag** | + Hashtag API or Apify | **+5–25%** | depends on brand hashtag volume |
| **Layer 3: AI Radar** | + visual/audio/OCR candidate pool | **+10–20%** | only for business-account creators |
| **Combined (L1+L2+L3)** | All official API paths + AI | **75–95%** | |

### By Content Type (Layer 1 only)

| Content Type | Coverage Within Layer 1 |
|---|---|
| Feed @caption mentions | ~95% (webhook; missed only on downtime) |
| Photo-tagged posts | ~90% (polling at 10–15min; Reels excluded) |
| Story @mentions | ~85% (24h CDN window; private accounts missed) |
| Branded hashtag posts | 0% (requires Layer 2) |
| Untagged content | 0% (requires Layer 3) |

### Why Coverage Is Never 100%

- Private accounts are invisible to all official API methods (no consent mechanism)
- Reels photo-tags are not exposed by the Instagram API (confirmed API gap, not fixable)
- Stories without @mention require AI detection + creator in watchlist
- Business Discovery API only reaches business/creator accounts (~20% of Instagram)
- No polling fallback for `mentions` webhook — downtime = permanent loss

---

## 3. Architecture Options

### Option A: Official API Capture (Layer 1 + Layer 2)

**What it is:** Native build using Meta's official Graph API + Messaging API + Hashtag API.

**Components:**
- `POST /webhooks/instagram/` — unified webhook endpoint (shared with IG DM)
- `FeedMentionWorkflow` — handles caption/comment @mention webhook events
- `StoryMentionWorkflow` — handles Messaging API `story_mention` events
- `UGCTagPollingWorkflow` — polls `/tags` every 10–15min per brand
- `HashtagMonitoringWorkflow` — polls hashtag API every 2–4hr (30-slot budget)
- `ugc_content` table + attribution algorithm
- `ugc_hashtag_config` table (brand hashtag configuration)

**Infrastructure shared with IG DM (zero incremental cost):**

| Component | Shared? | Notes |
|---|---|---|
| `POST /webhooks/instagram/` + HMAC | ✅ Full share | Same endpoint, same verification |
| `user_ig_dm_account` table | ✅ Full share | Add 3 columns via ALTER |
| `ig_igsid_cache` + `resolve_igsid_activity` | ✅ Full share | For IGSID resolution |
| `post-media` Supabase Storage bucket | ✅ Full share | Same bucket, new path prefix |
| `download_and_store_media` service | ✅ Full share | Reused unchanged |
| FB Page OAuth flow | ✅ Full share | No changes needed |
| `instagram_manage_messages` App Review | ✅ Full share | Covers `mention` field |

**Net-new components:**

| Component | Effort | Notes |
|---|---|---|
| `FeedMentionWorkflow` | 3–5 days | New `changes[]` routing branch |
| `StoryMentionWorkflow` | 4–5 days | Including 24h download deadline |
| `UGCTagPollingWorkflow` | 3–5 days | Polling + cursor management |
| `HashtagMonitoringWorkflow` + UI | 4–6 days | Config UI for hashtag slots |
| `ugc_content` table + attribution | 4–5 days | Schema + GIN index on handles |
| `instagram_manage_comments` App Review | 2–4 wks | Wall-clock wait time |
| `instagram_public_content_access` App Review | 4–6 wks | Separate; hashtag only |

**Total effort (IG DM infra exists):** ~4–6 engineer-weeks (phased: 2wk + 1wk + 2wk)
**Total effort (IG DM infra does not exist):** ~10–14 engineer-weeks

---

### Option B: AI Radar (Layer 3, incremental to Option A)

**What it is:** Proactive candidate discovery + AI analysis for untagged UGC.

**Three-stage pipeline:**
1. **Candidate Discovery** — poll `ugc_creator_monitoring` watchlist via Business Discovery API (~400–500 creators/day at 200 calls/hr budget)
2. **AI Analysis** — caption pre-filter (free) → visual (CLIP/YOLO/OCR) → audio (Whisper STT + NER)
3. **Result Processing** — confidence aggregation → auto-capture (high confidence) or human review queue

**Self-reinforcing data flywheel:** Every creator who tags a brand is auto-added to `ugc_creator_monitoring`. After 6–12 months the watchlist reaches thousands of brand-adjacent accounts.

**Visual detection options (build-vs-buy):**

| Option | Cost | Setup | Notes |
|---|---|---|---|
| **Claude vision (reuse existing)** | ~$0.003–0.008/image | Zero new infra | Already in `analyzer.py`; best for MVP |
| **Google Cloud Vision API** | $1.50/1K images | Minimal | Logo detection works out-of-box for major brands |
| **Roboflow managed** | $49–299/mo | Low | Custom model training; lower per-image cost at volume |
| **Self-hosted YOLO+CLIP+PaddleOCR** | GPU only | High | Break-even >100K–500K images/month |

**Audio detection options:**

| Option | Cost | Notes |
|---|---|---|
| GPT-4o Mini Transcribe | $0.003/min | Cheapest API path; no new infra |
| Whisper self-hosted | ~$0.0017/min | GPU shared with visual worker |
| AssemblyAI | $0.0042/min | LeMUR LLM extraction; 30% fewer hallucinations |

**Caption pre-filter:** Eliminates 20–40% of AI calls (skip already-captured content, skip posts with zero brand text signals).

**New tables:** `ugc_creator_monitoring`, `ugc_ai_analysis_queue`, `ugc_review_queue`

**IG DM overlap:** ~30% shared (lower than Option A)

| Component | Shared? |
|---|---|
| `user_ig_dm_account` credentials | ✅ |
| `download_and_store_media` | ✅ |
| Media download pipeline | ✅ |
| Claude vision (`analyzer.py`) | ✅ |
| Candidate discovery engine | ❌ net-new |
| AI inference pipeline | ❌ net-new |
| Review queue UI | ❌ net-new |

**Effort:** ~5–7 eng-weeks (Phase AI-1: API-based) + 2–3 weeks (AI-2: Cloud Vision) + 4–6 weeks (AI-3: GPU self-hosted)

---

### Option C: Additive Archive Integration (Variant B)

**What it is:** Brands that already pay Archive connect Archive to Cheerful. Cheerful polls
Archive GraphQL API + registers for `item_captured` webhooks. Cheerful adds campaign attribution
on top of Archive's capture.

**Architecture:**
- `archive_integration` table (credential store; tiny)
- `UGCArchiveIngestWorkflow` — processes incoming `item_captured` webhook events
- `UGCArchivePollWorkflow` — cursor-paginated GraphQL polling as fallback
- `POST /webhooks/archive/` — separate webhook endpoint
- Shared: `attribute_ugc_to_campaign_activity` (identical attribution algorithm)

**What Archive's API provides:**
- `items` query: filters by POST/REEL/STORY/TIKTOK, virality score, rights status
- `item_captured` webhook for real-time ingestion
- Creator/transcription data

**What Cheerful must add:**
- Campaign attribution (Archive has no Cheerful campaign concept)
- Supabase Storage mirror (media_url → download to `ugc_content`)
- Deduplication with native Layer 1 capture (`ON CONFLICT DO NOTHING`)

**NOT viable as primary infrastructure** — Archive is:
1. A direct competitor
2. Per-brand priced (~$1,000–5,000/month/brand Enterprise tier)
3. Able to terminate API access unilaterally
4. Able to see all Cheerful brands' UGC data

**Viable as additive path** — brands that already subscribe to Archive can optionally connect.

**Effort:** 2–3 engineer-weeks
**No Meta App Review required** (Archive handles all Meta API; Cheerful only needs Archive API key)

---

### Option D: Hybrid Layered (Recommended)

Combines Options A + B + C in independently deployable layers.

```
Layer 1A: Story @mentions (bundle with IG DM launch, ~4–7 days)
Layer 1B: Feed @mentions (webhook, ~3–5 days)
Layer 1C: Photo-tag polling (polling, ~3–5 days)
Layer 2:  Hashtag monitoring (2–4hr polling, ~1–2 weeks)
Layer 3:  AI Radar (candidate pool + vision/audio, ~5–7 weeks MVP)
Option C: Archive additive (optional per-brand, ~2–3 weeks)
```

All layers write to the same `ugc_content` table with `capture_source` enum. Deduplication is
handled by `ON CONFLICT DO NOTHING` on unique indices — first-capture-wins across sources.

---

## 4. IG DM Integration Overlap Inventory

This table documents every component that IG DM integration creates and whether UGC capture can
share it. Assumes IG DM integration is built or in progress.

| Component | IG DM Creates | UGC Story Capture | UGC Feed Mention | UGC Tag Polling | UGC Hashtag | UGC AI Radar |
|---|---|---|---|---|---|---|
| `POST /webhooks/instagram/` | ✅ | Share | Share | — | — | — |
| HMAC-SHA256 verification | ✅ | Share | Share | — | — | — |
| `entry.messaging[]` routing | ✅ | Share | — | — | — | — |
| `entry.changes[]` routing | — | — | New | — | — | — |
| `user_ig_dm_account` table | ✅ | Share + ALTER | Share | Share | Share | Share |
| `ig_igsid_cache` table | ✅ | Share | Share | — | — | — |
| `resolve_igsid_activity` | ✅ | Share | Share | — | — | — |
| FB Page OAuth flow | ✅ | Share | Share | Share | Share | Share |
| `post-media` bucket | ✅ | Share | Share | Share | — | Share |
| `download_and_store_media` | ✅ | Share | Share | Share | — | Share |
| `instagram_manage_messages` AppReview | ✅ | Share | — | — | — | — |
| `instagram_manage_comments` AppReview | — | — | New | New | — | — |
| `instagram_public_content_access` AppReview | — | — | — | — | New | — |
| `StorageService` (bucket-agnostic) | ✅ | Share | Share | Share | — | Share |
| Claude vision `analyzer.py` | — | — | — | — | — | Share |
| `media_storage.py` | ✅ | Share | Share | Share | — | Share |

**Key insight:** Layer 1A (Story capture) is the highest overlap layer — it shares ~7 of 8 major
infrastructure components with IG DM at zero incremental build cost. The net-new work is:
`StoryMentionWorkflow` + `download_ig_story_media_activity` + `ugc_content` table.

---

## 5. Combination Matrix

Which methods work together, and how they interact:

| Method A | Method B | Interaction | Notes |
|---|---|---|---|
| Mentions webhook (feed) | `/tags` polling | ✅ Complementary | Different content types; share `ugc_content` table |
| Mentions webhook (feed) | Story `story_mention` | ✅ Complementary | Different endpoints in same webhook system |
| `/tags` polling | Hashtag API | ✅ Complementary | Different discovery vectors; share storage |
| Hashtag API | Apify hashtag | ⚠️ Overlapping | Both catch branded hashtags; Apify has no cap |
| Official API (any) | AI Radar | ✅ Synergistic | Layer 1 tag events auto-populate AI Radar watchlist |
| Official API (any) | Archive Variant B | ✅ Complementary | Deduplicated by `instagram_post_id` unique index |
| AI Radar | Archive Variant B | ✅ Complementary | Archive fills untagged gap differently; both write `ugc_content` |
| Apify hashtag | Official hashtag API | ⚠️ Avoid double-counting | Use `ON CONFLICT DO NOTHING` dedup; Apify preferred if no 30-slot constraint |
| instagrapi | Any | ❌ Avoid | Account ban risk = catastrophic; no unique capability over Apify |

---

## 6. Constraint Summary

### Meta API Constraints

| Constraint | Binding? | Workaround |
|---|---|---|
| 200 calls/hr per brand IG account (Graph API) | Low | At 10–15min polling intervals per brand, stays well under limit |
| 30 unique hashtags / 7-day rolling window | **High** | Multi-brand-account workaround (30 slots per account); Apify for overflow |
| Hashtag only catches public feed photos/image carousels | **High** | No workaround; Reels + Stories excluded from hashtag API |
| CDN URL expiry (Story media): 24 hours | **High** | Temporal `start_to_close_timeout=timedelta(hours=20)`; download immediately on webhook |
| Business Discovery API: business/creator accounts only | **High** | ~80% personal accounts invisible; Apify required for personal accounts |
| `instagram_public_content_access` App Review (hashtag) | **High** | Separate review process; 4–6 week wall-clock time |
| `instagram_manage_comments` App Review (feed mentions + photo-tags) | Medium | Can combine with DM review; 2–4 weeks |
| Reels photo-tags not exposed by API | **High** | No workaround; confirmed API gap |
| Private account posts invisible | **High** | No workaround; creator must be followed by brand for Story events |

### Deduplication Constraints

| Dedup Challenge | Solution |
|---|---|
| Same post captured via webhook + polling | UNIQUE index on `(user_ig_dm_account_id, instagram_post_id)` |
| Brand-level UGC (no campaign) with NULL `campaign_id` | Partial UNIQUE index `WHERE campaign_id IS NULL` |
| Multiple campaigns matching same creator/post | Fan-out: create N `ugc_content` rows (one per campaign) |
| Handle-based attribution fragility (case, `@` prefix, handle changes) | Normalize: `handle.lstrip('@').lower().strip()`; store numeric `ig_user_id` for durable lookup |

### Meta Terms of Service

| Action | TOS Status | Industry Practice |
|---|---|---|
| Download + store Story media permanently | Technically violates TOS | Archive, TINT, Stackla all do it; industry consensus = creator consent implied by @mention |
| Apify hashtag scraping | Grey area | Cheerful already uses Apify; same risk level as existing |
| Business Discovery API polling of public accounts | ✅ Compliant | Explicitly documented API use case |
| Webhook mentions capture | ✅ Compliant | Standard API usage |
| instagrapi (private API) | ❌ Violates TOS | Account ban risk; do not use |

---

## 7. Effort Estimates

### Per-Layer Effort (assuming IG DM infra exists)

| Layer | Sub-phases | Effort | Wall-clock (incl. App Review) |
|---|---|---|---|
| **Layer 1A** — Story @mentions | StoryMentionWorkflow + download activity | 4–7 days | Bundle with DM launch |
| **Layer 1B** — Feed @mentions | FeedMentionWorkflow + `changes[]` routing | 3–5 days | After `instagram_manage_comments` approved |
| **Layer 1C** — Photo-tag polling | UGCTagPollingWorkflow + cursor | 3–5 days | Same App Review as 1B |
| **ugc_content schema** | Table + attribution algorithm + GIN index | 4–5 days | Pre-work; blocks all layers |
| **App Review: instagram_manage_comments** | PR, video demo, policy doc | 2–4 weeks wall-clock | Runs in parallel with Layer 1B/1C dev |
| **Layer 2** — Hashtag monitoring | HashtagMonitoringWorkflow + config UI | 1–2 weeks | After instagram_public_content_access |
| **App Review: instagram_public_content_access** | Separate review; harder | 4–6 weeks wall-clock | Start simultaneously with DM App Review |
| **Layer 3 MVP** — AI Radar (API-based) | Candidate discovery + Claude vision | 5–7 weeks | No App Review required |
| **Layer 3 Full** — AI Radar (GPU) | YOLO/CLIP/audio worker | +4–6 weeks | After MVP validation |
| **Archive Variant B** | archive_integration + poll/webhook | 2–3 weeks | No App Review |

### Cumulative Effort Milestones (IG DM infra exists)

| Milestone | Engineer-weeks | Coverage Achieved |
|---|---|---|
| ugc_content schema + attribution | 1 week | Foundation only |
| Layer 1A launch (Story mentions, with DM) | +1 week (~2wk total) | ~35–45% |
| Layer 1B + 1C launch (feed + tags) | +2 weeks (~4wk total) | ~60–75% |
| Layer 2 launch (hashtags) | +1–2 weeks (~6wk total) | ~65–90% |
| Layer 3 MVP launch (AI Radar) | +5–7 weeks (~13wk total) | ~75–95% |

---

## 8. Cost Analysis

### API Costs (ongoing, per month at 100 brands)

| Method | API Cost | Notes |
|---|---|---|
| Mentions webhook (feed + story) | **$0** | Push-based; no polling cost |
| `/tags` polling | **$0** | Within rate limits |
| Hashtag API | **$0** | Official API, free |
| Apify scraping | $50–500/month | Depends on volume; ~$0.50–5/1K results |

### Storage Costs (ongoing, per month at 100 brands)

| Scenario | Monthly Storage Cost | Notes |
|---|---|---|
| Conservative (photo-heavy) | $10–$50 | ~50GB Supabase Storage |
| Moderate (mixed Reels) | $50–$200 | ~200–500GB |
| Heavy (Reel-heavy brands) | $200–$1,200+ | 1–12 TB; Supabase overages apply |

### AI Compute Costs (Layer 3, ongoing, per month)

| Phase | Cost | Volume |
|---|---|---|
| Layer 3 MVP (Claude vision) | $10–$200 | $0.003–0.008/image; 25K–25K images |
| Layer 3 Phase 2 (Cloud Vision API) | $50–$500 | $1.50/1K images |
| Layer 3 Phase 3 (GPU self-hosted) | $100–$300 | GPU instance; break-even >100K images/month |
| Audio STT (GPT-4o Mini Transcribe) | $5–$50 | $0.003/min; low volume |

### Third-Party Costs

| Service | Cost | Viable? |
|---|---|---|
| Archive as primary engine (Variant A) | ~$1,000–5,000/brand/month | ❌ Commercially unviable |
| Archive additive (Variant B, brands that pay) | $0 to Cheerful | ✅ Brand pays Archive directly |
| Stackla/Nosto | Similar to Archive | ❌ Worse fit |
| Modash creator DB (discovery supplement) | $299–999/month | Optional for AI Radar expansion |

### Native Build vs Archive at Scale

| Scale | Native Build (L1+L2) | Archive (Variant A) | Archive Advantage |
|---|---|---|---|
| 1 brand | ~$20–50/month | ~$1,000+/month | ❌ Archive 20–50× more expensive |
| 10 brands | ~$100–300/month | ~$10,000+/month | ❌ Archive 30–100× more expensive |
| 100 brands | ~$300–1,500/month | ~$100,000+/month | ❌ Archive 60–300× more expensive |

**Conclusion:** Native build is cost-optimal at any scale. Archive's only viable role is as an
additive integration for brands that already independently pay Archive.

---

## 9. Risk Register

| Risk | Probability | Impact | Option | Mitigation |
|---|---|---|---|---|
| App Review rejection (`instagram_manage_comments`) | Medium | High (blocks L1B/1C) | Option A | Submit demo video early; have fallback (L1A + L2 still work) |
| App Review rejection (`instagram_public_content_access`) | Medium-High | Medium (blocks L2) | Option A | Apify hashtag monitoring as fallback; submit simultaneously |
| Webhook downtime = permanent feed mention loss | Low-Medium | Medium | Option A | CloudFlare/Fly.io reliability; monitor webhook health; alert on silence |
| Story media CDN URL expires before download | Low | Medium | Option A L1A | Temporal deadline timeout; immediate download activity on webhook receipt |
| Archive terminates API access | Medium (competitive risk) | Low (Variant B only) | Option C | Cheerful mirrors media at ingestion; historical data preserved |
| Archive sees Cheerful brand data | Certain | Medium-High | Option C | Competitive intelligence risk; brands should consent explicitly |
| Instagram API changes break capture | Low-Medium | High | All | Abstract API calls behind activity layer; Temporal retry handles transient |
| Hashtag 30-slot limit blocks brand campaign | High (common scenario) | Medium | Option A L2 | Multi-account workaround; Apify overflow; prioritize slots by campaign |
| Reels photo-tag API gap remains unfixed | High (persistent) | Medium | All | Document as known limitation; AI Radar can partially fill |
| Business Discovery API excludes personal accounts | Certain | Medium | Option B (L3) | Apify supplement; candidate pool focuses on business accounts |
| GPU worker ops complexity | Medium | Medium | Option B (L3 Ph3) | Defer to Phase 3; API-based MVP avoids this |
| handle-based attribution mismatch | Medium | Medium | All | Store numeric `ig_user_id` alongside handle; GIN index on JSONB |
| Retroactive campaign attribution gaps | Medium | Low | All | Retroactive promotion workflow; brand-level UGC as fallback |
| Meta TOS Story download violation | Low (industry norm) | High | Option A L1A | Industry consensus = implied consent; monitor Meta policy changes |

---

## 10. Buy-vs-Build Decision Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BUY VS BUILD DECISION TREE                         │
└─────────────────────────────────────────────────────────────────────┘

1. Is IG DM integration built or planned?
   YES → Build native (Story capture is nearly free; Archive advantage = zero)
   NO  → See question 2

2. How many brands need UGC capture in next 6 months?
   < 3 brands → Archive Variant A *may* be cheaper short-term (but still risky)
   ≥ 3 brands → Build native (break-even favors build)

3. Do any brands already pay Archive independently?
   YES → Implement Archive Variant B (additive, 2–3 weeks, no Meta App Review)
   NO  → Skip Archive entirely

4. How important is untagged content capture?
   Core feature → Build Layer 3 AI Radar (Phase AI-1 MVP first)
   Nice-to-have → Skip Layer 3; Layer 1+2 covers 65–90%

5. Is the 30-hashtag slot limit blocking campaigns?
   YES → Add Apify hashtag supplement (lowest friction: already in stack)
   NO  → Use official Hashtag API only (free, TOS-compliant)
```

### Build Recommendation Summary

| Decision | Recommendation | Rationale |
|---|---|---|
| Primary architecture | **Build native (Option D: Hybrid Layered)** | 60–300× cheaper than Archive at scale |
| Layer sequencing | **1A → schema → 1B/1C → 2 → 3** | Bundle 1A with DM; highest value first |
| App Review sequencing | **Submit all reviews simultaneously with DM review** | Parallel wall-clock time |
| Hashtag overflow | **Apify supplement** (if needed) | Already in Cheerful stack |
| Archive | **Variant B additive only** | For brands that independently pay Archive |
| Story media download | **Download and store permanently** | Industry norm; implied consent |
| AI Radar sequencing | **Phase AI-1 MVP (Claude vision) first** | Reuses existing infra; validates demand |
| Personal account coverage | **Accept as known gap** | 80% of IG; no compliant workaround |

---

## 11. New Database Schema — Summary

All new tables required across all options:

| Table | Purpose | Required By | Notes |
|---|---|---|---|
| `ugc_content` | Core UGC record | All options | Separate from `creator_post` (NOT NULL FK incompatibility) |
| `ugc_hashtag_config` | Brand hashtag slot assignments | Layer 2 | 30-slot management |
| `ugc_tag_poll_cursor` | Polling state for `/tags` endpoint | Layer 1C | Per-brand cursor |
| `ugc_creator_monitoring` | AI Radar creator watchlist | Layer 3 | Self-reinforcing pool |
| `ugc_ai_analysis_queue` | Pending AI analysis jobs | Layer 3 | Priority queue |
| `ugc_review_queue` | Low-confidence results for human review | Layer 3 | Review UI needed |
| `archive_integration` | Archive API credentials | Option C | Per-brand; tiny |

**Altered tables:**

| Table | Changes | Required By |
|---|---|---|
| `user_ig_dm_account` | +`ugc_webhook_enabled`, +`ugc_tag_poll_enabled`, +`ugc_hashtag_enabled` | Layer 1 |

**Critical index:**
```sql
-- Brand-level dedup (NULL campaign_id doesn't conflict in standard UNIQUE)
CREATE UNIQUE INDEX ugc_content_brand_post_uniq
  ON ugc_content (user_ig_dm_account_id, instagram_post_id)
  WHERE campaign_id IS NULL;
```

---

## 12. Shared Code: Reuse Inventory

Components already built in Cheerful that UGC capture reuses:

| Component | Location | Reused By | Modification Needed? |
|---|---|---|---|
| `ig_dm_webhook.py` webhook endpoint | `ig_dm/` | All webhook-based capture | Route new event types |
| HMAC verification | `ig_dm_webhook.py` | All webhook capture | None |
| `user_ig_dm_account` table/model | `ig_dm/models.py` | All options | ALTER: add 3 columns |
| `resolve_igsid_activity` | `ig_dm/activities.py` | L1A, L1B | None |
| `ig_igsid_cache` | `ig_dm/models.py` | L1A, L1B | None |
| `download_and_store_media` | `media_storage.py` | All media capture | None |
| `post-media` bucket | Supabase Storage | All media capture | New path prefix only |
| `StorageService` | `storage.py` | All media capture | None |
| `analyzer.py` (caption + Claude vision) | `post_tracking/analyzer.py` | Layer 3 MVP | Reuse `analyze_image_with_llm` |
| `ApifyService` | `apify.py` | Layer 2 Apify path | None |
| `APIFY_API_TOKEN` | env/secrets | Layer 2 Apify path | None |
| FB Page OAuth flow | `ig_dm/oauth.py` | All options | None |
| `brand-logos` bucket | Supabase Storage | Layer 3 AI (CLIP ref) | None |

---

## 13. Product Tier Mapping

Natural mapping of layers to Cheerful subscription tiers:

| Tier | Layers Included | Coverage | Differentiator |
|---|---|---|---|
| **Basic** | Layer 1 (official API) | 60–75% | Tagged mentions + Stories |
| **Pro** | Layer 1 + Layer 2 | 65–90% | + branded hashtag monitoring |
| **Enterprise** | Layer 1 + Layer 2 + Layer 3 | 75–95% | + AI untagged detection + human review |
| **Archive add-on** | Any tier + Archive Variant B | Additive | For brands already on Archive |

---

*End of options catalog. All findings sourced from 17 Wave 1–3 analysis files.*
