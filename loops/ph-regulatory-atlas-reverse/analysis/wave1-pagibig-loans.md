# Wave 1 Analysis: pagibig-loans
## Pag-IBIG / HDMF (RA 9679) — Contributions, Loans & Savings

**Governing Law:** Republic Act No. 9679 — Home Development Mutual Fund Law of 2009
**Regulatory Agency:** Home Development Mutual Fund (HDMF / Pag-IBIG Fund)
**Date Analyzed:** 2026-02-26

---

## Background

Pag-IBIG Fund is one of three mandatory social insurance funds in the Philippines (alongside SSS and PhilHealth). It operates a mutual savings system leveraging member contributions to offer affordable housing loans and short-term cash loans, with dividends credited annually. As of 2024: **16.58 million active members**, ₱129.73B in housing loans released to 90,616 homes, ₱70.33B in cash loans to 3.2M+ members, ₱132.81B in membership savings collected. Total Fund assets exceed ₱1.2 trillion.

---

## Domains Identified

---

### Domain 1: Mandatory Savings Contribution Computation

**Description:** Graduated contribution rates tied to monthly compensation, with employer/employee splits, floor/ceiling caps, special rules for kasambahays and OFWs, and daily penalty for late employer remittance.

**Governing Sections:**
- RA 9679, Sections 4–7 (Coverage and Mandatory Membership)
- RA 9679, Section 9 (Monthly Savings)
- HDMF Circular No. 274 (Feb 2024) — raised MFS ceiling from ₱5,000 to ₱10,000
- RA 10361 (Domestic Workers Act / Batas Kasambahay) — kasambahay special rates

**Computation Sketch:**

| Monthly Compensation | Employee Rate | Employer Rate | Employee Cap | Employer Cap |
|---|---|---|---|---|
| ₱1,500 and below | 1% | 2% | — | — |
| ₱1,500.01 – ₱10,000 | 2% | 2% | — | — |
| Above ₱10,000 | Capped | Capped | ₱200 | ₱200 |

*Effective Feb 2024:* Maximum Fund Salary (MFS) = ₱10,000; max employee contribution = ₱200/month; max employer contribution = ₱200/month.

Penalty for late employer remittance = **1/10 of 1% per day** of unpaid contributions (RA 9679, Sec. 22).

Special rules:
- **OFW members:** Full 2% of declared earnings; no employer counterpart (self-employed rate)
- **Kasambahay earning < ₱5,000/month:** Employer pays full contribution; no employee share
- **Kasambahay earning ≥ ₱5,000/month:** Standard 2%/2% split applies
- **Self-employed/voluntary:** 2%–4% depending on income bracket, self-shouldered

Inputs → **Employee MS**, **Employer Counterpart**, **Penalty Amount**

**Who currently does this:** HR departments, payroll software (automated for larger firms), manual computation for SMEs; OFWs and self-employed often miscalculate their contribution tier.

**Rough Market Size:** 16.58M active members (2024); ~1.5M employers remitting contributions; ~600K+ OFWs enrolled in Pag-IBIG

**Professional Fee Range:** Included in general payroll/HR outsourcing (₱500–₱3,000/month per employer for full payroll services). Errors lead to late penalties (1/10 of 1%/day) which can accumulate significantly.

**Pain Indicators:**
- Employers frequently under-remit by not tracking the Feb 2024 ceiling increase
- OFWs uncertain about their applicable rate
- Kasambahay rules differ from standard employment rules
- Penalty computation requires tracking exact days of delay

**Computability:** Fully deterministic. Exact rates and thresholds defined in RA 9679 + circulars.

**Opportunity Score Estimate:**
- Market: 5 (16.58M members affected)
- Moat: 2 (payroll software exists, but OFW/kasambahay edge cases poorly served)
- Computability: 5 (fully statutory formula)
- Pain: 3 (moderate; confusion at ceiling changes, kasambahay rules)
- **Weighted Score: ~3.65**

---

### Domain 2: Multi-Purpose Loan (MPL) & Calamity Loan Computation

**Description:** Short-term member loans computed as 80% of Total Accumulated Value (TAV); combined MPL + Calamity Loan ceiling also at 80% TAV; monthly amortization via standard annuity formula; penalty at 1/20 of 1%/day.

