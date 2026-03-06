// TaxComputationDocument: PDF export component using @react-pdf/renderer.
// Lazy-loaded via import('@/components/pdf/TaxComputationDocument') from ActionsBar.
// (spec §14.2 rule 4)
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { TaxComputationResult } from '@/types/engine-output';

interface TaxComputationDocumentProps {
  result: TaxComputationResult;
  title: string;
  taxYear: number;
  taxpayerName?: string | null;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: '#111827',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1D4ED8',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#EFF6FF',
    padding: 4,
    marginBottom: 6,
    color: '#1D4ED8',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: {
    flex: 2,
    color: '#374151',
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  rowValueHighlight: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#1D4ED8',
  },
  recommended: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    marginBottom: 14,
    borderRadius: 4,
  },
  recommendedText: {
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    fontSize: 11,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: '#D1D5DB',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  pathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 3,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderRadius: 2,
  },
  pathRowHighlighted: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 2,
    backgroundColor: '#EFF6FF',
  },
  pathLabel: { flex: 3, fontSize: 9, color: '#374151' },
  pathValue: { flex: 1, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  warningItem: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 3,
    backgroundColor: '#FEF9C3',
    borderRadius: 2,
  },
  warningText: { fontSize: 9, color: '#713F12' },
});

function formatPeso(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₱0.00';
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TaxComputationDocument({
  result,
  title,
  taxYear,
  taxpayerName,
}: TaxComputationDocumentProps) {
  const {
    inputSummary,
    grossAggregates,
    comparison,
    recommendedRegime,
    selectedPath,
    selectedIncomeTaxDue,
    selectedPercentageTaxDue,
    selectedTotalTax,
    totalItCredits,
    balance,
    disposition,
    overpayment,
    pathADetails,
    pathBDetails,
    pathCDetails,
    ptResult,
    warnings,
    computedAt,
    engineVersion,
  } = result;

  function isPathEligible(path: string): boolean {
    if (path === 'PATH_A') return pathADetails?.eligible ?? false;
    if (path === 'PATH_B') return pathBDetails?.eligible ?? false;
    if (path === 'PATH_C') return pathCDetails?.eligible ?? false;
    return false;
  }

  const isRecommended = selectedPath === recommendedRegime;

  return (
    <Document title={title} author="TaxKlaro" creator="TaxKlaro" producer="TaxKlaro">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tax Computation Summary</Text>
          <Text style={styles.subtitle}>
            Tax Year {taxYear}
            {taxpayerName ? ` · ${taxpayerName}` : ''}
            {' · '}
            {inputSummary.filingPeriod === 'ANNUAL' ? 'Annual' : `Q${inputSummary.filingPeriod.replace('Q', '')}`}
            {' Filing'}
          </Text>
        </View>

        {/* Recommended Regime Banner */}
        <View style={styles.recommended}>
          <Text style={styles.recommendedText}>
            Recommended Regime: {recommendedRegime.replace(/_/g, ' ')}
            {isRecommended ? '' : ` (Selected: ${selectedPath.replace(/_/g, ' ')})`}
          </Text>
        </View>

        {/* Income Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross Receipts (net)</Text>
            <Text style={styles.rowValue}>{formatPeso(grossAggregates.netGrossReceipts)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gross Income</Text>
            <Text style={styles.rowValue}>{formatPeso(grossAggregates.grossIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Taxpayer Type</Text>
            <Text style={styles.rowValue}>{inputSummary.taxpayerType.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>VAT Registered</Text>
            <Text style={styles.rowValue}>{inputSummary.isVatRegistered ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {/* Regime Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regime Comparison</Text>
          {comparison.map((option) => {
            const isSelected = option.path === selectedPath;
            const eligible = isPathEligible(option.path);
            return (
              <View
                key={option.path}
                style={isSelected ? styles.pathRowHighlighted : styles.pathRow}
              >
                <Text style={styles.pathLabel}>
                  {option.label}
                  {isSelected ? ' ✓' : ''}
                  {option.path === recommendedRegime ? ' (Recommended)' : ''}
                </Text>
                <Text style={styles.pathValue}>
                  {eligible ? formatPeso(option.totalTaxBurden) : 'Ineligible'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tax Computation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Computation (Selected Regime)</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Income Tax Due</Text>
            <Text style={styles.rowValue}>{formatPeso(selectedIncomeTaxDue)}</Text>
          </View>
          {ptResult.ptApplies && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Percentage Tax Due (3%)</Text>
              <Text style={styles.rowValue}>{formatPeso(selectedPercentageTaxDue)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Tax Due</Text>
            <Text style={styles.rowValueHighlight}>{formatPeso(selectedTotalTax)}</Text>
          </View>
        </View>

        {/* Credits & Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits & Balance</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Tax Credits</Text>
            <Text style={styles.rowValue}>{formatPeso(totalItCredits)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Balance</Text>
            <Text style={styles.rowValueHighlight}>{formatPeso(balance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Disposition</Text>
            <Text style={styles.rowValue}>{disposition.replace(/_/g, ' ')}</Text>
          </View>
          {parseFloat(overpayment) > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Overpayment</Text>
              <Text style={styles.rowValue}>{formatPeso(overpayment)}</Text>
            </View>
          )}
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warnings</Text>
            {warnings.map((w, i) => (
              <View key={i} style={styles.warningItem}>
                <Text style={styles.warningText}>{w.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by TaxKlaro · Engine v{engineVersion}</Text>
          <Text style={styles.footerText}>Computed: {computedAt}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export default TaxComputationDocument;
