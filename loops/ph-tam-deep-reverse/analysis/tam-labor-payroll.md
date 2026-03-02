# TAM: Labor & Payroll Tools (D1, D2, D3, D7, D8)

**Tools covered:**
- D1 — Multi-Factor Payroll Premium Computation (Score: 4.30)
- D2 — 13th Month Pay Computation (Score: 4.00)
- D3 — Final Pay Computation (Score: 4.50 — highest-scoring labor domain)
- D7 — Mandatory Govt Contributions Calculator (SSS/PhilHealth/Pag-IBIG) (Score: 3.85)
- D8 — Minimum Wage Compliance Checker (Score: 3.85)

**Loop source:** compliance-moats

---

## Shared Population Base

All five tools share the same addressable universe: Philippine private-sector employers and their employees. The key population anchors:

### Private-Sector Wage Workers (Employee-Side)

**Population:**
- **50.52 million** total employed persons — Source: PSA Labor Force Survey (LFS), December 2023 Press Release — Confidence: OFFICIAL
- **62.7%** are wage and salary workers (not self-employed) = **31.68 million** — Source: PSA LFS December 2023 — Confidence: OFFICIAL (percentage); DERIVED (absolute count)
- **78.6%** of wage/salary workers are in private establishments = **~24.9 million** private-sector wage workers — Source: PSA LFS December 2023 — Confidence: DERIVED
- Note: PSA publishes percentage shares in press releases; absolute counts require the full OpenStat tables at https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__1B__LFS/

### Formal-Sector Employers (Employer-Side)

**Population:**
- **281,825** formal-sector establishments — Source: PSA Annual Survey of Philippine Business and Industry (ASPBI) 2022, All Establishments by Employment Grouping — Confidence: OFFICIAL
  - Large (200+ workers): 4,118
  - Medium (100–199 workers): 3,244
  - Small (10–99 workers): 77,857
  - Micro (under 10, with branches/formalized): 196,607
- **6,361,802** total employees in formal sector (ASPBI 2022) — Confidence: OFFICIAL
- Average compensation: PhP 344,050/paid employee/year

### Total Business Establishment Count (Broader Base)

**Population:**
- **1,246,373** total business establishments in 2023 — Source: DTI/PSA MSME Statistics 2023 — Confidence: OFFICIAL
  - Employment covered: 9,483,965 workers
  - Micro: 1,127,058 (90.4%); Small: 109,912 (8.8%); Medium: 4,763; Large: 4,640
- Note: Includes establishments without formal payroll obligations (self-employed with no hired workers). SSS employer count is the better proxy for "businesses with payroll."

### SSS-Registered Employers (Best Proxy for Businesses with Employees)

**Population:**
- **964,362** registered employers as of December 31, 2017 — Source: ILO/ASEAN-SSA SSS Corporate Profile (references SSS Annual Report 2017) — Confidence: OFFICIAL (2017 baseline)
- **Estimated ~1.1–1.2 million** employers by 2023 (derived: SSS total membership grew from ~38.8M in 2020 to over 42M by 2023; employer count scales roughly with employed-member growth of ~8–10%) — Confidence: DERIVED
- SSS 2022 Annual Report PDF: https://www.sss.gov.ph/wp-content/uploads/2024/10/2022-SSS-Annual-Report-Final.pdf (employer count in full report; not publicly indexed separately)

### HR Practitioners (Professional Segment Base)

