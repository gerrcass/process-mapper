import { cn } from "@/lib/cn";
import { STATUS_LABELS, type MapStatus } from "@/domain/types";

const statusStyles: Record<MapStatus, string> = {
  draft: "border-line-strong bg-paper text-ink-soft",
  active: "border-success/25 bg-success-soft text-success",
  archived: "border-line bg-paper-raised text-muted",
};

const dotStyles: Record<MapStatus, string> = {
  draft: "bg-line-strong",
  active: "bg-success",
  archived: "bg-muted/60",
};

export function StatusPill({ status, className }: { status: MapStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        statusStyles[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[status])} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Chip({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[11px] leading-4",
        tone === "neutral" && "border-line bg-paper-raised text-ink-soft",
        tone === "accent" && "border-process-line bg-accent-soft text-process-text",
        tone === "success" && "border-success/20 bg-success-soft text-success",
        tone === "warning" && "border-warning/25 bg-warning-soft text-warning",
        className,
      )}
    >
      {children}
    </span>
  );
}
