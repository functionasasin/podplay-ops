import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';
import { PersonCard, resetPersonForRelationship } from '../PersonCard';
import { DEFAULT_DEGREE, DEGREE_RANGE } from '../FamilyTreeStep';
import type { EngineInput, Person, Relationship } from '../../../types';

// --------------------------------------------------------------------------
// Helper: default person for testing
// --------------------------------------------------------------------------
function createDefaultPerson(overrides?: Partial<Person>): Person {
  return {
    id: 'lc1',
    name: '',
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
    ...overrides,
  };
}

function createDefaultEngineInput(persons: Person[] = []): EngineInput {
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
    family_tree: persons,
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
  };
}

// --------------------------------------------------------------------------
// Test wrapper: provides React Hook Form context with a person at index 0
// --------------------------------------------------------------------------
function PersonCardWrapper({
  person,
  persons,
  hasLegalSeparation = false,
  onRemove,
  onValues,
}: {
  person?: Partial<Person>;
  persons?: Person[];
  hasLegalSeparation?: boolean;
  onRemove?: (index: number) => void;
  onValues?: (values: EngineInput) => void;
}) {
  const defaultPerson = createDefaultPerson(person);
  const allPersons = persons ?? [defaultPerson];
  const methods = useForm<EngineInput>({
    defaultValues: createDefaultEngineInput(allPersons),
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onValues?.(data))}>
        <PersonCard
          index={0}
          control={methods.control}
          setValue={methods.setValue}
          watch={methods.watch}
          onRemove={onRemove ?? vi.fn()}
          persons={allPersons}
          hasLegalSeparation={hasLegalSeparation}
          errors={methods.formState.errors as Record<string, { message?: string }>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

// --------------------------------------------------------------------------
// Tests — PersonCard
// --------------------------------------------------------------------------
describe('wizard-step3 > PersonCard', () => {
  describe('always-visible fields', () => {
    it('renders name input (Full Name)', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    it('renders relationship dropdown', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/relationship to decedent/i)).toBeInTheDocument();
    });

    it('renders "Alive at Succession" toggle', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/alive at.*succession/i)).toBeInTheDocument();
    });

    it('renders degree input', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/degree/i)).toBeInTheDocument();
    });

    it('renders "Has Renounced" toggle', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/has renounced/i)).toBeInTheDocument();
    });

    it('renders "Declared Unworthy" toggle', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByLabelText(/declared unworthy/i)).toBeInTheDocument();
    });

    it('renders remove button', () => {
      render(<PersonCardWrapper />);
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe('conditional fields — LegitimateParent', () => {
    it('shows "Line of Descent" when relationship is LegitimateParent', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'LegitimateParent', degree: 1 }}
        />
      );
      expect(screen.getByLabelText(/line of descent/i)).toBeInTheDocument();
    });

    it('does NOT show "Line of Descent" when relationship is LegitimateChild', () => {
      render(<PersonCardWrapper person={{ relationship_to_decedent: 'LegitimateChild' }} />);
      expect(screen.queryByLabelText(/line of descent/i)).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — LegitimateAscendant', () => {
    it('shows "Line of Descent" when relationship is LegitimateAscendant', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'LegitimateAscendant', degree: 2 }}
        />
      );
      expect(screen.getByLabelText(/line of descent/i)).toBeInTheDocument();
    });
  });

  describe('conditional fields — IllegitimateChild', () => {
    it('shows filiation section when relationship is IllegitimateChild', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'IllegitimateChild' }}
        />
      );
      expect(screen.getByTestId('filiation-section')).toBeInTheDocument();
    });

    it('does NOT show filiation section for LegitimateChild', () => {
      render(<PersonCardWrapper person={{ relationship_to_decedent: 'LegitimateChild' }} />);
      expect(screen.queryByTestId('filiation-section')).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — AdoptedChild', () => {
    it('shows adoption sub-form when relationship is AdoptedChild', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'AdoptedChild' }}
        />
      );
      expect(screen.getByTestId('adoption-sub-form')).toBeInTheDocument();
    });

    it('does NOT show adoption sub-form for LegitimateChild', () => {
      render(<PersonCardWrapper person={{ relationship_to_decedent: 'LegitimateChild' }} />);
      expect(screen.queryByTestId('adoption-sub-form')).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — Sibling', () => {
    it('shows "Blood Type" when relationship is Sibling', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'Sibling', degree: 2 }}
        />
      );
      expect(screen.getByLabelText(/blood type/i)).toBeInTheDocument();
    });

    it('does NOT show "Blood Type" for LegitimateChild', () => {
      render(<PersonCardWrapper person={{ relationship_to_decedent: 'LegitimateChild' }} />);
      expect(screen.queryByLabelText(/blood type/i)).not.toBeInTheDocument();
    });

    it('offers "Full" and "Half" options for Blood Type', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'Sibling', degree: 2 }}
        />
      );
      const bloodTypeSelect = screen.getByLabelText(/blood type/i);
      expect(bloodTypeSelect).toBeInTheDocument();
      // The select should have Full and Half options
      expect(screen.getByText(/^Full$/)).toBeInTheDocument();
      expect(screen.getByText(/^Half$/)).toBeInTheDocument();
    });
  });

  describe('conditional fields — SurvivingSpouse + legal separation', () => {
    it('shows "Guilty Party" toggle when SS + has_legal_separation', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'SurvivingSpouse' }}
          hasLegalSeparation={true}
        />
      );
      expect(screen.getByLabelText(/guilty party/i)).toBeInTheDocument();
    });

    it('does NOT show "Guilty Party" when SS but no legal separation', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'SurvivingSpouse' }}
          hasLegalSeparation={false}
        />
      );
      expect(screen.queryByLabelText(/guilty party/i)).not.toBeInTheDocument();
    });

    it('does NOT show "Guilty Party" for non-spouse even with legal separation', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'LegitimateChild' }}
          hasLegalSeparation={true}
        />
      );
      expect(screen.queryByLabelText(/guilty party/i)).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — unworthiness condoned', () => {
    it('shows "Unworthiness Condoned" toggle when is_unworthy is true', () => {
      render(
        <PersonCardWrapper
          person={{ is_unworthy: true }}
        />
      );
      expect(screen.getByLabelText(/unworthiness condoned/i)).toBeInTheDocument();
    });

    it('does NOT show "Unworthiness Condoned" when is_unworthy is false', () => {
      render(
        <PersonCardWrapper
          person={{ is_unworthy: false }}
        />
      );
      expect(screen.queryByLabelText(/unworthiness condoned/i)).not.toBeInTheDocument();
    });
  });

  describe('conditional fields — deceased person children', () => {
    it('shows children picker when person is dead and relationship is children-relevant', () => {
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'LegitimateChild',
            is_alive_at_succession: false,
          }}
        />
      );
      expect(screen.getByText(/children.*representation/i)).toBeInTheDocument();
    });

    it('does NOT show children picker when person is alive', () => {
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'LegitimateChild',
            is_alive_at_succession: true,
          }}
        />
      );
      expect(screen.queryByText(/children.*representation/i)).not.toBeInTheDocument();
    });

    it('does NOT show children picker for Stranger even if dead', () => {
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'Stranger',
            is_alive_at_succession: false,
            degree: 0,
          }}
        />
      );
      expect(screen.queryByText(/children.*representation/i)).not.toBeInTheDocument();
    });
  });

  describe('relationship change reset', () => {
    it('switching relationship resets conditional fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'Sibling',
            degree: 2,
            blood_type: 'Full',
          }}
          onValues={onValues}
        />
      );

      // Switch to LegitimateChild
      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.blood_type).toBeNull();
      expect(person.degree).toBe(DEFAULT_DEGREE.LegitimateChild);
    });

    it('switching from AdoptedChild resets adoption to null', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'AdoptedChild',
            adoption: {
              decree_date: '2020-01-01',
              regime: 'Ra8552',
              adopter: 'd',
              adoptee: 'ac1',
              is_stepparent_adoption: false,
              biological_parent_spouse: null,
              is_rescinded: false,
              rescission_date: null,
            },
          }}
          onValues={onValues}
        />
      );

      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.adoption).toBeNull();
    });

    it('switching from IllegitimateChild resets filiation fields', async () => {
      const onValues = vi.fn();
      const user = userEvent.setup();
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'IllegitimateChild',
            filiation_proved: false,
            filiation_proof_type: 'BirthCertificate',
          }}
          onValues={onValues}
        />
      );

      const relationshipSelect = screen.getByLabelText(/relationship to decedent/i);
      await user.selectOptions(relationshipSelect, 'LegitimateChild');

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(onValues).toHaveBeenCalled();
      });
      const person = onValues.mock.calls[0][0].family_tree[0];
      expect(person.filiation_proved).toBe(true);
      expect(person.filiation_proof_type).toBeNull();
    });
  });

  describe('degree behavior per relationship', () => {
    it('degree is non-editable (disabled) for AdoptedChild (fixed at 1)', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'AdoptedChild' }}
        />
      );
      const degreeInput = screen.getByLabelText(/degree/i);
      expect(degreeInput).toBeDisabled();
    });

    it('degree is editable for LegitimateChild (range [1,5])', () => {
      render(<PersonCardWrapper person={{ relationship_to_decedent: 'LegitimateChild' }} />);
      const degreeInput = screen.getByLabelText(/degree/i);
      expect(degreeInput).not.toBeDisabled();
    });

    it('degree is non-editable for SurvivingSpouse (fixed at 1)', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'SurvivingSpouse' }}
        />
      );
      const degreeInput = screen.getByLabelText(/degree/i);
      expect(degreeInput).toBeDisabled();
    });

    it('degree is editable for OtherCollateral (range [3,5])', () => {
      render(
        <PersonCardWrapper
          person={{ relationship_to_decedent: 'OtherCollateral', degree: 4 }}
        />
      );
      const degreeInput = screen.getByLabelText(/degree/i);
      expect(degreeInput).not.toBeDisabled();
    });
  });

  describe('conditional fields per relationship type (all 11)', () => {
    const testCases: {
      relationship: Relationship;
      expectedSections: string[];
      notExpectedSections: string[];
    }[] = [
      {
        relationship: 'LegitimateChild',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'LegitimatedChild',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'AdoptedChild',
        expectedSections: ['adoption-sub-form'],
        notExpectedSections: ['filiation-section', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'IllegitimateChild',
        expectedSections: ['filiation-section'],
        notExpectedSections: ['adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'SurvivingSpouse',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'LegitimateParent',
        expectedSections: [/line of descent/i],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /blood type/i],
      },
      {
        relationship: 'LegitimateAscendant',
        expectedSections: [/line of descent/i],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /blood type/i],
      },
      {
        relationship: 'Sibling',
        expectedSections: [/blood type/i],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i],
      },
      {
        relationship: 'NephewNiece',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'OtherCollateral',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
      {
        relationship: 'Stranger',
        expectedSections: [],
        notExpectedSections: ['filiation-section', 'adoption-sub-form', /line of descent/i, /blood type/i],
      },
    ];

    for (const { relationship, expectedSections, notExpectedSections } of testCases) {
      describe(relationship, () => {
        for (const section of expectedSections) {
          it(`shows ${typeof section === 'string' ? section : section.source}`, () => {
            render(
              <PersonCardWrapper
                person={{
                  relationship_to_decedent: relationship,
                  degree: DEFAULT_DEGREE[relationship],
                }}
              />
            );
            if (typeof section === 'string') {
              expect(screen.getByTestId(section)).toBeInTheDocument();
            } else {
              expect(screen.getByLabelText(section)).toBeInTheDocument();
            }
          });
        }

        for (const section of notExpectedSections) {
          it(`does NOT show ${typeof section === 'string' ? section : section.source}`, () => {
            render(
              <PersonCardWrapper
                person={{
                  relationship_to_decedent: relationship,
                  degree: DEFAULT_DEGREE[relationship],
                }}
              />
            );
            if (typeof section === 'string') {
              expect(screen.queryByTestId(section)).not.toBeInTheDocument();
            } else {
              expect(screen.queryByLabelText(section)).not.toBeInTheDocument();
            }
          });
        }
      });
    }
  });

  describe('info badges', () => {
    it('shows "Art. 1032: Excluded" badge for unworthy person without condoning', () => {
      render(
        <PersonCardWrapper
          person={{ is_unworthy: true, unworthiness_condoned: false }}
        />
      );
      expect(screen.getByText(/Art\. 1032.*Excluded/i)).toBeInTheDocument();
    });

    it('does NOT show exclusion badge for unworthy person with condoning', () => {
      render(
        <PersonCardWrapper
          person={{ is_unworthy: true, unworthiness_condoned: true }}
        />
      );
      expect(screen.queryByText(/Art\. 1032.*Excluded/i)).not.toBeInTheDocument();
    });

    it('shows "Art. 1002: Excluded" badge for guilty spouse in legal separation', () => {
      render(
        <PersonCardWrapper
          person={{
            relationship_to_decedent: 'SurvivingSpouse',
            is_guilty_party_in_legal_separation: true,
          }}
          hasLegalSeparation={true}
        />
      );
      expect(screen.getByText(/Art\. 1002.*Excluded/i)).toBeInTheDocument();
    });
  });

  describe('remove button', () => {
    it('calls onRemove with correct index when clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();
      render(<PersonCardWrapper onRemove={onRemove} />);

      await user.click(screen.getByRole('button', { name: /remove/i }));
      expect(onRemove).toHaveBeenCalledWith(0);
    });
  });
});

// --------------------------------------------------------------------------
// Tests — resetPersonForRelationship utility
// --------------------------------------------------------------------------
describe('wizard-step3 > resetPersonForRelationship', () => {
  it('resets degree to default for LegitimateChild', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.degree).toBe(1);
  });

  it('resets degree to default for LegitimateAscendant', () => {
    const reset = resetPersonForRelationship('LegitimateAscendant');
    expect(reset.degree).toBe(2);
  });

  it('resets line to null', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.line).toBeNull();
  });

  it('resets filiation_proved to true', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.filiation_proved).toBe(true);
  });

  it('resets filiation_proof_type to null', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.filiation_proof_type).toBeNull();
  });

  it('resets adoption to null', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.adoption).toBeNull();
  });

  it('resets blood_type to null', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.blood_type).toBeNull();
  });

  it('resets is_guilty_party_in_legal_separation to false', () => {
    const reset = resetPersonForRelationship('LegitimateChild');
    expect(reset.is_guilty_party_in_legal_separation).toBe(false);
  });
});
