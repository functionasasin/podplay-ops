# Legal Disclaimers — TaxKlaro

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Scope exclusions: [legal/limitations.md](limitations.md)
- Terms of service: [legal/terms-of-service.md](terms-of-service.md)
- Privacy policy: [legal/privacy-policy.md](privacy-policy.md)
- Frontend copy (summary versions): [frontend/copy.md § 16](../frontend/copy.md)
- UI placement rules: [frontend/results-views.md](../frontend/results-views.md)

---

## Purpose of This Document

This file contains the **verbatim legal disclaimer text** for every location in TaxKlaro where a disclaimer, notice, or legal statement appears. A forward loop implementing the product reads this file to obtain the exact text — no paraphrasing, no rewriting, no "add appropriate disclaimer here."

**What is in this file:**
- Full-page disclaimer text (the `/disclaimer` route)
- Inline result-page disclaimer (expandable banner)
- Onboarding screen disclaimer (before first computation)
- PDF export footer disclaimer
- Email footer disclaimer
- Footer compact disclaimer (one-liner)
- Specialized notices (regime change, penalty computation, CWT estimation)
- Disclaimer update procedure

**What is NOT in this file:**
- Terms of service clauses (see `legal/terms-of-service.md`)
- Privacy policy text (see `legal/privacy-policy.md`)
- Scope exclusions list (see `legal/limitations.md`)
- UI placement/layout rules (see `frontend/results-views.md`)

---

## Section 1: Full-Page Disclaimer (`/disclaimer` route)

**Page title (browser tab):** `Disclaimer — TaxKlaro`
**Page heading:** `Disclaimer and Legal Notices`
**Last-updated subheading:** `Effective Date: March 1, 2026`

---

### 1.1 General Disclaimer

TaxKlaro is a tax computation and planning tool operated for general informational and educational purposes only. The results, recommendations, regime comparisons, computations, savings estimates, penalty calculations, and other outputs provided by TaxKlaro (collectively, "Computations") do not constitute professional tax advice, accounting advice, legal advice, financial advice, or any other form of professional advice or professional service.

Use of TaxKlaro does not create any client–adviser relationship, attorney–client relationship, or accountant–client relationship between you and TaxKlaro, its owners, developers, operators, or any affiliated persons. Any such relationship can only be formed through a written engagement agreement with a licensed professional.

---

### 1.2 Regulatory Basis and Accuracy

The Computations provided by TaxKlaro are based on the following Philippine tax laws and regulations as interpreted by the developers of TaxKlaro:

- National Internal Revenue Code of 1997 (NIRC), as amended
- Republic Act No. 10963 (Tax Reform for Acceleration and Inclusion / TRAIN Law, effective January 1, 2018)
- Republic Act No. 11534 (Corporate Recovery and Tax Incentives for Enterprises / CREATE Law, effective April 11, 2021)
- Republic Act No. 11976 (Ease of Paying Taxes Act / EOPT Act, effective January 22, 2024)
- Bureau of Internal Revenue Revenue Regulations No. 8-2018 (TRAIN implementing rules for individual income tax)
- BIR Revenue Memorandum Circular No. 50-2018 (8% income tax option for mixed-income earners)
- BIR Revenue Regulation No. 16-2023 (creditable withholding on electronic marketplace remittances)
- Other applicable BIR Revenue Regulations, Revenue Memorandum Orders, and Revenue Memorandum Circulars as cited in the engine documentation

TaxKlaro makes every reasonable effort to maintain accurate and current Computations. However, **TaxKlaro makes no representation, warranty, or guarantee, express or implied, that the Computations are:**

1. Error-free or free from mathematical mistakes
2. Current as of the date of your use (tax laws may have been amended after the last engine update)
3. Applicable to your specific tax situation, income type, or personal circumstances
4. Consistent with the Bureau of Internal Revenue's current interpretation of applicable law
5. Consistent with any pending BIR ruling, Revenue Memorandum Circular, or Revenue Memorandum Order not yet reflected in the engine

---

### 1.3 User Responsibility

You are solely responsible for:

1. **Verifying Computations before filing:** All Computations produced by TaxKlaro must be verified with the Bureau of Internal Revenue (BIR) or a qualified tax professional — a Certified Public Accountant (CPA) accredited by the Philippine Institute of Certified Public Accountants (PICPA) or the Board of Accountancy under PRC, a tax attorney, or a BIR-accredited tax agent — before you file any tax return or remit any tax payment.

