import type { ComputationStatus } from '@/types/org';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<ComputationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  computed: 'default',
  finalized: 'default',
  archived: 'outline',
};

interface ComputationPageHeaderProps {
  title: string;
  taxYear: number;
  status: ComputationStatus;
  clientName?: string | null;
}

export function ComputationPageHeader({ title, taxYear, status, clientName }: ComputationPageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold truncate">{title}</h1>
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Tax Year {taxYear}
        {clientName && ` · ${clientName}`}
      </p>
    </div>
  );
}

export default ComputationPageHeader;
