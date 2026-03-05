import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// --------------------------------------------------------------------------
// Tests — Print Layout CSS (§4.7)
// --------------------------------------------------------------------------

const PRINT_CSS_PATH = resolve(__dirname, '../styles/print.css');

function readPrintCSS(): string {
  return readFileSync(PRINT_CSS_PATH, 'utf-8');
}

describe('print > print.css file', () => {
  it('print CSS file exists and is readable', () => {
    expect(() => readPrintCSS()).not.toThrow();
  });

  it('contains @media print block', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/@media\s+print/);
  });

  it('contains @page rule with A4 size', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/A4/i);
  });

  it('contains margins of 25mm 20mm', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/25mm/);
    expect(css).toMatch(/20mm/);
  });

  it('specifies Times New Roman font for print', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/Times New Roman/i);
  });

  it('hides elements with no-print class', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/\.no-print/);
    expect(css).toMatch(/display:\s*none/);
  });

  it('hides navigation elements in print', () => {
    const css = readPrintCSS();
    // Should hide nav, sidebar, or elements with navigation-related selectors
    expect(css).toMatch(/nav|sidebar/i);
  });

  it('shows print-header or print-only elements in print', () => {
    const css = readPrintCSS();
    // PrintHeader should be visible in print mode
    expect(css).toMatch(/print-header|print-only/i);
  });

  it('sets 12pt font size for print', () => {
    const css = readPrintCSS();
    expect(css).toMatch(/12pt/);
  });
});
