import React, { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person, DeviseSpec } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';

export interface DevisesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const DEVISE_SPEC_OPTIONS = [
  { value: 'SpecificProperty', label: 'Specific Property' },
  { value: 'FractionalInterest', label: 'Fractional Interest' },
] as const;

function getDeviseVariant(property: DeviseSpec): string {
  if (typeof property === 'object' && 'SpecificProperty' in property)
    return 'SpecificProperty';
  if (typeof property === 'object' && 'FractionalInterest' in property)
    return 'FractionalInterest';
  return 'SpecificProperty';
}

export function DevisesTab({
  control,
  setValue,
  watch,
  errors,
  persons,
}: DevisesTabProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'will.devises' as any,
  });

  const nextIdRef = useRef(fields.length + 1);

  const handleAdd = () => {
    const id = `dev${nextIdRef.current}`;
    nextIdRef.current += 1;
    append({
      id,
      devisee: {
        person_id: null,
        name: '',
        is_collective: false,
        class_designation: null,
      },
      property: { SpecificProperty: '' },
      conditions: [],
      substitutes: [],
      is_preferred: false,
    } as any);
  };

  return (
    <div data-testid="devises-tab" className="space-y-4">
      <p className="text-blue-600 text-sm bg-blue-50 p-2 rounded">
        Devises are recorded but do not affect the peso distribution computation.
      </p>

      {fields.length === 0 && (
        <p className="text-gray-500">No devises added</p>
      )}

      {fields.map((field, index) => (
        <DeviseCard
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
        Add Devise
      </button>
    </div>
  );
}

function DeviseCard({
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
  const basePath = `will.devises.${index}`;
  const property = watch(`${basePath}.property` as any) as DeviseSpec;
  const isPreferred = watch(`${basePath}.is_preferred` as any);
  const variant = property ? getDeviseVariant(property) : 'SpecificProperty';

  const handleVariantChange = (newVariant: string) => {
    switch (newVariant) {
      case 'SpecificProperty':
        setValue(`${basePath}.property` as any, {
          SpecificProperty: '',
        });
        break;
      case 'FractionalInterest':
        setValue(`${basePath}.property` as any, {
          FractionalInterest: ['', '1/2'],
        });
        break;
    }
  };

  return (
    <div className="border p-4 rounded space-y-3">
      <span className="font-medium">Devisee</span>
      <HeirReferenceForm
        control={control}
        setValue={setValue}
        watch={watch}
        fieldPath={`${basePath}.devisee`}
        persons={persons}
        allowStranger
        errors={errors}
      />

      <label>
        <span>Devise Type</span>
        <select
          value={variant}
          onChange={(e) => handleVariantChange(e.target.value)}
        >
          {DEVISE_SPEC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {variant === 'SpecificProperty' && (
        <label>
          <span>Property Identifier</span>
          <input
            type="text"
            value={
              property && 'SpecificProperty' in property
                ? (property as any).SpecificProperty
                : ''
            }
            onChange={(e) =>
              setValue(`${basePath}.property` as any, {
                SpecificProperty: e.target.value,
              })
            }
          />
        </label>
      )}

      {variant === 'FractionalInterest' && (
        <div className="space-y-2">
          <label>
            <span>Property Identifier</span>
            <input
              type="text"
              value={
                property && 'FractionalInterest' in property
                  ? (property as any).FractionalInterest[0]
                  : ''
              }
              onChange={(e) => {
                const current =
                  property && 'FractionalInterest' in property
                    ? (property as any).FractionalInterest
                    : ['', '1/2'];
                setValue(`${basePath}.property` as any, {
                  FractionalInterest: [e.target.value, current[1]],
                });
              }}
            />
          </label>
          <label>
            <span>Fractional Share</span>
            <input
              type="text"
              value={
                property && 'FractionalInterest' in property
                  ? (property as any).FractionalInterest[1]
                  : '1/2'
              }
              onChange={(e) => {
                const current =
                  property && 'FractionalInterest' in property
                    ? (property as any).FractionalInterest
                    : ['', '1/2'];
                setValue(`${basePath}.property` as any, {
                  FractionalInterest: [current[0], e.target.value],
                });
              }}
            />
          </label>
        </div>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!isPreferred}
          onChange={(e) =>
            setValue(`${basePath}.is_preferred` as any, e.target.checked)
          }
        />
        Preferred Devise
      </label>

      <ConditionsSection control={control} basePath={basePath} />
      <SubstitutesSection control={control} basePath={basePath} />

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
          <button type="button" onClick={() => remove(i)} className="text-red-400 text-xs">
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
}: {
  control: Control<EngineInput>;
  basePath: string;
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
          <button type="button" onClick={() => remove(i)} className="text-red-400 text-xs">
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