2. **Accuracy of your inputs:** TaxKlaro cannot verify that the financial figures, deduction amounts, withholding credits, and other information you enter are accurate. Computations are only as reliable as the inputs provided. Understating income, overstating deductions, or entering incorrect BIR Form 2307 (creditable withholding tax) amounts will produce incorrect Computations.

3. **Compliance with BIR filing obligations:** TaxKlaro is a computation and planning tool. It does not file tax returns on your behalf, remit tax payments, register you with the BIR, or represent you before the BIR in any capacity. The obligation to file timely and accurate returns remains entirely yours.

4. **Regime election irrevocability:** The election of a tax filing regime (8% income tax option, Graduated + OSD, or Graduated + Itemized Deductions) has legal consequences. An election of the 8% option is irrevocable for the taxable year once made and reflected on a filed quarterly return. TaxKlaro recommends a regime based on mathematical comparison of projected outcomes; it does not account for audit risk, documentation availability, or other practical factors that a CPA would consider. The final regime election decision is yours.

5. **Periodic re-evaluation:** Your optimal tax regime may change from year to year as your income, expenses, and business circumstances change. TaxKlaro recommends re-running the optimizer at the start of each taxable year.

---

### 1.4 Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TAXKLARO, ITS OWNERS, OPERATORS, DEVELOPERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AND AGENTS SHALL NOT BE LIABLE FOR ANY:

1. Tax deficiency, underpayment, or shortfall assessed by the BIR or any other tax authority arising from reliance on TaxKlaro Computations
2. Surcharge, interest, or compromise penalty assessed by the BIR due to late filing, incorrect filing, or underpayment resulting from Computations
3. Costs of tax audit defense, BIR protest proceedings, or tax litigation
4. Direct, indirect, incidental, special, consequential, or punitive damages of any kind whatsoever
5. Loss of income, revenue, profits, goodwill, data, contracts, or business opportunities
6. Any claim arising from the use of, inability to use, or reliance on TaxKlaro, its Computations, its recommendations, or its content

WHERE THE APPLICABLE LAW IN THE REPUBLIC OF THE PHILIPPINES DOES NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, THE ABOVE LIMITATION MAY NOT APPLY TO YOU TO THE FULL EXTENT SUCH DAMAGES ARE NOT EXCLUDABLE UNDER APPLICABLE LAW. IN THOSE JURISDICTIONS, TAXKLARO'S LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.

---

### 1.5 Professional Advice Recommendation

TaxKlaro strongly recommends consulting a licensed Certified Public Accountant before:

1. Filing BIR Form 1701 or Form 1701A for the first time as a self-employed individual or professional
2. Electing the 8% income tax option for any taxable year
3. Switching your tax regime from a prior year's election
4. Claiming itemized deductions exceeding ₱500,000 in any year
5. Handling mixed income situations (compensation income + self-employment income)
6. Reporting income from foreign clients, overseas employment, or foreign-based platforms
7. Dealing with any BIR audit notice, Letter of Authority, or assessment
8. Operating a business approaching the ₱3,000,000 VAT registration threshold
9. Claiming Net Operating Loss Carryover (NOLCO) from prior taxable years
10. Operating under any special tax regime (PEZA, BOI, BMBE, GPP, or similar)

For a referral to an accredited CPA near you, visit the Philippine Institute of Certified Public Accountants (PICPA) at picpa.com.ph, or contact your nearest BIR Revenue District Office.

---

### 1.6 Non-Affiliation

TaxKlaro is an independent private service and is **not affiliated with, endorsed by, accredited by, or in any way connected to:**

- The Bureau of Internal Revenue (BIR) of the Republic of the Philippines
- The Department of Finance (DOF)
- The Professional Regulation Commission (PRC) or the Board of Accountancy (BOA)
- The Philippine Institute of Certified Public Accountants (PICPA)
- Any government agency, government-owned or controlled corporation (GOCC), or instrumentality of the Philippine government

The BIR official website is **bir.gov.ph**. For official BIR tax guidance, visit the official BIR website or contact your Revenue District Office.

---

### 1.7 No Practice of Accountancy or Law

TaxKlaro is a software tool that performs arithmetic computations based on publicly available tax law formulas. It does not constitute the practice of accountancy as defined by Republic Act No. 9298 (Philippine Accountancy Act of 2004), the practice of law, or any other licensed or regulated professional practice. TaxKlaro does not hold a license to practice any profession. No person employed by or associated with TaxKlaro acts as your accountant, lawyer, tax agent, or professional adviser in connection with your use of this tool.

