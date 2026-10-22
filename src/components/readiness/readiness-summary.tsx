"use client";

import { ArrowUpRight, Check, TriangleAlert } from "lucide-react";
import type { Readiness, ReadinessCheck } from "@/domain/readiness";
import { cn } from "@/lib/cn";
import { ReadinessRing } from "./readiness-badge";

/**
 * The readiness summary shared by the readiness review dialog and the
 * read-only shared view (issue #12: the shared view reuses the existing
 * readiness surface instead of drifting). The score ring, the "N of M checks
 * pass" line, and the check rows live here; each consumer keeps its own
 * layout and accessible names around them.
 */
export function ReadinessSummary({
  readiness,
  presentation,
  headingId,
  showFailedChecks = false,
  className,
}: {
  readiness: Readiness;
  /** "review" is the dialog header; "shared" is the read-only snapshot block. */
  presentation: "review" | "shared";
  /** Heading id for the shared presentation, referenced by aria-labelledby. */
  headingId?: string;
  /** Also renders the failed checks (shared view), with an all-pass note. */
  showFailedChecks?: boolean;
  className?: string;
}) {
  return (
    <>
      <div className={cn("flex items-center gap-4", className)}>
        <ReadinessRing score={readiness.score} size={presentation === "review" ? 54 : 44} />
        {presentation === "review" ? (
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
        ) : (
          <div>
            <h2 id={headingId} className="text-[13px] font-semibold text-ink">
              Readiness
            </h2>
            <p className="mt-0.5 text-[15px] font-medium leading-5 text-ink">{readiness.level}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {readiness.score} of 100 · {readiness.passed} of {readiness.total} checks pass
            </p>
          </div>
        )}
      </div>
      {showFailedChecks ? (
        <ReadinessCheckList failedChecks={readiness.checks.filter((check) => !check.passed)} />
      ) : null}
    </>
  );
}

/** The failed checks with their details, or a short all-pass note. */
function ReadinessCheckList({ failedChecks }: { failedChecks: ReadinessCheck[] }) {
  if (failedChecks.length === 0) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-success">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        All checks pass.
      </p>
    );
  }
  return (
    <ul className="mt-4 space-y-2">
      {failedChecks.map((check) => (
        <ReadinessCheckRow key={check.id} check={check} className="bg-warning-soft/50 px-3 py-2" />
      ))}
    </ul>
  );
}

/**
 * One readiness check row: status icon, label with a screen-reader status,
 * and the detail for failed checks. The dialog adds the fix action and the
 * weight; the shared view lists only failed checks without either.
 */
export function ReadinessCheckRow({
  check,
  statusIcon = "plain",
  onNavigate,
  showWeight = false,
  className,
}: {
  check: ReadinessCheck;
  /** "badge" is the dialog's circled icon; "plain" is the bare warning icon. */
  statusIcon?: "badge" | "plain";
  onNavigate?: (check: ReadinessCheck) => void;
  showWeight?: boolean;
  className?: string;
}) {
  return (
    <li className={cn("flex items-start gap-2.5 rounded-[8px]", className)}>
      {statusIcon === "badge" ? (
        <span
          className={cn(
            "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
            check.passed ? "bg-success-soft text-success" : "bg-warning/15 text-warning",
          )}
          aria-hidden="true"
        >
          {check.passed ? (
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          ) : (
            <TriangleAlert className="h-2.5 w-2.5" />
          )}
        </span>
      ) : (
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-4 text-ink">
          {check.label}
          <span className="sr-only">{check.passed ? ": passed" : ": needs work"}</span>
        </p>
        {!check.passed ? (
          <p className="mt-0.5 text-[10.5px] leading-4 text-muted">{check.detail}</p>
        ) : null}
        {!check.passed && onNavigate ? (
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
      {showWeight ? (
        <span className="mt-0.5 shrink-0 font-mono text-[9px] text-muted">{check.weight}</span>
      ) : null}
    </li>
  );
}
