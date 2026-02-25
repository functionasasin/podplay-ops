import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Relationship } from '../../types';

// Constants from spec: wizard-steps.md §3

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

export interface FamilyTreeStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors?: Record<string, { message?: string }>;
}

export function FamilyTreeStep(_props: FamilyTreeStepProps) {
  // Stub — implementation in next iteration
  return <div data-testid="family-tree-step">Family Tree Step (stub)</div>;
}
