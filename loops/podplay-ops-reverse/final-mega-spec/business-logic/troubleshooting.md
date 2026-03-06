# Business Logic: Troubleshooting

**Aspect**: logic-troubleshooting
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**Source**: `analysis/source-deployment-guide.md` — Appendix A (16 known issue/solution pairs), Appendix D (support tiers)
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `troubleshooting_entries` table (seed data only; no per-project rows)

---

## Overview

The webapp surfaces contextual troubleshooting tips inline within the Stage 3 deployment wizard.
Each troubleshooting entry is associated with one or more deployment phases. When the ops person
is working through a phase, applicable troubleshooting entries appear in a collapsible panel
("Known Issues") below the checklist steps for that phase.

Troubleshooting entries are **static seed data** — they never change per-project. The full set of
16 entries is seeded at deploy time into `troubleshooting_entries` and is never mutated at runtime.

---

## Data Model

### Table: `troubleshooting_entries`

```sql
CREATE TABLE troubleshooting_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order    INTEGER NOT NULL,          -- display order within a phase group
  phases        INTEGER[] NOT NULL,        -- deployment phases where this entry is shown (0–15)
  symptom       TEXT NOT NULL,             -- what goes wrong (displayed as the collapsible header)
  solution      TEXT NOT NULL,             -- what to do (displayed in the expanded body)
  support_tier  TEXT NOT NULL             -- 'tier_1' | 'tier_2' | 'tier_3'
                CHECK (support_tier IN ('tier_1', 'tier_2', 'tier_3')),
  severity      TEXT NOT NULL DEFAULT 'warning'
                CHECK (severity IN ('info', 'warning', 'critical')),
  related_step_ids TEXT[] DEFAULT '{}',   -- optional: specific checklist step labels this applies to
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: efficient lookup by phase (array containment query)
CREATE INDEX idx_troubleshooting_entries_phases ON troubleshooting_entries USING GIN (phases);
```

**Notes**:
- `phases` is an integer array to support entries that span multiple phases (e.g., port 4000 issues
  are relevant in both Phase 4 and Phase 5).
- `related_step_ids` holds human-readable step labels (e.g., `['step-73']`, `['step-108a']`) for
  future use linking entries to specific checklist steps. Not required for MVP display.
- No `project_id` foreign key — entries are global, not per-project.
- No RLS policy needed — entries are read-only and not user-specific.

### Querying for a Phase

```typescript
async function getTroubleshootingForPhase(
  phase: number,
  supabase: SupabaseClient
): Promise<TroubleshootingEntry[]> {
  const { data } = await supabase
    .from('troubleshooting_entries')
    .select('*')
    .contains('phases', [phase])
    .order('sort_order', { ascending: true });
  return data ?? [];
}
```

---

## Support Tier Definitions

From Appendix D of the deployment guide:

| Tier | Handled By | Scope |
|------|------------|-------|
| `tier_1` | On-site staff / remote monitoring team | Restart devices, toggle App Lock, replace battery, basic connectivity |
| `tier_2` | Configuration specialist (Nico-level) | VLAN changes, camera re-config, Mosyle profiles, DDNS, replay service restart |
| `tier_3` | Engineer / Developer (Patrick-level) | Replay service code bugs, video encoding (pixelation, stream corruption), port 4000 architecture, firmware-level camera problems |

---

## Complete Seed Data — 16 Troubleshooting Entries

Listed in sort order. Each entry includes all fields needed for the `troubleshooting_entries` INSERT.

---

