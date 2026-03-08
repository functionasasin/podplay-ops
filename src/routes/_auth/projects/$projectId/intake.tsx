import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { WizardStepper } from '@/components/wizard/WizardStepper';
import { CustomerInfoStep, type CustomerInfoValues } from '@/components/wizard/intake/CustomerInfoStep';
import { VenueConfigStep, type VenueConfigValues } from '@/components/wizard/intake/VenueConfigStep';
import { TierSelectionStep, type TierSelectionValues } from '@/components/wizard/intake/TierSelectionStep';
import { IspInfoStep, type IspInfoValues } from '@/components/wizard/intake/IspInfoStep';
import { InstallerSelectionStep, type InstallerSelectionValues } from '@/components/wizard/intake/InstallerSelectionStep';
import { FinancialSetupStep, type FinancialSetupValues } from '@/components/wizard/intake/FinancialSetupStep';
import { ReviewStep } from '@/components/wizard/intake/ReviewStep';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';
import { generateBom } from '@/services/bom';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardData, setWizardData] = useState<{
    customerInfo?: CustomerInfoValues;
    venueConfig?: VenueConfigValues;
    tierSelection?: TierSelectionValues;
    ispInfo?: IspInfoValues;
    installerSelection?: InstallerSelectionValues;
    financialSetup?: FinancialSetupValues;
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

  function handleFinancialSetupNext(data: FinancialSetupValues) {
    setWizardData((prev) => ({ ...prev, financialSetup: data }));
    setCurrentStep(6);
  }

  async function handleIntakeSubmit() {
    const { customerInfo, venueConfig, tierSelection, ispInfo, installerSelection, financialSetup } =
      wizardData;

    setIsSubmitting(true);
    try {
      // Step 1: Update project row with all wizard data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('projects') as any)
        .update({
          customer_name: customerInfo?.customer_name ?? null,
          contact_email: customerInfo?.contact_email ?? null,
          contact_phone: customerInfo?.contact_phone || null,
          venue_address: venueConfig?.venue_address ?? null,
          court_count: venueConfig?.court_count ?? null,
          door_count: venueConfig?.door_count ?? 0,
          security_camera_count: venueConfig?.camera_count ?? 0,
          has_front_desk: venueConfig?.has_front_desk ?? false,
          has_pingpod_wifi: venueConfig?.has_pingpod_wifi ?? false,
          tier: tierSelection?.service_tier ?? null,
          isp_provider: ispInfo?.isp_provider ?? null,
          has_static_ip: ispInfo?.has_static_ip ?? false,
          internet_upload_mbps: ispInfo?.upload_speed_mbps ?? null,
          internet_download_mbps: ispInfo?.download_speed_mbps ?? null,
          installer_id: installerSelection?.installer_id || null,
          target_go_live_date: financialSetup?.target_go_live_date ?? null,
          deposit_amount: financialSetup?.deposit_amount ?? null,
        })
        .eq('id', projectId);

      if (updateError) throw new Error(updateError.message);

      // Step 2: Generate BOM
      const { error: bomError } = await generateBom(projectId);
      if (bomError) throw new Error(bomError);

      // Step 3: Update project status to procurement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: statusError } = await (supabase.from('projects') as any)
        .update({ project_status: 'procurement' })
        .eq('id', projectId);

      if (statusError) throw new Error(statusError.message);

      showToast('INTAKE_COMPLETE_SUCCESS');
      window.location.href = `/projects/${projectId}`;
    } catch (err) {
      console.error('Intake submit failed:', err);
      showToast('INTAKE_COMPLETE_ERROR');
    } finally {
      setIsSubmitting(false);
    }
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
        {currentStep === 5 && (
          <FinancialSetupStep
            defaultValues={wizardData.financialSetup}
            onNext={handleFinancialSetupNext}
          />
        )}
        {currentStep === 6 && (
          <ReviewStep
            customerInfo={wizardData.customerInfo}
            venueConfig={wizardData.venueConfig}
            tierSelection={wizardData.tierSelection}
            ispInfo={wizardData.ispInfo}
            installerSelection={wizardData.installerSelection}
            financialSetup={wizardData.financialSetup}
            onEdit={setCurrentStep}
            onSubmit={handleIntakeSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/intake')({
  component: IntakePage,
});
