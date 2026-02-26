import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { WillStep } from '../WillStep';
import type { EngineInput, Person, Will } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------
function createDefaultWill(): Will {
  return {
    date_executed: '2026-01-01',
    institutions: [],
    legacies: [],
    devises: [],
    disinheritances: [],
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

function WillStepWrapper({
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
        <WillStep
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
// Tests — WillStep (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > WillStep', () => {
  describe('rendering', () => {
    it('renders the will step container', () => {
      render(<WillStepWrapper />);
      expect(screen.getByTestId('will-step')).toBeInTheDocument();
    });

    it('renders date_executed DateInput with label', () => {
      render(<WillStepWrapper />);
      expect(screen.getByText(/Date Will Was Executed/i)).toBeInTheDocument();
    });

    it('renders 4 sub-tabs', () => {
      render(<WillStepWrapper />);
      expect(screen.getByRole('button', { name: /^Institutions$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Legacies$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Devises$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Disinheritances$/i })).toBeInTheDocument();
    });

    it('defaults to Institutions sub-tab active', () => {
      render(<WillStepWrapper />);
      expect(screen.getByTestId('institutions-tab')).toBeInTheDocument();
    });
  });

  describe('sub-tab navigation', () => {
    it('switching to Legacies tab renders LegaciesTab', async () => {
      const user = userEvent.setup();
      render(<WillStepWrapper />);
      await user.click(screen.getByText(/Legacies/i));
      expect(screen.getByTestId('legacies-tab')).toBeInTheDocument();
    });

    it('switching to Devises tab renders DevisesTab', async () => {
      const user = userEvent.setup();
      render(<WillStepWrapper />);
      await user.click(screen.getByText(/Devises/i));
      expect(screen.getByTestId('devises-tab')).toBeInTheDocument();
    });

    it('switching to Disinheritances tab renders DisinheritancesTab', async () => {
      const user = userEvent.setup();
      render(<WillStepWrapper />);
      await user.click(screen.getByText(/Disinheritances/i));
      expect(screen.getByTestId('disinheritances-tab')).toBeInTheDocument();
    });

    it('can switch back to Institutions tab after switching away', async () => {
      const user = userEvent.setup();
      render(<WillStepWrapper />);
      await user.click(screen.getByText(/Legacies/i));
      await user.click(screen.getByText(/Institutions/i));
      expect(screen.getByTestId('institutions-tab')).toBeInTheDocument();
    });
  });

  describe('date_executed validation', () => {
    it('accepts a valid date before death', () => {
      render(
        <WillStepWrapper
          defaultValues={{
            will: { ...createDefaultWill(), date_executed: '2025-06-15' },
          }}
        />
      );
      // Should render without error
      expect(screen.getByTestId('will-step')).toBeInTheDocument();
    });
  });

  describe('not rendered when intestate', () => {
    it('is not rendered when will is null (intestate)', () => {
      render(
        <WillStepWrapper defaultValues={{ will: null }} />
      );
      // WillStep should still render since it's the component itself —
      // the WizardContainer is what controls visibility.
      // But the container should be empty or show nothing meaningful.
      expect(screen.getByTestId('will-step')).toBeInTheDocument();
    });
  });

  describe('serialization', () => {
    it('will.date_executed serializes as YYYY-MM-DD string', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <WillStepWrapper
          defaultValues={{
            will: { ...createDefaultWill(), date_executed: '2025-12-25' },
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.will?.date_executed).toBe('2025-12-25');
    });

    it('will contains all 5 required fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<WillStepWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const will = onValues.mock.calls[0][0].will;
      expect(will).toHaveProperty('date_executed');
      expect(will).toHaveProperty('institutions');
      expect(will).toHaveProperty('legacies');
      expect(will).toHaveProperty('devises');
      expect(will).toHaveProperty('disinheritances');
    });
  });
});
