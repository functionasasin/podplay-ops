# Manual Review Flags — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** INITIAL (seeded from rr-16-2023-emarketplace and eopt-taxpayer-tiers aspects; to be expanded in Wave 2)
**Last updated:** 2026-02-28

These are situations the engine CANNOT resolve with certainty. Instead of making a judgment call, the engine displays a flag/notice to the user and either (a) makes a conservative default assumption or (b) asks the user for clarification.

Every item here must have:
1. A unique flag code (MRF-NNN)
2. The trigger condition (what input causes this flag)
3. The engine's fallback behavior (what it computes/shows while the flag is active)
4. The exact user-facing text displayed

Situations where the user clearly needs a CPA go into `legal/disclaimers.md`, not here. This file covers cases where the engine can still compute — it just cannot be 100% certain of one input value.

---

## MRF-001: Payoneer / Platform Qualifies as DFSP (Uncertain)

**Flag code:** MRF-001
**Trigger:** User reports receiving payments through a platform not on the known DFSPs list (not Payoneer, GCash, Maya, PayMongo, PayPal, Xendit, Shopee, Lazada, Fiverr, Upwork)
**Engine fallback:** Prompt user: "Did this platform issue you a BIR Form 2307 with ATC WI760 or WC760?" If yes → credit the amount. If no → do not include CWT credit.

**User-facing text:**
> "We couldn't automatically classify [platform name] as a BIR-designated e-marketplace or digital financial services provider. If [platform name] issued you a BIR Form 2307 for payments received, please enter the details below. If not, leave this section blank — income from this platform is still taxable but no creditable withholding applies."

**Resolution:** User confirms by entering or not entering a 2307. Engine acts on that entry.

---

## MRF-002: CWT Withheld by Platform Despite Being Below ₱500,000 Threshold

**Flag code:** MRF-002
**Trigger:** User reports total combined platform gross remittances below ₱500,000 AND reports receiving a WI760 2307 from a platform
**Engine fallback:** Credit the 2307 amount as normal CWT (the withholding was incorrect but valid as a credit)

**User-facing text:**
> "It looks like your combined gross remittances from all platforms were below ₱500,000, which would normally exempt you from withholding under BIR RR 16-2023. However, since you received a BIR Form 2307 from a platform, you may not have submitted a Sworn Declaration (SD) in time. The withheld amount (₱[amount]) still counts as a tax credit and has been applied here. To avoid this in future years, submit a BIR-stamped Sworn Declaration to each platform by January 20."

---

## MRF-003: Expense is "Ordinary and Necessary" — Cannot Be Determined by Engine

**Flag code:** MRF-003
**Trigger:** User is computing Path A (Itemized Deductions) and has entered a non-standard expense category (e.g., "personal computer used partially for work," "home office rent," "professional development course")
**Engine fallback:** Include the expense if the user confirms it is "directly related to earning income from the business"

**User-facing text:**
> "The expense '[description]' may be deductible as an ordinary and necessary business expense under NIRC Section 34(A). We've included it in your computation, but BIR may disallow it during audit if it is personal in nature or not directly related to your registered business activity. Consult a tax professional if you're unsure."

**Note:** This flag applies to the following expense types:
- Home office expense (partial — only the business-use portion is deductible)
- Dual-use equipment (personal computer, phone used for work)
- Professional development / training (deductible only if directly related to current trade)
- Travel expenses (business travel is deductible; mixed personal/business must be prorated)
- Meals and entertainment (subject to 0.5% or 1% cap under RR 10-2002, NIRC Sec. 34(A))

---

## MRF-004: First-Year Registrant — No Prior Year Data for Tier Classification

**Flag code:** MRF-004
**Trigger:** `is_first_year_registrant = true`
**Engine fallback:** Default to MICRO tier for penalty/interest rate purposes

**User-facing text:**
> "As a first-year registrant, your taxpayer tier will default to Micro (the smallest classification under RR 8-2024). Your actual tier will be assigned by BIR after you file your first Annual Income Tax Return."

