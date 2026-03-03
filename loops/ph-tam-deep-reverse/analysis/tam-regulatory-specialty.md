# TAM: Regulatory Specialty Tools Cluster

**Tools:**
- P-IPO-1: IP Portfolio Compliance Dashboard (Score: 3.95)
- P-IPO-2: Trademark Total Fee Calculator + DAU Tracker (Score: 3.80)
- Q-ERC-1: Electricity Bill Verification & Total Cost Estimator (Score: 3.75)
- S-BSP-1: Pawnshop Loan Cost Transparency Tool (Score: 3.85)
- M-FDA-1: FDA CPR + LTO Total Registration Cost Calculator (Score: 3.80)
- M-FDA-2: FDA Multi-Product Renewal Compliance Calendar (Score: 3.80)
- L-TES-1: TESDA NC Expiry Tracker & Re-assessment Reminder (Score: 3.85)
- R-BOI-1: BOI/PEZA SCIT vs. EDR Election Analysis Tool (Score: 3.75)
- R-BOI-2: BOI ITH Period Calculator + Tax Savings NPV (Score: 3.80)
- R-PCAB-1: PCAB ACP Score Calculator & Category Screener (Score: 3.80)
- T-NPC-1: NPC 72-Hour Breach Notification Protocol (Score: 3.50) *(listed as N-NPC-1 in aspects.md)*
- K-NTC-1: NTC Spectrum User Fee Calculator (Score: 3.35) *(listed as R-NTC-1 in aspects.md)*

**Loop source:** regulatory-atlas

---

## Tool Definitions

| Tool ID | Tool Name | Core Function | Score |
|---------|-----------|---------------|-------|
| P-IPO-1 | IP Portfolio Compliance Dashboard | Trademark DAU (years 3+5), renewal (year 10/20), and patent annuity deadlines across entire portfolio; IPOPHL 2024 accreditation rules formalized trademark agent profession | 3.95 |
| P-IPO-2 | Trademark Total Fee Calculator + DAU Tracker | IPOPHL official fee schedule + 50% surcharge for late DAU; total lifecycle cost per mark from application through second renewal; DAU countdown for each registered mark | 3.80 |
| Q-ERC-1 | Electricity Bill Verification & Total Cost Estimator | Meralco/ERC tariff component breakdown; cross-checks generation/transmission/distribution/taxes; identifies billing errors and lifeline eligibility; electricity is the #1 business overhead after payroll | 3.75 |
| S-BSP-1 | Pawnshop Loan Cost Transparency Tool | BSP-regulated pawnshop pledge loan APR transparency; Circular 1088 disclosure requirements; shows true borrowing cost vs. stated "service charge"; 16K+ branches nationwide | 3.85 |
| M-FDA-1 | FDA CPR + LTO Total Registration Cost Calculator | All FDA registration fees (CPR + LTO by product category/risk class) + drafting/professional fees + renewal schedule; RA 9711 Food and Drug Administration Act compliance | 3.80 |
| M-FDA-2 | FDA Multi-Product Renewal Compliance Calendar | Rolling renewal tracker for CPR portfolios (5-yr food / 1–2-yr drugs) + LTO biennial renewal + 120-day cliff penalty on late renewal; mass market: FMCGs + drug stores | 3.80 |
| L-TES-1 | TESDA NC Expiry Tracker & Re-assessment Reminder | NC I (2-yr) / NC II–IV (5-yr) validity countdown; re-assessment cost estimator by qualification; OFW documentation chain (POEA requirement for NC II); 872K new certifications/yr | 3.85 |
| R-BOI-1 | BOI/PEZA SCIT vs. EDR Election Analysis Tool | CREATE MORE irrevocable election: Special Corporate Income Tax (5%) vs. Enhanced Deductions Regime; NPV comparison over ITH + post-incentive period; Big 4 currently monopolize this analysis (₱200K–₱500K) | 3.75 |
| R-BOI-2 | BOI ITH Period Calculator + Tax Savings NPV | BOI ITH period (3–6 yrs by Tier) + 5-yr Special Deductions or SCIT post-ITH; projected CIT savings; relevant for all 303+ BOI-approved projects/yr | 3.80 |
| R-PCAB-1 | PCAB ACP Score Calculator & Category Screener | PCAB Allowable Contracted Projects formula; ACP limit by category (AAAA→Trade/E); 16,298 licensed contractors; license category upgrading cost-benefit analysis | 3.80 |
| T-NPC-1 | NPC 72-Hour Breach Notification Protocol | Data Privacy Act Sec. 20(f) + NPC Circular 2022-01; 72-hr mandatory notification timeline from discovery; breach classification matrix; NPC-registered PICs/PIPs: 4,307 in 2023 → 11,524 by 2025 | 3.50 |
| K-NTC-1 | NTC Spectrum User Fee Calculator | NTC Memorandum Circular 06-08-2004 and amendments; annual spectrum user fees by frequency band and service type; relevant to private network operators (VSAT, P2P microwave, private repeater systems) | 3.35 |

---

## P-IPO-1: IP Portfolio Compliance Dashboard

### Consumer Segment

**Who:** Philippine businesses (corporations, sole proprietors, SMEs) with active trademark registrations and/or patents/utility models who must track: (1) Declaration of Actual Use (DAU) at Year 3 and Year 5 post-registration — failure results in automatic cancellation with no cure; (2) trademark renewal at Year 10; (3) patent annuity fees on an escalating schedule (₱1,550 at Year 5 → ₱65,160 at Year 20) with a 50% surcharge during the 6-month grace period; and (4) industrial design renewal at Year 5.

**Population:**

- **41,953** trademark applications filed in 2023 — Source: IPOPHL press release, March 2024 ("2023 IP Filings Jump 2.5%"); WIPO Annual Technical Report ATR/PI/2023/PH — Confidence: OFFICIAL
- **44,216** trademark applications filed in 2024 (+5% YoY) — Source: WIPO Annual Technical Report ATR/TM/2024/PH — Confidence: OFFICIAL
- **30,866** trademark registrations granted in 2023 — Source: WIPO ATR/TM/2024/PH — Confidence: OFFICIAL
- **31,869** trademark registrations granted in 2024 — Source: WIPO ATR/TM/2024/PH — Confidence: OFFICIAL
- **DERIVED active trademark registrations in force (2024): ~250,000–320,000** — DERIVED: trademark validity is 10 years from registration; annual grants averaging ~25K–30K over the past 10 years (IPOPHL reports slow growth in recent years, lower in early 2010s); approximate steady-state stock = 25K/yr average × 10 yrs = ~250K; plus marks that are in their grace period or post-renewal. IPOPHL does not publish a cumulative "total active marks" figure — Confidence: DERIVED
- **4,544** invention patent applications filed in 2023 — Source: WIPO ATR/PI/2023/PH — Confidence: OFFICIAL
- **1,847** utility model applications filed in 2023 (+24% YoY) — Source: WIPO ATR/PI/2023/PH — Confidence: OFFICIAL
- **1,488** industrial design applications filed in 2023 (+20% YoY) — Source: WIPO ATR/PI/2023/PH — Confidence: OFFICIAL
- **DERIVED active patent portfolio requiring annuity tracking: ~35,000–60,000** — DERIVED: patents granted in Philippines historically ~300–1,200/yr (primarily PCT-designated); 20-year validity; most commercial patents are foreign-owned (>80% of PH patent applications are PCT designations from foreign filers, per WIPO data); Philippine-owned active patents likely ~3,000–5,000; total portfolio including foreign-owned active marks tracked by local counsel = ESTIMATED 35K–60K marks requiring local fee management — Confidence: ESTIMATED
- **P-IPO-1 target consumer: businesses with 3+ trademarks or mixed trademark+patent portfolios** — ESTIMATED ~60,000–80,000 entities: SEC-registered active corporations (~900K) + DTI-registered businesses (~4.5M) × ~1.5% that hold formal trademark registrations (not just applications) = ~50K–80K; this is the most price-sensitive segment currently paying IP firm retainers of ₱10K–₱20K/year — Confidence: ESTIMATED

**Addressable fraction:** 60% — IPOPHL applicants skew urban, formally registered, and commercially active (filing trademarks implies a certain level of business sophistication); PSA 2023: 54% national internet penetration but trademark filers are disproportionately Metro Manila and Luzon urban (>70% of IPOPHL applications are from NCR-based applicants, per IPOPHL regional data); use 60% blended for digital tool adoption.

**Addressable consumer population:** 70,000 × 60% = **42,000**

**Current professional cost:** IP firm retainer for trademark portfolio monitoring: ₱10,000–₱20,000/year (per tool description; per-mark basis from Philippine IP law firm fee schedules). For a business with 10+ marks, this is ₱100K–₱200K/year in professional fees. Missed DAU triggers automatic cancellation — replacement filing cost = ₱2,160 (IPOPHL trademark application fee) + attorney fees ₱15,000–₱30,000.

**Our consumer price:** ₱199/month (portfolio dashboard: auto-tracks all registered marks by IPOPHL registration number, sends DAU Year 3/5 countdowns, renewal reminders, patent annuity due dates)

**Consumer TAM:** 42,000 × ₱199/mo × 12 = **₱100.3M/year**

---

### Professional Segment

**Who:** IP law practitioners (lawyers handling trademark prosecution and portfolio management), trademark agents (post-IPOPHL MC 2024-012 accreditation), and corporate secretaries/IP managers in medium-to-large enterprises who manage trademark portfolios for multiple corporate clients or entities within a conglomerate.

**Population:**

