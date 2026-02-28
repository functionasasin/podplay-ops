# Third-Party TikTok Data Providers — Survey

## Summary

Seven dedicated third-party providers cover the TikTok data gap left by the official API ecosystem. Each takes a different approach: some are analytics dashboards with optional export/API, some are developer-first API products, and one focuses exclusively on TikTok Shop ecommerce data. None of them require per-creator OAuth from Cheerful or its clients — they either have platform-level arrangements with TikTok, scrape public data, or work through creator-permissioned flows.

**Key gap these providers solve**: The official TikTok Display API only works on creators who have explicitly granted OAuth to Cheerful. The Research API prohibits commercial use. These providers offer programmatic access to *any* public TikTok creator's data, which is the baseline Cheerful needs for influencer discovery and enrichment.

---

## Provider Profiles

### 1. Modash

**Website**: modash.io
**Type**: Influencer marketing platform + developer API
**TikTok coverage**: 250M+ public TikTok profiles with 1K+ followers
**Best for Cheerful**: Creator discovery, enrichment, collaboration history

#### Platform Plans

| Plan | Monthly | Profiles/mo | Emails/mo | Creators tracked |
|------|---------|-------------|-----------|-----------------|
| Essentials | $199 | 300 analyzed | 150 unlocked | 100 |
| Performance | $499–$599 | 800 analyzed | 400 unlocked | 250 |
| Enterprise | Custom | Custom | Custom | Custom |

#### API Products

Modash offers two separate, developer-focused APIs priced independently from the platform:

**Discovery API** — $16,200/year (3,000 credits/month, annual commitment)
- Purpose: Find creators and understand audience/performance
- Credit model: Search costs ~0.01 credits/creator found; profile report costs more
- Key TikTok endpoints and data:
  - **Search/filter**: Keyword, AI natural-language search, follower range, engagement rate, average views, audience demographics
  - **Profile report**: Follower count, engagement rate, average views, audience demographics (age/gender/location breakdown), fake follower score, past brand collaboration history
  - **Collaborations API**: Bi-directional partnership map — query an influencer to see which brands they promoted, or query a brand to see every creator who posted about them; includes views, engagement rate, EMV per collaboration (Instagram + TikTok)
  - **AI Search**: Natural language content matching (finds creators by theme, product type, activity), analyzes images/videos

**Raw API** — $10,000/year (40,000 requests/month, annual commitment)
- Purpose: Live, unfiltered real-time data for tracking and monitoring
- Key TikTok data:
  - Profile data: username, display name, bio, verification status, followers, following
  - Content metadata: recent posts, tags, mentions, hashtags, comments
  - Aggregate metrics: total likes count, total "digg" count (TikTok-specific interaction)
  - Follower list changes and growth tracking
  - Live-updating post metadata, metrics, and URLs
- Free Raw API requests bundled with Discovery API subscription for testing

#### Cheerful Relevance

HIGH. Modash directly addresses two critical gaps:
1. **Discovery without creator OAuth**: Can find and analyze any 250M+ TikTok profiles without requiring creators to connect their accounts
2. **Email extraction**: Unlocks contact emails for creators (150–400/month on platform plans)
3. **Collaboration history**: Unique data point for qualifying creators by past brand partnerships

The $16,200/year Discovery API is enterprise pricing; the platform plan ($199–$599/month) with programmatic export is more cost-effective for Cheerful at early stage.

---

### 2. HypeAuditor

**Website**: hypeauditor.com
**Type**: AI-powered influencer analytics platform + API
**TikTok coverage**: All public TikTok creators (no stated floor)
**Best for Cheerful**: Creator vetting, fraud/fake-follower detection, enrichment

#### Platform Plans

Pricing is not publicly disclosed — custom pricing only. Contact required.

Available plan tiers (unlisted prices): Basic, Professional, Enterprise. All include:
- Influencer search and discovery across Instagram, YouTube, TikTok, Twitch, Twitter
- Audience authenticity/fraud analysis
- Campaign management add-on (extra)
- Extra reports add-on (extra)

