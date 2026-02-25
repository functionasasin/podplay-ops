import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

export interface EnumOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  group?: string;
}

export interface EnumSelectProps<T extends FieldValues, V extends string = string> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: EnumOption<V>[];
  error?: string;
  placeholder?: string;
  filter?: (option: EnumOption<V>) => boolean;
}

/**
 * EnumSelect — Stub component.
 * Generic select for any PascalCase enum.
 */
export function EnumSelect<T extends FieldValues, V extends string = string>(
  _props: EnumSelectProps<T, V>,
) {
  return <div data-testid="enum-select">EnumSelect stub</div>;
}
