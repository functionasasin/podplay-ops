# Business Logic: Deployment Tracking

**Aspect**: logic-deployment-tracking
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: CUSTOMER MASTER "Status" column, per-customer status tabs, Deployment Guide phases 0–15
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `projects`, `deployment_checklist_items`, `deployment_checklist_templates`

---

## Overview

Deployment tracking covers the full Stage 3 lifecycle of a PodPlay installation: from the first
office-side configuration work through physical on-site installation, QA testing, and handoff.

Two separate fields track progress:

1. **`projects.deployment_status`** — coarse-grained status (7 values). Manually advanced by the
   ops person; indicates which phase of the deployment lifecycle the project is in.
2. **`deployment_checklist_items.is_completed`** — fine-grained per-step checkbox state. 121 items
   per project. Progress % derived from this.

The deployment checklist is created once when the project enters Stage 3 (`project_status = 'deployment'`).
It is never regenerated (changes are made in-place via note fields).

---

## State Machine: deployment_status

```
not_started
     │  ← ops person enters Stage 3; checklist instantiated
     ▼
   config          ← office work: MDM setup, rack assembly, camera config,
     │               DDNS, Mac Mini, replay service, iPad/Apple TV setup
     │               (Phases 0–11, plus Phase 15 pending)
     ▼
ready_to_ship      ← all office phases complete; Phase 15 (packaging) done;
     │               box packed, BOM printed, shipping label attached
     ▼
  shipped          ← package in transit to venue; tracking number recorded
     │               (manual advance — no checklist trigger)
     ▼
 installing        ← on-site work: Phase 12 (physical installation)
     │               cameras/TVs/iPads/Apple TVs/buttons/access control mounted
     ▼
    qc             ← Phase 13 (Testing & Verification) + Phase 14 (Health Monitoring)
     │               replay tested, buttons tested, health monitoring configured
     ▼
 completed         ← all 15 phases done; project transitions to
                     project_status = 'financial_close'
```

### Transition Rules

Each transition has prerequisites the system enforces. The ops person confirms by clicking
"Advance Status" in the wizard — the system validates before allowing the transition.

#### not_started → config

**Trigger**: Project enters Stage 3 (`project_status` advances to `'deployment'`)

**System action** (automatic, on project_status update):
```typescript
// Runs inside a Supabase edge function or client-side transaction
async function onEnterDeployment(projectId: string, project: Project) {
  // 1. Instantiate checklist from templates
  await instantiateChecklist(projectId, project);

  // 2. Set deployment_status = 'config'
  await supabase
    .from('projects')
    .update({ deployment_status: 'config' })
    .eq('id', projectId);
}
```

**Guard**: `project_status` must be `'procurement'` before it can advance to `'deployment'`.
The BOM must be approved (`bom_approved = true` on the project) before Stage 3 is entered.

---

#### config → ready_to_ship

**Manual trigger**: Ops person clicks "Mark as Ready to Ship"

**Guards checked by system**:
1. All Phase 1–11 checklist items must be `is_completed = true`
   - Phases 0–11 cover: Pre-Configuration, Unboxing & Labeling, Network Rack Assembly,
     Networking Setup, ISP Config, Camera Config, DDNS, Mac Mini Setup, Replay Service,
     iPad Setup, Apple TV Setup
   - Phase 0 (Pre-Purchase & Planning) included — already completed before Stage 3 in theory,
     but tracked here for completeness; allow partial override
2. Phase 15 (Packaging & Shipping, steps 124–129) must be fully complete:
   - BOM printed ✓
   - Items counted against BOM ✓
   - BOM placed in box ✓
   - Box sealed ✓
   - Package weighed ✓
   - Shipping label printed ✓

**UI behavior**: If guards fail, show which incomplete phase/steps are blocking the transition.
Ops can override with a confirmation modal ("X steps incomplete — proceed anyway?").

**System action**:
```typescript
await supabase
  .from('projects')
  .update({ deployment_status: 'ready_to_ship' })
  .eq('id', projectId);
```

---

#### ready_to_ship → shipped

**Manual trigger**: Ops person clicks "Mark as Shipped" (enters tracking number in modal)

**Guards**:
- No checklist guards — shipping is a logistics event, not a checklist milestone
- `deployment_status` must be `'ready_to_ship'`

**System action**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'shipped',
    // tracking_number stored in project.internal_notes or a dedicated field
    // (see schema gap below — tracking_number field needed)
  })
  .eq('id', projectId);
