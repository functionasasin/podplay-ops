# Feature Spec: Family Tree Visualizer

**Aspect:** spec-family-tree-visualizer
**Wave:** 2 — Per-Feature Specifications
**Date:** 2026-03-01
**Reads:** codebase-audit, crm-law-firm-patterns
**Depends on:** none (purely frontend, derives from EngineInput already in state)

---

## 1. Overview

The Family Tree Visualizer is an interactive SVG diagram rendered as a new tab in the `ResultsView`
alongside the distribution table. It displays the decedent's family hierarchy, succession
relationships, and each heir's computed outcome — all at a glance.

**Why a PH estate lawyer needs this:**
- Philippine estate cases regularly involve 3–4 generations of heirs (decedent, children,
  grandchildren inheriting by representation, plus surviving spouse). A table shows amounts but
  gives no spatial sense of *why* a distribution occurred.
- When presenting to a client family, a visual tree explains at a glance why certain cousins
  are excluded while others inherit (representation doctrine), without requiring the lawyer to
  recite NCC articles verbally.
- The existing `DistributionSection` HeirTable enumerates shares but cannot show that
  grandchild "Maria Cruz" is inheriting *instead of* her predeceased father "Jose Cruz" (Art. 981
  NCC). The tree makes this immediately obvious.
- Tools like Estateably and DecisionVault list family-tree visualization as a top client
  communication differentiator (sourced: crm-law-firm-patterns §7, Estate-Specific Patterns).
- For complex collateral succession (scenarios I12–I14 with half-blood siblings and niece/nephews),
  the degree and blood-type columns in HeirTable are hard to parse without a visual context.

**What it does NOT do:**
- Does not re-implement the distribution computation (engine is authoritative).
- Does not replace the distribution table (the table remains the primary share display).
- Does not edit the family tree (editing happens in `FamilyTreeStep` wizard step).
- Does not store additional data beyond what is already in `EngineInput.family_tree`.

---

## 2. Data Model

This feature is entirely frontend-only. No new database tables are required. All data derives
from existing `EngineInput` and `EngineOutput` types already present in React state.

### 2.1 Tree Node Type

```typescript
// src/components/visualizer/types.ts

export type NodeRole =
  | "decedent"           // The decedent (root node)
  | "surviving-spouse"   // SurvivingSpouse relationship
  | "active-heir"        // is_alive_at_succession = true, net_from_estate > 0
  | "predeceased"        // is_alive_at_succession = false
  | "disinherited"       // Listed in will.disinheritances
  | "unworthy"           // is_unworthy = true
  | "renounced"          // has_renounced = true
  | "zero-share"         // alive but net_from_estate = 0 (excluded by better heirs)
  | "testamentary-only"; // Stranger recipient, not in family_tree

export interface TreeNodeData {
  id: PersonId;
  name: string;
  role: NodeRole;
  relationship: Relationship | "decedent";
  inherits_by: InheritanceMode | null;    // null if not an heir
  represents_name: string | null;         // name of predeceased parent if by Representation
  net_from_estate: Money | null;          // null if not an heir
  legitime_fraction: string | null;       // "1/2", "1/4", etc. — null if not a compulsory heir
  legal_basis: string[];                  // NCC article codes
  degree: number;                         // 1 = direct, 2 = grandchild, etc.
  line: LineOfDescent | null;
  children: PersonId[];                   // IDs of children in the tree (for layout)
  is_married_to_decedent: boolean;        // true only for SurvivingSpouse
}

export interface FamilyTreeGraphData {
  decedent: TreeNodeData;
  spouse: TreeNodeData | null;            // null if decedent was not married / spouse predeceased
  heir_nodes: TreeNodeData[];             // all persons in family_tree, enriched with share info
}
```

### 2.2 Tree Data Builder

