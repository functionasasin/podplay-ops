# TAM: Tax Business Compliance Cluster (B1–B7)

**Loop source:** compliance-moats
**Tools covered:** B1 (Form Navigator), B2 (BIR Penalty Calculator), B3 (Compliance Calendar), B4 (Withholding Agent), B5 (Quarterly IT), B6 (2307 Tracker), B7 (eBIRForms Bridge)

---

## Overview

This cluster covers the BIR compliance infrastructure tools used by businesses, employers, and their accountants on a recurring monthly/quarterly/annual basis. Unlike the property transfer and self-employed tools (which are transaction-triggered), these tools address the **ongoing compliance burden** of operating any registered business: knowing which forms to file, when to file them, how to compute penalties, how to manage withholding tax obligations, and how to reconcile quarterly vs. annual income tax.

**The shared addressable base for this cluster** is all BIR-registered businesses and their professional advisors — approximately 1.1–2.5M active business taxpayers depending on the specific tool.

---

## Shared Population Foundation

### Business Taxpayer Base

| Category | Count | Source | Year | Confidence |
|---------|-------|--------|------|------------|
| PSA registered establishments (all sizes, formal sector) | 1,109,684 | PSA List of Establishments 2022 | 2022 | OFFICIAL |
| DTI MSME count (all registered, incl. sari-sari etc.) | 1,241,476 | DTI MSME Statistics in Brief 2023 | 2023 | OFFICIAL |
| SEC active registered companies (end-2024) | 527,710 | SEC press release / BusinessMirror | End-2024 | OFFICIAL |
| SEC active registered companies (end-2023 derived) | ~478,000–480,000 | DERIVED: 527,710 − 52,304 new 2024 registrations | End-2023 | DERIVED |
| DTI BNRS annual registrations (new + renewals) | ~932,000 | DTI BNRS 2022 | 2022 | OFFICIAL |
| Individual self-employed and professional filers (1701/1701A/1701Q) | 2,186,544 | BIR CY2023 Annual Report, Table 3 | 2023 | OFFICIAL |
| VAT-registered taxpayers (all types — estimated) | ~1,700,000 | ESTIMATED: BIR data-registry estimate; consistent with PSA establishment count × ~40% VAT-threshold rate + SEC corporations + individual VAT registrants | 2023 | ESTIMATED |
| Non-VAT registered businesses (percentage tax, 3%) | ~700,000–800,000 | ESTIMATED: Total PSA registered businesses minus VAT-registered | 2023 | ESTIMATED |
| Electronic filers as % of total BIR filers | 69% | BIR via DOF press release (November 2023) | 2023 | OFFICIAL |

### Professional Advisor Base

| Category | Count | Source | Year | Confidence |
|---------|-------|--------|------|------------|
| Total registered CPAs | ~200,000 | BOA Chairman statement, Manila Times May 2023 | 2023 | ESTIMATED |
| CPAs in public practice (tax/audit) — ~30% of total | ~50,000–60,000 | BOA/PICPA sector profile (IFAC Philippines) | 2023 | ESTIMATED |
| CPAs actively doing business compliance + bookkeeping | ~30,000–40,000 (60–70% of public practice) | ESTIMATED: Based on CPA practice distribution; no published breakdown | 2023 | ESTIMATED |
| Workers in PSIC 6920 (Accounting, Bookkeeping, Auditing; Tax Consultancy) | 23,678 | PSA 2022 ASPBI — Professional, Scientific and Technical Activities Section | 2022 | OFFICIAL |
| Accounting/bookkeeping/tax consultancy firms (estimated, formal sector) | ~3,000–5,000 | DERIVED: 23,678 workers ÷ assumed avg. ~5–8 employees/firm for small and mid-size practices; excludes solo practitioners | 2022 | DERIVED |

---

## B1: BIR Form Selection Navigator

**Score:** 4.05
**Tool concept:** Decision-tree tool that tells a taxpayer exactly which BIR form(s) to file based on their taxpayer type, income sources, registration status, and the EOPT Act 2024 changes. Eliminates the "wrong form" penalty exposure.

### Consumer Segment

**Who:** All BIR-registered taxpayers who must file periodic returns — businesses and individuals with active BIR registration who need to know which form applies to them, especially after the EOPT Act 2024 changed which forms are mandatory vs. optional.

