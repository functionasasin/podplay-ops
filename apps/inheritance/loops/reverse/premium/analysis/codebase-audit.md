# Codebase Audit — Inheritance Frontend

**Date:** 2026-02-28
**Source files read:**
- `loops/inheritance-frontend-forward/app/src/types/index.ts`
- `loops/inheritance-frontend-forward/app/src/App.tsx`
- `loops/inheritance-frontend-forward/app/src/components/results/*.tsx`
- `loops/inheritance-frontend-forward/app/src/wasm/bridge.ts`
- `loops/inheritance-frontend-forward/app/package.json`

---

## 1. Current Dependencies

```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "recharts": "^3.7.0",
  "react-hook-form": "^7.71.2",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.3.6",
  "lucide-react": "^0.575.0",
  "radix-ui": "^1.4.3",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.5.0",
  "class-variance-authority": "^0.7.1",
  "@fontsource-variable/inter": "^5.2.8",
  "@fontsource-variable/lora": "^5.2.8"
}
```

**Dev deps of note:**
- `vite-plugin-wasm` + `vite-plugin-top-level-await` — WASM loading support
- `vitest` + `@testing-library/react` — test infrastructure
- `tailwindcss ^4.2.1` — Tailwind v4 (CSS-first config)
- `shadcn ^3.8.5` — UI component generator

**Missing for premium features (not yet installed):**
- No PDF generation library (`@react-pdf/renderer`, `jsPDF`, `pdfmake`)
- No Supabase client (`@supabase/supabase-js`)
- No QR code library (`qrcode.react`, `qrcode`)
- No markdown renderer (for case notes)

---

## 2. App State Machine (`App.tsx`)

```typescript
type AppState =
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | { phase: 'results'; input: EngineInput; output: EngineOutput }
  | { phase: 'error'; message: string };
```

**Transitions:**
- `wizard` → `computing` on form submit
- `computing` → `results` on WASM success (receives `EngineInput` + `EngineOutput`)
- `computing` → `error` on WASM throw
- `results` / `error` → `wizard` via `onEditInput()`

**Extension point:** The `results` phase already carries both `input` and `output`. Adding persistence means wrapping this state with a `caseId: string | null` field. The existing flow needs no breaking changes — persistence is an additive layer.

**Missing states:**
- No `loading` state for loading a saved case
- No `saved` / `saving` indicator
- No authenticated vs. anonymous distinction

---

## 3. WASM Bridge (`wasm/bridge.ts`)

**Public API:**
```typescript
export async function compute(input: EngineInput): Promise<EngineOutput>
```

**Internal:**
- `computeWasm(input)` — calls real WASM engine via `compute_json(JSON.stringify(input))`
- `computeMock(input)` — validates + returns synthetic equal-split (kept for tests)
- `ensureWasmInitialized()` — lazy init, supports browser async fetch and Node.js sync

**WASM entry point:** `wasm/pkg/inheritance_engine` exports `compute_json: (json: string) => string` and `initSync` / default `initAsync`.

**Integration points for premium:**
- The `compute()` function signature is stable — PDF export and persistence consume the same `EngineInput` / `EngineOutput` types.
- `EngineInputSchema` (from `schemas/`) is used for validation before WASM call — this Zod schema is reusable for persistence layer validation.

---

## 4. Component Hierarchy

```
App.tsx
├── [wizard phase] WizardContainer
│   ├── EstateStep           — net_distributable_estate input
│   ├── DecedentStep         — decedent fields (name, DOD, marriage, etc.)
│   ├── FamilyTreeStep       — person cards (heirs), relationship, filiation
│   ├── DonationsStep        — donations with collation fields
│   ├── WillStep             — institutions, legacies, devises, disinheritances
│   └── ReviewStep           — JSON preview + submit
│
├── [computing phase] Spinner
│
├── [results phase] ResultsView
│   ├── ResultsHeader        — scenario badge, succession type, total estate
│   ├── DistributionSection  — pie chart + HeirTable (7 layout variants)
│   │   ├── DistributionChart  — Recharts PieChart
│   │   ├── HeirTable          — shadcn Table with conditional columns
│   │   └── CategoryBadge      — colored heir category pill
│   ├── NarrativePanel       — Accordion, one item per heir narrative
│   ├── WarningsPanel        — Alert cards per ManualFlag (hidden if empty)
│   ├── ComputationLog       — Collapsible Accordion with step list
│   └── ActionsBar           — Edit Input | Export JSON | Copy Narratives
│
└── [error phase] Alert + Back Button
```

**shadcn/ui components currently in use:**
`Accordion`, `Alert`, `Badge`, `Button`, `Card`, `Dialog`, `Input`, `Label`,
`Select`, `Separator`, `Table`, `Tabs`, `Tooltip`

**Extension points:**
- `ResultsView` props (`input`, `output`, `onEditInput`) are clean — add `onSave`, `caseId`, `firmProfile` props without breaking existing behavior
- `ActionsBar` is self-contained — add PDF and Share buttons alongside existing buttons
- `DistributionSection` already renders `legal_basis[]` — extension is to add tooltips/expand
- `ResultsHeader` does not render decedent name or DOD — can be added

