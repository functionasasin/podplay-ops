# Analysis Notes — regime-comparison-logic

**Date:** 2026-03-01
**Aspect:** regime-comparison-logic (Wave 2)
**Files written:** computation-rules.md (CR-028), decision-trees.md (DT-07 expanded, DT-16 added), edge-cases.md (EC-RC01–EC-RC10)

---

## Key Findings

### 1. Correction to CR-014 Breakeven Table

The breakeven table in CR-014 had incorrect values for the 8% vs Itemized comparison. The error was systematic — the values at GR = ₱500K (83%) and GR = ₱800K (72%) were significantly off from the correct values (43.3% and 52.1% respectively). The values at higher income levels (₱1.5M, ₱2M, ₱2.5M) were closer but still imprecise.

**Root cause (suspected):** CR-014 may have been computed by comparing Path A income tax ONLY against Path C total (without including the 3% percentage tax offset in Path A). That is, it may have asked "when does IT_A < IT_C" instead of "when does (IT_A + PT_A) < IT_C".

**Correct formula used in CR-028:**
```
graduated_tax(GR × (1-r)) + GR × 0.03 = (GR - 250,000) × 0.08
→ graduated_tax(GR × (1-r)) = 0.05 × GR - 20,000
```
The 0.05×GR - 20,000 term accounts for the net advantage of 8% being: `(GR-250K)×8% - GR×3% = 0.08GR - 20,000 - 0.03GR = 0.05GR - 20,000`. When T < 0 (GR < ₱400K), the 8% option wins regardless of expenses.

### 2. The Narrow OSD-Wins Window

At GR between ₱400,001 and ₱437,499, Path B (OSD) beats Path C (8%). This is counterintuitive:
- For GR < ₱400K: 8% wins (Path C)
- For GR ₱400K–₱437.5K: OSD wins (Path B) — narrow window
- For GR > ₱437.5K: 8% wins again (Path C)

The window exists because:
- The 8% tax is a smooth line: (GR-250K)×8%
- The OSD tax is kinked at ₱416,667 (where OSD NTI hits the ₱250K zero bracket)
- Below ₱416,667: OSD IT = 0 (NTI in zero bracket), so OSD total = just PT
- Just above ₱416,667: OSD IT starts rising at 15% marginal × 60% base = 9% effective marginal
- But 8% rises at exactly 8% marginal
- For a brief window (₱400K-₱437.5K), the OSD IT jump plus PT is cheaper than 8% IT alone

The maximum OSD advantage is ~₱833 at GR ≈ ₱425,000. This is small enough that:
1. Most taxpayers in this range won't notice
2. A small amount of unexpected income could shift the recommendation
3. Engine should warn about the narrow window and suggest monitoring

### 3. Tie-Breaking Rule

When two paths have identical total_tax_burden, the preference order is:
**Path C > Path B > Path A**

Rationale:
- Path C: No percentage tax obligation, simpler form (1701A Part IV-B), no documentation
- Path B: No documentation needed, OSD deduction is automatic, AFS not required < ₱3M
- Path A: Requires expense documentation, risk of disallowance in BIR audit

### 4. Mixed Income Complexity

For mixed income earners:
- The "combined NTI" approach must be used for Paths A and B (compensation + business NTI combined → graduated rates)
- For Path C: compensation is taxed at graduated rates (by employer); business is taxed at 8% FLAT
- The ₱250K deduction does NOT apply to mixed income 8% earners
- The comparison should be: TOTAL annual IT (both compensation and business) under each path

This means the engine must handle:
1. `is_compensation_income_separately_withheld = true` → employer has withheld tax on comp
2. At annual reconciliation: form 1701 combines both; balance payable = total IT − CWT (including employer 2316 amounts) − quarterly IT payments

The `mixed-income-rules` aspect will specify this fully. For CR-028, the function signature includes `has_compensation_income` and `taxable_compensation` but the mixed income full reconciliation is deferred to CR-029 (to be written in the mixed-income-rules aspect).

### 5. VAT-Registered Path Comparison (DT-16)

For VAT-registered taxpayers:
- No percentage tax on either Path A or Path B
- The OSD vs Itemized breakeven is STILL exactly at 40% expense ratio (PT cancels out)
- Gross income for OSD/itemized purposes is the VAT-exclusive amount (receipts ÷ 1.12)
- AFS attachment required when prior year GR > ₱3M (RR 4-2019)

### 6. New Aspects Discovered

No new aspects need to be added. The key gaps remaining in Wave 2 are:
- `mixed-income-rules` — full mixed income computation (CR-029)
- `vat-vs-percentage-tax` — VAT registration trigger, 2551Q obligation, threshold mechanics
- `percentage-tax-computation` — full 3% percentage tax mechanics
- `creditable-withholding-tax` — how 2307 credits apply at quarterly and annual level
- `quarterly-filing-rules` — cumulative method mechanics for each quarter
- `annual-reconciliation` — balance payable/overpayment at annual level

---

## Breakeven Derivation Formulas (for Reference)

### 8% vs Itemized Breakeven (Non-VAT, Pure SE, TY2023+)

Let `T = 0.05 × GR - 20,000` (required graduated tax on NTI at breakeven).

If T ≤ 0 (GR ≤ ₱400K): 8% always wins. No breakeven exists.

If 0 < T ≤ 22,500 (GR ≤ ₱850K):
```
N_breakeven = 250,000 + T / 0.15 = 116,666.67 + GR/3
r_breakeven = 1 - N_breakeven/GR = 1 - 116,666.67/GR - 1/3
```

If 22,500 < T ≤ 102,500 (₱850K < GR ≤ ₱2,450K):
```
N_breakeven = 400,000 + (T - 22,500) / 0.20 = 187,500 + GR/4
r_breakeven = 0.75 - 187,500/GR
```

If T > 102,500 (GR > ₱2,450K, up to ₱3M for 8% eligibility):
```
N_breakeven = 800,000 + (T - 102,500) / 0.25 = 310,000 + GR/5
r_breakeven = 0.80 - 310,000/GR
```

### Engine inline breakeven computation (alternative to table lookup)

```
function breakeven_expense_ratio_8pct_vs_itemized(GR: float) -> float | null:
  """Returns the expense ratio at which itemized starts beating 8% for purely SE taxpayers."""
  T = 0.05 * GR - 20_000
  if T <= 0:
    return null  // 8% always wins; no breakeven
  elif T <= 22_500:  // GR ≤ 850,000
    N = 250_000 + T / 0.15
  elif T <= 102_500:  // GR ≤ 2,450,000
    N = 400_000 + (T - 22_500) / 0.20
  else:  // GR > 2,450,000 (up to 3,000,000)
    N = 800_000 + (T - 102_500) / 0.25
  return 1.0 - N / GR
```
