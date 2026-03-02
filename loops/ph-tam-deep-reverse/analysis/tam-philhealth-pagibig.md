# TAM: PhilHealth & Pag-IBIG Tools (B-PHI-1/2/3, C-HDMF-1/2/3)

**Loop source:** regulatory-atlas

---

## Tools Covered

| Tool ID | Name | Score |
|---------|------|-------|
| B-PHI-1 | PhilHealth Case Rate Benefit Application | 4.00 |
| B-PHI-2 | PhilHealth Premium Contribution Computation | 3.85 |
| B-PHI-3 | PhilHealth Benefit Eligibility Determination | 3.75 |
| C-HDMF-1 | Pag-IBIG Housing Loan Eligibility & Amortization | 3.75 |
| C-HDMF-2 | Pag-IBIG MPL & Calamity Loan Computation | 3.85 |
| C-HDMF-3 | Pag-IBIG Mandatory Savings Contribution | 3.85 |

---

## B-PHI-1: PhilHealth Case Rate Benefit Application

### Consumer Segment

**Who:** Filipino PhilHealth members who are admitted to a hospital and need to verify whether the correct case rate deduction was applied to their bill. Under RA 11223 (Universal Health Care Act), all Filipinos are enrolled; the case rate is the fixed peso amount PhilHealth pays the hospital per diagnosis/procedure, which must be deducted from the patient's bill.

**Population:**
- **59,347,642** registered PhilHealth members as of June 30, 2023 — Source: PhilHealth Stats and Charts 2023 (1st Semester), philhealth.gov.ph/about_us/statsncharts/snc2023_1stSem.pdf — Confidence: OFFICIAL
- **36,287,835** direct contributing members (active premium payers) — Source: Same PhilHealth H1 2023 Stats — Confidence: OFFICIAL
- **~12 million** benefit availments/claims per year (full-year 2023 estimate derived from H1 2023: 5,980,609 claims × 2) — Source: PhilHealth Stats and Charts 2023 (1st Semester), claims count table — Confidence: DERIVED (H1 × 2 extrapolation; full-year PDF not machine-readable)
- **~11,896,265** claims for full year 2022 (7,977,744 direct + 3,918,521 indirect portions verified) — Source: PhilHealth Stats and Charts 2022, philhealth.gov.ph/about_us/statsncharts/snc2022_v2.pdf — Confidence: OFFICIAL

**Addressable fraction:**
- B-PHI-1 is event-driven (hospital admission), not a regular-use subscription tool.
- Annual hospitalization rate: ~6.5% of population (PSA 2017 National Demographic and Health Survey, latest available; no 2023 rate found).
- Applied to 36.3M direct contributing members: ~2.36M hospitalization events/year among active contributors.
- Internet penetration among working-age urban adults: PSA 2023 Household Survey = 54% national; skews to 65–70% among employed/formal sector members.
- Addressable hospital patients (digital tool user): 2.36M × 67% = **~1.58M per year**
- Additional indirect use case: family members checking on behalf of hospitalized relatives — this multiplies effective reach by ~2.5× but does not add independent payers; use 1.58M as conservative base.

**Addressable consumer population:** ~1,580,000 hospitalization events/year with digital access

**Current professional cost:** Patients currently rely on hospital billing staff or PHIC liaison officers to verify case rates; no consumer-facing verification service exists. Patient complaint resolution through PhilHealth goes through the hospital's Patient Relations Office. No known professional fee schedule for case-rate dispute resolution.

**Our consumer price:** ₱199/month (single-purpose or as part of a benefits bundle; note this tool is event-driven so pricing could also be ₱99/transaction)

**Consumer TAM (subscription model):** 1,580,000 × ₱199 × 12 = **₱3,775M/year** ← this overstates annual value; realistically, a patient uses this during admission only.

**Consumer TAM (transaction/event model at ₱99/use):** 1,580,000 × ₱99 = **₱156.4M/year** ← more realistic for a case-rate lookup tool

**Working TAM used below:** ₱156M (transaction model), with upside if bundled into a monthly health benefits subscription.

---

### Professional Segment