```typescript
// src/components/visualizer/buildTreeData.ts

import { EngineInput, EngineOutput, Person, InheritanceShare } from "@/types";
import { TreeNodeData, FamilyTreeGraphData, NodeRole } from "./types";

function resolveNodeRole(
  person: Person,
  shareMap: Map<string, InheritanceShare>,
  disinheritedIds: Set<string>
): NodeRole {
  if (disinheritedIds.has(person.id)) return "disinherited";
  if (person.is_unworthy) return "unworthy";
  if (person.has_renounced) return "renounced";
  if (!person.is_alive_at_succession) return "predeceased";
  if (person.relationship_to_decedent === "SurvivingSpouse") return "surviving-spouse";

  const share = shareMap.get(person.id);
  if (!share) return "zero-share";

  const centavos =
    typeof share.net_from_estate.centavos === "string"
      ? BigInt(share.net_from_estate.centavos)
      : BigInt(share.net_from_estate.centavos);
  if (centavos > 0n) return "active-heir";
  return "zero-share";
}

export function buildFamilyTreeGraphData(
  input: EngineInput,
  output: EngineOutput
): FamilyTreeGraphData {
  const shareMap = new Map<string, InheritanceShare>();
  output.per_heir_shares.forEach((s) => shareMap.set(s.heir_id, s));

  const disinheritedIds = new Set<string>(
    (input.will?.disinheritances ?? [])
      .map((d) => d.heir_reference.person_id)
      .filter((id): id is string => id !== null)
  );

  // Map PersonId → name for "represents" label resolution
  const nameMap = new Map<string, string>();
  input.family_tree.forEach((p) => nameMap.set(p.id, p.name));
  nameMap.set(input.decedent.id, input.decedent.name);

  const heir_nodes: TreeNodeData[] = input.family_tree.map((person) => {
    const role = resolveNodeRole(person, shareMap, disinheritedIds);
    const share = shareMap.get(person.id) ?? null;

    // Resolve representation label
    let represents_name: string | null = null;
    if (share?.inherits_by === "Representation" && share.represents !== null) {
      represents_name = nameMap.get(share.represents) ?? null;
    }

    return {
      id: person.id,
      name: person.name,
      role,
      relationship: person.relationship_to_decedent,
      inherits_by: share?.inherits_by ?? null,
      represents_name,
      net_from_estate: share?.net_from_estate ?? null,
      legitime_fraction: share?.legitime_fraction ?? null,
      legal_basis: share?.legal_basis ?? [],
      degree: person.degree,
      line: person.line,
      children: person.children,
      is_married_to_decedent:
        person.relationship_to_decedent === "SurvivingSpouse",
    };
  });

  const decedentNode: TreeNodeData = {
    id: input.decedent.id,
    name: input.decedent.name,
    role: "decedent",
    relationship: "decedent",
    inherits_by: null,
    represents_name: null,
    net_from_estate: null,
    legitime_fraction: null,
    legal_basis: [],
    degree: 0,
    line: null,
    children: heir_nodes
      .filter((n) => !n.is_married_to_decedent)
      .filter((n) => {
        // Direct heir = not listed as child of any other node
        const allChildIds = new Set(heir_nodes.flatMap((h) => h.children));
        return !allChildIds.has(n.id);
      })
      .map((n) => n.id),
    is_married_to_decedent: false,
  };

  const spouseNode =
    heir_nodes.find((n) => n.is_married_to_decedent) ?? null;

  return { decedent: decedentNode, spouse: spouseNode, heir_nodes };
}
```

### 2.3 No New Database Tables

The visualizer is a pure display component. No Supabase tables, RPCs, or server calls are added.
When a case is saved (`spec-auth-persistence`), the existing `input_json` and `output_json` columns
contain all data needed to re-render the tree; no additional columns are needed.

---

## 3. UI Design

### 3.1 Layout: Tab in ResultsView

The visualizer occupies a new "Family Tree" tab added to the `ResultsView`, positioned between
`ResultsHeader` and the existing section content:

```
┌─────────────────────────────────────────────────────────────┐
│ Estate of Juan dela Cruz  |  Date of Death: 15 Jan 2026    │
│ Scenario I3  •  Intestate Succession  •  ₱4,800,000 net    │
├──────────────────┬──────────────────┬──────────────────────┤
│  Distribution ▼  │  Family Tree  ▼  │   Narratives  ▼      │
├──────────────────┴──────────────────┴──────────────────────┤
│                                                             │
│  [Family Tree Canvas — see §3.3]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

On mobile (< 640px): tabs become a vertical accordion; "Family Tree" expands to full width.

### 3.2 Color Legend and Node Styles

| Role | Border Color | Background | Icon | Label Pill |
|------|-------------|-----------|------|-----------|
| `decedent` | `#1e293b` (slate-800) | `#f1f5f9` (slate-100) | † cross | none |
| `active-heir` | `#16a34a` (green-600) | `#f0fdf4` (green-50) | none | Share amount |
| `surviving-spouse` | `#7c3aed` (violet-600) | `#f5f3ff` (violet-50) | ♡ | Share amount |
| `predeceased` | `#94a3b8` (slate-400) | `#f8fafc` (slate-50) | † | "Predeceased" |
| `disinherited` | `#dc2626` (red-600) | `#fef2f2` (red-50) | ✕ | "Disinherited" |
| `unworthy` | `#ea580c` (orange-600) | `#fff7ed` (orange-50) | ! | "Unworthy" |
| `renounced` | `#ca8a04` (yellow-600) | `#fefce8` (yellow-50) | → | "Renounced" |
| `zero-share` | `#cbd5e1` (slate-300) | `#f8fafc` (slate-50) | none | "Excluded" |

