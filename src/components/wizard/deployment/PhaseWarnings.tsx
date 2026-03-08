import type { ServiceTier } from '@/lib/types';
import { calcPowerSummary } from '@/services/power';

interface PhaseWarningsProps {
  courtCount: number;
  securityCameraCount: number;
  tier: ServiceTier;
}

interface WarningBannerProps {
  message: string;
  level: 'warning' | 'critical';
}

function WarningBanner({ message, level }: WarningBannerProps) {
  const styles =
    level === 'critical'
      ? 'border-l-4 border-red-500 bg-red-50 text-red-900'
      : 'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900';
  return (
    <div className={`${styles} rounded px-4 py-3 text-sm`} role="alert">
      {message}
    </div>
  );
}

export function PhaseWarnings({
  courtCount,
  securityCameraCount,
  tier,
}: PhaseWarningsProps) {
  const summary = calcPowerSummary(courtCount, securityCameraCount, tier);

  const warnings: Array<{ message: string; level: 'warning' | 'critical' }> =
    [];

  if (summary.poeBudgetWarning) {
    warnings.push({ message: summary.poeBudgetWarning, level: 'warning' });
  }

  if (summary.upsWarning) {
    const level = summary.estimatedRuntimeMin < 15 ? 'critical' : 'warning';
    warnings.push({ message: summary.upsWarning, level });
  }

  if (summary.circuitWarning) {
    warnings.push({ message: summary.circuitWarning, level: 'critical' });
  }

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="phase-warnings">
      {warnings.map((w, i) => (
        <WarningBanner key={i} message={w.message} level={w.level} />
      ))}
    </div>
  );
}
