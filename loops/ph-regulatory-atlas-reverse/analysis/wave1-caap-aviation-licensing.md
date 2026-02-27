# Wave 1 Analysis: CAAP Aviation Licensing

**Aspect:** `caap-aviation-licensing`
**Governing Law:** RA 9497 (Civil Aviation Authority Act of 2008); Philippine Civil Aviation Regulations (PCAR) Part 2 (Personnel Licensing), Part 4 (Airworthiness), Part 11 (Aerial Work & RPA)
**Regulatory Agency:** Civil Aviation Authority of the Philippines (CAAP) — Flight Standards and Inspectorate Service (FSIS)
**Analysis Date:** 2026-02-27

---

## Overview

CAAP is the single regulatory authority for all civil aviation in the Philippines. It inherited the Air Transportation Office's mandate under RA 9497, with quasi-judicial and quasi-legislative powers. Its compliance universe covers three main citizen-facing tracks:

1. **Personnel licensing** — pilot licenses (SPL → PPL → CPL → ATPL), AMT, ATC, cabin crew, RPAS controller
2. **Aircraft airworthiness & registration** — Certificate of Registration (CofR), Certificate of Airworthiness (CofA), annual renewals
3. **RPAS/drone** compliance — controller certificate, registration certificate, operator certificate for commercial drone operations

All three tracks involve multi-step processes, graduated fee schedules, and eligibility conditions defined in PCAR regulations — making significant portions computationally tractable.

---

## Governing Statutory and Regulatory Framework

| Instrument | Coverage |
|---|---|
| RA 9497 (2008) | Creating CAAP, granting rulemaking authority |
| PCAR Part 2 (Jan 2026 edition) | Personnel licensing — all pilot license types, ratings, medical requirements, renewal rules |
| PCAR Part 4 (Airworthiness) | Aircraft registration, CofA issuance, maintenance requirements |
| PCAR Part 11 (July 2025 edition) | Aerial work and operating limitations for non-type-certificated aircraft, RPA |
| CAAP MC No. 20-15 (2015) | Revised fees for Airmen Examination Board — written exam fees by license type |
| CAAP MC No. 018-2023 | Schedule of Fees for Air Navigation Services (MTOW-based landing/overflight charges) |
| CAAP MC No. 018-2012 | Original RPAS regulations (updated by PCAR Part 11) |
| CAAP RPAS Regulations | Controller certificate, operator certificate, registration requirements |

---

## Domain 1: Pilot License Pathway Eligibility & Cost Calculator

### Description
Aspiring pilots face a 4-stage sequential licensing system (SPL → PPL → CPL → ATPL), each with distinct eligibility gates, exam requirements, and government fee components. The pathway logic is fully codified in PCAR Part 2.

### Computation Sketch

**Inputs:**
- Current license level (none / SPL / PPL / CPL)
- Helicopter vs. fixed-wing track
- Total logged flight hours
- Instrument Rating status (yes/no)
- CAAP medical certificate class (Class 1 / Class 2 / none)
- Foreign license to validate (yes/no; country)

**Deterministic Rules from PCAR Part 2:**
- SPL → PPL: min 40 hours total flight time, 20 solo, 5 solo X-country
- PPL → CPL: min 150 hours total, 100 PIC, 20 instrument time, 20 X-country
- CPL → ATPL: min 1,500 hours total, 500 multi-engine, 100 night, Class 1 medical
- Each step requires passing AEB written exams (10 subjects for PPL, 9 for CPL, 9 for ATPL) + CAAP practical test

**Government Fee Schedule (CAAP MC 20-15, 2015):**
| Exam / License Type | Fee |
|---|---|
| Pre-solo theory exam | ₱230/subject |
| PPL theory exam (10 subjects) | ₱230/subject = ₱2,300 total |
| CPL theory exam (9 subjects) | ₱340/subject = ₱3,060 total |
| ATPL theory exam (9 subjects) | ₱450/subject = ₱4,050 total |
| SPL application/issuance | ₱480 |
| PPL additional rating | ₱240 |
| ATPL license issuance | ₱960 |
| Instrument Rating | ₱340/subject |
| Flight Instructor Rating | ₱450/subject (2 subjects) |

**Total CAAP government fees (CPL path from scratch):** approximately ₱9,000–₱12,000 — trivial compared to ₱3–5M flight school cost, but the pathway eligibility check itself is complex.

### Who Currently Does This
Flight school advisors and admissions staff explain the pathway informally. No public CAAP tool exists to compute total pathway cost, exam sequence, or readiness check. Students routinely pay ₱8,000–₱12,000 for introductory consultations with flight schools or advisors before committing to training.

