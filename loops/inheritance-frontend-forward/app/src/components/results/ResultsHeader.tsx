/**
 * ResultsHeader — scenario badge, succession type, estate total.
 */
import { AlertTriangle, Info } from 'lucide-react';
import type { ScenarioCode, SuccessionType, Money } from '../../types';
import { formatPeso } from '../../types';
import { Badge } from '../ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { SUCCESSION_TYPE_BADGE_COLOR } from './utils';

export interface ResultsHeaderProps {
  scenarioCode: ScenarioCode;
  successionType: SuccessionType;
  netDistributableEstate: Money;
  decedentName: string;
  dateOfDeath: string;
}

const SUCCESSION_LABELS: Record<SuccessionType, string> = {
  Testate: 'Testate Succession',
  Intestate: 'Intestate Succession',
  Mixed: 'Mixed Succession',
  IntestateByPreterition: 'Intestate Succession',
};

const BADGE_CLASSES: Record<string, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
};

export function ResultsHeader({ scenarioCode, successionType, netDistributableEstate, decedentName, dateOfDeath }: ResultsHeaderProps) {
  const badgeColor = SUCCESSION_TYPE_BADGE_COLOR[successionType];
  const badgeClass = BADGE_CLASSES[badgeColor] ?? BADGE_CLASSES.blue;

  return (
    <div data-testid="results-header">
      <h1 className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight">
        Philippine Inheritance Distribution
      </h1>

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Badge
          data-testid="scenario-badge"
          variant="outline"
          className={`font-mono text-sm font-semibold px-3 py-1 ${badgeClass}`}
        >
          {scenarioCode}
        </Badge>
        <span className="text-base sm:text-lg font-medium text-foreground">
          {SUCCESSION_LABELS[successionType]}
        </span>
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <span className="text-base sm:text-lg">
          <span className="text-muted-foreground">Total Estate: </span>
          <span className="font-semibold text-foreground">{formatPeso(netDistributableEstate.centavos)}</span>
        </span>
      </div>

      {successionType === 'IntestateByPreterition' && (
        <Alert variant="destructive" className="mt-4 border-destructive/30 bg-red-50">
          <AlertTriangle className="size-4" />
          <AlertTitle className="font-semibold">Preterition Detected (Art. 854)</AlertTitle>
          <AlertDescription>
            A compulsory heir was totally omitted from the will. All institutions of heirs
            have been annulled. Distribution follows the intestate succession rules.
          </AlertDescription>
        </Alert>
      )}

      {successionType === 'Mixed' && (
        <Alert className="mt-4 border-blue-200 bg-blue-50 text-blue-800">
          <Info className="size-4" />
          <AlertDescription className="text-blue-700">
            The will does not dispose of the entire free portion. The undisposed portion
            will be distributed under intestate succession rules.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
