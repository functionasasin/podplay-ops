import React, { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { EngineInput } from '../../types';
import { EstateStep } from './EstateStep';
import { DecedentStep } from './DecedentStep';

export interface WizardMeta {
  hasWill: boolean;
}

export const WIZARD_STEPS = [
  { key: 'estate', label: 'Estate Details' },
  { key: 'decedent', label: 'Decedent Details' },
  { key: 'family-tree', label: 'Family Tree' },
  { key: 'will', label: 'Will & Dispositions', conditional: true },
  { key: 'donations', label: 'Donations' },
  { key: 'review', label: 'Review & Config' },
] as const;

export const MARRIAGE_DEFAULTS = {
  date_of_marriage: null as string | null,
  years_of_cohabitation: 0,
  has_legal_separation: false,
  marriage_solemnized_in_articulo_mortis: false,
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

export const ARTICULO_MORTIS_DEFAULTS = {
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

export const ILLNESS_DEFAULTS = {
  illness_caused_death: false,
};

const DEFAULT_ENGINE_INPUT: EngineInput = {
  net_distributable_estate: { centavos: 0 },
  decedent: {
    id: 'd',
    name: '',
    date_of_death: '',
    is_married: false,
    date_of_marriage: null,
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 0,
    has_legal_separation: false,
    is_illegitimate: false,
  },
  family_tree: [],
  will: null,
  donations: [],
  config: {
    max_pipeline_restarts: 10,
    retroactive_ra_11642: false,
  },
};

export interface WizardContainerProps {
  onSubmit?: (data: EngineInput) => void;
  defaultValues?: Partial<EngineInput>;
}

export function WizardContainer({ onSubmit, defaultValues }: WizardContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasWill, setHasWill] = useState(false);

  const methods = useForm<EngineInput>({
    defaultValues: { ...DEFAULT_ENGINE_INPUT, ...defaultValues },
  });

  // Visible steps: filter out conditional Will step when hasWill=false
  const visibleSteps = useMemo(
    () =>
      WIZARD_STEPS.filter(
        (step) => !('conditional' in step && step.conditional) || hasWill,
      ),
    [hasWill],
  );

  const currentStep = visibleSteps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleHasWillChange = (value: boolean) => {
    setHasWill(value);
  };

  const renderStep = () => {
    if (!currentStep) return null;

    switch (currentStep.key) {
      case 'estate':
        return (
          <EstateStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            hasWill={hasWill}
            onHasWillChange={handleHasWillChange}
            errors={methods.formState.errors as Record<string, { message?: string }>}
          />
        );
      case 'decedent':
        return (
          <DecedentStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors as Record<string, { message?: string }>}
          />
        );
      case 'family-tree':
        return <div data-testid="family-tree-step">Family Tree (not yet implemented)</div>;
      case 'will':
        return <div data-testid="will-step">Will & Dispositions (not yet implemented)</div>;
      case 'donations':
        return <div data-testid="donations-step">Donations (not yet implemented)</div>;
      case 'review':
        return <div data-testid="review-step">Review & Config (not yet implemented)</div>;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div data-testid="wizard-container" className="max-w-2xl mx-auto p-4">
        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {visibleSteps.map((step, idx) => (
            <div
              key={step.key}
              data-testid={`step-indicator-${step.key}`}
              className={`px-3 py-1 rounded text-sm ${
                idx === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>

        {/* Current step content */}
        {renderStep()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {currentStepIndex < visibleSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={methods.handleSubmit((data) => onSubmit?.(data))}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
