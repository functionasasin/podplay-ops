# Wave 1 Analysis: PhilHealth Contributions — Philippine Health Insurance Corporation

**Aspect:** `philhealth-contributions`
**Agency:** Philippine Health Insurance Corporation (PhilHealth)
**Governing Law:** Republic Act No. 11223 (Universal Health Care Act of 2019); predecessor RA 7875 as amended by RA 9241 and RA 10606
**Analyzed:** 2026-02-26

---

## Overview

PhilHealth administers the National Health Insurance Program (NHIP) covering ~112 million Filipinos under universal enrollment (RA 11223 Sec. 5). The computation domains span three tiers: (1) **premium contributions** — deterministic salary-based formula with income floor/ceiling, (2) **benefit eligibility** — contribution-count gates with 3-month/6-month/9-month/12-month lookback rules depending on member type, and (3) **case rate reimbursement** — a catalog of ~9,000 fixed amounts by diagnosis/procedure that facilities deduct from member bills. All three tiers are fully deterministic from statute and PhilHealth circulars. No professional discretion is required for the math — the complexity arises from the interaction of contribution history, member category, accreditation status, and the case rate table.

---

## Domains Identified

### Domain 1: Premium Contribution Computation

**Governing Sections:** RA 11223 Sec. 10–11; PhilHealth Advisory PA2025-0002; PhilHealth Contribution Table v2 (2024–2025)

**Computation Sketch:**

Input variables:
- Basic Monthly Salary (BMS) — fixed regular pay excluding allowances, overtime, commissions, bonuses
- Member category: employed / self-employed / voluntary / OFW / kasambahay / senior citizen (govt-subsidized)
- Employment status: determines cost-sharing split

Formula:
1. Total monthly premium = BMS × 5% (premium rate for 2024–2025)
2. Income floor: if BMS < ₱10,000 → use ₱10,000 (minimum premium = ₱500)
3. Income ceiling: if BMS > ₱100,000 → use ₱100,000 (maximum premium = ₱5,000)
4. Cost sharing:
   - Employed: employee pays 2.5%, employer pays 2.5%
   - Self-employed / voluntary / OFW: member pays full 5%
   - Kasambahay earning ≤ ₱5,000/month: employer pays full 5%
   - Senior citizens: government-subsidized; zero contribution
5. Remittance deadline: by day 11–15 (PEN ending 0–4) or day 16–20 (PEN ending 5–9) of the following month
6. Late penalty: 3% per month compounded on unremitted contributions (RA 7875 as amended); criminal penalty for employer non-remittance: ₱50,000–₱100,000 fine + 6–12 months imprisonment (RA 11223 Sec. 44)

**Sample computation:**
- Employed employee, BMS = ₱35,000
  - Total premium: ₱35,000 × 5% = ₱1,750/month
  - Employee share: ₱875
  - Employer share: ₱875
- Self-employed, declared income = ₱8,000 (below floor)
  - Applies floor: ₱10,000 × 5% = ₱500/month (full burden on member)
- OFW, declared income = ₱150,000
  - Applies ceiling: ₱100,000 × 5% = ₱5,000/month

**Who currently does this:** Payroll software (for large companies), HR staff, payroll outsourcing providers (Sprout Solutions, KMC Solutions, Triple i Consulting). For individuals (self-employed, freelancers, OFWs), many DIY through PhilHealth's online portal or branches — with frequent errors in determining the correct BMS base or applicable income floor/ceiling.

**Market size:** 62+ million registered members (2023–2024). ~1.1 million registered employers remitting monthly. ~5M+ self-employed, voluntary, and OFW members computing and paying individually. Estimated ~8–10 million employer-employee premium calculations performed monthly nationwide.

**Professional fee range:** HR/payroll outsourcing including PhilHealth compliance: ₱875–₱1,750/employee/month (full-service). HR compliance audit: ₱25,000–₱150,000 per engagement. PhilHealth-specific standalone computation not retailed as a discrete service — bundled into payroll.

**Pain indicators:** The "BMS only" rule (excluding OT, allowances, commissions) is systematically violated, especially in SMEs that include variable pay. The PEN-based remittance schedule creates confusion. Late penalty (3%/month compounded) accrues silently until PhilHealth audit, creating surprise liabilities. The 50% employer/employee split varies by category (kasambahay rule differs), causing errors. Frequent regulatory changes (annual rate updates from 2019–2025) mean outdated calculators propagate errors widely.

---

### Domain 2: Benefit Eligibility Determination

**Governing Sections:** RA 11223 Sec. 7, 9; PhilHealth Advisory PA2025-0002; PhilHealth Circulars on individual membership categories

**Computation Sketch:**

Eligibility is a function of contribution-count gates that differ by member type:

