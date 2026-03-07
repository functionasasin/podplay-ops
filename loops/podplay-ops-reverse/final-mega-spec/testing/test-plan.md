# PodPlay Ops Wizard — Test Plan

**Aspect**: ship-testing
**Wave**: 5 — Ship & Polish
**Date**: 2026-03-06
**Depends On**: All Wave 2 (data model), Wave 3 (business logic), Wave 4 (UI spec)

---

## Overview

This plan covers the complete test strategy for the PodPlay Ops Wizard. All tests are client-side
TypeScript. The app has no backend server — all logic runs in the browser against Supabase. Testing
focuses on:

1. **Unit tests** — pure TypeScript business logic (BOM generation, cost analysis, invoice math, deployment state machine)
2. **Zod schema validation tests** — form field validation rules
3. **Component tests** — key React components with mocked Supabase
4. **Smoke tests** — end-to-end critical path flows

---

## Test Framework & Setup

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0",
    "msw": "^2.0.0"
  }
}
```

### `vite.config.ts` test section

```typescript
test: {
  environment: 'jsdom',
  setupFiles: ['src/test/setup.ts'],
  globals: true,
}
```

### `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client globally
vi.mock('src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn() },
  },
}));
```

### `src/test/fixtures.ts`

Shared test fixtures used across all tests:

```typescript
// Minimal valid project for Pro tier, 4 courts
export const PRO_PROJECT_4_COURTS = {
  id: 'proj-001',
  venue_name: 'Test Club',
  tier: 'pro' as const,
  court_count: 4,
  door_count: 0,
  security_camera_count: 0,
  has_front_desk: false,
  has_pingpod_wifi: false,
  project_status: 'intake' as const,
  deployment_status: 'not_started' as const,
  revenue_stage: 'proposal' as const,
};

// Autonomous+ project with 6 courts, 2 doors, 4 cameras, front desk
export const AUTONOMOUS_PLUS_PROJECT = {
  id: 'proj-002',
  venue_name: 'Big Arena',
  tier: 'autonomous_plus' as const,
  court_count: 6,
  door_count: 2,
  security_camera_count: 4,
  has_front_desk: true,
  has_pingpod_wifi: false,
  project_status: 'procurement' as const,
  deployment_status: 'not_started' as const,
  revenue_stage: 'signed' as const,
};

// Default settings row
export const DEFAULT_SETTINGS = {
  shipping_rate: 0.10,
  target_margin: 0.10,
  sales_tax_rate: 0.1025,
  pro_venue_fee: 5000,
  pro_court_fee: 2500,
  autonomous_venue_fee: 7500,
  autonomous_court_fee: 2500,
  autonomous_plus_venue_fee: 7500,
  autonomous_plus_court_fee: 2500,
  pbk_venue_fee: 0,
  pbk_court_fee: 0,
  mileage_rate: 0.67,
  per_diem_rate: 75,
};

// BOM template rows for Pro tier (subset — enough to drive tests)
export const PRO_BOM_TEMPLATES = [
  // MAC-MINI: 1 per venue
  { id: 'tpl-001', tier: 'pro', hardware_catalog_id: 'hw-001', qty_per_venue: 1, qty_per_court: 0, qty_per_door: 0, qty_per_camera: 0, sort_order: 1, hardware_catalog: { id: 'hw-001', sku: 'MAC-MINI', name: 'Apple Mac Mini M4', unit_cost: 700.00, category: 'compute' } },
  // REPLAY-CAM: 1 per court
  { id: 'tpl-002', tier: 'pro', hardware_catalog_id: 'hw-002', qty_per_venue: 0, qty_per_court: 1, qty_per_door: 0, qty_per_camera: 0, sort_order: 2, hardware_catalog: { id: 'hw-002', sku: 'REPLAY-CAM', name: 'Replay Camera (Axis P3245-V)', unit_cost: 380.00, category: 'camera' } },
  // DISPLAY: 1 per court
  { id: 'tpl-003', tier: 'pro', hardware_catalog_id: 'hw-003', qty_per_venue: 0, qty_per_court: 1, qty_per_door: 0, qty_per_camera: 0, sort_order: 3, hardware_catalog: { id: 'hw-003', sku: 'TV-55', name: '55" Commercial Display (LG 55UN570H)', unit_cost: 450.00, category: 'display' } },
];

