import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { FamilyTreeStep } from '../FamilyTreeStep';
import {
  PERSON_ID_PREFIXES,
  DEFAULT_DEGREE,
  DEGREE_RANGE,
  RELATIONSHIP_OPTIONS,
  FILIATION_PROOF_OPTIONS,
  CHILDREN_RELEVANT,
} from '../FamilyTreeStep';
import type { EngineInput, Person, Relationship } from '../../../types';

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context with EngineInput shape
// --------------------------------------------------------------------------
function createDefaultEngineInput(overrides?: Partial<EngineInput>): EngineInput {
  return {
    net_distributable_estate: { centavos: 100000 },
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
    ...overrides,
  };
}

function FamilyTreeStepWrapper({
  defaultValues,
  onValues,
}: {
  defaultValues?: Partial<EngineInput>;
  onValues?: (values: EngineInput) => void;
}) {
  const methods = useForm<EngineInput>({
    defaultValues: createDefaultEngineInput(defaultValues),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <FamilyTreeStep
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
// Tests — FamilyTreeStep
// --------------------------------------------------------------------------
describe('wizard-step3 > FamilyTreeStep', () => {
  describe('rendering', () => {
    it('renders the family tree step container', () => {
      render(<FamilyTreeStepWrapper />);
      expect(screen.getByTestId('family-tree-step')).toBeInTheDocument();
    });

    it('renders an "Add Person" button', () => {
      render(<FamilyTreeStepWrapper />);
      expect(screen.getByRole('button', { name: /add person/i })).toBeInTheDocument();
    });

    it('renders empty state message when no persons', () => {
      render(<FamilyTreeStepWrapper />);
      expect(screen.getByText(/no family members added/i)).toBeInTheDocument();
    });
  });

  describe('add/remove persons', () => {
    it('clicking "Add Person" adds a new person card', async () => {
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper />);

      await user.click(screen.getByRole('button', { name: /add person/i }));

      expect(screen.getByTestId('person-card')).toBeInTheDocument();
    });

    it('clicking "Add Person" twice adds two person cards', async () => {
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper />);

      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));

      expect(screen.getAllByTestId('person-card')).toHaveLength(2);
    });

    it('removing a person card reduces the count', async () => {
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper />);

      // Add two persons
      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));
      expect(screen.getAllByTestId('person-card')).toHaveLength(2);

      // Remove first person
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(screen.getAllByTestId('person-card')).toHaveLength(1);
    });
  });

  describe('auto-generated person IDs', () => {
    it('first LegitimateChild gets id "lc1"', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      await user.click(screen.getByRole('button', { name: /add person/i }));

      // Select relationship
      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.family_tree[0].id).toBe('lc1');
    });

    it('second LegitimateChild gets id "lc2"', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      // Add two persons with same relationship
      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));

      const relationshipSelects = screen.getAllByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelects[0], 'LegitimateChild');
      await user.selectOptions(relationshipSelects[1], 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.family_tree[0].id).toBe('lc1');
      expect(data.family_tree[1].id).toBe('lc2');
    });

    it('SurvivingSpouse gets id "sp"', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      await user.click(screen.getByRole('button', { name: /add person/i }));
      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'SurvivingSpouse');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      // SurvivingSpouse with index 1 → "sp1" (or "sp" since there can only be 1)
      expect(data.family_tree[0].id).toMatch(/^sp/);
    });

    it('different relationship types get different prefixes', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      // Add 3 persons with different relationships
      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));

      const selects = screen.getAllByLabelText(/relationship to decedent/i);
      await user.selectOptions(selects[0], 'LegitimateChild');
      await user.selectOptions(selects[1], 'IllegitimateChild');
      await user.selectOptions(selects[2], 'Sibling');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(data.family_tree[0].id).toBe('lc1');
      expect(data.family_tree[1].id).toBe('ic1');
      expect(data.family_tree[2].id).toBe('sib1');
    });
  });

  describe('max 1 SurvivingSpouse validation', () => {
    it('shows error when two SurvivingSpouse persons exist', async () => {
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper />);

      // Add two persons both as SurvivingSpouse
      await user.click(screen.getByRole('button', { name: /add person/i }));
      await user.click(screen.getByRole('button', { name: /add person/i }));

      const selects = screen.getAllByLabelText(/relationship to decedent/i);
      await user.selectOptions(selects[0], 'SurvivingSpouse');
      await user.selectOptions(selects[1], 'SurvivingSpouse');

      await waitFor(() => {
        expect(screen.getByText(/only one surviving spouse allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('serialization', () => {
    it('family_tree serializes as an array of Person objects', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      await user.click(screen.getByRole('button', { name: /add person/i }));

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, 'John Doe');

      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const data = onValues.mock.calls[0][0];
      expect(Array.isArray(data.family_tree)).toBe(true);
      expect(data.family_tree).toHaveLength(1);
      expect(data.family_tree[0]).toHaveProperty('id');
      expect(data.family_tree[0]).toHaveProperty('name', 'John Doe');
      expect(data.family_tree[0]).toHaveProperty('relationship_to_decedent', 'LegitimateChild');
    });

    it('empty family tree serializes as empty array', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(<FamilyTreeStepWrapper onValues={onValues} />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      expect(onValues.mock.calls[0][0].family_tree).toEqual([]);
    });
  });

  describe('pre-populated family tree', () => {
    it('renders existing persons from default values', () => {
      const existingPersons: Person[] = [
        {
          id: 'lc1',
          name: 'Alice',
          relationship_to_decedent: 'LegitimateChild',
          is_alive_at_succession: true,
          degree: 1,
          line: null,
          children: [],
          filiation_proved: true,
          filiation_proof_type: null,
          adoption: null,
          is_unworthy: false,
          unworthiness_condoned: false,
          has_renounced: false,
          blood_type: null,
          is_guilty_party_in_legal_separation: false,
        },
        {
          id: 'lc2',
          name: 'Bob',
          relationship_to_decedent: 'LegitimateChild',
          is_alive_at_succession: true,
          degree: 1,
          line: null,
          children: [],
          filiation_proved: true,
          filiation_proof_type: null,
          adoption: null,
          is_unworthy: false,
          unworthiness_condoned: false,
          has_renounced: false,
          blood_type: null,
          is_guilty_party_in_legal_separation: false,
        },
      ];

      render(
        <FamilyTreeStepWrapper defaultValues={{ family_tree: existingPersons }} />
      );

      expect(screen.getAllByTestId('person-card')).toHaveLength(2);
    });
  });
});

// --------------------------------------------------------------------------
// Tests — Constants from spec
// --------------------------------------------------------------------------
describe('wizard-step3 > FamilyTreeStep constants', () => {
  describe('PERSON_ID_PREFIXES', () => {
    it('has a prefix for every relationship type', () => {
      const allRelationships: Relationship[] = [
        'LegitimateChild', 'LegitimatedChild', 'AdoptedChild',
        'IllegitimateChild', 'SurvivingSpouse', 'LegitimateParent',
        'LegitimateAscendant', 'Sibling', 'NephewNiece',
        'OtherCollateral', 'Stranger',
      ];
      for (const rel of allRelationships) {
        expect(PERSON_ID_PREFIXES[rel]).toBeDefined();
        expect(typeof PERSON_ID_PREFIXES[rel]).toBe('string');
        expect(PERSON_ID_PREFIXES[rel].length).toBeGreaterThan(0);
      }
    });

    it('maps LegitimateChild to "lc"', () => {
      expect(PERSON_ID_PREFIXES.LegitimateChild).toBe('lc');
    });

    it('maps AdoptedChild to "ac"', () => {
      expect(PERSON_ID_PREFIXES.AdoptedChild).toBe('ac');
    });

    it('maps SurvivingSpouse to "sp"', () => {
      expect(PERSON_ID_PREFIXES.SurvivingSpouse).toBe('sp');
    });

    it('maps Sibling to "sib"', () => {
      expect(PERSON_ID_PREFIXES.Sibling).toBe('sib');
    });
  });

  describe('DEFAULT_DEGREE', () => {
    it('LegitimateChild defaults to degree 1', () => {
      expect(DEFAULT_DEGREE.LegitimateChild).toBe(1);
    });

    it('LegitimateAscendant defaults to degree 2', () => {
      expect(DEFAULT_DEGREE.LegitimateAscendant).toBe(2);
    });

    it('NephewNiece defaults to degree 3', () => {
      expect(DEFAULT_DEGREE.NephewNiece).toBe(3);
    });

    it('OtherCollateral defaults to degree 4', () => {
      expect(DEFAULT_DEGREE.OtherCollateral).toBe(4);
    });

    it('Stranger defaults to degree 0', () => {
      expect(DEFAULT_DEGREE.Stranger).toBe(0);
    });
  });

  describe('DEGREE_RANGE', () => {
    it('LegitimateChild has range [1, 5]', () => {
      expect(DEGREE_RANGE.LegitimateChild).toEqual([1, 5]);
    });

    it('AdoptedChild has null range (fixed)', () => {
      expect(DEGREE_RANGE.AdoptedChild).toBeNull();
    });

    it('SurvivingSpouse has null range (fixed)', () => {
      expect(DEGREE_RANGE.SurvivingSpouse).toBeNull();
    });

    it('LegitimateAscendant has range [2, 5]', () => {
      expect(DEGREE_RANGE.LegitimateAscendant).toEqual([2, 5]);
    });

    it('OtherCollateral has range [3, 5]', () => {
      expect(DEGREE_RANGE.OtherCollateral).toEqual([3, 5]);
    });
  });

  describe('RELATIONSHIP_OPTIONS', () => {
    it('has exactly 11 options', () => {
      expect(RELATIONSHIP_OPTIONS).toHaveLength(11);
    });

    it('has 3 groups: Compulsory Heirs, Collateral Relatives, Other', () => {
      const groups = new Set(RELATIONSHIP_OPTIONS.map((o) => o.group));
      expect(groups).toEqual(new Set(['Compulsory Heirs', 'Collateral Relatives', 'Other']));
    });

    it('Compulsory Heirs group has 7 options', () => {
      const compulsory = RELATIONSHIP_OPTIONS.filter((o) => o.group === 'Compulsory Heirs');
      expect(compulsory).toHaveLength(7);
    });

    it('Collateral Relatives group has 3 options', () => {
      const collateral = RELATIONSHIP_OPTIONS.filter((o) => o.group === 'Collateral Relatives');
      expect(collateral).toHaveLength(3);
    });
  });

  describe('FILIATION_PROOF_OPTIONS', () => {
    it('has exactly 6 options', () => {
      expect(FILIATION_PROOF_OPTIONS).toHaveLength(6);
    });

    it('first option is BirthCertificate', () => {
      expect(FILIATION_PROOF_OPTIONS[0].value).toBe('BirthCertificate');
    });

    it('all options have Art. references in labels', () => {
      for (const opt of FILIATION_PROOF_OPTIONS) {
        expect(opt.label).toContain('Art.');
      }
    });
  });

  describe('CHILDREN_RELEVANT', () => {
    it('includes LegitimateChild and Sibling', () => {
      expect(CHILDREN_RELEVANT.has('LegitimateChild')).toBe(true);
      expect(CHILDREN_RELEVANT.has('Sibling')).toBe(true);
    });

    it('does not include SurvivingSpouse', () => {
      expect(CHILDREN_RELEVANT.has('SurvivingSpouse')).toBe(false);
    });

    it('does not include Stranger', () => {
      expect(CHILDREN_RELEVANT.has('Stranger')).toBe(false);
    });
  });
});
