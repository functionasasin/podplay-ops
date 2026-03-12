// PodPlay Ops Wizard — Enum Label Utilities
// Source of truth: loops/podplay-ops-reverse/final-mega-spec/ui-spec/enum-labels.md

import type {
  ServiceTier,
  ProjectStatus,
  DeploymentStatus,
  RevenueStage,
  InstallerType,
  IspType,
  ReplayServiceVersion,
  ExpenseCategory,
  PaymentMethod,
  InvoiceStatus,
  BomCategory,
  InventoryMovementType,
  SignStatus,
  MdmProvider,
  DeviceMigrationStatus,
  MigrationDeviceType,
  MigrationDeviceStatus,
  DeploymentRegion,
  VideoStandard,
  PowerStandard,
} from './types';

// ─── service_tier ─────────────────────────────────────────────────────────────

export const serviceTierLabels: Record<ServiceTier, string> = {
  pro:             'PRO',
  autonomous:      'AUTO',
  autonomous_plus: 'A+',
};

export const serviceTierBadgeClass: Record<ServiceTier, string> = {
  pro:             'bg-blue-100 text-blue-700 border-blue-200',
  autonomous:      'bg-purple-100 text-purple-700 border-purple-200',
  autonomous_plus: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export const serviceTierSortOrder: Record<ServiceTier, number> = {
  pro:             1,
  autonomous:      2,
  autonomous_plus: 3,
};

// ─── project_status ───────────────────────────────────────────────────────────

export const projectStatusLabels: Record<ProjectStatus, string> = {
  intake:          'Intake',
  procurement:     'Procurement',
  deployment:      'Deployment',
  financial_close: 'Financial Close',
  completed:       'Completed',
  cancelled:       'Cancelled',
};

export const projectStatusBadgeClass: Record<ProjectStatus, string> = {
  intake:          'bg-slate-400',
  procurement:     'bg-yellow-400',
  deployment:      'bg-blue-500',
  financial_close: 'bg-orange-400',
  completed:       'bg-green-500',
  cancelled:       'bg-red-400',
};

export const projectStatusSortOrder: Record<ProjectStatus, number> = {
  intake:          1,
  procurement:     2,
  deployment:      3,
  financial_close: 4,
  completed:       5,
  cancelled:       6,
};

// ─── deployment_status ────────────────────────────────────────────────────────

export const deploymentStatusLabels: Record<DeploymentStatus, string> = {
  not_started:   'Not started',
  config:        'Configuring',
  ready_to_ship: 'Ready to ship',
  shipped:       'Shipped',
  installing:    'Installing',
  qc:            'QC',
  completed:     'Complete',
};

export const deploymentStatusBadgeClass: Record<DeploymentStatus, string> = {
  not_started:   '',
  config:        '',
  ready_to_ship: '',
  shipped:       '',
  installing:    '',
  qc:            '',
  completed:     '',
};

export const deploymentStatusSortOrder: Record<DeploymentStatus, number> = {
  not_started:   1,
  config:        2,
  ready_to_ship: 3,
  shipped:       4,
  installing:    5,
  qc:            6,
  completed:     7,
};

// ─── revenue_stage ────────────────────────────────────────────────────────────

export const revenueStageLabels: Record<RevenueStage, string> = {
  proposal:         'Proposal',
  signed:           'Signed',
  deposit_invoiced: 'Deposit sent',
  deposit_paid:     'Deposit paid',
  final_invoiced:   'Final sent',
  final_paid:       'Final paid',
};

export const revenueStageBadgeClass: Record<RevenueStage, string> = {
  proposal:         'text-slate-500',
  signed:           'text-blue-500',
  deposit_invoiced: 'text-yellow-600',
  deposit_paid:     'text-green-500',
  final_invoiced:   'text-orange-500',
  final_paid:       'text-green-600',
};

export const revenueStageSortOrder: Record<RevenueStage, number> = {
  proposal:         1,
  signed:           2,
  deposit_invoiced: 3,
  deposit_paid:     4,
  final_invoiced:   5,
  final_paid:       6,
};

// ─── installer_type ───────────────────────────────────────────────────────────

export const installerTypeLabels: Record<InstallerType, string> = {
  podplay_vetted: 'PodPlay Vetted',
  client_own:     "Client's Own",
};

export const installerTypeBadgeClass: Record<InstallerType, string> = {
  podplay_vetted: '',
  client_own:     '',
};

export const installerTypeSortOrder: Record<InstallerType, number> = {
  podplay_vetted: 1,
  client_own:     2,
};

// ─── isp_type ─────────────────────────────────────────────────────────────────

export const ispTypeLabels: Record<IspType, string> = {
  fiber:     'Fiber',
  cable:     'Cable',
  dedicated: 'Dedicated',
  other:     'Other',
};

export const ispTypeBadgeClass: Record<IspType, string> = {
  fiber:     '',
  cable:     '',
  dedicated: '',
  other:     '',
};

export const ispTypeSortOrder: Record<IspType, number> = {
  fiber:     1,
  cable:     2,
  dedicated: 3,
  other:     4,
};

// ─── replay_service_version ───────────────────────────────────────────────────

export const replayServiceVersionLabels: Record<ReplayServiceVersion, string> = {
  v1: 'V1 (Current)',
  v2: 'V2 (April 2026)',
};

export const replayServiceVersionBadgeClass: Record<ReplayServiceVersion, string> = {
  v1: '',
  v2: '',
};

export const replayServiceVersionSortOrder: Record<ReplayServiceVersion, number> = {
  v1: 1,
  v2: 2,
};

// ─── expense_category ─────────────────────────────────────────────────────────

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  airfare:               'Airfare',
  car:                   'Car Rental',
  fuel:                  'Fuel',
  lodging:               'Lodging',
  meals:                 'Meals',
  misc_hardware:         'Misc Hardware',
  outbound_shipping:     'Outbound Shipping',
  professional_services: 'Professional Services',
  taxi:                  'Taxi / Rideshare',
  train:                 'Train',
  parking:               'Parking',
  other:                 'Other',
};

