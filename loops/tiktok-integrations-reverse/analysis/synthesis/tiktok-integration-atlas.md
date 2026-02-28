# TikTok Integration Atlas — Master Reference

> Synthesized from 21 analysis files covering 11 Official TikTok APIs, 6 third-party/unofficial method categories, and 4 Cheerful architecture deep-dives.
> Last updated: 2026-02-28

---

## Table of Contents

1. [Official APIs — Capability Matrix](#1-official-apis--capability-matrix)
2. [Third-Party Services — Capability Matrix](#2-third-party-services--capability-matrix)
3. [Unofficial Methods — Risk-Rated Summary](#3-unofficial-methods--risk-rated-summary)
4. [Consolidated Auth & Permission Map](#4-consolidated-auth--permission-map)
5. [Consolidated Rate Limits Reference](#5-consolidated-rate-limits-reference)
6. [Access Requirements & Regional Restrictions](#6-access-requirements--regional-restrictions)
7. [Data Availability Matrix](#7-data-availability-matrix)
8. [Permanent Gaps — Data That Cannot Be Accessed](#8-permanent-gaps--data-that-cannot-be-accessed)
9. [Integration Surface Summary](#9-integration-surface-summary)

---

## 1. Official APIs — Capability Matrix

### 1A. API Products Overview

| API Product | Base URL | Auth Type | Status | Cost | Key Purpose |
|-------------|----------|-----------|--------|------|-------------|
| **Login Kit** | `open.tiktokapis.com/v2` | OAuth 2.0 | GA | Free | User identity + token foundation |
| **Display API** | `open.tiktokapis.com/v2` | User OAuth | GA | Free | Authorized user's profile + videos |
| **Content Posting API** | `open.tiktokapis.com/v2` | User OAuth | GA | Free | Upload/publish video + photo |
| **Research API** | `open.tiktokapis.com/v2/research` | Client Credentials | GA | Free | Academic search of public content |
| **Shop Open API** | `open-api.tiktokglobalshop.com` | OAuth + HMAC | GA | Free | Commerce: products, orders, affiliates |
| **Marketing API** | `business-api.tiktok.com/open_api/v1.3` | Long-lived OAuth | GA | Free (ad spend cost) | Campaign management, Spark Ads |
| **Creator Marketplace / TikTok One** | `business-api.tiktok.com` | Business OAuth | Open Beta | Free | Creator discovery, orders, campaigns |
| **Business Messaging API** | `business-api.tiktok.com` | Business OAuth | GA (limited) | Free | B2C messaging (consumer-initiated) |
| **Webhooks (Developer Platform)** | `open.tiktokapis.com` | HMAC-SHA256 verify | GA | Free | 4 event types (auth, video, portability) |
| **TikTok Shop Webhooks** | Partner Center | HMAC verify | GA | Free | Commerce events (orders, products) |
| **oEmbed / Embed Player** | `tiktok.com/oembed` | None | GA | Free | Zero-auth video metadata + embed HTML |

---

### 1B. Data Access by API Product

| Data Type | Login Kit | Display API | Research API | Shop API | Marketing API | TCM/TTO | oEmbed |
|-----------|-----------|-------------|--------------|----------|---------------|---------|--------|
| **Creator username** | ✅ (own) | ✅ (own) | ✅ (any public) | — | — | ✅ | ✅ (extracted) |
| **Creator display name** | ✅ | ✅ | ✅ | — | — | ✅ | — |
| **Bio description** | — | ✅ (`user.info.profile`) | ✅ | — | — | ✅ | — |
| **Bio link (website)** | — | — | ✅ (`bio_url`) | — | — | — | — |
| **Avatar / profile photo** | ✅ | ✅ | ✅ | — | — | ✅ | ✅ (thumbnail) |
| **Is verified** | — | ✅ | ✅ | — | — | ✅ | — |
| **Follower count** | — | ✅ (`user.info.stats`) | ✅ | — | — | ✅ | — |
| **Following count** | — | ✅ | ✅ | — | — | — | — |
| **Total likes (public) count** | — | ✅ | ✅ | — | — | — | — |
| **Video count** | — | ✅ | ✅ | — | — | — | — |
| **Audience demographics** | — | ❌ | ❌ | — | — | ✅ (TCM orders) | — |
| **Video completion rate** | — | ❌ | ❌ | — | — | ✅ (TCM orders) | — |
| **Collaboration history** | — | — | — | — | — | ✅ (partial) | — |
| **Creator GMV (Shop)** | — | — | — | ✅ (Affiliate Seller) | — | — | — |
| **Affiliate niche** | — | — | — | ✅ | — | — | — |
| **Video metadata (title, caption)** | — | ✅ | ✅ | — | — | — | ✅ |
| **Video view count** | — | ✅ | ✅ | — | — | — | — |
| **Video like count** | — | ✅ | ✅ | — | — | — | — |
| **Video comment count** | — | ✅ | ✅ | — | — | — | — |
| **Video share count** | — | ✅ | ✅ | — | — | — | — |
| **Video save/favorites count** | — | ✅ | ✅ | — | — | — | — |
| **Video hashtags** | — | — | ✅ | — | — | — | — |
| **Video music/sound ID** | — | — | ✅ | — | — | — | — |
| **Video transcript (voice-to-text)** | — | ❌ | ✅ (~20% coverage) | — | — | — | — |
| **Video embed HTML** | — | — | — | — | — | — | ✅ |
| **Comments on any video** | — | — | ✅ (academic) | — | — | — | — |
| **Follower list** | — | — | ✅ (academic) | — | — | — | — |
| **Ad campaign metrics** | — | — | — | — | ✅ | — | — |
| **Spark Ads performance** | — | — | — | — | ✅ | — | — |
| **Shop order data** | — | — | — | ✅ | — | — | — |
| **Affiliate link tracking** | — | — | — | ✅ | — | — | — |

---

### 1C. Operations by API Product

| Operation | Login Kit | Display API | Content Posting | Research API | Shop API | Marketing API | TCM/TTO |
|-----------|-----------|-------------|-----------------|--------------|----------|---------------|---------|
| **Read own profile** | ✅ | ✅ | — | — | — | — | — |
| **Read any public profile** | — | ❌ | — | ✅ | — | — | — |
| **Search creators by keyword** | — | ❌ | — | ✅ | ✅ (by niche/GMV) | — | ✅ |
| **Search creators by hashtag** | — | ❌ | — | ✅ | — | — | — |
| **Search creators by region** | — | ❌ | — | ✅ | ✅ | — | ✅ |
| **Search videos by hashtag/keyword** | — | ❌ | — | ✅ | — | — | — |
| **List own videos** | — | ✅ | — | — | — | — | — |
| **Query specific video metrics** | — | ✅ (own) | — | ✅ (any public) | — | ✅ (Spark) | — |
| **Read comments** | — | ❌ | — | ✅ (academic) | — | ✅ (ad content) | — |
| **Write comment** | — | ❌ | — | ❌ | — | ✅ (ad content) | — |
| **Post video (direct)** | — | — | ✅ (`video.publish`) | — | — | — | — |
| **Post video (draft/inbox)** | — | — | ✅ (`video.upload`) | — | — | — | — |
| **Post photo/carousel** | — | — | ✅ | — | — | — | — |
| **Create ad campaign** | — | — | — | — | — | ✅ | — |
| **Create Spark Ad** | — | — | — | — | — | ✅ | — |
| **Send DM to creator** | — | ❌ | — | ❌ | — | — | ❌ |
| **Create affiliate campaign** | — | — | — | — | ✅ | — | — |
| **Invite creator to campaign** | — | — | — | — | ✅ | ✅ | — |
| **Track affiliate orders** | — | — | — | — | ✅ | — | — |
| **Manage product catalog** | — | — | — | — | ✅ | — | — |
| **Get live stream status** | — | ❌ | — | — | — | — | ❌ |
| **Receive webhooks** | ✅ (revoke) | ✅ (post events) | ✅ (upload/publish) | — | ✅ (commerce) | ✅ (leads/review) | ✅ (orders) |

---

### 1D. Key Constraints Per Official API

**Login Kit**
- `client_key` (not `client_id`) — TikTok non-standard parameter name
- 2024 breaking change: `user.info.basic` scope no longer includes profile/stats fields
- Max 10 redirect URIs per app
- App must be live in production app store for mobile platforms
- `union_id` enables cross-app deduplication (must explicitly request in `fields` param)

**Display API**
- Cannot look up arbitrary creators — user-context ONLY
- `cover_image_url` expires — must refresh via `/v2/video/query/`
- Max 20 videos per `/v2/video/list/` request (timestamp-cursor pagination)
- No audience demographics whatsoever
- No time-series metrics — snapshot only at time of call

**Content Posting API**
- Unaudited apps: max 5 users/day, all posts as `SELF_ONLY` (private)
- No native scheduling (must implement custom Temporal scheduler)
- Photo posts only support `PULL_FROM_URL` (no file upload)
- UX requirements mandatory: content preview + music usage declaration
- Cannot add promotional watermarks to creator content
- Max ~15 posts per creator account per day

**Research API**
- **Commercial use explicitly prohibited** — Cheerful cannot use directly
- Canada excluded from researcher eligibility even though content is global
- VCE (Virtual Compute Environment) for non-academic orgs: TikTok manually reviews ALL outputs
- Data freshness lag up to 10 days; pre-July 2024 metrics had systematic underreporting bug
- 30-day max window per query; longer ranges require sequential pagination

**Shop API**
- Mandatory HmacSHA256 request signing (non-negotiable, every request)
- 17 countries only (major gap: Canada not supported; limited LatAm support)
- Affiliate Seller API: only official path to creator GMV data anywhere in the ecosystem
- Probation mode on new seller accounts: 100 products/day limit
- Three seller types have different API capabilities (Seller vs Creator vs Affiliate)

**Marketing API**
- Separate auth system from developer platform — different portal, different token flow
- Long-lived tokens (no expiry unless revoked) — simplifies token management
- Spark Ads creator code: 7–365 day window, up to 20 codes at once per creator
- Smart+ (Oct 2025): AI-automated campaigns, reduces manual creative overhead
- US-only: household income + spending power targeting

**Creator Marketplace / TikTok One (TCM/TTO)**
- Pool size: ~2M creators in US (10K+ follower minimum)
- TTO API still in global beta — requires TikTok rep contact for access
- Order-based workflow: keyword detection in brief is prohibited by policy
- Unique data: completion rate, audience retention graph — not available anywhere else
- Spark Ads authorization included with order acceptance (seamless organic-to-paid flow)
- Rate limit: 20 req/min (slowest official API)

**Business Messaging API**
- Consumer must initiate conversation first — no cold outreach possible
- 48-hour response window per conversation
- Geographically restricted: non-US, non-EEA, non-CH, non-UK only
- Max 10 messages per 48h window
- No video, voice, or sticker message support — text only

**Webhooks (Developer Platform)**
- Only 4 event types: `authorization.removed`, `video.upload.failed`, `video.publish.completed`, `portability.download.ready`
- No webhooks for: new posts, comment activity, follower changes, metrics updates, live events
- HMAC-SHA256 verification: key=`client_secret`, payload=`{timestamp}.{body}`, header=`TikTok-Signature: t={ts},s={sig}`
- At-least-once delivery with 72h exponential backoff retry
- No selective event subscription — all-or-nothing

---

## 2. Third-Party Services — Capability Matrix

### 2A. Services Overview

| Service | Category | Monthly Cost | TikTok Data Access Method | Best For |
|---------|----------|--------------|--------------------------|----------|
| **Apify** (clockworks actors) | Scraping infrastructure | $0.005/item PPR | Public web scraping | Creator discovery, enrichment, post tracking |
| **Modash** | Data platform | $199–599/mo platform; $16,200/yr Discovery API; $10,000/yr Raw API | Proprietary database | Creator search + email unlock + collab history |
| **HypeAuditor** | Analytics + fraud detection | Custom pricing | Proprietary database | Authenticity/fraud scoring |
| **Phyllo** | Creator-permissioned data | ~$199/mo | Official TikTok OAuth on behalf of creator | Audience demographics (gender/age/location) |
| **Pentos** | TikTok analytics dashboard | $99–$299/mo | Proprietary | Dashboard tracking (no API) |
| **EchoTik** | TikTok Shop analytics | $9.9–$57/mo platform; custom API | Proprietary | Creator GMV + Shop product analytics |
| **Socialinsider** | Social analytics | $333/mo+ | Creator-connected account | Historical benchmarking (requires auth) |
| **Data365** | Data API | Custom | Public web scraping | Apify alternative for raw data |
| **ScrapeCreators** | Managed scraping API | Pay-per-credit (26 credits for demographics) | Managed unofficial scraping | Audience demographics without creator auth |
| **EnsembleData** | Multi-platform data | $100+/mo | Managed unofficial scraping | Video transcripts (unique capability) |
| **Composio** | iPaaS / tool abstraction | Free–$99/mo | Official TikTok API via OAuth | Connected-creator workflows (Cheerful already integrated) |
| **Metricool** | Social management | $53/mo (Advanced) | Official TikTok API | View source breakdown, daily follower delta |
| **Sprout Social** | Social management | $399/seat | Official TikTok API | Unlimited historical data retention |
| **Euler Stream** | Live event infrastructure | Free tier available | TikTokLive WebSocket wrapper | Commercial live stream monitoring |

---

### 2B. Capability Matrix by Data Type

| Data Type | Apify | Modash | HypeAuditor | Phyllo | EchoTik | ScrapeCreators | Composio |
|-----------|-------|--------|-------------|--------|---------|----------------|---------|
| Creator profile (handle, bio, avatar) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follower count | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Following / likes / video count | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Is verified | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Audience demographics (gender/age/geo) | ❌ | ✅ | ✅ | ✅ (official) | ❌ | ✅ (26 cr.) | ❌ |
| Fake follower / authenticity score | ❌ | ❌ | ✅ (unique) | ❌ | ❌ | ❌ | ❌ |
| Email address | ❌ | ✅ (unlock) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Past brand collaborations | ❌ | ✅ | ✅ | — | ❌ | ❌ | ❌ |
| Creator GMV (TikTok Shop) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Video metrics (views, likes, etc.) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Video completion rate | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Video transcript | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hashtag analytics | ✅ | ✅ | ✅ | — | ✅ | — | — |
| Trending sounds/music | ✅ | — | — | — | ✅ | — | — |
| Live event data | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Post video to TikTok | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Creator discovery search | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (connected only) |

---

### 2C. Cost / Reliability / Risk Assessment

| Service | Monthly Cost (Est.) | Reliability | TOS Risk | Best Use Case for Cheerful |
|---------|---------------------|-------------|----------|---------------------------|
| **Apify** (clockworks) | $50–500 (PPR) | ★★★★ High | Medium | Primary discovery + enrichment |
| **Modash** Discovery API | $1,350/mo (annual) | ★★★★★ Very High | None | Email unlock + collab history |
| **HypeAuditor** | Custom | ★★★★ High | None | Fraud scoring for brand safety |
| **Phyllo** | ~$199/mo+ | ★★★★ High | None (official) | Post-acceptance demographics |
| **Pentos** | $99–299/mo | ★★★★ High | None | Competitor dashboards only |
| **EchoTik** | $9.9–57/mo | ★★★ Medium | None | Shop GMV scouting |
| **ScrapeCreators** | PPR (26 credits/demo) | ★★★ Medium | Medium | Demographics without creator auth |
| **EnsembleData** | $100+/mo | ★★★ Medium | Medium | Transcript-based discovery |
| **Composio** | Free–$99/mo | ★★★★ High | None | Content posting for connected creators |
| **Metricool** | $53/mo | ★★★★ High | None | View source breakdown metric |

---

## 3. Unofficial Methods — Risk-Rated Summary

### 3A. Method Overview

| Method | Library / Tool | What It Provides | Reliability | TOS Risk | Legal Risk |
|--------|----------------|------------------|-------------|----------|------------|
| **TikTokApi (davidteather)** | Python, Playwright | Full profile/video/hashtag/comment for any public account; session-based | Medium (breaks every 4–8 weeks) | HIGH | Low (public data) |
| **pyktok** | Python | Hidden JSON extraction (~30 items/page, lighter footprint) | Medium | Medium | Low |
| **TikTokLive** | Python + Node.js | Real-time live events: chat, gifts, viewer count, battles, polls (100+ event types) | Medium–High | HIGH (commercial) | Low |
| **Euler Stream** | Commercial SaaS | TikTokLive wrapper, free tier, commercial support | High | Medium | Low |
| **ScrapeCreators** | Managed API | Creator profiles, videos, comments, audience demographics; handles anti-bot internally | Medium–High | Medium | Low |
| **EnsembleData** | Managed API | Multi-platform; unique transcript/speech-to-text feature | Medium | Medium | Low |

---

### 3B. Anti-Bot Countermeasures Summary

TikTok employs layered anti-bot defenses:

| Layer | Mechanism | DIY Bypass Difficulty |
|-------|-----------|----------------------|
| Signature verification | `X-Bogus` + `X-Gnarly` required headers on all API calls | Very High |
| TLS fingerprinting | JA3 fingerprint matching; must use modified TLS client | High |
| Browser fingerprinting | Canvas, WebGL, audio context, font enumeration | High |
| Behavioral analysis | Mouse movement, scroll patterns, timing analysis | High |
| Rate limiting | Per-IP, per-session, per-device limits | Medium |
| CAPTCHA | Triggered on anomalous patterns | Medium |
| IP blocking | Known datacenter IPs blocked; residential proxies required | Medium |

**Practical implication**: DIY scraping (`TikTokApi`) requires residential proxies, Playwright orchestration, and frequent maintenance (every 4–8 weeks) when TikTok rotates signature algorithms. Managed APIs (ScrapeCreators, EnsembleData, Apify) absorb this complexity.

---

### 3C. Legal Landscape

| Jurisdiction | Key Case/Rule | Implication for Scraping Public TikTok Data |
|--------------|---------------|---------------------------------------------|
| US | *hiQ v. LinkedIn* (9th Cir. 2022) | CFAA does not prohibit scraping publicly accessible data |
| US | *Van Buren v. United States* (SCOTUS 2021) | CFAA "exceeds authorized access" requires circumventing access controls |
| US | *Meta v. Bright Data* (N.D. Cal. 2024) | Scraping public data permissible; login-walled data is NOT |
| US | *X Corp. v. Bright Data* (settlement 2024) | Ambiguous — settled; suggests ToS breach risk persists |
| EU | GDPR | Scraping EU users' PII (name, photo, bio) may require GDPR legal basis |
| All | TikTok ToS | Explicitly prohibits all scraping; grounds for account ban but not criminal liability |

**Bottom line**: Scraping public TikTok profiles is legally defensible in the US under current precedent, but carries ToS breach risk (account/IP ban) and GDPR exposure for EU user PII.

---

## 4. Consolidated Auth & Permission Map

### 4A. Authentication Systems

TikTok has **two separate auth systems** that do not share tokens:

| System | Portal | Token Format | Lifetime | Usage |
|--------|--------|--------------|----------|-------|
| **Developer Platform** | developers.tiktok.com | `act.{...}` (user) / `clt.{...}` (client) | 24h / 2h | Display API, Content Posting, Research, Data Portability |
| **Business / Marketing API** | business.tiktok.com | Long-lived bearer token | Indefinite (until revoked) | Marketing API, TCM/TTO, Business Messaging, Commercial Content |
| **Shop API** | seller.tiktok.com (Partner Center) | Standard OAuth + HMAC signing | 24h access / 1yr refresh | TikTok Shop Open API |

---

### 4B. Token Type Reference

| Token Type | Prefix | TTL | Requires User Auth | Refreshable | Use Case |
|------------|--------|-----|-------------------|-------------|----------|
| User Access Token | `act.` | 24 hours | Yes | Yes (via refresh token) | Display API, Content Posting, Data Portability |
| Refresh Token | — | 365 days | Yes | No | Refreshes user access tokens |
| Client Access Token | `clt.` | 2 hours | No | No (re-issue via client_credentials) | Research API, Commercial Content API |
| Business API Token | — | Indefinite | Business account | No | Marketing API, TCM/TTO |
| Shop OAuth Token | — | 24h access / 365d refresh | Seller account | Yes | Shop Open API |

---

### 4C. Scope Requirements for User OAuth (Developer Platform)

| Scope | Grants Access To | Review Required | Notes |
|-------|-----------------|-----------------|-------|
| `user.info.basic` | open_id, union_id, avatar, display_name | Default | Granted automatically |
| `user.info.profile` | bio, username, profile link, is_verified | Yes | Requires app review |
| `user.info.stats` | follower_count, following_count, likes_count, video_count | Yes | Requires app review |
| `video.list` | List + query authenticated user's videos with metrics | Yes | Requires app review |
| `video.publish` | Direct post video to user's TikTok profile | Yes | Higher scrutiny; requires audit |
| `video.upload` | Upload to user's inbox as draft | Yes | Easier to approve than `video.publish` |
| `research.data.basic` | Research API endpoints | Academic approval | Not for commercial use |

---

### 4D. Shop API — HMAC Request Signing

Every TikTok Shop API request requires HmacSHA256 signing. The algorithm:

```
1. Collect: method, path, query params, body (all sorted alphabetically)
2. Concatenate: {app_key}{sorted_params_string}{timestamp}
3. HMAC-SHA256 sign with {app_secret}
4. Append &sign={hex_signature} to request
```

This is mandatory, non-negotiable, and applies to every request regardless of endpoint.

---

### 4E. Webhook Verification (Developer Platform)

```
1. Receive POST with header: TikTok-Signature: t={timestamp},s={signature}
2. Compute HMAC-SHA256("{timestamp}.{raw_request_body}", key=client_secret)
3. Compare computed signature with s value (constant-time comparison)
4. Respond HTTP 200 within 5 seconds
```

---

## 5. Consolidated Rate Limits Reference

### 5A. Official API Rate Limits

| API Product | Endpoint | Rate Limit | Window |
|-------------|----------|------------|--------|
| **Display API** | `/v2/user/info/` | 600 req | 1-minute sliding |
| **Display API** | `/v2/video/list/` | 600 req | 1-minute sliding |
| **Display API** | `/v2/video/query/` | 600 req | 1-minute sliding |
| **Content Posting API** | Init (video/photo) | 6 req/user token | 1-minute sliding |
| **Content Posting API** | Status check | 30 req/user token | 1-minute sliding |
| **Content Posting API** | Posts per creator | ~15 posts | 24-hour window |
| **Research API** | All endpoints combined | 1,000 req | Daily (resets 12:00 AM UTC) |
| **Research API** | Records returned | 100 per req | Per request |
| **Research API** | Total records/day | 100,000 records | Daily |
| **Research API** | Followers/Following | 20,000 req / 2M records | Daily (separate pool) |
| **Shop API** | All endpoints | 50 req/sec | Per endpoint |
| **Marketing API** | All endpoints | 1,000 req | 1-minute sliding |
| **TCM/TTO API** | All endpoints | 20 req | 1-minute sliding |
| **oEmbed** | Video/profile lookup | Not documented | — |

### 5B. Research API Data Quotas Summary

| Resource | Limit |
|---------|-------|
| Requests/day | 1,000 |
| Records/request (video, comments) | 100 |
| Records/day (video + comments) | 100,000 |
| Daily follower/following calls | 20,000 |
| Daily follower/following records | 2,000,000 |

### 5C. Data Freshness / Lag by Source

| Source | New Creator Data | Engagement Metric Lag | Historical Depth |
|--------|-----------------|----------------------|-----------------|
| Display API | Real-time (authorized user) | Real-time | All public videos |
| Research API | 48h indexing lag | Up to 10 days | ~2018 (quality degrades) |
| Apify (clockworks) | Near real-time | Near real-time | Unlimited public history |
| Modash | 24–48h refresh cycle | 24–48h | Extensive |
| Marketing API | Real-time | Real-time (ad metrics) | Campaign lifetime |
| TikTok Shop API | Real-time | Real-time (orders) | Account lifetime |

---

## 6. Access Requirements & Regional Restrictions

### 6A. App Review Requirements

| API Product | Review Timeline | Key Requirements |
|-------------|-----------------|-----------------|
| **Login Kit** | 3–4 business days | Live website + privacy policy + demo video showing all scopes |
| **Display API** | 3–4 business days (bundled with Login Kit) | Each scope (`user.info.profile`, `user.info.stats`, `video.list`) reviewed separately |
| **Content Posting API** | Several days to 2 weeks | Demo video + audit required to lift SELF_ONLY restriction |
| **Research API** | ~4 weeks (academic) | Institutional email + research proposal + IRB ethics approval |
| **Shop API** | Seller account required | Business verification + seller onboarding per country |
| **Marketing API** | 5–7 business days | TikTok Ads Manager account + Business Center setup |
| **TCM / TikTok One** | 5–7 business days (+ rep contact for TTO beta) | Business account + TikTok One registration |

### 6B. Business Account Requirements

| API Product | Business Account Required? | Notes |
|-------------|---------------------------|-------|
| Login Kit | No | Any TikTok developer account |
| Display API | No | Any TikTok developer account |
| Content Posting API | No (for `video.upload`); Stricter for `video.publish` | Standard developer account |
| Research API | No (academic institution only) | Non-commercial constraint |
| Shop API | Yes — Seller account | Must be approved as TikTok Shop seller |
| Marketing API | Yes — Ads Manager account | Business Center + Ads Manager |
| TCM/TTO API | Yes — Business account | TikTok One platform access |
| Business Messaging | Yes — Business account | Non-US/EEA/CH/UK requirement |

### 6C. Regional Availability

| API Product | Region Support | Notable Restrictions |
|-------------|---------------|---------------------|
| **Login Kit** | Global | — |
| **Display API** | Global | — |
| **Content Posting API** | Global | — |
| **Research API** | Researchers: US, EU, EEA, UK, CH only | Canada excluded; content returned is global |
| **Shop API** | 17 countries | US, UK, DE, FR, IT, ES, IE, JP, SG, ID, MY, TH, VN, PH, MX, BR — Canada NOT included |
| **Marketing API** | Global | Household income targeting US-only; EU compliance post-Jan 2026 |
| **TCM / TTO** | US (open beta expanding globally) | Contact TikTok rep for non-US access |
| **Business Messaging** | Non-US, non-EEA, non-CH, non-UK | Effectively unavailable in Western markets |
| **oEmbed** | Global | — |

### 6D. Account-Level Restriction Tiers (Content Posting)

| Account State | Restriction |
|---------------|-------------|
| Unreviewed developer app | Test with up to 10 sandbox users; no production access |
| Reviewed, unaudited | Max 5 users/day posting; all posts as `SELF_ONLY` |
| Reviewed + audited | Full public posting enabled; user cap lifted |
| Violations | Immediate revocation + permanent ban for account + business entity |

---

## 7. Data Availability Matrix

### 7A. Creator Profile Data — Coverage by Source

| Data Field | Apify | Display API | Research API | Modash | HypeAuditor | Phyllo | TCM/TTO |
|-----------|-------|-------------|--------------|--------|-------------|--------|---------|
| Handle / username | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Display name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bio description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bio link (website URL) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | — |
| Is verified | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Avatar URL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Follower count | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Following count | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Total likes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Video count | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Audience gender split | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Audience age split | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Audience geo / country | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Email address | ❌ | ❌ | ❌ | ✅ (paid) | ❌ | ❌ | ❌ |
| Fake follower score | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Past brand collabs | ❌ | ❌ | ❌ | ✅ | ✅ | — | ✅ |
| Creator GMV | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (Shop API only) |
| Completion rate | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| No creator auth needed | ✅ | ❌ | ❌ (academic) | ✅ | ✅ | ❌ | ✅ |

### 7B. Video Data — Coverage by Source

| Data Field | Apify | Display API | Research API | Composio |
|-----------|-------|-------------|--------------|---------|
| Video ID | ✅ | ✅ | ✅ | ✅ |
| Caption / description | ✅ | ✅ | ✅ | ✅ |
| Create timestamp | ✅ | ✅ | ✅ | ✅ |
| Duration | ✅ | ✅ | ✅ | ✅ |
| Thumbnail URL | ✅ | ✅ (expires) | — | ✅ |
| View count | ✅ | ✅ | ✅ | ✅ |
| Like count | ✅ | ✅ | ✅ | ✅ |
| Comment count | ✅ | ✅ | ✅ | ✅ |
| Share count | ✅ | ✅ | ✅ | ✅ |
| Save / favorites | ✅ | ✅ | ✅ | — |
| Hashtags used | ✅ | ❌ | ✅ | — |
| Sound / music ID | ✅ | ❌ | ✅ | — |
| Duet / stitch source | ✅ | ❌ | ❌ | — |
| Transcript (voice) | ❌ | ❌ | ✅ (~20%) | ❌ |
| Video label (election, etc.) | ❌ | ❌ | ✅ | ❌ |
| No creator auth needed | ✅ | ❌ | ❌ (academic) | ❌ |

---

## 8. Permanent Gaps — Data That Cannot Be Accessed

These are data types that **no official or unofficial method provides** programmatically:

| Data Gap | Why Inaccessible | Nearest Alternative |
|----------|-----------------|---------------------|
| **Creator DM (outbound)** | TikTok API explicitly prohibits cold messaging | Email (Gmail API); TCM order-based invite |
| **Peak live viewer count** | No official live API; unofficial WebSocket doesn't persist data | Manual tracking during stream |
| **Gift revenue from live** | Never exposed in any API | None |
| **Live stream full recording** | Not stored/served via API | TikTok in-app download only |
| **Video completion rate (arbitrary creators)** | Requires creator OAuth or TCM partnership | TCM/TTO (within pool); Modash/HypeAuditor (estimated) |
| **Creator Fund / TTCM earnings** | Payment data stays internal | None |
| **Real-time follower change events** | No webhook for follower changes | Daily polling (Metricool: daily delta) |
| **TikTok Stories metrics** | Stories not in any API | None |
| **Audience geo data via scraping** | Anti-bot prevents profile page demographic sections | Modash, HypeAuditor, Phyllo, TCM/TTO |
| **Historical time-series metrics** | APIs return snapshots only | Periodic polling + storage |
| **DM read access (inbox)** | Data Portability API exports archive only; no real-time inbox | None |
| **Sound/music analytics** | No endpoint for sound performance metrics | Pentos (dashboard), EchoTik (TikTok Shop sounds) |

---

## 9. Integration Surface Summary

### 9A. Integration Path Decision Tree

```
CREATOR DISCOVERY
├── Unknown creator (arbitrary lookup)
│   ├── By handle → Apify clockworks/tiktok-profile-scraper [Fast, $0.003/profile]
│   ├── By keyword/niche → Apify clockworks/tiktok-user-search-scraper [~$0.005/result]
│   ├── By hashtag → Apify clockworks/tiktok-hashtag-scraper [~$0.005/result]
│   └── Premium (with email + demographics) → Modash Discovery API [$16,200/yr]
│
├── Creator pool (≥10K followers, in TCM)
│   └── TCM/TikTok One API → creator search + order-based workflow [Free API + TikTok rep]
│
└── Creator opted in (OAuth connected)
    └── Display API → /v2/user/info/ [Free, 600 req/min, real-time]

CREATOR ENRICHMENT
├── Basic profile → Apify profile-scraper [same as discovery, reuse]
├── Audience demographics (pre-acceptance) → ScrapeCreators [26 credits] or Modash [$]
├── Audience demographics (post-acceptance) → Phyllo [official OAuth, accurate]
├── Fraud / authenticity score → HypeAuditor [custom pricing]
├── Completion rate → Modash / HypeAuditor / TCM/TTO
└── Email discovery → Bio-link crawl (existing Cheerful pipeline)

CONTENT TRACKING (post is live)
├── Creator NOT connected → Apify clockworks/tiktok-video-scraper [polling, $0.005/item]
├── Creator IS connected → Display API /v2/video/query/ [600 req/min, real-time]
├── Campaign hashtag tracking → Apify hashtag-scraper [48h cadence]
└── Sound/duet tracking → Apify video-scraper filtered on sound_id / duet_from_id

CONTENT POSTING
├── Draft to creator inbox → Content Posting API + video.upload scope [easiest]
└── Direct to profile → Content Posting API + video.publish scope [requires audit]

PAID AMPLIFICATION
├── Creator provides auth code → Marketing API Spark Ads [creator runs in TikTok app]
│   └── → POST /open_api/v1.3/tt_video/authorize/ → create campaign
└── TCM order → Spark Ads authorization bundled automatically with order

OUTREACH
├── Primary channel → Email (Gmail API, existing Cheerful)
├── Campaign invite (TCM pool) → TCM/TTO API order + invite link
└── DM outreach → ❌ Not possible via any TikTok API

COMMERCE
├── Creator affiliate tracking → TikTok Shop Affiliate Seller API
│   └── Requires seller account per client, 17 countries
└── Creator GMV scouting → EchoTik platform [$9.9–57/mo]
```

---

### 9B. Integration Tier Classification

**Tier 0 — Zero Auth (Immediate)**

| Integration | What It Provides | Cost |
|-------------|-----------------|------|
| TikTok oEmbed | Caption, username, embed HTML for any video | Free |
| Embed Player | Embeddable video iframe with postMessage control | Free |
| Apify (public data) | Creator profiles, video metrics, hashtag data | ~$0.005/item |

**Tier 1 — API Key / Account Setup (Days)**

| Integration | What It Provides | Setup Time |
|-------------|-----------------|------------|
| Marketing API | Campaign management, Spark Ads, reporting | 5–7 business days |
| TikTok Shop API | Affiliate tracking, GMV, order management | Seller onboarding (varies) |
| Modash / HypeAuditor | Rich creator database, demographics, email | Immediate (commercial) |

**Tier 2 — App Review Required (1–2 Weeks)**

| Integration | What It Provides | Review Time |
|-------------|-----------------|-------------|
| Login Kit + Display API | Authorized creator profile + video metrics | 3–4 business days per scope batch |
| Content Posting API (inbox) | Draft upload to creator inbox | Several days + audit |
| Content Posting API (direct) | Live post to creator profile | 2 weeks + separate audit |

**Tier 3 — Institutional / Business (Weeks to Months)**

| Integration | What It Provides | Access Time |
|-------------|-----------------|-------------|
| TCM / TikTok One API | Creator discovery with unique metrics + Spark Ads integration | 5–7 days review + rep contact |
| Research API | Arbitrary creator lookup, hashtag search (academic only) | ~4 weeks; commercial use PROHIBITED |

---

### 9C. Quick Reference: What Requires Creator OAuth

| Capability | Requires Creator OAuth? | Alternative Without OAuth |
|-----------|------------------------|--------------------------|
| View creator's public profile | No | Apify, Research API (academic), Modash |
| View creator's videos + metrics | No | Apify, Research API (academic) |
| View creator's private videos | N/A | Not possible |
| Post content to creator's profile | Yes (user token) | None |
| Access creator's audience demographics | Yes (Display API is limited) | Phyllo (creator-permissioned), TCM, Modash |
| Track creator's linked email | No (bio-link crawl) | Bio-link Apify crawl |
| Issue Spark Ad authorization | Yes (creator generates code in-app) | Creator must do it; no workaround |
| Access creator's financial data | No (not available) | TikTok Shop affiliate GMV via Shop API |

---

*Sources: 21 analysis files in `analysis/` directory. See individual files for full endpoint documentation, payload examples, and Cheerful-specific integration notes.*
