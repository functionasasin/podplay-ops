// src/lib/formatters.ts
// Canonical display formatters for PodPlay Ops Wizard.
// All formatting happens here — zero ad-hoc formatting in component JSX.

// Constants
export const EMPTY_DISPLAY = '—' // U+2014 em dash

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/**
 * Table cell date: "Jan 5, 2026"
 * Used in: go_live_date, installation_start_date, invoice paid_date, PO ordered_at.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return EMPTY_DISPLAY
  const d = new Date(isoString + 'T00:00:00') // prevent UTC offset shifting
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Short date: "01/05/26"
 * Used in: chart axis labels, condensed timeline columns.
 */
export function formatDateShort(isoString: string | null | undefined): string {
  if (!isoString) return EMPTY_DISPLAY
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

// ---------------------------------------------------------------------------
// Percentage / Ratio
// ---------------------------------------------------------------------------

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
 * Used in: ISP validation display, network reference table.
 */
export function formatBandwidth(mbps: number): string {
  return `${Math.round(mbps)} Mbps`
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/**
 * Count — comma-separated for >= 1000, plain integer otherwise.
 * Used in: court count, door count, camera count, inventory quantities.
 */
export function formatCount(value: number): string {
  if (value >= 1000) return new Intl.NumberFormat('en-US').format(value)
  return String(value)
}

/**
 * Cable/distance length in feet.
 * Used in: cable length estimate, distance fields.
 */
export function formatFeet(value: number): string {
  return `${Math.round(value)} ft`
}
