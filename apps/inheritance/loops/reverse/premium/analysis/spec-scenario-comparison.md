# Feature Specification: Scenario Comparison (Testate vs. Intestate)

**Reads:** `codebase-audit.md`
**Wave:** 2
**Status:** Complete
**Date:** 2026-03-01

---

## 1. Overview

Scenario Comparison lets a Philippine estate lawyer answer the most common estate planning question in a single click: **"What would happen if the decedent had left no will?"**

When a client has an existing will, the lawyer enters all family and will data, runs the computation, then clicks **"Compare: No Will"**. The app re-runs the WASM engine against the same family tree but with `will: null`, producing an intestate result. A side-by-side diff table shows exactly which heirs gain or lose under each scenario, with peso amounts and percentage deltas.

**Primary use cases:**
1. **Estate planning (before death):** Client is considering whether to write a will. Show how discretionary testamentary allocations change each heir's share vs. what intestate law already gives them.
2. **Settlement audit:** Lawyer received a will and wants to verify no compulsory heir is worse off than they would be under intestate rules. The diff table instantly flags potential preterition or inofficiousness.
3. **Client counseling:** Present a visual diff to the client or their heirs showing why the decedent's will makes sense (or doesn't) compared to default law.

**Why this matters for PH lawyers:**
- Checking inofficiousness (Art. 907, NCC) requires comparing testate legitimes against intestate shares — this feature automates that check.
- Extrajudicial settlement proceedings often require confirming no heir is prejudiced by a will's disposition — the diff table serves as the analysis artifact.
- The feature works entirely client-side (WASM) with no network call. It is instant, offline-capable, and does not require auth.

---

## 2. Data Model

### 2a. Client-Side State (no backend required for base feature)

The comparison result is stored in React component state as an extension of the existing `results` phase in `App.tsx`:

```typescript
// Extended AppState in App.tsx
type AppState =
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | {
      phase: 'results';
      input: EngineInput;
      output: EngineOutput;
      comparison: ComparisonState;  // NEW — always present in results phase
    }
  | { phase: 'error'; message: string };

type ComparisonState =
  | { status: 'idle' }           // Not yet requested
  | { status: 'loading' }        // WASM recompute in progress
  | { status: 'error'; message: string }  // Alternative computation failed
  | {
      status: 'ready';
      alt_input: EngineInput;     // Original input with will: null
      alt_output: EngineOutput;   // Intestate engine result
    };
```

**Transition logic:**
- `results` phase initializes with `comparison: { status: 'idle' }`
- Clicking "Compare: No Will" → set `comparison: { status: 'loading' }` → call `compute(altInput)` → set `comparison: { status: 'ready', alt_input, alt_output }` or `{ status: 'error', message }`
- Clicking "Hide Comparison" → set `comparison: { status: 'idle' }`
- When user clicks "Edit Input" (onEditInput) → returns to wizard phase, comparison state is discarded

### 2b. Persistence Integration (when `spec-auth-persistence` is built)

Add two nullable columns to the `cases` table (defined in `spec-auth-persistence`):

```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS
  comparison_input_json  JSONB DEFAULT NULL,
  comparison_output_json JSONB DEFAULT NULL,
  comparison_ran_at      TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN cases.comparison_input_json  IS 'EngineInput used for the intestate comparison (will field set to null)';
COMMENT ON COLUMN cases.comparison_output_json IS 'EngineOutput from intestate comparison computation';
COMMENT ON COLUMN cases.comparison_ran_at      IS 'Timestamp of last comparison computation';
```

**RLS policy:** Same as the existing `cases` table RLS — user owns the case, comparison data inherits the same access control.

**Save behavior:** When a user saves a case (via the save flow in `spec-auth-persistence`) and a comparison result is in state (`status: 'ready'`), the comparison columns are populated. If `status !== 'ready'`, the columns are left NULL.

**Load behavior:** When a saved case is loaded, if `comparison_input_json` and `comparison_output_json` are non-null, the app hydrates the `ComparisonState` as `{ status: 'ready', alt_input, alt_output }` immediately — no recomputation needed on load.

---

## 3. UI Design

