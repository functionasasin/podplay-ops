# Feature Spec: Share Breakdown Panel

**Aspect:** spec-share-breakdown-panel
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** codebase-audit
**No backend dependencies — purely frontend**

---

## 1. Overview

The inheritance engine computes a three-way decomposition of every heir's share:
- `from_legitime: Money` — the portion of the share sourced from the reserved legitime pool
- `from_free_portion: Money` — the portion sourced from the testamentary free portion
- `from_intestate: Money` — the portion sourced from intestate distribution rules
- `legitime_fraction: string` — the heir's reserved fraction (e.g. `"1/4"`) of the net distributable estate

All four fields are present in every `InheritanceShare` object returned by the WASM engine. **None are currently rendered in the UI.** The distribution table shows only `net_from_estate` — the final monetary figure after donation imputation — with no indication of how that figure was derived.

This feature adds a **Share Breakdown Panel** that expands below each heir row to show the full computation audit trail: where the gross entitlement came from (legitime, free portion, intestate), how much was imputed for advance donations, and the resulting net amount. This is the same net figure already displayed, but now explained step-by-step.

**Integration with spec-statute-citations-ui:** That spec defined a single chevron button in the Legal Basis cell that expands a per-heir panel showing NCC article descriptions. This spec **extends that same expandable panel** by prepending a Share Breakdown section above the citation list. The chevron trigger, the `colSpan` row insertion mechanism, and the `expandedRows` state are all defined by spec-statute-citations-ui. This spec defines only the content of the new top section.

**Why a PH estate lawyer needs this:**
- Clients routinely ask "why does my sibling get more than me?" — the breakdown shows, e.g., that one heir received ₱500,000 from legitime plus ₱250,000 from the free portion while another received ₱500,000 from legitime only, without any testamentary addition
- The `legitime_fraction` field (e.g., `"1/4"`) answers "what fraction of the estate is legally guaranteed to this heir?" — a critical fact for settlement negotiations
- Testate cases often result in heirs receiving shares composed of both legitime and testamentary portions; clients need to understand that the testamentary portion can be legally challenged (reduction for inofficiousness) while the legitime cannot
- BIR auditors reviewing estate distributions may ask how specific heir amounts were computed; the breakdown provides a documented paper trail
- When imputed donations exist, the breakdown makes clear: "Your gross entitlement was ₱1,000,000 but ₱200,000 was already received as an advance during the decedent's lifetime, so ₱800,000 is paid from the estate"

---

## 2. Data Model

No database tables. No Supabase. No new npm packages. Entirely client-side.

### 2.1 Source Fields (already in `InheritanceShare`)

All fields consumed by this feature are already computed by the WASM engine and available in `EngineOutput.per_heir_shares`:

```typescript
interface InheritanceShare {
  heir_id:          HeirId;       // used as React key
  heir_name:        string;       // used in panel heading
  from_legitime:    Money;        // centavos — share from reserved legitime pool
  from_free_portion: Money;       // centavos — share from testamentary free portion
  from_intestate:   Money;        // centavos — share from intestate distribution
  total:            Money;        // centavos — sum of above three
  legitime_fraction: string;      // e.g. "1/4", "1/2", "" (empty if no reserved fraction)
  donations_imputed: Money;       // centavos — advance on inheritance charged against share
  gross_entitlement: Money;       // centavos — entitlement before donation imputation
  net_from_estate:  Money;        // centavos — gross_entitlement − donations_imputed
}
```

**Relationship between fields:**
- `from_legitime.centavos + from_free_portion.centavos + from_intestate.centavos` equals `total.centavos` and should equal `gross_entitlement.centavos`
- `gross_entitlement.centavos − donations_imputed.centavos = net_from_estate.centavos`
- The panel renders `gross_entitlement` (not the sum of the three components) as the subtotal to avoid any off-by-one discrepancy from rounding in the engine

### 2.2 Display-Only Derived Values

```typescript
// Computed at render time — no state or memoization needed
function hasLegitimeFraction(share: InheritanceShare): boolean {
  const f = share.legitime_fraction;
  // Treat empty string, "0", "0/0", "0/1" as "no reserved fraction"
  if (!f || f === '0' || f.startsWith('0/')) return false;
  return true;
}

function getCentavosNum(m: Money): number {
  return typeof m.centavos === 'string'
    ? parseInt(m.centavos, 10)
    : m.centavos;
}

function hasDonationsImputed(share: InheritanceShare): boolean {
  return getCentavosNum(share.donations_imputed) > 0;
}
```

