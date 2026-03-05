# Results View — Philippine Inheritance Engine v2

**Aspect**: results-view
**Wave**: 5b (Frontend UI)
**Depends On**: typescript-types, zod-schemas, rust-types, wizard-steps

---

## Overview

The Results View is displayed after a successful `computeJson()` call. It receives a
`ComputationOutput` from the WASM engine and presents:

1. **Summary Header** — estate totals, succession type, scenario code
2. **Distribution Table** — per-heir breakdown with source attribution
3. **Distribution Chart** — visual pie/bar chart of shares
4. **Narrative Panel** — plain-English per-heir explanations (engine-generated)
5. **Warnings Panel** — `ValidationWarning[]` items (amber, severity-ranked)
6. **Manual Review Panel** — `ManualReviewFlag[]` items (red, blocking)
7. **Computation Log** — collation, testate validation, vacancy resolutions (collapsible)
8. **Actions Bar** — Print, Export JSON, Recompute (Back to Wizard)

If `computeJson()` returns `{ ok: false, error: ComputationError }`, an **Error State** is
shown instead (see §8 below).

---

## §1. Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Back to Wizard]                              [Print] [Export] │
├─────────────────────────────────────────────────────────────────┤
│  SUMMARY HEADER                                                 │
│  ▸ Succession type | Scenario | Net Estate | Adj. Estate        │
│  ▸ Legitime Total | Free Portion | Restart count (if >0)        │
├──────────────────────┬──────────────────────────────────────────┤
│  DISTRIBUTION TABLE  │  DISTRIBUTION CHART                      │
│  (left, ~55%)        │  (right, ~45%, pie or horizontal bar)    │
├──────────────────────┴──────────────────────────────────────────┤
│  NARRATIVE PANEL (expandable per heir)                          │
├─────────────────────────────────────────────────────────────────┤
│  MANUAL REVIEW FLAGS (red; shown only if flags.length > 0)      │
├─────────────────────────────────────────────────────────────────┤
│  WARNINGS (amber; shown only if warnings.length > 0)            │
├─────────────────────────────────────────────────────────────────┤
│  COMPUTATION LOG (collapsible accordion)                        │
│  ▸ Testate Validation  ▸ Collation  ▸ Vacancy Resolutions       │
│  ▸ Rounding Adjustments                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Responsive layout**: On mobile/narrow screens, chart moves below the table (stacked).

---

## §2. Summary Header

### Data Sources (from `ComputationOutput`)

| Display Label | Field | Format |
|---|---|---|
| Succession Type | `succession_type` | Badge: "Testate" / "Intestate" / "Mixed" |
| Scenario | `scenario_code` | Badge: e.g. "T5 — LC + IC + SP" |
| Net Estate | `net_estate_centavos` | ₱X,XXX,XXX.XX |
| Adjusted Estate (Collation) | `collation_adjusted_estate_centavos` | ₱X,XXX,XXX.XX; shown with tooltip if ≠ net_estate |
| Total Legitime | `total_legitime_centavos` | ₱X,XXX,XXX.XX |
| Free Portion | `free_portion_centavos` | ₱X,XXX,XXX.XX |
| Pipeline Restarts | `restart_count` | Shown only when `restart_count > 0`; badge: "⟳ N restarts" |
| Sum Discrepancy | `sum_check_discrepancy_centavos` | Shown only when ≠ 0; tiny note: "±N centavo rounding" |

### ScenarioCode Display Labels

The `scenario_code` PascalCase string is mapped to a human-readable label for display:

```typescript
const SCENARIO_LABELS: Record<ScenarioCode, string> = {
  T1:  "T1 — LC only",
  T2:  "T2 — LC + Spouse",
  T3:  "T3 — LC + IC",
  T4:  "T4 — LC + IC + Spouse",
  T5:  "T5 — LC + IC + Spouse (Art. 895 cap)",
  T6:  "T6 — LC + Spouse (IC excluded)",
  T7:  "T7 — IC only",
  T8:  "T8 — IC + Spouse",
  T9:  "T9 — IC + Spouse (Art. 900 ¶2)",
  T10: "T10 — Ascendants only",
  T11: "T11 — Ascendants + Spouse",
  T12: "T12 — Spouse only",
  T13: "T13 — No compulsory heirs (full FP)",
  T14: "T14 — Illegitimate decedent, IC only",
  T15: "T15 — Illegitimate decedent, IC + SP",
  I1:  "I1 — LC only (intestate)",
  I2:  "I2 — LC + Spouse",
  I3:  "I3 — LC + IC",
  I4:  "I4 — LC + IC + Spouse",
  I5:  "I5 — IC only",
  I6:  "I6 — IC + Spouse",
  I7:  "I7 — Ascendants only",
  I8:  "I8 — Ascendants + IC",
  I9:  "I9 — Ascendants + IC + Spouse",
  I10: "I10 — Ascendants + Spouse",
  I11: "I11 — Spouse only",
  I12: "I12 — Siblings only",
  I13: "I13 — Siblings + Spouse",
  I14: "I14 — Other collaterals (≤ 5th degree)",
  I15: "I15 — State (escheat)",
};
```

