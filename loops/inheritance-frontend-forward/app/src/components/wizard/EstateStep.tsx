import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput } from '../../types';
import { MoneyInput } from '../shared/MoneyInput';
import { Separator } from '@/components/ui/separator';

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
      <h2 className="sr-only">Estate Information</h2>
      <MoneyInput<EngineInput>
        name="net_distributable_estate.centavos"
        label="Net Distributable Estate"
        control={control}
        error={errors?.net_distributable_estate?.message}
        placeholder="0"
      />

      {showZeroWarning && (
        <p className="text-sm text-warning">Estate must be greater than zero</p>
      )}

      <p className="text-sm text-muted-foreground">
        Total estate value after debts, taxes, and administration expenses.
      </p>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none">Succession Type</legend>
        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="succession-type"
              value="intestate"
              checked={!hasWill}
              onChange={handleSuccessionChange}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Intestate</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="succession-type"
              value="testate"
              checked={hasWill}
              onChange={handleSuccessionChange}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Testate</span>
          </label>
        </div>
        {hasWill && (
          <p className="text-xs text-accent font-medium">
            Will & dispositions will be configured in a later step.
          </p>
        )}
      </fieldset>
    </div>
  );
}