**Population:**
- **1,109,684** PSA-registered formal business establishments — Source: PSA List of Establishments 2022 — Confidence: OFFICIAL
- **2,186,544** individual self-employed/professional filers — Source: BIR CY2023 Annual Report, Table 3 — Confidence: OFFICIAL
- **~478,000** SEC-registered active corporations — Source: DERIVED from SEC end-2024 total minus 2024 new registrations — Confidence: DERIVED
- Total addressable registered business taxpayers (non-ONET): **~2.5M–3.0M** unique filing entities that could use a form navigator — Confidence: DERIVED (sum of distinct categories with deduplication caveat)

  *Note:* The scored domains cites "5.7M registered taxpayers" for this tool's market. This likely refers to total non-ONET individual + non-individual registered taxpayers under BIR (not the broader 47.4M cumulative total which includes inactive/dormant). For TAM purposes, we use the verifiable sub-counts (~2.5M–3.0M active filing businesses/self-employed) rather than the unverified 5.7M aggregate.

**Addressable fraction:** 65% — Urban/formal sector registrants with digital access. PSA data: internet penetration 73.1% nationally (DataReportal 2023); formal business sector skews higher toward 80–85%; but many small sole proprietors have limited digital engagement. Use 65% blended.

**Addressable consumer population:** 2,750,000 × 65% = **1,787,500 ≈ 1.79M**

**Current professional cost:** CPA retainer includes form selection by default; standalone "which form should I use?" consultation ranges ₱500–₱2,000/inquiry (Source: Filipino CPA community forums, loft.ph 2024). Many taxpayers get this wrong and pay ₱1,000–₱5,000+ in "wrong venue/wrong form" penalties.

**Our consumer price:** ₱199/month

**Consumer TAM (B1):** 1,787,500 × ₱199 × 12 = **₱4,268M/year ≈ ₱4.27B/year**
*(This is the theoretical ceiling — actual penetration would be a fraction)*

### Professional Segment

**Who:** CPAs and bookkeepers who maintain filing calendars for multiple business clients; a form navigator saves them significant research time per client onboarding or profile change.

**Population:**
- **30,000–40,000** CPAs actively doing business compliance — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM (B1):** 35,000 × ₱999 × 12 = **₱419M/year**

### Total TAM — B1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer | 1,787,500 addressable | ₱199/mo | ₱4,268M |
| Professional | 35,000 CPAs/bookkeepers | ₱999/mo/seat | ₱419M |
| **Total TAM** | | | **₱4,687M ≈ ₱4.69B** |

**SAM:** ₱1,407M — 30% of TAM: urban, digital, actively filing businesses aware of BIR form complexity
**SOM Year 1 (1%):** ₱14.1M
**SOM Year 3 (5%):** ₱70.4M

---

## B2: BIR Penalty and Interest Calculator

**Score:** 4.30
**Tool concept:** Calculator that computes exact BIR penalties and interest under NIRC Sections 248/249 (as amended by EOPT 2024 two-tier rates) and the compromise penalty schedule under RMO 7-2015. Used by taxpayers who missed a deadline and want to know how much they owe before the BIR notice arrives — and by CPAs advising clients on remediation.

### Consumer Segment

**Who:** Any BIR-registered taxpayer who has filed late, underpaid, or failed to file a return — the penalty calculator is used post-violation to determine the exposure. Also used proactively (what-if analysis before an amnesty program or voluntary disclosure).

**Population:**
- **~570,000** significant penalty computation events per year — Source: ESTIMATED based on scored domains reference and proxy reasoning: if ~5% of 2.5M active filers are significantly late or subject to BIR assessment per year, that yields ~125K; but with broader counting of smaller violations, late payors, and compromise-seeking taxpayers, 500K–600K is a plausible annual total. No official BIR count of penalty assessments issued per year is publicly available. — Confidence: ESTIMATED

  *Proxy corroboration:* BIR issued 186 closure orders under Oplan Kandado in Jan–Nov 2023 (BIR/DOF, November 2023) — this is the visible enforcement action subset; broader penalty computation events (self-computed by late filers) are orders of magnitude larger. BIR's aggressive assessment stance for its ₱2.6T 2023 target means heavy LoA issuance, implying millions of penalty-relevant interactions.

- Broader addressable: **All 2.5M–3.0M active filers** are potential penalty calculator users even without a violation — as a risk-awareness tool (what would I owe if I filed late today?).

**Addressable fraction:** 60% of the ~570K significant-event population + 20% of the broader 2.5M proactive user base = approximately 340K + 500K = ~840K addressable events/users annually — but for subscription pricing, the relevant metric is unique recurring users: approximately **500,000–600,000** annual subscribers who face active penalty exposure.