### 3a. Entry Point: ActionsBar Button

The "Compare: No Will" button is added to `ActionsBar` as the fourth action button, after "Copy Narratives".

**Button states:**

| Condition | Button Label | Button State | Tooltip |
|---|---|---|---|
| `input.will !== null` AND comparison `idle` | "Compare: No Will" | Enabled | "See how distribution would differ without this will (intestate rules only)" |
| `input.will !== null` AND comparison `loading` | "Computing..." | Disabled, spinner icon | "Running intestate computation..." |
| `input.will !== null` AND comparison `ready` | "Hide Comparison" | Enabled | "Hide the testate vs. intestate comparison panel" |
| `input.will !== null` AND comparison `error` | "Compare: No Will" | Enabled | "Retry intestate comparison" |
| `input.will === null` | "Compare: No Will" | Disabled (grayed) | "This case is already intestate — no will to compare against. To compare, add a will in the wizard." |

**Lucide icon:** `GitCompare` (v0.575 has this icon; import as `import { GitCompare } from 'lucide-react'`).

**ActionsBar extended prop interface:**
```typescript
export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  comparison: ComparisonState;         // NEW
  onCompare: () => void;               // NEW — triggers computation
  onHideComparison: () => void;        // NEW — returns to idle
}
```

### 3b. ActionsBar Layout with New Button

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ── separator ──────────────────────────────────────────────────────────────  │
│                                                                               │
│  [✏ Edit Input]  [↓ Export JSON]  [⎘ Copy Narratives]  [⑃ Compare: No Will]│
│                                                                               │
│  (on mobile: stacked vertically, full width buttons)                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3c. ComparisonPanel: Main Wireframe

`ComparisonPanel` renders as a new section appended below `ActionsBar` in `ResultsView`, only when `comparison.status === 'ready'`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⑃  TESTATE vs. INTESTATE COMPARISON                         [▲ Collapse]   │
│  ───────────────────────────────────────────────────────────────────────────  │
│  Same family tree and estate value (₱5,000,000.00) computed under two        │
│  succession regimes. Testate: per the will dated 2023-07-01 (Scenario T3).  │
│  Intestate: without any will (Scenario I3), per Arts. 960–1016, NCC.         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  DISTRIBUTION COMPARISON                                                      │
│  ┌─────────────────────────┬──────────────────┬──────────────────┬─────────┐ │
│  │ Heir                    │ With Will (T3)   │ Without Will (I3)│    Δ    │ │
│  ├─────────────────────────┼──────────────────┼──────────────────┼─────────┤ │
│  │ Maria dela Cruz         │  ₱1,250,000.00   │  ₱1,666,666.67  │▲ +₱416K│ │
│  │ Legitimate Child        │  (legitime only) │  (intestate)     │  +33%  │ │
│  ├─────────────────────────┼──────────────────┼──────────────────┼─────────┤ │
│  │ Jose dela Cruz          │  ₱1,250,000.00   │  ₱1,666,666.67  │▲ +₱416K│ │
│  │ Legitimate Child        │  (legitime only) │  (intestate)     │  +33%  │ │
│  ├─────────────────────────┼──────────────────┼──────────────────┼─────────┤ │
│  │ Cora Reyes              │  ₱1,250,000.00   │  ₱1,666,666.66  │▲ +₱416K│ │
│  │ Surviving Spouse        │  (legitime)      │  (intestate)     │  +33%  │ │
│  ├─────────────────────────┼──────────────────┼──────────────────┼─────────┤ │
│  │ Fundacion Sampaloc      │  ₱1,250,000.00   │         ₱0.00   │▼ -₱1.25M│ │
│  │ Testamentary Legatee    │  (free portion)  │ (not an heir)    │ -100%  │ │
│  └─────────────────────────┴──────────────────┴──────────────────┴─────────┘ │
│                                                                               │
│  [i] Fundacion Sampaloc is a legatee named in the will only and receives      │
│      nothing under intestate succession (Art. 960, NCC).                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SCENARIO SUMMARY                                                             │
│  ┌──────────────────────────────┬───────────────────────────────────────────┐│
│  │ With Will (Testate — T3)     │ Without Will (Intestate — I3)             ││
│  │ Succession type: Testate     │ Succession type: Intestate                ││
│  │ Compulsory heirs: ₱3,750,000 │ All legal heirs: ₱5,000,000              ││
│  │ Free portion used: ₱1,250,000│ Free portion: —                           ││
│  │ Testamentary legatees: 1     │ Testamentary legatees: 0                  ││
│  └──────────────────────────────┴───────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  ▶ INTESTATE SCENARIO NARRATIVES                        [Expand all | Close] │
│  (Collapsible accordion — identical to main NarrativePanel but for alt_output)│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3d. Delta Column Color Coding

