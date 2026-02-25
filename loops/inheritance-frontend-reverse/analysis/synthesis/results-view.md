# Results View Specification
## Philippine Inheritance Distribution Engine — React/TypeScript Frontend

**Wave**: 3 (Synthesis)
**Depends on**: All Wave 1 + Wave 2 analysis files, especially `engine-output.md`, `scenario-field-mapping.md`
**Design doc**: `docs/plans/2026-02-24-inheritance-frontend-design.md`

---

## Overview

The Results View is rendered after the engine returns an `EngineOutput`. It consists of
five sections, each mapping to specific EngineOutput fields:

```
┌──────────────────────────────────────────────────────────┐
│  A. Results Header                                       │
│     (scenario badge, succession type, estate total)      │
├──────────────────────────────────────────────────────────┤
│  B. Distribution Chart + Table                          │
│     (per_heir_shares — primary display)                 │
├──────────────────────────────────────────────────────────┤
│  C. Narratives Panel                                     │
│     (narratives[] — expandable per heir)                │
├──────────────────────────────────────────────────────────┤
│  D. Warnings & Flags                                    │
│     (warnings[] — shown prominently when non-empty)     │
├──────────────────────────────────────────────────────────┤
│  E. Computation Log                                      │
│     (computation_log — collapsible, advanced)           │
└──────────────────────────────────────────────────────────┘
│  Actions: [Edit Input]  [Export JSON]  [Copy Narratives] │
└──────────────────────────────────────────────────────────┘
```

---

## A. Results Header

**Component**: `ResultsHeader.tsx`
**Source fields**: `EngineOutput.scenario_code`, `EngineOutput.succession_type`, `EngineInput.net_distributable_estate`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Philippine Inheritance Distribution                      │
│                                                          │
│  [T3]  Testate Succession   |  Total Estate: ₱5,000,000 │
│                                                          │
│  2+ legitimate children + surviving spouse (testate)    │
│  Arts. 888, 892¶2                                       │
│                                                          │
│  [IntestateByPreterition only]                          │
│  ⚠ Art. 854: Preterition detected — all institutions    │
│    annulled. Distribution follows intestate rules.       │
└──────────────────────────────────────────────────────────┘
```

### Scenario Badge

```typescript
// Source: engine-output.md, scenario-field-mapping.md
// Scenario code badge — use SCENARIO_METADATA for color and description

interface ScenarioBadgeProps {
  scenarioCode: ScenarioCode;
  successionType: SuccessionType;
}

// Badge color by succession type:
const SUCCESSION_TYPE_BADGE_COLOR: Record<SuccessionType, string> = {
  Testate: "green",
  Intestate: "blue",
  Mixed: "amber",
  IntestateByPreterition: "red",
};
```

### Succession Type Banner

When `succession_type === "IntestateByPreterition"`:
```
[ERROR BANNER]
⚠ Preterition Detected (Art. 854)
  A compulsory heir was totally omitted from the will. All institutions of heirs
  have been annulled. Distribution follows the intestate succession rules.
  Note: Valid legacies and devises remain in force unless separately inofficious.
```

When `succession_type === "Mixed"`:
```
[INFO BANNER]
ℹ Mixed Succession
  The will does not dispose of the entire free portion. The undisposed portion
  will be distributed under intestate succession rules.
```

---

## B. Distribution Chart + Table

**Components**: `DistributionChart.tsx`, `HeirTable.tsx` (or `HeirCard.tsx`)
**Source fields**: `EngineOutput.per_heir_shares`

### Layout Variants

The layout adapts based on `successionType` and `scenarioCode`:

```typescript
// Source: scenario-field-mapping.md §6
type ResultsLayout =
  | 'standard-distribution'    // I1-I11 intestate: simple heir table
  | 'testate-with-dispositions'// T1-T12, T14-T15: legitime + FP sections
  | 'mixed-succession'         // Mixed: testate + intestate sections
  | 'preterition-override'     // IntestateByPreterition: warning + intestate table
  | 'collateral-weighted'      // I12-I14: blood type unit weighting display
  | 'escheat'                  // I15: no heirs, estate to State
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

### Pie Chart

**Component**: `DistributionChart.tsx`

```typescript
interface DistributionChartProps {
  shares: InheritanceShare[];
  /** Total estate in centavos for percentage calculation */
  totalCentavos: number;
}
```

