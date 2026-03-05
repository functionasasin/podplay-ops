import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSharedCase } from '@/lib/share';
import type { SharedCaseData } from '@/lib/share';
import { ResultsHeader } from '@/components/results/ResultsHeader';
import { DistributionSection } from '@/components/results/DistributionSection';
import { NarrativePanel } from '@/components/results/NarrativePanel';
import { WarningsPanel } from '@/components/results/WarningsPanel';
import { ComputationLog } from '@/components/results/ComputationLog';
import { ClientTimeline } from '@/components/case/ClientTimeline';

export const shareTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
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
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
          {caseData.output_json && caseData.input_json ? (
            <div className="mt-4 space-y-6">
              <ResultsHeader
                scenarioCode={caseData.output_json.scenario_code}
                successionType={caseData.output_json.succession_type}
                netDistributableEstate={caseData.input_json.net_distributable_estate}
                decedentName={caseData.input_json.decedent.name}
                dateOfDeath={caseData.input_json.decedent.date_of_death}
              />
              <DistributionSection
                shares={caseData.output_json.per_heir_shares}
                totalCentavos={
                  typeof caseData.input_json.net_distributable_estate.centavos === 'string'
                    ? parseInt(caseData.input_json.net_distributable_estate.centavos, 10)
                    : caseData.input_json.net_distributable_estate.centavos
                }
                successionType={caseData.output_json.succession_type}
                scenarioCode={caseData.output_json.scenario_code}
                persons={caseData.input_json.family_tree}
              />
              <NarrativePanel
                narratives={caseData.output_json.narratives}
                decedentName={caseData.input_json.decedent.name}
                dateOfDeath={caseData.input_json.decedent.date_of_death}
              />
              <WarningsPanel
                warnings={caseData.output_json.warnings}
                shares={caseData.output_json.per_heir_shares}
              />
              <ComputationLog log={caseData.output_json.computation_log} />
              <ClientTimeline
                deadlines={[]}
                track="ejs"
                decedentName={caseData.input_json.decedent.name}
                dateOfDeath={caseData.input_json.decedent.date_of_death}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Results have not been computed for this case yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