- **~60,000** total IBP (Integrated Bar of the Philippines) members (lawyers) as of 2023 — Source: IBP membership data (cited in bar bulletin reports; IBP does not publish real-time totals publicly) — Confidence: ESTIMATED
- **No official count of registered IP agents/attorneys** — The IPOPHL formal recognition system for trademark agents/attorneys took effect August 22, 2024 under MC 2024-012 and MC 2024-013; the qualifying examination had not yet been held as of early 2025; a public registry is planned but not yet published — Source: IPOPHL press release, August 2024 — Confidence: OFFICIAL (note: no count exists)
- **ESTIMATED ~2,500–4,000 lawyers and agents actively practicing IP law** — DERIVED from: (a) IBP Intellectual Property Lawyers Association of the Philippines (IPLAW); (b) IPOPHL estimate of ~2,000 trademark agents operating informally before the 2024 MC (IPOPHL discussion documents, 2023); (c) cross-check: 44,216 trademark applications/yr ÷ ~15 applications per practitioner per year (average workload for patent/TM filing) = ~3,000 active practitioners — Confidence: ESTIMATED
- **ESTIMATED ~1,500 practitioners who actively manage ongoing portfolios** (as opposed to one-off application filing) — DERIVED from: active portfolio management (DAU + renewals) requires ongoing client relationship; roughly 60% of IP filings are by repeat filers; 60% × 2,500 active practitioners = 1,500 — Confidence: ESTIMATED (methodology disclosed)

**Clients per professional per year:** An IP practitioner managing ongoing portfolios handles 10–50 corporate clients with 3–50 marks each; total portfolio under management per practitioner: 50–500 trademark records.

**B2B price per seat:** ₱2,999/month (Practice tier: multi-client IP portfolio management, IPOPHL database integration, automated DAU/renewal calendar for all client marks, deadline alert engine, per-client portfolio report export)

**Professional TAM:** 1,500 × ₱2,999/mo × 12 = **₱53.98M/year**

---

### Total TAM — P-IPO-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~42,000 addressable trademark holders | ₱199/mo | ₱100.3M |
| Professional (B2B) | ~1,500 IP practitioners | ₱2,999/mo/seat | ₱54.0M |
| **Total TAM** | | | **₱154.3M** |

**SAM (Serviceable):** ₱61.7M — IP applicants are heavily concentrated in NCR (>70% of IPOPHL applications); digital IP practice tools are adopted first by Manila-based law firms and corporate IP departments; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.62M
**SOM Year 3 (5%):** ₱3.08M

---

## P-IPO-2: Trademark Total Fee Calculator + DAU Tracker

### Consumer Segment

**Who:** Applicants and brand owners who need to calculate the total cost of trademark registration and protection through the IPOPHL lifecycle: application fee → examination → registration fee → DAU fee at Year 3 and Year 5 (₱2,520/class per DAU filing, plus 50% surcharge if late) → renewal at Year 10 (₱3,024/class) → second renewal at Year 20. P-IPO-2 is the fee-calculator version of P-IPO-1 — targeted at new applicants and small businesses with 1–5 marks who need cost forecasting but not full portfolio management.

**Population:**

- **44,216** trademark application filers in 2024 — Source: WIPO ATR/TM/2024/PH — Confidence: OFFICIAL
- Annual unique trademark applicants: approximately 35,000–40,000 (some filers file multiple marks in one year; total applications ÷ 1.1 multiplicity = ~38,000 unique applicants in 2024) — Confidence: DERIVED
- **~30,000 new trademark owners per year** (those whose marks actually get registered; from 31,869 grants in 2024; some are non-Philippine applicants, ~35% of applications are foreign per WIPO data; Philippine applicants = ~65% × 31,869 = ~20,700 domestic grants/yr) — Confidence: DERIVED

**Addressable fraction:** 65% — Same as P-IPO-1 but slightly higher because the fee calculator has broader utility for anyone considering filing (pre-application budgeting), not just those who already have active marks.

**Addressable consumer population:** 38,000 new applicants/year × 65% = **24,700** (annual cohort; this is an annual-use tool at application time, not a multi-year SaaS for P-IPO-2 at consumer level)

*Note: P-IPO-2 is best monetized as a freemium acquisition tool (free fee calculator → paid P-IPO-1 portfolio dashboard). Consumer TAM for P-IPO-2 standalone is the annual cohort of new applicants; it overlaps significantly with P-IPO-1's ongoing portfolio management market.*

**Current professional cost:** An IP lawyer charges ₱5,000–₱15,000 to advise on total registration cost and DAU obligations. Online resources are fragmented and IPOPHL's official fee schedule is not presented as a lifecycle cost calculator.

**Our consumer price:** ₱199/one-time calculation (freemium: basic fee estimate free; detailed lifecycle cost projection with DAU reminders = ₱199); or bundled into P-IPO-1 subscription.

**Consumer TAM (standalone):** 24,700 × ₱199/use = **₱4.9M/year**

*P-IPO-2 is primarily a funnel/freemium tool into P-IPO-1; its standalone TAM is small. Total lifecycle TAM is captured under P-IPO-1.*

---

### Professional Segment

**Who:** IP practitioners using P-IPO-2 as a client-facing quoting tool — quickly generate a trademarking budget for prospective clients during initial consultation.

**Professional TAM:** Included in P-IPO-1 professional TAM above (same seat price, same practitioners). P-IPO-2 adds marginal value as a feature within the P-IPO-1 practice dashboard.

**Professional TAM (P-IPO-2 standalone):** Not additive to P-IPO-1 — treat as a bundled feature, ₱0 incremental TAM.

---

### Total TAM — P-IPO-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct, new applicants) | ~24,700 annual applicants | ₱199/use | ₱4.9M |
| Professional (B2B) | Bundled within P-IPO-1 | — | — |
| **Total TAM** | | | **₱4.9M** |

**SAM:** ₱2.0M — funnel tool; SAM = 40% of consumer TAM.
**SOM Year 1 (1%):** ₱0.02M
**SOM Year 3 (5%):** ₱0.10M

*P-IPO-2 should not be built as a standalone product; it is a feature within the P-IPO-1 IP Portfolio Dashboard. Its total economic value is captured in P-IPO-1's TAM.*

---

## Q-ERC-1: Electricity Bill Verification & Total Cost Estimator

### Consumer Segment

**Who:** Philippine electricity consumers — primarily commercial and industrial account holders — who want to verify their monthly electricity bill by cross-checking each tariff component (generation charge, transmission charge, distribution charge, metering charge, supply charge, taxes, and universal charges) against ERC-approved rates. Secondary segment: large residential consumers in Meralco's service area who suspect billing errors or want to track monthly electricity cost against their budget.

**Population:**

- **~28 million** total electricity consumer accounts nationwide (2024, all 148 distribution utilities) — Source: Grokipedia synthesis of ERC/NEA data; NEA 2024 Annual Report (nea.gov.ph, 2025) — Confidence: ESTIMATED (no single official publication of "28 million total accounts" was found in official ERC tabulation; NEA's own data refers to "25.3 million households served" at 91.1% electrification rate as of June 2023; the 28M figure is the broader estimate including commercial/industrial; treat as ESTIMATED pending ERC-published total)
- **7,800,000** Meralco customer accounts (end-2023) → **8,040,000** (end-2024) — Source: Meralco 2023 Annual Report — Confidence: OFFICIAL
  - Meralco residential: ~92% = 7,197,000 accounts
  - Meralco commercial: ~7% = 546,000 accounts
  - Meralco industrial: <1% = ~78,000 accounts
- **14,835,390** NEA electric cooperative consumer connections as of December 2021 — Source: Manila Bulletin citing NEA data, March 2022 — Confidence: OFFICIAL
- **ERC Qualified End-Users (large industrial/commercial that can participate in Retail Competition and Open Access — RCOA):** 4,124 with Certificates of Compliance (2023) — Source: ERC 2023 accomplishment data, cited in BusinessWorld "23 Years of ERC," June 2024 — Confidence: OFFICIAL
- **Target addressable population for Q-ERC-1:** Commercial + industrial consumers who have complex, multi-component bills (generation + transmission + distribution breakdown, generation adjustment mechanisms like GRAM/DRAM, transmission adjustment via TRAM):
  - Meralco commercial + industrial: ~624,000 accounts (DERIVED: Meralco 7% commercial + <1% industrial × 7.8M total)
  - NEA EC commercial/industrial equivalents: ESTIMATED ~1,000,000 (NEA ECs serve rural areas; commercial account share is lower; ~7% of 14.8M = ~1.03M)
  - Total commercial + industrial: ESTIMATED **1,600,000** nationwide
  - High-billing residential consumers (monthly bill >₱5,000): ESTIMATED additional ~2,000,000 consumers who actively scrutinize bills
  - Total addressable: **3,600,000** consumers with motivation to use bill verification tool

**Addressable fraction:** 55% — Commercial account holders have higher internet penetration; the Meralco app already has 5.9M registered users (Meralco Digital, 2023) indicating strong digital adoption in the service area; NEA EC areas have lower digital adoption; blended addressable fraction = 55%.

**Addressable consumer population:** 3,600,000 × 55% = **1,980,000**

**Current professional cost:** No formal professional market for individual electricity bill review; most consumers accept bills without verification. Industrial consumers with >₱500K/month bills sometimes engage energy consultants (₱50,000–₱200,000/year retainer) but this is the exception. The acute pain is billing errors (common when meters are estimated rather than read) and unexplained charge spikes.

**Our consumer price:** ₱199/month (electricity bill scanner: photo-to-text bill parsing, component breakdown, rate comparison against ERC-approved tariffs, 12-month trend chart, anomaly alert)

**Consumer TAM:** 1,980,000 × ₱199/mo × 12 = **₱472.9M/year**

---

### Professional Segment

**Who:** Energy managers, building administrators, and facilities management firms who handle electricity billing for multiple commercial/industrial clients or properties. Also: energy consultants who perform billing audits and Energy Management System (EMS) services under the Energy Efficiency and Conservation Act (RA 11285).

**Population:**

- **148 distribution utilities** (DUs) — regulated entities; not the professional market for this tool
- **~4,124 ERC Certificate of Compliance holders** (qualified end-users in the RCOA market) — Source: ERC 2023 data — Confidence: OFFICIAL; these large consumers are already sophisticated; they are not the primary B2B target
- **ESTIMATED ~8,000–12,000 energy managers and facilities officers** — DERIVED from: (a) DOLE establishment survey: ~1,200 large enterprises (500+ employees) + ~8,700 medium enterprises (100–499 employees) would have dedicated energy managers; (b) RA 11285 Energy Efficiency Act mandates Designated Energy Managers (DEMs) for large energy consumers (above threshold of 500 kWh/day for establishments); Philippine Energy Management Officers program (PEMO) registry was being established; ESTIMATED ~10,000 qualified DEMs — Confidence: ESTIMATED
- **~500–800 active energy consultants/ESCOs** — DERIVED from: DOE-registered Energy Service Companies and accredited energy auditors; Philippine Energy Efficiency Alliance (PE2) membership ~400 companies — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro tier: multi-property electricity cost dashboard, portfolio billing anomaly detection, ERC tariff comparison by DU, 24-month trend per property)