---

## 3. UI Design

### 3.1 Combined Expanded Row Structure

The expandable row (already defined by spec-statute-citations-ui) now contains two sections:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Name          │ Category    │ Net from Estate │ Legal Basis               │   [^]   │
├──────────────────────────────────────────────────────────────────────────────────── │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │  SECTION A: Share Breakdown (this spec)                                       │   │
│  │  ──────────────────────────────────────────────────────────────────────────   │   │
│  │  Share Computation — Maria Santos                                             │   │
│  │                                                                               │   │
│  │  Legitime Fraction:         1/4 of net distributable estate                   │   │
│  │                                                                               │   │
│  │  From Legitime:             ₱500,000.00                                      │   │
│  │  From Free Portion:         ₱125,000.00                                      │   │
│  │  From Intestate:            ₱0.00                                            │   │
│  │  ─────────────────────────────────────────────────────────────────────────   │   │
│  │  Gross Entitlement:         ₱625,000.00                                      │   │
│  │  Less: Advances on Inheritance:  − ₱50,000.00                               │   │
│  │  ─────────────────────────────────────────────────────────────────────────   │   │
│  │  Net from Estate:           ₱575,000.00                                      │   │
│  │                                                                               │   │
│  │  ─────────────────────────────────────────────────────────────────────────   │   │
│  │  SECTION B: Statutory Citations (spec-statute-citations-ui)                   │   │
│  │  ──────────────────────────────────────────────────────────────────────────   │   │
│  │  Art. 887, New Civil Code                                                     │   │
│  │  Compulsory heirs: legitimate children, parents, surviving spouse …          │   │
│  │                                                                               │   │
│  │  Art. 980, New Civil Code                                                     │   │
│  │  Legitimate children inherit in equal shares; each takes estate ÷ …         │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Share Breakdown Section — Full Wireframes

**Case A: Testate succession with free portion allocation and donation imputation**
(e.g., 2 legitimate children, one received ₱50,000 advance; legitime_fraction = "1/4")

```
  Share Computation — Maria Santos
  ──────────────────────────────────────────────────────────────────────────────

  Legitime Fraction:    1/4 of net distributable estate

  From Legitime:        ₱500,000.00
  From Free Portion:    ₱125,000.00
  From Intestate:              ₱0.00
                        ─────────────────────
  Gross Entitlement:    ₱625,000.00

  Less: Advances on Inheritance:  − ₱50,000.00
                        ─────────────────────
  Net from Estate:      ₱575,000.00
```

**Case B: Pure intestate succession, no donations, no legitime fraction**
(e.g., I1 scenario — one legitimate child, all intestate; legitime_fraction may be "1/1" or empty)

```
  Share Computation — Jose dela Cruz
  ──────────────────────────────────────────────────────────────────────────────

  From Intestate:       ₱2,000,000.00
                        ─────────────────────
  Net from Estate:      ₱2,000,000.00
```

*(from_legitime and from_free_portion are both zero and omitted; no donations; no legitime fraction displayed)*

**Case C: Testate succession, pure legitime share, no donations**
(e.g., T1 scenario — legitimate child gets full 1/2 legitime, no free portion allocation)

```
  Share Computation — Ana Reyes
  ──────────────────────────────────────────────────────────────────────────────

  Legitime Fraction:    1/2 of net distributable estate

  From Legitime:        ₱1,000,000.00
  From Free Portion:           ₱0.00
  From Intestate:              ₱0.00
                        ─────────────────────
  Net from Estate:      ₱1,000,000.00
```

*(donations_imputed = 0 → no "Less: Advances" row; gross_entitlement = net_from_estate so subtotal = final)*

**Case D: Mixed succession — heir receives from both legitime and intestate**
(e.g., preterition annuls institution but surviving spouse retains legitime; remaining distributes intestate)

```
  Share Computation — Elena Santos (Surviving Spouse)
  ──────────────────────────────────────────────────────────────────────────────

  Legitime Fraction:    1/4 of net distributable estate

  From Legitime:        ₱500,000.00
  From Free Portion:           ₱0.00
  From Intestate:       ₱200,000.00
                        ─────────────────────
  Gross Entitlement:    ₱700,000.00

  Net from Estate:      ₱700,000.00
```