Delta = `intestate_share_centavos - testate_share_centavos`

| Delta | Color | Indicator | Meaning |
|---|---|---|---|
| > 0 | `text-emerald-700 bg-emerald-50` | ▲ +₱XXX (+Y%) | Heir gains MORE without the will; intestate favors this heir |
| < 0 | `text-red-700 bg-red-50` | ▼ -₱XXX (-Y%) | Heir gains MORE with the will (or is will-only legatee getting nothing intestate) |
| = 0 | `text-muted-foreground` | = ₱0.00 (0%) | No change between scenarios |

### 3e. Loading State Wireframe

While `comparison.status === 'loading'`:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⑃  TESTATE vs. INTESTATE COMPARISON                                         │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│         ○  Computing intestate distribution...                                │
│             (running WASM engine with will: null)                             │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3f. Error State Wireframe

When `comparison.status === 'error'`:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⑃  TESTATE vs. INTESTATE COMPARISON                                         │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  ⚠  Intestate computation failed: {comparison.message}                       │
│                                                                               │
│  [Retry]                                                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3g. "Same Result" State

When all delta values are ₱0.00 (testate distribution is identical to intestate):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✓  The testamentary distribution is identical to intestate distribution     │
│     for all heirs. The will produces no change in share amounts.             │
│     This may indicate the will is redundant or merely confirms intestate     │
│     succession. (All deltas: ₱0.00)                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Hierarchy

### 4a. New Components

```
ComparisonPanel                     — outer container section
├── ComparisonPanelHeader           — title, intro text, collapse button
├── ComparisonDiffTable             — unified heir diff table (core UI)
│   └── ComparisonDiffRow           — one row per merged heir entry
├── ComparisonSummary               — two-column scenario summary cards
└── ComparisonNarrativeSection      — collapsible accordion (reuses NarrativePanel)
```

### 4b. Modified Components

| Component | Change |
|---|---|
| `App.tsx` | `AppState` type extended with `comparison: ComparisonState` on results phase; `handleCompare()` and `handleHideComparison()` handlers added |
| `ResultsView.tsx` | New props: `comparison`, `onCompare`, `onHideComparison`; renders `<ComparisonPanel>` below `<ActionsBar>` when `comparison.status === 'ready'` or `'loading'` or `'error'` |
| `ActionsBarProps` | New props: `comparison`, `onCompare`, `onHideComparison`; new "Compare: No Will" button rendered |

### 4c. Full Extended Type Interfaces

```typescript
// ResultsViewProps extension
export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  comparison: ComparisonState;         // defaults to { status: 'idle' }
  onCompare: () => void;
  onHideComparison: () => void;
}

// ComparisonPanelProps
export interface ComparisonPanelProps {
  baseInput: EngineInput;
  baseOutput: EngineOutput;
  altInput: EngineInput;               // will: null version
  altOutput: EngineOutput;             // intestate result
}

// ComparisonDiffEntry — computed from merging both outputs
export interface ComparisonDiffEntry {
  heir_name: string;
  heir_id: HeirId | null;              // null for strangers (legatees without person_id)
  heir_category_label: string;         // e.g., "Legitimate Child" or "Testamentary Legatee"
  testate_centavos: bigint;            // 0n if absent from testate scenario
  intestate_centavos: bigint;          // 0n if absent from intestate scenario
  delta_centavos: bigint;              // intestate - testate
  delta_pct: number | null;            // null when testate_centavos === 0n (avoid divide-by-zero)
  only_in_testate: boolean;            // legatee with no family_tree entry
  only_in_intestate: boolean;          // heir excluded by will but present in family_tree
}
```

