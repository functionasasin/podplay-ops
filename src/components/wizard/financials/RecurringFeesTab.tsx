import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const FEE_FREQUENCIES = ['monthly', 'quarterly', 'annually'] as const;
type FeeFrequency = (typeof FEE_FREQUENCIES)[number];

const frequencyLabel: Record<FeeFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const feeFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  amount: z
    .number()
    .min(0, 'Amount must be 0 or more'),
  frequency: z.enum(FEE_FREQUENCIES),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

interface FeeRow {
  id: string;
  label: string;
  description: string | null;
  amount: number;
  frequency: FeeFrequency;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  vendor: string | null;
  notes: string | null;
}

interface RecurringFeesTabProps {
  projectId: string;
}

function toMonthly(amount: number, frequency: FeeFrequency): number {
  if (frequency === 'monthly') return amount;
  if (frequency === 'quarterly') return amount / 3;
  return amount / 12; // annually
}

const SELECT_FIELDS =
  'id, label, description, amount, frequency, start_date, end_date, is_active, vendor, notes';

export function RecurringFeesTab({ projectId }: RecurringFeesTabProps) {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteFee, setDeleteFee] = useState<FeeRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      label: '',
      description: '',
      amount: undefined,
      frequency: 'monthly',
      start_date: '',
      end_date: '',
      vendor: '',
      notes: '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
  });

  useEffect(() => {
    loadFees();
  }, [projectId]);

  async function loadFees() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('recurring_fees') as any)
      .select(SELECT_FIELDS)
      .eq('project_id', projectId)
      .order('created_at');
    setFees(data ?? []);
    setLoading(false);
  }

  async function onAddSubmit(data: FeeFormValues) {
    setSubmitting(true);
    setSubmitError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase.from('recurring_fees') as any)
      .insert({
        project_id: projectId,
        label: data.label,
        description: data.description || null,
        amount: data.amount,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date || null,
        vendor: data.vendor || null,
        notes: data.notes || null,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      setSubmitError(error.message);
    } else {
      setFees((prev) => [...prev, inserted as FeeRow]);
      reset({
        label: '',
        description: '',
        amount: undefined,
        frequency: 'monthly',
        start_date: '',
        end_date: '',
        vendor: '',
        notes: '',
      });
      setShowAddForm(false);
    }
    setSubmitting(false);
  }

  function startEdit(fee: FeeRow) {
    setEditingId(fee.id);
    resetEdit({
      label: fee.label,
      description: fee.description ?? '',
      amount: fee.amount,
      frequency: fee.frequency,
      start_date: fee.start_date,
      end_date: fee.end_date ?? '',
      vendor: fee.vendor ?? '',
      notes: fee.notes ?? '',
    });
  }

  async function onEditSubmit(data: FeeFormValues) {
    if (!editingId) return;
    setSubmitting(true);
    setSubmitError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from('recurring_fees') as any)
      .update({
        label: data.label,
        description: data.description || null,
        amount: data.amount,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date || null,
        vendor: data.vendor || null,
        notes: data.notes || null,
      })
      .eq('id', editingId)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      setSubmitError(error.message);
    } else {
      setFees((prev) =>
        prev.map((f) => (f.id === editingId ? (updated as FeeRow) : f))
      );
      setEditingId(null);
    }
    setSubmitting(false);
  }

  async function toggleActive(fee: FeeRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('recurring_fees') as any)
      .update({ is_active: !fee.is_active })
      .eq('id', fee.id);
    if (error) {
      toast.error('Failed to update fee');
      return;
    }
    setFees((prev) =>
      prev.map((f) => (f.id === fee.id ? { ...f, is_active: !f.is_active } : f))
    );
  }

  async function confirmDelete() {
    if (!deleteFee) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('recurring_fees') as any)
      .delete()
      .eq('id', deleteFee.id);
    if (error) {
      toast.error('Failed to delete fee');
      return;
    }
    setFees((prev) => prev.filter((f) => f.id !== deleteFee.id));
    toast.success('Fee deleted');
    setDeleteFee(null);
  }

  const totalMonthly = fees
    .filter((f) => f.is_active)
    .reduce((sum, f) => sum + toMonthly(Number(f.amount), f.frequency), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold mb-1">Recurring Fees</h3>
          <p className="text-sm text-muted-foreground">
            Track recurring monthly costs for this project.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Cancel' : 'Add Fee'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4">
          <h4 className="text-sm font-medium mb-4">New Recurring Fee</h4>
          <form onSubmit={handleSubmit(onAddSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="add-label" className="text-sm font-medium">
                  Label <span className="text-destructive">*</span>
                </label>
                <Input
                  id="add-label"
                  type="text"
                  placeholder="e.g. Replay License"
                  {...register('label')}
                />
                {errors.label && (
                  <p className="text-sm text-destructive">{errors.label.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="add-description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="add-description"
                  type="text"
                  placeholder="Optional description"
                  {...register('description')}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="add-amount" className="text-sm font-medium">
                  Amount <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="add-amount"
                    type="number"
                    min={0}
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
                <label htmlFor="add-frequency" className="text-sm font-medium">
                  Frequency
                </label>
                <select
                  id="add-frequency"
                  className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                  {...register('frequency')}
                >
                  {FEE_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {frequencyLabel[f]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="add-start-date" className="text-sm font-medium">
                  Start Date <span className="text-destructive">*</span>
                </label>
                <Input id="add-start-date" type="date" {...register('start_date')} />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="add-end-date" className="text-sm font-medium">
                  End Date <span className="text-muted-foreground text-xs">(leave blank = ongoing)</span>
                </label>
                <Input id="add-end-date" type="date" {...register('end_date')} />
              </div>

              <div className="space-y-1">
                <label htmlFor="add-vendor" className="text-sm font-medium">
                  Vendor
                </label>
                <Input
                  id="add-vendor"
                  type="text"
                  placeholder="Optional vendor"
                  {...register('vendor')}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="add-notes" className="text-sm font-medium">
                  Notes
                </label>
                <Input
                  id="add-notes"
                  type="text"
                  placeholder="Optional notes"
                  {...register('notes')}
                />
              </div>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Fee'}
            </Button>
          </form>
        </div>
      )}

      {/* Fee Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading recurring fees...</p>
      ) : fees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recurring fees recorded yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">Label</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Frequency</th>
                  <th className="text-left px-4 py-2 font-medium">Start Date</th>
                  <th className="text-left px-4 py-2 font-medium">End Date</th>
                  <th className="text-left px-4 py-2 font-medium">Vendor</th>
                  <th className="text-left px-4 py-2 font-medium">Active</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) =>
                  editingId === fee.id ? (
                    <tr key={fee.id} className="border-b bg-blue-50">
                      <td colSpan={8} className="px-4 py-3">
                        <form
                          onSubmit={handleSubmitEdit(onEditSubmit)}
                          noValidate
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs font-medium">Label *</label>
                              <Input
                                type="text"
                                className="h-8 text-sm"
                                {...registerEdit('label')}
                              />
                              {editErrors.label && (
                                <p className="text-xs text-destructive mt-0.5">
                                  {editErrors.label.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-medium">Description</label>
                              <Input
                                type="text"
                                className="h-8 text-sm"
                                {...registerEdit('description')}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Amount *</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="pl-5 h-8 text-sm"
                                  {...registerEdit('amount', {
                                    setValueAs: (v: string) =>
                                      v === '' ? NaN : parseFloat(parseFloat(v).toFixed(2)),
                                  })}
                                />
                              </div>
                              {editErrors.amount && (
                                <p className="text-xs text-destructive mt-0.5">
                                  {editErrors.amount.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-medium">Frequency</label>
                              <select
                                className="w-full border border-input bg-background px-2 py-1.5 text-sm rounded-md"
                                {...registerEdit('frequency')}
                              >
                                {FEE_FREQUENCIES.map((f) => (
                                  <option key={f} value={f}>
                                    {frequencyLabel[f]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium">Start Date *</label>
                              <Input
                                type="date"
                                className="h-8 text-sm"
                                {...registerEdit('start_date')}
                              />
                              {editErrors.start_date && (
                                <p className="text-xs text-destructive mt-0.5">
                                  {editErrors.start_date.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs font-medium">End Date</label>
                              <Input
                                type="date"
                                className="h-8 text-sm"
                                {...registerEdit('end_date')}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Vendor</label>
                              <Input
                                type="text"
                                className="h-8 text-sm"
                                {...registerEdit('vendor')}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Notes</label>
                              <Input
                                type="text"
                                className="h-8 text-sm"
                                {...registerEdit('notes')}
                              />
                            </div>
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
                    <tr key={fee.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{fee.label}</td>
                      <td className="px-4 py-2 text-right">${Number(fee.amount).toFixed(2)}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {frequencyLabel[fee.frequency]}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{fee.start_date}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {fee.end_date ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {fee.vendor ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          className={`text-xs font-medium ${
                            fee.is_active ? 'text-green-600' : 'text-muted-foreground'
                          } hover:underline`}
                          onClick={() => toggleActive(fee)}
                        >
                          {fee.is_active ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => startEdit(fee)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs text-destructive hover:underline"
                            onClick={() => setDeleteFee(fee)}
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
                  <td colSpan={7} className="px-4 py-2 text-sm font-medium">
                    Total Monthly Recurring
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">
                    ${totalMonthly.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {deleteFee && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteFee(null);
          }}
          title="Delete Recurring Fee?"
          body={`Delete "${deleteFee.label}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
