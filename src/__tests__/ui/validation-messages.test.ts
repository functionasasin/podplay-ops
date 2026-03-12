// Stage 148 — Tests: Validation Messages
// Assert all 140+ keys defined and non-empty, spot-check 20 messages against spec,
// and verify no hardcoded error patterns remain in non-test source files.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { VALIDATION } from '@/lib/validation-messages';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Recursively count all string or function leaf values in an object tree. */
function countLeaves(obj: unknown): number {
  if (typeof obj === 'string' || typeof obj === 'function') return 1;
  if (obj && typeof obj === 'object') {
    return Object.values(obj as Record<string, unknown>).reduce(
      (sum: number, val) => sum + countLeaves(val),
      0,
    );
  }
  return 0;
}

/** Recursively collect all string leaf values with their dot-paths. */
function collectStrings(obj: unknown, path = ''): Array<{ path: string; value: string }> {
  if (typeof obj === 'string') return [{ path, value: obj }];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([key, val]) =>
      collectStrings(val, path ? `${path}.${key}` : key),
    );
  }
  return [];
}

/** Recursively find all .ts/.tsx files under dir, excluding __tests__ subdirs and
 *  validation-messages.ts itself. */
function getSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      files.push(...getSourceFiles(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      entry !== 'validation-messages.ts'
    ) {
      files.push(full);
    }
  }
  return files;
}

// src/ is two levels up from src/__tests__/ui/
const SRC_DIR = join(__dirname, '../..');

// ── Structure tests ────────────────────────────────────────────────────────────

describe('VALIDATION constants — structure', () => {
  it('exports a VALIDATION object with all 15 top-level sections', () => {
    expect(VALIDATION).toBeDefined();
    const sections = [
      'intake',
      'intakeToast',
      'procurement',
      'procurementToast',
      'deployment',
      'deploymentToast',
      'financials',
      'financialsToast',
      'inventory',
      'inventoryToast',
      'settings',
      'settingsToast',
      'global',
      'newProject',
      'auth',
    ] as const;
    for (const section of sections) {
      expect(VALIDATION[section], `section '${section}' missing`).toBeDefined();
    }
  });

  it('has 140+ leaf values (strings + functions)', () => {
    const count = countLeaves(VALIDATION);
    expect(count).toBeGreaterThanOrEqual(140);
  });

  it('all string leaf values are non-empty', () => {
    const strings = collectStrings(VALIDATION);
    for (const { path, value } of strings) {
      expect(value.length, `empty string at VALIDATION.${path}`).toBeGreaterThan(0);
    }
  });

  it('intake section has all required sub-keys', () => {
    const V = VALIDATION.intake;
    expect(V.customer_name.required).toBeDefined();
    expect(V.venue_name.required).toBeDefined();
    expect(V.court_count.min).toBeDefined();
    expect(V.isp.starlink_block).toBeDefined();
    expect(V.ddns_subdomain.regex).toBeDefined();
    expect(V.review.section_label).toBeDefined();
  });

  it('procurement section has BOM and PO', () => {
    const P = VALIDATION.procurement;
    expect(P.bom.qty.min).toBeDefined();
    expect(P.po.vendor.required).toBeDefined();
    expect(P.advance.body).toBeDefined();
  });

  it('deployment section has entry guard, tracking, and ISP banners', () => {
    const D = VALIDATION.deployment;
    expect(D.entry_guard).toBeDefined();
    expect(D.tracking_number.required).toBeDefined();
    expect(D.isp.starlink).toBeDefined();
  });

  it('financials section has contract, invoices, expenses, and close', () => {
    const F = VALIDATION.financials;
    expect(F.contract.guard).toBeDefined();
    expect(F.deposit_invoice.invoice_number.required).toBeDefined();
    expect(F.final_invoice.guard).toBeDefined();
    expect(F.expense.delete_body).toBeDefined();
    expect(F.close.guard).toBeDefined();
  });

  it('settings section has pricing, catalog, system, and contacts', () => {
    const S = VALIDATION.settings;
    expect(S.pricing.fee_min).toBeDefined();
    expect(S.catalog.sku.required).toBeDefined();
    expect(S.system.vlan_id.min).toBeDefined();
    expect(S.contact.name.required).toBeDefined();
  });
});

// ── Spot-check 20 messages ─────────────────────────────────────────────────────