*(donations_imputed = 0 → no "Less:" row; gross_entitlement = net_from_estate)*

### 3.3 Rendering Rules

| Condition | Row Shown |
|---|---|
| `from_legitime.centavos > 0` | Always show "From Legitime" row |
| `from_legitime.centavos === 0` AND `from_free_portion.centavos === 0` AND `from_intestate.centavos > 0` | Omit "From Legitime" and "From Free Portion" rows (intestate-only — show only "From Intestate") |
| `from_legitime.centavos >= 0` AND `from_free_portion.centavos >= 0` AND any of them > 0 | Show all three source rows |
| `legitime_fraction` is empty string OR starts with "0/" OR equals "0" | Omit the "Legitime Fraction:" row entirely |
| `donations_imputed.centavos > 0` | Show "Gross Entitlement" subtotal, "Less: Advances" row, horizontal rule, "Net from Estate" |
| `donations_imputed.centavos === 0` | Omit "Gross Entitlement" and "Less: Advances" rows; show only "Net from Estate" |
| `from_legitime + from_free_portion + from_intestate = net_from_estate` AND `donations_imputed = 0` | Use "Net from Estate" as the single bottom line (no subtotal needed) |

**Simplified logic:** If the heir has no donations imputed, show source breakdown then directly "Net from Estate". If donations are imputed, show source breakdown, then "Gross Entitlement" subtotal, then the deduction, then "Net from Estate".

### 3.4 Monetary Formatting

All amounts use `formatPeso()` from `src/types/index.ts`:
- `formatPeso(BigInt(centavos))` → `"₱1,000,000"` or `"₱1,000,000.50"`
- Zero amounts: `"₱0"` (not `"₱0.00"` — `formatPeso` drops trailing zeros when cents = 0)
- Negative: advances display as `"− ₱50,000"` (note: the minus sign is `−` U+2212, not a hyphen)
- The "Less:" row always uses the `−` prefix, never wraps the amount in parentheses

### 3.5 Section Divider Between Breakdown and Citations

The two sections are separated by a thin horizontal rule (`<Separator />` from shadcn/ui) with a label "Statutory Basis" above the citations section. This is already defined by spec-statute-citations-ui for the citations section header — no additional separator is needed.

### 3.6 Mobile Layout

On screens `< sm` (< 640px), the breakdown panel renders identically — the content stacks vertically which already works in mobile viewports. The two-column label + value layout uses `flex justify-between` within the fixed-width collapsed scroll container from the parent `overflow-x-auto` wrapper.

The panel itself has `min-w-[340px]` to ensure the two-column layout does not collapse on very narrow screens. On most phones (≥ 375px), this renders correctly without horizontal scroll within the panel itself.

---

## 4. Component Design

### 4.1 New Component: `ShareBreakdownSection`

