import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

export interface SetOnOrderModalProps {
  itemId: string;
  itemName: string;
  currentOnOrder: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SetOnOrderModal({
  itemId,
  itemName,
  currentOnOrder,
  isOpen,
  onClose,
  onSuccess,
}: SetOnOrderModalProps) {
  const [newQty, setNewQty] = useState<number | ''>(currentOnOrder);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleClose() {
    setNewQty(currentOnOrder);
    setNotes('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = typeof newQty === 'number' ? newQty : 0;

    if (qty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    const orderStatus = qty === 0 ? 'not_ordered' : 'ordered';

    setIsPending(true);
    try {
      const { error: updateError } = await (supabase.from('inventory') as any)
        .update({ qty_on_order: qty, order_status: orderStatus })
        .eq('item_id', itemId);
      if (updateError) throw updateError;

      toast.success(`On-order updated: ${itemName} → ${qty}`);
      onSuccess();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update on-order quantity.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set On-Order: {itemName}</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Current on-order (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Current On-Order</label>
            <p className="text-sm text-muted-foreground">{currentOnOrder}</p>
          </div>

          {/* New quantity */}
          <div className="space-y-1">
            <label htmlFor="on-order-qty" className="text-sm font-medium">
              New On-Order Quantity
            </label>
            <Input
              id="on-order-qty"
              type="number"
              min={0}
              required
              value={newQty}
              onChange={(e) => setNewQty(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 10"
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1">
            <label htmlFor="on-order-notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="on-order-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PO placed with vendor directly"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
