/**
 * TimelineReport — Settlement timeline panel (§4.21)
 */

import { buildTimelineData } from '@/lib/timeline';
import type { TimelineData } from '@/lib/timeline';
import { TimelineStageCard } from './TimelineStageCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card data-testid="timeline-report">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Settlement Timeline</CardTitle>
          <Badge data-testid="timeline-track" variant="secondary">
            {track === 'ejs' ? 'Extrajudicial' : 'Judicial'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div data-testid="timeline-progress-bar">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Overall Progress</span>
            <span data-testid="timeline-progress-percent" className="font-medium text-sm">
              {data.progressPercent}% — Stage {data.currentStageNumber} of {data.stages.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${Math.max(data.progressPercent, 2)}%` }}
              data-testid="timeline-progress-fill"
            />
          </div>
        </div>

        {data.estimatedCompletionDate && (
          <p data-testid="estimated-completion" className="text-sm text-muted-foreground">
            Estimated Settlement Completion: {data.estimatedCompletionDate}
          </p>
        )}

        <div className="space-y-2" data-testid="timeline-stages">
          {data.stages.map((stage) => (
            <TimelineStageCard
              key={stage.number}
              stage={stage}
              isCurrent={stage.number === data.currentStageNumber}
            />
          ))}
        </div>

        {clientView && (
          <div data-testid="client-view-content" className="sr-only">
            {firmName && <div data-testid="client-firm-name">{firmName}</div>}
            {decedentName && <div data-testid="client-decedent-name">Estate of {decedentName}</div>}
            <div data-testid="client-stages">
              {data.stages.map((stage) => (
                <div key={stage.number} data-testid={`client-stage-${stage.number}`}>
                  <span>Stage {stage.number}: {stage.name}</span>
                  <p>{stage.clientDescription}</p>
                  {stage.number === data.currentStageNumber && (
                    <span data-testid="client-current-indicator">Currently Here</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
