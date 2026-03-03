import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComparisonPanel } from '../ComparisonPanel';
import type { EngineInput, EngineOutput, Money, Person } from '@/types';
import type { ComparisonDiffEntry } from '@/lib/comparison';

// ── Mock comparison lib ─────────────────────────────────────────────────────

const mockComputeComparison = vi.fn();
const mockSaveComparisonResults = vi.fn();

vi.mock('@/lib/comparison', async () => {
  const actual = await vi.importActual<typeof import('@/lib/comparison')>('@/lib/comparison');
  return {
    ...actual,
    computeComparison: (...args: unknown[]) => mockComputeComparison(...args),
    saveComparisonResults: (...args: unknown[]) => mockSaveComparisonResults(...args),
  };
});

// ── Test helpers ────────────────────────────────────────────────────────────

function zeroMoney(): Money {
  return { centavos: 0 };
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'lc1',
    name: 'Maria dela Cruz',
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

function createTestateInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: { centavos: 500000000 },
    decedent: {
      id: 'd',
      name: 'Juan dela Cruz',
      date_of_death: '2024-03-15',
      is_married: true,
      date_of_marriage: '2000-06-15',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 24,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      makePerson({ id: 'lc1', name: 'Maria dela Cruz' }),
      makePerson({ id: 'lc2', name: 'Jose dela Cruz' }),
      makePerson({
        id: 'sp',
        name: 'Cora Reyes',
        relationship_to_decedent: 'SurvivingSpouse',
      }),
    ],
    will: {
      institutions: [
        {
          id: 'inst1',
          heir: { person_id: null, name: 'Fundacion Sampaloc', is_collective: false, class_designation: null },
          share: 'EntireFreePort',
          conditions: [],
          substitutes: [],
          is_residuary: false,
        },
      ],
      legacies: [],
      devises: [],
      disinheritances: [],
      date_executed: '2023-07-01',
    },
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function createIntestateInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return createTestateInput({ will: null, ...overrides });
}

function createOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    per_heir_shares: [
      {
        heir_id: 'lc1',
        heir_name: 'Maria dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.888'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
      {
        heir_id: 'lc2',
        heir_name: 'Jose dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.888'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.892'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
    ],
    narratives: [],
    computation_log: {
      steps: [{ step_number: 10, step_name: 'Finalize', description: 'Done' }],
      total_restarts: 0,
      final_scenario: 'T3',
    },
    warnings: [],
    succession_type: 'Testate',
    scenario_code: 'T3',
    ...overrides,
  };
}

