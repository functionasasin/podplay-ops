export interface LogoUploadProps {
  currentLogoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function LogoUpload({ currentLogoUrl, onUpload, onRemove }: LogoUploadProps) {
  // stub — will be implemented
  void currentLogoUrl;
  void onUpload;
  void onRemove;
  return <div data-testid="logo-upload">Stub</div>;
}
