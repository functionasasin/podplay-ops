# TikTok Creator Marketplace API — Analysis

## Overview

The TikTok Creator Marketplace (TCM) — now rebranded as **TikTok One** — is TikTok's official platform for brand-creator collaboration. It provides an end-to-end workflow: creator discovery, campaign brief creation, order management, content delivery, and reporting. In 2024, TikTok migrated Creator Marketplace, Partner Exchange (Creative Exchange), and Creative Challenge into the unified **TikTok One** platform.

The **TTCM API** (TikTok Creator Marketplace API) was opened to third-party developers in 2021, initially in alpha with select partners (WPP, Captiv8, Brandwatch). It is now part of the broader **Organic API** suite under the TikTok API for Business umbrella.

**Status**: Generally Available (GA) — third-party API access open; some sub-features (TTO API) still in Open Beta
**Authentication**: OAuth 2.0 via API for Business portal (`business-api.tiktok.com`)
**Base URL**: `https://business-api.tiktok.com/open_api/v1.3/`
**Portal**: https://business-api.tiktok.com/portal
**Docs**: https://business-api.tiktok.com/portal/docs
**TikTok One (UI)**: https://ads.tiktok.com/creative/creatormarketplace

---

## The TikTok One / Organic API Suite

When TikTok launched the Organic API open beta, it organized creator marketplace functionality into five distinct APIs:

| API | Purpose | Status |
|-----|---------|--------|
| **Accounts API** | Video publishing and organic post insights | GA |
| **Discovery API** | Trending hashtags, themes, Commercial Music Library tracks | GA |
| **Mentions API** | Track brand/product mentions in organic videos | GA |
| **TikTok One (TTO) API** | Creator discovery, branded content collaboration, campaign management | Open Beta |
| **Spark Ads Recommendation API** | Identify high-performing organic posts for paid amplification | GA |

The TTO API specifically represents the programmatic interface to what was formerly the Creator Marketplace. The others complement it (find trends to brief on, monitor mentions, boost winning content).

---

## Creator Eligibility for TTCM Discovery

Only creators who have joined TikTok Creator Marketplace (now TikTok One) are discoverable via the API. This is a critical constraint — it limits the discoverable pool.

### Creator Requirements (US market)
- Minimum **10,000 followers** (US requirement; varies by region — some markets allow 1,000)
- Located in one of **24 supported countries**
- At least **18 years of age**
- Personal TikTok account
- At least **3 videos posted in the last 30 days**
- At least **1,000 video views** in the last 30 days
- Content appropriate for 13+ audiences
- No recent policy violations

### Pool Size
- ~**2 million** creators are available in the Creator Marketplace globally
- This is a curated subset of all TikTok creators — nano-influencers (< 10K) are excluded
- High eligibility bar creates a "gatekeeper effect" — cannot discover rising stars or sub-10K creators through this channel

### Creator Joining Process
- Creators can apply directly or be invited by a brand
- Application reviewed by TikTok; reapplication possible after 30 days if rejected
- Brands can send invitations to non-TTCM creators to join, then they become discoverable once approved
- Third-party platforms (Brandwatch, Captiv8) show a **"Marketplace" label** on TTCM-verified accounts

---

## Data Accessible via the TCM / TTO API

### Creator Profile Data
| Data Point | Available |
|-----------|---------|
| Follower count | Yes |
| Video count | Yes |
| Engagement rate (likes + comments + shares / views, avg last 30 videos) | Yes |
| Average video views | Yes |
| Audience demographics: age breakdown | Yes (18+ only) |
| Audience demographics: gender | Yes |
| Audience demographics: country/locale | Yes |
| Completion rate | Yes (unique to TTCM — not accessible via scraping) |
| Audience retention graphs | Yes (first-party, not available from external tools) |
| Past brand collaboration performance | Yes (within TTCM ecosystem) |
| Growth trends over time | Yes |

### Video-Level Data (TTCM-linked posts)
| Data Point | Available |
|-----------|---------|
| Views | Yes |
| Likes | Yes |
| Comments | Yes |
| Shares | Yes |
| Reach | Yes |
| Play time metrics | Yes |
| Audience analytics (per video) | Yes |

**Key advantage**: Because data comes from TikTok's backend directly, metrics like completion rate and audience retention graphs are accurate first-party data that external scrapers and third-party tools cannot replicate.

---

## Campaign Order Workflow

The TTCM API enforces an **order-based** campaign tracking model. Keyword detection (used by older integrations) is **not permitted** — brands cannot detect TikTok posts by hashtag or keyword on behalf of creators.