- One slice per heir with `net_from_estate.centavos > 0`
- Zero-share heirs excluded from chart (but shown in table)
- Colors assigned per `heir_category` (same color per category group)
- Hover/click: highlight corresponding heir row in table
- I15 (escheat): show single "State" slice

### Heir Table — Standard Columns

Every `per_heir_shares` entry renders as a table row or card.

**Primary columns (always shown):**

| Column | Source Field | Format | Notes |
|--------|-------------|--------|-------|
| Name | `heir_name` | string | — |
| Category | `heir_category` → `EFFECTIVE_CATEGORY_LABELS` | Badge | Color per category |
| Net from Estate | `net_from_estate` | `formatPeso(centavos)` | **Primary money value** |

**Secondary columns (conditional):**

| Column | Condition | Source Field | Format |
|--------|-----------|-------------|--------|
| Gross Entitlement | `donations_imputed.centavos > 0` | `gross_entitlement` | `formatPeso(centavos)` |
| Donations Imputed | `donations_imputed.centavos > 0` | `donations_imputed` | `formatPeso(centavos)`, shown as `− ₱N` |
| Inherits By | any heir has `inherits_by = "Representation"` | `inherits_by` | Badge: "By Representation" |
| Represents | `inherits_by = "Representation"` | `represents` → look up name | `representing {heir_name}` |
| Legal Basis | always | `legal_basis` | Clickable tag list |

**Detail columns (shown in expanded heir card, not main table):**

| Column | Condition | Source Field | Format |
|--------|-----------|-------------|--------|
| From Legitime | `from_legitime.centavos > 0` (engine TODO) | `from_legitime` | `formatPeso(centavos)` |
| From Free Portion | `from_free_portion.centavos > 0` (engine TODO) | `from_free_portion` | `formatPeso(centavos)` |
| From Intestate | `from_intestate.centavos > 0` (engine TODO) | `from_intestate` | `formatPeso(centavos)` |
| Legitime Fraction | `legitime_fraction !== ""` (engine TODO) | `legitime_fraction` | string, e.g. "½" |

**Note on engine TODOs**: `from_legitime`, `from_free_portion`, `from_intestate` are
always `{centavos: 0}` in the current engine (`step10_finalize.rs:538-540` marked TODO).
`legitime_fraction` is always `""` (`step10_finalize.rs:542`). Show these columns only
when non-zero / non-empty, for forward compatibility.

### Category Badge Colors

```typescript
// Source: engine-output.md §EffectiveCategory Display Labels
const CATEGORY_BADGE_STYLE: Record<EffectiveCategory, { color: string; label: string }> = {
  LegitimateChildGroup:    { color: "blue",   label: "Legitimate Child" },
  IllegitimateChildGroup:  { color: "purple", label: "Illegitimate Child" },
  SurvivingSpouseGroup:    { color: "green",  label: "Surviving Spouse" },
  LegitimateAscendantGroup:{ color: "orange", label: "Legitimate Ascendant" },
  CollateralGroup:         { color: "gray",   label: "Collateral Relative" },
};
// Note: heir_category_label in HeirNarrative provides finer labels
// (e.g. "adopted child", "grandchild, by representation", "sibling")
```

### Zero-Share Rows

Heirs with `net_from_estate.centavos === 0` are shown in a collapsed "Excluded Heirs"
section below the main table:

```
▼ Excluded Heirs (3)
  [Maria] — Surviving Spouse — Legally Separated, Guilty Party (Art. 1002)
  [Pedro] — Legitimate Child — Renounced Inheritance
  [Ana]   — Legitimate Child — Predeceased, no representing heirs
```

---

### Layout Variant: `collateral-weighted` (I12–I14)

Additional columns shown:

| Column | Source | Notes |
|--------|--------|-------|
| Blood Type | From original input (cross-ref person.blood_type) | "Full Blood" / "Half Blood" |
| Units | Computed: Full=2, Half=1 | Shown for visual clarity |
| Per-Unit Share | `netCentavos / units` | For transparency of 2:1 formula |

Blood type legend banner:
```
ℹ Art. 1004 / 1006: Full blood siblings receive twice the share of half blood siblings.
  Full blood = 2 units | Half blood = 1 unit
```

---

### Layout Variant: `escheat` (I15)

```
┌──────────────────────────────────────────────────────────┐
│  [I15] Intestate Succession                             │
│                                                          │
│  ⚠ Estate Escheats to the State                        │
│                                                          │
│  No surviving heirs were found. The entire estate        │
│  passes to the Republic of the Philippines under        │
│  Arts. 1011–1014 of the Civil Code.                    │
│                                                          │
│  Total Estate: ₱{amount}                               │
└──────────────────────────────────────────────────────────┘
```

