import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DecedentStep } from '../DecedentStep';
import { MARRIAGE_DEFAULTS } from '../WizardContainer';
import type { EngineInput, Decedent } from '../../../types';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context with EngineInput shape
// --------------------------------------------------------------------------
function createDefaultEngineInput(
  overrides?: Partial<Decedent>
): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000 },
    decedent: {
      id: 'd',
      name: '',
      date_of_death: '2026-01-15',
      is_married: false,
      date_of_marriage: null,
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 0,
      has_legal_separation: false,
      is_illegitimate: false,
      ...overrides,
    },
    family_tree: [],
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
  };
}

function DecedentStepWrapper({
  decedentOverrides,
  onValues,
}: {
  decedentOverrides?: Partial<Decedent>;
  onValues?: (values: EngineInput) => void;
} = {}) {
  const methods = useForm<EngineInput>({
    defaultValues: createDefaultEngineInput(decedentOverrides),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <DecedentStep
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
// Tests — DecedentStep
// --------------------------------------------------------------------------
describe('wizard-step2 > DecedentStep', () => {
  describe('rendering — always visible fields', () => {
    it('renders the decedent step container', () => {
      render(<DecedentStepWrapper />);
      expect(screen.getByTestId('decedent-step')).toBeInTheDocument();
    });

    it('renders Full Name text input', () => {
      render(<DecedentStepWrapper />);
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    it('renders Date of Death date input', () => {
      render(<DecedentStepWrapper />);
      expect(screen.getByLabelText(/Date of Death/i)).toBeInTheDocument();
    });

    it('renders "Decedent is Illegitimate" toggle', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.getByLabelText(/Decedent is Illegitimate/i)
      ).toBeInTheDocument();
    });

    it('renders "Was Married at Time of Death" toggle', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.getByLabelText(/Was Married at Time of Death/i)
      ).toBeInTheDocument();
    });

    it('auto-sets decedent.id to "d"', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DecedentStepWrapper onValues={onValues} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Full Name/i), 'Juan Dela Cruz');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.id).toBe('d');
    });
  });

  describe('marriage fields hidden when is_married=false', () => {
    it('does not show Date of Marriage when unmarried', () => {
      render(<DecedentStepWrapper />);
      expect(screen.queryByLabelText(/Date of Marriage/i)).not.toBeInTheDocument();
    });

    it('does not show Years of Cohabitation when unmarried', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.queryByLabelText(/Years of Cohabitation/i)
      ).not.toBeInTheDocument();
    });

    it('does not show Legal Separation toggle when unmarried', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.queryByLabelText(/Legal Separation/i)
      ).not.toBeInTheDocument();
    });

    it('does not show Articulo Mortis toggle when unmarried', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.queryByLabelText(/Articulo Mortis/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('marriage fields shown when is_married=true', () => {
    it('shows Date of Marriage when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(screen.getByLabelText(/Date of Marriage/i)).toBeInTheDocument();
    });

    it('shows Years of Cohabitation when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(
        screen.getByLabelText(/Years of Cohabitation/i)
      ).toBeInTheDocument();
    });

    it('shows Legal Separation toggle when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(
        screen.getByLabelText(/Legal Separation/i)
      ).toBeInTheDocument();
    });

    it('shows Articulo Mortis toggle when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(
        screen.getByLabelText(/Articulo Mortis/i)
      ).toBeInTheDocument();
    });
  });

  describe('toggling is_married on/off', () => {
    it('checking is_married reveals marriage fields', async () => {
      const user = userEvent.setup();
      render(<DecedentStepWrapper />);
      expect(screen.queryByLabelText(/Date of Marriage/i)).not.toBeInTheDocument();

      await user.click(screen.getByLabelText(/Was Married at Time of Death/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/Date of Marriage/i)).toBeInTheDocument();
      });
    });

    it('unchecking is_married hides marriage fields', async () => {
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(screen.getByLabelText(/Date of Marriage/i)).toBeInTheDocument();

      await user.click(screen.getByLabelText(/Was Married at Time of Death/i));

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Date of Marriage/i)
        ).not.toBeInTheDocument();
      });
    });

    it('unchecking is_married resets all 6 marriage-gated fields to defaults', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            date_of_marriage: '2020-06-15',
            years_of_cohabitation: 10,
            has_legal_separation: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
          }}
          onValues={onValues}
        />
      );

      // Uncheck is_married
      await user.click(screen.getByLabelText(/Was Married at Time of Death/i));

      // Fill required name to submit
      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const decedent = onValues.mock.calls[0][0].decedent;
      expect(decedent.date_of_marriage).toBe(MARRIAGE_DEFAULTS.date_of_marriage);
      expect(decedent.years_of_cohabitation).toBe(
        MARRIAGE_DEFAULTS.years_of_cohabitation
      );
      expect(decedent.has_legal_separation).toBe(
        MARRIAGE_DEFAULTS.has_legal_separation
      );
      expect(decedent.marriage_solemnized_in_articulo_mortis).toBe(
        MARRIAGE_DEFAULTS.marriage_solemnized_in_articulo_mortis
      );
      expect(decedent.was_ill_at_marriage).toBe(
        MARRIAGE_DEFAULTS.was_ill_at_marriage
      );
      expect(decedent.illness_caused_death).toBe(
        MARRIAGE_DEFAULTS.illness_caused_death
      );
    });
  });

  describe('articulo mortis cascade (3-deep conditional visibility)', () => {
    it('was_ill_at_marriage hidden when articulo mortis is false', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: false,
          }}
        />
      );
      expect(
        screen.queryByLabelText(/Was Ill at Time of Marriage/i)
      ).not.toBeInTheDocument();
    });

    it('was_ill_at_marriage shown when articulo mortis is true', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
          }}
        />
      );
      expect(
        screen.getByLabelText(/Was Ill at Time of Marriage/i)
      ).toBeInTheDocument();
    });

    it('illness_caused_death hidden when was_ill_at_marriage is false', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: false,
          }}
        />
      );
      expect(
        screen.queryByLabelText(/Illness Caused Death/i)
      ).not.toBeInTheDocument();
    });

    it('illness_caused_death shown when was_ill_at_marriage is true', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
          }}
        />
      );
      expect(
        screen.getByLabelText(/Illness Caused Death/i)
      ).toBeInTheDocument();
    });

    it('toggling articulo mortis on reveals was_ill_at_marriage', async () => {
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );

      expect(
        screen.queryByLabelText(/Was Ill at Time of Marriage/i)
      ).not.toBeInTheDocument();

      await user.click(screen.getByLabelText(/Articulo Mortis/i));

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Was Ill at Time of Marriage/i)
        ).toBeInTheDocument();
      });
    });

    it('toggling articulo mortis off hides was_ill and resets child fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
          }}
          onValues={onValues}
        />
      );

      // Uncheck articulo mortis
      await user.click(screen.getByLabelText(/Articulo Mortis/i));

      // was_ill and illness should be hidden
      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Was Ill at Time of Marriage/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText(/Illness Caused Death/i)
        ).not.toBeInTheDocument();
      });

      // Submit and verify reset
      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const decedent = onValues.mock.calls[0][0].decedent;
      expect(decedent.was_ill_at_marriage).toBe(false);
      expect(decedent.illness_caused_death).toBe(false);
    });

    it('toggling was_ill_at_marriage off hides illness_caused_death and resets it', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
          }}
          onValues={onValues}
        />
      );

      // Uncheck was_ill
      await user.click(screen.getByLabelText(/Was Ill at Time of Marriage/i));

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/Illness Caused Death/i)
        ).not.toBeInTheDocument();
      });

      // Submit and verify reset
      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.illness_caused_death).toBe(false);
    });
  });

  describe('articulo mortis warning banner', () => {
    it('shows articulo mortis warning when all 4 conditions met and cohabitation < 5', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 3,
          }}
        />
      );
      expect(
        screen.getByText(/Articulo mortis marriage detected/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Art\. 900/i)).toBeInTheDocument();
    });

    it('does NOT show warning when cohabitation >= 5', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 5,
          }}
        />
      );
      expect(
        screen.queryByText(/Articulo mortis marriage detected/i)
      ).not.toBeInTheDocument();
    });

    it('does NOT show warning when illness_caused_death is false', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: false,
            years_of_cohabitation: 3,
          }}
        />
      );
      expect(
        screen.queryByText(/Articulo mortis marriage detected/i)
      ).not.toBeInTheDocument();
    });

    it('does NOT show warning when was_ill_at_marriage is false', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: false,
            years_of_cohabitation: 3,
          }}
        />
      );
      expect(
        screen.queryByText(/Articulo mortis marriage detected/i)
      ).not.toBeInTheDocument();
    });

    it('does NOT show warning when articulo mortis toggle is false', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: false,
            years_of_cohabitation: 3,
          }}
        />
      );
      expect(
        screen.queryByText(/Articulo mortis marriage detected/i)
      ).not.toBeInTheDocument();
    });

    it('shows warning with cohabitation = 0 (minimum case)', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 0,
          }}
        />
      );
      expect(
        screen.getByText(/Articulo mortis marriage detected/i)
      ).toBeInTheDocument();
    });

    it('shows warning with cohabitation = 4 (boundary case)', () => {
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 4,
          }}
        />
      );
      expect(
        screen.getByText(/Articulo mortis marriage detected/i)
      ).toBeInTheDocument();
    });
  });

  describe('field interactions', () => {
    it('entering a name updates decedent.name', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DecedentStepWrapper onValues={onValues} />);

      await user.type(screen.getByLabelText(/Full Name/i), 'Maria Santos');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.name).toBe('Maria Santos');
    });

    it('changing date_of_death updates form state', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DecedentStepWrapper onValues={onValues} />);

      await user.type(screen.getByLabelText(/Full Name/i), 'Test');

      const dateInput = screen.getByLabelText(/Date of Death/i);
      await user.clear(dateInput);
      fireEvent.change(dateInput, { target: { value: '2025-12-31' } });

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.date_of_death).toBe('2025-12-31');
    });

    it('toggling is_illegitimate updates form state', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DecedentStepWrapper onValues={onValues} />);

      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByLabelText(/Decedent is Illegitimate/i));
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.is_illegitimate).toBe(true);
    });

    it('years_of_cohabitation accepts non-negative integers', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      const yearsInput = screen.getByLabelText(/Years of Cohabitation/i);
      expect(yearsInput).toHaveAttribute('type', 'number');
      expect(yearsInput).toHaveAttribute('min', '0');
    });

    it('years_of_cohabitation defaults to 0', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      const yearsInput = screen.getByLabelText(/Years of Cohabitation/i);
      expect(yearsInput).toHaveValue(0);
    });
  });

  describe('is_illegitimate note', () => {
    it('shows info note about is_illegitimate affecting scenarios', () => {
      render(<DecedentStepWrapper />);
      // Spec: "(Note: Only affects scenario when no descendants and will exists — Arts. T14/T15 via Art. 903)"
      expect(
        screen.getByText(/Only affects scenario/i)
      ).toBeInTheDocument();
    });
  });

  describe('defaults', () => {
    it('is_married defaults to false', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.getByLabelText(/Was Married at Time of Death/i)
      ).not.toBeChecked();
    });

    it('is_illegitimate defaults to false', () => {
      render(<DecedentStepWrapper />);
      expect(
        screen.getByLabelText(/Decedent is Illegitimate/i)
      ).not.toBeChecked();
    });

    it('has_legal_separation defaults to false when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(
        screen.getByLabelText(/Legal Separation/i)
      ).not.toBeChecked();
    });

    it('marriage_solemnized_in_articulo_mortis defaults to false when married', () => {
      render(
        <DecedentStepWrapper decedentOverrides={{ is_married: true }} />
      );
      expect(
        screen.getByLabelText(/Articulo Mortis/i)
      ).not.toBeChecked();
    });
  });

  describe('serialization', () => {
    it('married decedent serializes all marriage fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DecedentStepWrapper
          decedentOverrides={{
            is_married: true,
            date_of_marriage: '2020-06-15',
            years_of_cohabitation: 5,
            has_legal_separation: false,
            marriage_solemnized_in_articulo_mortis: false,
          }}
          onValues={onValues}
        />
      );

      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });

      const decedent = onValues.mock.calls[0][0].decedent;
      expect(decedent.is_married).toBe(true);
      expect(decedent.date_of_marriage).toBe('2020-06-15');
      expect(decedent.years_of_cohabitation).toBe(5);
      expect(decedent.has_legal_separation).toBe(false);
      expect(decedent.marriage_solemnized_in_articulo_mortis).toBe(false);
    });

    it('unmarried decedent has null date_of_marriage', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<DecedentStepWrapper onValues={onValues} />);

      await user.type(screen.getByLabelText(/Full Name/i), 'Test');
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].decedent.date_of_marriage).toBeNull();
    });
  });
});
