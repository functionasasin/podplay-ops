import { describe, it, expect } from 'vitest';
import { clientFormSchema } from '../client';

describe('crm > clientFormSchema', () => {
  const validData = {
    full_name: 'Santos, Maria Cristina',
    intake_date: '2026-03-01',
  };

  it('accepts valid minimal data (name + intake date)', () => {
    const result = clientFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      full_name: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('full_name');
    }
  });

  it('rejects name longer than 200 characters', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      full_name: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('full_name');
    }
  });

  it('accepts name with exactly 2 characters', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      full_name: 'AB',
    });
    expect(result.success).toBe(true);
  });

  it('accepts name with exactly 200 characters', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      full_name: 'A'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid 9-digit TIN', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      tin: '123-456-789',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid 12-digit TIN', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      tin: '123-456-789-012',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid TIN format', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      tin: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty TIN (optional)', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      tin: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid email', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      email: 'maria@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty email (optional)', () => {
    const result = clientFormSchema.safeParse({
      ...validData,
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing intake_date', () => {
    const result = clientFormSchema.safeParse({
      full_name: 'Test Name',
      intake_date: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid gov_id_type values', () => {
    const govIdTypes = [
      'philsys_id', 'passport', 'drivers_license', 'sss', 'gsis', 'prc',
      'voters_id', 'postal_id', 'senior_citizen_id', 'umid', 'nbi_clearance',
    ];

    for (const govIdType of govIdTypes) {
      const result = clientFormSchema.safeParse({
        ...validData,
        gov_id_type: govIdType,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid civil_status values', () => {
    const civilStatuses = ['single', 'married', 'widowed', 'legally_separated', 'annulled'];

    for (const civilStatus of civilStatuses) {
      const result = clientFormSchema.safeParse({
        ...validData,
        civil_status: civilStatus,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts full valid data with all fields', () => {
    const result = clientFormSchema.safeParse({
      full_name: 'Santos, Maria Cristina',
      nickname: 'Cristina',
      date_of_birth: '1985-06-15',
      place_of_birth: 'Manila',
      email: 'maria@example.com',
      phone: '+639171234567',
      address: '123 Main St, Makati City',
      tin: '123-456-789',
      gov_id_type: 'philsys_id',
      gov_id_number: 'PSN-1234567890',
      civil_status: 'married',
      intake_date: '2026-03-01',
      referral_source: 'Atty. Garcia',
    });
    expect(result.success).toBe(true);
  });
});
