# Wave 1 Analysis: Insurance Code — RA 10607 (Amended Insurance Code) + RA 9829 (Pre-Need Code)

**Aspect:** insurance-code
**Sources:** RA 10607 (Amended Insurance Code, 2013), RA 9829 (Pre-Need Code of the Philippines, 2009), IMC 2024-01 (Increased CTPL Benefits), IMC No. 4-2006 (CTPL Premium Tariff), IC CL No. 14-93 (Standard Life Insurance Policy Provisions), IC CL No. 2024-02 (HMO Discount Rates), Supreme Court jurisprudence on loss of earning capacity
**Date analyzed:** 2026-02-24

---

## Overview

The Philippine Insurance Code (RA 10607) and its associated regulations govern a massive industry: ₱440.3 billion in total premiums collected in 2024, with ₱160.3 billion in benefits/claims paid. The Insurance Commission (IC) regulates insurers, pre-need companies, and HMOs.

However, a careful scan reveals that most of the Insurance Code's computation-heavy domains suffer from one of two problems:

1. **Actuarial judgment required** — pre-need reserve valuations, HMO reserve computations, and life insurance net single premium calculations are actuarial work that requires professional judgment beyond what a statute's arithmetic defines. These are NOT automation candidates.

2. **Moat is shallow** — the most publicly accessible computations (CTPL benefit schedules) are fixed tariff lookups already publicly posted by the IC. The "computation" is table lookup, not arithmetic a professional monopolizes.

The Insurance Code is therefore a **secondary-tier** source for this survey. It yields fewer high-priority domains than the NIRC, Labor Code, or Civil Code. However, two specific domains emerge as legitimate automation candidates:

- **Life Insurance Cash Surrender Value Verification** — statutory formula, information asymmetry, millions of policyholders
- **CTPL + Civil Code Loss of Earning Capacity Computation** — fully deterministic jurisprudential formula for accident damages, currently gatekept by contingency-fee lawyers

A third domain (CTPL claims benefit schedule) is included at LOW priority for completeness.

---

## Domains Identified

---

### Domain 1: Life Insurance Cash Surrender Value (CSV) Verification

**Description:** Every Philippine life insurance policy that has been in force for at least 2–3 years acquires a statutory minimum cash surrender value. The formula is defined in RA 10607: the CSV must equal at minimum the policy reserve for the current policy year (plus any dividend additions), reduced by a surrender charge that cannot exceed the lesser of (a) 1/5 of the entire reserve, or (b) 2.5% of the face amount plus dividend additions. Policyholders who surrender their policies receive a CSV figure from the insurer — but have no independent way to verify it. Insurers have an informational advantage. There are an estimated 8–12 million life insurance policies in force in the Philippines.

**Governing sections:**
- RA 10607 Sec. 227(d) — Minimum non-forfeiture value: CSV ≥ reserve − min(1/5 of reserve, 2.5% of face + dividend additions)
- RA 10607 Sec. 233 — Non-forfeiture options required in every individual life policy: (1) cash surrender, (2) reduced paid-up, (3) extended term insurance
- IC CL No. 14-93 — Standard Life Insurance Policy Provisions: defines Net Surrender Value, Paid-Up Insurance option, Extended Term Insurance option
- RA 10607 Sec. 237 — Policy loan value: every individual life policy must have a loan value not less than the reserve net of a 6-month interest deduction
- RA 10607 Sec. 243 — Free-look period: 15 days from delivery to cancel for full refund (pro-rata for group)
- RA 10607 Sec. 249 — Delayed claims: insurer liable for 12% interest p.a. if claim not paid within 90 days of proof of loss

**Computation sketch:**
```
INPUTS:
- Policy type (whole life, endowment, term)
- Face amount (sum insured)
- Annual premium
- Policy year (years in force)
- Dividend additions (for participating policies)
- Outstanding policy loans + accrued interest

STATUTORY CSV FLOOR:
  reserve(year_n) ← look up from policy's Table of Non-Forfeiture Values
  max_surrender_charge = min(reserve / 5, face_amount × 0.025)
  minimum_CSV = reserve + dividend_CSV - max_surrender_charge - policy_loans_outstanding

NON-FORFEITURE OPTION 2: Reduced Paid-Up
  paid_up_sum = level amount purchasable by (Net Surrender Value) at attained age,
                for remaining policy duration
  (requires mortality table + discount rate — actuarial but table-driven)

NON-FORFEITURE OPTION 3: Extended Term (non-participating)
  extended_term_face = original face - outstanding_loans
  extended_term_period = duration purchasable by NSV as a term insurance premium at attained age

DELAYED CLAIMS PENALTY (Sec. 249):
  if settlement_date - proof_of_loss_date > 90 days:
    additional_interest = claim_amount × 0.12 × (excess_days / 365)
```

