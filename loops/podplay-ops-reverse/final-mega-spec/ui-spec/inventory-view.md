# PodPlay Ops Wizard — Global Inventory Page

**Aspect**: design-inventory-view
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/inventory`
**Route file**: `src/routes/_auth/inventory/index.tsx`
**Component file**: `src/components/inventory/InventoryPage.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `inventory`, `inventory_movements`, `hardware_catalog`, `purchase_orders`, `purchase_order_items`
**Logic reference**: `final-mega-spec/business-logic/inventory-management.md`

---

## Overview

The Global Inventory page is the ops person's view of all hardware stock in the NJ lab/warehouse. It replaces the MRP spreadsheet's INVENTORY sheet and ORDER INPUT sheet. The page shows every hardware item in the catalog with its current stock levels (on-hand, allocated, available), low-stock flags, and movement history. From this page, ops can create stock replenishment POs, post manual adjustments, edit reorder thresholds, and drill into the audit trail for any item.

This page is reachable from the global nav sidebar ("Inventory"). It is also linked from the Dashboard's low-stock badge alert.

---

## Route Configuration

**File**: `src/routes/_auth/inventory/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getInventoryLevels } from '@/services/inventory'
import { InventoryPage } from '@/components/inventory/InventoryPage'

const inventorySearchSchema = z.object({
  category: z.enum([
    'network_rack', 'replay_system', 'displays', 'access_control',
    'surveillance', 'front_desk', 'cabling', 'signage',
    'infrastructure', 'pingpod_specific',
  ]).optional(),
  low_stock: z.coerce.boolean().optional(),
  q: z.string().optional(),
})

export type InventorySearch = z.infer<typeof inventorySearchSchema>

export const Route = createFileRoute('/_auth/inventory/')({
  validateSearch: (search) => inventorySearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getInventoryLevels(deps),
  component: InventoryPage,
  pendingComponent: InventorySkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-medium">Failed to load inventory</p>
      <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  ),
})
```

---

## Service Layer

**File**: `src/services/inventory.ts`

### Types

```typescript
export interface InventoryRow {
  // From inventory table
  id: string                        // inventory.id
  hardware_catalog_id: string       // FK to hardware_catalog
  qty_on_hand: number               // physically in NJ lab
  qty_allocated: number             // reserved for active projects
  qty_available: number             // generated: qty_on_hand - qty_allocated
  reorder_threshold: number         // alert fires when qty_available <= threshold
  is_low_stock: boolean             // computed: qty_available <= reorder_threshold AND threshold > 0
  notes: string | null              // inventory-level notes

  // Joined from hardware_catalog
  sku: string
  name: string
  model: string | null
  vendor: string
  vendor_url: string | null
  unit_cost: number | null          // for on-hand value calculation
  category: BomCategory
  catalog_notes: string | null      // hardware_catalog.notes
  is_active: boolean                // false = soft-deleted from catalog
}

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
  | 'pingpod_specific'

export interface InventoryMovement {
  id: string
  created_at: string                // ISO timestamp
  hardware_catalog_id: string
  project_id: string | null
  movement_type: InventoryMovementType
  qty_delta: number                 // positive = increase, negative = decrease
  reference: string | null          // PO number or tracking number
  notes: string | null
  // Joined
  project_venue_name: string | null // projects.venue_name if project_id is set
}

export type InventoryMovementType =
  | 'purchase_order_received'
  | 'project_allocated'
  | 'project_shipped'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'return'

export interface InventoryStats {
  total_items: number               // count of distinct hardware_catalog items with inventory row
  total_on_hand_value: number       // SUM(qty_on_hand * unit_cost) — items with known unit_cost only
  low_stock_count: number           // count of items where is_low_stock = true
}
```

### `getInventoryLevels`

