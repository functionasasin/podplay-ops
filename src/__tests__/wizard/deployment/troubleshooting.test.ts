import { describe, it, expect } from 'vitest';
import { getTroubleshootingForPhase } from '../../../components/wizard/deployment/TroubleshootingTips';

// Re-export the const for testing (it's not exported yet — tests import via the named export)
// We'll use getTroubleshootingForPhase to derive all entries by checking phases 0–15.

function allEntries() {
  // Collect unique entries across all phases
  const seen = new Set<number>();
  const result = [];
  for (let p = 0; p <= 15; p++) {
    for (const e of getTroubleshootingForPhase(p)) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push(e);
      }
    }
  }
  return result.sort((a, b) => a.sort_order - b.sort_order);
}

describe('TroubleshootingTips — data', () => {
  it('has 16 total troubleshooting entries', () => {
    expect(allEntries()).toHaveLength(16);
  });

  it('every entry has a non-empty symptom', () => {
    const entries = allEntries();
    for (const e of entries) {
      expect(e.symptom.length, `entry id=${e.id} missing symptom`).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty solution', () => {
    const entries = allEntries();
    for (const e of entries) {
      expect(e.solution.length, `entry id=${e.id} missing solution`).toBeGreaterThan(0);
    }
  });

  it('every entry has at least one phase in range 0–15', () => {
    const entries = allEntries();
    for (const e of entries) {
      expect(e.phases.length, `entry id=${e.id} has no phases`).toBeGreaterThan(0);
      for (const p of e.phases) {
        expect(p, `entry id=${e.id} has out-of-range phase`).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe('getTroubleshootingForPhase — phase filtering', () => {
  it('phase 3 returns 1 entry (Mac Mini overheating)', () => {
    const tips = getTroubleshootingForPhase(3);
    expect(tips).toHaveLength(1);
    expect(tips[0].symptom).toContain('overheating');
  });

  it('phase 10 returns 4 entries', () => {
    const tips = getTroubleshootingForPhase(10);
    expect(tips).toHaveLength(4);
  });

  it('phase 12 returns 4 entries', () => {
    const tips = getTroubleshootingForPhase(12);
    expect(tips).toHaveLength(4);
  });

  it('phase 13 (Testing & Verification) returns 9 entries', () => {
    const tips = getTroubleshootingForPhase(13);
    expect(tips).toHaveLength(9);
  });

  it('phases 0, 1, 2, 15 return no entries', () => {
    for (const p of [0, 1, 2, 15]) {
      expect(getTroubleshootingForPhase(p), `phase ${p} should be empty`).toHaveLength(0);
    }
  });

  it('phase 8 returns Entry 1 (black screen) and Entry 9 (.DS_Store)', () => {
    const tips = getTroubleshootingForPhase(8);
    const symptoms = tips.map((t) => t.symptom);
    expect(symptoms.some((s) => s.includes('black screen'))).toBe(true);
    expect(symptoms.some((s) => s.includes('.DS_Store'))).toBe(true);
  });

  it('phase 9 returns .DS_Store entry', () => {
    const tips = getTroubleshootingForPhase(9);
    expect(tips.some((t) => t.symptom.includes('.DS_Store'))).toBe(true);
  });

  it('entries within a phase are sorted by sort_order ascending', () => {
    const tips = getTroubleshootingForPhase(13);
    for (let i = 1; i < tips.length; i++) {
      expect(tips[i].sort_order).toBeGreaterThanOrEqual(tips[i - 1].sort_order);
    }
  });
});

describe('getTroubleshootingForPhase — phase-to-entry correctness', () => {
  it('Entry 8 (port 4000) appears in phases 4, 5, and 13', () => {
    const e4 = getTroubleshootingForPhase(4);
    const e5 = getTroubleshootingForPhase(5);
    const e13 = getTroubleshootingForPhase(13);
    const inPhase4 = e4.some((t) => t.symptom.includes('port 4000') || t.symptom.includes('4000/health'));
    const inPhase5 = e5.some((t) => t.symptom.includes('4000/health'));
    const inPhase13 = e13.some((t) => t.symptom.includes('4000/health'));
    expect(inPhase4).toBe(true);
    expect(inPhase5).toBe(true);
    expect(inPhase13).toBe(true);
  });

  it('Entry 10 (wrong club name) appears in phases 10 and 11', () => {
    const e10 = getTroubleshootingForPhase(10);
    const e11 = getTroubleshootingForPhase(11);
    expect(e10.some((t) => t.symptom.includes('wrong club'))).toBe(true);
    expect(e11.some((t) => t.symptom.includes('wrong club'))).toBe(true);
  });

  it('Entry 1 (Mac Mini black screen) appears in phases 8, 13, and 14', () => {
    const e8 = getTroubleshootingForPhase(8);
    const e13 = getTroubleshootingForPhase(13);
    const e14 = getTroubleshootingForPhase(14);
    expect(e8.some((t) => t.symptom.includes('black screen'))).toBe(true);
    expect(e13.some((t) => t.symptom.includes('black screen'))).toBe(true);
    expect(e14.some((t) => t.symptom.includes('black screen'))).toBe(true);
  });

  it('Entry 5 (Flic pairing / App Lock) is critical severity in phase 12', () => {
    const tips = getTroubleshootingForPhase(12);
    const entry = tips.find((t) => t.symptom.includes('Pairing Failed') || t.symptom.includes('Verification Failed'));
    expect(entry).toBeDefined();
    expect(entry!.severity).toBe('critical');
    expect(entry!.support_tier).toBe('tier_2');
  });

  it('Entry 14 (dead battery / no LED blink) has info severity', () => {
    const tips = getTroubleshootingForPhase(12);
    const entry = tips.find((t) => t.symptom.includes('no LED blink'));
    expect(entry).toBeDefined();
    expect(entry!.severity).toBe('info');
    expect(entry!.support_tier).toBe('tier_1');
  });

  it('Entry 11 (pixelation) has tier_3 support tier', () => {
    const tips = getTroubleshootingForPhase(9);
    const entry = tips.find((t) => t.symptom.includes('pixelation'));
    expect(entry).toBeDefined();
    expect(entry!.support_tier).toBe('tier_3');
    expect(entry!.severity).toBe('warning');
  });
});
