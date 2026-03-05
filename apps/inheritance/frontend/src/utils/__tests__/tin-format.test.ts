import { describe, it, expect } from 'vitest';
import { formatTIN } from '../tin-format';

describe('crm > formatTIN', () => {
  it('formats 9-digit raw string with hyphens', () => {
    expect(formatTIN('123456789')).toBe('123-456-789');
  });

  it('formats 12-digit raw string with hyphens', () => {
    expect(formatTIN('123456789012')).toBe('123-456-789-012');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatTIN('12-34-567-89')).toBe('123-456-789');
  });

  it('handles partial input (less than 3 digits)', () => {
    expect(formatTIN('12')).toBe('12');
  });

  it('handles partial input (4 digits)', () => {
    expect(formatTIN('1234')).toBe('123-4');
  });

  it('handles partial input (7 digits)', () => {
    expect(formatTIN('1234567')).toBe('123-456-7');
  });

  it('handles partial input (10 digits)', () => {
    expect(formatTIN('1234567890')).toBe('123-456-789-0');
  });

  it('returns empty string for empty input', () => {
    expect(formatTIN('')).toBe('');
  });

  it('truncates beyond 12 digits', () => {
    expect(formatTIN('1234567890123')).toBe('123-456-789-012');
  });

  it('handles already-formatted input', () => {
    expect(formatTIN('123-456-789')).toBe('123-456-789');
  });
});
