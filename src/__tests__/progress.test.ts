import { describe, it, expect } from 'vitest';
import {
  calculateDeploymentProgress,
  calculatePhaseProgress,
  isPhaseComplete,
  getPhaseStatus,
  calculateAllPhasesSummary,
  getDeploymentStatusLabel,
  calculateOverallProjectProgress,
  getProjectStageIndex,
  getProjectStageLabel,
  getDeploymentStatusIndex,
  canAdvanceDeploymentStatus,
  canRollBackDeploymentStatus,
  DEPLOYMENT_STATUS_ORDER,
  PHASE_NAMES,
  type DeploymentChecklistItem,
  type ProjectForProgress,
} from '../lib/progress';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItems(
  specs: Array<{ phase: number; completed: boolean }>
): DeploymentChecklistItem[] {
  return specs.map(s => ({ phase: s.phase, is_completed: s.completed }));
}

function makeProject(
  project_status: ProjectForProgress['project_status'],
  revenue_stage: ProjectForProgress['revenue_stage'] = 'proposal'
): ProjectForProgress {
  return { project_status, revenue_stage };
}

// ---------------------------------------------------------------------------
// calculateDeploymentProgress
// ---------------------------------------------------------------------------

describe('calculateDeploymentProgress', () => {
  it('returns 0 for empty checklist', () => {
    expect(calculateDeploymentProgress([])).toBe(0);
  });

  it('returns 0 for 0% completion state (none done)', () => {
    const items = makeItems([
      { phase: 0, completed: false },
      { phase: 1, completed: false },
      { phase: 2, completed: false },
      { phase: 3, completed: false },
    ]);
    expect(calculateDeploymentProgress(items)).toBe(0);
  });

  it('returns 50 for 50% completion state (half done)', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 0, completed: true },
      { phase: 1, completed: false },
      { phase: 1, completed: false },
    ]);
    expect(calculateDeploymentProgress(items)).toBe(50);
  });

  it('returns 100 for 100% completion state (all done)', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 1, completed: true },
      { phase: 2, completed: true },
    ]);
    expect(calculateDeploymentProgress(items)).toBe(100);
  });

  it('rounds correctly at non-integer percentages', () => {
    // 2/3 = 66.67% → rounds to 67
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 0, completed: true },
      { phase: 0, completed: false },
    ]);
    expect(calculateDeploymentProgress(items)).toBe(67);
  });

  it('matches spec example: 45/116 = 39%', () => {
    const completed = Array.from({ length: 45 }, (_, i) => ({ phase: Math.floor(i / 10), completed: true }));
    const incomplete = Array.from({ length: 71 }, (_, i) => ({ phase: Math.floor(i / 10) + 5, completed: false }));
    const items = makeItems([...completed, ...incomplete]);
    expect(items).toHaveLength(116);
    expect(calculateDeploymentProgress(items)).toBe(39);
  });
});

// ---------------------------------------------------------------------------
// calculatePhaseProgress
// ---------------------------------------------------------------------------

