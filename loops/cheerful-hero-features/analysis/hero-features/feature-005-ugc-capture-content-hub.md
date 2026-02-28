# Feature 005: Always-On UGC Capture + Content Approval Hub

**One-line pitch:** Auto-capture every post where a creator tags your brand — with or without an active campaign — then route the best content through a pre-publication approval workflow and into a licensed UGC library.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** HIGH — Archive built a 50,000-brand business on just the capture layer alone

---

## Problem It Solves

Cheerful's content tracking today is reactive and campaign-bound: it only tracks posts from opted-in creators, only on Instagram, and only after they've already been published. There's no pre-publication approval workflow, no way to capture organic brand advocates who aren't in an active campaign, no UGC library, and no content rights management.

This creates two distinct problems:

1. **Missed organic advocacy**: Creators who tag a brand organically — without any active campaign — are invisible in Cheerful. These are often the highest-authenticity, highest-engagement posts. Archive grew to 50,000+ brands specifically on the proposition of capturing these.

2. **No content lifecycle**: For paid campaigns, there's no mechanism for creators to submit drafts for review before publishing, no approval workflow, and no searchable UGC library for repurposing approved content in ads, email, and social.

### Evidence from Research

**UGC market demand:**
- UGC campaigns grew **+133% YoY** on Collabstr in 2025 — the fastest-growing campaign type ([archive.com, 2025](https://archive.com/blog/influencer-marketing-growth-statistics))
- Archive grew to **50,000+ brands** (Allbirds, Notion, DoorDash, Uniqlo, Momofuku) specifically on the zero-signup brand mention capture proposition — these are brands that use Archive alone, with no other influencer platform
- Brands report capturing **400% more content** with zero-signup tracking vs. opt-in-only systems ([Archive product data](https://archive.com))
- UGC rights management is cited as the feature that commands premium pricing — Insense grants full usage rights by default; Aspire has a rights workflow — brands will pay more to avoid legal exposure from repurposing creator content without proper licensing
- FTC guidelines in 2026 require brands to track which posts had #ad/#sponsored disclosures — zero-signup capture is the only way to maintain a complete compliance audit trail

**Competitor landscape:**
- Archive: 100% Instagram + 98% TikTok content capture; 24/7 Story capture (ephemeral content nobody else gets); Archive Radar (AI audio/video untagged brand detection — unique in market); zero-signup tracking; TikTok Spark Code hub
- Modash: Zero-signup content tracking including Stories — most-cited sticky feature in user reviews
- Aspire: Official Meta Partner → Instagram DM integration + Story Social Listening — captures ephemeral content others miss
- GRIN: Full content review flow, creator portal, deliverable enforcement before payment release
- Heepsy: Instagram Monitoring — auto-captures posts/Stories from collaborators with zero effort

**Content approval gap:**
- 25% higher ROI with documented campaign workflows (Content Marketing Institute, 2025) — structured approval tracks are value-drivers, not just process overhead
- Tiered approval paths are market standard: fast-track (trusted creator, 24hr), standard (2 reviewers, 2–3 days), high-scrutiny (legal/FTC, 1 week)
- FTC audit trail for branded content review is now a **legal risk mitigation** feature for enterprise brands managing regulated industries

---

## How It Works in Cheerful

### Integration with Existing Spec

**Existing (from spec):**
- `creator_post` table: stores `post_url`, `media_urls`, `media_storage_path` (Supabase Storage), `caption`, `likes`, `comments`, `match_method`, `match_reason`, `vision_analysis` — foundation already built for Instagram (`spec-data-model.md`)
- `PostTrackingWorkflow` (`spec-workflows.md`): polls Instagram for posts matching campaign creators; already handles 90-day post tracking
- `campaign_brief` PDF upload (`spec-webapp.md` step 2): brief context already exists; needs to become a structured document delivered to creators
- `post_type` field in `creator_post`: already has `post`, `story`, `reel` enum values — schema anticipated multi-type capture
- Supabase Storage: already archiving media files — UGC library storage layer exists
- LLM vision analysis: `vision_analysis` field already populated by AI for tracked posts — brand safety and content review foundation exists

**What to build:**

**Phase 1 — Zero-Signup Brand Mention Capture:**
1. Extend `PostTrackingWorkflow` to monitor brand hashtag + @mention across:
   - Instagram (existing) — extend to include accounts NOT in any active campaign
   - TikTok (new) — via TikTok API or scraping layer similar to existing Apify
   - YouTube (new) — video descriptions + community posts
2. Zero-signup trigger: any creator tagging the brand handle / using brand hashtag — captured regardless of campaign relationship
3. New `source_type` field on `creator_post`: `campaign_tracked` vs `brand_mention` (organic capture)
4. 24/7 Story capture: Stories are ephemeral (24hr); need a polling cadence under 6 hours to capture before expiry

**Phase 2 — UGC Content Library UI:**
1. Dedicated "Content Library" section in web app (separate from inbox)
2. Grid view: all captured posts organized by date, campaign, creator, platform, content type
3. Filtering: by campaign, creator, platform, content type (post/story/reel), approval status, date range
4. Search: full-text search across captions + LLM vision analysis descriptions
5. "Favorite" system: mark high-quality posts for repurposing (feeds rights management workflow)

**Phase 3 — Pre-Publication Approval Workflow:**
1. For paid campaigns: creator submits content draft via unique submission link (no creator platform account required — link-based)
2. Draft stored in `creator_post` with `approval_status: draft` (new field)
3. Approval workflow:
   - **Fast-track**: single reviewer approves → auto-notifies creator to post
   - **Standard**: 2 reviewers required → parallel approval requests via email notification
   - **Compliance track**: includes legal review queue; creator blocked from posting until approved
4. Inline feedback: reviewer leaves text note on submission → creator receives feedback email with specific direction
5. Revision rounds: configurable limit (1 or 2 rounds) enforced by platform — reduces creator disputes
6. Approval audit trail: who approved, when, with what notes — stored per post

**Phase 4 — Content Rights Management:**
1. Rights grant template: generated alongside contract (Feature 001 integration)
2. Usage rights recorded per post: channel (email, paid ads, website), duration, geographic scope
3. Rights expiry alerts: 30 days before licensed content rights expire
4. "Ready to repurpose" export: filtered view of licensed content + export to ad platforms (Meta Ads Manager, TikTok Ads)
5. TikTok Spark Code hub: for TikTok posts, request Spark Code from creator → store alongside post — enables brands to boost organic TikTok content as paid ads

**API additions:**
- `GET /content-library` — all captured posts with filters
- `POST /posts/{id}/approval` — submit approval decision (approve/request-revision)
- `POST /posts/{id}/rights` — record usage rights grant
- `GET /content-library/export` — export licensed content for ad platforms
- `POST /campaigns/{id}/content-submission-link` — generate creator submission link

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 4/5 | Content library browsed weekly by creative teams. Approval queue for active campaigns is checked multiple times per week. Brand mention monitoring generates daily notifications for high-volume brands. |
| **Integration Depth** | 4/5 | Connects brand monitoring, campaign management, creator profiles, contracts/rights (Feature 001), paid ad platforms. 5+ workflow connections. |
| **Data Accumulation** | 5/5 | The UGC library grows with every post ever captured. Usage rights history, content performance archive, and brand mention dataset are all irreplaceable. The brand's complete creator content library — years of assets — lives in Cheerful. |
| **Team Dependency** | 4/5 | Creative team (UGC repurposing), legal/compliance (rights management + approval audit trail), ops (approval workflow), brand client (content review). Multiple departments create dependency. |
| **Switching Pain** | 4/5 | UGC library with rights management history = irreplaceable licensed content asset. Approval audit trail = legal compliance record. Content performance archive = campaign intelligence. Cannot be exported or migrated meaningfully. |

**STICKINESS SCORE: 21/25**

---

## Competitive Landscape

| Platform | Zero-Signup Capture | Story Capture | Pre-Pub Approval | UGC Library | Rights Management | Spark Codes |
|----------|--------------------|--------------|-----------------|-----------|--------------------|------------|
| **Archive** | ✅ 100% IG/98% TT | ✅ 24/7 | ❌ | ✅ Full | ❌ | ✅ Only platform |
| **Modash** | ✅ | ✅ | ⚡ | ✅ | ❌ | ❌ |
| **Aspire** | ⚡ Meta Partner | ✅ IG only | ✅ Multi-stage | ✅ | ✅ | ❌ |
| **GRIN** | ❌ Opt-in only | ❌ | ✅ Full | ✅ | ✅ | ❌ |
| **Heepsy** | ⚡ IG only | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cheerful (current)** | ❌ Opt-in only | ⚡ Schema ready | ❌ | ❌ | ❌ | ❌ |
| **Cheerful (with feature)** | ✅ Multi-platform | ✅ TT+IG | ✅ Tiered | ✅ | ✅ | ✅ |

**How Cheerful does it better:**
- Cheerful's `creator_post` table + Supabase Storage is already built — this is an extension, not a rebuild
- Zero-signup capture feeds directly into the creator discovery workflow: organic advocates become the warmest possible top-of-funnel leads
- Approval workflow integrates with existing email infrastructure — creator receives feedback via email from brand's Gmail domain (no platform login required)
- Rights management integrated with contract generation (Feature 001) — single workflow vs. two separate tools
- Spark Code hub is a gap Archive owns alone; shipping this would be a concrete differentiator

---

## Workflow Integration Map

```
Brand mention captured (zero-signup, any platform)
         │
         ▼ creator_post table updated: source_type = brand_mention
         │
         ├──► Notification to team: "@fitbyjane posted about your brand"
         │
         ├──► Creator profile enriched (Feature 004): organic advocate flag
         │
         └──► UGC Content Library: post added to brand gallery
                    │
                    ▼ Team favorites it
                    │
                    ▼ One-click: "Invite this creator to next campaign"
                           │
                           └──► Creates campaign_creator record → starts outreach

[Parallel: for active paid campaigns]
Creator submits draft via submission link
         │
         ▼ creator_post record: approval_status = draft
         │
         ▼ Approval queue: standard or compliance track
         │
         ├── Reviewer approves → creator notified to post
         ├── Reviewer requests revision → inline note → creator email
         └── Compliance cleared → TikTok Spark Code requested → stored
                    │
                    ▼ Post published
                    │
                    ▼ Rights grant recorded (Feature 001: contract integration)
                    │
                    ▼ Content available in UGC library for repurposing → Meta/TikTok Ads export
```

Connected workflows:
- **Creator Relationship Intelligence (Feature 004)**: organic advocate capture enriches creator profiles with pre-relationship engagement data
- **Creator Payment Hub (Feature 001)**: rights management integrates with contract workflow
- **Revenue Attribution (Feature 003)**: content performance data joins revenue data for true per-creator ROI
- **Cheerful Brain (Feature 002)**: copilot can surface: "3 creators tagged you this week without being in a campaign — want me to reach out?"

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 004 (Creator Relationship Intelligence Hub)**: Organic mention capture converts warm brand advocates into the discovery funnel — an inbound creator acquisition channel that grows automatically without outreach spend.
2. **Feature 001 (Creator Payment Hub)**: Content rights management integrates with contract terms — brands can manage the full lifecycle from "post captured" → "rights licensed" → "usage extended" → "payment made" within a single platform.
3. **Feature 002 (Cheerful Brain)**: Copilot proactively monitors the content library and surfaces insights: "Your top-performing UGC post this month (4.8% ER) is from a creator you haven't worked with in 6 months."

**Built vs. Enhanced:**
- Zero-signup brand mention capture: **Build** (extend `PostTrackingWorkflow` to monitor brand handles; add TikTok capture layer)
- Story capture: **Build** (new polling cadence <6hr; existing `post_type = story` schema ready)
- UGC Content Library UI: **Build** (new web app section; leverages existing `creator_post` table + Supabase Storage)
- Pre-publication approval workflow: **Build** (new `approval_status` field on `creator_post`; new approval queue UI + email notification)
- Rights management: **Build** (new `content_rights` table; integration with Feature 001 contracts)
- TikTok Spark Code hub: **Build** (new `spark_code` field; workflow to request/store codes)

---

*Sources: `analysis/categories/content-collaboration.md` · `analysis/campaigns/market-trends.md` §Trend 8 · `analysis/competitors/archive.md` · `analysis/competitors/modash.md` · `analysis/competitors/aspire.md` · `analysis/competitors/grin.md` · `analysis/competitors/heepsy.md` · `analysis/synthesis/competitor-matrix.md` §4*