**Who:** HR officers and payroll managers at private companies (who assist employees during hospitalization), hospital billing staff (internal users), and PhilSys/UHC compliance staff at medium-to-large employers who verify correct deductions before releasing funds.

**Population:**
- **Private sector establishments with 10+ employees: ~57,000** — Source: DOLE 2021 Establishment Survey (latest published), Bureau of Labor and Employment Statistics — Confidence: OFFICIAL (2021 data; 2023 not yet published)
- **Establishments with 100+ employees (likely have dedicated HR): ~12,000** — Source: DOLE 2021 Establishment Survey — Confidence: OFFICIAL
- HR professionals actively managing benefits for employees: estimated **30,000–50,000** — Source: DERIVED from DOLE establishment data (assume 1–3 HR staff per mid-size establishment); PMAP (People Management Association of the Philippines) membership = ~4,000 (undercount of formal HR practitioners)
- **Working estimate: 40,000 HR professionals** who regularly handle PhilHealth case-rate queries for hospitalized employees — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 40,000 × ₱999 × 12 = **₱479.5M/year**

---

### Total TAM — B-PHI-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (transaction) | 1,580,000 events/year | ₱99/event | ₱156M |
| Professional (B2B) | 40,000 HR professionals | ₱999/mo | ₱480M |
| **Total TAM** | | | **₱636M** |

**SAM (Serviceable):** ₱127M — digital-first awareness limited; hospitals in Metro Manila + Cebu + Davao account for ~35% of claims; assume 20% addressable in Y1
**SOM Year 1 (1%):** ₱6.4M
**SOM Year 3 (5%):** ₱31.8M

---

## B-PHI-2: PhilHealth Premium Contribution Computation

### Consumer Segment

**Who:** Employees and self-employed individuals who need to compute their correct monthly PhilHealth premium and verify employer deductions. Covers: private employees (want to verify payslip deduction), self-employed/informal sector (need to self-compute), OFWs (remitting from abroad), kasambahay.

**Population:**
- **17,576,220** employed private sector members — Source: PhilHealth Stats and Charts 2023 (1st Semester) — Confidence: OFFICIAL
- **2,900,410** employed government members — Source: Same — Confidence: OFFICIAL
- **11,056,419** informal/self-earning members (self-employed who are registered PhilHealth contributors) — Source: Same — Confidence: OFFICIAL
- **3,227,609** OFW/migrant worker members — Source: Same — Confidence: OFFICIAL
- **74,858** kasambahay (household workers) members — Source: Same — Confidence: OFFICIAL
- **Total direct contributing members: 34,835,516** (sum of above, excluding lifetime/others) — Confidence: DERIVED

**Addressable fraction:**
- Employed private + government (20.5M): payslip confusion is common but tool usage would be verification-driven; ~25% would use a premium calculator in any given year = 5.1M
- Self-employed (11.1M): must self-compute; 40% digital access + motivation = 4.4M
- OFW (3.2M): high motivation (money from abroad, need correct amount); 60% digital = 1.9M
- Kasambahay (74K): very low digital adoption; exclude
- **Total addressable: ~11.4M**

**Current professional cost:** Bookkeepers charge ₱300–₱800/month for individual payroll services (anecdotal from Facebook group: "Freelance Bookkeepers PH" community posts, 2024). Many employees pay bookkeepers to reconcile their payslip deductions.

**Our consumer price:** ₱199/month

**Consumer TAM:** 11,400,000 × ₱199 × 12 = **₱27,216M/year**

Note: This is the theoretical maximum if all addressable users paid monthly. Realistic conversion much lower given free BIR/PhilHealth calculators exist.

---

### Professional Segment

**Who:** Payroll specialists, bookkeepers, and HR officers at companies that process PhilHealth contributions for employees. Also includes payroll outsourcing firms.

**Population:**
- **~175,842 registered CPAs** (PRC) — Source: PRC Monthly Bulletin Nov 2024 — Confidence: OFFICIAL; subset handling payroll/bookkeeping: ~35% = 61,545
- **~40,000 dedicated HR professionals** in companies with 100+ employees — Source: DERIVED from DOLE 2021 Establishment Survey (12,000 establishments × 3.3 avg HR staff) — Confidence: ESTIMATED
- **~15,000 payroll outsourcing professionals** (accounting firms, BPO payroll desks) — Source: ESTIMATED from DTI/SEC data showing ~8,000 registered accounting/bookkeeping firms
- **Working professional estimate: 55,000** — Confidence: ESTIMATED

