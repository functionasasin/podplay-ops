import { useState, useEffect, useRef, useCallback } from 'react';
import type { EngineInput, AutoSaveStatus } from '@/types';
import { updateCaseInput } from '@/lib/cases';

const DEBOUNCE_MS = 1500;

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  save: () => void;
}

export function useAutoSave(
  caseId: string | null,
  input: EngineInput,
): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInputRef = useRef<EngineInput>(input);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const doSave = useCallback(async () => {
    if (!caseId) return;
    setStatus('saving');
    try {
      await updateCaseInput(caseId, input);
      if (mountedRef.current) setStatus('saved');
    } catch {
      if (mountedRef.current) setStatus('error');
    }
  }, [caseId, input]);

  useEffect(() => {
    if (!caseId) return;
    if (prevInputRef.current === input) return;
    prevInputRef.current = input;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [caseId, input, doSave]);

  return { status, save: doSave };
}
