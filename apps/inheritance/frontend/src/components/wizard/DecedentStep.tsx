import React, { useEffect } from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import type { EngineInput } from '../../types';
import { DateInput } from '../shared/DateInput';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MARRIAGE_DEFAULTS, ARTICULO_MORTIS_DEFAULTS, ILLNESS_DEFAULTS } from './WizardContainer';

export interface DecedentStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors?: Record<string, { message?: string }>;
}

export function DecedentStep({
  control,
  setValue,
  watch,
  errors,
}: DecedentStepProps) {
  const isMarried = watch('decedent.is_married');
  const articuloMortis = watch('decedent.marriage_solemnized_in_articulo_mortis');
  const wasIll = watch('decedent.was_ill_at_marriage');
  const illnessCausedDeath = watch('decedent.illness_caused_death');
  const yearsOfCohabitation = watch('decedent.years_of_cohabitation');

  // Auto-set decedent ID
  useEffect(() => {
    setValue('decedent.id', 'd');
  }, [setValue]);

  // Reset marriage fields when is_married toggled off
  const handleMarriedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue('decedent.is_married', checked);
    if (!checked) {
      setValue('decedent.date_of_marriage', MARRIAGE_DEFAULTS.date_of_marriage);
      setValue('decedent.years_of_cohabitation', MARRIAGE_DEFAULTS.years_of_cohabitation);
      setValue('decedent.has_legal_separation', MARRIAGE_DEFAULTS.has_legal_separation);
      setValue('decedent.marriage_solemnized_in_articulo_mortis', MARRIAGE_DEFAULTS.marriage_solemnized_in_articulo_mortis);
      setValue('decedent.was_ill_at_marriage', MARRIAGE_DEFAULTS.was_ill_at_marriage);
      setValue('decedent.illness_caused_death', MARRIAGE_DEFAULTS.illness_caused_death);
    }
  };

  // Reset articulo mortis child fields when toggled off
  const handleArticuloMortisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue('decedent.marriage_solemnized_in_articulo_mortis', checked);
    if (!checked) {
      setValue('decedent.was_ill_at_marriage', ARTICULO_MORTIS_DEFAULTS.was_ill_at_marriage);
      setValue('decedent.illness_caused_death', ARTICULO_MORTIS_DEFAULTS.illness_caused_death);
    }
  };

  // Reset illness_caused_death when was_ill toggled off
  const handleWasIllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setValue('decedent.was_ill_at_marriage', checked);
    if (!checked) {
      setValue('decedent.illness_caused_death', ILLNESS_DEFAULTS.illness_caused_death);
    }
  };

  // Articulo mortis warning: all 4 conditions + cohabitation < 5
  const showArticuloMortisWarning =
    isMarried &&
    articuloMortis &&
    wasIll &&
    illnessCausedDeath &&
    (yearsOfCohabitation ?? 0) < 5;

  return (
    <div data-testid="decedent-step" className="space-y-6">
      <h2 className="sr-only">Decedent Information</h2>
      {/* Section 1: Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Identity</h3>
        <label className="block space-y-2">
          <span className="text-sm font-medium leading-none">Full Name</span>
          <Input
            type="text"
            value={watch('decedent.name') ?? ''}
            onChange={(e) => setValue('decedent.name', e.target.value)}
          />
        </label>

        <DateInput<EngineInput>
          name="decedent.date_of_death"
          label="Date of Death"
          control={control}
          error={errors?.decedent?.message}
        />
      </div>

      <Separator />

      {/* Section 2: Legitimacy Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Legitimacy</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={watch('decedent.is_illegitimate') ?? false}
            onChange={(e) => setValue('decedent.is_illegitimate', e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-sm">Decedent is Illegitimate</span>
        </label>
        <p className="text-xs text-muted-foreground ml-7">
          Only affects scenario when no descendants and will exists — Arts. T14/T15 via Art. 903
        </p>
      </div>

      <Separator />

      {/* Section 3: Marital Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Marital Status</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isMarried ?? false}
            onChange={handleMarriedChange}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-sm">Was Married at Time of Death</span>
        </label>
      </div>

      {/* Marriage-conditional fields */}
      {isMarried && (
        <div className="ml-4 space-y-4 border-l-2 border-border pl-4">
          <DateInput<EngineInput>
            name="decedent.date_of_marriage"
            label="Date of Marriage"
            control={control}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium leading-none">Years of Cohabitation</span>
            <Input
              type="number"
              min="0"
              value={watch('decedent.years_of_cohabitation') ?? 0}
              onChange={(e) =>
                setValue('decedent.years_of_cohabitation', parseInt(e.target.value, 10) || 0)
              }
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={watch('decedent.has_legal_separation') ?? false}
              onChange={(e) => setValue('decedent.has_legal_separation', e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">Legal Separation</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={articuloMortis ?? false}
              onChange={handleArticuloMortisChange}
              className="h-4 w-4 rounded accent-primary"
            />
            <span className="text-sm">Articulo Mortis</span>
          </label>

          {/* Articulo Mortis cascade — level 2 */}
          {articuloMortis && (
            <div className="ml-4 space-y-4 border-l-2 border-warning/30 pl-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wasIll ?? false}
                  onChange={handleWasIllChange}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm">Was Ill at Time of Marriage</span>
              </label>

              {/* Level 3: illness_caused_death */}
              {wasIll && (
                <div className="ml-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={illnessCausedDeath ?? false}
                      onChange={(e) =>
                        setValue('decedent.illness_caused_death', e.target.checked)
                      }
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm">Illness Caused Death</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Articulo mortis warning banner */}
          {showArticuloMortisWarning && (
            <Alert className="border-warning/50 bg-warning/5 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Articulo mortis marriage detected.</AlertTitle>
              <AlertDescription>
                Spouse&apos;s legitime E/2 &rarr; E/3 (Art. 900)
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