---

## 5. EngineOutput Fields — Rendered vs. Not Rendered

### InheritanceShare fields

| Field | Type | Rendered? | Notes |
|---|---|---|---|
| `heir_id` | `HeirId` | Key only | Used as React key, not displayed |
| `heir_name` | `string` | YES | Name column in HeirTable |
| `heir_category` | `EffectiveCategory` | YES | CategoryBadge in table |
| `inherits_by` | `InheritanceMode` | Conditional | Shows "By Representation" badge only when any heir uses Representation |
| `represents` | `HeirId \| null` | **NO** | Who the heir represents — never displayed |
| `from_legitime` | `Money` | **NO** | Computed but not shown |
| `from_free_portion` | `Money` | **NO** | Computed but not shown |
| `from_intestate` | `Money` | **NO** | Computed but not shown |
| `total` | `Money` | **NO** | `net_from_estate` used instead |
| `legitime_fraction` | `string` | **NO** | e.g. `"1/2"` — never displayed |
| `legal_basis` | `string[]` | Partial | Rendered as tiny secondary badges (raw codes like `"Art. 887"`), no tooltip, no description |
| `donations_imputed` | `Money` | Conditional | Shown only when any share has imputed donations |
| `gross_entitlement` | `Money` | Conditional | Shown only when any share has imputed donations |
| `net_from_estate` | `Money` | YES | Primary amount column |

**Critical gap: `legal_basis[]`** — The array is rendered as raw article code badges (e.g., "Art. 887 NCC"). There is no:
- Tooltip with article text
- Expandable row to see full citation reasoning
- Description of what each article means
- Link to the NCC text

**Missing breakdown:**
The three-way split (`from_legitime + from_free_portion + from_intestate`) that fully explains how the share was computed is never shown. For a professional legal report, this breakdown is essential.

### EngineOutput top-level fields

| Field | Type | Rendered? | Notes |
|---|---|---|---|
| `per_heir_shares` | `InheritanceShare[]` | YES (partial) | As described above |
| `narratives` | `HeirNarrative[]` | YES | NarrativePanel accordion |
| `computation_log` | `ComputationLog` | YES | Collapsible log |
| `warnings` | `ManualFlag[]` | YES | WarningsPanel (hidden if empty) |
| `succession_type` | `SuccessionType` | YES | ResultsHeader |
| `scenario_code` | `ScenarioCode` | YES | ResultsHeader badge |

### EngineInput fields NOT shown in results

| Field | Notes |
|---|---|
| `decedent.name` | Not shown in ResultsHeader (only in copy-all narratives header string) |
| `decedent.date_of_death` | Not shown in ResultsHeader |
| `decedent.is_married` | Not shown |
| `will.institutions/legacies/devises` | Not shown in results (only affects computation) |
| `donations[]` | Only the imputed amounts per heir are shown, not original donations list |
| `family_tree[].filiation_proof_type` | Not shown in results |

---

## 6. Current Actions (ActionsBar)

| Action | Implementation | Notes |
|---|---|---|
| **Edit Input** | `onEditInput()` → `setState({ phase: 'wizard' })` | Returns to wizard, clears results |
| **Export JSON** | `downloadJson({ input, output }, filename)` | Downloads `inheritance-{DOD}-both.json` |
| **Copy Narratives** | `navigator.clipboard.writeText(header + body)` | Plain text, strips `**bold**` markers |

**Missing actions:**
| Missing Action | Description |
|---|---|
| **Export PDF** | Generate professional PDF report |
| **Print** | Browser print with A4 CSS |
| **Save Case** | Persist to Supabase (requires auth) |
| **Share Link** | Generate read-only shareable URL |
| **Run Estate Tax** | Feed output into estate tax engine |
| **Compare Scenarios** | Toggle between testate/intestate |
| **New Case** | Clear everything and start fresh (different from Edit Input) |

---

## 7. Distribution Section Layout Variants

`getResultsLayout()` in `utils.ts` returns one of 7 variants:

| Layout | Trigger | Special Rendering |
|---|---|---|
| `standard-distribution` | Default (intestate, non-special) | Chart + table |
| `testate-with-dispositions` | `successionType === 'Testate'` | "Compulsory Shares" + "Free Portion" sections |
| `mixed-succession` | `successionType === 'Mixed'` | "Testate Portion" + "Intestate Remainder" sections |
| `preterition-override` | `successionType === 'IntestateByPreterition'` | Table + Art.854 alert banner |
| `collateral-weighted` | Scenarios I12, I13, I14 | Extra Blood Type + Units columns |
| `escheat` | Scenario I15 | Alert only, no table |
| `no-compulsory-full-fp` | Scenario T13 | Info alert + optional table |

All 7 layouts flow through the same `HeirTable` component with conditional columns. PDF export must handle all 7 variants.

