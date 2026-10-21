"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useWorkspace } from "@/store/workspace";

export function WorkspaceGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const hydrated = useWorkspace((state) => state.hydrated);

  useEffect(() => {
    if (!useWorkspace.persist.hasHydrated()) {
      void useWorkspace.persist.rehydrate();
    }
  }, []);

  if (!hydrated) return fallback;
  return (
    <>
      <StorageBanner />
      {children}
    </>
  );
}

export function StorageBanner() {
  const storageError = useWorkspace((state) => state.storageError);
  const clearStorageError = useWorkspace((state) => state.clearStorageError);
  if (!storageError) return null;

  return (
    <div
      className="storage-banner no-print border-b border-warning/30 bg-warning-soft px-4 py-2.5 text-[12.5px] text-ink-soft"
      role="alert"
    >
      <div className="mx-auto flex max-w-[1180px] items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="max-w-[90ch] leading-5">{storageError}</p>
        </div>
        <button
          type="button"
          onClick={clearStorageError}
          className="rounded-[6px] p-1 text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Dismiss storage notice"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
