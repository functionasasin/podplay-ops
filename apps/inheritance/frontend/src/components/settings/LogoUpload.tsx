import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ALLOWED_LOGO_TYPES, MAX_LOGO_SIZE_BYTES } from '@/lib/firm-profile';

export interface LogoUploadProps {
  currentLogoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function LogoUpload({ currentLogoUrl, onUpload, onRemove }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Invalid file type. Allowed formats: PNG, JPG, SVG');
      // Reset the input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setError('File size exceeds 2 MB limit');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    await onUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div data-testid="logo-upload" className="space-y-3">
      {currentLogoUrl && (
        <div className="flex items-center gap-4">
          <img
            src={currentLogoUrl}
            alt="Firm logo"
            className="h-16 w-auto object-contain border rounded"
          />
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="logo-upload-input">Upload Logo</Label>
        <input
          ref={inputRef}
          id="logo-upload-input"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