```typescript
// src/services/inventory.ts

export async function getInventoryLevels(
  filters: InventorySearch
): Promise<{ items: InventoryRow[]; stats: InventoryStats }> {
  let query = supabase
    .from('inventory')
    .select(`
      id,
      hardware_catalog_id,
      qty_on_hand,
      qty_allocated,
      qty_available,
      reorder_threshold,
      notes,
      hardware_catalog!inner (
        sku,
        name,
        model,
        vendor,
        vendor_url,
        unit_cost,
        category,
        notes,
        is_active
      )
    `)
    .eq('hardware_catalog.is_active', true)   // exclude soft-deleted catalog items
    .order('hardware_catalog(name)', { ascending: true })

  if (filters.category) {
    query = query.eq('hardware_catalog.category', filters.category)
  }

  if (filters.low_stock === true) {
    // qty_available <= reorder_threshold AND reorder_threshold > 0
    query = query.lte('qty_available', supabase.rpc('col_ref', { col: 'reorder_threshold' }))
    // Note: Supabase does not support column-to-column comparisons in .filter().
    // Use a database view or computed column instead.
    // Implementation: use a Postgres view `inventory_with_low_stock` that adds
    // is_low_stock as a computed boolean column; filter on that view.
  }

  if (filters.q) {
    // Text search on name or SKU (case-insensitive)
    query = query.or(
      `hardware_catalog.name.ilike.%${filters.q}%,hardware_catalog.sku.ilike.%${filters.q}%`
    )
  }

  const { data, error } = await query
  if (error) throw error

  const items: InventoryRow[] = (data ?? []).map((row) => {
    const cat = row.hardware_catalog as any
    const isLowStock =
      row.reorder_threshold > 0 && row.qty_available <= row.reorder_threshold
    return {
      id: row.id,
      hardware_catalog_id: row.hardware_catalog_id,
      qty_on_hand: row.qty_on_hand,
      qty_allocated: row.qty_allocated,
      qty_available: row.qty_available,
      reorder_threshold: row.reorder_threshold,
      is_low_stock: isLowStock,
      notes: row.notes,
      sku: cat.sku,
      name: cat.name,
      model: cat.model,
      vendor: cat.vendor,
      vendor_url: cat.vendor_url,
      unit_cost: cat.unit_cost,
      category: cat.category,
      catalog_notes: cat.notes,
      is_active: cat.is_active,
    }
  })

  // Apply low_stock filter client-side (column-to-column comparison workaround)
  const filtered = filters.low_stock
    ? items.filter((i) => i.is_low_stock)
    : items

  const stats: InventoryStats = {
    total_items: items.length,
    total_on_hand_value: items.reduce(
      (sum, i) => sum + (i.unit_cost != null ? i.qty_on_hand * i.unit_cost : 0),
      0
    ),
    low_stock_count: items.filter((i) => i.is_low_stock).length,
  }

  return { items: filtered, stats }
}
```

### `getInventoryMovements`

```typescript
export async function getInventoryMovements(
  hardwareCatalogId: string,
  limit = 50
): Promise<InventoryMovement[]> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      id,
      created_at,
      hardware_catalog_id,
      project_id,
      movement_type,
      qty_delta,
      reference,
      notes,
      projects ( venue_name )
    `)
    .eq('hardware_catalog_id', hardwareCatalogId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    hardware_catalog_id: row.hardware_catalog_id,
    project_id: row.project_id,
    movement_type: row.movement_type as InventoryMovementType,
    qty_delta: row.qty_delta,
    reference: row.reference,
    notes: row.notes,
    project_venue_name: (row.projects as any)?.venue_name ?? null,
  }))
}
```

### `updateReorderThreshold`

```typescript
export async function updateReorderThreshold(
  inventoryId: string,
  reorderThreshold: number
): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .update({ reorder_threshold: reorderThreshold })
    .eq('id', inventoryId)
  if (error) throw error
}
```

### `adjustInventory` (re-exported from logic spec)

```typescript
// Already defined in inventory-management.md:
export async function adjustInventory(input: AdjustmentInput): Promise<void>
```

### `createPurchaseOrder` (re-exported from logic spec)

```typescript
// Already defined in inventory-management.md:
export async function createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrder>
```

### `runReconciliation`

```typescript
export interface ReconciliationRow {
  hardware_catalog_id: string
  name: string
  sku: string
  actual_qty: number
  movement_implied_qty: number
  discrepancy: number
}

export async function runReconciliation(): Promise<ReconciliationRow[]> {
  const { data, error } = await supabase.rpc('reconcile_inventory')
  if (error) throw error
  return data ?? []
}
// Supabase RPC wraps the reconciliation SQL query from inventory-management.md
```

---

## Page Layout

**File**: `src/components/inventory/InventoryPage.tsx`

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                          │
│  Inventory                          [+ New PO]  [Run Reconciliation] │
├─────────────────────────────────────────────────────────────────────┤
│  STATS CARDS                                                          │
│  [Total Items: 48]  [On-Hand Value: $42,310]  [Low Stock: 3 items]  │
├─────────────────────────────────────────────────────────────────────┤
│  FILTER BAR                                                           │
│  [Search: name or SKU...]  [Category ▾]  [Low Stock Only ☐]        │
├─────────────────────────────────────────────────────────────────────┤
│  INVENTORY TABLE                                                      │
│  Item Name / SKU / Vendor | On Hand | Allocated | Available | Alert │
│  ──────────────────────────────────────────────────────────────────  │
│  Mac Mini 16GB 256GB       |   4     |    1      |    3      |       │
│    REPLAY-MACMINI · Apple  |         |           |           |       │
│  ──────────────────────────────────────────────────────────────────  │
│  Kisi Reader Pro 2  [LOW]  |   2     |    2      |    0      | ●red  │
│    ACCTRL-KISI-RDR2 · Kisi |         |           |           |       │
│  ──────────────────────────────────────────────────────────────────  │
│  ...                                                                  │
│                                                                       │
│  Row actions: [...] → [Adjust Stock] [View History] [Edit Threshold] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component: `InventoryPage`

**Props**: none (reads from TanStack Router loader via `Route.useLoaderData()`)

**State**:
```typescript
const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
// When set: opens movement history sheet for that hardware_catalog_id

