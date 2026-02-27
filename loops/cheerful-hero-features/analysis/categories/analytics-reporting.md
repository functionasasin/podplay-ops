# Feature Category: Analytics & Reporting
**Wave:** 1 — Feature Category Research
**Date:** 2026-02-27
**Sources:** dataslayer.ai, thecirqle.com, archive.com, influenceflow.io, improvado.io, impact.com, g2.com, meltwater.com, influencermarketinghub.com, zigpoll.com, digitalapplied.com

---

## Market Overview

Analytics and reporting is the category where the influencer marketing software market has the widest maturity gap — nearly every platform has it, but **most ship vanity metrics when clients need revenue attribution**. As of 2025–2026, 82% of brands now prioritize ROI tracking over follower counts (Influencer Marketing Hub 2025), yet G2 reviews consistently cite "poor reporting" and "limited analytics" as top complaints even on premium platforms.

The market is splitting into two camps:
1. **Vanity-metric dashboards** — engagement rate, reach, impressions, follower growth. Fast to build, low stickiness because the data can be pulled manually from native platform insights.
2. **Revenue-attribution engines** — multi-touch conversion tracking, ROAS, CAC, LTV per creator. Expensive to build properly, extremely sticky because it requires platform-level integration with e-commerce and ad systems.

Companies that invest in the second camp see 23% higher ROI than those using siloed reporting (McKinsey 2024 Marketing Analytics Report). The average influencer marketing ROI is $5.20 for every $1 spent, rising to $18–20 for the best-tracked campaigns — tracking quality is the differentiator.

### What the Market Offers

**1. Unified Cross-Platform Dashboards**
Every Tier 1 platform (CreatorIQ, Traackr, Sprout Social, Meltwater) aggregates data from Instagram, TikTok, YouTube, and emerging channels into a single dashboard. This eliminates the "tab-hopping" problem where teams must manually reconcile metrics from each platform's native analytics.

- **Meltwater**: AI analyzes influencer post performance alongside audience sentiment; aggregates creator posts into a single dashboard replacing manual spreadsheets.
- **Improvado**: Automates integration of data from 500+ sources into a data warehouse — enables scalable, unified reporting across 500+ platforms.
- **Traackr**: Cross-campaign benchmarking across 70+ countries; brings together discovery, outreach, campaign tracking, reporting, and competitive benchmarking in one view.

**2. Multi-Touch Attribution & Conversion Tracking**
The most contested capability as of 2025. Attribution conflicts occur in 35% of conversions when campaigns run simultaneously across multiple platforms (Empathy First Media 2025 ROI study).

- **impact.com**: Best-in-class for multi-touch attribution; 88% of users say it ties social activity to business results (G2); deep CRM integration with Salesforce and Marketo for lead-to-revenue attribution.
- **CreatorIQ**: AI-driven multi-touch attribution with predictive campaign modeling; direct integration with e-commerce platforms tracks sales, conversions, and customer lifetime value per influencer.
- **GRIN**: Native Shopify integration for revenue attribution per creator; tracks which creators drive actual purchases, not just clicks.
- **Triple Whale**: MMM + multi-touch attribution for e-commerce; Total Impact Attribution pairs with post-purchase surveys to capture influence that traditional tracking misses.
- **Upfluence**: Automated UTM tracking generates unique tracking links per influencer automatically; monitors clicks, conversions, and revenue attribution without manual builders.

Attribution models available on leading platforms:
- Linear (credit distributed equally across all touchpoints)
- Time-decay (more credit to touchpoints near conversion)
- First-touch / Last-touch
- U-shaped (40% first, 40% last, 20% middle) — considered most balanced for influencer marketing
- Custom model building (enterprise tier only)

**3. Creator-Level Performance Scoring**
- **HypeAuditor**: 35 audience quality metrics; proprietary Performance Score (forecasts conversion ability based on historical behavior) + Audience Score (measures authenticity, engagement quality, content alignment).
- **Traackr**: Proprietary VIT (Vitality, Influence, Trust) scoring per creator.
- **impulze.ai**: Tracks per-creator ROI, cost-per-click, and content performance in real-time.
- Standard expectation from brands: able to rank creators within a campaign by conversion contribution (not just engagement) and know which to reinvite.

