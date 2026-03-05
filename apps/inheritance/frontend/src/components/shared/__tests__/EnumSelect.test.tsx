import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { EnumSelect, EnumOption } from '../EnumSelect';
import {
  RELATIONSHIPS,
  FILIATION_PROOFS,
  BLOOD_TYPES,
  DISINHERITANCE_CAUSES,
  type Relationship,
  type FiliationProof,
  type BloodType,
} from '../../../types';

// --------------------------------------------------------------------------
// Test data
// --------------------------------------------------------------------------
const RELATIONSHIP_OPTIONS: EnumOption<Relationship>[] = RELATIONSHIPS.map((r) => ({
  value: r,
  label: r.replace(/([A-Z])/g, ' $1').trim(), // PascalCase to spaced
}));

const BLOOD_TYPE_OPTIONS: EnumOption<BloodType>[] = BLOOD_TYPES.map((b) => ({
  value: b,
  label: b,
}));

const FILIATION_PROOF_OPTIONS: EnumOption<FiliationProof>[] = FILIATION_PROOFS.map((f) => ({
  value: f,
  label: f.replace(/([A-Z])/g, ' $1').trim(),
}));

const GROUPED_RELATIONSHIP_OPTIONS: EnumOption<Relationship>[] = [
  { value: 'LegitimateChild', label: 'Legitimate Child', group: 'Compulsory Heirs' },
  { value: 'LegitimatedChild', label: 'Legitimated Child', group: 'Compulsory Heirs' },
  { value: 'AdoptedChild', label: 'Adopted Child', group: 'Compulsory Heirs' },
  { value: 'IllegitimateChild', label: 'Illegitimate Child', group: 'Compulsory Heirs' },
  { value: 'SurvivingSpouse', label: 'Surviving Spouse', group: 'Compulsory Heirs' },
  { value: 'LegitimateParent', label: 'Legitimate Parent', group: 'Compulsory Heirs' },
  { value: 'LegitimateAscendant', label: 'Legitimate Ascendant', group: 'Compulsory Heirs' },
  { value: 'Sibling', label: 'Sibling', group: 'Collateral Heirs' },
  { value: 'NephewNiece', label: 'Nephew/Niece', group: 'Collateral Heirs' },
  { value: 'OtherCollateral', label: 'Other Collateral', group: 'Collateral Heirs' },
  { value: 'Stranger', label: 'Stranger', group: 'Other' },
];

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context
// --------------------------------------------------------------------------
interface TestForm {
  selected: string;
}

