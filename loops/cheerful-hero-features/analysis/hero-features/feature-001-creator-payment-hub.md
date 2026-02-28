# Feature 001: Creator Payment Hub

**One-line pitch:** Native creator payment disbursement with automated tax compliance — making Cheerful the payroll system for every influencer program.

**Wave:** 3 — Hero Feature Card
**Date:** 2026-02-28
**Priority:** CRITICAL — Highest-stickiness gap in the entire platform

---

## Problem It Solves

Every paid influencer deal in Cheerful today ends with ops teams exiting the platform — to DocuSign for contracts, then to bank wire or Venmo for payment. The `paid_promotion_status` state machine faithfully tracks `AWAITING_CONTRACT → CONTRACTED → PAID`, but Cheerful has no mechanism to actually send a contract, collect a signature, or disburse funds. The `PAID` status is completely honor-system.

### Evidence from Research

**Market scale of the problem:**
- Lumanu processes **$1M+ per day** to 100,000+ creators in 180 countries — payment infrastructure at this scale is the deepest lock-in driver in the market ([Lumanu, 2025](https://www.lumanu.com/blog/how-to-automate-influencer-payments-at-scale))
- IRS penalties for missing W-9 collection: **$50–$270 per form**. For a 500-creator paid program, documentation failures can cost **$135,000 in fines** — this is a legal liability every Cheerful customer with a paid program is currently carrying ([Lumanu](https://www.lumanu.com/blog/what-brands-need-to-know-about-collecting-w-9s-and-issuing-1099s-2))
- FTC fined brands **$112M in 2025** for disclosure violations rooted in inadequate contract terms ([InfluenceFlow](https://influenceflow.io/resources/platform-specific-influencer-contract-clauses-a-complete-2026-guide/))
- Manual vendor onboarding and payment processing costs **$700–$1,000 per vendor**; poor FX rates add **3–7%** to international payouts
- **76% of brands** now use platform-specific contract terms (up from 34% in 2021)
- Performance-based compensation (hybrid flat fee + affiliate + tiered bonus) is now the **#1 model at 53% of brands** (Wave 2b market-trends.md) — this model is architecturally impossible without payment rails

**Competitor coverage:**
- GRIN: DocuSign embedded, 1099 generation, Klaviyo-gated gifting flow — $2,500+/mo
- Modash: 180+ countries, 36 currencies, global payments built-in — $199–$499/mo
- Upfluence Pay: W-9/W-8 auto-collected, tax reporting, global — $2,000+/mo
- Aspire: Contracts, payments, zero creator commission — $2,299+/mo
- CreatorIQ Pay: 80+ markets, 60+ currencies, +79% YoY growth
- Traackr: 215+ countries, Fee Recommendation Engine, 2.5yr rate history

**This gap is covered by EVERY direct mid-market competitor to Cheerful.** (competitor-matrix.md §Gap × Competitor Coverage Heat Map)

---

## How It Works in Cheerful

### Integration with Existing Spec

Cheerful already has the scaffolding — this feature closes the loop:

**Existing (from spec):**
- `campaign_creator.paid_promotion_status` — 8-stage state machine: `NEW → NEGOTIATING → AWAITING_CONTRACT → CONTRACTED → WAITING_DELIVERABLES → DELIVERABLES_SUBMITTED → PAID → DECLINED` (`spec-data-model.md`)
- `campaign_creator.paid_promotion_rate` — LLM-extracted negotiated rate from email threads (`spec-webapp.md`, `spec-user-stories.md` §US-6.7)
- `campaign_creator.paid_promotion_type` — flat/affiliate/gifting distinction already in schema
- `inbox` flag `wants_paid` (💰 amber icon) — already surfaces when creator mentions rates
- `campaign` table already tracks `type: 'paid_promotion'`
- Dashboard already shows `pending_contracts: N` and `active: N` paid promotion counts

**What to build:**

**Phase 1 — Contract Layer:**
1. AI-powered contract generator using `paid_promotion_rate` + campaign deliverables already in Cheerful as inputs
2. Pre-built legally reviewed template library: flat fee, revenue share, CPV, hybrid (FTC-compliant clauses auto-selected based on campaign channels)
3. Embedded e-signature via **DocuSign API** or **HelloSign API** — creator signs from email link, no platform account required
4. On signature: `paid_promotion_status` auto-transitions to `CONTRACTED`, contract stored against `campaign_creator` record
5. Amendment log + renewal alerts 30 days before expiry

**Phase 2 — Payment Layer (via Lumanu or Tipalti API):**
1. Creator onboarding collects banking details + W-9/W-8 at the moment they accept a deal (`NEGOTIATING → AWAITING_CONTRACT` transition triggers onboarding link)
2. TIN matching against IRS databases + OFAC/AML/KYC screening — automated on every creator
3. Deliverables gate: `DELIVERABLES_SUBMITTED → PAID` transition requires content approval sign-off before disbursement triggers
4. Payment approval workflow: ops submits → finance approves → Cheerful triggers disbursement via Lumanu/Tipalti
5. Multi-currency global payments (target: 100+ countries)
6. Auto-generate 1099-NEC (domestic) and 1042-S (international) at year-end

**Phase 3 — Budget Intelligence:**
1. Per-campaign committed budget vs. contracted vs. paid actual dashboard
2. Per-creator payment history across all campaigns (irreplaceable pricing intelligence)
3. Pipeline-aware forecasting: sum of `NEGOTIATING` + `AWAITING_CONTRACT` creator rates = expected spend
4. Finance exports: CSV / QuickBooks-compatible reconciliation report

**API surface to build:**
- `POST /campaigns/{id}/creators/{id}/contract` — generate contract from campaign params
- `POST /campaigns/{id}/creators/{id}/payment` — initiate payment after approval
- `GET /campaigns/{id}/budget` — budget vs. actual dashboard
- `GET /organizations/{id}/tax-reports` — year-end 1099/1042-S export

---

## Stickiness Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Workflow Frequency** | 4/5 | Every paid deal requires contract generation + payment disbursement. Active programs trigger this multiple times per week. Not quite daily (only paid campaigns, not gifting). |
| **Integration Depth** | 5/5 | Connects campaigns, contracts, creators, finance team approvals, tax compliance, payment rails, deliverables gate — touches 6+ workflows. |
| **Data Accumulation** | 5/5 | Financial audit trail + tax records are legally required records. After 2 years, migration means reconstructing IRS-filed 1099s, payment history, contract archives — functionally impossible. Negotiated rate history becomes irreplaceable pricing intelligence. |
| **Team Dependency** | 5/5 | Ops team (campaign management) + finance team (approval workflow) + legal team (contract review) all develop daily dependency. Three departments depending on one platform is maximum stickiness. |
| **Switching Pain** | 5/5 | Payment volume creates financial lock-in deeper than any feature. Tax records + audit trails are legally required to preserve. Rate history + contract templates represent years of institutional IP. **STICKINESS SCORE: 24/25** |

**STICKINESS SCORE: 24/25** — Highest possible in the market.

---

## Competitive Landscape

| Platform | Contracts | Payments | Tax Compliance | Lock-In Mechanism |
|----------|-----------|----------|---------------|-------------------|
| **GRIN** | ✅ DocuSign | ✅ Global | ✅ 1099 | Annual contracts + payment volume |
| **Modash** | ❌ Manual | ✅ 180 countries | ✅ Handled | Payment volume |
| **Upfluence** | ⚡ DocuSign | ✅ Global | ✅ W-9/W-8 | 12-month contracts + payment volume |
| **Aspire** | ✅ Native | ✅ Native | ✅ Handled | Annual contracts + payment volume |
| **Collabstr** | ❌ None | ✅ Escrow (Dots) | ❌ None | Transaction escrow |
| **CreatorIQ** | ✅ Full | ✅ 80+ markets | ✅ Full | Enterprise volume + compliance dependency |
| **Cheerful (current)** | ❌ None | ❌ None | ❌ None | — |
| **Cheerful (with this feature)** | ✅ AI-generated | ✅ Global | ✅ Automated | **Financial audit trail + tax records + rate history** |

**How Cheerful does it better:**
- Contracts auto-populate from LLM-extracted `paid_promotion_rate` — no manual data entry (unique capability vs. GRIN/Aspire)
- Payment gate is wired directly into the `paid_promotion_status` state machine — no separate "payments tab" context switch
- Rate history from Cheerful's existing thread-extraction is the foundation of a Fee Intelligence layer (Traackr charges $8K/yr extra for this)
- No mandatory annual contract for Cheerful customers — Modash's biggest counter-selling point vs. competitors

---

## Workflow Integration Map

Daily actions this feature touches:

```
Gmail Thread (creator mentions payment/rates)
         │
         ▼ [existing: wants_paid flag extraction]
  paid_promotion_status = NEGOTIATING
         │
         ▼ [NEW: auto-trigger]
  Contract Generator → AI drafts from rate + deliverables
         │
         ▼ [NEW: DocuSign API]
  Creator signs → status = CONTRACTED
         │
         ▼ [existing: post tracking]
  Creator delivers content → PostTrackingWorkflow detects post
         │
         ▼ [NEW: deliverables gate]
  Content approved → status = DELIVERABLES_SUBMITTED
         │
         ▼ [NEW: finance approval workflow]
  Finance approves → status = PAID → Lumanu/Tipalti disbursement
         │
         ▼ [NEW: budget dashboard]
  Budget vs. actual updated → next campaign planning informed
         │
         ▼ [NEW: year-end automation]
  1099-NEC / 1042-S generated → tax compliance closed
```

Connected workflows:
- **Outreach/CRM**: Rate negotiations extracted from email threads feed contract generation
- **Campaign Management**: Deliverables gate enforces content before payment
- **Analytics/Reporting**: Per-creator payment history feeds Cross-Campaign Creator Performance Index (Feature 006)
- **Team Collaboration**: Finance approval workflow requires multi-role RBAC (Feature gap: team-collaboration.md)

---

## Dependency Chain

**What makes this feature stickier when combined with:**

1. **Feature 003 (Revenue Attribution)**: Hybrid flat-fee + commission model requires payment rails + attribution together. Once both exist, Cheerful handles the entire creator compensation lifecycle.
2. **Feature 004 (Creator Relationship Intelligence Hub)**: Per-creator payment history feeds the relationship profile — brands see lifetime spend, rate negotiation history, and payment reliability in one view.
3. **Feature 006 (Creator Performance Index)**: Payment data (what we paid × what results we got) is the denominator for creator ROI scoring.
4. **Multi-Role RBAC** (team-collaboration gap): Finance approval workflow requires a Finance role distinct from Ops — each permission layer deepens team dependency.

**Built vs. Enhanced:**
- Contract generation: **Build from scratch** (no existing contract infra)
- Payment disbursement: **Integrate** Lumanu or Tipalti via API
- Status machine integration: **Enhance** existing `paid_promotion_status` transitions
- Tax compliance: **Integrate** TaxBandits API or Tipalti tax module
- Budget dashboard: **Build** (no existing budget tracking)

---

*Sources: `analysis/categories/payments-contracts.md` · `analysis/categories/analytics-reporting.md` · `analysis/campaigns/market-trends.md` · `analysis/competitors/grin.md` · `analysis/competitors/modash.md` · `analysis/competitors/upfluence.md` · `analysis/competitors/aspire.md` · `analysis/synthesis/competitor-matrix.md` §5*
