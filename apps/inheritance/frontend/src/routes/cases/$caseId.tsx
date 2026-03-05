import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { EngineInput, EngineOutput, CaseRow } from '@/types';
import { loadCase, updateCaseInput, updateCaseOutput } from '@/lib/cases';
import { ResultsView } from '@/components/results/ResultsView';
import { WizardContainer } from '@/components/wizard';
import { compute } from '@/wasm/bridge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAutoSave } from '@/hooks/useAutoSave';

export const caseIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases/$caseId',
  component: CaseEditorPage,
});

type PageState =
  | { phase: 'loading' }
  | { phase: 'wizard'; input: EngineInput | null }
  | { phase: 'computing'; input: EngineInput }
  | { phase: 'results'; input: EngineInput; output: EngineOutput }
  | { phase: 'error'; message: string };

function CaseEditorPage() {
  const { caseId } = caseIdRoute.useParams();
  const [state, setState] = useState<PageState>({ phase: 'loading' });
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCase() {
      try {
        const row = await loadCase(caseId);
        if (cancelled) return;
        setCaseRow(row);

        if (row.output_json) {
          setState({
            phase: 'results',
            input: row.input_json as EngineInput,
            output: row.output_json as EngineOutput,
          });
        } else if (row.input_json) {
          setState({ phase: 'wizard', input: row.input_json as EngineInput });
        } else {
          setState({ phase: 'wizard', input: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            phase: 'error',
            message: err instanceof Error ? err.message : 'Failed to load case',
          });
        }
      }
    }

    fetchCase();
    return () => { cancelled = true; };
  }, [caseId]);

  const handleSubmit = async (data: EngineInput) => {
    setState({ phase: 'computing', input: data });
    try {
      await updateCaseInput(caseId, data);
      const output = await compute(data);
      await updateCaseOutput(caseId, output);
      setState({ phase: 'results', input: data, output });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Computation failed';
      setState({ phase: 'error', message });
    }
  };

  const handleEditInput = () => {
    const input = state.phase === 'results' ? state.input : null;
    setState({ phase: 'wizard', input });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {state.phase === 'loading' && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {state.phase === 'wizard' && (
        <WizardContainer onSubmit={handleSubmit} defaultInput={state.input ?? undefined} />
      )}

      {state.phase === 'computing' && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Computing distribution...</p>
          </div>
        </div>
      )}

      {state.phase === 'results' && (
        <ResultsView
          input={state.input}
          output={state.output}
          onEditInput={handleEditInput}
          caseId={caseId}
        />
      )}

      {state.phase === 'error' && (
        <Alert variant="destructive" className="text-center">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mb-4">
            {state.message}
          </AlertDescription>
          <Button variant="destructive" onClick={handleEditInput}>
            Back to Editor
          </Button>
        </Alert>
      )}
    </div>
  );
}