### Market Size
- ~8,000+ licensed pilots in the Philippines (estimated, CAAP licenses ~4 categories)
- ~40+ CAAP-approved flight schools
- ~300–500 new CPL/ATPL candidates per year seeking training
- Growing pilot shortage: CAAP director confirmed "we are over capacity" and airlines actively recruiting internationally

### Pain Indicators
- Complex 4-tier pathway is opaque to entrants; no official CAAP eligibility tool
- Many students pay for introductory courses at wrong schools (helicopter vs. fixed-wing; PA-28 vs. multi-engine)
- Foreign license validation pathway (PCAR 2.095) is complex: 3 different validation routes depending on ICAO state membership and exam equivalency
- Medical class requirements (Class 1 required for CPL+) create expensive discovery surprises

### Computability Assessment
**Mostly deterministic** (score: 4/5) — PCAR Part 2 specifies exact hour minimums, exam subjects, and fee amounts. Edge cases: foreign license recognition (requires CAAP discretion), medical exam outcome (physician judgment). Core eligibility check and cost calculation: fully deterministic.

### Opportunity Score Estimate
- Market: 2 (300–500 new CPL candidates/year + 8K active for renewals)
- Moat: 2 (no formal fixer market, but flight school advisors capture advisory role)
- Computability: 4
- Pain: 3
- **Estimated score: 2.75**

---

## Domain 2: Aircraft Airworthiness & Registration Fee Calculator

### Description
Registering an aircraft in the Philippines requires a Certificate of Registration (CofR) plus a Certificate of Airworthiness (CofA), both with annual renewal cycles. The fee structure is MTOW-based and defined in CAAP regulations and memorandum circulars.

### Computation Sketch

**Inputs:**
- Aircraft MTOW (in metric tons)
- Aircraft category (RP-C commercial / RP-G general aviation / RP-R recreational / RP-X experimental)
- Import or local purchase (affects inspection location and billing)
- Age of aircraft and last CofA
- Type certificate status (type-certificated vs. non-type-certificated)

**Deterministic Rules:**
- Air Navigation charges (MC 018-2023): MTOW-based in USD (payable in pesos), with 4 weight classes
  - Class 1: MTOW < 2 MT
  - Class 2: 2 MT ≤ MTOW < 7 MT
  - Class 3: 7 MT ≤ MTOW < 30 MT (added in 2023 update)
  - Class 4: MTOW ≥ 30 MT (added in 2023 update)
- CofA validity: 12 months maximum; renewal requires CAAP inspection within 30 days of expiry
- Non-type-certificated aircraft (experimental/homebuilt): RP-X or RP-S mark; special airworthiness certificate process
- Late renewal: suspension of CAAP services; flight plan rejection

**Fee Components (per aircraft per year):**
- CofR initial + CofA initial: CAAP-billed based on aircraft class
- Annual CofA renewal: CAAP-billed per inspection (travel costs assessed separately for overseas aircraft)
- Air navigation charges: MTOW × distance formula (MC 018-2023)
- Touch-and-go training: ₱365–₱730 per operation + 12% VAT

### Who Currently Does This
Aircraft owners, operators, and maintenance organizations manage airworthiness internally or through aviation consulting firms. For complex imports (used aircraft from USA/Australia/Canada), aviation law firms (e.g., Tan Hassani & Counsels) handle the paperwork and CAAP liaison. Legal fees: ₱20,000–₱80,000+ for a full import airworthiness certification.

### Market Size
- ~500–1,000 civil aircraft registered in the Philippines (estimated from 87 airports + GA fleet)
- ~100+ commercial aircraft in active airline fleets (Cebu Pacific, PAL, AirAsia PH)
- Growing GA market with increased training demand
- CofA renewal: annual cycle for ALL registered aircraft

### Pain Indicators
- Fee schedule in USD but paid in pesos (FX exposure, conversion confusion)
- Two new MTOW weight classes added in 2023 with no public fee comparison tool
- CofA expiry triggers flight plan rejection — high-stakes missed deadline
- Import airworthiness process requires CAAP inspector dispatch (travel cost billed separately) → costly and scheduling-dependent

### Computability Assessment
**Mostly deterministic** (score: 4/5) — MTOW × rate table is pure arithmetic; CAAP inspection scheduling and travel cost billing are more opaque. The fee calculation itself is fully deterministic once MTOW and class are known.

### Opportunity Score Estimate
- Market: 2 (500–1,000 aircraft)
- Moat: 3 (aviation law firms needed for imports)
- Computability: 4
- Pain: 3
- **Estimated score: 3.00**

