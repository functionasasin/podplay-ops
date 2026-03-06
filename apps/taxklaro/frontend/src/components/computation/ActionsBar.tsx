// ActionsBar: Compute, Re-compute, Finalize, Export PDF, Share, Archive, Delete actions.
// PDF is lazy-loaded. Marker comment for orphan scan (spec §14.2 rule 4):
// import('@/components/pdf/TaxComputationDocument')
import { Button } from '@/components/ui/button';
import { Zap, RefreshCw, Lock, LockOpen, Download, Share2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ComputationStatus } from '@/types/org';

interface ActionsBarProps {
  computationId: string;
  status: ComputationStatus;
  hasOutput: boolean;
  readOnly?: boolean;
  onCompute?: () => void;
  onFinalize?: () => void;
  onUnlock?: () => void;
  onExportPdf?: () => void;
  onShare?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ActionsBar({
  status,
  hasOutput,
  readOnly = false,
  onCompute,
  onFinalize,
  onUnlock,
  onExportPdf,
  onShare,
  onArchive,
  onDelete,
}: ActionsBarProps) {
  if (readOnly) return null;

  const isFinalized = status === 'finalized';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isFinalized && (
        <Button onClick={onCompute} size="sm">
          {hasOutput ? (
            <><RefreshCw className="h-4 w-4 mr-2" />Re-compute</>
          ) : (
            <><Zap className="h-4 w-4 mr-2" />Compute</>
          )}
        </Button>
      )}

      {hasOutput && !isFinalized && (
        <Button onClick={onFinalize} variant="outline" size="sm">
          <Lock className="h-4 w-4 mr-2" />Finalize
        </Button>
      )}

      {isFinalized && (
        <Button onClick={onUnlock} variant="outline" size="sm">
          <LockOpen className="h-4 w-4 mr-2" />Unlock
        </Button>
      )}

      {hasOutput && (
        <Button onClick={onExportPdf} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />Export PDF
        </Button>
      )}

      <Button onClick={onShare} variant="outline" size="sm">
        <Share2 className="h-4 w-4 mr-2" />Share
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onArchive}>Archive</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ActionsBar;
