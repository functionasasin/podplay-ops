/**
 * Tests for BOM generation — pure function, all 4 tiers.
 * Stage 064: Tests: BOM Generation Per Tier
 */

import { describe, it, expect } from 'vitest';
import { generateBOM } from '@/lib/bom-generation';
import type { ProjectBomItem } from '@/lib/bom-generation';

// Standard test config: 4 courts, 2 doors, 8 cameras, front desk + wifi
const STD = { courts: 4, doors: 2, cameras: 8, hasFrontDesk: true, hasPingpodWifi: true };

// Helper: find item by SKU
function item(bom: ProjectBomItem[], sku: string) {
  return bom.find((i) => i.sku === sku);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRO tier
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — pro tier', () => {
  const bom = generateBOM('pro', STD.courts, STD.doors, STD.cameras, STD.hasFrontDesk, STD.hasPingpodWifi);

  it('includes correct network rack items', () => {
    expect(item(bom, 'NET-UDM-SE')).toMatchObject({ sku: 'NET-UDM-SE', quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-24-POE')).toMatchObject({ sku: 'NET-USW-PRO-24-POE', quantity: 1 });
    expect(item(bom, 'NET-SFP-DAC')).toMatchObject({ sku: 'NET-SFP-DAC', quantity: 1 });
    expect(item(bom, 'NET-PDU')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'NET-PATCH-PANEL-24')).toMatchObject({ quantity: 1 });
    // 3 per court × 4 courts = 12
    expect(item(bom, 'NET-PATCH-1FT')).toMatchObject({ quantity: 12 });
    // 6 per venue
    expect(item(bom, 'NET-PATCH-3FT')).toMatchObject({ quantity: 6 });
  });

  it('includes infrastructure items', () => {
    expect(item(bom, 'INFRA-UPS')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'INFRA-RACK')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'INFRA-RACK-SHELF')).toMatchObject({ quantity: 1 });
  });

  it('includes replay system items scaled by court count', () => {
    expect(item(bom, 'REPLAY-MACMINI')).toMatchObject({ quantity: 1 });
    // 4 courts → SSD stays as 1TB
    expect(item(bom, 'REPLAY-SSD-1TB')).toMatchObject({ sku: 'REPLAY-SSD-1TB', quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-2TB')).toBeUndefined();
    // 1 per court × 4 = 4
    expect(item(bom, 'REPLAY-CAMERA-WHITE')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'REPLAY-CAMERA-JB-WHITE')).toMatchObject({ quantity: 4 });
    // 2 per court × 4 = 8
    expect(item(bom, 'REPLAY-FLIC')).toMatchObject({ quantity: 8 });
    expect(item(bom, 'REPLAY-SIGN')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'REPLAY-HW-KIT')).toMatchObject({ quantity: 1 });
  });

  it('includes displays scaled by court count', () => {
    expect(item(bom, 'DISPLAY-TV-65')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-TV-MOUNT')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-APPLETV')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-HDMI-3FT')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-ATV-MOUNT')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-IPAD')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-IPAD-POE')).toMatchObject({ quantity: 4 });
    expect(item(bom, 'DISPLAY-IPAD-CASE')).toMatchObject({ quantity: 4 });
  });

  it('does not include access control or surveillance for pro', () => {
    expect(item(bom, 'AC-KISI-CONTROLLER')).toBeUndefined();
    expect(item(bom, 'AC-KISI-READER')).toBeUndefined();
    expect(item(bom, 'SURV-CAMERA-WHITE')).toBeUndefined();
    expect(item(bom, 'SURV-UNVR')).toBeUndefined();
  });

  it('includes front desk items when has_front_desk=true', () => {
    expect(item(bom, 'FD-CC-TERMINAL')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'FD-QR-SCANNER')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'FD-WEBCAM')).toMatchObject({ quantity: 1 });
  });

  it('includes wifi AP when has_pingpod_wifi=true', () => {
    expect(item(bom, 'PP-WIFI-AP')).toMatchObject({ quantity: 1 });
  });

  it('has correct item count (25 template + 4 conditional)', () => {
    expect(bom).toHaveLength(29);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTONOMOUS tier
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — autonomous tier', () => {
  const bom = generateBOM('autonomous', STD.courts, STD.doors, STD.cameras, STD.hasFrontDesk, STD.hasPingpodWifi);

  it('includes 10ft patch cables', () => {
    expect(item(bom, 'NET-PATCH-10FT')).toMatchObject({ quantity: 2 });
  });

  it('includes access control scaled by door count', () => {
    expect(item(bom, 'AC-KISI-CONTROLLER')).toMatchObject({ quantity: 1 });
    // 1 per door × 2 doors = 2
    expect(item(bom, 'AC-KISI-READER')).toMatchObject({ quantity: 2 });
  });

  it('includes surveillance cameras scaled by camera count', () => {
    // 1 per camera × 8 cameras = 8
    expect(item(bom, 'SURV-CAMERA-WHITE')).toMatchObject({ quantity: 8 });
    expect(item(bom, 'SURV-CAMERA-JB-WHITE')).toMatchObject({ quantity: 8 });
  });

  it('does not include NVR (cloud-managed for autonomous)', () => {
    expect(item(bom, 'SURV-UNVR')).toBeUndefined();
    expect(item(bom, 'SURV-UNVR-PRO')).toBeUndefined();
    expect(item(bom, 'SURV-HDD')).toBeUndefined();
  });

  it('includes front desk items', () => {
    expect(item(bom, 'FD-CC-TERMINAL')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'FD-QR-SCANNER')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'FD-WEBCAM')).toMatchObject({ quantity: 1 });
  });

  it('includes wifi AP', () => {
    expect(item(bom, 'PP-WIFI-AP')).toMatchObject({ quantity: 1 });
  });

  it('has correct item count (30 template + 4 conditional)', () => {
    expect(bom).toHaveLength(34);
  });

  it('uses autonomous switch sizing (portsNeeded = courts*3 + 2 + cameras)', () => {
    // 4 courts × 3 + 2 + 8 = 22 → ≤22 → NET-USW-PRO-24-POE qty 1
    expect(item(bom, 'NET-USW-PRO-24-POE')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-48-POE')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTONOMOUS+ tier
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — autonomous_plus tier', () => {
  const bom = generateBOM('autonomous_plus', STD.courts, STD.doors, STD.cameras, STD.hasFrontDesk, STD.hasPingpodWifi);

  it('includes 2 SFP DAC cables for NVR link', () => {
    expect(item(bom, 'NET-SFP-DAC')).toMatchObject({ quantity: 2 });
  });

  it('includes NVR — 8 cameras selects SURV-UNVR-PRO (7-bay)', () => {
    expect(item(bom, 'SURV-UNVR-PRO')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'SURV-UNVR')).toBeUndefined();
  });

  it('includes HDDs scaled by camera count', () => {
    // 1 per camera × 8 cameras = 8
    expect(item(bom, 'SURV-HDD')).toMatchObject({ quantity: 8 });
  });

  it('includes surveillance cameras scaled by camera count', () => {
    expect(item(bom, 'SURV-CAMERA-WHITE')).toMatchObject({ quantity: 8 });
    expect(item(bom, 'SURV-CAMERA-JB-WHITE')).toMatchObject({ quantity: 8 });
  });

  it('includes access control', () => {
    expect(item(bom, 'AC-KISI-CONTROLLER')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'AC-KISI-READER')).toMatchObject({ quantity: 2 });
  });

  it('includes front desk and wifi items', () => {
    expect(item(bom, 'FD-CC-TERMINAL')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'PP-WIFI-AP')).toMatchObject({ quantity: 1 });
  });

  it('has correct item count (32 template + 4 conditional)', () => {
    expect(bom).toHaveLength(36);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PBK tier
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Conditional item tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — conditional items', () => {
  it('excludes front desk items when has_front_desk=false', () => {
    const bom = generateBOM('pro', 4, 2, 8, false, true);
    expect(item(bom, 'FD-CC-TERMINAL')).toBeUndefined();
    expect(item(bom, 'FD-QR-SCANNER')).toBeUndefined();
    expect(item(bom, 'FD-WEBCAM')).toBeUndefined();
    // wifi still present
    expect(item(bom, 'PP-WIFI-AP')).toMatchObject({ quantity: 1 });
  });

  it('excludes wifi AP when has_pingpod_wifi=false', () => {
    const bom = generateBOM('pro', 4, 2, 8, true, false);
    expect(item(bom, 'PP-WIFI-AP')).toBeUndefined();
    // front desk still present
    expect(item(bom, 'FD-CC-TERMINAL')).toMatchObject({ quantity: 1 });
  });

  it('excludes both when both flags are false', () => {
    const bom = generateBOM('pro', 4, 2, 8, false, false);
    expect(item(bom, 'FD-CC-TERMINAL')).toBeUndefined();
    expect(item(bom, 'PP-WIFI-AP')).toBeUndefined();
    expect(bom).toHaveLength(25);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SSD sizing substitution
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — SSD sizing', () => {
  it('uses 1TB SSD for 1-4 courts', () => {
    const bom = generateBOM('pro', 4, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-1TB')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-2TB')).toBeUndefined();
    expect(item(bom, 'REPLAY-SSD-4TB')).toBeUndefined();
  });

  it('uses 2TB SSD for 5-8 courts', () => {
    const bom = generateBOM('pro', 6, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-2TB')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-1TB')).toBeUndefined();
  });

  it('uses 4TB SSD for 9+ courts', () => {
    const bom = generateBOM('pro', 9, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-4TB')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-1TB')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Switch sizing substitution
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — switch sizing', () => {
  it('uses 24-port switch for ≤8 courts (pro)', () => {
    const bom = generateBOM('pro', 8, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-24-POE')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-48-POE')).toBeUndefined();
  });

  it('uses 48-port switch for 9-16 courts (pro)', () => {
    const bom = generateBOM('pro', 10, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-48-POE')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-24-POE')).toBeUndefined();
  });

  it('upgrades to 48-port switch when autonomous port count exceeds 22', () => {
    // 8 courts × 3 + 2 + 0 cameras = 26 ports > 22 → 48-port
    const bom = generateBOM('autonomous', 8, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-48-POE')).toMatchObject({ quantity: 1 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NVR sizing substitution (autonomous_plus only)
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — NVR sizing (autonomous_plus)', () => {
  it('uses 4-bay NVR (SURV-UNVR) for 1-4 cameras', () => {
    const bom = generateBOM('autonomous_plus', 4, 2, 4, false, false);
    expect(item(bom, 'SURV-UNVR')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'SURV-UNVR-PRO')).toBeUndefined();
  });

  it('uses 7-bay NVR (SURV-UNVR-PRO) for 5+ cameras', () => {
    const bom = generateBOM('autonomous_plus', 4, 2, 5, false, false);
    expect(item(bom, 'SURV-UNVR-PRO')).toMatchObject({ quantity: 1 });
    expect(item(bom, 'SURV-UNVR')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Quantity scaling
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — quantity scaling', () => {
  it('scales camera-related items with camera_count', () => {
    const bom3 = generateBOM('autonomous_plus', 4, 2, 3, false, false);
    const bom10 = generateBOM('autonomous_plus', 4, 2, 10, false, false);
    expect(item(bom3, 'SURV-CAMERA-WHITE')?.quantity).toBe(3);
    expect(item(bom10, 'SURV-CAMERA-WHITE')?.quantity).toBe(10);
    expect(item(bom3, 'SURV-HDD')?.quantity).toBe(3);
    expect(item(bom10, 'SURV-HDD')?.quantity).toBe(10);
  });

  it('scales door items with door_count', () => {
    const bom1 = generateBOM('autonomous', 4, 1, 0, false, false);
    const bom5 = generateBOM('autonomous', 4, 5, 0, false, false);
    expect(item(bom1, 'AC-KISI-READER')?.quantity).toBe(1);
    expect(item(bom5, 'AC-KISI-READER')?.quantity).toBe(5);
  });

  it('scales replay cameras and flics with court_count', () => {
    const bom2 = generateBOM('pro', 2, 0, 0, false, false);
    const bom6 = generateBOM('pro', 6, 0, 0, false, false);
    expect(item(bom2, 'REPLAY-CAMERA-WHITE')?.quantity).toBe(2);
    expect(item(bom6, 'REPLAY-CAMERA-WHITE')?.quantity).toBe(6);
    // 2 flics per court
    expect(item(bom2, 'REPLAY-FLIC')?.quantity).toBe(4);
    expect(item(bom6, 'REPLAY-FLIC')?.quantity).toBe(12);
  });

  it('scales 1ft patch cables with court_count (3 per court)', () => {
    const bom = generateBOM('pro', 5, 0, 0, false, false);
    expect(item(bom, 'NET-PATCH-1FT')?.quantity).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Item names and unit costs
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBOM — item names and unit costs', () => {
  const bom = generateBOM('pro', 4, 2, 8, true, true);

  it('returns correct name for key items', () => {
    expect(item(bom, 'NET-UDM-SE')?.name).toBe('UniFi UDM-SE Gateway');
    expect(item(bom, 'REPLAY-MACMINI')?.name).toBe('Mac Mini 16GB 256GB');
    expect(item(bom, 'DISPLAY-TV-65')?.name).toBe('65" TV Display');
    expect(item(bom, 'FD-CC-TERMINAL')?.name).toBe('BBPOS WisePOS E Credit Card Terminal');
    expect(item(bom, 'PP-WIFI-AP')?.name).toBe('UniFi U6-Plus WiFi Access Point');
  });

  it('returns correct unit costs for key items', () => {
    expect(item(bom, 'NET-UDM-SE')?.unitCost).toBe(379.00);
    expect(item(bom, 'REPLAY-MACMINI')?.unitCost).toBe(700.00);
    expect(item(bom, 'DISPLAY-TV-65')?.unitCost).toBe(500.00);
    expect(item(bom, 'FD-CC-TERMINAL')?.unitCost).toBe(249.00);
    expect(item(bom, 'PP-WIFI-AP')?.unitCost).toBe(99.00);
  });
});