---

## §3. Distribution Table

### Purpose

Shows every heir in `distributions[]`, including **excluded heirs** (total_centavos = 0).
Excluded heirs are visually dimmed and shown at the bottom of the table.

### Column Definitions

| Column | Source Field | Format | Notes |
|---|---|---|---|
| Heir | `heir_name` | String | Name + heir type badge |
| Group | `effective_group` | Badge (color-coded) | G1/G2/G3/G4 |
| From Legitime | `from_legitime_centavos` | ₱ amount | Dimmed if 0 |
| From Free Portion | `from_free_portion_centavos` | ₱ amount | Dimmed if 0 |
| Donations Received | `donations_already_received_centavos` | ₱ amount | Shown as "(−₱X in kind)" tooltip |
| **Total** | `total_centavos` | **₱ amount bold** | 0 shown as "— excluded" |
| Representation | `representation` | Icon + tooltip | "↳ representing [name]" |

### EffectiveGroup Color Coding

```typescript
const GROUP_COLORS: Record<EffectiveGroup, string> = {
  PrimaryCompulsory:    "bg-blue-100 text-blue-800",    // G1: LC/AC/LegC/IC
  SecondaryCompulsory:  "bg-violet-100 text-violet-800", // G2: Ascendants
  SpouseClass:          "bg-teal-100 text-teal-800",     // G3: Spouse
  OptionalHeirs:        "bg-slate-100 text-slate-700",   // G4: Collaterals/strangers
};
```

### Sorting

Default sort order:
1. Active heirs (total_centavos > 0), sorted by group (G1 → G2 → G3 → G4), then by total descending
2. Excluded heirs (total_centavos = 0) at bottom, sorted alphabetically

User can click column headers to resort.

### Representation Indicator

When `heir.representation !== null`:
- Show small "↳" arrow icon in the heir name cell
- Tooltip: "Representing [represented_heir_name] per stirpes (share: [per_stirpes_fraction])"
- On hover/click: expand a sub-row showing the `RepresentationChain` details

### Excluded Heir Rows

Heirs with `total_centavos === 0` are rendered:
- 50% opacity
- "—" in Total column with tooltip: reason (from `heir.narrative` first sentence)
- No representation indicator needed

---

## §4. Distribution Chart

### Chart Type

**Horizontal stacked bar** (preferred over pie chart for accessibility and label clarity
when ≥ 5 heirs). When ≤ 4 heirs, a donut pie chart may also be offered via toggle.

### Data Mapping

Each active heir (total_centavos > 0) gets one segment. Excluded heirs are omitted.

```typescript
interface ChartSegment {
  heirId: HeirId;
  heirName: string;
  group: EffectiveGroup;
  legitime: number;        // centavos
  freePortion: number;     // centavos
  total: number;           // centavos
  pct: string;             // "XX.XX%"
}
```

The bar is stacked in two colors per heir:
- **Darker shade** = legitime portion
- **Lighter shade** = free portion

### Chart Library

