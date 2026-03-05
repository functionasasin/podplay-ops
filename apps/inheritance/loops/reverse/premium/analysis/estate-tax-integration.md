# Estate Tax Integration — Analysis

**Date:** 2026-02-28
**Source files read:**
- `docs/plans/estate-tax-engine-spec.md` — full 2,040-line spec (§3 regimes, §5 data model, §8 gross estate, §16 pipeline, §17 Form 1801 output)
- `docs/plans/inheritance-engine-spec.md` — full 2,568-line spec (§2 pipeline, §3 data model, §3.6 engine output, §3.7 scenario codes)
- `loops/inheritance-premium-reverse/analysis/codebase-audit.md` — current app state machine and types

---

## 1. Engine Execution Order and the Bridge Formula

The two engines have a strict dependency:

```
┌─────────────────────────────────────────────────────────────┐
│               ESTATE TAX ENGINE                              │
│                                                              │
│  Inputs: gross assets, deductions, property regime,          │
│          date of death, marital status                        │
│                                                              │
│  Computes:                                                    │
│    Item 34: Gross Estate                                     │
│    Item 35: Ordinary Deductions                              │
│    Item 37: Special Deductions                               │
│    Item 38: Net Estate                                       │
│    Item 39: Surviving Spouse Share                           │
│    Item 40: Net Taxable Estate                               │
│    Item 44: Net Estate Tax Due                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │  BRIDGE FORMULA
                         │
                         ▼
          net_distributable_estate
          = max(0, Item 40 − Item 44)
          = max(0, netTaxableEstate − netEstateTaxDue)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               INHERITANCE ENGINE                             │
│                                                              │
│  Inputs: net_distributable_estate (from above),             │
│          family_tree, will, donations                        │
│                                                              │
│  Outputs: per_heir_shares (InheritanceShare[]),             │
│           narratives, computation_log, warnings              │
└─────────────────────────────────────────────────────────────┘
```

**Why this formula:**
- `Item 40` (Net Taxable Estate) = gross estate − all deductions − surviving spouse's own property
- `Item 44` (Net Estate Tax Due) = what BIR collects, paid from the estate
- `Item 40 − Item 44` = what remains for heirs to divide
- The surviving spouse share (Item 39) is already EXCLUDED from Item 40 — the spouse gets that as their own property, not inheritance

**Why not `gross_estate − total_deductions − tax`:**
The spouse's share (Item 39) is NOT a deduction in the NIRC sense; it is set-aside of the spouse's own pre-existing property rights. The correct bridge is Item 40 − Item 44, which gives the taxed net estate available for succession.

---

## 2. Field Mapping Table

### 2.1 Shared Fields (Already in Inheritance Wizard — Reuse)

| Inheritance Engine Field | Maps To Estate Tax Field | Transformation |
|--------------------------|--------------------------|----------------|
| `decedent.name` | `Decedent.name` | Direct |
| `decedent.date_of_death` | `Decedent.dateOfDeath` | Direct (IsoDate string) |
| `decedent.is_married` | `Decedent.maritalStatus` | `true` → `MARRIED`; `false` requires follow-up (single/widowed/separated) |
| `decedent.date_of_marriage` | Used to default `Decedent.propertyRegime` | `>= 1988-08-03` → ACP (default); `< 1988-08-03` → CPG (default) |
| `decedent.has_legal_separation` | `Decedent.maritalStatus = LEGALLY_SEPARATED` | Direct |
| Surviving spouse in `family_tree` | Confirms `spouseShare` computation applies | Engine checks maritalStatus; presence/absence already encoded |
| `donations[].value_at_time_of_donation` | NOT directly used in estate tax | Collatable donations are SEPARATE from taxable transfers (Schedule 3) — different concept |

### 2.2 Fields Inheritance Has That Estate Tax Does NOT Need

