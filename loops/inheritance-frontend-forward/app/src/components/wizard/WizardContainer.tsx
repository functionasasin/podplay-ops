import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EngineInput } from '../../types';
import { EngineInputSchema } from '../../schemas';

export interface WizardMeta {
  hasWill: boolean;
}

export const WIZARD_STEPS = [
  { key: 'estate', label: 'Estate Details' },
  { key: 'decedent', label: 'Decedent Details' },
  { key: 'family-tree', label: 'Family Tree' },
  { key: 'will', label: 'Will & Dispositions', conditional: true },
  { key: 'donations', label: 'Donations' },
  { key: 'review', label: 'Review & Config' },
] as const;

export const MARRIAGE_DEFAULTS = {
  date_of_marriage: null as string | null,
  years_of_cohabitation: 0,
  has_legal_separation: false,
  marriage_solemnized_in_articulo_mortis: false,
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

export const ARTICULO_MORTIS_DEFAULTS = {
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

export const ILLNESS_DEFAULTS = {
  illness_caused_death: false,
};

export interface WizardContainerProps {
  onSubmit?: (data: EngineInput) => void;
  defaultValues?: Partial<EngineInput>;
}

export function WizardContainer({ onSubmit, defaultValues }: WizardContainerProps) {
  // Stub — implementation in next iteration
  return <div data-testid="wizard-container">Wizard Container Stub</div>;
}