### Order Lifecycle
```
Brand creates Order → sends Invitation Link to creator
→ Creator opens link in TikTok app
→ Creator sees deliverable requirements + Spark Ads authorization
→ Creator uploads and publishes video via order workflow
→ Post auto-tracked in brand's campaign dashboard
→ Alternative: Creator uses Campaign Code retroactively if posted outside workflow
```

### Order Constraints
- Maximum **10 videos** per order
- Creator must be a TTCM member to receive an order
- Posts are tracked under "Published Posts" tab (separate from other social network posts)
- Campaign performance data flows to brand in real-time

### Campaign Brief Elements
- Brand name
- Campaign description/brief
- Number of deliverables required
- Spark Ads authorization (bundled into creator acceptance)

---

## Creator Discovery & Search

### Filtering Capabilities (via TTO API / TikTok One)
| Filter | Description |
|--------|-------------|
| Location | Country or region of creator |
| Category/Niche | Content vertical (beauty, gaming, etc.) |
| Follower range | Minimum/maximum follower counts |
| Average views | Per-video view ranges |
| Engagement rate | Filter by engagement performance |
| Audience age | 18+ only; filter by dominant age cohort |
| Audience gender | Majority gender of audience |
| Audience country | Where audience is located |

### Advanced Discovery Features (TikTok One 2024–2025)
- **AI-powered matching**: TikTok's algorithm recommends creators to brands based on campaign goals and historical performance
- **Open casting calls**: Brands can post an open brief and let creators apply
- **Curated highlights**: TikTok surfaces "top performers" for given campaign objectives
- **Past collaboration performance**: Cross-reference creators who have worked with similar brands

---

## Integration Patterns Used by Partners

### Brandwatch (Influence Platform) — Reference Implementation
Brandwatch integrated the TTCM API in 2024 and documented several key implications:

1. **Data migration**: All previously scraped/third-party TikTok data had to be removed to maintain compliance
2. **Workflow change**: Keyword detection disabled; order workflow required
3. **New data unlocked**: Audience locales, completion rates, detailed video analytics previously unavailable
4. **Authentication**: Influencers must authenticate their accounts within the platform
5. **Account labeling**: Authenticated TTCM accounts display "Marketplace" label in UI

### Captiv8 — Early TCM Partner
- First influencer platform to achieve end-to-end TCM API integration
- Gained: AI-powered discovery, automated real-time reporting, paid amplification tools
- Specifically uses Spark Ads authorization flow bundled with order creation

---

## Spark Ads Integration (Bundled with TCM Orders)

A powerful feature of the order workflow: when a creator accepts an order, they simultaneously grant **Spark Ads authorization** to the brand. This allows the brand to boost that creator's post as a Spark Ad without separate authorization requests.

**Why this matters for Cheerful**: When managing influencer campaigns, Cheerful could:
1. Issue a TTCM order to a creator
2. Receive Spark Ads authorization as part of acceptance
3. Automatically boost high-performing posts via Marketing API (Spark Ads)
4. Attribution flows back to original organic post (likes, comments, follows count)

Spark Ads created from creator content drive **159% higher engagement** than non-creator Spark Ads (TikTok North America data).

---

## Commercial Content API (Separate)

TikTok also operates a **Commercial Content API** distinct from the Creator Marketplace API:

- **Purpose**: Public transparency into TikTok advertisements (EU Digital Services Act compliance)
- **Data**: Published date, last seen date, targeting info, number of impressions
- **Scope**: Currently **EU only**, planned expansion
- **Access**: Application required (commercial-research-questions@tiktok.com)
- **Use case**: Research into competitor ad strategies, ad transparency analysis

This is separate from the Creator Marketplace — it's a read-only research tool, not a brand management tool.

---

## Webhooks

TTCM orders generate webhook events:

| Event Type | Description |
|-----------|-------------|
| Order created | Brand creates an order for a creator |
| Order accepted | Creator accepts campaign order |
| Post submitted | Creator uploads video via order workflow |
| Post published | Video goes live on TikTok |
| Campaign code used | Creator retroactively ties post to campaign |

Webhook subscriptions managed through the API for Business portal.

---

## Access Requirements

