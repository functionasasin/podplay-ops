# Wave 1 Analysis: TESDA National Certificate & Skills Certification
**Aspect:** `tesda-nc-certification`
**Agency:** Technical Education and Skills Development Authority (TESDA)
**Governing Law:** RA 7796 (Technical Education and Skills Development Act of 1994), RA 8545 (GASTPE Act — PESFA), RA 10931 (UAQTEA), RA 7685 (Tulong Trabaho)
**Date Analyzed:** 2026-02-27

---

## Agency Overview

TESDA regulates and administers technical-vocational education and training (TVET) in the Philippines. It promulgates Training Regulations (TRs) for over 230 qualifications across 18 sectors, accredits assessment centers and TVET institutions, and manages multiple scholarship programs. Its Competency Assessment and Certification System (PTCACS) issues National Certificates (NC I–IV) and Certificates of Competency (COC) to workers who pass standardized evaluations.

**Key statistics (2023):**
- 1,633,393 TVET enrollees; 1,428,724 graduates (87.5% completion rate)
- 935,978 assessment applicants; 872,016 certified (93% pass rate)
- ~14,000 registered TVET programs across 18 sectors
- NC/COC valid for 5 years → accumulated active NC base of ~4M+ workers
- ₱1B+ TWSP budget (₱2.6B peak); ~200K+ scholarship beneficiaries/year

---

## Computation-Heavy Sections Identified

### A. Assessment Fee Schedule (RA 7796, TESDA Board Resolution — Promulgated Assessment Fees, updated periodically)

The TESDA Board promulgates an official fee schedule per qualification title. Fees are determined by materials cost + assessor professional fee. Structure:

- **Fee range:** ₱400 (Bread & Pastry Production NC II) to ₱3,723 (SMAW NC III, welding)
- **Processing fee:** flat ₱35.00 collected by TESDA Provincial/District Office on top of assessment fee
- **Breakdown by sector (sample):**
  | Qualification | Fee |
  |---|---|
  | SMAW NC III | ₱3,723 |
  | SMAW NC II | ₱2,697 |
  | SMAW NC I | ₱2,234 |
  | Electrical Installation & Maintenance NC III | ₱1,896 |
  | Electrical Installation & Maintenance NC II | ₱1,849 |
  | Driving NC III (with vehicle) | ₱2,164 |
  | Automotive Servicing NC II (Electrical) | ₱1,421 |
  | Cookery NC II | ₱1,300 |
  | Agricultural Crops Production NC II | ₱995 |
  | Food and Beverage Services NC II | ₱882 |
  | Early Childhood Care & Development NC III | ₱881 |
  | Housekeeping NC II | ₱1,108 |
  | Trainers Methodology Level I | ₱3,323 |
  | Dressmaking NC II | ₱1,348 |
  | Bread and Pastry Production NC II | ₱400 |
  | Food Processing NC II | ₱500 |

- **Late fee / surcharge:** No late penalty on assessment itself; penalty applies to TVET institutions that operate unregistered programs (₱2,000–₱10,000 fine + 2 years imprisonment under Education Act of 1982)
- **Assessment center markup:** Private accredited centers may add overhead (materials, facilities, models). A typical bundled cost: ₱400–₱1,500 assessment fee + ₱850 center overhead = ₱1,250–₱2,350 total paid to center

**Computability:** FULLY DETERMINISTIC — pure lookup table (qualification title → official fee). Total cost = TESDA promulgated fee + ₱35 processing fee. Centers may add overhead but must show official receipt itemization.

### B. Training Support Fund (TSF) — Scholarship Allowance (TESDA Circular No. 001-2019, RA 7685)

Under TWSP and PESFA scholarship programs, enrolled scholars receive a daily Training Support Fund:

- **TSF rate:** ₱160/day × actual number of training days
- **Disbursement:** 2 tranches:
  - Tranche 1 (50%): after first 2 weeks of training
  - Tranche 2 (50%): when scholar reaches 80% of total training duration
