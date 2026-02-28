# Competitor Deep-Dive: Archive

**Wave:** 2a — Competitor Deep-Dive
**Date:** 2026-02-28
**Sources:** [archive.com](https://archive.com/), [Shopify App Store](https://apps.shopify.com/archive-app-ugc-instagram-stories-tiktok), [Product Hunt](https://www.producthunt.com/products/archive), [1800dtc.com overview](https://1800dtc.com/tool/archive), [Pixis UGC Platforms 2026](https://pixis.ai/blog/best-ugc-influencer-marketing-platforms-2026/)

---

## Company Overview

- **Founded:** ~2021–2022
- **Positioning:** AI-powered UGC capture and social listening platform for DTC/eCommerce brands
- **Clients:** 50,000+ brands including Allbirds, Notion, DoorDash, Uniqlo, Momofuku
- **Market focus:** DTC/eComm brands, agencies managing multiple brand accounts, social media managers who run always-on influencer programs
- **Stage:** Growth-stage; Shopify App Store integration; API access available

### Why Archive Exists

Archive was built to solve a specific, painful problem: influencer marketing teams were manually screenshotting Stories (which expire in 24h), copying post links into spreadsheets, and losing content. When a brand works with 50–500 creators, tracking every tagged post across Instagram, TikTok, and YouTube manually is a full-time job. Archive eliminates that job with automated 24/7 content detection.

---

## Feature Inventory

### Core: UGC Auto-Capture

- **Coverage claims:** 100% of tagged Instagram content (posts, Stories, Reels), 98% of TikTok content — "400% more content than competing platforms"
- **Story capture:** 24/7 automated detection including ephemeral Instagram Stories (expires after 24h — competitors miss these entirely without automation)
- **Zero-signup tracking:** Tracks any creator who tags the brand — no creator account required, no opt-in
- **Manual URL add:** For untagged content brands discover themselves
- **Archive Radar (Untagged Detection):** AI watches video, listens to audio, reads text — detects brand in posts even without tags or mentions. First-in-market untagged detection at this price point
- **TikTok Spark Codes:** Centralized management of Spark Codes for paid TikTok ad amplification — described as the only platform with this workflow in one place

### AI Features

- **AI Super Search:** Natural language queries across full UGC library ("happy child unboxing a toy") — processes thousands of posts in seconds
- **Smart AI Fields:** Auto-tags posts with products, campaigns, sentiment, custom fields
- **Weekly AI Insider Report:** Auto-generated summary highlighting top performers, trending content, campaign insights — replaces manual weekly reporting slide

### Discovery & Creator Intelligence

- **Creator Search (Competitor Intelligence):** Find every creator currently working with competitor brands — search by "brands they've posted about." Unique competitive intelligence angle not common at $308/mo
- **Historic content history:** View a creator's full post history and past brand partnerships before signing
- **Brand safety check:** AI reviews creator historic content against configurable brand/legal/comms rules before partnership

### Campaign Management

- **Campaign Dashboards:** Real-time auto-populated dashboards tracking 13 metrics: EMV, impressions, engagement, follower count — no manual data entry
- **Collections:** Unlimited visual collections for organizing UGC by campaign, creator, theme
- **Labels:** Customizable creator categorization
- **Live Campaign Reporting:** Per-creator, per-post performance, real-time
- **Competitor Insights:** Automatically benchmarks against rival brands' influencer programs

### UGC Repurposing & Rights

- **Usage rights management:** Request and track rights per piece of content
- **Whitelisting:** License content for paid ads
- **Bulk download:** High-resolution UGC downloads
- **Shoppable UGC widgets:** Embed UGC on Shopify storefront, drive conversion
- **Public sharing:** Shareable public links for collections and campaign dashboards (for reporting to clients/stakeholders)

### Integrations

- **Shopify:** UGC → shoppable product feeds; track which creator content drives sales
- **Instagram Business accounts:** Native connection
- **TikTok Business accounts:** Native connection
- **YouTube channels:** Native connection
- **API + Webhooks:** Real-time notifications; access to social profile data and UGC metadata (Enterprise)
- **Slack:** Real-time UGC alerts

---

## Unique Differentiators

1. **Always-on Story capture** — ephemeral content is the #1 gap for every competitor; Archive solves this uniquely
2. **Untagged brand detection (Archive Radar)** — AI watches video/audio to catch posts where creators forget to tag
3. **TikTok Spark Code hub** — unique centralized workflow for TikTok ad amplification
4. **Competitor creator intelligence** — see which creators work with rival brands, at SMB price point ($308/mo vs. $25K+ enterprise tools)
5. **Zero-signup tracking** — unlike GRIN (opt-in only) or Aspire (creator self-submission), Archive captures any creator automatically
6. **Under 5-min setup** — no migration, starts building library from day 1

---

## Weaknesses

1. **NOT a CRM or outreach platform** — Archive cannot cold-email creators; it has no contact management, relationship history, or outreach sequencing. Brands that need to find and contact new creators still need a separate tool
2. **NOT a full discovery database** — Archive's "Creator Search" finds creators already posting about brands, not a 250M+ pre-indexed discovery database for prospecting
3. **No contracts or payments** — zero capability for creator agreements, e-signatures, W-9, 1099, or payment disbursement
4. **No content pre-approval** — Archive captures AFTER posting; no pre-publication review, approval queue, or brief delivery workflow
5. **Not for solopreneurs / scheduling-only** — limited utility if you're not running an active influencer/UGC program
6. **Shopify-only eCommerce** — shoppable widgets and attribution only work with Shopify (not WooCommerce, BigCommerce)
7. **Limited direct discovery** — best for brands already generating UGC; less useful for brands starting from scratch with no creator relationships
8. **No content creation tools** — pure capture/management; no brief templates, no creative direction workflows

---

## Pricing Model

| Plan | Price | Key Limits |
|------|-------|-----------|
| Starter | Free | Basic capture, 2 social accounts |
| Pro | $308/month (~$3,696/yr) | 2 social accounts, 2yr UGC storage, usage rights tools, Slack alerts, CSV export, Campaigns, Influencer Labelling, Reporting |
| Enterprise | Custom | Custom MSA, security auditing, dedicated account manager, API access, webhooks |

**Lock-in mechanisms:**
- UGC library accumulates over time — switching means losing content history
- Creator labels, custom Smart AI fields, and campaign-specific collections are irreplaceable archives
- Shopify shoppable UGC feeds embed Archive content directly in storefront
- Public collection/dashboard links may be shared with clients → external dependency

**Competitive cost:** $3,696/yr vs. $25,000–$30,000/yr for GRIN or Aspire with similar content capture. Archive is 85% cheaper for the UGC capture use case specifically.

---

## Workflow Integration Depth

**Daily workflow touchpoints Archive creates:**
1. Morning: Review AI Insider Report — which creators posted this week?
2. Pre-partnership: Run brand safety check on creator's historic content
3. During campaign: Monitor Campaign Dashboard for real-time post detection
4. Post-campaign: Export report; request usage rights; download assets for ads
5. Always-on: Competitor creator intelligence → identify rivals' creators to target

**Stickiness:** High. Once a brand's UGC library is in Archive, it's the single source of truth for all influencer content. The library builds continuously; switching means losing accumulated assets, labels, rights records, and campaign history.

---

## What Cheerful Already Has

From `spec-data-model.md` §creator_post and `spec-workflows.md` §PostTrackingWorkflow:

- **`creator_post` table:** Stores Instagram posts (post, story, reel types), including `media_storage_path` (permanent Supabase Storage copy), `like_count`, `view_count`, `comment_count`, `posted_at`, `match_method` (caption OR LLM), `match_reason`
- **`PostTrackingWorkflow`:** Runs daily via `PostTrackingSchedulerWorkflow`; iterates opted-in creators and calls `process_creator_posts_activity` per creator
- **Dual detection:** Caption text match → falls back to Claude Sonnet vision API when text match fails (`detection_method` stored per post)
- **Permanent media storage:** `media_storage_path` = Supabase Storage copy (prevents content from disappearing)
- **Content type support:** Schema supports `post`, `story`, `reel` post types

### What Cheerful's Version Does NOT Have vs. Archive

| Capability | Archive | Cheerful Current State |
|-----------|---------|----------------------|
| Platforms tracked | Instagram + TikTok + YouTube | Instagram ONLY |
| Opt-in requirement | Zero-signup; tracks any creator who tags brand | Opted-in creators only (`campaign_creator` opt-in required) |
| Untagged detection | Archive Radar (AI video/audio/text) | Caption text + Claude Sonnet vision (requires tag/mention) |
| Content library UI | Searchable, filterable, labeled, Collections | No dedicated UI; backend table only |
| UGC rights management | Full rights request + licensing workflow | Not implemented |
| EMV calculation | Automated per post | Not implemented |
| Competitor creator intelligence | Track which creators work with rival brands | Not implemented |
| Searchable AI library | Natural language "find UGC of happy child unboxing" | Not implemented |
| TikTok Spark Codes | Centralized management | Not implemented |
| Shoppable UGC widgets | Shopify embed | Not implemented |
| Usage rights bulk download | High-res bulk export | Not implemented |
| Public shareable report links | Yes | Not implemented |

---

## What Cheerful Can Learn

### 1. Zero-Signup UGC Tracking (Expand Tracking Scope)
**The insight:** Archive's most-cited differentiator is that it tracks ANY creator who mentions/tags a brand — no opt-in. Cheerful's `PostTrackingWorkflow` currently only runs for `campaign_creator` rows with explicit opt-in status. Expanding to scan brand hashtags and mentions continuously (not just opted-in campaign creators) would transform Cheerful from a campaign-scoped tracker to an always-on brand listener — dramatically increasing the value of the `creator_post` table.

### 2. Multi-Platform Content Tracking
**The insight:** TikTok is now the #1 platform for influencer marketing (51.9% of US marketers sell via TikTok Shop per integrations research). Cheerful's `PostTrackingWorkflow` uses Apify to scrape Instagram — extending to TikTok and YouTube would multiply the value of the existing infrastructure without a schema change (the `post_type` field already exists).

### 3. UGC Asset Library UI
**The insight:** The data is already in Cheerful's `creator_post` table, but there is no client-facing library to browse, filter, label, or download it. Archive's entire product is essentially a UI over this kind of data. A "Content Library" tab in Cheerful's campaign view would unlock significant value with relatively low backend effort.

### 4. EMV & Automated Campaign Reporting
**The insight:** Archive's 13-metric Campaign Dashboard (including EMV) is its primary stickiness driver. Cheerful already has `like_count`, `view_count`, `comment_count` per post — calculating EMV and surfacing it in a campaign summary view requires formula logic, not new data collection.

---

## 3 Hero Feature Candidates

### HF-A: Always-On Brand Mention Capture
**Problem:** Brands miss 30–70% of influencer content (Stories expire in 24h; untagged posts never appear; TikTok/YouTube posts invisible to Instagram-only tracking). Competitors who miss content cannot measure ROI or repurpose assets.

**How in Cheerful:** Extend `PostTrackingWorkflow` to:
- Monitor brand hashtags and mentions continuously (not just opted-in creators)
- Add TikTok + YouTube via Apify scrapers (Apify already integrated)
- Run story capture on sub-24h intervals (Temporal scheduler already in place)
- Expand `creator_post` table: add `platform` column (currently implied Instagram-only), `brand_mention_type` (tagged / untagged / hashtag)

**Stickiness:** Every piece of content captured = irreplaceable historical archive. After 6 months, this library is impossible to recreate. **High switching cost.**

---

### HF-B: UGC Content Library with Rights Management
**Problem:** Teams waste 40+ hours/week manually tracking creator content in spreadsheets and Google Drive. No platform makes it easy to find "that video of a creator unboxing our product" or legally request usage rights for paid ads.

**How in Cheerful:** Build a "Content Library" tab (all `creator_post` data already exists):
- Filterable grid: by platform, campaign, creator, post type, date range, engagement
- AI natural language search (Claude claude-opus-4-6 already integrated — "find posts where creator is outdoors")
- Usage rights request button → sends permission DM/email to creator via Cheerful outreach
- Rights status tracking field added to `creator_post` table
- Bulk high-res download
- Public shareable link for stakeholder reports

**Stickiness:** UGC library grows continuously. Rights records are compliance artifacts. Clients embed their library in internal workflows. **Very high switching cost.**

---

### HF-C: Competitor Creator Roster Intelligence
**Problem:** Brands have no visibility into which creators their competitors are activating. Identifying rivals' top creators — and targeting them before competitors re-book them — is a significant acquisition advantage.

**How in Cheerful:** Track competing brand hashtags/mentions passively (same infrastructure as HF-A):
- Client specifies competitor brand handles and hashtags
- Cheerful monitors competitor brand tags continuously
- Surfaces "Creators working with [Competitor]" in discovery UI
- Identifies creators who post for competitors but haven't been reached by the client
- Pre-populates outreach campaign with these creators

**Stickiness:** Requires continuous monitoring to maintain intelligence freshness. Clients become dependent on the competitive signal feed. **Unique moat** — Archive offers this but has no outreach capability; Cheerful can combine intelligence + outreach into one workflow.

---

## Summary

Archive is the most focused competitor in the market — it does one thing (UGC capture) exceptionally well, at an accessible price ($308/mo). Its 50,000+ brand customer base proves massive demand. But Archive **has no outreach capability whatsoever** — it cannot cold-email creators, manage relationships, run campaigns, handle contracts, or process payments.

**Cheerful's structural moat:** Cheerful already has Gmail-native cold outreach, Temporal-powered automation, Claude AI personalization, and an emerging `creator_post` infrastructure. If Cheerful's content capture matches Archive's zero-signup, multi-platform, always-on model, clients would have **zero reason to pay $308/mo to Archive separately**. The goal is for Cheerful to be the platform where influencer outreach and UGC management both live — making Archive redundant, not just competitive.

**Core insight:** Archive proves that clients will pay $308/mo just for a UGC content library. Cheerful already has the data infrastructure — it just needs the UI and expanded tracking scope to capture this spend.