No distribution table. Show legal basis citations: Arts. 1011, 1012, 1013, 1014.

---

### Layout Variant: `no-compulsory-full-fp` (T13)

```
[INFO BANNER]
ℹ No Compulsory Heirs — Entire Estate is Free Portion
  The decedent has no living compulsory heirs. The entire estate (₱{amount})
  is disposable by will.

[Testamentary Dispositions Table]
  Only institutions, legacies, and devises from the will appear here.
  There is no compulsory legitime to protect.
```

---

### Layout Variant: `testate-with-dispositions` (T1–T12, T14–T15)

Two sub-sections:

**Section 1: Compulsory Legitimes**
- Header: "Compulsory Shares (Legitime)"
- Shows heirs in `LegitimateChildGroup`, `IllegitimateChildGroup`, `SurvivingSpouseGroup`, `LegitimateAscendantGroup`
- Displays `net_from_estate` and (when engine implements) `from_legitime`

**Section 2: Free Portion Dispositions**
- Header: "Free Portion (Testamentary Dispositions)"
- Shows heirs receiving shares from the free portion
- When (engine implements) `from_free_portion > 0`, show separate column

---

### Layout Variant: `mixed-succession`

Two sub-sections separated by divider:
1. "Testate Portion" — shares from legitimate testamentary dispositions
2. "Intestate Remainder" — shares from undisposed free portion

With combined "Total" column showing sum.

---

### Layout Variant: `preterition-override`

[Large error banner at top — see Section A]

Then: standard `standard-distribution` table with intestate distribution.

Info note below table:
```
ℹ Valid legacies and devises (if any) survive preterition unless separately inofficious.
  Only the institution of heirs was annulled.
```

---

## C. Narratives Panel

**Component**: `NarrativePanel.tsx`
**Source fields**: `EngineOutput.narratives`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Heir Narratives                                        │
│                                                          │
│  ▼ Maria Cruz — Legitimate Child                       │
│  ─────────────────────────────────────────────────────  │
│  **Maria Cruz (legitimate child)** receives             │
│  **₱2,500,000**. The decedent died intestate...        │
│  [Markdown rendered: **bold** → <strong>]              │
│                                                          │
│  ▶ Pedro Santos — Surviving Spouse  (collapsed)        │
│  ▶ Ana Reyes — Legitimate Child     (collapsed)        │
└──────────────────────────────────────────────────────────┘
```

### Narrative Rendering

```typescript
// Source: engine-output.md §HeirNarrative
// text field contains Markdown bold: **name** and **₱amount**
// Render using minimal Markdown parser (bold only)

interface NarrativeRendererProps {
  text: string; // Markdown bold markers: **text**
}

// Implementation: parse **text** → <strong>text</strong>
// Do NOT use a full Markdown parser — only bold is used by the engine
function renderNarrativeText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
```

### Narrative Item

```typescript
interface NarrativeItemProps {
  narrative: HeirNarrative;
  /** Whether this item starts expanded (default: first item only) */
  defaultExpanded?: boolean;
}
```

Header shows: `{heir_name}` — `{heir_category_label}` (from HeirNarrative, not EffectiveCategory)

**Actions:**
- "Copy All Narratives" button → copies all narrative texts as plain text (stripped of Markdown)

---

## D. Warnings & Flags

**Component**: `WarningsPanel.tsx`
**Source fields**: `EngineOutput.warnings`

**Note**: The current engine ALWAYS returns `warnings: []` at the EngineOutput level
(`step10_finalize.rs:619`). Render this section for forward compatibility — when the
engine begins propagating step-level warnings, the frontend will display them without
code changes.

### Layout

When `warnings.length === 0` (current behavior):
```
[Section hidden — no warnings]
```

When `warnings.length > 0`:
```
┌──────────────────────────────────────────────────────────┐
│  ⚠ Manual Review Required                              │
│                                                          │
│  [ERROR]   Preterition detected — institutions annulled │
│            Art. 854: Maria Cruz was omitted from will.  │
│                                                          │
│  [WARNING] Inofficiousness — dispositions reduced       │
│            Arts. 908-912: Legacy to Juan reduced from   │
│            ₱500,000 to ₱200,000 (Art. 911 reduction).  │
│                                                          │
│  [INFO]    Unknown donation recipient                   │
│            Donation to "unknown-id" excluded from       │
│            collation computation.                       │
└──────────────────────────────────────────────────────────┘
```

### Warning Severity Styling

```typescript
// Source: engine-output.md §ManualFlag Severity Mapping
const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",          // Red banner — annuls all institutions
  inofficiousness: "warning",    // Amber banner — dispositions reduced
  disinheritance: "warning",     // Amber banner — heir reinstated
  max_restarts: "error",         // Red banner — pipeline failed to converge
  vacancy_unresolved: "warning", // Amber banner — manual intervention needed
  unknown_donee: "info",         // Blue banner — donation excluded from collation
};

