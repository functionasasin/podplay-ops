import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { FiliationSection } from '../FiliationSection';
import type { EngineInput, Person } from '../../../types';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function createIllegitimateChild(overrides?: Partial<Person>): Person {
  return {
    id: 'ic1',
    name: 'Illegitimate Child 1',
    relationship_to_decedent: 'IllegitimateChild',
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
      is_married: false,
      date_of_marriage: null,
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
function FiliationSectionWrapper({
  person,
  onValues,
}: {
  person?: Partial<Person>;
  onValues?: (values: EngineInput) => void;
}) {
  const ic = createIllegitimateChild(person);
  const methods = useForm<EngineInput>({
    defaultValues: createDefaultEngineInput([ic]),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <FiliationSection
          personIndex={0}
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          errors={methods.formState.errors as Record<string, { message?: string }>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — FiliationSection
// --------------------------------------------------------------------------
describe('wizard-step3 > FiliationSection', () => {
  describe('rendering', () => {
    it('renders the filiation section container', () => {
      render(<FiliationSectionWrapper />);
      expect(screen.getByTestId('filiation-section')).toBeInTheDocument();
    });

    it('renders "Filiation Proved" toggle', () => {
      render(<FiliationSectionWrapper />);
      expect(screen.getByLabelText(/filiation proved/i)).toBeInTheDocument();
    });

    it('defaults filiation_proved to true', () => {
      render(<FiliationSectionWrapper />);
      const toggle = screen.getByLabelText(/filiation proved/i);
      expect(toggle).toBeChecked();
    });
  });

  describe('filiation_proved = true', () => {
    it('shows proof type dropdown when filiation_proved is true', () => {
      render(<FiliationSectionWrapper person={{ filiation_proved: true }} />);
      expect(screen.getByLabelText(/proof of filiation/i)).toBeInTheDocument();
    });

    it('proof type dropdown has 6 FiliationProof options', () => {
      render(<FiliationSectionWrapper person={{ filiation_proved: true }} />);
      expect(screen.getByText(/Birth Certificate/i)).toBeInTheDocument();
      expect(screen.getByText(/Final Judgment/i)).toBeInTheDocument();
      expect(screen.getByText(/Public Document Admission/i)).toBeInTheDocument();
      expect(screen.getByText(/Private Handwritten Admission/i)).toBeInTheDocument();
      expect(screen.getByText(/Open.*Continuous Possession/i)).toBeInTheDocument();
      expect(screen.getByText(/Other.*Evidence/i)).toBeInTheDocument();
    });

    it('does NOT show exclusion warning when filiation is proved', () => {
      render(<FiliationSectionWrapper person={{ filiation_proved: true }} />);
      expect(
        screen.queryByText(/Art\. 887.*excluded/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('filiation_proved = false', () => {
    it('does NOT show proof type dropdown when filiation_proved is false', () => {
      render(<FiliationSectionWrapper person={{ filiation_proved: false }} />);
      expect(screen.queryByLabelText(/proof of filiation/i)).not.toBeInTheDocument();
    });

    it('shows exclusion warning when filiation_proved is false', () => {
      render(<FiliationSectionWrapper person={{ filiation_proved: false }} />);
      expect(
        screen.getByText(/Art\. 887.*excluded/i)
      ).toBeInTheDocument();
    });
  });

  describe('toggling filiation_proved', () => {
    it('toggling filiation_proved off hides proof type and shows warning', async () => {
      const user = userEvent.setup();
      render(<FiliationSectionWrapper person={{ filiation_proved: true }} />);

      // Initially proof type is shown
      expect(screen.getByLabelText(/proof of filiation/i)).toBeInTheDocument();

      // Toggle off
      const toggle = screen.getByLabelText(/filiation proved/i);
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/proof of filiation/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Art\. 887.*excluded/i)).toBeInTheDocument();
      });
    });

    it('toggling filiation_proved on shows proof type and hides warning', async () => {
      const user = userEvent.setup();
      render(<FiliationSectionWrapper person={{ filiation_proved: false }} />);

      // Initially warning is shown
      expect(screen.getByText(/Art\. 887.*excluded/i)).toBeInTheDocument();

      // Toggle on
      const toggle = screen.getByLabelText(/filiation proved/i);
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/proof of filiation/i)).toBeInTheDocument();
        expect(screen.queryByText(/Art\. 887.*excluded/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('serialization', () => {
    it('filiation_proved=true serializes with proof type', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <FiliationSectionWrapper
          person={{
            filiation_proved: true,
            filiation_proof_type: 'BirthCertificate',
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.filiation_proved).toBe(true);
      expect(person.filiation_proof_type).toBe('BirthCertificate');
    });

    it('filiation_proved=false serializes with null proof type', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <FiliationSectionWrapper
          person={{ filiation_proved: false }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.filiation_proved).toBe(false);
      expect(person.filiation_proof_type).toBeNull();
    });

    it('selecting a proof type serializes correctly', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <FiliationSectionWrapper
          person={{ filiation_proved: true }}
          onValues={onValues}
        />
      );

      const proofSelect = screen.getByLabelText(/proof of filiation/i);
      await user.selectOptions(proofSelect, 'FinalJudgment');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.filiation_proof_type).toBe('FinalJudgment');
    });
  });
});
