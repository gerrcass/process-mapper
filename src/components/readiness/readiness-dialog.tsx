"use client";

import type { ProcessMap } from "@/domain/types";
import {
  evaluateReadiness,
  readinessGroupLabel,
  type ReadinessCheck,
  type ReadinessGroup,
} from "@/domain/readiness";
import { cn } from "@/lib/cn";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReadinessCheckRow, ReadinessSummary } from "./readiness-summary";

const GROUPS: ReadinessGroup[] = ["frame", "process", "flow"];

export function ReadinessDialog({
  map,
  open,
  onOpenChange,
  onNavigate,
}: {
  map: ProcessMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (check: ReadinessCheck) => void;
}) {
  const readiness = evaluateReadiness(map);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="!overflow-hidden !p-0">
        <div className="border-b border-line px-6 pb-5 pt-6">
          <p className="eyebrow">Readiness review</p>
          <DialogTitle className="mt-2">{readiness.level}</DialogTitle>
          <DialogDescription>
            A checklist for a complete, coherent process map. Use it as a guide, not a gate.
          </DialogDescription>

          <ReadinessSummary readiness={readiness} presentation="review" className="mt-5" />
        </div>

        <div className="max-h-[54dvh] overflow-y-auto">
          {GROUPS.map((group) => {
            const checks = readiness.checks.filter((check) => check.group === group);
            const passed = checks.filter((check) => check.passed).length;
            return (
              <section key={group} className="border-b border-line px-6 py-4 last:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted">
                    {readinessGroupLabel(group)}
                  </h3>
                  <span className="font-mono text-[9.5px] text-muted">
                    {passed}/{checks.length}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {checks.map((check) => (
                    <ReadinessCheckRow
                      key={check.id}
                      check={check}
                      statusIcon="badge"
                      onNavigate={onNavigate}
                      showWeight
                      className={cn("px-2 py-2", !check.passed && "bg-warning-soft/50")}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="max-w-[38ch] text-[10.5px] leading-4 text-muted">
            Readiness never blocks editing, export, or navigation. Rough maps are allowed.
          </p>
          <div>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
