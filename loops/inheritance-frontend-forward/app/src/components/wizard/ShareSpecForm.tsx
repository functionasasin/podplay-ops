import React, { useState } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, ShareSpec } from '../../types';
import { stringToFrac } from '../../types';

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

const SHARE_TYPE_OPTIONS = [
  { value: 'EntireFreePort', label: 'Entire Free Portion' },
  { value: 'EntireEstate', label: 'Entire Estate' },
  { value: 'Residuary', label: 'Residuary (leftover)' },
  { value: 'EqualWithOthers', label: 'Equal Share with Other Heirs' },
  { value: 'Fraction', label: 'Specific Fraction (e.g. 1/3)' },
  { value: 'Unspecified', label: 'Unspecified' },
];

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

export function ShareSpecForm({
  setValue,
  watch,
  fieldPath,
}: ShareSpecFormProps) {
  const shareValue = watch(fieldPath as any);
  const { variant, fractionValue } = deserializeShareSpec(
    shareValue ?? 'EntireFreePort'
  );

  const [numer, setNumer] = useState<string>(() => {
    if (fractionValue) {
      const parsed = stringToFrac(fractionValue);
      return String(parsed.numer);
    }
    return '1';
  });

  const [denom, setDenom] = useState<string>(() => {
    if (fractionValue) {
      const parsed = stringToFrac(fractionValue);
      return String(parsed.denom);
    }
    return '2';
  });

  const handleVariantChange = (newVariant: string) => {
    if (newVariant === 'Fraction') {
      const n = parseInt(numer);
      const d = parseInt(denom);
      if (!isNaN(n) && !isNaN(d) && d > 0) {
        setValue(fieldPath as any, { Fraction: `${n}/${d}` });
      } else {
        setValue(fieldPath as any, { Fraction: '1/2' });
        setNumer('1');
        setDenom('2');
      }
    } else {
      setValue(fieldPath as any, newVariant);
    }
  };

  const handleFractionChange = (n: string, d: string) => {
    setNumer(n);
    setDenom(d);
    const nVal = parseInt(n);
    const dVal = parseInt(d);
    if (!isNaN(nVal) && !isNaN(dVal) && dVal > 0) {
      setValue(fieldPath as any, { Fraction: `${nVal}/${dVal}` });
    }
  };

  return (
    <div data-testid="share-spec-form">
      <label>
        <span>Share Type</span>
        <select
          value={variant}
          onChange={(e) => handleVariantChange(e.target.value)}
        >
          {SHARE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {variant === 'Fraction' && (
        <div data-testid="fraction-input" className="mt-2">
          <label>
            <span>Fraction</span>
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={numer}
              onChange={(e) => handleFractionChange(e.target.value, denom)}
              min={0}
              className="w-16"
              aria-label="Numerator"
            />
            <span>/</span>
            <input
              type="number"
              value={denom}
              onChange={(e) => handleFractionChange(numer, e.target.value)}
              min={1}
              className="w-16"
              aria-label="Denominator"
            />
          </div>
        </div>
      )}
    </div>
  );
}
