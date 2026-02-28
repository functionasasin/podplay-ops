import React, { useState, useCallback, useEffect } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { stringToFrac } from '../../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
 * FractionInput — Two number inputs (numerator/denominator) that serialize to "n/d" string.
 */
export function FractionInput<T extends FieldValues>({
  name,
  label,
  control,
  error,
  showPresets = true,
  readOnly = false,
}: FractionInputProps<T>) {
  const { field } = useController({ name, control });

  // Parse initial value
  const [numer, setNumer] = useState<string>(() => {
    if (field.value && typeof field.value === 'string' && field.value.includes('/')) {
      const parsed = stringToFrac(field.value);
      return String(parsed.numer);
    }
    return '';
  });

  const [denom, setDenom] = useState<string>(() => {
    if (field.value && typeof field.value === 'string' && field.value.includes('/')) {
      const parsed = stringToFrac(field.value);
      return String(parsed.denom);
    }
    return '';
  });

  const updateFieldValue = useCallback(
    (n: string, d: string) => {
      const nVal = parseInt(n, 10);
      const dVal = parseInt(d, 10);
      if (!isNaN(nVal) && !isNaN(dVal) && dVal > 0) {
        field.onChange(`${nVal}/${dVal}` as unknown as T[typeof name]);
      } else {
        field.onChange(null as unknown as T[typeof name]);
      }
    },
    [field],
  );

  const handleNumerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setNumer(val);
      updateFieldValue(val, denom);
    },
    [denom, updateFieldValue],
  );

  const handleDenomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDenom(val);
      updateFieldValue(numer, val);
    },
    [numer, updateFieldValue],
  );

  const handlePresetClick = useCallback(
    (preset: (typeof FRACTION_PRESETS)[number]) => {
      setNumer(String(preset.numer));
      setDenom(String(preset.denom));
      field.onChange(`${preset.numer}/${preset.denom}` as unknown as T[typeof name]);
    },
    [field],
  );

  return (
    <div data-testid="fraction-input" className="space-y-2">
      <label>
        <span className="text-sm font-medium leading-none">{label}</span>
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={numer}
          onChange={handleNumerChange}
          min={0}
          readOnly={readOnly}
          aria-readonly={readOnly ? 'true' : undefined}
          disabled={readOnly}
          className="w-20"
          aria-label="Numerator"
        />
        <span className="text-muted-foreground font-medium">/</span>
        <Input
          type="number"
          value={denom}
          onChange={handleDenomChange}
          min={1}
          readOnly={readOnly}
          aria-readonly={readOnly ? 'true' : undefined}
          disabled={readOnly}
          className="w-20"
          aria-label="Denominator"
        />
      </div>
      {showPresets && (
        <div className="flex gap-1.5">
          {FRACTION_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