Use **Recharts** (v2) — compatible with React 18, no D3 direct dependency, tree-shakeable.

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
```

### Hover Tooltip

On hover over a segment:
```
Juan dela Cruz (G1 — Legitimate Child)
Legitime:      ₱1,250,000.00
Free Portion:  ₱0.00
Total:         ₱1,250,000.00
Share:         50.00% of net estate
```

---

## §5. Narrative Panel

### Purpose

Each `HeirDistribution.narrative` is an engine-generated, plain-English explanation
(Art. citations included). The panel shows one narrative card per heir.

### Layout

Collapsible list, initially showing only **active heirs** (total > 0) expanded.
Excluded heirs collapsed by default; togglable with "Show excluded heirs' narratives".

### Per-Heir Card

```
┌─────────────────────────────────────────────────────┐
│ [G1] Juan dela Cruz — Legitimate Child         ₱1.25M│
├─────────────────────────────────────────────────────┤
│ "As a legitimate child (Art. 887), Juan is entitled │
│  to a legitime of ½ of the net hereditary estate,   │
│  computed as ₱1,250,000.00. No free portion was     │
│  allocated as all disposable shares were willed to  │
│  other beneficiaries."                              │
└─────────────────────────────────────────────────────┘
```

- Heir name + group badge in card header
- Total amount displayed right-aligned in header
- Narrative text in body (pre-wrapped, cite fragments in `<em>`)
- Representation note appended if `representation !== null`:
  "Inheriting per stirpes as representative of [parent name] (Art. 970)."

---

## §6. Manual Review Flags Panel

### Visibility

Shown only when `manual_review_flags.length > 0`.

### Severity

**Critical / blocking**. Displayed above warnings, styled with `bg-red-50 border-red-400`.

### Header

> **⚠ Manual Legal Review Required**
> The following items require review by a licensed attorney before finalizing distribution.

### Flag Display

Each `ManualReviewFlag` variant renders a specific message:

| Flag variant | Display message |
|---|---|
| `AllDescendantsDisinherited` | "All descendant heirs have been disinherited with no representatives. Whether the surviving spouse and/or secondary compulsory heirs inherit must be verified against the will's intent. (Art. 887, BUG-001 batch logic)" |
| `DisinheritedWithSubstituteAndReps` | "Heir [name] has both testamentary substitutes (Art. 857) and representation-eligible descendants. Priority between these must be legally determined." |
| `PosthumousChildPossible` | "A posthumous child may exist (decedent died within 300 days of last known pregnancy). This computation may be voided by Art. 854 preterition." |
| `UsufructElectionRequired` | "Compulsory heir must elect compliance or cash equivalent for usufruct devise [devise_id] (Art. 911 ¶3). Cash-out amount depends on heir's life expectancy." |
| `IndivisibleRealtyPartition` | "Devise [devise_id] is inofficious real property that cannot be physically partitioned. Physical appraisal required (Art. 912)." |
| `ReconciliationPreWill` | "Heir [name] was reconciled before the will was executed. They may be under-provisioned in the will and could have an Art. 906 completion claim." |
| `LegitimationContested` | "The legitimation of heir [name] is contested. This result assumes valid legitimation under FC Arts. 177–179; recalculate if legitimation is voided." |

### Data extraction for heir name display

```typescript
function resolveHeirName(flag: ManualReviewFlag, distributions: HeirDistribution[]): string {
  // Extract heir_id from flag variant data if present, look up in distributions
  if ("heir_id" in flag) {
    return distributions.find(d => d.heir_id === flag.heir_id)?.heir_name ?? flag.heir_id;
  }
  if ("heir_ids" in flag) {
    return flag.heir_ids
      .map(id => distributions.find(d => d.heir_id === id)?.heir_name ?? id)
      .join(", ");
  }
  return "";
}
```

---

## §7. Warnings Panel

### Visibility

Shown only when `warnings.length > 0`.

### Styling

`bg-amber-50 border-amber-300` — amber/yellow for "advisory" severity.

### Warning Rendering

Each `ValidationWarning` variant maps to a display row:

| Warning variant | Icon | Message |
|---|---|---|
| `PreteritionDetected` | ⚠ | "Preterition detected: [names] were completely omitted from the will. Their entire legitime is restored and all voluntary heirs are excluded from the free portion (Art. 854)." |
| `InvalidDisinheritance` | ⚠ | "Disinheritance of [names] was invalid (cause not legally sufficient or cause not proven). Their legitime has been restored (Art. 918)." |
| `ConditionStripped` | ℹ | "Conditions imposed on legitime portions have been legally stripped (Art. 872). Affected dispositions: [ids]." |
| `Underprovision` | ⚠ | "Heir [name] was under-provisioned in the will by ₱X. Their legitime has been topped up to the legal minimum (Art. 906)." |
| `InoficiousnessReduced` | ⚠ | "Devises/legacies reduced by ₱X total due to inofficiousness (Art. 911). Compulsory heirs' legitimes take priority." |
| `ReconciliationVoided` | ℹ | "Reconciliation between testator and [names] voids the disinheritance (Art. 922). Heir remains eligible." |
| `PosthumousHeirPossible` | ⚠ | "A posthumous heir may exist within 300 days of death (Art. 854 ¶2). Verify before finalizing." |
| `AnnuityChoiceRequired` | ℹ | "Heir must choose between compliance with usufruct terms or cash equivalent (Art. 911 ¶3)." |
| `IndivisibleRealty` | ⚠ | "One or more devises involve indivisible real property; physical partition analysis needed (Art. 912)." |
| `MultipleDisinheritances` | ℹ | "N disinheritances were batch-processed simultaneously (BUG-001 fix). Scenario recomputed after batch exclusion." |

---

## §8. Computation Log

### Purpose

Provides a transparent audit trail for legal professionals. Collapsible by default.

### Sub-sections (accordion)

#### 8.1 Testate Validation Log
Shown only when `testate_validation !== null`.

```
Succession Type: Testate
Preterition:     [None | Detected — heirs X, Y]
Disinheritances: [count valid / count invalid]
Inofficiousness: [None | Reduced by ₱X]
Conditions Stripped: [None | N dispositions]
Requires Restart:    [Yes | No]
```

#### 8.2 Collation Log
Shown only when `collation !== null`.

```
Net Estate:           ₱X
Collatable Donations: ₱X (N donations)
Adjusted Estate:      ₱X
─────────────────────────────
Per-heir imputation:
  [Heir Name]  Donation ₱X  →  Charged to legitime ₱X, FP ₱X
  ...