**Edge styles:**
- Parent–child biological link: solid gray line, 1.5px
- Marriage link (decedent ↔ spouse): double-line `═══`, dashed horizontal, 2px `#7c3aed`
- Representation link (grandchild → predeceased parent): dashed line, 1px, `#94a3b8`

### 3.3 ASCII Wireframe — Standard Intestate (Scenario I3: Spouse + 3 LC)

```
  Family Tree                                             [Download SVG]

                      ┌─────────────────┐
                      │  † Juan dela Cruz│
                      │   (Decedent)     │
                      └────────┬────────┘
                               │═══════════════════════════════╗
                               │                               ║
                      ┌────────┴────────┐             ┌────────╨────────┐
                      │  Direct Heirs   │             │   Ana dela Cruz  │
                      │                 │             │ Surviving Spouse │
                      └────────┬────────┘             │   ₱1,200,000    │
                               │                      └─────────────────┘
              ┌────────────────┼────────────────┐
              │                │                │
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Maria Cruz  │  │  Jose Cruz   │  │  Pedro Cruz  │
    │  Legit. Child│  │  Legit. Child│  │ Legit. Child │
    │  ₱1,200,000  │  │  ₱1,200,000  │  │  ₱1,200,000  │
    └──────────────┘  └──────────────┘  └──────────────┘

  ━━ Legend: ■ Active Heir  □ Predeceased  ✕ Disinherited  → Renounced
```

### 3.4 ASCII Wireframe — Representation (Scenario I5: Spouse + 2 LC + 1 predeceased LC whose 2 children represent)

```
  Family Tree                                             [Download SVG]

                      ┌─────────────────┐
                      │  † Pedro Santos  │
                      │   (Decedent)     │
                      └────────┬────────┘
                               │═══════════════════════════╗
                               │                           ║
              ┌────────────────┼──────────────┐   ┌───────╨────────┐
              │                │              │   │  Rosa Santos   │
    ┌──────────────┐  ┌──────────────┐  ┌──────┴────────┐  Spouse  │
    │  Luisa Santos│  │  Mario Santos│  │† Carlos Santos│  ₱800,000│
    │  Legit. Child│  │  Legit. Child│  │  (Predeceased) │         │
    │  ₱800,000    │  │  ₱800,000    │  └──────┬────────┘  └───────┘
    └──────────────┘  └──────────────┘         │ (by representation)
                                       ┌───────┴───────┐
                                  ┌────┴────┐      ┌───┴─────┐
                                  │Ana Santos│      │Ben Santos│
                                  │By Repres.│      │By Repres.│
                                  │ ₱400,000 │      │ ₱400,000 │
                                  │ rep. †Carlos    │ rep. †Carlos
                                  └──────────┘      └──────────┘

  ━━ Legend: ■ Active Heir  □ Predeceased  ✕ Disinherited  → Renounced
  ┄┄ Dashed line = inheritance by representation (Art. 970 NCC)
```

### 3.5 ASCII Wireframe — Collateral Succession (Scenario I12: Siblings half-blood and full-blood)

```
  Family Tree                                             [Download SVG]

                         ┌──────────────────┐
                         │  † Ricardo Reyes  │
                         │    (Decedent)     │
                         │   No spouse,      │
                         │   No children,    │
                         │   No parents      │
                         └────────┬─────────┘
                                  │ collateral
              ┌──────────────────┬┴──────────────────┐
              │                  │                   │
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ Carmen Reyes │   │ Dante Reyes  │   │ Elena Reyes  │
    │Full Sibling  │   │Half Sibling  │   │Full Sibling  │
    │  ₱1,333,333  │   │  ₱666,667   │   │  ₱1,333,333  │
    │ (2 units)    │   │  (1 unit)   │   │  (2 units)   │
    └──────────────┘   └──────────────┘   └──────────────┘

  ━━ Full sibling = 2 units  |  Half sibling = 1 unit  (Art. 1006 NCC)
```

