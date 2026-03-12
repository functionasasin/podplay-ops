import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { advanceToDeploymentDialog } from '@/lib/confirmation-dialogs';
import { serviceTierLabels } from '@/lib/enum-labels';
import { WizardNavigation } from '@/components/wizard/WizardNavigation';
import { WIZARD_STEPS } from '@/lib/wizard-steps';
import { BomReviewTable } from '@/components/wizard/procurement/BomReviewTable';
import { InventoryCheckPanel } from '@/components/wizard/procurement/InventoryCheckPanel';
import { PoCreateForm } from '@/components/wizard/procurement/PoCreateForm';
import { PoReceiving } from '@/components/wizard/procurement/PoReceiving';
import { PackingList } from '@/components/wizard/procurement/PackingList';

function ProcurementPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [project, setProject] = useState<{ project_name: string; customer_name: string; tier: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);

  useEffect(() => {
    async function loadProject() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('projects') as any)
        .select('project_name, customer_name, tier')
        .eq('id', projectId)
        .single();
      setProject(data);
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  const navigationSteps = WIZARD_STEPS.procurement.map((step, index) => ({
    id: String(index),
    label: step.label,
    status: (index === activeTabIdx ? 'current' : 'completed') as 'current' | 'completed',
  }));
  const isLastStep = activeTabIdx === WIZARD_STEPS.procurement.length - 1;

  function handleNavigationNext() {
    if (isLastStep) {
      setShowAdvanceDialog(true);
    } else {
      setActiveTabIdx((i) => Math.min(WIZARD_STEPS.procurement.length - 1, i + 1));
    }
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
          {loading ? 'Procurement' : `Procurement — ${project?.project_name ?? projectId}`}
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
          nextLabel={isLastStep ? 'Advance to Deployment' : undefined}
        />
      </div>

      <div className="border rounded-lg p-6 min-h-64">
        {activeTabIdx === 0 && (
          <div>
            <h2 className="text-base font-medium mb-4">BOM Review</h2>
            <BomReviewTable projectId={projectId} />
          </div>
        )}
        {activeTabIdx === 1 && (
          <div>
            <h2 className="text-base font-medium mb-4">Inventory Check</h2>
            <InventoryCheckPanel projectId={projectId} />
          </div>
        )}
        {activeTabIdx === 2 && (
          <div className="space-y-8">
            <h2 className="text-base font-medium mb-4">Purchase Orders</h2>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Create Purchase Order</h3>
              <PoCreateForm projectId={projectId} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Receive Purchase Order</h3>
              <PoReceiving projectId={projectId} />
            </div>
          </div>
        )}
        {activeTabIdx === 3 && (
          <div>
            <h2 className="text-base font-medium mb-4">Packing List</h2>
            <PackingList projectId={projectId} />
          </div>
        )}
      </div>

      {showAdvanceDialog && (() => {
        const cfg = advanceToDeploymentDialog(
          project?.project_name ?? projectId,
          project?.tier ? (serviceTierLabels[project.tier as keyof typeof serviceTierLabels] ?? project.tier) : '',
        );
        return (
          <ConfirmDialog
            open={true}
            onOpenChange={(open) => { if (!open) setShowAdvanceDialog(false); }}
            title={cfg.title}
            body={cfg.body}
            confirmLabel={cfg.confirmLabel}
            cancelLabel={cfg.cancelLabel}
            destructive={cfg.destructive}
            onConfirm={async () => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('projects') as any)
                  .update({ project_status: 'deployment' })
                  .eq('id', projectId);
                toast.success('Project advanced to Deployment');
                setShowAdvanceDialog(false);
                navigate({ to: '/projects/$projectId/deployment', params: { projectId } });
              } catch (err) {
                toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
              }
            }}
          />
        );
      })()}
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/procurement')({
  component: ProcurementPage,
});