**Who currently does this:** Policyholders rely entirely on insurer-provided CSV statements. Life insurance agents advise on surrender options but have a financial conflict of interest (agent commissions are tied to keeping policies in force). Only actuaries can independently compute reserve-based CSV, and they work for the insurer — not the policyholder. No independent verification tool exists.

**Rough market size:**
- PSA data: ~40–50 million life insurance policies across individual and group products (LIMRA-affiliated data; individual policy count estimated at 8–12 million)
- IC 2024 industry data: ₱440.3 billion total premiums collected
- Annual surrenders: IC does not publish a surrender rate, but industry average globally is 5–8%/year → 400,000–960,000 surrender events in the Philippines annually
- Policy loans (where CSV is the security): separate high-volume event

**Professional fee range:**
- No standard professional fee for CSV verification — this service does not currently exist as a market offering
- Actuarial consulting for individual policy review: P10,000–P50,000 (prohibitively expensive relative to most policy face amounts)
- If the policyholder suspects underpayment and seeks legal help: P15,000–P30,000 IC complaint filing assistance from lawyers
- The moat here is informational asymmetry rather than active professional gatekeeping — the insurer simply provides a number and the policyholder accepts it

**Pain indicators:**
- Policyholders surrender policies without knowing if the CSV offered matches the statutory minimum
- Agents have strong incentive to discourage surrender (commission clawback provisions)
- "Policy lapse" (letting the policy lapse without surrendering) results in zero recovery even when CSV > 0 — a common financially devastating mistake
- Surrender charge caps (1/5 of reserve, 2.5% of face) are well-defined but never explained in plain language to policyholders
- IC receives complaints about insurer delays in paying CSV (Sec. 249 interest penalty applies but few policyholders know to claim it)

**Computability assessment:** Mostly deterministic (4/5). The statutory floor formula is fully deterministic given inputs. The Reserve figure requires accessing the policy's embedded "Table of Non-Forfeiture Values" — which must be included in every policy per IC requirements, but is rarely explained to policyholders. Reduced paid-up and extended term computations require mortality tables (actuarial judgment), reducing computability for those options. The core CSV floor computation is 5/5 deterministic.

**Opportunity score (preliminary):**
- Market size: 4/5 (400K–1M surrender events/year; millions of policies where CSV could be verified proactively)
- Moat depth: 3/5 (information asymmetry moat rather than active professional gatekeeping; no existing independent tools)
- Computability: 4/5 (statutory floor fully deterministic; non-forfeiture options need mortality tables)
- Pain: 3/5 (real financial harm when policies are surrendered below statutory minimum; lapse vs. surrender confusion)

---

### Domain 2: Motor Vehicle Accident Loss of Earning Capacity Damages

**Description:** When a CTPL claim is insufficient (e.g., serious injury, partial/total disability, death of primary breadwinner) and the victim or heirs pursue a civil action under the Civil Code, the key computation is "loss of earning capacity" (LEC) — the largest single component of bodily injury damages in Philippine litigation. The Supreme Court has established a fixed, fully deterministic formula derived from actuarial tables:

**LEC = Life Expectancy × Net Annual Income**
where:
- Life expectancy = 2/3 × (80 − age at death/injury)  ← from American Expectancy Table / Actuarial Combined Experience Table
- Net annual income = Gross annual income × 50%  ← standard deduction for living expenses

This formula applies in every vehicular accident civil case, and also in medical malpractice, criminal cases (civil aspect), and CTPL-related claims that exceed the ₱200K tariff limit. Lawyers on both sides compute this — plaintiff to maximize claim, defendant to minimize. Despite its simplicity, errors are common and outputs vary widely, affecting settlement negotiations and litigation outcomes.

**Governing law/computation basis:**
- Civil Code Art. 2206 — Damages for death: at minimum, the employer must pay loss of earning capacity of the deceased
- Supreme Court: People v. Teehankee Jr., Villa Rey Transit v. Ferrer, Sarkies Tours v. CA, Pereña v. Zarate — established the 2/3 × (80 − age) × 50% of gross formula as the standard approach
- IMC 2024-01 — CTPL death indemnity: ₱200K (baseline; LEC damages come on top when CTPL limit is exceeded and civil liability established)
- Civil Code Art. 2199 — Actual damages must be proven with a reasonable degree of certainty; LEC formula provides that certainty

