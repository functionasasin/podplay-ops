import React, { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { cn } from '@/lib/utils';

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

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
    <div data-testid="enum-select" className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">{label}</span>
        <select
          value={field.value ?? ''}
          onChange={handleChange}
          onBlur={field.onBlur}
          role="combobox"
          className={selectClassName}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {renderOptions()}
        </select>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
