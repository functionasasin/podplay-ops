# Wave 1 Analysis: DAR Land Valuation (dar-land-valuation)

**Aspect:** dar-land-valuation
**Agency:** Department of Agrarian Reform (DAR) / Land Bank of the Philippines (LBP)
**Governing Law:** RA 6657 (CARP, 1988) as amended by RA 9700 (CARPER, 2009); DAR AO No. 5-98; DAR AO No. 2-2009; RA 11953 (New Agrarian Emancipation Act, 2023)
**Analyzed:** 2026-02-26

---

## Summary

DAR administers the Comprehensive Agrarian Reform Program (CARP), which involves two computation-heavy domains: (1) **just compensation formula** for land acquired from landowners, and (2) **ARB amortization** for farmer-beneficiaries paying for their awarded land over 30 years at 6%. The just compensation formula is highly codified under DAR AO 5-98, making it partially automatable — but data sourcing (comparable sales, agricultural production) creates friction that lawyers and appraisers currently monetize. RA 11953 (2023) condoned all outstanding ARB amortization loans, reducing but not eliminating the amortization opportunity.

---

## Governing Sections & Key Formulas

### 1. Just Compensation — RA 6657 Sec. 17 + DAR AO No. 5-98

**Primary Formula (all three factors present):**
```
LV = (CNI × 0.6) + (CS × 0.3) + (MV × 0.1)
```

**Alternative A (no comparable sales data):**
```
LV = (CNI × 0.9) + (MV × 0.1)
```

**Alternative B (no CNI, CS present):**
```
LV = (CS × 0.9) + (MV × 0.1)
```

**Alternative C (only MV available):**
```
LV = MV × 2
```

**CNI Formula (Capitalized Net Income):**
```
CNI = [(AGP × SP) − CO] ÷ 0.12

Where:
  AGP = Annual Gross Production (kg/ha × ha)
  SP  = Selling Price (DA-sourced 12-month average, per kg)
  CO  = Cost of Operations (actual or 20% NIR assumption)
  0.12 = Capitalization rate (12% for all crops under AO 5-98)
```

**Shortcut using NIR assumption:**
```
CNI = AGP × SP × 0.20 / 0.12  (= AGP × SP × 1.667)
```

**MV Component:**
Market Value per tax declaration, as classified by the Provincial Assessor (Riceland Irrigated vs. Riceland Un-irrigated, etc.), sourced from current LGU Schedule of Market Values.

**CS Component:**
Comparable Sales — verified sales of similar agricultural properties within the same municipality/province, registered with the Registry of Deeds within the past 3 years.

**Final adjustment:**
The computed LV is compared against the **Declared Value (DV) by the landowner** — the lower value is adopted as the Land Value.

**Mode of payment** (RA 6657 Sec. 18):
- Land ≤2 ha: 100% cash
- 2–24 ha: 25% cash + 75% LBP bonds
- >24 ha: 15% cash + 85% LBP bonds

### 2. ARB Amortization — RA 6657 Sec. 26 + RA 9700

```
Annual Amortization = P × [r(1+r)^n] / [(1+r)^n − 1]

Where:
  P = Principal (Land Value allocated to ARB's lot)
  r = 0.06 (6% annual interest)
  n = 30 (years)
```

**Cap rule:** Initial payments limited to 5% of annual gross production.
**Foreclosure trigger:** 3 consecutive unpaid annual installments.
**RA 11953 effect (2023):** All outstanding principal, interest, penalties, and surcharges for 610,054 ARBs tilling 1,173,101 ha were condoned. New CLOAs issued after RA 11953 still require fresh amortization computation.

### 3. CARP Coverage & Retention Limit — RA 6657 Secs. 6, 10

**Retention ceiling:**
```
Maximum retained area = 5 ha + (3 ha × number of qualified children, max 3)
Maximum = 5 + 9 = 14 ha
```

**Coverage test:**
- Agricultural land + >5 ha per landowner → covered (subject to exemptions)
- Exempted: residential/commercial/industrial lots, watershed/forest areas, fishponds <5 ha, church/school lands, cooperatives

---

## Domains Identified

### Domain 1: CARP Just Compensation Estimator
**Governing sections:** RA 6657 Sec. 17; DAR AO 5-98 Sec. IV-V; DAR-LBP JMC No. 11-03

A tool that helps **landowners pre-compute what LBP's Memorandum of Valuation will say** before they receive it — and verify whether LBP applied the formula correctly.

**Inputs:**
- Land area (ha) and crop type (rice-irrigated, rice-rainfed, corn, sugarcane, coconut, etc.)
- Annual Gross Production (kg/ha per crop cycle, number of cycles)
- DA-sourced selling price (auto-populated from DA market price database if available, or user-input)
- Cost of operations (actual, or 20% NIR default)
- Tax-declared Market Value (from latest tax declaration)
- Comparable sales data (optional — if user has RD transaction records)

