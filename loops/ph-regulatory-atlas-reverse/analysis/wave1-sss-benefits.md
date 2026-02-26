# Wave 1 Analysis: SSS Benefits — Social Security System

**Aspect:** `sss-benefits`
**Agency:** Social Security System (SSS)
**Governing Law:** Republic Act No. 11199 (Social Security Act of 2018), signed February 7, 2019; RA 11210 (Expanded Maternity Leave Law, 2019)
**Analyzed:** 2026-02-26

---

## Overview

The SSS administers 7 distinct benefit types for ~42 million Filipino members, each with its own computation formula derived directly from statutory sections. The computation rules are embedded in RA 11199 Sections 12–14-B and the agency's IRR. No discretion is involved — every benefit is a deterministic function of the member's contribution history (AMSC, MSC, CYS) and the applicable statutory formulas.

---

## Domains Identified

### Domain 1: Monthly Retirement Pension (BMP)

**Governing Sections:** RA 11199 Section 12; SSS Circular No. 2019-002; SSS IRR Rule XII

**Computation Sketch:**

Input variables:
- AMSC (Average Monthly Salary Credit) = higher of (sum of last 60 MSCs ÷ 60) or (all MSCs ÷ total contributions paid)
- CYS (Credited Years of Service) = total contribution years from first to semester of contingency
- Number of qualified dependent children (max 5)

Three-formula comparison — pension = highest of:
1. ₱300 + (20% × AMSC) + (2% × AMSC × [CYS − 10])
2. 40% × AMSC
3. Floor: ₱1,200 if CYS 10–19 years; ₱2,400 if CYS ≥ 20 years

Plus ₱1,000 monthly additional benefit (effective Jan 2017)

Dependent's pension = max(10% × BMP, ₱250) per qualifying child (max 5)

Eligibility gate: Monthly pension requires ≥ 120 monthly contributions; otherwise lump sum = higher of (total contributions paid) or (12 × monthly pension)

Monthly pension option: lump sum option (60 months advance at 90.59% of actuarial value) vs. lifetime monthly

**Sample:** AMSC = ₱20,000, CYS = 25 years:
- Formula 1: ₱300 + ₱4,000 + (₱20,000 × 2% × 15) = ₱300 + ₱4,000 + ₱6,000 = ₱10,300 + ₱1,000 = ₱11,300
- Formula 2: 40% × ₱20,000 = ₱8,000 + ₱1,000 = ₱9,000
- Formula 3: ₱2,400 + ₱1,000 = ₱3,400
- **BMP = ₱11,300/month**

**Who currently does this:** HR departments compute estimates for employees. Retirees often rely on SSS branches. HR consultants and payroll services assist employers. No single professional class exclusively handles this — the complexity causes widespread DIY errors.

**Market size:** 2.2 million active retirement pensioners as of 2023 (₱156.7 billion in annual payments). ~700,000–800,000 new retirements per year approach qualification age. ~42 million cumulative members means a massive pipeline of future retirees needing computation.

**Professional fee range:** Payroll outsourcing including SSS compliance: ₱875–₱1,750/employee/month (full service). HR compliance audits: ₱25,000–₱150,000 per engagement. No specific "retirement benefit calculation" service is commonly retailed — gap exists.

**Pain indicators:** The three-formula comparison is non-intuitive; members consistently miscompute AMSC (60-month lookback rule, semester-of-contingency definition). The 120-contribution threshold for monthly pension vs. lump sum is a cliff-edge decision. The dependent's pension cap (5 children) and the age eligibility rules (60 optional, 65 compulsory) add branching logic that overwhelms most individuals.

---

### Domain 2: Sickness Benefit

**Governing Sections:** RA 11199 Section 14; SSS IRR Rule XIV

**Computation Sketch:**

ADSC = (Sum of 6 highest MSCs in the 12 months immediately before the semester of contingency) ÷ 180

Daily Sickness Allowance (DSA) = 90% × ADSC

Total benefit = DSA × number of compensable days (max 120 days/calendar year; max 240 days for same illness across years)

Qualifying filter: ≥ 3 monthly contributions in the 12-month period immediately before the semester of sickness

Employer-first rule: For home confinement, employer pays first 3 days; SSS covers from day 4 onward (reimbursable from SSS if employer-filed). For hospital confinement, employer reimburses in full then claims from SSS.

Notification deadline: Employee notifies employer within 5 calendar days; employer notifies SSS within 5 days of employer notification.

**Who currently does this:** HR/payroll teams compute the ADSC and DSA. The 12-month lookback and "6 highest MSCs" selection rule is frequently miscalculated when a member has gaps in contributions.