const WARNING_COLORS: Record<"error" | "warning" | "info", string> = {
  error: "red",
  warning: "amber",
  info: "blue",
};
```

### Warning Card

```typescript
interface WarningCardProps {
  flag: ManualFlag;
  severity: "error" | "warning" | "info";
  /** If related_heir_id is set, look up heir name from per_heir_shares */
  relatedHeirName?: string;
}
```

---

## E. Computation Log

**Component**: `ComputationLog.tsx`
**Source fields**: `EngineOutput.computation_log`
**Default state**: Collapsed

### Layout

```
▼ Computation Log (Advanced)
  ────────────────────────────────────────────────────────
  Final Scenario: I4 | Total Restarts: 0

  Steps:
  [10] Finalize + Narrate
       Converted fractional shares to peso amounts and
       generated narratives

  [Note: Only Step 10 is currently logged by the engine.
   Earlier steps (1-9) are not logged in the output.]
```

### Fields Displayed

| Field | Format |
|-------|--------|
| `computation_log.final_scenario` | String, e.g. `"I4"` |
| `computation_log.total_restarts` | `"0 restarts"` or `"1 restart (total renunciation)"` |
| `computation_log.steps[]` | One row per step: `[{step_number}] {step_name} — {description}` |

Restart explanation note (when `total_restarts > 0`):
```
ℹ Pipeline restart: All heirs of one degree renounced inheritance. The engine
  re-ran with the next degree of heirs (Art. 969).
```

---

## Actions Bar

```
[← Edit Input]   [⬇ Export JSON]   [📋 Copy Narratives]
```

### Edit Input
- Returns to wizard with all form state preserved
- User can modify any step and re-run

### Export JSON
Offers two download options:
1. "Export Input JSON" → downloads the `EngineInput` JSON that was submitted
2. "Export Output JSON" → downloads the `EngineOutput` JSON from the engine
3. "Export Both" → downloads a combined JSON: `{ input: EngineInput, output: EngineOutput }`

File naming: `inheritance-{date_of_death}-input.json`, etc.

### Copy Narratives
Copies all `narratives[*].text` joined by `\n\n` with Markdown bold stripped.
Includes a header: `"Philippine Inheritance Distribution — {decedent.name} ({date_of_death})\n\n"`

---

## Money Display Utilities

All money amounts in the results view use the same formatting:

```typescript
// Source: money.md, step10_finalize.rs:215-226
// Mirrors Rust's format_peso() function

function formatPeso(centavos: number | string): string {
  const c = typeof centavos === "string" ? BigInt(centavos) : BigInt(centavos);
  const pesos = c / 100n;
  const cents = c % 100n;
  const pesosStr = pesos.toLocaleString("en-PH"); // Philippine locale: comma thousands
  if (cents === 0n) return `₱${pesosStr}`;
  return `₱${pesosStr}.${cents.toString().padStart(2, "0")}`;
}

