# Lookup Table: Percentage Tax Rates and VAT Threshold Rules

**Status:** COMPLETE
**Last updated:** 2026-03-01
**Aspect:** vat-vs-percentage-tax
**Legal basis:** NIRC Sec. 109(CC), Sec. 116, Sec. 236(G); RA 11534 (CREATE); RA 11976 (EOPT); RR 3-2024; RMC 67-2021

---

## Part 1: Section 116 Percentage Tax — Complete Rate History

Every self-employed individual who is non-VAT-registered and NOT on the 8% option is subject to Section 116 percentage tax. The rate and computation basis have changed multiple times.

| Period | Rate | Computation Basis | Legal Authority |
|--------|------|------------------|-----------------|
| Pre-January 1, 2018 | 3% | Gross receipts (cash basis — amounts actually received) | Original NIRC Sec. 116 |
| January 1, 2018 – June 30, 2020 | 3% | Gross receipts (cash basis) | RA 10963 (TRAIN Law) — Sec. 116 rate unchanged |
| July 1, 2020 – June 30, 2023 | **1%** | Gross receipts (cash basis) | RA 11534 (CREATE Act) Sec. 13 — temporary COVID-era relief; made retroactive to July 1, 2020 |
| July 1, 2023 – October 26, 2024 | 3% | Gross receipts (cash basis — transitioning) | CREATE Act reversion; EOPT basis shift transition period |
| **October 27, 2024 – present** | **3%** | **Gross sales (accrual basis — invoice date)** | RA 11976 (EOPT) via RR 3-2024, transition period ended |

**Current rate as of 2026: 3% on gross quarterly SALES (accrual basis)**

**Critical distinction — gross receipts vs. gross sales:**
- **Gross receipts (pre-EOPT):** Includes only amounts RECEIVED (actual cash in hand) during the quarter. An invoice issued in Q4 but paid in Q1 next year would be Q1 gross receipts.
- **Gross sales (post-EOPT):** Includes amounts EARNED/INVOICED during the quarter, whether collected or not. An invoice issued in Q4 counts as Q4 gross sales, even if paid in Q1 next year. This aligns with how VAT output tax works.

**For the engine (computing 2026 taxes):** Use gross quarterly SALES (accrual basis) at 3%.

---

## Part 2: Who Pays the Section 116 Percentage Tax

**Three conditions — ALL must be true for percentage tax to apply:**

| Condition | Requirement | Test |
|-----------|-------------|------|
| Not VAT-registered | Taxpayer has no VAT registration with BIR | `vat_registered == false` |
| Annual gross sales ≤ ₱3,000,000 | Does not exceed mandatory VAT registration threshold | `annual_gross_sales <= 3_000_000` |
| Not on 8% income tax option | Did not elect 8% flat rate for the year | `elected_eight_percent == false` |

**If all three conditions are met:** Percentage tax APPLIES — file Form 2551Q quarterly.

**Who is NOT subject to Section 116:**

| Category | Reason Not Subject | Engine Flag |
|----------|--------------------|-------------|
| VAT-registered taxpayer | Pays VAT instead; these are mutually exclusive taxes | `has_vat_obligation = true; has_opm_obligation = false` |
| Taxpayer on 8% income tax option | 8% rate is "in lieu of" both IT graduated rates AND Sec. 116 OPT | `has_opm_obligation = false; eight_pct_waives_pt = true` |
| Cooperatives | Expressly exempted by Sec. 116 statute | Out of scope for this tool |
| Taxpayer with gross > ₱3,000,000 (non-VAT) | Must register for VAT; meanwhile OPT obligation suspended | `flag_vat_registration_required = true` |
| BMBE income-tax-exempt entity | Exempt from both income tax and percentage tax | Out of scope for this tool |
| OFW/OCW earning purely from abroad | Not subject to Philippine income tax or OPT | Out of scope for this tool |

---

## Part 3: VAT Threshold — ₱3,000,000 Rules

### 3.1 The Triple Coincidence of ₱3,000,000

The ₱3,000,000 figure serves three distinct purposes in Philippine tax law. Each has a DIFFERENT boundary expression:

| Role | Threshold Expression | What It Controls |
|------|---------------------|-----------------|
| **EOPT Micro-taxpayer tier** | Annual gross sales **less than** ₱3,000,000 | Penalty rates (10% surcharge, 6% interest for MICRO) |
| **VAT mandatory registration** | Annual gross sales **exceeding** ₱3,000,000 | VAT obligation (NIRC Sec. 236(G)) |
| **8% income tax option eligibility** | Annual gross receipts + other income **not exceeding** ₱3,000,000 | 8% flat rate availability |

**Boundary analysis at exactly ₱3,000,000:**
- EOPT tier: Gross sales of exactly ₱3,000,000 → **SMALL** tier (not MICRO; "less than ₱3M" is strict)
- VAT registration: Gross sales of exactly ₱3,000,000 → **NOT required** (requirement triggers at "exceeding ₱3M," meaning ₱3,000,001+)
- 8% eligibility: Gross receipts of exactly ₱3,000,000 → **STILL ELIGIBLE** (requirement is "not exceeding ₱3M," which includes ₱3,000,000 exactly)

**Practical result at exactly ₱3,000,000:** Taxpayer is SMALL tier, NOT VAT-required, STILL eligible for 8% option.

### 3.2 Mandatory VAT Registration Trigger

| Condition | Threshold | Action Required | Deadline |
|-----------|-----------|-----------------|---------|
| Gross sales EXCEEDS ₱3,000,000 in any 12-month period | > ₱3,000,000 | File BIR Form 1901 (VAT registration) or Form 1905 (add VAT to existing registration) | Within 10 days from end of the month the threshold was exceeded |
| Voluntary VAT registration (optional) | Any amount ≤ ₱3,000,000 | File Form 1901 or Form 1905 | Any time |

**When does VAT take effect?**
- After registration is processed: VAT applies starting from the **FIRST DAY of the next calendar month** after registration is approved.
- Percentage tax obligation ends on the **LAST DAY of the month** before VAT becomes effective.

**Example:** Freelancer crosses ₱3M in October 2026. Must file Form 1905 by November 30, 2026. VAT takes effect December 1, 2026. Percentage tax stops November 30, 2026.

### 3.3 VAT Deregistration Rules

| Condition | Rule |
|-----------|------|
| Gross sales drop below ₱3M in one year | Does NOT automatically deregister from VAT |
| Gross sales below ₱3M for 3 CONSECUTIVE years | May APPLY for VAT deregistration (not automatic) |
| Application for cancellation | File Form 1905 with supporting documents at RDO |
| Effect of cancellation | VAT obligation ends; Sec. 116 OPT resumes from next quarter; 8% option becomes available if other conditions met |

---

## Part 4: Quarterly Percentage Tax Filing Deadlines (Form 2551Q)

**Current deadlines (confirmed per RMC 67-2021, unchanged post-EOPT):**

| Quarter | Covered Period | Filing Deadline | Notes |
|---------|---------------|-----------------|-------|
| Q1 | January 1 – March 31 | **April 25** of current year | If deadline falls on weekend/holiday: next banking day |
| Q2 | April 1 – June 30 | **July 25** of current year | If deadline falls on weekend/holiday: next banking day |
| Q3 | July 1 – September 30 | **October 25** of current year | If deadline falls on weekend/holiday: next banking day |
| Q4 | October 1 – December 31 | **January 25** of following year | If deadline falls on weekend/holiday: next banking day |

**Filing method:** eBIRForms (BIR Form 2551Q), eFPS (for enrolled users), or manual at RDO/AAB.
**Payment:** Due simultaneously with filing. Pay via AAB, GCash, Maya, Landbank e-Link, DBP, or Revenue Collection Officer.

**NIL returns:** Even if no gross sales were earned in a quarter, a NIL return (₱0 tax) must still be filed before the deadline — unless the taxpayer is on the 8% option (no Form 2551Q filed) or is VAT-registered. Failure to file a NIL return constitutes a failure-to-file violation subject to compromise penalty (EC-P05 in edge-cases.md).

---

## Part 5: VAT Rate and Basic Structure

**This tool does NOT compute VAT in full detail** (VAT computation is out of scope). However, the tool must:
1. Detect when VAT applies (gross > ₱3M or VAT-registered)
2. Alert the user that VAT registration is required
3. Exclude the 8% option from available paths
4. Exclude percentage tax from the regime comparison
5. Compute Paths A and B WITHOUT the percentage tax component (since VAT is a separate obligation)

**VAT basic rules (for reference/alert text):**