### 4d. Diff Computation Algorithm

```typescript
function buildComparisonDiff(
  baseInput: EngineInput,
  baseOutput: EngineOutput,
  altOutput: EngineOutput,
): ComparisonDiffEntry[] {
  // 1. Build maps keyed by heir_id
  const testateMap = new Map<HeirId, InheritanceShare>();
  for (const s of baseOutput.per_heir_shares) {
    testateMap.set(s.heir_id, s);
  }

  const intestateMap = new Map<HeirId, InheritanceShare>();
  for (const s of altOutput.per_heir_shares) {
    intestateMap.set(s.heir_id, s);
  }

  // 2. Union of all heir IDs
  const allIds = new Set([...testateMap.keys(), ...intestateMap.keys()]);

  // 3. Build diff entries
  const entries: ComparisonDiffEntry[] = [];

  for (const id of allIds) {
    const testate = testateMap.get(id) ?? null;
    const intestate = intestateMap.get(id) ?? null;

    const name = testate?.heir_name ?? intestate?.heir_name ?? id;
    const cat = testate?.heir_category ?? intestate?.heir_category ?? null;
    const catLabel = cat ? EFFECTIVE_CATEGORY_LABELS[cat] : 'Testamentary Legatee';

    const tCent = testate ? BigInt(testate.net_from_estate.centavos) : 0n;
    const iCent = intestate ? BigInt(intestate.net_from_estate.centavos) : 0n;
    const delta = iCent - tCent;

    const deltaPct =
      tCent === 0n
        ? null
        : Number((delta * 10000n) / tCent) / 100; // two decimal precision

    entries.push({
      heir_name: name,
      heir_id: id,
      heir_category_label: catLabel,
      testate_centavos: tCent,
      intestate_centavos: iCent,
      delta_centavos: delta,
      delta_pct: deltaPct,
      only_in_testate: intestate === null,
      only_in_intestate: testate === null,
    });
  }

  // 4. Sort: family_tree members first (by original family_tree order), strangers last
  const familyOrder = baseInput.family_tree.map((p) => p.id);
  entries.sort((a, b) => {
    const ai = a.heir_id ? familyOrder.indexOf(a.heir_id) : Infinity;
    const bi = b.heir_id ? familyOrder.indexOf(b.heir_id) : Infinity;
    if (ai === Infinity && bi === Infinity) return 0;
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });

  return entries;
}
```

### 4e. Alternative Input Construction

```typescript
function buildAlternativeInput(input: EngineInput): EngineInput {
  return {
    ...input,
    will: null,  // strip the will — this is the only change
  };
}
```

`EngineInput` is a plain serializable object (confirmed from codebase audit). Spreading creates a shallow copy. The `will` field is the only change. Family tree, donations, estate value, decedent, and config are identical.

---

## 5. API / Data Layer

### 5a. Client-Side Computation

The comparison requires **no API call and no backend**. The WASM engine is already loaded in the browser. The computation is:

```typescript
// In App.tsx handleCompare():
const handleCompare = async () => {
  if (state.phase !== 'results' || !state.input.will) return;

  setState((prev) => ({
    ...prev,
    phase: 'results',
    comparison: { status: 'loading' },
  }));

  try {
    const altInput = buildAlternativeInput(state.input);
    const altOutput = await compute(altInput); // same WASM bridge as main computation
    setState((prev) => ({
      ...prev,
      phase: 'results',
      comparison: { status: 'ready', alt_input: altInput, alt_output: altOutput },
    }));
  } catch (err: any) {
    setState((prev) => ({
      ...prev,
      phase: 'results',
      comparison: { status: 'error', message: err.message ?? 'Intestate computation failed' },
    }));
  }
};

const handleHideComparison = () => {
  setState((prev) => ({
    ...prev,
    phase: 'results',
    comparison: { status: 'idle' },
  }));
};
```

**Performance:** The WASM engine processes any family tree in under 50ms. No debounce, caching, or web worker is needed. The computation is synchronous from the WASM side; the `async/await` in the bridge handles the one-time WASM initialization delay (only on first use).

