# Feature 006: Cross-Campaign Creator Performance Index

**One-line pitch:** A proprietary creator scoring system built from every email, opt-in, post, and revenue event in Cheerful — giving brands an irreplaceable intelligence layer that makes every future campaign decision smarter.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** HIGH — The compound stickiness engine: gets exponentially more valuable with every campaign run

---

## Problem It Solves

After running 10 campaigns in Cheerful, a brand team still starts the 11th with the same blank state for creator selection. They have no institutional answer to: "Which creators historically drive the best opt-in rate for us? Which ones negotiate aggressively but underperform? Which are rising — growing fast with small but highly engaged audiences?" This knowledge exists implicitly in past campaign data, but Cheerful provides no surface to access it.

The result: brands re-discover the same top-performing creators campaign by campaign, re-negotiate with the same difficult creators without leverage, and miss emerging creators who would outperform at lower cost.

### Evidence from Research

**Market evidence:**
- Traackr coined "IRM" (Influencer Relationship Management) in 2008 and charges **$25K–$63K+/yr** partly on the basis of its 2.5-year historical creator data depth — the longest in the market
- NeoReach built its **Influencer Media Value (IMV)** as a proprietary branded ROI metric that creates reporting lock-in — clients can't compare campaigns across platforms because the metric is NeoReach-native
- Traackr's **VIT score** (Vitality/Impact/Trust) is a proprietary composite that clients reference in every planning meeting — a branded metric becomes the vocabulary of the team's decision-making
- HypeAuditor's **Performance Score + Audience Score** (35 metrics at 95.5% fraud accuracy) are the reason 68M+ creator profiles are worth $299–$399/mo to SMBs
- CreatorIQ's Creator Graph ingests **123M posts/day** and maintains **10 years of longitudinal data** — this historical depth is their enterprise pricing justification
- **Cross-campaign creator performance scoring** is listed in `analysis/categories/analytics-reporting.md` as gap #7 for Cheerful: "Brands can't answer 'which creators historically drive the best opt-in rates for us?'"

**Why it compounds:**
- Each new campaign adds data points to every creator's score
- After 6 campaigns: basic performance patterns visible
- After 12 campaigns: strong statistical confidence on creator tiers
- After 24+ campaigns: a proprietary creator intelligence layer equivalent to Traackr's 2.5yr depth — at zero marginal cost, because it's built from Cheerful's own operational data

---

## How It Works in Cheerful

### Integration with Existing Spec

**Existing (from spec):**
- `campaign_creator` table: per-campaign records with `status`, `paid_promotion_rate`, `opted_in_at`, `opted_out_at`, `emails_sent_count`, `emails_replied_count`, `last_email_sent_at` — the raw performance data exists per campaign
- `creator_post` table: post engagement metrics, LLM vision quality scores — content performance layer exists
- `email_thread` table: reply/open signals per thread — communication quality data
- `inbox` flags: `wants_paid`, `done`, `follow_up`, `not_interested` — intent signals extracted from threads
- `spec-backend-api.md` §Domain 25 (Dashboard Analytics): per-campaign stats API already returns reply rate, opt-in rate, sent counts — aggregation logic just needs to be extended to per-creator cross-campaign
- LLM metrics extraction (`spec-user-stories.md §US-8.2`): pulls creator engagement rates from email threads to Google Sheets — same extraction can feed the performance index

**What to build:**

**Phase 1 — Creator Performance Score (CPS):**

A weighted composite computed from existing Cheerful data:

```
Creator Performance Score = weighted average of:

1. Opt-in Rate (30%)
   — opted_in_at is not null / emails_sent_count
   — across all campaigns this creator was in

2. Reply Rate (20%)
   — emails_replied_count / emails_sent_count
   — reply speed bonus: replied within 48hrs (+10%)

3. Content Quality (20%)
   — average engagement rate from creator_post records
   — LLM vision analysis quality score (if available)

4. Rate Efficiency (15%)
   — paid_promotion_rate vs. campaign-average rate
   — (lower rate relative to peers with same ER = higher score)
   — rate trend: negotiating lower over time = positive signal

5. Collaboration Reliability (15%)
   — completion rate: campaigns started vs. deliverables submitted
   — ghosting flag: opted-in but never posted = negative signal
   — content submitted on time (vs. late) when deadline tracked
```