**4. Shareable / White-Label Client Reports**
- **HypeAuditor**: White-label reporting for professional client presentations — agencies can send branded PDF reports.
- **impulze.ai**: White-label report exports for agencies.
- **Modash**: Exportable reports per creator and campaign.
- Standard: Agencies expect to send clients weekly/monthly reports without manual Google Slides work.

**5. Real-Time Monitoring & Anomaly Alerts**
Leading brands in 2025 use hybrid real-time + periodic reporting:
- Real-time alerts for critical metrics (sudden CTR drops, budget overages, engagement drops >30%)
- Daily/weekly summary dashboards for strategic decisions
- Some platforms (Meltwater) use AI to identify *why* something changed, not just *that* it changed.

**6. Earned Media Value (EMV)**
EMV is used by 83% of respondents as a solid ROI representation when traditional attribution is difficult (Influencer Marketing Hub 2025). Most mid-market and enterprise platforms calculate EMV automatically and include it in campaign summaries.

**7. Competitive Benchmarking / Share-of-Voice**
- **Traackr**: Share-of-voice analytics — shows what percentage of category conversations your brand creators are driving vs. competitors.
- **CreatorIQ**: Competitive intelligence features track competitor influencer strategies.
- **Brandwatch**: Consumer intelligence suite with influencer performance benchmarked against category norms.

---

## Cheerful Current State

**Sources:** `spec-backend-api.md` §Domain 25, `spec-user-stories.md` §Epic 8, `spec-integrations.md` §Google Sheets + PostHog, `spec-data-model.md` §creator_post table

### What Cheerful Has Today

**Dashboard Analytics** (`GET /dashboard/analytics`):
- Campaign counts by status (active, paused, draft, completed)
- Opt-in stats: total opted-in, opted-out, new, contacts, opt-in rate
- Recent opt-ins list (creator name, campaign, timestamp)
- Per-campaign stats: sent, replied, opted-in, reply rate
- Email stats: sent, opened, replied (aggregate)
- Follow-up stats: scheduled, sent
- Gifting pipeline: pending orders, shipped
- Paid promotion pipeline: pending contracts, active

**Google Sheets Auto-Reporting** (US-8.2, `spec-integrations.md` §Google Sheets):
- LLM extracts creator metrics from email thread content (follower count, engagement rate, niche, post URLs, etc.)
- Written to client-configured Google Sheet as replies arrive — no manual data entry
- Single-threaded task queue prevents write contention across simultaneous campaigns
- Bidirectional: also reads Sheets for bulk creator import

**Post Tracking** (`spec-data-model.md` §creator_post):
- Monitors Instagram/social posts from opted-in creators for 90 days post-opt-in
- Stores post data: caption, media URL, likes, comments, caption match score, LLM vision analysis
- Used to verify gifting campaign ROI without manually checking Instagram profiles (US-7.2)

**Client Performance Summary** (US-8.3):
- User can generate a shareable campaign performance summary for brand clients
- Selectable which metrics to include/exclude
- Formatted for external sharing (no manual report formatting)

**Langfuse LLM Observability** (US-8.5):
- Tracks model, input/output tokens, latency per generation
- For internal debugging and product analytics — not client-facing

**PostHog Product Analytics** (US-8.6):
- Session recording, feature flags (A/B testing), event tracking
- HogQL queries accessible from Slack (US-12.3) for ad-hoc analytics

### Cheerful's Strengths in This Category

- **Real-time inbox-level metrics**: Because Cheerful is the inbox, it has first-party email open/reply data that competitors who rely on third-party email tools cannot access.
- **LLM metrics extraction**: Auto-extraction of creator metrics from email threads is genuinely novel — most platforms require creators to self-report or manual entry.
- **Google Sheets integration depth**: The service-account approach with single-thread write isolation is production-grade and solves a real workflow pain point.

---

## Feature Gaps

### Critical Gaps

1. **No conversion/revenue attribution** — Cheerful tracks opt-ins and email replies but has zero visibility into downstream purchases, conversions, or ROAS. No UTM link generation, no promo code creation, no pixel/webhook for e-commerce conversion events. Competitors like GRIN, impact.com, and Upfluence have deep Shopify/WooCommerce integrations that close this loop.