- **PESFA book allowance:** ₱2,000 for bundled programs; ₱500 for non-bundled (single-qualification) programs
- **PESFA student allowance:** ₱60/day (separate from TSF; covers basic subsistence)
- **PPE allowance:** ₱500 one-time (New Normal implementation)
- **Internet/data allowance:** ₱500 one-time (New Normal implementation)

**Sample computation:**
- SMAW NC II training (480 hours ÷ 8 hours/day = 60 training days)
- TSF = ₱160 × 60 = ₱9,600 total
- Tranche 1 = ₱4,800 (after 2 weeks = 10 days)
- Tranche 2 = ₱4,800 (when ≥ 48 days attended out of 60)
- Total TWSP scholar value: ₱9,600 TSF + free assessment (₱2,697) + free training = ~₱30,000+ in benefits

**Computability:** FULLY DETERMINISTIC from circular parameters: TSF = ₱160 × days; tranche triggers at 2 weeks and 80% attendance threshold.

### C. PESFA Scholarship Eligibility (RA 8545 Sec. 8, TESDA Circular PESFA 2017)

PESFA targets marginalized students with an explicit income threshold:

- **Eligibility threshold:** Annual family income ≤ ₱300,000
- **Verification documents (any one):**
  - BIR Annual ITR for prior year
  - BIR Certificate of Exemption from Income Tax Filing
  - Certificate of Indigency from Mayor, CSWDO, or Barangay Captain
- **Priority groups** (tiebreaker for limited slots):
  1. PWDs (Republic Act 7277)
  2. Indigenous Peoples (IPRA beneficiaries)
  3. 4Ps beneficiaries (RA 11310)
  4. Solo parents and children (RA 8972)
  5. OFW families (RA 10022)
- **Age requirement:** ≥15 years old at start of training
- **Education requirement:** Completed at least 10 years of basic education (Grade 10 or ALS completion)

**Computability:** MOSTLY DETERMINISTIC — income ≤ ₱300,000 is a binary threshold check from documents. Priority group ranking is a rule-based hierarchy. No judgment component.

### D. TWSP Scholarship Eligibility (RA 7685, TESDA Circular No. 001-2019)

TWSP is TESDA's main scholarship stream for job-linked training. Eligibility:

- **Age:** ≥18 years old
- **Education:** Completed high school OR ALS
- **Citizenship:** Filipino
- **Exclusion:** Not currently a beneficiary of another government educational scholarship/subsidy
- **Priority sectors:** IT-BPM, semiconductor/electronics, automotive, logistics, tourism, agri-fishery, general infrastructure, healthcare

**Computability:** MOSTLY DETERMINISTIC — age threshold + exclusion check + sector priority lookup. No income threshold for TWSP (means-neutral).

### E. UTPRAS Program Registration Fees (TESDA Circular No. 017-00 as amended)

For TVET institutions (TVIs) registering programs:

- **Application fee:** ₱1,000 per program (paid upon filing Letter of Application)
- **Registration fee:** ₱1,000 per program (paid upon issuance of CoPR)
- **Total per program:** ₱2,000 for initial registration
- **Re-registration (for program updates/changes):** Same ₱2,000 process
- **Accreditation levels (voluntary above registration):**
  - Bronze → Silver → Center of TVET Program Excellence
  - Each level has criteria scoring (leadership, planning, processes, performance) — not pure formula, involves auditor judgment

**Penalty for unregistered operation:** ₱2,000–₱10,000 fine + up to 2 years imprisonment (Education Act of 1982)

**Computability:** MOSTLY DETERMINISTIC for registration fees (flat ₱1,000 + ₱1,000). Accreditation level criteria are judgment-based (auditor assessment), not computationally deterministic.

### F. NC Validity and Re-assessment Scheduling (TESDA Board Resolution)

