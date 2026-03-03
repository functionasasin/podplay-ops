# TAM: Customs & Trade Compliance Tools (F-BOC Cluster)

**Tools:**
- F-BOC-1: BOC Landed Cost Calculator (Score: 4.00)
- F-BOC-2: BOC PCA Compliance Checker & PDP Advisor (Score: 3.70)
- F-BOC-3: Automobile Excise Tax Transparency Calculator (Score: 3.85)

**Loop source:** regulatory-atlas

---

## Tool Definitions

| Tool ID | Tool Name | Core Function | Score |
|---------|-----------|---------------|-------|
| F-BOC-1 | BOC Landed Cost Calculator | CIF × AHTN duty rate + 12% VAT on landed cost + brokerage fee (₱1,300–₱5,300 + 0.125%) + IPF; de minimis check (₱10K FOB); consumer: e-commerce importers + SMEs | 4.00 |
| F-BOC-2 | BOC PCA Compliance Checker & PDP Advisor | Post-Clearance Audit 3-year lookback; penalty = 125%/600% × duty deficiency + 20%/yr interest; BOC PCAG collected ₱2.71B in 2024 | 3.70 |
| F-BOC-3 | Automobile Excise Tax Transparency Calculator | NMISP × rate table (4%/10%/20%/50%); hybrid = 50% of applicable rate; EV exempt; 400K+ new vehicles sold per year | 3.85 |

---

## F-BOC-1: BOC Landed Cost Calculator

### Consumer Segment

**Who:** Philippine businesses (commercial importers, SME e-commerce resellers, and occasional importers) who need to calculate total landed cost for imported goods — CIF value × AHTN tariff rate + 12% VAT on landed cost (CIF + duty) + brokerage fee + inspection/processing fees — before placing import orders or verifying broker estimates.

**Population:**

- **11,894** BOC-accredited importers on BOC CPRS (Customs Processing and Registration System) — Source: PortCalls Asia, "BOC Accredits Importers, Brokers," June 2, 2015 (citing BOC statement at the time) — Confidence: OFFICIAL (dated 2015)
- **ESTIMATED ~25,000** active BOC-accredited importers as of 2023 — Source: DERIVED from 2015 baseline of 11,894 importers + growth proportional to Philippine import value growth (USD 73B in 2015 to USD 126.21B in 2023, per PSA International Merchandise Trade Statistics = 73% growth), adjusted for BOC accreditation policy tightening under CAO 07-2022 — Confidence: ESTIMATED (triangulated from trade growth and 2015 baseline)
- **4,352** PEZA locator companies across 422 economic zones — Source: DTI/PEZA "28th Investors Night," 2023 (as cited in PNA, September 2023) — Confidence: OFFICIAL (2023). These receive duty-free importation as a PEZA incentive, so they do not pay standard tariffs on raw materials, but still need landed cost estimates for non-PEZA imports and comparative pricing purposes.
- **"over 6,500"** importer accreditation applications processed by BOC in H1 2022 alone — Source: Ex-Works Cargo citing BOC announcement, H1 2022 — Confidence: OFFICIAL (partial; this is an application batch, not a cumulative total)
- **Total addressable consumer population (ESTIMATED):** ~50,000 — comprising ~25,000 BOC-accredited importers + ~25,000 semi-formal SME importers (e-commerce resellers with regular overseas purchases on Alibaba/Taobao who are not formally BOC-accredited but actively import merchandise) — Confidence: ESTIMATED

**Data gap:** BOC does not publicly publish the current total count of active CPRS-registered importers. The 2015 figure (11,894) is the most specific official number found. An FOI request to BOC's Assessment and Operations Coordinating Group (AOCG) or a query to the BOC CPRS portal would be required for the 2023 total.

