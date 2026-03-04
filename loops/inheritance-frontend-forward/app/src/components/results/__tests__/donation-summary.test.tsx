import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DonationsSummaryPanel } from '../DonationsSummaryPanel';
import { getDonationCollationStatus } from '../donation-utils';
import type { Donation, Person, Money } from '../../../types';
import { formatPeso } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function money(pesos: number): Money {
  return { centavos: pesos * 100 };
}

function createDonation(overrides: Partial<Donation> = {}): Donation {
  return {
    id: 'don1',
    recipient_heir_id: 'lc1',
    recipient_is_stranger: false,
    value_at_time_of_donation: money(500000),
    date: '2018-03-15',
    description: 'Land in Batangas',
    is_expressly_exempt: false,
    is_support_education_medical: false,
    is_customary_gift: false,
    is_professional_expense: false,
    professional_expense_parent_required: false,
    professional_expense_imputed_savings: null,
    is_joint_from_both_parents: false,
    is_to_child_spouse_only: false,
    is_joint_to_child_and_spouse: false,
    is_wedding_gift: false,
    is_debt_payment_for_child: false,
    is_election_expense: false,
    is_fine_payment: false,
    ...overrides,
  };
}

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'lc1',
    name: 'Remedios Santos',
    is_alive_at_succession: true,
    relationship_to_decedent: 'LegitimateChild',
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: 'BirthCertificate',
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

const defaultPersons: Person[] = [
  createPerson({ id: 'lc1', name: 'Remedios Santos' }),
  createPerson({ id: 'lc2', name: 'Juan dela Cruz Jr.' }),
];

// --------------------------------------------------------------------------
// Tests — DonationsSummaryPanel (rendering)
// --------------------------------------------------------------------------

