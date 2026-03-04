import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string;
  shareEnabled: boolean;
  onToggleShare: (enabled: boolean) => Promise<void>;
}

export function ShareDialog({
  open,
  onOpenChange,
  shareToken,
  shareEnabled,
  onToggleShare,
}: ShareDialogProps) {
  const [toggling, setToggling] = useState(false);

  const shareUrl = `${window.location.origin}/share/${shareToken}`;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleShare(!shareEnabled);
    } finally {
      setToggling(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle>Share Case</DialogTitle>
          <DialogDescription>
            Share a read-only view of this case
          </DialogDescription>
        </DialogHeader>

        {/* Privacy Warning — shown every time, NOT dismissible */}
        <div data-testid="privacy-warning" role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Privacy Warning:</strong> Sharing this link will allow anyone
          with the URL to view the case details, including heir names, estate
          values, and distribution amounts. Do not share with unauthorized
          parties.
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <span>Sharing {shareEnabled ? 'Enabled' : 'Disabled'}</span>
          <button
            data-testid="share-toggle"
            onClick={handleToggle}
            disabled={toggling}
            className="rounded-md border px-3 py-1 text-sm"
          >
            {shareEnabled ? 'Disable' : 'Enable'} Sharing
          </button>
        </div>

        {shareEnabled && (
          <>
            {/* Share URL + Copy */}
            <div className="flex items-center gap-2">
              <input
                data-testid="share-url-input"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
              />
              <button
                data-testid="copy-link-button"
                onClick={handleCopy}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Copy
              </button>
            </div>

            {/* QR Code */}
            <div data-testid="qr-code-container" className="flex justify-center py-2">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
