import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock qrcode.react
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, ...props }: { value: string; [key: string]: unknown }) => (
    <svg data-testid="qr-code-svg" data-value={value} {...props} />
  ),
}));

import { ShareDialog } from '../ShareDialog';
import type { ShareDialogProps } from '../ShareDialog';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

const defaultProps: ShareDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  shareToken: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  shareEnabled: true,
  onToggleShare: vi.fn().mockResolvedValue(undefined),
};

function renderDialog(overrides: Partial<ShareDialogProps> = {}) {
  return render(<ShareDialog {...defaultProps} {...overrides} />);
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('shareable > ShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('privacy warning', () => {
    it('shows privacy warning dialog on open', () => {
      renderDialog();

      const warning = screen.getByTestId('privacy-warning');
      expect(warning).toBeInTheDocument();
      expect(warning.textContent).toContain('Privacy Warning');
    });

    it('privacy warning is always visible (not dismissible)', () => {
      renderDialog();

      // Warning should be present with no dismiss button inside it
      const warning = screen.getByTestId('privacy-warning');
      expect(warning).toBeInTheDocument();
      const dismissBtn = warning.querySelector('button');
      expect(dismissBtn).toBeNull();
    });

    it('privacy warning mentions unauthorized parties', () => {
      renderDialog();

      expect(screen.getByTestId('privacy-warning').textContent).toContain(
        'unauthorized',
      );
    });

    it('privacy warning shown even when sharing is disabled', () => {
      renderDialog({ shareEnabled: false });

      expect(screen.getByTestId('privacy-warning')).toBeInTheDocument();
    });
  });

  describe('copy link', () => {
    it('copy link button copies correct URL to clipboard', async () => {
      const user = userEvent.setup();
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      renderDialog();

      await user.click(screen.getByTestId('copy-link-button'));

      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('/share/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
      );
      writeText.mockRestore();
    });

    it('share URL input shows the correct link', () => {
      renderDialog();

      const input = screen.getByTestId('share-url-input') as HTMLInputElement;
      expect(input.value).toContain('/share/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    });

    it('share URL input is read-only', () => {
      renderDialog();

      const input = screen.getByTestId('share-url-input') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });
  });

  describe('QR code', () => {
    it('QR code container renders when sharing is enabled', () => {
      renderDialog({ shareEnabled: true });

      expect(screen.getByTestId('qr-code-container')).toBeInTheDocument();
    });

    it('QR code container hidden when sharing is disabled', () => {
      renderDialog({ shareEnabled: false });

      expect(screen.queryByTestId('qr-code-container')).not.toBeInTheDocument();
    });
  });

  describe('toggle sharing', () => {
    it('toggle button shows "Disable Sharing" when enabled', () => {
      renderDialog({ shareEnabled: true });

      expect(screen.getByTestId('share-toggle').textContent).toContain(
        'Disable',
      );
    });

    it('toggle button shows "Enable Sharing" when disabled', () => {
      renderDialog({ shareEnabled: false });

      expect(screen.getByTestId('share-toggle').textContent).toContain(
        'Enable',
      );
    });

    it('toggle calls onToggleShare with opposite value', async () => {
      const onToggleShare = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderDialog({ shareEnabled: true, onToggleShare });

      await user.click(screen.getByTestId('share-toggle'));

      expect(onToggleShare).toHaveBeenCalledWith(false);
    });

    it('toggle enables sharing when currently disabled', async () => {
      const onToggleShare = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderDialog({ shareEnabled: false, onToggleShare });

      await user.click(screen.getByTestId('share-toggle'));

      expect(onToggleShare).toHaveBeenCalledWith(true);
    });

    it('toggle button disabled while toggling', async () => {
      // Use a promise that we control to keep the toggle "in flight"
      let resolveToggle!: () => void;
      const onToggleShare = vi.fn(
        () => new Promise<void>((r) => { resolveToggle = r; }),
      );
      const user = userEvent.setup();
      renderDialog({ shareEnabled: true, onToggleShare });

      await user.click(screen.getByTestId('share-toggle'));

      // Button should be disabled while waiting
      expect(screen.getByTestId('share-toggle')).toBeDisabled();

      // Resolve and verify it re-enables
      resolveToggle();
      await waitFor(() => {
        expect(screen.getByTestId('share-toggle')).not.toBeDisabled();
      });
    });
  });

  describe('dialog open/close', () => {
    it('renders dialog content when open', () => {
      renderDialog({ open: true });

      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      renderDialog({ open: false });

      expect(screen.queryByTestId('share-dialog')).not.toBeInTheDocument();
    });

    it('shows "Share Case" title', () => {
      renderDialog();

      expect(screen.getByText('Share Case')).toBeInTheDocument();
    });
  });

  describe('share URL and copy visibility', () => {
    it('URL input and copy button shown when sharing enabled', () => {
      renderDialog({ shareEnabled: true });

      expect(screen.getByTestId('share-url-input')).toBeInTheDocument();
      expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
    });

    it('URL input and copy button hidden when sharing disabled', () => {
      renderDialog({ shareEnabled: false });

      expect(screen.queryByTestId('share-url-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('copy-link-button')).not.toBeInTheDocument();
    });
  });
});