Note: Narrow market (~500–1,000 aircraft) limits this domain's scale potential compared to mass-market CAAP domains.

---

## Domain 3: RPAS/Drone Compliance Suite (Highest Opportunity)

### Description
Commercial drone operators in the Philippines need up to THREE separate CAAP certifications: (1) RPAS Controller Certificate (individual), (2) RPAS Operator Certificate (business), and (3) RPA Registration Certificate (per aircraft). Each has distinct requirements, fees, validity periods, and renewal rules. The compliance matrix is complex and mostly deterministic.

### Computation Sketch

**Eligibility Decision Tree (CAAP RPAS Regulations):**
```
Is drone used commercially?
  YES → All 3 certs required (controller + operator + registration)
  NO → Is gross weight ≥ 7 kg?
       YES → Registration required; controller cert required
       NO → No registration required (recreational <7 kg exempt)

Controller Certificate eligibility:
  - Age ≥ 18 years (binary gate)
  - Completed manufacturer training (yes/no)
  - 5+ hours operating experience (logged)
  - Passed CAAP knowledge exam + skills test

RPAS Operator Certificate:
  - Valid controller certificate
  - Operations manual approved by CAAP
  - Designated Accountable Manager
  - 3-year validity

RPA Registration:
  - Commercial: ALL weights
  - Recreational: ≥7 kg threshold
  - Fee: ₱1,500 + 12% VAT = ₱1,680
```

**Fee Schedule (fully deterministic):**
| Item | Fee | Validity |
|---|---|---|
| RPAS knowledge exam | ₱230/subject (MC 20-15) | N/A |
| RPAS Controller Certificate application | ₱3,360 | 5 years |
| RPA Registration | ₱1,500 + 12% VAT = ₱1,680 | Annual |
| RPAS training (at approved school) | ₱40,000–₱60,000 | Pre-req |
| Industrial RPA (>150 kg) | Special CofA process | Separate |

**Penalty exposure:**
- Operating without registration: ₱20,000–₱100,000 per violation
- Operating without controller cert: additional penalties under PCAR Part 11

### Who Currently Does This
Third-party CAAP-accredited drone training providers guide applicants through the full compliance process. Training providers (e.g., UAV Philippines, drone academies) charge ₱40,000–₱60,000 for training + certification support. No public CAAP tool shows the decision tree (commercial vs. recreational threshold) or computes total compliance cost for a specific drone use case.

### Market Size
- **Growing rapidly**: Drone industry growing at 15–20% annually in the Philippines
- Commercial drone operators: estimated 2,000–5,000 businesses (agriculture, aerial photography, surveying, infrastructure inspection, delivery)
- Agricultural drone spraying alone: millions of hectares of Philippine farmland → high demand
- Recreational drones (≥7 kg requiring registration): tens of thousands
- Annual RPA registrations processed by CAAP: growing from hundreds to thousands

### Pain Indicators
- **Weight/commercial threshold confusion**: operators don't know if their use case requires registration
- **3-certificate stack**: first-time commercial operators don't realize they need all three
- **Penalty cliff**: ₱20K–₱100K per violation for operating unregistered
- **Multiple visits required**: CAAP Annex Building (Pasay City) in-person process for skills test, registration inspection, and certificate collection — cannot be fully done online
- **RPAS training market fragmented**: 40+ flight schools, varying quality, no standardized cost comparison

### Computability Assessment
**Fully deterministic** (score: 5/5) — The eligibility decision tree (commercial vs. recreational, weight thresholds), fee calculation, and required document checklist are all rule-based with no judgment required. PCAR Part 11 + RPAS Regulations define every condition precisely.

### Opportunity Score Estimate
- Market: 3 (2,000–5,000 commercial operators, growing)
- Moat: 2 (training providers capture advisory role; government fees are public but process is opaque)
- Computability: 5
- Pain: 4 (penalty cliff + 3-cert confusion + in-person requirement)
- **Estimated score: 3.50**

---

## Domain 4: AMT/ATC License Renewal & CPD Tracker

### Description
Aircraft Maintenance Technicians (AMTs), Air Traffic Controllers (ATCs), and other non-pilot aviation personnel have their own CAAP licensing cycles with continuing education requirements. AMT licenses cover specific ratings by aircraft category; ATC licenses require proficiency checks. These renewal windows are calendar-driven and computationally trackable.

### Computation Sketch