const [adjustDialogItem, setAdjustDialogItem] = useState<InventoryRow | null>(null)
// When set: opens stock adjustment dialog for that item

const [newPOOpen, setNewPOOpen] = useState(false)
// Controls new PO dialog visibility

const [reconciliationOpen, setReconciliationOpen] = useState(false)
// Controls reconciliation results dialog

const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null)
// ID of inventory row being inline-edited for reorder_threshold
```

**Data access**:
```typescript
const { items, stats } = Route.useLoaderData()
const navigate = useNavigate()
const search = Route.useSearch()
```

---

## Section: Header Bar

```tsx
<div className="flex items-center justify-between px-6 py-4 border-b">
  <h1 className="text-2xl font-semibold">Inventory</h1>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setReconciliationOpen(true)}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Run Reconciliation
    </Button>
    <Button onClick={() => setNewPOOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      New PO
    </Button>
  </div>
</div>
```

---

## Section: Stats Cards

Three cards in a row. Each card is a `<Card>` with a label and value.

| Card | Value | Notes |
|------|-------|-------|
| Total Items | `stats.total_items` | Count of inventory rows |
| On-Hand Value | `$${stats.total_on_hand_value.toLocaleString('en-US', { minimumFractionDigits: 0 })}` | Items without `unit_cost` excluded from sum; tooltip: "Excludes items with unknown unit cost" |
| Low Stock | `stats.low_stock_count` items | Red badge if > 0; clicking applies `?low_stock=true` filter |

```tsx
<div className="grid grid-cols-3 gap-4 px-6 py-4">
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">Total Items</p>
    <p className="text-2xl font-bold mt-1">{stats.total_items}</p>
  </Card>
  <Card className="p-4">
    <p className="text-sm text-muted-foreground">On-Hand Value</p>
    <p className="text-2xl font-bold mt-1">
      ${stats.total_on_hand_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
    </p>
    <p className="text-xs text-muted-foreground mt-1">Items with known unit cost only</p>
  </Card>
  <Card
    className={cn(
      "p-4 cursor-pointer",
      stats.low_stock_count > 0 && "border-destructive"
    )}
    onClick={() => navigate({ search: (prev) => ({ ...prev, low_stock: true }) })}
  >
    <p className="text-sm text-muted-foreground">Low Stock</p>
    <p className={cn(
      "text-2xl font-bold mt-1",
      stats.low_stock_count > 0 ? "text-destructive" : "text-foreground"
    )}>
      {stats.low_stock_count}
    </p>
    {stats.low_stock_count > 0 && (
      <p className="text-xs text-destructive mt-1">Click to filter</p>
    )}
  </Card>
</div>
```

---

## Section: Filter Bar

```tsx
<div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30">
  {/* Text search */}
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search by name or SKU..."
      className="pl-9"
      value={search.q ?? ''}
      onChange={(e) =>
        navigate({ search: (prev) => ({ ...prev, q: e.target.value || undefined }) })
      }
    />
  </div>

  {/* Category filter */}
  <Select
    value={search.category ?? 'all'}
    onValueChange={(v) =>
      navigate({ search: (prev) => ({ ...prev, category: v === 'all' ? undefined : v as BomCategory }) })
    }
  >
    <SelectTrigger className="w-48">
      <SelectValue placeholder="All Categories" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Categories</SelectItem>
      <SelectItem value="network_rack">Network Rack</SelectItem>
      <SelectItem value="replay_system">Replay System</SelectItem>
      <SelectItem value="displays">Displays</SelectItem>
      <SelectItem value="access_control">Access Control</SelectItem>
      <SelectItem value="surveillance">Surveillance</SelectItem>
      <SelectItem value="front_desk">Front Desk</SelectItem>
      <SelectItem value="cabling">Cabling</SelectItem>
      <SelectItem value="signage">Signage</SelectItem>
      <SelectItem value="infrastructure">Infrastructure</SelectItem>
      <SelectItem value="pingpod_specific">PingPod Specific</SelectItem>
    </SelectContent>
  </Select>

  {/* Low stock toggle */}
  <div className="flex items-center gap-2">
    <Checkbox
      id="low-stock-filter"
      checked={search.low_stock === true}
      onCheckedChange={(checked) =>
        navigate({ search: (prev) => ({ ...prev, low_stock: checked || undefined }) })
      }
    />
    <label htmlFor="low-stock-filter" className="text-sm cursor-pointer">
      Low Stock Only
    </label>
  </div>

  {/* Clear filters — shown if any filter active */}
  {(search.q || search.category || search.low_stock) && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate({ search: {} })}
    >
      <X className="h-4 w-4 mr-1" />
      Clear
    </Button>
  )}
