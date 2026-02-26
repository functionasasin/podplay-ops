import React, { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person, LegacySpec } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';
import { MoneyInput } from '../shared/MoneyInput';

export interface LegaciesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export const LEGACY_SPEC_OPTIONS = [
  { value: 'FixedAmount', label: 'Fixed Amount' },
  { value: 'SpecificAsset', label: 'Specific Asset' },
  { value: 'GenericClass', label: 'Generic Class of Items' },
] as const;

function getLegacyVariant(property: LegacySpec): string {
  if (typeof property === 'object' && 'FixedAmount' in property)
    return 'FixedAmount';
  if (typeof property === 'object' && 'SpecificAsset' in property)
    return 'SpecificAsset';
  if (typeof property === 'object' && 'GenericClass' in property)
    return 'GenericClass';
  return 'FixedAmount';
}

export function LegaciesTab({
  control,
  setValue,
  watch,
  errors,
  persons,
}: LegaciesTabProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'will.legacies' as any,
  });

  const nextIdRef = useRef(fields.length + 1);

  const handleAdd = () => {
    const id = `l${nextIdRef.current}`;
    nextIdRef.current += 1;
    append({
      id,
      legatee: {
        person_id: null,
        name: '',
        is_collective: false,
        class_designation: null,
      },
      property: { FixedAmount: { centavos: 0 } },
      conditions: [],
      substitutes: [],
      is_preferred: false,
    } as any);
  };

  return (
    <div data-testid="legacies-tab" className="space-y-4">
      {fields.length === 0 && (
        <p className="text-gray-500">No legacies added</p>
      )}

      {fields.map((field, index) => (
        <LegacyCard
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
        Add Legacy
      </button>
    </div>
  );
}

function LegacyCard({
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
  const basePath = `will.legacies.${index}`;
  const property = watch(`${basePath}.property` as any) as LegacySpec;
  const isPreferred = watch(`${basePath}.is_preferred` as any);
  const variant = property ? getLegacyVariant(property) : 'FixedAmount';

  const handleVariantChange = (newVariant: string) => {
    switch (newVariant) {
      case 'FixedAmount':
        setValue(`${basePath}.property` as any, {
          FixedAmount: { centavos: 0 },
        });
        break;
      case 'SpecificAsset':
        setValue(`${basePath}.property` as any, {
          SpecificAsset: '',
        });
        break;
      case 'GenericClass':
        setValue(`${basePath}.property` as any, {
          GenericClass: ['', { centavos: 0 }],
        });
        break;
    }
  };

  return (
    <div className="border p-4 rounded space-y-3">
      <span className="font-medium">Legatee</span>
      <HeirReferenceForm
        control={control}
        setValue={setValue}
        watch={watch}
        fieldPath={`${basePath}.legatee`}
        persons={persons}
        allowStranger
        errors={errors}
      />

      <label>
        <span>Legacy Type</span>
        <select
          value={variant}
          onChange={(e) => handleVariantChange(e.target.value)}
        >
          {LEGACY_SPEC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {variant === 'FixedAmount' && (
        <MoneyInput<EngineInput>
          name={`${basePath}.property.FixedAmount.centavos` as any}
          label="Amount"
          control={control}
        />
      )}

      {variant === 'SpecificAsset' && (
        <div>
          <label>
            <span>Asset Identifier</span>
            <input
              type="text"
              value={
                property && 'SpecificAsset' in property
                  ? (property as any).SpecificAsset
                  : ''
              }
              onChange={(e) =>
                setValue(`${basePath}.property` as any, {
                  SpecificAsset: e.target.value,
                })
              }
            />
          </label>
          <p className="text-amber-600 text-sm mt-1">
            The engine cannot compute a monetary value for specific assets. The
            legacy will be noted but not included in the peso distribution.
          </p>
        </div>
      )}

      {variant === 'GenericClass' && (
        <div className="space-y-2">
          <label>
            <span>Description</span>
            <input
              type="text"
              value={
                property && 'GenericClass' in property
                  ? (property as any).GenericClass[0]
                  : ''
              }
              onChange={(e) => {
                const current =
                  property && 'GenericClass' in property
                    ? (property as any).GenericClass
                    : ['', { centavos: 0 }];
                setValue(`${basePath}.property` as any, {
                  GenericClass: [e.target.value, current[1]],
                });
              }}
            />
          </label>
          <label>
            <span>Estimated Value</span>
            <MoneyInput<EngineInput>
              name={`${basePath}.property.GenericClass.1.centavos` as any}
              label="Estimated Value"
              control={control}
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
        Preferred Legacy (Art. 911)
      </label>

      <ConditionsSection
        control={control}
        basePath={basePath}
      />

      <SubstitutesSection
        control={control}
        basePath={basePath}
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