### 3.6 Node Hover Tooltip

When a user hovers or taps (mobile) any node, a tooltip appears above the node:

```
  ┌─────────────────────────────────────────┐
  │  Maria Cruz                              │
  │  Legitimate Child — Degree 1             │
  │  ─────────────────────────────────────  │
  │  Net Share:       ₱1,200,000            │
  │  Legitime Fraction: 1/4                  │
  │  From legitime:   ₱1,000,000            │
  │  From free portion: ₱200,000            │
  │  ─────────────────────────────────────  │
  │  Legal basis: Art. 887 NCC, Art. 980 NCC│
  └─────────────────────────────────────────┘
```

Fields shown in tooltip per role:
- `active-heir`: name, relationship, degree, net share, legitime fraction, from_legitime,
  from_free_portion, from_intestate, legal_basis[]
- `predeceased`: name, relationship, "Predeceased — did not inherit"
- `disinherited`: name, relationship, disinheritance cause (from will.disinheritances[].cause_code
  mapped to human-readable label)
- `unworthy`: name, relationship, "Declared unworthy (Art. 1032 NCC)"
- `renounced`: name, relationship, "Renounced inheritance (Art. 1041 NCC)"
- `surviving-spouse`: name, "Surviving Spouse", net share, legal_basis[]
- `decedent`: name, date_of_death, "Net Distributable Estate: ₱X"

### 3.7 Zoom and Pan Controls

```
  [−] [+] [Fit to Screen]
```

Three buttons positioned at top-left of canvas:
- `−`: zoom out by 0.2 step, min scale 0.4
- `+`: zoom in by 0.2 step, max scale 2.0
- `Fit to Screen`: reset transform to show entire tree centered in viewport

Pan: click-drag on canvas background (not on a node) repositions the tree.
Pinch-to-zoom: supported on touch devices via native pointer events.

### 3.8 Download SVG Button

Top-right of canvas: `[Download SVG]` button.
Serializes the current `<svg>` element to a file: `family-tree-{decedent-name}-{DOD}.svg`.
On print, the canvas renders at full size (no scroll, no pan offset applied).

---

## 4. API / Data Layer

This feature is entirely frontend. No network calls, no Supabase queries, no new dependencies
beyond the library below.

### 4.1 Library: react-d3-tree

**Package:** `react-d3-tree` v3.6.x (MIT license)
**npm:** `npm install react-d3-tree`
**Size:** ~85 KB gzip (acceptable given this is a lazy-loaded tab panel)
**TypeScript support:** first-party `@types/react-d3-tree` bundled since v3.4

**Why react-d3-tree over alternatives:**
- Designed specifically for hierarchical tree visualization, not general graphs.
- Built-in pan/zoom, center-on-render, custom node rendering.
- Handles variable-depth trees (grandchildren by representation, collateral at degree 3/4)
  without manual coordinate calculation.
- Alternative `@xyflow/react` (ReactFlow) is designed for DAGs, not trees, and weighs 3× more.
- Pure custom SVG would require implementing Reingold–Tilford or Buchheim layout algorithm
  (~400 lines of algorithm code) that react-d3-tree already provides.

**Limitation:** react-d3-tree roots from a single top node. The spouse must be handled separately
as an overlay node, since a spouse is a sibling of the decedent's children level, not a child.

### 4.2 Tree Data Format for react-d3-tree

react-d3-tree accepts `{ name: string, children?: [] }` or a custom `nodeData` attribute:

```typescript
// src/components/visualizer/toD3TreeFormat.ts

import { FamilyTreeGraphData, TreeNodeData } from "./types";

export interface D3TreeNode {
  name: string;
  attributes: {
    role: string;
    share: string;      // formatted peso amount or empty string
    fraction: string;   // legitime fraction or empty string
    by_rep: string;     // "representing Juan Cruz" or empty string
  };
  children?: D3TreeNode[];
  _nodeData: TreeNodeData;  // original data for tooltip
}

export function toD3TreeFormat(
  graph: FamilyTreeGraphData
): D3TreeNode {
  const nodeMap = new Map<string, TreeNodeData>();
  graph.heir_nodes.forEach((n) => nodeMap.set(n.id, n));

  function buildNode(node: TreeNodeData): D3TreeNode {
    const centavos = node.net_from_estate?.centavos ?? null;
    const shareFormatted =
      centavos !== null
        ? formatPeso(centavos)  // from types/index.ts
        : "";

    return {
      name: node.name,
      attributes: {
        role: node.role,
        share: shareFormatted,
        fraction: node.legitime_fraction ?? "",
        by_rep: node.represents_name
          ? `rep. ${node.represents_name}`
          : "",
      },
      _nodeData: node,
      children: node.children
        .map((childId) => nodeMap.get(childId))
        .filter((child): child is TreeNodeData => child !== undefined)
        .map(buildNode),
    };
  }

  return buildNode(graph.decedent);
}
```

### 4.3 Spouse Node Overlay

Because react-d3-tree's root is the decedent and the spouse is not a child of the decedent,
the spouse is rendered as an SVG `<foreignObject>` overlay positioned at the same Y level as
the decedent node, offset 200px to the right (or left if right is clipped):

```typescript
// SpouseOverlay.tsx
// Rendered outside the react-d3-tree SVG, positioned absolutely
// Uses the decedent node's DOM position via a ref + getBoundingClientRect()
```

A `═══` double-line connecting decedent to spouse is drawn as an SVG `<line>` element with
`strokeDasharray="8 3"` and `strokeWidth="3"` in `#7c3aed` (violet).

### 4.4 Lazy Loading

The visualizer tab panel is lazy-loaded to avoid adding react-d3-tree to the critical bundle:

```typescript
// In ResultsView.tsx
const FamilyTreeTab = lazy(() => import("./visualizer/FamilyTreeTab"));

// Inside TabPanel for "Family Tree":
<Suspense fallback={<Skeleton className="h-96 w-full" />}>
  <FamilyTreeTab input={input} output={output} />
</Suspense>
```

---

## 5. Component Hierarchy

```
ResultsView
└── Tabs (shadcn Tabs component — already in codebase)
    ├── TabsTrigger "Distribution"
    ├── TabsTrigger "Family Tree"   ← NEW
    └── TabsContent "Family Tree"
        └── FamilyTreeTab          ← NEW (lazy loaded)
            ├── TreeControls       ← zoom/pan buttons + Download SVG
            ├── SpouseOverlay      ← positioned absolutely if spouse exists
            ├── Tree (react-d3-tree) ← rooted at decedent
            │   └── renderCustomNodeElement → TreeNode
            │       └── Tooltip (shadcn) wrapping each node circle
            └── Legend             ← color legend row at bottom
```

**New files to create:**
- `src/components/visualizer/FamilyTreeTab.tsx` — tab panel wrapper
- `src/components/visualizer/TreeNode.tsx` — custom node renderer for react-d3-tree
- `src/components/visualizer/TreeControls.tsx` — zoom/pan/download buttons
- `src/components/visualizer/SpouseOverlay.tsx` — spouse node rendered outside tree SVG
- `src/components/visualizer/Legend.tsx` — color legend
- `src/components/visualizer/buildTreeData.ts` — data enrichment (§2.2)
- `src/components/visualizer/toD3TreeFormat.ts` — conversion to react-d3-tree format (§4.2)
- `src/components/visualizer/types.ts` — TreeNodeData, FamilyTreeGraphData (§2.1)

**Modified files:**
- `src/components/results/ResultsView.tsx` — wrap content in `<Tabs>`, add new tab

---

## 6. Integration Points

### 6.1 ResultsView Tab Restructure

Currently `ResultsView` renders sections stacked vertically. The visualizer requires adding a
`<Tabs>` wrapper. The existing sections become:
- Tab 1: "Distribution" — contains `DistributionSection` + `ActionsBar`
- Tab 2: "Family Tree" — contains `FamilyTreeTab`
- Tab 3: "Narratives" — contains `NarrativePanel`
- Tab 4: "Computation Log" — contains `ComputationLog` + `WarningsPanel`

**Backward compatibility:** The default active tab is "Distribution", preserving existing UX.
Users who do not click "Family Tree" never load react-d3-tree.

### 6.2 PDF Export (spec-pdf-export)

The PDF export feature (`spec-pdf-export`) should include an optional "Family Tree" page.
The `FamilyTreeTab` exposes a `getSVGString(): string` function via `useImperativeHandle` that
the PDF generator can call to embed the tree as an SVG image inside a `@react-pdf/renderer`
`<Svg>` element. This avoids rendering a second tree instance just for PDF.

