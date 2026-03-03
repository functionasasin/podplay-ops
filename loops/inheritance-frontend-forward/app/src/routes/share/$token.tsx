import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSharedCase } from '@/lib/share';
import type { SharedCaseData } from '@/lib/share';

export const shareTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$token',
  component: SharedCaseRouteComponent,
});

function SharedCaseRouteComponent() {
  const { token } = shareTokenRoute.useParams();
  return <SharedCasePage token={token} />;
}

export interface SharedCasePageProps {
  token: string;
}

export function SharedCasePage({ token }: SharedCasePageProps) {
  const [caseData, setCaseData] = useState<SharedCaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getSharedCase(token).then((data) => {
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
      } else {
        setCaseData(data);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setNotFound(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div data-testid="shared-case-loading" className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading shared case...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound || !caseData) {
    return (
      <div data-testid="shared-case-not-found" className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Case Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This shared link is invalid, expired, or sharing has been disabled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="shared-case-content" className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              <CardTitle className="font-serif">{caseData.title}</CardTitle>
            </div>
            <Badge data-testid="read-only-badge" variant="secondary">
              Read Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estate of {caseData.decedent_name}
          </p>
          {/* Results will be rendered here in implementation phase */}
          {/* No ActionsBar, no CaseNotesPanel, no share button in shared view */}
        </CardContent>
      </Card>
    </div>
  );
}
