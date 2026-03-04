/**
 * ConflictCheckStep — Step 1: Conflict Check gate (§4.18 + §4.17)
 *
 * Wraps the existing ConflictCheckScreen component as the first gate
 * in the guided intake form. The user must run a conflict check before
 * proceeding to client details.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ConflictCheckStepState } from '@/types/intake';
import {
  runConflictCheck,
  getSimilarityColor,
  type ConflictCheckResult,
  type ConflictMatch,
} from '@/lib/conflict-check';

export interface ConflictCheckStepProps {
  state: ConflictCheckStepState;
  onStateChange: (state: ConflictCheckStepState) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function ConflictCheckStep({
  state,
  onStateChange,
  onNext,
  onSkip,
}: ConflictCheckStepProps) {
  const [name, setName] = useState(state.checkedName);
  const [tin, setTin] = useState(state.checkedTin ?? '');
  const [result, setResult] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(state.notes);
  const [confirmed, setConfirmed] = useState(false);

  const canRunCheck = name.trim().length >= 2;
  const canProceedAfterReview = notes.trim().length >= 5 && confirmed;

  const handleRunCheck = useCallback(async () => {
    if (!canRunCheck) return;
    setLoading(true);
    setError(null);
    try {
      const checkResult = await runConflictCheck(name.trim(), tin.trim() || undefined);
      setResult(checkResult);
      if (checkResult.outcome === 'clear') {
        onStateChange({
          ...state,
          outcome: 'clear',
          checkedName: name.trim(),
          checkedTin: tin.trim() || null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conflict check failed');
    } finally {
      setLoading(false);
    }
  }, [canRunCheck, name, tin, state, onStateChange]);

  const handleClearProceed = () => {
    onNext();
  };

  const handleClearedAfterReview = () => {
    onStateChange({
      ...state,
      outcome: 'cleared_after_review',
      checkedName: name.trim(),
      checkedTin: tin.trim() || null,
      notes,
    });
    onNext();
  };

  return (
    <div data-testid="conflict-check-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 1: Conflict Check</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Check for potential conflicts before proceeding with the intake.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="conflict-name">Client Name *</Label>
          <Input
            id="conflict-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter client's full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conflict-tin">TIN (optional)</Label>
          <Input
            id="conflict-tin"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder="e.g. 123-456-789"
          />
        </div>

        <Button
          onClick={handleRunCheck}
          disabled={!canRunCheck || loading}
        >
          {loading ? 'Checking...' : 'Run Conflict Check'}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <Card className="p-4 space-y-4">
          {result.outcome === 'clear' ? (
            <div className="space-y-3">
              <Badge className="bg-green-100 text-green-800">CLEAR</Badge>
              <p className="text-sm">No conflicts found for "{name.trim()}".</p>
              <Button onClick={handleClearProceed}>
                Next: Client Details →
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Badge className="bg-amber-100 text-amber-800">FLAGGED</Badge>
              <p className="text-sm font-medium">
                Potential conflicts found ({result.total_matches} match
                {result.total_matches !== 1 ? 'es' : ''})
              </p>
              {[...result.client_matches, ...result.heir_matches, ...result.tin_matches].map(
                (match: ConflictMatch, i: number) => {
                  const colorInfo = getSimilarityColor(match.similarity_score);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm border rounded p-2"
                    >
                      <Badge variant="outline" className={colorInfo.className}>
                        {(match.similarity_score * 100).toFixed(0)}% — {colorInfo.label}
                      </Badge>
                      <span>{match.full_name ?? match.heir_name ?? 'Unknown'}</span>
                      <span className="text-muted-foreground">
                        ({match.match_type})
                      </span>
                    </div>
                  );
                },
              )}

              <div className="space-y-2">
                <Label htmlFor="conflict-notes">
                  Notes (required, min 5 characters)
                </Label>
                <Textarea
                  id="conflict-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this is not a conflict..."
                  rows={3}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                I have reviewed the matches and confirm there is no conflict
              </label>

              <div className="flex gap-2">
                <Button
                  onClick={handleClearedAfterReview}
                  disabled={!canProceedAfterReview}
                >
                  Proceed After Review
                </Button>
                <Button variant="outline" onClick={onSkip}>
                  Skip
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Skip option when no check has been run */}
      {!result && !loading && (
        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip conflict check
          </Button>
        </div>
      )}
    </div>
  );
}
