# Wave 1 Analysis: LGU Real Property & Local Taxation

**Aspect:** `lgu-real-property`
**Primary Sources:** RA 7160 (Local Government Code) Book II (Sec. 128–292), RA 12001 (RPVARA 2024), BLGF Memorandum Circular No. 003-2025
**Analysis Date:** 2026-02-25

---

## Source Overview

The Local Government Code of 1991 (RA 7160) is a goldmine of computation-heavy tax machinery. Book II (Local Taxation and Fiscal Matters) spans Sections 128–292 and covers:

- **Local Business Tax (LBT)** — Sec. 143–152
- **Real Property Tax (RPT)** — Sec. 197–283
- **Community Tax / Cedula** — Sec. 156–169
- **Transfer Tax** — Sec. 135
- **Idle Land Tax** — Sec. 237–239
- **Special Education Fund (SEF) levy** — Sec. 235

Additionally, **Republic Act 12001 (RPVARA)**, signed June 13, 2024, represents the most significant overhaul of the Philippine property valuation system since the LGC was enacted — creating substantial new computation complexity during its transition period (2024–2026+).

**Scale**: RPT is the single largest own-source revenue for LGUs at approximately ₱76–113 billion/year. BLGF data shows 100%+ collection efficiency targets for 1,372 LGUs. The market across all local taxes affects every property owner, every registered business, and every Filipino adult in the country.

---

## Domain 1: Real Property Tax (RPT) + SEF Calculator

**Governing law:** RA 7160 Sec. 218, 232–255; RA 12001 Sec. 14–18 (RPVARA)

### Computation Sketch

```
INPUT: Property classification, Fair Market Value (FMV), LGU location, payment date

Step 1: Assessment Level (Sec. 218 LGC)
  - Residential land: 20% of FMV
  - Agricultural land: 15–40% (graduated by FMV bracket)
  - Commercial/industrial land: 30–50% (graduated by FMV bracket)
  - Residential building: 10–60% (graduated by FMV bracket, starts at 10% for ≤₱175K)
  - Machinery (commercial/industrial): 80%

Step 2: Assessed Value
  AV = FMV × Assessment Level

Step 3: Basic RPT
  - Province/municipality: AV × 1%
  - City or municipality in Metro Manila: AV × 2%

Step 4: SEF Levy (mandatory, all LGUs)
  SEF = AV × 1%

Step 5: Idle Land Surcharge (if applicable, Sec. 237–239)
  Idle Land Tax = AV × up to 5% (if >1 hectare agricultural half-uncultivated OR >1,000 sqm urban half-unutilized)

Step 6: Total Annual RPT
  Total = Basic RPT + SEF + Idle Land Tax (if applicable)

Step 7: Delinquency Penalty (Sec. 255)
  If overdue: +2% per month on unpaid amount, capped at 36 months (72% max)

Step 8: Early Payment Discount
  Discount ≤ 20% of annual total (if paid before January 31 per LGU ordinance)

OUTPUT: Annual RPT due, SEF due, quarterly installments, delinquency exposure
```

### Who Currently Does This

- Property owners compute manually (or rely on LGU assessor printouts)
- Real estate consultants for portfolio owners with multiple properties
- Accountants for property companies
- Tax amnesty under RA 12001 has created new need: computing the amnesty benefit (principal only, penalties waived)

### Market Size

- Philippines has an estimated **35–45 million** real property units (land + buildings + machinery) based on BLGF assessment report scale
- BLGF targets show ₱113.4B in RPT collection by end-2024 (ADB-funded LGRP project)
- Approximately **97 cities and 40 provinces were non-compliant** with 3-year revaluation cycle as of 2024 — meaning most LGUs have outdated SMVs, creating confusion when property changes hands
- **RA 12001 RPVARA** (July 2024): tax amnesty for pre-July 2024 delinquencies, available until July 5, 2026 → millions of delinquent accounts with a window to pay principal only

### Professional Fee Range

- Property tax consultants: ₱5,000–₱25,000 for assessment review and back-tax computation
- Real estate tax amnesty facilitation (new, post-RA 12001): ₱10,000–₱50,000 per delinquent account
- LGU-based "fixers" and consultants for assessment disputes: informal ₱3,000–₱20,000

### Computability Assessment: **5/5 — Fully Deterministic**

The entire RPT computation is statutory arithmetic. Given: (1) property classification, (2) FMV from the LGU's Schedule of Market Values, and (3) LGU location — the output is fully determined by RA 7160 Sec. 218 and 232. Delinquency interest at 2%/month for exactly N months is a simple compound-adjacent calculation. The discount percentage is published by each LGU ordinance.