**Outputs:**
- CNI, CS (if provided), MV components
- LV under applicable formula variant (A/B/C depending on available inputs)
- Cash vs. bond payment breakdown by land area band
- LBP valuation verification table (what LBP should have computed vs. what they offered)

**Who currently does this:** Licensed appraisers (₱15,000–₱50,000 appraisal fee) + agrarian reform lawyers (10–15% of award for SAC litigation). DAR's LBP Agrarian Operations Center computes it internally using LDIS (CARP Form 22) — no public-facing tool.

**Computation sketch:**
Fully deterministic from DAR AO 5-98 once input data is provided. The formula has no discretionary component — courts affirmed it has statutory character (SC: "partakes of the nature of statutes"). Gap: CNI data (AGP, SP) requires DA-issued price lists and FI verification; CS requires RD transaction search. A transparency tool using DA price data and user-supplied production figures can still compute a defensible range.

**Pain indicators:**
- LBP typically offers 20–50% of contested final SAC value (based on SC jurisprudence patterns)
- 15-day SAC filing deadline is routinely missed due to confusion → DARAB decision becomes final and executory, landowner permanently loses right to contest
- DAR lawyers are publicly assigned to defend DAR/LBP positions, not landowner interests — direct conflict of interest
- ≥2,400 "vintage" agrarian cases pending 3–20 years in DAR (as of 2023)
- No publicly available tool for landowners to independently verify LBP's valuation worksheet

**Estimated opportunity score:**
Market: 3/5 (contested valuations are a subset — ~50K+ active SAC cases estimated; 443K ha still undistributed means ongoing valuation activity)
Moat: 3/5 (appraisers ₱15K–₱50K + lawyers 10–15% of award; lawyer-moat is strongest for SAC litigation, appraisal moat is addressable)
Computability: 4/5 (formula fully deterministic; data sourcing is the challenge, not the math)
Pain: 4/5 (15-day deadline trap, LBP undervaluation, vintage cases, no independent tool)
**Composite: (3×0.25)+(3×0.25)+(4×0.30)+(4×0.20) = 0.75+0.75+1.20+0.80 = 3.50**

---

### Domain 2: ARB Amortization Schedule Generator
**Governing sections:** RA 6657 Sec. 26; RA 9700 Sec. 5; LDIS (CARP Form 22)

Standard 30-year annuity at 6% with initial cap at 5% of AGP.

**Inputs:** Land value (principal), land area (ha), annual gross production (for cap computation), title registration date (amortization start date).
**Outputs:** Full 30-year amortization schedule, annual payment amounts, total interest paid, cap-year adjustments, LBP payment deadlines.

**Computability: 5/5** — pure annuity formula.
**Market impact:** Reduced by RA 11953 condonation for existing ARBs. However:
- New individual CLOAs being issued (134K targeted in 2023, ongoing SPLIT project for 345K ha)
- New ARBs receiving CLOAs post-RA 11953 will need fresh amortization computation
- ARBs in the SPLIT project (subdivision of collective CLOAs) need to understand their individual amortization obligations

**Opportunity score:** Market 2/5, Moat 2/5, Computability 5/5, Pain 2/5 → **2.90** — lower priority; LBP handles computation internally, RA 11953 eliminates most outstanding balances.

---

### Domain 3: CARP Coverage & Retention Area Calculator
**Governing sections:** RA 6657 Secs. 6, 10, 11; RA 9700 Sec. 4; DAR AO 01-2022

Determines whether a landholding is covered by CARP and computes the landowner's maximum retention area.

**Inputs:** Total land area (ha), crop type/classification, number of qualified children (and their ages), existing tenancy arrangement, land use classification, year acquired, whether land is under DAR conversion order.
**Outputs:** CARP coverage status (covered/exempt/partially covered), maximum retention area (ha), area subject to redistribution (ha), applicable exemptions with legal citations, estimated timeline for compulsory acquisition if covered.

**Computability: 3/5** — retention formula is deterministic; coverage eligibility involves factual determinations (tenancy, land classification, use status) that may require document verification.
**Market:** Relevant for ~5M ha of agricultural land remaining in private hands + buyers doing due diligence on agricultural land purchases.
**Pain:** Agricultural land buyers routinely fail to check CARP coverage → discovery that land is CARP-covered after purchase is a common dispute.

**Opportunity score:** Market 3/5, Moat 3/5, Computability 3/5, Pain 3/5 → **3.00**

---

### Domain 4: SAC Filing Decision Tool (Cost-Benefit Modeler)
**Governing sections:** RA 6657 Secs. 16(f), 57; DARAB Rules of Procedure; Rule 141 (filing fees)

