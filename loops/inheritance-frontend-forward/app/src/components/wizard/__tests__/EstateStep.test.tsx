import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { EstateStep } from '../EstateStep';
import type { EngineInput } from '../../../types';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context with EngineInput shape
// --------------------------------------------------------------------------
function createDefaultEngineInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 0 },
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
    family_tree: [],
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
  };
}

function EstateStepWrapper({
  defaultValues,
  hasWill = false,
  onHasWillChange,
  onValues,
}: {
  defaultValues?: Partial<EngineInput>;
  hasWill?: boolean;
  onHasWillChange?: (hasWill: boolean) => void;
  onValues?: (values: EngineInput) => void;
}) {
  const [willState, setWillState] = React.useState(hasWill);
  const methods = useForm<EngineInput>({
    defaultValues: { ...createDefaultEngineInput(), ...defaultValues },
  });

  const handleHasWillChange = (val: boolean) => {
    setWillState(val);
    onHasWillChange?.(val);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <EstateStep
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          hasWill={willState}
          onHasWillChange={handleHasWillChange}
          errors={methods.formState.errors as Record<string, { message?: string }>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — EstateStep
// --------------------------------------------------------------------------
describe('wizard-step1 > EstateStep', () => {
  describe('rendering', () => {
    it('renders the estate step container', () => {
      render(<EstateStepWrapper />);
      expect(screen.getByTestId('estate-step')).toBeInTheDocument();
    });

    it('renders a MoneyInput for net distributable estate', () => {
      render(<EstateStepWrapper />);
      expect(screen.getByText(/Net Distributable Estate/i)).toBeInTheDocument();
    });

    it('renders peso prefix symbol', () => {
      render(<EstateStepWrapper />);
      expect(screen.getByText('₱')).toBeInTheDocument();
    });

    it('renders succession type toggle/radio with Intestate and Testate options', () => {
      render(<EstateStepWrapper />);
      expect(screen.getByText(/Succession Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Intestate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Testate/i)).toBeInTheDocument();
    });

    it('renders estate hint text', () => {
      render(<EstateStepWrapper />);
      expect(
        screen.getByText(/Total estate value after debts, taxes/i)
      ).toBeInTheDocument();
    });
  });

  describe('hasWill toggle', () => {
    it('defaults to intestate (hasWill = false)', () => {
      render(<EstateStepWrapper />);
      const intestateRadio = screen.getByLabelText(/Intestate/i);
      expect(intestateRadio).toBeChecked();
    });

    it('toggling to Testate calls onHasWillChange with true', async () => {
      const onHasWillChange = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper onHasWillChange={onHasWillChange} />);
      await user.click(screen.getByLabelText(/Testate/i));
      expect(onHasWillChange).toHaveBeenCalledWith(true);
    });

    it('toggling to Intestate calls onHasWillChange with false', async () => {
      const onHasWillChange = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper hasWill={true} onHasWillChange={onHasWillChange} />);
      await user.click(screen.getByLabelText(/Intestate/i));
      expect(onHasWillChange).toHaveBeenCalledWith(false);
    });

    it('hasWill=true selects the Testate radio', () => {
      render(<EstateStepWrapper hasWill={true} />);
      const testateRadio = screen.getByLabelText(/Testate/i);
      expect(testateRadio).toBeChecked();
    });

    it('toggling hasWill to true sets will field to non-null empty Will object', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper onValues={onValues} />);

      // First enter a valid estate amount
      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '1000');

      // Toggle to testate
      await user.click(screen.getByLabelText(/Testate/i));

      // Submit and check will is initialized
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.will).not.toBeNull();
      expect(data.will).toHaveProperty('date_executed');
      expect(data.will).toHaveProperty('institutions');
      expect(data.will).toHaveProperty('legacies');
      expect(data.will).toHaveProperty('devises');
      expect(data.will).toHaveProperty('disinheritances');
    });

    it('toggling hasWill to false sets will field to null', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <EstateStepWrapper
          hasWill={true}
          defaultValues={{
            net_distributable_estate: { centavos: 100000 },
            will: {
              date_executed: '',
              institutions: [],
              legacies: [],
              devises: [],
              disinheritances: [],
            },
          }}
          onValues={onValues}
        />
      );

      // Toggle to intestate
      await user.click(screen.getByLabelText(/Intestate/i));

      // Submit and check will is null
      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.will).toBeNull();
    });
  });

  describe('estate value input', () => {
    it('entering a peso amount stores centavos in form', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper onValues={onValues} />);

      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '5000000');
      fireEvent.blur(input);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.net_distributable_estate.centavos).toBe(500000000);
    });

    it('displays formatted peso value on blur', async () => {
      const user = userEvent.setup();
      render(<EstateStepWrapper />);

      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '5000000');
      fireEvent.blur(input);

      // Should show formatted value with commas
      expect(input).toHaveValue('₱5,000,000.00');
    });
  });

  describe('validation', () => {
    it('shows error when estate is zero', async () => {
      const user = userEvent.setup();
      render(<EstateStepWrapper />);

      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '0');
      fireEvent.blur(input);

      // Warning should appear
      await waitFor(() => {
        expect(
          screen.getByText(/Estate must be greater than zero/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('serialization', () => {
    it('estate value serializes as { centavos: number }', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper onValues={onValues} />);

      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '500');
      fireEvent.blur(input);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.net_distributable_estate).toEqual({ centavos: 50000 });
    });

    it('will is null when intestate (hasWill=false)', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<EstateStepWrapper onValues={onValues} />);

      // Enter valid estate to allow submission
      const input = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(input);
      await user.type(input, '1000');
      fireEvent.blur(input);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].will).toBeNull();
    });
  });
});
