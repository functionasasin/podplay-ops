# Business Logic: Progress Calculation

**Aspect**: logic-progress-calculation
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: CUSTOMER MASTER "Status" column (deployment_status), per-customer status tabs (phase completion), no explicit % field in MRP — it was inferred by eye
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `projects`, `deployment_checklist_items`

---

## Overview

Progress in the PodPlay Ops Wizard operates at two levels:

1. **Deployment checklist progress** (fine-grained) — percentage of deployment checklist steps
   completed, broken down by overall and per-phase. Only meaningful while a project is in
   Stage 3 (`project_status = 'deployment'`). Derived entirely from
   `deployment_checklist_items.is_completed`.

2. **Overall project stage progress** (coarse-grained) — which of the 4 wizard stages the project
   is in, used to render the dashboard stage indicator and wizard header. Derived from
   `project_status` and `revenue_stage`.

Both levels are computed **client-side** from data already fetched — there are no stored progress
columns. The single source of truth is the `is_completed` flags on checklist items and the
`project_status` / `revenue_stage` enum values.

---

## Level 1: Deployment Checklist Progress

### 1.1 Overall Deployment Progress

```typescript
/**
 * Returns 0–100 (integer).
 * Used for: project card progress bar, Stage 3 wizard header.
 */
function calculateDeploymentProgress(items: DeploymentChecklistItem[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter(i => i.is_completed).length;
  return Math.round((completed / items.length) * 100);
}
```

**Display rules**:
- 0%: "Not started" (no items checked)
- 1–99%: Show exact integer percentage
- 100%: Show green checkmark icon in place of progress bar

### 1.2 Per-Phase Progress

```typescript
/**
 * Returns completed count, total count, and integer percentage for one phase.
 * Used for: phase accordion header label in Stage 3 wizard.
 */
function calculatePhaseProgress(
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
```

**Display**: Each phase accordion header shows `"X / Y steps"` and a mini progress bar filling
proportionally. Example: `"3 / 8 steps"` with a ~38% filled bar.

### 1.3 Phase Completion Status

A phase is "complete" only when **all** its items are checked:

```typescript
/**
 * Returns true only when every item in the phase is completed.
 * Used for: phase accordion header icon (circle / half-circle / checkmark).
 */
function isPhaseComplete(items: DeploymentChecklistItem[], phase: number): boolean {
  const phaseItems = items.filter(i => i.phase === phase);
  if (phaseItems.length === 0) return false;
  return phaseItems.every(i => i.is_completed);
}

/**
 * Returns 'empty' | 'partial' | 'complete'.
 * Used for: phase accordion header icon selection.
 */
function getPhaseStatus(
  items: DeploymentChecklistItem[],
  phase: number
): 'empty' | 'partial' | 'complete' {
  const { completed, total } = calculatePhaseProgress(items, phase);
  if (completed === 0) return 'empty';
  if (completed === total) return 'complete';
  return 'partial';
}
```

**Icon mapping**:
| Status | Icon | Color |
|--------|------|-------|
| `empty` | Circle outline | Gray |
| `partial` | Half-filled circle | Blue |
| `complete` | Checkmark circle | Green |

### 1.4 All-Phases Summary

```typescript
/**
 * Returns a summary of all 16 phases for the wizard sidebar navigation.
 * Used for: left-panel phase list in Stage 3 wizard.
 */
function calculateAllPhasesSummary(
  items: DeploymentChecklistItem[]
): Array<{ phase: number; name: string; status: 'empty' | 'partial' | 'complete'; completed: number; total: number }> {
  const PHASE_NAMES: Record<number, string> = {
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
```

### 1.5 Status-Stage Label (deployment_status-specific)

For the project list status badge, combine `deployment_status` with the checklist progress to
produce a human-readable label:

```typescript
/**
 * Returns a status label string for the project list card.
 * Used for: project list status pill in dashboard.
 */
function getDeploymentStatusLabel(
  deploymentStatus: DeploymentStatus,
  items: DeploymentChecklistItem[]
): string {
  switch (deploymentStatus) {
    case 'not_started':
      return 'Not Started';

    case 'config': {
      // Progress over phases 0–11 + 15 (office-side phases)
      const officePhases = [0,1,2,3,4,5,6,7,8,9,10,11,15];
      const officeItems = items.filter(i => officePhases.includes(i.phase));
      const pct = calculateDeploymentProgress(officeItems);
      return `Configuring — ${pct}%`;
    }

    case 'ready_to_ship':
      return 'Ready to Ship';

    case 'shipped':
      return 'In Transit';

    case 'installing': {
      // Progress over phase 12 only (on-site)
      const phase12Items = items.filter(i => i.phase === 12);
      const pct = calculateDeploymentProgress(phase12Items);
      return `Installing — ${pct}%`;
    }

    case 'qc': {
      // Progress over phases 13–14 (testing + health monitoring)
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
```