export const expenseCategoryBadgeClass: Record<ExpenseCategory, string> = {
  airfare:               '',
  car:                   '',
  fuel:                  '',
  lodging:               '',
  meals:                 '',
  misc_hardware:         '',
  outbound_shipping:     '',
  professional_services: '',
  taxi:                  '',
  train:                 '',
  parking:               '',
  other:                 '',
};

export const expenseCategorySortOrder: Record<ExpenseCategory, number> = {
  airfare:               1,
  car:                   2,
  fuel:                  3,
  lodging:               4,
  meals:                 5,
  misc_hardware:         6,
  outbound_shipping:     7,
  professional_services: 8,
  taxi:                  9,
  train:                 10,
  parking:               11,
  other:                 12,
};

// ─── payment_method ───────────────────────────────────────────────────────────

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  podplay_card:   'PodPlay Card (Ramp)',
  ramp_reimburse: 'Ramp Reimbursement',
};

export const paymentMethodBadgeClass: Record<PaymentMethod, string> = {
  podplay_card:   '',
  ramp_reimburse: '',
};

export const paymentMethodSortOrder: Record<PaymentMethod, number> = {
  podplay_card:   1,
  ramp_reimburse: 2,
};

// ─── invoice_status ───────────────────────────────────────────────────────────

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  not_sent: 'Not Sent',
  sent:     'Sent',
  paid:     'Paid',
};

export const invoiceStatusBadgeClass: Record<InvoiceStatus, string> = {
  not_sent: 'bg-slate-100 text-slate-600 border-slate-200',
  sent:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid:     'bg-green-100 text-green-700 border-green-200',
};

export const invoiceStatusSortOrder: Record<InvoiceStatus, number> = {
  not_sent: 1,
  sent:     2,
  paid:     3,
};

// ─── bom_category ─────────────────────────────────────────────────────────────

export const bomCategoryLabels: Record<BomCategory, string> = {
  network_rack:     'Network Rack',
  replay_system:    'Replay System',
  displays:         'Displays & Kiosks',
  access_control:   'Access Control',
  surveillance:     'Surveillance',
  front_desk:       'Front Desk',
  cabling:          'Cabling',
  signage:          'Signage',
  infrastructure:   'Infrastructure',
  pingpod_specific: 'PingPod Specific',
};

export const bomCategoryBadgeClass: Record<BomCategory, string> = {
  network_rack:     '',
  replay_system:    '',
  displays:         '',
  access_control:   '',
  surveillance:     '',
  front_desk:       '',
  cabling:          '',
  signage:          '',
  infrastructure:   '',
  pingpod_specific: '',
};

export const bomCategorySortOrder: Record<BomCategory, number> = {
  network_rack:     1,
  replay_system:    2,
  displays:         3,
  access_control:   4,
  surveillance:     5,
  front_desk:       6,
  cabling:          7,
  signage:          8,
  infrastructure:   9,
  pingpod_specific: 10,
};

// ─── inventory_movement_type ──────────────────────────────────────────────────

