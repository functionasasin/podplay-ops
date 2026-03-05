import { useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { EngineInput, Person, LegacySpec } from '../../types';
import { HeirReferenceForm } from './HeirReferenceForm';
import { MoneyInput } from '../shared/MoneyInput';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
        <p className="text-muted-foreground text-center py-8">No legacies added</p>
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

      <Button
        type="button"
        onClick={handleAdd}
        variant="outline"
        className="gap-1.5"
      >
        <Plus className="size-4" />
        Add Legacy
      </Button>
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
    <Card>
      <CardContent className="space-y-4">
        <span className="text-sm font-semibold leading-none">Legatee</span>
        <HeirReferenceForm
          control={control}
          setValue={setValue}
          watch={watch}
          fieldPath={`${basePath}.legatee`}
          persons={persons}
          allowStranger
          errors={errors}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Legacy Type</span>
          <select
            value={variant}
            onChange={(e) => handleVariantChange(e.target.value)}
            className={selectClassName}
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
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Asset Identifier</span>
              <Input
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
            <Alert>
              <AlertDescription className="text-amber-700">
                The engine cannot compute a monetary value for specific assets. The
                legacy will be noted but not included in the peso distribution.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {variant === 'GenericClass' && (
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Description</span>
              <Input
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
            <MoneyInput<EngineInput>
              name={`${basePath}.property.GenericClass.1.centavos` as any}
              label="Estimated Value"
              control={control}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id={`legacy-preferred-${basePath}`}
            checked={!!isPreferred}
            onCheckedChange={(checked) =>
              setValue(`${basePath}.is_preferred` as any, checked === true)
            }
          />
          <label htmlFor={`legacy-preferred-${basePath}`} className="text-sm cursor-pointer">Preferred Legacy (Art. 911)</label>
        </div>

        <Separator />

        <ConditionsSection
          control={control}
          basePath={basePath}
        />

        <SubstitutesSection
          control={control}
          basePath={basePath}
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
