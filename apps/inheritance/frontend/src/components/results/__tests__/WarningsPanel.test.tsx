import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WarningsPanel } from '../WarningsPanel';
import type { ManualFlag, InheritanceShare, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function createFlag(overrides: Partial<ManualFlag> = {}): ManualFlag {
  return {
    category: 'preterition',
    description: 'Maria Cruz was omitted from will.',
    related_heir_id: null,
    ...overrides,
  };
}

function createShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'lc1',
    heir_name: 'Juan Cruz',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: zeroMoney(),
    from_free_portion: zeroMoney(),
    from_intestate: zeroMoney(),
    total: { centavos: 250000000 },
    legitime_fraction: '',
    legal_basis: [],
    donations_imputed: zeroMoney(),
    gross_entitlement: { centavos: 250000000 },
    net_from_estate: { centavos: 250000000 },
    ...overrides,
  };
}

function renderWarnings(overrides: {
  warnings?: ManualFlag[];
  shares?: InheritanceShare[];
} = {}) {
  return render(
    <WarningsPanel
      warnings={overrides.warnings ?? []}
      shares={overrides.shares ?? []}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — WarningsPanel (results)
// --------------------------------------------------------------------------

describe('results > WarningsPanel', () => {
  describe('empty state', () => {
    it('renders the warnings panel container', () => {
      renderWarnings();
      expect(screen.getByTestId('warnings-panel')).toBeInTheDocument();
    });

    it('hides content when warnings array is empty', () => {
      renderWarnings({ warnings: [] });
      expect(screen.queryByText(/Manual Review Required/i)).not.toBeInTheDocument();
    });
  });

  describe('with warnings', () => {
    it('shows "Manual Review Required" heading when warnings exist', () => {
      renderWarnings({
        warnings: [createFlag()],
      });
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();
    });

    it('renders one card per warning', () => {
      renderWarnings({
        warnings: [
          createFlag({ category: 'preterition', description: 'Preterition detected' }),
          createFlag({ category: 'inofficiousness', description: 'Dispositions reduced' }),
        ],
      });
      expect(screen.getByText(/Preterition detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Dispositions reduced/i)).toBeInTheDocument();
    });

    it('shows warning description text', () => {
      renderWarnings({
        warnings: [createFlag({ description: 'Maria Cruz was omitted from will.' })],
      });
      expect(screen.getByText(/Maria Cruz was omitted from will/)).toBeInTheDocument();
    });
  });

  describe('severity styling', () => {
    it('preterition warning has error severity (red)', () => {
      renderWarnings({
        warnings: [createFlag({ category: 'preterition' })],
      });
      const card = screen.getByTestId('warning-card-0');
      expect(card.className).toMatch(/red|error/);
    });

    it('inofficiousness warning has warning severity (amber)', () => {
      renderWarnings({
        warnings: [createFlag({ category: 'inofficiousness', description: 'Reduced' })],
      });
      const card = screen.getByTestId('warning-card-0');
      expect(card.className).toMatch(/amber|warning/);
    });

    it('unknown_donee has info severity (blue)', () => {
      renderWarnings({
        warnings: [createFlag({ category: 'unknown_donee', description: 'Unknown donee' })],
      });
      const card = screen.getByTestId('warning-card-0');
      expect(card.className).toMatch(/blue|info/);
    });

    it('max_restarts has error severity', () => {
      renderWarnings({
        warnings: [createFlag({ category: 'max_restarts', description: 'Pipeline failed' })],
      });
      const card = screen.getByTestId('warning-card-0');
      expect(card.className).toMatch(/red|error/);
    });
  });

  describe('related heir resolution', () => {
    it('shows related heir name when related_heir_id matches a share', () => {
      renderWarnings({
        warnings: [createFlag({ related_heir_id: 'lc1', description: 'Heir issue' })],
        shares: [createShare({ heir_id: 'lc1', heir_name: 'Juan Cruz' })],
      });
      expect(screen.getByText(/Juan Cruz/)).toBeInTheDocument();
    });
  });
});
