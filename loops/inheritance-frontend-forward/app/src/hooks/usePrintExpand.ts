import type { RefObject } from 'react';

/**
 * Hook that expands all accordion refs on beforeprint and collapses them on afterprint.
 * Used to ensure all content is visible when printing via Ctrl+P / Cmd+P.
 */
export function usePrintExpand(_accordionRefs: RefObject<HTMLElement | null>[]): void {
  // Stub — implementation in next iteration
}
