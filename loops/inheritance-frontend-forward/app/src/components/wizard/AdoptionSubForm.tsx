import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface AdoptionSubFormProps {
  personIndex: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  persons: Person[];
  dateOfDeath: string;
  errors?: Record<string, { message?: string }>;
}

export function AdoptionSubForm(_props: AdoptionSubFormProps) {
  // Stub — implementation in next iteration
  return <div data-testid="adoption-sub-form">Adoption Sub-Form (stub)</div>;
}
