# Replay Service Version Logic

**Aspect:** logic-replay-service-version
**Wave:** 3 — Business Logic & Workflows
**Sources:** `analysis/source-deployment-guide.md` (Phase 9, Steps 74–84; Appendix A row "Replay video pixelated"; Appendix F Q4; Key Values "V1 vs V2 Replay Service")

---

## Overview

PodPlay operates two versions of its on-premises replay service. The version determines which steps are executed in Phase 9 of the deployment wizard and which troubleshooting guidance is shown throughout. As of the spec date (March 2026), V1 is current production; V2 is estimated to launch ~April 2026. The webapp must support both versions indefinitely because existing deployed venues remain on V1 until manually migrated.

---

## Version Summary

| Attribute | V1 (Current Production) | V2 (Target ~April 2026) |
|-----------|------------------------|-------------------------|
| Protocol | UDP | TCP |
| Pixelation issue | Known (UDP packet loss) | Fixed (TCP retransmit) |
| Deployment method | Jersey City server (VPN) + `deploy.py` | GitHub repository, direct deploy |
| Configuration method | Google Doc (RSC sheet) | Admin dashboard |
| Developer contact for issues | Patrick | Patrick |
| Phase 9 steps | Steps 74–84 (11 steps) | Steps 75–84 minus 74–79 (5 steps) |
| Port 4000 usage | TCP/UDP | TCP |
| Health endpoint | Same: `http://CUSTOMERNAME.podplaydns.com:4000/health` | Same |
| Instant replay endpoint | Same: `http://CUSTOMERNAME.podplaydns.com:4000/instant-replay/COURTNAME` | Same |

---

## Database Field

The `projects` table includes a `replay_service_version` field:

```sql
replay_service_version  TEXT  NOT NULL  DEFAULT 'v1'
  CHECK (replay_service_version IN ('v1', 'v2'))
```

**Source:** Derived from deployment guide Phase 9 note: "V2 replay service (coming ~April 2026) will eliminate steps 74–79."

This field is set during the Intake Wizard (Stage 1) by the ops person selecting which version to deploy. For any project created before V2 launch (April 2026), the default is `v1`. Ops can change this at any time before Phase 9 begins.

---

## Phase 9 Step Definitions

### Phase 9 — V1 Steps (11 steps, steps 74–84)

All steps execute sequentially. Steps 74–79 require VPN access to the Jersey City deployment server.

| Step ID | Order | Description | Prerequisite |
|---------|-------|-------------|--------------|
| `p9_v1_connect_jersey_city` | 74 | Connect to Deployment Server in Jersey City (VPN required) | VPN client installed on ops laptop |
| `p9_v1_upload_venue_logo` | 75 | Upload venue logo to assets folder in home folder on deployment server | Connected to Jersey City server |
| `p9_v1_verify_logo_name` | 76 | Ensure logo filename matches RSC (Replay Service Configuration) sheet exactly | Logo uploaded |
| `p9_v1_launch_upload_asset` | 77 | Launch Upload Asset script on deployment server | Logo name verified |
| `p9_v1_create_package` | 78 | In terminal on deployment server: `./deploy.py setup <AREA_NAME>` | Upload Asset script completed |
| `p9_v1_copy_url` | 79 | Copy generated deployment URL to notepad | deploy.py completed |
| `p9_v1_download_package` | 80 | Connect back to client Mac Mini; download package from generated URL | Package URL copied |
| `p9_v1_privacy_security` | 81 | First open: System Settings → Privacy & Security → scroll down → Open Anyway | Package downloaded |
| `p9_v1_full_disk_access` | 82 | Add "Find" and "Node" to Full Disk Access in System Settings | Privacy & Security approved |
| `p9_v1_restart_mac_mini` | 83 | Restart Mac Mini | Full disk access granted |
| `p9_v1_verify_ssd_write` | 84 | Verify video files are writing to Samsung SSD | Mac Mini restarted |

**Token in step 78:** `<AREA_NAME>` → replaced with `projects.customer_name` (URL-safe slug, lowercase, no spaces).

### Phase 9 — V2 Steps (5 steps)

V2 eliminates the Jersey City server dependency (steps 74–79). Deployment is done directly from GitHub; configuration is via admin dashboard rather than Google Doc.

