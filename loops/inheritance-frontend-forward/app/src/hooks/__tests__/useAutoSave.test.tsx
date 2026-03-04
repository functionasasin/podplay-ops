import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { EngineInput } from '@/types';

const mockUpdateCaseInput = vi.fn();

vi.mock('@/lib/cases', () => ({
  updateCaseInput: (...args: unknown[]) => mockUpdateCaseInput(...args),
}));

import { useAutoSave } from '../useAutoSave';

const baseInput: EngineInput = {
  net_distributable_estate: { centavos: 1000000 },
  decedent: {
    id: 'p1',
    name: 'Juan dela Cruz',
    date_of_death: '2024-03-15',
    is_married: true,
    date_of_marriage: '1990-01-01',
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 34,
    has_legal_separation: false,
    is_illegitimate: false,
  },
  family_tree: [],
  will: null,
  donations: [],
  config: { retroactive_ra_11642: false, max_pipeline_restarts: 5 },
};

describe('useAutoSave hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useAutoSave('case-1', baseInput));
    expect(result.current.status).toBe('idle');
  });

  it('does not save when caseId is null', () => {
    const modifiedInput = { ...baseInput, net_distributable_estate: { centavos: 2000000 } };
    const { result, rerender } = renderHook(
      ({ caseId, input }) => useAutoSave(caseId, input),
      { initialProps: { caseId: null as string | null, input: baseInput } },
    );

    rerender({ caseId: null, input: modifiedInput });
    vi.advanceTimersByTime(2000);

    expect(mockUpdateCaseInput).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('debounces save by 1500ms after input change', async () => {
    mockUpdateCaseInput.mockResolvedValue(undefined);

    const modifiedInput = { ...baseInput, net_distributable_estate: { centavos: 2000000 } };
    const { rerender } = renderHook(
      ({ caseId, input }) => useAutoSave(caseId, input),
      { initialProps: { caseId: 'case-1', input: baseInput } },
    );

    // Change input
    rerender({ caseId: 'case-1', input: modifiedInput });

    // Not saved yet at 1400ms
    vi.advanceTimersByTime(1400);
    expect(mockUpdateCaseInput).not.toHaveBeenCalled();

    // Saved at 1500ms
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockUpdateCaseInput).toHaveBeenCalledWith('case-1', modifiedInput);
  });

  it('shows saving status during save', async () => {
    let resolveUpdate: () => void;
    mockUpdateCaseInput.mockImplementation(
      () => new Promise<void>((resolve) => { resolveUpdate = resolve; }),
    );

    const modifiedInput = { ...baseInput, net_distributable_estate: { centavos: 3000000 } };
    const { result, rerender } = renderHook(
      ({ caseId, input }) => useAutoSave(caseId, input),
      { initialProps: { caseId: 'case-1', input: baseInput } },
    );

    rerender({ caseId: 'case-1', input: modifiedInput });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.status).toBe('saving');

    await act(async () => {
      resolveUpdate!();
    });

    expect(result.current.status).toBe('saved');
  });

  it('shows error status when save fails', async () => {
    mockUpdateCaseInput.mockRejectedValue(new Error('Network error'));

    const modifiedInput = { ...baseInput, net_distributable_estate: { centavos: 4000000 } };
    const { result, rerender } = renderHook(
      ({ caseId, input }) => useAutoSave(caseId, input),
      { initialProps: { caseId: 'case-1', input: baseInput } },
    );

    rerender({ caseId: 'case-1', input: modifiedInput });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.status).toBe('error');
  });

  it('exposes manual save function', () => {
    const { result } = renderHook(() => useAutoSave('case-1', baseInput));
    expect(typeof result.current.save).toBe('function');
  });

  it('cancels pending save on unmount', () => {
    const modifiedInput = { ...baseInput, net_distributable_estate: { centavos: 5000000 } };
    const { rerender, unmount } = renderHook(
      ({ caseId, input }) => useAutoSave(caseId, input),
      { initialProps: { caseId: 'case-1', input: baseInput } },
    );

    rerender({ caseId: 'case-1', input: modifiedInput });
    unmount();
    vi.advanceTimersByTime(2000);

    expect(mockUpdateCaseInput).not.toHaveBeenCalled();
  });
});
