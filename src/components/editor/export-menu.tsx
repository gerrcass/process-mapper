"use client";

import { useRouter } from "next/navigation";
import { Download, FileJson, Image as ImageIcon, Printer, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ProcessMap } from "@/domain/types";
import { jsonFileName, serializeMap } from "@/domain/import-export";
import { FLOW_PNG_EXPORT_EVENT, FLOW_PNG_PENDING_KEY } from "@/lib/export-flow-image";
import { downloadText } from "@/lib/download";
import { mapHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMapFileImport } from "@/components/import-map-control";

export function ExportMenu({ map, view }: { map: ProcessMap; view: "sipoc" | "flow" }) {
  const router = useRouter();
  const { input, inputRef } = useMapFileImport((mapId) => {
    router.push(mapHref(mapId));
  });

  const exportJson = () => {
    downloadText(jsonFileName(map), serializeMap(map));
    toast("Map JSON exported.");
  };

  const exportPng = () => {
    if (view === "flow") {
      window.dispatchEvent(new Event(FLOW_PNG_EXPORT_EVENT));
      return;
    }
    try {
      window.sessionStorage.setItem(FLOW_PNG_PENDING_KEY, map.id);
    } catch {
      // Storage can be blocked; the flow still opens and can be exported from there.
    }
    router.push(mapHref(map.id, { view: "flow" }));
  };

  const print = () => {
    if (view === "flow") {
      router.push(mapHref(map.id));
      window.setTimeout(() => window.print(), 700);
      return;
    }
    window.print();
  };

  return (
    <>
      {input}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" aria-label="Export or import map data">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuItem onSelect={exportJson}>
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            Map JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportPng}>
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Flow PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={print}>
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print SIPOC
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Import JSON map
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
