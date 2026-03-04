/**
 * DeadlineCard — Single milestone card (§4.20)
 */

import { computeDeadlineStatus } from '@/lib/deadlines';
import type { CaseDeadline, DeadlineStatus } from '@/types';

export interface DeadlineCardProps {
  deadline: CaseDeadline;
  onMarkDone: (deadlineId: string) => void;
}

const STATUS_STYLES: Record<DeadlineStatus, string> = {
  done: 'border-green-500 bg-green-50',
  overdue: 'border-red-500 bg-red-50',
  urgent: 'border-amber-500 bg-amber-50',
  upcoming: 'border-yellow-500 bg-yellow-50',
  future: 'border-slate-300 bg-slate-50',
};

const STATUS_LABELS: Record<DeadlineStatus, string> = {
  done: 'Done',
  overdue: 'Overdue',
  urgent: 'Urgent',
  upcoming: 'Due Soon',
  future: 'Upcoming',
};

export function DeadlineCard({ deadline, onMarkDone }: DeadlineCardProps) {
  const status = computeDeadlineStatus(deadline.due_date, deadline.completed_date);

  return (
    <div
      data-testid={`deadline-card-${deadline.id}`}
      data-status={status}
      className={`border-l-4 rounded-md p-4 ${STATUS_STYLES[status]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">{deadline.label}</h4>
          <p className="text-xs text-muted-foreground">{deadline.description}</p>
          <p className="text-xs mt-1">Due: {deadline.due_date}</p>
          {deadline.legal_basis && (
            <p className="text-xs text-muted-foreground">{deadline.legal_basis}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid={`deadline-status-${deadline.id}`}
            className="text-xs font-medium"
          >
            {STATUS_LABELS[status]}
          </span>
          {status !== 'done' && (
            <button
              data-testid={`deadline-mark-done-${deadline.id}`}
              onClick={() => onMarkDone(deadline.id)}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
            >
              Mark Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