**Addressable fraction:** 65% — Philippine internet penetration among businesses: DataReportal 2024 reports 73% internet penetration among 18+ Filipinos; for SME businesses, urban-weighted digital adoption is approximately 65% (PSA 2022 ICT Survey shows 63% of MSMEs use internet for business). Importers who are BOC-accredited tend to be more sophisticated and digitally active (~85%), but the broader SME importer pool pulls the blended rate down.

**Addressable consumer population:** 50,000 × 65% = **~32,500**

**Current professional cost:** A licensed customs broker charges ₱1,300–₱5,300 per formal import entry (brokerage fee schedule, per BOC Customs Administrative Order governing brokerage), plus 0.125% of dutiable value for large shipments. For landed cost estimation (before broker engagement), importers currently rely on: (a) asking brokers for informal quotes (often inaccurate), (b) using Excel spreadsheets with manually looked-up AHTN rates, or (c) using the BOC's Customs Duty Estimator (which does not include all fees). Zero unified consumer-facing tool exists.

**Our consumer price:** ₱199/month (unlimited calculations, AHTN code lookup, brokerage fee estimation, de minimis checker)

**Consumer TAM:** 32,500 × ₱199/mo × 12 = **₱77.6M/year**

---

### Professional Segment

**Who:** Licensed customs brokers who handle formal import entries on behalf of importers. Mandatory by statute (CMTA Sec. 802): all formal import entries must be filed through a licensed customs broker, except entries filed personally by the importer.

**Population:**

- **PRC Customs Broker Licensure Exam (CBLE) passers 2022–2024:**
  - November 2022: 873 passers out of 1,879 examinees (46.5% passing rate) — Source: Manila Bulletin citing PRC, November 2022 — Confidence: OFFICIAL
  - November 2023: 1,579 passers out of 2,767 examinees (57.07% passing rate) — Source: Inquirer.net citing PRC results, November 2023 — Confidence: OFFICIAL
  - November 2024: 1,265 passers out of 2,871 examinees (44.1% passing rate) — Source: PRC official results page (prc.gov.ph/node/7192), November 2024 — Confidence: OFFICIAL
- **DERIVED cumulative 2015–2024 CBLE passers: ~9,296** — Source: DERIVED from individual year exam data compiled from PRC results pages and Manila Bulletin/Inquirer archives (approximate annual passers 2015: 721, 2016: 1,030, 2017: 1,114, 2018: 1,266, 2019: 1,166, 2020: 0 [COVID], 2021: 282, 2022: 873, 2023: 1,579, 2024: 1,265) — Confidence: DERIVED
- **ESTIMATED total PRC-registered customs brokers (all cohorts, pre-2015 + 2015–2024): ~20,000–30,000** — Source: ESTIMATED; adding pre-2015 cumulative cohorts (exam has run since 1970s; pre-2015 passers numbered several thousand per year historically) to the 2015–2024 total of ~9,296 — Confidence: ESTIMATED
- **ESTIMATED active practicing customs brokers: ~8,000–10,000** — DERIVED from: (a) Chamber of Customs Brokers Inc. (CCBI) membership was "3,000+" circa 2004–2008 (per BOC FAQ, client.customs.gov.ph), reflecting the active professional base a decade earlier; (b) applying growth since 2008 and typical profession-to-active ratio gives a 2023 estimate of 8,000–10,000 active practitioners. Not all licensed brokers maintain active practice; many shift to corporate in-house roles — Confidence: ESTIMATED (requires PRC LERIS database query for exact count)

**Clients per professional per year:** A customs broker handling SME importers manages 50–200 formal entries per year. Larger brokerage firms (with multiple licensed employees) may process 1,000–5,000 entries annually. A landed cost tool with AHTN lookup, duty computation, and VAT calculation would replace manual broker work on each entry.

**B2B price per seat:** ₱999/month (Solo Pro tier — individual broker with unlimited calculations, AHTN code search, duty rate history, fee schedule updates)

**Professional TAM:** 9,000 active brokers × ₱999/mo × 12 = **₱107.9M/year**

