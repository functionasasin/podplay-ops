import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { DisinheritancesTab, COMPULSORY_RELATIONSHIPS } from '../DisinheritancesTab';
import { CAUSE_BY_RELATIONSHIP, CHILD_CAUSES, PARENT_CAUSES, SPOUSE_CAUSES } from '../../../schemas';
import type { EngineInput, Person, Will, Disinheritance, Relationship } from '../../../types';

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

function createParent(overrides: Partial<Person> = {}): Person {
  return createDefaultPerson({
    id: 'lp1',
    name: 'Pedro Cruz Sr.',
    relationship_to_decedent: 'LegitimateParent',
    line: 'Paternal',
    ...overrides,
  });
}

function createDefaultDisinheritance(overrides: Partial<Disinheritance> = {}): Disinheritance {
  return {
    heir_reference: {
      person_id: 'lc1',
      name: 'Juan Cruz',
      is_collective: false,
      class_designation: null,
    },
    cause_code: 'ChildAttemptOnLife',
    cause_specified_in_will: true,
    cause_proven: true,
    reconciliation_occurred: false,
    ...overrides,
  };
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
    family_tree: [
      createDefaultPerson(),
      createSpouse(),
      createParent(),
    ],
    will: createDefaultWill(),
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function DisinheritancesTabWrapper({
  defaultValues,
  persons,
  onValues,
}: {
  defaultValues?: Partial<EngineInput>;
  persons?: Person[];
  onValues?: (values: EngineInput) => void;
}) {
  const engineInput = createDefaultEngineInput(defaultValues);
  const methods = useForm<EngineInput>({
    defaultValues: engineInput,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <DisinheritancesTab
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          errors={methods.formState.errors as Record<string, { message?: string }>}
          persons={persons ?? engineInput.family_tree}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — DisinheritancesTab (wizard-step4)
// --------------------------------------------------------------------------
describe('wizard-step4 > DisinheritancesTab', () => {
  describe('rendering', () => {
    it('renders the disinheritances tab container', () => {
      render(<DisinheritancesTabWrapper />);
      expect(screen.getByTestId('disinheritances-tab')).toBeInTheDocument();
    });

    it('renders an "Add Disinheritance" button', () => {
      render(<DisinheritancesTabWrapper />);
      expect(screen.getByText(/Add Disinheritance/i)).toBeInTheDocument();
    });

    it('renders empty state when no disinheritances', () => {
      render(<DisinheritancesTabWrapper />);
      expect(screen.getByText(/No disinheritances added/i)).toBeInTheDocument();
    });
  });

  describe('add/remove disinheritances', () => {
    it('clicking "Add Disinheritance" adds a disinheritance card', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Heir to Disinherit/i)).toBeInTheDocument();
    });

    it('removing a disinheritance reduces the count', async () => {
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance(),
                createDefaultDisinheritance({
                  heir_reference: { person_id: 'sp', name: 'Maria Cruz', is_collective: false, class_designation: null },
                  cause_code: 'SpouseAttemptOnLife',
                }),
              ],
            }),
          }}
        />
      );
      const removeButtons = screen.getAllByText(/Remove/i);
      expect(removeButtons.length).toBe(2);
      await user.click(removeButtons[0]);
      await waitFor(() => {
        expect(screen.getAllByText(/Remove/i).length).toBe(1);
      });
    });
  });

  describe('disinheritance card fields', () => {
    it('renders PersonPicker for heir to disinherit (compulsory heirs only)', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Heir to Disinherit/i)).toBeInTheDocument();
    });

    it('renders cause code select', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Cause of Disinheritance/i)).toBeInTheDocument();
    });

    it('renders cause_specified_in_will toggle', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Cause Stated in Will/i)).toBeInTheDocument();
    });

    it('renders cause_proven toggle', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Cause Proven/i)).toBeInTheDocument();
    });

    it('renders reconciliation_occurred toggle', async () => {
      const user = userEvent.setup();
      render(<DisinheritancesTabWrapper />);
      await user.click(screen.getByText(/Add Disinheritance/i));
      expect(screen.getByText(/Reconciliation Occurred/i)).toBeInTheDocument();
    });
  });

  describe('cause code filtering by relationship', () => {
    it('shows Child causes (Art. 919) for LegitimateChild heir', async () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [createDefaultDisinheritance()],
            }),
          }}
        />
      );
      // Should show child causes for lc1 (LegitimateChild)
      expect(screen.getByText(/ChildAttemptOnLife/i)).toBeInTheDocument();
    });

    it('shows Spouse causes (Art. 921) for SurvivingSpouse heir', async () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  heir_reference: { person_id: 'sp', name: 'Maria Cruz', is_collective: false, class_designation: null },
                  cause_code: 'SpouseAttemptOnLife',
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/SpouseAttemptOnLife/i)).toBeInTheDocument();
    });

    it('shows Parent causes (Art. 920) for LegitimateParent heir', async () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  heir_reference: { person_id: 'lp1', name: 'Pedro Cruz Sr.', is_collective: false, class_designation: null },
                  cause_code: 'ParentAbandonmentCorruption',
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/ParentAbandonmentCorruption/i)).toBeInTheDocument();
    });
  });

  describe('validity indicator', () => {
    it('shows "Valid Disinheritance" when all conditions met', () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  cause_specified_in_will: true,
                  cause_proven: true,
                  reconciliation_occurred: false,
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Valid Disinheritance/i)).toBeInTheDocument();
    });

    it('shows "Invalid" when cause not specified in will', () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  cause_specified_in_will: false,
                  cause_proven: true,
                  reconciliation_occurred: false,
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 916/i)).toBeInTheDocument();
    });

    it('shows "Invalid" when cause not proven', () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  cause_specified_in_will: true,
                  cause_proven: false,
                  reconciliation_occurred: false,
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 917/i)).toBeInTheDocument();
    });

    it('shows "Invalid" when reconciliation occurred', () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  cause_specified_in_will: true,
                  cause_proven: true,
                  reconciliation_occurred: true,
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 922/i)).toBeInTheDocument();
    });

    it('shows multiple invalidity reasons when multiple conditions fail', () => {
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [
                createDefaultDisinheritance({
                  cause_specified_in_will: false,
                  cause_proven: false,
                  reconciliation_occurred: true,
                }),
              ],
            }),
          }}
        />
      );
      expect(screen.getByText(/Art\. 916/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 917/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 922/i)).toBeInTheDocument();
    });

    it('toggling cause_specified to false changes indicator to Invalid', async () => {
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [createDefaultDisinheritance()],
            }),
          }}
        />
      );
      expect(screen.getByText(/Valid Disinheritance/i)).toBeInTheDocument();
      // Toggle cause specified off
      await user.click(screen.getByText(/Cause Stated in Will/i));
      await waitFor(() => {
        expect(screen.getByText(/Invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('compulsory heir filtering', () => {
    it('only shows compulsory heirs in PersonPicker (excludes Sibling, NephewNiece, OtherCollateral, Stranger)', async () => {
      const allPersons = [
        createDefaultPerson({ id: 'lc1', name: 'Child', relationship_to_decedent: 'LegitimateChild' }),
        createDefaultPerson({ id: 'sib1', name: 'Sibling', relationship_to_decedent: 'Sibling' }),
        createDefaultPerson({ id: 'str1', name: 'Friend', relationship_to_decedent: 'Stranger' }),
        createSpouse(),
      ];
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper persons={allPersons} />
      );
      await user.click(screen.getByText(/Add Disinheritance/i));
      // Child and Spouse should be pickable, Sibling and Stranger should not
      expect(screen.getByText(/Child/)).toBeInTheDocument();
      expect(screen.getByText(/Maria Cruz/)).toBeInTheDocument();
      // Sibling and Stranger should be filtered out from picker
      expect(screen.queryByText(/^Sibling$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Friend$/)).not.toBeInTheDocument();
    });
  });

  describe('constants', () => {
    it('COMPULSORY_RELATIONSHIPS has 7 compulsory relationship types', () => {
      expect(COMPULSORY_RELATIONSHIPS).toHaveLength(7);
    });

    it('COMPULSORY_RELATIONSHIPS includes LC, LtC, AC, IC, SS, LP, LA', () => {
      expect(COMPULSORY_RELATIONSHIPS).toContain('LegitimateChild');
      expect(COMPULSORY_RELATIONSHIPS).toContain('LegitimatedChild');
      expect(COMPULSORY_RELATIONSHIPS).toContain('AdoptedChild');
      expect(COMPULSORY_RELATIONSHIPS).toContain('IllegitimateChild');
      expect(COMPULSORY_RELATIONSHIPS).toContain('SurvivingSpouse');
      expect(COMPULSORY_RELATIONSHIPS).toContain('LegitimateParent');
      expect(COMPULSORY_RELATIONSHIPS).toContain('LegitimateAscendant');
    });

    it('COMPULSORY_RELATIONSHIPS does NOT include Sibling, NephewNiece, OtherCollateral, Stranger', () => {
      expect(COMPULSORY_RELATIONSHIPS).not.toContain('Sibling');
      expect(COMPULSORY_RELATIONSHIPS).not.toContain('NephewNiece');
      expect(COMPULSORY_RELATIONSHIPS).not.toContain('OtherCollateral');
      expect(COMPULSORY_RELATIONSHIPS).not.toContain('Stranger');
    });
  });

  describe('serialization', () => {
    it('disinheritance serializes with all required fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [createDefaultDisinheritance()],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const dis = onValues.mock.calls[0][0].will?.disinheritances?.[0];
      expect(dis).toHaveProperty('heir_reference');
      expect(dis).toHaveProperty('cause_code');
      expect(dis).toHaveProperty('cause_specified_in_will');
      expect(dis).toHaveProperty('cause_proven');
      expect(dis).toHaveProperty('reconciliation_occurred');
    });

    it('heir_reference has person_id pointing to compulsory heir', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [createDefaultDisinheritance()],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const ref = onValues.mock.calls[0][0].will?.disinheritances?.[0]?.heir_reference;
      expect(ref?.person_id).toBe('lc1');
    });

    it('cause_code is a PascalCase DisinheritanceCause string', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <DisinheritancesTabWrapper
          defaultValues={{
            will: createDefaultWill({
              disinheritances: [createDefaultDisinheritance()],
            }),
          }}
          onValues={onValues}
        />
      );

      await user.click(screen.getByText('Submit'));
      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const cause = onValues.mock.calls[0][0].will?.disinheritances?.[0]?.cause_code;
      expect(cause).toBe('ChildAttemptOnLife');
    });
  });
});
