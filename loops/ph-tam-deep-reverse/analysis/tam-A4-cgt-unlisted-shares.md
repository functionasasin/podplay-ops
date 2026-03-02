# TAM: CGT — Unlisted Shares + DST (A4)

**Score:** 4.05
**Loop source:** compliance-moats

---

## Consumer Segment

**Who:** Individuals and domestic corporations that sell, exchange, or transfer shares of stock of Philippine domestic corporations that are NOT listed on the Philippine Stock Exchange (PSE). Includes M&A transactions, family business ownership changes, buyouts of minority shareholders, retirement of a partner, OFW-backed business sales, and SME equity transfers. Must file BIR Form 1707 within 30 days of each transaction and pay 15% CGT on the net capital gain (individual sellers) or 15% (domestic corporate sellers).

**Population:**

No official annual count of Form 1707 returns filed is publicly available. The following derivation uses SEC and PSE data:

- **527,710 total active SEC-registered companies** as of end-2024 (includes stock corporations, OPCs, non-stock, partnerships) — Source: SEC press release / BusinessMirror, February 2025 — Confidence: OFFICIAL
  - Only stock corporations with privately held shares are subject to CGT on share transfers (listed shares pay Stock Transaction Tax, not CGT)
  - PSE-listed companies as of 2023: **~265 listed companies** — Source: PSE monthly market bulletin — Confidence: OFFICIAL
  - Active stock corporations (unlisted): ~527,710 total minus ~265 listed = **~527,445 companies** with potentially unlisted shares
- **Annual share transfer transactions (Form 1707 filers):** No official count. Derived as follows:
  - SEC receives disclosed ownership change reports from public companies (not useful for unlisted)
  - PSA CPBI 2018 (latest available Census of Philippine Business & Industry): ~950,000 establishments; of these, ~5–10% of enterprise-level ownership changes (M&A, buyouts) occur in any given year — very rough
  - More realistic proxy: **DTI-reported annual MSME business sales/transfers**: no public count
  - Court-filed SEC cases involving disputed share transfers, M&A disclosures: hundreds per year (not representative of all transfers)
  - Conservative estimate: **~10,000–30,000 Form 1707 returns filed per year** — Source: ESTIMATED (triangulated from SEC active corporation count × annual ownership-change rate of ~2–5% applicable to actively traded private companies) — Confidence: ESTIMATED (LOW)
  - This estimate includes: family business generational transfers (~5,000–10,000/year), SME equity sales (~3,000–8,000/year), formal M&A (~500–2,000/year), other OTC transactions (~1,500–10,000/year)

**Addressable fraction:**
- Unlisted share CGT involves sophisticated parties (company owners, lawyers, CPAs)
- ~90% have internet access; ~70% would consider a digital tool to verify computation
- Combined: **70%** addressable

**Addressable consumer population:** 20,000 (midpoint) × 70% = **14,000** transactions/year

**Current professional cost:**
- CPA or corporate lawyer computing CGT on unlisted shares: ₱5,000–₱25,000 per transaction (depends on complexity: simple share transfer vs. multi-tier ownership structure) — Source: ESTIMATED from law firm and CPA blog discussions — Confidence: ESTIMATED
- Full M&A tax due diligence: ₱100,000–₱500,000+ (not addressable by a tool)

**Our consumer price:** ₱999 per transaction (more complex than real property; tool assists with Book Value Method computation and RR 20-2020 FMV rules)

**Consumer TAM:** 14,000 × ₱999 = **₱14.0M/year**

---

## Professional Segment

**Who:** Corporate lawyers, CPAs in public practice, and M&A advisors who handle unlisted share transfers for clients — computing CGT, advising on FMV under RR 20-2020, and ensuring Form 1707 compliance across multiple engagements per year.

**Population:**
- **Corporate lawyers doing M&A and share transfer work (IBP members):** Estimated **2,000–4,000** — Source: ESTIMATED based on IBP total ~60,000–70,000+ members; corporate/M&A practice is ~3–6% of the bar — Confidence: ESTIMATED
- **CPAs doing corporate transaction tax work:** Estimated **3,000–6,000** — subset of ~200,000 CPAs in commerce & industry and public practice; those handling business sales and equity restructuring — Confidence: ESTIMATED
- **Total addressable professional market:** ~5,000–10,000 (use **7,000**) — Confidence: ESTIMATED

**Clients per professional per year:**
- A corporate lawyer handling share transfers typically manages 5–20 unlisted share transfer files per year
- A transaction CPA handles 10–40 such engagements
- Source: ESTIMATED — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 7,000 professionals × ₱999/month × 12 months = **₱84M/year**

---

## Total TAM

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (per transaction) | 14,000 addressable transactions/year | ₱999/transaction | ₱14M |
| Professional (B2B) | 7,000 professionals | ₱999/mo/seat | ₱84M |
| **Total TAM** | | | **₱98M** |

**SAM (Serviceable):** ₱29M — Rationale: ~30% of TAM is serviceable in years 1–3. Primarily corporate lawyers, CPAs in Manila/Cebu/Davao who handle deal work for SMEs. Large M&A (₱50M+ deals) typically uses Big 4 advisors who have internal tools. Target: mid-market practitioners handling SME and family business transfers.

**SOM Year 1 (1%):** ₱0.3M
**SOM Year 3 (5%):** ₱1.5M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| Active SEC-registered companies: 527,710 | SEC press release / BusinessMirror | End-2024 | OFFICIAL |
| PSE-listed companies: ~265 | PSE monthly market bulletin | 2023 | OFFICIAL |
| Annual Form 1707 filings: ~10,000–30,000 | Not publicly available; ESTIMATED from active stock corp count × ownership-change rate | N/A | ESTIMATED (LOW) |
| IBP total lawyer membership: ~60,000–70,000 | IBP national / various media | ~2023 | ESTIMATED |
| CPA CGT fee: ₱5K–₱25K | CPA blog discussions, ESTIMATED | N/A | ESTIMATED |

---

## Notes & Caveats

1. **Critical data gap — Form 1707 annual count:** No Philippine government agency publicly reports annual Form 1707 filing volume. This is the single most important unknown for this TAM. The 10,000–30,000 estimate has very low confidence. SEC, BIR, or a NTRC research paper would be needed to nail this down.

2. **RR 20-2020 created a mandatory computation step:** Under Revenue Regulations 20-2020 (September 2020), the FMV of unlisted shares must be determined using the latest audited financial statements (AFS) prior to the sale date, and specifically the Adjusted Net Asset Method (book value) or another method approved by the BIR. This regulation created a specific computation need that a tool can systematize.

3. **Donor's tax interaction:** If a share transfer is at below-FMV consideration, the difference may be treated as a donation subject to donor's tax (Form 1800). A well-designed A4 tool should flag this risk and hand off to the C1 tool where needed.

4. **LOW TAM relative to A3:** The consumer TAM here (₱14M) is ~22% of A3's consumer TAM. This tool's value is primarily in the professional segment (₱84M) and as a bundled add-on for CPAs and corporate lawyers who already subscribe for other tools.

5. **Bundling opportunity:** A4 + A3 + C4 (DST on shares) can be bundled into a single "Property and Asset Transfer Tax Suite" — which would serve the same professional user base and justify a higher combined subscription price.
