import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { InstitutionsTab, SHARE_SPEC_OPTIONS } from '../InstitutionsTab';
import type { EngineInput, Person, Will, InstitutionOfHeir } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------
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

function createDefaultInstitution(overrides: Partial<InstitutionOfHeir> = {}): InstitutionOfHeir {
  return {
    id: 'i1',
    heir: {
      person_id: 'lc1',
      name: 'Juan Cruz',
      is_collective: false,
      class_designation: null,
    },
    share: 'EntireFreePort',
    conditions: [],
    substitutes: [],
    is_residuary: false,
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

function InstitutionsTabWrapper({
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
        <InstitutionsTab
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
// Tests — InstitutionsTab (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > InstitutionsTab', () => {
  describe('rendering', () => {
    it('renders the institutions tab container', () => {
      render(<InstitutionsTabWrapper />);
      expect(screen.getByTestId('institutions-tab')).toBeInTheDocument();
    });

    it('renders an "Add Institution" button', () => {
      render(<InstitutionsTabWrapper />);
      expect(screen.getByText(/Add Institution/i)).toBeInTheDocument();
    });

    it('renders empty state when no institutions', () => {
      render(<InstitutionsTabWrapper />);
      expect(
        screen.getByText(/No institutions added/i)
      ).toBeInTheDocument();
    });
  });

  describe('add/remove institutions', () => {
    it('clicking "Add Institution" adds an institution card', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      // Should show institution card with heir fields
      expect(screen.getByText(/Heir Name/i)).toBeInTheDocument();
    });

    it('clicking "Add Institution" twice adds two institution cards', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      await user.click(screen.getByText(/Add Institution/i));
      // Should have two remove buttons
      const removeButtons = screen.getAllByText(/Remove/i);
      expect(removeButtons.length).toBe(2);
    });

    it('removing an institution reduces the count', async () => {
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [
                createDefaultInstitution({ id: 'i1' }),
                createDefaultInstitution({ id: 'i2', heir: { person_id: null, name: 'Stranger', is_collective: false, class_designation: null } }),
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

  describe('institution card fields', () => {
    it('auto-generates institution IDs (i1, i2, ...)', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper onValues={onValues} />);
      await user.click(screen.getByText(/Add Institution/i));
      await user.click(screen.getByText(/Add Institution/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const institutions = onValues.mock.calls[0][0].will?.institutions;
      expect(institutions?.[0]?.id).toBe('i1');
      expect(institutions?.[1]?.id).toBe('i2');
    });

    it('renders HeirReferenceForm (PersonPicker + Name)', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Heir/i)).toBeInTheDocument();
      expect(screen.getByText(/Heir Name/i)).toBeInTheDocument();
    });

    it('renders is_collective toggle (Collective Gift)', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Collective Gift/i)).toBeInTheDocument();
    });

    it('renders is_residuary toggle (Residuary Heir)', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Residuary Heir/i)).toBeInTheDocument();
    });
  });

  describe('share spec conditional visibility', () => {
    it('shows ShareSpec selector when is_residuary=false', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Share Type/i)).toBeInTheDocument();
    });

    it('hides ShareSpec selector when is_residuary=true', async () => {
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [createDefaultInstitution({ is_residuary: true })],
            }),
          }}
        />
      );
      expect(screen.queryByText(/Share Type/i)).not.toBeInTheDocument();
    });

    it('toggling is_residuary on hides ShareSpec', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      // ShareSpec is visible
      expect(screen.getByText(/Share Type/i)).toBeInTheDocument();
      // Toggle residuary on
      await user.click(screen.getByText(/Residuary Heir/i));
      await waitFor(() => {
        expect(screen.queryByText(/Share Type/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('ShareSpec variant switching', () => {
    it('defaults share to EntireFreePort', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper onValues={onValues} />);
      await user.click(screen.getByText(/Add Institution/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const inst = onValues.mock.calls[0][0].will?.institutions?.[0];
      expect(inst?.share).toBe('EntireFreePort');
    });

    it('selecting Fraction shows FractionInput', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));

      // Select Fraction variant
      const shareSelect = screen.getByLabelText(/Share Type/i);
      await user.selectOptions(shareSelect, 'Fraction');

      await waitFor(() => {
        // FractionInput should appear with numerator/denominator
        expect(screen.getByText(/Fraction/i)).toBeInTheDocument();
      });
    });

    it('Fraction variant serializes as {"Fraction": "n/d"}', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [
                createDefaultInstitution({ share: { Fraction: '1/3' } }),
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
      const inst = onValues.mock.calls[0][0].will?.institutions?.[0];
      expect(inst?.share).toEqual({ Fraction: '1/3' });
    });

    it('unit variant serializes as bare string', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [createDefaultInstitution({ share: 'EqualWithOthers' })],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const inst = onValues.mock.calls[0][0].will?.institutions?.[0];
      expect(inst?.share).toBe('EqualWithOthers');
    });
  });

  describe('collective institution', () => {
    it('toggling is_collective on shows class_designation input', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      await user.click(screen.getByText(/Collective Gift/i));
      await waitFor(() => {
        expect(screen.getByText(/Class Description/i)).toBeInTheDocument();
      });
    });

    it('toggling is_collective off hides class_designation input', async () => {
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [
                createDefaultInstitution({
                  heir: { person_id: null, name: 'Grandchildren', is_collective: true, class_designation: 'All grandchildren' },
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Class Description/i)).toBeInTheDocument();
      await user.click(screen.getByText(/Collective Gift/i));
      await waitFor(() => {
        expect(screen.queryByText(/Class Description/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('conditions repeater', () => {
    it('renders conditions section (collapsible)', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Conditions/i)).toBeInTheDocument();
    });

    it('can add a condition with type, description, and status', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      // Expand conditions and add one
      await user.click(screen.getByText(/Add Condition/i));
      await waitFor(() => {
        expect(screen.getByText(/Suspensive/i)).toBeInTheDocument();
      });
    });
  });

  describe('substitutes repeater', () => {
    it('renders substitutes section (collapsible)', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      expect(screen.getByText(/Substitutes/i)).toBeInTheDocument();
    });

    it('can add a substitute with type, heir, and triggers', async () => {
      const user = userEvent.setup();
      render(<InstitutionsTabWrapper />);
      await user.click(screen.getByText(/Add Institution/i));
      await user.click(screen.getByText(/Add Substitute/i));
      await waitFor(() => {
        expect(screen.getByText(/Simple/i)).toBeInTheDocument();
      });
    });
  });

  describe('constants', () => {
    it('SHARE_SPEC_OPTIONS has exactly 6 options', () => {
      expect(SHARE_SPEC_OPTIONS).toHaveLength(6);
    });

    it('SHARE_SPEC_OPTIONS includes all variant values', () => {
      const values = SHARE_SPEC_OPTIONS.map((o) => o.value);
      expect(values).toContain('EntireFreePort');
      expect(values).toContain('EntireEstate');
      expect(values).toContain('Residuary');
      expect(values).toContain('EqualWithOthers');
      expect(values).toContain('Fraction');
      expect(values).toContain('Unspecified');
    });
  });

  describe('serialization', () => {
    it('institution serializes with all required fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [createDefaultInstitution()],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const inst = onValues.mock.calls[0][0].will?.institutions?.[0];
      expect(inst).toHaveProperty('id');
      expect(inst).toHaveProperty('heir');
      expect(inst).toHaveProperty('share');
      expect(inst).toHaveProperty('conditions');
      expect(inst).toHaveProperty('substitutes');
      expect(inst).toHaveProperty('is_residuary');
    });

    it('heir reference serializes with person_id, name, is_collective, class_designation', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <InstitutionsTabWrapper
          defaultValues={{
            will: createDefaultWill({
              institutions: [createDefaultInstitution()],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const heir = onValues.mock.calls[0][0].will?.institutions?.[0]?.heir;
      expect(heir).toHaveProperty('person_id');
      expect(heir).toHaveProperty('name');
      expect(heir).toHaveProperty('is_collective');
      expect(heir).toHaveProperty('class_designation');
    });
  });
});
