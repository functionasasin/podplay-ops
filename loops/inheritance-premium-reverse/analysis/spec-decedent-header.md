# Feature Spec: Decedent Header in Results

**Aspect:** spec-decedent-header
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** codebase-audit
**No backend dependencies — purely frontend**

---

## 1. Overview

The `ResultsHeader` component currently renders a hardcoded title "Philippine Inheritance Distribution" with no reference to which decedent the report concerns. For professional use by Philippine estate lawyers, every report page — whether on-screen, printed, or exported as PDF — must be immediately attributable to a specific estate. The decedent's name and date of death are the two primary identifiers of an estate.

Both fields are already present in `EngineInput.decedent.name` and `EngineInput.decedent.date_of_death`, and both are already available inside `ResultsView` (which holds the full `input` object in app state). They are currently passed to `NarrativePanel` for the "Copy All Narratives" header string but **are never shown on-screen in the results view**.

This feature modifies `ResultsHeader` to:
1. Replace the static `<h1>` text "Philippine Inheritance Distribution" with **"Estate of [decedent.name]"**
2. Add a styled subtitle line: **"Date of Death: [formatted DOD]"** in the PH legal long-form date format (e.g., "January 15, 2025")

**Why a PH estate lawyer needs this:**
- Every legal document in PH estate practice begins with "In the Estate of [Full Name], deceased" — the results view should match this convention so that screen-captured or printed pages are court-ready context
- When a lawyer has multiple tabs open or multiple printed reports on their desk, the decedent name in the header immediately identifies which estate each report belongs to
- The date of death is a legally significant fact that determines the applicable succession law regime, the estate tax filing deadline (1 year from DOD, per BIR Revenue Regulations), and which assets form part of the gross estate — displaying it prominently anchors the report to the correct legal period
- Estate documents filed with the BIR and courts always carry the DOD prominently; the platform's on-screen view should match the paper documents it will eventually generate
- The `NarrativePanel` already shows "Philippine Inheritance Distribution — [Name] ([DOD])" in its copy-all header; the main results header should be at least as informative

---

## 2. Data Model

No database tables. No Supabase. No new npm packages. Entirely client-side.

### 2.1 Source Fields (already in `EngineInput.decedent`)

```typescript
interface Decedent {
  id: PersonId;
  name: string;               // e.g., "Juan de la Cruz"
  date_of_death: DateString;  // ISO 8601: "2025-01-15"
  // ... other fields not used by this feature
}
```

Both fields are guaranteed non-empty by the wizard's Zod validation schema:
- `name` — required string, minimum length 1
- `date_of_death` — required ISO 8601 date string validated by `EngineInputSchema`

### 2.2 Date Formatting Function

A pure utility function converts the ISO date string to Philippine legal long-form display. This function is added to `ResultsHeader.tsx` directly (not exported — internal to the component file).

```typescript
// Month names used in Philippine legal documents
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * Formats an ISO 8601 date string ("YYYY-MM-DD") to PH legal long-form display.
 * e.g., "2025-01-15" → "January 15, 2025"
 * Splits the string manually to avoid UTC timezone offset issues with new Date().
 */
function formatDateOfDeath(iso: string): string {
  const [yearStr = '', monthStr = '01', dayStr = '01'] = iso.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const monthName = MONTH_NAMES[monthIndex] ?? monthStr;
  return `${monthName} ${day}, ${yearStr}`;
}
```

**Why manual string splitting instead of `new Date()`:** Parsing "2025-01-15" with `new Date("2025-01-15")` produces midnight UTC, which displays as January 14 in timezones west of UTC (e.g., UTC-5 to UTC-8). Philippine estate lawyers and their clients are in UTC+8, but the platform runs in browsers where the system timezone varies. Splitting the ISO string directly is timezone-agnostic and deterministic regardless of the user's system clock.

---

## 3. UI Design

### 3.1 Current State

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Philippine Inheritance Distribution                             │
│   ─────────────────────────────────────────────────────────────  │
│   [T1]  Testate Succession  │  Total Estate: ₱2,000,000.00       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 After This Spec

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   Estate of Juan de la Cruz                                       │
│   Date of Death: January 15, 2025                                 │
│   ─────────────────────────────────────────────────────────────  │
│   [T1]  Testate Succession  │  Total Estate: ₱2,000,000.00       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 3.3 Full Layout Wireframe (Screen)

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Estate of Maria Santos                           [serif h1] │ │
│  │  Date of Death: March 8, 2024               [muted subtitle] │ │
│  │  ─────────────────────────────────────────  [Separator]      │ │
│  │                                                               │ │
│  │  [T2]  Testate Succession   |   Total Estate: ₱4,500,000     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [distribution section follows]                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 3.4 Preterition Alert Variant (with DecedentHeader)