### 5b. Persistence Layer (when spec-auth-persistence is live)

**Save with comparison:**
```typescript
// In the save case handler, include comparison if ready:
const savePayload = {
  input_json: input,
  output_json: output,
  comparison_input_json:
    comparison.status === 'ready' ? comparison.alt_input : null,
  comparison_output_json:
    comparison.status === 'ready' ? comparison.alt_output : null,
  comparison_ran_at:
    comparison.status === 'ready' ? new Date().toISOString() : null,
};
```

**Load with comparison:**
```typescript
// When hydrating saved case:
const loadedComparison: ComparisonState =
  caseRow.comparison_output_json && caseRow.comparison_input_json
    ? {
        status: 'ready',
        alt_input: caseRow.comparison_input_json as EngineInput,
        alt_output: caseRow.comparison_output_json as EngineOutput,
      }
    : { status: 'idle' };
```

**Supabase RPC for fetching a case with comparison data:**
No separate RPC needed — the existing `cases` table SELECT query returns all columns including `comparison_input_json` and `comparison_output_json`. The client deserializes them via type assertion.

---

## 6. Integration Points

### 6a. WASM Bridge (`wasm/bridge.ts`)

`compute(EngineInput): Promise<EngineOutput>` is called a second time with the alternative input. No changes to `bridge.ts` are required. The bridge already handles concurrent calls.

### 6b. spec-auth-persistence

The `cases` table gains two nullable JSONB columns and one nullable TIMESTAMPTZ column (see §2b). The save and load functions must be extended to handle these columns. The comparison panel's presence at load time depends on whether the saved case had a comparison.

### 6c. spec-pdf-export

When `ComparisonPanel` is rendered, the PDF export button should offer a second option: "Export Comparison PDF". The comparison PDF follows the same layout as the base inheritance PDF but includes an additional page with the `ComparisonDiffTable`. The PDF generation function receives an optional `comparison: { alt_input: EngineInput; alt_output: EngineOutput }` parameter. When present, the PDF renderer adds a "Scenario Comparison" section after the computation log.

**Comparison PDF section structure:**
```
Page N: SCENARIO COMPARISON
  Heading: Testate vs. Intestate Distribution Comparison
  Subheading: Estate of {decedent.name} | Date of Death: {decedent.date_of_death}

  Introductory paragraph:
    "The following table compares distribution under the will executed on
     {will.date_executed} (Scenario {testate_scenario_code}) against intestate
     succession (Scenario {intestate_scenario_code}) without any will, as
     governed by Arts. 960–1016, New Civil Code."

  Table:
    Columns: Heir | Category | With Will (₱) | Without Will (₱) | Difference (₱) | Change (%)
    Rows: one per ComparisonDiffEntry
    Footer: "Positive difference = heir gains more under intestate succession."

  Summary box:
    With Will: Scenario {T_code} | Total to compulsory heirs: ₱X | Free portion used: ₱Y
    Without Will: Scenario {I_code} | Total to legal heirs: ₱Z | Free portion not applicable
```

### 6d. spec-print-layout

The `ComparisonPanel` must be included in print output when visible. Add `print:block` to `ComparisonPanel` root div (it renders as normal block; no explicit print override needed unless hidden with `hidden`). The diff table prints identically to screen — no special print-only formatting required.

### 6e. spec-shareable-links

When a shareable link is generated for a case with an active comparison (`status: 'ready'`), the read-only view should also render the `ComparisonPanel`. The share token resolves to the full `cases` row including `comparison_input_json` and `comparison_output_json`.

---

## 7. Edge Cases

### 7a. `input.will === null` (Already Intestate)

**Behavior:** "Compare: No Will" button is rendered but disabled (grayed, not interactive). A `<Tooltip>` wraps the button with content: "This case is already intestate — no will to compare against. To compare scenarios, add a will in the wizard."

**Implementation:** Check `input.will === null` in `ActionsBar`. Use shadcn `Tooltip` (already installed) wrapping a `disabled` Button. A disabled button does not fire onClick events; Tooltip still appears on hover.

### 7b. `succession_type === 'IntestateByPreterition'`

