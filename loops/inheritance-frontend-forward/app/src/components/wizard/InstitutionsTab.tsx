import React, { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { EngineInput, Person } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';
import { ShareSpecForm } from './ShareSpecForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
        <p className="text-muted-foreground text-sm py-4 text-center">None added yet</p>
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

      <Button
        type="button"
        onClick={handleAdd}
        variant="outline"
        className="gap-1.5"
      >
        <Plus className="size-4" />
        Add Institution
      </Button>
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
    <Card>
      <CardContent className="space-y-4">
        <HeirReferenceForm
          control={control}
          setValue={setValue}
          watch={watch}
          fieldPath={`${basePath}.heir`}
          persons={persons}
          allowStranger
          errors={errors}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!isResiduary}
            onChange={(e) =>
              setValue(`${basePath}.is_residuary` as any, e.target.checked)
            }
            className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
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

        <Separator />

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

        <Separator />

        <Button
          type="button"
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
          Remove
        </Button>
      </CardContent>
    </Card>
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
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">Conditions</span>

      {fields.map((field, i) => (
        <div key={field.id} className="ml-4 flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {(field as any).condition_type || 'Suspensive'}
          </span>
          <Button
            type="button"
            onClick={() => remove(i)}
            variant="ghost"
            size="xs"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={() =>
          append({
            condition_type: 'Suspensive',
            description: '',
            status: 'Pending',
          } as any)
        }
        variant="link"
        size="sm"
        className="px-0"
      >
        Add Condition
      </Button>
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
    <div className="space-y-2">
      <span className="text-sm font-medium leading-none">Substitutes</span>

      {fields.map((field, i) => (
        <div key={field.id} className="ml-4 flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {(field as any).substitution_type || 'Simple'}
          </span>
          <Button
            type="button"
            onClick={() => remove(i)}
            variant="ghost"
            size="xs"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
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
        variant="link"
        size="sm"
        className="px-0"
      >
        Add Substitute
      </Button>
    </div>
  );
}
