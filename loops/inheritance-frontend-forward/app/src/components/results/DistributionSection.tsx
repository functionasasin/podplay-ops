/**
 * DistributionSection — pie chart + heir table with 7 layout variants.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, Scale } from 'lucide-react';
import type { InheritanceShare, SuccessionType, ScenarioCode, Person } from '../../types';
import { formatPeso } from '../../types';
import { getResultsLayout, CATEGORY_BADGE_STYLE } from './utils';
import type { ResultsLayout } from './utils';
import { Badge } from '../ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { Separator } from '../ui/separator';

export interface DistributionSectionProps {
  shares: InheritanceShare[];
  totalCentavos: number;
  successionType: SuccessionType;
  scenarioCode: ScenarioCode;
  persons?: Person[];
}

const CHART_COLORS: Record<string, string> = {
  LegitimateChildGroup: '#3b82f6',
  IllegitimateChildGroup: '#a855f7',
  SurvivingSpouseGroup: '#22c55e',
  LegitimateAscendantGroup: '#f97316',
  CollateralGroup: '#6b7280',
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  LegitimateChildGroup: 'bg-blue-100 text-blue-800 border-blue-200',
  IllegitimateChildGroup: 'bg-purple-100 text-purple-800 border-purple-200',
  SurvivingSpouseGroup: 'bg-green-100 text-green-800 border-green-200',
  LegitimateAscendantGroup: 'bg-orange-100 text-orange-800 border-orange-200',
  CollateralGroup: 'bg-gray-100 text-gray-800 border-gray-200',
};

function getCentavos(share: InheritanceShare): number {
  const c = share.net_from_estate.centavos;
  return typeof c === 'string' ? parseInt(c, 10) : c;
}

function hasDonationsImputed(shares: InheritanceShare[]): boolean {
  return shares.some((s) => {
    const c = s.donations_imputed.centavos;
    return (typeof c === 'string' ? parseInt(c, 10) : c) > 0;
  });
}

function hasRepresentation(shares: InheritanceShare[]): boolean {
  return shares.some((s) => s.inherits_by === 'Representation');
}

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_BADGE_STYLE[category] ?? { color: 'gray', label: category };
  const badgeClass = CATEGORY_BADGE_CLASSES[category] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <Badge variant="outline" className={`text-xs font-medium ${badgeClass}`}>
      {style.label}
    </Badge>
  );
}

function HeirTable({ shares, showDonations, showRepresentation, persons, layout }: {
  shares: InheritanceShare[];
  showDonations: boolean;
  showRepresentation: boolean;
  persons?: Person[];
  layout: ResultsLayout;
}) {
  const activeShares = shares.filter((s) => getCentavos(s) > 0);
  const excludedShares = shares.filter((s) => getCentavos(s) === 0);
  const isCollateral = layout === 'collateral-weighted';

  return (
    <div className="overflow-x-auto -mx-1">
      <Table data-testid="heir-table" className="min-w-[600px]">
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            {isCollateral && <TableHead>Blood Type</TableHead>}
            {isCollateral && <TableHead>Units</TableHead>}
            {showRepresentation && <TableHead>Inherits By</TableHead>}
            {showDonations && <TableHead>Gross Entitlement</TableHead>}
            {showDonations && <TableHead>Donations Imputed</TableHead>}
            <TableHead>Net from Estate</TableHead>
            <TableHead>Legal Basis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeShares.map((share) => {
            const person = persons?.find((p) => p.id === share.heir_id);
            const bloodType = person?.blood_type ?? null;
            const units = bloodType === 'Full' ? 2 : bloodType === 'Half' ? 1 : null;
            return (
              <TableRow key={share.heir_id}>
                <TableCell className="font-medium">{share.heir_name}</TableCell>
                <TableCell><CategoryBadge category={share.heir_category} /></TableCell>
                {isCollateral && <TableCell>{bloodType ?? '—'}</TableCell>}
                {isCollateral && <TableCell>{units ?? '—'}</TableCell>}
                {showRepresentation && (
                  <TableCell>
                    {share.inherits_by === 'Representation' && (
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                        By Representation
                      </Badge>
                    )}
                  </TableCell>
                )}
                {showDonations && (
                  <TableCell>{formatPeso(share.gross_entitlement.centavos)}</TableCell>
                )}
                {showDonations && (
                  <TableCell className="text-muted-foreground">- {formatPeso(share.donations_imputed.centavos)}</TableCell>
                )}
                <TableCell className="font-semibold">{formatPeso(share.net_from_estate.centavos)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {share.legal_basis.map((art) => (
                      <Badge key={art} variant="secondary" className="text-xs font-normal">
                        {art}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {excludedShares.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Excluded Heirs ({excludedShares.length})
          </h4>
          <div className="space-y-1.5">
            {excludedShares.map((share) => (
              <div key={share.heir_id} className="text-sm text-muted-foreground pl-2 flex items-center gap-2">
                <span>{share.heir_name}</span>
                <span className="text-border">—</span>
                <CategoryBadge category={share.heir_category} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DistributionChart({ chartData }: { chartData: { name: string; value: number; category: string }[] }) {
  if (chartData.length === 0) return null;
  return (
    <div data-testid="distribution-chart" className="mb-6">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={CHART_COLORS[entry.category] ?? '#6b7280'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionSection({
  shares,
  totalCentavos: _totalCentavos,
  successionType,
  scenarioCode,
  persons,
}: DistributionSectionProps) {
  const layout = getResultsLayout(successionType, scenarioCode);
  const showDonations = hasDonationsImputed(shares);
  const showRepresentation = hasRepresentation(shares);

  const chartData = shares
    .filter((s) => getCentavos(s) > 0)
    .map((s) => ({
      name: s.heir_name,
      value: getCentavos(s),
      category: s.heir_category,
    }));

  if (layout === 'escheat') {
    return (
      <div data-testid="distribution-section">
        <Alert className="border-warning/30 bg-amber-50 text-amber-900">
          <Scale className="size-4 text-amber-700" />
          <AlertTitle className="text-lg font-semibold">Estate Escheats to the State</AlertTitle>
          <AlertDescription className="text-amber-700">
            No surviving heirs were found. The entire estate passes to the Republic
            of the Philippines under Art. 1011 of the Civil Code.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (layout === 'no-compulsory-full-fp') {
    return (
      <div data-testid="distribution-section">
        <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
          <Info className="size-4" />
          <AlertTitle className="font-semibold">No Compulsory Heirs — Entire Estate is Free Portion</AlertTitle>
          <AlertDescription className="text-blue-700">
            The decedent has no living compulsory heirs. The entire estate is
            disposable by will.
          </AlertDescription>
        </Alert>
        <DistributionChart chartData={chartData} />
        {chartData.length > 0 && (
          <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
        )}
      </div>
    );
  }

  if (layout === 'collateral-weighted') {
    return (
      <div data-testid="distribution-section">
        <Alert className="mb-6 border-border bg-muted/50 text-foreground">
          <Scale className="size-4 text-muted-foreground" />
          <AlertTitle className="text-sm font-semibold">Art. 1004 / 1006</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Full blood siblings receive twice the share of half blood siblings.
            Full blood = 2 shares | Half blood = 1 share
          </AlertDescription>
        </Alert>
        <DistributionChart chartData={chartData} />
        <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
      </div>
    );
  }

  if (layout === 'preterition-override') {
    return (
      <div data-testid="distribution-section">
        <DistributionChart chartData={chartData} />
        <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
        <Alert className="mt-6 border-blue-200 bg-blue-50 text-blue-800">
          <Info className="size-4" />
          <AlertDescription className="text-blue-700">
            Valid legacies and devises (if any) survive preterition unless separately inofficious.
            Only the institution of heirs was annulled.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (layout === 'mixed-succession') {
    return (
      <div data-testid="distribution-section">
        <DistributionChart chartData={chartData} />
        <h3 className="font-serif text-base sm:text-lg font-semibold text-primary mb-3">Testate Portion</h3>
        <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
        <Separator className="my-6" />
        <h3 className="font-serif text-base sm:text-lg font-semibold text-primary mb-3">Intestate Remainder</h3>
      </div>
    );
  }

  if (layout === 'testate-with-dispositions') {
    return (
      <div data-testid="distribution-section">
        <DistributionChart chartData={chartData} />
        <h3 className="font-serif text-base sm:text-lg font-semibold text-primary mb-3">Compulsory Shares (Legitime)</h3>
        <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
        <Separator className="my-6" />
        <h3 className="font-serif text-base sm:text-lg font-semibold text-primary mb-3">Free Portion (Testamentary Dispositions)</h3>
      </div>
    );
  }

  // standard-distribution (default)
  return (
    <div data-testid="distribution-section">
      <DistributionChart chartData={chartData} />
      <HeirTable shares={shares} showDonations={showDonations} showRepresentation={showRepresentation} persons={persons} layout={layout} />
    </div>
  );
}