```

**Schema gap**: Add `shipping_tracking_number TEXT` to `projects` table. Ops enters this in the
"Mark as Shipped" modal. Format: free-text (FedEx, UPS, USPS format varies).

---

#### shipped → installing

**Manual trigger**: Ops person clicks "Mark as Installing" when the installer arrives on-site

**Guards**:
- `deployment_status` must be `'shipped'`
- `installation_start_date` must be set (prompted in modal if not set — ops enters the date)

**System action**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'installing',
    installation_start_date: installationStartDate, // from modal
  })
  .eq('id', projectId);
```

---

#### installing → qc

**Manual trigger**: Ops person clicks "Start QA" — physical installation is complete

**Guards**:
1. All Phase 12 checklist items must be `is_completed = true`:
   - Camera mounting (steps 99–102)
   - TV display mounting (step 103–103a)
   - iPad kiosk mounting (steps 105–107)
   - Bluetooth button mounting/pairing (step 108–108a)
   - Kisi/access control wiring (steps 110–112; Autonomous/Autonomous+ only)
2. `installation_end_date` set (ops enters in confirmation modal)

**Override**: Ops can acknowledge incomplete steps and proceed with a note.

**System action**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'qc',
    installation_end_date: installationEndDate,
  })
  .eq('id', projectId);
```

---

#### qc → completed

**Manual trigger**: Ops person clicks "Mark Deployment Complete"

**Guards**:
1. All Phase 13 checklist items must be `is_completed = true`:
   - API URLs added to admin dashboard (step 113)
   - DDNS health check verified from cellular network (step 114)
   - RTSP streams verified via VLC (step 115)
   - Operations reservation created (step 116)
   - Free replays added to ops profile (step 117)
   - Replay test: iPad initiates replay, appears on Apple TV (step 118)
   - Bluetooth button test (single/double/long press) (part of step 118)
2. All Phase 14 checklist items must be `is_completed = true`:
   - GCP health monitoring configured (step 119)
   - Health check endpoint responding (step 120)
   - GCP ping interval set (5 min) (step 121)
   - Health checks defined (step 122)
   - Slack alerts configured (step 123)
3. `go_live_date` must be set (ops enters in completion modal)

**Override**: Ops can acknowledge incomplete QA items with a confirmation note.

**System action**:
```typescript
// Transaction: mark deployment complete and advance to financial close
await supabase.rpc('complete_deployment', {
  p_project_id: projectId,
  p_go_live_date: goLiveDate,
});

// complete_deployment RPC:
// UPDATE projects SET
//   deployment_status = 'completed',
//   project_status = 'financial_close',
//   go_live_date = p_go_live_date
// WHERE id = p_project_id
```

**Side effects**:
- `project_status` advances to `'financial_close'` (Stage 4 unlocked)
- `revenue_stage` advances from `'deposit_paid'` to `'final_invoiced'` IF a final invoice
  has already been generated; otherwise ops is prompted to generate the final invoice in Stage 4

---

## Progress Calculation

Progress percentage is derived from `deployment_checklist_items` for the project.

### Overall Progress

```typescript
function calculateOverallProgress(items: DeploymentChecklistItem[]): number {
  if (items.length === 0) return 0;
  const completed = items.filter(i => i.is_completed).length;
  return Math.round((completed / items.length) * 100);
}
```

**Display**: Progress bar on the project card (dashboard) and Stage 3 wizard header.
- 0% = not started
- 1–99% = in progress (show exact %)
- 100% = all steps complete (show green checkmark)

### Per-Phase Progress

```typescript
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

**Display**: Each phase accordion header shows `X/Y steps complete` and a mini progress bar.

### Phase Completion Status

A phase is considered "complete" only when ALL its items are `is_completed = true`:

```typescript
function isPhaseComplete(items: DeploymentChecklistItem[], phase: number): boolean {
  const phaseItems = items.filter(i => i.phase === phase);
  if (phaseItems.length === 0) return false;
  return phaseItems.every(i => i.is_completed);
}
```

Phase completion drives the phase header icon: incomplete (circle), partial (half-circle), complete (checkmark).

### deployment_status-Specific Progress

For the status badge in the project list, compute progress only for the active phases:

| deployment_status | Active phase range | Label |
|-------------------|-------------------|-------|
| not_started       | — | "Not Started" |
| config            | Phases 0–11, 15 | "Configuring — X%" |
| ready_to_ship     | All phases complete (office) | "Ready to Ship" |
| shipped           | — | "In Transit" |
| installing        | Phase 12 | "Installing — X%" |
| qc                | Phases 13–14 | "QA — X%" |
| completed         | — | "Complete" |

---

## Phase-to-Status Mapping

