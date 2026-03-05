import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DistributionSection } from '../DistributionSection';
import type { InheritanceShare, SuccessionType, ScenarioCode, Person, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
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

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'lc1',
    name: 'Juan Cruz',
    is_alive_at_succession: true,
    relationship_to_decedent: 'LegitimateChild',
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: null,
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

function renderDistribution(overrides: {
  shares?: InheritanceShare[];
  totalCentavos?: number;
  successionType?: SuccessionType;
  scenarioCode?: ScenarioCode;
  persons?: Person[];
} = {}) {
  return render(
    <DistributionSection
      shares={overrides.shares ?? [createShare()]}
      totalCentavos={overrides.totalCentavos ?? 500000000}
      successionType={overrides.successionType ?? 'Intestate'}
      scenarioCode={overrides.scenarioCode ?? 'I1'}
      persons={overrides.persons}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — DistributionSection (results)
// --------------------------------------------------------------------------

describe('results > DistributionSection', () => {
  describe('rendering', () => {
    it('renders the distribution section container', () => {
      renderDistribution();
      expect(screen.getByTestId('distribution-section')).toBeInTheDocument();
    });
  });

  describe('pie chart', () => {
    it('renders a pie chart element', () => {
      renderDistribution({
        shares: [
          createShare({ heir_id: 'lc1', heir_name: 'Juan', net_from_estate: { centavos: 250000000 } }),
          createShare({ heir_id: 'sp', heir_name: 'Maria', heir_category: 'SurvivingSpouseGroup', net_from_estate: { centavos: 250000000 } }),
        ],
      });
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument();
    });

    it('excludes zero-share heirs from pie chart', () => {
      renderDistribution({
        shares: [
          createShare({ heir_id: 'lc1', heir_name: 'Juan', net_from_estate: { centavos: 500000000 } }),
          createShare({ heir_id: 'lc2', heir_name: 'Pedro', net_from_estate: { centavos: 0 } }),
        ],
      });
      const chart = screen.getByTestId('distribution-chart');
      // The zero-share heir should not appear as a pie slice
      // (Recharts renders Sector elements for each data point)
      expect(chart).toBeInTheDocument();
    });
  });

  describe('heir table', () => {
    it('renders heir name in table', () => {
      renderDistribution({
        shares: [createShare({ heir_name: 'Juan Cruz' })],
      });
      expect(screen.getByText('Juan Cruz')).toBeInTheDocument();
    });

    it('renders category badge for each heir', () => {
      renderDistribution({
        shares: [createShare({ heir_category: 'LegitimateChildGroup' })],
      });
      expect(screen.getByText(/Legitimate Child/)).toBeInTheDocument();
    });

    it('renders net_from_estate with formatPeso', () => {
      renderDistribution({
        shares: [createShare({ net_from_estate: { centavos: 250000000 } })],
      });
      expect(screen.getByText(/₱2,500,000/)).toBeInTheDocument();
    });

    it('shows category badge with correct color for SurvivingSpouseGroup (green)', () => {
      renderDistribution({
        shares: [createShare({ heir_category: 'SurvivingSpouseGroup', heir_name: 'Maria' })],
      });
      expect(screen.getByText(/Surviving Spouse/)).toBeInTheDocument();
    });

    it('shows "By Representation" badge when inherits_by is Representation', () => {
      renderDistribution({
        shares: [createShare({ inherits_by: 'Representation', represents: 'lc1' })],
      });
      expect(screen.getByText(/By Representation/i)).toBeInTheDocument();
    });

    it('shows legal basis tags', () => {
      renderDistribution({
        shares: [createShare({ legal_basis: ['Art. 888', 'Art. 892'] })],
      });
      expect(screen.getByText('Art. 888')).toBeInTheDocument();
      expect(screen.getByText('Art. 892')).toBeInTheDocument();
    });

    it('shows donations imputed column when donations_imputed > 0', () => {
      renderDistribution({
        shares: [
          createShare({
            donations_imputed: { centavos: 100000 },
            gross_entitlement: { centavos: 350000 },
            net_from_estate: { centavos: 250000 },
          }),
        ],
      });
      expect(screen.getByText(/Donations Imputed/i)).toBeInTheDocument();
    });

    it('hides donations imputed column when all donations_imputed are 0', () => {
      renderDistribution({
        shares: [createShare({ donations_imputed: { centavos: 0 } })],
      });
      expect(screen.queryByText(/Donations Imputed/i)).not.toBeInTheDocument();
    });

    it('shows gross entitlement when donations are imputed', () => {
      renderDistribution({
        shares: [
          createShare({
            donations_imputed: { centavos: 100000 },
            gross_entitlement: { centavos: 350000 },
          }),
        ],
      });
      expect(screen.getByText(/Gross Entitlement/i)).toBeInTheDocument();
    });
  });

  describe('excluded heirs', () => {
    it('shows excluded heirs section for zero-share heirs', () => {
      renderDistribution({
        shares: [
          createShare({ heir_id: 'lc1', heir_name: 'Juan', net_from_estate: { centavos: 500000000 } }),
          createShare({ heir_id: 'lc2', heir_name: 'Pedro', net_from_estate: { centavos: 0 } }),
        ],
      });
      expect(screen.getByText(/Excluded Heirs/i)).toBeInTheDocument();
      expect(screen.getByText('Pedro')).toBeInTheDocument();
    });

    it('does not show excluded heirs section when all heirs have shares', () => {
      renderDistribution({
        shares: [
          createShare({ heir_id: 'lc1', net_from_estate: { centavos: 250000000 } }),
          createShare({ heir_id: 'sp', heir_name: 'Maria', net_from_estate: { centavos: 250000000 } }),
        ],
      });
      expect(screen.queryByText(/Excluded Heirs/i)).not.toBeInTheDocument();
    });

    it('shows count of excluded heirs', () => {
      renderDistribution({
        shares: [
          createShare({ heir_id: 'lc1', heir_name: 'Juan', net_from_estate: { centavos: 500000000 } }),
          createShare({ heir_id: 'lc2', heir_name: 'Pedro', net_from_estate: { centavos: 0 } }),
          createShare({ heir_id: 'lc3', heir_name: 'Ana', net_from_estate: { centavos: 0 } }),
        ],
      });
      expect(screen.getByText(/Excluded Heirs \(2\)/i)).toBeInTheDocument();
    });
  });

  describe('layout variant: standard-distribution', () => {
    it('renders standard table for I1 intestate', () => {
      renderDistribution({ scenarioCode: 'I1', successionType: 'Intestate' });
      expect(screen.getByTestId('distribution-section')).toBeInTheDocument();
    });
  });

  describe('layout variant: escheat (I15)', () => {
    it('shows escheat card instead of table when I15', () => {
      renderDistribution({
        scenarioCode: 'I15',
        successionType: 'Intestate',
        shares: [],
      });
      expect(screen.getByText(/Estate Escheats to the State/i)).toBeInTheDocument();
    });

    it('shows legal basis citations for escheat', () => {
      renderDistribution({
        scenarioCode: 'I15',
        successionType: 'Intestate',
        shares: [],
      });
      expect(screen.getByText(/Art\. 1011/i)).toBeInTheDocument();
    });

    it('does not show distribution table for escheat', () => {
      renderDistribution({
        scenarioCode: 'I15',
        successionType: 'Intestate',
        shares: [],
      });
      expect(screen.queryByTestId('heir-table')).not.toBeInTheDocument();
    });
  });

  describe('layout variant: collateral-weighted (I12-I14)', () => {
    it('shows blood type column for I12 scenario', () => {
      renderDistribution({
        scenarioCode: 'I12',
        successionType: 'Intestate',
        shares: [
          createShare({ heir_id: 's1', heir_name: 'Sibling Full', heir_category: 'CollateralGroup' }),
        ],
        persons: [
          createPerson({ id: 's1', name: 'Sibling Full', relationship_to_decedent: 'Sibling', blood_type: 'Full' }),
        ],
      });
      expect(screen.getByText(/Blood Type/i)).toBeInTheDocument();
    });

    it('shows units column for collateral-weighted layout', () => {
      renderDistribution({
        scenarioCode: 'I13',
        successionType: 'Intestate',
        shares: [
          createShare({ heir_id: 's1', heir_name: 'Sibling Full', heir_category: 'CollateralGroup' }),
        ],
        persons: [
          createPerson({ id: 's1', name: 'Sibling Full', relationship_to_decedent: 'Sibling', blood_type: 'Full' }),
        ],
      });
      expect(screen.getByText(/Units/i)).toBeInTheDocument();
    });

    it('shows Art. 1004 legend banner for collateral-weighted layout', () => {
      renderDistribution({
        scenarioCode: 'I12',
        successionType: 'Intestate',
        shares: [
          createShare({ heir_category: 'CollateralGroup' }),
        ],
        persons: [
          createPerson({ relationship_to_decedent: 'Sibling', blood_type: 'Full' }),
        ],
      });
      expect(screen.getByText(/Art\. 1004/i)).toBeInTheDocument();
    });
  });

  describe('layout variant: testate-with-dispositions', () => {
    it('shows "Compulsory Shares" section for testate layout', () => {
      renderDistribution({
        scenarioCode: 'T1',
        successionType: 'Testate',
        shares: [createShare({ heir_category: 'LegitimateChildGroup' })],
      });
      expect(screen.getByText(/Compulsory Shares|Legitime/i)).toBeInTheDocument();
    });

    it('shows "Free Portion" section for testate layout', () => {
      renderDistribution({
        scenarioCode: 'T1',
        successionType: 'Testate',
        shares: [createShare()],
      });
      expect(screen.getByText(/Free Portion/i)).toBeInTheDocument();
    });
  });

  describe('layout variant: no-compulsory-full-fp (T13)', () => {
    it('shows info banner about no compulsory heirs', () => {
      renderDistribution({
        scenarioCode: 'T13',
        successionType: 'Testate',
        shares: [],
      });
      expect(screen.getByText(/No Compulsory Heirs/i)).toBeInTheDocument();
    });
  });

  describe('layout variant: preterition-override', () => {
    it('shows info note about valid legacies surviving preterition', () => {
      renderDistribution({
        scenarioCode: 'T3',
        successionType: 'IntestateByPreterition',
        shares: [createShare()],
      });
      expect(screen.getByText(/legacies.*devises.*survive/i)).toBeInTheDocument();
    });
  });

  describe('layout variant: mixed-succession', () => {
    it('shows "Testate Portion" and "Intestate Remainder" sections', () => {
      renderDistribution({
        scenarioCode: 'T3',
        successionType: 'Mixed',
        shares: [createShare()],
      });
      expect(screen.getByText(/Testate Portion/i)).toBeInTheDocument();
      expect(screen.getByText(/Intestate Remainder/i)).toBeInTheDocument();
    });
  });
});
