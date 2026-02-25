import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DevisesTab, DEVISE_SPEC_OPTIONS } from '../DevisesTab';
import type { EngineInput, Person, Will, Devise } from '../../../types';

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

function createDefaultDevise(overrides: Partial<Devise> = {}): Devise {
  return {
    id: 'dev1',
    devisee: {
      person_id: 'lc1',
      name: 'Juan Cruz',
      is_collective: false,
      class_designation: null,
    },
    property: { SpecificProperty: 'lot-123' },
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

function DevisesTabWrapper({
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
        <DevisesTab
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
// Tests — DevisesTab (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > DevisesTab', () => {
  describe('rendering', () => {
    it('renders the devises tab container', () => {
      render(<DevisesTabWrapper />);
      expect(screen.getByTestId('devises-tab')).toBeInTheDocument();
    });

    it('renders an "Add Devise" button', () => {
      render(<DevisesTabWrapper />);
      expect(screen.getByText(/Add Devise/i)).toBeInTheDocument();
    });

    it('renders empty state when no devises', () => {
      render(<DevisesTabWrapper />);
      expect(screen.getByText(/No devises added/i)).toBeInTheDocument();
    });

    it('renders info banner about devises not affecting peso distribution', () => {
      render(<DevisesTabWrapper />);
      expect(
        screen.getByText(/do not affect the peso distribution/i)
      ).toBeInTheDocument();
    });
  });

  describe('add/remove devises', () => {
    it('clicking "Add Devise" adds a devise card', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Devisee/i)).toBeInTheDocument();
    });

    it('removing a devise reduces the count', async () => {
      const user = userEvent.setup();
      render(
        <DevisesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              devises: [
                createDefaultDevise({ id: 'dev1' }),
                createDefaultDevise({ id: 'dev2' }),
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

  describe('devise card fields', () => {
    it('auto-generates devise IDs (dev1, dev2, ...)', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DevisesTabWrapper onValues={onValues} />);
      await user.click(screen.getByText(/Add Devise/i));
      await user.click(screen.getByText(/Add Devise/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const devises = onValues.mock.calls[0][0].will?.devises;
      expect(devises?.[0]?.id).toBe('dev1');
      expect(devises?.[1]?.id).toBe('dev2');
    });

    it('renders HeirReferenceForm for devisee', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Devisee/i)).toBeInTheDocument();
    });

    it('renders Devise Type selector', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Devise Type/i)).toBeInTheDocument();
    });

    it('renders is_preferred toggle', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Preferred Devise/i)).toBeInTheDocument();
    });
  });

  describe('DeviseSpec variant switching', () => {
    it('SpecificProperty variant shows property identifier text input', async () => {
      render(
        <DevisesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              devises: [createDefaultDevise({ property: { SpecificProperty: 'lot-123' } })],
            }),
          }}
        />
      );
      expect(screen.getByText(/Property Identifier/i)).toBeInTheDocument();
    });

    it('FractionalInterest variant shows property identifier and fraction input', async () => {
      render(
        <DevisesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              devises: [
                createDefaultDevise({
                  property: { FractionalInterest: ['lot-456', '1/2'] },
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Property Identifier/i)).toBeInTheDocument();
      expect(screen.getByText(/Fractional Share/i)).toBeInTheDocument();
    });
  });

  describe('DeviseSpec serialization', () => {
    it('SpecificProperty serializes as {"SpecificProperty": "prop-id"}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DevisesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              devises: [createDefaultDevise({ property: { SpecificProperty: 'lot-123' } })],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const property = onValues.mock.calls[0][0].will?.devises?.[0]?.property;
      expect(property).toEqual({ SpecificProperty: 'lot-123' });
    });

    it('FractionalInterest serializes as {"FractionalInterest": ["prop-id", "n/d"]}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DevisesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              devises: [
                createDefaultDevise({
                  property: { FractionalInterest: ['lot-456', '1/2'] },
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
      const property = onValues.mock.calls[0][0].will?.devises?.[0]?.property;
      expect(property).toEqual({ FractionalInterest: ['lot-456', '1/2'] });
    });
  });

  describe('conditions and substitutes', () => {
    it('renders conditions section', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Conditions/i)).toBeInTheDocument();
    });

    it('renders substitutes section', async () => {
      const user = userEvent.setup();
      render(<DevisesTabWrapper />);
      await user.click(screen.getByText(/Add Devise/i));
      expect(screen.getByText(/Substitutes/i)).toBeInTheDocument();
    });
  });

  describe('constants', () => {
    it('DEVISE_SPEC_OPTIONS has exactly 2 options', () => {
      expect(DEVISE_SPEC_OPTIONS).toHaveLength(2);
    });

    it('DEVISE_SPEC_OPTIONS includes SpecificProperty and FractionalInterest', () => {
      const values = DEVISE_SPEC_OPTIONS.map((o) => o.value);
      expect(values).toContain('SpecificProperty');
      expect(values).toContain('FractionalInterest');
    });
  });
});
