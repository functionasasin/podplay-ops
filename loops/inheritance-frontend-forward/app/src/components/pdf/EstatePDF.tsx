/**
 * EstatePDF — Main PDF Document component for estate distribution report.
 * Uses @react-pdf/renderer to generate A4 portrait PDF.
 *
 * Spec: §4.1
 */
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '../../types';
import type { FirmProfile } from '../../lib/firm-profile';
import { FirmHeaderSection } from './FirmHeaderSection';
import { CaseSummarySection } from './CaseSummarySection';
import { DistributionTableSection } from './DistributionTableSection';
import { PerHeirBreakdownSection } from './PerHeirBreakdownSection';
import { NarrativesSection } from './NarrativesSection';
import { ComputationLogSection } from './ComputationLogSection';
import { WarningsSection } from './WarningsSection';
import { DisclaimerSection } from './DisclaimerSection';

export interface PDFExportOptions {
  includeFirmHeader: boolean;
  includeFamilyTree: boolean;
  includeDeadlines: boolean;
  includeChecklist: boolean;
}

export interface EstatePDFProps {
  input: EngineInput;
  output: EngineOutput;
  profile: FirmProfile | null;
  options: PDFExportOptions;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: '30mm',
    paddingBottom: '25mm',
    paddingLeft: '38mm',
    paddingRight: '25mm',
    fontFamily: 'Times-Roman',
    fontSize: 10,
  },
});

export function EstatePDF({ input, output, profile, options }: EstatePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {options.includeFirmHeader && profile && (
          <FirmHeaderSection profile={profile} />
        )}
        <CaseSummarySection input={input} output={output} />
        <DistributionTableSection shares={output.per_heir_shares} />
        <PerHeirBreakdownSection
          shares={output.per_heir_shares}
          persons={input.family_tree}
        />
        <NarrativesSection narratives={output.narratives} />
        <ComputationLogSection log={output.computation_log} />
        <WarningsSection warnings={output.warnings} />
        <DisclaimerSection />
      </Page>
    </Document>
  );
}
