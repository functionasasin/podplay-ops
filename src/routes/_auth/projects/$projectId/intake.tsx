import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { WizardStepper } from '@/components/wizard/WizardStepper';

const INTAKE_STEPS = [
  'Customer Info',
  'Venue Config',
  'Service Tier',
  'ISP Info',
  'Installer',
  'Financial Setup',
  'Review & Submit',
];

function IntakePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { projectId } = Route.useParams();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Intake Wizard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Project {projectId}</p>
      </div>

      <div className="border rounded-lg p-4 bg-background">
        <WizardStepper
          steps={INTAKE_STEPS}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      </div>

      <div className="border rounded-lg p-6 min-h-64">
        <h2 className="text-base font-medium mb-4">
          Step {currentStep + 1}: {INTAKE_STEPS[currentStep]}
        </h2>
        <p className="text-sm text-muted-foreground">
          This step will be implemented in a future stage.
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/intake')({
  component: IntakePage,
});