2. **No native social API metrics pull** — Post tracking detects posts via caption matching but doesn't pull reach, impressions, story views, or engagement data directly from creator's Instagram/TikTok/YouTube Insights API. Competitors like CreatorIQ, Modash, and HypeAuditor pull this data automatically from platform APIs with creator permission.

3. **No Earned Media Value (EMV) calculation** — Not calculated anywhere in the spec. Would require social API data (impression value × average CPM for organic content). Used by 83% of brands as ROI metric when direct attribution is unavailable.

4. **No competitive benchmarking** — No share-of-voice, no "how does my campaign performance compare to category norms," no competitor tracking. Traackr and CreatorIQ charge significant premiums for this.

5. **No automated UTM/tracking link generation** — Users must manually create UTM links in Google Analytics or similar. Upfluence does this automatically per influencer.

6. **No white-label / branded PDF reports** — Client Performance Summary (US-8.3) exists but appears to be in-app only; no branded export for agency clients. HypeAuditor and impulze.ai offer this as a core agency workflow.

7. **No creator performance scoring across campaigns** — Cheerful has per-campaign stats but no cross-campaign creator performance index. Brands can't easily answer "which creators historically drive the best opt-in rates for us?"

### Secondary Gaps

8. **No real-time anomaly alerts** — No alerts for engagement drops, unusual response patterns, or budget pacing issues.
9. **No multi-touch attribution model** — Even the basic UTM-based attribution is absent.
10. **No report scheduling / automated delivery** — No "send this report to client every Monday" automation.
11. **No Airtable/Notion export** (`spec-integrations.md` §alternatives) — Only Google Sheets; many agencies use Airtable as their client reporting layer.

---

## Workflow Integration Potential

Analytics and reporting is **moderately sticky but extremely leverage-multiplying** for other sticky features:

- **Conversion data creates a flywheel**: If Cheerful can show which creators drove actual revenue (vs. just opt-ins), every future discovery, outreach, and campaign decision becomes data-driven within Cheerful. This locks in the entire workflow.
- **Client reporting embeds Cheerful into the agency's client relationships**: When clients expect weekly Cheerful-generated reports, the agency cannot switch platforms without breaking client workflows.
- **Creator performance scores across campaigns** create irreplaceable institutional knowledge — years of creator performance data that cannot be migrated.
- **Real-time monitoring** drives daily logins, which increases habit formation and switching friction.

---

## Top 3 Hero Feature Candidates

### 1. Per-Creator Revenue Attribution (UTM + Promo Code + Shopify)
**Pitch:** "Know which creators drive revenue, not just replies."
**Why it's sticky:** Conversion data accumulates over every campaign. After 6 months, Cheerful knows which creators drive Cheerful-platform customers' revenue — irreplaceable data that can't be migrated.
**Gap it fills:** Cheerful tracks opt-ins. The missing link is: "Did this creator's audience actually buy?"
**Stickiness potential:** Very high — combines data accumulation with e-commerce workflow dependency.

### 2. Cross-Campaign Creator Performance Index
**Pitch:** "Your creator network, scored by actual performance across every campaign you've run."
**Why it's sticky:** Each campaign adds data to a creator's performance score. After 12 months, a brand has a proprietary creator ranking system they could not recreate elsewhere. This is the influencer marketing equivalent of a CRM "health score."
**Gap it fills:** Cheerful has per-campaign stats; no cross-campaign creator intelligence.
**Stickiness potential:** Very high — irreplaceable data accumulation.

### 3. Automated White-Label Agency Reports
**Pitch:** "Send your clients a beautiful branded report every Monday — automatically."
**Why it's sticky:** Once clients expect and rely on Cheerful-branded reports, the agency cannot switch platforms without disrupting their client reporting workflow. Client-facing visibility creates external accountability.
**Gap it fills:** Manual report creation is a weekly pain point; competitors (HypeAuditor, impulze.ai) offer this as a key differentiator.
**Stickiness potential:** High — team and client dependency, workflow dependency.
