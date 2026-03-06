# PodPlay Ops Wizard — Stage 3: Deployment Wizard

**Aspect**: design-wizard-deployment
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/projects/$projectId/deployment`
**Route file**: `src/routes/_auth/projects/$projectId/deployment/index.tsx`
**Component file**: `src/components/wizard/deployment/DeploymentWizard.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `projects`, `deployment_checklist_items`, `deployment_checklist_templates`, `troubleshooting_entries`
**Logic reference**: `final-mega-spec/business-logic/deployment-tracking.md`, `progress-calculation.md`, `troubleshooting.md`, `isp-validation.md`, `cable-estimation.md`, `replay-service-version.md`, `power-calculations.md`

---

## Overview

The Deployment Wizard is Stage 3 of the project lifecycle. It covers the full technical deployment lifecycle: office-side configuration (Phases 0–11), packaging (Phase 15), physical on-site installation (Phase 12), and QA/testing/health monitoring (Phases 13–14).

The wizard is a **checklist-centric page** — not a sequential multi-step form. It presents all 16 phases (0–15) in a scrollable left sidebar navigation with a phase detail panel on the right. The ops person can jump to any phase at any time (non-linear navigation). Each phase shows its checklist steps, contextual warnings, ISP validation (Phase 5), troubleshooting tips, and action buttons.

**Entry**: Project `project_status = 'deployment'`. On entry, the system instantiates the deployment checklist from templates (121 items for standard Pro). Sets `deployment_status = 'config'` automatically.

**Exit**: "Mark Deployment Complete" button advances `deployment_status = 'completed'` and `project_status = 'financial_close'`. Stage 4 (Financials) is then unlocked.

**Two modes**:
1. **Active mode** — `project_status = 'deployment'`: full editing capability (check/uncheck steps, add notes, advance status).
2. **Read-only mode** — `project_status = 'financial_close'` or later: all checkboxes locked, notes read-only, status badges shown without advance buttons. An "Edit" unlock banner appears for ops to re-open if needed.

---

## Route Configuration

**File**: `src/routes/_auth/projects/$projectId/deployment/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/services/projects'
import { getDeploymentChecklistItems } from '@/services/deployment'
import { getTroubleshootingEntries } from '@/services/troubleshooting'
import { DeploymentWizard } from '@/components/wizard/deployment/DeploymentWizard'

export const Route = createFileRoute('/_auth/projects/$projectId/deployment/')({
  loader: async ({ params }) => {
    const [project, checklistItems, troubleshootingEntries] = await Promise.all([
      getProject(params.projectId),
      getDeploymentChecklistItems(params.projectId),
      getTroubleshootingEntries(),  // all 16 entries, cached
    ])
    return { project, checklistItems, troubleshootingEntries }
  },
  component: DeploymentWizardRoute,
  pendingComponent: DeploymentWizardSkeleton,
})

function DeploymentWizardRoute() {
  const { project, checklistItems, troubleshootingEntries } = Route.useLoaderData()
  return (
    <DeploymentWizard
      project={project}
      checklistItems={checklistItems}
      troubleshootingEntries={troubleshootingEntries}
    />
  )
}
```

**Guard**: If `project.project_status === 'intake'` or `'procurement'`, redirect to the appropriate stage route with a toast: "Complete procurement before accessing deployment."

---

## Layout Structure

The deployment wizard uses a **two-column layout** within the Project Shell:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROJECT SHELL HEADER                                                    │
│  [← Back to Dashboard]  Acme Pickleball (6 courts · Pro)  [status pill] │
├───────────────┬─────────────────────────────────────────────────────────┤
│  PHASE        │  PHASE DETAIL                                            │
│  SIDEBAR      │                                                          │
│  (240px)      │  Phase 4: Networking Setup (UniFi)          [12/12 ✓]   │
│               │  ─────────────────────────────────────────────────────   │
│  ● Phase 0    │  [!] WARNING: Do NOT change default network yet...       │
│  ● Phase 1    │                                                          │
│  ● Phase 2    │  ☑ Step 30: Connect UDM to ISP router WAN port          │
│  ▶ Phase 4    │      Note: Used Cat6 patch from rack. ✓                 │
│    (active)   │                                                          │
│  ● Phase 5    │  ☑ Step 31: Power on UDM, wait 3 min for boot           │
│  ...          │                                                          │
│               │  ─────────────────────────────────────────────────────   │
│  [Progress]   │  ⚠ Known Issues (1)                                     │
│  42% overall  │  └── Port 4000 unreachable... [T2] ▶                    │
│               │                                                          │
│  [Status]     │  ─────────────────────────────────────────────────────   │
│  Config       │  [Mark Phase Complete]  [Bulk Complete Phase]           │
└───────────────┴─────────────────────────────────────────────────────────┘
```

### Sidebar Spec

**File**: `src/components/wizard/deployment/DeploymentSidebar.tsx`

**Width**: 240px fixed on desktop; collapses to a `<Sheet>` drawer on mobile (breakpoint < 768px).

**Content**:
1. **Phase List** — 16 items (Phase 0–15), each showing:
   - Phase number + name (truncated if needed)
   - Status icon: `○` incomplete, `◑` partial, `●` complete
   - Step count badge: `X/Y` (e.g., `4/12`)
   - Active phase: highlighted with `bg-muted border-l-2 border-primary`
2. **Overall Progress** — at bottom of sidebar:
   - Progress bar (full width)
   - `X% complete (Y/Z steps)`
3. **Deployment Status Badge** — below progress:
   - Color-coded pill: see §Status Display table below

**Phase ordering in sidebar**:
```
Phase 0:  Pre-Purchase & Planning         (8 steps)
Phase 1:  Pre-Configuration (Office)      (7 steps)
Phase 2:  Unboxing & Labeling             (7 steps)
Phase 3:  Network Rack Assembly           (6 steps)
Phase 4:  Networking Setup (UniFi)        (10–12 steps)
Phase 5:  ISP Router Configuration        (2 steps)
Phase 6:  Camera Configuration            (13 steps)
Phase 7:  DDNS Setup (FreeDNS)            (5 steps)
Phase 8:  Mac Mini Setup                  (8 steps)
Phase 9:  Replay Service Deployment (V1)  (10 steps)
Phase 10: iPad Setup                      (11 steps)
Phase 11: Apple TV Setup                  (5 steps)
Phase 15: Packaging & Shipping            (6 steps)  ← shown after Phase 11, before on-site
Phase 12: Physical Installation           (7–10 steps)
Phase 13: Testing & Verification          (8 steps)
Phase 14: Health Monitoring Setup         (3 steps)
```

**Note on sidebar ordering**: Phase 15 (Packaging & Shipping) is displayed between Phase 11 and Phase 12 in the sidebar because it is office-side work done before shipping. The sidebar sort order overrides the numeric sort for display purposes only. The underlying `sort_order` in `deployment_checklist_items` remains `phase × 100 + step_number`.

---

## Main Panel: Phase Detail View

**File**: `src/components/wizard/deployment/PhaseDetailPanel.tsx`

Each phase renders:

1. **Phase header** — title, step count, phase completion badge
2. **Special panels** (phase-specific, see §Phase-Specific Panels)
3. **Checklist steps** — scrollable list
4. **Known Issues panel** — troubleshooting entries for this phase
5. **Phase action row** — status advance controls (only on relevant phases)

### Phase Header

```tsx
<div className="flex items-center justify-between border-b pb-4 mb-4">
  <div>
    <h2 className="text-lg font-semibold">
      Phase {phase.number}: {phase.name}
    </h2>
    <p className="text-sm text-muted-foreground">
      {completedCount}/{totalCount} steps complete
    </p>
  </div>
  <div className="flex items-center gap-2">
    <Progress value={phasePct} className="w-24 h-2" />
    {isPhaseComplete && <CheckCircle className="text-green-500 size-5" />}
  </div>
