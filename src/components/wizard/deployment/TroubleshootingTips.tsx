import { useState } from 'react';

export type SupportTier = 'tier_1' | 'tier_2' | 'tier_3';
export type TroubleshootingSeverity = 'info' | 'warning' | 'critical';

export interface TroubleshootingEntry {
  id: number;
  sort_order: number;
  phases: number[];
  symptom: string;
  solution: string;
  support_tier: SupportTier;
  severity: TroubleshootingSeverity;
  related_step_ids: string[];
}

// Static seed data — 16 entries from spec (business-logic/troubleshooting.md)
const TROUBLESHOOTING_ENTRIES: TroubleshootingEntry[] = [
  {
    id: 1,
    sort_order: 10,
    phases: [8, 13, 14],
    symptom: 'Mac Mini shows black screen — cannot screen share',
    solution:
      'SSH into the Mac Mini directly and restart it. Screen share will not work when the screen is black. SSH credentials are in the master accounts tab. Command: ssh <username>@192.168.32.100, then: sudo reboot',
    support_tier: 'tier_2',
    severity: 'critical',
    related_step_ids: ['step-68'],
  },
  {
    id: 2,
    sort_order: 20,
    phases: [3],
    symptom: 'Mac Mini overheating in rack',
    solution:
      'Mac Mini requires breathing room in the rack. Do not install it flush against other equipment. Reserve 2U of space at the top of the rack for the Mac Mini shelf. If overheating persists, add a rack fan.',
    support_tier: 'tier_1',
    severity: 'warning',
    related_step_ids: ['step-29'],
  },
  {
    id: 3,
    sort_order: 30,
    phases: [9, 13],
    symptom: 'Replays missing for a specific time window (e.g., no clips between 2–4 PM)',
    solution:
      'The rename service may have failed during that window. Video files need timestamps (e.g., 0225) applied by the rename service to be indexed. Check rename service status via the health endpoint: http://{{DDNS_SUBDOMAIN}}.podplaydns.com:4000/health — look for "rename_service" field. If stopped, restart the Mac Mini. If the issue recurs, escalate to Tier 3.',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-84'],
  },
  {
    id: 4,
    sort_order: 40,
    phases: [10, 12],
    symptom: 'iPad loses connection intermittently / PoE adapter unstable',
    solution:
      'PoE adapters are very sensitive to cable quality. Cable runs must be clean and not bunched up. Maximum cable run: 100m. If intermittent: (1) ensure cable is not coiled tightly near the PoE injector, (2) check all RJ45 terminations for proper crimping, (3) re-terminate both ends of the run if needed. Also verify the switch port PoE budget is not exceeded.',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-85'],
  },
  {
    id: 5,
    sort_order: 50,
    phases: [12],
    symptom: 'Bluetooth button pairing shows "Bluetooth Pairing Failed" or "Verification Failed"',
    solution:
      'App Lock must be OFF during Flic button pairing. Go to Mosyle → select the location → turn off App Lock for that location. Exit Guided Access on the iPad first. Then retry pairing in the PodPlay app configuration menu. Re-enable App Lock when pairing is complete.',
    support_tier: 'tier_2',
    severity: 'critical',
    related_step_ids: ['step-108a'],
  },
  {
    id: 6,
    sort_order: 60,
    phases: [6, 13],
    symptom: 'Replay camera image appears warped or geometrically distorted',
    solution:
      'Camera lens distortion coefficients need adjustment. Start with coefficients set to zero to get the raw image. Calibrate after the camera is physically installed in its final mount position (height and angle affect calibration). Contact Nico (Tier 2) for coefficient configuration — this is done via the camera web interface under Image Settings.',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-58'],
  },
  {
    id: 7,
    sort_order: 70,
    phases: [7, 13],
    symptom: 'DDNS subdomain still resolving to old IP / health check times out',
    solution:
      'Check the cron job on the Mac Mini: run "crontab -l" in the Mac Mini terminal to verify the cron entry exists. Check the log file at /tmp/freedns_<CUSTOMERNAME>_podplaydns_com.log for errors. If log shows "Could not resolve host": Mac Mini has no internet access — check VLAN 32 routing. If log shows auth error: re-generate the cron URL from FreeDNS (freedns.afraid.org → Dynamic DNS → click hostname → copy new cron line).',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-64', 'step-65'],
  },
  {
    id: 8,
    sort_order: 80,
    phases: [4, 5, 13],
    symptom: 'Health check at http://<CUSTOMERNAME>.podplaydns.com:4000/health times out from cellular network',
    solution:
      'Verify the full forwarding chain: (1) ISP router is forwarding port 4000 TCP/UDP to the UDM IP — check ISP router admin panel. (2) UDM is forwarding port 4000 TCP/UDP to 192.168.32.100 (Mac Mini) — verify in UniFi → Settings → Firewall & Security → Port Forwarding. (3) Mac Mini is on VLAN 32 with fixed IP 192.168.32.100 — check in UniFi → Devices. (4) If ISP uses CGNAT (Starlink, residential plans): port forwarding is impossible — customer must upgrade to a business plan or static IP.',
    support_tier: 'tier_2',
    severity: 'critical',
    related_step_ids: ['step-45', 'step-47'],
  },
  {
    id: 9,
    sort_order: 90,
    phases: [8, 9],
    symptom: 'Replay processing fails or skips clips — .DS_Store file present in cache folder',
    solution:
      'Run in Mac Mini terminal: cd ~/cache && rm .DS_Store (also check subdirectories: find ~/cache -name .DS_Store -delete). CRITICAL: Never open the cache folder in macOS Finder — doing so recreates .DS_Store automatically. Always use the terminal to navigate the cache folder. Consider adding a cron job to delete .DS_Store every hour: "*/1 * * * * find ~/cache -name .DS_Store -delete".',
    support_tier: 'tier_2',
    severity: 'critical',
    related_step_ids: ['step-73'],
  },
  {
    id: 10,
    sort_order: 100,
    phases: [10, 11],
    symptom: 'PodPlay kiosk app launches but shows wrong club name or generic screen',
    solution:
      'Check the Mosyle "Install App" group for this location. Navigate to: Mosyle → Apps & Books → select the Install App profile for this customer. Verify the P-List config contains the correct LOCATION_ID: <dict><key>id</key><string>LOCATION_ID</string></dict>. If LOCATION_ID is missing or wrong: confirm the correct ID with Agustin on the dev team, update the P-List, and force-push the config update to affected devices.',
    support_tier: 'tier_2',
    severity: 'critical',
    related_step_ids: ['step-94', 'step-97', 'step-97b', 'step-98b'],
  },
  {
    id: 11,
    sort_order: 110,
    phases: [9, 13],
    symptom: 'Replay video shows heavy pixelation or block artifacts',
    solution:
      'V1 replay service uses UDP transport — pixelation under packet loss is a known architectural limitation of V1. Short-term fix: verify camera encoding is set correctly (Main stream: H.264, 1920x1080, 30fps, VBR, Quality 6, Max 8192 Kb/s) and the switch connection to the camera is stable (gigabit). Long-term fix: deploy V2 replay service (TCP transport, expected April 2026). V2 eliminates this issue. Escalate to Tier 3 (Patrick) if pixelation is severe and not resolved by camera re-config.',
    support_tier: 'tier_3',
    severity: 'warning',
    related_step_ids: ['step-84'],
  },
  {
    id: 12,
    sort_order: 120,
    phases: [13],
    symptom: 'Flic button press registers in the config menu but score does not update on screen',
    solution:
      'The iPad has lost its Firebase connection. Restart the iPad (from Mosyle: Devices → select iPad → Restart). Do not use Shutdown — only Restart. After restart, the PodPlay app will re-establish the Firebase connection. If the issue persists after restart, check Firebase service status via Agustin or the dev team (Tier 3).',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-118'],
  },
  {
    id: 13,
    sort_order: 130,
    phases: [12, 13],
    symptom: "Flic button won't pair even with App Lock off",
    solution:
      'Verify App Lock is fully off for this location in Mosyle (not just disabled in Guided Access — check the Mosyle policy). If App Lock is confirmed off and pairing still fails: (1) replace the CR2032 battery — even partial charge can cause pairing failures, (2) factory reset the button: remove battery, wait 5 seconds, reinsert, hold top and bottom simultaneously for 10 seconds until red blink, (3) retry pairing from the PodPlay app configuration menu (long-press logo in corner).',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-108', 'step-108a'],
  },
  {
    id: 14,
    sort_order: 140,
    phases: [12, 13],
    symptom: 'Flic button does not respond to any press — no LED blink',
    solution:
      'Replace the CR2032 coin cell battery. Yellow LED blink on press = low battery (replace soon). No response at all = dead battery. If replacing battery does not fix it: perform factory reset (remove battery → wait 5 seconds → reinsert → hold top and bottom for 10 seconds until red blink). Then re-pair the button to the iPad.',
    support_tier: 'tier_1',
    severity: 'info',
    related_step_ids: ['step-108'],
  },
  {
    id: 15,
    sort_order: 150,
    phases: [10],
    symptom: 'MDM commands sent from Mosyle never arrive on iPad',
    solution:
      'iPads cannot receive MDM commands while asleep (auto-lock). During initial configuration: turn off auto-lock on each iPad (Settings → Display & Brightness → Auto-Lock → Never). For deployed iPads: MDM commands are delivered during the 2:00 AM – 3:00 AM App Lock off window. If a command is urgent, temporarily turn off App Lock in Mosyle for that device during daytime to wake it and receive the command.',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-90'],
  },
  {
    id: 16,
    sort_order: 160,
    phases: [10],
    symptom: 'iPads enrolled into Mosyle in wrong court order — device-to-court mapping incorrect',
    solution:
      'iPads enroll into Mosyle in the exact order they are powered on. To verify current enrollment order: in Mosyle → Devices → filter by enrollment date/time — the order should match C1, C2, C3... If the order is wrong: (1) note which iPad is which by physical label on the device back, (2) reassign device names manually in Mosyle (rename each to "iPad {Client} Court #" per label), (3) for future deployments: ALWAYS power on iPads in court-number order, waiting ~5 seconds for internet connection between each.',
    support_tier: 'tier_2',
    severity: 'warning',
    related_step_ids: ['step-86'],
  },
];

