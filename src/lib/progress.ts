// PodPlay Ops Wizard — Progress Calculation & Status Machine
// Pure functions — no Supabase dependency; testable without mocking.

import type { DeploymentStatus, ProjectStatus, RevenueStage } from './types';

// ---------------------------------------------------------------------------
// Minimal shape interfaces (subset of DB rows needed by these functions)
// ---------------------------------------------------------------------------

export interface DeploymentChecklistItem {
  phase: number;
  is_completed: boolean;
}

export interface ProjectForProgress {
  project_status: ProjectStatus;
  revenue_stage: RevenueStage;
}

// ---------------------------------------------------------------------------
// Status machine: valid transition order for deployment_status
// not_started → config → ready_to_ship → shipped → installing → qc → completed
// ---------------------------------------------------------------------------

export const DEPLOYMENT_STATUS_ORDER: DeploymentStatus[] = [
  'not_started',
  'config',
  'ready_to_ship',
  'shipped',
  'installing',
  'qc',
  'completed',
];

export function getDeploymentStatusIndex(status: DeploymentStatus): number {
  return DEPLOYMENT_STATUS_ORDER.indexOf(status);
}

export function canAdvanceDeploymentStatus(
  current: DeploymentStatus,
  target: DeploymentStatus
): boolean {
  return getDeploymentStatusIndex(target) === getDeploymentStatusIndex(current) + 1;
}

export function canRollBackDeploymentStatus(
  current: DeploymentStatus,
  target: DeploymentStatus
): boolean {
  return getDeploymentStatusIndex(target) === getDeploymentStatusIndex(current) - 1;
}

// ---------------------------------------------------------------------------
// Phase name map (shared across functions)
// ---------------------------------------------------------------------------

export const PHASE_NAMES: Record<number, string> = {
  0:  'Pre-Purchase & Planning',
  1:  'Pre-Configuration (Office)',
  2:  'Unboxing & Labeling',
  3:  'Network Rack Assembly',
  4:  'Networking Setup (UniFi)',
  5:  'ISP Router Configuration',
  6:  'Camera Configuration',
  7:  'DDNS Setup (FreeDNS)',
  8:  'Mac Mini Setup',
  9:  'Replay Service Deployment (V1)',
  10: 'iPad Setup',
  11: 'Apple TV Setup',
  12: 'Physical Installation (On-Site)',
  13: 'Testing & Verification',
  14: 'Health Monitoring Setup',
  15: 'Packaging & Shipping',
};

// ---------------------------------------------------------------------------
// Level 1: Deployment Checklist Progress
// ---------------------------------------------------------------------------

/**
 * Returns 0–100 (integer).
 * Used for: project card progress bar, Stage 3 wizard header.
 */