function EnumSelectWrapper({
  defaultValue = '',
  onValues,
  options = RELATIONSHIP_OPTIONS,
  ...props
}: {
  defaultValue?: string;
  onValues?: (values: TestForm) => void;
  options?: EnumOption[];
} & Partial<React.ComponentProps<typeof EnumSelect<TestForm>>>) {
  const methods = useForm<TestForm>({
    defaultValues: { selected: defaultValue },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <EnumSelect<TestForm>
          name="selected"
          label="Relationship"
          control={methods.control}
          options={options}
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
describe('shared > EnumSelect', () => {
  describe('rendering', () => {
    it('renders with the correct label', () => {
      render(<EnumSelectWrapper />);
      expect(screen.getByText(/Relationship/)).toBeInTheDocument();
    });

    it('renders a select element', () => {
      render(<EnumSelectWrapper />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      expect(select).toBeInTheDocument();
    });

    it('renders all 11 relationship options', () => {
      render(<EnumSelectWrapper options={RELATIONSHIP_OPTIONS} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      // All 11 relationships should be present as options
      const options = screen.getAllByRole('option');
      // +1 for possible placeholder option
      expect(options.length).toBeGreaterThanOrEqual(11);
    });

    it('displays error message when provided', () => {
      render(<EnumSelectWrapper error="Relationship is required" />);
      expect(screen.getByText('Relationship is required')).toBeInTheDocument();
    });

    it('displays placeholder when provided', () => {
      render(<EnumSelectWrapper placeholder="Select a relationship" />);
      expect(screen.getByText('Select a relationship')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('fires onChange and updates form value on selection', async () => {
      const onValues = vi.fn();
      render(<EnumSelectWrapper onValues={onValues} />);

      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      await userEvent.selectOptions(select, 'LegitimateChild');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ selected: 'LegitimateChild' }),
        );
      });
    });

    it('uses PascalCase enum values (not snake_case)', async () => {
      const onValues = vi.fn();
      render(<EnumSelectWrapper onValues={onValues} />);

      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      await userEvent.selectOptions(select, 'SurvivingSpouse');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ selected: 'SurvivingSpouse' }),
        );
      });
    });

    it('pre-selects from default value', () => {
      render(<EnumSelectWrapper defaultValue="AdoptedChild" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('AdoptedChild');
    });
  });

  describe('BloodType options', () => {
    it('renders exactly 2 blood type options', () => {
      render(<EnumSelectWrapper options={BLOOD_TYPE_OPTIONS} label="Blood Type" />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      expect(screen.getByText('Full')).toBeInTheDocument();
      expect(screen.getByText('Half')).toBeInTheDocument();
    });

    it('selecting "Full" updates form value', async () => {
      const onValues = vi.fn();
      render(
        <EnumSelectWrapper options={BLOOD_TYPE_OPTIONS} label="Blood Type" onValues={onValues} />,
      );

      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      await userEvent.selectOptions(select, 'Full');

      await userEvent.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalledWith(
          expect.objectContaining({ selected: 'Full' }),
        );
      });
    });
  });

  describe('FiliationProof options', () => {
    it('renders all 6 filiation proof options', () => {
      render(<EnumSelectWrapper options={FILIATION_PROOF_OPTIONS} label="Filiation Proof" />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('grouped options', () => {
    it('renders option groups when options have group property', () => {
      render(<EnumSelectWrapper options={GROUPED_RELATIONSHIP_OPTIONS} />);

      // Should render optgroup elements for each group
      const groups = screen.getAllByRole('group');
      expect(groups.length).toBeGreaterThanOrEqual(2); // At least Compulsory + Collateral
    });

    it('renders "Compulsory Heirs" group', () => {
      render(<EnumSelectWrapper options={GROUPED_RELATIONSHIP_OPTIONS} />);
      // optgroup label attribute is not text content; use getByRole with name
      expect(screen.getByRole('group', { name: 'Compulsory Heirs' })).toBeInTheDocument();
    });

    it('renders "Collateral Heirs" group', () => {
      render(<EnumSelectWrapper options={GROUPED_RELATIONSHIP_OPTIONS} />);
      expect(screen.getByRole('group', { name: 'Collateral Heirs' })).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('applies filter to restrict available options', () => {
      const compulsoryFilter = (opt: EnumOption) =>
        ['LegitimateChild', 'SurvivingSpouse', 'LegitimateParent'].includes(opt.value);

      render(<EnumSelectWrapper filter={compulsoryFilter} />);
      const select = screen.getByRole('combobox') ?? screen.getByRole('listbox');
      fireEvent.click(select);

      expect(screen.getByText(/Legitimate Child/)).toBeInTheDocument();
      expect(screen.queryByText(/Sibling/)).not.toBeInTheDocument();
    });
  });

  describe('enum value arrays', () => {
    it('RELATIONSHIPS has 11 entries', () => {
      expect(RELATIONSHIPS).toHaveLength(11);
    });

    it('FILIATION_PROOFS has 6 entries', () => {
      expect(FILIATION_PROOFS).toHaveLength(6);
    });

    it('BLOOD_TYPES has 2 entries', () => {
      expect(BLOOD_TYPES).toHaveLength(2);
    });

    it('DISINHERITANCE_CAUSES has 22 entries', () => {
      expect(DISINHERITANCE_CAUSES).toHaveLength(22);
    });
  });
});
