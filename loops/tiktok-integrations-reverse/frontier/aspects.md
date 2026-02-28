# Frontier — TikTok Integration Atlas

## Statistics

| Metric | Value |
|--------|-------|
| Total aspects | 23 |
| Analyzed | 0 |
| Pending | 23 |
| Convergence | 0% |

---

## Wave 1: Official TikTok APIs

- [ ] `tiktok-login-kit` — OAuth 2.0 for TikTok: auth flow, scopes, token management, prerequisite for other APIs
- [ ] `tiktok-display-api` — Creator profiles, video metadata, metrics: core data access for discovery and tracking
- [ ] `tiktok-content-posting-api` — Video/photo upload, direct post, inbox upload, scheduling
- [ ] `tiktok-research-api` — Academic/commercial research: video search, user search, comments, historical data
- [ ] `tiktok-shop-api` — Commerce: product catalogs, orders, affiliates, seller tools, regional availability
- [ ] `tiktok-ads-marketing-api` — Campaign management, Spark Ads (boosting creator content), audience targeting, reporting
- [ ] `tiktok-creator-marketplace-api` — TCM: creator discovery, campaign briefs, collaboration management
- [ ] `tiktok-messaging-comments-api` — Comment read/write, DM access, moderation, webhook events
- [ ] `tiktok-live-api` — Live streams, viewer metrics, gifts, live commerce
- [ ] `tiktok-webhooks-events` — Consolidated webhook/event reference across all API products
- [ ] `tiktok-embed-oembed` — Embed player, oEmbed endpoint, zero-auth data extraction

## Wave 2: Third-Party & Unofficial Methods

- [ ] `third-party-apify-tiktok` — Apify TikTok actors: scraper catalog, capabilities, pricing (existing Cheerful pattern)
- [ ] `third-party-phantombuster-tiktok` — PhantomBuster TikTok phantoms: capabilities, pricing
- [ ] `third-party-platform-connectors` — Composio, Zapier, Make, n8n TikTok triggers/actions
- [ ] `third-party-data-providers` — Pentos, Socialinsider, HypeAuditor, Modash: TikTok data APIs, pricing
- [ ] `third-party-social-management` — Hootsuite, Sprout Social, Later, Buffer: TikTok API exposure
- [ ] `unofficial-scraping-methods` — TikTok-Api Python, Puppeteer, anti-bot measures, legal risks

## Wave 3: Cheerful Architecture Analysis

- [ ] `cheerful-creator-discovery-pipeline` — Current discovery flow (Apify/YouTube), where TikTok slots in
- [ ] `cheerful-content-tracking-model` — Current post tracking, what TikTok video tracking requires
- [ ] `cheerful-campaign-workflow-touchpoints` — Campaign lifecycle × TikTok integration opportunities
- [ ] `cheerful-data-model-extensions` — New tables/columns/relationships needed for TikTok

## Wave 4: Synthesis

- [ ] `synthesis-tiktok-atlas` — Master integration atlas: capability matrices, auth map, rate limits, access requirements
- [ ] `synthesis-cheerful-applicability` — Per-workflow applicability matrix, effort estimates, dependencies, quick wins vs deep integrations
