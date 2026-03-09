// Stage 132 — Tests: Charts
// Asserts monthly columns render in P&L chart and HER bars render with correct data points.

import { render } from '@testing-library/react';
import React from 'react';
import { PnlChart } from '@/components/financials/PnlChart';
import { HerChart } from '@/components/financials/HerChart';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_MONTHS = [
  { label: 'Jan 2026', revenue: 10000, cogs: 4000, expenses: 2000, margin: 4000 },
  { label: 'Feb 2026', revenue: 15000, cogs: 6000, expenses: 3000, margin: 6000 },
  { label: 'Mar 2026', revenue: 8000,  cogs: 5000, expenses: 2500, margin: 500  },
];

const MOCK_HER_MONTHS = [
  { label: 'Jan 2026', herRatio: 2.5  },   // strong
  { label: 'Feb 2026', herRatio: 1.8  },   // healthy
  { label: 'Mar 2026', herRatio: 1.2  },   // break_even
  { label: 'Apr 2026', herRatio: 0.7  },   // loss
  { label: 'May 2026', herRatio: null },   // no_data
];

// ── PnlChart tests ─────────────────────────────────────────────────────────────

// 1. Monthly columns render in P&L chart table
test('PnlChart renders all monthly rows in the table', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const table = document.querySelector('[data-testid="pnl-chart-table"]');
  expect(table).not.toBeNull();
  expect(table?.textContent).toContain('Jan 2026');
  expect(table?.textContent).toContain('Feb 2026');
  expect(table?.textContent).toContain('Mar 2026');
});

// 2. Revenue column values match mock data
test('PnlChart shows correct revenue values', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const table = document.querySelector('[data-testid="pnl-chart-table"]');
  // $10,000 formatted as "$10,000"
  expect(table?.textContent).toContain('$10,000');
  expect(table?.textContent).toContain('$15,000');
  expect(table?.textContent).toContain('$8,000');
});

// 3. COGS column values match mock data
test('PnlChart shows correct COGS values', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const table = document.querySelector('[data-testid="pnl-chart-table"]');
  expect(table?.textContent).toContain('$4,000');
  expect(table?.textContent).toContain('$6,000');
  expect(table?.textContent).toContain('$5,000');
});

// 4. Margin column shows positive values in green
test('PnlChart margin cell shows correct margin values', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const table = document.querySelector('[data-testid="pnl-chart-table"]');
  expect(table?.textContent).toContain('$4,000');
  expect(table?.textContent).toContain('$6,000');
  expect(table?.textContent).toContain('$500');
});

// 5. SVG bar chart renders with correct aria-labels for revenue bars
test('PnlChart SVG bars have aria-labels matching mock data', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const revenueBar = document.querySelector('[aria-label="Jan 2026 revenue: 10000"]');
  expect(revenueBar).not.toBeNull();
  const cogsBar = document.querySelector('[aria-label="Feb 2026 cogs: 6000"]');
  expect(cogsBar).not.toBeNull();
  const marginBar = document.querySelector('[aria-label="Mar 2026 margin: 500"]');
  expect(marginBar).not.toBeNull();
});

// 6. Empty state renders no-data message
test('PnlChart shows empty state message when no months provided', () => {
  render(React.createElement(PnlChart, { months: [] }));
  const msg = document.querySelector('h3');
  expect(msg?.textContent).toContain('No P&L data');
});

// 7. Table header columns are present
test('PnlChart table has Revenue, COGS, Expenses, Margin column headers', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const thead = document.querySelector('[data-testid="pnl-chart-table"] thead');
  expect(thead?.textContent).toContain('Revenue');
  expect(thead?.textContent).toContain('COGS');
  expect(thead?.textContent).toContain('Expenses');
  expect(thead?.textContent).toContain('Margin');
});

// ── HerChart tests ─────────────────────────────────────────────────────────────

// 8. HER bars render for all months
test('HerChart renders bars for all months', () => {
  render(React.createElement(HerChart, { months: MOCK_HER_MONTHS }));
  expect(document.querySelector('[data-testid="her-bar-Jan 2026"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="her-bar-Feb 2026"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="her-bar-Mar 2026"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="her-bar-Apr 2026"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="her-bar-May 2026"]')).not.toBeNull();
});

// 9. HER bars have aria-labels with correct ratio values
test('HerChart bars have aria-labels matching mock HER ratios', () => {
  render(React.createElement(HerChart, { months: MOCK_HER_MONTHS }));
  expect(document.querySelector('[aria-label="Jan 2026 HER: 2.50"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="Feb 2026 HER: 1.80"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="Mar 2026 HER: 1.20"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="Apr 2026 HER: 0.70"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="May 2026 HER: N/A"]')).not.toBeNull();
});

// 10. HER table rows show status labels for each threshold
test('HerChart table shows correct status labels for each threshold', () => {
  render(React.createElement(HerChart, { months: MOCK_HER_MONTHS }));
  const table = document.querySelector('[data-testid="her-chart-table"]');
  expect(table?.textContent).toContain('Strong');      // 2.5 >= 2.0
  expect(table?.textContent).toContain('Healthy');     // 1.8 in [1.5, 2.0)
  expect(table?.textContent).toContain('Break-even');  // 1.2 in [1.0, 1.5)
  expect(table?.textContent).toContain('Loss');        // 0.7 < 1.0
  expect(table?.textContent).toContain('No data');     // null
});

// 11. HER table shows correct ratio values
test('HerChart table shows correct HER ratio values', () => {
  render(React.createElement(HerChart, { months: MOCK_HER_MONTHS }));
  const table = document.querySelector('[data-testid="her-chart-table"]');
  expect(table?.textContent).toContain('2.50');
  expect(table?.textContent).toContain('1.80');
  expect(table?.textContent).toContain('1.20');
  expect(table?.textContent).toContain('0.70');
  // null renders as em dash
  expect(table?.textContent).toContain('—');
});

// 12. HER empty state renders no-data message
test('HerChart shows empty state message when no months provided', () => {
  render(React.createElement(HerChart, { months: [] }));
  const msg = document.querySelector('h3');
  expect(msg?.textContent).toContain('No HER data');
});

// 13. HER reference lines render at 1.0, 1.5, 2.0
test('HerChart SVG renders reference line labels at 1.0, 1.5, 2.0', () => {
  const { container } = render(React.createElement(HerChart, { months: MOCK_HER_MONTHS }));
  const svg = container.querySelector('svg[aria-label="Monthly HER bar chart"]');
  expect(svg).not.toBeNull();
  const texts = Array.from(svg?.querySelectorAll('text') ?? []).map((t) => t.textContent);
  expect(texts).toContain('1.0');
  expect(texts).toContain('1.5');
  expect(texts).toContain('2.0');
});

// 14. PnlChart SVG has correct aria label
test('PnlChart SVG has aria-label "Monthly P&L bar chart"', () => {
  const { container } = render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const svgs = container.querySelectorAll('svg[role="img"]');
  const hasLabel = Array.from(svgs).some(
    (s) => s.getAttribute('aria-label') === 'Monthly P&L bar chart',
  );
  expect(hasLabel).toBe(true);
});

// 15. PnlChart table shows month labels as text nodes in rows
test('PnlChart table rows show month labels from mock data', () => {
  render(React.createElement(PnlChart, { months: MOCK_MONTHS }));
  const rows = document.querySelectorAll('[data-testid="pnl-chart-table"] tbody tr');
  expect(rows.length).toBe(3);
  expect(rows[0].textContent).toContain('Jan 2026');
  expect(rows[1].textContent).toContain('Feb 2026');
  expect(rows[2].textContent).toContain('Mar 2026');
});
