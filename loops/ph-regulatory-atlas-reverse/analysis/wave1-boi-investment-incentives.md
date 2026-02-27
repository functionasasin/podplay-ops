# Wave 1 Analysis: BOI/PEZA Investment Incentives

**Aspect:** `boi-investment-incentives`
**Governing Law:** RA 11534 (CREATE Act, 2021), RA 12066 (CREATE MORE Act, November 2024), EO 226 (Omnibus Investments Code), RA 7916 (PEZA Special Economic Zone Act of 1995)
**Agency:** Board of Investments (BOI), Philippine Economic Zone Authority (PEZA), Fiscal Incentives Review Board (FIRB)

---

## Summary

BOI and PEZA administer the Philippines' primary investment incentive system: Income Tax Holidays (ITH), Special Corporate Income Tax (SCIT at 5% of Gross Income Earned), and the Enhanced Deductions Regime (EDR). The CREATE MORE Act (RA 12066, signed November 11, 2024) significantly extended incentive periods. Market is fundamentally **B2B and narrow** (~3,000–5,000 active registered enterprises), but professional moat is extremely deep (Big 4 firms and top-tier law firms gatekeep incentive optimization), stakes per transaction are enormous (millions in tax savings), and several computations are fully deterministic from the statute.

---

## Legal Framework

### Primary Statutes

| Statute | Coverage |
|---------|----------|
| RA 11534 (CREATE Act, 2021) | Uniform incentives system: ITH, SCIT, EDR; rationalized from legacy PEZA/BOI laws |
| RA 12066 (CREATE MORE Act, Nov 2024) | Extended post-ITH SCIT/EDR to 20 years (FIRB-approved); reduced EDR CIT to 20%; expanded enhanced deductions |
| EO 226 (Omnibus Investments Code) | Legacy BOI framework; still governs older BOI registrations |
| RA 7916 (PEZA Special Economic Zone Act) | PEZA zone establishment, 5% GIT framework; ITH rules harmonized under CREATE |
| 2022 SIPP (MO 61) | Strategic Investment Priority Plan — determines which activities qualify and at what tier |

### Key Regulatory Bodies

- **BOI** — approves incentives for projects with investment capital ≤ ₱15 billion (IPA-approved)
- **FIRB (Fiscal Incentives Review Board)** — approves incentives for projects > ₱15 billion; chaired by DOF Secretary
- **PEZA** — operates Special Economic Zones; registers export-oriented enterprises physically located in ecozones

---

## Computation-Heavy Sections

### 1. ITH Period Determination (RA 11534 Sec. 294–296; RA 12066 amendments)

The ITH period is **fully deterministic** from three variables: SIPP Tier, Location, and Enterprise Type.

```
ITH Period Lookup Table:
+--------+------------+-------------------+---------------+
| Tier   | NCR/Metro  | Adjacent to NCR   | Other Areas   |
+--------+------------+-------------------+---------------+
| Tier 1 | 4 years    | 5 years           | 5 years       |
| Tier 2 | 5 years    | 6 years           | 6 years       |
| Tier 3 | 6 years    | 7 years           | 7 years       |
+--------+------------+-------------------+---------------+

Bonus additions:
+ 2 years → areas recovering from armed conflict or major disaster
+ 3 years → enterprises relocating OUT of NCR

Total: 4 to 10 years ITH maximum (ordinary conditions)
President's special grant: up to 10 years ITH (with FIRB endorsement)
```

**Post-ITH Incentives:**

| Approving Body | Enterprise Type | ITH + Post-ITH (CREATE MORE) |
|---------------|----------------|------------------------------|
| IPA (≤ ₱15B) | Export | 4–7 yr ITH + 10 yr SCIT/EDR = 14–17 yrs total |
| IPA (≤ ₱15B) | Domestic Market | 4–7 yr ITH + 10 yr EDR = 14–17 yrs total |
| FIRB (> ₱15B) | Export | 4–7 yr ITH + 20 yr SCIT/EDR = 24–27 yrs total |
| FIRB (> ₱15B) | Domestic Market | 4–7 yr ITH + 20 yr EDR = 24–27 yrs total |

*Note: SCIT is NOT available to domestic market enterprises per the CREATE Act's presidential veto power. Only EDR applies to DMEs.*

Key rule: **The election between SCIT and EDR is IRREVOCABLE** once made.

### 2. SCIT (Special Corporate Income Tax) Computation

**Rate:** 5% of Gross Income Earned (GIE)

