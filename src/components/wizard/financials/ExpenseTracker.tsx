import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { expenseCategoryLabels } from '@/lib/enum-labels';
import { deleteExpenseDialog } from '@/lib/confirmation-dialogs';
import { formatCurrencyPrecise, formatDate } from '@/lib/formatters';
import type { ExpenseCategory, PaymentMethod } from '@/lib/types';
import { VALIDATION } from '@/lib/validation-messages';

const VE = VALIDATION.financials.expense;

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'airfare', 'car', 'fuel', 'lodging', 'meals', 'misc_hardware',
  'outbound_shipping', 'professional_services', 'taxi', 'train', 'parking', 'other',
];

const expenseFormSchema = z.object({
  category: z.enum(
    ['airfare', 'car', 'fuel', 'lodging', 'meals', 'misc_hardware',
     'outbound_shipping', 'professional_services', 'taxi', 'train', 'parking', 'other'] as const,
  ),
  amount: z
    .number()
    .positive(VE.amount.positive),
  payment_method: z.enum(['podplay_card', 'ramp_reimburse'] as const),
  expense_date: z.string().min(1, VE.date.required),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string;
  notes: string | null;
}

interface ExpenseTrackerProps {
  projectId: string;
}

function paymentMethodLabel(pm: PaymentMethod): string {
  if (pm === 'podplay_card') return 'PodPlay Card';
  if (pm === 'ramp_reimburse') return 'Ramp Reimburse';
  return pm;
}

export function ExpenseTracker({ projectId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<ExpenseRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: undefined,
      amount: undefined,
      payment_method: undefined,
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
  });

  useEffect(() => {
    loadExpenses();
  }, [projectId]);

  async function loadExpenses() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('expenses') as any)
      .select('id, category, amount, payment_method, expense_date, notes')
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });
    setExpenses(data ?? []);
    setLoading(false);
  }

  async function onAddSubmit(data: ExpenseFormValues) {
    setSubmitting(true);
    setSubmitError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase.from('expenses') as any)
      .insert({
        project_id: projectId,
        category: data.category,
        amount: data.amount,
        payment_method: data.payment_method,
        expense_date: data.expense_date,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      setSubmitError(error.message);
    } else {
      setExpenses((prev) => [inserted as ExpenseRow, ...prev]);
      reset({
        category: undefined,
        amount: undefined,
        payment_method: undefined,
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowAddForm(false);
    }
    setSubmitting(false);
  }

  function startEdit(expense: ExpenseRow) {
    setEditingId(expense.id);
    resetEdit({
      category: expense.category,
      amount: expense.amount,
      payment_method: expense.payment_method,
      expense_date: expense.expense_date,
      notes: expense.notes ?? '',
    });
  }

  async function onEditSubmit(data: ExpenseFormValues) {
    if (!editingId) return;
    setSubmitting(true);
    setSubmitError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from('expenses') as any)
      .update({
        category: data.category,
        amount: data.amount,
        payment_method: data.payment_method,
        expense_date: data.expense_date,
        notes: data.notes || null,
      })
      .eq('id', editingId)
      .select()
      .single();

    if (error) {
      setSubmitError(error.message);
    } else {
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingId ? (updated as ExpenseRow) : e))
      );
      setEditingId(null);
    }
    setSubmitting(false);
  }

  async function confirmDelete() {
    if (!deleteExpense) return;
    const { error } = await (supabase.from('expenses') as any).delete().eq('id', deleteExpense.id);
    if (error) {
      toast.error('Failed to delete expense');
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== deleteExpense.id));
    toast.success('Expense deleted');
    setDeleteExpense(null);
  }

  const filtered = categoryFilter
    ? expenses.filter((e) => e.category === categoryFilter)
    : expenses;

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold mb-1">Expenses</h3>
          <p className="text-sm text-muted-foreground">
            Track all project expenses by category.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4">New Expense</h4>
          <form onSubmit={handleSubmit(onAddSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                  {...register('category')}
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {expenseCategoryLabels[cat]}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="add-amount" className="text-sm font-medium">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="add-amount"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="0.00"
                    className="pl-7"
                    {...register('amount', {
                      setValueAs: (v: string) =>
                        v === '' ? NaN : parseFloat(parseFloat(v).toFixed(2)),
                    })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="payment_method" className="text-sm font-medium">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                  {...register('payment_method')}
                >
                  <option value="">Select method</option>
                  <option value="podplay_card">PodPlay Card</option>
                  <option value="ramp_reimburse">Ramp Reimburse</option>
                </select>
                {errors.payment_method && (
                  <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="expense_date" className="text-sm font-medium">
                  Date
                </label>
                <Input id="expense_date" type="date" {...register('expense_date')} />
                {errors.expense_date && (
                  <p className="text-sm text-destructive">{errors.expense_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md resize-none"
                placeholder="Optional notes..."
                {...register('notes')}
              />
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Expense'}
            </Button>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-3">
        <label htmlFor="category-filter" className="text-sm font-medium whitespace-nowrap">
          Filter by category:
        </label>
        <select
          id="category-filter"
          className="border border-input bg-background px-3 py-1.5 text-sm rounded-md"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | '')}
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {expenseCategoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Expense Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading expenses...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">Payment</th>
                <th className="text-right px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) =>
                editingId === expense.id ? (
                  <tr key={expense.id} className="border-b bg-blue-50">
                    <td colSpan={5} className="px-4 py-3">
                      <form
                        onSubmit={handleSubmitEdit(onEditSubmit)}
                        noValidate
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <select
                              className="w-full border border-input bg-background px-2 py-1.5 text-sm rounded-md"
                              {...registerEdit('category')}
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {expenseCategoryLabels[cat]}
                                </option>
                              ))}
                            </select>
                            {editErrors.category && (
                              <p className="text-xs text-destructive mt-0.5">
                                {editErrors.category.message}
                              </p>
                            )}
                          </div>

                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              min={0.01}
                              step={0.01}
                              className="pl-5 h-8 text-sm"
                              {...registerEdit('amount', {
                                setValueAs: (v: string) =>
                                  v === '' ? NaN : parseFloat(parseFloat(v).toFixed(2)),
                              })}
                            />
                            {editErrors.amount && (
                              <p className="text-xs text-destructive mt-0.5">
                                {editErrors.amount.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <select
                              className="w-full border border-input bg-background px-2 py-1.5 text-sm rounded-md"
                              {...registerEdit('payment_method')}
                            >
                              <option value="podplay_card">PodPlay Card</option>
                              <option value="ramp_reimburse">Ramp Reimburse</option>
                            </select>
                          </div>

                          <div>
                            <Input
                              type="date"
                              className="h-8 text-sm"
                              {...registerEdit('expense_date')}
                            />
                          </div>
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            className="w-full border border-input bg-background px-2 py-1.5 text-sm rounded-md resize-none"
                            placeholder="Notes..."
                            {...registerEdit('notes')}
                          />
                        </div>

                        {submitError && (
                          <p className="text-sm text-destructive">{submitError}</p>
                        )}

                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{expense.expense_date}</td>
                    <td className="px-4 py-2">{expenseCategoryLabels[expense.category]}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {paymentMethodLabel(expense.payment_method)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => startEdit(expense)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => setDeleteExpense(expense)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/50">
                <td colSpan={3} className="px-4 py-2 text-sm font-medium">
                  {categoryFilter
                    ? `Total (${expenseCategoryLabels[categoryFilter]})`
                    : 'Total'}
                </td>
                <td className="px-4 py-2 text-right text-sm font-semibold">
                  ${total.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}

      {deleteExpense && (() => {
        const cfg = deleteExpenseDialog(
          formatCurrencyPrecise(deleteExpense.amount),
          expenseCategoryLabels[deleteExpense.category],
          formatDate(deleteExpense.expense_date),
        );
        return (
          <ConfirmDialog
            open={true}
            onOpenChange={(open) => { if (!open) setDeleteExpense(null); }}
            title={cfg.title}
            body={cfg.body}
            confirmLabel={cfg.confirmLabel}
            cancelLabel={cfg.cancelLabel}
            destructive={cfg.destructive}
            onConfirm={confirmDelete}
          />
        );
      })()}
    </div>
  );
}
