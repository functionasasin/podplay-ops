import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ManualReviewFlag } from '@/types/common';

interface ManualReviewFlagsProps {
  manualReviewFlags: ManualReviewFlag[];
}

export function ManualReviewFlags({ manualReviewFlags }: ManualReviewFlagsProps) {
  if (manualReviewFlags.length === 0) return null;

  return (
    <Card className="border-yellow-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
          <span>Manual Review Required</span>
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
            {manualReviewFlags.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {manualReviewFlags.map((flag) => (
          <Alert key={flag.code} className="border-yellow-500/40 bg-yellow-50/50 dark:bg-yellow-900/10">
            <AlertTitle className="text-sm font-medium flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                {flag.code}
              </Badge>
              {flag.title}
            </AlertTitle>
            <AlertDescription className="mt-1 space-y-1">
              <p className="text-sm">{flag.message}</p>
              <p className="text-xs text-muted-foreground">
                Field: <span className="font-mono">{flag.fieldAffected}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Engine action: {flag.engineAction}
              </p>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

export default ManualReviewFlags;
