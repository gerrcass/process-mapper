"use client";

import * as React from "react";

export function useCommitField({
  value,
  onCommit,
  onReject,
  required = false,
  label = "This field",
  stopEscapePropagation = false,
}: {
  value: string;
  onCommit: (next: string) => void;
  onReject?: () => void;
  required?: boolean;
  label?: string;
  stopEscapePropagation?: boolean;
}) {
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
      onReject?.();
      return;
    }
    setError(null);
    onCommit(next);
  };

  const begin = (current: string) => {
    setEditing(true);
    setDraft(current);
    setError(null);
  };

  const change = (next: string) => {
    setDraft(next);
    setError(null);
  };

  const cancel = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    event.preventDefault();
    if (stopEscapePropagation) event.stopPropagation();
    cancelRef.current = true;
    setDraft(value);
    setEditing(false);
    setError(null);
    event.currentTarget.blur();
  };

  const keyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    multiline = false,
  ) => {
    if (event.key === "Escape") {
      cancel(event);
      return;
    }
    if (event.key === "Enter" && !multiline) {
      if (!draft.trim() && required) {
        event.preventDefault();
        setError(`${label} cannot be empty.`);
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
  };

  return {
    displayValue: editing ? draft : value,
    editing,
    error,
    begin,
    change,
    commit,
    keyDown,
  };
}
