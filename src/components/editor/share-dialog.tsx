"use client";

import * as React from "react";
import { Copy, ExternalLink, Info, Share2 } from "lucide-react";
import type { ProcessMap } from "@/domain/types";
import { buildShareLink, encodeSharePayload } from "@/domain/share-link";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ShareDialog({
  map,
  open,
  onOpenChange,
}: {
  map: ProcessMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [link, setLink] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState("");

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      // Reset for the next open; the fresh link is built after the dialog opens.
      setLink(null);
      setCopyStatus("");
    }
  };

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void encodeSharePayload(map).then((payload) => {
      if (cancelled) return;
      setLink(buildShareLink(payload, window.location));
    });
    return () => {
      cancelled = true;
    };
  }, [open, map]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copied.");
    } catch {
      setCopyStatus("Could not copy the link. Select the text and copy it manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-card border border-line bg-surface text-ink-soft">
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <DialogTitle className="mt-4">Share this map as a link</DialogTitle>
        <DialogDescription>
          The link opens a read-only snapshot of this process map. Send it to anyone who should read
          it.
        </DialogDescription>

        <div className="mt-6">
          <label htmlFor="share-link" className="sr-only">
            Share link
          </label>
          <input
            id="share-link"
            readOnly
            value={link ?? ""}
            placeholder="Building the link…"
            onFocus={(event) => event.currentTarget.select()}
            className="h-9 w-full rounded-control border border-line bg-paper-raised px-3 font-mono text-[11.5px] text-ink-soft placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          />
        </div>

        <p className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This link is a snapshot: it never updates, and anyone with the link can read the map.
        </p>

        <DialogActions>
          <p role="status" aria-live="polite" className="mr-auto text-[12px] text-muted">
            {copyStatus}
          </p>
          <Button asChild variant="secondary">
            <a href={link ?? undefined} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open preview
            </a>
          </Button>
          <Button variant="primary" onClick={() => void copyLink()} disabled={!link}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy link
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