---

## MRF-005: Reclassification Notice Received — Tier Change

**Flag code:** MRF-005
**Trigger:** User indicates they received a written BIR notice of taxpayer tier reclassification
**Engine fallback:** Use the NEW tier for penalty/interest computation if the new tier takes effect in the current year; otherwise use the old tier

**User-facing text:**
> "You indicated that BIR has notified you of a tier reclassification. Please confirm: What is your NEW tier (Micro/Small/Medium/Large) and what year does it take effect? Reclassification takes effect in the taxable year following the BIR notice."

---

## MRF-006: VAT Registration Status Uncertain (Gross Near ₱3M Threshold)

**Flag code:** MRF-006
**Trigger:** User's gross receipts are between ₱2,500,000 and ₱3,500,000 (within 20% of the ₱3M threshold)
**Engine fallback:** For income < ₱3M: compute as non-VAT (percentage tax applies, 8% option available). For income > ₱3M: compute as VAT-registered mandatory (percentage tax does NOT apply, 8% option NOT available).

**User-facing text (when gross < ₱3M but close):**
> "Your gross receipts (₱[amount]) are close to the ₱3,000,000 VAT registration threshold. If your actual receipts end up exceeding ₱3,000,000 for the year, you are legally required to register for VAT within 30 days of the month your cumulative receipts cross ₱3,000,000. This tool does NOT compute VAT — consult a tax professional if you expect to exceed the threshold."

**User-facing text (when gross > ₱3M):**
> "Your gross receipts (₱[amount]) exceed the ₱3,000,000 VAT threshold. The 8% income tax option is NOT available to you. We've computed your tax using Paths A (Itemized) and B (OSD) only. You are also required to register for VAT and file BIR Form 2550Q (quarterly VAT return). This tool does NOT compute VAT — please consult a tax professional for VAT compliance."

---

## MRF-007: Mixed Income — Compensation Source Uncertain

**Flag code:** MRF-007
**Trigger:** User indicates mixed income (compensation + business) but cannot determine if their employer filed 2316 (substituted filing)
**Engine fallback:** Include compensation in graduated rate computation; display a note about substituted filing

**User-facing text:**
> "If your employer already filed BIR Form 2316 for you and you have only one employer, you may qualify for 'substituted filing' (no need to file your own annual return for the compensation portion). However, since you also have business income, you are REQUIRED to file Form 1701 regardless. We've included all your compensation income in the computation."

---

## MRF-008: OSD vs. Itemized — Insufficient Expense Documentation

**Flag code:** MRF-008
**Trigger:** User is computing Path A (Itemized) but declares total documented expenses below 20% of gross receipts
**Engine fallback:** Compute Path A with the stated expenses; also compute Path B (OSD at 40%) and highlight that OSD gives a better result if expenses are genuinely below ~38%

**User-facing text:**
> "Your declared expenses (₱[amount]) are only [X]% of your gross receipts. For itemized deductions to be valid, ALL expenses must be: (a) substantiated with BIR-registered invoices/receipts, (b) ordinary and necessary for your business, and (c) not personal in nature. If you cannot fully document your expenses, the Optional Standard Deduction (40% of gross receipts) may be a safer and simpler option — and it gives you a higher deduction of ₱[OSD amount]."


---

## MRF-009: Business Purpose of Travel Expense Ambiguous (Mixed Personal/Business Trip)

**Flag code:** MRF-009
**Trigger:** User declares travel expense AND the destination appears to be a common vacation spot (engine cannot determine trip purpose from destination alone; this flag is for when the user marks it as "mixed trip" or the amount seems high relative to business income)
**Engine fallback:** Include only the business-portion amount as declared by the user. Engine does NOT automatically prorate.

**User-facing text:**
> "Travel expenses are deductible only for the business-related portion of a trip. If a trip had both personal and business purposes, only the incremental costs for the business portion are deductible (e.g., airfare may not be deductible if you would have made the trip anyway). Please ensure you have records showing the business purpose of each trip (meeting minutes, client correspondence, event programs). We've included your stated amount — verify this is the business-only portion."

