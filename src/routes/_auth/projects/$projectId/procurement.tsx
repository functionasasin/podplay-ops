import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { advanceToDeploymentDialog } from '@/lib/confirmation-dialogs';
import { BomReviewTable } from '@/components/wizard/procurement/BomReviewTable';
import { InventoryCheckPanel } from '@/components/wizard/procurement/InventoryCheckPanel';
import { PoCreateForm } from '@/components/wizard/procurement/PoCreateForm';
import { PoReceiving } from '@/components/wizard/procurement/PoReceiving';
import { PackingList } from '@/components/wizard/procurement/PackingList';
import { CcTerminalOrder } from '@/components/wizard/procurement/CcTerminalOrder';
import { ReplaySignFulfillment } from '@/components/wizard/procurement/ReplaySignFulfillment';
const PROCUREMENT_TABS = [
  'BOM Review',
  'Inventory Check',
  'Purchase Orders',
  'Packing List',
  'CC Terminals',
  'Replay Signs',
] as const;

type ProcurementTab = (typeof PROCUREMENT_TABS)[number];

function ProcurementPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProcurementTab>('BOM Review');
  const [project, setProject] = useState<{ project_name: string; customer_name: string; service_tier: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    async function loadProject() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('projects') as any)
        .select('project_name, customer_name, service_tier')
        .eq('id', projectId)
        .single();
      setProject(data);
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Procurement</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground mt-0.5">Loading...</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">
            {project?.project_name ?? projectId} — {project?.customer_name ?? ''}
          </p>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto border-b bg-muted/30">
          {PROCUREMENT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-background border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-64">
          {activeTab === 'BOM Review' && (
            <div>
              <h2 className="text-base font-medium mb-4">BOM Review</h2>
              <BomReviewTable projectId={projectId} />
            </div>
          )}
          {activeTab === 'Inventory Check' && (
            <div>
              <h2 className="text-base font-medium mb-4">Inventory Check</h2>
              <InventoryCheckPanel projectId={projectId} />
            </div>
          )}
          {activeTab === 'Purchase Orders' && (
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
          {activeTab === 'Packing List' && (
            <div>
              <h2 className="text-base font-medium mb-4">Packing List</h2>
              <PackingList projectId={projectId} />
            </div>
          )}
          {activeTab === 'CC Terminals' && (
            <div>
              <h2 className="text-base font-medium mb-4">CC Terminals</h2>
              <CcTerminalOrder projectId={projectId} />
            </div>
          )}
          {activeTab === 'Replay Signs' && (
            <div>
              <h2 className="text-base font-medium mb-4">Replay Signs</h2>
              <ReplaySignFulfillment projectId={projectId} />
            </div>
          )}
        </div>
      </div>
      {/* Advance to Deployment */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdvanceDialog(true)}
          disabled={advancing}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Advance to Deployment →
        </button>
      </div>

      {showAdvanceDialog && (() => {
        const cfg = advanceToDeploymentDialog(
          project?.project_name ?? projectId,
          project?.service_tier ?? '',
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
              setAdvancing(true);
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
              } finally {
                setAdvancing(false);
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