| Member Type | Eligibility Gate |
|---|---|
| Employed (direct contributor) | ≥ 3 posted monthly contributions within the immediate 6 months before availment |
| Self-employed / voluntary | ≥ 9 monthly contributions within 12 months prior to availment |
| OFW | Within membership validity period of current contract |
| Sponsored / indigent | Eligible upon enrollment; government-subsidized |
| Lifetime member | ≥ 120 cumulative months contributed + reached retirement age → zero further payment |
| Dependent coverage | Must be declared in Member Data Record (MDR); spouse (uninsured), children (under 21 or incapacitated), parents (senior citizens without own coverage) |

Three-step eligibility check:
1. Is the member in an active category? (direct contributor / indirect contributor / lifetime member)
2. Does the member meet the lookback contribution count for the specific benefit type?
3. Is the specific healthcare facility PhilHealth-accredited and the attending physician accredited?

The gates are fully deterministic conditional logic — no professional judgment required for the membership/contribution question. The accreditation check is a database lookup.

**Who currently does this:** PhilHealth offices, HR departments processing employee claims, hospital billing departments (verify membership before filing). Confusion is common — members attempt to claim without meeting the 3-month-in-6-month rule, or without properly declaring dependents in MDR.

**Market size:** 62+ million registered members. Approximately 17 million annual PhilHealth claims filed (implied by ₱164.46 billion total claims in 2024 at average ~₱10K/claim). Each claim triggers an eligibility check.

**Professional fee range:** No discrete market for eligibility verification — this is where PhilHealth's opaque process creates friction. Members who are denied benefits sometimes hire lawyers (₱5,000–₱50,000) or rely on hospital social workers to navigate disputes.

**Pain indicators:** Denial letters are common due to lapsed contributions, undeclared dependents, or non-accredited facilities. The "posted" vs. "paid" distinction creates confusion — contributions deducted but not yet remitted by employer do not count. Members have no real-time visibility into their coverage status without visiting a branch or using the PhilHealth member portal (which is unreliable).

---

### Domain 3: Case Rate Benefit Application and Out-of-Pocket Computation

**Governing Sections:** PhilHealth Circular PC2024-0037 (50% case rate adjustment effective Jan 1, 2025); PC2024-0012 (case rate rules revision); PC2024-0023 (hemodialysis 156 sessions); PC2024-0036 (peritoneal dialysis Z package)

**Computation Sketch:**

Case rate system: ~9,000 medical and procedural case rates, each with a fixed peso amount that PhilHealth pays to the health care facility. The facility deducts the case rate from the total bill before charging the patient.

Patient out-of-pocket = Total Hospital Bill − Case Rate Amount (if eligible, accredited facility)

Key examples (2025 rates after PC2024-0037 50% adjustment):
- Normal spontaneous delivery: ₱9,750 (hospital) / ₱12,675 (non-hospital facility)
- Cesarean section: ₱19,000 (split ₱11,400 facility + ₱7,600 professional fee)
- Hemodialysis: ₱6,350/session × up to 156 sessions/year = ₱990,600 maximum annual benefit
- Percutaneous coronary intervention (angioplasty): ₱524,000 (up from ₱30,000)
- Kidney transplant (living donor): >₱1,000,000; deceased donor: ₱2,140,000
- Fibrinolysis (heart attack): ₱133,500

Second case rate: specific conditions in PC2024-0037 Annex D allow two case rates in one admission — additive computation.

Z Benefits (catastrophic illness packages): covers 20 conditions with annual limits ranging from ₱200,000 (some cancers) to ₱2,140,000 (kidney transplant). Eligibility computation: active membership + no prior Z benefit availment within the qualifying period + accredited Z facility.

**Who currently does this:** Hospital billing departments and PhilHealth liaison officers manually look up the case rate catalog and compute deductions. Patients rely entirely on hospitals to compute this correctly. No patient-facing tool exists to pre-verify expected coverage before hospitalization.

**Market size:** ~17 million claims/year. ~9,000 distinct case rates applicable to common diagnoses. For patients, the lack of pre-hospitalization transparency means they often arrive expecting coverage and discover gaps (non-accredited facility, excluded condition, exceeded benefit limit) only at discharge.

**Professional fee range:** Hospital PhilHealth liaisons handle computation internally. For disputes, patients hire PhilHealth claim processors/expediters (informal fixers): ₱2,000–₱10,000 per contested claim. No formal professional market.

**Pain indicators:** The case rate table is a PDF document — no member-facing calculator exists. The 50% rate adjustment in PC2024-0037 (2025) means most online resources citing old rates are now wrong. The "no co-payment" policy (RA 11223 Sec. 9) is widely violated — hospitals charge extras beyond the case rate, and members don't know their theoretical maximum coverage. The excluded benefits list (Annex C of PC2024-0037 — e.g., cataract, hemodialysis excluded from 50% hike) creates inconsistencies that confuse both patients and healthcare staff.

---

### Domain 4: OFW PhilHealth Contribution and Portability