**GIE Formula (RA 11534 Sec. 293–294; RR 2-2005; RR 11-2005):**
```
GIE = Gross Sales / Revenues
    − Sales Discounts, Returns & Allowances
    − Direct Costs (varies by industry type)

(Before deducting administrative expenses or incidental losses)
```

**Allowable Direct Cost Deductions by Industry:**
- **Trading:** Cost of goods sold
- **Manufacturing:** Direct labor + raw materials + depreciation of production assets + rent of production facilities + utilities (electricity, water, fuel for production) + financing charges directly related to production
- **Services:** Direct labor + materials used in service delivery + depreciation of service equipment + rent of service space
- **Financial institutions:** No direct cost deductions allowed

**GIE Tax Distribution:**
```
5% SCIT Total
├── 3% → National Government (remitted to BIR)
└── 2% → Local Government Unit treasurer's office
    (where enterprise is physically located)

For multi-site enterprises: 2% LGU split by 50% population +
25% land area + 25% equal sharing formula (DBM-DILG-DOF JC 99-2)
```

**Key complexity:** The Supreme Court ruled in *CIR vs. East Asia Utilities Corp.* (G.R. 225266, Nov. 16, 2020) that the list of allowable direct cost deductions is **non-exclusive** — any cost that can be proven as a direct production cost may be deducted. This creates litigation risk and the need for professional guidance on cost classification.

### 3. EDR (Enhanced Deductions Regime) Computation

**Rate:** 20% CIT (under CREATE MORE; was 25% under original CREATE Act)

**Additional Deductions on Top of Normal NIRC Deductions:**
- **Power expenses:** 100% additional deduction (doubled to 100% under CREATE MORE from 50% under CREATE)
- **Labor expenses:** 50% additional deduction
- **Research and development:** accelerated depreciation
- **Training expenses:** 100% additional deduction
- **Domestic input expenses:** additional deduction for prescribed percentages
- **Net operating loss carry-over (NOLCO):** 5 consecutive taxable years following last year of ITH

### 4. SCIT vs EDR Breakeven Analysis

The core decision for any registered enterprise (export enterprises only):

```
SCIT Tax = 5% × GIE
         = 5% × (Revenue − Direct Costs)

EDR Tax  = 20% × (Revenue − All Allowable Costs − Enhanced Deductions)
         = 20% × taxable income after enhanced deductions

Breakeven: When does SCIT < EDR?
Let r = GIE margin (GIE as % of Revenue)
     k = EDR effective deduction rate
SCIT = 5r% of Revenue
EDR  = 20(1 - k)% of Revenue
Breakeven: 5r = 20(1-k) → r = 4(1-k)

Example: If EDR reduces taxable income by 70% of revenue (k=0.70)
EDR tax = 20% × 30% = 6% of revenue
SCIT = 5% × GIE margin
If GIE margin < 6%/5% = 1.2 → SCIT always less IF GIE < 120% of revenue...
→ Need enterprise-specific financial projections
```

**Practical rule of thumb:** SCIT favors high-cost enterprises (where GIE margin is thin); EDR favors high-margin services enterprises. A manufacturing company with high direct costs will have low GIE → low SCIT base → SCIT is better. A software services firm with high margins but low direct costs → SCIT base is almost equal to revenue → EDR may be better.

### 5. Annual Performance Report Requirements

BOI/PEZA registered enterprises must file:
- **Annual Performance Report** to BOI/PEZA by March 31 of the following year
- **Quarterly GIE tax returns** (for SCIT-elected enterprises) — quarterly payments to BIR (3%) + LGU (2%)
- **Maintain employment commitments** per registration undertaking
- **Capital expenditure reports** if claiming duty-free importation
- **Expansion activity notifications** before launching new registered activities

Failure to file → risk of **incentive revocation** + back taxes + penalties

---

## Market Size

| Metric | Data |
|--------|------|
| New BOI projects approved (2024) | ~1,400+ projects (₱1.62 trillion total value) |
| New PEZA projects approved (2024) | 222 new and expansion projects (₱186B) |
| Annual new BOI registrants (steady state) | ~400–600 new projects/year |
| Estimated active BOI+PEZA enterprises | ~3,000–5,000 active registered enterprises |
| Foreign enterprises in PEZA ecozones | ~2,000+ (manufacturing, IT-BPM, tourism) |
| BOI 2024 record investment approvals | ₱1.62 trillion (57-year high) |
| PEZA 2024 investment approvals | ~₱215 billion (7-year high) |

**PSA/government data note:** BOI and PEZA do not publish a live count of all active registered enterprises. FOI requests to foi.gov.ph can retrieve the registry. The market is narrow in count but enormous in economic value.