---

### 1.8 Third-Party Links and Content

TaxKlaro may provide links to external websites, including the BIR website (bir.gov.ph), the Official Gazette (officialgazette.gov.ph), and other government or informational resources. These links are provided for informational convenience only. TaxKlaro does not control, maintain, or guarantee the accuracy, currency, or completeness of third-party content. Inclusion of a link does not constitute endorsement of the linked site.

---

### 1.9 Governing Law

This disclaimer and all matters related to TaxKlaro are governed by the laws of the Republic of the Philippines. Any disputes arising from the use of TaxKlaro shall be subject to the exclusive jurisdiction of the courts of the Philippines.

---

### 1.10 Disclaimer Updates

TaxKlaro may update this disclaimer from time to time to reflect changes in the law, our practices, or other circumstances. When we update the disclaimer, we will revise the "Effective Date" at the top of this page. Continued use of TaxKlaro after the effective date of any update constitutes acceptance of the updated disclaimer. We encourage you to review this page periodically.

---

## Section 2: Inline Results-Page Disclaimer (Expandable Banner)

**Placement:** Appears on the computation results page (`/compute/results`) as a collapsible amber-bordered banner immediately below the regime comparison table. Default state: collapsed (showing short version only). Expandable by clicking "See full disclaimer."

**Short version (always visible, 1 line):**

> Computations are for guidance only. Not a substitute for professional tax advice. [See full disclaimer →](/disclaimer)

**Expanded version (shown when user clicks "See full disclaimer"):**

> **Important Disclaimer**
>
> The tax figures shown above are estimates based on the information you entered. TaxKlaro computes your income tax under all available regimes (8% flat rate, Graduated + OSD, and Graduated + Itemized Deductions) using the formulas in the NIRC as amended by TRAIN, CREATE, and the EOPT Act. While we strive for accuracy, these figures may differ from your actual BIR tax liability due to: (a) inputs you entered that differ from your actual books of account; (b) BIR reclassification of income or disallowance of deductions; (c) additional income or credits not reflected; (d) pending BIR regulations not yet incorporated; or (e) computational errors.
>
> **These computations do not constitute professional tax advice.** The recommended regime is a mathematical recommendation only — it does not account for audit risk, practical documentation challenges, or your unique business circumstances. Always verify with a licensed CPA or BIR before filing.
>
> TaxKlaro is not affiliated with the BIR. [See our full disclaimer →](/disclaimer)

---

## Section 3: Onboarding Pre-Computation Notice

**Placement:** Appears on Wizard Step WS-00 (Welcome / Pre-Computation Introduction screen) as a notice card before the user begins data entry. The user must scroll past this notice (not required to click "I agree" — the act of proceeding constitutes acknowledgment).

**Card type:** Blue informational card (not amber warning — this is informational, not alarming)

**Card heading:** About This Tool

**Card body:**

> TaxKlaro helps you estimate and compare your Philippine income tax under all three BIR-allowed methods. Enter your gross income, expenses, and withholding credits and we'll show you which regime — 8% Flat Rate, Graduated + OSD (40%), or Graduated + Itemized Deductions — gives you the lowest legal tax liability.
>
> **This tool is for planning and estimation only.** It does not file returns on your behalf, does not create a client relationship, and does not constitute professional tax advice. Complex tax situations — including PEZA / BOI incentives, foreign income, BIR audit response, and business partnerships — require a licensed CPA.
>
> By continuing, you acknowledge that results are estimates to be verified with a CPA or BIR before filing.

**Card footer link:** [See full disclaimer →](/disclaimer)

---

## Section 4: Regime Change Warning Notice

**Placement:** Appears as an amber advisory card when the computation recommends a different regime than the user's prior year election (detected when user selects a prior-year regime in the wizard that differs from the recommended regime for the current year).

**Card heading:** Regime Change: Important Legal Notice

**Card body:**

> You are currently on the **{prior_year_regime}** for tax year {prior_year}. Based on your inputs, TaxKlaro recommends switching to **{recommended_regime}** for tax year {current_year}.
>
> **Before making this change:**
>
> - The **8% income tax option**, once elected for a taxable year, is irrevocable for that year and must be indicated on your first quarterly return (Form 1701Q Q1). You cannot switch mid-year once your Q1 has been filed.
> - Switching from Graduated + Itemized to Graduated + OSD (or vice versa) for the annual return requires no formal election — you simply select the deduction method when filing Form 1701 by April 15.
> - Switching from 8% to Graduated (any deduction method) in a new tax year is allowed — you simply do not elect the 8% option on your new Q1 return.
>
> **We strongly recommend consulting a licensed CPA** before changing your tax regime to understand the full implications for your specific situation.