**Display mapping**:
| `deployment_status` | Active phase range | Progress source | Badge color |
|---------------------|-------------------|-----------------|-------------|
| `not_started` | — | — | Gray |
| `config` | Phases 0–11, 15 | office-phase items only | Blue |
| `ready_to_ship` | — | — | Indigo |
| `shipped` | — | — | Purple |
| `installing` | Phase 12 | phase 12 items | Orange |
| `qc` | Phases 13–14 | phases 13+14 items | Yellow |
| `completed` | — | — | Green |

---

## Level 2: Overall Project Stage Progress

### 2.1 Stage Index Derivation

```typescript
/**
 * Maps project_status to a 1-based stage index (1–4).
 * Completed/cancelled map to 4 (final stage done) and 0 respectively.
 */
function getProjectStageIndex(projectStatus: ProjectStatus): number {
  const stageMap: Record<ProjectStatus, number> = {
    intake:          1,
    procurement:     2,
    deployment:      3,
    financial_close: 4,
    completed:       4, // Stage 4 done
    cancelled:       0,
  };
  return stageMap[projectStatus];
}
```

### 2.2 Stage Completion Percentage (for wizard breadcrumb / header)

Each stage has a "floor" and "ceiling" in the 0–100% range. Within Stage 3, the deployment
checklist % is used to interpolate within the 50–75% band. Other stages are flat.

```
Stage 1 (intake):          0%  → 25%  (flat while in progress, 25% on completion)
Stage 2 (procurement):     25% → 50%  (flat while in progress, 50% on completion)
Stage 3 (deployment):      50% → 75%  (interpolated via checklist %)
Stage 4 (financial_close): 75% → 100% (interpolated via revenue_stage)
Completed:                 100%
```

```typescript
/**
 * Returns the overall project progress as 0–100 integer.
 * Used for: wizard header progress bar, project list "X% overall".
 */
function calculateOverallProjectProgress(
  project: Project,
  checklistItems: DeploymentChecklistItem[]
): number {
  switch (project.project_status) {
    case 'intake':
      // Stage 1 is always "in progress" — flat at 12% while active
      return 12;

    case 'procurement':
      // Stage 2 in progress — flat at 37%
      return 37;

    case 'deployment': {
      // Stage 3: interpolate 50%–75% based on checklist
      const checklistPct = calculateDeploymentProgress(checklistItems);
      return 50 + Math.round(checklistPct * 0.25);
    }

    case 'financial_close': {
      // Stage 4: interpolate 75%–100% based on revenue_stage
      const revenueProgressMap: Record<string, number> = {
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
```

**Example values**:
| Project state | Overall % |
|---------------|-----------|
| Intake in progress | 12% |
| Procurement in progress | 37% |
| Deployment, 0 checklist items done | 50% |
| Deployment, 50 of 116 items done (43%) | 61% |
| Deployment, 116/116 done (100%) | 75% |
| Financial close, deposit invoiced | 85% |
| Financial close, final paid | 100% |
| Completed | 100% |

### 2.3 Stage Label for Dashboard Card

```typescript
/**
 * Returns a human-readable stage label.
 * Used for: project card stage chip (secondary to status badge).
 */
function getProjectStageLabel(projectStatus: ProjectStatus): string {
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
```

---

## Level 3: Phase Gate Validation (deployment_status transitions)

Phase gates are validated before allowing `deployment_status` to advance. These use the same
per-phase progress calculations.

### 3.1 Gate Check Function

```typescript
/**
 * Checks whether all items in the specified phases are completed.
 * Returns { passed: true } or { passed: false, blockers: [...] }.
 * Used for: deployment_status transition guards.
 */
async function checkPhaseGate(
  projectId: string,
  phases: number[],
  supabase: SupabaseClient
): Promise<{ passed: boolean; blockers: Array<{ phase: number; phaseName: string; incomplete: number; total: number }> }> {
  const { data: items } = await supabase
    .from('deployment_checklist_items')
    .select('phase, is_completed')
    .eq('project_id', projectId)
    .in('phase', phases);

  const PHASE_NAMES: Record<number, string> = {
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

  const blockers: Array<{ phase: number; phaseName: string; incomplete: number; total: number }> = [];

  for (const phase of phases) {
    const phaseItems = (items ?? []).filter(i => i.phase === phase);
    const incomplete = phaseItems.filter(i => !i.is_completed).length;
    if (incomplete > 0) {
      blockers.push({
        phase,
        phaseName: PHASE_NAMES[phase] ?? `Phase ${phase}`,
        incomplete,
        total: phaseItems.length,
      });
    }
  }

  return { passed: blockers.length === 0, blockers };
}
```