### Entry 1 — Mac Mini Black Screen (Crash)

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  10,
  ARRAY[8, 13, 14],
  'Mac Mini shows black screen — cannot screen share',
  'SSH into the Mac Mini directly and restart it. Screen share will not work when the screen is black. SSH credentials are in the master accounts tab. Command: ssh <username>@192.168.32.100, then: sudo reboot',
  'tier_2',
  'critical',
  ARRAY['step-68']
);
```

**Phases**: 8 (Mac Mini Setup), 13 (Testing & Verification), 14 (Health Monitoring Setup)
**Why critical**: Mac Mini is the replay service host — a crashed Mac Mini takes the entire replay system offline.

---

### Entry 2 — Mac Mini Overheating

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  20,
  ARRAY[3],
  'Mac Mini overheating in rack',
  'Mac Mini requires breathing room in the rack. Do not install it flush against other equipment. Reserve 2U of space at the top of the rack for the Mac Mini shelf. If overheating persists, add a rack fan.',
  'tier_1',
  'warning',
  ARRAY['step-29']
);
```

**Phases**: 3 (Network Rack Assembly)
**Why warning**: Overheating causes thermal throttling and eventual crash; caught during rack assembly.

---

### Entry 3 — Replays Not Generating for a Time Window

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  30,
  ARRAY[9, 13],
  'Replays missing for a specific time window (e.g., no clips between 2–4 PM)',
  'The rename service may have failed during that window. Video files need timestamps (e.g., 0225) applied by the rename service to be indexed. Check rename service status via the health endpoint: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health — look for "rename_service" field. If stopped, restart the Mac Mini. If the issue recurs, escalate to Tier 3.',
  'tier_2',
  'warning',
  ARRAY['step-84']
);
```

**Phases**: 9 (Replay Service Deployment), 13 (Testing & Verification)
**Note**: Token `{{DDNS_SUBDOMAIN}}` rendered live by the UI using `renderStepDescription()`.

---

### Entry 4 — PoE Adapter Intermittent Issues

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  40,
  ARRAY[10, 12],
  'iPad loses connection intermittently / PoE adapter unstable',
  'PoE adapters are very sensitive to cable quality. Cable runs must be clean and not bunched up. Maximum cable run: 100m. If intermittent: (1) ensure cable is not coiled tightly near the PoE injector, (2) check all RJ45 terminations for proper crimping, (3) re-terminate both ends of the run if needed. Also verify the switch port PoE budget is not exceeded.',
  'tier_2',
  'warning',
  ARRAY['step-85']
);
```

**Phases**: 10 (iPad Setup), 12 (Physical Installation)

---

### Entry 5 — Flic Buttons Won't Pair (App Lock On)

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  50,
  ARRAY[12],
  'Bluetooth button pairing shows "Bluetooth Pairing Failed" or "Verification Failed"',
  'App Lock must be OFF during Flic button pairing. Go to Mosyle → select the location → turn off App Lock for that location. Exit Guided Access on the iPad first. Then retry pairing in the PodPlay app configuration menu. Re-enable App Lock when pairing is complete.',
  'tier_2',
  'critical',
  ARRAY['step-108a']
);
```

**Phases**: 12 (Physical Installation)
**Why critical**: Flic buttons are the primary player interaction point — if unpairable, courts cannot be used.

---

### Entry 6 — Camera Image Warped / Distorted

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  60,
  ARRAY[6, 13],
  'Replay camera image appears warped or geometrically distorted',
  'Camera lens distortion coefficients need adjustment. Start with coefficients set to zero to get the raw image. Calibrate after the camera is physically installed in its final mount position (height and angle affect calibration). Contact Nico (Tier 2) for coefficient configuration — this is done via the camera web interface under Image Settings.',
  'tier_2',
  'warning',
  ARRAY['step-58']
);
```

**Phases**: 6 (Camera Configuration), 13 (Testing & Verification)

---

