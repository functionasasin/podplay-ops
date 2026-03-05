import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { LegaciesTab, LEGACY_SPEC_OPTIONS } from '../LegaciesTab';
import type { EngineInput, Person, Will, Legacy } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------
function createDefaultPerson(overrides: Partial<Person> = {}): Person {
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

function createDefaultLegacy(overrides: Partial<Legacy> = {}): Legacy {
  return {
    id: 'l1',
    legatee: {
      person_id: 'lc1',
      name: 'Juan Cruz',
      is_collective: false,
      class_designation: null,
    },
    property: { FixedAmount: { centavos: 100000 } },
    conditions: [],
    substitutes: [],
    is_preferred: false,
    ...overrides,
  };
}

function createDefaultWill(overrides: Partial<Will> = {}): Will {
  return {
    date_executed: '2026-01-01',
    institutions: [],
    legacies: [],
    devises: [],
    disinheritances: [],
    ...overrides,
  };
}

function createDefaultEngineInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: { centavos: 1000000 },
    decedent: {
      id: 'd',
      name: 'Test Decedent',
      date_of_death: '2026-01-15',
      is_married: false,
      date_of_marriage: null,
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 0,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [createDefaultPerson()],
    will: createDefaultWill(),
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function LegaciesTabWrapper({
  defaultValues,
  persons,
  onValues,
}: {
  defaultValues?: Partial<EngineInput>;
  persons?: Person[];
  onValues?: (values: EngineInput) => void;
}) {
  const engineInput = createDefaultEngineInput(defaultValues);
  const methods = useForm<EngineInput>({
    defaultValues: engineInput,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <LegaciesTab
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          errors={methods.formState.errors as Record<string, { message?: string }>}
          persons={persons ?? engineInput.family_tree}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — LegaciesTab (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > LegaciesTab', () => {
  describe('rendering', () => {
    it('renders the legacies tab container', () => {
      render(<LegaciesTabWrapper />);
      expect(screen.getByTestId('legacies-tab')).toBeInTheDocument();
    });

    it('renders an "Add Legacy" button', () => {
      render(<LegaciesTabWrapper />);
      expect(screen.getByText(/Add Legacy/i)).toBeInTheDocument();
    });

    it('renders empty state when no legacies', () => {
      render(<LegaciesTabWrapper />);
      expect(screen.getByText(/No legacies added/i)).toBeInTheDocument();
    });
  });

  describe('add/remove legacies', () => {
    it('clicking "Add Legacy" adds a legacy card', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Legatee/i)).toBeInTheDocument();
    });

    it('removing a legacy reduces the count', async () => {
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [
                createDefaultLegacy({ id: 'l1' }),
                createDefaultLegacy({ id: 'l2' }),
              ],
            }),
          }}
        />
      );
      const removeButtons = screen.getAllByText(/Remove/i);
      expect(removeButtons.length).toBe(2);
      await user.click(removeButtons[0]);
      await waitFor(() => {
        expect(screen.getAllByText(/Remove/i).length).toBe(1);
      });
    });
  });

  describe('legacy card fields', () => {
    it('auto-generates legacy IDs (l1, l2, ...)', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<LegaciesTabWrapper onValues={onValues} />);
      await user.click(screen.getByText(/Add Legacy/i));
      await user.click(screen.getByText(/Add Legacy/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const legacies = onValues.mock.calls[0][0].will?.legacies;
      expect(legacies?.[0]?.id).toBe('l1');
      expect(legacies?.[1]?.id).toBe('l2');
    });

    it('renders HeirReferenceForm for legatee', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Legatee/i)).toBeInTheDocument();
    });

    it('renders Legacy Type selector with 3 options', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Legacy Type/i)).toBeInTheDocument();
    });

    it('renders is_preferred toggle', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Preferred Legacy/i)).toBeInTheDocument();
    });
  });

  describe('LegacySpec variant switching', () => {
    it('FixedAmount variant shows MoneyInput', async () => {
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [createDefaultLegacy({ property: { FixedAmount: { centavos: 50000 } } })],
            }),
          }}
        />
      );
      // FixedAmount should show amount input with peso prefix
      expect(screen.getByText('₱')).toBeInTheDocument();
    });

    it('SpecificAsset variant shows text input for asset identifier', async () => {
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [createDefaultLegacy({ property: { SpecificAsset: 'house-lot-1' } })],
            }),
          }}
        />
      );
      expect(screen.getByText(/Asset Identifier/i)).toBeInTheDocument();
    });

    it('SpecificAsset variant shows info warning badge', async () => {
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [createDefaultLegacy({ property: { SpecificAsset: 'house-lot-1' } })],
            }),
          }}
        />
      );
      expect(
        screen.getByText(/cannot compute a monetary value/i)
      ).toBeInTheDocument();
    });

    it('GenericClass variant shows description text input and estimated value MoneyInput', async () => {
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [
                createDefaultLegacy({
                  property: { GenericClass: ['All jewelry', { centavos: 200000 }] },
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Description/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimated Value/i)).toBeInTheDocument();
    });
  });

  describe('LegacySpec serialization', () => {
    it('FixedAmount serializes as {"FixedAmount": {"centavos": N}}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [createDefaultLegacy({ property: { FixedAmount: { centavos: 50000 } } })],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const property = onValues.mock.calls[0][0].will?.legacies?.[0]?.property;
      expect(property).toEqual({ FixedAmount: { centavos: 50000 } });
    });

    it('SpecificAsset serializes as {"SpecificAsset": "id"}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [createDefaultLegacy({ property: { SpecificAsset: 'house-lot-1' } })],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const property = onValues.mock.calls[0][0].will?.legacies?.[0]?.property;
      expect(property).toEqual({ SpecificAsset: 'house-lot-1' });
    });

    it('GenericClass serializes as {"GenericClass": ["desc", {"centavos": N}]}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <LegaciesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              legacies: [
                createDefaultLegacy({
                  property: { GenericClass: ['All jewelry', { centavos: 200000 }] },
                }),
              ],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const property = onValues.mock.calls[0][0].will?.legacies?.[0]?.property;
      expect(property).toEqual({
        GenericClass: ['All jewelry', { centavos: 200000 }],
      });
    });
  });

  describe('conditions and substitutes', () => {
    it('renders conditions section', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Conditions/i)).toBeInTheDocument();
    });

    it('renders substitutes section', async () => {
      const user = userEvent.setup();
      render(<LegaciesTabWrapper />);
      await user.click(screen.getByText(/Add Legacy/i));
      expect(screen.getByText(/Substitutes/i)).toBeInTheDocument();
    });
  });

  describe('constants', () => {
    it('LEGACY_SPEC_OPTIONS has exactly 3 options', () => {
      expect(LEGACY_SPEC_OPTIONS).toHaveLength(3);
    });

    it('LEGACY_SPEC_OPTIONS includes FixedAmount, SpecificAsset, GenericClass', () => {
      const values = LEGACY_SPEC_OPTIONS.map((o) => o.value);
      expect(values).toContain('FixedAmount');
      expect(values).toContain('SpecificAsset');
      expect(values).toContain('GenericClass');
    });
  });
});
