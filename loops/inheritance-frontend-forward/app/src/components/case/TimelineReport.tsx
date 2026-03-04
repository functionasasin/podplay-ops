/**
 * TimelineReport — Settlement timeline panel (§4.21)
 */

import { buildTimelineData } from '@/lib/timeline';
import type { TimelineData } from '@/lib/timeline';
import { TimelineStageCard } from './TimelineStageCard';
import type { CaseDeadline } from '@/types';

export interface TimelineReportProps {
  deadlines: CaseDeadline[];
  track: 'ejs' | 'judicial';
  decedentName?: string;
  firmName?: string;
  /** When true, use client-facing plain language */
  clientView?: boolean;
}

export function TimelineReport({
  deadlines,
  track,
  decedentName,
  firmName,
  clientView = false,
}: TimelineReportProps) {
  const data: TimelineData = buildTimelineData(deadlines, track);

  return (
    <div data-testid="timeline-report">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Settlement Timeline</h3>
        <span data-testid="timeline-track">
          {track === 'ejs' ? 'Extrajudicial Settlement' : 'Judicial Settlement'}
        </span>
      </div>

      <div data-testid="timeline-progress-bar" className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span data-testid="timeline-progress-percent">
            {data.progressPercent}% — Stage {data.currentStageNumber} of {data.stages.length}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2"
            style={{ width: `${data.progressPercent}%` }}
            data-testid="timeline-progress-fill"
          />
        </div>
      </div>

      {data.estimatedCompletionDate && (
        <p data-testid="estimated-completion" className="text-sm text-muted-foreground mb-4">
          Estimated Settlement Completion: {data.estimatedCompletionDate}
        </p>
      )}

      <div className="space-y-3" data-testid="timeline-stages">
        {data.stages.map((stage) => (
          <TimelineStageCard
            key={stage.number}
            stage={stage}
            isCurrent={stage.number === data.currentStageNumber}
          />
        ))}
      </div>

      {clientView && (
        <div data-testid="client-view-content">
          {firmName && (
            <div data-testid="client-firm-name">{firmName}</div>
          )}
          {decedentName && (
            <div data-testid="client-decedent-name">Estate of {decedentName}</div>
          )}
          <div data-testid="client-stages">
            {data.stages.map((stage) => (
              <div key={stage.number} data-testid={`client-stage-${stage.number}`}>
                <span>Stage {stage.number}: {stage.name}</span>
                <p>{stage.clientDescription}</p>
                {stage.number === data.currentStageNumber && (
                  <span data-testid="client-current-indicator">← Currently Here</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
