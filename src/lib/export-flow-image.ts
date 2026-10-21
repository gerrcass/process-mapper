import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { pngFileName } from "@/domain/import-export";
import type { ProcessMap } from "@/domain/types";
import { downloadBlob } from "./download";

export const FLOW_PNG_EXPORT_EVENT = "process-atlas:export-flow-png";
export const FLOW_PNG_PENDING_KEY = "process-atlas.pending-flow-png";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const binary = window.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

export async function exportFlowPng(
  map: ProcessMap,
  nodes: Node[],
  element: HTMLElement | null,
): Promise<void> {
  if (map.nodes.length === 0) {
    throw new Error("Add at least one node before exporting the flow.");
  }
  if (!element) {
    throw new Error("Open the flow view before exporting a PNG.");
  }

  const bounds = getNodesBounds(nodes);
  const contentWidth = bounds.width + 240;
  const contentHeight = bounds.height + 240;
  const width = Math.round(Math.min(4000, Math.max(1400, contentWidth)));
  const height = Math.round(
    Math.min(3200, Math.max(480, width * (contentHeight / Math.max(contentWidth, 1)))),
  );
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2, 0.06);
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    backgroundColor: "var(--color-paper)",
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });

  downloadBlob(pngFileName(map), dataUrlToBlob(dataUrl));
}
