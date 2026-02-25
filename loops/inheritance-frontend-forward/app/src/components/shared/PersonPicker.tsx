import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

export interface PersonOption {
  id: string;
  name: string;
  relationship?: string;
}

export interface PersonPickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  persons: PersonOption[];
  filter?: (person: PersonOption) => boolean;
  excludeIds?: string[];
  allowStranger?: boolean;
  error?: string;
}

/**
 * PersonPicker — Stub component.
 * Select dropdown listing persons from the family tree.
 * Shows person name + relationship badge.
 */
export function PersonPicker<T extends FieldValues>(_props: PersonPickerProps<T>) {
  return <div data-testid="person-picker">PersonPicker stub</div>;
}
