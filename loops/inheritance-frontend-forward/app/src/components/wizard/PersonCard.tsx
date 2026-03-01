import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { EngineInput, Person, Relationship } from '../../types';
import {
  RELATIONSHIP_OPTIONS,
  PERSON_ID_PREFIXES,
  DEGREE_RANGE,
  DEFAULT_DEGREE,
  CHILDREN_RELEVANT,
} from './FamilyTreeStep';
import { FiliationSection } from './FiliationSection';
import { AdoptionSubForm } from './AdoptionSubForm';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardAction, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle } from '@/components/ui/alert';

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

const RELATIONSHIP_BADGE_STYLES: Record<Relationship, string> = {
  LegitimateChild: 'bg-blue-600 text-white',
  LegitimatedChild: 'bg-blue-600 text-white',
  AdoptedChild: 'bg-blue-600 text-white',
  IllegitimateChild: 'bg-purple-600 text-white',
  SurvivingSpouse: 'bg-emerald-600 text-white',
  LegitimateParent: 'bg-amber-600 text-white',
  LegitimateAscendant: 'bg-amber-600 text-white',
  Sibling: 'bg-slate-500 text-white',
  NephewNiece: 'bg-slate-500 text-white',
  OtherCollateral: 'bg-slate-500 text-white',
  Stranger: 'bg-neutral-400 text-white',
};

export interface PersonCardProps {
  index: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  onRemove: (index: number) => void;
  persons: Person[];
  hasLegalSeparation: boolean;
  errors?: Record<string, { message?: string }>;
}

