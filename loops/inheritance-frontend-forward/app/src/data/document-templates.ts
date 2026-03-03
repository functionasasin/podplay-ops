/**
 * Smart seeding rules for document checklist (§4.22)
 * Source: docs/plans/inheritance-premium-spec.md §4.22
 *
 * 15+ document types with conditions based on case data.
 */

import type { DocumentTemplate, DocumentSeedingContext } from '@/types';

/** All possible document templates with their required_when conditions */
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Always required
  {
    document_key: 'psa-death-cert',
    label: 'PSA Death Certificate (authenticated)',
    category: 'Identity',
    description: 'Authenticated copy of the PSA Death Certificate of the decedent.',
    required_when: 'always',
  },
  {
    document_key: 'psa-birth-certs',
    label: 'PSA Birth Certificates (all heirs)',
    category: 'Identity',
    description: 'Authenticated PSA Birth Certificates for all legal heirs.',
    required_when: 'always',
  },
  {
    document_key: 'bir-form-1904',
    label: 'BIR Form 1904 (Estate TIN)',
    category: 'Tax',
    description: 'Application for registration of estate TIN with BIR.',
    required_when: 'always',
  },
  {
    document_key: 'bir-form-1949',
    label: 'BIR Form 1949 (Notice of Death)',
    category: 'Tax',
    description: 'Notice of death filed with the BIR within 2 months from date of death.',
    required_when: 'always',
  },
  // Conditional: married
  {
    document_key: 'psa-marriage-cert',
    label: 'PSA Marriage Certificate (decedent)',
    category: 'Identity',
    description: 'Authenticated PSA Marriage Certificate of the decedent.',
    required_when: 'is_married',
  },
  // Conditional: real property
  {
    document_key: 'tct-cct',
    label: 'TCT/CCT (per real property)',
    category: 'Property',
    description: 'Transfer Certificate of Title or Condominium Certificate of Title for each real property.',
    required_when: 'has_real_property',
  },
  {
    document_key: 'tax-declaration',
    label: 'Tax Declaration (per property)',
    category: 'Property',
    description: 'Current tax declaration for each real property in the estate.',
    required_when: 'has_real_property',
  },
  {
    document_key: 'zonal-value-cert',
    label: 'Zonal Value Certification (per property)',
    category: 'Property',
    description: 'BIR Zonal Value certification for each real property.',
    required_when: 'has_real_property',
  },
  // Conditional: bank account
  {
    document_key: 'bank-cert-balance',
    label: 'Bank Certificate of Balance',
    category: 'Financial',
    description: 'Certificate of balance from each bank where the decedent held accounts.',
    required_when: 'has_bank_account',
  },
  // Conditional: EJS track
  {
    document_key: 'deed-ejs',
    label: 'Deed of Extrajudicial Settlement',
    category: 'Settlement',
    description: 'Deed of Extrajudicial Settlement signed by all heirs.',
    required_when: 'ejs_track',
  },
  {
    document_key: 'affidavit-publication',
    label: 'Affidavit of Publication',
    category: 'Settlement',
    description: 'Proof of publication in a newspaper of general circulation for 3 consecutive weeks.',
    required_when: 'ejs_track',
  },
  // Conditional: overseas heir
  {
    document_key: 'spa-overseas',
    label: 'SPA (per overseas heir)',
    category: 'Legal',
    description: 'Special Power of Attorney for each heir residing abroad.',
    required_when: 'has_overseas_heir',
  },
  // Conditional: judicial/probate track
  {
    document_key: 'court-admin',
    label: 'Court-Appointed Administrator',
    category: 'Settlement',
    description: 'Court order appointing the estate administrator.',
    required_when: 'judicial_track',
  },
  {
    document_key: 'inventory-appraisal',
    label: 'Inventory and Appraisal',
    category: 'Settlement',
    description: 'Court-ordered inventory and appraisal of the estate.',
    required_when: 'judicial_track',
  },
  // Conditional: business interest
  {
    document_key: 'business-docs',
    label: 'Business Permit / Incorporation Docs',
    category: 'Business',
    description: 'Business permits, articles of incorporation, or partnership agreements for business interests in the estate.',
    required_when: 'has_business_interest',
  },
];

/**
 * Returns the list of document templates applicable to the given case context.
 * This implements the "smart seeding" rules from §4.22.
 */
export function getApplicableDocuments(
  context: DocumentSeedingContext,
): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((tpl) => {
    switch (tpl.required_when) {
      case 'always':
        return true;
      case 'is_married':
        return context.is_married;
      case 'has_real_property':
        return context.has_real_property;
      case 'has_bank_account':
        return context.has_bank_account;
      case 'ejs_track':
        return context.settlement_track === 'ejs';
      case 'judicial_track':
        return context.settlement_track === 'judicial';
      case 'has_overseas_heir':
        return context.has_overseas_heir;
      case 'has_business_interest':
        return context.has_business_interest;
      default:
        return false;
    }
  });
}