</div>
```

---

## Checklist Step Component

**File**: `src/components/wizard/deployment/ChecklistStep.tsx`

Each step renders as a row:

```tsx
interface ChecklistStepProps {
  item: DeploymentChecklistItem
  project: Project
  isReadOnly: boolean
  onToggle: (itemId: string, completed: boolean) => void
  onNoteChange: (itemId: string, note: string) => void
}
```

### Step Row Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [☐] Step 45: Forward port 4000 TCP/UDP on UDM                   │
│      Description: In UniFi → Settings → Firewall & Security →  │
│      Port Forwarding → Add → Port: 4000, Protocol: TCP/UDP,    │
│      Forward IP: 192.168.32.100 (Mac Mini on REPLAY VLAN)       │
│                                                                  │
│ [!] WARNING: Port 4000 is critical — all replay service...      │
│                                                                  │
│ [ Add note... ]                        completed_at: —          │
└─────────────────────────────────────────────────────────────────┘
```

### Step Row Fields

| Element | Description |
|---------|-------------|
| Checkbox | `<Checkbox>` from shadcn/radix. Checked = `is_completed = true`. Disabled in read-only mode or if `deployment_status` is past this phase group. |
| Step number + title | `Step {step_number}: {title}` in bold. Clicking the title row expands the description. |
| Description | Rendered with `renderStepDescription(description, project)` — live token substitution. Tokens that render as `(not yet set)` show in orange text. |
| Warning banners | Each warning in `item.warnings[]` renders as a yellow alert box above the description. Critical warnings (from the 8 hardcoded ones) have a red left border. |
| Notes textarea | `<Textarea placeholder="Add note...">` — always editable regardless of completion state. Auto-saves on blur (300ms debounce). Shows `completed_at` timestamp when completed. |
| Completion timestamp | When `is_completed = true`, shows `Completed {relative time}` in gray below the step. |

### Warning Display Logic

```tsx
// Warning severity classification
function getWarningSeverity(warning: string, item: DeploymentChecklistItem): 'critical' | 'warning' {
  const criticalSteps = [4, 45, 73, 86, 98, 29, '108a']
  // criticalSteps = steps with CRITICAL warnings per deployment-tracking.md §Warning Propagation
  // Phase 0 step 4 (Starlink), Phase 4 step 45 (port 4000), Phase 8 step 73 (.DS_Store),
  // Phase 10 step 86 (iPad enrollment order), Phase 10 step 98 (no shutdown),
  // Phase 3 step 29 (Mac Mini breathing room), Phase 12 step 108a (App Lock off for Flic)
  return criticalSteps.includes(item.step_number) ? 'critical' : 'warning'
}
```

Warning banner styles:
- `critical`: `border-l-4 border-red-500 bg-red-50 text-red-900`
- `warning`: `border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900`

---

## Token Fields — Inline Edit Panel

When a checklist step description renders a token as `(not yet set)` (orange text), an inline edit prompt appears below the step:

```
⚠ Project field "DDNS Subdomain" is not yet set.
[Set it now] → opens a popover with the field input
```

**File**: `src/components/wizard/deployment/TokenFieldPopover.tsx`

Clicking "Set it now" opens a `<Popover>` with:

| Token | Field label | Input type | Validation |
|-------|-------------|-----------|------------|
| `{{DDNS_SUBDOMAIN}}` | DDNS Subdomain | text | Pattern: `^[a-z0-9-]+$`, max 63 chars |
| `{{UNIFI_SITE_NAME}}` | UniFi Site Name | text | Required, max 64 chars |
| `{{MAC_MINI_USERNAME}}` | Mac Mini Username | text | Pattern: `^[a-z][a-z0-9_-]*$`, max 32 chars |
| `{{LOCATION_ID}}` | Location ID (from Agustin) | text | Required, max 64 chars |

