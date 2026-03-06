import { useState, useEffect, useRef } from 'react';
import type { TaxpayerInput } from '@/types/engine-input';
import type { AutoSaveStatus } from '@/types/wizard';
import { updateComputationInput } from '@/lib/computations';

/**
 * Auto-saves TaxpayerInput to the computations table with 1500ms debounce.
 */
export function useAutoSave(computationId: string, input: TaxpayerInput) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      const { error } = await updateComputationInput(computationId, input);
      setStatus(error ? 'error' : 'saved');
      if (!error) {
        idleTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
      }
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status };
}