Free tools: TikTok Influencer Pricing Calculator (estimate creator rates from follower count + avg views + engagement rate)

#### API

**Suggester API**: Find influencers by name or account name across platforms including TikTok — returns matches with normalized profile data.

**Report API**: On-demand generation of influencer reports for any creator. For TikTok, each report covers 35+ metrics:
- Profile: location, contact information, verified status
- Audience: demographics (age, gender, location breakdown), audience quality score
- Authenticity: fake follower detection score, fraud analysis — **unique capability**
- Engagement: engagement rate, growth trajectory, posting frequency
- Reach: average video views, estimated reach

API pricing: not publicly listed (custom). Contact hypeauditor.com/api-integration.

#### Cheerful Relevance

HIGH for creator vetting. HypeAuditor's fraud detection (fake follower score, audience quality score) is a key trust signal for Cheerful's clients selecting influencer partners. This data is not available through any official TikTok API. The API-on-request model means it can be called during the enrichment workflow on any creator regardless of TikTok OAuth status.

The lack of transparent pricing is a friction point — requires a sales conversation before integration can be evaluated.

---

### 3. Pentos

**Website**: pentos.co
**Type**: TikTok-specific analytics and trend tracking
**TikTok coverage**: Accounts, hashtags, sounds/audio, videos, trends (global)
**Best for Cheerful**: Trend discovery, sound tracking, competitor benchmarking

#### Plans

| Plan | Monthly | Description |
|------|---------|-------------|
| Starter | ~€25 | Individual use, basic trackers |
| Trends Pro | $99 | Global trend leaderboards, tracking for hashtags/sounds/accounts |
| Analytics | $299 | Account performance measurement, historical data |

#### Data Coverage

Pentos takes **daily snapshots** of TikTok, providing historical data beyond TikTok's native 60-day limit. The platform tracks:
- Account performance: views, likes, comments, engagement rate, follower growth
- Video performance over time (metric tracking per individual video)
- Sound/music usage: how many videos use a sound, growth of a sound over time
- Hashtag trends: view counts, growth rate, top creators per hashtag
- Global leaderboards: top songs, users, videos, hashtags with time-series history (sortable by growth rate)
- Benchmarking: engagement rates vs industry averages

**Data export**: CSV and Excel export available. Automatic scheduled exports (monthly CSV by email, customizable during onboarding).

#### API Status

**No public API**. Pentos explicitly states no API is available. Custom data connections are possible by contacting support ([email protected]) — they can connect TikTok data to other tools via custom arrangement.

#### Cheerful Relevance

MEDIUM-LOW for core workflows. Pentos is a dashboard tool rather than a developer API. Its trend leaderboards are useful for sound/hashtag discovery in campaign brief generation but there is no programmatic integration path without a custom enterprise arrangement. The brand benchmarking data could enrich campaign context. Not suitable as a primary data provider.

---

### 4. Socialinsider

**Website**: socialinsider.io
**Type**: Social media analytics platform (multi-platform, agency-focused)
**TikTok coverage**: Connected accounts only (requires TikTok Business/Creator account connection)
**Best for Cheerful**: Campaign reporting for clients with connected accounts

#### Plans

| Plan | Monthly (annual) | Social profiles | API access |
|------|-----------------|-----------------|------------|
| Starter | $83 | 10 | No |
| Professional | $166 | 25 | No |
| Advanced | $333 | 50 | Yes |
| Enterprise | Custom | Custom | Yes |

2 months free on annual billing (~15% discount).

#### TikTok Capabilities

Socialinsider aggregates TikTok alongside Instagram, Facebook, LinkedIn, YouTube, and Twitter:
- Video performance metrics
- Audience demographics
- Engagement rates
- Trending content identification
- Cross-platform comparative benchmarking
- Agency client reporting (white-labeled dashboards)