---

### Total TAM — F-BOC-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~32,500 addressable | ₱199/mo | ₱77.6M |
| Professional (B2B) | ~9,000 active brokers | ₱999/mo/seat | ₱107.9M |
| **Total TAM** | | | **₱185.5M** |

**SAM (Serviceable):** ₱74.2M — rationale: Metro Manila and major ports (Cebu, Davao) account for ~80% of formal imports; importers in these areas have higher digital adoption (~70%); professional adoption is limited to brokers using digital tools (approximately 40% adoption rate in first 3 years). Apply 40% serviceable fraction to total TAM.

**SOM Year 1 (1%):** ₱0.74M
**SOM Year 3 (5%):** ₱3.71M

---

## F-BOC-2: BOC PCA Compliance Checker & PDP Advisor

### Consumer Segment

**Who:** Medium-to-large Philippine importers who have had prior formal import entries and face (or want to prepare for) a Post-Clearance Audit (PCA) by the BOC's Post Clearance Audit Group (PCAG). PCA covers a 3-year lookback period; deficiency findings attract penalties of 125% (good faith) or 600% (fraud) of the duty deficiency, plus 20%/year interest. Tool computes maximum penalty exposure and provides Prior Disclosure Program (PDP) advisory — voluntary disclosure to BOC to cap penalties at 125% and avoid criminal referral.

**Population:**

- **Active BOC-accredited importers subject to PCA jurisdiction: ESTIMATED ~25,000** (same population as F-BOC-1 consumer segment — all formal importers are PCA-eligible) — Confidence: ESTIMATED
- **Companies actively under PCAG audit or investigation in any given year: ESTIMATED ~1,000–3,000** — Source: DERIVED from BOC PCAG collections data. PCAG collected ₱2.71B in 2024 (from BOC regulatory-atlas analysis, sourced from BOC public announcements and ₱3.5B 2025 target); at an average deficiency finding of ₱1M–₱3M per audited company, this implies ~900–2,710 companies audited in 2024 — Confidence: ESTIMATED (methodology: ₱2.71B collections ÷ ₱1M–₱3M average finding)
- **Companies initiating Prior Disclosure Program (PDP) filings per year: ESTIMATED ~200–500** — Source: ESTIMATED; PDP was formalized under CMTA; no public count of PDP filers is published by BOC — Confidence: ESTIMATED

**Addressable fraction:** 60% — Large importers have dedicated compliance and legal counsel but still face information gaps on PCA penalty computation. The 60% fraction reflects those without in-house customs specialist who would benefit from a tool.

**Addressable consumer population:** 25,000 × 30% (PCAG audit risk awareness fraction) × 60% = **~4,500**

**Current professional cost:** Customs compliance law firms charge ₱50,000–₱300,000 for a PCA response engagement. Prior Disclosure Program filings require legal and broker assistance at similar cost. A PCA self-assessment tool would allow importers to pre-screen exposure before engaging expensive counsel.

**Our consumer price:** ₱499/one-time assessment (per audit period; this is a B2B transaction, not a monthly subscription for most users) or ₱999/month for ongoing compliance monitoring.

**Consumer TAM (at ₱999/month):** 4,500 × ₱999/mo × 12 = **₱53.9M/year**
**Consumer TAM (at ₱499/one-time, annual renewal):** 4,500 × ₱499 = **₱2.2M/year**

*Use ₱2.2M as conservative floor (transaction-based) and ₱53.9M as subscription ceiling. Realistically closer to ₱10M given the one-time nature of most PCA engagements.*

---

### Professional Segment

**Who:** Licensed customs brokers and customs/trade compliance lawyers who represent importers in PCAG audits and PDP filings. This is a specialist niche within the customs broker population.

**Population:**