### 3.2 Gate Definitions per Transition

| Transition | Phase gates checked |
|-----------|---------------------|
| `config` → `ready_to_ship` | [0,1,2,3,4,5,6,7,8,9,10,11,15] — all office phases |
| `installing` → `qc` | [12] — on-site installation |
| `qc` → `completed` | [13,14] — testing + health monitoring |

Other transitions (`not_started`→`config`, `ready_to_ship`→`shipped`, `shipped`→`installing`)
have no phase gate — they are manually triggered by the ops person without checklist validation.

### 3.3 Soft Gate Override

When the gate check fails (blockers > 0), the UI shows a confirmation modal:

```
"X step(s) incomplete in Phase Y — Proceed anyway?"
[Cancel]  [Proceed with {N} incomplete steps]
```

The override is recorded by setting `deployment_status` anyway and adding a system note to
`projects.internal_notes` (append-only text field):

```typescript
const overrideNote = `[${new Date().toISOString()}] Overrode phase gate for ${targetStatus}: ${
  blockers.map(b => `Phase ${b.phase} ${b.incomplete}/${b.total} incomplete`).join(', ')
}`;
```

---

## Service Layer: Progress Queries

### 4.1 Fetch Checklist Progress for Single Project

```typescript
// src/services/deployment.ts

/**
 * Fetches all checklist items for a project and computes progress.
 * Used in Stage 3 wizard — full detail needed.
 */
async function getProjectChecklistProgress(
  projectId: string,
  supabase: SupabaseClient
): Promise<{
  items: DeploymentChecklistItem[];
  overallPct: number;
  byPhase: ReturnType<typeof calculateAllPhasesSummary>;
}> {
  const { data: items, error } = await supabase
    .from('deployment_checklist_items')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return {
    items: items ?? [],
    overallPct: calculateDeploymentProgress(items ?? []),
    byPhase: calculateAllPhasesSummary(items ?? []),
  };
}
```

### 4.2 Fetch Lightweight Progress for Dashboard List

The dashboard shows many projects at once. Avoid fetching full checklist rows (notes, warnings,
descriptions) — only need `is_completed` flags:

```typescript
// src/services/deployment.ts

/**
 * Fetches completion counts only (no heavy description/notes columns).
 * Used for: dashboard project list progress bars.
 */
async function getProjectChecklistCounts(
  projectId: string,
  supabase: SupabaseClient
): Promise<{ completed: number; total: number; pct: number }> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .select('is_completed')
    .eq('project_id', projectId);

  if (error) throw error;

  const total = data?.length ?? 0;
  const completed = data?.filter(r => r.is_completed).length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, pct };
}
```

### 4.3 Bulk Progress for All Active Projects (Dashboard Optimization)

When the dashboard lists all projects, a single query fetches completion state for all projects
simultaneously instead of N individual queries:

```typescript
// src/services/deployment.ts

/**
 * Returns a map of projectId → { completed, total, pct } for all given project IDs.
 * Single query using .in() — avoids N+1 queries on the dashboard.
 * Used for: dashboard initial load.
 */
async function getBulkChecklistCounts(
  projectIds: string[],
  supabase: SupabaseClient
): Promise<Map<string, { completed: number; total: number; pct: number }>> {
  if (projectIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .select('project_id, is_completed')
    .in('project_id', projectIds);

  if (error) throw error;

  const result = new Map<string, { completed: number; total: number; pct: number }>();

  for (const projectId of projectIds) {
    const items = (data ?? []).filter(r => r.project_id === projectId);
    const total = items.length;
    const completed = items.filter(r => r.is_completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    result.set(projectId, { completed, total, pct });
  }

  return result;
}
```

**Performance note**: For projects not in `'deployment'` stage, `deployment_checklist_items` rows
do not exist — these projects return `{ completed: 0, total: 0, pct: 0 }`. The dashboard uses
`calculateOverallProjectProgress` (which handles all stages) for their progress bar, ignoring
the 0/0 checklist result.

---

## Edge Cases

### 5.1 No Checklist Items Yet

A project in `project_status = 'deployment'` with zero checklist items (instantiation pending or
failed) returns `pct = 0`. The Stage 3 wizard shows a "Setting up checklist..." skeleton state
and retries the instantiation.

```typescript
if (items.length === 0 && project.project_status === 'deployment') {
  // Trigger re-instantiation (idempotent — checks for existing rows first)
  await instantiateChecklist(project.id, project, supabase);
}
```

### 5.2 Partial Rollback After Status Advance

If `deployment_status` is rolled back (e.g., `qc` → `installing`), previously completed steps
in Phase 12 remain completed — only the status label changes. Progress % is not reset. Ops must
manually uncheck steps they need to redo.

