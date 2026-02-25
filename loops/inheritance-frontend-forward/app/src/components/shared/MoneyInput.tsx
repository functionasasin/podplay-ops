import React from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

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
 * MoneyInput — Stub component.
 * Accepts peso amounts from user, stores as centavos internally.
 * Displays "₱" prefix, formats on blur.
 */
export function MoneyInput<T extends FieldValues>(_props: MoneyInputProps<T>) {
  return <div data-testid="money-input">MoneyInput stub</div>;
}
