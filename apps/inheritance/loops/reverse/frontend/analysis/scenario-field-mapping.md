# Scenario-Field Mapping

> **Wave 2 Cross-Cutting Analysis**
> Source: `step3_scenario.rs` (lines 52–235), `types.rs` (lines 248–283), `step5_legitimes.rs`, `step7_distribute.rs`

## Overview

The engine defines 30 scenario codes (T1–T15 testate, I1–I15 intestate) that determine
the entire distribution algorithm. The scenario code is selected in Step 3 based on **6 input
dimensions**. The frontend can predict the scenario from wizard state and adapt the results
view accordingly.

---

## 1. Input Dimensions That Determine Scenario

Six boolean/count dimensions derived from wizard inputs drive scenario selection:

```typescript
// step3_scenario.rs:52-80 — input to scenario determination
interface ScenarioInputs {
  /** will !== null */
  hasWill: boolean;
  /** Count of alive, eligible LegitimateChild/LegitimatedChild/AdoptedChild heirs */
  legitimateChildCount: number;
  /** Count of alive, eligible IllegitimateChild heirs with filiation proved */
  illegitimateChildCount: number;
  /** 1 if alive SurvivingSpouse exists, 0 otherwise */
  survivingSpouseCount: 0 | 1;
  /** Count of alive, eligible LegitimateParent/LegitimateAscendant heirs */
  legitimateAscendantCount: number;
  /** decedent.is_illegitimate */
  decedentIsIllegitimate: boolean;
  /** Any alive Sibling/NephewNiece in family tree (intestate only) */
  hasSiblingsOrNephews: boolean;
  /** Any alive OtherCollateral in family tree (intestate only) */
  hasOtherCollaterals: boolean;
}
```

### Mapping from Wizard Fields to Dimensions

| Dimension | Wizard Source | Notes |
|-----------|-------------|-------|
| `hasWill` | Step 1 toggle or Step 4 presence | `will !== null` in EngineInput |
| `legitimateChildCount` | Family Tree step: count persons with `relationship ∈ {LegitimateChild, LegitimatedChild, AdoptedChild}` AND `is_alive_at_succession=true` AND not excluded | Adopted children count as legitimate (RA 8552). Predeceased child's children inherit by representation but don't add to this count. |
| `illegitimateChildCount` | Family Tree step: count persons with `relationship=IllegitimateChild` AND `filiation_proved=true` AND `is_alive_at_succession=true` | IC with `filiation_proved=false` are excluded (Art. 887 ¶3) |
| `survivingSpouseCount` | Family Tree step: 1 if any person with `relationship=SurvivingSpouse` AND `is_alive_at_succession=true` | Max 1 spouse enforced by frontend |
| `legitimateAscendantCount` | Family Tree step: count persons with `relationship ∈ {LegitimateParent, LegitimateAscendant}` AND `is_alive_at_succession=true` | Only relevant when `legitimateChildCount === 0` (descendants exclude ascendants, Art. 887 ¶2) |
| `decedentIsIllegitimate` | Decedent step: `is_illegitimate` checkbox | Triggers special T14/T15 only for testate + ascendants |
| `hasSiblingsOrNephews` | Family Tree step: any person with `relationship ∈ {Sibling, NephewNiece}` AND `is_alive_at_succession=true` | Only relevant in intestate when no descendants/ascendants/IC |
| `hasOtherCollaterals` | Family Tree step: any person with `relationship=OtherCollateral` AND `is_alive_at_succession=true` | Only relevant in intestate when no siblings |

---

## 2. Scenario Decision Tree

### Testate (has_will = true)

```
step3_scenario.rs:91-161

HAS LC?
├─ YES → Regime A (descendants present, ascendants excluded)
│  ├─ no IC, no Spouse    → T1  (n LC only)
│  ├─ IC, no Spouse       → T4  (n LC + m IC)
│  ├─ no IC, Spouse
│  │  ├─ LC = 1           → T2  (1 LC + Spouse)
│  │  └─ LC ≥ 2           → T3  (n≥2 LC + Spouse)
│  └─ IC + Spouse
│     ├─ LC = 1           → T5a (1 LC + m IC + Spouse)
│     └─ LC ≥ 2           → T5b (n≥2 LC + m IC + Spouse)
│
├─ NO → Check illegitimate decedent + ascendants
│  ├─ decedent.is_illegitimate AND HAS ASC?
│  │  ├─ YES
│  │  │  ├─ no Spouse     → T14 (Parents of illegitimate decedent)
│  │  │  └─ Spouse        → T15 (Parents + Spouse of illegitimate decedent)
│  │  └─ NO → fall through
│  │
│  ├─ HAS ASC? → Regime B (ascendants, no descendants)
│  │  ├─ no IC, no Spouse → T6  (Ascendants only)
│  │  ├─ no IC, Spouse    → T7  (Ascendants + Spouse)
│  │  ├─ IC, no Spouse    → T8  (Ascendants + m IC)
│  │  └─ IC + Spouse      → T9  (Ascendants + m IC + Spouse)
│  │
│  └─ NO ASC → Regime C (no primary/secondary compulsory heirs)
│     ├─ IC + Spouse      → T10 (m IC + Spouse)
│     ├─ IC, no Spouse    → T11 (m IC only)
│     ├─ no IC, Spouse    → T12 (Spouse only)
│     └─ no IC, no Spouse → T13 (No compulsory heirs — full FP)
```