// BOM template rows for Autonomous tier (adds Kisi + G5 cameras)
export const AUTONOMOUS_BOM_TEMPLATES = [
  ...PRO_BOM_TEMPLATES,
  // KISI-READER: 1 per door
  { id: 'tpl-010', tier: 'autonomous', hardware_catalog_id: 'hw-010', qty_per_venue: 0, qty_per_court: 0, qty_per_door: 1, qty_per_camera: 0, sort_order: 27, hardware_catalog: { id: 'hw-010', sku: 'KISI-READER', name: 'Kisi Reader Pro', unit_cost: 199.00, category: 'access_control' } },
  // G5-CAM: 1 per camera
  { id: 'tpl-011', tier: 'autonomous', hardware_catalog_id: 'hw-011', qty_per_venue: 0, qty_per_court: 0, qty_per_door: 0, qty_per_camera: 1, sort_order: 28, hardware_catalog: { id: 'hw-011', sku: 'G5-CAM', name: 'UniFi G5 Dome Camera', unit_cost: 179.00, category: 'security_camera' } },
];

// Front desk add-on items
export const FRONT_DESK_TEMPLATES = [
  { id: 'tpl-fd-001', tier: 'pro', hardware_catalog_id: 'hw-fd-001', qty_per_venue: 1, qty_per_court: 0, qty_per_door: 0, qty_per_camera: 0, sort_order: 50, hardware_catalog: { id: 'hw-fd-001', sku: 'DESK-WEBCAM', name: 'Logitech C920 HD Webcam', unit_cost: 70.00, category: 'front_desk' } },
  { id: 'tpl-fd-002', tier: 'pro', hardware_catalog_id: 'hw-fd-002', qty_per_venue: 1, qty_per_court: 0, qty_per_door: 0, qty_per_camera: 0, sort_order: 51, hardware_catalog: { id: 'hw-fd-002', sku: 'DESK-SCANNER', name: 'Tera Barcode Scanner (USB)', unit_cost: 30.00, category: 'front_desk' } },
];
```

---

## Test Files

### 1. `src/lib/__tests__/bom-generation.test.ts`

**Purpose**: Verify the BOM generation algorithm produces correct quantities for all tier/configuration combinations.

**Test cases**:

#### 1.1 — Pro tier, 4 courts, no front desk, no pingpod

```typescript
it('generates correct quantities for Pro 4-court project', () => {
  const items = computeBomItems(PRO_PROJECT_4_COURTS, PRO_BOM_TEMPLATES, DEFAULT_SETTINGS);
  const macMini = items.find(i => i.sku === 'MAC-MINI');
  const replayCams = items.find(i => i.sku === 'REPLAY-CAM');
  const displays = items.find(i => i.sku === 'TV-55');

  expect(macMini?.qty).toBe(1);         // qty_per_venue=1, no courts/doors/cameras
  expect(replayCams?.qty).toBe(4);      // qty_per_court=1 × 4 courts
  expect(displays?.qty).toBe(4);        // qty_per_court=1 × 4 courts
});
```

#### 1.2 — Autonomous+ tier, 6 courts, 2 doors, 4 cameras

```typescript
it('generates correct quantities for Autonomous+ 6-court with doors and cameras', () => {
  const templates = [...AUTONOMOUS_BOM_TEMPLATES]; // includes per-door and per-camera rows
  const items = computeBomItems(AUTONOMOUS_PLUS_PROJECT, templates, DEFAULT_SETTINGS);
  const kisiReaders = items.find(i => i.sku === 'KISI-READER');
  const g5Cams = items.find(i => i.sku === 'G5-CAM');

  expect(kisiReaders?.qty).toBe(2);     // qty_per_door=1 × 2 doors
  expect(g5Cams?.qty).toBe(4);          // qty_per_camera=1 × 4 security_camera_count
});
```

#### 1.3 — Front desk add-ons included when has_front_desk = true

```typescript
it('appends front desk items when has_front_desk is true', () => {
  const project = { ...PRO_PROJECT_4_COURTS, has_front_desk: true };
  const templates = [...PRO_BOM_TEMPLATES, ...FRONT_DESK_TEMPLATES];
  const items = computeBomItems(project, templates, DEFAULT_SETTINGS);

  expect(items.some(i => i.sku === 'DESK-WEBCAM')).toBe(true);
  expect(items.some(i => i.sku === 'DESK-SCANNER')).toBe(true);
});
```

#### 1.4 — Front desk items absent when has_front_desk = false

```typescript
it('excludes front desk items when has_front_desk is false', () => {
  const templates = [...PRO_BOM_TEMPLATES, ...FRONT_DESK_TEMPLATES];
  const items = computeBomItems(PRO_PROJECT_4_COURTS, templates, DEFAULT_SETTINGS);

  expect(items.some(i => i.sku === 'DESK-WEBCAM')).toBe(false);
  expect(items.some(i => i.sku === 'DESK-SCANNER')).toBe(false);
});
```

#### 1.5 — Zero-qty rows removed from output

```typescript
it('removes items with computed qty = 0', () => {
  // Template with qty_per_door=1 but project has door_count=0
  const proTemplates = [
    ...PRO_BOM_TEMPLATES,
    { id: 'tpl-door', tier: 'pro', hardware_catalog_id: 'hw-door', qty_per_venue: 0, qty_per_court: 0, qty_per_door: 1, qty_per_camera: 0, sort_order: 99, hardware_catalog: { id: 'hw-door', sku: 'KISI-READER', name: 'Kisi Reader Pro', unit_cost: 199, category: 'access_control' } },
  ];
  const items = computeBomItems(PRO_PROJECT_4_COURTS, proTemplates, DEFAULT_SETTINGS);
  expect(items.some(i => i.sku === 'KISI-READER')).toBe(false);
});
```

#### 1.6 — PBK tier uses Pro template rows (identical structure)

```typescript
it('uses same template rows as Pro for PBK tier', () => {
  const pbkProject = { ...PRO_PROJECT_4_COURTS, tier: 'pbk' as const };
  const pbkTemplates = PRO_BOM_TEMPLATES.map(t => ({ ...t, tier: 'pbk' as const }));
  const items = computeBomItems(pbkProject, pbkTemplates, DEFAULT_SETTINGS);

  expect(items.find(i => i.sku === 'MAC-MINI')?.qty).toBe(1);
  expect(items.find(i => i.sku === 'REPLAY-CAM')?.qty).toBe(4);
});
```

#### 1.7 — Sort order preserved

```typescript
it('returns items in sort_order ascending', () => {
  const items = computeBomItems(PRO_PROJECT_4_COURTS, PRO_BOM_TEMPLATES, DEFAULT_SETTINGS);
  const sortOrders = items.map(i => i.sort_order);
  expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b));
});
```

---

### 2. `src/lib/__tests__/cost-analysis.test.ts`

**Purpose**: Verify the BOM cost chain formulas and invoice math against known values from the MRP.

#### 2.1 — BOM cost chain: Mac Mini single unit

```typescript
it('computes cost chain correctly for Mac Mini (1 unit)', () => {
  const result = computeItemCosts({
    qty: 1,
    unit_cost: 700.00,
    shipping_rate: 0.10,
    margin: 0.10,
  });

  expect(result.est_total_cost).toBeCloseTo(700.00, 2);
  expect(result.landed_cost).toBeCloseTo(770.00, 2);
  expect(result.customer_price).toBeCloseTo(855.56, 2);
});
```

#### 2.2 — BOM cost chain: Replay camera, 4 units

```typescript
it('computes cost chain correctly for 4x Replay Cameras', () => {
  const result = computeItemCosts({
    qty: 4,
    unit_cost: 380.00,
    shipping_rate: 0.10,
    margin: 0.10,
  });

  expect(result.est_total_cost).toBeCloseTo(1520.00, 2);    // 4 × 380
  expect(result.landed_cost).toBeCloseTo(1672.00, 2);       // 1520 × 1.10
  expect(result.customer_price).toBeCloseTo(1857.78, 2);    // 1672 / 0.90
});
```

#### 2.3 — NULL unit_cost returns NULL for all computed fields

```typescript
it('returns null cost values when unit_cost is null', () => {
  const result = computeItemCosts({
    qty: 2,
    unit_cost: null,
    shipping_rate: 0.10,
    margin: 0.10,
  });

  expect(result.est_total_cost).toBeNull();
  expect(result.landed_cost).toBeNull();
  expect(result.customer_price).toBeNull();
});
```

#### 2.4 — Service fee: Pro tier, 6 courts

```typescript
it('computes Pro service fee: 5000 + 6 × 2500 = 20000', () => {
  const fee = computeServiceFee('pro', 6, DEFAULT_SETTINGS);
  expect(fee).toBe(20000);
});
```

#### 2.5 — Service fee: Autonomous tier, 4 courts

```typescript
it('computes Autonomous service fee: 7500 + 4 × 2500 = 17500', () => {
  const fee = computeServiceFee('autonomous', 4, DEFAULT_SETTINGS);
  expect(fee).toBe(17500);
});
```

#### 2.6 — Invoice total: hardware subtotal + service fee + tax, then split 50/50

```typescript
it('computes two-installment invoice amounts correctly', () => {
  // Simulated BOM with known hardware_subtotal
  const hardware_subtotal = 10000.00;
  const service_fee = 20000.00;  // Pro 6-court: 5000 + 6×2500
  const settings = DEFAULT_SETTINGS;

  const result = computeInvoiceAmounts(hardware_subtotal, service_fee, settings);

  const subtotal = 30000.00;
  const tax = subtotal * 0.1025;          // = 3075.00
  const total = subtotal + tax;           // = 33075.00
  const installment = total / 2;          // = 16537.50

  expect(result.tax_amount).toBeCloseTo(3075.00, 2);
  expect(result.total_amount).toBeCloseTo(33075.00, 2);
  expect(result.deposit_amount).toBeCloseTo(16537.50, 2);
  expect(result.final_amount).toBeCloseTo(16537.50, 2);
});
```

#### 2.7 — Hardware subtotal excludes NULL customer_price items

```typescript
it('excludes BOM items with null customer_price from hardware subtotal', () => {
  const items = [
    { customer_price: 855.56 },
    { customer_price: null },   // unit_cost unknown
    { customer_price: 1857.78 },
  ];
  const subtotal = computeHardwareSubtotal(items);
  expect(subtotal).toBeCloseTo(855.56 + 1857.78, 2);
});
```

#### 2.8 — Project P&L: net profit calculation

```typescript
it('computes project net profit correctly', () => {
  const result = computeProjectPnL({
    total_revenue: 33075.00,       // total invoice amount paid
    hardware_cost: 9000.00,        // SUM(project_bom_items.est_total_cost)
    labor_cost: 3000.00,           // installer labor (from expenses)
    travel_cost: 800.00,           // airfare + hotel + mileage + per_diem
    other_expenses: 200.00,        // misc
  });

  // gross_profit = 33075 − 9000 = 24075
  // net_profit = 24075 − 3000 − 800 − 200 = 20075
  expect(result.gross_profit).toBeCloseTo(24075.00, 2);
  expect(result.net_profit).toBeCloseTo(20075.00, 2);
  expect(result.margin_pct).toBeCloseTo(20075.00 / 33075.00, 4);
});
```

---

### 3. `src/lib/__tests__/deployment-tracking.test.ts`

**Purpose**: Verify deployment status state machine transition rules and progress calculation.

#### 3.1 — Progress % = completed items / total items

```typescript
it('calculates progress % from checklist completion ratio', () => {
  const items = [
    { is_completed: true },
    { is_completed: true },
    { is_completed: false },
    { is_completed: false },
    { is_completed: false },
  ];
  const progress = computeDeploymentProgress(items);
  expect(progress).toBeCloseTo(40.0, 1); // 2/5 = 40%
});
```

#### 3.2 — Progress 0% when no items completed

```typescript
it('returns 0% when no items are completed', () => {
  const items = Array.from({ length: 10 }, () => ({ is_completed: false }));
  expect(computeDeploymentProgress(items)).toBe(0);
});
```

#### 3.3 — Progress 100% when all items completed

```typescript
it('returns 100% when all items completed', () => {
  const items = Array.from({ length: 121 }, () => ({ is_completed: true }));
  expect(computeDeploymentProgress(items)).toBe(100);
});
```

#### 3.4 — Status derivation: not_started when progress = 0

```typescript
it('derives not_started status when no checklist items completed', () => {
  const status = deriveDeploymentStatus(0, []);
  expect(status).toBe('not_started');
});
```

#### 3.5 — Transition guard: config → ready_to_ship requires Phases 0–11 and Phase 15 complete

```typescript
it('blocks config→ready_to_ship transition if Phase 15 items not complete', () => {
  // 121 items total; phases 0-11 complete, phase 15 not done
  const items = MOCK_CHECKLIST_121_ITEMS.map(item =>
    item.phase_number <= 11 ? { ...item, is_completed: true } : item
  );
  const canTransition = canAdvanceFromConfig(items);
  expect(canTransition).toBe(false);
});
```

#### 3.6 — Transition guard: qc → completed requires Phase 13 and Phase 14 complete

```typescript
it('blocks qc→completed when Phase 14 health monitoring items not done', () => {
  const items = MOCK_CHECKLIST_121_ITEMS.map(item =>
    item.phase_number < 14 ? { ...item, is_completed: true } : item
  );
  const canTransition = canAdvanceFromQC(items);
  expect(canTransition).toBe(false);
});
```

#### 3.7 — Checklist instantiation: correct item count per tier

```typescript
it('instantiates 121 checklist items for Pro tier from template', () => {
  const items = instantiateChecklist('pro', 'proj-001', PRO_CHECKLIST_TEMPLATES);
  expect(items.length).toBe(121);
  // Verify phase distribution
  const byPhase = Object.groupBy(items, (i) => i.phase_number);
  expect(Object.keys(byPhase).length).toBe(16); // Phases 0-15
});
```

---

### 4. `src/lib/__tests__/inventory-management.test.ts`

**Purpose**: Verify stock level arithmetic and allocation logic.

#### 4.1 — Available stock = qty_on_hand − qty_allocated

```typescript
it('computes available stock correctly', () => {
  const item = { qty_on_hand: 20, qty_allocated: 5 };
  expect(computeAvailableStock(item)).toBe(15);
});
```

#### 4.2 — Low stock flag when available ≤ reorder_threshold

```typescript
it('flags low stock when available ≤ reorder_threshold', () => {
  expect(isLowStock({ qty_on_hand: 5, qty_allocated: 3, reorder_threshold: 5 })).toBe(true);
  expect(isLowStock({ qty_on_hand: 10, qty_allocated: 3, reorder_threshold: 5 })).toBe(false);
});
```

#### 4.3 — Allocation deducts from available, not qty_on_hand

```typescript
it('increases qty_allocated (not qty_on_hand) when allocating to project', () => {
  const before = { qty_on_hand: 20, qty_allocated: 0 };
  const after = applyAllocation(before, 4);
  expect(after.qty_on_hand).toBe(20);    // unchanged
  expect(after.qty_allocated).toBe(4);
});
```

#### 4.4 — Over-allocation rejected when qty > available

```typescript
it('throws when allocation qty exceeds available stock', () => {
  const item = { qty_on_hand: 10, qty_allocated: 8 }; // available = 2
  expect(() => applyAllocation(item, 5)).toThrow(/insufficient stock/i);
});
```

#### 4.5 — Receiving PO increases qty_on_hand by received_qty

```typescript
it('increases qty_on_hand when PO received', () => {
  const before = { qty_on_hand: 5, qty_allocated: 0 };
  const after = applyReceiving(before, 10);
  expect(after.qty_on_hand).toBe(15);
});
```

#### 4.6 — Shipping deducts from both qty_on_hand and qty_allocated

```typescript
it('deducts from qty_on_hand and qty_allocated when items shipped to venue', () => {
  const before = { qty_on_hand: 20, qty_allocated: 4 };
  const after = applyShipping(before, 4);
  expect(after.qty_on_hand).toBe(16);
  expect(after.qty_allocated).toBe(0);
});
```

---

### 5. `src/lib/__tests__/isp-validation.test.ts`

**Purpose**: Verify ISP speed recommendations and Starlink warning.

#### 5.1 — Starlink connection triggers block warning

```typescript
it('returns BLOCK result for Starlink ISP', () => {
  const result = validateISP({ isp_name: 'Starlink', isp_type: 'other', court_count: 4 });
  expect(result.level).toBe('block');
  expect(result.message).toMatch(/starlink.*not supported/i);
});
```

#### 5.2 — Speed recommendation: 4 courts requires ≥ 100 Mbps symmetrical

```typescript
it('recommends 100 Mbps for 4-court venue', () => {
  const rec = getSpeedRecommendation(4);
  expect(rec.min_download_mbps).toBe(100);
  expect(rec.min_upload_mbps).toBe(25);
});
```

#### 5.3 — Autonomous 24/7 venues require dual ISP

```typescript
it('flags dual ISP requirement for autonomous 24/7 venues', () => {
  const result = validateISP({ isp_name: 'Comcast', isp_type: 'cable', court_count: 4, tier: 'autonomous', is_24_7: true });
  expect(result.dual_isp_required).toBe(true);
});
```

#### 5.4 — Fiber preferred over cable

```typescript
it('returns preferred status for fiber connection', () => {
  const result = validateISP({ isp_name: 'Verizon Fios', isp_type: 'fiber', court_count: 4 });
  expect(result.level).toBe('ok');
  expect(result.circuit_type_note).toMatch(/fiber.*preferred/i);
});
```

---

### 6. `src/lib/__tests__/cable-estimation.test.ts`

**Purpose**: Verify Cat6 cable length estimator.

#### 6.1 — 4-court standard estimate

```typescript
it('estimates cable for 4-court venue', () => {
  // courts × avg_distance × 3_drops + doors × avg × 1 + cameras × avg × 1
  // 4 × 75 × 3 = 900ft for courts (example avg_distance=75ft)
  const result = estimateCableLength({ court_count: 4, door_count: 0, security_camera_count: 0 });
  expect(result.total_feet).toBeGreaterThan(0);
  expect(result.total_feet).toBeLessThan(5000); // sanity bound
});
```

#### 6.2 — Doors and cameras add to total

```typescript
it('includes door and camera runs in cable total', () => {
  const withoutExtras = estimateCableLength({ court_count: 4, door_count: 0, security_camera_count: 0 });
  const withExtras = estimateCableLength({ court_count: 4, door_count: 2, security_camera_count: 4 });
  expect(withExtras.total_feet).toBeGreaterThan(withoutExtras.total_feet);
});
```

---

### 7. `src/components/__tests__/BomTable.test.tsx`

**Purpose**: Verify the BOM table component renders correctly and handles edits.

#### 7.1 — Renders all BOM line items

```typescript
it('renders one row per BOM item', () => {
  render(<BomTable items={MOCK_BOM_ITEMS} onUpdate={vi.fn()} />);
  expect(screen.getAllByRole('row')).toHaveLength(MOCK_BOM_ITEMS.length + 1); // +1 header
});
```

#### 7.2 — Shows cost values formatted as currency

```typescript
it('displays customer_price formatted as USD', () => {
  render(<BomTable items={[{ ...MOCK_BOM_ITEMS[0], customer_price: 855.56 }]} onUpdate={vi.fn()} />);
  expect(screen.getByText('$855.56')).toBeInTheDocument();
});
```

#### 7.3 — Shows warning icon when customer_price is null

```typescript
it('shows yellow flag icon when unit_cost is null', () => {
  render(<BomTable items={[{ ...MOCK_BOM_ITEMS[0], unit_cost: null, customer_price: null }]} onUpdate={vi.fn()} />);
  expect(screen.getByTitle(/unit cost unknown/i)).toBeInTheDocument();
});
```

#### 7.4 — Qty edit triggers onUpdate callback

```typescript
it('calls onUpdate when qty field changes', async () => {
  const onUpdate = vi.fn();
  const user = userEvent.setup();
  render(<BomTable items={MOCK_BOM_ITEMS} onUpdate={onUpdate} />);

  const qtyInput = screen.getAllByRole('spinbutton')[0];
  await user.clear(qtyInput);
  await user.type(qtyInput, '6');
  await user.tab(); // blur to trigger update

  expect(onUpdate).toHaveBeenCalledWith(MOCK_BOM_ITEMS[0].id, { qty: 6 });
});
```

---

### 8. `src/components/__tests__/DeploymentChecklist.test.tsx`

**Purpose**: Verify checklist rendering, phase grouping, and completion state.

#### 8.1 — Groups items by phase number

```typescript
it('renders phase headers for all 16 phases (0-15)', () => {
  render(<DeploymentChecklist items={MOCK_CHECKLIST_121_ITEMS} onToggle={vi.fn()} />);
  expect(screen.getAllByRole('heading', { name: /phase/i })).toHaveLength(16);
});
```

#### 8.2 — Checking an item calls onToggle with item id

```typescript
it('calls onToggle when checklist item checkbox is clicked', async () => {
  const onToggle = vi.fn();
  const user = userEvent.setup();
  render(<DeploymentChecklist items={MOCK_CHECKLIST_121_ITEMS.slice(0, 5)} onToggle={onToggle} />);

  const firstCheckbox = screen.getAllByRole('checkbox')[0];
  await user.click(firstCheckbox);

  expect(onToggle).toHaveBeenCalledWith(MOCK_CHECKLIST_121_ITEMS[0].id, true);
});
```

#### 8.3 — Warning badge shown for items with warnings

```typescript
it('renders warning badge for items that have a warning field', () => {
  const itemsWithWarning = [{
    ...MOCK_CHECKLIST_121_ITEMS[0],
    warning: 'Starlink not supported. Verify ISP before proceeding.',
  }];
  render(<DeploymentChecklist items={itemsWithWarning} onToggle={vi.fn()} />);
  expect(screen.getByText(/starlink not supported/i)).toBeInTheDocument();
});
```

#### 8.4 — Progress bar reflects completion percentage

```typescript
it('shows correct progress percentage in header', () => {
  const items = MOCK_CHECKLIST_121_ITEMS.map((item, i) =>
    i < 61 ? { ...item, is_completed: true } : item
  ); // ~50% complete
  render(<DeploymentChecklist items={items} onToggle={vi.fn()} />);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
});
```

---

### 9. `src/components/__tests__/IntakeForm.test.tsx`

**Purpose**: Verify Stage 1 wizard form validation (Zod schemas) and conditional logic.

#### 9.1 — Venue name required (min 2 chars)

```typescript
it('shows error when venue_name < 2 chars', async () => {
  const user = userEvent.setup();
  render(<IntakeStep1 onNext={vi.fn()} />);

  await user.type(screen.getByLabelText(/venue name/i), 'A');
  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
});
```

#### 9.2 — Court count must be ≥ 1

```typescript
it('shows error when court_count is 0', async () => {
  const user = userEvent.setup();
  render(<IntakeStep2 onNext={vi.fn()} />);

  await user.clear(screen.getByLabelText(/court count/i));
  await user.type(screen.getByLabelText(/court count/i), '0');
  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(screen.getByText(/at least 1 court/i)).toBeInTheDocument();
});
```

#### 9.3 — Door count field hidden for Pro and PBK tiers

```typescript
it('hides door_count field for Pro tier', () => {
  render(<IntakeStep2 onNext={vi.fn()} defaultValues={{ tier: 'pro' }} />);
  expect(screen.queryByLabelText(/door count/i)).not.toBeInTheDocument();
});
```

#### 9.4 — Door count field shown for Autonomous tier

```typescript
it('shows door_count field for Autonomous tier', () => {
  render(<IntakeStep2 onNext={vi.fn()} defaultValues={{ tier: 'autonomous' }} />);
  expect(screen.getByLabelText(/door count/i)).toBeInTheDocument();
});
```

#### 9.5 — Security camera count field shown only for Autonomous+

```typescript
it('shows security_camera_count only for Autonomous+ tier', () => {
  render(<IntakeStep2 onNext={vi.fn()} defaultValues={{ tier: 'autonomous_plus' }} />);
  expect(screen.getByLabelText(/security camera count/i)).toBeInTheDocument();
});

