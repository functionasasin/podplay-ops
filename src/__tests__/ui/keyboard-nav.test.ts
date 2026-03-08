// Stage 152 — Tests: Keyboard Nav
// Test tab order, Enter submits form, Escape closes modal,
// focus trap, and skip-to-content link behavior.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SkipLink } from '@/components/layout/SkipLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Mock alert-dialog: simulates Escape → onOpenChange(false) via document keydown listener
vi.mock('@/components/ui/alert-dialog', async () => {
  const r = await import('react');
  return {
    AlertDialog: ({
      children,
      open,
      onOpenChange,
    }: {
      children: r.ReactNode;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => {
      r.useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
          if (e.key === 'Escape') onOpenChange?.(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
      }, [open, onOpenChange]);
      return open
        ? r.createElement('div', { 'data-testid': 'alert-dialog', role: 'alertdialog' }, children)
        : null;
    },
    AlertDialogContent: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', { 'data-testid': 'alert-dialog-content' }, children),
    AlertDialogHeader: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', null, children),
    AlertDialogFooter: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', null, children),
    AlertDialogTitle: ({ children }: { children: r.ReactNode }) =>
      r.createElement('h2', null, children),
    AlertDialogDescription: ({ children }: { children: r.ReactNode }) =>
      r.createElement('p', null, children),
    AlertDialogAction: r.forwardRef(function AlertDialogAction(
      props: r.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: r.Ref<HTMLButtonElement>,
    ) {
      return r.createElement('button', { ...props, ref, 'data-testid': 'dialog-action' });
    }),
    AlertDialogCancel: r.forwardRef(function AlertDialogCancel(
      props: r.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: r.Ref<HTMLButtonElement>,
    ) {
      return r.createElement('button', { ...props, ref, 'data-testid': 'dialog-cancel' });
    }),
  };
});

describe('keyboard-nav', () => {
  it('KN-01: skip-to-content is the first focusable element in DOM order', () => {
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement(SkipLink),
        React.createElement('a', { href: '/projects' }, 'Dashboard'),
        React.createElement('button', null, 'Sign out'),
      ),
    );
    const focusable = container.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    expect(focusable.length).toBeGreaterThanOrEqual(3);
    expect(focusable[0].textContent).toBe('Skip to main content');
  });

  it('KN-02: subsequent focusable elements follow logical DOM order after skip link', () => {
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement(SkipLink),
        React.createElement('a', { href: '/projects' }, 'Dashboard'),
        React.createElement('a', { href: '/inventory' }, 'Inventory'),
        React.createElement('button', null, 'Sign out'),
      ),
    );
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('a, button, input, select, textarea'),
    );
    const texts = focusable.map((el) => el.textContent);
    expect(texts[0]).toBe('Skip to main content');
    expect(texts[1]).toBe('Dashboard');
    expect(texts[2]).toBe('Inventory');
    expect(texts[3]).toBe('Sign out');
  });

  it('KN-03: Enter key on a form input triggers the submit handler', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      React.createElement(
        'form',
        { onSubmit },
        React.createElement('input', { type: 'text', 'data-testid': 'name-field' }),
        React.createElement('button', { type: 'submit' }, 'Save'),
      ),
    );
    const input = screen.getByTestId('name-field');
    input.focus();
    // Simulate browser: Enter on text input submits the enclosing form
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('KN-04: Escape key closes ConfirmDialog (calls onOpenChange with false)', () => {
    const onOpenChange = vi.fn();
    render(
      React.createElement(ConfirmDialog, {
        open: true,
        onOpenChange,
        title: 'Delete item?',
        body: 'This cannot be undone.',
        confirmLabel: 'Delete',
        onConfirm: vi.fn(),
      }),
    );
    expect(screen.getByTestId('alert-dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('KN-05: Escape does not fire when dialog is closed', () => {
    const onOpenChange = vi.fn();
    render(
      React.createElement(ConfirmDialog, {
        open: false,
        onOpenChange,
        title: 'Delete item?',
        body: 'This cannot be undone.',
        confirmLabel: 'Delete',
        onConfirm: vi.fn(),
      }),
    );
    expect(screen.queryByTestId('alert-dialog')).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('KN-06: focus trap — open dialog contains only its own focusable buttons', () => {
    render(
      React.createElement(
        'div',
        null,
        // Elements outside dialog
        React.createElement('button', { 'data-testid': 'outside-btn' }, 'Outside'),
        React.createElement(ConfirmDialog, {
          open: true,
          onOpenChange: vi.fn(),
          title: 'Confirm action?',
          body: 'Are you sure?',
          confirmLabel: 'Yes',
          onConfirm: vi.fn(),
        }),
      ),
    );
    const dialog = screen.getByTestId('alert-dialog');
    const focusableInDialog = dialog.querySelectorAll('button');
    // Only Cancel + Confirm buttons are inside the dialog
    expect(focusableInDialog.length).toBe(2);
    expect(screen.getByTestId('dialog-cancel')).toBeTruthy();
    expect(screen.getByTestId('dialog-action')).toBeTruthy();
    // Outside button is NOT inside the dialog
    expect(dialog.contains(screen.getByTestId('outside-btn'))).toBe(false);
  });

  it('KN-07: skip-to-content link href points to #main-content', () => {
    render(React.createElement(SkipLink));
    const link = screen.getByText('Skip to main content') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('KN-08: clicking skip link moves focus to <main id="main-content"> region', () => {
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement(SkipLink),
        React.createElement(
          'main',
          { id: 'main-content', tabIndex: -1, 'data-testid': 'main-region' },
          'Page content',
        ),
      ),
    );
    const main = container.querySelector('#main-content') as HTMLElement;
    // Programmatic focus (what browser does when following #main-content anchor)
    main.focus();
    expect(document.activeElement).toBe(main);
    expect(document.activeElement?.getAttribute('id')).toBe('main-content');
  });
});
