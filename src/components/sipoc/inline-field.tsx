"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function InlineField({
  value,
  onCommit,
  onReject,
  ariaLabel,
  placeholder,
  multiline = false,
  wrap = false,
  className,
  inputClassName,
  rows = 2,
}: {
  value: string;
  onCommit: (next: string) => void;
  onReject?: () => void;
  ariaLabel: string;
  placeholder?: string;
  multiline?: boolean;
  wrap?: boolean;
  className?: string;
  inputClassName?: string;
  rows?: number;
}) {
  const [draft, setDraft] = React.useState(value);
  const [editing, setEditing] = React.useState(false);
  const cancelRef = React.useRef(false);

  const commit = () => {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    setEditing(false);
    const next = draft.trim();
    if (next === value) {
      setDraft(value);
      return;
    }
    if (!next) {
      setDraft(value);
      onReject?.();
      return;
    }
    onCommit(next);
  };

  const fieldClassName = cn(
    "w-full rounded-[5px] border border-transparent bg-transparent px-1 py-0.5 text-inherit",
    "transition-[background-color,border-color,box-shadow] duration-150",
    "hover:border-line hover:bg-surface/70 focus:border-line focus:bg-surface focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
    inputClassName,
  );

  const shared = {
    "aria-label": ariaLabel,
    value: editing ? draft : value,
    placeholder,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditing(true);
      setDraft(event.currentTarget.value);
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current = true;
        setDraft(value);
        setEditing(false);
        event.currentTarget.blur();
      }
      if (event.key === "Enter" && !multiline) {
        if (!draft.trim()) {
          event.preventDefault();
          onReject?.();
          return;
        }
        event.preventDefault();
        event.currentTarget.blur();
      }
      if (event.key === "Enter" && multiline && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    className: fieldClassName,
  };

  return (
    <div className={cn("min-w-0", className)}>
      {multiline || wrap ? (
        <textarea
          {...shared}
          rows={multiline ? rows : 1}
          className={cn(
            fieldClassName,
            "resize-none leading-5",
            !multiline && "field-sizing-content min-h-5 overflow-hidden",
          )}
        />
      ) : (
        <input {...shared} type="text" />
      )}
    </div>
  );
}
