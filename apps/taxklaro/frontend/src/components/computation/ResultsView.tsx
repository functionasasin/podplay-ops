import type { TaxComputationResult } from '@/types/engine-output';
import { WarningsBanner } from '@/components/results/WarningsBanner';
import { RegimeComparisonTable } from '@/components/results/RegimeComparisonTable';
import { RecommendationBanner } from '@/components/results/RecommendationBanner';
import { TaxBreakdownPanel } from '@/components/results/TaxBreakdownPanel';
import { BalancePayableSection } from '@/components/results/BalancePayableSection';
import { InstallmentSection } from '@/components/results/InstallmentSection';
import { PercentageTaxSummary } from '@/components/results/PercentageTaxSummary';
import { BirFormRecommendation } from '@/components/results/BirFormRecommendation';
import { PenaltySummary } from '@/components/results/PenaltySummary';
import { ManualReviewFlags } from '@/components/results/ManualReviewFlags';
import { PathDetailAccordion } from '@/components/results/PathDetailAccordion';

interface ResultsViewProps {
  result: TaxComputationResult;
  readOnly?: boolean;
}

export function ResultsView({ result }: ResultsViewProps) {
  return (
    <div className="space-y-6">
      <WarningsBanner warnings={result.warnings} />
      <ManualReviewFlags manualReviewFlags={result.manualReviewFlags} />

      <RecommendationBanner
        recommendedRegime={result.recommendedRegime}
        savingsVsWorst={result.savingsVsWorst}
        savingsVsNextBest={result.savingsVsNextBest}
        usingLockedRegime={result.usingLockedRegime}
      />

      <RegimeComparisonTable
        comparison={result.comparison}
        recommendedRegime={result.recommendedRegime}
        selectedPath={result.selectedPath}
      />

      <TaxBreakdownPanel
        selectedPath={result.selectedPath}
        selectedIncomeTaxDue={result.selectedIncomeTaxDue}
        selectedPercentageTaxDue={result.selectedPercentageTaxDue}
        selectedTotalTax={result.selectedTotalTax}
      />

      <PathDetailAccordion
        pathADetails={result.pathADetails}
        pathBDetails={result.pathBDetails}
        pathCDetails={result.pathCDetails}
      />

      {result.ptResult.ptApplies && (
        <PercentageTaxSummary ptResult={result.ptResult} />
      )}

      <BalancePayableSection
        balance={result.balance}
        disposition={result.disposition}
        overpayment={result.overpayment}
        overpaymentDisposition={result.overpaymentDisposition}
        totalItCredits={result.totalItCredits}
        cwtCredits={result.cwtCredits}
        quarterlyPayments={result.quarterlyPayments}
        priorYearExcess={result.priorYearExcess}
      />

      {result.installmentEligible && (
        <InstallmentSection
          installmentEligible={result.installmentEligible}
          installmentFirstDue={result.installmentFirstDue}
          installmentSecondDue={result.installmentSecondDue}
        />
      )}

      {result.penalties !== null && (
        <PenaltySummary penalties={result.penalties} />
      )}

      <BirFormRecommendation
        formType={result.formType}
        formOutput={result.formOutput}
        requiredAttachments={result.requiredAttachments}
      />
    </div>
  );
}

export default ResultsView;