```typescript
// src/components/results/ShareBreakdownSection.tsx

import { formatPeso } from '../../types';
import type { InheritanceShare } from '../../types';

interface ShareBreakdownSectionProps {
  share: InheritanceShare;
}

// Centavos as number (handles both string and number Money.centavos)
function c(m: { centavos: number | string }): number {
  return typeof m.centavos === 'string' ? parseInt(m.centavos, 10) : m.centavos;
}

export function ShareBreakdownSection({ share }: ShareBreakdownSectionProps) {
  const hasLegitime   = c(share.from_legitime) > 0;
  const hasFreePortion = c(share.from_free_portion) > 0;
  const hasIntestate  = c(share.from_intestate) > 0;
  const hasDonations  = c(share.donations_imputed) > 0;

  // Show all three source rows when any legitime or free portion is present;
  // show only intestate row when purely intestate (no legitime/free portion).
  const showAllSources = hasLegitime || hasFreePortion;

  // Show legitime_fraction only when it is a meaningful fraction
  const lf = share.legitime_fraction;
  const showLegitimeFraction = lf && lf !== '' && lf !== '0' && !lf.startsWith('0/');

  return (
    <div className="mb-4">
      {/* Section header */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Share Computation — {share.heir_name}
      </p>

      <div className="space-y-1 text-sm">

        {/* Legitime fraction line */}
        {showLegitimeFraction && (
          <div className="flex justify-between text-muted-foreground mb-2">
            <span>Legitime Fraction</span>
            <span className="font-mono font-medium text-foreground">
              {share.legitime_fraction} of net distributable estate
            </span>
          </div>
        )}

        {/* Source breakdown rows */}
        {showAllSources ? (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From Legitime</span>
              <span className="font-mono">{formatPeso(share.from_legitime.centavos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From Free Portion</span>
              <span className="font-mono">{formatPeso(share.from_free_portion.centavos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From Intestate</span>
              <span className="font-mono">{formatPeso(share.from_intestate.centavos)}</span>
            </div>
          </>
        ) : (
          /* Purely intestate — only show the one source row */
          hasIntestate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">From Intestate</span>
              <span className="font-mono">{formatPeso(share.from_intestate.centavos)}</span>
            </div>
          )
        )}

        {/* Subtotal and donation deduction — only when donations are imputed */}
        {hasDonations ? (
          <>
            <div className="border-t border-border/50 pt-1 mt-1 flex justify-between font-medium">
              <span>Gross Entitlement</span>
              <span className="font-mono">{formatPeso(share.gross_entitlement.centavos)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Less: Advances on Inheritance</span>
              <span className="font-mono text-destructive">
                − {formatPeso(share.donations_imputed.centavos)}
              </span>
            </div>
            <div className="border-t border-border/50 pt-1 mt-1 flex justify-between font-semibold text-foreground">
              <span>Net from Estate</span>
              <span className="font-mono">{formatPeso(share.net_from_estate.centavos)}</span>
            </div>
          </>
        ) : (
          /* No donations — single bottom line */
          <div className="border-t border-border/50 pt-1 mt-1 flex justify-between font-semibold text-foreground">
            <span>Net from Estate</span>
            <span className="font-mono">{formatPeso(share.net_from_estate.centavos)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.2 Integration into the Combined Expanded Panel

The combined `<TableRow>` expanded panel (originally defined in spec-statute-citations-ui) is modified to include `ShareBreakdownSection` above the citation list. The `<div>` inside the expanded `<TableCell>` now renders:

```tsx
// Inside the expanded TableRow (colSpan = totalCols):
<TableCell colSpan={totalCols} className="pt-0 pb-3 px-4">
  <div className="rounded-md border border-border/50 bg-background px-4 py-3 min-w-[340px]">

    {/* Section A: Share Breakdown (this spec) */}
    <ShareBreakdownSection share={share} />

    {/* Divider */}
    <Separator className="my-3" />

    {/* Section B: Statutory Citations (spec-statute-citations-ui) */}
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
      Statutory Basis — {share.heir_name}
    </p>
    <div className="space-y-3">
      {share.legal_basis.map((art) => {
        const desc = getArticleDescription(art);
        const displayArt = art.replace(/\s*NCC$/i, '');
        return (
          <div key={art} className="text-sm">
            <p className="font-semibold text-foreground">
              {displayArt}, New Civil Code
            </p>
            <p className="text-muted-foreground leading-relaxed mt-0.5">
              {desc ?? 'See Philippine Civil Code for full text.'}
            </p>
          </div>
        );
      })}
    </div>

  </div>
</TableCell>
```

### 4.3 Files to Create

```
src/components/results/ShareBreakdownSection.tsx    ← NEW component
```

### 4.4 Files to Modify

```
src/components/results/DistributionSection.tsx       ← integrate ShareBreakdownSection
                                                        into the existing expanded panel