</div>
```

---

## Section: Inventory Table

**Component**: `src/components/inventory/InventoryTable.tsx`

**Columns** (left to right):

| Column | Width | Content | Notes |
|--------|-------|---------|-------|
| Item | flex-1 (min 250px) | Name (bold), SKU + Vendor (muted below), category badge | Category displayed as a small Badge |
| On Hand | 90px center | `qty_on_hand` | Plain number |
| Allocated | 90px center | `qty_allocated` | Plain number; `—` if 0 |
| Available | 90px center | `qty_available` | **Red bold** if `is_low_stock`; otherwise normal |
| Threshold | 100px center | Editable `reorder_threshold` | Inline edit; `—` if 0 |
| On-Hand Value | 110px right | `qty_on_hand × unit_cost` formatted as `$X,XXX` | `—` if `unit_cost` is null |
| Actions | 44px center | `...` dropdown button | `DropdownMenu` |

**Table structure**:

```tsx
<div className="px-6 pb-6">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item</TableHead>
        <TableHead className="text-center w-[90px]">On Hand</TableHead>
        <TableHead className="text-center w-[90px]">Allocated</TableHead>
        <TableHead className="text-center w-[90px]">Available</TableHead>
        <TableHead className="text-center w-[100px]">Reorder At</TableHead>
        <TableHead className="text-right w-[110px]">On-Hand Value</TableHead>
        <TableHead className="w-[44px]" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <InventoryTableRow
          key={item.id}
          item={item}
          isEditingThreshold={editingThresholdId === item.id}
          onEditThreshold={() => setEditingThresholdId(item.id)}
          onSaveThreshold={(val) => handleSaveThreshold(item, val)}
          onCancelThreshold={() => setEditingThresholdId(null)}
          onAdjust={() => setAdjustDialogItem(item)}
          onViewHistory={() => setSelectedItemId(item.hardware_catalog_id)}
        />
      ))}
    </TableBody>
  </Table>
</div>
```

### `InventoryTableRow` Component

**File**: `src/components/inventory/InventoryTableRow.tsx`

**Props**:
```typescript
interface InventoryTableRowProps {
  item: InventoryRow
  isEditingThreshold: boolean
  onEditThreshold: () => void
  onSaveThreshold: (value: number) => void
  onCancelThreshold: () => void
  onAdjust: () => void
  onViewHistory: () => void
}
```

**Item cell content**:
```tsx
<TableCell>
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-2">
      <span className="font-medium">{item.name}</span>
      {item.is_low_stock && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0">LOW</Badge>
      )}
    </div>
    <span className="text-xs text-muted-foreground">
      {item.sku} · {item.vendor}
    </span>
    <CategoryBadge category={item.category} />
  </div>
</TableCell>
```

**Available cell**: Red bold when `is_low_stock`:
```tsx
<TableCell className={cn(
  "text-center font-medium",
  item.is_low_stock ? "text-destructive font-bold" : ""
)}>
  {item.qty_available}
