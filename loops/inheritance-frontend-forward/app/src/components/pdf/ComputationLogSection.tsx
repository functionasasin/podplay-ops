/**
 * ComputationLogSection — Verbatim EngineOutput.computation_log[].
 * Spec: §4.1 section 6
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ComputationLog } from '../../types';

export interface ComputationLogSectionProps {
  log: ComputationLog;
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
  step: {
    fontSize: 9,
    marginBottom: 2,
  },
  summary: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    marginTop: 4,
  },
});

export function ComputationLogSection({ log }: ComputationLogSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Computation Log</Text>
      {log.steps.map((step) => (
        <Text key={step.step_number} style={styles.step}>
          {step.step_number}. {step.step_name}: {step.description}
        </Text>
      ))}
      <Text style={styles.summary}>
        Final Scenario: {log.final_scenario} | Restarts: {log.total_restarts}
      </Text>
    </View>
  );
}
