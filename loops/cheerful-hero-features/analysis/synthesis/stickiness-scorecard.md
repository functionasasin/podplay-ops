# Stickiness Scorecard — Cheerful Hero Features

**Wave:** 3 — Synthesis
**Date:** 2026-02-28
**Status:** Complete — All 6 hero features scored and ranked

---

## Scoring Framework

Each feature is scored across 5 dimensions (1–5 each), maximum total 25:

| Dimension | 1 (Low) | 5 (High) |
|-----------|---------|----------|
| **Workflow Frequency** | Used monthly | Used multiple times daily |
| **Integration Depth** | Standalone feature | Connects 5+ tools/workflows |
| **Data Accumulation** | Stateless | Builds irreplaceable data over time |
| **Team Dependency** | One person uses it | Entire team relies on it |
| **Switching Pain** | Easy to recreate | Months of work to migrate |

---

## Master Rankings

| Rank | Feature | Score | Priority | Build Complexity |
|------|---------|-------|----------|-----------------|
| 🥇 1 | [Feature 001: Creator Payment Hub](#feature-001-creator-payment-hub) | **24/25** | CRITICAL | High (API integrations) |
| 🥈 2 | [Feature 002: Agentic Campaign Copilot](#feature-002-agentic-campaign-copilot-cheerful-brain) | **23/25** | CRITICAL | Medium (surface area) |
| 🥈 2 | [Feature 003: Revenue Attribution Engine](#feature-003-revenue-attribution-engine) | **23/25** | CRITICAL | Medium (Shopify extension) |
| 4 | [Feature 004: Creator Relationship Intelligence Hub](#feature-004-creator-relationship-intelligence-hub) | **22/25** | HIGH | Low (aggregation of existing data) |
| 5 | [Feature 005: Always-On UGC Capture + Content Approval Hub](#feature-005-always-on-ugc-capture--content-approval-hub) | **21/25** | HIGH | Medium (workflow extension) |
| 6 | [Feature 006: Cross-Campaign Creator Performance Index](#feature-006-cross-campaign-creator-performance-index) | **20/25** | HIGH | Low (computed from existing data) |

**Total stickiness potential if all 6 features ship: 133/150 (89%)**

---

## Dimension Heat Map

| Feature | Freq | Integration | Data | Team | Pain | **Total** |
|---------|------|-------------|------|------|------|-----------|
| 001 Creator Payment Hub | 4 | **5** | **5** | **5** | **5** | **24** |
| 002 Cheerful Brain | **5** | **5** | **5** | 4 | 4 | **23** |
| 003 Revenue Attribution | 4 | **5** | **5** | 4 | **5** | **23** |
| 004 Relationship Intel Hub | **5** | 4 | **5** | 4 | 4 | **22** |
| 005 UGC Capture + Hub | 4 | 4 | **5** | 4 | 4 | **21** |
| 006 Performance Index | 3 | 4 | **5** | 3 | **5** | **20** |
| **Column Total** | **25** | **27** | **30** | **24** | **27** | **133** |

**Data Accumulation scores 5/5 across ALL 6 features** — the defining characteristic of Cheerful's stickiness strategy. Every feature builds irreplaceable institutional data over time.

---

## Feature-by-Feature Breakdown

---

### Feature 001: Creator Payment Hub

> **Native creator payment disbursement with automated tax compliance — making Cheerful the payroll system for every influencer program.**

**STICKINESS SCORE: 24/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 4/5 | Every paid deal requires contract generation + payment disbursement. Active programs trigger multiple times per week. |
| Integration Depth | 5/5 | Connects campaigns, contracts, creators, finance approvals, tax compliance, payment rails, deliverables gate — 6+ workflows. |
| Data Accumulation | 5/5 | Financial audit trail + tax records are legally required records. After 2 years: reconstructing IRS-filed 1099s, payment history, contract archives is functionally impossible. Negotiated rate history becomes irreplaceable pricing intelligence. |
| Team Dependency | 5/5 | Ops (campaign), finance (approval), legal (contracts) — three departments creates maximum stickiness. |
| Switching Pain | 5/5 | Payment volume creates financial lock-in deeper than any feature. Tax records + audit trails legally required to preserve. Rate history + contract templates = years of institutional IP. |

**Why this is the #1 hero feature:**
- Covers the single most universal pain point: **every** paid influencer program needs contracts and payments
- The gap is covered by every mid-market competitor; Cheerful's current absence is the platform's most critical vulnerability
- Once payment volume flows through Cheerful, switching cost is measured in months of payment history reconstruction, IRS filings, and legal documentation

**Competitive gap:** Absent from Cheerful today. Present in GRIN, Modash, Upfluence, Aspire, Aspire, CreatorIQ, Traackr.

**Quick win:** Phase 1 (contract generation via DocuSign API integration) alone creates a stickiness upgrade at 3/5 pain vs. 5/5 for the full payment layer.

---

### Feature 002: Agentic Campaign Copilot ("Cheerful Brain")

> **The first influencer platform where you say "launch outreach to 50 fitness creators in NYC under 100K followers" and it executes — autonomously, from your own Gmail.**

**STICKINESS SCORE: 23/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 5/5 | Daily or multiple-times-daily. Campaign monitoring, quick status queries, batch operations — becomes the primary interface for all campaign work. |
| Integration Depth | 5/5 | Connects discovery, outreach, campaign management, analytics, team collaboration, payments — the coordination layer across every other workflow. |
| Data Accumulation | 5/5 | Brand voice learning accumulates over every interaction. After 12 months, the copilot knows this brand's influencer strategy better than any new platform ever could. |
| Team Dependency | 4/5 | Ops manager (daily), brand manager (reporting), eventually full team. Requires habit formation time but creates deep dependency. |
| Switching Pain | 4/5 | Accumulated brand voice preferences + historical context + workflow automation rules cannot be migrated. New platform starts with zero institutional memory. |

**Why this is #2:**
- Highest workflow frequency of any feature (5/5) — becomes the daily operating interface
- Cheerful's architecture (Temporal + Claude + MCP) is categorically more powerful than GRIN Gia or Upfluence Jace
- Low build complexity: primarily a surface-area change exposing already-built infrastructure

**Competitive gap:** GRIN Gia, Upfluence Jace, Linqia Marco are live. Cheerful has no user-facing answer.

**Architectural moat:** Temporal-backed execution durability + Gmail-native delivery is a concrete differentiation no competitor can easily replicate.

---

### Feature 003: Revenue Attribution Engine

> **Know which creators drive revenue — not just replies — with per-creator UTM tracking, auto-generated promo codes, and real-time Shopify order attribution.**

**STICKINESS SCORE: 23/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 4/5 | Revenue dashboard consulted for every active campaign check-in. Weekly for optimization, daily for high-volume campaigns. |
| Integration Depth | 5/5 | Connects Shopify, Google Analytics, campaign management, creator profiles, payment calculations (Feature 001), performance index (Feature 006) — 6+ connections. |
| Data Accumulation | 5/5 | Attribution data compounds continuously. After 6 months: which creators drive highest LTV customers, seasonal performance patterns. After 2 years: irreplaceable competitive intelligence. |
| Team Dependency | 4/5 | Marketing ops (daily), CMO (weekly report), finance (commission calculations), brand client (ROI justification) — 4+ stakeholders. |
| Switching Pain | 5/5 | Years of creator performance + revenue attribution data cannot be migrated. Per-creator LTV calculations are locked in Cheerful's data model. |

**Why this ties for #2:**
- 82% of brands now prioritize ROI tracking above follower counts — this is table stakes, not a differentiator
- Cheerful's existing GoAffPro/Shopify integration already provides the foundation — this is an extension, not a build
- Directly unlocks the performance-based compensation model (53% of brands) that requires attribution to calculate commissions

**Competitive gap:** Absent from Cheerful today. Present in GRIN, Upfluence, Impact.com, Later/Mavely, Modash.

---

### Feature 004: Creator Relationship Intelligence Hub

> **A living, cross-campaign CRM for every creator — relationship history, negotiation patterns, pipeline view, and performance context in one place that compounds with every email you send.**

**STICKINESS SCORE: 22/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 5/5 | Every email sent, every creator decision, every campaign launch consults or updates the creator profile. The pipeline kanban becomes the daily ops dashboard. |
| Integration Depth | 4/5 | Connects outreach, campaign management, analytics, payments, content performance — 5 core workflows. |
| Data Accumulation | 5/5 | Relationship history per creator is the ultimate irreplaceable asset. Each campaign adds negotiated rates, content performance, communication patterns, and relationship health data. After 2 years: proprietary intelligence on hundreds of creator relationships. |
| Team Dependency | 4/5 | All campaign team members depend on shared relationship view. Thread assignment and internal notes become daily coordination tools. |
| Switching Pain | 4/5 | Relationship history, rate trends, custom tags, internal notes cannot be migrated. Years of institutional memory stays in Cheerful. |

**Why this is #4:**
- Highest workflow frequency (5/5) tied with Cheerful Brain — this is the daily operational hub
- Mostly built from existing data (no new schema needed for Phase 1) — highest ROI build
- Converts Cheerful from a campaign tool into the operating system for creator relationships

**Build advantage:** Phase 1 (unified creator profile) is entirely an aggregation layer on existing `campaign_creator` + `email_thread` data — no new data collection required.

---

### Feature 005: Always-On UGC Capture + Content Approval Hub

> **Auto-capture every post where a creator tags your brand — with or without an active campaign — then route the best content through a pre-publication approval workflow and into a licensed UGC library.**

**STICKINESS SCORE: 21/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 4/5 | Content library browsed weekly by creative teams. Approval queue for active campaigns checked multiple times per week. Brand mention monitoring generates daily notifications for high-volume brands. |
| Integration Depth | 4/5 | Connects brand monitoring, campaign management, creator profiles, contracts/rights (Feature 001), paid ad platforms — 5+ workflow connections. |
| Data Accumulation | 5/5 | UGC library grows with every post ever captured. Usage rights history, content performance archive, brand mention dataset all irreplaceable. The brand's complete creator content library lives in Cheerful. |
| Team Dependency | 4/5 | Creative (UGC repurposing), legal (rights + approval audit trail), ops (approval workflow), brand client (content review) — multiple departments. |
| Switching Pain | 4/5 | UGC library with rights management history = irreplaceable licensed content asset. Approval audit trail = legal compliance record. Cannot be meaningfully exported. |

**Why this is #5:**
- Archive grew to 50,000+ brands on zero-signup capture alone — this is a proven standalone business
- +133% YoY UGC campaign growth makes this an accelerating market need
- Foundation (`creator_post` table + Supabase Storage) already exists in Cheerful — extending, not rebuilding

**Differentiation opportunity:** TikTok Spark Code hub is a gap that Archive owns alone. Shipping it before Archive adds approval workflows would capture a unique position.

---

### Feature 006: Cross-Campaign Creator Performance Index

> **A proprietary creator scoring system built from every email, opt-in, post, and revenue event in Cheerful — giving brands an irreplaceable intelligence layer that makes every future campaign decision smarter.**

**STICKINESS SCORE: 20/25**

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Workflow Frequency | 3/5 | Consulted for every campaign planning session and creator selection decision. Less frequent than daily ops tools. Monthly for portfolio intelligence reviews. |
| Integration Depth | 4/5 | Connects discovery (scored creators in search), outreach (prioritized by CPS), campaign management (tier filtering), analytics (portfolio dashboards), payments (rate benchmarking). |
| Data Accumulation | 5/5 | The most purely compound feature in the platform. Each campaign adds one more data point per creator's CPS. After 24 months, CPS is statistically validated across potentially hundreds of interactions — equivalent to Traackr's 2.5yr depth. |
| Team Dependency | 3/5 | Primarily ops/marketing lead and CMO. Less daily dependency vs. outreach or pipeline tools, but highly influential for strategic decisions. |
| Switching Pain | 5/5 | Two years of creator performance history, tier assignments, rate benchmarking, and growth velocity tracking cannot be migrated. A new platform starts blind — the score itself is Cheerful-native. |

**Why this is #6 but still essential:**
- Lowest workflow frequency (3/5) — not a daily tool, but a compound intelligence layer
- Highest compound stickiness over time: after 24 months, CPS is equivalent to Traackr's $25–63K/yr primary differentiator
- Completely built from existing data — zero external API dependency for Phase 1; pure software value creation

**Compounding economics:** The CPS becomes more valuable with every campaign run. The marginal cost is zero; the marginal stickiness value increases indefinitely.

---

## Cross-Feature Compound Stickiness

Features that are most powerful when combined:

### The Revenue Loop (Features 001 + 003 + 006)

```
Creator runs campaign → Revenue attributed (003)
→ Commission calculated → Payment sent (001)
→ Rate efficiency score updated (006)
→ Next campaign: CPS used to prioritize high-ROI creators
→ Rate benchmarked against historical rates (001 + 006)
```

**Combined stickiness:** Financial audit trail + attribution history + creator intelligence = **impossible to reconstruct in a new platform**. Estimated switching cost: 6–18 months of data rebuilding.

### The Relationship Loop (Features 002 + 004 + 006)

```
Copilot drafts outreach (002) using relationship context (004)
→ Creator responds → interaction updates relationship profile (004)
→ Campaign result updates CPS (006)
→ Copilot uses CPS to recommend top creators for next campaign (002 + 006)
→ Relationship history informs next outreach personalization (004)
```

**Combined stickiness:** Brand voice learning + relationship history + performance intelligence = Cheerful becomes the institutional memory of every influencer program.

### The Compliance Stack (Features 001 + 005)

```
Creator submits draft (005: approval workflow)
→ Approved → rights recorded (005: rights management)
→ Contract includes usage rights terms (001: contract layer)
→ Tax compliance at year-end (001: 1099/1042-S)
→ Audit trail: who approved, what terms, when paid
```

**Combined stickiness:** Legal compliance records are the hardest data to migrate. Two years of approval audit trails + contract archives + tax records = **legal liability to leave Cheerful**.

---

## Build Priority Sequence

Recommended sequencing to maximize stickiness, compounding value, and build efficiency:

### Sprint 1 (0–3 months): Foundation Layer
**Build Features 004 + 006 first** — both are primarily aggregation layers on existing data, minimal new infrastructure.

| Feature | Why First | Effort |
|---------|-----------|--------|
| 004 Phase 1 (Creator Profile) | Highest frequency (5/5), pure aggregation layer, no schema changes | Low |
| 006 Phase 1 (CPS Score) | Computed from existing data, immediately improves every campaign decision | Low |

### Sprint 2 (3–6 months): Revenue & Attribution
**Build Feature 003** — closes the biggest analytical gap; Shopify foundation already exists.

| Feature | Why Second | Effort |
|---------|-----------|--------|
| 003 Phases 1–3 (UTM + Promo + Dashboard) | Existing GoAffPro/Shopify integration; 82% of brands need this | Medium |

### Sprint 3 (6–9 months): Copilot Surface
**Ship Feature 002 Phase 1** — existing infrastructure, surface-area change.

| Feature | Why Third | Effort |
|---------|-----------|--------|
| 002 Phase 1 (Web UI Copilot) | Exposes already-built Context Engine; becomes the daily interface | Medium |

### Sprint 4 (9–15 months): Financial Operating System
**Build Feature 001** — highest stickiness score, most complex build.

| Feature | Why Fourth | Effort |
|---------|-----------|--------|
| 001 Phase 1 (Contracts via DocuSign) | Legal lock-in begins immediately | High |
| 001 Phase 2 (Payments via Lumanu/Tipalti) | Financial lock-in at maximum | High |

### Sprint 5 (12–18 months): Content Operating System
**Build Feature 005** — extends existing PostTrackingWorkflow.

| Feature | Why Fifth | Effort |
|---------|-----------|--------|
| 005 Phases 1–3 (Capture + Library + Approval) | Requires Sprints 1–4 foundation for maximum value | Medium |

---

## Stickiness Milestone Projections

| Milestone | Features Live | Estimated Platform Stickiness |
|-----------|--------------|-------------------------------|
| Launch (today) | 0/6 | Outreach tool — easily replaced |
| Sprint 1 complete | 004 + 006 | CRM upgrade — moderate switching cost |
| Sprint 2 complete | 003 | Revenue attribution — significant lock-in begins |
| Sprint 3 complete | 002 | Daily copilot interface — habit-based dependency |
| Sprint 4 complete | 001 | Financial operating system — highest switching cost class |
| Sprint 5 complete | All 6 | **Influencer ops OS — platform migration measured in quarters** |

---

## Key Insight: The Data Accumulation Moat

Every hero feature scores 5/5 on Data Accumulation. This is not coincidental — it is the strategic principle underlying all six features. Cheerful's stickiness strategy is:

> **Make every action inside Cheerful produce data that compounds in value over time, becoming impossible to reconstruct in any other platform.**

- Creator payments → tax records, audit trails, rate history
- AI copilot → brand voice model, institutional memory
- Revenue attribution → per-creator LTV, seasonal patterns
- Relationship intelligence → negotiation patterns, relationship health
- UGC capture → content archive, rights management history
- Performance index → creator intelligence, tier history

The competitor that executes this strategy first — and runs it for 24 months — will be functionally impossible to displace for any brand that uses all 6 features together.

---

*Sources: `analysis/hero-features/feature-001-creator-payment-hub.md` · `analysis/hero-features/feature-002-cheerful-brain-copilot.md` · `analysis/hero-features/feature-003-revenue-attribution-engine.md` · `analysis/hero-features/feature-004-creator-relationship-intelligence.md` · `analysis/hero-features/feature-005-ugc-capture-content-hub.md` · `analysis/hero-features/feature-006-creator-performance-index.md` · `analysis/synthesis/competitor-matrix.md`*