```

No changes to `App.tsx`, `ResultsView.tsx`, `bridge.ts`, or any other component.

---

## 5. Integration Points

### 5.1 With spec-statute-citations-ui

`spec-statute-citations-ui` defines:
- The `expandedRows: Set<string>` state in `HeirTable`
- The chevron toggle button in the Legal Basis cell
- The `<TableRow colSpan={totalCols}>` expanded panel container
- The citation content (article list with descriptions)

`spec-share-breakdown-panel` (this spec) adds `ShareBreakdownSection` as the **first child** of that expanded panel container, above the citation content.

**Build order:** `ShareBreakdownSection` can be built independently of spec-statute-citations-ui's citation content. The component has no imports from the citations code. If spec-statute-citations-ui is not yet implemented, `ShareBreakdownSection` can be placed in its own expanded row trigger (a separate "Breakdown ˅" button in the `net_from_estate` cell) and merged later when the citations feature is built. The spec-statute-citations-ui feature must be treated as the canonical expansion mechanism once implemented.

### 5.2 With spec-pdf-export

The PDF export spec (`spec-pdf-export`) already specifies a per-heir share breakdown section in the PDF report. The `ShareBreakdownSection` component is **not** used by the PDF generator (PDFs render via `@react-pdf/renderer` with its own component tree). However, the same field names and rendering logic (which rows to show, how to format) apply. The PDF spec should match the display logic defined here.

Fields used by PDF export from the same source:
- `share.from_legitime`, `share.from_free_portion`, `share.from_intestate`
- `share.legitime_fraction`
- `share.gross_entitlement`, `share.donations_imputed`, `share.net_from_estate`

The `hasLegitimeFraction()` and `hasDonations()` display conditions defined in §4.1 should be replicated in the PDF renderer.

### 5.3 With spec-print-layout

When `forcedExpanded={true}` is passed to `HeirTable` (as defined in spec-statute-citations-ui for print), all expanded panels render including the `ShareBreakdownSection`. No additional print-specific logic is needed in this component.

### 5.4 All 7 Layout Variants

`ShareBreakdownSection` is rendered inside `HeirTable`'s expanded row, which is called from all layout variants. Coverage:

| Layout | `HeirTable` Used | Breakdown Panel Works |
|---|---|---|
| `standard-distribution` | YES | YES |
| `testate-with-dispositions` | YES | YES |
| `mixed-succession` | YES | YES |
| `preterition-override` | YES | YES |
| `collateral-weighted` | YES | YES |
| `escheat` | NO (Alert only) | N/A |
| `no-compulsory-full-fp` | Conditional | YES when rendered |

---

## 6. Edge Cases

| Scenario | Behavior |
|---|---|
| All three source amounts are zero | Heir has `net_from_estate = 0` → appears in excluded heirs section (no expanded row rendered) |
| `from_legitime = 0`, `from_free_portion = 0`, `from_intestate > 0` | Show only "From Intestate" row; omit "From Legitime" and "From Free Portion" rows |
| `legitime_fraction = ""` (empty string) | Omit the "Legitime Fraction:" row |
| `legitime_fraction = "0/4"` | Omit the "Legitime Fraction:" row (starts with "0/") |
| `legitime_fraction = "0"` | Omit the "Legitime Fraction:" row |
| `donations_imputed.centavos = 0` | Omit "Gross Entitlement" and "Less: Advances" rows; render only "Net from Estate" as single bottom line |
| `donations_imputed.centavos > 0` AND `gross_entitlement.centavos - donations_imputed.centavos ≠ net_from_estate.centavos` | Render `net_from_estate` from engine directly (do not recompute); the engine guarantees consistency |
| `legal_basis[]` is empty but share has non-zero amounts | Expanded panel still shows the `ShareBreakdownSection` (breakdown always displays); citations section shows "No statutory citations recorded" placeholder text |
| Very large amounts (> Number.MAX_SAFE_INTEGER centavos, stored as string) | `formatPeso()` uses `BigInt` internally and handles string centavos correctly — no special handling needed |
| Collateral layout (extra Blood Type + Units columns) | `colSpan` is computed dynamically in `HeirTable`; `ShareBreakdownSection` is in the expanded cell and is unaffected by column count |
| Heir inherits by Representation | `from_legitime / from_free_portion / from_intestate` fields apply to the representative heir's share directly; `heir_name` is the representative's name (e.g., "Pedro Santos" not the deceased ancestor) |
| `from_legitime + from_free_portion + from_intestate ≠ gross_entitlement` (rounding edge) | Display `gross_entitlement` from the engine as the subtotal, not the arithmetic sum — this avoids surfacing any engine rounding artifacts in the UI |
| Screen reader navigates to panel | The `ShareBreakdownSection` renders as plain `<div>` + `<p>` + `<span>` elements — fully accessible without ARIA modifications |

---

## 7. Dependencies

- **No new npm packages** required
- **No backend** required
- **`spec-statute-citations-ui`** — provides the expansion mechanism (chevron, `expandedRows` state, `colSpan` row). `ShareBreakdownSection` is the first child of that mechanism's expanded container. If built before spec-statute-citations-ui is implemented, use a temporary separate `<Button>` trigger in the `net_from_estate` cell; merge into the combined panel when citations feature is built
- **`formatPeso()`** — already imported and used in `DistributionSection.tsx`; no change needed
- **Tailwind CSS v4** — existing utility classes cover all layout needs in this component
- **`shadcn/ui Separator`** — already installed (`components/ui/separator.tsx` confirmed in codebase)

---

## 8. Acceptance Criteria

### AC-1: Breakdown Panel Renders for Active Heirs
- [ ] Every heir with `net_from_estate.centavos > 0` has a breakdown panel accessible via the chevron in their row
- [ ] The panel heading reads "Share Computation — [heir_name]"
- [ ] `ShareBreakdownSection` is the first section inside the expanded panel, above the statutory citations

### AC-2: Source Rows Display Correctly
- [ ] When `from_legitime > 0` OR `from_free_portion > 0`: all three "From Legitime", "From Free Portion", "From Intestate" rows are shown
- [ ] When `from_legitime = 0` AND `from_free_portion = 0`: only "From Intestate" row is shown (no zero rows for legitime/free portion)
- [ ] All monetary amounts use `formatPeso()` with Philippine peso symbol ₱

### AC-3: Legitime Fraction Row
- [ ] When `legitime_fraction` is a non-empty, non-zero string (e.g. `"1/4"`, `"1/2"`, `"1/3"`): "Legitime Fraction: 1/4 of net distributable estate" row appears above the source rows
- [ ] When `legitime_fraction` is `""`, `"0"`, or starts with `"0/"`: the "Legitime Fraction:" row does not appear

### AC-4: Donation Imputation Rows
- [ ] When `donations_imputed.centavos > 0`: "Gross Entitlement" subtotal row, "Less: Advances on Inheritance" row with `−` prefix, and "Net from Estate" bottom row all appear
- [ ] When `donations_imputed.centavos = 0`: "Gross Entitlement" and "Less:" rows are omitted; only "Net from Estate" bottom row appears
- [ ] The advance amount is formatted with `−` (U+2212 minus sign) prefix and `text-destructive` color class
- [ ] "Net from Estate" in the breakdown matches the value shown in the main table column exactly

### AC-5: Excluded Heirs Have No Breakdown
- [ ] Heirs in the "Excluded Heirs" section (rendered as a `<div>` list below the table) have no breakdown panel — excluded heirs use a different non-table rendering

### AC-6: Edge Cases
- [ ] `gross_entitlement` is displayed as subtotal (not recomputed from `from_legitime + from_free_portion + from_intestate`)
- [ ] Very large centavo values (stored as string in `Money.centavos`) render correctly via `formatPeso()`
- [ ] Heir inheriting by Representation shows their own computed share amounts (not the deceased ancestor's amounts)

### AC-7: All Layout Variants
- [ ] Breakdown panel appears for heirs in all 7 layout variants where `HeirTable` is rendered
- [ ] `colSpan` on the expanded row is unaffected by the addition of `ShareBreakdownSection`

### AC-8: Integration with spec-statute-citations-ui
- [ ] The combined expanded panel shows Share Breakdown section first, then a `<Separator>`, then the Statutory Citations section
- [ ] A single chevron toggle controls both sections (one click expands both; one click collapses both)
- [ ] When `legal_basis[]` is empty, the Statutory Citations section shows "No statutory citations recorded" rather than an empty block
- [ ] When `forcedExpanded={true}` (print mode, from spec-statute-citations-ui), the breakdown panel renders expanded for all active heirs

### AC-9: Formatting and Alignment
- [ ] Labels and values are laid out with `flex justify-between` — labels on left, amounts right-aligned
- [ ] Amount column uses `font-mono` class for consistent digit alignment
- [ ] Horizontal rules (`border-t`) separate source rows from subtotal/net lines
- [ ] "Net from Estate" bottom line uses `font-semibold` weight

### AC-10: No Regressions
- [ ] All existing tests for `DistributionSection` continue to pass
- [ ] The breakdown panel is not visible by default (collapsed state) — existing snapshots of the unexpanded table are unchanged
- [ ] `formatPeso()`, `getCentavos()`, `hasDonationsImputed()`, `hasRepresentation()` existing helpers in `DistributionSection.tsx` are unchanged