Score range: 1–100
Tier labels:
- **90–100**: Elite Creators — invite to every relevant campaign
- **70–89**: Proven Performers — reliable and efficient
- **50–69**: Mixed Signal — watch and re-evaluate
- **30–49**: Underperformers — gifting-only or remove from list
- **1–29**: Inactive/ghosted — archive

**Phase 2 — Creator Discovery Integration:**
1. CPS displayed on creator cards in campaign view — brands immediately see "this creator scored 87 in past campaigns"
2. Discovery filter: "show only creators with CPS 70+" in campaign roster
3. Outreach prioritization: sort un-contacted creators by predicted performance (CPS for known creators; engagement-rate proxy for new)
4. Re-invite workflow: "Would you like to re-invite all creators with CPS 80+ from this campaign?" — one-click add to new campaign

**Phase 3 — Rising Creator Detection:**
1. New `creator.growth_velocity` field: follower count change rate over 90 days
2. Rising Creator filter: "growing >20% / 90 days with ER >3%" — the early-stage creator pool
3. Alert: "5 creators in your roster have grown 30%+ in the past 90 days — consider prioritizing for next campaign"
4. Historical CPS trend: track score change over time per creator — rising performers surfaced proactively

**Phase 4 — Portfolio Intelligence Reports:**
1. Creator Tier Distribution: what percentage of the brand's creator network is Elite/Proven/Mixed/Under
2. Top 10 creators by CPS — the brand's "anchor team"
3. Rate benchmarking: are we overpaying vs. historical rates for the same performance tier?
4. Campaign ROI by creator tier: Elite creators deliver N× ROI vs. Mixed-signal creators
5. Competitor intelligence: if a creator's engagement drops suddenly, they may be over-saturated with brand deals — flag for reduced priority

**API additions:**
- `GET /creators/{id}/performance-score` — current CPS with component breakdown
- `GET /creators/leaderboard` — top performers across all campaigns
- `GET /campaigns/{id}/creator-tiers` — tier distribution for campaign roster
- `GET /portfolio/intelligence` — brand-wide creator analytics dashboard

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 3/5 | Consulted for every campaign planning session and creator selection decision. Less frequent than daily ops tools but used meaningfully for every campaign launch. Monthly for portfolio intelligence reviews. |
| **Integration Depth** | 4/5 | Connects discovery (scored creators surface in search), outreach (prioritized by CPS), campaign management (tier filtering), analytics (portfolio dashboards), payments (rate benchmarking). |
| **Data Accumulation** | 5/5 | This is the most purely compound feature in the platform. Each campaign adds: 1 more data point per creator's CPS. After 24 months, the CPS is statistically validated across potentially hundreds of interactions. This is the influencer marketing equivalent of a credit score — impossible to recreate. |
| **Team Dependency** | 3/5 | Primarily used by ops/marketing lead and CMO level. Less daily dependency vs. outreach or pipeline tools, but highly influential for strategic decisions. |
| **Switching Pain** | 5/5 | Two years of creator performance history, tier assignments, rate benchmarking data, and growth velocity tracking cannot be migrated. A new platform starts blind — with zero creator performance intelligence. The score itself is Cheerful-native and has no portable equivalent. |

**STICKINESS SCORE: 20/25**

---

## Competitive Landscape

| Platform | Creator Scoring | Cross-Campaign History | Proprietary Metric | Rate Benchmarking | Rising Creator Detection |
|----------|----------------|----------------------|---------------------|------------------|--------------------------|
| **Traackr** | ✅ VIT Score | ✅ 2.5yr depth | ✅ VIT | ✅ Fee Recommendation Engine | ⚡ |
| **NeoReach** | ✅ IMV | ✅ | ✅ IMV | ✅ Historical pricing | ✅ "Tomorrow's influencer" |
| **CreatorIQ** | ✅ Creator Graph | ✅ 10yr depth | ✅ BenchmarkIQ | ✅ | ✅ |
| **HypeAuditor** | ✅ 35 metrics | ⚡ Platform-wide | ✅ Audience Score | ❌ | ❌ |
| **Modash** | ❌ | ⚡ Basic | ❌ | ❌ | ❌ |
| **GRIN** | ⚡ per-campaign only | ✅ | ❌ | ❌ | ❌ |
| **Cheerful (current)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cheerful (with feature)** | ✅ CPS | ✅ all-campaign | ✅ Cheerful Performance Score | ✅ rate trend | ✅ growth velocity |

