import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultsView } from '../ResultsView';
import type { EngineInput, EngineOutput, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function createInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: { centavos: 500000000 },
    decedent: {
      id: 'd',
      name: 'Test Decedent',
      date_of_death: '2026-01-15',
      is_married: true,
      date_of_marriage: '2000-06-15',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 25,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      {
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
      },
      {
        id: 'sp',
        name: 'Maria Cruz',
        is_alive_at_succession: true,
        relationship_to_decedent: 'SurvivingSpouse',
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
      },
    ],
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function createOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    per_heir_shares: [
      {
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
        legal_basis: ['Art. 888'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 250000000 },
        net_from_estate: { centavos: 250000000 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Maria Cruz',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 250000000 },
        legitime_fraction: '',
        legal_basis: ['Art. 892'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 250000000 },
        net_from_estate: { centavos: 250000000 },
      },
    ],
    narratives: [
      {
        heir_id: 'lc1',
        heir_name: 'Juan Cruz',
        heir_category_label: 'legitimate child',
        text: '**Juan Cruz (Legitimate Child)** receives **₱2,500,000**.',
      },
      {
        heir_id: 'sp',
        heir_name: 'Maria Cruz',
        heir_category_label: 'surviving spouse',
        text: '**Maria Cruz (Surviving Spouse)** receives **₱2,500,000**.',
      },
    ],
    computation_log: {
      steps: [
        {
          step_number: 10,
          step_name: 'Finalize + Narrate',
          description: 'Converted fractional shares to peso amounts and generated narratives',
        },
      ],
      total_restarts: 0,
      final_scenario: 'I2',
    },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I2',
    ...overrides,
  };
}

function renderResults(overrides: {
  input?: EngineInput;
  output?: EngineOutput;
  onEditInput?: () => void;
} = {}) {
  return render(
    <ResultsView
      input={overrides.input ?? createInput()}
      output={overrides.output ?? createOutput()}
      onEditInput={overrides.onEditInput ?? vi.fn()}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — ResultsView container (results)
// --------------------------------------------------------------------------

describe('results > ResultsView', () => {
  describe('rendering', () => {
    it('renders the results view container', () => {
      renderResults();
      expect(screen.getByTestId('results-view')).toBeInTheDocument();
    });

    it('renders ResultsHeader section', () => {
      renderResults();
      expect(screen.getByTestId('results-header')).toBeInTheDocument();
    });

    it('renders DistributionSection', () => {
      renderResults();
      expect(screen.getByTestId('distribution-section')).toBeInTheDocument();
    });

    it('renders NarrativePanel', () => {
      renderResults();
      expect(screen.getByTestId('narrative-panel')).toBeInTheDocument();
    });

    it('renders WarningsPanel', () => {
      renderResults();
      expect(screen.getByTestId('warnings-panel')).toBeInTheDocument();
    });

    it('renders ComputationLog', () => {
      renderResults();
      expect(screen.getByTestId('computation-log')).toBeInTheDocument();
    });

    it('renders ActionsBar', () => {
      renderResults();
      expect(screen.getByTestId('actions-bar')).toBeInTheDocument();
    });
  });

  describe('data flow', () => {
    it('passes scenario code to header', () => {
      renderResults({
        output: createOutput({ scenario_code: 'I2' }),
      });
      expect(screen.getByText('I2')).toBeInTheDocument();
    });

    it('passes succession type to header', () => {
      renderResults({
        output: createOutput({ succession_type: 'Intestate' }),
      });
      expect(screen.getByText(/Intestate Succession/i)).toBeInTheDocument();
    });

    it('passes heir shares to distribution section', () => {
      renderResults();
      // Both heirs should appear
      expect(screen.getByText('Juan Cruz')).toBeInTheDocument();
      expect(screen.getByText('Maria Cruz')).toBeInTheDocument();
    });

    it('passes narratives to narrative panel', () => {
      renderResults();
      expect(screen.getByText(/Heir Narratives/i)).toBeInTheDocument();
    });

    it('hides warnings section when warnings are empty', () => {
      renderResults({
        output: createOutput({ warnings: [] }),
      });
      expect(screen.queryByText(/Manual Review Required/i)).not.toBeInTheDocument();
    });

    it('shows warnings when present', () => {
      renderResults({
        output: createOutput({
          warnings: [
            { category: 'preterition', description: 'Heir omitted', related_heir_id: null },
          ],
        }),
      });
      expect(screen.getByText(/Manual Review Required/i)).toBeInTheDocument();
    });
  });

  describe('estate total from input', () => {
    it('displays estate total from input in header', () => {
      renderResults({
        input: createInput({ net_distributable_estate: { centavos: 1000000000 } }),
      });
      expect(screen.getByText(/₱10,000,000/)).toBeInTheDocument();
    });
  });

  describe('testate output', () => {
    it('renders testate succession correctly', () => {
      renderResults({
        output: createOutput({
          succession_type: 'Testate',
          scenario_code: 'T2',
        }),
      });
      expect(screen.getByText('T2')).toBeInTheDocument();
      expect(screen.getByText(/Testate Succession/i)).toBeInTheDocument();
    });
  });

  describe('escheat scenario', () => {
    it('renders escheat scenario (I15) correctly', () => {
      renderResults({
        output: createOutput({
          succession_type: 'Intestate',
          scenario_code: 'I15',
          per_heir_shares: [],
          narratives: [],
        }),
      });
      expect(screen.getByText('I15')).toBeInTheDocument();
      expect(screen.getByText(/Estate Escheats to the State/i)).toBeInTheDocument();
    });
  });
});