**Addressable consumer population (subscription basis):** **500,000** as a working estimate

**Current professional cost:** CPA penalty computation engagement: ₱2,000–₱10,000 per case (Source: PH CPA community, PICPA member forums). The tool replaces this at 1/50th the cost.

**Our consumer price:** ₱199/month

**Consumer TAM (B2):** 500,000 × ₱199 × 12 = **₱1,194M/year ≈ ₱1.19B/year**

*Note: The penalty calculator may be better monetized as a per-use tool (₱99–₱299 per computation) rather than a subscription, in which case TAM = 570,000 events × ₱199 = ₱113M/year per-use basis. We use the subscription model here for comparability.*

### Professional Segment

**Who:** CPAs, tax lawyers, and bookkeepers who regularly compute BIR penalties for clients with late filings, deficiency assessments, or BIR audit exposure. Essential for any CPA managing more than 10 business clients.

**Population:**
- **30,000–40,000** CPAs actively handling business tax compliance — Confidence: ESTIMATED
- **~91,000** lawyers (roll of attorneys, end-2024) of which ~10% handle tax matters = **~9,000 tax lawyers** — Source: DERIVED from Supreme Court Roll of Attorneys + 2023/2024 bar passers — Confidence: DERIVED

**B2B price per seat:** ₱999/month

**Professional TAM (B2):** (35,000 CPAs + 9,000 tax lawyers) × ₱999 × 12 = **₱528M/year**

### Total TAM — B2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer | 500,000 addressable | ₱199/mo | ₱1,194M |
| Professional | 44,000 CPAs + tax lawyers | ₱999/mo/seat | ₱528M |
| **Total TAM** | | | **₱1,722M ≈ ₱1.72B** |

**SAM:** ₱517M — ~30% of TAM
**SOM Year 1 (1%):** ₱5.2M
**SOM Year 3 (5%):** ₱25.9M

---

## B3: Multi-Form Compliance Calendar Engine

**Score:** 4.30
**Tool concept:** Personalized BIR compliance calendar generated from a taxpayer's profile (taxpayer type, registration category, fiscal year, eFPS/eBIRForms status, VAT/non-VAT, withholding agent category) showing all filing deadlines with form numbers, due dates, and statutory authority — updated automatically for RMC/RR changes. BIR discontinued its printed tax calendar after 2025, making this gap acute.

### Consumer Segment

**Who:** All BIR-registered businesses that must track multiple filing obligations simultaneously. Particularly acute for VAT-registered businesses (monthly/quarterly VAT + monthly/quarterly withholding + quarterly IT + annual IT + alphalist + AFS), and for sole proprietors who have fewer forms but more confusion about which deadlines apply.

**Population:**
- **~1,700,000** VAT-registered taxpayers (estimated) — Source: ESTIMATED (BIR data not publicly indexed; derived from PSA establishment count and VAT threshold analysis) — Confidence: ESTIMATED
- **~700,000–800,000** non-VAT registered businesses (percentage tax filers) — Source: ESTIMATED — Confidence: ESTIMATED
- **2,186,544** individual self-employed/professional filers — Source: BIR CY2023 Annual Report, Table 3 — Confidence: OFFICIAL
- Combined (with deduplication for self-employed who are also business owners): **~3.5M–4.0M** unique filer-entities needing compliance calendars — Confidence: DERIVED

**Addressable fraction:** 65% — same rationale as B1 (internet penetration + digital engagement of business taxpayers)

**Addressable consumer population:** 3,750,000 × 65% = **2,437,500 ≈ 2.44M**

**Current professional cost:** CPA monthly retainer includes compliance calendar management. Retainer: ₱3,000–₱15,000/month for a business client (Source: loft.ph 2025, Filipino accounting community). Calendar function is bundled — users don't know its standalone value until BIR discontinues its printed calendar, which happened after 2025.

**Our consumer price:** ₱199/month

**Consumer TAM (B3):** 2,437,500 × ₱199 × 12 = **₱5,822M/year ≈ ₱5.82B/year**

### Professional Segment

**Who:** CPAs and bookkeepers who manage compliance calendars for multiple business clients. At 20–50 clients per practice, a missed filing deadline creates penalty liability for the CPA. A dynamic calendar tool eliminates this risk.

