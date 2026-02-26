import React, { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';
import { ShareSpecForm } from './ShareSpecForm';

export interface InstitutionsTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const SHARE_SPEC_OPTIONS = [
  { value: 'EntireFreePort', label: 'Entire Free Portion' },
  { value: 'EntireEstate', label: 'Entire Estate' },
  { value: 'Residuary', label: 'Residuary (leftover)' },
  { value: 'EqualWithOthers', label: 'Equal Share with Other Heirs' },
  { value: 'Fraction', label: 'Specific Fraction (e.g. 1/3)' },
  { value: 'Unspecified', label: 'Unspecified' },
] as const;

export function InstitutionsTab({
  control,
  setValue,
  watch,
  errors,
  persons,
}: InstitutionsTabProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'will.institutions' as any,
  });

  const nextIdRef = useRef(fields.length + 1);

  const handleAdd = () => {
    const id = `i${nextIdRef.current}`;
    nextIdRef.current += 1;
    append({
      id,
      heir: {
        person_id: null,
        name: '',
        is_collective: false,
        class_designation: null,
      },
      share: 'EntireFreePort',
      conditions: [],
      substitutes: [],
      is_residuary: false,
    } as any);
  };

  return (
    <div data-testid="institutions-tab" className="space-y-4">
      {fields.length === 0 && (
        <p className="text-gray-500">None added yet</p>
      )}

      {fields.map((field, index) => (
        <InstitutionCard
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          watch={watch}
          errors={errors}
          persons={persons}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add Institution
      </button>
    </div>
  );
}

function InstitutionCard({
  index,
  control,
  setValue,
  watch,
  errors,
  persons,
  onRemove,
}: {
  index: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
  onRemove: () => void;
}) {
  const basePath = `will.institutions.${index}`;
  const isResiduary = watch(`${basePath}.is_residuary` as any);

  return (
    <div className="border p-4 rounded space-y-3">
      <HeirReferenceForm
        control={control}
        setValue={setValue}
        watch={watch}
        fieldPath={`${basePath}.heir`}
        persons={persons}
        allowStranger
        errors={errors}
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!isResiduary}
          onChange={(e) =>
            setValue(`${basePath}.is_residuary` as any, e.target.checked)
          }
        />
        Residuary Heir
      </label>

      {!isResiduary && (
        <ShareSpecForm
          control={control}
          setValue={setValue}
          watch={watch}
          fieldPath={`${basePath}.share`}
          errors={errors}
        />
      )}

      <ConditionsSection
        control={control}
        setValue={setValue}
        watch={watch}
        basePath={basePath}
      />

      <SubstitutesSection
        control={control}
        setValue={setValue}
        watch={watch}
        basePath={basePath}
        persons={persons}
      />

      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 text-sm"
      >
        Remove
      </button>
    </div>
  );
}

function ConditionsSection({
  control,
  basePath,
}: {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  basePath: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${basePath}.conditions` as any,
  });

  return (
    <div className="border-t pt-2">
      <span className="font-medium text-sm">Conditions</span>

      {fields.map((field, i) => (
        <div key={field.id} className="ml-4 mt-1 flex gap-2 items-center">
          <span className="text-sm">
            {(field as any).condition_type || 'Suspensive'}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 text-xs"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            condition_type: 'Suspensive',
            description: '',
            status: 'Pending',
          } as any)
        }
        className="text-blue-500 text-sm mt-1"
      >
        Add Condition
      </button>
    </div>
  );
}

function SubstitutesSection({
  control,
  basePath,
  persons,
}: {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  basePath: string;
  persons: Person[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${basePath}.substitutes` as any,
  });

  return (
    <div className="border-t pt-2">
      <span className="font-medium text-sm">Substitutes</span>

      {fields.map((field, i) => (
        <div key={field.id} className="ml-4 mt-1 flex gap-2 items-center">
          <span className="text-sm">
            {(field as any).substitution_type || 'Simple'}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 text-xs"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            substitution_type: 'Simple',
            substitute_heir: {
              person_id: null,
              name: '',
              is_collective: false,
              class_designation: null,
            },
            triggers: ['Predecease', 'Renunciation', 'Incapacity'],
          } as any)
        }
        className="text-blue-500 text-sm mt-1"
      >
        Add Substitute
      </button>
    </div>
  );
}
