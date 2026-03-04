import { useEffect, type RefObject } from 'react';

/**
 * Hook that expands all accordion refs on beforeprint and collapses them on afterprint.
 * Used to ensure all content is visible when printing via Ctrl+P / Cmd+P.
 */
export function usePrintExpand(accordionRefs: RefObject<HTMLElement | null>[]): void {
  useEffect(() => {
    const expand = () =>
      accordionRefs.forEach((ref) =>
        ref.current?.setAttribute('data-state', 'open'),
      );
    const collapse = () =>
      accordionRefs.forEach((ref) =>
        ref.current?.setAttribute('data-state', 'closed'),
      );

    window.addEventListener('beforeprint', expand);
    window.addEventListener('afterprint', collapse);

    return () => {
      window.removeEventListener('beforeprint', expand);
      window.removeEventListener('afterprint', collapse);
    };
  }, []);
}
