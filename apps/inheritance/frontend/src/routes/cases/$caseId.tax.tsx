import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { loadCase, updateCaseTaxInput } from '@/lib/cases';
import { EstateTaxWizard } from '@/components/tax/EstateTaxWizard';
import {
  createDefaultEstateTaxState,
  type EstateTaxWizardState,
} from '@/types/estate-tax';
import type { AutoSaveStatus } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const caseTaxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases/$caseId/tax',
  beforeLoad: ({ context }) => {
    const ctx = context as { auth?: { user: unknown } | undefined };
    if (!ctx.auth?.user) throw redirect({ to: '/auth', search: { mode: 'signin' as const, redirect: '/cases' } });
  },
  component: CaseTaxPage,
});

function CaseTaxPage() {
  const { caseId } = caseTaxRoute.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decedentName, setDecedentName] = useState('');
  const [taxState, setTaxState] = useState<EstateTaxWizardState>(createDefaultEstateTaxState());
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    async function fetchCase() {
      try {
        const row = await loadCase(caseId);
        if (cancelled) return;
        setDecedentName(row.decedent_name ?? 'Decedent');
        if (row.tax_input_json) {
          setTaxState(row.tax_input_json as EstateTaxWizardState);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load case');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCase();
    return () => { cancelled = true; };
  }, [caseId]);

  const handleChange = useCallback(async (state: EstateTaxWizardState) => {
    setTaxState(state);
    setAutoSaveStatus('saving');
    try {
      await updateCaseTaxInput(caseId, state as object);
      setAutoSaveStatus('saved');
    } catch {
      setAutoSaveStatus('error');
    }
  }, [caseId]);

  const handleBack = useCallback(() => {
    navigate({ to: '/cases/$caseId', params: { caseId } });
  }, [caseId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <EstateTaxWizard
        state={taxState}
        onChange={handleChange}
        autoSaveStatus={autoSaveStatus}
        decedentName={decedentName}
        onBack={handleBack}
      />
    </div>
  );
}