**Population:**
- **30,000–40,000** CPAs in business compliance — Confidence: ESTIMATED
- **~3,000–5,000** accounting/bookkeeping firms (PSIC 6920 formal sector) — Source: DERIVED from PSA ASPBI 2022 (23,678 workers ÷ ~5–8 per firm) — Confidence: DERIVED
- Total professional seats (individual CPAs + bookkeepers in firms): **~35,000** — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM (B3):** 35,000 × ₱999 × 12 = **₱419M/year**

*Note: An enterprise tier for larger accounting firms (≥20 clients) at ₱2,999/month per firm is feasible. At 3,000 firms × ₱2,999/mo × 12 = ₱108M/year; blended with individual seat pricing, professional TAM is ₱300M–₱500M.*

### Total TAM — B3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer | 2,437,500 addressable | ₱199/mo | ₱5,822M |
| Professional | 35,000 CPAs/bookkeepers | ₱999/mo/seat | ₱419M |
| **Total TAM** | | | **₱6,241M ≈ ₱6.24B** |

**SAM:** ₱1,872M — 30% of TAM
**SOM Year 1 (1%):** ₱18.7M
**SOM Year 3 (5%):** ₱93.6M

---

## B4: Withholding Tax Agent Compliance Engine

**Score:** 4.20
**Tool concept:** Comprehensive withholding tax engine that: (1) classifies each income payment into the correct EWT category (40+ rate categories under RR 2-98), (2) computes monthly withholding tax due, (3) generates BIR alphalist (1604-E, 1604-C), and (4) tracks 2307/2316 issuances. The highest-friction recurring compliance obligation in the BIR ecosystem.

### Consumer Segment

**Who:** All BIR-registered employers and withholding agents — i.e., every business that pays employees (withholding on compensation, BIR Form 1601-C) and/or pays professionals, rental, or other services requiring expanded withholding tax (BIR Forms 1601-EQ, 1604-E). This covers essentially all formal-sector businesses.

**Population:**
- **1,109,684** formal-sector business establishments with employees — Source: PSA List of Establishments 2022 — Confidence: OFFICIAL
  - These are all withholding agents for BIR Form 1601-C (compensation withholding)
  - Every employer with ≥1 paid employee is a mandatory withholding agent
- **Top Withholding Agents (TWA)** with ≥₱12M gross sales/purchases (EWT on supplier payments): ESTIMATED **50,000–150,000** businesses — Source: ESTIMATED (based on historical progression: 5K → 10K → 20K corporations under old rules; current threshold-based system covers more; upper bound from PSA data on businesses above ₱12M revenue) — Confidence: ESTIMATED
- **Broader EWT agents** (any business paying professional fees, rent, or specific services): Approaches full 1.1M base, but obligation varies by payment type
- Primary addressable consumer: **1,109,684** formal establishments (all are compensation withholding agents) — Confidence: OFFICIAL

**Addressable fraction:** 55% — Withholding compliance is often delegated to CPA/bookkeeper; the tool serves owner-operators who manage their own payroll + those whose bookkeeper would subscribe on behalf of the business. Some very small businesses (< 3 employees) have minimal withholding complexity. Use 55%.

**Addressable consumer population:** 1,109,684 × 55% = **610,326 ≈ 610,000**

**Current professional cost:** Bookkeeping + withholding compliance: ₱3,000–₱15,000/month retainer for a business (alphalist + 1601-C + 1601-EQ). Alphalist-only engagement: ₱5,000–₱20,000 per filing (Source: loft.ph 2025, community-cited bookkeeping rates).

**Our consumer price:** ₱199/month

**Consumer TAM (B4):** 610,000 × ₱199 × 12 = **₱1,456M/year ≈ ₱1.46B/year**

### Professional Segment

**Who:** Bookkeepers and CPAs who manage withholding tax compliance for employer-clients. This is a core recurring task — monthly 1601-C, quarterly 1601-EQ/1601-FQ, annual alphalist (1604-C, 1604-E). A practice serving 20 business clients processes 1,440+ monthly withholding tax transactions per year.

**Population:**
- **30,000–40,000** CPAs doing business compliance bookkeeping — Confidence: ESTIMATED
- **~50,000** additional non-CPA bookkeepers and payroll officers in SME firms who handle withholding — Source: ESTIMATED (PSA ASPBI 2022: 23,678 workers in PSIC 6920 formal sector; additional informal/freelance bookkeepers bring total to ~50K–70K) — Confidence: ESTIMATED
- Total professional market for B4 (B2B): **35,000–50,000** — using **40,000**

