import React, { useState, useCallback, useEffect } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { stringToFrac } from '../../types';

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
    <div data-testid="fraction-input">
      <label>
        <span>{label}</span>
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={numer}
          onChange={handleNumerChange}
          min={0}
          readOnly={readOnly}
          aria-readonly={readOnly ? 'true' : undefined}
          disabled={readOnly}
          className="w-16"
          aria-label="Numerator"
        />
        <span>/</span>
        <input
          type="number"
          value={denom}
          onChange={handleDenomChange}
          min={1}
          readOnly={readOnly}
          aria-readonly={readOnly ? 'true' : undefined}
          disabled={readOnly}
          className="w-16"
          aria-label="Denominator"
        />
      </div>
      {showPresets && (
        <div className="flex gap-1 mt-1">
          {FRACTION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="px-2 py-1 text-xs border rounded"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
