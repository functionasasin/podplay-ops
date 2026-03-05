/**
 * tree-utils.ts — Data transformation utilities for Family Tree Visualizer (§4.19)
 * Transforms EngineInput/EngineOutput into react-d3-tree compatible data.
 */
import type { EngineInput, EngineOutput, Person, InheritanceShare, DisinheritanceCause } from '../../../types';

// ============================================================================
// Types
// ============================================================================

export type NodeRole =
  | 'decedent'
  | 'active-heir'
  | 'surviving-spouse'
  | 'predeceased'
  | 'disinherited'
  | 'unworthy'
  | 'renounced'
  | 'zero-share'
  | 'testamentary-only';

export interface TreeNodeData {
  name: string;
  attributes?: Record<string, string>;
  role: NodeRole;
  shareAmount?: string;
  personId: string;
  children?: TreeNodeData[];
}

export interface EdgeType {
  type: 'parent-child' | 'marriage' | 'representation';
}

export interface NodeRoleColors {
  border: string;
  background: string;
  label: string;
}

// ============================================================================
// Node role color mapping (from spec §4.19)
// ============================================================================

export const NODE_ROLE_COLORS: Record<NodeRole, NodeRoleColors> = {
  'decedent': { border: 'border-slate-800', background: 'bg-slate-100', label: '†' },
  'active-heir': { border: 'border-green-600', background: 'bg-green-50', label: '' },
  'surviving-spouse': { border: 'border-violet-600', background: 'bg-violet-50', label: '' },
  'predeceased': { border: 'border-slate-400', background: 'bg-slate-50', label: 'Predeceased' },
  'disinherited': { border: 'border-red-600', background: 'bg-red-50', label: 'Disinherited' },
  'unworthy': { border: 'border-orange-600', background: 'bg-orange-50', label: 'Unworthy' },
  'renounced': { border: 'border-yellow-600', background: 'bg-yellow-50', label: 'Renounced' },
  'zero-share': { border: 'border-slate-300', background: 'bg-slate-50', label: 'Excluded' },
  'testamentary-only': { border: 'border-sky-600', background: 'bg-sky-50', label: 'Legatee' },
};

// ============================================================================
// Disinheritance cause labels (24 entries: Art. 919, 920, 921)
// ============================================================================

export const DISINHERITANCE_CAUSE_LABELS: Record<DisinheritanceCause, string> = {
  ChildAttemptOnLife: 'Attempted against the life of the testator (Art. 919(1))',
  ChildGroundlessAccusation: 'Accused the testator of a crime punishable by imprisonment (Art. 919(2))',
  ChildAdulteryWithSpouse: 'Committed adultery/concubinage with the testator\'s spouse (Art. 919(3))',
  ChildFraudUndueInfluence: 'By fraud, violence, intimidation, or undue influence caused the testator to make or change a will (Art. 919(4))',
  ChildRefusalToSupport: 'Unjustified refusal to give support to the testator (Art. 919(5))',
  ChildMaltreatment: 'Maltreatment of the testator by word or deed (Art. 919(6))',
  ChildDishonorableLife: 'Leading a dishonorable or disgraceful life (Art. 919(7))',
  ChildCivilInterdiction: 'Conviction of a crime carrying civil interdiction (Art. 919(8))',
  ParentAbandonmentCorruption: 'Abandoned or corrupted/prostituted children (Art. 920(1))',
  ParentAttemptOnLife: 'Attempted against the life of the testator (Art. 920(2))',
  ParentGroundlessAccusation: 'Accused the testator of a crime punishable by imprisonment (Art. 920(3))',
  ParentAdulteryWithSpouse: 'Committed adultery/concubinage with the testator\'s spouse (Art. 920(4))',
  ParentFraudUndueInfluence: 'By fraud, violence, intimidation, or undue influence caused the testator to make or change a will (Art. 920(5))',
  ParentLossParentalAuthority: 'Loss of parental authority for causes in Art. 231 (Art. 920(6))',
  ParentRefusalToSupport: 'Unjustified refusal to give support to children (Art. 920(7))',
  ParentAttemptOnOther: 'Attempt by one parent against the life of the other (Art. 920(8))',
  SpouseAttemptOnLife: 'Attempted against the life of the testator (Art. 921(1))',
  SpouseGroundlessAccusation: 'Failure to report the attempt made on the life of the testator within one month (Art. 921(2))',
  SpouseFraudUndueInfluence: 'By fraud, violence, intimidation, or undue influence caused the testator to make or change a will (Art. 921(3))',
  SpouseCauseLegalSeparation: 'Gave cause for legal separation (Art. 921(4))',
  SpouseLossParentalAuthority: 'Gave cause for the loss of parental authority (Art. 921(5))',
  SpouseRefusalToSupport: 'Unjustified refusal to give support to the testator (Art. 921(6))',
};

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Determine the role of a person in the family tree.
 */
