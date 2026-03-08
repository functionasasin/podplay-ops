// Stage 030 — Tests: Enum Labels
// Verifies all 21 enum types have complete label and badge class coverage.

import { describe, it, expect } from 'vitest';
import {
  // service_tier
  serviceTierLabels,
  serviceTierBadgeClass,
  serviceTierSortOrder,
  // project_status
  projectStatusLabels,
  projectStatusBadgeClass,
  projectStatusSortOrder,
  // deployment_status
  deploymentStatusLabels,
  deploymentStatusBadgeClass,
  deploymentStatusSortOrder,
  // revenue_stage
  revenueStageLabels,
  revenueStageBadgeClass,
  revenueStageSortOrder,
  // installer_type
  installerTypeLabels,
  installerTypeBadgeClass,
  installerTypeSortOrder,
  // isp_type
  ispTypeLabels,
  ispTypeBadgeClass,
  ispTypeSortOrder,
  // replay_service_version
  replayServiceVersionLabels,
  replayServiceVersionBadgeClass,
  replayServiceVersionSortOrder,
  // expense_category
  expenseCategoryLabels,
  expenseCategoryBadgeClass,
  expenseCategorySortOrder,
  // payment_method
  paymentMethodLabels,
  paymentMethodBadgeClass,
  paymentMethodSortOrder,
  // invoice_status
  invoiceStatusLabels,
  invoiceStatusBadgeClass,
  invoiceStatusSortOrder,
  // bom_category
  bomCategoryLabels,
  bomCategoryBadgeClass,
  bomCategorySortOrder,
  // inventory_movement_type
  inventoryMovementTypeLabels,
  inventoryMovementTypeBadgeClass,
  inventoryMovementTypeSortOrder,
  // sign_status
  signStatusLabels,
  signStatusBadgeClass,
  signStatusSortOrder,
  // cc_terminal_status
  ccTerminalStatusLabels,
  ccTerminalStatusBadgeClass,
  ccTerminalStatusSortOrder,
  // mdm_provider
  mdmProviderLabels,
  mdmProviderBadgeClass,
  mdmProviderSortOrder,
  // device_migration_status
  deviceMigrationStatusLabels,
  deviceMigrationStatusBadgeClass,
  deviceMigrationStatusSortOrder,
  // migration_device_type
  migrationDeviceTypeLabels,
  migrationDeviceTypeBadgeClass,
  migrationDeviceTypeSortOrder,
  // migration_device_status
  migrationDeviceStatusLabels,
  migrationDeviceStatusBadgeClass,
  migrationDeviceStatusSortOrder,
  // deployment_region
  deploymentRegionLabels,
  deploymentRegionBadgeClass,
  deploymentRegionSortOrder,
  // video_standard
  videoStandardLabels,
  videoStandardBadgeClass,
  videoStandardSortOrder,
  // power_standard
  powerStandardLabels,
  powerStandardBadgeClass,
  powerStandardSortOrder,
  // generic helpers
  getEnumLabel,
  getEnumBadgeClass,
} from '@/lib/enum-labels';

// ─── Helper ───────────────────────────────────────────────────────────────────

function checkNoUndefined(record: Record<string, string>, name: string) {
  for (const [key, value] of Object.entries(record)) {
    expect(value, `${name}["${key}"] should be defined`).toBeDefined();
    expect(value, `${name}["${key}"] should not be undefined string`).not.toBe('undefined');
  }
}

function checkSortOrder(sortOrder: Record<string, number>, labels: Record<string, string>, name: string) {
  const labelKeys = Object.keys(labels);
  const sortKeys = Object.keys(sortOrder);
  expect(sortKeys.length, `${name} sort order should cover all values`).toBe(labelKeys.length);
  for (const key of labelKeys) {
    expect(sortOrder[key], `${name} sort order missing key "${key}"`).toBeDefined();
  }
  // Sort orders should be unique (no gaps are required but uniqueness matters)
  const sortValues = Object.values(sortOrder);
  const uniqueSortValues = new Set(sortValues);
  expect(uniqueSortValues.size, `${name} sort order values should be unique`).toBe(sortValues.length);
}

// ─── service_tier ─────────────────────────────────────────────────────────────

