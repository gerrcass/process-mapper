import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import type { ProcessMap } from "@/domain/types";
import { mapStats } from "@/domain/operations";
import { formatRelativeTime } from "@/lib/time";
import { StatusPill } from "@/components/ui/pill";

function LaneMotif({ map }: { map: ProcessMap }) {
  const stats = mapStats(map);
  const lanes = [
    { key: "suppliers", count: stats.suppliers, tint: "bg-suppliers-tint" },
    { key: "inputs", count: stats.inputs, tint: "bg-inputs-tint" },
    { key: "process", count: stats.steps, tint: "bg-process-tint" },
    { key: "outputs", count: stats.outputs, tint: "bg-outputs-tint" },
    { key: "customers", count: stats.customers, tint: "bg-customers-tint" },
  ];
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {lanes.map((lane) => (
        <div
          key={lane.key}
          className={`relative h-full flex-1 overflow-hidden rounded-[4px] ${lane.tint}`}
        >
          {Array.from({ length: Math.min(Math.max(lane.count, 1), 4) }).map((_, index) => (
            <span
              key={index}
              className="absolute left-1 right-1 h-[3px] rounded-full bg-ink/15"
              style={{ top: `${9 + index * 9}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MapCard({ map }: { map: ProcessMap }) {
  const stats = mapStats(map);
  return (
    <article className="group relative flex flex-col rounded-card border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-lift focus-within:-translate-y-0.5 focus-within:shadow-lift">
      <Link
        href={`/maps/${map.id}`}
        className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Open ${map.title}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusPill status={map.status} />
          {map.origin === "demo" ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              Seeded
            </span>
          ) : null}
        </div>
        <GitBranch
          className="h-4 w-4 text-line-strong transition-colors group-hover:text-accent"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-4 font-display text-[30px] leading-[1.08] tracking-[-0.01em] text-ink">
        {map.title}
      </h2>
      <p className="mt-2 line-clamp-2 max-w-[52ch] text-[13px] leading-5 text-ink-soft">
        {map.description || "No description yet. Open the map to add a purpose statement."}
      </p>

      <div className="mt-5">
        <LaneMotif map={map} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[11.5px] text-muted">
        <span>
          <span className="font-medium text-ink-soft">{stats.steps}</span> steps
        </span>
        <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
        <span>
          <span className="font-medium text-ink-soft">{stats.entries}</span> entries
        </span>
        <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
        <span>Updated {formatRelativeTime(map.updatedAt)}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-ink opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          Open map
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