### Entry 7 — DDNS Not Updating

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  70,
  ARRAY[7, 13],
  'DDNS subdomain still resolving to old IP / health check times out',
  'Check the cron job on the Mac Mini: run "crontab -l" in the Mac Mini terminal to verify the cron entry exists. Check the log file at /tmp/freedns_<CUSTOMERNAME>_podplaydns_com.log for errors. If log shows "Could not resolve host": Mac Mini has no internet access — check VLAN 32 routing. If log shows auth error: re-generate the cron URL from FreeDNS (freedns.afraid.org → Dynamic DNS → click hostname → copy new cron line).',
  'tier_2',
  'warning',
  ARRAY['step-64', 'step-65']
);
```

**Phases**: 7 (DDNS Setup), 13 (Testing & Verification)

---

### Entry 8 — Port 4000 Unreachable from Outside

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  80,
  ARRAY[4, 5, 13],
  'Health check at http://<CUSTOMERNAME>.podplaydns.com:4000/health times out from cellular network',
  'Verify the full forwarding chain: (1) ISP router is forwarding port 4000 TCP/UDP to the UDM IP — check ISP router admin panel. (2) UDM is forwarding port 4000 TCP/UDP to 192.168.32.100 (Mac Mini) — verify in UniFi → Settings → Firewall & Security → Port Forwarding. (3) Mac Mini is on VLAN 32 with fixed IP 192.168.32.100 — check in UniFi → Devices. (4) If ISP uses CGNAT (Starlink, residential plans): port forwarding is impossible — customer must upgrade to a business plan or static IP.',
  'tier_2',
  'critical',
  ARRAY['step-45', 'step-47']
);
```

**Phases**: 4 (Networking Setup), 5 (ISP Router Configuration), 13 (Testing & Verification)
**Why critical**: Port 4000 is the only communication channel for the entire replay system.

---

### Entry 9 — .DS_Store in Cache Folder

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  90,
  ARRAY[8, 9],
  'Replay processing fails or skips clips — .DS_Store file present in cache folder',
  'Run in Mac Mini terminal: cd ~/cache && rm .DS_Store (also check subdirectories: find ~/cache -name .DS_Store -delete). CRITICAL: Never open the cache folder in macOS Finder — doing so recreates .DS_Store automatically. Always use the terminal to navigate the cache folder. This is a persistent issue: consider adding a cron job to delete .DS_Store every hour: "*/1 * * * * find ~/cache -name .DS_Store -delete".',
  'tier_2',
  'critical',
  ARRAY['step-73']
);
```

**Phases**: 8 (Mac Mini Setup), 9 (Replay Service Deployment)
**Why critical**: .DS_Store causes the rename service to miscount files, breaking clip indexing.

---

### Entry 10 — App Doesn't Show Customer's Club

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  100,
  ARRAY[10, 11],
  'PodPlay kiosk app launches but shows wrong club name or generic screen',
  'Check the Mosyle "Install App" group for this location. Navigate to: Mosyle → Apps & Books → select the Install App profile for this customer. Verify the P-List config contains the correct LOCATION_ID: <dict><key>id</key><string>LOCATION_ID</string></dict>. If LOCATION_ID is missing or wrong: confirm the correct ID with Agustin on the dev team, update the P-List, and force-push the config update to affected devices.',
  'tier_2',
  'critical',
  ARRAY['step-94', 'step-97', 'step-97b', 'step-98b']
);
```

**Phases**: 10 (iPad Setup), 11 (Apple TV Setup)
**Why critical**: Wrong LOCATION_ID means the app points to the wrong backend — players see another club's data.

---

### Entry 11 — Replay Video Pixelated

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  110,
  ARRAY[9, 13],
  'Replay video shows heavy pixelation or block artifacts',
  'V1 replay service uses UDP transport — pixelation under packet loss is a known architectural limitation of V1. Short-term fix: verify camera encoding is set correctly (Main stream: H.264, 1920x1080, 30fps, VBR, Quality 6, Max 8192 Kb/s) and the switch connection to the camera is stable (gigabit). Long-term fix: deploy V2 replay service (TCP transport, expected April 2026). V2 eliminates this issue. Escalate to Tier 3 (Patrick) if pixelation is severe and not resolved by camera re-config.',
  'tier_3',
  'warning',
  ARRAY['step-84']
);
```

**Phases**: 9 (Replay Service Deployment), 13 (Testing & Verification)

---

### Entry 12 — Button Paired but Score Not Updating

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  120,
  ARRAY[13],
  'Flic button press registers in the config menu but score does not update on screen',
  'The iPad has lost its Firebase connection. Restart the iPad (from Mosyle: Devices → select iPad → Restart). Do not use Shutdown — only Restart. After restart, the PodPlay app will re-establish the Firebase connection. If the issue persists after restart, check Firebase service status via Agustin or the dev team (Tier 3).',
  'tier_2',
  'warning',
  ARRAY['step-118']
);
```