Guard: Steps cannot be unchecked in phases gated by an earlier `deployment_status` transition.
Example: cannot uncheck Phase 4 steps after `deployment_status = 'shipped'`. The system shows:
"This step is locked because the deployment has already been shipped. Roll back to 'config' to
edit office-phase steps."

### 5.3 Tier-Specific Step Count Variations

Total item count varies by tier:
- `pro` / `pbk`: 116 items
- `autonomous`: 119 items (+3 access-control steps)
- `autonomous_plus`: 121 items (+5 access-control + surveillance steps)

Progress % is always `completed / total` using the actual item count for the project — no
hardcoded denominators. The function is tier-agnostic because it counts real rows.

### 5.4 Project with deployment_status = 'not_started' but project_status = 'deployment'

Valid transient state: project just advanced to Stage 3, checklist instantiation has not run yet.
`deployment_status` will be updated to `'config'` immediately after instantiation. Until then,
show deployment progress as 0% with "Setting up..." message.

### 5.5 100% Checklist but deployment_status ≠ 'completed'

Possible if ops checked all boxes but didn't formally advance the status. The system:
- Shows 100% progress in the checklist
- Shows a "Mark as Complete" call-to-action prompt in the Stage 3 wizard header
- Does NOT auto-advance `deployment_status` (ops must confirm via button)

### 5.6 Cancelled Projects

`project_status = 'cancelled'` projects:
- `calculateOverallProjectProgress` returns 0
- `getDeploymentStatusLabel` is not called
- Dashboard shows a "Cancelled" badge with gray styling and no progress bar
- Checklist items (if any were created) remain in DB but are not rendered in the wizard

---

## File Locations (forward loop implementation targets)

```
src/
├── lib/
│   └── progress.ts          ← calculateDeploymentProgress, calculatePhaseProgress,
│                               isPhaseComplete, getPhaseStatus, calculateAllPhasesSummary,
│                               getDeploymentStatusLabel, calculateOverallProjectProgress,
│                               getProjectStageIndex, getProjectStageLabel
└── services/
    └── deployment.ts        ← getProjectChecklistProgress, getProjectChecklistCounts,
                                getBulkChecklistCounts, checkPhaseGate, instantiateChecklist
```

All progress calculation functions in `src/lib/progress.ts` are pure functions (no Supabase
dependency) and can be unit-tested without mocking.

All Supabase-dependent functions in `src/services/deployment.ts` accept `supabase: SupabaseClient`
as a parameter for testability.

---

## Concrete Example: 6-Court Pro Project at Mid-Deployment

**Customer**: Telepark Pickleball Club
**Tier**: pro
**project_status**: deployment
**deployment_status**: config
**Checklist**: 116 items total, 45 completed (Phases 0–4 done, Phase 5 in progress)

**Calculations**:
```
calculateDeploymentProgress(items) → Math.round(45/116 × 100) = 39%
calculateOverallProjectProgress(project, items) → 50 + Math.round(39 × 0.25) = 50 + 10 = 60%
getDeploymentStatusLabel('config', items):
  → officeItems = phases 0–11 + 15 = ~116 items (all office phases)
  → pct = 39%
  → "Configuring — 39%"

Per-phase:
  Phase 0 (8 items, 8 done): { completed: 8, total: 8, pct: 100 } → 'complete' → checkmark
  Phase 1 (7 items, 7 done): { completed: 7, total: 7, pct: 100 } → 'complete' → checkmark
  Phase 2 (7 items, 7 done): { completed: 7, total: 7, pct: 100 } → 'complete' → checkmark
  Phase 3 (6 items, 6 done): { completed: 6, total: 6, pct: 100 } → 'complete' → checkmark
  Phase 4 (12 items, 12 done): { completed: 12, total: 12, pct: 100 } → 'complete' → checkmark
  Phase 5 (2 items, 5 done): { completed: 5, total: 2, ... } — WAIT this is wrong

Actually Phase 5 has 2 items total (ISP Router Configuration). With 45 total done and phases
0–4 accounting for 8+7+7+6+12=40 items, Phase 5 has 5 remaining done = 2 items in Phase 5 + 3
from Phase 6 partially done.

Let's say 40 items (phases 0-4 all done) + 5 items from Phase 5 (2 items) + Phase 6 (3 of 13):
  Phase 5 (2 items, 2 done): → 'complete'
  Phase 6 (13 items, 3 done): → 'partial' → half-filled circle
  Phases 7–15: 0 done → 'empty' → circle outlines

gate check for config → ready_to_ship:
  checkPhaseGate(projectId, [0,1,2,3,4,5,6,7,8,9,10,11,15])
  → blockers: Phase 6 (10 incomplete), Phase 7 (5 incomplete), ..., Phase 15 (6 incomplete)
  → passed: false
  → Modal: "9 phases have incomplete steps. Complete all office phases before marking ready to ship."
```
