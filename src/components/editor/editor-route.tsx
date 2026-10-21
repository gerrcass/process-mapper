"use client";

import { useSearchParams } from "next/navigation";
import { Editor } from "@/components/editor/editor";
import { EditorSkeleton } from "@/components/skeletons";
import { WorkspaceGate } from "@/components/workspace-gate";
import { MapNotFound } from "@/components/map-not-found";

export function EditorRoute() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get("map");

  if (!mapId) return <MapNotFound />;

  return (
    <WorkspaceGate fallback={<EditorSkeleton />}>
      <Editor mapId={mapId} />
    </WorkspaceGate>
  );
}
