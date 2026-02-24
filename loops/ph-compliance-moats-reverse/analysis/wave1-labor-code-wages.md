# Wave 1 Analysis: Labor Code — Wages and Conditions of Employment

**Aspect:** labor-code-wages
**Sources:** Labor Code PD 442 Book III (Art. 82-134), DOLE Wage Orders, PD 851 (13th Month Pay), RA 10653 (Tax Exemption)
**Date analyzed:** 2026-02-24

---

## Overview

Labor Code Book III governs conditions of employment for private-sector employees: normal hours, overtime, night differential, weekly rest, holiday pay, service incentive leave, and 13th month pay. The key characteristic of this domain is that virtually every computation rule is **fully deterministic** — specific percentage multipliers defined by statute that stack across dimensions (day type × overtime status × time of day). This creates a combinatorial complexity that routinely trips up employers but is mechanically solvable.

Coverage (Art. 82): All employees in establishments, **except** managerial employees and specified exempt categories (field personnel, establishments with <10 employees for some benefits).

---

## Domains Identified

---

### Domain 1: Multi-Factor Payroll Premium Computation

**Description:** Computation of premium pay rates when multiple factors apply simultaneously — overtime, holiday type, night shift, and rest day status all modifying the base rate through compounding multipliers.

**Governing sections:**
- Art. 83 — Normal hours of work (8 hours/day standard)
- Art. 86 — Night shift differential: +10% for each hour worked 10 PM – 6 AM
- Art. 87 — Overtime: +25% on regular day; +30% on rest day or holiday (on top of the applicable day rate)
- Art. 91 — Weekly rest day: at least 24 consecutive hours every 6 days
- DOLE Omnibus Rules, Book III — Implements the rate tables

**Full rate matrix:**

| Scenario | Rate |
|---|---|
| Regular day, regular hours | 100% |
| Regular day, overtime (>8 hrs) | 125% |
| Rest day, first 8 hours | 130% |
| Rest day, overtime | 130% × 130% = 169% |
| Special non-working day, first 8 hrs | 130% |
| Special non-working day + rest day | 150% |
| Regular holiday, not worked (present prev. day) | 100% |
| Regular holiday, first 8 hours worked | 200% |
| Regular holiday + rest day, first 8 hours | 260% (200% × 130%) |
| Regular holiday, overtime | 260% (200% + 30% of 200%) |
| Night shift (10PM–6AM), any scenario | +10% of applicable rate |
| Regular holiday + OT + night shift | ~286% of base hourly rate |

**Computation sketch:**
- Input: employee daily/monthly rate, schedule (regular/rest day), date (holiday classification), hours worked (including hours after 8th), hours within 10PM–6AM window
- Output: total gross pay for the period, itemized by premium type
- The DOLE-required payslip must itemize each premium component separately

**Who currently does this:** HR staff, payroll officers, outsourced payroll providers, and in many SMEs, the business owner manually. The multi-factor stacking (holiday × overtime × night shift) is the most error-prone element. Many small employers simply guess or undercount.

**Market size:** ~38 million private-sector employees in the Philippines (PSA Labor Force Survey 2024, total employed 50.19M, Services + Industry sectors). Payroll is computed at least monthly, more often semi-monthly or bi-weekly. Employers range from household-scale (kasambahay) to large corporations.

**Professional cost range:**
- Payroll outsourcing BPO: USD $20–$250 per employee per month (~₱1,160–₱14,500)
- Cloud HR/payroll software: ₱400–₱2,000 per employee per month
- In-house HR payroll specialist salary: ₱19,000–₱29,000/month (cost spread across all employees managed)

**Pain indicators:**
- Holiday pay and overtime premium stacking is one of the most-cited sources of DOLE violations
- The Philippine holiday calendar includes 12 regular holidays + up to 8-10 special non-working days per year (some proclamation-added), requiring constant calendar updates
- Wage orders change by region and sector — as of July 2025, NCR non-agriculture minimum is ₱695/day; agriculture/smaller firms ₱658/day — different from other regions
- Confusing "double holiday" scenarios (e.g., when two holidays fall on the same day, rate discussions remain contentious)

