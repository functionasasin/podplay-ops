# Manual Review Flags — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE (MRF-001 through MRF-021 fully specified)
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

---

## MRF-020: Client Did Not Issue Form 2307 — Income Earned With No CWT Certificate

**Flag code:** MRF-020
**Trigger:** User reports income from a corporate client or registered business but has no BIR Form 2307 for that payment.
**Context:** Corporations and registered businesses are legally required to withhold EWT and issue Form 2307 to the payee. Failure to do so is the payor's violation, but the payee cannot claim CWT without the certificate.

**Engine fallback behavior:**
- Income is included in gross receipts (still taxable).
- CWT credit for this income = ₱0 (no certificate = no credit).
- Do NOT estimate or impute a CWT amount.

**User-facing text:**
> "You have indicated income from [Payor Name] without a BIR Form 2307. If this payor is a corporation or registered business, they are legally required to issue you a 2307. We've included this income in your gross receipts but applied ₱0 in CWT credit for this amount. To claim the credit, request a BIR Form 2307 from your client. If they refuse, you may file a complaint with the BIR — but you cannot claim the credit without the certificate."

**Resolution:** User obtains the 2307 from client and enters it into the tool. Engine then includes the credit.

---

## MRF-021: Form 2307 Shows Lower Rate Than Expected — Possible Wrong ATC

**Flag code:** MRF-021
**Trigger:** User enters a Form2307Entry where the implied rate (tax_withheld / income_payment) is significantly lower than expected for the ATC code — OR — the ATC used is WI010 (5%) but the user is VAT-registered or the user's prior-year gross exceeded ₱3M.
**Context:** Client may have applied 5% (WI010) when 10% (WI011) should apply, resulting in under-withholding.

**Engine fallback behavior:**
- Credit the ACTUAL amount withheld (as shown on the 2307). Do NOT credit the "should-have-been" amount.
- Flag the discrepancy for user awareness.
- The additional tax (the "missing" withholding) will be due at filing as part of balance payable.

**User-facing text:**
> "The Form 2307 from [Payor Name] uses ATC WI010 (5% withholding). Based on your profile (VAT-registered / prior-year gross > ₱3M), your clients should be using WI011 (10%). We have applied the actual ₱[amount] credit from your certificate. The difference (₱[estimated_difference]) will show as additional balance payable on your annual return. To correct this for future quarters, ask [Payor Name] to use ATC WI011 for future payments and provide a Sworn Declaration update."

**Resolution:** For the current year, engine credits the actual amount. User notifies client to use the correct ATC going forward.

---

## MRF-022: Prior Year Excess Credits — Amount Uncertain (Lost Prior Year Return)

**Flag code:** MRF-022
**Trigger:** User says they elected "Carry Over" on their prior year return but cannot recall the exact overpayment amount (lost return, CPA prepared it, etc.).
**Context:** The prior year carry-over is Item 55 on Form 1701Q and Item 1 on the annual 1701/1701A Tax Credits section. The exact amount matters for correct quarterly computation.

**Engine fallback behavior:**
- Default prior_year_excess_credits = ₱0.
- Compute tax as if no carry-over exists (conservative — taxpayer may pay more now and correct later).
- Display flag prompting user to find the exact amount.

**User-facing text:**
> "You mentioned having carry-over credits from last year, but the exact amount is unknown. We've computed your taxes without this credit (using ₱0). To include it, find your prior year annual ITR (BIR Form 1701/1701A) — the overpayment amount appears in Part II as the 'Overpayment' figure, and 'Carry Over' should be checked. You can also request a copy from your RDO or your CPA. Once you have the amount, enter it in the 'Prior Year Excess Credits' field."

**Resolution:** User obtains prior year return and inputs the carry-over amount. Engine recomputes.

---

## MRF-023: Government Agency Withheld Percentage Tax (PT) — Separate from Income Tax CWT