**Complication layer from RPVARA (RA 12001):** The new law mandates a transition to updated SMVs within 2 years, but during the transition, the old SMV, zonal value, or actual price (whichever is higher) still applies. The tax amnesty computation is also deterministic: compute accumulated delinquency, identify which portion is penalties/surcharges/interest (waived), and arrive at the principal-only payment. This creates a new computation need.

### Pain Score: **3/5**

- Pain source 1: LGU variation. There is no single national RPT calculator because each LGU sets its own assessment levels within national maxima, and SMVs differ widely. A property owner with multiple properties across LGUs must navigate 1,600+ different LGU systems.
- Pain source 2: RPVARA transition confusion. Property owners don't know whether to use old SMVs or new ones, and what the amnesty covers.
- Pain source 3: Delinquency snowball. At 2%/month, missing 3 years = 72% surcharge on principal. Many owners don't know their exposure until they try to sell.
- Mitigation: Basic RPT computation is already handled by LGU assessors; owners just receive a bill. The computation need is strongest at: (a) amnesty decisions, (b) multi-property portfolio management, (c) pre-purchase due diligence (back-tax check).

### Opportunity Assessment: **MEDIUM**

RPT computation per se is handled by LGUs. The gaps are: (1) multi-LGU portfolio dashboards for property investors, (2) delinquency exposure calculators for pre-sale due diligence, (3) RPVARA amnesty calculators (time-limited, but high urgency through July 2026). Strong niche for real estate platforms.

---

## Domain 2: Local Business Tax (LBT) + Business Permit Fee Calculator

**Governing law:** RA 7160 Sec. 143–152; Local Revenue Codes of each LGU

### Computation Sketch

```
INPUT: Business type (manufacturer/retailer/service/contractor), gross sales/receipts
       from prior year, LGU location, number of branches, is new business (use paid-up capital)

Step 1: Tax base
  - New business: use authorized capital stock or paid-up capital per SEC/DTI registration
  - Existing business: gross sales or receipts from prior calendar year
  - Exclude: VAT, sales returns, discounts, excise tax

Step 2: LBT Rate Lookup (varies by business type and LGU ordinance)
  - Manufacturers: ~0.5–1% of gross sales
  - Retailers: up to 2% (cities), 1% (municipalities)
  - Service providers: up to 3% (cities), 1.5% (municipalities)
  - Contractors: graduated per Sec. 143(e) LGC
  - Licensed professionals (PTR holders): exempt from LBT on professional income

Step 3: LBT = Tax base × Rate

Step 4: Ancillary fees (LGU-specific)
  - Mayor's permit fee: separate computation (often 25% of 1% of capital or per floor area)
  - Fire safety inspection certificate
  - Sanitary/garbage collection fees
  - Barangay clearance fee
  - Signboard/delivery van fees

Step 5: Penalty for late payment
  - 25% surcharge on basic LBT + 2%/month interest (max 72%)

Step 6: Multi-branch allocation
  - Branches in different LGUs each need separate computation
  - Sales recorded in LGU without branch → taxed in principal office LGU

OUTPUT: LBT due per LGU, mayor's permit fee estimate, total compliance cost per branch
```

### Who Currently Does This

- Accountants and bookkeepers for business permit renewal (January annual rush)
- Business permit "fixers" (informal facilitators at LGU offices)
- Lawyers for structuring multi-branch/multi-LGU compliance
- HR/Compliance managers at medium-large companies

### Market Size

- **1.24 million** registered establishments in the Philippines (DOLE/PSA data)
- All must renew business permits annually by January 20
- Multi-branch businesses: ~50,000–100,000 entities with 2+ locations × average 3 LGUs = 150K–300K distinct LBT computations/year
- New business registrations: ~200,000+/year, each requiring initial LBT assessment on paid-up capital

### Professional Fee Range

- Bookkeeper/accountant for LBT computation + renewal: ₱3,000–₱15,000/year
- Business permit fixers: ₱2,000–₱10,000 per LGU (informal)
- Corporate secretary handling renewal for corp: often bundled with ₱36K–₱300K annual retainer (from corporation-code analysis)

### Computability Assessment: **3/5 — Rule-Heavy with LGU Variation**

The core formula (gross sales × rate) is fully deterministic. The challenge is the rate table: 1,600+ LGUs each have their own Local Revenue Code with their own rate brackets. This is computability of structure 5/5, but requires a comprehensive database of LGU rate schedules. Building and maintaining that LGU rate database is the technical moat, not the computation itself. Ancillary fees (fire, sanitary, signboard) are even more LGU-specific and harder to systematize.