Saving calls `updateProjectField(projectId, field, value)` which updates the `projects` row. The description immediately re-renders with the new value.

---

## Phase-Specific Panels

### Phase 0: Pre-Purchase & Planning — ISP Summary Panel

Shown at top of Phase 0, before the checklist steps:

**File**: `src/components/wizard/deployment/IspSummaryPanel.tsx`

Displays project's ISP details in a read-only summary card (filled during Intake Stage 1):

```
┌─────────────────────────────────────────────────────────┐
│ ISP Configuration Summary                               │
│ Type: Fiber                    Provider: Verizon Fios   │
│ Upload: 300 Mbps               Download: 300 Mbps       │
│ Required for 6 courts (fiber): 150/150 Mbps  ✓ Met     │
│ Country: US                    24/7 Operation: No       │
└─────────────────────────────────────────────────────────┘
```

If `isp_type === 'starlink'`: red banner "Starlink is NOT compatible. Must resolve before deployment."
If `isp_type IN ('fiveg', 'other')`: yellow banner "CGNAT risk — verify port forwarding with ISP."
If `is_24_7 && tier in ('autonomous', 'autonomous_plus') && !backup_isp_provider`: yellow banner "Autonomous 24/7: backup ISP required. Configure WAN2 on UDM."
If `country === 'PH'`: yellow banner "Philippines: business plan + static IP mandatory. Verify with ISP."

### Phase 5: ISP Router Configuration — Config Method Panel

Shown at top of Phase 5, before step checklist:

**File**: `src/components/wizard/deployment/IspConfigMethodPanel.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ ISP Router Configuration Method                         │
│                                                         │
│ ● 1. Static IP (Best)                                   │
│   Order static IP from ISP (~$10–20/mo).                │
│   In UniFi: Settings → Internet → WAN1 → Advanced →    │
│   Manual → enter static IP details.                     │
│                                                         │
│ ○ 2. DMZ                                                │
│   Place UDM WAN IP in ISP router DMZ.                   │
│                                                         │
│ ○ 3. Port Forward (Last Resort)                         │
│   Forward port 4000 TCP/UDP from ISP router to UDM IP.  │
│   ⚠ CGNAT risk — may not work on all ISPs.             │
└─────────────────────────────────────────────────────────┘
```

**Fields**:
- Radio group bound to `project.isp_config_method` (`static_ip` / `dmz` / `port_forward`)
- Changing the selection auto-saves via `updateProjectField(projectId, 'isp_config_method', value)`
- If `port_forward` selected: show yellow warning "Last resort — confirm ISP supports port forwarding and does not use CGNAT."
- If `country === 'PH'` and method is not `static_ip`: red warning "Philippines requires static IP — business plan mandatory."

**Supported ISPs autocomplete** (shown in a tips box):
Verizon Fios, Optimum, Spectrum, Google Fiber, AT&T Fiber, Comcast/Xfinity, Cox, Frontier

### Phase 9: Replay Service — Version Panel

Shown at top of Phase 9, before step checklist:

**File**: `src/components/wizard/deployment/ReplayServiceVersionPanel.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Replay Service Version                                  │
│                                                         │
│ ● V1 (Current — UDP transport)                         │
│   Deploy from NJ office Mac Mini via SFTP.             │
│   Known issue: pixelation under packet loss (UDP).     │
│                                                         │
│ ○ V2 (Coming April 2026 — TCP transport)               │
│   Deploy from GitHub + configure via admin dashboard.  │
│   Eliminates pixelation. Not yet available.            │
│   [Request V2 early access]                            │
└─────────────────────────────────────────────────────────┘
```

**Fields**:
- Radio bound to `project.replay_service_version` (`v1` / `v2`)
- V2 option disabled with tooltip "V2 not yet released (expected April 2026)" — ops can select but the checklist steps remain V1 until V2 templates exist.
- If V1 selected: show the 10-step V1 deploy checklist.
- If V2 selected: show informational note "V2 deployment checklist is pending the V2 service release (targeted April 2026). V1 steps are shown until V2 templates are seeded."

### Phase 0, Step 3: Court Count / Cable Estimation Panel

Shown inline below Step 3 (Determine court count) as an expandable info box:

**File**: `src/components/wizard/deployment/CableEstimationPanel.tsx`

Expands on click to show cable estimation for this project:

```
Court Count: 6 courts (Pro tier)
─────────────────────────────────────
Cat6 Drops Required:
  Courts: 6 × 3 drops = 18 drops
  Doors: 0 doors × 1 drop = 0 drops
  Security cameras: 0 × 1 drop = 0 drops
  Total drops: 18

Recommended cable (allow 20% slack):
  Estimated total: [user enters avg court-to-rack distance: ___ft]
  Formula: courts × avg_distance × 3 + doors × avg_distance + cameras × avg_distance
─────────────────────────────────────
Switch size: 24-port (6 courts × 3 ports = 18 PoE ports needed)
SSD size: 2TB (6 courts, Pro)
Rack size: 9U
```

Fields for cable estimation (editable, stored in `project.internal_notes` JSON or dedicated fields):
- Average court-to-rack distance (feet): number input
- Average door-to-rack distance (feet): number input (shown if `tier` includes access control)
- Average camera-to-rack distance (feet): number input (shown if `tier === 'autonomous_plus'`)

The total cable footage is calculated live and displayed as a recommendation, not stored.

### Phase 4, Step 10/11: VLAN Panel (Autonomous tiers only)

Shown as an informational panel before steps 30–45 for `autonomous` and `autonomous_plus` tiers:

