import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person, Relationship } from '../../types';
import { DEFAULT_DEGREE } from './FamilyTreeStep';

export interface PersonCardProps {
  index: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  onRemove: (index: number) => void;
  persons: Person[];
  hasLegalSeparation: boolean;
  errors?: Record<string, { message?: string }>;
}

export function PersonCard(_props: PersonCardProps) {
  // Stub — implementation in next iteration
  return <div data-testid="person-card">Person Card (stub)</div>;
}

// Reset function from spec — resets conditional fields when relationship changes
export function resetPersonForRelationship(relationship: Relationship): Partial<Person> {
  return {
    degree: DEFAULT_DEGREE[relationship],
    line: null,
    filiation_proved: true,
    filiation_proof_type: null,
    adoption: null,
    blood_type: null,
    is_guilty_party_in_legal_separation: false,
  };
}