describe('service_tier', () => {
  const values = ['pro', 'autonomous', 'autonomous_plus', 'pbk'] as const;

  it('has labels for all 4 values', () => {
    expect(Object.keys(serviceTierLabels)).toHaveLength(4);
    for (const v of values) expect(serviceTierLabels[v]).toBeDefined();
    checkNoUndefined(serviceTierLabels, 'serviceTierLabels');
  });

  it('has badge classes for all 4 values', () => {
    expect(Object.keys(serviceTierBadgeClass)).toHaveLength(4);
    checkNoUndefined(serviceTierBadgeClass, 'serviceTierBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(serviceTierSortOrder, serviceTierLabels, 'serviceTierSortOrder');
  });
});

// ─── project_status ───────────────────────────────────────────────────────────

describe('project_status', () => {
  const values = ['intake', 'procurement', 'deployment', 'financial_close', 'completed', 'cancelled'] as const;

  it('has labels for all 6 values', () => {
    expect(Object.keys(projectStatusLabels)).toHaveLength(6);
    for (const v of values) expect(projectStatusLabels[v]).toBeDefined();
    checkNoUndefined(projectStatusLabels, 'projectStatusLabels');
  });

  it('has badge classes for all 6 values', () => {
    expect(Object.keys(projectStatusBadgeClass)).toHaveLength(6);
    checkNoUndefined(projectStatusBadgeClass, 'projectStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(projectStatusSortOrder, projectStatusLabels, 'projectStatusSortOrder');
  });
});

// ─── deployment_status ────────────────────────────────────────────────────────

describe('deployment_status', () => {
  const values = ['not_started', 'config', 'ready_to_ship', 'shipped', 'installing', 'qc', 'completed'] as const;

  it('has labels for all 7 values', () => {
    expect(Object.keys(deploymentStatusLabels)).toHaveLength(7);
    for (const v of values) expect(deploymentStatusLabels[v]).toBeDefined();
    checkNoUndefined(deploymentStatusLabels, 'deploymentStatusLabels');
  });

  it('has badge classes for all 7 values', () => {
    expect(Object.keys(deploymentStatusBadgeClass)).toHaveLength(7);
    checkNoUndefined(deploymentStatusBadgeClass, 'deploymentStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(deploymentStatusSortOrder, deploymentStatusLabels, 'deploymentStatusSortOrder');
  });
});

// ─── revenue_stage ────────────────────────────────────────────────────────────

describe('revenue_stage', () => {
  const values = ['proposal', 'signed', 'deposit_invoiced', 'deposit_paid', 'final_invoiced', 'final_paid'] as const;

  it('has labels for all 6 values', () => {
    expect(Object.keys(revenueStageLabels)).toHaveLength(6);
    for (const v of values) expect(revenueStageLabels[v]).toBeDefined();
    checkNoUndefined(revenueStageLabels, 'revenueStageLabels');
  });

  it('has badge classes for all 6 values', () => {
    expect(Object.keys(revenueStageBadgeClass)).toHaveLength(6);
    checkNoUndefined(revenueStageBadgeClass, 'revenueStageBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(revenueStageSortOrder, revenueStageLabels, 'revenueStageSortOrder');
  });
});

// ─── installer_type ───────────────────────────────────────────────────────────

describe('installer_type', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(installerTypeLabels)).toHaveLength(2);
    checkNoUndefined(installerTypeLabels, 'installerTypeLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(installerTypeBadgeClass)).toHaveLength(2);
    checkNoUndefined(installerTypeBadgeClass, 'installerTypeBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(installerTypeSortOrder, installerTypeLabels, 'installerTypeSortOrder');
  });
});

// ─── isp_type ─────────────────────────────────────────────────────────────────

describe('isp_type', () => {
  it('has labels for all 4 values', () => {
    expect(Object.keys(ispTypeLabels)).toHaveLength(4);
    checkNoUndefined(ispTypeLabels, 'ispTypeLabels');
  });

  it('has badge classes for all 4 values', () => {
    expect(Object.keys(ispTypeBadgeClass)).toHaveLength(4);
    checkNoUndefined(ispTypeBadgeClass, 'ispTypeBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(ispTypeSortOrder, ispTypeLabels, 'ispTypeSortOrder');
  });
});

// ─── replay_service_version ───────────────────────────────────────────────────

describe('replay_service_version', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(replayServiceVersionLabels)).toHaveLength(2);
    checkNoUndefined(replayServiceVersionLabels, 'replayServiceVersionLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(replayServiceVersionBadgeClass)).toHaveLength(2);
    checkNoUndefined(replayServiceVersionBadgeClass, 'replayServiceVersionBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(replayServiceVersionSortOrder, replayServiceVersionLabels, 'replayServiceVersionSortOrder');
  });
});

// ─── expense_category ─────────────────────────────────────────────────────────

describe('expense_category', () => {
  it('has labels for all 12 values', () => {
    expect(Object.keys(expenseCategoryLabels)).toHaveLength(12);
    checkNoUndefined(expenseCategoryLabels, 'expenseCategoryLabels');
  });

  it('has badge classes for all 12 values', () => {
    expect(Object.keys(expenseCategoryBadgeClass)).toHaveLength(12);
    checkNoUndefined(expenseCategoryBadgeClass, 'expenseCategoryBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(expenseCategorySortOrder, expenseCategoryLabels, 'expenseCategorySortOrder');
  });
});

// ─── payment_method ───────────────────────────────────────────────────────────

describe('payment_method', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(paymentMethodLabels)).toHaveLength(2);
    checkNoUndefined(paymentMethodLabels, 'paymentMethodLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(paymentMethodBadgeClass)).toHaveLength(2);
    checkNoUndefined(paymentMethodBadgeClass, 'paymentMethodBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(paymentMethodSortOrder, paymentMethodLabels, 'paymentMethodSortOrder');
  });
});