| Item | Rule |
|------|------|
| Standard VAT rate | 12% on gross sales of goods and services |
| Zero-rated sales | 0% VAT (exports, certain services to non-residents) |
| VAT-exempt sales | Not subject to VAT (certain listed transactions) |
| Output VAT | 12% × gross sales (or receipts from VAT-able transactions) |
| Input VAT | VAT paid on business purchases (creditable against output VAT) |
| VAT payable | Output VAT minus creditable input VAT |
| Monthly filing | BIR Form 2550M — due 20th day after month end (for large taxpayers) |
| Quarterly filing | BIR Form 2550Q — due 25th day after quarter end |
| Threshold for monthly | Gross sales ≥ ₱10M OR enrolled under eFPS |
| VAT registration form | BIR Form 1905 (existing registrants) or Form 1901 (new registrants) |

**For the regime comparison engine (VAT-registered taxpayers):**
```
// VAT-registered taxpayers: Paths A and B have NO percentage tax component
// Path C (8%) is NOT available (ineligible)
// VAT is a separate filing — not included in this tool's scope

path_a_total_for_vat = graduated_tax(gross_income - itemized_deductions)
path_b_total_for_vat = graduated_tax(gross_income * 0.60)
// No percentage_tax_path_a or percentage_tax_path_b for VAT-registered
// Recommend: min(path_a_total, path_b_total) — only 2 paths available
```

---

## Part 6: Percentage Tax vs. VAT — Mutual Exclusivity

The two indirect taxes are strictly mutually exclusive:

| Scenario | OPT (3%) | VAT (12%) |
|----------|----------|-----------|
| Non-VAT-registered, gross ≤ ₱3M, not on 8% | **YES** | NO |
| Non-VAT-registered, gross ≤ ₱3M, on 8% option | NO (waived by 8%) | NO |
| VAT-registered (voluntary), gross ≤ ₱3M | NO (replaced by VAT) | **YES** |
| VAT-registered (mandatory), gross > ₱3M | NO (replaced by VAT) | **YES** |
| Non-VAT-registered, gross > ₱3M (non-compliant) | Technically YES (but VAT registration required — flag) | Required but not yet filed |

**The engine must never apply both OPT and VAT in the same computation.**

---

## Part 7: Section 116 Percentage Tax — Deductibility

The 3% percentage tax paid on gross quarterly sales is an **allowable deduction** from gross income for income tax purposes under Path A (itemized deductions), per NIRC Sec. 34(C)(1) (taxes — deductible business taxes except income tax).

**Engine behavior for Path A:**
```
// Percentage tax paid IS an itemized deduction under Sec. 34(C)(1)
// BUT: the path comparison adds PT to the IT burden for fair comparison
// For regime comparison: treat PT as additional cost (not as deduction)
// For actual return computation: PT is included in allowable itemized deductions

// Regime comparison (correct):
path_a_total_burden = income_tax_a + percentage_tax  // PT added to burden

// Path A income tax computation (for Form 1701):
// The PT itself reduces taxable income under itemized deductions
// This creates a CIRCULAR dependency that the engine resolves iteratively:
//   Step 1: Compute PT = gross_sales × 0.03
//   Step 2: Add PT to itemized deductions
//   Step 3: Recompute NTI with PT deduction included
//   Step 4: Recompute income tax on adjusted NTI
//   Step 5: Total burden = income_tax (after PT deduction) + PT
// Note: For regime comparison, the forward loop uses the TOTAL BURDEN (step 5)
```

**Critical note for deductibility iteration:**
The PT deduction creates a circular dependency (PT reduces IT base, which changes the IT, but PT itself is fixed based on gross sales). The circular dependency resolves in ONE iteration because PT depends on gross sales (fixed), not on NTI. There is no infinite loop.

```
// Correct algorithm (one pass):
pt_amount = gross_sales * 0.03                           // Step 1: Fixed, no dependency
itemized_with_pt = itemized_deductions + pt_amount       // Step 2: Add PT to itemized
nti_a = gross_income - itemized_with_pt                  // Step 3: Reduced NTI
income_tax_a = graduated_tax(max(nti_a, 0))              // Step 4: Lower income tax
total_burden_a = income_tax_a + pt_amount                // Step 5: Total burden
```

---

## Part 8: Section 116 ATC Code and Form 2551Q Reference

**Applicable ATC (Alphanumeric Tax Code) for self-employed individuals under Sec. 116:**

