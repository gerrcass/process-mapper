"use client";

import { useParams } from "next/navigation";
import { Editor } from "@/components/editor/editor";
import { EditorSkeleton } from "@/components/skeletons";
import { WorkspaceGate } from "@/components/workspace-gate";
import { MapNotFound } from "@/components/map-not-found";

export function EditorRoute() {
  const params = useParams<{ id: string | string[] }>();
  const mapId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!mapId) return <MapNotFound />;

  return (
    <WorkspaceGate fallback={<EditorSkeleton />}>
      <Editor mapId={mapId} />
    </WorkspaceGate>
  );
}