| Inheritance Field | Why Not Needed in Estate Tax |
|-------------------|------------------------------|
| `family_tree` (full heir list) | Estate tax doesn't care who the heirs are — only the total estate value |
| `will` (testamentary dispositions) | Estate tax computed on gross estate regardless of how heirs split it |
| `donations` (inter vivos) | Inter vivos donations to heirs = collation (inheritance engine). Taxable transfers (estate tax) = revocable transfers, POA, CONDI, life insurance (different legal concept) |
| `scenario_code` | Not relevant to estate tax |
| `per_heir_shares` | Not relevant to estate tax |

### 2.3 Fields Estate Tax Needs That Inheritance Does NOT Have

These are NEW inputs required when the estate tax wizard is added:

**Decedent Extended Info:**
| Field | Type | Notes |
|-------|------|-------|
| `citizenship` | string | e.g., "Filipino" |
| `isNonResidentAlien` | boolean | Triggers NRA rules (PH-situs only, ₱500K SD) |
| `address` | string | For BIR Form 1801 F7 |
| `maritalStatus` | enum | Needed if inheritance wizard only captures `is_married` boolean |
| `propertyRegime` | ACP \| CPG \| SEPARATION \| null | Default from marriage date; user can override |

**Executor Info:**
| Field | Type | Notes |
|-------|------|-------|
| `executor.name` | string | For BIR Form 1801 F10 |
| `executor.tin` | string \| null | Optional |
| `executor.contactNumber` | string \| null | Optional |

**Assets (all new — large input surface):**
- `realProperties[]` — each needs `titleNumber`, `taxDeclarationNumber`, `location`, `fmvTaxDeclaration`, `fmvBir`, `ownership` (Exclusive/Conjugal), `isFamilyHome`, `barangayCertification`
- `personalPropertiesFinancial[]` — cash, bank accounts, shares, bonds, mutual funds
- `personalPropertiesTangible[]` — vehicles, jewelry, other tangibles
- `taxableTransfers[]` — Sec. 85 transfers (contemplation of death, revocable, POA, life insurance)
- `businessInterests[]` — net equity of business interests
- `sec87ExemptAssets[]` — usufruct merger, fiduciary/fideicommissary transmission, charitable bequests

**Deductions (all new):**
- `claimsAgainstEstate[]` — Schedule 5A
- `claimsVsInsolventPersons[]` — Schedule 5B
- `unpaidMortgages[]` — Schedule 5C
- `unpaidTaxes[]` — Schedule 5C
- `casualtyLosses[]` — Schedule 5D
- `vanishingDeductionProperties[]` — Schedule 5E
- `publicUseTransfers[]` — Schedule 5F
- `funeralExpenses` — Schedule 5G (PRE_TRAIN only)
- `judicialAdminExpenses` — Schedule 5H (PRE_TRAIN only)
- `medicalExpenses[]` — Schedule 6 (within 1 year of death, capped ₱500K)
- `ra4917Benefits` — employer retirement benefits

**Estate Flags and Filing:**
- `estateFlags.taxFullyPaidBeforeMay2022` — amnesty eligibility
- `estateFlags.priorReturnFiled` — Track A vs. Track B amnesty
- `userElectsAmnesty` — amnesty election toggle
- Six RA 11213 Sec. 9 exclusion flags
- `filing` struct (isAmended, extensionToFile, installmentGranted, judicialSettlement)

**For NRA estates (additional):**
- `decedent.totalWorldwideGrossEstate` — for proportional ELIT factor
- `decedent.totalWorldwideELIT` — worldwide ELIT amounts

---

## 3. Combined UI Flow

### 3.1 Recommended Flow: Add-On Architecture