export function PersonCard({
  index,
  control,
  setValue,
  watch,
  onRemove,
  persons,
  hasLegalSeparation,
  errors,
}: PersonCardProps) {
  const relationship = watch(`family_tree.${index}.relationship_to_decedent` as any) as Relationship;
  const name = watch(`family_tree.${index}.name` as any) as string;
  const isAlive = watch(`family_tree.${index}.is_alive_at_succession` as any) as boolean;
  const degree = watch(`family_tree.${index}.degree` as any) as number;
  const isUnworthy = watch(`family_tree.${index}.is_unworthy` as any) as boolean;
  const unworthinessCondoned = watch(`family_tree.${index}.unworthiness_condoned` as any) as boolean;
  const hasRenounced = watch(`family_tree.${index}.has_renounced` as any) as boolean;
  const isGuiltyParty = watch(`family_tree.${index}.is_guilty_party_in_legal_separation` as any) as boolean;
  const line = watch(`family_tree.${index}.line` as any) as string | null;
  const bloodType = watch(`family_tree.${index}.blood_type` as any) as string | null;

  // Degree editability
  const degreeRange = DEGREE_RANGE[relationship];
  const isDegreeFixed = degreeRange === null;

  // Conditional visibility
  const showLine = relationship === 'LegitimateParent' || relationship === 'LegitimateAscendant';
  const showFiliation = relationship === 'IllegitimateChild';
  const showAdoption = relationship === 'AdoptedChild';
  const showBloodType = relationship === 'Sibling';
  const showGuiltyParty = relationship === 'SurvivingSpouse' && hasLegalSeparation;
  const showUnworthinessCondoned = isUnworthy === true;
  const showChildren = !isAlive && CHILDREN_RELEVANT.has(relationship);

  // Info badges
  const showUnworthyBadge = isUnworthy && !unworthinessCondoned;
  const showGuiltySpouseBadge =
    relationship === 'SurvivingSpouse' && hasLegalSeparation && isGuiltyParty;

  const relationshipLabel = RELATIONSHIP_OPTIONS.find(
    (o) => o.value === relationship
  )?.label ?? relationship;

  const handleRelationshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRel = e.target.value as Relationship;

    // Update relationship
    setValue(`family_tree.${index}.relationship_to_decedent` as any, newRel);

    // Reset conditional fields
    const resetFields = resetPersonForRelationship(newRel);
    for (const [key, value] of Object.entries(resetFields)) {
      setValue(`family_tree.${index}.${key}` as any, value);
    }

    // Regenerate ID based on new relationship
    const currentTree = watch('family_tree') ?? [];
    let count = 0;
    for (let i = 0; i < index; i++) {
      if ((currentTree[i] as Person)?.relationship_to_decedent === newRel) count++;
    }
    const newId = `${PERSON_ID_PREFIXES[newRel]}${count + 1}`;
    setValue(`family_tree.${index}.id` as any, newId);
  };

  return (
    <Card data-testid="person-card">
      <CardHeader>
        <div className="flex items-center gap-2 min-w-0">
          <Badge className={RELATIONSHIP_BADGE_STYLES[relationship]}>
            {relationshipLabel}
          </Badge>
          {name && (
            <span className="text-sm text-muted-foreground truncate">{name}</span>
          )}
        </div>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Badges */}
        {showUnworthyBadge && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Art. 1032: Excluded unless condoned</AlertTitle>
          </Alert>
        )}
        {showGuiltySpouseBadge && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Art. 1002: Excluded &mdash; Guilty party in legal separation</AlertTitle>
          </Alert>
        )}

        {/* Core Fields */}
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Full Name</span>
            <Input
              type="text"
              value={name ?? ''}
              onChange={(e) => setValue(`family_tree.${index}.name` as any, e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Relationship to Decedent</span>
            <select
              value={relationship ?? ''}
              onChange={handleRelationshipChange}
              className={selectClassName}
            >
              {(() => {
                const groups = new Map<string, typeof RELATIONSHIP_OPTIONS>();
                for (const opt of RELATIONSHIP_OPTIONS) {
                  if (!groups.has(opt.group)) groups.set(opt.group, []);
                  groups.get(opt.group)!.push(opt);
                }
                return Array.from(groups.entries()).map(([group, options]) => (
                  <optgroup key={group} label={group}>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ));
              })()}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Degree of Relationship</span>
            <Input
              type="number"
              min={degreeRange?.[0] ?? 0}
              max={degreeRange?.[1] ?? 5}
              value={degree ?? DEFAULT_DEGREE[relationship]}
              onChange={(e) =>
                setValue(`family_tree.${index}.degree` as any, parseInt(e.target.value, 10) || 0)
              }
              disabled={isDegreeFixed}
            />
          </label>
        </div>

        <Separator />

        {/* Status Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAlive ?? true}
              onChange={(e) =>
                setValue(`family_tree.${index}.is_alive_at_succession` as any, e.target.checked)
              }
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">Alive at Time of Succession</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasRenounced ?? false}
              onChange={(e) =>
                setValue(`family_tree.${index}.has_renounced` as any, e.target.checked)
              }
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">Has Renounced Inheritance</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isUnworthy ?? false}
              onChange={(e) => {
                setValue(`family_tree.${index}.is_unworthy` as any, e.target.checked);
                if (!e.target.checked) {
                  setValue(`family_tree.${index}.unworthiness_condoned` as any, false);
                }
              }}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">Declared Unworthy</span>
          </label>

          {/* Conditional: Unworthiness Condoned */}
          {showUnworthinessCondoned && (
            <div className="ml-7">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unworthinessCondoned ?? false}
                  onChange={(e) =>
                    setValue(`family_tree.${index}.unworthiness_condoned` as any, e.target.checked)
                  }
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm">Unworthiness Condoned</span>
              </label>
            </div>
          )}
        </div>

        {/* Conditional: Line of Descent (LegitimateParent, LegitimateAscendant) */}
        {showLine && (
          <>
            <Separator />
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Line of Descent</span>
              <select
                value={line ?? ''}
                onChange={(e) =>
                  setValue(`family_tree.${index}.line` as any, e.target.value || null)
                }
                className={selectClassName}
              >
                <option value="">-- Select --</option>
                <option value="Paternal">Paternal</option>
                <option value="Maternal">Maternal</option>
              </select>
            </label>
          </>
        )}

        {/* Conditional: Blood Type (Sibling) */}
        {showBloodType && (
          <>
            <Separator />
            <label className="block space-y-2">
              <span className="text-sm font-medium leading-none">Blood Type</span>
              <select
                value={bloodType ?? ''}
                onChange={(e) =>
                  setValue(`family_tree.${index}.blood_type` as any, e.target.value || null)
                }
                className={selectClassName}
              >
                <option value="">-- Select --</option>
                <option value="Full">Full</option>
                <option value="Half">Half</option>
              </select>
            </label>
          </>
        )}

        {/* Conditional: Guilty Party (SurvivingSpouse + legal separation) */}
        {showGuiltyParty && (
          <div className="ml-4 border-l-2 border-border pl-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGuiltyParty ?? false}
                onChange={(e) =>
                  setValue(
                    `family_tree.${index}.is_guilty_party_in_legal_separation` as any,
                    e.target.checked
                  )
                }
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">Guilty Party in Legal Separation</span>
            </label>
          </div>
        )}

        {/* Conditional: Filiation Section (IllegitimateChild) */}
        {showFiliation && (
          <FiliationSection
            personIndex={index}
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
          />
        )}

        {/* Conditional: Adoption Sub-Form (AdoptedChild) */}
        {showAdoption && (
          <AdoptionSubForm
            personIndex={index}
            control={control}
            setValue={setValue}
            watch={watch}
            persons={persons}
            dateOfDeath={(watch('decedent.date_of_death') as string) ?? ''}
            errors={errors}
          />
        )}

        {/* Conditional: Children for Representation (deceased + children-relevant) */}
        {showChildren && (
          <>
            <Separator />
            <ChildrenForRepresentation
              personIndex={index}
              personId={watch(`family_tree.${index}.id` as any) as string}
              selectedChildren={(watch(`family_tree.${index}.children` as any) as string[]) ?? []}
              persons={persons}
              setValue={setValue}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Children for Representation — Multi-select for deceased persons
// ============================================================================

interface ChildrenForRepresentationProps {
  personIndex: number;
  personId: string;
  selectedChildren: string[];
  persons: Person[];
  setValue: UseFormSetValue<EngineInput>;
}

function ChildrenForRepresentation({
  personIndex,
  personId,
  selectedChildren,
  persons,
  setValue,
}: ChildrenForRepresentationProps) {
  // Filter out the person themselves — can't be your own child
  const availablePersons = persons.filter((p) => p.id !== personId);

  const handleToggle = (childId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedChildren, childId]
      : selectedChildren.filter((id) => id !== childId);
    setValue(`family_tree.${personIndex}.children` as any, updated);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none">Children for Representation</p>
      <p className="text-xs text-muted-foreground">
        Select this person&apos;s children from the family tree. They will inherit by representation.
      </p>
      {availablePersons.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No other persons in the family tree. Add children first, then link them here.
        </p>
      ) : (
        <div className="space-y-2 ml-1">
          {availablePersons.map((person) => {
            const relLabel = RELATIONSHIP_OPTIONS.find(
              (o) => o.value === person.relationship_to_decedent
            )?.label;
            return (
              <label key={person.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedChildren.includes(person.id)}
                  onChange={(e) => handleToggle(person.id, e.target.checked)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm">
                  {person.name || person.id}
                  {relLabel && (
                    <span className="text-muted-foreground"> ({relLabel})</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Reset conditional fields when relationship changes */
export function resetPersonForRelationship(relationship: Relationship): Partial<Person> {
  return {
    degree: DEFAULT_DEGREE[relationship],
    line: null,
    filiation_proved: true,
    filiation_proof_type: null,
    adoption: null,
    blood_type: null,
    is_guilty_party_in_legal_separation: false,
  };
}