### Intestate (has_will = false)

```
step3_scenario.rs:166-235

HAS LC?
├─ YES → Regime A
│  ├─ no IC, no Spouse    → I1  (n LC only)
│  ├─ no IC, Spouse       → I2  (n LC + Spouse)
│  ├─ IC, no Spouse       → I3  (n LC + m IC)
│  └─ IC + Spouse         → I4  (n LC + m IC + Spouse)
│
├─ NO → HAS ASC?
│  ├─ YES → Regime B
│  │  ├─ no IC, no Spouse → I5  (Ascendants only)
│  │  ├─ no IC, Spouse    → I6  (Ascendants + Spouse)
│  │  ├─ IC, no Spouse    → I9  (Ascendants + m IC)
│  │  └─ IC + Spouse      → I10 (Ascendants + m IC + Spouse)
│  │
│  ├─ NO ASC → HAS IC?
│  │  ├─ YES
│  │  │  ├─ Spouse        → I8  (m IC + Spouse)
│  │  │  └─ no Spouse     → I7  (m IC only)
│  │  │
│  │  └─ NO → HAS Spouse?
│  │     ├─ YES
│  │     │  ├─ has siblings/nephews → I12 (Spouse + Siblings)
│  │     │  └─ no siblings         → I11 (Spouse only)
│  │     │
│  │     └─ NO
│  │        ├─ has siblings/nephews    → I13 (Siblings only)
│  │        ├─ has other collaterals   → I14 (Other collaterals)
│  │        └─ no heirs at all         → I15 (Escheat to State)
```

---

## 3. Complete Scenario Reference Table

### Testate Scenarios (T1–T15)

| Code | Heir Groups | LC Count | Articles | Legitime Allocation | Free Portion |
|------|------------|----------|----------|-------------------|--------------|
| T1 | n LC | any n≥1 | Art. 888 | Each LC: E/(2n) | E/2 |
| T2 | 1 LC + Spouse | 1 | Arts. 888, 892¶1 | LC: E/2; Spouse: E/4 | E/4 |
| T3 | n≥2 LC + Spouse | n≥2 | Arts. 888, 892¶2 | Each LC: E/(2n); Spouse: E/(2n) | E/2 − spouse share |
| T4 | n LC + m IC | n≥1 | Arts. 888, 895 | LC: E/(2n) each; IC: E/(2n)/2 each (capped) | E/2 |
| T5a | 1 LC + m IC + Spouse | 1 | Arts. 888, 892¶1, 895 | LC: E/2; Spouse: E/4; IC: E/(2)/2 each (capped) | remainder |
| T5b | n≥2 LC + m IC + Spouse | n≥2 | Arts. 888, 892¶2, 895 | Each LC: E/(2n); Spouse: E/(2n); IC: E/(2n)/2 each (capped) | remainder |
| T6 | Ascendants only | 0 | Art. 889 | Ascendants: E/2 collective | E/2 |
| T7 | Ascendants + Spouse | 0 | Arts. 889, 893 | Ascendants: E/2; Spouse: E/4 | E/4 |
| T8 | Ascendants + m IC | 0 | Arts. 889, 896 | Ascendants: E/2; Each IC: E/(4m) | E/4 |
| T9 | Ascendants + m IC + Spouse | 0 | Arts. 889, 896, 899 | Ascendants: E/2; Each IC: E/(4m); Spouse: E/8 | E/8 |
| T10 | m IC + Spouse | 0 | Art. 894 | Each IC: E/(3m); Spouse: E/3 | E/3 |
| T11 | m IC only | 0 | Art. 901 | Each IC: E/(2m) | E/2 |
| T12 | Spouse only | 0 | Art. 900 | Spouse: E/2 (or E/3 if articulo mortis) | E/2 or 2E/3 |
| T13 | No compulsory heirs | 0 | — | None | Entire E |
| T14 | Parents (illegit. decedent) | 0 | Art. 903 | Parents: E/2 collective | E/2 |
| T15 | Parents + Spouse (illegit.) | 0 | Art. 903 | Parents: E/4; Spouse: E/4 | E/2 |