**File**: `src/components/wizard/deployment/VlanReferencePanel.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ VLAN Architecture Reference                             │
│ VLAN 30 — Default (192.168.30.0/24) — Management       │
│ VLAN 32 — REPLAY (192.168.32.0/24) — Mac Mini + cameras│
│   Mac Mini fixed IP: 192.168.32.100                    │
│ VLAN 31 — SURVEILLANCE (192.168.31.0/24) [Autonomous+] │
│ VLAN 33 — ACCESS CONTROL (192.168.33.0/24) [Autonomous]│
│                                                         │
│ Port 4000: Replay service — MUST be forwarded          │
└─────────────────────────────────────────────────────────┘
```

Panel is always shown for all tiers as reference info; VLAN 31 row is grayed out for non-autonomous_plus, VLAN 33 row is grayed out for non-autonomous.

### Phase 12, Step 108a: App Lock Warning Banner

Rendered as a prominent red warning block above Step 108a (Flic button pairing):

```
🔴 CRITICAL: App Lock must be OFF before pairing Flic buttons.
Go to Mosyle → select the location → turn off App Lock.
Exit Guided Access on the iPad first.
Re-enable App Lock when pairing is complete.
```

This is a static inline banner (not from `item.warnings` — rendered as a hardcoded component override for step_number 108 in Phase 12).

---

## Known Issues Panel (Troubleshooting)

**File**: `src/components/wizard/deployment/KnownIssuesPanel.tsx`

Rendered at the bottom of each phase detail panel, below the checklist steps.

```tsx
interface KnownIssuesPanelProps {
  entries: TroubleshootingEntry[]
  project: Project
  phase: number
}
```

**Visibility**: Hidden if `entries.filter(e => e.phases.includes(phase)).length === 0`.

**Layout**:
```
─────────────────────────────────────────────────────────
⚠ Known Issues (3)                                      ▼

  [T2] [●] iPad loses connection intermittently / PoE... ▶
  [T2] [●] MDM commands sent from Mosyle never arrive... ▶
  [T2] [●] iPads enrolled in wrong court order...        ▶
```

**Collapsed entry** (one line):
- Tier badge: `T1` (green bg), `T2` (yellow bg), `T3` (red bg)
- Severity icon: `●` red = critical, `⚠` yellow = warning, `ℹ` gray = info
- Symptom text (truncated to one line)
- Chevron expand icon

**Expanded entry** (below the header):
- Full solution text rendered as markdown (supports `backtick` code inline, line breaks)
- `renderSolution(entry.solution, project)` — live token substitution
- Tokens show orange `(not yet set)` if unset

**Severity → border color**:
- `critical` → `border-l-4 border-red-500`
- `warning` → `border-l-4 border-yellow-500`
- `info` → `border-l-4 border-gray-300`

**Phase → entries mapping** (from logic-troubleshooting.md):
| Phase | Entry Count | Entries |
|-------|-------------|---------|
| 0 | 0 | — |
| 1 | 0 | — |
| 2 | 0 | — |
| 3 | 1 | Mac Mini overheating |
| 4 | 1 | Port 4000 unreachable |
| 5 | 1 | Port 4000 unreachable |
| 6 | 1 | Camera image warped |
| 7 | 1 | DDNS not updating |
| 8 | 2 | Mac Mini black screen, .DS_Store |
| 9 | 3 | Rename service, .DS_Store, pixelation |
| 10 | 4 | PoE unstable, wrong club, MDM commands, enrollment order |
| 11 | 1 | Wrong club name |
| 12 | 4 | PoE unstable, Flic App Lock, Flic won't pair, dead battery |
| 13 | 9 | Mac Mini crash, rename service, camera warped, DDNS, port 4000, pixelated, score not updating, Flic pairing, dead battery |
| 14 | 1 | Mac Mini crash (SSH restart) |
| 15 | 0 | — |

---

## Deployment Status Advancement Controls

**File**: `src/components/wizard/deployment/StatusAdvancePanel.tsx`

This sticky bar appears at the bottom of the phase detail panel. It shows different content based on `deployment_status` and which phase is currently active.

### Status Badge Display

| `deployment_status` | Badge text | Badge color |
|---------------------|-----------|-------------|
| `not_started` | Not Started | gray |
| `config` | Configuring | blue |
| `ready_to_ship` | Ready to Ship | yellow |
| `shipped` | In Transit | purple |
| `installing` | Installing | orange |
| `qc` | QA & Testing | indigo |
| `completed` | Complete | green |

### Advance Button Placement

The advance button appears in the top-right of the page header (sticky), not inside a specific phase panel. It is always visible regardless of which phase is being viewed.

**Current status → Button label → Guard**:

```
config         → [Mark Ready to Ship]   → Phases 0–11 + 15 all complete (or override modal)
ready_to_ship  → [Mark as Shipped]      → No checklist gate (opens tracking number modal)
shipped        → [Mark as Installing]   → Opens installation start date modal
installing     → [Start QA]             → Phase 12 all complete (or override modal)
qc             → [Mark Deployment Complete] → Phases 13+14 all complete + go-live date modal
completed      → [View Financials →]    → Navigates to /projects/$projectId/financials
```

---

## Modal Specifications

### Modal 1: Mark Ready to Ship

**Trigger**: "Mark Ready to Ship" button when `deployment_status === 'config'`

**File**: `src/components/wizard/deployment/modals/ReadyToShipModal.tsx`

**Guard check** (before opening modal):
```typescript
const gate = await checkPhaseGate(projectId, [0,1,2,3,4,5,6,7,8,9,10,11,15], supabase)
```

**Case A: All phases complete** — Modal content:
```
Title: "Mark as Ready to Ship?"
Body: "All office configuration phases are complete.
       Phase 15 (Packaging & Shipping) is verified.
       The package is ready for carrier pickup."
Buttons: [Cancel] [Confirm — Mark Ready to Ship]
```

**Case B: Incomplete phases** — Modal content:
```
Title: "Incomplete Phases"
Body: "The following phases have incomplete steps:
       • Phase 4: Networking Setup (3 steps remaining)
       • Phase 9: Replay Service (2 steps remaining)
       • Phase 15: Packaging (1 step remaining)

       You can proceed with incomplete steps — make sure
       these are resolved before the package ships."
Buttons: [Go Back] [Proceed Anyway]
```