it('hides security_camera_count for Autonomous tier', () => {
  render(<IntakeStep2 onNext={vi.fn()} defaultValues={{ tier: 'autonomous' }} />);
  expect(screen.queryByLabelText(/security camera count/i)).not.toBeInTheDocument();
});
```

#### 9.6 — Email field validates format

```typescript
it('shows error for invalid email format', async () => {
  const user = userEvent.setup();
  render(<IntakeStep3 onNext={vi.fn()} />);

  await user.type(screen.getByLabelText(/email/i), 'not-an-email');
  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(screen.getByText(/valid email/i)).toBeInTheDocument();
});
```

#### 9.7 — Phone field validates format (digits, spaces, dashes allowed)

```typescript
it('shows error for phone with letters', async () => {
  const user = userEvent.setup();
  render(<IntakeStep3 onNext={vi.fn()} />);

  await user.type(screen.getByLabelText(/phone/i), 'abc-not-phone');
  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(screen.getByText(/valid phone/i)).toBeInTheDocument();
});
```

---

### 10. `src/components/__tests__/Dashboard.test.tsx`

**Purpose**: Verify the projects dashboard renders project list with correct status pills.

#### 10.1 — Renders project cards for all returned projects

```typescript
it('renders one card per project', () => {
  render(<DashboardPage />, { wrapper: withMockData([PRO_PROJECT_4_COURTS, AUTONOMOUS_PLUS_PROJECT]) });
  expect(screen.getAllByTestId('project-card')).toHaveLength(2);
});
```

#### 10.2 — Status pill text matches project_status enum

```typescript
it('shows correct status pill text', () => {
  render(<DashboardPage />, { wrapper: withMockData([PRO_PROJECT_4_COURTS]) });
  expect(screen.getByText('Intake')).toBeInTheDocument();
});
```

#### 10.3 — Empty state shown when no projects exist

```typescript
it('renders empty state when project list is empty', () => {
  render(<DashboardPage />, { wrapper: withMockData([]) });
  expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
});
```

#### 10.4 — Search filter reduces visible projects

```typescript
it('filters projects by venue_name search', async () => {
  const user = userEvent.setup();
  render(<DashboardPage />, { wrapper: withMockData([PRO_PROJECT_4_COURTS, AUTONOMOUS_PLUS_PROJECT]) });

  await user.type(screen.getByRole('searchbox'), 'Test');
  expect(screen.getAllByTestId('project-card')).toHaveLength(1);
  expect(screen.getByText('Test Club')).toBeInTheDocument();
});
```

---

### 11. `src/lib/__tests__/financial-reporting.test.ts`

**Purpose**: Verify HER calculation and revenue pipeline aggregation.

#### 11.1 — HER formula: hardware_revenue / team_hardware_spend

```typescript
it('computes HER correctly', () => {
  const snapshot = {
    hardware_revenue: 50000,
    team_hardware_spend: 35000,
  };
  const her = computeHER(snapshot);
  expect(her).toBeCloseTo(50000 / 35000, 4);
});
```

#### 11.2 — HER returns null when team_hardware_spend = 0 (avoid divide-by-zero)

```typescript
it('returns null HER when team_hardware_spend is 0', () => {
  const her = computeHER({ hardware_revenue: 50000, team_hardware_spend: 0 });
  expect(her).toBeNull();
});
```

#### 11.3 — Revenue pipeline groups projects by revenue_stage

```typescript
it('groups pipeline correctly by revenue stage', () => {
  const projects = [
    { ...PRO_PROJECT_4_COURTS, revenue_stage: 'proposal' },
    { ...AUTONOMOUS_PLUS_PROJECT, revenue_stage: 'deposit_paid' },
  ];
  const pipeline = computeRevenuePipeline(projects, []);
  const proposalStage = pipeline.find(s => s.stage === 'proposal');
  expect(proposalStage?.project_count).toBe(1);
});
```

#### 11.4 — Aging receivable: days outstanding calculated from sent_at

```typescript
it('computes days outstanding for sent invoice', () => {
  const sentAt = new Date('2026-02-01');
  const asOf = new Date('2026-03-06');
  const days = computeDaysOutstanding(sentAt, asOf);
  expect(days).toBe(33);
});
```

---

## Smoke Tests

Smoke tests verify the critical user path end-to-end in a browser-like environment using mocked Supabase. These are Vitest browser tests or Playwright if added to the project.

### Smoke Test 1: Create Project → BOM Generated

1. Navigate to `/projects/new`
2. Verify redirect to `/projects/{id}/intake`
3. Complete all 6 intake steps with valid data (Pro tier, 4 courts)
4. Submit → verify project row created in mocked Supabase
5. Verify `project_bom_items` batch insert called with 22 rows (Pro template count)
6. Verify redirect to `/projects/{id}/procurement`

### Smoke Test 2: Auth Guard — Unauthenticated User Redirected

1. Clear session (no Supabase token)
2. Navigate directly to `/projects`
3. Verify redirect to `/login`
4. Enter valid credentials → verify session established → redirect to `/projects`

### Smoke Test 3: Deployment Checklist — Complete Phase, Progress Updates

1. Navigate to `/projects/{id}/deployment` with project in `deployment` status
2. Verify 16 phase groups rendered
3. Check first item in Phase 0 → verify progress bar increments
4. Verify `deployment_checklist_items` update called with `is_completed: true`

### Smoke Test 4: Invoicing — Deposit Invoice Created and Revenue Stage Advances

1. Navigate to `/projects/{id}/financials`
2. Click "Create Deposit Invoice" → verify computed amounts shown (hardware + service + tax)
3. Confirm → verify `invoices` insert called with `invoice_type: 'deposit'`, `status: 'not_sent'`
4. Mark as sent → verify `projects.revenue_stage` updated to `deposit_invoiced`

### Smoke Test 5: Inventory — Stock Level Updated After Receiving PO

1. Navigate to `/inventory`
2. Find hardware item with pending PO
3. Click "Receive" → enter received_qty = 10
4. Verify `inventory.qty_on_hand` incremented by 10
5. Verify low stock flag clears if available > reorder_threshold

### Smoke Test 6: Settings — Pricing Tier Update Persists

1. Navigate to `/settings/pricing`
2. Change `pro_court_fee` from $2,500 to $3,000
3. Save → verify `settings` upsert called with new value
4. Navigate away and back → verify $3,000 shown

---

## Test File Inventory

```
src/
├── test/
│   ├── setup.ts                              # Global test setup
│   └── fixtures.ts                           # Shared test data
├── lib/
│   └── __tests__/
│       ├── bom-generation.test.ts            # 7 test cases
│       ├── cost-analysis.test.ts             # 8 test cases
│       ├── deployment-tracking.test.ts       # 7 test cases
│       ├── inventory-management.test.ts      # 6 test cases
│       ├── isp-validation.test.ts            # 4 test cases
│       ├── cable-estimation.test.ts          # 2 test cases
│       └── financial-reporting.test.ts       # 4 test cases
└── components/
    └── __tests__/
        ├── BomTable.test.tsx                 # 4 test cases
        ├── DeploymentChecklist.test.tsx      # 4 test cases
        ├── IntakeForm.test.tsx               # 7 test cases
        └── Dashboard.test.tsx               # 4 test cases
```

**Total unit/component tests**: 57 test cases
**Smoke tests**: 6 critical path flows

---

## Running Tests

```bash
# All tests
pnpm vitest run

# Watch mode during development
pnpm vitest

# Coverage report
pnpm vitest run --coverage

# Single file
pnpm vitest run src/lib/__tests__/bom-generation.test.ts
```

---

## Coverage Targets

| Module | Target | Rationale |
|--------|--------|-----------|
| `src/lib/bom-generation.ts` | 100% | Core financial logic — no edge case untested |
| `src/lib/cost-analysis.ts` | 100% | All formulas directly tested with known values |
| `src/lib/deployment-tracking.ts` | 95% | State machine transitions fully covered |
| `src/lib/inventory-management.ts` | 95% | All stock mutations covered |
| `src/lib/financial-reporting.ts` | 90% | HER and pipeline logic covered; aggregation queries mocked |
| `src/components/BomTable.tsx` | 80% | Rendering + edit path covered |
| `src/components/DeploymentChecklist.tsx` | 80% | Render + toggle + warning covered |
| `src/components/IntakeForm.tsx` | 85% | All conditional fields + validation tested |
| Overall | 80% | Acceptable for a single-user ops tool |