**Substitution variables:**
- `{prior_year_regime}`: "Graduated + OSD", "Graduated + Itemized Deductions", or "8% Flat Rate"
- `{recommended_regime}`: "Graduated + OSD", "Graduated + Itemized Deductions", or "8% Flat Rate"
- `{prior_year}`: four-digit integer year (e.g., 2024)
- `{current_year}`: four-digit integer year (e.g., 2025)

---

## Section 5: Penalty Computation Disclaimer

**Placement:** Appears as a blue informational card on any results screen that includes a penalty computation (late filing scenario or user-requested penalty estimate).

**Card heading:** About Penalty Estimates

**Card body:**

> The penalty estimate shown is computed using the rates and schedules in the NIRC as amended by the EOPT Act (RA 11976) and the BIR penalty schedule under RMO 7-2015 (Annex A). Actual penalties may differ because:
>
> 1. **BIR compromise negotiation:** The BIR may accept a lower compromise amount during settlement, particularly for small amounts or first-time violations.
> 2. **Abatement applications:** Under BIR Revenue Memorandum Order No. 23-2020, the BIR Commissioner may abate or cancel surcharges and interest in meritorious cases (e.g., force majeure, incorrect BIR guidance).
> 3. **Tax Amnesty:** A General Tax Amnesty program, if enacted by Congress, may reduce or eliminate outstanding liabilities — no such program is currently in effect as of March 2026.
> 4. **Disputed amounts:** If you dispute the underlying tax, penalties accrue on the finally determined tax amount, which may be lower than computed.
>
> This penalty estimate is for planning purposes only. For past-due taxes, consult a CPA or directly contact your Revenue District Office to determine the exact amount owed.

---

## Section 6: CWT / Form 2307 Disclaimer

**Placement:** Appears as a blue informational card on results screens where the user has entered creditable withholding tax (CWT) from BIR Form 2307.

**Card heading:** About Withholding Tax Credits

**Card body:**

> The creditable withholding tax (CWT) credits shown are based on the BIR Form 2307 amounts you entered. To claim these credits when filing, you must:
>
> 1. **Retain original Form 2307 certificates** from each withholding agent (client, employer, or platform). The BIR may require originals during audit.
> 2. **Verify ATC codes:** Credits are valid only if the Alphanumeric Tax Code (ATC) on your Form 2307 matches an applicable withholding category for your income type (professional fees = WC010/WC011, platform remittances = WI760/WC760, etc.).
> 3. **Match amounts to your gross income:** CWT withheld should correspond to gross income you have already declared. Claiming CWT on income not declared in gross receipts is a discrepancy that may trigger a BIR audit.
>
> Excess CWT (where credits exceed tax due) is refundable or may be carried over to the next quarter. TaxKlaro shows the refund/carryover amount but does not file refund claims on your behalf.

---

## Section 7: PDF Export Footer Disclaimer

**Placement:** Printed at the bottom of every page of the PDF export generated by the Pro/Enterprise plan. Font size: 8pt. Color: `#6B7280` (gray-500).

**Text (verbatim, as it appears on PDF):**

> This document was generated by TaxKlaro (taxklaro.ph) on {pdf_generation_date} for planning and reference purposes only. It is NOT an official BIR document and has not been submitted to or reviewed by the Bureau of Internal Revenue. The figures shown are estimates based on inputs provided by the user and the tax rules in effect as of the engine update date (see page 1 header). Actual tax due may differ. Verify all figures with a licensed CPA before filing. TaxKlaro is not affiliated with the BIR or any Philippine government agency. For official tax forms and filing, use BIR eBIRForms at efps.bir.gov.ph or an authorized eTSP.
>
> TaxKlaro — Not professional tax advice. For general informational purposes only.

**Substitution variable:**
- `{pdf_generation_date}`: Full date string in format "January 15, 2026" (Philippine English locale, long date format)

---

## Section 8: Email Footer Disclaimer

**Placement:** Appears in the footer of every transactional email sent by TaxKlaro (welcome, computation saved, deadline reminder, receipt, password reset). Font size: 11px. Color: `#9CA3AF` (gray-400).

**Text (verbatim):**

