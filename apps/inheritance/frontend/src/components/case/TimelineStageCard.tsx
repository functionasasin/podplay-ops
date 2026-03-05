/**
 * TimelineStageCard — Individual stage card in the Timeline Report (§4.21)
 */

import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import type { TimelineStage, StageStatus } from '@/lib/timeline';

export interface TimelineStageCardProps {
  stage: TimelineStage;
  isCurrent: boolean;
}

const STATUS_STYLES: Record<StageStatus, string> = {
  complete: 'border-green-500/40 bg-green-50/50',
  'in-progress': 'border-primary bg-primary/5 ring-1 ring-primary/20',
  upcoming: 'border-muted bg-muted/30',
  overdue: 'border-red-500 bg-red-50/50',
};

const STATUS_ICON: Record<StageStatus, React.ReactNode> = {
  complete: <CheckCircle2 className="size-5 text-green-600" />,
  'in-progress': <Clock className="size-5 text-primary" />,
  upcoming: <Circle className="size-5 text-muted-foreground/50" />,
  overdue: <AlertTriangle className="size-5 text-red-500" />,
};

const STATUS_LABEL: Record<StageStatus, string> = {
  complete: 'Complete',
  'in-progress': 'In Progress',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
};

export function TimelineStageCard({ stage, isCurrent }: TimelineStageCardProps) {
  return (
    <div
      data-testid={`timeline-stage-${stage.number}`}
      data-status={stage.status}
      className={`border-l-4 rounded-md px-4 py-3 transition-colors ${STATUS_STYLES[stage.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{STATUS_ICON[stage.status]}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                data-testid={`stage-number-${stage.number}`}
                className="text-xs font-medium text-muted-foreground"
              >
                Stage {stage.number}
              </span>
              {isCurrent && (
                <span
                  data-testid="current-stage-indicator"
                  className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                >
                  Current
                </span>
              )}
            </div>
            <h4
              data-testid={`stage-name-${stage.number}`}
              className="font-medium text-sm mt-0.5"
            >
              {stage.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stage.clientDescription}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span
            data-testid={`stage-status-${stage.number}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {STATUS_LABEL[stage.status]}
          </span>
          {stage.completedDate && (
            <p
              data-testid={`stage-completed-${stage.number}`}
              className="text-[11px] text-muted-foreground"
            >
              {stage.completedDate}
            </p>
          )}
          {stage.estimatedDate && stage.status !== 'complete' && (
            <p
              data-testid={`stage-estimated-${stage.number}`}
              className="text-[11px] text-muted-foreground"
            >
              Est. {stage.estimatedDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
