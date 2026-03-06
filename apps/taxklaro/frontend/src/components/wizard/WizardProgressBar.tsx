interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function WizardProgressBar({ currentStep, totalSteps }: WizardProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-primary">{pct}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default WizardProgressBar;
