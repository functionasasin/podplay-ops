import { useEffect, useState } from 'react';
import {
  PackageCheck,
  Bookmark,
  Truck,
  TrendingUp,
  TrendingDown,
  Undo2,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type InventoryMovementType =
  | 'purchase_order_received'
  | 'project_allocated'
  | 'project_shipped'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'return';

export interface InventoryMovement {
  id: string;
  created_at: string;
  hardware_catalog_id: string;
  project_id: string | null;
  movement_type: InventoryMovementType;
  qty_delta: number;
  reference: string | null;
  notes: string | null;
  project_venue_name: string | null;
}

type MovementConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  label: string;
  /** in = stock gained, out = stock left, adjust = reallocation */
  direction: 'in' | 'out' | 'adjust';
};

const MOVEMENT_CONFIG: Record<InventoryMovementType, MovementConfig> = {
  purchase_order_received: {
    icon: PackageCheck,
    label: 'Received from PO',
    direction: 'in',
  },
  project_allocated: {
    icon: Bookmark,
    label: 'Allocated to project',
    direction: 'adjust',
  },
  project_shipped: {
    icon: Truck,
    label: 'Shipped to venue',
    direction: 'out',
  },
  adjustment_increase: {
    icon: TrendingUp,
    label: 'Manual increase',
    direction: 'in',
  },
  adjustment_decrease: {
    icon: TrendingDown,
    label: 'Manual decrease',
    direction: 'out',
  },
  return: {
    icon: Undo2,
    label: 'Returned to stock',
    direction: 'in',
  },
};

const DIRECTION_CLASSES: Record<'in' | 'out' | 'adjust', { bg: string; text: string; delta: string }> = {
  in:     { bg: 'bg-green-100',  text: 'text-green-600',  delta: 'text-green-600' },
  out:    { bg: 'bg-red-100',    text: 'text-red-600',    delta: 'text-red-600' },
  adjust: { bg: 'bg-amber-100',  text: 'text-amber-600',  delta: 'text-amber-600' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface MovementRowProps {
  movement: InventoryMovement;
}

function MovementRow({ movement }: MovementRowProps) {
  const config = MOVEMENT_CONFIG[movement.movement_type] ?? {
    icon: PackageCheck,
    label: movement.movement_type,
    direction: movement.qty_delta >= 0 ? 'in' : 'out',
  };
  const Icon = config.icon;
  const dir = config.direction;
  const colors = DIRECTION_CLASSES[dir];
  const isPositive = movement.qty_delta > 0;

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded hover:bg-muted/50 transition-colors">
      {/* Icon bubble */}
      <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${colors.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(movement.created_at)}
          {movement.reference && (
            <span className="ml-1">· {movement.reference}</span>
          )}
        </p>
        {movement.project_id && movement.project_venue_name && (
          <a
            href={`/projects/${movement.project_id}`}
            className="text-xs text-primary hover:underline mt-0.5 block"
          >
            → {movement.project_venue_name}
          </a>
        )}
        {movement.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{movement.notes}</p>
        )}
      </div>

      {/* Delta */}
      <span className={`text-sm font-mono font-semibold shrink-0 ${isPositive ? DIRECTION_CLASSES.in.delta : DIRECTION_CLASSES.out.delta}`}>
        {isPositive ? `+${movement.qty_delta}` : movement.qty_delta}
      </span>
    </div>
  );
}

interface MovementHistoryProps {
  hardwareCatalogId: string;
  /** Optional: shown in the header */
  itemName?: string;
  /** Max records to fetch (default 50) */
  limit?: number;
}

/**
 * MovementHistory — timeline of inventory movements for one hardware catalog item.
 * Fetches movements from Supabase and renders them newest-first.
 */
export function MovementHistory({ hardwareCatalogId, itemName, limit = 50 }: MovementHistoryProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMovements() {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('inventory_movements')
        .select(
          `
          id,
          created_at,
          hardware_catalog_id,
          project_id,
          movement_type,
          qty_delta,
          reference,
          notes,
          projects ( venue_name )
        `,
        )
        .eq('hardware_catalog_id', hardwareCatalogId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: InventoryMovement[] = (data ?? []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          hardware_catalog_id: row.hardware_catalog_id,
          project_id: row.project_id,
          movement_type: row.movement_type as InventoryMovementType,
          qty_delta: row.qty_delta,
          reference: row.reference,
          notes: row.notes,
          project_venue_name: row.projects?.venue_name ?? null,
        }));
        setMovements(rows);
      }
      setLoading(false);
    }

    void fetchMovements();
    return () => { cancelled = true; };
  }, [hardwareCatalogId, limit]);

  return (
    <div className="space-y-1">
      {itemName && (
        <h3 className="text-sm font-medium mb-3">
          Movement History{itemName ? ` — ${itemName}` : ''}{' '}
          <span className="text-muted-foreground font-normal">(last {limit})</span>
        </h3>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive text-center py-4">{error}</p>
      )}

      {!loading && !error && movements.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No movements recorded yet
        </p>
      )}

      {!loading && !error && movements.length > 0 && (
        <div className="space-y-0.5">
          {movements.map((m) => (
            <MovementRow key={m.id} movement={m} />
          ))}
        </div>
      )}
    </div>
  );
}
