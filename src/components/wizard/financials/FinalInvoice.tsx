import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const finalInvoiceSchema = z.object({
  amount: z
    .number()
    .gt(0, 'Amount must be greater than $0'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  payment_method: z.enum(['podplay_card', 'ramp_reimburse']).optional(),
  notes: z.string().optional(),
});

type FinalInvoiceFormValues = z.infer<typeof finalInvoiceSchema>;

interface FinalInvoiceRow {
  id: string;
  type: string;
  amount: number;
  status: 'not_sent' | 'sent' | 'paid';
  issued_date: string;
  payment_method: string | null;
  notes: string | null;
}

interface FinalInvoiceProps {
  projectId: string;
  totalPrice?: number;
  depositAmount?: number;
  projectStatus?: string;
  goLiveDate?: string | null;
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

export function FinalInvoice({
  projectId,
  totalPrice,
  depositAmount,
  projectStatus,
  goLiveDate,
}: FinalInvoiceProps) {
  const [invoices, setInvoices] = useState<FinalInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const balance =
    totalPrice !== undefined && depositAmount !== undefined
      ? Math.round((totalPrice - depositAmount) * 100) / 100
      : undefined;

  const isGoLive =
    projectStatus === 'completed' || (goLiveDate !== undefined && goLiveDate !== null && goLiveDate !== '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinalInvoiceFormValues>({
    resolver: zodResolver(finalInvoiceSchema),
    defaultValues: {
      amount: balance ?? ('' as unknown as number),
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
        .eq('type', 'final');
      setInvoices(data ?? []);
      setLoading(false);
    }
    loadInvoices();
  }, [projectId]);

  async function onSubmit(data: FinalInvoiceFormValues) {
    setSubmitting(true);
    setSubmitError(null);

    const invoiceNumber = `FIN-${projectId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabase.from('invoices') as any)
      .insert({
        project_id: projectId,
        invoice_number: invoiceNumber,
        type: 'final',
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
      setInvoices((prev) => [...prev, inserted as FinalInvoiceRow]);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Final Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Create and track the final invoice for this project.
        </p>
      </div>

      {/* Go-live gate banner */}
      {!isGoLive && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">Go-live required</p>
          <p className="text-sm text-yellow-700 mt-0.5">
            The final invoice is only available after the project has gone live. Set a go-live date
            or mark the project completed to unlock.
          </p>
        </div>
      )}

      {/* Balance summary */}
      {balance !== undefined && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Price</p>
              <p className="font-medium">${(totalPrice ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deposit Paid</p>
              <p className="font-medium">${(depositAmount ?? 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance Due</p>
              <p className="font-semibold text-foreground">${balance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

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
        <h4 className="text-sm font-medium mb-4">Create Final Invoice</h4>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="final-amount" className="text-sm font-medium">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="final-amount"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                className="pl-7"
                disabled={!isGoLive}
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
            <label htmlFor="final-invoice_date" className="text-sm font-medium">
              Invoice Date
            </label>
            <Input
              id="final-invoice_date"
              type="date"
              disabled={!isGoLive}
              {...register('invoice_date')}
            />
            {errors.invoice_date && (
              <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="final-payment_method" className="text-sm font-medium">
              Payment Method
            </label>
            <select
              id="final-payment_method"
              disabled={!isGoLive}
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
            <label htmlFor="final-notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="final-notes"
              rows={3}
              disabled={!isGoLive}
              className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md resize-none"
              placeholder="Optional notes..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" disabled={submitting || !isGoLive}>
            {submitting ? 'Creating...' : 'Create Final Invoice'}
          </Button>
        </form>
      </div>
    </div>
  );
}