**On confirm**:
```typescript
await supabase
  .from('projects')
  .update({ deployment_status: 'ready_to_ship' })
  .eq('id', projectId)
```
Invalidate project query. Show toast "Marked as Ready to Ship".

---

### Modal 2: Mark as Shipped

**Trigger**: "Mark as Shipped" button when `deployment_status === 'ready_to_ship'`

**File**: `src/components/wizard/deployment/modals/MarkShippedModal.tsx`

**Content**:
```
Title: "Mark Package as Shipped"
Fields:
  - Tracking Number (text, required): placeholder "e.g. 1Z999AA10123456784"
  - Carrier (select, optional): FedEx | UPS | USPS | DHL | Other
  - Ship Date (date, default today)
  - Notes (textarea, optional): e.g. "2 boxes shipped separately"
Buttons: [Cancel] [Confirm — Mark as Shipped]
```

**Zod schema**:
```typescript
const markShippedSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number required').max(100),
  carrier: z.enum(['fedex', 'ups', 'usps', 'dhl', 'other']).optional(),
  ship_date: z.string(),  // ISO date string
  notes: z.string().max(500).optional(),
})
```

**On confirm**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'shipped',
    shipping_tracking_number: data.tracking_number,
    // carrier + ship_date + shipping notes stored in internal_notes JSON
  })
  .eq('id', projectId)
```
Invalidate project query. Show toast "Marked as Shipped — tracking: {tracking_number}".

---

### Modal 3: Mark as Installing

**Trigger**: "Mark as Installing" button when `deployment_status === 'shipped'`

**File**: `src/components/wizard/deployment/modals/MarkInstallingModal.tsx`

**Content**:
```
Title: "Installer On-Site — Begin Installation"
Fields:
  - Installation Start Date (date, required, default today)
  - Installer Name (text, optional, autocomplete from installers table):
      placeholder "e.g. Nico Hernandez"
  - Notes (textarea, optional): e.g. "Arriving 9 AM, venue contact is John"
Buttons: [Cancel] [Confirm — Start Installation]
```

**Zod schema**:
```typescript
const markInstallingSchema = z.object({
  installation_start_date: z.string().min(1, 'Start date required'),
  installer_name: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})
```

**On confirm**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'installing',
    installation_start_date: data.installation_start_date,
    // installer_name stored in internal_notes
  })
  .eq('id', projectId)
```
Invalidate project query. Show toast "Installation started — Phase 12 unlocked."

---

### Modal 4: Start QA

**Trigger**: "Start QA" button when `deployment_status === 'installing'`

**File**: `src/components/wizard/deployment/modals/StartQAModal.tsx`

**Guard check**: Phase 12 completion gate:
```typescript
const gate = await checkPhaseGate(projectId, [12], supabase)
```

**Case A: Phase 12 complete** — Modal content:
```
Title: "Physical Installation Complete — Start QA?"
Body: "All Phase 12 steps are verified.
       Cameras, TVs, iPads, and buttons are mounted.
       Ready to begin testing and verification (Phases 13–14)."
Fields:
  - Installation End Date (date, required, default today)
Buttons: [Cancel] [Confirm — Start QA]
```

**Case B: Phase 12 incomplete** — same override pattern as Modal 1.

**On confirm**:
```typescript
await supabase
  .from('projects')
  .update({
    deployment_status: 'qc',
    installation_end_date: data.installation_end_date,
  })
  .eq('id', projectId)
```

---

### Modal 5: Mark Deployment Complete

**Trigger**: "Mark Deployment Complete" button when `deployment_status === 'qc'`

**File**: `src/components/wizard/deployment/modals/CompleteDeploymentModal.tsx`

**Guard checks**: Phases 13 + 14 completion gate:
```typescript
const gate = await checkPhaseGate(projectId, [13, 14], supabase)
```

**Case A: All QA complete** — Modal content:
```
Title: "Mark Deployment Complete"
Body: "All testing and health monitoring steps are verified.
       The system is ready for go-live."
Fields:
  - Go-Live Date (date, required, default today)
  - Final Notes (textarea, optional): e.g. "Client trained on iPad kiosk usage"
Buttons: [Cancel] [Confirm — Go Live!]
```

**Case B: QA incomplete** — same override pattern.

**On confirm**:
```typescript
// Uses RPC to atomically set both fields
await supabase.rpc('complete_deployment', {
  p_project_id: projectId,
  p_go_live_date: data.go_live_date,
})
// RPC SQL:
// UPDATE projects SET
//   deployment_status = 'completed',
//   project_status = 'financial_close',
//   go_live_date = p_go_live_date
// WHERE id = p_project_id
```
Invalidate project query. Show success toast "Deployment complete! Stage 4 (Financials) is now unlocked." Then navigate to `/projects/$projectId/financials`.

---

### Modal 6: Rollback Status

**Trigger**: Rollback button in a `<DropdownMenu>` next to the advance button (accessible via "..." menu).

**File**: `src/components/wizard/deployment/modals/RollbackStatusModal.tsx`

**Allowed rollbacks** (from logic-deployment-tracking.md):
```
ready_to_ship → config
shipped        → ready_to_ship
installing     → shipped
qc             → installing
completed      → qc  (only if project_status not yet 'financial_close')
```

**Content**:
```
Title: "Roll Back Deployment Status"
Body: "Rolling back from '{current}' to '{target}' will allow editing
       steps in the previous stage. This should only be used if work
       needs to be redone."
Fields:
  - Reason (textarea, required, max 500 chars)
Buttons: [Cancel] [Confirm Rollback]
```

**On confirm**:
```typescript
await supabase
  .from('projects')
  .update({ deployment_status: targetStatus })
  .eq('id', projectId)
// Add reason to internal_notes
```