describe('calculatePhaseProgress', () => {
  it('returns 0/0/0 for phase with no items', () => {
    const items = makeItems([{ phase: 1, completed: true }]);
    expect(calculatePhaseProgress(items, 5)).toEqual({ completed: 0, total: 0, pct: 0 });
  });

  it('returns correct counts for partial phase', () => {
    const items = makeItems([
      { phase: 4, completed: true },
      { phase: 4, completed: true },
      { phase: 4, completed: false },
      { phase: 4, completed: false },
    ]);
    const result = calculatePhaseProgress(items, 4);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(4);
    expect(result.pct).toBe(50);
  });

  it('returns 100% for fully completed phase', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 0, completed: true },
      { phase: 0, completed: true },
    ]);
    expect(calculatePhaseProgress(items, 0)).toEqual({ completed: 3, total: 3, pct: 100 });
  });

  it('ignores items from other phases', () => {
    const items = makeItems([
      { phase: 1, completed: true },
      { phase: 2, completed: false },
      { phase: 2, completed: false },
    ]);
    const result = calculatePhaseProgress(items, 1);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// isPhaseComplete
// ---------------------------------------------------------------------------

describe('isPhaseComplete', () => {
  it('returns false for empty phase', () => {
    expect(isPhaseComplete([], 0)).toBe(false);
  });

  it('returns false when phase is partial', () => {
    const items = makeItems([
      { phase: 3, completed: true },
      { phase: 3, completed: false },
    ]);
    expect(isPhaseComplete(items, 3)).toBe(false);
  });

  it('returns true when all phase items are done', () => {
    const items = makeItems([
      { phase: 3, completed: true },
      { phase: 3, completed: true },
    ]);
    expect(isPhaseComplete(items, 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPhaseStatus
// ---------------------------------------------------------------------------

describe('getPhaseStatus', () => {
  it('returns empty when no items done', () => {
    const items = makeItems([
      { phase: 2, completed: false },
      { phase: 2, completed: false },
    ]);
    expect(getPhaseStatus(items, 2)).toBe('empty');
  });

  it('returns partial when some items done', () => {
    const items = makeItems([
      { phase: 2, completed: true },
      { phase: 2, completed: false },
    ]);
    expect(getPhaseStatus(items, 2)).toBe('partial');
  });

  it('returns complete when all items done', () => {
    const items = makeItems([
      { phase: 2, completed: true },
      { phase: 2, completed: true },
    ]);
    expect(getPhaseStatus(items, 2)).toBe('complete');
  });

  it('returns empty for phase with no items', () => {
    expect(getPhaseStatus([], 7)).toBe('empty');
  });
});

// ---------------------------------------------------------------------------
// calculateAllPhasesSummary
// ---------------------------------------------------------------------------

describe('calculateAllPhasesSummary', () => {
  it('returns 16 entries for all phases', () => {
    const summary = calculateAllPhasesSummary([]);
    expect(summary).toHaveLength(16);
  });

  it('all phases are empty with no items', () => {
    const summary = calculateAllPhasesSummary([]);
    expect(summary.every(p => p.status === 'empty')).toBe(true);
  });

  it('phase names match spec', () => {
    const summary = calculateAllPhasesSummary([]);
    const phase0 = summary.find(p => p.phase === 0);
    const phase12 = summary.find(p => p.phase === 12);
    const phase15 = summary.find(p => p.phase === 15);
    expect(phase0?.name).toBe('Pre-Purchase & Planning');
    expect(phase12?.name).toBe('Physical Installation (On-Site)');
    expect(phase15?.name).toBe('Packaging & Shipping');
  });

  it('correctly shows partial status for phase with mixed completion', () => {
    const items = makeItems([
      { phase: 5, completed: true },
      { phase: 5, completed: false },
    ]);
    const summary = calculateAllPhasesSummary(items);
    const phase5 = summary.find(p => p.phase === 5);
    expect(phase5?.status).toBe('partial');
    expect(phase5?.completed).toBe(1);
    expect(phase5?.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getDeploymentStatusLabel
// ---------------------------------------------------------------------------

describe('getDeploymentStatusLabel', () => {
  it('not_started → Not Started', () => {
    expect(getDeploymentStatusLabel('not_started', [])).toBe('Not Started');
  });

  it('ready_to_ship → Ready to Ship', () => {
    expect(getDeploymentStatusLabel('ready_to_ship', [])).toBe('Ready to Ship');
  });

  it('shipped → In Transit', () => {
    expect(getDeploymentStatusLabel('shipped', [])).toBe('In Transit');
  });

  it('completed → Complete', () => {
    expect(getDeploymentStatusLabel('completed', [])).toBe('Complete');
  });

  it('config with 0% office progress → Configuring — 0%', () => {
    const items = makeItems([
      { phase: 0, completed: false },
      { phase: 0, completed: false },
    ]);
    expect(getDeploymentStatusLabel('config', items)).toBe('Configuring — 0%');
  });

  it('config with 50% office progress → Configuring — 50%', () => {
    const items = makeItems([
      { phase: 1, completed: true },
      { phase: 1, completed: false },
    ]);
    expect(getDeploymentStatusLabel('config', items)).toBe('Configuring — 50%');
  });

  it('config with 100% office progress → Configuring — 100%', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 4, completed: true },
    ]);
    expect(getDeploymentStatusLabel('config', items)).toBe('Configuring — 100%');
  });

  it('config only counts office phases (0-11 + 15), not phase 12', () => {
    const items = makeItems([
      { phase: 12, completed: true }, // on-site phase — should be excluded
      { phase: 0, completed: false },
    ]);
    // phase 0 item is not done, phase 12 excluded → 0%
    expect(getDeploymentStatusLabel('config', items)).toBe('Configuring — 0%');
  });

  it('installing with 0% phase 12 → Installing — 0%', () => {
    const items = makeItems([
      { phase: 12, completed: false },
      { phase: 12, completed: false },
    ]);
    expect(getDeploymentStatusLabel('installing', items)).toBe('Installing — 0%');
  });

  it('installing with 100% phase 12 → Installing — 100%', () => {
    const items = makeItems([
      { phase: 12, completed: true },
      { phase: 12, completed: true },
    ]);
    expect(getDeploymentStatusLabel('installing', items)).toBe('Installing — 100%');
  });

  it('qc with partial phases 13-14 → QA — 50%', () => {
    const items = makeItems([
      { phase: 13, completed: true },
      { phase: 14, completed: false },
    ]);
    expect(getDeploymentStatusLabel('qc', items)).toBe('QA — 50%');
  });

  it('qc with 100% → QA — 100%', () => {
    const items = makeItems([
      { phase: 13, completed: true },
      { phase: 14, completed: true },
    ]);
    expect(getDeploymentStatusLabel('qc', items)).toBe('QA — 100%');
  });
});

// ---------------------------------------------------------------------------
// calculateOverallProjectProgress
// ---------------------------------------------------------------------------

describe('calculateOverallProjectProgress', () => {
  it('intake → 12%', () => {
    expect(calculateOverallProjectProgress(makeProject('intake'), [])).toBe(12);
  });

  it('procurement → 37%', () => {
    expect(calculateOverallProjectProgress(makeProject('procurement'), [])).toBe(37);
  });

  it('deployment with 0 checklist items → 50%', () => {
    expect(calculateOverallProjectProgress(makeProject('deployment'), [])).toBe(50);
  });

  it('deployment with 50% checklist → 63% (50 + round(50 * 0.25))', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 0, completed: false },
    ]);
    // 50% checklist → 50 + round(50 * 0.25) = 50 + 13 = 63
    expect(calculateOverallProjectProgress(makeProject('deployment'), items)).toBe(63);
  });

  it('deployment with 100% checklist → 75%', () => {
    const items = makeItems([
      { phase: 0, completed: true },
      { phase: 1, completed: true },
    ]);
    expect(calculateOverallProjectProgress(makeProject('deployment'), items)).toBe(75);
  });

  it('matches spec example: 43% checklist → 61%', () => {
    // 50 + round(43 * 0.25) = 50 + 11 = 61
    const items = makeItems([
      ...Array.from({ length: 43 }, (_, i) => ({ phase: Math.floor(i / 5), completed: true })),
      ...Array.from({ length: 57 }, (_, i) => ({ phase: Math.floor(i / 5) + 10, completed: false })),
    ]);
    expect(items).toHaveLength(100);
    expect(calculateDeploymentProgress(items)).toBe(43);
    expect(calculateOverallProjectProgress(makeProject('deployment'), items)).toBe(61);
  });

  it('financial_close proposal → 75%', () => {
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'proposal'), [])).toBe(75);
  });

  it('financial_close signed → 80% (75 + round(20 * 0.25))', () => {
    // 75 + round(20 * 0.25) = 75 + 5 = 80
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'signed'), [])).toBe(80);
  });

  it('financial_close deposit_invoiced → 85%', () => {
    // 75 + round(40 * 0.25) = 75 + 10 = 85
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'deposit_invoiced'), [])).toBe(85);
  });

  it('financial_close deposit_paid → 90%', () => {
    // 75 + round(60 * 0.25) = 75 + 15 = 90
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'deposit_paid'), [])).toBe(90);
  });

  it('financial_close final_invoiced → 95%', () => {
    // 75 + round(80 * 0.25) = 75 + 20 = 95
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'final_invoiced'), [])).toBe(95);
  });

  it('financial_close final_paid → 100%', () => {
    // 75 + round(100 * 0.25) = 75 + 25 = 100
    expect(calculateOverallProjectProgress(makeProject('financial_close', 'final_paid'), [])).toBe(100);
  });

  it('completed → 100%', () => {
    expect(calculateOverallProjectProgress(makeProject('completed'), [])).toBe(100);
  });

  it('cancelled → 0%', () => {
    expect(calculateOverallProjectProgress(makeProject('cancelled'), [])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getProjectStageIndex
// ---------------------------------------------------------------------------

describe('getProjectStageIndex', () => {
  it('intake → 1', () => expect(getProjectStageIndex('intake')).toBe(1));
  it('procurement → 2', () => expect(getProjectStageIndex('procurement')).toBe(2));
  it('deployment → 3', () => expect(getProjectStageIndex('deployment')).toBe(3));
  it('financial_close → 4', () => expect(getProjectStageIndex('financial_close')).toBe(4));
  it('completed → 4', () => expect(getProjectStageIndex('completed')).toBe(4));
  it('cancelled → 0', () => expect(getProjectStageIndex('cancelled')).toBe(0));
});

// ---------------------------------------------------------------------------
// getProjectStageLabel
// ---------------------------------------------------------------------------

describe('getProjectStageLabel', () => {
  it('intake → Stage 1 — Intake', () => {
    expect(getProjectStageLabel('intake')).toBe('Stage 1 — Intake');
  });
  it('procurement → Stage 2 — Procurement', () => {
    expect(getProjectStageLabel('procurement')).toBe('Stage 2 — Procurement');
  });
  it('deployment → Stage 3 — Deployment', () => {
    expect(getProjectStageLabel('deployment')).toBe('Stage 3 — Deployment');
  });
  it('financial_close → Stage 4 — Financial Close', () => {
    expect(getProjectStageLabel('financial_close')).toBe('Stage 4 — Financial Close');
  });
  it('completed → Completed', () => {
    expect(getProjectStageLabel('completed')).toBe('Completed');
  });
  it('cancelled → Cancelled', () => {
    expect(getProjectStageLabel('cancelled')).toBe('Cancelled');
  });
});

// ---------------------------------------------------------------------------
// Status machine: DEPLOYMENT_STATUS_ORDER, advance/rollback helpers
// ---------------------------------------------------------------------------

describe('deployment status machine', () => {
  it('status order has 7 entries', () => {
    expect(DEPLOYMENT_STATUS_ORDER).toHaveLength(7);
  });

  it('order matches spec: not_started → config → ready_to_ship → shipped → installing → qc → completed', () => {
    expect(DEPLOYMENT_STATUS_ORDER).toEqual([
      'not_started',
      'config',
      'ready_to_ship',
      'shipped',
      'installing',
      'qc',
      'completed',
    ]);
  });

  it('getDeploymentStatusIndex returns correct indices', () => {
    expect(getDeploymentStatusIndex('not_started')).toBe(0);
    expect(getDeploymentStatusIndex('config')).toBe(1);
    expect(getDeploymentStatusIndex('completed')).toBe(6);
  });

  it('canAdvanceDeploymentStatus: valid next step returns true', () => {
    expect(canAdvanceDeploymentStatus('not_started', 'config')).toBe(true);
    expect(canAdvanceDeploymentStatus('config', 'ready_to_ship')).toBe(true);
    expect(canAdvanceDeploymentStatus('qc', 'completed')).toBe(true);
  });

  it('canAdvanceDeploymentStatus: skipping a step returns false', () => {
    expect(canAdvanceDeploymentStatus('not_started', 'ready_to_ship')).toBe(false);
    expect(canAdvanceDeploymentStatus('config', 'shipped')).toBe(false);
  });

  it('canRollBackDeploymentStatus: valid previous step returns true', () => {
    expect(canRollBackDeploymentStatus('config', 'not_started')).toBe(true);
    expect(canRollBackDeploymentStatus('qc', 'installing')).toBe(true);
  });

  it('canRollBackDeploymentStatus: skipping back returns false', () => {
    expect(canRollBackDeploymentStatus('shipped', 'config')).toBe(false);
  });

  it('canAdvanceDeploymentStatus: same status returns false', () => {
    expect(canAdvanceDeploymentStatus('config', 'config')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PHASE_NAMES constant
// ---------------------------------------------------------------------------

describe('PHASE_NAMES', () => {
  it('has 16 entries (phases 0–15)', () => {
    expect(Object.keys(PHASE_NAMES)).toHaveLength(16);
  });

  it('phase 0 is Pre-Purchase & Planning', () => {
    expect(PHASE_NAMES[0]).toBe('Pre-Purchase & Planning');
  });

  it('phase 15 is Packaging & Shipping', () => {
    expect(PHASE_NAMES[15]).toBe('Packaging & Shipping');
  });
});
