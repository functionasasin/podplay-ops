import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BomReviewTable } from '@/components/wizard/procurement/BomReviewTable';
import { InventoryCheckPanel } from '@/components/wizard/procurement/InventoryCheckPanel';
import { PoCreateForm } from '@/components/wizard/procurement/PoCreateForm';
import { PoReceiving } from '@/components/wizard/procurement/PoReceiving';

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
  const [activeTab, setActiveTab] = useState<ProcurementTab>('BOM Review');
  const [project, setProject] = useState<{ project_name: string; customer_name: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('projects') as any)
        .select('project_name, customer_name')
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
        <div className="flex border-b bg-muted/30">
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
              <div>
                <h2 className="text-base font-medium mb-4">Create Purchase Order</h2>
                <PoCreateForm projectId={projectId} />
              </div>
              <div>
                <h2 className="text-base font-medium mb-4">Receive Purchase Order</h2>
                <PoReceiving projectId={projectId} />
              </div>
            </div>
          )}
          {activeTab === 'Packing List' && (
            <div>
              <h2 className="text-base font-medium mb-2">Packing List</h2>
              <p className="text-sm text-muted-foreground">Packing List panel — coming soon.</p>
            </div>
          )}
          {activeTab === 'CC Terminals' && (
            <div>
              <h2 className="text-base font-medium mb-2">CC Terminals</h2>
              <p className="text-sm text-muted-foreground">CC Terminals panel — coming soon.</p>
            </div>
          )}
          {activeTab === 'Replay Signs' && (
            <div>
              <h2 className="text-base font-medium mb-2">Replay Signs</h2>
              <p className="text-sm text-muted-foreground">Replay Signs panel — coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/procurement')({
  component: ProcurementPage,
});
