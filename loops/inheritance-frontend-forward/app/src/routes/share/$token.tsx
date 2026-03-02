import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const shareTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$token',
  component: SharedCasePage,
});

function SharedCasePage() {
  const { token } = shareTokenRoute.useParams();

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif">Shared Case</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Shared view for token{' '}
            <code className="text-xs">{token}</code> — coming in Stage 13.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
