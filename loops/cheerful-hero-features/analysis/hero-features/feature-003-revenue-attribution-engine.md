# Feature 003: Revenue Attribution Engine

**One-line pitch:** Know which creators drive revenue — not just replies — with per-creator UTM tracking, auto-generated promo codes, and real-time Shopify order attribution.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** CRITICAL — Without this, Cheerful cannot justify its own spend to 82% of brands

---

## Problem It Solves

Cheerful tracks opt-ins and email replies. The critical missing link is: **did this creator's audience actually buy?** Without revenue attribution, every Cheerful campaign report ends with "opt-in rate" — the influencer marketing equivalent of reporting on "clicks" in an era when every brand demands ROAS.

In 2026, 82% of brands prioritize ROI tracking over follower counts (Influencer Marketing Hub 2025). The average campaign ROI is $5.20 per $1 invested — but the best-tracked campaigns reach $18–20. The difference is attribution quality. Cheerful currently cannot produce a single revenue attribution number for any campaign.

### Evidence from Research

**Market demand:**
- **82% of brands** now prioritize ROI tracking above follower counts ([Influencer Marketing Hub 2025](https://influencermarketinghub.com))
- Average influencer marketing ROI: **$5.20 per $1 spent**; best-tracked campaigns: **$18–20** — attribution quality is the differentiator
- **79% of marketers** cite determining ROI as their biggest challenge; only 20% track CAC, 18% measure AOV (Wave 2b market-trends.md)
- Performance-based compensation is the #1 model at **53% of brands** — this model requires attribution to calculate commissions ([impact.com, 2025](https://impact.com/influencer/influencer-marketing-trends-performance/))
- Attribution conflicts occur in **35% of conversions** when campaigns run simultaneously across multiple platforms — a unified platform eliminates this

**Specific campaign evidence:**
- Tentree campaign (Wave 2b case studies): **13× ROI** specifically attributed to affiliate promo code tracking
- Blueland (Wave 2b): **13× ROI** from 211 micro-influencers — only quantifiable because each creator had unique promo code
- MVMT: 100K+ referral conversions tracked via unique affiliate links per creator
- Without promo code / UTM / Shopify integration, these numbers are invisible

**Competitor coverage:**
- GRIN: Native Shopify integration, per-creator revenue attribution, promo code tracking, returns auto-deduction
- Upfluence: Auto-generates unique UTM links per influencer; monitors clicks, conversions, revenue attribution
- Impact.com: Best-in-class multi-touch attribution (cookieless, click → sale → LTV, return auto-deduction)
- Later/Mavely: One-click affiliate links via 9 affiliate networks, automated commissions
- Modash: Shopify attribution, promo codes — `analysis/competitors/modash.md`

---

## How It Works in Cheerful

### Integration with Existing Spec

**Existing (from spec):**
- `spec-integrations.md`: GoAffPro / Shopify integration already connected — currently used for gifting order fulfillment only; revenue attribution not built
- `campaign_creator` table already has `paid_promotion_rate`, `paid_promotion_type`, `paid_promotion_status` fields
- `creator_post` table stores post URLs and engagement metrics — needs attribution data added
- `spec-data-model.md`: `campaign` table has `type` (gifting vs. paid) — revenue attribution applies to both
- `spec-backend-api.md` §Domain 14: creator management endpoints already exist for linking creators to campaigns
- `spec-user-stories.md` §US-8.2: LLM metrics extraction to Google Sheets already pulls some creator metrics from email — promo code and UTM data could be added

**What to build:**

**Phase 1 — UTM Link Generation:**
1. Per-creator unique UTM link auto-generated at campaign launch: `utm_source=cheerful&utm_medium=influencer&utm_campaign={campaign_slug}&utm_content={creator_handle}`
2. Links stored in `campaign_creator` table (new `tracking_url` column)
3. Injected into outreach email drafts automatically (AI prompt updated to include unique link)
4. UTM click data pulled via **Google Analytics 4 API** or direct webhook from Shopify

**Phase 2 — Promo Code Engine:**
1. Per-creator unique promo code auto-generated (e.g., `SARAH15`, `MIKE20`) — stored in `campaign_creator.promo_code`
2. Promo codes synced to Shopify via **Shopify Admin API** (`/discounts` endpoint) — one API call per creator, no manual setup
3. Promo code usage → order data returned via Shopify webhook (`orders/paid` event)
4. Revenue, order count, AOV, and return rate stored per creator in `campaign_creator` (new attribution columns: `orders`, `revenue`, `aov`, `return_rate`, `net_revenue`)

**Phase 3 — Shopify Revenue Attribution Dashboard:**
1. Per-creator revenue view: orders, revenue, AOV, return rate, net revenue — alongside existing opt-in/reply metrics
2. Per-campaign aggregate: total revenue, attributed ROAS, top revenue-driving creators
3. Creator ROI calculation: `net_revenue / (paid_promotion_rate + product_cost)` → per-creator ROI ratio
4. "Revenue leaderboard" within campaigns: rank creators by net revenue contribution

**Phase 4 — Hybrid Commission Calculation:**
1. Flat fee + affiliate commission ledger: `base_rate + (revenue × commission_rate)` calculated per creator per campaign
2. Commission payout trigger: when `PAID` status triggered in Feature 001, calculate total owed = flat fee + earned commissions
3. Commission tracking for gifting campaigns: product cost + shipping as base, affiliate commission on top

**API additions:**
- `POST /campaigns/{id}/creators/{id}/promo-code` — generate + sync promo code to Shopify
- `POST /campaigns/{id}/creators/{id}/tracking-url` — generate UTM link
- `GET /campaigns/{id}/attribution` — revenue dashboard for campaign
- `GET /campaigns/{id}/creators/{id}/attribution` — per-creator revenue breakdown
- Shopify webhook handler: `orders/paid` → match promo code → update `campaign_creator` attribution fields

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 4/5 | Revenue dashboard consulted for every active campaign check-in. Weekly for optimization, daily for high-volume campaigns. Not quite 5/5 because attribution is per-campaign, not a daily micro-action. |
| **Integration Depth** | 5/5 | Connects Shopify, Google Analytics, campaign management, creator profiles, payment calculations (Feature 001), performance index (Feature 006), and analytics reporting. 6+ workflow connections. |
| **Data Accumulation** | 5/5 | Attribution data compounds continuously. After 6 months: which creators drive highest LTV customers (not just first purchase), seasonal performance patterns, creator tier → revenue correlation. After 2 years: irreplaceable competitive intelligence — this brand's influencer ROI data is uniquely theirs. |
| **Team Dependency** | 4/5 | Marketing ops (daily), CMO/brand lead (weekly report), finance (commission calculations), brand client (ROI justification). 4+ stakeholders depending on this data. |
| **Switching Pain** | 5/5 | Years of creator performance + revenue attribution data cannot be migrated. New platform starts with zero historical conversion context. Promo code history, UTM data, and per-creator LTV calculations are locked in Cheerful's data model. |

**STICKINESS SCORE: 23/25**

---

## Competitive Landscape

| Platform | UTM Links | Promo Codes | Shopify Attribution | Returns Deduction | Per-Creator ROI |
|----------|-----------|-------------|--------------------|--------------------|----------------|
| **GRIN** | ✅ | ✅ | ✅ Native | ✅ Auto | ✅ Full |
| **Upfluence** | ✅ Auto | ✅ | ✅ Native | ⚡ Partial | ✅ Full |
| **Impact.com** | ✅ | ✅ | ✅ Cookieless | ✅ Auto | ✅ Full |
| **Later/Mavely** | ✅ | ✅ via 9 networks | ✅ | ✅ | ✅ |
| **Modash** | ✅ | ✅ | ✅ Shopify-only | ❌ | ⚡ Basic |
| **Cheerful (current)** | ❌ | ❌ | ❌ GoAffPro shallow | ❌ | ❌ |
| **Cheerful (with this feature)** | ✅ Auto | ✅ Shopify-synced | ✅ Real-time | ✅ Net revenue | ✅ Per-creator ROI |

**How Cheerful does it better:**
- Promo codes auto-generated AND auto-synced to Shopify at campaign creation — competitors require manual Shopify admin work
- Attribution feeds directly into commission calculation (Feature 001 integration) — no separate payment tool needed
- Revenue data informs the Creator Performance Index (Feature 006) — attribution quality compounds with each campaign
- No mandatory 12-month contract to get access (GRIN, Upfluence, Later all require annual commitment)

---

## Workflow Integration Map

```
Campaign launch (wizard step)
         │
         ▼ [NEW: auto-generate]
  Unique UTM link + promo code per creator
         │ (stored in campaign_creator table)
         ▼ [enhanced: email draft injection]
  Outreach email includes creator's unique tracking link + discount code
         │
         ▼ Creator posts → audience clicks link / uses code
         │
         ▼ Shopify webhook: orders/paid
         │
         ▼ [NEW: attribution engine]
  Orders matched → revenue, AOV, returns computed per creator
         │
         ├──► Attribution dashboard (real-time revenue per creator)
         ├──► Commission ledger (flat fee + earned affiliate commission)
         └──► Creator Performance Index update (Feature 006)
         │
         ▼ Campaign end
  Per-creator ROI report → auto-exported to Google Sheets (existing integration)
         │
         ▼ [Feature 001 integration]
  Commission payout calculated → payment initiated via Creator Payment Hub
```

Connected workflows:
- **Outreach**: unique links injected into AI-drafted emails automatically
- **Analytics/Reporting**: revenue attribution replaces vanity metrics in dashboard
- **Payments (Feature 001)**: commission ledger → payment trigger
- **Creator Performance Index (Feature 006)**: revenue-per-creator feeds creator scoring

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 001 (Creator Payment Hub)**: Attribution + payments together close the complete performance-based compensation loop: "creator posts → revenue attributed → commission calculated → payment sent" — all in Cheerful.
2. **Feature 006 (Creator Performance Index)**: Revenue data is the most important signal in creator scoring. "Who drove $X in revenue across all campaigns" becomes a native Cheerful query.
3. **Feature 002 (Cheerful Brain)**: Copilot can answer "Which 5 creators drove the most revenue last quarter?" with real data, making the copilot's intelligence meaningfully better.

**Built vs. Enhanced:**
- UTM link generation: **Build** (new endpoint + UI element in campaign creator table)
- Promo code generation + Shopify sync: **Enhance** existing GoAffPro/Shopify integration to create discount codes via Shopify Admin API
- Attribution tracking: **Build** new webhook handler + attribution columns in `campaign_creator`
- Revenue dashboard: **Build** (new UI component in campaign view)
- Commission calculation: **Build** (formula engine on top of `paid_promotion_rate` + revenue)

---

*Sources: `analysis/categories/analytics-reporting.md` · `analysis/categories/payments-contracts.md` · `analysis/campaigns/market-trends.md` §Trend 1 · `analysis/campaigns/campaign-case-studies.md` · `analysis/competitors/grin.md` · `analysis/competitors/upfluence.md` · `analysis/competitors/impact-com.md` · `analysis/competitors/later-influence.md` · `analysis/synthesis/competitor-matrix.md` §6*
