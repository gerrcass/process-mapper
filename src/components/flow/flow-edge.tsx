"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowEdge } from "@/domain/types";
import { cn } from "@/lib/cn";

export interface AtlasEdgeData extends Record<string, unknown> {
  edge: FlowEdge;
}

export type AtlasEdge = Edge<AtlasEdgeData>;

export function AtlasFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<AtlasEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const edge = data?.edge;
  const exception = edge?.kind === "exception";
  const stroke = selected
    ? "var(--color-accent)"
    : exception
      ? "var(--color-warning)"
      : "var(--color-muted)";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          stroke,
          strokeWidth: selected ? 2.2 : 1.6,
          strokeDasharray: exception ? "6 4" : undefined,
        }}
      />
      {edge?.label ? (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan absolute rounded-full border px-1.5 py-0.5 font-mono text-[9px] leading-4 shadow-sm",
              exception
                ? "border-warning/30 bg-warning-soft text-warning-strong"
                : "border-line bg-surface text-ink-soft",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
            }}
          >
            {edge.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
