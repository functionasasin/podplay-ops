import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  EMPTY_DISPLAY,
  formatCurrencyCompact,
  formatCurrencyPrecise,
  formatDate,
  formatDateShort,
  formatMonth,
  formatRelativeDate,
  formatPct,
  formatMarginPct,
  formatHer,
  formatFraction,
  formatBandwidth,
  formatCount,
  formatFeet,
} from '../lib/formatters'

// ---------------------------------------------------------------------------
// EMPTY_DISPLAY constant
// ---------------------------------------------------------------------------

describe('EMPTY_DISPLAY', () => {
  it('is the em dash character', () => {
    expect(EMPTY_DISPLAY).toBe('—')
  })
})

// ---------------------------------------------------------------------------
// formatCurrencyCompact
// ---------------------------------------------------------------------------

describe('formatCurrencyCompact', () => {
  it('whole dollar — no .00', () => {
    expect(formatCurrencyCompact(12500)).toBe('$12,500')
  })

  it('non-zero cents — shows 2 decimal places', () => {
    expect(formatCurrencyCompact(12500.5)).toBe('$12,500.50')
  })

  it('exactly $1,234.50', () => {
    expect(formatCurrencyCompact(1234.5)).toBe('$1,234.50')
  })

  it('zero — $0', () => {
    expect(formatCurrencyCompact(0)).toBe('$0')
  })

  it('negative whole dollar — minus prefix', () => {
    expect(formatCurrencyCompact(-250)).toBe('−$250')
  })

  it('negative with cents', () => {
    expect(formatCurrencyCompact(-12.5)).toBe('−$12.50')
  })

  it('large value with comma separator', () => {
    expect(formatCurrencyCompact(1250000)).toBe('$1,250,000')
  })
})

// ---------------------------------------------------------------------------
// formatCurrencyPrecise
// ---------------------------------------------------------------------------