**Professional TAM:** 10,000 × ₱999/mo × 12 = **₱119.9M/year**

---

### Total TAM — Q-ERC-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~1.98M addressable consumers | ₱199/mo | ₱472.9M |
| Professional (B2B) | ~10,000 energy managers | ₱999/mo/seat | ₱119.9M |
| **Total TAM** | | | **₱592.8M** |

**SAM (Serviceable):** ₱237.1M — Meralco service area (NCR + 39 cities/72 municipalities) accounts for ~50% of national commercial electricity consumption; high digital adoption; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱2.37M
**SOM Year 3 (5%):** ₱11.85M

---

## S-BSP-1: Pawnshop Loan Cost Transparency Tool

### Consumer Segment

**Who:** Individual Filipinos who use BSP-regulated pawnshops to obtain pledge loans (sangla) — typically collateralized by jewelry, electronics, or other personal property — and who want to understand the true annual percentage rate (APR) of their borrowing. BSP Circular 1088 mandates interest rate disclosure; S-BSP-1 converts stated service charge rates (typically quoted as "X% per month" or "X% per [period]") into standardized APR for comparison.

**Population:**

- **16,219** total pawnshop offices operating in the Philippines as of June 2024 — Source: BSP press release cited by Philstar.com, November 2024 — Confidence: OFFICIAL
- **1,169** pawnshop head offices / operators (distinct entities) as of June 2024 — Source: Same BSP data — Confidence: OFFICIAL
- **1,428** pawnshop operators supervised by BSP as of end-2024 — Source: BSP supervisory data, cited in BSP press release — Confidence: OFFICIAL
- **15,050** pawnshop branches as of June 2024 — Source: Same BSP data — Confidence: OFFICIAL
- **PHP 54.5 billion** outstanding pledge loans (sangla) as of end-2021 — Source: BSP Governor Diokno press statement, reported by PNA, 2022 — Confidence: OFFICIAL (dated; 2022/2023 figures not extractable from indexed sources)
- **83.3%** of Philippines LGUs (1,361 of 1,634 municipalities/cities) have at least one pawnshop — Source: BSP press release, Q1 2022, cited by PNA — Confidence: OFFICIAL

**Estimating total annual pawnshop borrowers:**
- PHP 54.5 billion outstanding pledge loans (2021) at an average pledge value of ESTIMATED ₱3,000–₱5,000 per transaction (jewelry and small electronics; standard pawnshop minimum) = ESTIMATED ~11M–18M outstanding pledge tickets; but many are recycled/extended rather than new loans
- BSP Financial Inclusion Survey 2021: 34% of Filipino adults borrowed money; among borrowers, pawnshops are a primary source for unbanked households — Source: BSP 2021 FIS — Confidence: OFFICIAL
- Filipino adult population 2023: ~70 million adults (PSA 2020 Census interpolated); 34% borrowers = ~23.8 million borrowers; share going to pawnshops = ESTIMATED 20% (pawnshops serve the lower-income segment; bank borrowing, SSS/Pag-IBIG loans, and digital lending are alternatives) = **~4.76 million annual pawnshop borrowers** — Confidence: ESTIMATED (triangulated from BSP FIS borrower share + adult population)
- Alternative proxy: 16,219 pawnshop offices × average 1–3 transactions/day per office × 300 operating days = 4.9M–14.6M annual transactions; annual unique borrowers (many are repeat): ESTIMATED 4–6 million unique borrowers per year — Confidence: ESTIMATED

**Target addressable population:** ~5,000,000 annual pawnshop borrowers

**Addressable fraction:** 40% — Pawnshop users skew lower-income and rural; PSA 2023 internet penetration nationally = 54%; but pawnshop borrowers' internet access is likely lower than average; GSMA 2023: Philippine mobile internet users = 67M but access ≠ active digital tool use; use 40% as a conservative addressable fraction for this income demographic.

**Addressable consumer population:** 5,000,000 × 40% = **2,000,000**

**Current professional cost:** No professional market; pawnshop customers have zero access to independent cost transparency tools. BSP Circular 1088 mandates pawnshops to post rates, but comparison across shops or conversion to APR is not consumer-friendly. The pain is information asymmetry, not a professional fee.

**Our consumer price:** ₱0 freemium (core APR transparency tool is free; premium ₱99/month adds: multi-pawnshop comparison, best-rate finder by location, early redemption calculator, alternative lender comparison) — or ₱199/month subscription bundled with other financial tools.

**Consumer TAM (freemium premium tier at ₱99/mo):** 2,000,000 × 10% conversion to paid × ₱99/mo × 12 = **₱23.8M/year**
**Consumer TAM (₱199/mo bundled):** 2,000,000 × 5% conversion × ₱199/mo × 12 = **₱23.9M/year**

*Use ₱23.8M as the realistic consumer TAM assuming freemium model with 10% paid conversion.*

---

### Professional Segment

**Who:** BSP-supervised pawnshop operators who use the tool to ensure their own disclosure documents comply with BSP Circular 1088 (mandatory rate disclosure), as well as microfinance NGOs and financial literacy educators who use the tool in client education.

**Population:**

- **1,428** pawnshop operators supervised by BSP (end-2024) — Source: BSP — Confidence: OFFICIAL
- B2B application for S-BSP-1: pawnshop compliance module (generate Circular 1088-compliant disclosure forms, track interest rate changes, ensure all branches display correct rates) = ₱999/month per operator head office

**Professional TAM:** 1,428 × ₱999/mo × 12 = **₱17.1M/year**

---

### Total TAM — S-BSP-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct, freemium paid tier) | ~2M addressable borrowers × 10% paid | ₱99/mo | ₱23.8M |
| Professional (B2B pawnshop compliance) | ~1,428 operators | ₱999/mo/seat | ₱17.1M |
| **Total TAM** | | | **₱40.9M** |

**SAM (Serviceable):** ₱16.4M — urban pawnshop users (NCR + regional centers); digital-capable borrowers; 40% fraction.

**SOM Year 1 (1%):** ₱0.16M
**SOM Year 3 (5%):** ₱0.82M

*Note: S-BSP-1's strongest value proposition is as an advocacy/financial inclusion tool (freemium with social mission) or as a consumer acquisition funnel for a broader fintech/financial inclusion platform rather than a standalone SaaS.*

---

## M-FDA-1: FDA CPR + LTO Total Registration Cost Calculator

### Consumer Segment

**Who:** Philippine businesses that manufacture, distribute, import, export, or retail food products, pharmaceutical/drug products, cosmetics, medical devices, or household/urban hazardous substances, and that need to obtain FDA License to Operate (LTO) and Certificate of Product Registration (CPR) under RA 9711 (FDA Act of 2009). M-FDA-1 calculates total cost per product: official FDA fees (by risk class and product category) + required laboratory testing costs + professional/consultant fees for dossier preparation.

**Population:**

- **FDA Annual Report 2023** exists at fda.gov.ph but PDF content not extractable via web scraping; no third-party source republished specific aggregate LTO holder counts — Source: FDA Annual Report 2023 PDF — Confidence: NOT RETRIEVABLE (requires direct PDF access)
- **ESTIMATED ~80,000–100,000 LTO holders** — DERIVED from: (a) FDA 2019 Annual Report (cited in Philippine regulatory news; ~71,000 LTO holders at that time per FDA); (b) COVID-19 period 2020–2022 saw large influx of new applications for PPE, sanitizer, medical device LTOs; (c) medical device retailer LTO deadline December 18, 2023 (FDA Circular 2021-021) triggered a new wave of retail LTO applications; (d) annual LTO renewal cycle with ~2-yr validity = steady-state stock of ~80K–100K by 2023 — Confidence: ESTIMATED (derived from 2019 official baseline + qualitative growth factors)
- **PSA 2022 List of Establishments: 1,109,684 total formal establishments** — Source: PSA 2022 LE (per DTI MSMED Plan 2023–2028) — Confidence: OFFICIAL; subset requiring FDA LTO: food manufacturers + food traders + food retailers of packaged products + pharmaceutical manufacturers + drug stores + cosmetics importers = ESTIMATED ~200,000–300,000 establishments that could require FDA LTO (a broader universe than actual LTO holders, due to non-compliance)
- **DTI MSME Statistics: 1,241,476 registered establishments as of 2024** — Source: DTI MSME Statistics in Brief, November 2024 — Confidence: OFFICIAL
- For M-FDA-1 (cost calculator): target is prospective applicants + existing LTO holders calculating renewal/new product registration costs = ESTIMATED **90,000 active LTO holders + 20,000 new applicants/year = ~110,000 addressable entities**