**Phases**: 13 (Testing & Verification)

---

### Entry 13 — Flic Button Won't Pair (After App Lock Check)

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  130,
  ARRAY[12, 13],
  'Flic button won''t pair even with App Lock off',
  'Verify App Lock is fully off for this location in Mosyle (not just disabled in Guided Access — check the Mosyle policy). If App Lock is confirmed off and pairing still fails: (1) replace the CR2032 battery — even partial charge can cause pairing failures, (2) factory reset the button: remove battery, wait 5 seconds, reinsert, hold top and bottom simultaneously for 10 seconds until red blink, (3) retry pairing from the PodPlay app configuration menu (long-press logo in corner).',
  'tier_2',
  'warning',
  ARRAY['step-108', 'step-108a']
);
```

**Phases**: 12 (Physical Installation), 13 (Testing & Verification)

---

### Entry 14 — Flic Button Unresponsive (Dead Battery)

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  140,
  ARRAY[12, 13],
  'Flic button does not respond to any press — no LED blink',
  'Replace the CR2032 coin cell battery. Yellow LED blink on press = low battery (replace soon). No response at all = dead battery. If replacing battery does not fix it: perform factory reset (remove battery → wait 5 seconds → reinsert → hold top and bottom for 10 seconds until red blink). Then re-pair the button to the iPad.',
  'tier_1',
  'info',
  ARRAY['step-108']
);
```

**Phases**: 12 (Physical Installation), 13 (Testing & Verification)

---

### Entry 15 — iPad Not Receiving MDM Commands

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  150,
  ARRAY[10],
  'MDM commands sent from Mosyle never arrive on iPad',
  'iPads cannot receive MDM commands while asleep (auto-lock). During initial configuration: turn off auto-lock on each iPad (Settings → Display & Brightness → Auto-Lock → Never). For deployed iPads: MDM commands are delivered during the 2:00 AM – 3:00 AM App Lock off window. If a command is urgent, temporarily turn off App Lock in Mosyle for that device during daytime to wake it and receive the command.',
  'tier_2',
  'warning',
  ARRAY['step-90']
);
```

**Phases**: 10 (iPad Setup)

---

### Entry 16 — iPad Enrollment Out of Order

```sql
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids)
VALUES (
  160,
  ARRAY[10],
  'iPads enrolled into Mosyle in wrong court order — device-to-court mapping incorrect',
  'iPads enroll into Mosyle in the exact order they are powered on. To verify current enrollment order: in Mosyle → Devices → filter by enrollment date/time — the order should match C1, C2, C3... If the order is wrong: (1) note which iPad is which by physical label on the device back, (2) reassign device names manually in Mosyle (rename each to "iPad {Client} Court #" per label), (3) for future deployments: ALWAYS power on iPads in court-number order, waiting ~5 seconds for internet connection between each.',
  'tier_2',
  'warning',
  ARRAY['step-86']
);
```

**Phases**: 10 (iPad Setup)

---

## UI Behavior: Surfacing Troubleshooting Tips

### Location in Wizard

Each phase accordion in Stage 3 has a "Known Issues" section below the checklist steps:

```
Phase 10: iPad Setup                              [ 0/11 ] ▼
├── [ ] Step 85: Plug PoE adapters into switch...
├── [ ] Step 86: Power on iPads in court-number order...
│   ...
└── ─────────────────────────────────────────────────────
    ⚠ Known Issues (3)                                    ▼
    ├── iPad loses connection intermittently / PoE adapter unstable
    ├── MDM commands sent from Mosyle never arrive on iPad
    └── iPads enrolled into Mosyle in wrong court order