export function getTroubleshootingForPhase(phase: number): TroubleshootingEntry[] {
  return TROUBLESHOOTING_ENTRIES.filter((e) => e.phases.includes(phase)).sort(
    (a, b) => a.sort_order - b.sort_order
  );
}

function tierBadge(tier: SupportTier) {
  const map: Record<SupportTier, { label: string; className: string }> = {
    tier_1: { label: 'T1', className: 'bg-green-100 text-green-800' },
    tier_2: { label: 'T2', className: 'bg-yellow-100 text-yellow-800' },
    tier_3: { label: 'T3', className: 'bg-red-100 text-red-800' },
  };
  const { label, className } = map[tier];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${className}`}
      data-testid="tier-badge"
    >
      {label}
    </span>
  );
}

function severityBorderClass(severity: TroubleshootingSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-l-4 border-red-500';
    case 'warning':
      return 'border-l-4 border-yellow-500';
    case 'info':
      return 'border-l-4 border-gray-400';
  }
}

function severityIcon(severity: TroubleshootingSeverity): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
  }
}

interface EntryRowProps {
  entry: TroubleshootingEntry;
}

function EntryRow({ entry }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`${severityBorderClass(entry.severity)} bg-white rounded-r overflow-hidden`}
      data-testid="troubleshooting-entry"
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>{severityIcon(entry.severity)}</span>
        <span className="flex-1 font-medium text-gray-800">{entry.symptom}</span>
        {tierBadge(entry.support_tier)}
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 text-sm text-gray-700 whitespace-pre-wrap">
          {entry.solution}
        </div>
      )}
    </div>
  );
}

interface TroubleshootingTipsProps {
  phase: number;
}

export function TroubleshootingTips({ phase }: TroubleshootingTipsProps) {
  const [open, setOpen] = useState(false);
  const entries = getTroubleshootingForPhase(phase);

  if (entries.length === 0) return null;

  return (
    <div className="mt-4" data-testid="troubleshooting-tips">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold text-yellow-700 hover:text-yellow-900 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>⚠</span>
        <span>Known Issues ({entries.length})</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1" data-testid="troubleshooting-list">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
