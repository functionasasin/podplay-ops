import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput } from '../../types';
import { FILIATION_PROOF_OPTIONS } from './FamilyTreeStep';

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

  const handleFiliationProvedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue(`family_tree.${personIndex}.filiation_proved` as any, checked);
    if (!checked) {
      setValue(`family_tree.${personIndex}.filiation_proof_type` as any, null);
    }
  };

  return (
    <div data-testid="filiation-section" className="space-y-3 ml-4 border-l-2 border-purple-200 pl-4">
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filiationProved ?? true}
            onChange={handleFiliationProvedChange}
          />
          Filiation Proved
        </label>
      </div>

      {filiationProved && (
        <div>
          <label>
            <span>Proof of Filiation</span>
            <select
              value={filiationProofType ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setValue(`family_tree.${personIndex}.filiation_proof_type` as any, val);
              }}
            >
              <option value="">-- Select --</option>
              {FILIATION_PROOF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!filiationProved && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-sm">
          Art. 887 &para;3: IC excluded &mdash; filiation not proved
        </div>
      )}
    </div>
  );
}