**Governing Sections:**
- RA 9679, Section 17 (Short-Term Loans)
- HDMF Circular No. 56-I (MPL Guidelines — Non-IISP branches)
- HDMF MPL Guidelines (Amended, available on Pag-IBIG website)
- HDMF Calamity Loan Program Guidelines (HDMF Circular on CLP)

**Computation Sketch:**

**TAV** = Σ(Employee Monthly Savings) + Σ(Employer Counterpart) + Σ(Annual Dividends credited)

**Loanable Amount** = min(80% × TAV, ₱6M ceiling for MPL)

For existing loans:
**Net Loanable Amount** = (80% × TAV) − Outstanding Loan Balance(s) [MPL + Calamity combined]

**Monthly Amortization (MPL):**
- Interest Rate: 10.75% p.a. (fixed)
- Term: 24 months (or up to 36 months)
- Formula: M = P × [r(1+r)^n] / [(1+r)^n – 1]
  where r = 10.75%/12 = 0.896%, n = 24 or 36

**Calamity Loan:**
- Interest Rate: 5.95% p.a. (lowest Pag-IBIG loan rate)
- Term: 24 months; 3-month grace period
- Same annuity formula as MPL

**Penalty for late payment:** 1/20 of 1% per day (= 0.05%/day) on the outstanding unpaid amount

**Who currently does this:** Pag-IBIG branches compute this during loan processing; members often cannot pre-compute their entitlement or projected amortization

**Rough Market Size:** 3.2M+ cash loan borrowers in 2024 (₱70.33B disbursed)

**Professional Fee Range:** No professional intermediary typically involved; members go directly to Pag-IBIG. Pain is informational—borrowers can't self-compute eligibility upfront.

**Pain Indicators:**
- TAV is not easily visible until queried online; members don't know their loanable amount in advance
- Combined MPL + Calamity ceiling confuses members with both loans active
- Penalty accumulates at 1/20 of 1%/day (= 18.25%/year equivalent) — punishing for delayed payments
- Loan renewal after 6 months adds another computation step

**Computability:** Fully deterministic (once TAV is known, all downstream computations are formula-driven).

**Opportunity Score Estimate:**
- Market: 5 (3.2M+ borrowers/year)
- Moat: 2 (no specialized intermediary, but information gap is real)
- Computability: 5 (fully formula-driven)
- Pain: 3 (TAV opacity; combined ceiling confusion)
- **Weighted Score: ~3.65**

---

### Domain 3: Housing Loan Eligibility & Monthly Amortization

**Description:** Multi-step computation: income-based maximum loan (HLAR 35% rule), LTV ratio cap, interest tier by loan amount, annuity amortization, age+term ≤70 cap, Mortgage Redemption Insurance (MRI) + Fire Insurance premiums. Special Affordable Housing track at 3% for borrowers earning ≤ ₱15,000 (NCR) / ≤ ₱12,000 (non-NCR).

**Governing Sections:**
- RA 9679, Sections 14–16 (Housing Loans)
- HDMF Circular No. 403 (Modified Guidelines — Affordable Housing Program)
- HDMF Housing Loan guidelines (2024 interest rate schedule)
- HDMF Circular on MRI and fire insurance premium schedule

**Computation Sketch:**

**Step 1 — Income-based ceiling (HLAR):**
Max Monthly Amortization = 35% × Gross Monthly Income
Max Loanable = P such that annuity payment M = Max Monthly Amortization
P = (35% × GMI) × [(1+r)^n – 1] / (r × (1+r)^n)

**Step 2 — LTV ceiling:**
Max Loanable = 80–95% × Appraised Value (higher for socialized/affordable)

**Step 3 — Applicable interest rate tier:**
| Loan Amount | Annual Rate |
|---|---|
| ₱400K – ₱3M | 5.50% |
| ₱3M – ₱4.5M | 6.375% |
| ₱4.5M – ₱6M | 7.375% |

**Step 4 — Affordable Housing Program (Circular 403):**
- Income ≤ ₱15,000/month (NCR) or ≤ ₱12,000 (non-NCR)
- Max loan: ₱750,000
- Rate: **3% fixed for first 10 years**; repriced thereafter

