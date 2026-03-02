# TAM: Property Transfer Tax Bundler (C5)

**Score:** 3.75
**Loop source:** compliance-moats

---

## Consumer Segment

**Who:** Buyers and sellers of real property who must pay the Local Government Unit (LGU) Transfer Tax — a local tax separate from BIR's CGT and DST — upon every onerous transfer of real property located within the LGU's jurisdiction. Imposed on the buyer (transferee) under the Local Government Code (RA 7160, Section 135) at the rate of 0.5% (municipalities/provinces) or 0.75% (cities/Metro Manila) of the consideration or fair market value, whichever is higher. Required before the Registry of Deeds will register the transfer.

**Population:**

The same population as A3 (CGT Real Property) — every real property sale that triggers a CGT obligation also triggers the LGU Transfer Tax. There is no separate registry of Transfer Tax payers, as it is collected by LGU Treasurer's Offices, not BIR.

- **Annual real property transfer transactions:** ~350,000–500,000 per year — Source: DERIVED from A3 analysis (same methodology: DHSUD LTS data + secondary market multiplier) — Confidence: DERIVED
- DHSUD Jan–Nov 2023: 123,985 residential units licensed to sell (annualized ~135,000) — Source: DHSUD press release, December 2023 — Confidence: OFFICIAL
- Residential building permits 2024: 116,427 — Source: DHSUD 2024 Yearender — Confidence: OFFICIAL
- PSA 2020 Census: 9.76M households acquired housing through purchase (historical cumulative; implies ~390,000–490,000/year if spread over 20–25 years) — Source: PSA 2020 Census — Confidence: OFFICIAL (Census basis); DERIVED (annual rate)
- **C5 tool-relevant population:** All real property buyers/sellers (~350,000–500,000/year); same as A3 but the consumer perspective is the **buyer** (who pays transfer tax) rather than the seller (who pays CGT)

**Addressable fraction:**
- Same urbanized, property-owning, internet-connected demographic as A3
- Transfer tax confusion is high: many buyers don't know this exists until they're at the RD/LGU treasurer's office
- However, the computation is simpler than CGT (fixed rate × max of consideration vs. FMV)
- Addressable: **25%** of total transactions (lower than A3 because the tool is simpler; many compute it manually without a tool)

**Addressable consumer population:** 425,000 (midpoint) × 25% = **106,250** ≈ **106,000** transactions/year

**Current professional cost:**
- Transfer tax is typically computed by the real estate broker, lawyer, or notary as part of the title transfer coordination — no standalone professional fee
- Transfer tax is part of the closing costs summary provided by developers or brokers; a formal computation is embedded in the ₱5,000–₱15,000 ONETT preparation service

**Our consumer price:** ₱199 per transaction (as a standalone tool, or included within a broader ONETT Suite at ₱499)

**Consumer TAM:** 106,000 × ₱199 = **₱21.1M/year**

Note: This tool's standalone value is limited. Its primary commercial model is as part of a bundled "Complete ONETT Tax Calculator" (A3 + C4 + C5 + C1) rather than as a standalone subscription. The bundled product justifies higher pricing.

**Bundled consumer TAM:** If A3 + C4-OT + C5 + C1 are bundled at ₱999 per ONETT transaction:
- 127,500 addressable property sellers/buyers × ₱999 = **₱127M/year**
- C5 contributes a component of this bundled value; allocated value ~₱127M × 20% = **₱25M/year**

---

## Professional Segment

**Who:** Real estate brokers, CPAs, and lawyers who regularly prepare closing cost estimates for clients — including transfer tax — and who need a tool that handles multiple LGU rate schedules (rate varies by city/municipality: 0.5% for municipalities and provinces, 0.75% for cities). The C5 tool is particularly useful for professionals serving clients across multiple LGUs where rates differ.

