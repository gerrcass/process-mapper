"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useCommitField } from "@/lib/use-commit-field";

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
  const field = useCommitField({
    value,
    onCommit,
    required,
    label,
    stopEscapePropagation: true,
  });

  const fieldClassName = cn(
    "w-full rounded-control border bg-surface px-2.5 text-[12.5px] text-ink",
    "transition-colors duration-150 hover:border-line-strong focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
    field.error ? "border-accent" : "border-line",
  );

  const shared = {
    id,
    value: field.displayValue,
    placeholder,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.begin(event.currentTarget.value),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.change(event.target.value),
    onBlur: field.commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.keyDown(event, multiline),
    "aria-invalid": Boolean(field.error),
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
      {field.error ? (
        <p role="alert" className="mt-1 text-[10.5px] text-accent-strong">
          {field.error}
        </p>
      ) : null}
    </div>
  );
}