---

### Modal 7: Bulk Complete Phase

**Trigger**: "Bulk Complete Phase" button (secondary, shown at bottom of each phase).

**File**: `src/components/wizard/deployment/modals/BulkCompletePhaseModal.tsx`

```
Title: "Mark All Phase {N} Steps Complete?"
Body: "This will mark all {X} incomplete steps in Phase {N} as complete.
       Use this if you completed the phase but didn't track each step individually."
Buttons: [Cancel] [Mark All Complete]
```

**On confirm**:
```typescript
await supabase
  .from('deployment_checklist_items')
  .update({
    is_completed: true,
    completed_at: new Date().toISOString(),
  })
  .eq('project_id', projectId)
  .eq('phase', phase)
  .eq('is_completed', false)
```
Invalidate checklist items query. Show toast "{X} steps marked complete."

---

## Checklist Item Operations (Service Layer)

**File**: `src/services/deployment.ts`

```typescript
// Fetch all checklist items for a project, ordered by sort_order
export async function getDeploymentChecklistItems(
  projectId: string
): Promise<DeploymentChecklistItem[]> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

// Toggle a single step complete/incomplete
export async function toggleChecklistItem(
  itemId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
  if (error) throw error
}

// Update note for a step (debounced in UI)
export async function updateChecklistItemNote(
  itemId: string,
  note: string
): Promise<void> {
  const { error } = await supabase
    .from('deployment_checklist_items')
    .update({ notes: note })
    .eq('id', itemId)
  if (error) throw error
}

// Bulk complete all incomplete items in a phase
export async function bulkCompletePhase(
  projectId: string,
  phase: number
): Promise<number> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('phase', phase)
    .eq('is_completed', false)
    .select('id')
  if (error) throw error
  return data?.length ?? 0
}

// Check phase gate before deployment_status advance
export async function checkPhaseGate(
  projectId: string,
  phases: number[]
): Promise<{ passed: boolean; blockers: { phase: number; phaseName: string; incomplete: number }[] }> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .select('phase, is_completed')
    .eq('project_id', projectId)
    .in('phase', phases)
  if (error) throw error

  const PHASE_NAMES: Record<number, string> = {
    0: 'Pre-Purchase & Planning',
    1: 'Pre-Configuration (Office)',
    2: 'Unboxing & Labeling',
    3: 'Network Rack Assembly',
    4: 'Networking Setup (UniFi)',
    5: 'ISP Router Configuration',
    6: 'Camera Configuration',
    7: 'DDNS Setup (FreeDNS)',
    8: 'Mac Mini Setup',
    9: 'Replay Service Deployment (V1)',
    10: 'iPad Setup',
    11: 'Apple TV Setup',
    12: 'Physical Installation (On-Site)',
    13: 'Testing & Verification',
    14: 'Health Monitoring Setup',
    15: 'Packaging & Shipping',
  }

  const blockers: { phase: number; phaseName: string; incomplete: number }[] = []
  for (const phase of phases) {
    const phaseItems = data.filter(i => i.phase === phase)
    const incomplete = phaseItems.filter(i => !i.is_completed).length
    if (incomplete > 0) {
      blockers.push({ phase, phaseName: PHASE_NAMES[phase], incomplete })
    }
  }
  return { passed: blockers.length === 0, blockers }
}

// Instantiate checklist from templates (called on project_status → 'deployment')
export async function instantiateDeploymentChecklist(
  projectId: string,
  project: Project
): Promise<void> {
  // Idempotency check
  const { count } = await supabase
    .from('deployment_checklist_items')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
  if ((count ?? 0) > 0) return

  // Fetch applicable templates
  const { data: templates, error } = await supabase
    .from('deployment_checklist_templates')
    .select('*')
    .or(`applicable_tiers.is.null,applicable_tiers.cs.{${project.tier}}`)
    .eq('is_v2_only', false)  // V2 templates not yet available
    .order('sort_order')
  if (error) throw error

  // Token map
  const tokenMap: Record<string, string> = {
    CUSTOMER_NAME:     project.customer_name,
    COURT_COUNT:       String(project.court_count),
    DDNS_SUBDOMAIN:    project.ddns_subdomain ?? '',
    UNIFI_SITE_NAME:   project.unifi_site_name ?? '',
    MAC_MINI_USERNAME: project.mac_mini_username ?? '',
    LOCATION_ID:       project.location_id ?? '',
  }

  function replaceTokens(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => tokenMap[key] ?? `{{${key}}}`)
  }

  const items = templates.map(t => ({
    project_id:    projectId,
    template_id:   t.id,
    phase:         t.phase,
    step_number:   t.step_number,
    sort_order:    t.sort_order,
    title:         t.title,
    description:   replaceTokens(t.description),
    warnings:      t.warnings,
    is_completed:  false,
    completed_at:  null,
    notes:         null,
  }))

  const { error: insertError } = await supabase
    .from('deployment_checklist_items')
    .insert(items)
  if (insertError) throw insertError
}
```

---

## Troubleshooting Service

**File**: `src/services/troubleshooting.ts`

```typescript
// Fetch all entries (cached — these never change)
export async function getTroubleshootingEntries(): Promise<TroubleshootingEntry[]> {
  const { data, error } = await supabase
    .from('troubleshooting_entries')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

// Filter to entries for a specific phase (client-side after full fetch)
export function getTroubleshootingForPhase(
  entries: TroubleshootingEntry[],
  phase: number
): TroubleshootingEntry[] {
  return entries.filter(e => e.phases.includes(phase))
}
```

---

## Token Rendering Utility

**File**: `src/utils/tokenRendering.ts`

