"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Editor } from "@/components/editor/editor";
import { EditorSkeleton } from "@/components/skeletons";
import { WorkspaceGate } from "@/components/workspace-gate";
import { SharedMapView } from "@/components/share/shared-map-view";
import { sharePayloadFromHash } from "@/domain/share-link";

/**
 * One static route serves both surfaces. The `?map=` query selects the local
 * editor; the `#shared=` fragment selects the read-only shared view. The
 * fragment is read after mount, so the first client render matches the
 * server render exactly like the workspace gate.
 */
export function EditorRoute() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get("map");
  const [fragmentRead, setFragmentRead] = React.useState(false);
  const [sharedPayload, setSharedPayload] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Read the fragment after mount so the first client render matches the
    // server render (the stable skeleton), exactly like the workspace gate.
    // Re-read on hash navigation, which does not reload the document.
    let cancelled = false;
    const readFragment = () => {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setSharedPayload(sharePayloadFromHash(window.location.hash));
        setFragmentRead(true);
      });
    };
    readFragment();
    window.addEventListener("hashchange", readFragment);
    window.addEventListener("popstate", readFragment);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", readFragment);
      window.removeEventListener("popstate", readFragment);
    };
  }, []);

  if (!fragmentRead) return <EditorSkeleton />;

  if (mapId) {
    return (
      <WorkspaceGate fallback={<EditorSkeleton />}>
        <Editor mapId={mapId} />
      </WorkspaceGate>
    );
  }

  if (sharedPayload !== null) {
    return <SharedMapView key={sharedPayload} payload={sharedPayload} />;
  }

  // A link with no map payload at all: either the `#shared=` marker carried
  // nothing, or the fragment was lost in transit. Explain rather than claim
  // the workspace is missing a map.
  return <SharedMapView key="" payload="" />;
}