</TableCell>
```

**Reorder threshold cell** — inline edit:
- Default state: shows `item.reorder_threshold` (shows `—` if 0) + pencil icon on hover
- Editing state: `<Input type="number" min={0} />` + save/cancel buttons (checkmark / X)
- Clicking the pencil icon calls `onEditThreshold()`
- Pressing `Enter` or clicking checkmark calls `onSaveThreshold(value)`
- Pressing `Escape` or clicking X calls `onCancelThreshold()`
- Save calls `updateReorderThreshold(item.id, value)` → triggers `router.invalidate()` to refetch loader data

```tsx
<TableCell className="text-center">
  {isEditingThreshold ? (
    <div className="flex items-center gap-1 justify-center">
      <Input
        type="number"
        min={0}
        className="w-16 h-7 text-center text-sm"
        defaultValue={item.reorder_threshold}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSaveThreshold(Number((e.target as HTMLInputElement).value))
          if (e.key === 'Escape') onCancelThreshold()
        }}
      />
      <Button size="icon" variant="ghost" className="h-7 w-7"
        onClick={(e) => onSaveThreshold(Number(
          (e.currentTarget.parentElement!.querySelector('input') as HTMLInputElement).value
        ))}>
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelThreshold}>
        <X className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  ) : (
    <button
      className="group flex items-center gap-1 mx-auto text-sm hover:text-foreground"
      onClick={onEditThreshold}
    >
      <span>{item.reorder_threshold === 0 ? '—' : item.reorder_threshold}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </button>
  )}
</TableCell>
```

**On-Hand Value cell**:
```tsx
<TableCell className="text-right text-sm">
  {item.unit_cost != null
    ? `$${(item.qty_on_hand * item.unit_cost).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : <span className="text-muted-foreground">—</span>
  }
</TableCell>
```

**Actions dropdown** (`DropdownMenu`):
- "View History" → `onViewHistory()` — opens movement history sheet
- "Adjust Stock" → `onAdjust()` — opens adjustment dialog
- Separator
- "Order from Vendor" → opens New PO dialog pre-filled with this item

```tsx
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onViewHistory}>
        <History className="h-4 w-4 mr-2" />
        View History
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onAdjust}>
        <ArrowUpDown className="h-4 w-4 mr-2" />
        Adjust Stock
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onOrderFromVendor(item)}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Order from Vendor
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

### Category Badge

**Component**: `src/components/inventory/CategoryBadge.tsx`

Maps `bom_category` to display label and color variant:

| Category | Display Label | Badge Color |
|----------|--------------|-------------|
| `network_rack` | Network Rack | blue (`bg-blue-100 text-blue-700`) |
| `replay_system` | Replay System | purple (`bg-purple-100 text-purple-700`) |
| `displays` | Displays | indigo (`bg-indigo-100 text-indigo-700`) |
| `access_control` | Access Control | orange (`bg-orange-100 text-orange-700`) |
| `surveillance` | Surveillance | yellow (`bg-yellow-100 text-yellow-700`) |
| `front_desk` | Front Desk | teal (`bg-teal-100 text-teal-700`) |
| `cabling` | Cabling | gray (`bg-gray-100 text-gray-600`) |
| `signage` | Signage | pink (`bg-pink-100 text-pink-700`) |
| `infrastructure` | Infrastructure | slate (`bg-slate-100 text-slate-600`) |
| `pingpod_specific` | PingPod | emerald (`bg-emerald-100 text-emerald-700`) |

Badge size: `text-[10px] px-1.5 py-0 rounded-sm font-medium` (smaller than shadcn default)

---

## Section: Empty States

**No items match filters**:
```tsx
<div className="py-16 text-center">
  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
  <p className="font-medium">No items found</p>
  <p className="text-sm text-muted-foreground mt-1">
    Try adjusting your search or filters
  </p>
  <Button variant="outline" className="mt-4" onClick={() => navigate({ search: {} })}>
    Clear Filters
  </Button>
</div>
```

**No inventory records at all** (database empty):
```tsx
<div className="py-16 text-center">
  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
  <p className="font-medium">Inventory not set up yet</p>
  <p className="text-sm text-muted-foreground mt-1">
    Run the seed data migration to populate the hardware catalog.
  </p>
</div>
```

---

## Section: Loading Skeleton

**Component**: `InventorySkeleton` (defined in same file as route)

```tsx
function InventorySkeleton() {
  return (
    <div className="px-6 py-4">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      {/* Table rows skeleton */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full mb-2 rounded" />
      ))}
    </div>
  )
}
```

---

## Dialog: Movement History Sheet

**Component**: `src/components/inventory/MovementHistorySheet.tsx`

Opens as a right-side `Sheet` (shadcn) when `selectedItemId` is set.

**Sheet dimensions**: `side="right"`, `className="w-[480px] sm:w-[540px]"`

**Header**: Item name + SKU

**Data fetching**: On open (when `selectedItemId` transitions from null to a value), call `getInventoryMovements(selectedItemId)` via `useQuery` from TanStack Query:

```typescript
const { data: movements, isLoading } = useQuery({
  queryKey: ['inventory_movements', selectedItemId],
  queryFn: () => getInventoryMovements(selectedItemId!),
  enabled: selectedItemId != null,
})
```

**Movement list**: Ordered newest-first (50 records max).

Each movement row shows:
```
[icon]  {movement_label}          {qty_delta display}
        {date}  {reference?}      {running note?}
        {project link?}
