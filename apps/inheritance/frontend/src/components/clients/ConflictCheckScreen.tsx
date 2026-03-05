import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  runConflictCheck,
  getSimilarityColor,
  type ConflictCheckResult,
  type ConflictMatch,
} from '@/lib/conflict-check';

export interface ConflictCheckScreenProps {
  onClear: (name: string, tin?: string) => void;
  onClearedAfterReview: (name: string, notes: string, tin?: string) => void;
  onSkip: (name: string, tin?: string) => void;
}

export function ConflictCheckScreen({
  onClear,
  onClearedAfterReview,
  onSkip,
}: ConflictCheckScreenProps) {
  const [name, setName] = useState('');
  const [tin, setTin] = useState('');
  const [result, setResult] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const canRunCheck = name.trim().length >= 2;
  const canProceedAfterReview = notes.trim().length >= 5 && confirmed;

  const handleRunCheck = useCallback(async () => {
    if (!canRunCheck) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const checkResult = await runConflictCheck(name.trim(), tin.trim() || undefined);
      setResult(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conflict check failed');
    } finally {
      setLoading(false);
    }
  }, [name, tin, canRunCheck]);

  const handleContinue = useCallback(() => {
    if (result?.outcome === 'clear') {
      onClear(name.trim(), tin.trim() || undefined);
    }
  }, [result, name, tin, onClear]);

  const handleProceedAfterReview = useCallback(() => {
    if (canProceedAfterReview) {
      onClearedAfterReview(name.trim(), notes.trim(), tin.trim() || undefined);
    }
  }, [canProceedAfterReview, name, tin, notes, onClearedAfterReview]);

  const handleSkip = useCallback(() => {
    onSkip(name.trim(), tin.trim() || undefined);
  }, [name, tin, onSkip]);

  const allMatches: ConflictMatch[] = result
    ? [...result.client_matches, ...result.heir_matches, ...result.tin_matches]
    : [];

  return (
    <div data-testid="conflict-check-screen" className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          New Client — Step 1 of 2: Conflict Check
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Screen for conflicts of interest before accepting this matter.
          Required under Canon III §14 of the 2023 CPRA.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="conflict-name">Prospective client name *</Label>
          <Input
            id="conflict-name"
            data-testid="conflict-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name as it will appear on government ID"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter name as it will appear on government ID
          </p>
        </div>

        <div>
          <Label htmlFor="conflict-tin">TIN (optional — enables exact-match check)</Label>
          <Input
            id="conflict-tin"
            data-testid="conflict-tin-input"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder="XXX-XXX-XXX"
          />
        </div>

        <Button
          data-testid="run-conflict-check-btn"
          onClick={handleRunCheck}
          disabled={!canRunCheck || loading}
        >
          {loading ? 'Checking...' : 'Run Conflict Check'}
        </Button>
      </div>

      {error && (
        <div data-testid="conflict-error" className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {result && result.outcome === 'clear' && (
        <Card data-testid="conflict-clear-result" className="p-4 border-green-300 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-semibold">✓ CLEAR</span>
            <span>— No conflicts found for &quot;{result.checked_name}&quot;</span>
          </div>
          <p className="text-sm text-muted-foreground">
            No existing clients or case heirs match this name.
          </p>
          <Button
            data-testid="continue-to-details-btn"
            className="mt-3"
            onClick={handleContinue}
          >
            Continue to Client Details →
          </Button>
        </Card>
      )}

      {result && result.outcome === 'flagged' && (
        <Card data-testid="conflict-flagged-result" className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600 font-semibold">⚠ FLAGGED</span>
            <span>
              — {result.total_matches} potential match
              {result.total_matches !== 1 ? 'es' : ''} found for &quot;{result.checked_name}&quot;
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {allMatches.map((match, i) => {
              const { label, className } = getSimilarityColor(match.similarity_score);
              const matchName = match.match_type === 'heir' ? match.heir_name : match.full_name;
              const matchContext =
                match.match_type === 'client'
                  ? 'existing client'
                  : match.match_type === 'heir'
                    ? `heir in ${match.case_title || 'a case'}`
                    : 'TIN match';

              return (
                <div
                  key={`${match.match_type}-${match.id || match.case_id}-${i}`}
                  data-testid={`conflict-match-${i}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={className}
                    data-testid={`similarity-badge-${i}`}
                  >
                    {match.similarity_score.toFixed(2)} {label}
                  </Badge>
                  <span>
                    {matchName} — {matchContext}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="conflict-notes">Notes required before proceeding</Label>
              <Textarea
                id="conflict-notes"
                data-testid="conflict-notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why there is no conflict of interest (min 5 characters)"
                rows={3}
              />
              {notes.trim().length > 0 && notes.trim().length < 5 && (
                <p className="text-xs text-red-500 mt-1">
                  Notes must be at least 5 characters
                </p>
              )}
            </div>

            <label className="flex items-center gap-2" data-testid="conflict-confirm-label">
              <input
                type="checkbox"
                data-testid="conflict-confirm-checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span className="text-sm">
                I have reviewed the matches and confirmed no conflict of interest
              </span>
            </label>

            <Button
              data-testid="proceed-after-review-btn"
              disabled={!canProceedAfterReview}
              onClick={handleProceedAfterReview}
            >
              Proceed After Review
            </Button>
          </div>
        </Card>
      )}

      <div className="pt-2 border-t">
        <Button
          variant="ghost"
          data-testid="skip-conflict-check-btn"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          Skip — Create Client Without Check
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Skipping marks this client as conflict not cleared.
        </p>
      </div>
    </div>
  );
}