**Flag code:** MRF-023
**Trigger:** User receives payments from a government agency and reports receiving a Form 2307 with ATC PT010 (percentage tax withholding, not income tax EWT).
**Context:** Government agencies (DepEd, DOH, LGUs, GOCCs) sometimes withhold 3% percentage tax on payments to non-VAT registered service providers under Sec. 114(C) of the NIRC. This is a WITHHOLDING OF PERCENTAGE TAX, not income tax EWT. The ATC PT010 on the 2307 indicates percentage tax withholding.

**Key distinction:**
- WI/WC series ATCs (WI010, WI011, WI157, etc.) = Income tax EWT → credits against Form 1701Q/1701A income tax
- PT010 on Form 2307 = Percentage tax withholding → credits against Form 2551Q percentage tax (Item 15), NOT against income tax

**Engine fallback behavior:**
- Do NOT credit PT010 2307 amounts against income tax due.
- Credit PT010 amounts against the quarterly percentage tax (Form 2551Q Item 15).
- Separate the user's 2307 entries into `income_tax_cwt_entries` (WI/WC ATCs) and `pt_cwt_entries` (PT ATCs).

**User-facing text:**
> "The Form 2307 from [Government Agency] uses ATC PT010, which represents PERCENTAGE TAX withheld (not income tax). This credit of ₱[amount] reduces your 3% percentage tax payable — not your income tax. We've applied it to your quarterly percentage tax return (Form 2551Q, Item 15). It does NOT reduce your income tax (Form 1701Q or 1701A)."

**Engine implementation:**
```
function classify_2307_entry(atc: str) -> "INCOME_TAX_CWT" | "PT_CWT" | "UNKNOWN":
  if atc starts with "WI" or atc starts with "WC":
    return "INCOME_TAX_CWT"
  elif atc starts with "PT":
    return "PT_CWT"
  else:
    return "UNKNOWN"   // trigger validation warning
```

**Resolution:** Engine automatically classifies. User needs no action beyond entering the 2307 data correctly.

---


## MRF-024: Cross-Year Revenue Reversal — Prior-Year Income Returned in Current Year

**Trigger condition:** Taxpayer reports sales returns, allowances, or discounts in the current year that exceed current-year gross sales/revenues/receipts. This typically occurs when a prior-year invoice (already declared as income in a prior annual ITR) is reversed in the current year.

**Why the engine cannot resolve this automatically:** The correct tax treatment depends on:
1. Whether the returned amount was previously included in gross income and taxed in a prior year.
2. Whether a refund was actually paid (cash basis), or only a credit memo issued (accrual basis).
3. Whether the correction should be handled as: (a) a reduction of current-year gross income (allowable only if the income was recognized in the current year), (b) a bad debt or loss deduction in the current year (if the client defaulted on a prior-year invoice), or (c) an amended prior-year return (if the income was overstated in the prior year due to error, not a commercial reversal).
4. Whether the freelancer uses cash or accrual accounting basis.

**What the engine does:** Blocks computation when `net_receipts < 0` (per EC-AR02 validation rule) and displays this flag.

**User guidance to display:**
"Your sales returns exceed your gross billings for this year. This usually means a prior-year transaction was reversed in the current year. Depending on the circumstances, this may require:
(a) Reducing your current-year income by only the amount billed in the current year (not prior-year billings),
(b) Claiming the prior-year income as a bad debt deduction under Sec. 34(E), or
(c) Amending your prior-year return if the income was never actually earned.
Please consult a CPA to determine the correct treatment. Enter only the sales returns attributable to current-year billings in the Sales Returns field to proceed."

**Engine behavior after user resolves:** User corrects the sales_returns_allowances field to ≤ gross_sales_receipts_fees. Engine then proceeds normally.

**Legal basis:** NIRC Sec. 34(E) (bad debts); NIRC Sec. 43 (accounting period); RR 2-98 on accounting methods.

---

## MRF-025: GPP Partner — 8% Option Not Available, Deduction Basis Unclear

