import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput } from '../../types';
import { MoneyInput } from '../shared/MoneyInput';

export interface EstateStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  hasWill: boolean;
  onHasWillChange: (hasWill: boolean) => void;
  errors?: Record<string, { message?: string }>;
}

export function EstateStep({
  control,
  setValue,
  watch,
  hasWill,
  onHasWillChange,
  errors,
}: EstateStepProps) {
  const centavos = watch('net_distributable_estate.centavos');
  const showZeroWarning = centavos != null && Number(centavos) === 0;

  const handleSuccessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isTestate = e.target.value === 'testate';
    onHasWillChange(isTestate);
    if (isTestate) {
      setValue('will', {
        date_executed: '',
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [],
      });
    } else {
      setValue('will', null);
    }
  };

  return (
    <div data-testid="estate-step" className="space-y-6">
      <MoneyInput<EngineInput>
        name="net_distributable_estate.centavos"
        label="Net Distributable Estate"
        control={control}
        error={errors?.net_distributable_estate?.message}
        placeholder="0"
      />

      {showZeroWarning && (
        <p className="text-amber-600 text-sm">Estate must be greater than zero</p>
      )}

      <p className="text-gray-500 text-sm">
        Total estate value after debts, taxes, and administration expenses.
      </p>

      <fieldset className="space-y-2">
        <legend className="font-medium">Succession Type</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="succession-type"
            value="intestate"
            checked={!hasWill}
            onChange={handleSuccessionChange}
          />
          Intestate
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="succession-type"
            value="testate"
            checked={hasWill}
            onChange={handleSuccessionChange}
          />
          Testate
        </label>
      </fieldset>
    </div>
  );
}
