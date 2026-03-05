import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { EngineInput, EngineOutput } from './types';
import { WizardContainer } from './components/wizard';
import { ResultsView } from './components/results/ResultsView';
import { compute } from './wasm/bridge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type AppState =
  | { phase: 'wizard' }
  | { phase: 'computing' }
  | { phase: 'results'; input: EngineInput; output: EngineOutput }
  | { phase: 'error'; message: string };

function App() {
  const [state, setState] = useState<AppState>({ phase: 'wizard' });

  const handleSubmit = async (data: EngineInput) => {
    setState({ phase: 'computing' });
    try {
      const output = await compute(data);
      setState({ phase: 'results', input: data, output });
    } catch (err: any) {
      setState({ phase: 'error', message: err.message ?? 'Computation failed' });
    }
  };

  const handleEditInput = () => {
    setState({ phase: 'wizard' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight font-serif">
            Inheritance Calculator
          </h1>
          <p className="text-xs sm:text-sm text-primary-foreground/70">Philippine Succession Law Engine</p>
        </div>
        <Separator className="bg-accent h-0.5" />
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        {state.phase === 'wizard' && (
          <WizardContainer onSubmit={handleSubmit} />
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
          />
        )}

        {state.phase === 'error' && (
          <Alert variant="destructive" className="text-center">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Computation Error</AlertTitle>
            <AlertDescription className="mb-4">{state.message}</AlertDescription>
            <Button
              variant="destructive"
              onClick={handleEditInput}
            >
              Back to Wizard
            </Button>
          </Alert>
        )}
      </main>
    </div>
  );
}

export default App;
