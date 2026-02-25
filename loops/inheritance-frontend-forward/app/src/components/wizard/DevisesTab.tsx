import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface DevisesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const DEVISE_SPEC_OPTIONS = [
  { value: 'SpecificProperty', label: 'Specific Property' },
  { value: 'FractionalInterest', label: 'Fractional Interest' },
] as const;

export function DevisesTab(_props: DevisesTabProps) {
  return <div data-testid="devises-tab">Devises Tab (stub)</div>;
}
