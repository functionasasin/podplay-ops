import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { HeirReferenceForm } from '../HeirReferenceForm';
import type { EngineInput, Person, HeirReference } from '../../../types';

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

function createDefaultEngineInput(): EngineInput {
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
    family_tree: [
      createDefaultPerson({ id: 'lc1', name: 'Juan Cruz' }),
      createDefaultPerson({ id: 'lc2', name: 'Maria Santos', relationship_to_decedent: 'LegitimateChild' }),
    ],
    will: {
      date_executed: '2026-01-01',
      institutions: [
        {
          id: 'i1',
          heir: { person_id: 'lc1', name: 'Juan Cruz', is_collective: false, class_designation: null },
          share: 'EntireFreePort',
          conditions: [],
          substitutes: [],
          is_residuary: false,
        },
      ],
      legacies: [],
      devises: [],
      disinheritances: [],
    },
    donations: [],
    config: { max_pipeline_restarts: 10, retroactive_ra_11642: false },
  };
}

function HeirReferenceFormWrapper({
  persons,
  allowStranger,
  requirePersonId,
  onValues,
}: {
  persons?: Person[];
  allowStranger?: boolean;
  requirePersonId?: boolean;
  onValues?: (values: EngineInput) => void;
}) {
  const defaultValues = createDefaultEngineInput();
  const methods = useForm<EngineInput>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <HeirReferenceForm
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          fieldPath="will.institutions.0.heir"
          persons={persons ?? defaultValues.family_tree}
          allowStranger={allowStranger}
          requirePersonId={requirePersonId}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — HeirReferenceForm (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > HeirReferenceForm', () => {
  describe('rendering', () => {
    it('renders the heir reference form container', () => {
      render(<HeirReferenceFormWrapper />);
      expect(screen.getByTestId('heir-reference-form')).toBeInTheDocument();
    });

    it('renders PersonPicker for heir selection', () => {
      render(<HeirReferenceFormWrapper />);
      expect(screen.getByTestId('person-picker')).toBeInTheDocument();
    });

    it('renders name input field', () => {
      render(<HeirReferenceFormWrapper />);
      expect(screen.getByText(/Heir Name/i)).toBeInTheDocument();
    });

    it('renders is_collective toggle', () => {
      render(<HeirReferenceFormWrapper />);
      expect(screen.getByText(/Collective Gift/i)).toBeInTheDocument();
    });
  });

  describe('person selection', () => {
    it('selecting a person populates name as read-only', async () => {
      const user = userEvent.setup();
      render(<HeirReferenceFormWrapper />);
      // Select Juan Cruz from person picker
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'lc1');
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Heir Name/i);
        expect(nameInput).toHaveValue('Juan Cruz');
      });
    });

    it('name input is editable when person_id is null (stranger)', () => {
      render(<HeirReferenceFormWrapper allowStranger />);
      // When no person selected (stranger), name should be editable
      const nameInput = screen.getByLabelText(/Heir Name/i);
      expect(nameInput).not.toHaveAttribute('readonly');
    });

    it('name input is read-only when person_id is set', () => {
      render(<HeirReferenceFormWrapper />);
      // When person is selected, name should be read-only (auto-populated)
      const nameInput = screen.getByLabelText(/Heir Name/i);
      expect(nameInput).toHaveAttribute('readonly');
    });
  });

  describe('collective designation', () => {
    it('shows class_designation input when is_collective=true', async () => {
      const user = userEvent.setup();
      render(<HeirReferenceFormWrapper />);
      await user.click(screen.getByText(/Collective Gift/i));
      await waitFor(() => {
        expect(screen.getByText(/Class Description/i)).toBeInTheDocument();
      });
    });

    it('hides class_designation input when is_collective=false', () => {
      render(<HeirReferenceFormWrapper />);
      expect(screen.queryByText(/Class Description/i)).not.toBeInTheDocument();
    });

    it('collective institution has null person_id', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<HeirReferenceFormWrapper onValues={onValues} />);
      await user.click(screen.getByText(/Collective Gift/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const heir = onValues.mock.calls[0][0].will?.institutions?.[0]?.heir;
      // When collective, person_id should be null
      expect(heir?.is_collective).toBe(true);
    });
  });

  describe('serialization', () => {
    it('heir reference serializes with person_id, name, is_collective, class_designation', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<HeirReferenceFormWrapper onValues={onValues} />);

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

    it('class_designation is null when not collective', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<HeirReferenceFormWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const heir = onValues.mock.calls[0][0].will?.institutions?.[0]?.heir;
      expect(heir?.class_designation).toBeNull();
    });
  });
});
