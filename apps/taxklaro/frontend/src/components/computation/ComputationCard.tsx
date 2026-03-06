import { useNavigate } from '@tanstack/react-router';
import { MoreHorizontal, Trash2, Archive } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { ComputationListItem, ComputationStatus } from '../../types/org';

interface ComputationCardProps {
  computation: ComputationListItem;
  onDelete?: (id: string) => void;
  onArchive?: (id: string, currentStatus: ComputationStatus) => void;
}

const STATUS_VARIANT: Record<ComputationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  computed: 'default',
  finalized: 'outline',
  archived: 'destructive',
};

const STATUS_LABEL: Record<ComputationStatus, string> = {
  draft: 'Draft',
  computed: 'Computed',
  finalized: 'Finalized',
  archived: 'Archived',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ComputationCard({ computation, onDelete, onArchive }: ComputationCardProps) {
  const navigate = useNavigate();

  function handleCardClick() {
    navigate({ to: '/computations/$compId', params: { compId: computation.id } });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(computation.id);
  }

  function handleArchive(e: React.MouseEvent) {
    e.stopPropagation();
    onArchive?.(computation.id, computation.status);
  }

  return (
    <div
      className="rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow p-5 space-y-3 cursor-pointer"
      onClick={handleCardClick}
      data-testid="computation-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base leading-snug line-clamp-2 flex-1">{computation.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={STATUS_VARIANT[computation.status]}>
            {STATUS_LABEL[computation.status]}
          </Badge>
          {computation.status !== 'archived' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <p className="text-[0.8125rem] text-muted-foreground">Tax Year {computation.taxYear}</p>
      <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
        {computation.regimeSelected && (
          <span className="font-medium text-foreground">{computation.regimeSelected}</span>
        )}
        <span>Modified {formatDate(computation.updatedAt)}</span>
      </div>
    </div>
  );
}
