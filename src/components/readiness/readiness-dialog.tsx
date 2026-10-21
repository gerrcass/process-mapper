"use client";

import { ArrowUpRight, Check, TriangleAlert } from "lucide-react";
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
import { ReadinessRing } from "./readiness-badge";

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

          <div className="mt-5 flex items-center gap-4">
            <ReadinessRing score={readiness.score} size={54} />
            <div>
              <p className="font-display text-[48px] leading-none tracking-[-0.02em] text-ink">
                {readiness.score}
                <span className="ml-1 font-sans text-[13px] font-normal tracking-normal text-muted">
                  / 100
                </span>
              </p>
              <p className="mt-1 text-[11.5px] text-ink-soft">
                <span className="font-medium">{readiness.passed}</span> of {readiness.total} checks
                pass
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[46vh] overflow-y-auto">
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
                    <li
                      key={check.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-[8px] px-2 py-2",
                        !check.passed && "bg-warning-soft/50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          check.passed
                            ? "bg-success-soft text-success"
                            : "bg-warning/15 text-warning",
                        )}
                        aria-hidden="true"
                      >
                        {check.passed ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : (
                          <TriangleAlert className="h-2.5 w-2.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium leading-4 text-ink">
                          {check.label}
                          <span className="sr-only">
                            {check.passed ? ": passed" : ": needs work"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[10.5px] leading-4 text-muted">{check.detail}</p>
                        {!check.passed ? (
                          <button
                            type="button"
                            onClick={() => onNavigate(check)}
                            className="mt-1 inline-flex items-center gap-1 rounded-[4px] text-[10.5px] font-medium text-accent-strong transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            {check.action}
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                      <span className="mt-0.5 shrink-0 font-mono text-[9px] text-muted">
                        {check.weight}
                      </span>
                    </li>
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