### Intestate Scenarios (I1–I15)

| Code | Heir Groups | Articles | Distribution Formula |
|------|------------|----------|---------------------|
| I1 | n LC only | Art. 980 | Each LC: E/n (per line, stirpes) |
| I2 | n LC + Spouse | Art. 996 | Spouse: 1 line = E/(n+1); Each LC: E/(n+1) |
| I3 | n LC + m IC | Arts. 983, 895 | LC: 2 units each; IC: 1 unit each; per_unit = E/(2n+m) |
| I4 | n LC + m IC + Spouse | Arts. 999, 983, 895 | Spouse: 2 units; LC: 2 units each; IC: 1 unit each; per_unit = E/(2n+m+2) |
| I5 | Ascendants only | Arts. 985–987 | By degree → by line (paternal/maternal) → equal within |
| I6 | Ascendants + Spouse | Art. 997 | Spouse: E/2; Ascendants: E/2 (divided by degree+line) |
| I7 | m IC only | Art. 988 | Each IC: E/m |
| I8 | m IC + Spouse | Art. 998 | Spouse: E/2; Each IC: E/(2m) |
| I9 | Ascendants + m IC | Art. 991 | Ascendants: E/2; Each IC: E/(2m) |
| I10 | Ascendants + m IC + Spouse | Art. 1000 | Ascendants: E/2; IC: E/4; Spouse: E/4 |
| I11 | Spouse only | Art. 995 | Spouse: entire E |
| I12 | Spouse + Siblings/Nephews | Art. 1001 | Spouse: E/2; Siblings: E/2 (per blood type 2:1 weighting) |
| I13 | Siblings/Nephews only | Arts. 1003–1008 | Full:Half = 2:1 unit ratio; nephews per stirpes |
| I14 | Other collaterals (≤5th deg) | Arts. 1009–1010 | Nearest degree only; equal shares |
| I15 | No heirs (Escheat) | Arts. 1011–1014 | Entire estate to State |

---

## 4. Test Case → Scenario Mapping

| Test Case | Key Inputs | Predicted Scenario |
|-----------|-----------|-------------------|
| 01-single-lc | 1 LC, no spouse, intestate | I1 |
| 02-married-3lc | 3 LC + spouse, intestate | I2 |
| 03-2lc-1ic | 2 LC + 1 IC, intestate | I3 |
| 04-spouse-only | Spouse only, intestate | I11 |
| 05-parents-spouse | 2 parents + spouse, intestate | I6 |
| 06-testate-charity | 1 LC, testate (institution: EntireFreePort) | T1 |
| 07-5lc-large | 5 LC, intestate | I1 |
| 08-parents-only | 2 parents, intestate | I5 |
| 09-ic-only | 3 IC, intestate | I7 |
| 10-married-lc-ic | 1 LC + 1 IC + spouse, intestate | I4 |
| 11-siblings | 1 Full + 1 Half sibling, intestate | I13 |
| 12-escheat | empty family_tree, intestate | I15 |
| 13-small-estate | 1 LC + spouse, intestate | I2 |
| 14-testate-legacy | 2 LC + spouse, testate (legacy) | T3 |
| 15-representation | 1 alive LC + 1 dead LC (2 grandchildren), intestate | I1 |
| 16-one-parent-spouse | 1 parent + spouse, intestate | I6 |
| 17-adopted-child | 1 bio LC + 1 adopted LC, intestate | I1 |
| 18-ic-spouse | 1 IC + spouse, intestate | I8 |
| 19-large-family | 2 LC + 2 IC + spouse, intestate | I4 |
| 20-collation | 2 LC, intestate (with donation) | I1 |

**Coverage gaps**: No testate scenarios T2, T4–T15 are covered by test cases. Only T1 (06) and T3 (14) have testate test cases. All intestate Regime A and most Regime B/C are covered.

---

## 5. Frontend Scenario Prediction

The frontend can compute the predicted scenario code in real-time as the user fills the wizard. This enables:

1. **Live scenario indicator** — show the user which scenario applies
2. **Results view pre-configuration** — adapt the layout before submission
3. **Validation hints** — warn about unusual configurations

### TypeScript Implementation