**Flag code:** MRF-025
**Trigger:** User indicates their professional income comes from a General Professional Partnership (GPP) as a distributing partner receiving a distributive share.

**Why the engine cannot fully resolve this:**
- GPP income is governed by NIRC Sec. 26: the partnership itself is not taxed; instead, each partner includes their distributive share in gross income.
- Individual partner files Form 1701 (never 1701A, and the 8% option is expressly excluded per RR 8-2018 Sec. 4(A)(2)(b) — GPP partners are listed as ineligible for 8%).
- Only Paths A and B are available.
- The deductions available to the individual partner depend on whether the GPP has already taken deductions at the partnership level. If the GPP deducted operating expenses before distributing the net income, the individual cannot claim those same expenses again. If the GPP distributed gross income without deductions, the partner may claim their share of deductible expenses.
- The partner's Certificate of Share (issued by the GPP to each partner) should specify whether the amount is net of GPP-level deductions.

**What the engine CAN do:**
- Set `eight_percent_eligible = false` regardless of the partner's gross income from the GPP.
- Compute Paths A and B only.
- Path B: Apply OSD at 40% of the GPP distributive share (treating the distributive share as "gross income").
- Path A: Accept user-input of any personal deductions NOT already deducted at GPP level.

**What the engine CANNOT decide:**
- Whether the GPP has already deducted operating expenses before computing the distributable share.
- Whether the partner's stated expenses have already been reflected in the partnership's net income computation.
- The correct basis of the distributive share (gross vs. net of partnership expenses).

**Engine fallback behavior:**
- Proceed with computation using the distributive share as the gross income input.
- Use the Path B (OSD) as the default recommended path.
- Flag for user acknowledgment.

**User-facing text:**
> "You indicated income from a General Professional Partnership (GPP). GPP partners cannot use the 8% flat rate — only the graduated rates with Itemized or Optional Standard Deductions are available to you. Your computation uses Paths A and B only. Important: verify with your GPP managing partner whether your distributive share is GROSS (before GPP-level expenses) or NET (after GPP-level expenses). If the GPP has already deducted its operating costs, you cannot deduct those costs again as your personal expenses. Consult your CPA for the correct treatment."

**Legal basis:** NIRC Sec. 26; RR 8-2018 Sec. 4(A)(2)(b) (GPP partner exclusion from 8% eligibility).

---

## MRF-026: Non-Resident Filipino Citizen — Different Source Rules Apply

**Flag code:** MRF-026
**Trigger:** User indicates they are a Filipino citizen who is a permanent resident outside the Philippines, an OFW (Overseas Filipino Worker) under a valid work contract abroad, or otherwise establishes non-resident status for the tax year.

**Why this is out of scope:**
- NIRC Sec. 23(B): Non-resident citizens are taxable ONLY on income from Philippine sources. Foreign-sourced income is exempt.
- NIRC Sec. 23(C): OFWs receiving compensation for services rendered overseas are exempt from Philippine income tax on that overseas compensation.
- The source rules under NIRC Sec. 42 are complex (location of performance, location of property, residence of payer) and require case-by-case analysis.
- This tool is designed for resident Filipino taxpayers and cannot correctly determine what portion of a non-resident citizen's income is Philippine-sourced vs. foreign-sourced.

**Engine fallback behavior:**
- Do NOT attempt to compute income taxes for non-resident citizens.
- Display this flag immediately when user selects "Non-Resident Citizen" or "OFW" as residency status.
- Block computation and redirect to professional consultation.

**User-facing text:**
> "This tool is designed for resident Filipino citizens and resident aliens filing under the standard individual income tax schedule. If you are a non-resident Filipino citizen (living and working abroad permanently or as an OFW), your tax situation is different: you are taxable only on income from Philippine sources, and your overseas employment income is generally exempt from Philippine income tax. The source rules are complex and require professional analysis. Please consult a Certified Public Accountant or tax lawyer familiar with non-resident citizen taxation and BIR Revenue Memorandum Circular requirements for OFWs and emigrants."