// Examples:
// 500_000_000 centavos → "₱5,000,000"
// 50_025 centavos → "₱500.25"
// 100 centavos → "₱1.00"
```

---

## Complete Component Map

```
ResultsView.tsx
├── ResultsHeader.tsx
│   ├── ScenarioBadge (scenario_code + SCENARIO_METADATA)
│   ├── SuccessionTypeBadge (succession_type)
│   ├── SuccessionTypeBanner (Mixed/IntestateByPreterition only)
│   └── EstateTotal (formatPeso(net_distributable_estate))
│
├── DistributionSection.tsx  [layout varies per scenario]
│   ├── DistributionChart.tsx (Recharts PieChart)
│   │   └── One segment per heir with net_from_estate > 0
│   ├── HeirTable.tsx
│   │   ├── HeirRow.tsx (one per per_heir_shares entry)
│   │   │   ├── CategoryBadge (heir_category)
│   │   │   ├── MoneyDisplay (net_from_estate, gross_entitlement, donations_imputed)
│   │   │   ├── RepresentationBadge (when inherits_by = "Representation")
│   │   │   └── LegalBasisTags (legal_basis[])
│   │   └── ExcludedHeirs (collapsed, zero-share heirs)
│   └── [Layout-specific additions: blood type legend, preterition banner, etc.]
│
├── NarrativePanel.tsx
│   ├── NarrativeItem.tsx (one per narratives entry)
│   │   ├── NarrativeHeader (heir_name, heir_category_label)
│   │   └── NarrativeRenderer (renders text with **bold** → <strong>)
│   └── CopyAllButton
│
├── WarningsPanel.tsx  [hidden when warnings = []]
│   └── WarningCard.tsx (one per warnings entry)
│       └── Severity icon + category + description + related_heir_name
│
├── ComputationLog.tsx  [collapsed by default]
│   ├── ScenarioSummary (final_scenario, total_restarts)
│   └── StepLogList (steps[])
│
└── ActionsBar.tsx
    ├── EditInputButton
    ├── ExportJsonButton
    └── CopyNarrativesButton
```

---

## Field-to-Component Mapping (EngineOutput → UI)

| EngineOutput Field | Component | Display Format |
|-------------------|-----------|---------------|
| `scenario_code` | ScenarioBadge | `"T3"` with `SCENARIO_METADATA[code].description` |
| `succession_type` | SuccessionTypeBadge | Label + color; IntestateByPreterition → error banner |
| `per_heir_shares[*].heir_name` | HeirRow | String |
| `per_heir_shares[*].heir_category` | CategoryBadge | `EFFECTIVE_CATEGORY_LABELS[category]` + color |
| `per_heir_shares[*].net_from_estate` | MoneyDisplay | `formatPeso(centavos)` **— PRIMARY** |
| `per_heir_shares[*].total` | MoneyDisplay | `formatPeso(centavos)` — secondary when donations imputed |
| `per_heir_shares[*].donations_imputed` | MoneyDisplay | `"− ₱N"` — shown when `> 0` |
| `per_heir_shares[*].gross_entitlement` | MoneyDisplay | `formatPeso(centavos)` — shown when donations imputed |
| `per_heir_shares[*].inherits_by` | RepresentationBadge | "By Representation" — shown when `= "Representation"` |
| `per_heir_shares[*].represents` | HeirRow subtext | `"representing {name}"` — when non-null |
| `per_heir_shares[*].legal_basis` | LegalBasisTags | Clickable tag per article string |
| `per_heir_shares[*].from_legitime` | MoneyDisplay (detail) | Only when `> 0` (engine TODO) |
| `per_heir_shares[*].from_free_portion` | MoneyDisplay (detail) | Only when `> 0` (engine TODO) |
| `per_heir_shares[*].from_intestate` | MoneyDisplay (detail) | Only when `> 0` (engine TODO) |
| `per_heir_shares[*].legitime_fraction` | FractionDisplay | Only when `!= ""` (engine TODO) |
| `narratives[*].text` | NarrativeRenderer | **bold** → `<strong>` |
| `narratives[*].heir_category_label` | NarrativeItem header | Fine-grained category label |
| `warnings[*]` | WarningCard | Severity color by `WARNING_SEVERITY[category]` |
| `computation_log.final_scenario` | ComputationLog | String |
| `computation_log.total_restarts` | ComputationLog | Count with note if `> 0` |
| `computation_log.steps[*]` | StepLogRow | `[N] step_name — description` |

---

## Validation on Receipt

Before rendering, validate the engine response using `EngineOutputSchema` from `synthesis/schemas.ts`:

```typescript
// Source: engine-output.md, synthesis-schemas.md
import { EngineOutputSchema } from './schemas';

function parseEngineResponse(json: string): EngineOutput {
  const raw = JSON.parse(json);
  const result = EngineOutputSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Engine output validation failed: ${result.error.message}`);
  }
  return result.data;
}
```

Key invariant to check after parsing (from integration.rs:436-447):
```typescript
// Source: tests/integration.rs:436-447 — sum invariant
function validateSumInvariant(shares: InheritanceShare[], netEstate: number): boolean {
  const sumNet = shares.reduce((acc, s) => {
    const c = typeof s.net_from_estate.centavos === 'number'
      ? s.net_from_estate.centavos
      : parseInt(s.net_from_estate.centavos, 10);
    return acc + c;
  }, 0);
  return Math.abs(sumNet - netEstate) <= shares.length; // ±1 centavo per heir for rounding
}
```