**Market size:** ~5–8 million sickness benefit claims per year (estimated from SSS benefit payment volumes; specific annual count not publicly surfaced but large given 42M members). Sickness benefit is SSS's highest-volume short-term benefit.

**Professional fee range:** Included in payroll outsourcing packages; not separately priced. SME HR outsourcing packages (covering sickness computation + filing): ₱15,000–₱40,000/month.

**Pain indicators:** The "semester of contingency" concept (a two-quarter window) confuses HR staff. Determining which 12-month period to look back from requires understanding the semester definition. The "6 highest MSCs" selection rule means members with irregular income can't just take a simple average. Notification deadlines (5+5 calendar days) carry disqualification risk if missed.

---

### Domain 3: Maternity Benefit

**Governing Sections:** RA 11199 Section 14-A; RA 11210 (Expanded Maternity Leave Law of 2019); DOLE Department Order 14-17; SSS IRR Rule XIV-A

**Computation Sketch:**

ADSC = (Sum of 6 highest MSCs in the 12 months immediately before the semester of childbirth) ÷ 180

Total maternity benefit = 100% × ADSC × compensable days

Compensable days matrix:
- Live birth (normal OR caesarean): 105 days
- Solo parent (live birth): 120 days (RA 11210 + 15-day solo parent extension)
- Miscarriage / Emergency Termination of Pregnancy (ETP) / Stillbirth: 60 days
- No delivery frequency cap (RA 11199 removed the old 4-delivery limit)

