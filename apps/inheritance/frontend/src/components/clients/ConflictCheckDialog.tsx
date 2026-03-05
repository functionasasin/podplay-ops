import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  runConflictCheck,
  getSimilarityColor,
  type ConflictCheckResult,
  type ConflictMatch,
} from '@/lib/conflict-check';

export interface ConflictCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientTin?: string | null;
  onClear: () => void;
  onClearedAfterReview: (notes: string) => void;
}

export function ConflictCheckDialog({
  open,
  onOpenChange,
  clientName,
  clientTin,
  onClear,
  onClearedAfterReview,
}: ConflictCheckDialogProps) {
  const [result, setResult] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const canProceedAfterReview = notes.trim().length >= 5 && confirmed;

  const handleRunCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const checkResult = await runConflictCheck(
        clientName,
        clientTin || undefined,
      );
      setResult(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conflict check failed');
    } finally {
      setLoading(false);
    }
  }, [clientName, clientTin]);

  // Auto-run check when dialog opens
  useEffect(() => {
    if (open && clientName.length >= 2) {
      handleRunCheck();
    }
  }, [open, clientName, handleRunCheck]);

  const handleClear = useCallback(() => {
    onClear();
    onOpenChange(false);
  }, [onClear, onOpenChange]);

  const handleProceedAfterReview = useCallback(() => {
    if (canProceedAfterReview) {
      onClearedAfterReview(notes.trim());
      onOpenChange(false);
    }
  }, [canProceedAfterReview, notes, onClearedAfterReview, onOpenChange]);

  const allMatches: ConflictMatch[] = result
    ? [...result.client_matches, ...result.heir_matches, ...result.tin_matches]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="conflict-check-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Re-run Conflict Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Checking &quot;{clientName}&quot;
            {clientTin ? ` (TIN: ${clientTin})` : ''} for conflicts.
          </p>

          {loading && (
            <p data-testid="conflict-dialog-loading" className="text-sm text-muted-foreground">
              Running conflict check...
            </p>
          )}

          {error && (
            <p data-testid="conflict-dialog-error" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {result && result.outcome === 'clear' && (
            <div data-testid="conflict-dialog-clear" className="p-3 bg-green-50 rounded border border-green-300">
              <p className="font-semibold text-green-600">✓ CLEAR</p>
              <p className="text-sm text-muted-foreground">No conflicts found.</p>
              <Button
                data-testid="conflict-dialog-clear-btn"
                className="mt-2"
                size="sm"
                onClick={handleClear}
              >
                Confirm Clear
              </Button>
            </div>
          )}

          {result && result.outcome === 'flagged' && (
            <div data-testid="conflict-dialog-flagged" className="space-y-3">
              <div className="p-3 bg-amber-50 rounded border border-amber-300">
                <p className="font-semibold text-amber-600">
                  ⚠ FLAGGED — {result.total_matches} match
                  {result.total_matches !== 1 ? 'es' : ''}
                </p>
              </div>

              <div className="space-y-2">
                {allMatches.map((match, i) => {
                  const { label, className } = getSimilarityColor(match.similarity_score);
                  const matchName = match.match_type === 'heir' ? match.heir_name : match.full_name;

                  return (
                    <div
                      key={`${match.match_type}-${match.id || match.case_id}-${i}`}
                      data-testid={`dialog-match-${i}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Badge variant="outline" className={className}>
                        {match.similarity_score.toFixed(2)} {label}
                      </Badge>
                      <span>{matchName}</span>
                    </div>
                  );
                })}
              </div>

              <div>
                <Label htmlFor="dialog-conflict-notes">Notes required</Label>
                <Textarea
                  id="dialog-conflict-notes"
                  data-testid="dialog-conflict-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Min 5 characters"
                  rows={2}
                />
              </div>

              <label className="flex items-center gap-2" data-testid="dialog-confirm-label">
                <input
                  type="checkbox"
                  data-testid="dialog-confirm-checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span className="text-sm">
                  I have reviewed the matches and confirmed no conflict of interest
                </span>
              </label>

              <Button
                data-testid="dialog-proceed-btn"
                disabled={!canProceedAfterReview}
                size="sm"
                onClick={handleProceedAfterReview}
              >
                Proceed After Review
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
