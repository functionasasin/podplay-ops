import { useEffect, useRef } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';
import { PersonPicker } from '../shared/PersonPicker';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface HeirReferenceFormProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  /** Full field path, e.g. "will.institutions.0.heir" */
  fieldPath: string;
  persons: Person[];
  /** Whether to allow person_id=null (stranger/non-family member) */
  allowStranger?: boolean;
  /** Whether person_id is required (non-null) */
  requirePersonId?: boolean;
  errors?: Record<string, { message?: string }>;
}

export function HeirReferenceForm({
  control,
  setValue,
  watch,
  fieldPath,
  persons,
  allowStranger,
}: HeirReferenceFormProps) {
  const personId = watch(`${fieldPath}.person_id` as any);
  const isCollective = watch(`${fieldPath}.is_collective` as any);
  const name = watch(`${fieldPath}.name` as any);

  // Use ref to avoid infinite re-render loop when persons array has unstable reference
  const personsRef = useRef(persons);
  personsRef.current = persons;

  // Auto-populate name when person is selected
  useEffect(() => {
    if (personId) {
      const person = personsRef.current.find((p) => p.id === personId);
      if (person && person.name !== name) {
        setValue(`${fieldPath}.name` as any, person.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, setValue, fieldPath]);

  const nameIsReadonly = !allowStranger && !!personId;

  return (
    <div data-testid="heir-reference-form" className="space-y-3">
      <PersonPicker<EngineInput>
        name={`${fieldPath}.person_id` as any}
        label="Heir"
        control={control}
        persons={persons.map((p) => ({
          id: p.id,
          name: p.name,
          relationship: p.relationship_to_decedent,
        }))}
        allowStranger={allowStranger}
      />

      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">Heir Name</span>
        <Input
          type="text"
          value={name ?? ''}
          onChange={(e) =>
            setValue(`${fieldPath}.name` as any, e.target.value)
          }
          readOnly={nameIsReadonly}
          className={cn(nameIsReadonly && 'bg-muted')}
        />
      </label>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={!!isCollective}
          onChange={(e) => {
            setValue(
              `${fieldPath}.is_collective` as any,
              e.target.checked
            );
            if (!e.target.checked) {
              setValue(`${fieldPath}.class_designation` as any, null);
            }
          }}
          className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
        />
        Collective Gift
      </label>

      {isCollective && (
        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Class Description</span>
          <Input
            type="text"
            value={
              watch(`${fieldPath}.class_designation` as any) ?? ''
            }
            onChange={(e) =>
              setValue(
                `${fieldPath}.class_designation` as any,
                e.target.value || null
              )
            }
          />
        </label>
      )}
    </div>
  );
}
