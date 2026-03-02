# TAM: Indirect Tax Cluster (C2, C3)

**Tools covered:** C2 (VAT Computation Engine), C3 (VAT Refund Claims Engine)
**Loop source:** compliance-moats
**Scores:** C2 — 3.75 | C3 — 3.65

---

## Overview

This cluster covers the two VAT-specific tools from the indirect tax domain: the routine quarterly VAT computation engine (C2) and the niche high-value VAT refund claims calculator for zero-rated exporters (C3). These are structurally different market plays — C2 is a high-volume, moderate-value mass-market tool; C3 is a low-volume, extremely-high-value B2B specialist tool. They share the same legal framework (NIRC Sections 106–115, as amended by TRAIN, CREATE, EOPT 2024) but address completely different user populations and competitive dynamics.

**Key regulatory context (2023–2025):**
- EOPT Act (RA 11976, enacted January 2024): eliminated annual BIR registration fee, standardized invoicing, changed monthly VAT → quarterly VAT filing starting January 2023
- RA 12023 (October 2024): extended 12% VAT to non-resident digital services providers (Netflix, Spotify, Google, etc.) — adds a new category of VAT-registered entity
- RMC No. 71-2023 + RMO No. 23-2023 (July 2023): streamlined VAT refund documentary requirements, reducing from 30 to 9–17 documents
- Section 112(C): statutory 5% of total BIR+BOC VAT collection is auto-appropriated annually into a special fund for VAT refund payments

---

## C2: VAT Computation Engine

**Score:** 3.75
**Tool concept:** Quarterly VAT return calculator handling output VAT computation (12% × taxable sales by category), input VAT credit (12% × VAT-paid purchases), mixed-use allocation (for businesses with both taxable and exempt sales), zero-rated vs. exempt classification, and carryforward tracking. RA 11976 changes (quarterly-only filing starting 2023) and RA 12023 digital services VAT are incorporated. Output: completed BIR Form 2550Q worksheet with source transactions.

---

### Consumer Segment (C2)

**Who:** VAT-registered businesses and individual professionals who file BIR Form 2550Q quarterly — those with annual gross sales exceeding ₱3,000,000 (mandatory registration threshold under NIRC as amended by TRAIN) plus voluntary registrants.

**Population:**

- **~1,700,000** VAT-registered taxpayers (all types: corporations, partnerships, individual businesses, individual professionals) — Source: ESTIMATED — derived from BIR data-registry analysis: PSA 2022 List of Establishments (1,109,684 formal establishments) × ~40% share above ₱3M annual gross sales threshold, plus ~478,000 SEC-registered active corporations (majority VAT-registered), plus individual professional VAT registrants; consistent with scored-domains C2 market note citing "500K–700K VAT-registered businesses" as the computationally active subset — Confidence: ESTIMATED

- **500,000–700,000** businesses actively filing BIR Form 2550Q on a regular quarterly basis (the subset that is truly computing VAT each quarter rather than filing nil or dormant returns) — Source: ESTIMATED — from compliance-moats scored-domains C2 market score rationale (Market = 4 citing this range); no published BIR count of 2550Q filers is publicly indexed — Confidence: ESTIMATED

- **Corroboration via VAT revenue math:** BIR VAT collection 2023 = ₱475 billion (Source: BIR Collection Statistics via Statista, 2023; OFFICIAL). Average effective VAT liability if distributed across 600K active filers = ₱792K/filer/year — plausible for a mix of micro to large businesses; supports the 500K–700K active filer range as reasonable.

- **Corroboration 2024 data:** BIR VAT collections 2024 = ₱643.85 billion (Source: BusinessWorld Online, April 2025, citing BIR data; OFFICIAL). The 35.5% increase was attributed to collecting 12 months of quarterly VAT in 2024 vs. 10 months in 2023 due to the transition to quarterly filing — not a registrant count increase.

**Data gap:** BIR does not publicly publish a disaggregated count of VAT-registered vs. non-VAT-registered taxpayers on its online statistics page. The BIR CY2023 Annual Report HTML version was inaccessible (SSL certificate error). An FOI request to BIR Revenue Statistics Division would be required to confirm the exact figure.

