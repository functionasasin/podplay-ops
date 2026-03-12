import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WizardStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'locked';
}

interface WizardNavigationProps {
  steps: WizardStep[];
  onStepClick: (stepId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextLabel?: string;
}

export function WizardNavigation({
  steps,
  onStepClick,
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  nextLabel,
}: WizardNavigationProps) {
  const resolvedNextLabel = nextLabel ?? (isLastStep ? 'Complete' : 'Next');

  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <nav aria-label="Wizard steps" className="flex items-center gap-0 overflow-x-auto">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isLocked = step.status === 'locked';

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={isLocked ? undefined : () => onStepClick(step.id)}
                disabled={isLocked}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap',
                  isCurrent && 'font-semibold text-primary',
                  isCompleted && 'text-muted-foreground hover:text-foreground',
                  isLocked && 'opacity-50 cursor-not-allowed text-muted-foreground',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium shrink-0',
                    isCurrent && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-primary/20 text-primary',
                    isLocked && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {step.label}
              </button>

              {index < steps.length - 1 && (
                <span className="mx-1 text-muted-foreground/40 select-none">›</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Prev / Next buttons */}
      <div className="flex items-center justify-between">
        <div>
          {!isFirstStep && (
            <Button type="button" variant="outline" onClick={onPrevious}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          )}
        </div>
        <Button type="button" onClick={onNext}>
          {resolvedNextLabel}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