export const inventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  purchase_order_received: 'PO Received',
  project_allocated:       'Allocated to Project',
  project_shipped:         'Shipped to Project',
  adjustment_increase:     'Manual Increase',
  adjustment_decrease:     'Manual Decrease',
  return:                  'Returned to Stock',
};

export const inventoryMovementTypeBadgeClass: Record<InventoryMovementType, string> = {
  purchase_order_received: 'text-green-600',
  project_allocated:       'text-amber-600',
  project_shipped:         'text-amber-600',
  adjustment_increase:     'text-green-600',
  adjustment_decrease:     'text-red-600',
  return:                  'text-green-600',
};

export const inventoryMovementTypeSortOrder: Record<InventoryMovementType, number> = {
  purchase_order_received: 1,
  project_allocated:       2,
  project_shipped:         3,
  adjustment_increase:     4,
  adjustment_decrease:     5,
  return:                  6,
};

// ─── sign_status ──────────────────────────────────────────────────────────────

export const signStatusLabels: Record<SignStatus, string> = {
  staged:    'Staged',
  shipped:   'Shipped',
  delivered: 'Delivered',
  installed: 'Installed',
};

export const signStatusBadgeClass: Record<SignStatus, string> = {
  staged:    'bg-slate-100 text-slate-600 border-slate-200',
  shipped:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  delivered: 'bg-blue-100 text-blue-700 border-blue-200',
  installed: 'bg-green-100 text-green-700 border-green-200',
};

export const signStatusSortOrder: Record<SignStatus, number> = {
  staged:    1,
  shipped:   2,
  delivered: 3,
  installed: 4,
};

// ─── mdm_provider ─────────────────────────────────────────────────────────────

export const mdmProviderLabels: Record<MdmProvider, string> = {
  mosyle: 'Mosyle',
  jamf:   'Jamf',
  other:  'Other',
};

export const mdmProviderBadgeClass: Record<MdmProvider, string> = {
  mosyle: '',
  jamf:   '',
  other:  '',
};

export const mdmProviderSortOrder: Record<MdmProvider, number> = {
  mosyle: 1,
  jamf:   2,
  other:  3,
};

// ─── device_migration_status ──────────────────────────────────────────────────

export const deviceMigrationStatusLabels: Record<DeviceMigrationStatus, string> = {
  planning:   'Planning',
  released:   'Released',
  enrolled:   'Enrolled',
  configured: 'Configured',
  completed:  'Completed',
  cancelled:  'Cancelled',
};

export const deviceMigrationStatusBadgeClass: Record<DeviceMigrationStatus, string> = {
  planning:   'bg-slate-100 text-slate-600 border-slate-200',
  released:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  enrolled:   'bg-blue-100 text-blue-700 border-blue-200',
  configured: 'bg-purple-100 text-purple-700 border-purple-200',
  completed:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
};

export const deviceMigrationStatusSortOrder: Record<DeviceMigrationStatus, number> = {
  planning:   1,
  released:   2,
  enrolled:   3,
  configured: 4,
  completed:  5,
  cancelled:  6,
};

// ─── migration_device_type ────────────────────────────────────────────────────

export const migrationDeviceTypeLabels: Record<MigrationDeviceType, string> = {
  ipad:      'iPad',
  apple_tv:  'Apple TV',
  mac_mini:  'Mac Mini',
};

export const migrationDeviceTypeBadgeClass: Record<MigrationDeviceType, string> = {
  ipad:      '',
  apple_tv:  '',
  mac_mini:  '',
};

export const migrationDeviceTypeSortOrder: Record<MigrationDeviceType, number> = {
  ipad:      1,
  apple_tv:  2,
  mac_mini:  3,
};

// ─── migration_device_status ──────────────────────────────────────────────────

export const migrationDeviceStatusLabels: Record<MigrationDeviceStatus, string> = {
  pending:    'Pending',
  released:   'Released',
  enrolled:   'Enrolled',
  configured: 'Configured',
};

export const migrationDeviceStatusBadgeClass: Record<MigrationDeviceStatus, string> = {
  pending:    'bg-slate-100 text-slate-600 border-slate-200',
  released:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  enrolled:   'bg-blue-100 text-blue-700 border-blue-200',
  configured: 'bg-green-100 text-green-700 border-green-200',
};

export const migrationDeviceStatusSortOrder: Record<MigrationDeviceStatus, number> = {
  pending:    1,
  released:   2,
  enrolled:   3,
  configured: 4,
};

// ─── deployment_region ────────────────────────────────────────────────────────

