# TAM: Documentary Stamp Tax (DST) Engine (C4)

**Score:** 4.10
**Loop source:** compliance-moats

---

## Consumer Segment

**Who:** Two distinct consumer types:
1. **One-time DST payers (Form 2000-OT):** Individuals or entities involved in a one-time taxable document (deed of sale for real property, deed of donation, share transfer certificate, promissory note for personal loans). File Form 2000-OT concurrently with ONETT.
2. **Regular monthly DST filers (Form 2000):** Businesses and financial institutions that regularly issue taxable instruments (loan agreements, lease contracts, share certificates, warehouse receipts, insurance policies). Must file monthly by the 5th of the following month.

The DST Engine tool primarily addresses the **computation complexity** — there are 47 distinct taxable document types in the NIRC, each with different DST rates, and the rates vary by document type, transaction value, and year. Many taxpayers consistently miscalculate DST or apply incorrect schedules.

**Population — One-Time (Form 2000-OT):**
- This population equals the ONETT real property transaction population (~350,000–500,000/year) plus share transfers (~10,000–30,000/year) plus other one-time transactions
- Estimated **~380,000–550,000 Form 2000-OT transactions per year** — Source: DERIVED from A3 and A4 estimates above — Confidence: DERIVED

**Population — Regular Monthly Filers (Form 2000):**
- All businesses that issue qualifying instruments are obligated to file monthly
- BIR VAT-registered taxpayers: Estimated **1.7M–2.5M** — Source: data-sources-registry, BIR (VAT threshold at ₱3M) — Confidence: ESTIMATED
- Of these, significant monthly DST obligations exist for: financial institutions (all banks, lenders), lessors with commercial leases, companies issuing stock certificates, insurance companies
- **Active monthly Form 2000 filers**: Estimated **200,000–400,000 businesses** — this is those with material and regular DST obligations, not counting the many businesses that file zero DST returns — Source: ESTIMATED — Confidence: ESTIMATED (LOW)
- Banks alone: **~600 BSP-licensed banks + ~6,700+ rural banks/microfinance + ~3,500+ lending companies** = ~11,000+ financial institutions that file DST monthly — Source: BSP annual supervision statistics (2023); Lending Company Regulation Act registration database — Confidence: DERIVED
- Insurance companies: **~103 insurance companies** licensed by Insurance Commission (2023) — Source: Insurance Commission, Philippines — Confidence: OFFICIAL (insurance commission annual list)

**Total DST consumer addressable population:**
- One-time DST (Form 2000-OT): ~380,000–550,000 per year
- Monthly DST (Form 2000) — businesses with material DST obligations: ~200,000–400,000
- **Combined unique taxpayer addresses per year: ~500,000–800,000**

**Addressable fraction for Form 2000-OT consumers (individual property sellers):**
- Same logic as A3: ~30% addressable (internet + willing to use tool)
- Addressable: 465,000 (midpoint) × 30% = **~140,000**

**Addressable fraction for regular monthly DST filers:**
- Businesses filing Form 2000 are already digital; ~80% are addressable via digital tool
- Addressable: 300,000 (midpoint) × 80% = **~240,000**
- However, large financial institutions (banks, insurance) have internal systems; the real target is small-to-medium businesses — use **100,000** as addressable monthly filer segment

**Total addressable consumer population: ~240,000** (140,000 one-time + 100,000 regular)

**Current professional cost:**
- CPA fee for DST computation (embedded in broader ONETT service): no standalone pricing; DST is typically computed as part of ONETT package (₱5,000–₱15,000 total) — Confidence: ESTIMATED
- Bookkeeper hourly billing: ₱300–₱600/hour for DST preparation; a complex DST schedule might take 1–3 hours — Confidence: ESTIMATED

**Our consumer price:** ₱199/month subscription (covers both one-time and regular DST computations as part of broader tax toolkit)

**Consumer TAM:** 240,000 × ₱2,388/year = **₱573M/year**

Note: The monthly subscriber model is more appropriate for the Form 2000 segment (businesses with regular DST obligations). One-time consumers (Form 2000-OT) may prefer per-transaction pricing at ₱299–₱499.

**Consumer TAM (blended model):**
- 100,000 regular business filers × ₱199/month × 12 = ₱239M
- 140,000 one-time filers × ₱299 per transaction = ₱42M
- **Total Consumer TAM: ₱281M/year**

---

## Professional Segment

**Who:** Bookkeepers, accountants, CPAs in public practice, and tax practitioners who compute and file DST on behalf of multiple business clients. DST complexity (47 document types, varying rates, monthly filing cadence for some) makes this a recurring professional burden and high-value tool target.