**Computation sketch:**
```
INPUTS:
- Age at time of death or injury
- Annual gross income (documented: payslips, ITR, business records, or minimum wage if undocumented)
- Type of injury: death / permanent total disability / permanent partial disability
  (disability percentage affects net earning capacity for non-death cases)

FOR DEATH:
  life_expectancy = (2/3) × (80 - age_at_death)
  net_annual_income = gross_annual_income × 0.50
  LEC = life_expectancy × net_annual_income

FOR PARTIAL DISABILITY:
  remaining_capacity = 1 - disability_percentage
  LEC = life_expectancy × net_annual_income × disability_percentage
  (the lost portion, not the retained portion)

ADJUSTMENTS:
  + Moral damages (death of spouse/parent: ₱50K–₱100K; SC-standardized ranges)
  + Death indemnity: ₱75K–₱100K (SC-adjusted periodically)
  + Burial expenses: actual, must be proven (receipts)
  + Exemplary damages if gross negligence: discretionary
  + Attorney's fees: 10–15% of total award is typical SC-awarded amount

CTPL OFFSET:
  net_civil_liability = LEC + other_damages - CTPL_payment_already_received
```

**Who currently does this:** Lawyers representing accident victims compute LEC as the centerpiece of every bodily injury claim. Lawyers for insurers and defendants compute the same figure to assess settlement exposure. Insurance adjusters (non-lawyers) compute rough estimates during claims processing. Despite the formula's simplicity, lawyers charge for the "expertise" of knowing the formula and citing the correct jurisprudence.

**Rough market size:**
- LTO data: ~12 million registered motor vehicles; MMDA reports ~100,000 road accidents/year in Metro Manila alone
- Nationally: estimated 200,000–400,000 vehicular accidents/year with bodily injury or death
- Cases that proceed to civil litigation or IC adjudication where formal LEC computation is required: estimated 20,000–50,000/year
- Informal settlement negotiations where LEC is used as a reference: multiple of formal cases (2-4x)
- Total LEC computation events (formal + informal): estimated 60,000–200,000/year

**Professional fee range:**
- Contingency fee for personal injury claims: 20–30% of total recovery (including LEC)
- Acceptance fee for a P500,000 LEC case: P20,000–P50,000
- Legal opinion on estimated claim value (to decide whether to litigate): P5,000–P15,000
- Insurance adjuster firms: P3,000–P10,000 per case for claims assessment
- The formula is simple but lawyers justify fees on: knowing the jurisprudence, collecting income evidence, and navigating multi-agency filings (police report → IC → RTC/MTC → execution)

**Pain indicators:**
- Victims frequently accept grossly inadequate settlements because they don't know the formula and can't compute their own claim value
- Insurance company adjusters make lowball offers; victims without lawyers routinely accept 20–40% of their LEC entitlement
- The 2/3 × (80-age) formula is a 50-year-old actuarial formula now embedded in SC jurisprudence — it is fixed, public law, not secret knowledge
- Indigent victims often cannot afford lawyers → accept ₱30K no-fault CTPL payout even when their LEC is P500K–P2M
- Case delay: civil litigation for bodily injury takes 3–7 years, during which the victim has no income replacement; knowing the LEC value upfront helps settlement negotiation

**Computability assessment:** Fully deterministic (5/5). Given age, gross income, and injury type → output is a precise peso amount via a three-multiplication formula established by the Supreme Court.

**Opportunity score (preliminary):**
- Market size: 3/5 (60K–200K computation events/year)
- Moat depth: 4/5 (lawyers actively gatekeep; victims without lawyers lose 60–80% of entitlement; formula presented as "legal expertise")
- Computability: 5/5 (fully deterministic formula, publicly available from SC jurisprudence)
- Pain: 4/5 (indigent victims accept drastically undervalued settlements; permanent income loss makes delay catastrophic)

---

### Domain 3: CTPL Claims Benefit Schedule (LOW PRIORITY)

**Description:** CTPL insurance covers death and bodily injury to third parties. The benefit schedule is fixed by the IC (IMC 2024-01) and is a pure lookup table: death = ₱200K (total), no-fault indemnity = ₱30K (no fault proof required), burial/funeral = ₱30K, incidental expenses = up to ₱10K. No computation is required — it's a table lookup. However, claimants frequently (a) don't know what they're entitled to, (b) don't know how to file within the 6-month deadline, and (c) don't know that the insurer must pay within 60 days or owe 12% interest.

**Governing sections:**
- RA 10607 Sec. 387-390 (CMVLI requirements for all registered vehicles)
- IMC 2024-01 (2024): death ₱200K; no-fault ₱30K; burial ₱30K; incidentals ₱10K
- IMC No. 4-2006: premium tariff (private car ₱560/year; motorcycle ₱250/year; jeepney/taxi ₱1,100/year)
- RA 10607 Sec. 249: insurer must pay within 90 days of proof of loss; 12% interest p.a. thereafter
- IC Circular 2016-69: 60-day investigation period; undisputed portion must be paid