```typescript
// FamilyTreeTab.tsx
export interface FamilyTreeTabHandle {
  getSVGString: () => string | null;
}
const FamilyTreeTab = forwardRef<FamilyTreeTabHandle, Props>((props, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  useImperativeHandle(ref, () => ({
    getSVGString: () => svgRef.current
      ? new XMLSerializer().serializeToString(svgRef.current)
      : null,
  }));
  // ...
});
```

### 6.3 Shareable Links (spec-shareable-links)

The read-only view for shareable links must also render the family tree tab. Since shareable
links embed the full `input_json` and `output_json`, `buildTreeData` can run client-side on
the read-only view page without any additional API calls.

### 6.4 Print Layout (spec-print-layout)

The `@media print` CSS must:
- Expand the "Family Tree" tab if it is currently active (remove tab hiding)
- If the "Distribution" tab is active, print only that tab; do not force-print all tabs
- Add `page-break-before: always` before the tree section in print mode

---

## 7. Edge Cases

### 7.1 No Surviving Heirs (Escheat — Scenario I15)

When `output.scenario_code === "I15"`, all `per_heir_shares` is empty and the estate escheats
to the State. The family tree renders all persons as `predeceased` or `zero-share`. A banner
overlays the canvas:

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠  Estate Escheated to the State (Art. 1011 NCC)           │
│  No surviving heir qualifies to inherit this estate.         │
└──────────────────────────────────────────────────────────────┘
```

The tree still renders to show the family structure that led to escheat.

### 7.2 Empty family_tree

If `input.family_tree` is empty (e.g., a single-heir test case or a decedent with only a
surviving spouse), the tree renders only the decedent node and the spouse overlay if present.
The "Family Tree" tab shows: "No family members entered. The tree displays persons added in
the Family Tree wizard step."

### 7.3 Large Trees (20+ persons)

When `family_tree.length > 20`, the default zoom level is reduced to 0.6 to fit more nodes.
The `Fit to Screen` button calculates an optimal scale using:
`scale = Math.min(viewportWidth / treeWidth, viewportHeight / treeHeight, 1.0)`

Performance: react-d3-tree renders nodes as SVG `<circle>` + `<text>` elements. 50 nodes
renders in < 16ms on modern hardware. No virtualization needed below 200 nodes.

### 7.4 Testamentary Strangers (Testate Succession)

When `input.will` exists and includes institutions to strangers (heirs not in `family_tree`),
these persons appear in `EngineOutput.per_heir_shares` but NOT in `input.family_tree`. They
receive `role: "testamentary-only"` and are rendered in a separate "Testamentary Heirs" section
below the family tree, not inside the hierarchy:

```
  ─── Testamentary Heirs (not family members) ───
  ┌──────────────────┐   ┌──────────────────┐
  │  Ateneo Law School│   │  Fr. Santos O.P.  │
  │  Institution      │   │  Legatee          │
  │  ₱500,000         │   │  ₱250,000         │
  └──────────────────┘   └──────────────────┘
