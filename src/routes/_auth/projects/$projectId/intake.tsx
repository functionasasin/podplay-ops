import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
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
import { isStepAccessible, getStepStates, WIZARD_STEPS } from '@/lib/wizard-steps';

function IntakePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepFormRef = useRef<HTMLFormElement | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<{
    customerInfo?: CustomerInfoValues;
    venueConfig?: VenueConfigValues;
    tierSelection?: TierSelectionValues;
    ispInfo?: IspInfoValues;
    installerSelection?: InstallerSelectionValues;
    financialSetup?: FinancialSetupValues;
  }>({});
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchWizardStep() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: project } = await (supabase.from('projects') as any)
        .select('wizard_step, project_status, project_name, customer_name, contact_email, contact_phone')
        .eq('id', projectId)
        .single();
      if (project?.project_status && project.project_status !== 'intake') {
        const status = project.project_status as string;
        if (status === 'procurement') {
          void navigate({ to: '/projects/$projectId/procurement', params: { projectId } });
        } else if (status === 'deployment') {
          void navigate({ to: '/projects/$projectId/deployment', params: { projectId } });
        } else {
          void navigate({ to: '/projects/$projectId/financials', params: { projectId } });
        }
        return;
      }
      if (project?.wizard_step != null) {
        setCurrentStep(project.wizard_step);
      }
      if (project?.project_name) {
        setProjectName(project.project_name);
      }
      if (project?.customer_name || project?.contact_email || project?.contact_phone) {
        setWizardData((prev) => ({
          ...prev,
          customerInfo: {
            customer_name: project.customer_name ?? '',
            contact_email: project.contact_email ?? '',
            contact_phone: project.contact_phone ?? '',
          },
        }));
      }
    }
    void fetchWizardStep();
  }, [projectId, navigate]);

  async function advanceStep(nextStep: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('projects') as any).update({ wizard_step: nextStep }).eq('id', projectId);
    setCurrentStep(nextStep);
  }

  function handleCustomerInfoNext(data: CustomerInfoValues) {
    setWizardData((prev) => ({ ...prev, customerInfo: data }));
    void advanceStep(1);
  }

  function handleVenueConfigNext(data: VenueConfigValues) {
    setWizardData((prev) => ({ ...prev, venueConfig: data }));
    void advanceStep(2);
  }

  function handleTierSelectionNext(data: TierSelectionValues) {
    setWizardData((prev) => ({ ...prev, tierSelection: data }));
    void advanceStep(3);
  }

  function handleIspInfoNext(data: IspInfoValues) {
    setWizardData((prev) => ({ ...prev, ispInfo: data }));
    void advanceStep(4);
  }

  function handleInstallerSelectionNext(data: InstallerSelectionValues) {
    setWizardData((prev) => ({ ...prev, installerSelection: data }));
    void advanceStep(5);
  }

  function handleFinancialSetupNext(data: FinancialSetupValues) {
    setWizardData((prev) => ({ ...prev, financialSetup: data }));
    void advanceStep(6);
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
          venue_address_line1: venueConfig?.venue_address ?? null,
          court_count: venueConfig?.court_count ?? null,
          door_count: venueConfig?.door_count ?? 0,
          security_camera_count: venueConfig?.camera_count ?? 0,
          has_front_desk: venueConfig?.has_front_desk ?? false,
          tier: tierSelection?.service_tier ?? null,
          isp_provider: ispInfo?.isp_provider ?? null,
          has_static_ip: ispInfo?.has_static_ip ?? false,
          internet_upload_mbps: ispInfo?.upload_speed_mbps ?? null,
          internet_download_mbps: ispInfo?.download_speed_mbps ?? null,
          installer_ids: installerSelection?.installer_ids ?? [],
          go_live_date: financialSetup?.target_go_live_date ?? null,
        })
        .eq('id', projectId);

      if (updateError) throw new Error(updateError.message);

      // Step 1b: Create deposit invoice if deposit_amount provided
      if (financialSetup?.deposit_amount) {
        const depositAmount = Number(financialSetup.deposit_amount);
        const today = new Date().toISOString().split('T')[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: invoiceError } = await (supabase.from('invoices') as any).insert({
          project_id: projectId,
          invoice_number: `DEP-${projectId.slice(0, 8).toUpperCase()}`,
          type: 'deposit',
          amount: depositAmount,
          total_amount: depositAmount,
          status: 'not_sent',
          issued_date: today,
          due_date: financialSetup.target_go_live_date ?? today,
        });
        if (invoiceError) console.warn('Deposit invoice creation failed:', invoiceError.message);
      }

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
      window.location.href = `/projects/${projectId}/procurement`;
    } catch (err) {
      console.error('Intake submit failed:', err);
      showToast('INTAKE_COMPLETE_ERROR');
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepStates = getStepStates('intake', currentStep);
  const navigationSteps = WIZARD_STEPS.intake.map((step, index) => ({
    id: String(index),
    label: step.label,
    status: stepStates[index],
  }));
  const isLastStep = currentStep === WIZARD_STEPS.intake.length - 1;

  function handleNavigationNext() {
    if (isLastStep) {
      void handleIntakeSubmit();
    } else {
      stepFormRef.current?.requestSubmit();
    }
  }

  function handleNavigationPrevious() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleStepClick(stepId: string) {
    const index = Number(stepId);
    if (isStepAccessible(stepStates[index])) setCurrentStep(index);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {projectName ? `Intake — ${projectName}` : 'Intake Wizard'}
        </h1>
      </div>

      <div className="border rounded-lg p-4 bg-background">
        <WizardNavigation
          steps={navigationSteps}
          onStepClick={handleStepClick}
          onPrevious={handleNavigationPrevious}
          onNext={handleNavigationNext}
          isFirstStep={currentStep === 0}
          isLastStep={isLastStep}
        />
      </div>

      <div className="border rounded-lg p-4 sm:p-6 min-h-64">
        <h2 className="text-base font-medium mb-4">
          Step {currentStep + 1}: {WIZARD_STEPS.intake[currentStep].label}
        </h2>
        {currentStep === 0 && (
          <CustomerInfoStep
            defaultValues={wizardData.customerInfo}
            onNext={handleCustomerInfoNext}
            formRef={stepFormRef}
          />
        )}
        {currentStep === 1 && (
          <VenueConfigStep
            defaultValues={wizardData.venueConfig}
            onNext={handleVenueConfigNext}
            formRef={stepFormRef}
          />
        )}
        {currentStep === 2 && (
          <TierSelectionStep
            defaultValues={wizardData.tierSelection}
            onNext={handleTierSelectionNext}
            formRef={stepFormRef}
          />
        )}
        {currentStep === 3 && (
          <IspInfoStep
            defaultValues={wizardData.ispInfo}
            courtCount={wizardData.venueConfig?.court_count ?? 1}
            onNext={handleIspInfoNext}
            formRef={stepFormRef}
          />
        )}
        {currentStep === 4 && (
          <InstallerSelectionStep
            defaultValues={wizardData.installerSelection}
            onNext={handleInstallerSelectionNext}
            formRef={stepFormRef}
          />
        )}
        {currentStep === 5 && (
          <FinancialSetupStep
            defaultValues={wizardData.financialSetup}
            onNext={handleFinancialSetupNext}
            formRef={stepFormRef}
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
            onEdit={advanceStep}
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