- **NC/COC validity:** exactly 5 years from date of issuance
- **Re-assessment:** Worker must pass competency assessment again within 5-year window to renew NC
- **Grace period:** None specified — expired NC = loss of certified status
- **Registry lookup:** TESDA Online Registry of Certified Workers (searchable by name, certificate number, or qualification)

**Computability:** FULLY DETERMINISTIC — expiry date = issuance date + 5 years. No formula variation.

---

## Domain Analysis

### Domain 1: TESDA Assessment Cost & Qualification Finder

**Description:** A tool that takes a worker's target qualification (e.g., "SMAW NC II") and outputs: official TESDA-promulgated assessment fee + ₱35 processing fee + nearest accredited assessment centers + expected total out-of-pocket cost (including any center overhead).

**Governing sections:** RA 7796 Sec. 22–23 (assessment and certification mandate), TESDA Board Resolution — Promulgated Assessment Fees (updated ~annually)

**Computation sketch:**
- Input: qualification title / sector / NC level
- Lookup: TESDA Promulgated Assessment Fee table
- Output: Official fee + ₱35 processing + list of accredited centers with address/contact
- Optional: "Scholarship path" — check if TWSP/PESFA slot available for this qualification

**Who currently does this:** Workers navigate TESDA's website to find PDF fee schedules; many rely on hearsay or call assessment centers directly. No aggregated tool exists.

**Market size:** 935,978 assessments/year (2023 data); growing trend toward ~1.2M/year by 2025

**Professional fee range:** No specialist; costs to worker are ₱400–₱3,723 (assessment) + overhead markup at centers. Information moat only — no lawyer/CPA intermediary.

**Pain indicators:**
- Fee schedule only available as PDF on TESDA website (last updated Sept 2020 or Jan 2021)
- Fee varies dramatically by qualification (9x range from ₱400 to ₱3,723)
- Center overhead can add ₱500–₱1,500 on top of official fee with no pre-disclosure
- Workers often discover at the center that they need additional materials fees

**Pain score:** 2/5 (mildly annoying; information available on TESDA website but fragmented)
**Moat depth:** 1/5 (no professional middleman; purely informational)
**Market size score:** 5/5 (>1M/year)
**Computability:** 5/5 (fully deterministic lookup table)
**Opportunity score:** (5×0.25) + (1×0.25) + (5×0.30) + (2×0.20) = 1.25 + 0.25 + 1.50 + 0.40 = **3.40**

---

### Domain 2: TESDA Scholarship Eligibility & Benefit Calculator

**Description:** A tool that helps a prospective TVET scholar determine: (1) which TESDA scholarship programs they qualify for based on age, income, education, and citizenship; (2) how much TSF/allowance they would receive for a specific training program; (3) whether they are excluded by concurrent scholarship enrollment.

**Governing sections:** RA 7796 Sec. 18 (scholarship authority), RA 8545 Sec. 8 (PESFA income threshold), RA 7685 (Tulong Trabaho/TWSP), TESDA Circular No. 001-2019 (Omnibus Guidelines for TWSP, STEP, PESFA, UAQTEA)

**Computation sketch:**
- Input: age, education level, citizenship, annual family income, current scholarship enrollment status, target qualification (for training duration)
- Logic tree:
  - TWSP: age ≥18 AND Filipino AND high school/ALS grad AND not enrolled in other gov't scholarship → eligible
  - PESFA: age ≥15 AND Filipino AND ≥10 years basic education AND income ≤ ₱300,000 → eligible
  - Priority ranking: PWD > IP > 4Ps > solo parent > OFW family > general
- Output: TSF benefit = ₱160 × training days + any book/PPE/data allowances; tranche schedule

**Who currently does this:** TESDA district offices process applications; guidance inconsistently provided; many workers unaware of eligibility or of competing programs.

**Market size:** 200K–350K scholarship beneficiaries/year; ~20M Filipino youth (18–35) who could potentially qualify for TWSP