**AMT License Renewal (PCAR Part 2 + AMT Board regulations):**
- AMT license by aircraft rating category (airframe, powerplant, avionics, instrument)
- 24-month renewal cycle
- Continuing education requirements by specialty
- Written exam per rating: ₱230/subject (10 subjects for AMT)
- License application fee: ~₱480 (similar to SPL tier)

**ATC License:**
- Written exam: ₱340/subject (6 subjects)
- Proficiency check required every 12 months (PCAR Part 2.30)
- Medical exam requirement: Class 3 CAAP medical

### Who Currently Does This
Aviation maintenance organizations (Part 145 MOs) track their AMTs' license renewal internally. Small operators (charter companies, GA operators) often miss renewal windows — CAAP has no proactive notification system.

### Market Size
- ~3,000–5,000 AMTs in the Philippines (estimated)
- ~2,000+ ATCs (CAAP employs ~1,200; airlines and airport operators employ additional)
- Annual renewal events: 2,000–4,000 per year across all non-pilot aviation personnel

### Computability Assessment
**Mostly deterministic** (score: 4/5) — Renewal deadline is license issue date + 24 months; exam fees are fixed by subject count; proficiency check scheduling depends on CAAP availability.

### Opportunity Score Estimate
- Market: 2 (3,000–5,000 AMTs + ATCs)
- Moat: 2 (organizations manage internally, no significant fixer market)
- Computability: 4
- Pain: 2 (professional organizations manage; lower chaos than individual pilots)
- **Estimated score: 2.50**

---

## Cross-Domain Summary

| Domain | Computability | Market | Moat | Pain | Est. Score |
|--------|--------------|--------|------|------|------------|
| D1: Pilot license pathway | 4 | 2 | 2 | 3 | 2.75 |
| D2: Aircraft airworthiness/reg | 4 | 2 | 3 | 3 | 3.00 |
| D3: RPAS compliance suite | 5 | 3 | 2 | 4 | **3.50** |
| D4: AMT/ATC renewal tracker | 4 | 2 | 2 | 2 | 2.50 |

**Top Opportunity: Domain 3 — RPAS Compliance Suite**

The drone compliance domain is the highest-scoring because:
1. **Growing market**: Philippine commercial drone sector expanding 15–20%/year; agriculture + construction + delivery driving demand
2. **Fully deterministic rules**: commercial/recreational threshold, weight gates (7 kg, 150 kg), 3-cert stack requirements — all defined in PCAR Part 11 with no judgment required
3. **High pain/penalty**: ₱20K–₱100K fines for noncompliance; most operators unaware of 3-cert requirement
4. **No existing tool**: CAAP website has separate pages for each cert type with no unified compliance checker

**Combined D1+D3 "Fly Legal PH" Concept:**
A unified tool serving both aspiring pilots (pathway eligibility + cost calculator) and commercial drone operators (compliance checker + fee estimator) would address both segments with largely overlapping data architecture. The pilot pathway tool has high SEO value (many searches) while the RPAS compliance tool has higher immediate monetization potential (business operators with penalty risk).

---

## Key Statutory References

- RA 9497 Sec. 8 — CAAP functions including registration and certification
- PCAR Part 2, Subpart B (Sec. 2.010–2.040) — pilot license types and requirements
- PCAR Part 2, Sec. 2.050–2.075 — minimum flight hour requirements by license category
- PCAR Part 2, Sec. 2.095 — foreign license validation procedures
- PCAR Part 4, Sec. 4.050 — Certificate of Airworthiness requirements and validity
- PCAR Part 11, Sec. 11.001–11.100 — RPAS regulations, weight classifications, operator and controller requirements
- CAAP MC No. 20-15 (2015) — Airmen Examination Board fee schedule
- CAAP MC No. 018-2023 — Air Navigation Services fee schedule (MTOW-based)
- CAAP RPAS Regulations — Controller cert (₱3,360), Registration (₱1,680), Operator cert

---

## Conclusion

CAAP aviation licensing presents **moderate opportunity** relative to the larger mass-market domains in this atlas (SSS, LTO, PhilHealth). The pilot licensing pathway has lower market breadth (8K+ pilots vs. millions of workers) but the **RPAS/drone compliance suite** is the strongest candidate — growing market, fully deterministic rules, high penalty exposure, and zero existing public compliance tool. A "Drone Compliance PH" tool (decision tree → cert checklist → fee calculator → deadline tracker) is automatable from existing CAAP regulations with no judgment required.

The aircraft airworthiness domain has higher professional fees but narrower market; likely better served as a feature of a broader aviation compliance SaaS targeted at operators and MROs rather than a mass-market consumer tool.
