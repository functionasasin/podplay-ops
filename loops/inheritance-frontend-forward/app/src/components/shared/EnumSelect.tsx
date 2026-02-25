import React, { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

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
 * EnumSelect — Generic select for any PascalCase enum.
 * Supports grouped options via optgroup when options have `group` property.
 */
export function EnumSelect<T extends FieldValues, V extends string = string>({
  name,
  label,
  control,
  options,
  error,
  placeholder,
  filter,
}: EnumSelectProps<T, V>) {
  const { field } = useController({ name, control });

  const filteredOptions = useMemo(() => {
    if (filter) {
      return options.filter(filter);
    }
    return options;
  }, [options, filter]);

  // Group options by their `group` property
  const hasGroups = filteredOptions.some((opt) => opt.group);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    field.onChange(e.target.value as unknown as T[typeof name]);
  };

  const renderOptions = () => {
    if (!hasGroups) {
      return filteredOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ));
    }

    // Group by `group` field, preserving order
    const groups: { name: string; options: EnumOption<V>[] }[] = [];
    const groupMap = new Map<string, EnumOption<V>[]>();

    for (const opt of filteredOptions) {
      const groupName = opt.group ?? 'Other';
      if (!groupMap.has(groupName)) {
        const arr: EnumOption<V>[] = [];
        groupMap.set(groupName, arr);
        groups.push({ name: groupName, options: arr });
      }
      groupMap.get(groupName)!.push(opt);
    }

    return groups.map((group) => (
      <optgroup key={group.name} label={group.name}>
        {group.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </optgroup>
    ));
  };

  return (
    <div data-testid="enum-select">
      <label>
        <span>{label}</span>
        <select
          value={field.value ?? ''}
          onChange={handleChange}
          onBlur={field.onBlur}
          role="combobox"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {renderOptions()}
        </select>
      </label>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