**Addressable fraction:** 65% — internet penetration among working-age adults in the Philippines is 73.1% (DataReportal January 2024); formal VAT-registered businesses skew urban and higher-digital-access (85%+); but a significant share of small sole proprietors and micro-enterprises remain cash-based and manually track their VAT, pulling the blended rate down. Use 65%.

**Addressable consumer population:** 600,000 (midpoint active filers) × 65% = **390,000**

**Current professional cost:** A bookkeeper or accounting firm handling monthly/quarterly VAT compliance charges ₱2,000–₱8,000/month for SMEs (Source: CloudCFO.ph pricing page 2024; ESTIMATED as cited in industry). Full-service CPA firm retainer including VAT: ₱5,000–₱25,000/month. Many micro-VAT registrants attempt DIY with eBIRForms but make systematic classification errors.

**Our consumer price:** ₱199/month

**Consumer TAM (C2):** 390,000 × ₱199 × 12 = **₱931M/year ≈ ₱931M**

---

### Professional Segment (C2)

**Who:** CPAs and bookkeepers who handle quarterly VAT returns for multiple business clients, where automated input-VAT tracking and output-VAT computation for a client portfolio reduces per-return preparation time. VAT return preparation is bundled into most business tax compliance retainers.

**Population:**
- **30,000–40,000** CPAs actively doing business compliance work (including VAT returns) — Source: ESTIMATED — derived from ~200,000 total registered CPAs (Source: BOA Chairman statement, Manila Times, May 2023; ESTIMATED); ~30% in public practice (~60,000); ~60% of public practice CPAs include VAT compliance in their services (~36,000) — Confidence: ESTIMATED
- **23,678** workers in PSA Industry Classification 6920 (Accounting, Bookkeeping, Auditing Activities; Tax Consultancy) — Source: PSA 2022 Annual Survey of Philippine Business and Industry (ASPBI), Professional/Scientific/Technical Activities section — Confidence: OFFICIAL
- Among these 23,678 formal-sector accounting workers, the subset directly handling VAT returns for clients would be a majority; formal-sector firms likely cover 10,000–15,000 practitioners in VAT-facing roles
- Blended estimate: **25,000–35,000** CPAs/bookkeepers regularly preparing 2550Q for clients

**Clients per professional per year:** A mid-sized CPA practice managing SME clients handles 20–80 VAT clients per accountant per quarter (Source: ESTIMATED — based on Taxumo CPA partner interviews cited in Philippine CPA community forums; no published study). A tool reducing per-return time from 2 hours to 30 minutes has material value at this volume.

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM (C2):** 30,000 × ₱999 × 12 = **₱360M/year**

---

### Total TAM — C2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (VAT-registered businesses) | 390,000 addressable | ₱199/mo | ₱931M |
| Professional (CPAs/bookkeepers) | 30,000 practitioners | ₱999/mo/seat | ₱360M |
| **Total TAM — C2** | | | **₱1,291M ≈ ₱1.29B** |

**SAM (C2):** ₱387M — 30% of TAM: businesses actively seeking digital solutions for quarterly compliance; CPAs using cloud-based accounting tools (Xero, QuickBooks Philippines users as proxy for digitally-ready practices)
**SOM Year 1 (1%):** ₱3.9M
**SOM Year 3 (5%):** ₱19.4M

**Competitive note:** Taxumo and JuanTax partially serve this market. JuanTax explicitly positions itself as a VAT return preparation tool. C2 as a standalone is lower priority; higher value as part of an integrated bookkeeping→VAT→income tax pipeline that creates cross-sell lock-in.

---

## C3: VAT Refund Claims Engine (NIRC Sec. 112)

**Score:** 3.65
**Tool concept:** End-to-end workflow tool for Section 112(A)/(B) VAT refund claims: computes the attributable input VAT on zero-rated sales (direct attribution + proportional allocation), applies the risk classification framework under RMC No. 71-2023 (low/medium/high risk), generates the documentary checklist (max 17 documents under RMO No. 23-2023 vs. old 30-document list), tracks the 2-year prescriptive period from close of taxable quarter, flags approaching deadlines, and prepares the claim summary schedule for BIR Form 1914 submission. Target user: in-house tax team at exporter or external tax specialist.

---

### Consumer Segment (C3)

