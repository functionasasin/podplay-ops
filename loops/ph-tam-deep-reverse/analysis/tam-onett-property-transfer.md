# TAM: ONETT Property Transfer Tools (O-LRA-1 through O-LRA-4)

**Scores:** O-LRA-1 (ONETT Deadline): 3.80 | O-LRA-2 (ONETT Pipeline): 3.75 | O-LRA-3 (Zonal Value): 3.60 | O-LRA-4 (LRA Fees): 3.40
**Loop source:** regulatory-atlas

---

## Tools in This Cluster

| Tool ID | Name | Core Function |
|---------|------|---------------|
| O-LRA-1 | ONETT Deadline Calculator | CGT 30-day + DST 5-day deadlines; eCAR 2-year expiry; PD 1529 Sec. 117 double-fee threshold |
| O-LRA-2 | ONETT Pipeline Tracker | Full 4-agency sequential workflow: BIR ONETT → LGU Transfer Tax → Assessor → LRA Registry of Deeds |
| O-LRA-3 | BIR Zonal Value Lookup | Address-level BIR zonal value per sqm lookup (per RDO-published schedules) |
| O-LRA-4 | LRA Registration Fee Calculator | 17-tier LRA graduated registration fee + annotation fees (₱20/item) + PD 1529 Sec. 117 double-fee flag |

**Governing statutes:** PD 1529 (Property Registration Decree); NIRC Sec. 24(D) [CGT], Sec. 196 [DST], Sec. 248–250 [penalties]; RA 7160 Sec. 135 [LGU transfer tax]; RR 3-2019 [eCAR system]; BIR zonal value RRs (per city/municipality).

---

## Consumer Segment

**Who:** Any party to a real property transfer requiring a Certificate Authorizing Registration (eCAR) from BIR and subsequent title registration at the Registry of Deeds — i.e., the seller, buyer, or representative managing the full ONETT-to-LRA pipeline. Distinct from A3 (CGT computation only): these tools cover the full multi-agency pipeline from deed of sale through new title issuance.

**Population — Annual ONETT Transactions Requiring LRA Pipeline:**

BIR does not publish annual Form 1706 counts or total ONETT transaction volumes publicly. The following derivation uses the best available supply-side and proxy sources:

**Sub-component 1 — CGT real property sales (BIR Form 1706):**
- 123,985 residential units covered under new License-to-Sell projects issued by DHSUD, January–November 2023 — Source: DHSUD press release / MB.com.ph, December 2023 — Confidence: OFFICIAL (partial year; annualized ≈ 135,000/year for new developer-sold residential units)
- 116,427 residential building permits issued in 2024 — Source: DHSUD 2024 Yearender Statistics / PSA Construction Statistics — Confidence: OFFICIAL. This bounds the new-construction market at ~115,000–135,000 new residential property events per year
- Secondary-market resale (existing homes): ESTIMATED 180,000–270,000 transactions/year — DERIVED: primary market × 1.5–2.0x secondary multiplier (standard emerging-market real estate ratio; no PH-specific secondary resale count publicly available)
- Commercial, industrial, agricultural land transfers: ESTIMATED 50,000–100,000 transactions/year
- **Subtotal Form 1706 (CGT real property) estimate: 350,000–500,000/year** — Confidence: DERIVED
- Cross-check A: PSA 2020 Census of Population and Housing shows 9.76M households (45.2% of 21.58M) acquired housing through purchase. If housing stock accumulates over ~25 years, implied annual purchase transaction rate ≈ 390,000/year — broadly consistent
- Cross-check B: BIR cumulative ONETT taxpayer count ~6,000,000 (BIR via Statista, 2023). ONETT TIN classification started approximately 1998 (RMO 6-1998). Over ~25 years: 6M / 25 = 240,000/year average across all ONETT types. Real property CGT is the largest single ONETT category; current annual volume likely above the 25-year average given population and real estate sector growth

**Sub-component 2 — Non-CGT ONETT transactions with real property and LRA pipeline:**
- Estate tax (BIR Form 1801) involving titled real property: PSA registered deaths 2023 = ~745,000. Property ownership rate among adult decedents: ESTIMATED ~15–20% have titled real property in their estate requiring eCAR. → ~112,000–149,000 potential estate tax real property situations/year; but many are unregistered or involve small landholdings. Practical formal ONETT estate filings: ESTIMATED 40,000–70,000/year — Confidence: ESTIMATED
- Donor's tax (BIR Form 1800) with real property: ESTIMATED 20,000–40,000/year (intergenerational gifts of real property; no BIR published count) — Confidence: ESTIMATED
- Foreclosure, judicial partition, expropriation, and other transfers: ESTIMATED 25,000–50,000/year — Confidence: ESTIMATED

