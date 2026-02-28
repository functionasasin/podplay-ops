# Feature 004: Creator Relationship Intelligence Hub

**One-line pitch:** A living, cross-campaign CRM for every creator — relationship history, negotiation patterns, pipeline view, and performance context in one place that compounds with every email you send.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** HIGH — Converts Cheerful from an outreach tool into the operating system for creator relationships

---

## Problem It Solves

Cheerful today is excellent at running individual campaigns — but it has no memory across them. When a brand's ops team starts a new campaign, they face blank creator profiles. They don't know: Has this creator worked with us before? What did we pay them? Did they negotiate hard? Did they deliver on time? Did their content perform? How many times have we emailed them?

This institutional memory currently lives in spreadsheets, email search, and team members' heads. It leaves with employee turnover, is invisible to new team members, and cannot scale to programs with 200+ creator relationships.

The market calls this **Influencer Relationship Management (IRM)** — Traackr literally coined the term in 2008 and built a $63K/yr enterprise business on it.

### Evidence from Research

**Market standard:**
- Personalized outreach that demonstrates genuine creator familiarity achieves **40–60% reply rates vs. 5–10% for generic** templates ([Insense.pro, analysis/categories/outreach-crm.md](https://insense.pro)) — relationship context directly drives the reply-rate metric Cheerful already tracks
- **Long-term ambassador programs** are replacing one-off campaigns — **44.9% of creators** explicitly value stability over one-off deals ([Later 2026](https://later.com/blog/top-influencer-trends-2026-how-brands-should-respond/)) — this requires a multi-campaign relationship layer
- 14% of ambassadors drive 80% of program results (Brandbassador stat) — identifying and nurturing that 14% requires cross-campaign creator intelligence
- CreatorIQ charges $30K–$200K+/yr partially on the strength of its "Creator Graph" (10 years of longitudinal creator data) — relationship depth is a premium value driver

**Specific competitor capabilities:**
- GRIN: Full "relationship view" — all communications, contracts, payments, gifting across every campaign per creator
- Modash: Gmail integration surfaces full conversation context + labels/notes persisting across campaigns
- Aspire: Centralizes creator data, communication, and performance history across all brand campaigns
- Traackr: Deep IRM — tracks all influencer communications, scores relationship health, benchmarks across portfolio
- CreatorIQ: Full creator profile with enrichment, notes, campaign history — feeds AI recommendations for future outreach

**Cheerful's current gap:**
- `campaign_creator` table tracks creator status per campaign — but no cross-campaign aggregation exists
- No creator notes, no contact tags, no relationship health indicators
- No kanban/pipeline view across campaigns — the market standard for managing 10–200 creators simultaneously
- No thread assignment — when a new team member joins, they have no context on any existing relationship
- `analysis/synthesis/competitor-matrix.md` §2: "No visual pipeline/kanban CRM view, no cross-campaign creator history, no contact notes, no creator onboarding portal"

---

## How It Works in Cheerful

### Integration with Existing Spec

**Existing (from spec):**
- `campaign_creator` table: per-campaign creator records with `status`, `paid_promotion_rate`, `paid_promotion_status`, opt-in/out timestamps, email counts
- `creator` table: `handle`, `platform`, `follower_count`, `engagement_rate`, `bio`, `niche` — the profile foundation
- `email_thread` table: full thread history keyed to creator + campaign — all communication exists; needs surface-level aggregation
- `inbox` flags (wants_paid, follow_up, etc.): structured signals extracted from emails — relationship intent signals already captured
- `creator_post` table: post content, engagement metrics — creator's content performance already tracked
- `spec-backend-api.md` §Domain 14: Creator management endpoints (CRUD for creators within campaigns)
- JWT audit trail: all actions timestamped with user ID — relationship timeline is implicitly tracked

**What to build:**

**Phase 1 — Unified Creator Profile:**
1. Cross-campaign creator profile page aggregating data from all `campaign_creator` records for a given creator handle
2. Fields: campaigns participated in, opt-in/out history, rates negotiated per campaign, communication volume, content posted, performance metrics, flags raised (wants_paid, done, follow_up)
3. "Last contacted" and contact frequency timeline
4. Notes field: free-text team notes attached to creator profile (shared across all team members)
5. Tags/labels: custom categorization (e.g., "top performer", "high negotiator", "fast responder", "gifting-only")

**Phase 2 — Relationship Pipeline (Kanban View):**
1. Visual pipeline board showing all active creator relationships across campaigns: `Contacted → Replied → Negotiating → Opted-in → Content Submitted → Completed → Alumni`
2. Cards show creator photo, handle, current campaign, days in stage, last action
3. Drag-and-drop stage transitions sync back to `campaign_creator.status`
4. Filters: by campaign, by stage, by team member assigned, by creator tier
5. Swimlane mode: one row per campaign, columns = stages (agency view for managing multiple brands)

**Phase 3 — Relationship Intelligence Scoring:**
1. **Reply Rate Score**: percentage of outreach this creator has replied to across all campaigns
2. **Collaboration Score**: ratio of opt-ins to contacts — likelihood to convert from outreach
3. **Rate Trend**: are they negotiating higher each campaign? lower? stable?
4. **Content Performance**: average engagement rate across all tracked posts
5. **Relationship Health**: composite score — last contact recency + collaboration history + content quality
6. Automatic tier suggestions: "This creator qualifies for Ambassador tier based on 3 successful campaigns"

**Phase 4 — Thread Assignment + Handoff:**
1. Thread assignment: "assign this conversation to [team member]" — new `thread_assignee` column in `email_thread`
2. Internal notes on threads: private team commentary visible to assigned members only, not sent to creator
3. Assignment context: when thread is assigned, new member sees full relationship history automatically
4. Handoff summary: AI-generated "here's everything you need to know about this creator relationship" on assignment

**API additions:**
- `GET /creators/{id}/profile` — unified cross-campaign creator profile
- `POST /creators/{id}/notes` — add team note
- `PUT /creators/{id}/tags` — update creator tags
- `GET /pipeline` — kanban view across all campaigns
- `POST /threads/{id}/assign` — assign thread to team member
- `POST /threads/{id}/internal-note` — add internal note to thread

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 5/5 | Every email sent, every creator decision, every campaign launch consults or updates the creator profile. The pipeline kanban becomes the daily ops dashboard. Used multiple times daily by any active team. |
| **Integration Depth** | 4/5 | Connects outreach (email context), campaign management (status pipeline), analytics (performance history), payments (rate history), content (post performance). Touches 5 core workflows. |
| **Data Accumulation** | 5/5 | Relationship history is the ultimate irreplaceable asset. Each campaign adds: a new negotiated rate, content performance data, communication pattern, and relationship health data point. After 2 years, a brand has a proprietary intelligence layer on hundreds of creator relationships — impossible to reconstruct. |
| **Team Dependency** | 4/5 | All team members actively using campaigns depend on the shared relationship view. Thread assignment and internal notes make it a daily coordination tool. New team members' onboarding depends on it. |
| **Switching Pain** | 4/5 | Relationship history, negotiated rate trends, custom tags, and internal notes cannot be migrated to a new platform. Years of institutional relationship memory stays in Cheerful. |

**STICKINESS SCORE: 22/25**

---

## Competitive Landscape

| Platform | Cross-Campaign History | Pipeline View | Creator Notes | Thread Assignment | Relationship Scoring |
|----------|----------------------|---------------|--------------|------------------|---------------------|
| **GRIN** | ✅ Full | ✅ Kanban | ✅ | ❌ | ✅ |
| **Traackr** | ✅ Full (2.5yr) | ✅ | ✅ | ✅ | ✅ VIT Score |
| **Aspire** | ✅ Full | ✅ | ✅ | ✅ | ⚡ |
| **Modash** | ⚡ Gmail sync | ⚡ | ✅ Labels | ❌ | ❌ |
| **CreatorIQ** | ✅ Full + AI | ✅ | ✅ | ✅ | ✅ |
| **Cheerful (current)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cheerful (with this feature)** | ✅ | ✅ | ✅ | ✅ | ✅ Cheerful Relationship Score |

**How Cheerful does it better:**
- Cheerful's creator profile is enriched by **LLM-extracted signals** from email threads (rates, sentiment, timeline) — GRIN and others require manual entry
- Relationship scoring leverages Cheerful's unique `inbox` flags (wants_paid, done, follow_up) — signals competitors don't have because they don't own the email layer
- Rate history is auto-extracted from email negotiations (existing `paid_promotion_rate` extraction) — no other platform has negotiation intelligence built from the email thread itself
- Thread-level relationship context connects outreach + relationship view in a single surface — competitors have separate outreach tools and CRM modules

---

## Workflow Integration Map

```
Team member opens "Creator Profile: @fitbyjane"
         │
         ▼ Cross-campaign profile loads:
  ┌─────────────────────────────────────────────────┐
  │ 3 campaigns (Spring, Fall, Holiday)             │
  │ Rates: $800 → $950 → $1,100 (trending up +38%) │
  │ Opt-in rate: 100% (3/3 campaigns)              │
  │ Posts: 6 tracked, avg 4.2% ER                  │
  │ Note: "Prefers DM first, then email"            │
  │ Tag: top-performer, premium-tier                │
  └─────────────────────────────────────────────────┘
         │
         ▼ Team member invites to new campaign
         │ [outreach email pre-filled with relationship context]
         │ "Hey Jane, we loved working with you on the Holiday campaign..."
         │
         ▼ Email sent → thread assigned to new team member
         │
         ▼ Creator replies → thread updated in pipeline: Contacted → Replied
         │
         ▼ Negotiation complete → rate extracted → profile updated
         │
         ▼ Campaign ends → performance data added to profile
         │ [feeds Feature 006: Creator Performance Index]
```

Connected workflows:
- **Outreach**: relationship context informs personalized email drafts
- **Campaign management**: pipeline kanban is the primary ops dashboard
- **Payments (Feature 001)**: rate history prevents over-paying; payment history enriches profile
- **Performance Index (Feature 006)**: all campaign outcomes feed creator scoring

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 002 (Cheerful Brain)**: Copilot can reference creator relationship history when drafting outreach: "I see we've worked with Jane 3 times. Want me to draft an email that references her Holiday content performance?"
2. **Feature 006 (Creator Performance Index)**: Relationship score + performance index together create a two-dimensional creator intelligence layer — engagement quality (relationship) × output quality (performance).
3. **Feature 001 (Creator Payment Hub)**: Payment history and contract history add financial relationship depth to the profile — brands see lifetime spend + performance ROI per creator.

**Built vs. Enhanced:**
- Unified creator profile: **Build** (new aggregation view on existing tables — no schema changes needed for Phase 1)
- Pipeline kanban: **Build** (new UI component; syncs to existing `campaign_creator.status`)
- Creator notes + tags: **Build** (2 new tables: `creator_note`, `creator_tag`)
- Relationship scoring: **Build** (computed from existing data; no new data required)
- Thread assignment + internal notes: **Enhance** (new columns on `email_thread`; new `thread_internal_note` table)

---

*Sources: `analysis/categories/outreach-crm.md` · `analysis/categories/team-collaboration.md` · `analysis/campaigns/market-trends.md` §Trend 5 · `analysis/competitors/grin.md` · `analysis/competitors/traackr.md` · `analysis/competitors/aspire.md` · `analysis/competitors/modash.md` · `analysis/synthesis/competitor-matrix.md` §2*
