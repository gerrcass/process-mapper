"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
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

export function ResetDemoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resetDemo = useWorkspace((state) => state.resetDemo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-card border border-line bg-surface text-ink-soft">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </span>
        <DialogTitle>Reset the demo workspace?</DialogTitle>
        <DialogDescription>
          This replaces every map in this browser with the two seeded maps. Maps you created or
          edited will be removed. Export anything you want to keep first.
        </DialogDescription>
        <DialogActions>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button
            variant="primary"
            onClick={() => {
              resetDemo();
              onOpenChange(false);
              toast("Demo workspace restored.");
            }}
          >
            Reset demo
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