```typescript
// Mirrors step3_scenario.rs:52-235
// Source: step3_scenario.rs, types.rs:248-283

type ScenarioCode =
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5a' | 'T5b'
  | 'T6' | 'T7' | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' | 'T13'
  | 'T14' | 'T15'
  | 'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6'
  | 'I7' | 'I8' | 'I9' | 'I10' | 'I11' | 'I12' | 'I13' | 'I14' | 'I15';

type SuccessionType = 'Testate' | 'Intestate' | 'Mixed' | 'IntestateByPreterition';

interface ScenarioPrediction {
  successionType: 'Testate' | 'Intestate';
  scenarioCode: ScenarioCode;
  regime: 'A' | 'B' | 'C' | 'Special';
  description: string;
  heirGroups: string[];
  /** Civil Code articles governing this scenario's distribution */
  articles: string[];
}

/**
 * Predict scenario from current wizard state.
 * Mirrors step3_scenario.rs:52-235 exactly.
 *
 * IMPORTANT: This is a *preliminary* prediction. The engine may later
 * reclassify as Mixed (after Step 5) or IntestateByPreterition (after Step 6).
 * The frontend cannot predict these reclassifications.
 */
function predictScenario(inputs: {
  hasWill: boolean;
  legitimateChildCount: number;
  illegitimateChildCount: number;
  hasSurvivingSpouse: boolean;
  legitimateAscendantCount: number;
  decedentIsIllegitimate: boolean;
  hasSiblingsOrNephews: boolean;
  hasOtherCollaterals: boolean;
}): ScenarioPrediction {
  const {
    hasWill,
    legitimateChildCount: lc,
    illegitimateChildCount: ic,
    hasSurvivingSpouse: sp,
    legitimateAscendantCount: asc,
    decedentIsIllegitimate: illegitDecedent,
    hasSiblingsOrNephews: siblings,
    hasOtherCollaterals: collaterals,
  } = inputs;

  const hasLc = lc > 0;
  const hasIc = ic > 0;
  const hasAsc = asc > 0;

  if (hasWill) {
    // --- TESTATE ---
    if (hasLc) {
      // Regime A: Descendants present
      if (!hasIc && !sp) return scenario('T1', 'Testate', 'A');
      if (hasIc && !sp) return scenario('T4', 'Testate', 'A');
      if (!hasIc && sp) return lc === 1
        ? scenario('T2', 'Testate', 'A')
        : scenario('T3', 'Testate', 'A');
      // hasIc && sp
      return lc === 1
        ? scenario('T5a', 'Testate', 'A')
        : scenario('T5b', 'Testate', 'A');
    }

    // Special: Illegitimate decedent + ascendants (Art. 903)
    if (illegitDecedent && hasAsc) {
      return sp
        ? scenario('T15', 'Testate', 'Special')
        : scenario('T14', 'Testate', 'Special');
    }

    // Regime B: Ascendants, no descendants
    if (hasAsc) {
      if (!hasIc && !sp) return scenario('T6', 'Testate', 'B');
      if (!hasIc && sp) return scenario('T7', 'Testate', 'B');
      if (hasIc && !sp) return scenario('T8', 'Testate', 'B');
      return scenario('T9', 'Testate', 'B');
    }

    // Regime C: No primary/secondary compulsory heirs
    if (hasIc && sp) return scenario('T10', 'Testate', 'C');
    if (hasIc && !sp) return scenario('T11', 'Testate', 'C');
    if (!hasIc && sp) return scenario('T12', 'Testate', 'C');
    return scenario('T13', 'Testate', 'C');

  } else {
    // --- INTESTATE ---
    if (hasLc) {
      // Regime A
      if (!hasIc && !sp) return scenario('I1', 'Intestate', 'A');
      if (!hasIc && sp) return scenario('I2', 'Intestate', 'A');
      if (hasIc && !sp) return scenario('I3', 'Intestate', 'A');
      return scenario('I4', 'Intestate', 'A');
    }

    // Regime B: Ascendants
    if (hasAsc) {
      if (!hasIc && !sp) return scenario('I5', 'Intestate', 'B');
      if (!hasIc && sp) return scenario('I6', 'Intestate', 'B');
      if (hasIc && !sp) return scenario('I9', 'Intestate', 'B');
      return scenario('I10', 'Intestate', 'B');
    }

    // Regime C: No descendants, no ascendants
    if (hasIc) {
      return sp
        ? scenario('I8', 'Intestate', 'C')
        : scenario('I7', 'Intestate', 'C');
    }
    if (sp) {
      return siblings
        ? scenario('I12', 'Intestate', 'C')
        : scenario('I11', 'Intestate', 'C');
    }
    if (siblings) return scenario('I13', 'Intestate', 'C');
    if (collaterals) return scenario('I14', 'Intestate', 'C');
    return scenario('I15', 'Intestate', 'C');
  }
}
```

