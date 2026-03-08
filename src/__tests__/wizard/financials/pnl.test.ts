// Tests: PnlSummary — P&L calculation assertions
// revenue = sum of all invoices
// COGS = sum of BOM landed costs (est_total_cost)
// margin = revenue - COGS - expenses
// margin % = margin / revenue * 100

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'proj-pnl-test-1234';

// Mock data constants for assertions
const INVOICES = [
  { id: 'inv-1', type: 'deposit', amount: 5000, status: 'paid', issued_date: '2026-02-01' },
  { id: 'inv-2', type: 'final', amount: 15000, status: 'sent', issued_date: '2026-03-01' },
];
// Total revenue = 5000 + 15000 = 20000

const BOM_ITEMS = [
  { id: 'bom-1', est_total_cost: 3000 },
  { id: 'bom-2', est_total_cost: 2500 },
  { id: 'bom-3', est_total_cost: 1500 },
];
// Total COGS = 3000 + 2500 + 1500 = 7000

const EXPENSES = [
  { id: 'exp-1', category: 'airfare', amount: 1200, expense_date: '2026-02-15' },
  { id: 'exp-2', category: 'lodging', amount: 800, expense_date: '2026-03-05' },
];
// Total expenses = 1200 + 800 = 2000
// Gross margin = 20000 - 7000 - 2000 = 11000
// Margin % = 11000 / 20000 * 100 = 55.0%

function makeMockFrom(
  invoices = INVOICES,
  bomItems = BOM_ITEMS,
  expenses = EXPENSES,
) {
  return vi.fn((table: string) => {
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: invoices, error: null }),
        })),
      };
    }
    if (table === 'project_bom_items') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: bomItems, error: null }),
        })),
      };
    }
    if (table === 'expenses') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: expenses, error: null }),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
  });
}

// --- Hoist Supabase mock ---
const { mockFrom } = vi.hoisted(() => {
  const INVOICES_H = [
    { id: 'inv-1', type: 'deposit', amount: 5000, status: 'paid', issued_date: '2026-02-01' },
    { id: 'inv-2', type: 'final', amount: 15000, status: 'sent', issued_date: '2026-03-01' },
  ];
  const BOM_ITEMS_H = [
    { id: 'bom-1', est_total_cost: 3000 },
    { id: 'bom-2', est_total_cost: 2500 },
    { id: 'bom-3', est_total_cost: 1500 },
  ];
  const EXPENSES_H = [
    { id: 'exp-1', category: 'airfare', amount: 1200, expense_date: '2026-02-15' },
    { id: 'exp-2', category: 'lodging', amount: 800, expense_date: '2026-03-05' },
  ];

  const mockFrom = vi.fn((table: string) => {
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: INVOICES_H, error: null }),
        })),
      };
    }
    if (table === 'project_bom_items') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: BOM_ITEMS_H, error: null }),
        })),
      };
    }
    if (table === 'expenses') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: EXPENSES_H, error: null }),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
  });

  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { PnlSummary } from '@/components/wizard/financials/PnlSummary';

function renderComponent() {
  return render(React.createElement(PnlSummary, { projectId: PROJECT_ID }));
}

async function waitForLoad() {
  await waitFor(() =>
    expect(screen.queryByText(/loading p&l summary/i)).not.toBeInTheDocument(),
  );
}

// 1. Shows loading state initially
test('shows loading state initially', () => {
  renderComponent();
  expect(screen.getByText(/loading p&l summary/i)).toBeInTheDocument();
});

// 2. Revenue = sum of all invoices (5000 + 15000 = 20000)
test('total revenue equals sum of all invoices', async () => {
  renderComponent();
  await waitForLoad();
  // appears in summary row + monthly table footer
  expect(screen.getAllByText('$20,000.00').length).toBeGreaterThanOrEqual(1);
});

// 3. Each invoice line item renders with its amount
test('renders individual invoice amounts', async () => {
  renderComponent();
  await waitForLoad();
  expect(screen.getAllByText('$5,000.00').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('$15,000.00').length).toBeGreaterThanOrEqual(1);
});

// 4. COGS = sum of BOM est_total_cost (3000 + 2500 + 1500 = 7000)
test('hardware COGS equals sum of BOM est_total_cost', async () => {
  renderComponent();
  await waitForLoad();
  // appears in COGS row + monthly table footer
  expect(screen.getAllByText('$7,000.00').length).toBeGreaterThanOrEqual(1);
});

// 5. Total expenses displayed (1200 + 800 = 2000)
test('operating expenses total is correct', async () => {
  renderComponent();
  await waitForLoad();
  // appears in expenses row + monthly table footer
  expect(screen.getAllByText('$2,000.00').length).toBeGreaterThanOrEqual(1);
});

// 6. Gross margin = revenue - COGS - expenses = 20000 - 7000 - 2000 = 11000
test('gross margin equals revenue minus COGS minus expenses', async () => {
  renderComponent();
  await waitForLoad();
  // appears in gross margin row + monthly table footer
  expect(screen.getAllByText('$11,000.00').length).toBeGreaterThanOrEqual(1);
});

// 7. Margin % = 11000 / 20000 * 100 = 55.0%
test('gross margin percent is correct', async () => {
  renderComponent();
  await waitForLoad();
  expect(screen.getByText(/55\.0%/)).toBeInTheDocument();
});

// 8. Monthly breakdown table renders with correct month labels
test('monthly breakdown table shows months from invoice and expense dates', async () => {
  renderComponent();
  await waitForLoad();
  // Invoices dated 2026-02 and 2026-03, expenses dated 2026-02 and 2026-03
  expect(screen.getByText('Feb 2026')).toBeInTheDocument();
  expect(screen.getByText('Mar 2026')).toBeInTheDocument();
});

// 9. Zero revenue case: margin percent is 0.0% without division error
test('handles zero revenue without errors', async () => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    }
    if (table === 'project_bom_items') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: BOM_ITEMS, error: null }),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
  });

  renderComponent();
  await waitForLoad();
  // With zero revenue, margin % should be 0.0%
  expect(screen.getByText(/0\.0%/)).toBeInTheDocument();

  // Restore default mock
  mockFrom.mockImplementation((table: string) => {
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: INVOICES, error: null }),
        })),
      };
    }
    if (table === 'project_bom_items') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: BOM_ITEMS, error: null }),
        })),
      };
    }
    if (table === 'expenses') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: EXPENSES, error: null }),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
  });
});

// 10. BOM items with null est_total_cost trigger the COGS warning
test('null BOM cost items show unknown unit cost warning', async () => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: INVOICES, error: null }),
        })),
      };
    }
    if (table === 'project_bom_items') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'bom-1', est_total_cost: null },
              { id: 'bom-2', est_total_cost: 2000 },
            ],
            error: null,
          }),
        })),
      };
    }
    if (table === 'expenses') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: EXPENSES, error: null }),
        })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };
  });

  renderComponent();
  await waitForLoad();
  expect(screen.getByText(/unknown unit cost/i)).toBeInTheDocument();
});
