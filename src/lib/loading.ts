/**
 * Form-submit loader configs for every mutating action in the app.
 * Each config defines the idle label, pending label, and whether the button
 * should be disabled while submitting.
 */

export interface LoaderConfig {
  /** Label shown when button is idle */
  idleLabel: string
  /** Label shown when form is submitting */
  pendingLabel: string
  /** Whether button should be disabled while submitting (always true) */
  disabled: boolean
}

function loader(idleLabel: string, pendingLabel: string): LoaderConfig {
  return { idleLabel, pendingLabel, disabled: true }
}

// ─── Login (2) ─────────────────────────────────────────────────────────────

export const LOADER_LOGIN_SIGN_IN = loader('Sign In', 'Signing in...')
export const LOADER_LOGIN_MAGIC_LINK = loader('Send magic link', 'Sending...')

// ─── Intake Wizard (3) ──────────────────────────────────────────────────────

export const LOADER_INTAKE_CONTINUE = loader('Continue', 'Saving...')
export const LOADER_INTAKE_SUBMIT_BOM = loader('Submit & Generate BOM', 'Generating BOM...')
export const LOADER_INTAKE_SAVE_CHANGES = loader('Save Changes', 'Saving...')

// ─── Procurement — BOM (3) ──────────────────────────────────────────────────

export const LOADER_PROCUREMENT_ADD_BOM_ITEM = loader('Add Item', 'Adding...')
export const LOADER_PROCUREMENT_EDIT_BOM_ITEM = loader('Save Changes', 'Saving...')
export const LOADER_PROCUREMENT_DELETE_BOM_ITEM = loader('Delete', 'Deleting...')

// ─── Procurement — Purchase Orders (2) ─────────────────────────────────────

export const LOADER_PROCUREMENT_CREATE_PO = loader('Create PO', 'Creating...')
export const LOADER_PROCUREMENT_MARK_RECEIVED = loader('Mark Received', 'Saving...')

// ─── Procurement — Packing & Stage Advance (2) ──────────────────────────────

export const LOADER_PROCUREMENT_CONFIRM_PACKING = loader('Confirm Packing', 'Confirming...')
export const LOADER_PROCUREMENT_MARK_READY = loader('Mark Ready for Deployment', 'Advancing...')

// ─── Deployment — Status Transitions (6) ────────────────────────────────────

export const LOADER_DEPLOYMENT_START_CONFIG = loader('Start Configuration', 'Updating...')
export const LOADER_DEPLOYMENT_MARK_READY_TO_SHIP = loader('Mark Ready to Ship', 'Updating...')
export const LOADER_DEPLOYMENT_MARK_SHIPPED = loader('Mark Shipped', 'Updating...')
export const LOADER_DEPLOYMENT_MARK_INSTALLING = loader('Mark Installing', 'Updating...')
export const LOADER_DEPLOYMENT_START_QC = loader('Start QC', 'Updating...')
export const LOADER_DEPLOYMENT_MARK_COMPLETE = loader('Mark Deployment Complete', 'Completing...')

// ─── Financials — Contract & Invoicing (5) ──────────────────────────────────

export const LOADER_FINANCIALS_MARK_CONTRACT_SIGNED = loader('Mark as Signed', 'Saving...')
export const LOADER_FINANCIALS_SEND_DEPOSIT_INVOICE = loader('Send Invoice', 'Sending...')
export const LOADER_FINANCIALS_MARK_DEPOSIT_PAID = loader('Mark as Paid', 'Saving...')
export const LOADER_FINANCIALS_SEND_FINAL_INVOICE = loader('Send Invoice', 'Sending...')
export const LOADER_FINANCIALS_MARK_FINAL_PAID = loader('Mark as Paid', 'Saving...')

// ─── Financials — Expenses (3) ───────────────────────────────────────────────

export const LOADER_FINANCIALS_ADD_EXPENSE = loader('Add Expense', 'Adding...')
export const LOADER_FINANCIALS_EDIT_EXPENSE = loader('Save Changes', 'Saving...')
export const LOADER_FINANCIALS_DELETE_EXPENSE = loader('Delete', 'Deleting...')

// ─── Financials — Go-Live & Close (2) ───────────────────────────────────────

export const LOADER_FINANCIALS_SET_GO_LIVE_DATE = loader('Save Date', 'Saving...')
export const LOADER_FINANCIALS_MARK_PROJECT_COMPLETE = loader('Mark Complete', 'Completing...')

// ─── Inventory (4) ───────────────────────────────────────────────────────────

export const LOADER_INVENTORY_ADJUST_STOCK = loader('Save Adjustment', 'Saving...')
export const LOADER_INVENTORY_CREATE_PO = loader('Create PO', 'Creating...')
export const LOADER_INVENTORY_MARK_PO_RECEIVED = loader('Mark Received', 'Saving...')
export const LOADER_INVENTORY_UPDATE_REORDER_THRESHOLD = loader('Save', 'Saving...')