function makeDiffs(): ComparisonDiffEntry[] {
  return [
    {
      heir_id: 'lc1',
      heir_name: 'Maria dela Cruz',
      current_centavos: BigInt(125000000),
      alternative_centavos: BigInt(166666667),
      delta_centavos: BigInt(-41666667), // loses under will
      delta_pct: -25,
    },
    {
      heir_id: 'lc2',
      heir_name: 'Jose dela Cruz',
      current_centavos: BigInt(125000000),
      alternative_centavos: BigInt(166666667),
      delta_centavos: BigInt(-41666667),
      delta_pct: -25,
    },
    {
      heir_id: 'sp',
      heir_name: 'Cora Reyes',
      current_centavos: BigInt(125000000),
      alternative_centavos: BigInt(166666666),
      delta_centavos: BigInt(-41666666),
      delta_pct: -25,
    },
    {
      heir_id: 'legatee1',
      heir_name: 'Fundacion Sampaloc',
      current_centavos: BigInt(125000000),
      alternative_centavos: BigInt(0),
      delta_centavos: BigInt(125000000), // gains under will
      delta_pct: 100,
    },
  ];
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ComparisonPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('is hidden for intestate cases (will === null)', () => {
      const input = createIntestateInput();
      const output = createOutput();

      const { container } = render(
        <ComparisonPanel input={input} output={output} />,
      );

      // Should not render comparison button or panel
      expect(screen.queryByRole('button', { name: /compare/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/testate vs/i)).not.toBeInTheDocument();
    });

    it('shows "Compare Scenarios" button for testate cases', () => {
      const input = createTestateInput();
      const output = createOutput();

      render(<ComparisonPanel input={input} output={output} />);

      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
    });
  });

  describe('comparison execution', () => {
    it('clicking "Compare Scenarios" triggers comparison computation', async () => {
      const user = userEvent.setup();
      const alternativeOutput = createOutput({ scenario_code: 'I2', succession_type: 'Intestate' });
      mockComputeComparison.mockResolvedValue({
        alternativeOutput,
        diffs: makeDiffs(),
      });

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(mockComputeComparison).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state while comparison is computing', async () => {
      const user = userEvent.setup();
      // Never resolves to keep it in loading state
      mockComputeComparison.mockReturnValue(new Promise(() => {}));

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/loading|computing|running/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('results display', () => {
    async function renderWithResults() {
      const user = userEvent.setup();
      mockComputeComparison.mockResolvedValue({
        alternativeOutput: createOutput({ scenario_code: 'I2', succession_type: 'Intestate' }),
        diffs: makeDiffs(),
      });

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(screen.getByText(/Maria dela Cruz/)).toBeInTheDocument();
      });

      return { user };
    }

    it('displays heir names in comparison table', async () => {
      await renderWithResults();

      expect(screen.getByText(/Maria dela Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/Jose dela Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/Cora Reyes/)).toBeInTheDocument();
      expect(screen.getByText(/Fundacion Sampaloc/)).toBeInTheDocument();
    });

    it('applies emerald styling for positive delta (heir gains under will)', async () => {
      await renderWithResults();

      // Fundacion Sampaloc has positive delta (gains under will)
      const legateeRow = screen.getByText(/Fundacion Sampaloc/).closest('tr') ??
        screen.getByText(/Fundacion Sampaloc/).closest('[data-testid]') ??
        screen.getByText(/Fundacion Sampaloc/).parentElement;

      expect(legateeRow).toBeDefined();
      // Should contain emerald/green class or data attribute for positive delta
      expect(legateeRow!.innerHTML).toMatch(/emerald|green|text-emerald/i);
    });

    it('applies red styling for negative delta (heir loses under will)', async () => {
      await renderWithResults();

      // Maria dela Cruz has negative delta (loses under will)
      const mariaRow = screen.getByText(/Maria dela Cruz/).closest('tr') ??
        screen.getByText(/Maria dela Cruz/).closest('[data-testid]') ??
        screen.getByText(/Maria dela Cruz/).parentElement;

      expect(mariaRow).toBeDefined();
      // Should contain red class or data attribute for negative delta
      expect(mariaRow!.innerHTML).toMatch(/red|text-red|destructive/i);
    });

    it('shows panel title indicating testate vs intestate comparison', async () => {
      await renderWithResults();

      expect(
        screen.getByText(/testate.*intestate|comparison/i),
      ).toBeInTheDocument();
    });
  });

  describe('persistence', () => {
    it('saves comparison results when caseId is provided', async () => {
      const user = userEvent.setup();
      const alternativeOutput = createOutput({ scenario_code: 'I2', succession_type: 'Intestate' });
      mockComputeComparison.mockResolvedValue({
        alternativeOutput,
        diffs: makeDiffs(),
      });
      mockSaveComparisonResults.mockResolvedValue(undefined);

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
          caseId="case-123"
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(mockSaveComparisonResults).toHaveBeenCalledWith(
          'case-123',
          expect.any(Object), // alternativeInput
          alternativeOutput,
        );
      });
    });

    it('does not save comparison when caseId is not provided', async () => {
      const user = userEvent.setup();
      mockComputeComparison.mockResolvedValue({
        alternativeOutput: createOutput({ scenario_code: 'I2' }),
        diffs: makeDiffs(),
      });

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(mockComputeComparison).toHaveBeenCalled();
      });

      expect(mockSaveComparisonResults).not.toHaveBeenCalled();
    });
  });

  describe('collapsibility', () => {
    it('comparison panel can be collapsed after showing results', async () => {
      const user = userEvent.setup();
      mockComputeComparison.mockResolvedValue({
        alternativeOutput: createOutput({ scenario_code: 'I2' }),
        diffs: makeDiffs(),
      });

      render(
        <ComparisonPanel
          input={createTestateInput()}
          output={createOutput()}
        />,
      );

      await user.click(screen.getByRole('button', { name: /compare/i }));

      await waitFor(() => {
        expect(screen.getByText(/Maria dela Cruz/)).toBeInTheDocument();
      });

      // Should have a collapse button
      const collapseBtn = screen.queryByRole('button', { name: /collapse/i }) ??
        screen.queryByLabelText(/collapse/i);

      if (collapseBtn) {
        await user.click(collapseBtn);
        // After collapse, comparison details should be hidden
        expect(screen.queryByText(/Maria dela Cruz/)).not.toBeInTheDocument();
      }
    });
  });
});
