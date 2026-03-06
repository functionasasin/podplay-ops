export const TEST_USER = {
  email: `e2e-test-${Date.now()}@taxklaro-test.ph`,
  password: 'TestPassword123!',
  fullName: 'Maria Santos',
  firmName: 'Santos Tax Consulting',
};

export const TEST_CLIENT = {
  fullName: 'Juan dela Cruz',
  email: 'juan.delacruz@example.ph',
  phone: '09171234567',
  tin: '123-456-789-000',
};

// Based on test vector TV-BASIC-001: SC-P-ML-8
// Purely self-employed, ₱700,000 gross receipts, 8% wins
export const TEST_COMPUTATION = {
  title: 'Juan dela Cruz — 2025 Annual',
  taxYear: 2025,
  wizardInputs: {
    mode: 'ANNUAL',
    taxpayerType: 'PURELY_SE',
    fullName: 'Juan dela Cruz',
    tin: '123-456-789-000',
    taxYear: '2025',
    filingPeriod: 'ANNUAL',
    grossReceipts: '700000',
    electedRegime: 'ELECT_OSD',  // was expenseMethod: 'OSD' — use electedRegime enum
    isVatRegistered: false,
    returnType: 'ORIGINAL',
  },
  expectedResults: {
    recommendedRegime: 'PATH_C',  // 8% flat rate = Path C (NOT Path B which is OSD)
    // 8% of (₱700,000 − ₱250,000 exemption) = 8% × ₱450,000 = ₱36,000
    taxDue8Percent: '36,000.00',
  },
};

export const TEST_INVITE_EMAIL = `e2e-invite-${Date.now()}@taxklaro-test.ph`;
