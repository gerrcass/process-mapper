"use client";

import * as React from "react";
import { FolderOpen } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { MapCard } from "./map-card";

export function Dashboard() {
  const maps = useWorkspace((state) => state.maps);
  const sorted = React.useMemo(
    () =>
      [...maps].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [maps],
  );

  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-20 pt-10 sm:pt-14">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Workspace</p>
        <h1 className="max-w-[720px] font-display text-[52px] leading-[0.98] tracking-[-0.02em] text-ink sm:text-[64px]">
          Frame the process.
          <br />
          Map the flow.
        </h1>
        <p className="max-w-[620px] text-[14px] leading-6 text-ink-soft">
          One workspace for the SIPOC summary and the flow behind it. Everything stays in this
          browser.
        </p>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[26px] leading-none text-ink">Process maps</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            {sorted.length} {sorted.length === 1 ? "map" : "maps"}
          </span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line-strong bg-paper-raised p-10 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-line-strong" aria-hidden="true" />
          <h3 className="mt-3 font-display text-[26px] text-ink">This workspace is empty</h3>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-5 text-muted">
            Create a map from a template or restore the two seeded maps to get the demo back.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {sorted.map((map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>
      )}

      <p className="mt-10 max-w-[64ch] text-[11.5px] leading-5 text-muted">
        Seeded maps are local demo content. Edits autosave to this browser and can be exported as
        JSON from any map.
      </p>
    </main>
  );
}