**Who:** VAT-registered businesses with zero-rated sales under NIRC Sections 106(A)(2) and 108(B) — primarily export-oriented manufacturers, export service providers, PEZA/BOI-registered registered business enterprises (RBEs), and BPO/IT-BPM companies with foreign-currency clients. These entities accumulate input VAT that cannot be applied against output tax (since output VAT on zero-rated sales is ₱0) and must either carry forward or file for refund under Section 112.

**Population:**

- **~4,587 PEZA-registered active locator companies** as of March 2020 (the most recent publicly available official figure) — Source: Philippine Economic Zone Authority, Wikipedia citation of PEZA data as of March 2020 — Confidence: OFFICIAL (for 2020 reference point)
  - 2023 estimate: **~5,000–5,500** active locators — Source: ESTIMATED — PEZA added ~200–300 net new locators per year based on annual new/expansion project approval pace (averaging 200+ approved projects/year in 2022–2024); applying 3 years of growth to the 4,587 base yields ~5,000–5,500 — Confidence: ESTIMATED

- **~2,000–4,000** BOI-registered enterprises with active incentives (cumulative portfolio, not annual approvals) — Source: ESTIMATED — BOI approved 311 new projects in 2023 (Source: BOI press release, December 2023; OFFICIAL for new 2023 approvals); the total cumulative active portfolio of BOI-registered enterprises with live incentives (across 3–7 year ITH periods) is estimated at 2,000–4,000 active entities, based on annual approval pace of 150–311 projects/year over the past decade — Confidence: ESTIMATED

- **~2,000–5,000** other zero-rated businesses not registered with PEZA or BOI (direct exporters of goods, export service providers with foreign-currency clients under NIRC Sec. 108(B)(2)) — Source: ESTIMATED — this is the most uncertain segment; PSA export statistics show ~35,000 Philippine merchandise exporters (PSA Trade in Goods data, 2022; OFFICIAL for total exporters), but only a fraction are VAT-registered with meaningful input VAT to reclaim — Confidence: ESTIMATED

- **Total eligible claimants (annual):** 10,000–15,000 businesses potentially eligible for Section 112 refund — DERIVED from above; note that many accumulate credits for up to 2 years before filing (2-year prescriptive window), so annual filers are a fraction of those eligible — Confidence: ESTIMATED

- **Annual active claimants (BIR Form 1914 filers):** The scored-domains C3 market scoring notes "10K–50K refund applications per year." Cross-check via the 5% fund: BIR+BOC VAT collection 2023 ≈ ₱475B (BIR) + ~₱100B (BOC) = ₱575B; 5% = ₱28.75B auto-appropriated for refunds (NIRC Sec. 112(C)). If average successful claim = ₱3–5M, the fund supports 5,750–9,583 approved claims per year; if average = ₱1M, it supports ~28,750 approvals. This triangulates to **8,000–30,000 annual refund applications**, with a best estimate of **10,000–15,000** annual Form 1914 filers — Confidence: DERIVED

**Data gap:** BIR does not publish annual VAT refund claim statistics (number of applications, amounts granted, VCAD caseload). This data would be in the BIR Annual Report or VCAD performance reports not publicly indexed. No congressional budget hearing transcripts with VCAD statistics were found in web searches.

**Addressable fraction:** 60% — businesses that use digital tools for their VAT refund workflow (large exporters with in-house tax teams or external tax advisors; excludes micro-exporters that rely entirely on manual processes or have no sustained VAT refund practice). PEZA/BOI-registered companies by definition have formal compliance infrastructure.

**Addressable consumer population:** 12,500 (midpoint annual filers) × 60% = **7,500 addressable businesses**

**Current professional cost:** Tax firms charge 3–10% success fee on the amount refunded (Source: compliance-moats scored-domains C3 note, confirmed by industry practice referenced in KPMG/PwC Philippines tax publications). For a ₱5M refund: ₱150K–₱500K professional fee. For large exporters with ₱50M+ claims: ₱1.5M–₱5M+ per filing cycle. Flat retainers: ₱200K–₱2M+ per engagement for law firms handling complex claims (Source: ESTIMATED — no published fee schedule, consistent with senior tax partner billing rates of ₱5,000–₱15,000/hour × 40–200 hours per complex claim).

