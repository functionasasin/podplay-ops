import { useState, useCallback } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { computeActiveSteps } from '../../lib/wizard-routing';
import { WizardProgressBar } from '../../components/wizard/WizardProgressBar';
import {
  WS00ModeSelection,
  WS01TaxpayerProfile,
  WS02BusinessType,
  WS03TaxYear,
  WS04GrossReceipts,
  WS05Compensation,
  WS06ExpenseMethod,
  WS07AItemizedExpenses,
  WS07BFinancialItems,
  WS07CDepreciation,
  WS07DNolco,
  WS08CwtForm2307,
  WS09PriorQuarterly,
  WS10Registration,
  WS11RegimeElection,
  WS12FilingDetails,
  WS13PriorYearCredits,
  WizardReview,
} from '../../components/wizard';
import type { WizardFormData, WizardStepId } from '../../types/wizard';
import { DEFAULT_WIZARD_DATA } from '../../types/wizard';
import { createDefaultTaxpayerInput } from '../../types/engine-input';
import type { TaxpayerInput } from '../../types/engine-input';
import { useCompute } from '../../hooks/useCompute';
import { ResultsView } from '../../components/computation/ResultsView';

export const ComputationsNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/computations/new',
  beforeLoad: authGuard,
  component: ComputationsNewPage,
});

type StepProps = {
  data: Partial<WizardFormData>;
  onChange: (u: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

const STEP_COMPONENTS: Record<WizardStepId, React.ComponentType<StepProps>> = {
  WS00: WS00ModeSelection,
  WS01: WS01TaxpayerProfile,
  WS02: WS02BusinessType,
  WS03: WS03TaxYear,
  WS04: WS04GrossReceipts,
  WS05: WS05Compensation,
  WS06: WS06ExpenseMethod,
  WS07A: WS07AItemizedExpenses,
  WS07B: WS07BFinancialItems,
  WS07C: WS07CDepreciation,
  WS07D: WS07DNolco,
  WS08: WS08CwtForm2307,
  WS09: WS09PriorQuarterly,
  WS10: WS10Registration,
  WS11: WS11RegimeElection,
  WS12: WS12FilingDetails,
  WS13: WS13PriorYearCredits,
  // WizardReview has a different signature — handled separately
  REVIEW: null as unknown as React.ComponentType<StepProps>,
};

function ComputationsNewPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<WizardFormData>>({ ...DEFAULT_WIZARD_DATA });
  const [stepIndex, setStepIndex] = useState(0);
  const { result, errors, isComputing, runCompute } = useCompute();

  const activeSteps = computeActiveSteps(formData);
  const allSteps: (WizardStepId | 'REVIEW')[] = [...activeSteps, 'REVIEW'];
  const currentStepId = allSteps[stepIndex] ?? 'WS00';
  const isFirstStep = stepIndex === 0;
  const isReview = currentStepId === 'REVIEW';

  const handleChange = useCallback((updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, allSteps.length - 1));
  }, [allSteps.length]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    const defaults = createDefaultTaxpayerInput();
    const { clientId, computationTitle, ...wizardFields } = formData as WizardFormData;
    const engineInput: TaxpayerInput = {
      ...defaults,
      ...wizardFields,
      itemizedExpenses: {
        ...defaults.itemizedExpenses,
        ...(wizardFields.itemizedExpenses ?? {}),
      },
    };
    await runCompute(engineInput);
  }, [formData, runCompute]);

  // Show results after computation
  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" data-testid="computations-new-page">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-normal">Computation Results</h1>
          <button
            className="text-sm text-primary hover:underline transition-colors"
            onClick={() => navigate({ to: '/computations' })}
          >
            Back to Computations
          </button>
        </div>
        <ResultsView result={result} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="computations-new-page">
      <div>
        <h1 className="font-display text-3xl font-normal">New Computation</h1>
        <p className="text-sm text-muted-foreground mt-1">Answer a few questions and we'll compute your tax.</p>
      </div>

      <WizardProgressBar currentStep={stepIndex + 1} totalSteps={allSteps.length} />

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {errors.map((e, i) => (
            <p key={i}>{e.message}</p>
          ))}
        </div>
      )}

      <div
        className="rounded-xl bg-card border p-4 sm:p-8"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        {isReview ? (
          <WizardReview data={formData} onBack={handleBack} onSubmit={handleSubmit} />
        ) : (
          (() => {
            const StepComponent = STEP_COMPONENTS[currentStepId];
            return StepComponent ? (
              <StepComponent data={formData} onChange={handleChange} onNext={handleNext} onBack={handleBack} />
            ) : null;
          })()
        )}
      </div>
    </div>
  );
}
