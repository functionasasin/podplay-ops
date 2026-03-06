# Analysis: model-team-opex

**Aspect**: model-team-opex
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06
**Source Status**: CONFIRMED — team OpEx allocations fully specified in `final-mega-spec/data-model/schema.md` (added during model-settings and model-financials iterations).

---

## Summary

The team OpEx model covers salary allocations and overhead inputs used for the HER (Hardware Efficiency Ratio) calculation in the Global Financials view. All values from the frontier aspect description are accounted for:

| Parameter | Value | Location in Schema |
|-----------|-------|--------------------|
| Niko direct allocation | 50% | `settings.niko_direct_allocation = 0.50` |
| Niko indirect allocation | 50% | Derived: `1 - niko_direct_allocation` |
| Chad indirect allocation | 20% | `settings.chad_indirect_allocation = 0.20` |
| Annual rent | $27,600/yr | `settings.annual_rent = 27600.00` |
| Annual indirect salaries | $147,000/yr | `settings.annual_indirect_salaries = 147000.00` |
| Monthly rent | $2,300/mo | `monthly_opex_snapshots.monthly_rent DEFAULT 2300.00` |
| Monthly indirect salaries | $12,250/mo | `monthly_opex_snapshots.monthly_indirect_salaries DEFAULT 12250.00` |

---

## Team Members and Roles

### Niko — Hardware/Installs Lead

- **Role**: Manages hardware configuration and physical installs
- **Salary allocation split**:
  - 50% **direct** → hardware/installation work (charged directly to hardware cost center)
  - 50% **indirect** → overhead allocation
- **Per-month direct cost** = `niko_monthly_salary × 0.50`
- **Per-month indirect cost** = `niko_monthly_salary × 0.50`
  - The indirect 50% is further split: 50% of indirect allocated to hardware overhead pool
  - Formula: `niko_monthly_salary × (1 - niko_direct_allocation) × 0.50`
- **Annual salary**: Unknown — `settings.niko_annual_salary DEFAULT 0.00` (requires payroll data or Kim Lapus input)
- **DB fields**: `settings.niko_annual_salary`, `settings.niko_direct_allocation`; `monthly_opex_snapshots.niko_monthly_salary`, `monthly_opex_snapshots.niko_direct_allocation`

### Chad — Operations

- **Role**: Operations support; not directly on hardware projects
- **Salary allocation split**:
  - 20% **indirect** → hardware overhead allocation
  - 80% allocated to other business functions (not in HER)
- **Per-month hardware overhead cost** = `chad_monthly_salary × 0.20`
- **Annual salary**: Unknown — `settings.chad_annual_salary DEFAULT 0.00`
- **DB fields**: `settings.chad_annual_salary`, `settings.chad_indirect_allocation`; `monthly_opex_snapshots.chad_monthly_salary`, `monthly_opex_snapshots.chad_indirect_allocation`

### Andy — Project Manager

- **Role**: PM; not included in HER hardware spend per available sources
- Seeded in `team_opex` reference with `direct_pct = 0`, `indirect_pct = 0` (informational row only)

### Stan — Configuration Specialist

- **Role**: Config; not included in HER hardware spend per available sources
- Seeded in `team_opex` reference similarly

---

## Overhead Line Items

### Rent

- **Annual**: $27,600/year (NJ lab / office space)
- **Monthly**: $27,600 ÷ 12 = **$2,300/month**
- **Allocation**: 100% of monthly rent charged to hardware overhead (lab is hardware ops space)
- **DB field**: `settings.annual_rent DEFAULT 27600.00`; `monthly_opex_snapshots.monthly_rent DEFAULT 2300.00`

### Indirect Salaries

- **Annual**: $147,000/year (non-hardware staff pool)
- **Monthly**: $147,000 ÷ 12 = **$12,250/month**
- **Allocation**: 20% of monthly indirect salaries charged to hardware overhead
  - `monthly_indirect_salaries × 0.20 = $12,250 × 0.20 = $2,450/month hardware-attributed`
- **DB field**: `settings.annual_indirect_salaries DEFAULT 147000.00`; `monthly_opex_snapshots.monthly_indirect_salaries DEFAULT 12250.00`

---

## HER Formula (Hardware Efficiency Ratio)

```
HER = hardware_revenue / team_hardware_spend
```

### team_hardware_spend breakdown

```
team_hardware_spend =
    (niko_monthly_salary × niko_direct_allocation)           -- Niko direct (50%)
  + (niko_monthly_salary × (1 - niko_direct_allocation) × 0.50)  -- Niko indirect portion
  + (chad_monthly_salary × chad_indirect_allocation)         -- Chad indirect (20%)
  + monthly_rent                                             -- Full rent ($2,300)
  + (monthly_indirect_salaries × 0.20)                      -- Indirect salary pool (20%)
```

