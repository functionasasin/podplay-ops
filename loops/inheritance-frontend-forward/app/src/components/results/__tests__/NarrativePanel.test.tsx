import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NarrativePanel } from '../NarrativePanel';
import type { HeirNarrative } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createNarrative(overrides: Partial<HeirNarrative> = {}): HeirNarrative {
  return {
    heir_id: 'lc1',
    heir_name: 'Juan Cruz',
    heir_category_label: 'legitimate child',
    text: '**Juan Cruz (Legitimate Child)** receives **₱2,500,000**. As a legitimate child, Juan Cruz is entitled to a share of the estate.',
    ...overrides,
  };
}

function renderPanel(overrides: {
  narratives?: HeirNarrative[];
  decedentName?: string;
  dateOfDeath?: string;
} = {}) {
  return render(
    <NarrativePanel
      narratives={overrides.narratives ?? [createNarrative()]}
      decedentName={overrides.decedentName ?? 'Test Decedent'}
      dateOfDeath={overrides.dateOfDeath ?? '2026-01-15'}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — NarrativePanel (results)
// --------------------------------------------------------------------------

describe('results > NarrativePanel', () => {
  describe('rendering', () => {
    it('renders the narrative panel container', () => {
      renderPanel();
      expect(screen.getByTestId('narrative-panel')).toBeInTheDocument();
    });

    it('renders "Heir Narratives" heading', () => {
      renderPanel();
      expect(screen.getByText(/Heir Narratives/i)).toBeInTheDocument();
    });
  });

  describe('narrative items', () => {
    it('renders one item per narrative', () => {
      renderPanel({
        narratives: [
          createNarrative({ heir_id: 'lc1', heir_name: 'Juan Cruz' }),
          createNarrative({ heir_id: 'sp', heir_name: 'Maria Cruz', heir_category_label: 'surviving spouse' }),
          createNarrative({ heir_id: 'lc2', heir_name: 'Ana Cruz' }),
        ],
      });
      expect(screen.getByText('Juan Cruz')).toBeInTheDocument();
      expect(screen.getByText('Maria Cruz')).toBeInTheDocument();
      expect(screen.getByText('Ana Cruz')).toBeInTheDocument();
    });

    it('shows heir_category_label in header', () => {
      renderPanel({
        narratives: [
          createNarrative({ heir_category_label: 'legitimate child' }),
        ],
      });
      // Scope to the narrative item header button to avoid matching narrative body text
      const header = screen.getByRole('button', { name: /Juan Cruz/i });
      expect(within(header).getByText(/legitimate child/i)).toBeInTheDocument();
    });
  });

  describe('expand/collapse behavior', () => {
    it('first narrative item is expanded by default', () => {
      renderPanel({
        narratives: [
          createNarrative({ heir_id: 'lc1', heir_name: 'Juan Cruz', text: '**Juan Cruz** receives **₱2,500,000**.' }),
          createNarrative({ heir_id: 'sp', heir_name: 'Maria Cruz', text: '**Maria Cruz** receives **₱2,500,000**.' }),
        ],
      });
      // First narrative text should be visible — text is split across <strong> elements
      // so use a function matcher on the content container
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'DIV' &&
        element.classList.contains('text-gray-700') &&
        /Juan Cruz/.test(element.textContent ?? '') &&
        /receives/.test(element.textContent ?? ''),
      )).toBeInTheDocument();
    });

    it('second and subsequent narrative items are collapsed by default', async () => {
      renderPanel({
        narratives: [
          createNarrative({ heir_id: 'lc1', heir_name: 'Juan', text: 'Juan narrative text body.' }),
          createNarrative({ heir_id: 'sp', heir_name: 'Maria', text: 'Maria narrative text body.' }),
        ],
      });
      // Second narrative text body should NOT be visible by default
      expect(screen.queryByText('Maria narrative text body.')).not.toBeInTheDocument();
    });

    it('clicking a collapsed item expands it', async () => {
      const user = userEvent.setup();
      renderPanel({
        narratives: [
          createNarrative({ heir_id: 'lc1', heir_name: 'Juan', text: 'Juan narrative text.' }),
          createNarrative({ heir_id: 'sp', heir_name: 'Maria', text: 'Maria narrative text.' }),
        ],
      });
      // Click on Maria's header to expand
      await user.click(screen.getByText('Maria'));
      expect(screen.getByText('Maria narrative text.')).toBeInTheDocument();
    });
  });

  describe('markdown rendering', () => {
    it('renders **bold** as <strong> elements', () => {
      renderPanel({
        narratives: [
          createNarrative({
            text: '**Juan Cruz** receives **₱2,500,000**.',
          }),
        ],
      });
      const strongs = screen.getAllByText(
        (_, element) => element?.tagName === 'STRONG' && /Juan Cruz/.test(element.textContent ?? ''),
      );
      expect(strongs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders money amounts in bold', () => {
      renderPanel({
        narratives: [
          createNarrative({
            text: '**Juan Cruz** receives **₱2,500,000**.',
          }),
        ],
      });
      const strongs = screen.getAllByText(
        (_, element) => element?.tagName === 'STRONG' && /₱/.test(element.textContent ?? ''),
      );
      expect(strongs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('copy all narratives', () => {
    it('renders "Copy All Narratives" button', () => {
      renderPanel();
      expect(screen.getByRole('button', { name: /Copy.*Narratives/i })).toBeInTheDocument();
    });

    it('copy button copies plain text with bold stripped', async () => {
      const user = userEvent.setup();

      renderPanel({
        narratives: [
          createNarrative({
            heir_name: 'Juan Cruz',
            text: '**Juan Cruz** receives **₱2,500,000**.',
          }),
        ],
        decedentName: 'Don Pedro',
        dateOfDeath: '2026-01-15',
      });

      // Spy on the userEvent-managed clipboard stub
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      await user.click(screen.getByRole('button', { name: /Copy.*Narratives/i }));
      expect(writeText).toHaveBeenCalled();

      const copiedText = writeText.mock.calls[0][0];
      // Should include header with decedent name
      expect(copiedText).toContain('Don Pedro');
      // Should NOT contain ** markers
      expect(copiedText).not.toContain('**');
      // Should contain the narrative text content
      expect(copiedText).toContain('Juan Cruz');
      expect(copiedText).toContain('₱2,500,000');
      writeText.mockRestore();
    });
  });

  describe('empty state', () => {
    it('handles empty narratives array gracefully', () => {
      renderPanel({ narratives: [] });
      expect(screen.getByTestId('narrative-panel')).toBeInTheDocument();
    });
  });
});