```

#### 8.3 Vacancy Resolutions
Shown only when `vacancy_resolutions.length > 0`.

```
N vacant share(s) resolved:
  [Heir Name] vacancy: [VacancyCause]
  Resolution: [ResolutionMethod]
  Redistributed to: [beneficiary names]
```

#### 8.4 Rounding Adjustments
Shown only when `rounding_adjustments.length > 0`.

```
Hare-Niemeyer rounding applied (N adjustments):
  [Heir Name]  ±1 centavo  (remainder: [numer/denom])
  ...
Sum discrepancy: ±N centavos (expected: ≤1)
```

---

## §9. Error State

When `computeJson()` returns `{ ok: false, error: ComputationError }`:

```
┌──────────────────────────────────────────────────────┐
│  ✕ Computation Error                                 │
│  ──────────────────────────────────────────────────  │
│  [Error message]                                     │
│  [Field path if InputValidation]                     │
│  [Related heir names if DomainValidation]            │
│  [Restart count if MaxRestartsExceeded]              │
│                                                      │
│  [← Back to Wizard]                                  │
└──────────────────────────────────────────────────────┘
```

| `error_type` | Display |
|---|---|
| `InputValidation` | "Input error: [message]" + field path if present |
| `DomainValidation` | "Validation failed: [message]" + heir names |
| `MaxRestartsExceeded` | "Engine exceeded maximum restarts ([count]) at step [last_step]. Please verify your input for circular dependencies." |
| `ArithmeticError` | "Internal arithmetic error: [message]. Please report this as a bug." |
| `PanicRecovered` | "Unexpected engine error: [message]. Please report this as a bug." |

---

## §10. Actions Bar

```typescript
interface ResultsActionsProps {
  input: ComputationInput;    // original input (for Recompute)
  output: ComputationOutput;  // for export
}
```

### Buttons

| Button | Action |
|---|---|
| ← Back to Wizard | Navigate to wizard Step 6 (Review) with same state |
| Print / PDF | `window.print()` — results view has a `@media print` stylesheet |
| Export JSON | `downloadJson({ input, output }, "inheritance-result.json")` |

### Print Stylesheet Notes

- Hide wizard, nav, action bar
- Force black-on-white for chart (replace color fills with patterns)
- Ensure narratives and warnings are fully visible (no accordion collapse in print)

---

## §11. Component Tree

```
<ResultsPage>
  <ResultsActionsBar />           // top bar: back, print, export
  <SummaryHeader output={...} />  // succession type, estate totals
  <div className="grid grid-cols-[55fr_45fr]">
    <DistributionTable distributions={...} />
    <DistributionChart distributions={...} />
  </div>
  <NarrativePanel distributions={...} />
  {flags.length > 0 && <ManualReviewPanel flags={...} distributions={...} />}
  {warnings.length > 0 && <WarningsPanel warnings={...} distributions={...} />}
  <ComputationLog output={...} />  // accordion
