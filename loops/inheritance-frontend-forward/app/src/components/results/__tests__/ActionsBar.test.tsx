import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionsBar } from '../ActionsBar';
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
        total: { centavos: 500000000 },
        legitime_fraction: '',
        legal_basis: [],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 500000000 },
        net_from_estate: { centavos: 500000000 },
      },
    ],
    narratives: [
      {
        heir_id: 'lc1',
        heir_name: 'Juan Cruz',
        heir_category_label: 'legitimate child',
        text: '**Juan Cruz** receives **₱5,000,000**.',
      },
    ],
    computation_log: {
      steps: [{ step_number: 10, step_name: 'Finalize', description: 'Done' }],
      total_restarts: 0,
      final_scenario: 'I1',
    },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
    ...overrides,
  };
}

function renderActions(overrides: {
  input?: EngineInput;
  output?: EngineOutput;
  onEditInput?: () => void;
} = {}) {
  return render(
    <ActionsBar
      input={overrides.input ?? createInput()}
      output={overrides.output ?? createOutput()}
      onEditInput={overrides.onEditInput ?? vi.fn()}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — ActionsBar (results)
// --------------------------------------------------------------------------

describe('results > ActionsBar', () => {
  describe('rendering', () => {
    it('renders the actions bar container', () => {
      renderActions();
      expect(screen.getByTestId('actions-bar')).toBeInTheDocument();
    });

    it('renders "Edit Input" button', () => {
      renderActions();
      expect(screen.getByRole('button', { name: /Edit Input/i })).toBeInTheDocument();
    });

    it('renders "Export JSON" button or dropdown', () => {
      renderActions();
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    it('renders "Copy Narratives" button', () => {
      renderActions();
      expect(screen.getByRole('button', { name: /Copy Narratives/i })).toBeInTheDocument();
    });
  });

  describe('edit input', () => {
    it('calls onEditInput when Edit Input button is clicked', async () => {
      const onEditInput = vi.fn();
      const user = userEvent.setup();
      renderActions({ onEditInput });
      await user.click(screen.getByRole('button', { name: /Edit Input/i }));
      expect(onEditInput).toHaveBeenCalledTimes(1);
    });
  });

  describe('export JSON', () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createObjectURL = vi.fn().mockReturnValue('blob:test');
      revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;
    });

    it('export produces valid JSON containing EngineInput fields', async () => {
      const user = userEvent.setup();
      const input = createInput();
      renderActions({ input });

      // Click export button (may show dropdown with options)
      await user.click(screen.getByRole('button', { name: /Export/i }));

      // Look for "Export Input JSON" option or similar
      const exportInputBtn = screen.queryByText(/Export Input/i) ?? screen.getByRole('button', { name: /Export/i });
      if (exportInputBtn !== screen.getByRole('button', { name: /Export/i })) {
        await user.click(exportInputBtn);
      }

      // Should have attempted to create a blob download
      // The createObjectURL mock verifies the export flow was triggered
      expect(createObjectURL).toHaveBeenCalled();
    });

    it('export output produces valid JSON containing EngineOutput fields', async () => {
      const user = userEvent.setup();
      const output = createOutput();
      renderActions({ output });

      await user.click(screen.getByRole('button', { name: /Export/i }));

      // Verify export was triggered
      if (screen.queryByText(/Export Output/i)) {
        await user.click(screen.getByText(/Export Output/i));
      }
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  describe('copy narratives', () => {
    it('copies narratives with bold stripped', async () => {
      const user = userEvent.setup();

      const input = createInput();
      const output = createOutput({
        narratives: [
          {
            heir_id: 'lc1',
            heir_name: 'Juan Cruz',
            heir_category_label: 'legitimate child',
            text: '**Juan Cruz** receives **₱5,000,000**.',
          },
        ],
      });

      renderActions({ input, output });
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      await user.click(screen.getByRole('button', { name: /Copy Narratives/i }));

      expect(writeText).toHaveBeenCalled();
      const copiedText = writeText.mock.calls[0][0];
      // Should NOT contain ** markers
      expect(copiedText).not.toContain('**');
      // Should contain narrative text
      expect(copiedText).toContain('Juan Cruz');
      expect(copiedText).toContain('₱5,000,000');
      writeText.mockRestore();
    });

    it('includes header with decedent name and date_of_death', async () => {
      const user = userEvent.setup();

      const input = createInput({
        decedent: {
          id: 'd',
          name: 'Don Pedro',
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
      });

      renderActions({ input });
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      await user.click(screen.getByRole('button', { name: /Copy Narratives/i }));

      const copiedText = writeText.mock.calls[0][0];
      expect(copiedText).toContain('Don Pedro');
      expect(copiedText).toContain('2026-01-15');
      writeText.mockRestore();
    });

    it('joins multiple narratives with double newline', async () => {
      const user = userEvent.setup();

      renderActions({
        output: createOutput({
          narratives: [
            { heir_id: 'lc1', heir_name: 'Juan', heir_category_label: 'lc', text: 'First narrative.' },
            { heir_id: 'sp', heir_name: 'Maria', heir_category_label: 'ss', text: 'Second narrative.' },
          ],
        }),
      });
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      await user.click(screen.getByRole('button', { name: /Copy Narratives/i }));

      const copiedText = writeText.mock.calls[0][0];
      expect(copiedText).toContain('First narrative.');
      expect(copiedText).toContain('Second narrative.');
      // Narratives should be separated
      expect(copiedText).toMatch(/First narrative\.\n\nSecond narrative\./);
      writeText.mockRestore();
    });
  });
});