**Our consumer price:** ₱999/month (business tier — this is a B2B tool, not consumer)

**Consumer TAM (C3, in-house users):** 7,500 × ₱999 × 12 = **₱90M/year**

---

### Professional Segment (C3)

**Who:** Tax practitioners at accounting firms, law firms, and boutique tax advisory firms who manage VAT refund claims on behalf of exporter clients. The primary users are specialist VAT refund practitioners — a distinct subspecialty within Philippine tax practice.

**Population:**
- **Big-4 + mid-tier accounting firms** with active VAT refund practices: Isla Lipana (PwC Philippines), SGV & Co. (EY Philippines), Punongbayan & Araullo (Grant Thornton), Reyes Tacandong & Co., Deloitte Philippines, BDO Roxas Cruz Tagle, Manabat Sanagustin & Co. (KPMG Philippines) — approximately 7–10 firms with dedicated VAT refund practice groups, likely 10–50 practitioners per firm dedicated to Section 112 work — Source: ESTIMATED — Confidence: ESTIMATED
- **Boutique tax law firms** specializing in BIR controversy and refund claims: approximately 30–80 firms with active VAT refund caseloads, 2–10 practitioners per firm — Source: ESTIMATED — Confidence: ESTIMATED
- **Total active VAT refund practitioners (professional tier):** **300–600** practitioners in professional firms actively managing VAT refund claims for clients
- **Large corporations with in-house VAT refund specialists** (PEZA exporters with dedicated tax teams): approximately 500–1,000 companies large enough to have in-house staff managing this — Source: ESTIMATED — Confidence: ESTIMATED

**B2B price per seat:** ₱2,999/month (Practice tier)

**Professional TAM (C3):** 500 (practitioners in professional firms) × ₱2,999 × 12 = **₱18M/year**
*(Plus in-house corporate seats: 750 × ₱999 × 12 = ₱9M — but this overlaps with consumer segment above; exclude to avoid double-count)*

---

### Total TAM — C3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer/in-house (zero-rated exporters with in-house tax) | 7,500 addressable businesses | ₱999/mo | ₱90M |
| Professional (tax practitioners in firms) | 500 active practitioners | ₱2,999/mo/seat | ₱18M |
| **Total TAM — C3** | | | **₱108M** |

**SAM (C3):** ₱54M — 50% of TAM: practitioners and companies with digital-ready workflows; C3 is a professional tool and the addressable universe is small enough that even 50% SAM is achievable in a niche market
**SOM Year 1 (1%):** ₱1.1M
**SOM Year 3 (5%):** ₱5.4M

**Strategic note:** C3's value is asymmetric — low total TAM from subscription pricing, but the *stakes per engagement* are enormous (₱1M–₱50M+ refund claims). The tool's real business model may not be subscription but rather: (a) referral/partnership with tax firms who use it to accelerate claims, (b) outcome-based pricing tied to claim success, or (c) a premium add-on to a broader compliance platform that captures the C2 VAT base and then upsells C3 for qualifying exporters. A standalone ₱108M TAM places C3 as a viable niche product but not a standalone business.

---

## Combined TAM — Indirect Tax Cluster (C2 + C3)

