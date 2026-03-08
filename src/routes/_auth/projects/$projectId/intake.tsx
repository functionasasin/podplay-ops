import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { CustomerInfoStep, type CustomerInfoValues } from '@/components/wizard/intake/CustomerInfoStep';
import { VenueConfigStep, type VenueConfigValues } from '@/components/wizard/intake/VenueConfigStep';
import { TierSelectionStep, type TierSelectionValues } from '@/components/wizard/intake/TierSelectionStep';
import { IspInfoStep, type IspInfoValues } from '@/components/wizard/intake/IspInfoStep';
import { InstallerSelectionStep, type InstallerSelectionValues } from '@/components/wizard/intake/InstallerSelectionStep';

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
  const [wizardData, setWizardData] = useState<{
    customerInfo?: CustomerInfoValues;
    venueConfig?: VenueConfigValues;
    tierSelection?: TierSelectionValues;
    ispInfo?: IspInfoValues;
    installerSelection?: InstallerSelectionValues;
  }>({});
  const { projectId } = Route.useParams();

  function handleCustomerInfoNext(data: CustomerInfoValues) {
    setWizardData((prev) => ({ ...prev, customerInfo: data }));
    setCurrentStep(1);
  }

  function handleVenueConfigNext(data: VenueConfigValues) {
    setWizardData((prev) => ({ ...prev, venueConfig: data }));
    setCurrentStep(2);
  }

  function handleTierSelectionNext(data: TierSelectionValues) {
    setWizardData((prev) => ({ ...prev, tierSelection: data }));
    setCurrentStep(3);
  }

  function handleIspInfoNext(data: IspInfoValues) {
    setWizardData((prev) => ({ ...prev, ispInfo: data }));
    setCurrentStep(4);
  }

  function handleInstallerSelectionNext(data: InstallerSelectionValues) {
    setWizardData((prev) => ({ ...prev, installerSelection: data }));
    setCurrentStep(5);
  }

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
        {currentStep === 0 && (
          <CustomerInfoStep
            defaultValues={wizardData.customerInfo}
            onNext={handleCustomerInfoNext}
          />
        )}
        {currentStep === 1 && (
          <VenueConfigStep
            defaultValues={wizardData.venueConfig}
            onNext={handleVenueConfigNext}
          />
        )}
        {currentStep === 2 && (
          <TierSelectionStep
            defaultValues={wizardData.tierSelection}
            onNext={handleTierSelectionNext}
          />
        )}
        {currentStep === 3 && (
          <IspInfoStep
            defaultValues={wizardData.ispInfo}
            courtCount={wizardData.venueConfig?.court_count ?? 1}
            onNext={handleIspInfoNext}
          />
        )}
        {currentStep === 4 && (
          <InstallerSelectionStep
            defaultValues={wizardData.installerSelection}
            onNext={handleInstallerSelectionNext}
          />
        )}
        {currentStep > 4 && (
          <p className="text-sm text-muted-foreground">
            This step will be implemented in a future stage.
          </p>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/intake')({
  component: IntakePage,
});