**Total all ONETT transaction types (all requiring BIR eCAR + LRA registration): 435,000–660,000/year**
- Use **500,000/year** as working midpoint — Confidence: DERIVED (heavily dependent on secondary-market multiplier)

**Addressable fraction:**
- Urban property-owning class with internet access: ~80% of this population (formal titled property is concentrated in urban and peri-urban areas; PSA 2023: 72% internet penetration; property transaction participants skew higher-income → use 80%)
- Fraction willing to use a digital tool vs. delegating entirely to a lawyer/broker: ~35–40% (unlike salaried workers, property sellers have a stronger motivation to understand costs before engaging professionals, given the ₱20K–₱30K processing fee at stake)
- Combined: 80% × 38% = **30% addressable fraction** (same basis as A3)

**Addressable consumer population:** 500,000 × 30% = **150,000 consumers/year** (one-time per transaction)

**Current professional cost:**
- Full title transfer processing service (Metro Manila): ₱20,000 flat fee — Source: KeyRealty.ph / FileDocsPhil.com cost guides — Confidence: ESTIMATED
- Full title transfer processing service (outside Metro Manila): ₱30,000 flat fee — Source: Same real estate community sources — Confidence: ESTIMATED
- Real estate lawyer engagement (full coordination): ₱15,000–₱50,000 per transaction — Source: Respicio.ph commentaries, PinoyExchange forums — Confidence: ESTIMATED
- Runner/fixer (partial, specific agency only): ₱5,000–₱15,000 — Source: Community forums — Confidence: ESTIMATED

**Our consumer price:** ₱499 per transaction (one-time full pipeline computation: all four O-LRA tools bundled — deadline dates, total tax computation, zonal value lookup, LRA fee estimate, per-agency checklist)

**Consumer TAM:** 150,000 × ₱499 = **₱74.9M ≈ ₱75M/year**

---

## Professional Segment

**Who (primary — ONETT transaction professionals):**
Real estate brokers, conveyancing lawyers, CPAs, and licensed transfer processing agents who manage the full ONETT-to-LRA pipeline for multiple clients per year. These professionals use all four O-LRA tools per transaction: deadline tracking (O-LRA-1), pipeline management (O-LRA-2), zonal value confirmation (O-LRA-3), and LRA fee estimates for client billing (O-LRA-4).

**Who (additional — Zonal Value practitioners, O-LRA-3 standalone):**
Real estate appraisers and bank mortgage loan officers who need BIR zonal value regularly for appraisal and underwriting purposes, outside of active ONETT filing contexts.

**Population — ONETT Pipeline Professionals:**

- **Active PRC-licensed real estate brokers: 15,000** — Source: DERIVED from REBLE historical passers:
  - 2011: 3,185 | 2012: 3,192 | 2013: 1,928 | 2014: 2,048 | 2015: 5,220 | 2016: 5,499 | 2017: 841 | 2018: 0 (postponed) | 2019: 204 | 2020–2021: 0 (COVID) | 2022: 584 | 2023: 581 | 2024: 1,337 | 2025: 1,306
  - Cumulative exam passers 2011–2024: **~25,619** (OFFICIAL: PRC press releases via Manila Bulletin, Rappler, BoardExams.ph, The Summit Express, 2011–2025)
  - Pre-RESA grandfathered DTI-licensed brokers converted under RA 9646 Sec. 20 (deadline July 31, 2011): PRC Resolution No. 18 (Sep 2011) approved 1,804 brokers in one batch; Resolution No. 15 (Aug 2011) approved 606. Total grandfathered conversions: not published in aggregate; ESTIMATED 10,000–20,000 — Confidence: ESTIMATED (Source: foreclosurephilippines.com, PRC resolutions)
  - Total ever-registered: ~35,000–45,000 cumulative
  - License attrition (non-renewal every 3 years, exits from profession): ESTIMATED 35–40%
  - Active licensed brokers: **15,000–20,000** (DERIVED). Use **15,000** (conservative)
  - Note: PAREB voluntary association membership ~5,000 across 68 boards — Source: PAREB website (pareblistings.com) — Confidence: OFFICIAL. This represents ~25–33% of active brokers organized in associations.