> TaxKlaro computations are for informational purposes only and do not constitute professional tax advice. Always verify with a licensed CPA before filing. TaxKlaro is not affiliated with the Bureau of Internal Revenue.
> © 2026 TaxKlaro · taxklaro.ph · [Unsubscribe]({unsubscribe_url}) · [Privacy Policy](https://taxklaro.ph/privacy) · [Terms](https://taxklaro.ph/terms)

**Substitution variable:**
- `{unsubscribe_url}`: One-click unsubscribe URL generated per-user per-email-type, e.g. `https://taxklaro.ph/unsubscribe?token={one_time_token}&type={email_type}`

---

## Section 9: Footer Compact Disclaimer (All Pages)

**Placement:** One-line text in the global page footer, below the footer navigation links. Font size: 12px. Color: `#6B7280` (gray-500).

**Text (verbatim):**

> Computations are for guidance only and do not constitute professional tax advice. Always verify with a licensed CPA or BIR before filing. TaxKlaro is not affiliated with the Bureau of Internal Revenue. [Full Disclaimer](/disclaimer)

---

## Section 10: Cookie / Session Notice

**Placement:** Thin banner at the top of the page on first visit (before any cookies are set). Dismissible by clicking "OK."

**Text (verbatim):**

> TaxKlaro uses cookies and local storage to save your computation session and preferences. No financial data is shared with third parties. [Privacy Policy](/privacy)  [OK]

---

## Section 11: First-Time User Computation Acknowledgment

**Placement:** Shown on the results page the first time an anonymous (not logged-in) user completes a computation. Displayed as an amber card above the results table.

**Card heading:** Your Computation Is Ready

**Card body:**

> Below are your estimated income tax figures for the inputs you provided. These are estimates only — not a filed return, not a BIR-verified amount, and not professional tax advice.
>
> **To save your computation and access it later,** [create a free account →](/signup).
>
> **Before filing your return,** verify these figures with a licensed CPA or at your nearest BIR Revenue District Office.

---

## Section 12: Disclaimer Acceptance Log

For compliance and audit trail purposes, TaxKlaro logs the following events in the `disclaimer_acceptances` database table (see `database/schema.md § 3.12`):

| Event | Logged Data |
|-------|------------|
| User views `/disclaimer` page | user_id (null if anonymous), session_id, ip_address (hashed), timestamp, disclaimer_version |
| User completes first computation (anonymous) | session_id, ip_address (hashed), timestamp, disclaimer_version |
| User creates account (sign-up) | user_id, timestamp, disclaimer_version, tos_version, privacy_version |
| User views PDF export | user_id, computation_id, timestamp, pdf_disclaimer_version |

**Disclaimer version format:** `YYYY-MM-DD` matching the Effective Date in Section 1 header. Current version: `2026-03-01`.

When the disclaimer is updated, the new version date must be:
1. Updated in this file (Section 1.10 header and Section 12)
2. Updated in the `DISCLAIMER_VERSION` environment variable (see `deployment/environment.md`)
3. Deployed before the disclaimer change is live
4. Users who accepted a prior version are presented with a "We updated our disclaimer" notice on their next login

---

## Section 13: Disclaimer Display Rules by Screen

| Screen / Location | Disclaimer Type | Display Trigger | User Action Required |
|-------------------|-----------------|-----------------|---------------------|
| All pages (footer) | Section 9 compact | Always visible | None |
| All pages (first visit) | Section 10 cookie notice | First visit, before any cookie set | Click "OK" to dismiss |
| `/disclaimer` route | Sections 1.1–1.10 full page | On navigation to route | None — read only |
| Wizard WS-00 (welcome) | Section 3 onboarding notice | Always on WS-00 | Scroll past (implicit) |
| Results page | Section 2 inline banner | Every computation result | Expand for full text (optional) |
| Results page (first anon computation) | Section 11 first-time card | First computation only | Read only |
| Results page (regime change detected) | Section 4 regime change | Prior ≠ recommended regime | Read only |
| Results page (penalties included) | Section 5 penalty disclaimer | Penalty in output | Read only |
| Results page (CWT credits included) | Section 6 CWT disclaimer | CWT > 0 in output | Read only |
| PDF export (every page footer) | Section 7 PDF footer | On PDF generation | None — printed |
| All emails | Section 8 email footer | Every outbound email | None — shown |
| Sign-up page | ToS + privacy confirmation | Required checkbox | Must check to proceed |

---

## Section 14: Disclaimer Version History

| Version | Effective Date | Changes |
|---------|---------------|---------|
| 1.0 | 2026-03-01 | Initial version — product launch |