**Professional fee range:** No specialist; administrative at TESDA offices. Opportunity is pure information aggregation.

**Pain indicators:**
- Multiple overlapping programs (TWSP, PESFA, STEP, UAQTEA) with different rules
- Income documentation requirements unclear to first-time applicants
- TSF payment schedule (2 tranches) poorly communicated → scholars unaware when to expect disbursement
- Scholarship slots are limited and quota-based; early applicants win

**Pain score:** 3/5 (confusing multi-program landscape; income documentation confusion)
**Moat depth:** 2/5 (TESDA staff nominally navigate this; but no real specialist class)
**Market size score:** 4/5 (500K–1M potential annual users)
**Computability:** 4/5 (income threshold + age/education gates + TSF formula are deterministic; priority ranking adds minor complexity)
**Opportunity score:** (4×0.25) + (2×0.25) + (4×0.30) + (3×0.20) = 1.00 + 0.50 + 1.20 + 0.60 = **3.30**

---

### Domain 3: NC Expiry Tracker & Re-assessment Reminder

**Description:** A tool for workers to register their NC/COC issuance dates and receive automated reminders as their 5-year validity period approaches expiration. Includes lookup against TESDA's Online Registry and assessment center locator for re-assessment.

**Governing sections:** RA 7796 Sec. 22 (NC validity), TESDA Board Resolution on PTCACS certification validity period (5 years)

**Computation sketch:**
- Input: NC certificate number or worker name + qualification
- Lookup: TESDA Online Registry of Certified Workers (or manual entry of issuance date)
- Computation: Expiry date = issuance date + 5 years (exact, no rounding)
- Output: Days until expiry, earliest re-assessment date, nearest assessment centers for that qualification

**Who currently does this:** Workers track this themselves; TESDA doesn't proactively notify. Expired NCs discovered only when presenting to employer or overseas recruiter.

**Market size:** ~4M–5M active NCs in circulation (cumulative 5-year window of ~1M/year certifications). ~800K–1M NCs expire annually and need renewal.

**Professional fee range:** None; this is a reminder/calendar tool. Moat is TESDA's own inertia in not building this.

**Pain indicators:**
- No TESDA notification system for expiring NCs
- Expired NC discovered at job application or immigration checkpoint = immediate income risk
- Workers in seasonal employment (OFWs, construction) particularly vulnerable to expiry between contracts

**Pain score:** 3/5 (moderate; discovered pain points at high-stakes moments — job application/deployment)
**Moat depth:** 1/5 (no professional middleman; information moat only)
**Market size score:** 5/5 (>1M affected annually)
**Computability:** 5/5 (fully deterministic: issuance date + 5 years)
**Opportunity score:** (5×0.25) + (1×0.25) + (5×0.30) + (3×0.20) = 1.25 + 0.25 + 1.50 + 0.60 = **3.60**

---

### Domain 4: UTPRAS Institution Registration & Compliance Navigator

**Description:** A B2B tool for TVET institutions to understand UTPRAS registration requirements, compute registration fees per program portfolio, generate compliance checklists by Training Regulation, and track accreditation renewal timelines.

**Governing sections:** RA 7796 Sec. 20 (program registration authority), TESDA Circular No. 017-00 (UTPRAS Omnibus Guidelines), TESDA UTPRAS fee schedule (₱1,000 application + ₱1,000 registration per program), Education Act of 1982 Sec. 28 (unregistered operation penalties)

**Computation sketch:**
- Input: TVI type (public/private), program portfolio (list of qualifications to register), sector
- Computation: Total registration cost = (₱1,000 + ₱1,000) × number of programs = ₱2,000 × n
- Penalty exposure: ₱2,000–₱10,000 fine per unregistered program (computable range)
- Output: Total fees, compliance checklist per TR, compliance calendar for accreditation renewal

