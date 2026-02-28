# Legal Document Formatting — Philippine Standards

## Overview

This analysis covers Philippine legal document formatting standards applicable to the inheritance premium platform: court pleading rules, BIR submission requirements, legal citation format for NCC articles, law firm letterhead conventions, monetary formatting, and the template structure for an inheritance distribution report.

---

## 1. Philippine Court Pleading Format (A.M. No. 11-9-4-SC)

The Supreme Court's **Efficient Use of Paper Rule** (A.M. No. 11-9-4-SC, effective January 1, 2013) governs all court-bound documents. These apply to judicial estate proceedings (testate/intestate probate petitions, inventories, orders of distribution).

### 1.1 Paper Size

| Requirement | Specification |
|---|---|
| Primary | 13" × 8.5" (legal) — still specified in A.M. No. 11-9-4-SC |
| **De facto 2025 standard** | **A4 (210mm × 297mm)** — clerks increasingly require A4; Supreme Court e-filing mandates A4 |
| PDF format | PDF or PDF/A — mandatory for all electronic submissions |

**Platform decision:** Generate PDFs at **A4 dimensions** (595pt × 842pt). This satisfies both e-filing and print requirements and matches international legal norms for PH practice.

### 1.2 Fonts

| Requirement | Specification |
|---|---|
| Size | 14pt (mandated by A.M. No. 11-9-4-SC) |
| Style | "Easily readable font of party's choice"; Supreme Court preference is Century Gothic |
| **Platform recommendation** | Use **14pt Times New Roman** for body text (universal legal document expectation) or **12pt** for dense tables with 14pt headings |

**Note:** The Efficient Use of Paper Rule says 14pt, but many PH law firms use 12pt Times New Roman for professional reports distributed to clients (not filed with courts). For court-filed documents, 14pt is required. Our PDF report is a professional instrument, not a court pleading — **12pt Times New Roman body + 14pt section headers** is the appropriate choice.

### 1.3 Margins

| Edge | Margin |
|---|---|
| Left | 1.5 inches (38mm) |
| Top | 1.2 inches (30mm) |
| Right | 1.0 inch (25mm) |
| Bottom | 1.0 inch (25mm) |

### 1.4 Line Spacing

- **Body text:** Single-spaced
- **Between paragraphs:** 1.5 line spacing (blank line gap equivalent)
- **Tables:** Single-spaced rows, 6pt padding per cell

### 1.5 Pagination

- Consecutive page numbering on every page
- Format: `Page X of Y` (centered in footer)

### 1.6 Electronic Filing (2025)

