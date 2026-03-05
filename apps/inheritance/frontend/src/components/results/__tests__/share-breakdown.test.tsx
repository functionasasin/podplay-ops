import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ShareBreakdownSection } from '../ShareBreakdownSection';
import type { InheritanceShare, Money } from '../../../types';
import { formatPeso } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function createShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'lc1',
    heir_name: 'Maria Santos',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: { centavos: 50000000 },
    from_free_portion: { centavos: 12500000 },
    from_intestate: zeroMoney(),
    total: { centavos: 62500000 },
    legitime_fraction: '1/4',
    legal_basis: ['Art.887', 'Art.980'],
    donations_imputed: { centavos: 5000000 },
    gross_entitlement: { centavos: 62500000 },
    net_from_estate: { centavos: 57500000 },
    ...overrides,
  };
}

function createMinimalShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'lc1',
    heir_name: 'Maria Santos',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: zeroMoney(),
    from_free_portion: zeroMoney(),
    from_intestate: { centavos: 50000000 },
    total: { centavos: 50000000 },
    legitime_fraction: '',
    legal_basis: [],
    donations_imputed: zeroMoney(),
    gross_entitlement: { centavos: 50000000 },
    net_from_estate: { centavos: 50000000 },
    ...overrides,
  };
}

function renderShareBreakdown(shares: InheritanceShare[]) {
  return render(<ShareBreakdownSection shares={shares} />);
}

// --------------------------------------------------------------------------
// Tests — ShareBreakdownSection
// --------------------------------------------------------------------------

describe('share-breakdown > ShareBreakdownSection', () => {
  describe('expandable rows', () => {
    it('renders a trigger/row for each heir', () => {
      const shares = [
        createShare({ heir_id: 'lc1', heir_name: 'Maria Santos' }),
        createShare({ heir_id: 'lc2', heir_name: 'Pedro Santos' }),
      ];
      renderShareBreakdown(shares);
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
    });

    it('expanding heir row shows breakdown section', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ heir_name: 'Maria Santos' })];
      renderShareBreakdown(shares);

      // Breakdown content should not be visible initially
      expect(screen.queryByText(/Share Computation/)).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByText('Maria Santos'));

      // Now the breakdown should be visible
      expect(screen.getByText(/Share Computation/)).toBeInTheDocument();
    });

    it('multiple rows can be expanded simultaneously', async () => {
      const user = userEvent.setup();
      const shares = [
        createShare({ heir_id: 'lc1', heir_name: 'Maria Santos' }),
        createShare({ heir_id: 'lc2', heir_name: 'Pedro Santos' }),
      ];
      renderShareBreakdown(shares);

      // Expand both rows
      await user.click(screen.getByText('Maria Santos'));
      await user.click(screen.getByText('Pedro Santos'));

      // Both breakdowns should be visible
      const computations = screen.getAllByText(/Share Computation/);
      expect(computations.length).toBe(2);
    });
  });

  describe('conditional fields — from_legitime', () => {
    it('shows from_legitime when centavos > 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_legitime: { centavos: 50000000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/From Legitime/)).toBeInTheDocument();
      expect(screen.getByText(formatPeso(50000000))).toBeInTheDocument();
    });

    it('hides from_legitime when centavos === 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_legitime: zeroMoney() })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.queryByText(/From Legitime/)).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — from_free_portion', () => {
    it('shows from_free_portion when centavos > 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_free_portion: { centavos: 12500000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/From Free Portion/)).toBeInTheDocument();
    });

    it('hides from_free_portion when centavos === 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_free_portion: zeroMoney() })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.queryByText(/From Free Portion/)).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — from_intestate', () => {
    it('shows from_intestate when centavos > 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_intestate: { centavos: 30000000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/From Intestate/)).toBeInTheDocument();
    });

    it('hides from_intestate when centavos === 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ from_intestate: zeroMoney() })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.queryByText(/From Intestate/)).not.toBeInTheDocument();
    });
  });

  describe('always-shown fields', () => {
    it('always shows gross entitlement', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ gross_entitlement: { centavos: 62500000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/Gross Entitlement/)).toBeInTheDocument();
      expect(screen.getByText(formatPeso(62500000))).toBeInTheDocument();
    });

    it('always shows net from estate', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ net_from_estate: { centavos: 57500000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/Net from Estate/)).toBeInTheDocument();
    });
  });

  describe('legitime fraction', () => {
    it('shows legitime fraction for compulsory heir with non-empty fraction', async () => {
      const user = userEvent.setup();
      const shares = [createShare({
        heir_category: 'LegitimateChildGroup',
        legitime_fraction: '1/4',
      })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/Legitime Fraction/)).toBeInTheDocument();
      expect(screen.getByText(/1\/4/)).toBeInTheDocument();
    });

    it('hides legitime fraction when empty string', async () => {
      const user = userEvent.setup();
      const shares = [createMinimalShare({ legitime_fraction: '' })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.queryByText(/Legitime Fraction/)).not.toBeInTheDocument();
    });
  });

  describe('donations imputed', () => {
    it('shows donations imputed with negative sign when centavos > 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ donations_imputed: { centavos: 5000000 } })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/Advances on Inheritance|Donations Imputed/i)).toBeInTheDocument();
      // Should show negative sign
      const donationLine = screen.getByTestId('donations-imputed-line');
      expect(donationLine.textContent).toMatch(/[−\-]/);
    });

    it('hides donations imputed when centavos === 0', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ donations_imputed: zeroMoney() })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.queryByTestId('donations-imputed-line')).not.toBeInTheDocument();
    });
  });

  describe('section header', () => {
    it('shows heir name in breakdown title', async () => {
      const user = userEvent.setup();
      const shares = [createShare({ heir_name: 'Maria Santos' })];
      renderShareBreakdown(shares);

      await user.click(screen.getByText('Maria Santos'));
      expect(screen.getByText(/Share Computation.*Maria Santos/)).toBeInTheDocument();
    });
  });

  describe('data-testid attributes', () => {
    it('renders share-breakdown-section container', () => {
      renderShareBreakdown([createShare()]);
      expect(screen.getByTestId('share-breakdown-section')).toBeInTheDocument();
    });
  });
});