**Step 5 — Age cap:**
Max loan term = min(30 years, 70 − Age of borrower in years)

**Step 6 — Monthly amortization:**
M = P × [r(1+r)^n] / [(1+r)^n – 1]

**Step 7 — MRI + Fire Insurance premiums:**
Computed as percentage of outstanding loan balance (rates per actuarial schedule published by Pag-IBIG). MRI protects against death/disability; fire insurance protects the collateral.

**Actual Monthly Obligation = M (principal+interest) + MRI premium + Fire Insurance premium**

**Who currently does this:** Real estate brokers/agents (earn 3–5% sales commission), Pag-IBIG loan officers, HR officers for employer-assisted applications. Third-party mortgage facilitators (fixers) sometimes charge ₱5,000–₱20,000 for "expediting" documentation.

**Rough Market Size:** ~90,616 housing loans released in 2024 (₱129.73B); pipeline of millions of aspiring home buyers who need to determine eligibility before applying

**Professional Fee Range:**
- Real estate broker commission: 3–5% of property selling price (on top of loan)
- Mortgage facilitators/fixers: ₱5,000–₱20,000 per application
- On a ₱2M loan, 5% broker commission = ₱100,000 — the moat is the broker, not legal complexity
- However, the **eligibility computation itself** (how much can I borrow, which track do I qualify for) is often done informally by brokers, not transparently

**Pain Indicators:**
- Most buyers do not know their maximum loanable before engaging a broker
- Affordable Housing track is underutilized because low-income buyers don't know they qualify
- Age + term cap surprises older borrowers (age 50 → max 20-year term)
- MRI and fire insurance premiums are hidden costs that inflate actual monthly obligation
- Repricing risk after fixed-rate period creates future uncertainty

**Computability:** Mostly deterministic (steps 1–6 fully formula-driven; step 7 requires MRI/fire insurance table lookups; repricing requires future rate assumptions).

**Opportunity Score Estimate:**
- Market: 5 (90K+ loans/year; millions of aspirants)
- Moat: 3 (brokers involved but moat is documentation, not the math)
- Computability: 4 (mostly deterministic; insurance table lookup)
- Pain: 4 (multi-step, hidden costs, affordable track underutilized)
- **Weighted Score: ~4.00**

---

### Domain 4: Total Accumulated Value (TAV) Accumulation & Refund Eligibility

**Description:** Computation of a member's total Pag-IBIG savings at any point in time — sum of all monthly contributions (employee + employer shares) plus compounded annual dividends. Used to determine: (a) loan entitlement, (b) maturity refund, (c) qualifying grounds for early refund.

**Governing Sections:**
- RA 9679, Sections 19–21 (Claims and Benefits)
- RA 9679, Section 9 (dividend allocation — ≥70% of net income credited proportionately)
- IRR of RA 9679, Rule VIII (Pag-IBIG Savings Refund)

**Computation Sketch:**

**TAV = Σ(Employee MS) + Σ(Employer Counterpart) + Σ(Annual Dividend)**

Dividend for year t:
DV_t = (Opening TAV_t + Closing TAV_t) / 2 × Annual Dividend Rate_t

(Pag-IBIG uses average daily balance methodology; approximate = average-of-opening-and-closing × rate)

**Qualifying grounds for refund:**
1. Maturity: 240 monthly savings (20 years) regardless of age
2. Retirement: age 65 (mandatory), or age 60 (optional)
3. Permanent total disability / insanity
4. Critical illness (member or immediate family)
5. Permanent departure from Philippines
6. Death (beneficiaries claim)
7. Other Board-approved grounds

**Refund amount:**
Net Refund = TAV − Outstanding Loan Balance (if any; auto-offset)

**Who currently does this:** Generally self-service but members don't have tools to project future TAV or determine whether they qualify for early refund grounds.

**Rough Market Size:** ~16.58M active members; each eventually claims a refund. ~150K–200K estimated annual refund/maturity claims.

**Professional Fee Range:** No professional intermediary typically involved for routine refunds. Lawyers sometimes engaged for contested claims or survivors' estates.

**Pain Indicators:**
- Members have no transparent tool to project future TAV at different contribution levels
- Qualifying grounds for early refund are not well understood
- Outstanding loan deduction from TAV surprises members who expected full refund
- Dividend rate varies annually and is not guaranteed (only ≥70% of net income by statute)