**Addressable fraction:** 55% — FDA-regulated businesses are formally registered entities (SEC/DTI registered); internet access among business owners with FDA compliance obligations is higher than general population; use 55%.

**Addressable consumer population:** 110,000 × 55% = **60,500**

**Current professional cost:** FDA registration consultants charge ₱15,000–₱80,000 per CPR application depending on product category and risk class (FMCG food: ₱15K–₱30K; pharmaceutical: ₱40K–₱80K; medical device: ₱30K–₱60K) — cited in Philippine regulatory affairs consultant websites and FDA forum discussions. M-FDA-1 calculates these costs upfront, eliminating surprise fees.

**Our consumer price:** ₱199/month (subscription: unlimited product cost calculations, all FDA fee schedules by product class, testing cost directory, FDA iRegister form checker)

**Consumer TAM:** 60,500 × ₱199/mo × 12 = **₱144.4M/year**

---

### Professional Segment

**Who:** Regulatory affairs consultants and FDA-accredited third-party processors who manage multiple client CPR and LTO applications simultaneously. M-FDA-1 at professional tier: multi-client application cost tracking, fee schedule library, per-client cost summary reporting.

**Population:**

- **ESTIMATED ~3,000–5,000 active FDA regulatory affairs consultants** — DERIVED from: (a) FDA accredits third-party processors; (b) a 2022 FOI-based estimate placed active FDA consultants at ~2,000–4,000 practitioners (from a Philippine regulatory affairs professional community discussion); (c) with 80K–100K LTO holders requiring biennial renewal + new applications, and each consultant handling 20–50 client files = ~3,000 consultants serving the active market — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro: unlimited client file management, auto-populate FDA fee schedules by class, renewal calendar across all client products)

**Professional TAM:** 3,500 × ₱999/mo × 12 = **₱41.9M/year**

---

### Total TAM — M-FDA-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~60,500 addressable FDA-regulated businesses | ₱199/mo | ₱144.4M |
| Professional (B2B) | ~3,500 regulatory affairs consultants | ₱999/mo/seat | ₱41.9M |
| **Total TAM** | | | **₱186.3M** |

**SAM (Serviceable):** ₱74.5M — FDA-regulated manufacturers cluster in NCR, Rizal, Cavite, Cebu; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.75M
**SOM Year 3 (5%):** ₱3.72M

---

## M-FDA-2: FDA Multi-Product Renewal Compliance Calendar

### Consumer Segment

**Who:** Existing FDA LTO holders and CPR registrants who manage ongoing product registration renewals — CPR validity is 5 years for food products and 1–2 years for drugs/cosmetics/medical devices; LTO validity is 2 years (initial) and 3–5 years (renewed). The "120-day cliff" penalty for late renewal (50% surcharge after 120 days past expiration) is M-FDA-2's core value. A business with 20 CPR products and a 2-yr LTO has ~11–21 renewal events per 5-year cycle.

**Population:**

- **ESTIMATED ~90,000 active LTO holders** (same base as M-FDA-1, using mid-range) — Confidence: ESTIMATED
- **ESTIMATED ~500,000–1,000,000 active CPR records** — DERIVED from: the FDA Verification Portal Excel exports (weekly updated lists) exist for all food products, drugs, cosmetics, and medical devices; FDA operates a live registry; a single LTO holder with a portfolio of 10–100 products generates 10–100 CPR entries; with 90K LTO holders × average 8 products = ~720K active CPR records — Confidence: DERIVED (methodology disclosed)
- **Target for M-FDA-2 (calendar tracker):** LTO holders with 5+ products who face ongoing renewal management burden = ESTIMATED ~30,000 multi-product registrants (of the 90K LTO holders, approximately one-third manage more than 5 active CPRs based on the food/pharma sector's typical product portfolio size) — Confidence: ESTIMATED

**Addressable fraction:** 55% (same as M-FDA-1)

**Addressable consumer population:** 30,000 × 55% = **16,500**

**Our consumer price:** ₱199/month (product renewal calendar: CPR validity countdowns per SKU, LTO renewal reminder, 120-day cliff alert, renewal cost estimator per product)

**Consumer TAM:** 16,500 × ₱199/mo × 12 = **₱39.4M/year**

---

### Professional Segment

**Who:** Same regulatory affairs consultants as M-FDA-1 — M-FDA-2 is the calendar/compliance module companion to M-FDA-1's cost calculator. Both tools are best bundled.

**Professional TAM:** Included in M-FDA-1 professional segment. As a bundled add-on to M-FDA-1 Pro subscription, M-FDA-2 does not generate incremental TAM at the professional tier. **Treat as ₱0 additive.**

---

### Total TAM — M-FDA-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~16,500 multi-product LTO holders | ₱199/mo | ₱39.4M |
| Professional (B2B) | Bundled within M-FDA-1 | — | — |
| **Total TAM** | | | **₱39.4M** |

**SAM:** ₱15.8M — 40% serviceable fraction.
**SOM Year 1 (1%):** ₱0.16M
**SOM Year 3 (5%):** ₱0.79M

*M-FDA-1 and M-FDA-2 are best combined as an "FDA Compliance Suite" (FDA cost calculator + renewal calendar). Combined consumer TAM: ₱183.8M. Professional TAM: ₱41.9M. Combined total: ₱225.7M.*

---

## L-TES-1: TESDA NC Expiry Tracker & Re-assessment Reminder

### Consumer Segment

**Who:** Individuals holding TESDA National Certificates (NC I, NC II, NC III, NC IV) who need to track certificate validity and plan re-assessment. NC I validity: 2 years; NC II, III, IV validity: 5 years (per TESDA guidelines). Key driver: OFW documentation chain — POEA requires valid TESDA NC II for many overseas deployment categories (household service workers, caregivers, construction workers); an expired NC II blocks renewal of POEA documentation. Domestic market: NC holders in regulated occupations (licensed electricians, plumbers under RA 8792 e-Commerce trades) and government project contractors (PhilGEPS requirements often include NC verification).

**Population:**

- **872,016** certified skilled workers in 2023 — Source: PNA citing TESDA, "TESDA Reports Over 1.2M Tech-Voc Grads, 872K Certified Workers," December 2023; SEA-VET.net, "TESDA Exceeds Goals 2023" — Confidence: OFFICIAL
- **935,978** workers assessed for certification in 2023 — Source: Same — Confidence: OFFICIAL
- **1,222,330** total TVET graduates in 2023 — Source: Same — Confidence: OFFICIAL
- **93%** certification rate among those assessed (2023) — Source: Same — Confidence: OFFICIAL
- **~1,200,000** TVET graduates in 2022 at ~90% certification rate = ~1,080,000 certified in 2022 — Source: PNA citing TESDA 2022 data — Confidence: OFFICIAL
- **DERIVED cumulative active NC holders (within validity period, 2024):**
  - NC I holders (2-yr validity): last 2 years of certifications × NC I share; NC I is a minority share of total; ESTIMATED NC I share ~15% → 2 years × 872K × 15% = ~261,600 active NC I holders
  - NC II/III/IV (5-yr validity): last 5 years × 85% share → 5 years × 850K/yr = ~4,250,000 active NC II/III/IV holders
  - Total ESTIMATED active NC holders within validity: **~4,500,000** — Confidence: DERIVED (TESDA does not publish a cumulative "active NC holders" stock figure; this is derived from annual certification flow × validity periods)
- **TESDA Registry of Certified Workers (RWAC)** exists at tesda.gov.ph/RWAC as the official database but does not export aggregate counts in accessible form

**Addressable fraction:** 45% — NC holders span all income levels and all regions of the Philippines; digital access among this population is below average (many are agricultural workers, construction workers, household workers); PSA 2023: 54% national internet penetration; TESDA's own digitalization programs suggest a lower-than-average adoption rate; use 45% (PSA internet penetration × slight upward adjustment for mobile-first access via SMS-capable features).

**Addressable consumer population:** 4,500,000 × 45% = **2,025,000**

**Current professional cost:** No professional intermediary for NC tracking; this is a pain point felt by individuals (missed re-assessment → expired NC → blocked OFW deployment or job application). OFW agencies charge informal fixers ₱3,000–₱10,000 to expedite NC re-assessment (TESDA official fee: ₱200–₱600 for assessment + ₱50–₱150 for certificate; total official = ₱250–₱750).

**Our consumer price:** ₱99/month (NC validity countdown, re-assessment reminder, nearest TESDA assessment center locator, booking assistant for scheduled assessments, OFW documentation chain tracker for NC-dependent requirements)

**Consumer TAM:** 2,025,000 × ₱99/mo × 12 = **₱240.6M/year**

---

### Professional Segment

**Who:** TESDA-registered TVET institutions (private technical-vocational schools), TESDA Assessment Centers, and manning agencies/recruitment agencies that manage NC documentation for large batches of OFW applicants.

**Population:**

- **TESDA-registered private TVET institutions and assessment centers:** ESTIMATED ~4,000–5,000 institutions nationwide (TESDA accredits both TVET programs and assessment centers; the 2023 Annual TVET Statistics PDF would contain the exact count; not retrievable from indexed sources) — Confidence: ESTIMATED
- **POEA-licensed recruitment agencies:** as of 2023, ~1,600 licensed land-based recruitment agencies (POEA/DMW data from earlier aspects) that manage OFW NC documentation — Confidence: OFFICIAL (cited in tam-ofw-migration.md)
- **Target B2B: ~2,000 institutions and agencies** managing bulk NC tracking for students/workers — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro: batch NC validity tracking for 100+ workers, bulk re-assessment reminders, OFW documentation status dashboard per applicant, TESDA assessment center integration)

