import { describe, it, expect } from 'vitest';
import { calculateCostChain } from '../../lib/cost-chain';

describe('calculateCostChain', () => {
  describe('known values: unitCost=$100, qty=5, tax=8.25%, shipping=5%, margin=30%', () => {
    const result = calculateCostChain(100, 5, 0.0825, 0.05, 0.30);

    it('total = 500.00', () => {
      expect(result.total).toBe(500.00);
    });

    it('tax = 41.25', () => {
      expect(result.tax).toBe(41.25);
    });

    it('shipping = 25.00', () => {
      expect(result.shipping).toBe(25.00);
    });

    it('landedCost = 566.25', () => {
      expect(result.landedCost).toBe(566.25);
    });

    it('margin = 169.88', () => {
      expect(result.margin).toBe(169.88);
    });

    it('customerPrice = 736.13', () => {
      expect(result.customerPrice).toBe(736.13);
    });
  });

  describe('edge case: quantity=1, all rates non-zero', () => {
    it('computes correctly for qty=1', () => {
      const result = calculateCostChain(100, 1, 0.0825, 0.05, 0.30);
      expect(result.total).toBe(100.00);
      expect(result.tax).toBe(8.25);
      expect(result.shipping).toBe(5.00);
      expect(result.landedCost).toBe(113.25);
      expect(result.margin).toBe(33.98);
      expect(result.customerPrice).toBe(147.23);
    });
  });

  describe('edge case: zero tax rate', () => {
    it('tax = 0, landedCost excludes tax', () => {
      const result = calculateCostChain(100, 5, 0, 0.05, 0.30);
      expect(result.tax).toBe(0);
      expect(result.landedCost).toBe(525.00);
    });
  });

  describe('edge case: zero shipping rate', () => {
    it('shipping = 0, landedCost excludes shipping', () => {
      const result = calculateCostChain(100, 5, 0.0825, 0, 0.30);
      expect(result.shipping).toBe(0);
      expect(result.landedCost).toBe(541.25);
    });
  });

  describe('edge case: zero margin target', () => {
    it('margin = 0, customerPrice = landedCost', () => {
      const result = calculateCostChain(100, 5, 0.0825, 0.05, 0);
      expect(result.margin).toBe(0);
      expect(result.customerPrice).toBe(result.landedCost);
    });
  });

  describe('all output values are rounded to 2 decimal places', () => {
    it('no value has more than 2 decimal places', () => {
      const result = calculateCostChain(99.99, 3, 0.0825, 0.05, 0.30);
      for (const key of Object.keys(result) as (keyof typeof result)[]) {
        const val = result[key];
        const rounded = Math.round(val * 100) / 100;
        expect(val).toBe(rounded);
      }
    });
  });
});