### Scenario Metadata

```typescript
// Constant metadata for all 30 scenario codes
// Used by results view to adapt layout and labels

const SCENARIO_METADATA: Record<ScenarioCode, {
  description: string;
  regime: 'A' | 'B' | 'C' | 'Special';
  successionType: 'Testate' | 'Intestate';
  heirGroups: string[];
  articles: string[];
  /** Whether legitime breakdown columns are relevant */
  hasLegitime: boolean;
  /** Whether free portion column is relevant */
  hasFreePortion: boolean;
  /** Whether donation collation applies */
  hasDonationCollation: boolean;
  /** Special UI treatment needed */
  specialNotes: string[];
}> = {
  // ── Testate Regime A ──
  T1:  { description: 'Legitimate children only (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup'], articles: ['Art. 888'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: [] },
  T2:  { description: '1 legitimate child + surviving spouse (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 888', 'Art. 892¶1'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Spouse gets fixed E/4, not proportional'] },
  T3:  { description: '2+ legitimate children + surviving spouse (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 888', 'Art. 892¶2'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Spouse share equals one child share'] },
  T4:  { description: 'Legitimate + illegitimate children (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup', 'IllegitimateChildGroup'], articles: ['Art. 888', 'Art. 895'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['IC share = 1/2 of LC share (Art. 895)', 'IC total capped against FP (Art. 895¶3)'] },
  T5a: { description: '1 LC + illegitimate children + spouse (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup', 'IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 888', 'Art. 892¶1', 'Art. 895'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['LC gets E/2', 'Spouse gets fixed E/4', 'IC capped'] },
  T5b: { description: '2+ LC + illegitimate children + spouse (testate)', regime: 'A', successionType: 'Testate', heirGroups: ['LegitimateChildGroup', 'IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 888', 'Art. 892¶2', 'Art. 895'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Spouse = one LC share', 'IC capped'] },

  // ── Testate Regime B ──
  T6:  { description: 'Ascendants only (testate)', regime: 'B', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup'], articles: ['Art. 889'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Ascendants divide by degree → line'] },
  T7:  { description: 'Ascendants + spouse (testate)', regime: 'B', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup', 'SurvivingSpouseGroup'], articles: ['Art. 889', 'Art. 893'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: [] },
  T8:  { description: 'Ascendants + illegitimate children (testate)', regime: 'B', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup', 'IllegitimateChildGroup'], articles: ['Art. 889', 'Art. 896'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: [] },
  T9:  { description: 'Ascendants + IC + spouse (testate)', regime: 'B', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup', 'IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 889', 'Art. 896', 'Art. 899'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Most constrained FP (E/8)'] },

  // ── Testate Regime C ──
  T10: { description: 'IC + spouse (testate)', regime: 'C', successionType: 'Testate', heirGroups: ['IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 894'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: [] },
  T11: { description: 'IC only (testate)', regime: 'C', successionType: 'Testate', heirGroups: ['IllegitimateChildGroup'], articles: ['Art. 901'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: [] },
  T12: { description: 'Spouse only (testate)', regime: 'C', successionType: 'Testate', heirGroups: ['SurvivingSpouseGroup'], articles: ['Art. 900'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Art. 900: articulo mortis reduces E/2 → E/3'] },
  T13: { description: 'No compulsory heirs (testate)', regime: 'C', successionType: 'Testate', heirGroups: [], articles: [], hasLegitime: false, hasFreePortion: true, hasDonationCollation: false, specialNotes: ['Entire estate is free portion', 'Only testamentary dispositions apply'] },

  // ── Testate Special ──
  T14: { description: 'Parents of illegitimate decedent (testate)', regime: 'Special', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup'], articles: ['Art. 903'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Only biological parents (not grandparents)', 'Art. 903 iron curtain rule'] },
  T15: { description: 'Parents + spouse of illegitimate decedent (testate)', regime: 'Special', successionType: 'Testate', heirGroups: ['LegitimateAscendantGroup', 'SurvivingSpouseGroup'], articles: ['Art. 903'], hasLegitime: true, hasFreePortion: true, hasDonationCollation: true, specialNotes: ['Parents E/4, Spouse E/4, FP = E/2'] },

  // ── Intestate Regime A ──
  I1:  { description: 'Legitimate children only (intestate)', regime: 'A', successionType: 'Intestate', heirGroups: ['LegitimateChildGroup'], articles: ['Art. 980'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Per-line (stirpes) distribution'] },
  I2:  { description: 'LC + spouse (intestate)', regime: 'A', successionType: 'Intestate', heirGroups: ['LegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 996'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Spouse counts as 1 line'] },
  I3:  { description: 'LC + IC (intestate)', regime: 'A', successionType: 'Intestate', heirGroups: ['LegitimateChildGroup', 'IllegitimateChildGroup'], articles: ['Art. 983', 'Art. 895'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['LC = 2 units, IC = 1 unit'] },
  I4:  { description: 'LC + IC + spouse (intestate)', regime: 'A', successionType: 'Intestate', heirGroups: ['LegitimateChildGroup', 'IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 999', 'Art. 983', 'Art. 895'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Spouse = 2 units (same as LC)'] },
  I5:  { description: 'Ascendants only (intestate)', regime: 'B', successionType: 'Intestate', heirGroups: ['LegitimateAscendantGroup'], articles: ['Art. 985', 'Art. 986', 'Art. 987'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['By degree → by line → equal within'] },
  I6:  { description: 'Ascendants + spouse (intestate)', regime: 'B', successionType: 'Intestate', heirGroups: ['LegitimateAscendantGroup', 'SurvivingSpouseGroup'], articles: ['Art. 997'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Spouse E/2, Ascendants E/2'] },
  I7:  { description: 'IC only (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['IllegitimateChildGroup'], articles: ['Art. 988'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Equal shares'] },
  I8:  { description: 'IC + spouse (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 998'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Spouse E/2, IC split E/2'] },
  I9:  { description: 'Ascendants + IC (intestate)', regime: 'B', successionType: 'Intestate', heirGroups: ['LegitimateAscendantGroup', 'IllegitimateChildGroup'], articles: ['Art. 991'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['Ascendants E/2, IC E/2'] },
  I10: { description: 'Ascendants + IC + spouse (intestate)', regime: 'B', successionType: 'Intestate', heirGroups: ['LegitimateAscendantGroup', 'IllegitimateChildGroup', 'SurvivingSpouseGroup'], articles: ['Art. 1000'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: true, specialNotes: ['3-way: Asc E/2, IC E/4, Spouse E/4'] },
  I11: { description: 'Spouse only (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['SurvivingSpouseGroup'], articles: ['Art. 995'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: false, specialNotes: ['Entire estate to spouse'] },
  I12: { description: 'Spouse + siblings (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['SurvivingSpouseGroup', 'CollateralGroup'], articles: ['Art. 1001'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: false, specialNotes: ['Spouse E/2', 'Siblings E/2 (blood type 2:1 weighting)'] },
  I13: { description: 'Siblings/nephews only (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['CollateralGroup'], articles: ['Art. 1003', 'Art. 1006', 'Art. 1007', 'Art. 1008'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: false, specialNotes: ['Full:Half = 2:1 ratio', 'Nephews per stirpes'] },
  I14: { description: 'Other collaterals (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: ['CollateralGroup'], articles: ['Art. 1009', 'Art. 1010'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: false, specialNotes: ['Nearest degree only', '≤5th degree'] },
  I15: { description: 'No heirs — escheat (intestate)', regime: 'C', successionType: 'Intestate', heirGroups: [], articles: ['Art. 1011', 'Art. 1012', 'Art. 1013', 'Art. 1014'], hasLegitime: false, hasFreePortion: false, hasDonationCollation: false, specialNotes: ['Estate goes to State', 'No distribution table needed'] },
};
```

