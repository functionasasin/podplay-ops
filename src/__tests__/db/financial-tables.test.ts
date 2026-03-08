// Integration tests: financial tables (invoices, expenses, cc_terminals, replay_signs)
// Requires local Supabase running: npx supabase start
// Run: cd apps/podplay && npx vitest run src/__tests__/db/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
// Local dev defaults — not secret
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Helper: create a project for FK tests
async function createTestProject(suffix: string) {
  const { data, error } = await admin
    .from('projects')
    .insert({
      customer_name: `FIN Test Club ${suffix}`,
      venue_name: `FIN Test Venue ${suffix}`,
      tier: 'pro',
      court_count: 4,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data!;
}

// ─── invoices ──────────────────────────────────────────────────────────────────

describe('invoices table', () => {
  const projectIds: string[] = [];
  const invoiceIds: string[] = [];

  afterEach(async () => {
    if (invoiceIds.length > 0) {
      await admin.from('invoices').delete().in('id', invoiceIds);
      invoiceIds.length = 0;
    }
    if (projectIds.length > 0) {
      await admin.from('projects').delete().in('id', projectIds);
      projectIds.length = 0;
    }
  });

  it('creates a deposit invoice for a project and verifies all fields', async () => {
    const project = await createTestProject('INV-DEPOSIT');
    projectIds.push(project.id);

    const { data: invoice, error } = await admin
      .from('invoices')
      .insert({
        project_id: project.id,
        invoice_number: 'INV-001',
        type: 'deposit',
        amount: 5000.0,
        tax_amount: 512.5,
        total_amount: 5512.5,
        status: 'not_sent',
        issued_date: '2026-03-01',
        due_date: '2026-03-15',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(invoice).not.toBeNull();
    invoiceIds.push(invoice!.id);

    expect(invoice!.project_id).toBe(project.id);
    expect(invoice!.invoice_number).toBe('INV-001');
    expect(invoice!.type).toBe('deposit');
    expect(parseFloat(invoice!.amount)).toBe(5000.0);
    expect(parseFloat(invoice!.tax_amount)).toBe(512.5);
    expect(parseFloat(invoice!.total_amount)).toBe(5512.5);
    expect(invoice!.status).toBe('not_sent');
    expect(invoice!.issued_date).toBe('2026-03-01');
    expect(invoice!.due_date).toBe('2026-03-15');
    expect(invoice!.paid_date).toBeNull();
    expect(invoice!.id).toBeTruthy();
    expect(invoice!.created_at).toBeTruthy();
    expect(invoice!.updated_at).toBeTruthy();
  });

  it('creates invoices of each type: deposit, final, change_order', async () => {
    const project = await createTestProject('INV-TYPES');
    projectIds.push(project.id);

    const invoiceTypes = ['deposit', 'final', 'change_order'] as const;

    for (const [i, invoiceType] of invoiceTypes.entries()) {
      const { data: invoice, error } = await admin
        .from('invoices')
        .insert({
          project_id: project.id,
          invoice_number: `INV-TYPE-${i + 1}`,
          type: invoiceType,
          amount: 1000.0,
          tax_amount: 102.5,
          total_amount: 1102.5,
          status: 'not_sent',
          issued_date: '2026-03-01',
          due_date: '2026-03-15',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(invoice).not.toBeNull();
      invoiceIds.push(invoice!.id);
      expect(invoice!.type).toBe(invoiceType);
    }
  });

  it('updates invoice status through lifecycle: not_sent -> sent -> paid', async () => {
    const project = await createTestProject('INV-STATUS');
    projectIds.push(project.id);

    const { data: invoice, error: insertError } = await admin
      .from('invoices')
      .insert({
        project_id: project.id,
        invoice_number: 'INV-LIFECYCLE',
        type: 'deposit',
        amount: 3000.0,
        tax_amount: 307.5,
        total_amount: 3307.5,
        status: 'not_sent',
        issued_date: '2026-03-01',
        due_date: '2026-03-15',
      })
      .select()
      .single();

    expect(insertError).toBeNull();
    invoiceIds.push(invoice!.id);
    expect(invoice!.status).toBe('not_sent');

    // Advance to sent
    const { data: sent, error: sentError } = await admin
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoice!.id)
      .select()
      .single();

    expect(sentError).toBeNull();
    expect(sent!.status).toBe('sent');

    // Advance to paid
    const { data: paid, error: paidError } = await admin
      .from('invoices')
      .update({ status: 'paid', paid_date: '2026-03-20' })
      .eq('id', invoice!.id)
      .select()
      .single();

    expect(paidError).toBeNull();
    expect(paid!.status).toBe('paid');
    expect(paid!.paid_date).toBe('2026-03-20');
  });

  it('rejects invalid invoice status value', async () => {
    const project = await createTestProject('INV-ENUM');
    projectIds.push(project.id);

    const { error } = await admin
      .from('invoices')
      .insert({
        project_id: project.id,
        invoice_number: 'INV-BAD',
        type: 'deposit',
        amount: 1000.0,
        tax_amount: 102.5,
        total_amount: 1102.5,
        status: 'invalid_status' as string,
        issued_date: '2026-03-01',
        due_date: '2026-03-15',
      })
      .select()
      .single();

    expect(error).not.toBeNull();
  });
});

// ─── expenses ──────────────────────────────────────────────────────────────────

describe('expenses table', () => {
  const projectIds: string[] = [];
  const expenseIds: string[] = [];

  afterEach(async () => {
    if (expenseIds.length > 0) {
      await admin.from('expenses').delete().in('id', expenseIds);
      expenseIds.length = 0;
    }
    if (projectIds.length > 0) {
      await admin.from('projects').delete().in('id', projectIds);
      projectIds.length = 0;
    }
  });

  it('creates expenses across all 12 expense categories', async () => {
    const project = await createTestProject('EXP-CATS');
    projectIds.push(project.id);

    const allCategories = [
      'airfare',
      'car',
      'fuel',
      'lodging',
      'meals',
      'misc_hardware',
      'outbound_shipping',
      'professional_services',
      'taxi',
      'train',
      'parking',
      'other',
    ] as const;

    for (const category of allCategories) {
      const { data: expense, error } = await admin
        .from('expenses')
        .insert({
          project_id: project.id,
          category,
          description: `Test ${category} expense`,
          amount: 100.0,
          payment_method: 'podplay_card',
          vendor: 'Test Vendor',
          expense_date: '2026-03-01',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(expense).not.toBeNull();
      expenseIds.push(expense!.id);
      expect(expense!.category).toBe(category);
    }
  });

  it('creates an expense without project_id (general expense)', async () => {
    const { data: expense, error } = await admin
      .from('expenses')
      .insert({
        category: 'other',
        description: 'General office expense',
        amount: 250.0,
        payment_method: 'ramp_reimburse',
        vendor: 'Office Supply Co',
        expense_date: '2026-03-01',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(expense).not.toBeNull();
    expenseIds.push(expense!.id);

    expect(expense!.project_id).toBeNull();
    expect(expense!.category).toBe('other');
    expect(parseFloat(expense!.amount)).toBe(250.0);
    expect(expense!.payment_method).toBe('ramp_reimburse');
  });
});

// ─── cc_terminals ──────────────────────────────────────────────────────────────

describe('cc_terminals table', () => {
  const projectIds: string[] = [];
  const terminalIds: string[] = [];

  afterEach(async () => {
    if (terminalIds.length > 0) {
      await admin.from('cc_terminals').delete().in('id', terminalIds);
      terminalIds.length = 0;
    }
    if (projectIds.length > 0) {
      await admin.from('projects').delete().in('id', projectIds);
      projectIds.length = 0;
    }
  });

  it('creates a cc_terminal row and updates status from ordered to deployed', async () => {
    const project = await createTestProject('CC-STATUS');
    projectIds.push(project.id);

    const { data: terminal, error: insertError } = await admin
      .from('cc_terminals')
      .insert({
        project_id: project.id,
        serial_number: 'SN-BBPOS-001',
        model: 'BBPOS WisePOS E',
        status: 'ordered',
      })
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(terminal).not.toBeNull();
    terminalIds.push(terminal!.id);

    expect(terminal!.project_id).toBe(project.id);
    expect(terminal!.serial_number).toBe('SN-BBPOS-001');
    expect(terminal!.model).toBe('BBPOS WisePOS E');
    expect(terminal!.status).toBe('ordered');

    // Update to deployed
    const { data: deployed, error: deployError } = await admin
      .from('cc_terminals')
      .update({ status: 'deployed', deployed_date: '2026-03-10' })
      .eq('id', terminal!.id)
      .select()
      .single();

    expect(deployError).toBeNull();
    expect(deployed!.status).toBe('deployed');
    expect(deployed!.deployed_date).toBe('2026-03-10');
  });
});

// ─── replay_signs ──────────────────────────────────────────────────────────────

describe('replay_signs table', () => {
  const projectIds: string[] = [];
  const signIds: string[] = [];

  afterEach(async () => {
    if (signIds.length > 0) {
      await admin.from('replay_signs').delete().in('id', signIds);
      signIds.length = 0;
    }
    if (projectIds.length > 0) {
      await admin.from('projects').delete().in('id', projectIds);
      projectIds.length = 0;
    }
  });

  it('creates a replay_sign row and verifies quantity and status tracking', async () => {
    const project = await createTestProject('SIGN-QTY');
    projectIds.push(project.id);

    // court_count = 4, qty = 4 × 2 = 8
    const { data: sign, error } = await admin
      .from('replay_signs')
      .insert({
        project_id: project.id,
        quantity: 8,
        status: 'ordered',
        order_date: '2026-03-01',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(sign).not.toBeNull();
    signIds.push(sign!.id);

    expect(sign!.project_id).toBe(project.id);
    expect(sign!.quantity).toBe(8);
    expect(sign!.status).toBe('ordered');
    expect(sign!.order_date).toBe('2026-03-01');
    expect(sign!.ship_date).toBeNull();
    expect(sign!.install_date).toBeNull();

    // Advance status to installed
    const { data: installed, error: updateError } = await admin
      .from('replay_signs')
      .update({ status: 'installed', install_date: '2026-03-15' })
      .eq('id', sign!.id)
      .select()
      .single();

    expect(updateError).toBeNull();
    expect(installed!.status).toBe('installed');
    expect(installed!.install_date).toBe('2026-03-15');
  });
});

// ─── FK cascade ────────────────────────────────────────────────────────────────

describe('FK cascade: delete project removes invoices, expenses, cc_terminals, replay_signs', () => {
  it('deletes all child rows when project is deleted', async () => {
    // Create project
    const project = await createTestProject('FK-CASCADE');

    // Create an invoice
    const { data: invoice, error: invError } = await admin
      .from('invoices')
      .insert({
        project_id: project.id,
        invoice_number: 'INV-CASCADE',
        type: 'deposit',
        amount: 1000.0,
        tax_amount: 102.5,
        total_amount: 1102.5,
        status: 'not_sent',
        issued_date: '2026-03-01',
        due_date: '2026-03-15',
      })
      .select()
      .single();
    expect(invError).toBeNull();

    // Create an expense
    const { data: expense, error: expError } = await admin
      .from('expenses')
      .insert({
        project_id: project.id,
        category: 'airfare',
        description: 'Flight to venue',
        amount: 500.0,
        payment_method: 'podplay_card',
        vendor: 'Delta Airlines',
        expense_date: '2026-03-01',
      })
      .select()
      .single();
    expect(expError).toBeNull();

    // Create a cc_terminal
    const { data: terminal, error: termError } = await admin
      .from('cc_terminals')
      .insert({
        project_id: project.id,
        serial_number: 'SN-CASCADE-001',
        model: 'BBPOS WisePOS E',
        status: 'ordered',
      })
      .select()
      .single();
    expect(termError).toBeNull();

    // Create a replay_sign
    const { data: sign, error: signError } = await admin
      .from('replay_signs')
      .insert({
        project_id: project.id,
        quantity: 8,
        status: 'ordered',
        order_date: '2026-03-01',
      })
      .select()
      .single();
    expect(signError).toBeNull();

    // Delete the project — should cascade
    const { error: deleteError } = await admin
      .from('projects')
      .delete()
      .eq('id', project.id);
    expect(deleteError).toBeNull();

    // Confirm all child rows are gone
    const { data: foundInvoice } = await admin
      .from('invoices')
      .select()
      .eq('id', invoice!.id)
      .maybeSingle();
    expect(foundInvoice).toBeNull();

    const { data: foundExpense } = await admin
      .from('expenses')
      .select()
      .eq('id', expense!.id)
      .maybeSingle();
    expect(foundExpense).toBeNull();

    const { data: foundTerminal } = await admin
      .from('cc_terminals')
      .select()
      .eq('id', terminal!.id)
      .maybeSingle();
    expect(foundTerminal).toBeNull();

    const { data: foundSign } = await admin
      .from('replay_signs')
      .select()
      .eq('id', sign!.id)
      .maybeSingle();
    expect(foundSign).toBeNull();
  });
});
