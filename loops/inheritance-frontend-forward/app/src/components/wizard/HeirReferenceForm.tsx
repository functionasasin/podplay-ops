import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface HeirReferenceFormProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  /** Full field path, e.g. "will.institutions.0.heir" */
  fieldPath: string;
  persons: Person[];
  /** Whether to allow person_id=null (stranger/non-family member) */
  allowStranger?: boolean;
  /** Whether person_id is required (non-null) */
  requirePersonId?: boolean;
  errors?: Record<string, { message?: string }>;
}

export function HeirReferenceForm(_props: HeirReferenceFormProps) {
  return <div data-testid="heir-reference-form">Heir Reference Form (stub)</div>;
}
