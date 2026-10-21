"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Dialog as RadixDialog } from "radix-ui";
import { NODE_KIND_LABELS, type ProcessMap } from "@/domain/types";
import { useMediaQuery } from "@/lib/use-media-query";
import { Inspector } from "./inspector";

function FlowLoading() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper" aria-busy="true">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(var(--color-line) 0.6px, transparent 0.6px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6">
        <div className="skeleton h-10 w-28 rounded-full" />
        <div className="skeleton h-24 w-56 rounded-card" />
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>
      <span className="sr-only">Loading flow canvas</span>
    </div>
  );
}

const FlowCanvas = dynamic(() => import("./flow-canvas").then((module) => module.FlowCanvas), {
  ssr: false,
  loading: () => <FlowLoading />,
});

export function FlowView({
  map,
  focusNodeId,
  onOpenSipoc,
}: {
  map: ProcessMap;
  focusNodeId: string | null;
  onOpenSipoc: () => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    focusNodeId && map.nodes.some((node) => node.id === focusNodeId) ? focusNodeId : null,
  );
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1100px)");

  const selectNode = React.useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) setSelectedEdgeId(null);
  }, []);

  const selectEdge = React.useCallback((id: string | null) => {
    setSelectedEdgeId(id);
    if (id) setSelectedNodeId(null);
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const selectedNode = map.nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = map.edges.find((edge) => edge.id === selectedEdgeId);
  const selectionLabel = selectedNode
    ? `${NODE_KIND_LABELS[selectedNode.kind]}: ${selectedNode.title}`
    : selectedEdge
      ? `Flow edge${selectedEdge.label ? `: ${selectedEdge.label}` : ""}`
      : "";

  const inspector = (
    <Inspector
      map={map}
      node={selectedNode}
      edge={selectedEdge}
      onClose={clearSelection}
      onSelectNode={selectNode}
      onOpenSipoc={onOpenSipoc}
    />
  );

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="relative min-w-0 flex-1">
        <FlowCanvas
          map={map}
          focusNodeId={focusNodeId}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectNode={selectNode}
          onSelectEdge={selectEdge}
        />

        <p className="sr-only" role="status" aria-live="polite">
          {selectionLabel ? `${selectionLabel} selected.` : ""}
        </p>
      </div>

      {selectionLabel && isDesktop ? (
        <aside
          aria-label="Flow inspector"
          className="flex w-[320px] shrink-0 flex-col border-l border-line bg-paper-raised"
        >
          {inspector}
        </aside>
      ) : null}

      {selectionLabel && !isDesktop ? (
        <RadixDialog.Root
          open
          onOpenChange={(open) => {
            if (!open) clearSelection();
          }}
        >
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-30 bg-ink/25" />
            <RadixDialog.Content
              aria-label="Flow inspector"
              className="fixed inset-y-0 right-0 z-40 flex w-[min(92vw,360px)] flex-col border-l border-line bg-paper-raised shadow-lift focus:outline-none"
            >
              <RadixDialog.Title className="sr-only">Flow inspector</RadixDialog.Title>
              <RadixDialog.Description className="sr-only">
                Edit the selected node or edge, or close the inspector to return to the canvas.
              </RadixDialog.Description>
              {inspector}
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      ) : null}
    </div>
  );
}
