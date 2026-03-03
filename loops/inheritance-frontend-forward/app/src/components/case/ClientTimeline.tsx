/**
 * ClientTimeline — Client-facing shared timeline view (§4.21)
 * Stub — implementation coming in Stage 22 implement phase.
 */

import { TimelineReport } from './TimelineReport';
import type { CaseDeadline } from '@/types';

export interface ClientTimelineProps {
  deadlines: CaseDeadline[];
  track: 'ejs' | 'judicial';
  decedentName: string;
  dateOfDeath: string;
  firmName?: string;
  firmAddress?: string;
}

export function ClientTimeline({
  deadlines,
  track,
  decedentName,
  dateOfDeath,
  firmName,
  firmAddress,
}: ClientTimelineProps) {
  return (
    <div data-testid="client-timeline">
      {firmName && (
        <div data-testid="client-timeline-firm">
          <h2 className="text-lg font-semibold">{firmName}</h2>
          {firmAddress && <p className="text-sm text-muted-foreground">{firmAddress}</p>}
        </div>
      )}

      <div data-testid="client-timeline-header" className="mb-4">
        <h1 className="text-xl font-serif">Estate of {decedentName}</h1>
        <p className="text-sm text-muted-foreground">
          Date of Death: {dateOfDeath} · Settlement:{' '}
          {track === 'ejs' ? 'Extrajudicial' : 'Judicial'}
        </p>
      </div>

      <TimelineReport
        deadlines={deadlines}
        track={track}
        decedentName={decedentName}
        firmName={firmName}
        clientView={true}
      />
    </div>
  );
}
