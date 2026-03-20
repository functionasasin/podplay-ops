import type { ServiceTier } from '@/lib/types';

// ─── Colors ───────────────────────────────────────────────────────────────────

export const PORT_COLORS = {
  ipad:        '#BDD7EE',
  camera:      '#E2EFDA',
  appletv:     '#FCE4D6',
  securitycam: '#E2D9F3',
  kisi:        '#FFF2CC',
  empty:       '#FFFFFF',
  sfp:         '#D9D9D9',
  udm:         '#D6DCE4',
} as const;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PortTemplateInput {
  tier: ServiceTier;
  courts: number;
  cams: number;   // from security_camera_count
  doors: number;
}

/** One column in a switch panel. gapBefore and isSfp are set only on the SFP column. */
export interface PortColumn {
  topPort: number;
  bottomPort: number;
  topDevice: string;     // device name, e.g. 'iPad\nC1'
  bottomDevice: string;  // empty string when the bottom slot is unused
  topIp: string;         // IP suffix, e.g. '.21' — empty when topDevice is empty
  bottomIp: string;      // empty when bottomDevice is empty
  color: string;         // raw hex
  gapBefore?: boolean;   // true only on the SFP column
  isSfp?: boolean;       // true only on the SFP column
}

/**
 * The UDM panel. Rendered as 4 independent horizontal rows (NOT column pairs).
 * topPorts = [1, 3, 5, 7, null, 10]      — 6 elements
 * bottomPorts = [2, 4, 6, 8, null, 9, 11] — 7 elements (asymmetric by design)
 * null entries render as gap spacers.
 */
export interface UDMPanel {
  topPorts: (number | null)[];
  bottomPorts: (number | null)[];
  assign: Record<number, string>;  // device label per port number
  colors: Record<number, string>;  // raw hex per port number
  ips: Record<number, string>;     // IP suffix per port number
}

