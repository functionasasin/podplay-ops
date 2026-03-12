// Toast operation constants derived from ui-spec/toast-messages.md
// Each entry defines the message, duration (ms), and type for a named operation.

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastConfig {
  message: string
  duration: number
  type: ToastType
}

// Duration constants from spec
const SUCCESS_DURATION = 3000
const ERROR_DURATION = 5000
const WARNING_DURATION = 4000

// 1. Auth
export const TOAST_SIGN_OUT_SUCCESS: ToastConfig = {
  message: 'Signed out',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_SIGN_OUT_ERROR: ToastConfig = {
  message: 'Failed to sign out',
  duration: ERROR_DURATION,
  type: 'error',
}

// 2. Dashboard / Project Creation
export const TOAST_CREATE_PROJECT_SUCCESS: ToastConfig = {
  message: 'Project created. Checklist seeded.',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CREATE_PROJECT_ERROR: ToastConfig = {
  message: 'Failed to create project',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CHECKLIST_SEED_WARNING: ToastConfig = {
  message: 'Project created. Checklist seeding failed — retry from project settings.',
  duration: WARNING_DURATION,
  type: 'warning',
}
export const TOAST_CANCEL_PROJECT_SUCCESS: ToastConfig = {
  message: 'Project cancelled',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CANCEL_PROJECT_ERROR: ToastConfig = {
  message: 'Failed to cancel project',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_DELETE_PROJECT_SUCCESS: ToastConfig = {
  message: 'Project deleted',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_DELETE_PROJECT_ERROR: ToastConfig = {
  message: 'Failed to delete project',
  duration: ERROR_DURATION,
  type: 'error',
}

// 3. Stage 1 — Intake Wizard
export const TOAST_INTAKE_COMPLETE_SUCCESS: ToastConfig = {
  message: 'Project intake complete. BOM generated.',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_INTAKE_COMPLETE_ERROR: ToastConfig = {
  message: 'Failed to save intake',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_INTAKE_UPDATE_SUCCESS: ToastConfig = {
  message: 'Intake updated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_INTAKE_UPDATE_ERROR: ToastConfig = {
  message: 'Failed to update intake',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_INTAKE_ADVANCE_ERROR: ToastConfig = {
  message: 'Failed to advance to procurement',
  duration: ERROR_DURATION,
  type: 'error',
}

// 4.1 Procurement: BOM Review Tab
export const TOAST_BOM_INLINE_EDIT_ERROR: ToastConfig = {
  message: 'Failed to save change',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_BOM_ADD_ITEM_SUCCESS: ToastConfig = {
  message: 'Item added to BOM',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_BOM_ADD_ITEM_ERROR: ToastConfig = {
  message: 'Failed to add item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_BOM_REMOVE_ITEM_SUCCESS: ToastConfig = {
  message: 'Item removed from BOM',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_BOM_REMOVE_ITEM_ERROR: ToastConfig = {
  message: 'Failed to remove item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_BOM_RESET_COST_SUCCESS: ToastConfig = {
  message: 'Reset to catalog cost',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_BOM_RESET_COST_ERROR: ToastConfig = {
  message: 'Failed to reset cost',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_BOM_REGENERATE_SUCCESS: ToastConfig = {
  message: 'BOM regenerated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_BOM_REGENERATE_ERROR: ToastConfig = {
  message: 'Failed to regenerate BOM',
  duration: ERROR_DURATION,
  type: 'error',
}

// 4.2 Procurement: Inventory Tab
export const TOAST_ALLOCATE_ITEMS_ERROR: ToastConfig = {
  message: 'Failed to allocate items',
  duration: ERROR_DURATION,
  type: 'error',
}

// 4.3 Procurement: Purchase Orders Tab
export const TOAST_CREATE_PO_ERROR: ToastConfig = {
  message: 'Failed to create PO',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_MARK_PO_ORDERED_SUCCESS: ToastConfig = {
  message: 'PO marked as ordered',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_MARK_PO_ORDERED_ERROR: ToastConfig = {
  message: 'Failed to update PO',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_RECEIVE_PO_ERROR: ToastConfig = {
  message: 'Failed to record receipt',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CANCEL_PO_ERROR: ToastConfig = {
  message: 'Failed to cancel PO',
  duration: ERROR_DURATION,
  type: 'error',
}

// 4.4 Procurement: Packing Tab
export const TOAST_MARK_ITEM_SHIPPED_ERROR: ToastConfig = {
  message: 'Failed to mark item as shipped',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_REVERT_SHIPMENT_ERROR: ToastConfig = {
  message: 'Failed to revert shipment',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_MARK_ALL_SHIPPED_ERROR: ToastConfig = {
  message: 'Failed to mark items as shipped',
  duration: ERROR_DURATION,
  type: 'error',
}

// 4.7 Procurement: Stage Advancement
export const TOAST_ADVANCE_DEPLOYMENT_ERROR: ToastConfig = {
  message: 'Failed to advance to deployment',
  duration: ERROR_DURATION,
  type: 'error',
}

// 5.1 Deployment: Checklist Interactions
export const TOAST_CHECKLIST_TOGGLE_ERROR: ToastConfig = {
  message: 'Failed to save step — change reverted',
  duration: ERROR_DURATION,
  type: 'error',
}

// 5.2 Deployment: Token Field Updates
export const TOAST_TOKEN_FIELD_ERROR: ToastConfig = {
  message: 'Failed to save {fieldLabel}',
  duration: ERROR_DURATION,
  type: 'error',
}

// 5.3 Deployment: Phase-Specific Auto-Saves
export const TOAST_ISP_CONFIG_METHOD_ERROR: ToastConfig = {
  message: 'Failed to save ISP config method',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_REPLAY_SERVICE_VERSION_ERROR: ToastConfig = {
  message: 'Failed to save replay service version',
  duration: ERROR_DURATION,
  type: 'error',
}

// 5.4 Deployment: Status Advancement Modals
export const TOAST_READY_TO_SHIP_SUCCESS: ToastConfig = {
  message: 'Marked as Ready to Ship',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_MARKED_SHIPPED_ERROR: ToastConfig = {
  message: 'Failed to mark as shipped',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_INSTALLING_SUCCESS: ToastConfig = {
  message: 'Installation started — Phase 12 unlocked',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_QA_STARTED_SUCCESS: ToastConfig = {
  message: 'QA phase started',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_DEPLOYMENT_COMPLETE_SUCCESS: ToastConfig = {
  message: 'Deployment complete! Stage 4 (Financials) is now unlocked.',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_DEPLOYMENT_STATUS_ERROR: ToastConfig = {
  message: 'Failed to update deployment status',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_DEPLOYMENT_COMPLETE_ERROR: ToastConfig = {
  message: 'Failed to complete deployment',
  duration: ERROR_DURATION,
  type: 'error',
}

// 6.1 Financials: Contract & Invoicing Tab
export const TOAST_CONTRACT_SIGNED_SUCCESS: ToastConfig = {
  message: 'Contract marked as signed',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CONTRACT_SIGNED_ERROR: ToastConfig = {
  message: 'Failed to mark contract as signed',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_DEPOSIT_INVOICE_SENT_SUCCESS: ToastConfig = {
  message: 'Deposit invoice marked as sent',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_DEPOSIT_INVOICE_SENT_ERROR: ToastConfig = {
  message: 'Failed to send deposit invoice',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_DEPOSIT_PAID_SUCCESS: ToastConfig = {
  message: 'Deposit payment recorded',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_DEPOSIT_PAID_ERROR: ToastConfig = {
  message: 'Failed to record deposit payment',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_FINAL_INVOICE_SENT_SUCCESS: ToastConfig = {
  message: 'Final invoice marked as sent',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_FINAL_INVOICE_SENT_ERROR: ToastConfig = {
  message: 'Failed to send final invoice',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_FINAL_PAID_SUCCESS: ToastConfig = {
  message: 'Project completed! Final payment recorded.',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_FINAL_PAID_ERROR: ToastConfig = {
  message: 'Failed to record final payment',
  duration: ERROR_DURATION,
  type: 'error',
}

// 6.2 Financials: Expenses Tab
export const TOAST_EXPENSE_ADDED_SUCCESS: ToastConfig = {
  message: 'Expense added',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_EXPENSE_ADDED_ERROR: ToastConfig = {
  message: 'Failed to add expense',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_EXPENSE_UPDATED_SUCCESS: ToastConfig = {
  message: 'Expense updated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_EXPENSE_UPDATED_ERROR: ToastConfig = {
  message: 'Failed to update expense',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_EXPENSE_DELETED_SUCCESS: ToastConfig = {
  message: 'Expense deleted',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_EXPENSE_DELETED_ERROR: ToastConfig = {
  message: 'Failed to delete expense',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_INSTALLER_LABOR_ERROR: ToastConfig = {
  message: 'Failed to log installer labor',
  duration: ERROR_DURATION,
  type: 'error',
}

// 6.3 Financials: Go-Live & Handoff Tab
export const TOAST_GOLIVE_DATE_SUCCESS: ToastConfig = {
  message: 'Go-live date saved',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_GOLIVE_DATE_ERROR: ToastConfig = {
  message: 'Failed to save go-live date',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_HANDOFF_NOTES_SUCCESS: ToastConfig = {
  message: 'Notes saved',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_HANDOFF_NOTES_ERROR: ToastConfig = {
  message: 'Failed to save notes',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_PROJECT_COMPLETE_SUCCESS: ToastConfig = {
  message: 'Project marked as completed!',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_PROJECT_COMPLETE_ERROR: ToastConfig = {
  message: 'Failed to close project',
  duration: ERROR_DURATION,
  type: 'error',
}

// 7. Global Inventory Page
export const TOAST_STOCK_ADJUSTED_SUCCESS: ToastConfig = {
  message: 'Stock adjusted successfully',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_THRESHOLD_SAVE_ERROR: ToastConfig = {
  message: 'Failed to save threshold',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_GLOBAL_PO_ERROR: ToastConfig = {
  message: 'Failed to create PO',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_GLOBAL_PO_ORDERED_SUCCESS: ToastConfig = {
  message: 'PO marked as ordered',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_GLOBAL_PO_ORDERED_ERROR: ToastConfig = {
  message: 'Failed to update PO',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_GLOBAL_PO_RECEIVE_ERROR: ToastConfig = {
  message: 'Failed to record receipt',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_GLOBAL_PO_CANCEL_ERROR: ToastConfig = {
  message: 'Failed to cancel PO',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_RECONCILIATION_ERROR: ToastConfig = {
  message: 'Reconciliation failed',
  duration: ERROR_DURATION,
  type: 'error',
}

// 8. Settings Pages
export const TOAST_SETTINGS_SAVED_SUCCESS: ToastConfig = {
  message: 'Settings saved',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CATALOG_ITEM_ADDED_SUCCESS: ToastConfig = {
  message: 'Item added',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CATALOG_ITEM_ADDED_ERROR: ToastConfig = {
  message: 'Failed to add item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CATALOG_ITEM_UPDATED_SUCCESS: ToastConfig = {
  message: 'Item updated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CATALOG_ITEM_UPDATED_ERROR: ToastConfig = {
  message: 'Failed to update item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CATALOG_ITEM_DEACTIVATED_SUCCESS: ToastConfig = {
  message: 'Item deactivated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CATALOG_ITEM_DEACTIVATED_ERROR: ToastConfig = {
  message: 'Failed to deactivate item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CATALOG_ITEM_REACTIVATED_SUCCESS: ToastConfig = {
  message: 'Item reactivated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CATALOG_ITEM_REACTIVATED_ERROR: ToastConfig = {
  message: 'Failed to reactivate item',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_OPEX_SAVED_SUCCESS: ToastConfig = {
  message: 'OpEx settings saved',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_OPEX_SAVED_ERROR: ToastConfig = {
  message: 'Failed to save OpEx settings',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CONTACT_SAVED_SUCCESS: ToastConfig = {
  message: 'Contact saved',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CONTACT_SAVED_ERROR: ToastConfig = {
  message: 'Failed to save contact',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CONTACT_DEACTIVATED_SUCCESS: ToastConfig = {
  message: 'Contact deactivated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CONTACT_DEACTIVATED_ERROR: ToastConfig = {
  message: 'Failed to deactivate contact',
  duration: ERROR_DURATION,
  type: 'error',
}
export const TOAST_CONTACT_REACTIVATED_SUCCESS: ToastConfig = {
  message: 'Contact reactivated',
  duration: SUCCESS_DURATION,
  type: 'success',
}
export const TOAST_CONTACT_REACTIVATED_ERROR: ToastConfig = {
  message: 'Failed to reactivate contact',
  duration: ERROR_DURATION,
  type: 'error',
}
// 9. Guard / Navigation Toasts
export const TOAST_GUARD_DEPLOYMENT: ToastConfig = {
  message: 'Complete procurement before accessing deployment.',
  duration: WARNING_DURATION,
  type: 'warning',
}
export const TOAST_GUARD_FINANCIALS: ToastConfig = {
  message: 'Complete deployment before accessing financials.',
  duration: WARNING_DURATION,
  type: 'warning',
}

// Registry map for showToast() lookup
export const TOAST_OPERATIONS: Record<string, ToastConfig> = {
  SIGN_OUT_SUCCESS: TOAST_SIGN_OUT_SUCCESS,
  SIGN_OUT_ERROR: TOAST_SIGN_OUT_ERROR,
  CREATE_PROJECT_SUCCESS: TOAST_CREATE_PROJECT_SUCCESS,
  CREATE_PROJECT_ERROR: TOAST_CREATE_PROJECT_ERROR,
  CHECKLIST_SEED_WARNING: TOAST_CHECKLIST_SEED_WARNING,
  CANCEL_PROJECT_SUCCESS: TOAST_CANCEL_PROJECT_SUCCESS,
  CANCEL_PROJECT_ERROR: TOAST_CANCEL_PROJECT_ERROR,
  DELETE_PROJECT_SUCCESS: TOAST_DELETE_PROJECT_SUCCESS,
  DELETE_PROJECT_ERROR: TOAST_DELETE_PROJECT_ERROR,
  INTAKE_COMPLETE_SUCCESS: TOAST_INTAKE_COMPLETE_SUCCESS,
  INTAKE_COMPLETE_ERROR: TOAST_INTAKE_COMPLETE_ERROR,
  INTAKE_UPDATE_SUCCESS: TOAST_INTAKE_UPDATE_SUCCESS,
  INTAKE_UPDATE_ERROR: TOAST_INTAKE_UPDATE_ERROR,
  INTAKE_ADVANCE_ERROR: TOAST_INTAKE_ADVANCE_ERROR,
  BOM_INLINE_EDIT_ERROR: TOAST_BOM_INLINE_EDIT_ERROR,
  BOM_ADD_ITEM_SUCCESS: TOAST_BOM_ADD_ITEM_SUCCESS,
  BOM_ADD_ITEM_ERROR: TOAST_BOM_ADD_ITEM_ERROR,
  BOM_REMOVE_ITEM_SUCCESS: TOAST_BOM_REMOVE_ITEM_SUCCESS,
  BOM_REMOVE_ITEM_ERROR: TOAST_BOM_REMOVE_ITEM_ERROR,
  BOM_RESET_COST_SUCCESS: TOAST_BOM_RESET_COST_SUCCESS,
  BOM_RESET_COST_ERROR: TOAST_BOM_RESET_COST_ERROR,
  BOM_REGENERATE_SUCCESS: TOAST_BOM_REGENERATE_SUCCESS,
  BOM_REGENERATE_ERROR: TOAST_BOM_REGENERATE_ERROR,
  ALLOCATE_ITEMS_ERROR: TOAST_ALLOCATE_ITEMS_ERROR,
  CREATE_PO_ERROR: TOAST_CREATE_PO_ERROR,
  MARK_PO_ORDERED_SUCCESS: TOAST_MARK_PO_ORDERED_SUCCESS,
  MARK_PO_ORDERED_ERROR: TOAST_MARK_PO_ORDERED_ERROR,
  RECEIVE_PO_ERROR: TOAST_RECEIVE_PO_ERROR,
  CANCEL_PO_ERROR: TOAST_CANCEL_PO_ERROR,
  MARK_ITEM_SHIPPED_ERROR: TOAST_MARK_ITEM_SHIPPED_ERROR,
  REVERT_SHIPMENT_ERROR: TOAST_REVERT_SHIPMENT_ERROR,
  MARK_ALL_SHIPPED_ERROR: TOAST_MARK_ALL_SHIPPED_ERROR,
  ADVANCE_DEPLOYMENT_ERROR: TOAST_ADVANCE_DEPLOYMENT_ERROR,
  CHECKLIST_TOGGLE_ERROR: TOAST_CHECKLIST_TOGGLE_ERROR,
  TOKEN_FIELD_ERROR: TOAST_TOKEN_FIELD_ERROR,
  ISP_CONFIG_METHOD_ERROR: TOAST_ISP_CONFIG_METHOD_ERROR,
  REPLAY_SERVICE_VERSION_ERROR: TOAST_REPLAY_SERVICE_VERSION_ERROR,
  READY_TO_SHIP_SUCCESS: TOAST_READY_TO_SHIP_SUCCESS,
  MARKED_SHIPPED_ERROR: TOAST_MARKED_SHIPPED_ERROR,
  INSTALLING_SUCCESS: TOAST_INSTALLING_SUCCESS,
  QA_STARTED_SUCCESS: TOAST_QA_STARTED_SUCCESS,
  DEPLOYMENT_COMPLETE_SUCCESS: TOAST_DEPLOYMENT_COMPLETE_SUCCESS,
  DEPLOYMENT_STATUS_ERROR: TOAST_DEPLOYMENT_STATUS_ERROR,
  DEPLOYMENT_COMPLETE_ERROR: TOAST_DEPLOYMENT_COMPLETE_ERROR,
  CONTRACT_SIGNED_SUCCESS: TOAST_CONTRACT_SIGNED_SUCCESS,
  CONTRACT_SIGNED_ERROR: TOAST_CONTRACT_SIGNED_ERROR,
  DEPOSIT_INVOICE_SENT_SUCCESS: TOAST_DEPOSIT_INVOICE_SENT_SUCCESS,
  DEPOSIT_INVOICE_SENT_ERROR: TOAST_DEPOSIT_INVOICE_SENT_ERROR,
  DEPOSIT_PAID_SUCCESS: TOAST_DEPOSIT_PAID_SUCCESS,
  DEPOSIT_PAID_ERROR: TOAST_DEPOSIT_PAID_ERROR,
  FINAL_INVOICE_SENT_SUCCESS: TOAST_FINAL_INVOICE_SENT_SUCCESS,
  FINAL_INVOICE_SENT_ERROR: TOAST_FINAL_INVOICE_SENT_ERROR,
  FINAL_PAID_SUCCESS: TOAST_FINAL_PAID_SUCCESS,
  FINAL_PAID_ERROR: TOAST_FINAL_PAID_ERROR,
  EXPENSE_ADDED_SUCCESS: TOAST_EXPENSE_ADDED_SUCCESS,
  EXPENSE_ADDED_ERROR: TOAST_EXPENSE_ADDED_ERROR,
  EXPENSE_UPDATED_SUCCESS: TOAST_EXPENSE_UPDATED_SUCCESS,
  EXPENSE_UPDATED_ERROR: TOAST_EXPENSE_UPDATED_ERROR,
  EXPENSE_DELETED_SUCCESS: TOAST_EXPENSE_DELETED_SUCCESS,
  EXPENSE_DELETED_ERROR: TOAST_EXPENSE_DELETED_ERROR,
  INSTALLER_LABOR_ERROR: TOAST_INSTALLER_LABOR_ERROR,
  GOLIVE_DATE_SUCCESS: TOAST_GOLIVE_DATE_SUCCESS,
  GOLIVE_DATE_ERROR: TOAST_GOLIVE_DATE_ERROR,
  HANDOFF_NOTES_SUCCESS: TOAST_HANDOFF_NOTES_SUCCESS,
  HANDOFF_NOTES_ERROR: TOAST_HANDOFF_NOTES_ERROR,
  PROJECT_COMPLETE_SUCCESS: TOAST_PROJECT_COMPLETE_SUCCESS,
  PROJECT_COMPLETE_ERROR: TOAST_PROJECT_COMPLETE_ERROR,
  STOCK_ADJUSTED_SUCCESS: TOAST_STOCK_ADJUSTED_SUCCESS,
  THRESHOLD_SAVE_ERROR: TOAST_THRESHOLD_SAVE_ERROR,
  GLOBAL_PO_ERROR: TOAST_GLOBAL_PO_ERROR,
  GLOBAL_PO_ORDERED_SUCCESS: TOAST_GLOBAL_PO_ORDERED_SUCCESS,
  GLOBAL_PO_ORDERED_ERROR: TOAST_GLOBAL_PO_ORDERED_ERROR,
  GLOBAL_PO_RECEIVE_ERROR: TOAST_GLOBAL_PO_RECEIVE_ERROR,
  GLOBAL_PO_CANCEL_ERROR: TOAST_GLOBAL_PO_CANCEL_ERROR,
  RECONCILIATION_ERROR: TOAST_RECONCILIATION_ERROR,
  SETTINGS_SAVED_SUCCESS: TOAST_SETTINGS_SAVED_SUCCESS,
  CATALOG_ITEM_ADDED_SUCCESS: TOAST_CATALOG_ITEM_ADDED_SUCCESS,
  CATALOG_ITEM_ADDED_ERROR: TOAST_CATALOG_ITEM_ADDED_ERROR,
  CATALOG_ITEM_UPDATED_SUCCESS: TOAST_CATALOG_ITEM_UPDATED_SUCCESS,
  CATALOG_ITEM_UPDATED_ERROR: TOAST_CATALOG_ITEM_UPDATED_ERROR,
  CATALOG_ITEM_DEACTIVATED_SUCCESS: TOAST_CATALOG_ITEM_DEACTIVATED_SUCCESS,
  CATALOG_ITEM_DEACTIVATED_ERROR: TOAST_CATALOG_ITEM_DEACTIVATED_ERROR,
  CATALOG_ITEM_REACTIVATED_SUCCESS: TOAST_CATALOG_ITEM_REACTIVATED_SUCCESS,
  CATALOG_ITEM_REACTIVATED_ERROR: TOAST_CATALOG_ITEM_REACTIVATED_ERROR,
  OPEX_SAVED_SUCCESS: TOAST_OPEX_SAVED_SUCCESS,
  OPEX_SAVED_ERROR: TOAST_OPEX_SAVED_ERROR,
  CONTACT_SAVED_SUCCESS: TOAST_CONTACT_SAVED_SUCCESS,
  CONTACT_SAVED_ERROR: TOAST_CONTACT_SAVED_ERROR,
  CONTACT_DEACTIVATED_SUCCESS: TOAST_CONTACT_DEACTIVATED_SUCCESS,
  CONTACT_DEACTIVATED_ERROR: TOAST_CONTACT_DEACTIVATED_ERROR,
  CONTACT_REACTIVATED_SUCCESS: TOAST_CONTACT_REACTIVATED_SUCCESS,
  CONTACT_REACTIVATED_ERROR: TOAST_CONTACT_REACTIVATED_ERROR,
  GUARD_DEPLOYMENT: TOAST_GUARD_DEPLOYMENT,
  GUARD_FINANCIALS: TOAST_GUARD_FINANCIALS,
}
