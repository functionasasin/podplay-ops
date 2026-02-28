import React, { useState } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, ShareSpec } from '../../types';
import { stringToFrac } from '../../types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
    <div data-testid="share-spec-form" className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">Share Type</span>
        <select
          value={variant}
          onChange={(e) => handleVariantChange(e.target.value)}
          className={selectClassName}
        >
          {SHARE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {variant === 'Fraction' && (
        <div data-testid="fraction-input" className="space-y-2">
          <span className="text-sm font-medium leading-none">Fraction</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={numer}
              onChange={(e) => handleFractionChange(e.target.value, denom)}
              min={0}
              className="w-20"
              aria-label="Numerator"
            />
            <span className="text-muted-foreground font-medium">/</span>
            <Input
              type="number"
              value={denom}
              onChange={(e) => handleFractionChange(numer, e.target.value)}
              min={1}
              className="w-20"
              aria-label="Denominator"
            />
          </div>
        </div>
      )}
    </div>
  );
}