The 16 phases (0–15) map to deployment_status values:

| Phase | Name | Steps | deployment_status |
|-------|------|-------|-------------------|
| 0  | Pre-Purchase & Planning | 8 (steps 1–8) | config |
| 1  | Pre-Configuration (Office) | 7 (steps 9–16) | config |
| 2  | Unboxing & Labeling | 7 (steps 17–23) | config |
| 3  | Network Rack Assembly | 6 (steps 24–29) | config |
| 4  | Networking Setup (UniFi) | 12 (steps 30–45) | config |
| 5  | ISP Router Configuration | 2 (steps 46–47) | config |
| 6  | Camera Configuration | 13 (steps 48–58) | config |
| 7  | DDNS Setup (FreeDNS) | 5 (steps 59–65) | config |
| 8  | Mac Mini Setup | 8 (steps 66–73) | config |
| 9  | Replay Service Deployment (V1) | 10 (steps 74–84) | config |
| 10 | iPad Setup | 11 (steps 85–99) | config |
| 11 | Apple TV Setup | 5 (steps 92b–98b) | config |
| 12 | Physical Installation (On-Site) | 10 (steps 99–112) | installing |
| 13 | Testing & Verification | 8 (steps 113–118) | qc |
| 14 | Health Monitoring Setup | 3 (steps 119–123) | qc |
| 15 | Packaging & Shipping | 6 (steps 124–129) | config (pre-ship) |

**Note on Phase 15**: Packaging & Shipping is office-side work done before handing off to the
carrier. It is completed while `deployment_status = 'config'`, and its completion is a gate for
advancing to `ready_to_ship`. The phase is shown at the end of the config group in the wizard UI.

---

## Checklist Item Operations

### Completing a Step

```typescript
async function completeChecklistItem(
  itemId: string,
  note: string | null,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      notes: note ?? null,
    })
    .eq('id', itemId);
}
```

### Unchecking a Step

Steps can be unchecked (ops discovers they need to redo something):

```typescript
async function uncompleteChecklistItem(
  itemId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: false,
      completed_at: null,
      // notes preserved — ops notes from previous completion still visible
    })
    .eq('id', itemId);
}
```

**Guard**: Cannot uncheck items in a phase that has already been passed in `deployment_status`.
Example: Cannot uncheck Phase 9 items once `deployment_status = 'shipping'` or later.
This prevents accidental rollback of completed work. Show a warning modal if ops tries.

### Adding a Note to a Step

```typescript
async function updateChecklistItemNote(
  itemId: string,
  note: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('deployment_checklist_items')
    .update({ notes: note })
    .eq('id', itemId);
}
```

Notes are always editable regardless of completion state. Used for logging serial numbers,
credentials confirmed, issues encountered, workarounds applied.

### Bulk Phase Complete

