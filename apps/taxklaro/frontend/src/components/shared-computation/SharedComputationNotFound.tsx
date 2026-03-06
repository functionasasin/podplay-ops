import { Link2Off } from 'lucide-react';

export function SharedComputationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Link2Off className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Link not found or expired</h1>
      <p className="text-muted-foreground max-w-sm">
        This shared computation link is no longer active or doesn't exist.
        Please ask the sender for a new link.
      </p>
    </div>
  );
}