---

## 6. Results View Adaptation Per Scenario

The results view must adapt its layout and columns based on the scenario code and succession type returned by the engine.

### Distribution Table Column Visibility

```typescript
// Columns to show/hide based on succession type
// Source: engine-output.md InheritanceShare fields

interface ResultsColumnVisibility {
  /** Show "From Legitime" column */
  showFromLegitime: boolean;
  /** Show "From Free Portion" column */
  showFromFreePortion: boolean;
  /** Show "From Intestate" column */
  showFromIntestate: boolean;
  /** Show "Donations Imputed" column */
  showDonationsImputed: boolean;
  /** Show "Legal Basis" column */
  showLegalBasis: boolean;
  /** Show "Inherits By" column (OwnRight vs Representation) */
  showInheritsBy: boolean;
}

function getResultsColumnVisibility(
  successionType: SuccessionType,
  scenarioCode: ScenarioCode,
  hasDonations: boolean,
  hasRepresentation: boolean,
): ResultsColumnVisibility {
  const isTestate = successionType === 'Testate' || successionType === 'Mixed';
  const isIntestate = successionType === 'Intestate' || successionType === 'IntestateByPreterition';
  const isMixed = successionType === 'Mixed';

  return {
    // NOTE: from_legitime/from_free_portion/from_intestate are currently always
    // Money(0) in engine output (engine TODO). When implemented:
    showFromLegitime: isTestate && scenarioCode !== 'T13',
    showFromFreePortion: isTestate,
    showFromIntestate: isIntestate || isMixed,
    showDonationsImputed: hasDonations,
    showLegalBasis: true, // always useful
    showInheritsBy: hasRepresentation,
  };
}
```

