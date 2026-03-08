import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface InvoiceRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  issued_date: string | null;
}

interface BomItem {
  id: string;
  est_total_cost: number | null;
}

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
}

interface MonthRow {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2026"
  revenue: number;
  cogs: number;
  expenses: number;
  gross_margin: number;
}

interface PnlSummaryProps {
  projectId: string;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatMargin(pct: number): string {
  return `${(pct * 100).toFixed(1)}%`;
}

function getMonthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function PnlSummary({ projectId }: PnlSummaryProps) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [invRes, bomRes, expRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('invoices') as any)
          .select('id, type, amount, status, issued_date')
          .eq('project_id', projectId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('project_bom_items') as any)
          .select('id, est_total_cost')
          .eq('project_id', projectId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('expenses') as any)
          .select('id, category, amount, expense_date')
          .eq('project_id', projectId),
      ]);
      setInvoices(invRes.data ?? []);
      setBomItems(bomRes.data ?? []);
      setExpenses(expRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading P&L summary...</p>;
  }

  // --- Revenue ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  // --- COGS ---
  const nullCostCount = bomItems.filter((b) => b.est_total_cost === null).length;
  const totalCogs = bomItems.reduce((sum, b) => sum + Number(b.est_total_cost ?? 0), 0);

  // --- Expenses ---
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // --- Gross margin ---
  const grossMargin = totalRevenue - totalCogs - totalExpenses;
  const grossMarginPct = totalRevenue > 0 ? grossMargin / totalRevenue : 0;
  const isNegative = grossMargin < 0;

  // --- Monthly breakdown ---
  // Collect all months referenced by invoices and expenses
  const monthSet = new Set<string>();

  invoices.forEach((inv) => {
    if (inv.issued_date) {
      monthSet.add(inv.issued_date.slice(0, 7));
    }
  });
  expenses.forEach((exp) => {
    if (exp.expense_date) {
      monthSet.add(exp.expense_date.slice(0, 7));
    }
  });

  const months = Array.from(monthSet).sort();

  const monthRows: MonthRow[] = months.map((month) => {
    const rev = invoices
      .filter((inv) => (inv.issued_date ?? '').startsWith(month))
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
    const exp = expenses
      .filter((e) => (e.expense_date ?? '').startsWith(month))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    // COGS distributed evenly across months that have revenue (or all in first month if no dates)
    // For simplicity: allocate COGS proportionally to revenue in each month
    const cogs = totalRevenue > 0 && rev > 0 ? (rev / totalRevenue) * totalCogs : 0;
    const margin = rev - cogs - exp;
    return {
      month,
      label: getMonthLabel(month),
      revenue: rev,
      cogs,
      expenses: exp,
      gross_margin: margin,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">P&L Summary</h3>
        <p className="text-sm text-muted-foreground">
          Profit and loss summary for this project.
        </p>
      </div>

      {/* Summary Card */}
      <div className="border rounded-lg p-5 space-y-4">
        {/* Revenue */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Revenue
          </p>
          <div className="space-y-1 text-sm">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground">No invoices yet.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">
                    {inv.type} invoice
                  </span>
                  <span>{formatCurrency(Number(inv.amount))}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Total revenue</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* COGS */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Cost of Goods Sold
          </p>
          {nullCostCount > 0 && (
            <p className="text-xs text-amber-600 mb-1">
              ⚠ {nullCostCount} BOM item{nullCostCount > 1 ? 's' : ''} have unknown unit cost
              — COGS may be understated.
            </p>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span>Hardware COGS</span>
            <span>{formatCurrency(totalCogs)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Operating Expenses
          </p>
          <div className="text-sm">
            {expenses.length === 0 ? (
              <p className="text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {expenses.length} expense{expenses.length > 1 ? 's' : ''}
                </span>
                <span>{formatCurrency(totalExpenses)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gross Margin */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-sm">Gross Margin</span>
            <div className="text-right">
              <span
                className={`font-semibold text-base ${isNegative ? 'text-red-700' : 'text-green-700'}`}
              >
                {formatCurrency(grossMargin)}
              </span>
              <span
                className={`text-xs ml-2 ${grossMarginPct < 0.3 ? 'text-orange-600' : 'text-muted-foreground'}`}
              >
                {formatMargin(grossMarginPct)}
                {grossMarginPct < 0.3 && grossMarginPct >= 0 && ' ⚠'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthRows.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Monthly Breakdown</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Month</th>
                  <th className="text-right px-4 py-2 font-medium">Revenue</th>
                  <th className="text-right px-4 py-2 font-medium">COGS</th>
                  <th className="text-right px-4 py-2 font-medium">Expenses</th>
                  <th className="text-right px-4 py-2 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthRows.map((row) => (
                  <tr key={row.month} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2">{row.label}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {formatCurrency(row.cogs)}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {formatCurrency(row.expenses)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        row.gross_margin < 0 ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {formatCurrency(row.gross_margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td className="px-4 py-2 text-sm font-semibold">Total</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">
                    {formatCurrency(totalCogs)}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right text-sm font-semibold ${
                      grossMargin < 0 ? 'text-red-700' : 'text-green-700'
                    }`}
                  >
                    {formatCurrency(grossMargin)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