### For Third-Party Platforms (API Access)
1. Register on [TikTok API for Business](https://business-api.tiktok.com/portal)
2. Create an app and request TTCM/Organic API permissions
3. Submit a working prototype and usage description
4. **Review process**: 5–7 business days typical; may receive feedback requiring revisions
5. Upon approval: receive Client Key/Client Secret
6. Implement OAuth 2.0 flow for advertiser authorization

### Partner Tiers
- **Self-service**: Access through standard API for Business portal application
- **Marketing Partner**: Requires TikTok Marketing Partner certification — higher data limits, dedicated support, co-marketing opportunities
- **Enterprise/Global Beta**: Features like TTO API Open Beta require reaching out to a TikTok representative directly

### Business Account Requirements
- TikTok Business Account required for brands
- Business must be in a supported country
- Ad account may be required for Spark Ads functionality

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Per-user access token | 20 requests/minute |
| App-level | Higher limits available (varies by partner tier) |
| Creator data queries | Standard API rate limits apply |

---

## Regional Availability

| Region | TCM Available | Notes |
|--------|--------------|-------|
| United States | Yes | 10,000+ follower requirement for creators |
| United Kingdom | Yes | — |
| EU (Germany, France, etc.) | Yes | GDPR compliance; Commercial Content API also active |
| Japan | Yes | — |
| Southeast Asia | Yes | Lower follower thresholds in some markets |
| India | No | TikTok banned; no availability |
| Australia | Yes | — |

Creator eligibility thresholds and available data points vary by region.

---

## TCM vs. Display API vs. Research API — Capability Comparison

| Capability | TCM / TTO API | Display API | Research API |
|-----------|--------------|-------------|--------------|
| Creator profile data | Yes (TTCM members only) | Yes (any public creator) | Yes (wider scope) |
| Audience demographics | Yes (first-party, precise) | Limited | Some aggregates |
| Completion rate / retention | Yes (unique) | No | No |
| Brand collaboration history | Yes | No | No |
| Campaign order management | Yes | No | No |
| Content tracking (campaign posts) | Yes (order-based) | Polling only | No |
| Spark Ads authorization | Yes (bundled) | No | No |
| Keyword detection tracking | No | Limited | Yes |
| Non-TTCM creator access | No | Yes | Yes |

---

## Pricing

TikTok does not charge per-API-call fees for the TTCM/Organic API. Costs come from:

- **Spark Ad spend**: Paid media budget when boosting creator content
- **Platform fees**: If using a third-party platform (Brandwatch, Captiv8, etc.) that has built on the API
- **Creator compensation**: Negotiated separately between brands and creators through the platform
- **No direct TikTok API fee** for data access (unlike some data APIs)

---

## Capability Map — Summary

```
TikTok Creator Marketplace / TikTok One API
│
├── Creator Discovery
│   ├── Search/filter TTCM-registered creators (~2M pool)
│   ├── First-party metrics: followers, engagement, completion rate
│   ├── Audience demographics (age 18+, gender, country)
│   └── AI-powered matching, open casting calls
│
├── Campaign Management
│   ├── Create orders (up to 10 videos per order)
│   ├── Send invitation links to creators
│   ├── Receive Spark Ads authorization on order acceptance
│   └── Retroactive post linking via campaign code
│
├── Content Tracking
│   ├── Post-level metrics: views, likes, comments, shares, reach, play time
│   ├── Audience analytics per video
│   └── Real-time campaign performance dashboard
│
├── Spark Ads Integration
│   ├── Boost creator posts as Spark Ads (Marketing API)
│   └── Authorization bundled with order workflow
│
└── Webhooks
    ├── Order lifecycle events
    └── Post submission/publication notifications
```

---

## Cheerful Applicability

**High relevance** for Cheerful's influencer outreach workflows:

| Cheerful Workflow | TCM API Relevance |
|------------------|------------------|
| Creator Discovery | High — first-party metrics + AI matching; but limited to 2M TTCM creators, excludes sub-10K |
| Creator Enrichment | Very High — completion rate, retention, demographic data unavailable elsewhere |
| Outreach | Medium — order workflow is structured but requires creators to be TTCM members; can invite non-members |
| Content Tracking | High — order-based tracking is the only compliant method; real-time metrics |
| Campaign Management | High — native campaign brief + order + reporting loop |
| Paid Amplification | Very High — Spark Ads authorization bundled with orders; seamless boost workflow |

**Key constraint**: Cheerful must decide whether to build on the TTCM API (which requires creators to be in the 2M-creator marketplace) or supplement with the Display API / Research API / Apify for the broader long-tail of TikTok creators.

**Recommended integration pattern**: Use TTCM as the "premium" integration for established creators (10K+) while using Display API or Apify scraping for discovery of smaller/non-TTCM creators.
