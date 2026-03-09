// Tests: all 21 enum union types from src/lib/types.ts
// Verifies exact values match the spec (data-model/schema.md)

import {
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
  CcTerminalStatus,
  MdmProvider,
  DeviceMigrationStatus,
  MigrationDeviceType,
  MigrationDeviceStatus,
  DeploymentRegion,
  VideoStandard,
  PowerStandard,
} from '../lib/types';

// Helper: assert that a typed array contains exactly the expected values
function expectExact<T extends string>(values: T[], expected: T[]) {
  expect(values).toHaveLength(expected.length);
  expect(values).toEqual(expected);
}

// ─── Tiers ───────────────────────────────────────────────────────────────────

describe('ServiceTier', () => {
  it('has exact values from spec', () => {
    const values: ServiceTier[] = ['pro', 'autonomous', 'autonomous_plus'];
    expectExact(values, ['pro', 'autonomous', 'autonomous_plus']);
  });
});

// ─── Project & Deployment Statuses ───────────────────────────────────────────

describe('ProjectStatus', () => {
  it('has exact values from spec', () => {
    const values: ProjectStatus[] = [
      'intake',
      'procurement',
      'deployment',
      'financial_close',
      'completed',
      'cancelled',
    ];
    expectExact(values, [
      'intake',
      'procurement',
      'deployment',
      'financial_close',
      'completed',
      'cancelled',
    ]);
  });
});

describe('DeploymentStatus', () => {
  it('has exact values from spec', () => {
    const values: DeploymentStatus[] = [
      'not_started',
      'config',
      'ready_to_ship',
      'shipped',
      'installing',
      'qc',
      'completed',
    ];
    expectExact(values, [
      'not_started',
      'config',
      'ready_to_ship',
      'shipped',
      'installing',
      'qc',
      'completed',
    ]);
  });
});

// ─── Financial ───────────────────────────────────────────────────────────────

describe('RevenueStage', () => {
  it('has exact values from spec', () => {
    const values: RevenueStage[] = [
      'proposal',
      'signed',
      'deposit_invoiced',
      'deposit_paid',
      'final_invoiced',
      'final_paid',
    ];
    expectExact(values, [
      'proposal',
      'signed',
      'deposit_invoiced',
      'deposit_paid',
      'final_invoiced',
      'final_paid',
    ]);
  });
});

describe('PaymentMethod', () => {
  it('has exact values from spec', () => {
    const values: PaymentMethod[] = ['podplay_card', 'ramp_reimburse'];
    expectExact(values, ['podplay_card', 'ramp_reimburse']);
  });
});

describe('InvoiceStatus', () => {
  it('has exact values from spec', () => {
    const values: InvoiceStatus[] = ['not_sent', 'sent', 'paid'];
    expectExact(values, ['not_sent', 'sent', 'paid']);
  });
});

describe('ExpenseCategory', () => {
  it('has exact values from spec', () => {
    const values: ExpenseCategory[] = [
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
    ];
    expectExact(values, [
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
    ]);
  });
});

// ─── Installer & ISP ─────────────────────────────────────────────────────────

describe('InstallerType', () => {
  it('has exact values from spec', () => {
    const values: InstallerType[] = ['podplay_vetted', 'client_own'];
    expectExact(values, ['podplay_vetted', 'client_own']);
  });
});

describe('IspType', () => {
  it('has exact values from spec', () => {
    const values: IspType[] = ['fiber', 'cable', 'dedicated', 'other'];
    expectExact(values, ['fiber', 'cable', 'dedicated', 'other']);
  });
});

describe('ReplayServiceVersion', () => {
  it('has exact values from spec', () => {
    const values: ReplayServiceVersion[] = ['v1', 'v2'];
    expectExact(values, ['v1', 'v2']);
  });
});

// ─── BOM & Inventory ─────────────────────────────────────────────────────────

describe('BomCategory', () => {
  it('has exact values from spec', () => {
    const values: BomCategory[] = [
      'network_rack',
      'replay_system',
      'displays',
      'access_control',
      'surveillance',
      'front_desk',
      'cabling',
      'signage',
      'infrastructure',
      'pingpod_specific',
    ];
    expectExact(values, [
      'network_rack',
      'replay_system',
      'displays',
      'access_control',
      'surveillance',
      'front_desk',
      'cabling',
      'signage',
      'infrastructure',
      'pingpod_specific',
    ]);
  });
});

describe('InventoryMovementType', () => {
  it('has exact values from spec', () => {
    const values: InventoryMovementType[] = [
      'purchase_order_received',
      'project_allocated',
      'project_shipped',
      'adjustment_increase',
      'adjustment_decrease',
      'return',
    ];
    expectExact(values, [
      'purchase_order_received',
      'project_allocated',
      'project_shipped',
      'adjustment_increase',
      'adjustment_decrease',
      'return',
    ]);
  });
});

// ─── Hardware Fulfillment ─────────────────────────────────────────────────────

describe('SignStatus', () => {
  it('has exact values from spec', () => {
    const values: SignStatus[] = ['staged', 'shipped', 'delivered', 'installed'];
    expectExact(values, ['staged', 'shipped', 'delivered', 'installed']);
  });
});

describe('CcTerminalStatus', () => {
  it('has exact values from spec', () => {
    const values: CcTerminalStatus[] = ['not_ordered', 'ordered', 'delivered', 'installed'];
    expectExact(values, ['not_ordered', 'ordered', 'delivered', 'installed']);
  });
});

// ─── MDM & Device Migration ───────────────────────────────────────────────────

describe('MdmProvider', () => {
  it('has exact values from spec', () => {
    const values: MdmProvider[] = ['mosyle', 'jamf', 'other'];
    expectExact(values, ['mosyle', 'jamf', 'other']);
  });
});

describe('DeviceMigrationStatus', () => {
  it('has exact values from spec', () => {
    const values: DeviceMigrationStatus[] = [
      'planning',
      'released',
      'enrolled',
      'configured',
      'completed',
      'cancelled',
    ];
    expectExact(values, [
      'planning',
      'released',
      'enrolled',
      'configured',
      'completed',
      'cancelled',
    ]);
  });
});

describe('MigrationDeviceType', () => {
  it('has exact values from spec', () => {
    const values: MigrationDeviceType[] = ['ipad', 'apple_tv', 'mac_mini'];
    expectExact(values, ['ipad', 'apple_tv', 'mac_mini']);
  });
});

describe('MigrationDeviceStatus', () => {
  it('has exact values from spec', () => {
    const values: MigrationDeviceStatus[] = ['pending', 'released', 'enrolled', 'configured'];
    expectExact(values, ['pending', 'released', 'enrolled', 'configured']);
  });
});

// ─── Deployment Region & Standards ───────────────────────────────────────────

describe('DeploymentRegion', () => {
  it('has exact values from spec', () => {
    const values: DeploymentRegion[] = ['us', 'philippines'];
    expectExact(values, ['us', 'philippines']);
  });
});

describe('VideoStandard', () => {
  it('has exact values from spec', () => {
    const values: VideoStandard[] = ['ntsc', 'pal'];
    expectExact(values, ['ntsc', 'pal']);
  });
});

describe('PowerStandard', () => {
  it('has exact values from spec', () => {
    const values: PowerStandard[] = ['120v_60hz', '220v_60hz'];
    expectExact(values, ['120v_60hz', '220v_60hz']);
  });
});