The will exists (`input.will !== null`) but was effectively annulled by preterition (Art. 854, NCC). The comparison is still valid: the button is enabled. The base scenario shows "Intestate (Preterition)" and the alternative shows pure intestate without any will. The diff will typically be small or zero since preterition already produces intestate results.

**Informational note in ComparisonPanelHeader:** When `baseOutput.succession_type === 'IntestateByPreterition'`: "Note: The base scenario is already intestate-equivalent due to preterition (Art. 854, NCC). The comparison may show minimal differences."

### 7c. `succession_type === 'Mixed'`

The will covers some heirs; intestate covers the remainder. The "Compare: No Will" button is enabled. The alternative computation removes the will entirely, potentially shifting shares among all heirs. This is the most informative comparison for mixed-succession cases.

### 7d. Escheat Scenario (I15 — No Heirs, Estate to State)

If the original case is an intestate I15 scenario, the button is disabled (already intestate). If the original case is testate and the alternative intestate computation produces I15 (no compulsory heirs, no collateral relatives within 5th degree), the comparison table shows all legatees losing their shares with a note: "Under intestate succession, no legal heirs exist and the estate would escheat to the Republic of the Philippines (Art. 1011, NCC)."

### 7e. Collateral-Weighted Scenarios (I12, I13, I14)

These intestate scenarios have extra columns (Blood Type, Units) in the base `DistributionSection`. The `ComparisonDiffTable` uses a simplified view (just share amounts) and does not replicate the units column. The full detail of the alternative intestate scenario is available in the `ComparisonNarrativeSection`.

### 7f. Identical Distributions (All Deltas Zero)

Rendered with a green "✓ Same Result" banner above the diff table. The table is still shown to confirm all rows are ₱0.00 delta. This condition occurs when the will simply restates intestate law (e.g., a will that gives all children equal shares with no legacies or devises).

### 7g. Computation Race Condition

If the user clicks "Compare: No Will" twice rapidly (before the first completes), the second click is ignored because the button is disabled while `comparison.status === 'loading'`.

### 7h. Very Large Family Trees (50+ Heirs)

No special handling needed. WASM computation time for any valid PH family tree is under 100ms regardless of size. The diff table renders all rows without virtualization (50 rows is within normal DOM performance).

### 7i. Donations That Are Imputed to Heirs

The alternative input retains all `donations` (no change). Donation collation still applies under intestate rules per Arts. 1061–1077, NCC. The diff table may show counter-intuitive deltas when donations shift collation burden differently between testate and intestate.

### 7j. `will.date_executed` Referenced in UI Copy

When `baseInput.will !== null`, the panel header shows: "Testate: per the will dated {will.date_executed} (Scenario {baseOutput.scenario_code})." If `will.date_executed` is an empty string (legacy data), fall back to "Testate: per the will (Scenario {baseOutput.scenario_code})".

---

## 8. Dependencies

### 8a. Build Dependencies

| Dependency | Already Installed | Notes |
|---|---|---|
| `lucide-react` v0.575 | Yes | `GitCompare` icon for the button |
| shadcn `Tooltip` | Yes | For disabled button tooltip |
| shadcn `Tabs` | Yes | Not used in this spec (diff table approach chosen over tabs) |
| `@react-pdf/renderer` | No (planned in spec-pdf-export) | Only needed for PDF export of comparison |
| `@supabase/supabase-js` | No (planned in spec-auth-persistence) | Only needed for persistence of comparison |

**No new npm dependencies are required for the core comparison feature.** The WASM bridge, all type definitions, and shadcn components are already present.

### 8b. Feature Dependencies

| Feature | Required For |
|---|---|
| `codebase-audit` | Confirms App state structure, EngineInput/Output types, WASM bridge API |
| `spec-auth-persistence` | Required for comparison column storage in cases table |
| `spec-pdf-export` | Required for "Export Comparison PDF" functionality |

The core comparison feature (client-side only) has **zero dependencies on other unbuilt features**. It can be implemented before auth, persistence, and PDF are ready. The persistence and PDF integrations are additive enhancements.

---

## 9. Acceptance Criteria