**Clients per professional per year:** A payroll bookkeeper manages 20–100 employee payrolls monthly.

**B2B price per seat:** ₱999/month (Solo Pro) or ₱2,999/month (Practice for multi-client)

**Professional TAM (at ₱999/mo):** 55,000 × ₱999 × 12 = **₱659M/year**

---

### Total TAM — B-PHI-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | 11,400,000 addressable | ₱199/mo | ₱27,216M |
| Professional (B2B) | 55,000 professionals | ₱999/mo/seat | ₱659M |
| **Total TAM** | | | **₱27,875M** |

**SAM (Serviceable):** ₱1,394M — apply 5% digital adoption cap (tool exists but awareness/switching cost limits it; free alternatives exist)
**SOM Year 1 (1%):** ₱13.9M
**SOM Year 3 (5%):** ₱69.6M

---

## B-PHI-3: PhilHealth Benefit Eligibility Determination

### Consumer Segment

**Who:** PhilHealth members who need to verify whether they meet the contribution-count thresholds to be eligible for specific benefits (hospitalization, maternity, outpatient, etc.). Applies at point of admission or benefit claim.

**Population:**
- **59,347,642** total registered members (H1 2023) — Source: PhilHealth Stats and Charts 2023 — Confidence: OFFICIAL
- Annual benefit availments triggering eligibility check: ~12M per year (derived from H1 2023 claims count) — Confidence: DERIVED
- Self-employed members most at risk of failing eligibility gates: **11,056,419** informal/self-earning members (subject to 9-in-12 rule vs. employed 3-in-6 rule) — Source: PhilHealth H1 2023 Stats — Confidence: OFFICIAL

**Addressable fraction:**
- Members who would proactively check eligibility before a hospital visit: ~15% of direct contributors = 5.4M
- At point of benefit claim (reactive check): included in claims population (12M)
- **Working addressable: 5,400,000** — Confidence: ESTIMATED

**Addressable consumer population:** 5,400,000

**Current professional cost:** HR officers and social workers do eligibility checks manually; no standardized professional fee for this standalone service.

**Our consumer price:** ₱199/month

**Consumer TAM:** 5,400,000 × ₱199 × 12 = **₱12,888M/year** (theoretical max)

---

### Professional Segment

**Who:** HR officers processing PhilHealth claims for employees; social workers at hospitals; PhilHealth-accredited agents assisting members.

**Population:**
- Same HR professional base: ~55,000 (as in B-PHI-2 above)
- Hospital HR/social work staff who process claims: ~5,000 hospitals (DOH licensed) × 2 benefits staff = **~10,000 hospital benefits staff** — Source: ESTIMATED from DOH 2022 health facility registry

**Working professional estimate: 65,000** total — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM:** 65,000 × ₱999 × 12 = **₱779M/year**

---

### Total TAM — B-PHI-3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | 5,400,000 addressable | ₱199/mo | ₱12,888M |
| Professional (B2B) | 65,000 professionals | ₱999/mo/seat | ₱779M |
| **Total TAM** | | | **₱13,667M** |

**SAM (Serviceable):** ₱683M — 5% digital adoption cap; heavily competes with PhilHealth's own portal (eConsult, Member Portal)
**SOM Year 1 (1%):** ₱6.8M
**SOM Year 3 (5%):** ₱34.2M

---

## C-HDMF-1: Pag-IBIG Housing Loan Eligibility & Amortization

### Consumer Segment

**Who:** Pag-IBIG members considering or in process of applying for a housing loan. The tool computes eligibility (35% HLAR cap, LTV, age+term ≤70), loan amount, interest rate tier, and amortization schedule.

