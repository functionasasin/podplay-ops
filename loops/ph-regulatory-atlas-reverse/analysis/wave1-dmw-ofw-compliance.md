# Wave 1 Analysis: DMW/POEA OFW Compliance

**Aspect:** `dmw-ofw-compliance`
**Governing Law:** RA 8042 (Migrant Workers Act, 1995) as amended by RA 10022 (2010); RA 11641 (Department of Migrant Workers Act, 2022); POEA Rules for Land-Based Workers (2016 Revised, superseded by DMW-DC-01-2023); POEA Rules for Sea-Based Workers (2016 Revised); DMW Department Circular No. 01, Series of 2023 (2023 Rules for Landbased OFW Recruitment); RA 10022 Section 6 (Illegal Recruitment); DMW Advisories (annual no-fee country updates)
**Regulatory Agency:** Department of Migrant Workers (DMW), formerly Philippine Overseas Employment Administration (POEA); Overseas Workers Welfare Administration (OWWA)
**Date Analyzed:** 2026-02-26

---

## Summary

The DMW governs the deployment of ~2.19 million active OFWs (2024 PSA estimate), regulating every step from recruitment agency licensing through pre-departure clearances, mandatory government contributions, documentary compliance, and fee ceilings. The framework sits at the intersection of massive information asymmetry (OFWs don't know their legal rights) and an extraordinarily well-defined statutory ruleset (RA 10022 + DMW circulars specify exact allowable fees, no-fee categories, and penalty formulas). The "moat" here is not a licensed professional per se — it is fixer culture: unlicensed recruiters and even licensed agencies routinely charge ₱45,000–₱200,000 in excess of legal limits, exploiting OFW ignorance of the rules. Four automation-ready domains are identified.

---

## Market Size

- **2.19 million** active OFWs as of 2024 (PSA Survey on Overseas Filipinos, December 2025)
- **429,056** new OFW deployments in Q1 2024 alone (DMW), extrapolating to ~1.7M deployments/year including rehires
- **~500,000–600,000** first-time / new-contract deploying OFWs annually (requiring full documentary compliance + fee computation)
- **76.5% land-based**, 23.5% sea-based (in terms of the ~1.5M annual new contracts processed)
- Philippines supplies **~30% of the world's merchant seafarers** separately tracked under MARINA (see `marina-seafarer-certs`)
- OFW remittances: **₱262 billion (~USD 4.46B)** in 2024, reinforcing economic scale
- **70,000+ fake job postings** taken down by DMW in 2024 (from Facebook/TikTok alone), showing scale of fraud
- **~1,800+ DMW-licensed** recruitment agencies (land-based and sea-based combined)

---

## Governing Statutory Sections

### RA 8042 as amended by RA 10022 (Migrant Workers Act)
- **Section 6** — Definition of illegal recruitment; enumerated acts including: "(a) To charge or accept directly or indirectly any amount greater than that specified in the schedule of allowable fees prescribed by the Secretary of Labor and Employment"
- **Section 6(aa)** — "To charge or collect from the worker or the employer or both any fee or charges in connection with the recruitment or deployment of workers"
- **Section 7** — Criminal penalties: 12 years + 1 day to 20 years imprisonment + ₱1M–₱2M fine (simple); life imprisonment + ₱2M–₱5M fine (economic sabotage = 3+ victims)
- **Section 10** — Money claims; mandatory repatriation liability on principal/agency
- **Section 23(b)(i)** — Standard employment contract; maximum placement fee = 1 month basic salary
- **Section 37-A** — OFW compulsory insurance: death benefit USD 15,000; repatriation minimum USD 10,000; total disability USD 7,500; burial USD 1,000

### RA 11641 (Department of Migrant Workers Act, 2022)
- **Section 4** — Powers and functions of DMW: regulate recruitment and placement; prescribe and enforce standards for allowable fees
- **Section 5(g)** — Issuance of rules on fee schedules for recruitment agencies
- **Section 8** — Creation of One-Stop Service Centers (OSSCs); OFW Pass integration
- **Section 25** — Presumption in favor of OFW in fee disputes

### DMW Department Circular No. 01, Series of 2023 (2023 Landbased Rules)
- **Section 49** — Maximum placement fee: "not to exceed one (1) month's basic salary of the worker as specified in the approved employment contract, exclusive of documentation costs"
- **Section 50** — Absolute prohibition: "No placement fee shall be collected from household service workers (HSWs), seafarers (covered under sea-based rules), and workers bound for countries covered by the no-placement fee policy"
- **Section 51** — Payment conditions: fee payable only AFTER signing DMW-approved contract; BIR-registered receipt required; installments allowed if cumulative total ≤ cap
- **Section 52** — Receipt of payment: agency must issue official receipt stating exact amount, date, payer name
- **Section 53** — Costs chargeable to employer/principal: airfare, visa, work permit fees, service fees to agency
- **Section 54** — Prohibition against other fees: "No other charges in whatever amount, form, manner or purpose shall be charged against the OFW except those specified"
- **Section 18** — License fee: ₱100,000 (land-based new license), ₱200,000 (sea-based); renewal = 50% of original; escrow deposit ₱2M (land) / ₱5M (sea)

### 2016 Revised POEA Sea-Based Rules (still applicable for seafarers)
- **Section 49** — Prohibition on collection of placement fees from seafarers: "No manning agency shall collect any placement, recruitment, or documentation fee from seafarers"
- **Section 50** — Costs exclusively chargeable to employer: agency service fees, airfare, PDOS, medical, visa

### OWWA Charter (RA 10022 + Administrative Issuances)
- **OWWA Membership Fee**: USD 25 per contract period (or 2-year maximum); mandatory for all OFWs
- **Death benefit**: ₱200,000 (OWWA member) + USD 15,000 compulsory insurance (RA 10022 Sec. 37-A)
- **Disability benefit**: ₱20,000–₱100,000 by degree of disability (OWWA schedule)
- **Educational scholarship**: ₱25,000–₱50,000/year per child (OFW Scholarship Program)
- **Livelihood assistance**: ₱20,000 grant + enterprise development (OWWA Livelihood Program)

### DMW Advisories (No-Fee Country List)
- **DMW Advisory No. 24, Series of 2024** — Qatar added to no-placement fee list
- **DMW Advisory No. 2022-01** — UAE: no placement fee for all categories
- Current no-fee country list (as of 2026): UK, Austria, Netherlands, Northern Ireland, Republic of Ireland, Canada (Alberta, BC, Manitoba, Saskatchewan), United States (incl. Guam), UAE, Qatar (~10 countries/jurisdictions)
- Expansion ongoing: DMW aims to expand list further via bilateral MOUs

---

## Domains Identified

### Domain 1: OFW Placement Fee Legality + Maximum Allowable Computation Checker

**Description:** A tool that, given a worker's job category, destination country, and basic monthly salary, determines (a) whether they are subject to the 1-month-salary cap, (b) whether they fall under an absolute no-fee category (HSW, seafarer, no-fee country), (c) the exact peso maximum they can legally be charged, and (d) what the employer must shoulder. Outputs a "legal fee receipt" the OFW can compare against what the agency is demanding.

**Computation sketch:**

```
Inputs:
  - Job category (HSW / seafarer / professional / skilled / semi-skilled / unskilled)
  - Destination country (ISO code)
  - Basic monthly salary (per approved contract, in PHP or foreign currency + exchange rate)
  - Deployment channel (licensed agency / direct hire / government-to-government)

Computation tree:
  Step 1: Is destination country on no-fee list?
    YES → Max allowable fee = ₱0; proceed to employer-borne checklist
    NO  → Go to Step 2

  Step 2: Is job category absolutely no-fee?
    HSW (any destination) → Max allowable fee = ₱0
    Seafarer → Max allowable fee = ₱0 (sea-based rules Sec. 49)
    Direct hire → No placement fee; OWWA + OFW Pass only
    Government-to-government → No placement fee
    Otherwise → Go to Step 3

  Step 3: Compute maximum placement fee
    Max_placement_fee = 1 × basic_monthly_salary_in_PHP
    (convert foreign currency at BSP reference rate if needed)

  Step 4: Split into installment schedule if applicable
    First installment: ≤ 50% at contract signing
    Second installment: remaining balance before departure

  Step 5: Employer-borne costs (NOT chargeable to OFW):
    - Airfare / ticket: borne by employer
    - Visa + work permit fees: borne by employer
    - Agency service fee: borne by employer/principal
    - PDOS (now free): borne by government
    - PEOS (free): borne by government

  Step 6: Total legal pre-departure OFW costs
    = Max_placement_fee (if applicable)
    + OWWA membership (USD 25 ≈ ₱1,400–₱1,500)
    + OFW Pass/OEC (₱100 for new hire; free for rehire/BM)
    + PhilHealth (5% × BMS, floor ₱500/month, ceiling ₱5,000/month; OFW pays full share)
    + Pag-IBIG (₱100/month minimum)
    + Medical examination (₱3,000–₱6,000 range; not standardized)
    + Passport (₱950–₱1,200 if new)
    + NBI clearance (₱115)
    + PSA birth certificate authentication (₱330)

Outputs:
  - Maximum legal placement fee (PHP)
  - No-fee determination: YES/NO with governing rule citation
  - Itemized legal cost breakdown
  - Amounts employer must pay (not the OFW)
  - Warning if any amount exceeds legal cap
  - Reference: RA 10022 Sec. 23(b)(i); DMW-DC-01-2023 Sec. 49–54; DMW Advisory No. [X]
```

**Who currently does this:** No centralized tool exists. OFWs rely on recruitment agency representations (biased), online forums (anecdotal, often outdated), or POLO officers (available only overseas). Fixers and unlicensed recruiters exploit this gap.

**Rough market size:** 500,000–600,000 first-time OFW deployments/year; additionally ~1.1M rehires. Every new deployment involves at least one fee computation. Given 70,000+ fake job offers, the fraud-prevention market is significant.

**Professional fee range:** No "professional" formally charges for this — the moat is information asymmetry. Illegal fixers charge ₱45,000–₱200,000 over the legal limit. Licensed agencies have incentive to charge maximum and obscure the country/category exemptions. Some NGOs (e.g., Migrant Forum in Asia) provide free legal advice but cannot reach scale.

**Pain indicators:**
- Documented cases: ₱40M in fraudulent fees from 223 victims in a single case (Italy, 2023)
- Victims paid ₱80,000–₱200,000 to unlicensed entities for non-existent jobs
- Annual interest rates of 61%–578% on loans taken to pay illegal placement fees (PIDS study)
- 70,000+ fake job postings taken down by DMW in 2024
- DMW hotline handles thousands of complaints annually

**Computability:** FULLY DETERMINISTIC. The rules are binary: destination country on list? Yes/No. Job category no-fee? Yes/No. Salary × 1 = cap. Every decision branch is explicitly defined in RA 10022 + DMW-DC-01-2023 + DMW Advisories. No judgment required. The only dynamic element is the country list (updated by DMW advisories annually).

**Opportunity score (preliminary):** 4.35
- Market: 5 (>1M OFW transactions/year affected)
- Moat depth: 3 (information asymmetry vs. NGOs; not CPA/lawyer-gated but fixer-exploited)
- Computability: 5 (fully deterministic from statute)
- Pain/friction: 5 (economic sabotage scale; ₱40M+ fraud per case; predatory lending cascade)

---

### Domain 2: OFW Total Government-Mandated Pre-Departure Cost Calculator

**Description:** Computes the complete set of legally required government fees for an OFW deploying abroad, broken down by whether the fee is borne by the OFW or employer. Separate paths for new hire vs. Balik-Manggagawa (rehire) and land-based vs. sea-based.

**Computation sketch:**

```
Inputs:
  - Worker type: new hire / rehire (Balik-Manggagawa) / direct hire
  - Deployment type: land-based / sea-based
  - Basic monthly salary (PHP or equivalent)
  - Contract duration (months)
  - OWWA membership status (active / expired / new)
  - First-time OFW? (yes/no) → triggers PDOS requirement

Computation:
  OWWA membership:
    = USD 25 (per contract period OR 2-year maximum, whichever comes first)
    = ~₱1,400–₱1,500 at current exchange (mandatory for ALL)

  OFW Pass / OEC:
    New hire → ₱100 (DMW processing fee)
    Rehire/BM returning to same employer → FREE (DMW DC 02-2023)
    Rehire/BM changing employer → ₱100

  PhilHealth contribution (OFW):
    Premium rate = 5% of basic monthly salary
    Floor: ₱500/month (for BMS ≤ ₱10,000)
    Ceiling: ₱5,000/month (for BMS ≥ ₱100,000)
    OFWs pay full 5% (no employer share while abroad)
    Annual = monthly_premium × 12

  Pag-IBIG contribution (OFW):
    Minimum: ₱100/month (RA 9679; OFW may opt for higher)
    Annual minimum = ₱1,200

  PDOS (Pre-Departure Orientation Seminar):
    = ₱0 (free, CFO/DMW-administered)
    Required for: first-time OFWs + emigrant workers

  PEOS (Pre-Employment Orientation Seminar):
    = ₱0 (free online, DMW-administered)
    Required for: first-time OFW applicants pre-registration

  Documentation costs (OFW-borne):
    NBI Clearance: ₱115
    PSA Birth Certificate (authentication): ₱330
    Medical exam: ₱3,000–₱6,000 (DOH-accredited clinic)
    Passport (if new): ₱950 (regular) / ₱1,200 (expedited)

  RA 10022 Sec. 37-A compulsory insurance:
    = borne by recruitment agency/principal (NOT the OFW)
    Coverage: USD 15,000 death + USD 10,000 repatriation + USD 7,500 disability + USD 1,000 burial

Outputs:
  - Total OFW-borne government fees (itemized)
  - Total employer/agency-borne government fees (itemized)
  - Grand total legally permissible pre-departure cost
  - Comparison: new hire vs. BM savings (OFW Pass + documentary streamlining)
```

**Who currently does this:** No single tool. DMW website has disconnected pages for each fee. OFWs piece information together from multiple forums, social media posts, and agency briefings — each potentially biased or outdated.

**Rough market size:** ~1.7M OFW deployments/year (new + rehire), each requiring fee computation.

**Professional fee range:** No professional directly charges for this computation, but travel consultants and fixers "bundle" this into their overall service fee of ₱5,000–₱20,000 for "processing assistance."

**Pain indicators:** OFWs routinely overpay or are blindsided by fees they thought the employer would cover. The ₱15,000–₱20,000 in legitimate pre-departure costs is already a significant barrier for low-income first-time OFWs, who often borrow at 61%–578% annual interest.

**Computability:** FULLY DETERMINISTIC for government fees. The only fuzzy element is the medical exam cost range (not legislated, market-driven). All other fees are fixed by statute or issuance.

**Opportunity score (preliminary):** 3.80
- Market: 5 (>1M annual OFW deployments)
- Moat depth: 2 (online tools partially exist; fixers capture via bundling)
- Computability: 5 (fully deterministic for govt fees)
- Pain/friction: 4 (significant financial burden, predatory lending enabled by fee opacity)

---

### Domain 3: OFW Documentary Requirements Matrix Generator

**Description:** Given worker type, destination country, job category, and whether first-time or rehire, generates the exact documentary checklist with specific requirements per agency/country, flagging which documents are processed where (DMW, OWWA, PhilHealth, Pag-IBIG, Bureau of Immigration, DFA) and estimated processing timelines.

**Computation sketch:**

```
Inputs:
  - Worker type: first-time / rehire / direct hire
  - Destination country (triggers country-specific requirements)
  - Job category (HSW / skilled / professional / seafarer)
  - Deployment channel (licensed agency / G2G / direct hire)
  - Has existing OWWA membership? (yes/no)
  - Has valid OFW Pass/OEC? (yes/no)

Decision tree for required documents:
  Universal (all OFWs):
    - Valid passport (≥6 months validity from departure)
    - OWWA membership certificate
    - PhilHealth membership (iRehistro enrollment)
    - Pag-IBIG membership ID
    - NBI Clearance (validity: 1 year)
    - Medical certificate (DOH-accredited clinic)
    - PEOS certificate (first-timers)

  Agency-hired additions:
    - POEA-verified employment contract
    - Certificate of compulsory insurance (RA 10022 Sec. 37-A)
    - PDOS certificate (first-timers)

  First-time OFW additions:
    - PSA birth certificate (authenticated)
    - PSA marriage certificate (if married)
    - PDOS certificate

  Country-specific additions:
    Saudi Arabia: Iqama (residence permit), BLAS-verified contract, SLEC medical
    UAE: UAE-accredited medical, MOHRE-attested contract
    Hong Kong: Contract verified by PHL Consulate
    Taiwan: MECO-verified contract, CGSR clearance
    Japan: JPLT/Skills test (for specified skilled workers)
    [etc. per country]

  HSW-specific:
    - Certificate of No-Fee Collection (per DMW Sec. 50)
    - Country-specific domestic worker accreditation

Outputs:
  - Customized checklist with checkboxes
  - Processing agency for each document
  - Estimated processing time per document
  - Total minimum lead time (critical path)
  - Cost per document (where applicable)
  - Download links to official DMW/DFA forms
```

**Who currently does this:** Recruitment agencies provide customized checklists, but these are agency-specific, sometimes incorrect or outdated, and serve agency interests (omitting worker rights). POLO offices abroad have country-specific guides but these are not aggregated or interactive.

**Rough market size:** ~500,000–600,000 new OFW applications/year.

**Professional fee range:** "Document processors" or fixers charge ₱3,000–₱10,000 for documentary preparation and agency follow-up. Some travel agencies bundle at ₱5,000–₱15,000.

**Pain indicators:** Incomplete or incorrect documentary submissions cause deployment delays of weeks to months, forfeiting job offers and incurring additional costs. Country-specific requirements change frequently, and no single authoritative interactive source exists.

**Computability:** MOSTLY DETERMINISTIC. The DMW has codified requirements by worker type and country. The decision tree is explicit. Edge cases arise from frequently-updating country-specific bilateral agreements, but the base framework is rule-defined.

**Opportunity score (preliminary):** 3.55
- Market: 5 (500K+ annual new OFW applications)
- Moat depth: 2 (fixers/document processors; relatively low barrier vs. lawyers)
- Computability: 4 (mostly deterministic; some country-specific edge cases)
- Pain/friction: 3 (confusing + multi-agency, but delay risk rather than financial penalty)

---

### Domain 4: OWWA Benefits Eligibility + Computation Tool

**Description:** Given an OFW's membership status (active vs. lapsed), benefit type, and triggering event, computes the exact benefit amount payable under OWWA programs. Covers death, disability, educational scholarship, livelihood assistance, and repatriation claims.

**Computation sketch:**

```
Inputs:
  - OWWA membership status: active / lapsed (with date of last contribution)
  - Benefit type: death / disability (by degree) / scholarship / livelihood / repatriation
  - Number of eligible dependents (for scholarship)
  - Disability degree: partial permanent / total permanent / total and permanent

Computation by benefit type:
  Death benefit:
    = ₱200,000 (OWWA membership benefit)
    + USD 15,000 compulsory insurance (RA 10022 Sec. 37-A) if agency-hired
    + ₱100,000 (funeral: OWWA program, varies by year)
    Eligibility: OWWA membership must be active at time of death

  Disability benefit:
    Total and permanent: ₱100,000
    Partial permanent (per degree table): ₱20,000–₱80,000
    Trigger: work-related accident or illness while abroad

  Educational scholarship (OFW Scholarship Program):
    Per scholar per year: ₱25,000 (vocational/tech) or ₱50,000 (college)
    Max scholars per member: 2 dependents
    Eligibility: active OWWA member; dependent enrolled in accredited school
    Annual computation: ₱25K or ₱50K × number_of_eligible_dependents

  Livelihood assistance (OWWA Livelihood Program):
    Enterprise grant: ₱20,000 (non-collateral, non-guarantor)
    Livelihood loan: ₱100,000–₱300,000 (business plan required)
    Eligibility: repatriated OFW or family member of active OWWA member

  Repatriation assistance:
    Airfare home (actual cost, OWWA-arranged)
    Daily subsistence allowance (₱500/day, max 30 days)
    Temporary shelter (OWWA-facilitated)

Outputs:
  - Total benefit amount per type
  - Membership validation result
  - Filing requirements and deadlines
  - Supporting documents checklist
  - OWWA regional office routing
```

**Who currently does this:** OWWA social workers and case managers handle claims manually. OFW families are often unaware of the full benefit package; only death benefit is commonly claimed. Scholarship and livelihood programs are severely underutilized (estimated 80% of eligible OFWs don't claim them).

**Rough market size:** 2.19M active OFWs × 4–5 average dependents = ~10M potential scholarship beneficiaries; annual new disability/death events: estimated 10,000–20,000 (from OWWA annual reports).

**Professional fee range:** Social workers are free but overloaded. Fixers charge ₱5,000–₱20,000 for "expediting" OWWA claims, which is entirely unnecessary (the form is free).

**Pain indicators:** OWWA benefit underutilization is documented nationally. Families file claims years late or not at all due to ignorance. Scholarship program reaches only a fraction of eligible beneficiaries.

**Computability:** FULLY DETERMINISTIC. Fixed benefit amounts, binary membership check, degree-of-disability table. No discretion involved beyond the initial medical assessment of disability degree.

**Opportunity score (preliminary):** 3.60
- Market: 4 (500K–1M transactions/year if claims were properly filed; actual claim rate is low)
- Moat depth: 3 (fixers charge for free services; social workers are overloaded)
- Computability: 5 (fully deterministic benefit computation)
- Pain/friction: 3 (confusing process, underutilization endemic, but urgency is lower than fee overcharging)

---

## Domain Summary Table

| # | Domain | Computability | Market (1-5) | Moat (1-5) | Pain (1-5) | Prelim. Score |
|---|--------|---------------|-------------|-----------|-----------|---------------|
| 1 | Placement Fee Legality Checker | Fully deterministic | 5 | 3 | 5 | **4.35** |
| 2 | Total Pre-Departure Cost Calculator | Fully deterministic (govt fees) | 5 | 2 | 4 | **3.80** |
| 3 | OFW Documentary Matrix Generator | Mostly deterministic | 5 | 2 | 3 | **3.55** |
| 4 | OWWA Benefits Eligibility + Computation | Fully deterministic | 4 | 3 | 3 | **3.60** |

---

## Key Insight: Information Asymmetry as the Core Moat

Unlike most other regulatory domains where a licensed professional (CPA, lawyer, broker) holds the technical knowledge, the OFW compliance moat is primarily **information asymmetry weaponized by fixers and unethical agencies**. The statutory rules are fully deterministic and relatively simple — but OFWs are economically desperate, time-pressured, and often first-generation workers who lack access to legal resources.

The "engine equivalent" for Domain 1 is essentially:

> **OFW Fee Legitimacy Checker**: Given my job category, destination country, and offered salary → Here is exactly what you can legally be charged, what your employer must pay, and what constitutes illegal recruitment you can report to DMW hotline 1348.

This is analogous to the inheritance tax engine (formula-driven, clear inputs/outputs, massive professional moat) but with an even simpler computation — and a direct harm-prevention use case (victims being defrauded of ₱45K–₱200K per deployment).

The combined **Domain 1 + Domain 2** tool — a single "OFW Fee Shield" — would cover the full pre-departure financial picture for ~500,000+ new OFWs per year, with clear statutory backing, fully deterministic logic, and a well-documented fraud epidemic it directly addresses.

---

## Sources and References

- PSA Survey on Overseas Filipinos 2024 (released December 2025): [Philstar](https://www.philstar.com/business/2025/12/19/2495253/ofws-rise-219-million-2024-psa)
- RA 10022 full text: [UMN Human Rights Library](https://hrlibrary.umn.edu/research/Philippines/RA-10022.html)
- RA 11641 full text: [LawPhil](https://lawphil.net/statutes/repacts/ra2021/ra_11641_2021.html)
- DMW-DC-01-2023 (2023 Landbased Rules): [DMW Official](https://dmw.gov.ph/resources/dsms/DMW/ISN-EXT/2023/DMW-DC-01-2023.pdf)
- DMW Advisory No. 24-2024 (Qatar no-fee): [DMW Advisory PDF](https://dmw.gov.ph/archives/v1/resources/dsms/DMW/ISN-EXT/2024/DMW-ADVISORY-24-2024.pdf)
- PIDS study on predatory lending tied to illegal recruitment: [PIDS/In the News](https://www.pids.gov.ph/details/news/in-the-news/bloodsuckers-preying-on-aspiring-ofws-make-a-killing-on-placement-fees-illegal-loans)
- DMW OFW deployment statistics Q1 2024: [Budget Finance Corp](https://www.budgetfinance.ph/newsBlogs/dmw-reports-429,056-ofws-as-of-march-2024)
- OFW process and fee breakdown: [KabayanRemit](https://kabayanremit.com/blog/lifestyle/how-to-be-ofw-process/)
- OWWA programs and services: [PASEI/OWWA](https://www.pasei.com/owwa-programs-services-ofws/)
- Placement fee rules explained: [Respicio & Co.](https://www.respicio.ph/commentaries/legal-recruitment-placement-fee-philippines)
- No-fee country expansion: [PNA](https://www.pna.gov.ph/articles/1232597)
- Alburo Law — 2023 DMW Rules simplified: [Alburo Law](https://www.alburolaw.com/2023-department-of-migrant-workers-dmw-rules-and-regulations-for-landbased-overseas-filipino-workers-simplified/)