export function calculateDeploymentProgress(items: DeploymentChecklistItem[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter(i => i.is_completed).length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Returns completed count, total count, and integer percentage for one phase.
 * Used for: phase accordion header label in Stage 3 wizard.
 */
export function calculatePhaseProgress(
  items: DeploymentChecklistItem[],
  phase: number
): { completed: number; total: number; pct: number } {
  const phaseItems = items.filter(i => i.phase === phase);
  if (phaseItems.length === 0) return { completed: 0, total: 0, pct: 0 };
  const completed = phaseItems.filter(i => i.is_completed).length;
  return {
    completed,
    total: phaseItems.length,
    pct: Math.round((completed / phaseItems.length) * 100),
  };
}

/**
 * Returns true only when every item in the phase is completed.
 * Used for: phase accordion header icon (circle / half-circle / checkmark).
 */
export function isPhaseComplete(items: DeploymentChecklistItem[], phase: number): boolean {
  const phaseItems = items.filter(i => i.phase === phase);
  if (phaseItems.length === 0) return false;
  return phaseItems.every(i => i.is_completed);
}

/**
 * Returns 'empty' | 'partial' | 'complete'.
 * Used for: phase accordion header icon selection.
 */
export function getPhaseStatus(
  items: DeploymentChecklistItem[],
  phase: number
): 'empty' | 'partial' | 'complete' {
  const { completed, total } = calculatePhaseProgress(items, phase);
  if (completed === 0) return 'empty';
  if (completed === total) return 'complete';
  return 'partial';
}

/**
 * Returns a summary of all 16 phases for the wizard sidebar navigation.
 * Used for: left-panel phase list in Stage 3 wizard.
 */
export function calculateAllPhasesSummary(
  items: DeploymentChecklistItem[]
): Array<{ phase: number; name: string; status: 'empty' | 'partial' | 'complete'; completed: number; total: number }> {
  return Object.entries(PHASE_NAMES).map(([phaseStr, name]) => {
    const phase = Number(phaseStr);
    const { completed, total } = calculatePhaseProgress(items, phase);
    return {
      phase,
      name,
      status: getPhaseStatus(items, phase),
      completed,
      total,
    };
  });
}

/**
 * Returns a status label string for the project list card.
 * Used for: project list status pill in dashboard.
 */
export function getDeploymentStatusLabel(
  deploymentStatus: DeploymentStatus,
  items: DeploymentChecklistItem[]
): string {
  switch (deploymentStatus) {
    case 'not_started':
      return 'Not Started';

    case 'config': {
      const officePhases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15];
      const officeItems = items.filter(i => officePhases.includes(i.phase));
      const pct = calculateDeploymentProgress(officeItems);
      return `Configuring — ${pct}%`;
    }

    case 'ready_to_ship':
      return 'Ready to Ship';

    case 'shipped':
      return 'In Transit';

    case 'installing': {
      const phase12Items = items.filter(i => i.phase === 12);
      const pct = calculateDeploymentProgress(phase12Items);
      return `Installing — ${pct}%`;
    }

    case 'qc': {
      const qcItems = items.filter(i => i.phase === 13 || i.phase === 14);
      const pct = calculateDeploymentProgress(qcItems);
      return `QA — ${pct}%`;
    }

    case 'completed':
      return 'Complete';

    default:
      return deploymentStatus;
  }
}

// ---------------------------------------------------------------------------
// Level 2: Overall Project Stage Progress
// ---------------------------------------------------------------------------

/**
 * Maps project_status to a 1-based stage index (1–4).
 * Completed/cancelled map to 4 and 0 respectively.
 */
export function getProjectStageIndex(projectStatus: ProjectStatus): number {
  const stageMap: Record<ProjectStatus, number> = {
    intake:          1,
    procurement:     2,
    deployment:      3,
    financial_close: 4,
    completed:       4,
    cancelled:       0,
  };
  return stageMap[projectStatus];
}

/**
 * Returns a human-readable stage label.
 * Used for: project card stage chip (secondary to status badge).
 */
export function getProjectStageLabel(projectStatus: ProjectStatus): string {
  const labelMap: Record<ProjectStatus, string> = {
    intake:          'Stage 1 — Intake',
    procurement:     'Stage 2 — Procurement',
    deployment:      'Stage 3 — Deployment',
    financial_close: 'Stage 4 — Financial Close',
    completed:       'Completed',
    cancelled:       'Cancelled',
  };
  return labelMap[projectStatus];
}

/**
 * Returns the overall project progress as 0–100 integer.
 * Used for: wizard header progress bar, project list "X% overall".
 *
 * Stage bands:
 *   intake:          flat 12%
 *   procurement:     flat 37%
 *   deployment:      50–75% interpolated via checklist %
 *   financial_close: 75–100% interpolated via revenue_stage
 *   completed:       100%
 *   cancelled:       0%
 */
export function calculateOverallProjectProgress(
  project: ProjectForProgress,
  checklistItems: DeploymentChecklistItem[]
): number {
  switch (project.project_status) {
    case 'intake':
      return 12;

    case 'procurement':
      return 37;

    case 'deployment': {
      const checklistPct = calculateDeploymentProgress(checklistItems);
      return 50 + Math.round(checklistPct * 0.25);
    }

    case 'financial_close': {
      const revenueProgressMap: Record<RevenueStage, number> = {
        proposal:         0,
        signed:           20,
        deposit_invoiced: 40,
        deposit_paid:     60,
        final_invoiced:   80,
        final_paid:       100,
      };
      const revenueProgress = revenueProgressMap[project.revenue_stage] ?? 0;
      return 75 + Math.round(revenueProgress * 0.25);
    }

    case 'completed':
      return 100;

    case 'cancelled':
      return 0;

    default:
      return 0;
  }
}
