/**
 * Canonical validation error messages for all Zod schemas in PodPlay Ops Wizard.
 * Every inline error string in every schema must reference a constant from this file.
 *
 * Source of truth: loops/podplay-ops-reverse/final-mega-spec/ui-spec/validation-messages.md
 */

export const VALIDATION = {
  // ── Wizard Intake — Step 1: Venue & Contact ────────────────────────────────
  intake: {
    customer_name: {
      required: 'Customer name is required',
      max: 'Customer name must be 200 characters or less',
    },
    venue_name: {
      required: 'Venue name is required',
      max: 'Venue name must be 200 characters or less',
    },
    venue_address_line1: {
      max: 'Address line 1 must be 200 characters or less',
    },
    venue_address_line2: {
      max: 'Address line 2 must be 200 characters or less',
    },
    venue_address: {
      required: 'Venue address is required',
      max: 'Address must be 200 characters or less',
    },
    venue_city: {
      required: 'City is required',
      max: 'City must be 100 characters or less',
    },
    venue_state: {
      required: 'State is required',
      max: 'State must be 50 characters or less',
    },
    venue_zip: {
      max: 'ZIP code must be 20 characters or less',
    },
    venue_country: {
      enum: 'Country must be US or PH',
    },
    contact_name: {
      required: 'Contact name is required',
      max: 'Contact name must be 200 characters or less',
    },
    contact_email: {
      required: 'Enter a valid email address',
      format: 'Enter a valid email address',
    },
    contact_phone: {
      max: 'Phone number must be 50 characters or less',
    },

    // Step 2: Configuration
    tier: {
      required: 'Service tier is required',
    },
    court_count: {
      min: 'At least 1 court required',
      max: 'Maximum 50 courts',
      int: 'Court count must be a whole number',
    },
    door_count: {
      int: 'Door count must be 0 or more',
      min: 'Door count must be 0 or more',
      autonomous: 'Autonomous tier requires at least 1 access-controlled door',
    },
    security_camera_count: {
      int: 'Camera count must be 0 or more',
      min: 'Camera count must be 0 or more',
      autonomous_plus: 'Autonomous+ tier requires at least 1 security camera',
    },
    camera_count: {
      int: 'Camera count must be 0 or more',
      min: 'Camera count must be 0 or more',
    },

    // Step 3: Network & ISP
    isp_provider: {
      required: 'ISP provider name is required',
      max: 'ISP provider name must be 200 characters or less',
    },
    internet_download_mbps: {
      min: 'Download speed must be 0 or more',
    },
    internet_upload_mbps: {
      min: 'Upload speed must be 0 or more',
    },
    rack_size_u: {
      min: 'Rack size must be at least 7U',
      max: 'Rack size must be 42U or less',
    },

    // ISP cross-validation messages (used in IspWarningBanner / inline)
    isp: {
      starlink_block: 'Starlink is not compatible with PodPlay Replay. A different ISP is required for replay to work.',
      starlink_ack: 'Acknowledge the Starlink incompatibility warning to continue.',
      upload_fiber: (n: number, courtCount: number) =>
        `Upload speed may be insufficient. Recommended: ${n} Mbps for ${courtCount} courts on fiber.`,
      upload_cable: (minMbps: number) =>
        `Upload speed may be insufficient for cable. Minimum recommended: ${minMbps} Mbps upload.`,
      static_ip_ph: 'Static IP is mandatory for Philippines deployments. Enable \'Static IP\' above.',
      backup_isp_24_7: 'Autonomous 24/7 venues require a backup ISP. Configure a second WAN connection.',
      isp_type_unset: 'ISP type not specified — speed recommendations cannot be calculated.',
    },

    // Step 4: Timeline & Installer
    notes: {
      max: 'Notes must be 2000 characters or less',
    },
    internal_notes: {
      max: 'Internal notes must be 2000 characters or less',
    },
    installation_end_date: {
      before_start: 'End date must be on or after start date',
    },

    // Step 5: System IDs
    ddns_subdomain: {
      max: 'DDNS subdomain must be 63 characters or less',
      regex: 'DDNS subdomain may only contain lowercase letters, numbers, and hyphens',
      unique: 'This subdomain is already in use. Choose a different subdomain.',
    },
    unifi_site_name: {
      max: 'UniFi site name must be 50 characters or less',
    },
    mac_mini_username: {
      max: 'Mac Mini username must be 100 characters or less',
    },
    mac_mini_password: {
      max: 'Mac Mini password must be 200 characters or less',
    },
    location_id: {
      max: 'Location ID must be 200 characters or less',
    },

    // Step 5: Auto-fill token validations
    tokens: {
      ddns_subdomain: 'Only lowercase letters, numbers, and hyphens allowed',
      unifi_site_name: 'UniFi site name must be 64 characters or less',
      mac_mini_username: 'Must start with a letter; only lowercase letters, numbers, underscores, hyphens',
      location_id: 'Location ID must be 64 characters or less',
    },

    // Step 6: Review — blocking validation checklist
    review: {
      customer_name: 'Customer name is required',
      venue_name: 'Venue name is required',
      contact_email: 'Valid contact email is required',
      tier: 'Service tier must be selected',
      court_count: 'At least 1 court required',
      door_autonomous: 'Autonomous tier requires at least 1 door',
      camera_autonomous_plus: 'Autonomous+ requires at least 1 security camera',
      ddns_taken: 'DDNS subdomain is already taken — choose another',
      install_dates: 'Installation end date must be on or after start date',
      section_label: 'Resolve the following issues before creating the project:',
    },

    // Financial setup (step 6 in original flow)
    target_go_live_date: {
      required: 'Go-live date is required',
      future: 'Go-live date must be in the future',
    },
    deposit_amount: {
      required: 'Deposit amount is required',
      positive: 'Deposit amount must be greater than $0',
    },
  },

  // ── Wizard Intake — Toast Messages ────────────────────────────────────────
  intakeToast: {
    create_success: 'Project created successfully',
    create_error: (msg: string) => `Failed to save project: ${msg}`,
    advance_error: 'Failed to advance stage',
  },

  // ── Wizard Procurement ─────────────────────────────────────────────────────
  procurement: {
    bom: {
      qty: {
        min: 'Quantity must be 0 or more',
        max: 'Quantity must be 999 or less',
        int: 'Quantity must be a whole number',
      },
      unit_cost: {
        min: 'Cost must be 0 or more',
        max: 'Cost must be $100,000 or less',
      },
      shipping_rate: {
        min: 'Shipping rate must be 0% or more',
        max: 'Shipping rate must be 100% or less',
      },
      margin: {
        min: 'Margin must be 0% or more',
        max: 'Margin must be less than 100%',
      },
      save_error: 'Failed to save — changes reverted',
      duplicate: 'Item already in BOM — edit the existing row instead',
      regen_body: 'Regenerating the BOM will discard all manual edits (quantities, cost overrides, custom items) and reset to the auto-generated values. This cannot be undone.',
      regen_allocated: 'Cannot regenerate: some items are already allocated in inventory. Release allocations first.',
      remove_body: (itemName: string) => `Remove ${itemName} from BOM? This cannot be undone.`,
    },
    po: {
      vendor: { required: 'Vendor is required' },
      order_date: { required: 'Order date is required' },
      expected_date: { after_order: 'Expected date must be on or after order date' },
      qty_ordered: { min: 'Quantity must be at least 1' },
      unit_cost: { min: 'Cost must be greater than $0' },
      hardware_catalog_id: { required: 'Select an item' },
      items: { min: 'Add at least one item' },
      items_form_error: 'Add at least one line item before creating the purchase order.',
    },
    receiving: {
      exceeds: (qty: number, ordered: number) =>
        `Cannot receive ${qty}: would exceed ordered quantity of ${ordered}`,
      negative: 'Quantity received must be 0 or more',
      int: 'Quantity received must be a whole number',
    },
    replay_signs: {
      staged_tooltip: 'Set outreach date before marking as shipped',
      shipped_tooltip: 'Shipped date must be set before marking as delivered',
      delivered_tooltip: 'Delivered date must be set before marking as installed',
      qty: {
        min: 'Quantity must be at least 1',
        max: 'Quantity must be 200 or less',
      },
      vendor_order_id: { max: 'Order ID must be 100 characters or less' },
      tracking_number: { max: 'Tracking number must be 100 characters or less' },
      notes: { max: 'Notes must be 1000 characters or less' },
    },
    advance: {
      body: 'Advance this project to Stage 3: Deployment? The deployment checklist will be seeded from the template. This cannot be reversed.',
      guard: 'Complete all procurement steps before advancing to deployment.',
      checklist: {
        bom: 'BOM must be reviewed and quantities confirmed',
        po: 'All PO items must be received or on order',
        packing: 'Packing list must be confirmed',
        replay_signs: 'Replay signs outreach must be initiated',
      },
    },
  },

  // ── Wizard Procurement — Toast Messages ───────────────────────────────────
  procurementToast: {
    bom_save_error: 'Failed to save — changes reverted',
    bom_regen_success: 'BOM regenerated from template',
    bom_regen_error: (msg: string) => `Failed to regenerate BOM: ${msg}`,
    po_create_success: (poNumber: string) => `Purchase order ${poNumber} created`,
    po_create_error: (msg: string) => `Failed to create purchase order: ${msg}`,
    receive_success: 'Items received and added to inventory',
    receive_error: (msg: string) => `Failed to record receipt: ${msg}`,
    cc_save_success: 'CC terminal record saved',
    cc_save_error: (msg: string) => `Failed to save CC terminal: ${msg}`,
    replay_save_success: 'Replay signs record saved',
    replay_save_error: (msg: string) => `Failed to save replay signs: ${msg}`,
    advance_error: (msg: string) => `Failed to advance to deployment: ${msg}`,
  },

  // ── Wizard Deployment ─────────────────────────────────────────────────────
  deployment: {
    entry_guard: 'Procurement must be complete before deployment. [Go to Procurement →]',
    ready_to_ship_guard: 'Complete all pre-shipping checklist phases before marking ready to ship.',
    tracking_number: {
      required: 'Tracking number is required',
      max: 'Tracking number must be 100 characters or less',
    },
    notes: { max: 'Notes must be 500 characters or less' },
    installer_name: { max: 'Installer name must be 100 characters or less' },
    installation_start_date: { required: 'Start date is required' },
    go_live_date: { required: 'Go-live date is required' },
    flag_reason: {
      required: 'Reason is required',
      max: 'Reason must be 500 characters or less',
    },

    // Phase 5 ISP validation banners
    isp: {
      upload_ok: (actual: number, required: number) =>
        `Upload speed: ${actual} Mbps — meets ${required} Mbps requirement`,
      upload_insufficient: (required: number, courtCount: number, ispType: string, actual: number) =>
        `Upload speed insufficient. Required: ${required} Mbps for ${courtCount} courts (${ispType}). Actual: ${actual} Mbps.`,
      starlink: 'Starlink detected — not compatible with PodPlay Replay. A different ISP is required.',
      backup_isp: 'Autonomous 24/7: backup ISP required. Configure WAN2 on UDM.',
      static_ip_ph: 'Static IP mandatory for Philippines deployments.',
    },
  },

  // ── Wizard Deployment — Toast Messages ────────────────────────────────────
  deploymentToast: {
    ready_to_ship: 'Marked as Ready to Ship',
    shipped: (tracking: string) => `Marked as Shipped — tracking: ${tracking}`,
    shipped_error: (msg: string) => `Failed to mark as shipped: ${msg}`,
    installing: 'Installation started — Phase 12 unlocked.',
    installing_error: (msg: string) => `Failed to start installation: ${msg}`,
    complete: 'Deployment complete! Stage 4 (Financials) is now unlocked.',
    complete_error: (msg: string) => `Failed to mark deployment complete: ${msg}`,
    flag_success: 'Issue flagged — project status updated',
    flag_error: (msg: string) => `Failed to flag issue: ${msg}`,
    bulk_complete: (x: number) => `${x} steps marked complete.`,
    bulk_error: (msg: string) => `Failed to bulk complete steps: ${msg}`,
    checkbox_error: 'Failed to save — please try again.',
    note_error: 'Failed to save note.',
    status_modal_error: (msg: string) => `Failed to update status — ${msg}. Please try again.`,
  },

  // ── Wizard Financials ─────────────────────────────────────────────────────
  financials: {
    contract: {
      signed_date: {
        format: 'Date must be a valid date (YYYY-MM-DD)',
        required: 'Contract signed date is required',
      },
      guard: 'Contract must be signed before sending the deposit invoice',
    },
    deposit_invoice: {
      invoice_number: {
        required: 'Invoice number is required',
        max: 'Invoice number must be 50 characters or less',
      },
      invoice_date: { format: 'Date must be YYYY-MM-DD' },
      deposit_pct: {
        min: 'Deposit % must be at least 1%',
        max: 'Deposit % must be at most 99%',
      },
      amount: { positive: 'Amount must be greater than $0' },
      date: { required: 'Invoice date is required' },
    },
    final_invoice: {
      invoice_number: {
        required: 'Invoice number is required',
        max: 'Invoice number must be 50 characters or less',
      },
      invoice_date: { format: 'Date must be YYYY-MM-DD' },
      amount: { positive: 'Amount must be greater than $0' },
      date: { required: 'Invoice date is required' },
      guard: 'Deposit must be paid and go-live date must be set.',
      guard_toast: 'Set go-live date before sending final invoice.',
    },
    invoice_paid: {
      paid_date: {
        format: 'Date must be YYYY-MM-DD',
        required: 'Payment date is required',
      },
    },
    expense: {
      date: {
        required: 'Date is required',
        future: 'Date cannot be more than 1 day in the future',
      },
      category: { required: 'Category is required' },
      amount: {
        positive: 'Amount must be greater than $0',
        max: 'Amount must be $100,000 or less',
      },
      payment_method: { required: 'Payment method is required' },
      delete_body: 'Delete this expense? This cannot be undone.',
    },
    go_live_date: { required: 'Go-live date is required' },
    recurring_fee: {
      label: { required: 'Label is required' },
      amount: { min: 'Amount must be 0 or more' },
      start_date: { required: 'Start date is required' },
    },

    close: {
      guard: 'Both invoices must be paid to close the project',
      checklist: {
        deposit: 'Deposit invoice must be paid',
        final: 'Final invoice must be paid',
      },
      body: 'Mark this project as complete and close the financials? This cannot be undone.',
    },
  },

  // ── Wizard Financials — Toast Messages ────────────────────────────────────
  financialsToast: {
    contract_saved: 'Contract date saved',
    contract_error: (msg: string) => `Failed to save contract date: ${msg}`,
    deposit_sent: 'Deposit invoice sent',
    final_sent: 'Final invoice sent',
    paid: 'Invoice marked as paid',
    paid_error: (msg: string) => `Failed to mark invoice as paid: ${msg}`,
    expense_added: 'Expense added',
    expense_updated: 'Expense updated',
    expense_add_error: (msg: string) => `Failed to add expense: ${msg}`,
    expense_update_error: (msg: string) => `Failed to update expense: ${msg}`,
    expense_deleted: 'Expense deleted',
    expense_delete_error: (msg: string) => `Failed to delete expense: ${msg}`,
    go_live_saved: 'Go-live date saved',
    go_live_error: (msg: string) => `Failed to save go-live date: ${msg}`,
    project_closed: 'Project completed and closed',
    project_close_error: (msg: string) => `Failed to complete project: ${msg}`,
  },

  // ── Inventory View ─────────────────────────────────────────────────────────
  inventory: {
    movement_type: { required: 'Adjustment type is required' },
    qty: {
      min: 'Quantity must be at least 1',
      int: 'Quantity must be a whole number',
    },
    reason: {
      required: 'Reason is required',
      max: 'Reason must be 500 characters or less',
    },
    reorder_threshold: {
      int: 'Must be a whole number',
      min: 'Threshold must be 0 or more',
      save_error: 'Failed to save threshold',
    },
    reconciliation_footer: 'Discrepancies must be resolved by posting a manual adjustment. Contact ops if you cannot explain a discrepancy.',
  },

  // ── Inventory — Toast Messages ─────────────────────────────────────────────
  inventoryToast: {
    adjusted: 'Stock adjusted successfully',
    adjust_error: (msg: string) => `Failed to adjust stock: ${msg}`,
    po_created: (poNumber: string) => `PO ${poNumber} created`,
    po_error: (msg: string) => `Failed to create PO: ${msg}`,
    reconciled: (n: number) => `Reconciliation complete — ${n} discrepancies found`,
    reconcile_error: (msg: string) => `Failed to run reconciliation: ${msg}`,
  },

  // ── Settings View ──────────────────────────────────────────────────────────
  settings: {
    // 6.1 Pricing & Rates
    pricing: {
      fee_min: 'Fee must be 0 or more',
      shipping_rate: {
        min: 'Rate must be 0% or more',
        max: 'Rate must be 100% or less',
      },
      target_margin: {
        min: 'Margin must be 0% or more',
        max: 'Margin must be less than 100%',
      },
      sales_tax_rate: {
        min: 'Tax rate must be 0% or more',
        max: 'Tax rate must be 100% or less',
      },
      deposit_pct: {
        min: 'Deposit must be at least 1%',
        max: 'Deposit must be less than 100%',
      },
      labor_rate: { min: 'Labor rate must be 0 or more' },
      hours_per_day: {
        min: 'Must be at least 1 hour',
        max: 'Must be 24 hours or less',
      },
    },

    // 6.2 Hardware Threshold Cross-Validation
    hardware_threshold: {
      switch_24: 'Must be less than the 48-port threshold',
      ssd_1tb: 'Must be less than the 2TB threshold',
      min: 'Must be at least 1',
    },

    // 6.4 ISP Speed Settings
    isp_speed: {
      fiber: 'Must be at least 1 Mbps',
      cable: 'Must be at least 1 Mbps',
    },

    // 6.5 System Settings
    system: {
      po_number_prefix: {
        required: 'PO prefix is required',
        max: 'PO prefix must be 10 characters or less',
      },
      mac_mini_local_ip: { format: 'Must be a valid IPv4 address' },
      replay_port: {
        min: 'Port must be at least 1',
        max: 'Port must be 65535 or less',
      },
      ddns_domain: { required: 'DDNS domain is required' },
      label_sets_per_court: { min: 'Must be at least 1' },
      replay_sign_multiplier: { min: 'Must be at least 1' },
      vlan_id: {
        min: 'VLAN ID must be at least 1',
        max: 'VLAN ID must be 4094 or less',
      },
    },

    // 6.6 Hardware Catalog Item Form
    catalog: {
      sku: {
        required: 'SKU is required',
        max: 'SKU must be 50 characters or less',
        regex: 'Uppercase letters, numbers, hyphens only',
        unique: 'This SKU already exists.',
        help: 'SKU cannot be changed after creation — it is referenced by BOM templates and inventory.',
      },
      name: {
        required: 'Name is required',
        max: 'Name must be 200 characters or less',
      },
      model: { max: 'Model must be 100 characters or less' },
      category: { required: 'Category is required' },
      vendor: {
        required: 'Vendor is required',
        max: 'Vendor must be 100 characters or less',
      },
      vendor_url: { format: 'Enter a valid URL (e.g., https://example.com)' },
      unit_cost: { min: 'Cost must be 0 or more' },
      notes: { max: 'Notes must be 500 characters or less' },
      deactivate_body: (itemName: string) =>
        `Deactivate ${itemName}? It will no longer appear in BOM generation or PO creation. Existing inventory and BOM references are preserved.`,
    },

    // 6.7 OpEx Settings
    opex: {
      rent_per_year: { min: 'Rent must be 0 or more' },
      indirect_salaries_per_year: { min: 'Indirect salaries must be 0 or more' },
    },

    // 6.8 Travel Defaults
    travel: {
      lodging_per_day: { min: 'Lodging rate must be 0 or more' },
      airfare_default: { min: 'Airfare must be 0 or more' },
      hours_per_day: {
        min: 'Must be at least 1 hour',
        max: 'Must be 24 hours or less',
      },
    },

    // 6.3 Installer Form
    installer: {
      name: { required: 'Name is required', max: 'Name too long' },
      email: { format: 'Invalid email' },
      hourly_rate: { min: 'Rate must be 0 or more' },
    },

    // 6.4 Vendor Form
    vendor: {
      name: { required: 'Name is required', max: 'Name too long' },
      email: { format: 'Invalid email' },
    },

    // 6.9 Team Contacts
    contact: {
      name: {
        required: 'Name is required',
        max: 'Name must be 100 characters or less',
      },
      role: {
        required: 'Role is required',
        max: 'Role must be 200 characters or less',
      },
      department: { required: 'Department is required' },
      phone: { max: 'Phone must be 30 characters or less' },
      email: { format: 'Enter a valid email address' },
      contact_via: { max: 'Contact via must be 100 characters or less' },
      support_tier: { range: 'Support tier must be 1, 2, or 3' },
      notes: { max: 'Notes must be 1000 characters or less' },
    },
  },

  // ── Settings — Toast Messages ──────────────────────────────────────────────
  settingsToast: {
    saved: 'Settings saved',
    save_error: (msg: string) => `Failed to save settings: ${msg}`,
    catalog_added: 'Item added to catalog',
    catalog_add_error: (msg: string) => `Failed to add item: ${msg}`,
    catalog_updated: 'Item updated',
    catalog_update_error: (msg: string) => `Failed to update item: ${msg}`,
    catalog_deactivated: 'Item deactivated',
    catalog_deactivate_error: (msg: string) => `Failed to deactivate item: ${msg}`,
    contact_added: 'Contact added',
    contact_add_error: (msg: string) => `Failed to add contact: ${msg}`,
    contact_updated: 'Contact updated',
    contact_update_error: (msg: string) => `Failed to update contact: ${msg}`,
    contact_deleted: 'Contact deleted',
    contact_delete_error: (msg: string) => `Failed to delete contact: ${msg}`,
  },

  // ── Global / Cross-Cutting ─────────────────────────────────────────────────
  global: {
    route_error: 'Something went wrong',
    session_expired: 'Session expired — please sign in again',
    unauthorized: 'You do not have permission to perform this action',
    network_timeout: 'Request timed out — check your connection and try again',
    unexpected: 'An unexpected error occurred. Please try again.',
  },

  // ── New Project Form ───────────────────────────────────────────────────────
  newProject: {
    project_name: { min: 'Project name must be at least 2 characters' },
    customer_name: { min: 'Customer name must be at least 2 characters' },
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  auth: {
    email: { format: 'Enter a valid email address' },
    password: { min: 'Password must be at least 6 characters' },
  },
} as const;
