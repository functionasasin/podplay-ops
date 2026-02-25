import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface DisinheritancesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

/** Compulsory heir relationship types that can be disinherited */
export const COMPULSORY_RELATIONSHIPS = [
  'LegitimateChild',
  'LegitimatedChild',
  'AdoptedChild',
  'IllegitimateChild',
  'SurvivingSpouse',
  'LegitimateParent',
  'LegitimateAscendant',
] as const;

export function DisinheritancesTab(_props: DisinheritancesTabProps) {
  return <div data-testid="disinheritances-tab">Disinheritances Tab (stub)</div>;
}
