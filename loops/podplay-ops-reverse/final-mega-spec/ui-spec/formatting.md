# PodPlay Ops Wizard — Formatting Constants

**Aspect**: qa-formatting-constants
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

Canonical display rules for every data type rendered in the UI. All formatting is
implemented in `src/lib/formatters.ts` and imported by components. Zero ad-hoc formatting
in component JSX — always call a formatter function.

---

## 1. Currency Formatting

### Rules

| Context | Rule | Example (whole dollar) | Example (cents) |
|---|---|---|---|
| **Compact** — dashboard metric tiles, table cells, summary rows | Omit `.00` for whole-dollar amounts; show 2 decimal places when cents are non-zero | `$12,500` | `$12,500.50` |
| **Precise** — BOM unit costs, BOM line-item totals, expense line items | Always show 2 decimal places | `$45.00` | `$129.99` |
| **Input placeholder** | Always show 2 decimal places hint | `0.00` | — |
| **Zero** | `$0` (compact) or `$0.00` (precise) — never blank | — | — |
| **Negative** (expense credits, adjustments) | Prefix with `−` (minus), red text: `text-red-600` | `−$250` | `−$12.50` |

### Thousands Separator

Always use comma separator for values ≥ 1,000. No exception.
- `$1,000` not `$1000`
- `$1,250,000` not `$1250000`

### Currency Symbol

Always USD `$` prefix. No currency code (e.g., `USD`) shown in UI — app is US-only.

### TypeScript Implementation

```ts
// src/lib/formatters.ts

/**
 * Compact currency: $12,500 (no .00) or $12,500.50 (cents when non-zero).
 * Used in: dashboard metric tiles, project list table, P&L summary rows.
 */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value)
  const isWholeNumber = abs % 1 === 0
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
  }).format(abs)
  return value < 0 ? `−${formatted}` : formatted
}

/**
 * Precise currency: always 2 decimal places.
 * Used in: BOM unit costs, BOM line totals, expense form inputs, invoice amounts.
 */
export function formatCurrencyPrecise(value: number): string {
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)
  return value < 0 ? `−${formatted}` : formatted
}
```

### Specific Usage Map

| Field | Formatter | Example |
|---|---|---|
| Dashboard "Pipeline Value" metric tile | `formatCurrencyCompact` | `$487,500` |
| Dashboard "Total Contract Value" column | `formatCurrencyCompact` | `$28,000` |
| BOM item unit cost | `formatCurrencyPrecise` | `$45.00` |
| BOM item line total | `formatCurrencyPrecise` | `$180.00` |
| BOM stage summary (total BOM cost) | `formatCurrencyCompact` | `$18,400` |
| Invoice deposit amount | `formatCurrencyPrecise` | `$14,000.00` |
| Invoice final amount | `formatCurrencyPrecise` | `$14,000.00` |
| Expense line item amount | `formatCurrencyPrecise` | `$329.00` |
| P&L row (revenue, hardware cost, gross profit) | `formatCurrencyCompact` | `$28,000` |
| HER ratio | Not currency — see §3 | `2.3x` |
| Settings pricing tier default prices | `formatCurrencyPrecise` | `$28,000.00` |
| Settings labor rate | `formatCurrencyPrecise` | `$150.00` |

---

## 2. Date Formatting

### Rules

| Context | Format | Example |
|---|---|---|
| **Table cell display** (go-live date, PO date, payment date) | `MMM D, YYYY` | `Jan 5, 2026` |
| **Short date** (timeline labels, chart x-axis) | `MM/DD/YY` | `01/05/26` |
| **Form input field** (date pickers) | Native `<input type="date">` — browser renders per OS locale; value stored as ISO | — |
| **Relative time** (tooltip on hover over a date cell showing "2 days ago") | `X days ago` / `X months ago` / `yesterday` / `today` | `3 days ago` |
| **Month header** (monthly P&L table) | `MMM YYYY` | `Jan 2026` |
| **ISO storage** (all DB writes/reads) | `YYYY-MM-DD` | `2026-01-05` |
| **Null / not set** | Em dash: `—` | `—` |

### TypeScript Implementation

```ts
// src/lib/formatters.ts

/**
 * Table cell date: "Jan 5, 2026"
 * Used in: go_live_date, installation_start_date, invoice paid_date, PO ordered_at.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString + 'T00:00:00') // prevent UTC offset shifting
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  // Output: "Jan 5, 2026"
}

/**
 * Short date: "01/05/26"
 * Used in: chart axis labels, condensed timeline columns.
 */
export function formatDateShort(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString + 'T00:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}/${dd}/${yy}`
}

/**
 * Month label: "Jan 2026"
 * Used in: monthly P&L column headers, financial chart x-axis.
 */
