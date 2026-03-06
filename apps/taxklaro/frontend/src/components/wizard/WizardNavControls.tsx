import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
}

export function WizardNavControls({
  onBack,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  isSubmitting = false,
  nextLabel,
}: WizardNavControlsProps) {
  return (
    <div className="flex items-center justify-between pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep}
        className="h-11 px-5"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="h-11 px-6"
      >
        {isLastStep ? (nextLabel ?? 'Submit') : 'Next'}
        {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
      </Button>
    </div>
  );
}

export default WizardNavControls;