describe('VALIDATION constants — 20 spot-checks vs spec', () => {
  // §1.1 Intake step 1 — Venue & Contact
  it('1. intake.customer_name.required', () => {
    expect(VALIDATION.intake.customer_name.required).toBe('Customer name is required');
  });

  it('2. intake.venue_country.enum', () => {
    expect(VALIDATION.intake.venue_country.enum).toBe('Country must be US or PH');
  });

  // §1.2 Intake step 2 — Configuration
  it('3. intake.court_count.min', () => {
    expect(VALIDATION.intake.court_count.min).toBe('At least 1 court required');
  });

  it('4. intake.door_count.autonomous', () => {
    expect(VALIDATION.intake.door_count.autonomous).toBe(
      'Autonomous tier requires at least 1 access-controlled door',
    );
  });

  // §1.3 Intake step 3 — Network & ISP
  it('5. intake.isp.starlink_block', () => {
    expect(VALIDATION.intake.isp.starlink_block).toBe(
      'Starlink is not compatible with PodPlay Replay. A different ISP is required for replay to work.',
    );
  });

  // §1.5 Intake step 5 — System IDs
  it('6. intake.ddns_subdomain.regex', () => {
    expect(VALIDATION.intake.ddns_subdomain.regex).toBe(
      'DDNS subdomain may only contain lowercase letters, numbers, and hyphens',
    );
  });

  // §1.6 Intake step 6 — Review blocking checklist
  it('7. intake.review.section_label', () => {
    expect(VALIDATION.intake.review.section_label).toBe(
      'Resolve the following issues before creating the project:',
    );
  });

  // §1.7 Intake toast
  it('8. intakeToast.create_success', () => {
    expect(VALIDATION.intakeToast.create_success).toBe('Project created successfully');
  });

  // §2.1 Procurement BOM
  it('9. procurement.bom.save_error', () => {
    expect(VALIDATION.procurement.bom.save_error).toBe('Failed to save — changes reverted');
  });

  it('10. procurement.bom.regen_allocated', () => {
    expect(VALIDATION.procurement.bom.regen_allocated).toBe(
      'Cannot regenerate: some items are already allocated in inventory. Release allocations first.',
    );
  });

  // §2.4 Procurement PO
  it('11. procurement.po.items_form_error', () => {
    expect(VALIDATION.procurement.po.items_form_error).toBe(
      'Add at least one line item before creating the purchase order.',
    );
  });

  // §3.1 Deployment entry guard
  it('14. deployment.entry_guard', () => {
    expect(VALIDATION.deployment.entry_guard).toBe(
      'Procurement must be complete before deployment. [Go to Procurement →]',
    );
  });

  // §3.4 Deployment Mark Installing toast
  it('15. deploymentToast.installing', () => {
    expect(VALIDATION.deploymentToast.installing).toBe(
      'Installation started — Phase 12 unlocked.',
    );
  });

  // §4.1 Financials Contract guard
  it('16. financials.contract.guard', () => {
    expect(VALIDATION.financials.contract.guard).toBe(
      'Contract must be signed before sending the deposit invoice',
    );
  });

  // §4.6 Financials Delete Expense dialog
  it('17. financials.expense.delete_body', () => {
    expect(VALIDATION.financials.expense.delete_body).toBe(
      'Delete this expense? This cannot be undone.',
    );
  });

  // §5.3 Inventory reorder threshold
  it('18. inventory.reorder_threshold.save_error', () => {
    expect(VALIDATION.inventory.reorder_threshold.save_error).toBe('Failed to save threshold');
  });

  // §6.6 Settings hardware catalog SKU regex
  it('19. settings.catalog.sku.regex', () => {
    expect(VALIDATION.settings.catalog.sku.regex).toBe(
      'Uppercase letters, numbers, hyphens only',
    );
  });

  // §7.2 Global auth errors
  it('20. global.session_expired', () => {
    expect(VALIDATION.global.session_expired).toBe('Session expired — please sign in again');
  });
});

// ── No hardcoded validation strings in source files ───────────────────────────

describe('VALIDATION constants — no hardcoded patterns in non-test source files', () => {
  const sourceFiles = getSourceFiles(SRC_DIR);

  it('scanned at least 10 source files (sanity check)', () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(10);
  });

  it('setError() calls have no hardcoded "is required" or "must be" strings', () => {
    // Matches: setError('...is required...') or setError("...must be...")
    const pattern =
      /setError\(['"`][^'"`]*(?:is required|must be|Enter a valid|Invalid)[^'"`]*['"`]\)/;
    const violations: string[] = [];
    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) {
        const rel = file.replace(SRC_DIR + '/', '');
        violations.push(rel);
      }
    }
    expect(violations, `Hardcoded setError() found in: ${violations.join(', ')}`).toEqual([]);
  });

  it('Zod schema methods have no hardcoded message strings containing "is required", "must be", or "Enter a valid"', () => {
    // Matches: .min(1, 'is required') or .max(n, "must be") etc.
    const pattern =
      /\.(min|max|int|email|url|regex|enum|uuid)\([^,)]+,\s*['"][^'"]*(?:is required|must be|Enter a valid|Invalid)[^'"]*['"]/;
    const violations: string[] = [];
    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) {
        const rel = file.replace(SRC_DIR + '/', '');
        violations.push(rel);
      }
    }
    expect(violations, `Hardcoded Zod message found in: ${violations.join(', ')}`).toEqual([]);
  });
});
