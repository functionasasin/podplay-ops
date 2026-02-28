import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import type { EngineInput, Person } from '../../types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle } from '@/components/ui/alert';

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

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
    <div data-testid="adoption-sub-form" className="space-y-4 ml-4 border-l-2 border-blue-300 pl-4">
      {/* Decree Date */}
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">Adoption Decree Date</span>
        <Input
          type="date"
          value={decreeDate ?? ''}
          onChange={(e) =>
            setValue(`family_tree.${personIndex}.adoption.decree_date` as any, e.target.value)
          }
          max={dateOfDeath}
        />
      </label>

      {/* Regime / Adoption Law */}
      <label className="block space-y-2">
        <span className="text-sm font-medium leading-none">Adoption Law</span>
        <select
          value={regime ?? 'Ra8552'}
          onChange={(e) =>
            setValue(`family_tree.${personIndex}.adoption.regime` as any, e.target.value)
          }
          className={selectClassName}
        >
          <option value="Ra8552">Ra8552</option>
          <option value="Ra11642">Ra11642</option>
        </select>
      </label>

      {/* Stepparent Adoption Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isStepparent ?? false}
          onChange={handleStepparentChange}
          className="h-4 w-4 rounded accent-primary"
        />
        <span className="text-sm">Stepparent Adoption</span>
      </label>

      {/* Biological Parent Spouse (conditional on stepparent) */}
      {isStepparent && (
        <div className="ml-7">
          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Biological Parent Spouse</span>
            <select
              value={biologicalParent ?? ''}
              onChange={(e) =>
                setValue(
                  `family_tree.${personIndex}.adoption.biological_parent_spouse` as any,
                  e.target.value || null
                )
              }
              className={selectClassName}
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
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRescinded ?? false}
          onChange={handleRescindedChange}
          className="h-4 w-4 rounded accent-primary"
        />
        <span className="text-sm">Adoption Rescinded</span>
      </label>

      {/* Rescission Date (conditional on rescinded) */}
      {isRescinded && (
        <div className="ml-7">
          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Rescission Date</span>
            <Input
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
        <Alert className="border-warning/50 bg-warning/5 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Rescinded adoption under RA 8552 Sec. 20: Adopted child excluded from inheritance</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
