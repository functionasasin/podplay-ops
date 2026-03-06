import { Check, AlertCircle } from 'lucide-react';
import type { AutoSaveStatus } from '@/types/wizard';

interface SaveStatusIndicatorProps {
  status: AutoSaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'saving') {
    return <span className="text-muted-foreground text-sm">Saving...</span>;
  }
  if (status === 'saved') {
    return (
      <span className="text-muted-foreground text-sm flex items-center gap-1">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-destructive text-sm flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> Save failed
      </span>
    );
  }
  return null;
}