// ─── invoice_status ───────────────────────────────────────────────────────────

describe('invoice_status', () => {
  it('has labels for all 3 values', () => {
    expect(Object.keys(invoiceStatusLabels)).toHaveLength(3);
    checkNoUndefined(invoiceStatusLabels, 'invoiceStatusLabels');
  });

  it('has badge classes for all 3 values', () => {
    expect(Object.keys(invoiceStatusBadgeClass)).toHaveLength(3);
    checkNoUndefined(invoiceStatusBadgeClass, 'invoiceStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(invoiceStatusSortOrder, invoiceStatusLabels, 'invoiceStatusSortOrder');
  });
});

// ─── bom_category ─────────────────────────────────────────────────────────────

describe('bom_category', () => {
  it('has labels for all 10 values', () => {
    expect(Object.keys(bomCategoryLabels)).toHaveLength(10);
    checkNoUndefined(bomCategoryLabels, 'bomCategoryLabels');
  });

  it('has badge classes for all 10 values', () => {
    expect(Object.keys(bomCategoryBadgeClass)).toHaveLength(10);
    checkNoUndefined(bomCategoryBadgeClass, 'bomCategoryBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(bomCategorySortOrder, bomCategoryLabels, 'bomCategorySortOrder');
  });
});

// ─── inventory_movement_type ──────────────────────────────────────────────────

describe('inventory_movement_type', () => {
  it('has labels for all 6 values', () => {
    expect(Object.keys(inventoryMovementTypeLabels)).toHaveLength(6);
    checkNoUndefined(inventoryMovementTypeLabels, 'inventoryMovementTypeLabels');
  });

  it('has badge classes for all 6 values', () => {
    expect(Object.keys(inventoryMovementTypeBadgeClass)).toHaveLength(6);
    checkNoUndefined(inventoryMovementTypeBadgeClass, 'inventoryMovementTypeBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(inventoryMovementTypeSortOrder, inventoryMovementTypeLabels, 'inventoryMovementTypeSortOrder');
  });
});

// ─── sign_status ──────────────────────────────────────────────────────────────

describe('sign_status', () => {
  it('has labels for all 4 values', () => {
    expect(Object.keys(signStatusLabels)).toHaveLength(4);
    checkNoUndefined(signStatusLabels, 'signStatusLabels');
  });

  it('has badge classes for all 4 values', () => {
    expect(Object.keys(signStatusBadgeClass)).toHaveLength(4);
    checkNoUndefined(signStatusBadgeClass, 'signStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(signStatusSortOrder, signStatusLabels, 'signStatusSortOrder');
  });
});

// ─── cc_terminal_status ───────────────────────────────────────────────────────

describe('cc_terminal_status', () => {
  it('has labels for all 4 values', () => {
    expect(Object.keys(ccTerminalStatusLabels)).toHaveLength(4);
    checkNoUndefined(ccTerminalStatusLabels, 'ccTerminalStatusLabels');
  });

  it('has badge classes for all 4 values', () => {
    expect(Object.keys(ccTerminalStatusBadgeClass)).toHaveLength(4);
    checkNoUndefined(ccTerminalStatusBadgeClass, 'ccTerminalStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(ccTerminalStatusSortOrder, ccTerminalStatusLabels, 'ccTerminalStatusSortOrder');
  });
});

// ─── mdm_provider ─────────────────────────────────────────────────────────────

describe('mdm_provider', () => {
  it('has labels for all 3 values', () => {
    expect(Object.keys(mdmProviderLabels)).toHaveLength(3);
    checkNoUndefined(mdmProviderLabels, 'mdmProviderLabels');
  });

  it('has badge classes for all 3 values', () => {
    expect(Object.keys(mdmProviderBadgeClass)).toHaveLength(3);
    checkNoUndefined(mdmProviderBadgeClass, 'mdmProviderBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(mdmProviderSortOrder, mdmProviderLabels, 'mdmProviderSortOrder');
  });
});

// ─── device_migration_status ──────────────────────────────────────────────────

describe('device_migration_status', () => {
  it('has labels for all 6 values', () => {
    expect(Object.keys(deviceMigrationStatusLabels)).toHaveLength(6);
    checkNoUndefined(deviceMigrationStatusLabels, 'deviceMigrationStatusLabels');
  });

  it('has badge classes for all 6 values', () => {
    expect(Object.keys(deviceMigrationStatusBadgeClass)).toHaveLength(6);
    checkNoUndefined(deviceMigrationStatusBadgeClass, 'deviceMigrationStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(deviceMigrationStatusSortOrder, deviceMigrationStatusLabels, 'deviceMigrationStatusSortOrder');
  });
});

// ─── migration_device_type ────────────────────────────────────────────────────

describe('migration_device_type', () => {
  it('has labels for all 3 values', () => {
    expect(Object.keys(migrationDeviceTypeLabels)).toHaveLength(3);
    checkNoUndefined(migrationDeviceTypeLabels, 'migrationDeviceTypeLabels');
  });

  it('has badge classes for all 3 values', () => {
    expect(Object.keys(migrationDeviceTypeBadgeClass)).toHaveLength(3);
    checkNoUndefined(migrationDeviceTypeBadgeClass, 'migrationDeviceTypeBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(migrationDeviceTypeSortOrder, migrationDeviceTypeLabels, 'migrationDeviceTypeSortOrder');
  });
});

// ─── migration_device_status ──────────────────────────────────────────────────

describe('migration_device_status', () => {
  it('has labels for all 4 values', () => {
    expect(Object.keys(migrationDeviceStatusLabels)).toHaveLength(4);
    checkNoUndefined(migrationDeviceStatusLabels, 'migrationDeviceStatusLabels');
  });

  it('has badge classes for all 4 values', () => {
    expect(Object.keys(migrationDeviceStatusBadgeClass)).toHaveLength(4);
    checkNoUndefined(migrationDeviceStatusBadgeClass, 'migrationDeviceStatusBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(migrationDeviceStatusSortOrder, migrationDeviceStatusLabels, 'migrationDeviceStatusSortOrder');
  });
});

// ─── deployment_region ────────────────────────────────────────────────────────

describe('deployment_region', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(deploymentRegionLabels)).toHaveLength(2);
    checkNoUndefined(deploymentRegionLabels, 'deploymentRegionLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(deploymentRegionBadgeClass)).toHaveLength(2);
    checkNoUndefined(deploymentRegionBadgeClass, 'deploymentRegionBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(deploymentRegionSortOrder, deploymentRegionLabels, 'deploymentRegionSortOrder');
  });
});

// ─── video_standard ───────────────────────────────────────────────────────────

describe('video_standard', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(videoStandardLabels)).toHaveLength(2);
    checkNoUndefined(videoStandardLabels, 'videoStandardLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(videoStandardBadgeClass)).toHaveLength(2);
    checkNoUndefined(videoStandardBadgeClass, 'videoStandardBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(videoStandardSortOrder, videoStandardLabels, 'videoStandardSortOrder');
  });
});

// ─── power_standard ───────────────────────────────────────────────────────────

describe('power_standard', () => {
  it('has labels for all 2 values', () => {
    expect(Object.keys(powerStandardLabels)).toHaveLength(2);
    checkNoUndefined(powerStandardLabels, 'powerStandardLabels');
  });

  it('has badge classes for all 2 values', () => {
    expect(Object.keys(powerStandardBadgeClass)).toHaveLength(2);
    checkNoUndefined(powerStandardBadgeClass, 'powerStandardBadgeClass');
  });

  it('has sort order covering all values', () => {
    checkSortOrder(powerStandardSortOrder, powerStandardLabels, 'powerStandardSortOrder');
  });
});

// ─── Spec Spot-checks ─────────────────────────────────────────────────────────

describe('spec spot-checks', () => {
  it('project_status.intake label is "Intake"', () => {
    expect(projectStatusLabels.intake).toBe('Intake');
  });

  it('project_status.financial_close label is "Financial Close"', () => {
    expect(projectStatusLabels.financial_close).toBe('Financial Close');
  });

  it('service_tier.autonomous_plus label is "A+"', () => {
    expect(serviceTierLabels.autonomous_plus).toBe('A+');
  });

  it('service_tier.pro badge class is "bg-blue-100 text-blue-700 border-blue-200"', () => {
    expect(serviceTierBadgeClass.pro).toBe('bg-blue-100 text-blue-700 border-blue-200');
  });

  it('invoice_status.paid badge class is "bg-green-100 text-green-700 border-green-200"', () => {
    expect(invoiceStatusBadgeClass.paid).toBe('bg-green-100 text-green-700 border-green-200');
  });

  it('bom_category.displays label is "Displays & Kiosks"', () => {
    expect(bomCategoryLabels.displays).toBe('Displays & Kiosks');
  });

  it('deployment_status.config label is "Configuring"', () => {
    expect(deploymentStatusLabels.config).toBe('Configuring');
  });

  it('inventory_movement_type.purchase_order_received badge class is "text-green-600"', () => {
    expect(inventoryMovementTypeBadgeClass.purchase_order_received).toBe('text-green-600');
  });

  it('power_standard.220v_60hz label is "220V / 60Hz (Philippines)"', () => {
    expect(powerStandardLabels['220v_60hz']).toBe('220V / 60Hz (Philippines)');
  });

  it('expense_category.taxi label is "Taxi / Rideshare"', () => {
    expect(expenseCategoryLabels.taxi).toBe('Taxi / Rideshare');
  });
});

// ─── Generic Helpers ──────────────────────────────────────────────────────────

describe('getEnumLabel', () => {
  it('returns the correct label for project_status.intake', () => {
    expect(getEnumLabel('project_status', 'intake')).toBe('Intake');
  });

  it('returns the correct label for service_tier.pbk', () => {
    expect(getEnumLabel('service_tier', 'pbk')).toBe('PBK');
  });

  it('returns the correct label for bom_category.pingpod_specific', () => {
    expect(getEnumLabel('bom_category', 'pingpod_specific')).toBe('PingPod Specific');
  });

  it('falls back to the raw value for unknown enum type', () => {
    expect(getEnumLabel('unknown_type', 'some_value')).toBe('some_value');
  });

  it('falls back to the raw value for unknown enum value', () => {
    expect(getEnumLabel('project_status', 'nonexistent')).toBe('nonexistent');
  });
});

describe('getEnumBadgeClass', () => {
  it('returns correct badge class for invoice_status.sent', () => {
    expect(getEnumBadgeClass('invoice_status', 'sent')).toBe('bg-yellow-100 text-yellow-700 border-yellow-200');
  });

  it('returns correct badge class for sign_status.installed', () => {
    expect(getEnumBadgeClass('sign_status', 'installed')).toBe('bg-green-100 text-green-700 border-green-200');
  });

  it('returns correct badge class for service_tier.autonomous', () => {
    expect(getEnumBadgeClass('service_tier', 'autonomous')).toBe('bg-purple-100 text-purple-700 border-purple-200');
  });

  it('returns empty string for unknown enum type', () => {
    expect(getEnumBadgeClass('unknown_type', 'some_value')).toBe('');
  });

  it('returns empty string for unknown enum value', () => {
    expect(getEnumBadgeClass('project_status', 'nonexistent')).toBe('');
  });
});
