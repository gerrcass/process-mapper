import { MarkerType, type EdgeTypes, type NodeTypes } from "@xyflow/react";
import { NODE_KIND_LABELS, type ProcessMap } from "@/domain/types";
import { processSteps } from "@/domain/operations";
import { AtlasNodeCard, type AtlasNode, type AtlasNodeData } from "./flow-nodes";
import { AtlasFlowEdge, type AtlasEdge, type AtlasEdgeData } from "./flow-edge";

export type { AtlasNode, AtlasEdge };

export const NODE_TYPES = {
  start: AtlasNodeCard,
  step: AtlasNodeCard,
  decision: AtlasNodeCard,
  end: AtlasNodeCard,
} satisfies NodeTypes;

export const EDGE_TYPES = { atlas: AtlasFlowEdge } satisfies EdgeTypes;

export function toFlowNodes(map: ProcessMap, selectedNodeId: string | null): AtlasNode[] {
  const indexes = new Map(processSteps(map).map((step, index) => [step.id, index + 1]));
  return map.nodes.map((node) => ({
    id: node.id,
    type: node.kind,
    position: { ...node.position },
    selected: node.id === selectedNodeId,
    data: { node, stepIndex: indexes.get(node.id) ?? 1 } satisfies AtlasNodeData,
    ariaLabel: `${NODE_KIND_LABELS[node.kind]} ${node.title}`,
  }));
}

export function toFlowEdges(map: ProcessMap, selectedEdgeId: string | null): AtlasEdge[] {
  return map.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: "atlas",
    selected: edge.id === selectedEdgeId,
    data: { edge } satisfies AtlasEdgeData,
    ariaLabel: edge.label ? `Flow edge ${edge.label}` : "Flow edge",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: edge.kind === "exception" ? "var(--color-warning)" : "var(--color-muted)",
    },
  }));
}
