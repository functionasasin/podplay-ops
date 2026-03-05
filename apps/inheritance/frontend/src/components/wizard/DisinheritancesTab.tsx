import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import type {
  EngineInput,
  Person,
  Relationship,
  DisinheritanceCause,
} from '../../types';
import { CAUSE_BY_RELATIONSHIP } from '../../schemas';
import { PersonPicker } from '../shared/PersonPicker';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
        <p className="text-muted-foreground text-center py-8">No disinheritances added</p>
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

      <Button
        type="button"
        onClick={handleAdd}
        variant="outline"
        className="gap-1.5"
      >
        <Plus className="size-4" />
        Add Disinheritance
      </Button>
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
  useEffect(() => {
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
    <Card>
      <CardContent className="space-y-4">
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

        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Cause of Disinheritance</span>
          <select
            value={causeCode ?? ''}
            onChange={(e) =>
              setValue(`${basePath}.cause_code` as any, e.target.value || null)
            }
            className={selectClassName}
          >
            <option value="">-- Select Cause --</option>
            {validCauses.map((cause) => (
              <option key={cause} value={cause}>
                {cause}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={causeSpecified ?? true}
              onChange={(e) =>
                setValue(
                  `${basePath}.cause_specified_in_will` as any,
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Cause Stated in Will
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={causeProven ?? true}
              onChange={(e) =>
                setValue(`${basePath}.cause_proven` as any, e.target.checked)
              }
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Cause Proven
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={reconciliation ?? false}
              onChange={(e) =>
                setValue(
                  `${basePath}.reconciliation_occurred` as any,
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            Reconciliation Occurred
          </label>
        </div>

        {/* Validity Indicator */}
        {isValid ? (
          <Alert className="border-[hsl(var(--success))] bg-[hsl(var(--success))]/5">
            <CheckCircle2 className="size-4 text-[hsl(var(--success))]" />
            <AlertTitle className="text-[hsl(var(--success))]">
              Valid Disinheritance
            </AlertTitle>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>
              Invalid — Heir Will Be Reinstated
            </AlertTitle>
            <AlertDescription>
              <ul className="mt-1 ml-4 list-disc">
                {invalidReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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
