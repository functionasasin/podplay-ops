import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Intake wizard steps" className="flex items-center gap-0 overflow-x-auto">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLocked = index > currentStep;

        return (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={isLocked ? undefined : () => onStepClick(index)}
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
              {label}
            </button>

            {index < steps.length - 1 && (
              <span className="mx-1 text-muted-foreground/40 select-none">›</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