---

## Professional Fees (Current Moat)

| Service | Professional | Fee Range |
|---------|-------------|-----------|
| BOI/PEZA registration application (government fee) | Government | ₱1,000–₱4,000 (token filing fee) |
| BOI registration legal assistance | Law firm / consultant | ₱80,000–₱250,000 per registration |
| PEZA registration legal assistance | Law firm / consultant | ₱100,000–₱300,000 per registration |
| SCIT vs EDR election analysis | Big 4 / top law firm | ₱200,000–₱500,000+ per engagement |
| Annual compliance (performance reports, GIE filings) | CPA firm | ₱50,000–₱150,000/year |
| Incentive NPV analysis + tax structuring | Big 4 (SGV, KPMG, PwC, Deloitte) | ₱300,000–₱1,000,000+ |
| CREATE MORE transition analysis | Big 4 / ACCRALAW / SyCip | ₱200,000–₱500,000 |

**Key insight:** The government filing fees are trivial (₱1,000–₱4,000). The professional moat exists entirely in the ADVISORY layer: structuring, election, and ongoing compliance optimization. This moat is deep — Big 4 firms and top Philippine law firms (SyCip Salazar, ACCRALAW, Quisumbing Torres) dominate.

---

## Pain Indicators

1. **Irrevocable SCIT vs EDR election** — Once filed, cannot switch. An enterprise earning ₱100M/year with 40% GIE margin would owe ₱2M/year under SCIT vs. ₱12M under EDR (if EDR effective rate is 12%). Getting this wrong = ₱10M+ error PER YEAR for the life of the incentive period (10–20 years).

2. **CREATE MORE transition (2024)** — RA 12066 introduced new election windows for existing registrants. Enterprises on old ITH+SCIT structures can migrate to CREATE MORE's longer periods — but the math is complex and windows may be limited.

3. **GIE direct cost classification** — The Supreme Court's non-exclusive ruling means enterprises must prove each direct cost deduction. BIR has historically challenged PEZA enterprise GIE deductions, creating audit risk. CPAs must document cost allocation methodologies.

4. **Multi-site allocation errors** — Enterprises operating across multiple PEZA zones must correctly allocate the 2% LGU share using the DBM population/land area formula. Errors result in double-payment or LGU deficiency claims.

5. **Annual performance report non-compliance** — BOI/PEZA have revoked incentives for enterprises failing to hit employment or capex targets. No automated tracking tool exists.

6. **SIPP qualification ambiguity** — The SIPP has a list of qualifying activities, but many enterprises have borderline activities. Misjudging eligibility = wasted registration costs + delayed commercial operations.

---

## Domains Identified

### Domain 1: SCIT vs EDR Election Analysis Tool
**Governing sections:** RA 11534 Sec. 293–296; RA 12066 Sec. 14–17 (CREATE MORE amendments); RA 7916 Sec. 24(b)(c)

**Computation sketch:**
```
Inputs:
- Enterprise type (export / domestic market)
- Revenue projections (5–10 year forecast)
- Cost structure breakdown (direct costs vs. administrative)
- SIPP tier and location
- Applicable ITH period

Outputs:
- SCIT tax per year = 5% × (Revenue − Direct Costs)
- EDR tax per year = 20% × (Revenue − All Costs − Enhanced Deductions)
- Annual tax differential (SCIT vs EDR)
- NPV of tax savings over 10-year (IPA) or 20-year (FIRB) incentive period
- Breakeven analysis: at what GIE margin does SCIT = EDR?
- Recommendation: SCIT or EDR, with ₱ magnitude of benefit
```

**Who currently does this:** Big 4 (SGV, KPMG, PwC, Deloitte), SyCip Salazar, ACCRALAW
**Market size:** ~3,000–5,000 active enterprises; ~400–600 new registrants/year making the election
**Professional fee:** ₱200,000–₱500,000+ per analysis engagement
**Pain:** Irrevocable election; errors cost millions per year for 10–20 years; no public tool exists
**Computability:** 4/5 — SCIT formula fully deterministic; EDR computation mostly deterministic (enhanced deduction categories defined in statute); direct cost classification needs documentation but framework is clear

**Opportunity score (preliminary):**
- Market: 2/5 (narrow B2B market, ~5K enterprises)
- Moat: 5/5 (Big 4 + top law firms, ₱200K–₱500K fees)
- Computability: 4/5
- Pain: 5/5 (irrevocable, million-peso stakes)
- Score = (2×0.25) + (5×0.25) + (4×0.30) + (5×0.20) = **3.95**

