"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function InspectorField({
  label,
  value,
  onCommit,
  placeholder,
  multiline = false,
  rows = 3,
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  const id = React.useId();
  const [draft, setDraft] = React.useState(value);
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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
      setError(null);
      return;
    }
    if (!next && required) {
      setDraft(value);
      setError(`${label} cannot be empty.`);
      return;
    }
    setError(null);
    onCommit(next);
  };

  const fieldClassName = cn(
    "w-full rounded-control border bg-surface px-2.5 text-[12.5px] text-ink",
    "transition-colors duration-150 hover:border-line-strong focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
    error ? "border-accent" : "border-line",
  );

  const shared = {
    id,
    value: editing ? draft : value,
    placeholder,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditing(true);
      setDraft(event.currentTarget.value);
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      setError(null);
    },
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancelRef.current = true;
        setDraft(value);
        setEditing(false);
        setError(null);
        event.currentTarget.blur();
      }
      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        if (!draft.trim() && required) {
          setError(`${label} cannot be empty.`);
          return;
        }
        event.currentTarget.blur();
      }
      if (event.key === "Enter" && multiline && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    "aria-invalid": Boolean(error),
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-medium text-ink-soft">
          {label}
        </label>
        {hint ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          className={cn(fieldClassName, "resize-y py-2 leading-5")}
        />
      ) : (
        <input {...shared} type="text" className={cn(fieldClassName, "h-9")} />
      )}
      {error ? (
        <p role="alert" className="mt-1 text-[10.5px] text-accent-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}