**Computability assessment:** 5/5 for benefit amounts (table lookup, no arithmetic). BUT the "computation" adds zero value — the amounts are publicly posted on the IC website. The real friction is process/documentation, not arithmetic.

**Opportunity score (preliminary):**
- Market size: 5/5 (12M+ registered vehicles; every vehicle registered = 1 CTPL policy/year)
- Moat depth: 2/5 (amounts are publicly posted; moat is process/documentation knowledge, not computation)
- Computability: 5/5 (trivial table lookup)
- Pain: 2/5 (annoying but the IC publishes the numbers; main friction is form-filling, not computation)

**Conclusion:** CTPL benefit amounts are NOT an automation target for a computation engine. The play here would be a claims guide / checklist (process automation), not a computation engine. **Flagged as LOW PRIORITY / out of scope for this survey's focus on computation moats.**

---

## Domains NOT Identified as Automation Candidates

**Pre-Need Trust Fund Contributions (RA 9829, Sec. 32):** Trust fund monthly deposit amounts are "determined by the actuary based on the viability study of the pre-need plan." This is textbook actuarial work requiring judgment about mortality, lapse rates, and investment returns. NOT a computation automation target.

**HMO Reserve Computation (IC CL 2024-02):** Uses government bond yield discount rates for long-term contracts. Actuarial work requiring professional judgment. NOT a computation automation target.

**Life Insurance Premium Computation:** Premiums are actuarially derived (mortality tables × expense loading × profit margin). Unlike NIRC tax rates (which are purely statutory), insurance premiums are underwriting calculations. NOT a statutory-arithmetic computation target.

**Marine Insurance Partial Loss (RA 10607 Sec. 159, 163-164, 168):** Coverage computations (e.g., two-thirds of ship repair costs) are fully deterministic, but the market is narrow (commercial marine operators) and the domain is dominated by specialist marine insurance brokers and adjusters. LOW priority for mass-market automation.

**Property Insurance Claims (Comprehensive / Fire / Typhoon):** Deductibles and depreciation computations are deterministic (deductible = max(0.5% FMV, ₱2,000)), but the moat is shallow — insurers provide itemized statements. The real dispute is the insured value of property, which requires appraisal (judgment). NOT a strong automation target.

---

## Summary Table

| Domain | Governing Law/Sections | Computability | Market Size | Moat | Pain | Priority |
|--------|----------------------|---------------|-------------|------|------|----------|
| Life Insurance CSV Verification | RA 10607 Sec. 227(d), 233, 237; IC CL 14-93 | 4/5 | 4/5 | 3/5 | 3/5 | **MEDIUM** |
| Motor Vehicle LEC Damages | Civil Code Art. 2206; SC jurisprudence (2/3 formula) | 5/5 | 3/5 | 4/5 | 4/5 | **MEDIUM-HIGH** |
| CTPL Benefit Schedule | RA 10607 Sec. 387-390; IMC 2024-01 | 5/5 | 5/5 | 2/5 | 2/5 | **LOW** |

---

## Overall Assessment: Insurance Code vs. Other Sources

The Insurance Code is the **weakest Wave 1 source** for this survey. The primary reasons:

1. **Actuarial moat is different from legal moat.** The inheritance engine worked because the Civil Code defines exactly the arithmetic a lawyer then does manually. Insurance Code computations that involve reserves, trust funds, and premiums are genuinely actuarial — requiring tables, assumptions, and professional judgment that exceeds statutory arithmetic.

2. **Information asymmetry, not professional gatekeeping.** The strongest pain in the insurance domain is that policyholders don't know their CSV entitlement — but this is an information problem, not a computation monopoly. The formula is in the statute; the insurer just never shares the inputs transparently.

3. **The LEC formula is horizontal.** The motor vehicle LEC computation (2/3 × (80-age) × 50% of gross income) is the strongest finding from this analysis, and it comes from Supreme Court jurisprudence applied across vehicular accidents, medical malpractice, and criminal cases — not uniquely from the Insurance Code. It should be categorized under "civil damages computation" or merged with the civil-code-obligations analysis.

**Key finding:** The LEC computation domain should be **merged with the civil-code-obligations analysis** in Wave 2 (deduplicate-and-merge), since it is a Civil Code Art. 2206 domain applied in insurance contexts. It is effectively an extension of the "actual damages" computation family — but unlike the other actual damages categories (which require evidentiary proof), LEC has a fixed statutory formula making it automatable.

---

## New Aspects to Consider for the Frontier

No new Wave 1 aspects identified from the Insurance Code scan. The LEC domain is better handled as an extension of the civil-code-obligations analysis rather than a new aspect.
