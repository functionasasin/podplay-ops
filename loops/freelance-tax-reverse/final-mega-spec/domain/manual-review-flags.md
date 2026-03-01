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

## Cross-References

- For edge cases where the engine CAN make a decision: See [edge-cases.md](edge-cases.md)
- For legal basis of each flag: See [legal-basis.md](legal-basis.md)
- For the exact wizard UI text shown alongside these flags: See [../frontend/copy.md](../frontend/copy.md) (PENDING)
- For error states in engine (invalid inputs): See [../engine/error-states.md](../engine/error-states.md) (PENDING)