**Computability:** ★★★★★ Fully deterministic. Every rate is a statutory fraction or percentage. The only judgment call is holiday classification (handled by official proclamations, which are publicly available and dateable).

---

### Domain 2: 13th Month Pay Computation

**Description:** Mandatory annual benefit under PD 851, equal to 1/12 of total basic salary earned in the calendar year. Requires pro-rating for partial-year employees, identifying what counts as "basic salary" (excluding allowances, OT, bonuses), and applying the RA 10653/TRAIN Law tax-exemption threshold (₱90,000).

**Governing sections:**
- PD 851 (1975) — Mandates 13th month pay for all rank-and-file private sector employees who worked at least 1 month
- RA 10653 — Tax exemption ceiling (amended to ₱90,000 by TRAIN Law)
- DOLE Labor Advisory No. 18 series — Annual implementation guidelines

**Formula:**
```
13th Month Pay = Total Basic Salary Earned in Calendar Year ÷ 12
```
For partial year: `(Monthly Basic Pay × Months Worked) ÷ 12`

**Basic salary vs. excluded items:** Basic salary includes fixed monthly pay, integrated allowances (if part of contractual pay), and commissions that form part of the basic pay structure. Excluded: OT pay, cost-of-living allowances (COLA), profit-sharing bonuses, Christmas bonuses, productivity bonuses.

**Tax treatment:** Exempt up to ₱90,000 combined with other benefits. Excess is subject to withholding tax.

**Who currently does this:** Every private employer with rank-and-file employees — done by HR/payroll staff. DOLE requires annual compliance report due January 15. Common violations: late payment (must be paid by December 24), incorrect base computation, exclusion of qualified employees.

**Market size:** Every private-sector rank-and-file employee — roughly 30-35 million workers. Approx. 1 million+ registered private employers (estimate based on SSS and BIR registrant data). Each employer must compute, pay, and report annually.

**Professional cost range:** Usually bundled into payroll processing fees. Standalone computation is rarely billed separately, but errors trigger back-pay claims + DOLE penalties.

**Pain indicators:**
- One of the most-reported DOLE violations every year
- "Basic salary" definition creates disputes (what to include/exclude)
- Pro-rating formula confuses small employers (employee who joined in October gets 3/12 of their monthly pay × 3 ÷ 12 = 1/4 of one monthly salary)
- Tax exemption ceiling interaction with withholding adds a BIR layer

**Computability:** ★★★★☆ Mostly deterministic. The only judgment element is the "basic salary" inclusion/exclusion question, which has been clarified by DOLE opinions but still generates disputes at the margins.

---

### Domain 3: Service Incentive Leave (SIL) Monetization

**Description:** Mandatory 5 days annual leave under Art. 95, available after 1 year of service. Unused days must be converted to cash at year-end or upon separation. Computation involves determining eligibility, pro-rating accrual, and computing cash equivalent.

**Governing sections:**
- Art. 95 — Service Incentive Leave: 5 days per year for employees with ≥1 year of service
- Art. 95(b) — Unused SIL must be converted to cash equivalent

**Formula:**
```
Cash Equivalent = Unused SIL Days × Daily Basic Wage Rate
Daily Rate = Monthly Basic Salary ÷ Number of Working Days in Month (commonly 22 or 26)
```

**Exclusions from SIL:** Managerial employees, field personnel, establishments with <10 employees, government employees, employees already receiving ≥5 days annual leave benefit.

**Tax treatment:** Starting January 6, 2026, monetized unused leave up to 12 days is a de minimis benefit (exempt from withholding). Excess is taxable.

**Market size:** All private-sector rank-and-file employees with ≥1 year of service. Separation from employment triggers mandatory computation. Millions of employment separations occur annually.

**Computability:** ★★★★☆ Mostly deterministic. Pro-rating for partial years and final pay computation are fully algorithmic. Exclusion determination (field personnel, managerial) requires some classification judgment.

---

### Domain 4: Final Pay Computation (Separation / Resignation)

**Description:** Upon separation (voluntary resignation, authorized termination, retirement, end of contract), employers must pay final wages including: (a) unpaid salary/wages up to last day, (b) pro-rated 13th month pay, (c) cash conversion of unused SIL, (d) separation pay if applicable (labor-code-termination aspect), (e) any other unpaid benefits. DOLE requires final pay released within 30 days of separation.