```

### Component Behavior

- "Known Issues" header shows count of entries for the phase.
- If count = 0, the section is hidden entirely.
- Each entry renders as a collapsible row:
  - **Collapsed**: symptom text + support tier badge (`T1` / `T2` / `T3`) + severity icon
  - **Expanded**: full solution text (rendered as markdown, supports inline code blocks)
- Default state: all collapsed.
- Severity determines left border color:
  - `critical` → red border
  - `warning` → yellow border
  - `info` → gray border

### Support Tier Badge Colors

| Tier | Badge text | Badge color |
|------|-----------|-------------|
| `tier_1` | T1 | green |
| `tier_2` | T2 | yellow |
| `tier_3` | T3 | red |

### Token Rendering in Solutions

Solution text may contain `{{DDNS_SUBDOMAIN}}` or other project tokens. Render using the same
`renderStepDescription()` function used for checklist step descriptions:

```typescript
function renderSolution(solution: string, project: Project): string {
  return renderStepDescription(solution, project);
  // Same token map: CUSTOMER_NAME, DDNS_SUBDOMAIN, COURT_COUNT, LOCATION_ID, MAC_MINI_USERNAME, UNIFI_SITE_NAME
}
```

---

## Phase-to-Entry Mapping (Summary)

| Phase | Phase Name | Entries Shown |
|-------|-----------|---------------|
| 3  | Network Rack Assembly | Entry 2 (Mac Mini overheating) |
| 4  | Networking Setup (UniFi) | Entry 8 (port 4000 unreachable) |
| 5  | ISP Router Configuration | Entry 8 (port 4000 unreachable) |
| 6  | Camera Configuration | Entry 6 (camera image warped) |
| 7  | DDNS Setup | Entry 7 (DDNS not updating) |
| 8  | Mac Mini Setup | Entries 1 (black screen), 9 (.DS_Store) |
| 9  | Replay Service Deployment | Entries 3 (rename service), 9 (.DS_Store), 11 (pixelated) |
| 10 | iPad Setup | Entries 4 (PoE), 10 (wrong club), 15 (MDM commands), 16 (enrollment order) |
| 11 | Apple TV Setup | Entry 10 (wrong club name) |
| 12 | Physical Installation | Entries 4 (PoE), 5 (button pairing / App Lock), 13 (button won't pair), 14 (dead battery) |
| 13 | Testing & Verification | Entries 1 (Mac Mini crash), 3 (rename service), 6 (camera warped), 7 (DDNS), 8 (port 4000), 11 (pixelated), 12 (score not updating), 13 (button pairing), 14 (dead battery) |
| 14 | Health Monitoring Setup | Entry 1 (Mac Mini crash — SSH/restart needed) |

Phases 0, 1, 2, 15 have no troubleshooting entries.

---

## Full SQL Seed Block

```sql
-- Seed: troubleshooting_entries (16 entries from Appendix A + Appendix D)
INSERT INTO troubleshooting_entries (sort_order, phases, symptom, solution, support_tier, severity, related_step_ids) VALUES

(10,  ARRAY[8,13,14],
 'Mac Mini shows black screen — cannot screen share',
 'SSH into the Mac Mini directly and restart it. Screen share will not work when the screen is black. SSH credentials are in the master accounts tab. Command: ssh <username>@192.168.32.100, then: sudo reboot',
 'tier_2', 'critical', ARRAY['step-68']),

(20,  ARRAY[3],
 'Mac Mini overheating in rack',
 'Mac Mini requires breathing room in the rack. Do not install it flush against other equipment. Reserve 2U of space at the top of the rack for the Mac Mini shelf. If overheating persists, add a rack fan.',
 'tier_1', 'warning', ARRAY['step-29']),

