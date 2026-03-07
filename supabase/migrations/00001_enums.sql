-- PodPlay Ops Wizard — Enum Types
-- All 21 enum types defined in the spec (data-model/schema.md)

-- Tier of PodPlay installation
CREATE TYPE service_tier AS ENUM (
  'pro',
  'autonomous',
  'autonomous_plus',
  'pbk'
);

-- Overall wizard stage / project lifecycle status
CREATE TYPE project_status AS ENUM (
  'intake',
  'procurement',
  'deployment',
  'financial_close',
  'completed',
  'cancelled'
);

-- Granular deployment sub-status (within Stage 3)
CREATE TYPE deployment_status AS ENUM (
  'not_started',
  'config',
  'ready_to_ship',
  'shipped',
  'installing',
  'qc',
  'completed'
);

-- Revenue pipeline stage (financial tracking)
CREATE TYPE revenue_stage AS ENUM (
  'proposal',
  'signed',
  'deposit_invoiced',
  'deposit_paid',
  'final_invoiced',
  'final_paid'
);

-- Installer source: PodPlay-vetted or client's own
CREATE TYPE installer_type AS ENUM (
  'podplay_vetted',
  'client_own'
);

-- ISP connection type at venue
CREATE TYPE isp_type AS ENUM (
  'fiber',
  'cable',
  'dedicated',
  'other'
);

-- Replay service version
CREATE TYPE replay_service_version AS ENUM (
  'v1',
  'v2'
);

-- Expense category for project expenses
CREATE TYPE expense_category AS ENUM (
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
  'other'
);

-- How an expense was paid
CREATE TYPE payment_method AS ENUM (
  'podplay_card',
  'ramp_reimburse'
);

-- Invoice status for deposit and final invoices
CREATE TYPE invoice_status AS ENUM (
  'not_sent',
  'sent',
  'paid'
);

-- BOM item category for UI grouping and filtering
CREATE TYPE bom_category AS ENUM (
  'network_rack',
  'replay_system',
  'displays',
  'access_control',
  'surveillance',
  'front_desk',
  'cabling',
  'signage',
  'infrastructure',
  'pingpod_specific'
);

-- Inventory movement type
CREATE TYPE inventory_movement_type AS ENUM (
  'purchase_order_received',
  'project_allocated',
  'project_shipped',
  'adjustment_increase',
  'adjustment_decrease',
  'return'
);

-- Replay sign fulfillment status
CREATE TYPE sign_status AS ENUM (
  'staged',
  'shipped',
  'delivered',
  'installed'
);

-- CC terminal (BBPOS WisePOS E) order status
CREATE TYPE cc_terminal_status AS ENUM (
  'not_ordered',
  'ordered',
  'delivered',
  'installed'
);

-- MDM provider options for target org
CREATE TYPE mdm_provider AS ENUM (
  'mosyle',
  'jamf',
  'other'
);

-- Overall migration event status
CREATE TYPE device_migration_status AS ENUM (
  'planning',
  'released',
  'enrolled',
  'configured',
  'completed',
  'cancelled'
);

-- Physical device type being migrated
CREATE TYPE migration_device_type AS ENUM (
  'ipad',
  'apple_tv',
  'mac_mini'
);

-- Per-device item status within a migration
CREATE TYPE migration_device_status AS ENUM (
  'pending',
  'released',
  'enrolled',
  'configured'
);

-- Geographic deployment region
CREATE TYPE deployment_region AS ENUM (
  'us',
  'philippines'
);

-- Video encoding standard
CREATE TYPE video_standard AS ENUM (
  'ntsc',
  'pal'
);

-- Electrical power standard
CREATE TYPE power_standard AS ENUM (
  '120v_60hz',
  '220v_60hz'
);