**Legal basis:** NIRC Sec. 23(B) (non-resident citizens taxable only on Philippine-sourced income); Sec. 23(C) (OFW compensation exemption); Sec. 42 (income from Philippine sources definition).

---

## MRF-027: Non-Resident Alien — Different Rate Schedule and Treaty Rules Apply

**Flag code:** MRF-027
**Trigger:** User indicates they are a foreign national who is NOT a resident of the Philippines (non-resident alien).

**Why this is out of scope:**
- NIRC Sec. 25(A): Non-resident aliens ENGAGED in trade or business in the Philippines are taxed at graduated rates on Philippine-source income, but with different rules than resident taxpayers (no personal exemptions, different OSD application).
- NIRC Sec. 25(B): Non-resident aliens NOT engaged in trade or business are taxed at a flat 25% final withholding tax on gross Philippine-source income.
- Philippines has tax treaties with over 40 countries that may reduce or eliminate withholding rates on specific income types (dividends, royalties, professional services, etc.).
- The correct computation requires determining: (a) resident vs. non-resident status, (b) engaged in trade/business vs. not, (c) type of income, (d) applicable treaty (if any), (e) treaty eligibility conditions.
- None of these determinations can be made reliably from the inputs this tool collects.

**Engine fallback behavior:**
- Do NOT attempt to compute income taxes for non-resident aliens.
- Display this flag immediately when user selects "Foreign National / Non-Resident Alien" as residency/citizenship status.
- Block computation and redirect to professional consultation.

**User-facing text:**
> "This tool is designed for Filipino citizens and resident aliens subject to the standard individual income tax schedule. If you are a foreign national who is not a resident of the Philippines, your Philippine income tax treatment is governed by separate rules (NIRC Section 25) and may be affected by a tax treaty between the Philippines and your home country. The Philippines has tax treaties with over 40 countries, including the United States, Japan, Singapore, Australia, the United Kingdom, and others. These treaties may significantly reduce your tax liability on specific income types. Please consult a Philippine tax lawyer or CPA specializing in international taxation to determine your correct tax obligations."

**Legal basis:** NIRC Sec. 25(A) (NRA-ETB rates); Sec. 25(B) (NRA-NETB 25% flat rate); applicable bilateral tax treaties.

---

## MRF-028: VAT-Registered Taxpayer Using Itemized Deductions — Creditable Input VAT May Have Been Double-Counted

**Flag code:** MRF-028
**Trigger:** `is_vat_registered = true` AND `selected_path = PATH_A` (itemized deductions used)

**Why the engine cannot resolve this:**
- VAT-registered taxpayers file quarterly VAT returns (BIR Form 2550Q) on which they claim creditable input VAT against output VAT. Input VAT creditable on the VAT return represents a tax recovery — it is NOT a cost of doing business for income tax purposes.
- However, non-creditable input VAT (from non-VAT-registered suppliers, from exempt transactions, from purchases disallowed as VAT credits, or input VAT that has been denied on audit) IS a genuine business cost and CAN be deducted as an expense under NIRC Sec. 34(A) or 34(C).
- The engine receives a lump-sum itemized expense figure from the user. It cannot determine what portion of those expenses already had their VAT component recovered through the quarterly VAT return vs. which portions represent non-creditable input VAT costs.
- If the user entered the full invoice prices (inclusive of VAT) for supplier purchases, their expense deduction is inflated — the creditable input VAT portion should have been excluded.
- If the user entered only the net (VAT-exclusive) amounts for deductible purchases, no adjustment is needed.
- The engine cannot determine which approach the user followed without reviewing actual invoices and VAT return data.

**Engine fallback behavior:**
- Accept the expense figures as entered by the user.
- Do NOT add or subtract any input VAT adjustment.
- Display MRF-028 advisory to alert the user to verify their expense inputs.
- Continue with the computation using the entered amounts.