```

Movement type icons and labels:

| `movement_type` | Icon | Label | Delta color |
|----------------|------|-------|-------------|
| `purchase_order_received` | `PackageCheck` | Received from PO | green |
| `project_allocated` | `Bookmark` | Allocated to project | amber |
| `project_shipped` | `Truck` | Shipped to venue | red |
| `adjustment_increase` | `TrendingUp` | Manual increase | green |
| `adjustment_decrease` | `TrendingDown` | Manual decrease | red |
| `return` | `Undo2` | Returned to stock | green |

Delta display:
- Positive: `+{qty_delta}` in green
- Negative: `{qty_delta}` (already negative, e.g., `-3`) in red

Project link: if `movement.project_id` is set, show `→ {project_venue_name}` as a link to `/projects/{project_id}`.

```tsx
<Sheet open={selectedItemId != null} onOpenChange={(open) => !open && setSelectedItemId(null)}>
  <SheetContent side="right" className="w-[480px] sm:w-[540px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{selectedItem?.name}</SheetTitle>
      <SheetDescription>{selectedItem?.sku} · {selectedItem?.vendor}</SheetDescription>
    </SheetHeader>

    {/* Current stock summary */}
    <div className="grid grid-cols-3 gap-3 my-4">
      <div className="text-center p-3 rounded bg-muted">
        <p className="text-sm text-muted-foreground">On Hand</p>
        <p className="text-xl font-bold">{selectedItem?.qty_on_hand}</p>
      </div>
      <div className="text-center p-3 rounded bg-muted">
        <p className="text-sm text-muted-foreground">Allocated</p>
        <p className="text-xl font-bold">{selectedItem?.qty_allocated}</p>
      </div>
      <div className="text-center p-3 rounded bg-muted">
        <p className="text-sm text-muted-foreground">Available</p>
        <p className={cn(
          "text-xl font-bold",
          selectedItem?.is_low_stock ? "text-destructive" : ""
        )}>
          {selectedItem?.qty_available}
        </p>
      </div>
    </div>

    <Separator className="my-4" />

    {/* Movement history */}
    <h3 className="text-sm font-medium mb-3">Movement History (last 50)</h3>
    {isLoading ? (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    ) : movements?.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">
        No movements recorded yet
      </p>
    ) : (
      <div className="space-y-1">
        {movements?.map((m) => <MovementRow key={m.id} movement={m} />)}
      </div>
    )}
  </SheetContent>
</Sheet>
```

### `MovementRow` Component

```tsx
// src/components/inventory/MovementRow.tsx
function MovementRow({ movement }: { movement: InventoryMovement }) {
  const config = MOVEMENT_CONFIG[movement.movement_type]
  const Icon = config.icon
  const isPositive = movement.qty_delta > 0

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded hover:bg-muted/50">
      <div className={cn(
        "mt-0.5 rounded-full p-1.5",
        isPositive ? "bg-green-100" : "bg-red-100"
      )}>
        <Icon className={cn("h-3.5 w-3.5", isPositive ? "text-green-600" : "text-red-600")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(movement.created_at), 'MMM d, yyyy h:mm a')}
          {movement.reference && ` · ${movement.reference}`}
        </p>
        {movement.project_venue_name && (
          <Link
            to="/projects/$projectId"
            params={{ projectId: movement.project_id! }}
            className="text-xs text-primary hover:underline"
          >
            → {movement.project_venue_name}
          </Link>
        )}
        {movement.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{movement.notes}</p>
        )}
      </div>
      <span className={cn(
        "text-sm font-mono font-semibold shrink-0",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? `+${movement.qty_delta}` : movement.qty_delta}
      </span>
    </div>
  )
}

