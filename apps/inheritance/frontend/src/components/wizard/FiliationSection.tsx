import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import type { EngineInput } from '../../types';
import { FILIATION_PROOF_OPTIONS } from './FamilyTreeStep';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

export interface FiliationSectionProps {
  personIndex: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors?: Record<string, { message?: string }>;
}

export function FiliationSection({
  personIndex,
  setValue,
  watch,
}: FiliationSectionProps) {
  const filiationProved = watch(`family_tree.${personIndex}.filiation_proved` as any);
  const filiationProofType = watch(`family_tree.${personIndex}.filiation_proof_type` as any);

  const handleFiliationProvedChange = (checked: boolean) => {
    setValue(`family_tree.${personIndex}.filiation_proved` as any, checked);
    if (!checked) {
      setValue(`family_tree.${personIndex}.filiation_proof_type` as any, null);
    }
  };

  return (
    <div data-testid="filiation-section" className="space-y-4 ml-4 border-l-2 border-purple-300 pl-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`filiation-proved-${personIndex}`}
          checked={filiationProved ?? true}
          onCheckedChange={handleFiliationProvedChange}
        />
        <label htmlFor={`filiation-proved-${personIndex}`} className="text-sm cursor-pointer">Filiation Proved</label>
      </div>

      {filiationProved && (
        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Proof of Filiation</span>
          <select
            value={filiationProofType ?? ''}
            onChange={(e) => {
              const val = e.target.value || null;
              setValue(`family_tree.${personIndex}.filiation_proof_type` as any, val);
            }}
            className={selectClassName}
          >
            <option value="">-- Select --</option>
            {FILIATION_PROOF_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {!filiationProved && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Art. 887 &para;3: IC excluded &mdash; filiation not proved</AlertTitle>
        </Alert>
      )}
    </div>
  );
}