describe('formatCurrencyPrecise', () => {
  it('always shows 2 decimal places for whole dollar', () => {
    expect(formatCurrencyPrecise(45)).toBe('$45.00')
  })

  it('shows 2 decimal places for cents value', () => {
    expect(formatCurrencyPrecise(129.99)).toBe('$129.99')
  })

  it('zero — $0.00', () => {
    expect(formatCurrencyPrecise(0)).toBe('$0.00')
  })

  it('negative value — minus prefix, 2 decimals', () => {
    expect(formatCurrencyPrecise(-250)).toBe('−$250.00')
  })

  it('large value with comma separator', () => {
    expect(formatCurrencyPrecise(14000)).toBe('$14,000.00')
  })

  it('1234.50 → $1,234.50', () => {
    expect(formatCurrencyPrecise(1234.5)).toBe('$1,234.50')
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('ISO date → "Jan 5, 2026"', () => {
    expect(formatDate('2026-01-05')).toBe('Jan 5, 2026')
  })

  it('null → em dash', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('undefined → em dash', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('empty string → em dash', () => {
    expect(formatDate('')).toBe('—')
  })

  it('Dec 31 date', () => {
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025')
  })

  it('Feb 1 date', () => {
    expect(formatDate('2026-02-01')).toBe('Feb 1, 2026')
  })
})

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------

describe('formatDateShort', () => {
  it('"2026-01-05" → "01/05/26"', () => {
    expect(formatDateShort('2026-01-05')).toBe('01/05/26')
  })

  it('null → em dash', () => {
    expect(formatDateShort(null)).toBe('—')
  })

  it('undefined → em dash', () => {
    expect(formatDateShort(undefined)).toBe('—')
  })

  it('empty string → em dash', () => {
    expect(formatDateShort('')).toBe('—')
  })

  it('December date pads correctly', () => {
    expect(formatDateShort('2025-12-31')).toBe('12/31/25')
  })
})

// ---------------------------------------------------------------------------
// formatMonth
// ---------------------------------------------------------------------------

describe('formatMonth', () => {
  it('"2026-01" → "Jan 2026"', () => {
    expect(formatMonth('2026-01')).toBe('Jan 2026')
  })

  it('"2026-12" → "Dec 2026"', () => {
    expect(formatMonth('2026-12')).toBe('Dec 2026')
  })

  it('"2025-06" → "Jun 2025"', () => {
    expect(formatMonth('2025-06')).toBe('Jun 2025')
  })
})

// ---------------------------------------------------------------------------
// formatRelativeDate
// ---------------------------------------------------------------------------

// Pin "now" to exactly midnight 2026-03-08 so Math.round() gives whole-day diffs.
const FAKE_NOW = new Date('2026-03-08T00:00:00').getTime()

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FAKE_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('null → empty string', () => {
    expect(formatRelativeDate(null)).toBe('')
  })

  it('undefined → empty string', () => {
    expect(formatRelativeDate(undefined)).toBe('')
  })

  it('empty string → empty string', () => {
    expect(formatRelativeDate('')).toBe('')
  })

  it('today → "today"', () => {
    expect(formatRelativeDate('2026-03-08')).toBe('today')
  })

  it('yesterday → "yesterday"', () => {
    expect(formatRelativeDate('2026-03-07')).toBe('yesterday')
  })

  it('tomorrow → "tomorrow"', () => {
    expect(formatRelativeDate('2026-03-09')).toBe('tomorrow')
  })

  it('5 days ago → "5 days ago"', () => {
    expect(formatRelativeDate('2026-03-03')).toBe('5 days ago')
  })

  it('in 10 days → "in 10 days"', () => {
    expect(formatRelativeDate('2026-03-18')).toBe('in 10 days')
  })

  it('45 days ago → "2 months ago"', () => {
    expect(formatRelativeDate('2026-01-22')).toBe('2 months ago')
  })
})

// ---------------------------------------------------------------------------
// formatPct
// ---------------------------------------------------------------------------

describe('formatPct', () => {
  it('85 → "85%"', () => {
    expect(formatPct(85)).toBe('85%')
  })

  it('0 → "0%"', () => {
    expect(formatPct(0)).toBe('0%')
  })

  it('100 → "100%"', () => {
    expect(formatPct(100)).toBe('100%')
  })

  it('rounds fractional value', () => {
    expect(formatPct(85.6)).toBe('86%')
  })

  it('negative rounds correctly', () => {
    expect(formatPct(-5)).toBe('-5%')
  })
})

// ---------------------------------------------------------------------------
// formatMarginPct
// ---------------------------------------------------------------------------

describe('formatMarginPct', () => {
  it('42.5 → "42.5%"', () => {
    expect(formatMarginPct(42.5)).toBe('42.5%')
  })

  it('0 → "0.0%"', () => {
    expect(formatMarginPct(0)).toBe('0.0%')
  })

  it('100 → "100.0%"', () => {
    expect(formatMarginPct(100)).toBe('100.0%')
  })

  it('negative margin', () => {
    expect(formatMarginPct(-12.3)).toBe('-12.3%')
  })

  it('always 1 decimal place', () => {
    expect(formatMarginPct(33)).toBe('33.0%')
  })
})

// ---------------------------------------------------------------------------
// formatHer
// ---------------------------------------------------------------------------

describe('formatHer', () => {
  it('2.3 → "2.3x"', () => {
    expect(formatHer(2.3)).toBe('2.3x')
  })

  it('0 → "0.0x"', () => {
    expect(formatHer(0)).toBe('0.0x')
  })

  it('1 → "1.0x"', () => {
    expect(formatHer(1)).toBe('1.0x')
  })

  it('negative value', () => {
    expect(formatHer(-1.5)).toBe('-1.5x')
  })

  it('always 1 decimal place', () => {
    expect(formatHer(3)).toBe('3.0x')
  })
})

// ---------------------------------------------------------------------------
// formatFraction
// ---------------------------------------------------------------------------

describe('formatFraction', () => {
  it('"12 / 15" format', () => {
    expect(formatFraction(12, 15)).toBe('12 / 15')
  })

  it('0 numerator', () => {
    expect(formatFraction(0, 10)).toBe('0 / 10')
  })

  it('equal numerator and denominator', () => {
    expect(formatFraction(5, 5)).toBe('5 / 5')
  })
})

// ---------------------------------------------------------------------------
// formatBandwidth
// ---------------------------------------------------------------------------

describe('formatBandwidth', () => {
  it('500 → "500 Mbps"', () => {
    expect(formatBandwidth(500)).toBe('500 Mbps')
  })

  it('0 → "0 Mbps"', () => {
    expect(formatBandwidth(0)).toBe('0 Mbps')
  })

  it('rounds decimal value', () => {
    expect(formatBandwidth(99.7)).toBe('100 Mbps')
  })

  it('negative rounds correctly', () => {
    expect(formatBandwidth(-100)).toBe('-100 Mbps')
  })
})

// ---------------------------------------------------------------------------
// formatCount
// ---------------------------------------------------------------------------

describe('formatCount', () => {
  it('small count — no separator', () => {
    expect(formatCount(6)).toBe('6')
  })

  it('42 → "42"', () => {
    expect(formatCount(42)).toBe('42')
  })

  it('0 → "0"', () => {
    expect(formatCount(0)).toBe('0')
  })

  it('999 — no separator', () => {
    expect(formatCount(999)).toBe('999')
  })

  it('1000 → "1,000" (comma separator)', () => {
    expect(formatCount(1000)).toBe('1,000')
  })

  it('1200 → "1,200"', () => {
    expect(formatCount(1200)).toBe('1,200')
  })

  it('large count with multiple commas', () => {
    expect(formatCount(1250000)).toBe('1,250,000')
  })
})

// ---------------------------------------------------------------------------
// formatFeet
// ---------------------------------------------------------------------------

describe('formatFeet', () => {
  it('450 → "450 ft"', () => {
    expect(formatFeet(450)).toBe('450 ft')
  })

  it('0 → "0 ft"', () => {
    expect(formatFeet(0)).toBe('0 ft')
  })

  it('rounds decimal', () => {
    expect(formatFeet(12.7)).toBe('13 ft')
  })

  it('negative value', () => {
    expect(formatFeet(-10)).toBe('-10 ft')
  })
})
