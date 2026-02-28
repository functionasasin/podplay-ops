# Frontier — TikTok Integration Atlas

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 23 |
| Analyzed | 19 |
| Pending | 4 |
| Convergence | 83% |

---

## Wave 1: Official TikTok APIs

- [x] `tiktok-login-kit` — OAuth 2.0 for TikTok: auth flow, scopes, token management, prerequisite for other APIs
- [x] `tiktok-display-api` — Creator profiles, video metadata, metrics: core data access for discovery and tracking
- [x] `tiktok-content-posting-api` — Video/photo upload, direct post, inbox upload, scheduling
- [x] `tiktok-research-api` — Academic/commercial research: video search, user search, comments, historical data
- [x] `tiktok-shop-api` — Commerce: product catalogs, orders, affiliates, seller tools, regional availability
- [x] `tiktok-ads-marketing-api` — Campaign management, Spark Ads (boosting creator content), audience targeting, reporting
- [x] `tiktok-creator-marketplace-api` — TCM: creator discovery, campaign briefs, collaboration management
- [x] `tiktok-messaging-comments-api` — Comment read/write, DM access, moderation, webhook events
- [x] `tiktok-live-api` — Live streams, viewer metrics, gifts, live commerce
- [x] `tiktok-webhooks-events` — Consolidated webhook/event reference across all API products
- [x] `tiktok-embed-oembed` — Embed player, oEmbed endpoint, zero-auth data extraction

## Wave 2: Third-Party & Unofficial Methods

- [x] `third-party-apify-tiktok` — Apify TikTok actors: scraper catalog, capabilities, pricing (existing Cheerful pattern)
- [x] `third-party-phantombuster-tiktok` — PhantomBuster TikTok phantoms: capabilities, pricing
- [x] `third-party-platform-connectors` — Composio, Zapier, Make, n8n TikTok triggers/actions
- [x] `third-party-data-providers` — Pentos, Socialinsider, HypeAuditor, Modash: TikTok data APIs, pricing
- [x] `third-party-social-management` — Hootsuite, Sprout Social, Later, Buffer: TikTok API exposure
- [x] `unofficial-scraping-methods` — TikTok-Api Python, Puppeteer, anti-bot measures, legal risks

## Wave 3: Cheerful Architecture Analysis

- [x] `cheerful-creator-discovery-pipeline` — Current discovery flow (Apify/YouTube), where TikTok slots in
- [x] `cheerful-content-tracking-model` — Current post tracking, what TikTok video tracking requires
- [ ] `cheerful-campaign-workflow-touchpoints` — Campaign lifecycle × TikTok integration opportunities
- [ ] `cheerful-data-model-extensions` — New tables/columns/relationships needed for TikTok

## Wave 4: Synthesis

- [ ] `synthesis-tiktok-atlas` — Master integration atlas: capability matrices, auth map, rate limits, access requirements
- [ ] `synthesis-cheerful-applicability` — Per-workflow applicability matrix, effort estimates, dependencies, quick wins vs deep integrations