**User-facing text:**
> "As a VAT-registered taxpayer claiming itemized deductions, please verify that your business expense figures are entered correctly for income tax purposes. Any input VAT that you already claimed as a credit on your quarterly VAT return (BIR Form 2550Q) should NOT be included in your income tax deduction — that VAT has already been recovered. Only include non-creditable input VAT (from non-VAT-registered suppliers, exempt purchases, or VAT credits you were not entitled to claim) as part of your deductible expenses. We have computed your income tax using the expense amounts you entered. If you are unsure whether your figures exclude creditable input VAT, consult your CPA or bookkeeper before filing."

**Example:**
- VAT-registered architect pays ₱112,000 to a VAT-registered supplier (₱100,000 + ₱12,000 VAT).
- The ₱12,000 input VAT is credited on the quarterly VAT return.
- For income tax itemized deduction: the deductible amount is ₱100,000 (net of VAT), NOT ₱112,000.
- If the architect entered ₱112,000 in the expense field, income tax deduction is overstated by ₱12,000.
- The architect should enter ₱100,000 in the expense field.
- Exception: if the supplier is non-VAT-registered, the entire ₱112,000 (or the full invoice amount including any embedded taxes) is the cost of the purchase, and the full amount is deductible.

**Legal basis:** NIRC Sec. 110(A) (creditable input tax); NIRC Sec. 34(A)(1) (ordinary and necessary business expenses); RR 16-2005 (VAT regulations); RMC 54-2014 (deductibility of non-creditable input VAT).

---

## MRF-029: BMBE-Registered Business — Income Tax Exemption Cannot Be Verified by Engine

**Flag code:** MRF-029
**Trigger:** `total_business_assets` ≤ ₱3,000,000 AND user selects "BMBE registered" in the taxpayer profile questionnaire (optional field in WS-01).

**Why the engine cannot resolve this:**
- RA 9178 (Barangay Micro Business Enterprise Act of 2002) exempts BMBE-registered businesses from income tax.
- BMBE registration is issued by the Local Government Unit (LGU) where the business is located. The engine has no way to verify whether the user holds a valid, current Certificate of Authority from their LGU.
- BMBE exemption applies only while the Certificate of Authority is valid (1-year renewable). The user may have an expired certificate or may not have renewed it.
- Asset threshold is ₱3,000,000 total assets, excluding land. The engine receives gross receipts, not total assets. A business with ₱2.9M gross receipts could have total assets above or below ₱3M.
- The engine cannot determine whether the user qualifies or has a valid BMBE registration.

**Engine fallback behavior:**
- Do NOT apply the BMBE income tax exemption.
- Compute income tax under the standard NIRC Sec. 24(A) rules.
- Display MRF-029 advisory prominently on the results screen.
- Add note: "If you are BMBE-registered, your actual income tax due may be ₱0. Show your Certificate of Authority to your CPA or BIR."

**User-facing text:**
> "You indicated that your business may be registered as a Barangay Micro Business Enterprise (BMBE) under RA 9178. BMBE-registered businesses with total assets not exceeding ₱3,000,000 (excluding land) are exempt from income tax — meaning your income tax due could be ₱0 instead of the amount shown here. TaxKlaro cannot verify your BMBE registration status and has NOT applied this exemption. To confirm your exemption, present your valid BMBE Certificate of Authority (issued by your Local Government Unit) to a CPA or your Revenue District Office before filing. The figures shown above apply only if you are NOT BMBE-registered or your certificate has expired."

**Legal basis:** RA 9178, Sec. 7 (Income Tax Exemption); DTI-DOLE-DOF Joint Memorandum Circular No. 1, series of 2009 (BMBE guidelines); NIRC Sec. 24(A) (general income tax rule that BMBE exemption overrides).

---

## MRF-030: Depletion Deduction for Mining/Oil Operations — Specialized Rules Apply

**Flag code:** MRF-030
**Trigger:** User selects income category "Mining" or "Oil and Gas Extraction" or enters the expense category "Depletion of natural resources" in the itemized deductions wizard step.

