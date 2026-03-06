import { CheckCircle2, Clock } from 'lucide-react';

interface DeadlineCardProps {
  milestoneKey: string;
  dueDate: string;
  description?: string | null;
  completed?: boolean;
  computationTitle?: string;
}

function getUrgencyClasses(dueDate: string, completed: boolean): string {
  if (completed) return 'border-l-4 border-l-green-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'border-l-4 border-l-destructive';
  if (daysUntil <= 30) return 'border-l-4 border-l-amber-500';
  return 'border-l-4 border-l-primary/40';
}

function getUrgencyLabel(dueDate: string, completed: boolean): { label: string; className: string } | null {
  if (completed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { label: 'Overdue', className: 'text-xs font-medium text-destructive' };
  if (daysUntil === 0) return { label: 'Due today', className: 'text-xs font-medium text-destructive' };
  if (daysUntil <= 7) return { label: `${daysUntil}d left`, className: 'text-xs font-medium text-amber-600' };
  if (daysUntil <= 30) return { label: `${daysUntil}d left`, className: 'text-xs font-medium text-amber-500' };
  return null;
}

export function DeadlineCard({ milestoneKey, dueDate, description, completed, computationTitle }: DeadlineCardProps) {
  const date = new Date(dueDate + 'T00:00:00');
  const day = date.toLocaleDateString('en-PH', { day: 'numeric' });
  const month = date.toLocaleDateString('en-PH', { month: 'short' });
  const year = date.getFullYear();
  const urgencyLabel = getUrgencyLabel(dueDate, !!completed);

  return (
    <div
      className={`bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex ${getUrgencyClasses(dueDate, !!completed)} ${completed ? 'opacity-60' : ''}`}
    >
      {/* Date column */}
      <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[4rem] bg-muted/40 text-center">
        <span className="font-display text-2xl leading-none text-foreground">{day}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-0.5">{month}</span>
        <span className="text-xs text-muted-foreground">{year}</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug">{description ?? milestoneKey}</p>
          {completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          ) : urgencyLabel ? (
            <span className={`shrink-0 mt-0.5 ${urgencyLabel.className}`}>{urgencyLabel.label}</span>
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
          )}
        </div>
        {computationTitle && (
          <p className="text-xs text-muted-foreground truncate">{computationTitle}</p>
        )}
        {completed && (
          <p className="text-xs text-green-600 font-medium">Completed</p>
        )}
      </div>
    </div>
  );
}

export default DeadlineCard;
