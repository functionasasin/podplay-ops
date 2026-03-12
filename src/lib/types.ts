// PodPlay Ops Wizard — TypeScript union types matching SQL enums (00001_enums.sql)

export type ServiceTier = 'pro' | 'autonomous' | 'autonomous_plus';

export type ProjectStatus =
  | 'intake'
  | 'procurement'
  | 'deployment'
  | 'financial_close'
  | 'completed'
  | 'cancelled';

export type DeploymentStatus =
  | 'not_started'
  | 'config'
  | 'ready_to_ship'
  | 'shipped'
  | 'installing'
  | 'qc'
  | 'completed';

export type RevenueStage =
  | 'proposal'
  | 'signed'
  | 'deposit_invoiced'
  | 'deposit_paid'
  | 'final_invoiced'
  | 'final_paid';

export type InstallerType = 'podplay_vetted' | 'client_own';

export type IspType = 'fiber' | 'cable' | 'dedicated' | 'other';

export type ReplayServiceVersion = 'v1' | 'v2';

export type ExpenseCategory =
  | 'airfare'
  | 'car'
  | 'fuel'
  | 'lodging'
  | 'meals'
  | 'misc_hardware'
  | 'outbound_shipping'
  | 'professional_services'
  | 'taxi'
  | 'train'
  | 'parking'
  | 'other';

export type PaymentMethod = 'podplay_card' | 'ramp_reimburse';

export type InvoiceStatus = 'not_sent' | 'sent' | 'paid';

export type BomCategory =
  | 'network_rack'
  | 'replay_system'
  | 'displays'
  | 'access_control'
  | 'surveillance'
  | 'front_desk'
  | 'cabling'
  | 'signage'
  | 'infrastructure'
  | 'pingpod_specific';

export type InventoryMovementType =
  | 'purchase_order_received'
  | 'project_allocated'
  | 'project_shipped'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'return';

export type SignStatus = 'staged' | 'shipped' | 'delivered' | 'installed';


export type MdmProvider = 'mosyle' | 'jamf' | 'other';

export type DeviceMigrationStatus =
  | 'planning'
  | 'released'
  | 'enrolled'
  | 'configured'
  | 'completed'
  | 'cancelled';

export type MigrationDeviceType = 'ipad' | 'apple_tv' | 'mac_mini';

export type MigrationDeviceStatus = 'pending' | 'released' | 'enrolled' | 'configured';

export type DeploymentRegion = 'us' | 'philippines';

export type VideoStandard = 'ntsc' | 'pal';

export type PowerStandard = '120v_60hz' | '220v_60hz';
