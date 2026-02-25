import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { PersonPicker, PersonOption } from '../PersonPicker';

// --------------------------------------------------------------------------
// Test data
// --------------------------------------------------------------------------
const MOCK_PERSONS: PersonOption[] = [
  { id: 'lc1', name: 'Juan Dela Cruz', relationship: 'LegitimateChild' },
  { id: 'lc2', name: 'Maria Dela Cruz', relationship: 'LegitimateChild' },
  { id: 'sp', name: 'Ana Santos', relationship: 'SurvivingSpouse' },
  { id: 'ic1', name: 'Pedro Garcia', relationship: 'IllegitimateChild' },
  { id: 'sib1', name: 'Carlos Dela Cruz', relationship: 'Sibling' },
  { id: 'la1', name: 'Grandmother Rosa', relationship: 'LegitimateAscendant' },
];

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context
// --------------------------------------------------------------------------
interface TestForm {
  selectedPerson: string | null;
}

function PersonPickerWrapper({
  defaultValue = null,
  onValues,
  persons = MOCK_PERSONS,
  ...props
}: {
  defaultValue?: string | null;
  onValues?: (values: TestForm) => void;
  persons?: PersonOption[];
} & Partial<React.ComponentProps<typeof PersonPicker<TestForm>>>) {
  const methods = useForm<TestForm>({
    defaultValues: { selectedPerson: defaultValue },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <PersonPicker<TestForm>
          name="selectedPerson"
          label="Heir"
          control={methods.control}
          persons={persons}
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
describe('shared > PersonPicker', () => {
  describe('rendering', () => {
    it('renders with the correct label', () => {
      render(<PersonPickerWrapper />);
      expect(screen.getByText(/Heir/)).toBeInTheDocument();
    });

    it('renders a select/combobox element', () => {
      render(<PersonPickerWrapper />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      expect(select).toBeInTheDocument();
    });

    it('renders all person options', () => {
      render(<PersonPickerWrapper />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      for (const person of MOCK_PERSONS) {
        expect(screen.getByText(new RegExp(person.name))).toBeInTheDocument();
      }
    });

    it('displays error message when provided', () => {
      render(<PersonPickerWrapper error="Please select an heir" />);
      expect(screen.getByText('Please select an heir')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('selects a person and updates form value to their ID', async () => {
      const onValues = vi.fn();
      render(<PersonPickerWrapper onValues={onValues} />);

      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      await userEvent.selectOptions(select, 'lc1');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ selectedPerson: 'lc1' }),
        );
      });
    });

    it('shows person name + relationship badge in options', () => {
      render(<PersonPickerWrapper />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      // Should show relationship info alongside name
      expect(screen.getByText(/Juan Dela Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/LegitimateChild|Legitimate Child/)).toBeInTheDocument();
    });

    it('pre-selects person from default value', () => {
      render(<PersonPickerWrapper defaultValue="sp" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('sp');
    });
  });

  describe('stranger option', () => {
    it('shows "Other (not in family tree)" option when allowStranger=true', () => {
      render(<PersonPickerWrapper allowStranger />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      expect(screen.getByText(/Other|not in family tree|stranger/i)).toBeInTheDocument();
    });

    it('selecting stranger sets person_id to null', async () => {
      const onValues = vi.fn();
      render(<PersonPickerWrapper allowStranger onValues={onValues} />);

      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      // Select the stranger/other option
      const strangerOption = screen.getByText(/Other|not in family tree|stranger/i);
      await userEvent.click(strangerOption);

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
        expect(onValues.mock.calls[0][0].selectedPerson).toBeNull();
      });
    });

    it('does not show stranger option when allowStranger=false', () => {
      render(<PersonPickerWrapper allowStranger={false} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      expect(screen.queryByText(/Other|not in family tree|stranger/i)).not.toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('applies filter to restrict available options', () => {
      const compulsoryOnly = (p: PersonOption) =>
        ['LegitimateChild', 'IllegitimateChild', 'SurvivingSpouse', 'LegitimateAscendant'].includes(
          p.relationship ?? '',
        );

      render(<PersonPickerWrapper filter={compulsoryOnly} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      // Compulsory heirs should be visible
      expect(screen.getByText(/Juan Dela Cruz/)).toBeInTheDocument();
      expect(screen.getByText(/Ana Santos/)).toBeInTheDocument();

      // Sibling (collateral) should NOT be visible
      expect(screen.queryByText(/Carlos Dela Cruz/)).not.toBeInTheDocument();
    });

    it('applies excludeIds to hide specific persons', () => {
      render(<PersonPickerWrapper excludeIds={['lc1', 'sp']} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      // Excluded persons should not be visible
      expect(screen.queryByText(/Juan Dela Cruz/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Ana Santos/)).not.toBeInTheDocument();

      // Non-excluded should remain
      expect(screen.getByText(/Maria Dela Cruz/)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty select when no persons provided', () => {
      render(<PersonPickerWrapper persons={[]} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      expect(select).toBeInTheDocument();
    });
  });

  describe('label variants', () => {
    it('renders "Recipient" label for donation context', () => {
      render(<PersonPickerWrapper label="Recipient" />);
      expect(screen.getByText(/Recipient/)).toBeInTheDocument();
    });

    it('renders "Children" label for children context', () => {
      render(<PersonPickerWrapper label="Children" />);
      expect(screen.getByText(/Children/)).toBeInTheDocument();
    });
  });
});
