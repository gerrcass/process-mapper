"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { parseMapFile } from "@/domain/import-export";
import { useWorkspace } from "@/store/workspace";
import { Button, type ButtonProps } from "@/components/ui/button";

export function useMapFileImport(onImported?: (mapId: string) => void) {
  const importDocument = useWorkspace((state) => state.importDocument);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const result = parseMapFile(text);
      if (!result.ok || !result.map) {
        toast(result.error ?? "Could not import this file.");
        return;
      }
      const importedId = importDocument(result.map);
      if (!importedId) {
        toast("Could not add the imported map to this workspace.");
        return;
      }
      const imported = useWorkspace
        .getState()
        .maps.find((candidate) => candidate.id === importedId);
      toast(`Imported “${imported?.title ?? result.map.title}”.`);
      onImported?.(importedId);
    } catch {
      toast("Could not read this file. Export a map from Process Atlas and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="application/json,.json"
      className="hidden"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        void handleFile(event.target.files?.[0]);
      }}
    />
  );

  return { input, inputRef, busy, handleFile };
}

export function ImportMapControl({
  onImported,
  label = "Import",
  variant = "secondary",
  size = "md",
}: {
  onImported?: (mapId: string) => void;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const { input, inputRef, busy } = useMapFileImport(onImported);

  return (
    <>
      {input}
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label="Import a map from a JSON file"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </>
  );
}