### Pain Score: **4/5**

- LGU variation creates genuine confusion: a business with branches in QC, Makati, and Pasig faces three different rate schedules, three different forms, three different offices
- January 20 deadline creates annual compliance crunch (same as January 31 RPT, January 20 LBT, January 31 BIR filing for small businesses — a very compressed compliance calendar)
- Multi-branch allocation rules (LFC 001-2022) are complex and not widely understood
- "Hidden fees" problem: the final business permit bill often surprises owners who estimated only the LBT

### Opportunity Assessment: **MEDIUM-HIGH**

The LBT calculator is most valuable as part of a **Business Permit Cost Estimator** that inputs: business type + LGU + prior-year revenues → total annual permit cost including all ancillary fees. Useful for: (a) pre-location decisions (comparing LGU rates), (b) annual budget planning, (c) multi-branch cost reconciliation. The database of LGU rate schedules is the key asset — it creates a defensible data moat once built.

---

## Domain 3: Real Property Transfer Tax Bundler

**Governing law:** RA 7160 Sec. 135 (Transfer Tax); RA 7160 Sec. 232+ (RPT clearance); NIRC Sec. 24(D) (CGT); NIRC Sec. 196 (DST); PD 1529 Sec. 56 (Registration)

### Computation Sketch

```
INPUT: Selling price, property location (LGU + Metro Manila yes/no), zonal value, fair
       market value per tax declaration, buyer/seller identities, transaction type

Tax Base: MAX(selling price, zonal value, FMV per tax declaration)

Step 1: Capital Gains Tax (BIR — Sec. 24(D) NIRC)
  CGT = Tax Base × 6% [note: already in nirc-income-tax analysis]

Step 2: Documentary Stamp Tax (BIR — Sec. 196 NIRC)
  DST = Tax Base × 1.5% [note: already in nirc-other-taxes analysis]

Step 3: Transfer Tax (LGU — Sec. 135 LGC)
  - Province: Transfer Tax = Tax Base × ≤0.50%
  - Metro Manila city: Transfer Tax = Tax Base × ≤0.75% (RA 9640)
  - Tax base: MAX(selling price, FMV per LGU) [separate FMV source from BIR zonal value]

Step 4: Registration Fee (Registry of Deeds — LRA fee schedule)
  - Graduated table: ≈0.25% for low-value properties, sliding scale

Step 5: RPT Clearance
  - Verify no outstanding RPT balance (buyer's due diligence)
  - Compute back-tax exposure if any

Step 6: Total Property Transfer Cost
  Total = CGT + DST + Transfer Tax + Registration Fee + (Back RPT if any) + notarial fees

TIMELINE: CGT + DST payable within 30 days of notarization at BIR;
          Transfer Tax payable within 60 days; Registration follows CAR issuance
```

### Who Currently Does This

- Real estate brokers/agents (informal bundled service)
- Real estate lawyers (formal settlement computation)
- Accountants for corporate property disposals
- ROD offices compute registration fees at the counter

### Market Size

- Real estate sales: estimated **100,000–300,000** residential property transactions/year (formal market)
- Plus commercial/industrial transactions: ~20,000–50,000/year
- Each transaction requires 4 separate computations across 2 agencies (BIR + LGU) + Registry of Deeds
- Often same property has different "bases" for each tax (BIR uses zonal value; LGU uses its own FMV schedule)

### Professional Fee Range

- Real estate lawyer for transfer: ₱15,000–₱80,000 for computation + facilitation
- Real estate broker: includes coordination as part of commission (5-8% of sale), but often additional fees for transfer facilitation
- DIY risk: CGT underpayment triggers 25% surcharge + 20% interest per annum; common error is using wrong tax base

### Computability Assessment: **4/5 — Mostly Deterministic**

Each individual tax computation is fully deterministic. The complexity is that three different agencies use three different "market values" as tax bases: (1) BIR uses zonal value, (2) LGU uses its SMV/FMV per tax declaration, (3) ROD uses graduated schedule. Getting all three bases right is the challenge — not the arithmetic. RPVARA (RA 12001) is supposed to unify these bases over time, which will simplify the computation.

### Pain Score: **4/5**

- Multi-agency: BIR (CGT+DST) + LGU Treasurer (transfer tax) + Registry of Deeds (registration) + Notary = 4 separate stops
- Deadline risk: 30-day CGT window starts from date of notarization; penalties for late filing are severe (25% surcharge + 20% interest p.a.)
- Different FMV bases create confusion: buyers and sellers often don't know which value to use
- Sellers routinely underestimate total transfer cost (typically 8-10% of sale price all-in)

