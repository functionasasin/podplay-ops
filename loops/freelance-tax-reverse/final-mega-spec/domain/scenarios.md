# Scenarios — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** Initial enumeration complete. Full expansion with additional scenario codes and quarterly-filing scenarios is handled by the `scenario-enumeration` Wave 2 aspect.
**Last updated:** 2026-03-01

Each scenario code corresponds to a distinct computation path and taxpayer profile. Every scenario code MUST have at least one test vector in [../engine/test-vectors/exhaustive.md](../engine/test-vectors/exhaustive.md).

---

## Scenario Code Structure

Format: `SC-{profile_type}-{income_range}-{method}-{special_flag}`

- **profile_type:** P (professional/service), B (business/trading), M (mixed income)
- **income_range:** L (low ≤500K), ML (mid-low 500K-1M), MH (mid-high 1M-2M), H (high 2M-3M), VH (very high >3M)
- **method:** 8 (8% flat), O (OSD), I (itemized)
- **special_flag:** none, CWT (has significant CWT), VAT (VAT registered), FIRST (first year), NEW (new registrant mid-year)

---

## Scenario Codes (Initial Enumeration)

### Group 1: Pure Service/Professional — Below ₱3M Threshold (8% Eligible)

| Code | Profile | Gross Receipts | Expenses | Method | Notes |
|------|---------|---------------|---------|--------|-------|
| SC-P-L-8 | Freelancer | ₱100,000–₱500,000 | Minimal | 8% flat | Low-income; might be better on itemized if expenses zero |
| SC-P-L-O | Freelancer | ₱100,000–₱500,000 | Minimal | OSD | Uses graduated; inefficient but chosen |
| SC-P-L-I | Freelancer | ₱100,000–₱500,000 | High (>80%) | Itemized | Rare but possible at very high expense ratio |
| SC-P-ML-8 | Professional | ₱500,000–₱1,000,000 | 0–40% | 8% flat | Most common and usually optimal |
| SC-P-ML-O | Professional | ₱500,000–₱1,000,000 | Any | OSD | Suboptimal (8% wins), but permitted |
| SC-P-ML-I | Professional | ₱500,000–₱1,000,000 | >68% | Itemized | Only optimal at very high expense ratio |
| SC-P-MH-8 | Professional | ₱1,000,000–₱2,000,000 | 0–60% | 8% flat | 8% optimal for most in this range |
| SC-P-MH-O | Professional | ₱1,000,000–₱2,000,000 | Any | OSD | Suboptimal |
| SC-P-MH-I | Professional | ₱1,000,000–₱2,000,000 | >60% | Itemized | Optimal when high expense ratio |
| SC-P-H-8 | Professional | ₱2,000,000–₱3,000,000 | 0–58% | 8% flat | Still available; significant savings vs OSD |
| SC-P-H-O | Professional | ₱2,000,000–₱3,000,000 | Any | OSD | Suboptimal |
| SC-P-H-I | Professional | ₱2,000,000–₱3,000,000 | >58% | Itemized | Optimal when very high expenses |

### Group 2: Pure Service/Professional — Above ₱3M (VAT Registered, 8% NOT Available)

| Code | Profile | Gross Receipts | Expenses | Method | Notes |
|------|---------|---------------|---------|--------|-------|
| SC-P-VH-O-VAT | Professional | >₱3,000,000 | Any | OSD | VAT registered; Path B only vs Path A |
| SC-P-VH-I-VAT | Professional | >₱3,000,000 | >60% | Itemized | VAT registered; Path A may win with high expenses |

### Group 3: Mixed Income Earners (Employee + Freelancer)