| Step ID | Order | Description | Prerequisite |
|---------|-------|-------------|--------------|
| `p9_v2_deploy_github` | 80 | On Mac Mini terminal: pull replay service from GitHub and run install script (URL provided by Patrick/dev team for each release) | Mac Mini online, on REPLAY VLAN |
| `p9_v2_configure_dashboard` | 81 | Configure replay service via PodPlay admin dashboard → Venues → [Venue] → Replay Service Settings (no Google Doc required) | Service installed |
| `p9_v2_privacy_security` | 82 | System Settings → Privacy & Security → Open Anyway (if macOS Gatekeeper blocks) | Service configured |
| `p9_v2_restart_mac_mini` | 83 | Restart Mac Mini | Permissions granted |
| `p9_v2_verify_ssd_write` | 84 | Verify video files are writing to Samsung SSD | Mac Mini restarted |

**Note on V2 GitHub URL:** The exact GitHub repo URL and install command are provided by the development team (Patrick) per release. The webapp stores this in a `settings` table field `replay_service_v2_install_command` (default: `"Contact Patrick for V2 install command"`), editable in the Settings page. The ops person updates this when Patrick shares a new release.

---

## State Machine

The `replay_service_version` field on a project is set during intake and can be changed until Phase 9 starts. Once the Phase 9 checklist has any step checked, the version is locked (to prevent checklist mismatch).

```
version selectable (intake → Phase 8 complete)
     ↓  [Phase 9 step 1 checked]
version locked (Phase 9 → completion)
```

**Lock condition:** `deployment_phases[phase_index=9].steps[0].completed = true`

If ops needs to change version after Phase 9 has started, they must uncheck all Phase 9 steps first. The webapp shows a warning: "Changing the replay service version will reset all Phase 9 checklist items. Are you sure?"

---

## Version Selection UI (Stage 1 Intake Wizard, Step 3 — Advanced Configuration)

The version selector appears as a radio group in Stage 1, Step 3 (Advanced Configuration):

```
Replay Service Version
  ○ V1 (Current) — UDP, deploy via Jersey City server
  ● V2 (TCP, April 2026) — Deploy from GitHub, configure via dashboard

  ⚠ V1 known issue: Video pixelation due to UDP packet loss. Deploy V2 when available.
```

- Default: `v1` for projects created before April 2026
- The warning banner showing the V1 pixelation issue is always visible when `v1` is selected
- After the V2 launch date (April 2026), the UI default changes to `v2`; `v1` remains selectable for existing installs

---

## Conditional Step Rendering in Deployment Wizard (Phase 9)

The deployment wizard reads `project.replay_service_version` and renders Phase 9 steps accordingly:

```typescript
// src/services/deploymentService.ts

export function getPhase9Steps(replayServiceVersion: 'v1' | 'v2'): ChecklistStep[] {
  if (replayServiceVersion === 'v1') {
    return PHASE_9_V1_STEPS;
  }
  return PHASE_9_V2_STEPS;
}
```

The checklist is generated once when the deployment phase is first opened. If the ops person changes the version (and the version has not yet been locked), the Phase 9 checklist is regenerated with the new step set. Any existing completion state for Phase 9 is cleared on version change.

---

## Version Banner in Phase 9 Header

When Phase 9 is opened, a version badge appears in the phase header:

**V1:**
```
Phase 9: Replay Service Deployment
[V1 — UDP]  ⚠ Pixelation may occur. Deploy V2 when available for TCP fix.
```

**V2:**
```
Phase 9: Replay Service Deployment
[V2 — TCP]  ✓ TCP protocol — pixelation issue resolved.
```

---

## Troubleshooting Integration

Two troubleshooting pairs from Appendix A are conditionally surfaced based on `replay_service_version`:

### Pair 1: Pixelation (V1 only)

| Field | Value |
|-------|-------|
| `issue` | Replay video pixelated |
| `solution` | V1 replay service uses UDP — pixelation is a known issue. Deploy V2 (TCP) to fix. Contact developer (Patrick). |
| `phase` | Phase 9 and Phase 13 |
| `condition` | `replay_service_version = 'v1'` |
| `severity` | `warning` |

This tip is shown:
1. In Phase 9 header banner (V1 only)
2. In Phase 13 (Testing & Verification) in the "If Replay Doesn't Work" section (V1 only)
3. In global troubleshooting reference, shown for all V1 projects