| Tool | Consumer TAM | Professional TAM | Total TAM | SAM | SOM Y1 | SOM Y3 |
|------|-------------|-----------------|-----------|-----|--------|--------|
| C2: VAT Computation Engine | ₱931M | ₱360M | ₱1,291M | ₱387M | ₱3.9M | ₱19.4M |
| C3: VAT Refund Claims Engine | ₱90M | ₱18M | ₱108M | ₱54M | ₱1.1M | ₱5.4M |
| **Cluster Total** | **₱1,021M** | **₱378M** | **₱1,399M** | **₱441M** | **₱5.0M** | **₱24.8M** |

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| BIR VAT collection ₱475B | BIR Collection Statistics via Statista | 2023 | OFFICIAL |
| BIR VAT collection ₱643.85B (35.5% YOY) | BusinessWorld Online, April 6, 2025 | 2024 | OFFICIAL |
| PSA registered formal establishments: 1,109,684 | PSA List of Establishments 2022 | 2022 | OFFICIAL |
| SEC active registered companies: 527,710 | SEC press release / BusinessMirror (end-2024) | 2024 | OFFICIAL |
| PSA ASPBI accounting/bookkeeping/tax workers: 23,678 | PSA ASPBI 2022, Professional/Scientific/Technical Activities | 2022 | OFFICIAL |
| Electronic filers as % of BIR filers: 69% | BIR via DOF press release, November 2023 | 2023 | OFFICIAL |
| PEZA locator companies: 4,587 | PEZA data cited in Wikipedia, as of March 2020 | 2020 | OFFICIAL |
| BOI 2023 new project approvals: 311 projects | BOI press release, December 2023 | 2023 | OFFICIAL |
| VAT refund 5% special fund provision | NIRC Section 112(C) as amended | Statutory | OFFICIAL |
| VAT refund documentary requirements reduced to 9–17 docs | RMC No. 71-2023 + RMO No. 23-2023, BIR | 2023 | OFFICIAL |
| Total Philippine merchandise exporters: ~35,000 | PSA Trade in Goods Statistics 2022 | 2022 | OFFICIAL |
| VAT-registered taxpayers ~1.7M | ESTIMATED (derived from PSA + SEC + BIR individual filers) | 2023 | ESTIMATED |
| Active 2550Q filers 500K–700K | ESTIMATED (compliance-moats scored-domains C2 note) | 2023 | ESTIMATED |
| PEZA locators 2023: ~5,000–5,500 | ESTIMATED (extrapolated from 2020 base + growth rate) | 2023 | ESTIMATED |
| Annual VAT refund applications: 10,000–15,000 | DERIVED (5% fund math + eligible business triangulation) | 2023 | DERIVED |
| CPAs in business compliance: 30,000–40,000 | ESTIMATED (BOA chairman 200K total; sector distribution applied) | 2023 | ESTIMATED |
| Professional VAT refund practitioners: 300–600 | ESTIMATED (firm-level bottom-up count) | 2023 | ESTIMATED |

---

## Notes & Caveats

1. **Critical data gap — VAT registrant count:** The BIR does not publish a publicly-accessible disaggregated count of VAT-registered vs. non-VAT-registered taxpayers online. The ~1.7M estimate is derived and should be treated as an order-of-magnitude figure. The BIR CY2023 Annual Report likely contains the precise figure but the HTML version was inaccessible (SSL certificate error on web-services.bir.gov.ph).

2. **Active filer vs. registered filer distinction:** A business registered for VAT is not necessarily filing actively. The ~1.7M registered but ~600K active distinction is significant for realistic TAM. Tools that serve dormant or infrequently-active VAT registrants have lower real market potential.

3. **EOPT 2024 impact on C2:** The shift from monthly (2550M) to quarterly-only (2550Q) filing under RA 11976 starting January 2023 reduced filing touchpoints from 12/year to 4/year per taxpayer. This reduces the frequency-of-use value of a C2 tool but does not change the underlying registered business count.

4. **RA 12023 (digital services VAT, October 2024) adds a new C2 market:** Non-resident digital service providers (Netflix, Spotify, Google, etc.) are now required to register for Philippine VAT and file 2550Q. This is a new category of international B2B clients for a VAT computation engine — primarily handled by large advisory firms (Isla Lipana, SGV, etc.) rather than domestic SME-focused tools.

5. **C3 is definitionally B2B, not B2C:** The consumer segment of C3 is actually corporate in-house tax teams, not individual taxpayers. The word "consumer" in the template is a misnomer here — both segments are professional.

6. **VAT refund backlog data unavailable:** No publicly-indexed source quantifies the historical BIR VCAD backlog or annual refund approvals in peso terms. The 5% special fund provision (₱23.75–28.75B for 2023) provides a ceiling on total refunds payable, but actual disbursements may be lower due to processing delays. This backlog dynamic is the core pain point for C3 but cannot be quantified from public sources.

7. **C3 and the CREATE MORE Act (2024):** The CREATE MORE Act (RA 12066, signed November 2024) further streamlined VAT zero-rating and refund for registered enterprises. This expands the C3 addressable market slightly by adding more IPA-registered enterprises and accelerating refund processing timelines — directionally positive for C3 adoption.
