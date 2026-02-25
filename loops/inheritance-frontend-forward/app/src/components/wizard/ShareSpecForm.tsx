import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, ShareSpec } from '../../types';

export interface ShareSpecFormProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  /** Full field path, e.g. "will.institutions.0.share" */
  fieldPath: string;
  errors?: Record<string, { message?: string }>;
}

/** Unit variants of ShareSpec that serialize as bare strings */
export const SHARE_SPEC_UNIT_VARIANTS = [
  'EntireFreePort',
  'EntireEstate',
  'Residuary',
  'EqualWithOthers',
  'Unspecified',
] as const;

/**
 * Serialize a ShareSpec variant + optional fraction value into the wire format.
 * Unit variants → bare string; Fraction → { Fraction: "n/d" }
 */
export function serializeShareSpec(variant: string, fractionValue?: string): ShareSpec {
  if (variant === 'Fraction' && fractionValue) {
    return { Fraction: fractionValue };
  }
  return variant as ShareSpec;
}

/**
 * Deserialize wire-format ShareSpec into { variant, fractionValue } for the form.
 */
export function deserializeShareSpec(spec: ShareSpec): { variant: string; fractionValue?: string } {
  if (typeof spec === 'string') {
    return { variant: spec };
  }
  if ('Fraction' in spec) {
    return { variant: 'Fraction', fractionValue: spec.Fraction };
  }
  return { variant: 'Unspecified' };
}

export function ShareSpecForm(_props: ShareSpecFormProps) {
  return <div data-testid="share-spec-form">ShareSpec Form (stub)</div>;
}
