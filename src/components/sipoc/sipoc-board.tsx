"use client";

import { LANE_ORDER, type ProcessMap, type SipocLane } from "@/domain/types";
import { mapStats, processSteps } from "@/domain/operations";
import { formatLongDate, formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/cn";
import { Lane } from "./lane";

export function SipocBoard({
  map,
  readOnly = false,
  onOpenFlow,
  className,
}: {
  map: ProcessMap;
  readOnly?: boolean;
  onOpenFlow?: (nodeId: string) => void;
  className?: string;
}) {
  const steps = processSteps(map);
  const stats = mapStats(map);
  const lanes: SipocLane[] = LANE_ORDER;

  return (
    <div className={cn("print-sheet", className)}>
      <div className="print-only mb-5 border-b border-line pb-3">
        <p className="eyebrow">SIPOC sheet</p>
        <h1 className="mt-1 font-display text-[36px] leading-[1.05] text-ink">{map.title}</h1>
        {map.description ? (
          <p className="mt-1.5 max-w-[80ch] text-[13px] leading-5 text-ink-soft">
            {map.description}
          </p>
        ) : null}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          Updated {formatLongDate(map.updatedAt)} · {stats.steps} process steps · {stats.entries}{" "}
          SIPOC entries
        </p>
      </div>

      <div className="no-print mb-3.5 flex flex-wrap items-end justify-between gap-2">
        <p className="text-[12px] text-muted">
          <span className="font-medium text-ink-soft">{stats.entries}</span> SIPOC entries across
          four lanes
          <span className="mx-2 text-line-strong" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-ink-soft">{stats.steps}</span> process steps
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          Updated {formatRelativeTime(map.updatedAt)}
        </p>
      </div>

      <div className="lane-scroll overflow-x-auto pb-2">
        <div className="lane-grid grid min-w-[1140px] grid-cols-5 gap-2.5">
          {lanes.map((lane) =>
            lane === "process" ? (
              <Lane
                key={lane}
                mapId={map.id}
                lane={lane}
                steps={steps}
                readOnly={readOnly}
                onOpenFlow={onOpenFlow ?? (() => undefined)}
              />
            ) : (
              <Lane
                key={lane}
                mapId={map.id}
                lane={lane}
                entries={map.sipoc[lane]}
                readOnly={readOnly}
                onOpenFlow={onOpenFlow ?? (() => undefined)}
              />
            ),
          )}
        </div>
      </div>

      <p className="no-print mt-3 flex items-start gap-1.5 text-[11px] leading-4 text-muted">
        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        The Process lane is generated from step nodes in the flow. Reordering it changes SIPOC
        order, not canvas position.
      </p>
    </div>
  );
}
