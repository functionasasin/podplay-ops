import React, { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Check } from 'lucide-react';
import type { EngineInput } from '../../types';
import { EstateStep } from './EstateStep';
import { DecedentStep } from './DecedentStep';
import { FamilyTreeStep } from './FamilyTreeStep';
import { WillStep } from './WillStep';
import { DonationsStep } from './DonationsStep';
import { ReviewStep } from './ReviewStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        return (
          <FamilyTreeStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors as Record<string, { message?: string }>}
          />
        );
      case 'will':
        return (
          <WillStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors as Record<string, { message?: string }>}
            persons={(methods.watch('family_tree') ?? []) as any}
          />
        );
      case 'donations':
        return (
          <DonationsStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors as Record<string, { message?: string }>}
            persons={(methods.watch('family_tree') ?? []) as any}
          />
        );
      case 'review':
        return (
          <ReviewStep
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
            errors={methods.formState.errors as Record<string, { message?: string }>}
            hasWill={hasWill}
            persons={(methods.watch('family_tree') ?? []) as any}
            onSubmit={methods.handleSubmit((data) => onSubmit?.(data))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div data-testid="wizard-container" className="max-w-2xl mx-auto">
        {/* Step indicators */}
        <nav className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {visibleSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div
                    className={cn(
                      'hidden sm:block h-px flex-1 min-w-4 max-w-12',
                      isCompleted ? 'bg-accent' : 'bg-border',
                    )}
                  />
                )}
                <div
                  data-testid={`step-indicator-${step.key}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors',
                    isCurrent && 'bg-accent text-accent-foreground font-medium',
                    isCompleted && 'text-primary font-medium',
                    !isCurrent && !isCompleted && 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0',
                      isCurrent && 'bg-primary text-primary-foreground',
                      isCompleted && 'bg-primary text-primary-foreground',
                      !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Current step content */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {currentStepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              Back
            </Button>
          )}
          <div className="ml-auto">
            {currentStepIndex < visibleSteps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={methods.handleSubmit((data) => onSubmit?.(data))}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
