import React, { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

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

const STRANGER_VALUE = '__stranger__';

/**
 * PersonPicker — Select dropdown listing persons from the family tree.
 * Shows person name + relationship badge.
 */
export function PersonPicker<T extends FieldValues>({
  name,
  label,
  control,
  persons,
  filter,
  excludeIds,
  allowStranger = false,
  error,
}: PersonPickerProps<T>) {
  const { field } = useController({ name, control });

  const filteredPersons = useMemo(() => {
    let result = persons;
    if (filter) {
      result = result.filter(filter);
    }
    if (excludeIds && excludeIds.length > 0) {
      result = result.filter((p) => !excludeIds.includes(p.id));
    }
    return result;
  }, [persons, filter, excludeIds]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === STRANGER_VALUE) {
      field.onChange(null as unknown as T[typeof name]);
    } else if (val === '') {
      field.onChange(null as unknown as T[typeof name]);
    } else {
      field.onChange(val as unknown as T[typeof name]);
    }
  };

  // Determine select value: map null -> STRANGER_VALUE if allowStranger, else ''
  const selectValue =
    field.value === null && allowStranger
      ? STRANGER_VALUE
      : field.value ?? '';

  return (
    <div data-testid="person-picker">
      <label>
        <span>{label}</span>
        <select
          value={selectValue}
          onChange={handleChange}
          onBlur={field.onBlur}
          role="combobox"
        >
          <option value="">-- Select --</option>
          {filteredPersons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.relationship ? ` (${person.relationship})` : ''}
            </option>
          ))}
          {allowStranger && (
            <option value={STRANGER_VALUE}>
              Other (not in family tree)
            </option>
          )}
        </select>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