**Resolution:** User manually computes the business portion and enters only that amount.

---

## MRF-010: Home Office — Cannot Provide Floor Plan or Exclusive Use Evidence

**Flag code:** MRF-010
**Trigger:** User claims home office deduction AND answers "No" when asked if they can provide documentation showing exclusive business use (floor plan, photos, lease)
**Engine fallback:** Set home_office_expense = 0; do NOT include in Path A computation

**User-facing text:**
> "Home office deductions require documentation of exclusive business use — a floor plan showing the dimensions of the dedicated workspace and evidence it is not used for personal activities. Without these documents, this deduction is high risk during BIR audit and we recommend not claiming it. If you can prepare this documentation, you may re-enter the expense."

---

## MRF-011: Dual-Use Equipment — Business Use Percentage Not Known

**Flag code:** MRF-011
**Trigger:** User declares equipment for depreciation AND marks it as "dual-use" (business + personal) but cannot estimate the business use percentage
**Engine fallback:** Apply 50% business use as a conservative default

**User-facing text:**
> "For equipment used for both business and personal purposes, only the business-use portion is deductible. We've applied 50% as a conservative default. To change this, estimate what percentage of your total device usage (hours or tasks) is for income-earning activities. Common ranges: full-time remote worker who also watches Netflix → 60-75%; occasional freelancer → 30-50%."

---

## MRF-012: NOLCO Year — Taxpayer Was Tax-Exempt in Prior Year

**Flag code:** MRF-012
**Trigger:** User indicates they had a net operating loss in a prior year AND that prior year they were tax-exempt (e.g., registered under BMBE law, RA 11470 COVID relief, or PEZA/BOI status)
**Engine fallback:** Exclude the NOLCO from that exempt year; it is not available for carry-over

**User-facing text:**
> "Net Operating Loss Carry-Over (NOLCO) is only available if the loss was incurred in a year when you were subject to income tax. If you were exempt from income tax in [year] (e.g., under BMBE, PEZA, or other tax exemption), the loss from that year cannot be carried over. We've excluded this NOLCO entry."

---

## MRF-013: Interest Expense — Cannot Determine Whether Loan Was for Capital Asset

**Flag code:** MRF-013
**Trigger:** User declares interest expense on a loan AND the description mentions purchasing real property, equipment, or other capital assets
**Engine fallback:** Include the interest as a deductible expense (assume business operating loan)

**User-facing text:**
> "Interest on loans used to PURCHASE capital assets (land, buildings, major equipment) must be capitalized — added to the asset's cost and depreciated — rather than deducted as interest expense in the year paid. However, interest on operating loans (working capital, short-term business loans) is deductible. We've included your stated interest as a deductible expense, but verify that this loan was for operating purposes, not asset acquisition."

---

## MRF-014: Bad Debt Claim — No Evidence of Prior Inclusion in Gross Income

**Flag code:** MRF-014
**Trigger:** User claims bad debts written off under itemized deductions AND the amount is substantial (> ₱10,000) AND user cannot confirm it was previously included in gross income
**Engine fallback:** Prompt for confirmation; if user cannot confirm, exclude the bad debt

**User-facing text:**
> "Bad debts are only deductible if the receivable was previously recognized as income (included in gross receipts in a prior year). If you are on CASH BASIS (you only record income when received), uncollected receivables were never in your income — so they cannot be bad debts. Please confirm: Was this ₱[amount] receivable included in your gross income in a prior year (₱[year])?"

**Resolution:** User confirms yes or no. If yes → include. If no (or cannot confirm) → exclude with explanation.

---

## MRF-015: R&D Expense — Unclear Whether Directly Connected to Business

**Flag code:** MRF-015
**Trigger:** User enters R&D expenses exceeding ₱50,000 AND description appears to be general training or self-improvement rather than specific business research
**Engine fallback:** Include the expense with a warning about audit risk