### Results View Layout Variants

```typescript
type ResultsLayout =
  | 'standard-distribution'    // Most scenarios: table of heirs with shares
  | 'testate-with-dispositions' // T-codes with will: legitime + FP breakdown
  | 'mixed-succession'         // Mixed: both testate and intestate sections
  | 'preterition-override'     // IntestateByPreterition: warning banner + intestate table
  | 'collateral-weighted'      // I12–I14: blood type weighting display
  | 'escheat'                  // I15: single "Estate → State" display
  | 'no-compulsory-full-fp';   // T13: only testamentary dispositions

function getResultsLayout(
  successionType: SuccessionType,
  scenarioCode: ScenarioCode,
): ResultsLayout {
  if (scenarioCode === 'I15') return 'escheat';
  if (scenarioCode === 'T13') return 'no-compulsory-full-fp';
  if (successionType === 'IntestateByPreterition') return 'preterition-override';
  if (successionType === 'Mixed') return 'mixed-succession';
  if (['I12', 'I13', 'I14'].includes(scenarioCode)) return 'collateral-weighted';
  if (successionType === 'Testate') return 'testate-with-dispositions';
  return 'standard-distribution';
}
```

### Layout Component Specs

#### `standard-distribution` (I1–I11, I-codes without collaterals)

- **Header**: Scenario code badge + description
- **Summary bar**: Total estate, succession type, heir count
- **Distribution table**: heir_name, heir_category, total (formatted as pesos), legal_basis
- **Pie chart**: Proportional shares visualization
- **Narratives section**: Rendered as Markdown (supports `**bold**`)

#### `testate-with-dispositions` (T1–T12, T14–T15)

- All of `standard-distribution` plus:
- **Legitime section**: Compulsory heirs and their reserved shares
- **Free portion section**: Testamentary dispositions (institutions, legacies, devises)
- **Breakdown per heir**: from_legitime + from_free_portion columns (when engine implements)
- **Inofficiousness warning**: If dispositions exceeded FP, show Art. 911 reduction note

#### `mixed-succession`

- **Banner**: "Mixed Succession — testate for disposed portion, intestate for remainder"
- **Testate section**: Compulsory legitimes + will dispositions
- **Intestate section**: Undisposed portion distributed per intestate formula
- **Combined total table**: Per heir, sum of testate + intestate portions

#### `preterition-override`

- **Warning banner**: "Preterition Detected (Art. 854) — All institutions annulled"
- **Explanation**: Which compulsory heir was omitted
- **Distribution table**: Follows intestate formula despite will existing
- **Note**: "Legacies and devises remain valid unless separately inofficious"

#### `collateral-weighted` (I12–I14)

- **Blood type legend**: Full blood = 2 units, Half blood = 1 unit
- **Distribution table** with additional columns: blood_type, units, per-unit value
- **Sibling grouping**: Group by blood type for visual clarity
- **Nephews/nieces**: Show which sibling they represent (per stirpes)

#### `escheat` (I15)

- **Single card**: "No surviving heirs — estate escheats to the State"
- **Legal basis**: Arts. 1011–1014
- **No distribution table** (no individual heir rows)

#### `no-compulsory-full-fp` (T13)

- **Banner**: "No compulsory heirs — entire estate is free portion"
- **Dispositions table**: All institutions, legacies, devises from will
- **No legitime section** (no compulsory heirs to protect)

---

## 7. Succession Type Reclassification

The frontend must handle three reclassification events that happen inside the engine (Steps 5–6) and cannot be predicted from wizard inputs:

### Mixed Succession (after Step 5)

**Trigger**: Testate scenario + will dispositions don't exhaust free portion
**Effect**: `SuccessionType` changes from `Testate` to `Mixed`; undisposed FP distributed intestate
**Frontend impact**: Show both testate and intestate sections in results

### IntestateByPreterition (after Step 6)

**Trigger**: Testate scenario + compulsory heir (degree ≤ 1, not spouse) omitted from ALL dispositions
**Effect**: `SuccessionType` changes to `IntestateByPreterition`; all institutions annulled
**Frontend impact**: Show warning banner; distribution table follows intestate formula
**Note**: `scenario_code` remains the original T* code in the output

### Post-Step 5 Legitime Vacancy (Step 9)

