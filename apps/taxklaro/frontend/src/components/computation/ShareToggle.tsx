import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';

interface ShareToggleProps {
  computationId: string;
  shareEnabled: boolean;
  shareToken: string | null;
  onToggle: (enabled: boolean) => Promise<void>;
  onRotate?: () => Promise<void>;
}

export function ShareToggle({
  shareEnabled,
  shareToken,
  onToggle,
  onRotate,
}: ShareToggleProps) {
  const [copying, setCopying] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  async function handleCopy() {
    if (!shareUrl) return;
    setCopying(true);
    await navigator.clipboard.writeText(shareUrl);
    setTimeout(() => setCopying(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Public share link</p>
          <p className="text-xs text-muted-foreground">Anyone with the link can view results</p>
        </div>
        <Switch
          checked={shareEnabled}
          onCheckedChange={onToggle}
        />
      </div>

      {shareEnabled && shareUrl && (
        <div className="flex gap-2">
          <div className="flex-1 text-xs font-mono bg-muted rounded px-3 py-2 truncate">
            {shareUrl}
          </div>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            {copying ? 'Copied!' : 'Copy'}
          </Button>
          {onRotate && (
            <Button size="sm" variant="outline" onClick={onRotate}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />Rotate link
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default ShareToggle;
