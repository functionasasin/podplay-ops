/**
 * ResultsView — main container for the results display.
 * Renders all sections + actions bar after engine returns EngineOutput.
 */
import type { EngineInput, EngineOutput } from '../../types';
import { ResultsHeader } from './ResultsHeader';
import { DistributionSection } from './DistributionSection';
import { ShareBreakdownSection } from './ShareBreakdownSection';
import { ComparisonPanel } from './ComparisonPanel';
import { DonationsSummaryPanel } from './DonationsSummaryPanel';
import { NarrativePanel } from './NarrativePanel';
import { WarningsPanel } from './WarningsPanel';
import { ComputationLog } from './ComputationLog';
import { ActionsBar } from './ActionsBar';

export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  caseId?: string;
  shareToken?: string;
  shareEnabled?: boolean;
  onToggleShare?: (enabled: boolean) => Promise<void>;
}

export function ResultsView({ input, output, onEditInput, caseId, shareToken, shareEnabled, onToggleShare }: ResultsViewProps) {
  const totalCentavos = typeof input.net_distributable_estate.centavos === 'string'
    ? parseInt(input.net_distributable_estate.centavos, 10)
    : input.net_distributable_estate.centavos;

  const hasDonations = input.donations && input.donations.length > 0;
  const isTestate = input.will !== null && input.will !== undefined;

  return (
    <div data-testid="results-view" className="space-y-8">
      <ResultsHeader
        scenarioCode={output.scenario_code}
        successionType={output.succession_type}
        netDistributableEstate={input.net_distributable_estate}
        decedentName={input.decedent.name}
        dateOfDeath={input.decedent.date_of_death}
      />

      <DistributionSection
        shares={output.per_heir_shares}
        totalCentavos={totalCentavos}
        successionType={output.succession_type}
        scenarioCode={output.scenario_code}
        persons={input.family_tree}
      />

      <ShareBreakdownSection shares={output.per_heir_shares} />

      {isTestate && (
        <ComparisonPanel input={input} output={output} caseId={caseId} />
      )}

      {hasDonations && (
        <DonationsSummaryPanel
          donations={input.donations!}
          persons={input.family_tree}
        />
      )}

      <NarrativePanel
        narratives={output.narratives}
        decedentName={input.decedent.name}
        dateOfDeath={input.decedent.date_of_death}
      />

      <WarningsPanel
        warnings={output.warnings}
        shares={output.per_heir_shares}
      />

      <ComputationLog log={output.computation_log} />

      <ActionsBar
        input={input}
        output={output}
        onEditInput={onEditInput}
        caseId={caseId}
        shareToken={shareToken}
        shareEnabled={shareEnabled}
        onToggleShare={onToggleShare}
      />
    </div>
  );
}
