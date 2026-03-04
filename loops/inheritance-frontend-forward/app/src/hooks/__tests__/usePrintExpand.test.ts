import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { usePrintExpand } from '../usePrintExpand';

// --------------------------------------------------------------------------
// Tests — usePrintExpand hook
// --------------------------------------------------------------------------

describe('print > usePrintExpand hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('expands all accordion refs on beforeprint event', () => {
    const ref1 = createRef<HTMLElement>();
    const ref2 = createRef<HTMLElement>();

    // Create real DOM elements to act as accordion targets
    const el1 = document.createElement('div');
    el1.setAttribute('data-state', 'closed');
    const el2 = document.createElement('div');
    el2.setAttribute('data-state', 'closed');

    // Assign elements to refs using Object.defineProperty (refs are readonly)
    Object.defineProperty(ref1, 'current', { value: el1, writable: true });
    Object.defineProperty(ref2, 'current', { value: el2, writable: true });

    renderHook(() => usePrintExpand([ref1, ref2]));

    // Dispatch beforeprint event
    window.dispatchEvent(new Event('beforeprint'));

    expect(el1.getAttribute('data-state')).toBe('open');
    expect(el2.getAttribute('data-state')).toBe('open');
  });

  it('collapses all accordion refs on afterprint event', () => {
    const ref1 = createRef<HTMLElement>();
    const ref2 = createRef<HTMLElement>();

    const el1 = document.createElement('div');
    el1.setAttribute('data-state', 'open');
    const el2 = document.createElement('div');
    el2.setAttribute('data-state', 'open');

    Object.defineProperty(ref1, 'current', { value: el1, writable: true });
    Object.defineProperty(ref2, 'current', { value: el2, writable: true });

    renderHook(() => usePrintExpand([ref1, ref2]));

    // Dispatch afterprint event
    window.dispatchEvent(new Event('afterprint'));

    expect(el1.getAttribute('data-state')).toBe('closed');
    expect(el2.getAttribute('data-state')).toBe('closed');
  });

  it('cleans up event listeners on unmount', () => {
    const ref1 = createRef<HTMLElement>();
    const el1 = document.createElement('div');
    el1.setAttribute('data-state', 'closed');
    Object.defineProperty(ref1, 'current', { value: el1, writable: true });

    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePrintExpand([ref1]));

    // Should have added both event listeners
    expect(addSpy).toHaveBeenCalledWith('beforeprint', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('afterprint', expect.any(Function));

    unmount();

    // Should have removed both event listeners
    expect(removeSpy).toHaveBeenCalledWith('beforeprint', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('afterprint', expect.any(Function));
  });

  it('handles null refs gracefully without throwing', () => {
    const ref1 = createRef<HTMLElement>();
    // ref1.current is null by default

    renderHook(() => usePrintExpand([ref1]));

    // Should not throw when dispatching events with null refs
    expect(() => {
      window.dispatchEvent(new Event('beforeprint'));
    }).not.toThrow();

    expect(() => {
      window.dispatchEvent(new Event('afterprint'));
    }).not.toThrow();
  });

  it('expands then collapses in sequence (full print cycle)', () => {
    const ref1 = createRef<HTMLElement>();
    const el1 = document.createElement('div');
    el1.setAttribute('data-state', 'closed');
    Object.defineProperty(ref1, 'current', { value: el1, writable: true });

    renderHook(() => usePrintExpand([ref1]));

    // Start: closed
    expect(el1.getAttribute('data-state')).toBe('closed');

    // Print starts: should expand
    window.dispatchEvent(new Event('beforeprint'));
    expect(el1.getAttribute('data-state')).toBe('open');

    // Print ends: should collapse
    window.dispatchEvent(new Event('afterprint'));
    expect(el1.getAttribute('data-state')).toBe('closed');
  });
});
