interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function WizardProgressBar({ currentStep, totalSteps }: WizardProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  return (
    <div className="w-full space-y-1">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}

export default WizardProgressBar;