**Population:**
- **BAS (bookkeeping and accounting services) practitioners**: Estimated **80,000–120,000** registered with DTI as sole proprietors providing bookkeeping/accounting services — Source: ESTIMATED from DTI BRNC registration data + PSA CPBI 2018 — Confidence: ESTIMATED
- **CPAs in public practice doing tax compliance**: ~30,000 (from A1 TAM) — Confidence: ESTIMATED
- **Bookkeepers (non-CPA) filing BIR forms**: Large informal sector; estimated **50,000–80,000** practicing bookkeepers — Source: ESTIMATED — Confidence: ESTIMATED
- **Addressable professional target** (those with multiple clients who regularly encounter DST obligations): **20,000–35,000** (use **27,000**) — Confidence: ESTIMATED

**Clients per professional per year:**
- A bookkeeper serving multiple SMEs handles 10–30 DST-relevant returns monthly across their client base
- Source: ESTIMATED — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro tier); ₱2,999/month (Practice tier for those with 10+ clients)

**Professional TAM:** 27,000 professionals × ₱999/month × 12 months = **₱324M/year**

---

## Total TAM

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (one-time, per transaction) | 140,000 transactions/year | ₱299/transaction | ₱42M |
| Consumer (monthly business filers) | 100,000 businesses | ₱199/mo | ₱239M |
| Professional (B2B) | 27,000 professionals | ₱999/mo/seat | ₱324M |
| **Total TAM** | | | **₱605M ≈ ₱605M** |

**SAM (Serviceable):** ₱181M — Rationale: ~30% of TAM serviceable in years 1–3. Core market = urban bookkeepers/CPAs managing SME clients + medium-sized businesses with regular DST (leasing companies, cooperative lenders, small insurance brokers). Large financial institutions (banks) are difficult to penetrate without enterprise sales.

**SOM Year 1 (1%):** ₱1.8M
**SOM Year 3 (5%):** ₱9.1M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| Form 2000-OT annual volume: ~380,000–550,000 | DERIVED from A3 + A4 ONETT estimates | N/A | DERIVED |
| BIR VAT-registered taxpayers: 1.7M–2.5M | BIR (cited in data-sources-registry) | ~2023 | ESTIMATED |
| BSP-licensed banks: ~600 | BSP annual banking supervision statistics | 2023 | OFFICIAL |
| Rural banks + microfinance: ~6,700+ | BSP / Bangko Sentral rural bank registry | 2023 | OFFICIAL |
| Lending companies: ~3,500+ | SEC (Lending Company Regulation Act database) | ~2023 | DERIVED |
| Insurance companies: 103 | Insurance Commission Philippines licensed insurers list | 2023 | OFFICIAL |
| DST taxable document types: 47 | NIRC (National Internal Revenue Code), as amended by TRAIN | 2018 | OFFICIAL |
| DST monthly filing deadline: 5th of following month | BIR RMC 100-2023 | 2023 | OFFICIAL |
| Monthly Form 2000 filers (active, material DST): 200K–400K | Not publicly available; ESTIMATED | N/A | ESTIMATED |

---

## Notes & Caveats

1. **Broadest consumer base in the property/transfer tax cluster:** DST affects virtually every business that issues documents — leases, loans, insurance policies, share certificates, deeds of sale. The 47 document types in the NIRC create genuine computational complexity and error risk.

2. **Critical data gap — Form 2000/2000-OT annual count:** BIR does not publish annual filing volumes for these forms. The consumer population estimate is built from bottom-up proxies (ONETT volume + financial institution count) but has significant uncertainty.

3. **Financial institutions dominate Form 2000 volume:** Banks and lending companies collectively issue tens of millions of loan documents per year — each potentially DST-obligated. However, large institutions have internal DST systems. The tool's commercial target is the long tail of small lending cooperatives, leasing companies, and SME-level bookkeepers, not the Big 4 banks.

4. **RMC 48-2024 (new Form 2000 version):** The BIR issued updated guidelines for the new version of the Monthly Documentary Stamp Tax Return in 2024, changing reporting requirements. This creates a short-term compliance anxiety moment that is exactly when a tool's adoption spikes.

5. **Bundling:** C4 (DST) naturally bundles with A3 (CGT Real Property) and C5 (PTT) for the ONETT transaction market. For the regular-filer segment, it bundles with B1 (Form Navigator), B2 (Penalty Calculator), and B3 (Compliance Calendar) as part of a broader monthly BIR filing assistant.

6. **TAM is the second-largest in this cluster:** ₱605M vs. A3's ₱292M and C1's ₱121M. DST's breadth across all business types and transaction categories makes it the widest-reach tool in the cluster, though penetration among large financial institutions will require enterprise sales cycles.
