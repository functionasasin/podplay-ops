/**
 * WarningsPanel — manual flag cards (forward-compatible).
 * Hidden when warnings array is empty.
 */
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { ManualFlag, InheritanceShare } from '../../types';
import { getWarningSeverity } from './utils';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export interface WarningsPanelProps {
  warnings: ManualFlag[];
  shares: InheritanceShare[];
}

const SEVERITY_ICON: Record<'error' | 'warning' | 'info', React.ReactNode> = {
  error: <AlertCircle className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  info: <Info className="size-4" />,
};

const SEVERITY_ALERT_CLASSES: Record<'error' | 'warning' | 'info', string> = {
  error: 'border-destructive/30 bg-red-50 text-red-800 [&>svg]:text-red-600',
  warning: 'border-warning/30 bg-amber-50 text-amber-800 [&>svg]:text-amber-600',
  info: 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600',
};

export function WarningsPanel({ warnings, shares }: WarningsPanelProps) {
  if (warnings.length === 0) {
    return <div data-testid="warnings-panel" />;
  }

  return (
    <div data-testid="warnings-panel">
      <h2 className="font-serif text-lg font-semibold text-primary mb-4">Manual Review Required</h2>
      <div className="space-y-3">
        {warnings.map((warning, index) => {
          const severity = getWarningSeverity(warning.category);
          const relatedHeir = warning.related_heir_id
            ? shares.find((s) => s.heir_id === warning.related_heir_id)
            : null;

          return (
            <Alert
              key={index}
              data-testid={`warning-card-${index}`}
              className={SEVERITY_ALERT_CLASSES[severity]}
            >
              {SEVERITY_ICON[severity]}
              <AlertTitle className="text-xs font-semibold uppercase tracking-wide">
                {severity}
              </AlertTitle>
              <AlertDescription>
                <p>{warning.description}</p>
                {relatedHeir && (
                  <p className="text-sm mt-1 opacity-80">Related heir: {relatedHeir.heir_name}</p>
                )}
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </div>
  );
}
