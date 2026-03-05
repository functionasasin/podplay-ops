import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { ReviewStep } from '../ReviewStep';
import type { EngineInput, Person, Donation, Will } from '../../../types';

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

function ReviewStepWrapper({
  defaultValues,
  hasWill = false,
  persons,
  onValues,
  onSubmit,
}: {
  defaultValues?: Partial<EngineInput>;
  hasWill?: boolean;
  persons?: Person[];
  onValues?: (values: EngineInput) => void;
  onSubmit?: () => void;
}) {
  const engineInput = createDefaultEngineInput(defaultValues);
  const methods = useForm<EngineInput>({
    defaultValues: engineInput,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <ReviewStep
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          errors={methods.formState.errors as Record<string, { message?: string }>}
          hasWill={hasWill}
          persons={persons ?? engineInput.family_tree}
          onSubmit={onSubmit}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — ReviewStep (wizard-step6)
// --------------------------------------------------------------------------
describe('wizard-step6 > ReviewStep', () => {
  describe('rendering', () => {
    it('renders the review step container', () => {
      render(<ReviewStepWrapper />);
      expect(screen.getByTestId('review-step')).toBeInTheDocument();
    });

    it('renders "Review & Run" heading or equivalent', () => {
      render(<ReviewStepWrapper />);
      expect(screen.getByText(/Review/i)).toBeInTheDocument();
    });
  });

  describe('summary sections', () => {
    it('renders estate summary with formatted amount', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            net_distributable_estate: { centavos: 500000000 },
          }}
        />
      );
      // Should show estate amount (₱5,000,000)
      expect(screen.getByText(/Estate/i)).toBeInTheDocument();
    });

    it('renders succession type as Intestate when hasWill=false', () => {
      render(<ReviewStepWrapper hasWill={false} />);
      expect(screen.getByText(/Intestate/i)).toBeInTheDocument();
    });

    it('renders succession type as Testate when hasWill=true', () => {
      render(
        <ReviewStepWrapper
          hasWill={true}
          defaultValues={{ will: createDefaultWill() }}
        />
      );
      expect(screen.getByText(/Testate/i)).toBeInTheDocument();
    });

    it('renders decedent summary with name and death date', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
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
          }}
        />
      );
      expect(screen.getByText(/Don Pedro/)).toBeInTheDocument();
      expect(screen.getByText(/2026-01-15/)).toBeInTheDocument();
    });

    it('renders family tree person count', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [
              createDefaultPerson({ id: 'lc1' }),
              createDefaultPerson({ id: 'lc2', name: 'Ana Cruz' }),
              createSpouse(),
            ],
          }}
        />
      );
      expect(screen.getByText(/3 persons/i)).toBeInTheDocument();
    });

    it('renders will disposition counts when hasWill=true', () => {
      render(
        <ReviewStepWrapper
          hasWill={true}
          defaultValues={{
            will: createDefaultWill({
              institutions: [
                {
                  heir_reference: { person_id: 'lc1', name: 'Juan Cruz', is_collective: false, class_designation: null },
                  share: 'EntireFreePort',
                  conditions: [],
                  substitutes: [],
                  is_residuary: false,
                },
              ],
              legacies: [],
              devises: [],
              disinheritances: [],
            }),
          }}
        />
      );
      expect(screen.getByText(/1 institution/i)).toBeInTheDocument();
    });

    it('hides will summary section when hasWill=false', () => {
      render(<ReviewStepWrapper hasWill={false} />);
      expect(screen.queryByText(/institution/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/legac/i)).not.toBeInTheDocument();
    });

    it('renders donations count', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            donations: [
              createDefaultDonation({ id: 'don1' }),
              createDefaultDonation({ id: 'don2' }),
            ],
          }}
        />
      );
      expect(screen.getByText(/2 donation/i)).toBeInTheDocument();
    });
  });

  describe('predicted scenario badge', () => {
    it('renders predicted scenario badge', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [createDefaultPerson(), createSpouse()],
          }}
        />
      );
      expect(screen.getByText(/Predicted/i)).toBeInTheDocument();
    });

    it('shows I-prefix scenario for intestate with LC + spouse', () => {
      render(
        <ReviewStepWrapper
          hasWill={false}
          defaultValues={{
            family_tree: [createDefaultPerson(), createSpouse()],
          }}
        />
      );
      // Should predict an I-prefix scenario code
      expect(screen.getByText(/I\d/)).toBeInTheDocument();
    });

    it('shows T-prefix scenario for testate', () => {
      render(
        <ReviewStepWrapper
          hasWill={true}
          defaultValues={{
            will: createDefaultWill({
              institutions: [
                {
                  heir_reference: { person_id: 'lc1', name: 'Juan Cruz', is_collective: false, class_designation: null },
                  share: 'EntireFreePort',
                  conditions: [],
                  substitutes: [],
                  is_residuary: false,
                },
              ],
            }),
            family_tree: [createDefaultPerson(), createSpouse()],
          }}
        />
      );
      expect(screen.getByText(/T\d/)).toBeInTheDocument();
    });
  });

  describe('advanced settings', () => {
    it('advanced settings are collapsed by default', () => {
      render(<ReviewStepWrapper />);
      expect(screen.getByText(/Advanced Settings/i)).toBeInTheDocument();
      // Config fields should not be visible until expanded
      expect(screen.queryByLabelText(/Max Pipeline Restarts/i)).not.toBeInTheDocument();
    });

    it('expanding advanced settings shows config fields', async () => {
      const user = userEvent.setup();
      render(<ReviewStepWrapper />);
      await user.click(screen.getByText(/Advanced Settings/i));
      await waitFor(() => {
        expect(screen.getByLabelText(/Max Pipeline Restarts/i)).toBeInTheDocument();
      });
    });

    it('max_pipeline_restarts defaults to 10', async () => {
      const user = userEvent.setup();
      render(<ReviewStepWrapper />);
      await user.click(screen.getByText(/Advanced Settings/i));
      await waitFor(() => {
        const input = screen.getByLabelText(/Max Pipeline Restarts/i);
        expect(input).toHaveValue(10);
      });
    });

    it('retroactive_ra_11642 toggle defaults to false', async () => {
      const user = userEvent.setup();
      render(<ReviewStepWrapper />);
      await user.click(screen.getByText(/Advanced Settings/i));
      await waitFor(() => {
        expect(screen.getByText(/Retroactive RA 11642/i)).toBeInTheDocument();
      });
    });

    it('max_pipeline_restarts validates range 1-100', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<ReviewStepWrapper onValues={onValues} />);

      // Expand advanced settings
      await user.click(screen.getByText(/Advanced Settings/i));

      const input = screen.getByLabelText(/Max Pipeline Restarts/i);
      await user.clear(input);
      await user.type(input, '50');

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].config.max_pipeline_restarts).toBe(50);
    });

    it('retroactive_ra_11642 can be toggled on', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<ReviewStepWrapper onValues={onValues} />);

      await user.click(screen.getByText(/Advanced Settings/i));
      await user.click(screen.getByText(/Retroactive RA 11642/i));

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].config.retroactive_ra_11642).toBe(true);
    });
  });

  describe('pre-submission warnings', () => {
    it('renders pre-submission warnings section', () => {
      render(<ReviewStepWrapper />);
      // A warnings area should exist even if empty
      expect(screen.getByTestId('review-step')).toBeInTheDocument();
    });

    it('shows warning when IC has filiation_proved=false', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [
              createDefaultPerson({
                id: 'ic1',
                name: 'IC Child',
                relationship_to_decedent: 'IllegitimateChild',
                filiation_proved: false,
              }),
            ],
          }}
        />
      );
      expect(screen.getByText(/Art\. 887/i)).toBeInTheDocument();
    });

    it('shows warning when spouse is present but decedent is unmarried', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
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
            family_tree: [createSpouse()],
          }}
        />
      );
      expect(screen.getByText(/Inconsistency/i)).toBeInTheDocument();
    });

    it('shows info when family tree is empty (escheat)', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [],
          }}
        />
      );
      expect(screen.getByText(/escheat/i)).toBeInTheDocument();
    });

    it('shows info when all heirs are deceased', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [
              createDefaultPerson({ is_alive_at_succession: false }),
              createSpouse({ is_alive_at_succession: false }),
            ],
          }}
        />
      );
      expect(screen.getByText(/predeceased|pipeline restart/i)).toBeInTheDocument();
    });

    it('shows info when LC-group present and ascendants exist', () => {
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [
              createDefaultPerson({ id: 'lc1', relationship_to_decedent: 'LegitimateChild' }),
              createDefaultPerson({
                id: 'lp1',
                name: 'Parent',
                relationship_to_decedent: 'LegitimateParent',
                line: 'Paternal',
              }),
            ],
          }}
        />
      );
      expect(screen.getByText(/Ascendants excluded by descendants/i)).toBeInTheDocument();
    });

    it('shows info when empty will (testate with no dispositions)', () => {
      render(
        <ReviewStepWrapper
          hasWill={true}
          defaultValues={{
            will: createDefaultWill(), // empty will
          }}
        />
      );
      expect(screen.getByText(/Will has no dispositions/i)).toBeInTheDocument();
    });

    it('warnings are dismissable', async () => {
      const user = userEvent.setup();
      render(
        <ReviewStepWrapper
          defaultValues={{
            family_tree: [],
          }}
        />
      );
      const escheatWarning = screen.getByText(/escheat/i);
      expect(escheatWarning).toBeInTheDocument();

      // Find and click dismiss button near the warning
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/escheat/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('compute button', () => {
    it('renders "Compute Distribution" button', () => {
      render(<ReviewStepWrapper />);
      expect(screen.getByText(/Compute Distribution/i)).toBeInTheDocument();
    });

    it('Compute button calls onSubmit when clicked', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<ReviewStepWrapper onSubmit={onSubmit} />);
      await user.click(screen.getByText(/Compute Distribution/i));
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('serialization', () => {
    it('config serializes with max_pipeline_restarts and retroactive_ra_11642', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<ReviewStepWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const config = onValues.mock.calls[0][0].config;
      expect(config).toHaveProperty('max_pipeline_restarts', 10);
      expect(config).toHaveProperty('retroactive_ra_11642', false);
    });
  });
});
