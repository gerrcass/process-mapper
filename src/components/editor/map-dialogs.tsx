"use client";

import * as React from "react";
import { toast } from "sonner";
import type { MapStatus, ProcessMap } from "@/domain/types";
import { MAP_STATUSES, STATUS_LABELS } from "@/domain/types";
import { useWorkspace } from "@/store/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError, FieldLabel, Input, Textarea } from "@/components/ui/input";

export function MapDetailsDialog({
  map,
  open,
  onOpenChange,
}: {
  map: ProcessMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateDetails = useWorkspace((state) => state.updateDetails);
  const [title, setTitle] = React.useState(map.title);
  const [description, setDescription] = React.useState(map.description);
  const [status, setStatus] = React.useState<MapStatus>(map.status);
  const [error, setError] = React.useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("A map title is required.");
      return;
    }
    updateDetails(map.id, { title, description, status });
    toast("Map details saved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Map details</DialogTitle>
        <DialogDescription>
          The title and purpose appear on the dashboard. Status marks where this map sits in the
          workshop.
        </DialogDescription>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <FieldLabel htmlFor="map-title">Title</FieldLabel>
            <Input
              id="map-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            <FieldError>{error}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="map-description" hint="One or two sentences">
              Purpose
            </FieldLabel>
            <Textarea
              id="map-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this process is for, who it serves, and where it starts."
            />
          </div>
          <div>
            <FieldLabel htmlFor="map-status">Status</FieldLabel>
            <select
              id="map-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as MapStatus)}
              className="h-10 w-full rounded-control border border-line bg-surface px-3 text-[14px] text-ink focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              {MAP_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <DialogActions>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary">
              Save details
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
