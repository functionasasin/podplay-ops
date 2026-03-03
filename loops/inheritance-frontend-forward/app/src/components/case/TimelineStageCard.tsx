/**
 * TimelineStageCard — Individual stage card in the Timeline Report (§4.21)
 * Stub — implementation coming in Stage 22 implement phase.
 */

import type { TimelineStage } from '@/lib/timeline';

export interface TimelineStageCardProps {
  stage: TimelineStage;
  isCurrent: boolean;
}

export function TimelineStageCard({ stage, isCurrent }: TimelineStageCardProps) {
  return (
    <div
      data-testid={`timeline-stage-${stage.number}`}
      data-status={stage.status}
    >
      <span data-testid={`stage-number-${stage.number}`}>{stage.number}</span>
      <span data-testid={`stage-name-${stage.number}`}>{stage.name}</span>
      <span data-testid={`stage-status-${stage.number}`}>{stage.status}</span>
      {isCurrent && (
        <span data-testid="current-stage-indicator">Currently Here</span>
      )}
      {stage.completedDate && (
        <span data-testid={`stage-completed-${stage.number}`}>
          {stage.completedDate}
        </span>
      )}
      {stage.estimatedDate && stage.status !== 'complete' && (
        <span data-testid={`stage-estimated-${stage.number}`}>
          {stage.estimatedDate}
        </span>
      )}
    </div>
  );
}