### AC-1: Button Presence and State
- "Compare: No Will" button (GitCompare icon) appears in ActionsBar as the 4th action
- Button is enabled when `input.will !== null`
- Button is disabled with `cursor-not-allowed` styling and tooltip when `input.will === null`
- Button label changes to "Computing..." with a spinner while `comparison.status === 'loading'`
- Button label changes to "Hide Comparison" while `comparison.status === 'ready'`
- Clicking "Hide Comparison" returns comparison to `idle` state and hides `ComparisonPanel`

### AC-2: Computation Correctness
- Alternative input equals original input with `will` field set to `null` — all other fields are identical
- `compute(altInput)` is called exactly once per "Compare" click
- The same WASM bridge used for the main computation is used for the comparison
- Donations are NOT stripped from the alternative input — collation still applies intestate

### AC-3: ComparisonDiffTable Content
- One row per unique `heir_id` across both scenarios
- For heirs in both scenarios: both `net_from_estate` amounts displayed in peso format (₱X,XXX.XX)
- For heirs only in testate: intestate column shows "₱0.00" with label "Not an heir under intestate law"
- For heirs only in intestate: testate column shows "₱0.00" with label "Not an heir under the will"
- Delta column shows `intestate - testate` in ₱ and %
- Delta > 0: text-emerald-700 background, "▲ +₱X (+Y%)"
- Delta < 0: text-red-700 background, "▼ -₱X (-Y%)"
- Delta = 0: text-muted-foreground, "= ₱0.00 (0%)"
- Rows sorted: family_tree members in original family_tree order, then strangers

### AC-4: ComparisonSummary Content
- Shows testate scenario code and label (e.g., "T3 — Testate Succession")
- Shows intestate scenario code and label (e.g., "I3 — Intestate Succession")
- Shows `net_distributable_estate` in both columns (identical value)
- Shows total distributed to compulsory heirs in testate column
- Shows total distributed to all heirs in intestate column

### AC-5: ComparisonNarrativeSection
- Renders `altOutput.narratives` in a `NarrativePanel`-style collapsible accordion
- Section is collapsed by default
- Expand-all button opens all accordion items
- Label: "Intestate Scenario Narratives"

### AC-6: Edge Cases
- IntestateByPreterition base scenario: button enabled, informational banner shown, comparison renders
- Mixed succession base scenario: button enabled, comparison renders
- Intestate base scenario: button disabled with tooltip
- All-zero deltas: "✓ Same Result" banner above table, table still shown
- WASM error during alternative computation: error state shown with retry button

### AC-7: Persistence Integration (when spec-auth-persistence is built)
- Saving a case with `comparison.status === 'ready'` stores `comparison_input_json`, `comparison_output_json`, and `comparison_ran_at` in the `cases` row
- Loading a case with non-null `comparison_output_json` hydrates `ComparisonState` as `{ status: 'ready', ... }` without recomputing
- Loading a case with null `comparison_output_json` sets `ComparisonState` to `{ status: 'idle' }`
- The SQL migration adds `comparison_input_json JSONB DEFAULT NULL`, `comparison_output_json JSONB DEFAULT NULL`, `comparison_ran_at TIMESTAMPTZ DEFAULT NULL` to the `cases` table

### AC-8: PDF Export Integration (when spec-pdf-export is built)
- A "Comparison" scenario code is included in the comparison PDF section header
- The comparison PDF section includes the full `ComparisonDiffTable` content in table format
- The PDF comparison section only appears when `comparison.status === 'ready'`

### AC-9: Print Layout
- `ComparisonPanel` is visible in browser print (`Ctrl+P`) when it is rendered on screen
- Diff table columns do not overflow A4 width in print mode
- Page break is added before `ComparisonPanel` to keep it on a clean page

### AC-10: Accessibility
- "Compare: No Will" button has `aria-label="Compare current testate distribution against intestate succession without a will"`
- Disabled state uses both `disabled` attribute and `aria-disabled="true"`
- Tooltip text is accessible via `aria-describedby` pointing to tooltip element
- Delta values include text descriptions (not color-only) for screen readers: `aria-label="Delta: +416,667 pesos, intestate gives this heir 33% more"`