Models whether contesting LBP's valuation in the Special Agrarian Court (SAC) is financially worthwhile given expected legal costs, litigation timeline, and estimated award upside.

**Inputs:** LBP offered LV, estimated true market value (user judgment or appraiser report), land area (ha), crop type, litigation cost estimates (lawyer contingency %, appraisal fees), estimated SAC timeline.
**Outputs:** Expected net gain under SAC vs. accepting LBP offer, breakeven conditions, 15-day deadline countdown from DARAB decision date.

**Computability: 2/5** — SAC outcome involves significant judicial discretion; tool is useful for rough decision support but cannot replace legal counsel.
**Value:** Primarily informational — the 15-day deadline countdown is the highest-value output (prevents permanent forfeiture of SAC rights).

**Opportunity score:** Market 2/5, Moat 3/5, Computability 2/5, Pain 4/5 → **(2×0.25)+(3×0.25)+(2×0.30)+(4×0.20) = 0.50+0.75+0.60+0.80 = 2.65** — lower priority.

---

## Summary Table

| Domain | Computability | Market | Moat | Pain | Score |
|--------|--------------|--------|------|------|-------|
| D1: Just Compensation Estimator | 4/5 | 3/5 | 3/5 | 4/5 | **3.50** |
| D3: CARP Coverage Screener | 3/5 | 3/5 | 3/5 | 3/5 | 3.00 |
| D2: ARB Amortization Generator | 5/5 | 2/5 | 2/5 | 2/5 | 2.90 |
| D4: SAC Cost-Benefit Tool | 2/5 | 2/5 | 3/5 | 4/5 | 2.65 |

---

## Top Opportunity

**Domain 1 (Just Compensation Estimator)** is the lead candidate. It serves as a **verification and empowerment tool** for landowners who are structurally disadvantaged in the LBP valuation process:

- LBP computes valuations internally using LDIS/CARP Form 22 — no public equivalent
- The formula is fully codified in DAR AO 5-98, which the SC has given statutory-level weight
- The appraisal moat (₱15K–₱50K per appraisal) and lawyer moat (10–15% of award) can be partially disrupted by a tool that pre-computes the formula using DA price data + user production inputs
- The 15-day SAC filing deadline creates extreme urgency-driven professional dependency that could be addressed by also surfacing the deadline prominently

**This is like the inheritance computation but for agricultural land expropriation** — the formula is in the regulation, the inputs are available from government sources (DA, LGU assessor), and the current process is opaque and lawyer-dominated.

**Analogy:** Inheritance computation engine → LV = (CNI × α) + (CS × β) + (MV × γ) "CARP compensation engine"

**Limits:**
- CS component requires RD transaction data (requires either RD integration or allowing user-supplied comparable sales)
- DA price data API or web scraping needed for auto-populated SP values
- Tool cannot replace SAC litigation — the "fight" in contested cases moves beyond formula computation to evidence credibility; tool covers the pre-contest screening phase

---

## Sources

- [RA 6657 — lawphil.net](https://lawphil.net/statutes/repacts/ra1988/ra_6657_1988.html)
- [DAR AO No. 5-98 — DAR LIS](http://www.lis.dar.gov.ph/documents/386)
- [DAR AO 5-98 — Supreme Court E-Library](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/39670)
- [RA 9700 — DAR media](https://media.dar.gov.ph/source/2018/06/23/republic-act-no-9700.pdf)
- [RA 11953 — SC E-Library](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/96611)
- [DAR land valuation disputes — ASG Law](https://www.asglawpartners.com/property-law/2023/08/09/land-valuation-disputes-navigating-just-compensation-in-agrarian-reform/)
- [Just compensation computation — Respicio & Co.](https://www.respicio.ph/commentaries/land-just-compensation-computation)
- [CARP land valuation buying retained lands — Respicio](https://www.lawyer-philippines.com/articles/8h7mhtifi0qp258ohupb1xrxln6agy)
- [DAR targets 134K land titles in 2023 — PNA](https://www.pna.gov.ph/articles/1191046)
- [DAR 700% hike on land title distribution — PNA](https://www.pna.gov.ph/articles/1228622)
- [PBBM signs agrarian emancipation bill — PNA](https://www.pna.gov.ph/articles/1205113)
- [Attorney fees for land cases — Respicio](https://www.respicio.ph/commentaries/attorney-fees-for-land-cases-in-the-philippines)
- [Professional appraisal costs — LandValuePH](https://www.landvalueph.com/how-much-is-my-land-worth)
- [DAR LBP simplify land valuation — PNA](https://www.pna.gov.ph/articles/1175915)
- [CARP 30 years PIDS research — PIDS](https://pidswebs.pids.gov.ph/CDN/PUBLICATIONS/pidsdps1734.pdf)
