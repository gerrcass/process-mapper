"use client";

import * as React from "react";
import {
  ChevronDown,
  GripVertical,
  Monitor,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Workflow,
} from "lucide-react";
import type { FlowNode } from "@/domain/types";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui/pill";
import { Tooltip } from "@/components/ui/tooltip";
import { InlineField } from "./inline-field";
import type { SortableHandleProps } from "./sortable-row";

type StepField = "title" | "description" | "owner" | "system" | "duration";

export function StepCard({
  step,
  index,
  readOnly,
  onCommit,
  onDelete,
  onOpenFlow,
  onRejectTitle,
  handleProps,
}: {
  step: FlowNode;
  index: number;
  readOnly: boolean;
  onCommit: (field: StepField, value: string) => void;
  onDelete: () => void;
  onOpenFlow: () => void;
  onRejectTitle: () => void;
  handleProps: SortableHandleProps["handleProps"];
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const panelId = `step-details-${step.id}`;

  if (readOnly) {
    return (
      <article className="relative rounded-[10px] border border-process-line bg-surface py-2.5 pl-3 pr-3 shadow-card">
        <span
          className="absolute bottom-2 left-0 top-2 w-[6px] rounded-r bg-accent"
          aria-hidden="true"
        />
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] tracking-[0.08em] text-process-text">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-[13.5px] font-medium leading-5 text-ink">{step.title}</p>
        </div>
        {(step.owner || step.system) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {step.owner ? <Chip>{step.owner}</Chip> : null}
            {step.system ? <Chip>{step.system}</Chip> : null}
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="group relative rounded-[10px] border border-process-line bg-surface py-2 pl-2 pr-1.5 shadow-card transition-shadow duration-150 hover:shadow-soft focus-within:shadow-soft">
      <span
        className="absolute bottom-2 left-0 top-2 w-[6px] rounded-r bg-accent"
        aria-hidden="true"
      />
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          {...handleProps}
          aria-label={`Reorder step ${index + 1}: ${step.title}`}
          className="mt-0.5 inline-flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] text-process-line opacity-0 transition-opacity hover:text-process-text focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent group-focus-within:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-process-tint px-1 font-mono text-[10px] tracking-[0.04em] text-process-text">
              {String(index + 1).padStart(2, "0")}
            </span>
            <InlineField
              value={step.title}
              onCommit={(value) => onCommit("title", value)}
              onReject={onRejectTitle}
              ariaLabel={`Step ${index + 1} title`}
              required
              wrap
              inputClassName="text-[13.5px] font-medium leading-5 text-ink"
            />
            <Tooltip label="Open this node in the flow">
              <button
                type="button"
                onClick={onOpenFlow}
                aria-label={`Open ${step.title} in flow`}
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-muted transition-colors hover:bg-process-tint hover:text-process-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>

          {step.description && !detailsOpen ? (
            <p className="mt-1 line-clamp-2 pl-7 text-[11.5px] leading-4 text-muted">
              {step.description}
            </p>
          ) : null}

          {(step.owner || step.system) && !detailsOpen ? (
            <div className="mt-2 flex flex-wrap gap-1 pl-7">
              {step.owner ? (
                <Chip>
                  <UserRound className="h-2.5 w-2.5" aria-hidden="true" />
                  {step.owner}
                </Chip>
              ) : null}
              {step.system ? (
                <Chip>
                  <Monitor className="h-2.5 w-2.5" aria-hidden="true" />
                  {step.system}
                </Chip>
              ) : null}
            </div>
          ) : null}

          <div className="mt-1.5 flex items-center justify-between pl-7">
            <button
              type="button"
              onClick={() => setDetailsOpen((open) => !open)}
              aria-expanded={detailsOpen}
              aria-controls={panelId}
              className="inline-flex items-center gap-1 rounded-[4px] text-[10.5px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
              {detailsOpen ? "Hide details" : "Details"}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-150",
                  detailsOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          </div>

          {detailsOpen ? (
            <div id={panelId} className="mt-2 space-y-1.5 border-t border-line pt-2">
              <InlineField
                value={step.owner}
                onCommit={(value) => onCommit("owner", value)}
                ariaLabel={`Step ${index + 1} owner`}
                placeholder="Owner"
                inputClassName="text-[12px] text-ink-soft"
              />
              <InlineField
                value={step.system}
                onCommit={(value) => onCommit("system", value)}
                ariaLabel={`Step ${index + 1} system`}
                placeholder="System"
                inputClassName="text-[12px] text-ink-soft"
              />
              <InlineField
                value={step.duration}
                onCommit={(value) => onCommit("duration", value)}
                ariaLabel={`Step ${index + 1} duration`}
                placeholder="Duration"
                inputClassName="text-[12px] text-ink-soft"
              />
              <InlineField
                value={step.description}
                onCommit={(value) => onCommit("description", value)}
                ariaLabel={`Step ${index + 1} description`}
                placeholder="What happens in this step"
                multiline
                rows={2}
                inputClassName="text-[12px] leading-4 text-ink-soft"
              />
              <button
                type="button"
                onClick={onDelete}
                className="mt-1 inline-flex items-center gap-1 rounded-[4px] px-1 py-0.5 text-[11px] font-medium text-accent-strong transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Delete step
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