### Opportunity Assessment: **MEDIUM-HIGH**

As a **Property Transaction Tax Calculator**: input property details (location, classification, selling price) → output all taxes, fees, timeline, and which office handles what. This is the "inheritance engine for real estate transactions." Most useful as a pre-decision tool for buyers/sellers.

**Note:** CGT (6%) and DST (1.5%) are already captured in nirc-income-tax and nirc-other-taxes Wave 1 analyses. The incremental value here is the Transfer Tax (LGU) + bundled multi-tax presentation. Flagged for consolidation in Wave 2.

---

## Domain 4: RPVARA Tax Amnesty Calculator

**Governing law:** RA 12001 Sec. 30; BLGF Memorandum Circular No. 003-2025 (January 6, 2025)

### Computation Sketch

```
INPUT: Property identifier, years of delinquency (pre-July 5, 2024),
       annual basic RPT + SEF for each delinquent year

Step 1: Identify delinquent period
  - Amnesty covers only RPT delinquencies BEFORE July 5, 2024
  - Post-July 5, 2024 amounts not covered

Step 2: Compute accumulated principal
  Sum of unpaid basic RPT + SEF for each delinquent year

Step 3: Compute accumulated penalties (to be WAIVED)
  For each year: unpaid amount × 2% per month × N months (capped at 72%)
  Total penalties = sum across all delinquent years

Step 4: Amnesty amount
  AMNESTY PAYMENT = Principal only (penalties, surcharges, interest waived)
  SAVINGS = Total Accumulated Penalties (waived)

Step 5: Payment options
  - One-time payment
  - Installment (per LGU ordinance)

Step 6: Deadline tracking
  - Amnesty window closes July 5, 2026
  - Days remaining = July 5, 2026 − today

OUTPUT: Principal owed, penalties waived, amnesty savings amount, deadline countdown
```

### Who Currently Does This

- Property owners attempting to avail themselves of the amnesty often don't know the exact computation
- LGU treasurers compute manually from records
- New breed of "amnesty facilitators" emerging post-RA 12001

### Market Size

- As of 2024, approximately **97 cities and 40 provinces** had non-compliant or outdated SMVs; their delinquent accounts are the target population
- BLGF data: RPT collection efficiency was ~71% in 2016; accumulated delinquencies over 30+ years of LGC are substantial
- Senate SEPO report (April 2024): many LGUs have delinquency backlogs representing years of unpaid RPT
- Conservative estimate: **2–5 million** delinquent property accounts eligible for the amnesty

### Computability Assessment: **5/5 — Fully Deterministic**

Given the delinquency record (years × amounts), computing the penalty accumulation and the amnesty savings is pure arithmetic. The only judgment required is identifying which accounts qualify (pre-July 5, 2024 delinquencies), which is a date comparison.

### Pain Score: **5/5**

- Deadline pressure: amnesty closes July 5, 2026 — roughly 17 months from today (Feb 2026)
- Many property owners don't know their delinquency amount or that the amnesty exists
- LGU records vary in accuracy; owners need to verify against LGU records
- High stakes: failure to avail means paying 72% maximum penalty on top of principal
- For properties held in estate settlements, the delinquency blocks title transfer

### Opportunity Assessment: **HIGH (Time-Limited)**

This is the highest-urgency domain in the LGU analysis. The amnesty window creates a specific, computable, time-sensitive use case: "How much do I owe, and how much will I save if I pay now vs. after amnesty expires?" This is a straightforward calculator with enormous public benefit (millions of property owners, ₱10B+ in waivable penalties). The window closes July 5, 2026 — urgency is real.

---

## Domain 5: Community Tax / Cedula Calculator

**Governing law:** RA 7160 Sec. 156–169

### Computation Sketch

```
INPUT: Individual or corporation, gross income from Philippine sources (prior year),
       compensation income, assessed value of Philippine real property owned

For Individuals:
  Basic Tax: ₱5.00
  Additional Tax 1: Gross receipts/earnings from business/profession × ₱2/₱5,000
  Additional Tax 2: Assessed value of real property owned × ₱2/₱5,000
  Additional Tax 3: Compensation income (gross) × ₱1/₱1,000
  Total = Basic + Additional (max total ≈ ₱5,000 per Sec. 157)

For Corporations:
  Basic Tax: ₱500.00
  Additional Tax: Gross receipts from Philippine sources × ₱2/₱5,000
  Max additional: ₱10,000
  Total = Basic + Additional (max ₱10,500)

OUTPUT: Cedula amount, nearest LGU barangay for payment
```

### Opportunity Assessment: **LOW**