**Professional TAM:** 2,000 × ₱999/mo × 12 = **₱23.98M/year**

---

### Total TAM — L-TES-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~2.025M addressable NC holders | ₱99/mo | ₱240.6M |
| Professional (B2B) | ~2,000 TVET institutions/agencies | ₱999/mo/seat | ₱24.0M |
| **Total TAM** | | | **₱264.6M** |

**SAM (Serviceable):** ₱105.8M — digital-capable NC holders in urban areas + OFW-pipeline workers (Metro Manila, Calabarzon, Central Visayas, Davao); apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱1.06M
**SOM Year 3 (5%):** ₱5.29M

---

## R-BOI-1: BOI/PEZA SCIT vs. EDR Election Analysis Tool

### Consumer Segment

**Who:** Registered investment enterprises (RIEs) under the Corporate Recovery and Tax Incentives for Enterprises Act (CREATE, RA 11534) and its CREATE MORE amendment (RA 12066, signed June 2024), that must make an irrevocable election between: (1) Special Corporate Income Tax (SCIT) at 5% of gross income earned (GIE) — applicable for PEZA locators and other RIEs; or (2) Enhanced Deductions Regime (EDR) — standard corporate income rate (25% or 20% for SMEs) but with enhanced deduction items (200% for labor, R&D, training; 100% accelerated depreciation; etc.). CREATE MORE extended SCIT eligibility to BOI-registered enterprises and renewed the election period. The election is irrevocable for each fiscal year — a bad election costs hundreds of millions of pesos in excessive taxes.

**Population:**

- **PEZA active locator companies: ~4,478–4,587 as of 2019–2020** — Source: Philippine Economic Zone Authority Wikipedia entry (citing PEZA data) — Confidence: OFFICIAL (dated)
- **PEZA projects approved in 2024: 255** — Source: PEZA press release, "PEZA Surpasses 2023 Investments," February 2025 — Confidence: OFFICIAL
- **PEZA ecozone employment (peak 2022): 1,862,000 workers** across locator companies — Source: PEZA data, Wikipedia — Confidence: OFFICIAL
- **BOI projects approved in 2024: ESTIMATED ~400–500** (₱1.62 trillion in approvals in 2024; average project size ~₱3–4 billion each) — Source: BOI press release, "PH Investment Approvals Reach All-Time High of PHP 1.9T, 2024" — Confidence: DERIVED
- **BOI projects approved in 2023: 303** (as of December 18 snapshot; final year count likely ~320) — Source: DTI press release, December 2023 — Confidence: OFFICIAL (near-final)
- **DERIVED total active BOI + PEZA registered firms (2024): ESTIMATED ~15,000–20,000** — DERIVED from: PEZA ~5,000 active locators (2020 baseline + ~255 new/yr) + BOI active registrations (ESTIMATED ~3,000–5,000 enterprises in ITH or post-incentive period, from FOI data patterns) + SBMA + CDC + other IPAs = total ESTIMATED 15,000–20,000 registered investment enterprises with active incentive status — Confidence: ESTIMATED
- **Target for R-BOI-1 (SCIT vs. EDR election):** Only RIEs that (a) have a registered activity generating GIE, (b) are in the election window under CREATE MORE, and (c) have sufficient GIE to make the SCIT vs. EDR comparison material — ESTIMATED ~8,000–12,000 RIEs currently in active incentive periods where the election is applicable — Confidence: ESTIMATED

**Addressable fraction:** 60% — BOI/PEZA-registered companies are formally incorporated entities with finance departments or external advisors; internet-enabled decision-makers; use 60%.

**Addressable consumer population:** 10,000 × 60% = **6,000**

**Current professional cost:** Big 4 accounting firms charge ₱200,000–₱500,000 for a SCIT vs. EDR election analysis engagement (per tool description). Mid-tier local accounting firms charge ₱50,000–₱150,000. The election is high-stakes: a PEZA locator with PHP 500M annual GIE that elects SCIT pays PHP 25M tax; under EDR with effective rate ~10% on adjusted income, tax might be PHP 30M–₱50M — so the right election can save ₱5M–₱25M annually. Yet the choice is made irrevocably each year by mostly gut feel or Big 4 engagement.

**Our consumer price:** ₱2,999/month (sophisticated analysis tool; target is CFOs and tax managers of BOI/PEZA companies; includes NPV calculator, EDR deduction itemization, sensitivity analysis, CREATE MORE amendment tracker)

**Consumer TAM:** 6,000 × ₱2,999/mo × 12 = **₱215.9M/year**

---

### Professional Segment

**Who:** Tax partners and managers at accounting/law firms who advise BOI/PEZA clients on CREATE MORE election. R-BOI-1 at professional tier: multi-client SCIT vs. EDR comparative modeling, integration with client financials, audit-ready election documentation.

**Population:**

- **Big 4 firms in the Philippines:** ~800–1,000 tax professionals at partner/manager/senior level across Deloitte, PwC, EY, KPMG Philippines combined (ESTIMATED; based on each Big 4 having ~100–200 partners and managers in tax) — Confidence: ESTIMATED
- **Top 10 mid-tier accounting firms (SGV, Punongbayan & Araullo, etc.):** ~500 additional tax professionals — Confidence: ESTIMATED
- **Investment incentive-focused boutique law firms:** ~50–100 firms with 2–5 partners each = ~100–300 lawyers — Confidence: ESTIMATED
- **ESTIMATED target professionals: ~2,000** combining Big 4 tax professionals with mid-tier firm partners and investment law boutiques who regularly advise RIEs — Confidence: ESTIMATED

**B2B price per seat:** ₱9,999/month (Enterprise tier: multi-client CREATE MORE election modeling, GIE computation engines, Enhanced Deductions Registry, election outcome documentation, board resolution templates)

**Professional TAM:** 2,000 × ₱9,999/mo × 12 = **₱239.98M/year**

---

### Total TAM — R-BOI-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~6,000 RIEs with election decision | ₱2,999/mo | ₱215.9M |
| Professional (B2B) | ~2,000 Big 4/mid-tier tax advisors | ₱9,999/mo/seat | ₱240.0M |
| **Total TAM** | | | **₱455.9M** |

**SAM (Serviceable):** ₱182.4M — BOI/PEZA-registered companies are heavily concentrated in NCR + CALABARZON + Cebu; Big 4 tax practices are Manila-based; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱1.82M
**SOM Year 3 (5%):** ₱9.12M

*Note: This is a high-ARPU niche tool. Small penetration of the professional market (50 tax firms × ₱9,999/mo × 12 = ₱6.0M/year) could generate meaningful revenue even at low absolute headcount.*

---

## R-BOI-2: BOI ITH Period Calculator + Tax Savings NPV

### Consumer Segment

**Who:** BOI-registered enterprises computing their Income Tax Holiday (ITH) period length and post-ITH incentive regime under CREATE / CREATE MORE. ITH period varies by Tier (Tier I–IV: 4–7 years), location (outside NCR = +1 year), and strategic importance. R-BOI-2 calculates: (a) ITH period start/end dates, (b) tax savings during ITH (CIT saved × ITH years), (c) post-ITH income tax rate trajectory (SCIT or EDR as elected under R-BOI-1), (d) NPV of total incentive package.

**Population:**

- Same BOI/PEZA registered RIE base as R-BOI-1: ESTIMATED ~15,000–20,000 active registered enterprises
- Target for R-BOI-2 (ITH calculator): enterprises in active ITH period or approaching end of ITH — ESTIMATED ~5,000–8,000 (given average ITH of 4–7 years and ~350 new BOI projects/year, the stock of companies within their ITH windows at any time = 350 × 5.5 avg = ~1,925; plus PEZA ITH stock = 5,000 locators × ~50% in active ITH = ~2,500; total ~4,425–5,000) — Confidence: DERIVED
- Addressable: 5,000 RIEs in active ITH × 60% digital adoption = **3,000**

**Our consumer price:** ₱2,999/month (same tier as R-BOI-1; best sold as a bundle with R-BOI-1 as "CREATE MORE Decision Suite")

**Consumer TAM:** 3,000 × ₱2,999/mo × 12 = **₱107.96M/year**

*R-BOI-2 is best sold bundled with R-BOI-1 at the same ₱2,999/mo price. Consumer TAM is not fully additive — treat combined R-BOI-1 + R-BOI-2 as one product with the R-BOI-1 TAM being the better measure. R-BOI-2 adds depth but not a fully separate market.*

---

### Professional Segment

**Who:** Same tax advisors as R-BOI-1. R-BOI-2 is a feature within the R-BOI-1 professional dashboard. **Treat as bundled with R-BOI-1 professional TAM; not additive.**

---

### Total TAM — R-BOI-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct, ITH period) | ~3,000 RIEs in active ITH | ₱2,999/mo | ₱108.0M |
| Professional (B2B) | Bundled within R-BOI-1 | — | — |
| **Total TAM** | | | **₱108.0M** |