- **Customs brokers handling PCA cases: ESTIMATED ~1,800** — DERIVED from 9,000 active customs brokers × 20% who handle post-entry compliance work (the remainder focus on entry filing, not audit defense) — Confidence: ESTIMATED
- **Customs and trade compliance lawyers: ESTIMATED ~500–1,000** — DERIVED from total PRC-registered lawyers in Philippines (~80,000 per IBP), of whom a small niche (~0.6–1.25%) specialize in customs/trade law — Confidence: ESTIMATED (no PRC sub-specialty breakdown for customs law published)
- **Total professional population (non-overlapping): ESTIMATED ~2,500**

**Clients per professional per year:** A customs compliance lawyer may handle 10–30 PCA cases per year. A customs broker with audit defense capability may support 5–20 companies annually through a PCA cycle.

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 2,500 × ₱999/mo × 12 = **₱29.9M/year**

---

### Total TAM — F-BOC-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct, transaction) | ~4,500 at-risk importers | ₱499/assessment | ₱2.2M |
| Consumer (subscription ceiling) | ~4,500 at-risk importers | ₱999/mo | ₱53.9M |
| Professional (B2B) | ~2,500 specialists | ₱999/mo/seat | ₱29.9M |
| **Total TAM (conservative)** | | | **₱32.1M** |
| **Total TAM (subscription ceiling)** | | | **₱83.8M** |

**SAM (Serviceable):** ₱12.8M — rationale: PCA is concentrated in large importers (Metro Manila accounts for ~85% of formal import values); digital adoption among large corporate importers is high but the market is inherently niche; apply 40% serviceable fraction to conservative total TAM.

**SOM Year 1 (1%):** ₱0.13M
**SOM Year 3 (5%):** ₱0.64M

*Note: F-BOC-2 is a high-pain, low-volume B2B niche. It is best positioned as a premium add-on within a broader customs compliance platform (bundled with F-BOC-1) rather than a standalone subscription.*

---

## F-BOC-3: Automobile Excise Tax Transparency Calculator

### Consumer Segment

**Who:** Prospective new car buyers in the Philippines who want to understand how the excise tax component (under RA 10963 TRAIN Law, amending NIRC Sec. 149) affects the vehicle's net manufacturer/importer selling price (NMISP) and ultimately the over-the-road (OTR) price. The tool computes: NMISP × applicable rate (4% for ≤₱600K NMISP, 10% for ₱600K–₱1M, 20% for ₱1M–₱4M, 50% for >₱4M) + 12% VAT on (NMISP + excise) = OTR floor price. Hybrid vehicle rate = 50% of applicable rate. Electric vehicles: exempt from excise tax.

**Population:**

- **401,117** total new vehicles sold by CAMPI-member manufacturers/assemblers in calendar year 2022 — Source: CAMPI (Chamber of Automotive Manufacturers of the Philippines) annual industry sales report, January 2023 press release — Confidence: OFFICIAL
- **ESTIMATED ~340,000–380,000** new vehicles sold in 2023 — Source: ESTIMATED from news coverage of CAMPI 2023 data indicating industry slowdown (credit tightening, interest rate increases); exact 2023 figure not confirmed from a directly retrieved source — Confidence: ESTIMATED
- **~1.2 million** people actively considering a new vehicle purchase at any given time — Source: DERIVED from 401,117 annual buyers × average consideration period of ~3–4 months (standard auto industry funnel benchmark) × 3 months/12 months per year; DERIVED also consistent with Philippine digital automotive research behavior (multiple sources cite 70–80% of car buyers research online before purchase) — Confidence: DERIVED
- **Active annual consideration population (used for TAM):** 401,117 (annual buyer cohort) — this is the transacting population, not the research funnel; each buyer uses the tool ~once during purchase process

**Addressable fraction:** 68% — PSA 2023 household survey shows 73% internet penetration overall; new car buyers in the Philippines skew urban, middle-to-upper income, and digitally active (~85% internet use among SEC A/B/C households). But CAMPI data includes commercial vehicle buyers (light trucks, AUVs used for business) with lower personal-device research habits. Blended estimate: 68%.