**Population:**
- **1,800+** PMAP (People Management Association of the Philippines) corporate and individual members — Source: PMAP official website (https://pmap.org.ph/about-pmap/) — Confidence: OFFICIAL for membership; ESTIMATED as fraction of total HR practitioners
- Note: HR is NOT a PRC-regulated profession; there is no PRC license count for HR officers
- **Derived total HR practitioners in formal sector:** Large/medium establishments (7,362) × avg. 2 HR staff = 14,724; Small establishments (77,857) × 30% probability of dedicated HR staff = 23,357; Total estimated = **~38,000** HR practitioners in formal sector — Confidence: ESTIMATED (derived from ASPBI 2022 establishment counts)
- PMAP's 1,800 members = only the formally organized subset; true practitioner base is ~20× larger

### DOLE Enforcement Universe

- **~945,000** legally inspectable establishments — Source: ILO Labour Inspection Profile Philippines (citing DOLE LSEF data) — Confidence: OFFICIAL
- **~7.8 million** workers covered by inspectable establishments — Source: same — Confidence: OFFICIAL
- **74,945** establishments inspected in 2022 — Source: ILO LSEF Working Paper (data as of October 31, 2022) — Confidence: OFFICIAL
- **78.08%** initial General Labor Standards (GLS) compliance rate; **88.24%** after correction — Confidence: OFFICIAL
- Most common violations: non-remittance to SSS/PhilHealth/Pag-IBIG; non-payment of 13th month, OT, holiday pay

---

## D3 — Final Pay Computation (Score: 4.50)

### Consumer Segment

**Who:** Private-sector employees at point of employment separation (resignation, termination, redundancy, end of contract) who need to verify their final pay computation; and employers who must prepare defensible final pay documentation within DOLE's 30-day release deadline (Labor Advisory 06-20).

**Population:**
- **~24.9 million** private-sector wage workers (total pool from which separations occur) — Source: PSA LFS December 2023 (derived) — Confidence: DERIVED
- **Annual separations estimate:** PSA ISLE 2021/2022 covers 5.37M workers in formal establishments (20+ workers). Applying a 15–20% annual turnover rate (cross-referenced: scored-domains.md cites "millions of employment separations per year — BPO, retail, food service, construction, domestic work"; BPO sector alone: ~1.7M workers × ~40% annual churn = 680,000 BPO separations/year) → **~800,000–1.1 million annual separations in the formal sector** — Confidence: ESTIMATED (no DOLE national separation count published)
- **SEnA proxy (lower bound):** 40,000–60,000 SEnA cases nationally per year (scored-domains.md) — only those escalating to formal mediation; the total separation event count is 15–25× higher
- **DOLE LSEF proxy:** ~76,000 establishments inspected annually, with final pay violations among most common GLS violations — Confidence: OFFICIAL for inspection count; ESTIMATED for final pay violation subset

**Addressable fraction:** 65% (skews urban/formal; employees who recently separated and are digitally active). Final pay is a one-time decision point with high urgency; the addressable fraction is higher than for ongoing compliance tools.

**Addressable consumer population:** 900,000 annual separations × 65% digital = **~585,000 annual transactions**

**Current professional cost:** Labor lawyer consultation: ₱5,000–₱30,000 for a demand letter + computation review; HR consultant: ₱3,000–₱10,000 per engagement (scored-domains.md); NLRC filing fee: ₱5,000+ plus 10% success fee for lawyers if won.

**Our consumer price:** ₱199/transaction (one-time; event-driven use)

**Consumer TAM:** 585,000 × ₱199 = **₱116.4M/year**

### Professional Segment

**Who:** Labor lawyers computing final pay components for clients; HR officers preparing final pay documentation at scale; payroll service firms processing off-boarding.

**Population:**
- **~60,000** active IBP lawyers (Integrated Bar of the Philippines total active roster ~2023; IBP has not published a single indexed headcount but bar passers 1970–2023 cumulative minus retirements/deaths puts active roster at this order of magnitude) — Confidence: ESTIMATED
- **~6,000** labor law practitioners (estimated 10% of bar focused on labor, employment, NLRC practice) — Confidence: ESTIMATED
- **~38,000** HR practitioners in formal sector — Source: DERIVED from PSA ASPBI 2022 (see shared base above) — Confidence: ESTIMATED
- Total professional addressable: 6,000 labor lawyers + 38,000 HR = **44,000 professionals**

**Clients per professional per year:** HR officers: handle all separations at their company (not per-client); labor lawyers: 20–50 final pay computation cases/year per practitioner.

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 44,000 × ₱999/mo × 12 = **₱527M/year**

### Total TAM — D3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (employees/employers, transaction) | ~585,000 annual events | ₱199/use | ₱116M |
| Professional (B2B seats) | ~44,000 professionals | ₱999/mo | ₱527M |
| **Total TAM** | | | **₱643M** |

**SAM:** ₱193M — metro-heavy formal sector (NCR + Regions 3, 4A, 7, 10 = ~60% of formal employment); digital access + awareness
**SOM Year 1 (1%):** ₱1.9M
**SOM Year 3 (5%):** ₱9.6M

---

## D1 — Multi-Factor Payroll Premium Computation (Score: 4.30)

### Consumer Segment

**Who:** MSMEs and informal payroll managers who compute holiday/overtime/night-shift premium pay manually — every Philippine employer with non-salaried workers needs to apply the correct statutory rate matrix for each pay period, including regular/special/double holidays per the annual proclamation.

**Population:**
- **~1.1–1.2 million** SSS-registered employers (estimated 2023) — Confidence: DERIVED from 964,362 (2017 OFFICIAL baseline)
- Subset doing manual payroll (not using payroll software): approximately 70–80% of micro/small employers. PSA ASPBI 2022: micro + small = 274,464 of 281,825 formal-sector establishments; add informal employers in SSS registry. Estimated **~700,000** employers computing payroll premiums without dedicated software — Confidence: ESTIMATED
- Digitally addressable: 60% = **420,000 employers**

**Addressable fraction:** 60% (MSMEs with internet access and willingness to use digital tool; BPO sector 100% digital but more likely on enterprise payroll)

**Current professional cost:** Payroll service bureau: ₱400–₱2,000/employee/month (scored-domains.md); ad hoc HR consultant: ₱3,000–₱15,000/engagement.

**Our consumer price:** ₱199/month (per employer, monthly subscription with annual holiday proclamation updates)

**Consumer TAM:** 420,000 × ₱199 × 12 = **₱1,003M/year**

### Professional Segment

**Who:** HR officers and payroll service firms managing multiple employer payrolls; BPO/shared-service centers computing premiums for large headcounts.

**Population:**
- **~38,000** HR practitioners in formal sector — ESTIMATED (see shared base)
- Large/medium establishments (7,362) have dedicated payroll functions; BPO sector 1.7M workers = highest-premium-density segment
- Payroll outsourcing firms: no official count; IBPAP estimates finance/accounting outsourcing ~15% of IT-BPM sector (1.7M FTEs × 15% = ~255,000 BPO workers in F&A; number of firms = unknown, SEC registry not organized by this subcategory) — Confidence: DATA GAP

**B2B price per seat:** ₱999/month

**Professional TAM:** 38,000 × ₱999/mo × 12 = **₱455M/year**

### Total TAM — D1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (employer/MSME subscriptions) | ~420,000 addressable employers | ₱199/mo | ₱1,003M |
| Professional (B2B seats) | ~38,000 HR practitioners | ₱999/mo | ₱455M |
| **Total TAM** | | | **₱1,458M** |

**SAM:** ₱437M — formal sector + digitally active MSMEs; excludes informal microenterprises below SSS radar
**SOM Year 1 (1%):** ₱4.4M
**SOM Year 3 (5%):** ₱21.9M

---

## D2 — 13th Month Pay Computation (Score: 4.00)

### Consumer Segment

**Who:** Philippine private-sector employers who must compute and distribute 13th month pay by December 24 each year; and employees who want to verify their entitlement computation (especially partial-year, pro-rated, or mixed-compensation structures).

**Population:**
- **~1.1–1.2 million** SSS-registered employers — DERIVED (same base as D1)
- **~24.9 million** private-sector wage workers (all entitled to 13th month pay) — DERIVED (PSA LFS 2023)
- DOLE LA No. 25-2023: compliance report deadline January 15 annually; all private-sector employers required to file
- DOLE LSEF: 13th month non-payment is among top GLS violations; ~74,945 establishments inspected/year (OFFICIAL)

**Addressable fraction:** 65% for employees checking own entitlement (urban, digitally active); 60% for employers using tool (same MSME digital adoption rate)

**Addressable consumer population:** 420,000 addressable employers + 16.2M employees (24.9M × 65%) = primarily employer-side as payer; employee-side = verification use case

**Current professional cost:** Ad hoc HR consultant: ₱2,000–₱5,000 per engagement; accounting firm: bundled in annual retainer.

**Our consumer price:** ₱199/month (subscription; high-value December; or ₱99/per-computation if transactional)

**Consumer TAM:** 420,000 employers × ₱199/mo × 12 = **₱1,003M/year** (annual subscription model)
Or transactional: 420,000 employers × ₱299/annual use = ₱125.6M/year

### Professional Segment

**Who:** HR practitioners, accounting firms, and payroll service bureaus computing 13th month pay for multiple clients.

**Population:**
- **~38,000** HR practitioners — ESTIMATED
- Additional bookkeepers/accounting firms: see tam-tax-business-compliance.md for bookkeeper count (~200,000 bookkeeping professionals per ICAB/BOA data); subset doing payroll = ~30,000 — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM:** 38,000 HR + 30,000 payroll accountants = 68,000 × ₱999/mo × 12 = **₱815M/year**

Note: D2 is partially bundled in payroll software; standalone TAM applies mainly to the SME/disintegrated segment.

### Total TAM — D2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (employer subscriptions) | ~420,000 addressable employers | ₱199/mo | ₱1,003M |
| Professional (B2B seats) | ~68,000 HR + payroll professionals | ₱999/mo | ₱815M |
| **Total TAM** | | | **₱1,818M** |

**SAM:** ₱546M — formal sector employers; excludes informal micro-employers
**SOM Year 1 (1%):** ₱5.5M
**SOM Year 3 (5%):** ₱27.3M

---

## D7 — Mandatory Govt Contributions Calculator — SSS/PhilHealth/Pag-IBIG (Score: 3.85)

### Consumer Segment

**Who:** Employers who compute and remit SSS, PhilHealth, and Pag-IBIG contributions for each employee monthly; and employees who want to verify correct deductions are being made.

**Population:**
- **~1.1–1.2 million** SSS-registered employers — DERIVED
- **42+ million** total SSS members as of 2023 (of which 30.5M employed members as of 2020; ~33M estimated employed by 2023) — Source: SSS Annual Reports; SSS 2023 Annual Report PDF: https://www.sss.gov.ph/wp-content/uploads/2025/01/SSS-2023-Annual-Report-full.pdf — Confidence: OFFICIAL for membership total; DERIVED for employed subset
- **Rates applicable to all:** SSS: 5% employee / 10% employer (2023); PhilHealth: 5% of monthly basic salary; Pag-IBIG: 2% each up to ₱100/month

**Addressable fraction:** 60% (employer-side; many use payroll systems already; D7 benefits mainly MSMEs without payroll software)

**Addressable consumer population:** 420,000 employers (60% digital of ~700,000 manual-payroll MSMEs)

**Current professional cost:** Payroll service: ₱400–₱2,000/employee/month; ad hoc: bundled in bookkeeper retainer.

**Our consumer price:** ₱199/month
**Competitive note:** Multiple free online calculators exist (low moat score 2); value proposition is bundled accuracy with automatic rate table updates when SSS/PhilHealth/Pag-IBIG issue new circulars.

**Consumer TAM:** 420,000 × ₱199/mo × 12 = **₱1,003M/year** (shared with D1 base — bundled value)

### Professional Segment

**Who:** Bookkeepers, accounting firms, payroll service bureaus computing contributions for multiple employers.

**Population:**
- ~68,000 HR + payroll professionals (same base as D2)

**B2B price per seat:** ₱999/month

**Professional TAM:** 68,000 × ₱999/mo × 12 = **₱815M/year**

**Discount for low moat:** Because free alternatives exist and this is a commodity function, realistic total TAM should be discounted. Best used as bundled feature rather than standalone product.

### Total TAM — D7

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (employer subscriptions) | ~420,000 addressable employers | ₱199/mo | ₱1,003M |
| Professional (B2B seats) | ~68,000 HR + payroll professionals | ₱999/mo | ₱815M |
| **Total TAM** | | | **₱1,818M** |

**SAM:** ₱364M — adjusted down 20% from raw TAM for low moat/commoditization; bundled value is key
**SOM Year 1 (1%):** ₱3.6M
**SOM Year 3 (5%):** ₱18.2M

---

## D8 — Minimum Wage Compliance Checker (Score: 3.85)

### Consumer Segment

**Who:** (1) Employers in multi-region businesses who must apply the correct regional wage order per establishment; (2) employees checking if their pay meets the current minimum wage; (3) HR/payroll managers updating wage bases when new wage orders are issued.

**Population:**
- **4,907,584** workers directly benefiting from 2024 wage orders (14 regions issued increases) — Source: NWPC/PNA, PNA article dated 2024 (https://www.pna.gov.ph/articles/1240701) — Confidence: OFFICIAL
- **1,040,000** workers in formal establishments (20+ workers) paid at exact minimum wage as of August 2022 — Source: PSA ISLE 2021/2022 Module on Employment — Confidence: OFFICIAL
- **~1.1–1.2 million** employers who must check regional wage orders for each establishment — DERIVED from SSS employer count
- NWPC operates 16 Regional Tripartite Wages and Productivity Boards; wage orders vary by: region × industry sector × establishment size

**Addressable fraction:** 70% for employers (legal compliance urgency; digital tools already used for payroll in formal sector). Workers: 50% (less likely to pay; high impact = verification use case, may be free tier).

**Addressable consumer population (employer-side):** 420,000 × 70% = 294,000 employers actively using digital compliance tools

**Current professional cost:** HR consultant: ₱3,000–₱10,000 per regional wage update; DOLE Regional Office consultation (free but time-consuming). Companies with multi-region operations pay higher legal/HR advisory fees for compliance audits.

**Our consumer price:** ₱199/month (employer subscription with live regional wage order database)

**Consumer TAM (employer):** 294,000 × ₱199/mo × 12 = **₱702M/year**

### Professional Segment

**Who:** HR officers managing multi-region establishments; labor compliance consultants; payroll service firms updating rate tables.

**Population:**
- **~38,000** HR practitioners in formal sector — ESTIMATED
- Note: 4,118 large establishments (200+ workers) are the primary market; many operate in multiple regions

**B2B price per seat:** ₱999/month

**Professional TAM:** 38,000 × ₱999/mo × 12 = **₱455M/year**

### Total TAM — D8

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (employer subscriptions) | ~294,000 addressable employers | ₱199/mo | ₱702M |
| Professional (B2B seats) | ~38,000 HR practitioners | ₱999/mo | ₱455M |
| **Total TAM** | | | **₱1,157M** |

**SAM:** ₱231M — formal sector + multi-region operators (high urgency segment); excludes low-complexity single-region micro-employers
**SOM Year 1 (1%):** ₱2.3M
**SOM Year 3 (5%):** ₱11.6M

---

## Combined Labor & Payroll TAM Summary

| Tool | Consumer Population | Consumer TAM | Professional Population | Professional TAM | Total TAM | SAM |
|------|-------------------|-------------|----------------------|-----------------|-----------|-----|
| D3 — Final Pay | ~585K annual events | ₱116M | ~44K professionals | ₱527M | ₱643M | ₱193M |
| D1 — Payroll Premiums | ~420K employers | ₱1,003M | ~38K HR practitioners | ₱455M | ₱1,458M | ₱437M |
| D2 — 13th Month | ~420K employers | ₱1,003M | ~68K HR+payroll | ₱815M | ₱1,818M | ₱546M |
| D7 — Govt Contributions | ~420K employers | ₱1,003M | ~68K HR+payroll | ₱815M | ₱1,818M* | ₱364M |
| D8 — Min Wage | ~294K employers | ₱702M | ~38K HR practitioners | ₱455M | ₱1,157M | ₱231M |

*D7 discounted for commoditization (free calculators exist); SAM is adjusted.

**Note on overlap:** D1, D2, D7, D8 share largely the same employer base (~420K). In a bundled product, the combined consumer TAM is not additive but reflects a single subscription covering all tools. The total non-overlapping employer consumer TAM for a bundled payroll compliance suite = ~420K × ₱499/mo (bundled pricing) × 12 = **₱2,514M/year**. The professional segment is partially overlapping between D1/D2/D7 (same HR practitioners), so the true professional TAM for a bundled product = ~68K × ₱2,999/mo (Practice tier) × 12 = **₱2,447M/year**.

**Bundled Labor Compliance Suite Total TAM:** ~₱4.96B/year (raw); **SAM:** ~₱1.49B; **SOM Y1 (1%):** ₱14.9M; **SOM Y3 (5%):** ₱74.5M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| Total employed persons: 50.52M | PSA LFS December 2023 Press Release | 2023 | OFFICIAL |
| Wage/salary workers: 62.7% | PSA LFS December 2023 | 2023 | OFFICIAL |
| Private-sector wage workers: ~24.9M | PSA LFS December 2023 (derived from percentages) | 2023 | DERIVED |
| Formal sector establishments: 281,825 | PSA ASPBI 2022, All Establishments by Employment Grouping | 2022 | OFFICIAL |
| Formal sector employment: 6,361,802 | PSA ASPBI 2022 | 2022 | OFFICIAL |
| Total business establishments: 1,246,373 | DTI/PSA MSME Statistics | 2023 | OFFICIAL |
| SSS registered employers: 964,362 | ILO/ASEAN-SSA SSS Corporate Profile (SSS Annual Report 2017) | 2017 | OFFICIAL |
| SSS registered employers estimated: ~1.1–1.2M | Derived from SSS membership growth 2017–2023 | 2023 | DERIVED |
| SSS total members: 42M+ | SSS Annual Report 2023 | 2023 | OFFICIAL |
| Workers in formal establishments (20+): 5.37M | PSA ISLE 2021/2022, August 2022 | 2022 | OFFICIAL |
| Workers at exact minimum wage in formal sector: 1.04M | PSA ISLE 2021/2022 | 2022 | OFFICIAL |
| Workers directly benefiting from 2024 wage orders: 4,907,584 | NWPC/PNA (14 regions) | 2024 | OFFICIAL |
| Workers benefiting from 2023 wage orders: 4.1M | NWPC/PNA | 2023 | OFFICIAL |
| NCR minimum wage (non-agricultural) 2023: ₱610/day | NWPC Wage Order NCR-24 | 2023 | OFFICIAL |
| Legally inspectable establishments: ~945,000 | ILO Labour Inspection Profile Philippines | 2022 | OFFICIAL |
| Establishments inspected per year: ~74,945 | ILO LSEF Working Paper (DOLE LSEF data to Oct 2022) | 2022 | OFFICIAL |
| GLS initial compliance rate: 78.08% | ILO LSEF Working Paper | 2022 | OFFICIAL |
| PMAP membership: 1,800+ | PMAP official website | 2024 | OFFICIAL |
| HR practitioners in formal sector: ~38,000 | Derived from ASPBI 2022 establishment size distribution | 2022 | ESTIMATED |
| Annual separations in formal sector: ~800K–1.1M | Derived from ISLE employment base × estimated turnover rates | 2022 | ESTIMATED |
| Labor lawyers in practice: ~6,000 | Estimated: ~10% of ~60K active IBP bar members | 2023 | ESTIMATED |

---

## Notes & Caveats

1. **Employer universe overlaps across D1/D2/D7/D8:** The ~420,000 addressable employers is a shared pool. TAM figures for individual tools assume each employer would pay for that specific tool standalone; a bundled product would need to price at a premium to capture the combined value.

2. **D3 final pay is event-driven, not subscription:** Unlike the other four tools which are monthly payroll fixtures, final pay is a one-time transaction per employee separation. The ₱116M consumer TAM assumes per-transaction pricing. At ₱99/event, the TAM drops to ₱58M; at ₱299/event, it rises to ₱175M. The professional TAM (subscription to HR/law firm seats) is more stable.

3. **SSS employer count data freshness:** The most recent officially indexed employer count is 2017 (964,362). The 2022 and 2023 figures exist in SSS Annual Report PDFs but are not publicly queryable. The derived 2023 estimate of ~1.1–1.2M employers should be verified against SSS 2022/2023 Annual Report PDFs before reliance.

4. **D7 low-moat caveat:** Free SSS/PhilHealth/Pag-IBIG calculators already exist on the respective agency websites and dozens of third-party apps. The TAM assumes our tool competes on bundling, accuracy, and automatic rate updates. Standalone D7 at current market conditions would face significant churn from free alternatives; SAM discount of 20% reflects this.

5. **HR practitioner count is a key gap:** PMAP's 1,800 members is the only official indexed figure; the derived ~38,000 total is based on establishment-size inference. DOLE's Bureau of Labor Relations does not publish an HR practitioner registry. A more precise count requires DOLE LSEF employer data (HR function documented in inspection reports).

6. **NLRC case filing data gap:** National annual NLRC case filing statistics for 2022–2023 are not available via publicly indexed sources. NLRC quarterly data at https://nlrc.dole.gov.ph/CaseTable was inaccessible (403 error) during research. The 40,000–60,000 SEnA case estimate comes from scored-domains.md and regional proxy data.

7. **13th Month Pro-Rata Complexity:** D2's core market defensibility is the "basic salary" definition controversy — many employers include OT/allowances, inflating or deflating the base. The real addressable segment for D2 as a standalone tool is smaller employers without payroll software; large employers have this automated.