**User-facing text:**
> "Research and development expenses are deductible only if directly connected to your registered trade, business, or profession. General self-improvement courses, hobby research, or skills unrelated to your current business activity are not deductible. We've included your stated R&D expense of ₱[amount], but ensure it is specifically for a research project tied to your business operations."

---

---

## MRF-016: Foreign Employer — Philippine Tax Liability on Foreign Compensation

**Flag code:** MRF-016
**Trigger:** User indicates they receive salary/wages from a foreign employer that does NOT withhold Philippine income tax (e.g., remote work for a US, UK, or Australian company; work-from-home for offshore employer)
**Engine fallback:** Accept the user's declared taxable_compensation (converted to PHP) and set tax_withheld_by_employer = 0. Proceed with computation. Do NOT refuse to compute.

**What the engine CAN decide:**
- Philippine income tax due on the foreign compensation, computed identically to local compensation
- Total annual balance payable (since no TW exists)
- Recommend the mixed income regime comparison using the foreign comp amount

**What the engine CANNOT decide:**
- Whether a foreign tax credit applies (if the foreign employer withheld home-country taxes)
- The applicable foreign tax credit under any specific Philippine tax treaty (Philippines-US treaty, Philippines-UK treaty, etc.)
- The correct BSP exchange rate to use (user must provide the PHP-converted amount)

**User-facing text:**
> "You indicated your employer is a foreign company that does not withhold Philippine income tax. As a Filipino citizen, your foreign compensation is fully taxable in the Philippines under worldwide income taxation rules (NIRC Sec. 23(A)). Please enter your annual foreign compensation converted to Philippine Pesos at the Bangko Sentral ng Pilipinas (BSP) average exchange rate for the year. We will compute your Philippine income tax on this amount. Note: If your foreign employer withheld taxes in their country, you may be entitled to a foreign tax credit — this requires review by a tax professional as treaty provisions vary by country."

**Flag display:** Show as an informational banner (yellow/amber), not a blocking error. Engine proceeds with computation.

---

## MRF-017: Foreign Tax Credit Claim — Tax Treaty Offset

**Flag code:** MRF-017
**Trigger:** User indicates foreign employer withheld taxes AND user asks about offsetting those foreign taxes against Philippine IT liability
**Engine fallback:** Do NOT attempt to compute the foreign tax credit. Display the flag and proceed without applying the credit.

**What the engine CANNOT decide:**
- Whether a Philippines tax treaty exists with the taxpayer's employer's country (requires country-by-country treaty lookup)
- The amount of creditable foreign tax (limited to the Philippine tax on the foreign income — "credit limitation")
- Whether the taxpayer's specific type of income qualifies for treaty relief
- The treaty "tie-breaker" rules for dual residents

**User-facing text:**
> "You may be entitled to a foreign tax credit under a Philippine tax treaty with [country]. Computing the correct foreign tax credit requires reviewing the specific treaty provisions and may involve complex calculations (the credit is limited to the Philippine tax attributable to the foreign income). We recommend consulting a Certified Public Accountant or tax lawyer familiar with international taxation before filing. Your Philippine income tax computation above does NOT include any foreign tax credit — your actual tax due may be lower if a credit applies."

**Flag display:** Show as a prominent amber warning with a "Get Professional Help" CTA linking to CPA referral.

---

## MRF-018: Mixed Income Business Loss — NOLCO Tracking and Future Year Impact

**Flag code:** MRF-018
**Trigger:** User is a mixed income earner on Path A (Itemized), AND business_gross_income < itemized_deductions (i.e., the business has a net operating loss)
**Engine fallback:** Set business_nti = 0 (floored at zero). Do NOT allow negative business NTI to offset compensation income. Flag the NOLCO amount for future tracking.

**What the engine CAN decide:**
- Business NTI is ₱0 (loss cannot be applied to current year against compensation income)
- The amount of the NOLCO (= itemized_deductions − business_gross_income, limited to actual business net loss)
- That NOLCO can be carried forward for up to 3 years (NIRC Sec. 34(D)(3))