- **Real estate lawyers doing conveyancing and title transfers: 5,000** — Source: ESTIMATED
  - Roll of Attorneys (Supreme Court): 84,236 as of November 2022 (OFFICIAL via deborjalaw.com) + ~7,954 new admittees 2023–2024 = ~92,190 total
  - Active practicing lawyers (living): estimated 50,000–65,000
  - Real property / real estate law as a practice area: ~6–8% of practicing lawyers (based on IBP chapter surveys cited in academic sources; no official IBPPH published practice-area breakdown)
  - 60,000 active lawyers × 8% = ~4,800 → use **5,000** — Confidence: ESTIMATED

- **CPAs and licensed transfer processing agents doing ONETT regularly: 4,000** — Source: ESTIMATED
  - CPAs in public practice (tax/accounting services): ~30,000 estimated active
  - Fraction whose client base includes property transactions: ~10%
  - Use 3,000 CPAs + 1,000 licensed processing agents = 4,000 — Confidence: ESTIMATED

- **Sub-total core ONETT professionals: 24,000**; use **20,000** after overlap adjustment (some brokers also hold law degrees or CPAs; and not all 24,000 handle multiple transactions per year with enough frequency to justify a subscription)

**Clients per professional per year:**
- Active real estate broker: 4–15 transaction closings/year (many brokers are part-time or do fewer than 10 closings) — Source: Industry practitioner norms, ESTIMATED
- Real estate lawyer: 20–80 ONETT files per year (full-time practice) — Source: ESTIMATED
- CPA/transfer agent: 30–150 filings/year — Source: ESTIMATED

**Population — Zonal Value Practitioners (O-LRA-3 additional users beyond ONETT practitioners):**

- **Active real estate appraisers: 8,000** — Source: ESTIMATED
  - REALE passers by year: 2015: 2,462; 2016: 1,271; 2017: 555; 2023: 596 (OFFICIAL: PRC press releases) — approximate cumulative from 2010 exams through 2024: ~10,000–13,000 exam passers
  - Plus grandfathered DTI-era appraisers + grandfathered public sector assessors — ESTIMATED additional 5,000–8,000
  - Total registered: ~15,000–21,000; active practicing subset: **~8,000** (many work in-house at government or banks, reducing standalone subscription need)
  - Confidence: ESTIMATED

- **Bank mortgage loan officers needing zonal value regularly: 5,000** — Source: ESTIMATED
  - BSP supervised banks with active residential mortgage portfolios: ~460 banks (universal/commercial/thrift/rural)
  - Not all branches originate mortgages; active mortgage origination concentrated in ~2,000–3,000 branches
  - Officers per branch who regularly use zonal value for loan-to-value computation: ~2–3 per branch
  - ESTIMATED 5,000–8,000 bank officers; use **5,000** (conservative) — Confidence: ESTIMATED

- **Net additional for O-LRA-3 standalone** (beyond the 20,000 core ONETT professionals): 13,000 appraisers + bank officers, minus 3,000 overlap with core ONETT professional segment = **10,000 net additional** — Confidence: ESTIMATED

**Total unique professionals across all O-LRA tools: 20,000 + 10,000 = 30,000**

**B2B price per seat:**
- ONETT pipeline professionals (20,000): ₱999/month (Solo Pro tier — multiple transactions/year, full tool suite)
- Zonal value additional practitioners (10,000): ₱499/month (lower tier — lookup-primary use; occasional full pipeline)

**Professional TAM:**
- ONETT professionals: 20,000 × ₱999/month × 12 = ₱239.8M
- Zonal value practitioners: 10,000 × ₱499/month × 12 = ₱59.9M
- **Total Professional TAM: ₱300M/year** (rounded)

---

## Total TAM

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct — per transaction) | 150,000 addressable transactions/year | ₱499/transaction | ₱75M |
| Professional — ONETT pipeline (B2B) | 20,000 professionals | ₱999/mo/seat | ₱240M |
| Professional — Zonal Value additional (B2B) | 10,000 appraisers + bank officers | ₱499/mo/seat | ₱60M |
| **Total TAM** | | | **₱375M** |

**SAM (Serviceable):** ₱113M — Rationale: ~30% of TAM is immediately serviceable in years 1–3. Primary serviceable market = Metro Manila, Cebu, Davao formal property markets where eONETT adoption is highest (BIR launched eONETT in 2023 under RMC No. 56-2023, currently covering property sales only). Excludes: informal market transactions not going through formal ONETT, rural land transfers with low digital access, non-practitioner consumers in provinces.