**Governing sections:**
- DOLE Labor Advisory No. 06-20 — Final Pay guidelines (30-day release rule)
- Art. 95 — SIL conversion
- PD 851 — Pro-rated 13th month
- Art. 287 + RA 7641 — Separation/retirement pay (addressed in labor-code-termination)

**Formula:**
```
Final Pay = Unpaid wages
           + Pro-rated 13th month pay (months worked / 12 × monthly basic)
           + Unused SIL cash value (unused days × daily rate)
           + Any other unpaid allowances/benefits
           [+ Separation pay if applicable]
```

**Pain indicators:**
- DOLE LA 06-20 introduced the 30-day release rule (2020), increasing employer awareness and deadline pressure
- Contested final pay is a major source of NLRC (National Labor Relations Commission) cases
- Small employers routinely fail to include pro-rated 13th month or SIL conversion in final pay
- "Clearance" process adds friction — many employers withhold final pay pending clearance, which DOLE has clarified is not a valid reason to delay

**Computability:** ★★★★★ Fully deterministic given clean inputs (employment dates, salary records, leave balances, absence records). All components are statutory formulas.

**Market size:** The Philippines has high labor mobility, with millions of employment separations per year across BPO, retail, food service, construction, and domestic work sectors.

---

### Domain 5: Regional Minimum Wage Compliance Calculator

**Description:** Philippine minimum wage is set by region via Regional Tripartite Wages and Productivity Board (RTWPB) orders. Different rates apply by: region, sector (agriculture vs. non-agriculture), and establishment size. Employers must verify compliance with applicable rate. Workers can check if they're receiving lawful wages.

**Governing sections:**
- Art. 99 — Regional Minimum Wage Law; wage-setting authority delegated to Regional Tripartite Wages and Productivity Boards
- RA 6727 (Wage Rationalization Act) — Framework for regional wage boards
- Individual Wage Orders (e.g., NCR Wage Order No. 26 effective July 18, 2025: ₱695/day non-agri, ₱658/day agri/small establishments)

**Computation sketch:**
- Input: region, sector/industry, establishment size (employee count), employment date
- Output: applicable minimum daily wage, effective date, COLA components, compliance check against current pay rate

**Market size:** 5.2 million workers affected by 2025 wage increases across 14 regions. Every private employer must comply. Different rates per region create compliance burden for multi-site employers.

**Professional cost range:** Compliance audits for labor standards bundled into legal/HR retainers at ₱15,000–₱50,000/month. DOLE labor standards inspections can trigger back-pay awards.

**Computability:** ★★★★★ Fully deterministic. Wage order text specifies exact amounts. The data retrieval (current applicable rate) is the main engineering challenge, not the math.

---

### Domain 6: Mandatory Government Contribution Computation (SSS / PhilHealth / Pag-IBIG)

**Description:** Three mandatory contributions apply to private-sector employees: (1) SSS — Social Security System contribution based on graduated monthly salary credit table; (2) PhilHealth — 5% of basic monthly salary, split 50/50 between employer and employee, capped; (3) Pag-IBIG (HDMF) — 1-2% of monthly basic salary (employee) + matching or higher employer share, with a ₱5,000 cap on the salary base for standard computation.

**Governing sections:**
- RA 11199 (Social Security Act of 2018) — SSS contribution schedule; current 2025 rate: 14% of monthly salary credit (MSC), with MSC ranging ₱4,000–₱30,000 in graduated brackets (employee: 4.5%, employer: 9.5%)
- RA 11223 (Universal Health Care Act) — PhilHealth: 5% of monthly basic salary, employee 2.5% + employer 2.5%, minimum MSC ₱10,000, maximum ₱100,000
- RA 9679 (Home Development Mutual Fund Law) — Pag-IBIG: 1% employee + 2% employer for ≤₱1,500 salary; 2% employee + 2% employer for >₱1,500 salary; monthly contribution ceiling applies to ₱5,000 wage base (max employee share ₱100/month for standard)

