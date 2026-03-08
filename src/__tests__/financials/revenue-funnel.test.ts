// Stage 130 — Tests: Revenue Funnel
// Mocks projects at various pipeline stages.
// Asserts correct count and dollar sum per funnel stage.

import { render, screen } from '@testing-library/react';
import React from 'react';
import { RevenueFunnel } from '@/components/financials/RevenueFunnel';
import type { RevenuePipelineStage } from '@/components/financials/RevenueFunnel';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStage(
  stage: RevenuePipelineStage['stage'],
  project_count: number,
  total_contract_value: number,
): RevenuePipelineStage {
  return {
    stage,
    label: stage,
    project_count,
    total_contract_value,
    deposit_outstanding: 0,
    final_outstanding: 0,
  };
}

function renderFunnel(stages: RevenuePipelineStage[]) {
  return render(React.createElement(RevenueFunnel, { stages }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// 1. All 6 stage rows render
test('renders all 6 funnel stage rows', () => {
  const stages: RevenuePipelineStage[] = [
    makeStage('proposal',         2, 20000),
    makeStage('signed',           3, 30000),
    makeStage('deposit_invoiced', 1, 10000),
    makeStage('deposit_paid',     4, 40000),
    makeStage('final_invoiced',   2, 20000),
    makeStage('final_paid',       1, 10000),
  ];
  renderFunnel(stages);

  expect(document.querySelector('[data-testid="funnel-stage-proposal"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="funnel-stage-signed"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="funnel-stage-deposit_invoiced"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="funnel-stage-deposit_paid"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="funnel-stage-final_invoiced"]')).not.toBeNull();
  expect(document.querySelector('[data-testid="funnel-stage-final_paid"]')).not.toBeNull();
});

// 2. Stage labels render
test('renders correct stage labels', () => {
  renderFunnel([]);
  expect(screen.getByText('Proposal Sent')).toBeInTheDocument();
  expect(screen.getByText('Contract Signed')).toBeInTheDocument();
  expect(screen.getByText('Deposit Invoiced')).toBeInTheDocument();
  expect(screen.getByText('Deposit Received')).toBeInTheDocument();
  expect(screen.getByText('Final Invoice Sent')).toBeInTheDocument();
  expect(screen.getByText('Fully Paid')).toBeInTheDocument();
});

// 3. Correct project count per stage
test('shows correct project count per stage', () => {
  const stages = [
    makeStage('proposal', 5, 50000),
    makeStage('signed',   3, 30000),
    makeStage('deposit_paid', 7, 70000),
  ];
  renderFunnel(stages);

  expect(document.querySelector('[data-testid="funnel-count-proposal"]')?.textContent).toBe('5 projects');
  expect(document.querySelector('[data-testid="funnel-count-signed"]')?.textContent).toBe('3 projects');
  expect(document.querySelector('[data-testid="funnel-count-deposit_paid"]')?.textContent).toBe('7 projects');
});

// 4. Singular "project" label when count is 1
test('uses singular "project" label for count of 1', () => {
  renderFunnel([makeStage('proposal', 1, 10000)]);
  expect(document.querySelector('[data-testid="funnel-count-proposal"]')?.textContent).toBe('1 project');
});

// 5. Zero count for missing stage
test('shows 0 projects for stages not present in data', () => {
  renderFunnel([makeStage('proposal', 2, 20000)]);
  // signed stage is absent — should show 0
  expect(document.querySelector('[data-testid="funnel-count-signed"]')?.textContent).toBe('0 projects');
});

// 6. Correct dollar value per stage (thousands formatting)
test('shows correct dollar value per stage in $k format', () => {
  const stages = [
    makeStage('deposit_invoiced', 2, 15000),
    makeStage('final_paid',       1,  5000),
  ];
  renderFunnel(stages);

  expect(document.querySelector('[data-testid="funnel-value-deposit_invoiced"]')?.textContent).toBe('$15.0k');
  expect(document.querySelector('[data-testid="funnel-value-final_paid"]')?.textContent).toBe('$5.0k');
});

// 7. Dollar value in millions format
test('shows dollar value in $M format for values >= 1M', () => {
  renderFunnel([makeStage('proposal', 1, 2_000_000)]);
  expect(document.querySelector('[data-testid="funnel-value-proposal"]')?.textContent).toBe('$2.00M');
});

// 8. Total projects count in summary header
test('shows total project count in summary header', () => {
  const stages = [
    makeStage('proposal',     3, 30000),
    makeStage('signed',       2, 20000),
    makeStage('deposit_paid', 1, 10000),
  ];
  renderFunnel(stages);
  // total = 3 + 2 + 1 = 6
  expect(screen.getByText(/6 projects/)).toBeInTheDocument();
});

// 9. Total pipeline value in summary header
test('shows total pipeline value in summary header', () => {
  const stages = [
    makeStage('proposal',   2, 10000),
    makeStage('final_paid', 1, 20000),
  ];
  renderFunnel(stages);
  // total = 30000 → $30.0k
  expect(screen.getByText(/\$30\.0k pipeline/)).toBeInTheDocument();
});

// 10. Footer shows total pipeline value
test('footer shows total pipeline value', () => {
  renderFunnel([makeStage('deposit_paid', 2, 50000)]);
  expect(screen.getByText(/Total pipeline: \$50\.0k/)).toBeInTheDocument();
});