**Who currently does this:** TESDA district offices; some TVIs hire accreditation consultants to navigate UTPRAS application. No standardized fee for consultants.

**Market size:** ~14,000+ registered TVET programs across ~5,000+ TVIs

**Professional fee range:** Accreditation consultants for Bronze/Silver/CoE designation: ₱10,000–₱50,000 per engagement (estimated; no public data found). Registration alone is self-service at ₱2,000/program.

**Pain indicators:**
- 5,561 programs audited in 2024; 98% compliant → 112 found non-compliant → potential ₱224K–₱1.12M in penalties
- Multiple Training Regulations updated frequently → TVIs must track TR changes
- Accreditation (voluntary but competitively important for scholarship accreditation) requires auditor documentation

**Pain score:** 3/5 (multi-step compliance; penalty cliff for unregistered operation)
**Moat depth:** 2/5 (some consultant moat for accreditation, not for basic registration)
**Market size score:** 2/5 (10K–100K institutional users, not mass consumer)
**Computability:** 4/5 (registration fee formula is fully deterministic; accreditation level criteria involve some auditor judgment)
**Opportunity score:** (2×0.25) + (2×0.25) + (4×0.30) + (3×0.20) = 0.50 + 0.50 + 1.20 + 0.60 = **2.80**

---

## Summary Rankings (this aspect)

| Rank | Domain | Score | Key Insight |
|------|--------|-------|-------------|
| 1 | NC Expiry Tracker & Re-assessment Reminder | **3.60** | 4M+ active NCs, 5-year clock fully deterministic, no existing notification system |
| 2 | Assessment Cost & Qualification Finder | **3.40** | 935K+ assessments/year, fee table is deterministic, fragmented PDF-only access |
| 3 | Scholarship Eligibility & Benefit Calculator | **3.30** | 4 overlapping programs, ₱300K income threshold + TSF formula, ~200K-350K scholars/year |
| 4 | UTPRAS Institution Compliance Navigator | **2.80** | B2B niche, 14K programs, flat ₱2K/program fee deterministic, accreditation = judgment |

---

## Key Finding: Low Professional Moat

TESDA's compliance ecosystem notably lacks a professional intermediary class. Unlike BIR (CPAs), LTO (fixers), MARINA (crewing agents), or PAGCOR (gaming lawyers), no specialists charge recurring fees to navigate TESDA certification. The primary value of a TESDA-focused tool would be **information aggregation and eligibility matching**, not disrupting a professional moat.

This makes TESDA domains lower-scoring than other atlas entries despite large market size. The **highest-opportunity play** would be a combined product:

**"SkillsPath PH"** — A career pathing tool that:
1. Takes worker's current skills/experience as input
2. Identifies which NC would most improve their employability/wage prospects (using TESDA demand data by sector)
3. Computes total cost of acquiring that NC (assessment fee + training cost)
4. Checks TWSP/PESFA scholarship eligibility → computes net cost
5. Shows nearest accredited assessment centers and training centers
6. Tracks NC expiry and triggers re-assessment reminders

This integrated tool addresses all 4 domains, serves ~40M working-age Filipinos and returning OFWs seeking skills certification, and is fully computable from TESDA's publicly available data. Monetization: employer B2B (recruiters pay for certified worker matching) or freemium consumer (basic free, premium career planning).

---

## Sources
- RA 7796 (Technical Education and Skills Development Act of 1994)
- RA 8545 (Expanded GASTPE Act — PESFA)
- TESDA Circular No. 001-2019 (Omnibus Guidelines for TWSP, STEP, PESFA, UAQTEA)
- TESDA Circular No. 017-00 (UTPRAS Omnibus Amendatory Guidelines)
- TESDA Promulgated Assessment Fees (September 2020 / January 2021)
- TESDA Annual TVET Statistics 2023
- PNA: "TESDA reports over 1.2M tech-voc grads, 872K certified workers" (2024)