**How Cheerful does it better:**
- CPS is computed from **first-party email interaction data** — Cheerful owns the email layer, so reply quality signals are authentic and non-gameable (competitors using social metrics alone can be fooled by engagement pods)
- Rate efficiency signal is unique: Cheerful has LLM-extracted negotiated rates from email threads — no other platform knows what rate was actually agreed in the conversation (vs. what was listed or guessed)
- Completely built from existing Cheerful operational data — zero external API dependency for Phase 1

---

## Workflow Integration Map

```
Brand finishes Campaign A (10 creators, 3 opted-in, 1 posted)
         │
         ▼ [automatic: end-of-campaign CPS update]
  Each creator's score updated:
  - Opted-in: +opt-in signal
  - Replied quickly: +reply quality signal
  - Content performance: +engagement rate
  - Rate vs. peers: +rate efficiency signal
         │
         ▼ Brand starts Campaign B planning
         │
         ▼ [NEW: CPS in discovery view]
  "Show me fitness creators with CPS 70+ who haven't been contacted in 60 days"
  → returns 12 creators, sorted by score
         │
         ▼ [NEW: re-invite workflow]
  "Re-invite top performers from Campaign A to Campaign B"
  → one-click adds all CPS 80+ creators to new campaign roster
         │
         ▼ [NEW: Cheerful Brain integration]
  "Which 5 creators drove the best results last quarter?"
  → copilot queries CPS index → answers with data, not guesswork
         │
         ▼ Portfolio Intelligence Report (monthly)
  → rate benchmarking: are we overpaying emerging creators?
  → tier distribution: 20% Elite, 45% Proven, 35% Mixed
  → rising creators: 3 accounts in roster grew 40%+ this month
```

Connected workflows:
- **Creator Relationship Intelligence (Feature 004)**: CPS is the quantitative layer; relationship notes are the qualitative layer — together they form the complete creator intelligence profile
- **Revenue Attribution (Feature 003)**: revenue data elevates CPS accuracy — rate efficiency can be computed against actual revenue generated, not just engagement metrics
- **Cheerful Brain (Feature 002)**: CPS makes the copilot's creator recommendations data-driven and defensible
- **Creator Payment Hub (Feature 001)**: rate benchmarking from CPS protects brands from overpaying; payment history feeds the rate efficiency signal

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 003 (Revenue Attribution)**: Revenue per creator becomes the ground truth for CPS — "this creator drove $8K in sales at $1K cost" is far more actionable than "this creator has 4% ER." CPS + revenue attribution together create a creator ROI engine.
2. **Feature 004 (Creator Relationship Intelligence Hub)**: The performance index (quantitative) + relationship history (qualitative) together form the most comprehensive creator intelligence profile available to mid-market brands.
3. **Feature 002 (Cheerful Brain)**: Every query the copilot answers about creator quality or selection is made 10× more useful when backed by real CPS data. "I recommend these 5 creators because they scored 85+, opted-in on all 3 previous campaigns, and generated the highest revenue per dollar spent" is copilot-as-trusted-advisor.

**Built vs. Enhanced:**
- CPS computation engine: **Build** (new computed field or materialized view on existing `campaign_creator` data — no schema changes for Phase 1)
- CPS display in discovery: **Enhance** (add score field to existing creator card components)
- Rising creator detection: **Enhance** (add `growth_velocity` computation to `creator` table; existing follower tracking may need cadenced snapshots)
- Portfolio intelligence reports: **Build** (new dashboard section)
- Re-invite workflow: **Enhance** existing campaign roster UI with CPS-based filtering

---

*Sources: `analysis/categories/analytics-reporting.md` · `analysis/categories/outreach-crm.md` · `analysis/competitors/traackr.md` · `analysis/competitors/neoreach.md` · `analysis/competitors/hypeauditor.md` · `analysis/competitors/creatoriq.md` · `analysis/synthesis/competitor-matrix.md` §6*