**Clients per professional per year:** 15–50 employer-clients per bookkeeper/CPA (smaller than individual tax practices because employer-client engagements are more labor-intensive)

**B2B price per seat:** ₱999/month (Solo Pro) or ₱2,999/month for practice (Practice tier, up to unlimited clients)

**Professional TAM (B4):** 40,000 × ₱999 × 12 = **₱479M/year**

### Total TAM — B4

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer | 610,000 addressable employers | ₱199/mo | ₱1,456M |
| Professional | 40,000 bookkeepers/CPAs | ₱999/mo/seat | ₱479M |
| **Total TAM** | | | **₱1,935M ≈ ₱1.94B** |

**SAM:** ₱581M — 30% of TAM
**SOM Year 1 (1%):** ₱5.8M
**SOM Year 3 (5%):** ₱29.1M

---

## B5: Quarterly Income Tax + Annual Reconciliation Engine

**Score:** 4.30
**Tool concept:** Tool that computes the correct quarterly income tax installment (1701Q for individuals, 1702Q for corporations) using the cumulative subtraction method, then reconciles against annual ITR (1701/1701A for individuals, 1702 for corporations) to determine the "still due" or "overpayment" position. Mismatch between quarterly payments and annual ITR is the #1 source of BIR assessment letters.

### Consumer Segment

**Who (Individual):** Self-employed and professional taxpayers who file 1701Q — all 1701/1701A annual filers with quarterly gross receipts above zero and outside the 8% final tax regime. Also mixed-income earners.

**Who (Corporate):** All corporations with taxable income filing 1702Q.

**Population (Individual):**
- **2,186,544** individual 1701/1701A/1701Q filers — Source: BIR CY2023 Annual Report, Table 3 — Confidence: OFFICIAL
  - Subset who actually file 1701Q (quarterly): ~70–80% of annual filers = **~1,530,000–1,749,000** quarterly filers — Confidence: DERIVED
  - (The 8% final tax electors are not required to file quarterly; approximately 20–30% elect the 8% rate)

**Population (Corporate):**
- **~478,000** SEC-registered active corporations (end-2023) — Source: DERIVED from SEC data — Confidence: DERIVED
  - Not all are actively profitable; OECD/IMF estimates ~60–70% of registered corporations in PH are filing active returns = **~287,000–335,000** active corporate quarterly filers — Confidence: ESTIMATED
  - Use **300,000** as working estimate — Confidence: ESTIMATED

**Combined quarterly IT population:**
- Individual: ~1,600,000
- Corporate: ~300,000
- **Total: ~1,900,000 quarterly IT filers** — Confidence: DERIVED

**Addressable fraction (individual):** 70% — individual self-employed skew urban/digital (higher than national average)
**Addressable fraction (corporate):** 60% — corporations have more variable digital adoption; many use CPAs who would be the B2B segment

**Addressable consumer population:**
- Individual: 1,600,000 × 70% = 1,120,000
- Corporate (direct self-filing, not via CPA): 300,000 × 20% = 60,000 (most corporates use CPAs)
- **Total addressable direct consumer: ~1,180,000**

**Current professional cost:** Quarterly IT filing by CPA: ₱2,000–₱10,000 per filing for individual (4 per year = ₱8,000–₱40,000/year); ₱5,000–₱30,000 per quarterly for corporate.

**Our consumer price:** ₱199/month

**Consumer TAM (B5):** 1,180,000 × ₱199 × 12 = **₱2,818M/year ≈ ₱2.82B/year**

### Professional Segment

**Who:** CPAs managing the quarterly → annual reconciliation cycle for individual and corporate clients. At 50 business/self-employed clients per CPA, quarterly reconciliation work is a constant background obligation.

**Population:**
- **35,000** CPAs in business + individual tax compliance — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM (B5):** 35,000 × ₱999 × 12 = **₱419M/year**

### Total TAM — B5

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (individual filers) | 1,120,000 addressable | ₱199/mo | ₱2,674M |
| Consumer (corporate direct) | 60,000 addressable | ₱199/mo | ₱143M |
| Professional | 35,000 CPAs | ₱999/mo/seat | ₱419M |
| **Total TAM** | | | **₱3,236M ≈ ₱3.24B** |

**SAM:** ₱971M — 30% of TAM
**SOM Year 1 (1%):** ₱9.7M
**SOM Year 3 (5%):** ₱48.6M

