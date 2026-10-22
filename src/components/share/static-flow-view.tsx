"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ProcessMap } from "@/domain/types";
import {
  EDGE_TYPES,
  NODE_TYPES,
  hasSavedViewport,
  toFlowEdges,
  toFlowNodes,
} from "@/components/flow/flow-adapters";

/**
 * The flow as a static diagram for the shared view: the existing node and
 * edge components with no toolbar, drag, connect, delete, inspector, or
 * store access. Applies the map's saved viewport and falls back to fit-view.
 */
export function StaticFlowView({ map }: { map: ProcessMap }) {
  const nodes = toFlowNodes(map, null);
  const edges = toFlowEdges(map, null);

  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          panOnScroll
          defaultViewport={map.viewport}
          fitView={!hasSavedViewport(map) && map.nodes.length > 0}
          fitViewOptions={{ padding: 0.2, minZoom: 0.55, maxZoom: 0.95 }}
          minZoom={0.2}
          maxZoom={2}
          className="bg-paper"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--color-line)"
          />
          <Controls
            position="bottom-left"
            showInteractive={false}
            className="!bottom-4 !left-4"
            aria-label="Canvas zoom controls"
          />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
