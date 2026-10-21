"use client";

import { useEffect } from "react";
import { useWorkspace } from "@/store/workspace";

export function useUndoRedoShortcuts(enabled = true) {
  const undo = useWorkspace((state) => state.undo);
  const redo = useWorkspace((state) => state.redo);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, undo, redo]);
}
