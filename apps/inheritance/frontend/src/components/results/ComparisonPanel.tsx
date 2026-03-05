/**
 * ComparisonPanel — Side-by-side testate vs intestate comparison (spec §4.8).
 *
 * Only shown when the current case is testate (input.will !== null).
 * Runs the WASM engine on an intestate alternative and displays per-heir deltas.
 */
import { useState, useCallback } from 'react';
import type { EngineInput, EngineOutput } from '@/types';
import { formatPeso } from '@/types';
import {
  computeComparison,
  saveComparisonResults,
  buildAlternativeInput,
} from '@/lib/comparison';
import type { ComparisonState, ComparisonDiffEntry } from '@/lib/comparison';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export interface ComparisonPanelProps {
  input: EngineInput;
  output: EngineOutput;
  caseId?: string;
}

function getDeltaColorClass(delta: bigint): string {
  if (delta > BigInt(0)) return 'text-emerald-600';
  if (delta < BigInt(0)) return 'text-red-600';
  return 'text-muted-foreground';
}

function formatDelta(centavos: bigint): string {
  if (centavos > BigInt(0)) return `+${formatPeso(centavos.toString())}`;
  if (centavos < BigInt(0)) return `-${formatPeso((-centavos).toString())}`;
  return formatPeso('0');
}

function formatDeltaPct(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}%`;
  if (pct < 0) return `${pct.toFixed(1)}%`;
  return '0%';
}

export function ComparisonPanel({ input, output, caseId }: ComparisonPanelProps) {
  const [state, setState] = useState<ComparisonState>('idle');
  const [diffs, setDiffs] = useState<ComparisonDiffEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const isTestate = input.will !== null;

  const handleCompare = useCallback(async () => {
    setState('loading');
    try {
      const result = await computeComparison(input, output);
      setDiffs(result.diffs);
      setState('ready');

      if (caseId) {
        const alternativeInput = buildAlternativeInput(input);
        await saveComparisonResults(caseId, alternativeInput, result.alternativeOutput);
      }
    } catch {
      setState('error');
    }
  }, [input, output, caseId]);

  if (!isTestate) {
    return null;
  }

  if (state === 'idle') {
    return (
      <div className="mt-4">
        <Button onClick={handleCompare}>
          Compare Scenarios
        </Button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="mt-4">
        <p className="text-muted-foreground">Computing comparison...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-4">
        <p className="text-red-600">Error computing comparison. Please try again.</p>
        <Button variant="outline" onClick={handleCompare} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Testate vs Intestate Comparison</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand comparison' : 'Collapse comparison'}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>

      {!collapsed && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Heir</TableHead>
              <TableHead className="text-right">Current (Testate)</TableHead>
              <TableHead className="text-right">Alternative (Intestate)</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diffs.map((diff) => {
              const colorClass = getDeltaColorClass(diff.delta_centavos);
              return (
                <TableRow key={diff.heir_id}>
                  <TableCell>{diff.heir_name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPeso(diff.current_centavos.toString())}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPeso(diff.alternative_centavos.toString())}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${colorClass}`}>
                    {formatDelta(diff.delta_centavos)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${colorClass}`}>
                    {formatDeltaPct(diff.delta_pct)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