Leave sharing: Up to 7 days may be allocated to the father or qualified alternate caregiver (reduces the mother's claimable days accordingly)

Salary differential: Employer must pay the difference between 100% of actual salary and the SSS maternity benefit amount. Micro-enterprises may apply for exemption.

Tax treatment: SSS maternity benefit — not subject to income tax. Salary differential — taxable as employment income.

**Sample:** 6 highest MSCs total = ₱120,000; live birth:
- ADSC = ₱120,000 ÷ 180 = ₱666.67
- SSS benefit = ₱666.67 × 105 = ₱70,000
- If actual monthly salary = ₱30,000 → daily salary = ₱1,000 → 105-day salary = ₱105,000
- Employer salary differential = ₱105,000 − ₱70,000 = **₱35,000**

**Who currently does this:** HR departments handle the maternity notification and SSS filing. The salary differential calculation requires cross-referencing actual salary against SSS computation. CPAs assist with tax treatment of the differential. Frequent errors: misclassifying caesarean as normal delivery (same days now), forgetting leave-sharing deduction, miscalculating the differential taxability.

**Market size:** ~1.6 million live births per year (PSA 2023). ~230,000 miscarriage/ETP cases estimated. All employed mothers (roughly 60–70% of live births given labor force participation) trigger SSS maternity claims: **~960,000–1.1 million maternity benefit claims per year**.

**Professional fee range:** HR compliance services covering maternity processing: ₱15,000–₱50,000/month retainer (SME). No standalone maternity computation product in the market — massive unserved demand.

**Pain indicators:** RA 11210 changed the rules significantly in 2019 (removed normal/C-section distinction, added solo parent extension, added leave sharing) — outdated practices still common. Salary differential tax treatment is a common audit issue. The "who pays first" rule (employer advances, then claims from SSS) creates cash flow confusion for SMEs.

---

### Domain 4: Disability Benefit

**Governing Sections:** RA 11199 Section 13-A; SSS IRR Rule XIII-A; SSS Medical Evaluation Department disability gradings

**Computation Sketch:**

Step 1 — Classify disability type:
- Permanent Total Disability (PTD): lifetime pension
- Permanent Partial Disability (PPD): lump sum or pension depending on contribution history

Step 2 — Determine compensable months (for PPD):
Fixed schedule per body part (e.g., one hand = 39 months, one leg = 46 months, sight of one eye = 25 months). Multiple affected parts: add months (max 75 months aggregate → constitutes PTD at ≥ 75 months)

Step 3 — Compute monthly pension (same three-formula BMP structure):
- Formula 1: ₱300 + (20% × AMSC) + (2% × AMSC × [CYS − 10])
- Formula 2: 40% × AMSC
- Formula 3: ₱1,000/₱1,200/₱2,400 by CYS tier

Plus ₱1,000 additional benefit + ₱500 supplemental allowance (disability-specific)

Step 4 — Monthly pension vs. lump sum determination:
- PTD + ≥ 36 contributions → monthly pension (lifetime)
- PTD + < 36 contributions → lump sum: higher of (monthly pension × contributions paid) or (12 × monthly pension)
- PPD + ≥ 36 contributions + disability period < 12 months → lump sum = monthly pension × compensable months × (designated months ÷ 75)
- PPD + ≥ 36 contributions + disability period ≥ 12 months → monthly pension for duration

Step 5 — Medical evaluation: SSS Medical Evaluation Department must certify disability type and permanence; this is the only non-deterministic step.

**Who currently does this:** The computation itself (once disability is classified) is fully deterministic. But members frequently miscalculate their benefit entitlement or don't know whether monthly pension vs. lump sum is advantageous. Lawyers handle contested disability cases. HR handles employer reporting of work-related incidents.

**Market size:** ~500,000–800,000 disability benefit claims per year (extrapolated from SSS data; disabilities from occupational and non-occupational causes). PPD claims far outnumber PTD claims.

**Professional fee range:** Labor lawyers for contested disability: ₱10,000–₱50,000 per case. HR consultants advising on disability reporting: included in retainer.

**Pain indicators:** The body-part compensation schedule is obscure — most members don't know it exists. The monthly-pension vs. lump-sum trade-off requires present value reasoning that most claimants can't do. The additional ₱500 supplemental allowance and ₱1,000 additional benefit are frequently missed.

---

### Domain 5: Unemployment Benefit (Section 14-B)

**Governing Sections:** RA 11199 Section 14-B (new provision, no prior law equivalent); SSS Circular No. 2019-002

**Computation Sketch:**

Benefit amount = 50% × AMSC × 2 months (paid as one-time lump sum)

AMSC for unemployment = computed from contributions in the 12-month period immediately before the semester of involuntary separation

2025 maximum benefit = 50% × ₱20,000 × 2 = **₱20,000**

Qualifying conditions checklist (all must be true):
1. Age < 60 at time of separation
2. ≥ 36 total monthly contributions
3. ≥ 12 of those contributions within the 18-month period before involuntary separation
4. Involuntary separation (authorized causes or force majeure only — not resignation, not just causes)
5. Claimable only once every 3 years
6. Applied within 1 year of separation date
7. If concurrent with another SSS benefit: only highest benefit is paid

**Who currently does this:** HR departments determine eligibility and assist in separation documentation. Members typically don't know this benefit exists or the involuntary vs. voluntary separation distinction that determines eligibility.

**Market size:** ~500,000–800,000 involuntary separations per year (estimated; PSA employment data shows significant annual job turnover). Benefit awareness remains low — SSS reported lower-than-expected take-up in early years post-RA 11199.

**Professional fee range:** HR consultants advising on proper separation documentation and benefit computation: ₱15,000–₱40,000/month retainer (often bundled). No standalone service.

**Pain indicators:** The "involuntary vs. voluntary" distinction is critical but poorly understood. Members don't know the 1-year filing deadline. The "once every 3 years" limit is not widely publicized. The impact on future retirement benefit (advance deductible from future lump sum) is an additional planning wrinkle.

---

### Domain 6: Funeral Benefit

**Governing Sections:** RA 11199 Section 13-B; SSS Circular revising funeral benefit schedule (effective October 20, 2023)

**Computation Sketch:**

Fixed-tier schedule based on total contributions paid:
- < 36 contributions: ₱12,000 fixed
- ≥ 36 contributions: ₱20,000 to ₱60,000 sliding scale based on AMSC and CYS

Filing window: 4 years from date of death
Claimant: Person who actually paid funeral expenses (not necessarily the legal heir)

**Who currently does this:** Funeral parlors often assist with SSS claim filing. Family members file directly. This is simpler than other benefits.

**Market size:** ~670,000 deaths per year in the Philippines (PSA 2023). Substantial fraction of decedents are SSS members given 42M member base.

**Professional fee range:** Minimal; most funeral parlors assist in filing as a service. Some fixer services charge ₱500–₱2,000 to expedite claims.

**Pain indicators:** Relatively low. The main pain is the sliding scale not being publicly tabulated in a user-friendly way. The "person who paid, not the heir" rule is counterintuitive and causes disputes.

---

### Domain 7: Death Benefit / Survivor's Pension

**Governing Sections:** RA 11199 Section 13; SSS IRR Rule XIII

**Computation Sketch:**

If member paid ≥ 36 contributions → primary beneficiaries receive monthly pension using same BMP formula
If member paid < 36 contributions → lump sum:
- Primary beneficiaries: higher of (monthly pension × contributions paid) or (12 × monthly pension)
- Secondary beneficiaries: higher of 36 × monthly pension (if ≥ 36 contributions) or monthly pension × contributions paid

Beneficiary hierarchy:
- Primary: legal dependent spouse (until remarriage) + legitimate/legitimated/legally adopted/illegitimate dependent children (until age 21 or marriage)
- Secondary: dependent parents (if no primary beneficiaries)
- In absence of any: any entity that shouldered burial expenses (funeral benefit only)

Dependent children's pension: 10% × BMP or ₱250 per child (max 5 children)

13th month pension: additional month of pension each December

**Who currently does this:** Estate lawyers handle contested beneficiary disputes. SSS branch officers process claims. Members don't plan for beneficiary implications of their contribution shortfall (< 36 → lump sum only).

**Market size:** ~670,000 deaths/year; fraction (SSS members) generates death benefit claims. Estimated 200,000–300,000 death benefit claims per year.

**Professional fee range:** Estate attorneys for contested cases: ₱50,000–₱200,000+. Basic claim filing: self-service or fixer ₱1,000–₱5,000.

**Pain indicators:** Determining who qualifies as "primary beneficiary" (legal vs. common-law spouse issues; illegitimate children recognition) is the main source of contested claims. The contribution-count threshold (36 months) as the pension/lump sum cliff is not well understood during the member's lifetime — a planning failure that is irreversible after death.

---

### Domain 8: SSS Contribution Computation and Remittance

**Governing Sections:** RA 11199 Section 4(a)(9); Section 18 (employer's obligation); Section 22 (penalty); Section 28 (criminal liability); SSS Circular 2024-06 (2025 contribution table)

**Computation Sketch:**

Monthly contribution = MSC × contribution rate (employer + employee shares)

MSC determination: Map actual monthly salary to the MSC bracket table (2025: ₱5,000–₱35,000 in ₱1,000 increments)

Regular SS component (on MSC up to ₱20,000):
- Employee share: 5% × MSC (₱20K max)
- Employer share: 10% × MSC (₱20K max) + EC (₱10 or ₱30)

MPF component (on MSC above ₱20,000 up to ₱35,000):
- Employee share: 5% × excess MSC
- Employer share: 10% × excess MSC

Total employer remittance per employee: Regular SS + MPF + EC

Penalty for late/non-remittance: 3% per month (confirmed per current SSS enforcement) on outstanding amount from due date, compounded monthly

Criminal exposure (Section 28): 6 years 1 day to 12 years imprisonment + ₱5,000–₱20,000 fine + personal liability of corporate officers

R-1A filing: Monthly employer contribution report with breakdown per employee

**Who currently does this:** All private-sector employers with even 1 employee. Payroll software (Sprout HR, PayrollHero, etc.) handles this computation, but many SMEs still use manual spreadsheets. Bookkeepers and CPAs assist smaller businesses.

**Market size:** ~1 million+ registered employer accounts; ~47 million employed Filipinos generating contributions. This is a mandatory, recurring, monthly compliance obligation for every employer in the Philippines.

**Professional fee range:** Payroll outsourcing: ₱875–₱1,750/employee/month (full service). SSS compliance audit/delinquency resolution: ₱25,000–₱150,000 per engagement.

**Pain indicators:** The 2025 rate increase (to 15% total) created confusion about the MSC table, the MPF bifurcation, and the EC component. Employers with variable-pay employees (commissions, bonuses) struggle with MSC determination. The 3% per month penalty compounds rapidly — 36 months of delinquency = 108% surcharge on top of unpaid contributions. Criminal liability (personal, non-delegable) is a significant terror point for SME owners who don't know they're exposed.

---

## Opportunity Assessment Summary

| Domain | Market Size | Computability | Pain Score | Moat Depth | Opportunity |
|--------|------------|---------------|------------|------------|-------------|
| Monthly Pension (BMP) | 5 (>1M future retirees) | 5 (fully deterministic) | 4 (3-formula confusion, AMSC lookback) | 3 (HR + CPA handles) | **4.35** |
| Sickness Benefit | 5 (5–8M claims/year) | 4 (6-MSC lookup + semester logic) | 4 (semester confusion + deadline risk) | 2 (payroll software handles) | **3.75** |
| Maternity Benefit | 5 (~1M claims/year) | 4 (ADSC + salary differential) | 4 (post-RA11210 confusion) | 3 (HR + CPA for differential) | **4.05** |
| Disability Benefit | 4 (500K–800K/year) | 3 (deterministic after medical classification) | 4 (body-part table unknown) | 3 (lawyers for contested) | **3.50** |
| Unemployment Benefit | 3 (500K–800K/year, low awareness) | 5 (simple formula, complex eligibility) | 4 (eligibility unknown, deadline) | 2 (self-service if known) | **3.55** |
| Funeral Benefit | 3 (200K–300K/year) | 4 (sliding scale) | 2 (low friction overall) | 1 (parlors assist free) | **2.55** |
| Death Benefit | 4 (200K–300K/year) | 4 (same BMP formula) | 4 (beneficiary disputes, planning) | 3 (lawyers for contested) | **3.75** |
| Contribution Computation | 5 (1M+ employers, monthly) | 5 (fully deterministic from table) | 5 (penalty + criminal exposure) | 3 (payroll software partial) | **4.55** |

*Scoring: Market 1–5, Computability 1–5, Pain 1–5, Moat 1–5; Opportunity = weighted composite*

**Highest opportunity: Contribution Computation (4.55) and Monthly Pension BMP (4.35)**

---

## Automation Opportunity

### The "SSS Engine" Concept

A single statutory computation engine can produce all 8 benefit outputs from a unified member data model:

**Inputs:** Member contribution history (monthly MSC for each month), employment status, salary data, family composition (spouse, children ages), disability classification (if applicable), separation reason

**Computation tree:**
1. Build contribution timeline → compute AMSC, CYS, contribution counts per time window
2. Apply benefit-specific rules (qualifying contribution counts, semester lookbacks, 6-highest-MSC selection)
3. Run three-formula BMP comparison → select maximum
4. Apply benefit-specific rate (90% sickness, 100% maternity, disability schedule)
5. Apply duration rules (max days, calendar year limits, compensable months)
6. Apply dependent additions
7. Apply penalty computation for employer delinquency

**Outputs:** Estimated retirement pension, sickness benefit per claim period, maternity benefit by case type, disability benefit options (pension vs. lump sum comparison), unemployment benefit amount, funeral benefit tier, employer contribution amounts and late penalty computation

**This is like the inheritance engine but for SSS.** The inheritance engine takes estate assets + family relationships → estate tax. The SSS engine takes contribution history + contingency event → benefit entitlement. Same pattern: statute defines deterministic formulas, professionals currently do the computation, and there are millions of annual transactions requiring the same math.

### Comparable Products (Gaps)

- SSS has its own online benefit estimator (limited to retirement pension, no ADSC-based benefits)
- No third-party product exists covering all 8 benefit types with a unified computation model
- No product covers the employer-side penalty computation and criminal exposure calculator
- No product covers the salary differential computation for maternity (employer liability side)

### Professional Moat Disrupted

**HR Consultants:** ₱15,000–₱150,000/month retainers covering SSS compliance computation would be partially displaced for the deterministic computation layer (contribution tables, benefit formulas). The judgment layer (contested disability, beneficiary disputes) remains human.

**Payroll Services:** ₱875–₱1,750/employee/month — SSS computation is a cost driver. A self-service tool reduces dependence on payroll outsourcers for SMEs.

**Fixers:** ₱500–₱5,000 per claim filing — driven by form complexity, not computation complexity. Computation tool reduces filing errors that create fixer dependency.

---

## Sources

- RA 11199 full text: https://lawphil.net/statutes/repacts/ra2019/ra_11199_2019.html
- SSS IRR of RA 11199: https://lawphil.net/statutes/repacts/ra2019/irr_11199_2019.html
- SSS Retirement Benefit: https://www.sss.gov.ph/retirement-benefit/
- SSS Sickness Benefit: https://www.sss.gov.ph/sickness-benefit/
- SSS Maternity Benefit: https://www.sss.gov.ph/maternity-benefit/
- SSS Disability Benefit: https://www.sss.gov.ph/disability-benefit/
- SSS Unemployment Benefit: https://www.sss.gov.ph/unemployment-benefit/
- SSS Funeral Benefit: https://www.sss.gov.ph/funeral-benefit/
- SSS Contribution Table 2025: https://www.sss.gov.ph/sss-contribution-table/
- 2025 contribution table PDF: https://www.sss.gov.ph/wp-content/uploads/2024/12/2025-SSS-Contribution-Table-rev.pdf
- KPMG Flash Alert 2025-026: https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-026.html
- RA 11210 (Expanded Maternity Leave): https://pcw.gov.ph/faq-republic-act-11210/
- SSS H1 2024 membership stats: https://www.sss.gov.ph/news-and-updates/sss-sets-record-high-2-4m-new-members-in-h1-2024/
- PSA Live Births 2023: https://psa.gov.ph/vital-statistics
- GigaBPO outsourcing rates: https://gigabpo.com/outsourcing-rates-in-philippines/
