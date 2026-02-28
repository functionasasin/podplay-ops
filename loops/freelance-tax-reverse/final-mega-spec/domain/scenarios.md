# Scenarios — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** PARTIAL (initial enumeration from worked-examples-fetch; to be expanded in scenario-enumeration Wave 2 aspect)
**Last updated:** 2026-02-28

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
| SC-FIRST-8 | New registrant, first year | 8% available; election on COR or Q1 1701Q |
| SC-FIRST-O | New registrant, first year | OSD election |
| SC-FIRST-MID | Registered mid-year | Only partial year income; quarters may not have Q1 filing |

### Group 5: CWT-Heavy Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-P-ML-8-CWT | Service provider | Large CWT credits may exceed annual IT; refund scenario |
| SC-P-ML-O-CWT | Service provider | Cumulative CWT calculation across quarters |

### Group 6: Threshold Crossing

| Code | Profile | Notes |
|------|---------|-------|
| SC-CROSS-3M | Any | Gross crosses ₱3M mid-year; retroactive regime switch |
| SC-AT-3M | Any | Gross receipts exactly ₱3M; boundary condition |
| SC-NEAR-3M | Any | Gross ₱2,800,000–₱2,999,999; 8% still available |

### Group 7: Special Deduction Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-NOLCO | Sole proprietor | Prior year net operating loss carry-over |
| SC-ZERO-EXPENSE | Professional | No business expenses at all (common for online freelancers) |
| SC-HIGH-ENTERTAIN | Professional | Entertainment expenses subject to 1% of net revenue cap |

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

---

## Notes on Scenarios Not Covered by This Tool

The following scenarios are OUT OF SCOPE and should display a "manual review" flag:
- GPP (General Professional Partnership) partners — different rules apply
- Non-resident citizens — different source rules
- Non-resident aliens — different treaty rates may apply
- Foreign-source income — sourcing and exclusion rules complex
- Retroactive regime change after Q1 deadline — requires amended returns, cannot be automated
- NOLCO carry-over — complex multi-year tracking, manual verification needed
- Depreciation schedules — requires asset-by-asset computation
