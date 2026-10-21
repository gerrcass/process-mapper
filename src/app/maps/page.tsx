import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorRoute } from "@/components/editor/editor-route";
import { EditorSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Map",
};

export default function MapPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorRoute />
    </Suspense>
  );
}