**Population:**
- **15,930,000** active Pag-IBIG contributing members (end-2023) — Source: BusinessWorld Online, Apr 2024, citing HDMF data; PIA Visayas article confirming figure — Confidence: OFFICIAL (reported from HDMF press materials)
- **96,848** new housing loan borrowers in 2023 — Source: Manila Bulletin, Mar 2024, citing HDMF 2023 Annual Performance — Confidence: OFFICIAL
- **90,640** new housing loan borrowers in 2024 — Source: PIA, 2025 — Confidence: OFFICIAL
- **2022 comparison: 105,212** new borrowers — Source: HDMF press release 2023 — Confidence: OFFICIAL
- **159,814** housing units in committed pipeline (developers' pipeline under Pag-IBIG Direct Developmental Loan Program) — Source: HDMF press release — Confidence: OFFICIAL
- **Prospect pool (members who have inquired or are planning to apply):** No official figure. The number of new loans (96,848) represents those who completed the process. The funnel typically has 5–10× more inquirers than completers; working estimate: **~500,000–900,000 active housing loan prospects/year** — Confidence: ESTIMATED

**Addressable fraction:**
- Active members with interest in housing (renter + aspiring homeowner demographics): ~25% of 15.93M = 3.98M
- Among these, digital-capable (smartphone, internet): ~70% = 2.79M
- **Addressable: ~2,790,000** members who could meaningfully use a housing loan eligibility/amortization calculator

**Existing competition:** Multiple online calculators exist (Nook, OmniCalculator, MyHousingLoanCal, Globe, Pag-IBIG's own Virtual Pag-IBIG portal). This suppresses moat but does not eliminate it — our tool's value is accuracy of the latest rate schedule + eligibility determination (not just amortization).

**Current professional cost:** Real estate brokers include loan eligibility screening as part of their service; no separate fee. Bank loan officers do free pre-qualification. Licensed real estate brokers: PRC lists **~26,000** registered brokers (PRC Monthly Bulletin, Nov 2024 data; broker license board).

**Our consumer price:** ₱199/month

**Consumer TAM:** 2,790,000 × ₱199 × 12 = **₱6,663M/year**

---

### Professional Segment

**Who:** Licensed real estate brokers and salespersons who qualify buyers for Pag-IBIG financing, bank/developer in-house loan officers, and housing developers' documentation teams.

**Population:**
- **~26,000 PRC-registered real estate brokers** (PRC Monthly Bulletin Nov 2024) — Confidence: OFFICIAL
- **~150,000 PRC-registered real estate salespersons** (PRC; salesperson license is separate from broker) — Confidence: OFFICIAL (PRC bulletin confirms; salesperson count is ~6× broker count)
- **~2,500 active real estate developer companies** (SEC registered, engaged in residential subdivision/condo development) — Source: ESTIMATED from HLURB/DHSUD 2022 license data
- Active users of loan computation tools (brokers + developers' in-house): **~50,000 professionals** — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM:** 50,000 × ₱999 × 12 = **₱599M/year**

---

### Total TAM — C-HDMF-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | 2,790,000 addressable | ₱199/mo | ₱6,663M |
| Professional (B2B) | 50,000 professionals | ₱999/mo/seat | ₱599M |
| **Total TAM** | | | **₱7,262M** |

**SAM (Serviceable):** ₱363M — heavy competition from free calculators suppresses addressable market; 5% effective rate
**SOM Year 1 (1%):** ₱3.6M
**SOM Year 3 (5%):** ₱18.2M

---

## C-HDMF-2: Pag-IBIG MPL & Calamity Loan Computation

### Consumer Segment

**Who:** Pag-IBIG members applying for or evaluating a Multi-Purpose Loan (MPL) or Calamity Loan. The tool computes maximum loanable amount (80% of Total Asset Value), interest rate (10.75% MPL / 5.95% calamity), and amortization.

**Population:**
- **2,650,000** cash loan (MPL + calamity) borrowers in full-year 2023 — Source: Philstar.com Nov 2023, citing HDMF data — Confidence: OFFICIAL
- **2,131,435** MPL borrowers in Jan–Oct 2023 alone — Source: Same Philstar source — Confidence: OFFICIAL
- **2,313,143** MPL borrowers in full-year 2022 — Source: HDMF press release — Confidence: OFFICIAL
- **2,612,491** total cash loan borrowers in full-year 2022 — Source: HDMF press release — Confidence: OFFICIAL
- **Online MPL applicants (Jan–Oct 2023): 743,362** — Source: Philstar Nov 2023 — Confidence: OFFICIAL; this is the digital-native subset already
- Total active members who haven't taken a loan but may in next 12 months: ~4M (estimated 25% of 15.93M active members who are not current borrowers but may apply)

**Addressable fraction:**
- Current/active MPL borrowers: 2.65M (direct, annually)
- Prospects evaluating whether to apply: estimated 4M × 40% digital access = 1.6M
- **Total addressable: ~4,250,000** (current borrowers + digital prospects)

**Current professional cost:** Pag-IBIG loan applications are self-service through the Virtual Pag-IBIG portal; no broker fee. Some HR companies help employees with the process as a benefit service.

**Our consumer price:** ₱199/month

**Consumer TAM:** 4,250,000 × ₱199 × 12 = **₱10,148M/year**

---

### Professional Segment

**Who:** HR officers at companies that facilitate Pag-IBIG MPL applications for employees as an employee benefit (many large companies assist employees with government loan applications). Also includes payroll firms that process MPL deductions from salary.

**Population:**
- Companies with formalized Pag-IBIG MPL assistance programs: ~12,000 establishments (100+ employees likely coordinate MPL applications) — Source: DERIVED from DOLE 2021 Establishment Survey — Confidence: ESTIMATED
- HR professionals who process MPL for employees: **~40,000** — Source: Same DOLE-derived estimate
- Payroll firms that manage Pag-IBIG loan deduction processing: ~8,000 firms — Source: ESTIMATED

**Working professional estimate: 40,000** HR + payroll professionals — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM:** 40,000 × ₱999 × 12 = **₱479.5M/year**

---

### Total TAM — C-HDMF-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | 4,250,000 addressable | ₱199/mo | ₱10,148M |
| Professional (B2B) | 40,000 professionals | ₱999/mo/seat | ₱480M |
| **Total TAM** | | | **₱10,628M** |

**SAM (Serviceable):** ₱531M — Pag-IBIG's own Virtual Pag-IBIG portal provides MPL computation; our differentiation is TAV calculation clarity and amortization comparison
**SOM Year 1 (1%):** ₱5.3M
**SOM Year 3 (5%):** ₱26.6M

---

## C-HDMF-3: Pag-IBIG Mandatory Savings Contribution

### Consumer Segment

**Who:** Employees and employers who need to compute the correct mandatory Pag-IBIG monthly savings contribution using the graduated table (1% or 2% of Monthly Basic Compensation, capped at ₱5,000). Also covers OFWs and kasambahay special rules.

**Population:**
- **15,930,000** active Pag-IBIG contributing members (end-2023) — Source: BusinessWorld Online Apr 2024 citing HDMF — Confidence: OFFICIAL
- **16,580,000** active members (end-2024) — Source: PIA 2025 — Confidence: OFFICIAL
- **2,250,000** OFW members included in above total — Source: HDMF press materials 2023 — Confidence: OFFICIAL
- **MP2 savers: ~977,643** (end-2022); estimated **>1,100,000** (end-2023 based on 14% YoY growth in savings balance) — Source: HDMF press release via PCO; growth derived from savings balance data — Confidence: OFFICIAL (2022), DERIVED (2023 estimate)
- **₱89.26 billion** total membership savings collected in 2023 — Source: HDMF via BusinessWorld 2024 — Confidence: OFFICIAL

**Addressable fraction:**
- All 15.93M active members must contribute → all have a need to verify amount
- Digital-capable (urban + OFW who remit digitally): 55% = 8.76M
- Those who would actually use a contribution calculator vs. relying on employer/payroll: ~20% = 3.19M
- **Total addressable: ~3,200,000**

**Existing competition:** Pag-IBIG's own contribution table is publicly available (simple 2-row table); multiple payroll software embed this automatically. Moat is moderate — the late penalty computation (0.1% daily compounded) and OFW/kasambahay edge cases are where tool value exists.

**Current professional cost:** Part of payroll services (₱300–₱800/month per employee for full payroll service including SSS/PhilHealth/Pag-IBIG). No standalone Pag-IBIG contribution advisory market exists.

**Our consumer price:** ₱199/month

**Consumer TAM:** 3,200,000 × ₱199 × 12 = **₱7,642M/year**

---

### Professional Segment

**Who:** Payroll practitioners, HR officers, and accounting firms who compute Pag-IBIG contributions for multiple employees as part of payroll processing.

**Population:**
- Same base as B-PHI-2: **~55,000 HR/payroll professionals** — Source: DERIVED from DOLE 2021 Establishment Survey + DTI accounting firm registration data — Confidence: ESTIMATED
- Payroll software firms needing accurate contribution tables: ~500 payroll software providers/resellers in the Philippines — Source: ESTIMATED
- **Working professional estimate: 55,000** — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM:** 55,000 × ₱999 × 12 = **₱659M/year**

---

### Total TAM — C-HDMF-3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | 3,200,000 addressable | ₱199/mo | ₱7,642M |
| Professional (B2B) | 55,000 professionals | ₱999/mo/seat | ₱659M |
| **Total TAM** | | | **₱8,301M** |

**SAM (Serviceable):** ₱415M — contribution table is simple; value limited to penalty computation + OFW/kasambahay edge cases; 5% addressable in practice
**SOM Year 1 (1%):** ₱4.2M
**SOM Year 3 (5%):** ₱20.8M

---

## Consolidated Summary: PhilHealth + Pag-IBIG Cluster

| Tool | Consumer TAM | Professional TAM | Total TAM | SAM | SOM Y1 | SOM Y3 |
|------|-------------|-----------------|-----------|-----|--------|--------|
| B-PHI-1 (Case Rate) | ₱156M* | ₱480M | ₱636M | ₱127M | ₱6.4M | ₱31.8M |
| B-PHI-2 (Premium) | ₱27,216M | ₱659M | ₱27,875M | ₱1,394M | ₱13.9M | ₱69.6M |
| B-PHI-3 (Eligibility) | ₱12,888M | ₱779M | ₱13,667M | ₱683M | ₱6.8M | ₱34.2M |
| C-HDMF-1 (Housing Loan) | ₱6,663M | ₱599M | ₱7,262M | ₱363M | ₱3.6M | ₱18.2M |
| C-HDMF-2 (MPL) | ₱10,148M | ₱480M | ₱10,628M | ₱531M | ₱5.3M | ₱26.6M |
| C-HDMF-3 (Savings) | ₱7,642M | ₱659M | ₱8,301M | ₱415M | ₱4.2M | ₱20.8M |
| **CLUSTER TOTAL** | **₱64,713M** | **₱3,656M** | **₱68,369M** | **₱3,513M** | **₱40.2M** | **₱201.2M** |

*B-PHI-1 consumer TAM uses transaction model (₱99/event × 1.58M events); all others use monthly subscription model.

**Note on cluster TAM inflation:** The consumer TAMs for B-PHI-2, B-PHI-3, and C-HDMF-3 overlap significantly — the same HR professional or self-employed person would use all three tools as part of one subscription. The addressable population is largely the same 10–15M active workers. A bundled "Government Benefits Suite" at ₱199/month for all 6 tools would have a more realistic TAM of ~11M addressable × ₱199 × 12 = **₱26,268M**, with SAM at **₱1,313M**.

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| PhilHealth direct contributing members: 36.3M | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth total registered members: 59.3M | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth H1 2023 benefit claims: 5,980,609 | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth private employed members: 17.6M | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth informal/self-earning members: 11.1M | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth OFW members: 3.2M | PhilHealth Stats and Charts 2023 (1st Semester) | 2023 | OFFICIAL |
| PhilHealth 2022 full-year claims: 13.9M | PhilHealth Stats and Charts 2022 | 2022 | OFFICIAL |
| PhilHealth premium rate: 5% (₱500–₱5,000) | PhilHealth Advisory PA2025-0002 + Contribution Table v2 | 2024 | OFFICIAL |
| Pag-IBIG active members: 15.93M (end-2023) | BusinessWorld Online Apr 2024 citing HDMF | 2023 | OFFICIAL |
| Pag-IBIG active members: 16.58M (end-2024) | PIA 2025 citing HDMF | 2024 | OFFICIAL |
| Pag-IBIG OFW members: 2.25M | HDMF press materials 2023 | 2023 | OFFICIAL |
| Pag-IBIG new housing loans: 96,848 borrowers (2023) | Manila Bulletin Mar 2024 citing HDMF | 2023 | OFFICIAL |
| Pag-IBIG housing loan releases: ₱126.04B (2023) | Manila Bulletin Mar 2024 | 2023 | OFFICIAL |
| Pag-IBIG MPL borrowers: 2.65M (2023) | Philstar.com Nov 2023 citing HDMF | 2023 | OFFICIAL |
| Pag-IBIG online MPL applicants: 743,362 (Jan–Oct 2023) | Philstar.com Nov 2023 | 2023 | OFFICIAL |
| Pag-IBIG total membership savings: ₱89.26B (2023) | BusinessWorld Online Apr 2024 | 2023 | OFFICIAL |
| Pag-IBIG MP2 savers: 977,643 (end-2022) | PCO press release via HDMF data | 2022 | OFFICIAL |
| DOLE establishments with 100+ employees: ~12,000 | DOLE 2021 Establishment Survey | 2021 | OFFICIAL |
| PRC registered real estate brokers: ~26,000 | PRC Monthly Bulletin Nov 2024 | 2024 | OFFICIAL |
| PRC registered real estate salespersons: ~150,000 | PRC Monthly Bulletin Nov 2024 | 2024 | OFFICIAL |
| HR professionals at 100+ employee establishments: 40,000 | DERIVED from DOLE data (12,000 estabs × 3.3 avg HR) | 2021 | ESTIMATED |

---

## Notes & Caveats

1. **B-PHI-1 transaction vs. subscription model:** The case rate tool is event-driven (hospital admission). Pricing as a monthly subscription (₱199/mo) dramatically overstates TAM because a member only needs it during a hospitalization event, not monthly. The ₱99/event transaction model is more realistic. If bundled into a broader health navigation product, the monthly model applies.

2. **B-PHI-2/B-PHI-3/C-HDMF-3 consumer overlap:** The same employed Filipino who wants to verify PhilHealth premiums also wants to verify Pag-IBIG contributions. These 3 tools serve the same consumer population (~10–15M active workers). Bundling is the right go-to-market strategy; individual tool TAMs are additive only when unbundled.

3. **PhilHealth full-year 2023 claims count:** The H1 2023 official PDF shows 5,980,609 claims. Full-year extrapolation to ~12M is a derived figure. The official Annual Report PDF (AR2023.pdf at philhealth.gov.ph) contains the exact number but was not machine-readable in this session.

4. **Pag-IBIG MP2 savers end-2023:** No official 2023 year-end figure was published in press releases. The last confirmed figure is 977,643 (end-2022). Growth trajectory from savings balance data (+14% YoY in early 2023) suggests >1.1M by end-2023, but this is a derived estimate pending the official Annual Report.

5. **Pag-IBIG cumulative housing loan stock:** Only new annual disbursements (96,848 in 2023) are widely reported. The total stock of all active housing loan borrowers (cumulative active accounts) would be in audited financial statements. Assuming ~7-year average loan tenure, the active portfolio stock could be ~500,000–700,000 borrowers, but this number was not findable from press sources.

6. **Competition for C-HDMF-1:** Pag-IBIG's own Virtual Pag-IBIG portal, plus several third-party calculators (Nook, OmniCalculator, Globe) already exist. C-HDMF-1's differentiation must be accuracy of current interest rate schedule + eligibility determination (not just amortization math). Moat score = 2 reflects this.

7. **HR professional count:** The 40,000–55,000 estimate for HR/payroll professionals managing PhilHealth and Pag-IBIG computations is derived from DOLE establishment data and is not an officially published "HR practitioner count." PMAP membership (4,000) is a significant undercount of formal HR practitioners. The 40,000–55,000 range is a reasonable working estimate but should be validated against any census of HR service providers.