### Pair 2: Port 4000 unreachable (both versions)

| Field | Value |
|-------|-------|
| `issue` | Port 4000 unreachable from outside |
| `solution` | Verify: ISP router forwarding → UDM forwarding → Mac Mini on .32.100. Test from cellular network. |
| `phase` | Phase 5 and Phase 13 |
| `condition` | None (applies to both V1 and V2) |
| `severity` | `error` |

---

## Validation Rules

1. **`replay_service_version` must be set before Phase 9 can begin.** The wizard prevents opening Phase 9 if the version is not selected.
2. **Version cannot be changed after Phase 9 step 1 is checked.** Show inline error: "Version is locked once Phase 9 has started. Uncheck all Phase 9 steps to change."
3. **V2 install command must be set before Phase 9 V2 step 1 can be checked.** If `settings.replay_service_v2_install_command` is still the default placeholder, show warning: "Update the V2 install command in Settings before proceeding."

---

## Database Schema Additions

```sql
-- On projects table (already defined in schema.md — this field is additive)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  replay_service_version TEXT NOT NULL DEFAULT 'v1'
    CHECK (replay_service_version IN ('v1', 'v2'));

-- On settings table (single-row, keyed settings)
-- Add row for V2 install command
-- key: 'replay_service_v2_install_command'
-- value: 'Contact Patrick for V2 install command'
-- description: 'Shell command to install V2 replay service on Mac Mini. Updated by ops when Patrick shares a new release.'
```

---

## TypeScript Types

```typescript
// src/types/replayService.ts

export type ReplayServiceVersion = 'v1' | 'v2';

export interface Phase9StepV1 {
  id: string;
  order: number;       // 74–84
  description: string;
  prerequisite: string;
  token?: string;      // e.g. '<AREA_NAME>' → project.customer_name slug
}

export interface Phase9StepV2 {
  id: string;
  order: number;       // 80–84
  description: string;
  prerequisite: string;
}

// Version banner content
export const REPLAY_VERSION_BANNER: Record<ReplayServiceVersion, {
  label: string;
  protocol: string;
  message: string;
  severity: 'warning' | 'success';
}> = {
  v1: {
    label: 'V1 — UDP',
    protocol: 'UDP',
    message: 'Pixelation may occur. Deploy V2 when available for TCP fix.',
    severity: 'warning',
  },
  v2: {
    label: 'V2 — TCP',
    protocol: 'TCP',
    message: 'TCP protocol — pixelation issue resolved.',
    severity: 'success',
  },
};
```

---

## Complete Phase 9 Step Data (Seed)

### V1 Step Seed Data (for `checklist_templates` or inline wizard constant)

```typescript
export const PHASE_9_V1_STEPS = [
  {
    id: 'p9_v1_connect_jersey_city',
    order: 74,
    description: 'Connect to Deployment Server in Jersey City (VPN required)',
    prerequisite: 'VPN client installed and connected on ops laptop',
    token: null,
  },
  {
    id: 'p9_v1_upload_venue_logo',
    order: 75,
    description: 'Upload venue logo to assets folder in home folder on deployment server',
    prerequisite: 'Connected to Jersey City deployment server',
    token: null,
  },
  {
    id: 'p9_v1_verify_logo_name',
    order: 76,
    description: 'Ensure logo filename matches RSC (Replay Service Configuration) sheet exactly',
    prerequisite: 'Logo uploaded to deployment server',
    token: null,
  },
  {
    id: 'p9_v1_launch_upload_asset',
    order: 77,
    description: 'Launch Upload Asset script on deployment server',
    prerequisite: 'Logo name verified against RSC',
    token: null,
  },
  {
    id: 'p9_v1_create_package',
    order: 78,
    description: 'In terminal on deployment server: ./deploy.py setup {{AREA_NAME}}',
    prerequisite: 'Upload Asset script completed',
    token: '{{AREA_NAME}}',   // replaced with URL-safe slug of projects.customer_name
  },
  {
    id: 'p9_v1_copy_url',
    order: 79,
    description: 'Copy generated deployment URL from deploy.py output to notepad',
    prerequisite: 'deploy.py setup completed',
    token: null,
  },
  {
    id: 'p9_v1_download_package',
    order: 80,
    description: 'Connect to client Mac Mini; download package from generated URL',
    prerequisite: 'Deployment URL copied',
    token: null,
  },
  {
    id: 'p9_v1_privacy_security',
    order: 81,
    description: 'First open: System Settings → Privacy & Security → scroll down → Open Anyway',
    prerequisite: 'Package downloaded to Mac Mini',
    token: null,
  },
  {
    id: 'p9_v1_full_disk_access',
    order: 82,
    description: 'Add "Find" and "Node" to Full Disk Access in System Settings → Privacy & Security',
    prerequisite: 'Privacy & Security Open Anyway approved',
    token: null,
  },
  {
    id: 'p9_v1_restart_mac_mini',
    order: 83,
    description: 'Restart Mac Mini',
    prerequisite: 'Full disk access granted',
    token: null,
  },
  {
    id: 'p9_v1_verify_ssd_write',
    order: 84,
    description: 'Verify video files are writing to Samsung SSD',
    prerequisite: 'Mac Mini restarted and replay service running',
    token: null,
  },
] as const;
```