**API access**: Available only on Advanced plan ($333/month+). Rate limits vary by subscription tier. Note: Some third-party aggregators list Socialinsider as having no API — discrepancy likely reflects gated API access not visible at lower tiers.

#### Key Limitation

Socialinsider only analyzes **connected TikTok accounts** — it cannot analyze arbitrary public creators without them connecting their account. This makes it unsuitable for Cheerful's creator discovery and enrichment workflows, which target creators who haven't opted in.

#### Cheerful Relevance

LOW for core discovery/enrichment workflows. MEDIUM for client-side campaign analytics where a brand client has connected their TikTok account — could power post-campaign reporting dashboards. The $333/month API tier is reasonable if Socialinsider becomes the analytics layer for Cheerful's client reporting.

---

### 5. EchoTik

**Website**: echotik.live
**Type**: TikTok Shop ecommerce analytics + API
**TikTok coverage**: TikTok Shop data across all active markets
**Best for Cheerful**: TikTok Shop product/creator/sales intelligence

#### Platform Plans

| Plan | Monthly (annual) | Monthly (monthly) | Highlights |
|------|-----------------|-------------------|------------|
| Free | $0 | $0 | 5 daily searches, basic lists |
| Basic | $9.9 | $13.9 | 100 daily detail views, 100 daily exports |
| Pro | $19.1 | $29 | 1,000 daily views, 2,000 exports, contact info filter |
| Enterprise | $29.1 | $57 | 60,000 daily product exports, influencer contact export |

All plans: access to TikTok influencer, product, shop, video, and live data.

#### API Service (Separate from Platform)

EchoTik offers a dedicated API service with:
- **40+ specialized endpoints** covering TikTok Shop data
- **Data categories**: Creators/influencers, Videos, Live Streams, Products, Shops
- **Two years of historical data** with trend analysis and custom date range comparison
- **Market coverage**: Southeast Asia, United States, United Kingdom, Spain, Mexico, and all active TikTok Shop markets
- **Free trial**: 100 API requests

**Rate limits by tier**:
- Free: 10 requests/second
- Pro: 50 requests/second
- Enterprise: Custom

**Pricing**: Not publicly disclosed on API service page; requires contact for API tier pricing.

#### Data Scope

EchoTik's data is specifically TikTok Shop and ecommerce-oriented:
- Creator GMV (gross merchandise value) from Shop integrations
- Product sales rankings and trending items
- Shop performance analytics per seller
- Creator-to-product affinity (which creators sell which products)
- Live stream commerce metrics (viewers, orders placed, GMV during live)
- Competitor product selection intelligence

#### Cheerful Relevance

MEDIUM. EchoTik addresses the same gap as the TikTok Shop Affiliate Seller API — creator GMV data — but without requiring a brand seller account. It's a read-only intelligence layer for TikTok Shop. Useful for:
1. Vetting creators by their ecommerce track record (actual sales data)
2. Identifying top-performing affiliate creators per product category
3. Campaign planning for TikTok Shop campaigns

The $9.9–$57/month platform pricing is trivially affordable. API pricing requires a conversation.

---

### 6. Phyllo

**Website**: getphyllo.com
**Type**: Creator-permissioned social data API (unified API across 20+ platforms)
**TikTok coverage**: Creator-connected profiles (requires creator OAuth consent)
**Best for Cheerful**: First-party, consented creator data with demographic detail

#### Pricing

Starts at approximately $199/month (not publicly disclosed; custom quote required). SOC 2 Type 1 compliant.

#### How It Works

Phyllo is a **creator-permissioned** data platform — unlike Apify or Data365, it connects via official TikTok API with creator consent. Creators authenticate their TikTok accounts through Phyllo's SDK (available for iOS, React Native, Android, Flutter, Web), and Phyllo maintains the API connection.

This gives Phyllo access to **first-party data** not available through public scraping:

#### TikTok-Specific Data Available

