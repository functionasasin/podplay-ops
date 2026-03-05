import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DonationCard, EXEMPTION_FLAGS } from '../DonationCard';
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
    donations: [createDefaultDonation()],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function DonationCardWrapper({
  defaultValues,
  persons,
  index = 0,
  onRemove,
  onValues,
}: {
  defaultValues?: Partial<EngineInput>;
  persons?: Person[];
  index?: number;
  onRemove?: (index: number) => void;
  onValues?: (values: EngineInput) => void;
}) {
  const engineInput = createDefaultEngineInput(defaultValues);
  const methods = useForm<EngineInput>({
    defaultValues: engineInput,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <DonationCard
          index={index}
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          onRemove={onRemove ?? vi.fn()}
          persons={persons ?? engineInput.family_tree}
          errors={methods.formState.errors as Record<string, { message?: string }>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — DonationCard
// --------------------------------------------------------------------------
describe('DonationCard', () => {
  describe('rendering', () => {
    it('renders the donation card container', () => {
      render(<DonationCardWrapper />);
      expect(screen.getByTestId('donation-card-0')).toBeInTheDocument();
    });

    it('renders always-visible fields: value, date, description', () => {
      render(<DonationCardWrapper />);
      expect(screen.getByText(/Value at Time of Donation/i)).toBeInTheDocument();
      expect(screen.getByText(/Donation Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Description/i)).toBeInTheDocument();
    });

    it('renders the stranger toggle', () => {
      render(<DonationCardWrapper />);
      expect(screen.getByText(/Recipient is Not in Family Tree/i)).toBeInTheDocument();
    });

    it('renders a Remove button', () => {
      render(<DonationCardWrapper />);
      expect(screen.getByText(/Remove/i)).toBeInTheDocument();
    });
  });

  describe('stranger toggle behavior', () => {
    it('shows exemption flags when recipient_is_stranger is false', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: false })],
          }}
        />
      );
      expect(screen.getByText(/Expressly Exempt/i)).toBeInTheDocument();
      expect(screen.getByText(/Support, Education, or Medical/i)).toBeInTheDocument();
      expect(screen.getByText(/Customary Gift/i)).toBeInTheDocument();
    });

    it('hides exemption flags when recipient_is_stranger is true', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: true })],
          }}
        />
      );
      expect(screen.queryByText(/Expressly Exempt/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Support, Education, or Medical/i)).not.toBeInTheDocument();
    });

    it('shows PersonPicker for recipient when not a stranger', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: false })],
          }}
        />
      );
      // Use anchored regex to match only PersonPicker label "Recipient", not toggle "Recipient is Not in Family Tree"
      expect(screen.getByText(/^Recipient$/)).toBeInTheDocument();
    });

    it('hides PersonPicker when recipient_is_stranger is true', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: true })],
          }}
        />
      );
      // PersonPicker for recipient should not be present; only the stranger toggle text
      expect(screen.queryByText(/^Recipient$/)).not.toBeInTheDocument();
    });

    it('shows stranger info banner when recipient_is_stranger is true', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: true })],
          }}
        />
      );
      expect(
        screen.getByText(/Stranger donations are always collatable/i)
      ).toBeInTheDocument();
    });

    it('toggling stranger to true resets exemption flags and recipient_heir_id', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_expressly_exempt: true,
                recipient_heir_id: 'lc1',
              }),
            ],
          }}
          onValues={onValues}
        />
      );

      // Toggle stranger on
      await user.click(screen.getByText(/Recipient is Not in Family Tree/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const don = onValues.mock.calls[0][0].donations[0];
      expect(don.recipient_is_stranger).toBe(true);
      expect(don.recipient_heir_id).toBeNull();
      expect(don.is_expressly_exempt).toBe(false);
      expect(don.professional_expense_parent_required).toBe(false);
      expect(don.professional_expense_imputed_savings).toBeNull();
    });
  });

  describe('exemption flag mutual exclusion', () => {
    it('only 1 exemption flag can be active at a time', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_expressly_exempt: true,
              }),
            ],
          }}
          onValues={onValues}
        />
      );

      // Click a different exemption flag
      await user.click(screen.getByText(/Customary Gift/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const don = onValues.mock.calls[0][0].donations[0];
      // The newly selected flag should be true
      expect(don.is_customary_gift).toBe(true);
      // The previously active flag should be false
      expect(don.is_expressly_exempt).toBe(false);
    });

    it('deselecting the active flag results in no exemption flags active', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_expressly_exempt: true,
              }),
            ],
          }}
          onValues={onValues}
        />
      );

      // Click the same flag to toggle it off
      await user.click(screen.getByText(/Expressly Exempt/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const don = onValues.mock.calls[0][0].donations[0];
      // All exemption flags should be false
      for (const flag of EXEMPTION_FLAGS) {
        expect(don[flag]).toBe(false);
      }
    });
  });

  describe('professional expense cascade', () => {
    it('shows parent_required toggle when is_professional_expense is true', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_professional_expense: true,
              }),
            ],
          }}
        />
      );
      expect(screen.getByText(/Parent Co-Signature Required/i)).toBeInTheDocument();
    });

    it('hides parent_required when is_professional_expense is false', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_professional_expense: false,
              }),
            ],
          }}
        />
      );
      expect(screen.queryByText(/Parent Co-Signature Required/i)).not.toBeInTheDocument();
    });

    it('shows imputed_savings MoneyInput when parent_required is true', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_professional_expense: true,
                professional_expense_parent_required: true,
              }),
            ],
          }}
        />
      );
      expect(screen.getByText(/Imputed Savings/i)).toBeInTheDocument();
    });

    it('hides imputed_savings when parent_required is false', () => {
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                recipient_is_stranger: false,
                is_professional_expense: true,
                professional_expense_parent_required: false,
              }),
            ],
          }}
        />
      );
      expect(screen.queryByText(/Imputed Savings/i)).not.toBeInTheDocument();
    });

    it('3-level cascade: professional → parent_required → imputed_savings', async () => {
      const user = userEvent.setup();
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [createDefaultDonation({ recipient_is_stranger: false })],
          }}
        />
      );

      // Initially: professional expense hidden sub-fields
      expect(screen.queryByText(/Parent Co-Signature Required/i)).not.toBeInTheDocument();

      // Enable professional expense
      await user.click(screen.getByText(/Professional\/Business Expense/i));
      await waitFor(() => {
        expect(screen.getByText(/Parent Co-Signature Required/i)).toBeInTheDocument();
      });

      // Enable parent required
      await user.click(screen.getByText(/Parent Co-Signature Required/i));
      await waitFor(() => {
        expect(screen.getByText(/Imputed Savings/i)).toBeInTheDocument();
      });
    });
  });

  describe('remove button', () => {
    it('calls onRemove with the card index when Remove is clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();
      render(<DonationCardWrapper index={2} onRemove={onRemove} />);
      await user.click(screen.getByText(/Remove/i));
      expect(onRemove).toHaveBeenCalledWith(2);
    });
  });

  describe('constants', () => {
    it('EXEMPTION_FLAGS has 11 flag names', () => {
      expect(EXEMPTION_FLAGS).toHaveLength(11);
    });

    it('EXEMPTION_FLAGS contains all expected flag names', () => {
      expect(EXEMPTION_FLAGS).toContain('is_expressly_exempt');
      expect(EXEMPTION_FLAGS).toContain('is_support_education_medical');
      expect(EXEMPTION_FLAGS).toContain('is_customary_gift');
      expect(EXEMPTION_FLAGS).toContain('is_professional_expense');
      expect(EXEMPTION_FLAGS).toContain('is_joint_from_both_parents');
      expect(EXEMPTION_FLAGS).toContain('is_to_child_spouse_only');
      expect(EXEMPTION_FLAGS).toContain('is_joint_to_child_and_spouse');
      expect(EXEMPTION_FLAGS).toContain('is_wedding_gift');
      expect(EXEMPTION_FLAGS).toContain('is_debt_payment_for_child');
      expect(EXEMPTION_FLAGS).toContain('is_election_expense');
      expect(EXEMPTION_FLAGS).toContain('is_fine_payment');
    });
  });

  describe('serialization', () => {
    it('donation value serializes as { centavos: number }', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DonationCardWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const don = onValues.mock.calls[0][0].donations[0];
      expect(don.value_at_time_of_donation).toHaveProperty('centavos');
    });

    it('date serializes as YYYY-MM-DD string', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DonationCardWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const don = onValues.mock.calls[0][0].donations[0];
      expect(don.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('professional_expense_imputed_savings serializes as Money | null', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DonationCardWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({
                is_professional_expense: true,
                professional_expense_parent_required: true,
                professional_expense_imputed_savings: { centavos: 50000 },
              }),
            ],
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const don = onValues.mock.calls[0][0].donations[0];
      expect(don.professional_expense_imputed_savings).toHaveProperty('centavos');
    });
  });
});