const MOVEMENT_CONFIG: Record<InventoryMovementType, { icon: LucideIcon; label: string }> = {
  purchase_order_received: { icon: PackageCheck, label: 'Received from PO' },
  project_allocated:       { icon: Bookmark,    label: 'Allocated to project' },
  project_shipped:         { icon: Truck,       label: 'Shipped to venue' },
  adjustment_increase:     { icon: TrendingUp,  label: 'Manual increase' },
  adjustment_decrease:     { icon: TrendingDown, label: 'Manual decrease' },
  return:                  { icon: Undo2,       label: 'Returned to stock' },
}
```

---

## Dialog: Stock Adjustment

**Component**: `src/components/inventory/AdjustStockDialog.tsx`

Opens as a `Dialog` (shadcn) when `adjustDialogItem` is set. Used for manual stock corrections (physical count discrepancy, damage, returns).

**Props**:
```typescript
interface AdjustStockDialogProps {
  item: InventoryRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
```

**Form fields** (React Hook Form + Zod):

```typescript
const adjustSchema = z.object({
  movement_type: z.enum(['adjustment_increase', 'adjustment_decrease', 'return']),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required').max(500),
})
type AdjustForm = z.infer<typeof adjustSchema>
```

**Field specs**:

| Field | Input type | Label | Placeholder | Validation |
|-------|-----------|-------|-------------|------------|
| `movement_type` | `RadioGroup` | "Adjustment Type" | — | Required |
| `qty` | `Input type="number"` | "Quantity" | "0" | min=1, integer |
| `reason` | `Textarea` | "Reason" | "e.g., Damaged on arrival, Physical count correction..." | Required, max 500 |

**RadioGroup options for `movement_type`**:
- `adjustment_increase` — label: "Increase (add stock)" — description: "Items received, returned, or counted more than recorded"
- `adjustment_decrease` — label: "Decrease (remove stock)" — description: "Items damaged, lost, or counted fewer than recorded"
- `return` — label: "Return from project" — description: "Hardware sent back from a venue"

**Submit behavior**:
1. Calls `adjustInventory({ hardware_catalog_id: item.hardware_catalog_id, adjustment_qty: qty (negated for decrease), movement_type, reason })`
2. On success: toast "Stock adjusted successfully" → `onSuccess()` → `router.invalidate()` to refetch loader
3. On error: toast "Failed to adjust stock: {error.message}" — dialog stays open

**Dialog layout**:
```
Dialog title: "Adjust Stock — {item.name}"
Dialog description: "Current: {qty_on_hand} on hand, {qty_available} available"
[RadioGroup: adjustment_type]
[Input: qty]
[Textarea: reason]
[Cancel] [Save Adjustment]
```

---

## Dialog: New Purchase Order

**Component**: `src/components/inventory/NewPODialog.tsx`

Opens when "New PO" (header) or "Order from Vendor" (row action) is clicked.

When triggered from "Order from Vendor", the dialog pre-fills one line item with that item's SKU and defaults the vendor to `item.vendor`.

**Props**:
```typescript
interface NewPODialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillItem?: InventoryRow   // pre-fills first line item if provided
  onSuccess: () => void
}
```

**Form schema**:

```typescript
const poLineSchema = z.object({
  hardware_catalog_id: z.string().uuid('Select an item'),
  qty_ordered: z.number().int().min(1),
  unit_cost: z.number().positive('Cost must be positive'),
})

const newPOSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  order_date: z.string().min(1),     // ISO date string
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poLineSchema).min(1, 'Add at least one item'),
})
```

**Field specs**:

| Field | Input type | Label | Default | Validation |
|-------|-----------|-------|---------|------------|
| `vendor` | `Input` | "Vendor" | `prefillItem?.vendor ?? ''` | Required |
| `order_date` | `Input type="date"` | "Order Date" | today | Required |
| `expected_date` | `Input type="date"` | "Expected Delivery" | — | Optional |
| `notes` | `Textarea` | "Notes" | — | Optional |
| `items` | Dynamic list | "Line Items" | 1 row if prefillItem | Min 1 item |

**Line item row fields** (dynamic list, `useFieldArray`):

| Field | Input | Label | Default | Validation |
|-------|-------|-------|---------|------------|
| `hardware_catalog_id` | `Combobox` | "Item" | `prefillItem?.hardware_catalog_id ?? ''` | Required; search by name/SKU from hardware_catalog |
| `qty_ordered` | `Input type="number"` | "Qty" | 1 | min=1 integer |
| `unit_cost` | `Input type="number"` | "Unit Cost ($)" | `prefillItem?.unit_cost ?? ''` | positive decimal |

**Line item management**:
- "+ Add Item" button appends a blank line item row
- "×" button on each row removes it (disabled when only 1 row remains)
- Row total shown: `qty × unit_cost` formatted as `$X,XXX.XX`
- PO total shown below the line items: sum of all row totals

**Submit behavior**:
1. Calls `createPurchaseOrder(formData)` with `project_id: null` (stock replenishment PO)
2. On success: toast "PO {po_number} created" → `onSuccess()` → `router.invalidate()`
3. On error: toast "Failed to create PO: {error.message}"

**Post-submit navigation**: Does not navigate. Dialog closes; inventory page reloads (via router.invalidate) showing updated stock once the PO is received.

---

## Dialog: Reconciliation Results

**Component**: `src/components/inventory/ReconciliationDialog.tsx`

Opens when "Run Reconciliation" button is clicked.

**Flow**:
1. Dialog opens with loading state ("Running reconciliation...")
2. Calls `runReconciliation()` on mount
3. If no discrepancies: shows success state ("All inventory levels match movement history")
4. If discrepancies found: shows a table of discrepant items

**Success state**:
```tsx
<div className="py-8 text-center">
  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
  <p className="font-medium">Inventory is clean</p>
  <p className="text-sm text-muted-foreground mt-1">
    All inventory levels match the movement log.
  </p>
