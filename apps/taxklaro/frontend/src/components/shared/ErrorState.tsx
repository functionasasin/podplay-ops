import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className }: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn('my-6', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title ?? 'Something went wrong'}</AlertTitle>
      <AlertDescription className="mt-2">
        {message ?? 'Unable to load data. Please check your connection and try again.'}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 block">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ErrorState;