```

### 7.5 Representation Chain Depth

The NCC allows at most two levels of representation (Art. 971: representatives take in equal
parts). The tree handles depth 3 (decedent → LC → grandchild → great-grandchild) but
representation beyond degree 2 does not occur under PH law. The layout truncates at depth 4
and shows a "…" node with tooltip "Further descendants not displayed".

### 7.6 Collateral Tree (Siblings, NephewNiece)

For scenarios I10–I14 (collateral succession), the family tree layout differs:
- The decedent node is at center.
- Siblings appear on either side (same level, connected by dotted horizontal line to decedent).
- NephewNiece appear below their respective parent sibling.
- `degree` and `line` (Paternal/Maternal) are shown as sub-labels on each collateral node.

### 7.7 Spouse-Only Inheritance (Scenario I7)

When only the surviving spouse inherits (no qualifying relatives), the tree renders decedent +
spouse only, connected by marriage line. The spouse node shows the full `net_from_estate`.

### 7.8 Mobile Viewport

On mobile (< 640px), the tree defaults to `orientation="vertical"` (react-d3-tree prop) and
starts at scale 0.5. The user can pinch-zoom. The tooltip becomes a bottom-sheet modal on tap
(shadcn `Drawer` component) rather than a hover tooltip, since mobile has no hover state.

---

## 8. Dependencies

**This feature has NO hard dependencies** — all required data is available in `EngineInput` and
`EngineOutput` already present in the `results` phase AppState.

**Must be built after:**
- Existing results view (already built) — the tab restructure in §6.1 requires that
  `ResultsView` already renders correctly, which it does.

**Optional enhancements that depend on this feature:**
- `spec-pdf-export` — optionally embeds the SVG tree in the PDF (via `getSVGString()` ref)

**New npm dependency:** `react-d3-tree` v3.6.x (~85 KB gzip)

---

## 9. Acceptance Criteria

### AC-1: Basic Rendering
- Given any `EngineInput` with at least one person in `family_tree`, the "Family Tree" tab
  renders a connected SVG tree rooted at the decedent node.
- The decedent node displays the decedent's name and "†" symbol.
- Each person in `family_tree` appears as exactly one node; no duplicates.

### AC-2: Heir Status Colors
- A person with `is_alive_at_succession = true` and `net_from_estate > 0` renders with
  a green border and their share amount below the node.
- A person with `is_alive_at_succession = false` renders with gray fill and "Predeceased" label.
- A person listed in `will.disinheritances` renders with red border and "Disinherited" label.
- A person with `has_renounced = true` renders with yellow border and "Renounced" label.

### AC-3: Representation Display
- When `inherits_by === "Representation"`, the edge from that person's node to their deceased
  parent's node is rendered with `strokeDasharray="6 3"` (dashed line).
- The tooltip for a representative heir shows "representing [deceased parent name]".

### AC-4: Spouse Overlay
- When the decedent is married (`is_married = true`) and the surviving spouse is in
  `family_tree`, the spouse node appears at the same Y level as the decedent, offset to the
  right, connected by a double-dash marriage line in violet (#7c3aed).
- When the spouse predeceased (`is_alive_at_succession = false`), the spouse node renders with
  gray fill and "Predeceased" label; no share amount is shown.

### AC-5: Hover Tooltip
- Hovering any active-heir node shows a tooltip with: name, relationship, net share in ₱,
  legitime_fraction, from_legitime, from_free_portion, from_intestate, legal_basis[].
- On mobile, tapping a node opens a bottom-sheet drawer with the same fields.

### AC-6: Zoom and Pan
- The `+` button increases zoom by 0.2 per click up to 2.0.
- The `−` button decreases zoom by 0.2 per click down to 0.4.
- `Fit to Screen` centers and scales the tree to fill the viewport.
- Click-drag on the canvas background pans the tree.

### AC-7: Download SVG
- Clicking `[Download SVG]` downloads a file named
  `family-tree-{decedent-name-slug}-{YYYY-MM-DD}.svg` containing the rendered tree.
- The downloaded SVG includes all nodes, edges, labels, and the color legend.

### AC-8: Escheat (Scenario I15)
- When `scenario_code === "I15"`, the tree renders all nodes as predeceased/zero-share, and
  displays the "Estate Escheated to the State (Art. 1011 NCC)" banner overlay.

### AC-9: Lazy Loading
- react-d3-tree is not loaded until the user clicks the "Family Tree" tab.
- The initial page load bundle does not increase by more than 5 KB due to this feature.
- While the tab content loads, a skeleton placeholder (`h-96 w-full`) is shown.

### AC-10: No Existing Functionality Broken
- The "Distribution" tab is the default active tab; existing `DistributionSection` renders
  identically to the pre-tab-restructure layout.
- `Export JSON`, `Copy Narratives`, and `Edit Input` actions in `ActionsBar` continue to work.
- All 7 `getResultsLayout()` variants render correctly in the Distribution tab.

---

## 10. Implementation Notes

### 10.1 react-d3-tree Configuration

```typescript
// Key props for Tree component
<Tree
  data={d3TreeData}
  orientation="vertical"
  pathFunc="step"                    // right-angle connectors (cleaner for legal diagrams)
  renderCustomNodeElement={renderTreeNode}
  zoom={currentZoom}
  translate={translate}
  scaleExtent={{ min: 0.4, max: 2.0 }}
  separation={{ siblings: 1.5, nonSiblings: 2.0 }}
  nodeSize={{ x: 160, y: 140 }}
  enableLegacyTransitions={false}
  dimensions={{ width: containerWidth, height: 600 }}
  svgClassName="family-tree-svg"
  ref={svgRef}