Despite affecting ~65 million Filipinos annually, the cedula computation is extremely simple — most LGU clerks compute it in 30 seconds. The moat is near-zero; it's a public service computation. However, it is worth noting: (a) cedulas are required for many legal documents, business permit applications, and tax filings — they're an entry point to compliance, and (b) an educational tool explaining when cedula is required could have high visibility even if the computation itself is trivial. Not a standalone opportunity.

---

## Domain 6: LGU Penalty & Surcharge Accumulation Engine (Local Tax Enforcement)

**Governing law:** RA 7160 Sec. 252–261 (RPT enforcement), Sec. 168 (community tax enforcement), LGU revenue codes

### Computation Sketch

```
INPUT: Tax type (RPT/LBT/transfer tax), original amount due, due date,
       payment date (or intended payment date)

Step 1: Delinquency period
  Months overdue = (payment date − due date) in months (rounded up)

Step 2: RPT Delinquency (Sec. 255)
  Monthly penalty = 2% per month × unpaid amount
  Total penalty = MIN(monthly penalty × N months, 72% × unpaid amount)
  Total due = unpaid + penalty

Step 3: LBT Delinquency (Sec. 168 + LGU code)
  Surcharge = 25% of unpaid LBT (one-time)
  Interest = 2% per month × unpaid amount (max 36 months = 72%)
  Total = unpaid + surcharge + interest

Step 4: RPVARA Amnesty Overlay (RPT only, pre-July 2024 delinquencies)
  Amnesty payment = principal only (penalties waived)
  Decision: pay with amnesty now vs. pay after amnesty expires (full penalties)
  Savings = penalty amount

OUTPUT: Current total due with penalties, amnesty-adjusted amount, savings from amnesty,
         deadline for amnesty, projected cost if delayed N more months
```

### Opportunity Assessment: **MEDIUM**

Standalone penalty accumulation computation. Valuable as a decision-support tool ("how much more will I owe if I wait 6 more months?") and as the core of an amnesty calculator. Best implemented as a module within the RPT Calculator (Domain 1) and RPVARA Amnesty Engine (Domain 4) rather than a standalone product.

---

## Summary of Domains Identified

| Domain | Governing Sections | Computability | Pain | Market | Priority |
|--------|-------------------|---------------|------|--------|----------|
| 1. RPT + SEF Calculator | RA 7160 Sec. 218, 232–255 | 5/5 | 3/5 | 5/5 | MEDIUM-HIGH |
| 2. LBT / Business Permit Calculator | RA 7160 Sec. 143–152 | 3/5 | 4/5 | 4/5 | MEDIUM-HIGH |
| 3. Property Transfer Tax Bundler | RA 7160 Sec. 135; NIRC Sec. 24(D)/196 | 4/5 | 4/5 | 4/5 | MEDIUM-HIGH |
| 4. RPVARA Tax Amnesty Calculator | RA 12001 Sec. 30; BLGF MC 003-2025 | 5/5 | 5/5 | 4/5 | **HIGH (time-limited)** |
| 5. Community Tax / Cedula | RA 7160 Sec. 156–169 | 5/5 | 1/5 | 5/5 | LOW |
| 6. LGU Penalty Accumulation Engine | RA 7160 Sec. 255, 168 | 5/5 | 4/5 | 4/5 | MEDIUM (module) |

### Key Strategic Insight: The LGU Complexity Stack

The LGU taxation system has a structural feature no national tax system shares: **1,600+ LGUs each set their own rates within national maxima.** This creates:

1. **Database moat**: The company that builds and maintains the LGU rate database (LBT rates, assessment levels per LGU, ancillary fee schedules, SMV updates) has a durable competitive advantage because this dataset is not centrally published by any government agency.

2. **RPVARA transition window**: RA 12001 (July 2024) is disrupting the property valuation landscape. The next 2–3 years (2024–2026) are a period of maximum confusion — assessors are updating SMVs, the tax amnesty is running, and property owners have to reconcile old and new valuations. This is the best time to build LGU-layer compliance tools.

3. **Multi-tax property transaction**: Each Philippine property sale triggers computations across 3 agencies (BIR, LGU, Registry of Deeds) using 3 different valuation bases. No existing tool bundles these together. The property transaction tax bundler is the most immediately productizable opportunity.

### New Aspects Discovered

None warranting new Wave 1 aspects — LBT, RPT, Transfer Tax, and RPVARA are all covered within this aspect. Flagged for Wave 2 deduplication:
- Property Transfer Tax Bundler overlaps with nirc-income-tax (CGT) and nirc-other-taxes (DST) — needs consolidation
- RPVARA Amnesty Calculator may appear in other aspects — check for overlap
