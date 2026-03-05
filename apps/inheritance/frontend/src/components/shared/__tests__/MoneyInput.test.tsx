import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { MoneyInput } from '../MoneyInput';
import { pesosToCentavos, centavosToPesos, formatPeso } from '../../../types';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context to the MoneyInput component
// --------------------------------------------------------------------------
interface TestForm {
  amount: number | string | null;
}

function MoneyInputWrapper({
  defaultValue = null,
  onValues,
  ...props
}: {
  defaultValue?: number | string | null;
  onValues?: (values: TestForm) => void;
} & Partial<React.ComponentProps<typeof MoneyInput<TestForm>>>) {
  const methods = useForm<TestForm>({
    defaultValues: { amount: defaultValue },
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit((data) => {
          onValues?.(data);
        })}
      >
        <MoneyInput<TestForm>
          name="amount"
          label="Amount"
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
describe('shared > MoneyInput', () => {
  describe('rendering', () => {
    it('renders with the correct label', () => {
      render(<MoneyInputWrapper label="Net Distributable Estate" />);
      expect(screen.getByText(/Net Distributable Estate/)).toBeInTheDocument();
    });

    it('renders with a peso prefix symbol', () => {
      render(<MoneyInputWrapper />);
      expect(screen.getByText('₱')).toBeInTheDocument();
    });

    it('renders an input element', () => {
      render(<MoneyInputWrapper />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows placeholder text when empty', () => {
      render(<MoneyInputWrapper placeholder="₱0" />);
      expect(screen.getByPlaceholderText('₱0')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(<MoneyInputWrapper error="Amount is required" />);
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  describe('peso-to-centavo conversion', () => {
    it('entering "500" sets form value to 50000 centavos', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '500');
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 50000 }),
        );
      });
    });

    it('entering "500.25" sets form value to 50025 centavos', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '500.25');
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 50025 }),
        );
      });
    });

    it('entering "0" sets form value to 0 centavos', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '0');
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 0 }),
        );
      });
    });

    it('entering "1" sets form value to 100 centavos', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '1');
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 100 }),
        );
      });
    });
  });

  describe('display formatting on blur', () => {
    it('displays "₱500.00" on blur after entering "500"', async () => {
      render(<MoneyInputWrapper />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '500');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input.value).toBe('500.00');
      });
    });

    it('displays "₱1,000.00" on blur after entering "1000"', async () => {
      render(<MoneyInputWrapper />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '1000');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input.value).toBe('1,000.00');
      });
    });

    it('clears formatting on focus to allow editing', async () => {
      render(<MoneyInputWrapper defaultValue={50000} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.focus(input);

      await waitFor(() => {
        // Should show raw number for editing, not formatted
        expect(input.value).not.toContain(',');
      });
    });
  });

  describe('read-only mode', () => {
    it('renders as read-only when readOnly prop is true', () => {
      render(<MoneyInputWrapper readOnly defaultValue={50000} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.readOnly || input.getAttribute('aria-readonly') === 'true').toBe(true);
    });

    it('displays formatted value in read-only mode', () => {
      render(<MoneyInputWrapper readOnly defaultValue={50000} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toContain('500');
    });
  });

  describe('warnOnZero', () => {
    it('shows a warning when value is 0 and warnOnZero is true', async () => {
      render(<MoneyInputWrapper warnOnZero defaultValue={0} />);

      await waitFor(() => {
        const warning = screen.queryByText(/zero|₱0/i);
        expect(warning).toBeInTheDocument();
      });
    });

    it('does not show a warning when value is non-zero', () => {
      render(<MoneyInputWrapper warnOnZero defaultValue={50000} />);
      const warning = screen.queryByText(/zero|₱0/i);
      expect(warning).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty input gracefully (null value)', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
        const amount = onValues.mock.calls[0][0].amount;
        expect(amount === null || amount === 0).toBe(true);
      });
    });

    it('rejects non-numeric input', async () => {
      render(<MoneyInputWrapper />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, 'abc');
      fireEvent.blur(input);

      await waitFor(() => {
        // Input should either be empty or show an error
        expect(input.value === '' || input.value === '0' || screen.queryByText(/invalid|number/i)).toBeTruthy();
      });
    });

    it('handles large amounts (5,000,000 pesos = 500,000,000 centavos)', async () => {
      const onValues = vi.fn();
      render(<MoneyInputWrapper onValues={onValues} />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '5000000');
      fireEvent.blur(input);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 500000000 }),
        );
      });
    });
  });

  describe('utility function integration', () => {
    it('pesosToCentavos(500) === 50000', () => {
      expect(pesosToCentavos(500)).toBe(50000);
    });

    it('centavosToPesos(50025) === 500.25', () => {
      expect(centavosToPesos(50025)).toBe(500.25);
    });

    it('formatPeso(500000000) === "₱5,000,000"', () => {
      expect(formatPeso(500000000)).toBe('₱5,000,000');
    });

    it('formatPeso(50025) === "₱500.25"', () => {
      expect(formatPeso(50025)).toBe('₱500.25');
    });
  });
});
