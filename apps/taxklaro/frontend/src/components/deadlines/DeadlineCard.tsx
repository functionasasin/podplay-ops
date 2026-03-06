interface DeadlineCardProps {
  milestoneKey: string;
  dueDate: string;
  description?: string | null;
  completed?: boolean;
  computationTitle?: string;
}

export function DeadlineCard({ milestoneKey, dueDate, description, completed, computationTitle }: DeadlineCardProps) {
  return (
    <div className={`border rounded-lg p-4 space-y-1 ${completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{description ?? milestoneKey}</p>
        {completed && <span className="text-xs text-green-600 font-medium">Completed</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Due: {new Date(dueDate).toLocaleDateString('en-PH', { dateStyle: 'long' })}
      </p>
      {computationTitle && (
        <p className="text-xs text-muted-foreground truncate">{computationTitle}</p>
      )}
    </div>
  );
}

export default DeadlineCard;
