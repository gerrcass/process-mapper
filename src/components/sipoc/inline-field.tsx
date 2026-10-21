"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { useCommitField } from "@/lib/use-commit-field";

export function InlineField({
  value,
  onCommit,
  onReject,
  ariaLabel,
  placeholder,
  multiline = false,
  wrap = false,
  required = false,
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
  required?: boolean;
  className?: string;
  inputClassName?: string;
  rows?: number;
}) {
  const field = useCommitField({
    value,
    onCommit,
    onReject,
    required,
    label: ariaLabel,
  });

  const fieldClassName = cn(
    "w-full rounded-[5px] border border-transparent bg-transparent px-1 py-0.5 text-inherit",
    "transition-[background-color,border-color,box-shadow] duration-150",
    "hover:border-line hover:bg-surface/70 focus:border-line focus:bg-surface focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
    inputClassName,
  );

  const shared = {
    "aria-label": ariaLabel,
    value: field.displayValue,
    placeholder,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.begin(event.currentTarget.value),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.change(event.target.value),
    onBlur: field.commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      field.keyDown(event, multiline),
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
