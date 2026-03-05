import { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // Map null/undefined field value to STRANGER_VALUE if allowStranger, else undefined (shows placeholder)
  const selectValue =
    field.value === null && allowStranger
      ? STRANGER_VALUE
      : field.value || undefined;

  const handleValueChange = (val: string) => {
    if (val === STRANGER_VALUE) {
      field.onChange(null as unknown as T[typeof name]);
    } else {
      field.onChange(val as unknown as T[typeof name]);
    }
  };

  return (
    <div data-testid="person-picker" className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">{label}</span>
        <Select value={selectValue} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full" onBlur={field.onBlur}>
            <SelectValue placeholder="-- Select --" />
          </SelectTrigger>
          <SelectContent>
            {filteredPersons.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
                {person.relationship ? ` (${person.relationship})` : ''}
              </SelectItem>
            ))}
            {allowStranger && (
              <SelectItem value={STRANGER_VALUE}>
                Other (not in family tree)
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