**Note:** This domain overlaps significantly with the DOLE compliance aspect planned for later scanning. The computation rules are primarily from the agencies (SSS, PhilHealth, Pag-IBIG), not strictly the Labor Code — flagging for deduplication in Wave 2.

**Computability:** ★★★★★ Fully deterministic. All three agencies publish contribution tables and formulas. The SSS table has graduated brackets; PhilHealth is a straight percentage with floor/ceiling; Pag-IBIG is a tiered percentage. All are updateable as regulations change.

**Market size:** Applies to every private-sector employer-employee pair. ~38 million private sector workers × 3 agencies × monthly computation = enormous compliance volume.

**Professional cost range:** Bundled into payroll processing. Errors in remittance trigger penalties: SSS penalty is 3% per month on delinquent amount; PhilHealth and Pag-IBIG have similar penalty structures.

---

## Key Findings

### The "Payroll Calculator" Domain

The most compelling opportunity in this wave is **multi-factor payroll premium computation** — the combinatorial holiday × overtime × night differential matrix. This is where complexity explodes for small employers:

- A single employee working an 8-hour night shift on a regular holiday earns 200% base × 10% NSD = 220% of their normal rate for those hours. Add overtime beyond 8 hours and it reaches ~260% + 10% = 286%.
- The Philippine public holiday calendar changes annually (some days are movable, some are proclamation-added), meaning rate tables must be updated each year.
- There are 17 officially recognized holidays (12 regular + 5 special non-working), plus proclamation-based additions (~2-5 per year), plus regional holidays.

The inheritance engine analogy: **This is exactly the inheritance engine problem.** The Civil Code defines exact fractional shares; the Labor Code defines exact percentage multipliers. Both require multi-dimensional lookups (heirs × estate types vs. day types × hours × shift windows) but are ultimately arithmetic.

### Market Size Context

The payroll computation domain has far larger market size than estate/inheritance:
- Inheritance affects ~1M cases/year (mortality × estate complexity)
- Payroll computation affects ~1 million+ employers × monthly cycles = ~12 million+ computation events per year
- BPO industry alone (1.4M workers, predominantly night shift) faces NSD computation on nearly every payroll run

### Competition Landscape

Unlike the inheritance domain where no major digital tool exists, payroll software (Sprout Solutions, Salarium, Sweldo) already addresses basic computation. However:
- Most tools charge ₱400–₱2,000/employee/month — expensive for micro-SMEs
- The compliance check layer (am I paying the right minimum wage? am I correctly computing 2024 Holiday X?) is poorly served
- A **free, self-serve, statutory-grounded payroll compliance checker** would address the bottom of the market
- The final pay computation tool (for separated employees) is almost entirely unserved — workers cannot verify their final pay without professional help

---

## Domains Flagged for Cross-Reference

- **SSS/PhilHealth/Pag-IBIG contributions**: Will appear in `dole-compliance` aspect; note for deduplication in Wave 2
- **Withholding tax on compensation**: Covered in `nirc-income-tax` aspect (already analyzed); critical payroll output but not a Labor Code domain
- **Separation pay / retirement pay**: Will be covered in `labor-code-termination` aspect; final pay computation here is upstream of that

---

## Summary Table

| Domain | Governing Law | Market Size | Pro Cost | Computability | Pain Score |
|---|---|---|---|---|---|
| Multi-factor payroll premiums | Art. 83-87, 91 Labor Code | 38M employees, 1M+ employers | ₱400-₱2K/emp/mo (software) | 5/5 | 4/5 |
| 13th month pay | PD 851, RA 10653 | All private rank-and-file (~30M) | Bundled in payroll | 4/5 | 4/5 |
| SIL monetization | Art. 95 Labor Code | All tenured employees | Bundled in payroll | 4/5 | 3/5 |
| Final pay computation | DOLE LA 06-20 | Millions of separations/year | Contested via NLRC | 5/5 | 5/5 |
| Minimum wage compliance check | RA 6727, Wage Orders | 5.2M directly benefited by recent hikes | ₱15K-₱50K retainer | 5/5 | 3/5 |
| Mandatory contributions (SSS/PhilHealth/Pag-IBIG) | RA 11199, RA 11223, RA 9679 | All employees/employers | Bundled in payroll | 5/5 | 3/5 |
