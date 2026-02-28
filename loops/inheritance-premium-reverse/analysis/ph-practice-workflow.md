# Philippine Estate Lawyer Workflow — Analysis

## Overview

Research into the complete Philippine estate settlement process from client intake through final distribution, covering both extrajudicial and judicial tracks. Maps where software replaces manual labor, identifies pain points, and pinpoints high-value platform touchpoints.

---

## 1. The Two Settlement Tracks

Philippine estate settlement follows one of two tracks, determined at intake:

| Factor | Extrajudicial (EJS) | Judicial (Probate) |
|--------|--------------------|--------------------|
| Will exists? | No will (or uncontested) | Yes (testate) or disputed |
| Heirs agree? | Yes — unanimously | Not required |
| Heirs all adults? | Yes (or minors with guardian) | Not required |
| Outstanding debts? | None (practically) | Can settle debts through court |
| Timeline | 3–12 months | 1–5 years |
| Cost | Lower | Higher (court fees, longer atty fees) |
| Court involvement | None | RTC (Regional Trial Court) |
| Governing rule | Rule 74, Rules of Court | Rules 75–91, Rules of Court |

**Decision logic for the platform:** The intake wizard should ask these questions and route to the appropriate workflow with a clear explanation.

---

## 2. Complete Settlement Timeline

### Track A: Extrajudicial Settlement (Most Common)

```
DEATH
  │
  ▼ Day 0–7
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: Initial Client Consultation                     │
│  • Identify decedent, date of death, domicile            │
│  • Determine succession type (intestate vs testate)      │
│  • List heirs and their relationships                    │
│  • Enumerate properties (real, personal, financial)      │
│  • Verify no creditors / outstanding debts               │
│  • Confirm all heirs are adults (or have guardians)      │
│  SOFTWARE: Intake form, heir tree builder, case creation │
└─────────────────────────────────────────────────────────┘
  │
  ▼ Week 1–4
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: Document Gathering                              │
│  • PSA: Death certificate (certified true copy)          │
│  • PSA: Birth certificates of heirs                      │
│  • PSA: Marriage certificate (decedent + spouse)         │
│  • LRA/RD: Certified true copies of TCT/OCT/CCT          │
│  • Assessor: Latest tax declarations of all properties   │
│  • Banks: Certified balance statements as of date of     │
│    death for all accounts                                │
│  • Corporations: Proof of valuation of shares of stock   │
│  • LTO: OR/CR for motor vehicles                         │
│  • BIR: Zonal values for real property                   │
│  • Estate TIN: File BIR Form 1904 for estate TIN         │
│  SOFTWARE: Document checklist, status tracker per doc    │
└─────────────────────────────────────────────────────────┘
  │
  ▼ Week 2–6
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: Inheritance Computation                         │
│  • Identify succession scenario (intestate/testate)      │
│  • Build heir family tree                                │
│  • Run inheritance computation (NCC legitime rules)       │
│  • Draft distribution plan (who gets what %)             │
│  • Verify legitime satisfied for forced heirs            │
│  SOFTWARE: ← THIS IS THE CURRENT WASM ENGINE ←           │
└─────────────────────────────────────────────────────────┘
  │
  ▼ Week 3–8
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: Estate Tax Computation & BIR Filing             │
│  • Compute gross estate (FMV of all properties)          │
│  • Apply deductions (std ₱5M, family home ₱10M, debts)  │
│  • Apply 6% TRAIN rate on net estate                     │
│  • Complete BIR Form 1801 + all schedules                │
│  • Prepare supporting attachments (see §5 below)         │
│  • File with AAB of applicable RDO                       │
│  • Pay estate tax (or request installment if hardship)   │
│  • Secure Estate TIN from BIR Form 1904                  │
│  • DEADLINE: 1 year from date of death                   │
│  SOFTWARE: ← ESTATE TAX WASM ENGINE + FORM 1801 OUTPUT  │
└─────────────────────────────────────────────────────────┘
  │
  ▼ After BIR payment
┌─────────────────────────────────────────────────────────┐
│ STAGE 5: Secure BIR eCAR                                 │
│  • BIR issues eCAR (electronic Certificate Authorizing   │
│    Registration) per real property / stock transfer      │
│  • One eCAR per parcel of land, per vehicle, per stock   │
│  • Without eCAR, title cannot transfer                   │
│  SOFTWARE: Document tracker — eCAR per asset             │
└─────────────────────────────────────────────────────────┘
  │
  ▼ Concurrent with stages 3–4
┌─────────────────────────────────────────────────────────┐
│ STAGE 6: Execute & Publish Deed of EJS                   │
│  • Draft Deed of Extrajudicial Settlement                │
│  • All heirs sign before notary public                   │
│  • Publish in newspaper of general circulation:          │
│    once a week × 3 consecutive weeks                     │
│  • Secure Affidavit of Publication after 3rd pub week    │
│  SOFTWARE: Document assembly (deed draft), pub tracker   │
└─────────────────────────────────────────────────────────┘
  │
  ▼ After eCAR + Affidavit of Publication
┌─────────────────────────────────────────────────────────┐
│ STAGE 7: Local Transfer Taxes                            │
│  • Pay transfer tax to local government unit (LGU)       │
│  • Rate varies per city/municipality (usually 0.5–0.75%) │
│  • Required before Register of Deeds will process title  │
│  SOFTWARE: Checklist item with LGU-specific guidance     │
└─────────────────────────────────────────────────────────┘
  │
  ▼ After LGU transfer tax
┌─────────────────────────────────────────────────────────┐
│ STAGE 8: Register with Register of Deeds                 │
│  • File: Deed of EJS + Affidavit of Publication          │
│  • File: Proof of estate tax payment / eCAR              │
│  • File: Transfer tax receipt from LGU                   │
│  • RD annotates existing titles, issues new TCT in       │
│    heirs' names per agreed distribution                  │
│  SOFTWARE: Document tracker, title transfer status       │
└─────────────────────────────────────────────────────────┘
  │
  ▼
DISTRIBUTION COMPLETE
```

