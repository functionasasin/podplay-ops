/**
 * ResultsView — main container for the results display.
 * Renders all 5 sections + actions bar after engine returns EngineOutput.
 */
import type { EngineInput, EngineOutput } from '../../types';
import { ResultsHeader } from './ResultsHeader';
import { DistributionSection } from './DistributionSection';
import { NarrativePanel } from './NarrativePanel';
import { WarningsPanel } from './WarningsPanel';
import { ComputationLog } from './ComputationLog';
import { ActionsBar } from './ActionsBar';

export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
}

export function ResultsView({ input, output, onEditInput }: ResultsViewProps) {
  const totalCentavos = typeof input.net_distributable_estate.centavos === 'string'
    ? parseInt(input.net_distributable_estate.centavos, 10)
    : input.net_distributable_estate.centavos;

  return (
    <div data-testid="results-view" className="space-y-8">
      <ResultsHeader
        scenarioCode={output.scenario_code}
        successionType={output.succession_type}
        netDistributableEstate={input.net_distributable_estate}
      />

      <DistributionSection
        shares={output.per_heir_shares}
        totalCentavos={totalCentavos}
        successionType={output.succession_type}
        scenarioCode={output.scenario_code}
        persons={input.family_tree}
      />

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
      />
    </div>
  );
}
