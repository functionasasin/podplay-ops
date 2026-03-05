import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_TEMPLATES,
  getApplicableDocuments,
} from '../document-templates';
import type { DocumentSeedingContext } from '@/types';

// --------------------------------------------------------------------------
// Helper: build a seeding context with overrides
// --------------------------------------------------------------------------

function makeContext(
  overrides: Partial<DocumentSeedingContext> = {},
): DocumentSeedingContext {
  return {
    is_married: false,
    has_real_property: false,
    has_bank_account: false,
    has_business_interest: false,
    has_overseas_heir: false,
    settlement_track: 'ejs',
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Tests — DOCUMENT_TEMPLATES data
// --------------------------------------------------------------------------

describe('document-checklist > DOCUMENT_TEMPLATES', () => {
  it('contains at least 15 document types', () => {
    expect(DOCUMENT_TEMPLATES.length).toBeGreaterThanOrEqual(15);
  });

  it('every template has required fields', () => {
    for (const tpl of DOCUMENT_TEMPLATES) {
      expect(tpl.document_key).toBeTruthy();
      expect(tpl.label).toBeTruthy();
      expect(tpl.category).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.required_when).toBeTruthy();
    }
  });

  it('has unique document_key values', () => {
    const keys = DOCUMENT_TEMPLATES.map((t) => t.document_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes PSA Death Certificate as always required', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'psa-death-cert',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('always');
  });

  it('includes PSA Birth Certificates as always required', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'psa-birth-certs',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('always');
  });

  it('includes BIR Form 1904 as always required', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'bir-form-1904',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('always');
  });

  it('includes BIR Form 1949 as always required', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'bir-form-1949',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('always');
  });

  it('includes Marriage Certificate with is_married condition', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'psa-marriage-cert',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('is_married');
  });

  it('includes TCT/CCT with has_real_property condition', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'tct-cct',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('has_real_property');
  });

  it('includes Deed of EJS with ejs_track condition', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'deed-ejs',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('ejs_track');
  });

  it('includes Court-Appointed Administrator with judicial_track condition', () => {
    const found = DOCUMENT_TEMPLATES.find(
      (t) => t.document_key === 'court-admin',
    );
    expect(found).toBeDefined();
    expect(found!.required_when).toBe('judicial_track');
  });
});

// --------------------------------------------------------------------------
// Tests — getApplicableDocuments (smart seeding)
// --------------------------------------------------------------------------

describe('document-checklist > getApplicableDocuments', () => {
  it('always includes the 4 "always" required documents', () => {
    const result = getApplicableDocuments(makeContext());
    const alwaysKeys = result
      .filter((d) => d.required_when === 'always')
      .map((d) => d.document_key);

    expect(alwaysKeys).toContain('psa-death-cert');
    expect(alwaysKeys).toContain('psa-birth-certs');
    expect(alwaysKeys).toContain('bir-form-1904');
    expect(alwaysKeys).toContain('bir-form-1949');
    expect(alwaysKeys).toHaveLength(4);
  });

  it('includes marriage cert only when is_married = true', () => {
    const unmarried = getApplicableDocuments(makeContext({ is_married: false }));
    expect(unmarried.find((d) => d.document_key === 'psa-marriage-cert')).toBeUndefined();

    const married = getApplicableDocuments(makeContext({ is_married: true }));
    expect(married.find((d) => d.document_key === 'psa-marriage-cert')).toBeDefined();
  });

  it('includes TCT/CCT, Tax Declaration, and Zonal Value only when real property exists', () => {
    const noProperty = getApplicableDocuments(makeContext({ has_real_property: false }));
    expect(noProperty.find((d) => d.document_key === 'tct-cct')).toBeUndefined();
    expect(noProperty.find((d) => d.document_key === 'tax-declaration')).toBeUndefined();
    expect(noProperty.find((d) => d.document_key === 'zonal-value-cert')).toBeUndefined();

    const withProperty = getApplicableDocuments(makeContext({ has_real_property: true }));
    expect(withProperty.find((d) => d.document_key === 'tct-cct')).toBeDefined();
    expect(withProperty.find((d) => d.document_key === 'tax-declaration')).toBeDefined();
    expect(withProperty.find((d) => d.document_key === 'zonal-value-cert')).toBeDefined();
  });

  it('includes Bank Certificate only when bank account exists', () => {
    const noBank = getApplicableDocuments(makeContext({ has_bank_account: false }));
    expect(noBank.find((d) => d.document_key === 'bank-cert-balance')).toBeUndefined();

    const withBank = getApplicableDocuments(makeContext({ has_bank_account: true }));
    expect(withBank.find((d) => d.document_key === 'bank-cert-balance')).toBeDefined();
  });

  it('includes EJS-specific docs only for EJS track', () => {
    const ejs = getApplicableDocuments(makeContext({ settlement_track: 'ejs' }));
    expect(ejs.find((d) => d.document_key === 'deed-ejs')).toBeDefined();
    expect(ejs.find((d) => d.document_key === 'affidavit-publication')).toBeDefined();
    expect(ejs.find((d) => d.document_key === 'court-admin')).toBeUndefined();
    expect(ejs.find((d) => d.document_key === 'inventory-appraisal')).toBeUndefined();
  });

  it('includes Probate-specific docs only for judicial track', () => {
    const judicial = getApplicableDocuments(makeContext({ settlement_track: 'judicial' }));
    expect(judicial.find((d) => d.document_key === 'court-admin')).toBeDefined();
    expect(judicial.find((d) => d.document_key === 'inventory-appraisal')).toBeDefined();
    expect(judicial.find((d) => d.document_key === 'deed-ejs')).toBeUndefined();
    expect(judicial.find((d) => d.document_key === 'affidavit-publication')).toBeUndefined();
  });

  it('includes SPA only when overseas heir exists', () => {
    const noOverseas = getApplicableDocuments(makeContext({ has_overseas_heir: false }));
    expect(noOverseas.find((d) => d.document_key === 'spa-overseas')).toBeUndefined();

    const withOverseas = getApplicableDocuments(makeContext({ has_overseas_heir: true }));
    expect(withOverseas.find((d) => d.document_key === 'spa-overseas')).toBeDefined();
  });

  it('includes Business docs only when business interest exists', () => {
    const noBusiness = getApplicableDocuments(makeContext({ has_business_interest: false }));
    expect(noBusiness.find((d) => d.document_key === 'business-docs')).toBeUndefined();

    const withBusiness = getApplicableDocuments(makeContext({ has_business_interest: true }));
    expect(withBusiness.find((d) => d.document_key === 'business-docs')).toBeDefined();
  });

  it('returns maximum docs for a complex case with all conditions true', () => {
    const all = getApplicableDocuments(
      makeContext({
        is_married: true,
        has_real_property: true,
        has_bank_account: true,
        has_business_interest: true,
        has_overseas_heir: true,
        settlement_track: 'ejs',
      }),
    );
    // 4 always + 1 married + 3 property + 1 bank + 2 ejs + 1 overseas + 1 business = 13
    expect(all.length).toBe(13);
  });

  it('returns minimal docs for an unmarried, no-asset judicial case', () => {
    const minimal = getApplicableDocuments(
      makeContext({ settlement_track: 'judicial' }),
    );
    // 4 always + 2 judicial = 6
    expect(minimal.length).toBe(6);
  });
});