// ─── Settings (6) ────────────────────────────────────────────────────────────

export const LOADER_SETTINGS_SAVE_PRICING = loader('Save Changes', 'Saving...')
export const LOADER_SETTINGS_CATALOG_ADD_ITEM = loader('Add Item', 'Adding...')
export const LOADER_SETTINGS_CATALOG_EDIT_ITEM = loader('Save Changes', 'Saving...')
export const LOADER_SETTINGS_CATALOG_DELETE_ITEM = loader('Delete', 'Deleting...')
export const LOADER_SETTINGS_SAVE_TEAM = loader('Save Changes', 'Saving...')

// ─── Lookup map (all 34 configs) ─────────────────────────────────────────────

export const LOADERS = {
  // Login
  loginSignIn: LOADER_LOGIN_SIGN_IN,
  loginMagicLink: LOADER_LOGIN_MAGIC_LINK,
  // Intake
  intakeContinue: LOADER_INTAKE_CONTINUE,
  intakeSubmitBom: LOADER_INTAKE_SUBMIT_BOM,
  intakeSaveChanges: LOADER_INTAKE_SAVE_CHANGES,
  // Procurement — BOM
  procurementAddBomItem: LOADER_PROCUREMENT_ADD_BOM_ITEM,
  procurementEditBomItem: LOADER_PROCUREMENT_EDIT_BOM_ITEM,
  procurementDeleteBomItem: LOADER_PROCUREMENT_DELETE_BOM_ITEM,
  // Procurement — POs
  procurementCreatePo: LOADER_PROCUREMENT_CREATE_PO,
  procurementMarkReceived: LOADER_PROCUREMENT_MARK_RECEIVED,
  // Procurement — Packing & Advance
  procurementConfirmPacking: LOADER_PROCUREMENT_CONFIRM_PACKING,
  procurementMarkReady: LOADER_PROCUREMENT_MARK_READY,
  // Deployment
  deploymentStartConfig: LOADER_DEPLOYMENT_START_CONFIG,
  deploymentMarkReadyToShip: LOADER_DEPLOYMENT_MARK_READY_TO_SHIP,
  deploymentMarkShipped: LOADER_DEPLOYMENT_MARK_SHIPPED,
  deploymentMarkInstalling: LOADER_DEPLOYMENT_MARK_INSTALLING,
  deploymentStartQc: LOADER_DEPLOYMENT_START_QC,
  deploymentMarkComplete: LOADER_DEPLOYMENT_MARK_COMPLETE,
  // Financials
  financialsMarkContractSigned: LOADER_FINANCIALS_MARK_CONTRACT_SIGNED,
  financialsSendDepositInvoice: LOADER_FINANCIALS_SEND_DEPOSIT_INVOICE,
  financialsMarkDepositPaid: LOADER_FINANCIALS_MARK_DEPOSIT_PAID,
  financialsSendFinalInvoice: LOADER_FINANCIALS_SEND_FINAL_INVOICE,
  financialsMarkFinalPaid: LOADER_FINANCIALS_MARK_FINAL_PAID,
  financialsAddExpense: LOADER_FINANCIALS_ADD_EXPENSE,
  financialsEditExpense: LOADER_FINANCIALS_EDIT_EXPENSE,
  financialsDeleteExpense: LOADER_FINANCIALS_DELETE_EXPENSE,
  financialsSetGoLiveDate: LOADER_FINANCIALS_SET_GO_LIVE_DATE,
  financialsMarkProjectComplete: LOADER_FINANCIALS_MARK_PROJECT_COMPLETE,
  // Inventory
  inventoryAdjustStock: LOADER_INVENTORY_ADJUST_STOCK,
  inventoryCreatePo: LOADER_INVENTORY_CREATE_PO,
  inventoryMarkPoReceived: LOADER_INVENTORY_MARK_PO_RECEIVED,
  inventoryUpdateReorderThreshold: LOADER_INVENTORY_UPDATE_REORDER_THRESHOLD,
  // Settings
  settingsSavePricing: LOADER_SETTINGS_SAVE_PRICING,
  settingsCatalogAddItem: LOADER_SETTINGS_CATALOG_ADD_ITEM,
  settingsCatalogEditItem: LOADER_SETTINGS_CATALOG_EDIT_ITEM,
  settingsCatalogDeleteItem: LOADER_SETTINGS_CATALOG_DELETE_ITEM,
  settingsSaveTeam: LOADER_SETTINGS_SAVE_TEAM,
} as const

export type LoaderKey = keyof typeof LOADERS