### V2 Step Seed Data

```typescript
export const PHASE_9_V2_STEPS = [
  {
    id: 'p9_v2_deploy_github',
    order: 80,
    description: 'On Mac Mini terminal: run V2 install command from GitHub (see Settings → Replay Service V2 Install Command)',
    prerequisite: 'Mac Mini online on REPLAY VLAN, V2 install command set in Settings',
    token: null,
  },
  {
    id: 'p9_v2_configure_dashboard',
    order: 81,
    description: 'Configure replay service via PodPlay admin dashboard → Venues → [Venue] → Replay Service Settings',
    prerequisite: 'V2 service installed on Mac Mini',
    token: null,
  },
  {
    id: 'p9_v2_privacy_security',
    order: 82,
    description: 'If macOS Gatekeeper blocks service: System Settings → Privacy & Security → Open Anyway',
    prerequisite: 'Replay service configured via dashboard',
    token: null,
  },
  {
    id: 'p9_v2_restart_mac_mini',
    order: 83,
    description: 'Restart Mac Mini',
    prerequisite: 'Permissions granted',
    token: null,
  },
  {
    id: 'p9_v2_verify_ssd_write',
    order: 84,
    description: 'Verify video files are writing to Samsung SSD',
    prerequisite: 'Mac Mini restarted and V2 replay service running',
    token: null,
  },
] as const;
```

---

## Token Replacement

`{{AREA_NAME}}` in step `p9_v1_create_package` is auto-filled by the wizard using a URL-safe slug derived from `projects.customer_name`:

```typescript
// src/utils/slugify.ts
export function toAreaName(customerName: string): string {
  return customerName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')   // remove non-alphanumeric
    .trim();
}

// Example: "Ace Pickleball Club" → "acepickleballclub"
// Example: "Metro PB" → "metropb"
```

The wizard renders step 78 description as:
> `./deploy.py setup acepickleballclub`

with the resolved value shown in a monospace inline code block next to the original description.

---

## Progress Calculation Impact

Phase 9 progress is calculated as `checked_steps / total_steps`:

- V1: total_steps = 11, so each step = 9.09%
- V2: total_steps = 5, so each step = 20%

The `getPhaseProgress` function reads the step count from whichever step array is active for the project version.

---

## Concrete Verification Example

**Project:** Ace Pickleball Club, 6 courts, V1

Phase 9 opens → 11 steps shown.

Steps 74–79 all require VPN + Jersey City server access. Ops completes them sequentially. Step 78 shows:
```
./deploy.py setup acepickleballclub
```

After all 11 steps checked: Phase 9 = 100% complete. Version banner displayed:
```
[V1 — UDP]  ⚠ Pixelation may occur. Deploy V2 when available for TCP fix.
```

Troubleshooting tip "Replay video pixelated" is shown in Phase 9 and Phase 13 warning panels.

---

**Project:** Metro PB, 4 courts, V2

Phase 9 opens → 5 steps shown.

No VPN or Jersey City server required. Step 80 shows:
```
On Mac Mini terminal: run V2 install command from GitHub (see Settings → Replay Service V2 Install Command)
```

After all 5 steps checked: Phase 9 = 100% complete. Version banner:
```
[V2 — TCP]  ✓ TCP protocol — pixelation issue resolved.
```

Pixelation troubleshooting tip is NOT shown.