</div>
```

**Discrepancy table columns**:

| Column | Content |
|--------|---------|
| Item | `name` (bold) + `sku` (muted) |
| Actual Qty | `actual_qty` from `inventory.qty_on_hand` |
| Movement Sum | `movement_implied_qty` from summing `inventory_movements.qty_delta` |
| Discrepancy | `discrepancy` — red if nonzero |
| Action | "Post Adjustment" button → opens AdjustStockDialog pre-filled with the delta |

**Footer**: "Discrepancies must be resolved by posting a manual adjustment. Contact ops if you cannot explain a discrepancy."

---

## Lucide Icons Used

| Icon | Usage |
|------|-------|
| `Package` | Empty state, nav item |
| `Plus` | New PO button |
| `Search` | Filter bar search input |
| `X` | Clear filters, cancel inline edit |
| `Check` | Confirm inline threshold edit |
| `Pencil` | Hover icon on threshold cell |
| `MoreHorizontal` | Row actions button |
| `History` | View History menu item |
| `ArrowUpDown` | Adjust Stock menu item |
| `ShoppingCart` | Order from Vendor menu item |
| `RefreshCw` | Run Reconciliation button |
| `PackageCheck` | Received movement icon |
| `Bookmark` | Allocated movement icon |
| `Truck` | Shipped movement icon |
| `TrendingUp` | Increase adjustment icon |
| `TrendingDown` | Decrease adjustment icon |
| `Undo2` | Return movement icon |
| `CheckCircle2` | Reconciliation success |
| `AlertCircle` | Error state |

---

## File Summary

Files to create for the inventory page:

```
src/
├── routes/
│   └── _auth/
│       └── inventory/
│           └── index.tsx                      # Route definition, loader, search schema
├── services/
│   └── inventory.ts                           # getInventoryLevels, getInventoryMovements,
│                                              # updateReorderThreshold, adjustInventory,
│                                              # createPurchaseOrder, runReconciliation
└── components/
    └── inventory/
        ├── InventoryPage.tsx                  # Main page: header, stats, filter, table
        ├── InventoryTable.tsx                 # Table shell and TableHeader
        ├── InventoryTableRow.tsx              # Single row with all cells and inline edit
        ├── CategoryBadge.tsx                  # bom_category → colored badge
        ├── MovementHistorySheet.tsx           # Right-side Sheet with movement list
        ├── MovementRow.tsx                    # Single movement entry with icon/label/delta
        ├── AdjustStockDialog.tsx              # Manual adjustment form dialog
        ├── NewPODialog.tsx                    # Create stock replenishment PO dialog
        └── ReconciliationDialog.tsx           # Run reconciliation + show discrepancies
```

---

## Data Flow Summary

```
URL search params (?category=&low_stock=&q=)
    │
    ▼
TanStack Router loader → getInventoryLevels(filters)
    │                      → Supabase: inventory JOIN hardware_catalog
    │                      → Client-side low_stock filter
    │                      → Compute stats (total_items, on_hand_value, low_stock_count)
    ▼
InventoryPage renders:
    ├── Stats cards (from stats)
    ├── Filter bar (controls URL search params)
    ├── InventoryTable (from items)
    │   └── InventoryTableRow × N
    │       ├── CategoryBadge
    │       ├── Inline threshold edit → updateReorderThreshold → router.invalidate()
    │       └── DropdownMenu actions
    │           ├── View History → MovementHistorySheet
    │           │   └── useQuery → getInventoryMovements → Supabase inventory_movements
    │           ├── Adjust Stock → AdjustStockDialog
    │           │   └── adjustInventory() → increment_inventory RPC → inventory_movements INSERT
    │           └── Order from Vendor → NewPODialog (prefilled)
    │               └── createPurchaseOrder() → purchase_orders + purchase_order_items INSERT
    ├── NewPODialog (from header button)
    └── ReconciliationDialog
        └── runReconciliation() → Supabase RPC → discrepancy list
```

All mutations call `router.invalidate()` after success to re-run the route loader and refresh the inventory table and stats cards without a full page reload.