**Governing Sections:** RA 11223 Sec. 5–6 (universal coverage); OFW-specific implementing rules; PhilHealth foreign posts circular

**Computation Sketch:**

OFW premium = declared monthly income × 5% (floor: ₱500, ceiling: ₱5,000/month)
Annual OFW premium option available: monthly rate × 12 months (one-time annual payment)
Validity: contribution covers member + qualified dependents in the Philippines during the OFW's deployment period

Portability check: OFW on bilateral social security agreement countries (Japan, Korea, US, etc.) — PhilHealth is separate from SSS portability; no bilateral PhilHealth agreement currently. OFW must independently maintain PhilHealth membership.

**Who currently does this:** OFWs paying through PhilHealth accredited collecting agents abroad (banks, remittance centers), PhilHealth foreign posts, or online through the EPRS (Electronic Premium Remittance System). Many OFWs lapse because payment channels abroad are limited.

**Market size:** 2.19 million active OFWs (POEA 2023 data). Each must maintain individual PhilHealth contributions for family coverage in the Philippines.

**Professional fee range:** No dedicated professional service — direct-pay system. DMW/recruitment agencies sometimes assist as part of deployment paperwork. Confusion is high regarding continuing coverage after job change or return to Philippines.

**Pain indicators:** Coverage lapse due to missed OFW contribution is a major pain point — Philippine-based dependents denied benefits during hospitalization when OFW has lapsed. The contribution-history lookback (validity period vs. contribution count) is different from domestic rules and not clearly communicated.

---

## Summary Scores (Preliminary)

| Domain | Market Size | Moat Depth | Computability | Pain | Notes |
|---|---|---|---|---|---|
| 1. Premium Computation | 5 (10M+ calcs/month) | 2 (bundled in payroll tools) | 5 (fully deterministic) | 3 (moderate — common BMS errors) | Strong automation candidate |
| 2. Eligibility Determination | 5 (17M claims/year) | 2 (hospital billers do it) | 4 (deterministic rules, DB lookup) | 4 (opaque, denials common) | High value if combined with real-time MDR API |
| 3. Case Rate Application | 5 (17M claims/year) | 1 (hospital internal process) | 5 (lookup table + arithmetic) | 5 (no patient-facing tool, constant rule changes) | Huge transparency gap |
| 4. OFW Contribution | 4 (2.19M OFWs) | 2 (direct pay, some agents) | 4 (mostly deterministic) | 4 (lapse risk, limited channels) | Niche but painful |

---

## Automation Opportunity Assessment

**Highest value target: Domain 3 (Case Rate Transparency Tool)**

The case rate catalog is ~9,000 line items in a PDF updated by circular. No patient-facing interactive tool exists. A tool that:
1. Accepts diagnosis (ICD-10 code or plain-language condition)
2. Looks up the applicable case rate(s) including second case rate eligibility
3. Shows the Z benefit package maximum if applicable
4. Checks member eligibility (contribution count) via PhilHealth member API
5. Outputs: expected PhilHealth payment, estimated out-of-pocket before hospitalization

...would be the "inheritance engine" equivalent for healthcare billing transparency. It disrupts the information asymmetry between hospital billing departments and patients, and eliminates the need for informal fixers.

**Second value target: Domain 1 + 2 combined (Employer Compliance Dashboard)**

Premium computation is straightforward but error-prone in SMEs. Combining accurate BMS computation, PEN-based remittance scheduling, late-penalty accrual tracking, and contribution-history visualization into one employer tool would address the ₱50K–₱100K criminal penalty exposure for non-compliance. The moat here is weak (payroll tools already exist) but the market is enormous and the tool could be embedded in payroll/accounting SaaS rather than sold standalone.

---

## Sources

- PhilHealth Advisory PA2025-0002 (premium rate CY 2025): https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf
- PhilHealth Contribution Table 2024–2025: https://www.philhealth.gov.ph/partners/employers/ContributionTable_v2.pdf
- PhilHealth Circular PC2024-0037 (50% case rate adjustment): https://www.philhealth.gov.ph/circulars/2024/PC2024-0037.pdf
- Annex A (Medical Case Rates): https://www.philhealth.gov.ph/circulars/2024/0037/AnnexA-ListofMedicalCaseRates.pdf
- PhilHealth Circular PC2024-0023 (hemodialysis 156 sessions): https://www.philhealth.gov.ph/circulars/2024/archives.php
- RA 11223 full text: https://lawphil.net/statutes/repacts/ra2019/ra_11223_2019.html
- PhilHealth Stats & Charts 2024: https://www.philhealth.gov.ph/about_us/statsncharts/SNC2024_1stSem_0830.pdf
- Respicio & Co. commentary on employer non-remittance penalties: https://www.respicio.ph/commentaries/penalties-for-employer-non-remittance-of-philhealth-contributions
- PNA: PhilHealth 2025 benefit expansion: https://www.pna.gov.ph/articles/1241535
