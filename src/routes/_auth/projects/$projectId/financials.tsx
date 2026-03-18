import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DepositInvoice } from '@/components/wizard/financials/DepositInvoice';
import { FinalInvoice } from '@/components/wizard/financials/FinalInvoice';
import { ExpenseTracker } from '@/components/wizard/financials/ExpenseTracker';
import { PnlSummary } from '@/components/wizard/financials/PnlSummary';
import { GoLive } from '@/components/wizard/financials/GoLive';
import { RecurringFeesTab } from '@/components/wizard/financials/RecurringFeesTab';
import { CostAnalysis } from '@/components/wizard/financials/CostAnalysis';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { WIZARD_STEPS } from '@/lib/wizard-steps';

function FinancialsPage() {
  const { projectId } = Route.useParams();
  // Read ?tab search param for deep-linking from global financials
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = Number(searchParams.get('tab') ?? '0');
  const [activeTabIdx, setActiveTabIdx] = useState(initialTab);
  const [project, setProject] = useState<{ project_name: string; customer_name: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinancialData() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectRes = await (supabase.from('projects') as any)
        .select('project_name, customer_name')
        .eq('id', projectId)
        .single();
      setProject(projectRes.data);
      setLoading(false);
    }
    loadFinancialData();
  }, [projectId]);

  const navigationSteps = WIZARD_STEPS.financials.map((step, index) => ({
    id: String(index),
    label: step.label,
    status: (index === activeTabIdx ? 'current' : 'completed') as 'current' | 'completed',
  }));
  const isLastStep = activeTabIdx === WIZARD_STEPS.financials.length - 1;

  function handleNavigationNext() {
    setActiveTabIdx((i) => Math.min(WIZARD_STEPS.financials.length - 1, i + 1));
  }

  function handleNavigationPrevious() {
    setActiveTabIdx((i) => Math.max(0, i - 1));
  }

  function handleStepClick(stepId: string) {
    setActiveTabIdx(Number(stepId));
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {loading ? 'Financials' : `Financials — ${project?.project_name ?? projectId}`}
        </h1>
        {!loading && project?.customer_name && (
          <p className="text-sm text-muted-foreground mt-0.5">{project.customer_name}</p>
        )}
      </div>

      <div className="border rounded-lg p-4 bg-background">
        <WizardNavigation
          steps={navigationSteps}
          onStepClick={handleStepClick}
          onPrevious={handleNavigationPrevious}
          onNext={handleNavigationNext}
          isFirstStep={activeTabIdx === 0}
          isLastStep={isLastStep}
        />
      </div>

      <div className="border rounded-lg p-6 min-h-64">
        {activeTabIdx === 0 && (
          <div className="space-y-8">
            <h2 className="text-base font-medium">Invoicing</h2>
            <DepositInvoice projectId={projectId} />
            <FinalInvoice projectId={projectId} />
          </div>
        )}
        {activeTabIdx === 1 && (
          <ExpenseTracker projectId={projectId} />
        )}
        {activeTabIdx === 2 && (
          <CostAnalysis projectId={projectId} />
        )}
        {activeTabIdx === 3 && (
          <PnlSummary projectId={projectId} />
        )}
        {activeTabIdx === 4 && (
          <div>
            <h2 className="text-base font-medium mb-4">Go-Live</h2>
            <GoLive projectId={projectId} />
          </div>
        )}
        {activeTabIdx === 5 && <RecurringFeesTab projectId={projectId} />}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/financials')({
  component: FinancialsPage,
});