---

## 8. Data Flow Summary

```
User Input (RHF forms)
    ↓ [WizardContainer onSubmit]
EngineInput (validated by EngineInputSchema / Zod)
    ↓ [compute(input) in bridge.ts]
JSON.stringify(input)
    ↓ [compute_json() WASM export]
JSON string result
    ↓ [JSON.parse()]
EngineOutput
    ↓ [setState({ phase: 'results', input, output })]
ResultsView renders:
    ├── ResultsHeader (scenarioCode, successionType, netDistributableEstate)
    ├── DistributionSection (per_heir_shares, totalCentavos)
    ├── NarrativePanel (narratives)
    ├── WarningsPanel (warnings, per_heir_shares)
    ├── ComputationLog (computation_log)
    └── ActionsBar (input, output, onEditInput)
```

**Key observation:** Both `input` (EngineInput) and `output` (EngineOutput) are already in component state at the results phase. This means:
- PDF export can access the complete data without any additional data fetching
- Persistence (save case) can serialize both objects directly
- No additional state lifting is needed for basic premium features

---

## 9. Type Interfaces Available for Premium Features

### For PDF Export
```typescript
// All needed data available in ResultsView props:
input: EngineInput       // decedent name, DOD, estate value, heirs
output: EngineOutput     // shares with legal_basis[], narratives, warnings, log
```

### For Persistence (Save/Load Case)
```typescript
// Minimal case record:
interface CaseRecord {
  id: string;
  title: string;                    // e.g., "Estate of Juan dela Cruz"
  input_json: EngineInput;          // full input
  output_json: EngineOutput;        // full output (optional — can recompute)
  created_at: string;
  updated_at: string;
}
```

### For Firm Branding
```typescript
interface FirmProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  counsel_name: string;
  logo_url: string | null;
}
// Passed into ResultsView → PDF generator
```

---

## 10. Styling System

| Technology | Version | Notes |
|---|---|---|
| Tailwind CSS | v4.2.1 | CSS-first config, not `tailwind.config.js` |
| shadcn/ui | v3.8.5 | Components in `components/ui/` |
| Inter Variable | v5 | Default sans-serif font |
| Lora Variable | v5 | Serif font for headings, narrative text |
| CSS variables | — | `--primary`, `--background`, `--foreground`, etc. |
| tw-animate-css | v1.4.0 | Animation utilities |

**Print considerations:**
- No `@media print` styles currently defined
- The `max-w-3xl mx-auto` layout container would need A4 width override
- Sidebar/nav elements (none currently) would need `print:hidden`
- Accordion components (NarrativePanel, ComputationLog) are collapsed by default — print version would need all expanded

---

## 11. Key Gaps Summary (Ranked by Impact)

1. **No PDF export** — `legal_basis[]`, narratives, warnings, computation log all exist but no print-quality output
2. **No persistence** — every refresh loses all work; no case history
3. **`legal_basis[]` incomplete rendering** — raw article codes with no description/tooltip (user must know what "Art. 887" means)
4. **No decedent name/DOD in ResultsHeader** — critical for professional reports
5. **No `from_legitime` / `from_free_portion` / `from_intestate` breakdown** — lawyers need to see how the share was computed
6. **No `legitime_fraction` display** — fraction like "1/4" not shown
7. **No print CSS** — `Ctrl+P` produces an ugly result
8. **No client profiles** — no way to associate computations with clients
9. **No firm branding** — reports are generic, not branded
10. **No scenario comparison** — "what if no will?" is a common planning question
11. **`represents` field unused** — when heir inherits by representation, who they represent is not shown
12. **No estate tax integration** — inheritance output does not feed estate tax engine
13. **No shareable links** — results must be exported manually
14. **No multi-seat** — solo-user only

---

## 12. Discovered Feature Candidates

These emerged from reviewing the codebase and are not in the initial Wave 2 list:

1. **`spec-share-breakdown-panel`** — Render the three-way split (`from_legitime`, `from_free_portion`, `from_intestate`) and `legitime_fraction` for each heir in an expandable row. Critical for legal audit trail. *Sourced from: InheritanceShare fields analysis.*

2. **`spec-decedent-header-in-results`** — ResultsHeader currently shows scenario code and total estate but NOT decedent name or date of death. For professional use, every report page should show "Estate of Juan dela Cruz | Date of Death: January 15, 2025" (decedent name and DOD from input). *Sourced from: ResultsHeader.tsx gap.*

3. **`spec-represents-display`** — When `inherits_by === 'Representation'`, the `represents` field (heir ID) is never displayed. A "representing [deceased parent name]" label would clarify the distribution for clients. *Sourced from: HeirTable conditional rendering.*

4. **`spec-donation-list-in-results`** — The donations list in EngineInput is not shown in results view. For client-facing reports, showing "Advances on inheritance: ₱500,000.00 to Pedro dela Cruz" (donation amount and heir name from engine input) is important for transparency. *Sourced from: Donations gap.*