| Code | Profile | Compensation | Biz Gross | Biz Method | Notes |
|------|---------|-------------|----------|-----------|-------|
| SC-M-L-8 | Employee + Freelancer | Any | ≤₱500,000 | 8% (no ₱250K deduction) | Small side income |
| SC-M-ML-8 | Employee + Freelancer | Any | ₱500K–₱1M | 8% (no ₱250K deduction) | Moderate side income |
| SC-M-MH-8 | Employee + Freelancer | Any | ₱1M–₱2M | 8% (no ₱250K deduction) | Significant side income |
| SC-M-ML-O | Employee + Freelancer | Any | ₱500K–₱1M | OSD combined | Combined graduated |
| SC-M-ML-I | Employee + Freelancer | Any | ₱500K–₱1M | Itemized combined | Combined graduated |

### Group 4: First-Year / New Registrants

| Code | Profile | Notes |
|------|---------|-------|
| SC-FIRST-8 | New registrant, first year, registered Q1 (Jan–Mar) | 8% available; election on COR or Q1 1701Q due May 15 |
| SC-FIRST-O | New registrant, first year, registered Q1 | OSD election on Q1 1701Q |
| SC-FIRST-MID-Q2 | Registered April–June (mid-year, Q2) | First quarterly return is Q2 (due August 15); Q2 is election quarter; 8% election possible; no Q1 return required |
| SC-FIRST-MID-Q3 | Registered July–September (mid-year, Q3) | First quarterly return is Q3 (due November 15); Q3 is election quarter; 8% election possible; no Q1 or Q2 return required |
| SC-FIRST-MID-Q4 | Registered October–December (mid-year, Q4) | No quarterly returns at all for registration year; only annual 1701/1701A due April 15 next year; if graduated: Q4 2551Q due January 25 next year |

### Group 5: CWT-Heavy Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-P-ML-8-CWT | Service provider, 8% rate | Large CWT credits may exceed annual IT; full or partial refund/TCC/carryover disposition at annual; quarterly: CWT offsets incremental payments |
| SC-P-ML-O-CWT | Service provider, graduated+OSD | CWT accumulates across Q1/Q2/Q3; Item 57 (prior-quarter CWT) plus Item 58 (new CWT) tracked separately each quarter |
| SC-P-ML-8-CWT-PLATFORM | Freelancer on Upwork/Payoneer | RR 16-2023 1% platform withholding (ATC WI760) plus 5% client EWT (WI010); both types of 2307 credited against income tax |

### Group 6: Threshold Crossing

| Code | Profile | Notes |
|------|---------|-------|
| SC-CROSS-3M | Pure service provider | Gross crosses ₱3M mid-year during Q2 or Q3; 8% retroactively cancelled; retroactive 3% PT computed; all 8% quarterly payments credited toward graduated annual tax; Form 1701 required at annual |
| SC-AT-3M | Pure service provider | Gross receipts exactly ₱3M at year-end; boundary condition: 8% eligible (≤₱3M), SMALL tier, not VAT-required; annual IT = (₱3,000,000 − ₱250,000) × 8% = ₱220,000 |
| SC-NEAR-3M | Pure service provider | Gross ₱2,800,000–₱2,999,999; 8% still available; engine shows savings vs OSD (₱76,000–₱83,800 advantage for 8%) and highlights risk if Q4 earnings push over ₱3M |

### Group 7: Special Deduction Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-NOLCO | Sole proprietor, graduated+itemized | Prior year net operating loss carry-over; NOLCO deductible only under itemized (not OSD/8%); 3-year FIFO expiry; quarterly NOLCO applied proportionally |
| SC-ZERO-EXPENSE | Professional (online freelancer) | No business expenses at all; 8% almost always optimal; quarterly: all Schedule II with ₱250K deduction; annual 1701A |
| SC-HIGH-ENTERTAIN | Agency/professional | Entertainment/representation/transportation expenses capped at 1% of gross receipts (service) or 0.5% of net sales (goods) per RR 10-2002; EAR cap computed at annual level |

### Group 8: Quarterly-Cycle–Specific Scenarios

Scenarios that exercise the multi-quarter cumulative computation specifically:

| Code | Profile | Notes |
|------|---------|-------|
| SC-QC-8-3Q | 8% pure SE, three full quarters | Cumulative gross builds Q1→Q2→Q3; ₱250K deduction applied each quarter via Item 52; quarterly tax payable varies by quarter due to cumulative structure; annual reconciliation shows balance |
| SC-QC-OSD-3Q | Graduated+OSD, three full quarters | Item 36 (current quarter) + Item 42 (prior NTI carryforward) builds cumulative NTI; bracket escalation visible across quarters; annual 1701A |
| SC-QC-ITEMIZED-3Q | Graduated+Itemized, three full quarters | Deductions accumulate quarterly (Item 39 = current quarter deductions); prior NTI carryforward in Item 42; NOLCO applied proportionally per quarter |
| SC-QC-NIL-Q1 | 8% or OSD, zero Q1 income | Q1 NIL return required; ₱0 payable; Item 50 (for 8%) passes ₱0 to Q2; Q2 computation starts fresh; CWT not yet applicable in Q1 |
| SC-QC-CWT-SHIFT | OSD or 8%, CWT received late | Q1 2307 received in Q2 (after Q1 1701Q was filed); CWT appears in Q2 Item 58 instead of Q1; Q1 was correctly filed showing ₱0 CWT; Q2 cumulative credits absorb full Q1+Q2 CWT |
| SC-QC-AMENDMENT | 8% rate | Q1 filed with wrong gross figure (understated by ₱100K); Q1 must be amended; Q2 and Q3 cascade: Item 50 in Q2 must be updated to corrected Q1 Item 51; both Q2 and Q3 must also be amended |
| SC-QC-OVERPY-Q3 | OSD or 8% | Cumulative YTD CWT at Q3 exceeds cumulative IT due; Q3 Item 63 is negative (overpayment); Q3 actual payment = ₱0; overpayment flows to annual reconciliation where excess CWT triggers refund/TCC/carryover |

---

## Priority for Test Vectors

Highest priority scenarios for initial test vectors:
1. SC-P-ML-8 — Most common real-world case
2. SC-P-ML-O — Suboptimal but frequently chosen
3. SC-M-ML-8 — Mixed income with 8% (most tricky)
4. SC-P-MH-I — High-expense case where itemized wins
5. SC-P-H-8 — Near-threshold case
6. SC-P-VH-O-VAT — Over-threshold VAT case
7. SC-CROSS-3M — Threshold crossing edge case
8. SC-QC-8-3Q — Full three-quarter cumulative cycle for 8% (quarterly tracking feature)
9. SC-FIRST-MID-Q2 — Mid-year registrant (Q2 election window)
10. SC-QC-OVERPY-Q3 — Q3 overpayment flowing to annual reconciliation

---

## Notes on Scenarios Not Covered by This Tool

The following scenarios are OUT OF SCOPE and should display a "manual review" flag per [manual-review-flags.md](manual-review-flags.md):
- GPP (General Professional Partnership) partners — use Sec. 26 distributive share rules; individual partner files Form 1701 but 8% option is unavailable; MRF-024 covers this
- Non-resident citizens — different source rules under Sec. 23; income derived from foreign sources is taxable only to resident citizens; MRF-025 covers this
- Non-resident aliens — different treaty rates may apply under applicable tax treaty (US, Japan, Singapore, etc.); MRF-026 covers this
- Foreign-source income — sourcing and exclusion rules complex; depends on residency status and type of income; see MRF-016 and MRF-017
- Retroactive regime change after Q1 deadline — requires amended returns and is a purely administrative process; the engine cannot compute retroactive changes without user intervention; see EC-QF01
- NOLCO carry-over — three-year FIFO tracking requires multi-year data not captured in a single-year computation; see EC-ID09 and SC-NOLCO
- Depreciation schedules — requires asset-by-asset data (purchase date, cost, useful life, accumulated depreciation); engine accepts only a single "annual depreciation expense" input; detailed depreciation schedule is prepared by a CPA
