import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

export const FRACTION_PRESETS = [
  { label: '1/2', numer: 1, denom: 2 },
  { label: '1/3', numer: 1, denom: 3 },
  { label: '1/4', numer: 1, denom: 4 },
  { label: '2/3', numer: 2, denom: 3 },
  { label: '3/4', numer: 3, denom: 4 },
] as const;

export interface FractionInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  error?: string;
  allowImproper?: boolean;
  showPresets?: boolean;
  readOnly?: boolean;
}

/**
 * FractionInput — Stub component.
 * Two number inputs (numerator/denominator) that serialize to "n/d" string.
 */
export function FractionInput<T extends FieldValues>(_props: FractionInputProps<T>) {
  return <div data-testid="fraction-input">FractionInput stub</div>;
}
