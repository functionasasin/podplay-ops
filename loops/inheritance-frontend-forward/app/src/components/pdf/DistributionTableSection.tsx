/**
 * DistributionTableSection — Heir table: name, relationship, mode, net share.
 * Spec: §4.1 section 3
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { InheritanceShare } from '../../types';
import { formatPeso, EFFECTIVE_CATEGORY_LABELS } from '../../types';

export interface DistributionTableSectionProps {
  shares: InheritanceShare[];
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
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #333',
    paddingBottom: 3,
    marginBottom: 4,
    fontFamily: 'Times-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    fontSize: 9,
  },
  colName: { width: '30%' },
  colRelation: { width: '25%' },
  colMode: { width: '20%' },
  colShare: { width: '25%', textAlign: 'right' },
});

export function DistributionTableSection({ shares }: DistributionTableSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Distribution of Shares</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.colName}>Heir</Text>
        <Text style={styles.colRelation}>Relationship</Text>
        <Text style={styles.colMode}>Mode</Text>
        <Text style={styles.colShare}>Net Share</Text>
      </View>
      {shares.map((share) => (
        <View key={share.heir_id} style={styles.tableRow}>
          <Text style={styles.colName}>{share.heir_name}</Text>
          <Text style={styles.colRelation}>
            {EFFECTIVE_CATEGORY_LABELS[share.heir_category]}
          </Text>
          <Text style={styles.colMode}>{share.inherits_by}</Text>
          <Text style={styles.colShare}>
            {formatPeso(share.net_from_estate.centavos)}
          </Text>
        </View>
      ))}
    </View>
  );
}