---

### Domain 2: ITH Period Calculator + Tax Savings Summary
**Governing sections:** RA 11534 Sec. 294–296; RA 12066 (CREATE MORE amendments); 2022 SIPP (MO 61)

**Computation sketch:**
```
Inputs:
- SIPP tier (1/2/3) — looked up from SIPP activity list
- Location (NCR / adjacent / other areas)
- Enterprise type (export / domestic)
- Approving body (IPA ≤₱15B / FIRB >₱15B)
- Bonus conditions (conflict/disaster area? relocating from NCR?)

Outputs:
- ITH period (exact years)
- Post-ITH period options (SCIT or EDR, with duration)
- Total incentive availability window
- Estimated tax savings during ITH period (if revenue projections provided)
- Incentive expiry date (given commercial operations start date)
```

**Who currently does this:** Tax lawyers, consultants (₱80K–₱250K for registration + structuring advice)
**Market size:** Same ~5,000 enterprises + new registrants; also usable by pre-registration investors doing feasibility
**Professional fee:** ₱100,000–₱300,000 for registration assistance including incentive structuring
**Pain:** Moderate — the ITH period table is publicly known but not in a usable calculator; most investors don't know the Tier-Location-Type mapping; bonus year conditions are frequently missed
**Computability:** 5/5 — fully deterministic lookup from statute tables

**Opportunity score (preliminary):**
- Market: 2/5
- Moat: 4/5 (lawyers/accountants ₱100K–₱300K)
- Computability: 5/5
- Pain: 3/5 (moderate; table lookup is annoying but not catastrophic)
- Score = (2×0.25) + (4×0.25) + (5×0.30) + (3×0.20) = **3.60**

---

### Domain 3: Annual GIE Computation & Incentive Compliance Tracker
**Governing sections:** RA 11534 Sec. 297–300; PEZA IRR Rule XX; BOI IRR Sec. 37–42; DBM-DILG-DOF JC 99-2 (LGU allocation formula)

**Computation sketch:**
```
Inputs per quarter:
- Gross revenues from registered activity
- Sales discounts, returns, allowances
- Direct costs by category (as documented per enterprise type)

Outputs:
- GIE for the quarter
- 5% SCIT due = 5% × GIE
- BIR remittance = 3% × GIE (with BIR form number, filing deadline)
- LGU remittance = 2% × GIE (to specific city/municipality treasurer)
  - Multi-site: allocation by DBM formula (50% population / 25% land / 25% equal)
- Annual performance report deadline alerts (March 31)
- Employment headcount tracker vs. committed targets
- Capital expenditure tracker vs. committed amounts
```

**Who currently does this:** CPA firms, in-house finance teams
**Market size:** ~3,000–5,000 active PEZA/BOI enterprises filing quarterly GIE returns
**Professional fee:** ₱50,000–₱150,000/year for quarterly GIE compliance
**Pain:** Moderate — multi-site LGU allocation is error-prone; annual performance report non-compliance risks incentive revocation; no integrated tracker exists
**Computability:** 4/5 — GIE formula is clear; direct cost classification requires periodic documentation

**Opportunity score (preliminary):**
- Market: 2/5
- Moat: 3/5 (CPAs handle this; more affordable than election analysis)
- Computability: 4/5
- Pain: 3/5 (quarterly compliance is routine but error-prone)
- Score = (2×0.25) + (3×0.25) + (4×0.30) + (3×0.20) = **3.05**

---

### Domain 4: SIPP Activity Pre-Screener & BOI vs PEZA Eligibility Checker
**Governing sections:** RA 11534 Sec. 294; 2022 SIPP (MO 61); RA 7916 Sec. 5 (PEZA eligible activities); BOI IRR Sec. 3–5

**Computation sketch:**
```
Inputs:
- Business activity description
- Primary product/service
- Export percentage
- Location (inside SEZ? or anywhere?)
- Investment capital amount

Outputs:
- SIPP eligibility: Yes / No / Borderline (requires BOI pre-consultation)
- SIPP tier classification (1, 2, or 3) if eligible
- BOI eligibility: Yes / No (can locate anywhere in PH)
- PEZA eligibility: Yes / No (must be in SEZ, must be >70% export)
- Recommended registration path: BOI vs PEZA vs both
- Preliminary ITH period based on tier + location
```