/>
```

### 10.2 Custom Node Renderer

```typescript
function renderTreeNode({ nodeDatum, toggleNode }: CustomNodeElementProps) {
  const data = nodeDatum._nodeData as TreeNodeData;
  const role = data.role;

  const colors: Record<NodeRole, { border: string; bg: string }> = {
    "decedent":          { border: "#1e293b", bg: "#f1f5f9" },
    "active-heir":       { border: "#16a34a", bg: "#f0fdf4" },
    "surviving-spouse":  { border: "#7c3aed", bg: "#f5f3ff" },
    "predeceased":       { border: "#94a3b8", bg: "#f8fafc" },
    "disinherited":      { border: "#dc2626", bg: "#fef2f2" },
    "unworthy":          { border: "#ea580c", bg: "#fff7ed" },
    "renounced":         { border: "#ca8a04", bg: "#fefce8" },
    "zero-share":        { border: "#cbd5e1", bg: "#f8fafc" },
    "testamentary-only": { border: "#0284c7", bg: "#f0f9ff" },
  };

  const { border, bg } = colors[role];

  return (
    <g>
      <circle r={28} fill={bg} stroke={border} strokeWidth={2.5} />
      <text y={-36} textAnchor="middle" fontSize={12} fill="#1e293b">
        {data.name.length > 14 ? data.name.slice(0, 13) + "…" : data.name}
      </text>
      {data.net_from_estate && (
        <text y={46} textAnchor="middle" fontSize={10} fill={border} fontWeight="bold">
          {formatPeso(data.net_from_estate.centavos)}
        </text>
      )}
      {role === "decedent" && (
        <text y={4} textAnchor="middle" fontSize={14} fill="#1e293b">†</text>
      )}
      {role === "predeceased" && (
        <text y={4} textAnchor="middle" fontSize={10} fill="#94a3b8">†</text>
      )}
    </g>
  );
}
```

### 10.3 Disinheritance Cause Labels

Map from `DisinheritanceCause` to display strings for tooltip:

```typescript
const DISINHERITANCE_CAUSE_LABELS: Record<DisinheritanceCause, string> = {
  ChildAttemptOnLife:          "Art. 919(1) NCC — Attempt on life of testator",
  ChildGroundlessAccusation:   "Art. 919(2) NCC — Groundless accusation of crime",
  ChildAdulteryWithSpouse:     "Art. 919(3) NCC — Adultery with spouse of testator",
  ChildFraudUndueInfluence:    "Art. 919(4) NCC — Fraud or undue influence on will",
  ChildRefusalToSupport:       "Art. 919(5) NCC — Refusal to provide support",
  ChildMaltreatment:           "Art. 919(6) NCC — Maltreatment of testator",
  ChildDishonorableLife:       "Art. 919(7) NCC — Leads a dishonorable life",
  ChildCivilInterdiction:      "Art. 919(8) NCC — Civil interdiction conviction",
  ParentAbandonmentCorruption: "Art. 920(1) NCC — Abandonment or corruption of children",
  ParentAttemptOnLife:         "Art. 920(2) NCC — Attempt on life of testator",
  ParentGroundlessAccusation:  "Art. 920(3) NCC — Groundless accusation of crime",
  ParentAdulteryWithSpouse:    "Art. 920(4) NCC — Adultery with spouse of testator",
  ParentFraudUndueInfluence:   "Art. 920(5) NCC — Fraud or undue influence on will",
  ParentLossParentalAuthority: "Art. 920(6) NCC — Loss of parental authority",
  ParentRefusalToSupport:      "Art. 920(7) NCC — Refusal to provide support",
  ParentAttemptOnOther:        "Art. 920(8) NCC — Attempt on life of other parent",
  SpouseAttemptOnLife:         "Art. 921(1) NCC — Attempt on life of testator",
  SpouseGroundlessAccusation:  "Art. 921(2) NCC — Groundless accusation of crime",
  SpouseFraudUndueInfluence:   "Art. 921(3) NCC — Fraud or undue influence on will",
  SpouseCauseLegalSeparation:  "Art. 921(4) NCC — Giving grounds for legal separation",
  SpouseLossParentalAuthority: "Art. 921(5) NCC — Loss of parental authority by court",
  SpouseRefusalToSupport:      "Art. 921(6) NCC — Refusal to provide support",
};
```