</ResultsPage>
```

---

## §12. TypeScript Interface

```typescript
/** Props for the top-level Results page */
interface ResultsPageProps {
  input: ComputationInput;
  output: ComputationOutput;
  onBack: () => void;
}

/** Internal display-ready segment for the chart */
interface ChartSegment {
  heirId: HeirId;
  heirName: string;
  group: EffectiveGroup;
  legitime: number;
  freePortion: number;
  total: number;
  pct: string;
}

/** Display model for the distribution table rows */
interface DistributionRow extends HeirDistribution {
  isExcluded: boolean;
  groupLabel: string;
  heirTypeLabel: string;
  representationTooltip: string | null;
}
```

---

## §13. Data Transformation Utilities

```typescript
/** Format centavos to ₱X,XXX,XXX.XX display string */
function formatPesos(centavos: number): string {
  return "₱" + (centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Derive sorted DistributionRow[] from HeirDistribution[] */
function toDistributionRows(distributions: HeirDistribution[]): DistributionRow[] {
  return distributions
    .map(d => ({
      ...d,
      isExcluded: d.total_centavos === 0,
      groupLabel: GROUP_LABELS[d.effective_group],
      heirTypeLabel: d.heir_name, // narrative already includes type
      representationTooltip: d.representation
        ? `Representing ${d.representation.represented_heir_name} per stirpes (${d.per_stirpes_fraction})`
        : null,
    }))
    .sort((a, b) => {
      if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
      const groupOrder: EffectiveGroup[] = [
        "PrimaryCompulsory", "SecondaryCompulsory", "SpouseClass", "OptionalHeirs",
      ];
      const ga = groupOrder.indexOf(a.effective_group);
      const gb = groupOrder.indexOf(b.effective_group);
      if (ga !== gb) return ga - gb;
      return b.total_centavos - a.total_centavos;
    });
}

/** Build chart segments from distributions (exclude zero-total heirs) */
function toChartSegments(distributions: HeirDistribution[]): ChartSegment[] {
  const active = distributions.filter(d => d.total_centavos > 0);
  const total = active.reduce((sum, d) => sum + d.total_centavos, 0);
  return active.map(d => ({
    heirId: d.heir_id,
    heirName: d.heir_name,
    group: d.effective_group,
    legitime: d.from_legitime_centavos,
    freePortion: d.from_free_portion_centavos,
    total: d.total_centavos,
    pct: total > 0 ? ((d.total_centavos / total) * 100).toFixed(2) + "%" : "0.00%",
  }));
}
```

---

## §14. Cross-Layer Notes

1. **`distributions` contains ALL heirs including excluded** (total_centavos = 0). The UI
   must filter excluded heirs for the chart but show them dimmed in the table.

2. **`collation_adjusted_estate_centavos` vs `net_estate_centavos`**: When collation is
   null, these are equal. Display a tooltip on the adjusted estate field only when they differ.

3. **`restart_count`**: Show a small info badge "⟳ N restarts" when non-zero. Clicking it
   jumps to the Computation Log to explain why restarts occurred.

4. **`sum_check_discrepancy_centavos`**: Should always be 0 or ±1 (Hare-Niemeyer rounding).
   If > 1, display a prominent warning: "Sum discrepancy of N centavos detected — engine
   error. Please report."

5. **Narrative text** is generated by the Rust engine in step10_round.rs. The frontend
   renders it verbatim (no re-templating). HTML escaping is required: use
   `{narrative.split("\n").map(line => <p key={i}>{line}</p>)}`.

6. **`ManualReviewFlag` tag field name**: The serde `#[serde(tag = "flag")]` means the
   JSON discriminant field is `"flag"`, not `"type"`. TypeScript type guards must check
   `flag.flag === "AllDescendantsDisinherited"` etc. (matches zod-schemas.md discriminant).

7. **`ValidationWarning` tag field name**: The serde `#[serde(tag = "code")]` means the
   JSON discriminant field is `"code"`. TypeScript type guards check `warning.code`.

8. **Print layout**: The computation log accordion must be fully expanded during print.
   Use a CSS `@media print { details { display: block; } }` rule.
