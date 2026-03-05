import type { Donation, Person } from '../../types';

export type CollationStatus = 'collatable' | 'exempt' | 'stranger';

export interface CollationResult {
  status: CollationStatus;
  exemptionType?: string;
  article?: string;
}

/**
 * Determine the collation status of a donation based on its properties.
 * Maps to Art. 1062–1070 NCC exemption types.
 */
export function getDonationCollationStatus(
  donation: Donation,
  _persons: Person[],
): CollationResult {
  // Stranger donations are never subject to collation
  if (donation.recipient_is_stranger) {
    return { status: 'stranger' };
  }

  // Check exemption flags — Art. 1062–1070 NCC
  if (donation.is_expressly_exempt) {
    return {
      status: 'exempt',
      exemptionType: 'Express Exemption by Donor',
      article: 'Art. 1062 NCC',
    };
  }

  if (donation.is_joint_to_child_and_spouse) {
    return {
      status: 'exempt',
      exemptionType: 'Joint Donation to Child and Spouse',
      article: 'Art. 1063 NCC',
    };
  }

  if (donation.is_to_child_spouse_only) {
    return {
      status: 'exempt',
      exemptionType: 'Donation to Child Spouse Only',
      article: 'Art. 1064 NCC',
    };
  }

  if (donation.is_joint_from_both_parents) {
    return {
      status: 'exempt',
      exemptionType: 'Joint Donation from Both Parents',
      article: 'Art. 1065 NCC',
    };
  }

  if (donation.is_professional_expense) {
    return {
      status: 'exempt',
      exemptionType: 'Professional Expense',
      article: 'Art. 1066 NCC',
    };
  }

  if (donation.is_support_education_medical) {
    return {
      status: 'exempt',
      exemptionType: 'Support/Education/Medical',
      article: 'Art. 1067 NCC',
    };
  }

  if (donation.is_customary_gift) {
    return {
      status: 'exempt',
      exemptionType: 'Customary Gift',
      article: 'Art. 1067 NCC',
    };
  }

  if (donation.is_debt_payment_for_child) {
    return {
      status: 'exempt',
      exemptionType: 'Debt Payment for Child',
      article: 'Art. 1068 NCC',
    };
  }

  if (donation.is_election_expense) {
    return {
      status: 'exempt',
      exemptionType: 'Election Expense',
      article: 'Art. 1069 NCC',
    };
  }

  if (donation.is_fine_payment) {
    return {
      status: 'exempt',
      exemptionType: 'Fine Payment',
      article: 'Art. 1069 NCC',
    };
  }

  if (donation.is_wedding_gift) {
    return {
      status: 'exempt',
      exemptionType: 'Wedding Gift',
      article: 'Art. 1070 NCC',
    };
  }

  // Default: collatable (Art. 1061 NCC)
  return { status: 'collatable' };
}
