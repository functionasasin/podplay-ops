import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const FINANCIALS_TABS = ['Invoicing', 'Expenses', 'P&L Summary', 'Go-Live'] as const;

type FinancialsTab = (typeof FINANCIALS_TABS)[number];

interface Invoice {
  id: string;
  invoice_type: string;
  amount: number;
  status: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
}

function FinancialsPage() {
  const { projectId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<FinancialsTab>('Invoicing');
  const [project, setProject] = useState<{ project_name: string; customer_name: string } | null>(
    null,
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinancialData() {
      const [projectRes, invoicesRes, expensesRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('projects') as any)
          .select('project_name, customer_name')
          .eq('id', projectId)
          .single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('invoices') as any)
          .select('id, invoice_type, amount, status')
          .eq('project_id', projectId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('expenses') as any)
          .select('id, description, amount, category')
          .eq('project_id', projectId),
      ]);
      setProject(projectRes.data);
      setInvoices(invoicesRes.data ?? []);
      setExpenses(expensesRes.data ?? []);
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
        <div className="flex border-b bg-muted/30">
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
            <div>
              <h2 className="text-base font-medium mb-4">Invoicing</h2>
              <p className="text-sm text-muted-foreground">
                {invoices.length} invoice(s) — invoice management coming soon.
              </p>
            </div>
          )}
          {activeTab === 'Expenses' && (
            <div>
              <h2 className="text-base font-medium mb-4">Expenses</h2>
              <p className="text-sm text-muted-foreground">
                {expenses.length} expense(s) — expense tracking coming soon.
              </p>
            </div>
          )}
          {activeTab === 'P&L Summary' && (
            <div>
              <h2 className="text-base font-medium mb-4">P&L Summary</h2>
              <p className="text-sm text-muted-foreground">
                Profit and loss summary coming soon.
              </p>
            </div>
          )}
          {activeTab === 'Go-Live' && (
            <div>
              <h2 className="text-base font-medium mb-4">Go-Live</h2>
              <p className="text-sm text-muted-foreground">
                Go-live confirmation and project handoff coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/projects/$projectId/financials')({
  component: FinancialsPage,
});
