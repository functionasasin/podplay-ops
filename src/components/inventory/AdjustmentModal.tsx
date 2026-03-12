import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { VALIDATION } from '@/lib/validation-messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

export interface AdjustmentModalProps {
  itemId: string;
  itemName: string;
  currentQty: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustmentModal({
  itemId,
  itemName,
  currentQty,
  isOpen,
  onClose,
  onSuccess,
}: AdjustmentModalProps) {
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleClose() {
    setDirection('increase');
    setQuantity('');
    setReason('');
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = typeof quantity === 'number' ? quantity : 0;

    if (!qty || qty < 1) {
      setError(VALIDATION.inventory.qty.min);
      return;
    }
    if (!reason.trim()) {
      setError(VALIDATION.inventory.reason.required);
      return;
    }
    if (direction === 'decrease' && qty > currentQty) {
      setError(`Cannot decrease by ${qty} — only ${currentQty} on hand.`);
      return;
    }

    setIsPending(true);
    try {
      const movementType =
        direction === 'increase' ? 'adjustment_increase' : 'adjustment_decrease';

      const delta = direction === 'increase' ? qty : -qty;
      const { error: insertError } = await (supabase.from('inventory_movements') as any).insert({
        hardware_catalog_id: itemId,
        movement_type: movementType,
        qty_delta: delta,
        notes: reason.trim(),
      });
      if (insertError) throw insertError;

      const newQty = currentQty + delta;
      const { error: updateError } = await (supabase.from('inventory') as any)
        .update({ quantity_on_hand: newQty })
        .eq('item_id', itemId);
      if (updateError) throw updateError;

      const sign = direction === 'increase' ? '+' : '-';
      toast.success(`Inventory adjusted: ${sign}${qty} ${itemName}`);
      onSuccess();
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adjust inventory.';
      setError(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adjust Inventory: {itemName}</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Direction */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Direction</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  value="increase"
                  checked={direction === 'increase'}
                  onChange={() => setDirection('increase')}
                />
                Increase
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  value="decrease"
                  checked={direction === 'decrease'}
                  onChange={() => setDirection('decrease')}
                />
                Decrease
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label htmlFor="adj-qty" className="text-sm font-medium">
              Quantity
            </label>
            <Input
              id="adj-qty"
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 5"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label htmlFor="adj-reason" className="text-sm font-medium">
              Reason
            </label>
            <Input
              id="adj-reason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received shipment, Correction"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Submit'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
