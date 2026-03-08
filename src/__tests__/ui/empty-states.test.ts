// Stage 144 — Tests: Empty States
// Render each of the 19 empty state configs via EmptyState component.
// Assert icon, heading, description, CTA label, and CTA click callback.

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

function renderConfig(
  key: keyof typeof EMPTY_STATES,
  onClickOverride?: () => void,
) {
  const cfg = EMPTY_STATES[key] as {
    icon: React.ComponentType<{ className?: string }>;
    heading: string;
    description: string;
    cta?: { label: string; href?: string; onClick?: () => void };
  };

  const cta = cfg.cta
    ? {
        label: cfg.cta.label,
        ...(cfg.cta.href ? { href: cfg.cta.href } : { onClick: onClickOverride }),
      }
    : undefined;

  return render(
    React.createElement(EmptyState, {
      icon: cfg.icon,
      heading: cfg.heading,
      description: cfg.description,
      cta,
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EmptyState configs', () => {
  // 1A. Dashboard — no projects
  it('1A dashboardNoProjects: heading, description, CTA', () => {
    renderConfig('dashboardNoProjects');
    expect(screen.getByRole('heading', { name: 'No projects yet' })).toBeTruthy();
    expect(screen.getByText('Start by creating your first installation project.')).toBeTruthy();
    expect(screen.getByRole('link', { name: '+ New Project' })).toBeTruthy();
  });

  // 1B. Dashboard — no filter results
  it('1B dashboardNoResults: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('dashboardNoResults', onClick);
    expect(screen.getByRole('heading', { name: 'No projects found' })).toBeTruthy();
    expect(screen.getByText('Try adjusting your filters or search term.')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Clear filters' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 2A. Inventory — DB empty
  it('2A inventoryEmpty: heading, description, no CTA', () => {
    renderConfig('inventoryEmpty');
    expect(screen.getByRole('heading', { name: 'Inventory not set up yet' })).toBeTruthy();
    expect(screen.getByText('Run the seed data migration to populate the hardware catalog.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 2B. Inventory — no filter results
  it('2B inventoryNoResults: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('inventoryNoResults', onClick);
    expect(screen.getByRole('heading', { name: 'No items found' })).toBeTruthy();
    expect(screen.getByText('Try adjusting your search or filters.')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Clear Filters' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 4. Reconciliation Dialog — clean state
  it('4 reconciliationClean: heading, description, no CTA', () => {
    renderConfig('reconciliationClean');
    expect(screen.getByRole('heading', { name: 'Inventory is clean' })).toBeTruthy();
    expect(screen.getByText('All inventory levels match the movement log.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 5. Procurement — BOM Review tab empty
  it('5 bomReviewEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('bomReviewEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'No BOM items' })).toBeTruthy();
    expect(screen.getByText(/The bill of materials is empty/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Regenerate BOM' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 6. Procurement — Inventory Check tab
  it('6 inventoryCheckEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('inventoryCheckEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'No items to check' })).toBeTruthy();
    expect(screen.getByText(/The BOM is empty\. Add items to the BOM before checking inventory availability/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Go to BOM Review' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 7. Procurement — Purchase Orders tab
  it('7 purchaseOrdersEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('purchaseOrdersEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'No purchase orders yet' })).toBeTruthy();
    expect(screen.getByText('Create a PO for items not currently in stock.')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Create PO' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 8. Procurement — Packing tab
  it('8 packingEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('packingEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'Nothing to pack' })).toBeTruthy();
    expect(screen.getByText('Add items to the BOM before confirming the packing list.')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Go to BOM Review' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 9. Deployment — checklist not generated
  it('9 deploymentChecklistEmpty: heading, description, no CTA', () => {
    renderConfig('deploymentChecklistEmpty');
    expect(screen.getByRole('heading', { name: 'Checklist not generated' })).toBeTruthy();
    expect(screen.getByText(/The deployment checklist was not created/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 11. Financials — Pipeline tab
  it('11 pipelineEmpty: heading, description, CTA link', () => {
    renderConfig('pipelineEmpty');
    expect(screen.getByRole('heading', { name: 'No projects in pipeline' })).toBeTruthy();
    expect(screen.getByText('Create your first project to start tracking revenue.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'New Project' })).toBeTruthy();
  });

  // 12. Financials — P&L tab
  it('12 pnlNoData: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('pnlNoData', onClick);
    expect(screen.getByRole('heading', { name: 'No P&L data for this period' })).toBeTruthy();
    expect(screen.getByText(/Close a month using the Monthly Close tab/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Go to Monthly Close' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 13. Financials — HER tab
  it('13 herNoData: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('herNoData', onClick);
    expect(screen.getByRole('heading', { name: 'No HER data yet' })).toBeTruthy();
    expect(screen.getByText(/Hardware Efficiency Ratio is calculated from monthly snapshots/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Go to Monthly Close' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 14. Financials — Receivables tab
  it('14 receivablesClear: heading, description, no CTA', () => {
    renderConfig('receivablesClear');
    expect(screen.getByRole('heading', { name: 'No outstanding invoices' })).toBeTruthy();
    expect(screen.getByText('All invoices have been paid or none have been sent yet.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 15. Financials — Per-Project tab
  it('15 perProjectEmpty: heading, description, CTA link', () => {
    renderConfig('perProjectEmpty');
    expect(screen.getByRole('heading', { name: 'No projects yet' })).toBeTruthy();
    expect(screen.getByText('Create a project to start tracking per-project P&L.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'New Project' })).toBeTruthy();
  });

  // 16. Financials — Reconciliation tab (all checks passed)
  it('16 financialsReconciliationClean: heading, description, no CTA', () => {
    renderConfig('financialsReconciliationClean');
    expect(screen.getByRole('heading', { name: 'All checks passed' })).toBeTruthy();
    expect(screen.getByText(/No discrepancies found across inventory/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 17. Financials — Monthly Close tab (not closed yet)
  it('17 monthlyCloseNotClosed: heading, description, no CTA', () => {
    renderConfig('monthlyCloseNotClosed');
    expect(screen.getByRole('heading', { name: '{MonthName YYYY} not closed yet' })).toBeTruthy();
    expect(screen.getByText(/Review expenses and OpEx below/)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // 18. Settings — Hardware Catalog tab
  it('18 catalogEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('catalogEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'Hardware catalog is empty' })).toBeTruthy();
    expect(screen.getByText(/Run the seed data migration to populate the default hardware catalog/)).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Add Item' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 19. Settings — Team Contacts tab
  it('19 teamContactsEmpty: heading, description, CTA click', () => {
    const onClick = vi.fn();
    renderConfig('teamContactsEmpty', onClick);
    expect(screen.getByRole('heading', { name: 'No team contacts' })).toBeTruthy();
    expect(screen.getByText('Add team members to show their info in the project wizard.')).toBeTruthy();
    const btn = screen.getByRole('button', { name: 'Add Contact' });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
