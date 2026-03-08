/**
 * Tests for SSD and switch sizing boundary conditions.
 * Stage 066: Tests for sizing edge cases
 */

import { describe, it, expect } from 'vitest';
import { generateBOM } from '@/lib/bom-generation';
import type { ProjectBomItem } from '@/lib/bom-generation';

// Helper: find item by SKU
function item(bom: ProjectBomItem[], sku: string) {
  return bom.find((i) => i.sku === sku);
}

// ─────────────────────────────────────────────────────────────────────────────
// SSD sizing boundary: 4 → 5 courts
// ─────────────────────────────────────────────────────────────────────────────

describe('SSD sizing boundary — 4 courts vs 5 courts', () => {
  it('4 courts returns REPLAY-SSD-1TB with qty 1', () => {
    const bom = generateBOM('pro', 4, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-1TB')).toMatchObject({ sku: 'REPLAY-SSD-1TB', quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-2TB')).toBeUndefined();
    expect(item(bom, 'REPLAY-SSD-4TB')).toBeUndefined();
  });

  it('5 courts returns REPLAY-SSD-2TB with qty 1', () => {
    const bom = generateBOM('pro', 5, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-2TB')).toMatchObject({ sku: 'REPLAY-SSD-2TB', quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-1TB')).toBeUndefined();
    expect(item(bom, 'REPLAY-SSD-4TB')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SSD sizing boundary: 8 → 9 courts
// ─────────────────────────────────────────────────────────────────────────────

describe('SSD sizing boundary — 8 courts vs 9 courts', () => {
  it('8 courts returns REPLAY-SSD-2TB with qty 1', () => {
    const bom = generateBOM('pro', 8, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-2TB')).toMatchObject({ sku: 'REPLAY-SSD-2TB', quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-1TB')).toBeUndefined();
    expect(item(bom, 'REPLAY-SSD-4TB')).toBeUndefined();
  });

  it('9 courts returns REPLAY-SSD-4TB with qty 1', () => {
    const bom = generateBOM('pro', 9, 0, 0, false, false);
    expect(item(bom, 'REPLAY-SSD-4TB')).toMatchObject({ sku: 'REPLAY-SSD-4TB', quantity: 1 });
    expect(item(bom, 'REPLAY-SSD-1TB')).toBeUndefined();
    expect(item(bom, 'REPLAY-SSD-2TB')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Switch sizing boundary: 8 → 9 courts (pro tier)
// ─────────────────────────────────────────────────────────────────────────────

describe('Switch sizing boundary — 8 courts vs 9 courts (pro)', () => {
  it('8 courts returns NET-USW-PRO-24-POE with qty 1', () => {
    const bom = generateBOM('pro', 8, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-24-POE')).toMatchObject({ sku: 'NET-USW-PRO-24-POE', quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-48-POE')).toBeUndefined();
  });

  it('9 courts returns NET-USW-PRO-48-POE with qty 1', () => {
    const bom = generateBOM('pro', 9, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-48-POE')).toMatchObject({ sku: 'NET-USW-PRO-48-POE', quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-24-POE')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Switch sizing boundary: 16 → 17 courts (pro tier)
// ─────────────────────────────────────────────────────────────────────────────

describe('Switch sizing boundary — 16 courts vs 17 courts (pro)', () => {
  it('16 courts returns NET-USW-PRO-48-POE with qty 1', () => {
    const bom = generateBOM('pro', 16, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-48-POE')).toMatchObject({ sku: 'NET-USW-PRO-48-POE', quantity: 1 });
    expect(item(bom, 'NET-USW-PRO-24-POE')).toBeUndefined();
  });

  it('17 courts returns NET-USW-PRO-48-POE with qty 2', () => {
    const bom = generateBOM('pro', 17, 0, 0, false, false);
    expect(item(bom, 'NET-USW-PRO-48-POE')).toMatchObject({ sku: 'NET-USW-PRO-48-POE', quantity: 2 });
    expect(item(bom, 'NET-USW-PRO-24-POE')).toBeUndefined();
  });
});