export function getNodeRole(
  person: Person,
  shares: InheritanceShare[],
  disinheritedIds: Set<string>,
): NodeRole {
  // Check if person is the decedent (not in family_tree normally, but handle it)
  // Decedent is handled separately in buildTreeData

  if (disinheritedIds.has(person.id)) return 'disinherited';
  if (person.is_unworthy && !person.unworthiness_condoned) return 'unworthy';
  if (person.has_renounced) return 'renounced';
  if (!person.is_alive_at_succession) return 'predeceased';

  if (person.relationship_to_decedent === 'SurvivingSpouse') {
    const share = shares.find(s => s.heir_id === person.id);
    if (share) return 'surviving-spouse';
    return 'zero-share';
  }

  const share = shares.find(s => s.heir_id === person.id);
  if (!share) {
    // Check if testamentary-only (legatee/devisee not in family tree)
    return 'zero-share';
  }

  const totalCentavos = typeof share.total.centavos === 'string'
    ? parseInt(share.total.centavos, 10)
    : share.total.centavos;

  if (totalCentavos === 0) return 'zero-share';
  return 'active-heir';
}

/**
 * Build the tree data structure for react-d3-tree from EngineInput/EngineOutput.
 */
export function buildTreeData(
  input: EngineInput,
  output: EngineOutput,
): TreeNodeData {
  const { decedent, family_tree, will } = input;
  const { per_heir_shares } = output;

  // Collect disinherited person IDs
  const disinheritedIds = new Set<string>();
  if (will) {
    for (const d of will.disinheritances) {
      if (d.heir_reference.person_id) {
        disinheritedIds.add(d.heir_reference.person_id);
      }
    }
  }

  // Build person lookup
  const personMap = new Map<string, Person>();
  for (const p of family_tree) {
    personMap.set(p.id, p);
  }

  // Build share lookup
  const shareMap = new Map<string, InheritanceShare>();
  for (const s of per_heir_shares) {
    shareMap.set(s.heir_id, s);
  }

  // Helper: build child subtree
  function buildSubtree(personId: string): TreeNodeData | null {
    const person = personMap.get(personId);
    if (!person) return null;

    const role = getNodeRole(person, per_heir_shares, disinheritedIds);
    const share = shareMap.get(person.id);
    const shareAmount = share ? formatShareAmount(share.total.centavos) : undefined;

    const children: TreeNodeData[] = [];
    if (person.children.length > 0) {
      for (const childId of person.children) {
        const childNode = buildSubtree(childId);
        if (childNode) children.push(childNode);
      }
    }

    return {
      name: person.name,
      role,
      shareAmount: (role === 'active-heir' || role === 'surviving-spouse') ? shareAmount : undefined,
      personId: person.id,
      children: children.length > 0 ? children : undefined,
    };
  }

  // Find direct children of decedent (persons whose parent is not in tree OR top-level)
  const childOfDecedent = family_tree.filter(
    p => p.relationship_to_decedent !== 'SurvivingSpouse'
      && p.relationship_to_decedent !== 'LegitimateParent'
      && p.relationship_to_decedent !== 'LegitimateAscendant'
      && !family_tree.some(other => other.children.includes(p.id))
  );

  const decedentChildren: TreeNodeData[] = [];
  for (const child of childOfDecedent) {
    const node = buildSubtree(child.id);
    if (node) decedentChildren.push(node);
  }

  // Build the decedent root node
  const rootNode: TreeNodeData = {
    name: decedent.name,
    role: 'decedent',
    personId: decedent.id,
    children: decedentChildren.length > 0 ? decedentChildren : undefined,
  };

  return rootNode;
}

/**
 * Format share amount for display in tree node.
 */
export function formatShareAmount(centavos: number | string): string {
  const c = typeof centavos === 'string' ? BigInt(centavos) : BigInt(centavos);
  const pesos = c / 100n;
  const cents = c % 100n;
  const pesosStr = pesos.toLocaleString('en-US');
  if (cents === 0n) return `₱${pesosStr}`;
  return `₱${pesosStr}.${cents.toString().padStart(2, '0')}`;
}

/**
 * Find the surviving spouse from family_tree.
 */
export function findSpouse(familyTree: Person[]): Person | null {
  return familyTree.find(p => p.relationship_to_decedent === 'SurvivingSpouse') ?? null;
}

/**
 * Get SVG string from a tree container element.
 */
export function getSVGStringFromElement(container: HTMLElement | null): string | null {
  if (!container) return null;
  const svg = container.querySelector('svg');
  if (!svg) return null;
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}
