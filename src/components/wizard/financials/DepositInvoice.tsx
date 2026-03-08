import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const depositInvoiceSchema = z.object({
  amount: z
    .number()
    .gt(0, 'Amount must be greater than $0'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  payment_method: z.enum(['podplay_card', 'ramp_reimburse']).optional(),
  notes: z.string().optional(),
});

type DepositInvoiceFormValues = z.infer<typeof depositInvoiceSchema>;

interface DepositInvoiceRow {
  id: string;
  type: string;
  amount: number;
  status: 'not_sent' | 'sent' | 'paid';
  issued_date: string;
  payment_method: string | null;
  notes: string | null;
}

interface DepositInvoiceProps {
  projectId: string;
  depositAmount?: number;
}

function statusLabel(status: string): string {
  if (status === 'not_sent') return 'Draft';
  if (status === 'sent') return 'Sent';
  if (status === 'paid') return 'Paid';
  return status;
}

function statusClass(status: string): string {
  if (status === 'not_sent') return 'bg-gray-100 text-gray-700';
  if (status === 'sent') return 'bg-yellow-100 text-yellow-700';
  if (status === 'paid') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function DepositInvoice({ projectId, depositAmount }: DepositInvoiceProps) {
  const [invoices, setInvoices] = useState<DepositInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepositInvoiceFormValues>({
    resolver: zodResolver(depositInvoiceSchema),
    defaultValues: {
      amount: depositAmount ?? ('' as unknown as number),
      invoice_date: new Date().toISOString().split('T')[0],
      payment_method: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    async function loadInvoices() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('invoices') as any)
        .select('id, type, amount, status, issued_date, payment_method, notes')
        .eq('project_id', projectId)
        .eq('type', 'deposit');
      setInvoices(data ?? []);
      setLoading(false);
    }
    loadInvoices();
  }, [projectId]);

  async function onSubmit(data: DepositInvoiceFormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const invoiceNumber = `DEP-${projectId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabase.from('invoices') as any)
      .insert({
        project_id: projectId,
        invoice_number: invoiceNumber,
        type: 'deposit',
        amount: data.amount,
        tax_amount: 0,
        total_amount: data.amount,
        status: 'not_sent',
        payment_method: data.payment_method ?? null,
        issued_date: data.invoice_date,
        due_date: data.invoice_date,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (insertError) {
      setSubmitError(insertError.message);
    } else {
      setInvoices((prev) => [...prev, inserted as DepositInvoiceRow]);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Deposit Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Create and track the deposit invoice for this project.
        </p>
      </div>

      {/* Status Tracking */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading invoices...</p>
      ) : invoices.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Invoice Status</h4>
          {invoices.map((inv) => (
            <div key={inv.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">${Number(inv.amount).toFixed(2)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(inv.status)}`}
                >
                  {statusLabel(inv.status)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Issued: {inv.issued_date}</p>
                {inv.payment_method && (
                  <p>
                    Payment method:{' '}
                    {inv.payment_method === 'podplay_card' ? 'PodPlay Card' : 'Ramp Reimburse'}
                  </p>
                )}
                {inv.notes && <p>Notes: {inv.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Create Invoice Form */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-medium mb-4">Create Deposit Invoice</h4>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
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
            <label htmlFor="invoice_date" className="text-sm font-medium">
              Invoice Date
            </label>
            <Input id="invoice_date" type="date" {...register('invoice_date')} />
            {errors.invoice_date && (
              <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
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
              <option value="">Select payment method</option>
              <option value="podplay_card">PodPlay Card</option>
              <option value="ramp_reimburse">Ramp Reimburse</option>
            </select>
            {errors.payment_method && (
              <p className="text-sm text-destructive">{errors.payment_method.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md resize-none"
              placeholder="Optional notes..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Deposit Invoice'}
          </Button>
        </form>
      </div>
    </div>
  );
}
