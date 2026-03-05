import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { AdoptionSubForm } from '../AdoptionSubForm';
import type { EngineInput, Person, Adoption } from '../../../types';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function createDefaultAdoption(overrides?: Partial<Adoption>): Adoption {
  return {
    decree_date: '2020-01-01',
    regime: 'Ra8552',
    adopter: 'd',
    adoptee: 'ac1',
    is_stepparent_adoption: false,
    biological_parent_spouse: null,
    is_rescinded: false,
    rescission_date: null,
    ...overrides,
  };
}

function createAdoptedChild(overrides?: Partial<Person>): Person {
  return {
    id: 'ac1',
    name: 'Adopted Child 1',
    relationship_to_decedent: 'AdoptedChild',
    is_alive_at_succession: true,
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: null,
    adoption: createDefaultAdoption(),
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    is_guilty_party_in_legal_separation: false,
    ...overrides,
  };
}

function createDefaultEngineInput(persons: Person[] = []): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000 },
    decedent: {
      id: 'd',
      name: 'Test Decedent',
      date_of_death: '2026-01-15',
      is_married: true,
      date_of_marriage: '2010-06-01',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 0,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: persons,
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
  };
}

// --------------------------------------------------------------------------
// Test wrapper
// --------------------------------------------------------------------------
function AdoptionSubFormWrapper({
  person,
  allPersons,
  dateOfDeath = '2026-01-15',
  onValues,
}: {
  person?: Partial<Person>;
  allPersons?: Person[];
  dateOfDeath?: string;
  onValues?: (values: EngineInput) => void;
}) {
  const adoptedChild = createAdoptedChild(person);
  const spousePerson: Person = {
    id: 'sp1',
    name: 'Surviving Spouse',
    relationship_to_decedent: 'SurvivingSpouse',
    is_alive_at_succession: true,
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: null,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    is_guilty_party_in_legal_separation: false,
  };
  const persons = allPersons ?? [adoptedChild, spousePerson];
  const methods = useForm<EngineInput>({
    defaultValues: createDefaultEngineInput(persons),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <AdoptionSubForm
          personIndex={0}
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          persons={persons}
          dateOfDeath={dateOfDeath}
          errors={methods.formState.errors as Record<string, { message?: string }>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — AdoptionSubForm
// --------------------------------------------------------------------------
describe('wizard-step3 > AdoptionSubForm', () => {
  describe('rendering', () => {
    it('renders the adoption sub-form container', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByTestId('adoption-sub-form')).toBeInTheDocument();
    });

    it('renders decree date input', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByLabelText(/adoption decree date/i)).toBeInTheDocument();
    });

    it('renders adoption law select (regime)', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByLabelText(/adoption law/i)).toBeInTheDocument();
    });

    it('renders stepparent adoption toggle', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByLabelText(/stepparent adoption/i)).toBeInTheDocument();
    });

    it('renders adoption rescinded toggle', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByLabelText(/adoption rescinded/i)).toBeInTheDocument();
    });

    it('regime select has Ra8552 and Ra11642 options', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.getByText(/Ra8552/)).toBeInTheDocument();
      expect(screen.getByText(/Ra11642/)).toBeInTheDocument();
    });

    it('defaults regime to Ra8552', () => {
      render(<AdoptionSubFormWrapper />);
      const select = screen.getByLabelText(/adoption law/i);
      expect(select).toHaveValue('Ra8552');
    });
  });

  describe('stepparent adoption cascade', () => {
    it('does NOT show biological parent spouse picker when stepparent=false', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.queryByLabelText(/biological parent/i)).not.toBeInTheDocument();
    });

    it('shows biological parent spouse picker when stepparent=true', () => {
      render(
        <AdoptionSubFormWrapper
          person={{
            adoption: createDefaultAdoption({ is_stepparent_adoption: true }),
          }}
        />
      );
      expect(screen.getByLabelText(/biological parent/i)).toBeInTheDocument();
    });

    it('toggling stepparent on reveals biological parent picker', async () => {
      const user = userEvent.setup();
      render(<AdoptionSubFormWrapper />);

      const stepparentToggle = screen.getByLabelText(/stepparent adoption/i);
      await user.click(stepparentToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/biological parent/i)).toBeInTheDocument();
      });
    });

    it('toggling stepparent off hides biological parent picker', async () => {
      const user = userEvent.setup();
      render(
        <AdoptionSubFormWrapper
          person={{
            adoption: createDefaultAdoption({
              is_stepparent_adoption: true,
              biological_parent_spouse: 'sp1',
            }),
          }}
        />
      );

      expect(screen.getByLabelText(/biological parent/i)).toBeInTheDocument();

      const stepparentToggle = screen.getByLabelText(/stepparent adoption/i);
      await user.click(stepparentToggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/biological parent/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('rescission cascade', () => {
    it('does NOT show rescission date when is_rescinded=false', () => {
      render(<AdoptionSubFormWrapper />);
      expect(screen.queryByLabelText(/rescission date/i)).not.toBeInTheDocument();
    });

    it('shows rescission date when is_rescinded=true', () => {
      render(
        <AdoptionSubFormWrapper
          person={{
            adoption: createDefaultAdoption({
              is_rescinded: true,
              rescission_date: '2025-01-01',
            }),
          }}
        />
      );
      expect(screen.getByLabelText(/rescission date/i)).toBeInTheDocument();
    });

    it('toggling rescission on reveals rescission date', async () => {
      const user = userEvent.setup();
      render(<AdoptionSubFormWrapper />);

      const rescindedToggle = screen.getByLabelText(/adoption rescinded/i);
      await user.click(rescindedToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/rescission date/i)).toBeInTheDocument();
      });
    });

    it('shows rescission warning banner when is_rescinded=true', () => {
      render(
        <AdoptionSubFormWrapper
          person={{
            adoption: createDefaultAdoption({ is_rescinded: true }),
          }}
        />
      );
      expect(
        screen.getByText(/rescinded adoption.*RA 8552.*excluded/i)
      ).toBeInTheDocument();
    });

    it('does NOT show rescission warning when is_rescinded=false', () => {
      render(<AdoptionSubFormWrapper />);
      expect(
        screen.queryByText(/rescinded adoption.*excluded/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('serialization', () => {
    it('adoption record serializes with all 8 fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<AdoptionSubFormWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const adoption = onValues.mock.calls[0][0].family_tree[0].adoption;
      expect(adoption).toHaveProperty('decree_date');
      expect(adoption).toHaveProperty('regime');
      expect(adoption).toHaveProperty('adopter');
      expect(adoption).toHaveProperty('adoptee');
      expect(adoption).toHaveProperty('is_stepparent_adoption');
      expect(adoption).toHaveProperty('biological_parent_spouse');
      expect(adoption).toHaveProperty('is_rescinded');
      expect(adoption).toHaveProperty('rescission_date');
    });

    it('adopter is auto-set to decedent id', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<AdoptionSubFormWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const adoption = onValues.mock.calls[0][0].family_tree[0].adoption;
      expect(adoption.adopter).toBe('d');
    });

    it('adoptee is auto-set to person id', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<AdoptionSubFormWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const adoption = onValues.mock.calls[0][0].family_tree[0].adoption;
      expect(adoption.adoptee).toBe('ac1');
    });
  });
});
