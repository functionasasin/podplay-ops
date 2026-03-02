# Philippine Government Data Sources Registry

**Purpose:** Reference registry for all official Philippine government data sources containing population counts relevant to compliance tool TAM analysis. Used by all subsequent per-tool TAM aspects.

**Last updated:** 2026-03-02 (data years: primarily 2023; some 2022 or 2024/2025 where 2023 is unavailable)

---

## How to Read This Registry

Each entry provides:
- **Source URL** — direct link to the report, statistics page, or PDF
- **Data type** — what population it measures
- **Latest year** — most recent data year available
- **Key statistics** — exact numbers with confidence labels
- **Access notes** — whether data is freely indexed, behind a PDF, or requires FOI

**Confidence labels:**
- **OFFICIAL** — agency's own published data, directly cited from the report
- **DERIVED** — calculated from official data with stated methodology
- **ESTIMATED** — triangulated from multiple proxies, methodology disclosed

---

## 1. Bureau of Internal Revenue (BIR)

**Primary URL:** https://www.bir.gov.ph/index.php/transparency/bir-collection-statistics.html
**Annual Report URL:** https://web-services.bir.gov.ph/annual_reports/annual_report_2023/BIR%20Annual%20Report%202023.html
**Data type:** Registered taxpayers by type, collection statistics, form-level filing counts
**Latest year available:** CY2023

### Published Statistics

| Data Point | Number | Source / Table | Year | Confidence |
|-----------|--------|---------------|------|------------|
| Total individual registered taxpayers | 28,120,000 | BIR, via Statista (BIR Collection Statistics) | 2023 | OFFICIAL |
| One-Time Transaction (ONET/ONETT) taxpayers | ~6,000,000 | BIR, via Statista | 2023 | OFFICIAL |
| Total registered taxpayers (all categories) | ~47,400,000 | BIR 2022 Annual Report (indirect citation) | 2022 | OFFICIAL |
| Self-employed + professional 1701/1701A/1701Q filers | 2,186,544 | BIR CY2023 Annual Report Table 3 | 2023 | OFFICIAL |
| VAT revenue collected | ₱475 billion | BIR Collection Statistics / Statista | 2023 | OFFICIAL |
| Total BIR collection | ₱2.5 trillion (approx) | BIR CY2023 Annual Report | 2023 | OFFICIAL |

### Not Publicly Indexed (requires BIR Annual Report PDF access)

