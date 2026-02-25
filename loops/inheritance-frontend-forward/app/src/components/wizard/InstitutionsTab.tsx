import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface InstitutionsTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const SHARE_SPEC_OPTIONS = [
  { value: 'EntireFreePort', label: 'Entire Free Portion' },
  { value: 'EntireEstate', label: 'Entire Estate' },
  { value: 'Residuary', label: 'Residuary (leftover)' },
  { value: 'EqualWithOthers', label: 'Equal Share with Other Heirs' },
  { value: 'Fraction', label: 'Specific Fraction (e.g. 1/3)' },
  { value: 'Unspecified', label: 'Unspecified' },
] as const;

export function InstitutionsTab(_props: InstitutionsTabProps) {
  return <div data-testid="institutions-tab">Institutions Tab (stub)</div>;
}
