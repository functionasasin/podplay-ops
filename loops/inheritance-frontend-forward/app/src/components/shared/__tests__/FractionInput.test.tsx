import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { FractionInput, FRACTION_PRESETS } from '../FractionInput';
import { fracToString, stringToFrac } from '../../../types';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context
// --------------------------------------------------------------------------
interface TestForm {
  fraction: string | null;
}

function FractionInputWrapper({
  defaultValue = null,
  onValues,
  ...props
}: {
  defaultValue?: string | null;
  onValues?: (values: TestForm) => void;
} & Partial<React.ComponentProps<typeof FractionInput<TestForm>>>) {
  const methods = useForm<TestForm>({
    defaultValues: { fraction: defaultValue },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <FractionInput<TestForm>
          name="fraction"
          label="Share Fraction"
          control={methods.control}
          {...props}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------
describe('shared > FractionInput', () => {
  describe('rendering', () => {
    it('renders with the correct label', () => {
      render(<FractionInputWrapper />);
      expect(screen.getByText(/Share Fraction/)).toBeInTheDocument();
    });

    it('renders numerator and denominator input fields', () => {
      render(<FractionInputWrapper />);
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders a "/" divider between numerator and denominator', () => {
      render(<FractionInputWrapper />);
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(<FractionInputWrapper error="Fraction is required" />);
      expect(screen.getByText('Fraction is required')).toBeInTheDocument();
    });
  });

  describe('fraction serialization', () => {
    it('entering numerator 1 and denominator 2 produces form value "1/2"', async () => {
      const onValues = vi.fn();
      render(<FractionInputWrapper onValues={onValues} />);

      const [numerInput, denomInput] = screen.getAllByRole('spinbutton');
      await userEvent.clear(numerInput);
      await userEvent.type(numerInput, '1');
      await userEvent.clear(denomInput);
      await userEvent.type(denomInput, '2');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ fraction: '1/2' }),
        );
      });
    });

    it('entering numerator 2 and denominator 3 produces form value "2/3"', async () => {
      const onValues = vi.fn();
      render(<FractionInputWrapper onValues={onValues} />);

      const [numerInput, denomInput] = screen.getAllByRole('spinbutton');
      await userEvent.clear(numerInput);
      await userEvent.type(numerInput, '2');
      await userEvent.clear(denomInput);
      await userEvent.type(denomInput, '3');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ fraction: '2/3' }),
        );
      });
    });

    it('pre-populates from "3/4" default value', () => {
      render(<FractionInputWrapper defaultValue="3/4" />);
      const [numerInput, denomInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(numerInput.value).toBe('3');
      expect(denomInput.value).toBe('4');
    });
  });

  describe('preset buttons', () => {
    it('renders preset buttons by default', () => {
      render(<FractionInputWrapper />);
      for (const preset of FRACTION_PRESETS) {
        expect(screen.getByRole('button', { name: preset.label })).toBeInTheDocument();
      }
    });

    it('clicking "1/2" preset sets value to "1/2"', async () => {
      const onValues = vi.fn();
      render(<FractionInputWrapper onValues={onValues} />);

      await userEvent.click(screen.getByRole('button', { name: '1/2' }));

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ fraction: '1/2' }),
        );
      });
    });

    it('clicking "2/3" preset sets value to "2/3"', async () => {
      const onValues = vi.fn();
      render(<FractionInputWrapper onValues={onValues} />);

      await userEvent.click(screen.getByRole('button', { name: '2/3' }));

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ fraction: '2/3' }),
        );
      });
    });

    it('hides preset buttons when showPresets=false', () => {
      render(<FractionInputWrapper showPresets={false} />);
      for (const preset of FRACTION_PRESETS) {
        expect(screen.queryByRole('button', { name: preset.label })).not.toBeInTheDocument();
      }
    });
  });

  describe('read-only mode', () => {
    it('renders as read-only when readOnly prop is true', () => {
      render(<FractionInputWrapper readOnly defaultValue="1/2" />);
      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      for (const input of inputs) {
        expect(input.readOnly || input.getAttribute('aria-readonly') === 'true' || input.disabled).toBe(true);
      }
    });
  });

  describe('FRACTION_PRESETS constant', () => {
    it('has exactly 5 presets', () => {
      expect(FRACTION_PRESETS).toHaveLength(5);
    });

    it('contains 1/2, 1/3, 1/4, 2/3, 3/4', () => {
      const labels = FRACTION_PRESETS.map((p) => p.label);
      expect(labels).toEqual(['1/2', '1/3', '1/4', '2/3', '3/4']);
    });

    it('each preset has numer and denom matching label', () => {
      for (const preset of FRACTION_PRESETS) {
        expect(fracToString(preset.numer, preset.denom)).toBe(preset.label);
      }
    });
  });

  describe('utility function integration', () => {
    it('fracToString(1, 2) === "1/2"', () => {
      expect(fracToString(1, 2)).toBe('1/2');
    });

    it('stringToFrac("1/2") === {numer: 1, denom: 2}', () => {
      expect(stringToFrac('1/2')).toEqual({ numer: 1, denom: 2 });
    });

    it('fracToString(3, 4) === "3/4"', () => {
      expect(fracToString(3, 4)).toBe('3/4');
    });

    it('stringToFrac("2/3") === {numer: 2, denom: 3}', () => {
      expect(stringToFrac('2/3')).toEqual({ numer: 2, denom: 3 });
    });
  });
});
