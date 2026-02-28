# Cheerful × TikTok — Applicability Matrix

> Synthesized from all 22 analysis files (11 Official TikTok APIs, 6 third-party/unofficial methods, 4 Cheerful architecture deep-dives, and the TikTok Integration Atlas).
> Last updated: 2026-02-28

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Workflow Coverage Map](#2-workflow-coverage-map)
3. [Per-Workflow Applicability Detail](#3-per-workflow-applicability-detail)
   - 3.1 Creator Discovery
   - 3.2 Creator Enrichment
   - 3.3 Outreach
   - 3.4 Content Tracking
   - 3.5 Campaign Management
   - 3.6 Paid Amplification (Spark Ads)
   - 3.7 Commerce & Affiliate Tracking
   - 3.8 Reporting & Analytics
4. [Integration Tier Classification](#4-integration-tier-classification)
5. [Dependency Graph](#5-dependency-graph)
6. [Quick Wins vs Deep Integrations](#6-quick-wins-vs-deep-integrations)
7. [Effort Estimates](#7-effort-estimates)
8. [Build Order: Recommended Roadmap](#8-build-order-recommended-roadmap)
9. [Permanent Limitations for Cheerful](#9-permanent-limitations-for-cheerful)

---

## 1. Executive Summary

Cheerful's architecture is well-positioned for TikTok integration. The platform-agnostic data layer (`creator.platform`, `campaign_creator.social_media_handles JSONB`) already supports TikTok with zero schema cost. The real work is filling code gaps in discovery, content tracking, and — eventually — OAuth-gated integrations.

**TikTok adds 8 net-new capabilities** to Cheerful's influencer platform:

| Capability | Not possible on Instagram | TikTok Enables |
|-----------|--------------------------|----------------|
| Hashtag-based discovery | ❌ | ✅ Apify hashtag actor |
| Campaign hashtag tracking (UGC detection) | ❌ | ✅ Apify/Research API scan |
| Sound/music campaign tracking | ❌ | ✅ Apify sound actor |
| Duet/stitch attribution | ❌ | ✅ `duet_from_id` / `stitch_from_id` fields |
| Organic-to-paid amplification (Spark Ads) | ❌ | ✅ Marketing API |
| Commerce affiliate tracking (TikTok Shop) | ❌ | ✅ Shop Open API |
| Creator GMV as discovery signal | ❌ | ✅ EchoTik / Shop Affiliate API |
| Share + save rate ROI metrics | ❌ | ✅ `share_count` + `collect_count` |

**Integration complexity overview:**

| Tier | Time to Ship | What's Enabled | Blocking Dependencies |
|------|-------------|----------------|----------------------|
| **0 — Zero new auth** | 1–2 weeks | TikTok creator discovery + basic content tracking | None |
| **1 — Apify pipeline** | 2–4 weeks | Full discovery + enrichment + content tracking + hashtag/sound/duet | Tier 0 |
| **2 — TikTok OAuth** | 4–6 weeks total | Display API enrichment, video.list tracking, Spark Ads eligibility | Tier 1 + Login Kit app review |
| **3 — Paid APIs** | 6–10 weeks total | Spark Ads automation, Marketing API reporting | Tier 2 + Marketing API access |
| **4 — Commerce** | 8–12 weeks total | TikTok Shop affiliate tracking, order webhooks | Tier 1 + Shop seller account |

---

## 2. Workflow Coverage Map

For each Cheerful workflow, the table shows which TikTok integrations are applicable, at what tier, and what effort they require.

| Cheerful Workflow | Tier 0 (Now) | Tier 1 (Apify) | Tier 2 (OAuth) | Tier 3 (Marketing) | Tier 4 (Commerce) |
|-------------------|-------------|----------------|-----------------|---------------------|-------------------|
| **Creator Discovery** | oEmbed (video lookup) | Apify keyword + hashtag + profile | Research API (academic — NOT for Cheerful) | TCM/TTO API (beta) | EchoTik GMV scouting |
| **Creator Enrichment** | Bio-link crawl (reuse existing) | Apify profile rescrape, Modash/HypeAuditor email unlock | Display API (official, creator-connected) | — | — |
| **Outreach** | Email (unchanged) | Email (unchanged) | Login Kit invite in follow-up email | — | TikTok Shop affiliate invite |
| **Content Tracking** | — | Apify video polling (48h), Hashtag scan, Sound tracking, Duet/stitch detection | Display API video list (first-party, connected creators) | Research API video query | — |
| **Campaign Management** | Handle extraction in LLM | Platform dispatch in workflows | TikTokCreatorAuthWorkflow | SparkAdsWorkflow | TikTokShopOrderWorkflow |
| **Paid Amplification** | — | — | Spark Ads code extraction (from email) | Marketing API campaign creation + reporting | — |
| **Commerce** | — | — | — | — | Shop API affiliate, Order webhooks, GMV tracking |
| **Reporting** | oEmbed metadata | TikTok metrics (share/save) in Sheets | Audience demographics via Phyllo | Spark Ads paid metrics (impressions, CPM) | Shop revenue + commission |

---

## 3. Per-Workflow Applicability Detail

### 3.1 Creator Discovery

**Current state:** Instagram-only, via Apify lookalike search from seed profiles.

**TikTok integration methods ranked by applicability:**

#### A. Apify Keyword + Hashtag Search — **PRIMARY, QUICK WIN**

| Attribute | Value |
|-----------|-------|
| API/Service | Apify `clockworks/free-tiktok-scraper` |
| Cost | ~$0.005/result (PPR) |
| Auth required | Apify API key (already in Cheerful) |
| Data returned | Username, bio, follower count, bio link, avatar, verification status |
| New files | `services/external/tiktok_apify.py` |
| Modified files | `temporal/activity/campaign_discovery_activity.py` |
| Campaign config | `discovery_config.platform = "tiktok"`, `keywords[]`, `hashtags[]` |
| Effort | **1 week** |

Discovery modes:
- **Keyword search:** `{searchQueries: ["skincare"], searchSection: "/user", maxItems: 50}` — returns creators matching keyword in name/bio
- **Hashtag search:** `{hashtags: ["#skincareroutine"], maxItems: 100}` — returns creators who post to a hashtag

#### B. Apify Profile Scraper (seed-based) — **MEDIUM TERM**

For "find similar to this creator" functionality — mirrors the Instagram lookalike pattern:
1. Scrape seed profile → extract bio keywords with LLM
2. Run keyword search across TikTok for similar creators
3. Parallels `youtube_apify.py:_extract_keywords_with_llm()` exactly

**Effort:** 1 week (after TikTok Apify service exists)

#### C. Modash / HypeAuditor Discovery API — **PREMIUM OPTION**

| Service | Cost | What it adds over Apify |
|---------|------|------------------------|
| Modash | $16,200/yr (Discovery API) | Email unlock + collab history + audience demographics in search filters |
| HypeAuditor | Custom pricing | Fraud scoring integrated into search; real audience size estimates |

These are standalone B2B APIs — not Apify. Require separate subscription and API key. Useful if Cheerful needs email + demographics *before* outreach (vs discovering email during enrichment).

**Effort:** 1 week per provider (after enrichment service TikTok branch exists)

#### D. TikTok Creator Marketplace / TikTok One — **LONG TERM, HIGH VALUE**

- Pool: ~2M creators in US (10K+ follower minimum)
- Data: audience retention, completion rate, niche tags, past collaboration history — **not available anywhere else**
- Access: TikTok rep contact required for API beta; portal-only until then
- **Not automatable today** without TikTok rep partnership

**Recommendation:** Apply for TCM/TTO API access now (5–7 business day review) even if integration is 3+ months away.

#### E. TikTok Research API — **NOT VIABLE for Cheerful**

- Academic/non-commercial use only — commercial use is **explicitly prohibited** by TikTok's terms
- Cheerful cannot use Research API for creator discovery even if access is granted
- Only valid path: use Research API in a separate internal tool (not customer-facing) if Cheerful is the academic researcher — unlikely to apply

---

### 3.2 Creator Enrichment

**Current state:** 4-tier waterfall (cache → Apify rescrape → bio-link crawl → Influencer Club). Instagram-specific in Tier 2.

**TikTok integration methods:**

#### A. Bio-link Crawl — **FREE, REUSE EXISTING**

`bio_link_apify.py` + `scrape_emails_from_url()` already handle Linktree, Beacons, Stan.store and similar link-in-bio services. TikTok creators heavily use these.

**Zero new code.** Add `elif creator.platform == "tiktok"` branch to `enrichment_service.py` that calls existing infrastructure.

**Effort:** **2 days** (just the branch + TikTok handle extraction from bio)

#### B. Apify TikTok Profile Rescrape — **QUICK WIN**

Actor: `nba1rst/tiktok-profile-scraper` ($0.001/result)

Re-scrape for updated bio/bio-link when initial discovery data is stale. Captures email if added to bio since discovery.

**Effort:** Same as discovery service (reuses `TikTokApifyService.get_creator_profile()`)

#### C. Modash Email Unlock — **MEDIUM TERM, HIGH VALUE**

- Modash maintains a database of creator contact info (~30% hit rate for mid-tier TikTok creators)
- API: `GET /v1/tiktok/profile/{username}` returns contact email if available
- Pricing: included in Modash subscription ($199+/mo base)

Best used as Tier 3 enrichment (after bio-link crawl fails). Replace or supplement Influencer Club for TikTok.

**Effort:** 1 week (new enrichment tier + Modash API client)

#### D. TikTok Display API — **DEEP INTEGRATION, POST-OAUTH**

After a creator connects via TikTok Login Kit (see §3.3 and §3.5):

```
GET https://open.tiktokapis.com/v2/user/info/
Fields: display_name, bio_description, avatar_url, follower_count,
        following_count, likes_count, video_count, is_verified, profile_deep_link
```

**Benefits over Apify:** Real-time data, zero anti-bot risk, official TikTok data, refreshable via stored OAuth token.

**Effort:** 2 weeks (Login Kit OAuth flow prerequisite + `TikTokApiClient` service)

#### E. Phyllo (Post-Acceptance Demographics) — **PREMIUM, DEEP**

After creator accepts campaign, invite them to connect TikTok via Phyllo's creator-permissioned OAuth:
- Returns: audience gender/age/geo split, engagement rate, content categories
- Pricing: ~$199/mo+
- This is the **only official way** to get audience demographics for mid-tier creators without TCM partnership

Positioned as a "connect your account for better analytics" UX step in the post-opt-in sequence.

**Effort:** 2 weeks (new enrichment step + Phyllo API client)

---

### 3.3 Outreach

**Current state:** Gmail API (operator's Gmail), rate-limited sending, email-first.

#### A. Email (Unchanged) — **PRIMARY CHANNEL**

Email remains the primary and only automatable outreach channel for TikTok creators. The Gmail API integration requires no changes.

**TikTok-specific additions to email templates:**
- Platform-specific subject lines ("Collab opportunity for your TikTok audience")
- TikTok creator metrics in personalization (if available from Apify enrichment)

**Effort:** **0 days** (copy changes only, no code)

#### B. TikTok DM Outreach — **NOT POSSIBLE**

TikTok's API explicitly prohibits brand-initiated DMs via API. No official or reliable third-party method exists:
- PhantomBuster DM phantom exists but is a TOS violation with account ban risk
- Composio's TikTok connector has no DM capability
- Business Messaging API: consumer must initiate; geographically restricted to non-US/EU

**Assessment:** TikTok DM is a permanent gap in the current API landscape. Email remains the only automatable outreach channel.

#### C. TikTok Creator Marketplace Collaboration Request — **FUTURE, PORTAL-ONLY**

Through TCM portal (manually), a brand can submit a campaign brief to specific creators. This is NOT API-automatable without enterprise TCM API access.

When/if TCM API becomes fully accessible, a collaboration request workflow becomes possible:
- Create campaign brief → TikTok reviews → invite specific creators
- Creators receive in-app notification + compensation offer

**Effort when available:** 2–3 weeks (new workflow pattern)

#### D. Post-Opt-in "Connect TikTok" CTA — **TIER 2 UNLOCK**

In the post-opt-in follow-up email sequence, include a "Connect your TikTok" button that initiates TikTok Login Kit OAuth. This is the key unlock for Display API enrichment and Spark Ads.

Email template change: 1 day. OAuth flow: 2 weeks.

---

### 3.4 Content Tracking

**Current state:** `PostTrackingWorkflow` (48h) → Apify Instagram profile scraper → Instagram-hardcoded at 9 files. TikTok creators are completely skipped today.

#### A. Apify Video Polling — **PRIMARY, QUICK WIN**

Replace skip-if-no-instagram with platform-aware dispatch:

```python
# get_trackable_creators_activity — add TikTok creators to trackable list
for platform in ["instagram", "tiktok"]:
    handle = extract_handle_for_platform(creator.social_media_handles, platform)
    if handle:
        trackable.append(TrackableCreator(platform=platform, platform_handle=handle, ...))
        break

# process_creator_posts_activity — platform dispatch
if creator.platform == "tiktok":
    posts = fetch_tiktok_posts(creator.platform_handle, max_posts=10)
```

**Actor:** `clockworks/free-tiktok-scraper` — returns: video ID, caption, views, likes, comments, shares, saves, hashtags, duet/stitch source, music ID, thumbnail.

**Requires:** `creator_post` table migration (add `platform`, `platform_post_id`, `platform_metrics`).

**Effort:** **1 week** (including migration, new `apify_tiktok_posts.py`, activity dispatch)

#### B. Campaign Hashtag Tracking — **UNIQUE TO TIKTOK, NEW**

New activity `track_tiktok_hashtag_activity` added to `PostTrackingWorkflow`:

```python
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "hashtags": ["#BrandXChallenge"],
    "resultsPerPage": 100,
})
# For each video: match to known campaign_creator OR flag as organic UGC
```

**New campaign field:** `tiktok_config.campaign_hashtag`

This enables detection of content posted by creators Cheerful hasn't explicitly tracked — UGC discovery.

**Effort:** **3 days** (new activity + campaign field + matching logic)

#### C. Sound/Music Campaign Tracking — **UNIQUE TO TIKTOK, NEW**

If brand creates a custom TikTok sound, track videos using it:

```python
client.actor("clockworks/free-tiktok-scraper").call(run_input={
    "sounds": ["https://www.tiktok.com/music/Brand-Sound-7234..."],
    "resultsPerPage": 100,
})
```

**New campaign field:** `tiktok_config.campaign_sound_id`

**Effort:** **3 days** (new activity + campaign field + attribution logic)

#### D. Duet/Stitch Attribution — **UNIQUE TO TIKTOK, NEW**

When tracking TikTok videos, check `duet_from_id` and `stitch_from_id` against the campaign's hero video ID:

```python
if post.duet_from_id == campaign.tiktok_config.get("hero_video_id"):
    return AnalysisResult(matches=True, method="duet_from_brand", ...)
```

Enables attribution without caption keyword matching — creators who duet the brand's video are automatically attributed to the campaign.

**New campaign field:** `tiktok_config.hero_video_id`

**Effort:** **2 days** (analyzer.py logic change + campaign field)

#### E. TikTok Display API Video List — **PREMIUM, POST-OAUTH**

For creators connected via TikTok Login Kit:

```
GET https://open.tiktokapis.com/v2/video/list/
Fields: id, title, video_description, embed_link, like_count, comment_count, share_count, view_count, create_time
Auth: Creator's access_token
```

**Benefits:** First-party data, real-time, no Apify cost, no anti-bot risk.

Falls back to Apify polling for non-connected creators. Parallel to how a Shopify integration works — some partners are connected, some aren't.

**Effort:** 1 week (after Login Kit OAuth flow is built)

---

### 3.5 Campaign Management

**Current state:** Temporal workflows orchestrate discovery → outreach → reply processing → opt-in → tracking. Platform-aware dispatch exists for Instagram/YouTube but not TikTok.

#### A. TikTok Handle Extraction — **QUICK WIN, 2 DAYS**

In `ThreadProcessingCoordinatorWorkflow`, the LLM extraction prompt needs TikTok handle recognition:

```python
# LLM prompt addition:
"Extract the TikTok handle from the email if present.
TikTok profiles are at tiktok.com/@username or referenced as @username on TikTok.
Output: social_media_handles = [{platform: 'tiktok', handle: 'username', url: '...'}]"
```

`campaign_creator.social_media_handles` JSONB already supports `"tiktok"` platform — no schema change.

**Effort:** **2 days**

#### B. TikTok Creator Auth Workflow — **NEW WORKFLOW, TIER 2**

When a creator opts in and clicks "Connect TikTok" in the follow-up email:

```
Creator clicks → GET /auth/tiktok → TikTok Login Kit OAuth
  → POST /auth/tiktok/callback → exchange code for tokens
  → store in creator_social_auth table
  → trigger Display API enrichment
  → unlock: video.list tracking, Spark Ads eligibility
```

**New infrastructure:**
- `creator_social_auth` table (new)
- `/auth/tiktok` + `/auth/tiktok/callback` FastAPI routes
- `TikTokCreatorAuthWorkflow` Temporal workflow
- `TikTokApiClient` service class

**Effort:** **2 weeks**

#### C. Platform Dispatch in Discovery Activity — **QUICK WIN**

`campaign_discovery_activity.py` needs a TikTok branch:

```python
platform = config.get("platform", "instagram")
if platform == "tiktok":
    return _discover_tiktok_creators(params, config)
```

No new workflow, just a new branch in the existing activity.

**Effort:** **3 days** (after TikTokApifyService exists)

#### D. TikTok-Aware Flag Extraction — **MEDIUM TERM**

Extend `extract_thread_flags` in `ThreadProcessingCoordinatorWorkflow` to detect TikTok-specific signals in email replies:

| Flag | Detection Logic | Downstream Action |
|------|----------------|-------------------|
| `has_tiktok_video_url` | Regex for `tiktok.com/@.*/video/*` | Auto-attribute post to campaign |
| `has_spark_ads_code` | Detect 32-char alphanumeric code from TikTok Creator Center | Trigger `SparkAdsWorkflow` |
| `has_tiktok_shop_acceptance` | Keyword detection for TikTok Shop affiliate acceptance | Trigger shop affiliate setup |

**Effort:** **3 days** (LLM prompt extension + flag constants)

---

### 3.6 Paid Amplification (Spark Ads)

**Current state:** No paid amplification capability in Cheerful. Spark Ads is a TikTok-unique feature that allows brands to boost creator's organic content as a paid ad.

#### A. Spark Ads Workflow — **HIGH VALUE, TIER 3**

**End-to-end flow:**
1. Creator posts TikTok video organically
2. Creator generates Spark Ads code in TikTok Creator Center (7–365 day window)
3. Creator shares code in email reply to Cheerful outreach
4. `has_spark_ads_code` flag triggers `SparkAdsWorkflow`
5. Cheerful calls Marketing API to authorize + create the Spark Ad

**New workflow: `SparkAdsWorkflow`**

```
extract_spark_ads_code_from_thread_activity
  → authorize_spark_ad_activity
       POST https://business-api.tiktok.com/open_api/v1.3/tt_video/auth/
       {advertiser_id, video_auth_token: SPARK_CODE}
  → create_spark_ad_activity
       POST https://business-api.tiktok.com/open_api/v1.3/ad/create/
  → monitor_spark_ad_activity (periodic)
       POST https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/
```

**Prerequisites:**
1. TikTok Marketing API access (business account + 5–7 day review)
2. TikTok Ads Manager account with advertiser ID
3. `campaign.tiktok_config.ad_account_id` field
4. `campaign.tiktok_config.spark_ads_enabled = true`

**Effort:** **2 weeks** (new workflow + Marketing API client + ad account setup)

#### B. Spark Ads via TCM Order — **FUTURE, AUTOMATIC**

When a creator accepts a TCM collaboration order, Spark Ads authorization is automatically included. No separate code needed — Spark Ads eligibility comes with the TCM order acceptance.

This is only available through TCM portal today; future TCM API access would enable automation.

---

### 3.7 Commerce & Affiliate Tracking

**Current state:** GoAffPro + Shopify for gifting campaigns. No TikTok Shop support.

#### A. TikTok Shop Affiliate Tracking — **NEW, TIER 4**

**End-to-end flow:**
1. Brand is a TikTok Shop seller (seller account required)
2. Creator is added as affiliate → receives `tiktok_affiliate_link`
3. Creator includes product link in TikTok video
4. Sales tracked via TikTok Shop webhook: `ORDER_STATUS_CHANGE`
5. Cheerful records order → Slack digest → campaign ROI attribution

**New workflow: `TikTokShopOrderWorkflow`**

```
TikTok Shop webhook: ORDER_STATUS_CHANGE
  → ingest_tiktok_shop_order_activity(payload)
  → match_order_to_campaign_creator_activity(affiliate_link → creator_id)
  → post_tiktok_order_to_slack_activity
  → update_campaign_creator_order_status_activity
```

**New infrastructure:**
- TikTok Shop seller account (per client)
- HMAC-SHA256 request signing for all Shop API calls
- `tiktok_shop_order` table (new)
- `campaign_creator.tiktok_affiliate_link` column
- `/webhooks/tiktok-shop` FastAPI route
- `TikTokShopApiClient` service (with HMAC signing)

**Regional constraint:** TikTok Shop only available in 17 countries — **Canada NOT included**. US, UK, Germany, France, Italy, Spain, Japan, Singapore, Indonesia, Malaysia, Thailand, Vietnam, Philippines, Mexico, Brazil are covered.

**Effort:** **2 weeks** (new workflow + Shop API client + new table + webhook handler)

#### B. Creator GMV Discovery via EchoTik — **MEDIUM TERM**

EchoTik provides TikTok Shop creator analytics including GMV estimates without requiring seller account access:

- Cost: $9.9–$57/mo platform
- Custom API pricing for programmatic access
- Enables: discovery of creators by TikTok Shop sales volume

Use case: "Find skincare creators who have sold $10K+ in TikTok Shop" — a powerful signal for commerce-focused campaigns.

**Effort:** 1 week (new enrichment provider + EchoTik API client)

---

### 3.8 Reporting & Analytics

**Current state:** `ThreadExtractMetricsWorkflow` → Google Sheets. Creator metrics self-reported from email text. No TikTok video metrics in any report.

#### A. TikTok Video Metrics in Google Sheets — **QUICK WIN**

Extend `update_sheet_with_metrics_activity` with platform-aware columns:

| New Column | Data Source | Notes |
|-----------|-------------|-------|
| TikTok Plays | `creator_post.view_count` (= play_count) | Primary reach metric |
| TikTok Likes | `creator_post.like_count` | Same concept as Instagram |
| TikTok Shares | `creator_post.platform_metrics.share_count` | No Instagram equivalent |
| TikTok Saves | `creator_post.platform_metrics.collect_count` | No Instagram equivalent |
| TikTok Comments | `creator_post.comment_count` | Same |
| Share Rate | shares / plays | Computed — strong virality signal |
| Save Rate | saves / plays | Computed — strong content resonance signal |

**Effort:** **2 days** (extend Sheets activity column mapping)

#### B. Spark Ads Performance Reporting — **TIER 3**

When Spark Ads run, Marketing API provides paid metrics:

```
POST https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/
Dimensions: [ad_id]
Metrics: [impressions, clicks, spend, video_play_actions, reach, cpm, cpv]
```

New Google Sheets columns: Spark Ad Impressions, Paid Reach, Spend, CPM, CPV

New optional workflow: `TikTokAdsReportingWorkflow` (daily poll → Sheets).

**Effort:** **1 week** (new workflow + Marketing API reporting endpoint)

#### C. Audience Demographics Reporting — **DEEP, POST-OAUTH**

For connected creators (Phyllo or Display API):
- Audience gender/age/geo split
- Engagement rate benchmark vs. niche average
- Follower authenticity score (HypeAuditor)

These populate a new "Creator Demographics" sheet tab or enrich existing campaign creator records.

**Effort:** 1 week (after enrichment providers are integrated)

---

## 4. Integration Tier Classification

### Tier 0: Zero New Auth — Start Today

| Integration | What It Enables | New Code Needed |
|-------------|-----------------|-----------------|
| Bio-link crawl for TikTok | Email enrichment (reuses existing infrastructure) | `elif platform == "tiktok"` branch in `enrichment_service.py` |
| TikTok handle extraction in LLM | Detect TikTok handles from email replies | LLM prompt extension |
| oEmbed lookup | Caption + username metadata for any TikTok video URL | Simple HTTP GET — no auth |

**Effort: 2–3 days total**

---

### Tier 1: Apify Pipeline — Core TikTok Support

*Requires: Apify API key (already in Cheerful)*

| Integration | What It Enables | Effort |
|-------------|-----------------|--------|
| `TikTokApifyService` (new file) | Keyword search, hashtag search, profile scrape | 1 week |
| `save_creator_from_tiktok()` | Store TikTok creators in existing Creator table | 2 days |
| TikTok discovery branch in activity | `campaign_discovery_activity.py` platform dispatch | 3 days |
| `creator_post` table migration (Phase 1) | `platform`, `platform_post_id`, `platform_metrics` columns | 1 day |
| `apify_tiktok_posts.py` (new file) | `TikTokPost` dataclass + `fetch_tiktok_posts()` | 2 days |
| Post tracking activity — TikTok dispatch | Include TikTok creators in 48h tracking | 3 days |
| Hashtag campaign tracking | UGC detection via campaign hashtag | 3 days |
| Sound/music tracking | Videos using brand's custom sound | 3 days |
| Duet/stitch attribution | Automatic attribution via `duet_from_id` | 2 days |
| TikTok metrics in Google Sheets | share_count, collect_count, share_rate, save_rate | 2 days |

**Total Tier 1 effort: ~4 weeks**
**Total through Tier 1: ~5 weeks**

---

### Tier 2: TikTok Login Kit OAuth — Premium Creator Integration

*Requires: TikTok Developer account + Login Kit app review (3–4 business days)*

| Integration | What It Enables | Effort |
|-------------|-----------------|--------|
| Login Kit OAuth flow (`/auth/tiktok`, `/auth/tiktok/callback`) | TikTok token storage for creators | 1 week |
| `creator_social_auth` table (new) | Store `access_token` + `refresh_token` per creator | 2 days |
| `TikTokApiClient` service | Reusable API client using creator tokens | 3 days |
| Display API enrichment branch | Real-time profile data for connected creators | 3 days |
| Display API video tracking | `video/list` endpoint vs Apify polling | 3 days |
| Post-opt-in "Connect TikTok" email | CTA to initiate Login Kit OAuth | 1 day |
| `TikTokCreatorAuthWorkflow` | Temporal workflow for auth + enrichment trigger | 3 days |

**Total Tier 2 effort: ~3.5 weeks additional**
**Total through Tier 2: ~8.5 weeks**

---

### Tier 3: Marketing API — Spark Ads & Paid Reporting

*Requires: TikTok Marketing API access (TikTok Ads Manager account + 5–7 day review)*

| Integration | What It Enables | Effort |
|-------------|-----------------|--------|
| TikTok Marketing API client | Campaign management, reporting | 3 days |
| `has_spark_ads_code` flag extraction | Detect Spark Ads codes in email replies | 2 days |
| `SparkAdsWorkflow` | Full organic-to-paid automation | 1.5 weeks |
| `TikTokAdsReportingWorkflow` | Daily paid metrics to Google Sheets | 1 week |
| Campaign `tiktok_config.ad_account_id` field | Connect ad account to campaign | 1 day |

**Total Tier 3 effort: ~3 weeks additional**
**Total through Tier 3: ~11.5 weeks**

---

### Tier 4: TikTok Shop Commerce

*Requires: TikTok Shop seller account per brand client (varies by country)*

| Integration | What It Enables | Effort |
|-------------|-----------------|--------|
| `TikTokShopApiClient` with HMAC signing | Shop API authenticated calls | 1 week |
| `tiktok_shop_order` table (new) | Record shop affiliate orders | 2 days |
| `/webhooks/tiktok-shop` endpoint | Receive Shop order events | 2 days |
| `TikTokShopOrderWorkflow` | Attribution → Slack → campaign ROI | 1.5 weeks |
| `campaign_creator.tiktok_affiliate_link` column | Per-creator affiliate URL | 1 day |

**Total Tier 4 effort: ~3 weeks additional**
**Total through Tier 4: ~14.5 weeks**

---

## 5. Dependency Graph

```
TIER 0: Zero auth (2–3 days)
├── Bio-link crawl for TikTok (reuse existing)
├── TikTok handle extraction in LLM prompts
└── oEmbed lookup for any TikTok URL

       ↓

TIER 1: Apify Pipeline (4 weeks)
├── [PREREQUISITE: Apify API key — already present]
├── TikTokApifyService (keyword + hashtag + profile)
├── save_creator_from_tiktok()
├── campaign_discovery_activity.py TikTok branch
│     depends on: TikTokApifyService
├── creator_post table migration (Phase 1)
├── apify_tiktok_posts.py + TikTokPost dataclass
├── post_tracking_activity.py TikTok dispatch
│     depends on: creator_post migration + apify_tiktok_posts.py
├── Hashtag tracking activity
│     depends on: post_tracking_activity dispatch
├── Sound/music tracking activity
│     depends on: post_tracking_activity dispatch
├── Duet/stitch attribution in analyzer.py
│     depends on: apify_tiktok_posts.py (provides duet_from_id)
├── TikTok metrics in Google Sheets
│     depends on: creator_post migration (platform_metrics column)
├── Modash email unlock enrichment (optional parallel)
│     depends on: Modash subscription
└── EchoTik GMV scouting (optional parallel)
      depends on: EchoTik subscription

       ↓

TIER 2: Login Kit OAuth (3.5 weeks)
├── [PREREQUISITE: TikTok app review — 3–4 business days]
├── creator_social_auth table
├── /auth/tiktok OAuth endpoints
├── TikTokApiClient (creator token auth)
│     depends on: creator_social_auth table
├── TikTokCreatorAuthWorkflow
│     depends on: OAuth endpoints + creator_social_auth
├── Display API enrichment
│     depends on: TikTokApiClient + creator_social_auth
├── Display API video tracking (video/list)
│     depends on: TikTokApiClient + creator_social_auth
├── Post-opt-in "Connect TikTok" email
│     depends on: /auth/tiktok endpoint URL
└── Phyllo demographics (optional parallel)
      depends on: Phyllo subscription

       ↓

TIER 3: Marketing API (3 weeks)
├── [PREREQUISITE: TikTok Marketing API access — 5–7 business days]
├── [PREREQUISITE: TikTok Ads Manager account + advertiser ID]
├── TikTok Marketing API client (Business auth, long-lived token)
├── has_spark_ads_code flag extraction
│     depends on: extract_thread_flags LLM prompt extension
├── SparkAdsWorkflow
│     depends on: Marketing API client + has_spark_ads_code flag
└── TikTokAdsReportingWorkflow
      depends on: Marketing API client + SparkAdsWorkflow

       ↓

TIER 4: TikTok Shop (3 weeks, independent track after Tier 1)
├── [PREREQUISITE: TikTok Shop seller account per client]
├── [PREREQUISITE: HmacSHA256 signing implementation]
├── TikTokShopApiClient
├── tiktok_shop_order table
├── /webhooks/tiktok-shop endpoint
└── TikTokShopOrderWorkflow
      depends on: all of the above
```

---

## 6. Quick Wins vs Deep Integrations

### Quick Wins (1–2 weeks, high value/effort ratio)

| Integration | Value | Effort | Why It's a Win |
|-------------|-------|--------|----------------|
| TikTok handle extraction in LLM | High | 2 days | Unblocks ALL downstream TikTok workflows |
| Bio-link crawl for TikTok | High | 2 days | Reuses existing code; TikTok email discovery path |
| TikTok Apify Service | High | 1 week | Foundation for discovery + enrichment + tracking |
| `save_creator_from_tiktok()` | High | 2 days | Minimal code; enables creator storage |
| Hashtag campaign tracking | Very High | 3 days | TikTok-unique; no Instagram equivalent; new product feature |
| Duet/stitch attribution | High | 2 days | TikTok-unique; powerful brand tracking signal |
| TikTok metrics in Sheets | High | 2 days | Immediate reporting value; share/save are new KPIs |

### Medium-Term (2–4 weeks, significant new capability)

| Integration | Value | Effort | Key Considerations |
|-------------|-------|--------|--------------------|
| `creator_post` table migration | Critical | 1 week | Required for ALL TikTok content tracking |
| TikTok content tracking via Apify | High | 1 week | Core tracking; requires migration |
| Sound/music campaign tracking | High | 3 days | TikTok-unique; powerful for brand sound campaigns |
| TikTok discovery activity branch | High | 1 week | Full discovery pipeline |
| Modash email unlock | Medium | 1 week | External dependency; subscription cost |

### Deep Integrations (4–8 weeks, premium capability)

| Integration | Value | Effort | Key Considerations |
|-------------|-------|--------|--------------------|
| Login Kit OAuth + `creator_social_auth` | Very High | 2 weeks | Unlocks Display API + Spark Ads eligibility |
| Display API enrichment + tracking | High | 1 week (post-OAuth) | Best data quality; no anti-bot risk |
| Spark Ads workflow | Very High | 2 weeks | Unique TikTok feature; large revenue potential for Cheerful's clients |
| Marketing API client + reporting | Medium | 1.5 weeks | Required for Spark Ads |

### Long-Term / Specialized (8+ weeks)

| Integration | Value | Effort | Key Considerations |
|-------------|-------|--------|--------------------|
| TikTok Shop affiliate tracking | High | 3 weeks | Requires seller account per client; 17-country limit |
| TCM/TikTok One API | Very High | 3+ weeks | Requires TikTok rep + beta access; highest-quality creator data |
| Phyllo demographics | Medium | 2 weeks | Additional paid subscription; requires creator consent |
| HypeAuditor fraud scoring | Medium | 1 week | Niche use case; high cost |

---

## 7. Effort Estimates

### Summary: Integration → Effort → Files Changed

| Integration | Effort | New Files | Modified Files | New Workflows |
|------------|--------|-----------|----------------|---------------|
| Tier 0: Bio-link + handle extraction | 2–3 days | 0 | 2 (enrichment_service, LLM prompts) | 0 |
| `TikTokApifyService` | 1 week | 1 (`tiktok_apify.py`) | 0 | 0 |
| `save_creator_from_tiktok()` | 2 days | 0 | 1 (`creator_service.py`) | 0 |
| TikTok discovery branch | 3 days | 0 | 1 (`campaign_discovery_activity.py`) | 0 |
| `creator_post` migration (Phase 1) | 1 day | 1 (SQL migration) | 2 (model, repository) | 0 |
| `apify_tiktok_posts.py` | 2 days | 1 | 0 | 0 |
| TikTok content tracking dispatch | 3 days | 0 | 2 (`post_tracking_activity.py`, `post_processor.py`) | 0 |
| Hashtag campaign tracking | 3 days | 1 (`hashtag_tracking_activity.py`) | 1 (`post_tracking_workflow.py`) | 0 (extends existing) |
| Sound/music tracking | 3 days | 1 (`sound_tracking_activity.py`) | 1 (`post_tracking_workflow.py`) | 0 |
| Duet/stitch attribution | 2 days | 0 | 1 (`analyzer.py`) | 0 |
| TikTok metrics in Sheets | 2 days | 0 | 1 (`update_sheet_activity.py`) | 0 |
| TikTok thread flag extraction | 3 days | 0 | 1 (`thread_flags.py` + prompts) | 0 |
| `creator_post` migration (Phase 2) | 1 day | 1 (SQL migration) | 3 (API model, route, repository) | 0 |
| **Tier 1 Total** | **~4 weeks** | **6** | **~14** | **0** |
| Login Kit OAuth + `creator_social_auth` | 1 week | 2 (auth routes, table) | 0 | 0 |
| `TikTokApiClient` service | 3 days | 1 | 0 | 0 |
| Display API enrichment | 3 days | 0 | 1 (`enrichment_service.py`) | 0 |
| Display API video tracking | 3 days | 0 | 1 (`post_tracking_activity.py`) | 0 |
| `TikTokCreatorAuthWorkflow` | 3 days | 1 | 0 | 1 |
| **Tier 2 Total** | **~3.5 weeks** | **4** | **~3** | **1** |
| Marketing API client | 3 days | 1 (`tiktok_marketing_api.py`) | 0 | 0 |
| Spark Ads code extraction | 2 days | 0 | 1 (thread flags + prompts) | 0 |
| `SparkAdsWorkflow` | 1.5 weeks | 1 (`spark_ads_activity.py`) | 1 (`thread_processing_coordinator.py`) | 1 |
| Ads reporting workflow | 1 week | 0 | 1 (`update_sheet_activity.py`) | 1 |
| **Tier 3 Total** | **~3 weeks** | **2** | **~3** | **2** |
| `TikTokShopApiClient` + HMAC | 1 week | 1 | 0 | 0 |
| `tiktok_shop_order` table + webhook | 3 days | 2 (model, webhook route) | 1 (router) | 0 |
| `TikTokShopOrderWorkflow` | 1.5 weeks | 1 | 0 | 1 |
| **Tier 4 Total** | **~3 weeks** | **4** | **~1** | **1** |
| **GRAND TOTAL** | **~13.5 weeks** | **~16** | **~21** | **5** |

---

## 8. Build Order: Recommended Roadmap

### Sprint 1 (Week 1–2): Foundation + Creator Discovery

**Goal:** TikTok creators can be discovered and stored in Cheerful.

- [ ] Day 1–2: TikTok Pydantic models (`models/api/tiktok.py`: `TikTokProfile`, `TikTokActorResult`)
- [ ] Day 1–2: TikTok handle extraction in LLM prompts + `social_profile_utils.py`
- [ ] Day 1–2: Bio-link crawl branch for TikTok in `enrichment_service.py`
- [ ] Day 3–5: `services/external/tiktok_apify.py` — `TikTokApifyService` (keyword, hashtag, profile methods)
- [ ] Day 5–7: `save_creator_from_tiktok()` in `creator_service.py`
- [ ] Day 7–10: Platform dispatch in `campaign_discovery_activity.py` (TikTok keyword/hashtag branch)

**Deliverable:** Campaigns with `discovery_config.platform = "tiktok"` run weekly discovery via `CampaignDiscoverySchedulerWorkflow`.

---

### Sprint 2 (Week 3–4): Content Tracking

**Goal:** TikTok creators' videos are tracked in the 48h content tracking cycle.

- [ ] Day 1: `creator_post` Phase 1 migration (add `platform`, `platform_post_id`, `platform_metrics`)
- [ ] Day 2–3: `services/post_tracking/apify_tiktok_posts.py` — `TikTokPost` + `fetch_tiktok_posts()`
- [ ] Day 3–4: Update `CreatorPost` model + repository (`platform_post_id`, `exists_by_platform_post_id`)
- [ ] Day 4–5: `TrackableCreator` model: add `platform` field, rename `instagram_handle` → `platform_handle`
- [ ] Day 5–7: `post_tracking_activity.py` — platform dispatch (fetch + dedup + analyze)
- [ ] Day 7–8: `post_processor.py` — `create_tiktok_creator_post()` using `TikTokPost` fields
- [ ] Day 8–9: `analyzer.py` — platform-aware prompt (pass `platform` parameter)
- [ ] Day 9–10: Hashtag tracking activity + campaign `tiktok_config` field

**Deliverable:** TikTok creators participate in `PostTrackingWorkflow`. Campaign hashtags are monitored for UGC.

---

### Sprint 3 (Week 5–6): TikTok-Unique Tracking Features

**Goal:** Activate TikTok-specific content detection features; surface new metrics.

- [ ] Day 1–3: Sound/music campaign tracking activity
- [ ] Day 3–5: Duet/stitch attribution in `analyzer.py` (use `duet_from_id`, `stitch_from_id`, `hero_video_id`)
- [ ] Day 5–7: TikTok metrics in Google Sheets (share_rate, save_rate new columns)
- [ ] Day 7–8: `creator_post` Phase 2 migration (drop `instagram_post_id`) — coordinate with frontend
- [ ] Day 8–10: TikTok thread flag extraction (`has_tiktok_video_url`, `has_spark_ads_code`)

**Deliverable:** Full TikTok Tier 1 integration complete. New metrics in client reporting. Duets and custom sounds tracked automatically.

---

### Sprint 4 (Week 7–8): Apply for TikTok API Access (parallel track)

**Non-code work that should start week 1 and run in parallel:**

- [ ] Apply for TikTok Login Kit (developer platform) — 3–4 business day review
- [ ] Apply for TikTok Marketing API (business.tiktok.com) — 5–7 business day review
- [ ] Register for TikTok One (TCM beta) — contact TikTok rep

---

### Sprint 5 (Week 9–11): TikTok Login Kit OAuth (Tier 2)

**Goal:** Creators can connect TikTok accounts; Display API enrichment + video tracking unlocked.

- [ ] Day 1–3: `creator_social_auth` table + SQLAlchemy model
- [ ] Day 3–7: Login Kit OAuth endpoints (`/auth/tiktok`, `/auth/tiktok/callback`)
- [ ] Day 7–9: `TikTokApiClient` service (creator token refresh logic)
- [ ] Day 9–11: `TikTokCreatorAuthWorkflow` Temporal workflow
- [ ] Day 11–13: Display API enrichment branch in `enrichment_service.py`
- [ ] Day 13–15: Display API video tracking in `post_tracking_activity.py` (replaces Apify for connected creators)
- [ ] Day 15: Post-opt-in "Connect TikTok" email template addition

**Deliverable:** Connected creators use official Display API. Spark Ads eligibility enabled.

---

### Sprint 6 (Week 12–14): Spark Ads (Tier 3)

**Goal:** Organic creator posts can be boosted as Spark Ads through Cheerful.

- [ ] Day 1–3: `TikTokMarketingApiClient` (long-lived Business token auth)
- [ ] Day 3–5: Spark Ads code extraction activity
- [ ] Day 5–10: `SparkAdsWorkflow` (authorize → create → monitor)
- [ ] Day 10–15: `TikTokAdsReportingWorkflow` (paid metrics to Sheets)

**Deliverable:** Full Spark Ads automation. Clients can boost creator videos directly from Cheerful.

---

### Sprint 7 (Week 15+, optional): TikTok Shop Commerce (Tier 4)

*Only for clients with TikTok Shop seller accounts and US/UK/EU markets.*

- [ ] `TikTokShopApiClient` with HMAC signing
- [ ] `tiktok_shop_order` table + webhook endpoint
- [ ] `TikTokShopOrderWorkflow`
- [ ] Campaign-level shop seller configuration

---

## 9. Permanent Limitations for Cheerful

These capabilities are permanently unavailable regardless of integration depth:

| Limitation | Why | Impact on Cheerful |
|-----------|-----|-------------------|
| **TikTok DM outreach** | No public DM API; Business Messaging requires consumer-initiation | Email remains only outreach channel |
| **Arbitrary creator audience demographics** | Display API is user-context only; Research API is academic-only | Must use Phyllo (post-acceptance) or Modash/HypeAuditor (3rd party, estimated) |
| **Real-time follower change events** | No webhook for follower changes | 48h polling lag for follower count updates |
| **Historical time-series metrics** | APIs return snapshots only | Build by periodic polling + storing; no retroactive backfill |
| **TikTok Stories metrics** | Stories not in any API | No Stories tracking |
| **Creator DM inbox read** | Data Portability exports archive only | Cannot read creator DMs |
| **Live stream data** | No official live API; in-app only | No live tracking without TikTokLive WebSocket (unofficial) |
| **Research API for commercial use** | Explicitly prohibited | Cannot use Research API for discovery/enrichment in Cheerful |
| **Direct creator search via Display API** | Display API is user-context only (own account) | Must use Apify/third-party for arbitrary creator lookup |
| **Creator Fund / TTCM earnings** | Never exposed in any API | Cannot report on creator income |
| **Sound analytics** | No endpoint for sound performance metrics | Custom sound tracking limited to video count via Apify |

---

*Sources: All 22 analysis files in `analysis/` directory. See `analysis/synthesis/tiktok-integration-atlas.md` for the master TikTok API reference. See individual Wave 1/2/3 files for endpoint documentation, payload examples, and detailed Cheerful-specific integration notes.*
