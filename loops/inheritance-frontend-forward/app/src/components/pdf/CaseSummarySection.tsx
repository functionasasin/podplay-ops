/**
 * CaseSummarySection — "Estate of [decedent name]", DOD, date of report.
 * Spec: §4.1 section 2
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { EngineInput, EngineOutput } from '../../types';
import { formatPeso, SUCCESSION_TYPE_LABELS } from '../../types';

export interface CaseSummarySectionProps {
  input: EngineInput;
  output: EngineOutput;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
    marginBottom: 2,
  },
});

export function CaseSummarySection({ input, output }: CaseSummarySectionProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        Estate of {input.decedent.name}
      </Text>
      <Text style={styles.subtitle}>
        Date of Death: {input.decedent.date_of_death}
      </Text>
      <Text style={styles.subtitle}>
        Report Generated: {today}
      </Text>
      <Text style={styles.subtitle}>
        Succession Type: {SUCCESSION_TYPE_LABELS[output.succession_type]}
      </Text>
      <Text style={styles.subtitle}>
        Net Distributable Estate: {formatPeso(input.net_distributable_estate.centavos)}
      </Text>
    </View>
  );
}
