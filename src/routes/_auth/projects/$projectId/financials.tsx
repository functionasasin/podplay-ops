import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DepositInvoice } from '@/components/wizard/financials/DepositInvoice';
import { FinalInvoice } from '@/components/wizard/financials/FinalInvoice';
import { ExpenseTracker } from '@/components/wizard/financials/ExpenseTracker';
import { PnlSummary } from '@/components/wizard/financials/PnlSummary';
import { GoLive } from '@/components/wizard/financials/GoLive';

const FINANCIALS_TABS = ['Invoicing', 'Expenses', 'P&L Summary', 'Go-Live'] as const;

type FinancialsTab = (typeof FINANCIALS_TABS)[number];

function FinancialsPage() {
  const { projectId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<FinancialsTab>('Invoicing');
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Financials</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground mt-0.5">Loading...</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">
            {project?.project_name ?? projectId} — {project?.customer_name ?? ''}
          </p>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b bg-muted/30 overflow-x-auto">
          {FINANCIALS_TABS.map((tab) => (
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
          {activeTab === 'Invoicing' && (
            <div className="space-y-8">
              <DepositInvoice projectId={projectId} />
              <FinalInvoice projectId={projectId} />
            </div>
          )}
          {activeTab === 'Expenses' && (
            <ExpenseTracker projectId={projectId} />
          )}
          {activeTab === 'P&L Summary' && (
            <PnlSummary projectId={projectId} />
          )}
          {activeTab === 'Go-Live' && (
            <GoLive projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/financials')({
  component: FinancialsPage,
});
