import { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
 * Supports grouped options via SelectGroup when options have `group` property.
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

  const hasGroups = filteredOptions.some((opt) => opt.group);

  const handleValueChange = (val: string) => {
    field.onChange(val as unknown as T[typeof name]);
  };

  const renderItems = () => {
    if (!hasGroups) {
      return filteredOptions.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ));
    }

    // Group options by their `group` property, preserving order
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
      <SelectGroup key={group.name}>
        <SelectLabel>{group.name}</SelectLabel>
        {group.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
    ));
  };

  return (
    <div data-testid="enum-select" className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">{label}</span>
        <Select value={field.value || undefined} onValueChange={handleValueChange}>
          <SelectTrigger className="w-full" onBlur={field.onBlur}>
            <SelectValue placeholder={placeholder ?? '-- Select --'} />
          </SelectTrigger>
          <SelectContent>
            {renderItems()}
          </SelectContent>
        </Select>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