**Why the engine cannot resolve this:**
- NIRC Sec. 34(G) allows a deduction for depletion of oil and gas wells and mines. The allowable depletion is based on the cost-depletion method (or, for oil and gas, optionally the percentage-depletion method) applied to the adjusted cost basis of the natural resource.
- Computing depletion requires: acquisition cost of the property, estimated recoverable reserves (barrels, metric tons), current-year production, and prior accumulated depletion. The engine does not collect these inputs.
- Mining income may also be subject to the Government Share under the Mining Act (RA 7942) and special royalty arrangements that affect deductible expenses.
- Individual mining operators are extremely rare among TaxKlaro's target users.

**Engine fallback behavior:**
- Exclude the depletion deduction from the itemized deduction computation.
- Treat any "depletion" amount entered as a non-deductible item.
- Display MRF-030 notice.
- Compute income tax without the depletion deduction.

**User-facing text:**
> "TaxKlaro does not compute depletion deductions for mining or oil and gas operations under NIRC Section 34(G). The depletion deduction requires specialized inputs (property cost basis, estimated recoverable reserves, annual production data) that are outside the scope of this tool. Your income tax computation above does NOT include any depletion deduction. Consult a CPA specializing in mining or extractive industries to compute your correct depletion allowance and include it in your actual BIR filing."

**Legal basis:** NIRC Sec. 34(G) (depletion of oil and gas wells and mines); RA 7942 (Philippine Mining Act of 1995); RA 8550 (Philippine Fisheries Code — similar issue for fishery resources).

---

## MRF-031: Agricultural or Fisheries Income — Special Deductions May Apply

**Flag code:** MRF-031
**Trigger:** User selects income category "Agriculture," "Farming," "Aquaculture," or "Fisheries" as their primary business activity in the wizard taxpayer profile step (WS-01).

**Why the engine cannot resolve this:**
- Agricultural income earners may qualify for special deductions not listed in NIRC Sec. 34(A)-(K), including deductions for farm development expenses, soil and water conservation expenses (up to 25% of gross income from farming), and livestock-related deductions.
- Agri-related businesses may also qualify for NIRC Sec. 61 deduction for farm development expenditures (deductible in year paid or up to 10 years).
- Small farmers and fisherfolk registered with the appropriate agency may have access to additional tax benefits or exemptions under agricultural promotion laws.
- The engine's itemized deduction framework is designed for service and trading income and does not include agricultural-specific line items.

**Engine fallback behavior:**
- Continue computation using standard itemized deductions framework.
- Agricultural expenses entered in standard categories (fertilizer as "supplies," farm equipment depreciation, etc.) will be included.
- Do NOT claim farm development expenses (NIRC Sec. 61) unless explicitly entered by the user.
- Display MRF-031 advisory.

**User-facing text:**
> "Your income category is agriculture/farming/fisheries. TaxKlaro uses the standard self-employment deduction framework for your computation. Agricultural businesses may qualify for additional deductions not covered here, including farm development expense deductions under NIRC Section 61 (deductible up to 10 years) and soil and water conservation deductions (up to 25% of gross farming income). These specialized deductions are NOT included in the figures above. We recommend consulting a CPA familiar with agricultural taxation to ensure you claim all allowable deductions before filing."

**Legal basis:** NIRC Sec. 61 (farm development expenditures); NIRC Sec. 34(A) (ordinary and necessary business expenses, applicable to farming); RA 8435 (Agriculture and Fisheries Modernization Act — related tax incentives).

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
- For CWT computation rules: See [computation-rules.md](computation-rules.md) CR-035 through CR-040
- For EWT ATC code table: See [lookup-tables/cwt-ewt-rates.md](lookup-tables/cwt-ewt-rates.md)
- For annual reconciliation edge cases: See [edge-cases.md](edge-cases.md) EC-AR01 through EC-AR14
- For annual reconciliation computation: See [computation-rules.md](computation-rules.md) CR-049 through CR-055