export interface PortTemplateData {
  isAuto: boolean;
  courts: number;
  cams: number;
  doors: number;
  tierSlug: 'pro' | 'auto';
  tierDisplayName: string;       // 'Pro', 'Auto', 'Auto+'
  switchCount: 1 | 2;
  switchSize: 24 | 48;
  udm: UDMPanel;
  switch1Columns: PortColumn[];
  switch2Columns: PortColumn[] | null;  // null iff switchCount === 1, never empty array
  filename: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getSwitchConfig(totalPorts: number): { switchCount: 1 | 2; switchSize: 24 | 48 } {
  if (totalPorts <= 24) return { switchCount: 1, switchSize: 24 };
  if (totalPorts <= 48) return { switchCount: 1, switchSize: 48 };
  return { switchCount: 2, switchSize: 48 };
}

function buildUDMPanel(isAuto: boolean): UDMPanel {
  const assign: Record<number, string> = {
    1:  'Mac Mini',
    8:  'Backup Internet',
    9:  'Main Internet',
    11: 'SFP Cable\nTo Switch',
  };
  const colors: Record<number, string> = {
    1:  PORT_COLORS.udm,
    8:  PORT_COLORS.udm,
    9:  PORT_COLORS.udm,
    11: PORT_COLORS.sfp,
  };
  const ips: Record<number, string> = {
    1: '.100',
  };

  if (isAuto) {
    assign[2] = 'Kisi\nController';
    assign[4] = 'Kisi\nReader';
    colors[2] = PORT_COLORS.kisi;
    colors[4] = PORT_COLORS.kisi;
    ips[2] = '.10';
    ips[4] = '.11';
  }

  return {
    topPorts:    [1, 3, 5, 7, null, 10],
    bottomPorts: [2, 4, 6, 8, null, 9, 11],
    assign,
    colors,
    ips,
  };
}

interface SwitchGroup {
  prefix: string;
  courts: number;
  color: string;
  ipFn: (n: number) => string;
  nameFn?: (n: number) => string;
}

function buildSwitchColumns(groups: SwitchGroup[], switchSize: number): PortColumn[] {
  const columns: PortColumn[] = [];
  let portNum = 1;

  for (const group of groups) {
    const pairs = Math.ceil(group.courts / 2);
    for (let p = 0; p < pairs; p++) {
      const c1 = p * 2 + 1;
      const c2 = p * 2 + 2;
      const deviceName = (n: number) =>
        group.nameFn ? group.nameFn(n) : `${group.prefix}\nC${n}`;

      columns.push({
        topPort:      portNum,
        bottomPort:   portNum + 1,
        topDevice:    deviceName(c1),
        bottomDevice: c2 <= group.courts ? deviceName(c2) : '',
        topIp:        group.ipFn(c1),
        bottomIp:     c2 <= group.courts ? group.ipFn(c2) : '',
        color:        group.color,
      });
      portNum += 2;
    }
  }

  // Empty columns filling remaining ports up to switchSize — render as blank white boxes
  while (portNum <= switchSize) {
    columns.push({
      topPort:      portNum,
      bottomPort:   portNum + 1,
      topDevice:    '',
      bottomDevice: '',
      topIp:        '',
      bottomIp:     '',
      color:        PORT_COLORS.empty,
    });
    portNum += 2;
  }

  // SFP column — the only column with gapBefore and isSfp
  const sfpPort = switchSize + 1;
  columns.push({
    topPort:      sfpPort,
    bottomPort:   sfpPort + 1,
    topDevice:    'SFP Cable\nto UDM',
    bottomDevice: '',
    topIp:        '',
    bottomIp:     '',
    color:        PORT_COLORS.sfp,
    gapBefore:    true,
    isSfp:        true,
  });

  return columns;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computePortTemplate(input: PortTemplateInput): PortTemplateData {
  const { tier, courts, cams, doors } = input;

  if (courts < 1) {
    throw new Error('computePortTemplate: courts must be >= 1');
  }

  const isAuto = tier === 'autonomous' || tier === 'autonomous_plus';
  const tierSlug: 'pro' | 'auto' = isAuto ? 'auto' : 'pro';
  const tierDisplayName =
    tier === 'autonomous_plus' ? 'Auto+' : isAuto ? 'Auto' : 'Pro';

  // Kisi Controller + Reader #1 are on UDM ports 2 and 4 whenever isAuto.
  // Remaining readers (doors - 1) go to the switch.
  const kisiOnSwitch = isAuto ? Math.max(0, doors - 1) : 0;
  const totalPorts = courts * 3 + cams + kisiOnSwitch;
  const { switchCount, switchSize } = getSwitchConfig(totalPorts);

  const udm = buildUDMPanel(isAuto);

  const camGroup: SwitchGroup[] = cams > 0
    ? [{ prefix: 'Security Cam', courts: cams, color: PORT_COLORS.securitycam, ipFn: (n) => `.${10 + n}` }]
    : [];

  // Switch Kisi readers: labeled #1, #2, ... (relative to switch), IPs start at .12
  const kisiGroup: SwitchGroup[] = kisiOnSwitch > 0
    ? [{
        prefix:  'Kisi Reader',
        courts:  kisiOnSwitch,
        color:   PORT_COLORS.kisi,
        nameFn:  (n) => `Kisi Reader\n#${n}`,
        ipFn:    (n) => `.${11 + n}`,
      }]
    : [];

  let switch1Columns: PortColumn[];
  let switch2Columns: PortColumn[] | null = null;

  if (switchCount === 1) {
    switch1Columns = buildSwitchColumns([
      { prefix: 'iPad',       courts, color: PORT_COLORS.ipad,    ipFn: (n) => `.${20 + n}` },
      { prefix: 'Replay Cam', courts, color: PORT_COLORS.camera,  ipFn: (n) => `.${20 + n}` },
      { prefix: 'Apple TV',   courts, color: PORT_COLORS.appletv, ipFn: (n) => `.${40 + n}` },
      ...camGroup,
      ...kisiGroup,
    ], switchSize);
  } else {
    switch1Columns = buildSwitchColumns([
      { prefix: 'iPad',       courts, color: PORT_COLORS.ipad,   ipFn: (n) => `.${20 + n}` },
      { prefix: 'Replay Cam', courts, color: PORT_COLORS.camera, ipFn: (n) => `.${20 + n}` },
    ], switchSize);
    // SW2 always has Apple TV — guarantees switch2Columns is never empty
    switch2Columns = buildSwitchColumns([
      { prefix: 'Apple TV', courts, color: PORT_COLORS.appletv, ipFn: (n) => `.${40 + n}` },
      ...camGroup,
      ...kisiGroup,
    ], switchSize);
  }

  const doorsSuffix = doors > 0 ? `-${doors}doors` : '';
  const camsSuffix  = cams  > 0 ? `-${cams}cams`   : '';
  const filename    = `port-template-${tierSlug}-${courts}court${doorsSuffix}${camsSuffix}.pdf`;

  return {
    isAuto,
    courts,
    cams,
    doors,
    tierSlug,
    tierDisplayName,
    switchCount,
    switchSize,
    udm,
    switch1Columns,
    switch2Columns,
    filename,
  };
}
