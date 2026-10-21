"use client";

import { toast } from "sonner";
import type { ProcessMap } from "@/domain/types";
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

export function DeleteMapDialog({
  map,
  open,
  onOpenChange,
  onDeleted,
}: {
  map: ProcessMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const deleteMap = useWorkspace((state) => state.deleteMap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>Delete this map?</DialogTitle>
        <DialogDescription>
          “{map.title}” will be removed from this browser. The action is undoable with the undo
          control until you reload the page.
        </DialogDescription>
        <DialogActions>
          <DialogClose asChild>
            <Button>Keep map</Button>
          </DialogClose>
          <Button
            className="border-accent bg-accent-soft text-accent-strong hover:border-accent hover:bg-accent/15"
            onClick={() => {
              deleteMap(map.id);
              onOpenChange(false);
              toast("Map deleted.");
              onDeleted?.();
            }}
          >
            Delete map
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