**What the engine CANNOT decide:**
- Whether the loss was genuine (not disguised personal expenses)
- Whether NOLCO applies if the taxpayer switches to OSD or 8% in a future year (NOLCO only applies under itemized deductions method; switching methods may affect NOLCO availability)
- Whether any NOLCO from a prior year under 8%/OSD (in which NOLCO does not accumulate) can be claimed in the current year

**User-facing text:**
> "Your business has a net operating loss of ₱[loss_amount] this year. Under Philippine tax law, this loss cannot reduce your compensation income. The loss may be carried forward as Net Operating Loss Carry-Over (NOLCO) and deducted from future business income for up to 3 years — but only if you continue to use the Itemized Deductions method in those future years. We've recorded your NOLCO of ₱[loss_amount] from [tax_year], which expires on December 31, [tax_year + 3]. Consider tracking this with a tax professional to ensure it is properly applied in future returns."

**Flag display:** Show as an informational note (blue) on the results screen. Include NOLCO tracking table: year incurred, amount, expiry year, remaining balance.

---

## MRF-019: VAT Transition Quarter — OPT/VAT Period Split

**Trigger:** Taxpayer crossed the ₱3M VAT threshold during a quarter, meaning part of the quarter was under OPT (percentage tax) and part under VAT.

**Why the engine cannot fully decide:**
- The exact day of VAT registration (effective date) determines how to split the quarter.
- BIR processing time for Form 1905 varies (same day to several weeks).
- The Form 2551Q for the partial OPT period must cover only the pre-VAT days.
- The first VAT return (2550Q or 2550M) must cover only post-VAT-registration transactions.
- The OPT and VAT amounts depend on which sales invoices fall before vs. after the VAT effective date.

**What the engine CAN do:**
- Detect the threshold breach (DT-12)
- Compute total OPT for the pre-breach portion of the year (Jan 1 through end of month before VAT)
- Compute income tax on full-year gross income under Path A or B
- Alert user to the split-quarter obligation

**What the user must resolve:**
1. Confirm the exact date they filed Form 1905 with the RDO
2. Confirm the BIR-approved VAT effective date (noted on the updated Certificate of Registration)
3. File Form 2551Q covering only the OPT period (January 1 through VAT effective date minus 1 day)
4. File Form 2550Q/M for VAT on sales from VAT effective date onwards
5. Maintain separate records for pre-VAT and post-VAT sales in the transition quarter

**User-facing text:**
> "Your gross sales crossed ₱3,000,000, requiring VAT registration. Part of your filing period was subject to 3% percentage tax (before your VAT registration took effect) and part subject to 12% VAT (after VAT registration). The exact split depends on your VAT effective date, which is shown on your updated BIR Certificate of Registration. Please consult your accountant to correctly file your Form 2551Q for the OPT period and begin VAT filings from your VAT registration date."

**Flag display:** Show as an alert (orange) on the results screen when `vat_registration_required == true` AND `vat_registered == false`.

**References:** CR-031, CR-033, DT-12; NIRC Sec. 116, Sec. 236(G).

---

## Cross-References

- For edge cases where the engine CAN make a decision: See [edge-cases.md](edge-cases.md)
- For legal basis of each flag: See [legal-basis.md](legal-basis.md)
- For the exact wizard UI text shown alongside these flags: See [../frontend/copy.md](../frontend/copy.md)
- For error states in engine (invalid inputs): See [../engine/error-states.md](../engine/error-states.md)
- For itemized deduction details: See [lookup-tables/itemized-deductions.md](lookup-tables/itemized-deductions.md)
- For mixed income computation rules: See [computation-rules.md](computation-rules.md) CR-029, CR-030
- For VAT vs OPT decision trees: See [decision-trees.md](decision-trees.md) DT-11, DT-12, DT-13
- For percentage tax rate history: See [lookup-tables/percentage-tax-rates.md](lookup-tables/percentage-tax-rates.md)
