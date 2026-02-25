import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

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
 * DateInput — Stub component.
 * Date picker with YYYY-MM-DD format. Stores ISO 8601 string.
 */
export function DateInput<T extends FieldValues>(_props: DateInputProps<T>) {
  return <div data-testid="date-input">DateInput stub</div>;
}