### Track B: Judicial Settlement (Probate — Testate)

```
DEATH → Petition Filing → Publication (3 weeks) → Court Hearing
→ Appointment of Executor → Inventory & Appraisal (3 months)
→ Notice to Creditors → Payment of Debts & Taxes
→ Project of Partition → Court Approval
→ Final Accounting & Discharge → Register of Deeds
→ DISTRIBUTION COMPLETE

Timeline: 1–5 years
Key law: Rules 75–91, Rules of Court
Jurisdiction: RTC where decedent was domiciled
```

**Key difference from EJS:** The platform primarily supports EJS; judicial track requires attorney management of court filings (briefs, petitions, hearings) which is out of scope for v1.

---

## 3. Documents Required by Stage

### Stage 2: Document Gathering — Complete Checklist

**Identity & Civil Status Documents**
- [ ] PSA-certified Death Certificate
- [ ] PSA-certified Birth Certificate of each heir
- [ ] PSA-certified Marriage Certificate (if decedent was married)
- [ ] PSA-certified Birth Certificate of decedent
- [ ] Valid government IDs of all heirs

**Real Property Documents (per parcel)**
- [ ] Certified True Copy of TCT/OCT/CCT (from RD)
- [ ] Latest Tax Declaration (from Assessor's Office)
- [ ] BIR Zonal Valuation printout for the location

**Personal Property Documents**
- [ ] Bank certification of account balances as of date of death (per bank)
- [ ] Stock certificates + latest audited financial statements (for unlisted)
- [ ] Newspaper clipping / PSE certification (for listed stocks at date of death)
- [ ] OR/CR of motor vehicles + fair market value from LTO/Sanvic

**Business Interest Documents**
- [ ] CPA-certified financial statements (if gross estate > ₱2M)
- [ ] Articles of incorporation (if company ownership)

**BIR-Specific**
- [ ] BIR Form 1904 (Estate TIN application — filed early)
- [ ] Notice of Death (BIR Form 1949 — if gross estate > ₱5M or real property)

**Deed Execution**
- [ ] Notarized Deed of Extrajudicial Settlement
- [ ] Special Power of Attorney (if any heir is abroad)
- [ ] Court-approved guardianship order (if minor heirs)

**Post-Filing**
- [ ] Affidavit of Publication (from newspaper after 3-week run)
- [ ] Official Receipt from BIR (proof of estate tax payment)
- [ ] eCAR per real property (from BIR)
- [ ] Transfer Tax Official Receipt (from LGU)

---

## 4. BIR Form 1801 — Filing Details

### Form Sections & Schedules

| Section | Content |
|---------|---------|
| Part I | Decedent information: name, TIN, date of death, domicile, citizenship |
| Part II | Property regime (conjugal / paraphernal / community) |
| Part III | Gross estate: real property, personal property, transfers in contemplation of death |
| Schedule 1 | Real properties: OCT/TCT/CCT nos., TD nos., FMV, zonal value |
| Schedule 2 | Claims against the gross estate (deductions) |
| Schedule 3 | Unpaid mortgage / lien |
| Schedule 4 | Business interests (net equity) |
| Part IV | Allowable deductions: standard (₱5M), family home (₱10M), medical expenses (₱500K max), amounts received by heirs under RA 4917 |
| Part V | Net estate computation and tax due |
| Part VI | Tax credits (if any) |
| Tax Agent Section | CPA/atty credentials if filed through agent |

### Key Filing Facts

| Item | Detail |
|------|--------|
| Rate | 6% flat (TRAIN Law, RA 10963) — for deaths on/after Jan 1, 2018 |
| Pre-TRAIN | Schedular rates 5–20% (for deaths before Jan 1, 2018) |
| Deadline | 1 year from date of death |
| Extension | Up to 30 days for filing; up to 2 years (non-judicial) or 5 years (judicial) for payment |
| Standard deduction | ₱5,000,000 (residents) |
| Family home deduction | Up to ₱10,000,000 (actual family home) |
| Late filing surcharge | 25% of tax due |
| Late payment interest | 12% per annum (computed monthly) |
| Where to file | AAB of RDO in decedent's last domicile |
| Number of copies | 2 copies (1 BIR, 1 taxpayer) |
| E-filing option | eBIRForms (offline) or eONETT portal (pilot since 2024) |
| eCAR | Issued per real property after payment; required for title transfer |

---

## 5. Software Touchpoints — Where the Platform Adds Value

| Stage | Current Manual Process | Platform Replacement |
|-------|----------------------|---------------------|
| **Client Intake** | Atty uses paper/Word form, manually transcribes | Digital intake form → auto-populates case wizard |
| **Heir Tree** | Drawn on paper or described verbally | Visual heir tree builder, saved to case |
| **Inheritance Computation** | Manual NCC lookup + Excel fraction math | WASM engine: instant, legally cited output |
| **Estate Tax Computation** | Excel spreadsheet with manual BIR rate lookup | WASM estate tax engine + Form 1801 draft |
| **Document Checklist** | Atty maintains Word/Excel checklist manually | Smart checklist auto-generated from case inputs |
| **Distribution Report** | Word-processed manually, re-typed each case | PDF export with statute citations, auto-generated |
| **Scenario Planning** | "What if there's no will?" requires full recomputation | Instant testate vs. intestate comparison |
| **Client Handoff** | Printed sheets or email attachments | Shareable read-only case link or QR code |
| **Firm Knowledge** | Atty recalls past similar cases from memory | Case history searchable by scenario/client |
| **Publication Tracking** | Calendar reminder in email | Case timeline with publication deadline tracker |
| **Multi-atty Coordination** | Email/WhatsApp handoffs | Firm account: shared cases, notes, status |

---

## 6. Pain Points Today (Unsolved by Current Market)

| Pain Point | Severity | Platform Solution |
|-----------|----------|-----------------|
| **Manual NCC computation** — attys compute legitime fractions by hand, error-prone | Critical | WASM engine already built |
| **Excel for estate tax** — no PH-specific tool encodes all 3 regimes correctly | Critical | Estate tax engine already built |
| **No statute citations** — atty must look up NCC articles manually to justify distribution | High | `legal_basis[]` field + UI display |
| **Document reassembly** — every case starts distribution report from scratch | High | PDF export with firm header template |
| **No case history** — if atty changes firm, case data lost | High | Persistent case storage (Supabase) |
| **OFW heirs** — overseas heirs need SPA + consularized docs; atty can't easily share case | High | Shareable read-only link for remote heirs |
| **Compliance deadline anxiety** — 1-year BIR deadline with multiple sub-deadlines | High | Case timeline with deadline calculator |
| **Testate vs. intestate tradeoff** — estate planning clients need to understand impact of will | Medium | Scenario comparison feature |
| **Minors in succession** — requires guardianship layer, changes computation | Medium | Flag in heir tree + computation note |
| **Publication requirement** — attys track newspaper publication manually | Medium | 3-week publication calendar in case notes |
| **Preterition risk** — if heir omitted from will, affects computation | Medium | Engine already handles preterition; UI warning |
| **Property regime ambiguity** — community vs. conjugal vs. paraphernal changes gross estate | Medium | Property regime input in estate tax form |

---

## 7. Discovered Feature: Deadline Calculator

**Surfaced by:** This research (BIR 1-year filing deadline, publication 3-week track)

**Threshold:** Philippine estate lawyers would absolutely pay for automated deadline tracking.

**Feature:** A per-case **deadline timeline** that shows:
- BIR filing deadline = date of death + 365 days
- Publication start deadline (recommended within 30 days of deed execution)
- Publication completion date = publication start + 21 days
- RD filing window = after eCAR + after publication affidavit
- Color-coded: green (future), yellow (<30 days), red (overdue)

Add as `spec-deadline-tracker` in Wave 2.

---

## 8. Market Context

### Philippines-Specific Factors

| Factor | Impact |
|--------|--------|
| **OFW families** | Millions of Filipinos work abroad; heirs and executors may be overseas → need for digital collaboration tools |
| **Titles still paper-based** | Most LGU RDs still accept paper filings; eCAR is relatively new (2024) |
| **Estate tax amnesty history** | Multiple amnesties (most recent ended June 14, 2025) show widespread non-compliance → platform's estate tax engine is especially valuable for backdated cases |
| **PSA delays** | Birth/death/marriage certificates from PSA can take weeks → document status tracking matters |
| **Language** | Legal docs in Filipino/English; platform should support both in UI (future) |
| **RDO jurisdiction** | Filing must be at specific RDO based on decedent's last domicile → platform should capture domicile and surface correct RDO |

### Who Are the Actual Users?

| User Type | Volume | Sophistication | Biggest Need |
|-----------|--------|---------------|--------------|
| Solo estate attorney | High | Medium | Computation speed, document assembly |
| Boutique estate law firm (2–5 attys) | Medium | Medium-High | Case management, client handoff, team sharing |
| CPA / tax professional | Medium | High (tax) | Estate tax computation, Form 1801 support |
| Paralegal at law firm | Medium | Low-Medium | Document checklist, status tracking |
| Self-represented heirs | Low | Low | Educational content, online calculator |

**Primary target for v1:** Solo estate attorney and boutique estate law firm.

---

## 9. References

- [PWC PH: Brief Overview of EJS](https://www.pwc.com/ph/en/tax/tax-publications/taxwise-or-otherwise/2026/a-brief-overview-of-extrajudicial-settlement-in-the-philippines.html)
- [NDV Law: EJS Philippines](https://ndvlaw.com/extrajudicial-settlement-of-estate-in-the-philippines/)
- [Respicio & Co: EJS Process, Fees, Timeline](https://www.respicio.ph/commentaries/extrajudicial-settlement-of-estate-in-the-philippines-process-fees-and-timeline)
- [Respicio & Co: Judicial Settlement](https://www.respicio.ph/commentaries/filing-a-judicial-settlement-of-estate-in-the-philippines)
- [Lawyers PH: Heir Transfer Guide](https://lawyerphilippines.org/how-to-transfer-land-heirs-philippines-extrajudicial-settlement-philippine-land-inheritance/)
- [BIR Official: Estate Tax](https://www.bir.gov.ph/estate-tax)
- [KPMG PH: BIR Form 1801 Guidelines](https://assets.kpmg.com/content/dam/kpmg/ph/pdf/InTAX/2019/Guidelines%20and%20Instructions%20for%20BIR%20Form%20No.%201801.pdf)
- [Respicio & Co: Estate Tax Filing Requirements](https://www.lawyer-philippines.com/articles/estate-tax-filing-requirements-in-the-philippines)
- [Lawyers PH: EJS with Waiver of Rights](https://lawyerphilippines.org/extrajudicial-settlement-with-waiver-of-rights-tax-implications/)
- [JCA Law: Complete EJS Guide](https://jcalaw.ca/a-complete-guide-to-the-process-of-extrajudicial-settlement-of-estate-in-the-philippines/)
