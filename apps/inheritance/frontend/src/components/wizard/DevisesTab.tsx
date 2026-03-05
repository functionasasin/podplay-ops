import { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Plus, Trash2, Info } from 'lucide-react';
import type { EngineInput, Person, DeviseSpec } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Devises are recorded but do not affect the peso distribution computation.
        </AlertDescription>
      </Alert>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No devises added</p>
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

      <Button
        type="button"
        onClick={handleAdd}
        variant="outline"
        className="gap-1.5"
      >
        <Plus className="size-4" />
        Add Devise
      </Button>
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
    <Card>
      <CardContent className="space-y-4">
        <span className="text-sm font-semibold leading-none">Devisee</span>
        <HeirReferenceForm
          control={control}
          setValue={setValue}
          watch={watch}
          fieldPath={`${basePath}.devisee`}
          persons={persons}
          allowStranger
          errors={errors}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Devise Type</span>
          <select
            value={variant}
            onChange={(e) => handleVariantChange(e.target.value)}
            className={selectClassName}
          >
            {DEVISE_SPEC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {variant === 'SpecificProperty' && (
          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Property Identifier</span>
            <Input
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
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Property Identifier</span>
              <Input
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
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Fractional Share</span>
              <Input
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

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!isPreferred}
            onChange={(e) =>
              setValue(`${basePath}.is_preferred` as any, e.target.checked)
            }
            className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          Preferred Devise
        </label>

        <Separator />

        <ConditionsSection control={control} basePath={basePath} />
        <SubstitutesSection control={control} basePath={basePath} />

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
          <Button type="button" onClick={() => remove(i)} variant="ghost" size="xs" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
}: {
  control: Control<EngineInput>;
  basePath: string;
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
          <Button type="button" onClick={() => remove(i)} variant="ghost" size="xs" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