---

## B6: BIR Certificate (2307/2316) Tracker and Generator

**Score:** 4.00
**Tool concept:** System for tracking incoming BIR Form 2307 (Certificate of Creditable Tax Withheld at Source) certificates from withholding agents, reconciling them against tax credits claimed on the ITR, and generating BIR Form 2316 (Certificate of Compensation) for employer-employees. Missing or unmatched 2307s trigger BIR assessment letters for disallowed tax credits.

### Consumer Segment — Receiving Side (2307)

**Who:** Any business or individual that receives income from which EWT was deducted — professionals (doctors, lawyers, engineers, CPAs, IT consultants), businesses selling services or goods to EWT agents, lessors receiving rental income.

**Population:**
- **~2,186,544** individual self-employed/professionals receiving 2307s — Source: BIR CY2023 Annual Report, Table 3 — Confidence: OFFICIAL
  - These individuals likely receive 2307s from clients/payors who are withholding agents
- **~1,700,000** VAT-registered businesses (service sellers) receiving 2307s — Source: ESTIMATED — Confidence: ESTIMATED
- Combined (with deduplication): **~3.0–3.5M** potential 2307-receiving entities — Confidence: DERIVED

### Consumer Segment — Issuing Side (2307/2316)

**Who:** Employer-withholding agents generating BIR Form 2316 for employees and 2307 for payees.

**Population:**
- **1,109,684** PSA-registered employers (all generate BIR 2316 for employees) — Source: PSA List of Establishments 2022 — Confidence: OFFICIAL
- Subset that are also EWT agents generating 2307s: ~500,000–700,000 (ESTIMATED)

**Primary addressable consumer (2307 receiving/tracking, the higher pain-point):**
- **2,500,000** addressable receiving-side entities × 60% internet/digital fraction = **1,500,000 addressable**

**Current professional cost:** CPA chases 2307s from multiple clients at ₱1,000–₱5,000 per engagement reconciliation; no standalone price but bundled in annual compliance work.

**Our consumer price:** ₱199/month

**Consumer TAM (B6):** 1,500,000 × ₱199 × 12 = **₱3,582M/year ≈ ₱3.58B/year**

### Professional Segment

**Who:** CPAs who must reconcile 2307s across all clients before filing annual ITR. A CPA with 50 individual clients may chase 500+ 2307 certificates per filing season.

**Population:**
- **35,000** CPAs in business + individual tax compliance — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM (B6):** 35,000 × ₱999 × 12 = **₱419M/year**

### Total TAM — B6

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (2307 receivers) | 1,500,000 addressable | ₱199/mo | ₱3,582M |
| Professional | 35,000 CPAs | ₱999/mo/seat | ₱419M |
| **Total TAM** | | | **₱4,001M ≈ ₱4.00B** |

**SAM:** ₱1,200M — 30% of TAM
**SOM Year 1 (1%):** ₱12.0M
**SOM Year 3 (5%):** ₱60.0M

---

## B7: eBIRForms / eFPS Filing Automation Bridge

**Score:** 4.05
**Tool concept:** Filing automation bridge that imports data from accounting software (QuickBooks, Xero, MPM, SAP) and auto-populates eBIRForms / eFPS returns — eliminating the manual re-entry of data into the legacy Java eBIRForms offline package. Particular gap: CGT, DST, estate, and donor's tax forms not covered by Taxumo/JuanTax.

### Consumer Segment

**Who:** All BIR-registered taxpayers required to file electronically (eBIRForms or eFPS) — the mandatory e-filing requirement covers all non-eFPS taxpayers who must use eBIRForms for "no payment" returns and other filings.

**Population:**
- **Total registered taxpayers (all categories): ~47,400,000** — Source: BIR 2022 Annual Report (indirect citation) — Confidence: OFFICIAL
  - Of these, the vast majority are inactive or one-time filers; the actively filing base is approximately:
  - Individual active filers: ~5–6M (includes compensation earners who file annual ITR + self-employed + mixed income)
  - Non-individual active filers: ~500K–600K corporations/partnerships
  - Total active filers: **~5.5M–6.5M** — Confidence: ESTIMATED
- **69% of total filers** already use electronic filing (eBIRForms or eFPS) — Source: BIR/DOF November 2023 — Confidence: OFFICIAL
  - Electronic filers: ~5.5M × 69% = **~3.8M current electronic filers** — Confidence: DERIVED