(30,  ARRAY[9,13],
 'Replays missing for a specific time window (e.g., no clips between 2–4 PM)',
 'The rename service may have failed during that window. Video files need timestamps (e.g., 0225) applied by the rename service to be indexed. Check rename service status via the health endpoint: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health — look for "rename_service" field. If stopped, restart the Mac Mini. If the issue recurs, escalate to Tier 3.',
 'tier_2', 'warning', ARRAY['step-84']),

(40,  ARRAY[10,12],
 'iPad loses connection intermittently / PoE adapter unstable',
 'PoE adapters are very sensitive to cable quality. Cable runs must be clean and not bunched up. Maximum cable run: 100m. If intermittent: (1) ensure cable is not coiled tightly near the PoE injector, (2) check all RJ45 terminations for proper crimping, (3) re-terminate both ends of the run if needed. Also verify the switch port PoE budget is not exceeded.',
 'tier_2', 'warning', ARRAY['step-85']),

(50,  ARRAY[12],
 'Bluetooth button pairing shows "Bluetooth Pairing Failed" or "Verification Failed"',
 'App Lock must be OFF during Flic button pairing. Go to Mosyle → select the location → turn off App Lock for that location. Exit Guided Access on the iPad first. Then retry pairing in the PodPlay app configuration menu. Re-enable App Lock when pairing is complete.',
 'tier_2', 'critical', ARRAY['step-108a']),

(60,  ARRAY[6,13],
 'Replay camera image appears warped or geometrically distorted',
 'Camera lens distortion coefficients need adjustment. Start with coefficients set to zero to get the raw image. Calibrate after the camera is physically installed in its final mount position (height and angle affect calibration). Contact Nico (Tier 2) for coefficient configuration — this is done via the camera web interface under Image Settings.',
 'tier_2', 'warning', ARRAY['step-58']),

(70,  ARRAY[7,13],
 'DDNS subdomain still resolving to old IP / health check times out',
 'Check the cron job on the Mac Mini: run "crontab -l" in the Mac Mini terminal to verify the cron entry exists. Check the log file at /tmp/freedns_<CUSTOMERNAME>_podplaydns_com.log for errors. If log shows "Could not resolve host": Mac Mini has no internet access — check VLAN 32 routing. If log shows auth error: re-generate the cron URL from FreeDNS (freedns.afraid.org → Dynamic DNS → click hostname → copy new cron line).',
 'tier_2', 'warning', ARRAY['step-64','step-65']),

(80,  ARRAY[4,5,13],
 'Health check at http://<CUSTOMERNAME>.podplaydns.com:4000/health times out from cellular network',
 'Verify the full forwarding chain: (1) ISP router is forwarding port 4000 TCP/UDP to the UDM IP — check ISP router admin panel. (2) UDM is forwarding port 4000 TCP/UDP to 192.168.32.100 (Mac Mini) — verify in UniFi → Settings → Firewall & Security → Port Forwarding. (3) Mac Mini is on VLAN 32 with fixed IP 192.168.32.100 — check in UniFi → Devices. (4) If ISP uses CGNAT (Starlink, residential plans): port forwarding is impossible — customer must upgrade to a business plan or static IP.',
 'tier_2', 'critical', ARRAY['step-45','step-47']),

(90,  ARRAY[8,9],
 'Replay processing fails or skips clips — .DS_Store file present in cache folder',
 'Run in Mac Mini terminal: cd ~/cache && rm .DS_Store (also check subdirectories: find ~/cache -name .DS_Store -delete). CRITICAL: Never open the cache folder in macOS Finder — doing so recreates .DS_Store automatically. Always use the terminal to navigate the cache folder. Consider adding a cron job to delete .DS_Store every hour: "*/1 * * * * find ~/cache -name .DS_Store -delete".',
 'tier_2', 'critical', ARRAY['step-73']),