**SAM:** ₱43.2M — 40% serviceable.
**SOM Year 1 (1%):** ₱0.43M
**SOM Year 3 (5%):** ₱2.16M

*Combined R-BOI-1 + R-BOI-2 CREATE MORE Suite: total TAM = ₱455.9M (non-additive; R-BOI-2 is a feature within R-BOI-1).*

---

## R-PCAB-1: PCAB ACP Score Calculator & Category Screener

### Consumer Segment

**Who:** PCAB-licensed contractors who need to: (a) calculate their Allowable Contracted Projects (ACP) score — the aggregate limit on simultaneous project values a contractor may hold, computed from net financial contracting capacity (NFCC), experience, and equipment ownership; (b) determine what license category (AAAA/AAA/AA/A/B/C/D/Trade) they qualify for and what Single Largest Project (SLP) value is permitted; (c) evaluate the cost-benefit of upgrading license categories. Government project procurement (DPWH, LGU bidding) requires PCAB license category verification; overbidding the ACP = disqualification from procurement.

**Population:**

- **16,298 unique regular licensed contractors** in 2022 — Source: PCAB Annual Report 2022 (construction.gov.ph, published February 2023) — Confidence: OFFICIAL
- **21,296 regular licenses issued in 2022** (some contractors hold multiple category licenses) — Source: Same PCAB Annual Report 2022 — Confidence: OFFICIAL
- **4,058 special licensed contractors** in 2022 — Source: Same — Confidence: OFFICIAL
- **51,517 total applications processed in 2022** — Source: Same — Confidence: OFFICIAL
- **PHP 390,959,197 income collected from licensing in 2022** (21% increase YoY) — Source: Same — Confidence: OFFICIAL
- **3,029 accredited CPEs (Constructors Performance Evaluators)** in 2022 — Source: Same — Confidence: OFFICIAL
- **Category distribution (2022):** Small (C/D/Trade/E) = 62.6%; Medium (A/B) = 32.1%; Large (AAAA/AAA/AA) = 5.3% — Source: CIAP Statistics, extrapolated from 2016–2017 distribution (last published breakdown); 2022 total licenses applied to same ratio — Confidence: DERIVED (2016 ratio applied to 2022 total)
- No public PCAB Annual Report published for 2023 or 2024 as of early 2025 — Source: construction.gov.ph — Confidence: OFFICIAL (absence confirmed)

**Target for R-PCAB-1:**
- Contractors bidding on government projects (DPWH, LGU, DPWH-attached agencies): all 16,298 licensed contractors are potential users; ACP calculation is required for every bid
- Contractors considering category upgrade (37% of licenses are medium/large): ~6,000 contractors
- Addressable = all active licensed contractors: **~16,000–18,000** (2022 figure + ~10% annual growth in applications = ~17,500 by 2024)

**Addressable fraction:** 55% — PCAB-licensed contractors are formally registered entities; government project bidding requires digital documentation access; use 55% for digital adoption.

**Addressable consumer population:** 17,000 × 55% = **9,350**

**Current professional cost:** PCAB license application and renewal assistance: ₱15,000–₱50,000 per contractor per year (consultants specializing in PCAB documentation, ACP computation, and bid prequalification). The ACP calculation itself (requires NFCC computation from audited financial statements) is time-consuming and error-prone without dedicated tools.

**Our consumer price:** ₱199/month (PCAB ACP calculator: auto-compute NFCC from balance sheet inputs, ACP limit output, category screener for upgrade eligibility, bid limit remaining tracker as projects are awarded)

**Consumer TAM:** 9,350 × ₱199/mo × 12 = **₱22.3M/year**

---

### Professional Segment

**Who:** PCAB consultants, construction industry associations (CIAC, PCCA, PHILCON), and quantity surveyors/project managers who handle PCAB compliance for multiple contractor clients.

**Population:**

- **3,029 accredited CPEs** (Constructors Performance Evaluators) — Source: PCAB Annual Report 2022 — Confidence: OFFICIAL; CPEs are the professional layer adjacent to this tool
- **ESTIMATED ~2,000–3,000 PCAB consultants and construction compliance advisors** — DERIVED from: (a) CIAP's CPE program; (b) construction law practitioners; (c) QS firms serving DPWH bidders — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro: multi-client ACP tracking, category upgrade analysis, bidding capacity dashboard per contractor client)

**Professional TAM:** 2,000 × ₱999/mo × 12 = **₱23.98M/year**

---

### Total TAM — R-PCAB-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~9,350 addressable contractors | ₱199/mo | ₱22.3M |
| Professional (B2B) | ~2,000 PCAB consultants/CPEs | ₱999/mo/seat | ₱24.0M |
| **Total TAM** | | | **₱46.3M** |

**SAM (Serviceable):** ₱18.5M — contractors bidding on national DPWH projects + Metro Manila LGU projects; 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.18M
**SOM Year 3 (5%):** ₱0.92M

---

## T-NPC-1: NPC 72-Hour Breach Notification Protocol

*(Listed as N-NPC-1 in aspects.md; matches T-NPC-1 in the regulatory-atlas ranked shortlist)*

### Consumer Segment

**Who:** Organizations classified as Personal Information Controllers (PICs) or Personal Information Processors (PIPs) under the Data Privacy Act (RA 10173), required to notify the NPC and affected data subjects within 72 hours of discovering a personal data breach. T-NPC-1 provides: (1) breach classification matrix (severe vs. non-severe; notification threshold check); (2) NPC notification form pre-fill using the Data Breach Notification Management System (DBNMS); (3) 72-hour countdown timer from discovery; (4) affected data subject notification template generator.

**Population:**

- **4,307** organizations registered with NPC Registration System (NPCRS) as of end-2023 — Source: NPC PAW 2025 article (privacy.gov.ph, June 2025, citing 2023 year-end figure) — Confidence: OFFICIAL
- **11,524** organizations registered with NPC as of 2025 — Source: NPC PAW 2025 article (privacy.gov.ph, June 2025) — Confidence: OFFICIAL
- **942** total data breach notifications handled by NPC cumulatively from 2022 to mid-2025 — Source: NPC PAW 2025 article — Confidence: OFFICIAL
- **3,538** formal complaints processed cumulatively since 2022 (100% acted upon per NPC) — Source: NPC PAW 2025 article — Confidence: OFFICIAL
- **Mandatory NPC registration threshold:** Organizations with 250+ employees, OR processing sensitive personal information of 1,000+ individuals, OR processing data posing particular risk — Source: NPC Circular 2022-04 (effective January 11, 2023) — Confidence: OFFICIAL
- **PSA 2022 LE establishments with 200+ employees: ESTIMATED ~4,900** (DERIVED: ~0.4% of 1,109,684 formal establishments have 200+ employees, based on PSA 2022 LE size class data showing ~99.6% MSME with <200 employees; 0.4% × 1,109,684 = ~4,439 establishments with 200+ employees) — Confidence: DERIVED
- **Total organizations potentially required to register (processing 1,000+ individuals' data):** significantly broader than the 250-employee threshold; includes BPO firms, hospitals, schools, banks, government agencies, and e-commerce businesses — ESTIMATED ~30,000–50,000 organizations — Confidence: ESTIMATED (NPC itself is pursuing compliance from a much larger universe given the 72-hr enforcement push)
- **Total NPC-registered PICs (compliance-oriented market for T-NPC-1):** use the trajectory — from 4,307 (2023) to 11,524 (2025) suggests exponential growth; projected ~20,000–25,000 by 2026 — Confidence: ESTIMATED

**Addressable fraction:** 80% — Organizations with NPC registration are by definition formally structured entities with IT/compliance infrastructure; internet access is 100% for this segment; use 80% as a high-adoption fraction (20% discount for organizations relying entirely on external counsel).

**Addressable consumer population:** 15,000 (mid-2025 estimate) × 80% = **12,000**

**Current professional cost:** Data privacy counsel (lawyer) charges ₱30,000–₱150,000 per breach notification engagement. DPO-as-a-Service providers (BPO/outsourcing model) charge ₱15,000–₱50,000/month for full DPO outsourcing including breach response. T-NPC-1 is a fraction of this cost.

**Our consumer price:** ₱199/month (breach protocol tool: classification wizard, 72-hr countdown, DBNMS form auto-fill, data subject notification templates, incident log for NPC annual ASIR report)

**Consumer TAM:** 12,000 × ₱199/mo × 12 = **₱28.7M/year**

---

### Professional Segment

**Who:** Data Protection Officers (DPOs) working as compliance consultants for multiple PICs, privacy law firms, and DPO-as-a-Service providers.

**Population:**

- **ESTIMATED ~5,000–8,000 designated DPOs in the Philippines** — DERIVED from: NPC mandates each PIC to designate a DPO; with 11,524 registered organizations and many having shared/external DPOs, the professional market for DPO services is ESTIMATED at 5,000–8,000 individuals — Confidence: ESTIMATED
- **~500–1,000 DPO-as-a-Service providers/privacy law firms** handling multiple PIC clients — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro: multi-organization breach incident management, 72-hr countdown dashboard per organization, DBNMS batch filing, annual ASIR preparation module for all clients)

**Professional TAM:** 750 × ₱999/mo × 12 = **₱8.99M/year**

---

### Total TAM — T-NPC-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~12,000 addressable registered PICs | ₱199/mo | ₱28.7M |
| Professional (B2B) | ~750 DPO service providers | ₱999/mo/seat | ₱9.0M |
| **Total TAM** | | | **₱37.7M** |

**SAM (Serviceable):** ₱15.1M — NCR-concentrated PICs; BPOs (clustered in Metro Manila); apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.15M
**SOM Year 3 (5%):** ₱0.75M