| ATC | Description | Rate | Who Files |
|-----|-------------|------|-----------|
| PT010 | Persons Exempt from VAT under Sec. 109(CC) — individuals in trade or profession | 3% of gross quarterly sales | Self-employed professionals and freelancers with gross ≤ ₱3M |

**Form 2551Q mandatory fields for engine-generated output:**
- Line 1: Registered name
- Line 2: TIN
- Line 3: RDO Code
- Line 4: Tax Year (Calendar: January 1 – December 31)
- Line 5: Return period (Q1: 01/31, Q2: 06/30, Q3: 09/30, Q4: 12/31)
- Line 6: Amended return? (Yes/No)
- Line 7: ATC → PT010
- Line 8–10: Gross quarterly sales or receipts (current quarter only, not cumulative)
- Line 11: Tax rate (0.03)
- Line 12: Tax due = Line 8 × Line 11
- Lines 13–17: Tax credits, surcharges, interest, compromise penalty (if applicable)
- Line 18: Total amount payable

---

## Part 9: Engine Flags for VAT/OPT Determination

The engine must compute and expose the following flags for every computation:

| Flag Name | Type | Source | Description |
|-----------|------|--------|-------------|
| `vat_registered` | bool | User input | True if taxpayer holds a VAT registration with BIR |
| `annual_gross_sales` | decimal | Computed from user input | Total gross sales (accrual) for the year |
| `vat_registration_required` | bool | Computed | True if `annual_gross_sales > 3_000_000` AND `vat_registered == false` |
| `opm_obligation` | bool | Computed | True if `vat_registered == false AND annual_gross_sales <= 3_000_000 AND elected_eight_percent == false` |
| `eight_pct_waives_opm` | bool | Computed | True if `elected_eight_percent == true` (8% option waives percentage tax) |
| `quarterly_pt_amount_q1` | decimal | Computed | Gross Q1 sales × 0.03 (if `opm_obligation == true`) |
| `quarterly_pt_amount_q2` | decimal | Computed | Gross Q2 sales × 0.03 (if `opm_obligation == true`) |
| `quarterly_pt_amount_q3` | decimal | Computed | Gross Q3 sales × 0.03 (if `opm_obligation == true`) |
| `quarterly_pt_amount_q4` | decimal | Computed | Gross Q4 sales × 0.03 (if `opm_obligation == true`) |
| `annual_pt_total` | decimal | Computed | Sum of all quarterly PT amounts |
| `opm_deductible_under_path_a` | bool | Always true when `opm_obligation == true` | PT paid is deductible under Sec. 34(C)(1) itemized deductions |

---

## Part 10: Percentage Tax Interaction with Income Tax Paths

**Summary table: Which income tax paths include PT in total burden**

| Path | Income Tax Component | Percentage Tax Component | Total Burden |
|------|---------------------|------------------------|-------------|
| Path A (Graduated + Itemized), non-VAT | `graduated_tax(GI - itemized - PT)` | `gross_sales × 0.03` | `income_tax_a + pt` |
| Path A (Graduated + Itemized), VAT-registered | `graduated_tax(GI - itemized)` | ₱0 (VAT applies separately) | `income_tax_a` only |
| Path B (Graduated + OSD), non-VAT | `graduated_tax(gross_income × 0.60)` | `gross_sales × 0.03` | `income_tax_b + pt` |
| Path B (Graduated + OSD), VAT-registered | `graduated_tax(gross_income × 0.60)` | ₱0 (VAT applies separately) | `income_tax_b` only |
| Path C (8% Flat Rate) | `max(gross_receipts - 250_000, 0) × 0.08` | ₱0 (waived by 8% election) | `income_tax_c` only |
| Path C — mixed income earner | `gross_receipts × 0.08` | ₱0 (waived by 8% election) | `income_tax_c` only |

**Important for Path B with OSD:** OSD is applied to gross INCOME (before PT deduction), per NIRC Sec. 34(L). The OSD does not benefit from including PT in the deduction base — OSD is simply 40% of gross income. This is different from Path A where PT is deductible under itemized deductions.

---

*Cross-references: [computation-rules.md CR-031 through CR-033](../computation-rules.md) | [decision-trees.md DT-11 through DT-13](../decision-trees.md) | [edge-cases.md EC-VPT group](../edge-cases.md)*
