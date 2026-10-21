"use client";

import { GripVertical, Trash2 } from "lucide-react";
import type { SipocEntry } from "@/domain/types";
import { cn } from "@/lib/cn";
import { InlineField } from "./inline-field";
import type { LaneStyle } from "./lane-styles";
import type { SortableHandleProps } from "./sortable-row";

export function EntryCard({
  entry,
  index,
  laneName,
  laneStyle,
  readOnly,
  onCommitLabel,
  onCommitDetail,
  onDelete,
  onRejectLabel,
  handleProps,
}: {
  entry: SipocEntry;
  index: number;
  laneName: string;
  laneStyle: LaneStyle;
  readOnly: boolean;
  onCommitLabel: (value: string) => void;
  onCommitDetail: (value: string) => void;
  onDelete: () => void;
  onRejectLabel: () => void;
  handleProps: SortableHandleProps["handleProps"];
}) {
  if (readOnly) {
    return (
      <article className="relative rounded-[10px] border border-line bg-surface py-2 pl-3 pr-2.5 shadow-card">
        <span
          className={cn("absolute bottom-2 left-0 top-2 w-[6px] rounded-r", laneStyle.accentBar)}
          aria-hidden="true"
        />
        <p className="text-[13.5px] font-medium leading-5 text-ink">{entry.label}</p>
        {entry.detail ? (
          <p className="mt-0.5 text-[12px] leading-4 text-muted">{entry.detail}</p>
        ) : null}
      </article>
    );
  }

  return (
    <article className="group relative rounded-[10px] border border-line bg-surface py-1.5 pl-2 pr-1.5 shadow-card transition-shadow duration-150 hover:shadow-soft focus-within:shadow-soft">
      <span
        className={cn("absolute bottom-2 left-0 top-2 w-[6px] rounded-r", laneStyle.accentBar)}
        aria-hidden="true"
      />
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          {...handleProps}
          aria-label={`Reorder ${laneName.toLowerCase()} entry ${index + 1}: ${entry.label}`}
          className="mt-0.5 inline-flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] text-line-strong opacity-0 transition-opacity hover:text-muted focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent group-focus-within:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <InlineField
            value={entry.label}
            onCommit={onCommitLabel}
            onReject={onRejectLabel}
            ariaLabel={`${laneName} entry ${index + 1} label`}
            placeholder="Label"
            required
            wrap
            inputClassName="text-[13.5px] font-medium leading-5 text-ink"
          />
          <InlineField
            value={entry.detail}
            onCommit={onCommitDetail}
            ariaLabel={`${laneName} entry ${index + 1} detail`}
            placeholder="Add a detail"
            wrap
            inputClassName="text-[12px] leading-4 text-muted"
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${entry.label}`}
          className="mt-0.5 inline-flex h-7 w-6 shrink-0 items-center justify-center rounded-[4px] text-muted opacity-0 transition-opacity hover:bg-accent-soft hover:text-accent-strong focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent group-focus-within:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