*T-NPC-1 is best positioned as a module within a broader business compliance platform (alongside T-NPC-2 ASIR, T-NPC-3 registration screener). Standalone data breach tool TAM is modest (₱37.7M) but compliance urgency is acute (PhilHealth ₱15M penalty 2024) and grows with NPC registration expansion.*

---

## K-NTC-1: NTC Spectrum User Fee Calculator

*(Listed as R-NTC-1 in aspects.md; matches K-NTC-1 in the regulatory-atlas ranked shortlist)*

### Consumer Segment

**Who:** Philippine organizations that operate NTC-licensed radio communication systems subject to annual Spectrum User Fees (SUF) under NTC Memorandum Circular 06-08-2004 and subsequent amendments. This includes: private LTE/WiMAX networks, VSAT operators, point-to-point microwave links, private radio trunking systems, broadcast stations, maritime and aeronautical communications. The tool computes the annual SUF per frequency assignment by bandwidth, frequency band, and service type — enabling budget planning and renewal compliance.

**Population:**

- **Total mobile subscribers (Philippines 2024): ~133 million** — Source: Operator data (Smart ~60M, Globe ~60M, DITO ~13M; BuddeComm Philippines Telecoms Report 2024) — Confidence: ESTIMATED (derived from operator annual reports)
- **Fixed broadband subscribers (2023): 7,510,000** — Source: World Bank data (derived from NTC) — Confidence: OFFICIAL
- **NTC-licensed telco operators holding CPCN:** Dozens; the 2018 list (last publicly indexed version at ntc.gov.ph) covers local exchange, inter-exchange, international gateway, cellular, satellite service categories — Source: NTC website, 2018 PDF — Confidence: OFFICIAL (dated)
- **NTC Spectrum User Fee target population (K-NTC-1's specific market):** Organizations holding NTC radio station licenses (NOT the 133M consumer SIM users, who pay SUF indirectly through carrier fees):
  - Private business radio licensees: companies operating private point-to-point links, VSAT, repeater networks (mining companies, plantations, shipping companies, construction firms, government agencies with private networks)
  - Broadcast stations: AM/FM/TV stations licensed by NTC (estimated ~700–900 total active broadcast stations per NTC annual report data cited in media trade press)
  - ISPs with radio backhaul licenses: ~300–500 ISPs with NTC COR holding spectrum licenses for wireless backhaul
  - VSAT operators and maritime communication stations
  - ESTIMATED total NTC spectrum license holders (private/commercial, excluding the 3 major telcos): **~5,000–8,000 license holders** — Confidence: ESTIMATED (NTC does not publish the total count publicly; the full licensed station registry requires an FOI; this is estimated from media trade data and NTC fee collection patterns)

**Addressable fraction:** 70% — Spectrum license holders are technically sophisticated organizations with digital capabilities; use 70%.

**Addressable consumer population:** 6,000 × 70% = **4,200**

**Our consumer price:** ₱199/month (spectrum fee calculator: enter frequency assignment details, output annual SUF per station per frequency, multi-station SUF portfolio total, renewal due date tracker)

**Consumer TAM:** 4,200 × ₱199/mo × 12 = **₱10.0M/year**

---

### Professional Segment

**Who:** NTC-accredited telecommunications engineers and frequency management consultants who design private radio networks and handle SUF compliance for clients.

**Population:**

- **PRC-registered Electronics Engineers:** ~30,000–40,000 total registered (PRC board data; cited in PRC bulletin) — Confidence: OFFICIAL
- **ESTIMATED ~1,500–2,500 actively practicing telecom/frequency management consultants** — DERIVED from: subset of electronics engineers + licensed professional engineers who specialize in NTC licensing work — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (multi-client spectrum portfolio management, NTC frequency assignment database, SUF computation per client station, renewal compliance calendar)

**Professional TAM:** 2,000 × ₱999/mo × 12 = **₱23.98M/year**

---

### Total TAM — K-NTC-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~4,200 addressable spectrum license holders | ₱199/mo | ₱10.0M |
| Professional (B2B) | ~2,000 telecom engineers/consultants | ₱999/mo/seat | ₱24.0M |
| **Total TAM** | | | **₱34.0M** |

**SAM (Serviceable):** ₱13.6M — spectrum license holders cluster in urban industrial areas + media companies + mining operations; 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.14M
**SOM Year 3 (5%):** ₱0.68M

*K-NTC-1 is a highly specialized niche tool. Small absolute TAM (₱34M) but near-zero competition and a fully deterministic computation (all fee schedules are published in NTC MCs). Best positioned as an enterprise module within a broader regulatory compliance platform.*

---

## Cluster Total TAM — Regulatory Specialty

### Summary by Tool

| Tool | Consumer TAM | Professional TAM | Total TAM | SAM | SOM Y1 | SOM Y3 |
|------|-------------|-----------------|-----------|-----|--------|--------|
| P-IPO-1 | ₱100.3M | ₱54.0M | ₱154.3M | ₱61.7M | ₱0.62M | ₱3.08M |
| P-IPO-2 | ₱4.9M | ₱0 (bundled) | ₱4.9M | ₱2.0M | ₱0.02M | ₱0.10M |
| Q-ERC-1 | ₱472.9M | ₱119.9M | ₱592.8M | ₱237.1M | ₱2.37M | ₱11.85M |
| S-BSP-1 | ₱23.8M | ₱17.1M | ₱40.9M | ₱16.4M | ₱0.16M | ₱0.82M |
| M-FDA-1 | ₱144.4M | ₱41.9M | ₱186.3M | ₱74.5M | ₱0.75M | ₱3.72M |
| M-FDA-2 | ₱39.4M | ₱0 (bundled) | ₱39.4M | ₱15.8M | ₱0.16M | ₱0.79M |
| L-TES-1 | ₱240.6M | ₱24.0M | ₱264.6M | ₱105.8M | ₱1.06M | ₱5.29M |
| R-BOI-1 | ₱215.9M | ₱240.0M | ₱455.9M | ₱182.4M | ₱1.82M | ₱9.12M |
| R-BOI-2 | ₱108.0M | ₱0 (bundled) | ₱108.0M | ₱43.2M | ₱0.43M | ₱2.16M |
| R-PCAB-1 | ₱22.3M | ₱24.0M | ₱46.3M | ₱18.5M | ₱0.18M | ₱0.92M |
| T-NPC-1 | ₱28.7M | ₱9.0M | ₱37.7M | ₱15.1M | ₱0.15M | ₱0.75M |
| K-NTC-1 | ₱10.0M | ₱24.0M | ₱34.0M | ₱13.6M | ₱0.14M | ₱0.68M |
| **CLUSTER TOTAL** | **₱1,411.3M** | **₱553.9M** | **₱1,965.2M** | **₱786.1M** | **₱7.86M** | **₱39.28M** |

*Note: P-IPO-2 and M-FDA-2 are bundled features; R-BOI-2 is bundled with R-BOI-1. Actual non-overlapping cluster TAM = ₱1,965.2M less bundled tools = effectively ₱1,812.9M if P-IPO-2/M-FDA-2/R-BOI-2 are excluded as standalone products.*

---

### Revenue Priority Ranking Within Cluster

1. **Q-ERC-1 Consumer (₱472.9M)** — Largest consumer population (1.98M commercial/high-bill consumers); high digital adoption; electricity bill pain is universal and monthly; clear "found money" moment
2. **R-BOI-1 Professional (₱240.0M)** — Enterprise pricing (₱9,999/mo); Big 4 displacement play; small number of professionals but enormous deal size; highest ARPU in the cluster
3. **L-TES-1 Consumer (₱240.6M)** — 2M+ NC holders with annual expiry risk; OFW documentation chain creates acute pain; mass market
4. **R-BOI-1 Consumer (₱215.9M)** — CFO-level tool at ₱2,999/mo; irrevocable election stakes ensure willingness-to-pay; self-selects for highest-intent users
5. **Q-ERC-1 Professional (₱119.9M)** — Energy managers at scale; RA 11285 DEM mandate creates institutional purchase requirement
6. **R-BOI-2 Consumer (₱108.0M)** — Bundled with R-BOI-1 CREATE MORE Suite; additive depth not standalone revenue
7. **P-IPO-1 Consumer (₱100.3M)** — 42K trademark portfolio holders; IP firm retainer displacement; moderate absolute market but very low competition from local tools
8. **M-FDA-1 Consumer (₱144.4M)** — 60K FDA-regulated businesses; recurring compliance pain; large addressable population
9. **M-FDA-1 Professional (₱41.9M)** — 3.5K regulatory affairs consultants; B2B SaaS with sticky client relationships
10. **P-IPO-1 Professional (₱54.0M)** — IP law practitioners at ₱2,999/mo; specialized but high-value niche

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| IPOPHL trademark applications 2023: 41,953 | IPOPHL press release "2023 IP Filings Jump 2.5%" | 2024 | OFFICIAL |
| IPOPHL trademark applications 2024: 44,216 | WIPO Annual Technical Report ATR/TM/2024/PH | 2025 | OFFICIAL |
| IPOPHL trademark registrations granted 2023: 30,866 | WIPO ATR/TM/2024/PH | 2025 | OFFICIAL |
| IPOPHL trademark registrations granted 2024: 31,869 | WIPO ATR/TM/2024/PH | 2025 | OFFICIAL |
| IPOPHL patent applications 2023: 4,544 | WIPO ATR/PI/2023/PH | 2024 | OFFICIAL |
| IPOPHL utility model applications 2023: 1,847 (+24% YoY) | WIPO ATR/PI/2023/PH | 2024 | OFFICIAL |
| IPOPHL industrial design applications 2023: 1,488 (+20% YoY) | WIPO ATR/PI/2023/PH | 2024 | OFFICIAL |
| IPOPHL formal trademark agent recognition system: launched Aug 22, 2024 | IPOPHL MC 2024-012/013; IPOPHL press release | 2024 | OFFICIAL |
| Meralco customer accounts 2023: 7.8 million | Meralco 2023 Annual Report | 2024 | OFFICIAL |
| Meralco customer accounts 2024: 8.04 million | Meralco 2024 data | 2025 | OFFICIAL |
| Total Philippine electricity consumers ~28M | NEA/ERC synthesis; NEA 2024 Annual Report | 2024 | ESTIMATED |
| NEA EC consumer connections (Dec 2021): 14,835,390 | Manila Bulletin citing NEA, March 2022 | 2022 | OFFICIAL |
| ERC Certificates of Compliance (COCs) issued 2023: 4,124 qualified end-users | BusinessWorld citing ERC data, June 2024 | 2024 | OFFICIAL |
| BSP pawnshop offices June 2024: 16,219 total | Philstar citing BSP press release | Nov 2024 | OFFICIAL |
| BSP pawnshop head offices June 2024: 1,169 | Same BSP data | Nov 2024 | OFFICIAL |
| BSP pawnshop branches June 2024: 15,050 | Same BSP data | Nov 2024 | OFFICIAL |
| BSP pawnshop supervised operators end-2024: 1,428 | BSP supervisory data | End-2024 | OFFICIAL |
| Pawnshops in 83.3% of LGUs | BSP press release Q1 2022, cited by PNA | 2022 | OFFICIAL |
| BSP pledge loans outstanding: PHP 54.5 billion | BSP Governor Diokno press statement; PNA 2022 | End-2021 | OFFICIAL (dated) |
| BSP FIS 2021: 34% of adults borrowed money | BSP 2021 Financial Inclusion Survey | 2021 | OFFICIAL |
| TESDA certified workers 2023: 872,016 | PNA citing TESDA; SEA-VET.net | Dec 2023 | OFFICIAL |
| TESDA workers assessed 2023: 935,978 | Same sources | Dec 2023 | OFFICIAL |
| TESDA TVET graduates 2023: 1,222,330 | Same sources | Dec 2023 | OFFICIAL |
| TESDA certification rate 2023: 93% | Same sources | Dec 2023 | OFFICIAL |
| BOI investment approvals 2023: PHP 1.26 trillion | BOI official press release | End-2023 | OFFICIAL |
| BOI projects approved Dec 18, 2023 snapshot: 303 | DTI press release | Dec 2023 | OFFICIAL |
| BOI investment approvals 2024: PHP 1.62 trillion | BOI press release "PH All-Time High PHP 1.9T" | 2025 | OFFICIAL |
| PEZA active locators ~4,478–4,587 | Philippine Economic Zone Authority (Wikipedia citing PEZA) | 2019–2020 | OFFICIAL (dated) |
| PEZA projects approved 2023: 233 | PEZA press release | 2024 | OFFICIAL |
| PEZA projects approved 2024: 255 | PEZA press release | 2025 | OFFICIAL |
| PCAB regular licensed contractors 2022: 16,298 | PCAB Annual Report 2022 (construction.gov.ph) | Feb 2023 | OFFICIAL |
| PCAB regular licenses issued 2022: 21,296 | Same | Feb 2023 | OFFICIAL |
| PCAB special licensed contractors 2022: 4,058 | Same | Feb 2023 | OFFICIAL |
| PCAB total applications processed 2022: 51,517 | Same | Feb 2023 | OFFICIAL |
| PCAB accredited CPEs 2022: 3,029 | Same | Feb 2023 | OFFICIAL |
| NPC-registered organizations (NPCRS) 2023: 4,307 | NPC PAW 2025 article (privacy.gov.ph) | 2025 | OFFICIAL |
| NPC-registered organizations 2025: 11,524 | Same NPC PAW 2025 article | 2025 | OFFICIAL |
| NPC breach notifications handled (cumulative 2022–2025): 942 | Same NPC PAW 2025 article | 2025 | OFFICIAL |
| NPC formal complaints processed (since 2022): 3,538 | Same NPC PAW 2025 article | 2025 | OFFICIAL |
| NPC Circular 2022-04 mandatory registration threshold | NPC Circular 2022-04 (effective Jan 11, 2023) | 2023 | OFFICIAL |
| Philippines mobile subscribers 2024: ~133M | BuddeComm 2024; operator annual reports | 2024 | ESTIMATED |
| Philippines fixed broadband subscribers 2023: 7,510,000 | World Bank data (NTC-derived) | 2023 | OFFICIAL |

---

## Notes & Caveats

1. **FDA population gap:** The single most significant data gap in this cluster is the FDA LTO holder count. The FDA Annual Report 2023 (fda.gov.ph/wp-content/uploads/2024/05/FDA-Annual-Report-2023.pdf) contains the authoritative figure but the PDF binary could not be scraped by web tools. The ~80,000–100,000 LTO holder estimate is derived from the 2019 baseline (~71,000 per FDA press citations) adjusted for post-COVID regulatory activity, the 2023 medical device retailer LTO wave (FDA Circular 2021-021 deadline December 18, 2023), and CAGR. A direct PDF download and text extraction would convert this from ESTIMATED to OFFICIAL.

2. **PEZA locator count staleness:** The most recent publicly indexed PEZA active locator total is from 2019–2020 (4,478–4,587). PEZA reports annual approvals (255 in 2024) but does not publish the cumulative "stock of active locators" in press releases. The full locator database is behind a portal login (PEZA CPIS). An FOI request (foi.gov.ph/agencies/peza) or the PEZA CPIS portal would provide the 2024 figure; use is ESTIMATED ~5,000 for 2024 pending confirmation.

3. **TESDA NC level breakdown unavailable:** TESDA annual certifications (872K in 2023) are not publicly broken down by NC level (NC I vs. NC II vs. NC III vs. NC IV) in accessible web-indexed sources. The 2023 Annual TVET Statistics PDF (tesda.gov.ph) contains Tables 9–12 with this breakdown, but the PDF was binary-encoded and not extractable via web tools. NC II dominates by all available proxy indicators (OFW deployment requirements, job market demand, sector mix). For L-TES-1 TAM purposes, the total certified worker count (872K/yr) is the appropriate addressable flow; the level breakdown affects the 2-year vs. 5-year validity calculation but not the total market size materially.

4. **BOI "active registrations" vs. annual approvals:** BOI reports annual investment pledges/approvals (303 projects in 2023, ~400+ in 2024) but does not publish a cumulative "stock of active BOI registrations" in indexed annual reports. The ITH benefit period is 4–7 years per tier, implying that at any given time, ~1,500–3,000 BOI-registered enterprises are within their ITH window. The full active registration list requires an FOI request or access to the BOI BIGRS (BOI Investment and Growth Reporting System). PEZA CPIS (login required) has the complete PEZA locator list. Both are confirmed to exist but require portal access or FOI.

5. **NPC registration growth trajectory:** The NPC registration base grew from 4,307 (end-2023) to 11,524 (mid-2025) — a 168% increase in ~18 months. This rapid growth reflects NPC's enforcement push (show cause orders, PhilHealth ₱15M penalty). Projecting forward, the market for T-NPC-1 is in strong growth and the 12,000 addressable figure used here is conservative.

6. **Q-ERC-1 consumer size caution:** The "~28 million electricity consumers" figure is a synthesis estimate, not a single official publication. The authoritative sources are: (a) NEA's consumer connections data (14.84M as of Dec 2021 for ECs; likely 16M+ by 2024 given 16-millionth connection milestone reported in 2024); (b) Meralco's 8.04M accounts (2024); (c) private distribution utilities (~1.5–2M additional accounts). The sum = ~25.5–26M consumer accounts; the "28M" figure in media sources likely includes government and common area meters. Use 25.5M as a more conservative total consumer account count without changing the addressable TAM significantly (the tool targets commercial/industrial + high-bill residential, estimated at 3.6M regardless of the precise national total).

7. **K-NTC-1 NTC spectrum license holder count:** NTC does not publish the total number of private spectrum license holders in summary form. The most recent public list (2018 CPCN list) covers major telcos. The ~5,000–8,000 private license holder estimate for organizations with radio station licenses (excluding consumer SIM cards) is triangulated from: NTC annual fee collection data (discussed in NTC budget documents), industry estimates from the Philippine Electronics & Communications Association, and the fee schedule's applicability (only organizations operating their own frequency assignments, not SIM users). An FOI request to NTC for "List of Radio Station Licensees with Active Radio Station License as of December 31, 2024" would provide the definitive count.

8. **P-IPO-2 bundling note:** P-IPO-2 (Trademark Fee Calculator) should not be built as a separate product. It is a feature within P-IPO-1 (IP Portfolio Dashboard). The P-IPO-2 consumer TAM (₱4.9M/year from new applicants) is a funnel flow into P-IPO-1's ongoing subscription revenue, not an independent revenue stream. All IP portfolio revenue should be attributed to P-IPO-1.

9. **Category distribution gap for PCAB:** The 62.6% small / 32.1% medium / 5.3% large distribution is from the CIAP CFY 2016–2017 data. PCAB 2022 Annual Report published total license counts but not a current category breakdown table. The 2022 distribution is assumed to be similar to 2017 given the construction industry's structure. PCAB Annual Reports for 2023–2024 have not been posted to construction.gov.ph as of March 2025.
