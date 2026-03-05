/**
 * FamilyTreeTab — Lazy-loaded Family Tree Visualizer (§4.19)
 * Uses react-d3-tree for SVG tree rendering.
 * Exposes getSVGString() via useImperativeHandle for PDF embedding.
 */
import { forwardRef, useImperativeHandle, useRef, useCallback, useState } from 'react';
import Tree from 'react-d3-tree';
import type { EngineInput, EngineOutput } from '../../../types';
import { buildTreeData, getSVGStringFromElement } from './tree-utils';
import type { TreeNodeData } from './tree-utils';
import { TreeNodeRenderer } from './TreeNode';

export interface FamilyTreeTabProps {
  input: EngineInput;
  output: EngineOutput;
}

export interface FamilyTreeTabHandle {
  getSVGString: () => string | null;
}

export const FamilyTreeTab = forwardRef<FamilyTreeTabHandle, FamilyTreeTabProps>(
  function FamilyTreeTab({ input, output }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);

    useImperativeHandle(ref, () => ({
      getSVGString: () => getSVGStringFromElement(containerRef.current),
    }));

    const treeData = buildTreeData(input, output);

    const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.2, 3)), []);
    const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.2, 0.2)), []);
    const handleFitToScreen = useCallback(() => setZoom(1), []);

    const handleDownloadSVG = useCallback(() => {
      const svgString = getSVGStringFromElement(containerRef.current);
      if (!svgString) return;
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-tree-${input.decedent.name.toLowerCase().replace(/\s+/g, '-')}-${input.decedent.date_of_death}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }, [input.decedent.name, input.decedent.date_of_death]);

    return (
      <div data-testid="family-tree-tab" className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2" data-testid="tree-controls">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 border rounded text-sm"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 border rounded text-sm"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleFitToScreen}
            className="px-3 py-1 border rounded text-sm"
            aria-label="Fit to screen"
          >
            Fit to Screen
          </button>
          <button
            onClick={handleDownloadSVG}
            className="px-3 py-1 border rounded text-sm"
            aria-label="Download SVG"
          >
            Download SVG
          </button>
        </div>

        {/* Tree */}
        <div
          ref={containerRef}
          className="w-full border rounded-lg overflow-hidden"
          style={{ height: 500 }}
          data-testid="tree-container"
        >
          <Tree
            data={treeData as any}
            orientation="vertical"
            zoom={zoom}
            translate={{ x: 400, y: 50 }}
            nodeSize={{ x: 200, y: 120 }}
            renderCustomNodeElement={(rd3tProps) => (
              <TreeNodeRenderer nodeDatum={rd3tProps.nodeDatum as unknown as TreeNodeData} />
            )}
            pathClassFunc={() => 'stroke-slate-400'}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground" data-testid="tree-legend">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-green-600 bg-green-50 rounded-sm inline-block" />
            Active heir
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-slate-400 bg-slate-50 rounded-sm inline-block" />
            Predeceased
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-red-600 bg-red-50 rounded-sm inline-block" />
            Disinherited
          </span>
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">→</span>
            By representation
          </span>
        </div>
      </div>
    );
  }
);
