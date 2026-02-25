import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
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
    <div data-testid="person-card" className="border rounded-lg p-4 space-y-4">
      {/* Info Badges */}
      {showUnworthyBadge && (
        <div className="bg-red-50 text-red-700 text-sm px-2 py-1 rounded">
          Art. 1032: Excluded unless condoned
        </div>
      )}
      {showGuiltySpouseBadge && (
        <div className="bg-red-50 text-red-700 text-sm px-2 py-1 rounded">
          Art. 1002: Excluded &mdash; Guilty party in legal separation
        </div>
      )}

      {/* Always-visible: Full Name */}
      <div>
        <label>
          <span>Full Name</span>
          <input
            type="text"
            value={name ?? ''}
            onChange={(e) => setValue(`family_tree.${index}.name` as any, e.target.value)}
          />
        </label>
      </div>

      {/* Always-visible: Relationship to Decedent */}
      <div>
        <label>
          <span>Relationship to Decedent</span>
          <select
            value={relationship ?? ''}
            onChange={handleRelationshipChange}
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
      </div>

      {/* Always-visible: Alive at Succession */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAlive ?? true}
            onChange={(e) =>
              setValue(`family_tree.${index}.is_alive_at_succession` as any, e.target.checked)
            }
          />
          Alive at Time of Succession
        </label>
      </div>

      {/* Always-visible: Degree */}
      <div>
        <label>
          <span>Degree of Relationship</span>
          <input
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

      {/* Always-visible: Has Renounced */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasRenounced ?? false}
            onChange={(e) =>
              setValue(`family_tree.${index}.has_renounced` as any, e.target.checked)
            }
          />
          Has Renounced Inheritance
        </label>
      </div>

      {/* Always-visible: Declared Unworthy */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isUnworthy ?? false}
            onChange={(e) => {
              setValue(`family_tree.${index}.is_unworthy` as any, e.target.checked);
              if (!e.target.checked) {
                setValue(`family_tree.${index}.unworthiness_condoned` as any, false);
              }
            }}
          />
          Declared Unworthy
        </label>
      </div>

      {/* Conditional: Unworthiness Condoned */}
      {showUnworthinessCondoned && (
        <div className="ml-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={unworthinessCondoned ?? false}
              onChange={(e) =>
                setValue(`family_tree.${index}.unworthiness_condoned` as any, e.target.checked)
              }
            />
            Unworthiness Condoned
          </label>
        </div>
      )}

      {/* Conditional: Line of Descent (LegitimateParent, LegitimateAscendant) */}
      {showLine && (
        <div>
          <label>
            <span>Line of Descent</span>
            <select
              value={line ?? ''}
              onChange={(e) =>
                setValue(`family_tree.${index}.line` as any, e.target.value || null)
              }
            >
              <option value="">-- Select --</option>
              <option value="Paternal">Paternal</option>
              <option value="Maternal">Maternal</option>
            </select>
          </label>
        </div>
      )}

      {/* Conditional: Blood Type (Sibling) */}
      {showBloodType && (
        <div>
          <label>
            <span>Blood Type</span>
            <select
              value={bloodType ?? ''}
              onChange={(e) =>
                setValue(`family_tree.${index}.blood_type` as any, e.target.value || null)
              }
            >
              <option value="">-- Select --</option>
              <option value="Full">Full</option>
              <option value="Half">Half</option>
            </select>
          </label>
        </div>
      )}

      {/* Conditional: Guilty Party (SurvivingSpouse + legal separation) */}
      {showGuiltyParty && (
        <div className="ml-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isGuiltyParty ?? false}
              onChange={(e) =>
                setValue(
                  `family_tree.${index}.is_guilty_party_in_legal_separation` as any,
                  e.target.checked
                )
              }
            />
            Guilty Party in Legal Separation
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
        <div className="ml-4 border-l-2 border-gray-200 pl-4">
          <p className="text-sm font-medium">Children for Representation</p>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-red-600 text-sm hover:text-red-800"
      >
        Remove
      </button>
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