### hardware_revenue definition

- Sum of all `invoices.hardware_subtotal` where `invoice_type = 'final'` and `date_paid` falls within the period
- Deposit invoices excluded — revenue recognized on final payment only
- Stored in `monthly_opex_snapshots.hardware_revenue` (set at month-close)

### Concrete example (placeholder salaries)

Assume Niko $8,000/mo, Chad $5,000/mo:

```
team_hardware_spend =
    ($8,000 × 0.50)                  =  $4,000  (Niko direct)
  + ($8,000 × 0.50 × 0.50)          =  $2,000  (Niko indirect portion)
  + ($5,000 × 0.20)                  =  $1,000  (Chad indirect)
  + $2,300                           =  $2,300  (Rent)
  + ($12,250 × 0.20)                 =  $2,450  (Indirect salary pool)
                                     = $11,750  total

If hardware_revenue = $30,000:
HER = $30,000 / $11,750 = 2.55
```

Target: HER > 1.0 (break-even); healthy = 2.0+

---

## Schema Locations

### `settings` table (global defaults)

```sql
-- Lines 671–693 in schema.md
niko_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
niko_direct_allocation      NUMERIC(6, 4) NOT NULL DEFAULT 0.50,
chad_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
chad_indirect_allocation    NUMERIC(6, 4) NOT NULL DEFAULT 0.20,
annual_rent                 NUMERIC(10, 2) NOT NULL DEFAULT 27600.00,
annual_indirect_salaries    NUMERIC(10, 2) NOT NULL DEFAULT 147000.00,
```

### `monthly_opex_snapshots` table (per-period HER data)

```sql
-- Lines 1724–1834 in schema.md
-- One row per calendar month; snapshotted at month-close
niko_monthly_salary         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
niko_direct_allocation      NUMERIC(6, 4)  NOT NULL DEFAULT 0.50,
chad_monthly_salary         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
chad_indirect_allocation    NUMERIC(6, 4)  NOT NULL DEFAULT 0.20,
monthly_rent                NUMERIC(10, 2) NOT NULL DEFAULT 2300.00,
monthly_indirect_salaries   NUMERIC(10, 2) NOT NULL DEFAULT 12250.00,
hardware_revenue            NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
team_hardware_spend         NUMERIC(10, 2) GENERATED ALWAYS AS (...) STORED,
her_ratio                   NUMERIC(10, 4) GENERATED ALWAYS AS (...) STORED,
```

---

## MRP Source Mapping

| Data Point | MRP Source | Schema Field |
|-----------|-----------|-------------|
| Niko direct % | FINANCIALS tab "Direct %" column | `niko_direct_allocation` |
| Niko salary | FINANCIALS tab "Niko Salary" row | `niko_monthly_salary` |
| Chad indirect % | FINANCIALS tab "Chad Indirect %" column | `chad_indirect_allocation` |
| Chad salary | FINANCIALS tab "Chad Salary" row | `chad_monthly_salary` |
| Annual rent $27,600 | FINANCIALS tab "Rent" row | `annual_rent` / `monthly_rent` |
| Indirect salaries $147,000 | FINANCIALS tab "Indirect Salaries" row | `annual_indirect_salaries` / `monthly_indirect_salaries` |
| HER ratio | FINANCIALS tab "HER" row | `her_ratio` (computed) |
| Hardware revenue | INVOICING tab, final payment date filter | `hardware_revenue` |

---

## Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| Niko annual salary | `settings.niko_annual_salary` defaults to $0; HER shows 0 until set | Requires payroll data from Kim Lapus |
| Chad annual salary | Same — `settings.chad_annual_salary` defaults to $0 | Requires payroll data |
| Exact indirect salary composition | $147K/yr confirmed in frontier but constituent members unknown | Requires FINANCIALS tab from XLSX |
| Rent allocation method | 100% of rent to hardware assumed — actual split unknown | Requires FINANCIALS tab confirmation |
| Niko indirect portion multiplier | 0.50 applied to indirect half — basis unclear | Best approximation; requires FINANCIALS tab |
| Indirect salary allocation % | 20% applied to pool — basis unclear | Best approximation; requires FINANCIALS tab |

---

## No Schema Changes Needed

All team OpEx fields were already added to `schema.md` during:
- **model-settings** iteration: added `settings` table fields (lines 671–693)
- **model-financials** iteration: added `monthly_opex_snapshots` table (lines 1724–1834)

This aspect confirms coverage and provides consolidated documentation. No new SQL is required.
