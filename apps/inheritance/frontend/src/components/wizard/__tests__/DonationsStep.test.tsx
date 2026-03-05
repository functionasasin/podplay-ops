import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DonationsStep } from '../DonationsStep';
import type { EngineInput, Person, Donation } from '../../../types';

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

function createSpouse(overrides: Partial<Person> = {}): Person {
  return createDefaultPerson({
    id: 'sp',
    name: 'Maria Cruz',
    relationship_to_decedent: 'SurvivingSpouse',
    ...overrides,
  });
}

function createDefaultDonation(overrides: Partial<Donation> = {}): Donation {
  return {
    id: 'don1',
    recipient_heir_id: 'lc1',
    recipient_is_stranger: false,
    value_at_time_of_donation: { centavos: 100000 },
    date: '2025-06-15',
    description: 'Cash gift',
    is_expressly_exempt: false,
    is_support_education_medical: false,
    is_customary_gift: false,
    is_professional_expense: false,
    professional_expense_parent_required: false,
    professional_expense_imputed_savings: null,
    is_joint_from_both_parents: false,
    is_to_child_spouse_only: false,
    is_joint_to_child_and_spouse: false,
    is_wedding_gift: false,
    is_debt_payment_for_child: false,
    is_election_expense: false,
    is_fine_payment: false,
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
      is_married: true,
      date_of_marriage: '2000-06-15',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 25,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [createDefaultPerson(), createSpouse()],
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function DonationsStepWrapper({
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
        <DonationsStep
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
// Tests — DonationsStep (wizard-step5)
// --------------------------------------------------------------------------
describe('wizard-step5 > DonationsStep', () => {
  describe('rendering', () => {
    it('renders the donations step container', () => {
      render(<DonationsStepWrapper />);
      expect(screen.getByTestId('donations-step')).toBeInTheDocument();
    });

    it('renders an "Add Donation" button', () => {
      render(<DonationsStepWrapper />);
      expect(screen.getByText(/Add Donation/i)).toBeInTheDocument();
    });

    it('renders empty state when no donations exist', () => {
      render(<DonationsStepWrapper />);
      expect(screen.getByText(/No donations added/i)).toBeInTheDocument();
    });
  });

  describe('add/remove donations', () => {
    it('clicking "Add Donation" adds a donation card', async () => {
      const user = userEvent.setup();
      render(<DonationsStepWrapper />);
      await user.click(screen.getByText(/Add Donation/i));
      expect(screen.getByTestId('donation-card-0')).toBeInTheDocument();
    });

    it('adding multiple donations shows multiple cards', async () => {
      const user = userEvent.setup();
      render(<DonationsStepWrapper />);
      await user.click(screen.getByText(/Add Donation/i));
      await user.click(screen.getByText(/Add Donation/i));
      expect(screen.getByTestId('donation-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('donation-card-1')).toBeInTheDocument();
    });

    it('removing a donation reduces the count', async () => {
      const user = userEvent.setup();
      render(
        <DonationsStepWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({ id: 'don1' }),
              createDefaultDonation({ id: 'don2', description: 'Second gift' }),
            ],
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

  describe('auto-generated IDs', () => {
    it('auto-generates donation IDs: don1, don2, ...', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DonationsStepWrapper onValues={onValues} />);

      await user.click(screen.getByText(/Add Donation/i));
      await user.click(screen.getByText(/Add Donation/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const donations = onValues.mock.calls[0][0].donations;
      expect(donations[0].id).toMatch(/^don\d+$/);
      expect(donations[1].id).toMatch(/^don\d+$/);
      expect(donations[0].id).not.toBe(donations[1].id);
    });
  });

  describe('donation card fields rendered', () => {
    it('each donation card shows value, date, description fields', async () => {
      const user = userEvent.setup();
      render(
        <DonationsStepWrapper
          defaultValues={{
            donations: [createDefaultDonation()],
          }}
        />
      );
      expect(screen.getByText(/Value at Time of Donation/i)).toBeInTheDocument();
      expect(screen.getByText(/Donation Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Description/i)).toBeInTheDocument();
    });
  });

  describe('serialization', () => {
    it('donations array serializes with all required fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DonationsStepWrapper
          defaultValues={{
            donations: [createDefaultDonation()],
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const don = onValues.mock.calls[0][0].donations[0];
      expect(don).toHaveProperty('id');
      expect(don).toHaveProperty('recipient_heir_id');
      expect(don).toHaveProperty('recipient_is_stranger');
      expect(don).toHaveProperty('value_at_time_of_donation');
      expect(don).toHaveProperty('date');
      expect(don).toHaveProperty('description');
      expect(don).toHaveProperty('is_expressly_exempt');
      expect(don).toHaveProperty('is_professional_expense');
    });

    it('empty donations array serializes as []', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DonationsStepWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].donations).toEqual([]);
    });
  });

  describe('cross-step validation', () => {
    it('PersonPicker is populated from family_tree persons', async () => {
      const user = userEvent.setup();
      const persons = [
        createDefaultPerson({ id: 'lc1', name: 'Juan Cruz' }),
        createSpouse({ id: 'sp', name: 'Maria Cruz' }),
      ];
      render(
        <DonationsStepWrapper
          persons={persons}
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: false })],
          }}
        />
      );
      // PersonPicker should show family tree members
      expect(screen.getByText(/Juan Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/Maria Cruz/)).toBeInTheDocument();
    });
  });
});