**Computability:** Mostly deterministic (contributions are exact; dividend rates declared annually; qualifying grounds are definitional checklist). Future projections require rate assumptions.

**Opportunity Score Estimate:**
- Market: 4 (16.58M members; ~200K claims/year)
- Moat: 1 (DIY via Virtual Pag-IBIG; low moat)
- Computability: 4 (deterministic once dividend rate known)
- Pain: 2 (mildly confusing but Virtual Pag-IBIG exists)
- **Weighted Score: ~2.80**

---

### Domain 5: MP2 Savings Growth Projection

**Description:** Voluntary savings program with 5-year maturity, higher dividend rate (7.10% in 2024 vs. 6.60% regular), compounded annually. Members can choose annual payout vs. terminal payout (full compounding). Tax-exempt.

**Governing Sections:**
- HDMF Board Resolution authorizing MP2 program
- RA 9679, Section 9 (voluntary contributions permitted above mandatory minimum)
- HDMF MP2 Program guidelines (published on pagibigfund.gov.ph)

**Computation Sketch:**

**Terminal payout (compounded):**
FV = Σ_t [MS_t × (1 + r)^(5-t+1)] + Opening TAV_MP2 × (1+r)^5
where r = annual dividend rate (7.10% for 2024)

**Annual payout:**
Dividend_t = (Opening TAV_t + Closing TAV_t) / 2 × r_t
(Payed out in year t; not compounded)

Minimum contribution: ₱500/remittance; no upper limit.
Lock-in: 5 years from first payment date.

**Who currently does this:** Members self-invest; basic calculators exist. Financial advisors sometimes recommend MP2 as a high-yield government savings alternative.

**Rough Market Size:** ₱73.74B in voluntary savings collected in 2024; millions of potential investors who don't know about MP2 or can't model their growth.

**Professional Fee Range:** No professional intermediary. The gap is lack of planning tools.

**Pain Indicators:**
- Members don't understand terminal vs. annual payout difference and tax implications
- Unclear how to model partial-year contributions
- MP2 number must be generated before first payment; confusion about lock-in start date

**Computability:** Fully deterministic (given declared annual rate, which is known retroactively and approximated prospectively).

**Opportunity Score Estimate:**
- Market: 4 (millions of members; ₱73.74B in voluntary savings)
- Moat: 1 (MP2 calculators widely available)
- Computability: 5 (fully formula-driven)
- Pain: 2 (confusion exists but low-stakes)
- **Weighted Score: ~2.85**

---

## Summary Table

| # | Domain | Computability | Market | Moat | Pain | Est. Score |
|---|---|---|---|---|---|---|
| 1 | Mandatory Savings Contribution | Fully deterministic | 5 | 2 | 3 | ~3.65 |
| 2 | MPL / Calamity Loan Amount & Amortization | Fully deterministic | 5 | 2 | 3 | ~3.65 |
| 3 | Housing Loan Eligibility & Amortization | Mostly deterministic | 5 | 3 | 4 | **~4.00** |
| 4 | TAV Accumulation & Refund | Mostly deterministic | 4 | 1 | 2 | ~2.80 |
| 5 | MP2 Savings Growth Projection | Fully deterministic | 4 | 1 | 2 | ~2.85 |

**Top Opportunity: Domain 3 — Housing Loan Eligibility & Amortization**

The housing loan calculator is the clearest opportunity: 90K+ applications per year, millions more in the pipeline, a multi-step computation (income ceiling → LTV → rate tier → age cap → insurance → total obligation), an Affordable Housing Program that is chronically underutilized by qualifying low-income borrowers, and brokers who control the information flow. An "affordability engine" that lets any Filipino input their income, age, and target property value to instantly determine their Pag-IBIG loan eligibility, maximum borrowable, monthly amortization breakdown, and Affordable vs. Regular program qualification — without a broker — would be a significant leap in transparency.

Domain 1 and Domain 2 score identically and are strong secondary targets, particularly for the employer-facing payroll compliance market (Domain 1 ties into SSS and PhilHealth contribution tools for an integrated mandated-benefits dashboard).
