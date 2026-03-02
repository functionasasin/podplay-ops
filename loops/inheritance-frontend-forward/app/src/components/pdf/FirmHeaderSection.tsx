/**
 * FirmHeaderSection — Firm logo, name, address, counsel credentials.
 * Spec: §4.1 section 1
 */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { FirmProfile } from '../../lib/firm-profile';

export interface FirmHeaderSectionProps {
  profile: FirmProfile;
  logoDataUrl?: string | null;
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    borderBottom: '2pt solid #1E3A5F',
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  firmInfo: {
    flex: 1,
  },
  firmName: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
  },
  firmAddress: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  credentials: {
    fontSize: 8,
    color: '#777',
    marginTop: 4,
  },
});

export function FirmHeaderSection({ profile, logoDataUrl }: FirmHeaderSectionProps) {
  const borderColor = profile.letterheadColor || '#1E3A5F';

  return (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <View style={styles.headerRow}>
        {logoDataUrl && (
          <Image style={styles.logo} src={logoDataUrl} />
        )}
        <View style={styles.firmInfo}>
          {profile.firmName && (
            <Text style={styles.firmName}>{profile.firmName}</Text>
          )}
          {profile.firmAddress && (
            <Text style={styles.firmAddress}>{profile.firmAddress}</Text>
          )}
          {profile.counselName && (
            <Text style={styles.credentials}>
              {profile.counselName}
              {profile.ibpRollNo && ` | IBP Roll No. ${profile.ibpRollNo}`}
              {profile.ptrNo && ` | PTR No. ${profile.ptrNo}`}
              {profile.mcleComplianceNo && ` | MCLE No. ${profile.mcleComplianceNo}`}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
