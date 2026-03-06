import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ValidationWarning } from '@/types/common';

interface WarningsBannerProps {
  warnings: ValidationWarning[];
}

export function WarningsBanner({ warnings }: WarningsBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w) => (
        <Alert key={w.code} variant={w.severity === 'WARNING' ? 'destructive' : 'default'}>
          <AlertTitle className="flex items-center gap-2">
            <Badge
              variant={w.severity === 'WARNING' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {w.code}
            </Badge>
            {w.severity === 'WARNING' ? 'Warning' : 'Notice'}
          </AlertTitle>
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

export default WarningsBanner;
