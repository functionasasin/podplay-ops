# TikTok Ads Marketing API — Analysis

## Overview

The TikTok Marketing API (part of "TikTok API for Business") enables programmatic interaction with TikTok Ads Manager. It covers the full campaign lifecycle: creating campaigns, ad groups, and ads; managing creatives; targeting audiences; running reports; and — most relevant to Cheerful — **Spark Ads**, which let brands boost organic creator content as paid ads.

**Status**: Generally Available (GA), actively developed (Smart+ major update Oct 2025)
**Authentication**: OAuth 2.0 with long-lived access tokens + app credentials
**Base URL**: `https://business-api.tiktok.com/open_api/v1.3/`
**Sandbox**: `https://sandbox-ads.tiktok.com/open_api/v1.3/`
**Official Docs**: https://business-api.tiktok.com/portal/docs
**SDK (GitHub)**: https://github.com/tiktok/tiktok-business-api-sdk

---

## Authentication Architecture

The Marketing API uses a **separate auth system from the Developer Platform** (Login Kit / Display API). This is the "API for Business" system, not `open.tiktokapis.com`.

### Access Token Flow
1. Developer creates an app on the TikTok Business API portal
2. Advertiser authorizes the app (OAuth 2.0 authorization code flow)
3. App receives an **access token** (long-lived, does not expire on a fixed schedule)
4. Token becomes invalid only if advertiser revokes authorization
5. Invalid tokens **cannot be refreshed** — re-authorization required

### App-Level Auth (for own ad account)
Apps can also operate against their own ad account using a permanent access token from the portal (no per-user OAuth needed for single-account use).

---

## API Structure

The Marketing API is organized into these functional modules:

| Module | Purpose |
|--------|---------|
| Campaign Management | CRUD for campaigns, ad groups, ads |
| Creative Assets & Tools | Upload images/video, creative library |
| Audience Management | Custom audiences, Lookalike audiences |
| Account Management | Advertiser account info, budget |
| Data Insights & Reporting | Metrics, attribution, custom reports |
| Pixel & Events | Web pixel, offline events, conversions |
| Organic API | Spark Ads, mentions, discovery (see below) |

---

## Campaign Management Endpoints

### Campaign CRUD
```
POST /open_api/v1.3/campaign/create/
GET  /open_api/v1.3/campaign/get/                    # List/filter campaigns
POST /open_api/v1.3/campaign/update/                 # Modify campaign
POST /open_api/v1.3/campaign/status/update/          # Enable/pause/delete
```

**Campaign fields** (key):
- `campaign_name`, `objective_type` (REACH, TRAFFIC, VIDEO_VIEWS, LEAD_GENERATION, APP_PROMOTION, WEBSITE_CONVERSIONS, PRODUCT_SALES)
- `budget_mode` (BUDGET_MODE_TOTAL or BUDGET_MODE_DAY)
- `budget` (minimum varies by currency; ~$50/day USD)
- `campaign_type` (REGULAR_CAMPAIGN or TOPVIEW for reservation ads)
- Response includes `campaign_id` (integer)

### Ad Group CRUD
```
POST /open_api/v1.3/adgroup/create/
GET  /open_api/v1.3/adgroup/get/
POST /open_api/v1.3/adgroup/update/
POST /open_api/v1.3/adgroup/status/update/
```

