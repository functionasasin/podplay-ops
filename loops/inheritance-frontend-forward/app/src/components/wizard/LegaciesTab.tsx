import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface LegaciesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const LEGACY_SPEC_OPTIONS = [
  { value: 'FixedAmount', label: 'Fixed Amount' },
  { value: 'SpecificAsset', label: 'Specific Asset' },
  { value: 'GenericClass', label: 'Generic Class of Items' },
] as const;

export function LegaciesTab(_props: LegaciesTabProps) {
  return <div data-testid="legacies-tab">Legacies Tab (stub)</div>;
}
