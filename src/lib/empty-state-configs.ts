/**
 * Empty state configurations for all 19 views per spec ui-spec/empty-states.md
 * Each config provides icon, heading, description, and optional CTA.
 * Views with two variants (A/B) use subkeys.
 */
import {
  FolderOpen,
  SearchX,
  Package,
  CheckCircle2,
  ClipboardList,
  PackageSearch,
  ShoppingCart,
  PackageOpen,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  Users,
} from 'lucide-react'

export const EMPTY_STATES = {
  // 1A. Dashboard — no projects in database
  dashboardNoProjects: {
    icon: FolderOpen,
    heading: 'No projects yet',
    description: 'Start by creating your first installation project.',
    cta: { label: '+ New Project', href: '/projects/new' },
  },

  // 1B. Dashboard — no results for current filters
  dashboardNoResults: {
    icon: SearchX,
    heading: 'No projects found',
    description: 'Try adjusting your filters or search term.',
    // CTA action set at call site: navigate({ search: { page: 1 } })
    cta: { label: 'Clear filters' },
  },

  // 2A. Inventory — database empty (seed not run)
  inventoryEmpty: {
    icon: Package,
    heading: 'Inventory not set up yet',
    description: 'Run the seed data migration to populate the hardware catalog.',
  },

  // 2B. Inventory — no items match filters
  inventoryNoResults: {
    icon: Package,
    heading: 'No items found',
    description: 'Try adjusting your search or filters.',
    // CTA action set at call site: navigate({ search: {} })
    cta: { label: 'Clear Filters' },
  },

  // 3. Movement History Sheet — text-only (not an EmptyState component)
  // Implementation: <p className="text-sm text-muted-foreground text-center py-8">No movements recorded yet.</p>

  // 4. Reconciliation Dialog — clean state
  reconciliationClean: {
    icon: CheckCircle2,
    heading: 'Inventory is clean',
    description: 'All inventory levels match the movement log.',
    // iconClassName override: text-green-500
  },

  // 5. Procurement — BOM Review tab empty
  bomReviewEmpty: {
    icon: ClipboardList,
    heading: 'No BOM items',
    description:
      'The bill of materials is empty. Regenerate it from the project configuration or add items manually.',
    // CTA action set at call site: opens regeneration confirmation dialog
    cta: { label: 'Regenerate BOM' },
  },

  // 6. Procurement — Inventory Check tab (BOM is empty)
  inventoryCheckEmpty: {
    icon: PackageSearch,
    heading: 'No items to check',
    description: 'The BOM is empty. Add items to the BOM before checking inventory availability.',
    // CTA action set at call site: navigate({ search: (prev) => ({ ...prev, tab: 'bom' }) })
    cta: { label: 'Go to BOM Review' },
  },

  // 7. Procurement — Purchase Orders tab (no POs yet)
  purchaseOrdersEmpty: {
    icon: ShoppingCart,
    heading: 'No purchase orders yet',
    description: 'Create a PO for items not currently in stock.',
    // CTA action set at call site: opens New PO dialog
    cta: { label: 'Create PO' },
  },

  // 8. Procurement — Packing tab (BOM is empty)
  packingEmpty: {
    icon: PackageOpen,
    heading: 'Nothing to pack',
    description: 'Add items to the BOM before confirming the packing list.',
    // CTA action set at call site: navigate({ search: (prev) => ({ ...prev, tab: 'bom' }) })
    cta: { label: 'Go to BOM Review' },
  },

  // 9. Deployment — checklist not generated
  deploymentChecklistEmpty: {
    icon: ClipboardCheck,
    heading: 'Checklist not generated',
    description:
      'The deployment checklist was not created. Contact support or re-advance the project from Procurement.',
  },

  // 10. Deployment — phase steps empty — text-only
  // Implementation: <p className="text-sm text-muted-foreground py-4 text-center">No steps in this phase.</p>

  // 11. Financials — Pipeline tab (no projects in any revenue stage)
  pipelineEmpty: {
    icon: TrendingUp,
    heading: 'No projects in pipeline',
    description: 'Create your first project to start tracking revenue.',
    cta: { label: 'New Project', href: '/projects/new' },
  },

  // 12. Financials — P&L tab (no closed months)
  pnlNoData: {
    icon: BarChart3,
    heading: 'No P&L data for this period',
    description: 'Close a month using the Monthly Close tab to generate P&L snapshots.',
    // CTA action set at call site: navigate to monthly-close tab
    cta: { label: 'Go to Monthly Close' },
  },

  // 13. Financials — HER tab (no monthly snapshots)
  herNoData: {
    icon: Activity,
    heading: 'No HER data yet',
    description:
      'Hardware Efficiency Ratio is calculated from monthly snapshots. Close your first month to see HER trends.',
    // CTA action set at call site: navigate to monthly-close tab
    cta: { label: 'Go to Monthly Close' },
  },

  // 14. Financials — Receivables tab (no outstanding invoices)
  receivablesClear: {
    icon: CheckCircle2,
    heading: 'No outstanding invoices',
    description: 'All invoices have been paid or none have been sent yet.',
    // iconClassName override: text-green-500
  },

  // 15. Financials — Per-Project tab (no non-cancelled projects)
  perProjectEmpty: {
    icon: FolderOpen,
    heading: 'No projects yet',
    description: 'Create a project to start tracking per-project P&L.',
    cta: { label: 'New Project', href: '/projects/new' },
  },

  // 16. Financials — Reconciliation tab (all checks passed)
  financialsReconciliationClean: {
    icon: CheckCircle2,
    heading: 'All checks passed',
    description:
      'No discrepancies found across inventory, POs, BOM costs, project costs, and revenue stages.',
    // iconClassName override: text-green-500
  },

  // 17. Financials — Monthly Close tab — uses muted info card pattern, not EmptyState
  // Implementation: see spec for the info card JSX pattern
  monthlyCloseNotClosed: {
    icon: Calendar,
    heading: '{MonthName YYYY} not closed yet',
    description: "Review expenses and OpEx below, then click 'Close Month' to save a snapshot.",
  },

  // 18. Settings — Hardware Catalog tab (no catalog items)
  catalogEmpty: {
    icon: Package,
    heading: 'Hardware catalog is empty',
    description:
      'Run the seed data migration to populate the default hardware catalog, or add items manually.',
    // CTA action set at call site: opens Add Catalog Item dialog
    cta: { label: 'Add Item' },
  },

  // 19. Settings — Team Contacts tab (no contacts)
  teamContactsEmpty: {
    icon: Users,
    heading: 'No team contacts',
    description: 'Add team members to show their info in the project wizard.',
    // CTA action set at call site: opens Add Contact dialog
    cta: { label: 'Add Contact' },
  },
} as const