**Who currently does this:** Legal consultants, BOI/PEZA's own pre-consultation service (free but slow, appointment-based)
**Market size:** Broader — potentially 10,000–50,000 businesses/year considering BOI/PEZA registration
**Professional fee:** ₱50,000–₱150,000 for initial eligibility assessment
**Pain:** Moderate — high information asymmetry pre-registration; entrepreneurs waste months before discovering ineligibility; BOI offers free pre-screening but requires in-person appointments
**Computability:** 3/5 — SIPP activity list is structured but "equivalent" determinations require BOI judgment; PEZA export threshold (70%+) and SEZ location requirement are binary checks

**Opportunity score (preliminary):**
- Market: 3/5 (broader pre-registration market)
- Moat: 3/5 (consultants ₱50K–₱150K but BOI offers free consultation)
- Computability: 3/5
- Pain: 3/5
- Score = (3×0.25) + (3×0.25) + (3×0.30) + (3×0.20) = **3.00**

---

## Key Findings & Opportunity Assessment

### Overall Market Characterization

The BOI/PEZA incentives domain is **fundamentally B2B** and **narrow in beneficiary count** (~5,000 active enterprises) compared to other atlas domains (millions of Filipinos for SSS, PhilHealth, LTO). However:

1. **Stakes per transaction are enormous** — An incorrect SCIT vs EDR election can cost ₱5M–₱50M+ in unnecessary taxes over the incentive period. This makes the opportunity score competitive despite the narrow market.

2. **Professional moat is the deepest in the atlas** — Only Big 4 firms (SGV, KPMG, PwC, Deloitte) and top law firms (SyCip Salazar, ACCRALAW, Quisumbing Torres) credibly advise on incentive optimization. No public tool exists for the core decision (SCIT vs EDR).

3. **CREATE MORE (November 2024) created fresh complexity** — The new law extended incentive periods, reduced EDR CIT rate, and opened transfer registration windows for existing enterprises. This creates a wave of new election decisions from incumbent registrants.

4. **The highest-value opportunity is the SCIT vs EDR election tool** — Fully formula-driven once the enterprise's cost structure is known. The irrevocable nature and million-peso stakes make this the highest-moat computation in the domain.

5. **Annual GIE compliance is a recurring SaaS opportunity** — Unlike the one-time election analysis, quarterly GIE computation and annual performance reporting is a recurring workflow. The multi-site LGU allocation formula is an underserved pain point.

### What an "Inheritance Engine Equivalent" Would Look Like

**"IncentivePH" product concept:**
- **Onboarding:** Enterprise inputs its SIPP tier, location, enterprise type, approving body, and financial projections
- **Election analysis:** Tool computes SCIT tax vs EDR tax across the full incentive period, shows NPV of each option, identifies breakeven conditions, generates a decision brief
- **Ongoing compliance:** Quarterly GIE entry form → auto-computes SCIT due, splits 3%/2%, generates BIR + LGU remittance schedules, tracks against commitments
- **Alerts:** 15-day alert for quarterly BIR filing, 30-day alert for annual performance report, employment headcount warnings, capex progress tracker
- **Export:** Generates quarterly GIE computation worksheet (audit-ready), annual performance report draft

### Comparable
"This is like the inheritance engine but for corporate tax optimization — instead of computing estate tax from graduated rates and deductions, it computes whether your business should elect SCIT or EDR from your cost structure, then tracks quarterly GIE filings for the life of your incentive period."

---

## Summary Table

| Domain | Computability | Market | Moat | Pain | Score |
|--------|--------------|--------|------|------|-------|
| SCIT vs EDR Election Analysis | 4/5 | 2/5 | 5/5 | 5/5 | **3.95** |
| ITH Period Calculator + Savings NPV | 5/5 | 2/5 | 4/5 | 3/5 | **3.60** |
| Annual GIE Compliance Tracker | 4/5 | 2/5 | 3/5 | 3/5 | **3.05** |
| SIPP Pre-Screener & Eligibility Checker | 3/5 | 3/5 | 3/5 | 3/5 | **3.00** |

**Top opportunity:** Domain 1 (SCIT vs EDR Election Analysis Tool) — score 3.95. The combination of an irrevocable, high-stakes, million-peso decision with a fully computable formula and a Big 4-only professional moat makes this the strongest candidate in the domain. The CREATE MORE Act (2024) has just reset the decision calculus for all existing registrants, creating immediate market timing.

**Best product concept:** "IncentivePH" — combines Domains 1+2+3 into a unified incentive management platform for PEZA/BOI registered enterprises. Domain 1 is the premium offering (one-time election analysis); Domains 2+3 are the recurring SaaS subscription. Target: 5,000 enterprises × ₱100,000/year = ₱500M TAM; realistic capture at 20% penetration = ₱100M ARR.