describe('donation-summary > DonationsSummaryPanel', () => {
  describe('visibility', () => {
    it('renders panel when donations exist', () => {
      const donations = [createDonation()];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByTestId('donations-summary-panel')).toBeInTheDocument();
    });

    it('does not render when donations array is empty', () => {
      render(
        <DonationsSummaryPanel donations={[]} persons={defaultPersons} />,
      );
      expect(screen.queryByTestId('donations-summary-panel')).not.toBeInTheDocument();
    });
  });

  describe('donation rows', () => {
    it('renders a row for each donation', () => {
      const donations = [
        createDonation({ id: 'don1', recipient_heir_id: 'lc1' }),
        createDonation({ id: 'don2', recipient_heir_id: 'lc2' }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText('Remedios Santos')).toBeInTheDocument();
      expect(screen.getByText('Juan dela Cruz Jr.')).toBeInTheDocument();
    });

    it('shows donation value formatted as peso', () => {
      const donations = [createDonation({ value_at_time_of_donation: money(500000) })];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(formatPeso(50000000))).toBeInTheDocument();
    });

    it('shows donation description', () => {
      const donations = [createDonation({ description: 'Land in Batangas' })];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText('Land in Batangas')).toBeInTheDocument();
    });

    it('shows donation date', () => {
      const donations = [createDonation({ date: '2018-03-15' })];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(/2018-03-15|15 Mar 2018/)).toBeInTheDocument();
    });
  });

  describe('collation status chips', () => {
    it('shows emerald chip for collatable donation', () => {
      const donations = [
        createDonation({
          recipient_heir_id: 'lc1',
          recipient_is_stranger: false,
          is_expressly_exempt: false,
          is_support_education_medical: false,
          is_customary_gift: false,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const chip = screen.getByTestId('collation-chip-don1');
      expect(chip.textContent).toMatch(/Collatable/i);
      // Emerald color styling
      expect(chip.className).toMatch(/emerald/);
    });

    it('shows gray chip for exempt donation with exemption type', () => {
      const donations = [
        createDonation({
          id: 'don-exempt',
          recipient_heir_id: 'lc1',
          recipient_is_stranger: false,
          is_expressly_exempt: false,
          is_support_education_medical: true,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const chip = screen.getByTestId('collation-chip-don-exempt');
      expect(chip.textContent).toMatch(/Exempt/i);
      expect(chip.className).toMatch(/gray/);
    });

    it('shows muted chip for stranger donation', () => {
      const donations = [
        createDonation({
          id: 'don-stranger',
          recipient_heir_id: null,
          recipient_is_stranger: true,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const chip = screen.getByTestId('collation-chip-don-stranger');
      expect(chip.textContent).toMatch(/Stranger/i);
      expect(chip.className).toMatch(/muted|slate/);
    });
  });

  describe('footer totals', () => {
    it('shows total collatable amount', () => {
      const donations = [
        createDonation({ id: 'don1', value_at_time_of_donation: money(500000) }),
        createDonation({ id: 'don2', value_at_time_of_donation: money(300000) }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const footer = screen.getByTestId('donations-footer');
      // Both are collatable (heir, no exemption) → total = 800,000
      expect(within(footer).getByText(formatPeso(80000000))).toBeInTheDocument();
    });

    it('shows total exempt amount', () => {
      const donations = [
        createDonation({
          id: 'don-ex1',
          value_at_time_of_donation: money(200000),
          is_support_education_medical: true,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const footer = screen.getByTestId('donations-footer');
      expect(within(footer).getByText(formatPeso(20000000))).toBeInTheDocument();
    });

    it('shows total stranger amount', () => {
      const donations = [
        createDonation({
          id: 'don-str',
          value_at_time_of_donation: money(100000),
          recipient_heir_id: null,
          recipient_is_stranger: true,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const footer = screen.getByTestId('donations-footer');
      expect(within(footer).getByText(formatPeso(10000000))).toBeInTheDocument();
    });

    it('footer totals match sum of donations by category', () => {
      const donations = [
        // Collatable: 500,000
        createDonation({ id: 'don1', value_at_time_of_donation: money(500000) }),
        // Exempt (education): 200,000
        createDonation({
          id: 'don2',
          recipient_heir_id: 'lc2',
          value_at_time_of_donation: money(200000),
          is_support_education_medical: true,
        }),
        // Stranger: 100,000
        createDonation({
          id: 'don3',
          value_at_time_of_donation: money(100000),
          recipient_heir_id: null,
          recipient_is_stranger: true,
        }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      const footer = screen.getByTestId('donations-footer');
      // Collatable total: ₱500,000
      expect(within(footer).getByText(formatPeso(50000000))).toBeInTheDocument();
      // Exempt total: ₱200,000
      expect(within(footer).getByText(formatPeso(20000000))).toBeInTheDocument();
      // Stranger total: ₱100,000
      expect(within(footer).getByText(formatPeso(10000000))).toBeInTheDocument();
    });
  });

  describe('section header', () => {
    it('shows "Advances on Inheritance" title', () => {
      const donations = [createDonation()];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(/Advances on Inheritance/)).toBeInTheDocument();
    });

    it('shows Art. 1061 NCC citation', () => {
      const donations = [createDonation()];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(/Art\. 1061/)).toBeInTheDocument();
    });
  });

  describe('recipient name resolution', () => {
    it('shows person name from persons array when recipient_heir_id matches', () => {
      const donations = [createDonation({ recipient_heir_id: 'lc1' })];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText('Remedios Santos')).toBeInTheDocument();
    });

    it('shows "Unknown Recipient" when recipient_heir_id not found', () => {
      const donations = [createDonation({ recipient_heir_id: 'nonexistent' })];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(/Unknown Recipient/i)).toBeInTheDocument();
    });

    it('shows "Non-Heir (Stranger)" when recipient_is_stranger is true', () => {
      const donations = [
        createDonation({ recipient_heir_id: null, recipient_is_stranger: true }),
      ];
      render(
        <DonationsSummaryPanel donations={donations} persons={defaultPersons} />,
      );
      expect(screen.getByText(/Non-Heir|Stranger/i)).toBeInTheDocument();
    });
  });
});

// --------------------------------------------------------------------------
// Tests — getDonationCollationStatus (pure function)
// --------------------------------------------------------------------------

describe('donation-summary > getDonationCollationStatus', () => {
  it('returns collatable for standard heir donation with no exemptions', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      recipient_is_stranger: false,
      is_expressly_exempt: false,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('collatable');
  });

  it('returns stranger for donation to non-heir', () => {
    const donation = createDonation({
      recipient_heir_id: null,
      recipient_is_stranger: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('stranger');
  });

  it('returns exempt with exemptionType for expressly exempt donation', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_expressly_exempt: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
    expect(result.exemptionType).toBeDefined();
    expect(result.article).toMatch(/Art\. 1062/);
  });

  it('returns exempt for support/education/medical donation', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_support_education_medical: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
    expect(result.exemptionType).toMatch(/Support|Education|Medical/i);
    expect(result.article).toMatch(/Art\. 1067/);
  });

  it('returns exempt for customary gift', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_customary_gift: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
    expect(result.exemptionType).toMatch(/Customary/i);
  });

  it('returns exempt for wedding gift', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_wedding_gift: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
    expect(result.exemptionType).toMatch(/Wedding/i);
  });

  it('returns exempt for professional expense', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_professional_expense: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
    expect(result.exemptionType).toMatch(/Professional/i);
  });

  it('returns exempt for debt payment for child', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_debt_payment_for_child: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns exempt for election expense', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_election_expense: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns exempt for fine payment', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_fine_payment: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns exempt for joint donation from both parents', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_joint_from_both_parents: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns exempt for donation to child spouse only', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_to_child_spouse_only: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns exempt for joint donation to child and spouse', () => {
    const donation = createDonation({
      recipient_heir_id: 'lc1',
      is_joint_to_child_and_spouse: true,
    });
    const result = getDonationCollationStatus(donation, defaultPersons);
    expect(result.status).toBe('exempt');
  });

  it('returns correct status for each exemption type', () => {
    const exemptionFlags: Array<keyof Donation> = [
      'is_expressly_exempt',
      'is_support_education_medical',
      'is_customary_gift',
      'is_professional_expense',
      'is_joint_from_both_parents',
      'is_to_child_spouse_only',
      'is_joint_to_child_and_spouse',
      'is_wedding_gift',
      'is_debt_payment_for_child',
      'is_election_expense',
      'is_fine_payment',
    ];
    for (const flag of exemptionFlags) {
      const donation = createDonation({
        recipient_heir_id: 'lc1',
        [flag]: true,
      });
      const result = getDonationCollationStatus(donation, defaultPersons);
      expect(result.status).toBe('exempt');
      expect(result.exemptionType).toBeDefined();
    }
  });
});
