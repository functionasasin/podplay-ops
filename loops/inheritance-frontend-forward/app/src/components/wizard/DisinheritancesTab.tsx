import React from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type {
  EngineInput,
  Person,
  Relationship,
  DisinheritanceCause,
} from '../../types';
import { CAUSE_BY_RELATIONSHIP } from '../../schemas';
import { PersonPicker } from '../shared/PersonPicker';

export interface DisinheritancesTabProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

/** Compulsory heir relationship types that can be disinherited */
export const COMPULSORY_RELATIONSHIPS = [
  'LegitimateChild',
  'LegitimatedChild',
  'AdoptedChild',
  'IllegitimateChild',
  'SurvivingSpouse',
  'LegitimateParent',
  'LegitimateAscendant',
] as const;

function isCompulsory(relationship: string): boolean {
  return (COMPULSORY_RELATIONSHIPS as readonly string[]).includes(relationship);
}

export function DisinheritancesTab({
  control,
  setValue,
  watch,
  errors,
  persons,
}: DisinheritancesTabProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'will.disinheritances' as any,
  });

  const compulsoryPersons = persons.filter((p) =>
    isCompulsory(p.relationship_to_decedent)
  );

  const handleAdd = () => {
    append({
      heir_reference: {
        person_id: null,
        name: '',
        is_collective: false,
        class_designation: null,
      },
      cause_code: null,
      cause_specified_in_will: true,
      cause_proven: true,
      reconciliation_occurred: false,
    } as any);
  };

  return (
    <div data-testid="disinheritances-tab" className="space-y-4">
      {fields.length === 0 && (
        <p className="text-gray-500">No disinheritances added</p>
      )}

      {fields.map((field, index) => (
        <DisinheritanceCard
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          watch={watch}
          errors={errors}
          persons={persons}
          compulsoryPersons={compulsoryPersons}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add Disinheritance
      </button>
    </div>
  );
}

function DisinheritanceCard({
  index,
  control,
  setValue,
  watch,
  persons,
  compulsoryPersons,
  onRemove,
}: {
  index: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
  compulsoryPersons: Person[];
  onRemove: () => void;
}) {
  const basePath = `will.disinheritances.${index}`;
  const personId = watch(`${basePath}.heir_reference.person_id` as any);
  const causeCode = watch(`${basePath}.cause_code` as any) as DisinheritanceCause | null;
  const causeSpecified = watch(
    `${basePath}.cause_specified_in_will` as any
  ) as boolean;
  const causeProven = watch(`${basePath}.cause_proven` as any) as boolean;
  const reconciliation = watch(
    `${basePath}.reconciliation_occurred` as any
  ) as boolean;

  // Find the selected person's relationship for cause filtering
  const selectedPerson = persons.find((p) => p.id === personId);
  const relationship = selectedPerson?.relationship_to_decedent as
    | Relationship
    | undefined;

  // Get valid causes for the selected person's relationship
  const validCauses: readonly DisinheritanceCause[] = relationship
    ? (CAUSE_BY_RELATIONSHIP[relationship] ?? [])
    : [];

  // Auto-populate heir_reference.name when person is selected
  React.useEffect(() => {
    if (personId) {
      const person = persons.find((p) => p.id === personId);
      if (person) {
        setValue(`${basePath}.heir_reference.name` as any, person.name);
      }
    }
  }, [personId, persons, setValue, basePath]);

  // Validity computation
  const isValid = causeSpecified && causeProven && !reconciliation;
  const invalidReasons: string[] = [];
  if (!causeSpecified)
    invalidReasons.push('Art. 916: Cause not specified in will');
  if (!causeProven) invalidReasons.push('Art. 917: Cause not proven');
  if (reconciliation)
    invalidReasons.push('Art. 922: Reconciliation occurred');

  return (
    <div className="border p-4 rounded space-y-3">
      <PersonPicker<EngineInput>
        name={`${basePath}.heir_reference.person_id` as any}
        label="Heir to Disinherit"
        control={control}
        persons={compulsoryPersons.map((p) => ({
          id: p.id,
          name: p.name,
          relationship: p.relationship_to_decedent,
        }))}
      />

      <label>
        <span>Cause of Disinheritance</span>
        <select
          value={causeCode ?? ''}
          onChange={(e) =>
            setValue(`${basePath}.cause_code` as any, e.target.value || null)
          }
        >
          <option value="">-- Select Cause --</option>
          {validCauses.map((cause) => (
            <option key={cause} value={cause}>
              {cause}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={causeSpecified ?? true}
          onChange={(e) =>
            setValue(
              `${basePath}.cause_specified_in_will` as any,
              e.target.checked
            )
          }
        />
        Cause Stated in Will
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={causeProven ?? true}
          onChange={(e) =>
            setValue(`${basePath}.cause_proven` as any, e.target.checked)
          }
        />
        Cause Proven
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={reconciliation ?? false}
          onChange={(e) =>
            setValue(
              `${basePath}.reconciliation_occurred` as any,
              e.target.checked
            )
          }
        />
        Reconciliation Occurred
      </label>

      {/* Validity Indicator */}
      <div
        className={`p-2 rounded text-sm ${
          isValid
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {isValid ? (
          <span>Valid Disinheritance</span>
        ) : (
          <div>
            <span className="font-medium">
              Invalid — Heir Will Be Reinstated
            </span>
            <ul className="mt-1 ml-4 list-disc">
              {invalidReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