```typescript
export function renderStepDescription(
  description: string,
  project: Project
): { rendered: string; hasUnsetTokens: boolean } {
  const tokenMap: Record<string, string | null> = {
    CUSTOMER_NAME:     project.customer_name,
    COURT_COUNT:       String(project.court_count),
    DDNS_SUBDOMAIN:    project.ddns_subdomain ?? null,
    UNIFI_SITE_NAME:   project.unifi_site_name ?? null,
    MAC_MINI_USERNAME: project.mac_mini_username ?? null,
    LOCATION_ID:       project.location_id ?? null,
  }

  let hasUnsetTokens = false

  const rendered = description.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = tokenMap[key]
    if (value === null || value === '') {
      hasUnsetTokens = true
      return `(not yet set)`  // UI renders this in orange
    }
    return value ?? `{{${key}}}`
  })

  return { rendered, hasUnsetTokens }
}

// Token → project field name mapping (for inline edit prompts)
export const TOKEN_TO_FIELD: Record<string, {
  fieldName: keyof Project
  label: string
  placeholder: string
  validation: z.ZodString
}> = {
  DDNS_SUBDOMAIN:    { fieldName: 'ddns_subdomain',    label: 'DDNS Subdomain',          placeholder: 'e.g. acmepickleball',    validation: z.string().regex(/^[a-z0-9-]+$/).max(63)  },
  UNIFI_SITE_NAME:   { fieldName: 'unifi_site_name',   label: 'UniFi Site Name',          placeholder: 'e.g. Acme Pickleball',   validation: z.string().max(64)                         },
  MAC_MINI_USERNAME: { fieldName: 'mac_mini_username', label: 'Mac Mini Username',        placeholder: 'e.g. acmemacmini',       validation: z.string().regex(/^[a-z][a-z0-9_-]*$/).max(32) },
  LOCATION_ID:       { fieldName: 'location_id',       label: 'Location ID (from Agustin)', placeholder: 'e.g. acme-jc',         validation: z.string().max(64)                         },
}
```

---

## Progress Display

**File**: `src/components/wizard/deployment/DeploymentProgress.tsx`

```typescript
// Overall progress — used in sidebar + project card
export function calculateOverallProgress(
  items: DeploymentChecklistItem[]
): { completed: number; total: number; pct: number } {
  if (items.length === 0) return { completed: 0, total: 0, pct: 0 }
  const completed = items.filter(i => i.is_completed).length
  return { completed, total: items.length, pct: Math.round((completed / items.length) * 100) }
}

// Per-phase progress — used in sidebar phase items + phase header
export function calculatePhaseProgress(
  items: DeploymentChecklistItem[],
  phase: number
): { completed: number; total: number; pct: number } {
  const phaseItems = items.filter(i => i.phase === phase)
  if (phaseItems.length === 0) return { completed: 0, total: 0, pct: 0 }
  const completed = phaseItems.filter(i => i.is_completed).length
  return { completed, total: phaseItems.length, pct: Math.round((completed / phaseItems.length) * 100) }
}

// Phase completion icon: ○ = no steps done, ◑ = partial, ● = all done
export function getPhaseStatusIcon(pct: number): '○' | '◑' | '●' {
  if (pct === 0) return '○'
  if (pct === 100) return '●'
  return '◑'
}
```

---

## Read-Only Mode (Post-Deployment)

When `project.project_status` is `'financial_close'` or later:

1. All `<Checkbox>` components render as `disabled={true}` (visual only, cannot toggle)
2. Notes textareas render as `readOnly` `<p>` tags (not inputs)
3. All advance buttons are hidden
4. "Bulk Complete Phase" buttons are hidden
5. A sticky banner at top of page: `"Deployment is complete. This view is read-only. [Unlock to Edit]"`
6. "Unlock to Edit" opens a confirmation modal: "Re-opening deployment for editing will allow changes. Are you sure?" — on confirm, sets `project_status` back to `'deployment'` (rare op, for emergencies).

---

## Tier-Conditional Rendering Summary

| UI Element | Shown for | Hidden for |
|-----------|-----------|-----------|
| VLAN 31 row (Surveillance) | `autonomous_plus` | `pro`, `pbk`, `autonomous` |
| VLAN 33 row (Access Control) | `autonomous`, `autonomous_plus` | `pro`, `pbk` |
| Phase 4 steps 10–11 (VLAN creation) | Per tier filter from checklist | — |
| Phase 12 steps 8–10 (Kisi, door readers, locks) | `autonomous`, `autonomous_plus` | `pro`, `pbk` |
| Dual ISP panel | `autonomous`/`autonomous_plus` + `is_24_7 = true` | All others |
| Cable estimation (door distance field) | `autonomous`, `autonomous_plus` | `pro`, `pbk` |
| Cable estimation (camera distance field) | `autonomous_plus` | All others |

---

## State Management (React Query)

```typescript
// Key definitions
const CHECKLIST_QUERY_KEY = (projectId: string) =>
  ['deployment_checklist', projectId] as const

const TROUBLESHOOTING_QUERY_KEY = ['troubleshooting_entries'] as const

// Checklist query — fresh for this project
const { data: checklistItems, invalidate } = useQuery({
  queryKey: CHECKLIST_QUERY_KEY(projectId),
  queryFn: () => getDeploymentChecklistItems(projectId),
  staleTime: 30_000,       // 30 seconds — checklist changes infrequently
})

// Troubleshooting entries — cached globally, never stale
const { data: troubleshootingEntries } = useQuery({
  queryKey: TROUBLESHOOTING_QUERY_KEY,
  queryFn: getTroubleshootingEntries,
  staleTime: Infinity,     // Static seed data — never changes at runtime
})

// Optimistic checkbox toggle
const toggleMutation = useMutation({
  mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
    toggleChecklistItem(itemId, completed),
  onMutate: async ({ itemId, completed }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: CHECKLIST_QUERY_KEY(projectId) })
    // Snapshot previous value
    const previous = queryClient.getQueryData(CHECKLIST_QUERY_KEY(projectId))
    // Optimistic update
    queryClient.setQueryData(CHECKLIST_QUERY_KEY(projectId), (old: DeploymentChecklistItem[]) =>
      old.map(item =>
        item.id === itemId
          ? { ...item, is_completed: completed, completed_at: completed ? new Date().toISOString() : null }
          : item
      )
    )
    return { previous }
  },
  onError: (_err, _vars, context) => {
    // Rollback optimistic update on error
    queryClient.setQueryData(CHECKLIST_QUERY_KEY(projectId), context?.previous)
    toast.error('Failed to save — please try again.')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: CHECKLIST_QUERY_KEY(projectId) })
  },
})
```

