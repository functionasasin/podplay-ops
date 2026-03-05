/**
 * TreeNode — Custom node renderer for Family Tree Visualizer (§4.19)
 * Renders each person as a styled card with role-based colors.
 */
import type { TreeNodeData } from './tree-utils';
import { NODE_ROLE_COLORS } from './tree-utils';

export interface TreeNodeRendererProps {
  nodeDatum: TreeNodeData;
}

/**
 * Custom tree node component for react-d3-tree renderCustomNodeElement.
 */
export function TreeNodeRenderer({ nodeDatum }: TreeNodeRendererProps) {
  const colors = NODE_ROLE_COLORS[nodeDatum.role];
  const label = colors.label || nodeDatum.shareAmount || '';

  return (
    <g data-testid={`tree-node-${nodeDatum.personId}`}>
      <foreignObject width={160} height={80} x={-80} y={-40}>
        <div
          className={`border-2 rounded-lg p-2 text-center ${colors.border} ${colors.background}`}
          style={{ width: 160, height: 80 }}
        >
          <div className="font-semibold text-sm truncate">{nodeDatum.name}</div>
          {label && <div className="text-xs text-muted-foreground mt-1">{label}</div>}
          {nodeDatum.role === 'decedent' && (
            <div className="text-lg">†</div>
          )}
          {(nodeDatum.role === 'active-heir' || nodeDatum.role === 'surviving-spouse') && nodeDatum.shareAmount && (
            <div className="text-xs font-medium mt-0.5">{nodeDatum.shareAmount}</div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
