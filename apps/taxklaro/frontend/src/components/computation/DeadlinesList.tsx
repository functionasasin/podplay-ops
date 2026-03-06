interface Deadline {
  id: string;
  milestoneKey: string;
  dueDate: string;
  description?: string | null;
  completed: boolean;
}

interface DeadlinesListProps {
  deadlines: Deadline[];
}

export function DeadlinesList({ deadlines }: DeadlinesListProps) {
  if (deadlines.length === 0) {
    return <p className="text-sm text-muted-foreground">No deadlines.</p>;
  }

  return (
    <ul className="space-y-2">
      {deadlines.map((d) => (
        <li key={d.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{d.description ?? d.milestoneKey}</p>
            <p className="text-xs text-muted-foreground">
              Due: {new Date(d.dueDate).toLocaleDateString('en-PH')}
            </p>
          </div>
          {d.completed && (
            <span className="text-xs text-green-600 font-medium">Done</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default DeadlinesList;