Via official TikTok API (with creator permission):
- **Identity and Audience API**: Profile info, follower count, following count, bio, verified status, **audience demographics** (age, gender, location) — the key differentiator
- **Engagement and Comments API**: Content items, comments, engagement metrics (likes, impressions, shares)
- **Content performance**: Video-level metrics for all creator content
- **Historical data**: Not limited to TikTok's 60-day window via Phyllo's own caching

**Webhooks**: Phyllo provides webhooks for content and profile changes — a gap TikTok itself doesn't fill.

#### Key Differentiators

1. **Audience demographics**: TikTok's direct API does not expose gender, age, and location demographic data. Phyllo provides this through secure platform partnerships and data governance arrangements.
2. **Automatic API migration**: Phyllo's team handles TikTok API version changes — integrators get updates without re-connection.
3. **Unified API**: Same normalized schema for TikTok, Instagram, YouTube, LinkedIn, X, and 15+ other platforms — one integration covers all.

#### Limitations

- **Requires creator opt-in**: Cannot analyze arbitrary public creators. Only creators who authenticate through Phyllo's flow.
- **Friction**: Creator sign-up flow adds friction to onboarding.
- **Integration reliability**: Some developer reports of breaking integrations requiring maintenance.
- **No discovery**: Cannot search the Phyllo network for new creators; limited to profiles that have already logged in.

#### Cheerful Relevance

HIGH specifically for post-acceptance creator enrichment. Once a creator is onboarded to a campaign, Phyllo can pull first-party audience demographic data that is unavailable through any other method (official API or scraper). This is the "ground truth" for audience quality verification.

The creator-permissioned model aligns well with Cheerful's campaign workflow where creators must accept an invitation — the Phyllo auth can be bundled into that onboarding step.

---

### 7. Data365

**Website**: data365.co
**Type**: Public social data extraction API (multi-platform)
**TikTok coverage**: All public TikTok content (no creator auth required)
**Best for Cheerful**: Alternative to Apify for creator enrichment with custom pricing

#### Pricing

Not publicly listed. 14-day free trial with access to 20+ data types. Custom plans — contact required.

#### What It Provides

Data365 collects directly from TikTok's public web interface (no user login or TikTok API key). Provides:
- User profiles: username, bio, follower/following counts, verification
- Posts: content metadata, engagement metrics (likes, comments, shares, views)
- Hashtag content: all posts under a hashtag
- Cross-platform: same schema for TikTok, Instagram, Facebook, Reddit, X

**Analytics computed by Data365**:
- Likes/comments ratio
- Engagement rate
- Average views per post
- Estimated price per post (creator rate estimation)
- Follower history and growth

**Delivery**: Structured JSON, real-time processing (not pre-cached), typically minutes to deliver.

#### Positioning vs Official API

Data365 explicitly positions itself as a simpler alternative to the official TikTok API — no developer registration, no app review, no access tier management, no per-creator OAuth. Bypasses TikTok's 1,000 calls/hour basic limit.

#### Risk Profile

Data365 operates in the same category as Apify — scraping public data without official API credentials. TOS compliance risk exists but is less explicit than unofficial Python libraries, as Data365 operates as a professional B2B data provider with its own terms and likely has negotiated data arrangements.

#### Cheerful Relevance

MEDIUM. Data365 is a viable alternative to Apify for public creator data extraction. The custom pricing model makes cost comparison difficult vs Apify's transparent pay-per-result model. Apify has a stronger advantage (Cheerful already has the infrastructure, multiple specialized actors, known pricing). Data365's value would be as a backup or if it offers better rate limits at scale.

---

## Comparison Matrix

