import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DateInput } from '../DateInput';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context
// --------------------------------------------------------------------------
interface TestForm {
  date: string;
}

function DateInputWrapper({
  defaultValue = '',
  onValues,
  ...props
}: {
  defaultValue?: string;
  onValues?: (values: TestForm) => void;
} & Partial<React.ComponentProps<typeof DateInput<TestForm>>>) {
  const methods = useForm<TestForm>({
    defaultValues: { date: defaultValue },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <DateInput<TestForm>
          name="date"
          label="Date of Death"
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
describe('shared > DateInput', () => {
  describe('rendering', () => {
    it('renders with the correct label', () => {
      render(<DateInputWrapper />);
      expect(screen.getByText(/Date of Death/)).toBeInTheDocument();
    });

    it('renders a date input element', () => {
      render(<DateInputWrapper />);
      // Could be type="date" or type="text" with date validation
      const input = screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(<DateInputWrapper error="Date is required" />);
      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });

    it('displays hint text when provided', () => {
      render(<DateInputWrapper hint="Must be on or before today" />);
      expect(screen.getByText('Must be on or before today')).toBeInTheDocument();
    });
  });

  describe('valid date handling', () => {
    it('accepts valid YYYY-MM-DD date "2026-01-15"', async () => {
      const onValues = vi.fn();
      render(<DateInputWrapper onValues={onValues} />);

      const input = screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox');
      await userEvent.clear(input);
      // Use native change for date inputs which may be type="date"
      fireEvent.change(input, { target: { value: '2026-01-15' } });

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ date: '2026-01-15' }),
        );
      });
    });

    it('stores date as ISO 8601 string', async () => {
      const onValues = vi.fn();
      render(<DateInputWrapper onValues={onValues} />);

      const input = screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '2025-12-31' } });

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ date: '2025-12-31' }),
        );
      });
    });

    it('renders with pre-populated date value', () => {
      render(<DateInputWrapper defaultValue="2026-01-15" />);
      const input = (screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox')) as HTMLInputElement;
      expect(input.value).toBe('2026-01-15');
    });
  });

  describe('max date constraint', () => {
    it('renders with maxDate attribute when provided', () => {
      render(<DateInputWrapper maxDate="2026-01-15" />);
      const input = (screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox')) as HTMLInputElement;
      // For type="date", the max attribute should be set
      expect(input.max === '2026-01-15' || input.getAttribute('max') === '2026-01-15').toBeTruthy();
    });

    it('renders with minDate attribute when provided', () => {
      render(<DateInputWrapper minDate="2020-01-01" />);
      const input = (screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox')) as HTMLInputElement;
      expect(input.min === '2020-01-01' || input.getAttribute('min') === '2020-01-01').toBeTruthy();
    });
  });

  describe('label variants', () => {
    it('renders "Date of Marriage" label', () => {
      render(<DateInputWrapper label="Date of Marriage" />);
      expect(screen.getByText(/Date of Marriage/)).toBeInTheDocument();
    });

    it('renders "Will Execution Date" label', () => {
      render(<DateInputWrapper label="Will Execution Date" />);
      expect(screen.getByText(/Will Execution Date/)).toBeInTheDocument();
    });

    it('renders "Adoption Decree Date" label', () => {
      render(<DateInputWrapper label="Adoption Decree Date" />);
      expect(screen.getByText(/Adoption Decree Date/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty/cleared input', async () => {
      const onValues = vi.fn();
      render(<DateInputWrapper defaultValue="2026-01-15" onValues={onValues} />);

      const input = screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
        expect(onValues.mock.calls[0][0].date).toBe('');
      });
    });

    it('updates form state on change', async () => {
      const onValues = vi.fn();
      render(<DateInputWrapper onValues={onValues} />);

      const input = screen.getByLabelText(/Date of Death/i) ?? screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '2026-06-15' } });

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ date: '2026-06-15' }),
        );
      });
    });
  });
});
