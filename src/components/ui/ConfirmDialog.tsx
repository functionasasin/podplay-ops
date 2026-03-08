import { useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // toast error handled by caller
    } finally {
      setIsPending(false);
    }
  }

  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {destructive ? (
            <>
              <AlertDialogCancel autoFocus disabled={isPending} onClick={handleCancel}>
                {cancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive' }))}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {confirmLabel}
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={isPending} onClick={handleCancel}>
                {cancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction autoFocus onClick={handleConfirm} disabled={isPending}>
                {confirmLabel}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