**SOM Year 1 (1%):** ₱1.1M
**SOM Year 3 (5%):** ₱5.6M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| DHSUD License-to-Sell units: 123,985 | DHSUD press release / MB.com.ph | Jan–Nov 2023 | OFFICIAL |
| Residential building permits: 116,427 | DHSUD 2024 Yearender Statistics / PSA | 2024 | OFFICIAL |
| PSA census purchased housing units: 9.76M cumulative | PSA 2020 Census of Population and Housing | 2020 | OFFICIAL |
| BIR cumulative ONETT taxpayers: ~6,000,000 | BIR via Statista | 2023 | OFFICIAL |
| REBLE exam passers by year (2011–2025) | PRC press releases via Manila Bulletin, Rappler, BoardExams.ph | 2011–2025 | OFFICIAL |
| Grandfathered broker conversions: individual batches cited | PRC Resolutions No. 15, 18 (2011) via foreclosurephilippines.com | 2011 | OFFICIAL (partial batches) |
| PAREB membership: ~5,000 | PAREB website (pareblistings.com) | ~2024 | OFFICIAL |
| Roll of Attorneys: 84,236 | Supreme Court OBC via deborjalaw.com | Nov 2022 | OFFICIAL |
| REALE passers: 2,462 (2015); 1,271 (2016); 555 (2017); 596 (2023) | PRC press releases via boardexamresultsph.com | 2015–2023 | OFFICIAL |
| Title transfer processing fee: ₱20K (MM) / ₱30K (outside MM) | KeyRealty.ph, FileDocsPhil.com | ~2024 | ESTIMATED |
| Secondary-market multiplier: 1.5–2.0× primary market | Standard emerging-market real estate ratio | N/A | ESTIMATED |
| Estate tax real property ONETT fraction: ~40K–70K/year | DERIVED: PSA deaths 745,000 × ~10% with titled real property | 2023 | ESTIMATED |

---

## Notes & Caveats

1. **Core data gap — annual ONETT/Form 1706 count:** BIR does not publicly publish annual counts of Form 1706 returns filed, total ONETT transactions, or total eCARs issued per year. The 500,000/year figure is a DERIVED/ESTIMATED midpoint. An FOI request to BIR's Statistics Division would directly resolve this. The BIR eONETT system (RMC No. 56-2023, launched 2023) will likely produce public throughput metrics within 1–2 years.

2. **LRA annual title transfer count:** LRA publishes "Title Issuances per Region" data on its Property Transaction Statistics page (lra.gov.ph/property-transaction-statistics/), but the most recent downloadable PDFs are from 2020/2021 (EODB filings) and do not show annual flow data in a publicly extractable format. An FOI to LRA would clarify current annual volumes. The 2020/2021 LRA data would be a floor; current volumes are higher given post-pandemic real estate activity.

3. **Per-transaction vs. subscription mismatch (consumer):** Property sellers transact once every 5–15 years. A monthly subscription is a poor fit for consumers; per-transaction pricing (₱499–₱999) is more appropriate. The consumer TAM uses per-transaction pricing. The professional TAM correctly uses monthly subscriptions (professionals do multiple transactions/year).

4. **O-LRA-3 (Zonal Value) as a standalone viral product:** The zonal value tool has demand beyond active ONETT practitioners. Any property owner considering a purchase, refinance, or tax declaration dispute needs zonal value. This creates a freemium consumer layer (free lookup, conversion to paying users for full pipeline computation) that could substantially expand the consumer TAM beyond the 150,000 active transactors. Not modeled here because the freemium conversion rate is speculative.

5. **Overlap with A3 (CGT Real Property, compliance-moats):** Both A3 and O-LRA tools address the same underlying population of property sellers. A3 computes CGT specifically; O-LRA tools manage the full pipeline. In practice these would be bundled into one product. The TAMs should be treated as additive for professional B2B pricing (professionals would pay for a comprehensive tool covering both CGT computation and pipeline management), but would overlap for consumer pricing (a consumer using A3 would likely also use O-LRA-1/-2). Net combined TAM for an integrated product = A3 + O-LRA less ~30% consumer overlap ≈ ₱292M + ₱375M × 70% = ~₱554M.

6. **Grandfathered broker count unresolved:** The 15,000–18,000 active broker estimate carries significant uncertainty. The 2016 Lamudi figure of ~40,000 total licensed brokers (which would have included all exam passers 2011–2016 plus all grandfathered DTI brokers) has not been confirmed by a PRC official count and may not be directly comparable. Current active count after 2017–2021 REBLE disruptions (exam postponement and COVID cancellations) is lower. Use the 15,000 conservative estimate for professional TAM.

7. **eONETT coverage expansion:** As of launch in 2023, the eONETT system only covers property sales (not estate, donor, or other ONETT categories). BIR has stated intent to expand coverage. Expansion would increase digital ONETT volume and directly enlarge the tool's addressable market.