- **The 31% non-electronic filers** (manual) are a conversion market (~1.7M) — Confidence: DERIVED

**The specific B7 value proposition** (filing bridge, not just filing) targets those who also use accounting software and need import capability:
- Accounting software users among active filers: ESTIMATED ~10–20% = **550,000–1,100,000** — Confidence: ESTIMATED
  - Cloud accounting software penetration in PH SMEs is low but growing; Xero Philippines has ~100K+ users (industry estimate); QuickBooks PH is similar; local providers (MPM, Taxumo, JuanTax) add more
  - Total meaningful addressable for B7 bridge: **~500,000–600,000** (Confidence: ESTIMATED)

**Addressable consumer population:** **550,000**

**Current professional cost:** CPA/bookkeeper re-entry time: ₱500–₱3,000 per form manually re-entered. A business with 12+ forms per year spends ₱6,000–₱36,000/year on this labor alone.

**Our consumer price:** ₱199/month

**Consumer TAM (B7):** 550,000 × ₱199 × 12 = **₱1,313M/year ≈ ₱1.31B/year**

### Professional Segment

**Who:** CPA firms and bookkeeping practices using accounting software who need to bridge to eBIRForms. The automation multiplier effect is highest here (one bookkeeper using B7 can serve 3–5× more clients).

**Population:**
- **30,000–40,000** CPAs and bookkeepers using accounting software professionally — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month

**Professional TAM (B7):** 35,000 × ₱999 × 12 = **₱419M/year**

*Note: B7 competes with Taxumo and JuanTax for the core filing market. The moat score of 2 (vs. 4 for B4) reflects existing competition. TAM is real but SAM/SOM will be lower than B3/B4/B5 due to competition.*

### Total TAM — B7

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer | 550,000 addressable accounting software users | ₱199/mo | ₱1,313M |
| Professional | 35,000 CPAs/bookkeepers | ₱999/mo/seat | ₱419M |
| **Total TAM** | | | **₱1,732M ≈ ₱1.73B** |

**SAM:** ₱346M — 20% of TAM (lower due to Taxumo/JuanTax competition eating most of the market)
**SOM Year 1 (1% of SAM):** ₱3.5M
**SOM Year 3 (5% of SAM):** ₱17.3M

---

## Cluster Summary Table

| Tool | Score | Consumer Pop | Consumer TAM | Pro Pop | Pro TAM | **Total TAM** | SAM | SOM Y1 | SOM Y3 |
|------|-------|-------------|-------------|---------|---------|-------------|-----|--------|--------|
| B1 — Form Navigator | 4.05 | 1,787,500 | ₱4,268M | 35,000 | ₱419M | **₱4,687M** | ₱1,407M | ₱14.1M | ₱70.4M |
| B2 — Penalty Calc | 4.30 | 500,000 | ₱1,194M | 44,000 | ₱528M | **₱1,722M** | ₱517M | ₱5.2M | ₱25.9M |
| B3 — Compliance Cal | 4.30 | 2,437,500 | ₱5,822M | 35,000 | ₱419M | **₱6,241M** | ₱1,872M | ₱18.7M | ₱93.6M |
| B4 — Withholding | 4.20 | 610,000 | ₱1,456M | 40,000 | ₱479M | **₱1,935M** | ₱581M | ₱5.8M | ₱29.1M |
| B5 — Quarterly IT | 4.30 | 1,180,000 | ₱2,817M | 35,000 | ₱419M | **₱3,236M** | ₱971M | ₱9.7M | ₱48.6M |
| B6 — 2307 Tracker | 4.00 | 1,500,000 | ₱3,582M | 35,000 | ₱419M | **₱4,001M** | ₱1,200M | ₱12.0M | ₱60.0M |
| B7 — eBIRForms | 4.05 | 550,000 | ₱1,313M | 35,000 | ₱419M | **₱1,732M** | ₱346M | ₱3.5M | ₱17.3M |
| **Cluster Total** | | | **₱20,452M** | | **₱3,102M** | **₱23,554M ≈ ₱23.6B** | **₱6,894M** | **₱69M** | **₱345M** |

