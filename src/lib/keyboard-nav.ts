// Focus first focusable element in a container
export function focusFirst(container: HTMLElement): void {
  const selector =
    'input, select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const first = container.querySelector<HTMLElement>(selector);
  first?.focus();
}

// Move focus to main content area after navigation
export function focusMainContent(): void {
  const main = document.getElementById('main-content');
  if (main) main.focus();
}

// Handle row keyboard navigation (dashboard table)
export function handleRowKeyDown(
  e: React.KeyboardEvent<HTMLTableRowElement>,
  onActivate: () => void
): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    onActivate();
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
    next?.focus();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
    prev?.focus();
  }
}