| Provider | Creator Auth Required | Discovery (arbitrary creators) | TikTok-Specific | Key Unique Data | Pricing Model |
|---|---|---|---|---|---|
| Modash | No | Yes (350M+ TikTokers) | No (multi-platform) | Collaboration history, fake follower score | $199–$599/mo platform; $16,200/yr API |
| HypeAuditor | No | Yes (no stated floor) | No (multi-platform) | Fraud/authenticity score, 35+ metrics | Custom (contact required) |
| Pentos | No | Limited (analytics only) | **Yes** (TikTok-only) | Sound/hashtag trends, historical leaderboards | $99–$299/mo |
| Socialinsider | **Yes** | No | No (multi-platform) | Cross-platform benchmarking | $83–$333/mo |
| EchoTik | No | Partial (Shop creators) | **Yes** (TikTok Shop) | Creator GMV, product sales, live commerce | $9.9–$57/mo platform; API custom |
| Phyllo | **Yes** (creator consent) | No | No (multi-platform) | Audience demographics (first-party) | ~$199/mo+ |
| Data365 | No | Yes | No (multi-platform) | Engagement analytics, rate estimates | Custom |

---

## Data Gap Analysis for Cheerful

### Available Through These Providers (Not from Official APIs)

| Data Point | Best Provider | Notes |
|---|---|---|
| Any public creator profile (no OAuth) | Modash, HypeAuditor, Data365, Apify | Core gap filled |
| Creator contact email | Modash | 150–400 unlocks/month |
| Audience demographics | Phyllo | Only with creator permission; HypeAuditor also covers it |
| Fake follower / fraud score | HypeAuditor | Unique capability |
| Past brand collaboration history | Modash Collaborations API | Bi-directional brand↔creator history |
| Creator GMV from TikTok Shop | EchoTik | Shop-focused creators |
| Sound/hashtag trend data | Pentos | Historical leaderboards |
| Audience size filter (arbitrary creators) | Modash | 250M+ filterable |

### Still Not Available Through Any Provider

| Data Point | Gap |
|---|---|
| Creator DMs | Hard platform restriction |
| Exact follower demographics without creator auth | Only estimated via HypeAuditor/Modash modeling |
| Real-time video metrics (sub-minute) | Polling required; no push available |
| Gift revenue from live streams | TikTok never exposes via any API |
| Private account data | No path |

---

## Cheerful Integration Recommendations

### Tier 1: Recommended for Integration

**Modash** (or Apify as cheaper alternative for basic enrichment):
- Primary use: creator discovery, profile enrichment, email extraction, collaboration history
- Integration: REST API, credit-based, fits Temporal activity pattern
- Decision: Apify ($0.005/item) is far cheaper for basic profile data; Modash's value-add is collaboration history and email unlock — evaluate if these justify $16,200/year API or $199/month platform

**HypeAuditor**:
- Primary use: creator vetting / fraud detection during campaign creator review
- Integration: REST API (custom arrangement)
- Decision: Contact for pricing; a per-report model may be affordable for selective use during enrichment

**Phyllo**:
- Primary use: post-acceptance audience demographic pull (first-party data)
- Integration: SDK bundled into creator onboarding, then REST API for data
- Decision: The audience demographics gap is real — this is the only compliant path to gender/age/location breakdown for connected creators

**EchoTik**:
- Primary use: TikTok Shop campaign intelligence
- Integration: REST API, 40+ endpoints, affordable platform tier
- Decision: Low cost, high value for Shop-focused campaigns; evaluate for $19.1/month Pro tier

### Tier 2: Monitor, Don't Integrate Now

**Pentos**: No API, dashboard only — defer until they offer programmatic access
**Socialinsider**: Requires creator account connection, not useful for discovery
**Data365**: Viable backup to Apify; evaluate if Apify becomes unavailable or too expensive at scale

---

## Notes

- All "no creator auth" providers rely on scraping or commercial data arrangements — TOS risk exists but is an accepted industry norm for influencer marketing platforms
- Modash's Discovery API ($16,200/yr) vs. Apify ($0.005/item) is the core cost-benefit question: Modash bundles collaboration history + email + fraud scoring; Apify is raw profile data only but at commodity pricing
- Phyllo fills the audience demographics gap that no other path provides — but only for creators who consent, making it a post-onboarding enrichment tool rather than a discovery tool
- EchoTik's GMV data is unique for TikTok Shop campaigns and complements the TikTok Shop Affiliate Seller API (which requires a brand seller account)