**Population:**
- **Active real estate brokers (PRC-licensed) handling property transactions:** ~10,000 (from A3 professional segment analysis) — Source: DERIVED — Confidence: DERIVED
- **Real estate lawyers preparing title transfer cost estimates:** ~5,000 — ESTIMATED
- **CPAs/transfer agents preparing ONETT cost computations:** ~4,000 — ESTIMATED
- **Total professional target:** ~19,000 (same base as A3) — the C5 tool is a natural add-on for any professional already using A3/C4

**B2B price per seat:** ₱999/month (included within the broader property transfer tax suite subscription)
- Incremental value of C5 as add-on to A3 subscriber: low (maybe ₱200–₱300/month additional)
- Most effectively monetized as part of a bundle rather than standalone

**Professional TAM (standalone):** 19,000 professionals × ₱500/month × 12 months = **₱114M/year**
(using ₱500/month as the allocated value within a broader bundle, rather than full ₱999/month seat price)

---

## Total TAM

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (per transaction) | 106,000 addressable transactions/year | ₱199/transaction | ₱21M |
| Professional (B2B, bundled) | 19,000 professionals | ₱500/mo allocated | ₱114M |
| **Total TAM** | | | **₱135M** |

**SAM (Serviceable):** ₱40M — Rationale: C5 as a standalone tool captures ~30% of TAM. However, C5 is primarily valuable as a bundled component of an ONETT suite (A3 + C4 + C5 + C1). In a bundled product, SAM estimate should be attributed to the bundle TAM rather than counted separately.

**SOM Year 1 (1%):** ₱0.4M
**SOM Year 3 (5%):** ₱2.0M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| LGU Transfer Tax rate: 0.5% (municipalities) / 0.75% (cities) | Local Government Code RA 7160, Section 135 | 1991 (still applicable) | OFFICIAL |
| Annual property transfer transactions: ~350,000–500,000 | DERIVED from DHSUD LTS data + PSA Census + secondary market multiplier | N/A | DERIVED |
| DHSUD residential LTS units 2023: 123,985 | DHSUD press release / MB.com.ph | Jan–Nov 2023 | OFFICIAL |
| Building permits 2024: 116,427 | DHSUD 2024 Yearender | 2024 | OFFICIAL |
| PSA households purchased housing: 9.76M cumulative | PSA 2020 Census | 2020 | OFFICIAL |
| LGU Transfer Tax payer count (annual) | Not publicly available | N/A | — |

---

## Notes & Caveats

1. **Lowest standalone value in the cluster:** C5 computes a single-rate local tax at a fixed percentage of the higher of consideration vs. FMV. The computation is relatively simple. Standalone consumer TAM is modest (₱21M). Value is primarily in: (a) multi-LGU rate handling, (b) determining the correct FMV comparison basis (BIR zonal value vs. LGU schedule of market values — these differ), and (c) bundling within a comprehensive ONETT suite.

2. **LGU Schedule of Market Values (SMV) creates real complexity:** The "fair market value" for LGU transfer tax purposes is determined by the LGU's own Schedule of Market Values (SMV), updated every 3 years, which often differs from BIR zonal values. A tool that integrates both zonal values and LGU SMV schedules — and picks the higher — would have genuine practical value beyond a simple rate calculator.

3. **Bundled product strategy is the right commercial model:** C5 TAM should not be counted independently if the business strategy is to bundle with A3 + C4 + C1. Additive counting would overstate total TAM for the cluster.

4. **Double-counting note for synthesis table:** When the synthesis-master-tam-table compiles all tools, A3 + C4-OT + C1 + C5 address essentially the same triggering event (a real property transfer). For bundled pricing, the total consumer TAM for ONETT tools should be calculated once at the bundle level (not summed across all 4 tools separately), to avoid double-counting the same 350,000–500,000 annual transactions.

5. **Market share of transfer tax computation within title transfer process:** In practice, the real estate broker or developer's sales team already handles transfer tax computation as a standard closing cost estimate. The tool's disruptive value is accuracy (eliminates LGU rate confusion) and speed, not the underlying computation — positioning it as a professional productivity tool, not a consumer necessity.