**Key ad group fields** (targeting + delivery):
- `placement_type` (PLACEMENT_TYPE_AUTOMATIC or PLACEMENT_TYPE_NORMAL)
- `placement` (TIKTOK, PANGLE — TikTok's audience network)
- `location` (country/region codes)
- `age` (AGE_13_17, AGE_18_24, AGE_25_34, AGE_35_44, AGE_45_54, AGE_55_100)
- `gender` (GENDER_MALE, GENDER_FEMALE, GENDER_UNLIMITED)
- `language` (device language targeting)
- `interest_category_ids` (interest-based targeting)
- `spending_power`, `household_income` (US only)
- `audience_ids` (Custom Audience inclusion)
- `excluded_audience_ids` (Custom Audience exclusion)
- `budget_mode`, `budget`, `bid_type`, `bid_price`
- `optimize_goal` (CLICK, REACH, SHOW, CONVERSION, etc.)
- `schedule_start_time`, `schedule_end_time`

### Ad CRUD
```
POST /open_api/v1.3/ad/create/
GET  /open_api/v1.3/ad/get/
POST /open_api/v1.3/ad/update/
POST /open_api/v1.3/ad/status/update/
```

**Key ad fields**:
- `adgroup_id`, `ad_name`, `ad_format`
- `image_ids` (uploaded via creative API), `video_id`
- `ad_text` (caption), `call_to_action`
- `landing_page_url`, `display_name`
- For Spark Ads: `tiktok_item_id` (the video being boosted) + `identity_id`

---

## Spark Ads — Creator Content Amplification

**This is the highest-value Marketing API feature for Cheerful's influencer workflows.**

### What Spark Ads Does
Spark Ads lets brands run paid promotion using an organic TikTok post (their own or a creator's), with all engagement (likes, comments, shares, follows) attributed back to the original organic post rather than a separate ad.

Performance vs standard In-Feed Ads:
- **142% higher engagement rate**
- **43% higher conversion rate**
- **4.2% lower CPM**
- **30% higher video completion rate**

### Authorization Code Flow
Spark Ads require the creator to authorize a specific post for ad use:

1. **Creator** opens post → three dots → **Ad Settings** → toggle on **Ad Authorization**
2. Creator selects duration: **7, 30, 60, or 365 days**
3. TikTok generates an authorization code (e.g., `#s63DdePaj9HjSv2BPcSrDfTxU2X506b2oiwchQ9PIspTLgroZKtjN7PPiFnF+qA=`)
4. Creator shares code with brand (manually or via platform)
5. **Brand/advertiser** enters code via Ads Manager or Marketing API

Batch authorization: up to **20 codes** at once.

### API Endpoint for Spark Authorization
The advertiser submits the authorization code via the Marketing API:
```
POST /open_api/v1.3/tt_video/authorize/
```
This returns a `tiktok_item_id` that can then be used in `ad/create/`.

### Spark Ads Recommendation API (Organic API)
Part of the "Organic API" sub-product within API for Business:
```
GET /open_api/v1.3/spark/ad/get/
```
Identifies high-performing organic posts from the brand's own account that are candidates for boosting. Does NOT cover third-party creator content identification — that must come from the creator or via TCM/TikTok One.

### Key Constraints on Spark Ads
- Cannot edit caption after authorization
- Private videos become public when used as Spark Ad (irreversible during campaign)
- Maximum **10,000 Spark Ads** per TikTok Ads Manager account
- Cannot deactivate ad authorization while campaign is running
- Authorization has an expiry (7–365 days); once expired, campaign stops serving

---

## Audience Management

### Custom Audiences
```
POST /open_api/v1.3/dmp/custom_audience/create/
GET  /open_api/v1.3/dmp/custom_audience/get/
POST /open_api/v1.3/dmp/custom_audience/update/      # Add/remove/replace members
POST /open_api/v1.3/dmp/custom_audience/delete/
```

**Custom Audience types**:
- **File Upload** — hashed email/phone/device IDs
- **Website Pixel** — retargeting users who visited specific pages
- **App Activity** — users who took specific in-app actions
- **TikTok Engagement** — users who watched/liked/commented on specific videos
- **Customer File** — CRM upload

Minimum: **1,000 matched users** to activate in a campaign.

The API supports **automated audience syncing** — continuous refresh from CRM or other systems.

### Lookalike Audiences
```
POST /open_api/v1.3/dmp/lookalike/create/
```
Creates lookalike from any Custom Audience. Three sizes: Narrow, Balanced, Broad.

### Targeting Dimensions (Ad Group Level)
| Dimension | Options |
|-----------|---------|
| Location | Country, region, city (varies by market) |
| Age | 13–17, 18–24, 25–34, 35–44, 45–54, 55+ |
| Gender | Male, Female, All |
| Language | Device language |
| Interests | Hierarchical interest taxonomy (~hundreds of categories) |
| Behaviors | Purchase intent, content interaction patterns |
| Spending Power | TikTok-inferred (US only) |
| Household Income | US only |
| Device | OS, model, carrier, connection type |
| Smart Audience | AI-expanded targeting |

---

## Reporting

### Integrated Reporting Endpoint
```
POST /open_api/v1.3/report/integrated/get/
```
Single endpoint for all reporting — auction and reservation ads.

**Report Levels**: CAMPAIGN, ADGROUP, AD

**Key Metrics Available**:
| Metric | Description |
|--------|-------------|
| `impressions` | Ad impressions |
| `clicks` | Click count |
| `ctr` | Click-through rate |
| `cpm` | Cost per mille |
| `cpc` | Cost per click |
| `spend` | Total spend |
| `reach` | Unique users reached |
| `frequency` | Avg impressions per user |
| `video_play_actions` | Video starts |
| `video_watched_2s` | 2-second views |
| `video_watched_6s` | 6-second views |
| `video_view_p25/p50/p75/p100` | Quartile completion rates |
| `average_video_play` | Avg seconds watched |
| `profile_visits` | Profile clicks from ad |
| `follows` | New follows from ad |
| `likes` | Likes on ad |
| `comments` | Comments on ad |
| `shares` | Shares of ad |
| `conversions` | Tracked conversion events |
| `cost_per_conversion` | CPA |
| `conversion_rate` | % users who converted |
| `value_per_conversion` | ROAS-related |

**Dimensions**: Date, Campaign, Ad Group, Ad, Placement, Country, Gender, Age, OS, etc.

**Custom Reports**: Fully configurable via API — combine any metrics × dimensions.

### Attribution
- Default: **7-day click + 1-day view** attribution window
- Configurable: 1/7/14/28 days for click; 1/7 days for view
- Oct 2025 update: 79% of conversions missed by last-click models — expanded attribution tracking now available
- Google Analytics (GA4) and MMP integrations available
- Assisted conversion reporting introduced Oct 2025

---

## Smart+ Campaigns (AI-Automated)

Smart+ is TikTok's AI-driven campaign type (updated significantly Oct 2025). Major update made it modular: advertisers choose automation level per module (targeting, budget, creative, placement) from full-auto to fully manual.

### Smart+ Sub-types
| Sub-type | Use Case |
|----------|---------|
| Smart+ Web Campaigns | Drive website conversions |
| Smart+ App Campaigns | Drive app installs/events |
| Smart+ Lead Gen | Collect leads in-platform |
| Smart+ Catalog Ads | Dynamic product ads from catalog feed |
| Smart+ Live | Amplify live stream content |

**Catalog Ads**: Connect product catalog → TikTok dynamically generates ad creative per viewer. Beta showed **36% lower CPA** vs manual campaigns.

### Symphony Automation (Generative AI)
Available within Smart+ as "Recommended Creatives" and "Automatic Enhancements":
- Generates video assets from existing creative
- Resizes, re-dubs, translates videos
- Refreshes music on existing videos
- Auto-selects from creator content pool (TikTok One)

**Auto-Select**: Scans brand's authorized creator content, recommends best performers. TikTok manages creator payment — no direct brand-creator negotiation needed for this pool.

### Campaign Budget Optimization (CBO)
Automatically reallocates budget across ad groups toward best performers. Available via API through `budget_optimize_on` flag at campaign level.

---

## Creative Management API

### Image/Video Upload
```
POST /open_api/v1.3/file/image/ad/upload/    # Single image
POST /open_api/v1.3/file/video/ad/upload/    # Video
POST /open_api/v1.3/file/video/ad/search/    # Search creative library
```

**Video specs**: H.264 MP4/MOV, 720p+ recommended, 5–60 seconds for standard In-Feed Ads, up to 60s for Spark Ads.

### Ad Formats Available via API
| Format | API Support |
|--------|------------|
| In-Feed Video | Full CRUD |
| Spark Ads | Full (via authorization code) |
| TopView | Reservation (manual booking required) |
| Brand Takeover | Reservation (manual booking required) |
| Branded Hashtag Challenge | Reservation (manual booking required) |
| Collection Ads | Full CRUD |
| Dynamic Showcase Ads | Via catalog |
| LIVE Shopping Ads | Full |

---

## Pixel & Offline Events

### TikTok Pixel
```
POST /open_api/v1.3/pixel/create/
POST /open_api/v1.3/pixel/update/
GET  /open_api/v1.3/pixel/list/
POST /open_api/v1.3/pixel/event/create/     # Define custom events
```

Server-side Events API (`/events/`) available for cookieless tracking.

### Offline Conversions
```
POST /open_api/v1.3/offline/event/upload/
```
Matches offline purchase data to ad exposures for full-funnel attribution.

---

## Rate Limits

The Marketing API uses a different rate limiting system from the Developer Platform APIs:

| Level | Limit |
|-------|-------|
| Standard API calls | ~1,000 req/min (per access token) |
| Report generation | ~100 reports/min |
| Bulk operations | Separate quotas per endpoint |
| File upload | ~50 uploads/min |

Rate limit errors return **HTTP 429** with error code `rate_limit_exceeded`. For higher limits, contact TikTok support.

Note: Access tokens have **no standard expiry** (unlike Developer Platform's 24h tokens) but can be invalidated by advertiser revocation.

---

## Access Requirements & App Review

### Application Process
1. Sign up at `business-api.tiktok.com/portal`
2. Register app → fill out: app name, category, icon, description of use case
3. Request specific API scopes
4. Submit for review → wait **5–7 business days**
5. May receive feedback requiring changes → resubmit
6. Once approved: receive `app_id` and `app_secret`

### Required Scopes for Cheerful Use Cases
| Use Case | Scopes Required |
|----------|----------------|
| Read campaign/ad data | `Ads Management` (read) |
| Create/manage campaigns | `Ads Management` (read+write) |
| Access reporting | `Reporting` |
| Upload creatives | `Creative Management` |
| Custom audiences | `Audience Management` |
| Pixel management | `Pixel Management` |
| All of the above | All four scopes |

### Business Verification
- Must be a **registered business** (not individual)
- Must operate in an **approved country** (most major markets)
- App must comply with TikTok advertising policies
- Privacy compliance: GDPR, CCPA required
- For Spark Ads at scale: advertiser must have a TikTok Ads Manager account

### Pricing
- **Marketing API access is free** — no API subscription fee
- Costs are purely **ad spend** (the actual campaigns created via API)
- TikTok charges standard CPM/CPC/CPV for ads served
- No premium tier for API access vs Ads Manager UI

---

## Regional Availability

- Marketing API is globally available wherever TikTok Ads Manager is available
- Some features are US-only: Household Income targeting, Spending Power targeting, certain placement types
- Some features are regionally staged: Smart+ availability expanded globally through 2024–2025
- EU/EEA: Special compliance requirements (DSA, elections policy). Advertisers targeting EU users must confirm politics/elections compliance; non-compliance after Jan 10, 2026 blocks API campaign management for EU targeting

---

## Commercial Content API (Research Variant)

Separate from Marketing API. Available at `developers.tiktok.com/products/commercial-content-api`:
```
POST /v2/research/adlib/ad/detail/    # Get specific ad details
POST /v2/research/adlib/ad/query/     # Search public ad library
POST /v2/research/adlib/ad/report/    # Ad publishing reports
```

**Purpose**: Transparency / research access to TikTok's public Ad Library (all active ads visible to users). Does NOT require advertiser account — uses client credentials auth.

**Use for Cheerful**: Could be used to research competitor ad strategies or identify which creator content is being boosted by brands — useful for competitive intelligence.

---

## Spark Ads Workflow for Influencer Marketing Platforms

The end-to-end flow for platforms like Cheerful to enable Spark Ads for clients:

```
1. Creator posts organic TikTok content
2. Brand approves content within Cheerful campaign workflow
3. Creator generates authorization code (7–365 day window)
   → Creator does this in TikTok app (Ad Settings → Generate Code)
   → OR via API if creator has granted access (requires special partnership)
4. Creator shares code with brand via Cheerful platform
5. Cheerful calls Marketing API:
   POST /open_api/v1.3/tt_video/authorize/ { auth_code: "..." }
   → Returns tiktok_item_id
6. Cheerful creates Spark Ad campaign/adgroup/ad via Marketing API
7. Campaign runs; engagement attributed to creator's organic post
8. Cheerful pulls reports via /report/integrated/get/ for campaign dashboard
```

**Integration Complexity**: Medium-High
- Requires: Marketing API access approval (advertiser-level OAuth), client TikTok Ads Manager account
- Manual step: Creator must generate auth code in-app (no API to generate on creator's behalf)
- Opportunity: Automate steps 5–8; step 3–4 managed by Cheerful's creator communication workflow

---

## Key Observations for Cheerful

### High Value
1. **Spark Ads API** — Direct value-add to influencer campaign workflow. Allows Cheerful to programmatically launch paid amplification of creator posts as part of campaign management. Differentiator vs manual Ads Manager workflow.

2. **Reporting API** — Pull campaign performance metrics into Cheerful dashboard. Unify organic post metrics (Display API) + paid metrics (Marketing API) for full-funnel view.

3. **Custom Audience API** — Automatically sync creator-engaged audiences from campaigns for remarketing; enables "seed audience" workflows.

### Medium Value
4. **Campaign Management API** — Full programmatic campaign creation could make Cheerful a one-stop shop: negotiate with creator → approve content → launch Spark Ad, all in-platform.

5. **Commercial Content API** — Ad library research; identify which brands are boosting which creator content.

### Lower Value (for Cheerful's core use case)
6. **Smart+/Symphony Automation** — Primarily for performance marketing teams, not influencer-specific. Useful if Cheerful adds a paid media management layer.

7. **Custom Audiences from creator engagement** — Valuable for brand clients wanting to retarget, but adds complexity.

### Critical Dependency
- **Cheerful's clients (brands) need their own TikTok Ads Manager accounts** — Cheerful would act as a "Business Manager" authorized to manage campaigns on the brand's behalf. This is standard for marketing platforms; TikTok supports this via the Business Manager API.
- The **authorization code step is a manual creator action** — Cheerful must build a workflow to collect codes from creators (e.g., a dedicated UI step in the campaign approval flow).

---

## Summary Capability Matrix

| Capability | Available via API | Notes |
|-----------|-------------------|-------|
| Campaign CRUD | ✅ Full | All campaign types |
| Ad group targeting | ✅ Full | All targeting dimensions |
| Ad CRUD | ✅ Full | All formats |
| Spark Ads (boost creator content) | ✅ Full | Requires creator auth code |
| Performance reporting | ✅ Full | Highly configurable |
| Custom audience creation | ✅ Full | Auto-sync supported |
| Lookalike audiences | ✅ Full | |
| Pixel management | ✅ Full | Server-side events too |
| Creative upload | ✅ Full | Images and video |
| Smart+/AI automation | ✅ Full | Full API parity with UI |
| Creator discovery via ads | ❌ None | Use TCM or Apify |
| TopView/Takeover booking | ❌ API limited | Requires manual reservation |
| Spark Ads code generation | ❌ None | Creator must do in-app |
| Branded Hashtag Challenge | ❌ API limited | Requires manual setup |