export const deploymentRegionLabels: Record<DeploymentRegion, string> = {
  us:          'United States',
  philippines: 'Philippines',
};

export const deploymentRegionBadgeClass: Record<DeploymentRegion, string> = {
  us:          '',
  philippines: '',
};

export const deploymentRegionSortOrder: Record<DeploymentRegion, number> = {
  us:          1,
  philippines: 2,
};

// ─── video_standard ───────────────────────────────────────────────────────────

export const videoStandardLabels: Record<VideoStandard, string> = {
  ntsc: 'NTSC (60Hz)',
  pal:  'PAL (50Hz)',
};

export const videoStandardBadgeClass: Record<VideoStandard, string> = {
  ntsc: '',
  pal:  '',
};

export const videoStandardSortOrder: Record<VideoStandard, number> = {
  ntsc: 1,
  pal:  2,
};

// ─── power_standard ───────────────────────────────────────────────────────────

export const powerStandardLabels: Record<PowerStandard, string> = {
  '120v_60hz': '120V / 60Hz (US)',
  '220v_60hz': '220V / 60Hz (Philippines)',
};

export const powerStandardBadgeClass: Record<PowerStandard, string> = {
  '120v_60hz': '',
  '220v_60hz': '',
};

export const powerStandardSortOrder: Record<PowerStandard, number> = {
  '120v_60hz': 1,
  '220v_60hz': 2,
};

// ─── order_status ─────────────────────────────────────────────────────────────

export const orderStatusLabels: Record<string, string> = {
  not_ordered: 'Not Ordered',
  ordered:     'Ordered',
  partial:     'Partial',
  received:    'Received',
};

export const orderStatusBadgeClass: Record<string, string> = {
  not_ordered: 'bg-slate-100 text-slate-600 border-slate-200',
  ordered:     'bg-blue-100 text-blue-700 border-blue-200',
  partial:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  received:    'bg-green-100 text-green-700 border-green-200',
};

// ─── Generic Lookup Helpers ───────────────────────────────────────────────────

const labelMaps: Record<string, Record<string, string>> = {
  service_tier:             serviceTierLabels,
  project_status:           projectStatusLabels,
  deployment_status:        deploymentStatusLabels,
  revenue_stage:            revenueStageLabels,
  installer_type:           installerTypeLabels,
  isp_type:                 ispTypeLabels,
  replay_service_version:   replayServiceVersionLabels,
  expense_category:         expenseCategoryLabels,
  payment_method:           paymentMethodLabels,
  invoice_status:           invoiceStatusLabels,
  bom_category:             bomCategoryLabels,
  inventory_movement_type:  inventoryMovementTypeLabels,
  sign_status:              signStatusLabels,
  mdm_provider:             mdmProviderLabels,
  device_migration_status:  deviceMigrationStatusLabels,
  migration_device_type:    migrationDeviceTypeLabels,
  migration_device_status:  migrationDeviceStatusLabels,
  deployment_region:        deploymentRegionLabels,
  video_standard:           videoStandardLabels,
  power_standard:           powerStandardLabels,
  order_status:             orderStatusLabels,
};

const badgeClassMaps: Record<string, Record<string, string>> = {
  service_tier:             serviceTierBadgeClass,
  project_status:           projectStatusBadgeClass,
  deployment_status:        deploymentStatusBadgeClass,
  revenue_stage:            revenueStageBadgeClass,
  installer_type:           installerTypeBadgeClass,
  isp_type:                 ispTypeBadgeClass,
  replay_service_version:   replayServiceVersionBadgeClass,
  expense_category:         expenseCategoryBadgeClass,
  payment_method:           paymentMethodBadgeClass,
  invoice_status:           invoiceStatusBadgeClass,
  bom_category:             bomCategoryBadgeClass,
  inventory_movement_type:  inventoryMovementTypeBadgeClass,
  sign_status:              signStatusBadgeClass,
  mdm_provider:             mdmProviderBadgeClass,
  device_migration_status:  deviceMigrationStatusBadgeClass,
  migration_device_type:    migrationDeviceTypeBadgeClass,
  migration_device_status:  migrationDeviceStatusBadgeClass,
  deployment_region:        deploymentRegionBadgeClass,
  video_standard:           videoStandardBadgeClass,
  power_standard:           powerStandardBadgeClass,
  order_status:             orderStatusBadgeClass,
};

export function getEnumLabel(enumType: string, value: string): string {
  return labelMaps[enumType]?.[value] ?? value;
}

export function getEnumBadgeClass(enumType: string, value: string): string {
  return badgeClassMaps[enumType]?.[value] ?? '';
}