The estate tax wizard is an optional add-on step after inheritance computation. This preserves the existing zero-friction inheritance tool for users who only need distribution, while enabling estate tax for those who need BIR Form 1801.

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: INHERITANCE WIZARD (existing)                   │
│  Family tree → will → donations → net estate (manual)    │
│                                                          │
│  User enters net_distributable_estate MANUALLY           │
│  (e.g., ₱5,000,000 from their accountant's estimate)    │
└─────────────────────────────┬───────────────────────────┘
                              │  RUN INHERITANCE ENGINE
                              ▼
┌─────────────────────────────────────────────────────────┐
│  RESULTS VIEW (existing)                                 │
│  Per-heir distribution table, narratives, computation    │
│                                                          │
│  [ Add Estate Tax Computation → ]  ← NEW BUTTON         │
└─────────────────────────────┬───────────────────────────┘
                              │  User clicks "Add Estate Tax"
                              ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: ESTATE TAX WIZARD (new)                         │
│  Tab 1: Decedent Info (citizenship, NRA, regime)         │
│  Tab 2: Real Properties (Schedule 1 / 1A)                │
│  Tab 3: Personal Properties (Schedule 2 / 2A)            │
│  Tab 4: Taxable Transfers (Schedule 3)                   │
│  Tab 5: Business Interests (Schedule 4)                  │
│  Tab 6: Deductions (Schedule 5A–5H)                      │
│  Tab 7: Special Deductions (Schedule 6)                  │
│  Tab 8: Amnesty / Filing                                  │
│                                                          │
│  Pre-populated from inheritance wizard:                   │
│   • decedent.name, date_of_death, marital_status         │
│   • propertyRegime defaulted from marriage date           │
└─────────────────────────────┬───────────────────────────┘
                              │  RUN ESTATE TAX ENGINE
                              ▼
┌─────────────────────────────────────────────────────────┐
│  ESTATE TAX RESULTS (new)                                │
│  BIR Form 1801 summary                                   │
│  Net Estate Tax Due = ₱X                                 │
│                                                          │
│  "Update inheritance distribution using computed net     │
│  estate? [₱Y = Item40 − Item44]"                        │
│  [ Yes, Recompute Distribution ] [ Keep Manual Amount ]  │
└─────────────────────────────┬───────────────────────────┘
                              │  User confirms update
                              ▼
┌─────────────────────────────────────────────────────────┐
│  INHERITANCE ENGINE RERUNS                               │
│  net_distributable_estate = max(0, Item40 − Item44)      │
│                                                          │
│  COMBINED RESULTS VIEW                                   │
│  Tab 1: Inheritance Distribution                         │
│  Tab 2: Estate Tax Summary (Form 1801)                   │
│  [ Download Full Report PDF ]                            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 UI State Machine Extension

The existing `AppState` needs extension:

```typescript
type AppState =
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | { phase: 'results'; input: InheritanceEngineInput; output: InheritanceEngineOutput }
  | { phase: 'estate-tax-wizard'; inheritanceInput: InheritanceEngineInput; inheritanceOutput: InheritanceEngineOutput }
  | { phase: 'estate-tax-computing' }
  | { phase: 'combined-results';
      inheritanceInput: InheritanceEngineInput;
      inheritanceOutput: InheritanceEngineOutput;
      estateTaxInput: EstateTaxEngineInput;
      estateTaxOutput: EstateTaxEngineOutput;
    }
  | { phase: 'error'; message: string };
```

### 3.3 When to Show the Estate Tax Button

The "Add Estate Tax Computation" button should appear in the results view ActionsBar for any authenticated user (requires persistence to save the combined case). Anonymous users can see it but get prompted to sign in.

---

## 4. Combined PDF Layout

One PDF document with two major sections. The inheritance section is printed first (client-facing), the estate tax section second (BIR-facing).

```
┌────────────────────────────────────────────────────────┐
│ Santos & Reyes Law Offices | 4F Salcedo Tower, Makati City│
│ ESTATE SETTLEMENT REPORT                               │
│ Decedent: Juan Dela Cruz | Date of Death: 2024-03-15  │
│ Prepared by: Atty. Maria Santos | Date: 2026-02-28    │
├────────────────────────────────────────────────────────┤
│ PART I: INHERITANCE DISTRIBUTION                       │
│                                                        │
│ Estate Profile ....................................     │
│   Gross estate value: ₱15,000,000                     │
│   Net estate tax due: ₱111,000 (computed in Part II)  │
│   Net distributable estate: ₱1,739,000                │
│   Succession type: Intestate | Scenario: I2            │
│                                                        │
│ Distribution Summary Table:                            │
│  Heir Name | Category | Legal Basis | Net Share       │
│  ─────────────────────────────────────────────────   │
│  Maria DC  | LC       | Art. 980    | ₱869,500       │
│  Pedro DC  | LC       | Art. 980    | ₱869,500       │
│  Ana DC    | SS       | Art. 996    | ₱0 (EJS split) │
│                                                        │
│ Per-Heir Narratives (with NCC citations) ............  │
│ Computation Log .....................................   │
│ Manual Review Flags (if any) ........................  │
├────────────────────────────────────────────────────────┤
│ PART II: ESTATE TAX COMPUTATION (BIR Form 1801)        │
│                                                        │
│ Regime: TRAIN (Death ≥ Jan 1, 2018) | 6% flat rate   │
│                                                        │
│ Schedule of Assets:                                    │
│   Real Properties (Item 29) ............. ₱9,000,000  │
│   Family Home (Item 30) ................. ₱6,000,000  │
│   Personal Properties (Item 31) ......... ₱5,000,000  │
│   Gross Estate (Item 34) ................ ₱15,000,000 │
│                                                        │
│ Deductions:                                            │
│   Ordinary (Item 35) .................... ₱500,000    │
│   Standard Deduction (37A) .............. ₱5,000,000  │
│   Family Home Deduction (37B) ........... ₱6,000,000  │
│   Medical Expenses (37C) ................ ₱400,000    │
│   Total Special Deductions (37) ......... ₱11,400,000 │
│                                                        │
│ Net Estate (Item 38) ........................ ₱3,100,000│
│ Surviving Spouse Share (Item 39) ........... ₱1,250,000│
│ Net Taxable Estate (Item 40) ............... ₱1,850,000│
│ Estate Tax Due (Item 42) .............. ₱111,000 (6%) │
│ Net Estate Tax Due (Item 44) ............... ₱111,000  │
│                                                        │
│ Filing Deadline: March 15, 2025 (1 year from DOD)     │
│ CPA Certification: Not required (GE < ₱5M)*           │
│                                                        │
│ * Disclaimer: This is a computational estimate. Consult│
│   a licensed CPA/attorney before filing.              │
└────────────────────────────────────────────────────────┘
```

**Note on GE Threshold for CPA:** TRAIN requires CPA certification if gross estate > ₱5,000,000. The estate tax output must flag this.

---

## 5. Shared Data Model (Combined Case Record)

A single `cases` table stores inputs and outputs for both engines:

```sql
CREATE TABLE cases (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Case metadata
  title                     TEXT NOT NULL DEFAULT '',
  client_id                 UUID REFERENCES clients(id),
  status                    TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'computed', 'finalized', 'archived')),
  notes                     TEXT,

  -- Decedent (shared header, denormalized for quick display)
  decedent_name             TEXT,
  date_of_death             DATE,

  -- Inheritance engine
  inheritance_input_json    JSONB,    -- EngineInput (inheritance)
  inheritance_output_json   JSONB,    -- EngineOutput (inheritance)

  -- Estate tax engine
  estate_tax_input_json     JSONB,    -- EngineInput (estate tax)
  estate_tax_output_json    JSONB,    -- EngineOutput (estate tax)

  -- Bridge value (derived, stored for display without recomputation)
  net_distributable_estate  BIGINT,   -- centavos; = max(0, Item40 - Item44)

  -- Flags
  estate_tax_computed       BOOLEAN NOT NULL DEFAULT false,
  net_estate_auto_populated BOOLEAN NOT NULL DEFAULT false
                            -- true if net_distributable_estate came from estate tax engine
                            -- false if user entered manually
);

-- RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their cases"
  ON cases FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_client_id ON cases(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_cases_date_of_death ON cases(date_of_death);
```

**Why store `net_distributable_estate` denormalized:**
- Dashboard needs to display the amount without deserializing two JSON blobs
- Recomputation is always available by re-running both engines from stored JSON inputs

---

## 6. Integration Edge Cases

### 6.1 User Changes Inheritance Inputs After Estate Tax Is Computed

**Scenario:** User adds a new heir → inheritance wizard reruns → should the estate tax result still apply?

**Answer:** Estate tax does NOT depend on who the heirs are (family tree). Therefore, re-running the inheritance engine with the same `net_distributable_estate` is valid. The estate tax result remains unchanged.

**Exception:** If the user changes `date_of_death` → regime changes → estate tax must be recomputed. The UI must flag: "Date of death changed. Estate tax must be recomputed."

**UI rule:** Flag for recomputation when any of these change:
- `decedent.date_of_death`
- Any asset or deduction field in estate tax wizard
- `propertyRegime`

### 6.2 Estate Tax Result Is Zero

**Scenario:** Gross estate ≤ ₱5,000,000 (standard deduction absorbs all) → `netEstateTaxDue = ₱0`.

**Bridge:** `net_distributable_estate = max(0, Item40 − 0) = Item40`

This is correct: no tax is owed, so the full net taxable estate distributes to heirs.

**UI:** Show "No estate tax due. Full net estate distributes to heirs." banner.

### 6.3 Pre-TRAIN Estate (Graduated Rates)

**Scenario:** `date_of_death < 2018-01-01` → PRE_TRAIN regime → graduated 0%–20%.

The bridge formula is identical: `net_distributable_estate = max(0, Item40 − Item44)`.

The estate tax engine handles regime selection internally. The integration layer does not need to know about the regime — it only reads `taxComputation.netEstateTaxDue`.

### 6.4 Amnesty Election

**Scenario:** User elects estate tax amnesty (RA 11213) → `regime = AMNESTY`.

**Important:** The amnesty filing window CLOSED June 14, 2025. The estate tax engine already outputs a warning: "AMNESTY FILING WINDOW CLOSED: This computation is for HISTORICAL REFERENCE ONLY."

**Bridge:** Same formula. The engine still computes the amnesty tax amount.

**UI:** Show the engine warning prominently. The computed net distributable estate is still valid for the inheritance distribution.

### 6.5 NRA Decedent

**Scenario:** `decedent.isNonResidentAlien = true` → only PH-situs assets, ₱500K standard deduction, proportional ELIT.

**Bridge:** Same formula. The inheritance engine distributes the net distributable estate computed from PH-situs assets only.

**Note:** This is a complex case — the inheritance engine needs to know whether to include non-PH properties in the family tree's context. For NRAs, only PH-situs assets are in the estate; however, inheritance law still applies to ALL properties. This requires a warning: "For non-resident alien decedents, the inheritance distribution covers only Philippine-situs assets included in the Philippine estate tax return."

### 6.6 Manual Override Preserved

**Scenario:** User manually enters `net_distributable_estate = ₱2,000,000` but doesn't run the estate tax wizard.

**Behavior:** This remains the inheritance engine's input. The `net_estate_auto_populated` flag is `false`. When the user later runs the estate tax wizard and gets a different computed value, the UI prompts: "Estate tax computation gives ₱1,739,000. Use this amount instead of your manually entered ₱2,000,000?"

### 6.7 Family Home: Estate Tax vs. Inheritance

**Scenario:** A property designated as `isFamilyHome = true` in the estate tax wizard gets a deduction of up to ₱10,000,000 (TRAIN). This reduces the estate tax. The family home itself is still an asset that heirs inherit.

**Clarification:** The family home deduction reduces ESTATE TAX only. The property's FMV is still included in the gross estate and distributable estate. The `net_distributable_estate` already accounts for the reduced tax (family home deduction → lower tax → higher net distributable estate).

### 6.8 Surviving Spouse Share

**Critical:** Item 39 (surviving spouse share) is the spouse's OWN PROPERTY returned to them. It is NOT part of the inheritance.

- Estate tax wizard: Item 39 is EXCLUDED from Item 40 (net taxable estate)
- Inheritance engine: `net_distributable_estate` = Item 40 − Item 44 (spouse share already excluded)
- Therefore: the inheritance engine distributes only among the HEIRS (children, other relatives). The spouse gets their community share SEPARATELY via EJS or conjugal settlement.
- **HOWEVER:** In the inheritance distribution, the surviving spouse may ALSO be an heir for their SHARE OF INHERITANCE (legitime or intestate share). This is separate from their community property return.

**Example (TRAIN, ACP, married with 2 children):**
```
Gross estate (Item 34):       ₱15,000,000
  (includes conjugal assets of ₱4,000,000)
ELIT + special deductions:    -₱11,400,000
Net estate (Item 38):         ₱3,600,000
Spouse community return (39): -₱1,250,000   ← ½ of net conjugal
Net taxable estate (40):      ₱2,350,000
Estate tax (42 = 44):         -₱141,000
Net distributable estate:     ₱2,209,000   ← what heirs inherit

Inheritance (intestate I2: 2 LC + spouse):
  2 children: ₱2,209,000 × 2/3 = ₱1,472,667 (₱736,333 each)
  Spouse:     ₱2,209,000 × 1/3 = ₱736,333
  (Spouse gets ₱736,333 inheritance PLUS ₱1,250,000 community return = ₱1,986,333 total)
```

This distinction MUST be explained clearly in the PDF and narratives.

---

## 7. Separate or Combined PDF?

**Recommendation: Single combined PDF.**

**Rationale:**
- Estate lawyers deliver ONE report per case, not multiple documents
- BIR requires Form 1801 as a complete package; the PDF is a computation worksheet, not the actual form filed
- Heirs need to see both sections to understand total value flow
- One PDF is simpler to attach in email, save in records

**Two-section structure:**
- Part I: Inheritance Distribution (existing report format)
- Part II: Estate Tax Computation (Form 1801 summary)

**When estate tax is NOT computed:**
- PDF omits Part II entirely
- ActionsBar shows "Generate inheritance report" (existing) vs. "Generate full report" (combined)

---

## 8. Implementation Dependency Graph

```
spec-auth-persistence          (must be built first — case storage)
       │
       ▼
spec-pdf-export                (must support two-section PDFs)
       │
       ▼
spec-bir-1801-integration      (this feature's specification)
```

The estate tax wizard is a **large feature** — the asset input surface alone is 6 schedules with dozens of fields per schedule. Implementation sequencing:

1. Phase 1 — Data model and WASM bridge for estate tax engine
2. Phase 2 — Decedent Info + Filing tabs (simple)
3. Phase 3 — Assets wizard (Schedules 1, 2, 2A, 3, 4) — largest surface
4. Phase 4 — Deductions wizard (Schedules 5A–5H, 6)
5. Phase 5 — Estate tax results view + bridge formula
6. Phase 6 — Rerun inheritance with computed `net_distributable_estate`
7. Phase 7 — Combined PDF

---

## 9. Newly Discovered Feature (for Wave 2)

**`spec-estate-tax-inputs-wizard`** — The estate tax input surface (6 asset schedules + 8 deduction schedules) is sufficiently complex to warrant its own multi-tab wizard specification separate from `spec-bir-1801-integration`. The integration spec (`spec-bir-1801-integration`) will reference this wizard spec.

**Added to aspects:** `spec-estate-tax-inputs-wizard — Detailed multi-tab wizard UI for estate tax inputs: Schedules 1/1A/2/2A/3/4 (assets) + Schedules 5A-5H/6 (deductions) + amnesty/filing. Depends: spec-auth-persistence. Reads: estate-tax-integration.`

---

## 10. Summary: What Makes This Integration Work

| Concern | Resolution |
|---------|------------|
| Engine ordering | Estate tax FIRST → inheritance SECOND |
| Bridge value | `max(0, Item40 − Item44)` (centavos, BigInt-safe) |
| Shared decedent fields | 5 fields auto-populated from inheritance wizard |
| New inputs required | ~60 fields across assets + deductions (estate tax wizard) |
| Spouse share confusion | Item 39 is community property return; spouse also has inheritance share separately |
| Zero tax case | Bridge = Item 40; full net estate distributes |
| Amnesty case | Window closed; computation historical; bridge formula unchanged |
| PDF format | Single combined PDF; Part I = distribution, Part II = Form 1801 summary |
| Manual override | Preserved; flag prompts update when estate tax computed |
| Family home | Reduces tax (increases net distributable estate); property still inherited |
| NRA | PH-situs only in estate tax; warning on inheritance distribution scope |
