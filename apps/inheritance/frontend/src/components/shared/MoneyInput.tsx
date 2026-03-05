import React, { useState, useCallback } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { pesosToCentavos, centavosToPesos } from '../../types';
import { Input } from '@/components/ui/input';

export interface MoneyInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  error?: string;
  readOnly?: boolean;
  placeholder?: string;
  warnOnZero?: boolean;
  min?: number;
}

/**
 * MoneyInput — Accepts peso amounts from user, stores as centavos internally.
 * Displays "₱" prefix, formats on blur.
 */
export function MoneyInput<T extends FieldValues>({
  name,
  label,
  control,
  error,
  readOnly = false,
  placeholder,
  warnOnZero = false,
  min,
}: MoneyInputProps<T>) {
  const {
    field,
  } = useController({ name, control });

  // Display value is what the user sees in the input (in pesos)
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (field.value == null || field.value === '') return '';
    const pesos = centavosToPesos(Number(field.value));
    return formatDisplay(pesos);
  });
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw number for editing (no commas)
    if (field.value != null && field.value !== '') {
      const pesos = centavosToPesos(Number(field.value));
      setDisplayValue(pesos === 0 ? '0' : String(pesos));
    }
  }, [field.value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    field.onBlur();

    const raw = displayValue.replace(/,/g, '').trim();
    if (raw === '') {
      field.onChange(null as unknown as T[typeof name]);
      setDisplayValue('');
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      setDisplayValue('');
      field.onChange(0 as unknown as T[typeof name]);
      return;
    }

    const centavos = pesosToCentavos(parsed);
    field.onChange(centavos as unknown as T[typeof name]);
    setDisplayValue(formatDisplay(parsed));
  }, [displayValue, field]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDisplayValue(val);

      // Also update field value on every keystroke for real-time sync
      const raw = val.replace(/,/g, '').trim();
      if (raw === '') {
        field.onChange(null as unknown as T[typeof name]);
        return;
      }
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const centavos = pesosToCentavos(parsed);
        field.onChange(centavos as unknown as T[typeof name]);
      }
    },
    [field],
  );

  const showZeroWarning =
    warnOnZero && field.value != null && Number(field.value) === 0;

  return (
    <div data-testid="money-input" className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">{label}</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₱</span>
          <Input
            type="text"
            inputMode="decimal"
            role="textbox"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            readOnly={readOnly}
            aria-readonly={readOnly ? 'true' : undefined}
            min={min}
            className="pl-7"
          />
        </div>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {showZeroWarning && (
        <p className="text-sm text-warning">Value is ₱0</p>
      )}
    </div>
  );
}

function formatDisplay(pesos: number): string {
  // Format with 2 decimal places and comma thousands
  const parts = pesos.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
