/**
 * WarningsSection — EngineOutput.warnings[] if any.
 * Spec: §4.1 section 7
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ManualFlag } from '../../types';

export interface WarningsSectionProps {
  warnings: ManualFlag[];
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginBottom: 6,
  },
  warning: {
    fontSize: 9,
    marginBottom: 2,
    paddingLeft: 8,
  },
  category: {
    fontFamily: 'Times-Bold',
  },
});

export function WarningsSection({ warnings }: WarningsSectionProps) {
  if (warnings.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Warnings</Text>
      {warnings.map((w, i) => (
        <Text key={i} style={styles.warning}>
          [{w.category}] {w.description}
        </Text>
      ))}
    </View>
  );
}
