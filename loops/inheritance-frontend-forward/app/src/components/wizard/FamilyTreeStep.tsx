import React from 'react';
import { Control, UseFormSetValue, UseFormWatch, useFieldArray } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import type { EngineInput, Person, Relationship } from '../../types';
import { PersonCard } from './PersonCard';
import { Button } from '@/components/ui/button';

// ============================================================================
// Constants from spec: wizard-steps.md §3
// ============================================================================

export const PERSON_ID_PREFIXES: Record<Relationship, string> = {
  LegitimateChild: 'lc',
  LegitimatedChild: 'ltc',
  AdoptedChild: 'ac',
  IllegitimateChild: 'ic',
  SurvivingSpouse: 'sp',
  LegitimateParent: 'lp',
  LegitimateAscendant: 'la',
  Sibling: 'sib',
  NephewNiece: 'nn',
  OtherCollateral: 'oc',
  Stranger: 'str',
};

export const DEFAULT_DEGREE: Record<Relationship, number> = {
  LegitimateChild: 1,
  LegitimatedChild: 1,
  AdoptedChild: 1,
  IllegitimateChild: 1,
  SurvivingSpouse: 1,
  LegitimateParent: 1,
  LegitimateAscendant: 2,
  Sibling: 2,
  NephewNiece: 3,
  OtherCollateral: 4,
  Stranger: 0,
};

export const DEGREE_RANGE: Record<Relationship, [number, number] | null> = {
  LegitimateChild: [1, 5],
  LegitimatedChild: [1, 5],
  AdoptedChild: null,
  IllegitimateChild: [1, 5],
  SurvivingSpouse: null,
  LegitimateParent: null,
  LegitimateAscendant: [2, 5],
  Sibling: null,
  NephewNiece: null,
  OtherCollateral: [3, 5],
  Stranger: null,
};

export const RELATIONSHIP_OPTIONS = [
  { value: 'LegitimateChild' as const, label: 'Legitimate Child', group: 'Compulsory Heirs' },
  { value: 'LegitimatedChild' as const, label: 'Legitimated Child', group: 'Compulsory Heirs' },
  { value: 'AdoptedChild' as const, label: 'Adopted Child', group: 'Compulsory Heirs' },
  { value: 'IllegitimateChild' as const, label: 'Illegitimate Child', group: 'Compulsory Heirs' },
  { value: 'SurvivingSpouse' as const, label: 'Surviving Spouse', group: 'Compulsory Heirs' },
  { value: 'LegitimateParent' as const, label: 'Legitimate Parent', group: 'Compulsory Heirs' },
  { value: 'LegitimateAscendant' as const, label: 'Legitimate Ascendant', group: 'Compulsory Heirs' },
  { value: 'Sibling' as const, label: 'Sibling', group: 'Collateral Relatives' },
  { value: 'NephewNiece' as const, label: 'Nephew / Niece', group: 'Collateral Relatives' },
  { value: 'OtherCollateral' as const, label: 'Other Collateral', group: 'Collateral Relatives' },
  { value: 'Stranger' as const, label: 'Stranger', group: 'Other' },
];

export const FILIATION_PROOF_OPTIONS = [
  { value: 'BirthCertificate' as const, label: 'Birth Certificate (Art. 172 ¶1)' },
  { value: 'FinalJudgment' as const, label: 'Final Judgment (Art. 172 ¶1)' },
  { value: 'PublicDocumentAdmission' as const, label: 'Public Document Admission (Art. 172 ¶2)' },
  { value: 'PrivateHandwrittenAdmission' as const, label: 'Private Handwritten Admission (Art. 172 ¶2)' },
  { value: 'OpenContinuousPossession' as const, label: 'Open & Continuous Possession of Status (Art. 172 ¶3)' },
  { value: 'OtherEvidence' as const, label: 'Other Admissible Evidence (Art. 172 ¶4)' },
];

// Relationships where children field is relevant for representation
export const CHILDREN_RELEVANT: Set<Relationship> = new Set([
  'LegitimateChild',
  'LegitimatedChild',
  'AdoptedChild',
  'IllegitimateChild',
  'Sibling',
  'NephewNiece',
]);

// ============================================================================
// FamilyTreeStep Component
// ============================================================================

export interface FamilyTreeStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors?: Record<string, { message?: string }>;
}

function createDefaultPerson(relationship: Relationship, id: string): Person {
  return {
    id,
    name: '',
    relationship_to_decedent: relationship,
    is_alive_at_succession: true,
    degree: DEFAULT_DEGREE[relationship],
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
  };
}

export function FamilyTreeStep({
  control,
  setValue,
  watch,
  errors,
}: FamilyTreeStepProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'family_tree' as any });
  const familyTree = (watch('family_tree') ?? []) as Person[];
  const hasLegalSeparation = watch('decedent.has_legal_separation') as boolean;

  // Count surviving spouses for validation
  const spouseCount = familyTree.filter(
    (p) => p.relationship_to_decedent === 'SurvivingSpouse'
  ).length;

  const handleAddPerson = () => {
    const defaultRel: Relationship = 'LegitimateChild';
    const prefix = PERSON_ID_PREFIXES[defaultRel];
    let count = 0;
    for (const p of familyTree) {
      if (p.relationship_to_decedent === defaultRel) count++;
    }
    const newId = `${prefix}${count + 1}`;
    append(createDefaultPerson(defaultRel, newId) as any);
  };

  return (
    <div data-testid="family-tree-step" className="space-y-4">
      {fields.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No family members added yet. Click &quot;Add Person&quot; to begin.
        </p>
      )}

      {fields.map((field, index) => (
        <PersonCard
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          watch={watch}
          onRemove={(i) => remove(i)}
          persons={familyTree}
          hasLegalSeparation={hasLegalSeparation ?? false}
          errors={errors}
        />
      ))}

      {spouseCount > 1 && (
        <p className="text-destructive text-sm font-medium">
          Only one Surviving Spouse allowed
        </p>
      )}

      <Button type="button" onClick={handleAddPerson}>
        <UserPlus className="h-4 w-4" />
        Add Person
      </Button>
    </div>
  );
}