**Trigger**: Compulsory heir renounces, is excluded, or vacancy detected
**Effect**: Pipeline restarts with modified line counts; scenario may change
**Frontend impact**: No special handling needed — final output already reflects the restart

### Pre-submission Scenario Indicator

Since reclassification cannot be predicted, the frontend should:
1. Show the **predicted** scenario code as the user fills the wizard (from `predictScenario()`)
2. After engine response, show the **actual** scenario code + succession type from `EngineOutput`
3. If `SuccessionType === 'Mixed'` or `'IntestateByPreterition'`, show an explanatory note

---

## 8. Scenario → Wizard Step Relevance

Not all wizard steps are equally relevant for every scenario. The frontend can use this mapping to provide contextual guidance.

| Wizard Step | Relevant Scenarios | Notes |
|------------|-------------------|-------|
| Step 1: Estate | All | Always required |
| Step 2: Decedent | All, but `is_illegitimate` only matters for T14/T15; articulo mortis only for T12 | Show hints based on predicted scenario |
| Step 3: Family Tree | All except I15 | I15 has empty family tree |
| Step 4: Will | T-codes only (gated on hasWill toggle) | Hidden entirely for intestate |
| Step 5: Donations | All with family heirs | Most impactful for I1–I4 (collation affects distribution) |
| Step 6: Config | All | Rarely modified; Advanced Settings |

### Per-Scenario Wizard Hints

```typescript
// Display hints to guide user through wizard based on current predicted scenario

function getWizardHints(scenario: ScenarioCode): string[] {
  const meta = SCENARIO_METADATA[scenario];
  const hints: string[] = [];

  hints.push(`Scenario ${scenario}: ${meta.description}`);
  hints.push(`Applicable articles: ${meta.articles.join(', ')}`);

  if (meta.successionType === 'Testate') {
    hints.push('Testamentary dispositions (Step 4) will be processed');
    if (scenario !== 'T13') {
      hints.push('Compulsory heirs have reserved legitimes that cannot be violated');
    }
  }

  for (const note of meta.specialNotes) {
    hints.push(note);
  }

  return hints;
}
```

---

## 9. Edge Cases and Frontend Implications

### T2 vs T3 Boundary (LC count = 1 vs ≥ 2)

- step3_scenario.rs:112-117 — The boundary matters because spouse share formula changes
- T2: Spouse gets fixed E/4 (Art. 892¶1)
- T3: Spouse gets E/(2n), same as each LC (Art. 892¶2)
- **Frontend**: When user adds/removes an LC and crosses the boundary, the predicted scenario flips and the hint should update

### T5a vs T5b Boundary (same as above, with IC)

- step3_scenario.rs:120-125
- Same LC count boundary, but with IC present
- **Frontend**: Same dynamic update

### Descendants Exclude Ascendants

- step3_scenario.rs:101-102 — If ANY LC exists, ascendants in the family tree are still shown but their shares will be zero
- **Frontend**: Show a muted info note next to ascendant persons: "Excluded — descendants have priority (Art. 887¶2)"

### Collaterals Excluded by Compulsory Heirs

- step3_scenario.rs:226-234 — Siblings/nephews/collaterals only inherit when no compulsory heirs survive
- **Frontend**: Same muted info note pattern

### Illegitimate Decedent Detection

- step3_scenario.rs:132-140 — Only checked in testate when no descendants present
- **Frontend**: The `is_illegitimate` checkbox on Decedent step should note: "Affects scenario only when decedent has no descendants and has a will"

### Empty Family Tree (I15 Escheat)

- step3_scenario.rs:233-234 — All counts zero, no siblings, no collaterals
- **Frontend**: If user hasn't added any family members and proceeds, show escheat warning: "With no heirs, the estate escheats to the State (Arts. 1011–1014)"

---

## 10. Affected Wave 1 Types

This analysis cross-references the following Wave 1 types:

| Wave 1 Type | Scenario Relevance |
|------------|-------------------|
| engine-input-root | `will` field presence determines testate/intestate split |
| decedent | `is_illegitimate` drives T14/T15; articulo mortis drives T12 spouse reduction |
| person | `relationship` + `is_alive_at_succession` determine line counts for all scenarios |
| relationship-enum | Maps to heir group counts (LC, IC, Spouse, Ascendant, Collateral) |
| filiation-proof | IC with `filiation_proved=false` excluded → reduces IC count |
| blood-type | Affects I12–I14 distribution formulas (not scenario selection) |
| adoption | AdoptedChild counts as LC → affects LC count |
| will | Presence determines testate vs intestate |
| engine-output | `scenario_code`, `succession_type` fields in output |
| donation | Collation applies in most scenarios (see `hasDonationCollation` flag) |