Ops can mark all items in a phase complete at once (for phases they completed but didn't track):

```typescript
async function bulkCompletePhase(
  projectId: string,
  phase: number,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('is_completed', false); // Only update incomplete items
}
```

---

## Checklist Instantiation (on Stage 3 Entry)

When `project_status` advances to `'deployment'`, the checklist is instantiated once.
Full algorithm in `analysis/model-checklist-templates.md`. Summary:

1. Fetch templates filtered by `project.tier` (NULL = all tiers; non-NULL = tier must match)
2. Apply V2 filter: only include `is_v2_only = true` steps if `project.replay_service_version = 'v2'`
   (currently all steps are `is_v2_only = false` — V2 not yet released as of March 2026)
3. Replace `{{TOKEN}}` placeholders in `description` using project fields
4. Insert 121 rows (for a standard Pro deployment) into `deployment_checklist_items`

**Idempotency**: Before instantiating, check if items already exist for the project.
If they do (e.g., due to a retry), skip instantiation:

```typescript
const { count } = await supabase
  .from('deployment_checklist_items')
  .select('id', { count: 'exact', head: true })
  .eq('project_id', projectId);

if (count > 0) return; // Already instantiated
```

---

## Status Regression (Rollback)

Deployment status can be rolled back one step by ops in exceptional cases (e.g., shipped package
returned, installation cancelled mid-way).

**Allowed rollbacks**:
- `ready_to_ship` → `config`: Package didn't ship; needs more office work
- `shipped` → `ready_to_ship`: Package returned to sender (rare)
- `installing` → `shipped`: Site visit cancelled; box returned to venue
- `qc` → `installing`: Major QA failures require physical re-work on-site
- `completed` → `qc`: Go-live was premature; system needs fixes (very rare)

**Blocked rollbacks**: Cannot go back more than one step in a single action. Cannot roll back
`not_started` (no prior state). Cannot roll back once `project_status = 'financial_close'` is
set, unless ops explicitly resets financial_close back to `'deployment'` first.

**UI**: Rollback is available in the deployment status dropdown with a confirmation modal:
"Rolling back to 'config' will allow editing completed steps. Are you sure?"

---

## Non-Linear Phase Navigation

The 15 phases do NOT have to be completed sequentially in the wizard UI. The ops person can:
- Jump to any phase at any time
- Complete steps out of order (e.g., do Phase 14 health monitoring before Phase 13 testing)
- Skip optional steps (system shows a warning for steps with `warnings` array non-empty)

**Why non-linear**: Real deployments vary — sometimes the camera is configured before the rack
is assembled, sometimes the ISP situation forces rework partway through. Forcing sequential order
would frustrate ops and drive workarounds.

**Guardrail**: The only sequential enforcement is at the `deployment_status` transition level
(above). Phase completion order within `config` is flexible.

---

## Tier-Specific Checklist Variations

Tier controls which template rows are instantiated:

| Tier | Total Steps | Tier-Specific Steps |
|------|-------------|---------------------|
| pro | 116 | 0 tier-specific (all NULL-applicable rows) |
| pbk | 116 | Same as Pro (PBK = Pro hardware, custom pricing only) |
| autonomous | 119 | +3 (VLAN 33, Kisi controller install, door reader install) |
| autonomous_plus | 121 | +5 (VLAN 31, VLAN 33, Kisi controller, door readers, door locks) |

Exact step breakdown from `analysis/model-checklist-templates.md`:
- Phase 4, step 10: Create SURVEILLANCE VLAN (VLAN 31) → `autonomous_plus` only
- Phase 4, step 11: Create ACCESS CONTROL VLAN (VLAN 33) → `autonomous, autonomous_plus`
- Phase 12, step 8: Install Kisi Controller → `autonomous, autonomous_plus`
- Phase 12, step 9: Install door readers → `autonomous, autonomous_plus`
- Phase 12, step 10: Wire door locks → `autonomous, autonomous_plus`

---

## Warning Propagation

Steps with non-empty `warnings` arrays display a yellow warning banner above the step:

Critical warnings that block advance if step is skipped (these must be acknowledged):

| Phase | Step | Warning |
|-------|------|---------|
| 0 | 4 | Starlink CGNAT blocks port 4000 — NOT compatible with PodPlay |
| 4 | 9 | Do NOT change default network yet — cameras need 192.168.1.1 subnet for initial config |
| 4 | 45 | Port 4000 is critical — all replay service communication flows through it |
| 8 | 73 | NEVER open cache folder in Finder — recreates .DS_Store which breaks replay processing |
| 10 | 86 | Enrollment order = power-on order. Always power iPads on in court-number order (C1 first) |
| 10 | 98 | NEVER send shutdown from Mosyle — only restart. Shutdown requires physical on-site access |
| 3 | 29 | Mac Mini needs breathing room in rack — overheating risk if flush against equipment |
| 12 | 108a | App Lock MUST be OFF to pair Flic buttons. Turn off App Lock in Mosyle before pairing |

---

## Auto-Fill Token Substitution

When the checklist is instantiated, token strings in step descriptions are replaced with
project-specific values. See `analysis/model-checklist-templates.md` for full token list.

6 tokens:
- `{{CUSTOMER_NAME}}` → `project.customer_name`
- `{{COURT_COUNT}}` → `project.court_count`
- `{{DDNS_SUBDOMAIN}}` → `project.ddns_subdomain` (may be empty at instantiation — filled in later)
- `{{UNIFI_SITE_NAME}}` → `project.unifi_site_name` (may be empty at instantiation)
- `{{MAC_MINI_USERNAME}}` → `project.mac_mini_username` (may be empty at instantiation)
- `{{LOCATION_ID}}` → `project.location_id` (confirmed with Agustin before Phase 1)

**Token refresh**: If project fields are updated after checklist instantiation (e.g., DDNS subdomain
set during Phase 7), the already-instantiated step descriptions are NOT automatically re-rendered.
Instead, the wizard UI renders tokens live:

```typescript
function renderStepDescription(
  description: string,
  project: Project
): string {
  const tokenMap: Record<string, string> = {
    CUSTOMER_NAME:    project.customer_name,
    COURT_COUNT:      String(project.court_count),
    DDNS_SUBDOMAIN:   project.ddns_subdomain ?? '(not yet set)',
    UNIFI_SITE_NAME:  project.unifi_site_name ?? '(not yet set)',
    MAC_MINI_USERNAME: project.mac_mini_username ?? '(not yet set)',
    LOCATION_ID:      project.location_id ?? '(not yet set)',
  };
  return description.replace(/\{\{(\w+)\}\}/g, (_, key) => tokenMap[key] ?? `{{${key}}}`);
}
```

When a token renders as `(not yet set)`, the step description shows it in orange to signal
the ops person must fill in the project field before proceeding.

---

## Checklist Data Queries

### Fetch all checklist items for a project (ordered)

```typescript
const { data: items } = await supabase
  .from('deployment_checklist_items')
  .select('*')
  .eq('project_id', projectId)
  .order('sort_order', { ascending: true });
// sort_order = phase × 100 + step_number
```

### Fetch checklist grouped by phase (for wizard phase view)

```typescript
// Client-side grouping after single fetch
const byPhase: Record<number, DeploymentChecklistItem[]> = {};
for (const item of items) {
  if (!byPhase[item.phase]) byPhase[item.phase] = [];
  byPhase[item.phase].push(item);
}
```

### Fetch overall progress for project list (lightweight)

```typescript
// Count completed vs total — used for progress bars on dashboard
const { data: counts } = await supabase
  .from('deployment_checklist_items')
  .select('is_completed')
  .eq('project_id', projectId);

const total = counts.length;
const completed = counts.filter(c => c.is_completed).length;
const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
```

### Check phase gate before deployment_status advance

```typescript
async function checkPhaseGate(
  projectId: string,
  phases: number[],
  supabase: SupabaseClient
): Promise<{ passed: boolean; blockers: { phase: number; incomplete: number }[] }> {
  const { data: items } = await supabase
    .from('deployment_checklist_items')
    .select('phase, is_completed')
    .eq('project_id', projectId)
    .in('phase', phases);

  const blockers: { phase: number; incomplete: number }[] = [];
  for (const phase of phases) {
    const phaseItems = items.filter(i => i.phase === phase);
    const incomplete = phaseItems.filter(i => !i.is_completed).length;
    if (incomplete > 0) blockers.push({ phase, incomplete });
  }

  return { passed: blockers.length === 0, blockers };
}

// Usage example — gate for config → ready_to_ship:
const gate = await checkPhaseGate(projectId, [0,1,2,3,4,5,6,7,8,9,10,11,15], supabase);
```

---

## Schema Gaps Identified

Two fields are missing from `projects` table and must be added:

1. **`shipping_tracking_number TEXT`** — tracking number entered when `deployment_status`
   advances to `'shipped'`. Format: free-text (FedEx/UPS/USPS/DHL).

2. **`bom_approved BOOLEAN NOT NULL DEFAULT false`** — flag set when ops confirms the BOM in
   Stage 2. Required to unlock Stage 3. Referenced in the `not_started → config` guard.
   (Verify whether this is already tracked via `bom_items` table; if BOM items exist and are
   confirmed, `bom_approved` may be derivable. Storing explicitly is simpler.)

---

## Concrete Example: 6-Court Pro Deployment

**Customer**: Telepark Pickleball Club (6 courts, Pro tier)
**Checklist items instantiated**: 116 (all NULL-applicable templates; no tier-specific steps for Pro)

**Status progression timeline**:
1. Intake form submitted → `project_status = 'intake'`
2. BOM approved, POs placed → `project_status = 'procurement'`
3. Inventory received, packed → `project_status = 'deployment'`, `deployment_status = 'config'`
   - 116 checklist items created
4. Phases 0–11 + 15 completed over ~2 weeks in NJ office
5. Ops marks Ready to Ship → `deployment_status = 'ready_to_ship'`
6. Shipped via FedEx → `deployment_status = 'shipped'`, tracking number recorded
7. Installer arrives at Telepark, begins mounting → `deployment_status = 'installing'`
8. Phase 12 (10 steps) complete: cameras/TVs/iPads/buttons mounted
9. Ops marks QA start → `deployment_status = 'qc'`
10. Phase 13: replay tested, all 6 courts working
11. Phase 14: GCP health monitoring configured, Slack alerts active
12. Ops marks Deployment Complete → `deployment_status = 'completed'`, `go_live_date = 2026-04-15`
    → `project_status = 'financial_close'`

**Overall progress at QC completion**:
- 116 items × 100% = 116/116 = 100%
- Phase breakdown: Phase 0 (8/8), Phase 1 (7/7), ..., Phase 14 (3/3), Phase 15 (6/6)