export function formatMonth(isoString: string): string {
  const d = new Date(isoString + '-01T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Relative time for tooltip (simple, no external library).
 * Used in: date cell tooltips (title attribute).
 */
export function formatRelativeDate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const now = new Date()
  const d = new Date(isoString + 'T00:00:00')
  const diffDays = Math.round((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays === -1) return 'tomorrow'
  if (diffDays > 0 && diffDays < 30) return `${diffDays} days ago`
  if (diffDays >= 30 && diffDays < 365) return `${Math.round(diffDays / 30)} months ago`
  if (diffDays < 0 && diffDays > -30) return `in ${Math.abs(diffDays)} days`
  return formatDate(isoString) // fall back to absolute for old/far dates
}
```

### Date Cell Pattern

All date cells in tables render with the absolute date visible and relative time in a
`title` tooltip:

```tsx
// In any table DateCell component
<td title={formatRelativeDate(value)} className="tabular-nums text-sm text-muted-foreground">
  {formatDate(value)}
</td>
```

---

## 3. Percentage and Ratio Formatting

### Rules

| Context | Format | Decimal places | Example |
|---|---|---|---|
| **Deployment progress** (checklist completion %) | Integer % | 0 | `85%` |
| **Gross margin %** (P&L and project summary) | 1 decimal place % | 1 | `42.5%` |
| **HER (Hardware Efficiency Ratio)** | Multiplier with `x` suffix | 1 | `2.3x` |
| **BOM completion fraction** (steps done / total) | Fraction, not % | — | `12 / 15` |
| **Invoice payment progress** (in progress bar) | Integer % | 0 | `50%` |
| **ISP speed** (bandwidth display) | Integer Mbps | 0 | `500 Mbps` |

### TypeScript Implementation

```ts
// src/lib/formatters.ts

/**
 * Progress percentage — integer, no decimal.
 * Used in: deployment progress bar, wizard stage completion indicator.
 */
export function formatPct(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Margin percentage — 1 decimal place.
 * Used in: P&L gross margin %, project cost analysis.
 */
export function formatMarginPct(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * HER ratio — 1 decimal, x suffix.
 * Used in: global financials HER metric tile, monthly P&L HER column.
 */
export function formatHer(value: number): string {
  return `${value.toFixed(1)}x`
}

/**
 * Fraction — "12 / 15" format.
 * Used in: BOM phase item counts, checklist phase headers.
 */
export function formatFraction(numerator: number, denominator: number): string {
  return `${numerator} / ${denominator}`
}

/**
 * Bandwidth — integer Mbps.
 * Used in: ISP validation display, network reference reference table.
 */
export function formatBandwidth(mbps: number): string {
  return `${Math.round(mbps)} Mbps`
}
```

---

## 4. Number Formatting (Non-Currency)

### Rules

| Context | Format | Example |
|---|---|---|
| Court count, door count, camera count | Integer, no separator | `6` |
| Inventory stock quantity | Integer, no separator | `42` |
| Inventory low stock threshold | Integer, no separator | `5` |
| PO quantity | Integer, no separator | `12` |
| Large inventory counts (> 999) | Integer with comma separator | `1,200` |
| Cable length estimate | Integer + ` ft` suffix | `450 ft` |
| Weight | Integer + ` lbs` suffix | `12 lbs` |

```ts
// src/lib/formatters.ts

export function formatCount(value: number): string {
  if (value >= 1000) return new Intl.NumberFormat('en-US').format(value)
  return String(value)
}

export function formatFeet(value: number): string {
  return `${Math.round(value)} ft`
}
```

---

## 5. Text Truncation Rules

All truncation uses CSS `truncate` class (`overflow-hidden text-ellipsis whitespace-nowrap`)
with a `title` attribute set to the full untruncated value.

### Per-Field Truncation Limits

| Field | Max display width | Tailwind class | Title tooltip |
|---|---|---|---|
| Customer name (dashboard table) | `max-w-[200px]` | `truncate` | Full name |
| Venue name (dashboard table) | `max-w-[180px]` | `truncate` | Full name |
| Customer name + venue (wizard sidebar) | `max-w-[160px]` | `truncate` | Full name |
| Hardware item name (BOM table) | `max-w-[220px]` | `truncate` | Full name |
| Expense description (expense table) | `max-w-[200px]` | `truncate` | Full description |
| Installer name (project header) | `max-w-[160px]` | `truncate` | Full name |
| PO notes field (PO table) | `max-w-[200px]` | `truncate` | Full notes |
| Checklist step title (deployment phase) | `max-w-[320px]` | `truncate` | Full title |
| Checklist step warning text | Wraps (no truncation) | `text-sm` | — |
| Settings hardware catalog item name | `max-w-[240px]` | `truncate` | Full name |

### Search Highlight

When text is displayed in search results (dashboard `q` filter), matched substring is
wrapped in `<mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">`.

### Implementation Pattern

```tsx
// Any truncated cell:
<span className="truncate max-w-[200px] block" title={fullValue}>
  {displayValue}
</span>
```

---

## 6. Status Badge Color Map

Status badges are `<span>` elements with Tailwind classes. Full details are in
`final-mega-spec/ui-spec/enum-labels.md` (the canonical source). This section provides
the consolidated color map for quick reference.

### Project Status → Badge Color

| Status | Display Label | Badge background | Badge text | Dot color |
|---|---|---|---|---|
| `intake` | Intake | `bg-slate-100` | `text-slate-700` | `bg-slate-400` |
| `procurement` | Procurement | `bg-amber-100` | `text-amber-700` | `bg-yellow-400` |
| `deployment` | Deployment | `bg-blue-100` | `text-blue-700` | `bg-blue-500` |
| `financial_close` | Financial Close | `bg-orange-100` | `text-orange-700` | `bg-orange-400` |
| `completed` | Completed | `bg-green-100` | `text-green-700` | `bg-green-500` |
| `cancelled` | Cancelled | `bg-red-100` | `text-red-600` | `bg-red-400` |

### Deployment Sub-Status → Badge Color (shown inside deployment stage only)

| Status | Display Label | Badge background | Badge text |
|---|---|---|---|
| `not_started` | Not Started | `bg-slate-100` | `text-slate-600` |
| `config` | Configuring | `bg-yellow-100` | `text-yellow-700` |
| `ready_to_ship` | Ready to Ship | `bg-teal-100` | `text-teal-700` |
| `shipped` | Shipped | `bg-cyan-100` | `text-cyan-700` |
| `installing` | Installing | `bg-blue-100` | `text-blue-700` |
| `qc` | QC | `bg-violet-100` | `text-violet-700` |
| `completed` | Deployed | `bg-green-100` | `text-green-700` |

### Service Tier → Badge Color

| Tier | Display Label (short) | Badge background | Badge text |
|---|---|---|---|
| `pro` | PRO | `bg-blue-100` | `text-blue-700` |
| `autonomous` | AUTO | `bg-purple-100` | `text-purple-700` |
| `autonomous_plus` | A+ | `bg-indigo-100` | `text-indigo-700` |
| `pbk` | PBK | `bg-orange-100` | `text-orange-700` |

### Badge Component Pattern

All status badges use the same `StatusBadge` component:

```tsx
// src/components/ui/StatusBadge.tsx
interface StatusBadgeProps {
  label: string
  className: string        // bg-* text-* from enum-labels.ts
  withDot?: boolean        // renders colored dot before label (project_status only)
  dotColor?: string        // bg-* class for dot (from PROJECT_STATUS_CONFIG)
  size?: 'sm' | 'default' // 'sm' for table cells, 'default' for wizard header
}

// Rendered HTML (size=default, withDot=true):
// <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border {className}">
//   <span class="h-1.5 w-1.5 rounded-full {dotColor}" />
//   {label}
// </span>

// Rendered HTML (size=sm, no dot):
// <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {className}">
//   {label}
// </span>
```

---

## 7. Boolean Display

| Context | True display | False display |
|---|---|---|
| Checklist item is_completed | Filled checkbox icon (`CheckSquare`, `text-green-600`) | Empty checkbox icon (`Square`, `text-muted-foreground`) |
| Invoice paid | "Paid" badge (`bg-green-100 text-green-700`) | Status-appropriate badge (see invoice_status in enum-labels.md) |
| Inventory in_stock | Green dot + "In Stock" | Red dot + "Out of Stock" |
| PO received | "Received" badge (`bg-green-100 text-green-700`) | "Pending" badge (`bg-yellow-100 text-yellow-700`) |
| Project deposit_paid | Checkmark (`text-green-600`) | Dash (`—`, `text-muted-foreground`) |

---

## 8. Empty / Null Values

| Context | Display |
|---|---|
| Date field with no value set | `—` (em dash, `text-muted-foreground`) |
| Currency field with null | `—` (em dash, `text-muted-foreground`) |
| Text field with null or empty string | `—` (em dash, `text-muted-foreground`) |
| Number field with zero (counts) | `0` (not em dash — zero is a valid count) |
| Number field with null (no data yet) | `—` (em dash, `text-muted-foreground`) |
| Percentage with no checklist items | `0%` (not `—` — 0 is the correct value) |
| HER with no data | `—` (not `0.0x`) |

```ts
// src/lib/formatters.ts
export const EMPTY_DISPLAY = '—' // U+2014 em dash
```

---

## 9. formatters.ts Export Summary

All functions exported from `src/lib/formatters.ts`:

```ts
// Currency
export function formatCurrencyCompact(value: number): string
export function formatCurrencyPrecise(value: number): string

// Date
export function formatDate(isoString: string | null | undefined): string
export function formatDateShort(isoString: string | null | undefined): string
export function formatMonth(isoString: string): string
export function formatRelativeDate(isoString: string | null | undefined): string

// Percentage / Ratio
export function formatPct(value: number): string
export function formatMarginPct(value: number): string
export function formatHer(value: number): string
export function formatFraction(numerator: number, denominator: number): string
export function formatBandwidth(mbps: number): string

// Numbers
export function formatCount(value: number): string
export function formatFeet(value: number): string

// Constants
export const EMPTY_DISPLAY: string  // '—'
```
