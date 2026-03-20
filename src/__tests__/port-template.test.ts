import { describe, it, expect } from 'vitest';
import { computePortTemplate } from '@/lib/port-template';

describe('computePortTemplate', () => {
  // ─── Switch sizing ──────────────────────────────────────────────────────────

  it('pro 1 court → 1×24-port switch, 3 total ports', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 1, cams: 0, doors: 0 });
    expect(r.switchCount).toBe(1);
    expect(r.switchSize).toBe(24);
    expect(r.switch2Columns).toBeNull();
    expect(r.isAuto).toBe(false);
    expect(r.tierSlug).toBe('pro');
    expect(r.tierDisplayName).toBe('Pro');
  });

  it('pro 8 courts → 1×24-port switch (totalPorts = 24, boundary)', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 8, cams: 0, doors: 0 });
    expect(r.switchCount).toBe(1);
    expect(r.switchSize).toBe(24);
    expect(r.switch2Columns).toBeNull();
  });

  it('pro 9 courts → 1×48-port switch (totalPorts = 27)', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 9, cams: 0, doors: 0 });
    expect(r.switchCount).toBe(1);
    expect(r.switchSize).toBe(48);
    expect(r.switch2Columns).toBeNull();
  });

  it('pro 17 courts → 2×48-port switches (totalPorts = 51)', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 17, cams: 0, doors: 0 });
    expect(r.switchCount).toBe(2);
    expect(r.switchSize).toBe(48);
    expect(r.switch2Columns).not.toBeNull();
    // SW1 has iPad + Replay Camera columns only
    const hasAtvInSw1 = r.switch1Columns.some(c => c.topDevice.includes('Apple TV'));
    expect(hasAtvInSw1).toBe(false);
    // SW2 has Apple TV (and no others for pro/no-extras)
    const hasAtvInSw2 = r.switch2Columns!.some(c => c.topDevice.includes('Apple TV'));
    expect(hasAtvInSw2).toBe(true);
  });

  // ─── Autonomous / Kisi ──────────────────────────────────────────────────────

  it('autonomous 4 courts, doors=0 → isAuto=true, kisiOnSwitch=0', () => {
    const r = computePortTemplate({ tier: 'autonomous', courts: 4, cams: 0, doors: 0 });
    expect(r.isAuto).toBe(true);
    expect(r.tierSlug).toBe('auto');
    expect(r.tierDisplayName).toBe('Auto');
    // UDM has Kisi ports
    expect(r.udm.assign[2]).toBe('Kisi\nController');
    expect(r.udm.assign[4]).toBe('Kisi\nReader');
    // No Kisi columns on the switch
    const hasKisiOnSwitch = r.switch1Columns.some(c => c.topDevice.includes('Kisi'));
    expect(hasKisiOnSwitch).toBe(false);
    expect(r.switch2Columns).toBeNull();
  });

  it('autonomous 4 courts, doors=1 → kisiOnSwitch=0 (only UDM reader)', () => {
    const r = computePortTemplate({ tier: 'autonomous', courts: 4, cams: 0, doors: 1 });
    const hasKisiOnSwitch = r.switch1Columns.some(c => c.topDevice.includes('Kisi'));
    expect(hasKisiOnSwitch).toBe(false);
  });

  it('autonomous 4 courts, cams=2, doors=3 → kisiOnSwitch=2, totalPorts=16, 1×24', () => {
    const r = computePortTemplate({ tier: 'autonomous', courts: 4, cams: 2, doors: 3 });
    // kisiOnSwitch = Max(0, 3-1) = 2
    // totalPorts = 4*3 + 2 + 2 = 16
    expect(r.switchCount).toBe(1);
    expect(r.switchSize).toBe(24);
    const kisiCols = r.switch1Columns.filter(c => c.topDevice.includes('Kisi'));
    expect(kisiCols.length).toBeGreaterThan(0);
  });

  it('autonomous_plus → tierSlug=auto, tierDisplayName=Auto+', () => {
    const r = computePortTemplate({ tier: 'autonomous_plus', courts: 4, cams: 0, doors: 0 });
    expect(r.tierSlug).toBe('auto');
    expect(r.tierDisplayName).toBe('Auto+');
    expect(r.isAuto).toBe(true);
  });

  // ─── Filenames ──────────────────────────────────────────────────────────────

  it('filename: pro 8 courts, 2 cams, 0 doors → no doors suffix', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 8, cams: 2, doors: 0 });
    expect(r.filename).toBe('port-template-pro-8court-2cams.pdf');
  });

  it('filename: autonomous_plus 6 courts, 0 cams, 2 doors → no cams suffix', () => {
    const r = computePortTemplate({ tier: 'autonomous_plus', courts: 6, cams: 0, doors: 2 });
    expect(r.filename).toBe('port-template-auto-6court-2doors.pdf');
  });

  it('filename: pro 4 courts, 0 cams, 0 doors → no suffixes', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 4, cams: 0, doors: 0 });
    expect(r.filename).toBe('port-template-pro-4court.pdf');
  });

  // ─── Defensive guard ────────────────────────────────────────────────────────

  it('throws when courts < 1', () => {
    expect(() => computePortTemplate({ tier: 'pro', courts: 0, cams: 0, doors: 0 })).toThrow();
  });

  // ─── UDM panel structure ────────────────────────────────────────────────────

  it('UDM topPorts and bottomPorts have correct structure', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 4, cams: 0, doors: 0 });
    expect(r.udm.topPorts).toEqual([1, 3, 5, 7, null, 10]);
    expect(r.udm.bottomPorts).toEqual([2, 4, 6, 8, null, 9, 11]);
  });

  it('UDM has no Kisi assignments for pro tier', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 4, cams: 0, doors: 0 });
    expect(r.udm.assign[2]).toBeUndefined();
    expect(r.udm.assign[4]).toBeUndefined();
  });

  // ─── SFP column ─────────────────────────────────────────────────────────────

  it('SFP column is the last column and is the only one with gapBefore+isSfp', () => {
    const r = computePortTemplate({ tier: 'pro', courts: 4, cams: 0, doors: 0 });
    const last = r.switch1Columns[r.switch1Columns.length - 1];
    expect(last.isSfp).toBe(true);
    expect(last.gapBefore).toBe(true);
    const nonSfp = r.switch1Columns.slice(0, -1);
    expect(nonSfp.every(c => !c.isSfp && !c.gapBefore)).toBe(true);
  });
});