---

## Component File Structure

```
src/
├── routes/
│   └── _auth/
│       └── projects/
│           └── $projectId/
│               └── deployment/
│                   └── index.tsx              ← route loader + component mount
│
├── components/
│   └── wizard/
│       └── deployment/
│           ├── DeploymentWizard.tsx           ← root component, layout shell
│           ├── DeploymentSidebar.tsx          ← phase list, progress, status badge
│           ├── PhaseDetailPanel.tsx           ← phase header + steps + known issues + actions
│           ├── ChecklistStep.tsx              ← single step row (checkbox, title, desc, warnings, notes)
│           ├── KnownIssuesPanel.tsx           ← troubleshooting entries for a phase
│           ├── StatusAdvancePanel.tsx         ← advance/rollback buttons + status badge
│           ├── TokenFieldPopover.tsx          ← inline edit for unset project token fields
│           ├── CableEstimationPanel.tsx       ← Phase 0: court count → cable estimate
│           ├── VlanReferencePanel.tsx         ← Phase 4: VLAN architecture reference card
│           ├── IspSummaryPanel.tsx            ← Phase 0: ISP details summary (read from intake)
│           ├── IspConfigMethodPanel.tsx       ← Phase 5: config method radio + validation
│           ├── ReplayServiceVersionPanel.tsx  ← Phase 9: V1/V2 selector
│           └── modals/
│               ├── ReadyToShipModal.tsx
│               ├── MarkShippedModal.tsx
│               ├── MarkInstallingModal.tsx
│               ├── StartQAModal.tsx
│               ├── CompleteDeploymentModal.tsx
│               ├── RollbackStatusModal.tsx
│               └── BulkCompletePhaseModal.tsx
│
├── services/
│   ├── deployment.ts                          ← checklist CRUD + status advance + instantiation
│   └── troubleshooting.ts                     ← fetch + filter troubleshooting entries
│
└── utils/
    └── tokenRendering.ts                      ← renderStepDescription + TOKEN_TO_FIELD map
```

---

## Empty States

| Scenario | Display |
|----------|---------|
| Checklist not yet instantiated (project just entered deployment) | Spinner with "Setting up your deployment checklist..." — `instantiateDeploymentChecklist()` runs on mount |
| Phase has 0 steps (should not happen — all phases have steps) | "No steps found for this phase. Contact support." |
| No troubleshooting entries for a phase | Known Issues panel hidden entirely |
| Project `project_status` still `'procurement'` | "Procurement must be complete before deployment. [Go to Procurement →]" |

---

## Loading States

- **Initial page load**: Skeleton UI with phase sidebar stubs + step row placeholders (3 rows per phase visible)
- **Checkbox toggle**: Optimistic update (instant visual feedback). Spinner on the checkbox while mutation is in flight.
- **Note save**: No visual indicator (auto-save). On error: red inline text "Failed to save note."
- **Status advance modal confirm**: Button shows spinner. Modal stays open until success.
- **Bulk complete**: Spinner overlay on the phase panel. Toast on completion.

---

## Error States

- **Checklist fetch fails**: Red banner "Failed to load deployment checklist. [Retry]". Retry calls `getDeploymentChecklistItems()`.
- **Checkbox toggle fails**: Toast error + optimistic rollback (step returns to previous state).
- **Status advance fails**: Modal stays open with inline error: "Failed to update status — {error.message}. Please try again."
- **Checklist instantiation fails**: Red banner "Failed to set up checklist. [Retry]" — retry calls `instantiateDeploymentChecklist()`.

---

## Concrete Example: 6-Court Pro Deployment

**Project**: Telepark Pickleball Club
**Tier**: Pro
**Courts**: 6
**Checklist items**: 116 (all NULL-applicable rows, no access control steps)

**Phase sidebar at 50% complete**:
```
● Phase 0: Pre-Purchase & Planning    [8/8]
● Phase 1: Pre-Configuration          [7/7]
● Phase 2: Unboxing & Labeling        [7/7]
● Phase 3: Network Rack Assembly      [6/6]
◑ Phase 4: Networking Setup           [6/10]   ← active phase
○ Phase 5: ISP Router Config          [0/2]
○ Phase 6: Camera Configuration       [0/13]
...
Overall: 42% (48/116 steps)
Status: [Configuring]
```

**Phase 4 detail — active step** (Step 45):
```
[ ] Step 45: Forward port 4000 TCP/UDP on UDM to 192.168.32.100
    Description: In UniFi → Settings → Firewall & Security →
    Port Forwarding → Add rule → Port: 4000, Protocol: TCP/UDP,
    Forward IP: 192.168.32.100 (Mac Mini on REPLAY VLAN)

    [!] WARNING: Port 4000 is critical — all replay service
    communication flows through this port. Verify from cellular.

    [ Add a note... ]
```

**Known Issues for Phase 4**:
```
⚠ Known Issues (1)
└── [T2] [●] Health check at http://telepark.podplaydns.com:4000/health
             times out from cellular network ▶
```

**Token unset example** (Phase 7, Step 59):
```
[ ] Step 59: Create FreeDNS subdomain for (not yet set).podplaydns.com
             ⚠ Project field "DDNS Subdomain" is not yet set.
             [Set it now]  →  popover: DDNS Subdomain [_____________]
```