*Note: Consumer populations partially overlap — a single business is an addressable user for B1, B3, B4, B5, B6, and B7 simultaneously. TAMs are additive only in a bundled product context; in standalone deployments, they cannot be summed. The cluster TAM represents total value available across all tools if sold to all segments.*

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| PSA registered business establishments: 1,109,684 | PSA List of Establishments 2022 | 2022 | OFFICIAL |
| DTI MSME count: 1,241,476 | DTI MSME Statistics in Brief 2023 | 2023 | OFFICIAL |
| SEC active companies end-2024: 527,710 | SEC press release / BusinessMirror | End-2024 | OFFICIAL |
| Individual 1701/1701A/1701Q filers: 2,186,544 | BIR CY2023 Annual Report, Table 3 | 2023 | OFFICIAL |
| VAT-registered taxpayers: ~1,700,000 | ESTIMATED — BIR annual report not publicly indexed; derived from PSA establishment count + VAT threshold analysis | 2023 | ESTIMATED |
| Electronic filers: 69% of total | BIR/DOF press release, November 2023 | 2023 | OFFICIAL |
| Workers in PSIC 6920 (accounting/bookkeeping/tax consultancy): 23,678 | PSA 2022 ASPBI, Professional, Scientific and Technical Activities Section | 2022 | OFFICIAL |
| Total CPAs: ~200,000 | BOA Chairman, Manila Times May 2023 | 2023 | ESTIMATED |
| Lawyers (roll of attorneys, end-2024): ~91,000 | DERIVED: SC Roll (84,236, Nov 2022) + 2023 bar passers (3,812) + 2024 bar passers (3,962) | End-2024 | DERIVED |
| BIR penalty computation events: ~570,000/year | ESTIMATED: Scored domains reference; no official BIR annual assessment count published | ~2023 | ESTIMATED |
| Top withholding agents (TWA) count: ~50,000–150,000 | ESTIMATED: Based on ≥₱12M revenue threshold (RR 07-19 2019); historical list grew from 5K → 10K → 20K corporations under old rules; current threshold-based system includes more | 2023 | ESTIMATED |
| Accounting software users among active BIR filers: ~550,000 | ESTIMATED: Based on cloud accounting software market estimates (Xero PH ~100K+, QuickBooks, local providers) | ~2023 | ESTIMATED |

---

## Notes & Caveats

1. **VAT-registered taxpayer count is a critical data gap.** The BIR annual report apparently contains this figure (likely ~1.5M–2.5M based on the ₱3M VAT threshold and PSA business count), but the annual report PDF is not publicly indexed on the web and the HTML version has SSL certificate issues preventing automated access. All analyses using the VAT-registered count use ESTIMATED confidence. A BIR FOI request would resolve this.

2. **Overlap between consumer populations is substantial.** A single sole proprietor may be addressable for B1, B3, B5, and B6 simultaneously. The cluster TAM table is additive for tool-specific TAM purposes but should not be used to derive a unique consumer count by summation.

3. **B7 (eBIRForms) faces the highest competitive pressure.** Taxumo, JuanTax, and other existing tools already cover the core filing market. The differentiated opportunity for B7 is in specialized forms (CGT, DST, estate, donor's tax) not covered by competitors, and in the data import/bridge feature. SAM is set at 20% of TAM (vs. 30% for other tools) to reflect competitive displacement.

4. **Professional segment is underestimated.** The 35,000–40,000 CPA/bookkeeper estimate covers only active compliance practitioners. The ~50,000 estimated non-CPA bookkeepers (PSA data implies formal sector alone has 23,678 in PSIC 6920 establishments, with additional freelance bookkeepers) could double the B2B addressable market for tools like B4 and B5.

5. **BIR Penalty Calculator (B2) is uniquely defensible.** The EOPT Act 2024 introduced a new two-tier penalty rate structure (25% vs. 50% surcharge depending on the violation type), making existing penalty computation guides outdated. The first tool to correctly implement NIRC Sections 248/249 as amended by EOPT with the updated compromise penalty schedule (RMO 7-2015, as superseded) has a 12–18 month window of exclusivity.

6. **Compliance Calendar (B3) has the broadest TAM in this cluster.** The discontinuation of the BIR's printed tax calendar after 2025 creates an acute, timely pain point. B3's TAM of ₱6.24B is the largest in this cluster but requires strong execution on calendar accuracy and RMC/RR update monitoring.

7. **Data for BIR withholding agent count.** The exact number of registered withholding agents (for compensation withholding: 1601-C) is proxied by PSA establishment count (1,109,684). BIR likely has a higher count in its registry due to historical registrations of dormant firms, but 1,109,684 is the most reliable count of currently active business establishments. The number of TWAs (EWT on supplier payments) is much smaller (~50K–150K) and is the more relevant addressable market for EWT-specific features of B4.
