import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface AdoptionSubFormProps {
  personIndex: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  persons: Person[];
  dateOfDeath: string;
  errors?: Record<string, { message?: string }>;
}

export function AdoptionSubForm({
  personIndex,
  setValue,
  watch,
  persons,
  dateOfDeath,
}: AdoptionSubFormProps) {
  const personId = watch(`family_tree.${personIndex}.id` as any);
  const decreeDate = watch(`family_tree.${personIndex}.adoption.decree_date` as any);
  const regime = watch(`family_tree.${personIndex}.adoption.regime` as any);
  const isStepparent = watch(`family_tree.${personIndex}.adoption.is_stepparent_adoption` as any);
  const isRescinded = watch(`family_tree.${personIndex}.adoption.is_rescinded` as any);
  const rescissionDate = watch(`family_tree.${personIndex}.adoption.rescission_date` as any);
  const biologicalParent = watch(`family_tree.${personIndex}.adoption.biological_parent_spouse` as any);

  const handleStepparentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue(`family_tree.${personIndex}.adoption.is_stepparent_adoption` as any, checked);
    if (!checked) {
      setValue(`family_tree.${personIndex}.adoption.biological_parent_spouse` as any, null);
    }
  };

  const handleRescindedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue(`family_tree.${personIndex}.adoption.is_rescinded` as any, checked);
    if (!checked) {
      setValue(`family_tree.${personIndex}.adoption.rescission_date` as any, null);
    }
  };

  return (
    <div data-testid="adoption-sub-form" className="space-y-3 ml-4 border-l-2 border-blue-200 pl-4">
      {/* Decree Date */}
      <div>
        <label>
          <span>Adoption Decree Date</span>
          <input
            type="date"
            value={decreeDate ?? ''}
            onChange={(e) =>
              setValue(`family_tree.${personIndex}.adoption.decree_date` as any, e.target.value)
            }
            max={dateOfDeath}
          />
        </label>
      </div>

      {/* Regime / Adoption Law */}
      <div>
        <label>
          <span>Adoption Law</span>
          <select
            value={regime ?? 'Ra8552'}
            onChange={(e) =>
              setValue(`family_tree.${personIndex}.adoption.regime` as any, e.target.value)
            }
          >
            <option value="Ra8552">Ra8552</option>
            <option value="Ra11642">Ra11642</option>
          </select>
        </label>
      </div>

      {/* Stepparent Adoption Toggle */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isStepparent ?? false}
            onChange={handleStepparentChange}
          />
          Stepparent Adoption
        </label>
      </div>

      {/* Biological Parent Spouse (conditional on stepparent) */}
      {isStepparent && (
        <div className="ml-4">
          <label>
            <span>Biological Parent Spouse</span>
            <select
              value={biologicalParent ?? ''}
              onChange={(e) =>
                setValue(
                  `family_tree.${personIndex}.adoption.biological_parent_spouse` as any,
                  e.target.value || null
                )
              }
            >
              <option value="">-- Select --</option>
              {persons
                .filter((p) => p.id !== personId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relationship_to_decedent})
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      {/* Adoption Rescinded Toggle */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRescinded ?? false}
            onChange={handleRescindedChange}
          />
          Adoption Rescinded
        </label>
      </div>

      {/* Rescission Date (conditional on rescinded) */}
      {isRescinded && (
        <div className="ml-4">
          <label>
            <span>Rescission Date</span>
            <input
              type="date"
              value={rescissionDate ?? ''}
              onChange={(e) =>
                setValue(
                  `family_tree.${personIndex}.adoption.rescission_date` as any,
                  e.target.value
                )
              }
            />
          </label>
        </div>
      )}

      {/* Rescission Warning Banner */}
      {isRescinded && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-800 text-sm">
          Rescinded adoption under RA 8552 Sec. 20: Adopted child excluded from inheritance
        </div>
      )}
    </div>
  );
}
