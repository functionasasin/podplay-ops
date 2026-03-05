/**
 * DisclaimerSection — Always rendered as the last section of the PDF.
 * Spec: §4.1 section 11
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const DISCLAIMER_TEXT =
  'This report was generated for informational purposes. Consult a licensed attorney for final estate settlement advice.';

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    paddingTop: 8,
    borderTop: '1pt solid #ccc',
  },
  heading: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
});

export function DisclaimerSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Disclaimer</Text>
      <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}