(100, ARRAY[10,11],
 'PodPlay kiosk app launches but shows wrong club name or generic screen',
 'Check the Mosyle "Install App" group for this location. Navigate to: Mosyle → Apps & Books → select the Install App profile for this customer. Verify the P-List config contains the correct LOCATION_ID: <dict><key>id</key><string>LOCATION_ID</string></dict>. If LOCATION_ID is missing or wrong: confirm the correct ID with Agustin on the dev team, update the P-List, and force-push the config update to affected devices.',
 'tier_2', 'critical', ARRAY['step-94','step-97','step-97b','step-98b']),

(110, ARRAY[9,13],
 'Replay video shows heavy pixelation or block artifacts',
 'V1 replay service uses UDP transport — pixelation under packet loss is a known architectural limitation of V1. Short-term: verify camera encoding (Main stream: H.264, 1920x1080, 30fps, VBR, Quality 6, Max 8192 Kb/s) and stable gigabit switch connection. Long-term fix: deploy V2 replay service (TCP transport, expected April 2026) which eliminates this issue. Escalate to Tier 3 (Patrick) if pixelation is severe.',
 'tier_3', 'warning', ARRAY['step-84']),

(120, ARRAY[13],
 'Flic button press registers in the config menu but score does not update on screen',
 'The iPad has lost its Firebase connection. Restart the iPad (Mosyle: Devices → select iPad → Restart). Do NOT use Shutdown — only Restart. After restart, the PodPlay app re-establishes the Firebase connection. If the issue persists after restart, check Firebase service status via Agustin or the dev team (Tier 3).',
 'tier_2', 'warning', ARRAY['step-118']),

(130, ARRAY[12,13],
 'Flic button won''t pair even with App Lock off',
 'Verify App Lock is fully off for this location in Mosyle (not just disabled in Guided Access — check the Mosyle policy). If confirmed off and pairing still fails: (1) replace the CR2032 battery, (2) factory reset the button: remove battery, wait 5 seconds, reinsert, hold top and bottom simultaneously for 10 seconds until red blink, (3) retry pairing from PodPlay app configuration menu (long-press logo in corner).',
 'tier_2', 'warning', ARRAY['step-108','step-108a']),

(140, ARRAY[12,13],
 'Flic button does not respond to any press — no LED blink',
 'Replace the CR2032 coin cell battery. Yellow LED blink on press = low battery (replace soon). No response at all = dead battery. If replacing battery does not fix it: factory reset (remove battery → wait 5 seconds → reinsert → hold top and bottom for 10 seconds until red blink). Then re-pair the button to the iPad.',
 'tier_1', 'info', ARRAY['step-108']),

(150, ARRAY[10],
 'MDM commands sent from Mosyle never arrive on iPad',
 'iPads cannot receive MDM commands while asleep (auto-lock). During initial configuration: turn off auto-lock on each iPad (Settings → Display & Brightness → Auto-Lock → Never). For deployed iPads: MDM commands are delivered during the 2:00 AM – 3:00 AM App Lock off window. If a command is urgent, temporarily turn off App Lock in Mosyle for that device during daytime.',
 'tier_2', 'warning', ARRAY['step-90']),

(160, ARRAY[10],
 'iPads enrolled into Mosyle in wrong court order — device-to-court mapping incorrect',
 'iPads enroll into Mosyle in the exact order they are powered on. To verify: in Mosyle → Devices → filter by enrollment date/time — order should match C1, C2, C3. If wrong: reassign device names manually in Mosyle (rename each to "iPad {Client} Court #" per physical label). For future: ALWAYS power on iPads in court-number order, waiting ~5 seconds for internet connection between each.',
 'tier_2', 'warning', ARRAY['step-86']);
```

---

## TypeScript Type Definition

```typescript
// src/types/troubleshooting.ts
export type SupportTier = 'tier_1' | 'tier_2' | 'tier_3';
export type TroubleshootingSeverity = 'info' | 'warning' | 'critical';

export interface TroubleshootingEntry {
  id: string;
  sort_order: number;
  phases: number[];
  symptom: string;
  solution: string;
  support_tier: SupportTier;
  severity: TroubleshootingSeverity;
  related_step_ids: string[];
  created_at: string;
}
```