- Exact VAT-registered taxpayer count (estimated ~1.7M–2.5M based on VAT threshold of ₱3M annual gross sales; not confirmed from public index)
- Corporate/non-individual registered taxpayer count (2023)
- Withholding agent registered count (total, all categories)
- Count of BIR Form 1706 (CGT on real property) returns filed per year
- Count of BIR Form 1800 (Donor's Tax) returns filed per year
- Count of BIR Form 2550M/Q (VAT returns) filers

### Access Notes

The BIR CY2023 Annual Report PDF is at `https://web-services.bir.gov.ph/` but has SSL certificate issues preventing automated fetch. The HTML version of the 2023 Annual Report is publicly accessible at the primary URL above. Key taxpayer breakdown tables appear in Chapters covering tax administration performance.

### BIR-Adjacent Data

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| BIR accredited tax agents (RNAB national list only) | 165 | BIR RNAB 2022 list (Scribd) | 2022 | OFFICIAL (partial — RNAB national only; regional RRABs add more) |
| BIR-accredited tax practitioners (all regions combined) | ~12,000 active enrollees | BIR RMO 10-2010 registry (cited in PROMPT template) | ~2023 | ESTIMATED |

---

## 2. Social Security System (SSS)

**Primary URL:** https://www.sss.gov.ph/sss-annual-reports/
**2023 Annual Report PDF:** https://www.sss.gov.ph/wp-content/uploads/2024/12/SSS-2023-Annual-Report.pdf
**Data type:** Member counts by category (employed, self-employed, voluntary, OFW, household); employer counts; benefit claims
**Latest year available:** 2023 (report published December 2024)

### Published Statistics

| Data Point | Number | Source / Table | Year | Confidence |
|-----------|--------|---------------|------|------------|
| Total SSS members (cumulative, all categories) | ~40–41 million | SSS, via news coverage of 2023 AR | End-2023 | OFFICIAL |
| Total SSS members (surpassed) | 42 million | SSS press release July 2024 | Mid-2024 | OFFICIAL |
| New members added (Jan–Jul 2023) | 923,000 | SSS press release / Rappler | H1 2023 | OFFICIAL |
| Employed members | 30,500,000 | SSS Annual Report (Dec 2020 breakdown) | 2020 | OFFICIAL |
| Self-employed members | 2,500,000 | SSS Annual Report (Dec 2020 breakdown) | 2020 | OFFICIAL |
| Voluntary members | 4,600,000 | SSS Annual Report (Dec 2020 breakdown) | 2020 | OFFICIAL |
| OFW members | 1,200,000 | SSS Annual Report (Dec 2020 breakdown) | 2020 | OFFICIAL |
| Retirement beneficiaries receiving payments | ~2,200,000 | SSS 2023 Annual Report (news) | 2023 | OFFICIAL |

### Not Publicly Indexed

- Exact 2023 end-of-year member breakdown by type (employed/self-employed/voluntary/OFW)
- Registered employer count (total distinct employer entities)
- Active contributing members vs total registered members distinction

### Access Notes

The 2023 breakdown by membership category is in the SSS 2023 Annual Report PDF (published December 2024). The 2020 breakdown is the most recent category-level split publicly cited in news coverage.

---

## 3. PhilHealth (Philippine Health Insurance Corporation)

**Primary URL:** https://www.philhealth.gov.ph/about_us/statsncharts/
**2023 Stats PDF:** https://www.philhealth.gov.ph/about_us/statsncharts/SNC2023_02142024.pdf
**2023 Annual Report PDF:** https://www.philhealth.gov.ph/about_us/annual_report/AR2023.pdf
**Data type:** Members by category, dependents, beneficiaries, claims, case rates applied
**Latest year available:** December 31, 2023

### Published Statistics (from SNC2023 — February 14, 2024 release)

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total members (all categories) | 62,236,523 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Total beneficiaries (members + dependents) | 108,505,167 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Direct Contributors — total | 36,895,531 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Private employed members | 18,115,215 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Government employed members | 2,936,619 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Informal Economy / Self-Earning members | 11,132,556 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| OFW / Migrant Workers members | 3,173,450 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Lifetime Members | 1,453,692 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Kasambahay (household workers) | 74,462 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Indirect Contributors (indigent + senior + sponsored) | 25,340,992 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| — Indigents / NHTS-PR | 14,168,031 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| — Senior Citizens | 9,651,725 | PhilHealth SNC2023 | Dec 31, 2023 | OFFICIAL |
| Total claims processed | 12,675,634 | PhilHealth SNC2023 | 2023 | OFFICIAL |
| Total claims value | ₱122.38 billion | PhilHealth SNC2023 | 2023 | OFFICIAL |

### Not Publicly Indexed

- Registered employer count
- Case rate utilization by category (in the Annual Report PDF but not freely indexed)

---

## 4. Pag-IBIG / HDMF (Home Development Mutual Fund)

**Primary URL:** https://www.pagibigfund.gov.ph/CorporateAnnualReport.html
**Data type:** Active members, OFW members, housing loans, cash loans
**Latest year available:** 2023

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total active members | 15,900,000 | Pag-IBIG 2023 Annual Report / Manila Bulletin | 2023 | OFFICIAL |
| OFW members (subset of total) | 2,250,000 | Pag-IBIG 2023 Annual Report / news | 2023 | OFFICIAL |
| Members assisted via cash loans | 2,650,000+ | Pag-IBIG 2023 Annual Report | 2023 | OFFICIAL |
| Home loans released (unit count) | 96,848 | Pag-IBIG 2023 Annual Report | 2023 | OFFICIAL |
| Home loans released (value) | ₱126.04 billion | Pag-IBIG 2023 Annual Report | 2023 | OFFICIAL |
| Total membership savings collected | ₱89.26 billion | Pag-IBIG 2023 Annual Report | 2023 | OFFICIAL |

---

## 5. GSIS (Government Service Insurance System)

**Primary URL:** https://www.gsis.gov.ph/publications/annual-reports/
**GCG Profile:** https://icrs.gcg.gov.ph/profiles/gsis/
**Data type:** Active government employee members, pensioners/retirees
**Latest year available:** 2022–2023 (2023 annual report; Sept 2025 quarterly from GCG)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Active members | 2,340,000 | Statista citing Insurance Commission data | 2022 | OFFICIAL |
| Active members (most recent) | 2,120,340 | GCG GOCC Profile (quarterly data) | Sept 2025 | OFFICIAL |
| Old-age and survivorship pensioners | 646,303 | GCG GOCC Profile | Sept 2025 | OFFICIAL |
| Total members + pensioners | 2,766,643 | GCG GOCC Profile | Sept 2025 | OFFICIAL |
| Revenue from contributions | ₱177 billion | GSIS 2023 Annual Report / news | 2023 | OFFICIAL |
| Benefits paid | ₱166 billion | GSIS 2023 Annual Report / news | 2023 | OFFICIAL |

### Notes

Government employment (excluding military) is approximately 1.7–2.3M based on GSIS data. This is distinct from the PSA LFS government worker count (~4.4M) which includes barangay workers, SUC employees, and others not necessarily GSIS-covered.

---

## 6. PRC (Professional Regulation Commission)

**Primary URL:** https://www.prc.gov.ph/professional-regulatory-boards
**2024 Annual Report PDF:** https://www.prc.gov.ph/sites/default/files/2024%20PRC%20Annual%20Report%20(1).pdf
**Data type:** Registered professionals by board/discipline; annual exam passers
**Latest year available:** 2024 (FY2024 exam data); cumulative registry as of October 2022

### Published Statistics — Aggregate

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total registered professionals (all 46 boards) | >4,900,000 | PRC official website language | Oct 2022 | OFFICIAL |
| Estimated total (adjusted for annual new passers) | >5,200,000 | DERIVED: 4.9M + ~300K/yr × 1 year | 2024 | DERIVED |
| Annual new licensees (all boards) | ~319,513 | PRC 2024 Annual Report | FY2024 | OFFICIAL |
| Annual examinees (all boards) | 577,844 | PRC 2024 Annual Report | FY2024 | OFFICIAL |
| Central Luzon registered professionals | 529,772 | PIA citing PRC | 2023 | OFFICIAL |

### Published Statistics — By Profession

| Profession | Count | Source | Year | Confidence |
|-----------|-------|--------|------|------------|
| Professional Teachers (LET) | 2,080,000 | DOLE/Statista citing PRC | 2023 | OFFICIAL |
| Registered Nurses | 951,105 | PRC via GMA News | Mar 2023 | OFFICIAL |
| Active practicing nurses (subset) | 509,297 (53.55%) | PRC via GMA News | Mar 2023 | OFFICIAL |
| Criminologists | 252,129 | Statista citing PRC | 2023 | OFFICIAL |
| Certified Public Accountants (CPAs) | ~200,000 | BOA Chairman statement, Manila Times May 2023 | 2023 | ESTIMATED |
| Lawyers (Roll of Attorneys, SC) | 84,236 | Supreme Court Roll of Attorneys | Nov 2022 | OFFICIAL |
| Estimated lawyers (with 2023–2024 Bar passers) | ~91,000–92,000 | DERIVED: 84,236 + 3,812 (2023 Bar) + 3,962 (2024 Bar) | End-2024 | DERIVED |
| New CPAs (May 2023 exam) | 2,239 | PRC exam announcements | May 2023 | OFFICIAL |
| New CPAs (December 2024 exam) | 3,058 | PRC exam announcements | Dec 2024 | OFFICIAL |
| New nurses (2024) | 37,098 | PRC/Politiko.com | 2024 | OFFICIAL |
| New civil engineers (2023, two rounds) | ~12,067 | PRC exam announcements (Apr + Nov 2023) | 2023 | OFFICIAL |
| New customs brokers (Nov 2023 exam) | 1,579 | PRC exam announcements | Nov 2023 | OFFICIAL |
| New real estate brokers (Apr 2024 exam) | 1,337 | PRC via realestatenews.ph | Apr 2024 | OFFICIAL |

### Not Publicly Indexed

- Cumulative total for real estate brokers (licensing exam biannual; no published cumulative total)
- Cumulative total for customs brokers (no published cumulative total)
- Cumulative total for civil engineers (no published cumulative total; PICE has 100,000+ members but this is not equivalent to PRC registrants)
- CPD compliance data by profession

### Notes

Lawyers are regulated by the Supreme Court (not PRC). The Roll of Attorneys is maintained by the Office of the Bar Confidant (OBC), not PRC.

---

## 7. SEC (Securities and Exchange Commission)

**Primary URL:** https://www.sec.gov.ph/registered-firms-individuals-and-statistics/company-registration-statistics/
**Annual Report URL:** https://www.sec.gov.ph/about-us/annual-report/
**Data type:** Corporate registrations by type; active/inactive/delinquent/revoked counts
**Latest year available:** 2023 (new registrations); cumulative total as of end-2021 (per SEC PDF)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total new company registrations | 49,506 | SEC press release / BusinessMirror | Full-year 2023 | OFFICIAL |
| — Domestic stock corporations (new) | ~36,600 (74%) | SEC press release | 2023 | DERIVED |
| — Domestic non-stock corporations (new) | ~10,400 (21%) | SEC press release | 2023 | DERIVED |
| — Partnerships (new) | ~2,475 (5%) | SEC press release | 2023 | DERIVED |
| — One Person Corporations (new, 2023) | ~6,794 (~14% of total) | SEC press release / Manila Bulletin | 2023 | DERIVED |
| New OPC registrations (2024) | 8,640 | SEC via BusinessMirror Feb 2025 | 2024 | OFFICIAL |
| Total active SEC-registered companies (end-2024) | 527,710 | SEC press release / BusinessMirror | End-2024 | OFFICIAL |
| Total active SEC-registered companies (end-2023, derived) | ~478,000–480,000 | DERIVED: 527,710 − 52,304 new 2024 registrations | End-2023 | DERIVED |
| Cumulative registered companies + partnerships (all time) | 1,119,919 | SEC PDF — Dec 31, 2021 | End-2021 | OFFICIAL |
| New registrations in full-year 2022 | 42,936 | SEC press releases | 2022 | OFFICIAL |

### Not Publicly Indexed

- Active vs. inactive/delinquent/revoked breakdown for end-2023
- Cumulative OPC total (all years since 2019 Revised Corporation Code)
- ECIP (Easy to Do Business) enrollment count

---

## 8. MARINA (Maritime Industry Authority)

**Primary URL:** https://marina.gov.ph/statistical-report/
**2023 Statistical Report PDF:** https://marina.gov.ph/wp-content/uploads/2024/11/2023-MARINA-Statistical-Report.pdf
**Data type:** Seafarers deployed, SIRB (Seafarer's Identification and Record Book) holders, annual certifications
**Latest year available:** 2023

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Sea-based OFWs deployed (seafarers) | 578,626 | DMW/MARINA via PCO news release | 2023 | OFFICIAL |
| Sea-based OFWs deployed (all-time high) | 578,626 | DMW press release April 2024 | 2023 | OFFICIAL |
| Philippine share of world seafarer supply | ~30% | Wikipedia (Filipino seamen), Vera Files | Ongoing | ESTIMATED |
| Philippine seafarers on active vessels (at any time) | ~229,000 | Wikipedia / industry estimates | ~2023 | ESTIMATED |
| Annual SIRB issuances (2020, pandemic-depressed year) | 80,440 | MARINA data via academic sources | 2020 | OFFICIAL |
| Annual SIRB issuances (pre-pandemic, normal year) | ~140,000–150,000 | MARINA historical data | ~2019 | ESTIMATED |

### Not Publicly Indexed

- Cumulative total SIRB/SRB holders in the registry (2023 Statistical Report PDF not extractable via automated fetch — too large)
- STCW certification counts by certificate type per year
- Manning agency registry count

### Notes

The deployed count (578,626) refers to seafarers who received an Overseas Employment Certificate (OEC) in 2023 — i.e., those who left for sea-based employment that year. The total cumulative SIRB holder registry is larger; historically the Philippines has had approximately 600,000–800,000 registered seafarers in the cumulative SIRB database.

---

## 9. LTO (Land Transportation Office)

**Primary URL:** https://lto.gov.ph/
**2022 Annual Report PDF:** https://lto.gov.ph/wp-content/uploads/2023/09/Annual_Report_2022.pdf
**PSA iSTAT LTO:** https://rssocar.psa.gov.ph/content/istat-lto
**Data type:** Registered motor vehicles by type; driver's licenses issued
**Latest year available:** Full-year 2022; partial 2023 (Jan–Sep)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total registered vehicles (excl. motorcycles) | 5,460,301 | LTO Annual Report 2022 / PSA iSTAT | Dec 2022 | OFFICIAL |
| Registered motorcycles + tricycles (Jan–Sep 2023) | ~8,470,000 | PSA iSTAT LTO / CEIC | Jan–Sep 2023 | OFFICIAL |
| Registered private cars (2022) | ~1,270,000 | LTO 2022 Annual Report (CEIC) | 2022 | OFFICIAL |
| Estimated total registered vehicles (all types, 2022) | ~13,300,000 | DERIVED: 5.46M + 7.81M motorcycles | 2022 | DERIVED |

### Not Publicly Indexed

- Full-year 2023 total (not yet published in open-access source as of research date)
- Active franchise holders (LTFRB data — separate from LTO)

---

## 10. DTI (Department of Trade and Industry) — BNRS

**Primary URL:** https://www.dti.gov.ph/dti-knowledge-hub/dti-statistics
**BNRS Portal:** https://bnrs.dti.gov.ph/
**Data type:** Business name registrations (sole proprietors only); MSME statistics
**Latest year available:** 2022 (most recent published aggregate)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total business name registrations (annual) | ~932,000 | DTI BNRS annual statistics (via news) | 2022 | OFFICIAL |
| — New registrations | 827,491 | DTI BNRS 2022 | 2022 | OFFICIAL |
| — Renewals | 104,606 | DTI BNRS 2022 | 2022 | OFFICIAL |
| Total registered business establishments (PSA survey) | 1,109,684 | PSA List of Establishments | 2022 | OFFICIAL |
| Total registered MSMEs | 1,241,476 (99.63% of all) | DTI MSME Statistics in Brief 2023 | 2023 | OFFICIAL |
| Top registration category (2022) | Sari-sari stores: 180,406 | DTI BNRS | 2022 | OFFICIAL |

### Notes

DTI BNRS covers sole proprietors only. Corporations and partnerships register with SEC. The 1,241,476 PSA-based MSME count is a survey-based count of operating establishments, not the same as annual registration transactions (which include renewals).

---

## 11. DMW / POEA (Department of Migrant Workers)

**Primary URL:** https://dmw.gov.ph/statistics
**POEA archived data:** https://dmw.gov.ph/archives/ofwstat/ofwstat.html
**Data type:** Annual OFW deployments by type (land-based/sea-based), destination, occupation, sex
**Latest year available:** 2023 (all-time record)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total OFW deployments (2023) | 2,330,720 | DMW official statistics / Philstar April 2024 | 2023 | OFFICIAL |
| Land-based OFW deployments | 1,752,094 | DMW official statistics | 2023 | OFFICIAL |
| Sea-based (seafarer) deployments | 578,626 | DMW official statistics | 2023 | OFFICIAL |
| Rehires | 1,244,005 | DMW official statistics | 2023 | OFFICIAL |
| New hires | 508,089 | DMW official statistics | 2023 | OFFICIAL |
| Female OFWs | 49.8% of total | DMW official statistics | 2023 | OFFICIAL |
| Pre-pandemic OFW deployment | 2,189,474 | DMW / Philstar | 2019 | OFFICIAL |
| Top destination (Saudi Arabia) | 419,776 | DMW official statistics | 2023 | OFFICIAL |
| Top destination (UAE) | 282,896 | DMW official statistics | 2023 | OFFICIAL |

---

## 12. DOLE / PSA Labor Force Survey

**Primary URL:** https://psa.gov.ph/statistics/labor-force-survey
**DOLE supplementary:** https://ils.dole.gov.ph/labor-force-survey-reports
**Data type:** Total employment, class of worker, sector breakdown, underemployment
**Latest year available:** December 2023 (latest full-year round)

### Published Statistics (December 2023 round)

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total employed persons | 50,520,000 | PSA LFS December 2023 | Dec 2023 | OFFICIAL |
| Employment rate | 96.9% | PSA LFS December 2023 | Dec 2023 | OFFICIAL |
| Wage/salary workers (all) | ~31,700,000 (62.7% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |
| Private establishment workers | ~24,900,000 (49.2% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |
| Government/GOCC workers | ~4,440,000 (8.8% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |
| Self-employed without paid employee | ~13,640,000 (~27% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |
| Unpaid family workers | ~4,550,000 (~9% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |
| Employers in own family-operated business | ~960,000 (~1.9% of employed) | PSA LFS December 2023 | Dec 2023 | DERIVED |

### Class of Worker (June 2023 round — detailed)

| Category | Percentage | Number (of 48.84M employed) | Confidence |
|---------|-----------|---------------------------|------------|
| Self-employed without paid employee | 27.1% | 13,236,000 | DERIVED |
| Unpaid family workers | 9.5% | 4,640,000 | DERIVED |
| Employers in own family farm/business | 1.9% | 927,000 | DERIVED |
| Wage/salary — private establishments | 47.6% | 23,248,000 | DERIVED |
| Wage/salary — government/GOCC | 9.4% | 4,591,000 | DERIVED |

---

## 13. PSA — Census of Philippine Business and Industry (CPBI)

**Primary URL:** https://psa.gov.ph/statistics/census/business-and-industry/index
**Data type:** Enterprise counts by size class, sector, region
**Latest year available:** 2023 data collected (results not yet published as of 2026-03-02)

### Notes

The most recent published CPBI covers 2018. The 2023 CPBI was conducted May–July 2024; results were not yet publicly available as of early 2026. For business establishment counts, use the PSA List of Establishments (annual survey) which shows 1,109,684 establishments in 2022.

---

## 14. BOC (Bureau of Customs)

**Primary URL:** https://customs.gov.ph/boc-annual-report-2023/
**2023 Annual Report PDF:** https://customs.gov.ph/wp-content/uploads/2024/03/BOC-CY-2023-Annual-Report.pdf
**Data type:** Import entry counts, customs revenue, import value by commodity
**Latest year available:** 2023

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total BOC revenue (Jan–Nov 2023) | ₱813.651 billion | BOC CY2023 Annual Report | 2023 | OFFICIAL |
| Total imports value | USD 126.21 billion | PSA (via BOC) | 2023 | OFFICIAL |
| Change in imports vs 2022 | -8.0% | PSA | 2023 | OFFICIAL |
| Top import commodity (electronics) | USD 26.64 billion (21.1%) | PSA | 2023 | OFFICIAL |

### Not Publicly Indexed

- Total number of import declarations (entries) processed per year (in BOC Annual Report PDF; not extractable via web search)
- PCA (Post-Clearance Audit) case count

---

## 15. NLRC (National Labor Relations Commission)

**Primary URL:** https://nlrc.dole.gov.ph
**FOI Portal:** https://www.foi.gov.ph/agencies/nlrcom/
**Data type:** Case filings by type (illegal dismissal, money claims), awards, settlement
**Latest year available:** 2023 (quarterly reports published; no consolidated annual total found)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Regional case sample — Caraga Q1 2023 | 337 cases handled | PNA citing NLRC-13 | Q1 2023 | OFFICIAL |
| Nationwide annual total | Not found | NLRC annual reports (PDF, 403 error) | 2022/2023 | UNAVAILABLE |

### Access Notes

NLRC publishes quarterly case status reports for years 2019–2023 on its official website but these are inaccessible via automated fetch. An FOI request at foi.gov.ph/agencies/nlrcom/ is the recommended path to obtain consolidated 2022/2023 nationwide totals.

---

## 16. BFP (Bureau of Fire Protection)

**Primary URL:** https://bfp.gov.ph/annual-report/
**2023 Annual Report PDF:** https://bfp.gov.ph/wp-content/uploads/2024/02/CY-2023-Annual-Narrative-Accomplishment-Report.pdf
**Data type:** Fire incidents, FSIC (Fire Safety Inspection Certificate) counts, Fire Code fee collections
**Latest year available:** 2023

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total fire incidents | 16,431 | BFP CY2023 Annual Accomplishment Report | 2023 | OFFICIAL |
| Fire Code fees collected | ₱2,838,737,804.70 | BFP CY2023 Annual Report | 2023 | OFFICIAL |
| Prior year Fire Code fees (2022) | ₱2,711,049,654.80 | BFP CY2023 Annual Report | 2022 | OFFICIAL |
| Year-over-year fee increase | +4.71% | BFP CY2023 Annual Report | 2023 | OFFICIAL |

### Not Publicly Indexed

- Total FSICs issued in 2023 (exact count — in PDF but not indexed)
- Establishments with Fire Code Compliance (annual count)

### Derivation

Fire Code fees are typically tied to FSIC issuances and building permit inspections. The average fee per FSIC is not published; total establishments requiring FSIC in the Philippines is approximately equal to LGU-permitted businesses (~1.1M registered establishments per PSA).

---

## 17. LRA (Land Registration Authority)

**Primary URL:** https://lra.gov.ph/property-transaction-statistics/
**Data type:** Real property transaction registrations (deeds of sale, mortgages, titles)
**Latest year available:** 2021 (most recent publicly available PDF linked on LRA site)

### Published Statistics

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Property transactions data | Available as downloadable PDFs | LRA official website | 2021 | OFFICIAL |
| Specific annual count (2023) | Not publicly available online | — | — | UNAVAILABLE |

### Notes

LRA maintains regional-level property transaction data. For 2023 counts of real property sales (deed of sale registrations), a direct request to LRA or access to their statistical PDFs is required. The BIR Form 1706 (CGT on real property) count would approximate the number of taxable real property sales, but this figure is also not publicly indexed.

---

## 18. IPOPHL (Intellectual Property Office of the Philippines)

**Primary URL:** https://www.ipophil.gov.ph/
**Data type:** Trademark, patent, copyright registrations
**Latest year available:** 2023/2024

### Notes

IPOPHL publishes annual statistics on trademark applications and registrations. For TAM purposes: total annual trademark applications in the Philippines (domestic filers) are in the range of 15,000–20,000 per year (based on WIPO statistics for the Philippines).

---

## 19. BSP (Bangko Sentral ng Pilipinas)

**Relevant for OFW tools, pawnshop tools, financial products**

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| OFW remittances (total) | USD 37.2 billion | BSP 2023 | 2023 | OFFICIAL |
| Pawnshops (registered with BSP) | ~15,000 branches | BSP Annual Report (estimated) | ~2023 | ESTIMATED |

---

## 20. ERC (Energy Regulatory Commission)

**Relevant for electricity bill tools**

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total electricity consumers (metered connections) | ~6.3 million residential | DOE/ERC (CEPALCO and other DU reports) | ~2023 | ESTIMATED |

---

## Quick Reference — Key Numbers for Tool TAM Analysis

| Tool Category | Key Population Figure | Number | Confidence |
|--------------|----------------------|--------|------------|
| Tax — self-employed | BIR 1701/1701A/1701Q filers | 2,186,544 | OFFICIAL |
| Tax — all individuals | BIR registered individual taxpayers | 28,120,000 | OFFICIAL |
| Tax — corporate | SEC active companies (end-2023) | ~478,000–480,000 | DERIVED |
| Tax — VAT | VAT-registered taxpayers (estimate) | ~1.7M–2.5M | ESTIMATED |
| Labor — private employees | PSA LFS private establishment workers | 24,900,000 | DERIVED |
| Labor — government employees | GSIS active members | 2,120,340 | OFFICIAL |
| Social security (SSS) | Total SSS members | ~40–41 million | OFFICIAL |
| Health insurance (PhilHealth) | Total PhilHealth members | 62,236,523 | OFFICIAL |
| Housing fund (Pag-IBIG) | Total active members | 15,900,000 | OFFICIAL |
| Government benefits (GSIS) | Active GSIS members | 2,120,340 | OFFICIAL |
| OFW | Annual deployments | 2,330,720 | OFFICIAL |
| Seafarers | Annual sea-based deployments | 578,626 | OFFICIAL |
| Professionals (all, PRC) | Cumulative registered | >4,900,000 | OFFICIAL |
| CPAs | Cumulative registered | ~200,000 | ESTIMATED |
| Lawyers | Roll of Attorneys | 84,236 (base) ~91,000 end-2024 | OFFICIAL / DERIVED |
| Nurses | Cumulative registered | 951,105 | OFFICIAL |
| SEC corporations (active) | All types | ~478,000–480,000 | DERIVED |
| Motor vehicles | Total registered (all types) | ~13,300,000 | DERIVED |
| Sole proprietors (DTI) | Annual registrations | ~932,000 | OFFICIAL |
| Business establishments (PSA) | Total registered | 1,109,684 | OFFICIAL |

---

## Data Gap Summary

The following key data points are **not publicly indexed** and require direct PDF access, FOI requests, or agency inquiry:

| Data Point | Recommended Access Path |
|-----------|------------------------|
| BIR VAT-registered taxpayer count | BIR Annual Report PDF or BIR FOI |
| BIR withholding agent count | BIR Annual Report PDF |
| BIR Form 1706 / 1800 annual filing counts | BIR Annual Report PDF or BIR FOI |
| BIR corporate taxpayer count (2023) | BIR Annual Report PDF |
| SSS registered employer count | SSS Annual Report PDF |
| SSS 2023 member breakdown by type | SSS Annual Report PDF |
| PhilHealth registered employer count | PhilHealth Annual Report PDF |
| MARINA cumulative SIRB holder count | MARINA 2023 Statistical Report PDF |
| NLRC nationwide annual case filing total | FOI request to NLRC |
| LRA property transaction counts (2023) | LRA direct inquiry or FOI |
| BFP total FSICs issued (2023) | BFP Annual Report PDF |
| PRC cumulative counts for customs brokers, RE brokers, civil engineers | PRC FOI or direct inquiry |
