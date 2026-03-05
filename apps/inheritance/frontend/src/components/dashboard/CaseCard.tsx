import type { CaseListItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

export interface CaseCardProps {
  caseItem: CaseListItem;
  onClick?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  computed: 'bg-blue-100 text-blue-700',
  finalized: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function CaseCard({ caseItem, onClick }: CaseCardProps) {
  const statusColor = STATUS_COLORS[caseItem.status] ?? STATUS_COLORS.draft;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      data-testid="case-card"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">
              {caseItem.decedent_name ?? caseItem.title}
            </h3>
            {caseItem.date_of_death && (
              <p className="text-sm text-muted-foreground mt-1">
                DOD: {caseItem.date_of_death}
              </p>
            )}
            {caseItem.gross_estate != null && (
              <p className="text-sm text-muted-foreground">
                Estate: ₱{caseItem.gross_estate.toLocaleString('en-US')}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}
            data-testid="status-badge"
          >
            {caseItem.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