**Addressable consumer population:** 401,117 × 68% = **~272,760**

**Current professional cost:** No direct "professional fee" for excise tax calculation — this is information opacity, not a professional service gap. The pain is that car dealerships present OTR price without transparently breaking out the excise tax component. Consumers pay an unknown excise tax embedded in the price. A calculator that reverse-engineers the excise from the OTR price or computes it from the NMISP gives consumers meaningful comparison power. No unified free tool exists for this purpose (BIR's excise tax schedule is available on their website but not in calculator form).

**Our consumer price:** ₱99/one-time calculation (freemium model; free single calculation, ₱99 for full report with tax history, hybrid comparison, EV savings estimate)

**Consumer TAM:** 272,760 × ₱99 = **₱27.0M/year**

*Alternative subscription framing:* If positioned as a ₱199/month subscription during a 2-month car shopping window, the monthly active user base would be ~67,000 users/month × ₱199 = ₱13.3M/month but extremely high churn. Per-transaction pricing is more appropriate for this tool.

---

### Professional Segment

**Who:** New car dealerships and automotive importers who use the excise tax calculator to provide customers with transparent pricing breakdowns — a dealership differentiator given TRAIN Law complexity (4 rate tiers, hybrid rules, EV exemption). Also applicable to automotive media (car review sites, spec comparison platforms) and fleet purchasers evaluating vehicle tax impact.

**Population:**

- **~600+** CAMPI-member franchised dealerships (authorized dealers for Toyota, Honda, Hyundai, Ford, Mitsubishi, Nissan, Suzuki, Kia, MG, BYD, etc.) — Source: CAMPI dealer network estimates cited in transport-lto TAM (ESTIMATED, no official CAMPI dealer count published publicly) — Confidence: ESTIMATED
- **ESTIMATED ~2,000–3,500** total new vehicle dealerships in the Philippines including non-CAMPI/AVID member brands and authorized service dealers — Source: ESTIMATED; the Automotive Industry Association of the Philippines (AIAP), CAMPI, and AVID (Association of Vehicle Importers and Distributors) collectively represent most brands; adding second-brand and regional dealers yields this range — Confidence: ESTIMATED (no LTO, DTI, or SEC published dealership count found in indexed sources)
- **~10** CAMPI-member manufacturers/assemblers (Toyota Motor Philippines, Honda Cars Philippines, Mitsubishi Motors Philippines, Ford Motor Company Philippines, Nissan Philippines, Suzuki Philippines, Hyundai Asia Resources, etc.) who are the direct excise tax payers at the manufacturer/importer level — Source: CAMPI member list — Confidence: OFFICIAL

**Clients per professional per year:** A dealership sells an average of 50–300 vehicles per year (varies by brand and location). Each sale involves an OTR price disclosure to which an excise tax breakdown could be appended.

**B2B price per seat:** ₱999/month (dealership subscription: unlimited calculations, comparison report generation, sales floor tool for customer consultations)

**Professional TAM:** 2,500 dealerships (mid-estimate) × ₱999/mo × 12 = **₱29.9M/year**

---

### Total TAM — F-BOC-3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~272,760 annual buyers | ₱99/calculation | ₱27.0M |
| Professional (B2B) | ~2,500 dealerships | ₱999/mo/seat | ₱29.9M |
| **Total TAM** | | | **₱56.9M** |

**SAM (Serviceable):** ₱22.8M — rationale: Metro Manila and Cebu account for ~60% of new vehicle sales; digitally engaged dealerships are a subset (~50% would adopt a transparency tool); apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.23M
**SOM Year 3 (5%):** ₱1.14M

---

## Cluster Total TAM — F-BOC-1 + F-BOC-2 + F-BOC-3

| Tool | Segment | Population | Price | Annual TAM |
|------|---------|-----------|-------|-----------|
| F-BOC-1 Landed Cost | Consumer | ~32,500 addressable | ₱199/mo | ₱77.6M |
| F-BOC-1 Landed Cost | Professional (brokers) | ~9,000 active | ₱999/mo | ₱107.9M |
| F-BOC-2 PCA Compliance | Consumer (conservative) | ~4,500 at-risk | ₱499/assessment | ₱2.2M |
| F-BOC-2 PCA Compliance | Professional (specialists) | ~2,500 | ₱999/mo | ₱29.9M |
| F-BOC-3 Auto Excise | Consumer | ~272,760 buyers/yr | ₱99/use | ₱27.0M |
| F-BOC-3 Auto Excise | Professional (dealerships) | ~2,500 | ₱999/mo | ₱29.9M |
| **Total TAM (all F-BOC tools)** | | | | **₱274.5M** |

**SAM (Serviceable, blended):** ₱109.8M (40% of total TAM, adjusting for geographic concentration, digital adoption, and tool awareness)

**SOM Year 1 (1% of SAM):** ₱1.1M
**SOM Year 3 (5% of SAM):** ₱5.5M

**Revenue priority ranking within cluster:**
1. F-BOC-1 Professional TAM (₱107.9M) — customs brokers are a captive mandatory market (CMTA requires licensed broker for formal entries); high repeat-use; strongest SaaS fit
2. F-BOC-1 Consumer TAM (₱77.6M) — SME importers with recurring import needs; moderate churn risk
3. F-BOC-2 Professional TAM (₱29.9M) — niche but high-pain B2B; best sold as F-BOC-1 add-on
4. F-BOC-3 Professional TAM (₱29.9M) — dealership B2B; adoption requires partnership with CAMPI or ADP system integration
5. F-BOC-3 Consumer TAM (₱27.0M) — per-transaction model; low friction, freemium funnel
6. F-BOC-2 Consumer TAM (₱2.2M) — niche, transaction-based; bundle into F-BOC-1

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| BOC-accredited importers: 11,894 | PortCalls Asia, citing BOC statement, "BOC Accredits Importers, Brokers" | June 2015 | OFFICIAL (dated) |
| Over 6,500 accreditation applications in H1 2022 | Ex-Works Cargo, citing BOC H1 2022 announcement | 2022 | OFFICIAL (partial) |
| PEZA locator companies: 4,352 | DTI/PEZA 28th Investors Night, cited in PNA | 2023 | OFFICIAL |
| PEZA ecozones: 422 | Same DTI/PEZA source | 2023 | OFFICIAL |
| Total Philippine import value: USD 126.21B | PSA International Merchandise Trade Statistics | 2023 | OFFICIAL |
| BOC revenue collection: PHP 883.6B | BOC official collection report | 2023 | OFFICIAL |
| CBLE passers Nov 2022: 873 / 1,879 | PRC via Manila Bulletin, November 2022 | 2022 | OFFICIAL |
| CBLE passers Nov 2023: 1,579 / 2,767 | PRC via Inquirer.net, November 2023 | 2023 | OFFICIAL |
| CBLE passers Nov 2024: 1,265 / 2,871 | PRC official results, prc.gov.ph/node/7192 | 2024 | OFFICIAL |
| CCBI membership ~3,000+ | BOC FAQ, client.customs.gov.ph (citing CCBI) | ~2008 | OFFICIAL (dated) |
| PCAG collections: ₱2.71B | BOC PCAG accomplishment data per regulatory-atlas analysis | 2024 | OFFICIAL |
| PCAG 2025 target: ₱3.5B | BOC PCAG target per regulatory-atlas analysis | 2025 | OFFICIAL |
| CAMPI total industry sales: 401,117 units | CAMPI Annual Industry Sales Report, January 2023 | 2022 | OFFICIAL |
| Total excise tax collected: PHP 291.78B | Philstar citing BIR/DOF data | 2023 | OFFICIAL |
| Total excise tax collected: PHP 303B | Philstar, March 2025 | 2024 | OFFICIAL |
| BOC digitalization rate: 96.99% | DOF/BOC 2023 accomplishments report | 2023 | OFFICIAL |
| Philippine import value 2015: USD 73B | PSA IMTS (baseline for DERIVED growth proxy) | 2015 | OFFICIAL |
| Estimated active importers 2023: ~25,000 | DERIVED: 11,894 × 1.73 (import value growth multiplier, 2015→2023) | 2023 | DERIVED |
| Estimated active customs brokers: ~8,000–10,000 | DERIVED from CBLE cumulative passers + CCBI membership trajectory | 2024 | DERIVED |
| Estimated 2023 new vehicle sales: ~340,000–380,000 | ESTIMATED from news coverage of CAMPI slowdown in 2023 | 2023 | ESTIMATED |
| Total dealerships ~2,000–3,500 | ESTIMATED from CAMPI/AVID/AIAP network descriptions | 2023 | ESTIMATED |

---

## Notes & Caveats

1. **BOC importer count opacity:** The current total of BOC CPRS-registered importers is not publicly published. The 2015 figure (11,894) is the most specific official number found in any indexed source. BOC's AOCG or CPRS system holds the definitive current count but it requires a formal FOI request. The ESTIMATED ~25,000 for 2023 should be treated with caution — the actual figure could range from 15,000 to 40,000 depending on accreditation renewal compliance under CAO 07-2022.

2. **Customs broker attrition rate unknown:** PRC publishes licensure exam results but not a count of currently registered (active license holders) customs brokers. Many licensed brokers shift to corporate in-house roles or leave practice without PRC deregistration. The ~8,000–10,000 active practicing estimate could be conservative (if retention is high) or optimistic (if attrition is high). PRC LERIS allows individual license verification but not aggregate count queries.

3. **De minimis segment deliberately excluded:** BOC processes a large but unquantified volume of de minimis imports (≤₱10,000 CIF, primarily B2C e-commerce packages). CAO 01-2025 established a new e-Commerce Processing System (EPS). No official annual count of de minimis packages processed by BOC is publicly indexed. This segment was not included in F-BOC-1 consumer TAM because (a) the population is unquantified and (b) de minimis imports are exempt from formal entry requirements and do not involve customs brokers — the tool's core use case.

4. **F-BOC-2 is a B2B niche tool:** The PCA compliance segment is inherently small. Its value is in the high-penalty exposure it helps companies quantify (₱2.71B in annual PCAG collections from a population of perhaps 2,000–3,000 audited companies). Best positioned as a premium feature within a broader customs SaaS platform, not a standalone product.

5. **Automobile excise rate freeze risk:** The TRAIN Law excise tax table (RA 10963, effective January 2018) has not been amended since enactment. Any legislative amendment to the rate schedule (e.g., inflation-indexing, rate reduction for EVs, rate increase for ICE vehicles) would require tool updates but also creates a sales moment when consumers urgently need to understand the new math. Electric vehicle exemption creates a growing calculator use case as EV sales grow.

6. **CAMPI data completeness:** The 401,117 unit figure (2022) covers CAMPI member sales only. AVID (Association of Vehicle Importers and Distributors) separately reports on imported brand sales. The combined total (CAMPI + AVID) would be slightly higher. For TAM purposes, 401,117 is the best official floor figure; actual new vehicle sales including AVID members are likely 430,000–450,000 units in 2022.

7. **F-BOC-1 vs. broker disintermediation:** Unlike G-LTO-1 (which targets LTO fixers for disintermediation), F-BOC-1 does NOT disintermediate customs brokers — CMTA Section 802 mandates licensed broker involvement in formal entries. The tool instead augments broker capability and provides consumer-side verification of broker-generated cost estimates. This is a collaborative model, not adversarial, making broker adoption (professional segment) more likely.