The preterition alert already rendered by `ResultsHeader` continues to appear below the metadata row:

```
  Estate of Rodrigo Aquino
  Date of Death: November 22, 2023
  ─────────────────────────────────────────────────────────────────
  [I3]  Intestate Succession   |   Total Estate: ₱1,200,000

  ┌──────────────────────────────────────────────────────────────┐
  │ ⚠ Preterition Detected (Art. 854)                            │
  │   A compulsory heir was totally omitted from the will. All   │
  │   institutions of heirs have been annulled. Distribution     │
  │   follows the intestate succession rules.                    │
  └──────────────────────────────────────────────────────────────┘
```

### 3.5 Styling Specification

| Element | Tailwind Classes | Notes |
|---|---|---|
| `<h1>` heading | `font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight` | Same font and size as the previous static h1 |
| Date subtitle `<p>` | `text-sm text-muted-foreground mt-0.5` | One line below the h1, small, muted |
| `<Separator>` | `my-4` | Already present — no change |
| Scenario badge row | unchanged | Already in component — no change |

---

## 4. Component Design

### 4.1 Updated `ResultsHeaderProps` Interface

```typescript
// src/components/results/ResultsHeader.tsx

export interface ResultsHeaderProps {
  scenarioCode: ScenarioCode;
  successionType: SuccessionType;
  netDistributableEstate: Money;
  decedentName: string;      // NEW — e.g., "Juan de la Cruz"
  dateOfDeath: string;       // NEW — ISO 8601 "YYYY-MM-DD"
}
```

### 4.2 Updated `ResultsHeader` Component

```tsx
// src/components/results/ResultsHeader.tsx
// (showing only the changed/added lines; imports and constants unchanged)

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatDateOfDeath(iso: string): string {
  const [yearStr = '', monthStr = '01', dayStr = '01'] = iso.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const monthName = MONTH_NAMES[monthIndex] ?? monthStr;
  return `${monthName} ${day}, ${yearStr}`;
}

export function ResultsHeader({
  scenarioCode,
  successionType,
  netDistributableEstate,
  decedentName,
  dateOfDeath,
}: ResultsHeaderProps) {
  const badgeColor = SUCCESSION_TYPE_BADGE_COLOR[successionType];
  const badgeClass = BADGE_CLASSES[badgeColor] ?? BADGE_CLASSES.blue;

  return (
    <div data-testid="results-header">
      <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight">
        Estate of {decedentName}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Date of Death: {formatDateOfDeath(dateOfDeath)}
      </p>

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Badge
          data-testid="scenario-badge"
          variant="outline"
          className={`font-mono text-sm font-semibold px-3 py-1 ${badgeClass}`}
        >
          {scenarioCode}
        </Badge>
        <span className="text-base sm:text-lg font-medium text-foreground">
          {SUCCESSION_LABELS[successionType]}
        </span>
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <span className="text-base sm:text-lg">
          <span className="text-muted-foreground">Total Estate: </span>
          <span className="font-semibold text-foreground">
            {formatPeso(netDistributableEstate.centavos)}
          </span>
        </span>
      </div>

      {successionType === 'IntestateByPreterition' && (
        <Alert variant="destructive" className="mt-4 border-destructive/30 bg-red-50">
          <AlertTriangle className="size-4" />
          <AlertTitle className="font-semibold">Preterition Detected (Art. 854)</AlertTitle>
          <AlertDescription>
            A compulsory heir was totally omitted from the will. All institutions of heirs
            have been annulled. Distribution follows the intestate succession rules.
          </AlertDescription>
        </Alert>
      )}

      {successionType === 'Mixed' && (
        <Alert className="mt-4 border-blue-200 bg-blue-50 text-blue-800">
          <Info className="size-4" />
          <AlertDescription className="text-blue-700">
            The will does not dispose of the entire free portion. The undisposed portion
            will be distributed under intestate succession rules.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### 4.3 Updated `ResultsView` Call Site

```tsx
// src/components/results/ResultsView.tsx — only the ResultsHeader call changes:

<ResultsHeader
  scenarioCode={output.scenario_code}
  successionType={output.succession_type}
  netDistributableEstate={input.net_distributable_estate}
  decedentName={input.decedent.name}
  dateOfDeath={input.decedent.date_of_death}
/>
```

### 4.4 Files to Modify

```
src/components/results/ResultsHeader.tsx     ← add decedentName, dateOfDeath props;
                                                add formatDateOfDeath() helper;
                                                update h1 and add subtitle <p>

src/components/results/ResultsView.tsx       ← pass input.decedent.name
                                                and input.decedent.date_of_death
                                                to ResultsHeader
```

No changes to `App.tsx`, `NarrativePanel.tsx`, `DistributionSection.tsx`, `ActionsBar.tsx`, `bridge.ts`, or any other file.

---

## 5. Integration Points

### 5.1 With `NarrativePanel`

`NarrativePanel` already accepts `decedentName: string` and `dateOfDeath: string` props and uses them in the "Copy All Narratives" clipboard header:
```typescript
`Philippine Inheritance Distribution — ${decedentName} (${dateOfDeath})`
```

The date is used raw (ISO format) in that string — this is deliberate and unchanged by this spec. The results header formats the date for professional display; the clipboard text uses the raw ISO format which is fine for an internal text copy.

No changes to `NarrativePanel`.

### 5.2 With `ActionsBar`

`ActionsBar` uses `input.decedent.date_of_death` directly for the JSON export filename (`inheritance-{DOD}-both.json`). The filename continues to use the ISO date for filesystem compatibility. No changes to `ActionsBar`.

### 5.3 With `spec-pdf-export`

The PDF export spec defines a case summary section at the top of the generated document with:
- Document title: "Estate of [decedent.name]"
- Date of Death label + formatted date

The `formatDateOfDeath()` function defined here (in `ResultsHeader.tsx`) is **not imported** by the PDF renderer (which uses `@react-pdf/renderer` in its own component tree). The PDF renderer implements its own equivalent formatting. Both the PDF title and the on-screen `ResultsHeader` title use the same "Estate of [Name]" pattern, establishing a consistent report identity across all output formats.

### 5.4 With `spec-print-layout`

When the user prints (`Ctrl+P`), `ResultsHeader` renders in the print layout. The decedent name and date of death in the `<h1>` and subtitle `<p>` will be visible on every printed page via CSS `@media print` styles (defined in spec-print-layout). The header is not in the `print:hidden` class list — it renders as-is.

### 5.5 With `spec-auth-persistence`

When a saved case is loaded from Supabase, the app transitions to `{ phase: 'results', input, output }` with the loaded `input` object. The same `ResultsHeader` renders using `input.decedent.name` and `input.decedent.date_of_death` from the loaded case. No persistence-specific changes are needed in this component.

---

## 6. Edge Cases

| Scenario | Behavior |
|---|---|
| `decedentName` is a long name (e.g., "Jose Protacio Rizal Mercado y Alonso Realonda") | The `<h1>` wraps naturally on narrow screens due to `font-serif` with normal `word-wrap`. No truncation applied — legal names must not be truncated in professional documents. |
| `dateOfDeath` is an invalid or unexpected string (not matching "YYYY-MM-DD") | `formatDateOfDeath()` splits on `-` and falls back to raw substrings; `MONTH_NAMES[monthIndex] ?? monthStr` uses the raw substring if `monthIndex` is out of range (0–11). Result may look like "?? 1, 2025" for malformed input, but this cannot occur in practice because `EngineInputSchema` validates the ISO date format before WASM computation runs. |
| `dateOfDeath = ""` (empty string) | `formatDateOfDeath("")` returns " 1, " (month = `MONTH_NAMES[NaN - 1]` = `MONTH_NAMES[undefined]` = `undefined ?? ""` = `""`, day = `NaN`, year = `""`). This is a Zod schema violation that the wizard prevents. |
| Decedent name contains special characters (e.g., "Ña. Concepcion Añonuevo-García") | HTML renders correctly; no escaping needed in JSX. |
| `successionType === 'IntestateByPreterition'` | The preterition Alert renders below the metadata row, unchanged. The decedent name and DOD appear above it. |
| `successionType === 'Mixed'` | The Mixed succession Info alert renders below the metadata row, unchanged. |
| Very short decedent name (e.g., "Bong Go") | Renders as "Estate of Bong Go" — no special handling. |
| Decedent name identical to an heir name | No conflict — the header title "Estate of [Name]" refers to the decedent; heir names appear in the distribution table. |

---

## 7. Dependencies

- **No new npm packages** required
- **No backend / Supabase** required
- **No new components** — only changes to existing `ResultsHeader.tsx` and one line in `ResultsView.tsx`
- **`EngineInput.decedent`** — already in `ResultsView` props; already passed to `NarrativePanel`
- **Tailwind CSS v4** — existing utility classes (`font-serif`, `text-muted-foreground`, `mt-0.5`, `text-sm`) cover all layout needs
- **No dependency on other Wave 2 specs** — this feature is fully self-contained and can be built first among Wave 2 items

---

## 8. Acceptance Criteria

### AC-1: Decedent Name in Heading
- [ ] `ResultsHeader` renders an `<h1>` with text "Estate of [decedent.name]"
- [ ] The name is exactly `input.decedent.name` — no truncation, no capitalization transformation
- [ ] When `decedent.name = "Maria del Pilar Santos-Reyes"`, the heading reads "Estate of Maria del Pilar Santos-Reyes"
- [ ] The `<h1>` uses the same `font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight` classes as the previous static heading

### AC-2: Date of Death Subtitle
- [ ] A `<p>` element appears immediately below the `<h1>` reading "Date of Death: [formatted date]"
- [ ] The `<p>` uses `text-sm text-muted-foreground mt-0.5` classes
- [ ] The date is formatted as "Month Day, Year" — for `"2025-01-15"` the display is "January 15, 2025"
- [ ] For `"2024-03-08"` the display is "March 8, 2024" (no zero-padding for single-digit days)
- [ ] For `"2023-11-22"` the display is "November 22, 2023"

### AC-3: `formatDateOfDeath` Correctness
- [ ] Month names are full English names: January through December
- [ ] Day is an unpadded integer (8, not 08)
- [ ] Year is the full 4-digit year
- [ ] The function uses string splitting, not `new Date()`, so the output is identical regardless of the browser's system timezone (verified by running the test in a mocked UTC-8 environment)

### AC-4: `ResultsView` Prop Forwarding
- [ ] `ResultsView` passes `decedentName={input.decedent.name}` to `ResultsHeader`
- [ ] `ResultsView` passes `dateOfDeath={input.decedent.date_of_death}` to `ResultsHeader`
- [ ] No other props to `ResultsHeader` are changed

### AC-5: Separator and Badge Row Unchanged
- [ ] The `<Separator className="my-4" />` still appears between the subtitle and the metadata row
- [ ] The scenario badge, succession type label, vertical separator, and total estate amount are displayed exactly as before
- [ ] The preterition `<Alert>` continues to render below the metadata row when `successionType === 'IntestateByPreterition'`
- [ ] The Mixed succession `<Alert>` continues to render below the metadata row when `successionType === 'Mixed'`

### AC-6: No Regressions
- [ ] All existing `ResultsHeader` unit tests continue to pass (updated to pass the two new required props)
- [ ] All `ResultsView` unit tests continue to pass (updated to pass the new props through)
- [ ] The `data-testid="results-header"` attribute on the container `<div>` is unchanged
- [ ] The `data-testid="scenario-badge"` attribute on the `<Badge>` is unchanged

### AC-7: Test Coverage for New Behavior
- [ ] A unit test verifies that `ResultsHeader` with `decedentName="Ana Reyes"` renders text "Estate of Ana Reyes"
- [ ] A unit test verifies that `ResultsHeader` with `dateOfDeath="2025-06-01"` renders text "Date of Death: June 1, 2025"
- [ ] A unit test verifies that `formatDateOfDeath("2024-12-31")` returns `"December 31, 2024"`
- [ ] A unit test verifies that `formatDateOfDeath("2025-01-05")` returns `"January 5, 2025"` (no leading zero on day)

### AC-8: Professional Report Identity
- [ ] On-screen results heading matches the PDF report title convention "Estate of [Name]" (as specified in spec-pdf-export §3.1)
- [ ] The date format used on-screen ("January 15, 2025") matches the date format used in Philippine court documents and BIR filings (written month, not numeric)