The Supreme Court's 2025 Transitory Rules (A.M. No. 25-09-16-SC, effective October 30, 2025):
- All Philippine Bar members must file electronically via **eCourt PH** (https://portal.judiciary.gov.ph)
- Files must be **PDF or PDF/A** only
- Non-compliant filings are deemed not filed

**Implication for platform:** PDFs generated must be text-searchable (not image-only), compliant with PDF/A if possible. `@react-pdf/renderer` produces text-based PDFs by default — compatible.

---

## 2. BIR Form 1801 — Estate Tax Return Format

### 2.1 Form Structure

BIR Form 1801 (January 2018 ENCS version) consists of:

| Part | Content |
|---|---|
| Part I | Taxpayer Information (estate TIN, executor name, address) |
| Part II | Computation of Gross Estate |
| Part III | Allowable Deductions |
| Part IV | Computation of Tax |
| Schedules | Real Properties, Family Home, Personal Properties, Taxable Transfers, Business Interest |

### 2.2 Filing Requirements

| Item | Detail |
|---|---|
| Copies | 2 copies for BIR, 1 retained by taxpayer |
| Deadline | Within **1 year** from date of death (extendable 30 days in meritorious cases) |
| Filing venue | AAB of the RDO with jurisdiction over decedent's domicile at time of death |
| Digital option | eONETT platform (pilot RDOs); eBIRForms system |
| Supporting docs | PSA Death Certificate, PSA birth/marriage certs of heirs, TCT/CCT, ITR (last 3 years), bank certs, appraisal |

### 2.3 Submission Format for Platform

Our platform's BIR 1801 integration (see `spec-bir-1801-integration`) should:
- Produce a **pre-filled Schedule summary** showing computed values from the estate tax engine
- Present output matching the form's field order (Gross Estate → Deductions → Net Estate → Tax Due)
- Currency: **₱** with comma separators, two decimal places (e.g., ₱1,234,567.89)
- Include a footer: *"This is a computation aid only. The actual BIR Form 1801 must be filed by a licensed tax professional."*

---

## 3. Philippine Legal Citation Format

### 3.1 New Civil Code (NCC) Citations

The **Philippine Manual of Legal Citations (10th Edition)** is the primary authority.

| Context | Format | Example |
|---|---|---|
| Formal (brief/pleading) | `CIVIL CODE, art. [number].` | `CIVIL CODE, art. 887.` |
| Judicial writing | `Civil Code (1889), Art. [number].` | `Civil Code (1889), Art. 887.` |
| **In-text (professional reports)** | `Article [number], New Civil Code` | `Article 887, New Civil Code` |
| **Short-form in-text** | `Art. [number], NCC` | `Art. 887, NCC` |
| **Platform standard** | `Art. [number], NCC` | `Art. 887, NCC` |

**Platform standard:** Use `Art. [number], NCC` for all citations in the UI and PDF. For expanded tooltips, use the full form: `Article [number] of the New Civil Code of the Philippines (Republic Act No. 386)`.

### 3.2 Other Common Citations in Succession Law

| Source | Citation Format | Example |
|---|---|---|
| New Civil Code | `Art. [number], NCC` | `Art. 888, NCC` |
| Family Code | `Art. [number], Family Code` | `Art. 49, Family Code` |
| Rules of Court | `Rule [number], Section [number], Rules of Court` | `Rule 74, Section 1, Rules of Court` |
| BIR Revenue Regulation | `RR No. [number]-[year]` | `RR No. 12-2018` |
| TRAIN Law | `Republic Act No. 10963, Section [number]` | `Republic Act No. 10963, Section 22` |

### 3.3 Citation Formatting in PDF Tables

In the distribution table, citations appear in the `Legal Basis` column:
- Multiple citations separated by semicolons: `Art. 887, NCC; Art. 895, NCC`
- Line-break variant for expanded view: one citation per line
- Do NOT abbreviate to just article number — always include `NCC` suffix

---

## 4. Philippine Law Firm Letterhead & Header

### 4.1 Standard Letterhead Structure

```
┌─────────────────────────────────────────────────────────────┐
│          [LAW FIRM NAME]                                    │
│          Attorneys and Counselors at Law                    │
│          [Street Address], [City], Philippines [ZIP]        │
│          Tel: +63-[number] | Email: [email]                 │
│          [Website if any]                                   │
│                                              [Date]         │
├─────────────────────────────────────────────────────────────┤
│ To:    [Recipient Name / "TO WHOM IT MAY CONCERN"]          │
│ Re:    [Matter Reference / Estate of: Decedent Name]        │
│ Doc:   Inheritance Distribution Analysis Report             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Key Letterhead Elements

| Element | Details |
|---|---|
| Firm name | All-caps or Title Case, prominently placed |
| Designation | "Attorneys and Counselors at Law" (or specialization) |
| Address | Street, City, Province, Philippines, ZIP code |
| Contact | Phone, email (website optional) |
| Roll number | IBP Roll No. of signing attorney (required on all legal documents) |
| PTR number | Professional Tax Receipt number |
| MCLE compliance | MCLE Compliance No. [number] |
| Date | Right-aligned on same line or below contact info |

### 4.3 Attorney Signature Block

```
                              Very truly yours,

                              ATTY. [FULL NAME]
                              IBP Roll No. [number]
                              PTR No. [number], [date issued], [city]
                              MCLE Compliance No. [number]
```

**Platform implication:** The `spec-firm-branding` feature must capture:
- `firm_name`, `firm_address`, `firm_phone`, `firm_email`
- `counsel_name`, `ibp_roll_no`, `ptr_no`, `mcle_compliance_no`
- `logo_url` (optional)

---

## 5. Monetary Value Formatting

### 5.1 Philippine Standard

| Format | Example |
|---|---|
| Symbol | ₱ (Philippine Peso sign, U+20B1) |
| Thousands separator | Comma: ₱1,234,567 |
| Decimal places | Two: ₱1,234,567.89 |
| Centavo-level | Always show two decimals even if whole: ₱500,000.00 |
| Large amounts in legal text | Write out full amount: ₱1,234,567.89 |
| Negative (deductions) | Use parentheses: (₱123,456.00) or prefix with minus |

### 5.2 In-Text Legal Format

In formal legal documents, large monetary values are written:
```
the sum of ONE MILLION TWO HUNDRED THIRTY-FOUR THOUSAND FIVE HUNDRED
SIXTY-SEVEN PESOS AND EIGHTY-NINE CENTAVOS (₱1,234,567.89)
```

**Platform approach:** For the PDF report, use the numeric format `₱1,234,567.89` in tables. For the narrative sections, consider adding the spelled-out form for amounts over ₱100,000 to match formal legal document style.

---

## 6. Section Numbering & Structure

### 6.1 Philippine Legal Document Sections

Standard structure for a formal legal instrument:
1. **Caption/Title** — Document type, case/matter name
2. **Preamble** — "KNOW ALL MEN BY THESE PRESENTS that..."
3. **Recitals** — Background facts (who died, when, family composition)
4. **Body** — Substantive content (computations, distribution)
5. **Attestation** — Certification by preparer
6. **Signatures** — All parties, with printed names below
7. **Notarial Acknowledgment** — Notary seal and jurat
8. **Annexes** — Supporting schedules and exhibits

### 6.2 Section Numbering

- Roman numerals for major parts (I., II., III.)
- Arabic numerals for sub-sections (1.1, 1.2) — increasingly common in modern practice
- No formal requirement, but consistency within document is mandatory

---

## 7. Inheritance Distribution Report — Template Structure

Based on the above research, the recommended structure for the platform's primary PDF output:

```
INHERITANCE DISTRIBUTION ANALYSIS REPORT

[FIRM LETTERHEAD]
Date: [generated date]

ESTATE OF: [DECEDENT NAME]
Date of Death: [DOD]
Place of Death: [Place]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Succession Type:  [Testate / Intestate]
  Scenario Code:    [e.g., T-01]
  Estate Regime:    [Absolute Community / Conjugal Partnership / Exclusive]
  Total Estate:     ₱[amount]
  Net Distributable: ₱[amount]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
II. DISTRIBUTION TABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌───────────────┬───────────┬──────────┬──────────────────────┐
  │ Heir          │ Category  │ Net Share│ Legal Basis          │
  ├───────────────┼───────────┼──────────┼──────────────────────┤
  │ Juan dela Cruz│ Legit.    │ ₱250,000 │ Art. 887, NCC;       │
  │               │ Child     │          │ Art. 888, NCC        │
  ├───────────────┼───────────┼──────────┼──────────────────────┤
  │ Maria dela Cruz│Surviving │ ₱125,000 │ Art. 887, NCC;       │
  │               │ Spouse    │          │ Art. 892, NCC        │
  └───────────────┴───────────┴──────────┴──────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
III. PER-HEIR NARRATIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Heir name] is entitled to ₱[amount] representing [fraction] of
  the net distributable estate pursuant to Article [n], New Civil
  Code. [Expanded engine narrative text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IV. COMPUTATION LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 1: [pipeline step description]
  Step 2: [pipeline step description]
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
V. WARNINGS & MANUAL REVIEW FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [List of engine-generated warnings, if any]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VI. ATTESTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  This report was generated using the Philippine Inheritance
  Computation Engine based on the New Civil Code of the Philippines
  (Republic Act No. 386) and the TRAIN Law (Republic Act No. 10963).
  This is a computation aid only and does not constitute legal advice.

  Prepared by: [Firm Name]
  Counsel:     Atty. [Name] | IBP Roll No. [n] | PTR No. [n]

  Generated: [datetime] | Page X of Y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANNEX A: ESTATE TAX COMPUTATION SUMMARY (if computed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Gross Estate:          ₱[amount]
  Total Deductions:      (₱[amount])
  Net Taxable Estate:    ₱[amount]
  Estate Tax Due (6%):   ₱[amount]
  Filing Deadline:       [1 year from DOD]
```

---

## 8. Key Platform Decisions

| Decision | Recommendation |
|---|---|
| PDF page size | A4 (595pt × 842pt) |
| Body font | 12pt Times New Roman |
| Section headers | 14pt Times New Roman Bold |
| Margins | Left 38mm, Top 30mm, Right 25mm, Bottom 25mm |
| NCC citation format | `Art. [number], NCC` (short) / `Article [number], New Civil Code` (long) |
| Monetary format | `₱1,234,567.89` in tables; spelled out in narratives if > ₱100,000 |
| Page numbers | `Page X of Y` centered in footer |
| Generation timestamp | ISO 8601 format: `2026-02-28T14:30:00+08:00` displayed as `February 28, 2026 at 2:30 PM (PHT)` |
| Document separator | Horizontal rule (━) between sections |
| Required attorney fields | `ibp_roll_no`, `ptr_no`, `mcle_compliance_no` in firm profile |

---

## Sources

- [SC Issues 2025 Transitory Rules on Electronic Filing and Service](https://www.ocamposuralvo.com/2025/11/27/sc-issues-2025-transitory-rules-on-electronic-filing-and-service/)
- [Legal Paper Size Requirements for Court Pleadings Philippines](https://www.lawyer-philippines.com/articles/legal-paper-size-requirements-for-court-pleadings-philippines)
- [Efficient Use of Paper Rule (A.M. No. 11-9-4-SC)](https://pnl-law.com/blog/efficient-use-of-paper-rule-a-m-no-11-9-4-sc/)
- [BIR Form 1801 Guidelines](https://bir-cdn.bir.gov.ph/local/pdf/1801%20GL%20%20final_rev.pdf)
- [Requirements for Filing Estate Tax Returns in the Philippines](https://www.respicio.ph/commentaries/requirements-for-filing-estate-tax-returns-in-the-philippines)
- [Philippine Legal Citation Guidelines — Globalex](https://www.nyulawglobal.org/globalex/philippines1_part2.html)
- [Legal Citation in the Philippines: Formats, Examples, and How to Cite Cases (2026 Guide)](https://www.digest.ph/blog/legal-citation-philippines)
- [How to Write a Legal Letter in the Philippines](https://www.digest.ph/blog/writing-legal-letter)
- [Extrajudicial Settlement of Estate Philippines — Complete Guide](https://jcalaw.ca/a-complete-guide-to-the-process-of-extrajudicial-settlement-of-estate-in-the-philippines/)
- [Proper Format for Court Complaint Pleadings](https://www.lawyer-philippines.com/articles/proper-format-for-court-complaint-pleadings)
