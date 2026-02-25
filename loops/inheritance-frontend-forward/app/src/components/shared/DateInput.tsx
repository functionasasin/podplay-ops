import React from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

export interface DateInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  error?: string;
  maxDate?: string;
  minDate?: string;
  hint?: string;
}

/**
 * DateInput — Date picker with YYYY-MM-DD format. Stores ISO 8601 string.
 */
export function DateInput<T extends FieldValues>({
  name,
  label,
  control,
  error,
  maxDate,
  minDate,
  hint,
}: DateInputProps<T>) {
  const { field } = useController({ name, control });

  return (
    <div data-testid="date-input">
      <label>
        <span>{label}</span>
        <input
          type="date"
          value={field.value ?? ''}
          onChange={(e) => {
            field.onChange(e.target.value as unknown as T[typeof name]);
          }}
          onBlur={field.onBlur}
          max={maxDate}
          min={minDate}
        />
      </label>
      {hint && <p className="text-gray-500 text-sm mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
